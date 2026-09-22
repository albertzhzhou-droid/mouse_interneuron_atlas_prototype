#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUT_PATH = "public/data/premotor_comparison_observed_morphology_route_pack_v1/original/nmo-45718.dat";
const OUTPUT_PATH = "public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json";
const CONTRACT_PATH = "data/neurolucida-source-native-soma-contour-trace-0.1.json";

const EXPECTED = Object.freeze({
  inputBytes: 343774,
  inputSha256: "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415",
  pointPayloadSha256: "a478e6263e7d00c1f17bc64143014a3519c39f771b6809a28b057db07c724ab4",
  contourVertexCounts: [21, 30, 40, 37, 50, 40, 34, 23],
  soma1Z: [-29, -31, -33, -35, -37, -39, -41],
});

const TYPE = Object.freeze({
  string: 0x0001,
  sample: 0x0101,
  sampleList: 0x0103,
  property: 0x0104,
  propertyList: 0x0105,
  contour: 0x0201,
});

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

  uint8() {
    this.ensure(1, "uint8");
    const value = this.view.getUint8(this.position);
    this.position += 1;
    return value;
  }

  uint16() {
    this.ensure(2, "uint16");
    const value = this.view.getUint16(this.position, true);
    this.position += 2;
    return value;
  }

  uint32() {
    this.ensure(4, "uint32");
    const value = this.view.getUint32(this.position, true);
    this.position += 4;
    return value;
  }

  float32() {
    this.ensure(4, "float32");
    const value = this.view.getFloat32(this.position, true);
    this.position += 4;
    return value;
  }

  peekUint16(offset = 0) {
    check(this.position + offset + 2 <= this.bytes.byteLength, "peekUint16 exceeds DAT byte bounds");
    return this.view.getUint16(this.position + offset, true);
  }

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
    else if (dataType === 3) {
      values.push(readColor(cursor));
      cursor.uint8();
    } else {
      throw new Error(`Unsupported DAT property value type ${dataType} for ${key}`);
    }
  }
  check(cursor.position === block.end, `Property ${key} did not end at its declared boundary`);
  check(declaredValueCount === values.length, `Property ${key} value-count mismatch`);
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
  for (const point of points) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], point[axis]);
      max[axis] = Math.max(max[axis], point[axis]);
    }
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
  const legacyCellBody = !sourceClosedFlag && /^cell\s*body$/i.test(sourceName);
  const endpointGapMicrometre = Math.hypot(
    points[0][0] - points.at(-1)[0],
    points[0][1] - points.at(-1)[1],
    points[0][2] - points.at(-1)[2],
  );
  return {
    id: `source-native-contour-${ordinal}`,
    sourceName,
    semanticClass: "soma_contour_trace",
    sourceClosedFlag,
    interpretedClosed: sourceClosedFlag || legacyCellBody,
    closureBasis: sourceClosedFlag
      ? "Neurolucida source closed flag"
      : "MBF NFS 4.0.1 legacy CellBody exception (source flag retained as false)",
    sourceColor,
    sourceResolutionMicrometre: typeof properties.Resolution === "number" ? properties.Resolution : null,
    sourceFillDensity: typeof properties.FillDensity === "number" ? properties.FillDensity : null,
    vertexCount: points.length,
    semanticSegmentCount: points.length,
    zValuesMicrometre: [...new Set(points.map((point) => point[2]))].sort((a, b) => a - b),
    boundsMicrometre: boundsOf(points),
    endpointGapMicrometre,
    pointColumns: ["x_micrometre", "y_micrometre", "z_micrometre", "trace_radius_micrometre"],
    points,
  };
}

function extractTopLevelContours(bytes) {
  check(bytes.byteLength === EXPECTED.inputBytes, "NMO 45718 DAT byte count drifted");
  check(sha256(bytes) === EXPECTED.inputSha256, "NMO 45718 DAT SHA-256 drifted");
  check(new TextDecoder("windows-1252").decode(bytes.subarray(1, 12)) === "V3 DAT file", "Neurolucida V3 DAT header token is missing");
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
    try {
      sourceName = readString(probe);
    } catch {
      continue;
    }
    if (sourceName !== "Soma 1" && sourceName !== "Cell Body") continue;
    const cursor = new DatCursor(bytes, offset);
    contours.push({ ...readContour(cursor, contours.length + 1), sourceBlockOffsetByte: offset });
    offset = cursor.position - 1;
  }
  return contours;
}

