"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import contract from "../data/ronzano-premotor-position-reference-0.1.json";
import { RONZANO_POSITION_FRAMES, RONZANO_POSITION_MUSCLES, RONZANO_POSITION_SEGMENTS, positionGroupsFor } from "./ronzano-premotor-position-data.js";
import { RONZANO_CAMERA_PRESETS, attestRonzanoRenderedView, assertRonzanoSourceViewApplied, browseRonzanoRow, captureRonzanoSourceView,
  computeRonzanoSourceCameraFit, createRonzanoPositionObject, createRonzanoPositionRenderer, bindRonzanoPositionViewport, renderRonzanoPositionViewport, disposeRonzanoPositionRenderer, disposeRonzanoPositionObject, readVerifiedRonzanoPositions,
  ronzanoPositionPayload, ronzanoSelectedRow, sameRonzanoCameraForCapture, validateRonzanoSourceViewReplay,
  type RonzanoCamera, type RonzanoCameraPreset, type RonzanoFrame, type RonzanoGroup, type RonzanoPayload, type RonzanoRequest,
  type RonzanoSourceToken, type RonzanoViewDocument } from "./ronzano-premotor-position-source-view.js";

type PositionFrame = RonzanoFrame;
type PositionMuscle = RonzanoRequest["muscle"];
type PositionSegment = RonzanoRequest["segment"];
type CameraPreset = RonzanoCameraPreset;
type PositionGroup = RonzanoGroup;
type LoadState = { status: "loading" | "error"; payload: null; verifiedSha256: null; token: null; error: string }
  | { status: "ready"; payload: RonzanoPayload; verifiedSha256: string; token: RonzanoSourceToken; error: "" };
