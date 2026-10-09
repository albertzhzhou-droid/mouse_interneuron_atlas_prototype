import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateNeuromorphoRelease126ToddStableIdAudit } from "../scripts/validate-neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.mjs";

const load = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));
const EXPECTED_RELEASE_ID_NAME_PAIRS = [
  [322379, "AT_11-05-21A_s6_NTS_cell_1"], [322380, "AT_11-05-21B_s7_NTS_cell_4"],
  [322381, "AT_11-05-21A_s8_NTS_cell_10"], [322382, "AT_20-04-21B_s8_NTS_cell_5"],
  [322383, "AT_11-05-21A_s7_NTS_cell_7"], [322384, "AT_11-05-21B_s8_NTS_cell_8"],
  [322385, "AT_11-05-21A_s8_NTS_cell_5"], [322386, "AT_11-05-21A_s8_NTS_cell_3"],
  [322387, "AT_20-04-21B_s8_NTS_cell_3"], [322388, "AT_11-05-21A_s8_NTS_cell_6"],
  [322389, "AT_20-04-21B_s8_NTS_cell_9"], [322390, "AT_20-04-21B_s8_NTS_cell_8"],
  [322391, "AT_11-05-21B_s7_NTS_cell_2"], [322392, "AT_20-04-21B_s8_NTS_cell_2"],
  [322393, "AT_11-05-21A_s7_NTS_cell_9"], [322394, "AT_11-05-21A_s6_NTS_cell_2"],
  [322395, "AT_11-05-21A_s7_NTS_cell_8"], [322396, "AT_20-04-21B_s8_NTS_cell_7"],
  [322397, "AT_20-04-21B_s8_NTS_cell_6"], [322398, "AT_11-05-21B_s8_NTS_cell_9"],
  [322399, "AT_11-05-21A_s8_NTS_cell_4"], [322400, "AT_11-05-21B_s7_NTS_cell_1"],
  [322401, "AT_11-05-21B_s8_NTS_cell_7"], [322402, "AT_11-05-21B_s8_NTS_cell_6"],
  [322403, "AT_11-05-21B_s8_NTS_cell_10"], [322404, "AT_20-04-21B_s8_NTS_cell_10"],
  [322405, "AT_11-05-21B_s7_NTS_cell_5"], [322406, "AT_11-05-21B_s7_NTS_cell_3"],
  [322407, "AT_20-04-21B_s8_NTS_cell_1"], [322408, "AT_20-04-21B_s8_NTS_cell_4"],
];

test("8.6.126 Todd audit reconciles 30 new stable IDs without claiming a complete release census", async () => {
  const [audit, schema, baseline] = await Promise.all([
    load("../data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.json"),
    load("../schemas/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.schema.json"),
    load("../public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json"),
  ]);
  const result = validateNeuromorphoRelease126ToddStableIdAudit(audit, schema, baseline);
  assert.deepEqual(audit.releaseSetReview.candidateRecords.map(({ neuronId, neuronName }) => [neuronId, neuronName]), EXPECTED_RELEASE_ID_NAME_PAIRS);
  assert.equal(result.currentUiHits, 339);
  assert.equal(result.baselineRecordCount, 1097);
  assert.equal(result.baselineToddQueryCount, 309);
  assert.equal(result.candidateStableIds, 30);
  assert.equal(result.candidateIdsFoundInBaseline, 0);
  assert.equal(result.currentRosterComplete, false);
  assert.equal(result.sourceFilesDownloaded, 0);
  assert.equal(result.geometryObjectsAdmitted, 0);
});

test("8.6.126 Todd audit rejects duplicated IDs, false count proof, and geometry or rights admission", async () => {
  const [base, schema, baseline] = await Promise.all([
    load("../data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.json"),
    load("../schemas/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.schema.json"),
    load("../public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json"),
  ]);
  for (const mutate of [
    (value) => { value.releaseSetReview.candidateRecords[1].neuronId = value.releaseSetReview.candidateRecords[0].neuronId; },
    (value) => { value.currentQuery.completeCurrentStableIdRosterRetrieved = true; },
    (value) => { value.comparison.removedRecordCount = 1; },
    (value) => { value.sourceAssetReview.objectLevelReuseTermsVerified = true; },
    (value) => { value.admission.newGeometryObjectsAdmitted = 1; },
    (value) => { value.comparison.baselineToddCountPlusCandidates = 1097 + 30; },
  ]) {
    const altered = structuredClone(base);
    mutate(altered);
    assert.throws(() => validateNeuromorphoRelease126ToddStableIdAudit(altered, schema, baseline));
  }
});

test("8.6.126 Todd stable-ID audit validates against its strict JSON schema", async () => {
  const [audit, schema] = await Promise.all([
    load("../data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.json"),
    load("../schemas/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.schema.json"),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
});
