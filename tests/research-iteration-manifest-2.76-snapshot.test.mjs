import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest276Snapshot } from "../scripts/validate-research-iteration-manifest-2.76-snapshot.mjs";

test("2.76 seals two open mouse spinal EM near-matches without admitting interneuron objects", async () => {
  const result = await validateResearchIterationManifest276Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.76.0");
  assert.equal(result.version, "2.76.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.75.0");
  assert.equal(result.inputCount, 24);
  assert.equal(result.publicMouseSpinalEmVolumes, 2);
  assert.equal(result.interneuronObjectRoutes, 0);
  assert.equal(result.newGeometryCount, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.76 snapshot rejects identity promotion, geometry admission, or parent drift", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.76.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.openMouseSpinalFibsemNearMiss.eligibleMouseSpinalInterneuronObjectRoutes = 1; },
    (value) => { value.exactReferences.openMouseSpinalFibsemNearMiss.admittedOrganelleObjects = 1; },
    (value) => { value.exactReferences.newGeometryCount = 1; },
    (value) => { value.registrySummary.canonicalRecordSetCount = 40; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.74.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest276Snapshot(altered));
  }
});
