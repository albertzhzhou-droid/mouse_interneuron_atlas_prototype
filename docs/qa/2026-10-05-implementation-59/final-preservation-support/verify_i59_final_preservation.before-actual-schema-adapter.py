#!/usr/bin/env python3
"""I59 independent preservation: temp writes only; requires parent's final epoch.

The input schema is bound to the actual I59 intake, not inferred from I58.
The final expectations file is deliberately unready until a FINAL EPOCH notice.
"""
from pathlib import Path
import collections, datetime, hashlib, io, json, os, re, sys, time, zipfile

ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
STAGE = Path('/private/tmp/ohri-i51-verification')
QA_REL = 'docs/qa/2026-10-05-implementation-59'
OUT = Path(__file__).resolve().parent
MANIFEST = 'data/research-iteration-manifest-2.91.json'
RUNTIME = 'data/research-renderer-runtime-inputs-2.91.json'
RECIPE = 'tools/build_research_iteration_manifest_2_91.mjs'
RNA = 'data/cano-chol-rna-counts-0.1.json'
started = time.time()
cache, bodies = {}, {}
stats = {'strategy': 'full_file_os_pread_4096_byte_chunks', 'chunkBytes': 4096,
         'preadCalls': 0, 'bytesRead': 0, 'filesRead': 0}

def read(path, keep=False, fresh=False):
    path = Path(path)
    if not fresh and path in cache and (not keep or path in bodies):
        return cache[path], bodies.get(path)
    fd = os.open(path, os.O_RDONLY)
    h, parts, offset = hashlib.sha256(), [], 0
    try:
        before = os.fstat(fd)
        while True:
            block = os.pread(fd, 4096, offset)
            stats['preadCalls'] += 1
            if not block:
                break
            h.update(block); offset += len(block); stats['bytesRead'] += len(block)
            if keep:
                parts.append(block)
        after = os.fstat(fd)
        assert (before.st_ino, before.st_size, before.st_mtime_ns) == (after.st_ino, after.st_size, after.st_mtime_ns)
        assert offset == after.st_size, ('Incomplete read', str(path))
    finally:
        os.close(fd)
    value = {'bytes': offset, 'sha256': h.hexdigest()}
    cache[path] = value; stats['filesRead'] += 1
    if keep:
        bodies[path] = b''.join(parts)
    return value, bodies.get(path) if keep else None

def actual(rel, keep=False, fresh=False):
    return read(ROOT / rel, keep, fresh) if (ROOT / rel).is_file() else (None, None)

def load(rel):
    return json.loads(actual(rel, True)[1])

def pin(row):
    return {key: row[key] for key in ('bytes', 'sha256')}

def table(rows):
    result = {row['path']: row for row in rows}
    assert len(result) == len(rows), 'Duplicate paths'
    return result

def zipped(rel, expected):
    archive_pin, body = actual(rel, True)
    archive = zipfile.ZipFile(io.BytesIO(body)); names = archive.namelist()
    assert len(names) == len(set(names)) and set(names) == set(expected), ('Unexpected ZIP members', rel)
    rows, result = [], {}
    for name in names:
        assert not name.startswith('/') and '..' not in Path(name).parts
        h, parts, size = hashlib.sha256(), [], 0
        with archive.open(name) as stream:
            while block := stream.read(4096):
                h.update(block); parts.append(block); size += len(block)
        value = {'bytes': size, 'sha256': h.hexdigest()}; result[name] = b''.join(parts)
        rows.append({'path': name, 'expected': pin(expected[name]), 'archivedActual': value, 'exact': value == pin(expected[name])})
    return archive_pin, result, rows

def pointer(value, path):
    for part in path.strip('/').split('/'):
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value

config_pin, config_body = read(OUT / 'I59_FINAL_EPOCH_EXPECTATIONS.json', True)
config = json.loads(config_body)
if config.get('finalEpochReady') is not True:
    raise RuntimeError('Wait for parent FINAL EPOCH READY: no final preservation audit may run during I59 intake/build/native work.')
