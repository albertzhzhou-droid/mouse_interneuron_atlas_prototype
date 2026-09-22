#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { lstat, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zstdDecompressSync } from "node:zlib";

import {
  ATLAS_NATIVE_VOLUME_ASSET_ID,
  ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS,
  ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS,
  ATLAS_NATIVE_VOLUME_RESOLUTION_UM_ZYX,
  ATLAS_NATIVE_VOLUME_SCHEMA_VERSION,
  ATLAS_NATIVE_VOLUME_SEMANTIC_SHA256,
  ATLAS_NATIVE_VOLUME_SHAPE_ZYX,
  ATLAS_NATIVE_VOLUME_SOURCE_ASSET_ID,
  buildAtlasNativeVolumeExpectedLanes,
  buildExactVoxelFaceSurface,
} from "../app/atlas-native-volume-surface.js";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CACHE = "/private/tmp/ohri-brainglobe";
const DEFAULT_OUTPUT = resolve(PROJECT_ROOT, "public/data/allen_cord_20um_native_volume_v2");
const SOURCE_MANIFEST_SHA256 = "95f305de7b19274908ac5dd24abfa5a0e6544effad1bfdd7d542b177a27cfad1";
const PINNED_GENERATOR_NODE_VERSION = "v26.0.0";
const FINE_ANATOMY_PATH = resolve(PROJECT_ROOT, "public/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json");
const SOURCE_ASSET_MANIFEST_PATH = resolve(PROJECT_ROOT, "public/data/allen_cord_20um_v3_0/asset-manifest.json");
const TERMINOLOGY_PATH = resolve(PROJECT_ROOT, "public/data/allen_cord_20um_v3_0/terminology.csv");

