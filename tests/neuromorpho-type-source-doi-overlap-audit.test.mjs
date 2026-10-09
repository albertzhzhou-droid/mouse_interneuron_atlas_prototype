import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { validateNeuromorphoTypeSourceDoiOverlapAudit01 } from "../scripts/validate-neuromorpho-type-source-doi-overlap-audit-0.1.mjs";

const [audit, schema, typeAtlas] = await Promise.all([
  readFile(new URL("../data/neuromorpho-type-source-doi-overlap-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/neuromorpho-type-source-doi-overlap-audit-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/InterneuronTypeAtlas.tsx", import.meta.url), "utf8"),
]);

test("compares all 10 source taxonomy papers with the frozen 1,097-record DOI metadata universe", async () => {
  const result = await validateNeuromorphoTypeSourceDoiOverlapAudit01();
  assert.equal(result.auditId, "neuromorpho-type-source-doi-overlap-audit-0.1");
  assert.equal(result.release, "8.6.124");
  assert.equal(result.queryRecordCount, 1097);
  assert.equal(result.taxonomySourceCount, 10);
  assert.equal(result.sourceProfileCount, 387);
  assert.equal(result.exactDoiMatchedTaxonomySourceCount, 0);
  assert.equal(result.exactDoiMatchedRecordCount, 0);
  assert.equal(result.identityJoins, 0);
  assert.equal(result.geometryObjectsAdmitted, 0);
  assert.deepEqual(audit.rows.map((row) => row.namespace), [
    "russ-2021",
    "sathyamurthy-2018",
    "hayashi-2018:GSE108788",
    "haring-2018:GSE103840",
    "alkaslasi-2021:GSE167597",
    "iglesias-gonzalez-2021:gse185731:mmusculus",
    "roome-2026:GSE291462",
    "delile-2019:E-MTAB-7320",
    "crozat-2025:figshare-29430869-v2",
    "cano-gomez-2026:GSE318731",
  ]);
  assert.equal(audit.rows.reduce((total, row) => total + row.sourceProfileCount, 0), 387);
  assert.ok(audit.rows.every((row) => row.matchedRecordCount === 0 && row.matchedNeuronIds.length === 0));
});

test("audit schema is strict; deterministic validation reconciles match counts to source-local IDs", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
  const altered = structuredClone(audit);
  altered.unreviewedClaim = true;
  assert.equal(validate(altered), false);
});

test("coverage card keys by selected source namespace and preserves the publication-only boundary", () => {
  assert.match(typeAtlas, /neuromorphoTypeSourceDoiOverlapAudit\.rows\.find\(\(row\) => row\.namespace === selected\.namespace\)/);
  assert.match(typeAtlas, /selected\.sourceLabel/);
  assert.match(typeAtlas, /morphologyCoverage\.matchedRecordCount/);
  assert.match(typeAtlas, /publication-level metadata only—not subtype, specimen, or same-cell evidence/);
  assert.match(typeAtlas, /zero matches are limited to this pinned query/i);
  assert.match(typeAtlas, /literal source-label search/);
});

test("tampered identity, DOI counts, or geometry admissions fail the deterministic audit", async () => {
  for (const mutate of [
    (value) => { value.summary.identityJoins = 1; },
    (value) => { value.summary.geometryObjectsAdmitted = 1; },
    (value) => { value.rows[0].matchedNeuronIds = [104003]; },
    (value) => { value.rows[0].sourceProfileCount += 1; },
    (value) => { value.inputReceipts[0].sha256 = "0".repeat(64); },
  ]) {
    const altered = structuredClone(audit);
    mutate(altered);
    await assert.rejects(validateNeuromorphoTypeSourceDoiOverlapAudit01(altered));
  }
});
