import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildSourceStrainFacetOptions, filterUniverseBySourceStrain, sourceStrainValues, UNREPORTED_SOURCE_STRAIN } from "../app/neuromorpho-universe-facets.js";

test("source strain facets preserve raw labels and count each exact record once", () => {
  const records = [
    { neuronId: 1, officialMetadata: { strain: "Rorbeta-CreER" } },
    { neuronId: 2, officialMetadata: { strain: "Rorbeta-CreER" } },
    { neuronId: 3, officialMetadata: { strain: ["PVFlpO+vGATiCre", "PVFlpO+vGATiCre"] } },
    { neuronId: 4, officialMetadata: { strain: "PVFlpO+vGlut2" } },
  ];
  assert.deepEqual(buildSourceStrainFacetOptions(records), [
    { value: "PVFlpO+vGATiCre", label: "PVFlpO+vGATiCre", count: 1 },
    { value: "PVFlpO+vGlut2", label: "PVFlpO+vGlut2", count: 1 },
    { value: "Rorbeta-CreER", label: "Rorbeta-CreER", count: 2 },
  ]);
  assert.deepEqual(filterUniverseBySourceStrain(records, "Rorbeta-CreER").map((record) => record.neuronId), [1, 2]);
  assert.equal(filterUniverseBySourceStrain(records, "Rorbeta").length, 0);
});

test("missing source labels stay separate from literal source values", () => {
  const records = [
    { neuronId: 1, officialMetadata: { strain: null } },
    { neuronId: 2, officialMetadata: { strain: "Not reported" } },
  ];
  assert.deepEqual(sourceStrainValues(records[0]), [UNREPORTED_SOURCE_STRAIN]);
  assert.deepEqual(buildSourceStrainFacetOptions(records), [
    { value: UNREPORTED_SOURCE_STRAIN, label: "Missing (not source-reported)", count: 1 },
    { value: "Not reported", label: "Not reported", count: 1 },
  ]);
  assert.deepEqual(filterUniverseBySourceStrain(records, UNREPORTED_SOURCE_STRAIN), [records[0]]);
});

test("molecular profiles open the exact morphology browser without inventing a cross-source identity", async () => {
  const [collection, lab, panel] = await Promise.all([
    readFile(new URL("../app/ResearchCollectionPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ResearchDataLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/InterneuronTypeAtlas.tsx", import.meta.url), "utf8"),
  ]);
  const handler = collection.match(/const browseIndependentMorphology = \(sourceLabel: string\) => \{([\s\S]*?)\n {2}\};/)?.[1] ?? "";
  assert.ok(handler);
  assert.match(handler, /const literalQuery = sourceLabel\.trim\(\)\.slice\(0, 180\)/);
  assert.match(handler, /new URLSearchParams\(\{ morphologyQuery: literalQuery \}\)/);
  assert.ok(handler.includes('window.location.assign(`/explore/morphology/viewer?${params.toString()}`)'));
  assert.doesNotMatch(handler, /selectResearchLab|transitionResearchFocus|focusKind|focusId|cellForm|morphologyNeuron/);
  assert.match(collection, /onBrowseIndependentMorphology=\{browseIndependentMorphology\}/);
  assert.match(collection, /It does not assign a biological subtype or select a matching cell/);
  assert.match(lab, /onBrowseIndependentMorphology=\{onBrowseIndependentMorphology\}/);
  assert.match(panel, /Publication-level morphology coverage/);
  assert.match(panel, /Search morphology by source label/);
  assert.match(panel, /DOI overlap is publication-level metadata only—not subtype, specimen, or same-cell evidence/);
});

test("strain labels displayed in the morphology browser come from the exact official field", async () => {
  const panel = await readFile(new URL("../app/NeuroMorphoUniversePanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /Raw strain: \{readable\(record\.officialMetadata\.strain\)\}/);
  assert.match(panel, /Raw strain \/ reporter label/);
  assert.match(panel, /readable\(selected\.officialMetadata\.strain\)/);
});
