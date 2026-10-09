import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest272Snapshot } from "../scripts/validate-research-iteration-manifest-2.72-snapshot.mjs";

test("2.72 is sealed as the immutable stable-ID audit parent of 2.73", async () => {
  const result = await validateResearchIterationManifest272Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.72.0");
  assert.equal(result.version, "2.72.0-research.1");
  assert.equal(result.inputCount, 610);
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.71.0");
  assert.equal(result.candidateStableIdCount, 30);
  assert.equal(result.baselineToddQueryRecordCount, 309);
  assert.equal(result.currentUiHits, 339);
  assert.equal(result.currentRosterComplete, false);
  assert.equal(result.newGeometryObjectsAdmitted, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.72 snapshot rejects altered evidence boundaries and identity", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.72.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.releaseId = "ohri-mouse-interneuron-research-iteration-2.73.0"; },
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245.completeCurrentStableIdRosterRetrieved = true; },
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245.newGeometryObjectsAdmitted = 30; },
    (value) => { value.exactReferences.iteration272Layout.fullProjectCopyCount = 1; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.70.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest272Snapshot(altered));
  }
});
