#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { NATIVE_CONTOUR_DERIVED_SURFACE_ALGORITHM, NATIVE_CONTOUR_DERIVED_SURFACE_SAMPLE_COUNT, NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS } from "../app/native-contour-derived-soma-surface.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_PATH = "data/neurolucida-native-contour-admission-catalog-0.3.json";
const OUTPUT_PATH = "data/todd-native-contour-topology-audit-0.1.json";
const TARGETS = Object.freeze([
  { neuronId: 50424, expectedContourCount: 8, expectedVertexCount: 427 },
  { neuronId: 50408, expectedContourCount: 11, expectedVertexCount: 709 },
]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function signedArea(points) {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    twiceArea += current[0] * next[1] - next[0] * current[1];
  }
  return twiceArea * 0.5;
}

function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a, b, point, epsilon = 1e-9) {
  return Math.abs(orientation(a, b, point)) <= epsilon
    && point[0] >= Math.min(a[0], b[0]) - epsilon
    && point[0] <= Math.max(a[0], b[0]) + epsilon
    && point[1] >= Math.min(a[1], b[1]) - epsilon
    && point[1] <= Math.max(a[1], b[1]) + epsilon;
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

function findSelfIntersections(points) {
  assert(points.length >= 3, "Source contour has fewer than three vertices");
  assert(Math.abs(signedArea(points)) > 1e-9, "Source contour has degenerate planar area");
  const pairs = [];
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length;
    if (Math.hypot(points[first][0] - points[firstNext][0], points[first][1] - points[firstNext][1]) <= 1e-9) continue;
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length;
      if (second === firstNext || secondNext === first) continue;
      if (Math.hypot(points[second][0] - points[secondNext][0], points[second][1] - points[secondNext][1]) <= 1e-9) continue;
      if (segmentsIntersect(points[first], points[firstNext], points[second], points[secondNext])) pairs.push([first, second]);
    }
  }
  return pairs;
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

function resampleClosedPolyline(points, sampleCount) {
  const edges = points.map((from, index) => {
    const to = points[(index + 1) % points.length];
    return { from, to, length: Math.hypot(to[0] - from[0], to[1] - from[1]) };
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
    ]);
  }
  return samples;
}

function alignByCyclicPhase(reference, candidate) {
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
  return { phaseShift: bestShift, rms: Math.sqrt(bestSquaredError / candidate.length) };
}

function round(value) {
  return Number(value.toFixed(4));
}

async function readReceipt(relativePath, expected) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  const digest = sha256(bytes);
  assert(bytes.byteLength === expected.bytes, `${relativePath} byte count differs from the pinned catalogue`);
  assert(digest === expected.sha256, `${relativePath} SHA-256 differs from the pinned catalogue`);
  return { bytes, receipt: { path: relativePath, bytes: bytes.byteLength, sha256: digest } };
}

function inspectContour(contour, sourceOrderIndex) {
  assert(contour.sourceName === "Cell Body" && contour.sourceClosedFlag === false && contour.interpretedClosed === true,
    `${contour.id} no longer matches its source-evidenced Cell Body closure rule`);
  assert(contour.independentParserClassification === "somaContour" && contour.sourceProperties?.CellBody === true,
    `${contour.id} lacks the independent parser and CellBody-presence gates`);
  assert(JSON.stringify(contour.sourcePropertyReceipts) === JSON.stringify([{ key: "CellBody", declaredValueCount: 0, values: [] }]),
    `${contour.id} lacks the exact empty-value CellBody property receipt`);
  assert(Array.isArray(contour.zValuesMicrometre) && contour.zValuesMicrometre.length === 1,
    `${contour.id} must be confined to one source z plane`);
  assert(contour.points.length === contour.vertexCount && contour.points.every((point) => point.length === 4 && point.every(Number.isFinite)),
    `${contour.id} point rows do not match the exact four-column source payload`);
  assert(contour.points.every((point) => point[2] === contour.zValuesMicrometre[0]), `${contour.id} mixes z planes`);
  const xy = contour.points.map((point) => point.slice(0, 2));
  const zeroLengthEdgeIndices = xy.flatMap((point, index) => {
    const next = xy[(index + 1) % xy.length];
    return Math.hypot(point[0] - next[0], point[1] - next[1]) <= 1e-9 ? [index] : [];
  });
  return {
    id: contour.id,
    sourceClosedFlag: contour.sourceClosedFlag,
    sourceOrderIndex,
    zMicrometre: contour.zValuesMicrometre[0],
    vertexCount: contour.vertexCount,
    zeroLengthEdgeIndices,
    selfIntersectionEdgePairs: findSelfIntersections(xy),
    pointsForDiagnostics: xy,
  };
}

