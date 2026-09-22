"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ronzanoPremotorPositionReference as contract } from "./atlas-types";
import {
  RONZANO_POSITION_FRAMES,
  RONZANO_POSITION_MUSCLES,
  RONZANO_POSITION_SEGMENTS,
  displayCoordinate,
  pointReceipt,
  positionGroupsFor,
  sha256Hex,
  validateRonzanoPositionPayload,
} from "./ronzano-premotor-position-data.js";

type PositionFrame = "raw" | "normalized";
type PositionMuscle = "all" | "LG" | "TA";
type PositionSegment = "all" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
type CameraPreset = "three_quarter" | "transverse" | "frontal" | "lateral";
type PositionPoint = [number, number, number];
type PositionGroup = {
  sourceFileId: string;
  sourceFileSha256: string;
  muscle: "LG" | "TA";
  muscleRole: "ankle_extensor" | "ankle_flexor";
  segment: Exclude<PositionSegment, "all">;
  sourceRows: { first: number; last: number };
  points: PositionPoint[];
};
type PositionPayload = {
  schemaVersion: string;
  assetId: string;
  sourceDoi: string;
  sourceObjectKind: string;
  columns: string[];
  representations: Array<{ frame: PositionFrame; groups: PositionGroup[] }>;
  totals: { sourceFileCount: number; coordinateRowCountAcrossRepresentations: number; byFrame: Record<PositionFrame, number> };
  identityPolicy: { rowIdentity: string; crossFramePointIdentity: string; crossSourceIdentity: string; registrationCount: number };
};
type LoadState =
  | { status: "loading"; payload: null; verifiedSha256: null; error: "" }
  | { status: "ready"; payload: PositionPayload; verifiedSha256: string; error: "" }
  | { status: "error"; payload: null; verifiedSha256: null; error: string };
type SelectedPointReceipt = ReturnType<typeof pointReceipt>;

const CAMERA_PRESETS: CameraPreset[] = ["three_quarter", "transverse", "frontal", "lateral"];
const MUSCLE_COLORS = Object.freeze({ LG: 0x55b5df, TA: 0xf2ad4f });
const MUSCLE_LABELS = Object.freeze({
  LG: "LG · lateral gastrocnemius · ankle extensor tracing group",
  TA: "TA · tibialis anterior · ankle flexor tracing group",
});
const SEGMENT_ORDER: Readonly<Record<Exclude<PositionSegment, "all">, number>> = Object.freeze({ L1: 1, L2: 2, L3: 3, L4: 4, L5: 5, L6: 6 });

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function validParam<T extends string>(value: string | null, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? value as T : fallback;
}

function setUrlValue(key: string, value: string, defaultValue: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value === defaultValue) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function formattedCoordinate(value: number) {
  return value.toLocaleString("en-CA", { maximumFractionDigits: 8, useGrouping: false });
}

function downloadJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function RonzanoPremotorPositionViewer({ onNotice }: { onNotice?: (notice: string) => void }) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading", payload: null, verifiedSha256: null, error: "" });
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [frame, setFrame] = useState<PositionFrame>("raw");
  const [muscle, setMuscle] = useState<PositionMuscle>("all");
  const [segment, setSegment] = useState<PositionSegment>("all");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("three_quarter");
  const [pointSize, setPointSize] = useState(3);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPointReceipt | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    queueMicrotask(() => {
      setFrame(validParam(params.get("positionFrame"), RONZANO_POSITION_FRAMES, "raw"));
      setMuscle(validParam(params.get("positionMuscle"), RONZANO_POSITION_MUSCLES, "all"));
      setSegment(validParam(params.get("positionSegment"), RONZANO_POSITION_SEGMENTS, "all"));
      setCameraPreset(validParam(params.get("positionCamera"), CAMERA_PRESETS, "three_quarter"));
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(contract.derivedAsset.browserUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Position data request failed (${response.status})`);
        const bytes = await response.arrayBuffer();
        const verifiedSha256 = await sha256Hex(bytes);
        if (bytes.byteLength !== contract.derivedAsset.bytes || verifiedSha256 !== contract.derivedAsset.sha256) {
          throw new Error("Position data byte or SHA-256 receipt mismatch");
        }
        const payload = JSON.parse(new TextDecoder().decode(bytes)) as PositionPayload;
        validateRonzanoPositionPayload(payload, contract);
        return { payload, verifiedSha256 };
      })
      .then(({ payload, verifiedSha256 }) => {
        setLoadState({ status: "ready", payload, verifiedSha256, error: "" });
        onNotice?.(`Ronzano source-local positions verified · ${payload.totals.byFrame.raw.toLocaleString()} raw / ${payload.totals.byFrame.normalized.toLocaleString()} normalized coordinate rows · 0 REG`);
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setLoadState({ status: "error", payload: null, verifiedSha256: null, error: error.message });
        onNotice?.(`Ronzano position viewer failed closed · ${error.message}`);
      });
    return () => controller.abort();
  }, [onNotice]);

  const visibleGroups = useMemo(() => (
    loadState.status === "ready" ? positionGroupsFor(loadState.payload, { frame, muscle, segment }) as PositionGroup[] : []
  ), [frame, loadState, muscle, segment]);
  const visiblePointCount = useMemo(() => visibleGroups.reduce((sum, group) => sum + group.points.length, 0), [visibleGroups]);
  const currentFrameReceipt = contract.sourceObjectContract.representations[frame];
  const frameFiles = useMemo(() => contract.sourceFiles.filter((file) => file.frame === frame), [frame]);
  const selectedFile = selectedPoint ? contract.sourceFiles.find((file) => file.id === selectedPoint.sourceFileId) ?? null : null;

  useEffect(() => {
    const container = canvasHostRef.current;
    if (!container || loadState.status !== "ready" || !visibleGroups.length) return;
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) {
      queueMicrotask(() => setWebGLAvailable(false));
      return;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      queueMicrotask(() => setWebGLAvailable(false));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("aria-label", `Interactive source-local ${frame} coordinate-point viewer showing ${visiblePointCount} labelled-cell positions. Points have no radius and are not atlas registered.`);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1513);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 10000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    const root = new THREE.Group();
    const pointObjects: THREE.Points[] = [];

    for (const group of visibleGroups) {
      const positions = new Float32Array(group.points.length * 3);
      for (let index = 0; index < group.points.length; index += 1) {
        const display = displayCoordinate(group.points[index], frame);
        positions[index * 3] = display[0] * 0.01;
        positions[index * 3 + 1] = display[1] * 0.01;
        positions[index * 3 + 2] = display[2] * 0.01;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.computeBoundingSphere();
      const material = new THREE.PointsMaterial({
        color: MUSCLE_COLORS[group.muscle],
        size: pointSize,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
      });
      const object = new THREE.Points(geometry, material);
      object.name = group.sourceFileId;
      object.userData.positionGroup = group;
      object.renderOrder = SEGMENT_ORDER[group.segment];
      pointObjects.push(object);
      root.add(object);
    }
    scene.add(root);
    const bounds = new THREE.Box3().setFromObject(root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 20;
    controls.target.copy(sphere.center);
    const distance = radius * 2.45;
    if (cameraPreset === "transverse") camera.position.copy(sphere.center).add(new THREE.Vector3(0, 0, distance));
    else if (cameraPreset === "frontal") camera.position.copy(sphere.center).add(new THREE.Vector3(0, distance, 0));
    else if (cameraPreset === "lateral") camera.position.copy(sphere.center).add(new THREE.Vector3(distance, 0, 0));
    else camera.position.copy(sphere.center).add(new THREE.Vector3(radius * 1.35, radius * 0.75, radius * 1.65));
    camera.near = Math.max(radius / 1000, 0.01);
    camera.far = Math.max(radius * 20, 1000);
    camera.updateProjectionMatrix();
    controls.update();
    const axes = new THREE.AxesHelper(Math.max(radius * 0.18, 3));
    axes.position.set(0, 0, 0);
    scene.add(axes);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: Math.max(radius * 0.009, 0.12) };
    const pointer = new THREE.Vector2();
    const handleClick = (event: MouseEvent) => {
      const rectangle = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rectangle.left) / rectangle.width) * 2 - 1;
      pointer.y = -((event.clientY - rectangle.top) / rectangle.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pointObjects, false)[0];
      if (!hit || hit.index === undefined) {
        setSelectedPoint(null);
        return;
      }
      const group = hit.object.userData.positionGroup as PositionGroup;
      setSelectedPoint(pointReceipt(group, hit.index, frame));
    };
    renderer.domElement.addEventListener("click", handleClick);

    let resizeFrame = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    const resize = () => {
      const width = Math.max(280, container.clientWidth);
      const height = Math.max(420, container.clientHeight);
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    let animationFrame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebGLAvailable(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      controls.dispose();
      root.traverse((object) => {
        const drawable = object as THREE.Points;
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
  }, [cameraPreset, frame, loadState, pointSize, visibleGroups, visiblePointCount]);

  const updateFrame = (next: PositionFrame) => {
    setFrame(next);
    setSelectedPoint(null);
    setUrlValue("positionFrame", next, "raw");
  };
  const updateMuscle = (next: PositionMuscle) => {
    setMuscle(next);
    setSelectedPoint(null);
    setUrlValue("positionMuscle", next, "all");
  };
  const updateSegment = (next: PositionSegment) => {
    setSegment(next);
    setSelectedPoint(null);
    setUrlValue("positionSegment", next, "all");
  };
  const updateCamera = (next: CameraPreset) => {
    setCameraPreset(next);
    setUrlValue("positionCamera", next, "three_quarter");
  };
  const exportReceipt = () => downloadJson("ronzano-e81976-position-view-receipt.json", {
    releaseId: contract.releaseId,
    exportedAt: new Date().toISOString(),
    verifiedRuntimeAsset: loadState.status === "ready" ? {
      path: contract.derivedAsset.browserUrl,
      bytes: contract.derivedAsset.bytes,
      expectedSha256: contract.derivedAsset.sha256,
      verifiedSha256: loadState.verifiedSha256,
    } : null,
    filters: { frame, muscle, segment, cameraPreset, pointSizePixels: pointSize },
    visiblePointCount,
    selectedPoint,
    relationshipBoundary: contract.relationshipBoundary,
    scientificBoundary: contract.scientificBoundary,
  });

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
          <select value={frame} onChange={(event) => updateFrame(event.target.value as PositionFrame)}>
            <option value="raw">Raw before x/y normalization · 14,484</option>
            <option value="normalized">Source normalized · 17,394</option>
          </select>
        </label>
        <label>Tracing group
          <select value={muscle} onChange={(event) => updateMuscle(event.target.value as PositionMuscle)}>
            <option value="all">LG + TA · co-display only</option>
            <option value="LG">LG · ankle extensor group</option>
            <option value="TA">TA · ankle flexor group</option>
          </select>
        </label>
        <label>Lumbar source segment
          <select value={segment} onChange={(event) => updateSegment(event.target.value as PositionSegment)}>
            {RONZANO_POSITION_SEGMENTS.map((value) => <option value={value} key={value}>{value === "all" ? "L1-L6 · source availability" : value}</option>)}
          </select>
        </label>
        <label>Point display size · {pointSize}px
          <input type="range" min="1" max="7" step="1" value={pointSize} onChange={(event) => setPointSize(Number(event.target.value))} />
        </label>
      </div>

      <div className="premotor-camera-controls" aria-label="Position camera presets">
        {CAMERA_PRESETS.map((preset) => (
          <button type="button" key={preset} className={cameraPreset === preset ? "active" : ""} aria-pressed={cameraPreset === preset} onClick={() => updateCamera(preset)}>{readable(preset)}</button>
        ))}
        <button type="button" onClick={exportReceipt}>Export verified view receipt</button>
      </div>

      <div className="premotor-position-workspace">
        <article className="premotor-position-canvas-card">
          <div className="premotor-canvas-heading">
            <div><span>{frame.toUpperCase()} SOURCE FRAME</span><strong>{visiblePointCount.toLocaleString()} exact rows visible</strong></div>
            <em>{webGLAvailable ? "Drag to orbit · wheel to zoom · click a point for its source row" : "WebGL unavailable · exact group table remains below"}</em>
          </div>
          <div className="premotor-position-stage" ref={canvasHostRef}>
            {loadState.status === "loading" && <p>Verifying 1.2 MB point asset against the pinned SHA-256 receipt…</p>}
            {loadState.status === "error" && <p><strong>FAIL CLOSED</strong><span>{loadState.error}</span><span>Zero points are reported as rendered.</span></p>}
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
              <div className="premotor-selection-empty"><h4>No coordinate row selected</h4><p>Click a point to expose its one-based Excel row, exact XYZ values and source-file hash. Clearing selection changes no source data.</p></div>
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
