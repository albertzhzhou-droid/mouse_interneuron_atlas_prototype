#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS,
  ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS,
  ATLAS_NATIVE_VOLUME_MANIFEST_SHA256,
  ATLAS_NATIVE_VOLUME_SHAPE_ZYX,
  buildAtlasNativeVolumeExpectedLanes,
  validateAtlasNativeVolumeManifest,
  validateAtlasNativeVolumeStructure,
} from "../app/atlas-native-volume-surface.js";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ASSET_DIRECTORY = resolve(PROJECT_ROOT, "public/data/allen_cord_20um_native_volume_v2");
const FINE_ANATOMY_PATH = resolve(PROJECT_ROOT, "public/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json");
const SOURCE_ASSET_MANIFEST_PATH = resolve(PROJECT_ROOT, "public/data/allen_cord_20um_v3_0/asset-manifest.json");
const TERMINOLOGY_PATH = resolve(PROJECT_ROOT, "public/data/allen_cord_20um_v3_0/terminology.csv");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function listRegularFiles(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      const metadata = await lstat(path);
      if (metadata.isSymbolicLink()) throw new Error(`Native-volume asset contains a symbolic link: ${path}`);
      if (metadata.isDirectory()) await visit(path);
      else if (metadata.isFile()) files.push(relative(root, path).split("\\").join("/"));
      else throw new Error(`Native-volume asset contains an unsupported filesystem entry: ${path}`);
    }
  }
  await visit(root);
  return files.sort((left, right) => left.localeCompare(right, "en"));
}

function encodingSha256(values, signed = false) {
  const array = signed ? Int32Array.from(values) : Uint32Array.from(values);
  return sha256(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
}

function maskEncodingSha256(stateRuns) {
  const values = [];
  for (const state of stateRuns) {
    values.push(
      state.stateIndex,
      state.zStartInclusive,
      state.zEndInclusive,
      state.planeVoxelCount,
      state.rowsYxStartLength.length,
      ...state.rowsYxStartLength,
    );
  }
  return encodingSha256(values);
}

function independentMaskFromRowRuns(state, height, width) {
  const mask = new Uint8Array(height * width);
  for (let offset = 0; offset < state.rowsYxStartLength.length; offset += 3) {
    const y = state.rowsYxStartLength[offset];
    const xStart = state.rowsYxStartLength[offset + 1];
    const length = state.rowsYxStartLength[offset + 2];
    mask.fill(1, y * width + xStart, y * width + xStart + length);
  }
  return mask;
}

function unitFaceKey(axis, side, plane, u, v, shapeZyx) {
  const [depth, height, width] = shapeZyx;
  const axis0Count = (depth + 1) * height * width;
  const axis1Count = (height + 1) * width * depth;
  let position;
  if (axis === 0) position = (plane * height + u) * width + v;
  else if (axis === 1) position = axis0Count + (plane * width + u) * depth + v;
  else position = axis0Count + axis1Count + (plane * depth + u) * height + v;
  return position * 2 + (side > 0 ? 1 : 0);
}

// This oracle intentionally does not call the production surface builder. It
// enumerates every exposed source-mask unit face into a canonical set, then
// removes the unit faces independently expanded from the stored rectangles.
// Any omitted, duplicated, shifted or incorrectly oriented face survives as a
// missing or extra entry even when aggregate face counts happen to cancel.
export function auditNativeVolumeUnitFaceCoverage(
  stateRuns,
  quads,
  shapeZyx = ATLAS_NATIVE_VOLUME_SHAPE_ZYX,
) {
  const [depth, height, width] = shapeZyx;
  const sourceFaces = new Set();
  let previousMask = null;

  const addZTransition = (before, after, zBoundary) => {
    for (let index = 0; index < height * width; index += 1) {
      const previous = before?.[index] ?? 0;
      const current = after?.[index] ?? 0;
      if (previous === current) continue;
      const y = Math.floor(index / width);
      const x = index % width;
      sourceFaces.add(unitFaceKey(0, previous ? 1 : -1, zBoundary, y, x, shapeZyx));
    }
  };

  for (const state of stateRuns) {
    const mask = independentMaskFromRowRuns(state, height, width);
    addZTransition(previousMask, mask, state.zStartInclusive);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!mask[y * width + x]) continue;
        const yNegative = y === 0 || !mask[(y - 1) * width + x];
        const yPositive = y === height - 1 || !mask[(y + 1) * width + x];
        const xNegative = x === 0 || !mask[y * width + x - 1];
        const xPositive = x === width - 1 || !mask[y * width + x + 1];
        for (let z = state.zStartInclusive; z <= state.zEndInclusive; z += 1) {
          if (yNegative) sourceFaces.add(unitFaceKey(1, -1, y, x, z, shapeZyx));
          if (yPositive) sourceFaces.add(unitFaceKey(1, 1, y + 1, x, z, shapeZyx));
          if (xNegative) sourceFaces.add(unitFaceKey(2, -1, x, z, y, shapeZyx));
          if (xPositive) sourceFaces.add(unitFaceKey(2, 1, x + 1, z, y, shapeZyx));
        }
      }
    }
    previousMask = mask;
  }
  addZTransition(previousMask, null, depth);

  const sourceUnitFaceCount = sourceFaces.size;
  let decodedSurfaceUnitFaceCount = 0;
  let extraUnitFaceCount = 0;
  for (let offset = 0; offset < quads.length; offset += 7) {
    const [axis, side, plane, uStart, vStart, uLength, vLength] = quads.slice(offset, offset + 7);
    for (let u = uStart; u < uStart + uLength; u += 1) {
      for (let v = vStart; v < vStart + vLength; v += 1) {
        decodedSurfaceUnitFaceCount += 1;
        if (!sourceFaces.delete(unitFaceKey(axis, side, plane, u, v, shapeZyx))) {
          extraUnitFaceCount += 1;
        }
      }
    }
  }
  return {
    sourceUnitFaceCount,
    decodedSurfaceUnitFaceCount,
    missingUnitFaceCount: sourceFaces.size,
    extraUnitFaceCount,
  };
}

