import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateRoomeDilSourceTaxonomy } from "../scripts/validate-roome-dil-source-taxonomy-0.1.mjs";
import { deriveRoomeDilContracts, readCanonicalRoomeDilContracts } from "../tools/build_roome_dil_source_taxonomy.mjs";

const canonical = await readCanonicalRoomeDilContracts();
const taxonomy = canonical.taxonomy;
const features = canonical.differentialFeatures;

test("admits the exact 157-type Roome source-local roster without geometry or internal objects", async () => {
  const result = await validateRoomeDilSourceTaxonomy();
  assert.deepEqual(result, {
    releaseId: "ohri-roome-dil-source-taxonomy-0.1.0",
    profileCount: 157,
    fullFeatureRowCount: 15900,
    quarantinedGeneCellCount: 26,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
  });
  assert.equal(taxonomy.profiles.reduce((sum, profile) => sum + profile.frequency, 0), 61444);
  assert.equal(taxonomy.scope.biologicalLitterPoolCount, 15);
  assert.equal(taxonomy.scope.retainedTechnicalOutputCount, 29);
});

test("gives each refined type record-specific metrics and a deterministic evidence fingerprint", () => {
  const fingerprint = (profile) => [
    profile.frequency,
    profile.percentOfDil,
    profile.meanGenesPerCell,
    profile.meanSilhouetteScore,
    profile.meanLisiScore,
    profile.displayFeatures.map((feature) => feature.gene).join(","),
  ].join("|");
  assert.equal(new Set(taxonomy.profiles.map(fingerprint)).size, 157);
  assert.notEqual(fingerprint(taxonomy.profiles[0]), fingerprint(taxonomy.profiles[1]));
  assert.equal(taxonomy.profiles.every((profile) => profile.displayFeatures.length === 6), true);
  assert.equal(taxonomy.profiles.every((profile) => profile.differentialFeatureAudit.sourceRowCount === 100), true);
});

test("retains all Table S7 rows and quarantines the exact 26 Excel-coerced gene cells", () => {
  assert.equal(features.rows.length, 15900);
  assert.equal(features.rows.filter((row) => row.gene !== null).length, 15874);
  assert.deepEqual(features.excludedDevelopmentalLabels, ["dILA-Immature", "dILB-Immature"]);
  assert.deepEqual(features.quarantinedGeneCells.slice(0, 3).map((item) => [item.sourceCell, item.spreadsheetDisplay]), [
    ["G277", "2025-03-03"],
    ["G870", "2025-03-03"],
    ["G1477", "2025-03-04"],
  ]);
  assert.equal(features.quarantinedGeneCells.every((item) => /not auto-repaired/i.test(item.interpretationBoundary)), true);
});

test("rejects a duplicated card fingerprint or unsupported geometry admission", async () => {
  const duplicated = structuredClone(taxonomy);
  duplicated.profiles[1].displayFeatures = structuredClone(duplicated.profiles[0].displayFeatures);
  await assert.rejects(() => validateRoomeDilSourceTaxonomy(duplicated, features), /deterministic top-six feature selection drifted/i);

  const inventedGeometry = structuredClone(taxonomy);
  inventedGeometry.scope.admittedGeometryCount = 1;
  await assert.rejects(() => validateRoomeDilSourceTaxonomy(inventedGeometry, features), /schema|zero geometry/i);
});

test("rejects changing a quarantined apparent date into an asserted gene", async () => {
  const repaired = structuredClone(features);
  const row = repaired.rows.find((candidate) => candidate.sourceRow === 277);
  row.gene = "Mar3";
  await assert.rejects(() => validateRoomeDilSourceTaxonomy(taxonomy, repaired), /retained or quarantined gene-row denominator drifted/i);
});

const s6Path = process.env.ROOME_TABLE_S6_PATH;
const s7Path = process.env.ROOME_TABLE_S7_PATH;
test("optionally re-derives the contracts from the exact Table S6 and S7 workbooks", { skip: !s6Path || !s7Path || !existsSync(s6Path) || !existsSync(s7Path) }, async () => {
  const derived = await deriveRoomeDilContracts({ s6Path, s7Path });
  assert.deepEqual(derived.taxonomy, taxonomy);
  assert.deepEqual(derived.differentialFeatures, features);
  assert.equal(await readFile(s6Path).then((bytes) => bytes.byteLength), 21302);
  assert.equal(await readFile(s7Path).then((bytes) => bytes.byteLength), 1005043);
});
