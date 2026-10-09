import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest271 } from "../scripts/validate-research-iteration-manifest-2.71.mjs";

test("2.71 pins type-source morphology DOI coverage without converting it to same-cell identity", async () => {
  const result = await validateResearchIterationManifest271();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.71.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.70.0");
  assert.equal(result.researchUpgradeCount, 228);
  assert.equal(result.completedUpgradeCount, 67);
  assert.equal(result.auditId, "neuromorpho-type-source-doi-overlap-audit-0.1");
  assert.equal(result.morphologyRelease, "8.6.124");
  assert.equal(result.morphologyQueryRecordCount, 1097);
  assert.equal(result.taxonomySourceCount, 10);
  assert.equal(result.sourceProfileCount, 387);
  assert.equal(result.exactDoiMatchedRecordCount, 0);
  assert.equal(result.identityJoins, 0);
  assert.equal(result.geometryObjectsAdmitted, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.71 rejects false DOI matches, profile-count drift, geometry admission, and changed rollback", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.71.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.neuromorphoTypeSourceDoiOverlap246.exactDoiMatchedRecordCount = 1; },
    (value) => { value.exactReferences.neuromorphoTypeSourceDoiOverlap246.sourceProfileCount = 386; },
    (value) => { value.exactReferences.neuromorphoTypeSourceDoiOverlap246.geometryObjectsAdmitted = 1; },
    (value) => { value.exactReferences.iteration271Layout.fullProjectCopyCount = 1; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.69.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest271(altered));
  }
});
