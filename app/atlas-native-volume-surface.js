import {
  ATLAS_DIRECT_LEAF_STRUCTURE_IDS,
  ATLAS_FINE_ANATOMY_STRUCTURE_IDS,
  ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
  ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS,
} from "./atlas-reference-geometry.js";

export const ATLAS_NATIVE_VOLUME_MANIFEST_URL = "/data/allen_cord_20um_native_volume_v2/asset-manifest.json";
export const ATLAS_NATIVE_VOLUME_MANIFEST_SHA256 = "d77b526acc6a80326f75ba3131e885f9d7841b5d01b184daa3651a48f1e85c20";
export const ATLAS_NATIVE_VOLUME_ASSET_ID = "allen_cord_20um:3.0:native-volume-direct-label-surfaces-v2";
export const ATLAS_NATIVE_VOLUME_SCHEMA_VERSION = "0.2.0";
export const ATLAS_NATIVE_VOLUME_SOURCE_ASSET_ID = "allen_cord_20um:3.0:ohri-sampled-reference-v4";
export const ATLAS_NATIVE_VOLUME_SEMANTIC_SHA256 = "1e5ee2daaeabd3505572f5efdb92e700387f7bd794720e78ec21511338500d12";
export const ATLAS_NATIVE_VOLUME_SHAPE_ZYX = Object.freeze([1567, 253, 322]);
export const ATLAS_NATIVE_VOLUME_RESOLUTION_UM_ZYX = Object.freeze([20, 10, 10]);

export const ATLAS_NATIVE_VOLUME_LANE_CONTRACTS = Object.freeze([
  Object.freeze({
    semanticLaneId: "interneuron_focused_anatomy",
    sourceArrayKey: "structures",
    identifierPolicyKey: "interneuronFocusedStructureIdentifiers",
    countPolicyKey: "interneuronFocusedStructureCount",
    expectedIdentifiers: ATLAS_FINE_ANATOMY_STRUCTURE_IDS,
    displayMaskLane: "interneuron_focused_plus_structural_context",
    defaultVisibility: "on",
    pathSegment: "interneuron-focused",
    categoryField: "browserCategory",
  }),
  Object.freeze({
    semanticLaneId: "structural_context",
    sourceArrayKey: "structuralContextStructures",
    identifierPolicyKey: "structuralContextStructureIdentifiers",
    countPolicyKey: "structuralContextStructureCount",
    expectedIdentifiers: ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS,
    displayMaskLane: "interneuron_focused_plus_structural_context",
    defaultVisibility: "on",
    pathSegment: "structural-context",
    categoryField: "contextCategory",
  }),
  Object.freeze({
    semanticLaneId: "motor_context",
    sourceArrayKey: "motorContextStructures",
    identifierPolicyKey: "motorContextStructureIdentifiers",
    countPolicyKey: "motorContextStructureCount",
    expectedIdentifiers: ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
    displayMaskLane: "motor_context",
    defaultVisibility: "off",
    pathSegment: "motor-context",
    categoryField: "contextCategory",
  }),
]);

export const ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS = Object.freeze({
  interneuron_focused_anatomy: Object.freeze({
    recordCount: 37,
    sourceVoxelCount: 21_293_714,
    rowRunCount: 38_914,
    exposedUnitFaceCount: 8_525_194,
    greedyQuadCount: 164_347,
    triangleCount: 328_694,
  }),
  structural_context: Object.freeze({
    recordCount: 3,
    sourceVoxelCount: 15_495_432,
    rowRunCount: 9_328,
    exposedUnitFaceCount: 1_870_130,
    greedyQuadCount: 34_945,
    triangleCount: 69_890,
  }),
  motor_context: Object.freeze({
    recordCount: 33,
    sourceVoxelCount: 2_056_396,
    rowRunCount: 3_820,
    exposedUnitFaceCount: 743_040,
    greedyQuadCount: 15_549,
    triangleCount: 31_098,
  }),
});

export const ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS = Object.freeze({
  directSourceLabelCount: 73,
  sourceVoxelCount: 38_845_542,
  rowRunCount: 52_062,
  exposedUnitFaceCount: 11_138_364,
  greedyQuadCount: 214_841,
  triangleCount: 429_682,
});

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function exactObjectValues(value, expected) {
  return isRecord(value) &&
    arraysEqual(Object.keys(value).sort(), Object.keys(expected).sort()) &&
    Object.entries(expected).every(([key, expectedValue]) => value[key] === expectedValue);
}

