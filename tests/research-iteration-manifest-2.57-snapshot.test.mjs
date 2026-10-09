import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest257Snapshot } from "../scripts/validate-research-iteration-manifest-2.57-snapshot.mjs";

test("seals iteration 2.57 as an immutable historical parent with 213 upgrades", async () => {
  const result = await validateResearchIterationManifest257Snapshot();
  assert.deepEqual({
    releaseId: result.releaseId,
    inputCount: result.inputCount,
    parentReleaseId: result.parentReleaseId,
    researchUpgradeCount: result.researchUpgradeCount,
    sourceCount: result.sourceCount,
    recordSetCount: result.recordSetCount,
    toddSourceContourCount: result.toddSourceContourCount,
    toddSourceVertexCount: result.toddSourceVertexCount,
    toddHeldTransitions: result.toddHeldTransitions,
    fullProjectCopyCount: result.fullProjectCopyCount,
  }, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.57.0",
    inputCount: 458,
    parentReleaseId: "ohri-mouse-interneuron-research-iteration-2.56.0",
    researchUpgradeCount: 213,
    sourceCount: 28,
    recordSetCount: 37,
    toddSourceContourCount: 19,
    toddSourceVertexCount: 1136,
    toddHeldTransitions: 8,
    fullProjectCopyCount: 0,
  });
});

test("rehashed mutations cannot change historical 2.57 denominators or topology boundaries", async () => {
  const { manifest } = await validateResearchIterationManifest257Snapshot();
  for (const mutate of [
    (copy) => { copy.exactReferences.researchRegistryDenominators257.upgradeCount = 214; },
    (copy) => { copy.exactReferences.toddNativeContourTopologyAudit257.contourDerivedSurfaceAdmittedCount = 1; },
    (copy) => { copy.exactReferences.toddNativeContourTopologyAudit257.independentlyValidatedBiologicalTolerance = true; },
    (copy) => { copy.exactReferences.iteration257Layout.fullProjectCopyCount = 1; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest257Snapshot(changed));
  }
});