type Context = { token: RonzanoSourceToken; request: RonzanoRequest; renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  controls: OrbitControls; root: THREE.Group; axes: THREE.AxesHelper; selectedRowId: string | null; defaultCamera: boolean; sceneInstanceId: string; revision: number; failed: boolean; applyingCamera: boolean };
type PendingRestore = { document: RonzanoViewDocument; previousToken: RonzanoSourceToken; controller: AbortController; resolve: () => void; reject: (error: Error) => void };
const CAMERA_PRESETS = RONZANO_CAMERA_PRESETS;
const MUSCLE_LABELS = Object.freeze({ LG: "LG · lateral gastrocnemius · ankle extensor tracing group", TA: "TA · tibialis anterior · ankle flexor tracing group" });
type InitialParams = Record<string, string | string[] | undefined>;
function initialPositionParams(values: InitialParams) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(values)) { const first = Array.isArray(value) ? value[0] : value; if (first !== undefined) params.set(key, first); } return params; }
let sceneInstanceSequence = 0;
const initialRequest: RonzanoRequest = { frame: "raw", muscle: "all", segment: "all", cameraPreset: "three_quarter", pointSizePixels: 3, layers: { points: true, axes: true } };
function readable(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function validParam<T extends string>(value: string | null, options: readonly T[], fallback: T): T { return options.includes(value as T) ? value as T : fallback; }
function setUrlValue(key: string, value: string, fallback: string) { const url = new URL(window.location.href); if (value === fallback) url.searchParams.delete(key); else url.searchParams.set(key, value); window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`); }
function formattedCoordinate(value: number) { return value.toLocaleString("en-CA", { maximumFractionDigits: 8, useGrouping: false }); }
function downloadJson(fileName: string, value: unknown) { const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }), url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0); }
function actualCamera(context: Context): RonzanoCamera { const { camera, controls } = context; return { kind: "PerspectiveCamera", position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset }; }
function samePreparedView(context: Context, receipt: RonzanoViewDocument) { const rectangle = context.renderer.domElement.getBoundingClientRect(), buffer = context.renderer.getDrawingBufferSize(new THREE.Vector2()), saved = receipt.view.viewport;
  return !context.failed && sameRonzanoCameraForCapture(actualCamera(context), receipt.view.camera) && JSON.stringify(context.request) === JSON.stringify(receipt.view.request)
    && context.selectedRowId === (receipt.view.selectedRow?.id ?? null) && context.token.verificationSequence === receipt.sourceVerification.verificationSequence
    && context.sceneInstanceId === receipt.view.runtimeBinding.sceneInstanceId && context.root.visible === receipt.view.layers.points && context.axes.visible === receipt.view.layers.axes
    && Math.round(rectangle.width) === saved.cssWidth && Math.round(rectangle.height) === saved.cssHeight && buffer.x === saved.drawingBufferWidth && buffer.y === saved.drawingBufferHeight
    && context.renderer.getPixelRatio() === saved.pixelRatio;
}
function applyCamera(context: Context, pose: { position: number[]; target: number[]; up: number[]; near: number; far: number }) { const { camera, controls } = context, damping = controls.enableDamping; context.applyingCamera = true; controls.enableDamping = false; controls.update(); camera.position.fromArray(pose.position); camera.up.fromArray(pose.up); controls.target.fromArray(pose.target); camera.near = pose.near; camera.far = pose.far; camera.updateProjectionMatrix(); controls.update(); controls.enableDamping = damping; camera.updateMatrixWorld(true); context.applyingCamera = false; }
function fit(context: Context, preserveDirection: boolean) { if (context.failed || !context.root.children.length) return; preserveDirection = preserveDirection && context.camera.position.distanceTo(context.controls.target) > 0; const bounds = new THREE.Box3().setFromObject(context.root);
  const pose = computeRonzanoSourceCameraFit({ bounds: { minimum: bounds.min.toArray(), maximum: bounds.max.toArray() }, aspect: context.camera.aspect, preset: context.request.cameraPreset,
    direction: preserveDirection ? context.camera.position.clone().sub(context.controls.target).toArray() : undefined, up: preserveDirection ? context.camera.up.toArray() : undefined });
  applyCamera(context, pose); context.defaultCamera = true; }

export default function RonzanoPremotorPositionViewer({ onNotice, initialParams = {} }: { onNotice?: (notice: string) => void; initialParams?: InitialParams }) {
  const canvasHostRef = useRef<HTMLDivElement>(null), contextRef = useRef<Context | null>(null), pendingRestoreRef = useRef<PendingRestore | null>(null);
  const paramsRef = useRef(initialParams), reloadControllerRef = useRef<AbortController | null>(null);
  const noticeRef = useRef(onNotice), mountedRef = useRef(true), initialRowRef = useRef<string | null | undefined>(undefined);
  const preparedRef = useRef<RonzanoViewDocument | null>(null);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading", payload: null, verifiedSha256: null, token: null, error: "" });
  const [request, setRequest] = useState<RonzanoRequest>(() => { const params = initialPositionParams(initialParams); return { ...initialRequest,
    frame: validParam(params.get("positionFrame"), RONZANO_POSITION_FRAMES, "raw"), muscle: validParam(params.get("positionMuscle"), RONZANO_POSITION_MUSCLES, "all"),
    segment: validParam(params.get("positionSegment"), RONZANO_POSITION_SEGMENTS, "all"), cameraPreset: validParam(params.get("positionCamera"), CAMERA_PRESETS, "three_quarter") }; }), [webGLAvailable, setWebGLAvailable] = useState(true), [renderedPointCount, setRenderedPointCount] = useState(0);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null), [preparedReceipt, setPreparedReceipt] = useState<RonzanoViewDocument | null>(null);
  const [restoreText, setRestoreText] = useState(""), [busy, setBusy] = useState(false), [viewStatus, setViewStatus] = useState("Capture requires verified actual rendered source points.");
  const { frame, muscle, segment, cameraPreset, pointSizePixels: pointSize } = request;
  useEffect(() => { noticeRef.current = onNotice; }, [onNotice]);
  useEffect(() => { const params = initialPositionParams(paramsRef.current); new URLSearchParams(window.location.search).forEach((value, key) => params.set(key, value)); initialRowRef.current = params.get("positionRow"); queueMicrotask(() => setRequest((current) => ({ ...current,
    frame: validParam(params.get("positionFrame"), RONZANO_POSITION_FRAMES, "raw"), muscle: validParam(params.get("positionMuscle"), RONZANO_POSITION_MUSCLES, "all"),
    segment: validParam(params.get("positionSegment"), RONZANO_POSITION_SEGMENTS, "all"), cameraPreset: validParam(params.get("positionCamera"), CAMERA_PRESETS, "three_quarter") }))); }, []);
  useEffect(() => { mountedRef.current = true; const controller = new AbortController(); readVerifiedRonzanoPositions({ signal: controller.signal }).then(token => {
    if (controller.signal.aborted) return; const payload = ronzanoPositionPayload(token); setLoadState({ status: "ready", payload, verifiedSha256: contract.derivedAsset.sha256, token, error: "" });
    noticeRef.current?.(`Ronzano exact source bytes verified · ${payload.totals.byFrame.raw.toLocaleString()} raw / ${payload.totals.byFrame.normalized.toLocaleString()} normalized coordinate rows · 0 REG`);
  }).catch((error: Error) => { if (error.name === "AbortError") return; setLoadState({ status: "error", payload: null, verifiedSha256: null, token: null, error: error.message }); });
    return () => { mountedRef.current = false; controller.abort(); reloadControllerRef.current?.abort(); const pending = pendingRestoreRef.current; if (pending) { pending.controller.abort(); pending.reject(new Error("Ronzano viewer was closed while restoring")); pendingRestoreRef.current = null; } }; }, []);
  useEffect(() => { if (loadState.status !== "ready" || initialRowRef.current === undefined) return;
    const rowId = initialRowRef.current; initialRowRef.current = undefined;
    if (rowId !== null) { try { ronzanoSelectedRow(loadState.token, request, rowId); queueMicrotask(() => setSelectedRowId(rowId)); }
      catch { setUrlValue("positionRow", "", ""); queueMicrotask(() => setViewStatus("URL source row is invalid for the exact current frame/filters; selection cleared.")); } }
  }, [loadState, request]);
  const visibleGroups = useMemo(() => loadState.status === "ready" ? positionGroupsFor(loadState.payload, { frame, muscle, segment }) as PositionGroup[] : [], [frame, loadState, muscle, segment]);
  const visiblePointCount = useMemo(() => visibleGroups.reduce((sum, group) => sum + group.points.length, 0), [visibleGroups]);
  const selectedPoint = useMemo(() => loadState.status === "ready" ? ronzanoSelectedRow(loadState.token, request, selectedRowId) : null, [loadState, request, selectedRowId]);
  const currentFrameReceipt = contract.sourceObjectContract.representations[frame];
  const frameFiles = useMemo(() => contract.sourceFiles.filter(file => file.frame === frame), [frame]);
  const selectedFile = selectedPoint ? contract.sourceFiles.find(file => file.id === selectedPoint.sourceFileId) ?? null : null;
  const clearPrepared = () => { preparedRef.current = null; setPreparedReceipt(null); };
  const captureCurrent = (context: Context) => { if (context.failed) throw new Error("Current WebGL view is unavailable"); context.controls.update(); renderRonzanoPositionViewport(context.renderer);
    return attestRonzanoRenderedView(context.token, { ...context, selectedRowId: context.selectedRowId }); };
  const captureReceipt = () => { try { const context = contextRef.current; if (!context || busy) throw new Error("Current verified view is unavailable");
    const receipt = captureRonzanoSourceView(captureCurrent(context)); preparedRef.current = receipt; setPreparedReceipt(receipt); setViewStatus("Actual rendered camera, layers, source frame and selected row captured.");
  } catch (error) { clearPrepared(); setViewStatus(error instanceof Error ? error.message : String(error)); } };
  const exportReceipt = () => { const context = contextRef.current, receipt = preparedRef.current; if (!context || !receipt || context.failed) return;
    if (!samePreparedView(context, receipt)) { clearPrepared(); setViewStatus("View changed; capture the current actual view before export."); return; }
    try { captureCurrent(context); if (context.token.verificationSequence !== receipt.sourceVerification.verificationSequence) throw new Error("Source verification event changed");
      downloadJson("ronzano-e81976-actual-position-view-receipt.json", receipt);
    } catch (error) { clearPrepared(); setViewStatus(error instanceof Error ? error.message : String(error)); } };
  const fitCurrent = (preserveDirection: boolean) => { const context = contextRef.current; if (!context || pendingRestoreRef.current) return; fit(context, preserveDirection); clearPrepared(); };
  const browseRow = (movement: "first" | "last" | "next" | "previous" | "clear") => { const context = contextRef.current; if (context && !pendingRestoreRef.current) setSelectedRowId(browseRonzanoRow(context.token, context.request, context.selectedRowId, movement)); };
  const restoreReceipt = async () => {
    if (loadState.status !== "ready" || busy) return; let published = false;
    try {
      const document = JSON.parse(restoreText) as RonzanoViewDocument; validateRonzanoSourceViewReplay(loadState.token, document);
      const controller = new AbortController(); let resolve!: () => void, reject!: (error: Error) => void;
      const applied = new Promise<void>((yes, no) => { resolve = yes; reject = no; }); void applied.catch(() => {});
      pendingRestoreRef.current = { document, previousToken: loadState.token, controller, resolve, reject }; if (contextRef.current) contextRef.current.controls.enabled = false; setBusy(true); clearPrepared(); setViewStatus("Freshly verifying positions.json and all22 original workbooks…");
      const token = await readVerifiedRonzanoPositions({ signal: controller.signal, forceReload: true }); validateRonzanoSourceViewReplay(token, document);
      if (controller.signal.aborted) throw new DOMException("Restore cancelled", "AbortError");
      setRequest(document.view.request); setSelectedRowId(document.view.selectedRow?.id ?? null); published = true;
      setLoadState({ status: "ready", payload: ronzanoPositionPayload(token), verifiedSha256: contract.derivedAsset.sha256, token, error: "" }); await applied;
      for (const [key, value, fallback] of [["positionFrame", document.view.request.frame, "raw"], ["positionMuscle", document.view.request.muscle, "all"], ["positionSegment", document.view.request.segment, "all"], ["positionCamera", document.view.request.cameraPreset, "three_quarter"]]) setUrlValue(key, value, fallback);
      setViewStatus("Restored actual camera, row and layers after fresh verification of all23 source files.");
    } catch (error) { if (!mountedRef.current) return; const cancelled = error instanceof Error && error.name === "AbortError"; pendingRestoreRef.current?.controller.abort(); pendingRestoreRef.current = null; clearPrepared();
      if (!cancelled || published) { setSelectedRowId(null); setLoadState({ status: "error", payload: null, verifiedSha256: null, token: null, error: error instanceof Error ? error.message : String(error) }); }
      setViewStatus(cancelled ? "Restore cancelled; no new view was applied." : `Restore failed closed · ${error instanceof Error ? error.message : String(error)}`);
    } finally { pendingRestoreRef.current = null; if (contextRef.current) contextRef.current.controls.enabled = true; if (mountedRef.current) setBusy(false); }
  };
  const reloadSources = async () => { if (busy) return; const controller = new AbortController(); reloadControllerRef.current = controller; setBusy(true); clearPrepared(); setSelectedRowId(null); setLoadState({ status: "loading", payload: null, verifiedSha256: null, token: null, error: "" });
    try { const token = await readVerifiedRonzanoPositions({ forceReload: true, signal: controller.signal }); if (!mountedRef.current) return;
      setLoadState({ status: "ready", payload: ronzanoPositionPayload(token), verifiedSha256: contract.derivedAsset.sha256, token, error: "" }); setViewStatus("Exact source bytes reverified; a new default source view is shown.");
    } catch (error) { if (mountedRef.current) setLoadState({ status: "error", payload: null, verifiedSha256: null, token: null, error: error instanceof Error ? error.message : String(error) }); }
    finally { reloadControllerRef.current = null; if (mountedRef.current) setBusy(false); }
  };
  useEffect(() => {
    const host = canvasHostRef.current; if (!host || loadState.status !== "ready" || !visibleGroups.length) { preparedRef.current = null; queueMicrotask(() => setRenderedPointCount(0)); return; }
    let renderer: THREE.WebGLRenderer;
    try { renderer = createRonzanoPositionRenderer(); } catch { queueMicrotask(() => { setWebGLAvailable(false); setRenderedPointCount(0); setPreparedReceipt(null); setViewStatus("WebGL unavailable; no actual-view export is authorized."); }); pendingRestoreRef.current?.reject(new Error("WebGL renderer unavailable while restoring")); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("aria-label", `Interactive source-local ${frame} coordinate-point viewer. [ and ] browse exact file/row identities; Escape clears selection.`); host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1513); const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 10000), controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.screenSpacePanning = true; controls.minDistance = 0.1;
    const root = createRonzanoPositionObject(loadState.token, request); scene.add(root); const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
    const axes = new THREE.AxesHelper(Math.max(sphere.radius * 0.18, 3)); axes.visible = request.layers.axes; scene.add(axes);
    const context: Context = { token: loadState.token, request, renderer, scene, camera, controls, root, axes, selectedRowId,
      defaultCamera: true, sceneInstanceId: `ronzano-scene-${++sceneInstanceSequence}`, revision: 1, failed: false, applyingCamera: false }; contextRef.current = context; bindRonzanoPositionViewport(renderer, loadState.token, { scene, root, camera, controls, axes });
    let animationFrame = 0, width = 0, height = 0;
    const resize = () => { const nextWidth = Math.max(1, Math.round(host.clientWidth)), nextHeight = Math.max(1, Math.round(host.clientHeight)); if (nextWidth === width && nextHeight === height) return;
      width = nextWidth; height = nextHeight; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); if (context.defaultCamera && !pendingRestoreRef.current) fit(context, true); };
    resize();
    const pending = pendingRestoreRef.current;
    try { if (pending) { if (pending.controller.signal.aborted) throw new DOMException("Restore cancelled", "AbortError"); applyCamera(context, pending.document.view.camera); context.defaultCamera = false; }
      else fit(context, false);
      renderRonzanoPositionViewport(renderer); if (pending) { const rendered = attestRonzanoRenderedView(context.token, { ...context }); assertRonzanoSourceViewApplied(pending.document, rendered, pending.previousToken);
        const receipt = captureRonzanoSourceView(rendered); preparedRef.current = receipt; queueMicrotask(() => setPreparedReceipt(receipt)); pendingRestoreRef.current = null; pending.resolve(); }
    } catch (error) { context.failed = true; pending?.reject(error instanceof Error ? error : new Error(String(error))); }
    const observer = new ResizeObserver(resize); observer.observe(host);
    let interactionCamera: RonzanoCamera | null = null;
    const startInteraction = () => { interactionCamera = actualCamera(context); };
    const endInteraction = () => { interactionCamera = null; };
    const cameraChanged = () => { if (!context.applyingCamera && interactionCamera && !sameRonzanoCameraForCapture(interactionCamera, actualCamera(context))) context.defaultCamera = false; };
    controls.addEventListener("start", startInteraction); controls.addEventListener("end", endInteraction); controls.addEventListener("change", cameraChanged);
    const raycaster = new THREE.Raycaster(); raycaster.params.Points = { threshold: Math.max(sphere.radius * 0.009, 0.12) }; const pointer = new THREE.Vector2();
    const click = (event: MouseEvent) => { if (pendingRestoreRef.current) return; const rect = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(root.children, false)[0]; setSelectedRowId(hit?.index === undefined ? null : `${hit.object.name}:row:${hit.index + 1}`); };
    const keydown = (event: KeyboardEvent) => { if (pendingRestoreRef.current || !["[", "]", "Escape", "Home", "End"].includes(event.key)) return; event.preventDefault();
      setSelectedRowId(browseRonzanoRow(context.token, context.request, context.selectedRowId, event.key === "[" ? "previous" : event.key === "]" ? "next" : event.key === "Home" ? "first" : event.key === "End" ? "last" : "clear")); };
    const contextLost = (event: Event) => { event.preventDefault(); context.failed = true; preparedRef.current = null; setPreparedReceipt(null); setWebGLAvailable(false); setRenderedPointCount(0); pendingRestoreRef.current?.reject(new Error("WebGL context lost while restoring")); };
    renderer.domElement.addEventListener("click", click); renderer.domElement.addEventListener("keydown", keydown); renderer.domElement.addEventListener("webglcontextlost", contextLost);
    const render = () => { if (context.failed) return; controls.update(); renderRonzanoPositionViewport(renderer); const prepared = preparedRef.current;
      if (prepared && !samePreparedView(context, prepared)) { preparedRef.current = null; setPreparedReceipt(null); context.revision++; }
      animationFrame = requestAnimationFrame(render); }; render(); queueMicrotask(() => { setWebGLAvailable(!context.failed); setRenderedPointCount(context.failed ? 0 : visiblePointCount); });
    return () => { context.failed = true; contextRef.current = null; preparedRef.current = null; cancelAnimationFrame(animationFrame); observer.disconnect(); controls.removeEventListener("start", startInteraction); controls.removeEventListener("end", endInteraction); controls.removeEventListener("change", cameraChanged); controls.dispose();
      renderer.domElement.removeEventListener("click", click); renderer.domElement.removeEventListener("keydown", keydown); renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      disposeRonzanoPositionObject(root); axes.geometry.dispose(); (Array.isArray(axes.material) ? axes.material : [axes.material]).forEach(material => material.dispose()); disposeRonzanoPositionRenderer(renderer); renderer.domElement.remove(); };
  // Source/filter changes replace the source Points. Material size, row selection
  // and axis layers update the current scene without recreating its camera.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, frame, muscle, segment]);
  useEffect(() => { if (initialRowRef.current === undefined) setUrlValue("positionRow", selectedRowId ?? "", ""); const context = contextRef.current; if (!context) return; const presetChanged = context.request.cameraPreset !== request.cameraPreset;
    context.request = request; context.selectedRowId = selectedRowId; context.axes.visible = request.layers.axes;
    context.root.children.forEach(object => { const point = object as THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>; point.material.size = request.pointSizePixels; });
    if (presetChanged && !pendingRestoreRef.current) fit(context, false);
  }, [request, selectedRowId]);
  const updateFrame = (next: PositionFrame) => { if (busy) return; setRequest(current => ({ ...current, frame: next })); setSelectedRowId(null); clearPrepared(); setUrlValue("positionFrame", next, "raw"); };
  const updateMuscle = (next: PositionMuscle) => { if (busy) return; setRequest(current => ({ ...current, muscle: next })); setSelectedRowId(null); clearPrepared(); setUrlValue("positionMuscle", next, "all"); };
  const updateSegment = (next: PositionSegment) => { if (busy) return; setRequest(current => ({ ...current, segment: next })); setSelectedRowId(null); clearPrepared(); setUrlValue("positionSegment", next, "all"); };
  const updateCamera = (next: CameraPreset) => { if (busy) return; setRequest(current => ({ ...current, cameraPreset: next })); const context = contextRef.current; if (context) { context.request = { ...context.request, cameraPreset: next }; fit(context, false); } clearPrepared(); setUrlValue("positionCamera", next, "three_quarter"); };
  return (
    <section className="premotor-position-explorer" aria-labelledby="premotor-position-heading">
      <header className="premotor-position-heading">
        <div>
          <p className="panel-kicker">UPG-114 · PHASE A · EXACT SOURCE COORDINATE ROWS · EARLY POSTNATAL · SOURCE-LOCAL · 0 REG</p>
          <h3 id="premotor-position-heading">Lumbar premotor position atlas</h3>
          <p>Every visible mark is one exact numeric XYZ row from a checksum-pinned Ronzano et al. eLife source workbook. It has no biological radius and is not a soma, neurite, cell reconstruction, molecular type, synapse or atlas placement.</p>
        </div>
        <span className="badge observed">POINT POSITION ONLY · NO CELL GEOMETRY</span>
      </header>

      <div className="premotor-position-metrics" aria-label="Exact position source summary">
        <article><strong>22 / 22</strong><span>source workbooks checksum pinned</span></article>
        <article><strong>14,484</strong><span>raw coordinate rows</span></article>
        <article><strong>17,394</strong><span>normalized coordinate rows</span></article>
        <article><strong>0</strong><span>point identities across frames · atlas joins · registrations</span></article>
      </div>

      <div className="premotor-position-controls" aria-label="Premotor position filters">
        <label>Source representation
          <select disabled={busy} value={frame} onChange={(event) => updateFrame(event.target.value as PositionFrame)}>
            <option value="raw">Raw before x/y normalization · 14,484</option>
            <option value="normalized">Source normalized · 17,394</option>
          </select>
        </label>
        <label>Tracing group
          <select disabled={busy} value={muscle} onChange={(event) => updateMuscle(event.target.value as PositionMuscle)}>
            <option value="all">LG + TA · co-display only</option>
            <option value="LG">LG · ankle extensor group</option>
            <option value="TA">TA · ankle flexor group</option>
          </select>
        </label>
        <label>Lumbar source segment
          <select disabled={busy} value={segment} onChange={(event) => updateSegment(event.target.value as PositionSegment)}>
            {RONZANO_POSITION_SEGMENTS.map((value) => <option value={value} key={value}>{value === "all" ? "L1-L6 · source availability" : value}</option>)}
          </select>
        </label>
        <label>Point display size · {pointSize}px
          <input disabled={busy} type="range" min="1" max="7" step="1" value={pointSize} onChange={(event) => setRequest((current) => ({ ...current, pointSizePixels: Number(event.target.value) }))} />
        </label>
      </div>

      <div className="premotor-camera-controls" aria-label="Position camera presets">
        {CAMERA_PRESETS.map((preset) => (
          <button type="button" disabled={busy} key={preset} className={cameraPreset === preset ? "active" : ""} aria-pressed={cameraPreset === preset} onClick={() => updateCamera(preset)}>{readable(preset)}</button>
        ))}
        <button type="button" onClick={captureReceipt} disabled={busy || loadState.status !== "ready" || !webGLAvailable || !renderedPointCount}>Capture actual view</button>
        <button type="button" onClick={exportReceipt} disabled={!preparedReceipt}>Export actual view receipt</button>
        <button type="button" onClick={() => fitCurrent(true)} disabled={!visiblePointCount || busy}>Fit visible source rows</button>
        <label><input disabled={busy} type="checkbox" checked={request.layers.axes} onChange={(event) => setRequest((current) => ({ ...current, layers: { points: true, axes: event.target.checked } }))} />Display axes</label>
      </div>

      <div className="premotor-position-workspace">
        <article className="premotor-position-canvas-card">
          <div className="premotor-canvas-heading">
            <div><span>{frame.toUpperCase()} SOURCE FRAME</span><strong>{renderedPointCount.toLocaleString()} exact source rows drawn</strong></div>
            <em>{webGLAvailable ? "Drag to orbit · wheel to zoom · click, or use [ / ] to browse exact source rows" : "WebGL unavailable · exact group table remains below"}</em>
          </div>
          <div className="premotor-position-stage" ref={canvasHostRef}>
            {loadState.status === "loading" && <p>Verifying 1.2 MB point asset against the pinned SHA-256 receipt…</p>}
            {loadState.status === "error" && <div><p><strong>FAIL CLOSED</strong><span>{loadState.error}</span><span>Zero points are reported as rendered.</span></p><button type="button" onClick={() => void reloadSources()} disabled={busy}>Reload exact source files</button></div>}
            {!webGLAvailable && loadState.status === "ready" && <p><strong>3D unavailable</strong><span>The source rows, counts, checksums and missingness remain accessible in the evidence panel and table.</span></p>}
          </div>
          <div className="premotor-position-legend" aria-label="Premotor point legend">
            <span><i className="lg" />{MUSCLE_LABELS.LG}</span>
            <span><i className="ta" />{MUSCLE_LABELS.TA}</span>
            <span><b>X</b> mediolateral</span><span><b>Y</b> dorsoventral</span><span><b>Z</b> rostrocaudal · negative rostral</span>
          </div>
          <p className="premotor-display-boundary">{frame === "normalized"
            ? "Normalized x/y are displayed using the authors' illustrational 1700 × 900 µm idealized-cord scaling; z is unchanged. This does not authorize measurement or atlas registration."
            : "Raw x/y values are shown before normalization; z retains the source L4/L5 zero. Only uniform viewport fitting is applied; raw and normalized rows are never paired."}</p>
        </article>

        <aside className="premotor-position-evidence">
          <section>
            <p className="panel-kicker">SELECTED SOURCE ROW</p>
            <div className="premotor-camera-controls" aria-label="Exact source row navigation">
              <button type="button" onClick={() => browseRow("first")} disabled={busy || !visiblePointCount}>First row</button>
              <button type="button" onClick={() => browseRow("previous")} disabled={busy || !visiblePointCount}>Previous row</button>
              <button type="button" onClick={() => browseRow("next")} disabled={busy || !visiblePointCount}>Next row</button>
              <button type="button" onClick={() => browseRow("last")} disabled={busy || !visiblePointCount}>Last row</button>
              <button type="button" onClick={() => browseRow("clear")} disabled={busy || !selectedPoint}>Clear row</button>
            </div>
            {selectedPoint && selectedFile ? (
              <>
                <h4>{selectedPoint.muscle} · {selectedPoint.segment} · workbook row {selectedPoint.sourceRow.toLocaleString()}</h4>
                <dl>
                  <div><dt>Stable project row ID</dt><dd>{selectedPoint.id}</dd></div>
                  <div><dt>Source coordinate</dt><dd>x {formattedCoordinate(selectedPoint.sourceCoordinate[0])} · y {formattedCoordinate(selectedPoint.sourceCoordinate[1])} · z {formattedCoordinate(selectedPoint.sourceCoordinate[2])}</dd></div>
                  <div><dt>Frame / claim</dt><dd>{frame} · labelled-cell position only</dd></div>
                  <div><dt>Source workbook</dt><dd>{selectedFile.fileName}</dd></div>
                  <div><dt>Workbook SHA-256</dt><dd><code>{selectedFile.sha256}</code></dd></div>
                </dl>
                <a href={selectedFile.browserUrl} download>Download exact source workbook</a>
              </>
            ) : (
              <div className="premotor-selection-empty"><h4>No coordinate row selected</h4><p>Click a point or use the row controls to expose its one-based Excel row, exact XYZ values and source-file hash. Clearing selection changes no source data.</p></div>
            )}
          </section>
          <section>
            <p className="panel-kicker">RUNTIME AND REPRESENTATION RECEIPT</p>
            <dl>
              <div><dt>Runtime status</dt><dd>{loadState.status === "ready" ? "SHA-256 verified before parsing" : loadState.status}</dd></div>
              <div><dt>Asset SHA-256</dt><dd><code>{loadState.status === "ready" ? loadState.verifiedSha256 : contract.derivedAsset.sha256}</code></dd></div>
              <div><dt>Frame denominator</dt><dd>{currentFrameReceipt.coordinateRowCount.toLocaleString()} coordinate rows in {currentFrameReceipt.sourceFileCount} workbooks</dd></div>
              <div><dt>Visible denominator</dt><dd>{visiblePointCount.toLocaleString()} coordinate rows after explicit filters</dd></div>
              <div><dt>Cross-frame identity</dt><dd>Not established · 5 LG segment pairs differ in row count</dd></div>
              <div><dt>Registration</dt><dd>Source-local · 0 atlas joins · 0 REG</dd></div>
            </dl>
          </section>
          <section>
            <p className="panel-kicker">MODEL COMPLETENESS FOR THESE POINTS</p>
            <div className="premotor-missingness-grid">
              <span className="available"><b>AVAILABLE</b> exact XYZ row · muscle tracing group · lumbar segment · source file/row</span>
              {contract.missingness.map((item) => <span className="unavailable" key={item.field}><b>{item.status}</b>{readable(item.field)} · {item.reason}</span>)}
            </div>
          </section>
        </aside>
      </div>

      <div className="premotor-frame-audit" role="status" aria-live="polite">{viewStatus}</div>
      <label>Captured actual source view
        <textarea aria-label="Captured Ronzano actual source view JSON" value={preparedReceipt ? JSON.stringify(preparedReceipt, null, 2) : ""} readOnly rows={4} />
      </label>
      <label>Restore actual source view JSON
        <textarea aria-label="Restore Ronzano actual source view JSON" value={restoreText} onChange={(event) => setRestoreText(event.target.value)} rows={4} />
      </label>
      <div className="premotor-camera-controls">
        <button type="button" onClick={() => void restoreReceipt()} disabled={busy || loadState.status !== "ready" || !restoreText.trim()}>Restore with fresh source verification</button>
        <button type="button" onClick={() => pendingRestoreRef.current?.controller.abort()} disabled={!busy || loadState.status !== "ready"}>Cancel restore</button>
      </div>
      <div className="premotor-frame-audit" role="note">
        <strong>RAW ↔ NORMALIZED IDENTITY IS DELIBERATELY BLOCKED</strong>
        <span>TA has six matching row-count/z-order pairs, but no source-declared stable row ID. LG has five row-count mismatches. Therefore this viewer switches representations; it never morphs, links or tracks a point between them.</span>
      </div>

      <div className="premotor-group-table-wrap">
        <table className="premotor-group-table">
          <caption>Visible source groups and exact workbook denominators</caption>
          <thead><tr><th>Muscle</th><th>Segment</th><th>Rows</th><th>Source file</th><th>SHA-256 receipt</th></tr></thead>
          <tbody>
            {visibleGroups.map((group) => {
              const sourceFile = frameFiles.find((file) => file.id === group.sourceFileId);
              return <tr key={group.sourceFileId}><td>{group.muscle}</td><td>{group.segment}</td><td>{group.points.length.toLocaleString()}</td><td>{sourceFile?.fileName}</td><td><code>{group.sourceFileSha256.slice(0, 16)}…{group.sourceFileSha256.slice(-10)}</code></td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <footer className="premotor-position-footer">
        <p><strong>Scope:</strong> injections at P1-P2; analysis 8-9 days later. The source does not establish persistence of this output-connectivity organization into adulthood.</p>
        <p><strong>Relationship:</strong> LG/TA is the source tracing group, not a complete synapse roster. Apparent point overlap is not a same-cell, same-type or shared-partner identity.</p>
        <div><a href={contract.source.articleUrl} target="_blank" rel="noreferrer">Primary article ↗</a><a href={contract.source.figuresAndDataUrl} target="_blank" rel="noreferrer">Figures and source data ↗</a><a href={contract.rights.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0 ↗</a></div>
      </footer>
    </section>
  );
}
