import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest269Snapshot } from "../scripts/validate-research-iteration-manifest-2.69-snapshot.mjs";

test("2.69 is sealed as the immutable parent of 2.70", async () => {
  const result = await validateResearchIterationManifest269Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.69.0");
  assert.equal(result.version, "2.69.0-research.1");
  assert.equal(result.inputCount, 575);
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.68.0");
  assert.equal(result.auditId, "mouse-spinal-em-repository-search-audit-0.1");
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.69 snapshot rejects a mutated release identity", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.69.json", import.meta.url), "utf8"));
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.70.0";
  await assert.rejects(validateResearchIterationManifest269Snapshot(manifest));
});