assert not config['allowedCandidateExceptions'], 'A product exception requires separately reviewed exact replay; do not silently accept one.'
protector_pin, protector_body = read(OUT / 'I59_PRESERVATION_EXPECTED_PROTECTED_INPUTS.json', True)
assert protector_pin == {'bytes': 34638, 'sha256': 'a6ed501ff1569327c61fb219b312c6ab63843e40f10281019d3d21e2fbb4efb3'}
protected = json.loads(protector_body)
intake_pin, intake_body = actual(QA_REL + '/intake-preservation.json', True)
assert intake_pin == pin(protected['intake'])
intake = json.loads(intake_body)
before, owned, targets = table(intake['baselineInputs']), table(intake['preimages']), table(intake['candidateTargets'])
absences = set(intake['newPathAbsence']); timeline = intake['timeline']
expected_targets = {'app/cano-chol-rna-counts.js', 'app/cano-chol-rna-counts.d.ts',
                    'app/CanoCholInRnaCounts.tsx', 'app/CanoCholInRnaPairCounts.tsx',
                    'tests/cano-chol-rna-pair-counts.test.mjs', 'scripts/validate-cano-chol-rna-pair-counts-0.1.mjs', 'package.json'}
assert set(targets) == expected_targets and len(before) == 2577 and len(owned) == 9 and len(absences) == 4
new_expected = set(intake['newCanonicalCandidatePaths']) | {timeline}
assert new_expected == absences and len(new_expected) == 4
assert intake['privateRuntimeMembershipUnchanged'] == 198 and intake['positionsBuildMembershipUnchanged'] == 40
assert set(intake['packageExistingAuthorityScopesOnly']) == {'COMPARATIVE_SWC_VIEW_BUILD', 'INDEPENDENT_OBJECT_VIEW_BUILD', 'RONZANO_SOURCE_VIEW_BUILD'}

summary_path = QA_REL + '/verification-summary.json'
summary_pin, summary_body = actual(summary_path, True)
assert summary_pin == pin(config['verificationSummary']), 'Actual final summary differs from final notice'
summary = json.loads(summary_body)
for assertion in config['nativeSummaryAssertions']:
    assert pointer(summary, assertion['pointer']) == assertion['value'], ('Final summary gate', assertion['pointer'])
engineering = config['engineering']
assert engineering['actualExitCode'] == 0
for assertion in engineering['summaryAssertions']:
    assert pointer(summary, assertion['pointer']) == assertion['value'], ('Engineering summary gate', assertion['pointer'])

epoch_start, manifest_body = actual(MANIFEST, True)
assert epoch_start == pin(config['manifest']), 'Actual manifest differs from parent announced final epoch'
manifest = json.loads(manifest_body); current = table(manifest['authoritativeInputs'])
assert len(current) == config['expectedCurrentCanonical'] == 2581
root_docs = {'docs/UPGRADE_PLAN_2026-09-24.md', 'docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md', timeline}
def classify(rel, state):
    if state == 'unchanged': return 'prior_current_input_byte_preserved'
    if rel in targets: return 'exact_I59_six_core_targets_plus_one_current_package_addon'
    if rel in root_docs: return 'root_owned_bounded_I59_document'
    if rel == RECIPE: return 'exact_four_CORE_admissions_no_other_recipe_delta'
    if rel == RUNTIME: return 'existing_package_pin_regenerated_without_membership_change'
    return 'unclassified_requires_review'

rows = []
for rel in sorted(set(before) | set(current)):
    now, _ = actual(rel)
    state = 'removed' if rel not in current else 'added' if rel not in before else 'unchanged' if now == pin(before[rel]) else 'changed'
    rows.append({'path': rel, 'state': state, 'beforeAuthoritative': pin(before[rel]) if rel in before else None,
                 'currentDeclared': pin(current[rel]) if rel in current else None, 'currentActual': now,
                 'matchesCurrentDeclared': rel in current and now == pin(current[rel]), 'classification': classify(rel, state),
                 'beforePhysicalAbsenceExplicitlyRecorded': rel in absences})
