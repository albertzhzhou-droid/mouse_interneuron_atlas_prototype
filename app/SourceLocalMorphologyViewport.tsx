"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MorphologyNeuriteInspector, { type NeuriteInspectionController, type NeuriteInspectionSelection } from "./MorphologyNeuriteInspector";
import MorphologySourceViewControls from "./MorphologySourceViewControls";
import { appendMorphologyExportPng, assertMorphologyPngCurrent, morphologyPngCaptions } from "./morphology-png-export.js";
import { encodeSourceViewPng } from "./source-view-png-raster.js";
import { captureMorphologySourceView, validateMorphologySourceViewReplay, assertMorphologySourceViewSceneBounds, assertMorphologySourceViewAppliedPose, type MorphologySourceView, type MorphologySourceViewDocument } from "./morphology-source-view.js";
import { readVerifiedUniverseGeometry, type UniverseRecord } from "./neuromorpho-universe-verification.js";
import { attachSwcNeuriteInspection } from "./morphology-neurite-inspection.js";
import {
  type MorphologyCensusRecord,
  type MorphologyGeometryPayload,
  MORPHOLOGY_TYPE_COLORS,
  morphologyHasDiameter,
  loadVerifiedMorphologyGeometry,
  type MorphologyComparisonRecord,
} from "./morphology-census-data";
import {
  computeMorphologyViewportScaleBar,
  computePerspectiveSphereFitDistance,
  formatMorphologyScaleLength,
} from "./morphology-viewport-scale.js";
import {
  createObservedSwcCenterlines,
  createObservedTopologyLandmarks,
  extractObservedTopologyLandmarks,
  createRadiusDerivedSurface,
} from "./source-local-morphology-geometry.js";
import { resolveMorphologyRenderMode } from "./morphology-render-mode.js";

let viewportInstanceSequence = 0;

export type MorphologyRenderMode = "skeleton" | "radius";

export type MorphologyViewportRuntimeBinding = {
  neuronId: number;
  geometrySha256: string;
  effectiveRenderMode: MorphologyRenderMode;
  viewportInstanceId: string;
  viewportRevision: number;
};

export type MorphologyViewportScaleReceipt = MorphologyViewportRuntimeBinding & {
  algorithmId: "camera_target_plane_source_local_scale_v1";
  measurementPlane: "camera_target_depth";
  sourceCoordinateUnit: "micrometre_reported_by_source";
  lengthMicrometre: number;
  pixelLength: number;
  micrometrePerCssPixel: number;
  targetPixelLength: number;
  sourceLocalOnly: true;
  sharedAcrossViewports: false;
  apparentObjectSizeComparable: false;
  neuronId: number;
  geometrySha256: string;
  viewportCssWidth: number;
  viewportCssHeight: number;
  effectiveVerticalFovDegrees: number;
  cameraTargetDistanceViewerUnit: number;
  cameraPositionViewerUnit: [number, number, number];
  orbitTargetViewerUnit: [number, number, number];
  scaleViewerUnitPerMicrometre: number;
  dimensionality: "2D" | "3D";
  sourcePlaneLocked: boolean;
};

type ViewportActions = { reset: () => void; zoomIn: () => void; zoomOut: () => void };

function sameScaleReceipt(
  left: MorphologyViewportScaleReceipt | null,
  right: MorphologyViewportScaleReceipt | null,
) {
  if (left === right) return true;
  if (!left || !right) return false;
  return JSON.stringify(left) === JSON.stringify(right);
}

