import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest270Snapshot } from "../scripts/validate-research-iteration-manifest-2.70-snapshot.mjs";

test("2.70 is sealed as the immutable parent of the current iteration", async () => {
  const result = await validateResearchIterationManifest270Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.70.0");
  assert.equal(result.version, "2.70.0-research.1");
  assert.equal(result.inputCount, 585);
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.69.0");
  assert.equal(result.auditId, "neuromorpho-release-8-6-126-ui-query-audit-0.1");
  assert.equal(result.stableIdsRetrieved, false);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.70 snapshot rejects a mutated release identity", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.70.json", import.meta.url), "utf8"));
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.71.0";
  await assert.rejects(validateResearchIterationManifest270Snapshot(manifest));
});
