import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest289Snapshot } from "../scripts/validate-research-iteration-manifest-2.89-snapshot.mjs";

test("2.89 seals the bounded Koh public-route search and leaves upstream archives gated", async () => {
  const receipt = await validateResearchIterationManifest289Snapshot();
  assert.equal(receipt.version, "2.89.0-research.1");
  assert.equal(receipt.inputCount, 25);
  assert.equal(receipt.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.88.0");
  assert.equal(receipt.sourceCount, 31);
  assert.equal(receipt.sourceProfileCount, 387);
  assert.equal(receipt.researchUpgradeCount, 242);
  assert.equal(receipt.completedUpgradeCount, 72);
  assert.equal(receipt.directKohRoutesChecked, 4);
  assert.equal(receipt.upstreamSupplementCandidates, 3);
  assert.equal(receipt.exactRequiredInputsPubliclyVerified, false);
  assert.equal(receipt.followUpResearchUpgradeId, "UPG-250");
  assert.equal(receipt.geometryAdmitted, 0);
});
