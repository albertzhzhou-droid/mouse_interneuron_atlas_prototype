import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  INVALID_RESEARCH_VISUAL_TARGET,
  MORPHOLOGY_FOCUS_NOT_ADMITTED,
  NO_MORPHOLOGY_VISUAL_TARGET,
  SOURCE_DIAMETER_UNAVAILABLE_SKELETON_REQUIRED,
  SOURCE_SPECIFIC_MORPHOLOGY_VIEWER_ONLY,
  parseNeuroMorphoFocusId,
  resolveExplicitMorphologySelection,
  resolveResearchVisualTarget,
  resolveSciSelectionState,
} from "../app/research-visual-target.js";

const atlasPrototypeSource = await readFile(
  new URL("../app/AtlasPrototype.tsx", import.meta.url),
  "utf8",
);
const sceneCanvasSource = await readFile(
  new URL("../app/SceneCanvas.tsx", import.meta.url),
  "utf8",
);
const researchFocusEvidenceSource = await readFile(
  new URL("../app/ResearchFocusEvidencePanel.tsx", import.meta.url),
  "utf8",
);

const productionMainSceneIds = [
  45674, 45718, 50394, 50408, 50424, 104003, 108974,
  109005, 109021, 170035, 242822, 249676, 260150,
];
const productionSourceViewerIds = [...productionMainSceneIds, 109006];

function resolve(focus, options = {}) {
  return resolveResearchVisualTarget({
    focus,
    admittedMainSceneNeuronIds: productionMainSceneIds,
    admittedSourceViewerNeuronIds: productionSourceViewerIds,
    sourceDiameterNeuronIds: [109005],
    requestedFidelityMode: "radius_surface",
    currentView: "cell_detail",
    ...options,
  });
}

test("109005 to a DE-1 focus clears the old geometry and exits cell detail", () => {
  const target = resolve({ focusKind: "molecular_profile", focusId: "sathyamurthy-2018:DE-1" });
  assert.equal(target.status, "cleared");
  assert.equal(target.neuronId, null);
  assert.equal(target.showObservedCellForm, false);
  assert.equal(target.nextView, "home");
  assert.equal(target.reason, NO_MORPHOLOGY_VISUAL_TARGET);
  assert.equal(JSON.stringify(target).includes("109005"), false);
});

test("switching from an exact morphology to the PKD2L1 functional profile clears geometry instead of reusing a generic cell", () => {
  const target = resolve({ focusKind: "molecular_profile", focusId: "crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn" });
  assert.deepEqual(target, {
    status: "cleared",
    neuronId: null,
    showObservedCellForm: false,
    nextView: "home",
    fidelityMode: "observed_swc",
    reason: NO_MORPHOLOGY_VISUAL_TARGET,
    modeReason: null,
    focusBinding: null,
    sourceSpecificViewer: null,
  });
});

test("switching a molecular profile while a cross-region reference is open returns to the neutral atlas view", () => {
  for (const currentView of ["internal_reference", "microns_observed_reference"]) {
    const target = resolve(
      { focusKind: "molecular_profile", focusId: "crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn" },
      { currentView },
    );
    assert.equal(target.nextView, "home");
    assert.equal(target.neuronId, null);
    assert.equal(target.reason, NO_MORPHOLOGY_VISUAL_TARGET);
  }
});

test("a supplied admitted 109006 focus replaces 109005 atomically with exact 109006", () => {
  const target = resolve(
    { focusKind: "morphology_record", focusId: "NeuroMorpho:109006" },
    {
      admittedMainSceneNeuronIds: [109005, 109006],
      sourceDiameterNeuronIds: [109005, 109006],
    },
  );
  assert.equal(target.status, "exact_main_scene_morphology");
  assert.equal(target.neuronId, 109006);
  assert.equal(target.showObservedCellForm, true);
  assert.equal(target.nextView, "cell_detail");
  assert.equal(target.fidelityMode, "radius_surface");
  assert.deepEqual(target.focusBinding, {
    focusKind: "morphology_record",
    focusId: "NeuroMorpho:109006",
    neuronId: 109006,
  });
});