changes = [row for row in rows if row['state'] != 'unchanged']; comparison = dict(collections.Counter(row['state'] for row in rows))
archive_pin, archived, archive_rows = zipped(intake['preimagesArchive']['path'], owned)
candidate_rows = []
for rel, target in targets.items():
    proposal_pin, _ = read(Path(target['proposalRoot']) / rel)
    candidate_rows.append({'path': rel, 'before': target['before'], 'sealedAfter': pin(target['after']),
                           'proposalRoot': target['proposalRoot'], 'proposalActual': proposal_pin, 'rootActual': actual(rel)[0],
                           'rootCanonical': pin(current[rel]) if rel in current else None,
                           'beforeExactZIP': target['before'] is None or pin(target['before']) == pin(owned[rel]),
                           'exact': actual(rel)[0] == proposal_pin == pin(target['after']) == pin(current[rel])})
patch_rows = [{'path': item['path'], 'reported': pin(item), 'actual': read(item['path'])[0],
               'exact': read(item['path'])[0] == pin(item)} for item in intake['patches']]
assert len(patch_rows) == 2
assert {item['sha256'] for item in intake['patches']} == {'a492064899a487c0efed2a6893e3c17e02eb3ea1135fc35819c4d01fe235f4cb', '244bc197fb838d98054b3e0e54901a2f5230d626d10cbdb9a95afc46d3307a2b'}

# Remove only the exact four newly admitted CORE lines; every other recipe byte must match ZIP.
recipe_now = actual(RECIPE, True)[1]; recipe_replay = recipe_now
core_start = recipe_now.index(b'export const CORE_INPUTS_291 = Object.freeze(['); core_end = recipe_now.index(b']);', core_start)
core_lines = recipe_now[core_start:core_end]
recipe_admissions = []
for rel in sorted(new_expected):
    line = ('  "' + rel + '",\n').encode()
    assert recipe_replay.count(line) == core_lines.count(line) == 1, ('Expected sole explicit CORE line', rel)
    recipe_replay = recipe_replay.replace(line, b'')
    recipe_admissions.append(rel)
recipe_exact = recipe_replay == archived[RECIPE]
package_before = json.loads(archived['package.json']); package_now = load('package.json')
package_replay = json.loads(json.dumps(package_now)); added_script = package_replay['scripts'].pop('validate:cano-chol-rna-pairs')
assert added_script == 'node scripts/validate-cano-chol-rna-pair-counts-0.1.mjs'
insert = ' && npm run validate:cano-chol-rna-pairs'
assert package_replay['scripts']['test:research'].count(insert) == 1
package_replay['scripts']['test:research'] = package_replay['scripts']['test:research'].replace(insert, '')
package_semantic_exact = package_replay == package_before

science = [row for row in rows if row['path'].startswith(('data/', 'public/data/')) and row['path'] not in {MANIFEST, RUNTIME}]
layout_rows = [{'path': rel, 'before': pin(before[rel]), 'actual': actual(rel)[0],
                'ownedI59RNAParentSurface': rel == 'app/CanoCholInRnaCounts.tsx',
                'exactExpected': actual(rel)[0] == (pin(targets[rel]['after']) if rel in targets else pin(before[rel]))}
               for rel in protected['layoutPaths']]
private_rows = [{'path': rel, 'before': pin(before[rel]), 'actual': actual(rel)[0],
                 'unchanged': actual(rel)[0] == pin(before[rel])} for rel in protected['privateRendererPaths']]
runtime_before = json.loads(archived[RUNTIME]); runtime_now = load(RUNTIME)
old_runtime, runtime = table(runtime_before['authoritativeInputs']), table(runtime_now['authoritativeInputs'])
runtime_rows = [{'path': rel, 'beforeRuntime': pin(old_runtime[rel]) if rel in old_runtime else None,
                 'currentRuntime': pin(value), 'actual': actual(rel)[0],
                 'exact': actual(rel)[0] == pin(value) == pin(current[rel])} for rel, value in runtime.items()]
