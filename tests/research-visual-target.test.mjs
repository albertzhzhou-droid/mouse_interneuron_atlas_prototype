import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  INVALID_RESEARCH_VISUAL_TARGET,
  MORPHOLOGY_FOCUS_NOT_ADMITTED,
  NO_MORPHOLOGY_VISUAL_TARGET,
  SOURCE_DIAMETER_UNAVAILABLE_SKELETON_REQUIRED,
  parseNeuroMorphoFocusId,
  resolveExplicitMorphologySelection,
  resolveResearchVisualTarget,
  resolveSciSelectionState,
} from "../app/research-visual-target.js";

const atlasPrototypeSource = await readFile(
  new URL("../app/AtlasPrototype.tsx", import.meta.url),
  "utf8",
);
const atlasTypesSource = await readFile(
  new URL("../app/atlas-types.ts", import.meta.url),
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
const censusMainSceneIndex = JSON.parse(await readFile(
  new URL("../data/neuromorpho-census-main-scene-index-0.1.json", import.meta.url),
  "utf8",
));

const supplementaryMainSceneIds = [45674, 45718, 50394, 50408, 50424, 170035, 249676];
const productionMainSceneIds = [
  ...censusMainSceneIndex.records.map((record) => record.neuronId),
  ...supplementaryMainSceneIds,
];
const productionSourceViewerIds = [...productionMainSceneIds, 109006];
const sourceDiameter3dIds = censusMainSceneIndex.records
  .filter((record) => record.geometry.dimensionality === "3D" && record.geometry.sourceDiameterAvailable)
  .map((record) => record.neuronId);

function resolve(focus, options = {}) {
  return resolveResearchVisualTarget({
    focus,
    admittedMainSceneNeuronIds: productionMainSceneIds,
    admittedSourceViewerNeuronIds: productionSourceViewerIds,
    sourceDiameterNeuronIds: sourceDiameter3dIds,
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

test("production NMO 109006 resolves through its newly admitted checksum-pinned census record", () => {
  const target = resolve({ focusKind: "morphology_record", focusId: "NeuroMorpho:109006" });
  assert.equal(target.status, "exact_main_scene_morphology");
  assert.equal(target.neuronId, 109006);
  assert.equal(target.showObservedCellForm, true);
  assert.equal(target.nextView, "cell_detail");
  assert.equal(censusMainSceneIndex.records.some((record) => record.neuronId === 109006), true);
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

test("every checksum-pinned census ID is a main-scene target, while a 2D diameter record stays planar", () => {
  const target = resolve({ focusKind: "morphology_record", focusId: "NeuroMorpho:194468" });
  assert.equal(target.status, "exact_main_scene_morphology");
  assert.equal(target.neuronId, 194468);
  assert.equal(target.fidelityMode, "observed_swc", "the 2D source record has no 3D surface authorization");
  assert.ok(censusMainSceneIndex.records.every((record) => productionMainSceneIds.includes(record.neuronId)));
  assert.match(atlasTypesSource, /sourceRadiusAvailable && record\.geometry\.dimensionality === "3D"/);
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
    resolvableMorphologyFocusIds: ["NeuroMorpho:45718"],
  });
  assert.deepEqual(indexed.researchFocus, {
    focusKind: "morphology_record",
    focusId: "NeuroMorpho:45718",
  });

  const absent = resolveExplicitMorphologySelection({
    ...options,
    resolvableMorphologyFocusIds: ["NeuroMorpho:109005"],
  });
  assert.equal(absent.researchFocus, null);
  assert.equal(absent.focusUpdateReason, "morphology_focus_not_resolvable_by_active_record_loader");
});

test("AtlasPrototype clears the renderer target, old lane label and selected-morphology export fields", () => {
  assert.match(atlasPrototypeSource, /showObservedCellForm=\{morphologyVisibleRequested\}/);
  assert.match(atlasPrototypeSource, /observedCellFormId=\{viewportMorphologyNeuronId \?\? 0\}/);
  assert.match(atlasPrototypeSource, /\{morphologyActuallyVisible && view !== "internal_reference" && view !== "microns_observed_reference" && <div className="observed-cell-lane-label">/);
  assert.match(atlasPrototypeSource, /data-reason=\{morphologyVisualTarget\.reason\}/);
  assert.match(atlasPrototypeSource, /data-focus-id=\{researchFocus\?\.focusId \?\? "none"\}/);
  assert.match(atlasPrototypeSource, /0 admitted main-scene geometry/);
  assert.match(atlasPrototypeSource, /if \(target\.neuronId === null\) \{\s+setShowObservedCellForm\(false\);\s+setMorphologyFidelityMode\("observed_swc"\);\s+setMorphologyRuntime\(clearedMorphologyRuntime\(target\.reason\)\);\s+return;/);
  assert.match(atlasPrototypeSource, /selectedObservedCellFormAssetId: activeObservedCellForm\?\.assetId \?\? null/);
  assert.match(atlasPrototypeSource, /activeObservedCellFidelity\?\.geometry\.sha256 \?\? null/);
  assert.match(atlasPrototypeSource, /morphologyRuntimeReason: guardedMorphologyRuntime\.reason/);
  assert.match(atlasPrototypeSource, /observedMorphologyRoute: morphologyTargetActive && observedMorphologyRoute \? \{/);
  assert.match(atlasPrototypeSource, /frozenObservedCellFormRecord \? observedCellFormLens\.releaseId : censusIndexRecord \? neuromorphoCensusMainSceneIndex\.releaseId : null/);
  assert.match(atlasPrototypeSource, /frozenObservedCellFormRecord \? observedCellFormLens\.sourceObject : censusIndexRecord \? neuromorphoCensusMainSceneIndex\.source\.censusIndex : null/);
  assert.match(atlasPrototypeSource, /selectedRecord: morphologyTargetActive \? frozenObservedCellFormRecord : null/);
  assert.match(atlasPrototypeSource, /renderingContract: morphologyTargetActive && frozenObservedCellFormRecord \? observedCellFormLens\.renderingContract : null/);
  assert.match(atlasPrototypeSource, /CHECKSUM_PINNED_NEUROMORPHO_CENSUS_MAIN_SCENE_INDEX/);
  assert.match(atlasPrototypeSource, /selectedCensusIndexRecord: morphologyTargetActive \? censusIndexRecord : null/);
  assert.match(atlasPrototypeSource, /neuromorphoCensusMainSceneIndex\.scientificBoundary\.geometry/);
  assert.match(atlasPrototypeSource, /frozenMorphologyFidelityRecord \? morphologyFidelityContract\.releaseId : censusIndexRecord \? neuromorphoCensusMainSceneIndex\.releaseId : null/);
  assert.match(atlasPrototypeSource, /frozenMorphologyFidelityRecord \? morphologyFidelityContract\.sourceObjects : censusIndexRecord \? neuromorphoCensusMainSceneIndex\.source : null/);
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
  assert.match(sceneCanvasSource, /function clearSourceGeometryRoot\(root: THREE\.Group\)[\s\S]*?root\.children\.forEach\(\(child\) => disposeObject\(child\)\);[\s\S]*?root\.clear\(\);[\s\S]*?root\.userData = \{\};/);
  assert.match(sceneCanvasSource, /clearSourceGeometryRoot\(context\.observedCellRoot\);\s+if \(!morphologyTargetActive\)/);
  assert.match(sceneCanvasSource, /requestedNeuronId: 0[\s\S]*reason: "no_admitted_morphology_target"/);
  assert.match(sceneCanvasSource, /\[morphologyFidelityMode, morphologyTargetActive, observedCellFormId, publishMorphologyRuntime, sourceSceneEpoch, clearInspection, fitSourceCamera\]/);
  assert.match(sceneCanvasSource, /useLayoutEffect\(\(\) => \{\s+morphologyLoadEpochRef\.current \+= 1;\s+clearInspection\(\);\s+const root = contextRef\.current\?\.observedCellRoot;\s+if \(root\) clearSourceGeometryRoot\(root\);\s+if \(contextRef\.current\) \{\s+contextRef\.current\.sourceGeometry = null;[\s\S]*?\[morphologyFidelityMode, morphologyTargetActive, observedCellFormId, sourceSceneEpoch, clearInspection\]/);
  assert.match(sceneCanvasSource, /return \(\) => controller\.abort\(\);\s+\}, \[morphologyFidelityMode, morphologyTargetActive, observedCellFormId, publishMorphologyRuntime, sourceSceneEpoch, clearInspection, fitSourceCamera\]/);
  assert.match(atlasPrototypeSource, /morphologyTargetActive=\{morphologyTargetActive\}/);
});
