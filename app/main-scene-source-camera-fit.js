import { computePerspectiveSphereFitDistance } from "./morphology-viewport-scale.js";

const FOV_DEGREES = 35;
const NEAR = 0.05;
const FAR = 250;
const MIN_DISTANCE = 4;
const MAX_DISTANCE = 100;

/** Only suppress sub-pixel floating-point round trips in a live camera signature.
 * Receipts retain actual values; source, viewport and projection checks stay exact.
 */
export function sameMainSceneCameraForCapture(a, b) {
  const fields = ["kind", "position", "target", "up", "quaternion", "fov", "zoom", "aspect", "near", "far", "filmGauge", "filmOffset"];
  if (!a || !b || typeof a !== "object" || typeof b !== "object"
    || Object.keys(a).length !== fields.length || Object.keys(b).length !== fields.length
    || !fields.every(key => Object.hasOwn(a, key) && Object.hasOwn(b, key))) return false;
  return fields.every(key => {
    const length = key === "quaternion" ? 4 : ["position", "target", "up"].includes(key) ? 3 : 0;
    if (!length) return a[key] === b[key] && (key === "kind" ? a[key] === "PerspectiveCamera" : Number.isFinite(a[key]));
    return [a[key], b[key]].every(value => Array.isArray(value) && value.length === length
      && Object.keys(value).length === length && Array.from({ length }, (_, index) => index).every(index => Object.hasOwn(value, index) && Number.isFinite(value[index])))
      && a[key].every((value, index) => Math.abs(value - b[key][index]) <= 1e-12);
  });
}

function check(condition, reason) {
  if (!condition) throw new Error(`Main scene camera fit: ${reason}`);
}

function vector(value) {
  return Array.isArray(value) && value.length === 3 && Object.keys(value).length === 3
    && [0, 1, 2].every(axis => Object.hasOwn(value, axis) && Number.isFinite(value[axis]));
}

/**
 * Computes a default viewer pose from the admitted objects' actual world bounds.
 * The caller owns source verification and surface/overlay authorization; this
 * calculation never changes source geometry, transforms, or biological scope.
 */
export function computeMainSceneSourceCameraFit({ bounds, aspect, dimensionality, direction, up }) {
  check(bounds && vector(bounds.minimum) && vector(bounds.maximum), "finite three-axis bounds are required");
  check(bounds.minimum.every((value, axis) => value <= bounds.maximum[axis]), "bounds are reversed");
  check(Number.isFinite(aspect) && aspect > 0, "aspect must be positive and finite");
  check(dimensionality === "2D" || dimensionality === "3D", "source dimensionality is unsupported");

  const extents = bounds.maximum.map((value, axis) => value - bounds.minimum[axis]);
  const target = extents.map((value, axis) => bounds.minimum[axis] + value / 2);
  const radius = Math.hypot(...extents) / 2;
  check(vector(target) && Number.isFinite(radius) && radius > 0, "source bounds have no finite positive extent");
  const distance = Math.max(MIN_DISTANCE, computePerspectiveSphereFitDistance({
    radiusViewerUnit: radius, verticalFovDegrees: FOV_DEGREES, aspect,
  }));
  // Increasing a small fit to the minimum distance is safe. Reducing a fit to
  // the orbit maximum could hide source geometry, so an unsupported fit fails.
  check(Number.isFinite(distance) && distance <= MAX_DISTANCE, "complete source bounds exceed the fixed orbit range");
  check(distance - radius > NEAR && distance + radius < FAR, "complete source bounds exceed the fixed clipping planes");
  const sourceDirection = direction === undefined ? dimensionality === "2D" ? [0, 0, 1] : [0, 2.2, 9.6] : direction;
  const sourceUp = up === undefined ? [0, 1, 0] : up;
  check(vector(sourceDirection) && vector(sourceUp), "direction and up must be finite three-axis vectors");
  const directionLength = Math.hypot(...sourceDirection), upLength = Math.hypot(...sourceUp);
  check(Number.isFinite(directionLength) && directionLength > 0 && Number.isFinite(upLength) && upLength > 0,
    "direction and up must have finite nonzero length");
  const normalizedDirection = sourceDirection.map(value => value / directionLength);
  const normalizedUp = sourceUp.map(value => value / upLength);
  const cross = [normalizedDirection[1] * normalizedUp[2] - normalizedDirection[2] * normalizedUp[1],
    normalizedDirection[2] * normalizedUp[0] - normalizedDirection[0] * normalizedUp[2],
    normalizedDirection[0] * normalizedUp[1] - normalizedDirection[1] * normalizedUp[0]];
  check(Math.hypot(...cross) > 1e-12, "direction and up must form a non-degenerate camera basis");
  const position = target.map((value, axis) => value + normalizedDirection[axis] * distance);
  check(vector(position), "fitted camera position is non-finite");
  const actualOffset = position.map((value, axis) => value - target[axis]);
  check(actualOffset.every((value, axis) => Math.abs(value - normalizedDirection[axis] * distance) <= distance * 1e-10),
    "world-coordinate precision cannot represent the fitted camera pose");
  return { target, position, up: normalizedUp, radius, distance };
}
