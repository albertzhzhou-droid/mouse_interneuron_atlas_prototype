#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = path.join(ROOT, "data/trevisan-v1-geo-series-sample-audit-0.1.json");
const SCHEMA_PATH = path.join(ROOT, "schemas/trevisan-v1-geo-series-sample-audit-0.1.schema.json");

const regularTitles = [];
for (const age of ["P0", "P14", "P28", "P56"]) {
  for (const region of ["C", "L", "T"]) {
    for (const replicate of ["1", "2"]) regularTitles.push(`${age}${region}R${replicate}`);
  }
}
const expectedTitles = [
  ...regularTitles.map((sampleTitle, index) => ({ geoSampleAccession: `GSM${8480577 + index}`, sampleTitle })),
  ...["P0HetR1", "P0KoR1", "P0HetR2", "P0KoR2", "E135HetR1"].map((sampleTitle, index) => ({
    geoSampleAccession: `GSM${8480601 + index}`,
    sampleTitle,
  })),
];

const expectedRepresentativeMetadata = [
  { geoSampleAccession: "GSM8480577", sampleTitle: "P0CR1", age: "P0", region: "Cervical", replicate: "1" },
  { geoSampleAccession: "GSM8480588", sampleTitle: "P14TR2", age: "P14", region: "Thoracic", replicate: "2" },
  { geoSampleAccession: "GSM8480598", sampleTitle: "P56LR2", age: "P56", region: "Lumbar", replicate: "2" },
];

const expectedExceptions = [
  { geoSampleAccession: "GSM8480601", sampleTitle: "P0HetR1", geoAge: "P0", geoRegion: "Whole cord", geoReplicate: "1", geoGenotype: "En1::Cre heterozygous; RC.lsl.Sun1-sfGFP", parserAge: "0", parserRegion: "t", parserReplicate: "1" },
  { geoSampleAccession: "GSM8480602", sampleTitle: "P0KoR1", geoAge: "P0", geoRegion: "Whole cord", geoReplicate: "1", geoGenotype: "En1::Cre homozygous; RC.lsl.Sun1-sfGFP", parserAge: "0", parserRegion: "o", parserReplicate: "1" },
  { geoSampleAccession: "GSM8480603", sampleTitle: "P0HetR2", geoAge: "P0", geoRegion: "Whole cord", geoReplicate: "2", geoGenotype: "En1::Cre heterozygous; RC.lsl.Sun1-sfGFP", parserAge: "0", parserRegion: "t", parserReplicate: "2" },
  { geoSampleAccession: "GSM8480604", sampleTitle: "P0KoR2", geoAge: "P0", geoRegion: "Whole cord", geoReplicate: "2", geoGenotype: "En1::Cre homozygous; RC.lsl.Sun1-sfGFP", parserAge: "0", parserRegion: "o", parserReplicate: "2" },
  { geoSampleAccession: "GSM8480605", sampleTitle: "E135HetR1", geoAge: "E13.5", geoRegion: "Whole cord", geoReplicate: "1", geoGenotype: "En1::Cre heterozygous; RC.lsl.Sun1-sfGFP", parserAge: "135", parserRegion: "t", parserReplicate: "1" },
];

function deriveFromTitle(sampleTitle) {
  return {
    age: sampleTitle.match(/[0-9]+/)?.[0] ?? null,
    region: sampleTitle.at(-3) ?? null,
    replicate: sampleTitle.at(-1) ?? null,
  };
}

export async function validateTrevisanV1GeoSeriesSampleAudit01(override = null) {
  const [diskAudit, schema] = await Promise.all([
    readFile(DATA_PATH, "utf8").then(JSON.parse),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
  ]);
  const audit = override ?? diskAudit;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(audit)) throw new Error(`Trevisan V1 GEO sample audit schema failure: ${JSON.stringify(validate.errors)}`);

  assert.equal(audit.source.seriesSampleRecordCount, 29);
  assert.deepEqual(audit.geoSampleTitlesObserved, expectedTitles, "GEO sample-title roster or stable GSM ordering changed");
  const pattern = new RegExp(audit.analysisCodeParser.expectedPostnatalSampleTitlePattern);
  const matches = audit.geoSampleTitlesObserved.filter(({ sampleTitle }) => pattern.test(sampleTitle));
  const exceptions = audit.geoSampleTitlesObserved.filter(({ sampleTitle }) => !pattern.test(sampleTitle));
  assert.equal(matches.length, 24, "expected 24 postnatal title-pattern matches");
  assert.equal(exceptions.length, 5, "expected five title-pattern exceptions");
  assert.deepEqual(exceptions.map(({ geoSampleAccession, sampleTitle }) => ({ geoSampleAccession, sampleTitle })), expectedTitles.slice(-5));
  assert.deepEqual(audit.representativeSampleMetadataVerified, expectedRepresentativeMetadata);
  assert.deepEqual(audit.sampleTitlePatternExceptionRecords, expectedExceptions);
  for (const record of audit.sampleTitlePatternExceptionRecords) {
    const parsed = deriveFromTitle(record.sampleTitle);
    assert.equal(parsed.age, record.parserAge, `${record.geoSampleAccession} parser age changed`);
    assert.equal(parsed.region, record.parserRegion, `${record.geoSampleAccession} parser region changed`);
    assert.equal(parsed.replicate, record.parserReplicate, `${record.geoSampleAccession} parser replicate changed`);
    assert.equal(record.geoRegion, "Whole cord");
  }
  if (audit.notYetVerifiedOrImported.anyGsmMatrixPayloadDownloadedOrChecksummed !== false
    || audit.notYetVerifiedOrImported.all29SampleCharacteristicsInspected !== false
    || audit.notYetVerifiedOrImported.perCellBarcodeToMatrixCrosswalkValidated !== false
    || audit.notYetVerifiedOrImported.perCellAgeClusterRegionRowsReproduced !== false
    || audit.notYetVerifiedOrImported.geoFileSpecificReuseTermsVerified !== false
    || audit.notYetVerifiedOrImported.supplementaryData3DownloadedOrInspected !== false
    || audit.admissionBoundary.canonicalSourceProfileContribution !== 0
    || audit.admissionBoundary.includedInExisting387ProfileDenominator !== false
    || audit.admissionBoundary.includedInMain3dScene !== false
    || audit.admissionBoundary.morphologyGeometryObjectCount !== 0
    || audit.admissionBoundary.internalStructureObjectCount !== 0
    || audit.admissionBoundary.sameCellJoinCount !== 0
    || audit.admissionBoundary.atlasRegistrationCount !== 0
    || audit.admissionBoundary.measurementCount !== 0) {
    throw new Error("Trevisan V1 GEO audit changed an unverified-data or non-admission boundary");
  }
  return {
    auditId: audit.auditId,
    geoAccession: audit.source.seriesAccession,
    sampleRecordCount: audit.source.seriesSampleRecordCount,
    expectedPostnatalTitlePatternMatchCount: matches.length,
    parserExceptionCount: exceptions.length,
    exceptionAccessions: exceptions.map(({ geoSampleAccession }) => geoSampleAccession),
    representativeSampleMetadataCount: audit.representativeSampleMetadataVerified.length,
    matrixPayloadDownloadedOrChecksummed: audit.notYetVerifiedOrImported.anyGsmMatrixPayloadDownloadedOrChecksummed,
    geoFileSpecificReuseTermsVerified: audit.notYetVerifiedOrImported.geoFileSpecificReuseTermsVerified,
    morphologyGeometryObjectCount: audit.admissionBoundary.morphologyGeometryObjectCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateTrevisanV1GeoSeriesSampleAudit01()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
