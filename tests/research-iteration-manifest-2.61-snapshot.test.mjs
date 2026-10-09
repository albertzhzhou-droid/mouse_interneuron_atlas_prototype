import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest261Snapshot } from "../scripts/validate-research-iteration-manifest-2.61-snapshot.mjs";

test("2.61 is sealed as the immutable source-cell-type-facet rollback parent", async () => {
  const result = await validateResearchIterationManifest261Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.61.0");
  assert.equal(result.inputCount, 501);
  assert.equal(result.researchUpgradeCount, 219);
  assert.equal(result.rawCellTypeLabelCount, 27);
  assert.equal(result.recordLabelMembershipCount, 2_735);
  assert.equal(result.multiLabelRecordCount, 1_095);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.61 snapshot rejects content rewritten to claim new geometry or exclusivity", async () => {
  const { manifest } = await validateResearchIterationManifest261Snapshot();
  for (const mutate of [
    (value) => { value.exactReferences.neuromorphoSourceCellTypeFacet261.countsAreMutuallyExclusive = true; },
    (value) => { value.exactReferences.neuromorphoSourceCellTypeFacet261.newGeometryObjectCount = 1; },
    (value) => { value.exactReferences.neuromorphoSourceCellTypeFacet261.sameCellJoinCount = 1; },
    (value) => { value.exactReferences.iteration261Layout.fullProjectCopyCount = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators261.upgradeCount = 218; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest261Snapshot(changed), /content receipt changed/);
  }
});
