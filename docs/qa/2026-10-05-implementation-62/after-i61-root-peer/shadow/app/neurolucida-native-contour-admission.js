import {
  nativeSomaContourBounds,
  nativeSomaContourDisplayTransform,
  transformNativeSomaContourPoint,
} from "./neurolucida-native-soma-contours.js";
import { validateNativeDetail04Delta, validateNativeDetail04Geometry } from "./neurolucida-native-detail-admission.js";

export const NATIVE_CONTOUR_ADMISSION_AUTHORITY = "OBS_SOURCE_NATIVE_CLOSED_CONTOUR_TRACE";
export const NATIVE_CONTOUR_MBF_CELL_BODY_AUTHORITY = "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP";
export const NATIVE_CONTOUR_AUDITED_NEURON_IDS = Object.freeze([45718, 45674, 50424, 50394, 50408]);
export const NATIVE_CONTOUR_RENDERABLE_NEURON_IDS = NATIVE_CONTOUR_AUDITED_NEURON_IDS;

const TODD_MBF_CELL_BODY_EXPECTED = Object.freeze(new Map([
  [50424, Object.freeze({
    contourCount: 8,
    vertexCount: 427,
    sourceContourCount: 12,
    auxiliaryVertexCount: 185,
    sourceBytes: 480757,
    sourceSha256: "90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9",
    geometryBytes: 71212,
    geometrySha256: "8bd390d698a77dc80a95c7d560e823d5f0ff1d5daadb2194be6475ba250851d6",
    vertexVector: Object.freeze([64, 64, 59, 41, 67, 66, 46, 20]),
    zVector: Object.freeze([-17, -16, -15, -14, -18, -19, -20, -21]),
    pointSha256: "6638f9b056bedadaba503f3607115a4be27988ae71dd0ed8b309f3085143ab8b",
  })],
  [50394, Object.freeze({
    contourCount: 14,
    vertexCount: 768,
    sourceContourCount: 18,
    auxiliaryVertexCount: 130,
    sourceBytes: 191975,
    sourceSha256: "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109",
    geometryBytes: 123254,
    geometrySha256: "61fddbab3764e761600c2519e478eec4cee7918a581b2fde29ac2d8880c90a92",
    vertexVector: Object.freeze([67, 63, 55, 57, 51, 56, 58, 41, 68, 59, 59, 47, 48, 39]),
    zVector: Object.freeze([-51, -52, -53, -54, -55, -56, -57, -58, -50, -49, -48, -47, -46, -45]),
    pointSha256: "b823d7ef36d28ec05836425c82ba5b9bd4edfd8fb1bf1b821eecce833abe8f4b",
  })],
  [50408, Object.freeze({
    contourCount: 11,
    vertexCount: 709,
    sourceContourCount: 15,
    auxiliaryVertexCount: 155,
    sourceBytes: 300076,
    sourceSha256: "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2",
    geometryBytes: 110635,
    geometrySha256: "30d9c7870329aa0d2c6c2e83aeb020587973bf44e72c214a46f809532ba9ae78",
    vertexVector: Object.freeze([58, 71, 80, 69, 49, 26, 82, 83, 83, 61, 47]),
    zVector: Object.freeze([-21, -20, -19, -18, -17, -16, -22, -23, -24, -25, -26]),
    pointSha256: "8052deb6cef02af95f8b7864784f8e5b9ed2c1d070c87698150b4152701a14b5",
  })],
]));

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function same(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export function nativeContourAdmissionRecord(catalog, neuronId) {
  if (!isRecord(catalog) || !Array.isArray(catalog.records) || !Number.isInteger(neuronId)) return null;
  return catalog.records.find((record) => record.neuronId === neuronId) ?? null;
}

function validateCatalogCommon(catalog) {
  check(catalog.schemaVersion === "0.2.0", "Native contour catalog schema changed");
  check(catalog.contractId === "neurolucida-native-contour-admission-catalog-0.2", "Native contour catalog identity changed");
  check(catalog.releaseId === "ohri-neurolucida-native-contour-admission-catalog-0.2.0", "Native contour release identity changed");
  check(Array.isArray(catalog.records) && same(catalog.records.map((record) => record.neuronId), NATIVE_CONTOUR_AUDITED_NEURON_IDS), "Native contour audited-record identity/order changed");
  check(new Set(catalog.records.map((record) => record.assetId)).size === catalog.records.length, "Native contour asset identities must be unique");
  check(catalog.summary?.auditedDatFileCount === 5 && catalog.summary?.admittedRecordCount === 2 && catalog.summary?.heldRecordCount === 3, "Native contour audit/admission denominators changed");
  check(catalog.summary?.admittedContourObjectCount === 15 && catalog.summary?.admittedVertexCount === 475 && catalog.summary?.admittedRenderedPrimitiveCount === 15, "Native contour admitted object/vertex denominator changed");
  for (const field of ["admittedSurfaceCount", "admittedVolumeCount", "admittedInternalStructureObjectCount", "standardizedSwcOverlayCount", "sameCellCrossModalJoinCount", "registrationCount"]) {
    check(catalog.summary?.[field] === 0, `Native contour ${field} must remain zero`);
  }
  check(catalog.relationshipBoundary?.sourceNativeFrameOnly === true && catalog.relationshipBoundary?.overlayWithStandardizedSwcAllowed === false, "Native contour source-frame or overlay boundary changed");
  check(catalog.parserAudit?.commit === "e07fd2d53c03945f011c335c7b643765f2d85a09", "Independent parser commit changed");
  check(catalog.parserAudit?.parserSha256 === "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2", "Independent parser receipt changed");

  const existing = nativeContourAdmissionRecord(catalog, 45718);
  const renshaw = nativeContourAdmissionRecord(catalog, 45674);
  check(existing?.admissionStatus === "admitted_prior_exact_contract" && existing.admission?.admittedContourObjectCount === 8 && existing.admission?.admittedVertexCount === 275, "NMO 45718 admission changed");
  check(existing?.derivedObject?.authority === "OBS_SOURCE_NATIVE_CONTOUR_TRACE", "NMO 45718 authority changed");
  check(renshaw?.admissionStatus === "admitted_source_closed_subset" && renshaw.admission?.admittedContourObjectCount === 7 && renshaw.admission?.admittedVertexCount === 200, "NMO 45674 strict admission changed");
  check(renshaw?.derivedObject?.authority === NATIVE_CONTOUR_ADMISSION_AUTHORITY, "NMO 45674 authority changed");
  check(renshaw?.audit?.sourceClosedSomaNamedContourCount === 7 && renshaw.audit?.sourceOpenSomaNamedContourCount === 1, "NMO 45674 source flag partition changed");
  check(same(renshaw?.audit?.somaNamedVertexCountsInSourceOrder, [14, 33, 27, 50, 46, 17, 13, 27]), "NMO 45674 audited source-order vertex vector changed");
  check(renshaw?.audit?.somaNamedPointPayloadSha256 === "fdf787a947c962e25880c427fd4004a39cb1b48526cb06a0b485d675be1a0c7f", "NMO 45674 audited all-soma point receipt changed");
  for (const neuronId of [50424, 50394, 50408]) {
    const record = nativeContourAdmissionRecord(catalog, neuronId);
    check(record?.admissionStatus === "held_source_closed_flag_false", `NMO ${neuronId} must remain held`);
    check(record?.admission?.admittedContourObjectCount === 0 && record?.admission?.renderedPrimitiveCount === 0, `NMO ${neuronId} must admit zero contours`);
    check(record?.audit?.sourceClosedSomaNamedContourCount === 0 && record?.audit?.sourceOpenSomaNamedContourCount === record?.audit?.somaNamedContourObjectCount, `NMO ${neuronId} false-flag audit changed`);
    check(!("derivedObject" in record), `NMO ${neuronId} must not declare derived geometry`);
  }
}

function validateCatalog03(catalog) {
  check(catalog.schemaVersion === "0.3.0", "Native contour 0.3 catalog schema changed");
  check(catalog.contractId === "neurolucida-native-contour-admission-catalog-0.3", "Native contour 0.3 catalog identity changed");
  check(catalog.releaseId === "ohri-neurolucida-native-contour-admission-catalog-0.3.0", "Native contour 0.3 release identity changed");
  check(catalog.parentCatalog?.path === "data/neurolucida-native-contour-admission-catalog-0.2.json" && catalog.parentCatalog?.bytes === 17392 && catalog.parentCatalog?.sha256 === "fa27f8e6d4cfebadd2d0127c43b7aa2a5496066fd7dd5b613b3b9a8c68346d86", "Frozen native contour 0.2 parent receipt changed");
  check(Array.isArray(catalog.records) && same(catalog.records.map((record) => record.neuronId), NATIVE_CONTOUR_AUDITED_NEURON_IDS), "Native contour audited-record identity/order changed");
  check(new Set(catalog.records.map((record) => record.assetId)).size === catalog.records.length, "Native contour asset identities must be unique");
  check(catalog.summary?.auditedDatFileCount === 5 && catalog.summary?.admittedRecordCount === 5 && catalog.summary?.heldRecordCount === 0, "Native contour 0.3 audit/admission denominators changed");
  check(catalog.summary?.admittedContourObjectCount === 48 && catalog.summary?.admittedVertexCount === 2379 && catalog.summary?.admittedRenderedPrimitiveCount === 48, "Native contour 0.3 admitted object/vertex denominator changed");
  check(catalog.summary?.toddAdmittedRecordCount === 3 && catalog.summary?.toddAdmittedContourObjectCount === 33 && catalog.summary?.toddAdmittedVertexCount === 1904 && catalog.summary?.excludedToddUserLineObjectCount === 12, "Todd MBF Cell Body admission denominators changed");
  for (const field of ["admittedFilledPolygonCount", "admittedTriangleCount", "admittedLoftCount", "admittedSurfaceCount", "admittedMembraneCount", "admittedVolumeCount", "admittedInternalStructureObjectCount", "biologicalMeasurementCount", "standardizedSwcOverlayCount", "sameCellCrossModalJoinCount", "registrationCount"]) {
    check(catalog.summary?.[field] === 0, `Native contour 0.3 ${field} must remain zero`);
  }
  check(catalog.relationshipBoundary?.sourceNativeFrameOnly === true && catalog.relationshipBoundary?.coordinateTransformToStandardizedSwcStatus === "not_established" && catalog.relationshipBoundary?.overlayWithStandardizedSwcAllowed === false, "Native contour 0.3 source-frame or overlay boundary changed");
  check(catalog.relationshipBoundary?.sameCellMolecularProfileJoinCount === 0 && catalog.relationshipBoundary?.sameSpecimenInternalStructureCount === 0 && catalog.relationshipBoundary?.atlasRegistrationCount === 0, "Native contour 0.3 relationship boundary changed");
  check(catalog.parserAudit?.commit === "e07fd2d53c03945f011c335c7b643765f2d85a09", "Independent parser commit changed");
  check(catalog.parserAudit?.parserSha256 === "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2", "Independent parser receipt changed");
  check(catalog.parserAudit?.typeLibrarySha256 === "8006588950ef0ee55da9a4bea46f93b9120a5dc6c29d6b5263050c7a6d168d89" && catalog.parserAudit?.requiredClassification === "somaContour", "Independent somaContour classification receipt changed");
  check(catalog.mbfCellBodySemantics?.documentationUrl === "https://www.mbfbioscience.com/help/neurolucida/Content/Ribbons/Trace/traceCellBody.htm", "MBF Cell Body closure evidence changed");
  check(/closed shapes/i.test(catalog.mbfCellBodySemantics?.sourceStatement ?? "") && /exact-checksum DAT contour named Cell Body/.test(catalog.mbfCellBodySemantics?.admissionScope ?? ""), "MBF Cell Body closure scope changed");

  const existing = nativeContourAdmissionRecord(catalog, 45718);
  const renshaw = nativeContourAdmissionRecord(catalog, 45674);
  check(existing?.admissionStatus === "admitted_prior_exact_contract" && existing.admission?.admittedContourObjectCount === 8 && existing.admission?.admittedVertexCount === 275, "NMO 45718 admission changed");
  check(existing?.derivedObject?.authority === "OBS_SOURCE_NATIVE_CONTOUR_TRACE", "NMO 45718 authority changed");
  check(renshaw?.admissionStatus === "admitted_source_closed_subset" && renshaw.admission?.admittedContourObjectCount === 7 && renshaw.admission?.admittedVertexCount === 200, "NMO 45674 strict admission changed");
  check(renshaw?.derivedObject?.authority === NATIVE_CONTOUR_ADMISSION_AUTHORITY, "NMO 45674 authority changed");

  for (const [neuronId, expected] of TODD_MBF_CELL_BODY_EXPECTED) {
    const record = nativeContourAdmissionRecord(catalog, neuronId);
    check(record?.assetId === `NeuroMorpho:${neuronId}`, `NMO ${neuronId} asset identity changed`);
    check(record?.admissionStatus === "admitted_mbf_cell_body_semantic_rule", `NMO ${neuronId} MBF Cell Body admission changed`);
    check(record?.admission?.admittedContourObjectCount === expected.contourCount && record?.admission?.renderedPrimitiveCount === expected.contourCount && record?.admission?.admittedVertexCount === expected.vertexCount, `NMO ${neuronId} admitted contour/vertex denominator changed`);
    check(record?.source?.bytes === expected.sourceBytes && record?.source?.sha256 === expected.sourceSha256, `NMO ${neuronId} exact DAT receipt changed`);
    check(record?.derivedObject?.authority === NATIVE_CONTOUR_MBF_CELL_BODY_AUTHORITY && record?.derivedObject?.documentType === "neurolucida_source_native_mbf_cell_body_line_loop_geometry" && record?.derivedObject?.bytes === expected.geometryBytes && record?.derivedObject?.sha256 === expected.geometrySha256, `NMO ${neuronId} geometry authority or receipt changed`);
    check(record?.audit?.exactSourceContourObjectCount === expected.sourceContourCount && record?.audit?.somaNamedContourObjectCount === expected.contourCount && record?.audit?.somaNamedVertexCount === expected.vertexCount, `NMO ${neuronId} source contour denominator changed`);
    check(record?.audit?.sourceClosedSomaNamedContourCount === 0 && record?.audit?.sourceOpenSomaNamedContourCount === expected.contourCount, `NMO ${neuronId} raw false closure-flag receipt changed`);
    check(record?.audit?.emptyValueCellBodyPresencePropertyCount === expected.contourCount && record?.audit?.independentParserSomaContourCount === expected.contourCount && record?.audit?.independentParserClassification === "somaContour", `NMO ${neuronId} CellBody/somaContour evidence changed`);
    check(record?.audit?.auxiliaryTraceObjectCount === 4 && record?.audit?.auxiliaryTraceVertexCount === expected.auxiliaryVertexCount && same(record?.audit?.somaNamedVertexCountsInSourceOrder, expected.vertexVector), `NMO ${neuronId} source-object inventory changed`);
    check(same(record?.audit?.somaNamedZInSourceOrderMicrometre, expected.zVector) && record?.audit?.somaNamedPointPayloadSha256 === expected.pointSha256, `NMO ${neuronId} source-order point receipt changed`);
    check(record?.audit?.independentPointArraysAgree === true, `NMO ${neuronId} independent point-array agreement changed`);
    check(record?.sourceLinks?.mbfCellBodySemantics === catalog.mbfCellBodySemantics.documentationUrl, `NMO ${neuronId} MBF evidence link changed`);
  }
}

export function validateNativeContourAdmissionCatalog(catalog) {
  check(isRecord(catalog), "Native contour admission catalog must be an object");
  if (catalog.schemaVersion === "0.2.0") validateCatalogCommon(catalog);
  else if (catalog.schemaVersion === "0.3.0") validateCatalog03(catalog);
  else if (catalog.schemaVersion === "0.4.0") {
    const { records, baseCatalogSnapshot, ...delta } = catalog;
    validateNativeDetail04Delta(delta);
    validateCatalog03(baseCatalogSnapshot);
    check(same(records, [...baseCatalogSnapshot.records, ...delta.addedRecords]), "Native detail composition must retain the frozen base and exact ordered additions");
  }
  else throw new Error("Native contour catalog schema changed");
  return catalog;
}

export function validateNativeContourGeometry(payload, admissionRecord) {
  check(isRecord(payload) && isRecord(admissionRecord), "Native contour geometry and admission record are required");
  check(payload.assetId === admissionRecord.assetId, "Native contour geometry asset identity mismatch");
  check(payload.sourceFrame === "Neurolucida_DAT_source_native_unregistered" && payload.registrationStatus === "unregistered", "Native contour geometry frame changed");
  check(payload.source?.bytes === admissionRecord.source?.bytes && payload.source?.sha256 === admissionRecord.source?.sha256, "Native contour source receipt mismatch");
  check(Array.isArray(payload.contours) && payload.contours.length === admissionRecord.admission?.admittedContourObjectCount, "Native contour object denominator mismatch");
  check(payload.contours.reduce((sum, contour) => sum + contour.vertexCount, 0) === admissionRecord.admission?.admittedVertexCount, "Native contour vertex denominator mismatch");
  for (const contour of payload.contours) {
    check(Array.isArray(contour.points) && contour.points.length === contour.vertexCount, `${contour.id} point count mismatch`);
    check(contour.interpretedClosed === true && contour.semanticSegmentCount === contour.vertexCount, `${contour.id} is not an admitted semantic line loop`);
    check(contour.points.every((point) => Array.isArray(point) && point.length === 4 && point.every(Number.isFinite)), `${contour.id} has an invalid source point`);
  }
  check(payload.summary?.vertexCount === admissionRecord.admission?.admittedVertexCount, "Native contour summary vertex denominator mismatch");
  check(payload.summary?.surfaceCount === 0 && payload.summary?.volumeCount === 0 && payload.summary?.internalStructureObjectCount === 0 && payload.summary?.registrationCount === 0 && payload.summary?.crossSourceJoinCount === 0, "Native contour geometry gained unsupported authority");
  check(payload.summary?.pointPayloadSha256 === admissionRecord.audit?.somaNamedPointPayloadSha256 || payload.summary?.pointPayloadSha256 === payload.extraction?.independentAudit?.exactPointPayloadSha256, "Native contour point-payload receipt mismatch");
  check(payload.displayContract?.traceRadiusRenderingUse === "forbidden", "Native contour trace radius cannot control anatomical thickness");

  if (admissionRecord.neuronId === 45674) {
    check(payload.documentType === "neurolucida_source_native_closed_soma_contour_geometry" && payload.schemaVersion === "0.2.0", "NMO 45674 geometry identity changed");
    check(payload.contours.every((contour) => contour.sourceName === "CellBody" && contour.sourceClosedFlag === true), "NMO 45674 geometry contains a non-source-closed CellBody trace");
    check(same(payload.contours.map((contour) => contour.vertexCount), [14, 33, 27, 50, 46, 17, 13]), "NMO 45674 admitted vertex vector changed");
    check(same(payload.contours.map((contour) => contour.zValuesMicrometre[0]), [-82, -80, -80, -78, -76, -76, -74]), "NMO 45674 admitted source-order z vector changed");
    check(payload.summary.pointPayloadSha256 === "b163a222ae560d3467a94f3438985c868548695205d56efaaeed454b67977208", "NMO 45674 admitted point receipt changed");
    check(payload.displayContract?.preserveDuplicateZPlanesAsSeparateObjects === true, "NMO 45674 duplicate z planes must remain separate");
  } else if (admissionRecord.neuronId === 45718) {
    const soma1 = payload.contours.filter((contour) => contour.sourceName === "Soma 1");
    const cellBody = payload.contours.filter((contour) => contour.sourceName === "Cell Body");
    check(payload.documentType === "neurolucida_source_native_soma_contour_trace_geometry" && payload.schemaVersion === "0.1.0", "NMO 45718 geometry identity changed");
    check(soma1.length === 7 && cellBody.length === 1 && cellBody[0].sourceClosedFlag === false, "NMO 45718 legacy separation changed");
  } else if ([108978, 249676].includes(admissionRecord.neuronId)) {
    validateNativeDetail04Geometry(payload, admissionRecord);
  } else if (TODD_MBF_CELL_BODY_EXPECTED.has(admissionRecord.neuronId)) {
    const expected = TODD_MBF_CELL_BODY_EXPECTED.get(admissionRecord.neuronId);
    check(payload.documentType === "neurolucida_source_native_mbf_cell_body_line_loop_geometry" && payload.schemaVersion === "0.3.0", `NMO ${admissionRecord.neuronId} Todd geometry identity changed`);
    check(admissionRecord.derivedObject?.authority === NATIVE_CONTOUR_MBF_CELL_BODY_AUTHORITY, `NMO ${admissionRecord.neuronId} Todd geometry authority changed`);
    check(payload.closureInterpretation?.rawSourceClosedFlagPreserved === true && payload.closureInterpretation?.rawSourceClosedFlagValue === false && payload.closureInterpretation?.interpretedClosed === true, `NMO ${admissionRecord.neuronId} raw/interpreted closure receipt changed`);
    check(payload.closureInterpretation?.exactSourceName === "Cell Body" && same(payload.closureInterpretation?.requiredPresenceProperty, { key: "CellBody", declaredValueCount: 0, rawValues: [], interpretedPresence: true }), `NMO ${admissionRecord.neuronId} CellBody presence-property gate changed`);
    check(payload.closureInterpretation?.independentParserClassification === "somaContour" && payload.closureInterpretation?.mbfDocumentation?.documentationUrl === "https://www.mbfbioscience.com/help/neurolucida/Content/Ribbons/Trace/traceCellBody.htm" && /closed shapes/i.test(payload.closureInterpretation?.mbfDocumentation?.sourceStatement ?? "") && /exact-checksum DAT contour named Cell Body/.test(payload.closureInterpretation?.mbfDocumentation?.admissionScope ?? ""), `NMO ${admissionRecord.neuronId} parser/MBF closure basis changed`);
    check(payload.extraction?.independentAudit?.commit === "e07fd2d53c03945f011c335c7b643765f2d85a09" && payload.extraction?.independentAudit?.parserSha256 === "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2" && payload.extraction?.independentAudit?.typeLibrarySha256 === "8006588950ef0ee55da9a4bea46f93b9120a5dc6c29d6b5263050c7a6d168d89", `NMO ${admissionRecord.neuronId} pinned parser receipt changed`);
    check(payload.extraction?.independentAudit?.exactSomaContourClassificationCount === expected.contourCount && payload.extraction?.independentAudit?.exactPointArraysAgree === true, `NMO ${admissionRecord.neuronId} independent parser result changed`);
    check(payload.contours.every((contour) => contour.sourceName === "Cell Body" && contour.sourceClosedFlag === false && contour.sourceProperties?.CellBody === true), `NMO ${admissionRecord.neuronId} geometry contains a non-Cell Body or non-raw-false trace`);
    check(payload.contours.every((contour) => same(contour.sourcePropertyReceipts, [{ key: "CellBody", declaredValueCount: 0, values: [] }]) && same(contour.cellBodyPresenceProperty, { key: "CellBody", declaredValueCount: 0, rawValues: [], interpretedPresence: true })), `NMO ${admissionRecord.neuronId} geometry lacks the exact empty-value CellBody presence receipt`);
    check(payload.contours.every((contour) => contour.independentParserClassification === "somaContour" && contour.semanticClass === "soma_contour_trace" && /raw sourceClosedFlag remains false/.test(contour.closureBasis)), `NMO ${admissionRecord.neuronId} geometry closure classification changed`);
    check(same(payload.contours.map((contour) => contour.vertexCount), expected.vertexVector) && same(payload.contours.map((contour) => contour.zValuesMicrometre[0]), expected.zVector), `NMO ${admissionRecord.neuronId} geometry source-order vector changed`);
    check(payload.summary?.sourceSomaContourObjectCount === expected.contourCount && payload.summary?.admittedMbfCellBodyContourObjectCount === expected.contourCount && payload.summary?.rawSourceClosedTrueContourObjectCount === 0 && payload.summary?.rawSourceClosedFalseContourObjectCount === expected.contourCount && payload.summary?.semanticClosedSegmentCount === expected.vertexCount, `NMO ${admissionRecord.neuronId} geometry closure denominator changed`);
    check(payload.summary?.excludedUserLineObjectCount === 4 && payload.summary?.excludedUserLineVertexCount === expected.auxiliaryVertexCount && payload.summary?.pointPayloadSha256 === expected.pointSha256, `NMO ${admissionRecord.neuronId} User Line exclusion or point receipt changed`);
    for (const field of ["filledPolygonCount", "triangleCount", "loftCount", "surfaceCount", "membraneCount", "volumeCount", "internalStructureObjectCount", "biologicalMeasurementCount", "standardizedSwcOverlayCount", "sameCellJoinCount", "registrationCount", "crossSourceJoinCount"]) {
      check(payload.summary?.[field] === 0, `NMO ${admissionRecord.neuronId} ${field} must remain zero`);
    }
    check(payload.displayContract?.admittedPrimitive === "source-native MBF cell-body ordered LineLoop only" && payload.displayContract?.preserveRawSourceClosedFlag === true && payload.displayContract?.closeLastToFirstByMbfCellBodySemantics === true, `NMO ${admissionRecord.neuronId} LineLoop display contract changed`);
    check(same(payload.displayContract?.excludedSourceNames, ["User Line 1", "User Line 2", "User Line 3", "User Line 4"]), `NMO ${admissionRecord.neuronId} excluded User Line identities changed`);
    for (const boundary of ["generic false-flag closure", "polygon fill", "triangulation", "lofted surface", "membrane, nucleus or organelle model", "volume estimate", "biological measurement", "standardized SWC overlay", "same-cell join", "atlas registration", "representative type morphology"]) {
      check(payload.displayContract?.forbiddenInferences?.includes(boundary), `NMO ${admissionRecord.neuronId} missing forbidden inference: ${boundary}`);
    }
  } else {
    throw new Error(`NMO ${admissionRecord.neuronId} has no admitted native contour geometry`);
  }
  return payload;
}

export {
  nativeSomaContourBounds as nativeContourBounds,
  nativeSomaContourDisplayTransform as nativeContourDisplayTransform,
  transformNativeSomaContourPoint as transformNativeContourPoint,
};
