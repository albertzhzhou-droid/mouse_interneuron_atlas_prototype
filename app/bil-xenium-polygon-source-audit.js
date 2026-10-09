import { validateBilXeniumCoordinateSourceAudit } from './bil-xenium-coordinate-source-audit.js';

const PREFIX = 'data/source-candidates/bil-xenium-polygons-20261002/';
function assert(value, reason) { if (!value) throw new Error(`BIL polygon source audit: ${reason}`); }
/** Offline original-file equality evidence; grants no geometry or section authority. */
export function validateBilXeniumPolygonSourceAudit(value, coordinateAudit, schemaAudit) {
  validateBilXeniumCoordinateSourceAudit(coordinateAudit, schemaAudit);
  assert(value?.schemaVersion === '0.1.0' && value.auditId === 'bil-xenium-polygon-source-audit-0.1' && value.checkedDate === '2026-10-02', 'unsupported schema/date');
  assert(value.scope === 'exact_run_original_polygon_coordinate_audit_not_section_pilot' && value.sourceObjectKey === coordinateAudit.sourceObjectKey && value.directoryFolder === coordinateAudit.directoryFolder && value.collectionDoi === coordinateAudit.collectionDoi && JSON.stringify(value.manifestIdentity) === JSON.stringify(coordinateAudit.manifestIdentity), 'exact source/analysis/ROI differs');
  assert(value.sourceInputs.length === 328 && new Set(value.sourceInputs.map(r => r.path)).size === 328, 'original polygon inventory differs');
  for (const r of value.sourceInputs) assert(r.path.startsWith(PREFIX) && !r.path.split('/').includes('..') && Number.isSafeInteger(r.bytes) && r.bytes > 0 && /^[a-f0-9]{64}$/.test(r.sha256), 'invalid polygon original-file receipt');
  const prior = value.priorSourceDependencies;
  assert(prior.length === 121 && new Set(prior.map(r => r.path)).size === 121, 'prior dependency inventory differs');
  assert(JSON.stringify(prior.slice(2)) === JSON.stringify([...coordinateAudit.sourceInputs, ...coordinateAudit.priorSourceDependencies]), 'prior original-input pins differ');
  assert(prior[0].path === 'data/bil-xenium-coordinate-source-audit-0.1.json' && prior[1].path === 'data/bil-xenium-geometry-schema-audit-0.1.json' && prior.slice(0,2).every(r => Number.isSafeInteger(r.bytes) && r.bytes > 0 && /^[a-f0-9]{64}$/.test(r.sha256)), 'historical audit dependencies differ');
  const c = value.coordinateEvidence;
  assert(c.sourceDeclaredUnits === 'microns' && c.sourceLocator === 'cells.zarr.zip::.zattrs#/spatial_units' && JSON.stringify(c.archiveVersion) === JSON.stringify(coordinateAudit.coordinateEvidence.archiveVersion) && c.archiveCellCount === 182698 && c.boundaryPhysicalUnitSupported === 'um' && c.parquetFilesHaveTheirOwnUnitMetadata === false && c.boundaryCoordinateEqualityToZarrChecked === true, 'boundary physical-unit evidence differs');
  assert([c.outlineToCellTransform,c.sectionCoordinateFrame,c.atlasRegistration,c.anatomicalAxisOrientation].every(v => v === null) && c.observedMembraneOrThreeDimensionalAnatomyEstablished === false, 'unproved section/frame/anatomy promoted');
  assert(c.polygonSets.length === 2, 'polygon set inventory differs');
  for (const [i,s] of c.polygonSets.entries()) {
    const original = i === 0 ? schemaAudit.tables.nucleusBoundaries : schemaAudit.tables.cellBoundaries;
    const polygons = original.polygonGroupCount, rows = original.rowCount;
    assert(s.polygonSetIndex === i && s.polygonSetName === (i === 0 ? 'nucleus' : 'cell') && s.sourceDisplayName === (i === 0 ? 'Nucleus boundaries' : 'Cell boundaries') && s.polygonCount === polygons && s.activeVertexRows === rows && s.closedExactlyPolygonCount === polygons && s.openPolygonCount === 0 && s.uniqueParentCellCount === original.uniqueCellIdCount, 'source set/count/closure/parent scope differs');
    assert(s.differentLabelRows === 0 && s.differentParentCellIdRows === 0 && s.perFileLabelJoinRule === 'label_id equals polygon index zero based plus one; separately for each boundary file' && s.parentCellIdJoinRule === 'polygon cell_index points to original cell_id array; full-string cell_id compared on every Parquet vertex row', 'exact parent or per-file label equality differs');
    assert(s.paddedCoordinatesExcludedFromRowComparison === true && s.paddedSlots === polygons * 25 - rows, 'padded slots counted as observed vertices');
    const distribution = Object.entries(s.vertexCountDistribution);
    assert(distribution.every(([k,n]) => Number.isInteger(+k) && +k >= 4 && +k <= 25 && Number.isSafeInteger(n) && n > 0) && distribution.reduce((sum,[,n]) => sum+n,0) === polygons && distribution.reduce((sum,[k,n]) => sum+(+k)*n,0) === rows, 'native vertex count distribution differs');
    assert(JSON.stringify(s.nativeCoordinateBounds) === JSON.stringify(original.nativeCoordinateBounds), 'source native bounds differ');
    assert(s.coordinateComparisons.length === 2, 'coordinate axis inventory differs');
    for (const [axis,r] of s.coordinateComparisons.entries()) assert(r.parquetColumn === (axis === 0 ? 'vertex_x' : 'vertex_y') && r.comparedVertexRows === rows && r.exactEqualRows === rows && r.differentRows === 0 && r.maxAbsoluteDifference === 0 && r.parquetDtype === 'float32' && r.zarrDtype === 'float32' && r.comparison === 'native values; no cast to float32, rounding, tolerance, reordering or inferred transform', 'exact native vertex equality differs');
    const expectedMethods = i === 0 ? { 'Segmented by nuclear stain (DAPI)':180502 } : Object.fromEntries(Object.entries(schemaAudit.methodCrosscheck.nativeLabelToMetricsField).map(([label,field]) => [label,schemaAudit.methodCrosscheck.tableCounts[field]]));
    assert(JSON.stringify(s.methodCounts) === JSON.stringify(expectedMethods), 'source nucleus/cell method scope differs');
    for (const [field,layout] of Object.entries(s.arrayLayouts)) {
      const expectedDtype = field === 'vertices' ? '<f4' : field === 'num_vertices' ? '<i4' : '<u4';
      assert(['vertices','num_vertices','cell_index','method'].includes(field) && JSON.stringify(layout.shape) === JSON.stringify(field === 'vertices' ? [polygons,50] : [polygons]) && layout.dtype === expectedDtype && layout.zarr_format === 2 && layout.order === 'C' && layout.filters === null && layout.compressor.id === 'blosc' && layout.compressor.cname === 'lz4', 'original polygon array layout differs');
    }
    assert(Object.keys(s.arrayLayouts).length === 4, 'polygon array inventory differs');
    assert(s.samplePolygons.length === 3 && s.samplePolygons.every(r => r.perFileLabelId === r.polygonIndexZeroBased + 1 && r.polygonIndexZeroBased >= 0 && r.polygonIndexZeroBased < polygons && r.cellIndexZeroBased >= 0 && r.cellIndexZeroBased < 182698 && /^[a-p]{8}-1$/.test(r.cellId) && r.numVerticesIncludingClosure >= 4 && r.numVerticesIncludingClosure <= 25 && JSON.stringify(r.firstVertexNativeXY) === JSON.stringify(r.lastVertexNativeXY)), 'sample native locators or closure differ');
  }
  const p = value.parentEvidence;
  assert(p.exactCellIdRosterCount === 182698 && p.sourceNucleusCountComparedCells === 182698 && p.differentNucleusCountCells === 0 && p.cellsWithoutNucleusPolygon === 2262 && p.cellsWithMultipleNucleusPolygons === 62 && JSON.stringify(p.nucleusCountDistribution) === JSON.stringify(schemaAudit.tables.cells.nucleusCountDistribution) && p.cellSegmentationMethodComparedCells === 182698 && p.differentCellSegmentationMethodCells === 0 && p.nucleusMethodsRemainSeparateFromParentCellMethods === true && p.crossFileSharedLabelIdsPointingToDifferentCells === 180502 && p.crossFileLabelIdsMustNotBeJoinKeys === true, 'parent nucleus counts/methods/label warning differ');
  assert(JSON.stringify(value.rights) === JSON.stringify(coordinateAudit.rights) && JSON.stringify(value.remainingGates) === JSON.stringify(coordinateAudit.remainingGates), 'unresolved rights/section/specimen/curated gates differ');
  const a = value.admission;
  assert(a.disposition === 'local_original_polygon_audit_only' && a.geometryViewerAdmission === false && a.fullGoalComplete === false && ['sectionLinkedCellNucleusGeometryCount','interneuronObjects','threeDimensionalCellObjects','atlasRegistrations','sameCellMorphologyJoins'].every(k => a[k] === 0), 'original polygon audit promoted to geometry');
  const integrity = value.archiveIntegrityScope;
  assert(integrity.wholeArchiveDownloaded === false && integrity.wholeArchiveSha256 === null && integrity.selectedPolygonEntries === 163 && integrity.selectedPolygonEntryPayloadBytes === 51188734 && integrity.selectedLocalIntervalBytes === 51198032 && integrity.selectedEntriesReplayedFromOriginalRanges === true && integrity.selectedEntryZipCrcsVerified === true && integrity.unacquiredMaskArrayBytesClaimedVerified === false && integrity.renderedGeometryBytesClaimedVerified === false, 'selected-entry verification overclaims archive/masks/runtime');
  assert(value.formatDocumentation.reviewedUrl === 'https://www.10xgenomics.com/support/software/xenium-onboard-analysis/2.0/analysis/outputs/xoa-output-zarr' && value.formatDocumentation.retainedRemoteHtml === false, 'format reference verification scope differs');
  return { sourceObjectKey:value.sourceObjectKey, exactCells:182698, cellPolygons:182698, nucleusPolygons:180502, activeVertexRows:9032645, boundaryPhysicalUnits:'um', geometryObjects:0 };
}
