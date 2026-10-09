import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest277Snapshot } from "../scripts/validate-research-iteration-manifest-2.77-snapshot.mjs";

test("2.77 registers exact Svara archive routes without admitting their payloads or geometry", async () => {
  const result = await validateResearchIterationManifest277Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.77.0");
  assert.equal(result.version, "2.77.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.76.0");
  assert.equal(result.sourceCount, 31);
  assert.equal(result.recordSetCount, 41);
  assert.equal(result.inputCount, 26);
  assert.equal(result.packageCount, 3);
  assert.equal(result.inspectedPackageCount, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
  assert.equal(result.admittedGeometry, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.77 archived manifest stays sealed against boundary drift after its source files evolve", async () => {
  const bytes = await readFile(new URL("../data/research-iteration-manifest-2.77.json", import.meta.url));
  const manifest = JSON.parse(bytes.toString("utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.svaraLarvalZebrafishSpinalSbem.inspectedSupplementPackageCount = 1; },
    (value) => { value.exactReferences.svaraLarvalZebrafishSpinalSbem.admittedGeometry = 1; },
    (value) => { value.registrySummary.canonicalRecordSetCount = 42; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.75.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest277Snapshot(altered));
  }
});
