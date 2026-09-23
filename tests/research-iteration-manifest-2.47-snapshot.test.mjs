import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_247, validateResearchIterationManifest247Snapshot } from "../scripts/validate-research-iteration-manifest-2.47-snapshot.mjs";

test("sealed 2.47 remains byte-identical while the current release advances", async () => {
  const receipt = await validateResearchIterationManifest247Snapshot();
  assert.equal(receipt.releaseId, "ohri-mouse-interneuron-research-iteration-2.47.0");
  assert.equal(receipt.inputCount, 342);
  assert.equal(receipt.manifest.exactReferences.nativeContourDerivedSomaSurface247.internalStructureObjectCount, 0);
  assert.equal(receipt.manifest.registrySummary.researchUpgradeCount, 202);
  assert.equal(SNAPSHOT_247.bytes, 295242);
});

test("recomputed hashes cannot authorize mutation of the sealed 2.47 snapshot", async () => {
  const { manifest } = await validateResearchIterationManifest247Snapshot();
  manifest.exactReferences.nativeContourDerivedSomaSurface247.internalStructureObjectCount = 1;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  await assert.rejects(validateResearchIterationManifest247Snapshot(manifest), /content receipt changed/);
});
