"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import reference from "../data/janelia-wt-bounded-reference-0.1.json";
import { buildJaneliaWtPlaneReceipt, getJaneliaWtSliceMapping } from "./janelia-wt-bounded-reference.js";
import { assertJaneliaWtSourceViewApplied, attestJaneliaWtRenderedPlanes, captureJaneliaWtSourceView, encodeJaneliaWtSourceViewPng,
  janeliaWtPlaneRgba, janeliaWtSourceIdentity, readJaneliaWtNativePlanes, readVerifiedJaneliaWtChunks, validateJaneliaWtSourceViewReplay,
  type JaneliaWtChunkToken, type JaneliaWtRenderToken, type JaneliaWtViewDocument } from "./janelia-wt-source-view.js";
import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
import styles from "./janelia-wt-bounded-reference-viewer.module.css";

type PlaneKind = "raw" | "nucleus";
type Paint = { scope: string; cssWidth: number; cssHeight: number };
type LoadState = { status: "loading" } | { status: "failed"; message: string } | { status: "ready"; token: JaneliaWtChunkToken };
type Snapshot = { raw: Paint | null; nucleus: Paint | null; capture: { scope: string; rendered: JaneliaWtRenderToken; document: JaneliaWtViewDocument } | null; png: { url: string; preview: string } | null };
const emptySnapshot = (): Snapshot => ({ raw: null, nucleus: null, capture: null, png: null });
const paintKey = (token: JaneliaWtChunkToken, slice: number, patch: boolean) => `${token.verificationSequence}:${slice}:${Number(patch)}`;

function SourcePlane({ plane, width, height, kind, scope, patchVisible, canvas, onPaint, onFailure }: {
  plane: Uint8Array; width: number; height: number; kind: PlaneKind; scope: string; patchVisible: boolean;
  canvas: RefObject<HTMLCanvasElement | null>; onPaint: (kind: PlaneKind, paint: Paint) => void;
  onFailure: (message: string) => void;
}) {
  const labelPlane = kind === "nucleus";
  useEffect(() => {
    const node = canvas.current, context = node?.getContext("2d");
    if (!node || !context) { queueMicrotask(() => onFailure("Native canvas rendering is unavailable in this browser.")); return; }
    const image = context.createImageData(width, height);
    image.data.set(janeliaWtPlaneRgba(plane, labelPlane));
    context.putImageData(image, 0, 0);
    let active = true;
    const notify = () => { if (active) { const rect = node.getBoundingClientRect(); onPaint(kind, { scope, cssWidth: rect.width, cssHeight: rect.height }); } };
    queueMicrotask(notify);
    const observer = new ResizeObserver(notify); observer.observe(node);
    return () => { active = false; observer.disconnect(); };
  }, [plane, width, height, labelPlane, kind, scope, canvas, onPaint, onFailure]);
  return <div className={styles.plane}>
    <canvas ref={canvas} width={width} height={height} role="img" aria-label={labelPlane ? `Native manual nucleus annotation plane. Amber is instance 2; cell class unknown. The raw patch locator is ${patchVisible ? "shown as a cyan rectangle" : "hidden"}.` : "Native raw electron microscopy Z plane in source grayscale. X increases right; Y increases downward."} />
    {labelPlane && patchVisible && <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="48" width="8" height="8" fill="none" stroke="#5ee5f5" strokeWidth="0.6" /></svg>}
  </div>;
}