function normalizedStructureColor(structure) {
  return structure.sourceColorHexTriplet ?? structure.colorHexTriplet;
}

function expectedCategoryForLane(structure, lane) {
  const category = structure[lane.categoryField];
  assert(typeof category === "string" && category.length > 0, `Native-volume ${lane.semanticLaneId} category is missing`);
  return category;
}

export function buildAtlasNativeVolumeExpectedLanes(fineAnatomy) {
  assert(isRecord(fineAnatomy), "Atlas native-volume validation requires the complete fine-anatomy contract");
  const lanePolicy = fineAnatomy.lanePolicy;
  assert(isRecord(lanePolicy), "Atlas native-volume fine-anatomy lane policy is missing");
  const lanes = ATLAS_NATIVE_VOLUME_LANE_CONTRACTS.map((lane) => {
    const structures = fineAnatomy[lane.sourceArrayKey];
    assert(Array.isArray(structures), `Atlas native-volume ${lane.semanticLaneId} source array is missing`);
    const identifiers = structures.map((structure) => structure?.identifier);
    assert(
      arraysEqual(identifiers, lane.expectedIdentifiers) &&
      lanePolicy[lane.countPolicyKey] === lane.expectedIdentifiers.length &&
      arraysEqual(lanePolicy[lane.identifierPolicyKey] ?? [], lane.expectedIdentifiers),
      `Atlas native-volume ${lane.semanticLaneId} identifiers or count changed`,
    );
    structures.forEach((structure) => {
      assert(
        isRecord(structure) && structure.annotationValue === structure.identifier &&
        structure.selectionMode === "exact_identifier" &&
        Array.isArray(structure.rootIdentifierPath) &&
        structure.rootIdentifierPath.at(-1) === structure.identifier &&
        Number.isInteger(structure.fullVolumeDiagnostic?.voxelCount) &&
        structure.fullVolumeDiagnostic.voxelCount > 0 &&
        /^#[0-9A-F]{6}$/.test(normalizedStructureColor(structure) ?? "") &&
        typeof structure.name === "string" && structure.name.length > 0 &&
        typeof structure.abbreviation === "string" && structure.abbreviation.length > 0,
        `Atlas native-volume source label ${structure?.identifier ?? "unknown"} changed`,
      );
      expectedCategoryForLane(structure, lane);
    });
    return { ...lane, structures, identifiers };
  });
  const partitionedIdentifiers = lanes.flatMap((lane) => lane.identifiers);
  const sortedIdentifiers = [...partitionedIdentifiers].sort((left, right) => left - right);
  const directVoxelCount = lanes
    .flatMap((lane) => lane.structures)
    .reduce((sum, structure) => sum + structure.fullVolumeDiagnostic.voxelCount, 0);
  assert(
    new Set(partitionedIdentifiers).size === ATLAS_DIRECT_LEAF_STRUCTURE_IDS.length &&
    arraysEqual(sortedIdentifiers, ATLAS_DIRECT_LEAF_STRUCTURE_IDS) &&
    fineAnatomy.sourceInventory?.directLeafCount === ATLAS_DIRECT_LEAF_STRUCTURE_IDS.length &&
    arraysEqual(fineAnatomy.sourceInventory?.directLeafIdentifiers ?? [], ATLAS_DIRECT_LEAF_STRUCTURE_IDS) &&
    arraysEqual(fineAnatomy.sourceInventory?.annotationNonzeroIdentifiers ?? [], ATLAS_DIRECT_LEAF_STRUCTURE_IDS) &&
    fineAnatomy.sourceInventory?.fullVolumeDirectVoxelCount === ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS.sourceVoxelCount &&
    directVoxelCount === ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS.sourceVoxelCount &&
    lanePolicy.allDirectStructureCount === ATLAS_DIRECT_LEAF_STRUCTURE_IDS.length &&
    lanePolicy.atlasRegionCountsAreInterneuronCounts === false &&
    lanePolicy.motorContextIncludedInInterneuronCounts === false &&
    lanePolicy.motorContextDefaultVisibility === "off",
    "Atlas native-volume direct-label partition or non-count policy changed",
  );
  return lanes;
}

