"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MorphologyNeuriteInspector, { type NeuriteInspectionController, type NeuriteInspectionSelection } from "./MorphologyNeuriteInspector";
import { attachSwcNeuriteInspection } from "./morphology-neurite-inspection.js";
import {
  type MorphologyCensusRecord,
  type MorphologyGeometryPayload,
  MORPHOLOGY_TYPE_COLORS,
  morphologyHasDiameter,
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
}: {
  record: MorphologyCensusRecord;
  geometry: MorphologyGeometryPayload;
  mode: MorphologyRenderMode;
  className?: string;
  onScaleBarChange?: (receipt: MorphologyViewportScaleReceipt | null) => void;
  onViewportBindingChange?: (binding: MorphologyViewportRuntimeBinding | null) => void;
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
  const effectiveMode = mode === "radius" && morphologyHasDiameter(record) ? "radius" : "skeleton";
  const isTwoDimensional = record.normalizedMetadata.dimensionality === "2D";
  const sourceRadiusAvailable = morphologyHasDiameter(record);
  const topologyLandmarks = extractObservedTopologyLandmarks(geometry);

  useEffect(() => {
    scaleCallbackRef.current = onScaleBarChange;
  }, [onScaleBarChange]);

  useEffect(() => {
    bindingCallbackRef.current = onViewportBindingChange;
  }, [onViewportBindingChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
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
        setWebGLFailure("WebGL2 is unavailable; exact metadata and 2D source projections remain available.");
      });
      return () => { active = false; };
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => {
        clearScale();
        setWebGLFailure("The 3D renderer could not be initialized; no substitute geometry was rendered.");
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
      },
      onCameraChange: () => { userAdjustedCamera = true; updateScale(); },
    });
    inspectionRef.current = inspection;
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
      setWebGLFailure("The WebGL context was lost; no substitute geometry was rendered.");
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    return () => {
      active = false;
      actionsRef.current = null;
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
  }, [descriptionId, effectiveMode, geometry, isTwoDimensional, record.geometry.sha256, record.neuronId, record.normalizedMetadata.dimensionality, showTopologyLandmarks, sourceRadiusAvailable]);

  return (
    <div className={`morphology-source-local-viewport ${className}`} ref={containerRef}>
      {!webGLFailure && <MorphologyNeuriteInspector controllerRef={inspectionRef} selection={inspectionSelection} geometry={geometry}
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
      {scaleBar && !webGLFailure && (
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
    </div>
  );
}
