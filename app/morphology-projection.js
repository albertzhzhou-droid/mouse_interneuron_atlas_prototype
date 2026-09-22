export const MORPHOLOGY_PROJECTION_PLANES = ["xy", "xz", "yz"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function axisIndexes(plane) {
  if (plane === "xy") return [0, 1];
  if (plane === "xz") return [0, 2];
  if (plane === "yz") return [1, 2];
  throw new Error(`Unsupported morphology projection plane: ${plane}`);
}

/**
 * Project exact source-local SWC segments without rotating, smoothing, resampling,
 * or modifying source coordinates. The result is a display derivative only.
 */
export function projectSourceLocalMorphology(geometry, plane = "xy") {
  assert(geometry && Array.isArray(geometry.segments), "Morphology geometry segments are missing");
  const [horizontalAxis, verticalAxis] = axisIndexes(plane);
  const projectedSegments = [];
  const sourceTypes = new Set();
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const segment of geometry.segments) {
    assert(Array.isArray(segment) && segment.length >= 9, "Morphology projection received an invalid segment");
    const start = [Number(segment[0]), Number(segment[1]), Number(segment[2])];
    const end = [Number(segment[4]), Number(segment[5]), Number(segment[6])];
    assert([...start, ...end].every(Number.isFinite), "Morphology projection received a non-finite coordinate");
    const sourceType = Number(segment[8]);
    assert(Number.isInteger(sourceType), "Morphology projection received an invalid source type");
    const projected = {
      x1: start[horizontalAxis],
      y1: start[verticalAxis],
      x2: end[horizontalAxis],
      y2: end[verticalAxis],
      sourceType,
    };
    minX = Math.min(minX, projected.x1, projected.x2);
    maxX = Math.max(maxX, projected.x1, projected.x2);
    minY = Math.min(minY, projected.y1, projected.y2);
    maxY = Math.max(maxY, projected.y1, projected.y2);
    sourceTypes.add(sourceType);
    projectedSegments.push(projected);
  }

  assert(projectedSegments.length > 0, "Morphology projection cannot display an empty reconstruction");
  const widthMicrometre = maxX - minX;
  const heightMicrometre = maxY - minY;
  return {
    algorithmId: "source_local_orthographic_segment_projection_v1",
    geometryStatus: geometry.geometryStatus,
    neuronId: geometry.neuronId,
    plane,
    units: "micrometre",
    registrationCount: 0,
    coordinatePolicy: "exact_source_coordinates_no_rotation_no_smoothing_no_resampling",
    displayScalePolicy: "fit_per_record",
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      widthMicrometre,
      heightMicrometre,
    },
    sourceTypes: [...sourceTypes].sort((left, right) => left - right),
    segments: projectedSegments,
  };
}

export function fitProjectionToViewport(projection, width, height, padding = 12) {
  assert(projection?.bounds, "Projection bounds are missing");
  assert(Number.isFinite(width) && width > padding * 2, "Projection viewport width is invalid");
  assert(Number.isFinite(height) && height > padding * 2, "Projection viewport height is invalid");
  assert(Number.isFinite(padding) && padding >= 0, "Projection viewport padding is invalid");
  const sourceWidth = Math.max(projection.bounds.widthMicrometre, Number.EPSILON);
  const sourceHeight = Math.max(projection.bounds.heightMicrometre, Number.EPSILON);
  const scale = Math.min((width - padding * 2) / sourceWidth, (height - padding * 2) / sourceHeight);
  const contentWidth = sourceWidth * scale;
  const contentHeight = sourceHeight * scale;
  return {
    algorithmId: "fit_source_local_projection_per_record_v1",
    displayOnly: true,
    comparableApparentScale: false,
    scalePixelPerMicrometre: scale,
    offsetX: (width - contentWidth) / 2 - projection.bounds.minX * scale,
    offsetY: (height - contentHeight) / 2 + projection.bounds.maxY * scale,
  };
}

export function projectPointToViewport(point, fit) {
  return {
    x: point.x * fit.scalePixelPerMicrometre + fit.offsetX,
    y: -point.y * fit.scalePixelPerMicrometre + fit.offsetY,
  };
}
