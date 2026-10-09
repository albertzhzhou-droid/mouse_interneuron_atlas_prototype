import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest287Snapshot } from "../scripts/validate-research-iteration-manifest-2.87-snapshot.mjs";

test("2.87 seals the Koh two-file source audit without admitting geometry or cross-source identity", async () => {
  const receipt = await validateResearchIterationManifest287Snapshot();
  assert.equal(receipt.version, "2.87.0-research.1");
  assert.equal(receipt.inputCount, 18);
  assert.equal(receipt.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.86.0");
  assert.equal(receipt.sourceCount, 31);
  assert.equal(receipt.sourceProfileCount, 387);
  assert.equal(receipt.researchUpgradeCount, 241);
  assert.equal(receipt.completedUpgradeCount, 71);
  assert.equal(receipt.auditedSupplementCount, 2);
  assert.equal(receipt.workbookWorksheetCount, 31);
  assert.equal(receipt.geometryAdmitted, 0);
  assert.equal(receipt.mouseDenominatorDelta, 0);
});
