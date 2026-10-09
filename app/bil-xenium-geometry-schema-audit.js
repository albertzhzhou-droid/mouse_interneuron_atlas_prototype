import { validateBilXeniumCoordinateSourceAudit } from "./bil-xenium-coordinate-source-audit.js";
import { validateBilXeniumPolygonSourceAudit } from "./bil-xenium-polygon-source-audit.js";
import { validateBilXeniumImageMetadataAudit } from "./bil-xenium-image-metadata-audit.js";
import { buildBilPublishedWorkflowContext } from "./bil-xenium-published-workflow-audit.js";
import { createSourceIdentityHierarchy } from "./source-object-identity.js";
import { buildBilXeniumRunReceipt, validateBilXeniumMetadata } from "./bil-xenium-source-metadata.js";

const HASH = /^[a-f0-9]{64}$/;
const SOURCE = "BIL:ace-pie-cot";
const FOLDER = "Run8_Slide2_Mus_M7_F7";
const METHODS = {
  "Segmented by boundary stain (ATP1A1+CD45+E-Cadherin)": "boundary",
  "Segmented by interior stain (18S)": "interior",
  "Segmented by nucleus expansion of 5.0µm": "nuc_expansion",
};
const GATES = { section_identity: "blocked", specimen_identity: "blocked", curated_labels: "blocked_for_interneuron_lane", file_rights: "unresolved_policy_difference" };
function assert(value, reason) { if (!value) throw new Error(`BIL geometry schema audit: ${reason}`); }
const count = (value) => Number.isSafeInteger(value) && value >= 0;