runtime_changes = [rel for rel in set(old_runtime) & set(runtime) if pin(old_runtime[rel]) != pin(runtime[rel])]
positions_rows = [{'path': rel, 'before': pin(before[rel]), 'actual': actual(rel)[0], 'currentRuntime': pin(runtime[rel]),
                   'expectedChange': 'package_addon_only' if rel == 'package.json' else 'unchanged',
                   'exact': actual(rel)[0] == pin(runtime[rel]) == (pin(targets['package.json']['after']) if rel == 'package.json' else pin(before[rel]))}
                  for rel in protected['positionsBuildPaths']]
scope_rows = []
for scope in protected['scopeModulesAndPaths']:
    scope_paths = scope['paths']; changed = [rel for rel in scope_paths if pin(before[rel]) != pin(current[rel])]
    scope_rows.append({'export': scope['export'], 'module': scope['module'], 'count': len(scope_paths),
                       'unchangedHelperModule': actual(scope['module'])[0] == pin(before[scope['module']]) == pin(scope['modulePin']),
                       'originalPaths': scope_paths, 'changedInputs': changed,
                       'fingerprintChangeExpected': scope['packageScriptEditRepinsBuild'],
                       'onlyExpectedPackageChange': changed == ['package.json'] if scope['packageScriptEditRepinsBuild'] else not changed,
                       'allScopeCurrentPinsExact': all(actual(rel)[0] == pin(current[rel]) == pin(runtime[rel]) for rel in scope_paths)})
scope_union = set().union(*(set(scope['paths']) for scope in protected['scopeModulesAndPaths']))

# Existing source physical descriptors: no new RDS parser or biological inference.
rna_pin, rna_body = actual(RNA, True); rna = json.loads(rna_body)
source_rows = []
source_descriptors = [{'path': rna['reproduction']['sourcePath'], **pin(rna['source'])}] + rna['reproduction']['inputs'] + rna['chunks']
for item in source_descriptors:
    rel = item['path']; now = actual(rel)[0]
    source_rows.append({'path': rel, 'declared': pin(item), 'before': pin(before[rel]), 'actual': now,
                        'exactUnchanged': now == pin(item) == pin(before[rel])})
source_scope = {'exactDocumentUnchanged': rna_pin == pin(before[RNA]), 'genes': len(rna['genes']),
                'nucleusColumns': len(rna['nuclei']), 'profiles': len(rna['profiles']), 'chunks': len(rna['chunks']),
                'declaredScope': rna['scope'], 'allFullProfileNucleusCountsSumTo923': sum(item['nucleusCount'] for item in rna['profiles']) == len(rna['nuclei']),
                'newRdsSemanticParserRunByThisAudit': False, 'sourceCellIDsSerializedInThisReceipt': False}
registry = load('data/research-source-registry-0.1.json'); upgrades = load('data/research-model-upgrade-registry-0.1.json')
source_counts = {'sources': len(registry['sources']), 'sets': sum(len(source['recordSets']) for source in registry['sources']),
                 'profiles': manifest['registrySummary']['sourceProfileCount'], 'rosters': manifest['registrySummary']['bundledExactCellProfileRosterCount'],
                 'objects': manifest['registrySummary']['bundledExactSourceObjectSetCount'], 'completed': upgrades['summary']['byStatus']['completed'],
                 'roadmap': len(upgrades['upgrades']), 'REG': manifest['implementationScope']['atlasRegistrationCount'],
                 'identities': manifest['implementationScope']['exactCrossSourceIdentityCount'], 'fullGoalComplete': manifest['implementationScope']['fullGoalComplete']}

