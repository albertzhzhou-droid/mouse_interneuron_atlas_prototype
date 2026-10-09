import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { TAXONOMY_PATH, TAXONOMY_SCHEMA_PATH, validateKellyZebrafishTaxonomy } from "../scripts/validate-kelly-zebrafish-spinal-interneuron-taxonomy-0.1.mjs";

const taxonomy = JSON.parse(await readFile(new URL(`../${TAXONOMY_PATH}`, import.meta.url), "utf8"));
const schema = JSON.parse(await readFile(new URL(`../${TAXONOMY_SCHEMA_PATH}`, import.meta.url), "utf8"));

test("retains a separate 4 dpf zebrafish source-local panel and ten article-reported interneuron labels", () => {
  const result = validateKellyZebrafishTaxonomy(taxonomy, schema);
  assert.deepEqual(result, {
    releaseId: "ohri-kelly-zebrafish-spinal-interneuron-taxonomy-0.1.0",
    populationCount: 10,
    labelCount: 10,
    geometryCount: 0,
    internalStructureCount: 0,
  });
  assert.deepEqual(taxonomy.populations.map((item) => item.sourceLabel), ["DoLA", "CoLo", "v1", "v2b", "v2s", "dl1", "dl2", "v2a", "v0v", "v0c"]);
});

test("rejects attempted barcode, animal-denominator, or mouse-equivalence promotion", () => {
  for (const mutate of [
    (copy) => { copy.samplingAndAssignment.cellRoster.exactBarcodeToInterneuronLabelMapVerified = true; },
    (copy) => { copy.samplingAndAssignment.animalDenominator.value = 150; },
    (copy) => { copy.modelingAuthority.mouseTypeEquivalences = 1; },
  ]) {
    const copy = structuredClone(taxonomy);
    mutate(copy);
    assert.throws(() => validateKellyZebrafishTaxonomy(copy, schema));
  }
});
