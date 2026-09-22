export const ATLAS_CONTOURS_URL = "/data/allen_cord_20um_v3_0/atlas-contours.json";
export const ATLAS_INTERNAL_COMPARTMENTS_URL = "/data/allen_cord_20um_v3_0/atlas-internal-compartments.json";
export const ATLAS_FINE_ANATOMY_URL = "/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json";
export const ATLAS_COORDINATE_SPACE_ID = "allen_spinal_cord-adult-mouse-space:2021";
export const ATLAS_PLANE_COUNT = 38;
export const ATLAS_LOFT_SAMPLE_COUNT = 96;
export const ATLAS_INTERNAL_STRUCTURE_IDS = Object.freeze([90, 100, 110, 16, 74, 75, 70]);
export const ATLAS_INTERNAL_DISPLAY_COLORS = Object.freeze({
  90: "#9c6ade",
  100: "#2cb67d",
  110: "#e45756",
  16: "#58c4dd",
  74: "#3d5afe",
  75: "#d84a8a",
  70: "#f2a93b",
});

const ATLAS_SAMPLED_Z_INDICES = Object.freeze([
  0, 27, 49, 77, 98, 147, 172, 196, 245, 294, 343, 392, 441, 490, 539, 588, 637,
  686, 735, 784, 811, 833, 882, 931, 980, 1029, 1078, 1106, 1127, 1176, 1225,
  1274, 1323, 1372, 1421, 1470, 1519, 1566,
]);
const ATLAS_INTERNAL_COMPONENT_COUNT = 973;
const ATLAS_INTERNAL_CONTOUR_COUNT = 975;
const ATLAS_INTERNAL_MISSING_PLANES = Object.freeze([
  { structureIdentifier: 74, zIndex: 1470 },
  { structureIdentifier: 74, zIndex: 1519 },
  { structureIdentifier: 74, zIndex: 1566 },
]);
const ATLAS_INTERNAL_STRUCTURE_CONTRACTS = Object.freeze([
  { identifier: 90, annotationValue: 90, parentIdentifier: 71, rootIdentifierPath: [250, 71, 90], name: "Dorsal horn", abbreviation: "DH", selectionMode: "inclusive_descendants" },
  { identifier: 100, annotationValue: 100, parentIdentifier: 71, rootIdentifierPath: [250, 71, 100], name: "Central Spinal Cord", abbreviation: "C", selectionMode: "inclusive_descendants" },
  { identifier: 110, annotationValue: 110, parentIdentifier: 71, rootIdentifierPath: [250, 71, 110], name: "Ventral horn", abbreviation: "VH", selectionMode: "inclusive_descendants" },
  { identifier: 16, annotationValue: 16, parentIdentifier: 100, rootIdentifierPath: [250, 71, 100, 16], name: "Central Canal", abbreviation: "CC", selectionMode: "exact_identifier" },
  { identifier: 74, annotationValue: 74, parentIdentifier: 130, rootIdentifierPath: [250, 130, 74], name: "Dorsal funiculus", abbreviation: "df", selectionMode: "inclusive_descendants" },
  { identifier: 75, annotationValue: 75, parentIdentifier: 130, rootIdentifierPath: [250, 130, 75], name: "Lateral funiculus complete", abbreviation: "lfc", selectionMode: "inclusive_descendants" },
  { identifier: 70, annotationValue: 70, parentIdentifier: 130, rootIdentifierPath: [250, 130, 70], name: "Ventral funiculus", abbreviation: "vf", selectionMode: "inclusive_descendants" },
]);
export const ATLAS_FINE_ANATOMY_STRUCTURE_IDS = Object.freeze([
  1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 18, 26,
  6, 10, 15, 17, 19, 20, 21, 224, 225, 226, 227, 228, 23, 24, 25, 67, 68,
  61, 62, 63, 64, 66, 69,
]);
export const ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS = Object.freeze([16, 65, 70]);
export const ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS = Object.freeze(
  Array.from({ length: 33 }, (_, index) => index + 28),
);
export const ATLAS_DIRECT_LEAF_STRUCTURE_IDS = Object.freeze([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  23, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
  43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
  62, 63, 64, 65, 66, 67, 68, 69, 70, 224, 225, 226, 227, 228,
]);
export const ATLAS_HIERARCHY_ONLY_STRUCTURE_IDS = Object.freeze([
  22, 71, 74, 75, 90, 100, 110, 120, 130, 250,
]);
export const ATLAS_ADDED_SOURCE_STATE_Z_INDICES = Object.freeze([27, 77, 172, 811, 1106]);
const ATLAS_SOURCE_STATE_RUN_RANGES = Object.freeze([
  [0, 13], [14, 41], [42, 65], [66, 88], [89, 131], [132, 160], [161, 184],
  [185, 237], [238, 269], [270, 331], [332, 373], [374, 416], [417, 458],
  [459, 501], [502, 544], [545, 629], [630, 714], [715, 752], [753, 791],
  [792, 831], [832, 874], [875, 923], [924, 972], [973, 1023], [1024, 1087],
  [1088, 1125], [1126, 1163], [1164, 1202], [1203, 1240], [1241, 1346],
  [1347, 1455], [1456, 1566],
]);
const ATLAS_FINE_ANATOMY_CONTRACTS = Object.freeze([
  { identifier: 1, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 1], name: "Lamina 1", abbreviation: "1Sp", browserCategory: "lamina" },
  { identifier: 2, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 2], name: "Lamina 2 Outer part", abbreviation: "2Ssp", browserCategory: "lamina" },
  { identifier: 3, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 3], name: "Lamina 2 Inner part", abbreviation: "2Spl", browserCategory: "lamina" },
  { identifier: 4, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 4], name: "Lamina 3", abbreviation: "3Sp", browserCategory: "lamina" },
  { identifier: 5, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 5], name: "Lamina 4", abbreviation: "4Sp", browserCategory: "lamina" },
  { identifier: 7, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 7], name: "Lamina 5", abbreviation: "5Sp", browserCategory: "lamina" },
  { identifier: 8, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 8], name: "Lamina 5 Lateral part", abbreviation: "5SpL", browserCategory: "lamina" },
  { identifier: 9, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 9], name: "Lamina 5 Medial part", abbreviation: "5SpM", browserCategory: "lamina" },
  { identifier: 11, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 11], name: "Lamina 6", abbreviation: "6Sp", browserCategory: "lamina" },
  { identifier: 12, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 12], name: "Lamina 6 Lateral part", abbreviation: "6SpL", browserCategory: "lamina" },
  { identifier: 13, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 13], name: "Lamina 6 Medial part", abbreviation: "6SpM", browserCategory: "lamina" },
  { identifier: 14, parentIdentifier: 100, rootIdentifierPath: [250, 71, 100, 14], name: "Lamina 10", abbreviation: "10Sp", browserCategory: "lamina" },
  { identifier: 18, parentIdentifier: 110, rootIdentifierPath: [250, 71, 110, 18], name: "Lamina 7", abbreviation: "7Sp", browserCategory: "lamina" },
  { identifier: 26, parentIdentifier: 110, rootIdentifierPath: [250, 71, 110, 26], name: "Lamina 8", abbreviation: "8Sp", browserCategory: "lamina" },
  { identifier: 6, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 6], name: "Internal basilar nucleus_4Sp", abbreviation: "IB", browserCategory: "nucleus_or_column" },
  { identifier: 10, parentIdentifier: 90, rootIdentifierPath: [250, 71, 90, 10], name: "Dorsal nucleus (Clarke)_5Sp", abbreviation: "D", browserCategory: "nucleus_or_column" },
  { identifier: 15, parentIdentifier: 100, rootIdentifierPath: [250, 71, 100, 15], name: "Lumbar dorsal commissural ", abbreviation: "LDCom", browserCategory: "nucleus_or_column" },
  { identifier: 17, parentIdentifier: 100, rootIdentifierPath: [250, 71, 100, 17], name: "Sacral dorsal commissural nucleu", abbreviation: "SDCom", browserCategory: "nucleus_or_column" },
  { identifier: 19, parentIdentifier: 110, rootIdentifierPath: [250, 71, 110, 19], name: "Central cervical nucleus", abbreviation: "CeCv", browserCategory: "nucleus_or_column" },
  { identifier: 20, parentIdentifier: 110, rootIdentifierPath: [250, 71, 110, 20], name: "Intercalated nucleus", abbreviation: "ICl", browserCategory: "nucleus_or_column" },
  { identifier: 21, parentIdentifier: 110, rootIdentifierPath: [250, 71, 110, 21], name: "Intermediolateral column", abbreviation: "IML", browserCategory: "nucleus_or_column" },
  { identifier: 224, parentIdentifier: 22, rootIdentifierPath: [250, 71, 110, 22, 224], name: "Intermediomedial column lamina 4", abbreviation: "IMM4", browserCategory: "nucleus_or_column" },
  { identifier: 225, parentIdentifier: 22, rootIdentifierPath: [250, 71, 110, 22, 225], name: "Intermediomedial column lamina 5", abbreviation: "IMM5", browserCategory: "nucleus_or_column" },
  { identifier: 226, parentIdentifier: 22, rootIdentifierPath: [250, 71, 110, 22, 226], name: "Intermediomedial column lamina 6", abbreviation: "IMM6", browserCategory: "nucleus_or_column" },
  { identifier: 227, parentIdentifier: 22, rootIdentifierPath: [250, 71, 110, 22, 227], name: "Intermediomedial column lamina 7", abbreviation: "IMM7", browserCategory: "nucleus_or_column" },
  { identifier: 228, parentIdentifier: 22, rootIdentifierPath: [250, 71, 110, 22, 228], name: "Intermediomedial column lamina 10", abbreviation: "IMM10", browserCategory: "nucleus_or_column" },
  { identifier: 23, parentIdentifier: 110, rootIdentifierPath: [250, 71, 110, 23], name: "Lumbar precerebellar nucleus", abbreviation: "LPrCb", browserCategory: "nucleus_or_column" },
  { identifier: 24, parentIdentifier: 110, rootIdentifierPath: [250, 71, 110, 24], name: "Sacral precerebellar nucleus", abbreviation: "SPrCb", browserCategory: "nucleus_or_column" },
  { identifier: 25, parentIdentifier: 110, rootIdentifierPath: [250, 71, 110, 25], name: "Sacral parasympathetic nucleus", abbreviation: "SPSy", browserCategory: "nucleus_or_column" },
  { identifier: 67, parentIdentifier: 75, rootIdentifierPath: [250, 130, 75, 67], name: "Lateral cervical nucleus", abbreviation: "LatC", browserCategory: "nucleus_or_column" },
  { identifier: 68, parentIdentifier: 75, rootIdentifierPath: [250, 130, 75, 68], name: "Lateral spinal nucleus", abbreviation: "LSp", browserCategory: "nucleus_or_column" },
  { identifier: 61, parentIdentifier: 74, rootIdentifierPath: [250, 130, 74, 61], name: "Cuneate fasciculus", abbreviation: "cu", browserCategory: "tract" },
  { identifier: 62, parentIdentifier: 74, rootIdentifierPath: [250, 130, 74, 62], name: "Dorsal corticospinal tract", abbreviation: "dcs", browserCategory: "tract" },
  { identifier: 63, parentIdentifier: 74, rootIdentifierPath: [250, 130, 74, 63], name: "Gracile fasciculus", abbreviation: "gr", browserCategory: "tract" },
  { identifier: 64, parentIdentifier: 74, rootIdentifierPath: [250, 130, 74, 64], name: "Postsynaptic dorsal column pathway", abbreviation: "psdc", browserCategory: "tract" },
  { identifier: 66, parentIdentifier: 75, rootIdentifierPath: [250, 130, 75, 66], name: "Dorsolateral fasciculus (Lissauer)", abbreviation: "dl", browserCategory: "tract" },
  { identifier: 69, parentIdentifier: 75, rootIdentifierPath: [250, 130, 75, 69], name: "Rubrospinal tract", abbreviation: "rs", browserCategory: "tract" },
]);
const ATLAS_FINE_COMPONENT_COUNT = 2431;
const ATLAS_FINE_CONTOUR_COUNT = 2511;
const ATLAS_FINE_MISSING_PLANE_COUNT = 670;
const ATLAS_FINE_FULLY_UNSAMPLED_IDS = Object.freeze([]);

