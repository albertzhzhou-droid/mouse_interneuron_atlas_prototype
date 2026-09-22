import { NATIVE_DETAIL_04_PARENT, NATIVE_DETAIL_04_PARSER, NATIVE_DETAIL_04_RECORDS } from "./neurolucida-native-detail-records.js";

export const NATIVE_DETAIL_04_AUDIT = Object.freeze({ path: "data/neurolucida-native-detail-independent-audit-0.4.json", bytes: 6636, sha256: "1c438aef6507d4f1dc38e7960373c53d446c21d82c9fac796a4d1b8e8efbd22e" });
export const NATIVE_DETAIL_04_MBF_URL = "https://www.mbfbioscience.com/help/neurolucida/Content/Ribbons/Trace/traceCellBody.htm";
export const NATIVE_DETAIL_04_ZERO_FIELDS = Object.freeze(["filledPolygonCount", "triangleCount", "loftCount", "surfaceCount", "membraneCount", "volumeCount", "internalStructureObjectCount", "biologicalMeasurementCount", "standardizedSwcOverlayCount", "sameCellJoinCount", "registrationCount", "crossSourceJoinCount"]);
export const NATIVE_DETAIL_04_FORBIDDEN = Object.freeze(["generic false-flag closure", "polygon fill", "triangulation", "lofted surface", "membrane, nucleus or organelle model", "volume estimate", "biological measurement", "standardized SWC overlay", "same-cell join", "atlas registration", "representative type morphology", "native drawing width as SWC diameter"]);
const PRESENCE = Object.freeze({ key: "CellBody", declaredValueCount: 0, rawValues: [], interpretedPresence: true });
const RAW_PRESENCE = Object.freeze([{ key: "CellBody", declaredValueCount: 0, values: [] }]);
function check(condition, message) { if (!condition) throw new Error(message); }
function same(actual, expected) { return JSON.stringify(actual) === JSON.stringify(expected); }

export function validateNativeDetail04Delta(delta) {
  check(delta?.documentType === "neurolucida_native_contour_admission_delta" && delta.schemaVersion === "0.4.0", "Native detail 0.4 delta identity changed");
  check(delta.contractId === "neurolucida-native-contour-admission-catalog-0.4" && delta.releaseId === "ohri-neurolucida-native-contour-admission-catalog-0.4.0", "Native detail 0.4 release changed");
  check(same(delta.baseCatalog, NATIVE_DETAIL_04_PARENT) && same(delta.independentAudit, NATIVE_DETAIL_04_AUDIT), "Native detail frozen base/audit receipt changed");
  check(same(delta.parserAudit, NATIVE_DETAIL_04_PARSER), "Native detail independent parser semantics changed");
  check(!("records" in delta), "The disk delta must not duplicate inherited records");
  check(Array.isArray(delta.addedRecords) && same(delta.addedRecords.map((record) => record.neuronId), [108978, 249676]), "Native detail added identity/order changed");
  check(same(delta.addedSummary, { admittedRecordCount: 2, admittedContourObjectCount: 24, admittedVertexCount: 2770, admittedRenderedPrimitiveCount: 24 }), "Native detail added denominator changed");
  const totals = { auditedDatFileCount: 7, admittedRecordCount: 7, heldRecordCount: 0, admittedContourObjectCount: 72, admittedVertexCount: 5149, admittedRenderedPrimitiveCount: 72 };
  for (const [field, value] of Object.entries(totals)) check(delta.summary?.[field] === value, `Native detail ${field} total changed`);
  for (const field of ["admittedFilledPolygonCount", "admittedTriangleCount", "admittedLoftCount", "admittedSurfaceCount", "admittedMembraneCount", "admittedVolumeCount", "admittedInternalStructureObjectCount", "biologicalMeasurementCount", "standardizedSwcOverlayCount", "sameCellCrossModalJoinCount", "registrationCount"]) check(delta.summary?.[field] === 0, `Native detail ${field} must remain zero`);
  check(delta.relationshipBoundary?.sourceNativeFrameOnly === true && delta.relationshipBoundary?.overlayWithStandardizedSwcAllowed === false && delta.relationshipBoundary?.coordinateTransformToStandardizedSwcStatus === "not_established", "Native detail source-frame boundary changed");
  for (const field of ["sameCellMolecularProfileJoinCount", "sameSpecimenInternalStructureCount", "atlasRegistrationCount"]) check(delta.relationshipBoundary?.[field] === 0, `Native detail ${field} must remain zero`);
  check(delta.mbfCellBodySemantics?.documentationUrl === NATIVE_DETAIL_04_MBF_URL && delta.mbfCellBodySemantics?.rawFalseFlagsPreserved === true, "Native detail MBF evidence changed");
  delta.addedRecords.forEach((record, index) => validateNativeDetail04Record(record, NATIVE_DETAIL_04_RECORDS[index]));
  return delta;
}

