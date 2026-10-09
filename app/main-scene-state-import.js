import { REVISION } from "three";
import { readVerifiedMainSceneMorphology } from "./main-scene-morphology-verification.js";
import { MAIN_SCENE_SOURCE_VIEW_BUILD, mainSceneViewEqual, validateMainSceneSourceViewReplay, assertMainSceneSourceViewApplied } from "./main-scene-source-view.js";

const check = (condition, reason) => { if (!condition) throw new Error(`State import: ${reason}`); };
const plain = value => value && typeof value === "object" && !Array.isArray(value);

export async function prepareMainSceneStateViewImport(value, state, targetNeuronId, records, options = {}) {
  if (value === undefined) return { status: "settings_only", reason: "legacy_export_without_actual_view" };
  check(plain(value), "the saved main-scene view is malformed");
  if (value.status === "unavailable") {
    check(Object.keys(value).length === 3 && typeof value.reason === "string" && value.reason.length > 0 && value.reason.length <= 1000
      && value.currentNeuronId === targetNeuronId, "the unavailable-view disclosure differs from the selected source");
    return { status: "settings_only", reason: "saved_actual_view_unavailable" };
  }
  check(value.documentType === "main_scene_morphology_view_receipt" && value.schemaVersion === "0.2.0", "unsupported actual-view document");
  check(mainSceneViewEqual(value.rendererBuild, MAIN_SCENE_SOURCE_VIEW_BUILD), "renderer code, style or dependency build changed");
  check(Number.isSafeInteger(targetNeuronId) && value.source?.neuronId === targetNeuronId && state.observedCellFormId === targetNeuronId,
    "saved view and state focus must identify the same admitted morphology");
  const record = records.find(row => row.neuronId === targetNeuronId);
  check(record, "the source is not admitted to the main scene");
  const document = structuredClone(value);
  const request = document.view?.request;
  check(plain(request) && request.view === state.cameraPreset && request.sliceZ === state.sliceZ && request.mode === state.morphologyFidelityMode
    && mainSceneViewEqual(request.micronsClipping, state.micronsClipping), "saved view and persistent camera, slice, mode or clipping disagree");
  check(plain(document.view.layers) && plain(request.layers) && ["scaffold", "gray", "observedForm", "micronsCellSurface", "micronsNucleus"].every(key => request.layers[key] === state.layers[key])
    // Persistent state records effective evidence visibility; a morphology focus suppresses anchors.
    && (request.layers.entities === state.layers.entities || document.view.layers.entities === state.layers.entities), "saved view and persistent layers disagree");
  check(mainSceneViewEqual(request.evidenceFilter, { search: state.search, filters: state.filters, retainedSelectedId: state.selectedId }),
    "saved view and persistent evidence filter or selection disagree");
  const geometry = await readVerifiedMainSceneMorphology(record, { fetchImpl: options.fetchImpl, signal: options.signal });
  validateMainSceneSourceViewReplay(record, geometry, document, REVISION);
  return { status: "actual_view", neuronId: targetNeuronId, document };
}

export function createMainSceneStateImportCoordinator() {
  let serial = 0, pending = null;
  const current = ticket => Boolean(pending && pending.ticket === ticket && !ticket.signal.aborted);
  const cancel = reason => {
    if (!pending) return false;
    const restoring = pending.phase === "restoring";
    pending.controller.abort(reason); pending = null;
    return restoring;
  };
  return {
    begin(context) {
      cancel("A newer state import replaced this request");
      const controller = new AbortController(), ticket = Object.freeze({ id: ++serial, signal: controller.signal });
      pending = { ticket, controller, phase: "preparing", baseline: structuredClone(context) };
      return ticket;
    },
    isCurrent: current, isLatest: ticket => ticket.id === serial, cancel,
    snapshot() { return pending ? { ticket: pending.ticket, phase: pending.phase, baseline: pending.baseline, expected: pending.expected, preparation: pending.preparation, comparisonCount: pending.comparisonCount } : null; },
    waitForRenderer(ticket, preparation, expected, comparisonCount) {
      if (!current(ticket)) return false;
      check(preparation.status === "actual_view", "an actual view is required for renderer restoration");
      pending.preparation = structuredClone(preparation); pending.expected = structuredClone(expected);
      pending.comparisonCount = comparisonCount; pending.phase = "waiting";
      return true;
    },
    finish(ticket) { if (current(ticket)) { pending.controller.abort("State import finished"); pending = null; return true; } return false; },
    async restoreWhenReady(ticket, tools) {
      if (!current(ticket) || pending.phase !== "waiting" || !tools?.restorable || tools.restoring || tools.neuronId !== pending.preparation.neuronId) return { status: "waiting" };
      const preparation = pending.preparation;
      pending.phase = "restoring";
      try {
        const before = tools.available ? tools.capture() : null;
        await tools.restore(structuredClone(preparation.document));
        if (!current(ticket)) return { status: "cancelled" };
        const actual = tools.capture();
        assertMainSceneSourceViewApplied(preparation.document, actual);
        check(mainSceneViewEqual(actual.source, preparation.document.source) && mainSceneViewEqual(actual.rendererBuild, MAIN_SCENE_SOURCE_VIEW_BUILD), "the applied source or renderer differs from the saved view");
        if (before) check(actual.geometryVerification.mainSceneVerificationSequence > before.geometryVerification.mainSceneVerificationSequence, "the current source producer did not advance during restoration");
        pending.phase = "completed";
        return { status: "restored", actual };
      } catch (error) {
        if (!current(ticket)) return { status: "cancelled" };
        pending.phase = "failed";
        throw error;
      }
    },
  };
}