const EPSILON = 1e-9;

/**
 * Pinned display transform shared with the native-plane atlas viewer.
 * Values are display coordinates only and must not be used for measurement.
 */
export function voxelToAtlasDisplay([x, y], zIndex) {
  return [
    x * 0.01 - 1.605,
    1.26 - y * 0.01,
    20 - zIndex * 0.02 * 1.277139,
  ];
}

/**
 * Exact source-mask rings are expressed on voxel edges, not voxel centres.
 * Keep this half-voxel convention explicit so native fills, rings and future
 * voxel-face surfaces share one boundary grid.
 */
export function voxelEdgeXYToAtlasDisplay([xEdge, yEdge], zCenterIndex) {
  return voxelToAtlasDisplay([xEdge - 0.5, yEdge - 0.5], zCenterIndex);
}

function squaredDistance(left, right) {
  const dx = left[0] - right[0];
  const dy = left[1] - right[1];
  return dx * dx + dy * dy;
}

function cleanClosedContour(points) {
  if (!Array.isArray(points)) throw new Error("Atlas contour must be an array");
  const cleaned = points.map((point) => {
    if (
      !Array.isArray(point) ||
      point.length !== 2 ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1])
    ) {
      throw new Error("Atlas contour coordinates must be finite XY pairs");
    }
    return [point[0], point[1]];
  });
  if (cleaned.length > 1 && squaredDistance(cleaned[0], cleaned.at(-1)) <= EPSILON) {
    cleaned.pop();
  }
  if (cleaned.length < 3) throw new Error("Atlas contour must contain at least three points");
  return cleaned;
}

function sameValues(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function cleanClosedPixelEdgeRing(points) {
  if (!Array.isArray(points) || points.length < 5) {
    throw new Error("Atlas internal contour must contain at least four closed pixel edges");
  }
  const cleaned = points.map((point) => {
    if (
      !Array.isArray(point) ||
      point.length !== 2 ||
      !Number.isInteger(point[0]) ||
      !Number.isInteger(point[1]) ||
      point[0] < 0 ||
      point[0] > 322 ||
      point[1] < 0 ||
      point[1] > 253
    ) {
      throw new Error("Atlas internal contour coordinates must be bounded integer pixel-edge XY pairs");
    }
    return [point[0], point[1]];
  });
  if (!sameValues(cleaned[0], cleaned.at(-1))) {
    throw new Error("Atlas internal contour must remain explicitly closed");
  }
  const openRing = cleaned.slice(0, -1);
  if (new Set(openRing.map((point) => `${point[0]},${point[1]}`)).size !== openRing.length) {
    throw new Error("Atlas internal contour repeats a non-closing pixel-edge vertex");
  }
  return openRing;
}

function signedPixelArea(points) {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    twiceArea += points[index][0] * next[1] - next[0] * points[index][1];
  }
  return twiceArea / 2;
}

export function resampleClosedContour(points, sampleCount = ATLAS_LOFT_SAMPLE_COUNT) {
  if (!Number.isInteger(sampleCount) || sampleCount < 3) {
    throw new Error("Closed-contour sample count must be an integer of at least three");
  }
  const contour = cleanClosedContour(points);
  const cumulative = [0];
  for (let index = 0; index < contour.length; index += 1) {
    const start = contour[index];
    const end = contour[(index + 1) % contour.length];
    cumulative.push(cumulative.at(-1) + Math.sqrt(squaredDistance(start, end)));
  }
  const perimeter = cumulative.at(-1);
  if (!Number.isFinite(perimeter) || perimeter <= EPSILON) {
    throw new Error("Atlas contour perimeter must be greater than zero");
  }

  const resampled = [];
  let edge = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const target = (index / sampleCount) * perimeter;
    while (edge + 1 < cumulative.length && cumulative[edge + 1] < target) edge += 1;
    const start = contour[edge % contour.length];
    const end = contour[(edge + 1) % contour.length];
    const edgeLength = cumulative[edge + 1] - cumulative[edge];
    const fraction = edgeLength <= EPSILON ? 0 : (target - cumulative[edge]) / edgeLength;
    resampled.push([
      start[0] + (end[0] - start[0]) * fraction,
      start[1] + (end[1] - start[1]) * fraction,
    ]);
  }
  return resampled;
}

