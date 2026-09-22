import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildResearchIterationManifest243, MANIFEST_243_PATH, INPUTS_243 } from "../tools/build_research_iteration_manifest_2_43.mjs";
import { validateResearchIterationManifest243 } from "../scripts/validate-research-iteration-manifest-2.43.mjs";

test("current 2.43 rebuild verifies recovered data and all source input receipts", async () => {
  const built = await buildResearchIterationManifest243();
  assert.deepEqual(await readFile(MANIFEST_243_PATH), built.bytes);
  assert.equal(built.manifest.application.version, "2.43.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.42.0");
  assert.equal(built.manifest.integrity.inputCount, 264 + INPUTS_243.length);
  for (const [id, path] of INPUTS_243) assert.ok(built.manifest.authoritativeInputs.some((item) => item.id === id && item.path === path));
  // These live viewers changed after 2.34; their current bytes must be checked here.
  for (const path of ["app/SourceLocalMorphologyViewport.tsx", "app/MorphologyViewer.tsx", "app/NeuroMorphoUniversePanel.tsx"]) {
    assert.ok(built.manifest.authoritativeInputs.some((input) => input.path === path));
  }
  assert.equal((await validateResearchIterationManifest243()).inputCount, 264 + INPUTS_243.length);
});

test("recomputed hashes cannot conceal changed scientific authority or missing input receipts", async () => {
  const { manifest } = await buildResearchIterationManifest243();
  for (const mutate of [
    (copy) => { copy.exactReferences.sourceDetailAndLabels243.generatedIntracellularObjectCount = 1; },
    (copy) => { copy.exactReferences.sourceDetailAndLabels243.globalIdentityJoinCount = 1; },
    (copy) => { copy.authoritativeInputs.pop(); copy.integrity.inputCount -= 1; },
    (copy) => { copy.authoritativeInputs[0].sha256 = "0".repeat(64); },
    (copy) => { copy.parentIterationManifest.releaseId = "wrong-parent"; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest243(changed), /differ from verified rebuild/);
  }
});
