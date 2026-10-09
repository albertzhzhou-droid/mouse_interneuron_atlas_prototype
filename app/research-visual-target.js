export const NO_MORPHOLOGY_VISUAL_TARGET = "focus_has_no_admitted_morphology_link";
export const SOURCE_SPECIFIC_MORPHOLOGY_VIEWER_ONLY = "exact_morphology_available_only_in_source_specific_morphology_viewer";
export const INVALID_RESEARCH_VISUAL_TARGET = "invalid_research_focus";
export const INVALID_MORPHOLOGY_FOCUS_ID = "invalid_morphology_focus_id";
export const MORPHOLOGY_FOCUS_NOT_ADMITTED = "morphology_focus_not_admitted_in_current_source_universe";
export const SOURCE_DIAMETER_UNAVAILABLE_SKELETON_REQUIRED = "source_diameter_unavailable_skeleton_required";

function positiveIntegerSet(values) {
  return new Set(
    Array.from(values ?? []).filter((value) => Number.isInteger(value) && value > 0),
  );
}

function focusIdSet(values) {
  return new Set(
    Array.from(values ?? []).filter((value) => typeof value === "string" && value.length > 0),
  );
}

function nonCellView(currentView) {
  return ["cell_detail", "internal_reference", "microns_observed_reference"].includes(currentView)
    ? "home"
    : currentView;
}

function clearedTarget(reason, currentView, sourceSpecificViewer = null) {
  return {
    status: sourceSpecificViewer ? "source_specific_viewer_only" : "cleared",
    neuronId: null,
    showObservedCellForm: false,
    nextView: nonCellView(currentView),
    fidelityMode: "observed_swc",
    reason,
    modeReason: null,
    focusBinding: null,
    sourceSpecificViewer,
  };
}

export function parseNeuroMorphoFocusId(focusId) {
  if (typeof focusId !== "string") return null;
  const match = /^NeuroMorpho:([1-9][0-9]*)$/.exec(focusId);
  if (!match) return null;
  const neuronId = Number(match[1]);
  return Number.isSafeInteger(neuronId) ? neuronId : null;
}

/**
 * Keeps persisted SCI identity, active SCI focus and keyboard entry separate.
 * A non-SCI focus never activates an SCI entity, while a valid SCI focus is
 * canonical for persistence and a visible list always retains one roving tab stop.
 */
export function resolveSciSelectionState({
  selectedId,
  researchFocus,
  admittedEntityIds,
  visibleEntityIds,
}) {
  const admittedIds = focusIdSet(admittedEntityIds);
  const visibleIds = Array.from(visibleEntityIds ?? [])
    .filter((id) => typeof id === "string" && admittedIds.has(id));
  const storedSelectedId = typeof selectedId === "string" && admittedIds.has(selectedId)
    ? selectedId
    : null;
  const activeSelectedId = researchFocus?.focusKind === "sci_entity"
    && typeof researchFocus.focusId === "string"
    && admittedIds.has(researchFocus.focusId)
    ? researchFocus.focusId
    : null;
  const retainedSelectedId = activeSelectedId ?? storedSelectedId;
  const rovingPopulationId = retainedSelectedId && visibleIds.includes(retainedSelectedId)
    ? retainedSelectedId
    : visibleIds[0] ?? null;

  return { retainedSelectedId, activeSelectedId, rovingPopulationId };
}

/**
 * Resolves one research focus to the only visual target it is allowed to control.
 * The resolver is deliberately stateless: cleared results contain no previous
 * neuron ID, so callers cannot accidentally retain or fetch stale geometry.
 */
export function resolveResearchVisualTarget({
  focus,
  admittedMainSceneNeuronIds,
  admittedSourceViewerNeuronIds,
  sourceDiameterNeuronIds,
  requestedFidelityMode = "observed_swc",
  currentView = "home",
}) {
  if (
    !focus
    || typeof focus !== "object"
    || typeof focus.focusKind !== "string"
    || !focus.focusKind
    || typeof focus.focusId !== "string"
    || !focus.focusId
  ) {
    return clearedTarget(INVALID_RESEARCH_VISUAL_TARGET, currentView);
  }

  if (focus.focusKind !== "morphology_record") {
    return clearedTarget(NO_MORPHOLOGY_VISUAL_TARGET, currentView);
  }

  const neuronId = parseNeuroMorphoFocusId(focus.focusId);
  if (neuronId === null) {
    return clearedTarget(INVALID_MORPHOLOGY_FOCUS_ID, currentView);
  }

  const admittedIds = positiveIntegerSet(admittedMainSceneNeuronIds);
  if (!admittedIds.has(neuronId)) {
    const sourceViewerIds = positiveIntegerSet(admittedSourceViewerNeuronIds);
    if (!sourceViewerIds.has(neuronId)) {
      return clearedTarget(MORPHOLOGY_FOCUS_NOT_ADMITTED, currentView);
    }
    return clearedTarget(
      SOURCE_SPECIFIC_MORPHOLOGY_VIEWER_ONLY,
      currentView,
      {
        lab: "morphology",
        focusId: `NeuroMorpho:${neuronId}`,
        neuronId,
      },
    );
  }

  const diameterIds = positiveIntegerSet(sourceDiameterNeuronIds);
  const radiusAuthorized = diameterIds.has(neuronId);
  const fidelityMode = requestedFidelityMode === "radius_surface" && radiusAuthorized
    ? "radius_surface"
    : "observed_swc";

  return {
    status: "exact_main_scene_morphology",
    neuronId,
    showObservedCellForm: true,
    nextView: "cell_detail",
    fidelityMode,
    reason: "exact_admitted_morphology_focus",
    modeReason: requestedFidelityMode === "radius_surface" && !radiusAuthorized
      ? SOURCE_DIAMETER_UNAVAILABLE_SKELETON_REQUIRED
      : null,
    focusBinding: {
      focusKind: "morphology_record",
      focusId: `NeuroMorpho:${neuronId}`,
      neuronId,
    },
    sourceSpecificViewer: null,
  };
}

/**
 * Dropdown and exact-route selections may update the research focus only when
 * that canonical focus ID is resolvable by the shared verified record loader.
 */
export function resolveExplicitMorphologySelection({
  neuronId,
  resolvableMorphologyFocusIds,
  ...visualOptions
}) {
  if (!Number.isSafeInteger(neuronId) || neuronId <= 0) {
    return {
      ...clearedTarget(INVALID_MORPHOLOGY_FOCUS_ID, visualOptions.currentView ?? "home"),
      researchFocus: null,
      focusUpdateReason: "invalid_explicit_morphology_selection",
    };
  }

  const focus = { focusKind: "morphology_record", focusId: `NeuroMorpho:${neuronId}` };
  const target = resolveResearchVisualTarget({ focus, ...visualOptions });
  const resolvable = focusIdSet(resolvableMorphologyFocusIds).has(focus.focusId);
  return {
    ...target,
    researchFocus: resolvable ? focus : null,
    focusUpdateReason: resolvable
      ? "exact_resolvable_morphology_focus_selected"
      : "morphology_focus_not_resolvable_by_active_record_loader",
  };
}