accepted = intake['acceptedI58Checkpoint']; accepted_pin, accepted_body = actual(accepted['path'], True)
accepted_json = json.loads(accepted_body)
accepted_archive, _, accepted_rows = zipped(accepted['archive']['path'], table(accepted_json['members']))
accepted_baseline = [{'path': item['path'], 'member': pin(item), 'beforeCanonical': pin(before[item['path']]) if item['path'] in before else None,
                      'exactCompletedI58Epoch': item['path'] not in before or pin(item) == pin(before[item['path']]),
                      'notInBaselineDoesNotProveAbsence': item['path'] not in before} for item in accepted_json['members']]
manifest_before = json.loads(archived[MANIFEST]); parent = manifest['parentIterationManifest']; frozen_pin, _ = actual(parent['path'])
stage_manifest_pin, stage_manifest_body = read(STAGE / MANIFEST, True); stage_manifest = json.loads(stage_manifest_body)
stage_rows = [{'path': rel, 'declared': pin(item), 'stageActual': read(STAGE / rel)[0],
               'exact': read(STAGE / rel)[0] == pin(item)} for rel, item in current.items()]
log_path = engineering['log']['path']; assert Path(log_path).parent.as_posix() == QA_REL
log_pin, log_body = actual(log_path, True); full_counts = {}
for key in ('tests', 'pass', 'fail', 'cancelled', 'skipped'):
    matches = re.findall(rf'ℹ {key} (\d+)\b', log_body.decode()); assert matches, ('Missing final full count', key)
    full_counts[key] = int(matches[-1])
native_rows = []
assert config['nativeEvidenceFiles'], 'Actual native evidence receipts must be explicitly bound'
for item in config['nativeEvidenceFiles']:
    assert Path(item['path']).parent.as_posix() == QA_REL
    native_rows.append({'path': item['path'], 'reported': pin(item), 'actual': actual(item['path'])[0],
                        'exact': actual(item['path'])[0] == pin(item), 'nativeExecutionByThisAudit': False})

