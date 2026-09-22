export const MORPHOLOGY_VIEWPORT_SCALE_ALGORITHM_ID = "camera_target_plane_source_local_scale_v1";
export const MORPHOLOGY_VIEWPORT_SCALE_MEASUREMENT_PLANE = "camera_target_depth";
export const MORPHOLOGY_VIEWPORT_SCALE_TARGET_PIXELS = 92;

function positiveFinite(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
  return value;
}

function niceScaleLength(idealMicrometre) {
  const exponent = Math.floor(Math.log10(idealMicrometre));
  const candidates = [];
  for (let offset = -1; offset <= 1; offset += 1) {
    const power = 10 ** (exponent + offset);
    for (const coefficient of [1, 2, 5]) candidates.push(coefficient * power);
  }
  return candidates.reduce((best, candidate) => {
    const candidateDistance = Math.abs(candidate - idealMicrometre);
    const bestDistance = Math.abs(best - idealMicrometre);
    return candidateDistance < bestDistance || (candidateDistance === bestDistance && candidate < best)
      ? candidate
      : best;
  });
}

export function formatMorphologyScaleLength(lengthMicrometre) {
  positiveFinite(lengthMicrometre, "lengthMicrometre");
  if (lengthMicrometre >= 1) return `${Number(lengthMicrometre.toPrecision(6))} µm`;
  if (lengthMicrometre >= 0.001) return `${Number(lengthMicrometre.toPrecision(6))} µm`;
  return `${lengthMicrometre.toExponential(2)} µm`;
}

export function computeMorphologyViewportScaleBar({
  cameraTargetDistanceViewerUnit,
  effectiveVerticalFovDegrees,
  viewportHeightCssPixel,
  scaleViewerUnitPerMicrometre,
  targetPixelLength = MORPHOLOGY_VIEWPORT_SCALE_TARGET_PIXELS,
}) {
  const distance = positiveFinite(cameraTargetDistanceViewerUnit, "cameraTargetDistanceViewerUnit");
  const fov = positiveFinite(effectiveVerticalFovDegrees, "effectiveVerticalFovDegrees");
  if (fov >= 180) throw new Error("effectiveVerticalFovDegrees must be less than 180");
  const height = positiveFinite(viewportHeightCssPixel, "viewportHeightCssPixel");
  const sourceScale = positiveFinite(scaleViewerUnitPerMicrometre, "scaleViewerUnitPerMicrometre");
  const targetPixels = positiveFinite(targetPixelLength, "targetPixelLength");
  const verticalViewerSpanAtTarget = 2 * distance * Math.tan((fov * Math.PI / 180) / 2);
  const micrometrePerCssPixel = verticalViewerSpanAtTarget / height / sourceScale;
  const lengthMicrometre = niceScaleLength(micrometrePerCssPixel * targetPixels);
  const pixelLength = lengthMicrometre / micrometrePerCssPixel;
  return {
    algorithmId: MORPHOLOGY_VIEWPORT_SCALE_ALGORITHM_ID,
    measurementPlane: MORPHOLOGY_VIEWPORT_SCALE_MEASUREMENT_PLANE,
    sourceCoordinateUnit: "micrometre_reported_by_source",
    lengthMicrometre,
    pixelLength,
    micrometrePerCssPixel,
    targetPixelLength: targetPixels,
    sourceLocalOnly: true,
    sharedAcrossViewports: false,
    apparentObjectSizeComparable: false,
  };
}

export function computePerspectiveSphereFitDistance({
  radiusViewerUnit,
  verticalFovDegrees,
  aspect,
  margin = 1.12,
}) {
  const radius = positiveFinite(radiusViewerUnit, "radiusViewerUnit");
  const verticalFov = positiveFinite(verticalFovDegrees, "verticalFovDegrees");
  if (verticalFov >= 180) throw new Error("verticalFovDegrees must be less than 180");
  const viewportAspect = positiveFinite(aspect, "aspect");
  const fitMargin = positiveFinite(margin, "margin");
  const verticalHalfFov = verticalFov * Math.PI / 360;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * viewportAspect);
  const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);
  return radius / Math.sin(limitingHalfFov) * fitMargin;
}
