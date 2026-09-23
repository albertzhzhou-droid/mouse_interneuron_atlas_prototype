"use client";

import neuromorphoUniverseRosterJson from "../data/neuromorpho-no-age-query-universe-roster-0.1.json";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import SceneCanvas, {
  type CameraView,
  type MicronsClippingState,
  type MicronsClippingRuntimeReceipt,
  type MicronsObservedReferenceRuntimeReceipt,
  type MorphologyFidelityMode,
  type MorphologyRuntimeReceipt,
  type RenderPerformance,
  type ViewportCapture,
} from "./SceneCanvas";
import PublicDataWorkbench, {
  filterPublicDataSources,
  type PublicDataCatalogState,
} from "./PublicDataWorkbench";
import CuratorFeedbackInbox from "./CuratorFeedbackInbox";
import InternalStructureReferencePanel from "./InternalStructureReferencePanel";
import NativeContourRecordViewer from "./NativeContourRecordViewer";
import ResearchFocusEvidencePanel from "./ResearchFocusEvidencePanel";
import ResearchRecordModelReadout from "./ResearchRecordModelReadout";
import {
  ResearchActiveRecordProvider,
  useResearchActiveRecordLoader,
} from "./ResearchActiveRecordProvider";
import ResearchDataLab, {
  normalizedResearchLabTab,
  type LabTab,
} from "./ResearchDataLab";
import type { MatsonSciTimepoint } from "./MatsonSciTimecourseExplorer";
import type {
  ResearchFocus,
  ResearchFocusView,
  ResearchRecord,
} from "./ResearchExplorer";
import {
  DEFAULT_RESEARCH_FOCUS,
  RESEARCH_FOCUS_KINDS,
  parseResearchFocus,
} from "./research-explorer-index.js";
import { resolveResearchFocusWorkspaceState } from "./research-focus-workspace-state.js";
import {
  SOURCE_SPECIFIC_MORPHOLOGY_VIEWER_ONLY,
  resolveExplicitMorphologySelection,
  resolveResearchVisualTarget,
  resolveSciSelectionState,
} from "./research-visual-target.js";
import { normalizeMatsonSciTimepoint } from "./matson-sci-timecourse.js";
import { validateMicronsImportProvenance } from "./microns-import-provenance.js";
import {
  buildMicronsClipRuntimeReceipt,
  clampMicronsClipPosition,
  defaultMicronsClipState,
  micronsClipSomaPosition,
  parseMicronsClipUrlState,
  validateMicronsClipState,
} from "./microns-source-native-clipping.js";
import {
  ComparisonPanel,
  GapsPanel,
  RESEARCH_CONDITION_IDS,
} from "./ResearchEvidencePanels";
import {
  TRANSMITTER_COLORS,
  atlasRelease,
  benchmarkSnapshot,
  crossLaneRelationshipAdmission,
  evidenceAware3dRepresentationContract,
  evidenceFeasibilityPlanner,
  evidenceProvenanceTrace,
  micronsObservedCellNucleusReference,
  micronsSourceNativeClipping,
  morphologyFidelityContract,
  morphologyFidelityRecords,
  observedCellFormLens,
  observedCellFormRecords,
  observedMorphologyRouteByNeuronId,
  grpDorsalHornObservedMorphology,
  publicSourceAssertionProvenance,
  publicSourceAuthorizationPlan,
  publicSourceIndependentAuthorizationEvidence,
  publicSourceReleaseAdmissionService,
  PUBLIC_DATA_ADMISSION_STATUSES,
  publicDataCatalog,
  publicSourceIntakeRegistry,
  publicSourceIntakes,
  researchMvpManifest,
  researchMvpRelease,
  researchSourceRegistrySummary,
  neurolucidaNativeContourAdmissionCatalog,
  type AtlasEntity,
  type PublicDataAdmissionStatus,
  type Transmitter,
} from "./atlas-types";
import { formatResearchSourceRegistrySummary } from "./research-source-registry-summary.js";

type Filters = {
  transmitter: "all" | Transmitter;
  segment: "all" | AtlasEntity["segmentGroup"];
  endpoint: "all" | AtlasEntity["endpoint"];
  injury: string;
};

type LayerState = {
  scaffold: boolean;
  gray: boolean;
  entities: boolean;
  observedForm: boolean;
  micronsCellSurface: boolean;
  micronsNucleus: boolean;
};
type ResearchVisualTarget = ReturnType<typeof resolveResearchVisualTarget> & { nextView: CameraView };

type SidePanel = "evidence" | "structure" | "compare" | "gaps" | "sources" | "benchmarks" | "review";
const SIDE_PANELS: SidePanel[] = ["evidence", "structure", "compare", "gaps", "sources", "benchmarks", "review"];
const CAMERA_VIEWS: CameraView[] = ["home", "cell_detail", "microns_observed_reference", "internal_reference", "dorsal", "right", "transverse"];
const SIDE_PANEL_LABELS: Record<SidePanel, string> = {
  evidence: "Evidence",
  structure: "Structure",
  compare: "Compare",
  gaps: "Gaps",
  sources: "Sources",
  benchmarks: "Bench",
  review: "Admin",
};

type PersistentAtlasState = {
  selectedId: string | null;
  search: string;
  filters: Filters;
  cameraPreset: CameraView;
  sliceZ: number;
  layers: LayerState;
  micronsClipping: MicronsClippingState;
  observedCellFormId: number;
  morphologyFidelityMode: MorphologyFidelityMode;
  panel: SidePanel;
  comparisonIds: string[];
  catalog: PublicDataCatalogState;
  research: {
    selectedResearchObject: ResearchFocus | null;
    lab: LabTab;
    query: string;
    view: ResearchFocusView;
    sciTimepoint: MatsonSciTimepoint;
  };
};

const DEFAULT_FILTERS: Filters = {
  transmitter: "all",
  segment: "all",
  endpoint: "all",
  injury: "all",
};

const DEFAULT_SELECTED = "mouse.sc.vsx2_hoxa10";
const ATLAS_ENTITY_IDS = atlasRelease.entities.map((entity) => entity.id);
const OBSERVED_CELL_FORM_IDS = observedCellFormRecords.map((record) => record.neuronId);
const NEUROMORPHO_UNIVERSE_VIEWER_IDS = (neuromorphoUniverseRosterJson as {
  admittedNeuronIds: number[];
}).admittedNeuronIds;
const SOURCE_DIAMETER_NEURON_IDS = morphologyFidelityRecords
  .filter((record) => record.modes.radiusSurface.available)
  .map((record) => record.neuronId);
const INDEXED_MAIN_SCENE_MORPHOLOGY_FOCUS_IDS = OBSERVED_CELL_FORM_IDS
  .map((neuronId) => `NeuroMorpho:${neuronId}`);
const DEFAULT_OBSERVED_CELL_FORM_ID = observedCellFormLens.defaultNeuronId;
const DEFAULT_MORPHOLOGY_FIDELITY_MODE = morphologyFidelityContract.defaultMode as MorphologyFidelityMode;
const MORPHOLOGY_FIDELITY_MODES: MorphologyFidelityMode[] = ["observed_swc", "radius_surface"];
const DEFAULT_CATALOG_SOURCE = "PDS-SPINALJ-PROCESSED";
const RESEARCH_FOCUS_VIEWS: ResearchFocusView[] = ["summary", "evidence", "gaps", "provenance"];
const DEFAULT_FOCUS_BY_LAB: Partial<Record<LabTab, ResearchFocus>> = {
  types: { focusKind: "molecular_profile", focusId: "sathyamurthy-2018:DE-1" },
  sci: { focusKind: "sci_population", focusId: "matson-2022:GSE172167:Cpne4_Neurons" },
  atlas: { focusKind: "anatomy_label", focusId: "allen_cord_20um:3.0:interneuron-focused_reference:1" },
  morphology: { focusKind: "morphology_record", focusId: "NeuroMorpho:109005" },
  coverage: { focusKind: "source_lane", focusId: "russ-2021" },
};
export type InitialAtlasParams = Record<string, string | string[] | undefined>;
function morphologyFidelityRecord(neuronId: number) {
  const record = morphologyFidelityRecords.find((candidate) => candidate.neuronId === neuronId);
  if (!record) throw new Error(`No admitted morphology-fidelity record for NeuroMorpho ${neuronId}`);
  return record;
}

function sourceAuthorizesFidelityMode(neuronId: number, mode: MorphologyFidelityMode) {
  return mode === "observed_swc" || morphologyFidelityRecord(neuronId).modes.radiusSurface.available;
}

function canonicalSciSelectedId(selectedId: string | null, researchFocus: ResearchFocus | null) {
  return resolveSciSelectionState({
    selectedId,
    researchFocus,
    admittedEntityIds: ATLAS_ENTITY_IDS,
    visibleEntityIds: ATLAS_ENTITY_IDS,
  }).retainedSelectedId;
}

function pendingMorphologyRuntime(neuronId: number, mode: MorphologyFidelityMode): MorphologyRuntimeReceipt {
  const record = morphologyFidelityRecord(neuronId);
  return {
    requestedNeuronId: neuronId,
    requestedMode: mode,
    actualMode: null,
    assetId: record.assetId,
    geometrySha256: record.geometry.sha256,
    verificationStatus: "loading",
    sceneObjectStatus: "not_rendered",
    visible: false,
    algorithmId: null,
    reason: "checksum_verification_pending",
  };
}

function clearedMorphologyRuntime(reason: string): MorphologyRuntimeReceipt {
  return {
    requestedNeuronId: 0,
    requestedMode: "observed_swc",
    actualMode: null,
    assetId: null,
    geometrySha256: null,
    verificationStatus: "unavailable",
    sceneObjectStatus: "not_rendered",
    visible: false,
    algorithmId: null,
    reason,
  };
}

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readBooleanState(value: string | null, fallback: boolean) {
  if (value === "1" || value === "true" || value === "on") return true;
  if (value === "0" || value === "false" || value === "off") return false;
  return fallback;
}

function firstInitialParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function parseInitialResearchState(params: InitialAtlasParams, selectedId: string | null) {
  const normalized = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = firstInitialParam(value);
    if (first !== null) normalized.set(key, first);
  }
  const intentKeys = ["focusKind", "focusId", "type", "morphologyNeuron", "cellForm", "anatomyStructure", "coverageLane", "cell"];
  const hasResearchIntent = intentKeys.some((key) => normalized.has(key));
  const parsed = parseResearchFocus(normalized) as ResearchFocus | null;
  const selectedResearchObject = parsed
    ?? (!hasResearchIntent && selectedId
      ? { ...DEFAULT_RESEARCH_FOCUS } as ResearchFocus
      : null);
  const requestedLab = normalized.get("lab");
  // A focus parsed from the URL is an explicit record-selection intent and owns
  // its canonical workspace. The default SCI selection remains dormant when a
  // neutral lab-only URL (Sources, Positions, and similar) is restored.
  const focusWorkspace = parsed
    ? resolveResearchFocusWorkspaceState(parsed)
    : null;
  const lab = focusWorkspace?.status === "ready"
    ? focusWorkspace.lab as LabTab
    : requestedLab !== null
      ? normalizedResearchLabTab(requestedLab)
      : "overview";
  const requestedView = normalized.get("focusView") as ResearchFocusView | null;
  return {
    selectedResearchObject,
    lab,
    query: normalized.get("researchQuery") ?? "",
    view: requestedView && RESEARCH_FOCUS_VIEWS.includes(requestedView) ? requestedView : "summary" as ResearchFocusView,
    sciTimepoint: normalizeMatsonSciTimepoint(normalized.get("sciTime")) as MatsonSciTimepoint,
  };
}

function filterEntities(search: string, filters: Filters) {
  const query = search.trim().toLowerCase();
  return atlasRelease.entities.filter((entity) => {
    const searchable = [entity.name, entity.shortLabel, entity.segmentLabel, ...entity.markers, ...entity.classificationAxes]
      .join(" ")
      .toLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (filters.transmitter === "all" || entity.transmitter === filters.transmitter) &&
      (filters.segment === "all" || entity.segmentGroup === filters.segment) &&
      (filters.endpoint === "all" || entity.endpoint === filters.endpoint) &&
      (filters.injury === "all" || entity.injuryType === filters.injury)
    );
  });
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function requireOnlyKeys(record: Record<string, unknown>, allowed: string[], label: string) {
  const unexpected = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new Error(`${label} contains unsupported field ${unexpected[0]}`);
}

