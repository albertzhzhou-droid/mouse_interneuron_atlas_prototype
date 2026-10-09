import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateResearchIterationManifest268 } from "../scripts/validate-research-iteration-manifest-2.68.mjs";

test("2.68 adds a source-linked Xenium candidate with no payload or geometry admission", async () => {
  const result = await validateResearchIterationManifest268();
  assert.equal(result.releaseId, "ohri-mouse-interneuron-research-iteration-2.68.0");
  assert.equal(result.parentReleaseId, "ohri-mouse-interneuron-research-iteration-2.67.0");
  assert.equal(result.researchUpgradeCount, 226);
  assert.equal(result.displayedUpgradeCount, 39);
  assert.equal(result.xeniumAudit, "UPG-244");
  assert.equal(result.publicationStatus, "bioRxiv_preprint");
  assert.equal(result.downloadedPayloadBytes, 0);
  assert.equal(result.admitted3DCellObjects, 0);
  assert.equal(result.fullProjectCopyCount, 0);
});

test("2.68 rejects treating Xenium neuron counts as interneurons, reusing data, or extruding into 3D", async () => {
  const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.68.json", import.meta.url), "utf8"));
  for (const mutate of [
    (value) => { value.exactReferences.bilXeniumSpatialAudit244.exactInterneuronRosterRows = 1; },
    (value) => { value.exactReferences.bilXeniumSpatialAudit244.datasetSpecificRightsVerified = true; },
    (value) => { value.exactReferences.bilXeniumSpatialAudit244.admittedThreeDimensionalCellObjects = 1; },
    (value) => { value.exactReferences.bilXeniumSpatialAudit244.payloadBytesDownloaded = 1; },
    (value) => { value.exactReferences.researchRegistryDenominators268.displayedUpgradeCount = 38; },
    (value) => { value.exactReferences.iteration268Layout.fullProjectCopyCount = 1; },
  ]) {
    const altered = structuredClone(manifest);
    mutate(altered);
    await assert.rejects(validateResearchIterationManifest268(altered));
  }
});
