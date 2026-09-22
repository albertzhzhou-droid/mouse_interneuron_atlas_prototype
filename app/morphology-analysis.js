const SOURCE_TYPE_INTERPRETATIONS = Object.freeze({
  0: "uninterpreted_undefined_type_0",
  1: "soma_type_1",
  2: "axon_type_2",
  3: "dendrite_type_3",
  4: "apical_dendrite_type_4",
  5: "uninterpreted_custom_type_5",
  6: "uninterpreted_neurite_type_6",
  7: "glia_process_type_7",
});

const METRIC_KEYS = Object.freeze([
  "stemCount",
  "terminalNodeCount",
  "bifurcationNodeCount",
  "maximumCentrifugalBranchOrder",
  "maximumRootPathLengthMicrometre",
  "maximumRootEuclideanDistanceMicrometre",
  "neuriteCableLengthMicrometre",
]);

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function distance(left, right) {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}

function interpretationForSourceType(sourceType) {
  return SOURCE_TYPE_INTERPRETATIONS[sourceType] ?? `uninterpreted_unknown_type_${sourceType}`;
}

function segmentSphereIntersectionCount(start, end, radius) {
  const direction = end.map((value, index) => value - start[index]);
  const a = direction.reduce((sum, value) => sum + value * value, 0);
  if (a === 0) return 0;
  const b = 2 * start.reduce((sum, value, index) => sum + value * direction[index], 0);
  const c = start.reduce((sum, value) => sum + value * value, 0) - radius * radius;
  const discriminant = b * b - 4 * a * c;
  const scale = Math.max(1, Math.abs(b * b), Math.abs(4 * a * c));
  const epsilon = Number.EPSILON * scale * 32;
  if (discriminant < -epsilon) return 0;
  const root = Math.sqrt(Math.max(0, discriminant));
  const candidates = root <= Math.sqrt(epsilon)
    ? [-b / (2 * a)]
    : [(-b - root) / (2 * a), (-b + root) / (2 * a)];
  const parameterEpsilon = 1e-12;
  return candidates.filter((value, index) =>
    value > parameterEpsilon && value <= 1 + parameterEpsilon &&
    candidates.findIndex((candidate) => Math.abs(candidate - value) <= parameterEpsilon) === index,
  ).length;
}

/**
 * Recomputes the v1 source-local morphology phenotype from one admitted SWC
 * node table. This is deliberately independent of the Python asset builder.
 */