export default function SourceLocalMorphologyViewport({
  record,
  geometry,
  mode,
  className = "",
  onScaleBarChange,
  onViewportBindingChange,
  replayRecord,
  onRestoreRequestedMode,
  onFreshVerifiedGeometry,
  onFreshVerificationStateChange,
}: {
  record: MorphologyCensusRecord;
  geometry: MorphologyGeometryPayload;
  mode: MorphologyRenderMode;
  className?: string;
  onScaleBarChange?: (receipt: MorphologyViewportScaleReceipt | null) => void;
  onViewportBindingChange?: (binding: MorphologyViewportRuntimeBinding | null) => void;
  replayRecord?: MorphologyComparisonRecord | UniverseRecord;
  onRestoreRequestedMode?: (mode: MorphologyRenderMode) => void;
  onFreshVerifiedGeometry?: (geometry: MorphologyGeometryPayload) => void;
  onFreshVerificationStateChange?: (state: "pending" | "verified" | "unavailable") => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<ViewportActions | null>(null);
  const inspectionRef = useRef<NeuriteInspectionController | null>(null);
  const [inspectionSelection, setInspectionSelection] = useState<NeuriteInspectionSelection | null>(null);
  const inspectionSelectionRef = useRef<NeuriteInspectionSelection | null>(null);
  const scaleCallbackRef = useRef(onScaleBarChange);
  const bindingCallbackRef = useRef(onViewportBindingChange);
  const viewportInstanceIdRef = useRef("");
  const viewportRevisionRef = useRef(0);
  const descriptionId = useId();
  const [webGLFailure, setWebGLFailure] = useState("");
  const [scaleBar, setScaleBar] = useState<MorphologyViewportScaleReceipt | null>(null);
  const [showTopologyLandmarks, setShowTopologyLandmarks] = useState(true);
  const sourceKey = `${record.neuronId}:${record.geometry.sha256}`;
  const [freshGeometry, setFreshGeometry] = useState<{ sourceKey: string; geometry: MorphologyGeometryPayload } | null>(null);
  const runtimeGeometry = freshGeometry?.sourceKey === sourceKey ? freshGeometry.geometry : geometry;
  const [restoring, setRestoring] = useState(false);
  const [restoreFailure, setRestoreFailure] = useState("");
  const [viewSignature, setViewSignature] = useState("");
  const viewMutationRevisionRef = useRef(0);
  const captureRef = useRef<(() => MorphologySourceViewDocument) | null>(null);
  const exportPngRef = useRef<((document: unknown) => Promise<{ blob: Blob; preview: string }>) | null>(null);
  const refreshViewRef = useRef<(() => void) | null>(null);
  const requestedModeRef = useRef(mode);
  const restoreCallbacksRef = useRef({ onRestoreRequestedMode, onFreshVerifiedGeometry, onFreshVerificationStateChange });
  const sourceKeyRef = useRef(sourceKey);
  const restoreOperationRef = useRef(0);
  const restoreAbortRef = useRef<AbortController | null>(null);
  const pendingRestoreRef = useRef<{ operation: number; sourceKey: string; document: MorphologySourceViewDocument; resolve: () => void; reject: (reason: Error) => void } | null>(null);
  const effectiveMode = resolveMorphologyRenderMode(record.normalizedMetadata, mode);
  const isTwoDimensional = record.normalizedMetadata.dimensionality === "2D";
  const sourceRadiusAvailable = morphologyHasDiameter(record);
  const topologyLandmarks = extractObservedTopologyLandmarks(runtimeGeometry);

  useEffect(() => {
    requestedModeRef.current = mode;
    refreshViewRef.current?.();
  }, [mode]);
  useEffect(() => { restoreCallbacksRef.current = { onRestoreRequestedMode, onFreshVerifiedGeometry, onFreshVerificationStateChange }; }, [onRestoreRequestedMode, onFreshVerifiedGeometry, onFreshVerificationStateChange]);
  useEffect(() => {
    sourceKeyRef.current = sourceKey;
    return () => {
      restoreOperationRef.current += 1;
      restoreAbortRef.current?.abort();
      pendingRestoreRef.current?.reject(new Error("The source changed or the viewport closed before restoration completed."));
      pendingRestoreRef.current = null;
    };
  }, [sourceKey]);

  const restoreSourceView = async (document: unknown) => {
    if (!replayRecord) throw new Error("Source-view restoration is unavailable for this record.");
    validateMorphologySourceViewReplay(replayRecord, runtimeGeometry, document, THREE.REVISION);
    const saved = document as MorphologySourceViewDocument;
    restoreAbortRef.current?.abort();
    pendingRestoreRef.current?.reject(new Error("A newer source-view restoration replaced this request."));
    pendingRestoreRef.current = null;
    const operation = ++restoreOperationRef.current, abort = new AbortController();
    restoreAbortRef.current = abort;
    setRestoring(true); setRestoreFailure(""); setViewSignature("");
    captureRef.current = null; exportPngRef.current = null;
    scaleCallbackRef.current?.(null); bindingCallbackRef.current?.(null);
    restoreCallbacksRef.current.onFreshVerificationStateChange?.("pending");
    let bytesVerified = false;
    try {
      const fresh = "sourceObject" in replayRecord
        ? await readVerifiedUniverseGeometry(replayRecord, { forceReload: true, signal: abort.signal })
        : await loadVerifiedMorphologyGeometry(replayRecord, { forceReload: true, signal: abort.signal });
      if (abort.signal.aborted || operation !== restoreOperationRef.current || sourceKey !== sourceKeyRef.current) throw new Error("The source changed before fresh verification completed.");
      bytesVerified = true;
      restoreCallbacksRef.current.onFreshVerificationStateChange?.("verified");
      validateMorphologySourceViewReplay(replayRecord, fresh, saved, THREE.REVISION);
      const applied = new Promise<void>((resolve, reject) => { pendingRestoreRef.current = { operation, sourceKey, document: saved, resolve, reject }; });
      restoreCallbacksRef.current.onFreshVerifiedGeometry?.(fresh);
      setFreshGeometry({ sourceKey, geometry: fresh });
      setShowTopologyLandmarks(saved.view.layers.topologyLandmarksVisible);
      restoreCallbacksRef.current.onRestoreRequestedMode?.(saved.view.requestedMode);
      setRestoring(false);
      await applied;
    } catch (error) {
      if (operation === restoreOperationRef.current && sourceKey === sourceKeyRef.current) {
        pendingRestoreRef.current = null; setRestoring(false);
        if (!bytesVerified) restoreCallbacksRef.current.onFreshVerificationStateChange?.("unavailable");
        setRestoreFailure(error instanceof Error ? error.message : "The exact source could not be restored.");
      }
      throw error;
    }
  };

  useEffect(() => {
    scaleCallbackRef.current = onScaleBarChange;
  }, [onScaleBarChange]);

  useEffect(() => {
    bindingCallbackRef.current = onViewportBindingChange;
  }, [onViewportBindingChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (restoring || restoreFailure) {
      actionsRef.current = null; captureRef.current = null; exportPngRef.current = null; refreshViewRef.current = null;
      scaleCallbackRef.current?.(null); bindingCallbackRef.current?.(null);
      return;
    }
    const geometry = runtimeGeometry;
    let active = true;
    if (!viewportInstanceIdRef.current) {
      viewportInstanceIdRef.current = `source-local-runtime-${++viewportInstanceSequence}`;
    }
    const viewportInstanceId = viewportInstanceIdRef.current;
    let viewportRevision = ++viewportRevisionRef.current;
    const runtimeBinding = (): MorphologyViewportRuntimeBinding => ({
      neuronId: record.neuronId,
      geometrySha256: record.geometry.sha256 ?? "",
      effectiveRenderMode: effectiveMode,
      viewportInstanceId,
      viewportRevision,
    });
    const publishBinding = () => bindingCallbackRef.current?.(runtimeBinding());
    const failScene = (message: string) => {
      captureRef.current = null; exportPngRef.current = null; refreshViewRef.current = null; setViewSignature("");
      bindingCallbackRef.current?.(null);
      pendingRestoreRef.current?.reject(new Error(message)); pendingRestoreRef.current = null;
      setWebGLFailure(message);
    };
    const clearScale = () => {
      if (!active) return;
      setScaleBar((current) => current === null ? current : null);
      scaleCallbackRef.current?.(null);
    };
    publishBinding();
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) {
      queueMicrotask(() => {
        clearScale();
        failScene("WebGL2 is unavailable; exact metadata and 2D source projections remain available.");
      });
      return () => { active = false; };
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => {
        clearScale();
        failScene("The 3D renderer could not be initialized; no substitute geometry was rendered.");
      });
      return () => { active = false; };
    }
    queueMicrotask(() => {
      if (active) setWebGLFailure("");
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-describedby", descriptionId);
    renderer.domElement.setAttribute(
      "aria-label",
      effectiveMode === "radius"
        ? `NeuroMorpho ${record.neuronId} source-local morphology. Coordinates, topology and source-authorized radii are observed inputs; thickness is a deterministic tapered-frustum derivative, not a membrane. Independent viewport, zero atlas registrations.`
        : `NeuroMorpho ${record.neuronId} observed source-local SWC centerlines. Constant stroke width is a viewer aid. Independent viewport, zero atlas registrations.`,
    );
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1715);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x20302a, 1.25));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(7, 9, 10);
    scene.add(keyLight);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableRotate = !isTwoDimensional;

    const root = effectiveMode === "radius"
      ? createRadiusDerivedSurface(geometry, { colors: MORPHOLOGY_TYPE_COLORS, opacity: 0.84 })
      : createObservedSwcCenterlines(geometry, { colors: MORPHOLOGY_TYPE_COLORS, opacity: 0.88 });
    if (effectiveMode === "radius") {
      root.add(createObservedSwcCenterlines(geometry, { colors: MORPHOLOGY_TYPE_COLORS, opacity: 0.2, renderOrder: 3 }));
    }
    if (showTopologyLandmarks) {
      root.add(createObservedTopologyLandmarks(geometry));
    }
    scene.add(root);
    const bounds = new THREE.Box3().setFromObject(root);
    const boundsSphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Number.isFinite(boundsSphere.radius) && boundsSphere.radius > 0 ? boundsSphere.radius : 3;
    const axes = new THREE.AxesHelper(Math.max(radius * 0.28, 0.45));
    axes.position.set(0, 0, 0);
    scene.add(axes);
    controls.minDistance = Math.max(radius * 0.08, 0.001);
    controls.maxDistance = Math.max(radius * 64, 100);

    let resizeFrame = 0;
    let animationFrame = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    let userAdjustedCamera = false;
    let initialPosition = new THREE.Vector3();
    const initialTarget = boundsSphere.center.clone();

    const updateClippingPlanes = () => {
      const distanceToGeometryCenter = camera.position.distanceTo(boundsSphere.center);
      const nextNear = Math.max(Math.min(radius / 1000, distanceToGeometryCenter / 1000), 0.001);
      const nextFar = Math.max(distanceToGeometryCenter + radius * 2, radius * 4, 100);
      if (camera.near !== nextNear || camera.far !== nextFar) {
        camera.near = nextNear;
        camera.far = nextFar;
        camera.updateProjectionMatrix();
      }
    };

    const updateScale = () => {
      if (!active) return;
      try {
        const viewportCssWidth = container.clientWidth;
        const viewportCssHeight = container.clientHeight;
        const targetDistance = camera.position.distanceTo(controls.target);
        updateClippingPlanes();
        const computed = computeMorphologyViewportScaleBar({
          cameraTargetDistanceViewerUnit: targetDistance,
          effectiveVerticalFovDegrees: camera.getEffectiveFOV(),
          viewportHeightCssPixel: viewportCssHeight,
          scaleViewerUnitPerMicrometre: geometry.displayTransform.scaleViewerUnitPerMicrometre,
        });
        const next: MorphologyViewportScaleReceipt = {
          algorithmId: "camera_target_plane_source_local_scale_v1",
          measurementPlane: "camera_target_depth",
          sourceCoordinateUnit: "micrometre_reported_by_source",
          lengthMicrometre: computed.lengthMicrometre,
          pixelLength: computed.pixelLength,
          micrometrePerCssPixel: computed.micrometrePerCssPixel,
          targetPixelLength: computed.targetPixelLength,
          sourceLocalOnly: true,
          sharedAcrossViewports: false,
          apparentObjectSizeComparable: false,
          neuronId: record.neuronId,
          geometrySha256: record.geometry.sha256 ?? "",
          viewportCssWidth,
          viewportCssHeight,
          effectiveVerticalFovDegrees: camera.getEffectiveFOV(),
          cameraTargetDistanceViewerUnit: targetDistance,
          cameraPositionViewerUnit: camera.position.toArray() as [number, number, number],
          orbitTargetViewerUnit: controls.target.toArray() as [number, number, number],
          scaleViewerUnitPerMicrometre: geometry.displayTransform.scaleViewerUnitPerMicrometre,
          dimensionality: record.normalizedMetadata.dimensionality,
          sourcePlaneLocked: isTwoDimensional,
          effectiveRenderMode: effectiveMode,
          viewportInstanceId,
          viewportRevision,
        };
        setScaleBar((current) => sameScaleReceipt(current, next) ? current : next);
        scaleCallbackRef.current?.(next);
        refreshViewRef.current?.();
      } catch {
        clearScale();
      }
    };

    const fitCamera = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      const distance = computePerspectiveSphereFitDistance({
        radiusViewerUnit: radius,
        verticalFovDegrees: camera.getEffectiveFOV(),
        aspect: camera.aspect,
      });
      const direction = isTwoDimensional
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(1.45, 0.9, 1.65).normalize();
      controls.target.copy(initialTarget);
      camera.position.copy(initialTarget).addScaledVector(direction, distance);
      controls.update();
      initialPosition = camera.position.clone();
      updateScale();
    };

    const moveAlongView = (factor: number) => {
      const offset = camera.position.clone().sub(controls.target);
      const nextDistance = Math.min(
        controls.maxDistance,
        Math.max(controls.minDistance, offset.length() * factor),
      );
      camera.position.copy(controls.target).add(offset.setLength(nextDistance));
      camera.updateProjectionMatrix();
      controls.update();
      userAdjustedCamera = true;
      updateScale();
    };
    actionsRef.current = {
      reset: () => {
        camera.position.copy(initialPosition);
        controls.target.copy(initialTarget);
        controls.update();
        userAdjustedCamera = false;
        updateScale();
      },
      zoomIn: () => moveAlongView(0.8),
      zoomOut: () => moveAlongView(1.25),
    };

    const inspection = attachSwcNeuriteInspection({
      geometry, scene, camera, controls, canvas: renderer.domElement, contextRoot: root,
      sourceRadiusAvailable, isTwoDimensional,
      onSelection: (selection: NeuriteInspectionSelection | null) => {
        inspectionSelectionRef.current = selection;
        setInspectionSelection(selection);
        refreshViewRef.current?.();
      },
      onCameraChange: () => { userAdjustedCamera = true; updateScale(); },
    });
    inspectionRef.current = inspection;
    const describeView = (): MorphologySourceView => {
      const selection = inspectionSelectionRef.current;
      const context = renderer.getContext().getContextAttributes();
      const drawingBuffer = renderer.getDrawingBufferSize(new THREE.Vector2());
      return {
        status: "rendered",
        runtimeBinding: { neuronId: record.neuronId, geometrySha256: record.geometry.sha256 ?? "", viewportInstanceId, viewportRevision },
        requestedMode: requestedModeRef.current, actualMode: effectiveMode, sourcePlaneLocked: isTwoDimensional,
        camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(),
          fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset },
        viewport: { cssWidth: container.clientWidth, cssHeight: container.clientHeight, drawingBufferWidth: drawingBuffer.x, drawingBufferHeight: drawingBuffer.y, pixelRatio: renderer.getPixelRatio() },
        renderer: { engine: "THREE", revision: THREE.REVISION, type: "WebGLRenderer", outputColorSpace: renderer.outputColorSpace, toneMapping: renderer.toneMapping, alpha: context?.alpha === true, antialias: context?.antialias === true },
        clipping: { globalPlanes: renderer.clippingPlanes.map(plane => ({ normal: plane.normal.toArray(), constant: plane.constant })), localClippingEnabled: renderer.localClippingEnabled },
        layers: { sourceGeometryVisible: root.visible, centerlinesVisible: root.visible, radiusSurfaceVisible: root.visible && effectiveMode === "radius", topologyLandmarksVisible: showTopologyLandmarks, sourceAxesVisible: axes.visible },
        inspection: { selectedNodeId: selection?.geometryIdentity === geometry ? selection.nodeId : null, contextDimmed: selection?.geometryIdentity === geometry ? selection.dimmed : false, overlayAuthority: "exact_swc_parent_path_and_descendant_edges" },
        sceneBounds: { center: boundsSphere.center.toArray(), radius }, displayTransform: geometry.displayTransform,
      };
    };
    let lastViewValue = "";
    refreshViewRef.current = () => {
      if (!active || !replayRecord || lastWidth === 0 || lastHeight === 0) return;
      const view = describeView();
      const value = JSON.stringify(view);
      if (value === lastViewValue) return;
      lastViewValue = value;
      setViewSignature(`${++viewMutationRevisionRef.current}:${value}`);
    };
    captureRef.current = replayRecord ? () => {
      if (!active || renderer.getContext().isContextLost() || lastWidth === 0 || lastHeight === 0) throw new Error("The current source viewport is unavailable.");
      updateClippingPlanes(); renderer.render(scene, camera);
      return captureMorphologySourceView(replayRecord, geometry, describeView(), THREE.REVISION);
    } : null;
    const capturePngView = captureRef.current;
    exportPngRef.current = capturePngView ? async document => {
      const options = { profile: "source_local" as const, record: replayRecord!, geometry, rendererRevision: THREE.REVISION };
      const saved = structuredClone(document);
      const captions = morphologyPngCaptions(saved, options);
      const assertCurrent = () => {
        if (!active || captureRef.current !== capturePngView || renderer.getContext().isContextLost()) throw new Error("The source viewport changed before PNG export completed.");
        assertMorphologyPngCurrent(saved, capturePngView());
      };
      return encodeSourceViewPng(renderer.domElement, captions, { pixelRatio: renderer.getPixelRatio(), assertCurrent,
        appendReceipt: blob => appendMorphologyExportPng(blob, saved, options) });
    } : null;
    // Retain a selection across display-mode changes, never across source geometry.
    const retainedInspection = inspectionSelectionRef.current;
    queueMicrotask(() => {
      if (inspectionRef.current !== inspection) return;
      inspection.restore(retainedInspection);
    });

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      if (width === lastWidth && height === lastHeight) return;
      const isLayoutRevision = lastWidth > 0 && lastHeight > 0;
      lastWidth = width;
      lastHeight = height;
      if (isLayoutRevision) {
        clearScale();
        viewportRevision = ++viewportRevisionRef.current;
        publishBinding();
      }
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (!userAdjustedCamera) fitCamera();
        else updateScale();
        const pending = pendingRestoreRef.current;
        if (pending && pending.sourceKey === sourceKey && pending.operation === restoreOperationRef.current && replayRecord) {
          try {
            const saved = validateMorphologySourceViewReplay(replayRecord, geometry, pending.document, THREE.REVISION);
            assertMorphologySourceViewSceneBounds(pending.document, { center: boundsSphere.center.toArray(), radius });
            const damping = controls.enableDamping; controls.enableDamping = false;
            controls.update();
            camera.position.fromArray(saved.camera.position); camera.up.fromArray(saved.camera.up);
            controls.target.fromArray(saved.camera.target);
            camera.fov = saved.camera.fov; camera.zoom = saved.camera.zoom;
            camera.filmGauge = saved.camera.filmGauge; camera.filmOffset = saved.camera.filmOffset;
            camera.aspect = width / height;
            controls.update(); camera.lookAt(controls.target);
            controls.enableDamping = damping;
            camera.updateProjectionMatrix(); userAdjustedCamera = true;
            if (saved.inspection.selectedNodeId === null) inspection.clear();
            else inspection.restore({ geometryIdentity: geometry, nodeId: saved.inspection.selectedNodeId, dimmed: saved.inspection.contextDimmed });
            updateScale(); renderer.render(scene, camera);
            const applied = captureMorphologySourceView(replayRecord, geometry, describeView(), THREE.REVISION);
            assertMorphologySourceViewAppliedPose(pending.document, applied.view);
            pendingRestoreRef.current = null; pending.resolve();
          } catch (error) {
            pendingRestoreRef.current = null;
            pending.reject(error instanceof Error ? error : new Error("The source view could not be applied to the rebuilt scene."));
          }
        }
        renderer.render(scene, camera);
        refreshViewRef.current?.();
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const onControlsStart = () => { userAdjustedCamera = true; };
    controls.addEventListener("start", onControlsStart);
    controls.addEventListener("change", updateScale);
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();
    const onContextLost = (event: Event) => {
      event.preventDefault();
      clearScale();
      failScene("The WebGL context was lost; no substitute geometry was rendered.");
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    return () => {
      active = false;
      actionsRef.current = null;
      captureRef.current = null; exportPngRef.current = null; refreshViewRef.current = null;
      setViewSignature("");
      scaleCallbackRef.current?.(null);
      bindingCallbackRef.current?.(null);
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      controls.removeEventListener("start", onControlsStart);
      controls.removeEventListener("change", updateScale);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      inspection.dispose();
      inspectionRef.current = null;
      controls.dispose();
      root.traverse((object) => {
        const drawable = object as THREE.Mesh | THREE.LineSegments;
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
    };
  }, [descriptionId, effectiveMode, runtimeGeometry, isTwoDimensional, record.geometry.sha256, record.neuronId, record.normalizedMetadata.dimensionality, showTopologyLandmarks, sourceRadiusAvailable, restoring, restoreFailure, replayRecord, sourceKey]);

  return (
    <><div className={`morphology-source-local-viewport ${className}`} ref={containerRef}>
      {!webGLFailure && !restoring && !restoreFailure && <MorphologyNeuriteInspector controllerRef={inspectionRef} selection={inspectionSelection} geometry={runtimeGeometry}
        branchpointCount={topologyLandmarks.branchpoints.length} terminalCount={topologyLandmarks.terminals.length} />}
      <div className="morphology-viewport-controls" aria-label={`View controls for NeuroMorpho ${record.neuronId}`}>
        <button type="button" onClick={() => actionsRef.current?.zoomIn()}>Zoom in</button>
        <button type="button" onClick={() => actionsRef.current?.zoomOut()}>Zoom out</button>
        <button type="button" onClick={() => actionsRef.current?.reset()}>Reset</button>
        <button type="button" className={showTopologyLandmarks ? "active" : ""} aria-pressed={showTopologyLandmarks} onClick={() => setShowTopologyLandmarks((visible) => !visible)}>Topology landmarks</button>
      </div>
      <div className="morphology-topology-legend" role="note" aria-label={`Exact topology landmark counts for NeuroMorpho ${record.neuronId}`}>
        <span><i className="root" />root node <b>1</b></span>
        <span><i className="type-one" />type-1 samples <b>{topologyLandmarks.standardizedType1Samples.length}</b></span>
        <span><i className="branch" />branchpoints <b>{topologyLandmarks.branchpoints.length}</b></span>
        <span><i className="terminal" />terminals <b>{topologyLandmarks.terminals.length}</b></span>
        <small>Exact SWC parent-link derivatives · root is not a soma contour · terminals are not boutons</small>
      </div>
      <p className="morphology-source-axes-label">SOURCE AXES · NOT ANATOMICAL AXES</p>
      {scaleBar && !webGLFailure && !restoring && !restoreFailure && (
        <div className="morphology-source-scale" role="note" aria-label={`${formatMorphologyScaleLength(scaleBar.lengthMicrometre)} in source coordinates at the camera target plane; not a shared scale`}>
          <b>{formatMorphologyScaleLength(scaleBar.lengthMicrometre)}</b>
          <i style={{ width: `${scaleBar.pixelLength}px` }} />
          <span>SOURCE COORD · TARGET PLANE</span>
        </div>
      )}
      <p id={descriptionId} className="morphology-viewport-description">
        {isTwoDimensional
          ? "Source-labelled 2D record; source z values are preserved without inference or extrusion. Rotation is locked to the source XY view. Scale uses source-coordinate micrometres at the camera-target plane."
          : "Perspective scale is evaluated at the orbit-target plane and apparent scale varies with depth."}
        {" "}SWC local axes are not anatomical axes. This viewport has no shared scale or atlas registration.
      </p>
      {webGLFailure && <p className="morphology-viewport-failure" role="status">{webGLFailure}</p>}
      {restoring && <p className="morphology-viewport-failure" role="status">Rechecking this exact source file…</p>}
      {restoreFailure && <p className="morphology-viewport-failure" role="alert">{restoreFailure}</p>}
    </div>
    {replayRecord && <MorphologySourceViewControls neuronId={record.neuronId} signature={viewSignature} available={Boolean(viewSignature) && !restoring && !restoreFailure && !webGLFailure} restoring={restoring}
      capture={() => { if (!captureRef.current) throw new Error("The source view is not ready."); return captureRef.current(); }} restore={restoreSourceView}
      pngFilename={`neuromorpho-${record.neuronId}-${"sourceObject" in replayRecord ? "universe" : "comparison"}-source-view.png`} exportPng={document => { if (!exportPngRef.current) throw new Error("The current source viewport is unavailable."); return exportPngRef.current(document); }} />}
    </>
  );
}
