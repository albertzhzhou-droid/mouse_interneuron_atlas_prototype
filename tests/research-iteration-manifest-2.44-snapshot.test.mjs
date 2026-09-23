import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest244Snapshot } from "../scripts/validate-research-iteration-manifest-2.44-snapshot.mjs";

test("sealed 2.44 remains byte-identical as the project advances", async () => {
  const receipt = await validateResearchIterationManifest244Snapshot();
  assert.equal(receipt.releaseId, "ohri-mouse-interneuron-research-iteration-2.44.0");
  assert.equal(receipt.inputCount, 280);
});

test("recomputed hashes cannot authorize mutations of the sealed 2.44 snapshot", async () => {
  const { manifest } = await validateResearchIterationManifest244Snapshot();
  manifest.exactReferences.spinalVolumeEmReference244.admittedProjectGeometryCount = 1;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  await assert.rejects(validateResearchIterationManifest244Snapshot(manifest), /content receipt changed/);
});