function rotateRing(ring, offset) {
  return ring.map((_, index) => ring[(index + offset) % ring.length]);
}

function ringAlignmentCost(previous, candidate, offset) {
  let cost = 0;
  for (let index = 0; index < previous.length; index += 1) {
    cost += squaredDistance(previous[index], candidate[(index + offset) % candidate.length]);
  }
  return cost;
}

function anchorFirstRing(ring) {
  let anchor = 0;
  for (let index = 1; index < ring.length; index += 1) {
    const point = ring[index];
    const current = ring[anchor];
    if (point[1] < current[1] || (point[1] === current[1] && point[0] < current[0])) anchor = index;
  }
  return rotateRing(ring, anchor);
}

/**
 * Aligns closed rings without asserting anatomical point correspondence. The
 * closest cyclic ordering is only a deterministic lofting rule and remains INF.
 */
export function alignResampledContours(contours, sampleCount = ATLAS_LOFT_SAMPLE_COUNT) {
  if (!Array.isArray(contours) || contours.length === 0) {
    throw new Error("At least one atlas contour is required");
  }
  const aligned = [anchorFirstRing(resampleClosedContour(contours[0], sampleCount))];
  for (let contourIndex = 1; contourIndex < contours.length; contourIndex += 1) {
    const forward = resampleClosedContour(contours[contourIndex], sampleCount);
    const reversed = [forward[0], ...forward.slice(1).reverse()];
    let bestRing = forward;
    let bestOffset = 0;
    let bestCost = Number.POSITIVE_INFINITY;
    for (const candidate of [forward, reversed]) {
      for (let offset = 0; offset < sampleCount; offset += 1) {
        const cost = ringAlignmentCost(aligned.at(-1), candidate, offset);
        if (cost < bestCost) {
          bestCost = cost;
          bestRing = candidate;
          bestOffset = offset;
        }
      }
    }
    aligned.push(rotateRing(bestRing, bestOffset));
  }
  return aligned;
}

function assertPayload(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Atlas contour payload is missing");
  if (payload.coordinateSpaceId !== ATLAS_COORDINATE_SPACE_ID) {
    throw new Error("Atlas contour coordinate space is not the pinned Allen reference");
  }
  if (payload.geometryStatus !== "INF" || payload.measurementUse !== "forbidden") {
    throw new Error("Atlas contour evidence or measurement boundary is invalid");
  }
  if (!Array.isArray(payload.planes) || payload.planes.length !== ATLAS_PLANE_COUNT) {
    throw new Error(`Pinned atlas loft requires exactly ${ATLAS_PLANE_COUNT} planes`);
  }
  let priorZ = Number.NEGATIVE_INFINITY;
  for (const plane of payload.planes) {
    if (!Number.isFinite(plane?.zIndex) || plane.zIndex <= priorZ) {
      throw new Error("Atlas planes must have strictly increasing finite z indices");
    }
    if (plane.segment?.value !== null) {
      throw new Error("Atlas segment labels must remain absent pending curation");
    }
    cleanClosedContour(plane.outerContourVoxelXY);
    cleanClosedContour(plane.grayMatterContourVoxelXY);
    priorZ = plane.zIndex;
  }
}

function loftAlignedRings(planes, rings) {
  const sampleCount = rings[0].length;
  const positions = [];
  const indices = [];
  rings.forEach((ring, planeIndex) => {
    const zIndex = planes[planeIndex].zIndex;
    ring.forEach((point) => positions.push(...voxelToAtlasDisplay(point, zIndex)));
  });
  for (let planeIndex = 0; planeIndex < rings.length - 1; planeIndex += 1) {
    const start = planeIndex * sampleCount;
    const next = start + sampleCount;
    for (let pointIndex = 0; pointIndex < sampleCount; pointIndex += 1) {
      const following = (pointIndex + 1) % sampleCount;
      indices.push(
        start + pointIndex,
        next + pointIndex,
        start + following,
        next + pointIndex,
        next + following,
        start + following,
      );
    }
  }
  return { positions, indices, rings };
}

export function buildAtlasReferenceGeometry(payload, sampleCount = ATLAS_LOFT_SAMPLE_COUNT) {
  assertPayload(payload);
  const outerRings = alignResampledContours(
    payload.planes.map((plane) => plane.outerContourVoxelXY),
    sampleCount,
  );
  const grayMatterRings = alignResampledContours(
    payload.planes.map((plane) => plane.grayMatterContourVoxelXY),
    sampleCount,
  );
  return {
    coordinateSpaceId: payload.coordinateSpaceId,
    geometryStatus: "INF",
    measurementUse: "forbidden",
    segmentLabels: [],
    planeCount: payload.planes.length,
    sampleCount,
    outer: loftAlignedRings(payload.planes, outerRings),
    grayMatter: loftAlignedRings(payload.planes, grayMatterRings),
  };
}

/**
 * Builds exact, plane-local line contours for source-identified internal
 * compartments. It intentionally creates no cross-plane indices, joins,
 * correspondence, interpolation, filled surface, or registration claim.
 */
