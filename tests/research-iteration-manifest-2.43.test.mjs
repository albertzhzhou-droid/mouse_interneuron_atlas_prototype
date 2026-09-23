import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest243Snapshot } from "../scripts/validate-research-iteration-manifest-2.43-snapshot.mjs";

test("sealed 2.43 remains byte-identical while the current iteration advances", async () => {
  const receipt = await validateResearchIterationManifest243Snapshot();
  assert.equal(receipt.releaseId, "ohri-mouse-interneuron-research-iteration-2.43.0");
  assert.equal(receipt.inputCount, 271);
});

test("recomputed hashes cannot authorize mutations of the sealed 2.43 snapshot", async () => {
  const { manifest } = await validateResearchIterationManifest243Snapshot();
  manifest.exactReferences.sourceDetailAndLabels243.generatedIntracellularObjectCount = 1;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  await assert.rejects(validateResearchIterationManifest243Snapshot(manifest), /content receipt changed/);
});
