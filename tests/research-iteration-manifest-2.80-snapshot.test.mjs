import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest280Snapshot } from "../scripts/validate-research-iteration-manifest-2.80-snapshot.mjs";

test("2.80 seals the V1 source availability audit without admitting unvalidated joins or new 3D detail", async () => {
  const result = await validateResearchIterationManifest280Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.80.0");
  assert.equal(result.version, "2.80.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.79.0");
  assert.equal(result.inputCount, 31);
  assert.equal(result.sourceCount, 31);
  assert.equal(result.sourceProfileCount, 387);
  assert.equal(result.researchUpgradeCount, 236);
  assert.equal(result.selectedStudyWideNucleusCount, 89494);
  assert.equal(result.barcodeToCountMatrixRowCrosswalkValidated, false);
  assert.equal(result.geoFileSpecificReuseTermsVerified, false);
  assert.equal(result.newGeometryCount, 0);
});
