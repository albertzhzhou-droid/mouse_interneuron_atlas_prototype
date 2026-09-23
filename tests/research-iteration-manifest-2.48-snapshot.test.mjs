import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_248, validateResearchIterationManifest248Snapshot } from "../scripts/validate-research-iteration-manifest-2.48-snapshot.mjs";

test("sealed 2.48 remains byte-identical above its 2.47 parent", async () => {
  const receipt = await validateResearchIterationManifest248Snapshot();
  assert.equal(receipt.releaseId, "ohri-mouse-interneuron-research-iteration-2.48.0");
  assert.equal(receipt.inputCount, 351);
  assert.equal(receipt.manifest.parentIterationManifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.47.0");
  assert.equal(receipt.manifest.exactReferences.bancV888ComparativeInternalReference248.metadataRowCount, 188162);
  assert.equal(receipt.manifest.exactReferences.bancV888ComparativeInternalReference248.renderedGeometryCount, 0);
  assert.equal(SNAPSHOT_248.bytes, 300125);
});

test("recomputed hashes cannot authorize mutation of the sealed 2.48 snapshot", async () => {
  const { manifest } = await validateResearchIterationManifest248Snapshot();
  manifest.exactReferences.bancV888ComparativeInternalReference248.renderedGeometryCount = 1;
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  await assert.rejects(validateResearchIterationManifest248Snapshot(manifest), /content receipt changed/);
});
