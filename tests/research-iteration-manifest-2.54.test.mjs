import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_254, validateResearchIterationManifest254Snapshot } from "../scripts/validate-research-iteration-manifest-2.54-snapshot.mjs";

test("2.54 remains sealed byte-for-byte as the NMO 108978 census-child route parent", async () => {
  const { manifest, parentReleaseId } = await validateResearchIterationManifest254Snapshot();
  assert.equal(parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.53.0");
  assert.equal(manifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.54.0");
  assert.equal(manifest.registrySummary.researchUpgradeCount, 208);
  assert.equal(manifest.exactReferences.censusChildMorphologyRoute254.neuronId, 108978);
  assert.equal(manifest.exactReferences.censusChildMorphologyRoute254.activeMainSceneMorphologyCount, 14);
  assert.equal(SNAPSHOT_254.bytes, 339442);
});

test("recomputed hashes cannot mutate the sealed 2.54 route or registration boundary", async () => {
  const { manifest } = await validateResearchIterationManifest254Snapshot();
  const changed = structuredClone(manifest);
  changed.exactReferences.censusChildMorphologyRoute254.crossSourceIdentityCount = 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest254Snapshot(changed), /content receipt changed/);
});
