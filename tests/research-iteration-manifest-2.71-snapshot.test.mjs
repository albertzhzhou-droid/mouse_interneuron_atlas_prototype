import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest271Snapshot } from "../scripts/validate-research-iteration-manifest-2.71-snapshot.mjs";

test("2.71 is sealed as the immutable DOI-coverage parent of 2.72", async () => {
  const result = await validateResearchIterationManifest271Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.71.0");
  assert.equal(result.version, "2.71.0-research.1");
  assert.equal(result.inputCount, 600);
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.70.0");
  assert.equal(result.auditId, "neuromorpho-type-source-doi-overlap-audit-0.1");
  assert.equal(result.morphologyQueryRecordCount, 1097);
  assert.equal(result.taxonomySourceCount, 10);
  assert.equal(result.sourceProfileCount, 387);
  assert.equal(result.exactDoiMatchedRecords, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.71 snapshot rejects a mutated scientific boundary or release identity", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.71.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.releaseId = "ohri-mouse-interneuron-research-iteration-2.72.0"; },
    (value) => { value.exactReferences.neuromorphoTypeSourceDoiOverlap246.exactDoiMatchedRecordCount = 1; },
    (value) => { value.exactReferences.iteration271Layout.fullProjectCopyCount = 1; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest271Snapshot(altered));
  }
});
