import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest245Snapshot } from "../scripts/validate-research-iteration-manifest-2.45-snapshot.mjs";

test("sealed 2.45 remains byte-identical as the project advances", async () => {
  const receipt = await validateResearchIterationManifest245Snapshot();
  assert.equal(receipt.releaseId, "ohri-mouse-interneuron-research-iteration-2.45.0");
  assert.equal(receipt.inputCount, 314);
});

test("recomputed hashes cannot authorize mutations of the sealed 2.45 snapshot", async () => {
  const { manifest } = await validateResearchIterationManifest245Snapshot();
  manifest.exactReferences.superClemDorsalSynapse1SerialStack245.admittedProjectGeometryCount = 1;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  await assert.rejects(validateResearchIterationManifest245Snapshot(manifest), /content receipt changed/);
});
