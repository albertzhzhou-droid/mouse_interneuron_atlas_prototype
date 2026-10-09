"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { version } from "../package.json";
import { exportIndependentSourceObject, findIndependentSourceObject, listIndependentSourceObjects } from "./independent-source-objects.js";
import { independentSourceVisiblePayload, readIndependentSourceLocation, writeIndependentSourceLocation } from "./independent-source-workspace-state.js";
import { INDEPENDENT_OBJECT_VIEW_INDEX as index, assertIndependentObjectViewApplied, exportIndependentObjectView, preflightIndependentObjectView, validateIndependentObjectView } from "./independent-source-object-view.js";
import type { IndependentObjectViewDocument } from "./independent-source-object-view.js";
import { encodeIndependentObjectPng } from "./independent-source-object-png.js";
import type { IndependentObject, IndependentPayload, IndependentViewState } from "./independent-source-workspace-types";
import { independentSourceIdentityHierarchy } from "./source-object-identity.js";
import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
import { useSourceListRovingFocus } from "./useSourceListRovingFocus";
import "./independent-source-workspace.css";
const Viewport = lazy(() => import("./IndependentSourceObjectViewport"));
type Source = { sourceId: string; label?: string; title?: string; sourceName?: string; objectCount?: number; unit?: string; scope?: string; counts: { value: number; unit: string; scopeKey: string; derivedFrom: unknown }[] };
const sources = index.sources as Source[];
type Location = { sourceId: string; key: string | null; query: string; page: number; error: string | null };
type LoadState = { key: string | null; epoch: number; status: "idle" | "loading" | "ready" | "error"; payload: IndependentPayload | null; message: string; loadMilliseconds: number };
const PAGE_SIZE = 25;

function saveJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }));
  const link = document.createElement("a"); link.download = filename; link.href = url; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function IndependentSourceObjectWorkspace() {
  const [location, setLocation] = useState<Location>({ sourceId: sources[0]?.sourceId ?? "", key: null, query: "", page: 0, error: null });
  const [epoch, setEpoch] = useState(0);
  const [load, setLoad] = useState<LoadState>({ key: null, epoch: 0, status: "idle", payload: null, message: "", loadMilliseconds: 0 });
  const [view, setView] = useState<IndependentViewState | null>(null);
  const [restoredView, setRestoredView] = useState<IndependentViewState | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [includeDerivedShell, setIncludeDerivedShell] = useState(false);
  const [captured, setCaptured] = useState<IndependentObjectViewDocument | null>(null);
  const [savedText, setSavedText] = useState("");
  const [captureStatus, setCaptureStatus] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [png, setPng] = useState<{ url: string; preview: string } | null>(null);
  const [fullSize, setFullSize] = useState(false);
  const mounted = useRef(true);
  const publication = useRef(0);
  const fileRead = useRef(0);
  const loadedPayload = useRef<IndependentPayload | null>(null);
  const loadedRevision = useRef(-1);
  const actual = useRef<{ view: IndependentViewState; canvas: HTMLCanvasElement | null } | null>(null);
  const pending = useRef<{ document: IndependentObjectViewDocument; revision: number; previousPayload: IndependentPayload | null } | null>(null);
  const invalidateCapture = useCallback(() => { publication.current += 1; setCaptured(null); setPng(null); setEncoding(false); setCaptureStatus(""); }, []);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; publication.current += 1; fileRead.current += 1; loadedPayload.current = null; actual.current = null; }; }, []);
  useEffect(() => () => { if (png) URL.revokeObjectURL(png.url); }, [png]);
  useEffect(() => {
    const restore = () => {
      fileRead.current += 1; invalidateCapture(); loadedPayload.current = null; actual.current = null; pending.current = null;
      setView(null); setRestoredView(null); setIncludeDerivedShell(false); setRestoring(false); setImportError(null);
      setLocation(readIndependentSourceLocation(index, window.location.href)); setEpoch(value => value + 1);
    };
    window.addEventListener("popstate", restore); const timer = window.setTimeout(restore, 0);
    return () => { window.clearTimeout(timer); window.removeEventListener("popstate", restore); };
  }, [invalidateCapture]);
  const page = useMemo(() => listIndependentSourceObjects(index, { sourceId: location.sourceId, query: location.query, offset: location.page * PAGE_SIZE, limit: PAGE_SIZE }), [location.sourceId, location.query, location.page]);
  const record = useMemo(() => location.error || !location.key ? null : findIndependentSourceObject(index, location.key) as IndependentObject | null, [location.error, location.key]);
  const listFocus = useSourceListRovingFocus(page.records.map((item: IndependentObject) => item.key), record?.key ?? null, "independent-source-objects");
  const payload = (load.epoch === epoch ? independentSourceVisiblePayload(record?.key ?? null, load) : null) as IndependentPayload | null;
  const currentView = record && view?.key === record.key && view.verificationRevision === epoch && payload ? view : null;
  const sourceIdentity = record ? independentSourceIdentityHierarchy(index, record.key) : null;
  const changeLocation = (next: Location) => {
    if (next.key !== location.key || next.sourceId !== location.sourceId) {
      fileRead.current += 1; invalidateCapture(); loadedPayload.current = null; actual.current = null; pending.current = null;
      setView(null); setEpoch(value => value + 1); setRestoredView(null); setIncludeDerivedShell(false); setRestoring(false); setImportError(null);
    }
    setLocation(next); window.history.pushState(null, "", writeIndependentSourceLocation(window.location.href, next));
  };
  const updateView = useCallback((next: IndependentViewState, canvas?: HTMLCanvasElement) => {
    const source = loadedPayload.current;
    if (!mounted.current || !source || next.key !== source.key || next.verificationRevision !== loadedRevision.current) return;
    invalidateCapture(); actual.current = { view: next, canvas: canvas ?? null }; setView(next);
    const plan = pending.current;
    if (!plan || plan.revision !== next.verificationRevision) return;
    try {
      assertIndependentObjectViewApplied(plan.document, source, next, version, plan.previousPayload, plan.revision);
      setCaptured(exportIndependentObjectView(source.key, source, next, version, plan.revision)); pending.current = null; setRestoring(false);
      setCaptureStatus("Current source verification and actual pose, layers, clipping and source transform restored. Raster size and page events adapt to this page.");
    } catch (error) {
      loadedPayload.current = null; actual.current = null; setView(null); setRestoring(false);
      setLoad({ key: next.key, epoch: next.verificationRevision, status: "error", payload: null, loadMilliseconds: 0, message: error instanceof Error ? error.message : "The actual source view did not match the saved receipt." });
    }
  }, [invalidateCapture]);
  const invalidateView = useCallback(() => { actual.current = null; setView(null); invalidateCapture(); }, [invalidateCapture]);

  useEffect(() => {
    if (!record) return;
    const controller = new AbortController(); let active = true;
    const started = performance.now();
    // Delayed state publication also preserves a synchronous render-time key gate.
    const timer = window.setTimeout(() => {
      if (active) setLoad({ key: record.key, epoch, status: "loading", payload: null, message: "Checking this exact source scope and object identity…", loadMilliseconds: 0 });
    }, 0);
    void import("./independent-source-object-loader.js").then(({ loadIndependentSourceObject }) => loadIndependentSourceObject(record, { signal: controller.signal, includeDerivedShell, forceReload: epoch > 0 })).then((next: IndependentPayload) => {
      if (active) { loadedPayload.current = next; loadedRevision.current = epoch; setLoad({ key: record.key, epoch, status: "ready", payload: next, message: next.kind === "link_only" ? "Exact source row located; no licensed image asset admitted." : "Exact source object verified.", loadMilliseconds: performance.now() - started }); }
    }).catch((error: unknown) => {
      if (active && !(error instanceof Error && error.name === "AbortError")) {
        loadedPayload.current = null; actual.current = null; invalidateCapture(); setView(null); setRestoring(false);
        setLoad({ key: record.key, epoch, status: "error", payload: null, message: error instanceof Error ? error.message : "The exact source asset could not be verified.", loadMilliseconds: performance.now() - started });
      }
    });
    return () => { active = false; window.clearTimeout(timer); controller.abort(); };
  }, [record, epoch, includeDerivedShell, invalidateCapture]);

  const changeQuery = (query: string) => {
    const needle = query.trim().toLocaleLowerCase("en-US");
    const retainsSelection = record && `${record.title} ${record.sourceObjectId} ${record.releaseId}`.toLocaleLowerCase("en-US").includes(needle);
    changeLocation({ ...location, query, page: 0, key: retainsSelection ? location.key : null, error: null });
  };
  const captureCurrent = () => {
    const source = loadedPayload.current, frame = actual.current;
    if (!record || !payload || source !== payload || !currentView || frame?.view !== currentView) throw new Error("The current source and actual renderer are not ready.");
    invalidateCapture(); const document = exportIndependentObjectView(record.key, source, currentView, version, epoch); setCaptured(document);
    setCaptureStatus("Current source scope and actual view captured."); return { document, source, canvas: frame.canvas, frame };
  };
  const restoreDocument = (document: IndependentObjectViewDocument) => {
    const restored = preflightIndependentObjectView(document, version), previous = loadedPayload.current?.key === restored.record.key ? loadedPayload.current : null;
    const desiredShell = document.view.layers.some(layer => layer.id === "derived-open-shell");
    if (previous && previous.meshes.some(mesh => mesh.componentId === "derived-open-shell") === desiredShell) validateIndependentObjectView(document, previous, version);
    const revision = epoch + 1; invalidateCapture(); fileRead.current += 1; loadedPayload.current = null; actual.current = null; setView(null);
    pending.current = { document, revision, previousPayload: previous }; setRestoredView(restored.view); setIncludeDerivedShell(restored.view.layers.some(layer => layer.id === "derived-open-shell"));
    const next = { sourceId: restored.record.sourceId, key: restored.record.key, query: "", page: 0, error: null };
    setLocation(next); setEpoch(revision); setRestoring(true); setImportError(null); setCaptureStatus("Freshly rechecking this source before restoring its actual view…");
    window.history.pushState(null, "", writeIndependentSourceLocation(window.location.href, next));
  };
  const recheck = (resume: boolean) => {
    if (!record) return;
    const revision = epoch + 1, plan = pending.current; invalidateCapture(); fileRead.current += 1; loadedPayload.current = null; actual.current = null; setView(null); setEpoch(revision); setImportError(null);
    if (resume && plan) { pending.current = { ...plan, revision }; setRestoredView(plan.document.view); setRestoring(true); }
    else { pending.current = null; setRestoredView(null); setRestoring(false); }
  };
  const exportPng = async () => {
    let token = -1;
    try {
      const capture = captureCurrent(); token = publication.current; setEncoding(true);
      const assertCurrent = () => { if (!mounted.current || token !== publication.current || loadedPayload.current !== capture.source || actual.current !== capture.frame) throw new Error("The source or actual view changed while preparing the PNG."); };
      const result = await encodeIndependentObjectPng(capture.canvas, capture.document, capture.source, version, assertCurrent); assertCurrent();
      const url = URL.createObjectURL(result.blob); setPng({ url, preview: result.preview });
      const link = document.createElement("a"); link.download = `source-view-${record?.sourceId}.png`; link.href = url; document.body.appendChild(link); link.click(); link.remove();
      setCaptureStatus("PNG prepared with current source, actual view and complete source disclosures.");
    } catch (error) { if (mounted.current && (token < 0 || token === publication.current)) setCaptureStatus(error instanceof Error ? error.message : "PNG could not be prepared."); }
    finally { if (mounted.current && token === publication.current) setEncoding(false); }
  };
  return <section className="independent-object-workspace" aria-labelledby="independent-object-workspace-title">
    <header><p>EXACT SOURCE OBJECTS · UPG-251 / 252</p><h3 id="independent-object-workspace-title">Explore a specific structural object</h3><p>Select a source, then an exact record. Each source retains its own object kind, version, counts and missingness.</p></header>
    <div className="independent-object-controls">
      <label htmlFor="independent-object-source">Source<select id="independent-object-source" value={location.sourceId} onChange={(event) => changeLocation({ sourceId: event.target.value, key: null, query: "", page: 0, error: null })}>{!sources.some((source) => source.sourceId === location.sourceId) && <option value={location.sourceId}>Unavailable source</option>}{sources.map((source) => <option key={source.sourceId} value={source.sourceId}>{source.label ?? source.title ?? source.sourceName ?? source.sourceId}</option>)}</select></label>
      <label htmlFor="independent-object-search">Find an object<input id="independent-object-search" type="search" value={location.query} onChange={(event) => changeQuery(event.target.value)} placeholder="Exact ID or source row" /></label>
    </div>
    <label className="independent-object-import">Restore an exported view<input type="file" accept="application/json,.json" onChange={async event => {
      const input = event.target, file = input.files?.[0]; if (!file) return; const request = ++fileRead.current;
      try { const document = JSON.parse(await file.text()) as IndependentObjectViewDocument; if (mounted.current && request === fileRead.current) restoreDocument(document); }
      catch (error) { if (mounted.current && request === fileRead.current) setImportError(error instanceof Error ? error.message : "The view could not be restored."); }
      finally { input.value = ""; }
    }} /></label>
    {importError && <p role="alert">{importError}</p>}
    {location.error && <p role="alert">{location.error}</p>}
    <div className="independent-object-layout">
      <div className="independent-object-list">
        <p role="status">{page.total.toLocaleString()} matching entries</p>
        <p className="independent-object-boundary">{sources.find((source) => source.sourceId === location.sourceId)?.counts.map((count) => `${count.value.toLocaleString()} ${count.unit.replaceAll("_", " ")}`).join(" · ")}. Counts retain each source&apos;s own units.</p>
        <p id={listFocus.helpId} className="source-list-keyboard-help">Use Up/Down or Home/End to move through this page. Enter or Space selects an object; Tab leaves the list.</p>
        <ul aria-label="Exact objects in the selected source" aria-describedby={listFocus.helpId}>{page.records.map((item: IndependentObject) => <li key={item.key}><button {...listFocus.buttonProps(item.key)} type="button" aria-pressed={record?.key === item.key} onClick={() => changeLocation({ ...location, key: item.key, error: null })}><strong>{item.title}</strong><span>{item.objectKind.replaceAll("_", " ")} · {item.sourceObjectId}</span></button></li>)}</ul>
        {!page.total && <p>No matching source object. The search does not create a replacement.</p>}
        <nav aria-label="Source object pages"><button type="button" disabled={location.page === 0} onClick={() => changeLocation({ ...location, page: location.page - 1 })}>Previous</button><span>Page {location.page + 1} / {Math.max(1, Math.ceil(page.total / PAGE_SIZE))}</span><button type="button" disabled={(location.page + 1) * PAGE_SIZE >= page.total} onClick={() => changeLocation({ ...location, page: location.page + 1 })}>Next</button></nav>
      </div>
      <div className="independent-object-detail" data-selected-object={record?.key ?? ""}>
        {!record && <p>Select an exact source object to view its verified geometry and evidence.</p>}
        {record && <>
          <h4>{record.title}</h4><p><code>{record.sourceObjectId}</code> · {record.objectKind.replaceAll("_", " ")}</p><p className="independent-object-release">{record.releaseId}</p>
          <p className="independent-object-boundary">{[record.context.species, record.context.region, record.context.age, record.context.scope].filter((value) => typeof value === "string").join(" · ")}</p>
          {record.components.some((component) => component.id === "derived-open-shell") && <label><input type="checkbox" checked={includeDerivedShell} onChange={(event) => { invalidateCapture(); loadedPayload.current = null; actual.current = null; pending.current = null; fileRead.current += 1; setView(null); setRestoring(false); setIncludeDerivedShell(event.target.checked); setEpoch((value) => value + 1); setRestoredView(null); }} />Load the separately verified DER open shell · interpolation only; no observed membrane or volume</label>}
          {!payload && <p role={load.key === record.key && load.status === "error" ? "alert" : "status"}>{load.key === record.key ? load.message : "Verifying the newly selected object…"}</p>}
          {!payload && load.key === record.key && load.epoch === epoch && load.status === "error" && <button type="button" onClick={() => recheck(true)}>Retry exact source</button>}
          {payload && <Suspense fallback={<p role="status">Preparing the selected object view…</p>}><Viewport key={`${record.key}:${epoch}`} record={record} payload={payload} verificationRevision={epoch} restoredView={restoredView?.key === record.key ? restoredView : null} loadMilliseconds={load.loadMilliseconds} onViewState={updateView} onViewInvalidated={invalidateView} onImageExport={() => { void exportPng(); }} /></Suspense>}
          <dl><div><dt>Source coordinates</dt><dd>{record.coordinateFrame.dimensions}D · {record.coordinateFrame.frame ?? "frame not established"} · {record.coordinateFrame.unit ?? "physical unit not established"}</dd></div>{record.counts.map((count, itemIndex) => <div key={`${count.scopeKey}:${count.unit}:${itemIndex}`}><dt>{count.unit.replaceAll("_", " ")}</dt><dd>{count.value.toLocaleString()} · {count.scopeKey}</dd></div>)}</dl>
          {payload && payload.points.length > 0 && <dl>{payload.points.map((point, pointIndex) => <div key={pointIndex}><dt>Exact source point{point.sourceMatrixColumn != null ? ` · column ${point.sourceMatrixColumn}` : ""}</dt><dd>{point.position.join(", ")}{point.frameIndex != null ? ` · frame index ${point.frameIndex}` : ""} · {record.coordinateFrame.unit ?? "uncalibrated native values"}</dd></div>)}</dl>}
          <div className="independent-object-actions"><a href={record.sourceUrl} target="_blank" rel="noreferrer">Exact source ↗</a><button type="button" onClick={() => saveJson({ ...exportIndependentSourceObject(record, payload?.receipt ?? null), sourceIdentity, applicationVersion: version, status: payload ? payload.receipt.status : load.key === record.key && load.epoch === epoch ? load.status : "loading" }, `source-object-${record.sourceId}.json`)}>Export object evidence</button><button type="button" disabled={!currentView} onClick={() => { if (currentView) { try { saveJson(captureCurrent().document, `source-view-${record.sourceId}.json`); } catch (error) { setImportError(error instanceof Error ? error.message : "The current view is unavailable."); } } }}>Export current view</button><button type="button" onClick={() => changeLocation({ ...location, key: null, error: null })}>Clear selection</button></div>
          {currentView && <p className="independent-object-timing">Source checks ready in {load.loadMilliseconds.toFixed(0)} ms · view ready in {currentView.renderMilliseconds.toFixed(0)} ms. Measured on this device for this selection; no performance budget is inferred.</p>}
          <details className="independent-object-view-controls"><summary>Save or restore this exact source view</summary>
            <p>Current JSON binds this exact source, actual view and specified build. Fresh restore retains each source’s byte-verification scope; source-only references do not become verified image or annotation files.</p>
            <div className="independent-object-actions">
              <button type="button" disabled={!currentView || restoring} onClick={() => { try { captureCurrent(); } catch (error) { setImportError(error instanceof Error ? error.message : "The current view is unavailable."); } }}>Capture current source view</button>
              <button type="button" disabled={!currentView || restoring || encoding} onClick={() => { void exportPng(); }}>{encoding ? "Preparing source PNG…" : "Export source-view PNG"}</button>
              <button type="button" disabled={restoring} onClick={() => recheck(false)}>Recheck exact source</button>
            </div>
            {captured && <textarea readOnly aria-label="Current independent source view receipt" value={JSON.stringify(captured, null, 2)} />}
            {png && <details><summary>Preview exported source-view PNG</summary><a href={png.url} download={`source-view-${record.sourceId}.png`}>Download exported source PNG</a>
              <label className="independent-object-png-size"><input type="checkbox" checked={fullSize} onChange={event => setFullSize(event.target.checked)} />Show PNG at its full exported width</label>
              <div className="independent-object-png-scroll">{/* Keep the verified local PNG at its original raster dimensions. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={fullSize ? "independent-object-png-full" : undefined} src={png.preview} alt={`${record.title} current source-view PNG with source disclosure footer`} /></div>
            </details>}
            <label>Saved source view receipt<textarea value={savedText} onChange={event => setSavedText(event.target.value)} placeholder="Paste an exported source view receipt, or choose its JSON file above." /></label>
            <button type="button" disabled={!savedText.trim() || restoring} onClick={() => { try { restoreDocument(JSON.parse(savedText) as IndependentObjectViewDocument); } catch (error) { setImportError(error instanceof Error ? error.message : "The source view could not be restored."); } }}>Restore saved source view</button>
            {captureStatus && <p role="status">{captureStatus}</p>}
          </details>
          {sourceIdentity && <SourceIdentityHierarchyPanel hierarchy={sourceIdentity} />}
          <details><summary>Structure availability, exact relationships and file receipts</summary><pre>{JSON.stringify({ coverage: record.structureCoverage, context: record.context, relationships: record.relationships, components: record.components, files: record.files, verification: payload?.receipt ?? null, actualView: currentView }, null, 2)}</pre></details>
        </>}
      </div>
    </div>
  </section>;
}
