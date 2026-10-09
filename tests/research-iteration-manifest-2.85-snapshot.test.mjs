import test from "node:test";
import assert from "node:assert/strict";
import { validateResearchIterationManifest285Snapshot } from "../scripts/validate-research-iteration-manifest-2.85-snapshot.mjs";

test("2.85 records the uninspected zebrafish supplement without admitting source objects or geometry", async () => {
  const receipt = await validateResearchIterationManifest285Snapshot();
  assert.equal(receipt.version, "2.85.0-research.1");
  assert.equal(receipt.inputCount, 17);
  assert.equal(receipt.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.84.0");
  assert.equal(receipt.sourceCount, 31);
  assert.equal(receipt.sourceProfileCount, 387);
  assert.equal(receipt.researchUpgradeCount, 239);
  assert.equal(receipt.workbookRetrieved, false);
  assert.equal(receipt.worksheetsInspected, false);
  assert.equal(receipt.geometryAdmitted, 0);
  assert.equal(receipt.mouseDenominatorDelta, 0);
});
