import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest290Snapshot } from "../scripts/validate-research-iteration-manifest-2.90-snapshot.mjs";

test("2.90 seals the single-record NMO 45718 DAT↔SWC crosswalk without widening biological claims", async () => {
  const receipt = await validateResearchIterationManifest290Snapshot();
  assert.equal(receipt.version, "2.90.0-research.1");
  assert.equal(receipt.inputCount, 31);
  assert.equal(receipt.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.89.0");
  assert.equal(receipt.sourceCount, 31);
  assert.equal(receipt.sourceProfileCount, 387);
  assert.equal(receipt.researchUpgradeCount, 243);
  assert.equal(receipt.completedUpgradeCount, 73);
  assert.equal(receipt.recordId, "NeuroMorpho:45718");
  assert.equal(receipt.mappedSomaContours, 7);
  assert.equal(receipt.mappedContourVertices, 252);
  assert.equal(receipt.standardizedSwcSegments, 5635);
  assert.ok(receipt.primaryHeldOutMaximumMicrometre < 0.006);
  assert.ok(receipt.sensitivityHeldOutMaximumMicrometre < 0.01);
  assert.equal(receipt.surfaces, 0);
  assert.equal(receipt.registrationCount, 0);
});
