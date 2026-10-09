#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateNeuromorphoRelease126ToddNtsRoutePack01 } from "./validate-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = "data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.json";
const SCHEMA_PATH = "schemas/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.schema.json";
const ROUTE_PACK_PATH = "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function validateNeuromorphoRelease126ToddStableIdAudit02(audit, schema, routePackBytes, routePackReport, queryBytes) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(audit)) throw new Error(`UPG-245 0.2 audit schema violation: ${validate.errors?.map((item) => `${item.instancePath || "/"} ${item.message}`).join("; ")}`);
  if (audit.currentQuery.responseReceipt.bytes !== queryBytes.byteLength || audit.currentQuery.responseReceipt.sha256 !== sha256(queryBytes)) throw new Error("UPG-245 exact current-query roster receipt changed");
  if (audit.sourceAssetReview.routePackBytes !== routePackBytes.byteLength || audit.sourceAssetReview.routePackSha256 !== sha256(routePackBytes)) throw new Error("UPG-245 exact route-pack receipt changed");
  if (routePackReport.completeCurrentRosterCount !== audit.currentQuery.stableIdCount
    || routePackReport.baselineToddRecordCount !== audit.baseline.archiveQueryRecordCount
    || routePackReport.sharedStableIdCount !== audit.comparison.commonStableIdCount
    || routePackReport.addedStableIdCount !== audit.comparison.candidateStableIdCount
    || routePackReport.removedStableIdCount !== audit.comparison.removedStableIdCount
    || routePackReport.metadataChangeCount !== audit.comparison.commonMetadataChangeCount
    || routePackReport.parsedNodeCount !== audit.sourceAssetReview.standardizedSwcNodeCount
    || routePackReport.parsedSegmentCount !== audit.sourceAssetReview.standardizedSwcSegmentCount
    || routePackReport.sourceDiameterReportedCount !== audit.sourceAssetReview.sourceDiameterReportedCount
    || routePackReport.sourceDiameterNotReportedCount !== audit.sourceAssetReview.sourceDiameterNotReportedCount
    || routePackReport.internalPrimitiveCount !== audit.admission.renderedInternalPrimitives
    || routePackReport.paperCrosswalkCount !== audit.sourceAssetReview.sourcePaperCrosswalkVerifiedCount) {
    throw new Error("UPG-245 audit evidence does not reconcile with the independently checked source route pack");
  }
  if (audit.comparison.frozenBaselineDenominatorChanged !== false || audit.admission.censusExpansion !== 0
    || audit.contextualStudy.relationStatus !== "candidate_context_only_record_level_crosswalk_unverified"
    || audit.sourceAssetReview.originalPaperCitationResolvedForPublication !== false) {
    throw new Error("UPG-245 0.2 audit overstates the frozen census, article mapping, or citation readiness");
  }
  return {
    auditId: audit.auditId,
    currentRosterCount: audit.currentQuery.stableIdCount,
    baselineToddCount: audit.baseline.archiveQueryRecordCount,
    addedCount: audit.comparison.candidateStableIdCount,
    removedCount: audit.comparison.removedStableIdCount,
    topologyQcCount: audit.sourceAssetReview.candidateStandardizedSwcTopologyQcCount,
    standardizedSwcNodeCount: audit.sourceAssetReview.standardizedSwcNodeCount,
    standardizedSwcSegmentCount: audit.sourceAssetReview.standardizedSwcSegmentCount,
    sourceDiameterReportedCount: audit.sourceAssetReview.sourceDiameterReportedCount,
    sourceDiameterNotReportedCount: audit.sourceAssetReview.sourceDiameterNotReportedCount,
    paperCrosswalkCount: audit.sourceAssetReview.sourcePaperCrosswalkVerifiedCount,
    censusExpansion: audit.admission.censusExpansion,
  };
}

export async function loadAndValidateNeuromorphoRelease126ToddStableIdAudit02() {
  const [audit, schema, routePackBytes, queryBytes, routePackReport] = await Promise.all([
    readFile(path.join(ROOT, AUDIT_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, SCHEMA_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, ROUTE_PACK_PATH)),
    readFile(path.join(ROOT, auditPathFromFixedReceipt())),
    validateNeuromorphoRelease126ToddNtsRoutePack01(),
  ]);
  return { audit, summary: validateNeuromorphoRelease126ToddStableIdAudit02(audit, schema, routePackBytes, routePackReport, queryBytes) };
}

function auditPathFromFixedReceipt() {
  return "data/source-candidates/neuromorpho-release-8-6-126-todd-nts-v1/official-current-query-response.json";
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAndValidateNeuromorphoRelease126ToddStableIdAudit02()
    .then(({ summary }) => process.stdout.write(`${JSON.stringify(summary)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