function validateImportedState(payload: unknown): PersistentAtlasState {
  if (!isPlainRecord(payload)) throw new Error("the JSON root must be an object");
  if (payload.releaseId !== researchMvpRelease.releaseId) throw new Error("releaseId does not match the current Research MVP release");
  if (payload.schemaVersion !== researchMvpRelease.schemaVersion) throw new Error("schemaVersion does not match the current Research MVP schema");
  if (
    !isPlainRecord(payload.releaseManifest)
    || payload.releaseManifest.manifestContentSha256 !== researchMvpManifest.manifestContentSha256
  ) {
    throw new Error("release manifest hash does not match the current Research MVP snapshot");
  }
  if ("publicDataCatalog" in payload) {
    if (!isPlainRecord(payload.publicDataCatalog)) throw new Error("publicDataCatalog must be an object");
    if (payload.publicDataCatalog.releaseId !== publicDataCatalog.releaseId) {
      throw new Error("publicDataCatalog.releaseId does not match the current public-data catalog");
    }
    if (payload.publicDataCatalog.schemaVersion !== publicDataCatalog.schemaVersion) {
      throw new Error("publicDataCatalog.schemaVersion does not match the current public-data catalog");
    }
    if (
      "intakeRegistryReleaseId" in payload.publicDataCatalog
      && payload.publicDataCatalog.intakeRegistryReleaseId !== publicSourceIntakeRegistry.releaseId
    ) {
      throw new Error("publicDataCatalog.intakeRegistryReleaseId does not match the current public-source intake registry");
    }
    if (
      "evidenceFeasibilityPlannerReleaseId" in payload.publicDataCatalog
      && payload.publicDataCatalog.evidenceFeasibilityPlannerReleaseId !== evidenceFeasibilityPlanner.releaseId
    ) {
      throw new Error("publicDataCatalog.evidenceFeasibilityPlannerReleaseId does not match the current feasibility planner");
    }
    if (
      "evidenceProvenanceTraceReleaseId" in payload.publicDataCatalog
      && payload.publicDataCatalog.evidenceProvenanceTraceReleaseId !== evidenceProvenanceTrace.releaseId
    ) {
      throw new Error("publicDataCatalog.evidenceProvenanceTraceReleaseId does not match the current provenance trace");
    }
    if (
      "crossLaneRelationshipAdmissionReleaseId" in payload.publicDataCatalog
      && payload.publicDataCatalog.crossLaneRelationshipAdmissionReleaseId !== crossLaneRelationshipAdmission.releaseId
    ) {
      throw new Error("publicDataCatalog.crossLaneRelationshipAdmissionReleaseId does not match the current relationship-admission gate");
    }
    if (
      "publicSourceReleaseAdmissionServiceReleaseId" in payload.publicDataCatalog
      && payload.publicDataCatalog.publicSourceReleaseAdmissionServiceReleaseId !== publicSourceReleaseAdmissionService.releaseId
    ) {
      throw new Error("publicDataCatalog.publicSourceReleaseAdmissionServiceReleaseId does not match the current source-admission service");
    }
    if (
      "publicSourceAssertionProvenanceReleaseId" in payload.publicDataCatalog
      && payload.publicDataCatalog.publicSourceAssertionProvenanceReleaseId !== publicSourceAssertionProvenance.releaseId
    ) {
      throw new Error("publicDataCatalog.publicSourceAssertionProvenanceReleaseId does not match the current assertion-provenance composer");
    }
    if (
      "publicSourceAuthorizationPlanReleaseId" in payload.publicDataCatalog
      && payload.publicDataCatalog.publicSourceAuthorizationPlanReleaseId !== publicSourceAuthorizationPlan.releaseId
    ) {
      throw new Error("publicDataCatalog.publicSourceAuthorizationPlanReleaseId does not match the current authorization-plan composer");
    }
    if (
      "publicSourceIndependentAuthorizationEvidenceReleaseId" in payload.publicDataCatalog
      && payload.publicDataCatalog.publicSourceIndependentAuthorizationEvidenceReleaseId !== publicSourceIndependentAuthorizationEvidence.releaseId
    ) {
      throw new Error("publicDataCatalog.publicSourceIndependentAuthorizationEvidenceReleaseId does not match the current independent-evidence composer");
    }
  }
  if (!isPlainRecord(payload.state)) throw new Error("state must be an object");

  const state = payload.state;
  requireOnlyKeys(
    state,
    ["selectedId", "search", "filters", "cameraPreset", "sliceZ", "layers", "micronsClipping", "observedCellFormId", "morphologyFidelityMode", "panel", "comparisonIds", "catalog", "research", "url"],
    "state",
  );
  if ("url" in state && typeof state.url !== "string") throw new Error("state.url must be a string when present");

  const selectedId = state.selectedId;
  if (selectedId !== null && (typeof selectedId !== "string" || !atlasRelease.entities.some((entity) => entity.id === selectedId))) {
    throw new Error("state.selectedId is not a current atlas entity");
  }
  if (typeof state.search !== "string" || state.search.length > 500) throw new Error("state.search must be a string of at most 500 characters");

  if (!isPlainRecord(state.filters)) throw new Error("state.filters must be an object");
  requireOnlyKeys(state.filters, ["transmitter", "segment", "endpoint", "injury"], "state.filters");
  const validTransmitters: Filters["transmitter"][] = ["all", "excitatory", "inhibitory", "mixed_or_unspecified", "state_dependent"];
  const validSegments: Filters["segment"][] = ["all", "cervical", "thoracic", "lumbar", "sacral"];
  const validEndpoints: Filters["endpoint"][] = ["all", "locomotion", "breathing", "spasm"];
  const validInjuries = ["all", ...new Set(atlasRelease.entities.map((entity) => entity.injuryType))];
  if (!validTransmitters.includes(state.filters.transmitter as Filters["transmitter"])) throw new Error("state.filters.transmitter is invalid");
  if (!validSegments.includes(state.filters.segment as Filters["segment"])) throw new Error("state.filters.segment is invalid");
  if (!validEndpoints.includes(state.filters.endpoint as Filters["endpoint"])) throw new Error("state.filters.endpoint is invalid");
  if (typeof state.filters.injury !== "string" || !validInjuries.includes(state.filters.injury)) throw new Error("state.filters.injury is invalid");
  const filters: Filters = {
    transmitter: state.filters.transmitter as Filters["transmitter"],
    segment: state.filters.segment as Filters["segment"],
    endpoint: state.filters.endpoint as Filters["endpoint"],
    injury: state.filters.injury,
  };

  if (!CAMERA_VIEWS.includes(state.cameraPreset as CameraView)) throw new Error("state.cameraPreset is invalid");
  if (typeof state.sliceZ !== "number" || !Number.isFinite(state.sliceZ) || state.sliceZ < -20 || state.sliceZ > 20 || !Number.isInteger(state.sliceZ * 2)) {
    throw new Error("state.sliceZ must be a finite 0.5-step value from -20 to 20");
  }

  if (!isPlainRecord(state.layers)) throw new Error("state.layers must be an object");
  requireOnlyKeys(state.layers, ["scaffold", "gray", "entities", "observedForm", "micronsCellSurface", "micronsNucleus"], "state.layers");
  if (typeof state.layers.scaffold !== "boolean" || typeof state.layers.gray !== "boolean" || typeof state.layers.entities !== "boolean") {
    throw new Error("state.layers values must be booleans");
  }
  if ("observedForm" in state.layers && typeof state.layers.observedForm !== "boolean") {
    throw new Error("state.layers.observedForm must be a boolean when present");
  }
  if ("micronsCellSurface" in state.layers && typeof state.layers.micronsCellSurface !== "boolean") {
    throw new Error("state.layers.micronsCellSurface must be a boolean when present");
  }
  if ("micronsNucleus" in state.layers && typeof state.layers.micronsNucleus !== "boolean") {
    throw new Error("state.layers.micronsNucleus must be a boolean when present");
  }
  const micronsClipping = "micronsClipping" in state
    ? validateMicronsClipState(state.micronsClipping, micronsSourceNativeClipping) as MicronsClippingState
    : defaultMicronsClipState(micronsSourceNativeClipping) as MicronsClippingState;
  validateMicronsImportProvenance(payload, state, micronsObservedCellNucleusReference, micronsSourceNativeClipping);
  const observedCellFormId = "observedCellFormId" in state
    ? state.observedCellFormId
    : DEFAULT_OBSERVED_CELL_FORM_ID;
  if (typeof observedCellFormId !== "number" || !OBSERVED_CELL_FORM_IDS.includes(observedCellFormId)) {
    throw new Error("state.observedCellFormId is not an admitted source-local cell form");
  }
  const importedFidelityMode = "morphologyFidelityMode" in state
    ? state.morphologyFidelityMode
    : sourceAuthorizesFidelityMode(observedCellFormId, DEFAULT_MORPHOLOGY_FIDELITY_MODE)
      ? DEFAULT_MORPHOLOGY_FIDELITY_MODE
      : "observed_swc";
  if (typeof importedFidelityMode !== "string" || !MORPHOLOGY_FIDELITY_MODES.includes(importedFidelityMode as MorphologyFidelityMode)) {
    throw new Error("state.morphologyFidelityMode is invalid");
  }
  const morphologyFidelityMode = importedFidelityMode as MorphologyFidelityMode;
  if (!sourceAuthorizesFidelityMode(observedCellFormId, morphologyFidelityMode)) {
    throw new Error("state.morphologyFidelityMode is not source-authorized for the selected morphology");
  }
  if (!SIDE_PANELS.includes(state.panel as SidePanel)) throw new Error("state.panel is invalid");

  if (!Array.isArray(state.comparisonIds) || state.comparisonIds.length > 4) throw new Error("state.comparisonIds must contain at most four IDs");
  if (!state.comparisonIds.every((id) => typeof id === "string" && RESEARCH_CONDITION_IDS.includes(id))) {
    throw new Error("state.comparisonIds contains an unknown condition");
  }
  if (new Set(state.comparisonIds).size !== state.comparisonIds.length) throw new Error("state.comparisonIds contains duplicate conditions");
  const comparisonIds = state.comparisonIds as string[];

  let catalog: PublicDataCatalogState = {
    query: "",
    admissionStatus: "all",
    selectedSourceId: DEFAULT_CATALOG_SOURCE,
    plannerAxisIds: [],
  };
  if ("catalog" in state) {
    if (!isPlainRecord(state.catalog)) throw new Error("state.catalog must be an object");
    requireOnlyKeys(state.catalog, ["query", "admissionStatus", "selectedSourceId", "plannerAxisIds"], "state.catalog");
    if (typeof state.catalog.query !== "string" || state.catalog.query.length > 300) {
      throw new Error("state.catalog.query must be a string of at most 300 characters");
    }
    const admissionStatus = state.catalog.admissionStatus;
    if (
      admissionStatus !== "all"
      && !PUBLIC_DATA_ADMISSION_STATUSES.includes(admissionStatus as PublicDataAdmissionStatus)
    ) {
      throw new Error("state.catalog.admissionStatus is invalid");
    }
    const selectedSourceId = state.catalog.selectedSourceId;
    if (
      selectedSourceId !== null
      && (typeof selectedSourceId !== "string" || !publicDataCatalog.sources.some((source) => source.id === selectedSourceId))
    ) {
      throw new Error("state.catalog.selectedSourceId is invalid");
    }
    const plannerAxisIds = "plannerAxisIds" in state.catalog ? state.catalog.plannerAxisIds : [];
    if (
      !Array.isArray(plannerAxisIds)
      || plannerAxisIds.length > evidenceFeasibilityPlanner.selectedAxisLimit
      || !plannerAxisIds.every((axisId) => typeof axisId === "string" && evidenceFeasibilityPlanner.axes.some((axis) => axis.id === axisId))
      || new Set(plannerAxisIds).size !== plannerAxisIds.length
    ) {
      throw new Error("state.catalog.plannerAxisIds is invalid");
    }
    catalog = {
      query: state.catalog.query,
      admissionStatus: admissionStatus as PublicDataCatalogState["admissionStatus"],
      selectedSourceId,
      plannerAxisIds: [...plannerAxisIds] as string[],
    };
  }

  let research: PersistentAtlasState["research"] = {
    selectedResearchObject: selectedId
      ? { focusKind: "sci_entity", focusId: selectedId }
      : null,
    lab: "overview",
    query: "",
    view: "summary",
    sciTimepoint: "all",
  };
  if ("research" in state) {
    if (!isPlainRecord(state.research)) throw new Error("state.research must be an object");
    requireOnlyKeys(state.research, ["selectedResearchObject", "lab", "query", "view", "sciTimepoint"], "state.research");
    const importedFocus = state.research.selectedResearchObject;
    let selectedResearchObject: ResearchFocus | null = null;
    if (importedFocus !== null) {
      if (!isPlainRecord(importedFocus)) throw new Error("state.research.selectedResearchObject must be an object or null");
      requireOnlyKeys(importedFocus, ["focusKind", "focusId"], "state.research.selectedResearchObject");
      if (
        typeof importedFocus.focusKind !== "string"
        || !RESEARCH_FOCUS_KINDS.includes(importedFocus.focusKind)
        || typeof importedFocus.focusId !== "string"
        || !importedFocus.focusId
      ) {
        throw new Error("state.research.selectedResearchObject is invalid");
      }
      selectedResearchObject = {
        focusKind: importedFocus.focusKind as ResearchFocus["focusKind"],
        focusId: importedFocus.focusId,
      };
    }
    const validLabs: LabTab[] = ["overview", "sources", "types", "sci", "positions", "atlas", "morphology", "coverage"];
    if (!validLabs.includes(state.research.lab as LabTab)) throw new Error("state.research.lab is invalid");
    if (typeof state.research.query !== "string" || state.research.query.length > 180) {
      throw new Error("state.research.query must be a string of at most 180 characters");
    }
    if (!RESEARCH_FOCUS_VIEWS.includes(state.research.view as ResearchFocusView)) {
      throw new Error("state.research.view is invalid");
    }
    const importedSciTimepoint = "sciTimepoint" in state.research ? state.research.sciTimepoint : "all";
    if (
      typeof importedSciTimepoint !== "string"
      || normalizeMatsonSciTimepoint(importedSciTimepoint) !== importedSciTimepoint
    ) {
      throw new Error("state.research.sciTimepoint is invalid");
    }
    const importedWorkspace = selectedResearchObject
      ? resolveResearchFocusWorkspaceState(selectedResearchObject)
      : null;
    research = {
      selectedResearchObject,
      lab: importedWorkspace?.status === "ready"
        ? importedWorkspace.lab as LabTab
        : state.research.lab as LabTab,
      query: state.research.query,
      view: state.research.view as ResearchFocusView,
      sciTimepoint: importedSciTimepoint as MatsonSciTimepoint,
    };
  }

  return {
    selectedId,
    search: state.search,
    filters,
    cameraPreset: state.cameraPreset as CameraView,
    sliceZ: state.sliceZ,
    layers: {
      scaffold: state.layers.scaffold,
      gray: state.layers.gray,
      entities: state.layers.entities,
      observedForm: "observedForm" in state.layers ? state.layers.observedForm as boolean : true,
      micronsCellSurface: "micronsCellSurface" in state.layers ? state.layers.micronsCellSurface as boolean : true,
      micronsNucleus: "micronsNucleus" in state.layers ? state.layers.micronsNucleus as boolean : true,
    },
    micronsClipping,
    observedCellFormId,
    morphologyFidelityMode,
    panel: state.panel as SidePanel,
    comparisonIds: [...comparisonIds],
    catalog,
    research,
  };
}

function csvCell(value: unknown) {
  const normalized = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
}

function filenameSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "filtered-view";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let lineY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      context.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) context.fillText(line, x, lineY);
}

async function createFallbackPng(
  selected: AtlasEntity | null,
  visibleCount: number,
  morphologyRuntime: MorphologyRuntimeReceipt,
  micronsRuntime: MicronsObservedReferenceRuntimeReceipt,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D export is unavailable");
  context.fillStyle = "#e7ece9";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#14231f";
  context.font = "700 42px Arial, sans-serif";
  context.fillText("Mouse Spinal Interneuron Atlas", 64, 92);
  context.font = "24px Arial, sans-serif";
  context.fillText("Accessible fallback snapshot · 3D rendering unavailable", 64, 140);
  context.fillStyle = "#0e7c66";
  context.font = "700 31px Arial, sans-serif";
  context.fillText(selected ? `Selected: ${selected.shortLabel}` : "No evidence entity selected", 64, 235);
  context.fillStyle = "#52615c";
  context.font = "23px Arial, sans-serif";
  context.fillText(`${visibleCount} evidence entities match the current filters`, 64, 282);
  context.fillStyle = "#182723";
  context.fillRect(0, 570, canvas.width, 150);
  context.fillStyle = "#ffd99d";
  context.font = "700 22px Arial, sans-serif";
  context.fillText(
    micronsRuntime.requested
      ? `MICRONS OBS REFERENCE · NO VERIFIED 3D GEOMETRY RENDERED · NO FALLBACK · 0 REG`
      : `SYN DATA ANCHORS · NOT CELLS · ${morphologyRuntime.assetId ?? `NMO ${morphologyRuntime.requestedNeuronId}`} · NO VERIFIED 3D MORPHOLOGY RENDERED · 0 REG`,
    64,
    620,
  );
  context.fillStyle = "#d7e3df";
  context.font = "20px Arial, sans-serif";
  wrapCanvasText(context, atlasRelease.fixedDisclaimer, 64, 662, 1148, 28);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG encoding failed")), "image/png");
  });
}

