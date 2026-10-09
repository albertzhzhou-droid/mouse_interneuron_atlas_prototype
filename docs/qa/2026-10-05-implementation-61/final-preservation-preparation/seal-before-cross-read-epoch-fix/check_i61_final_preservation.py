#!/usr/bin/env python3
"""I61 readonly source preservation. Final mode requires parent FINAL_READY.

Prepare mode binds the real intake, accepted I60 checkpoint, and exact19 apply.
It does not hash all project sources or claim final preservation. Output is stdout.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import stat
import sys
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
MANIFEST = 'data/research-iteration-manifest-2.91.json'
RUNTIME = 'data/research-renderer-runtime-inputs-2.91.json'
BUILDER = 'tools/build_research_iteration_manifest_2_91.mjs'
CONFIG_PIN = {'bytes': 4573, 'sha256': 'be4e7234fbe9ae3e372f2d31b042d98230d8f2c3a8d45efa7a0a7db9d37dd5b1'}

def pin(body):
    return {'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}

def only_pin(row):
    return {k: row[k] for k in ['bytes', 'sha256']}

def strict_json(body):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            assert key not in result, f'Duplicate JSON key: {key}'
            result[key] = value
        return result
    def refuse(value):
        raise AssertionError(f'Nonfinite JSON literal: {value}')
    def finite_float(value):
        number = float(value)
        assert math.isfinite(number), f'Nonfinite JSON numeric overflow: {value}'
        return number
    return json.loads(body, object_pairs_hook=unique, parse_constant=refuse, parse_float=finite_float)

def safe(relative):
    p = Path(relative)
    assert not p.is_absolute() and '..' not in p.parts
    result = ROOT / p
    assert result.resolve(strict=True).is_relative_to(ROOT.resolve(strict=True))
    return result

def epoch(s):
    return (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns)

class EpochMismatch(Exception):
    pass

def exact_read(path, observed, failures, keep_body=False):
    """4K pread using actual progress; retries only strict epoch mismatch."""
    for attempt in range(1, 4):
        fd = None
        try:
            pb = path.stat()
            fd = os.open(path, os.O_RDONLY)
            a = os.fstat(fd)
            assert stat.S_ISREG(a.st_mode), f'Nonregular source: {path}'
            if epoch(pb) != epoch(a):
                raise EpochMismatch(f'Path/fd epoch mismatch before read: {path}: {epoch(pb)} -> {epoch(a)}')
            digest = hashlib.sha256()
            position, pieces = 0, []
            while position < a.st_size:
                chunk = os.pread(fd, min(4096, a.st_size - position), position)
                assert chunk, f'Unexpected EOF at {position}/{a.st_size}: {path}'
                digest.update(chunk)
                if keep_body:
                    pieces.append(chunk)
                position += len(chunk)
            e = os.fstat(fd)
            pa = path.stat()
            if epoch(a) != epoch(e) or epoch(e) != epoch(pa):
                raise EpochMismatch(f'Source epoch changed: {path}: {epoch(a)} -> {epoch(e)} -> {epoch(pa)}; read {position}')
            assert position == a.st_size
            observed[path] = epoch(pa)
            return {'bytes': position, 'sha256': digest.hexdigest()}, b''.join(pieces) if keep_body else None
        except EpochMismatch as exc:
            row = {'path': str(path), 'attempt': attempt,
                   'timeUtc': datetime.now(timezone.utc).isoformat(), 'failure': str(exc)}
            failures.append(row)
            print(json.dumps({'strictEpochAttemptRefused': row}), file=sys.stderr, flush=True)
            if attempt == 3:
                raise
        finally:
            if fd is not None:
                os.close(fd)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    phase = parser.add_mutually_exclusive_group(required=True)
    phase.add_argument('--prepare', action='store_true')
    phase.add_argument('--final-ready', action='store_true')
    args = parser.parse_args()
    config_body = (HERE / 'I61_PREPARED_REAL_INTAKE_BOUND_INPUTS.json').read_bytes()
    assert pin(config_body) == CONFIG_PIN
    config = strict_json(config_body)
    copied = {}
    for row in config['boundCopies']:
        body = Path(row['copyPath']).read_bytes()
        assert pin(body) == only_pin(row)
        assert pin(Path(row['originalPath']).read_bytes()) == only_pin(row)
        copied[Path(row['copyPath']).name] = body
    intake = strict_json(copied['exact-root-intake-preservation.json'])
    applied = strict_json(copied['exact-root-actual-apply-receipt.json'])
    assert intake['status'] == 'PASS_I61_REAL_PRE_APPLY_INTAKE_WITH_ACCEPTED_I60'
    assert applied['status'] == 'PASS_I61_EXACT19_AFTERIMAGE_APPLY_AND16_CORE_ADMISSION'
    assert applied['actualApplyExitCode'] == 0 and applied['candidateTargets'] == intake['candidateTargets']
    targets = {row['path']: row for row in intake['candidateTargets']}
    assert len(targets) == len(intake['candidateTargets']) == 19
    baseline = {row['path']: row for row in intake['baselineInputs']}
    assert len(baseline) == len(intake['baselineInputs']) == 2585
    core = config['requiredExactCorePaths']
    assert len(set(core)) == len(core) == 16 and core == applied['exactCoreAdditions']
    assert not set(core) & set(baseline)
    timeline = intake['manifestAdmissionPlan']['timeline']['path']
    mutable = set(targets) | set(intake['rootOwnedExtrasAfter19TargetDeduplication']) | {timeline}
    protected = [row for name, row in baseline.items() if name not in mutable]
    assert len(protected) == 2577
    expected_paths = set(baseline) | set(core)
    assert len(expected_paths) == 2601
    with zipfile.ZipFile(HERE / 'exact-root-preimages.zip') as z:
        old_manifest = strict_json(z.read(MANIFEST))
        old_runtime = strict_json(z.read(RUNTIME))
        old_builder = z.read(BUILDER)
        old_registry = strict_json(z.read('data/research-source-registry-0.1.json'))
    assert old_manifest['authoritativeInputs'] == intake['baselineInputs']
    checkpoint = strict_json(copied['exact-accepted-i60-checkpoint.json'])
    assert checkpoint['status'] == 'PASS_ACCEPTED_I60_CHECKPOINT' and len(checkpoint['members']) == 64
    with zipfile.ZipFile(HERE / 'exact-accepted-i60-checkpoint.zip') as z:
        for row in checkpoint['members']:
            assert pin(z.read(row['path'])) == only_pin(row)
    closure = strict_json(copied['exact-i60-private-membership-closure.json'])
    runtime_paths = {row['path'] for row in old_runtime['authoritativeInputs']}
    assert len(runtime_paths) == len(old_runtime['authoritativeInputs']) == 198
    assert runtime_paths & set(targets) == {'package.json'}
    assert closure['privateRuntime']['exactAuthorityUnion'] == sorted(runtime_paths)
    assert len(closure['privateRuntime']['buildConstants']) == 8
    assert len(closure['positions']['declaredBuildPaths']) == 40
    assert len(closure['positions']['sourcePinsFromTransport']) == 23
    assert closure['positions']['originalWorkbookCount'] == 22
    result = {
        'iteration': 'I61', 'status': 'PREPARED_REAL_INTAKE_PROTECTION_TABLE_NOT_FINAL_PASS',
        'generatedAtUtc': datetime.now(timezone.utc).isoformat(), 'phase': 'prepare',
        'interface': {'prepare': 'python3 check_i61_final_preservation.py --prepare',
                      'final': 'python3 check_i61_final_preservation.py --final-ready',
                      'finalPrecondition': 'Explicit parent I61 FINAL_READY is required before final execution.'},
        'counts': {'baselineInputs': 2585, 'expectedCanonicalInputs': 2601,
                   'protectedPriorInputs': 2577, 'ownedExactTargets': 19,
                   'newCanonicalPaths': 16, 'acceptedI60CheckpointMembers': 64,
                   'acceptedI60ProtectedMembers': sum(row['path'] not in mutable for row in checkpoint['members']),
                   'runtimeInputs': 198, 'positionsBuildInputs': 40,
                   'positionsSourceInputs': 23, 'positionsOriginalWorkbooks': 22},
        'protectedInputs': protected, 'candidateExpectedAfter': list(targets.values()),
        'newCanonicalPaths': sorted(core), 'allowedMutablePaths': sorted(mutable),
        'scientificRegistrySummaryExpected': old_manifest['registrySummary'],
        'sourceUnitBoundary': intake['sourceUnitAndPhysicalInputs']['scope'],
        'acceptedCheckpointMutableIntersection': config['acceptedI60MutableIntersection'],
        'runtimePolicy': 'Same198 ordered paths and all fields; only exact package.json row repinned to sealed I61 afterimage.',
        'futureAssertions': ['All2601 current canonical paths/pins match physical bytes and intended membership.',
                             'All2577 prior nonowned pins and19 exact afterimages are preserved.',
                             'Removing only16 exact CORE lines restores original canonical builder bytes.',
                             'Accepted64 checkpoint/archive and all nonowned current members remain exact.',
                             '32sources/42sets/387profiles/83completed/243upgrades remain exact; no admission or whole-Goal promotion.',
                             'Old23/2115/220 and1profile/65firing/654passive remain separate from new84 worksheet rows.',
                             'Runtime198 unchanged membership with package-only repin; all8 private modules and Positions40+23 remain exact.',
                             'Current upgraded layout/CSS and final source epoch retain exact protected bytes.'],
        'scope': {'rootWrites': 0, 'stageWrites': 0, 'browserActions': 0, 'networkCalls': 0,
                  'privateProofCalls': 0, 'fullSourceHashesExecuted': False, 'finalPreservationExecuted': False},
        'limitations': ['Prepare is not final preservation or an actual native UI/download observation.',
                        'Source bytes, schema counts and declared memberships do not establish new cell identity, animals, pairing, geometry, internals or REG.',
                        'I61 package repins prior private build authority; this helper issues no fresh rendered-view token or restored-view proof.'],
    }
    if args.prepare:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    # Parent FINAL_READY is a required external authorization before this branch.
    observed, failures = {}, []
    _, manifest_body = exact_read(safe(MANIFEST), observed, failures, True)
    manifest = strict_json(manifest_body)
    current = {row['path']: row for row in manifest['authoritativeInputs']}
    assert len(current) == len(manifest['authoritativeInputs']) == 2601
    assert set(current) == expected_paths
    assert manifest['registrySummary'] == old_manifest['registrySummary']
    assert manifest['implementationScope'] == old_manifest['implementationScope']
    actual_rows = []
    for name in sorted(expected_paths):
        actual, _ = exact_read(safe(name), observed, failures)
        assert actual == only_pin(current[name]), f'Canonical/physical pin mismatch: {name}'
        if name in baseline and name not in mutable:
            assert actual == only_pin(baseline[name]), f'Protected source changed: {name}'
        if name in targets:
            assert actual == targets[name]['proposedActual'], f'Sealed I61 afterimage changed: {name}'
        actual_rows.append({'path': name, **actual})
    def body(name):
        return exact_read(safe(name), observed, failures, True)[1]
    builder = body(BUILDER)
    assert pin(builder) == only_pin(config['expectedBuilderAfter'])
    reduced = builder
    for name in core:
        line = ('  "' + name + '",\n').encode()
        assert reduced.count(line) == 1
        reduced = reduced.replace(line, b'', 1)
    assert reduced == old_builder
    runtime_body = body(RUNTIME)
    runtime = strict_json(runtime_body)
    assert runtime.keys() == old_runtime.keys()
    assert {k:v for k,v in runtime.items() if k != 'authoritativeInputs'} == {k:v for k,v in old_runtime.items() if k != 'authoritativeInputs'}
    old_rows = old_runtime['authoritativeInputs']
    new_rows = runtime['authoritativeInputs']
    assert [r['path'] for r in new_rows] == [r['path'] for r in old_rows] and len(new_rows) == 198
    for before, after in zip(old_rows, new_rows):
        assert after == current[after['path']]
        if before['path'] == 'package.json':
            assert only_pin(after) == targets['package.json']['proposedActual']
        else:
            assert after == before
    for row in closure['privateRuntime']['buildConstants']:
        assert only_pin(current[row['module']]) == row['modulePin']
        assert set(row['paths']) <= runtime_paths
    for row in closure['positions']['sourcePinsFromTransport']:
        assert row == current[row['path']]
    registry = strict_json(body('data/research-source-registry-0.1.json'))
    assert registry.keys() == old_registry.keys()
    assert {k:v for k,v in registry.items() if k != 'sources'} == {k:v for k,v in old_registry.items() if k != 'sources'}
    assert len(registry['sources']) == registry['sourceCount'] == 32
    assert sum(len(s['recordSets']) for s in registry['sources']) == 42
    source = next(s for s in registry['sources'] if s['id'] == 'SRC-CROZAT-2025')
    old_source = next(s for s in old_registry['sources'] if s['id'] == 'SRC-CROZAT-2025')
    assert [s for s in registry['sources'] if s['id'] != source['id']] == [s for s in old_registry['sources'] if s['id'] != source['id']]
    assert source['recordSets'] == old_source['recordSets']
    assert source['experimentalUnits'] == old_source['experimentalUnits']
    readiness = source['localWorkbookReadiness']
    assert readiness['selectedInformationWorkbookFiles'] == 25
    assert readiness['allRetainedOriginalWorkbookFiles'] == 26
    assert readiness['existingExperimentFamilyWorkbookFiles'] == 23
    assert readiness['additionalNaVInhibitionWorkbookFiles'] == 2
    assert readiness['retainedButUnselectedWorkbookFiles'] == 1
    assert [r['fileId'] for r in readiness['retainedButUnselectedWorkbookPins']] == [56062547]
    assert readiness['existingExperimentFamilySourceObservationRows'] == 2115
    assert readiness['additionalNaVInhibitionWorksheetMeasurementRows'] == 84
    assert readiness['individualPhysicalCellDenominator'] is None
    legacy = strict_json(body('data/crozat-experiment-family-observations-0.1.json'))
    assert legacy['summary']['adapterTableCount'] == 23
    assert legacy['summary']['observationRowCount'] == 2115
    assert legacy['summary']['completeWithinTablePairGroupCount'] == 220
    new = strict_json(body('data/crozat-nav-inhibition-information-0.1.json'))
    assert new['summary']['sourceObservationRowCount'] == 84
    assert new['summary']['densityObservationRows'] == 56 and new['summary']['percentageObservationRows'] == 28
    assert [len(t['observations']) for t in new['tables']] == [56,28]
    raw_rows = [row for t in new['tables'] for row in t['observations']]
    assert len({row['id'] for row in raw_rows}) == 84
    for row in raw_rows:
        assert row['nativeLabelIsPhysicalCellIdentity'] is False
        assert all(row[k] is None for k in ['animalId','perRowAge','perRowSex','sourcePairId','rawTraceId'])
    for name in ['pairedRowCount','animalMappedRowCount','newSourceProfiles','newGeometryObjects','newInternalObjects','registrations']:
        assert new['summary'][name] == 0
    assert new['summary']['depositWideUniqueCellCount'] is None
    for record in config['boundCopies']:
        actual, _ = exact_read(Path(record['originalPath']), observed, failures)
        assert actual == only_pin(record)
    with zipfile.ZipFile(HERE / 'exact-accepted-i60-checkpoint.zip') as z:
        for row in checkpoint['members']:
            assert pin(z.read(row['path'])) == only_pin(row)
            if row['path'] not in mutable:
                actual, _ = exact_read(safe(row['path']), observed, failures)
                assert actual == only_pin(row), f'Accepted I60 protected member changed: {row["path"]}'
    assert body(MANIFEST) == manifest_body, 'Final manifest changed during preservation'
    for p, before in observed.items():
        assert epoch(p.stat()) == before, f'Final source epoch changed: {p}'
    result.update(status='PASS_I61_FINAL_LOCAL_SOURCE_PRESERVATION_ONLY', phase='final_ready',
                  actualFinalCanonicalInputs=actual_rows, finalManifestPin=pin(manifest_body),
                  finalRuntimePin=pin(runtime_body), strictEpochRefusals=failures,
                  acceptedI60CheckpointRetained=True, sourceEpochStableAtEnd=True,
                  protectedInputs=[{'path':r['path'],**only_pin(r),'matched':True} for r in protected])
    result['scope'].update(fullSourceHashesExecuted=True, finalPreservationExecuted=True)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
