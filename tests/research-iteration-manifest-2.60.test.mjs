import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest259Snapshot } from "../scripts/validate-research-iteration-manifest-2.59-snapshot.mjs";
import { validateResearchIterationManifest260 } from "../scripts/validate-research-iteration-manifest-2.60.mjs";
import { buildResearchIterationManifest260, INPUTS_260 } from "../tools/build_research_iteration_manifest_2_60.mjs";

test("2.60 adds independent PKD2L1 aggregate cohort context in place and retains sealed 2.59 rollback", async () => {
  const built = await buildResearchIterationManifest260();
  const result = await validateResearchIterationManifest260();
  const parent = await validateResearchIterationManifest259Snapshot();
  assert.equal(built.manifest.application.version, "2.60.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(INPUTS_260.length, 12);
  assert.deepEqual(result, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.60.0",
    inputCount: 482 + INPUTS_260.length,
    parentReleaseId: "ohri-mouse-interneuron-research-iteration-2.59.0",
    researchUpgradeCount: 217,
    tableFiveSummaryCount: 8,
    publicRawDataDepositVerified: false,
    geometryPrimitivesAdmitted: 0,
    fullProjectCopyCount: 0,
  });
});

test("2.60 manifest cannot turn article aggregates into raw availability, a cell join, or model geometry", async () => {
  const { manifest } = await buildResearchIterationManifest260();
  for (const mutate of [
    (value) => { value.exactReferences.pkd2l1IndependentPopulationContext260.publicRawDataDepositVerified = true; },
    (value) => { value.exactReferences.pkd2l1IndependentPopulationContext260.sameCellJoinToCrozat = true; },
    (value) => { value.exactReferences.pkd2l1IndependentPopulationContext260.geometryPrimitivesAdmitted = 1; },
    (value) => { value.exactReferences.pkd2l1IndependentPopulationContext260.regionSectionCountsRetained[0].count = 123; },
    (value) => { value.exactReferences.iteration260Layout.fullProjectCopyCount = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators260.upgradeCount = 216; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    await assert.rejects(validateResearchIterationManifest260(changed), /differ from verified rebuild/);
  }
});
