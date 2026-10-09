#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { AUDIT_PATH, buildNeuromorphoTypeSourceDoiOverlapAudit01 } from "../tools/build_neuromorpho_type_source_doi_overlap_audit_0_1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = path.join(ROOT, "schemas/neuromorpho-type-source-doi-overlap-audit-0.1.schema.json");

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export async function validateNeuromorphoTypeSourceDoiOverlapAudit01(override = null) {
  const [diskAudit, schema, expected] = await Promise.all([
    readFile(AUDIT_PATH, "utf8").then(JSON.parse),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    buildNeuromorphoTypeSourceDoiOverlapAudit01(),
  ]);
  const audit = override ?? diskAudit;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(audit)) throw new Error(`NeuroMorpho type/source DOI audit schema failure: ${JSON.stringify(validate.errors)}`);
  if (stableJson(audit) !== stableJson(expected)) throw new Error("NeuroMorpho type/source DOI audit differs from the pinned taxonomy and morphology metadata rebuild");
  const namespaces = audit.rows.map((row) => row.namespace);
  const matchedIds = audit.rows.flatMap((row) => row.matchedNeuronIds);
  if (new Set(namespaces).size !== 10 || new Set(matchedIds).size !== matchedIds.length
    || audit.summary.sourceProfileCount !== 387
    || audit.summary.exactDoiMatchedTaxonomySourceCount !== audit.rows.filter((row) => row.matchedRecordCount > 0).length
    || audit.summary.exactDoiMatchedRecordCount !== matchedIds.length
    || audit.summary.identityJoins !== 0 || audit.summary.geometryObjectsAdmitted !== 0
    || audit.summary.internalStructureObjectsAdmitted !== 0 || audit.summary.registrations !== 0
    || audit.summary.measurements !== 0 || audit.summary.payloadBytesDownloaded !== 0) {
    throw new Error("NeuroMorpho type/source DOI coverage denominator, uniqueness, or no-admission boundary changed");
  }
  return {
    auditId: audit.auditId,
    release: audit.morphologyUniverse.release,
    queryRecordCount: audit.morphologyUniverse.queryRecordCount,
    taxonomySourceCount: audit.summary.taxonomySourceCount,
    sourceProfileCount: audit.summary.sourceProfileCount,
    exactDoiMatchedTaxonomySourceCount: audit.summary.exactDoiMatchedTaxonomySourceCount,
    exactDoiMatchedRecordCount: audit.summary.exactDoiMatchedRecordCount,
    identityJoins: audit.summary.identityJoins,
    geometryObjectsAdmitted: audit.summary.geometryObjectsAdmitted,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeuromorphoTypeSourceDoiOverlapAudit01()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