function validateNativeDetail04Record(record, expected) {
  const label = `NMO ${expected.neuronId}`;
  check(record?.neuronId === expected.neuronId && record.assetId === `NeuroMorpho:${expected.neuronId}`, `${label} identity changed`);
  check(record.admissionStatus === "admitted_mbf_cell_body_semantic_rule", `${label} admission changed`);
  check(record.source?.projectPath === expected.sourcePath && record.source?.storage === "project_source_only" && record.source.bytes === expected.sourceBytes && record.source.sha256 === expected.sourceSha256, `${label} DAT receipt changed`);
  check(record.apiReceipt?.projectPath === expected.apiPath && record.apiReceipt?.bytes === expected.apiBytes && record.apiReceipt?.sha256 === expected.apiSha256, `${label} API receipt changed`);
  check(record.source?.originalDatUrl === expected.originalDatUrl && record.source?.sourcePaperDoi === expected.doi, `${label} provenance changed`);
  check(record.derivedObject?.path === expected.outputPath.replace(/^public/, "") && record.derivedObject?.authority === "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP" && record.derivedObject?.documentType === "neurolucida_source_native_mbf_cell_body_line_loop_geometry", `${label} derived authority/path changed`);
  check(Number.isInteger(record.derivedObject.bytes) && record.derivedObject.bytes > 0 && /^[a-f0-9]{64}$/.test(record.derivedObject.sha256), `${label} geometry receipt is invalid`);
  check(record.admission?.admittedContourObjectCount === 12 && record.admission?.admittedVertexCount === expected.vertexCount && record.admission?.renderedPrimitiveCount === 12, `${label} admitted counts changed`);
  check(record.audit?.exactSourceContourObjectCount === 12 && record.audit?.somaNamedContourObjectCount === 12 && record.audit?.somaNamedVertexCount === expected.vertexCount, `${label} audited counts changed`);
  check(record.audit?.sourceClosedSomaNamedContourCount === 0 && record.audit?.sourceOpenSomaNamedContourCount === 12 && record.audit?.emptyValueCellBodyPresencePropertyCount === 12, `${label} raw closure/property gate changed`);
  check(record.audit?.independentParserSomaContourCount === 12 && record.audit?.independentParserClassification === "somaContour" && record.audit?.independentPointArraysAgree === true, `${label} independent classification changed`);
  check(same(record.audit?.somaNamedVertexCountsInSourceOrder, expected.vertexVector) && same(record.audit?.somaNamedZInSourceOrderMicrometre, expected.zVector) && record.audit?.somaNamedPointPayloadSha256 === expected.pointSha256, `${label} source-order arrays changed`);
  check(record.sourceEvidence?.sourceName === expected.sourceName && record.sourceEvidence?.standardizedSwcDiameterAvailable === expected.swcDiameterAvailable && record.sourceEvidence?.nativeDrawingWidthAuthorizesSwcDiameter === false, `${label} SWC diameter boundary changed`);
  check(record.sourceLinks?.mbfCellBodySemantics === NATIVE_DETAIL_04_MBF_URL, `${label} MBF evidence link changed`);
}