export function buildAtlasInternalContourGeometry(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Atlas internal-compartment payload is missing");
  }
  if (
    payload.schemaVersion !== "0.1.0" ||
    payload.assetId !== "allen_cord_20um:3.0:internal-compartments-v3" ||
    payload.sourceAtlasAssetId !== "allen_cord_20um:3.0:ohri-sampled-reference-v4" ||
    payload.atlas !== "allen_cord_20um" ||
    payload.atlasVersion !== "3.0" ||
    payload.sourceAnnotation !== "allen_spinal_cord-adult-mouse-annotation:2021"
  ) {
    throw new Error("Atlas internal-compartment source identity is not the pinned derivative");
  }
  if (payload.coordinateSpaceId !== ATLAS_COORDINATE_SPACE_ID) {
    throw new Error("Atlas internal-compartment coordinate space is not the pinned Allen reference");
  }
  if (
    payload.geometryStatus !== "INF" ||
    payload.confidence?.value !== null ||
    payload.confidence?.missingReason !== "not_measured" ||
    payload.measurementUse !== "forbidden" ||
    payload.registrationCount !== 0 ||
    payload.registrationStatus !== "not_a_registration"
  ) {
    throw new Error("Atlas internal-compartment evidence, measurement, or registration boundary is invalid");
  }
  if (
    payload.segmentLabelStatus !== "not_available_pending_curation" ||
    !sameValues(payload.sampledZIndices, ATLAS_SAMPLED_Z_INDICES)
  ) {
    throw new Error("Atlas internal-compartment plane or segment-label contract is invalid");
  }
  if (
    payload.componentPolicy?.connectivity !== 4 ||
    payload.componentPolicy?.componentIndexScope !== "plane_local_no_cross_plane_correspondence" ||
    payload.componentPolicy?.disconnectedComponents !== "preserved_never_bridged"
  ) {
    throw new Error("Atlas internal components must remain plane-local, four-connected, and unbridged");
  }
  if (
    payload.polygonPolicy?.source !== "exact_pixel_edges_of_each_connected_source_mask_component" ||
    payload.polygonPolicy?.interpolation !== "none" ||
    payload.polygonPolicy?.manualGeometry !== "none" ||
    payload.polygonPolicy?.closedRings !== true ||
    payload.polygonPolicy?.holesPreserved !== true
  ) {
    throw new Error("Atlas internal contours must remain exact, closed, uninterpolated source-mask edges");
  }
  if (
    !Array.isArray(payload.structures) ||
    !sameValues(payload.structures.map((structure) => structure.identifier), ATLAS_INTERNAL_STRUCTURE_IDS)
  ) {
    throw new Error("Atlas internal-compartment structure identifiers or ordering changed");
  }

  let totalComponentCount = 0;
  let totalContourCount = 0;
  const missingPlanes = [];
  const structures = payload.structures.map((structure, structureIndex) => {
    const expected = ATLAS_INTERNAL_STRUCTURE_CONTRACTS[structureIndex];
    if (
      structure.identifier !== expected.identifier ||
      structure.annotationValue !== expected.annotationValue ||
      structure.parentIdentifier !== expected.parentIdentifier ||
      !sameValues(structure.rootIdentifierPath, expected.rootIdentifierPath) ||
      structure.name !== expected.name ||
      structure.abbreviation !== expected.abbreviation ||
      structure.selectionMode !== expected.selectionMode ||
      !/^#[0-9A-F]{6}$/.test(structure.colorHexTriplet) ||
      !Array.isArray(structure.planes) ||
      !sameValues(structure.planes.map((plane) => plane.zIndex), ATLAS_SAMPLED_Z_INDICES)
    ) {
      throw new Error(`Atlas internal structure ${structure.identifier} metadata or plane ordering is invalid`);
    }
    if (!Array.isArray(structure.includedSourceLabels) || structure.includedSourceLabels.length === 0) {
      throw new Error(`Atlas internal structure ${structure.identifier} has no identifier-preserving source-mask definition`);
    }
    const includedAnnotationValues = new Set();
    const includedIdentifiers = new Set();
    for (const sourceLabel of structure.includedSourceLabels) {
      if (
        !Number.isInteger(sourceLabel?.identifier) ||
        !Number.isInteger(sourceLabel?.annotationValue) ||
        !Array.isArray(sourceLabel?.rootIdentifierPath) ||
        (expected.selectionMode === "exact_identifier"
          ? sourceLabel.identifier !== expected.identifier
          : !sourceLabel.rootIdentifierPath.includes(expected.identifier)) ||
        includedAnnotationValues.has(sourceLabel.annotationValue) ||
        includedIdentifiers.has(sourceLabel.identifier)
      ) {
        throw new Error(`Atlas internal structure ${structure.identifier} contains an invalid source-mask label`);
      }
      includedAnnotationValues.add(sourceLabel.annotationValue);
      includedIdentifiers.add(sourceLabel.identifier);
    }
    if (!includedIdentifiers.has(expected.identifier)) {
      throw new Error(`Atlas internal structure ${structure.identifier} omits its root source identifier`);
    }
    const contours = [];
    for (const plane of structure.planes) {
      if (
        plane.anteriorPosteriorMm !== Number((plane.zIndex * 0.02).toFixed(3)) ||
        plane.segment?.value !== null ||
        plane.segment?.missingReason !== "pending_curation" ||
        !Array.isArray(plane.components)
      ) {
        throw new Error(`Atlas internal structure ${structure.identifier} has an invalid segment or component record`);
      }
      if (plane.presence === "missing") {
        if (
          plane.missingReason !== "source_mask_absent_at_sampled_plane" ||
          plane.voxelCount !== 0 ||
          plane.components.length !== 0
        ) {
          throw new Error(`Atlas internal structure ${structure.identifier} has geometry in a missing plane`);
        }
        missingPlanes.push({
          structureIdentifier: structure.identifier,
          structureName: structure.name,
          zIndex: plane.zIndex,
          reason: plane.missingReason,
        });
        continue;
      }
      if (plane.presence !== "present" || plane.voxelCount <= 0 || plane.components.length === 0) {
        throw new Error(`Atlas internal structure ${structure.identifier} has an invalid present plane`);
      }
      let planeVoxelCount = 0;
      plane.components.forEach((component, componentIndex) => {
        if (
          component.componentIndex !== componentIndex + 1 ||
          component.connectivity !== 4 ||
          !Number.isInteger(component.voxelCount) ||
          component.voxelCount <= 0 ||
          !Array.isArray(component.sourceAnnotationValues) ||
          component.sourceAnnotationValues.length === 0 ||
          component.sourceAnnotationValues.some((value) => !includedAnnotationValues.has(value)) ||
          !Array.isArray(component.sourceIdentifiers) ||
          component.sourceIdentifiers.length !== component.sourceAnnotationValues.length ||
          component.sourceIdentifiers.some((value) => !includedIdentifiers.has(value)) ||
          !Array.isArray(component.polygons) ||
          component.polygons.length === 0
        ) {
          throw new Error(`Atlas internal structure ${structure.identifier} contains an invalid plane-local component`);
        }
        totalComponentCount += 1;
        planeVoxelCount += component.voxelCount;
        let componentPixelArea = 0;
        component.polygons.forEach((polygon, polygonIndex) => {
          if (polygon.role !== "exterior" && polygon.role !== "hole") {
            throw new Error(`Atlas internal structure ${structure.identifier} contains an invalid contour role`);
          }
          const sourcePoints = cleanClosedPixelEdgeRing(polygon.pointsVoxelEdgeXY);
          const signedAreaVoxel2 = signedPixelArea(sourcePoints);
          if (
            signedAreaVoxel2 !== polygon.signedAreaVoxel2 ||
            polygon.role !== (signedAreaVoxel2 > 0 ? "exterior" : "hole")
          ) {
            throw new Error(`Atlas internal structure ${structure.identifier} contour area or winding changed`);
          }
          componentPixelArea += signedAreaVoxel2;
          totalContourCount += 1;
          contours.push({
            structureIdentifier: structure.identifier,
            planeZIndex: plane.zIndex,
            componentIndex: component.componentIndex,
            polygonIndex: polygonIndex + 1,
            role: polygon.role,
            sourcePointCount: sourcePoints.length,
            positions: sourcePoints.flatMap((point) => voxelEdgeXYToAtlasDisplay(point, plane.zIndex)),
            planeLocal: true,
            crossPlaneCorrespondence: "none",
          });
        });
        if (componentPixelArea !== component.voxelCount) {
          throw new Error(`Atlas internal structure ${structure.identifier} contour area no longer reproduces its source mask`);
        }
      });
      if (planeVoxelCount !== plane.voxelCount) {
        throw new Error(`Atlas internal structure ${structure.identifier} component areas no longer reproduce its source plane`);
      }
    }
    return {
      identifier: structure.identifier,
      annotationValue: structure.annotationValue,
      name: structure.name,
      abbreviation: structure.abbreviation,
      parentIdentifier: structure.parentIdentifier,
      rootIdentifierPath: [...structure.rootIdentifierPath],
      selectionMode: structure.selectionMode,
      sourceColorHexTriplet: structure.colorHexTriplet,
      displayColorHexTriplet: ATLAS_INTERNAL_DISPLAY_COLORS[structure.identifier],
      displayColorAuthority: "project_display_only_not_source_identity",
      contours,
    };
  });

  if (
    totalComponentCount !== ATLAS_INTERNAL_COMPONENT_COUNT ||
    totalContourCount !== ATLAS_INTERNAL_CONTOUR_COUNT ||
    missingPlanes.length !== ATLAS_INTERNAL_MISSING_PLANES.length ||
    missingPlanes.some(
      (plane, index) =>
        plane.structureIdentifier !== ATLAS_INTERNAL_MISSING_PLANES[index].structureIdentifier ||
        plane.zIndex !== ATLAS_INTERNAL_MISSING_PLANES[index].zIndex,
    )
  ) {
    throw new Error("Atlas internal-compartment component, contour, or explicit-missingness lock changed");
  }

  return {
    assetId: payload.assetId,
    sourceAtlasAssetId: payload.sourceAtlasAssetId,
    coordinateSpaceId: payload.coordinateSpaceId,
    geometryStatus: "INF",
    measurementUse: "forbidden",
    registrationCount: 0,
    segmentLabels: [],
    planeCount: ATLAS_PLANE_COUNT,
    structureCount: structures.length,
    totalComponentCount,
    totalContourCount,
    missingPlanes,
    crossPlaneCorrespondence: "none",
    interpolation: "none",
    manualGeometry: "none",
    structures,
  };
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function validateFineSourceCoverageContract(payload) {
  const inventory = payload.sourceInventory;
  if (
    inventory?.terminologyIdentifierCount !== 83 ||
    inventory?.directLeafCount !== 73 ||
    !sameValues(inventory?.directLeafIdentifiers, ATLAS_DIRECT_LEAF_STRUCTURE_IDS) ||
    !sameValues(inventory?.annotationNonzeroIdentifiers, ATLAS_DIRECT_LEAF_STRUCTURE_IDS) ||
    inventory?.directLeafEqualityValidated !== true ||
    inventory?.hierarchyOnlyCount !== 10 ||
    !sameValues(inventory?.hierarchyOnlyIdentifiers, ATLAS_HIERARCHY_ONLY_STRUCTURE_IDS) ||
    inventory?.hierarchyOnlyDirectVoxelCount !== 0 ||
    !Number.isInteger(inventory?.fullVolumeDirectVoxelCount) ||
    inventory.fullVolumeDirectVoxelCount <= 0
  ) {
    throw new Error("Atlas fine-anatomy direct-leaf or hierarchy-only source inventory changed");
  }

  const coverage = payload.sourceStateCoverage;
  const runs = coverage?.sourceStateRuns;
  const sampled = coverage?.sampledStateHashes;
  if (
    coverage?.hashAlgorithm !== "sha256_uint32_little_endian_c_order_253x322" ||
    coverage?.distinctSourceStateCount !== 32 ||
    coverage?.contiguousSourceStateRunCount !== 32 ||
    coverage?.coveredDistinctStateCount !== 32 ||
    coverage?.allSourceStatesCovered !== true ||
    !sameValues(coverage?.addedRepresentativeZIndices, ATLAS_ADDED_SOURCE_STATE_Z_INDICES) ||
    coverage?.interpretation !== "empirical_exact_annotation_array_states_not_named_spinal_segments" ||
    !Array.isArray(runs) ||
    runs.length !== ATLAS_SOURCE_STATE_RUN_RANGES.length ||
    !Array.isArray(sampled) ||
    sampled.length !== ATLAS_PLANE_COUNT
  ) {
    throw new Error("Atlas fine-anatomy exact source-state coverage contract changed");
  }
  runs.forEach((run, index) => {
    const [zStartInclusive, zEndInclusive] = ATLAS_SOURCE_STATE_RUN_RANGES[index];
    if (
      run?.stateIndex !== index + 1 ||
      run?.zStartInclusive !== zStartInclusive ||
      run?.zEndInclusive !== zEndInclusive ||
      !ATLAS_SAMPLED_Z_INDICES.includes(run?.representativeSampleZIndex) ||
      run.representativeSampleZIndex < zStartInclusive ||
      run.representativeSampleZIndex > zEndInclusive ||
      !isSha256(run?.sha256)
    ) {
      throw new Error(`Atlas fine-anatomy source-state run ${index + 1} changed`);
    }
  });
  if (new Set(runs.map((run) => run.sha256)).size !== 32) {
    throw new Error("Atlas fine-anatomy source-state hashes must remain distinct");
  }
  sampled.forEach((entry, index) => {
    if (entry?.zIndex !== ATLAS_SAMPLED_Z_INDICES[index] || !isSha256(entry?.sha256)) {
      throw new Error(`Atlas fine-anatomy sampled-state record ${index + 1} changed`);
    }
    const run = runs.find(
      (candidate) => entry.zIndex >= candidate.zStartInclusive && entry.zIndex <= candidate.zEndInclusive,
    );
    if (!run || entry.sha256 !== run.sha256) {
      throw new Error(`Atlas fine-anatomy sampled state z=${entry.zIndex} does not match its source run`);
    }
  });
  if (new Set(sampled.map((entry) => entry.sha256)).size !== 32) {
    throw new Error("Atlas fine-anatomy sampled planes do not cover all 32 source states");
  }
  for (const zIndex of ATLAS_ADDED_SOURCE_STATE_Z_INDICES) {
    const run = runs.find(
      (candidate) => zIndex >= candidate.zStartInclusive && zIndex <= candidate.zEndInclusive,
    );
    if (run?.representativeSampleZIndex !== zIndex) {
      throw new Error(`Added source-state plane z=${zIndex} is not its run representative`);
    }
  }
}