export async function buildNeurolucidaSourceNativeSomaContours() {
  const [inputBytes, builderBytes] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, INPUT_PATH)),
    readFile(fileURLToPath(import.meta.url)),
  ]);
  const contours = extractTopLevelContours(inputBytes);
  check(contours.length === 8, `Expected 8 source-native soma contours, found ${contours.length}`);
  check(JSON.stringify(contours.map((contour) => contour.vertexCount)) === JSON.stringify(EXPECTED.contourVertexCounts), "Contour vertex counts drifted");
  const soma1 = contours.filter((contour) => contour.sourceName === "Soma 1");
  const cellBody = contours.filter((contour) => contour.sourceName === "Cell Body");
  check(soma1.length === 7 && soma1.every((contour) => contour.sourceClosedFlag && contour.interpretedClosed), "Seven-plane Soma 1 stack drifted");
  check(JSON.stringify(soma1.flatMap((contour) => contour.zValuesMicrometre)) === JSON.stringify(EXPECTED.soma1Z), "Soma 1 z planes drifted");
  check(cellBody.length === 1 && !cellBody[0].sourceClosedFlag && cellBody[0].interpretedClosed, "Legacy Cell Body contour semantics drifted");
  check(JSON.stringify(cellBody[0].zValuesMicrometre) === JSON.stringify([13, 15]), "Legacy Cell Body z values drifted");
  check(contours.every((contour) => contour.points.flat().every(Number.isFinite)), "Contour coordinates contain a non-finite value");
  const pointPayloadSha256 = sha256(Buffer.from(JSON.stringify(contours.map((contour) => contour.points))));
  check(pointPayloadSha256 === EXPECTED.pointPayloadSha256, "Clean-room DAT point extraction disagrees with the pinned independent parser audit");

  const geometry = {
    documentType: "neurolucida_source_native_soma_contour_trace_geometry",
    schemaVersion: "0.1.0",
    releaseId: "ohri-neurolucida-source-native-soma-contour-trace-0.1.0",
    assetId: "NeuroMorpho:45718",
    sourceFrame: "Neurolucida_DAT_source_native_unregistered",
    units: "micrometre_interpreted_from_Neurolucida_semantics",
    registrationStatus: "unregistered",
    source: {
      path: `/${INPUT_PATH.replace(/^public\//, "")}`,
      bytes: inputBytes.byteLength,
      sha256: sha256(inputBytes),
      officialRecordUrl: "https://neuromorpho.org/api/neuron/id/45718",
      originalDatUrl: "https://neuromorpho.org/dableFiles/bannatyne/Source-Version/101026p1-A-In.dat",
      sourcePaperDoi: "10.1523/JNEUROSCI.0199-14.2014",
      repositoryRrid: "RRID:SCR_002145",
      rights: "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use and original-paper attribution",
      rightsUrl: "https://neuromorpho.org/useterm.jsp",
    },
    extraction: {
      productionMethod: "project_clean_room_checksum_gated_source_specific_neurolucida_contour_block_reader",
      builderPath: `/${path.relative(PROJECT_ROOT, fileURLToPath(import.meta.url))}`,
      builderSha256: sha256(builderBytes),
      independentAudit: {
        repository: "https://github.com/NeuroMorpho/xyz2swc",
        commit: "e07fd2d53c03945f011c335c7b643765f2d85a09",
        parserPath: "modules/hbp/node_modules/morphology_io/app/morphology_parser.js",
        parserGitBlobSha1: "0934ced806f0a4e4992fe2edae2e8e060a23f1a7",
        parserSha256: "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2",
        typeLibraryGitBlobSha1: "31d223b111c2109e0c72149b367efd885f45e0ed",
        typeLibrarySha256: "8006588950ef0ee55da9a4bea46f93b9120a5dc6c29d6b5263050c7a6d168d89",
        parserLicenseNotice: "GPL-3.0-or-later parser used only for independent offline comparison; parser code is not bundled",
        diagnosticLog: ["Neurolucida.DAT: ignoring thumbnail"],
        exactPointPayloadSha256: pointPayloadSha256,
      },
    },
    summary: {
      sourceSomaContourObjectCount: contours.length,
      sourceFlagClosedObjectCount: contours.filter((contour) => contour.sourceClosedFlag).length,
      legacyCellBodyClosureExceptionCount: cellBody.length,
      vertexCount: contours.reduce((sum, contour) => sum + contour.vertexCount, 0),
      semanticClosedSegmentCount: contours.reduce((sum, contour) => sum + contour.semanticSegmentCount, 0),
      filledPolygonCount: 0,
      triangleCount: 0,
      surfaceCount: 0,
      volumeCount: 0,
      internalStructureObjectCount: 0,
      registrationCount: 0,
      crossSourceJoinCount: 0,
      pointPayloadSha256,
    },
    displayContract: {
      admittedPrimitive: "ordered closed polyline only",
      preserveSourceCoordinates: true,
      viewportTransform: "contour_bounds_centered_uniform_scale_only",
      closeLastToFirstBySemantics: true,
      keepCellBodySeparateFromSoma1Stack: true,
      traceRadiusRenderingUse: "forbidden",
      measurementUse: "source_coordinates_visible_but_biological_measurement_not_authorized",
      forbiddenInferences: [
        "polygon fill",
        "triangulation",
        "lofted surface",
        "membrane, nucleus or organelle model",
        "volume estimate",
        "shrinkage correction",
        "standardized SWC overlay",
        "atlas registration",
        "representative type morphology",
      ],
    },
    contours,
  };
  const geometryBytes = Buffer.from(stableJson(geometry));
  const contract = {
    schemaVersion: "0.1.0",
    contractId: "neurolucida-source-native-soma-contour-trace-0.1",
    releaseId: geometry.releaseId,
    releasedAt: "2026-09-02",
    title: "NMO 45718 source-native Neurolucida soma contour trace",
    purpose: "Expose the eight exact source-native soma contour traces as separate 3D polylines while refusing unsupported surface, volume, membrane, internal-detail, SWC-overlay and registration claims.",
    sourceObject: geometry.source,
    derivedObject: {
      path: `/${OUTPUT_PATH.replace(/^public\//, "")}`,
      bytes: geometryBytes.byteLength,
      sha256: sha256(geometryBytes),
      documentType: geometry.documentType,
      authority: "OBS_SOURCE_NATIVE_CONTOUR_TRACE",
    },
    independentAudit: geometry.extraction.independentAudit,
    summary: geometry.summary,
    displayContract: geometry.displayContract,
    relationshipBoundary: {
      sameSourceAsStandardizedSwc: true,
      coordinateTransformToStandardizedSwcStatus: "not_established",
      overlayWithStandardizedSwcAllowed: false,
      sameCellMolecularProfileJoinCount: 0,
      sameSpecimenInternalStructureCount: 0,
      atlasRegistrationCount: 0,
    },
    sourceLinks: {
      officialRecord: geometry.source.officialRecordUrl,
      originalDat: geometry.source.originalDatUrl,
      primaryPaper: `https://doi.org/${geometry.source.sourcePaperDoi}`,
      converterRepository: geometry.extraction.independentAudit.repository,
      morphologySpecification: "https://neuromorphological-file-specification.readthedocs.io/en/latest/NMF.html",
      somaStandardization: "https://neuromorpho.org/SomaFormat.html",
      rights: geometry.source.rightsUrl,
    },
  };
  return { geometry, geometryBytes, contract, contractBytes: Buffer.from(stableJson(contract)) };
}

