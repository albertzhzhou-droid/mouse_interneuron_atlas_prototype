"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { neurolucidaNativeContourAdmissionCatalog } from "./atlas-types";
import nativeContourDerivedSomaSurfaceReceiptJson from "../data/native-contour-derived-soma-surface-0.1.json";
import toddNativeContourTopologyAuditJson from "../data/todd-native-contour-topology-audit-0.1.json";
import {
  nativeContourAdmissionRecord,
  nativeContourDisplayTransform,
  transformNativeContourPoint,
  validateNativeContourAdmissionCatalog,
} from "./neurolucida-native-contour-admission.js";
import { readVerifiedNativeContours, readVerifiedNativeContourShell, nativeContourVerification } from "./native-contour-verification.js";
import { NATIVE_CONTOUR_VIEW_BUILD_READY, captureNativeContourSourceView, preflightNativeContourSourceView, validateNativeContourSourceViewReplay, assertNativeContourSourceViewApplied, type NativeContourView, type NativeContourSourceViewDocument } from "./native-contour-source-view.js";
import MorphologySourceViewControls from "./MorphologySourceViewControls";
import NativeContourDiagnosticsDisclosure from "./NativeContourDiagnosticsDisclosure";
import { appendNativeContourExportPng, wrapNativeContourPngCaption } from "./native-contour-png-export.js";
import { computePerspectiveSphereFitDistance } from "./morphology-viewport-scale.js";
import "./native-contour-detail.css";

type NativeContour = {
  id: string;
  sourceName: string;
  sourceClosedFlag: boolean;
  interpretedClosed: boolean;
  closureBasis: string;
  sourceColor: string;
  vertexCount: number;
  semanticSegmentCount: number;
  zValuesMicrometre: number[];
  points: [number, number, number, number][];
  sourceProperties?: { CellBody?: boolean };
  sourcePropertyReceipts?: { key: string; declaredValueCount: number; values: unknown[] }[];
  cellBodyPresenceProperty?: { key: "CellBody"; declaredValueCount: 0; rawValues: []; interpretedPresence: true };
  independentParserClassification?: "somaContour";
  semanticClass?: "soma_contour_trace";
};

export type NativeContourPayload = {
  documentType: string;
  schemaVersion: string;
  releaseId: string;
  assetId: string;
  sourceFrame: string;
  registrationStatus: "unregistered";
  source: { bytes: number; sha256: string };
  summary: {
    vertexCount: number;
    surfaceCount: number;
    volumeCount: number;
    internalStructureObjectCount: number;
    registrationCount: number;
    crossSourceJoinCount: number;
    pointPayloadSha256: string;
    filledPolygonCount?: number;
    triangleCount?: number;
    loftCount?: number;
    membraneCount?: number;
    biologicalMeasurementCount?: number;
    standardizedSwcOverlayCount?: number;
    sameCellJoinCount?: number;
  };
  extraction?: { independentAudit?: { exactPointPayloadSha256?: string } };
  displayContract: Record<string, unknown>;
  contours: NativeContour[];
};

type CatalogSnapshotRecord = (typeof neurolucidaNativeContourAdmissionCatalog.records)[number];
// A snapshot containing only admitted records must not erase the held-record UI.
// The admission contract permits a null derived object before geometry is admitted.
export type CatalogRecord = Omit<CatalogSnapshotRecord, "derivedObject"> & {
  derivedObject: CatalogSnapshotRecord["derivedObject"] | null;
};
type LoadState =
  | { neuronId: number; status: "loading"; payload: null; message: string }
  | { neuronId: number; status: "verified"; payload: NativeContourPayload; message: string }
  | { neuronId: number; status: "held" | "unavailable"; payload: null; message: string };

export type DerivedSurfacePayload = {
  assetId: string;
  authority: string;
  sourceFrame: string;
  geometry: { rings: { contourId: string; zMicrometre: number; pointsMicrometre: [number, number, number][] }[]; triangleIndices: number[] };
  method: { algorithmId: string; version: string };
  qualityAssurance: { vertexCount: number; triangleCount: number; derivedDisplayOpenShellCount: number; observedSurfaceCount: number };
};
type DerivedSurfaceState =
  | { neuronId: number; status: "not_applicable"; payload: null; message: string }
  | { neuronId: number; status: "loading"; payload: null; message: string }
  | { neuronId: number; status: "verified"; payload: DerivedSurfacePayload; message: string }
  | { neuronId: number; status: "unavailable"; payload: null; message: string };

type ToddContourTransition = {
  fromContourId: string;
  toContourId: string;
  fromZMicrometre: number;
  toZMicrometre: number;
  centroidShiftMicrometre: number;
  areaRatio: number;
  alignedCyclicRmsMicrometre: number;
  bothSourceContoursSimple: boolean;
  withinReferenceScreen: boolean;
  result: string;
};
type ToddContourAuditRecord = {
  neuronId: number;
  summary: {
    contourCount: number;
    vertexCount: number;
    selfIntersectingContourCount: number;
    selfIntersectionCount: number;
    zeroLengthEdgeCount: number;
    adjacentTransitionCount: number;
    adjacentTransitionsWithinReferenceScreen: number;
    adjacentTransitionsHeld: number;
  };
  contoursSortedByZ: { id: string; zMicrometre: number; selfIntersectionEdgePairs: number[][]; zeroLengthEdgeIndices: number[] }[];
  transitionDiagnostics: ToddContourTransition[];
};

const toddNativeContourTopologyAudit = toddNativeContourTopologyAuditJson as {
  referenceScreen: {
    independentlyValidatedAsBiologicalTolerances: boolean;
    thresholds: {
      maximumAdjacentCentroidShiftMicrometre: number;
      maximumAdjacentContourAreaRatio: number;
      maximumAdjacentAlignedRmsMicrometre: number;
    };
  };
  records: ToddContourAuditRecord[];
};

