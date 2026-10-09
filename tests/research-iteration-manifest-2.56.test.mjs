import assert from "node:assert/strict";
import test from "node:test";
import { validateResearchIterationManifest256Snapshot } from "../scripts/validate-research-iteration-manifest-2.56-snapshot.mjs";

test("2.56 remains sealed as the immutable comparative zebrafish and metadata-only NeuroMorpho parent", async () => {
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
