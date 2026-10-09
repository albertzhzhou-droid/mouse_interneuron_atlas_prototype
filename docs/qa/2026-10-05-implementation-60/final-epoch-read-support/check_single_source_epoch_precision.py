from pathlib import Path
import os, json, hashlib, time, datetime, sys

ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
OUT = Path('/private/tmp/ohri-i60-prewrite-peer-readonly-20261005')
SOURCE = ROOT / 'public/data/pv_independent_morphology_routes_v1/asset-manifest.json'
assert OUT.resolve(strict=True) == OUT and OUT.is_relative_to(Path('/private/tmp'))

def pin(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def fields(s):
    return {'device': s.st_dev, 'inode': s.st_ino, 'size': s.st_size,
            'mtimeNs': s.st_mtime_ns, 'ctimeNs': s.st_ctime_ns,
            'mtimeFloatRepr': repr(s.st_mtime),
            'mtimeFloatScaledInt': int(s.st_mtime * 1e9)}

expected = {'bytes': 589, 'sha256': '2f9ebdb9e23ccf8709700ef6b0c38ccae11e83d79bf2845a22adf4048ccad223'}
manifest = json.loads((ROOT / 'data/research-iteration-manifest-2.91.json').read_bytes())
row = next(r for r in manifest['authoritativeInputs'] if r['path'] == str(SOURCE.relative_to(ROOT)))
assert {k: row[k] for k in expected} == expected
samples = []
for i in range(16):
    pb = os.stat(SOURCE, follow_symlinks=False)
    fd = os.open(SOURCE, os.O_RDONLY)
    try:
        a = os.fstat(fd)
        data = os.pread(fd, 4096, 0)
        eof = os.pread(fd, 4096, len(data))
        e = os.fstat(fd)
    finally:
        os.close(fd)
    pa = os.stat(SOURCE, follow_symlinks=False)
    states = [fields(s) for s in [pb, a, e, pa]]
    assert all(s == states[0] for s in states)
    assert pin(data) == expected and not eof
    samples.append({'sample': i + 1, 'clockNs': time.time_ns(),
                    'pathBefore': states[0], 'fdBefore': states[1],
                    'fdAfter': states[2], 'pathAfter': states[3],
                    'readBytes': len(data), 'eofBytes': len(eof), 'contentPin': pin(data)})

node_path = OUT / 'I60_NODE26_BIGINT_SINGLE_SOURCE_PROBE.json'
node_bytes = node_path.read_bytes()
node = json.loads(node_bytes)
assert node['runtime'] == 'v26.0.0' and len(node['rows']) == 8
for n in node['rows']:
    assert n['readBytes'] == 589 and n['sha256'] == expected['sha256']
    for name in ['pathBefore', 'fdBefore', 'fdAfter', 'pathAfter']:
        assert int(n[name]['inode']) == samples[0]['fdBefore']['inode']
        assert int(n[name]['mtimeNs']) == samples[0]['fdBefore']['mtimeNs']
        assert int(n[name]['ctimeNs']) == samples[0]['fdBefore']['ctimeNs']
        assert int(n[name]['size']) == 589

failure_path = ROOT / 'docs/qa/2026-10-05-implementation-60/prewrite-final-doc-stage-sync.log'
failure = failure_path.read_bytes()
assert b'1791155549207181190' in failure and b'1791155549207181215' in failure
failure_copy = OUT / 'exact-first-prewrite-589-byte-epoch-failure.log'
failure_copy.write_bytes(failure)

receipt = {
    'iteration': 'I60',
    'status': 'PASS_CURRENT_SINGLE_SOURCE_PIN_AND_NS_PRECISION_OBSERVATION_PRIOR_EPOCH_FAILURE_RETAINED',
    'generatedAtUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'sourcePath': str(SOURCE), 'sourceRealpath': str(SOURCE.resolve(strict=True)),
    'expectedCurrentCanonicalPin': expected, 'pythonRuntime': sys.version,
    'pythonRetainedSamples': samples,
    'nodeIndependentBigintProbe': {'path': str(node_path), **pin(node_bytes)},
    'originalFailure': {'sourcePath': str(failure_path), 'exactCopyPath': str(failure_copy),
                        **pin(failure), 'beforeMtimeNs': 1791155549207181190,
                        'afterMtimeNs': 1791155549207181215, 'deltaNs': 25,
                        'inodeBoth': 227647745, 'sizeBoth': 589,
                        'assertionWasNotBypassed': True},
    'precision': {
        'integerNsCurrent': samples[0]['fdBefore']['mtimeNs'],
        'nodeBigintIndependentlyMatchesIntegerNs': True,
        'floatSecondsForBeforeNs': repr(1791155549207181190 / 1e9),
        'floatSecondsForAfterNs': repr(1791155549207181215 / 1e9),
        'bothNsBecomeSameFloatSeconds': 1791155549207181190 / 1e9 == 1791155549207181215 / 1e9,
        'floatScaledNsIsNotOriginalIntegerNs': True,
        'nsGuardMustNotBeRoundedOrRelaxed': True,
    },
    'interpretation': [
        'The recorded failed read observed a 25 ns difference in integer fd mtime at constant inode and size. The strict epoch assertion correctly rejected that attempt.',
        'Current repeated Python stat/fstat/pread and independent Node bigint stat/fstat reads all match the original expected bytes/SHA and the same current integer metadata.',
        'Current stable samples do not prove that the previous read interval was stable. No source-byte mutation, writer identity, filesystem cause, or metadata repair is inferred.',
        'An explicitly bounded retry only for a strict epoch mismatch may acquire a fresh stable epoch. It must preserve exact expected bytes/SHA, strict per-attempt metadata checks, final all-root epoch checks, and all failed-attempt evidence.',
    ],
    'scope': {'sourcePathsRead': 1, 'rootWrites': 0, 'stageWrites': 0,
              'metadataChangesByReviewer': 0, 'broadHashReplay': 0,
              'browserActions': 0, 'networkCalls': 0, 'finalPreservationRun': False},
}
data = json.dumps(receipt, ensure_ascii=False, indent=2).encode() + b'\n'
target = OUT / 'I60_SINGLE_SOURCE_EPOCH_NS_PRECISION_REVIEW.json'
target.write_bytes(data)
print(json.dumps({'path': str(target), **pin(data), 'status': receipt['status'],
                  'currentIntegerMetadata': samples[0]['fdBefore'], 'expectedPin': expected}))
