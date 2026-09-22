#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

import { buildAtlasFineAnatomyGeometry } from "../app/atlas-reference-geometry.js";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ASSET_PATH = resolve(
  PROJECT_ROOT,
  "public/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json",
);
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function decodeExactRgbaPng(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("invalid RGBA PNG signature or truncated file");
  }
  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let compressionMethod;
  let filterMethod;
  let interlaceMethod;
  let sawEnd = false;
  const compressedParts = [];
  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) throw new Error("truncated RGBA PNG chunk header");
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (chunkEnd > buffer.length) throw new Error(`truncated RGBA PNG ${type} chunk`);
    if (type === "IHDR") {
      if (length !== 13 || width !== undefined) throw new Error("invalid or duplicate RGBA PNG IHDR");
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
      compressionMethod = buffer[dataStart + 10];
      filterMethod = buffer[dataStart + 11];
      interlaceMethod = buffer[dataStart + 12];
    } else if (type === "IDAT") {
      compressedParts.push(buffer.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      sawEnd = true;
      break;
    }
    offset = chunkEnd;
  }
  if (!width || !height || !sawEnd || compressedParts.length === 0) {
    throw new Error("RGBA PNG is missing IHDR, IDAT, or IEND");
  }
  if (
    bitDepth !== 8 ||
    colorType !== 6 ||
    compressionMethod !== 0 ||
    filterMethod !== 0 ||
    interlaceMethod !== 0
  ) {
    throw new Error("fill overlay must be a non-interlaced 8-bit RGBA PNG");
  }
  const bytesPerPixel = 4;
  const rowBytes = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(compressedParts));
  if (inflated.length !== height * (rowBytes + 1)) {
    throw new Error(`unexpected RGBA PNG payload length ${inflated.length}`);
  }
  const pixels = Buffer.allocUnsafe(width * height * bytesPerPixel);
  let sourceOffset = 0;
  let targetOffset = 0;
  let previous = Buffer.alloc(rowBytes);
  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;
    if (filterType < 0 || filterType > 4) throw new Error(`unsupported RGBA PNG filter ${filterType}`);
    const current = Buffer.allocUnsafe(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const encoded = inflated[sourceOffset + x];
      const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0;
      const above = previous[x];
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      let predictor = 0;
      if (filterType === 1) predictor = left;
      else if (filterType === 2) predictor = above;
      else if (filterType === 3) predictor = Math.floor((left + above) / 2);
      else if (filterType === 4) predictor = paethPredictor(left, above, upperLeft);
      current[x] = (encoded + predictor) & 0xff;
    }
    current.copy(pixels, targetOffset);
    sourceOffset += rowBytes;
    targetOffset += rowBytes;
    previous = current;
  }
  return { width, height, pixels };
}

function rgbHex(red, green, blue) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

async function validateFillOverlayFiles(payload, assetPath) {
  const assetDirectory = dirname(assetPath);
  const resolvedAssetDirectory = resolve(assetDirectory);
  const structuresByIdentifier = new Map(
    [...payload.structures, ...payload.structuralContextStructures, ...payload.motorContextStructures]
      .map((structure) => [structure.identifier, structure]),
  );
  let verifiedOverlayCount = 0;
  let verifiedOpaqueVoxelCount = 0;
  for (const lane of payload.fillOverlayPolicy.lanes) {
    const identifiersByColor = new Map();
    for (const identifier of lane.sourceIdentifiers) {
      const structure = structuresByIdentifier.get(identifier);
      const identifiers = identifiersByColor.get(structure.colorHexTriplet) ?? [];
      identifiers.push(identifier);
      identifiersByColor.set(structure.colorHexTriplet, identifiers);
    }
    for (const [planeIndex, overlay] of lane.overlays.entries()) {
      const overlayPath = resolve(assetDirectory, overlay.path);
      if (!overlayPath.startsWith(`${resolvedAssetDirectory}${sep}`)) {
        throw new Error(`fill overlay path escapes the atlas asset directory: ${overlay.path}`);
      }
      const buffer = await readFile(overlayPath);
      const actualSha256 = createHash("sha256").update(buffer).digest("hex");
      if (buffer.length !== overlay.bytes || actualSha256 !== overlay.sha256) {
        throw new Error(`fill overlay checksum or byte count changed: ${overlay.path}`);
      }
      const decoded = decodeExactRgbaPng(buffer);
      if (decoded.width !== 322 || decoded.height !== 253) {
        throw new Error(`fill overlay must remain native 322x253: ${overlay.path}`);
      }
      const actualColorCounts = new Map();
      let opaqueVoxelCount = 0;
      for (let offset = 0; offset < decoded.pixels.length; offset += 4) {
        const [red, green, blue, alpha] = decoded.pixels.subarray(offset, offset + 4);
        if (alpha === 0) {
          if (red !== 0 || green !== 0 || blue !== 0) {
            throw new Error(`transparent fill pixel carries undeclared RGB data: ${overlay.path}`);
          }
          continue;
        }
        if (alpha !== 255) {
          throw new Error(`fill overlay alpha must be exactly 0 or 255: ${overlay.path}`);
        }
        const color = rgbHex(red, green, blue);
        if (!identifiersByColor.has(color)) {
          throw new Error(`fill overlay contains a color outside its declared source lane: ${overlay.path}`);
        }
        actualColorCounts.set(color, (actualColorCounts.get(color) ?? 0) + 1);
        opaqueVoxelCount += 1;
      }
      for (const [color, identifiers] of identifiersByColor) {
        const expectedColorCount = identifiers.reduce(
          (total, identifier) => total + structuresByIdentifier.get(identifier).planes[planeIndex].voxelCount,
          0,
        );
        if ((actualColorCounts.get(color) ?? 0) !== expectedColorCount) {
          throw new Error(`fill overlay source-color voxel count changed for ${color}: ${overlay.path}`);
        }
      }
      if (opaqueVoxelCount !== overlay.opaqueVoxelCount) {
        throw new Error(`fill overlay opaque voxel count changed: ${overlay.path}`);
      }
      verifiedOverlayCount += 1;
      verifiedOpaqueVoxelCount += opaqueVoxelCount;
    }
  }
  return { verifiedOverlayCount, verifiedOpaqueVoxelCount };
}

export async function validateAtlasFineAnatomyFile(path = DEFAULT_ASSET_PATH) {
  const payload = JSON.parse(await readFile(path, "utf8"));
  const geometry = buildAtlasFineAnatomyGeometry(payload);
  const overlays = await validateFillOverlayFiles(payload, path);
  return { ...geometry, ...overlays };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const path = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_ASSET_PATH;
  validateAtlasFineAnatomyFile(path)
    .then((report) => {
      process.stdout.write(
        `Atlas fine-anatomy validation passed: ${report.structureCount} exact source IDs ` +
          `(${report.categoryCounts.lamina} laminae, ${report.categoryCounts.nucleus_or_column} nuclei/columns, ` +
          `${report.categoryCounts.tract} tracts), plus ${report.structuralContextStructureCount} structural-context and ` +
          `${report.motorContextStructureCount} off-by-default motor-context IDs; ${report.planeCount} ordered planes; ` +
          `${report.sourceStateCount}/32 exact source states; ${report.verifiedOverlayCount} native RGBA fills; ` +
          `${report.totalComponentCount} unbridged components; ${report.totalContourCount} exact rings; ` +
          `${report.missingPlaneCount} explicit missing plane records; all targets sampled; ` +
          `${report.geometryStatus}; measurement ${report.measurementUse}; ${report.registrationCount} REG.\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