const derivedSurfaceReceipt = nativeContourDerivedSomaSurfaceReceiptJson as {
  neuronId: number;
  artifact: { publicPath: string; bytes: number; sha256: string };
  sourceOriginalDat: { bytes: number; sha256: string };
  sourceNativeContourGeometry: { path: string; bytes: number; sha256: string };
};

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const drawable = object as THREE.Line | THREE.LineLoop | THREE.AxesHelper;
    drawable.geometry?.dispose();
    if (drawable.material) {
      const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function formatZ(values: number[]) {
  if (!values.length) return "not retained";
  return values.map((value) => `${value}`).join(", ");
}

function closureRuleLabel(neuronId: number, rawFalseCount: number) {
  if ([108978, 249676].includes(neuronId)) {
    const sourceName = neuronId === 108978 ? "Cell Body" : "CellBody";
    return `${rawFalseCount} raw false flags retained; exact ${sourceName} name drives the pinned parser somaContour classification. The separate empty-value CellBody presence property and MBF Cell Body semantics authorize only line closure.`;
  }
  if ([50424, 50394, 50408].includes(neuronId)) {
    return `${rawFalseCount} raw false flags retained; interpreted closure requires the exact Cell Body name, empty-value CellBody presence property, pinned somaContour classification and MBF cell-body semantics`;
  }
  if (neuronId === 45674) return "Seven raw source flags true; the one false-flag soma candidate is held";
  return "Seven raw flags true; one separately disclosed documented legacy exception";
}

function isRenderable(record: CatalogRecord | null): record is CatalogRecord & { derivedObject: NonNullable<CatalogRecord["derivedObject"]> } {
  return Boolean(record && "derivedObject" in record && record.derivedObject);
}

export default function NativeContourRecordViewer({ neuronId }: { neuronId: number }) {
  return <NativeContourRecordContent key={neuronId} neuronId={neuronId} />;
}

let nativeViewportSequence = 0;

function NativeContourRecordContent({ neuronId }: { neuronId: number }) {
  const instanceId = useId();
  const titleId = `native-contour-title-${neuronId}-${instanceId}`;
  const selectId = `native-contour-select-${neuronId}-${instanceId}`;
  const cameraHelpId = `native-contour-camera-help-${neuronId}-${instanceId}`;
  const catalog = useMemo(
    () => validateNativeContourAdmissionCatalog(neurolucidaNativeContourAdmissionCatalog),
    [],
  );
  const admission = useMemo(
    () => nativeContourAdmissionRecord(catalog, neuronId) as CatalogRecord | null,
    [catalog, neuronId],
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<{ primary: THREE.Group; secondary: THREE.Group } | null>(null);
  const contourLinesRef = useRef<THREE.LineLoop[]>([]);
  const derivedSurfaceRef = useRef<THREE.Mesh | null>(null);
  const [selectedContourId, setSelectedContourId] = useState("");
  const [isolateContour, setIsolateContour] = useState(false);
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(true);
  const [showDerivedSurface, setShowDerivedSurface] = useState(() => neuronId === 50394);
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [viewSignature, setViewSignature] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreFailure, setRestoreFailure] = useState("");
  const captureRef = useRef<(() => NativeContourSourceViewDocument) | null>(null);
  const exportPngRef = useRef<((document: unknown) => Promise<{ blob: Blob; preview: string }>) | null>(null);
  const refreshViewRef = useRef<(() => void) | null>(null);
  const fitCameraRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef({ selectedContourId, isolateContour, showPrimary, showSecondary, showDerivedSurface });
  const operationRef = useRef(0);
  const operationAbortRef = useRef<AbortController | null>(null);
  const pendingViewRef = useRef<NativeContourSourceViewDocument | null>(null);
  const pendingResolutionRef = useRef<{ resolve: () => void; reject: (error: Error) => void } | null>(null);
  const automaticShellRef = useRef(true);
  const derivedAttemptRef = useRef<NativeContourPayload | null>(null);
  const [state, setState] = useState<LoadState>(() => ({
    neuronId,
    status: isRenderable(admission) ? "loading" : "held",
    payload: null,
    message: isRenderable(admission) ? "Verifying exact source-native contour bytes…" : admission?.admission.reason ?? "No audited native DAT record is available.",
  }));
  const [derivedSurfaceState, setDerivedSurfaceState] = useState<DerivedSurfaceState>(() => neuronId === 50394
    ? { neuronId, status: "loading", payload: null, message: "Waiting for the exact OBS contour receipt before loading DER geometry…" }
    : { neuronId, status: "not_applicable", payload: null, message: "No contour-derived shell is admitted for this record." });

  useEffect(() => {
    if (!isRenderable(admission)) return undefined;
    const controller = new AbortController();
    operationAbortRef.current = controller;
    void readVerifiedNativeContours(neuronId, { signal: controller.signal })
      .then((payload) => { if (!controller.signal.aborted) setState({ neuronId, status: "verified", payload, message: "Original DAT and exact ordered source contours verified." }); })
      .catch((error: Error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") setState({ neuronId, status: "unavailable", payload: null, message: error.message });
      });
    return () => controller.abort();
  }, [admission, neuronId]);

  useEffect(() => () => { operationRef.current += 1; operationAbortRef.current?.abort(); pendingResolutionRef.current?.reject(new Error("The source changed before restoration completed.")); pendingResolutionRef.current = null; }, []);
  useEffect(() => { settingsRef.current = { selectedContourId, isolateContour, showPrimary, showSecondary, showDerivedSurface }; }, [selectedContourId, isolateContour, showPrimary, showSecondary, showDerivedSurface]);

  const loadFreshView = async (document: unknown | null) => {
    const saved = document === null ? null : preflightNativeContourSourceView(document, neuronId);
    if (saved && state.status === "verified") {
      const currentShell = saved.verification.derivedShell && derivedSurfaceState.status === "verified" ? derivedSurfaceState.payload : null;
      if (!saved.verification.derivedShell || currentShell) validateNativeContourSourceViewReplay(saved, neuronId, state.payload, currentShell, THREE.REVISION);
    }
    operationAbortRef.current?.abort();
    const controller = new AbortController(), operation = ++operationRef.current;
    operationAbortRef.current = controller;
    pendingViewRef.current = null; captureRef.current = null; exportPngRef.current = null; refreshViewRef.current = null; fitCameraRef.current = null;
    setViewSignature(""); setRestoreFailure(""); setRestoring(true);
    setState({ neuronId, status: "loading", payload: null, message: "Freshly verifying the exact source files…" });
    setDerivedSurfaceState({ neuronId, status: neuronId === 50394 ? "loading" : "not_applicable", payload: null, message: "Prior DER geometry cleared before verification." });
    try {
      const contours = await readVerifiedNativeContours(neuronId, { signal: controller.signal, forceReload: true });
      const needsShell = saved ? Boolean(saved.verification.derivedShell) : neuronId === 50394;
      const shell = needsShell ? await readVerifiedNativeContourShell(neuronId, contours, { signal: controller.signal, forceReload: true }) : null;
      if (controller.signal.aborted || operation !== operationRef.current) return;
      if (saved) validateNativeContourSourceViewReplay(saved, neuronId, contours, shell, THREE.REVISION);
      automaticShellRef.current = !saved || needsShell;
      if (saved) {
        const l = saved.view.layers, selection = saved.view.inspection;
        setShowPrimary(l.showPrimary); setShowSecondary(l.showSecondary); setShowDerivedSurface(l.showDerivedSurface);
        setSelectedContourId(selection.selectedContourId ?? ""); setIsolateContour(selection.isolateContour);
        settingsRef.current = { selectedContourId: selection.selectedContourId ?? "", isolateContour: selection.isolateContour, showPrimary: l.showPrimary, showSecondary: l.showSecondary, showDerivedSurface: l.showDerivedSurface };
      }
      pendingViewRef.current = saved;
      setState({ neuronId, status: "verified", payload: contours, message: "Original DAT and exact ordered contours freshly verified." });
      setDerivedSurfaceState(shell ? { neuronId, status: "verified", payload: shell, message: "Separate DER bytes freshly verified." } : { neuronId, status: "not_applicable", payload: null, message: "No DER geometry in this saved view." });
      if (!saved) setRestoring(false);
      else await new Promise<void>((resolve, reject) => { pendingResolutionRef.current = { resolve, reject }; });
    } catch (error) {
      if (controller.signal.aborted || operation !== operationRef.current) return;
      pendingViewRef.current = null;
      const message = error instanceof Error ? error.message : "Source verification failed.";
      setState({ neuronId, status: "unavailable", payload: null, message });
      setDerivedSurfaceState({ neuronId, status: "unavailable", payload: null, message: "DER withheld after source failure." });
      setRestoreFailure(message); setRestoring(false); throw error;
    }
  };

  const activeState = useMemo<LoadState>(() => state.neuronId === neuronId
    ? state
    : { neuronId, status: isRenderable(admission) ? "loading" : "held", payload: null, message: "Clearing the prior record before loading this selection…" }, [admission, neuronId, state]);
  const activeDerivedSurfaceState = useMemo<DerivedSurfaceState>(() => {
    if (neuronId !== derivedSurfaceReceipt.neuronId) {
      return { neuronId, status: "not_applicable", payload: null, message: "No contour-derived shell is admitted for this record." };
    }
    if (activeState.status === "unavailable" || activeState.status === "held") {
      return { neuronId, status: "unavailable", payload: null, message: "The exact OBS source contours were not verified; DER geometry is withheld." };
    }
    if (activeState.status !== "verified") {
      return { neuronId, status: "loading", payload: null, message: "Waiting for the exact OBS contour receipt before loading DER geometry…" };
    }
    return derivedSurfaceState.neuronId === neuronId
      ? derivedSurfaceState
      : { neuronId, status: "loading", payload: null, message: "Verifying the separate source-contour-derived shell…" };
  }, [activeState, derivedSurfaceState, neuronId]);
  const transform = useMemo(
    () => activeState.status === "verified" ? nativeContourDisplayTransform(activeState.payload.contours) : null,
    [activeState],
  );

  useEffect(() => {
    if (neuronId !== derivedSurfaceReceipt.neuronId || activeState.status !== "verified" || !automaticShellRef.current || restoring || restoreFailure) return undefined;
    if (derivedSurfaceState.status === "verified") {
      try { nativeContourVerification(neuronId, activeState.payload, derivedSurfaceState.payload); return undefined; } catch { /* Recheck a shell tied to a preceding source payload. */ }
    }
    if (derivedAttemptRef.current === activeState.payload) return undefined;
    derivedAttemptRef.current = activeState.payload;
    const controller = new AbortController();
    void readVerifiedNativeContourShell(neuronId, activeState.payload, { signal: controller.signal })
      .then((payload) => setDerivedSurfaceState({ neuronId, status: "verified", payload, message: "Separate DER interpolation shell verified; OBS source traces remain unchanged." }))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setDerivedSurfaceState({ neuronId, status: "unavailable", payload: null, message: error.message });
      });
    return () => controller.abort();
  }, [activeState, derivedSurfaceState, neuronId, restoring, restoreFailure]);

  useEffect(() => {
    const container = viewportRef.current;
    if (!container || !isRenderable(admission) || activeState.status !== "verified" || !transform || restoreFailure) return;
    const sourcePayload = activeState.payload;
    const shellPayload = activeDerivedSurfaceState.status === "verified" ? activeDerivedSurfaceState.payload : null;
    nativeContourVerification(neuronId, sourcePayload, shellPayload);
    captureRef.current = null; exportPngRef.current = null; refreshViewRef.current = null; fitCameraRef.current = null;
    queueMicrotask(() => setViewSignature(""));
    const unavailable = () => {
      pendingResolutionRef.current?.reject(new Error("WebGL is unavailable; the saved native view was not applied."));
      pendingResolutionRef.current = null;
      queueMicrotask(() => setWebGLAvailable(false));
    };
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) {
      unavailable();
      return;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      unavailable();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.dataset.assetId = activeState.payload.assetId;
    renderer.domElement.dataset.geometryAuthority = admission.derivedObject.authority;
    renderer.domElement.dataset.primitiveKind = activeDerivedSurfaceState.status === "verified" ? "source-line-loops-plus-derived-open-shell" : "line-loop-only";
    renderer.domElement.dataset.filledPolygonCount = "0";
    renderer.domElement.dataset.triangleCount = "0";
    renderer.domElement.dataset.derivedTriangleCount = activeDerivedSurfaceState.status === "verified" ? String(activeDerivedSurfaceState.payload.qualityAssurance.triangleCount) : "0";
    renderer.domElement.dataset.loftCount = "0";
    renderer.domElement.dataset.surfaceCount = "0";
    renderer.domElement.dataset.observedSurfaceCount = "0";
    renderer.domElement.dataset.derivedDisplaySurfaceCount = activeDerivedSurfaceState.status === "verified" ? "1" : "0";
    renderer.domElement.dataset.membraneCount = "0";
    renderer.domElement.dataset.volumeCount = "0";
    renderer.domElement.dataset.internalStructureObjectCount = "0";
    renderer.domElement.dataset.biologicalMeasurementCount = "0";
    renderer.domElement.dataset.standardizedSwcOverlayCount = "0";
    renderer.domElement.dataset.sameCellJoinCount = "0";
    renderer.domElement.dataset.registrationCount = "0";
    renderer.domElement.setAttribute("aria-label", `Interactive 3D view of ${activeState.payload.contours.length} source-native NMO ${neuronId} Neurolucida soma contour traces${activeDerivedSurfaceState.status === "verified" ? " and one separately verified interpolated DER open shell" : ""}. No observed membrane or volume, internal structure, SWC overlay or atlas registration is shown.`);
    renderer.domElement.setAttribute("aria-describedby", cameraHelpId);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1714);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    let userAdjustedCamera = Boolean(pendingViewRef.current), pointerInteraction = false;
    const onControlsStart = () => { pointerInteraction = true; };
    const onControlsEnd = () => { pointerInteraction = false; };
    const onControlsChange = () => { if (pointerInteraction) userAdjustedCamera = true; };
    const onCameraKeyDown = (event: KeyboardEvent) => { if (event.code.startsWith("Arrow")) userAdjustedCamera = true; };
    controls.addEventListener("start", onControlsStart);
    controls.addEventListener("end", onControlsEnd);
    controls.addEventListener("change", onControlsChange);
    controls.listenToKeyEvents(renderer.domElement);
    renderer.domElement.addEventListener("keydown", onCameraKeyDown);

    const root = new THREE.Group();
    root.name = `nmo-${neuronId}-source-native-contour-traces`;
    root.userData = { assetId: activeState.payload.assetId, authority: admission.derivedObject.authority, sourceFrame: activeState.payload.sourceFrame, allowedPrimitives: activeDerivedSurfaceState.status === "verified" ? ["OBS_source_native_ordered_line_loop", "DER_interpolated_open_shell"] : ["OBS_source_native_ordered_line_loop"], filledPolygonCount: 0, observedSurfaceCount: 0, derivedDisplaySurfaceCount: activeDerivedSurfaceState.status === "verified" ? 1 : 0, triangleCount: 0, derivedTriangleCount: activeDerivedSurfaceState.status === "verified" ? activeDerivedSurfaceState.payload.qualityAssurance.triangleCount : 0, loftCount: 0, membraneCount: 0, volumeCount: 0, internalStructureObjectCount: 0, biologicalMeasurementCount: 0, standardizedSwcOverlayCount: 0, sameCellJoinCount: 0, registrationCount: 0 };
    const primary = new THREE.Group();
    primary.name = "primary-source-native-contour-group";
    const secondary = new THREE.Group();
    secondary.name = "separately-disclosed-source-native-contour-group";
    const secondaryNames = new Set(admission.viewer?.secondarySourceNames ?? []);
    const contourLines: THREE.LineLoop[] = [];
    for (const contour of activeState.payload.contours) {
      const points = contour.points.map((point) => new THREE.Vector3(...transformNativeContourPoint(point, transform) as [number, number, number]));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: new THREE.Color(contour.sourceColor), transparent: true, opacity: secondaryNames.has(contour.sourceName) ? 0.95 : 0.82 });
      const line = new THREE.LineLoop(geometry, material);
      line.name = contour.id;
      line.renderOrder = 4;
      line.userData = { sourceName: contour.sourceName, sourceColor: contour.sourceColor, sourceClosedFlag: contour.sourceClosedFlag, interpretedClosed: contour.interpretedClosed, closureBasis: contour.closureBasis, vertexCount: contour.vertexCount, zValuesMicrometre: contour.zValuesMicrometre, traceRadiusRenderingUse: "forbidden" };
      contourLines.push(line);
      (secondaryNames.has(contour.sourceName) ? secondary : primary).add(line);
    }
    let derivedSurfaceMesh: THREE.Mesh | null = null;
    if (activeDerivedSurfaceState.status === "verified") {
      const surface = activeDerivedSurfaceState.payload;
      const position = new Float32Array(surface.qualityAssurance.vertexCount * 3);
      let offset = 0;
      for (const ring of surface.geometry.rings) {
        for (const point of ring.pointsMicrometre) {
          const displayed = transformNativeContourPoint(point, transform) as [number, number, number];
          position[offset++] = displayed[0];
          position[offset++] = displayed[1];
          position[offset++] = displayed[2];
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
      geometry.setIndex(surface.geometry.triangleIndices);
      geometry.computeVertexNormals();
      const material = new THREE.MeshBasicMaterial({ color: 0x55c6a8, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
      derivedSurfaceMesh = new THREE.Mesh(geometry, material);
      derivedSurfaceMesh.name = "DER-source-contour-interpolated-open-shell-not-membrane";
      derivedSurfaceMesh.renderOrder = 2;
      derivedSurfaceMesh.userData = { authority: surface.authority, algorithmId: surface.method.algorithmId, sourceFrame: surface.sourceFrame, ringCount: surface.geometry.rings.length, vertexCount: surface.qualityAssurance.vertexCount, triangleCount: surface.qualityAssurance.triangleCount, capCount: 0, observedSurfaceCount: 0, volumeCount: 0, internalStructureObjectCount: 0, biologicalMeasurementCount: 0, sameCellJoinCount: 0, registrationCount: 0, membraneClaim: false };
      derivedSurfaceRef.current = derivedSurfaceMesh;
    }
    root.add(primary);
    if (derivedSurfaceMesh) root.add(derivedSurfaceMesh);
    root.add(secondary);
    scene.add(root);
    visibilityRef.current = { primary, secondary };
    contourLinesRef.current = contourLines;

    const bounds = new THREE.Box3().setFromObject(root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 4;
    controls.target.copy(sphere.center);
    camera.position.copy(sphere.center).addScaledVector(new THREE.Vector3(1.4, 0.95, 1.65).normalize(),
      computePerspectiveSphereFitDistance({ radiusViewerUnit: radius, verticalFovDegrees: camera.getEffectiveFOV(), aspect: camera.aspect }));
    camera.near = Math.max(radius / 500, 0.01);
    camera.far = Math.max(radius * 40, 100);
    camera.updateProjectionMatrix();
    const fitCamera = () => {
      const damping = controls.enableDamping;
      controls.enableDamping = false;
      controls.update();
      const direction = camera.position.clone().sub(controls.target).normalize();
      controls.target.copy(sphere.center);
      camera.position.copy(sphere.center).addScaledVector(direction,
        computePerspectiveSphereFitDistance({ radiusViewerUnit: radius, verticalFovDegrees: camera.getEffectiveFOV(), aspect: camera.aspect }));
      controls.update();
      controls.enableDamping = damping;
      userAdjustedCamera = false;
    };

    const axes = new THREE.AxesHelper(Math.max(radius * 0.32, 0.7));
    axes.name = "viewer-axis-guide-not-biological-geometry";
    axes.position.copy(sphere.center);
    axes.userData = { authority: "VIEWER_GUIDE", measurementUse: "forbidden" };
    scene.add(axes);
    const scaleLength = 20 * transform.scaleViewerUnitPerMicrometre;
    const scaleGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(bounds.min.x, bounds.min.y - radius * 0.16, bounds.min.z), new THREE.Vector3(bounds.min.x + scaleLength, bounds.min.y - radius * 0.16, bounds.min.z)]);
    const scaleLine = new THREE.Line(scaleGeometry, new THREE.LineBasicMaterial({ color: 0xc9d8d2 }));
    scaleLine.name = "twenty-micrometre-source-coordinate-guide";
    scaleLine.userData = { authority: "VIEWER_GUIDE", nativeLengthMicrometre: 20 };
    scene.add(scaleLine);

    let resizeFrame = 0;
    let width = 0;
    let height = 0;
    const resize = () => {
      const nextWidth = Math.max(1, container.clientWidth);
      const nextHeight = Math.max(300, container.clientHeight);
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { renderer.setSize(width, height, false); camera.aspect = width / height;
        if (!userAdjustedCamera) fitCamera();
        camera.updateProjectionMatrix(); });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const instanceId = `native-contour-runtime-${++nativeViewportSequence}`;
    let revision = 1, lastSignature = "", applied = false;
    const describeView = (): NativeContourView => {
      const settings = settingsRef.current;
      return { status: "rendered", runtimeBinding: { instanceId, revision },
        camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far },
        viewport: { cssWidth: width, cssHeight: height, drawingBufferWidth: renderer.domElement.width, drawingBufferHeight: renderer.domElement.height, pixelRatio: renderer.getPixelRatio() },
        renderer: { engine: "THREE", revision: THREE.REVISION, type: "WebGLRenderer", outputColorSpace: renderer.outputColorSpace, toneMapping: renderer.toneMapping, alpha: true, antialias: true },
        clipping: { globalPlanes: [], localClippingEnabled: false },
        layers: { showPrimary: settings.showPrimary, showSecondary: settings.showSecondary, showDerivedSurface: settings.showDerivedSurface,
          primaryVisible: primary.visible, secondaryVisible: secondary.visible, derivedSurfaceVisible: Boolean(derivedSurfaceMesh?.visible),
          visibleContourIds: contourLines.filter(line => line.visible && (secondaryNames.has(line.userData.sourceName as string) ? secondary.visible : primary.visible)).map(line => line.name), axesVisible: true, scaleGuideVisible: true },
        inspection: { selectedContourId: settings.selectedContourId || null, isolateContour: settings.isolateContour },
        displayTransform: transform, sceneBounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), center: sphere.center.toArray(), radius } };
    };
    const capture = () => captureNativeContourSourceView(neuronId, sourcePayload, shellPayload, describeView(), THREE.REVISION);
    let disposed = false;
    exportPngRef.current = async (document) => {
      const saved = preflightNativeContourSourceView(document, neuronId);
      const assertCurrent = () => {
        synchronizeLayers();
        if (disposed || captureRef.current !== capture || JSON.stringify(saved) !== JSON.stringify(capture())) {
          throw new Error("The source view changed while preparing PNG. Capture the current view again.");
        }
      };
      assertCurrent();
      // Render and copy in one synchronous turn; the WebGL drawing buffer is not retained.
      renderer.render(scene, camera);
      const output = window.document.createElement("canvas");
      output.width = renderer.domElement.width;
      const context = output.getContext("2d");
      if (!context) throw new Error("PNG canvas is unavailable.");
      const ratio = renderer.getPixelRatio(), fontSize = Math.max(12, Math.round(14 * ratio));
      const padding = Math.max(10, Math.round(12 * ratio)), lineHeight = Math.ceil(fontSize * 1.45);
      context.font = `${fontSize}px sans-serif`;
      const captions = [
        `NeuroMorpho ${neuronId} · source-native contour view`,
        `Visible source traces: ${saved.view.layers.visibleContourIds.length} · DER open shell: ${Number(saved.view.layers.derivedSurfaceVisible)}`,
        "No observed membrane, volume, internal objects, SWC overlay or atlas registration.",
        "Source-local micrometre coordinates; display transform only. Image is not a biological measurement.",
        `Geometry SHA-256: ${saved.verification.sourceGeometry.sha256}`,
        `Original DAT verified: ${saved.verification.originalDat.sha256}; complete objects: ${saved.verification.originalDat.topLevelObjectCount}`,
        "Original DAT and exact ordered contours verified; source API hashes remain declared. JSON is required for fresh same-build view restoration.",
      ];
      const lines = captions.flatMap(caption => wrapNativeContourPngCaption(caption, output.width - padding * 2, text => context.measureText(text).width));
      output.height = renderer.domElement.height + padding * 2 + lines.length * lineHeight;
      context.fillStyle = "#0a1714"; context.fillRect(0, 0, output.width, output.height);
      context.drawImage(renderer.domElement, 0, 0);
      context.fillStyle = "#f5f8f2";
      context.fillRect(0, renderer.domElement.height, output.width, output.height - renderer.domElement.height);
      context.fillStyle = "#203c32"; context.font = `${fontSize}px sans-serif`; context.textBaseline = "top";
      lines.forEach((line, index) => context.fillText(line, padding, renderer.domElement.height + padding + index * lineHeight));
      const encoded = await new Promise<Blob>((resolve, reject) => output.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG encoding failed.")), "image/png"));
      assertCurrent();
      const blob = await appendNativeContourExportPng(encoded, saved, { neuronId, contours: sourcePayload, shell: shellPayload, rendererRevision: THREE.REVISION });
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("PNG preview is unavailable."));
        reader.onerror = () => reject(new Error("PNG preview is unavailable.")); reader.readAsDataURL(blob);
      });
      assertCurrent();
      return { blob, preview };
    };
    const refreshView = () => {
      if (!applied || !NATIVE_CONTOUR_VIEW_BUILD_READY) return;
      const stable = Object.fromEntries(Object.entries(describeView()).filter(([key]) => key !== "runtimeBinding"));
      const signature = JSON.stringify(stable);
      if (signature !== lastSignature) { lastSignature = signature; revision += 1; setViewSignature(`${instanceId}:${revision}`); }
    };
    const synchronizeLayers = () => {
      const settings = settingsRef.current;
      primary.visible = settings.showPrimary; secondary.visible = settings.showSecondary;
      for (const line of contourLines) {
        const selected = line.name === settings.selectedContourId, material = line.material as THREE.LineBasicMaterial;
        material.color.set(selected ? "#ffdb76" : line.userData.sourceColor as string);
        material.opacity = settings.selectedContourId && !selected ? 0.23 : 0.95;
        line.visible = !settings.isolateContour || !settings.selectedContourId || selected;
      }
      if (derivedSurfaceMesh) derivedSurfaceMesh.visible = settings.showDerivedSurface && !(settings.isolateContour && Boolean(settings.selectedContourId));
    };
    captureRef.current = capture; refreshViewRef.current = refreshView;
    fitCameraRef.current = () => { if (!disposed && applied) { fitCamera(); renderer.render(scene, camera); refreshView(); } };
    let animationFrame = 0;
    const render = () => {
      controls.update(); synchronizeLayers();
      if (!applied && width > 0 && renderer.domElement.width > 0) {
        const saved = pendingViewRef.current;
        try {
          if (saved) {
            validateNativeContourSourceViewReplay(saved, neuronId, sourcePayload, shellPayload, THREE.REVISION);
            const c = saved.view.camera;
            controls.enableDamping = false;
            camera.position.fromArray(c.position); camera.up.fromArray(c.up); controls.target.fromArray(c.target);
            camera.near = c.near; camera.far = c.far; camera.zoom = c.zoom; camera.updateProjectionMatrix();
            controls.update(); controls.enableDamping = true;
          }
          renderer.render(scene, camera);
          if (NATIVE_CONTOUR_VIEW_BUILD_READY) {
            const current = capture();
            if (saved) assertNativeContourSourceViewApplied(saved, current);
          }
          applied = true;
          setWebGLAvailable(true);
          renderer.domElement.dataset.sourceVerification = "private_native_contour_bytes_verified";
          renderer.domElement.dataset.viewRuntimeInstanceId = instanceId;
          if (saved) { pendingViewRef.current = null; pendingResolutionRef.current?.resolve(); pendingResolutionRef.current = null; setRestoring(false); }
        } catch (error) {
          const failure = error instanceof Error ? error : new Error("Native source view could not be applied.");
          pendingResolutionRef.current?.reject(failure); pendingResolutionRef.current = null;
          captureRef.current = null; exportPngRef.current = null; refreshViewRef.current = null; fitCameraRef.current = null; setViewSignature("");
          if (!saved) setRestoreFailure(failure.message);
          return;
        }
      }
      renderer.render(scene, camera); refreshView(); animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);
    const onContextLost = (event: Event) => { event.preventDefault(); disposed = true; cancelAnimationFrame(animationFrame); captureRef.current = null; exportPngRef.current = null; refreshViewRef.current = null; fitCameraRef.current = null; setViewSignature(""); setWebGLAvailable(false);
      pendingResolutionRef.current?.reject(new Error("WebGL became unavailable before the saved view was applied.")); pendingResolutionRef.current = null; };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("keydown", onCameraKeyDown);
      controls.removeEventListener("start", onControlsStart);
      controls.removeEventListener("end", onControlsEnd);
      controls.removeEventListener("change", onControlsChange);
      controls.dispose();
      disposeObject(root);
      disposeObject(axes);
      disposeObject(scaleLine);
      renderer.dispose();
      renderer.domElement.remove();
      visibilityRef.current = null;
      contourLinesRef.current = [];
      derivedSurfaceRef.current = null;
      captureRef.current = null; exportPngRef.current = null; refreshViewRef.current = null; fitCameraRef.current = null;
    };
  }, [activeDerivedSurfaceState, activeState, admission, neuronId, transform, restoreFailure, cameraHelpId]);

  useEffect(() => {
    if (!visibilityRef.current) return;
    visibilityRef.current.primary.visible = showPrimary;
    visibilityRef.current.secondary.visible = showSecondary;
  }, [showPrimary, showSecondary, activeState]);

  useEffect(() => {
    if (!derivedSurfaceRef.current) return;
    derivedSurfaceRef.current.visible = showDerivedSurface && !(isolateContour && Boolean(selectedContourId));
  }, [activeDerivedSurfaceState, isolateContour, selectedContourId, showDerivedSurface]);

  useEffect(() => {
    for (const line of contourLinesRef.current) {
      const selected = line.name === selectedContourId;
      const material = line.material as THREE.LineBasicMaterial;
      material.color.set(selected ? "#ffdb76" : line.userData.sourceColor as string);
      // Synchronize a renderer-owned Three.js object; this effect does not mutate React state.
      // eslint-disable-next-line react-hooks/immutability
      material.opacity = selectedContourId && !selected ? 0.23 : 0.95;
      line.visible = !isolateContour || !selectedContourId || selected;
    }
  }, [selectedContourId, isolateContour, activeState]);

  if (!admission) return null;
  const admitted = admission.admission.admittedContourObjectCount;
  const vertices = admission.admission.admittedVertexCount;
  const statusLabel = activeState.status === "verified" ? "CHECKSUM VERIFIED" : activeState.status.toUpperCase();
  const zValues = activeState.status === "verified" ? activeState.payload.contours.flatMap((contour) => contour.zValuesMicrometre) : admission.audit.somaNamedZInSourceOrderMicrometre ?? [];
  const mbfEvidenceUrl = "mbfCellBodySemantics" in admission.sourceLinks ? admission.sourceLinks.mbfCellBodySemantics : null;
  const selectedContour = activeState.status === "verified" ? activeState.payload.contours.find((contour) => contour.id === selectedContourId) ?? null : null;
  const toddTopologyRecord = [50424, 50408].includes(neuronId)
    ? toddNativeContourTopologyAudit.records.find((record) => record.neuronId === neuronId) ?? null
    : null;

  const derivedSurfaceCount = activeDerivedSurfaceState.status === "verified" ? 1 : 0;
  return (
    <section className={`native-soma-contour-viewer native-contour-record-viewer ${isRenderable(admission) ? "admitted" : "held"}`} aria-labelledby={titleId} data-asset-id={`NeuroMorpho:${neuronId}`} data-admission-status={admission.admissionStatus} data-admitted-contour-count={admitted} data-admitted-vertex-count={vertices} data-filled-polygon-count="0" data-triangle-count="0" data-derived-triangle-count={activeDerivedSurfaceState.status === "verified" ? activeDerivedSurfaceState.payload.qualityAssurance.triangleCount : "0"} data-loft-count="0" data-surface-count="0" data-observed-surface-count="0" data-derived-display-surface-count={derivedSurfaceCount} data-membrane-count="0" data-volume-count="0" data-internal-structure-object-count="0" data-biological-measurement-count="0" data-standardized-swc-overlay-count="0" data-same-cell-join-count="0" data-registration-count="0">
      <header>
        <div>
          <p className="panel-kicker">PER-RECORD MORPHOLOGY DETAIL · OBS + DER</p>
          <h3 id={titleId}>NMO {neuronId} native contour detail</h3>
          <p>{admission.title}. OBS traces and any separately admitted DER display geometry are identity-gated to this exact record; prior-record geometry is cleared on switch.</p>
        </div>
        <strong>{statusLabel}</strong>
      </header>

      <div className="native-soma-contour-metrics" aria-label={`NMO ${neuronId} native contour evidence counts`}>
        <span><strong>{admission.audit.somaNamedContourObjectCount}</strong> audited soma traces</span>
        <span><strong>{admitted}</strong> admitted line loops</span>
        <span><strong>{vertices}</strong> admitted vertices</span>
        <span><strong>{admission.audit.sourceOpenSomaNamedContourCount}</strong> raw false flags</span>
        <span><strong>0</strong> observed surfaces / volumes</span>
        <span><strong>{derivedSurfaceCount}</strong> DER open shell · <strong>0</strong> internal objects / REG</span>
      </div>

      {activeState.status === "verified" && <p className="native-dat-verification" role="status">Original DAT and all admitted ordered coordinates verified · {nativeContourVerification(neuronId, activeState.payload).originalDat.topLevelObjectCount} source objects audited. Source tree, marker and spine labels remain outside this contour view.</p>}

      {isRenderable(admission) ? (
        <div className="native-soma-contour-layout">
          <div>
            <div className="native-soma-contour-controls" aria-label="Native contour trace visibility">
              <button type="button" disabled={restoring} className={showPrimary ? "active" : ""} aria-pressed={showPrimary} onClick={() => setShowPrimary((value) => !value)}>{admission.viewer?.primaryLabel ?? "Admitted source-closed traces"}</button>
              {admission.viewer?.secondaryLabel && <button type="button" disabled={restoring} className={showSecondary ? "active legacy" : ""} aria-pressed={showSecondary} onClick={() => setShowSecondary((value) => !value)}>{admission.viewer.secondaryLabel}</button>}
              {neuronId === 50394 && <button type="button" className={showDerivedSurface && derivedSurfaceCount ? "active derived" : ""} aria-pressed={showDerivedSurface && derivedSurfaceCount > 0} disabled={restoring || derivedSurfaceCount === 0} onClick={() => setShowDerivedSurface((value) => !value)}>Interpolated soma shell · DER</button>}
              {neuronId === 50394 && activeDerivedSurfaceState.status !== "verified" && <span className="native-derived-surface-status" role={activeDerivedSurfaceState.status === "unavailable" ? "alert" : "status"}>{activeDerivedSurfaceState.message}</span>}
            </div>
            {activeState.status === "verified" && <div className="native-contour-inspection-controls">
              <label htmlFor={selectId}>Inspect a source cross-section</label>
              <select id={selectId} disabled={restoring} value={selectedContourId} onChange={(event) => { setSelectedContourId(event.target.value); if (!event.target.value) setIsolateContour(false); setShowPrimary(true); setShowSecondary(true); }}>
                <option value="">All {activeState.payload.contours.length} source traces</option>
                {activeState.payload.contours.map((contour, index) => <option key={contour.id} value={contour.id}>Trace {index + 1} · z {formatZ(contour.zValuesMicrometre)} µm · {contour.vertexCount} vertices</option>)}
              </select>
              <label className="native-contour-isolate"><input type="checkbox" checked={isolateContour} disabled={restoring || !selectedContour} onChange={(event) => setIsolateContour(event.target.checked)} />Isolate selected trace</label>
            </div>}
            <div className="native-soma-contour-stage" ref={viewportRef}>
              {activeState.status === "loading" && <p role="status">{activeState.message}</p>}
              {activeState.status === "unavailable" && <p role="alert">Native traces unavailable: {activeState.message}. No fallback geometry is shown.</p>}
              {!webGLAvailable && <p role="status">WebGL unavailable. Exact source values and boundaries remain readable.</p>}
              {activeState.status === "verified" && <div className="native-soma-contour-scale" aria-hidden="true"><span />20 µm native-coordinate guide</div>}
            </div>
            <div className="native-contour-camera-actions">
              <button type="button" className="native-contour-fit" disabled={restoring || !webGLAvailable || !viewSignature || Boolean(restoreFailure)} onClick={() => fitCameraRef.current?.()}>Fit all source traces</button>
              <button type="button" className="native-contour-recheck" disabled={restoring} onClick={() => { void loadFreshView(null).catch(() => undefined); }}>Recheck source files</button>
            </div>
            <p className="native-contour-camera-help" id={cameraHelpId}>Focus the view and use arrow keys to pan, or Shift + arrow keys to rotate. Fit all source traces keeps the current trace selection and layers.</p>
            {restoreFailure && <p role="alert">{restoreFailure}</p>}
            <MorphologySourceViewControls neuronId={neuronId} signature={viewSignature} available={Boolean(viewSignature) && webGLAvailable && !restoring && !restoreFailure} restoring={restoring}
              capture={() => { if (!captureRef.current) throw new Error("The native contour view is unavailable."); return captureRef.current(); }} restore={loadFreshView}
              exportPng={document => { if (!exportPngRef.current) throw new Error("The native contour view is unavailable."); return exportPngRef.current(document); }}
              unavailableReason={!NATIVE_CONTOUR_VIEW_BUILD_READY ? "View saving is temporarily unavailable while its build record is incomplete." : undefined}
              description="Save this native-frame camera, visible trace groups, selected cross-section and separate DER layer. Restoration freshly verifies original DAT bytes, its complete object inventory and exact admitted coordinates, then checks the applied view. Source API hashes remain declared; no SWC overlay, membrane, internal anatomy or registration is added." />
            {activeState.status === "verified" && !restoring && !restoreFailure && <NativeContourDiagnosticsDisclosure key={`${neuronId}:${nativeContourVerification(neuronId, activeState.payload).sourceGeometry.verificationSequence}`} neuronId={neuronId} payload={activeState.payload} onInspect={id => { setSelectedContourId(id); setShowPrimary(true); setShowSecondary(true); setIsolateContour(false); }} />}
            {selectedContour && <div className="native-contour-selected-trace" data-selected-native-contour-id={selectedContour.id}>
              <strong>{selectedContour.sourceName} · {selectedContour.vertexCount} ordered vertices · z {formatZ(selectedContour.zValuesMicrometre)} µm</strong>
              <p>Raw closed flag: {String(selectedContour.sourceClosedFlag)}. Display closure: {String(selectedContour.interpretedClosed)}. Separate traces at a repeated z remain separate source objects.</p>
              <details><summary>First five exact source coordinates</summary><table><caption>µm in the native DAT frame; no registration or biological measurement inferred</caption><thead><tr><th>Source vertex</th><th>x</th><th>y</th><th>z</th></tr></thead><tbody>{selectedContour.points.slice(0, 5).map((point, index) => <tr key={index}><th>{index + 1}</th>{point.slice(0, 3).map((value, axis) => <td key={axis}>{value}</td>)}</tr>)}</tbody></table></details>
            </div>}
          </div>
          <aside aria-label="Native contour interpretation boundaries">
            <dl>
              <div><dt>Source-order z</dt><dd>{formatZ(zValues)} µm</dd></div>
              <div><dt>Closure rule</dt><dd>{closureRuleLabel(neuronId, admission.audit.sourceOpenSomaNamedContourCount)}</dd></div>
              <div><dt>Trace radius</dt><dd>retained in source points · not used as anatomical thickness</dd></div>
              <div><dt>Transform</dt><dd>viewer-only recentering and uniform scale · source coordinates preserved</dd></div>
            </dl>
            <div className="native-soma-contour-boundary" role="note"><strong>{derivedSurfaceCount ? "OBS TRACES + SEPARATE DER SHELL" : "OBS LINE TRACES"}</strong><p>{derivedSurfaceCount ? "The source-native catalog remains line-loop-only. This one record has a separate, checksum-verified open interpolation shell between contiguous source planes; it is not an observed membrane, volume, nucleus, organelle or internal segmentation. " : ""}{admission.hardBoundaries.join(" ")}</p></div>
            {toddTopologyRecord && <details className="native-contour-topology-review" data-topology-audit-release="ohri-todd-native-contour-topology-audit-0.1.0">
              <summary>Adjacent-section topology screen · {toddTopologyRecord.summary.adjacentTransitionsWithinReferenceScreen}/{toddTopologyRecord.summary.adjacentTransitionCount} within exploratory screen · 0 shells admitted</summary>
              <p>Checksum-gated DAT contours, shown in z order for this comparison; the source array order remains separately preserved. The screen is inherited from NMO 50394 and is not independently validated as a biological tolerance. Passing is not shell admission. No source points are repaired, smoothed, interpolated or registered.</p>
              <p>Exploratory screen gates: centroid shift ≤ {toddNativeContourTopologyAudit.referenceScreen.thresholds.maximumAdjacentCentroidShiftMicrometre} µm; area ratio ≤ {toddNativeContourTopologyAudit.referenceScreen.thresholds.maximumAdjacentContourAreaRatio}; aligned cyclic RMS ≤ {toddNativeContourTopologyAudit.referenceScreen.thresholds.maximumAdjacentAlignedRmsMicrometre} µm.</p>
              <p>Audited here: {toddTopologyRecord.summary.contourCount} source loops / {toddTopologyRecord.summary.vertexCount.toLocaleString()} ordered vertices; {toddTopologyRecord.summary.selfIntersectionCount} self-intersections across {toddTopologyRecord.summary.selfIntersectingContourCount} loops; {toddTopologyRecord.summary.zeroLengthEdgeCount} zero-length source edge(s); {toddTopologyRecord.summary.adjacentTransitionsHeld} adjacent transitions held.</p>
              <details>
                <summary>Per-transition measurements · native DAT frame</summary>
                <table>
                  <caption>Software diagnostic only; values are not biological measurements or a claim of cell change</caption>
                  <thead><tr><th>Adjacent source sections</th><th>Centroid shift (µm)</th><th>Area ratio</th><th>Aligned cyclic RMS (µm)</th><th>Screen result</th></tr></thead>
                  <tbody>{toddTopologyRecord.transitionDiagnostics.map((transition) => <tr key={`${transition.fromContourId}:${transition.toContourId}`}>
                    <th scope="row">z {transition.fromZMicrometre} → {transition.toZMicrometre}</th>
                    <td>{transition.centroidShiftMicrometre.toFixed(4)}</td>
                    <td>{transition.areaRatio.toFixed(4)}</td>
                    <td>{transition.alignedCyclicRmsMicrometre.toFixed(4)}</td>
                    <td>{!transition.bothSourceContoursSimple ? "HOLD · self-intersection" : transition.withinReferenceScreen ? "Within screen · no surface admission" : "HOLD · outside screen"}</td>
                  </tr>)}</tbody>
                </table>
              </details>
              <details>
                <summary>Source contour topology flags</summary>
                <ul>{toddTopologyRecord.contoursSortedByZ.filter((contour) => contour.selfIntersectionEdgePairs.length > 0 || contour.zeroLengthEdgeIndices.length > 0).map((contour) => <li key={contour.id}>{contour.id} · z {contour.zMicrometre} µm{contour.selfIntersectionEdgePairs.length > 0 ? ` · self-intersecting edge pairs ${contour.selfIntersectionEdgePairs.map((pair) => `[${pair.join(", ")}]`).join(", ")}` : ""}{contour.zeroLengthEdgeIndices.length > 0 ? ` · zero-length edge indices ${contour.zeroLengthEdgeIndices.join(", ")}` : ""}</li>)}</ul>
              </details>
            </details>}
            <nav aria-label={`Native contour sources for NMO ${neuronId}`}>
              <a href={admission.source.officialRecordUrl} target="_blank" rel="noreferrer">NeuroMorpho record ↗</a>
              <a href={admission.source.originalDatUrl} target="_blank" rel="noreferrer">Original DAT ↗</a>
              {activeState.status === "verified" && <a href={nativeContourVerification(neuronId, activeState.payload).fileManifest.path} target="_blank" rel="noreferrer">Complete source-file audit ↗</a>}
              <a href="https://github.com/NeuroMorpho/xyz2swc/tree/e07fd2d53c03945f011c335c7b643765f2d85a09" target="_blank" rel="noreferrer">Independent parser audit ↗</a>
              {mbfEvidenceUrl && <a href={mbfEvidenceUrl} target="_blank" rel="noreferrer">MBF Cell Body semantics ↗</a>}
              <a href="https://neuromorphological-file-specification.readthedocs.io/en/latest/NMF.html" target="_blank" rel="noreferrer">Contour semantics ↗</a>
            </nav>
          </aside>
        </div>
      ) : (
        <div className="native-contour-held-card" role="status">
          <div><strong>0 native contour primitives admitted</strong><span>{activeState.message}</span></div>
          <dl>
            <div><dt>Audited source contours</dt><dd>{admission.audit.exactSourceContourObjectCount}</dd></div>
            <div><dt>Soma-named vertices</dt><dd>{admission.audit.somaNamedVertexCount.toLocaleString()}</dd></div>
            <div><dt>Raw closure flags</dt><dd>{admission.audit.sourceClosedSomaNamedContourCount} closed / {admission.audit.sourceOpenSomaNamedContourCount} open</dd></div>
            <div><dt>Independent point audit</dt><dd>{admission.audit.independentPointArraysAgree ? "Exact ordered arrays agree" : "Unavailable"}</dd></div>
          </dl>
          <p>{admission.hardBoundaries.join(" ")}</p>
          <nav><a href={admission.source.officialRecordUrl} target="_blank" rel="noreferrer">NeuroMorpho record ↗</a><a href={admission.source.originalDatUrl} target="_blank" rel="noreferrer">Original DAT ↗</a></nav>
        </div>
      )}
    </section>
  );
}
