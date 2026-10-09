import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildSourceCellTypeFacetOptions,
  filterUniverseBySourceCellType,
  sourceCellTypeValues,
  UNREPORTED_SOURCE_CELL_TYPE,
} from "../app/neuromorpho-universe-facets.js";

test("source cell-type facets preserve exact official values and deduplicate within a record", () => {
  const records = [
    { neuronId: 1, officialMetadata: { cell_type: ["Renshaw", "interneuron", "Renshaw"] } },
    { neuronId: 2, officialMetadata: { cell_type: "Renshaw " } },
    { neuronId: 3, officialMetadata: { cell_type: ["interneuron", "Vertical"] } },
  ];
  assert.deepEqual(sourceCellTypeValues(records[0]), ["Renshaw", "interneuron"]);
  assert.deepEqual(buildSourceCellTypeFacetOptions(records), [
    { value: "interneuron", label: "interneuron", count: 2 },
    { value: "Renshaw", label: "Renshaw", count: 1 },
    { value: "Renshaw ", label: "Renshaw ", count: 1 },
    { value: "Vertical", label: "Vertical", count: 1 },
  ]);
  assert.deepEqual(filterUniverseBySourceCellType(records, "Renshaw").map((record) => record.neuronId), [1]);
  assert.deepEqual(filterUniverseBySourceCellType(records, "all"), records);
});

test("missing source labels are distinct from literal labels and counts may overlap", () => {
  const records = [
    { neuronId: 1, officialMetadata: { cell_type: null } },
    { neuronId: 2, officialMetadata: { cell_type: [] } },
    { neuronId: 3, officialMetadata: { cell_type: "Not reported" } },
    { neuronId: 4, officialMetadata: { cell_type: ["Inhibitory", "interneuron"] } },
  ];
  assert.deepEqual(sourceCellTypeValues(records[0]), [UNREPORTED_SOURCE_CELL_TYPE]);
  assert.deepEqual(buildSourceCellTypeFacetOptions(records), [
    { value: "Inhibitory", label: "Inhibitory", count: 1 },
    { value: "interneuron", label: "interneuron", count: 1 },
    { value: "__source_cell_type_unreported__", label: "Missing (not source-reported)", count: 2 },
    { value: "Not reported", label: "Not reported", count: 1 },
  ]);
  assert.deepEqual(filterUniverseBySourceCellType(records, UNREPORTED_SOURCE_CELL_TYPE), records.slice(0, 2));
});

test("pinned 8.6.124 cell-type facets are reproducible from the checksum-verified exact query", async () => {
  const contract = JSON.parse(await readFile(new URL("../data/neuromorpho-no-age-query-universe-0.1.json", import.meta.url), "utf8"));
  const indexBytes = await readFile(new URL(`../public${contract.dataset.indexPath}`, import.meta.url));
  assert.equal(indexBytes.byteLength, contract.dataset.indexBytes);
  assert.equal(createHash("sha256").update(indexBytes).digest("hex"), contract.dataset.indexSha256);

  const index = JSON.parse(indexBytes.toString("utf8"));
  assert.equal(index.repositoryRelease, "8.6.124");
  assert.equal(index.records.length, 1_097);
  const options = buildSourceCellTypeFacetOptions(index.records);
  const nonMissing = options.filter((option) => option.value !== UNREPORTED_SOURCE_CELL_TYPE);
  assert.equal(nonMissing.length, 27);
  assert.equal(options.some((option) => option.value === UNREPORTED_SOURCE_CELL_TYPE), false);
  assert.equal(nonMissing.reduce((sum, option) => sum + option.count, 0), 2_735);
  assert.equal(index.records.filter((record) => sourceCellTypeValues(record).length > 1).length, 1_095);
  const counts = new Map(nonMissing.map(({ value, count }) => [value, count]));
  assert.equal(counts.get("interneuron"), 1_097);
  assert.equal(counts.get("Inhibitory"), 510);
  assert.equal(counts.get("Excitatory"), 397);
  assert.equal(counts.get("Renshaw"), 8);
  assert.equal(counts.get("pre-motor"), 49);
  assert.equal(filterUniverseBySourceCellType(index.records, "Renshaw").length, 8);
});

test("source-label filtering does not silently replace the selected morphology or join a molecular profile", async () => {
  const [panel, facets] = await Promise.all([
    readFile(new URL("../app/NeuroMorphoUniversePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/neuromorpho-universe-facets.js", import.meta.url), "utf8"),
  ]);
  assert.match(facets, /record\?\.officialMetadata\?\.cell_type/);
  assert.match(panel, /filterUniverseBySourceCellType/);
  assert.match(panel, /UPG-236 · Exact repository cell-type label/);
  assert.match(panel, /Filtering only narrows this list; choosing an exact NMO record loads that record&apos;s checksum-verified morphology/);
  assert.match(panel, /Every switch discards the prior geometry before loading the next object/);
  assert.match(panel, /Each selection is one exact NeuroMorpho record\. It is not a molecular type, animal count, or representative archetype/);
});
