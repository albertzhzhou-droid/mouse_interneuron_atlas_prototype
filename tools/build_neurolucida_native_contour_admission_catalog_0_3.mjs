#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PARENT_CATALOG_PATH = "data/neurolucida-native-contour-admission-catalog-0.2.json";
const CATALOG_PATH = "data/neurolucida-native-contour-admission-catalog-0.3.json";

const TYPE = Object.freeze({
  string: 0x0001,
  sample: 0x0101,
  sampleList: 0x0103,
  property: 0x0104,
  propertyList: 0x0105,
  contour: 0x0201,
});

const MBF_CELL_BODY_SEMANTICS = Object.freeze({
  documentationUrl: "https://www.mbfbioscience.com/help/neurolucida/Content/Ribbons/Trace/traceCellBody.htm",
  documentationTitle: "Tracing cell bodies",
  sourceStatement: "MBF documents Neurolucida cell bodies as closed shapes, including separate cross-sections traced at multiple focal planes.",
  admissionScope: "Only an exact-checksum DAT contour named Cell Body with a zero-value CellBody presence property and pinned-parser somaContour classification may use this closure interpretation.",
});

const INDEPENDENT_PARSER = Object.freeze({
  repository: "https://github.com/NeuroMorpho/xyz2swc",
  commit: "e07fd2d53c03945f011c335c7b643765f2d85a09",
  parserPath: "modules/hbp/node_modules/morphology_io/app/morphology_parser.js",
  parserGitBlobSha1: "0934ced806f0a4e4992fe2edae2e8e060a23f1a7",
  parserSha256: "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2",
  typeLibraryPath: "modules/hbp/node_modules/morphology_io/app/swcPlus_typeLibrary.js",
  typeLibraryGitBlobSha1: "31d223b111f2109e0c72149b367efd885f45e0ed",
  typeLibrarySha256: "8006588950ef0ee55da9a4bea46f93b9120a5dc6c29d6b5263050c7a6d168d89",
  requiredClassification: "somaContour",
  classificationBasis: "The pinned type library maps the CellBody presence property to the somaContour semantic class.",
  parserLicenseNotice: "GPL-3.0-or-later parser used only for independent offline comparison; parser code is not bundled",
  diagnosticLog: ["Neurolucida.DAT: ignoring thumbnail"],
});

