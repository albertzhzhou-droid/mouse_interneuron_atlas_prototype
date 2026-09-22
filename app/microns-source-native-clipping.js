export const MICRONS_CLIP_AXES = Object.freeze(["x", "y", "z"]);
export const MICRONS_CLIP_SIDES = Object.freeze(["positive", "negative"]);

function isPlainRecord(value) {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function axisIndex(axis) {
  const index = MICRONS_CLIP_AXES.indexOf(axis);
  if (index < 0) throw new Error("MICrONS clipping axis must be x, y, or z");
  return index;
}

export function micronsClipBounds(contract, axis) {
  axisIndex(axis);
  const bounds = contract?.clippingOperation?.boundsNanometre?.[axis];
  if (!isPlainRecord(bounds)
    || typeof bounds.minimum !== "number"
    || typeof bounds.maximum !== "number"
    || !Number.isFinite(bounds.minimum)
    || !Number.isFinite(bounds.maximum)
    || bounds.minimum >= bounds.maximum) {
    throw new Error(`MICrONS ${axis}-axis clipping bounds are invalid`);
  }
  return { minimum: bounds.minimum, maximum: bounds.maximum };
}

export function micronsClipSomaPosition(contract, axis) {
  const index = axisIndex(axis);
  const soma = contract?.clippingOperation?.somaCentreNanometre;
  const value = Array.isArray(soma) ? soma[index] : Number.NaN;
  const bounds = micronsClipBounds(contract, axis);
  if (!Number.isFinite(value) || value < bounds.minimum || value > bounds.maximum) {
    throw new Error(`MICrONS ${axis}-axis soma-centre clipping position is invalid`);
  }
  return value;
}

export function defaultMicronsClipState(contract) {
  const declared = contract?.clippingOperation?.defaultState;
  return validateMicronsClipState({
    enabled: declared?.enabled,
    axis: declared?.axis,
    positionNanometre: declared?.positionNanometre,
    keepSide: declared?.keepSide,
  }, contract);
}

export function validateMicronsClipState(value, contract) {
  if (!isPlainRecord(value)) throw new Error("MICrONS clipping state must be an object");
  const unexpected = Object.keys(value).filter((key) => !["enabled", "axis", "positionNanometre", "keepSide"].includes(key));
  if (unexpected.length) throw new Error(`MICrONS clipping state contains unsupported field ${unexpected[0]}`);
  if (typeof value.enabled !== "boolean") throw new Error("MICrONS clipping enabled must be a boolean");
  if (!MICRONS_CLIP_AXES.includes(value.axis)) throw new Error("MICrONS clipping axis must be x, y, or z");
  if (!MICRONS_CLIP_SIDES.includes(value.keepSide)) throw new Error("MICrONS clipping retained side must be positive or negative");
  if (typeof value.positionNanometre !== "number" || !Number.isFinite(value.positionNanometre)) {
    throw new Error("MICrONS clipping position must be a finite number of nanometres");
  }
  const bounds = micronsClipBounds(contract, value.axis);
  if (value.positionNanometre < bounds.minimum || value.positionNanometre > bounds.maximum) {
    throw new Error(`MICrONS clipping position is outside the exact ${value.axis}-axis cell bounds`);
  }
  return {
    enabled: value.enabled,
    axis: value.axis,
    positionNanometre: value.positionNanometre,
    keepSide: value.keepSide,
  };
}

export function clampMicronsClipPosition(contract, axis, positionNanometre) {
  const bounds = micronsClipBounds(contract, axis);
  if (!Number.isFinite(positionNanometre)) return micronsClipSomaPosition(contract, axis);
  return Math.min(bounds.maximum, Math.max(bounds.minimum, positionNanometre));
}

export function parseMicronsClipUrlState(read, contract) {
  const fallback = defaultMicronsClipState(contract);
  const enabledToken = read("micronsClip");
  const axisToken = read("micronsClipAxis");
  const positionToken = read("micronsClipNm");
  const sideToken = read("micronsClipSide");
  const axis = MICRONS_CLIP_AXES.includes(axisToken) ? axisToken : fallback.axis;
  const enabled = enabledToken === "1" || enabledToken === "true" || enabledToken === "on";
  const enabledTokenValid = enabledToken === null || ["1", "0", "true", "false", "on", "off"].includes(enabledToken);
  const side = MICRONS_CLIP_SIDES.includes(sideToken) ? sideToken : fallback.keepSide;
  const parsedPosition = positionToken === null || positionToken.trim() === ""
    ? micronsClipSomaPosition(contract, axis)
    : Number(positionToken);
  try {
    const candidate = validateMicronsClipState({
      enabled: enabledTokenValid ? enabled : false,
      axis,
      positionNanometre: parsedPosition,
      keepSide: side,
    }, contract);
    if (!enabledTokenValid || (axisToken !== null && !MICRONS_CLIP_AXES.includes(axisToken)) || (sideToken !== null && !MICRONS_CLIP_SIDES.includes(sideToken))) {
      return { ...candidate, enabled: false };
    }
    return candidate;
  } catch {
    return { ...fallback, enabled: false };
  }
}

export function buildMicronsWorldClippingPlane(state, contract, displayTransform) {
  const canonical = validateMicronsClipState(state, contract);
  const index = axisIndex(canonical.axis);
  const origin = displayTransform?.originNanometre?.[index];
  const scale = displayTransform?.scaleViewerUnitPerNanometre;
  if (!Number.isFinite(origin) || !Number.isFinite(scale) || scale <= 0) {
    throw new Error("MICrONS display transform is invalid for source-native clipping");
  }
  const positionViewerUnit = (canonical.positionNanometre - origin) * scale;
  const sign = canonical.keepSide === "positive" ? 1 : -1;
  const rawWorldConstant = -sign * positionViewerUnit;
  const normal = [0, 0, 0];
  normal[index] = sign;
  return {
    ...canonical,
    nativeFrame: contract.sourceReference.nativeFrame,
    sourceBoundsNanometre: micronsClipBounds(contract, canonical.axis),
    positionViewerUnit,
    worldNormal: normal,
    worldConstant: Object.is(rawWorldConstant, -0) ? 0 : rawWorldConstant,
    clippedComponent: "cell",
    nucleusClipped: false,
    capPrimitiveCount: 0,
    geometryMutationCount: 0,
    generatedGeometryCount: 0,
    registrationCount: 0,
  };
}

export function buildMicronsClipRuntimeReceipt(state, contract, displayTransform) {
  const plane = buildMicronsWorldClippingPlane(state, contract, displayTransform);
  return {
    contractId: contract.contractId,
    releaseId: contract.releaseId,
    enabled: plane.enabled,
    axis: plane.axis,
    positionNanometre: plane.positionNanometre,
    keepSide: plane.keepSide,
    sourceBoundsNanometre: plane.sourceBoundsNanometre,
    positionViewerUnit: plane.positionViewerUnit,
    worldNormal: plane.worldNormal,
    worldConstant: plane.worldConstant,
    renderTarget: "cell_segmentation_surface_only",
    cellClippingPlaneCount: plane.enabled ? 1 : 0,
    nucleusClippingPlaneCount: 0,
    nucleusIntact: true,
    capPrimitiveCount: 0,
    geometryMutationCount: 0,
    generatedGeometryCount: 0,
    joinCount: 0,
    registrationCount: 0,
    measurementClaim: false,
  };
}
