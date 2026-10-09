export function canUseRadiusDerivedSurface(authority) {
  return authority?.dimensionality === "3D" && authority.sourceDiameterAvailable === true;
}

/**
 * @param {{ dimensionality: string, sourceDiameterAvailable: boolean } | null} authority
 * @param {"skeleton" | "radius" | null} explicitMode
 */
export function resolveMorphologyRenderMode(authority, explicitMode = null) {
  if (explicitMode === "skeleton") return "skeleton";
  return canUseRadiusDerivedSurface(authority) ? "radius" : "skeleton";
}

/** Requested-mode provenance can change while the authorized rendered mode stays the same. */
export function morphologyRenderModeTransition(authority, currentRequestedMode, nextRequestedMode) {
  return {
    requestedModeChanged: currentRequestedMode !== nextRequestedMode,
    effectiveModeChanged: resolveMorphologyRenderMode(authority, currentRequestedMode) !== resolveMorphologyRenderMode(authority, nextRequestedMode),
  };
}
