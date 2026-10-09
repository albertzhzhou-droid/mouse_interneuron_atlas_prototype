#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_PATH = "data/neuromorpho-release-8-6-125-query-delta-audit-0.1.json";
export const SCHEMA_PATH = "schemas/neuromorpho-release-8-6-125-query-delta-audit-0.1.schema.json";
const BASELINE_INDEX_PATH = "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateNeuromorphoReleaseDeltaAudit(audit, schema, baselineIndex) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  check(validate(audit), `NeuroMorpho release-delta schema violation: ${validate.errors?.map((item) => `${item.instancePath || "/"} ${item.message}`).join("; ")}`);
  check(audit.comparison.baselineIndexPath === BASELINE_INDEX_PATH
    && baselineIndex.release === "8.6.124"
    && baselineIndex.summary?.queryRecordCount === 142
    && baselineIndex.summary?.uniqueNeuronIdCount === 142
    && baselineIndex.records.length === audit.comparison.baselineRecordCount, "NeuroMorpho baseline must remain the exact 8.6.124 142-record index");
  check(baselineIndex.snapshot?.queryTotal === 142
    && baselineIndex.snapshot?.completeness === "complete_single_page_sorted_official_api_query", "NeuroMorpho pinned baseline query completeness changed");
  check(audit.query.parameters.page === 0
    && audit.query.parameters.size === 500
    && audit.query.parameters.sort === "neuron_id,asc"
    && audit.comparison.stableNeuronIdsAllMatch === true
    && audit.comparison.semanticallyUnchangedRecordCount === 142, "NeuroMorpho 8.6.125 exact-query metadata comparison is incomplete");
  check(audit.observedResponseReceipt.rawResponseRetained === false
    && audit.observedResponseReceipt.independentReproductionStatus === "requires_exact_GET_rerun", "Non-retained API evidence cannot be presented as independently reproducible");
  const boundaries = audit.assetAndAdmissionBoundaries;
  check(boundaries.geometryAssetBytesRechecked === false
    && boundaries.perObjectGeometryHashesRechecked === false
    && boundaries.dimensionalityDeltaAuditedAtAssetLevel === false
    && boundaries.fileSpecificReuseAndAttributionRightsRechecked === false
    && boundaries.promotedIntoActiveModel === false
    && boundaries.activeGeometryReleaseRemains === "8.6.124"
    && boundaries.sameCellInternalStructureCount === 0
    && boundaries.crossSourceIdentityCount === 0
    && boundaries.registrationCount === 0, "8.6.125 metadata delta cannot promote geometry, rights, identities or internal structures");
  return {
    auditId: audit.auditId,
    baselineRelease: audit.comparison.baselineRelease,
    candidateRelease: audit.candidateRepositoryRelease.version,
    comparedRecords: audit.comparison.candidateRecordCount,
    changedSemanticMetadataRecords: audit.comparison.changedSemanticMetadataRecordCount,
    activeGeometryRelease: boundaries.activeGeometryReleaseRemains,
    geometryAndRightsRechecked: false,
  };
}

export async function loadAndValidateNeuromorphoReleaseDeltaAudit() {
  const [audit, schema, baselineIndex] = await Promise.all([
    readFile(path.join(ROOT, AUDIT_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, SCHEMA_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, BASELINE_INDEX_PATH), "utf8").then(JSON.parse),
  ]);
  return { audit, summary: validateNeuromorphoReleaseDeltaAudit(audit, schema, baselineIndex) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAndValidateNeuromorphoReleaseDeltaAudit()
    .then(({ summary }) => process.stdout.write(`${JSON.stringify(summary)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
