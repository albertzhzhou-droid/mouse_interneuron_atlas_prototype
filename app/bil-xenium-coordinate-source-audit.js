const SOURCE = 'BIL:ace-pie-cot';
const PREFIX = 'data/source-candidates/bil-xenium-source-gate-20261001/';
function assert(value, reason) { if (!value) throw new Error(`BIL coordinate source audit: ${reason}`); }
/** Declared offline inspection only; never a browser geometry-byte attestation. */
export function validateBilXeniumCoordinateSourceAudit(value, schemaAudit) {
  assert(value?.schemaVersion === '0.1.0' && value.auditId === 'bil-xenium-coordinate-source-audit-0.1', 'unsupported schema');
  assert(value.scope === 'exact_run_original_coordinate_entries_not_section_pilot' && value.sourceObjectKey === SOURCE && value.sourceObjectKey === schemaAudit.sourceObjectKey && value.directoryFolder === schemaAudit.directoryFolder && value.collectionDoi === schemaAudit.collectionDoi, 'source/run scope differs');
  assert(JSON.stringify(value.manifestIdentity) === JSON.stringify(schemaAudit.manifestIdentity), 'exact analysis/ROI identity differs');
  assert(JSON.stringify(value.priorSourceDependencies) === JSON.stringify([...schemaAudit.sourceFiles, ...schemaAudit.dependencyReceipts]), 'prior source dependencies differ');
  const paths = new Set();
  assert(value.sourceInputs.length === 111, 'bounded acquired source inventory differs');
  for (const file of value.sourceInputs) {
    assert(file.path.startsWith(PREFIX) && !file.path.split('/').includes('..') && !paths.has(file.path) && Number.isSafeInteger(file.bytes) && file.bytes > 0 && /^[a-f0-9]{64}$/.test(file.sha256), 'invalid original-input receipt');
    paths.add(file.path);
  }
  const c = value.coordinateEvidence;
  assert(c.sourceDeclaredUnits === 'microns' && c.sourceLocator === 'cells.zarr.zip::.zattrs#/spatial_units' && c.archiveVersion.major === 6 && c.archiveVersion.minor === 2 && c.archiveCellCount === 182698, 'native coordinate declaration differs');
  assert(JSON.stringify(c.cellIdShape) === '[182698,2]' && JSON.stringify(c.cellSummaryShape) === '[182698,8]' && c.exactCellIdJoinCount === 182698 && c.duplicateCellIds === 0 && c.missingParquetCellIds === 0 && c.missingZarrCellIds === 0, 'exact cell ID join differs');
  assert(c.cellSummaryColumns.join(',') === 'cell_centroid_x,cell_centroid_y,cell_area,nucleus_centroid_x,nucleus_centroid_y,nucleus_area,z_level,nucleus_count', 'source field locators differ');
  assert(c.cellCentroidUnitSupported === 'um' && c.parquetFilesHaveTheirOwnUnitMetadata === false && c.boundaryCoordinateEqualityToZarrNotChecked === true, 'centroid units overclaim polygon/file scope');
  const pairs = { x_centroid: 'cell_centroid_x', y_centroid: 'cell_centroid_y', cell_area: 'cell_area', nucleus_area: 'nucleus_area', nucleus_count: 'nucleus_count' };
  assert(c.fieldComparisons.length === 5 && new Set(c.fieldComparisons.map(r => r.parquetColumn)).size === 5, 'source field comparison inventory differs');
  for (const r of c.fieldComparisons) {
    const nan = r.parquetColumn === 'nucleus_area' ? 2262 : 0;
    assert(pairs[r.parquetColumn] === r.zarrColumn && r.joinedBy === 'exact source cell_id' && r.comparedRows === 182698 && r.exactEqualRows === 182698 && r.differentRows === 0 && r.maxAbsoluteDifferenceWhereBothFinite === 0 && r.bothNaNRows === nan && r.bothFiniteRows === 182698 - nan, 'source equality or missingness differs');
  }
  const t = c.sourceTransform;
  const scale = 4.7058820724487305;
  assert(t.entry === 'masks/homogeneous_transform' && t.dtype === '<f4' && JSON.stringify(t.matrixRowMajor) === JSON.stringify([[scale, 0, 0, 0], [0, scale, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]) && t.experimentPixelSize === 0.2125 && t.reciprocalPixelSize === 1 / 0.2125 && t.storedScaleMinusReciprocalPixelSize === scale - 1 / 0.2125 && t.axesOrientationOrAnatomicalDirection === null, 'source transform or precision differs');
  assert(t.scope === 'source cell segmentation physical coordinates to stitched image pixels; not outline/section or atlas transform' && [c.outlineToCellTransform, c.sectionCoordinateFrame, c.atlasRegistration].every(v => v === null), 'unproved outline/section/registration promoted');
  const a = value.secondaryAnalysis;
  assert(a.zipCrcsVerified === true && a.groupings.length === 10 && a.curatedCellTypeAssignments === 0 && a.doesNotAuthorizeInterneuronLabels === true, 'automated groups promoted to types');
  for (const [i, g] of a.groupings.entries()) {
    const n = i === 0 ? 31 : i + 1;
    assert(g.sourceName === (i === 0 ? 'gene_expression_graphclust' : `gene_expression_kmeans_${n}_clusters`) && g.groupNames.length === n && g.groupNames.every((s, j) => s === `Cluster ${j + 1}`) && g.isCuratedBiologicalType === false && g.assignedCellIndexCount === 182490 && g.unassignedCellIndexCount === 208 && g.clusterCellCounts.length === n && g.clusterCellCounts.every(v => Number.isSafeInteger(v) && v >= 0) && g.clusterCellCounts.reduce((sum, v) => sum + v, 0) === 182490, 'cluster names, counts or unassigned cells differ');
  }
  assert(value.fovMetadata.morphologyFovCount === 609 && value.fovMetadata.overviewFovCount === 609 && value.fovMetadata.doesNotEstablishSections === true, 'fields of view promoted to sections');
  assert(value.rights.datasetApiLicense === 'CC-BY-4.0' && value.rights.datasetWebLicense === 'CC-BY-4.0' && value.rights.siteDistributionLicense === 'CC-BY-SA-4.0' && value.rights.policyDifferenceResolved === false, 'unresolved rights changed');
  assert(JSON.stringify(value.remainingGates) === JSON.stringify(schemaAudit.remainingGates), 'section/type/specimen/rights gates differ');
  const integrity = value.archiveIntegrityScope;
  assert(integrity.wholeArchiveDownloaded === false && integrity.wholeArchiveSha256 === null && integrity.selectedEntriesReplayedFromOriginalRanges === true && integrity.selectedEntryZipCrcsVerified === true && integrity.unacquiredMaskOrPolygonArrayBytesClaimedVerified === false, 'partial archive overclaims verification');
  const admission = value.admission;
  assert(admission.disposition === 'local_original_coordinate_audit_only' && admission.geometryViewerAdmission === false && admission.fullGoalComplete === false && ['sectionLinkedCellNucleusGeometryCount', 'interneuronObjects', 'threeDimensionalCellObjects', 'atlasRegistrations', 'sameCellMorphologyJoins'].every(k => admission[k] === 0), 'source inspection promoted to geometry');
  return { sourceObjectKey: SOURCE, exactCellIdJoinCount: 182698, centroidUnits: 'um', geometryObjects: 0, assignedAutomatedCellCount: 182490, unassignedAutomatedCellCount: 208 };
}