function inspectTransitions(contours) {
  const sorted = [...contours].sort((left, right) => left.zMicrometre - right.zMicrometre);
  const transitions = [];
  let previousSampled = null;
  let previousContour = null;
  for (const contour of sorted) {
    const points = contour.pointsForDiagnostics;
    const area = Math.abs(signedArea(points));
    const center = contourCentroid(points);
    const sampled = resampleClosedPolyline(normalizeWinding(points), NATIVE_CONTOUR_DERIVED_SURFACE_SAMPLE_COUNT);
    if (previousContour && previousSampled) {
      const previousArea = Math.abs(signedArea(previousContour.pointsForDiagnostics));
      const previousCenter = contourCentroid(previousContour.pointsForDiagnostics);
      const centroidShift = Math.hypot(center[0] - previousCenter[0], center[1] - previousCenter[1]);
      const areaRatio = Math.max(area / previousArea, previousArea / area);
      const alignment = alignByCyclicPhase(previousSampled, sampled);
      const bothContoursSimple = contour.selfIntersectionEdgePairs.length === 0 && previousContour.selfIntersectionEdgePairs.length === 0;
      const centroidWithinScreen = centroidShift <= NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS.maximumAdjacentCentroidShiftMicrometre;
      const areaWithinScreen = areaRatio <= NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS.maximumAdjacentContourAreaRatio;
      const alignedRmsWithinScreen = alignment.rms <= NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS.maximumAdjacentAlignedRmsMicrometre;
      const withinReferenceScreen = bothContoursSimple && centroidWithinScreen && areaWithinScreen && alignedRmsWithinScreen;
      transitions.push({
        fromContourId: previousContour.id,
        toContourId: contour.id,
        fromZMicrometre: previousContour.zMicrometre,
        toZMicrometre: contour.zMicrometre,
        zGapMicrometre: round(contour.zMicrometre - previousContour.zMicrometre),
        centroidShiftMicrometre: round(centroidShift),
        areaRatio: round(areaRatio),
        alignedCyclicRmsMicrometre: round(alignment.rms),
        phaseShiftAt128Samples: alignment.phaseShift,
        bothSourceContoursSimple: bothContoursSimple,
        centroidWithinReferenceScreen: centroidWithinScreen,
        areaRatioWithinReferenceScreen: areaWithinScreen,
        alignedCyclicRmsWithinReferenceScreen: alignedRmsWithinScreen,
        withinReferenceScreen,
        result: bothContoursSimple
          ? (withinReferenceScreen ? "within_reference_screen_not_surface_admission" : "hold_outside_reference_screen")
          : "hold_self_intersecting_source_contour",
      });
    }
    previousContour = contour;
    previousSampled = sampled;
  }
  return transitions;
}

