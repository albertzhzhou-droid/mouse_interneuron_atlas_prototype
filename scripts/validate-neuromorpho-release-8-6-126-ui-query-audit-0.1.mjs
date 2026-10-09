#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_PATH = "data/neuromorpho-release-8-6-126-ui-query-audit-0.1.json";
export const SCHEMA_PATH = "schemas/neuromorpho-release-8-6-126-ui-query-audit-0.1.schema.json";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateNeuromorphoRelease126UiAudit(audit, schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  check(validate(audit), `NeuroMorpho 8.6.126 UI audit schema violation: ${validate.errors?.map((item) => `${item.instancePath || "/"} ${item.message}`).join("; ")}`);
  const filters = new Map(audit.query.filters.map((filter) => [filter.field, filter.value]));
  check(filters.get("species") === "mouse" && filters.get("brain_region") === "spinal cord"
    && filters.get("cell_type") === "interneuron" && filters.get("archive") === "Todd",
  "The four observed metadata UI filters changed");
  check(audit.observedRelease.version === "8.6.126" && audit.observedRelease.releaseDate === "2026-09-23"
    && audit.observedRelease.reportedRepositoryCellCount === 298745,
  "The official release banner receipt changed");
  check(audit.query.observedMetadataUiHitCount === 339 && audit.query.ageFilterApplied === false
    && audit.query.stableNeuronIdsRetrieved === false && audit.query.machineReadableResponseRetrieved === false,
  "The 339 UI-hit count must remain separate from machine-readable record identity");
  check(audit.comparison.baselineRelease === "8.6.124" && audit.comparison.baselineQueryRecordCount === 1097
    && audit.comparison.candidateRecordIdsCompared === 0 && audit.comparison.addedRecordCount === null
    && audit.comparison.removedRecordCount === null && audit.comparison.changedRecordCount === null,
  "The 8.6.124 denominator must not be silently reconciled without stable IDs");
  check(Object.values(audit.admission).slice(0, 6).every((value) => value === 0),
    "The UI query audit cannot admit records, geometry, joins or measurements");
  check(/not a record-ID census/.test(audit.query.countSemantics)
    && /discovery lead only/.test(audit.admission.interpretation)
    && /does not identify any returned neuron/.test(audit.interpretationBoundary),
  "The audit must retain its denominator and object-identity boundaries");
  return {
    auditId: audit.auditId,
    release: audit.observedRelease.version,
    metadataUiHits: audit.query.observedMetadataUiHitCount,
    baselineRecordCount: audit.comparison.baselineQueryRecordCount,
    stableIdsCompared: audit.comparison.candidateRecordIdsCompared,
    newRecordsAdmitted: audit.admission.newRecordsAdmitted,
    geometryObjectsAdmitted: audit.admission.newGeometryObjectsAdmitted,
  };
}

export async function loadAndValidateNeuromorphoRelease126UiAudit() {
  const [audit, schema] = await Promise.all([
    readFile(path.join(ROOT, AUDIT_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, SCHEMA_PATH), "utf8").then(JSON.parse),
  ]);
  return { audit, summary: validateNeuromorphoRelease126UiAudit(audit, schema) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAndValidateNeuromorphoRelease126UiAudit()
    .then(({ summary }) => process.stdout.write(`${JSON.stringify(summary)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
