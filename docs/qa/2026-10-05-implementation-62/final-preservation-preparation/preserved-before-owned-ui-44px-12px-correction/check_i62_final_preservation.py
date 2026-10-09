#!/usr/bin/env python3
"""Readonly I62 final preservation. --final-ready needs explicit parent authorization."""
import argparse
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import zipfile
from source_epoch_guard import pin, only_pin, strict_json, epoch, exact_read

HERE = Path(__file__).resolve().parent
ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
MANIFEST = 'data/research-iteration-manifest-2.91.json'
RUNTIME = 'data/research-renderer-runtime-inputs-2.91.json'
BUILDER = 'tools/build_research_iteration_manifest_2_91.mjs'
CONFIG_PIN = {'bytes': 34583, 'sha256': '72dbd41657cbed719bf17c82c3e5a0ff895e010bf9cfa1543fe7dd2c5ccc9828'}

def safe(value):
    p = Path(value)
    assert isinstance(value, str) and value and not p.is_absolute() and '..' not in p.parts
    assert p.as_posix() == value and '\\' not in value
    result = ROOT / p
    assert result.resolve(strict=True).is_relative_to(ROOT.resolve(strict=True))
    return result

def indexed(rows, count):
    assert len(rows) == count
    result = {}
    for row in rows:
        assert row['path'] not in result
        result[row['path']] = row
    assert len(result) == count
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    phase = parser.add_mutually_exclusive_group(required=True)
    phase.add_argument('--prepare', action='store_true')
    phase.add_argument('--final-ready', action='store_true')
    args = parser.parse_args()
    observed, failures = {}, []
    cp, cb = exact_read(HERE/'I62_PREPARED_REAL_INTAKE_BOUND_CONFIG.json', observed, failures, True)
    assert cp == CONFIG_PIN
    config = strict_json(cb)
    guard_pin, _ = exact_read(HERE/'source_epoch_guard.py', observed, failures)
    assert guard_pin == config['sourceEpochGuardPin']
    copied = {}
    for row in config['boundCopies']:
        copy_path, original_path = Path(row['copyPath']), Path(row['originalPath'])
        copy_pin, payload = exact_read(copy_path, observed, failures, True)
        assert copy_pin == only_pin(row)
        original_pin, _ = exact_read(original_path, observed, failures)
        assert original_pin == only_pin(row)
        copied[copy_path.name] = payload
    intake = strict_json(copied['exact-root-i62-intake.json'])
    applied = strict_json(copied['exact-root-i62-actual-apply.json'])
    assert intake['status'] == 'PASS_I62_READONLY_REAL_PRE_APPLY_INTAKE_WITH_ACCEPTED_I61'
    assert applied['status'] == 'PASS_I62_EXACT4_AFTERIMAGE_APPLY_AND4_CORE_ADMISSION'
    assert applied['actualApplyExitCode'] == 0 and applied['ownedPackage'] is False
    assert applied['scientificAdmissionCount'] == 0 and applied['fullGoalComplete'] is False
    targets = {r['path']: r for r in intake['candidateTargets']}
    assert len(targets) == len(intake['candidateTargets']) == 4
    after = indexed(applied['candidateTargets'], 4)
    # Actual apply rows are deliberately flat {path,bytes,sha256}; do not rewrite them.
    assert set(after) == set(targets)
    for name, row in after.items():
        assert only_pin(row) == targets[name]['after']
        actual, _ = exact_read(safe(name), observed, failures)
        assert actual == only_pin(row), f'I62 afterimage drift: {name}'
    baseline = indexed(intake['baselineInputs'], 2601)
    core = config['requiredCore4']
    assert core == applied['exactCoreAdditions'] == intake['newCanonicalPaths']
    assert len(set(core)) == len(core) == 4 and not set(core) & set(baseline)
    mutable = set(config['allowedMutablePaths'])
    assert 'package.json' not in mutable and config['packageIsOwned'] is False
    protected = [r for n, r in baseline.items() if n not in mutable]
    assert len(protected) == 2596
    expected = set(baseline) | set(core)
    assert len(expected) == 2605
    with zipfile.ZipFile(io.BytesIO(copied['exact-root-i62-preimages.zip'])) as z:
        assert set(z.namelist()) == set(intake['preimagePaths'])
        old_manifest = strict_json(z.read(MANIFEST))
        old_runtime_body = z.read(RUNTIME)
        old_runtime = strict_json(old_runtime_body)
        old_builder = z.read(BUILDER)
        for row in intake['preimagePins']:
            assert pin(z.read(row['path'])) == only_pin(row)
    assert old_manifest['authoritativeInputs'] == intake['baselineInputs']
    checkpoint = strict_json(copied['exact-accepted-i61-checkpoint.json'])
    assert checkpoint['status'] == 'PASS_ACCEPTED_I61_CHECKPOINT'
    assert len({r['path'] for r in checkpoint['members']}) == len(checkpoint['members']) == 83
    assert checkpoint['canonicalEpoch'] == intake['baselineManifestPin']
    assert checkpoint['fullGoalComplete'] is False
    with zipfile.ZipFile(io.BytesIO(copied['exact-accepted-i61-checkpoint.zip'])) as z:
        assert len(z.namelist()) == len(checkpoint['members'])
        for row in checkpoint['members']:
            assert pin(z.read(row['path'])) == only_pin(row)
    accepted_protected = [r for r in checkpoint['members'] if r['path'] not in mutable]
    builder_pin, builder_body = exact_read(safe(BUILDER), observed, failures, True)
    reduced = builder_body
    for name in core:
        line = ('  "' + name + '",\n').encode()
        assert reduced.count(line) == 1
        reduced = reduced.replace(line, b'', 1)
    assert reduced == old_builder, 'Only the four exact CORE lines may change the builder'
    assert len(old_runtime['authoritativeInputs']) == len({r['path'] for r in old_runtime['authoritativeInputs']}) == 198
    assert pin(old_runtime_body) == config['runtimeBeforePin']
    current_runtime_pin, _ = exact_read(safe(RUNTIME), observed, failures)
    assert current_runtime_pin == config['runtimeBeforePin'], 'I62 never repins package/private runtime'
    for source, before in observed.items():
        assert epoch(source.stat()) == before
    result = {
        'status': 'PREPARED_I62_REAL_INTAKE_APPLY_PROTECTION_NOT_FINAL_PASS',
        'generatedAtUtc': datetime.now(timezone.utc).isoformat(), 'phase': 'prepare',
        'counts': {'beforeCanonicalInputs': 2601, 'expectedFinalCanonicalInputs': 2605,
                   'protectedPriorInputs': 2596, 'ownedExactAfterimages': 4, 'newCanonicalPaths': 4,
                   'acceptedI61Members': 83, 'acceptedI61ProtectedMembers': len(accepted_protected),
                   'runtimeInputs': 198, 'privateScopes': 8, 'positionsBuildInputs': 40, 'positionsSourceInputs': 23},
        'protectedPriorInputs': protected, 'candidateExpectedAfter': list(after.values()),
        'requiredCore4': core, 'allowedMutablePaths': sorted(mutable),
        'scientificRegistrySummaryExpected': old_manifest['registrySummary'],
        'acceptedI61MutableIntersection': sorted(r['path'] for r in checkpoint['members'] if r['path'] in mutable),
        'expectedBuilderAfterPin': builder_pin, 'runtimeMustRemainWholeBytePin': config['runtimeBeforePin'],
        'ownedPackage': False, 'sourceInformationScope': config['sourceInformationScope'],
        'interface': {'prepare': 'python3 check_i62_final_preservation.py --prepare',
                      'final': 'python3 check_i62_final_preservation.py --final-ready',
                      'precondition': 'Explicit parent I62 FINAL_READY only after final docs/build/stage/source epoch ready.'},
        'scope': {'rootWrites': 0, 'stageWrites': 0, 'browser': 0, 'network': 0,
                  'privateAuthorityCalls': 0, 'sourceParsers': 0, 'fullCurrentSourceReplay': False,
                  'finalPreservationExecuted': False},
        'limitations': ['Source hashes/counts/navigation metadata never establish new biological identities, independent animals, traces, geometry, internals or REG.',
                        'Preparation and React SSR do not establish native UI/history/focus/download or actual source/render proof.'],
    }
    if args.prepare:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    # The external explicit parent FINAL_READY is required before executing here.
    manifest_pin, manifest_body = exact_read(safe(MANIFEST), observed, failures, True)
    current_manifest = strict_json(manifest_body)
    current = indexed(current_manifest['authoritativeInputs'], 2605)
    assert set(current) == expected
    assert current_manifest['registrySummary'] == old_manifest['registrySummary']
    assert current_manifest['implementationScope'] == old_manifest['implementationScope']
    actual_rows = []
    for name in sorted(expected):
        actual, _ = exact_read(safe(name), observed, failures)
        assert actual == only_pin(current[name]), f'Canonical physical pin mismatch: {name}'
        if name in baseline and name not in mutable:
            assert actual == only_pin(baseline[name]), f'Protected prior source changed: {name}'
        if name in after:
            assert actual == only_pin(after[name]), f'Sealed I62 afterimage changed: {name}'
        actual_rows.append({'path': name, **actual})
    def body(name):
        actual, payload = exact_read(safe(name), observed, failures, True)
        expected_pin = only_pin(current[name]) if name in current else manifest_pin if name == MANIFEST else None
        assert expected_pin is not None and actual == expected_pin, f'Repeated-read canonical pin mismatch: {name}'
        return payload
    assert body(BUILDER) == builder_body
    assert body(RUNTIME) == old_runtime_body
    assert strict_json(body(RUNTIME)) == old_runtime
    assert only_pin(current['package.json']) == only_pin(baseline['package.json'])
    runtime_paths = {r['path'] for r in old_runtime['authoritativeInputs']}
    assert not runtime_paths & set(after)
    for row in old_runtime['authoritativeInputs']:
        assert current[row['path']] == row
    assert len(config['privateScopes']) == 8
    for scope in config['privateScopes']:
        assert only_pin(current[scope['module']]) == only_pin(scope['producer'])
        assert set(scope['paths']) <= runtime_paths and not set(scope['paths']) & set(after)
    assert len(config['positionsBuildPaths']) == 40 and len(config['positionsSourcePins']) == 23
    for row in config['positionsSourcePins']:
        assert current[row['path']] == row
    for row in accepted_protected:
        actual, _ = exact_read(safe(row['path']), observed, failures)
        assert actual == only_pin(row), f'Accepted I61 protected member drift: {row["path"]}'
    registry = strict_json(body('data/research-source-registry-0.1.json'))
    assert len(registry['sources']) == registry['sourceCount'] == 32
    sets = [r for s in registry['sources'] for r in s['recordSets']]
    assert len(sets) == 42
    assert sum(r['childRosterRef']['status'] == 'bundled_exact' for r in sets) == 13
    assert sum(r.get('sourceObjectSetRef', {}).get('status') == 'bundled_exact' for r in sets) == 4
    source = next(s for s in registry['sources'] if s['id'] == config['sourceInformationScope']['sourceId'])
    record_set = next(r for r in source['recordSets'] if r['recordSetId'] == config['sourceInformationScope']['recordSetId'])
    assert record_set['sourceInformationRef'] == config['sourceInformationScope']['reference']
    assert record_set['includedRecordCount']['value'] == 1
    assert record_set['unitOfObservation'] == 'source_study_aggregate_information_adapter'
    assert record_set['childRosterRef']['status'] == 'not_applicable_aggregate_summary'
    assert 'sourceObjectSetRef' not in record_set
    assert [u['count'] for u in source['experimentalUnits']] == [171, 51, 6, 60, 28]
    assert len(record_set['alternativePartitions']) == 4 and all(sum(p['groupCounts']) == p['groupCountSum'] == 171 for p in record_set['alternativePartitions'])
    for asset in config['sourceInformationScope']['assets']:
        name = Path(asset['path']).relative_to(ROOT).as_posix()
        assert only_pin(current[name]) == only_pin(asset)
    facts = strict_json(body(record_set['dataPath']))
    assert facts['studyScope']['recordedPool']['value'] == 171
    assert facts['studyScope']['recordedPool']['independentAnimalCount'] is None and facts['studyScope']['recordedPool']['cellToAnimalMapping'] is None
    assert [t['groupCountSum'] for t in facts['tables']] == [171, 171, 171, 171]
    crozat = next(s for s in registry['sources'] if s['id'] == 'SRC-CROZAT-2025')
    assert not any('sourceInformationRef' in r for r in crozat['recordSets'])
    assert [u['count'] for u in crozat['experimentalUnits']] == [1, 65, 654]
    ready = crozat['localWorkbookReadiness']
    assert (ready['selectedInformationWorkbookFiles'], ready['allRetainedOriginalWorkbookFiles']) == (25, 26)
    assert ready['existingExperimentFamilySourceObservationRows'] == 2115 and ready['additionalNaVInhibitionWorksheetMeasurementRows'] == 84
    assert body(MANIFEST) == manifest_body
    for source_path, before in observed.items():
        assert epoch(source_path.stat()) == before, f'Final source epoch changed: {source_path}'
    result.update(status='PASS_I62_FINAL_LOCAL_SOURCE_PRESERVATION_ONLY', phase='final_ready',
                  actualFinalCanonicalInputs=actual_rows, finalManifestPin=manifest_pin,
                  finalRuntimePin=pin(old_runtime_body), acceptedI61ArchiveRetained=True,
                  acceptedI61ProtectedMembersVerified=len(accepted_protected), sourceEpochStableAtEnd=True,
                  strictEpochRefusals=failures)
    result['scope'].update(fullCurrentSourceReplay=True, finalPreservationExecuted=True)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