async function main() {
  const mode = process.argv[2] ?? "--check";
  check(["--write", "--check"].includes(mode), "Usage: build_neurolucida_source_native_soma_contours.mjs [--write|--check]");
  const built = await buildNeurolucidaSourceNativeSomaContours();
  if (mode === "--write") {
    await writeFile(path.join(PROJECT_ROOT, OUTPUT_PATH), built.geometryBytes);
    await writeFile(path.join(PROJECT_ROOT, CONTRACT_PATH), built.contractBytes);
  } else {
    const [geometryBytes, contractBytes] = await Promise.all([
      readFile(path.join(PROJECT_ROOT, OUTPUT_PATH)),
      readFile(path.join(PROJECT_ROOT, CONTRACT_PATH)),
    ]);
    check(geometryBytes.equals(built.geometryBytes), `${OUTPUT_PATH} is stale`);
    check(contractBytes.equals(built.contractBytes), `${CONTRACT_PATH} is stale`);
  }
  console.log(JSON.stringify({
    mode,
    releaseId: built.contract.releaseId,
    contourCount: built.geometry.summary.sourceSomaContourObjectCount,
    vertexCount: built.geometry.summary.vertexCount,
    geometryBytes: built.geometryBytes.byteLength,
    geometrySha256: sha256(built.geometryBytes),
    admittedSurfaceCount: built.geometry.summary.surfaceCount,
    admittedInternalStructureObjectCount: built.geometry.summary.internalStructureObjectCount,
    registrationCount: built.geometry.summary.registrationCount,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
