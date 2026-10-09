import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  loadVerifiedSupplementalMorphologyResearchRecords,
  resolveSupplementalMorphologyResearchRecord,
  TODD_NTS_ROUTE_PACK_CANONICAL_SHA256,
} from "../app/research-supplemental-morphology-records.js";

test("Todd 8.6.126 source-route records enter the verified active-record collection without census expansion", async () => {
  const records = (await loadVerifiedSupplementalMorphologyResearchRecords({ cryptoImpl: webcrypto })).filter(record => record.namespace === "neuromorpho:8.6.126:Todd");
  assert.equal(records.length, 30);
  assert.equal(new Set(records.map((record) => record.key)).size, 30);
  assert.equal(new Set(records.map((record) => record.focusId)).size, 30);
  assert.ok(records.every((record) => record.focusKind === "morphology_record"));
  assert.ok(records.every((record) => record.morphologyMembership.censusContribution === 0));
  assert.ok(records.every((record) => record.morphologyMembership.supplementaryContribution === 1));
  assert.ok(records.every((record) => record.presentation.modeling.admittedCellGeometryObjectCount === 1));
  assert.ok(records.every((record) => record.presentation.modeling.admittedInternalObjectCount === 0));
  assert.ok(records.every((record) => record.presentation.modeling.axes.find((axis) => axis.axisId === "source_record")?.authority === "checksum_verified_source_route_pack"));
  assert.ok(records.every((record) => record.provenance.objectHashes.some((hash) => hash.sha256 === TODD_NTS_ROUTE_PACK_CANONICAL_SHA256)));
});

test("the shared active-record resolver returns the exact source-specific record and fails closed for other IDs", async () => {
  const records = await loadVerifiedSupplementalMorphologyResearchRecords({ cryptoImpl: webcrypto });
  const selected = await resolveSupplementalMorphologyResearchRecord({
    focusKind: "morphology_record",
    focusId: "NeuroMorpho:322379",
  }, { cryptoImpl: webcrypto });

  assert.strictEqual(selected, records.find((record) => record.focusId === "NeuroMorpho:322379"));
  assert.equal(selected.key, "morphology_record:NeuroMorpho:322379");
  assert.ok(selected.evidence.some((row) => row.label === "Source-local label" && row.value.includes("Neurotensin-expressing*")));
  assert.ok(selected.evidence.some((row) => row.label === "Original paper fields" && row.value.includes("mapping unresolved")));
  assert.equal(selected.coordinate.geometryStatus, "OBS_STANDARDIZED_SOURCE_LOCAL");
  assert.equal(selected.provenance.doi, null);
  assert.equal(await resolveSupplementalMorphologyResearchRecord({
    focusKind: "morphology_record",
    focusId: "NeuroMorpho:999999",
  }, { cryptoImpl: webcrypto }), null);
  assert.equal(await resolveSupplementalMorphologyResearchRecord({
    focusKind: "sci_entity",
    focusId: "mouse.sc.vsx2_hoxa10",
  }, { cryptoImpl: webcrypto }), null);
});

test("the runtime source-record collection derives updated search denominators without rewriting its base index", async () => {
  const baseIndex = JSON.parse(await readFile(new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url), "utf8"));
  const supplementalRecords = await loadVerifiedSupplementalMorphologyResearchRecords({ cryptoImpl: webcrypto });
  const records = [...baseIndex.records, ...supplementalRecords];
  const morphologyCount = records.filter((record) => record.focusKind === "morphology_record").length;

  assert.equal(baseIndex.records.length, 641);
  assert.equal(records.length, 673);
  assert.equal(morphologyCount, 181);
  assert.equal(records.filter((record) => record.morphologyMembership?.collection === "supplementary").length, 39);
  assert.equal(supplementalRecords.filter((record) => record.morphologyMembership.censusContribution === 0).length, 32);
  assert.ok(records.some((record) => record.focusId === "NeuroMorpho:322379"));
});
