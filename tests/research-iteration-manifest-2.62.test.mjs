import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest261Snapshot } from "../scripts/validate-research-iteration-manifest-2.61-snapshot.mjs";
import { validateResearchIterationManifest262 } from "../scripts/validate-research-iteration-manifest-2.62.mjs";
import { buildResearchIterationManifest262, INPUTS_262 } from "../tools/build_research_iteration_manifest_2_62.mjs";

test("2.62 adds the exact paper-label map and seals 2.61 as its rollback parent", async () => {
  const built = await buildResearchIterationManifest262();
  const result = await validateResearchIterationManifest262();
  const parent = await validateResearchIterationManifest261Snapshot();
  assert.equal(built.manifest.application.version, "2.62.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(INPUTS_262.length, 7);
  assert.deepEqual(result, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.62.0",
    inputCount: 501 + INPUTS_262.length,
    parentReleaseId: "ohri-mouse-interneuron-research-iteration-2.61.0",
    researchUpgradeCount: 222,
    displayedUpgradeCount: 33,
    sourceDoiCount: 12,
    doiLabelMembershipCount: 2_735,
    multiLabelRecordCount: 1_095,
    figureMembershipUnassessableRecordCount: 1_097,
    newGeometryObjectCount: 0,
    fullProjectCopyCount: 0,
  });
});

test("2.62 cannot convert source-paper citations into figure matches, exclusive labels or new geometry", async () => {
  const { manifest } = await buildResearchIterationManifest262();
  for (const mutate of [
    (value) => { value.exactReferences.neuromorphoPaperCellTypeCrossTab262.figureMembershipIsAssessable = true; },
    (value) => { value.exactReferences.neuromorphoPaperCellTypeCrossTab262.papers[0].cellTypeRows[0].nmoIds.pop(); },
    (value) => { value.exactReferences.neuromorphoPaperCellTypeCrossTab262.doiCount = 11; },
    (value) => { value.exactReferences.neuromorphoPaperCellTypeCrossTab262.countsAreMutuallyExclusive = true; },
    (value) => { value.exactReferences.neuromorphoPaperCellTypeCrossTab262.newGeometryObjectCount = 1; },
    (value) => { value.exactReferences.neuromorphoPaperCellTypeCrossTab262.sameCellJoinCount = 1; },
    (value) => { value.exactReferences.iteration262Layout.fullProjectCopyCount = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators262.upgradeCount = 221; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    await assert.rejects(validateResearchIterationManifest262(changed), /differ from verified rebuild/);
  }
});
