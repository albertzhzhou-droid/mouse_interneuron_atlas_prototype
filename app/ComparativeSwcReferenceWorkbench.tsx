"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import contract from "../data/comparative-swc-reference-0.1.json";
import { comparativeSwcNodesCsv, createComparativeSwcReferenceIndex, loadComparativeSwcReference } from "./comparative-swc-reference.js";
import type { ComparativeObject, ComparativePayload } from "./comparative-swc-reference.js";
import type { IndependentViewState } from "./independent-source-workspace-types";
import IndependentSourceObjectViewport from "./IndependentSourceObjectViewport";
import { comparativeSourceIdentityHierarchy, comparativeSourceCoDisplayRelationship, exportComparativeSwcView, validateComparativeSwcViewReplay, assertComparativeSwcViewApplied, type ComparativeViewDocument } from "./comparative-swc-view-replay.js";
import { encodeComparativeSwcPng } from "./comparative-swc-png-export.js";
import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
import { version as applicationVersion } from "../package.json";
import "./comparative-swc-reference.css";

const index = createComparativeSwcReferenceIndex(contract);
function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type LoadState = { revision: number; status: "loading" | "ready" | "error"; payload: ComparativePayload | null; milliseconds: number; error: string | null };

function SourceCard({ object }: { object: ComparativeObject }) {
  const [revision, setRevision] = useState(1);
  const [load, setLoad] = useState<LoadState>({ revision: 0, status: "loading", payload: null, milliseconds: 0, error: null });
  const [view, setView] = useState<IndependentViewState | null>(null);
  const [restorePlan, setRestorePlan] = useState<{ revision: number; view: IndependentViewState } | null>(null);
  const [receiptText, setReceiptText] = useState("");
  const [receiptStatus, setReceiptStatus] = useState("");
  const [captured, setCaptured] = useState<ComparativeViewDocument | null>(null);
  const [png, setPng] = useState<{url:string;preview:string}|null>(null);
  const [encoding, setEncoding] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [fullSizePng, setFullSizePng] = useState(false);
  const mounted = useRef(false), epoch = useRef(0);
  const loadedPayload = useRef<ComparativePayload | null>(null);
  const actual = useRef<{view:IndependentViewState;canvas:HTMLCanvasElement}|null>(null);
  const pendingRestore = useRef<{revision:number;document:ComparativeViewDocument;previous:ComparativePayload}|null>(null);
  const invalidateCapture = useCallback(() => { epoch.current++; setCaptured(null); setPng(null); setEncoding(false); }, []);
  const onViewInvalidated = useCallback(() => { actual.current=null; setView(null); invalidateCapture(); }, [invalidateCapture]);
  useEffect(() => {
    mounted.current=true; const lifecycleEpoch=epoch;
    return () => {mounted.current=false;lifecycleEpoch.current++;actual.current=null;loadedPayload.current=null;};
  }, []);
  useEffect(() => {const url=png?.url;return ()=>{if(url)URL.revokeObjectURL(url);};}, [png?.url]);
  const onViewState = useCallback((state: IndependentViewState, canvas?:HTMLCanvasElement) => {
    if(!mounted.current || state.key!==object.key || state.verificationRevision!==revision)return;
    invalidateCapture();actual.current=state.status==='rendered'&&canvas?{view:state,canvas}:null;setView(state);
    const pending=pendingRestore.current, payload=loadedPayload.current;
    if(pending?.revision===revision && payload){
      try{
        if(!actual.current)throw new Error("The native graphics renderer could not restore the source view.");
        assertComparativeSwcViewApplied(index,pending.document,payload,state,applicationVersion,pending.previous,revision);
        setCaptured(exportComparativeSwcView(index,object.key,payload,state,applicationVersion,revision));
        pendingRestore.current=null;setRestoring(false);setReceiptStatus("All three exact source files freshly rechecked; actual camera, layers, clipping and source transform restored. Raster sizes adapt to this viewport.");
      }catch(error){
        actual.current=null;loadedPayload.current=null;setView(null);setRestoring(false);
        setLoad({revision,status:'error',payload:null,milliseconds:0,error:error instanceof Error?error.message:'Applied source view differs.'});
        setReceiptStatus("");
      }
    }
  }, [object.key, revision, invalidateCapture]);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const started = performance.now();
    void loadComparativeSwcReference(object, { signal: controller.signal, forceReload:revision>1 }).then((payload) => {
      if (active && !controller.signal.aborted) {loadedPayload.current=payload;setLoad({ revision, status: "ready", payload, milliseconds: performance.now() - started, error: null });}
    }).catch((error: unknown) => {
      if (active && !controller.signal.aborted) {loadedPayload.current=null;actual.current=null;setView(null);invalidateCapture();setRestoring(false);setReceiptStatus("");setLoad({ revision, status: "error", payload: null, milliseconds: performance.now() - started, error: error instanceof Error ? error.message : "Exact source verification failed." });}
    });
    return () => { active = false; controller.abort(); };
  }, [object, revision, invalidateCapture]);
  const current = load.revision === revision ? load : null;
  const payload = current?.status === "ready" ? current.payload : null;
  const activeView = payload && view?.key === object.key && view.verificationRevision === revision ? view : null;
  const captureView = () => {
    const binding=actual.current, currentPayload=loadedPayload.current;
    if (!payload || !activeView || !binding || !currentPayload || currentPayload!==payload || binding.view!==activeView) throw new Error("The current source canvas has not finished rendering.");
    if(binding.canvas.width!==activeView.renderer.width || binding.canvas.height!==activeView.renderer.height)throw new Error("The current source canvas changed size.");
    invalidateCapture();
    const document=exportComparativeSwcView(index,object.key,payload,activeView,applicationVersion,revision);
    setCaptured(document);return {document,canvas:binding.canvas,payload};
  };
  const restoreView = () => {
    if (!payload) return;
    try {
      const parsed: unknown = JSON.parse(receiptText);
      const result = validateComparativeSwcViewReplay(index, parsed, payload, applicationVersion, activeView?.renderer.version ?? null);
      if (result.record.key !== object.key) throw new Error("The receipt belongs to another source reconstruction.");
      const nextRevision = revision + 1;
      pendingRestore.current={revision:nextRevision,document:parsed as ComparativeViewDocument,previous:payload};
      loadedPayload.current=null;actual.current=null;invalidateCapture();setView(null);setRestoring(true);setRestorePlan({ revision: nextRevision, view: result.view });setRevision(nextRevision);
      setReceiptStatus("Rechecking all three exact source files before restoring the view…");
    } catch (error) { setReceiptStatus(`View receipt rejected: ${error instanceof Error ? error.message : "Invalid view receipt."}`); }
  };
  const reloadSource = (resume:boolean) => {
    const nextRevision=revision+1, pending=resume?pendingRestore.current:null;
    if(pending){pendingRestore.current={...pending,revision:nextRevision};setRestorePlan({revision:nextRevision,view:pending.document.view});}else{pendingRestore.current=null;setRestorePlan(null);}
    loadedPayload.current=null;actual.current=null;invalidateCapture();setView(null);setRestoring(Boolean(pending));setRevision(nextRevision);setReceiptStatus("");
  };
  const exportPng = async () => {
    let own=epoch.current;
    try{
      const source=captureView();own=epoch.current;setEncoding(true);
      const assertCurrent=()=>{if(!mounted.current || epoch.current!==own || loadedPayload.current!==source.payload || !actual.current || actual.current.canvas!==source.canvas)throw new Error("The source view changed while the PNG was encoding.");};
      const result=await encodeComparativeSwcPng(source.canvas,source.document,{index,payload:source.payload,applicationVersion,rendererVersion:source.document.view.renderer.version},assertCurrent);
      assertCurrent();const url=URL.createObjectURL(result.blob);setPng({url,preview:result.preview});
      const link=document.createElement('a');link.href=url;link.download=`comparative-swc-${object.sourceObjectId}-source-view.png`;link.click();setReceiptStatus("PNG prepared from the current canvas with exact source, camera and scientific-scope disclosures.");
    }catch(error){if(mounted.current&&epoch.current===own)setReceiptStatus(error instanceof Error?error.message:'Source PNG failed.');}
    finally{if(mounted.current&&epoch.current===own)setEncoding(false);}
  };
  const metrics = object.context.computedFromExactSwc;
  const raw = object.context.rawMetadata;
  return <article className="comparative-swc-card" data-testid="comparative-swc-card" data-source-object-id={object.sourceObjectId}>
    <h4>{object.title}</h4>
    <p><strong>{object.context.species}</strong> · {object.context.name} · one independently framed source reconstruction</p>
    <p>Exact repository fields: {String(raw.min_age)}–{String(raw.max_age)} {String(raw.age_scale)}; sex {String(raw.gender)}; {Array.isArray(raw.brain_region) ? raw.brain_region.join(" / ") : "region unknown"}. Cohort fields remain source assertions.</p>
    {!current || current.status === "loading" ? <p role="status">Checking the exact API, SWC and current morphometry files…</p> : null}
    {current?.status === "error" && <p role="alert">{current.error} Source geometry is withheld. <button type="button" onClick={() => { reloadSource(true); }}>Retry exact files</button></p>}
    {payload && <IndependentSourceObjectViewport key={`${object.key}:${revision}`} record={object} payload={payload} loadMilliseconds={current?.milliseconds ?? 0} verificationRevision={revision} restoredView={restorePlan?.revision === revision ? restorePlan.view : null} onViewState={onViewState} onViewInvalidated={onViewInvalidated} onImageExport={() => { void exportPng(); }} />}
    {payload && <SourceIdentityHierarchyPanel hierarchy={comparativeSourceIdentityHierarchy(index, object.key)} />}
    <dl>
      <div><dt>Source geometry</dt><dd>{metrics.nodeCount.toLocaleString()} SWC samples / {metrics.segmentCount.toLocaleString()} edges. Types {Object.entries(metrics.nodeTypeCounts).map(([type, count]) => `${type}: ${count.toLocaleString()}`).join("; ")}.</dd></div>
      <div><dt>Native extent</dt><dd>{metrics.extentMicrometre.map((value) => value.toFixed(2)).join(" × ")} µm; edge-length sum {metrics.totalCableLengthMicrometre.toFixed(4)} µm.</dd></div>
      <div><dt>Frame and units</dt><dd>{object.coordinateFrame.frame}; source-reported micrometres. Independent viewer auto-fit; no between-source transform.</dd></div>
      <div><dt>Repository integrity</dt><dd>{String(raw.physical_Integrity)} — source-reported reconstruction scope.</dd></div>
      <div><dt>Radius policy</dt><dd>{object.viewer.diameterAuthorized ? "Source Diameter attribute present; only centerlines are displayed." : "No Diameter: raw SWC radii are preserved as unvalidated source fields; no tube, membrane, area or volume is admitted."}</dd></div>
    </dl>
    <ul>{object.context.boundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
    {object.context.conflicts.length > 0 && <details><summary>Unresolved source assertions and historical receipt drift</summary>{object.context.conflicts.map((conflict) => <p key={conflict.id}><strong>{conflict.id}</strong> ({conflict.status}): {String(conflict.left ?? conflict.historicalSha256)} → {String(conflict.right ?? conflict.currentSha256)}. {conflict.consequence}<br /><code>{conflict.locator}</code></p>)}</details>}
    <details><summary>Structure coverage and exact file receipts</summary><ul>{object.structureCoverage.map((entry) => <li key={entry.id}><strong>{entry.label}: {entry.status}</strong> — {entry.detail}<br /><code>{entry.locator}</code></li>)}</ul>{object.files.map((file) => <p key={file.id}><a href={file.path} download>Exact {file.id} snapshot</a> · {file.bytes.toLocaleString()} bytes<br /><code>SHA-256 {file.checksum.digest}</code><br /><a href={file.url} target="_blank" rel="noreferrer">Original source endpoint ↗</a></p>)}</details>
    <p>CC BY 4.0 reuse under <a href={object.provenance.reuse.termsUrl} target="_blank" rel="noreferrer">NeuroMorpho terms ↗</a>. Required attribution: <a href={object.provenance.originalPaper} target="_blank" rel="noreferrer">original paper ↗</a>; {object.provenance.repositoryCitation}; {object.provenance.repositoryMethodsCitation}.</p>
    <div className="comparative-swc-actions">
      <button type="button" disabled={!payload} onClick={() => {
        if (!payload) return;
        download(`comparative-swc-${object.sourceObjectId}-receipt.json`, JSON.stringify({ contractId: index.contractId, scope: index.scope, sourceObject: object, verification: payload.receipt, sourceIdentity: comparativeSourceIdentityHierarchy(index, object.key), currentView: activeView }, null, 2), "application/json");
      }}>Export verified evidence JSON</button>
      <button type="button" disabled={!payload} onClick={() => { if (payload) download(`comparative-swc-${object.sourceObjectId}-raw-nodes.csv`, comparativeSwcNodesCsv(object, payload), "text/csv;charset=utf-8"); }}>Export raw node CSV</button>
    </div>
    <details className="comparative-view-replay" data-testid="comparative-view-replay">
      <summary>Save or restore this source view</summary>
      <p>A view receipt binds this reconstruction, exact source bytes, actual layers, camera and specified renderer build. Restore freshly rechecks all three files and the applied view; PNG includes the current canvas and source disclosure footer.</p>
      <div className="comparative-swc-actions">
        <button type="button" disabled={activeView?.status !== "rendered"} onClick={() => {
          try { captureView(); setReceiptStatus("Current source canvas, exact files and view captured."); }
          catch (error) { setReceiptStatus(error instanceof Error ? error.message : "View capture failed."); }
        }}>Capture current view</button>
        <button type="button" disabled={activeView?.status !== "rendered"} onClick={() => {
          try { const {document} = captureView(); download(`comparative-swc-${object.sourceObjectId}-view.json`, JSON.stringify(document, null, 2), "application/json"); }
          catch (error) { setReceiptStatus(error instanceof Error ? error.message : "View export failed."); }
        }}>Export view receipt</button>
        <button type="button" disabled={activeView?.status!=="rendered" || encoding || restoring} onClick={()=>{void exportPng();}}>{encoding?"Preparing source PNG…":"Export current view PNG"}</button>
        <button type="button" disabled={restoring || !current || current.status==='loading'} onClick={()=>reloadSource(false)}>Recheck exact source files</button>
      </div>
      {captured && <textarea readOnly aria-label="Current comparative source view receipt" value={JSON.stringify(captured,null,2)} rows={8}/>}
      {png && <details className="comparative-png-preview"><summary>Preview exported source-view PNG</summary><a href={png.url} download={`comparative-swc-${object.sourceObjectId}-source-view.png`}>Download exported PNG</a>
        <label><input type="checkbox" checked={fullSizePng} onChange={event=>setFullSizePng(event.target.checked)}/>Show PNG at its full exported width</label>
        <div className="comparative-png-scroll">
          {/* The local preview is the exact encoded canvas export. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={fullSizePng?'comparative-png-full-size':undefined} src={png.preview} alt={`${object.title} actual source view with source disclosure footer`}/>
        </div>
      </details>}
      <label>Saved view receipt<textarea value={receiptText} onChange={(event) => { setReceiptText(event.target.value); setReceiptStatus(""); }} placeholder="Capture the current view, or paste its saved receipt." rows={6} /></label>
      <button type="button" disabled={!payload || !receiptText.trim() || restoring} onClick={restoreView}>Restore view receipt</button>
      {receiptStatus && <p role="status" aria-live="polite">{receiptStatus}</p>}
    </details>
  </article>;
}

export default function ComparativeSwcReferenceWorkbench() {
  const [selected, setSelected] = useState(() => index.objects.map((object) => object.key));
  return <section className="comparative-swc-workbench" aria-labelledby="comparative-swc-title">
    <h3 id="comparative-swc-title">Independent zebrafish and rat morphology references</h3>
    <p>The 2026-09-30 exact source snapshots add one zebrafish axon reconstruction and one rat soma/neurite reconstruction. Each object loads and fits in its own frame. This creates zero mouse-census additions, same-cell joins, cross-species identities or atlas registrations.</p>
    {selected.length === 2 && <p data-testid="comparative-source-relationship">{comparativeSourceCoDisplayRelationship(index).type.replaceAll("_", " ")} · These source reconstructions retain separate namespaces and frames.</p>}
    <fieldset><legend>Show exact comparative objects</legend>{index.objects.map((object) => <label key={object.key}><input type="checkbox" checked={selected.includes(object.key)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, object.key] : current.filter((key) => key !== object.key))} />{object.title}</label>)}</fieldset>
    <div className="comparative-swc-grid">{index.objects.filter((object) => selected.includes(object.key)).map((object) => <SourceCard key={object.key} object={object} />)}</div>
    {!selected.length && <p>Select an exact source object to inspect its verified morphology.</p>}
  </section>;
}