async function auditRecord(record, target) {
  assert(record.neuronId === target.neuronId, "Catalogue target identity changed");
  assert(record.admissionStatus === "admitted_mbf_cell_body_semantic_rule", `NMO ${target.neuronId} no longer has its exact Cell Body admission`);
  const sourcePath = path.join("public", record.source.path.replace(/^\//, ""));
  const geometryPath = path.join("public", record.derivedObject.path.replace(/^\//, ""));
  const [{ receipt: sourceReceipt }, { bytes: geometryBytes, receipt: geometryReceipt }] = await Promise.all([
    readReceipt(sourcePath, record.source),
    readReceipt(geometryPath, record.derivedObject),
  ]);
  const geometry = JSON.parse(geometryBytes.toString("utf8"));
  assert(record.audit.independentPointArraysAgree === true
    && record.audit.independentParserClassification === "somaContour"
    && record.audit.independentParserSomaContourCount === target.expectedContourCount
    && record.audit.somaNamedContourObjectCount === target.expectedContourCount
    && record.audit.somaNamedVertexCount === target.expectedVertexCount,
  `NMO ${target.neuronId} independent parser and catalog contour/vertex gates changed`);
  assert(geometry.assetId === record.assetId && geometry.sourceFrame === "Neurolucida_DAT_source_native_unregistered"
    && geometry.registrationStatus === "unregistered", `NMO ${target.neuronId} source frame changed`);
  assert(geometry.source.sha256 === sourceReceipt.sha256 && geometry.source.bytes === sourceReceipt.bytes,
    `NMO ${target.neuronId} source DAT receipt differs from its derived contours`);
  assert(geometry.summary.pointPayloadSha256 === record.audit.somaNamedPointPayloadSha256,
    `NMO ${target.neuronId} ordered point-payload hash differs from the canonical catalogue`);
  assert(geometry.contours.length === target.expectedContourCount
    && geometry.summary.vertexCount === target.expectedVertexCount
    && geometry.summary.filledPolygonCount === 0
    && geometry.summary.triangleCount === 0
    && geometry.summary.loftCount === 0
    && geometry.summary.surfaceCount === 0
    && geometry.summary.membraneCount === 0
    && geometry.summary.volumeCount === 0
    && geometry.summary.internalStructureObjectCount === 0
    && geometry.summary.sameCellJoinCount === 0
    && geometry.summary.registrationCount === 0,
  `NMO ${target.neuronId} contour denominators or source-only geometry boundary changed`);

  const sourceOrderContours = geometry.contours.map(inspectContour);
  const sourceOrderZ = sourceOrderContours.map((contour) => contour.zMicrometre);
  const zSortedContours = [...sourceOrderContours].sort((left, right) => left.zMicrometre - right.zMicrometre);
  const sortedZ = zSortedContours.map((contour) => contour.zMicrometre);
  assert(new Set(sortedZ).size === sortedZ.length, `NMO ${target.neuronId} contains duplicate source contour planes`);
  assert(sortedZ.every((z, index) => index === 0 || z - sortedZ[index - 1] === 1), `NMO ${target.neuronId} has a missing or non-unit adjacent z plane`);
  const transitions = inspectTransitions(sourceOrderContours);
  const selfIntersectingContours = sourceOrderContours.filter((contour) => contour.selfIntersectionEdgePairs.length > 0);
  const zeroLengthContours = sourceOrderContours.filter((contour) => contour.zeroLengthEdgeIndices.length > 0);
  const withinScreenCount = transitions.filter((transition) => transition.withinReferenceScreen).length;
  const sourceOpenLoopCount = sourceOrderContours.filter((contour) => contour.sourceClosedFlag === false).length;
  assert(sourceOpenLoopCount === target.expectedContourCount, `NMO ${target.neuronId} raw source closure flags changed`);
  assert(transitions.every((transition) => transition.zGapMicrometre === 1), `NMO ${target.neuronId} transition includes a non-unit source plane gap`);
  const title = record.title;
  const heldReason = selfIntersectingContours.length
    ? `${selfIntersectingContours.length} exact source contours self-intersect; ${transitions.length - withinScreenCount} adjacent transitions exceed the legacy reference screen.`
    : `${transitions.length - withinScreenCount} adjacent transitions exceed the legacy reference screen.`;
  return {
    neuronId: target.neuronId,
    assetId: record.assetId,
    title,
    authority: "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP",
    source: { ...sourceReceipt, originalDatUrl: record.source.originalDatUrl, officialRecordUrl: record.source.officialRecordUrl },
    geometry: { ...geometryReceipt, pointPayloadSha256: geometry.summary.pointPayloadSha256 },
    sourceContourOrderZMicrometre: sourceOrderZ,
    contoursSortedByZ: zSortedContours.map((contour) => ({
      id: contour.id,
      sourceClosedFlag: contour.sourceClosedFlag,
      sourceOrderIndex: contour.sourceOrderIndex,
      zMicrometre: contour.zMicrometre,
      vertexCount: contour.vertexCount,
      zeroLengthEdgeIndices: contour.zeroLengthEdgeIndices,
      selfIntersectionEdgePairs: contour.selfIntersectionEdgePairs,
    })),
    transitionDiagnostics: transitions,
    summary: {
      contourCount: sourceOrderContours.length,
      vertexCount: sourceOrderContours.reduce((sum, contour) => sum + contour.vertexCount, 0),
      uniqueContiguousPlaneCount: sortedZ.length,
      zMinimumMicrometre: sortedZ[0],
      zMaximumMicrometre: sortedZ.at(-1),
      sourceArrayOrderMatchesZOrder: sourceOrderContours.every((contour, index) => contour.id === zSortedContours[index].id),
      sourceContourCountWithRawClosedFlagFalse: sourceOpenLoopCount,
      simpleContourCount: sourceOrderContours.length - selfIntersectingContours.length,
      selfIntersectingContourCount: selfIntersectingContours.length,
      selfIntersectionCount: selfIntersectingContours.reduce((sum, contour) => sum + contour.selfIntersectionEdgePairs.length, 0),
      zeroLengthEdgeContourCount: zeroLengthContours.length,
      zeroLengthEdgeCount: zeroLengthContours.reduce((sum, contour) => sum + contour.zeroLengthEdgeIndices.length, 0),
      adjacentTransitionCount: transitions.length,
      adjacentTransitionsWithinReferenceScreen: withinScreenCount,
      adjacentTransitionsHeld: transitions.length - withinScreenCount,
      contourDerivedSurfaceAdmitted: false,
      admittedTriangleCount: 0,
      internalStructureObjectCount: 0,
      sameCellJoinCount: 0,
      registrationCount: 0,
    },
    decision: "retain_exact_observed_line_loops_only",
    decisionReason: heldReason,
  };
}

export async function buildToddNativeContourTopologyAudit() {
  const catalogBytes = await readFile(path.join(ROOT, CATALOG_PATH));
  const catalog = JSON.parse(catalogBytes.toString("utf8"));
  assert(catalog.releaseId === "ohri-neurolucida-native-contour-admission-catalog-0.3.0", "NMO topology audit requires exact native contour catalog 0.3");
  const records = await Promise.all(TARGETS.map(async (target) => {
    const record = catalog.records.find((candidate) => candidate.neuronId === target.neuronId);
    assert(record, `NMO ${target.neuronId} is missing from the pinned native-contour catalog`);
    return auditRecord(record, target);
  }));
  const transitions = records.flatMap((record) => record.transitionDiagnostics);
  const selfIntersectionCount = records.reduce((sum, record) => sum + record.summary.selfIntersectionCount, 0);
  return {
    documentType: "todd_native_contour_topology_audit",
    schemaVersion: "0.1.0",
    releaseId: "ohri-todd-native-contour-topology-audit-0.1.0",
    auditedDateUtc: "2026-09-23",
    catalogueReceipt: {
      path: CATALOG_PATH,
      bytes: catalogBytes.byteLength,
      sha256: sha256(catalogBytes),
      releaseId: catalog.releaseId,
    },
    method: {
      coordinateFrame: "Neurolucida_DAT_source_native_unregistered",
      sourcePolylineModification: false,
      sourcePointRepair: false,
      smoothing: false,
      interpolationGeometryGenerated: false,
      selfIntersectionMethod: "non-adjacent_source_segment_pair_intersection_with_1e-9_coordinate_epsilon",
      adjacentCorrespondenceDiagnostic: "equal_arclength_128_sample_global_cyclic_phase_minimum_rms_only_no_spatial_registration",
      referenceScreenAlgorithmId: NATIVE_CONTOUR_DERIVED_SURFACE_ALGORITHM,
      referenceScreenSampleCount: NATIVE_CONTOUR_DERIVED_SURFACE_SAMPLE_COUNT,
      contourAreaUse: "absolute_planar_polyline_area_ratio_for_topology_screen_only_not_a_biological_measurement",
    },
    referenceScreen: {
      sourceRecordId: "NeuroMorpho:50394",
      thresholds: NATIVE_CONTOUR_DERIVED_SURFACE_SCREEN_THRESHOLDS,
      independentlyValidatedAsBiologicalTolerances: false,
      interpretation: "Exploratory software screen inherited from one separate record; passing is not surface admission, and failing preserves exact source line loops.",
    },
    records,
    summary: {
      auditedRecordCount: records.length,
      sourceContourCount: records.reduce((sum, record) => sum + record.summary.contourCount, 0),
      sourceVertexCount: records.reduce((sum, record) => sum + record.summary.vertexCount, 0),
      uniqueSourcePlaneCount: records.reduce((sum, record) => sum + record.summary.uniqueContiguousPlaneCount, 0),
      selfIntersectingContourCount: records.reduce((sum, record) => sum + record.summary.selfIntersectingContourCount, 0),
      selfIntersectionCount,
      zeroLengthEdgeContourCount: records.reduce((sum, record) => sum + record.summary.zeroLengthEdgeContourCount, 0),
      zeroLengthEdgeCount: records.reduce((sum, record) => sum + record.summary.zeroLengthEdgeCount, 0),
      adjacentTransitionCount: transitions.length,
      adjacentTransitionsWithinReferenceScreen: transitions.filter((transition) => transition.withinReferenceScreen).length,
      adjacentTransitionsHeld: transitions.filter((transition) => !transition.withinReferenceScreen).length,
      contourDerivedSurfaceAdmittedCount: records.filter((record) => record.summary.contourDerivedSurfaceAdmitted).length,
      admittedTriangleCount: records.reduce((sum, record) => sum + record.summary.admittedTriangleCount, 0),
      internalStructureObjectCount: 0,
      biologicalMeasurementCount: 0,
      sameCellJoinCount: 0,
      crossSourceIdentityCount: 0,
      registrationCount: 0,
    },
  };
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main() {
  const mode = process.argv[2] ?? "--write";
  assert(["--write", "--check"].includes(mode), "Usage: audit_todd_native_contour_topology_0_1.mjs [--write|--check]");
  const audit = await buildToddNativeContourTopologyAudit();
  const rendered = stableJson(audit);
  const outputUrl = path.join(ROOT, OUTPUT_PATH);
  if (mode === "--write") {
    await writeFile(outputUrl, rendered, "utf8");
    console.log(JSON.stringify({ releaseId: audit.releaseId, ...audit.summary }));
    return;
  }
  const current = await readFile(outputUrl, "utf8");
  assert(current === rendered, `${OUTPUT_PATH} is stale; run the audit builder with --write`);
  console.log(JSON.stringify({ releaseId: audit.releaseId, ...audit.summary }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
