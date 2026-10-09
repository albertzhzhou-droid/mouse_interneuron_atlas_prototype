import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest262Snapshot } from "../scripts/validate-research-iteration-manifest-2.62-snapshot.mjs";

test("2.62 is sealed as the immutable DOI-by-source-label rollback parent", async () => {
  const result = await validateResearchIterationManifest262Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.62.0");
  assert.equal(result.inputCount, 508);
  assert.equal(result.researchUpgradeCount, 222);
  assert.equal(result.displayedUpgradeCount, 33);
  assert.equal(result.doiLabelMembershipCount, 2_735);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.62 snapshot rejects research or workspace receipt changes", async () => {
  const { manifest } = await validateResearchIterationManifest262Snapshot();
  for (const mutate of [
    (value) => { value.exactReferences.neuromorphoPaperCellTypeCrossTab262.newGeometryObjectCount = 1; },
    (value) => { value.exactReferences.neuromorphoPaperCellTypeCrossTab262.sameCellJoinCount = 1; },
    (value) => { value.exactReferences.iteration262Layout.fullProjectCopyCount = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators262.upgradeCount = 221; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest262Snapshot(changed), /content receipt changed/);
  }
});
