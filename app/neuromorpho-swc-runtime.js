export const NEUROMORPHO_SWC_NODE_COLUMNS = Object.freeze([
  "id",
  "type",
  "x",
  "y",
  "z",
  "radius",
  "parent",
]);

export const NEUROMORPHO_SWC_SEGMENT_COLUMNS = Object.freeze([
  "x1",
  "y1",
  "z1",
  "r1",
  "x2",
  "y2",
  "z2",
  "r2",
  "sourceType",
  "interpretation",
]);

const INTEGER_TEXT = /^-?\d+$/;
const SHA256_TEXT = /^[a-f0-9]{64}$/;
const DEFAULT_SOURCE_FRAME = "NeuroMorpho_CNG_standardized_local_frame";
const DEFAULT_UNITS = "micrometre_reported_by_source";

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseInteger(value, label) {
  if (!INTEGER_TEXT.test(value)) fail(`${label} must be a strict integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) fail(`${label} is outside the safe integer range`);
  return parsed;
}

function parseFiniteNumber(value, label) {
  if (value === "") fail(`${label} must be a finite number`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(`${label} must be a finite number`);
  return parsed;
}

function inputBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  return null;
}

function decodeUtf8(value) {
  if (typeof value === "string") return value.replace(/^\uFEFF/, "");
  const bytes = inputBytes(value);
  if (!bytes) fail("NeuroMorpho SWC input must be UTF-8 text or bytes");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  } catch {
    return fail("NeuroMorpho SWC bytes are not valid UTF-8");
  }
}

export function interpretationForNeuromorphoSourceType(sourceType) {
  return ({
    0: "uninterpreted_undefined_type_0",
    1: "soma_type_1",
    2: "axon_type_2",
    3: "dendrite_type_3",
    4: "apical_dendrite_type_4",
    5: "uninterpreted_custom_type_5",
    6: "uninterpreted_neurite_type_6",
    7: "glia_process_type_7",
  })[sourceType] ?? `uninterpreted_unknown_type_${sourceType}`;
}

function validateTopology(nodesById, rootId) {
  for (const node of nodesById.values()) {
    if (node.parentId === node.id) fail(`NeuroMorpho SWC node ${node.id} cannot be its own parent`);
    if (node.parentId !== -1 && !nodesById.has(node.parentId)) {
      fail(`NeuroMorpho SWC node ${node.id} has missing parent ${node.parentId}`);
    }
  }

  // Parent chains can contain tens of thousands of nodes. Keep cycle checking
  // iterative so a valid large reconstruction cannot overflow the JS stack.
  const completed = new Set();
  for (const nodeId of nodesById.keys()) {
    if (completed.has(nodeId)) continue;
    const active = new Set();
    const path = [];
    let cursor = nodeId;
    while (cursor !== -1 && !completed.has(cursor)) {
      if (active.has(cursor)) fail(`NeuroMorpho SWC contains a cycle at node ${cursor}`);
      active.add(cursor);
      path.push(cursor);
      cursor = nodesById.get(cursor).parentId;
    }
    if (cursor === -1 && path.at(-1) !== rootId) {
      fail(`NeuroMorpho SWC node ${nodeId} does not connect to the single root`);
    }
    for (const pathNodeId of path) completed.add(pathNodeId);
  }

  const childrenById = new Map(Array.from(nodesById.keys(), (nodeId) => [nodeId, []]));
  for (const node of nodesById.values()) {
    if (node.parentId !== -1) childrenById.get(node.parentId).push(node.id);
  }
  const reached = new Set();
  const pending = [rootId];
  while (pending.length) {
    const nodeId = pending.pop();
    if (reached.has(nodeId)) continue;
    reached.add(nodeId);
    pending.push(...childrenById.get(nodeId));
  }
  if (reached.size !== nodesById.size) {
    fail(`NeuroMorpho SWC is disconnected: root reaches ${reached.size} of ${nodesById.size} nodes`);
  }
}

function summarizeNodes(orderedNodes, nodesById, rootId, diameterAuthorized) {
  const boundsMin = [Infinity, Infinity, Infinity];
  const boundsMax = [-Infinity, -Infinity, -Infinity];
  const nodeTypeCounts = {};
  let radiusMinimumMicrometre = Infinity;
  let radiusMaximumMicrometre = -Infinity;
  let radiusTotalMicrometre = 0;
  let zeroLengthEdgeCount = 0;
  let totalCableLengthMicrometre = 0;

  for (const node of orderedNodes) {
    const coordinates = [node.x, node.y, node.z];
    for (let axis = 0; axis < 3; axis += 1) {
      boundsMin[axis] = Math.min(boundsMin[axis], coordinates[axis]);
      boundsMax[axis] = Math.max(boundsMax[axis], coordinates[axis]);
    }
    nodeTypeCounts[node.sourceType] = (nodeTypeCounts[node.sourceType] ?? 0) + 1;
    radiusMinimumMicrometre = Math.min(radiusMinimumMicrometre, node.radius);
    radiusMaximumMicrometre = Math.max(radiusMaximumMicrometre, node.radius);
    radiusTotalMicrometre += node.radius;
    if (node.parentId === -1) continue;
    const parent = nodesById.get(node.parentId);
    const length = Math.hypot(node.x - parent.x, node.y - parent.y, node.z - parent.z);
    if (length === 0) zeroLengthEdgeCount += 1;
    totalCableLengthMicrometre += length;
  }

  const extentMicrometre = boundsMax.map((maximum, axis) => maximum - boundsMin[axis]);
  const radiusSummary = {
    minimumMicrometre: radiusMinimumMicrometre,
    maximumMicrometre: radiusMaximumMicrometre,
    meanMicrometre: radiusTotalMicrometre / orderedNodes.length,
  };
  return {
    nodeCount: orderedNodes.length,
    segmentCount: orderedNodes.length - 1,
    rootNodeId: rootId,
    nodeTypeCounts,
    boundsMicrometre: { min: boundsMin, max: boundsMax },
    extentMicrometre,
    zeroLengthEdgeCount,
    totalCableLengthMicrometre,
    radiusSurfaceAuthorized: diameterAuthorized,
    radiusDerived: diameterAuthorized
      ? { value: radiusSummary, missingReason: null }
      : { value: null, missingReason: "official_attributes_report_no_diameter" },
  };
}

/**
 * Parse one exact NeuroMorpho standardized SWC object without repairing,
 * resampling, reorienting, registering, or extruding it. Source type and raw
 * radius values are retained byte-semantically as parsed numeric values.
 */
export function parseNeuromorphoSwc(value, {
  assetId = null,
  neuronId = null,
  name = null,
  sourceFrame = DEFAULT_SOURCE_FRAME,
  dimensionality = "3D",
  diameterAuthorized = true,
  sourceReceipt = null,
} = {}) {
  if (dimensionality !== "2D" && dimensionality !== "3D") {
    fail("NeuroMorpho SWC dimensionality must be exactly 2D or 3D");
  }
  if (typeof diameterAuthorized !== "boolean") {
    fail("NeuroMorpho SWC diameter authorization must be boolean");
  }
  if (typeof sourceFrame !== "string" || !sourceFrame) {
    fail("NeuroMorpho SWC source frame is missing");
  }

  const text = decodeUtf8(value);
  const nodesById = new Map();
  for (const [lineIndex, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const fields = line.split(/\s+/);
    const label = `NeuroMorpho SWC line ${lineIndex + 1}`;
    if (fields.length !== 7) fail(`${label} must contain exactly 7 columns`);
    const id = parseInteger(fields[0], `${label} node ID`);
    const sourceType = parseInteger(fields[1], `${label} source type`);
    const x = parseFiniteNumber(fields[2], `${label} x`);
    const y = parseFiniteNumber(fields[3], `${label} y`);
    const z = parseFiniteNumber(fields[4], `${label} z`);
    const radius = parseFiniteNumber(fields[5], `${label} radius`);
    const parentId = parseInteger(fields[6], `${label} parent ID`);
    if (id <= 0) fail(`${label} node ID must be positive`);
    if (sourceType < 0) fail(`${label} source type must be non-negative`);
    if (parentId === 0 || parentId < -1) fail(`${label} parent ID must be -1 or positive`);
    if (radius <= 0) fail(`${label} radius must be positive`);
    if (nodesById.has(id)) fail(`${label} duplicates node ID ${id}`);
    nodesById.set(id, { id, sourceType, x, y, z, radius, parentId });
  }
  if (nodesById.size === 0) fail("NeuroMorpho SWC contains no data rows");
  const roots = Array.from(nodesById.values()).filter((node) => node.parentId === -1);
  if (roots.length !== 1) fail(`NeuroMorpho SWC must contain exactly one root; found ${roots.length}`);
  const rootId = roots[0].id;
  validateTopology(nodesById, rootId);

  const orderedNodes = Array.from(nodesById.values()).sort((left, right) => left.id - right.id);
  const nodes = orderedNodes.map((node) => [
    node.id,
    node.sourceType,
    node.x,
    node.y,
    node.z,
    node.radius,
    node.parentId,
  ]);
  const segments = orderedNodes
    .filter((node) => node.parentId !== -1)
    .map((node) => {
      const parent = nodesById.get(node.parentId);
      return [
        parent.x,
        parent.y,
        parent.z,
        parent.radius,
        node.x,
        node.y,
        node.z,
        node.radius,
        node.sourceType,
        interpretationForNeuromorphoSourceType(node.sourceType),
      ];
    });
  const computed = summarizeNodes(orderedNodes, nodesById, rootId, diameterAuthorized);
  // Reported diameter remains native input; only 3D sources authorize a surface.
  const radiusSurfaceAuthorized = dimensionality === "3D" && diameterAuthorized;
  computed.radiusSurfaceAuthorized = radiusSurfaceAuthorized;
  const root = nodesById.get(rootId);
  const maximumExtent = Math.max(...computed.extentMicrometre);
  const receipt = isObject(sourceReceipt) ? { ...sourceReceipt } : {};

  return {
    documentType: "neuromorpho_lazy_swc_geometry",
    schemaVersion: "1.0.0",
    assetId,
    neuronId,
    name,
    geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
    sourceFrame,
    units: DEFAULT_UNITS,
    dimensionality,
    extrusionApplied: false,
    zCoordinatePolicy: "preserve_source_values_never_extrude",
    diameterAuthorized,
    radiusSurfaceAuthorized,
    rawRadiusPreserved: true,
    registration: {
      status: "unregistered",
      registrationCount: 0,
      atlasTransform: { value: null, missingReason: "not_available" },
      atlasPlacement: { value: null, missingReason: "not_established" },
    },
    scientificUse: "source_local_morphology_visualization_and_qc_only",
    source: receipt,
    swc: {
      format: "NeuroMorpho_CNG_standardized_SWC",
      path: receipt.path ?? null,
      sha256: receipt.sha256 ?? null,
      bytes: receipt.bytes ?? null,
      nodeCount: computed.nodeCount,
      rootNodeId: computed.rootNodeId,
      nodeTypeCounts: computed.nodeTypeCounts,
      dimensionality,
      sourceDiameterAvailable: diameterAuthorized,
      radiusSurfaceAuthorized,
      rawRadiusPreserved: true,
      extrusionApplied: false,
      type6Policy: "preserve_uninterpreted_never_infer_axon_or_dendrite",
    },
    qc: {
      status: "passed",
      sevenColumns: true,
      finite: true,
      uniquePositiveNodeIds: true,
      singleRoot: true,
      parentsPresent: true,
      noSelfParent: true,
      acyclic: true,
      connected: true,
      positiveRadius: true,
      sourceTypesPreserved: true,
      errors: [],
    },
    computed,
    morphometrics: { computedFromStandardizedSwc: computed },
    displayTransform: {
      kind: "soma_centered_uniform_scale",
      originMicrometre: [root.x, root.y, root.z],
      scaleViewerUnitPerMicrometre: maximumExtent > 0 ? 6 / maximumExtent : 1,
      use: "viewer_only",
    },
    nodeColumns: [...NEUROMORPHO_SWC_NODE_COLUMNS],
    nodes,
    segmentColumns: [...NEUROMORPHO_SWC_SEGMENT_COLUMNS],
    segmentEndpointMeaning: { endpoint1: "parent", endpoint2: "child" },
    segments,
  };
}

function validateUniverseRecord(record) {
  if (!isObject(record)) fail("NeuroMorpho universe record is missing");
  if (!Number.isSafeInteger(record.neuronId) || record.neuronId <= 0) {
    fail("NeuroMorpho universe record neuron ID is invalid");
  }
  if (record.assetId !== `NeuroMorpho:${record.neuronId}`) {
    fail("NeuroMorpho universe record asset identity does not match its neuron ID");
  }
  if (!isObject(record.swc)) fail("NeuroMorpho universe record SWC receipt is missing");
  const { path, bytes, sha256 } = record.swc;
  if (typeof path !== "string"
    || !path.startsWith("/")
    || path.includes("\\")
    || path.includes("?")
    || path.includes("#")
    || path.split("/").includes("..")
    || path.includes("//")) {
    fail("NeuroMorpho universe SWC path must be a safe root-relative browser path");
  }
  if (!path.endsWith(`/nmo-${record.neuronId}.swc`)) {
    fail("NeuroMorpho universe SWC path does not match the record neuron ID");
  }
  if (!Number.isSafeInteger(bytes) || bytes <= 0) {
    fail("NeuroMorpho universe SWC byte receipt is invalid");
  }
  if (typeof sha256 !== "string" || !SHA256_TEXT.test(sha256)) {
    fail("NeuroMorpho universe SWC SHA-256 receipt is invalid");
  }
  if (record.swc.neuronId !== undefined && record.swc.neuronId !== record.neuronId) {
    fail("NeuroMorpho universe SWC receipt identity does not match the record");
  }
  const dimensionality = record.normalizedMetadata?.dimensionality ?? record.dimensionality;
  if (dimensionality !== "2D" && dimensionality !== "3D") {
    fail("NeuroMorpho universe record dimensionality is invalid");
  }
  const diameterAuthorized = record.diameterAuthorized
    ?? record.normalizedMetadata?.sourceDiameterAvailable
    ?? true;
  if (typeof diameterAuthorized !== "boolean") {
    fail("NeuroMorpho universe record diameter authorization is invalid");
  }
  const sourceFrame = record.normalizedMetadata?.sourceFrame ?? record.sourceFrame ?? DEFAULT_SOURCE_FRAME;
  if (typeof sourceFrame !== "string" || !sourceFrame) {
    fail("NeuroMorpho universe record source frame is invalid");
  }
  return { path, bytes, sha256, dimensionality, diameterAuthorized, sourceFrame };
}

/**
 * Fetch, byte-check, hash-check, and only then parse one universe SWC. Callers
 * inject fetch and SHA-256 implementations so this module remains browser-safe
 * and testable without importing Node-only APIs.
 */
export async function loadVerifiedUniverseSwc(record, fetchImpl = globalThis.fetch, sha256Impl) {
  const receipt = validateUniverseRecord(record);
  if (typeof fetchImpl !== "function") fail("NeuroMorpho universe SWC fetch implementation is missing");
  if (typeof sha256Impl !== "function") fail("NeuroMorpho universe SWC SHA-256 implementation is missing");
  const response = await fetchImpl(receipt.path);
  if (!response || response.ok !== true || typeof response.arrayBuffer !== "function") {
    const status = Number.isInteger(response?.status) ? ` (${response.status})` : "";
    fail(`NeuroMorpho universe SWC request failed${status}`);
  }
  const body = await response.arrayBuffer();
  const bytes = inputBytes(body);
  if (!bytes) fail("NeuroMorpho universe SWC response did not return bytes");
  if (bytes.byteLength !== receipt.bytes) fail("NeuroMorpho universe SWC byte receipt mismatch");
  const actualSha256 = await sha256Impl(bytes);
  if (typeof actualSha256 !== "string" || !SHA256_TEXT.test(actualSha256.toLowerCase())) {
    fail("NeuroMorpho universe SWC SHA-256 implementation returned an invalid digest");
  }
  if (actualSha256.toLowerCase() !== receipt.sha256) {
    fail("NeuroMorpho universe SWC checksum mismatch");
  }
  return parseNeuromorphoSwc(bytes, {
    assetId: record.assetId,
    neuronId: record.neuronId,
    name: record.normalizedMetadata?.name ?? record.name ?? `NeuroMorpho ${record.neuronId}`,
    sourceFrame: receipt.sourceFrame,
    dimensionality: receipt.dimensionality,
    diameterAuthorized: receipt.diameterAuthorized,
    sourceReceipt: {
      path: receipt.path,
      bytes: receipt.bytes,
      sha256: receipt.sha256,
      verified: true,
      transport: "standardized_swc",
    },
  });
}
