#!/usr/bin/env python3
"""Prepare I62 recipe or capture a read-only pre-apply baseline after accepted I61.

No apply, root mutation, builder, server, browser or network operation is implemented.
--intake is parent-run only after the real accepted I61 checkpoint exists.
"""
import argparse
from datetime import datetime, timezone
import io
import json
import os
from pathlib import Path
import stat
import zipfile
from source_epoch_guard import pin, only_pin, strict_json, epoch, exact_read

HERE = Path(__file__).resolve().parent
ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
MANIFEST = 'data/research-iteration-manifest-2.91.json'
RUNTIME = 'data/research-renderer-runtime-inputs-2.91.json'
BUILDER = 'tools/build_research_iteration_manifest_2_91.mjs'
TIMELINE = 'docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_62_SOURCE_INFORMATION_NAVIGATION.md'
CONFIG_PIN = {'bytes': 59089, 'sha256': '7ef9ce244d6e3e24377853a787791545913def499e83f62f95ccab18c1318a10'}

def relative(value):
    assert isinstance(value, str) and value
    p = Path(value)
    assert not p.is_absolute() and '..' not in p.parts and '\\' not in value
    assert p.as_posix() == value and value not in {'.', '..'}
    return p

def safe_source(value):
    p = ROOT / relative(value)
    assert p.resolve(strict=True).is_relative_to(ROOT.resolve(strict=True))
    return p

def indexed(rows, expected_count=None):
    assert isinstance(rows, list)
    result = {}
    for row in rows:
        relative(row['path'])
        assert row['path'] not in result, 'Duplicate physical input/member path'
        assert isinstance(row['bytes'], int) and not isinstance(row['bytes'], bool) and row['bytes'] >= 0
        assert isinstance(row['sha256'], str) and len(row['sha256']) == 64
        assert all(c in '0123456789abcdef' for c in row['sha256'])
        result[row['path']] = row
    if expected_count is not None:
        assert len(result) == expected_count
    return result

def check_absent(paths):
    for name in paths:
        relative(name)
        assert not os.path.lexists(ROOT / name), f'Expected physical absence: {name}'
        assert (ROOT / name).parent.resolve(strict=True).is_relative_to(ROOT.resolve(strict=True))

def create_output(value):
    dest = Path(value)
    assert dest.is_absolute() and not os.path.lexists(dest)
    parent = dest.parent.resolve(strict=True)
    assert parent.is_relative_to(Path('/private/tmp').resolve(strict=True))
    assert '..' not in dest.parts
    dest.mkdir()
    assert dest.resolve(strict=True).is_relative_to(Path('/private/tmp').resolve(strict=True))
    return dest

