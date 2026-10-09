import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest288Snapshot } from "../scripts/validate-research-iteration-manifest-2.88-snapshot.mjs";

test("2.88 seals the exact Koh code deposit audit without admitting its missing inputs", async () => {
  const receipt = await validateResearchIterationManifest288Snapshot();
  assert.equal(receipt.version, "2.88.0-research.1");
  assert.equal(receipt.inputCount, 21);
  assert.equal(receipt.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.87.0");
  assert.equal(receipt.sourceCount, 31);
  assert.equal(receipt.sourceProfileCount, 387);
  assert.equal(receipt.researchUpgradeCount, 242);
  assert.equal(receipt.completedUpgradeCount, 72);
  assert.equal(receipt.versionDoi, "10.5281/zenodo.17475613");
  assert.equal(receipt.sourceCodeFileCount, 2);
  assert.equal(receipt.geometryAdmitted, 0);
  assert.equal(receipt.mouseDenominatorDelta, 0);
});