function buildStateMask(state, height, width) {
  assert(Array.isArray(state.rowsYxStartLength) && state.rowsYxStartLength.length % 3 === 0, "Native-volume state row-RLE is invalid");
  const mask = new Uint8Array(height * width);
  let previousY = -1;
  let previousEnd = 0;
  let planeVoxelCount = 0;
  for (let offset = 0; offset < state.rowsYxStartLength.length; offset += 3) {
    const y = state.rowsYxStartLength[offset];
    const xStart = state.rowsYxStartLength[offset + 1];
    const length = state.rowsYxStartLength[offset + 2];
    assert(
      Number.isInteger(y) && Number.isInteger(xStart) && Number.isInteger(length) &&
      y >= 0 && y < height && xStart >= 0 && length > 0 && xStart + length <= width,
      "Native-volume state row-RLE leaves the native plane",
    );
    assert(y > previousY || (y === previousY && xStart > previousEnd), "Native-volume state row-RLE is not canonical or overlaps");
    if (y !== previousY) previousEnd = 0;
    mask.fill(1, y * width + xStart, y * width + xStart + length);
    previousY = y;
    previousEnd = xStart + length;
    planeVoxelCount += length;
  }
  assert(state.planeVoxelCount === planeVoxelCount, "Native-volume state plane voxel count changed");
  return mask;
}

function greedyRectangles(mask, height, width) {
  const pending = Uint8Array.from(mask);
  const rectangles = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (!pending[start]) continue;
      let rectangleWidth = 1;
      while (x + rectangleWidth < width && pending[start + rectangleWidth]) rectangleWidth += 1;
      let rectangleHeight = 1;
      heightLoop: while (y + rectangleHeight < height) {
        const rowStart = (y + rectangleHeight) * width + x;
        for (let dx = 0; dx < rectangleWidth; dx += 1) {
          if (!pending[rowStart + dx]) break heightLoop;
        }
        rectangleHeight += 1;
      }
      for (let dy = 0; dy < rectangleHeight; dy += 1) {
        pending.fill(0, (y + dy) * width + x, (y + dy) * width + x + rectangleWidth);
      }
      rectangles.push([y, x, rectangleHeight, rectangleWidth]);
    }
  }
  return rectangles;
}

function appendZFaces(quads, previous, current, zBoundary, height, width) {
  const positiveMask = new Uint8Array(height * width);
  const negativeMask = new Uint8Array(height * width);
  for (let index = 0; index < positiveMask.length; index += 1) {
    const before = previous?.[index] ?? 0;
    const after = current?.[index] ?? 0;
    if (before && !after) positiveMask[index] = 1;
    if (!before && after) negativeMask[index] = 1;
  }
  let unitFaces = 0;
  for (const [y, x, yLength, xLength] of greedyRectangles(positiveMask, height, width)) {
    quads.push(0, 1, zBoundary, y, x, yLength, xLength);
    unitFaces += yLength * xLength;
  }
  for (const [y, x, yLength, xLength] of greedyRectangles(negativeMask, height, width)) {
    quads.push(0, -1, zBoundary, y, x, yLength, xLength);
    unitFaces += yLength * xLength;
  }
  return unitFaces;
}

function appendYFaces(quads, mask, zStart, zLength, height, width) {
  let unitFaces = 0;
  for (let y = 0; y < height; y += 1) {
    for (const [side, neighborY, plane] of [[-1, y - 1, y], [1, y + 1, y + 1]]) {
      let x = 0;
      while (x < width) {
        const exposed = mask[y * width + x] && (neighborY < 0 || neighborY >= height || !mask[neighborY * width + x]);
        if (!exposed) {
          x += 1;
          continue;
        }
        const xStart = x;
        while (
          x < width && mask[y * width + x] &&
          (neighborY < 0 || neighborY >= height || !mask[neighborY * width + x])
        ) x += 1;
        const xLength = x - xStart;
        quads.push(1, side, plane, xStart, zStart, xLength, zLength);
        unitFaces += zLength * xLength;
      }
    }
  }
  return unitFaces;
}

