import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateTrevisanV1GeoSeriesSampleAudit01 } from "../scripts/validate-trevisan-v1-geo-series-sample-audit-0.1.mjs";

const [audit, schema, component, css] = await Promise.all([
  readFile(new URL("../data/trevisan-v1-geo-series-sample-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/trevisan-v1-geo-series-sample-audit-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/TrevisanV1AgeAtlas.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("validates the full 29-record GEO series roster and five parser exceptions", async () => {
  const result = await validateTrevisanV1GeoSeriesSampleAudit01();
  assert.equal(result.geoAccession, "GSE275595");
  assert.equal(result.sampleRecordCount, 29);
  assert.equal(result.expectedPostnatalTitlePatternMatchCount, 24);
  assert.equal(result.parserExceptionCount, 5);
  assert.deepEqual(result.exceptionAccessions, ["GSM8480601", "GSM8480602", "GSM8480603", "GSM8480604", "GSM8480605"]);
  assert.equal(result.representativeSampleMetadataCount, 3);
  assert.equal(result.matrixPayloadDownloadedOrChecksummed, false);
  assert.equal(result.geoFileSpecificReuseTermsVerified, false);
  assert.equal(result.morphologyGeometryObjectCount, 0);
  assert.equal(audit.source.seriesSupplementaryTarBytes, 1450055680);
  assert.deepEqual(audit.source.representativeSampleMatrixRecord.components.map(({ bytes }) => bytes), [41212, 290896, 49356598]);
});

test("strict schema and semantic checks reject changed rosters, parser outputs, rights, or geometry claims", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
  const mutations = [
    (value) => { value.geoSampleTitlesObserved.pop(); },
    (value) => { value.analysisCodeParser.sampleTitlePatternMatchCount = 25; },
    (value) => { value.sampleTitlePatternExceptionRecords[4].parserAge = "13.5"; },
    (value) => { value.sampleTitlePatternExceptionRecords[0].geoRegion = "Cervical"; },
    (value) => { value.notYetVerifiedOrImported.anyGsmMatrixPayloadDownloadedOrChecksummed = true; },
    (value) => { value.notYetVerifiedOrImported.geoFileSpecificReuseTermsVerified = true; },
    (value) => { value.admissionBoundary.morphologyGeometryObjectCount = 1; },
    (value) => { value.admissionBoundary.sameCellJoinCount = 1; },
  ];
  for (const mutate of mutations) {
    const altered = structuredClone(audit);
    mutate(altered);
    await assert.rejects(validateTrevisanV1GeoSeriesSampleAudit01(altered));
  }
});

test("the English V1 panel shows sample-roster limits and links to exception records", () => {
  assert.match(component, /GEO SAMPLE ROSTER/);
  assert.match(component, /seriesSampleRecordCount/);
  assert.match(component, /sampleTitlePatternMatchCount/);
  assert.match(component, /sampleTitlePatternExceptionRecords/);
  assert.match(component, /Whole cord/);
  assert.match(component, /sampleRecordBaseUrl/);
  assert.match(component, /CURRENT_INPUT_AUDIT\.representativeMatrix\.observedNonzeroEntryCount/);
  assert.match(component, /All \{CURRENT_INPUT_AUDIT\.summary\.sampleCharacteristicsChecked\} sample characteristics are now checked/);
  assert.match(component, /This proves input structure; its final-figure biological mapping remains conflicted/);
  assert.match(component, /no runtime nucleus roster, exact cluster assignment or per-animal identity/);
  assert.doesNotMatch(component, /No matrix payload was downloaded or checksummed/);
  assert.match(component, /geoFileSpecificReuseTermsVerified/);
  assert.match(css, /trevisan-v1-geo-sample-audit/);
});