export function computeMorphologyPhenotype(nodes, { shollStepMicrometre = 10 } = {}) {
  assert(Array.isArray(nodes) && nodes.length > 1, "Morphology analysis requires a non-empty SWC node table");
  assert(Number.isFinite(shollStepMicrometre) && shollStepMicrometre > 0, "Sholl step must be positive");

  const byId = new Map();
  for (const row of nodes) {
    assert(Array.isArray(row) && row.length === 7, "Morphology analysis requires seven-column SWC nodes");
    const [nodeId, sourceType, x, y, z, radius, parentId] = row;
    assert(
      Number.isInteger(nodeId) && nodeId > 0 && Number.isInteger(sourceType) && sourceType >= 0 &&
      [x, y, z, radius].every(Number.isFinite) && radius > 0 && Number.isInteger(parentId) &&
      (parentId === -1 || parentId > 0),
      `Morphology analysis node ${nodeId} is invalid`,
    );
    assert(!byId.has(nodeId), `Morphology analysis duplicate node ${nodeId}`);
    byId.set(nodeId, { nodeId, sourceType, position: [x, y, z], radius, parentId, children: [] });
  }
  const roots = [...byId.values()].filter((node) => node.parentId === -1);
  assert(roots.length === 1, "Morphology analysis requires exactly one root");
  const root = roots[0];
  assert(root.sourceType === 1, "Morphology analysis root must retain source type 1");
  for (const node of byId.values()) {
    if (node.parentId === -1) continue;
    const parent = byId.get(node.parentId);
    assert(parent && parent !== node, `Morphology analysis node ${node.nodeId} has an invalid parent`);
    parent.children.push(node.nodeId);
  }

  const traversal = [];
  const active = new Set();
  const visited = new Set();
  const traversalStack = [{ nodeId: root.nodeId, nextChildIndex: 0, entered: false }];
  while (traversalStack.length > 0) {
    const frame = traversalStack.at(-1);
    const node = byId.get(frame.nodeId);
    if (!frame.entered) {
      assert(!active.has(frame.nodeId), `Morphology analysis topology contains a cycle at ${frame.nodeId}`);
      if (visited.has(frame.nodeId)) {
        traversalStack.pop();
        continue;
      }
      active.add(frame.nodeId);
      traversal.push(frame.nodeId);
      frame.entered = true;
    }
    if (frame.nextChildIndex < node.children.length) {
      const childId = node.children[frame.nextChildIndex];
      frame.nextChildIndex += 1;
      assert(!active.has(childId), `Morphology analysis topology contains a cycle at ${childId}`);
      if (!visited.has(childId)) {
        traversalStack.push({ nodeId: childId, nextChildIndex: 0, entered: false });
      }
      continue;
    }
    active.delete(frame.nodeId);
    visited.add(frame.nodeId);
    traversalStack.pop();
  }
  assert(visited.size === byId.size, "Morphology analysis topology is disconnected");

  const rootPathLength = new Map([[root.nodeId, 0]]);
  const branchOrder = new Map();
  const neuriteChildCount = new Map();
  for (const node of byId.values()) {
    neuriteChildCount.set(
      node.nodeId,
      node.children.filter((childId) => byId.get(childId).sourceType !== 1).length,
    );
  }

  let stemCount = 0;
  let terminalNodeCount = 0;
  let bifurcationNodeCount = 0;
  let maximumCentrifugalBranchOrder = 0;
  let maximumRootPathLengthMicrometre = 0;
  let maximumRootEuclideanDistanceMicrometre = 0;
  let neuriteCableLengthMicrometre = 0;
  const neuriteSegments = [];
  const bySourceType = new Map();

  for (const nodeId of traversal) {
    const node = byId.get(nodeId);
    if (node.parentId === -1) continue;
    const parent = byId.get(node.parentId);
    const edgeLength = distance(parent.position, node.position);
    const pathLength = rootPathLength.get(parent.nodeId) + (node.sourceType === 1 ? 0 : edgeLength);
    rootPathLength.set(nodeId, pathLength);
    if (node.sourceType === 1) continue;
    maximumRootPathLengthMicrometre = Math.max(maximumRootPathLengthMicrometre, pathLength);

    const isStem = parent.sourceType === 1;
    const order = isStem
      ? 0
      : (branchOrder.get(parent.nodeId) ?? 0) + (neuriteChildCount.get(parent.nodeId) >= 2 ? 1 : 0);
    branchOrder.set(nodeId, order);
    maximumCentrifugalBranchOrder = Math.max(maximumCentrifugalBranchOrder, order);
    if (isStem) stemCount += 1;
    if (neuriteChildCount.get(nodeId) === 0) terminalNodeCount += 1;
    if (neuriteChildCount.get(nodeId) >= 2) bifurcationNodeCount += 1;
    neuriteCableLengthMicrometre += edgeLength;
    maximumRootEuclideanDistanceMicrometre = Math.max(
      maximumRootEuclideanDistanceMicrometre,
      distance(root.position, node.position),
    );
    neuriteSegments.push({
      sourceType: node.sourceType,
      start: parent.position.map((value, index) => value - root.position[index]),
      end: node.position.map((value, index) => value - root.position[index]),
      length: edgeLength,
    });
    const sourceTypeSummary = bySourceType.get(node.sourceType) ?? {
      sourceType: node.sourceType,
      interpretation: interpretationForSourceType(node.sourceType),
      segmentCount: 0,
      terminalNodeCount: 0,
      cableLengthMicrometre: 0,
    };
    sourceTypeSummary.segmentCount += 1;
    sourceTypeSummary.cableLengthMicrometre += edgeLength;
    if (neuriteChildCount.get(nodeId) === 0) sourceTypeSummary.terminalNodeCount += 1;
    bySourceType.set(node.sourceType, sourceTypeSummary);
  }

  const shollProfile = [];
  const shellCount = Math.floor(maximumRootEuclideanDistanceMicrometre / shollStepMicrometre + 1e-12);
  for (let shellIndex = 1; shellIndex <= shellCount; shellIndex += 1) {
    const radiusMicrometre = shellIndex * shollStepMicrometre;
    shollProfile.push({
      radiusMicrometre,
      intersectionCount: neuriteSegments.reduce(
        (sum, segment) => sum + segmentSphereIntersectionCount(segment.start, segment.end, radiusMicrometre),
        0,
      ),
    });
  }

  return {
    stemCount,
    terminalNodeCount,
    bifurcationNodeCount,
    maximumCentrifugalBranchOrder,
    maximumRootPathLengthMicrometre,
    maximumRootEuclideanDistanceMicrometre,
    neuriteCableLengthMicrometre,
    bySourceType: [...bySourceType.values()].sort((left, right) => left.sourceType - right.sourceType),
    shollProfile,
  };
}

export function type7Quantile(values, probability) {
  assert(Array.isArray(values) && values.length > 0 && values.every(Number.isFinite), "Quantile values are invalid");
  assert(Number.isFinite(probability) && probability >= 0 && probability <= 1, "Quantile probability is invalid");
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const fraction = position - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}