function appendXFaces(quads, mask, zStart, zLength, height, width) {
  let unitFaces = 0;
  for (let x = 0; x < width; x += 1) {
    for (const [side, neighborX, plane] of [[-1, x - 1, x], [1, x + 1, x + 1]]) {
      let y = 0;
      while (y < height) {
        const exposed = mask[y * width + x] && (neighborX < 0 || neighborX >= width || !mask[y * width + neighborX]);
        if (!exposed) {
          y += 1;
          continue;
        }
        const yStart = y;
        while (
          y < height && mask[y * width + x] &&
          (neighborX < 0 || neighborX >= width || !mask[y * width + neighborX])
        ) y += 1;
        const yLength = y - yStart;
        quads.push(2, side, plane, zStart, yStart, zLength, yLength);
        unitFaces += zLength * yLength;
      }
    }
  }
  return unitFaces;
}

export function validateNativeVolumeStateRuns(stateRuns, shapeZyx = ATLAS_NATIVE_VOLUME_SHAPE_ZYX) {
  assert(Array.isArray(stateRuns) && stateRuns.length === 32, "Native-volume mask must retain 32 exact source-state runs");
  const [depth, height, width] = shapeZyx;
  let expectedZ = 0;
  let sourceVoxelCount = 0;
  const states = stateRuns.map((state, index) => {
    assert(isRecord(state), "Native-volume state record is invalid");
    assert(state.stateIndex === index + 1, "Native-volume state ordering changed");
    assert(
      state.zStartInclusive === expectedZ && Number.isInteger(state.zEndInclusive) &&
      state.zEndInclusive >= state.zStartInclusive && state.zEndInclusive < depth,
      "Native-volume state coverage is not contiguous",
    );
    assert(SHA256_PATTERN.test(state.planeSha256), "Native-volume state source-plane SHA-256 is invalid");
    const mask = buildStateMask(state, height, width);
    const zLength = state.zEndInclusive - state.zStartInclusive + 1;
    sourceVoxelCount += state.planeVoxelCount * zLength;
    expectedZ = state.zEndInclusive + 1;
    return { ...state, zLength, mask };
  });
  assert(expectedZ === depth, "Native-volume state coverage does not span the pinned source depth");
  return { states, sourceVoxelCount };
}

export function buildExactVoxelFaceSurface(stateRuns, shapeZyx = ATLAS_NATIVE_VOLUME_SHAPE_ZYX) {
  const [depth, height, width] = shapeZyx;
  const { states, sourceVoxelCount } = validateNativeVolumeStateRuns(stateRuns, shapeZyx);
  const quads = [];
  let exposedUnitFaceCount = 0;
  let previous = null;
  for (const state of states) {
    exposedUnitFaceCount += appendZFaces(quads, previous, state.mask, state.zStartInclusive, height, width);
    exposedUnitFaceCount += appendYFaces(quads, state.mask, state.zStartInclusive, state.zLength, height, width);
    exposedUnitFaceCount += appendXFaces(quads, state.mask, state.zStartInclusive, state.zLength, height, width);
    previous = state.mask;
  }
  exposedUnitFaceCount += appendZFaces(quads, previous, null, depth, height, width);
  return {
    quadsAxisSidePlaneUvStartLength: quads,
    sourceVoxelCount,
    exposedUnitFaceCount,
    greedyQuadCount: quads.length / 7,
    triangleCount: (quads.length / 7) * 2,
  };
}

function totalsFromRecords(records) {
  return records.reduce((totals, record) => ({
    recordCount: totals.recordCount + 1,
    sourceVoxelCount: totals.sourceVoxelCount + record.sourceVoxelCount,
    rowRunCount: totals.rowRunCount + record.rowRunCount,
    exposedUnitFaceCount: totals.exposedUnitFaceCount + record.exposedUnitFaceCount,
    greedyQuadCount: totals.greedyQuadCount + record.greedyQuadCount,
    triangleCount: totals.triangleCount + record.triangleCount,
  }), {
    recordCount: 0,
    sourceVoxelCount: 0,
    rowRunCount: 0,
    exposedUnitFaceCount: 0,
    greedyQuadCount: 0,
    triangleCount: 0,
  });
}

