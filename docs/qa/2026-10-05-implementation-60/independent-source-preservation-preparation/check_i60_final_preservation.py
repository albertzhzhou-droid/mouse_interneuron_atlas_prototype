#!/usr/bin/env python3
"""I60 read-only preservation interface; --prepare is not a final PASS.

Only run --final-ready after parent explicitly announces FINAL_READY.
All output is stdout; this helper never writes root, stage, browser or sources.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
INTAKE_PIN = {'bytes': 535839, 'sha256': 'ef4d4cf544e8de621507b077c9b7ed5c52809c9f67fe197db0e790965c24d2ad'}
INTAKE_REL = 'docs/qa/2026-10-05-implementation-60/intake-preservation.json'
MANIFEST_REL = 'data/research-iteration-manifest-2.91.json'
RUNTIME_REL = 'data/research-renderer-runtime-inputs-2.91.json'


def pin(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def only_pin(row):
    return {key: row[key] for key in ['bytes', 'sha256']}


def safe_path(relative):
    path = Path(relative)
    assert not path.is_absolute() and '..' not in path.parts, f'Unsafe canonical relative path: {relative}'
    return ROOT / path


def load(relative):
    return json.loads(safe_path(relative).read_bytes())


def final_hash(path, observed):
    """Exact source-only 4K positioned hash, with source epoch checks."""
    before = path.stat()
    digest, position = hashlib.sha256(), 0
    with path.open('rb') as source:
        while True:
            source.seek(position)
            chunk = source.read(4096)
            if not chunk:
                break
            digest.update(chunk)
            position += len(chunk)
    after = path.stat()
    a = (before.st_ino, before.st_size, before.st_mtime_ns)
    b = (after.st_ino, after.st_size, after.st_mtime_ns)
    assert a == b and position == after.st_size, f'File changed during read: {path}'
    observed[path] = b
    return {'bytes': position, 'sha256': digest.hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    phase = parser.add_mutually_exclusive_group(required=True)
    phase.add_argument('--prepare', action='store_true', help='Prepare exact protection table only; no all-input final hash run.')
    phase.add_argument('--final-ready', action='store_true', help='Requires prior parent FINAL_READY authorization; verifies final root preservation only.')
    args = parser.parse_args()
    intake_bytes = (HERE / 'exact-root-intake-preservation.json').read_bytes()
    assert pin(intake_bytes) == INTAKE_PIN
    assert pin(safe_path(INTAKE_REL).read_bytes()) == INTAKE_PIN
    intake = json.loads(intake_bytes)
    archive = HERE / 'exact-root-preimages.zip'
    assert pin(archive.read_bytes()) == only_pin(intake['preimagesArchive'])
    assert pin(safe_path(intake['preimagesArchive']['path']).read_bytes()) == only_pin(intake['preimagesArchive'])
    with zipfile.ZipFile(archive) as saved:
        previous_manifest = json.loads(saved.read(MANIFEST_REL))
        previous_runtime_bytes = saved.read(RUNTIME_REL)
        previous_runtime = json.loads(previous_runtime_bytes)
        previous_builder = saved.read('tools/build_research_iteration_manifest_2_91.mjs')
    baseline = {row['path']: row for row in intake['baselineInputs']}
    assert len(baseline) == len(intake['baselineInputs']) == 2581
    assert previous_manifest['authoritativeInputs'] == intake['baselineInputs']
    targets = {item['path']: item for item in intake['candidateTargets']}
    assert len(targets) == 4
    mutable = set(targets) | set(intake['rootOwnedExtras']) | {intake['timeline']}
    changed_existing = sorted(set(baseline) & mutable)
    protected = [row for relative, row in baseline.items() if relative not in mutable]
    additions = set(intake['newCanonicalCandidatePaths']) | {intake['timeline']}
    assert len(additions) == 4 and not additions & set(baseline)
    expected_paths = set(baseline) | additions
    assert len(expected_paths) == 2585
    declared_counts = {'baselineInputs': 2581, 'expectedCanonicalInputs': 2585,
                       'ownedCandidateTargets': 4, 'newCanonicalPaths': 4,
                       'protectedPriorCanonicalInputs': len(protected),
                       'parentOrCandidateMutablePriorCanonicalPaths': changed_existing,
                       'privateRuntimeInputs': 198, 'positionsBuildInputs': 40,
                       'positionsSourceInputs': 23, 'positionsOriginalWorkbooks': 22}
    result = {
        'iteration': 'I60', 'generatedAtUtc': datetime.now(timezone.utc).isoformat(),
        'status': 'PREPARED_REAL_INTAKE_PROTECTION_TABLE_NOT_FINAL_PASS',
        'phase': 'prepare', 'intake': {'path': INTAKE_REL, **INTAKE_PIN},
        'interface': {'prepare': 'python3 check_i60_final_preservation.py --prepare',
                      'final': 'python3 check_i60_final_preservation.py --final-ready',
                      'finalPrecondition': 'Explicit parent FINAL_READY message is required before invoking final mode.'},
        'counts': declared_counts, 'protectedInputs': protected,
        'allowedMutablePaths': sorted(mutable), 'newCanonicalPaths': sorted(additions),
        'candidateExpectedAfter': list(targets.values()),
        'scientificRegistrySummaryExpectedUnchanged': previous_manifest['registrySummary'],
        'scientificBoundaryFromActualIntake': intake['scientificBoundary'],
        'futureFinalAssertions': [
            'All four current candidate files equal exact sealed after bytes.',
            'All protected 2581-baseline members equal exact prior file and canonical pins.',
            'Canonical membership is exactly prior2581 plus three code/test files and one timeline:2585.',
            'Canonical registrySummary is byte-for-value identical to actual before summary.',
            'Only one CORE timeline line is added to the canonical builder; removing it restores exact before bytes.',
            'All current canonical pins equal actual physical source bytes in one stable read epoch.',
            'Compact runtime bytes and all198 path/pin rows equal actual intake before, with no owned target member.',
            'Eight declared renderer scopes and derived Positions40+23 membership equal the separately prepared static closure.',
            'The accepted I59 checkpoint/archive exact pins remain unchanged.',
        ],
        'scope': {'rootWrites': 0, 'stageWrites': 0, 'browserActions': 0,
                  'networkRequests': 0, 'compilationsOrTests': 0,
                  'privateProofProducersOrViewCalls': 0, 'finalPreservationExecuted': False},
        'limitations': ['Prepare mode does not hash all baseline files or claim their final preservation.',
                        'Preservation of hashes and declared memberships does not prove native hydration, exports, performance or private rendered source proof.',
                        'Source-count, profiles, rights, identities, geometry, REG and whole-goal status are not promoted.'],
    }
    if args.prepare:
        print(json.dumps(result, ensure_ascii=False, indent=2) + '\n', end='')
        return

    # This code branch is deliberately not executed before parent FINAL_READY.
    observed = {}
    manifest_bytes = safe_path(MANIFEST_REL).read_bytes()
    manifest = json.loads(manifest_bytes)
    rows = manifest['authoritativeInputs']
    current = {row['path']: row for row in rows}
    assert len(current) == len(rows) == 2585 and set(current) == expected_paths
    assert manifest['registrySummary'] == previous_manifest['registrySummary']
    actual_rows = []
    for relative in sorted(expected_paths):
        actual = final_hash(safe_path(relative), observed)
        assert actual == only_pin(current[relative]), f'Canonical/physical mismatch: {relative}'
        if relative in baseline and relative not in mutable:
            assert actual == only_pin(baseline[relative]), f'Protected original changed: {relative}'
        if relative in targets:
            assert actual == targets[relative]['after'], f'Sealed I60 target changed: {relative}'
        actual_rows.append({'path': relative, **actual})
    builder = safe_path('tools/build_research_iteration_manifest_2_91.mjs').read_bytes()
    timeline_line = ('  "' + intake['timeline'] + '",\n').encode()
    assert builder.count(timeline_line) == 1 and builder.replace(timeline_line, b'', 1) == previous_builder
    runtime_bytes = safe_path(RUNTIME_REL).read_bytes()
    assert runtime_bytes == previous_runtime_bytes
    runtime = json.loads(runtime_bytes)
    assert runtime['authoritativeInputs'] == previous_runtime['authoritativeInputs']
    runtime_paths = {row['path'] for row in runtime['authoritativeInputs']}
    assert len(runtime_paths) == len(runtime['authoritativeInputs']) == 198 and not runtime_paths & set(targets)
    for row in runtime['authoritativeInputs']:
        assert row == current[row['path']], f'Runtime/canonical mismatch: {row["path"]}'
    closure_path = HERE / 'I60_MOUNTED_CLOSURE_STATIC_REVIEW_DIAGNOSTIC.json'
    closure = json.loads(closure_path.read_bytes())
    assert closure['status'] == 'STATIC_SELECTED_ROUTE_CLOSURE_ONLY_NOT_FINAL_PRESERVATION'
    assert closure['intakeBaseline']['sha256'] == INTAKE_PIN['sha256']
    assert len(closure['privateRuntime']['buildConstants']) == 8
    assert closure['privateRuntime']['exactAuthorityUnion'] == sorted(runtime_paths)
    assert closure['positions']['declaredBuildPaths'] == closure['positions']['derivedAfter']
    assert len(closure['positions']['declaredBuildPaths']) == 40
    assert len(closure['positions']['sourcePinsFromTransport']) == 23
    for row in closure['rootPins']:
        # Mutable current manifest/recipe/doc hashes may change during closure preparation;
        # every graph/build module and source pin must remain the prepared exact epoch.
        if row['path'] not in mutable:
            assert final_hash(safe_path(row['path']), observed) == only_pin(row), f'Static closure input changed: {row["path"]}'
    for item in closure['privateRuntime']['buildConstants']:
        assert final_hash(safe_path(item['module']), observed) == item['modulePin']
        assert item['I60OwnedPathIntersection'] == []
        for relative in item['paths']:
            assert relative in runtime_paths
    checkpoint = intake['acceptedI59Checkpoint']
    assert final_hash(safe_path(checkpoint['path']), observed) == only_pin(checkpoint)
    assert final_hash(safe_path(checkpoint['archive']['path']), observed) == only_pin(checkpoint['archive'])
    assert safe_path(MANIFEST_REL).read_bytes() == manifest_bytes, 'Manifest changed during final source epoch'
    for source, epoch in observed.items():
        stat = source.stat()
        assert (stat.st_ino, stat.st_size, stat.st_mtime_ns) == epoch, f'File epoch changed before completion: {source}'
    result.update({'status': 'PASS_I60_FINAL_LOCAL_SOURCE_PRESERVATION_ONLY', 'phase': 'final_ready',
                   'protectedInputs': [{'path': row['path'], **only_pin(row), 'matched': True} for row in protected],
                   'actualFinalCanonicalInputs': actual_rows,
                   'finalManifestPin': pin(manifest_bytes), 'finalRuntimePin': pin(runtime_bytes),
                   'preparedStaticClosurePin': {'path': str(closure_path), **pin(closure_path.read_bytes())},
                   'acceptedI59CheckpointRetained': True,
                   'sourceEpochStableAtEnd': True})
    result['scope']['finalPreservationExecuted'] = True
    print(json.dumps(result, ensure_ascii=False, indent=2) + '\n', end='')


if __name__ == '__main__':
    main()
