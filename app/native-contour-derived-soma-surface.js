export const NATIVE_CONTOUR_DERIVED_SURFACE_ALGORITHM = "equal_arclength_128_sample_minimum_rms_cyclic_phase_open_quad_strip_v1";
export const NATIVE_CONTOUR_DERIVED_SURFACE_AUTHORITY = "DER_INTERPOLATED_SOURCE_CONTOUR_OPEN_SHELL";
export const NATIVE_CONTOUR_DERIVED_SURFACE_SAMPLE_COUNT = 128;
export const NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS = Object.freeze({
  maximumAdjacentCentroidShiftMicrometre: 1.5,
  maximumAdjacentContourAreaRatio: 1.6,
  maximumAdjacentAlignedRmsMicrometre: 1.5,
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function signedArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area * 0.5;
}

function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a, b, p, epsilon = 1e-9) {
  return Math.abs(orientation(a, b, p)) <= epsilon
    && p[0] >= Math.min(a[0], b[0]) - epsilon
    && p[0] <= Math.max(a[0], b[0]) + epsilon
    && p[1] >= Math.min(a[1], b[1]) - epsilon
    && p[1] <= Math.max(a[1], b[1]) + epsilon;
}

function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  if (((abC > 0 && abD < 0) || (abC < 0 && abD > 0))
    && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0))) return true;
  return onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}

function assertSimpleContour(points, contourId) {
  assert(points.length >= 3, `${contourId} has fewer than three vertices`);
  assert(Math.abs(signedArea(points)) > 1e-9, `${contourId} has degenerate planar area`);
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    assert(Math.hypot(points[index][0] - points[next][0], points[index][1] - points[next][1]) > 1e-9,
      `${contourId} has a zero-length adjacent edge`);
    for (let other = index + 1; other < points.length; other += 1) {
      const otherNext = (other + 1) % points.length;
      if (other === index || other === next || otherNext === index) continue;
      assert(!segmentsIntersect(points[index], points[next], points[other], points[otherNext]),
        `${contourId} has a self-intersection`);
    }
  }
}

function contourCentroid(points) {
  const area = signedArea(points);
  let x = 0;
  let y = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    x += (current[0] + next[0]) * cross;
    y += (current[1] + next[1]) * cross;
  }
  return [x / (6 * area), y / (6 * area)];
}

function normalizeWinding(points) {
  return signedArea(points) > 0 ? points : [...points].reverse();
}

function resampleClosedPolyline(points, sampleCount, z) {
  const edges = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    return { from: point, to: next, length: Math.hypot(next[0] - point[0], next[1] - point[1]) };
  });
  const perimeter = edges.reduce((sum, edge) => sum + edge.length, 0);
  assert(Number.isFinite(perimeter) && perimeter > 0, "Contour perimeter is invalid");
  const samples = [];
  let edgeIndex = 0;
  let edgeStart = 0;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const distance = perimeter * sampleIndex / sampleCount;
    while (edgeIndex < edges.length - 1 && distance >= edgeStart + edges[edgeIndex].length) {
      edgeStart += edges[edgeIndex].length;
      edgeIndex += 1;
    }
    const edge = edges[edgeIndex];
    const t = Math.min(1, Math.max(0, (distance - edgeStart) / edge.length));
    samples.push([
      edge.from[0] + (edge.to[0] - edge.from[0]) * t,
      edge.from[1] + (edge.to[1] - edge.from[1]) * t,
      z,
    ]);
  }
  return samples;
}

