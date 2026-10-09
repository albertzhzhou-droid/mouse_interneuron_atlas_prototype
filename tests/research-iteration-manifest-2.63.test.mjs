import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest263 } from "../scripts/validate-research-iteration-manifest-2.63.mjs";

test("2.63 seals the pinned public ultrastructure reference as a separate 2D source lane", async () => {
  const result = await validateResearchIterationManifest263();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.63.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.62.0");
  assert.equal(result.researchUpgradeCount, 222);
  assert.equal(result.pairedImageMaskRows, 540);
  assert.equal(result.identifiedInterneuronCount, 0);
  assert.equal(result.admittedInternalGeometryCount, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.63 rejects any same-cell join, 3D interpolation, or redistributed source payload", async () => {
  await validateResearchIterationManifest263();
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.63.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.microStructFormerUltrastructureReference263.sameCellJoinCount = 1; },
    (value) => { value.exactReferences.microStructFormerUltrastructureReference263.crossSectionStackingAllowed = true; },
    (value) => { value.exactReferences.microStructFormerUltrastructureReference263.admittedInternalGeometryCount = 1; },
    (value) => { value.exactReferences.microStructFormerUltrastructureReference263.downloadedPayloadBytes = 1; },
    (value) => { value.exactReferences.iteration263Layout.fullProjectCopyCount = 1; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest263(changed));
  }
});
