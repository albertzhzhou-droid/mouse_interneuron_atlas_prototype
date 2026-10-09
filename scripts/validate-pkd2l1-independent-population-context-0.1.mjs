#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONTEXT_PATH = "data/pkd2l1-independent-population-context-0.1.json";
export const SCHEMA_PATH = "schemas/pkd2l1-independent-population-context-0.1.schema.json";

export function validatePkd2l1IndependentPopulationContext(context, schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(context)) {
    throw new Error(`PKD2L1 population-context schema violation: ${validate.errors?.map((item) => `${item.instancePath || "/"} ${item.message}`).join("; ")}`);
  }

  const frame = context.studyFrame;
  const boundary = context.identityAndRepresentationBoundary;
  const sum = (rows) => rows.reduce((total, row) => total + row.count, 0);
  if (sum(frame.sectionCountsByAge) !== frame.sectionCount || sum(frame.sectionCountsBySex) !== frame.sectionCount) {
    throw new Error("PKD2L1 section denominators do not reconcile to the 811-section study frame");
  }
  if (context.publishedSummaries.length !== 8
    || context.publishedSummaries.filter((row) => row.stratum === "age").length !== 2
    || context.publishedSummaries.filter((row) => row.stratum === "sex").length !== 2
    || context.publishedSummaries.filter((row) => row.stratum === "spinal_region").length !== 4) {
    throw new Error("PKD2L1 Table 5 strata changed; expected 2 age, 2 sex and 4 spinal-region summaries");
  }
  if (context.publishedSummaries.some((row) => row.stratum === "spinal_region" && row.sectionsInStudyFrame !== null)) {
    throw new Error("Unreported region-level section counts must remain missing, not imputed");
  }
  if (context.publishedSummaries.some((row) => row.stratum !== "spinal_region" && row.sectionsInStudyFrame === null)) {
    throw new Error("Reported age/sex section denominators must remain explicit");
  }
  if (context.source.publicRawDataDepositVerified !== false || context.source.rawImageFilesBundled !== false
    || context.imagingMethods.imageFilesAvailableInThisProject !== false
    || boundary.perCellCoordinatesAvailable !== false || boundary.perCellMorphologyAvailable !== false
    || boundary.reconstructedCellsAdmitted !== 0 || boundary.geometryPrimitivesAdmitted !== 0
    || boundary.sameCellJoinToCrozat !== false || boundary.atlasRegistrationCount !== 0
    || boundary.includedInInterneuronTypeCounts !== false) {
    throw new Error("PKD2L1 population context must remain aggregate-only, unjoined and non-geometric");
  }
  if (!/without undue reservation/i.test(context.source.rawDataAvailabilityStatement)
    || !/nested within 18 mice/i.test(frame.nestingBoundary)
    || !/uncertain/i.test(boundary.distalCellIdentity)) {
    throw new Error("PKD2L1 raw-data, nested-sample or distal-identity boundary changed");
  }

  return {
    contextId: context.contextId,
    mouseCount: frame.mouseCount,
    sectionCount: frame.sectionCount,
    ageSexSectionDenominatorsReconciled: true,
    tableFiveStrata: context.publishedSummaries.length,
    publicRawDataDepositVerified: context.source.publicRawDataDepositVerified,
    perCellMorphologyAvailable: boundary.perCellMorphologyAvailable,
    geometryPrimitivesAdmitted: boundary.geometryPrimitivesAdmitted,
    sameCellJoinToCrozat: boundary.sameCellJoinToCrozat,
  };
}

export async function loadAndValidatePkd2l1IndependentPopulationContext() {
  const [context, schema] = await Promise.all([
    readFile(path.join(ROOT, CONTEXT_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, SCHEMA_PATH), "utf8").then(JSON.parse),
  ]);
  return { context, summary: validatePkd2l1IndependentPopulationContext(context, schema) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAndValidatePkd2l1IndependentPopulationContext()
    .then(({ summary }) => process.stdout.write(`${JSON.stringify(summary)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
