import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest278Snapshot } from "../scripts/validate-research-iteration-manifest-2.78-snapshot.mjs";

test("2.78 seals the record-specific UI receipt without adding unverified geometry", async () => {
  const result = await validateResearchIterationManifest278Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.78.0");
  assert.equal(result.version, "2.78.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.77.0");
  assert.equal(result.explorerRecordCount, 641);
  assert.equal(result.morphologyRecordCount, 149);
  assert.equal(result.detailSlotCount, 11);
  assert.equal(result.routePackCount, 30);
  assert.equal(result.newGeometryCount, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});