function validateCompactExactLabelStructures(payloadStructures, expectedIdentifiers, options) {
  if (
    !Array.isArray(payloadStructures) ||
    !sameValues(payloadStructures.map((structure) => structure.identifier), expectedIdentifiers)
  ) {
    throw new Error(`Atlas fine-anatomy ${options.category} identifiers or ordering changed`);
  }
  let fullVolumeVoxelCount = 0;
  let sampledVoxelCount = 0;
  let componentCount = 0;
  let missingPlaneCount = 0;
  const structures = payloadStructures.map((structure) => {
    const expectedMotorPath = options.category === "motor_context";
    if (
      structure.annotationValue !== structure.identifier ||
      !Array.isArray(structure.rootIdentifierPath) ||
      structure.rootIdentifierPath.at(-1) !== structure.identifier ||
      structure.rootIdentifierPath.includes(120) !== expectedMotorPath ||
      structure.contextCategory !== options.category ||
      structure.selectionMode !== "exact_identifier" ||
      structure.maskLane !== options.maskLane ||
      typeof structure.name !== "string" ||
      !structure.name ||
      typeof structure.abbreviation !== "string" ||
      !structure.abbreviation ||
      !/^#[0-9A-F]{6}$/.test(structure.colorHexTriplet) ||
      !Array.isArray(structure.sourceHierarchy) ||
      !sameValues(
        structure.sourceHierarchy.map((entry) => entry?.identifier),
        structure.rootIdentifierPath,
      ) ||
      structure.sourceHierarchy.at(-1)?.name !== structure.name ||
      structure.sourceHierarchy.at(-1)?.abbreviation !== structure.abbreviation ||
      structure.fullVolumeDiagnostic?.presence !== "present" ||
      !Number.isInteger(structure.fullVolumeDiagnostic?.voxelCount) ||
      structure.fullVolumeDiagnostic.voxelCount <= 0 ||
      structure.fullVolumeDiagnostic?.scientificUse !== "source_presence_integrity_check_only_not_measurement" ||
      !Array.isArray(structure.planes) ||
      !sameValues(structure.planes.map((plane) => plane.zIndex), ATLAS_SAMPLED_Z_INDICES)
    ) {
      throw new Error(`Atlas fine-anatomy context structure ${structure.identifier} metadata changed`);
    }
    fullVolumeVoxelCount += structure.fullVolumeDiagnostic.voxelCount;
    let presentPlanes = 0;
    let missingPlanes = 0;
    let structureSampledVoxels = 0;
    let structureComponents = 0;
    const planes = structure.planes.map((plane) => {
      if (
        plane.anteriorPosteriorMm !== Number((plane.zIndex * 0.02).toFixed(3)) ||
        plane.segment?.value !== null ||
        plane.segment?.missingReason !== "pending_curation" ||
        !Number.isInteger(plane.voxelCount) ||
        plane.voxelCount < 0 ||
        !Number.isInteger(plane.componentCount) ||
        plane.componentCount < 0 ||
        plane.maskRepresentation !== "native_rgba_overlay_exact_source_pixels"
      ) {
        throw new Error(`Atlas fine-anatomy context ${structure.identifier} contains an invalid plane`);
      }
      if (plane.presence === "missing") {
        if (
          plane.missingReason !== "source_mask_absent_at_sampled_plane" ||
          plane.voxelCount !== 0 ||
          plane.componentCount !== 0
        ) {
          throw new Error(`Atlas fine-anatomy context ${structure.identifier} has data in a missing plane`);
        }
        missingPlanes += 1;
        missingPlaneCount += 1;
      } else if (plane.presence === "present") {
        if (plane.voxelCount <= 0 || plane.componentCount <= 0 || "missingReason" in plane) {
          throw new Error(`Atlas fine-anatomy context ${structure.identifier} has an invalid present plane`);
        }
        presentPlanes += 1;
      } else {
        throw new Error(`Atlas fine-anatomy context ${structure.identifier} has invalid presence`);
      }
      structureSampledVoxels += plane.voxelCount;
      structureComponents += plane.componentCount;
      sampledVoxelCount += plane.voxelCount;
      componentCount += plane.componentCount;
      return { ...plane };
    });
    const summary = structure.sampledPlaneSummary;
    if (
      presentPlanes <= 0 ||
      summary?.presentPlaneCount !== presentPlanes ||
      summary?.missingPlaneCount !== missingPlanes ||
      summary?.sampledVoxelCount !== structureSampledVoxels ||
      summary?.componentCount !== structureComponents
    ) {
      throw new Error(`Atlas fine-anatomy context ${structure.identifier} summary changed`);
    }
    return { ...structure, planes };
  });
  return { structures, fullVolumeVoxelCount, sampledVoxelCount, componentCount, missingPlaneCount };
}

