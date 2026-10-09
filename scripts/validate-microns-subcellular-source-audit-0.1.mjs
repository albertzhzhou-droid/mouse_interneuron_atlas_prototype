#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/microns-subcellular-source-audit-0.1.json");
const CELL_PATH = path.join(ROOT, "data/microns-observed-cell-nucleus-reference-0.1.json");
const EXPECTED_COLUMNS = [
  "id", "pre_root_id", "post_root_id", "cleft_vx",
  "ctr_pt_x_nm", "ctr_pt_y_nm", "ctr_pt_z_nm",
  "pre_pos_x_vx", "pre_pos_y_vx", "pre_pos_z_vx",
  "ctr_pos_x_vx", "ctr_pos_y_vx", "ctr_pos_z_vx",
  "post_pos_x_vx", "post_pos_y_vx", "post_pos_z_vx",
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export async function validateMicronsSubcellularSourceAudit(override = null) {
  const audit = override ?? JSON.parse(await readFile(AUDIT_PATH, "utf8"));
  const cell = JSON.parse(await readFile(CELL_PATH, "utf8"));
  check(audit.auditId === "microns-phase1-subcellular-source-audit-0.1.0", "MICrONS subcellular audit identity changed");
  check(audit.schemaVersion === "0.1.0" && audit.auditDate === "2026-09-23", "MICrONS subcellular audit version/date changed");
  check(audit.targetReference.contractId === cell.contractId, "MICrONS subcellular audit must point to the admitted reference contract");
  check(audit.targetReference.cellRootId === cell.identityChain.cellRootId, "MICrONS subcellular audit root does not match the exact admitted cell");
  check(audit.targetReference.segmentationRelease === cell.sourceDataset.segmentationRelease, "MICrONS subcellular audit cell release changed");

  const table = audit.synapseTable;
  check(table.status === "source_and_schema_verified_exact_cell_rows_pending", "MICrONS synapse table must remain source/schema-only");
  check(table.zenodoRecordId === "7510511" && table.metadataDepositVersion === "185.3" && table.tableLabel === "v185", "MICrONS synapse source version receipt changed");
  check(table.fileName === "221206_pni_synapses_v185.csv" && table.fileBytes === 388781071, "MICrONS synapse file receipt changed");
  check(table.publishedMd5 === "19073f4b5cbae60d7f92d73f204940ed", "MICrONS synapse table published MD5 changed");
  check(JSON.stringify(table.observedColumns) === JSON.stringify(EXPECTED_COLUMNS), "MICrONS synapse CSV schema changed");
  check(table.coordinateFields.nativeUnit === "nanometre"
    && JSON.stringify(table.coordinateFields.releaseNotesNominalVoxelResolutionNanometre) === JSON.stringify([4, 4, 40])
    && table.coordinateFields.postHocMeasurementCorrectionApplied === false, "MICrONS native coordinate/correction boundary changed");
  check(/automated putative detections/i.test(table.qualityBoundary)
    && /not proofread/i.test(table.qualityBoundary)
    && /does not provide a per-row proofread flag/i.test(table.qualityBoundary), "MICrONS synapse quality boundary weakened");
  check(table.accessAudit.officialCaveGuideRequiresConfiguredToken === true
    && table.accessAudit.authenticatedExactRootQueryRun === false
    && table.accessAudit.fullTableDownloaded === false
    && table.accessAudit.filteredRowsRetained === 0
    && table.accessAudit.retainedSourcePayloadBytes === 0, "MICrONS synapse access/import boundary changed");
  check(table.versionJoin.tableDepositVersion === "185.3"
    && table.versionJoin.cellSegmentationRelease === "v185.4"
    && table.versionJoin.exactRootLineageAcrossTheseProductsVerified === false
    && table.versionJoin.overlayAdmitted === false, "MICrONS v185-to-v185.4 join must remain unverified");

  check(audit.mitochondriaRoute.status === "official_source_route_listed_exact_cell_mapping_pending"
    && audit.mitochondriaRoute.precomputedLayer === "precomputed://gs://neuroglancer/pinky10/ground_truth_registration/dst/mit_new"
    && audit.mitochondriaRoute.exactTargetRootMappingVerified === false
    && audit.mitochondriaRoute.versionAndCoordinateJoinVerified === false
    && audit.mitochondriaRoute.mitochondriaGeometryImported === false, "MICrONS mitochondria candidate must remain source-only");
  check(JSON.stringify(audit.admission) === JSON.stringify({
    synapsePointCount: 0,
    mitochondriaObjectCount: 0,
    sameCellCrossSourceJoinCount: 0,
    mouseSpinalIdentityJoinCount: 0,
    registrationCount: 0,
    functionalConnectivityClaims: false,
  }), "MICrONS subcellular audit must admit no geometry, join, registration or functional-connectivity claim");
  check(Array.isArray(audit.nextEvidenceGate) && audit.nextEvidenceGate.length >= 4, "MICrONS subcellular evidence gates are missing");
  check(Array.isArray(audit.sources) && audit.sources.length === 4 && audit.sources.every((source) => /^https:\/\//.test(source.url)), "MICrONS subcellular primary-source links are incomplete");
  check(!("observations" in audit) && !("synapses" in audit) && !("mitochondria" in audit), "Source-only MICrONS audit must not contain unlabeled cell observations or geometry payloads");

  return {
    auditId: audit.auditId,
    targetRootId: audit.targetReference.cellRootId,
    synapseTableRowsDescribed: 3200000,
    fullTableDownloaded: table.accessAudit.fullTableDownloaded,
    retainedSourcePayloadBytes: table.accessAudit.retainedSourcePayloadBytes,
    synapsePointCount: audit.admission.synapsePointCount,
    mitochondriaObjectCount: audit.admission.mitochondriaObjectCount,
    exactCellVersionJoinVerified: table.versionJoin.exactRootLineageAcrossTheseProductsVerified,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateMicronsSubcellularSourceAudit()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
