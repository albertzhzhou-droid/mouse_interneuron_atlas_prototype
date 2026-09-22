export const NATIVE_SOMA_CONTOUR_NEURON_ID = 45718;
export const NATIVE_SOMA_CONTOUR_AUTHORITY = "OBS_SOURCE_NATIVE_CONTOUR_TRACE";

const EXPECTED_VERTEX_COUNTS = Object.freeze([21, 30, 40, 37, 50, 40, 34, 23]);
const EXPECTED_SOMA1_Z = Object.freeze([-29, -31, -33, -35, -37, -39, -41]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function same(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export function validateNativeSomaContourPayload(payload, contract) {
  check(isRecord(payload), "Native soma-contour payload must be an object");
  check(isRecord(contract), "Native soma-contour contract must be an object");
  check(payload.documentType === "neurolucida_source_native_soma_contour_trace_geometry", "Native soma-contour document type changed");
  check(payload.schemaVersion === "0.1.0", "Native soma-contour schema version changed");
  check(payload.releaseId === contract.releaseId, "Native soma-contour release identity mismatch");
  check(payload.assetId === `NeuroMorpho:${NATIVE_SOMA_CONTOUR_NEURON_ID}`, "Native soma-contour cell identity mismatch");
  check(payload.sourceFrame === "Neurolucida_DAT_source_native_unregistered", "Native soma-contour frame changed");
  check(payload.registrationStatus === "unregistered", "Native soma contours cannot be registered");
  check(payload.source?.sha256 === contract.sourceObject.sha256 && payload.source?.bytes === contract.sourceObject.bytes, "Native DAT source receipt mismatch");
  check(Array.isArray(payload.contours) && payload.contours.length === 8, "Exactly eight native soma contours are required");
  check(same(payload.contours.map((contour) => contour.vertexCount), EXPECTED_VERTEX_COUNTS), "Native soma-contour vertex counts changed");
  const soma1 = payload.contours.filter((contour) => contour.sourceName === "Soma 1");
  const cellBody = payload.contours.filter((contour) => contour.sourceName === "Cell Body");
  check(soma1.length === 7 && soma1.every((contour) => contour.sourceClosedFlag === true && contour.interpretedClosed === true), "Native Soma 1 stack semantics changed");
  check(same(soma1.flatMap((contour) => contour.zValuesMicrometre), EXPECTED_SOMA1_Z), "Native Soma 1 z planes changed");
  check(cellBody.length === 1 && cellBody[0].sourceClosedFlag === false && cellBody[0].interpretedClosed === true, "Legacy Cell Body exception changed");
  check(same(cellBody[0].zValuesMicrometre, [13, 15]), "Legacy Cell Body z values changed");
  for (const contour of payload.contours) {
    check(Array.isArray(contour.points) && contour.points.length === contour.vertexCount, `${contour.id} point count mismatch`);
    check(contour.semanticSegmentCount === contour.vertexCount, `${contour.id} must close last-to-first without duplicating a vertex`);
    check(contour.points.every((point) => Array.isArray(point) && point.length === 4 && point.every(Number.isFinite)), `${contour.id} has an invalid source point`);
  }
  check(payload.summary?.sourceSomaContourObjectCount === 8, "Native soma-contour object denominator changed");
  check(payload.summary?.vertexCount === 275 && payload.summary?.semanticClosedSegmentCount === 275, "Native soma-contour vertex or segment denominator changed");
  for (const field of ["filledPolygonCount", "triangleCount", "surfaceCount", "volumeCount", "internalStructureObjectCount", "registrationCount", "crossSourceJoinCount"]) {
    check(payload.summary?.[field] === 0, `${field} must remain zero`);
  }
  check(payload.summary?.pointPayloadSha256 === contract.summary.pointPayloadSha256, "Native soma-contour point receipt mismatch");
  check(payload.displayContract?.admittedPrimitive === "ordered closed polyline only", "Native soma-contour primitive authority changed");
  check(payload.displayContract?.keepCellBodySeparateFromSoma1Stack === true, "Legacy Cell Body must remain separate from the Soma 1 stack");
  check(payload.displayContract?.traceRadiusRenderingUse === "forbidden", "DAT trace radius cannot control rendered thickness");
  check(contract.derivedObject.authority === NATIVE_SOMA_CONTOUR_AUTHORITY, "Native soma-contour authority changed");
  check(contract.relationshipBoundary?.overlayWithStandardizedSwcAllowed === false, "DAT/SWC overlay must remain forbidden");
  return payload;
}

export function nativeSomaContourBounds(contours) {
  check(Array.isArray(contours) && contours.length > 0, "At least one native contour is required for bounds");
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const contour of contours) {
    for (const point of contour.points ?? []) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }
  }
  check([...min, ...max].every(Number.isFinite), "Native contour bounds are not finite");
  return {
    min,
    max,
    center: min.map((value, axis) => (value + max[axis]) * 0.5),
    extent: min.map((value, axis) => max[axis] - value),
  };
}

export function nativeSomaContourDisplayTransform(contours, maximumViewerExtent = 8) {
  check(Number.isFinite(maximumViewerExtent) && maximumViewerExtent > 0, "Maximum viewer extent must be positive");
  const bounds = nativeSomaContourBounds(contours);
  const maximumExtent = Math.max(...bounds.extent);
  check(maximumExtent > 0, "Native contour extent must be positive");
  return {
    kind: "contour_bounds_centered_uniform_scale_only",
    originMicrometre: bounds.center,
    scaleViewerUnitPerMicrometre: maximumViewerExtent / maximumExtent,
    use: "viewer_only",
    boundsMicrometre: bounds,
  };
}

export function transformNativeSomaContourPoint(point, transform) {
  return [0, 1, 2].map((axis) => (
    point[axis] - transform.originMicrometre[axis]
  ) * transform.scaleViewerUnitPerMicrometre);
}