def write_owned(dest, name, body):
    p = dest / relative(name)
    assert p.parent.resolve(strict=True) == dest.resolve(strict=True)
    with p.open('xb') as f:
        f.write(body)
    return {'path': str(p), **pin(body)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    phase = parser.add_mutually_exclusive_group(required=True)
    phase.add_argument('--prepare', action='store_true')
    phase.add_argument('--intake', action='store_true')
    parser.add_argument('--accepted-checkpoint')
    parser.add_argument('--accepted-archive')
    parser.add_argument('--output-dir')
    args = parser.parse_args()
    assert HERE.is_relative_to(Path('/private/tmp').resolve(strict=True))
    observed, failures = {}, []
    actual_config, config_body = exact_read(HERE / 'I62_PENDING_ACCEPTED_I61_RECIPE_CONFIG.json', observed, failures, True)
    assert actual_config == CONFIG_PIN
    config = strict_json(config_body)
    assert config['noPreparationPinIsAnAcceptedI61FinalBaseline'] is True
    targets = {r['path']: r for r in config['candidateTargets']}
    assert len(targets) == len(config['candidateTargets']) == 4
    assert [r['path'] for r in config['candidateTargets'] if r['before'] is not None] == ['app/ResearchSourceRegistry.tsx']
    additions = config['canonicalAdditions']
    assert len(set(additions)) == len(additions) == 4 and additions[-1] == TIMELINE
    assert 'package.json' not in targets and 'package.json' not in config['rootMutableExtras']
    for name, target in targets.items():
        actual, _ = exact_read(Path(target['proposalPath']), observed, failures)
        assert actual == target['after'], f'Candidate afterimage changed: {name}'
    candidate_patch, _ = exact_read(Path(config['candidatePatch']['path']), observed, failures)
    assert candidate_patch == only_pin(config['candidatePatch'])
    prepared = {
        'status': 'PREPARED_I62_REAL_INTAKE_RECIPE_ACCEPTED_I61_PENDING_NOT_EXECUTED',
        'generatedAtUtc': datetime.now(timezone.utc).isoformat(), 'baselineInputs': None,
        'expectedBaselineCanonicalInputs': 2601, 'expectedCanonicalAfterI62': 2605,
        'acceptedI61Members': None, 'acceptedCheckpointBound': False,
        'acceptedI61MemberCountPolicy': 'Only actual checkpoint members determine the count; no estimate.',
        'candidateTargets': config['candidateTargets'], 'canonicalAdditions': additions,
        'rootMutableExtras': config['rootMutableExtras'], 'packageOwned': False,
        'runtimePolicy': 'Whole byte and ordered198 membership unchanged; I62 changes no package or private producer.',
        'positionsPolicy': '40 build inputs and23 separate source inputs unchanged.',
        'privateScopes': 8, 'preparedScientificExpected': config['scientificRegistrySummaryExpected'],
        'finalBaselinePolicy': 'Plan/Goal/timeline/current manifest/runtime and all2601 pins bind only in future --intake after actual acceptedI61; current prep does not bind their final epoch.',
        'intakeInterface': 'python3 capture_i62_real_intake.py --intake --accepted-checkpoint <rootQA61 accepted JSON> --accepted-archive <rootQA61 exact ZIP> --output-dir <new physical /private/tmp directory>',
        'intakeThenParentApply': 'Helper captures preimages and actual source baseline only. Parent applies unchanged four-path patch, adds exactly four bare CORE lines including timeline, updates its own docs/manifest, and performs native8 separately.',
        'rootWrites': 0, 'stageWrites': 0, 'browser': 0, 'network': 0, 'sourceParsers': 0,
        'fullCurrentSourceReplay': False, 'intakeExecuted': False, 'applyImplemented': False,
    }
    if args.prepare:
        assert args.accepted_checkpoint is None and args.accepted_archive is None and args.output_dir is None
        for p, value in observed.items():
            assert epoch(p.stat()) == value
        print(json.dumps(prepared, ensure_ascii=False, indent=2))
        return

    # No accepted I61 file/count/final doc baseline was captured during prepare.
    assert args.accepted_checkpoint and args.accepted_archive and args.output_dir
    checkpoint_path = Path(args.accepted_checkpoint)
    archive_path = Path(args.accepted_archive)
    accepted_dir = (ROOT / 'docs/qa/2026-10-05-implementation-61').resolve(strict=True)
    assert checkpoint_path.resolve(strict=True).is_relative_to(accepted_dir)
    assert archive_path.resolve(strict=True).is_relative_to(accepted_dir)
    checkpoint_pin, checkpoint_body = exact_read(checkpoint_path, observed, failures, True)
    checkpoint = strict_json(checkpoint_body)
    assert checkpoint['status'] == 'PASS_ACCEPTED_I61_CHECKPOINT'
    assert checkpoint['fullGoalComplete'] is False
    members = indexed(checkpoint['members'])
    assert members, 'Actual accepted I61 member count must be nonzero'
    archive_pin, archive_body = exact_read(archive_path, observed, failures, True)
    assert archive_pin == only_pin(checkpoint['archive'])
    assert archive_path.resolve(strict=True) == safe_source(checkpoint['archive']['path']).resolve(strict=True)
    with zipfile.ZipFile(io.BytesIO(archive_body)) as z:
        assert len(z.infolist()) == len(members)
        assert {i.filename for i in z.infolist()} == set(members)
        for info in z.infolist():
            assert not info.is_dir() and not stat.S_ISLNK(info.external_attr >> 16)
            assert pin(z.read(info.filename)) == only_pin(members[info.filename])
    manifest_pin, manifest_body = exact_read(safe_source(MANIFEST), observed, failures, True)
    assert manifest_pin == only_pin(checkpoint['canonicalEpoch']), 'Current manifest is not actual accepted I61 final canonical epoch'
    manifest = strict_json(manifest_body)
    baseline = indexed(manifest['authoritativeInputs'], 2601)
    assert not set(additions) & set(baseline)
    assert len(set(baseline) | set(additions)) == 2605
    assert manifest['registrySummary'] == config['scientificRegistrySummaryExpected']
    existing_targets = {n for n, t in targets.items() if t['before'] is not None}
    absent = [n for n, t in targets.items() if t['before'] is None] + [TIMELINE]
    check_absent(absent)
    for name in existing_targets:
        assert only_pin(baseline[name]) == targets[name]['before']
    mutable = set(targets) | set(config['rootMutableExtras'])
    protected = [r for n, r in baseline.items() if n not in mutable]
    assert 'package.json' not in mutable
    actual_rows = []
    for name in sorted(baseline):
        actual, _ = exact_read(safe_source(name), observed, failures)
        assert actual == only_pin(baseline[name]), f'Canonical physical pin mismatch: {name}'
        actual_rows.append({'path': name, **actual})
    def body(name):
        actual, payload = exact_read(safe_source(name), observed, failures, True)
        expected = only_pin(baseline[name]) if name in baseline else manifest_pin if name == MANIFEST else None
        assert expected is not None and actual == expected, f'Repeated-read pin mismatch: {name}'
        return payload
    for row in checkpoint['members']:
        if row['path'] in baseline:
            assert only_pin(baseline[row['path']]) == only_pin(row), f'Accepted I61 member drift: {row["path"]}'
        else:
            actual, _ = exact_read(safe_source(row['path']), observed, failures)
            assert actual == only_pin(row), f'Accepted I61 extra member drift: {row["path"]}'
    for target in config['i61MustRemainExact19']:
        assert only_pin(baseline[target['logicalPath']]) == only_pin(target)
    for row in config['layoutPins']:
        assert row['logicalPath'] in members, 'Current upgraded layout must be in actual accepted I61 checkpoint'
        assert only_pin(baseline[row['logicalPath']]) == only_pin(row)
    runtime_body = body(RUNTIME)
    runtime = strict_json(runtime_body)
    runtime_rows = indexed(runtime['authoritativeInputs'], 198)
    assert [r['path'] for r in runtime['authoritativeInputs']] == config['runtimePathsExpected']
    assert not set(runtime_rows) & set(targets)
    assert all(row == baseline[name] for name, row in runtime_rows.items())
    private_union = set()
    for scope in config['privateScopes']:
        assert only_pin(baseline[scope['module']]) == only_pin(scope['producer'])
        assert not set(scope['paths']) & set(targets)
        assert set(scope['paths']) <= set(runtime_rows)
        private_union.update(scope['paths'])
    assert private_union == set(runtime_rows)
    assert len(config['privateScopes']) == 8
    assert len(config['positionsBuildPathsExpected']) == 40
    assert len(config['positionsSourcePinsExpected']) == 23
    for row in config['positionsSourcePinsExpected']:
        assert row == baseline[row['path']]
    registry = strict_json(body('data/research-source-registry-0.1.json'))
    assert registry['sourceCount'] == len(registry['sources']) == 32
    sets = [r for s in registry['sources'] for r in s['recordSets']]
    assert len(sets) == 42
    assert sum(r['childRosterRef']['status'] == 'bundled_exact' for r in sets) == 13
    assert sum(r.get('sourceObjectSetRef', {}).get('status') == 'bundled_exact' for r in sets) == 4
    owner = next(s for s in registry['sources'] if s['id'] == config['sourceInformation']['sourceId'])
    record_set = next(r for r in owner['recordSets'] if r['recordSetId'] == config['sourceInformation']['recordSetId'])
    assert record_set['sourceInformationRef'] == config['sourceInformation']['reference']
    assert record_set['includedRecordCount']['value'] == 1
    assert record_set['unitOfObservation'] == 'source_study_aggregate_information_adapter'
    assert record_set['childRosterRef']['status'] == 'not_applicable_aggregate_summary'
    assert 'sourceObjectSetRef' not in record_set
    assert sum('sourceInformationRef' in r for r in sets) == 1
    assert [u['count'] for u in owner['experimentalUnits']] == [171, 51, 6, 60, 28]
    assert all(p['sourceRecordedPoolDenominatorId'] == record_set['sourceRecordedPoolDenominatorId'] and p['groupCountSum'] == 171 and sum(p['groupCounts']) == 171 for p in record_set['alternativePartitions'])
    assert len(record_set['alternativePartitions']) == 4
    for row in config['sourceInformation']['assets']:
        name = Path(row['path']).relative_to(ROOT).as_posix()
        assert only_pin(baseline[name]) == only_pin(row)
    facts = strict_json(body(record_set['dataPath']))
    assert facts['studyScope']['recordedPool']['value'] == 171
    assert facts['studyScope']['recordedPool']['independentAnimalCount'] is None
    assert facts['studyScope']['recordedPool']['cellToAnimalMapping'] is None
    assert [t['groupCountSum'] for t in facts['tables']] == [171, 171, 171, 171]
    crozat = next(s for s in registry['sources'] if s['id'] == 'SRC-CROZAT-2025')
    assert [u['count'] for u in crozat['experimentalUnits']] == [1, 65, 654]
    readiness = crozat['localWorkbookReadiness']
    assert (readiness['selectedInformationWorkbookFiles'], readiness['allRetainedOriginalWorkbookFiles']) == (25, 26)
    assert readiness['existingExperimentFamilySourceObservationRows'] == 2115
    assert readiness['additionalNaVInhibitionWorksheetMeasurementRows'] == 84
    assert readiness['individualPhysicalCellDenominator'] is None
    assert not any('sourceInformationRef' in r for r in crozat['recordSets'])
    legacy = strict_json(body('data/crozat-experiment-family-observations-0.1.json'))
    assert [legacy['summary'][k] for k in ['adapterTableCount', 'observationRowCount', 'completeWithinTablePairGroupCount']] == [23, 2115, 220]
    preimage_paths = sorted(existing_targets | {n for n in config['rootMutableExtras'] if n != TIMELINE})
    preimages = {name: body(name) for name in preimage_paths}
    assert body(MANIFEST) == manifest_body
    check_absent(absent)
    for source, value in observed.items():
        assert epoch(source.stat()) == value, f'Intake end source epoch drift: {source}'
    # Only actual future --intake creates physical temporary capture outputs.
    dest = create_output(args.output_dir)
    memory_zip = io.BytesIO()
    with zipfile.ZipFile(memory_zip, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name, payload in preimages.items():
            z.writestr(name, payload)
    saved = [write_owned(dest, 'preimages.zip', memory_zip.getvalue()),
             write_owned(dest, 'exact-accepted-i61-checkpoint.json', checkpoint_body),
             write_owned(dest, 'exact-accepted-i61-checkpoint.zip', archive_body)]
    check_absent(absent)
    for source, value in observed.items():
        assert epoch(source.stat()) == value, f'Intake epoch drift during temporary capture: {source}'
    result = {
        'status': 'PASS_I62_READONLY_REAL_PRE_APPLY_INTAKE_WITH_ACCEPTED_I61',
        'generatedAtUtc': datetime.now(timezone.utc).isoformat(), 'baselineInputs': manifest['authoritativeInputs'],
        'actualBeforeCanonicalInputs': actual_rows, 'baselineManifestPin': manifest_pin,
        'acceptedI61Checkpoint': {'path': str(checkpoint_path), **checkpoint_pin},
        'acceptedI61Archive': {'path': str(archive_path), **archive_pin},
        'acceptedI61Members': len(members), 'acceptedI61AllMembersVerified': True,
        'candidateTargets': config['candidateTargets'], 'newPhysicalAbsences': absent,
        'newCanonicalPaths': additions, 'canonicalCountBefore': 2601, 'canonicalCountProjected': 2605,
        'protectedPriorInputs': protected, 'protectedPriorCount': len(protected),
        'allowedMutablePaths': sorted(mutable), 'ownedPackage': False,
        'packageBeforePin': only_pin(baseline['package.json']), 'runtimeBeforePin': pin(runtime_body),
        'runtimePaths': list(runtime_rows), 'runtimeCount': 198, 'runtimeMustRemainWholeByteExactAfterI62': True,
        'privateScopes': config['privateScopes'], 'privateMembershipExpansion': False,
        'positionsBuildPaths': config['positionsBuildPathsExpected'], 'positionsSourcePins': config['positionsSourcePinsExpected'],
        'scientificRegistrySummary': manifest['registrySummary'], 'sourceInformationScope': config['sourceInformation'],
        'preimagePaths': preimage_paths, 'preimagePins': [{'path': n, **pin(b)} for n, b in preimages.items()],
        'capturedArtifacts': saved, 'strictEpochRefusals': failures,
        'endSourceEpochsStable': True, 'sourceEpochs': [{'path': str(p), 'firstSeenEpoch': list(e)} for p, e in observed.items()],
        'rootWrites': 0, 'stageWrites': 0, 'applyExecuted': False, 'browser': 0, 'network': 0,
        'parentNext': 'Apply exact sealed four-path patch only after this PASS; add exactly new3+timeline CORE entries, preserve package/runtime/8private/Positions membership, and run engineering/native8. Final preservation requires a separate later parent readiness.',
    }
    write_owned(dest, 'intake-preservation.json', (json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode())
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
