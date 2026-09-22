#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = "public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-45674-source-closed-soma-contours.json";
const CATALOG_PATH = "data/neurolucida-native-contour-admission-catalog-0.2.json";
const PRIOR_CONTRACT_PATH = "data/neurolucida-source-native-soma-contour-trace-0.1.json";

const TYPE = Object.freeze({
  string: 0x0001,
  sample: 0x0101,
  sampleList: 0x0103,
  property: 0x0104,
  propertyList: 0x0105,
  contour: 0x0201,
});

const INDEPENDENT_PARSER = Object.freeze({
  repository: "https://github.com/NeuroMorpho/xyz2swc",
  commit: "e07fd2d53c03945f011c335c7b643765f2d85a09",
  parserPath: "modules/hbp/node_modules/morphology_io/app/morphology_parser.js",
  parserGitBlobSha1: "0934ced806f0a4e4992fe2edae2e8e060a23f1a7",
  parserSha256: "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2",
  typeLibraryGitBlobSha1: "31d223b111f2109e0c72149b367efd885f45e0ed",
  typeLibrarySha256: "8006588950ef0ee55da9a4bea46f93b9120a5dc6c29d6b5263050c7a6d168d89",
  parserLicenseNotice: "GPL-3.0-or-later parser used only for independent offline comparison; parser code is not bundled",
  diagnosticLog: ["Neurolucida.DAT: ignoring thumbnail"],
});