test("production NMO 109006 is viewer-only and never falls back to a main-scene form", () => {
  const target = resolve({ focusKind: "morphology_record", focusId: "NeuroMorpho:109006" });
  assert.equal(target.status, "source_specific_viewer_only");
  assert.equal(target.neuronId, null);
  assert.equal(target.showObservedCellForm, false);
  assert.equal(target.nextView, "home");
  assert.equal(target.reason, SOURCE_SPECIFIC_MORPHOLOGY_VIEWER_ONLY);
  assert.deepEqual(target.sourceSpecificViewer, {
    lab: "morphology",
    focusId: "NeuroMorpho:109006",
    neuronId: 109006,
  });
});

test("a syntactically valid but unadmitted NeuroMorpho ID fails closed", () => {
  const target = resolve({ focusKind: "morphology_record", focusId: "NeuroMorpho:999999" });
  assert.equal(target.status, "cleared");
  assert.equal(target.neuronId, null);
  assert.equal(target.sourceSpecificViewer, null);
  assert.equal(target.reason, MORPHOLOGY_FOCUS_NOT_ADMITTED);
});

test("invalid focus fails closed without a prior neuron identity", () => {
  for (const focus of [null, {}, { focusKind: "morphology_record", focusId: "NeuroMorpho:109005:extra" }]) {
    const target = resolve(focus);
    assert.equal(target.neuronId, null);
    assert.equal(target.showObservedCellForm, false);
    assert.equal(target.nextView, "home");
  }
  assert.equal(resolve(null).reason, INVALID_RESEARCH_VISUAL_TARGET);
  assert.equal(parseNeuroMorphoFocusId("NeuroMorpho:109005"), 109005);
  assert.equal(parseNeuroMorphoFocusId("NeuroMorpho:0"), null);
});

test("a no-diameter exact morphology forces observed skeleton mode", () => {
  const target = resolve({ focusKind: "morphology_record", focusId: "NeuroMorpho:242822" });
  assert.equal(target.status, "exact_main_scene_morphology");
  assert.equal(target.neuronId, 242822);
  assert.equal(target.fidelityMode, "observed_swc");
  assert.equal(target.modeReason, SOURCE_DIAMETER_UNAVAILABLE_SKELETON_REQUIRED);
});

test("explicit selection binds research focus only through the supplied current index", () => {
  const options = {
    neuronId: 45718,
    admittedMainSceneNeuronIds: productionMainSceneIds,
    admittedSourceViewerNeuronIds: productionSourceViewerIds,
    sourceDiameterNeuronIds: [45718],
    requestedFidelityMode: "observed_swc",
    currentView: "home",
  };
  const indexed = resolveExplicitMorphologySelection({
    ...options,
    indexedMorphologyFocusIds: ["NeuroMorpho:45718"],
  });
  assert.deepEqual(indexed.researchFocus, {
    focusKind: "morphology_record",
    focusId: "NeuroMorpho:45718",
  });

  const absent = resolveExplicitMorphologySelection({
    ...options,
    indexedMorphologyFocusIds: ["NeuroMorpho:109005"],
  });
  assert.equal(absent.researchFocus, null);
  assert.equal(absent.focusUpdateReason, "morphology_focus_not_present_in_current_index");
});