export default function JaneliaWtBoundedReferenceViewer() {
  const id = useId();
  const [slice, setSlice] = useState(64);
  const [patchVisible, setPatchVisible] = useState(true);
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [fullSizePng, setFullSizePng] = useState(false);
  const rawCanvas = useRef<HTMLCanvasElement>(null), nucleusCanvas = useRef<HTMLCanvasElement>(null);
  const mounted = useRef(true), epoch = useRef(0), operation = useRef(0), abortRef = useRef<AbortController | null>(null);
  const loadedToken = useRef<JaneliaWtChunkToken | null>(null), sliceRef = useRef(64), patchRef = useRef(true);
  const paints = useRef<Partial<Record<PlaneKind, Paint>>>({});
  const pendingPaint = useRef<{ scope: string; resolve: () => void; reject: (error: Error) => void } | null>(null);
  useEffect(() => {
    mounted.current = true;
    const lifecycleEpoch = epoch, lifecycleOperation = operation;
    const controller = new AbortController(), own = ++operation.current; abortRef.current = controller;
    void readVerifiedJaneliaWtChunks({ signal: controller.signal }).then(token => {
      if (mounted.current && !controller.signal.aborted && operation.current === own) { loadedToken.current = token; setLoad({ status: "ready", token }); }
    }).catch((error: unknown) => { if (mounted.current && !controller.signal.aborted && operation.current === own) setLoad({ status: "failed", message: error instanceof Error ? error.message : "Source verification failed" }); });
    return () => {
      mounted.current = false; lifecycleEpoch.current++; lifecycleOperation.current++; abortRef.current?.abort(); loadedToken.current = null;
      pendingPaint.current?.reject(new Error("The native reference closed before restoration completed.")); pendingPaint.current = null;
    };
  }, []);
  const onFailure = useCallback((failure: string) => {
    if (!mounted.current) return;
    epoch.current++; loadedToken.current = null; paints.current = {};
    pendingPaint.current?.reject(new Error(failure)); pendingPaint.current = null;
    setSnapshot(emptySnapshot()); setEncoding(false); setLoad({ status: "failed", message: failure });
  }, []);
  useEffect(() => { const url = snapshot.png?.url; return () => { if (url) URL.revokeObjectURL(url); }; }, [snapshot.png?.url]);
  const onPaint = useCallback((kind: PlaneKind, paint: Paint) => {
    if (!mounted.current) return;
    const previous = paints.current[kind];
    if (previous?.scope !== paint.scope || previous.cssWidth !== paint.cssWidth || previous.cssHeight !== paint.cssHeight) {
      paints.current[kind] = paint; epoch.current++;
      setEncoding(false);
      setSnapshot(current => ({ ...current, [kind]: paint, capture: null, png: null }));
    }
    const pending = pendingPaint.current;
    if (pending && paints.current.raw?.scope === pending.scope && paints.current.nucleus?.scope === pending.scope
      && (paints.current.raw?.cssWidth ?? 0) > 0 && (paints.current.nucleus?.cssWidth ?? 0) > 0) {
      pendingPaint.current = null; pending.resolve();
    }
  }, []);
  const mapping = useMemo(() => getJaneliaWtSliceMapping(reference, slice), [slice]);
  const planes = useMemo(() => load.status === "ready" ? readJaneliaWtNativePlanes(load.token, slice) : null, [load, slice]);
  const scope = load.status === "ready" ? paintKey(load.token, slice, patchVisible) : "";
  const paintReady = load.status === "ready" && snapshot.raw?.scope === scope && snapshot.nucleus?.scope === scope && snapshot.raw.cssWidth > 0 && snapshot.nucleus.cssWidth > 0;
  const current = paintReady && snapshot.capture?.scope === scope ? snapshot.capture : null;
  const clearCapture = () => { epoch.current++; setEncoding(false); setSnapshot(value => ({ ...value, capture: null, png: null })); };
  const changeSlice = (next: number) => { clearCapture(); sliceRef.current = next; setSlice(next); setMessage(""); };
  const changePatch = (next: boolean) => { clearCapture(); patchRef.current = next; setPatchVisible(next); setMessage(""); };
  const actualRendered = async () => {
    const token = loadedToken.current, raw = rawCanvas.current, nucleus = nucleusCanvas.current;
    if (!token || !raw || !nucleus || raw.width !== 128 || raw.height !== 128 || nucleus.width !== 64 || nucleus.height !== 64) throw new Error("The two current native canvases are unavailable.");
    const currentScope = paintKey(token, sliceRef.current, patchRef.current);
    if (paints.current.raw?.scope !== currentScope || paints.current.nucleus?.scope !== currentScope) throw new Error("The new native planes have not finished drawing.");
    const outline = nucleus.parentElement?.querySelector("svg rect");
    if (patchRef.current ? !outline || [["x", "8"], ["y", "48"], ["width", "8"], ["height", "8"], ["stroke", "#5ee5f5"], ["stroke-width", "0.6"]].some(([name, value]) => outline.getAttribute(name) !== value) : Boolean(outline)) throw new Error("The actual source patch outline differs from the current view.");
    const rawContext = raw.getContext("2d"), nucleusContext = nucleus.getContext("2d");
    if (!rawContext || !nucleusContext) throw new Error("Native canvas pixels cannot be read.");
    const rect = (canvas: HTMLCanvasElement) => { const value = canvas.getBoundingClientRect(); return { cssWidth: value.width, cssHeight: value.height }; };
    return attestJaneliaWtRenderedPlanes(token, sliceRef.current, { raw: rawContext.getImageData(0, 0, 128, 128).data,
      nucleus: nucleusContext.getImageData(0, 0, 64, 64).data, rawPatchOutlineVisible: Boolean(outline),
      layout: { raw: rect(raw), nucleus: rect(nucleus), pixelRatio: window.devicePixelRatio, fit: "independent_native_planes" } });
  };
  const prepare = async () => {
    clearCapture(); const own = epoch.current;
    try {
      const rendered = await actualRendered();
      if (mounted.current && epoch.current === own) { setSnapshot(value => ({ ...value, capture: { scope, rendered, document: captureJaneliaWtSourceView(rendered) } })); setMessage("Current native pixels, source chunks and slice correspondence captured."); }
    } catch (error) { if (mounted.current && epoch.current === own) setMessage(error instanceof Error ? error.message : "Native capture failed."); }
  };
  const startFresh = () => {
    operation.current++; epoch.current++; abortRef.current?.abort(); pendingPaint.current?.reject(new Error("A new operation replaced the pending restoration.")); pendingPaint.current = null;
    loadedToken.current = null; paints.current = {}; setSnapshot(emptySnapshot()); setEncoding(false); setLoad({ status: "loading" });
    const controller = new AbortController(); abortRef.current = controller; return { controller, own: operation.current };
  };
  const recheck = async () => {
    const { controller, own } = startFresh(); setRestoring(false); setMessage("");
    try {
      const token = await readVerifiedJaneliaWtChunks({ signal: controller.signal, forceReload: true });
      if (mounted.current && operation.current === own && !controller.signal.aborted) { loadedToken.current = token; setLoad({ status: "ready", token }); setMessage("Both exact native source chunks were freshly rechecked."); }
    } catch (error) { if (mounted.current && operation.current === own) setLoad({ status: "failed", message: error instanceof Error ? error.message : "Fresh source verification failed." }); }
  };
  const replay = async () => {
    const previous = loadedToken.current; if (!previous) return;
    let document: JaneliaWtViewDocument;
    const before = epoch.current;
    try { document = JSON.parse(input) as JaneliaWtViewDocument; await validateJaneliaWtSourceViewReplay(document, previous); if (epoch.current !== before) throw new Error("The current view changed during restore preflight."); }
    catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : "Saved plane receipt is invalid."); return; }
    const { controller, own } = startFresh(); setRestoring(true); setMessage("Rechecking both native source chunks before restoring…");
    try {
      const token = await readVerifiedJaneliaWtChunks({ signal: controller.signal, forceReload: true });
      if (!mounted.current || operation.current !== own || controller.signal.aborted) return;
      const nextSlice = document.view.rawSlice, nextPatch = document.view.layers.rawPatchOutlineVisible, nextScope = paintKey(token, nextSlice, nextPatch);
      const applied = new Promise<void>((resolve, reject) => { pendingPaint.current = { scope: nextScope, resolve, reject }; });
      loadedToken.current = token; sliceRef.current = nextSlice; patchRef.current = nextPatch;
      setSlice(nextSlice); setPatchVisible(nextPatch); setLoad({ status: "ready", token });
      await applied;
      const renderEpoch = epoch.current, rendered = await actualRendered();
      await assertJaneliaWtSourceViewApplied(document, rendered, previous);
      if (!mounted.current || operation.current !== own || epoch.current !== renderEpoch || controller.signal.aborted) throw new Error("The native planes changed before restoration completed.");
      setSnapshot(value => ({ ...value, capture: { scope: nextScope, rendered, document: captureJaneliaWtSourceView(rendered) } }));
      setMessage("Both source chunks rechecked; actual native pixels, slice and patch outline restored. Display sizes adapt to this viewport.");
    } catch (error) {
      if (mounted.current && operation.current === own) { loadedToken.current = null; paints.current = {}; setSnapshot(emptySnapshot()); setMessage(""); setLoad({ status: "failed", message: error instanceof Error ? error.message : "Native restoration failed." }); }
    } finally { if (mounted.current && operation.current === own) setRestoring(false); }
  };
  const cancelRestore = () => { operation.current++; epoch.current++; abortRef.current?.abort(); pendingPaint.current?.reject(new Error("Restoration cancelled.")); pendingPaint.current = null; loadedToken.current = null; paints.current = {}; setSnapshot(emptySnapshot()); setLoad({ status: "failed", message: "Restoration cancelled. Recheck the source chunks to display verified planes." }); setRestoring(false); setEncoding(false); setMessage(""); };
  const save = (value: unknown, filename: string) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportPng = async () => {
    if (!current) return;
    setSnapshot(value => ({ ...value, png: null })); setEncoding(true); const own = epoch.current;
    const assertCurrent = () => { if (!mounted.current || epoch.current !== own || !loadedToken.current || paintKey(loadedToken.current, sliceRef.current, patchRef.current) !== current.scope) throw new Error("The native source view changed while the PNG was encoding."); };
    try {
      const png = await encodeJaneliaWtSourceViewPng(current.rendered, { assertCurrent }); assertCurrent();
      const url = URL.createObjectURL(png.blob); setSnapshot(value => ({ ...value, png: { url, preview: png.preview } }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `jrc_mus-sc-zp104a-native-plane-${sliceRef.current}.png`; anchor.click();
      setMessage("PNG prepared with the current native pixels and source disclosure footer.");
    } catch (error) { if (mounted.current && epoch.current === own) setMessage(error instanceof Error ? error.message : "PNG export failed."); }
    finally { if (mounted.current && epoch.current === own) setEncoding(false); }
  };
  const exportReceipt = () => {
    save(buildJaneliaWtPlaneReceipt(reference, slice), `jrc_mus-sc-zp104a-source-context-${slice}.json`);
  };
  return <section className={styles.panel} aria-labelledby={`${id}-title`} data-testid="janelia-wt-bounded-reference-viewer">
    <div className={styles.heading}><div><small>Janelia WT mouse spinal cord · source reference</small><h3 id={`${id}-title`}>Raw EM + manual nucleus annotation</h3></div><span>Cell class unknown</span></div>
    <p>Explore a small public source patch alongside its coarser manual nucleus annotation. The raw patch lies within manual nucleus instance 2. The displayed annotation is a partial object with no verified neuron type.</p>
    {load.status === "loading" && <p role="status">Loading and verifying the two source chunks…</p>}
    {load.status === "failed" && <p role="alert">{load.message}. No source image is displayed.</p>}
    {planes && <>
      <div className={styles.controls}><label htmlFor={`${id}-slice`}>Raw Z slice <output>{slice + 1} / 128</output><input id={`${id}-slice`} type="range" min="0" max="127" step="1" value={slice} disabled={restoring} onChange={(event) => changeSlice(Number(event.target.value))} /></label><button type="button" onClick={exportReceipt}>Export source receipt</button></div>
      <label className={styles.patchToggle}><input type="checkbox" checked={patchVisible} disabled={restoring} onChange={event => changePatch(event.target.checked)} />Show the raw patch location in the manual annotation plane</label>
      <div className={styles.grid}>
        <figure><SourcePlane plane={planes.raw} width={128} height={128} kind="raw" scope={scope} patchVisible={patchVisible} canvas={rawCanvas} onPaint={onPaint} onFailure={onFailure} /><figcaption><strong>Raw EM · 6 nm source samples</strong><span>128 × 128 native pixels · Z sample {(mapping.rawSampleZNanometre / 1000).toFixed(3)} µm</span></figcaption></figure>
        <figure><SourcePlane plane={planes.nucleus} width={64} height={64} kind="nucleus" scope={scope} patchVisible={patchVisible} canvas={nucleusCanvas} onPaint={onPaint} onFailure={onFailure} /><figcaption><strong>Manual nucleus · 96 nm source samples</strong><span>64 × 64 native labels · Z sample {(mapping.labelSampleZNanometre / 1000).toFixed(3)} µm</span></figcaption></figure>
      </div>
      <p className={styles.legend}><span className={styles.amber} />Manual nucleus instance 2 <span className={styles.cyan} />Raw patch location <span className={styles.dark} />Annotation absent</p>
      <p className={styles.notice}>The {patchVisible ? "visible" : "hidden"} cyan rectangle locates the raw patch in the source annotation grid. It is a patch outline. All annotation samples in this patch have value 2; a nucleus boundary is not visible within this raw patch. Each displayed annotation plane corresponds to a group of 16 raw Z samples.</p>
    </>}
    <details className={styles.viewControls} aria-label="Janelia WT native plane view controls">
      <summary>Save or restore these native planes</summary>
      <p>Capture the two current canvases, their source bytes and the raw-to-label slice correspondence. Restore rechecks both chunks before drawing the saved slice and patch outline. Display sizes adapt to the viewport.</p>
      <div className={styles.controls}>
        <button type="button" disabled={!paintReady || restoring} onClick={() => { void prepare(); }}>Capture native planes</button>
        <button type="button" disabled={!current || restoring} onClick={() => { if (current) save(current.document, `jrc_mus-sc-zp104a-native-plane-${slice}.json`); }}>Export current plane JSON</button>
        <button type="button" disabled={!current || restoring || encoding} onClick={() => { void exportPng(); }}>{encoding ? "Preparing PNG…" : "Export current plane PNG"}</button>
        <button type="button" disabled={restoring || load.status === "loading"} onClick={() => { void recheck(); }}>Recheck source chunks</button>
        {restoring && <button type="button" onClick={cancelRestore}>Cancel restoration</button>}
      </div>
      {planes && !paintReady && <p role="status">Preparing the current native canvases…</p>}
      {current && <textarea readOnly aria-label="Current Janelia WT native plane view receipt" value={JSON.stringify(current.document, null, 2)} rows={8} />}
      {current && snapshot.png && <details className={styles.pngPreview}><summary>Preview exported native-plane PNG</summary><a href={snapshot.png.url} download={`jrc_mus-sc-zp104a-native-plane-${slice}.png`}>Download exported PNG</a>
        <label className={styles.patchToggle}><input type="checkbox" checked={fullSizePng} onChange={event => setFullSizePng(event.target.checked)} />Show PNG at its full exported width</label>
        {/* The preview is the exact encoded local export. */}
        <div className={styles.pngViewport}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={fullSizePng ? styles.fullSizePng : undefined} src={snapshot.png.preview} alt={`Janelia WT raw slice ${slice + 1} and paired native manual annotation, with source disclosure footer`} />
        </div>
      </details>}
      <label>Paste a saved native-plane view<textarea aria-label="Saved Janelia WT native plane view" value={input} onChange={event => setInput(event.target.value)} rows={5} disabled={restoring} /></label>
      <button type="button" disabled={!input.trim() || load.status !== "ready" || restoring} onClick={() => { void replay(); }}>Restore native planes</button>
      {message && <p role="status">{message}</p>}
      <p className={styles.notice}>Export source receipt retains static source context. Current plane JSON and PNG additionally record this verified load and actual canvas pixels. This partial reference establishes no interneuron identity or biological measurement.</p>
    </details>
    <SourceIdentityHierarchyPanel hierarchy={janeliaWtSourceIdentity()} />
    <p className={styles.notice}>This source reference stays the same when the atlas cell selection changes. The source’s nominal volume description and array extent differ; biological measurements and atlas registration remain unavailable.</p>
    <details><summary>Source coordinates, reuse and scope</summary><dl className={styles.facts}>
      <div><dt>Exact parent volume</dt><dd>{reference.datasetId}</dd></div><div><dt>Source frame</dt><dd>{reference.sourceFrame}; array axes Z, Y, X</dd></div>
      <div><dt>Raw source affine</dt><dd>Global sample index × 6 nm; translation 0 nm</dd></div><div><dt>Nucleus source affine</dt><dd>Global sample index × 96 nm + 45 nm</dd></div>
      <div><dt>Plane correspondence</dt><dd>Native label sample at the mean coordinate of its 16 raw samples. Images retain native arrays; no interpolation.</dd></div>
      <div><dt>Object scope</dt><dd>{reference.nucleus.objectLabel}; partial annotation; no stable biological cell ID</dd></div><div><dt>Reuse</dt><dd>Both exact Figshare v1 records: CC BY 4.0. Two source chunks decompressed losslessly; label colors and patch rectangle added for display.</dd></div>
      <div><dt>Unresolved extent</dt><dd>Nominal XYZ: 40 × 30 × 75 µm; live array XYZ: 54 × 42 × 76.188 µm</dd></div>
      <div><dt>Evidence scope</dt><dd>0 selected-cell joins; 0 interneuron objects; 0 atlas registrations; 0 biological measurements.</dd></div>
    </dl><p>{reference.sourceRecords.map((record) => <span className={styles.source} key={record.id}><a href={record.url} target="_blank" rel="noreferrer">{record.title}</a><small>{record.citation}</small></span>)}</p></details>
  </section>;
}