const RECORDS = Object.freeze([
  {
    neuronId: 45674,
    title: "Calbindin-positive glycinergic Renshaw interneuron",
    sourcePath: "public/data/functional_class_observed_morphology_route_pack_v1/original/nmo-45674.dat",
    bytes: 353251,
    sha256: "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87",
    officialRecordUrl: "https://neuromorpho.org/api/neuron/id/45674",
    originalDatUrl: "https://neuromorpho.org/dableFiles/bannatyne/Source-Version/101029p2-A-In.dat",
    sourcePaperDoi: "10.1523/JNEUROSCI.0199-14.2014",
    candidateNames: ["CellBody", "Cell Body", "Unknown1"],
    somaNames: ["CellBody", "Cell Body"],
    expected: {
      sourceContourCount: 10,
      somaContourCount: 8,
      somaVertexCounts: [14, 33, 27, 50, 46, 17, 13, 27],
      somaZ: [-82, -80, -80, -78, -76, -76, -74, -78],
      somaPointPayloadSha256: "fdf787a947c962e25880c427fd4004a39cb1b48526cb06a0b485d675be1a0c7f",
      admittedVertexCounts: [14, 33, 27, 50, 46, 17, 13],
      admittedZ: [-82, -80, -80, -78, -76, -76, -74],
      admittedOffsets: [20371, 20911, 21907, 22759, 24163, 25471, 26083],
      admittedBlockSizes: [540, 996, 852, 1404, 1308, 612, 516],
      admittedPointPayloadSha256: "b163a222ae560d3467a94f3438985c868548695205d56efaaeed454b67977208",
      auxiliaryContourCount: 2,
      auxiliaryVertexCount: 4,
    },
    inventory: { propertyListCount: 2, thumbnailCount: 1, contourCount: 10, markerObjectCount: 2, treeCount: 32, branchCount: 675, markerCount: 1054, spineCount: 0, textObjectCount: 0 },
  },
  {
    neuronId: 50424,
    title: "NPY-positive superficial lumbar dorsal-horn interneuron",
    sourcePath: "public/data/functional_class_observed_morphology_route_pack_v1/original/nmo-50424.dat",
    bytes: 480757,
    sha256: "90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9",
    officialRecordUrl: "https://neuromorpho.org/api/neuron/id/50424",
    originalDatUrl: "https://neuromorpho.org/dableFiles/todd/Source-Version/C135-18-06-13-Ab.dat",
    sourcePaperDoi: "10.1097/j.pain.0000000000000407",
    candidateNames: ["Cell Body", "User Line 1", "User Line 2", "User Line 3", "User Line 4"],
    somaNames: ["Cell Body"],
    expected: { sourceContourCount: 12, somaContourCount: 8, somaVertexCounts: [64, 64, 59, 41, 67, 66, 46, 20], somaZ: [-17, -16, -15, -14, -18, -19, -20, -21], somaPointPayloadSha256: "6638f9b056bedadaba503f3607115a4be27988ae71dd0ed8b309f3085143ab8b", auxiliaryContourCount: 4, auxiliaryVertexCount: 185 },
    inventory: { propertyListCount: 2, thumbnailCount: 1, contourCount: 12, markerObjectCount: 0, treeCount: 3, branchCount: 609, markerCount: 803, spineCount: 59, textObjectCount: 0 },
  },
  {
    neuronId: 50394,
    title: "PrP-promoter reporter-positive nNOS-positive interneuron",
    sourcePath: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/original/nmo-50394.dat",
    bytes: 191975,
    sha256: "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109",
    officialRecordUrl: "https://neuromorpho.org/api/neuron/id/50394",
    originalDatUrl: "https://neuromorpho.org/dableFiles/todd/Source-Version/C11-15-08-12-B.dat",
    sourcePaperDoi: "10.1523/JNEUROSCI.0406-15.2015",
    candidateNames: ["Cell Body", "User Line 1", "User Line 2", "User Line 3", "User Line 4"],
    somaNames: ["Cell Body"],
    expected: { sourceContourCount: 18, somaContourCount: 14, somaVertexCounts: [67, 63, 55, 57, 51, 56, 58, 41, 68, 59, 59, 47, 48, 39], somaZ: [-51, -52, -53, -54, -55, -56, -57, -58, -50, -49, -48, -47, -46, -45], somaPointPayloadSha256: "b823d7ef36d28ec05836425c82ba5b9bd4edfd8fb1bf1b821eecce833abe8f4b", auxiliaryContourCount: 4, auxiliaryVertexCount: 130 },
    inventory: { propertyListCount: 2, thumbnailCount: 1, contourCount: 18, markerObjectCount: 0, treeCount: 5, branchCount: 283, markerCount: 194, spineCount: 86, textObjectCount: 0 },
  },
  {
    neuronId: 50408,
    title: "PrP-promoter reporter-positive galanin-positive interneuron",
    sourcePath: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/original/nmo-50408.dat",
    bytes: 300076,
    sha256: "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2",
    officialRecordUrl: "https://neuromorpho.org/api/neuron/id/50408",
    originalDatUrl: "https://neuromorpho.org/dableFiles/todd/Source-Version/C113-08-05-13-C.dat",
    sourcePaperDoi: "10.1523/JNEUROSCI.0406-15.2015",
    candidateNames: ["Cell Body", "User Line 1", "User Line 2", "User Line 3", "User Line 4"],
    somaNames: ["Cell Body"],
    expected: { sourceContourCount: 15, somaContourCount: 11, somaVertexCounts: [58, 71, 80, 69, 49, 26, 82, 83, 83, 61, 47], somaZ: [-21, -20, -19, -18, -17, -16, -22, -23, -24, -25, -26], somaPointPayloadSha256: "8052deb6cef02af95f8b7864784f8e5b9ed2c1d070c87698150b4152701a14b5", auxiliaryContourCount: 4, auxiliaryVertexCount: 155 },
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
  return [key, values.length > 1 ? values : values[0] ?? true];
}

function readPropertyList(cursor) {
  const block = cursor.blockHeader(TYPE.propertyList);
  const declaredCount = cursor.uint16();
  const properties = {};
  let actualCount = 0;
  while (cursor.position < block.end) {
    check(cursor.peekUint16() === TYPE.property, `Unexpected DAT property-list member at byte ${cursor.position}`);
    const [key, value] = readProperty(cursor);
    properties[key] = value;
    actualCount += 1;
  }
  check(actualCount === declaredCount, "DAT property-list count mismatch");
  return properties;
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
  const properties = cursor.peekUint16() === TYPE.propertyList ? readPropertyList(cursor) : {};
  check(cursor.peekUint16() === TYPE.sampleList, `Contour ${ordinal} has no sample list`);
  const points = readSampleList(cursor);
  check(cursor.position <= block.end, `Contour ${ordinal} exceeds its declared block`);
  cursor.position = block.end;
  return {
    id: `source-native-contour-${ordinal}`,
    sourceName,
    sourceClosedFlag,
    sourceColor,
    sourceProperties: properties,
    vertexCount: points.length,
    zValuesMicrometre: [...new Set(points.map((point) => point[2]))].sort((a, b) => a - b),
    boundsMicrometre: boundsOf(points),
    sourceBlockOffsetByte: block.start,
    sourceBlockSizeByte: block.size,
    pointColumns: ["x_micrometre", "y_micrometre", "z_micrometre", "trace_radius_micrometre"],
    points,
  };
}

function extractNamedContours(bytes, names) {
  check(new TextDecoder("windows-1252").decode(bytes.subarray(1, 12)) === "V3 DAT file", "Neurolucida V3 DAT header token is missing");
  check(bytes.readUInt32LE(bytes.byteLength - 4) === 0xaabbccdd, "Neurolucida DAT terminal marker changed");
  const allowed = new Set(names);
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
    if (!allowed.has(sourceName)) continue;
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

function validateAudit(record, bytes, contours) {
  check(bytes.byteLength === record.bytes && sha256(bytes) === record.sha256, `NMO ${record.neuronId} DAT receipt drifted`);
  check(contours.length === record.expected.sourceContourCount, `NMO ${record.neuronId} contour candidate denominator drifted`);
  const soma = contours.filter((contour) => record.somaNames.includes(contour.sourceName));
  const auxiliary = contours.filter((contour) => !record.somaNames.includes(contour.sourceName));
  check(soma.length === record.expected.somaContourCount, `NMO ${record.neuronId} soma contour denominator drifted`);
  check(JSON.stringify(soma.map((contour) => contour.vertexCount)) === JSON.stringify(record.expected.somaVertexCounts), `NMO ${record.neuronId} soma vertex vector drifted`);
  check(JSON.stringify(soma.map((contour) => contour.zValuesMicrometre[0])) === JSON.stringify(record.expected.somaZ), `NMO ${record.neuronId} soma z vector drifted`);
  check(sha256(Buffer.from(JSON.stringify(soma.map((contour) => contour.points)))) === record.expected.somaPointPayloadSha256, `NMO ${record.neuronId} independent soma point receipt drifted`);
  check(auxiliary.length === record.expected.auxiliaryContourCount, `NMO ${record.neuronId} auxiliary contour denominator drifted`);
  check(auxiliary.reduce((sum, contour) => sum + contour.vertexCount, 0) === record.expected.auxiliaryVertexCount, `NMO ${record.neuronId} auxiliary vertex denominator drifted`);
  return { soma, auxiliary };
}

function blockedRecord(record, bytes, soma, auxiliary) {
  check(soma.every((contour) => contour.sourceClosedFlag === false), `NMO ${record.neuronId} source-closed status changed`);
  return {
    neuronId: record.neuronId,
    assetId: `NeuroMorpho:${record.neuronId}`,
    title: record.title,
    admissionStatus: "held_source_closed_flag_false",
    source: sourceReceipt(record, bytes),
    audit: {
      exactSourceContourObjectCount: record.expected.sourceContourCount,
      somaNamedContourObjectCount: soma.length,
      somaNamedVertexCount: soma.reduce((sum, contour) => sum + contour.vertexCount, 0),
      somaNamedVertexCountsInSourceOrder: soma.map((contour) => contour.vertexCount),
      somaNamedZInSourceOrderMicrometre: soma.map((contour) => contour.zValuesMicrometre[0]),
      somaNamedPointPayloadSha256: record.expected.somaPointPayloadSha256,
      sourceClosedSomaNamedContourCount: 0,
      sourceOpenSomaNamedContourCount: soma.length,
      auxiliaryTraceObjectCount: auxiliary.length,
      auxiliaryTraceVertexCount: auxiliary.reduce((sum, contour) => sum + contour.vertexCount, 0),
      fullObjectInventory: record.inventory,
      independentPointArraysAgree: true,
    },
    admission: {
      admittedContourObjectCount: 0,
      admittedVertexCount: 0,
      renderedPrimitiveCount: 0,
      reason: "Every soma-named source contour retains sourceClosedFlag=false. The pinned parser identifies the objects as soma contours but preserves the false source flag; the spaced Cell Body legacy interpretation remains a future per-file policy gate.",
    },
    hardBoundaries: [
      "No open source contour is silently converted into a LineLoop.",
      "User Line traces have unresolved biological meaning and remain excluded.",
      "No fill, triangle, loft, surface, membrane, volume, internal object, SWC overlay, same-cell join or registration is admitted.",
    ],
  };
}

export async function buildNeurolucidaNativeContourAdmissionCatalog() {
  const [priorContractBytes, builderBytes, ...sourceBytes] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, PRIOR_CONTRACT_PATH)),
    readFile(fileURLToPath(import.meta.url)),
    ...RECORDS.map((record) => readFile(path.join(PROJECT_ROOT, record.sourcePath))),
  ]);
  const priorContract = JSON.parse(priorContractBytes.toString("utf8"));
  check(priorContract.releaseId === "ohri-neurolucida-source-native-soma-contour-trace-0.1.0", "NMO 45718 parent contour contract drifted");
  check(priorContract.summary.pointPayloadSha256 === "a478e6263e7d00c1f17bc64143014a3519c39f771b6809a28b057db07c724ab4", "NMO 45718 parent point receipt drifted");

  const audits = RECORDS.map((record, index) => {
    const contours = extractNamedContours(sourceBytes[index], record.candidateNames);
    return { record, bytes: sourceBytes[index], ...validateAudit(record, sourceBytes[index], contours) };
  });
  const renshawAudit = audits[0];
  const admitted = renshawAudit.soma.filter((contour) => contour.sourceName === "CellBody" && contour.sourceClosedFlag === true);
  const excludedOpenSoma = renshawAudit.soma.filter((contour) => !contour.sourceClosedFlag);
  check(admitted.length === 7 && excludedOpenSoma.length === 1, "NMO 45674 strict source-closed partition drifted");
  check(JSON.stringify(admitted.map((contour) => contour.vertexCount)) === JSON.stringify(renshawAudit.record.expected.admittedVertexCounts), "NMO 45674 admitted vertex vector drifted");
  check(JSON.stringify(admitted.map((contour) => contour.zValuesMicrometre[0])) === JSON.stringify(renshawAudit.record.expected.admittedZ), "NMO 45674 admitted z vector drifted");
  check(JSON.stringify(admitted.map((contour) => contour.sourceBlockOffsetByte)) === JSON.stringify(renshawAudit.record.expected.admittedOffsets), "NMO 45674 admitted block offsets drifted");
  check(JSON.stringify(admitted.map((contour) => contour.sourceBlockSizeByte)) === JSON.stringify(renshawAudit.record.expected.admittedBlockSizes), "NMO 45674 admitted block sizes drifted");
  const admittedPointPayloadSha256 = sha256(Buffer.from(JSON.stringify(admitted.map((contour) => contour.points))));
  check(admittedPointPayloadSha256 === renshawAudit.record.expected.admittedPointPayloadSha256, "NMO 45674 admitted point payload disagrees with the independent parser audit");
  check(admitted.every((contour) => contour.sourceColor === "#759a65"), "NMO 45674 admitted source colors drifted");

  const geometry = {
    documentType: "neurolucida_source_native_closed_soma_contour_geometry",
    schemaVersion: "0.2.0",
    releaseId: "ohri-neurolucida-native-contour-admission-catalog-0.2.0",
    assetId: "NeuroMorpho:45674",
    sourceFrame: "Neurolucida_DAT_source_native_unregistered",
    units: "micrometre_interpreted_from_Neurolucida_semantics",
    registrationStatus: "unregistered",
    source: sourceReceipt(renshawAudit.record, renshawAudit.bytes),
    extraction: {
      productionMethod: "project_clean_room_checksum_gated_source_specific_neurolucida_contour_block_reader",
      builderPath: `/${path.relative(PROJECT_ROOT, fileURLToPath(import.meta.url))}`,
      builderSha256: sha256(builderBytes),
      independentAudit: { ...INDEPENDENT_PARSER, exactPointPayloadSha256: admittedPointPayloadSha256, exactPointArraysAgree: true, firstPointIndices: [4, 18, 51, 78, 128, 174, 191] },
    },
    summary: {
      sourceSomaContourObjectCount: renshawAudit.soma.length,
      admittedSourceClosedContourObjectCount: admitted.length,
      excludedSourceOpenSomaContourObjectCount: excludedOpenSoma.length,
      excludedUnresolvedAuxiliaryContourObjectCount: renshawAudit.auxiliary.length,
      vertexCount: admitted.reduce((sum, contour) => sum + contour.vertexCount, 0),
      semanticClosedSegmentCount: admitted.reduce((sum, contour) => sum + contour.vertexCount, 0),
      filledPolygonCount: 0,
      triangleCount: 0,
      surfaceCount: 0,
      volumeCount: 0,
      internalStructureObjectCount: 0,
      registrationCount: 0,
      crossSourceJoinCount: 0,
      pointPayloadSha256: admittedPointPayloadSha256,
    },
    displayContract: {
      admittedPrimitive: "source-flagged ordered closed polyline only",
      preserveSourceCoordinates: true,
      preserveSourceOrder: true,
      preserveDuplicateZPlanesAsSeparateObjects: true,
      viewportTransform: "contour_bounds_centered_uniform_scale_only",
      closeLastToFirstBySourceFlag: true,
      traceRadiusRenderingUse: "forbidden",
      measurementUse: "source_coordinates_visible_but_biological_measurement_not_authorized",
      forbiddenInferences: ["open-contour closure", "polygon fill", "triangulation", "lofted surface", "membrane, nucleus or organelle model", "volume estimate", "standardized SWC overlay", "atlas registration", "representative type morphology"],
    },
    contours: admitted.map((contour, index) => ({
      ...contour,
      id: `nmo-45674-source-closed-cellbody-${index + 1}`,
      semanticClass: "soma_contour_trace",
      interpretedClosed: true,
      closureBasis: "Neurolucida source closed flag",
      semanticSegmentCount: contour.vertexCount,
    })),
  };
  const geometryBytes = Buffer.from(stableJson(geometry));

  const catalog = {
    schemaVersion: "0.2.0",
    contractId: "neurolucida-native-contour-admission-catalog-0.2",
    releaseId: geometry.releaseId,
    releasedAt: "2026-09-02",
    title: "Per-record Neurolucida native contour admission catalog",
    purpose: "Make native-detail switching record-specific while admitting only exact source-backed contour lines and exposing why audited records remain blocked.",
    parserAudit: INDEPENDENT_PARSER,
    records: [
      {
        neuronId: 45718,
        assetId: "NeuroMorpho:45718",
        title: "Repository-labelled calbindin-negative glycinergic premotor / non-Renshaw interneuron",
        admissionStatus: "admitted_prior_exact_contract",
        source: priorContract.sourceObject,
        derivedObject: priorContract.derivedObject,
        audit: {
          exactSourceContourObjectCount: 10,
          somaNamedContourObjectCount: 8,
          somaNamedVertexCount: 275,
          somaNamedVertexCountsInSourceOrder: [21, 30, 40, 37, 50, 40, 34, 23],
          somaNamedPointPayloadSha256: priorContract.summary.pointPayloadSha256,
          sourceClosedSomaNamedContourCount: 7,
          sourceOpenSomaNamedContourCount: 1,
          auxiliaryTraceObjectCount: 2,
          auxiliaryTraceVertexCount: 4,
          independentPointArraysAgree: true,
        },
        admission: { admittedContourObjectCount: 8, admittedVertexCount: 275, renderedPrimitiveCount: 8, reason: "Seven source-closed Soma 1 traces plus the separately disclosed NMF legacy Cell Body closure from the immutable 0.1 contract." },
        viewer: { primaryLabel: "Seven-plane Soma 1 stack", secondaryLabel: "Separate legacy Cell Body trace", primarySourceNames: ["Soma 1"], secondarySourceNames: ["Cell Body"] },
        sourceLinks: priorContract.sourceLinks,
        hardBoundaries: ["The legacy Cell Body trace remains separate from the Soma 1 stack.", "No fill, triangle, loft, surface, membrane, volume, internal object, SWC overlay, same-cell join or registration is admitted."],
      },
      {
        neuronId: 45674,
        assetId: geometry.assetId,
        title: renshawAudit.record.title,
        admissionStatus: "admitted_source_closed_subset",
        source: geometry.source,
        derivedObject: { path: `/${OUTPUT_PATH.replace(/^public\//, "")}`, bytes: geometryBytes.byteLength, sha256: sha256(geometryBytes), documentType: geometry.documentType, authority: "OBS_SOURCE_NATIVE_CLOSED_CONTOUR_TRACE" },
        audit: {
          exactSourceContourObjectCount: renshawAudit.record.expected.sourceContourCount,
          somaNamedContourObjectCount: renshawAudit.soma.length,
          somaNamedVertexCount: renshawAudit.soma.reduce((sum, contour) => sum + contour.vertexCount, 0),
          somaNamedVertexCountsInSourceOrder: renshawAudit.soma.map((contour) => contour.vertexCount),
          somaNamedPointPayloadSha256: renshawAudit.record.expected.somaPointPayloadSha256,
          sourceClosedSomaNamedContourCount: admitted.length,
          sourceOpenSomaNamedContourCount: excludedOpenSoma.length,
          auxiliaryTraceObjectCount: renshawAudit.auxiliary.length,
          auxiliaryTraceVertexCount: renshawAudit.auxiliary.reduce((sum, contour) => sum + contour.vertexCount, 0),
          fullObjectInventory: renshawAudit.record.inventory,
          independentPointArraysAgree: true,
        },
        admission: { admittedContourObjectCount: admitted.length, admittedVertexCount: geometry.summary.vertexCount, renderedPrimitiveCount: admitted.length, reason: "Only seven CellBody objects whose source closed flag is true are admitted. One spaced Cell Body false-flag object and two open Unknown1 traces are excluded." },
        viewer: { primaryLabel: "Seven source-closed CellBody traces", secondaryLabel: null, primarySourceNames: ["CellBody"], secondarySourceNames: [] },
        sourceLinks: { officialRecord: renshawAudit.record.officialRecordUrl, originalDat: renshawAudit.record.originalDatUrl, primaryPaper: `https://doi.org/${renshawAudit.record.sourcePaperDoi}`, converterRepository: INDEPENDENT_PARSER.repository, morphologySpecification: "https://neuromorphological-file-specification.readthedocs.io/en/latest/NMF.html", rights: "https://neuromorpho.org/useterm.jsp" },
        hardBoundaries: ["Duplicate -80 and -76 micrometre planes remain separate and in source order.", "One source-open Cell Body and two Unknown1 traces remain excluded.", "No fill, triangle, loft, surface, membrane, volume, internal object, SWC overlay, same-cell join or registration is admitted."],
      },
      ...audits.slice(1).map(({ record, bytes, soma, auxiliary }) => blockedRecord(record, bytes, soma, auxiliary)),
    ],
    summary: {
      auditedDatFileCount: 5,
      admittedRecordCount: 2,
      heldRecordCount: 3,
      admittedContourObjectCount: 15,
      admittedVertexCount: 475,
      admittedRenderedPrimitiveCount: 15,
      admittedSurfaceCount: 0,
      admittedVolumeCount: 0,
      admittedInternalStructureObjectCount: 0,
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
  const catalogBytes = Buffer.from(stableJson(catalog));
  return { geometry, geometryBytes, catalog, catalogBytes };
}

async function main() {
  const mode = process.argv[2] ?? "--check";
  check(["--write", "--check"].includes(mode), "Usage: build_neurolucida_native_contour_admission_catalog.mjs [--write|--check]");
  const built = await buildNeurolucidaNativeContourAdmissionCatalog();
  if (mode === "--write") {
    await mkdir(path.dirname(path.join(PROJECT_ROOT, OUTPUT_PATH)), { recursive: true });
    await writeFile(path.join(PROJECT_ROOT, OUTPUT_PATH), built.geometryBytes);
    await writeFile(path.join(PROJECT_ROOT, CATALOG_PATH), built.catalogBytes);
  } else {
    const [geometryBytes, catalogBytes] = await Promise.all([readFile(path.join(PROJECT_ROOT, OUTPUT_PATH)), readFile(path.join(PROJECT_ROOT, CATALOG_PATH))]);
    check(geometryBytes.equals(built.geometryBytes), `${OUTPUT_PATH} is stale`);
    check(catalogBytes.equals(built.catalogBytes), `${CATALOG_PATH} is stale`);
  }
  console.log(JSON.stringify({ mode, releaseId: built.catalog.releaseId, auditedDatFileCount: built.catalog.summary.auditedDatFileCount, admittedRecordCount: built.catalog.summary.admittedRecordCount, heldRecordCount: built.catalog.summary.heldRecordCount, admittedContourObjectCount: built.catalog.summary.admittedContourObjectCount, admittedVertexCount: built.catalog.summary.admittedVertexCount, geometryBytes: built.geometryBytes.byteLength, geometrySha256: sha256(built.geometryBytes), catalogBytes: built.catalogBytes.byteLength, catalogSha256: sha256(built.catalogBytes), admittedSurfaceCount: built.catalog.summary.admittedSurfaceCount, admittedInternalStructureObjectCount: built.catalog.summary.admittedInternalStructureObjectCount, registrationCount: built.catalog.summary.registrationCount }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
