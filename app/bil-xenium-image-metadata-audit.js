const SOURCE = 'BIL:ace-pie-cot';
const FOLDER = 'Run8_Slide2_Mus_M7_F7';
const URL = `https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/${FOLDER}/morphology.ome.tif`;
const HASH = /^[a-f0-9]{64}$/;
function assert(value, reason) { if (!value) throw new Error(`BIL image metadata audit: ${reason}`); }
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/** Source metadata and numeric consistency; never a rendered pixel or section proof. */
export function validateBilXeniumImageMetadataAudit(a, coordinates, schema) {
  assert(a?.schemaVersion === '0.1.0' && a.auditId === 'bil-xenium-image-metadata-audit-0.1', 'unsupported schema');
  assert(a.checkedDate === '2026-10-02' && a.sourceObjectKey === SOURCE && a.directoryFolder === FOLDER && a.sourceUrl === URL, 'wrong exact image source');
  assert(coordinates?.sourceObjectKey === SOURCE && schema?.sourceObjectKey === SOURCE && equal(a.manifestIdentity, schema.manifestIdentity) && equal(a.manifestIdentity, coordinates.manifestIdentity), 'run identity differs');
  const m = a.imageMetadata, p = m?.ome?.pixelsAttributes;
  assert(m?.tiffFormat === 'BigTIFF' && m.byteOrder === 'little' && m.firstIfdOffset === 16 && m.firstIfdEntryCount === 16, 'first IFD declaration differs');
  assert(p?.SizeX === '54030' && p.SizeY === '112160' && p.SizeZ === '16' && p.SizeC === '1' && p.SizeT === '1' && p.Type === 'uint16' && p.DimensionOrder === 'XYZCT', 'source image dimensions/axes differ');
  assert(p.PhysicalSizeX === '0.2125' && p.PhysicalSizeY === '0.2125' && p.PhysicalSizeZ === '3.0' && ['PhysicalSizeXUnit','PhysicalSizeYUnit','PhysicalSizeZUnit'].every(k => p[k] === 'µm'), 'source OME calibration differs');
  assert(equal(m.firstIfdTags['256'], [54030]) && equal(m.firstIfdTags['257'], [112160]) && equal(m.firstIfdTags['258'], [16]) && equal(m.firstIfdTags['296'], [1]), 'OME/first IFD dimensions or unitless TIFF resolution differs');
  assert(m.ome.channels.length === 1 && m.ome.channels[0].Name === 'DAPI' && m.ome.channels[0].SamplesPerPixel === '1' && equal(m.ome.tiffData, [{PlaneCount:'16'}]) && m.ome.planes.length === 0, 'source channel/plane declarations differ');
  const c = a.calibration;
  assert(c?.sourcePixelSizeXYUm === 0.2125 && c.sourceZStepUm === 3 && c.omeAndManifestExactAgreement === true && equal(c.storedSourcePhysicalToImageMatrix, coordinates.coordinateEvidence.sourceTransform.matrixRowMajor), 'run/matrix calibration differs');
  assert(c.storedScaleMinusExactReciprocal === coordinates.coordinateEvidence.sourceTransform.storedScaleMinusReciprocalPixelSize && c.zPlaneCenterIndexSpanUm === 45 && c.sectionThicknessUm === null && c.anatomicalAxisDirections === null && c.imageToNamedOutlineTransform === null, 'precision, section thickness or anatomical frame overclaim');
  const b = a.cellImageBounds;
  assert(b?.centroidCount === 182698 && b.finiteCentroidCount === 182698 && b.insideImageCount === 182698 && b.outsideImageCount === 0, 'source centroid bounds/counts differ');
  assert(b.sourceMatrixImageBoundsPixels.min.every((v,i) => Number.isFinite(v) && v >= 0 && v <= b.sourceMatrixImageBoundsPixels.max[i]) && b.sourceMatrixImageBoundsPixels.max.every((v,i) => Number.isFinite(v) && v < [54030,112160][i]), 'native image bounds invalid');
  assert(equal(b.maxAbsStoredMatrixVsExactCalibrationPixels, [0.003217429963115137,0.006681347047560848]) && b.maskOverlapOrPixelAlignmentVerified === false && b.doesNotAssignSections === true, 'numeric fit cannot authorize pixel alignment/sections');
  const o = a.outlineAreaConsistency;
  assert(o?.sourceHeaderUnit === 'µm^2' && o.outlineCount === 29 && o.outlines.length === 29 && new Set(o.outlines.map(r => r.sourceName)).size === 29 && o.allHeaderAreasReproduced === true, 'outline area inventory differs');
  assert(o.outlines.every(r => r.closed === true && r.vertexRows >= 4 && Number.isFinite(r.shoelaceAreaNativeXY) && r.shoelaceAreaNativeXY > 0 && Math.abs(r.computedMinusHeaderArea) <= 0.05 && r.roundedToHeaderOneDecimalAgrees === true), 'native outline area does not reproduce header precision');
  assert(o.supportsDimensionalConsistencyOnly === true && o.commonOriginOrOrientationVerified === false && o.cellToSectionAssignments === 0 && o.donorAssignments === 0, 'area fit cannot authorize biological mapping');
  const integrity = a.integrityScope;
  assert(integrity?.rangeTransferBytes === 1606 && integrity.rangeCount === 5 && integrity.rangeBudgetBytes === 2000000 && integrity.sourceBytesDeclaredAndRangeChecked === 25611493268 && integrity.allSelectedMetadataReplayed === true, 'metadata acquisition scope differs');
  for (const object of [m, integrity]) assert(object.imagePixelsRead === false && object.otherIfdsReplayed === false && object.pyramidPixelsVerified === false, 'unread image pixels/IFDs promoted');
  assert(integrity.wholeFileDownloaded === false && integrity.wholeFileSha256 === null, 'whole image attestation forbidden');
  const admission = a.admission;
  assert(admission?.disposition === 'local_original_image_metadata_audit_only' && admission.geometryViewerAdmission === false && admission.fullGoalComplete === false && ['sectionLinkedCellNucleusGeometryCount','interneuronObjects','threeDimensionalCellObjects','atlasRegistrations','sameCellMorphologyJoins'].every(k => admission[k] === 0), 'metadata cannot admit target geometry');
  assert(equal(a.remainingGates, schema.remainingGates), 'remaining source gates changed');
  assert(a.sourceInputs.length === 8 && a.priorSourceDependencies.length === 122, 'source file inventory differs');
  const files = [...a.sourceInputs, ...a.priorSourceDependencies];
  assert(new Set(files.map(r => r.path)).size === files.length && files.every(r => typeof r.path === 'string' && r.path.startsWith('data/') && !r.path.split('/').includes('..') && Number.isInteger(r.bytes) && r.bytes > 0 && HASH.test(r.sha256)), 'invalid input file receipt');
  return {sourceObjectKey: SOURCE, metadataRangeBytes: 1606, imageWidth: 54030, imageHeight: 112160, declaredZPlanes: 16, inBoundsCellCentroids: 182698, outlineAreasReproduced: 29, geometryObjects: 0};
}
