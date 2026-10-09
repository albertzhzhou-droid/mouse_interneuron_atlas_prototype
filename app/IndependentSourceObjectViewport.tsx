"use client";

import { useEffect, useRef, useState } from "react";
import type { IndependentObject, IndependentPayload, IndependentViewState } from "./independent-source-workspace-types";

type Props = {
  record: IndependentObject; payload: IndependentPayload; loadMilliseconds: number;
  verificationRevision: number; restoredView: IndependentViewState | null;
  onViewState: (state: IndependentViewState, canvas?: HTMLCanvasElement) => void;
  onViewInvalidated?: () => void;
  onImageExport?: () => void;
};
type SourceContour = { id: string; points: number[][]; interpretedClosed: boolean };

export default function IndependentSourceObjectViewport({ record, payload, loadMilliseconds, verificationRevision, restoredView, onViewState, onViewInvalidated, onImageExport }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hiddenLayers, setHiddenLayers] = useState<string[]>(() => restoredView?.layers.filter((layer) => !layer.requested).map((layer) => layer.id) ?? []);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [resetRevision, setResetRevision] = useState(0);
  const [viewReady, setViewReady] = useState(false);
  const renderRequest = useRef(0);
  const invalidateView = () => {
    renderRequest.current += 1;
    setViewReady(false);
    onViewInvalidated?.();
  };
  const previousView = useRef<{ resetRevision: number; camera: IndependentViewState["camera"] }>({ resetRevision: 0, camera: restoredView?.camera ?? null });
  const layerIds = [...payload.meshes.map((mesh) => mesh.componentId), ...(payload.contours.length ? ["source-contour-traces"] : []), ...(payload.edges.length ? ["source-swc-centerline"] : []), ...(payload.points.length ? ["source-points"] : [])];
  const signature = hiddenLayers.toSorted().join("|");

  useEffect(() => {
    let active = true;
    const requestRevision = renderRequest.current;
    const currentRequest = () => active && requestRevision === renderRequest.current;
    let dispose: (() => void) | undefined;
    const started = performance.now();
    const textState = (status: "text-only" | "link-only"): IndependentViewState => ({
      key: record.key, verificationRevision, revision: `${record.key}:${verificationRevision}:${signature}:${resetRevision}`, status, representation: payload.kind,
      layers: layerIds.map((id) => ({ id, requested: !hiddenLayers.includes(id), actual: false })), camera: null,
      displayTransform: null, renderer: { name: "text", version: null, width: 0, height: 0 },
      clipping: null,
      loadMilliseconds, renderMilliseconds: performance.now() - started,
    });
    if (!layerIds.length) { if (currentRequest()) onViewState(textState("link-only")); return () => { active = false; }; }
    void Promise.all([import("three"), import("three/examples/jsm/controls/OrbitControls.js")]).then(([THREE, { OrbitControls }]) => {
      if (!currentRequest() || !canvas.current || !container.current) return;
      const renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const scene = new THREE.Scene(); scene.background = new THREE.Color("#f5f8fb");
      // Source-owned mesh accessors return copies. Read each buffer once for
      // this render generation rather than allocating a copy for every vertex.
      const meshes = payload.meshes.map(mesh => {
        const { positions, triangles, ...metadata } = mesh;
        return { ...metadata, positions, triangles };
      });
      const allPositions: number[][] = [
        ...payload.edges.flat(), ...payload.points.map((point) => point.position),
        ...(payload.contours as SourceContour[]).flatMap((contour) => contour.points),
      ];
      let minimum = [Infinity, Infinity, Infinity], maximum = [-Infinity, -Infinity, -Infinity];
      const include = (position: number[]) => {
        minimum = minimum.map((value, axis) => Math.min(value, position[axis] ?? 0));
        maximum = maximum.map((value, axis) => Math.max(value, position[axis] ?? 0));
      };
      allPositions.forEach(include);
      meshes.forEach((mesh) => {
        for (let i = 0; i < mesh.positions.length; i += 3) for (let axis = 0; axis < 3; axis += 1) {
          minimum[axis] = Math.min(minimum[axis], mesh.positions[i + axis]); maximum[axis] = Math.max(maximum[axis], mesh.positions[i + axis]);
        }
      });
      if (minimum.some((value) => !Number.isFinite(value)) || maximum.some((value) => !Number.isFinite(value))) {
        renderer.dispose(); throw new Error("Verified object has no finite geometry extent");
      }
      const center = minimum.map((value, axis) => (value + maximum[axis]) / 2);
      const extent = Math.max(...maximum.map((value, axis) => value - minimum[axis]), Number.EPSILON);
      const scale = 200 / extent;
      const display = (position: number[]) => new THREE.Vector3(...center.map((value, axis) => ((position[axis] ?? 0) - value) * scale) as [number, number, number]);
      const groupByLayer = new Map<string, InstanceType<typeof THREE.Group>>();
      const group = (id: string) => {
        let result = groupByLayer.get(id);
        if (!result) { result = new THREE.Group(); result.visible = !hiddenLayers.includes(id); groupByLayer.set(id, result); scene.add(result); }
        return result;
      };
      meshes.forEach((mesh) => {
        const positions = new Float32Array(mesh.positions.length);
        for (let i = 0; i < positions.length; i += 3) for (let axis = 0; axis < 3; axis += 1) positions[i + axis] = (mesh.positions[i + axis] - center[axis]) * scale;
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(mesh.triangles, 1));
        const nucleus = mesh.componentId.includes("nucleus");
        group(mesh.componentId).add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: nucleus ? "#b44b74" : "#146c75", side: THREE.DoubleSide, transparent: true, opacity: nucleus ? 0.9 : 0.32, depthWrite: nucleus })));
      });
      if (payload.edges.length) {
        const positions = new Float32Array(payload.edges.length * 6);
        payload.edges.forEach(([a, b], index) => positions.set([...display(a).toArray(), ...display(b).toArray()], index * 6));
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        group("source-swc-centerline").add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#146c75" })));
      }
      if (payload.points.length) {
        const positions = payload.points.flatMap((point) => display(point.position).toArray());
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        group("source-points").add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: "#b44b74", size: payload.kind === "palm_detection" ? 7 : 12, sizeAttenuation: false })));
      }
      (payload.contours as SourceContour[]).forEach((contour) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(contour.points.map(display));
        const material = new THREE.LineBasicMaterial({ color: "#146c75" });
        const trace = contour.interpretedClosed ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
        trace.name = contour.id; group("source-contour-traces").add(trace);
      });
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 4000);
      camera.position.set(230, 190, 300); camera.lookAt(0, 0, 0);
      if (record.coordinateFrame.dimensions === 2) { camera.position.set(0, 0, 390); camera.lookAt(0, 0, 0); }
      const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = false;
      if (record.coordinateFrame.dimensions === 2) controls.enableRotate = false;
      const savedCamera = previousView.current.resetRevision === resetRevision ? previousView.current.camera : null;
      if (savedCamera) {
        camera.position.fromArray(savedCamera.position); camera.up.fromArray(savedCamera.up); controls.target.fromArray(savedCamera.target);
        camera.fov = savedCamera.fov; camera.near = savedCamera.near; camera.far = savedCamera.far; camera.updateProjectionMatrix();
      }
      controls.update();
      let firstRenderMilliseconds: number | null = null;
      let renderedSequence = 0;
      const publish = () => {
        if (!currentRequest()) return;
        renderer.render(scene, camera);
        firstRenderMilliseconds ??= performance.now() - started;
        const cameraState = { position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), projection: "perspective" as const, fov: camera.fov, near: camera.near, far: camera.far };
        previousView.current = { resetRevision, camera: cameraState };
        setViewReady(true);
        onViewState({
          key: record.key, verificationRevision, revision: `${record.key}:${verificationRevision}:${signature}:${resetRevision}:${++renderedSequence}`, status: "rendered", representation: payload.kind,
          layers: layerIds.map((id) => ({ id, requested: !hiddenLayers.includes(id), actual: Boolean(groupByLayer.get(id)?.visible) })),
          camera: cameraState,
          displayTransform: { centerNative: center, scale, coordinateFrame: record.coordinateFrame },
          renderer: { name: "three", version: THREE.REVISION, width: canvas.current?.width ?? 0, height: canvas.current?.height ?? 0 },
          clipping: { globalPlanes: renderer.clippingPlanes.map((plane) => ({ normal: plane.normal.toArray(), constant: plane.constant })), localClippingEnabled: renderer.localClippingEnabled },
          loadMilliseconds, renderMilliseconds: firstRenderMilliseconds,
        }, canvas.current ?? undefined);
      };
      let previousWidth = 0;
      let resizeFrame = 0;
      const resize = () => {
        if (!container.current) return;
        const width = Math.max(1, container.current.clientWidth), height = Math.max(260, Math.min(440, width * 0.65));
        if (width === previousWidth) return;
        previousWidth = width;
        renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); publish();
      };
      const observer = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(resize); }); observer.observe(container.current);
      controls.addEventListener("change", publish); resize();
      dispose = () => {
        observer.disconnect(); cancelAnimationFrame(resizeFrame); controls.dispose();
        scene.traverse((object) => {
          const drawable = object as InstanceType<typeof THREE.Mesh>;
          drawable.geometry?.dispose();
          if (drawable.material) (Array.isArray(drawable.material) ? drawable.material : [drawable.material]).forEach((material) => material.dispose());
        });
        renderer.dispose();
      };
    }).catch((error: unknown) => {
      if (!currentRequest()) return;
      setRenderError(error instanceof Error ? error.message : "The graphics renderer is unavailable."); onViewState(textState("text-only"));
    });
    return () => { active = false; dispose?.(); };
    // Layer identity derives from this immutable checksum-verified payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, payload, signature, resetRevision, loadMilliseconds, verificationRevision, onViewState]);

  return <div className="independent-object-viewport">
    {layerIds.length > 0 && <fieldset><legend>Source geometry layers</legend>{layerIds.map((id) => <label key={id}><input type="checkbox" checked={!hiddenLayers.includes(id)} onChange={(event) => { invalidateView(); setHiddenLayers((current) => event.target.checked ? current.filter((value) => value !== id) : [...current, id]); }} />{id.replaceAll("-", " ")}</label>)}</fieldset>}
    {renderError && <p role="alert">{renderError} The verified object and its evidence remain available as text; no replacement geometry is shown.</p>}
    {layerIds.length > 0 && !renderError && <div ref={container}><canvas ref={canvas} role="img" aria-label={`${record.title}. ${record.viewer.kind}; source-local ${record.coordinateFrame.dimensions}D geometry. Exact counts and coordinate frame are listed below.`} /></div>}
    {layerIds.length > 0 && <div className="independent-object-actions"><button type="button" onClick={() => { invalidateView(); setResetRevision((value) => value + 1); }}>Reset view</button><button type="button" onClick={() => { if (!canvas.current || renderError || !viewReady) return; if (onImageExport) { onImageExport(); return; } const link = document.createElement("a"); link.download = `source-object-${record.sourceId}.png`; link.href = canvas.current.toDataURL("image/png"); document.body.appendChild(link); link.click(); link.remove(); }} disabled={Boolean(renderError) || !viewReady}>Save current image</button></div>}
    {!layerIds.length && <p>This exact source row has no admitted display asset. <a href={record.sourceUrl} target="_blank" rel="noreferrer">Open its source row ↗</a></p>}
    <p className="independent-object-boundary">{payload.kind === "link_only" ? "This locator identifies a source dataset row. No image, mask or geometry was downloaded or admitted." : payload.contours.length ? `Source contour line traces; source closure semantics are preserved.${payload.meshes.length ? " The DER interpolated open shell is a separate display layer with no observed membrane, volume or internal anatomy." : " No membrane or internal geometry is created."}` : record.coordinateFrame.dimensions === 2 ? "Source-native 2D coordinates. No depth, physical calibration or cell identity is inferred." : "Verified source geometry only. Points remain points; segmentation surfaces do not become membrane measurements."}</p>
  </div>;
}