export function summarizeMetric(values) {
  assert(Array.isArray(values) && values.length > 0 && values.every(Number.isFinite), "Metric summary values are invalid");
  const sorted = [...values].sort((left, right) => left - right);
  return {
    n: sorted.length,
    min: sorted[0],
    q1: type7Quantile(sorted, 0.25),
    median: type7Quantile(sorted, 0.5),
    q3: type7Quantile(sorted, 0.75),
    max: sorted.at(-1),
  };
}

function almostEqual(left, right, epsilon = 1e-9) {
  return Number.isFinite(left) && Number.isFinite(right) &&
    Math.abs(left - right) <= epsilon * Math.max(1, Math.abs(left), Math.abs(right));
}

function validateMetricSummary(summary, expectedN, label) {
  assert(isRecord(summary) && summary.n === expectedN, `${label} n changed`);
  const values = [summary.min, summary.q1, summary.median, summary.q3, summary.max];
  assert(values.every(Number.isFinite), `${label} values are invalid`);
  assert(values.every((value, index) => index === 0 || value >= values[index - 1]), `${label} order is invalid`);
}

export function validateMorphologyAnalysisManifest(value, indexBytes) {
  assert(isRecord(value), "Morphology-analysis manifest is missing");
  assert(
    value.documentType === "neuromorpho_morphology_analysis_asset_manifest" &&
    value.schemaVersion === "1.0.0" &&
    value.assetSetId === "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-morphology-analysis-v1" &&
    value.release === "8.6.124",
    "Morphology-analysis manifest identity changed",
  );
  assert(value.scientificBoundary?.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL", "Morphology-analysis geometry boundary changed");
  assert(value.scientificBoundary?.registrationCount === 0, "Morphology-analysis registration count changed");
  assert(Array.isArray(value.files) && value.files.length === 1, "Morphology-analysis manifest file set changed");
  const record = value.files[0];
  assert(
    record.path === "analysis-index.json" && record.kind === "morphology_analysis_index" &&
    SHA256_PATTERN.test(record.sha256) && record.bytes === indexBytes,
    "Morphology-analysis index declaration changed",
  );
  return value;
}

export function validateMorphologyAnalysisPayload(value, census) {
  assert(isRecord(value), "Morphology-analysis payload is missing");
  assert(
    value.documentType === "neuromorpho_morphology_analysis_index" &&
    value.schemaVersion === "1.0.0" &&
    value.assetSetId === "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-morphology-analysis-v1" &&
    value.release === "8.6.124",
    "Morphology-analysis payload identity changed",
  );
  assert(value.source?.censusIndex?.sha256 === "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364", "Morphology-analysis source census changed");
  assert(value.source?.assetManifest?.sha256 === "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91", "Morphology-analysis source manifest changed");
  assert(value.analysisPolicy?.shollPolicy?.radiusStepMicrometre === 10, "Morphology-analysis Sholl step changed");
  assert(value.analysisPolicy?.shollPolicy?.centre === "root_node_coordinate_not_soma_centroid", "Morphology-analysis Sholl centre changed");
  assert(
    value.analysisPolicy?.neuriteSegmentPolicy === "a_segment_is_neurite_when_its_child_node_source_type_is_not_1;_child_source_type_1_segments_are_excluded_from_all_neurite_metrics",
    "Morphology-analysis neurite policy changed",
  );
  assert(value.analysisPolicy?.quantilePolicy?.method === "Hyndman-Fan_type_7_linear_interpolation", "Morphology-analysis quantile method changed");
  assert(value.scientificBoundary?.registrationCount === 0, "Morphology-analysis registration changed");
  assert(value.summary?.recordCount === 142 && value.summary?.registrationCount === 0, "Morphology-analysis record boundary changed");
  assert(Array.isArray(value.records) && value.records.length === 142, "Morphology-analysis records changed");
  assert(Array.isArray(census?.records) && census.records.length === 142, "Morphology-analysis census contract is missing");
  const censusById = new Map(census.records.map((record) => [record.neuronId, record]));
  const seen = new Set();
  for (const record of value.records) {
    const source = censusById.get(record?.neuronId);
    assert(source && !seen.has(record.neuronId), `Morphology-analysis record ${record?.neuronId ?? "unknown"} is not unique in the census`);
    seen.add(record.neuronId);
    assert(record.name === source.normalizedMetadata.name, `Morphology-analysis record ${record.neuronId} name changed`);
    assert(record.sourceGeometry?.path === source.geometry.path && record.sourceGeometry?.sha256 === source.geometry.sha256, `Morphology-analysis record ${record.neuronId} geometry changed`);
    assert(record.dimensionality === source.normalizedMetadata.dimensionality, `Morphology-analysis record ${record.neuronId} dimensionality changed`);
    assert(record.denominatorBoundary?.analysisUnit === "NeuroMorpho_record", `Morphology-analysis record ${record.neuronId} unit changed`);
    assert(record.denominatorBoundary?.recordCountContribution === 1, `Morphology-analysis record ${record.neuronId} count contribution changed`);
    for (const field of ["independentAnimalCount", "independentDonorCount", "independentSpecimenCount", "prevalenceDenominator"]) {
      assert(record.denominatorBoundary?.[field]?.value === null, `Morphology-analysis record ${record.neuronId} invents ${field}`);
    }
    const metrics = record.metrics;
    assert(isRecord(metrics), `Morphology-analysis record ${record.neuronId} metrics are missing`);
    for (const metricKey of METRIC_KEYS) assert(Number.isFinite(metrics[metricKey]) && metrics[metricKey] >= 0, `Morphology-analysis record ${record.neuronId} ${metricKey} is invalid`);
    assert(Array.isArray(metrics.bySourceType) && metrics.bySourceType.every((entry) => Number.isInteger(entry.sourceType) && entry.sourceType !== 1), `Morphology-analysis record ${record.neuronId} source-type policy changed`);
    assert(Array.isArray(metrics.shollProfile) && metrics.shollProfile.every((entry, index) =>
      entry.radiusMicrometre === (index + 1) * 10 && Number.isInteger(entry.intersectionCount) && entry.intersectionCount >= 0,
    ), `Morphology-analysis record ${record.neuronId} Sholl profile changed`);
  }
  assert(Array.isArray(value.cohorts) && value.cohorts.length === value.summary.cohortCount, "Morphology-analysis cohorts changed");
  const assigned = [];
  for (const cohort of value.cohorts) {
    assert(typeof cohort.cohortId === "string" && cohort.cohortId.length > 0, "Morphology-analysis cohort ID is missing");
    assert(Array.isArray(cohort.neuronIds) && cohort.neuronIds.length > 0, `Morphology-analysis cohort ${cohort.cohortId} is empty`);
    assert(cohort.denominatorBoundary?.analysisUnit === "NeuroMorpho_record", `Morphology-analysis cohort ${cohort.cohortId} unit changed`);
    assert(cohort.denominatorBoundary?.n === cohort.neuronIds.length, `Morphology-analysis cohort ${cohort.cohortId} denominator changed`);
    assert(cohort.neuronIds.every((neuronId) => seen.has(neuronId)), `Morphology-analysis cohort ${cohort.cohortId} has an unknown record`);
    assigned.push(...cohort.neuronIds);
    for (const metricKey of METRIC_KEYS) validateMetricSummary(cohort.metricSummaries?.[metricKey], cohort.neuronIds.length, `${cohort.cohortId} ${metricKey}`);
    assert(Array.isArray(cohort.shollMedianProfile) && cohort.shollMedianProfile.every((entry, index) =>
      entry.radiusMicrometre === (index + 1) * 10 && Number.isInteger(entry.n) && entry.n > 0 &&
      Number.isFinite(entry.medianIntersectionCount) && entry.medianIntersectionCount >= 0,
    ), `Morphology-analysis cohort ${cohort.cohortId} Sholl profile changed`);
  }
  assert(assigned.length === 142 && new Set(assigned).size === 142, "Morphology-analysis cohort partition changed");
  return value;
}

export function compareMorphologyPhenotypes(actual, expected, label = "Morphology phenotype") {
  for (const metricKey of METRIC_KEYS) {
    assert(almostEqual(actual[metricKey], expected[metricKey]), `${label} ${metricKey} mismatch`);
  }
  assert(actual.bySourceType.length === expected.bySourceType.length, `${label} source-type summary length mismatch`);
  actual.bySourceType.forEach((row, index) => {
    const expectedRow = expected.bySourceType[index];
    assert(
      row.sourceType === expectedRow.sourceType &&
      row.interpretation === expectedRow.interpretation &&
      row.segmentCount === expectedRow.segmentCount &&
      row.terminalNodeCount === expectedRow.terminalNodeCount &&
      almostEqual(row.cableLengthMicrometre, expectedRow.cableLengthMicrometre),
      `${label} source-type summary mismatch`,
    );
  });
  assert(
    actual.shollProfile.length === expected.shollProfile.length &&
    actual.shollProfile.every((row, index) =>
      row.radiusMicrometre === expected.shollProfile[index].radiusMicrometre &&
      row.intersectionCount === expected.shollProfile[index].intersectionCount,
    ),
    `${label} Sholl profile mismatch`,
  );
}

export const MORPHOLOGY_ANALYSIS_METRIC_KEYS = METRIC_KEYS;