function cyclicAlignment(reference, candidate) {
  let bestShift = 0;
  let bestSquaredError = Infinity;
  for (let shift = 0; shift < candidate.length; shift += 1) {
    let squaredError = 0;
    for (let index = 0; index < candidate.length; index += 1) {
      const first = reference[index];
      const second = candidate[(index + shift) % candidate.length];
      squaredError += (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2;
    }
    if (squaredError < bestSquaredError) {
      bestSquaredError = squaredError;
      bestShift = shift;
    }
  }
  const aligned = candidate.map((_, index) => candidate[(index + bestShift) % candidate.length]);
  return { points: aligned, shift: bestShift, rms: Math.sqrt(bestSquaredError / candidate.length) };
}

function validateSurfaceEligibility(sourcePayload) {
  assert(sourcePayload?.assetId === "NeuroMorpho:50394", "Derived surface is restricted to exact NMO 50394");
  assert(sourcePayload.sourceFrame === "Neurolucida_DAT_source_native_unregistered" && sourcePayload.registrationStatus === "unregistered",
    "Derived surface must remain in the native unregistered DAT frame");
  assert(sourcePayload.source?.sha256 === "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109",
    "NMO 50394 original DAT checksum changed");
  assert(sourcePayload.summary?.pointPayloadSha256 === "b823d7ef36d28ec05836425c82ba5b9bd4edfd8fb1bf1b821eecce833abe8f4b",
    "NMO 50394 exact ordered contour point receipt changed");
  const contours = sourcePayload.contours;
  assert(Array.isArray(contours) && contours.length === 14, "Exactly 14 source-native Cell Body contours are required");
  for (const contour of contours) {
    assert(contour.sourceName === "Cell Body" && contour.sourceClosedFlag === false && contour.interpretedClosed === true,
      `${contour.id} must retain the raw false flag and source-evidenced Cell Body closure interpretation`);
    assert(contour.independentParserClassification === "somaContour" && contour.sourceProperties?.CellBody === true,
      `${contour.id} lacks the independent somaContour and CellBody presence gates`);
    assert(JSON.stringify(contour.sourcePropertyReceipts) === JSON.stringify([{ key: "CellBody", declaredValueCount: 0, values: [] }]),
      `${contour.id} lacks the exact empty-value CellBody property receipt`);
    assert(contour.points.length === contour.vertexCount && contour.points.every((point) => Array.isArray(point)
      && point.length === 4 && point.every(Number.isFinite)), `${contour.id} source point array is invalid`);
    assert(contour.zValuesMicrometre.length === 1 && contour.points.every((point) => point[2] === contour.zValuesMicrometre[0]),
      `${contour.id} must represent one exact calibrated z plane`);
    assertSimpleContour(contour.points, contour.id);
  }
  const sorted = [...contours].sort((left, right) => left.zValuesMicrometre[0] - right.zValuesMicrometre[0]);
  const zValues = sorted.map((contour) => contour.zValuesMicrometre[0]);
  assert(new Set(zValues).size === 14 && zValues.every((z, index) => index === 0 || z - zValues[index - 1] === 1),
    "NMO 50394 requires one unique contour on each contiguous 1 micrometre plane");
  return sorted;
}

export function buildNativeContourDerivedSomaSurface(sourcePayload, sourceReceipts) {
  assert(sourceReceipts?.nativeContourGeometry?.sha256 && sourceReceipts?.nativeContourGeometry?.path,
    "Exact source-native contour file receipt is required");
  const sortedContours = validateSurfaceEligibility(sourcePayload);
  const rings = [];
  let maximumAdjacentCentroidShiftMicrometre = 0;
  let maximumAdjacentContourAreaRatio = 1;
  let maximumAdjacentAlignedRmsMicrometre = 0;
  let previousSampled = null;
  let previousContour = null;
  for (const contour of sortedContours) {
    const sourceXY = contour.points.map(([x, y]) => [x, y]);
    const area = Math.abs(signedArea(sourceXY));
    const centroid = contourCentroid(sourceXY);
    const z = contour.zValuesMicrometre[0];
    const sampled = resampleClosedPolyline(normalizeWinding(sourceXY), NATIVE_CONTOUR_DERIVED_SURFACE_SAMPLE_COUNT, z);
    let aligned = sampled;
    let phaseShiftFromPreviousSample = 0;
    if (previousSampled) {
      const phase = cyclicAlignment(previousSampled, sampled);
      aligned = phase.points;
      phaseShiftFromPreviousSample = phase.shift;
      maximumAdjacentAlignedRmsMicrometre = Math.max(maximumAdjacentAlignedRmsMicrometre, phase.rms);
      const previousArea = Math.abs(signedArea(previousContour.points.map(([x, y]) => [x, y])));
      maximumAdjacentContourAreaRatio = Math.max(maximumAdjacentContourAreaRatio, area / previousArea, previousArea / area);
      const priorCentroid = contourCentroid(previousContour.points.map(([x, y]) => [x, y]));
      maximumAdjacentCentroidShiftMicrometre = Math.max(maximumAdjacentCentroidShiftMicrometre,
        Math.hypot(centroid[0] - priorCentroid[0], centroid[1] - priorCentroid[1]));
    }
    rings.push({
      contourId: contour.id,
      zMicrometre: z,
      sourceVertexCount: contour.vertexCount,
      sourceWinding: signedArea(sourceXY) > 0 ? "counterclockwise" : "clockwise",
      phaseShiftFromPreviousSample,
      pointsMicrometre: aligned,
    });
    previousSampled = aligned;
    previousContour = contour;
  }
  assert(maximumAdjacentCentroidShiftMicrometre <= NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS.maximumAdjacentCentroidShiftMicrometre,
    "Adjacent contour centroid displacement exceeds the pinned 1.5 micrometre gate");
  assert(maximumAdjacentContourAreaRatio <= NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS.maximumAdjacentContourAreaRatio,
    "Adjacent contour area ratio exceeds the pinned 1.6 gate");
  assert(maximumAdjacentAlignedRmsMicrometre <= NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS.maximumAdjacentAlignedRmsMicrometre,
    "Cyclic correspondence RMS exceeds the pinned 1.5 micrometre gate");

  const ringSize = NATIVE_CONTOUR_DERIVED_SURFACE_SAMPLE_COUNT;
  const triangleIndices = [];
  for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex += 1) {
    const lowerBase = ringIndex * ringSize;
    const upperBase = (ringIndex + 1) * ringSize;
    for (let sampleIndex = 0; sampleIndex < ringSize; sampleIndex += 1) {
      const next = (sampleIndex + 1) % ringSize;
      const lower = lowerBase + sampleIndex;
      const lowerNext = lowerBase + next;
      const upper = upperBase + sampleIndex;
      const upperNext = upperBase + next;
      triangleIndices.push(lower, lowerNext, upperNext, lower, upperNext, upper);
    }
  }
  const triangleCount = triangleIndices.length / 3;
  return {
    documentType: "source_contour_derived_display_open_shell",
    schemaVersion: "0.1.0",
    releaseId: "ohri-native-contour-derived-soma-surface-0.1.0",
    assetId: "NeuroMorpho:50394",
    authority: NATIVE_CONTOUR_DERIVED_SURFACE_AUTHORITY,
    sourceFrame: sourcePayload.sourceFrame,
    units: "micrometre_interpreted_from_Neurolucida_semantics",
    sourceReceipts: {
      originalDat: { bytes: sourcePayload.source.bytes, sha256: sourcePayload.source.sha256 },
      nativeContourGeometry: sourceReceipts.nativeContourGeometry,
      exactPointPayloadSha256: sourcePayload.summary.pointPayloadSha256,
      sourceContourCount: sortedContours.length,
      sourceVertexCount: sortedContours.reduce((sum, contour) => sum + contour.vertexCount, 0),
      sourceContourIdsAndZ: sortedContours.map((contour) => ({ contourId: contour.id, zMicrometre: contour.zValuesMicrometre[0], vertexCount: contour.vertexCount })),
    },
    method: {
      algorithmId: NATIVE_CONTOUR_DERIVED_SURFACE_ALGORITHM,
      version: "1.0.0",
      samplesPerObservedContour: ringSize,
      contourOrdering: "ascending_native_z",
      inPlaneResampling: "equal_arclength_on_exact_source_polyline",
      windingNormalization: "counterclockwise_for_mesh_construction_only_source_loops_unchanged",
      interPlaneCorrespondence: "minimum_rms_cyclic_phase_against_previous_ring_no_nonrigid_registration",
      triangulation: "fixed_two_triangle_quad_strip_per_adjacent_sample_pair",
      endCaps: false,
      smoothing: false,
      traceRadiusUse: "forbidden",
      interpolation: "straight_triangle_strips_between_observed_one_micrometre_contour_planes",
    },
    geometry: { rings, triangleIndices },
    qualityAssurance: {
      selfIntersectingInputContourCount: 0,
      uniquePlaneCount: new Set(rings.map((ring) => ring.zMicrometre)).size,
      adjacentPlaneGapMicrometre: 1,
      maximumAdjacentCentroidShiftMicrometre,
      maximumAdjacentContourAreaRatio,
      maximumAdjacentAlignedRmsMicrometre,
      capCount: 0,
      ringCount: rings.length,
      vertexCount: rings.length * ringSize,
      triangleCount,
      openEndBoundaryLoopCount: 2,
      observedSurfaceCount: 0,
      derivedDisplayOpenShellCount: 1,
      volumeCount: 0,
      membraneClaimCount: 0,
      internalStructureObjectCount: 0,
      biologicalMeasurementCount: 0,
      sameCellJoinCount: 0,
      registrationCount: 0,
    },
    scientificBoundary: "DER display interpolation only. The mesh is not an observed membrane or segmented volume, has uncapped ends, does not represent a nucleus or organelle, and does not add biological measurements, same-cell internal structures, cross-source identity or atlas registration. Exact OBS source line loops remain separately available and unchanged.",
  };
}

export function validateNativeContourDerivedSomaSurface(payload, sourcePayload, sourceReceipts) {
  assert(payload && typeof payload === "object", "Derived contour surface payload is required");
  const expected = buildNativeContourDerivedSomaSurface(sourcePayload, sourceReceipts);
  const candidate = { ...payload };
  delete candidate.payloadSha256;
  assert(JSON.stringify(candidate) === JSON.stringify(expected), "Derived contour surface differs from deterministic eligibility-gated rebuild");
  return payload;
}