/** This is an inspected source schema; it grants no geometry or biological mapping. */
export function validateBilXeniumGeometrySchemaAudit(audit, metadata) {
  validateBilXeniumMetadata(metadata);
  assert(audit?.schemaVersion === "0.1.0" && audit.auditId === "bil-xenium-geometry-schema-audit-0.1", "unsupported schema");
  assert(audit.scope === "one_run_local_source_schema_inspection_not_section_pilot" && audit.sourceObjectKey === SOURCE && audit.directoryFolder === FOLDER && audit.collectionDoi === "10.35077/g.1196", "wrong source scope");
  const run = metadata.runs.find((item) => item.sourceObjectKey === SOURCE);
  assert(run && JSON.stringify(audit.manifestIdentity) === JSON.stringify(run.manifestIdentity), "analysis/ROI identity mismatch");
  assert(audit.sourceFiles.length === 3 && audit.totalSourceBytes === 37282469, "bounded input scope changed");
  const sizes = { "cells.parquet": 3763859, "cell_boundaries.parquet": 17485669, "nucleus_boundaries.parquet": 16032941 };
  const names = new Set();
  for (const file of audit.sourceFiles) {
    const name = file.path?.split("/").at(-1);
    assert(name in sizes && !names.has(name) && file.path === `data/source-candidates/bil-xenium-geometry-20260930/${FOLDER}/${name}` && file.url === `${run.sourceUrl}${name}` && file.bytes === sizes[name] && HASH.test(file.sha256), "source file scope/receipt mismatch");
    names.add(name);
  }
  assert(audit.dependencyReceipts.length === 5 && audit.dependencyReceipts.every((file) => file.path && !file.path.split("/").includes("..") && !file.path.startsWith("/") && file.bytes > 0 && HASH.test(file.sha256)), "dependency receipts missing");
  const { cells, cellBoundaries, nucleusBoundaries } = audit.tables;
  assert(cells.rowCount === run.rawSegmentedCellCount && cells.uniqueCellIdCount === cells.rowCount && cells.duplicateCellIdCount === 0 && cells.duplicateCellRowCount === 0, "cell ID/denominator mismatch");
  assert(cells.columns.map((field) => field.name).join(",") === "cell_id,x_centroid,y_centroid,transcript_counts,control_probe_counts,genomic_control_counts,control_codeword_counts,unassigned_codeword_counts,deprecated_codeword_counts,total_counts,cell_area,nucleus_area,nucleus_count,segmentation_method", "unexpected cell fields");
  for (const table of [cells, cellBoundaries, nucleusBoundaries]) {
    assert(table.fileDeclaredPhysicalUnits === null && table.physicalUnitMetadataPresent === false, "unverified file physical units");
    assert(count(table.rowCount) && count(table.uniqueCellIdCount), "invalid table counts");
  }
  for (const table of [cellBoundaries, nucleusBoundaries]) {
    assert(table.columns.map((field) => field.name).join(",") === "cell_id,vertex_x,vertex_y,label_id", "unexpected boundary fields");
    assert(table.polygonGroupCount === table.closedPolygonGroupCount && table.uniqueLabelIdCount === table.polygonGroupCount, "polygon closure/group denominator mismatch");
    for (const field of ["openPolygonGroupCount", "degeneratePolygonGroupCount", "noncontiguousRepeatedGroupCount", "nonfiniteOrMissingCoordinateRowCount", "invalidLabelRowCount", "labelMapsToMultipleCellsRowCount"]) assert(table[field] === 0, "source QC changed");
    assert(table.nativeCoordinateBounds.min.length === 2 && table.nativeCoordinateBounds.max.length === 2 && table.nativeCoordinateBounds.min.every((v, i) => Number.isFinite(v) && v < table.nativeCoordinateBounds.max[i]), "invalid native bounds");
  }
  const distribution = cells.nucleusCountDistribution;
  assert(Object.entries(distribution).every(([key, value]) => /^\d+$/.test(key) && count(value)) && Object.values(distribution).reduce((a, b) => a + b, 0) === cells.rowCount, "nucleus count denominator mismatch");
  const nucleusCount = Object.entries(distribution).reduce((sum, [key, value]) => sum + Number(key) * value, 0);
  assert(nucleusCount === nucleusBoundaries.polygonGroupCount && cells.rowCount - distribution["0"] === nucleusBoundaries.uniqueCellIdCount && Object.entries(distribution).reduce((sum, [key, value]) => sum + (Number(key) > 1 ? value : 0), 0) === nucleusBoundaries.cellsWithMultiplePolygonGroups, "multi/zero nucleus mismatch");
  assert(cells.nonfiniteCountByColumn.nucleus_area === distribution["0"] && Object.values(cells.nullCountByColumn).every((v) => v === 0), "source NaN/null distinction mismatch");
  assert(cellBoundaries.uniqueCellIdCount === cells.rowCount && cellBoundaries.polygonGroupCount === cells.rowCount && cellBoundaries.cellsWithMultiplePolygonGroups === 0, "cell boundary join mismatch");
  const join = audit.idJoins;
  assert(join.key === "exact_string_cell_id_scoped_to_source_analysis_roi" && join.labelIdCanJoinCellAndNucleusFiles === false && join.sourceBoundaryVertexRowsAreDuplicateCells === false, "unsafe join semantics");
  assert(join.cellTableIdsWithoutNucleusBoundary === distribution["0"] && join.crossFileSharedLabelIdCount === nucleusBoundaries.uniqueLabelIdCount && join.crossFileLabelIdDifferentCellCount === join.crossFileSharedLabelIdCount, "cross-file label or missing nucleus mismatch");
  for (const field of ["cellTableIdsWithoutCellBoundary", "orphanCellBoundaryIds", "orphanNucleusBoundaryIds", "positiveNucleusCountWithoutBoundary", "zeroNucleusCountWithBoundary", "nucleusCountVersusPolygonGroupMismatchCellCount"]) assert(join[field] === 0, "stable cell ID join changed");
  const methods = audit.methodCrosscheck;
  assert(JSON.stringify(methods.nativeLabelToMetricsField) === JSON.stringify(METHODS) && methods.countsMatchMetrics === true && methods.rawCellCountMatchMetrics === true, "method labels/counts mismatch");
  for (const [native, field] of Object.entries(METHODS)) assert(cells.segmentationMethodCounts[native] === run.processing.methodCounts[field] && methods.tableCounts[field] === run.processing.methodCounts[field] && methods.metricsCounts[field] === run.processing.methodCounts[field], "per-cell methods differ from source metrics");
  assert(methods.nuclearExpansionDistanceUm === 5 && methods.distanceEvidence.file === "cells.parquet" && methods.distanceEvidence.column === "segmentation_method" && methods.distanceEvidence.nativeValue === "Segmented by nucleus expansion of 5.0µm" && methods.distanceScope === "only_rows_with_native_method_label_Segmented_by_nucleus_expansion_of_5.0µm", "expansion parameter scope changed");
  const coordinates = audit.coordinateEvidence;
  assert(coordinates.status === "platform_schema_consistent_not_file_declared" && coordinates.platformDocumentationVersion === "4.1" && coordinates.acquiredAnalysisVersion === run.processing.analysisSoftware && coordinates.platformDescribedUnit === "um" && [coordinates.fileMetadataUnit, coordinates.sectionCoordinateFrame, coordinates.outlineToCellFrameTransform, coordinates.atlasRegistration].every((value) => value === null), "coordinate evidence promoted");
  assert(audit.remainingGates.length === 4 && Object.entries(GATES).every(([id, status]) => audit.remainingGates.filter((gate) => gate.id === id && gate.status === status && gate.reason).length === 1), "missing pilot gates");
  assert(audit.admission.disposition === "local_schema_audit_only" && audit.admission.geometryViewerAdmission === false && audit.admission.fullGoalComplete === false, "unsupported admission");
  for (const field of ["sectionLinkedCellNucleusGeometryCount", "interneuronObjects", "threeDimensionalCellObjects", "atlasRegistrations", "sameCellMorphologyJoins"]) assert(audit.admission[field] === 0, "scientific admission count changed");
  const sampleIds = new Set();
  for (const sample of cells.sampleRows) {
    assert(typeof sample.cellId === "string" && sample.cellId && !sampleIds.has(sample.cellId) && count(sample.rowIndexZeroBased) && sample.rowIndexZeroBased < cells.rowCount, "invalid source example ID/locator");
    sampleIds.add(sample.cellId);
    assert(sample.fields.cell_id.value === sample.cellId && Object.keys(sample.fields).length === cells.columns.length, "source example field mismatch");
    for (const [name, field] of Object.entries(sample.fields)) {
      assert(field.locator.file === "cells.parquet" && field.locator.rowIndexZeroBased === sample.rowIndexZeroBased && field.locator.column === name, "source field locator mismatch");
      assert(field.state === "source_value" ? field.value !== null && (typeof field.value !== "number" || Number.isFinite(field.value)) : ["source_nonfinite", "source_null"].includes(field.state) && field.value === null, "source missingness mismatch");
    }
  }
  return { sourceObjectKey: SOURCE, rawCellRows: cells.rowCount, sourceBytes: audit.totalSourceBytes, cellBoundaryVertexRows: cellBoundaries.rowCount, nucleusBoundaryVertexRows: nucleusBoundaries.rowCount, geometryObjects: 0 };
}

