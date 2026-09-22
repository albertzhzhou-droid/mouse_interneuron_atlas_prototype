#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILDER_REPOSITORY_PATH = "tools/build_morphology_topology_detail.mjs";
const SCHEMA_REPOSITORY_PATH = "schemas/morphology-topology-detail-0.1.schema.json";
const CONTRACT_REPOSITORY_PATH = "data/morphology-topology-detail-0.1.json";
const RUNTIME_REPOSITORY_PATH = "public/data/morphology_topology_detail_v1/index.json";
const RUNTIME_FETCH_PATH = "/data/morphology_topology_detail_v1/index.json";
const CENSUS_INDEX_REPOSITORY_PATH = "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json";
const CENSUS_MANIFEST_REPOSITORY_PATH = "public/data/neuromorpho_release_8_6_124_census_v1/asset-manifest.json";
const SUPPLEMENTARY_ADAPTER_REPOSITORY_PATH = "data/supplementary-morphology-comparison-adapter-0.1.json";
const FROZEN_ANALYSIS_REPOSITORY_PATH = "public/data/neuromorpho_release_8_6_124_analysis_v1/analysis-index.json";
const SUPPLEMENTARY_ANALYSIS_REPOSITORY_PATH = "public/data/supplementary_morphology_comparison_v1/analysis-delta.json";
const ANALYSIS_ALGORITHM_REPOSITORY_PATH = "tools/build_neuromorpho_analysis.py";

const RELEASE = "8.6.124";
const RELEASED_AT = "2026-08-31";
const SHOLL_STEP_MICROMETRE = 10;
const EXPECTED_CENSUS_COUNT = 142;
const EXPECTED_SUPPLEMENTARY_IDS = Object.freeze([45674, 45718, 50394, 50408, 50424, 170035, 249676]);
const EXPECTED_CENSUS_INDEX_SHA256 = "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364";
const EXPECTED_CENSUS_MANIFEST_SHA256 = "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91";
const EXPECTED_ANALYSIS_ALGORITHM_SHA256 = "10813a83b8c42f6478186bbd752571f5db62391283966b073b08516c9d95a132";
const EXPECTED_CENSUS_ASSET_SET_ID = "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-census-v1";
const NODE_COLUMNS = Object.freeze(["id", "type", "x", "y", "z", "radius", "parent"]);

const ANALYSIS_POLICY = Object.freeze({
  topology: "read_checksum_verified_source_node_rows_without_coordinate_topology_radius_or_source_type_modification",
  segmentDomain: "a_segment_belongs_to_the_unmodified_source_type_of_its_child_node;_source_type_1_edges_are_not_neurite_segments",
  terminal: "a_non_type_1_node_with_zero_non_type_1_child_nodes_in_the_complete_source_topology",
  bifurcation: "a_non_type_1_node_with_two_or_more_non_type_1_child_nodes_in_the_complete_source_topology",
  branchOrder: "stem_segments_have_order_0_and_increment_once_only_after_a_global_non_type_1_bifurcation",
  sholl: Object.freeze({
    centre: "exact_root_node_coordinate_not_soma_centroid",
    radiusStepMicrometre: SHOLL_STEP_MICROMETRE,
    endpointInterval: "half_open_t_in_(0,1]",
    tangentPolicy: "repeated_quadratic_root_counts_once",
    zeroLengthSegmentPolicy: "zero_crossings",
    domainPolicy: "filter_neurite_segments_by_unmodified_child_source_type_and_stop_at_that_domain_maximum_root_distance",
  }),
  sourceTypeAbsence: "UNAVAILABLE_not_biological_zero",
  somaType1: "standardized_soma_samples_never_contour_surface_membrane_or_internal_structure",
});

