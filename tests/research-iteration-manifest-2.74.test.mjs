import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest274Snapshot } from "../scripts/validate-research-iteration-manifest-2.74-snapshot.mjs";

test("2.74 seals the single source-local BANC v888 centerline route and its immutable 2.73 parent", async () => {
  const result = await validateResearchIterationManifest274Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.74.0");
  assert.equal(result.version, "2.74.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.73.0");
  assert.equal(result.sourceCount, 30);
  assert.equal(result.recordSetCount, 39);
  assert.equal(result.exactRosterCount, 13);
  assert.equal(result.sourceObjectSetCount, 4);
  assert.equal(result.routeNodeCount, 7451);
  assert.equal(result.internalSurfaceCount, 0);
  assert.equal(result.mouseJoinCount, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.74 rejects any altered geometry, count, copy, or rollback receipt", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.74.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.bancV888IN14A018MorphologyRoute.renderedSurfaces = 1; },
    (value) => { value.exactReferences.bancV888IN14A018MorphologyRoute.mouseJoins = 1; },
    (value) => { value.registrySummary.canonicalSourceCount = 29; },
    (value) => { value.exactReferences.layout.fullProjectCopyCount = 1; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.72.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest274Snapshot(altered));
  }
});
