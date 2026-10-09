import hashlib
import json
import zipfile
from pathlib import Path
BASE = Path('/private/tmp/ohri-i61-final-preservation-bounded-peer-20261005')
OWNER = Path('/private/tmp/ohri-i61-final-preservation-preparation-20261005')
def pin(path):
    data = path.read_bytes(); return {'path': str(path), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
seal_path = OWNER / 'I61_REAL_INTAKE_FINAL_PRESERVATION_PREPARATION_SEAL.json'
seal = json.loads(seal_path.read_text())
for expected in seal['files']:
    actual = pin(Path(expected['path'])); assert actual == expected
config = json.loads((OWNER / 'I61_PREPARED_REAL_INTAKE_BOUND_INPUTS.json').read_text())
intake = json.loads((OWNER / 'exact-root-intake-preservation.json').read_text())
applied = json.loads((OWNER / 'exact-root-actual-apply-receipt.json').read_text())
prepared = json.loads((OWNER / 'I61_PREPARED_FINAL_SOURCE_PROTECTION_TABLE.json').read_text())
checkpoint = json.loads((OWNER / 'exact-accepted-i60-checkpoint.json').read_text())
closure = json.loads((OWNER / 'exact-i60-private-membership-closure.json').read_text())
baseline = {row['path']: row for row in intake['baselineInputs']}; targets = {row['path']: row for row in intake['candidateTargets']}
core = set(config['requiredExactCorePaths']); mutable = set(targets) | set(intake['rootOwnedExtrasAfter19TargetDeduplication']) | {intake['manifestAdmissionPlan']['timeline']['path']}
assert len(baseline) == 2585 and len(targets) == 19 and len(core) == 16
assert core.isdisjoint(baseline) and len(set(baseline) | core) == 2601
protected = {path for path in baseline if path not in mutable}; assert len(protected) == 2577
assert set(row['path'] for row in prepared['protectedInputs']) == protected
assert applied['actualApplyExitCode'] == 0 and applied['candidateTargets'] == intake['candidateTargets'] and core == set(applied['exactCoreAdditions'])
assert len(checkpoint['members']) == len({row['path'] for row in checkpoint['members']}) == 64
assert len([row for row in checkpoint['members'] if row['path'] not in mutable]) == 58
assert set(row['path'] for row in checkpoint['members'] if row['path'] in mutable) == set(config['acceptedI60MutableIntersection'])
with zipfile.ZipFile(OWNER / 'exact-accepted-i60-checkpoint.zip') as archive:
    for row in checkpoint['members']:
        data = archive.read(row['path']); assert len(data) == row['bytes'] and hashlib.sha256(data).hexdigest() == row['sha256']
with zipfile.ZipFile(OWNER / 'exact-root-preimages.zip') as archive:
    old_manifest = json.loads(archive.read('data/research-iteration-manifest-2.91.json'))
    old_runtime = json.loads(archive.read('data/research-renderer-runtime-inputs-2.91.json'))
assert old_manifest['authoritativeInputs'] == intake['baselineInputs']
runtime = [row['path'] for row in old_runtime['authoritativeInputs']]; assert len(runtime) == 198 and set(runtime) & set(targets) == {'package.json'}
assert closure['privateRuntime']['exactAuthorityUnion'] == sorted(runtime)
assert len(closure['privateRuntime']['buildConstants']) == 8
for producer in closure['privateRuntime']['buildConstants']: assert producer['module'] in protected
assert len(closure['positions']['declaredBuildPaths']) == 40 and len(closure['positions']['sourcePinsFromTransport']) == 23
assert all(row['path'] in protected for row in closure['positions']['sourcePinsFromTransport'])
layout_paths = ['app/layout.tsx', 'app/SiteNavigation.tsx', 'app/site-navigation.ts', 'app/site-navigation.css', 'app/ResearchRoutePage.tsx', 'app/ResearchCollectionPage.tsx', 'app/research-information-layout.css', 'app/research-pages.css', 'app/SourceAuditWorkspaces.tsx']
assert set(layout_paths) <= protected
assert len(prepared['candidateExpectedAfter']) == 19 and prepared['newCanonicalPaths'] == sorted(core)
result = {'status': 'PASS_BOUNDED_ARCHIVED_METADATA_ONLY', 'ownerSeal': pin(seal_path), 'counts': prepared['counts'], 'actual19ApplyMetadataBound': True, 'protectedLayoutInputs': layout_paths, 'accepted64ArchivePinsExact': True, 'checkpointProtectedMembers': 58, 'runtime198TargetIntersection': ['package.json'], 'positions': '40+23', 'all8ProducerModulesProtected': True, 'sourceUnitScope': intake['sourceUnitAndPhysicalInputs']['scope'], 'projectCanonicalOrOriginalSourceFilesRead': 0, 'finalMainExecuted': False, 'actualRootTargetsPhysicalRehashed': False}
target = BASE / ('metadata-peer-' + pin(seal_path)['sha256'][:12] + '.json')
with target.open('x') as stream: json.dump(result, stream, indent=2); stream.write('\n')
print(json.dumps(result))