function validateFineFillOverlayContract(payload, structuresByIdentifier) {
  const policy = payload.fillOverlayPolicy;
  if (
    policy?.format !== "PNG" ||
    policy?.colorModel !== "RGBA" ||
    policy?.nativeWidth !== 322 ||
    policy?.nativeHeight !== 253 ||
    policy?.sourcePixelMapping !== "one_output_pixel_per_source_annotation_voxel" ||
    policy?.generationResampling !== "none" ||
    policy?.displayResamplingRequired !== "nearest" ||
    !sameValues(policy?.transparentBackgroundRgba, [0, 0, 0, 0]) ||
    policy?.sourceLabelAlpha !== 255 ||
    policy?.sourceColorsPreserved !== true ||
    policy?.sourceColorsUniquePerIdentifier !== false ||
    policy?.colorIdentityAuthority !== "source_identifier_metadata_not_display_color" ||
    policy?.holesAndDisconnectedComponents !== "preserved_by_exact_native_raster" ||
    !Array.isArray(policy?.lanes) ||
    policy.lanes.length !== 2
  ) {
    throw new Error("Atlas fine-anatomy native fill-overlay policy changed");
  }
  const laneContracts = [
    {
      laneId: "interneuron_focused_plus_structural_context",
      defaultVisibility: "on",
      sourceIdentifiers: [...ATLAS_FINE_ANATOMY_STRUCTURE_IDS, ...ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS],
      filenamePrefix: "fine-context",
      collisionGroups: [{ colorHexTriplet: "#00906F", sourceIdentifiers: [224, 225, 226, 227, 228] }],
    },
    {
      laneId: "motor_context",
      defaultVisibility: "off",
      sourceIdentifiers: ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
      filenamePrefix: "motor-context",
      collisionGroups: [],
    },
  ];
  let overlayCount = 0;
  policy.lanes.forEach((lane, laneIndex) => {
    const expected = laneContracts[laneIndex];
    if (
      lane?.laneId !== expected.laneId ||
      lane?.defaultVisibility !== expected.defaultVisibility ||
      lane?.includedInInterneuronCounts !== false ||
      !sameValues(lane?.sourceIdentifiers, expected.sourceIdentifiers) ||
      JSON.stringify(lane?.sourceColorCollisionGroups) !== JSON.stringify(expected.collisionGroups) ||
      lane?.overlayCount !== ATLAS_PLANE_COUNT ||
      !Array.isArray(lane?.overlays) ||
      lane.overlays.length !== ATLAS_PLANE_COUNT
    ) {
      throw new Error(`Atlas fine-anatomy fill lane ${expected.laneId} changed`);
    }
    lane.overlays.forEach((overlay, planeIndex) => {
      const zIndex = ATLAS_SAMPLED_Z_INDICES[planeIndex];
      const expectedPresent = expected.sourceIdentifiers.filter(
        (identifier) => structuresByIdentifier.get(identifier).planes[planeIndex].voxelCount > 0,
      );
      const expectedOpaqueVoxels = expected.sourceIdentifiers.reduce(
        (total, identifier) => total + structuresByIdentifier.get(identifier).planes[planeIndex].voxelCount,
        0,
      );
      if (
        overlay?.path !== `fine-anatomy-overlays/${expected.filenamePrefix}-z${String(zIndex).padStart(4, "0")}.png` ||
        !isSha256(overlay?.sha256) ||
        !Number.isInteger(overlay?.bytes) ||
        overlay.bytes <= 0 ||
        overlay?.zIndex !== zIndex ||
        overlay?.anteriorPosteriorMm !== Number((zIndex * 0.02).toFixed(3)) ||
        overlay?.opaqueVoxelCount !== expectedOpaqueVoxels ||
        !sameValues(overlay?.sourceIdentifiersPresent, expectedPresent)
      ) {
        throw new Error(`Atlas fine-anatomy fill overlay ${expected.laneId} z=${zIndex} changed`);
      }
      overlayCount += 1;
    });
  });
  return { overlayCount, lanes: policy.lanes.map((lane) => ({ ...lane })) };
}

/**
 * Builds exact plane-local contours for source-declared individual laminae,
 * nuclei/columns and tracts. Browser categories are navigation only; source
 * identifiers and hierarchy paths remain the anatomical authority.
 */
