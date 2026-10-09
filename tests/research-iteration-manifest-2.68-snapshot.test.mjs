import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest268Snapshot } from "../scripts/validate-research-iteration-manifest-2.68-snapshot.mjs";

test("2.68 remains byte-pinned as the immutable parent of 2.69", async () => {
  const result = await validateResearchIterationManifest268Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.68.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.67.0");
  assert.equal(result.inputCount, 564);
  assert.equal(result.xeniumAudit, "UPG-244");
  assert.equal(result.admitted3DCellObjects, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.68 snapshot rejects edited evidence", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.68.json", import.meta.url), "utf8"));
  manifest.exactReferences.bilXeniumSpatialAudit244.admittedThreeDimensionalCellObjects = 1;
  await assert.rejects(validateResearchIterationManifest268Snapshot(manifest));
});
