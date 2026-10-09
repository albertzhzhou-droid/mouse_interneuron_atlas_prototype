import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest256Snapshot } from "../scripts/validate-research-iteration-manifest-2.56-snapshot.mjs";
import { validateResearchIterationManifest257 } from "../scripts/validate-research-iteration-manifest-2.57.mjs";
import { buildResearchIterationManifest257 } from "../tools/build_research_iteration_manifest_2_57.mjs";

test("2.57 publishes the source-local Todd topology audit without promoting line traces to surfaces", async () => {
  const built = await buildResearchIterationManifest257();
  const result = await validateResearchIterationManifest257();
  const parent = await validateResearchIterationManifest256Snapshot();
  assert.equal(built.manifest.application.version, "2.57.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.56.0");
  assert.deepEqual({
    releaseId: result.releaseId,
    researchUpgradeCount: result.researchUpgradeCount,
    sourceCount: result.sourceCount,
    recordSetCount: result.recordSetCount,
    toddSourceContourCount: result.toddSourceContourCount,
    toddSourceVertexCount: result.toddSourceVertexCount,
    toddHeldTransitions: result.toddHeldTransitions,
    contourDerivedSurfaceAdmittedCount: result.contourDerivedSurfaceAdmittedCount,
    fullProjectCopyCount: result.fullProjectCopyCount,
  }, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.57.0",
    researchUpgradeCount: 213,
    sourceCount: 28,
    recordSetCount: 37,
    toddSourceContourCount: 19,
    toddSourceVertexCount: 1136,
    toddHeldTransitions: 8,
    contourDerivedSurfaceAdmittedCount: 0,
    fullProjectCopyCount: 0,
  });
});

test("rehashed manifests cannot promote exploratory limits, surfaces, identities, or copied project trees", async () => {
  const { manifest } = await buildResearchIterationManifest257();
  for (const mutate of [
    (copy) => { copy.exactReferences.toddNativeContourTopologyAudit257.independentlyValidatedBiologicalTolerance = true; },
    (copy) => { copy.exactReferences.toddNativeContourTopologyAudit257.contourDerivedSurfaceAdmittedCount = 1; },
    (copy) => { copy.exactReferences.toddNativeContourTopologyAudit257.crossSourceIdentityCount = 1; },
    (copy) => { copy.exactReferences.researchRegistryDenominators257.upgradeCount = 212; },
    (copy) => { copy.exactReferences.iteration257Layout.fullProjectCopyCount = 1; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest257(changed), /differ from verified rebuild/);
  }
});
