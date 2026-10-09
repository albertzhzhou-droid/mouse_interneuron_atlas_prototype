import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest283Snapshot } from "../scripts/validate-research-iteration-manifest-2.83-snapshot.mjs";

test("2.83 seals the exact-record-first reference layout and keeps Xenium data gated", async () => {
  const result = await validateResearchIterationManifest283Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.83.0");
  assert.equal(result.version, "2.83.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.82.0");
  assert.equal(result.inputCount, 29);
  assert.equal(result.sourceCount, 31);
  assert.equal(result.sourceProfileCount, 387);
  assert.equal(result.researchUpgradeCount, 237);
  assert.equal(result.activeRecordDetailIsFirst, true);
  assert.equal(result.independentReferenceDisclosureDefaultOpen, false);
  assert.equal(result.bilPayloadBytesDownloaded, 0);
  assert.equal(result.bilInterneuronRosterRows, 0);
  assert.equal(result.newGeometryCount, 0);
});
