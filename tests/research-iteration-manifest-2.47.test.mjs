import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest246Snapshot } from "../scripts/validate-research-iteration-manifest-2.46-snapshot.mjs";
import { buildResearchIterationManifest247, INPUTS_247 } from "../tools/build_research_iteration_manifest_2_47.mjs";
import { validateResearchIterationManifest247 } from "../scripts/validate-research-iteration-manifest-2.47.mjs";

const manifestPath = new URL("../data/research-iteration-manifest-2.47.json", import.meta.url);

test("2.47 seals the single-record contour-derived shell over immutable 2.46", async () => {
  const parent = await validateResearchIterationManifest246Snapshot();
  const built = await buildResearchIterationManifest247();
  assert.deepEqual(await readFile(manifestPath), built.bytes);
  assert.equal(built.manifest.application.version, "2.47.0-research.1");
  assert.equal(built.manifest.parentIterationManifest.releaseId, parent.releaseId);
  assert.equal(built.manifest.integrity.inputCount, 327 + INPUTS_247.length);
  for (const [id, path] of INPUTS_247) assert.ok(built.manifest.authoritativeInputs.some((input) => input.id === id && input.path === path));
  const surface = built.manifest.exactReferences.nativeContourDerivedSomaSurface247;
  assert.equal(surface.sourceContourCount, 14);
  assert.equal(surface.sourceVertexCount, 768);
  assert.equal(surface.derivedDisplayOpenShellCount, 1);
  assert.equal(surface.observedSurfaceCount, 0);
  assert.equal(surface.internalStructureObjectCount, 0);
  assert.equal(surface.registrationCount, 0);
  assert.equal(surface.remainingContourReviewUpgradeId, "UPG-220");
  assert.equal((await validateResearchIterationManifest247()).inputCount, 327 + INPUTS_247.length);
});

test("recomputed hashes cannot authorize geometry, closure, identity or scope mutations", async () => {
  const { manifest } = await buildResearchIterationManifest247();
  for (const mutate of [
    (copy) => { copy.exactReferences.nativeContourDerivedSomaSurface247.internalStructureObjectCount = 1; },
    (copy) => { copy.exactReferences.nativeContourDerivedSomaSurface247.rawSourceClosedFlags.falseCount = 0; },
    (copy) => { copy.exactReferences.nativeContourDerivedSomaSurface247.neuronId = 50424; },
    (copy) => { copy.exactReferences.nativeContourDerivedSomaSurface247.observedSurfaceCount = 1; },
    (copy) => { copy.authoritativeInputs.pop(); copy.integrity.inputCount -= 1; },
    (copy) => { copy.parentIterationManifest.releaseId = "wrong-parent"; },
  ]) {
    const changed = structuredClone(manifest);
    mutate(changed);
    changed.manifestContentSha256 = computeManifestContentSha256(changed);
    await assert.rejects(validateResearchIterationManifest247(changed), /differ from verified rebuild/);
  }
});
