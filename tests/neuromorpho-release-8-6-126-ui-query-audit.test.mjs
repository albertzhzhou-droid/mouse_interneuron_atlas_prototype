import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateNeuromorphoRelease126UiAudit } from "../scripts/validate-neuromorpho-release-8-6-126-ui-query-audit-0.1.mjs";

const load = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));

test("8.6.126 UI audit preserves the 339-hit lead without inventing record identities", async () => {
  const [audit, schema] = await Promise.all([
    load("../data/neuromorpho-release-8-6-126-ui-query-audit-0.1.json"),
    load("../schemas/neuromorpho-release-8-6-126-ui-query-audit-0.1.schema.json"),
  ]);
  const result = validateNeuromorphoRelease126UiAudit(audit, schema);
  assert.equal(result.release, "8.6.126");
  assert.equal(result.metadataUiHits, 339);
  assert.equal(result.baselineRecordCount, 1097);
  assert.equal(result.stableIdsCompared, 0);
  assert.equal(result.newRecordsAdmitted, 0);
  assert.equal(result.geometryObjectsAdmitted, 0);
});

test("8.6.126 UI audit rejects false ID deltas, denominators, or geometry admission", async () => {
  const [base, schema] = await Promise.all([
    load("../data/neuromorpho-release-8-6-126-ui-query-audit-0.1.json"),
    load("../schemas/neuromorpho-release-8-6-126-ui-query-audit-0.1.schema.json"),
  ]);
  for (const mutate of [
    (value) => { value.query.observedMetadataUiHitCount = 30; },
    (value) => { value.query.ageFilterApplied = true; },
    (value) => { value.comparison.candidateRecordIdsCompared = 339; },
    (value) => { value.comparison.addedRecordCount = 339; },
    (value) => { value.admission.newGeometryObjectsAdmitted = 1; },
    (value) => { value.admission.measurements = 1; },
    (value) => { value.query.filters.find((filter) => filter.field === "archive").value = "all"; },
  ]) {
    const altered = structuredClone(base);
    mutate(altered);
    assert.throws(() => validateNeuromorphoRelease126UiAudit(altered, schema));
  }
});

test("8.6.126 UI audit validates against its strict JSON schema", async () => {
  const [audit, schema] = await Promise.all([
    load("../data/neuromorpho-release-8-6-126-ui-query-audit-0.1.json"),
    load("../schemas/neuromorpho-release-8-6-126-ui-query-audit-0.1.schema.json"),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
});
