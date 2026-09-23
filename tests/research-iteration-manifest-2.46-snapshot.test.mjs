import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest246Snapshot } from "../scripts/validate-research-iteration-manifest-2.46-snapshot.mjs";

test("sealed 2.46 remains byte-identical while 2.47 advances", async () => {
  const receipt = await validateResearchIterationManifest246Snapshot();
  assert.equal(receipt.releaseId, "ohri-mouse-interneuron-research-iteration-2.46.0");
  assert.equal(receipt.inputCount, 327);
});

test("recomputed hashes cannot authorize mutations of the sealed 2.46 snapshot", async () => {
  const { manifest } = await validateResearchIterationManifest246Snapshot();
  manifest.exactReferences.davisIcrSameCellFigure246.admittedProjectGeometryCount = 1;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  await assert.rejects(validateResearchIterationManifest246Snapshot(manifest), /content receipt changed/);
});
