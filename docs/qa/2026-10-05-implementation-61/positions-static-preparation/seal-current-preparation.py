import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone
BASE = Path('/private/tmp/ohri-i61-actual-intake-positions-static-20261005')
def pin(path):
    data = path.read_bytes()
    return {'path': str(path), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
metadata = json.loads((BASE / 'I61_CURRENT_INTAKE_RUNTIME_PRIVATE_LAYOUT_CHECK.json').read_text())
ast = json.loads((BASE / 'I61_CURRENT_ACTUAL_POSITIONS_MOUNTED_AST_CHECK.json').read_text())
assert metadata['compact198']['memberOrderUnchanged']
assert ast['buildCount'] == 40 and ast['separateSourceVerificationCount'] == 23 and ast['currentMountedRuntimePathCount'] == 37
result = {'status': 'SEALED_BOUNDED_ACTUAL_I61_STATIC_POSITION_ACCEPTANCE_PREPARATION_NOT_NATIVE', 'sealedUTC': datetime.now(timezone.utc).isoformat(), 'files': [pin(path) for path in sorted(BASE.iterdir()) if path.is_file() and path.name != 'I61_CURRENT_POSITION_ACCEPTANCE_PREPARATION_SEAL.json'], 'currentPackage': metadata['package']['after'], 'changedRuntimePinOnly': 'package.json', 'runtime198MembershipUnchanged': True, 'positions40Plus23MembershipUnchanged': True, 'eightPrivateMembershipsUnchanged': True, 'currentLayoutExact': True, 'oldProofExpectedRefusal': metadata['oldI59Proof'], 'nativeThreeCapturePlanPendingParentExecution': True, 'rootWrites': 0, 'stageWrites': 0, 'sourceByteProofExecuted': False, 'fullCanonicalOrSourceHashScan': False, 'browserOperations': 0, 'serverOperations': 0, 'networkOperations': 0}
target = BASE / 'I61_CURRENT_POSITION_ACCEPTANCE_PREPARATION_SEAL.json'
with target.open('x') as stream: json.dump(result, stream, indent=2); stream.write('\n')
print(json.dumps({'status': result['status'], 'seal': pin(target)}))