const SCIENTIFIC_BOUNDARY = Object.freeze({
  analysisUnit: "NeuroMorpho_record",
  combinedCensusClaim: false,
  biologicalZeroInferredFromAbsentSourceType: false,
  somaContourClaimCount: 0,
  membraneClaimCount: 0,
  internalStructureClaimCount: 0,
  atlasPlacementCount: 0,
  atlasTransformCount: 0,
  registrationCount: 0,
  completeBiologicalAxonClaimCount: 0,
  crossSourceIdentityCount: 0,
  generatedBiologicalPrimitiveCount: 0,
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function canonicalJsonBytes(value) {
  return Buffer.from(`${JSON.stringify(stableValue(value))}\n`, "utf8");
}

export function canonicalContentSha256(document) {
  const copy = structuredClone(document);
  delete copy.contractContentSha256;
  return sha256(Buffer.from(JSON.stringify(stableValue(copy)), "utf8"));
}

function same(left, right) {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function repositoryPath(projectRoot, relativePath) {
  const resolved = path.resolve(projectRoot, relativePath);
  check(
    resolved === projectRoot || resolved.startsWith(`${projectRoot}${path.sep}`),
    `Repository path escapes project root: ${relativePath}`,
  );
  return resolved;
}

async function fileReceipt(projectRoot, relativePath) {
  const bytes = await readFile(repositoryPath(projectRoot, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

async function jsonInput(projectRoot, relativePath) {
  const absolutePath = repositoryPath(projectRoot, relativePath);
  const bytes = await readFile(absolutePath);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${relativePath} is not valid UTF-8 JSON: ${error.message}`);
  }
  return { value, bytes, receipt: { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) } };
}

function publicFetchPath(repositoryRelativePath) {
  check(repositoryRelativePath.startsWith("public/"), `Not a public repository path: ${repositoryRelativePath}`);
  return `/${repositoryRelativePath.slice("public/".length)}`;
}

function publicRepositoryPath(fetchPath) {
  check(typeof fetchPath === "string" && fetchPath.startsWith("/data/"), `Unsupported public path: ${fetchPath}`);
  return `public${fetchPath}`;
}

function sourceTypeInterpretation(sourceType) {
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

function sourceTypeSemanticStatus(sourceType) {
  if (sourceType === 1) return "standardized_soma_samples_not_contour";
  if ([2, 3, 4].includes(sourceType)) return "standardized_swc_source_type";
  return "source_defined_uninterpreted";
}

function vectorDistance(left, right) {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}

export function segmentSphereIntersectionCount(parentPosition, childPosition, centre, radius) {
  const px = parentPosition[0] - centre[0];
  const py = parentPosition[1] - centre[1];
  const pz = parentPosition[2] - centre[2];
  const dx = childPosition[0] - parentPosition[0];
  const dy = childPosition[1] - parentPosition[1];
  const dz = childPosition[2] - parentPosition[2];
  const a = dx * dx + dy * dy + dz * dz;
  if (a === 0) return 0;
  const b = 2 * (px * dx + py * dy + pz * dz);
  const c = px * px + py * py + pz * pz - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return 0;
  if (discriminant === 0) {
    const parameter = -b / (2 * a);
    return Number(parameter > 0 && parameter <= 1);
  }
  const root = Math.sqrt(discriminant);
  const first = (-b - root) / (2 * a);
  const second = (-b + root) / (2 * a);
  return Number(first > 0 && first <= 1) + Number(second > 0 && second <= 1);
}

function buildShollProfile(segments, rootPosition, maximumDistanceMicrometre) {
  const maximumRadius = Math.floor(maximumDistanceMicrometre / SHOLL_STEP_MICROMETRE) * SHOLL_STEP_MICROMETRE;
  const result = [];
  for (let radius = SHOLL_STEP_MICROMETRE; radius <= maximumRadius; radius += SHOLL_STEP_MICROMETRE) {
    let intersectionCount = 0;
    for (const segment of segments) {
      intersectionCount += segmentSphereIntersectionCount(
        segment.parent.position,
        segment.child.position,
        rootPosition,
        radius,
      );
    }
    result.push({ radiusMicrometre: radius, intersectionCount });
  }
  return result;
}

function unavailableNeuriteMetrics() {
  return {
    status: "UNAVAILABLE",
    reasonCode: "source_type_1_standardized_soma_samples_are_excluded_from_neurite_metrics",
    biologicalAbsenceClaim: false,
  };
}

export function computeMorphologyTopologyDetail(nodes, { expectedNeuronId = null } = {}) {
  check(Array.isArray(nodes) && nodes.length > 1, "Topology detail requires at least two source nodes");
  const byId = new Map();
  for (const [index, row] of nodes.entries()) {
    check(Array.isArray(row) && row.length === 7, `Node row ${index} must preserve seven SWC columns`);
    const [nodeId, sourceType, x, y, z, radius, parentId] = row;
    check(Number.isInteger(nodeId) && nodeId > 0, `Node row ${index} has an invalid node ID`);
    check(Number.isInteger(sourceType) && sourceType >= 0, `Node ${nodeId} has an invalid source type`);
    check([x, y, z, radius].every(Number.isFinite) && radius > 0, `Node ${nodeId} has invalid geometry`);
    check(Number.isInteger(parentId) && (parentId === -1 || parentId > 0), `Node ${nodeId} has an invalid parent ID`);
    check(!byId.has(nodeId), `Duplicate source node ID ${nodeId}`);
    byId.set(nodeId, {
      nodeId,
      sourceType,
      position: [x, y, z],
      radius,
      parentId,
      children: [],
    });
  }

  const roots = [...byId.values()].filter((node) => node.parentId === -1);
  check(roots.length === 1, `${expectedNeuronId ?? "Geometry"} must have exactly one root`);
  const root = roots[0];
  check(root.sourceType === 1, `${expectedNeuronId ?? "Geometry"} root must retain source type 1`);
  for (const node of byId.values()) {
    if (node.parentId === -1) continue;
    const parent = byId.get(node.parentId);
    check(parent && parent !== node, `Node ${node.nodeId} has a missing or self parent`);
    parent.children.push(node.nodeId);
  }
  for (const node of byId.values()) node.children.sort((left, right) => left - right);

  const traversal = [];
  const active = new Set();
  const visited = new Set();
  const stack = [{ nodeId: root.nodeId, nextChildIndex: 0, entered: false }];
  while (stack.length > 0) {
    const frame = stack.at(-1);
    const node = byId.get(frame.nodeId);
    if (!frame.entered) {
      check(!active.has(frame.nodeId), `Topology cycle includes node ${frame.nodeId}`);
      active.add(frame.nodeId);
      traversal.push(frame.nodeId);
      frame.entered = true;
    }
    if (frame.nextChildIndex < node.children.length) {
      const childId = node.children[frame.nextChildIndex];
      frame.nextChildIndex += 1;
      check(!active.has(childId), `Topology cycle includes node ${childId}`);
      if (!visited.has(childId)) stack.push({ nodeId: childId, nextChildIndex: 0, entered: false });
      continue;
    }
    active.delete(frame.nodeId);
    visited.add(frame.nodeId);
    stack.pop();
  }
  check(visited.size === byId.size, "Topology is disconnected from the exact source root");

  const neuriteChildren = new Map();
  for (const node of byId.values()) {
    neuriteChildren.set(node.nodeId, node.children.filter((childId) => byId.get(childId).sourceType !== 1));
  }
  const bifurcationNodeIds = [...byId.values()]
    .filter((node) => node.sourceType !== 1 && neuriteChildren.get(node.nodeId).length >= 2)
    .map((node) => node.nodeId)
    .sort((left, right) => left - right);
  const bifurcationSet = new Set(bifurcationNodeIds);

  const branchOrder = new Map();
  const rootPathLength = new Map([[root.nodeId, 0]]);
  const allSegments = [];
  const neuriteSegments = [];
  const stems = [];
  for (const nodeId of traversal) {
    const child = byId.get(nodeId);
    if (child.parentId === -1) continue;
    const parent = byId.get(child.parentId);
    const length = vectorDistance(parent.position, child.position);
    const isNeurite = child.sourceType !== 1;
    rootPathLength.set(child.nodeId, rootPathLength.get(parent.nodeId) + (isNeurite ? length : 0));
    const segment = { parent, child, length };
    allSegments.push(segment);
    if (!isNeurite) continue;
    const isStem = parent.sourceType === 1;
    const order = isStem
      ? 0
      : (branchOrder.get(parent.nodeId) ?? 0) + Number(bifurcationSet.has(parent.nodeId));
    check(isStem || branchOrder.has(parent.nodeId), `Neurite node ${child.nodeId} has no upstream branch order`);
    branchOrder.set(child.nodeId, order);
    if (isStem) stems.push(child.nodeId);
    neuriteSegments.push(segment);
  }
  check(rootPathLength.size === byId.size, "Topology traversal did not assign every root path length");
  check(neuriteSegments.length > 0, "Geometry has no admitted non-type-1 neurite segment");

  const terminalNodeIds = [...byId.values()]
    .filter((node) => node.sourceType !== 1 && neuriteChildren.get(node.nodeId).length === 0)
    .map((node) => node.nodeId)
    .sort((left, right) => left - right);
  const terminalSet = new Set(terminalNodeIds);
  const sourceTypes = [...new Set([...byId.values()].map((node) => node.sourceType))].sort((left, right) => left - right);
  const maximumRootEuclideanDistanceMicrometre = Math.max(
    ...[...byId.values()].filter((node) => node.sourceType !== 1).map((node) => vectorDistance(root.position, node.position)),
  );
  const globalShollProfile = buildShollProfile(neuriteSegments, root.position, maximumRootEuclideanDistanceMicrometre);

  const sourceTypeDomains = sourceTypes.map((sourceType) => {
    const domainNodes = [...byId.values()].filter((node) => node.sourceType === sourceType).sort((a, b) => a.nodeId - b.nodeId);
    const domainSegments = allSegments.filter((segment) => segment.child.sourceType === sourceType);
    if (sourceType === 1) {
      return {
        sourceType,
        interpretation: sourceTypeInterpretation(sourceType),
        semanticStatus: sourceTypeSemanticStatus(sourceType),
        nodeCount: domainNodes.length,
        segmentCount: domainSegments.length,
        standardizedSomaSampleNodeIds: domainNodes.map((node) => node.nodeId),
        rootNodeIds: [root.nodeId],
        neuriteMetrics: unavailableNeuriteMetrics(),
      };
    }
    const domainTerminalNodeIds = domainNodes.filter((node) => terminalSet.has(node.nodeId)).map((node) => node.nodeId);
    const domainBifurcationNodeIds = domainNodes.filter((node) => bifurcationSet.has(node.nodeId)).map((node) => node.nodeId);
    const maximumDomainDistance = Math.max(...domainNodes.map((node) => vectorDistance(root.position, node.position)));
    return {
      sourceType,
      interpretation: sourceTypeInterpretation(sourceType),
      semanticStatus: sourceTypeSemanticStatus(sourceType),
      nodeCount: domainNodes.length,
      segmentCount: domainSegments.length,
      cableLengthMicrometre: domainSegments.reduce((sum, segment) => sum + segment.length, 0),
      terminalNodeCount: domainTerminalNodeIds.length,
      bifurcationNodeCount: domainBifurcationNodeIds.length,
      maximumCentrifugalBranchOrder: Math.max(...domainNodes.map((node) => branchOrder.get(node.nodeId))),
      maximumRootEuclideanDistanceMicrometre: maximumDomainDistance,
      zeroLengthSegmentCount: domainSegments.filter((segment) => segment.length === 0).length,
      shollProfile: buildShollProfile(domainSegments, root.position, maximumDomainDistance),
      landmarkNodeIds: {
        bifurcationNodeIds: domainBifurcationNodeIds,
        terminalNodeIds: domainTerminalNodeIds,
      },
    };
  });

  const canonicalNeuriteTypeAvailability = [2, 3, 4].map((sourceType) => {
    const sourceTypeDomainIndex = sourceTypeDomains.findIndex((domain) => domain.sourceType === sourceType);
    if (sourceTypeDomainIndex >= 0) {
      return {
        sourceType,
        interpretation: sourceTypeInterpretation(sourceType),
        status: "PRESENT",
        sourceTypeDomainIndex,
      };
    }
    return {
      sourceType,
      interpretation: sourceTypeInterpretation(sourceType),
      status: "UNAVAILABLE",
      reasonCode: "source_type_not_present_in_deposited_geometry",
      biologicalAbsenceClaim: false,
    };
  });

  const landmarkNodeIds = {
    rootNodeIds: [root.nodeId],
    bifurcationNodeIds,
    terminalNodeIds,
  };
  const landmarkReceiptSha256 = sha256(Buffer.from(JSON.stringify(stableValue(landmarkNodeIds)), "utf8"));
  return {
    nodeCount: byId.size,
    segmentCount: allSegments.length,
    neuriteSegmentCount: neuriteSegments.length,
    rootNodeId: root.nodeId,
    rootLandmark: {
      nodeId: root.nodeId,
      sourceType: 1,
      coordinateMicrometre: root.position,
      radiusMicrometre: root.radius,
      semanticStatus: "standardized_soma_sample_not_contour",
    },
    landmarks: {
      ...landmarkNodeIds,
      landmarkReceiptSha256,
      receiptAlgorithm: "sha256_of_canonical_JSON_for_exact_root_bifurcation_and_terminal_node_ID_arrays",
    },
    neuriteSummary: {
      stemCount: stems.length,
      terminalNodeCount: terminalNodeIds.length,
      bifurcationNodeCount: bifurcationNodeIds.length,
      maximumCentrifugalBranchOrder: Math.max(...branchOrder.values()),
      maximumRootPathLengthMicrometre: Math.max(
        ...[...byId.values()].filter((node) => node.sourceType !== 1).map((node) => rootPathLength.get(node.nodeId)),
      ),
      maximumRootEuclideanDistanceMicrometre,
      cableLengthMicrometre: neuriteSegments.reduce((sum, segment) => sum + segment.length, 0),
      zeroLengthSegmentCount: neuriteSegments.filter((segment) => segment.length === 0).length,
      shollProfile: globalShollProfile,
    },
    sourceTypeDomains,
    canonicalNeuriteTypeAvailability,
  };
}

function almostEqual(left, right, epsilon = 1e-9) {
  return Number.isFinite(left) && Number.isFinite(right) &&
    Math.abs(left - right) <= epsilon * Math.max(1, Math.abs(left), Math.abs(right));
}

function compareWithExistingAnalysis(topology, analysisRecord, neuronId) {
  check(analysisRecord?.neuronId === neuronId, `NMO ${neuronId} is missing its existing analysis record`);
  const expected = analysisRecord.metrics;
  const actual = topology.neuriteSummary;
  for (const key of ["stemCount", "terminalNodeCount", "bifurcationNodeCount", "maximumCentrifugalBranchOrder"]) {
    check(actual[key] === expected[key], `NMO ${neuronId} ${key} diverges from the pinned topology analysis`);
  }
  for (const [actualKey, expectedKey] of [
    ["maximumRootPathLengthMicrometre", "maximumRootPathLengthMicrometre"],
    ["maximumRootEuclideanDistanceMicrometre", "maximumRootEuclideanDistanceMicrometre"],
    ["cableLengthMicrometre", "neuriteCableLengthMicrometre"],
  ]) {
    check(almostEqual(actual[actualKey], expected[expectedKey]), `NMO ${neuronId} ${actualKey} diverges from the pinned topology analysis`);
  }
  check(same(actual.shollProfile, expected.shollProfile), `NMO ${neuronId} Sholl profile diverges from the pinned half-open analysis`);
  const actualByType = topology.sourceTypeDomains.filter((domain) => domain.sourceType !== 1);
  check(actualByType.length === expected.bySourceType.length, `NMO ${neuronId} source-type domain count diverges from existing analysis`);
  for (const expectedDomain of expected.bySourceType) {
    const actualDomain = actualByType.find((domain) => domain.sourceType === expectedDomain.sourceType);
    check(actualDomain, `NMO ${neuronId} source type ${expectedDomain.sourceType} is missing`);
    check(actualDomain.segmentCount === expectedDomain.segmentCount, `NMO ${neuronId} source type ${expectedDomain.sourceType} segment count drifted`);
    check(actualDomain.terminalNodeCount === expectedDomain.terminalNodeCount, `NMO ${neuronId} source type ${expectedDomain.sourceType} terminal count drifted`);
    check(almostEqual(actualDomain.cableLengthMicrometre, expectedDomain.cableLengthMicrometre), `NMO ${neuronId} source type ${expectedDomain.sourceType} cable length drifted`);
  }
}

function validateGeometryDocument(geometry, record, geometryLabel) {
  check(geometry?.documentType === "neuromorpho_geometry", `${geometryLabel} has the wrong document type`);
  check(geometry.schemaVersion === "1.0.0", `${geometryLabel} has the wrong schema version`);
  check(geometry.neuronId === record.neuronId && geometry.assetId === record.assetId, `${geometryLabel} identity drifted`);
  check(geometry.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL", `${geometryLabel} is not source-local standardized geometry`);
  check(geometry.sourceFrame === "NeuroMorpho_CNG_standardized_local_frame", `${geometryLabel} source frame drifted`);
  check(geometry.units === "micrometre_reported_by_source", `${geometryLabel} units drifted`);
  check(geometry.registration?.registrationCount === 0 && geometry.registration?.status === "unregistered", `${geometryLabel} gained registration`);
  check(same(geometry.nodeColumns, NODE_COLUMNS), `${geometryLabel} node columns drifted`);
  check(geometry.qc?.status === "passed" && geometry.qc?.connected === true && geometry.qc?.acyclic === true, `${geometryLabel} source QC is not passed`);
  check(Array.isArray(geometry.nodes), `${geometryLabel} nodes are unavailable`);
  check(geometry.nodes.length === record.morphometrics?.computed?.nodeCount, `${geometryLabel} record node count drifted`);
  check(geometry.nodes.length === geometry.swc?.nodeCount, `${geometryLabel} SWC node count drifted`);
  check(geometry.nodes.length - 1 === record.morphometrics?.computed?.segmentCount, `${geometryLabel} record segment count drifted`);
  check(geometry.nodes.length - 1 === geometry.morphometrics?.computedFromStandardizedSwc?.segmentCount, `${geometryLabel} geometry segment count drifted`);
  check(geometry.swc?.sha256 === record.geometry?.rawSwcSha256, `${geometryLabel} raw SWC receipt drifted`);
}

function censusMembership() {
  return {
    collection: "frozen_census",
    frozenCensusContribution: 1,
    supplementaryContribution: 0,
    frozenCensusMembership: true,
    combinedCensusClaim: false,
  };
}

function supplementaryMembership(record) {
  const membership = record.comparisonMembership;
  check(membership?.collection === "supplementary", `NMO ${record.neuronId} supplementary collection drifted`);
  check(membership.censusContribution === 0 && membership.supplementaryContribution === 1, `NMO ${record.neuronId} supplementary membership arithmetic drifted`);
  return {
    collection: "supplementary",
    frozenCensusContribution: 0,
    supplementaryContribution: 1,
    frozenCensusMembership: false,
    combinedCensusClaim: false,
    routeId: membership.routeId,
    routeContractPath: membership.routeContractPath,
    routeContractSha256: membership.routeContractSha256,
    routeAssetManifestPath: membership.routeAssetManifestPath,
    routeAssetManifestSha256: membership.routeAssetManifestSha256,
  };
}

function geometryPaths(record, collection) {
  if (collection === "frozen_census") {
    const assetRoot = path.posix.dirname(CENSUS_INDEX_REPOSITORY_PATH);
    const geometryRepositoryPath = path.posix.join(assetRoot, record.geometry.path);
    return {
      assetRoot,
      geometryRepositoryPath,
      geometryFetchPath: publicFetchPath(geometryRepositoryPath),
    };
  }
  const geometryRepositoryPath = publicRepositoryPath(record.geometry.path);
  const marker = "/geometry/";
  const markerIndex = geometryRepositoryPath.indexOf(marker);
  check(markerIndex > 0, `NMO ${record.neuronId} supplementary geometry is outside a route-pack geometry directory`);
  return {
    assetRoot: geometryRepositoryPath.slice(0, markerIndex),
    geometryRepositoryPath,
    geometryFetchPath: record.geometry.path,
  };
}

async function buildRecord(projectRoot, record, collection, geometryDeclaration, analysisRecord) {
  check(record.geometry?.available === true, `NMO ${record.neuronId} geometry is unavailable`);
  const paths = geometryPaths(record, collection);
  const geometryInput = await jsonInput(projectRoot, paths.geometryRepositoryPath);
  check(geometryInput.receipt.bytes === record.geometry.bytes, `NMO ${record.neuronId} geometry byte receipt drifted`);
  check(geometryInput.receipt.sha256 === record.geometry.sha256, `NMO ${record.neuronId} geometry SHA-256 receipt drifted`);
  if (collection === "frozen_census") {
    check(geometryDeclaration?.kind === "lazy_geometry", `NMO ${record.neuronId} is absent from the frozen geometry manifest`);
    check(geometryDeclaration.neuronId === record.neuronId, `NMO ${record.neuronId} geometry manifest membership drifted`);
    check(geometryDeclaration.bytes === record.geometry.bytes && geometryDeclaration.sha256 === record.geometry.sha256, `NMO ${record.neuronId} census geometry declarations disagree`);
  }
  const geometry = geometryInput.value;
  validateGeometryDocument(geometry, record, `NMO ${record.neuronId} geometry`);
  const rawSwcRepositoryPath = path.posix.join(paths.assetRoot, geometry.swc.path);
  const rawSwcReceipt = await fileReceipt(projectRoot, rawSwcRepositoryPath);
  check(rawSwcReceipt.bytes === geometry.swc.bytes, `NMO ${record.neuronId} raw SWC byte receipt drifted`);
  check(rawSwcReceipt.sha256 === record.geometry.rawSwcSha256, `NMO ${record.neuronId} raw SWC SHA-256 receipt drifted`);
  const topology = computeMorphologyTopologyDetail(geometry.nodes, { expectedNeuronId: record.neuronId });
  check(topology.nodeCount === record.morphometrics.computed.nodeCount, `NMO ${record.neuronId} topology node count drifted`);
  check(topology.segmentCount === record.morphometrics.computed.segmentCount, `NMO ${record.neuronId} topology segment count drifted`);
  check(topology.rootNodeId === geometry.swc.rootNodeId, `NMO ${record.neuronId} topology root drifted`);
  compareWithExistingAnalysis(topology, analysisRecord, record.neuronId);

  return {
    neuronId: record.neuronId,
    assetId: record.assetId,
    membership: collection === "frozen_census" ? censusMembership() : supplementaryMembership(record),
    sourceDisclosure: {
      name: record.normalizedMetadata.name,
      dimensionality: record.normalizedMetadata.dimensionality,
      domainVerbatim: record.normalizedMetadata.domain,
      physicalIntegrityVerbatim: record.normalizedMetadata.physicalIntegrity,
    },
    geometryReceipt: {
      path: paths.geometryRepositoryPath,
      fetchPath: paths.geometryFetchPath,
      bytes: geometryInput.receipt.bytes,
      sha256: geometryInput.receipt.sha256,
      rawSwcPath: rawSwcRepositoryPath,
      rawSwcFetchPath: publicFetchPath(rawSwcRepositoryPath),
      rawSwcBytes: rawSwcReceipt.bytes,
      rawSwcSha256: rawSwcReceipt.sha256,
      sourceAssetSetId: record.geometry.sourceAssetSetId ?? EXPECTED_CENSUS_ASSET_SET_ID,
      geometryStatus: geometry.geometryStatus,
      sourceFrame: geometry.sourceFrame,
      units: geometry.units,
      registrationCount: 0,
    },
    topology,
  };
}

function sourceTypeSemantics() {
  return [
    { sourceType: 1, interpretation: "soma_type_1", semanticStatus: "standardized_soma_samples_not_contour" },
    { sourceType: 2, interpretation: "axon_type_2", semanticStatus: "standardized_swc_source_type" },
    { sourceType: 3, interpretation: "dendrite_type_3", semanticStatus: "standardized_swc_source_type" },
    { sourceType: 4, interpretation: "apical_dendrite_type_4", semanticStatus: "standardized_swc_source_type" },
    { sourceType: 6, interpretation: "uninterpreted_neurite_type_6", semanticStatus: "source_defined_uninterpreted" },
    { sourceType: null, interpretation: "other_source_type", semanticStatus: "source_defined_or_uninterpreted_unless_formally_defined" },
  ];
}

function topologySummary(records) {
  const recordHasType = (record, sourceType) => record.topology.sourceTypeDomains.some((domain) => domain.sourceType === sourceType);
  return {
    frozenCensusRecordCount: EXPECTED_CENSUS_COUNT,
    supplementaryRecordCount: EXPECTED_SUPPLEMENTARY_IDS.length,
    viewableSourceObjectCount: records.length,
    combinedCensusClaim: false,
    verifiedGeometryCount: records.length,
    sourceType1RecordCount: records.filter((record) => recordHasType(record, 1)).length,
    sourceType2RecordCount: records.filter((record) => recordHasType(record, 2)).length,
    sourceType3RecordCount: records.filter((record) => recordHasType(record, 3)).length,
    sourceType4RecordCount: records.filter((record) => recordHasType(record, 4)).length,
    otherSourceTypeRecordCount: records.filter((record) => record.topology.sourceTypeDomains.some((domain) => ![1, 2, 3, 4].includes(domain.sourceType))).length,
    landmarkReceiptCount: records.filter((record) => /^[0-9a-f]{64}$/.test(record.topology.landmarks.landmarkReceiptSha256)).length,
    totalNodeCount: records.reduce((sum, record) => sum + record.topology.nodeCount, 0),
    totalSegmentCount: records.reduce((sum, record) => sum + record.topology.segmentCount, 0),
    totalNeuriteSegmentCount: records.reduce((sum, record) => sum + record.topology.neuriteSegmentCount, 0),
    totalTerminalLandmarkCount: records.reduce((sum, record) => sum + record.topology.landmarks.terminalNodeIds.length, 0),
    totalBifurcationLandmarkCount: records.reduce((sum, record) => sum + record.topology.landmarks.bifurcationNodeIds.length, 0),
    shollStepMicrometre: SHOLL_STEP_MICROMETRE,
    registrationCount: 0,
    membraneModelCount: 0,
    internalStructureModelCount: 0,
  };
}

export async function buildMorphologyTopologyDetailArtifacts({ projectRoot = PROJECT_ROOT } = {}) {
  const [censusInput, censusManifestInput, supplementaryInput, frozenAnalysisInput, supplementaryAnalysisInput] = await Promise.all([
    jsonInput(projectRoot, CENSUS_INDEX_REPOSITORY_PATH),
    jsonInput(projectRoot, CENSUS_MANIFEST_REPOSITORY_PATH),
    jsonInput(projectRoot, SUPPLEMENTARY_ADAPTER_REPOSITORY_PATH),
    jsonInput(projectRoot, FROZEN_ANALYSIS_REPOSITORY_PATH),
    jsonInput(projectRoot, SUPPLEMENTARY_ANALYSIS_REPOSITORY_PATH),
  ]);
  const [analysisAlgorithmReceipt, builderReceipt, schemaReceipt] = await Promise.all([
    fileReceipt(projectRoot, ANALYSIS_ALGORITHM_REPOSITORY_PATH),
    fileReceipt(projectRoot, BUILDER_REPOSITORY_PATH),
    fileReceipt(projectRoot, SCHEMA_REPOSITORY_PATH),
  ]);
  check(censusInput.receipt.sha256 === EXPECTED_CENSUS_INDEX_SHA256, "Frozen census index SHA-256 drifted");
  check(censusManifestInput.receipt.sha256 === EXPECTED_CENSUS_MANIFEST_SHA256, "Frozen census asset manifest SHA-256 drifted");
  check(analysisAlgorithmReceipt.sha256 === EXPECTED_ANALYSIS_ALGORITHM_SHA256, "Pinned topology-analysis algorithm SHA-256 drifted");

  const census = censusInput.value;
  const censusManifest = censusManifestInput.value;
  const supplementary = supplementaryInput.value;
  const frozenAnalysis = frozenAnalysisInput.value;
  const supplementaryAnalysis = supplementaryAnalysisInput.value;
  check(census.assetSetId === EXPECTED_CENSUS_ASSET_SET_ID && census.release === RELEASE, "Frozen census identity drifted");
  check(census.summary?.queryRecordCount === EXPECTED_CENSUS_COUNT && census.records?.length === EXPECTED_CENSUS_COUNT, "Frozen census denominator drifted");
  check(censusManifest.assetSetId === EXPECTED_CENSUS_ASSET_SET_ID && censusManifest.admittedGeometryCount === EXPECTED_CENSUS_COUNT, "Frozen census manifest identity drifted");
  check(censusManifest.quarantinedGeometryCount === 0, "Frozen census gained quarantined geometry");
  check(supplementary.adapterId === "supplementary-morphology-comparison-adapter-0.1", "Supplementary adapter identity drifted");
  check(supplementary.records?.length === EXPECTED_SUPPLEMENTARY_IDS.length, "Supplementary record denominator drifted");
  check(same(supplementary.records.map((record) => record.neuronId), EXPECTED_SUPPLEMENTARY_IDS), "Supplementary neuron membership drifted");
  check(supplementary.summary?.frozenCensusRecordCount === EXPECTED_CENSUS_COUNT && supplementary.summary?.viewableSourceObjectCount === 149, "142 + 7 source-object boundary drifted");
  check(supplementary.summary?.combinedCensusClaim === false, "Supplementary adapter became a combined census claim");

  const censusRecords = [...census.records].sort((left, right) => left.neuronId - right.neuronId);
  const supplementaryRecords = [...supplementary.records].sort((left, right) => left.neuronId - right.neuronId);
  const censusIds = censusRecords.map((record) => record.neuronId);
  check(new Set(censusIds).size === EXPECTED_CENSUS_COUNT, "Frozen census has duplicate neuron IDs");
  check(!EXPECTED_SUPPLEMENTARY_IDS.some((neuronId) => censusIds.includes(neuronId)), "Supplementary neuron entered the frozen census");
  const allIds = [...censusIds, ...EXPECTED_SUPPLEMENTARY_IDS];
  check(new Set(allIds).size === 149, "149-record topology membership is duplicated or padded");

  const geometryDeclarations = new Map(
    censusManifest.files
      .filter((entry) => entry.kind === "lazy_geometry")
      .map((entry) => [entry.path, entry]),
  );
  check(geometryDeclarations.size === EXPECTED_CENSUS_COUNT, "Frozen geometry manifest membership count drifted");
  const frozenAnalysisById = new Map(frozenAnalysis.records.map((record) => [record.neuronId, record]));
  const supplementaryAnalysisById = new Map(supplementaryAnalysis.records.map((record) => [record.neuronId, record]));
  check(frozenAnalysisById.size === EXPECTED_CENSUS_COUNT, "Frozen analysis denominator drifted");
  check(supplementaryAnalysisById.size === EXPECTED_SUPPLEMENTARY_IDS.length, "Supplementary analysis denominator drifted");

  const records = [];
  for (const record of censusRecords) {
    records.push(await buildRecord(
      projectRoot,
      record,
      "frozen_census",
      geometryDeclarations.get(record.geometry.path),
      frozenAnalysisById.get(record.neuronId),
    ));
  }
  for (const record of supplementaryRecords) {
    records.push(await buildRecord(
      projectRoot,
      record,
      "supplementary",
      null,
      supplementaryAnalysisById.get(record.neuronId),
    ));
  }
  records.sort((left, right) => left.neuronId - right.neuronId);
  check(records.length === 149 && new Set(records.map((record) => record.neuronId)).size === 149, "Runtime topology record membership drifted");
  const summary = topologySummary(records);
  check(summary.sourceType1RecordCount === 149, "Every admitted geometry must retain standardized type-1 soma samples");
  check(summary.landmarkReceiptCount === 149, "Every admitted geometry must have one stable landmark receipt");

  const sourceInputs = {
    frozenCensusIndex: censusInput.receipt,
    frozenCensusAssetManifest: censusManifestInput.receipt,
    supplementaryAdapter: supplementaryInput.receipt,
    frozenAnalysisIndex: frozenAnalysisInput.receipt,
    supplementaryAnalysisDelta: supplementaryAnalysisInput.receipt,
    analysisAlgorithm: analysisAlgorithmReceipt,
  };
  const runtimeIndex = {
    documentType: "morphology_topology_detail_index",
    schemaVersion: "0.1.0",
    assetSetId: "ohri:morphology-topology-detail-v1",
    releaseId: "ohri-morphology-topology-detail-0.1.0",
    releasedAt: RELEASED_AT,
    upgradeId: "UPG-150",
    sourceInputs,
    analysisPolicy: ANALYSIS_POLICY,
    sourceTypeSemantics: sourceTypeSemantics(),
    summary,
    scientificBoundary: SCIENTIFIC_BOUNDARY,
    records,
  };
  const runtimeBytes = canonicalJsonBytes(runtimeIndex);
  const contract = {
    documentType: "morphology_topology_detail_contract",
    schemaVersion: "0.1.0",
    contractId: "morphology-topology-detail-0.1",
    releaseId: "ohri-morphology-topology-detail-0.1.0",
    releasedAt: RELEASED_AT,
    upgradeId: "UPG-150",
    purpose: "Expose checksum-verified source topology, source-type domain metrics, Sholl profiles and exact landmark node identifiers for the 142 frozen census records plus seven explicitly supplementary source objects, without inventing biological structures or expanding the census.",
    sourceInputs: {
      ...sourceInputs,
      builder: builderReceipt,
      schema: schemaReceipt,
    },
    runtimeAsset: {
      path: RUNTIME_REPOSITORY_PATH,
      fetchPath: RUNTIME_FETCH_PATH,
      bytes: runtimeBytes.byteLength,
      sha256: sha256(runtimeBytes),
      recordCount: records.length,
    },
    analysisPolicy: ANALYSIS_POLICY,
    sourceTypeSemantics: sourceTypeSemantics(),
    summary,
    scientificBoundary: SCIENTIFIC_BOUNDARY,
  };
  contract.contractContentSha256 = canonicalContentSha256(contract);
  return {
    contract,
    runtimeIndex,
    contractBytes: canonicalJsonBytes(contract),
    runtimeBytes,
  };
}

export async function writeMorphologyTopologyDetailArtifacts({ projectRoot = PROJECT_ROOT } = {}) {
  const artifacts = await buildMorphologyTopologyDetailArtifacts({ projectRoot });
  const contractPath = repositoryPath(projectRoot, CONTRACT_REPOSITORY_PATH);
  const runtimePath = repositoryPath(projectRoot, RUNTIME_REPOSITORY_PATH);
  await mkdir(path.dirname(runtimePath), { recursive: true });
  await Promise.all([
    writeFile(contractPath, artifacts.contractBytes),
    writeFile(runtimePath, artifacts.runtimeBytes),
  ]);
  return artifacts;
}

async function checkCurrentArtifacts({ projectRoot = PROJECT_ROOT } = {}) {
  const artifacts = await buildMorphologyTopologyDetailArtifacts({ projectRoot });
  const [actualContract, actualRuntime] = await Promise.all([
    readFile(repositoryPath(projectRoot, CONTRACT_REPOSITORY_PATH)),
    readFile(repositoryPath(projectRoot, RUNTIME_REPOSITORY_PATH)),
  ]);
  check(actualContract.equals(artifacts.contractBytes), `${CONTRACT_REPOSITORY_PATH} is not the deterministic builder output`);
  check(actualRuntime.equals(artifacts.runtimeBytes), `${RUNTIME_REPOSITORY_PATH} is not the deterministic builder output`);
  return artifacts;
}

async function main() {
  const options = new Set(process.argv.slice(2));
  check(options.size === 1 && (options.has("--write") || options.has("--check")), "Usage: node tools/build_morphology_topology_detail.mjs (--write|--check)");
  const artifacts = options.has("--write")
    ? await writeMorphologyTopologyDetailArtifacts()
    : await checkCurrentArtifacts();
  const { summary } = artifacts.contract;
  console.log(
    `morphology topology detail ${options.has("--write") ? "wrote" : "verified"}: ` +
    `${summary.frozenCensusRecordCount} + ${summary.supplementaryRecordCount} records, ` +
    `${summary.totalNodeCount} nodes, ${summary.totalTerminalLandmarkCount} terminals, ` +
    `${summary.totalBifurcationLandmarkCount} bifurcations`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
