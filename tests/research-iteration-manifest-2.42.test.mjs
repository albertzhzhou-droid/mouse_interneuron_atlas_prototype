import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildResearchIterationManifest242, MANIFEST_242_PATH, INPUTS_242 } from "../tools/build_research_iteration_manifest_2_42.mjs";
import { validateResearchIterationManifest242 } from "../scripts/validate-research-iteration-manifest-2.42.mjs";

test("current 2.42 rebuild verifies recovered data and all source input receipts", async () => {
  const built = await buildResearchIterationManifest242();
  assert.deepEqual(await readFile(MANIFEST_242_PATH), built.bytes);
  assert.equal(built.manifest.application.version, "2.42.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.40.0");
  assert.equal(built.manifest.integrity.inputCount, 230 + INPUTS_242.length);
  for (const [id, path] of INPUTS_242) assert.ok(built.manifest.authoritativeInputs.some((item) => item.id === id && item.path === path));
  // These live viewers changed after 2.34; their current bytes must be checked here.
  for (const path of ["app/SourceLocalMorphologyViewport.tsx", "app/MorphologyViewer.tsx", "app/NeuroMorphoUniversePanel.tsx"]) {
    assert.ok(built.manifest.authoritativeInputs.some((input) => input.path === path));
  }
  assert.equal((await validateResearchIterationManifest242()).inputCount, 230 + INPUTS_242.length);
});

test("recomputed hashes cannot conceal changed scientific authority or missing input receipts", async () => {
  const { manifest } = await buildResearchIterationManifest242();
  for (const mutate of [
    (copy) => { copy.exactReferences.neuriteInspectionAndInformation242.generatedIntracellularObjectCount = 1; },
    (copy) => { copy.exactReferences.neuriteInspectionAndInformation242.diameterAuthority = "invented"; },
    (copy) => { copy.authoritativeInputs.pop(); copy.integrity.inputCount -= 1; },
    (copy) => { copy.authoritativeInputs[0].sha256 = "0".repeat(64); },
    (copy) => { copy.parentIterationManifest.releaseId = "unsealed-2.41"; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest242(changed), /differ from verified rebuild/);
  }
});