checks = {
    'all2581CurrentRootCanonicalActualPinsExact': len(current) == 2581 and all(row['matchesCurrentDeclared'] for row in rows if row['state'] != 'removed'),
    'all2577PreviousCanonicalInputsRetainedAndChangesClassified': not any(row['state'] == 'removed' for row in rows) and all(row['classification'] != 'unclassified_requires_review' for row in changes),
    'exactFourNewPhysicalAndCanonicalPaths': set(current) - set(before) == new_expected == absences and all(actual(rel)[0] is not None for rel in absences),
    'allNineZIPPreimagesExact': len(archive_rows) == 9 and all(row['exact'] for row in archive_rows) and archive_pin == pin(intake['preimagesArchive']),
    'exactSevenCandidateAndProposalTargets': len(candidate_rows) == 7 and all(row['exact'] and row['beforeExactZIP'] for row in candidate_rows),
    'bothCoreAndCurrentPackagePatchesExact': all(row['exact'] for row in patch_rows),
    'recipeOnlyFourExactCOREInsertions': recipe_exact and len(recipe_admissions) == 4,
    'packageOnlyAliasAndOnceResearchChainWithAllOtherMetadataPreserved': package_semantic_exact and actual('package.json')[0] == {'bytes': 40345, 'sha256': '208fe6a1e92e9e2af82306d359ea5bb11226d27bcc701743bc8b9c9e9b50e585'},
    'all2012PreviousScientificInputsByteUnchanged': len(science) == 2012 and all(row['state'] == 'unchanged' for row in science),
    'allCurrentMultipageLayoutExceptExactRNAParentSurfacePreserved': all(row['exactExpected'] for row in layout_rows),
    'currentI58READMEAndPriorProductCodeAndTestsBytePreserved': actual('README.md')[0] == pin(before['README.md']) and all(actual(rel)[0] == pin(before[rel]) for rel in ['app/TrevisanV1AgeAtlas.tsx', 'app/ExactSourceAuditWorkbench.tsx', 'app/exact-source-audit-workbench.js', 'app/exact-source-audit-workbench.d.ts', 'app/SourceAuditWorkspaces.tsx', 'tests/trevisan-v1-sample-bookmark.test.mjs', 'tests/trevisan-v1-geo-series-sample-audit.test.mjs', 'tests/rendered-html.test.mjs']),
    'allElevenPrivateRendererModulesByteUnchanged': len(private_rows) == 11 and all(row['unchanged'] for row in private_rows),
    'runtime198MembershipAndAllActualCanonicalPinsExact': len(runtime) == len(old_runtime) == 198 and set(runtime) == set(old_runtime) and all(row['exact'] for row in runtime_rows) and runtime_changes == ['package.json'],
    'Positions40MembershipOnlyExistingPackageFingerprintChanges': len(positions_rows) == 40 and all(row['exact'] for row in positions_rows),
    'allEightLiteralScopeListsAndDeclared198ClosureRetainedWithOnlyThreePackageBuildChanges': len(scope_rows) == 8 and len(scope_union) == protected['literalEightScopeUnionCount'] == 172 and scope_union <= set(runtime) and set(protected['runtimeAuthorityClosurePaths']) == set(runtime) and all(row['unchangedHelperModule'] and row['onlyExpectedPackageChange'] and row['allScopeCurrentPinsExact'] for row in scope_rows) and {row['export'] for row in scope_rows if row['fingerprintChangeExpected']} == set(intake['packageExistingAuthorityScopesOnly']),
    'all130OriginalRNAAndDerivativePhysicalDescriptorPinsUnchanged': len(source_rows) == 130 and all(row['exactUnchanged'] for row in source_rows),
    'existing923Nuclei11Profiles32285Features127ChunksAndScientificScopePreserved': source_scope['exactDocumentUnchanged'] and source_scope['genes'] == 32285 and source_scope['nucleusColumns'] == 923 and source_scope['profiles'] == 11 and source_scope['chunks'] == 127 and source_scope['allFullProfileNucleusCountsSumTo923'] and rna['scope']['rnaAtacPairingVerified'] is False and rna['scope']['samePhysicalCellAcrossSources'] is False and rna['scope']['markerOrDifferentialExpressionClaim'] is False and rna['scope']['geometryClaim'] is False,
    'allSourceAndGoalBoundariesRemainUnpromoted': source_counts == {'sources': 32, 'sets': 42, 'profiles': 387, 'rosters': 13, 'objects': 4, 'completed': 83, 'roadmap': 243, 'REG': 0, 'identities': 0, 'fullGoalComplete': False},
    'acceptedI58Archive51BoundOnlyToCompletedI58Epoch': len(accepted_rows) == 51 and all(row['exact'] for row in accepted_rows) and accepted_pin == pin(accepted) and accepted_archive == pin(accepted['archive']) and accepted_json['canonicalEpoch'] == accepted['canonicalEpoch'] and all(row['exactCompletedI58Epoch'] for row in accepted_baseline),
    'frozen290ParentDescriptorAndActualFilePreserved': parent == manifest_before['parentIterationManifest'] and frozen_pin == {'bytes': parent['bytes'], 'sha256': parent['fileSha256']},
    'allActualStage2581CanonicalPhysicalFilesAndManifestExactRootEpoch': len(stage_rows) == 2581 and all(row['exact'] for row in stage_rows) and stage_manifest_pin == epoch_start and stage_manifest['authoritativeInputs'] == manifest['authoritativeInputs'],
    'successfulFinalFullRunExactLogAndActualCounts': log_pin == pin(engineering['log']) and full_counts == engineering['counts'] and full_counts['tests'] == full_counts['pass'] + full_counts['skipped'] and full_counts['fail'] == full_counts['cancelled'] == 0,
    'actualNativeQAReportedAndByteBoundWithoutIndependentGUIProofMinting': bool(native_rows) and all(row['exact'] for row in native_rows),
}
critical = []
for rel in sorted(set(targets) | root_docs | {MANIFEST, RUNTIME, RECIPE, summary_path, 'README.md', RNA}):
    first = actual(rel)[0]; last = actual(rel, False, True)[0]
    critical.append({'path': rel, 'start': first, 'end': last, 'stable': first == last})