export function validateAtlasNativeVolumeManifest(value, fineAnatomy) {
  assert(isRecord(value), "Atlas native-volume manifest is missing");
  assert(value.schemaVersion === ATLAS_NATIVE_VOLUME_SCHEMA_VERSION && value.assetId === ATLAS_NATIVE_VOLUME_ASSET_ID, "Atlas native-volume manifest identity changed");
  assert(value.sourceAtlasAssetId === ATLAS_NATIVE_VOLUME_SOURCE_ASSET_ID, "Atlas native-volume source asset changed");
  assert(value.sourceVolume?.semanticSha256 === ATLAS_NATIVE_VOLUME_SEMANTIC_SHA256, "Atlas native-volume semantic source hash changed");
  assert(arraysEqual(value.sourceVolume?.shapeZyx ?? [], ATLAS_NATIVE_VOLUME_SHAPE_ZYX), "Atlas native-volume shape changed");
  assert(arraysEqual(value.sourceVolume?.resolutionUmZyx ?? [], ATLAS_NATIVE_VOLUME_RESOLUTION_UM_ZYX), "Atlas native-volume spacing changed");
  assert(value.sourceVolume?.dataType === "uint32_little_endian_c_order" && value.sourceVolume?.orientation === "asr", "Atlas native-volume source encoding changed");
  assert(value.coordinateSpaceId === "allen_spinal_cord-adult-mouse-space:2021", "Atlas native-volume coordinate space changed");
  assert(value.geometryStatus === "INF" && value.measurementUse === "forbidden" && value.registrationCount === 0, "Atlas native-volume scientific boundary changed");
  assert(
    value.surfacePolicy?.algorithm === "lossless_exposed_voxel_faces_with_coplanar_rectangles_v1" &&
    value.surfacePolicy?.interpolation === "none" && value.surfacePolicy?.smoothing === "none" &&
    value.surfacePolicy?.decimation === "none" && value.surfacePolicy?.holeFilling === "none" &&
    value.surfacePolicy?.manualGeometry === "none" && value.surfacePolicy?.descendantExpansion === "none",
    "Atlas native-volume surface policy changed",
  );
  assert(
    value.scope === "73_direct_exact_source_labels_in_three_non_count_semantic_lanes" &&
    arraysEqual(value.directLeafIdentifiers ?? [], ATLAS_DIRECT_LEAF_STRUCTURE_IDS) &&
    value.countPolicy?.directSourceLabelCount === ATLAS_DIRECT_LEAF_STRUCTURE_IDS.length &&
    value.countPolicy?.atlasRegionCountsAreInterneuronCounts === false &&
    value.countPolicy?.allRecordsIncludedInInterneuronCounts === false &&
    value.countPolicy?.motorContextIncludedInInterneuronCounts === false,
    "Atlas native-volume direct-label count boundary changed",
  );
  const expectedLanes = buildAtlasNativeVolumeExpectedLanes(fineAnatomy);
  assert(Array.isArray(value.semanticLanes) && value.semanticLanes.length === expectedLanes.length, "Atlas native-volume semantic lanes changed");
  assert(Array.isArray(value.records) && value.records.length === ATLAS_DIRECT_LEAF_STRUCTURE_IDS.length, "Atlas native-volume record count changed");
  let recordIndex = 0;
  expectedLanes.forEach((lane, laneIndex) => {
    const manifestLane = value.semanticLanes[laneIndex];
    const expectedLaneTotals = ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS[lane.semanticLaneId];
    assert(
      isRecord(manifestLane) && manifestLane.semanticLaneId === lane.semanticLaneId &&
      manifestLane.displayMaskLane === lane.displayMaskLane &&
      manifestLane.defaultVisibility === lane.defaultVisibility &&
      manifestLane.includedInInterneuronCounts === false &&
      arraysEqual(manifestLane.structureIdentifiers ?? [], lane.identifiers) &&
      exactObjectValues(manifestLane.totals, expectedLaneTotals),
      `Atlas native-volume ${lane.semanticLaneId} manifest lane changed`,
    );
    const laneRecords = [];
    lane.structures.forEach((expected) => {
      const record = value.records[recordIndex];
      laneRecords.push(record);
      assert(
        isRecord(record) && record.identifier === expected.identifier && record.annotationValue === expected.annotationValue &&
        record.name === expected.name && record.abbreviation === expected.abbreviation &&
        record.semanticLaneId === lane.semanticLaneId && record.displayMaskLane === lane.displayMaskLane &&
        record.defaultVisibility === lane.defaultVisibility && record.includedInInterneuronCounts === false &&
        record.category === expectedCategoryForLane(expected, lane) &&
        record.path === `structures/${lane.pathSegment}/atlas-id-${String(expected.identifier).padStart(3, "0")}.json` &&
        SHA256_PATTERN.test(record.sha256) && Number.isInteger(record.bytes) && record.bytes > 0 &&
        Number.isInteger(record.sourceVoxelCount) && record.sourceVoxelCount === expected.fullVolumeDiagnostic.voxelCount &&
        Number.isInteger(record.rowRunCount) && record.rowRunCount > 0 &&
        Number.isInteger(record.exposedUnitFaceCount) && record.exposedUnitFaceCount > 0 &&
        Number.isInteger(record.greedyQuadCount) && record.greedyQuadCount > 0 &&
        record.triangleCount === record.greedyQuadCount * 2,
        `Atlas native-volume record ${expected.identifier} changed`,
      );
      recordIndex += 1;
    });
    assert(
      exactObjectValues(totalsFromRecords(laneRecords), expectedLaneTotals),
      `Atlas native-volume ${lane.semanticLaneId} record totals changed`,
    );
  });
  assert(recordIndex === value.records.length, "Atlas native-volume record partition is incomplete");
  const allRecordTotals = totalsFromRecords(value.records);
  assert(
    exactObjectValues(value.totals, ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS) &&
    allRecordTotals.recordCount === ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS.directSourceLabelCount &&
    Object.entries(ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS).every(([key, expected]) =>
      key === "directSourceLabelCount" || allRecordTotals[key] === expected
    ),
    "Atlas native-volume direct-label totals changed",
  );
  return value;
}