export function validateNativeDetail04Geometry(payload, admissionRecord) {
  const expected = NATIVE_DETAIL_04_RECORDS.find((record) => record.neuronId === admissionRecord?.neuronId);
  check(expected, "No file-specific native detail admission exists");
  validateNativeDetail04Record(admissionRecord, expected);
  const label = `NMO ${expected.neuronId}`;
  check(payload.documentType === "neurolucida_source_native_mbf_cell_body_line_loop_geometry" && payload.schemaVersion === "0.4.0", `${label} geometry identity changed`);
  check(payload.closureInterpretation?.exactSourceName === expected.contourName && payload.closureInterpretation?.rawSourceClosedFlagPreserved === true && payload.closureInterpretation?.rawSourceClosedFlagValue === false && payload.closureInterpretation?.interpretedClosed === true, `${label} raw/interpreted closure changed`);
  check(same(payload.closureInterpretation?.requiredPresenceProperty, PRESENCE) && payload.closureInterpretation?.independentParserClassification === "somaContour" && payload.closureInterpretation?.mbfDocumentationUrl === NATIVE_DETAIL_04_MBF_URL, `${label} closure evidence changed`);
  check(same(payload.extraction?.independentAudit?.receipt, NATIVE_DETAIL_04_AUDIT) && same(payload.extraction?.independentAudit?.parser, NATIVE_DETAIL_04_PARSER) && payload.extraction?.independentAudit?.exactPointArraysAgree === true, `${label} parser audit changed`);
  check(payload.summary?.pointPayloadSha256 === expected.pointSha256 && payload.extraction?.independentAudit?.exactPointPayloadSha256 === expected.pointSha256, `${label} point receipt changed`);
  check(payload.contours.length === 12 && same(payload.contours.map((contour) => contour.vertexCount), expected.vertexVector) && same(payload.contours.map((contour) => contour.zValuesMicrometre), expected.zVector.map((z) => [z])), `${label} source-order vector changed`);
  for (const [index, contour] of payload.contours.entries()) {
    check(contour.id === `nmo-${expected.neuronId}-native-contour-${index + 1}` && contour.sourceName === expected.contourName && contour.sourceClosedFlag === false && contour.sourceProperties?.CellBody === true, `${label} exact source contour changed`);
    check(same(contour.sourcePropertyReceipts, RAW_PRESENCE) && same(contour.cellBodyPresenceProperty, PRESENCE), `${label} empty-value presence receipt changed`);
    check(contour.independentParserClassification === "somaContour" && contour.semanticClass === "soma_contour_trace" && /raw sourceClosedFlag remains false/.test(contour.closureBasis), `${label} contour classification changed`);
    check(contour.points.every((point) => point[2] === expected.zVector[index]), `${label} source z coordinates changed`);
  }
  for (const field of NATIVE_DETAIL_04_ZERO_FIELDS) check(payload.summary?.[field] === 0, `${label} ${field} must remain zero`);
  check(payload.summary?.rawSourceClosedTrueContourObjectCount === 0 && payload.summary?.rawSourceClosedFalseContourObjectCount === 12 && payload.summary?.semanticClosedSegmentCount === expected.vertexCount, `${label} source closure counts changed`);
  check(payload.displayContract?.preserveSourcePointOrder === true && payload.displayContract?.preserveDuplicateZPlanesAsSeparateObjects === true && payload.displayContract?.preserveRawSourceClosedFlag === true && payload.displayContract?.closeLastToFirstByMbfCellBodySemantics === true && payload.displayContract?.admittedPrimitive === "source-native MBF cell-body ordered LineLoop only", `${label} line-loop display changed`);
  check(payload.displayContract?.nativeDrawingWidthAuthorizesSwcDiameter === false && same(payload.displayContract?.forbiddenInferences, NATIVE_DETAIL_04_FORBIDDEN), `${label} interpretation boundary changed`);
  return payload;
}
