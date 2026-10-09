#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SUPER_CLEM_PALM_SOURCE_PATH = "data/source-candidates/superclem-palm-localization-20260922/32526932-181130_EosRmov009_MTT_without_tracking_results.mat";
export const SUPER_CLEM_PALM_OUTPUT_PATH = "public/data/superclem_palm_native_points_0_1.json";
export const SUPER_CLEM_PALM_SOURCE_SHA256 = "57999c43c3ce6d0406e3db35546ad6f3d8e153cefe04997ecb992b28df356272";
export const SUPER_CLEM_PALM_SOURCE_BYTES = 606421;

const MI_MATRIX = 14;
const MI_COMPRESSED = 15;
const MI_INT8 = 1;
const MI_INT32 = 5;
const MI_UINT32 = 6;
const MI_DOUBLE = 9;
const ROWS = 5;
const COLUMNS = 18358;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function readElement(bytes, offset, label) {
  if (offset + 8 > bytes.byteLength) throw new Error(`${label}: truncated MAT data-element tag`);
  const tag = bytes.readUInt32LE(offset);
  const packedType = tag & 0xffff;
  const packedLength = tag >>> 16;
  if (packedLength > 0 && packedLength <= 4) {
    return {
      type: packedType,
      length: packedLength,
      dataOffset: offset + 4,
      endOffset: offset + 8,
      data: bytes.subarray(offset + 4, offset + 4 + packedLength),
    };
  }
  const length = bytes.readUInt32LE(offset + 4);
  const dataOffset = offset + 8;
  const alignment = tag === MI_COMPRESSED ? length : Math.ceil(length / 8) * 8;
  const endOffset = dataOffset + alignment;
  if (dataOffset + length > bytes.byteLength || endOffset > bytes.byteLength) {
    throw new Error(`${label}: truncated MAT data element`);
  }
  return { type: tag, length, dataOffset, endOffset, data: bytes.subarray(dataOffset, dataOffset + length) };
}

function readNumericMatrix(bytes) {
  if (bytes.byteLength < 136 || bytes.subarray(126, 128).toString("ascii") !== "IM") {
    throw new Error("Super-CLEM MAT header is not a supported little-endian MATLAB Level 5 file");
  }
  const top = readElement(bytes, 128, "outer matrix");
  if (top.type !== MI_COMPRESSED) throw new Error("Super-CLEM MAT outer element is not miCOMPRESSED");
  const inflated = inflateSync(top.data);
  const matrix = readElement(inflated, 0, "matrix");
  if (matrix.type !== MI_MATRIX) throw new Error("Super-CLEM MAT payload is not miMATRIX");

  let offset = matrix.dataOffset;
  const flags = readElement(inflated, offset, "array flags");
  offset = flags.endOffset;
  const dimensions = readElement(inflated, offset, "array dimensions");
  offset = dimensions.endOffset;
  const name = readElement(inflated, offset, "array name");
  offset = name.endOffset;
  const real = readElement(inflated, offset, "real matrix data");

  if (flags.type !== MI_UINT32 || flags.length < 8) throw new Error("Super-CLEM MAT array flags are not supported");
  if (dimensions.type !== MI_INT32 || dimensions.length !== 8) throw new Error("Super-CLEM MAT dimensions are not a 2D int32 shape");
  const shape = [dimensions.data.readInt32LE(0), dimensions.data.readInt32LE(4)];
  if (name.type !== MI_INT8 || name.data.toString("utf8").replaceAll("\0", "") !== "matrice_results") {
    throw new Error("Super-CLEM MAT variable name differs from the audited source");
  }
  if (shape[0] !== ROWS || shape[1] !== COLUMNS) throw new Error(`Super-CLEM MAT matrix shape changed: ${shape.join("×")}`);
  if (real.type !== MI_DOUBLE || real.length !== ROWS * COLUMNS * 8) throw new Error("Super-CLEM MAT real payload is not the audited 5×18,358 double matrix");

  const records = [];
  for (let column = 0; column < COLUMNS; column += 1) {
    const row = [];
    for (let matrixRow = 0; matrixRow < ROWS; matrixRow += 1) {
      row.push(real.data.readDoubleLE((column * ROWS + matrixRow) * 8));
    }
    if (!row.every(Number.isFinite) || !Number.isInteger(row[0])) {
      throw new Error(`Super-CLEM MAT detection row ${column + 1} contains invalid source values`);
    }
    records.push(row);
  }
  return records;
}

