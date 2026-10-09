import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest270 } from "../scripts/validate-research-iteration-manifest-2.70.mjs";

test("2.70 records the 8.6.126 UI-query lead without converting it to a release delta", async () => {
  const result = await validateResearchIterationManifest270();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.70.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.69.0");
  assert.equal(result.researchUpgradeCount, 227);
  assert.equal(result.displayedUpgradeCount, 39);
  assert.equal(result.audit, "neuromorpho-release-8-6-126-ui-query-audit-0.1");
  assert.equal(result.uiHits, 339);
  assert.equal(result.baselineRecordCount, 1097);
  assert.equal(result.stableIdsRetrieved, false);
  assert.equal(result.admittedGeometry, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.70 rejects false ID deltas, denominator changes, admission, or altered rollback", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.70.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.neuromorphoRelease126UiQuery245.candidateRecordIdsCompared = 339; },
    (value) => { value.exactReferences.neuromorphoRelease126UiQuery245.addedRecordCount = 30; },
    (value) => { value.exactReferences.neuromorphoRelease126UiQuery245.newGeometryObjectsAdmitted = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators270.displayedUpgradeCount = 38; },
    (value) => { value.exactReferences.iteration270Layout.fullProjectCopyCount = 1; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.68.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest270(altered));
  }
});
