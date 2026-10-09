import test from "node:test";
import assert from "node:assert/strict";
import { validateResearchIterationManifest284Snapshot } from "../scripts/validate-research-iteration-manifest-2.84-snapshot.mjs";

test("2.84 seals its five-source index to the immutable 2.83 parent without admitting new objects", async () => {
  const receipt = await validateResearchIterationManifest284Snapshot();
  assert.equal(receipt.version, "2.84.0-research.1");
  assert.equal(receipt.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.83.0");
  assert.equal(receipt.sourceCount, 31);
  assert.equal(receipt.sourceProfileCount, 387);
  assert.equal(receipt.researchUpgradeCount, 238);
  assert.equal(receipt.independentSourceRegistryCount, 5);
  assert.equal(receipt.sourceSpecificCountsPooled, false);
  assert.equal(receipt.neuromorphoCandidateQueryExecuted, false);
  assert.equal(receipt.newGeometryCount, 0);
});
