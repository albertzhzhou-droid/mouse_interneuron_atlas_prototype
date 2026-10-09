"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MorphologyNeuriteInspector, { type NeuriteInspectionController, type NeuriteInspectionSelection } from "./MorphologyNeuriteInspector";
import { attachSwcNeuriteInspection } from "./morphology-neurite-inspection.js";
import { canUseRadiusDerivedSurface, resolveMorphologyRenderMode } from "./morphology-render-mode.js";
import { computePerspectiveSphereFitDistance } from "./morphology-viewport-scale.js";
import { morphologyFidelityContract } from "./atlas-types";
import {
  createObservedSwcCenterlines,
  createObservedTopologyLandmarks,
  extractObservedTopologyLandmarks,
  createRadiusDerivedSurface,
  sha256Hex,
} from "./source-local-morphology-geometry.js";
import {
  MorphologyCohortAnalysis,
  MorphologyRecordAnalysis,
  useMorphologyAnalysis,
} from "./MorphologyAnalysisPanel";
import MorphologyMatrixPanel from "./MorphologyMatrixPanel";
import MorphologyComparePanel from "./MorphologyComparePanel";
import MorphologyRecordDisclosure from "./MorphologyRecordDisclosure";
import MorphologyTopologyDetailPanel from "./MorphologyTopologyDetailPanel";
import NeuroMorphoUniversePanel from "./NeuroMorphoUniversePanel";
import { useSourceListRovingFocus } from "./useSourceListRovingFocus";
import { asFrozenCensusComparisonRecord, type MorphologyGeometryPayload } from "./morphology-census-data";
import { readVerifiedMorphologyGeometry, morphologyGeometryVerificationReceipt } from "./morphology-geometry-verification.js";
import { morphologySourceIdentityHierarchy } from "./morphology-source-identity.js";
import MorphologySourceProof from "./MorphologySourceProof";
import MorphologySourceViewControls from "./MorphologySourceViewControls";
import { appendMorphologyExportPng, assertMorphologyPngCurrent, morphologyPngCaptions } from "./morphology-png-export.js";
import { encodeSourceViewPng } from "./source-view-png-raster.js";
import { captureIndividualMorphologySourceView, validateIndividualMorphologySourceViewReplay, assertMorphologySourceViewSceneBounds, assertMorphologySourceViewAppliedPose,
  type IndividualMorphologySourceView, type IndividualMorphologySourceViewDocument } from "./morphology-source-view.js";

let individualViewportSequence = 0;
import { morphologySourceFrameDisclosureFor } from "./morphology-source-frame-disclosure";
import {
  supplementaryMorphologyAdapterStatus,
  supplementaryMorphologyRecords,
  useSupplementaryMorphologyAnalysis,
} from "./supplementary-morphology-comparison";
import {
  DEFAULT_MORPHOLOGY_COMPARISON_IDS,
  MORPHOLOGY_MATRIX_VIEWS,
  normalizeMorphologyComparisonIds,
  parseMorphologyComparisonIds,
} from "./morphology-matrix-state.js";

type ExplicitMissingValue = { value: unknown; missingReason: string | null };

type CensusRecord = {
  assetId: string;
  neuronId: number;
  officialMetadata: Record<string, unknown>;
  normalizedMetadata: {
    name: string;
    archive: string;
    species: string | string[];
    lifeStage: string;
    brainRegion: string[];
    cellType: string[];
    strain: string | string[];
    gender: string | string[];
    experimentCondition: string | string[];
    domain: string;
    physicalIntegrity: string;
    attributes: string;
    dimensionality: "2D" | "3D";
    sourceDiameterAvailable: boolean;
    sourceFrame: string;
    registrationStatus: "unregistered";
  };
  missingness: Record<string, ExplicitMissingValue>;
  sourcePaper: { pmids: string[]; dois: string[] };
  geometry: {
    available: boolean;
    path: string | null;
    sha256: string | null;
    bytes: number | null;
    rawSwcPath: string | null;
    rawSwcSha256: string | null;
    missingReason: string | null;
  };
  qc: Record<string, unknown>;
  morphometrics: {
    sourceReported: Record<string, unknown>;
    computed: Record<string, unknown>;
  };
};

type CensusPayload = {
  schemaVersion: string;
  assetSetId: string;
  release: string;
  snapshot: Record<string, unknown>;
  authority: Record<string, unknown>;
  rights: Record<string, unknown>;
  scientificBoundary: string | string[];
  summary: Record<string, unknown>;
  records: CensusRecord[];
};

type GeometryPayload = MorphologyGeometryPayload;

type SelectFilter = "all" | string;
type RenderMode = "skeleton" | "radius";
type RenderModeSelection = { neuronId: number | null; mode: RenderMode };
type MorphologyView = "universe" | "individual" | "matrix" | "compare" | "cohorts";
type InitialParam = string | string[] | undefined;

const CENSUS_BASE = "/data/neuromorpho_release_8_6_124_census_v1/";
const CENSUS_URL = `${CENSUS_BASE}census-index.json`;
const TYPE_COLORS: Record<number, number> = {
  1: 0xf3b33e,
  2: 0xd55e00,
  3: 0x56b4e9,
  4: 0xcc79a7,
  5: 0x009e73,
  6: 0xb8a6d9,
  7: 0x7bd3be,
};
const TYPE_LABELS: Record<number, string> = {
  1: "Type-1 soma samples",
  2: "Axon",
  3: "Dendrite",
  4: "Apical dendrite",
  5: "Source type 5",
  6: "Uninterpreted neurite (source type 6)",
  7: "Source type 7",
};

function textList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

function normalizedText(value: unknown): string {
  return textList(value).join(" · ");
}

function classification(record: CensusRecord): string {
  const labels = record.normalizedMetadata.cellType.map((value) => value.toLowerCase());
  if (labels.some((value) => value.includes("inhibitory"))) return "inhibitory";
  if (labels.some((value) => value.includes("excitatory"))) return "excitatory";
  return "unclassified";
}

function hasAxon(record: CensusRecord): boolean {
  const domain = record.normalizedMetadata.domain.toLowerCase();
  return domain.includes("axon") && !domain.includes("no axon");
}

function hasDiameter(record: CensusRecord): boolean {
  return record.normalizedMetadata.sourceDiameterAvailable;
}

function dimensionality(record: CensusRecord): "2D" | "3D" | "not reported" {
  return record.normalizedMetadata.dimensionality ?? "not reported";
}

function sourcePaper(record: CensusRecord): string {
  return record.sourcePaper.dois[0] ?? record.sourcePaper.pmids[0] ?? "Source paper unavailable";
}

function readableKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function readableMetric(value: unknown): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (Array.isArray(value)) return value.map(readableMetric).join(" × ");
  if (value === null || value === undefined || value === "") return "Not reported";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => `${readableKey(key)}: ${readableMetric(nested)}`)
      .join(" · ");
  }
  return typeof value === "string" ? readableKey(value) : String(value);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function recordSearchText(record: CensusRecord): string {
  const metadata = record.normalizedMetadata;
  return [
    record.neuronId,
    metadata.name,
    metadata.archive,
    ...metadata.brainRegion,
    ...metadata.cellType,
    normalizedText(metadata.strain),
    normalizedText(metadata.gender),
    normalizedText(metadata.experimentCondition),
    metadata.domain,
    metadata.physicalIntegrity,
    ...record.sourcePaper.dois,
    ...record.sourcePaper.pmids,
  ].join(" ").toLowerCase();
}

function morphologyViewFromLocation(): MorphologyView {
  if (typeof window === "undefined") return "individual";
  const candidate = new URLSearchParams(window.location.search).get("morphologyView");
  return typeof candidate === "string" && MORPHOLOGY_MATRIX_VIEWS.includes(candidate)
    ? candidate as MorphologyView
    : "individual";
}

