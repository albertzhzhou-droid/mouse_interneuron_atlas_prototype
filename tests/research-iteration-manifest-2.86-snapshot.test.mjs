import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest286Snapshot } from "../scripts/validate-research-iteration-manifest-2.86-snapshot.mjs";

test("2.86 seals active-record detail de-duplication without admitting geometry or identity joins", async () => {
  const receipt = await validateResearchIterationManifest286Snapshot();
  assert.equal(receipt.version, "2.86.0-research.1");
  assert.equal(receipt.inputCount, 20);
  assert.equal(receipt.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.85.0");
  assert.equal(receipt.sourceCount, 31);
  assert.equal(receipt.sourceProfileCount, 387);
  assert.equal(receipt.researchUpgradeCount, 240);
  assert.equal(receipt.exactExplorerRecordCount, 641);
  assert.equal(receipt.repeatedFourSlotRecordCountBefore, 165);
  assert.equal(receipt.repeatedFourSlotRecordCountAfter, 0);
  assert.equal(receipt.admittedGeometryDelta, 0);
});