function parseArgs(argv) {
  const result = { cache: DEFAULT_CACHE, output: DEFAULT_OUTPUT };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--cache" || argv[index] === "--output") {
      const flag = argv[index];
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${flag} requires an explicit path`);
      index += 1;
      if (flag === "--cache") result.cache = resolve(value);
      else result.output = resolve(value);
    }
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return result;
}

function isStrictDescendant(root, candidate) {
  return candidate.startsWith(`${root}${sep}`);
}

async function assertSafeReplaceableOutput(output, cache) {
  const candidate = resolve(output);
  const allowedRoots = [resolve(PROJECT_ROOT, "public/data"), resolve(tmpdir()), resolve("/private/tmp")];
  if (
    !/^allen_cord_20um_native_volume_[a-z0-9._-]+$/i.test(basename(candidate)) ||
    !allowedRoots.some((root) => isStrictDescendant(root, candidate)) ||
    candidate === resolve(PROJECT_ROOT) ||
    candidate === resolve(cache) ||
    isStrictDescendant(resolve(cache), candidate)
  ) {
    throw new Error(`Refusing unsafe native-volume output path: ${candidate}`);
  }
  if (!existsSync(candidate)) return;
  const metadata = await lstat(candidate);
  if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
    throw new Error(`Refusing to replace a non-directory or symbolic-link output: ${candidate}`);
  }
  const entries = await readdir(candidate);
  if (entries.length === 0) return;
  let existingManifest;
  try {
    existingManifest = JSON.parse(await readFile(join(candidate, "asset-manifest.json"), "utf8"));
  } catch {
    throw new Error(`Refusing to replace an unrecognized non-empty output directory: ${candidate}`);
  }
  if (existingManifest.assetId !== ATLAS_NATIVE_VOLUME_ASSET_ID) {
    throw new Error(`Refusing to replace an output directory with a different asset identity: ${candidate}`);
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function sha256File(path) {
  return sha256(await readFile(path));
}

async function listFiles(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error(`Unsupported source object entry: ${path}`);
    }
  }
  await visit(root);
  return files.sort((left, right) => relative(root, left).localeCompare(relative(root, right), "en"));
}

async function inventoryTree(root) {
  const files = await listFiles(root);
  const digest = createHash("sha256");
  let bytes = 0;
  for (const path of files) {
    const data = await readFile(path);
    const name = relative(root, path).split("\\").join("/");
    bytes += data.length;
    digest.update(`${name}\t${data.length}\t${sha256(data)}\n`);
  }
  return {
    fileCount: files.length,
    bytes,
    canonicalization: "sorted_relative_posix_path_tab_decimal_bytes_tab_lowercase_sha256_lf_v1",
    canonicalTreeSha256: digest.digest("hex"),
  };
}

function stateForZ(stateRuns, zIndex, cursor) {
  while (cursor.index < stateRuns.length && zIndex > stateRuns[cursor.index].zEndInclusive) cursor.index += 1;
  const state = stateRuns[cursor.index];
  if (!state || zIndex < state.zStartInclusive || zIndex > state.zEndInclusive) {
    throw new Error(`Source-state contract does not cover native z ${zIndex}`);
  }
  return state;
}

async function loadPinnedSourceStates(zarrRoot, stateRuns) {
  const metadata = JSON.parse(await readFile(join(zarrRoot, "s0/zarr.json"), "utf8"));
  if (
    JSON.stringify(metadata.shape) !== JSON.stringify(ATLAS_NATIVE_VOLUME_SHAPE_ZYX) ||
    metadata.data_type !== "uint32" || metadata.zarr_format !== 3 ||
    JSON.stringify(metadata.chunk_grid?.configuration?.chunk_shape) !== JSON.stringify([196, 32, 81]) ||
    metadata.codecs?.[0]?.name !== "bytes" || metadata.codecs?.[0]?.configuration?.endian !== "little" ||
    metadata.codecs?.[1]?.name !== "zstd"
  ) {
    throw new Error("Pinned annotation Zarr encoding changed");
  }
  if (new Uint8Array(new Uint32Array([1]).buffer)[0] !== 1) {
    throw new Error("The native-volume builder requires a little-endian runtime");
  }
  const [depth, height, width] = metadata.shape;
  const [chunkDepth, chunkHeight, chunkWidth] = metadata.chunk_grid.configuration.chunk_shape;
  const planeSize = height * width;
  const semantic = createHash("sha256");
  const representativePlanes = new Map();
  const stateCursor = { index: 0 };
  for (let chunkZ = 0; chunkZ < Math.ceil(depth / chunkDepth); chunkZ += 1) {
    const zStart = chunkZ * chunkDepth;
    const zCount = Math.min(chunkDepth, depth - zStart);
    const block = new Uint32Array(zCount * planeSize);
    for (let chunkY = 0; chunkY < Math.ceil(height / chunkHeight); chunkY += 1) {
      const yStart = chunkY * chunkHeight;
      const yCount = Math.min(chunkHeight, height - yStart);
      for (let chunkX = 0; chunkX < Math.ceil(width / chunkWidth); chunkX += 1) {
        const xStart = chunkX * chunkWidth;
        const xCount = Math.min(chunkWidth, width - xStart);
        const chunkPath = join(zarrRoot, "s0/c", String(chunkZ), String(chunkY), String(chunkX));
        if (!existsSync(chunkPath)) continue;
        const raw = zstdDecompressSync(await readFile(chunkPath));
        if (raw.length !== chunkDepth * chunkHeight * chunkWidth * 4) {
          throw new Error(`Unexpected annotation chunk size: ${relative(zarrRoot, chunkPath)}`);
        }
        const chunk = new Uint32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
        for (let localZ = 0; localZ < zCount; localZ += 1) {
          for (let localY = 0; localY < yCount; localY += 1) {
            const sourceOffset = (localZ * chunkHeight + localY) * chunkWidth;
            const targetOffset = localZ * planeSize + (yStart + localY) * width + xStart;
            block.set(chunk.subarray(sourceOffset, sourceOffset + xCount), targetOffset);
          }
        }
      }
    }
    for (let localZ = 0; localZ < zCount; localZ += 1) {
      const zIndex = zStart + localZ;
      const plane = block.subarray(localZ * planeSize, (localZ + 1) * planeSize);
      const bytes = Buffer.from(plane.buffer, plane.byteOffset, plane.byteLength);
      const planeSha256 = sha256(bytes);
      const sourceState = stateForZ(stateRuns, zIndex, stateCursor);
      if (planeSha256 !== sourceState.sha256) {
        throw new Error(`Pinned annotation plane z=${zIndex} no longer matches source state ${sourceState.stateIndex}`);
      }
      semantic.update(bytes);
      if (zIndex === sourceState.representativeSampleZIndex) {
        representativePlanes.set(sourceState.stateIndex, Uint32Array.from(plane));
      }
    }
  }
  const semanticSha256 = semantic.digest("hex");
  if (semanticSha256 !== ATLAS_NATIVE_VOLUME_SEMANTIC_SHA256) {
    throw new Error(`Pinned annotation semantic SHA-256 changed: ${semanticSha256}`);
  }
  if (representativePlanes.size !== stateRuns.length) {
    throw new Error("Not every pinned source state retained its representative plane");
  }
  return { representativePlanes, semanticSha256, metadata };
}

function rowRunsForValues(plane, annotationValues, height, width) {
  const targetValues = new Set(annotationValues);
  const encodedByValue = new Map(
    annotationValues.map((annotationValue) => [annotationValue, { rowsYxStartLength: [], planeVoxelCount: 0 }]),
  );
  for (let y = 0; y < height; y += 1) {
    let x = 0;
    while (x < width) {
      const annotationValue = plane[y * width + x];
      const xStart = x;
      while (x < width && plane[y * width + x] === annotationValue) x += 1;
      if (!targetValues.has(annotationValue)) continue;
      const encoded = encodedByValue.get(annotationValue);
      encoded.rowsYxStartLength.push(y, xStart, x - xStart);
      encoded.planeVoxelCount += x - xStart;
    }
  }
  return encodedByValue;
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

function boundsFromStateRuns(stateRuns, shapeZyx) {
  const [, height, width] = shapeZyx;
  const min = [Infinity, Infinity, Infinity];
  const max = [-1, -1, -1];
  for (const state of stateRuns) {
    if (!state.planeVoxelCount) continue;
    min[0] = Math.min(min[0], state.zStartInclusive);
    max[0] = Math.max(max[0], state.zEndInclusive);
    for (let offset = 0; offset < state.rowsYxStartLength.length; offset += 3) {
      const [y, xStart, length] = state.rowsYxStartLength.slice(offset, offset + 3);
      min[1] = Math.min(min[1], y);
      max[1] = Math.max(max[1], y);
      min[2] = Math.min(min[2], xStart);
      max[2] = Math.max(max[2], xStart + length - 1);
    }
  }
  if (min[0] === Infinity || min[1] >= height || min[2] >= width) throw new Error("Native-volume source label has no voxels");
  return { minVoxelCenterZyx: min, maxVoxelCenterZyx: max, minVoxelEdgeZyx: min, maxVoxelEdgeExclusiveZyx: max.map((value) => value + 1) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (process.version !== PINNED_GENERATOR_NODE_VERSION) {
    throw new Error(
      `Native-volume builder requires Node ${PINNED_GENERATOR_NODE_VERSION}; received ${process.version}`,
    );
  }
  const zarrRoot = resolve(
    args.cache,
    "brainglobe-atlasapi/annotation-sets/allen_spinal_cord-adult-mouse-annotation/2021/annotations_compressed.ome.zarr",
  );
  if (!existsSync(zarrRoot)) throw new Error(`Pinned annotation cache is unavailable: ${zarrRoot}`);
  const [fineAnatomy, sourceAssetManifest, terminologySha256, sourceAssetManifestSha256, generatorSha256] = await Promise.all([
    readFile(FINE_ANATOMY_PATH, "utf8").then(JSON.parse),
    readFile(SOURCE_ASSET_MANIFEST_PATH, "utf8").then(JSON.parse),
    sha256File(TERMINOLOGY_PATH),
    sha256File(SOURCE_ASSET_MANIFEST_PATH),
    sha256File(fileURLToPath(import.meta.url)),
  ]);
  if (sourceAssetManifest.assetId !== ATLAS_NATIVE_VOLUME_SOURCE_ASSET_ID) throw new Error("Pinned source atlas asset identity changed");
  if (sourceAssetManifest.sourceManifestSha256 !== SOURCE_MANIFEST_SHA256) throw new Error("Pinned source manifest SHA-256 changed");
  if (fineAnatomy.sourceStateCoverage?.distinctSourceStateCount !== 32) throw new Error("Pinned source-state count changed");
  const sourceStateRuns = fineAnatomy.sourceStateCoverage.sourceStateRuns;
  const sourceTree = await inventoryTree(zarrRoot);
  const loaded = await loadPinnedSourceStates(zarrRoot, sourceStateRuns);

  await assertSafeReplaceableOutput(args.output, args.cache);
  await rm(args.output, { recursive: true, force: true });
  const expectedLanes = buildAtlasNativeVolumeExpectedLanes(fineAnatomy);
  for (const lane of expectedLanes) {
    await mkdir(join(args.output, "structures", lane.pathSegment), { recursive: true });
  }
  const annotationValues = expectedLanes.flatMap((lane) => lane.structures.map((structure) => structure.annotationValue));
  const encodedStates = sourceStateRuns.map((state) => ({
    state,
    encodedByValue: rowRunsForValues(
      loaded.representativePlanes.get(state.stateIndex),
      annotationValues,
      ATLAS_NATIVE_VOLUME_SHAPE_ZYX[1],
      ATLAS_NATIVE_VOLUME_SHAPE_ZYX[2],
    ),
  }));
  const records = [];
  const semanticLanes = [];
  const overallTotals = {
    directSourceLabelCount: 0,
    sourceVoxelCount: 0,
    rowRunCount: 0,
    exposedUnitFaceCount: 0,
    greedyQuadCount: 0,
    triangleCount: 0,
  };
  for (const lane of expectedLanes) {
    const laneRecords = [];
    for (const structure of lane.structures) {
      const stateMasks = encodedStates.map(({ state, encodedByValue }) => ({
        stateIndex: state.stateIndex,
        zStartInclusive: state.zStartInclusive,
        zEndInclusive: state.zEndInclusive,
        representativeSampleZIndex: state.representativeSampleZIndex,
        planeSha256: state.sha256,
        ...encodedByValue.get(structure.annotationValue),
      }));
      const surface = buildExactVoxelFaceSurface(stateMasks);
      if (surface.sourceVoxelCount !== structure.fullVolumeDiagnostic.voxelCount) {
        throw new Error(`Full-volume voxel count changed for source ID ${structure.identifier}`);
      }
      const category = structure[lane.categoryField];
      const payload = {
        schemaVersion: ATLAS_NATIVE_VOLUME_SCHEMA_VERSION,
        assetId: `${ATLAS_NATIVE_VOLUME_ASSET_ID}:source-id-${structure.identifier}`,
        sourceAtlasAssetId: ATLAS_NATIVE_VOLUME_SOURCE_ASSET_ID,
        sourceVolumeSemanticSha256: ATLAS_NATIVE_VOLUME_SEMANTIC_SHA256,
        coordinateSpaceId: "allen_spinal_cord-adult-mouse-space:2021",
        identifier: structure.identifier,
        annotationValue: structure.annotationValue,
        name: structure.name,
        abbreviation: structure.abbreviation,
        parentIdentifier: structure.parentIdentifier,
        rootIdentifierPath: structure.rootIdentifierPath,
        sourceHierarchy: structure.sourceHierarchy,
        sourceColorHexTriplet: structure.colorHexTriplet,
        category,
        semanticLaneId: lane.semanticLaneId,
        displayMaskLane: lane.displayMaskLane,
        defaultVisibility: lane.defaultVisibility,
        includedInInterneuronCounts: false,
        selectionMode: "exact_identifier_only",
        descendantIdentifiers: [],
        shapeZyx: ATLAS_NATIVE_VOLUME_SHAPE_ZYX,
        resolutionUmZyx: ATLAS_NATIVE_VOLUME_RESOLUTION_UM_ZYX,
        orientation: "asr",
        axes: [
          { arrayAxis: "z", direction: "anterior_to_posterior" },
          { arrayAxis: "y", direction: "superior_to_inferior" },
          { arrayAxis: "x", direction: "right_to_left" },
        ],
        voxelCenterVersusEdgeConvention: "voxel_edge_coordinate_equals_voxel_center_index_plus_0.5",
        geometryStatus: "INF",
        measurementUse: "forbidden",
        registrationCount: 0,
        segmentLabelStatus: "pending_curation",
        mask: {
          encoding: "32_source_state_runs_with_exact_xy_row_rle",
          rowTuple: ["y", "x_start", "length"],
          sourceStateRuns: stateMasks,
          sourceVoxelCount: surface.sourceVoxelCount,
          sourceMaskEncodingSha256: maskEncodingSha256(stateMasks),
          bounds: boundsFromStateRuns(stateMasks, ATLAS_NATIVE_VOLUME_SHAPE_ZYX),
        },
        surface: {
          algorithm: "lossless_exposed_voxel_faces_with_coplanar_rectangles_v1",
          quadTuple: ["axis_zyx", "outward_side", "edge_plane", "u_start", "v_start", "u_length", "v_length"],
          quadsAxisSidePlaneUvStartLength: surface.quadsAxisSidePlaneUvStartLength,
          surfaceEncodingSha256: encodingSha256(surface.quadsAxisSidePlaneUvStartLength, true),
          exposedUnitFaceCount: surface.exposedUnitFaceCount,
          unitFacesCoveredByQuads: surface.exposedUnitFaceCount,
          missingUnitFaceCount: 0,
          extraUnitFaceCount: 0,
          greedyQuadCount: surface.greedyQuadCount,
          triangleCount: surface.triangleCount,
          coplanarRectangleReductionRatio: Number((1 - surface.greedyQuadCount / surface.exposedUnitFaceCount).toFixed(9)),
          topologyModification: "none_voxel_union_preserved_by_construction",
          interpolation: "none",
          smoothing: "none",
          decimation: "none",
          holeFilling: "none",
          manualGeometry: "none",
          componentFiltering: "none",
          scientificUse: "exact_encoding_of_pinned_source_voxel_boundary_not_anatomical_accuracy",
        },
        limitations: [
          "Exact means exact relative to the pinned source annotation voxel grid, not sub-voxel or biological ground truth.",
          "The source reference atlas itself includes published assembly and interpolation; this derivative adds no interpolation.",
          "The surface cannot place cells, establish laminar membership, assign spinal segments, authorize measurement, or create a registration.",
        ],
      };
      const relativePath = `structures/${lane.pathSegment}/atlas-id-${String(structure.identifier).padStart(3, "0")}.json`;
      const bytes = Buffer.from(`${JSON.stringify(payload)}\n`);
      await writeFile(join(args.output, relativePath), bytes);
      const record = {
        identifier: structure.identifier,
        annotationValue: structure.annotationValue,
        name: structure.name,
        abbreviation: structure.abbreviation,
        category,
        semanticLaneId: lane.semanticLaneId,
        displayMaskLane: lane.displayMaskLane,
        defaultVisibility: lane.defaultVisibility,
        includedInInterneuronCounts: false,
        path: relativePath,
        sha256: sha256(bytes),
        bytes: bytes.length,
        sourceVoxelCount: surface.sourceVoxelCount,
        rowRunCount: stateMasks.reduce((sum, state) => sum + state.rowsYxStartLength.length / 3, 0),
        exposedUnitFaceCount: surface.exposedUnitFaceCount,
        greedyQuadCount: surface.greedyQuadCount,
        triangleCount: surface.triangleCount,
      };
      records.push(record);
      laneRecords.push(record);
    }
    const laneTotals = laneRecords.reduce((totals, record) => ({
      recordCount: totals.recordCount + 1,
      sourceVoxelCount: totals.sourceVoxelCount + record.sourceVoxelCount,
      rowRunCount: totals.rowRunCount + record.rowRunCount,
      exposedUnitFaceCount: totals.exposedUnitFaceCount + record.exposedUnitFaceCount,
      greedyQuadCount: totals.greedyQuadCount + record.greedyQuadCount,
      triangleCount: totals.triangleCount + record.triangleCount,
    }), { recordCount: 0, sourceVoxelCount: 0, rowRunCount: 0, exposedUnitFaceCount: 0, greedyQuadCount: 0, triangleCount: 0 });
    if (JSON.stringify(laneTotals) !== JSON.stringify(ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS[lane.semanticLaneId])) {
      throw new Error(`Pinned native-volume totals changed for lane ${lane.semanticLaneId}`);
    }
    semanticLanes.push({
      semanticLaneId: lane.semanticLaneId,
      displayMaskLane: lane.displayMaskLane,
      defaultVisibility: lane.defaultVisibility,
      includedInInterneuronCounts: false,
      structureIdentifiers: lane.identifiers,
      totals: laneTotals,
    });
    overallTotals.directSourceLabelCount += laneTotals.recordCount;
    overallTotals.sourceVoxelCount += laneTotals.sourceVoxelCount;
    overallTotals.rowRunCount += laneTotals.rowRunCount;
    overallTotals.exposedUnitFaceCount += laneTotals.exposedUnitFaceCount;
    overallTotals.greedyQuadCount += laneTotals.greedyQuadCount;
    overallTotals.triangleCount += laneTotals.triangleCount;
  }
  if (JSON.stringify(overallTotals) !== JSON.stringify(ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS)) {
    throw new Error("Pinned native-volume all-lane totals changed");
  }
  const manifest = {
    schemaVersion: ATLAS_NATIVE_VOLUME_SCHEMA_VERSION,
    assetId: ATLAS_NATIVE_VOLUME_ASSET_ID,
    assetKind: "derived_exact_native_volume_masks_and_voxel_face_surfaces",
    sourceAtlasAssetId: ATLAS_NATIVE_VOLUME_SOURCE_ASSET_ID,
    sourceAtlasAssetManifestSha256: sourceAssetManifestSha256,
    coordinateSpaceId: "allen_spinal_cord-adult-mouse-space:2021",
    geometryStatus: "INF",
    measurementUse: "forbidden",
    registrationCount: 0,
    sourceVolume: {
      component: "allen_spinal_cord-adult-mouse-annotation:2021",
      semanticSha256: loaded.semanticSha256,
      semanticHashAlgorithm: "sha256_uint32_little_endian_c_order_full_1567x253x322",
      sourceManifestSha256: SOURCE_MANIFEST_SHA256,
      localCompressedObjectInventory: sourceTree,
      dataType: "uint32_little_endian_c_order",
      zarrFormat: loaded.metadata.zarr_format,
      shapeZyx: ATLAS_NATIVE_VOLUME_SHAPE_ZYX,
      resolutionUmZyx: ATLAS_NATIVE_VOLUME_RESOLUTION_UM_ZYX,
      orientation: "asr",
      exactSourceStateRunCount: 32,
      sourceStateHashAlgorithm: fineAnatomy.sourceStateCoverage.hashAlgorithm,
      sourceStateRuns,
    },
    terminologySha256,
    scope: "73_direct_exact_source_labels_in_three_non_count_semantic_lanes",
    directLeafIdentifiers: fineAnatomy.sourceInventory.directLeafIdentifiers,
    countPolicy: {
      directSourceLabelCount: 73,
      atlasRegionCountsAreInterneuronCounts: false,
      allRecordsIncludedInInterneuronCounts: false,
      motorContextIncludedInInterneuronCounts: false,
    },
    semanticLanes,
    maskPolicy: {
      selectionMode: "exact_identifier_only",
      descendantExpansion: "none",
      interpolation: "none",
      morphology: "none",
      missingMaskCompletion: "none",
      sourceContinuity: "preserved_from_pinned_annotation_not_independent_biological_validation",
    },
    surfacePolicy: {
      algorithm: "lossless_exposed_voxel_faces_with_coplanar_rectangles_v1",
      canonicalPrimitive: "native_voxel_boundary_rectangle_triangulated_in_browser",
      interpolation: "none",
      smoothing: "none",
      decimation: "none",
      holeFilling: "none",
      manualGeometry: "none",
      descendantExpansion: "none",
      componentFiltering: "none",
      topologyModification: "none_voxel_union_preserved_by_construction",
      displayLoading: "selected_structure_only_lazy",
    },
    totals: overallTotals,
    generator: {
      path: relative(PROJECT_ROOT, fileURLToPath(import.meta.url)),
      sha256: generatorSha256,
      nodeVersion: PINNED_GENERATOR_NODE_VERSION,
      deterministic: true,
      determinismScope: "pinned_inputs_generator_bytes_and_node_version",
    },
    citation: sourceAssetManifest.citation,
    license: sourceAssetManifest.license,
    records,
  };
  await writeFile(join(args.output, "asset-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(
    `Native-volume direct-label surfaces built: ${records.length} source IDs in three semantic lanes; ` +
    `${overallTotals.sourceVoxelCount} voxels; ${overallTotals.rowRunCount} row runs; ` +
    `${overallTotals.greedyQuadCount} exact rectangles; ${overallTotals.triangleCount} triangles.\n` +
    `Semantic source SHA-256: ${loaded.semanticSha256}\nOutput: ${args.output}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
