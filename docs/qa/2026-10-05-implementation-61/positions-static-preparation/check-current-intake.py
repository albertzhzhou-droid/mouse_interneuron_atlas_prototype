"""Bounded static metadata check, not full source-byte or native proof replay."""
import hashlib
import json
import zipfile
from pathlib import Path

BASE = Path('/private/tmp/ohri-i61-actual-intake-positions-static-20261005')
ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA61 = ROOT / 'docs/qa/2026-10-05-implementation-61'
OLD = ROOT / 'docs/qa/2026-10-05-implementation-59/captures/actual-positions-01-current-package-normalized.json'

def pin_bytes(data, path):
    return {'path': str(path), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def pin(path):
    return pin_bytes(Path(path).read_bytes(), path)

with zipfile.ZipFile(QA61 / 'preimages.zip') as archive:
    old_runtime_bytes = archive.read('data/research-renderer-runtime-inputs-2.91.json')
    old_package_bytes = archive.read('package.json')
    old_runtime = json.loads(old_runtime_bytes)
current_runtime_bytes = (ROOT / 'data/research-renderer-runtime-inputs-2.91.json').read_bytes()
current_runtime = json.loads(current_runtime_bytes)
current_package = pin(ROOT / 'package.json')
old_package = pin_bytes(old_package_bytes, 'I61_preimages.zip::package.json')
assert old_package['bytes'] == 40345 and old_package['sha256'] == '208fe6a1e92e9e2af82306d359ea5bb11226d27bcc701743bc8b9c9e9b50e585'
assert current_package['bytes'] == 40563 and current_package['sha256'] == 'eb9e4087b417a7b91397902fc02b5ac3d606f464c306e75599a0b82f85449ad1'
old_rows = old_runtime['authoritativeInputs']; rows = current_runtime['authoritativeInputs']
assert len(rows) == len(old_rows) == 198
assert [row['path'] for row in rows] == [row['path'] for row in old_rows]
differences = [{'before': before, 'after': after} for before, after in zip(old_rows, rows) if before != after]
assert len(differences) == 1 and differences[0]['after']['path'] == 'package.json'
assert differences[0]['after'] == {'path': 'package.json', 'bytes': current_package['bytes'], 'sha256': current_package['sha256']}
assert {key: value for key, value in old_runtime.items() if key != 'authoritativeInputs'} == {key: value for key, value in current_runtime.items() if key != 'authoritativeInputs'}
old_proof_bytes = OLD.read_bytes(); old_proof = json.loads(old_proof_bytes)
old_build = old_proof['rendererBuild']; current_build_rows = [next(row for row in rows if row['path'] == saved['path']) for saved in old_build['inputs']]
assert len(current_build_rows) == 40
old_build_differences = [{'before': before, 'after': after} for before, after in zip(old_build['inputs'], current_build_rows) if before != after]
assert len(old_build_differences) == 1 and old_build_differences[0]['after']['path'] == 'package.json'
reference = json.loads((ROOT / 'data/ronzano-premotor-position-reference-0.1.json').read_text())
assert len(reference['sourceFiles']) == 22
assert reference['derivedAsset']['bytes'] == 1274690
assert reference['derivedAsset']['sha256'] == 'abf46460d0e37c2ea82b90f2eaf6531d5df8f44e9dcea8448d43d321835184f3'
descriptors = [{'id': reference['assetId'], 'path': reference['derivedAsset']['browserUrl'], 'bytes': reference['derivedAsset']['bytes'], 'sha256': reference['derivedAsset']['sha256']}]
descriptors += [{'id': row['id'], 'path': row['browserUrl'], 'bytes': row['bytes'], 'sha256': row['sha256']} for row in reference['sourceFiles']]
assert old_proof['sourceVerification']['files'] == descriptors
prior = json.loads(Path('/private/tmp/ohri-i61-parent-addon-independent-review-20261005/I61_PRIVATE_MEMBERSHIP_REVIEW.json').read_text())
private_scopes = []
for scope in prior['scopes']:
    actual = pin(ROOT / scope['module'])
    assert actual['bytes'] == scope['bytes'] and actual['sha256'] == scope['sha256']
    private_scopes.append({'module': scope['module'], 'producer': actual, 'membershipCount': len(scope['paths']), 'membershipReusedOnlyAfterProducerExact': True, 'packageAlreadyMember': 'package.json' in scope['paths'], 'membershipChangeRequired': False})
assert len(private_scopes) == 8
old_layout = json.loads(Path('/private/tmp/ohri-i62-after-i61-rebase-20261005/I62_AFTER_I61_REBASE_SEAL.json').read_text())['layoutPins']
for expected in old_layout:
    assert pin(expected['path']) == expected
result = {
    'status': 'PASS_BOUNDED_CURRENT_I61_INTAKE_METADATA_LAYOUT_NOT_NATIVE_OR_SOURCE_PROOF',
    'package': {'before': old_package, 'after': current_package},
    'compact198': {'before': pin_bytes(old_runtime_bytes, 'I61_preimages.zip::data/research-renderer-runtime-inputs-2.91.json'), 'after': pin_bytes(current_runtime_bytes, ROOT / 'data/research-renderer-runtime-inputs-2.91.json'), 'memberOrderUnchanged': True, 'onlyChangedAuthoritativeRow': differences},
    'oldI59Proof': {'file': pin_bytes(old_proof_bytes, OLD), 'oldBuildCount': 40, 'currentBuildCount': 40, 'onlyChangedBuildRow': old_build_differences, 'staticGateExpected': 'renderer build or scientific scope changed', 'actualRejectionExecuted': False},
    'sourceVerification': {'descriptorCount': 23, 'metadataMatchesOldProof': True, 'currentDescriptorFiles': descriptors, 'derivedAssetBytes': 1274690, 'derivedAssetSha256': reference['derivedAsset']['sha256'], 'actualSourceFilesReadOrHashed': 0, 'freshSourceProofMinted': False},
    'eightPrivateScopes': private_scopes, 'currentLayoutPinsExact': old_layout,
    'hashScope': 'Only package, runtime JSON, old saved proof, existing8 producer modules and7 layout files; no complete canonical/stage/source tree scan and no original XLSX/positions payload read.',
    'rootWrites': 0, 'stageWrites': 0, 'browserOperations': 0, 'serverOperations': 0, 'networkOperations': 0, 'productProducerImportedOrExecuted': False,
}
target = BASE / 'I61_CURRENT_INTAKE_RUNTIME_PRIVATE_LAYOUT_CHECK.json'
with target.open('x') as stream:
    json.dump(result, stream, indent=2); stream.write('\n')
print(json.dumps({'status': result['status'], 'package': current_package, 'runtimeMembers': 198, 'onlyChangedPin': 'package.json', 'positions': '40+23', 'privateScopeMembershipChange': False}))