export function buildAtlasFineAnatomyGeometry(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Atlas fine-anatomy payload is missing");
  }
  if (
    payload.schemaVersion !== "0.2.0" ||
    payload.assetId !== "allen_cord_20um:3.0:fine-anatomy-v2" ||
    payload.sourceAtlasAssetId !== "allen_cord_20um:3.0:ohri-sampled-reference-v4" ||
    payload.atlas !== "allen_cord_20um" ||
    payload.atlasVersion !== "3.0" ||
    payload.sourceAnnotation !== "allen_spinal_cord-adult-mouse-annotation:2021" ||
    payload.coordinateSpaceId !== ATLAS_COORDINATE_SPACE_ID
  ) {
    throw new Error("Atlas fine-anatomy source identity is not the pinned derivative");
  }
  if (
    payload.geometryStatus !== "INF" ||
    payload.confidence?.value !== null ||
    payload.confidence?.missingReason !== "not_measured" ||
    payload.measurementUse !== "forbidden" ||
    payload.registrationCount !== 0 ||
    payload.registrationStatus !== "not_a_registration" ||
    payload.segmentLabelStatus !== "not_available_pending_curation" ||
    !sameValues(payload.sampledZIndices, ATLAS_SAMPLED_Z_INDICES)
  ) {
    throw new Error("Atlas fine-anatomy evidence, plane, measurement, or registration boundary is invalid");
  }
  if (
    payload.browserCategoryAuthority !== "project_navigation_only_source_identity_preserved" ||
    payload.targetPolicy?.selectionMode !== "exact_identifier_only" ||
    payload.targetPolicy?.descendantExpansion !== "none" ||
    payload.targetPolicy?.motorNeuronSubtreeIdentifier !== 120 ||
    payload.targetPolicy?.motorNeuronSubtreePolicy !== "separate_motor_context_off_by_default" ||
    payload.targetPolicy?.coarseParentStructures !== "remain_in_internal_compartments_v3"
  ) {
    throw new Error("Atlas fine-anatomy exact-label or interneuron-focus target policy changed");
  }
  validateFineSourceCoverageContract(payload);
  if (
    payload.componentPolicy?.connectivity !== 4 ||
    payload.componentPolicy?.componentIndexScope !== "plane_local_no_cross_plane_correspondence" ||
    payload.componentPolicy?.disconnectedComponents !== "preserved_never_bridged" ||
    payload.polygonPolicy?.source !== "exact_pixel_edges_of_each_connected_exact_label_component" ||
    payload.polygonPolicy?.interpolation !== "none" ||
    payload.polygonPolicy?.manualGeometry !== "none" ||
    payload.polygonPolicy?.closedRings !== true ||
    payload.polygonPolicy?.holesPreserved !== true
  ) {
    throw new Error("Atlas fine anatomy must remain exact, plane-local, unbridged, and uninterpolated");
  }
  if (
    !Array.isArray(payload.structures) ||
    !sameValues(payload.structures.map((structure) => structure.identifier), ATLAS_FINE_ANATOMY_STRUCTURE_IDS)
  ) {
    throw new Error("Atlas fine-anatomy structure identifiers or ordering changed");
  }

  let totalComponentCount = 0;
  let totalContourCount = 0;
  let missingPlaneCount = 0;
  let fineFullVolumeVoxelCount = 0;
  const categoryCounts = { lamina: 0, nucleus_or_column: 0, tract: 0 };
  const fullyUnsampledStructureIdentifiers = [];
  const structures = payload.structures.map((structure, structureIndex) => {
    const expected = ATLAS_FINE_ANATOMY_CONTRACTS[structureIndex];
    if (
      structure.identifier !== expected.identifier ||
      structure.annotationValue !== expected.identifier ||
      structure.parentIdentifier !== expected.parentIdentifier ||
      !sameValues(structure.rootIdentifierPath, expected.rootIdentifierPath) ||
      structure.name !== expected.name ||
      structure.abbreviation !== expected.abbreviation ||
      structure.browserCategory !== expected.browserCategory ||
      structure.selectionMode !== "exact_identifier" ||
      structure.maskLane !== "interneuron_focused_plus_structural_context" ||
      !/^#[0-9A-F]{6}$/.test(structure.colorHexTriplet) ||
      expected.rootIdentifierPath.includes(120)
    ) {
      throw new Error(`Atlas fine-anatomy structure ${expected.identifier} metadata changed`);
    }
    categoryCounts[expected.browserCategory] += 1;
    if (
      !Array.isArray(structure.sourceHierarchy) ||
      !sameValues(
        structure.sourceHierarchy.map((entry) => entry?.identifier),
        expected.rootIdentifierPath,
      ) ||
      structure.sourceHierarchy.some(
        (entry) => typeof entry?.name !== "string" || !entry.name || typeof entry?.abbreviation !== "string" || !entry.abbreviation,
      ) ||
      structure.sourceHierarchy.at(-1)?.name !== expected.name ||
      structure.sourceHierarchy.at(-1)?.abbreviation !== expected.abbreviation
    ) {
      throw new Error(`Atlas fine-anatomy structure ${expected.identifier} source hierarchy changed`);
    }
    if (
      structure.fullVolumeDiagnostic?.presence !== "present" ||
      !Number.isInteger(structure.fullVolumeDiagnostic?.voxelCount) ||
      structure.fullVolumeDiagnostic.voxelCount <= 0 ||
      structure.fullVolumeDiagnostic?.scientificUse !== "source_presence_integrity_check_only_not_measurement"
    ) {
      throw new Error(`Atlas fine-anatomy structure ${expected.identifier} full-volume presence audit is invalid`);
    }
    fineFullVolumeVoxelCount += structure.fullVolumeDiagnostic.voxelCount;
    if (
      !Array.isArray(structure.planes) ||
      !sameValues(structure.planes.map((plane) => plane.zIndex), ATLAS_SAMPLED_Z_INDICES)
    ) {
      throw new Error(`Atlas fine-anatomy structure ${expected.identifier} plane ordering changed`);
    }

    let structurePresentPlaneCount = 0;
    let structureMissingPlaneCount = 0;
    let structureSampledVoxelCount = 0;
    let structureComponentCount = 0;
    let structurePolygonCount = 0;
    const contours = [];
    const planes = structure.planes.map((plane) => {
      if (
        plane.anteriorPosteriorMm !== Number((plane.zIndex * 0.02).toFixed(3)) ||
        plane.segment?.value !== null ||
        plane.segment?.missingReason !== "pending_curation" ||
        !Number.isInteger(plane.voxelCount) ||
        plane.voxelCount < 0 ||
        !Array.isArray(plane.components)
      ) {
        throw new Error(`Atlas fine-anatomy structure ${expected.identifier} contains an invalid plane record`);
      }
      structureSampledVoxelCount += plane.voxelCount;
      if (plane.presence === "missing") {
        if (
          plane.missingReason !== "source_mask_absent_at_sampled_plane" ||
          plane.voxelCount !== 0 ||
          plane.components.length !== 0
        ) {
          throw new Error(`Atlas fine-anatomy structure ${expected.identifier} has geometry in a missing plane`);
        }
        structureMissingPlaneCount += 1;
        missingPlaneCount += 1;
        return {
          zIndex: plane.zIndex,
          presence: "missing",
          missingReason: plane.missingReason,
          voxelCount: 0,
          componentCount: 0,
          contourCount: 0,
        };
      }
      if (plane.presence !== "present" || plane.voxelCount <= 0 || plane.components.length === 0) {
        throw new Error(`Atlas fine-anatomy structure ${expected.identifier} has an invalid present plane`);
      }
      structurePresentPlaneCount += 1;
      let planeVoxelCount = 0;
      let planeContourCount = 0;
      plane.components.forEach((component, componentIndex) => {
        if (
          component.componentIndex !== componentIndex + 1 ||
          component.connectivity !== 4 ||
          !Number.isInteger(component.voxelCount) ||
          component.voxelCount <= 0 ||
          !sameValues(component.sourceAnnotationValues, [expected.identifier]) ||
          !sameValues(component.sourceIdentifiers, [expected.identifier]) ||
          !Array.isArray(component.polygons) ||
          component.polygons.length === 0
        ) {
          throw new Error(`Atlas fine-anatomy structure ${expected.identifier} contains an invalid exact-label component`);
        }
        totalComponentCount += 1;
        structureComponentCount += 1;
        planeVoxelCount += component.voxelCount;
        let componentPixelArea = 0;
        component.polygons.forEach((polygon, polygonIndex) => {
          if (polygon.role !== "exterior" && polygon.role !== "hole") {
            throw new Error(`Atlas fine-anatomy structure ${expected.identifier} contains an invalid contour role`);
          }
          const sourcePoints = cleanClosedPixelEdgeRing(polygon.pointsVoxelEdgeXY);
          const signedAreaVoxel2 = signedPixelArea(sourcePoints);
          if (
            signedAreaVoxel2 !== polygon.signedAreaVoxel2 ||
            polygon.role !== (signedAreaVoxel2 > 0 ? "exterior" : "hole")
          ) {
            throw new Error(`Atlas fine-anatomy structure ${expected.identifier} contour area or winding changed`);
          }
          componentPixelArea += signedAreaVoxel2;
          totalContourCount += 1;
          structurePolygonCount += 1;
          planeContourCount += 1;
          contours.push({
            structureIdentifier: expected.identifier,
            planeZIndex: plane.zIndex,
            componentIndex: component.componentIndex,
            polygonIndex: polygonIndex + 1,
            role: polygon.role,
            sourcePointCount: sourcePoints.length,
            positions: sourcePoints.flatMap((point) => voxelEdgeXYToAtlasDisplay(point, plane.zIndex)),
            planeLocal: true,
            crossPlaneCorrespondence: "none",
          });
        });
        if (componentPixelArea !== component.voxelCount) {
          throw new Error(`Atlas fine-anatomy structure ${expected.identifier} contour area no longer reproduces its source mask`);
        }
      });
      if (planeVoxelCount !== plane.voxelCount) {
        throw new Error(`Atlas fine-anatomy structure ${expected.identifier} component areas no longer reproduce its source plane`);
      }
      return {
        zIndex: plane.zIndex,
        presence: "present",
        voxelCount: plane.voxelCount,
        componentCount: plane.components.length,
        contourCount: planeContourCount,
      };
    });

    const expectedSummary = structure.sampledPlaneSummary;
    if (
      expectedSummary?.presentPlaneCount !== structurePresentPlaneCount ||
      expectedSummary?.missingPlaneCount !== structureMissingPlaneCount ||
      expectedSummary?.sampledVoxelCount !== structureSampledVoxelCount ||
      expectedSummary?.componentCount !== structureComponentCount ||
      expectedSummary?.polygonCount !== structurePolygonCount
    ) {
      throw new Error(`Atlas fine-anatomy structure ${expected.identifier} sampling summary changed`);
    }
    if (structurePresentPlaneCount === 0) fullyUnsampledStructureIdentifiers.push(expected.identifier);
    return {
      identifier: expected.identifier,
      annotationValue: expected.identifier,
      name: expected.name,
      abbreviation: expected.abbreviation,
      parentIdentifier: expected.parentIdentifier,
      rootIdentifierPath: [...expected.rootIdentifierPath],
      sourceHierarchy: structure.sourceHierarchy.map((entry) => ({ ...entry })),
      browserCategory: expected.browserCategory,
      selectionMode: structure.selectionMode,
      sourceColorHexTriplet: structure.colorHexTriplet,
      fullVolumeDiagnostic: { ...structure.fullVolumeDiagnostic },
      sampledPlaneSummary: { ...expectedSummary },
      planes,
      contours,
    };
  });

  const structuralContext = validateCompactExactLabelStructures(
    payload.structuralContextStructures,
    ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS,
    {
      category: "structural_context",
      maskLane: "interneuron_focused_plus_structural_context",
    },
  );
  const motorContext = validateCompactExactLabelStructures(
    payload.motorContextStructures,
    ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
    { category: "motor_context", maskLane: "motor_context" },
  );
  const lanePolicy = payload.lanePolicy;
  if (
    lanePolicy?.interneuronFocusedStructureCount !== 37 ||
    !sameValues(lanePolicy?.interneuronFocusedStructureIdentifiers, ATLAS_FINE_ANATOMY_STRUCTURE_IDS) ||
    lanePolicy?.structuralContextStructureCount !== 3 ||
    !sameValues(lanePolicy?.structuralContextStructureIdentifiers, ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS) ||
    lanePolicy?.motorContextStructureCount !== 33 ||
    !sameValues(lanePolicy?.motorContextStructureIdentifiers, ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS) ||
    lanePolicy?.allDirectStructureCount !== 73 ||
    lanePolicy?.motorContextDefaultVisibility !== "off" ||
    lanePolicy?.atlasRegionCountsAreInterneuronCounts !== false ||
    lanePolicy?.motorContextIncludedInInterneuronCounts !== false
  ) {
    throw new Error("Atlas fine-anatomy context-lane or non-interneuron count policy changed");
  }
  const partitionedIdentifiers = [
    ...ATLAS_FINE_ANATOMY_STRUCTURE_IDS,
    ...ATLAS_STRUCTURAL_CONTEXT_STRUCTURE_IDS,
    ...ATLAS_MOTOR_CONTEXT_STRUCTURE_IDS,
  ];
  if (
    new Set(partitionedIdentifiers).size !== 73 ||
    !sameValues([...partitionedIdentifiers].sort((left, right) => left - right), ATLAS_DIRECT_LEAF_STRUCTURE_IDS)
  ) {
    throw new Error("Atlas fine-anatomy direct source leaves are not an exact three-lane partition");
  }
  if (
    fineFullVolumeVoxelCount +
      structuralContext.fullVolumeVoxelCount +
      motorContext.fullVolumeVoxelCount !==
    payload.sourceInventory.fullVolumeDirectVoxelCount
  ) {
    throw new Error("Atlas fine-anatomy lane voxel totals do not reconcile to the full source inventory");
  }
  const structuresByIdentifier = new Map(
    [...payload.structures, ...payload.structuralContextStructures, ...payload.motorContextStructures]
      .map((structure) => [structure.identifier, structure]),
  );
  const fillOverlayReport = validateFineFillOverlayContract(payload, structuresByIdentifier);

  if (
    totalComponentCount !== ATLAS_FINE_COMPONENT_COUNT ||
    totalContourCount !== ATLAS_FINE_CONTOUR_COUNT ||
    missingPlaneCount !== ATLAS_FINE_MISSING_PLANE_COUNT ||
    !sameValues(fullyUnsampledStructureIdentifiers, ATLAS_FINE_FULLY_UNSAMPLED_IDS) ||
    payload.samplingSummary?.structureCount !== ATLAS_FINE_ANATOMY_STRUCTURE_IDS.length ||
    payload.samplingSummary?.structuralContextStructureCount !== 3 ||
    payload.samplingSummary?.motorContextStructureCount !== 33 ||
    payload.samplingSummary?.allDirectStructureCount !== 73 ||
    payload.samplingSummary?.planeRecordCount !== ATLAS_FINE_ANATOMY_STRUCTURE_IDS.length * ATLAS_PLANE_COUNT ||
    payload.samplingSummary?.missingPlaneRecordCount !== missingPlaneCount ||
    payload.samplingSummary?.componentCount !== totalComponentCount ||
    payload.samplingSummary?.polygonCount !== totalContourCount ||
    !sameValues(payload.samplingSummary?.fullyUnsampledStructureIdentifiers, ATLAS_FINE_FULLY_UNSAMPLED_IDS) ||
    payload.samplingSummary?.categoryCounts?.lamina !== categoryCounts.lamina ||
    payload.samplingSummary?.categoryCounts?.nucleus_or_column !== categoryCounts.nucleus_or_column ||
    payload.samplingSummary?.categoryCounts?.tract !== categoryCounts.tract
  ) {
    throw new Error("Atlas fine-anatomy component, contour, category, or explicit-missingness lock changed");
  }

  return {
    assetId: payload.assetId,
    sourceAtlasAssetId: payload.sourceAtlasAssetId,
    coordinateSpaceId: payload.coordinateSpaceId,
    geometryStatus: "INF",
    measurementUse: "forbidden",
    registrationCount: 0,
    segmentLabels: [],
    planeCount: ATLAS_PLANE_COUNT,
    structureCount: structures.length,
    categoryCounts,
    directLeafStructureCount: 73,
    structuralContextStructureCount: structuralContext.structures.length,
    motorContextStructureCount: motorContext.structures.length,
    totalComponentCount,
    totalContourCount,
    missingPlaneCount,
    fullyUnsampledStructureIdentifiers,
    crossPlaneCorrespondence: "none",
    interpolation: "none",
    manualGeometry: "none",
    structures,
    structuralContextStructures: structuralContext.structures,
    motorContextStructures: motorContext.structures,
    structuralContextSampledVoxelCount: structuralContext.sampledVoxelCount,
    motorContextSampledVoxelCount: motorContext.sampledVoxelCount,
    structuralContextComponentCount: structuralContext.componentCount,
    motorContextComponentCount: motorContext.componentCount,
    structuralContextMissingPlaneCount: structuralContext.missingPlaneCount,
    motorContextMissingPlaneCount: motorContext.missingPlaneCount,
    sourceStateCount: payload.sourceStateCoverage.distinctSourceStateCount,
    fillOverlayCount: fillOverlayReport.overlayCount,
    fillOverlayLanes: fillOverlayReport.lanes,
    // Retain the already-validated three-lane source contract for the lazy
    // native-volume validator. The viewer must validate the native manifest
    // against this normalized geometry object, not against untrusted raw JSON.
    lanePolicy: {
      ...lanePolicy,
      interneuronFocusedStructureIdentifiers: [...lanePolicy.interneuronFocusedStructureIdentifiers],
      structuralContextStructureIdentifiers: [...lanePolicy.structuralContextStructureIdentifiers],
      motorContextStructureIdentifiers: [...lanePolicy.motorContextStructureIdentifiers],
    },
    sourceInventory: {
      ...payload.sourceInventory,
      directLeafIdentifiers: [...payload.sourceInventory.directLeafIdentifiers],
      annotationNonzeroIdentifiers: [...payload.sourceInventory.annotationNonzeroIdentifiers],
      hierarchyOnlyIdentifiers: [...payload.sourceInventory.hierarchyOnlyIdentifiers],
    },
  };
}

