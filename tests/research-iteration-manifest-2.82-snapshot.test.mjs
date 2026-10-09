import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest282Snapshot } from "../scripts/validate-research-iteration-manifest-2.82-snapshot.mjs";

test("2.82 seals sample-level GEO parser evidence without importing payloads or new geometry", async () => {
  const result = await validateResearchIterationManifest282Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.82.0");
  assert.equal(result.version, "2.82.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.81.0");
  assert.equal(result.inputCount, 37);
  assert.equal(result.sourceCount, 31);
  assert.equal(result.sourceProfileCount, 387);
  assert.equal(result.researchUpgradeCount, 236);
  assert.equal(result.geoSampleRecordCount, 29);
  assert.equal(result.titlePatternMatchCount, 24);
  assert.equal(result.parserExceptionCount, 5);
  assert.equal(result.matrixPayloadDownloadedOrChecksummed, false);
  assert.equal(result.geoFileSpecificReuseTermsVerified, false);
  assert.equal(result.newGeometryCount, 0);
});