export async function validateAtlasNativeVolumes(directory = DEFAULT_ASSET_DIRECTORY) {
  const assetDirectory = resolve(directory);
  const [manifestBytes, fineAnatomy, sourceAssetManifestBytes, terminologyBytes] = await Promise.all([
    readFile(resolve(assetDirectory, "asset-manifest.json")),
    readFile(FINE_ANATOMY_PATH, "utf8").then(JSON.parse),
    readFile(SOURCE_ASSET_MANIFEST_PATH),
    readFile(TERMINOLOGY_PATH),
  ]);
  const expectedLanes = buildAtlasNativeVolumeExpectedLanes(fineAnatomy);
  const expectedStructuresByIdentifier = new Map(
    expectedLanes.flatMap((lane) => lane.structures.map((structure) => [structure.identifier, structure])),
  );
  const manifest = validateAtlasNativeVolumeManifest(JSON.parse(manifestBytes), fineAnatomy);
  if (sha256(manifestBytes) !== ATLAS_NATIVE_VOLUME_MANIFEST_SHA256) {
    throw new Error("Native-volume manifest no longer matches the independently pinned SHA-256");
  }
  if (manifest.sourceAtlasAssetManifestSha256 !== sha256(sourceAssetManifestBytes)) {
    throw new Error("Native-volume source atlas manifest SHA-256 changed");
  }
  if (manifest.terminologySha256 !== sha256(terminologyBytes)) {
    throw new Error("Native-volume terminology SHA-256 changed");
  }
  const expectedFiles = ["asset-manifest.json", ...manifest.records.map((record) => record.path)]
    .sort((left, right) => left.localeCompare(right, "en"));
  const actualFiles = await listRegularFiles(assetDirectory);
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error("Native-volume asset file inventory changed");
  }
  const totals = {
    directSourceLabelCount: 0,
    sourceVoxelCount: 0,
    rowRunCount: 0,
    exposedUnitFaceCount: 0,
    greedyQuadCount: 0,
    triangleCount: 0,
  };
  const laneTotals = Object.fromEntries(
    expectedLanes.map((lane) => [lane.semanticLaneId, {
      recordCount: 0,
      sourceVoxelCount: 0,
      rowRunCount: 0,
      exposedUnitFaceCount: 0,
      greedyQuadCount: 0,
      triangleCount: 0,
    }]),
  );
  for (const record of manifest.records) {
    const path = resolve(assetDirectory, record.path);
    if (!path.startsWith(`${assetDirectory}${sep}`)) throw new Error(`Native-volume path escapes its asset directory: ${record.path}`);
    const bytes = await readFile(path);
    if (bytes.length !== record.bytes || sha256(bytes) !== record.sha256) {
      throw new Error(`Native-volume structure checksum or byte count changed: ${record.path}`);
    }
    const payload = JSON.parse(bytes);
    const expectedStructure = expectedStructuresByIdentifier.get(record.identifier);
    if (!expectedStructure) throw new Error(`Native-volume record has no fine-anatomy source label: ${record.identifier}`);
    const report = validateAtlasNativeVolumeStructure(payload, record, expectedStructure);
    if (payload.mask.sourceMaskEncodingSha256 !== maskEncodingSha256(payload.mask.sourceStateRuns)) {
      throw new Error(`Native-volume mask encoding SHA-256 changed: ${record.path}`);
    }
    if (payload.surface.surfaceEncodingSha256 !== encodingSha256(payload.surface.quadsAxisSidePlaneUvStartLength, true)) {
      throw new Error(`Native-volume surface encoding SHA-256 changed: ${record.path}`);
    }
    const independentCoverage = auditNativeVolumeUnitFaceCoverage(
      payload.mask.sourceStateRuns,
      payload.surface.quadsAxisSidePlaneUvStartLength,
      payload.shapeZyx,
    );
    if (
      independentCoverage.sourceUnitFaceCount !== record.exposedUnitFaceCount ||
      independentCoverage.decodedSurfaceUnitFaceCount !== record.exposedUnitFaceCount ||
      independentCoverage.missingUnitFaceCount !== 0 ||
      independentCoverage.extraUnitFaceCount !== 0
    ) {
      throw new Error(`Independent native-volume unit-face coverage failed: ${record.path}`);
    }
    const rowRunCount = payload.mask.sourceStateRuns.reduce(
      (sum, state) => sum + state.rowsYxStartLength.length / 3,
      0,
    );
    if (rowRunCount !== record.rowRunCount || report.exposedUnitFaceCount !== record.exposedUnitFaceCount) {
      throw new Error(`Native-volume record metrics changed: ${record.path}`);
    }
    totals.directSourceLabelCount += 1;
    totals.sourceVoxelCount += report.sourceVoxelCount;
    totals.rowRunCount += rowRunCount;
    totals.exposedUnitFaceCount += report.exposedUnitFaceCount;
    totals.greedyQuadCount += report.greedyQuadCount;
    totals.triangleCount += report.triangleCount;
    const lane = laneTotals[record.semanticLaneId];
    if (!lane) throw new Error(`Native-volume record has an undeclared semantic lane: ${record.path}`);
    lane.recordCount += 1;
    lane.sourceVoxelCount += report.sourceVoxelCount;
    lane.rowRunCount += rowRunCount;
    lane.exposedUnitFaceCount += report.exposedUnitFaceCount;
    lane.greedyQuadCount += report.greedyQuadCount;
    lane.triangleCount += report.triangleCount;
  }
  if (
    JSON.stringify(totals) !== JSON.stringify(manifest.totals) ||
    JSON.stringify(totals) !== JSON.stringify(ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS)
  ) {
    throw new Error("Native-volume manifest totals no longer reconcile with its structure payloads");
  }
  for (const [laneId, expected] of Object.entries(ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS)) {
    if (JSON.stringify(laneTotals[laneId]) !== JSON.stringify(expected)) {
      throw new Error(`Native-volume ${laneId} totals no longer reconcile with its structure payloads`);
    }
  }
  const generatorPath = resolve(PROJECT_ROOT, manifest.generator.path);
  if (!generatorPath.startsWith(`${PROJECT_ROOT}${sep}`) || manifest.generator.sha256 !== sha256(await readFile(generatorPath))) {
    throw new Error("Native-volume generator identity changed; rebuild the deterministic asset");
  }
  if (
    manifest.generator.nodeVersion !== "v26.0.0" ||
    manifest.generator.deterministic !== true ||
    manifest.generator.determinismScope !== "pinned_inputs_generator_bytes_and_node_version"
  ) {
    throw new Error("Native-volume generator determinism scope changed");
  }
  return { manifestSha256: sha256(manifestBytes), ...totals };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_ASSET_DIRECTORY;
  validateAtlasNativeVolumes(directory)
    .then((report) => {
      process.stdout.write(
        `Atlas native-volume validation passed: ${report.directSourceLabelCount} exact source-ID masks in three semantic lanes; ` +
        `${report.sourceVoxelCount} source voxels; ${report.rowRunCount} row runs; ` +
        `${report.greedyQuadCount} lossless voxel-face rectangles; ${report.triangleCount} browser triangles; ` +
        `0 missing/extra unit faces by independent set oracle; INF; measurement forbidden; 0 REG.\n` +
        `Manifest SHA-256: ${report.manifestSha256}\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