export function validateAtlasNativeVolumeStructure(value, manifestRecord, expectedStructure) {
  assert(isRecord(value), "Atlas native-volume structure payload is missing");
  assert(value.schemaVersion === ATLAS_NATIVE_VOLUME_SCHEMA_VERSION && value.assetId === `${ATLAS_NATIVE_VOLUME_ASSET_ID}:source-id-${expectedStructure.identifier}`, "Atlas native-volume structure identity changed");
  assert(value.sourceAtlasAssetId === ATLAS_NATIVE_VOLUME_SOURCE_ASSET_ID && value.sourceVolumeSemanticSha256 === ATLAS_NATIVE_VOLUME_SEMANTIC_SHA256, "Atlas native-volume structure source changed");
  assert(
    value.identifier === expectedStructure.identifier && value.annotationValue === expectedStructure.annotationValue &&
    value.name === expectedStructure.name && value.abbreviation === expectedStructure.abbreviation &&
    value.parentIdentifier === expectedStructure.parentIdentifier &&
    arraysEqual(value.rootIdentifierPath ?? [], expectedStructure.rootIdentifierPath) &&
    arraysEqual(
      value.sourceHierarchy?.map((entry) => entry?.identifier) ?? [],
      expectedStructure.rootIdentifierPath,
    ) &&
    value.sourceColorHexTriplet === normalizedStructureColor(expectedStructure) &&
    value.semanticLaneId === manifestRecord.semanticLaneId &&
    value.displayMaskLane === manifestRecord.displayMaskLane &&
    value.defaultVisibility === manifestRecord.defaultVisibility &&
    value.includedInInterneuronCounts === false && manifestRecord.includedInInterneuronCounts === false &&
    value.category === manifestRecord.category,
    "Atlas native-volume source-label identity changed",
  );
  assert(value.selectionMode === "exact_identifier_only" && value.descendantIdentifiers?.length === 0, "Atlas native-volume structure expanded descendants");
  assert(arraysEqual(value.shapeZyx ?? [], ATLAS_NATIVE_VOLUME_SHAPE_ZYX) && arraysEqual(value.resolutionUmZyx ?? [], ATLAS_NATIVE_VOLUME_RESOLUTION_UM_ZYX), "Atlas native-volume structure grid changed");
  assert(
    value.coordinateSpaceId === "allen_spinal_cord-adult-mouse-space:2021" &&
    value.orientation === "asr" &&
    value.voxelCenterVersusEdgeConvention === "voxel_edge_coordinate_equals_voxel_center_index_plus_0.5" &&
    value.mask?.encoding === "32_source_state_runs_with_exact_xy_row_rle" &&
    arraysEqual(value.mask?.rowTuple ?? [], ["y", "x_start", "length"]),
    "Atlas native-volume coordinate or mask encoding changed",
  );
  assert(value.geometryStatus === "INF" && value.measurementUse === "forbidden" && value.registrationCount === 0, "Atlas native-volume structure boundary changed");
  const rebuilt = buildExactVoxelFaceSurface(value.mask?.sourceStateRuns, value.shapeZyx);
  assert(rebuilt.sourceVoxelCount === value.mask?.sourceVoxelCount && rebuilt.sourceVoxelCount === manifestRecord.sourceVoxelCount, "Atlas native-volume mask voxel count changed");
  assert(arraysEqual(rebuilt.quadsAxisSidePlaneUvStartLength, value.surface?.quadsAxisSidePlaneUvStartLength ?? []), "Atlas native-volume surface no longer exactly reproduces the mask boundary");
  assert(
    rebuilt.exposedUnitFaceCount === value.surface?.exposedUnitFaceCount &&
    rebuilt.greedyQuadCount === value.surface?.greedyQuadCount &&
    rebuilt.triangleCount === value.surface?.triangleCount &&
    value.surface?.unitFacesCoveredByQuads === rebuilt.exposedUnitFaceCount &&
    value.surface?.missingUnitFaceCount === 0 && value.surface?.extraUnitFaceCount === 0 &&
    value.surface?.algorithm === "lossless_exposed_voxel_faces_with_coplanar_rectangles_v1" &&
    value.surface?.topologyModification === "none_voxel_union_preserved_by_construction" &&
    value.surface?.scientificUse === "exact_encoding_of_pinned_source_voxel_boundary_not_anatomical_accuracy",
    "Atlas native-volume mask-to-surface fidelity changed",
  );
  assert(
    value.surface?.interpolation === "none" && value.surface?.smoothing === "none" &&
    value.surface?.decimation === "none" && value.surface?.holeFilling === "none" &&
    value.surface?.manualGeometry === "none" && value.surface?.componentFiltering === "none",
    "Atlas native-volume structure includes an undeclared geometry operation",
  );
  return { ...value, ...rebuilt };
}

