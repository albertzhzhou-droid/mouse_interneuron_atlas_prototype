import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest273 } from "../scripts/validate-research-iteration-manifest-2.73.mjs";

test("2.73 seals the bounded thirty-route 8.6.126 morphology increment", async () => {
  const result = await validateResearchIterationManifest273();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.73.0");
  assert.equal(result.version, "2.73.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.72.0");
  assert.equal(result.sourceCount, 29);
  assert.equal(result.recordSetCount, 38);
  assert.equal(result.exactRosterCount, 12);
  assert.equal(result.sourceObjectSetCount, 3);
  assert.equal(result.upgradeCount, 229);
  assert.equal(result.currentToddRoster, 339);
  assert.equal(result.supplementaryRouteCount, 30);
  assert.equal(result.radiusDerivedRouteCount, 10);
  assert.equal(result.centerlineOnlyRouteCount, 20);
  assert.equal(result.internalPrimitiveCount, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.73 rejects changed scientific geometry boundaries or the exact 2.72 rollback parent", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.73.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245V02.censusExpansion = 1; },
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245V02.renderedInternalPrimitives = 1; },
    (value) => { value.exactReferences.evidenceAware3dRepresentationContract07.centerlineOnlyRouteCount = 19; },
    (value) => { value.exactReferences.iteration273Layout.fullProjectCopyCount = 1; },
    (value) => { value.parentIterationManifest.path = "data/research-iteration-manifest-2.71.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest273(altered));
  }
});
