import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest260Snapshot } from "../scripts/validate-research-iteration-manifest-2.60-snapshot.mjs";
import { validateResearchIterationManifest261 } from "../scripts/validate-research-iteration-manifest-2.61.mjs";
import { buildResearchIterationManifest261, INPUTS_261 } from "../tools/build_research_iteration_manifest_2_61.mjs";

test("2.61 exposes the exact source-label facet and seals 2.60 as its rollback parent", async () => {
  const built = await buildResearchIterationManifest261();
  const result = await validateResearchIterationManifest261();
  const parent = await validateResearchIterationManifest260Snapshot();
  assert.equal(built.manifest.application.version, "2.61.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(INPUTS_261.length, 7);
  assert.deepEqual(result, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.61.0",
    inputCount: 494 + INPUTS_261.length,
    parentReleaseId: "ohri-mouse-interneuron-research-iteration-2.60.0",
    researchUpgradeCount: 219,
    rawCellTypeLabelCount: 27,
    recordLabelMembershipCount: 2_735,
    multiLabelRecordCount: 1_095,
    newGeometryObjectCount: 0,
    fullProjectCopyCount: 0,
  });
});

test("2.61 cannot turn overlapping repository labels into new geometry, molecular joins or exclusive denominators", async () => {
  const { manifest } = await buildResearchIterationManifest261();
  for (const mutate of [
    (value) => { value.exactReferences.neuromorphoSourceCellTypeFacet261.countsAreMutuallyExclusive = true; },
    (value) => { value.exactReferences.neuromorphoSourceCellTypeFacet261.molecularProfileJoinCount = 1; },
    (value) => { value.exactReferences.neuromorphoSourceCellTypeFacet261.newGeometryObjectCount = 1; },
    (value) => { value.exactReferences.neuromorphoSourceCellTypeFacet261.multiLabelRecordCount = 0; },
    (value) => { value.exactReferences.neuromorphoSourceCellTypeFacet261.runtime.filterChangesActiveRecord = true; },
    (value) => { value.exactReferences.iteration261Layout.fullProjectCopyCount = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators261.upgradeCount = 218; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    await assert.rejects(validateResearchIterationManifest261(changed), /differ from verified rebuild/);
  }
});
