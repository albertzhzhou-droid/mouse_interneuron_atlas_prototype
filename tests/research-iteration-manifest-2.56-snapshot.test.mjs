import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest256Snapshot } from "../scripts/validate-research-iteration-manifest-2.56-snapshot.mjs";

test("seals iteration 2.56 as an immutable historical parent with its 212-upgrade denominators", async () => {
  const result = await validateResearchIterationManifest256Snapshot();
  assert.deepEqual({
    releaseId: result.releaseId,
    inputCount: result.inputCount,
    parentReleaseId: result.parentReleaseId,
    researchUpgradeCount: result.researchUpgradeCount,
    sourceCount: result.sourceCount,
    recordSetCount: result.recordSetCount,
    activeMorphologyRelease: result.activeMorphologyRelease,
    fullProjectCopyCount: result.fullProjectCopyCount,
  }, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.56.0",
    inputCount: 447,
    parentReleaseId: "ohri-mouse-interneuron-research-iteration-2.55.0",
    researchUpgradeCount: 212,
    sourceCount: 28,
    recordSetCount: 37,
    activeMorphologyRelease: "8.6.124",
    fullProjectCopyCount: 0,
  });
});

test("rejects changed historical comparative taxonomy, morphology-release, or project-copy claims", async () => {
  const { manifest } = await validateResearchIterationManifest256Snapshot();
  for (const mutate of [
    (copy) => { copy.exactReferences.researchRegistryDenominators256.upgradeCount = 213; },
    (copy) => { copy.exactReferences.kellyZebrafishSpinalTaxonomy256.generatedCellGeometryCount = 1; },
    (copy) => { copy.exactReferences.neuromorphoReleaseDeltaAudit256.promotedIntoActiveModel = true; },
    (copy) => { copy.exactReferences.iteration256Layout.fullProjectCopyCount = 1; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest256Snapshot(changed));
  }
});