function morphologyViewFromInitial(value: InitialParam): MorphologyView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && MORPHOLOGY_MATRIX_VIEWS.includes(candidate)
    ? candidate as MorphologyView
    : "universe";
}

function comparisonIdsFromLocation() {
  if (typeof window === "undefined") return [];
  return parseMorphologyComparisonIds(new URLSearchParams(window.location.search).get("morphologyCompare"));
}

function neuronIdFromInitial(value: InitialParam): number | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function replaceUrlValue(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function MorphologyViewer({
  initialView,
  initialNeuron,
  selectedFocusId,
  onSelectedFocusChange,
  morphologySearchQuery = "",
  morphologyDiscoveryRequestId = 0,
  onMorphologySearchQueryChange,
}: {
  initialView?: InitialParam;
  initialNeuron?: InitialParam;
  selectedFocusId?: string | null;
  onSelectedFocusChange?: (focusId: string) => void;
  morphologySearchQuery?: string;
  morphologyDiscoveryRequestId?: number;
  onMorphologySearchQueryChange?: (query: string) => void;
}) {
  const explicitDiscoveryMode = morphologyDiscoveryRequestId > 0 || morphologySearchQuery.trim().length > 0;
  const discoveryModeRef = useRef(explicitDiscoveryMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const inspectionRef = useRef<NeuriteInspectionController | null>(null);
  const [inspectionSelection, setInspectionSelection] = useState<NeuriteInspectionSelection | null>(null);
  const inspectionSelectionRef = useRef<NeuriteInspectionSelection | null>(null);
  const hiddenTypesRef = useRef<Set<number>>(new Set());
  const renderedModesRef = useRef<{ skeleton: THREE.Group; radius: THREE.Group | null } | null>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);
  const [payload, setPayload] = useState<CensusPayload | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<number | null>(() => explicitDiscoveryMode ? null : neuronIdFromInitial(initialNeuron));
  const [view, setView] = useState<MorphologyView>(() => explicitDiscoveryMode ? "universe" : morphologyViewFromInitial(initialView));
  // Keep the server and first client render byte-identical. The verified census
  // load below restores URL selections after hydration, when `window` is safe.
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);
  const [geometryState, setGeometryState] = useState<{ neuronId: number; data: GeometryPayload } | null>(null);
  const [indexError, setIndexError] = useState("");
  const [geometryErrorState, setGeometryErrorState] = useState<{ neuronId: number; message: string } | null>(null);
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const query = morphologySearchQuery;
  const [archiveFilter, setArchiveFilter] = useState<SelectFilter>("all");
  const [classFilter, setClassFilter] = useState<SelectFilter>("all");
  const [paperFilter, setPaperFilter] = useState<SelectFilter>("all");
  const [axonFilter, setAxonFilter] = useState<SelectFilter>("all");
  const [integrityFilter, setIntegrityFilter] = useState<SelectFilter>("all");
  const [dimensionFilter, setDimensionFilter] = useState<SelectFilter>("all");
  const [geometryFilter, setGeometryFilter] = useState<SelectFilter>("all");
  const [ageFilter, setAgeFilter] = useState<SelectFilter>("all");
  const [conditionFilter, setConditionFilter] = useState<SelectFilter>("all");
  const [renderModeSelection, setRenderModeSelection] = useState<RenderModeSelection>({ neuronId: null, mode: "skeleton" });
  const [hiddenTypes, setHiddenTypes] = useState<Set<number>>(() => new Set());
  const [showTopologyLandmarks, setShowTopologyLandmarks] = useState(true);
  const [viewSignature, setViewSignature] = useState("");
  const [restoreState, setRestoreState] = useState<{ sourceKey: string; status: "pending" | "verified" | "unavailable"; failure: string } | null>(null);
  const captureViewRef = useRef<(() => IndividualMorphologySourceViewDocument) | null>(null);
  const exportPngRef = useRef<((document: unknown) => Promise<{ blob: Blob; preview: string }>) | null>(null);
  const refreshViewRef = useRef<(() => void) | null>(null);
  const mutationRevisionRef = useRef(0);
  const runtimeRevisionRef = useRef(0);
  const restoreOperationRef = useRef(0);
  const restoreAbortRef = useRef<AbortController | null>(null);
  const pendingRestoreRef = useRef<{ operation: number; sourceKey: string; document: IndividualMorphologySourceViewDocument; resolve: () => void; reject: (error: Error) => void } | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const analysisState = useMorphologyAnalysis();
  const supplementaryAnalysisState = useSupplementaryMorphologyAnalysis();
  const controlledNeuronId = selectedFocusId?.startsWith("NeuroMorpho:")
    ? Number(selectedFocusId.slice("NeuroMorpho:".length))
    : Number.NaN;
  const selectedId = Number.isInteger(controlledNeuronId) && controlledNeuronId > 0
    ? controlledNeuronId
    : internalSelectedId;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetch(CENSUS_URL, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Census request failed (${response.status})`);
        const bytes = await response.arrayBuffer();
        if (cancelled || controller.signal.aborted) throw new DOMException("Census load cancelled", "AbortError");
        const receipt = morphologyFidelityContract.sourceObjects.censusIndex;
        if (bytes.byteLength !== receipt.bytes || await sha256Hex(bytes) !== receipt.sha256) {
          throw new Error("Census checksum verification failed");
        }
        if (cancelled || controller.signal.aborted) throw new DOMException("Census load cancelled", "AbortError");
        return JSON.parse(new TextDecoder().decode(bytes)) as CensusPayload;
      })
      .then((nextPayload) => {
        if (cancelled || controller.signal.aborted) return;
        setPayload(nextPayload);
        const preferred = nextPayload.records.find((record) => record.neuronId === 109005 && record.geometry.available);
        setInternalSelectedId((current) => current ?? (discoveryModeRef.current ? null : preferred?.neuronId ?? nextPayload.records[0]?.neuronId ?? null));
        const availableIds = [
          ...nextPayload.records.filter((record) => record.geometry.available).map((record) => record.neuronId),
          ...supplementaryMorphologyRecords.filter((record) => record.geometry.available).map((record) => record.neuronId),
        ];
        setComparisonIds((current) => normalizeMorphologyComparisonIds(
          current.length ? current : comparisonIdsFromLocation(),
          availableIds,
          DEFAULT_MORPHOLOGY_COMPARISON_IDS,
        ));
      })
      .catch((error: Error) => {
        if (!cancelled && !controller.signal.aborted && error.name !== "AbortError") setIndexError(error.message);
      });
    return () => { cancelled = true; controller.abort(); };
  }, []);

  useEffect(() => {
    if (morphologyDiscoveryRequestId < 1) return;
    replaceUrlValue("morphologyView", null);
  }, [morphologyDiscoveryRequestId]);

  useEffect(() => {
    const restore = () => {
      setView(explicitDiscoveryMode ? "universe" : morphologyViewFromLocation());
      if (payload) {
        setComparisonIds(normalizeMorphologyComparisonIds(
          comparisonIdsFromLocation(),
          [
            ...payload.records.filter((record) => record.geometry.available).map((record) => record.neuronId),
            ...supplementaryMorphologyRecords.filter((record) => record.geometry.available).map((record) => record.neuronId),
          ],
          DEFAULT_MORPHOLOGY_COMPARISON_IDS,
        ));
      }
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [explicitDiscoveryMode, payload]);

  const records = useMemo(() => payload?.records ?? [], [payload]);
  const comparisonRecords = useMemo(() => [
    ...records.map(asFrozenCensusComparisonRecord),
    ...supplementaryMorphologyRecords,
  ], [records]);
  const matrixComparisonIds = useMemo(() => normalizeMorphologyComparisonIds(
    comparisonIds,
    records.filter((record) => record.geometry.available).map((record) => record.neuronId),
    DEFAULT_MORPHOLOGY_COMPARISON_IDS,
  ), [comparisonIds, records]);

  const filterOptions = useMemo(() => ({
    archives: uniqueSorted(records.map((record) => record.normalizedMetadata.archive)),
    papers: uniqueSorted(records.map(sourcePaper)),
    integrity: uniqueSorted(records.map((record) => record.normalizedMetadata.physicalIntegrity)),
    conditions: uniqueSorted(records.flatMap((record) => textList(record.normalizedMetadata.experimentCondition))),
  }), [records]);

  const filteredRecords = useMemo(
    () => records.filter((record) => {
      if (deferredQuery && !recordSearchText(record).includes(deferredQuery)) return false;
      if (archiveFilter !== "all" && record.normalizedMetadata.archive !== archiveFilter) return false;
      if (classFilter !== "all" && classification(record) !== classFilter) return false;
      if (paperFilter !== "all" && sourcePaper(record) !== paperFilter) return false;
      if (axonFilter === "present" && !hasAxon(record)) return false;
      if (axonFilter === "absent" && hasAxon(record)) return false;
      if (integrityFilter !== "all" && record.normalizedMetadata.physicalIntegrity !== integrityFilter) return false;
      if (dimensionFilter !== "all" && dimensionality(record) !== dimensionFilter) return false;
      if (geometryFilter === "available" && !record.geometry.available) return false;
      if (geometryFilter === "quarantined" && record.geometry.available) return false;
      const numericAgeKnown = record.missingness.numericAge?.value !== null && record.missingness.numericAge?.value !== undefined;
      if (ageFilter === "known" && !numericAgeKnown) return false;
      if (ageFilter === "missing" && numericAgeKnown) return false;
      if (conditionFilter !== "all" && !textList(record.normalizedMetadata.experimentCondition).includes(conditionFilter)) return false;
      return true;
    }),
    [ageFilter, archiveFilter, axonFilter, classFilter, conditionFilter, deferredQuery, dimensionFilter, geometryFilter, integrityFilter, paperFilter, records],
  );

  const effectiveSelectedId = selectedId ?? (explicitDiscoveryMode ? null : filteredRecords[0]?.neuronId ?? null);
  const selectedRecordVisible = selectedId === null || filteredRecords.some((record) => record.neuronId === selectedId);
  const selectedRecord = useMemo(
    () => records.find((record) => record.neuronId === effectiveSelectedId) ?? null,
    [effectiveSelectedId, records],
  );
  const listFocus = useSourceListRovingFocus(filteredRecords.map(record => `NeuroMorpho:${record.neuronId}`), selectedRecord ? `NeuroMorpho:${selectedRecord.neuronId}` : null, "neuromorpho-frozen-individual");
  const selectedAnalysisRecord = analysisState.payload?.records.find((record) => record.neuronId === selectedRecord?.neuronId) ?? null;
  const selectedComparisonRecord = useMemo(() => selectedRecord ? asFrozenCensusComparisonRecord(selectedRecord) : null, [selectedRecord]);
  const selectedSourceIdentity = selectedComparisonRecord ? morphologySourceIdentityHierarchy(selectedComparisonRecord) : undefined;
  const individualSourceKey = `${selectedRecord?.neuronId ?? "none"}:${selectedRecord?.geometry.sha256 ?? "none"}`;
  const restoringView = restoreState?.sourceKey === individualSourceKey && restoreState.status === "pending";
  const restoreFailure = restoreState?.sourceKey === individualSourceKey ? restoreState.failure : "";
  const viewVerificationUnavailable = restoreState?.sourceKey === individualSourceKey && restoreState.status !== "verified";
  const currentGeometryProof = !viewVerificationUnavailable && geometryState && selectedRecord && geometryState.neuronId === selectedRecord.neuronId
    ? (() => {
      try { return morphologyGeometryVerificationReceipt(selectedRecord, morphologySourceFrameDisclosureFor(selectedRecord), geometryState.data); }
      catch { return null; }
    })() : null;
  const geometry = currentGeometryProof && geometryState ? geometryState.data : null;
  const geometryError = geometryErrorState && selectedRecord && geometryErrorState.neuronId === selectedRecord.neuronId
    ? geometryErrorState.message
    : "";
  const selectedRenderAuthority = selectedRecord ? {
    dimensionality: dimensionality(selectedRecord),
    sourceDiameterAvailable: hasDiameter(selectedRecord),
  } : null;
  const activeRenderMode: RenderMode = resolveMorphologyRenderMode(
    selectedRenderAuthority,
    renderModeSelection.neuronId === selectedRecord?.neuronId ? renderModeSelection.mode : null,
  );
  const radiusSurfaceAllowed = selectedRenderAuthority !== null && canUseRadiusDerivedSurface(selectedRenderAuthority);

  useEffect(() => {
    return () => {
      restoreOperationRef.current += 1;
      restoreAbortRef.current?.abort();
      pendingRestoreRef.current?.reject(new Error("The source changed or the individual viewport closed before restoration completed."));
      pendingRestoreRef.current = null;
      captureViewRef.current = null; exportPngRef.current = null;
      refreshViewRef.current = null;
    };
  }, [individualSourceKey, view]);

  const restoreIndividualView = async (document: unknown) => {
    const previous = geometryState && geometryState.neuronId === selectedRecord?.neuronId ? geometryState.data : null;
    if (!selectedComparisonRecord || !selectedRecord || !previous || view !== "individual") throw new Error("The exact individual source is unavailable.");
    validateIndividualMorphologySourceViewReplay(selectedComparisonRecord, previous, document, THREE.REVISION);
    const saved = document as IndividualMorphologySourceViewDocument;
    restoreAbortRef.current?.abort();
    pendingRestoreRef.current?.reject(new Error("A newer restoration replaced this request."));
    pendingRestoreRef.current = null;
    const operation = ++restoreOperationRef.current, abort = new AbortController();
    restoreAbortRef.current = abort;
    captureViewRef.current = null; exportPngRef.current = null; refreshViewRef.current = null; setViewSignature("");
    setRestoreState({ sourceKey: individualSourceKey, status: "pending", failure: "" });
    try {
      const fresh = await readVerifiedMorphologyGeometry(selectedRecord, morphologySourceFrameDisclosureFor(selectedRecord), { signal: abort.signal, forceReload: true });
      if (abort.signal.aborted || operation !== restoreOperationRef.current) throw new Error("The source changed before fresh verification completed.");
      validateIndividualMorphologySourceViewReplay(selectedComparisonRecord, fresh, saved, THREE.REVISION);
      const applied = new Promise<void>((resolve, reject) => { pendingRestoreRef.current = { operation, sourceKey: individualSourceKey, document: saved, resolve, reject }; });
      const hidden = new Set(fresh.nodes.map(node => node[1]).filter(type => !saved.view.layers.visibleSourceTypes.includes(type)));
      hiddenTypesRef.current = hidden; setHiddenTypes(hidden);
      setShowTopologyLandmarks(saved.view.layers.topologyLandmarksVisible);
      setRenderModeSelection({ neuronId: selectedRecord.neuronId, mode: saved.view.requestedMode });
      setGeometryState({ neuronId: selectedRecord.neuronId, data: fresh });
      setGeometryErrorState(null);
      setRestoreState({ sourceKey: individualSourceKey, status: "verified", failure: "" });
      await applied;
    } catch (error) {
      if (operation === restoreOperationRef.current) {
        pendingRestoreRef.current = null;
        setRestoreState({ sourceKey: individualSourceKey, status: "unavailable", failure: error instanceof Error ? error.message : "The exact source view could not be restored." });
      }
      throw error;
    }
  };

  useEffect(() => {
    selectedButtonRef.current?.scrollIntoView({ block: "nearest" });
  }, [effectiveSelectedId]);

  useEffect(() => {
    if (!selectedRecord?.geometry.available || !selectedRecord.geometry.path) return;
    const controller = new AbortController();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setGeometryState(null);
      setGeometryErrorState(null);
      setRestoreState(null);
      inspectionSelectionRef.current = null;
      setInspectionSelection(null);
      setHiddenTypes(new Set());
    });
    readVerifiedMorphologyGeometry(selectedRecord, morphologySourceFrameDisclosureFor(selectedRecord), { signal: controller.signal })
      .then((nextGeometry) => {
        if (!cancelled && !controller.signal.aborted) setGeometryState({ neuronId: selectedRecord.neuronId, data: nextGeometry });
      })
      .catch((error: Error) => {
        if (!cancelled && !controller.signal.aborted && error.name !== "AbortError") {
          setGeometryState(null);
          setGeometryErrorState({ neuronId: selectedRecord.neuronId, message: error.message });
        }
      });
    return () => { cancelled = true; controller.abort(); };
  }, [selectedRecord]);

  useEffect(() => {
    const container = containerRef.current;
    if (view !== "individual" || !container || !geometry || !selectedComparisonRecord) return;
    let active = true;
    const viewportInstanceId = `individual-runtime-${++individualViewportSequence}`;
    let viewportRevision = ++runtimeRevisionRef.current;
    const failView = (message: string) => {
      captureViewRef.current = null; exportPngRef.current = null; refreshViewRef.current = null; setViewSignature("");
      pendingRestoreRef.current?.reject(new Error(message)); pendingRestoreRef.current = null;
      setWebGLAvailable(false);
    };
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) {
      queueMicrotask(() => { if (active) failView("WebGL2 is unavailable for the current individual source."); });
      return () => { active = false; };
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => { if (active) failView("The current individual WebGL renderer could not be created."); });
      return () => { active = false; };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    queueMicrotask(() => { if (active) setWebGLAvailable(true); });
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      "aria-label",
      `Interactive NeuroMorpho ${geometry.neuronId} source-local morphology. The active evidence-gated mode is announced after rendering. It is not atlas registered.`,
    );
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1715);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x20302a, 1.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(7, 9, 10);
    scene.add(keyLight);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    const isTwoDimensional = selectedRecord?.normalizedMetadata.dimensionality === "2D";
    controls.enableRotate = !isTwoDimensional;
    let userAdjustedCamera = false, pointerInteraction = false;
    const onControlsStart = () => { pointerInteraction = true; };
    const onControlsEnd = () => { pointerInteraction = false; };
    const onControlsChange = () => { if (pointerInteraction) userAdjustedCamera = true; };
    controls.addEventListener("start", onControlsStart);
    controls.addEventListener("end", onControlsEnd);
    controls.addEventListener("change", onControlsChange);

    const root = new THREE.Group();
    const skeletonRoot = createObservedSwcCenterlines(geometry, { colors: TYPE_COLORS, opacity: 0.78 });
    const radiusRoot = selectedRecord && hasDiameter(selectedRecord) && activeRenderMode === "radius" ? new THREE.Group() : null;
    skeletonRoot.visible = activeRenderMode === "skeleton";
    if (radiusRoot) {
      radiusRoot.name = `cached-radius-derived-mode-${geometry.neuronId}`;
      radiusRoot.add(createRadiusDerivedSurface(geometry, { colors: TYPE_COLORS, opacity: 0.82 }));
      radiusRoot.add(createObservedSwcCenterlines(geometry, { colors: TYPE_COLORS, opacity: 0.18, renderOrder: 3 }));
      radiusRoot.visible = activeRenderMode === "radius";
    }
    root.add(skeletonRoot);
    if (radiusRoot) root.add(radiusRoot);
    if (showTopologyLandmarks) root.add(createObservedTopologyLandmarks(geometry));
    renderedModesRef.current = { skeleton: skeletonRoot, radius: radiusRoot };

    scene.add(root);
    const bounds = new THREE.Box3().setFromObject(root);
    const boundsSphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Number.isFinite(boundsSphere.radius) && boundsSphere.radius > 0 ? boundsSphere.radius : 3;
    controls.minDistance = Math.max(radius * 0.08, 0.001);
    controls.maxDistance = Math.max(radius * 64, 100);
    controls.target.copy(boundsSphere.center);
    const defaultDirection = isTwoDimensional ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1.45, 0.9, 1.65).normalize();
    camera.position.copy(boundsSphere.center).addScaledVector(defaultDirection,
      computePerspectiveSphereFitDistance({ radiusViewerUnit: radius, verticalFovDegrees: camera.getEffectiveFOV(), aspect: camera.aspect }));
    camera.near = Math.max(radius / 1000, 0.001);
    camera.far = Math.max(radius * 50, 100);
    camera.updateProjectionMatrix();
    const axes = new THREE.AxesHelper(Math.max(radius * 0.32, 0.5));
    axes.position.copy(boundsSphere.center);
    scene.add(axes);

    const inspection = attachSwcNeuriteInspection({
      geometry, scene, camera, controls, canvas: renderer.domElement, contextRoot: root,
      sourceRadiusAvailable: Boolean(selectedRecord && hasDiameter(selectedRecord)), isTwoDimensional,
      onSelection: (selection: NeuriteInspectionSelection | null) => {
        inspectionSelectionRef.current = selection;
        setInspectionSelection(selection);
        refreshViewRef.current?.();
      },
      isSourceTypeVisible: (sourceType: number) => !hiddenTypesRef.current.has(sourceType),
      onCameraChange: () => { userAdjustedCamera = true; },
    });
    inspectionRef.current = inspection;
    // Retain a selection across display-mode changes, never across source geometry.
    const retainedInspection = inspectionSelectionRef.current;
    queueMicrotask(() => {
      if (inspectionRef.current !== inspection) return;
      inspection.restore(retainedInspection);
    });

    let resizeFrame = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    const describeView = (): IndividualMorphologySourceView => {
      const selection = inspectionSelectionRef.current;
      const context = renderer.getContext().getContextAttributes();
      const buffer = renderer.getDrawingBufferSize(new THREE.Vector2());
      const types = [...new Set(geometry.nodes.map(node => node[1]))].sort((a, b) => a - b);
      const activeRoot = activeRenderMode === "radius" ? radiusRoot : skeletonRoot;
      const visibleTypes = types.filter(type => {
        let present = false;
        activeRoot?.traverse(object => { if (object.userData.sourceType === type && object.visible) present = true; });
        return present;
      });
      return {
        status: "rendered", runtimeBinding: { neuronId: geometry.neuronId, geometrySha256: selectedComparisonRecord.geometry.sha256 ?? "", viewportInstanceId, viewportRevision },
        requestedMode: activeRenderMode, actualMode: activeRenderMode, sourcePlaneLocked: isTwoDimensional,
        camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset },
        viewport: { cssWidth: container.clientWidth, cssHeight: container.clientHeight, drawingBufferWidth: buffer.x, drawingBufferHeight: buffer.y, pixelRatio: renderer.getPixelRatio() },
        renderer: { engine: "THREE", revision: THREE.REVISION, type: "WebGLRenderer", outputColorSpace: renderer.outputColorSpace, toneMapping: renderer.toneMapping, alpha: context?.alpha === true, antialias: context?.antialias === true },
        clipping: { globalPlanes: renderer.clippingPlanes.map(plane => ({ normal: plane.normal.toArray(), constant: plane.constant })), localClippingEnabled: renderer.localClippingEnabled },
        layers: { sourceGeometryVisible: root.visible, centerlinesVisible: activeRoot?.visible === true, radiusSurfaceVisible: radiusRoot?.visible === true, topologyLandmarksVisible: showTopologyLandmarks, sourceAxesVisible: axes.visible,
          visibleSourceTypes: types.filter(type => !hiddenTypesRef.current.has(type)), centerlineSourceTypes: visibleTypes },
        inspection: { selectedNodeId: selection?.geometryIdentity === geometry ? selection.nodeId : null, contextDimmed: selection?.geometryIdentity === geometry ? selection.dimmed : false, overlayAuthority: "exact_swc_parent_path_and_descendant_edges" },
        sceneBounds: { center: boundsSphere.center.toArray(), radius }, displayTransform: geometry.displayTransform,
      };
    };
    let lastViewValue = "";
    refreshViewRef.current = () => {
      if (!active || !lastWidth || !lastHeight) return;
      const value = JSON.stringify(describeView());
      if (value === lastViewValue) return;
      lastViewValue = value; setViewSignature(`${++mutationRevisionRef.current}:${value}`);
    };
    captureViewRef.current = () => {
      if (!active || renderer.getContext().isContextLost() || !lastWidth || !lastHeight) throw new Error("The current individual viewport is unavailable.");
      renderer.render(scene, camera);
      return captureIndividualMorphologySourceView(selectedComparisonRecord, geometry, describeView(), THREE.REVISION);
    };
    const capturePngView = captureViewRef.current;
    exportPngRef.current = capturePngView ? async document => {
      const options = { profile: "individual" as const, record: selectedComparisonRecord!, geometry, rendererRevision: THREE.REVISION };
      const saved = structuredClone(document);
      const captions = morphologyPngCaptions(saved, options);
      const assertCurrent = () => {
        if (!active || captureViewRef.current !== capturePngView || renderer.getContext().isContextLost()) throw new Error("The source viewport changed before PNG export completed.");
        assertMorphologyPngCurrent(saved, capturePngView());
      };
      return encodeSourceViewPng(renderer.domElement, captions, { pixelRatio: renderer.getPixelRatio(), assertCurrent,
        appendReceipt: blob => appendMorphologyExportPng(blob, saved, options) });
    } : null;
    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      if (width === lastWidth && height === lastHeight) return;
      if (lastWidth && lastHeight) viewportRevision = ++runtimeRevisionRef.current;
      lastWidth = width;
      lastHeight = height;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        if (!userAdjustedCamera) {
          controls.target.copy(boundsSphere.center);
          camera.position.copy(boundsSphere.center).addScaledVector(defaultDirection,
            computePerspectiveSphereFitDistance({ radiusViewerUnit: radius, verticalFovDegrees: camera.getEffectiveFOV(), aspect: camera.aspect }));
        }
        camera.updateProjectionMatrix();
        controls.update();
        const pending = pendingRestoreRef.current;
        if (pending && pending.sourceKey === individualSourceKey && pending.operation === restoreOperationRef.current) {
          try {
            const saved = validateIndividualMorphologySourceViewReplay(selectedComparisonRecord, geometry, pending.document, THREE.REVISION);
            assertMorphologySourceViewSceneBounds(pending.document, { center: boundsSphere.center.toArray(), radius });
            const damping = controls.enableDamping; controls.enableDamping = false; controls.update();
            camera.position.fromArray(saved.camera.position); camera.up.fromArray(saved.camera.up);
            controls.target.fromArray(saved.camera.target);
            camera.fov = saved.camera.fov; camera.zoom = saved.camera.zoom;
            camera.filmGauge = saved.camera.filmGauge; camera.filmOffset = saved.camera.filmOffset;
            controls.update(); camera.lookAt(controls.target); controls.enableDamping = damping;
            camera.updateProjectionMatrix();
            if (saved.inspection.selectedNodeId === null) inspection.clear();
            else inspection.restore({ geometryIdentity: geometry, nodeId: saved.inspection.selectedNodeId, dimmed: saved.inspection.contextDimmed });
            renderer.render(scene, camera);
            const applied = captureIndividualMorphologySourceView(selectedComparisonRecord, geometry, describeView(), THREE.REVISION);
            assertMorphologySourceViewAppliedPose(pending.document, applied.view);
            userAdjustedCamera = true;
            pendingRestoreRef.current = null; pending.resolve();
          } catch (error) {
            pendingRestoreRef.current = null;
            pending.reject(error instanceof Error ? error : new Error("The individual source view could not be applied."));
          }
        }
        refreshViewRef.current?.();
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      refreshViewRef.current?.();
      frame = requestAnimationFrame(render);
    };
    render();
    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      renderer.domElement.remove();
      failView("The current individual WebGL context was lost.");
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    return () => {
      active = false; captureViewRef.current = null; exportPngRef.current = null; refreshViewRef.current = null;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.removeEventListener("start", onControlsStart);
      controls.removeEventListener("end", onControlsEnd);
      controls.removeEventListener("change", onControlsChange);
      inspection.dispose();
      inspectionRef.current = null;
      controls.dispose();
      root.traverse((object) => {
        const drawable = object as THREE.Mesh | THREE.LineSegments | THREE.InstancedMesh;
        drawable.geometry?.dispose();
        if (drawable.material) {
          const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
          materials.forEach((material) => material.dispose());
        }
      });
      axes.geometry.dispose();
      (axes.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
      renderedModesRef.current = null;
    };
  }, [activeRenderMode, geometry, individualSourceKey, selectedComparisonRecord, selectedRecord, showTopologyLandmarks, view]);

  useEffect(() => {
    hiddenTypesRef.current = hiddenTypes;
    const renderedModes = renderedModesRef.current;
    if (!renderedModes) return;
    renderedModes.skeleton.visible = activeRenderMode === "skeleton";
    if (renderedModes.radius) renderedModes.radius.visible = activeRenderMode === "radius";
    [renderedModes.skeleton, renderedModes.radius].forEach((modeRoot) => {
      modeRoot?.traverse((object) => {
        const sourceType = typeof object.userData.sourceType === "number" ? object.userData.sourceType : null;
        if (sourceType !== null) object.visible = !hiddenTypes.has(sourceType);
      });
    });
    const canvas = containerRef.current?.querySelector("canvas");
    canvas?.setAttribute(
      "aria-label",
      activeRenderMode === "radius"
        ? `Interactive NeuroMorpho ${geometry?.neuronId ?? "selected"} source-local morphology. Coordinates, topology and source-authorized radii are observed inputs; visible thickness is a deterministic tapered-frustum derivative, not an observed membrane. It is not atlas registered.`
        : `Interactive NeuroMorpho ${geometry?.neuronId ?? "selected"} observed source-local SWC centerlines. Stroke width is a viewer aid, not anatomical caliber. It is not atlas registered.`,
    );
    refreshViewRef.current?.();
  }, [activeRenderMode, geometry, hiddenTypes, showTopologyLandmarks, view]);

  const summary = useMemo(() => {
    const admitted = records.filter((record) => record.geometry.available).length;
    const threeDimensional = records.filter((record) => dimensionality(record) === "3D").length;
    const diameter = records.filter(hasDiameter).length;
    const numericAge = records.filter((record) => record.missingness.numericAge?.value !== null && record.missingness.numericAge?.value !== undefined).length;
    const papers = new Set(records.flatMap((record) => record.sourcePaper.dois));
    const archives = new Set(records.map((record) => record.normalizedMetadata.archive));
    return { admitted, threeDimensional, diameter, numericAge, papers: papers.size, archives: archives.size };
  }, [records]);

  const selectedDisclosure = selectedRecord ? morphologySourceFrameDisclosureFor(selectedRecord) : null;
  const computedMetrics = Object.entries(geometry?.morphometrics.computedFromStandardizedSwc ?? selectedRecord?.morphometrics.computed ?? {});
  const explicitMissingness = selectedRecord
    ? Object.entries(selectedRecord.missingness).filter(([key, item]) => key !== "numericAge" && (item.value === null || item.value === undefined))
    : [];
  const typesPresent = geometry ? uniqueSorted(geometry.segments.map((segment) => String(segment[8]))).map(Number) : [];
  const topologyLandmarks = geometry ? extractObservedTopologyLandmarks(geometry) : null;
  const toggleSourceType = (sourceType: number) => {
    setHiddenTypes((current) => {
      const visibleCount = typesPresent.filter((candidate) => !current.has(candidate)).length;
      if (!current.has(sourceType) && visibleCount <= 1) return current;
      const next = new Set(current);
      if (next.has(sourceType)) next.delete(sourceType);
      else next.add(sourceType);
      return next;
    });
  };
  const resetFilters = () => {
    onMorphologySearchQueryChange?.("");
    setArchiveFilter("all");
    setClassFilter("all");
    setPaperFilter("all");
    setAxonFilter("all");
    setIntegrityFilter("all");
    setDimensionFilter("all");
    setGeometryFilter("all");
    setAgeFilter("all");
    setConditionFilter("all");
  };
  const selectView = (next: MorphologyView) => {
    setView(next);
    replaceUrlValue("morphologyView", next === "universe" ? null : next);
  };
  const selectRecord = (neuronId: number) => {
    if (neuronId !== selectedRecord?.neuronId) {
      setGeometryState(null);
      setGeometryErrorState(null);
      inspectionSelectionRef.current = null;
      setInspectionSelection(null);
      setHiddenTypes(new Set());
    }
    setInternalSelectedId(neuronId);
    onSelectedFocusChange?.(`NeuroMorpho:${neuronId}`);
  };
  const updateComparisonIds = (ids: number[]) => {
    const availableIds = comparisonRecords.filter((record) => record.geometry.available).map((record) => record.neuronId);
    const normalized = normalizeMorphologyComparisonIds(ids, availableIds, []);
    setComparisonIds(normalized);
    replaceUrlValue("morphologyCompare", normalized.join(","));
  };

  return (
    <div className="morphology-census">
      {view !== "universe" && <div className="morphology-census-summary" aria-label="Frozen adult NeuroMorpho subset coverage summary">
        <span><strong>{records.length || "—"}</strong> query-indexed records</span>
        <span><strong>{payload ? summary.admitted : "—"}</strong> QC-admitted geometries</span>
        <span><strong>{payload ? summary.threeDimensional : "—"}</strong> source-labelled 3D</span>
        <span><strong>{payload ? summary.diameter : "—"}</strong> diameter-enabled</span>
        <span><strong>{payload ? summary.papers : "—"}</strong> papers</span>
        <span><strong>{payload ? summary.archives : "—"}</strong> archives</span>
        <span><strong>{payload ? summary.numericAge : "—"}</strong> numeric-age records</span>
        <span className="limit"><strong>0</strong> complete axons</span>
      </div>}

      <div className="morphology-view-tabs" role="tablist" aria-label="Morphology research views" tabIndex={-1} onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const orderedViews: MorphologyView[] = ["universe", "individual", "matrix", "compare", "cohorts"];
        const currentIndex = orderedViews.indexOf(view);
        const next: MorphologyView = event.key === "Home"
          ? "universe"
          : event.key === "End"
            ? "cohorts"
            : orderedViews[(currentIndex + (event.key === "ArrowRight" ? 1 : -1) + orderedViews.length) % orderedViews.length];
        selectView(next);
        const targetId = `morphology-${next}-tab`;
        requestAnimationFrame(() => document.getElementById(targetId)?.focus());
      }}>
        <button type="button" role="tab" id="morphology-universe-tab" aria-controls="morphology-universe-panel" aria-selected={view === "universe"} tabIndex={view === "universe" ? 0 : -1} className={view === "universe" ? "active" : ""} onClick={() => selectView("universe")}>Exact universe · 1,097 source objects</button>
        <button type="button" role="tab" id="morphology-individual-tab" aria-controls="morphology-individual-panel" aria-selected={view === "individual"} tabIndex={view === "individual" ? 0 : -1} className={view === "individual" ? "active" : ""} onClick={() => selectView("individual")}>Frozen adult subset · 142 records (140 3D · 2 planar)</button>
        <button type="button" role="tab" id="morphology-matrix-tab" aria-controls="morphology-matrix-panel" aria-selected={view === "matrix"} tabIndex={view === "matrix" ? 0 : -1} className={view === "matrix" ? "active" : ""} onClick={() => selectView("matrix")}>Morphology matrix · 142 records (140 3D · 2 planar)</button>
        <button type="button" role="tab" id="morphology-compare-tab" aria-controls="morphology-compare-panel" aria-selected={view === "compare"} tabIndex={view === "compare" ? 0 : -1} className={view === "compare" ? "active" : ""} onClick={() => selectView("compare")}>3D comparator · {comparisonIds.length} selected / {comparisonRecords.length} indexed</button>
        <button type="button" role="tab" id="morphology-cohorts-tab" aria-controls="morphology-cohorts-panel" aria-selected={view === "cohorts"} tabIndex={view === "cohorts" ? 0 : -1} className={view === "cohorts" ? "active" : ""} onClick={() => selectView("cohorts")}>Cohort phenotyping · exact source strata</button>
      </div>

      <div id="morphology-universe-panel" role="tabpanel" aria-labelledby="morphology-universe-tab" hidden={view !== "universe"}>
        {view === "universe" && <NeuroMorphoUniversePanel
          selectedFocusId={selectedFocusId}
          onSelectedFocusChange={onSelectedFocusChange}
          morphologySearchQuery={morphologySearchQuery}
          morphologyDiscoveryRequestId={morphologyDiscoveryRequestId}
          onMorphologySearchQueryChange={onMorphologySearchQueryChange}
        />}
      </div>

      <div id="morphology-individual-panel" role="tabpanel" aria-labelledby="morphology-individual-tab" hidden={view !== "individual"}>
      {view === "individual" && <div className="morphology-workspace">
        <aside className="morphology-browser" aria-label="Morphology census browser">
          <div className="morphology-browser-heading">
            <div><span>QUERY-COMPLETE SET</span><h3>Source reconstruction index</h3></div>
            <button type="button" onClick={resetFilters}>Reset</button>
          </div>
          <label className="morphology-search">
            Search ID, label, region or paper
            <input value={query} onChange={(event) => {
              discoveryModeRef.current = morphologyDiscoveryRequestId > 0 || event.target.value.trim().length > 0;
              onMorphologySearchQueryChange?.(event.target.value);
            }} placeholder="e.g. GRP, 109005, L1…" />
          </label>
          <div className="morphology-filter-grid">
            <label>Archive<select value={archiveFilter} onChange={(event) => setArchiveFilter(event.target.value)}><option value="all">All archives</option>{filterOptions.archives.map((archive) => <option key={archive} value={archive}>{archive}</option>)}</select></label>
            <label>Source class<select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="all">All classes</option><option value="excitatory">Excitatory</option><option value="inhibitory">Inhibitory</option><option value="unclassified">Unclassified</option></select></label>
            <label>Axon field<select value={axonFilter} onChange={(event) => setAxonFilter(event.target.value)}><option value="all">With or without axon</option><option value="present">Axon present</option><option value="absent">No axon reconstructed</option></select></label>
            <label>Dimensionality<select value={dimensionFilter} onChange={(event) => setDimensionFilter(event.target.value)}><option value="all">2D and 3D</option><option value="3D">3D</option><option value="2D">2D</option></select></label>
            <label>Integrity<select value={integrityFilter} onChange={(event) => setIntegrityFilter(event.target.value)}><option value="all">All integrity tiers</option>{filterOptions.integrity.map((integrity) => <option key={integrity} value={integrity}>{integrity}</option>)}</select></label>
            <label>Geometry<select value={geometryFilter} onChange={(event) => setGeometryFilter(event.target.value)}><option value="all">Admitted and quarantined</option><option value="available">QC-admitted</option><option value="quarantined">Quarantined</option></select></label>
            <label>Numeric age<select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)}><option value="all">Known and missing</option><option value="known">Age reported</option><option value="missing">Age missing</option></select></label>
            <label>Condition<select value={conditionFilter} onChange={(event) => setConditionFilter(event.target.value)}><option value="all">All conditions</option>{filterOptions.conditions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select></label>
            <label className="morphology-paper-filter">Paper DOI / PMID<select value={paperFilter} onChange={(event) => setPaperFilter(event.target.value)}><option value="all">All source papers</option>{filterOptions.papers.map((paper) => <option key={paper} value={paper}>{paper}</option>)}</select></label>
          </div>
          <p className="morphology-result-count" aria-live="polite">{filteredRecords.length} of {records.length} records shown</p>
          {!selectedRecordVisible && selectedRecord && (
            <p className="morphology-focus-retained" role="status">
              Focus retained outside the filtered list: NeuroMorpho {selectedRecord.neuronId}. Filters never substitute another record.
            </p>
          )}
          <p id={listFocus.helpId} className="source-list-keyboard-help">Use Up/Down or Home/End to move through the records. Enter or Space selects a record; Tab leaves the list.</p>
          <div className="morphology-record-list" role="group" aria-label="Frozen individual morphology records" aria-describedby={listFocus.helpId}>
            {indexError && <p role="alert">Morphology census unavailable: {indexError}</p>}
            {!payload && !indexError && <p>Loading the pinned official query snapshot…</p>}
            {payload && filteredRecords.length === 0 && <p>No record matches the active filters.</p>}
            {filteredRecords.map((record) => {
              const focusProps = listFocus.buttonProps(`NeuroMorpho:${record.neuronId}`);
              return <button {...focusProps} ref={element => { focusProps.ref(element); if (record.neuronId === effectiveSelectedId) selectedButtonRef.current = element; }} type="button" key={record.neuronId} className={record.neuronId === effectiveSelectedId ? "selected" : ""} onClick={() => selectRecord(record.neuronId)} aria-pressed={record.neuronId === effectiveSelectedId}>
                <span className={`morphology-availability ${record.geometry.available ? "available" : "quarantined"}`} aria-hidden="true" />
                <span><strong>{record.normalizedMetadata.name}</strong><small>NMO {record.neuronId} · {classification(record)} · {record.normalizedMetadata.archive}</small></span>
              </button>;
            })}
          </div>
        </aside>

        <section className="morphology-canvas-card" aria-label="Selected source-local morphology">
          <div className="reference-status-row morphology-status-row">
            <span className="badge observed">OBS SWC input</span>
            <span className="badge warning">0 REG · UNREGISTERED</span>
            {activeRenderMode === "radius" && geometry && webGLAvailable && !restoreFailure && <span className="badge derived">DERIVED RADIUS SURFACE</span>}
            {selectedRecord && <span>{dimensionality(selectedRecord)} · {selectedRecord.normalizedMetadata.domain}</span>}
          </div>
          <div className="morphology-render-controls" aria-label="Geometry rendering mode">
            <button type="button" className={activeRenderMode === "skeleton" ? "active" : ""} onClick={() => setRenderModeSelection({ neuronId: selectedRecord?.neuronId ?? null, mode: "skeleton" })}>Observed SWC centerlines</button>
            <button type="button" className={activeRenderMode === "radius" ? "active" : ""} onClick={() => setRenderModeSelection({ neuronId: selectedRecord?.neuronId ?? null, mode: "radius" })} disabled={!radiusSurfaceAllowed}>Radius-derived surface</button>
            <button type="button" className={showTopologyLandmarks ? "active" : ""} aria-pressed={showTopologyLandmarks} onClick={() => setShowTopologyLandmarks((visible) => !visible)} disabled={!geometry}>Exact topology landmarks</button>
            <button type="button" disabled>Same-specimen internal structure</button>
          </div>
          <p className="morphology-render-boundary" role="note">{selectedRecord && dimensionality(selectedRecord) === "2D"
            ? "Source-labelled 2D remains planar even if diameter metadata is present; no thickness, extrusion or depth is inferred."
            : selectedRecord && !hasDiameter(selectedRecord)
              ? "Radius-derived surface unavailable: official source attributes report No Diameter; placeholder radii are ignored."
              : "Radius mode uses exact endpoint radii in open six-sided frusta; the surface is derived, not an observed membrane."} Same-specimen membrane, nucleus, organelles, boutons, receptor map and ultrastructure are unavailable; no generic substitute is rendered.</p>
          <div className="morphology-three-stage" ref={containerRef}>
            {geometry && topologyLandmarks && webGLAvailable && <MorphologyNeuriteInspector key={individualSourceKey} controllerRef={inspectionRef} selection={inspectionSelection} geometry={geometry}
              branchpointCount={topologyLandmarks.branchpoints.length} terminalCount={topologyLandmarks.terminals.length} />}
            {restoringView && <p role="status">Rechecking this source before restoring the view…</p>}
            {restoreFailure && <p role="alert">Source view unavailable: {restoreFailure}</p>}
            {selectedRecord?.geometry.available && !geometry && !geometryError && !restoringView && !restoreFailure && <p>Loading this reconstruction on demand…</p>}
            {selectedRecord && !selectedRecord.geometry.available && <p role="status">Geometry quarantined: {selectedRecord.geometry.missingReason ?? "the reconstruction did not pass admission checks"}.</p>}
            {geometryError && <p role="alert">Geometry unavailable: {geometryError}</p>}
            {!webGLAvailable && <p role="status">3D unavailable; metadata, QC and provenance remain available.</p>}
          </div>
          <div className="morphology-legend" aria-label="Source SWC type legend">
            {typesPresent.map((sourceType) => <button type="button" key={sourceType} className={hiddenTypes.has(sourceType) ? "muted" : ""} onClick={() => toggleSourceType(sourceType)} aria-pressed={!hiddenTypes.has(sourceType)}><i style={{ backgroundColor: `#${(TYPE_COLORS[sourceType] ?? 0xc2d4cd).toString(16).padStart(6, "0")}` }} />{TYPE_LABELS[sourceType] ?? `Uninterpreted source type ${sourceType}`}</button>)}
            {geometry && <small>{activeRenderMode === "radius" ? "Exact endpoint radii · open 6-sided frusta · no caps, smoothing or membrane claim." : "Observed topology · constant-width strokes and root-centred uniform scaling are viewer aids only."} Geometry bytes are checksum verified.</small>}
          </div>
          <MorphologySourceProof label={`Individual NeuroMorpho ${selectedRecord?.neuronId ?? "unselected"}`} receipt={currentGeometryProof}
            identity={selectedSourceIdentity} sourceContext={selectedRecord ? { sourceFrameDisclosure: morphologySourceFrameDisclosureFor(selectedRecord),
              sourcePaper: selectedRecord.sourcePaper, sourceMissingness: selectedRecord.missingness, nativeSourceContext: geometry?.source ?? null,
              sourceIdentity: selectedSourceIdentity, rawSwcVerification: "declared_hash_only", fullViewReplayStatus: geometry && webGLAvailable && viewSignature && !restoringView && !restoreFailure ? "individual_source_view_available" : "no_current_rendered_view" } : null} />
          {selectedComparisonRecord && <MorphologySourceViewControls key={individualSourceKey} neuronId={selectedComparisonRecord.neuronId}
            signature={`${individualSourceKey}:${viewSignature}`} available={Boolean(geometry && webGLAvailable && viewSignature && !restoreFailure)} restoring={restoringView}
            capture={() => { if (!captureViewRef.current) throw new Error("The current individual source viewport is unavailable."); return captureViewRef.current(); }} restore={restoreIndividualView}
      pngFilename={`neuromorpho-${selectedComparisonRecord.neuronId}-individual-source-view.png`} exportPng={document => { if (!exportPngRef.current) throw new Error("The current source viewport is unavailable."); return exportPngRef.current(document); }}
            description="Save this individual camera, visible SWC types, topology, clipping and branch selection. Restoration rechecks the exact source file, clears the prior scene and adapts to the current viewport size. Source axes remain local; no registration or internal anatomy is added." />}
          {topologyLandmarks && <div className="morphology-topology-legend morphology-topology-legend-inline" role="note" aria-label={`Exact topology landmark counts for NeuroMorpho ${geometry?.neuronId}`}>
            <span><i className="root" />root node <b>1</b></span>
            <span><i className="type-one" />type-1 samples <b>{topologyLandmarks.standardizedType1Samples.length}</b></span>
            <span><i className="branch" />branchpoints <b>{topologyLandmarks.branchpoints.length}</b></span>
            <span><i className="terminal" />terminals <b>{topologyLandmarks.terminals.length}</b></span>
            <small>Parent-link derivatives from this exact SWC · root is not a soma contour · terminals are not boutons or synapses.</small>
          </div>}
        </section>

        <aside className="morphology-detail-card" aria-label="Selected morphology evidence and limitations">
          {selectedRecord ? (
            <>
              <span className="morphology-record-id">NEUROMORPHO · {selectedRecord.neuronId}</span>
              <h3>{selectedRecord.normalizedMetadata.name}</h3>
              <div className="morphology-tag-row"><span>{classification(selectedRecord)}</span><span>{dimensionality(selectedRecord)}</span><span>{hasDiameter(selectedRecord) ? "diameter metadata" : "no diameter metadata"}</span></div>
              <dl className="morphology-source-metadata">
                <div><dt>Source labels</dt><dd>{selectedRecord.normalizedMetadata.cellType.join(" · ") || "Not reported"}</dd></div>
                <div><dt>Reported region</dt><dd>{selectedRecord.normalizedMetadata.brainRegion.join(" · ") || "Not reported"}</dd></div>
                <div><dt>Source scope</dt><dd>{normalizedText(selectedRecord.normalizedMetadata.species) || "Not reported"} · {selectedRecord.normalizedMetadata.lifeStage || "Life stage not reported"}</dd></div>
                <div><dt>Condition</dt><dd>{normalizedText(selectedRecord.normalizedMetadata.experimentCondition) || "Not reported"}</dd></div>
                <div><dt>Strain / sex</dt><dd>{normalizedText(selectedRecord.normalizedMetadata.strain) || "Not reported"} · {normalizedText(selectedRecord.normalizedMetadata.gender) || "Not reported"}</dd></div>
              </dl>
              {selectedDisclosure && <MorphologyRecordDisclosure
                disclosure={selectedDisclosure}
                geometryVerification={geometry ? "verified" : selectedRecord.geometry.available && !geometryError ? "pending" : "unavailable"}
              />}
              {computedMetrics.length > 0 && <div className="morphology-computed-metrics"><h4>Local-frame geometry audit</h4><details><summary>Show all {computedMetrics.length} computed fields</summary><div>{computedMetrics.map(([key, value]) => <span key={key}><b>{readableMetric(value)}</b>{readableKey(key)}</span>)}</div></details><p>Computed from the admitted standardized SWC. Absolute cross-paper comparison is not authorized because shrinkage correction and acquisition methods are not harmonized.</p></div>}
              {selectedAnalysisRecord && <MorphologyRecordAnalysis record={selectedAnalysisRecord} />}
              <MorphologyTopologyDetailPanel neuronId={selectedRecord.neuronId} />
              {analysisState.status === "unavailable" && <p className="morphology-analysis-inline-status" role="status">{analysisState.message}</p>}
              <div className="morphology-relationship-status">
                <h4>Relationship status</h4>
                <dl>
                  <div><dt>Official record ↔ geometry</dt><dd>Direct same-record link</dd></div>
                  <div><dt>Original paper ↔ record</dt><dd>Direct repository citation</dd></div>
                  <div><dt>Russ / molecular population</dt><dd>Not established</dd></div>
                  <div><dt>Atlas / SCI evidence entity</dt><dd>Not established · 0 REG</dd></div>
                </dl>
              </div>
              <div className="morphology-missingness"><h4>Other explicitly unavailable fields</h4>{explicitMissingness.length > 0 ? <ul>{explicitMissingness.map(([key, item]) => <li key={key}><strong>{readableKey(key)}</strong><span>{readableKey(item.missingReason ?? "not reported")}</span></li>)}</ul> : <p>No additional missing fields are declared for this record.</p>}</div>
              <div className="morphology-missingness"><h4>Same-specimen internal structure unavailable</h4><p>No membrane segmentation, nucleus, organelles, synaptic boutons, receptor distribution or ultrastructure is available for this reconstruction. No generic internal model is substituted.</p></div>
              <div className="boundary-box"><span>COORDINATE BOUNDARY</span><p>Observed standardized reconstruction in its source-local frame. No transform to allen_cord_20um exists. It cannot establish laminar placement, inter-cell distance, pathway length, connectivity or a canonical morphology for a molecular population.</p></div>
              <div className="morphology-provenance-links">
                <a href={`https://neuromorpho.org/api/neuron/id/${selectedRecord.neuronId}`} target="_blank" rel="noreferrer">Official API record ↗</a>
                {selectedRecord.sourcePaper.dois.map((doi) => <a key={doi} href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer">Source DOI {doi} ↗</a>)}
              </div>
            </>
          ) : <p>Select a reconstruction to inspect source labels, geometry QC and explicit missingness.</p>}
          <p className="reference-method">This is a query-complete set for the pinned NeuroMorpho release and filter—not a biological census. Records are concentrated in five papers, two archives and lumbar tissue; record count is not an animal denominator.</p>
        </aside>
      </div>}
      </div>
      <div id="morphology-matrix-panel" role="tabpanel" aria-labelledby="morphology-matrix-tab" hidden={view !== "matrix"}>
        {view === "matrix" && <MorphologyMatrixPanel
          records={records}
          comparisonIds={matrixComparisonIds}
          onComparisonChange={updateComparisonIds}
          onOpenIndividual={(neuronId) => { selectRecord(neuronId); selectView("individual"); }}
          onOpenComparison={() => { updateComparisonIds(matrixComparisonIds); selectView("compare"); }}
        />}
      </div>
      <div id="morphology-compare-panel" role="tabpanel" aria-labelledby="morphology-compare-tab" hidden={view !== "compare"}>
        {view === "compare" && <MorphologyComparePanel
          records={comparisonRecords}
          comparisonIds={comparisonIds}
          analysisState={analysisState}
          censusIndexStatus={payload ? "verified" : indexError ? "unavailable" : "loading"}
          supplementaryAdapterStatus={supplementaryMorphologyAdapterStatus}
          supplementaryAnalysisRecords={supplementaryAnalysisState.records}
          supplementaryAnalysisSha256={supplementaryAnalysisState.status === "verified" ? supplementaryAnalysisState.sha256 : null}
          supplementaryAnalysisMessage={supplementaryAnalysisState.message}
          onComparisonChange={updateComparisonIds}
          onOpenMatrix={() => selectView("matrix")}
        />}
      </div>
      <div id="morphology-cohorts-panel" role="tabpanel" aria-labelledby="morphology-cohorts-tab" hidden={view !== "cohorts"}>
        {view === "cohorts" && <MorphologyCohortAnalysis state={analysisState} />}
      </div>
    </div>
  );
}
