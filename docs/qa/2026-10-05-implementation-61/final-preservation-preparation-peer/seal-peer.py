import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone
BASE = Path('/private/tmp/ohri-i61-final-preservation-bounded-peer-20261005')
OWNER = Path('/private/tmp/ohri-i61-final-preservation-preparation-20261005')
def pin(path):
    data = path.read_bytes(); return {'path': str(path), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
seal = pin(OWNER / 'I61_REAL_INTAKE_FINAL_PRESERVATION_PREPARATION_SEAL.json')
assert seal['bytes'] == 4757 and seal['sha256'] == 'c8d0ced96276d1c40bd5aec1194b0ebcc39aead9d8c20c4d6ea3e9cff61e6b1f'
helper = pin(OWNER / 'check_i61_final_preservation.py')
assert helper['bytes'] == 17753 and helper['sha256'] == '94cba6b40a7c3ec0993b8f671f1762cff3bfd60f4c13a54f3008a2f9f3fdfcd6'
metadata_path = BASE / 'metadata-peer-c8d0ced96276.json'
metadata = json.loads(metadata_path.read_text())
assert metadata['ownerSeal'] == seal
stdout = (BASE / 'final-17-read-json-guards.stdout.log').read_text()
assert helper['sha256'] in stdout
stderr = (BASE / 'final-17-read-json-guards.stderr.log').read_text()
assert 'Ran 17 tests' in stderr and stderr.rstrip().endswith('OK')
result = {
    'status': 'PASS_INDEPENDENT_BOUNDED_CODE_METADATA_AND_SYNTHETIC_PREPARATION_PEER_NOT_FINAL_PRESERVATION',
    'sealedUTC': datetime.now(timezone.utc).isoformat(), 'ownerFinalSeal': seal, 'ownerFinalHelper': helper,
    'counts': metadata['counts'], 'archived64CheckpointBodiesExact': True, 'actual19AfterimageMetadataBound': True,
    'protectedLayoutInputs': metadata['protectedLayoutInputs'], 'eightPrivateProducerModulesProtected': True,
    'runtime198OnlyOwnedPackagePinMayChange': True, 'positions40Plus23MembershipUnchanged': True,
    'sourceUnitBoundary': metadata['sourceUnitScope'],
    'findingAndRepair': {
        'originalHelper': {'bytes': 16923, 'sha256': 'f184bb0368cc415e89e9c440a77608fa57749f121077a4980bbb456f4d7f47fe'},
        'counterexample': pin(BASE / 'cross-read-counterexample-f184bb0368cc.json'),
        'cause': 'A successful second read overwrote the first verified epoch; a body caller also discarded its returned SHA.',
        'repair': 'Retain the first observed epoch, reject cross-read drift fatally, allow at most3 epoch-only retry attempts solely for unseen paths, and compare every repeated body digest to its canonical pin (manifest to its initial exact pin).',
        'intermediateRepairedEpochRefusal': pin(BASE / 'cross-read-counterexample-793acf1bf196.json'),
        'noRemainingActionableFindingsInDeclaredScope': True,
    },
    'independentSyntheticGuards': {'tests': 17, 'pass': 17, 'fail': 0, 'stdout': pin(BASE / 'final-17-read-json-guards.stdout.log'), 'stderr': pin(BASE / 'final-17-read-json-guards.stderr.log'), 'scope': 'strict duplicate root/nested JSON; nonfinite literals/overflow; stable/short pread actual progress; EOF/IO/SHA no retry; unseen epoch bounded retry; observed path same/different-body replacement and fd/mid-read drift fatal'},
    'support': [pin(BASE / 'check-metadata-only.py'), pin(metadata_path), pin(BASE / 'test-read-json-guards.py'), pin(BASE / 'reproduce-cross-read-epoch.py')],
    'codeReviewLimits': 'Prepare/code/archived metadata only; final helper main was never run, current19 root physical afterimages were not rehashed, and no canonical/source tree was scanned.',
    'rootWrites': 0, 'stageWrites': 0, 'ownerFolderWrites': 0, 'browserOperations': 0, 'serverOperations': 0, 'networkOperations': 0,
    'sourceBytesParsedOrFullHashed': False, 'productProducerOrPrivateProofExecuted': False, 'nativeAcceptanceOrActualExportReplayExecuted': False,
    'finalSourcePreservationExecuted': False, 'finalParentAuthorizationRequired': 'Explicit I61 FINAL_READY before owner final mode; this peer receipt does not authorize or replace final execution.',
}
target = BASE / 'I61_FINAL_PRESERVATION_PREPARATION_BOUNDED_INDEPENDENT_PEER.json'
with target.open('x') as stream: json.dump(result, stream, indent=2); stream.write('\n')
print(json.dumps({'status': result['status'], 'receipt': pin(target)}))
