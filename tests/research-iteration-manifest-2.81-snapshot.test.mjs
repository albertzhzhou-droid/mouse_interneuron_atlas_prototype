import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest281Snapshot } from "../scripts/validate-research-iteration-manifest-2.81-snapshot.mjs";

test("2.81 records the V1 public-code reconstruction rules without claiming sample or cell validation", async () => {
  const result = await validateResearchIterationManifest281Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.81.0");
  assert.equal(result.version, "2.81.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.80.0");
  assert.equal(result.inputCount, 32);
  assert.equal(result.sourceCount, 31);
  assert.equal(result.sourceProfileCount, 387);
  assert.equal(result.researchUpgradeCount, 236);
  assert.equal(result.matrixInputPathSuffix, "/outs/filtered_feature_bc_matrix");
  assert.equal(result.sampleIdentifierParsingValidatedAgainstAllGeoRecords, false);
  assert.equal(result.geoFileSpecificReuseTermsVerified, false);
  assert.equal(result.newGeometryCount, 0);
});
