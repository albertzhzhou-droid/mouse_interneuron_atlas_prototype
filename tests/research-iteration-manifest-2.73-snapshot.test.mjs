import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest273Snapshot } from "../scripts/validate-research-iteration-manifest-2.73-snapshot.mjs";

test("2.73 is sealed as the immutable current Todd-route iteration", async () => {
  const result = await validateResearchIterationManifest273Snapshot();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.73.0");
  assert.equal(result.version, "2.73.0-research.1");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.72.0");
  assert.equal(result.currentToddRoster, 339);
  assert.equal(result.supplementaryRouteCount, 30);
  assert.equal(result.radiusDerivedRouteCount, 10);
  assert.equal(result.centerlineOnlyRouteCount, 20);
  assert.equal(result.internalPrimitiveCount, 0);
  assert.equal(result.verifiedRuntimeSearchRecordCount, 671);
  assert.equal(result.verifiedRuntimeMorphologyRecordCount, 179);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.73 snapshot rejects changes to its source, representation, or rollback boundary", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.73.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.releaseId = "ohri-mouse-interneuron-research-iteration-2.72.0"; },
    (value) => { value.exactReferences.neuromorphoRelease126ToddStableIdAudit245V02.addedStableIdCount = 29; },
    (value) => { value.exactReferences.evidenceAware3dRepresentationContract07.internalPrimitiveCount = 1; },
    (value) => { value.exactReferences.supplementalToddActiveRecordIntegration273.runtimeSearchRecordCount = 670; },
    (value) => { value.exactReferences.iteration273Layout.rollbackParent = "data/research-iteration-manifest-2.71.json"; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest273Snapshot(altered));
  }
});
