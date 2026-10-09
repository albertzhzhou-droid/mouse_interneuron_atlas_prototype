import assert from "node:assert/strict";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest263Snapshot } from "../scripts/validate-research-iteration-manifest-2.63-snapshot.mjs";

test("2.63 is sealed as the immutable public image-mask-reference rollback parent", async () => {
  const result = await validateResearchIterationManifest263Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.63.0");
  assert.equal(result.inputCount, 519);
  assert.equal(result.researchUpgradeCount, 222);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.63 snapshot rejects research or workspace receipt changes", async () => {
  const { manifest } = await validateResearchIterationManifest263Snapshot();
  for (const mutate of [
    (value) => { value.exactReferences.microStructFormerUltrastructureReference263.admittedInternalGeometryCount = 1; },
    (value) => { value.exactReferences.microStructFormerUltrastructureReference263.downloadedPayloadBytes = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators263.upgradeCount = 221; },
    (value) => { value.exactReferences.iteration263Layout.fullProjectCopyCount = 1; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest263Snapshot(changed), /content receipt changed/);
  }
});