const TODD_RECORDS = Object.freeze([
  {
    neuronId: 50424,
    title: "NPY-positive superficial lumbar dorsal-horn interneuron",
    sourcePath: "public/data/functional_class_observed_morphology_route_pack_v1/original/nmo-50424.dat",
    outputPath: "public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-50424-mbf-cell-body-line-loops.json",
    bytes: 480757,
    sha256: "90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9",
    officialRecordUrl: "https://neuromorpho.org/api/neuron/id/50424",
    originalDatUrl: "https://neuromorpho.org/dableFiles/todd/Source-Version/C135-18-06-13-Ab.dat",
    sourcePaperDoi: "10.1097/j.pain.0000000000000407",
    expected: {
      sourceContourCount: 12,
      somaContourCount: 8,
      somaVertexCounts: [64, 64, 59, 41, 67, 66, 46, 20],
      somaZ: [-17, -16, -15, -14, -18, -19, -20, -21],
      somaPointPayloadSha256: "6638f9b056bedadaba503f3607115a4be27988ae71dd0ed8b309f3085143ab8b",
      auxiliaryContourCount: 4,
      auxiliaryVertexCount: 185,
    },
    inventory: { propertyListCount: 2, thumbnailCount: 1, contourCount: 12, markerObjectCount: 0, treeCount: 3, branchCount: 609, markerCount: 803, spineCount: 59, textObjectCount: 0 },
  },
  {
    neuronId: 50394,
    title: "PrP-promoter reporter-positive nNOS-positive interneuron",
    sourcePath: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/original/nmo-50394.dat",
    outputPath: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50394-mbf-cell-body-line-loops.json",
    bytes: 191975,
    sha256: "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109",
    officialRecordUrl: "https://neuromorpho.org/api/neuron/id/50394",
    originalDatUrl: "https://neuromorpho.org/dableFiles/todd/Source-Version/C11-15-08-12-B.dat",
    sourcePaperDoi: "10.1523/JNEUROSCI.0406-15.2015",
    expected: {
      sourceContourCount: 18,
      somaContourCount: 14,
      somaVertexCounts: [67, 63, 55, 57, 51, 56, 58, 41, 68, 59, 59, 47, 48, 39],
      somaZ: [-51, -52, -53, -54, -55, -56, -57, -58, -50, -49, -48, -47, -46, -45],
      somaPointPayloadSha256: "b823d7ef36d28ec05836425c82ba5b9bd4edfd8fb1bf1b821eecce833abe8f4b",
      auxiliaryContourCount: 4,
      auxiliaryVertexCount: 130,
    },
    inventory: { propertyListCount: 2, thumbnailCount: 1, contourCount: 18, markerObjectCount: 0, treeCount: 5, branchCount: 283, markerCount: 194, spineCount: 86, textObjectCount: 0 },
  },
  {
    neuronId: 50408,
    title: "PrP-promoter reporter-positive galanin-positive interneuron",
    sourcePath: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/original/nmo-50408.dat",
    outputPath: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50408-mbf-cell-body-line-loops.json",
    bytes: 300076,
    sha256: "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2",
    officialRecordUrl: "https://neuromorpho.org/api/neuron/id/50408",
    originalDatUrl: "https://neuromorpho.org/dableFiles/todd/Source-Version/C113-08-05-13-C.dat",
    sourcePaperDoi: "10.1523/JNEUROSCI.0406-15.2015",
    expected: {
      sourceContourCount: 15,
      somaContourCount: 11,
      somaVertexCounts: [58, 71, 80, 69, 49, 26, 82, 83, 83, 61, 47],
      somaZ: [-21, -20, -19, -18, -17, -16, -22, -23, -24, -25, -26],
      somaPointPayloadSha256: "8052deb6cef02af95f8b7864784f8e5b9ed2c1d070c87698150b4152701a14b5",
      auxiliaryContourCount: 4,
      auxiliaryVertexCount: 155,
    },
    inventory: { propertyListCount: 2, thumbnailCount: 1, contourCount: 15, markerObjectCount: 0, treeCount: 4, branchCount: 645, markerCount: 404, spineCount: 117, textObjectCount: 0 },
  },
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

class DatCursor {
  constructor(bytes, position = 0) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.position = position;
  }

  ensure(length, label) {
    check(this.position + length <= this.bytes.byteLength, `${label} exceeds DAT byte bounds`);
  }

  uint8() { this.ensure(1, "uint8"); const value = this.view.getUint8(this.position); this.position += 1; return value; }
  uint16() { this.ensure(2, "uint16"); const value = this.view.getUint16(this.position, true); this.position += 2; return value; }
  uint32() { this.ensure(4, "uint32"); const value = this.view.getUint32(this.position, true); this.position += 4; return value; }
  float32() { this.ensure(4, "float32"); const value = this.view.getFloat32(this.position, true); this.position += 4; return value; }
  peekUint16(offset = 0) { this.ensure(offset + 2, "peekUint16"); return this.view.getUint16(this.position + offset, true); }

  blockHeader(expectedType = null) {
    const start = this.position;
    const type = this.uint16();
    const size = this.uint32();
    check(size >= 6, `Invalid DAT block size ${size} at byte ${start}`);
    const end = start + size;
    check(end <= this.bytes.byteLength, `DAT block at byte ${start} exceeds file bounds`);
    if (expectedType !== null) check(type === expectedType, `Expected DAT block 0x${expectedType.toString(16)}, got 0x${type.toString(16)} at byte ${start}`);
    return { start, type, size, end };
  }
}

function readString(cursor) {
  const block = cursor.blockHeader(TYPE.string);
  let value = new TextDecoder("windows-1252").decode(cursor.bytes.subarray(cursor.position, block.end));
  cursor.position = block.end;
  while (value.endsWith(String.fromCharCode(0))) value = value.slice(0, -1);
  return value;
}

function readColor(cursor) {
  return `#${[cursor.uint8(), cursor.uint8(), cursor.uint8()].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function readProperty(cursor) {
  const block = cursor.blockHeader(TYPE.property);
  const key = readString(cursor);
  const declaredValueCount = cursor.uint16();
  const values = [];
  while (cursor.position < block.end) {
    const dataType = cursor.uint16();
    if (dataType === 0) values.push(cursor.float32());
    else if (dataType === 1 || dataType === 2) values.push(readString(cursor));
    else if (dataType === 3) { values.push(readColor(cursor)); cursor.uint8(); }
    else throw new Error(`Unsupported DAT property value type ${dataType} for ${key}`);
  }
  check(cursor.position === block.end && declaredValueCount === values.length, `Property ${key} did not match its declared boundary/count`);
  return { key, declaredValueCount, values, interpretedValue: values.length > 1 ? values : values[0] ?? true };
}

function readPropertyList(cursor) {
  const block = cursor.blockHeader(TYPE.propertyList);
  const declaredCount = cursor.uint16();
  const sourceProperties = {};
  const sourcePropertyReceipts = [];
  while (cursor.position < block.end) {
    check(cursor.peekUint16() === TYPE.property, `Unexpected DAT property-list member at byte ${cursor.position}`);
    const property = readProperty(cursor);
    sourceProperties[property.key] = property.interpretedValue;
    sourcePropertyReceipts.push({ key: property.key, declaredValueCount: property.declaredValueCount, values: property.values });
  }
  check(sourcePropertyReceipts.length === declaredCount, "DAT property-list count mismatch");
  return { sourceProperties, sourcePropertyReceipts };
}

function readSample(cursor) {
  const block = cursor.blockHeader(TYPE.sample);
  check(block.end - cursor.position >= 16, "DAT sample lacks x/y/z/diameter fields");
  const point = [cursor.float32(), cursor.float32(), cursor.float32(), cursor.float32() * 0.5];
  if (cursor.position < block.end) cursor.uint16();
  check(cursor.position === block.end, "DAT sample contains unsupported trailing bytes");
  return point;
}

function readSampleList(cursor) {
  const block = cursor.blockHeader(TYPE.sampleList);
  const declaredCount = cursor.uint16();
  const points = [];
  while (cursor.position < block.end) {
    check(cursor.peekUint16() === TYPE.sample, `Unexpected DAT sample-list member at byte ${cursor.position}`);
    points.push(readSample(cursor));
  }
  check(points.length === declaredCount, "DAT sample-list count mismatch");
  return points;
}

function boundsOf(points) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const point of points) for (let axis = 0; axis < 3; axis += 1) {
    min[axis] = Math.min(min[axis], point[axis]);
    max[axis] = Math.max(max[axis], point[axis]);
  }
  return { min, max };
}

function readContour(cursor, ordinal) {
  const block = cursor.blockHeader(TYPE.contour);
  const sourceName = readString(cursor);
  const sourceClosedFlag = cursor.uint16() === 1;
  const sourceColor = readColor(cursor);
  cursor.uint8();
  check(cursor.uint16() === 0, `Contour ${ordinal} has an unsupported non-zero reserved field`);
  const properties = cursor.peekUint16() === TYPE.propertyList
    ? readPropertyList(cursor)
    : { sourceProperties: {}, sourcePropertyReceipts: [] };
  check(cursor.peekUint16() === TYPE.sampleList, `Contour ${ordinal} has no sample list`);
  const points = readSampleList(cursor);
  check(cursor.position <= block.end, `Contour ${ordinal} exceeds its declared block`);
  cursor.position = block.end;
  return {
    id: `source-native-contour-${ordinal}`,
    sourceName,
    sourceClosedFlag,
    sourceColor,
    ...properties,
    vertexCount: points.length,
    zValuesMicrometre: [...new Set(points.map((point) => point[2]))].sort((a, b) => a - b),
    boundsMicrometre: boundsOf(points),
    sourceBlockOffsetByte: block.start,
    sourceBlockSizeByte: block.size,
    pointColumns: ["x_micrometre", "y_micrometre", "z_micrometre", "trace_radius_micrometre"],
    points,
  };
}

function extractToddContours(bytes) {
  check(new TextDecoder("windows-1252").decode(bytes.subarray(1, 12)) === "V3 DAT file", "Neurolucida V3 DAT header token is missing");
  check(bytes.readUInt32LE(bytes.byteLength - 4) === 0xaabbccdd, "Neurolucida DAT terminal marker changed");
  const allowedNames = new Set(["Cell Body", "User Line 1", "User Line 2", "User Line 3", "User Line 4"]);
  const contours = [];
  const end = bytes.byteLength - 4;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 70; offset <= end - 12; offset += 1) {
    if (view.getUint16(offset, true) !== TYPE.contour) continue;
    const size = view.getUint32(offset + 2, true);
    if (size < 12 || offset + size > end) continue;
    const probe = new DatCursor(bytes, offset + 6);
    if (probe.peekUint16() !== TYPE.string) continue;
    let sourceName;
    try { sourceName = readString(probe); } catch { continue; }
    if (!allowedNames.has(sourceName)) continue;
    try {
      const cursor = new DatCursor(bytes, offset);
      contours.push(readContour(cursor, contours.length + 1));
      offset = cursor.position - 1;
    } catch {
      continue;
    }
  }
  return contours;
}

function sourceReceipt(record, bytes) {
  return {
    path: `/${record.sourcePath.replace(/^public\//, "")}`,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    officialRecordUrl: record.officialRecordUrl,
    originalDatUrl: record.originalDatUrl,
    sourcePaperDoi: record.sourcePaperDoi,
    rights: "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use and original-paper attribution",
    rightsUrl: "https://neuromorpho.org/useterm.jsp",
  };
}

function exactCellBodyPresenceReceipt(contour) {
  const receipts = contour.sourcePropertyReceipts.filter((property) => property.key === "CellBody");
  check(receipts.length === 1, `${contour.id} must expose exactly one CellBody presence property`);
  const receipt = receipts[0];
  check(receipt.declaredValueCount === 0 && receipt.values.length === 0 && contour.sourceProperties.CellBody === true, `${contour.id} CellBody property must be empty-value presence=true`);
  return { key: "CellBody", declaredValueCount: 0, rawValues: [], interpretedPresence: true };
}

function auditToddRecord(record, bytes) {
  check(bytes.byteLength === record.bytes && sha256(bytes) === record.sha256, `NMO ${record.neuronId} DAT receipt drifted`);
  const contours = extractToddContours(bytes);
  check(contours.length === record.expected.sourceContourCount, `NMO ${record.neuronId} contour denominator drifted`);
  const soma = contours.filter((contour) => contour.sourceName === "Cell Body");
  const auxiliary = contours.filter((contour) => contour.sourceName !== "Cell Body");
  check(soma.length === record.expected.somaContourCount, `NMO ${record.neuronId} Cell Body denominator drifted`);
  check(JSON.stringify(soma.map((contour) => contour.vertexCount)) === JSON.stringify(record.expected.somaVertexCounts), `NMO ${record.neuronId} Cell Body vertex vector drifted`);
  check(JSON.stringify(soma.map((contour) => contour.zValuesMicrometre[0])) === JSON.stringify(record.expected.somaZ), `NMO ${record.neuronId} Cell Body z vector drifted`);
  check(sha256(Buffer.from(JSON.stringify(soma.map((contour) => contour.points)))) === record.expected.somaPointPayloadSha256, `NMO ${record.neuronId} point-array receipt drifted`);
  check(auxiliary.length === record.expected.auxiliaryContourCount, `NMO ${record.neuronId} User Line denominator drifted`);
  check(auxiliary.reduce((sum, contour) => sum + contour.vertexCount, 0) === record.expected.auxiliaryVertexCount, `NMO ${record.neuronId} User Line vertex denominator drifted`);
  check(soma.every((contour) => contour.sourceClosedFlag === false), `NMO ${record.neuronId} raw sourceClosedFlag partition changed`);
  check(soma.every((contour) => exactCellBodyPresenceReceipt(contour).interpretedPresence), `NMO ${record.neuronId} CellBody presence evidence changed`);
  check(auxiliary.every((contour) => /^User Line [1-4]$/.test(contour.sourceName)), `NMO ${record.neuronId} auxiliary trace identity changed`);
  return { record, bytes, soma, auxiliary };
}

function buildToddGeometry(audit, builderBytes) {
  const { record, bytes, soma, auxiliary } = audit;
  const pointPayloadSha256 = sha256(Buffer.from(JSON.stringify(soma.map((contour) => contour.points))));
  const geometry = {
    documentType: "neurolucida_source_native_mbf_cell_body_line_loop_geometry",
    schemaVersion: "0.3.0",
    releaseId: "ohri-neurolucida-native-contour-admission-catalog-0.3.0",
    assetId: `NeuroMorpho:${record.neuronId}`,
    sourceFrame: "Neurolucida_DAT_source_native_unregistered",
    units: "micrometre_interpreted_from_Neurolucida_semantics",
    registrationStatus: "unregistered",
    source: sourceReceipt(record, bytes),
    extraction: {
      productionMethod: "project_clean_room_checksum_gated_source_specific_neurolucida_contour_block_reader",
      builderPath: `/${path.relative(PROJECT_ROOT, fileURLToPath(import.meta.url))}`,
      builderSha256: sha256(builderBytes),
      independentAudit: {
        ...INDEPENDENT_PARSER,
        exactPointPayloadSha256: pointPayloadSha256,
        exactPointArraysAgree: true,
        exactSomaContourClassificationCount: soma.length,
      },
    },
    closureInterpretation: {
      rawSourceClosedFlagPreserved: true,
      rawSourceClosedFlagValue: false,
      interpretedClosed: true,
      exactSourceName: "Cell Body",
      requiredPresenceProperty: { key: "CellBody", declaredValueCount: 0, rawValues: [], interpretedPresence: true },
      independentParserClassification: "somaContour",
      mbfDocumentation: MBF_CELL_BODY_SEMANTICS,
    },
    summary: {
      sourceSomaContourObjectCount: soma.length,
      admittedMbfCellBodyContourObjectCount: soma.length,
      rawSourceClosedTrueContourObjectCount: 0,
      rawSourceClosedFalseContourObjectCount: soma.length,
      excludedUserLineObjectCount: auxiliary.length,
      excludedUserLineVertexCount: auxiliary.reduce((sum, contour) => sum + contour.vertexCount, 0),
      vertexCount: soma.reduce((sum, contour) => sum + contour.vertexCount, 0),
      semanticClosedSegmentCount: soma.reduce((sum, contour) => sum + contour.vertexCount, 0),
      filledPolygonCount: 0,
      triangleCount: 0,
      loftCount: 0,
      surfaceCount: 0,
      membraneCount: 0,
      volumeCount: 0,
      internalStructureObjectCount: 0,
      biologicalMeasurementCount: 0,
      standardizedSwcOverlayCount: 0,
      sameCellJoinCount: 0,
      registrationCount: 0,
      crossSourceJoinCount: 0,
      pointPayloadSha256,
    },
    displayContract: {
      admittedPrimitive: "source-native MBF cell-body ordered LineLoop only",
      preserveSourceCoordinates: true,
      preserveSourceOrder: true,
      preserveRawSourceClosedFlag: true,
      closeLastToFirstByMbfCellBodySemantics: true,
      viewportTransform: "contour_bounds_centered_uniform_scale_only",
      traceRadiusRenderingUse: "forbidden",
      measurementUse: "source coordinates retained for provenance; biological measurement is not authorized",
      excludedSourceNames: ["User Line 1", "User Line 2", "User Line 3", "User Line 4"],
      forbiddenInferences: ["generic false-flag closure", "polygon fill", "triangulation", "lofted surface", "membrane, nucleus or organelle model", "volume estimate", "biological measurement", "standardized SWC overlay", "same-cell join", "atlas registration", "representative type morphology"],
    },
    contours: soma.map((contour, index) => ({
      ...contour,
      id: `nmo-${record.neuronId}-mbf-cell-body-line-loop-${index + 1}`,
      cellBodyPresenceProperty: exactCellBodyPresenceReceipt(contour),
      independentParserClassification: "somaContour",
      semanticClass: "soma_contour_trace",
      interpretedClosed: true,
      closureBasis: "Exact Cell Body name + empty-value CellBody presence property + pinned parser somaContour classification + MBF cell-body closure semantics; raw sourceClosedFlag remains false.",
      semanticSegmentCount: contour.vertexCount,
    })),
  };
  const geometryBytes = Buffer.from(stableJson(geometry));
  return { record, geometry, geometryBytes };
}

export async function buildNeurolucidaNativeContourAdmissionCatalog03() {
  const [parentCatalogBytes, builderBytes, ...sourceBytes] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, PARENT_CATALOG_PATH)),
    readFile(fileURLToPath(import.meta.url)),
    ...TODD_RECORDS.map((record) => readFile(path.join(PROJECT_ROOT, record.sourcePath))),
  ]);
  check(parentCatalogBytes.byteLength === 17392 && sha256(parentCatalogBytes) === "fa27f8e6d4cfebadd2d0127c43b7aa2a5496066fd7dd5b613b3b9a8c68346d86", "Frozen 0.2 parent catalog receipt drifted");
  const parentCatalog = JSON.parse(parentCatalogBytes.toString("utf8"));
  check(parentCatalog.releaseId === "ohri-neurolucida-native-contour-admission-catalog-0.2.0", "Frozen 0.2 parent catalog identity drifted");
  const priorRecords = [45718, 45674].map((neuronId) => structuredClone(parentCatalog.records.find((record) => record.neuronId === neuronId)));
  check(priorRecords.every(Boolean), "Frozen prior native-contour admissions are incomplete");

  const toddGeometries = TODD_RECORDS.map((record, index) => buildToddGeometry(auditToddRecord(record, sourceBytes[index]), builderBytes));
  const toddCatalogRecords = toddGeometries.map(({ record, geometry, geometryBytes }) => ({
    neuronId: record.neuronId,
    assetId: geometry.assetId,
    title: record.title,
    admissionStatus: "admitted_mbf_cell_body_semantic_rule",
    source: geometry.source,
    derivedObject: {
      path: `/${record.outputPath.replace(/^public\//, "")}`,
      bytes: geometryBytes.byteLength,
      sha256: sha256(geometryBytes),
      documentType: geometry.documentType,
      authority: "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP",
    },
    audit: {
      exactSourceContourObjectCount: record.expected.sourceContourCount,
      somaNamedContourObjectCount: geometry.summary.sourceSomaContourObjectCount,
      somaNamedVertexCount: geometry.summary.vertexCount,
      somaNamedVertexCountsInSourceOrder: geometry.contours.map((contour) => contour.vertexCount),
      somaNamedZInSourceOrderMicrometre: geometry.contours.map((contour) => contour.zValuesMicrometre[0]),
      somaNamedPointPayloadSha256: geometry.summary.pointPayloadSha256,
      sourceClosedSomaNamedContourCount: 0,
      sourceOpenSomaNamedContourCount: geometry.summary.sourceSomaContourObjectCount,
      emptyValueCellBodyPresencePropertyCount: geometry.summary.sourceSomaContourObjectCount,
      independentParserSomaContourCount: geometry.summary.sourceSomaContourObjectCount,
      independentParserClassification: "somaContour",
      auxiliaryTraceObjectCount: geometry.summary.excludedUserLineObjectCount,
      auxiliaryTraceVertexCount: geometry.summary.excludedUserLineVertexCount,
      fullObjectInventory: record.inventory,
      independentPointArraysAgree: true,
    },
    admission: {
      admittedContourObjectCount: geometry.summary.admittedMbfCellBodyContourObjectCount,
      admittedVertexCount: geometry.summary.vertexCount,
      renderedPrimitiveCount: geometry.summary.admittedMbfCellBodyContourObjectCount,
      reason: `Exactly ${geometry.summary.admittedMbfCellBodyContourObjectCount} Cell Body objects pass the checksum + empty-value CellBody presence-property + pinned-parser somaContour + MBF cell-body closure rule. Raw sourceClosedFlag=false is preserved; four User Line objects remain excluded.`,
    },
    viewer: { primaryLabel: `${geometry.summary.admittedMbfCellBodyContourObjectCount} MBF Cell Body line loops`, secondaryLabel: null, primarySourceNames: ["Cell Body"], secondarySourceNames: [] },
    sourceLinks: {
      officialRecord: record.officialRecordUrl,
      originalDat: record.originalDatUrl,
      primaryPaper: `https://doi.org/${record.sourcePaperDoi}`,
      converterRepository: INDEPENDENT_PARSER.repository,
      mbfCellBodySemantics: MBF_CELL_BODY_SEMANTICS.documentationUrl,
      morphologySpecification: "https://neuromorphological-file-specification.readthedocs.io/en/latest/NMF.html",
      rights: "https://neuromorpho.org/useterm.jsp",
    },
    hardBoundaries: [
      "Raw sourceClosedFlag=false is preserved; this is a source-evidenced MBF cell-body semantic interpretation, not a generic false-flag closure rule.",
      "User Line 1–4 objects remain excluded because their biological meaning is unresolved.",
      "LineLoop only: no fill, triangle, loft, surface, membrane, volume, internal object, biological measurement, SWC overlay, same-cell join or registration is admitted.",
    ],
  }));

  const records = [...priorRecords, ...toddCatalogRecords];
  const admittedContourObjectCount = records.reduce((sum, record) => sum + record.admission.admittedContourObjectCount, 0);
  const admittedVertexCount = records.reduce((sum, record) => sum + record.admission.admittedVertexCount, 0);
  check(admittedContourObjectCount === 48 && admittedVertexCount === 2379, "0.3 admitted contour/vertex totals drifted");
  const catalog = {
    schemaVersion: "0.3.0",
    contractId: "neurolucida-native-contour-admission-catalog-0.3",
    releaseId: "ohri-neurolucida-native-contour-admission-catalog-0.3.0",
    releasedAt: "2026-09-02",
    title: "Per-record Neurolucida native contour admission catalog",
    purpose: "Admit exact source-native line loops only when each record passes its explicit closure rule, while preserving raw flags, exclusions and zero-authority boundaries.",
    parentCatalog: { path: PARENT_CATALOG_PATH, bytes: parentCatalogBytes.byteLength, sha256: sha256(parentCatalogBytes), releaseId: parentCatalog.releaseId },
    parserAudit: INDEPENDENT_PARSER,
    mbfCellBodySemantics: MBF_CELL_BODY_SEMANTICS,
    records,
    summary: {
      auditedDatFileCount: 5,
      admittedRecordCount: 5,
      heldRecordCount: 0,
      admittedContourObjectCount,
      admittedVertexCount,
      admittedRenderedPrimitiveCount: admittedContourObjectCount,
      toddAdmittedRecordCount: 3,
      toddAdmittedContourObjectCount: 33,
      toddAdmittedVertexCount: 1904,
      excludedToddUserLineObjectCount: 12,
      admittedFilledPolygonCount: 0,
      admittedTriangleCount: 0,
      admittedLoftCount: 0,
      admittedSurfaceCount: 0,
      admittedMembraneCount: 0,
      admittedVolumeCount: 0,
      admittedInternalStructureObjectCount: 0,
      biologicalMeasurementCount: 0,
      standardizedSwcOverlayCount: 0,
      sameCellCrossModalJoinCount: 0,
      registrationCount: 0,
    },
    relationshipBoundary: {
      sourceNativeFrameOnly: true,
      coordinateTransformToStandardizedSwcStatus: "not_established",
      overlayWithStandardizedSwcAllowed: false,
      sameCellMolecularProfileJoinCount: 0,
      sameSpecimenInternalStructureCount: 0,
      atlasRegistrationCount: 0,
    },
  };
  return { catalog, catalogBytes: Buffer.from(stableJson(catalog)), toddGeometries };
}