function parseInitialState(params: InitialAtlasParams) {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] ?? null : value ?? null;
  };
  const requestedEntity = read("cell");
  const requestedView = read("view") as CameraView | null;
  const requestedSliceRaw = read("slice");
  const requestedSlice = requestedSliceRaw === null || requestedSliceRaw.trim() === ""
    ? Number.NaN
    : Number(requestedSliceRaw);
  const requestedTransmitter = read("tx") as Filters["transmitter"] | null;
  const requestedSegment = read("segment") as Filters["segment"] | null;
  const requestedEndpoint = read("endpoint") as Filters["endpoint"] | null;
  const validTransmitters: Filters["transmitter"][] = ["all", "excitatory", "inhibitory", "mixed_or_unspecified", "state_dependent"];
  const validSegments: Filters["segment"][] = ["all", "cervical", "thoracic", "lumbar", "sacral"];
  const validEndpoints: Filters["endpoint"][] = ["all", "locomotion", "breathing", "spasm"];
  const validInjuries = ["all", ...new Set(atlasRelease.entities.map((entity) => entity.injuryType))];
  const requestedInjury = read("injury");
  const requestedPanel = read("panel") as SidePanel | null;
  const requestedComparison = (read("compare") ?? "")
    .split(",")
    .filter((id) => RESEARCH_CONDITION_IDS.includes(id))
    .slice(0, 4);
  const micronsClipping = parseMicronsClipUrlState(read, micronsSourceNativeClipping) as MicronsClippingState;
  const requestedCatalogStatus = read("catalog") as PublicDataCatalogState["admissionStatus"] | null;
  const requestedCatalogSource = read("source");
  const requestedPlannerAxes = (read("plan") ?? "")
    .split(",")
    .filter((axisId) => evidenceFeasibilityPlanner.axes.some((axis) => axis.id === axisId))
    .filter((axisId, index, items) => items.indexOf(axisId) === index)
    .slice(0, evidenceFeasibilityPlanner.selectedAxisLimit);
  const requestedObservedCellFormId = Number(read("cellForm"));
  const observedCellFormId = Number.isInteger(requestedObservedCellFormId)
    && OBSERVED_CELL_FORM_IDS.includes(requestedObservedCellFormId)
    ? requestedObservedCellFormId
    : DEFAULT_OBSERVED_CELL_FORM_ID;
  const requestedFidelity = read("cellFidelity");
  const requestedFidelityMode: MorphologyFidelityMode | null = requestedFidelity === "surface"
    ? "radius_surface"
    : requestedFidelity === "swc"
      ? "observed_swc"
      : null;
  const preferredFidelityMode = requestedFidelityMode ?? DEFAULT_MORPHOLOGY_FIDELITY_MODE;
  const morphologyFidelityMode = sourceAuthorizesFidelityMode(observedCellFormId, preferredFidelityMode)
    ? preferredFidelityMode
    : "observed_swc";
  const selectedId = atlasRelease.entities.some((entity) => entity.id === requestedEntity) ? requestedEntity! : DEFAULT_SELECTED;
  const hasExplicitResearchFocusParams = ["focusKind", "focusId", "type", "morphologyNeuron", "anatomyStructure", "coverageLane", "cell"]
    .some((key) => read(key) !== null);
  const requestedCameraView = CAMERA_VIEWS.includes(requestedView as CameraView)
    ? (requestedView as CameraView)
    : "cell_detail";
  const research = parseInitialResearchState(params, selectedId);
  const visualTarget = research.selectedResearchObject
    ? resolveResearchVisualTarget({
      focus: research.selectedResearchObject,
      admittedMainSceneNeuronIds: OBSERVED_CELL_FORM_IDS,
      admittedSourceViewerNeuronIds: NEUROMORPHO_UNIVERSE_VIEWER_IDS,
      sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
      requestedFidelityMode: morphologyFidelityMode,
      currentView: requestedCameraView,
    })
    : !hasExplicitResearchFocusParams
      && Number.isInteger(requestedObservedCellFormId)
      && OBSERVED_CELL_FORM_IDS.includes(requestedObservedCellFormId)
      ? resolveExplicitMorphologySelection({
        neuronId: requestedObservedCellFormId,
        indexedMorphologyFocusIds: INDEXED_MAIN_SCENE_MORPHOLOGY_FOCUS_IDS,
        admittedMainSceneNeuronIds: OBSERVED_CELL_FORM_IDS,
        admittedSourceViewerNeuronIds: NEUROMORPHO_UNIVERSE_VIEWER_IDS,
        sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
        requestedFidelityMode: morphologyFidelityMode,
        currentView: requestedCameraView,
      })
      : resolveResearchVisualTarget({
        focus: null,
        admittedMainSceneNeuronIds: OBSERVED_CELL_FORM_IDS,
        admittedSourceViewerNeuronIds: NEUROMORPHO_UNIVERSE_VIEWER_IDS,
        sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
        requestedFidelityMode: morphologyFidelityMode,
        currentView: requestedCameraView,
      });
  const activeObservedCellFormId = visualTarget.neuronId ?? observedCellFormId;
  const activeMorphologyFidelityMode = visualTarget.neuronId === null
    ? "observed_swc"
    : visualTarget.fidelityMode as MorphologyFidelityMode;
  const restoredCameraView = requestedCameraView === "internal_reference" || requestedCameraView === "microns_observed_reference"
    ? requestedCameraView
    : visualTarget.nextView as CameraView;
  const restoredVisualTarget = { ...visualTarget, nextView: restoredCameraView };
  return {
    selectedId,
    view: restoredCameraView,
    sliceZ: Number.isFinite(requestedSlice) ? Math.min(20, Math.max(-20, requestedSlice)) : -12,
    search: read("q") ?? "",
    filters: {
      transmitter: requestedTransmitter && validTransmitters.includes(requestedTransmitter) ? requestedTransmitter : "all",
      segment: requestedSegment && validSegments.includes(requestedSegment) ? requestedSegment : "all",
      endpoint: requestedEndpoint && validEndpoints.includes(requestedEndpoint) ? requestedEndpoint : "all",
      injury: requestedInjury && validInjuries.includes(requestedInjury) ? requestedInjury : "all",
    },
    layers: {
      scaffold: readBooleanState(read("scaffold"), true),
      gray: readBooleanState(read("gray"), true),
      entities: readBooleanState(read("entities"), true),
      observedForm: visualTarget.showObservedCellForm && readBooleanState(read("observedForm"), true),
      micronsCellSurface: readBooleanState(read("micronsCell"), true),
      micronsNucleus: readBooleanState(read("micronsNucleus"), true),
    } satisfies LayerState,
    micronsClipping,
    observedCellFormId: activeObservedCellFormId,
    morphologyFidelityMode: activeMorphologyFidelityMode,
    visualTarget: restoredVisualTarget,
    panel: requestedPanel && SIDE_PANELS.includes(requestedPanel) ? requestedPanel : "evidence" as const,
    comparisonIds: requestedComparison,
    catalog: {
      query: read("catalog_q") ?? "",
      admissionStatus: requestedCatalogStatus === "all" || PUBLIC_DATA_ADMISSION_STATUSES.includes(
        requestedCatalogStatus as PublicDataAdmissionStatus,
      )
        ? requestedCatalogStatus ?? "all"
        : "all",
      selectedSourceId: publicDataCatalog.sources.some((source) => source.id === requestedCatalogSource)
        ? requestedCatalogSource
        : DEFAULT_CATALOG_SOURCE,
      plannerAxisIds: requestedPlannerAxes,
    },
    research,
  };
}

function parseLocationState(search: string) {
  return parseInitialState(Object.fromEntries(new URLSearchParams(search)));
}

function CrossSectionInset({
  entities,
  selectedId,
  sliceZ,
  onSelect,
}: {
  entities: AtlasEntity[];
  selectedId: string | null;
  sliceZ: number;
  onSelect: (id: string) => void;
}) {
  const nearSlice = entities.filter((entity) => Math.abs(entity.geometry.schematicPosition[2] - sliceZ) <= 2.8);
  return (
      <div className="slice-inset" aria-label={`Separate synthetic evidence-lane guide at ${sliceZ.toFixed(1)} display units; not an atlas plane or anatomical placement`}>
      <div className="slice-inset-header">
        <span>SEPARATE SYN LANE</span>
        <strong>z {sliceZ.toFixed(1)}</strong>
      </div>
      <div className="cross-section-map" aria-label="Schematic coordinate frame without anatomical boundaries">
        <span className="direction dorsal">D</span>
        <span className="direction ventral">V</span>
        {nearSlice.map((entity) => {
          const [x, y] = entity.geometry.schematicPosition;
          return (
            <button
              type="button"
              key={entity.id}
              className={`slice-dot ${entity.id === selectedId ? "selected" : ""}`}
              style={{
                left: `calc(50% + ${x * 32}px)`,
                top: `calc(50% - ${y * 27}px)`,
                color: TRANSMITTER_COLORS[entity.transmitter],
              }}
              title={`${entity.shortLabel} · synthetic position`}
              aria-label={`Select ${entity.name}, synthetic position`}
              onClick={() => onSelect(entity.id)}
            />
          );
        })}
      </div>
      <p>{nearSlice.length ? `${nearSlice.length} synthetic entities in this separate lane · no atlas relationship` : "No prototype entities near this synthetic lane plane"}</p>
    </div>
  );
}

function BenchmarkPanel() {
  return (
    <div className="benchmark-panel">
      <div className="panel-heading evidence-title">
        <p className="panel-kicker">MARKET / RESEARCH BENCHMARKS</p>
        <h2>Reference architecture</h2>
        <p>Snapshot verified {benchmarkSnapshot.snapshotDate}</p>
      </div>
      <div className="benchmark-stack">
        {benchmarkSnapshot.resources.map((resource) => (
          <details key={resource.name} open={resource.name === "BrainGlobe allen_cord_20um"}>
            <summary>
              <strong>{resource.name}</strong>
              <span>{resource.role}</span>
            </summary>
            <ul>{resource.parameters.map((parameter) => <li key={parameter}>{parameter}</li>)}</ul>
            <p><b>Prototype mapping:</b> {resource.reused}</p>
            <p><b>Boundary:</b> {resource.notReused}</p>
            <a href={resource.url} target="_blank" rel="noreferrer">Official / primary source ↗</a>
          </details>
        ))}
      </div>
    </div>
  );
}

