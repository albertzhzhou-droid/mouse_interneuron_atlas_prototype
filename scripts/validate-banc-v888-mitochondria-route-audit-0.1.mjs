#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const BANC_V888_MITOCHONDRIA_ROUTE_AUDIT_PATH = "data/banc-v888-mitochondria-route-audit-0.1.json";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function loadAndValidateBancV888MitochondriaRouteAudit() {
  const audit = JSON.parse(await readFile(path.join(ROOT, BANC_V888_MITOCHONDRIA_ROUTE_AUDIT_PATH), "utf8"));
  const priorAudit = JSON.parse(await readFile(path.join(ROOT, "data/banc-v888-candidate-audit-0.1.json"), "utf8"));
  const route = audit.queryRoute;
  const metric = audit.candidate.mitochondriaCountMetric;
  const representation = audit.representation;
  if (audit.auditId !== "banc-v888-mitochondria-route-audit-0.1.0"
    || audit.relationshipToMouseAtlas !== "comparative_reference_only"
    || audit.source.dataverseVersion !== priorAudit.source.dataverseVersion.versionNumber
    || audit.source.mitochondriaTable.fileId !== priorAudit.objectReceipts.mitochondria.sourceFileId
    || audit.source.mitochondriaTable.bytes !== priorAudit.objectReceipts.mitochondria.bytes
    || audit.source.mitochondriaTable.md5 !== priorAudit.objectReceipts.mitochondria.md5
    || audit.source.mitochondriaTable.restricted !== priorAudit.objectReceipts.mitochondria.restricted
    || audit.candidate.rootId !== priorAudit.candidate.rootId
    || audit.candidate.cellType !== priorAudit.candidate.cellType
    || audit.candidate.mitochondriaCountMetric.value !== priorAudit.candidate.metadataMetrics.mitochondriaCount
    || audit.candidate.metadataRowCountByRootId !== 1
    || !audit.candidate.rootIdStableAcrossMaterializations626850888890) throw new Error("BANC v888 mitochondria candidate/source receipt mismatch");
  if (route.rootFilteredQuerySupported !== true
    || route.rootFilterField !== "pt_root_id"
    || route.queryExecuted !== false
    || route.credentialsInspectedOrUsed !== false
    || !route.configuredCaveClientRequiredByDocumentedImplementation) throw new Error("BANC root-filtered query access boundary changed");
  if (metric.value !== 31
    || metric.perMitochondrionAnnotationRowsRetrieved !== false
    || metric.positionsVerified !== false
    || audit.source.separateSegmentationProductStatus !== "MISSING") throw new Error("BANC count-only mitochondrial evidence boundary changed");
  if (representation.eligibleForObjectLevelInternalRendering !== false
    || representation.perMitochondrionRowsAdmitted !== 0
    || representation.mitochondriaPointMarkersAdmitted !== 0
    || representation.mitochondriaSurfacesAdmitted !== 0
    || representation.cellSurfaceAdmitted !== false
    || representation.sameCellObjectJoinCount !== 0
    || representation.mouseCellJoinCount !== 0
    || representation.registrationCount !== 0
    || audit.candidate.mouseInterneuronJoin !== false
    || audit.nextGates.length < 4
    || audit.hardBoundaries.length < 4) throw new Error("BANC internal-detail no-geometry or species boundary changed");
  return audit;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const audit = await loadAndValidateBancV888MitochondriaRouteAudit();
    process.stdout.write(`${JSON.stringify({ auditId: audit.auditId, candidateRootId: audit.candidate.rootId, mitochondriaCountMetric: audit.candidate.mitochondriaCountMetric.value, perMitochondrionRowsRetrieved: audit.candidate.mitochondriaCountMetric.perMitochondrionAnnotationRowsRetrieved, mitochondriaMarkersAdmitted: audit.representation.mitochondriaPointMarkersAdmitted, caveQueryExecuted: audit.queryRoute.queryExecuted, mouseJoinCount: audit.representation.mouseCellJoinCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
