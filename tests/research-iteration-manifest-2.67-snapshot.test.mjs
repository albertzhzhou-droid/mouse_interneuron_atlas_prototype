import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest267Snapshot } from "../scripts/validate-research-iteration-manifest-2.67-snapshot.mjs";

test("2.67 stays byte-pinned as the immutable parent of 2.68", async () => {
  const result = await validateResearchIterationManifest267Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.67.0");
  assert.equal(result.inputCount, 554);
  assert.equal(result.openEmAdmissions, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.67 immutable snapshot rejects altered source admissions or layout", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.67.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.openMouseSpinalEmSearch243.candidateVolumesAdmitted = 1; },
    (value) => { value.exactReferences.openMouseSpinalEmSearch243.exactInterneuronObjectCrosswalksAdmitted = 1; },
    (value) => { value.exactReferences.iteration267Layout.fullProjectCopyCount = 1; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest267Snapshot(altered));
  }
});
