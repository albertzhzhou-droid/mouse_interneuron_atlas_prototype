#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_PATH = path.join(ROOT, "data/trevisan-v1-age-atlas-reference-0.1.json");
export const SCHEMA_PATH = path.join(ROOT, "schemas/trevisan-v1-age-atlas-reference-0.1.schema.json");
const EXPECTED_ASSIGNMENTS = [
  "Foxp2 clade",
  "Rnf220-enriched V1 subset",
  "Foxp2 clade",
  "Pou6f2 clade",
  "Foxp2 clade",
  "Sp8 clade; Pou6f2 co-expression noted",
  "Rnf220-enriched V1 subset",
  "Sp8 clade",
  "Calb1 proxy for the MafA clade",
  "Nr5a2-characterized V1 subset",
  "Sp8 clade; Oc2-associated subset",
  "Foxp2 clade",
  "Pou6f2 clade",
  "Pou6f2 clade",
];

export async function validateTrevisanV1AgeAtlasReference01(override = null) {
  const [diskReference, schema] = await Promise.all([
    readFile(DATA_PATH, "utf8").then(JSON.parse),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
  ]);
  const reference = override ?? diskReference;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(reference)) throw new Error(`Trevisan V1 reference schema failure: ${JSON.stringify(validate.errors)}`);
  const ids = reference.clusters.map((cluster) => cluster.clusterId);
  if (reference.releaseId !== "trevisan-v1-age-atlas-reference-0.1"
    || reference.source.doi !== "10.1038/s41467-026-76522-3"
    || reference.source.articleLicense !== "CC BY 4.0"
    || reference.study.postnatalAges.join("|") !== "P0|P14|P28|P56"
    || reference.study.selectedNucleusCount !== 89494
    || reference.study.reportedClusterCount !== 14
    || ids.join("|") !== "0|1|2|3|4|5|6|7|8|9|10|11|12|13"
    || reference.clusters.some((cluster, index) => cluster.sourceAssignment !== EXPECTED_ASSIGNMENTS[index])
    || reference.study.exactPerClusterCountsImported !== false
    || reference.study.exactBarcodeRosterImported !== false
    || reference.study.clusterByRegionAssignmentsImported !== false
    || reference.study.rawExpressionDataBundled !== false
    || reference.study.geoPayloadBytesDownloaded !== 0
    || reference.admissionBoundary.canonicalSourceProfileContribution !== 0
    || reference.admissionBoundary.includedInExisting387ProfileDenominator !== false
    || reference.admissionBoundary.includedInMain3dScene !== false
    || reference.admissionBoundary.morphologyGeometryObjectCount !== 0
    || reference.admissionBoundary.internalStructureObjectCount !== 0
    || reference.admissionBoundary.sameCellJoinCount !== 0
    || reference.admissionBoundary.atlasRegistrationCount !== 0
    || reference.admissionBoundary.measurementCount !== 0) {
    throw new Error("Trevisan V1 cluster order, source assignments, scope or non-admission boundary changed");
  }
  return {
    releaseId: reference.releaseId,
    sourceDoi: reference.source.doi,
    selectedNucleusCount: reference.study.selectedNucleusCount,
    reportedClusterCount: ids.length,
    ageCount: reference.study.postnatalAges.length,
    exactPerClusterCountsImported: reference.study.exactPerClusterCountsImported,
    morphologyGeometryObjectCount: reference.admissionBoundary.morphologyGeometryObjectCount,
    internalStructureObjectCount: reference.admissionBoundary.internalStructureObjectCount,
    canonicalSourceProfileContribution: reference.admissionBoundary.canonicalSourceProfileContribution,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateTrevisanV1AgeAtlasReference01()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
