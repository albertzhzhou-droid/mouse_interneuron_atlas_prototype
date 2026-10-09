import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest269 } from "../scripts/validate-research-iteration-manifest-2.69.mjs";

test("2.69 adds the bounded mouse spinal EM search audit without admitting source objects", async () => {
  const result = await validateResearchIterationManifest269();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.69.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.68.0");
  assert.equal(result.researchUpgradeCount, 227);
  assert.equal(result.displayedUpgradeCount, 39);
  assert.equal(result.audit, "mouse-spinal-em-repository-search-audit-0.1");
  assert.equal(result.eligibleObjectRoutes, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
  assert.equal(result.admittedVoxelVolumes, 0);
  assert.equal(result.admittedSegmentationObjects, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.69 rejects false object admission, universal absence, or altered rollback", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.69.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.boundedMouseSpinalEmRepositorySearch243.admittedVoxelVolumes = 1; },
    (value) => { value.exactReferences.boundedMouseSpinalEmRepositorySearch243.universalAbsenceClaim = true; },
    (value) => { value.exactReferences.boundedMouseSpinalEmRepositorySearch243.admittedObjectCrosswalks = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators269.displayedUpgradeCount = 38; },
    (value) => { value.exactReferences.iteration269Layout.fullProjectCopyCount = 1; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.67.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest269(altered));
  }
});