/**
 * Expands closed plane-local rings into independent edge pairs for THREE.LineSegments.
 * Every emitted pair is checked to remain on one source plane, preventing an
 * accidental rendering-time bridge even when several planes share one buffer.
 */
export function buildPlaneLocalContourSegments(contours) {
  if (!Array.isArray(contours)) throw new Error("Plane-local contours must be an array");
  const edgePositions = [];
  for (const contour of contours) {
    if (
      contour?.planeLocal !== true ||
      contour?.crossPlaneCorrespondence !== "none" ||
      !Array.isArray(contour.positions) ||
      contour.positions.length < 9 ||
      contour.positions.length % 3 !== 0
    ) {
      throw new Error("Only validated plane-local contour positions can become line segments");
    }
    const pointCount = contour.positions.length / 3;
    const planeZ = contour.positions[2];
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
      const start = pointIndex * 3;
      const next = ((pointIndex + 1) % pointCount) * 3;
      if (
        !Number.isFinite(contour.positions[start]) ||
        !Number.isFinite(contour.positions[start + 1]) ||
        contour.positions[start + 2] !== planeZ ||
        contour.positions[next + 2] !== planeZ
      ) {
        throw new Error("A rendered internal-contour edge would leave its sampled source plane");
      }
      edgePositions.push(
        ...contour.positions.slice(start, start + 3),
        ...contour.positions.slice(next, next + 3),
      );
    }
  }
  return edgePositions;
}