export default function AtlasPrototype({ initialParams = {} }: { initialParams?: InitialAtlasParams }) {
  const initial = parseInitialState(initialParams);
  const [selectedId, setSelectedId] = useState<string | null>(initial.selectedId);
  const [search, setSearch] = useState(initial.search);
  const [filters, setFilters] = useState<Filters>(initial.filters);
  const [view, setView] = useState<CameraView>(initial.view);
  const [sliceZ, setSliceZ] = useState(initial.sliceZ);
  const [showScaffold, setShowScaffold] = useState(initial.layers.scaffold);
  const [showGrayMatter, setShowGrayMatter] = useState(initial.layers.gray);
  const [showEntities, setShowEntities] = useState(initial.layers.entities);
  const [showObservedCellForm, setShowObservedCellForm] = useState(initial.layers.observedForm);
  const [showMicronsCellSurface, setShowMicronsCellSurface] = useState(initial.layers.micronsCellSurface);
  const [showMicronsNucleus, setShowMicronsNucleus] = useState(initial.layers.micronsNucleus);
  const [micronsClipping, setMicronsClipping] = useState<MicronsClippingState>(initial.micronsClipping);
  const [observedCellFormId, setObservedCellFormId] = useState(initial.observedCellFormId);
  const [morphologyFidelityMode, setMorphologyFidelityMode] = useState<MorphologyFidelityMode>(initial.morphologyFidelityMode);
  const [morphologyVisualTarget, setMorphologyVisualTarget] = useState<ResearchVisualTarget>(initial.visualTarget as ResearchVisualTarget);
  const [morphologyRuntime, setMorphologyRuntime] = useState<MorphologyRuntimeReceipt>(() => initial.visualTarget.neuronId === null
    ? clearedMorphologyRuntime(initial.visualTarget.reason)
    : pendingMorphologyRuntime(initial.observedCellFormId, initial.morphologyFidelityMode));
  const [micronsRuntime, setMicronsRuntime] = useState<MicronsObservedReferenceRuntimeReceipt>({
    contractId: micronsObservedCellNucleusReference.contractId,
    releaseId: micronsObservedCellNucleusReference.releaseId,
    requested: initial.view === "microns_observed_reference",
    verificationStatus: "idle",
    sceneObjectStatus: "not_rendered",
    cellSurfaceVisible: false,
    nucleusVisible: false,
    clipping: buildMicronsClipRuntimeReceipt(
      initial.micronsClipping,
      micronsSourceNativeClipping,
      micronsObservedCellNucleusReference.coordinateContract.displayTransformReceipt.canonical,
    ) as MicronsClippingRuntimeReceipt,
    expectedManifestSha256: micronsObservedCellNucleusReference.assetBundle.manifest.sha256,
    verifiedAssetReceipt: null,
    reason: "runtime_not_initialized",
  });
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [sidePanel, setSidePanel] = useState<SidePanel>(initial.panel);
  const [comparisonIds, setComparisonIds] = useState<string[]>(initial.comparisonIds);
  const [catalogState, setCatalogState] = useState<PublicDataCatalogState>(initial.catalog);
  const [researchFocus, setResearchFocus] = useState<ResearchFocus | null>(initial.research.selectedResearchObject);
  const researchActiveRecord = useResearchActiveRecordLoader(researchFocus);
  const [researchLab, setResearchLab] = useState<LabTab>(initial.research.lab);
  const [researchQuery, setResearchQuery] = useState(initial.research.query);
  const [researchFocusView, setResearchFocusView] = useState<ResearchFocusView>(initial.research.view);
  const [sciTimepoint, setSciTimepoint] = useState<MatsonSciTimepoint>(initial.research.sciTimepoint);
  const [notice, setNotice] = useState("Ready · source-local SWC fidelity is checksum-gated; unsupported diameter and internal detail fail closed");
  const [locationHydrated, setLocationHydrated] = useState(false);
  const [captureViewport, setCaptureViewport] = useState<ViewportCapture | null>(null);
  const [renderPerformance, setRenderPerformance] = useState<RenderPerformance | null>(null);
  const populationRefs = useRef(new Map<string, HTMLButtonElement>());
  const panelRefs = useRef(new Map<SidePanel, HTMLButtonElement>());
  const importInputRef = useRef<HTMLInputElement>(null);
  const morphologySelectionRef = useRef({
    neuronId: morphologyVisualTarget.neuronId as number | null,
    mode: morphologyFidelityMode,
  });

  useEffect(() => {
    morphologySelectionRef.current = {
      neuronId: morphologyVisualTarget.neuronId as number | null,
      mode: morphologyFidelityMode,
    };
  }, [morphologyFidelityMode, morphologyVisualTarget.neuronId]);

  const filteredEntities = useMemo(() => filterEntities(search, filters), [filters, search]);
  const catalogMatches = useMemo(
    () => filterPublicDataSources(catalogState.query, catalogState.admissionStatus),
    [catalogState.admissionStatus, catalogState.query],
  );
  const activeCatalogSourceId = catalogMatches.some((source) => source.id === catalogState.selectedSourceId)
    ? catalogState.selectedSourceId
    : catalogMatches[0]?.id ?? null;

  const { retainedSelectedId, activeSelectedId, rovingPopulationId } = resolveSciSelectionState({
    selectedId,
    researchFocus,
    admittedEntityIds: ATLAS_ENTITY_IDS,
    visibleEntityIds: filteredEntities.map((entity) => entity.id),
  });
  const selectedEntityVisible = activeSelectedId === null || filteredEntities.some((entity) => entity.id === activeSelectedId);
  const selected = activeSelectedId
    ? atlasRelease.entities.find((entity) => entity.id === activeSelectedId) ?? null
    : null;
  const viewportMorphologyNeuronId = morphologyVisualTarget.neuronId as number | null;
  const morphologyViewerFocusId = (morphologyVisualTarget.sourceSpecificViewer as { focusId: string } | null)?.focusId ?? null;
  const verifiedActiveResearchRecord = researchActiveRecord.activeRecord.status === "ready"
    ? researchActiveRecord.activeRecord.record
    : null;
  const morphologyTargetActive = morphologyVisualTarget.status === "exact_main_scene_morphology"
    && viewportMorphologyNeuronId !== null
    && verifiedActiveResearchRecord?.focusKind === "morphology_record"
    && verifiedActiveResearchRecord.focusId === morphologyVisualTarget.focusBinding?.focusId;
  const populationEvidenceTargetActive = researchFocus?.focusKind === "sci_entity"
    && researchFocus.focusId === activeSelectedId
    && verifiedActiveResearchRecord?.focusKind === "sci_entity"
    && verifiedActiveResearchRecord.focusId === activeSelectedId;
  const populationEvidenceVisible = showEntities && populationEvidenceTargetActive;
  const morphologyVisibleRequested = morphologyTargetActive && showObservedCellForm;
  const observedCellForm = observedCellFormRecords.find((record) => record.neuronId === observedCellFormId)
    ?? observedCellFormRecords.find((record) => record.neuronId === DEFAULT_OBSERVED_CELL_FORM_ID)!;
  const activeObservedCellForm = morphologyTargetActive ? observedCellForm : null;
  const observedMorphologyRoute = morphologyTargetActive
    ? observedMorphologyRouteByNeuronId.get(observedCellFormId) ?? null
    : null;
  const activeRepresentationRouteIds = view === "microns_observed_reference"
    ? ["microns_observed_reference"]
    : view === "internal_reference"
      ? ["internal_reference"]
      : [
          ...(view !== "cell_detail" && (showScaffold || showGrayMatter) ? ["main.reference_anatomy"] : []),
          ...(view !== "cell_detail" && populationEvidenceVisible ? ["main.population_evidence"] : []),
          ...(morphologyVisibleRequested ? [observedMorphologyRoute?.routeId ?? "main.legacy_observed_cell_forms"] : []),
        ];
  const activeRepresentationRoutes = activeRepresentationRouteIds.map((routeId) => {
    const route = evidenceAware3dRepresentationContract.routes.find((candidate) => candidate.routeId === routeId);
    if (!route) throw new Error(`Active 3D representation route ${routeId} is missing from the evidence contract`);
    return route;
  });
  const activeRepresentationStateIds = [...new Set(activeRepresentationRoutes.flatMap((route) => route.representationStateIds))];
  const activeRepresentationStates = evidenceAware3dRepresentationContract.representationStates.filter((state) => activeRepresentationStateIds.includes(state.id));
  const observedCellFidelity = morphologyFidelityRecord(observedCellFormId);
  const activeObservedCellFidelity = morphologyTargetActive ? observedCellFidelity : null;
  const frozenObservedCellFormRecord = morphologyTargetActive
    ? observedCellFormLens.records.find((record) => record.neuronId === observedCellFormId) ?? null
    : null;
  const frozenMorphologyFidelityRecord = morphologyTargetActive
    ? morphologyFidelityContract.records.find((record) => record.neuronId === observedCellFormId) ?? null
    : null;
  const morphologyRuntimeMatchesCurrentSelection = viewportMorphologyNeuronId !== null
    && morphologyRuntime.requestedNeuronId === viewportMorphologyNeuronId
    && morphologyRuntime.requestedMode === morphologyFidelityMode
    && (morphologyRuntime.actualMode === null || morphologyRuntime.actualMode === morphologyFidelityMode);
  const guardedMorphologyRuntime = viewportMorphologyNeuronId === null
    ? clearedMorphologyRuntime(morphologyVisualTarget.reason)
    : morphologyRuntimeMatchesCurrentSelection
      ? morphologyRuntime
      : {
        ...pendingMorphologyRuntime(viewportMorphologyNeuronId, morphologyFidelityMode),
        verificationStatus: "failed" as const,
        reason: "runtime_receipt_selection_mismatch",
      };
  const persistentState: PersistentAtlasState = {
    selectedId: retainedSelectedId,
    search,
    filters,
    cameraPreset: view,
    sliceZ,
    layers: {
      scaffold: showScaffold,
      gray: showGrayMatter,
      entities: populationEvidenceVisible,
      observedForm: morphologyVisibleRequested,
      micronsCellSurface: showMicronsCellSurface,
      micronsNucleus: showMicronsNucleus,
    },
    micronsClipping,
    observedCellFormId,
    morphologyFidelityMode,
    panel: sidePanel,
    comparisonIds: [...comparisonIds],
    catalog: {
      ...catalogState,
      selectedSourceId: activeCatalogSourceId,
    },
    research: {
      selectedResearchObject: researchFocus,
      lab: researchLab,
      query: researchQuery,
      view: researchFocusView,
      sciTimepoint,
    },
  };

  const handleCaptureReady = useCallback((capture: ViewportCapture | null) => {
    setCaptureViewport(() => capture);
  }, []);

  const handlePerformance = useCallback((metrics: RenderPerformance | null) => {
    setRenderPerformance(metrics);
  }, []);

  const handleMorphologyRuntime = useCallback((receipt: MorphologyRuntimeReceipt) => {
    const selection = morphologySelectionRef.current;
    if (selection.neuronId === null) return;
    if (receipt.requestedNeuronId !== selection.neuronId
      || receipt.requestedMode !== selection.mode
      || (receipt.actualMode !== null && receipt.actualMode !== selection.mode)) return;
    setMorphologyRuntime(receipt);
  }, []);

  const handleMicronsRuntime = useCallback((receipt: MicronsObservedReferenceRuntimeReceipt) => {
    setMicronsRuntime(receipt);
  }, []);

  const requestMicronsRuntimeForView = useCallback((nextView: CameraView) => {
    const requested = nextView === "microns_observed_reference";
    setMicronsRuntime((current) => current.requested === requested
      ? current
      : {
        ...current,
        requested,
        cellSurfaceVisible: requested ? current.cellSurfaceVisible : false,
        nucleusVisible: requested ? current.nucleusVisible : false,
        reason: requested ? current.reason : "reference_mode_not_requested",
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restoreLocation = () => {
      const locationState = parseLocationState(window.location.search);
      if (cancelled) return;
      setSelectedId(canonicalSciSelectedId(
        locationState.selectedId,
        locationState.research.selectedResearchObject,
      ));
      setSearch(locationState.search);
      setFilters(locationState.filters);
      setView(locationState.view);
      requestMicronsRuntimeForView(locationState.view);
      setSliceZ(locationState.sliceZ);
      setShowScaffold(locationState.layers.scaffold);
      setShowGrayMatter(locationState.layers.gray);
      setShowEntities(locationState.layers.entities);
      setShowObservedCellForm(locationState.layers.observedForm);
      setShowMicronsCellSurface(locationState.layers.micronsCellSurface);
      setShowMicronsNucleus(locationState.layers.micronsNucleus);
      setMicronsClipping(locationState.micronsClipping);
      setObservedCellFormId(locationState.observedCellFormId);
      setMorphologyFidelityMode(locationState.morphologyFidelityMode);
      setMorphologyVisualTarget(locationState.visualTarget);
      setMorphologyRuntime(locationState.visualTarget.neuronId === null
        ? clearedMorphologyRuntime(locationState.visualTarget.reason)
        : pendingMorphologyRuntime(locationState.observedCellFormId, locationState.morphologyFidelityMode));
      setSidePanel(locationState.panel);
      setComparisonIds(locationState.comparisonIds);
      setCatalogState(locationState.catalog);
      setResearchFocus(locationState.research.selectedResearchObject);
      setResearchLab(locationState.research.lab);
      setResearchQuery(locationState.research.query);
      setResearchFocusView(locationState.research.view);
      setSciTimepoint(locationState.research.sciTimepoint);
      setLocationHydrated(true);
    };
    queueMicrotask(restoreLocation);
    window.addEventListener("popstate", restoreLocation);
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", restoreLocation);
    };
  }, [requestMicronsRuntimeForView]);

  useEffect(() => {
    if (!locationHydrated) return;
    const existingParams = new URLSearchParams(window.location.search);
    const researchLabParams = [
      "typeCompare",
      "typeBaseline",
      "morphologyView",
      "morphologyCohortA",
      "morphologyCohortB",
      "morphologyMetric",
      "morphologyCompare",
      "morphologyModes",
      "positionFrame",
      "positionMuscle",
      "positionSegment",
      "positionCamera",
    ]
      .map((key) => [key, existingParams.get(key)] as const)
      .filter(([, value]) => value !== null);
    const params = new URLSearchParams();
    params.set("v", "1");
    if (retainedSelectedId) params.set("cell", retainedSelectedId);
    params.set("view", view);
    params.set("slice", sliceZ.toFixed(1));
    if (search) params.set("q", search);
    if (filters.transmitter !== "all") params.set("tx", filters.transmitter);
    if (filters.segment !== "all") params.set("segment", filters.segment);
    if (filters.endpoint !== "all") params.set("endpoint", filters.endpoint);
    if (filters.injury !== "all") params.set("injury", filters.injury);
    params.set("scaffold", showScaffold ? "1" : "0");
    params.set("gray", showGrayMatter ? "1" : "0");
    params.set("entities", showEntities ? "1" : "0");
    params.set("observedForm", morphologyVisibleRequested ? "1" : "0");
    params.set("micronsCell", showMicronsCellSurface ? "1" : "0");
    params.set("micronsNucleus", showMicronsNucleus ? "1" : "0");
    params.set("micronsClip", micronsClipping.enabled ? "1" : "0");
    params.set("micronsClipAxis", micronsClipping.axis);
    params.set("micronsClipNm", String(micronsClipping.positionNanometre));
    params.set("micronsClipSide", micronsClipping.keepSide);
    if (viewportMorphologyNeuronId !== null) {
      params.set("cellForm", String(viewportMorphologyNeuronId));
      params.set("cellFidelity", morphologyFidelityMode === "radius_surface" ? "surface" : "swc");
    }
    params.set("panel", sidePanel);
    if (comparisonIds.length) params.set("compare", comparisonIds.join(","));
    if (catalogState.query) params.set("catalog_q", catalogState.query);
    if (catalogState.admissionStatus !== "all") params.set("catalog", catalogState.admissionStatus);
    if (activeCatalogSourceId) params.set("source", activeCatalogSourceId);
    if (catalogState.plannerAxisIds.length) params.set("plan", catalogState.plannerAxisIds.join(","));
    if (researchLab !== "overview") params.set("lab", researchLab);
    if (researchFocus) {
      params.set("focusKind", researchFocus.focusKind);
      params.set("focusId", researchFocus.focusId);
    }
    if (researchQuery) params.set("researchQuery", researchQuery);
    if (researchFocusView !== "summary") params.set("focusView", researchFocusView);
    if (sciTimepoint !== "all") params.set("sciTime", sciTimepoint);
    for (const [key, value] of researchLabParams) params.set(key, value!);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [activeCatalogSourceId, catalogState.admissionStatus, catalogState.plannerAxisIds, catalogState.query, comparisonIds, filters, locationHydrated, micronsClipping, morphologyFidelityMode, morphologyVisibleRequested, researchFocus, researchFocusView, researchLab, researchQuery, retainedSelectedId, sciTimepoint, search, showEntities, showGrayMatter, showMicronsCellSurface, showMicronsNucleus, showScaffold, sidePanel, sliceZ, view, viewportMorphologyNeuronId]);

  const applyResolvedVisualTarget = useCallback((target: ReturnType<typeof resolveResearchVisualTarget>) => {
    setMorphologyVisualTarget(target as ResearchVisualTarget);
    setView(target.nextView as CameraView);
    requestMicronsRuntimeForView(target.nextView as CameraView);
    if (target.neuronId === null) {
      setShowObservedCellForm(false);
      setMorphologyFidelityMode("observed_swc");
      setMorphologyRuntime(clearedMorphologyRuntime(target.reason));
      return;
    }
    const mode = target.fidelityMode as MorphologyFidelityMode;
    setObservedCellFormId(target.neuronId);
    setMorphologyFidelityMode(mode);
    setMorphologyRuntime(pendingMorphologyRuntime(target.neuronId, mode));
    setShowObservedCellForm(true);
  }, [requestMicronsRuntimeForView]);

  const applyResearchFocusWorkspace = useCallback((
    focus: ResearchFocus | null,
    target: ReturnType<typeof resolveResearchVisualTarget>,
  ) => {
    const workspace = resolveResearchFocusWorkspaceState(focus);
    const canonicalFocus = workspace.status === "ready"
      ? workspace.focus as ResearchFocus
      : null;
    setResearchFocus(canonicalFocus);
    setResearchLab(workspace.lab as LabTab);
    setSidePanel(workspace.panel as SidePanel);
    setResearchFocusView("summary");
    applyResolvedVisualTarget(target);
    return workspace;
  }, [applyResolvedVisualTarget]);

  const transitionResearchFocus = useCallback((focus: ResearchFocus | null) => {
    const workspace = resolveResearchFocusWorkspaceState(focus);
    const canonicalFocus = workspace.status === "ready"
      ? workspace.focus as ResearchFocus
      : null;
    const target = resolveResearchVisualTarget({
      focus: canonicalFocus,
      admittedMainSceneNeuronIds: OBSERVED_CELL_FORM_IDS,
      admittedSourceViewerNeuronIds: NEUROMORPHO_UNIVERSE_VIEWER_IDS,
      sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
      requestedFidelityMode: morphologyFidelityMode,
      currentView: view,
    });
    applyResearchFocusWorkspace(canonicalFocus, target);
    return target;
  }, [applyResearchFocusWorkspace, morphologyFidelityMode, view]);

  const selectEntity = useCallback((id: string) => {
    setSelectedId(id);
    transitionResearchFocus({ focusKind: "sci_entity", focusId: id });
    setNotice(`${atlasRelease.entities.find((entity) => entity.id === id)?.shortLabel ?? "Entity"} selected · evidence card updated · no morphology relationship admitted`);
  }, [transitionResearchFocus]);

  const selectResearchFocus = useCallback((focus: ResearchFocus) => {
    const target = transitionResearchFocus(focus);
    if (focus.focusKind === "sci_entity" && atlasRelease.entities.some((entity) => entity.id === focus.focusId)) {
      setSelectedId(focus.focusId);
    }
    if (focus.focusKind === "molecular_profile" && target.neuronId === null) {
      setNotice(`${focus.focusId} selected · source-record fingerprint and evidence delta updated · main-scene geometry cleared because no same-cell morphology is admitted`);
    } else if (target.reason === SOURCE_SPECIFIC_MORPHOLOGY_VIEWER_ONLY) {
      setNotice(`Exact ${focus.focusId} remains in the source-specific Morphology Viewer · main-scene geometry cleared · no fallback`);
    }
  }, [transitionResearchFocus]);

  const selectResearchLab = useCallback((lab: LabTab) => {
    setResearchLab(lab);
    const expectedKind = lab === "types"
      ? "molecular_profile"
      : lab === "sci"
        ? "sci_population"
        : lab === "atlas"
          ? "anatomy_label"
          : lab === "morphology"
            ? "morphology_record"
            : lab === "coverage"
              ? "source_lane"
              : null;
    if (expectedKind && researchFocus?.focusKind !== expectedKind) {
      transitionResearchFocus(DEFAULT_FOCUS_BY_LAB[lab] ?? null);
    }
    setNotice(`${prettify(lab)} research view active`);
  }, [researchFocus, transitionResearchFocus]);

  const openResearchRecord = useCallback((record: ResearchRecord) => {
    selectResearchFocus({ focusKind: record.focusKind, focusId: record.focusId });
    if (record.focusKind === "sci_population") {
      setSciTimepoint(normalizeMatsonSciTimepoint(record.navigation.params.sciTime) as MatsonSciTimepoint);
    }
    setNotice(`${record.title} opened in the ${record.navigation.lab} workspace · source namespace preserved`);
    requestAnimationFrame(() => document.getElementById(record.navigation.anchor)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }, [selectResearchFocus]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setNotice(`${filterEntities(search, next).length} evidence entities match the current filters`);
  };

  const setLayer = (layer: keyof LayerState, visible: boolean) => {
    if (layer === "scaffold") setShowScaffold(visible);
    if (layer === "gray") setShowGrayMatter(visible);
    if (layer === "entities") setShowEntities(visible);
    if (layer === "micronsCellSurface") setShowMicronsCellSurface(visible);
    if (layer === "micronsNucleus") setShowMicronsNucleus(visible);
    if (layer === "observedForm") {
      if (!morphologyTargetActive) {
        setShowObservedCellForm(false);
        setNotice(`Morphology layer remains empty · ${prettify(morphologyVisualTarget.reason)}`);
        return;
      }
      setShowObservedCellForm(visible);
      setMorphologyRuntime((current) => current.verificationStatus === "verified" && current.sceneObjectStatus === "rendered"
        ? { ...current, visible, reason: visible ? null : "morphology_layer_hidden" }
        : current);
    }
    setNotice(`${prettify(layer)} layer ${visible ? "shown" : "hidden"}`);
  };

  const setMicronsClipEnabled = (enabled: boolean) => {
    setMicronsClipping((current) => ({ ...current, enabled }));
    if (enabled && view !== "microns_observed_reference") {
      setView("microns_observed_reference");
      requestMicronsRuntimeForView("microns_observed_reference");
    }
    setNotice(enabled
      ? "Source-native cell-shell clipping enabled · linked nucleus remains intact · no cap or geometry mutation"
      : "Source-native clipping disabled · exact source geometry remains unchanged");
  };

  const setMicronsClipAxis = (axis: MicronsClippingState["axis"]) => {
    const positionNanometre = micronsClipSomaPosition(micronsSourceNativeClipping, axis);
    setMicronsClipping((current) => ({ ...current, axis, positionNanometre }));
    setNotice(`${axis.toUpperCase()} clipping axis active · reset to source soma-centre coordinate ${positionNanometre.toLocaleString()} nm`);
  };

  const setMicronsClipPosition = (positionNanometre: number) => {
    setMicronsClipping((current) => ({
      ...current,
      positionNanometre: clampMicronsClipPosition(micronsSourceNativeClipping, current.axis, positionNanometre),
    }));
  };

  const setMicronsClipSide = (keepSide: MicronsClippingState["keepSide"]) => {
    setMicronsClipping((current) => ({ ...current, keepSide }));
    setNotice(`MICrONS clipping retains the source-native ${keepSide} side · nucleus remains unclipped`);
  };

  const resetMicronsClipping = () => {
    setMicronsClipping(defaultMicronsClipState(micronsSourceNativeClipping) as MicronsClippingState);
    setNotice("MICrONS clipping reset · disabled at the source soma-centre Z plane");
  };

  const updateObservedCellForm = (neuronId: number, requestedMode: MorphologyFidelityMode = morphologyFidelityMode) => {
    const record = observedCellFormRecords.find((candidate) => candidate.neuronId === neuronId);
    if (!record) return;
    const target = resolveExplicitMorphologySelection({
      neuronId,
      indexedMorphologyFocusIds: INDEXED_MAIN_SCENE_MORPHOLOGY_FOCUS_IDS,
      admittedMainSceneNeuronIds: OBSERVED_CELL_FORM_IDS,
      admittedSourceViewerNeuronIds: NEUROMORPHO_UNIVERSE_VIEWER_IDS,
      sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
      requestedFidelityMode: requestedMode,
      currentView: view,
    });
    if (target.researchFocus) {
      applyResearchFocusWorkspace(target.researchFocus as ResearchFocus, target);
    } else {
      applyResolvedVisualTarget(target);
    }
    setNotice(target.fidelityMode === "radius_surface"
      ? `NeuroMorpho ${neuronId} shown with checksum-gated radius-derived surface · not membrane · no type link created`
      : `NeuroMorpho ${neuronId} shown as OBS source-local SWC centerlines · unsupported thickness remains absent`);
  };

  const openObservedMorphologyRoute = (neuronId: number) => {
    const route = observedMorphologyRouteByNeuronId.get(neuronId);
    if (!route) {
      setNotice(`Route open rejected · NeuroMorpho ${neuronId} has no admitted independent-route contract`);
      return;
    }
    updateObservedCellForm(neuronId);
    setView("cell_detail");
    setShowObservedCellForm(true);
    setNotice(`Opened ${route.title} · exact source-local geometry · ${route.censusMembership ? "142-census child" : "supplementary object outside the frozen census"} · 0 joins · 0 REG · 0 internal primitives`);
    window.requestAnimationFrame(() => document.querySelector("#sci-evidence-workspace .viewport-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const updateMorphologyFidelityMode = (mode: MorphologyFidelityMode) => {
    if (viewportMorphologyNeuronId === null) {
      setNotice(`No main-scene morphology target · ${prettify(morphologyVisualTarget.reason)}`);
      return;
    }
    if (!sourceAuthorizesFidelityMode(viewportMorphologyNeuronId, mode)) {
      setNotice(`Radius-derived surface unavailable for NeuroMorpho ${viewportMorphologyNeuronId} · official source reports No Diameter`);
      return;
    }
    setMorphologyFidelityMode(mode);
    setMorphologyVisualTarget((current) => ({ ...current, fidelityMode: mode, modeReason: null }));
    setMorphologyRuntime(pendingMorphologyRuntime(viewportMorphologyNeuronId, mode));
    setShowObservedCellForm(true);
    setNotice(mode === "radius_surface"
      ? "Radius-derived open-frustum surface active · deterministic display derivative, not observed membrane"
      : "Observed SWC centerlines active · stroke width is a viewer aid, not anatomical caliber");
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    setNotice(`${filterEntities(value, filters).length} evidence entities match the current filters`);
  };

  const updateView = (nextView: CameraView) => {
    if (nextView === "cell_detail" && viewportMorphologyNeuronId === null) {
      setView("home");
      requestMicronsRuntimeForView("home");
      setNotice(`Cell-detail view unavailable · ${prettify(morphologyVisualTarget.reason)}`);
      return;
    }
    setView(nextView);
    requestMicronsRuntimeForView(nextView);
    setNotice(`${prettify(nextView)} camera preset active`);
  };

  const updateSlice = (value: number) => {
    setSliceZ(value);
    setNotice(`Display plane ${value.toFixed(1)} · SYN entity guide only · not an atlas measurement`);
  };

  const handlePopulationKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const currentIndex = filteredEntities.findIndex((entity) => entity.id === id);
    if (currentIndex < 0) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % filteredEntities.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + filteredEntities.length) % filteredEntities.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = filteredEntities.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextId = filteredEntities[nextIndex].id;
    selectEntity(nextId);
    populationRefs.current.get(nextId)?.focus();
  };

  const selectPanel = (panel: SidePanel) => {
    setSidePanel(panel);
    setNotice(`${prettify(panel)} panel active`);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, panel: SidePanel) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = SIDE_PANELS.indexOf(panel);
    const nextPanel = event.key === "Home"
      ? SIDE_PANELS[0]
      : event.key === "End"
        ? SIDE_PANELS[SIDE_PANELS.length - 1]
        : SIDE_PANELS[(currentIndex + (event.key === "ArrowLeft" ? -1 : 1) + SIDE_PANELS.length) % SIDE_PANELS.length];
    selectPanel(nextPanel);
    panelRefs.current.get(nextPanel)?.focus();
  };

  const toggleComparison = (id: string) => {
    setComparisonIds((current) => {
      const next = current.includes(id)
        ? current.filter((candidate) => candidate !== id)
        : current.length < 4
          ? [...current, id]
          : current;
      setNotice(`${next.length} condition${next.length === 1 ? "" : "s"} selected for stratified comparison`);
      return next;
    });
  };

  const reset = () => {
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setSelectedId(DEFAULT_SELECTED);
    setSliceZ(-12);
    setShowScaffold(true);
    setShowGrayMatter(true);
    setShowEntities(true);
    setShowObservedCellForm(false);
    setShowMicronsCellSurface(true);
    setShowMicronsNucleus(true);
    setObservedCellFormId(DEFAULT_OBSERVED_CELL_FORM_ID);
    setMorphologyFidelityMode("observed_swc");
    const resetFocus = { ...DEFAULT_RESEARCH_FOCUS } as ResearchFocus;
    const resetTarget = resolveResearchVisualTarget({
      focus: resetFocus,
      admittedMainSceneNeuronIds: OBSERVED_CELL_FORM_IDS,
      admittedSourceViewerNeuronIds: NEUROMORPHO_UNIVERSE_VIEWER_IDS,
      sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
      requestedFidelityMode: "observed_swc",
      currentView: "home",
    });
    applyResolvedVisualTarget(resetTarget);
    setSidePanel("evidence");
    setComparisonIds([]);
    setCatalogState({
      query: "",
      admissionStatus: "all",
      selectedSourceId: DEFAULT_CATALOG_SOURCE,
      plannerAxisIds: [],
    });
    setResearchFocus(resetFocus);
    setResearchLab("overview");
    setResearchQuery("");
    setResearchFocusView("summary");
    setSciTimepoint("all");
    setNotice("View reset · all seven evidence entities visible");
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("Versioned view link copied");
    } catch {
      setNotice("Copy unavailable · use the current address-bar URL");
    }
  };

  const importState = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      if (!file.name.toLowerCase().endsWith(".json")) throw new Error("choose a .json state export");
      if (file.size > 2_000_000) throw new Error("the JSON file exceeds the 2 MB safety limit");
      const payload: unknown = JSON.parse(await file.text());
      const imported = validateImportedState(payload);
      const resolvedImportedTarget = resolveResearchVisualTarget({
        focus: imported.research.selectedResearchObject,
        admittedMainSceneNeuronIds: OBSERVED_CELL_FORM_IDS,
        admittedSourceViewerNeuronIds: NEUROMORPHO_UNIVERSE_VIEWER_IDS,
        sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
        requestedFidelityMode: imported.morphologyFidelityMode,
        currentView: imported.cameraPreset,
      });
      const importedTarget = {
        ...resolvedImportedTarget,
        nextView: imported.cameraPreset === "internal_reference" || imported.cameraPreset === "microns_observed_reference"
          ? imported.cameraPreset
          : resolvedImportedTarget.nextView,
      };
      setSelectedId(canonicalSciSelectedId(
        imported.selectedId,
        imported.research.selectedResearchObject,
      ));
      setSearch(imported.search);
      setFilters(imported.filters);
      setSliceZ(imported.sliceZ);
      setShowScaffold(imported.layers.scaffold);
      setShowGrayMatter(imported.layers.gray);
      setShowEntities(imported.layers.entities);
      setShowMicronsCellSurface(imported.layers.micronsCellSurface);
      setShowMicronsNucleus(imported.layers.micronsNucleus);
      setMicronsClipping(imported.micronsClipping);
      setObservedCellFormId(imported.observedCellFormId);
      applyResolvedVisualTarget(importedTarget);
      setSidePanel(imported.panel);
      setComparisonIds(imported.comparisonIds);
      setCatalogState(imported.catalog);
      setResearchFocus(imported.research.selectedResearchObject);
      setResearchLab(imported.research.lab);
      setResearchQuery(imported.research.query);
      setResearchFocusView(imported.research.view);
      setSciTimepoint(imported.research.sciTimepoint);
      setNotice(`State imported · ${imported.comparisonIds.length} comparison condition${imported.comparisonIds.length === 1 ? "" : "s"} restored`);
    } catch (error) {
      const reason = error instanceof SyntaxError
        ? "the selected file is not valid JSON"
        : error instanceof Error
          ? error.message
          : "the selected file could not be validated";
      setNotice(`Import rejected · ${reason}`);
    } finally {
      input.value = "";
    }
  };

  const exportBaseName = `${researchMvpRelease.releaseId}-${filenameSlug(selected?.shortLabel ?? "filtered-view")}`;

  const exportState = () => {
    const payload = {
      schemaVersion: researchMvpRelease.schemaVersion,
      exportedAt: new Date().toISOString(),
      releaseId: researchMvpRelease.releaseId,
      releaseManifest: researchMvpManifest,
      publicDataCatalog: {
        releaseId: publicDataCatalog.releaseId,
        schemaVersion: publicDataCatalog.schemaVersion,
        scientificInputPolicy: publicDataCatalog.scientificInputPolicy,
        institutionalExperimentalDataUsed: publicDataCatalog.institutionalExperimentalDataUsed,
        metadataAuditedIntakeIds: publicSourceIntakes.map((intake) => intake.intakeId),
        intakeRegistryReleaseId: publicSourceIntakeRegistry.releaseId,
        evidenceFeasibilityPlannerReleaseId: evidenceFeasibilityPlanner.releaseId,
        evidenceProvenanceTraceReleaseId: evidenceProvenanceTrace.releaseId,
        crossLaneRelationshipAdmissionReleaseId: crossLaneRelationshipAdmission.releaseId,
        publicSourceReleaseAdmissionServiceReleaseId: publicSourceReleaseAdmissionService.releaseId,
        publicSourceAssertionProvenanceReleaseId: publicSourceAssertionProvenance.releaseId,
        publicSourceAuthorizationPlanReleaseId: publicSourceAuthorizationPlan.releaseId,
        publicSourceIndependentAuthorizationEvidenceReleaseId: publicSourceIndependentAuthorizationEvidence.releaseId,
      },
      visualReleaseId: atlasRelease.releaseId,
      scope: researchMvpRelease.scope,
      visualContract: atlasRelease.visualContract,
      observedCellFormLens: {
        contractRecordMembership: morphologyTargetActive && frozenObservedCellFormRecord !== null,
        repositoryCensusMembership: morphologyTargetActive ? observedMorphologyRoute?.censusMembership ?? true : null,
        releaseId: morphologyTargetActive && frozenObservedCellFormRecord ? observedCellFormLens.releaseId : null,
        sourceObject: morphologyTargetActive && frozenObservedCellFormRecord ? observedCellFormLens.sourceObject : null,
        selectedRecord: morphologyTargetActive ? frozenObservedCellFormRecord : null,
        recordAuthority: !morphologyTargetActive
          ? "NO_ACTIVE_MORPHOLOGY_TARGET"
          : frozenObservedCellFormRecord
            ? "FROZEN_OBSERVED_CELL_FORM_LENS"
            : "NOT_A_MEMBER_OF_FROZEN_OBSERVED_CELL_FORM_LENS",
        renderingContract: morphologyTargetActive && frozenObservedCellFormRecord ? observedCellFormLens.renderingContract : null,
        hardBoundaries: morphologyTargetActive && frozenObservedCellFormRecord ? observedCellFormLens.hardBoundaries : [],
      },
      observedMorphologyRoute: morphologyTargetActive && observedMorphologyRoute ? {
        routeId: observedMorphologyRoute.routeId,
        contractId: observedMorphologyRoute.contractId,
        releaseId: observedMorphologyRoute.releaseId,
        title: observedMorphologyRoute.title,
        authority: observedMorphologyRoute.authority,
        sourceAuthority: observedMorphologyRoute.sourceAuthority,
        censusMembership: observedMorphologyRoute.censusMembership,
        sourceRecord: observedMorphologyRoute.sourceRecord,
        sourceObjects: observedMorphologyRoute.sourceObjects,
        renderingContract: observedMorphologyRoute.renderingContract,
        identityBoundary: observedMorphologyRoute.identityBoundary,
        sourceLinks: observedMorphologyRoute.sourceLinks,
        hardBoundaries: observedMorphologyRoute.warnings,
      } : null,
      morphologyVisualTarget,
      morphologyFidelity: {
        contractRecordMembership: morphologyTargetActive && frozenMorphologyFidelityRecord !== null,
        repositoryCensusMembership: morphologyTargetActive ? observedMorphologyRoute?.censusMembership ?? true : null,
        releaseId: morphologyTargetActive && frozenMorphologyFidelityRecord ? morphologyFidelityContract.releaseId : null,
        sourceObjects: morphologyTargetActive && frozenMorphologyFidelityRecord ? morphologyFidelityContract.sourceObjects : null,
        routeSourceObjects: morphologyTargetActive ? observedMorphologyRoute?.sourceObjects ?? null : null,
        selectedContractRecord: morphologyTargetActive ? frozenMorphologyFidelityRecord : null,
        activeRecord: activeObservedCellFidelity,
        recordAuthority: !morphologyTargetActive
          ? "NO_ACTIVE_MORPHOLOGY_TARGET"
          : frozenMorphologyFidelityRecord
            ? "FROZEN_MORPHOLOGY_FIDELITY_CONTRACT"
            : observedMorphologyRoute?.sourceAuthority ?? "INDEPENDENT_ROUTE_RECORD",
        activeMode: morphologyTargetActive ? morphologyFidelityMode : null,
        activeRepresentationAuthority: !morphologyTargetActive
          ? "NONE"
          : morphologyFidelityMode === "radius_surface"
            ? morphologyFidelityContract.derivedSurfaceAlgorithm.authority
            : observedCellFidelity.geometry.geometryStatus,
        derivedSurfaceAlgorithm: morphologyTargetActive && morphologyFidelityMode === "radius_surface"
          ? morphologyFidelityContract.derivedSurfaceAlgorithm
          : null,
        runtimeReceipt: guardedMorphologyRuntime,
        hardBoundaries: !morphologyTargetActive
          ? []
          : frozenMorphologyFidelityRecord
            ? morphologyFidelityContract.hardBoundaries
            : observedMorphologyRoute?.warnings ?? [],
      },
      micronsObservedReference: {
        contract: micronsObservedCellNucleusReference,
        clippingContract: micronsSourceNativeClipping,
        runtimeReceipt: micronsRuntime,
        requestedView: view === "microns_observed_reference",
        requestedComponents: {
          cellSegmentationSurface: showMicronsCellSurface,
          linkedNucleusSegmentation: showMicronsNucleus,
        },
        requestedClipping: micronsClipping,
      },
      spatialAssets: researchMvpRelease.assets,
      selectedEntity: selected,
      selectedResearchObject: researchFocus,
      visibleEntities: filteredEntities,
      comparisonConditions: researchMvpRelease.conditions.filter((condition) => comparisonIds.includes(condition.id)),
      state: {
        ...persistentState,
        url: window.location.href,
      },
      roundTripContract: {
        equalityUnit: "persistent state",
        excludedTopLevelFields: ["exportedAt"],
        regeneratedNonAuthoritativePaths: [
          "state.url",
          "morphologyFidelity.runtimeReceipt",
          "micronsObservedReference.runtimeReceipt",
        ],
      },
      scientificDisclosure: {
        coordinateSpace: researchMvpRelease.spatialContract.coordinateSpace,
        entityGeometryStatus: "SYN",
        entityPathStatus: "SCH",
        atlasReferenceStatus: "INF",
        morphologyInputStatus: morphologyTargetActive ? "OBS_STANDARDIZED_SOURCE_LOCAL" : "NONE_REQUESTED",
        morphologyRepresentation: guardedMorphologyRuntime.verificationStatus === "verified" && guardedMorphologyRuntime.sceneObjectStatus === "rendered"
          ? guardedMorphologyRuntime.actualMode === "radius_surface"
            ? "DERIVED_FROM_OBSERVED_RADIUS"
            : "observed_standardized_swc_centerlines"
          : "NONE_RENDERED",
        morphologyAlgorithmId: guardedMorphologyRuntime.algorithmId,
        morphologyRuntimeVerificationStatus: guardedMorphologyRuntime.verificationStatus,
        morphologySceneObjectStatus: guardedMorphologyRuntime.sceneObjectStatus,
        morphologyVisibleInViewport: guardedMorphologyRuntime.visible,
        morphologyRuntimeReason: guardedMorphologyRuntime.reason,
        morphologyVisualTargetStatus: morphologyVisualTarget.status,
        morphologyVisualTargetReason: morphologyVisualTarget.reason,
        sourceDiameterAvailable: activeObservedCellFidelity?.geometry.sourceDiameterAvailable ?? null,
        observedMembraneAvailable: false,
        sameSpecimenInternalStructureStatus: morphologyTargetActive ? "UNAVAILABLE" : "NONE_WITHOUT_ACTIVE_MORPHOLOGY",
        selectedSpinalSameSpecimenInternalStructureStatus: morphologyTargetActive ? "UNAVAILABLE" : "NONE_WITHOUT_ACTIVE_MORPHOLOGY",
        micronsCrossRegionReferenceRuntimeVerificationStatus: micronsRuntime.verificationStatus,
        micronsCrossRegionReferenceSceneObjectStatus: micronsRuntime.sceneObjectStatus,
        micronsCellSurfaceVisibleInViewport: micronsRuntime.cellSurfaceVisible,
        micronsNucleusVisibleInViewport: micronsRuntime.nucleusVisible,
        micronsCellShellClipping: micronsRuntime.clipping,
        micronsClipCapPrimitiveCount: micronsRuntime.clipping.capPrimitiveCount,
        micronsClipGeneratedGeometryCount: micronsRuntime.clipping.generatedGeometryCount,
        micronsNucleusClippingPlaneCount: micronsRuntime.clipping.nucleusClippingPlaneCount,
        micronsWithinSourceSamePhysicalObject: micronsObservedCellNucleusReference.relationshipPolicy.withinAdmittedObject.samePhysicalObject,
        micronsWithinSourceIdentityTransformCount: 1,
        micronsProjectDerivedRegistrationCount: micronsObservedCellNucleusReference.coordinateContract.projectDerivedRegistrationCount,
        micronsSpinalRelationship: "co_display_only",
        micronsMembraneClaim: false,
        missingSameSpecimenInternalEvidence: activeObservedCellFidelity?.modes.internalStructure.missingEvidence ?? null,
        selectedObservedCellFormAssetId: activeObservedCellForm?.assetId ?? null,
        selectedObservedMorphologyRouteId: morphologyTargetActive ? observedMorphologyRoute?.routeId ?? null : null,
        selectedObservedMorphologyRouteContractId: morphologyTargetActive ? observedMorphologyRoute?.contractId ?? null : null,
        selectedObservedMorphologyCensusMembership: morphologyTargetActive ? observedMorphologyRoute?.censusMembership ?? true : null,
        selectedObservedMorphologySourceAuthority: morphologyTargetActive ? observedMorphologyRoute?.sourceAuthority ?? "FROZEN_CENSUS_CHILD" : null,
        observedCellFormRelationshipToSelectedEntity: "not_established",
        observedCellFormRelationshipToMolecularProfiles: "not_established",
        exactCrossSourceIdentityCount: 0,
        registrationCount: 0,
        validForMeasurement: false,
      },
      disclaimer: atlasRelease.fixedDisclaimer,
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${exportBaseName}.json`);
    setNotice("Evidence-linked JSON state exported");
  };

  const exportCsv = () => {
    const headers = [
      "release_id", "entity_id", "name", "entity_kind", "classification_axes", "transmitter", "markers",
      "segment_group", "segment_label", "lamina", "laterality", "endpoint", "injury_type", "injury_context",
      "geometry_status", "representation_kind", "cell_morphology_claim", "path_status", "claim_grades", "endpoint_levels", "allowed_claim", "not_established",
      "negative_findings", "ledger_id", "citation", "doi", "source_url", "coordinate_space",
      "selected_morphology_asset_id", "morphology_input_status", "morphology_fidelity_mode", "morphology_representation_authority",
      "morphology_route_id", "morphology_route_contract_id", "morphology_source_authority", "morphology_census_membership",
      "morphology_geometry_sha256", "morphology_runtime_verification", "morphology_scene_object_status", "morphology_visible", "morphology_runtime_reason",
      "source_diameter_available", "same_specimen_internal_structure_status", "morphology_relationship_to_entity",
      "scientific_disclaimer",
    ];
    const rows = filteredEntities.map((entity) => [
      researchMvpRelease.releaseId, entity.id, entity.name, entity.entityKind, entity.classificationAxes, entity.transmitter,
      entity.markers, entity.segmentGroup, entity.segmentLabel, entity.lamina, entity.laterality, entity.endpoint,
      entity.injuryType, entity.injuryContext, entity.geometry.status, "non-cell population evidence node", false, entity.geometry.pathStatus, entity.claimGrades,
      entity.endpointLevels, entity.allowedClaim, entity.notEstablished, entity.negativeFindings, entity.ledgerId,
      entity.citation, entity.doi, entity.sourceUrl, researchMvpRelease.spatialContract.coordinateSpace,
      activeObservedCellFidelity?.assetId ?? null,
      activeObservedCellFidelity?.geometry.geometryStatus ?? "NONE_REQUESTED",
      morphologyTargetActive ? morphologyFidelityMode : null,
      !morphologyTargetActive ? "NONE" : morphologyFidelityMode === "radius_surface" ? "DERIVED_FROM_OBSERVED_RADIUS" : "OBS_STANDARDIZED_SOURCE_LOCAL",
      morphologyTargetActive ? observedMorphologyRoute?.routeId ?? null : null,
      morphologyTargetActive ? observedMorphologyRoute?.contractId ?? null : null,
      morphologyTargetActive ? observedMorphologyRoute?.sourceAuthority ?? null : null,
      morphologyTargetActive ? observedMorphologyRoute?.censusMembership ?? true : null,
      activeObservedCellFidelity?.geometry.sha256 ?? null, guardedMorphologyRuntime.verificationStatus, guardedMorphologyRuntime.sceneObjectStatus, guardedMorphologyRuntime.visible, guardedMorphologyRuntime.reason,
      activeObservedCellFidelity?.geometry.sourceDiameterAvailable ?? null, morphologyTargetActive ? "UNAVAILABLE" : "NONE", "not_established",
      atlasRelease.fixedDisclaimer,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${exportBaseName}.csv`);
    setNotice(`${filteredEntities.length} evidence entities exported as RFC 4180 CSV`);
  };

  const exportPng = async () => {
    try {
      const png = captureViewport
        ? await captureViewport({
          releaseId: researchMvpRelease.releaseId,
          selectedLabel: selected?.shortLabel ?? null,
          morphologyRuntime: guardedMorphologyRuntime,
          micronsRuntime,
        })
        : await createFallbackPng(selected, filteredEntities.length, guardedMorphologyRuntime, micronsRuntime);
      downloadBlob(png, `${exportBaseName}.png`);
      setNotice("Viewport PNG exported with observed-input, derived-surface and unavailable-internal-detail disclosure");
    } catch {
      setNotice("PNG export unavailable · JSON and CSV remain available");
    }
  };

  const injuryOptions = Array.from(new Set(atlasRelease.entities.map((entity) => entity.injuryType)));

  return (
    <ResearchActiveRecordProvider value={researchActiveRecord}>
    <main className="atlas-shell">
      <div className="research-only-banner" role="note">
        <strong>LOCALHOST PUBLIC-DATA RESEARCH ITERATION 2.50</strong>
        <span>Atlas INF · 1,097 exact NeuroMorpho query objects · frozen adult subset 142 · 149 exact assets reused + 948 delta raw SWCs · selected object checksum-gated and source-local · selected-spinal interior unavailable · 0 cross-lane REG</span>
        <span>For research visualization only; this is not a complete cell census, connectome, or treatment recommendation.</span>
      </div>

      <header className="atlas-header">
        <div>
          <p className="eyebrow">OHRI · PUBLIC-DATA RESEARCH ITERATION 2.50 · LOCALHOST</p>
          <h1>Mouse Spinal Interneuron Atlas</h1>
          <p className="header-subtitle">Evidence-linked 3D research with source-local spinal morphology, exact neonatal premotor coordinate points, an exact cross-region cell+nucleus segmentation reference, and explicit same-specimen missingness</p>
        </div>
        <div className="header-actions">
          <div className="scope-row" aria-label="Declared prototype scope">
            <span>Model core: Mus musculus</span><span>SCI evidence: mouse + human context</span><span>Life stage: per source record</span><span>SCI entity scope C1–S3 · atlas segment labels pending</span>
          </div>
          <div className="action-row">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={importState}
            />
            <button type="button" onClick={reset}>Reset</button>
            <button type="button" onClick={share}>Share state</button>
            <button type="button" onClick={() => importInputRef.current?.click()}>Import state</button>
            <button type="button" className="primary" onClick={exportState}>Export JSON</button>
            <button type="button" onClick={exportCsv}>Export CSV</button>
            <button type="button" onClick={exportPng}>Export PNG</button>
          </div>
        </div>
      </header>

      <ResearchDataLab
        activeTab={researchLab}
        focus={researchFocus}
        query={researchQuery}
        focusView={researchFocusView}
        sciTimepoint={sciTimepoint}
        initialTypeCompare={initialParams.typeCompare}
        initialMorphologyView={initialParams.morphologyView}
        onTabChange={selectResearchLab}
        onFocusChange={selectResearchFocus}
        onQueryChange={setResearchQuery}
        onFocusViewChange={setResearchFocusView}
        onSciTimepointChange={setSciTimepoint}
        onOpenRecord={openResearchRecord}
        activeObservedNeuronId={observedCellFormId}
        onOpenObservedMorphologyRoute={openObservedMorphologyRoute}
        onNotice={setNotice}
      />

      <section className="research-workspace" id="sci-evidence-workspace" aria-label="Atlas research workspace">
        <aside className="control-rail">
          <div className="panel-heading">
            <p className="panel-kicker">EXPLORE · {filteredEntities.length}/{atlasRelease.entities.length}</p>
            <h2>Evidence entities</h2>
            <p>Five populations + two state overlays</p>
          </div>

          <label className="search-field">
            <span>Search marker, family or region</span>
            <input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="e.g. Vsx2, breathing" />
          </label>

          <div className="filter-grid">
            <label>Transmitter
              <select value={filters.transmitter} onChange={(event) => setFilter("transmitter", event.target.value as Filters["transmitter"])}>
                <option value="all">All states</option>
                <option value="excitatory">Excitatory</option>
                <option value="inhibitory">Inhibitory</option>
                <option value="mixed_or_unspecified">Mixed / unspecified</option>
                <option value="state_dependent">State dependent</option>
              </select>
            </label>
            <label>Segment
              <select value={filters.segment} onChange={(event) => setFilter("segment", event.target.value as Filters["segment"])}>
                <option value="all">All segments</option>
                <option value="cervical">Cervical</option>
                <option value="thoracic">Thoracic</option>
                <option value="lumbar">Lumbar</option>
                <option value="sacral">Sacral</option>
              </select>
            </label>
            <label>Endpoint
              <select value={filters.endpoint} onChange={(event) => setFilter("endpoint", event.target.value as Filters["endpoint"])}>
                <option value="all">All endpoints</option>
                <option value="locomotion">Locomotion</option>
                <option value="breathing">Breathing</option>
                <option value="spasm">Spasm</option>
              </select>
            </label>
            <label>Injury model
              <select value={filters.injury} onChange={(event) => setFilter("injury", event.target.value)}>
                <option value="all">All models</option>
                {injuryOptions.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
              </select>
            </label>
          </div>

          <div className="population-list" role="list" aria-label="Evidence-linked prototype entities">
            {filteredEntities.map((entity) => (
              <button
                type="button"
                key={entity.id}
                className={`population-card ${entity.id === activeSelectedId ? "selected" : ""}`}
                onClick={() => selectEntity(entity.id)}
                onKeyDown={(event) => handlePopulationKeyDown(event, entity.id)}
                ref={(node) => {
                  if (node) populationRefs.current.set(entity.id, node);
                  else populationRefs.current.delete(entity.id);
                }}
                aria-pressed={entity.id === activeSelectedId}
                tabIndex={entity.id === rovingPopulationId ? 0 : -1}
              >
                <span className="population-dot" style={{ backgroundColor: TRANSMITTER_COLORS[entity.transmitter], color: TRANSMITTER_COLORS[entity.transmitter] }} />
                <span><strong>{entity.shortLabel}</strong><small>{prettify(entity.segmentGroup)} · {prettify(entity.endpoint)}</small></span>
                <em>{entity.geometry.status}</em>
              </button>
            ))}
            {!filteredEntities.length && (
              <div className="empty-state"><strong>No matching evidence entity</strong><p>This is a filter result, not evidence that the cell type does not exist.</p></div>
            )}
          </div>
          {!selectedEntityVisible && selected && (
            <p className="sci-focus-retained" role="status">
              Focus retained outside the filtered list: {selected.shortLabel}. Filters never substitute another SCI evidence entity.
            </p>
          )}

          <div className="layer-controls">
            <p>Visible layers</p>
            <label><input type="checkbox" checked={showScaffold} onChange={(event) => setLayer("scaffold", event.target.checked)} />Reference envelope · INF</label>
            <label><input type="checkbox" checked={showGrayMatter} onChange={(event) => setLayer("gray", event.target.checked)} />Internal source-ID contours + coarse gray · INF</label>
            <label title={populationEvidenceTargetActive ? "SCI evidence anchors may be shown for this exact SCI evidence record." : "Hidden because the current research focus is not an SCI evidence entity."}>
              <input type="checkbox" checked={populationEvidenceVisible} disabled={!populationEvidenceTargetActive} onChange={(event) => setLayer("entities", event.target.checked)} />
              SCI evidence anchors—not cells—plus paths · SYN/SCH{populationEvidenceTargetActive ? "" : " · hidden for current record"}
            </label>
            <label><input type="checkbox" checked={morphologyVisibleRequested} disabled={!morphologyTargetActive} onChange={(event) => setLayer("observedForm", event.target.checked)} />Source-local cell form · OBS</label>
            <label className="observed-form-picker">
              <span>Main scene · 13 unique exact source-local morphologies · 10 named spinal routes (8 dorsal-horn + 2 ventral-horn) · frozen 142-record census unchanged · 0 REG</span>
              <select value={viewportMorphologyNeuronId ?? ""} onChange={(event) => updateObservedCellForm(Number(event.target.value))}>
                <option value="" disabled>No main-scene morphology targeted</option>
                {observedCellFormRecords.map((record) => (
                  <option key={record.neuronId} value={record.neuronId}>
                    NMO {record.neuronId} · {observedMorphologyRouteByNeuronId.get(record.neuronId)?.title ?? record.phenotype}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="browse-all-morphologies"
              onClick={() => {
                updateObservedCellForm(grpDorsalHornObservedMorphology.sourceRecord.neuronId, "radius_surface");
                setNotice("Independent GRP dorsal-horn route opened · exact NMO 109021 geometry · source-local · unregistered · no same-specimen internal model");
              }}
            >Open exact GRP dorsal-horn route · NMO 109021</button>
            <button
              type="button"
              className="browse-all-morphologies"
              onClick={() => {
                selectResearchLab("morphology");
                setNotice("Exact morphology universe opened · 1,097 checksum-gated source objects · frozen adult subset remains 142 · no representative geometry");
                window.requestAnimationFrame(() => document.querySelector(".research-data-lab")?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }}
            >Browse exact morphology universe · 1,097 source objects</button>
            <div className="morphology-fidelity-controls" aria-label="Source-gated morphology fidelity mode">
              <p>Cell-form evidence mode</p>
              <button
                type="button"
                className={morphologyTargetActive && morphologyFidelityMode === "observed_swc" ? "active" : ""}
                aria-pressed={morphologyTargetActive && morphologyFidelityMode === "observed_swc"}
                disabled={!morphologyTargetActive}
                onClick={() => updateMorphologyFidelityMode("observed_swc")}
              >
                <span>Observed SWC</span><em>OBS</em>
              </button>
              <button
                type="button"
                className={morphologyTargetActive && morphologyFidelityMode === "radius_surface" ? "active" : ""}
                aria-pressed={morphologyTargetActive && morphologyFidelityMode === "radius_surface"}
                disabled={!morphologyTargetActive || !observedCellFidelity.modes.radiusSurface.available}
                title={!morphologyTargetActive
                  ? "No admitted main-scene morphology is bound to the current research focus."
                  : !observedCellFidelity.modes.radiusSurface.available
                    ? "Official source attributes report No Diameter; numeric placeholder radii are not authorized."
                    : "Deterministic tapered surface from source-authorized endpoint radii."}
                onClick={() => updateMorphologyFidelityMode("radius_surface")}
              >
                <span>Radius-derived surface</span><em>DER</em>
              </button>
              <button type="button" className="unavailable" disabled title="No same-specimen membrane, nucleus, organelle, bouton, receptor or ultrastructure source is available.">
                <span>Same-specimen interior</span><em>UNAVAILABLE</em>
              </button>
              <button
                type="button"
                className={view === "microns_observed_reference" ? "active observed-reference" : "observed-reference"}
                aria-pressed={view === "microns_observed_reference"}
                onClick={() => updateView("microns_observed_reference")}
                title="Exact MICrONS visual-cortex cell segmentation and source-linked nucleus. Cross-region reference only; not a spinal cell, molecular membrane or organelle reconstruction."
              >
                <span>Observed EM cell + nucleus</span><em>OBS / REF</em>
              </button>
              <div className="microns-layer-controls" aria-label="MICrONS observed-reference component visibility">
                <label><input type="checkbox" checked={showMicronsCellSurface} onChange={(event) => setLayer("micronsCellSurface", event.target.checked)} />Cell segmentation surface</label>
                <label><input type="checkbox" checked={showMicronsNucleus} onChange={(event) => setLayer("micronsNucleus", event.target.checked)} />Linked nucleus segmentation</label>
              </div>
              <button
                type="button"
                className={view === "internal_reference" ? "active reference" : "reference"}
                aria-pressed={view === "internal_reference"}
                onClick={() => updateView("internal_reference")}
                title="Audit the cross-region compartment vocabulary. No object-level geometry is admitted, so this route renders zero 3D primitives."
              >
                <span>Compartment evidence audit</span><em>UNAVAILABLE / 0 PRIMITIVES</em>
              </button>
              <small>{!morphologyTargetActive
                ? `No morphology rendered · ${prettify(morphologyVisualTarget.reason)}.`
                : observedCellFidelity.modes.radiusSurface.available
                ? "Surface uses exact endpoint radii with open 6-sided frusta; it is not an observed membrane."
                : "Official metadata: No Diameter. Surface mode fails closed; SWC topology remains available."}</small>
            </div>
            <small className="layer-boundary-note">Co-display does not assign this specimen to the selected SCI entity or to any molecular cluster.</small>
          </div>
        </aside>

        <section className="viewport-panel" aria-label="Three-dimensional atlas view">
          <div className="viewport-toolbar">
            <div>
              <span className={`live-dot ${webGLAvailable ? "" : "offline"}`} />
              <strong>{webGLAvailable ? "WEBGL 3D" : "ACCESSIBLE FALLBACK"}</strong>
              <small>{morphologyTargetActive
                ? `allen_cord_20um INF anatomy · SCI non-cell SYN lane ${populationEvidenceVisible ? "visible" : "hidden"} · NeuroMorpho 8.6.124 ${morphologyFidelityMode === "radius_surface" ? "OBS input + DER surface" : "OBS SWC centerlines"} · 0 REG`
                : `allen_cord_20um INF anatomy · SCI non-cell SYN lane ${populationEvidenceVisible ? "visible" : "hidden"} · no admitted morphology target · ${morphologyVisualTarget.reason}`}</small>
              {renderPerformance && (
                <span className="performance-readout" aria-label={`Renderer ${renderPerformance.fps} frames per second, ${renderPerformance.frameP95Ms} millisecond p95 frame, ${renderPerformance.drawCalls} draw calls, ${renderPerformance.triangles} triangles`}>
                  {renderPerformance.fps} fps · p95 {renderPerformance.frameP95Ms} ms · {renderPerformance.drawCalls} calls · {renderPerformance.triangles} tri
                </span>
              )}
            </div>
            <div className="view-actions" aria-label="Camera presets">
              {CAMERA_VIEWS.map((preset) => (
                <button type="button" key={preset} className={view === preset ? "active" : ""} aria-pressed={view === preset} disabled={preset === "cell_detail" && !morphologyTargetActive} onClick={() => updateView(preset)}>{prettify(preset)}</button>
              ))}
            </div>
          </div>

          <div className="model-stage">
            {webGLAvailable ? (
              <SceneCanvas
                entities={atlasRelease.entities}
                visibleIds={filteredEntities.map((entity) => entity.id)}
                selectedId={activeSelectedId}
                view={view}
                sliceZ={sliceZ}
                showScaffold={showScaffold}
                showGrayMatter={showGrayMatter}
                showEntities={populationEvidenceVisible}
                showObservedCellForm={morphologyVisibleRequested}
                morphologyTargetActive={morphologyTargetActive}
                showMicronsCellSurface={showMicronsCellSurface}
                showMicronsNucleus={showMicronsNucleus}
                micronsClipping={micronsClipping}
                observedCellFormId={viewportMorphologyNeuronId ?? 0}
                morphologyFidelityMode={morphologyFidelityMode}
                onSelect={selectEntity}
                onWebGLStatus={setWebGLAvailable}
                onCaptureReady={handleCaptureReady}
                onPerformance={handlePerformance}
                onMorphologyRuntime={handleMorphologyRuntime}
                onMicronsRuntime={handleMicronsRuntime}
              />
            ) : (
              <div className="webgl-fallback">
                <strong>3D rendering is unavailable</strong>
                <p>All entities, sources and evidence boundaries remain accessible in the lists and transverse orientation map.</p>
              </div>
            )}
            {view !== "internal_reference" && view !== "microns_observed_reference" && view !== "cell_detail" && <div className="orientation-label rostral">REFERENCE ROSTRAL · native AP</div>}
            {view !== "internal_reference" && view !== "microns_observed_reference" && view !== "cell_detail" && <div className="orientation-label caudal">REFERENCE CAUDAL · native AP</div>}
            {morphologyVisibleRequested && view !== "internal_reference" && view !== "microns_observed_reference" && <div className="observed-cell-lane-label">{morphologyFidelityMode === "radius_surface" ? "OBS SWC INPUT + DER RADIUS SURFACE" : "OBS SWC CENTERLINES"} · SOURCE-LOCAL · UNLINKED · 0 REG</div>}
            {populationEvidenceVisible && view !== "internal_reference" && view !== "microns_observed_reference" && view !== "cell_detail" && <div className="synthetic-lane-label">SCI SYN DATA ANCHORS · NOT CELLS · OUTSIDE ANATOMY · 0 REG</div>}
            {populationEvidenceVisible && view !== "internal_reference" && view !== "microns_observed_reference" && view !== "cell_detail" && (
              <div className="segment-scale" aria-label="Synthetic evidence-entity segment guide; not mapped to the reference loft">
                <span>C</span><span>T</span><span>L</span><span>S</span>
              </div>
            )}
            {populationEvidenceVisible && view !== "internal_reference" && view !== "microns_observed_reference" && view !== "cell_detail" && <CrossSectionInset entities={filteredEntities} selectedId={activeSelectedId} sliceZ={sliceZ} onSelect={selectEntity} />}
            {view === "microns_observed_reference" ? (
              <div className="stage-readout microns-observed-reference">
                <span>Mode</span><strong>MICrONS observed cell + linked nucleus</strong>
                <span>{micronsObservedCellNucleusReference.identityChain.cellClass} / {micronsObservedCellNucleusReference.identityChain.coarseMorphologyClassification} · visual cortex L2/3</span>
                <span>OBS EM segmentation · same source-linked cell · spinal relationship co-display only · 0 joins · 0 REG</span>
              </div>
            ) : view === "internal_reference" ? (
              <div className="stage-readout internal-reference" data-focus-kind={researchFocus?.focusKind ?? "none"} data-focus-id={researchFocus?.focusId ?? "none"}>
                <span>Current knowledge record · {researchFocus ? prettify(researchFocus.focusKind) : "none"}</span>
                <strong>{researchFocus?.focusId ?? "No selected source record"}</strong>
                <span>0 same-record internal primitives · 5 vocabulary classes remain UNAVAILABLE</span>
                <span>Evidence audit only · 0 source meshes · 0 joins · 0 REG</span>
              </div>
            ) : !morphologyTargetActive && researchFocus?.focusKind === "molecular_profile" ? (
              <ResearchRecordModelReadout focus={researchFocus} />
            ) : !morphologyTargetActive ? (
              <div
                className="stage-readout empty morphology-target-empty"
                role="status"
                data-focus-kind={researchFocus?.focusKind ?? "none"}
                data-focus-id={researchFocus?.focusId ?? "none"}
                data-reason={morphologyVisualTarget.reason}
              >
                <span>Current research focus · {researchFocus ? prettify(researchFocus.focusKind) : "none"}</span>
                <strong>{researchFocus?.focusId ?? "No selected source record"}</strong>
                <span>0 admitted main-scene geometry · {morphologyVisualTarget.reason}</span>
                <span>{morphologyVisualTarget.reason === SOURCE_SPECIFIC_MORPHOLOGY_VIEWER_ONLY
                  ? `Exact ${morphologyViewerFocusId ?? "morphology"} is available only in the source-specific Morphology Viewer · no fallback rendered`
                  : "The current focus has no admitted morphology link · prior geometry cleared"}</span>
              </div>
            ) : view === "cell_detail" ? (
              <div className="stage-readout cell-detail">
                <span>Mode</span><strong>Source-local cell detail · NMO {observedCellForm.neuronId}</strong>
                <span>{morphologyFidelityMode === "radius_surface" ? "OBS input + DER surface" : "OBS SWC centerlines"}</span>
                <span>independent from selected evidence entity · 0 REG</span>
              </div>
            ) : selected ? (
              <div className="stage-readout">
                <span>Selected</span><strong>{selected.shortLabel}</strong>
                <span>separate unregistered lane</span>
                <span>{selected.geometry.status} geometry</span>
              </div>
            ) : (
              <div className="stage-readout empty"><span>No entity selected</span><strong>0 matching evidence entities</strong></div>
            )}
          </div>

          {morphologyTargetActive ? <section className="observed-cell-disclosure" aria-label="Selected source-local morphology fidelity, provenance and missingness">
            <div className="observed-cell-heading">
              <p className="panel-kicker">SOURCE-LOCAL MORPHOLOGY · EVIDENCE-GATED FIDELITY</p>
              <h2>NeuroMorpho {observedCellForm.neuronId}</h2>
              <p>{observedMorphologyRoute?.title ?? observedCellForm.phenotype}</p>
              {observedMorphologyRoute && <p><strong>{observedMorphologyRoute.routeId}</strong> · independent route · {observedMorphologyRoute.censusMembership ? "census child" : "supplementary exact object"} · {observedMorphologyRoute.contractId}</p>}
              <span className={`fidelity-active-badge ${morphologyFidelityMode === "radius_surface" ? "derived" : "observed"}`}>
                {morphologyFidelityMode === "radius_surface" ? "OBS SWC INPUT + DERIVED SURFACE" : "OBSERVED SWC CENTERLINES"}
              </span>
            </div>
            <dl className="observed-cell-metrics">
              <div><dt>Observed domain</dt><dd>{observedCellForm.domain}</dd></div>
              <div><dt>Physical integrity</dt><dd>{observedCellForm.physicalIntegrity}</dd></div>
              <div><dt>Nodes / edges</dt><dd>{observedCellFidelity.geometry.nodeCount.toLocaleString()} / {observedCellFidelity.geometry.segmentCount.toLocaleString()}</dd></div>
              <div><dt>Dimensionality</dt><dd>{observedCellFidelity.geometry.dimensionality} · source-local · 0 REG</dd></div>
              <div><dt>Diameter authority</dt><dd>{observedCellFidelity.geometry.sourceDiameterAvailable ? "Source reports Diameter" : "Source reports No Diameter"}</dd></div>
              <div><dt>Axon evidence</dt><dd>{observedCellFidelity.axon.sourceType2NodeCount > 0 ? `${observedCellFidelity.axon.sourceType2NodeCount.toLocaleString()} type-2 nodes · incomplete` : "No axon source type"}</dd></div>
            </dl>

            <div className="fidelity-mode-matrix" aria-label="Morphology evidence-mode availability">
              <article className={morphologyFidelityMode === "observed_swc" ? "active available" : "available"}>
                <span>MODE 1 · AVAILABLE</span><strong>Observed SWC</strong><p>Coordinates, topology and source types, with exact root, type-1 sample, branchpoint and terminal landmarks derived from parent links. Type 1 is not a soma contour; terminals are not boutons or internal structures. Stroke width is not caliber.</p>
              </article>
              <article className={`${morphologyFidelityMode === "radius_surface" ? "active " : ""}${observedCellFidelity.modes.radiusSurface.available ? "available" : "unavailable"}`}>
                <span>MODE 2 · {observedCellFidelity.modes.radiusSurface.available ? "AVAILABLE" : "UNAVAILABLE"}</span><strong>Radius-derived surface</strong>
                <p>{observedCellFidelity.modes.radiusSurface.available
                  ? `${observedCellFidelity.radiusEvidence.minimumMicrometre?.toFixed(3)}–${observedCellFidelity.radiusEvidence.maximumMicrometre?.toFixed(3)} µm source radius · exact endpoints · no caps or smoothing.`
                  : "Official No Diameter record. Placeholder SWC radii are ignored; zero surface primitives."}</p>
              </article>
              <article className="unavailable">
                <span>MODE 3 · UNAVAILABLE</span><strong>Same-specimen internal structure</strong><p>No membrane segmentation, nucleus, organelles, boutons, receptor map or ultrastructure for this cell.</p>
              </article>
              <article className={view === "microns_observed_reference" ? "active observed-reference" : "observed-reference"}>
                <span>MODE 4 · OBSERVED CROSS-REGION REFERENCE</span><strong>MICrONS cell segmentation + linked nucleus</strong><p>Exact v185.4 visual-cortex objects; same source-linked physical cell. Not membrane, spinal identity, molecular subtype, organelle map or registration.</p>
              </article>
              <article className={view === "internal_reference" ? "active reference" : "reference"}>
                <span>MODE 5 · OBJECT GEOMETRY UNAVAILABLE</span><strong>Compartment evidence audit</strong><p>Five source-grounded vocabulary classes, but no admitted object geometry. Zero cell, nucleus, organelle, neurite or synapse primitives.</p>
              </article>
            </div>

            <NativeContourRecordViewer key={observedCellForm.neuronId} neuronId={observedCellForm.neuronId} />

            <div className={`morphology-runtime-receipt ${morphologyRuntime.verificationStatus}`} role="status" aria-live="polite">
              <strong>VIEWPORT RUNTIME</strong>
              <span>{morphologyRuntime.requestedNeuronId !== observedCellFormId || morphologyRuntime.requestedMode !== morphologyFidelityMode
                ? "Synchronizing the selected evidence mode; no prior runtime state will be exported as current."
                : morphologyRuntime.verificationStatus === "verified"
                  ? morphologyRuntime.visible
                    ? `Geometry bytes verified · ${morphologyRuntime.actualMode === "radius_surface" ? "derived surface" : "observed SWC"} rendered and visible.`
                    : "Geometry bytes verified and scene object built · morphology layer is hidden in the viewport."
                  : morphologyRuntime.verificationStatus === "loading"
                    ? "Geometry verification is in progress · no morphology is yet reported as rendered."
                    : `No verified morphology rendered · ${prettify(morphologyRuntime.reason ?? morphologyRuntime.verificationStatus)}.`}</span>
            </div>

            <details className="morphology-receipt">
              <summary>Geometry receipt and deterministic surface contract</summary>
              <dl>
                <div><dt>Geometry SHA-256</dt><dd>{observedCellFidelity.geometry.sha256}</dd></div>
                <div><dt>Raw SWC SHA-256</dt><dd>{observedCellFidelity.geometry.rawSwcSha256}</dd></div>
                <div><dt>Derived algorithm</dt><dd>{observedCellFidelity.modes.radiusSurface.available ? morphologyFidelityContract.derivedSurfaceAlgorithm.algorithmId : "not authorized"}</dd></div>
                <div><dt>Surface claim</dt><dd>Open per-edge display derivative · not membrane · measurement forbidden</dd></div>
              </dl>
            </details>
            <div className="observed-cell-boundary">
              <strong>RELATIONSHIP AND INTERNAL DETAIL NOT ESTABLISHED</strong>
              <span>Not the morphology of {selected?.shortLabel ?? "the selected SCI entity"}; not assigned to a Russ, Sathyamurthy, Hayashi, Häring, or Matson type. Co-display never fills missing biology.</span>
            </div>
            {observedMorphologyRoute && (
              <div className="observed-cell-boundary">
                <strong>INDEPENDENT ROUTE WARNINGS · NMO {observedCellForm.neuronId}</strong>
                <ul>{observedMorphologyRoute.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
              </div>
            )}
            <div className="observed-cell-links">
              <a href={observedMorphologyRoute?.sourceLinks.officialRecord ?? `https://neuromorpho.org/api/neuron/id/${observedCellForm.neuronId}`} target="_blank" rel="noreferrer">NeuroMorpho record ↗</a>
              <a href={observedMorphologyRoute?.sourceLinks.primaryPaper ?? `https://doi.org/${observedCellForm.sourcePaperDoi}`} target="_blank" rel="noreferrer">Primary paper ↗</a>
              <a href={observedMorphologyRoute?.sourceLinks.rights ?? observedCellFormLens.sourceObject.rightsUrl} target="_blank" rel="noreferrer">Rights and attribution ↗</a>
            </div>
          </section> : (
            <section className="observed-cell-disclosure morphology-target-context" aria-label="Research-focus morphology context" data-reason={morphologyVisualTarget.reason}>
              <div className="observed-cell-heading">
                <p className="panel-kicker">SOURCE-GROUNDED VISUAL TARGET · FAIL-CLOSED</p>
                <h2>No main-scene morphology selected</h2>
                <p>{morphologyVisualTarget.reason === SOURCE_SPECIFIC_MORPHOLOGY_VIEWER_ONLY
                  ? `The exact ${morphologyViewerFocusId ?? "morphology record"} remains available in the source-specific Morphology Viewer.`
                  : "The current research focus has no admitted link to an observed source-local morphology."}</p>
                <span className="fidelity-active-badge">0 MORPHOLOGY PRIMITIVES · NO FALLBACK</span>
              </div>
              <div className="observed-cell-boundary" role="status">
                <strong>{morphologyVisualTarget.reason}</strong>
                <span>Any previously displayed NeuroMorpho object was removed and its request was cancelled. The application did not substitute another cell.</span>
              </div>
            </section>
          )}

          <div className="slice-control">
            <label htmlFor="slice-position">Transverse plane</label>
            <input id="slice-position" type="range" min="-20" max="20" step="0.5" value={sliceZ} onChange={(event) => updateSlice(Number(event.target.value))} />
            <output>{sliceZ.toFixed(1)} display u. · SYN guide</output>
          </div>
          <div className="evidence-legend" aria-label="Visual evidence legend">
            <span><i className="observed" />OBS observed</span>
            <span><i className="derived" />DER deterministic derivative</span>
            <span><i className="registered" />REG registered</span>
            <span><i className="inferred" />INF inferred</span>
            <span><i className="schematic" />SCH schematic path</span>
            <span><i className="synthetic" />SYN non-cell evidence node</span>
          </div>
          <section className="representation-authority-panel" aria-labelledby="representation-authority-title">
            <header>
              <div><span>UPG-124 · MACHINE-READABLE RENDER AUTHORITY</span><strong id="representation-authority-title">What the active 3D objects are—and are not</strong></div>
              <em>{activeRepresentationRoutes.length} active route{activeRepresentationRoutes.length === 1 ? "" : "s"} · 0 joins · 0 REG</em>
            </header>
            <div className="representation-route-grid">
              {activeRepresentationRoutes.map((route) => (
                <article key={route.routeId}>
                  <span>{route.representationStateIds.join(" + ")}</span>
                  <strong>{route.label}</strong>
                  <p>{route.renderedPrimitivePolicy.replaceAll("_", " ")}</p>
                  <small>{route.sourceVersion} · frame: {route.sourceFrame}</small>
                  <code>{route.sourceReceipt.sha256}</code>
                </article>
              ))}
            </div>
            <details>
              <summary>Representation meanings and prohibited claims ({activeRepresentationStates.length})</summary>
              <div className="representation-state-list">
                {activeRepresentationStates.map((state) => (
                  <article key={state.id}>
                    <span>{state.id}</span><strong>{state.label}</strong>
                    <p>{state.meaning}</p><small>Not authorized: {state.forbiddenClaim}.</small>
                  </article>
                ))}
              </div>
            </details>
          </section>
        </section>

        <aside className="evidence-rail">
          <div className="rail-tabs seven" role="tablist" aria-label="Evidence research panels">
            {SIDE_PANELS.map((panel) => (
              <button
                id={`${panel}-tab`}
                key={panel}
                ref={(node) => {
                  if (node) panelRefs.current.set(panel, node);
                  else panelRefs.current.delete(panel);
                }}
                type="button"
                role="tab"
                aria-selected={sidePanel === panel}
                aria-controls={`${panel}-panel`}
                tabIndex={sidePanel === panel ? 0 : -1}
                className={sidePanel === panel ? "active" : ""}
                onClick={() => selectPanel(panel)}
                onKeyDown={(event) => handleTabKeyDown(event, panel)}
              >{SIDE_PANEL_LABELS[panel]}</button>
            ))}
          </div>
          <div id={`${sidePanel}-panel`} role="tabpanel" aria-labelledby={`${sidePanel}-tab`}>
            {sidePanel === "evidence" && (
              <ResearchFocusEvidencePanel
                focus={researchFocus}
                sciEntity={selected}
              />
            )}
            {sidePanel === "structure" && (
              <InternalStructureReferencePanel
                schematicActive={view === "internal_reference"}
                micronsActive={view === "microns_observed_reference"}
                focusKind={researchFocus?.focusKind ?? null}
                focusId={researchFocus?.focusId ?? null}
                showMicronsCellSurface={showMicronsCellSurface}
                showMicronsNucleus={showMicronsNucleus}
                micronsClipping={micronsClipping}
                onOpenSchematic={() => updateView("internal_reference")}
                onOpenMicrons={() => updateView("microns_observed_reference")}
                onToggleMicronsCellSurface={(visible) => setLayer("micronsCellSurface", visible)}
                onToggleMicronsNucleus={(visible) => setLayer("micronsNucleus", visible)}
                onToggleMicronsClipping={setMicronsClipEnabled}
                onMicronsClippingAxisChange={setMicronsClipAxis}
                onMicronsClippingPositionChange={setMicronsClipPosition}
                onMicronsClippingSideChange={setMicronsClipSide}
                onResetMicronsClipping={resetMicronsClipping}
              />
            )}
            {sidePanel === "compare" && <ComparisonPanel selectedIds={comparisonIds} onToggle={toggleComparison} />}
            {sidePanel === "gaps" && <GapsPanel entity={selected} />}
            {sidePanel === "sources" && (
              <PublicDataWorkbench
                state={persistentState.catalog}
                entityId={activeSelectedId}
                onStateChange={setCatalogState}
                onNotice={setNotice}
              />
            )}
            {sidePanel === "review" && <CuratorFeedbackInbox onNotice={setNotice} />}
            {sidePanel === "benchmarks" && <BenchmarkPanel />}
          </div>
        </aside>
      </section>

      <footer className="atlas-footer">
        <p aria-live="polite" aria-atomic="true"><span className="status-pulse" />{notice}</p>
        <p><strong>Unpackaged research iteration 2.50</strong> · canonical registry {formatResearchSourceRegistrySummary(researchSourceRegistrySummary)} · source catalog {publicDataCatalog.schemaVersion} · {publicDataCatalog.sources.length} public sources · {publicDataCatalog.upgradeQueue.length} source-admission records · selected-record native contour routing admits {neurolucidaNativeContourAdmissionCatalog.summary.admittedContourObjectCount} exact OBS LineLoops / {neurolucidaNativeContourAdmissionCatalog.summary.admittedVertexCount.toLocaleString("en-US")} vertices across {neurolucidaNativeContourAdmissionCatalog.summary.auditedDatFileCount} audited records; NMO 50394 alone has one separately receipted DER open interpolation shell; raw false flags and excluded User Line objects remain visible; every record switch clears inapplicable detail; 0 observed surfaces, volumes, internal objects and registrations</p>
        <p>BrainGlobe <code>allen_cord_20um:3.0</code> INF · 1,097 exact NeuroMorpho no-age-query objects = 149 reused exact assets + 948 delta raw SWCs · frozen adult subset remains 142 · 39 source-labelled 2D · 0 complete-axon claims · 0 REG</p>
      </footer>
      <p className="fixed-disclaimer">{atlasRelease.fixedDisclaimer}</p>
    </main>
    </ResearchActiveRecordProvider>
  );
}