epoch_end = actual(MANIFEST)[0]
checks['criticalRootAndStageManifestEpochStableThroughoutAudit'] = epoch_start == epoch_end and all(row['stable'] for row in critical) and read(STAGE / MANIFEST, False, True)[0] == stage_manifest_pin
result = {'increment': 'I59', 'status': 'PASS' if all(checks.values()) else 'FAIL',
          'generatedAtUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'rootWrites': 0, 'stageWrites': 0,
          'checks': checks, 'readContract': stats, 'elapsedSeconds': time.time() - started,
          'summary': {'beforeCanonical': len(before), 'currentCanonical': len(current), 'comparisonCounts': comparison,
                      'scientificInputsUnchanged': len(science), 'preimages': 9, 'physicalAbsences': 4,
                      'candidateTargets': 7, 'runtime': len(runtime), 'positionsBuild': len(positions_rows),
                      'sourceCounts': source_counts, 'actualFullCounts': full_counts},
          'finalExpectations': {'actual': config_pin, 'value': config}, 'protector': {'actual': protector_pin, 'value': protected},
          'manifestEpoch': {'start': epoch_start, 'end': epoch_end, 'criticalInputs': critical},
          'fullAuthoritativeInputComparison': rows, 'changedOrAddedClassifications': changes,
          'ZIPBeforeBytes': {'actual': archive_pin, 'rows': archive_rows}, 'sevenCandidateTargets': candidate_rows,
          'bothPatches': patch_rows, 'recipeExactFourCOREAdmissions': {'paths': recipe_admissions, 'replayExact': recipe_exact},
          'packageAliasAndChainReplay': {'otherMetadataAndScriptsExactlyRetained': package_semantic_exact},
          'scientificInputs': science, 'newMultipageLayoutPreservation': layout_rows,
          'privateRendererPreservation': private_rows, 'runtimeCurrentPins': runtime_rows,
          'runtimeExistingPinChanges': runtime_changes, 'Positions40BuildPreservation': positions_rows,
          'privateEightScopeFingerprintMigration': scope_rows, 'RNA130PhysicalSourceAndChunkDescriptorPins': source_rows,
          'RNAExistingScientificScope': source_scope,
          'acceptedPriorI58Checkpoint': {'JSONActual': accepted_pin, 'ZIPActual': accepted_archive,
                                        'members': accepted_rows, 'baselineMatches': accepted_baseline, 'comparedToFutureLiveRoot': False},
          'stageCanonicalParity': {'manifestActual': stage_manifest_pin, 'rows': stage_rows,
                                   'operationalStageEntriesReported': config['operationalStageEntryCount'], 'extraStageEntriesPromotedToAuthority': 0},
          'frozen290': {'descriptor': parent, 'actual': frozen_pin, 'fullSnapshotValidators': 'Parent full research suite owns full historical snapshot validators; no absent historical row is invented.'},
          'rawVerificationSummary': summary, 'actualFullLog': {'path': log_path, 'actual': log_pin, 'counts': full_counts},
          'nativeEvidenceByteReceipts': native_rows,
          'limitations': ['This independent audit does not execute GUI/keyboard/export/download or mint private source/render proof.',
                         'Original RDS bytes and existing derivative descriptors are verified, without a new RDS semantic/parser claim.',
                         'Raw>0 and zero partitions remain descriptive per complete original source profile; no marker/DE/correlation/function/animal/ATAC/cross-source inference.',
                         'Original source counts, identity/geometry/REG/M2/M4 gates and full F01–F20/M0–M4/243+21 Goal remain bounded.']}
target = OUT / 'I59_FINAL_PRESERVATION.json'
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'receipt': str(target), 'status': result['status'], 'summary': result['summary'],
                  'failedChecks': [key for key, value in checks.items() if not value], 'epoch': epoch_end,
                  'readContract': stats}, ensure_ascii=False, indent=2))
if not all(checks.values()):
    raise SystemExit(1)
