import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest265 } from "../scripts/validate-research-iteration-manifest-2.65.mjs";

test("2.65 seals literal source-label discovery and keeps internal EM geometry unadmitted", async () => {
  const result = await validateResearchIterationManifest265();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.65.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.64.0");
  assert.equal(result.researchUpgradeCount, 224);
  assert.equal(result.displayedUpgradeCount, 36);
  assert.equal(result.sharedMorphologyIndexes, true);
  assert.equal(result.explicitObjectSelectionRequired, true);
  assert.equal(result.admittedInternalGeometry, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.65 rejects invented identity, public volume access, geometry, or denominator changes", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.65.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.morphologyLabelDiscovery265.sourceLabelToSameCellJoinCount = 1; },
    (value) => { value.exactReferences.nakamuraSbfemAvailabilityWatch265.exactPublicEmStackVerified = true; },
    (value) => { value.exactReferences.nakamuraSbfemAvailabilityWatch265.admittedCellOrOrganelleGeometry = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators265.upgradeCount = 223; },
    (value) => { value.exactReferences.iteration265Layout.fullProjectCopyCount = 1; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest265(altered));
  }
});