test("AtlasPrototype clears the renderer target, old lane label and selected-morphology export fields", () => {
  assert.match(atlasPrototypeSource, /showObservedCellForm=\{morphologyVisibleRequested\}/);
  assert.match(atlasPrototypeSource, /observedCellFormId=\{viewportMorphologyNeuronId \?\? 0\}/);
  assert.match(atlasPrototypeSource, /\{morphologyVisibleRequested && view !== "internal_reference" && view !== "microns_observed_reference" && <div className="observed-cell-lane-label">/);
  assert.match(atlasPrototypeSource, /data-reason=\{morphologyVisualTarget\.reason\}/);
  assert.match(atlasPrototypeSource, /data-focus-id=\{researchFocus\?\.focusId \?\? "none"\}/);
  assert.match(atlasPrototypeSource, /0 admitted main-scene geometry/);
  assert.match(atlasPrototypeSource, /source-record fingerprint and evidence delta updated · main-scene geometry cleared because no same-cell morphology is admitted/);
  assert.match(atlasPrototypeSource, /selectedObservedCellFormAssetId: activeObservedCellForm\?\.assetId \?\? null/);
  assert.match(atlasPrototypeSource, /activeObservedCellFidelity\?\.geometry\.sha256 \?\? null/);
  assert.match(atlasPrototypeSource, /morphologyRuntimeReason: guardedMorphologyRuntime\.reason/);
  assert.match(atlasPrototypeSource, /observedMorphologyRoute: morphologyTargetActive && observedMorphologyRoute \? \{/);
  assert.match(atlasPrototypeSource, /releaseId: morphologyTargetActive && frozenObservedCellFormRecord \? observedCellFormLens\.releaseId : null/);
  assert.match(atlasPrototypeSource, /sourceObject: morphologyTargetActive && frozenObservedCellFormRecord \? observedCellFormLens\.sourceObject : null/);
  assert.match(atlasPrototypeSource, /selectedRecord: morphologyTargetActive \? frozenObservedCellFormRecord : null/);
  assert.match(atlasPrototypeSource, /renderingContract: morphologyTargetActive && frozenObservedCellFormRecord \? observedCellFormLens\.renderingContract : null/);
  assert.match(atlasPrototypeSource, /hardBoundaries: morphologyTargetActive && frozenObservedCellFormRecord \? observedCellFormLens\.hardBoundaries : \[\]/);
  assert.match(atlasPrototypeSource, /releaseId: morphologyTargetActive && frozenMorphologyFidelityRecord \? morphologyFidelityContract\.releaseId : null/);
  assert.match(atlasPrototypeSource, /sourceObjects: morphologyTargetActive && frozenMorphologyFidelityRecord \? morphologyFidelityContract\.sourceObjects : null/);
  assert.match(atlasPrototypeSource, /selectedContractRecord: morphologyTargetActive \? frozenMorphologyFidelityRecord : null/);
  assert.match(atlasPrototypeSource, /routeSourceObjects: morphologyTargetActive \? observedMorphologyRoute\?\.sourceObjects \?\? null : null/);
  assert.match(atlasPrototypeSource, /selectedObservedMorphologyRouteId: morphologyTargetActive \? observedMorphologyRoute\?\.routeId \?\? null : null/);
  assert.match(atlasPrototypeSource, /morphologyTargetActive \? observedMorphologyRoute\?\.contractId \?\? null : null/);
  assert.match(atlasPrototypeSource, /!morphologyTargetActive\s*\? \[\]\s*:\s*frozenMorphologyFidelityRecord/);
  assert.match(atlasPrototypeSource, /!hasExplicitResearchFocusParams\s*&& Number\.isInteger\(requestedObservedCellFormId\)/);
});

test("AtlasPrototype applies one focus workspace transition to lab, evidence panel and visual target", () => {
  assert.match(atlasPrototypeSource, /const applyResearchFocusWorkspace = useCallback/);
  assert.match(atlasPrototypeSource, /setResearchFocus\(canonicalFocus\);\s+setResearchLab\(workspace\.lab as LabTab\);\s+setSidePanel\(workspace\.panel as SidePanel\);\s+setResearchFocusView\("summary"\);\s+applyResolvedVisualTarget\(target\)/);
  assert.match(atlasPrototypeSource, /updateObservedCellForm[\s\S]*?applyResearchFocusWorkspace\(target\.researchFocus as ResearchFocus, target\)/);
  assert.match(atlasPrototypeSource, /<ResearchFocusEvidencePanel[\s\S]*?focus=\{researchFocus\}[\s\S]*?sciEntity=\{selected\}/);
  assert.doesNotMatch(atlasPrototypeSource, /function EmptyEvidencePanel/);
});

test("record-aware evidence rail keeps molecular geometry empty and morphology receipts source-bound", () => {
  assert.match(researchFocusEvidenceSource, /record\.focusKind === "molecular_profile"[\s\S]*?0 admitted cell-geometry primitives/);
  assert.match(researchFocusEvidenceSource, /record\.focusKind === "morphology_record"[\s\S]*?Exact source-local visual target/);
  assert.match(researchFocusEvidenceSource, /selectResearchEvidencePreviewRows\(record, 8\)/);
  assert.match(researchFocusEvidenceSource, /shared dataset\/project limits · consolidated/);
  assert.match(researchFocusEvidenceSource, /No previous record or generic cell is shown/);
});

test("AtlasPrototype retains a dormant SCI selection but exposes it only for an SCI-entity focus", () => {
  assert.match(atlasPrototypeSource, /const \{ retainedSelectedId, activeSelectedId, rovingPopulationId \} = resolveSciSelectionState/);
  assert.match(atlasPrototypeSource, /selectedId: retainedSelectedId/);
  assert.match(atlasPrototypeSource, /if \(retainedSelectedId\) params\.set\("cell", retainedSelectedId\)/);
  assert.match(atlasPrototypeSource, /<SceneCanvas[\s\S]*?selectedId=\{activeSelectedId\}/);
  assert.match(atlasPrototypeSource, /aria-pressed=\{entity\.id === activeSelectedId\}/);
  assert.match(atlasPrototypeSource, /tabIndex=\{entity\.id === rovingPopulationId \? 0 : -1\}/);
  assert.match(atlasPrototypeSource, /entityId=\{activeSelectedId\}/);
});

test("SCI selection state separates active highlight, dormant persistence and keyboard entry", () => {
  const admittedEntityIds = ["sci-a", "sci-b", "sci-c"];

  assert.deepEqual(resolveSciSelectionState({
    selectedId: "sci-a",
    researchFocus: { focusKind: "molecular_profile", focusId: "profile-i1" },
    admittedEntityIds,
    visibleEntityIds: ["sci-a", "sci-b"],
  }), {
    retainedSelectedId: "sci-a",
    activeSelectedId: null,
    rovingPopulationId: "sci-a",
  });

  assert.deepEqual(resolveSciSelectionState({
    selectedId: null,
    researchFocus: { focusKind: "molecular_profile", focusId: "profile-i1" },
    admittedEntityIds,
    visibleEntityIds: ["sci-b", "sci-c"],
  }), {
    retainedSelectedId: null,
    activeSelectedId: null,
    rovingPopulationId: "sci-b",
  });

  assert.deepEqual(resolveSciSelectionState({
    selectedId: "sci-a",
    researchFocus: { focusKind: "sci_entity", focusId: "sci-b" },
    admittedEntityIds,
    visibleEntityIds: ["sci-a", "sci-b"],
  }), {
    retainedSelectedId: "sci-b",
    activeSelectedId: "sci-b",
    rovingPopulationId: "sci-b",
  });

  assert.deepEqual(resolveSciSelectionState({
    selectedId: "sci-a",
    researchFocus: { focusKind: "molecular_profile", focusId: "profile-i2" },
    admittedEntityIds,
    visibleEntityIds: ["sci-b", "sci-c"],
  }), {
    retainedSelectedId: "sci-a",
    activeSelectedId: null,
    rovingPopulationId: "sci-b",
  });
});

test("AtlasPrototype canonicalizes imported and restored SCI focus without inventing a null selection", () => {
  assert.match(atlasPrototypeSource, /function canonicalSciSelectedId/);
  assert.match(atlasPrototypeSource, /setSelectedId\(canonicalSciSelectedId\([\s\S]*?locationState\.selectedId,[\s\S]*?locationState\.research\.selectedResearchObject/);
  assert.match(atlasPrototypeSource, /setSelectedId\(canonicalSciSelectedId\([\s\S]*?imported\.selectedId,[\s\S]*?imported\.research\.selectedResearchObject/);
});

test("SceneCanvas target deactivation aborts the previous fetch effect and disposes old geometry", () => {
  assert.match(sceneCanvasSource, /morphologyTargetActive: boolean/);
  assert.match(sceneCanvasSource, /context\.observedCellRoot\.children\.forEach\(\(child\) => disposeObject\(child\)\);\s+context\.observedCellRoot\.clear\(\);\s+if \(!morphologyTargetActive\)/);
  assert.match(sceneCanvasSource, /requestedNeuronId: 0[\s\S]*reason: "no_admitted_morphology_target"/);
  assert.match(sceneCanvasSource, /\[morphologyFidelityMode, morphologyTargetActive, observedCellFormId, publishMorphologyRuntime\]/);
  assert.match(atlasPrototypeSource, /morphologyTargetActive=\{morphologyTargetActive\}/);
});