export function nativeVoxelEdgeZyxToAtlasDisplay([zEdge, yEdge, xEdge]) {
  return [
    (xEdge - 0.5) * 0.01 - 1.605,
    1.26 - (yEdge - 0.5) * 0.01,
    20 - (zEdge - 0.5) * 0.02 * 1.277139,
  ];
}

export function expandNativeVolumeQuadsToDisplayGeometry(quads) {
  assert(Array.isArray(quads) && quads.length % 7 === 0, "Atlas native-volume quad encoding is invalid");
  const positions = [];
  const indices = [];
  for (let offset = 0; offset < quads.length; offset += 7) {
    const [axis, side, plane, uStart, vStart, uLength, vLength] = quads.slice(offset, offset + 7);
    assert([0, 1, 2].includes(axis) && (side === -1 || side === 1) && uLength > 0 && vLength > 0, "Atlas native-volume quad record is invalid");
    const uAxis = (axis + 1) % 3;
    const vAxis = (axis + 2) % 3;
    assert(
      Number.isInteger(plane) && Number.isInteger(uStart) && Number.isInteger(vStart) &&
      Number.isInteger(uLength) && Number.isInteger(vLength) &&
      plane >= 0 && plane <= ATLAS_NATIVE_VOLUME_SHAPE_ZYX[axis] &&
      uStart >= 0 && uStart + uLength <= ATLAS_NATIVE_VOLUME_SHAPE_ZYX[uAxis] &&
      vStart >= 0 && vStart + vLength <= ATLAS_NATIVE_VOLUME_SHAPE_ZYX[vAxis],
      "Atlas native-volume quad leaves the pinned voxel-edge grid",
    );
    const corner = [0, 0, 0];
    corner[axis] = plane;
    corner[uAxis] = uStart;
    corner[vAxis] = vStart;
    const cornerU = [...corner];
    const cornerV = [...corner];
    const cornerUV = [...corner];
    cornerU[uAxis] += uLength;
    cornerV[vAxis] += vLength;
    cornerUV[uAxis] += uLength;
    cornerUV[vAxis] += vLength;
    // The native z-y-x to display x-y-z transform reverses handedness, so
    // source-space outward winding must be reversed after transformation.
    const ordered = side > 0
      ? [corner, cornerV, cornerUV, cornerU]
      : [corner, cornerU, cornerUV, cornerV];
    const vertexStart = positions.length / 3;
    ordered.forEach((point) => positions.push(...nativeVoxelEdgeZyxToAtlasDisplay(point)));
    indices.push(vertexStart, vertexStart + 1, vertexStart + 2, vertexStart, vertexStart + 2, vertexStart + 3);
  }
  return { positions, indices };
}
