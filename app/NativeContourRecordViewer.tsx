"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { neurolucidaNativeContourAdmissionCatalog } from "./atlas-types";
import {
  nativeContourAdmissionRecord,
  nativeContourDisplayTransform,
  transformNativeContourPoint,
  validateNativeContourAdmissionCatalog,
  validateNativeContourGeometry,
} from "./neurolucida-native-contour-admission.js";
import { sha256Hex } from "./source-local-morphology-geometry.js";
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

type NativeContourPayload = {
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
type CatalogRecord = Omit<CatalogSnapshotRecord, "derivedObject"> & {
  derivedObject: CatalogSnapshotRecord["derivedObject"] | null;
};
type LoadState =
  | { neuronId: number; status: "loading"; payload: null; message: string }
  | { neuronId: number; status: "verified"; payload: NativeContourPayload; message: string }
  | { neuronId: number; status: "held" | "unavailable"; payload: null; message: string };

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

function NativeContourRecordContent({ neuronId }: { neuronId: number }) {
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
  const [selectedContourId, setSelectedContourId] = useState("");
  const [isolateContour, setIsolateContour] = useState(false);
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(true);
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [state, setState] = useState<LoadState>(() => ({
    neuronId,
    status: isRenderable(admission) ? "loading" : "held",
    payload: null,
    message: isRenderable(admission) ? "Verifying exact source-native contour bytes…" : admission?.admission.reason ?? "No audited native DAT record is available.",
  }));

  useEffect(() => {
    if (!isRenderable(admission)) return undefined;
    const controller = new AbortController();
    void fetch(admission.derivedObject.path, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Native contour request failed (${response.status})`);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== admission.derivedObject.bytes || await sha256Hex(bytes) !== admission.derivedObject.sha256) {
          throw new Error("Native contour byte receipt mismatch");
        }
        const payload = JSON.parse(new TextDecoder().decode(bytes)) as NativeContourPayload;
        return validateNativeContourGeometry(payload, admission) as NativeContourPayload;
      })
      .then((payload) => setState({ neuronId, status: "verified", payload, message: "Exact source-native contour traces verified." }))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setState({ neuronId, status: "unavailable", payload: null, message: error.message });
      });
    return () => controller.abort();
  }, [admission, neuronId]);

  const activeState = useMemo<LoadState>(() => state.neuronId === neuronId
    ? state
    : { neuronId, status: isRenderable(admission) ? "loading" : "held", payload: null, message: "Clearing the prior record before loading this selection…" }, [admission, neuronId, state]);
  const transform = useMemo(
    () => activeState.status === "verified" ? nativeContourDisplayTransform(activeState.payload.contours) : null,
    [activeState],
  );

  useEffect(() => {
    const container = viewportRef.current;
    if (!container || !isRenderable(admission) || activeState.status !== "verified" || !transform) return;
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) {
      queueMicrotask(() => setWebGLAvailable(false));
      return;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setWebGLAvailable(false));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.dataset.assetId = activeState.payload.assetId;
    renderer.domElement.dataset.geometryAuthority = admission.derivedObject.authority;
    renderer.domElement.dataset.primitiveKind = "line-loop-only";
    renderer.domElement.dataset.filledPolygonCount = "0";
    renderer.domElement.dataset.triangleCount = "0";
    renderer.domElement.dataset.loftCount = "0";
    renderer.domElement.dataset.surfaceCount = "0";
    renderer.domElement.dataset.membraneCount = "0";
    renderer.domElement.dataset.volumeCount = "0";
    renderer.domElement.dataset.internalStructureObjectCount = "0";
    renderer.domElement.dataset.biologicalMeasurementCount = "0";
    renderer.domElement.dataset.standardizedSwcOverlayCount = "0";
    renderer.domElement.dataset.sameCellJoinCount = "0";
    renderer.domElement.dataset.registrationCount = "0";
    renderer.domElement.setAttribute("aria-label", `Interactive 3D view of ${activeState.payload.contours.length} source-native NMO ${neuronId} Neurolucida soma contour traces. Ordered LineLoops only; no fill, surface, volume, membrane, internal structure, SWC overlay or atlas registration is shown.`);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1714);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const root = new THREE.Group();
    root.name = `nmo-${neuronId}-source-native-contour-traces`;
    root.userData = { assetId: activeState.payload.assetId, authority: admission.derivedObject.authority, sourceFrame: activeState.payload.sourceFrame, allowedPrimitive: "ordered_line_loop", filledPolygonCount: 0, triangleCount: 0, loftCount: 0, surfaceCount: 0, membraneCount: 0, volumeCount: 0, internalStructureObjectCount: 0, biologicalMeasurementCount: 0, standardizedSwcOverlayCount: 0, sameCellJoinCount: 0, registrationCount: 0 };
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
      line.userData = { sourceName: contour.sourceName, sourceColor: contour.sourceColor, sourceClosedFlag: contour.sourceClosedFlag, interpretedClosed: contour.interpretedClosed, closureBasis: contour.closureBasis, vertexCount: contour.vertexCount, zValuesMicrometre: contour.zValuesMicrometre, traceRadiusRenderingUse: "forbidden" };
      contourLines.push(line);
      (secondaryNames.has(contour.sourceName) ? secondary : primary).add(line);
    }
    root.add(primary, secondary);
    scene.add(root);
    visibilityRef.current = { primary, secondary };
    contourLinesRef.current = contourLines;

    const bounds = new THREE.Box3().setFromObject(root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 4;
    controls.target.copy(sphere.center);
    camera.position.copy(sphere.center).add(new THREE.Vector3(radius * 1.4, radius * 0.95, radius * 1.65));
    camera.near = Math.max(radius / 500, 0.01);
    camera.far = Math.max(radius * 40, 100);
    camera.updateProjectionMatrix();

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
      const nextWidth = Math.max(280, container.clientWidth);
      const nextHeight = Math.max(300, container.clientHeight);
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    let animationFrame = 0;
    const render = () => { controls.update(); renderer.render(scene, camera); animationFrame = requestAnimationFrame(render); };
    render();
    const onContextLost = (event: Event) => { event.preventDefault(); setWebGLAvailable(false); };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      disposeObject(root);
      disposeObject(axes);
      disposeObject(scaleLine);
      renderer.dispose();
      renderer.domElement.remove();
      visibilityRef.current = null;
      contourLinesRef.current = [];
    };
  }, [activeState, admission, neuronId, transform]);

  useEffect(() => {
    if (!visibilityRef.current) return;
    visibilityRef.current.primary.visible = showPrimary;
    visibilityRef.current.secondary.visible = showSecondary;
  }, [showPrimary, showSecondary, activeState]);

  useEffect(() => {
    for (const line of contourLinesRef.current) {
      const selected = line.name === selectedContourId;
      const material = line.material as THREE.LineBasicMaterial;
      material.color.set(selected ? "#ffdb76" : line.userData.sourceColor as string);
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

  return (
    <section className={`native-soma-contour-viewer native-contour-record-viewer ${isRenderable(admission) ? "admitted" : "held"}`} aria-labelledby={`native-contour-title-${neuronId}`} data-asset-id={`NeuroMorpho:${neuronId}`} data-admission-status={admission.admissionStatus} data-admitted-contour-count={admitted} data-admitted-vertex-count={vertices} data-filled-polygon-count="0" data-triangle-count="0" data-loft-count="0" data-surface-count="0" data-membrane-count="0" data-volume-count="0" data-internal-structure-object-count="0" data-biological-measurement-count="0" data-standardized-swc-overlay-count="0" data-same-cell-join-count="0" data-registration-count="0">
      <header>
        <div>
          <p className="panel-kicker">PER-RECORD SOURCE-NATIVE DAT AUDIT · OBS</p>
          <h3 id={`native-contour-title-${neuronId}`}>NMO {neuronId} native contour detail</h3>
          <p>{admission.title}. The audit and display are identity-gated to this exact record; prior-record native geometry is cleared on switch.</p>
        </div>
        <strong>{statusLabel}</strong>
      </header>

      <div className="native-soma-contour-metrics" aria-label={`NMO ${neuronId} native contour evidence counts`}>
        <span><strong>{admission.audit.somaNamedContourObjectCount}</strong> audited soma traces</span>
        <span><strong>{admitted}</strong> admitted line loops</span>
        <span><strong>{vertices}</strong> admitted vertices</span>
        <span><strong>{admission.audit.sourceOpenSomaNamedContourCount}</strong> raw false flags</span>
        <span><strong>0</strong> surfaces / volumes</span>
        <span><strong>0</strong> internal objects / REG</span>
      </div>

      {isRenderable(admission) ? (
        <div className="native-soma-contour-layout">
          <div>
            <div className="native-soma-contour-controls" aria-label="Native contour trace visibility">
              <button type="button" className={showPrimary ? "active" : ""} aria-pressed={showPrimary} onClick={() => setShowPrimary((value) => !value)}>{admission.viewer?.primaryLabel ?? "Admitted source-closed traces"}</button>
              {admission.viewer?.secondaryLabel && <button type="button" className={showSecondary ? "active legacy" : ""} aria-pressed={showSecondary} onClick={() => setShowSecondary((value) => !value)}>{admission.viewer.secondaryLabel}</button>}
            </div>
            {activeState.status === "verified" && <div className="native-contour-inspection-controls">
              <label htmlFor={`native-contour-select-${neuronId}`}>Inspect a source cross-section</label>
              <select id={`native-contour-select-${neuronId}`} value={selectedContourId} onChange={(event) => { setSelectedContourId(event.target.value); setShowPrimary(true); setShowSecondary(true); }}>
                <option value="">All {activeState.payload.contours.length} source traces</option>
                {activeState.payload.contours.map((contour, index) => <option key={contour.id} value={contour.id}>Trace {index + 1} · z {formatZ(contour.zValuesMicrometre)} µm · {contour.vertexCount} vertices</option>)}
              </select>
              <label className="native-contour-isolate"><input type="checkbox" checked={isolateContour} disabled={!selectedContour} onChange={(event) => setIsolateContour(event.target.checked)} />Isolate selected trace</label>
            </div>}
            <div className="native-soma-contour-stage" ref={viewportRef}>
              {activeState.status === "loading" && <p role="status">{activeState.message}</p>}
              {activeState.status === "unavailable" && <p role="alert">Native traces unavailable: {activeState.message}. No fallback geometry is shown.</p>}
              {!webGLAvailable && <p role="status">WebGL unavailable. Exact source values and boundaries remain readable.</p>}
              {activeState.status === "verified" && <div className="native-soma-contour-scale" aria-hidden="true"><span />20 µm native-coordinate guide</div>}
            </div>
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
            <div className="native-soma-contour-boundary" role="note"><strong>LINE TRACES ONLY</strong><p>{admission.hardBoundaries.join(" ")}</p></div>
            <nav aria-label={`Native contour sources for NMO ${neuronId}`}>
              <a href={admission.source.officialRecordUrl} target="_blank" rel="noreferrer">NeuroMorpho record ↗</a>
              <a href={admission.source.originalDatUrl} target="_blank" rel="noreferrer">Original DAT ↗</a>
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
