import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest259Snapshot } from "../scripts/validate-research-iteration-manifest-2.59-snapshot.mjs";

test("2.59 is sealed as the immutable in-place morphology-facet rollback parent", async () => {
  const result = await validateResearchIterationManifest259Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.59.0");
  assert.equal(result.inputCount, 482);
  assert.equal(result.researchUpgradeCount, 215);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.59 historical receipt cannot be promoted into an inferred cell join or geometry", async () => {
  const { manifest } = await validateResearchIterationManifest259Snapshot();
  const changed = structuredClone(manifest);
  changed.exactReferences.gintyNeuroMorphoStrainFacetAudit259.sameCellJoinCount = 1;
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(validateResearchIterationManifest259Snapshot(changed), /content receipt changed/);
});
