import assert from 'node:assert/strict';
import test from 'node:test';
import { validateResearchIterationManifest242Snapshot } from '../scripts/validate-research-iteration-manifest-2.42-snapshot.mjs';
import { computeManifestContentSha256 } from '../scripts/build-release-manifest.mjs';
test('sealed 2.42 remains byte-identical while newer live implementation evolves', async () => {
  assert.equal((await validateResearchIterationManifest242Snapshot()).inputCount, 264);
});
test('recomputed hashes cannot authorize mutations of the sealed 2.42 snapshot', async () => {
  const { manifest } = await validateResearchIterationManifest242Snapshot();
  manifest.registrySummary.sourceProfileCount += 1;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  await assert.rejects(validateResearchIterationManifest242Snapshot(manifest), /content receipt changed/);
});
