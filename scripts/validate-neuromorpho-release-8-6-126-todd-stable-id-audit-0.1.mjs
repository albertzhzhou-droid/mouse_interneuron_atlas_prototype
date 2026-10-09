#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_PATH = "data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.json";
export const SCHEMA_PATH = "schemas/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.schema.json";
export const BASELINE_PATH = "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateNeuromorphoRelease126ToddStableIdAudit(audit, schema, baseline) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  check(validate(audit), `NeuroMorpho stable-ID audit schema violation: ${validate.errors?.map((item) => `${item.instancePath || "/"} ${item.message}`).join("; ")}`);
  const filters = new Map(audit.currentQuery.filters.map((filter) => [filter.field, filter.value]));
  check(filters.get("species") === "mouse" && filters.get("brain_region") === "spinal cord"
    && filters.get("cell_type") === "interneuron" && filters.get("archive") === "Todd",
  "The current query must retain its four exact no-age filters");
  check(baseline.repositoryRelease === "8.6.124"
    && baseline.summary?.queryRecordCount === 1097 && baseline.records?.length === 1097,
  "The pinned 8.6.124 baseline index identity or record count changed");
  const baselineToddQueryIds = new Set(baseline.records
    .filter((record) => record.officialMetadata?.species === "mouse"
      && record.officialMetadata?.archive === "Todd"
      && record.officialMetadata?.brain_region?.some((value) => value.toLowerCase() === "spinal cord")
      && record.officialMetadata?.cell_type?.some((value) => value.toLowerCase() === "interneuron"))
    .map((record) => record.officialMetadata.neuron_id));
  check(baselineToddQueryIds.size === 309 && baseline.summary.byArchive?.Todd === 309,
    "The 8.6.124 Todd query subset must remain 309 records");
  const candidateIds = audit.releaseSetReview.candidateRecords.map((record) => record.neuronId);
  const candidateNames = audit.releaseSetReview.candidateRecords.map((record) => record.neuronName);
  check(new Set(candidateIds).size === 30 && new Set(candidateNames).size === 30,
    "The Todd release-set stable IDs and source labels must be unique");
  check(candidateIds.every((id) => !baselineToddQueryIds.has(id)),
    "A claimed new Todd release-set stable ID already appears in the pinned baseline");
  check(audit.releaseSetReview.candidateStableIdCount === candidateIds.length
    && audit.releaseSetReview.candidateIdsAbsentFromBaseline === candidateIds.length
    && audit.comparison.candidateIdsComparedAgainstBaseline === candidateIds.length
    && audit.comparison.candidateIdsFoundInBaseline === 0
    && audit.comparison.releaseSetCandidatesAbsentFromBaseline === candidateIds.length,
  "The candidate/baseline stable-ID comparison counts do not reconcile");
  check(audit.baseline.archiveQueryRecordCount === baselineToddQueryIds.size,
    "The source audit's Todd-filtered baseline count must match the computed stable-ID subset");
  check(audit.comparison.baselineToddCountPlusCandidates === baselineToddQueryIds.size + candidateIds.length
    && audit.comparison.observedCurrentQueryHits === audit.currentQuery.observedMetadataUiHitCount
    && audit.comparison.arithmeticCountReconciles === true
    && audit.comparison.arithmeticIsNotACompleteCurrentRosterProof === true
    && audit.currentQuery.completeCurrentStableIdRosterRetrieved === false
    && audit.comparison.completeCurrentQueryDeltaStatus === "unresolved_without_complete_current_id_roster",
  "The arithmetic-only count reconciliation or incomplete-roster caveat changed");
  check(Object.values(audit.admission).every((value) => value === 0)
    && audit.sourceAssetReview.candidateSourceFilesDownloaded === 0
    && audit.sourceAssetReview.candidateSourceFilesHashed === 0
    && audit.sourceAssetReview.objectLevelReuseTermsVerified === false,
  "Stable-ID discovery cannot silently admit files, geometry, joins or measurements");
  check(/arithmetic does not prove a complete current ID census/.test(audit.interpretationBoundary)
    && /object-level reuse terms/.test(audit.interpretationBoundary),
  "The candidate ID delta must remain separate from full-census and rights claims");
  return {
    auditId: audit.auditId,
    release: audit.currentRelease.version,
    currentUiHits: audit.currentQuery.observedMetadataUiHitCount,
    baselineRecordCount: audit.baseline.queryRecordCount,
    baselineToddQueryCount: baselineToddQueryIds.size,
    candidateStableIds: candidateIds.length,
    candidateIdsFoundInBaseline: 0,
    currentRosterComplete: audit.currentQuery.completeCurrentStableIdRosterRetrieved,
    sourceFilesDownloaded: audit.sourceAssetReview.candidateSourceFilesDownloaded,
    geometryObjectsAdmitted: audit.admission.newGeometryObjectsAdmitted,
  };
}

export async function loadAndValidateNeuromorphoRelease126ToddStableIdAudit() {
  const [audit, schema, baseline] = await Promise.all([
    readFile(path.join(ROOT, AUDIT_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, SCHEMA_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, BASELINE_PATH), "utf8").then(JSON.parse),
  ]);
  return { audit, baseline, summary: validateNeuromorphoRelease126ToddStableIdAudit(audit, schema, baseline) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAndValidateNeuromorphoRelease126ToddStableIdAudit()
    .then(({ summary }) => process.stdout.write(`${JSON.stringify(summary)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
