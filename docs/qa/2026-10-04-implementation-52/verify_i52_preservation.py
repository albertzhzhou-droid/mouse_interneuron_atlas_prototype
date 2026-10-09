#!/usr/bin/env python3
"""Read-only I52 preservation audit. Outputs are confined to this temp directory."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import os
import re
import subprocess
import time
import zipfile

ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
OUT = Path(__file__).resolve().parent
QA = ROOT / 'docs/qa/2026-10-04-implementation-52'
CHUNK = 4096
stats = {'strategy': 'os.pread_entire_current_file_in_4096_byte_chunks', 'chunkBytes': CHUNK, 'preadCalls': 0, 'bytesRead': 0, 'filesRead': 0}
cache = {}

def read_actual(path):
    path = Path(path)
    if path in cache:
        return cache[path]
    digest = hashlib.sha256()
    fd = os.open(path, os.O_RDONLY)
    try:
        before = os.fstat(fd)
        offset = 0
        while True:
            block = os.pread(fd, CHUNK, offset)
            stats['preadCalls'] += 1
            if not block:
                break
            digest.update(block)
            offset += len(block)
            stats['bytesRead'] += len(block)
        after = os.fstat(fd)
        if (before.st_size, before.st_mtime_ns, before.st_ino) != (after.st_size, after.st_mtime_ns, after.st_ino):
            raise RuntimeError(f'File changed during actual byte replay: {path}')
        if offset != after.st_size:
            raise RuntimeError(f'Incomplete actual byte replay: {path}')
    finally:
        os.close(fd)
    stats['filesRead'] += 1
    result = {'bytes': offset, 'sha256': digest.hexdigest()}
    cache[path] = result
    return result

def receipt_matches(actual, expected):
    return actual is not None and all(actual.get(key) == expected.get(key) for key in ['bytes', 'sha256'])

def actual_for(relative):
    path = ROOT / relative
    return read_actual(path) if path.is_file() else None

def normalized(row):
    return {key: row[key] for key in ['bytes', 'sha256']}

def classify(path):
    if path in {'app/SceneCanvas.tsx', 'app/main-scene-source-view.js', 'app/main-scene-source-camera-fit.js', 'app/main-scene-source-camera-fit.d.ts', 'tests/main-scene-source-camera-fit.test.mjs'}:
        return 'I52_camera_implementation_and_regression'
    if path in {'tools/build_research_iteration_manifest_2_91.mjs', 'tools/build_research_renderer_runtime_inputs.mjs', 'data/research-iteration-manifest-2.91.json', 'data/research-renderer-runtime-inputs-2.91.json'}:
        return 'current_integrated_receipt_recipe_or_generated_receipt'
    if path in {'docs/UPGRADE_PLAN_2026-09-24.md', 'docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md', 'docs/RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_52_MAIN_CAMERA_FIT.md'}:
        return 'I52_documented_scope_and_full_goal_preservation'
    if path in {'tests/research-renderer-runtime-inputs.test.mjs', 'tests/research-visual-target.test.mjs'}:
        return 'I52_or_integrated_runtime_recipe_regression'
    if path in {'tests/rendered-html.test.mjs', 'tests/independent-morphology-discovery.test.mjs', 'tests/neuromorpho-universe-source-strain-facets.test.mjs', 'tests/source-audit-workspaces.test.mjs', 'tests/morphology-source-view.test.mjs', 'tests/native-contour-source-view.test.mjs', 'tests/comparative-swc-png-export.test.mjs', 'tests/janelia-wt-bounded-source-view.test.mjs', 'tests/curator-package.test.mjs', 'scripts/package-curator-review.mjs'}:
        return 'authorized_multipage_integration_test_or_curator_route_migration'
    if path in {'app/globals.css', 'app/research-information-layout.css'}:
        return 'owned_shared_layout_styles_preserved_then_intentionally_updated'
    if path in concurrent_by_path:
        return 'concurrent_interface_change_retained'
    if path in {'app/page.tsx', 'app/ResearchOverview.tsx'}:
        return 'dedicated_home_or_evidence_map_route_integration'
    return 'unclassified_requires_owner_review'

OUT.mkdir(exist_ok=True)
started = time.time()
before_file = QA / 'before-authoritative-inputs.json'
current_file = ROOT / 'data/research-iteration-manifest-2.91.json'
before_doc = json.loads(before_file.read_text())
current_doc = json.loads(current_file.read_text())
before_rows = before_doc['authoritativeInputs']
current_rows = current_doc['authoritativeInputs']
before_by_path = {row['path']: row for row in before_rows}
current_by_path = {row['path']: row for row in current_rows}
if len(before_by_path) != len(before_rows) or len(current_by_path) != len(current_rows):
    raise RuntimeError('Duplicate authoritative input paths are not allowed')
owned_doc = json.loads((QA / 'intake-preservation.json').read_text())
owned_rows = owned_doc['preimages']
owned_by_path = {row['path']: row for row in owned_rows}
concurrent_rows = json.loads((QA / 'concurrent-interface-preservation.json').read_text())
concurrent_by_path = {row['path']: row for row in concurrent_rows}
current_epoch_receipt = read_actual(current_file)

input_rows = []
current_mismatches = []
for path in sorted(set(before_by_path) | set(current_by_path)):
    actual = actual_for(path)
    old = before_by_path.get(path)
    new = current_by_path.get(path)
    change = 'removed_from_current_receipt' if new is None else 'added_to_current_receipt' if old is None else 'unchanged' if receipt_matches(actual, old) else 'changed'
    row = {'path': path, 'before': normalized(old) if old else None, 'currentDeclared': normalized(new) if new else None, 'currentActual': actual, 'change': change,
           'classification': 'unchanged_prior_input_preserved' if change == 'unchanged' else classify(path),
           'currentMatchesDeclaration': receipt_matches(actual, new) if new else None,
           'ownedPreimageAvailable': path in owned_by_path, 'concurrentInterfaceReceiptAvailable': path in concurrent_by_path,
           'addedToReceiptDoesNotProveNewFileCreation': old is None}
    if new and not row['currentMatchesDeclaration']:
        current_mismatches.append(path)
    input_rows.append(row)

zip_path = QA / 'preimages.zip'
zip_rows = []
with zipfile.ZipFile(zip_path) as archive:
    members = archive.namelist()
    if len(members) != len(set(members)) or set(members) != set(owned_by_path):
        raise RuntimeError('Owned preimage ZIP member names differ from exact 29-row preservation inventory')
    for row in owned_rows:
        name = row['path']
        if name.startswith('/') or '..' in Path(name).parts:
            raise RuntimeError('Unsafe ZIP member')
        digest = hashlib.sha256()
        count = 0
        with archive.open(name) as handle:
            while block := handle.read(CHUNK):
                digest.update(block)
                count += len(block)
        zip_actual = {'bytes': count, 'sha256': digest.hexdigest()}
        actual = actual_for(name)
        zip_rows.append({'path': name, 'expectedBefore': normalized(row), 'zipMemberActual': zip_actual,
                         'zipMatchesBefore': receipt_matches(zip_actual, row), 'currentActual': actual,
                         'currentEqualsOwnedBefore': receipt_matches(actual, row),
                         'classification': 'owned_input_unchanged' if receipt_matches(actual, row) else classify(name),
                         'inBeforeAuthoritativeInputTable': name in before_by_path,
                         'ownedBeforeMatchesBeforeInputReceipt': receipt_matches(zip_actual, before_by_path[name]) if name in before_by_path else None})

concurrent_replay = []
for row in concurrent_rows:
    actual = actual_for(row['path'])
    observed = row['observedAtFinalCameraFix']
    before = row.get('earlierIntake')
    concurrent_replay.append({'path': row['path'], 'observedAtFinalCameraFix': normalized(observed),
                              'earlierIntake': normalized(before) if before else None, 'currentActual': actual,
                              'currentMatchesObservedInterface': receipt_matches(actual, observed),
                              'currentMatchesEarlierIntake': receipt_matches(actual, before) if before else None,
                              'preservationScope': row['scope'], 'classification': classify(row['path'])})

frozen_rows = []
for path in sorted((ROOT / 'data').glob('research-iteration-manifest-2.*.json')):
    match = re.fullmatch(r'research-iteration-manifest-2\.(\d+)\.json', path.name)
    if not match or int(match.group(1)) >= 91:
        continue
    relative = path.relative_to(ROOT).as_posix()
    baseline = before_by_path.get(relative)
    actual = read_actual(path)
    frozen_rows.append({'path': relative, 'currentActual': actual, 'beforeInputReceiptAvailable': baseline is not None,
                        'currentMatchesBeforeInputReceipt': receipt_matches(actual, baseline) if baseline else None,
                        'baselineReceipt': normalized(baseline) if baseline else None,
                        'scope': 'byte_exact_I52_before_current_comparison' if baseline else 'no_I52_before_row; existing_immutable_snapshot_validator_receipts_are_the_historical_authority'})

validator_runs = []
for version in ['2.34', '2.90']:
    script = f'scripts/validate-research-iteration-manifest-{version}-snapshot.mjs'
    result = subprocess.run(['node', script], cwd=ROOT, capture_output=True, text=True)
    log_path = OUT / f'frozen-{version}-validator.log'
    log_path.write_text(result.stdout + result.stderr)
    validator_runs.append({'script': script, 'actualSourceRoot': str(ROOT), 'exitCode': result.returncode,
                           'log': log_path.name, 'logReceipt': read_actual(log_path),
                           'scope': 'existing immutable manifest/constants/parent chain/scientific receipt validation; permits documented superseded live application hashes rather than restoring old code'})

full_log = Path('/private/tmp/ohri-i52-full-research-acceptance-final.log')
full_text = full_log.read_text()
test_totals = {}
for name in ['tests', 'pass', 'fail', 'skipped', 'cancelled']:
    values = re.findall(rf'^ℹ {name} (\d+)$', full_text, re.M)
    test_totals[name] = int(values[-1]) if values else None
snapshot_cli_commands = re.findall(r'^> node (scripts/validate-research-iteration-manifest-[^\s]+)', full_text, re.M)
explicit_cli_versions = re.findall(r'^Research iteration (2\.\d+) immutable snapshot valid:', full_text, re.M)
post_css_log = Path('/private/tmp/ohri-i52-post-contrast-focused.log')
post_css_text = post_css_log.read_text()
post_totals = {}
for name in ['tests', 'pass', 'fail', 'skipped', 'cancelled']:
    values = re.findall(rf'^ℹ {name} (\d+)$', post_css_text, re.M)
    post_totals[name] = int(values[-1]) if values else None

# Re-read the epoch marker to catch a parent write during this read-only audit.
cache.pop(current_file, None)
end_epoch_receipt = read_actual(current_file)
epoch_stable = end_epoch_receipt == current_epoch_receipt
changes = [row for row in input_rows if row['change'] != 'unchanged']
owned_changes_outside_authoritative = [row for row in zip_rows if not row['currentEqualsOwnedBefore'] and row['path'] not in set(before_by_path) | set(current_by_path)]
combined_changes = changes + [{**row, 'change': 'changed_owned_path_outside_before_current_authoritative_tables', 'baselineScope': 'owned ZIP preservation preimage'} for row in owned_changes_outside_authoritative]
scientific_paths = [row for row in input_rows if row['path'].startswith(('data/', 'public/data/')) and row['path'] not in {'data/research-renderer-runtime-inputs-2.91.json', 'data/research-iteration-manifest-2.91.json'}]
unclassified = sorted(set(row['path'] for row in changes + zip_rows if row.get('classification') == 'unclassified_requires_owner_review'))
summary = {'beforeInputCount': len(before_rows), 'currentInputCount': len(current_rows),
           'unchangedPriorInputs': sum(row['change'] == 'unchanged' for row in input_rows),
           'changedPriorInputs': sum(row['change'] == 'changed' for row in input_rows),
           'addedToCurrentReceipt': sum(row['change'] == 'added_to_current_receipt' for row in input_rows),
           'ownedChangedPathsOutsideAuthoritativeTables': [row['path'] for row in owned_changes_outside_authoritative],
           'allScopedChangeCount': len(combined_changes),
           'addedScientificInputs': [row['path'] for row in input_rows if row['change'] == 'added_to_current_receipt' and row['path'].startswith(('data/', 'public/data/'))],
           'removedFromCurrentReceipt': sum(row['change'] == 'removed_from_current_receipt' for row in input_rows),
           'currentReceiptByteMismatches': current_mismatches, 'unclassifiedChanges': unclassified,
           'ownedPreimages': len(zip_rows), 'ownedZipMatchesBeforeCount': sum(row['zipMatchesBefore'] for row in zip_rows),
           'ownedCurrentEqualsBeforeCount': sum(row['currentEqualsOwnedBefore'] for row in zip_rows),
           'concurrentInterfaceRows': len(concurrent_replay), 'concurrentInterfaceCurrentMatchesObserved': sum(row['currentMatchesObservedInterface'] for row in concurrent_replay),
           'concurrentInterfaceDrift': [row['path'] for row in concurrent_replay if not row['currentMatchesObservedInterface']],
           'priorScientificInputRows': len(scientific_paths), 'priorScientificInputByteChanges': [row['path'] for row in scientific_paths if row['change'] == 'changed'],
           'frozenFilesHashed': len(frozen_rows), 'frozenFilesWithI52BeforeReceipt': sum(row['beforeInputReceiptAvailable'] for row in frozen_rows),
           'frozen290MatchesI52Before': next(row['currentMatchesBeforeInputReceipt'] for row in frozen_rows if row['path'] == 'data/research-iteration-manifest-2.90.json'),
           'frozen34HasNoInventedI52Baseline': next(not row['beforeInputReceiptAvailable'] for row in frozen_rows if row['path'] == 'data/research-iteration-manifest-2.34.json'),
           'actualRootSnapshotValidatorsPass': all(row['exitCode'] == 0 for row in validator_runs),
           'currentReceiptEpochStableDuringAudit': epoch_stable,
           'authoritativeChangeClassificationCounts': dict(collections.Counter(row['classification'] for row in changes)),
           'allScopedChangeClassificationCounts': dict(collections.Counter(row['classification'] for row in combined_changes)),
           'status': 'passed_with_eight_explicit_concurrent_checkpoint_followups' if len([row for row in concurrent_replay if not row['currentMatchesObservedInterface']]) == 8 else 'passed_with_explicit_concurrent_checkpoint_comparison',
           'fullAcceptanceTotals': test_totals, 'postCSSFocusedTotals': post_totals}
result = {'auditId': 'I52-final-preservation-readonly-4k-pread', 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope': 'Exact before/current bounded authoritative-input and saved-preimage preservation; no whole dirty-worktree or absent-baseline identity claim',
          'sharedRootEdited': False, 'parentStageEdited': False, 'sourceRoot': str(ROOT), 'baselinePath': str(before_file),
          'beforeDocumentReceipt': read_actual(before_file), 'currentManifestReceipt': end_epoch_receipt,
          'preimageZipReceipt': read_actual(zip_path), 'intakePreservationReceipt': read_actual(QA / 'intake-preservation.json'),
          'concurrentInterfaceReceipt': read_actual(QA / 'concurrent-interface-preservation.json'),
          'summary': summary, 'actualByteReplay': stats, 'inputs': input_rows, 'authoritativeInputChanges': changes, 'allChanges': combined_changes,
          'ownedZipReplay': zip_rows, 'concurrentInterfaceReplay': concurrent_replay, 'frozenSnapshotFileReplay': frozen_rows,
          'existingSnapshotValidatorRuns': validator_runs,
          'existingFullAcceptanceEvidence': {'logPath': str(full_log), 'logReceipt': read_actual(full_log), 'reportedTotals': test_totals,
                                             'explicitSnapshotCLIValidationVersions': explicit_cli_versions, 'snapshotCLICommandsReachedInSuccessfulFullRun': snapshot_cli_commands,
                                             'scope': 'Parent-owned complete research run; historical immutable snapshot CLI/tests retain their existing superseded-live-input policies. This audit does not recast all earlier snapshot files as present in the I52 baseline.'},
          'existingPostCSSFocusedEvidence': {'logPath': str(post_css_log), 'logReceipt': read_actual(post_css_log), 'reportedTotals': post_totals,
                                             'scope': 'Parent-owned post-CSS focused run; production build/page verification remain parent-owned.'},
          'elapsedSeconds': time.time() - started,
          'limitations': ['Earlier historical manifest JSON files except 2.90 have no before-authoritative-input row; their actual immutable validator constants/chain are the authority.',
                         'Added-to-receipt paths may predate I52; this audit does not invent file-creation dates or previous hashes.',
                         'I53/I54/I55 temp candidates are outside this I52 current-root receipt.',
                         'Full F01-F20/M0-M4 and243/21 goal remains open; preservation does not establish scientific completion.']}
(OUT / 'I52_FINAL_PRESERVATION_PROPOSED.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(summary, indent=2))
if current_mismatches or unclassified or not epoch_stable or not all(row['zipMatchesBefore'] for row in zip_rows) or not summary['actualRootSnapshotValidatorsPass']:
    raise SystemExit(1)