export function buildSuperClemPalmNativePoints(sourceBytes) {
  if (sourceBytes.byteLength !== SUPER_CLEM_PALM_SOURCE_BYTES || sha256(sourceBytes) !== SUPER_CLEM_PALM_SOURCE_SHA256) {
    throw new Error("Super-CLEM PALM source bytes do not match the verified Figshare file receipt");
  }
  const detections = readNumericMatrix(sourceBytes);
  const columns = ["frame", "x", "y", "alpha", "sigma"];
  const extrema = (index) => {
    const values = detections.map((row) => row[index]);
    return { minimum: Math.min(...values), maximum: Math.max(...values) };
  };
  return {
    schemaVersion: "0.1.0",
    source: {
      citation: "Maynard SA, Rostaing P, Schaefer N, et al. eLife 10:e74441 (2021).",
      doi: "10.7554/eLife.74441",
      articleUrl: "https://elifesciences.org/articles/74441",
      datasetDoi: "10.6084/m9.figshare.17816747.v1",
      figshareFileId: 32526932,
      fileName: "181130_EosRmov009_MTT_without_tracking_results.mat",
      fileBytes: SUPER_CLEM_PALM_SOURCE_BYTES,
      fileSha256: SUPER_CLEM_PALM_SOURCE_SHA256,
      license: "CC BY 4.0",
    },
    acquisition: {
      imageId: "181130_EosRmov009",
      animalId: "AQ848",
      region: "dorsal spinal cord",
      ageSourceLabel: ">2 months WT",
      sex: "female",
      coordinateScope: "raw XY numeric values in the MAT file; physical unit, origin, axis orientation, and drift-correction state are not established by the local source README",
      rowOrder: columns,
      recordInterpretation: "localization detections, not unique receptor molecules or segmented structures",
      frameInterpretation: "source frame index; frame interval and elapsed-time calibration are not established",
    },
    matrix: {
      variableName: "matrice_results",
      sourceShapeRowsByColumns: [ROWS, COLUMNS],
      sourceStorageOrder: "MATLAB column-major; each output record preserves one source matrix column",
      sourceRowOrder: columns,
      outputColumns: columns.slice(0, 3),
      omittedFromPlotPayload: ["alpha", "sigma"],
      detectionCount: detections.length,
      frameRange: extrema(0),
      xRangeNative: extrema(1),
      yRangeNative: extrema(2),
      detections: detections.map(([frame, x, y]) => [frame, x, y]),
    },
    limits: [
      "No nanometre or micrometre scale is assigned to the raw X/Y values.",
      "No drift correction, origin, handedness, registration or 3D depth is inferred.",
      "Detections are not counted as unique receptor molecules because blinking and conversion affect detection counts.",
      "The source count table reports two clusters and is not an exhaustive partition or an object-level crosswalk for these detections.",
      "AQ848 PALM tissue is not the separate BP057 EM acquisition, a selected atlas cell, or a named interneuron.",
    ],
  };
}

export async function buildSuperClemPalmNativePointsFromDisk() {
  const sourceBytes = await readFile(path.join(ROOT, SUPER_CLEM_PALM_SOURCE_PATH));
  const payload = buildSuperClemPalmNativePoints(sourceBytes);
  return { payload, bytes: Buffer.from(`${JSON.stringify(payload, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildSuperClemPalmNativePointsFromDisk();
    const outputPath = path.join(ROOT, SUPER_CLEM_PALM_OUTPUT_PATH);
    if (flag === "--write") await writeFile(outputPath, built.bytes);
    else if (!(await readFile(outputPath)).equals(built.bytes)) throw new Error("Super-CLEM PALM native-point asset is stale");
    const { matrix, source } = built.payload;
    console.log(JSON.stringify({ sourceFileId: source.figshareFileId, sourceSha256: source.fileSha256, detectionCount: matrix.detectionCount, frameRange: matrix.frameRange, xRangeNative: matrix.xRangeNative, yRangeNative: matrix.yRangeNative, assetBytes: built.bytes.byteLength }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