async function main() {
  const mode = process.argv[2] ?? "--check";
  check(["--write", "--check"].includes(mode), "Usage: build_neurolucida_native_contour_admission_catalog_0_3.mjs [--write|--check]");
  const built = await buildNeurolucidaNativeContourAdmissionCatalog03();
  if (mode === "--write") {
    for (const { record, geometryBytes } of built.toddGeometries) {
      const output = path.join(PROJECT_ROOT, record.outputPath);
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, geometryBytes);
    }
    await writeFile(path.join(PROJECT_ROOT, CATALOG_PATH), built.catalogBytes);
  } else {
    const catalogBytes = await readFile(path.join(PROJECT_ROOT, CATALOG_PATH));
    check(catalogBytes.equals(built.catalogBytes), `${CATALOG_PATH} is stale`);
    for (const { record, geometryBytes } of built.toddGeometries) {
      check((await readFile(path.join(PROJECT_ROOT, record.outputPath))).equals(geometryBytes), `${record.outputPath} is stale`);
    }
  }
  console.log(JSON.stringify({
    mode,
    releaseId: built.catalog.releaseId,
    auditedDatFileCount: built.catalog.summary.auditedDatFileCount,
    admittedRecordCount: built.catalog.summary.admittedRecordCount,
    heldRecordCount: built.catalog.summary.heldRecordCount,
    admittedContourObjectCount: built.catalog.summary.admittedContourObjectCount,
    admittedVertexCount: built.catalog.summary.admittedVertexCount,
    toddAdmittedContourObjectCount: built.catalog.summary.toddAdmittedContourObjectCount,
    toddAdmittedVertexCount: built.catalog.summary.toddAdmittedVertexCount,
    catalogBytes: built.catalogBytes.byteLength,
    catalogSha256: sha256(built.catalogBytes),
    geometries: built.toddGeometries.map(({ record, geometryBytes }) => ({ neuronId: record.neuronId, path: record.outputPath, bytes: geometryBytes.byteLength, sha256: sha256(geometryBytes) })),
    admittedSurfaceCount: built.catalog.summary.admittedSurfaceCount,
    admittedInternalStructureObjectCount: built.catalog.summary.admittedInternalStructureObjectCount,
    registrationCount: built.catalog.summary.registrationCount,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