export function buildBilXeniumCurrentRunReceipt(audit, metadata, sourceObjectKey, coordinateAudit = null, workflowAudit = null, polygonAudit = null, imageMetadataAudit = null) {
  if (coordinateAudit) validateBilXeniumCoordinateSourceAudit(coordinateAudit, audit);
  if (polygonAudit) validateBilXeniumPolygonSourceAudit(polygonAudit, coordinateAudit, audit);
  if (imageMetadataAudit) validateBilXeniumImageMetadataAudit(imageMetadataAudit, coordinateAudit, audit);
  validateBilXeniumGeometrySchemaAudit(audit, metadata);
  const historical = buildBilXeniumRunReceipt(metadata, sourceObjectKey);
  if (!historical) return null;
  const current = sourceObjectKey === audit.sourceObjectKey ? audit : null;
  const coordinates = current ? coordinateAudit : null;
  const polygons = current ? polygonAudit : null;
  const imageMetadata = current ? imageMetadataAudit : null;
  return {
    ...historical, receiptType: "bil_xenium_current_source_inspection", checkedDate: imageMetadata?.checkedDate ?? polygons?.checkedDate ?? coordinates?.checkedDate ?? audit.checkedDate,
    metadataSnapshotCheckedDate: historical.checkedDate,
    metadataSnapshotPilotAdmission: historical.pilotAdmission,
    sourceTableSchemaAudit: current,
    sourceCoordinateAudit: coordinates,
    sourcePolygonAudit: polygons,
    sourceImageMetadataAudit: imageMetadata,
    publishedWorkflowInspection: workflowAudit ? buildBilPublishedWorkflowContext(workflowAudit, sourceObjectKey) : null,
    pilotAdmission: current ? { admitted: false, geometry: null, disposition: "local_schema_audit_only", blockers: current.remainingGates, methodEvidence: current.methodCrosscheck } : historical.pilotAdmission,
  };
}

export function buildBilXeniumAuditedCellHierarchy(audit, metadata, cellId) {
  validateBilXeniumGeometrySchemaAudit(audit, metadata);
  const sample = audit.tables.cells.sampleRows.find((row) => row.cellId === cellId);
  if (!sample) return null;
  const roi = audit.manifestIdentity.roi_uuid;
  const source = audit.sourceFiles.find((file) => file.path.endsWith("/cells.parquet"));
  const locator = `${source.path}#row-index-zero-based=${sample.rowIndexZeroBased}&column=cell_id;sha256=${source.sha256}`;
  const absent = (reason, status = "unknown") => ({ status, id: null, locator: null, reason });
  return createSourceIdentityHierarchy({
    sourceId: "bil-xenium-spinal", releaseId: `XOA:${audit.manifestIdentity.analysis_uuid}`, namespace: `BIL:10.35077/g.1196:ROI:${roi}`,
    objectKind: "source_segmented_cell_table_row", objectId: cellId, objectLocator: locator, objectLevel: "cell", unit: "source segmentation record",
    nodes: { specimen: absent("Dataset-level specimen metadata does not verify a donor for this cell."), section: absent("No source-supported cell-to-section join has been established."),
      cell: { status: "known", id: cellId, locator, reason: null }, component: absent("No geometry component is admitted by this table audit.", "not_applicable"), synapse: absent("No source synapse object is present in the audited table.", "not_applicable") },
    population: { status: "known", id: audit.sourceObjectKey, locator: `BIL:${audit.directoryFolder};ROI:${roi}`, reason: null },
  });
}
