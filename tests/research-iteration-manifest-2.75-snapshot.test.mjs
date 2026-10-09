import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest275Snapshot } from "../scripts/validate-research-iteration-manifest-2.75-snapshot.mjs";

test("2.75 seals UPG-249's public source routes without adding internal geometry", async () => {
  const result = await validateResearchIterationManifest275Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.75.0");
  assert.equal(result.version, "2.75.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.74.0");
  assert.equal(result.sourceCount, 30);
  assert.equal(result.recordSetCount, 39);
  assert.equal(result.upgradeCount, 231);
  assert.equal(result.routeNodeCount, 7451);
  assert.equal(result.nucleusRouteDocumented, true);
  assert.equal(result.newGeometryCount, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.75 snapshot rejects altered evidence, parent, or geometry receipts", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.75.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.bancV888InternalObjectAvailability.nucleusMeshAdmitted = true; },
    (value) => { value.exactReferences.bancV888InternalObjectAvailability.newGeometryCount = 1; },
    (value) => { value.registrySummary.canonicalSourceCount = 31; },
    (value) => { value.exactReferences.layout.fullProjectCopyCount = 1; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.73.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest275Snapshot(altered));
  }
});
