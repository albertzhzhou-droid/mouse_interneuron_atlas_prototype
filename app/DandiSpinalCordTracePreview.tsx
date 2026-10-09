"use client";

import { useEffect, useRef, useState } from "react";
import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
import DandiFullRecordingBrowser from "./DandiFullRecordingBrowser";
import { DANDI_TRACE_CONTRACT as contract, buildDandiTraceReceipt, dandiTraceIdentity, dandiTraceWindow,
  dandiTraceWindowCsv, loadDandiTrace, restoreDandiTraceReceipt, type DandiTracePayload } from "./dandi-spinalcordnet-trace.js";
import "./dandi-spinalcordnet-trace.css";

function initialWindow() {
  if (typeof window === "undefined") return 0;
  const text = new URLSearchParams(window.location.search).get("dandiTraceStart");
  const value = Number(text);
  return text !== null && Number.isInteger(value) && value >= 0 && value <= 27000 && value % 3000 === 0 ? value : 0;
}
function download(filename: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function FirstSecondReferencePreview() {
  const [payload, setPayload] = useState<DandiTracePayload | null>(null);
  const [status, setStatus] = useState("Verifying the fixed channel preview…");
  const [firstSample, setFirstSample] = useState(initialWindow);
  const [cursorOffset, setCursorOffset] = useState(0);
  const [restoreText, setRestoreText] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("");
  const [loadedGeneration, setLoadedGeneration] = useState(0);
  const [plotWidth, setPlotWidth] = useState(800);
  const plotRef = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  useEffect(() => {
    let active = true; const controller = new AbortController(); generation.current += 1;
    const run = generation.current;
    loadDandiTrace({ signal: controller.signal }).then(value => {
      if (active && generation.current === run) { setLoadedGeneration(run); setPayload(value); setStatus("Exact preview bytes and SHA-256 verified. The full NWB checksum remains unverified."); }
    }).catch(error => {
      if (active && !controller.signal.aborted) { setPayload(null); setStatus(error instanceof Error ? error.message : "Preview verification failed. No samples displayed."); }
    });
    return () => { active = false; controller.abort(); };
  }, []);
  useEffect(() => {
    const onPopState = () => { setFirstSample(initialWindow()); setCursorOffset(0); setRestoreStatus(""); };
    window.addEventListener("popstate", onPopState); return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    if (!payload || !plotRef.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width && Number.isFinite(width)) setPlotWidth(Math.max(300, width));
    });
    observer.observe(plotRef.current);
    return () => observer.disconnect();
  }, [payload]);
  const chooseWindow = (next: number) => {
    setFirstSample(next); setCursorOffset(0); setRestoreStatus("");
    const url = new URL(window.location.href); url.searchParams.set("dandiTraceStart", String(next));
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  };
  const selected = payload ? dandiTraceWindow(payload, firstSample, cursorOffset) : null;
  const receipt = payload ? buildDandiTraceReceipt(payload, firstSample, cursorOffset, loadedGeneration) : null;
  const restore = () => {
    if (!payload) return;
    try {
      const next = restoreDandiTraceReceipt(JSON.parse(restoreText), payload);
      chooseWindow(next.firstSample); setCursorOffset(next.cursorOffset); setRestoreStatus("Preview window and cursor restored against the current verified bytes.");
    } catch (error) { setRestoreStatus(error instanceof Error ? error.message : "Receipt rejected."); }
  };
  return <section className="dandi-trace-preview" aria-labelledby="dandi-trace-heading">
    <header><p className="panel-kicker">FIXED SOURCE · ONE CHANNEL · FIRST SECOND</p><h2 id="dandi-trace-heading">Mouse spinal extracellular trace</h2>
      <p>Browse channel 0 from one deposited ElectricalSeries. This recording has no identified interneuron or isolated-cell assignment.</p></header>
    <p role="status">{status}</p>
    <dl className="dandi-trace-context">
      <div><dt>Source version</dt><dd>DANDI 001469 · {contract.releaseId}</dd></div>
      <div><dt>Native subject</dt><dd>{contract.sourceContext.subjectId} · {contract.sourceContext.species} · {contract.sourceContext.age} · sex {contract.sourceContext.sex}</dd></div>
      <div><dt>Session ID</dt><dd>Not deposited. Start time: {contract.sourceContext.sessionStartTime}</dd></div>
      <div><dt>Selected electrode</dt><dd>ID 0 · {contract.electrodes[0].label} · {contract.electrodes[0].groupName}</dd></div>
    </dl>
    <p className="dandi-trace-calibration"><strong>Amplitude calibration unresolved.</strong> The NWB declares volts, conversion 1 and offset 0. The plot preserves stored int16 values; no physical voltage conversion is applied.</p>
    <p>30,000 exact samples at 30,000 samples/s are available for this channel. The source declares 5,543,424 samples × 32 channels; this preview covers the first second of channel 0.</p>
    {selected && payload && <>
      <div className="dandi-trace-controls">
        <label>Source time window<select aria-label="Source time window" value={firstSample} onChange={event => chooseWindow(Number(event.target.value))}>
          {Array.from({ length: 10 }, (_, i) => <option key={i} value={i * 3000}>{(i / 10).toFixed(1)}–{((i + 1) / 10).toFixed(1)} s · samples {i * 3000}–{i * 3000 + 2999}</option>)}
        </select></label>
        <button type="button" disabled={firstSample === 0} onClick={() => chooseWindow(firstSample - 3000)}>Previous window</button>
        <button type="button" disabled={firstSample === 27000} onClick={() => chooseWindow(firstSample + 3000)}>Next window</button>
        <label>Sample cursor<input type="range" aria-label="Sample cursor" min={0} max={2999} step={1} value={cursorOffset} onChange={event => { setCursorOffset(Number(event.target.value)); setRestoreStatus(""); }} /></label>
      </div>
      <p aria-live="polite">Sample {selected.cursor.sourceSampleIndex} · source time {selected.cursor.timeSeconds.toFixed(6)} s · stored value {selected.cursor.storedValue}</p>
      <div ref={plotRef} className="dandi-trace-plot" role="img" aria-label={`All 3000 unchanged stored samples for electrode 0, ${selected.firstTimeSeconds.toFixed(4)} to ${selected.lastTimeSeconds.toFixed(4)} source seconds. Amplitude is stored int16 values, calibration unverified. Exact cursor value is above and sample rows follow.`}>
        <svg viewBox={`0 0 ${plotWidth} 260`} aria-hidden="true">
          {[-50,0,50].map(value => <g key={value}><line x1={55} x2={plotWidth - 20} y1={125 - value * 2} y2={125 - value * 2} className="trace-grid" /><text x={46} y={129 - value * 2} textAnchor="end">{value}</text></g>)}
          <polyline points={selected.samples.map((value, i) => `${55 + i / 2999 * (plotWidth - 75)},${125 - value * 2}`).join(" ")} />
          <line x1={55 + cursorOffset / 2999 * (plotWidth - 75)} x2={55 + cursorOffset / 2999 * (plotWidth - 75)} y1={20} y2={230} className="trace-cursor" />
          <text x={55} y={249}>{selected.firstTimeSeconds.toFixed(4)} s</text><text x={plotWidth - 20} y={249} textAnchor="end">{selected.lastTimeSeconds.toFixed(4)} s</text>
        </svg>
      </div>
      <p>Every sample is drawn. No filtering, smoothing, spike detection or waveform classification is performed. Electrode coordinates have no explicit source unit, so this view provides no anatomical scale or atlas placement.</p>
      <table className="dandi-trace-sample-table"><caption>Exact values around the selected sample</caption><thead><tr><th scope="col">Source sample</th><th scope="col">Time (s)</th><th scope="col">Stored int16</th></tr></thead><tbody>
        {Array.from({ length: Math.min(5, 3000 - Math.max(0, cursorOffset - 2)) }, (_, i) => Math.max(0, cursorOffset - 2) + i).map(i => <tr key={i}><th scope="row">{firstSample + i}</th><td>{((firstSample + i) / 30000).toFixed(6)}</td><td>{payload.samples[firstSample + i]}</td></tr>)}
      </tbody></table>
      <div className="dandi-trace-controls"><button type="button" onClick={() => download("dandi-trace-preview-receipt.json", "application/json", `${JSON.stringify(receipt,null,2)}\n`)}>Export trace receipt JSON</button>
        <button type="button" onClick={() => download("dandi-trace-window.csv", "text/csv", dandiTraceWindowCsv(payload, firstSample))}>Export exact window CSV</button></div>
      <details><summary>Current trace receipt and restore</summary>
        <label>Current trace receipt<textarea aria-label="Current trace receipt" readOnly rows={7} value={JSON.stringify(receipt,null,2)} /></label>
        <label>Restore trace receipt<textarea aria-label="Restore trace receipt" rows={5} value={restoreText} onChange={event => setRestoreText(event.target.value)} /></label>
        <button type="button" onClick={restore} disabled={!restoreText.trim()}>Restore preview window</button><p role="status">{restoreStatus}</p>
      </details>
    </>}
    <SourceIdentityHierarchyPanel hierarchy={dandiTraceIdentity()} />
    <details><summary>Source files, scope and electrode identities</summary>
      <p>{contract.citation}</p><p><a href={contract.sourceUrl} target="_blank" rel="noreferrer">Immutable Dandiset</a>{" · "}<a href={`https://doi.org/${contract.doi}`} target="_blank" rel="noreferrer">Dataset DOI</a></p>
      <p>{contract.licenseScope} A lossless local preview was extracted from 15 verified range blocks, totalling 3,918,112 bytes. This original I09 reference proof did not acquire the complete 355,191,072-byte NWB or verify its whole-file hash. The complete-recording acquisition and verification scope is shown above.</p>
      <p>{contract.sourceAsset.path}</p><p>ElectricalSeries: {contract.sourceContext.seriesObjectId}; table: {contract.sourceContext.electrodeTableObjectId}; group: {contract.sourceContext.electrodeGroupObjectId}.</p>
      <p>The deposited table reference and group references were resolved from HDF5. These identify electrodes and the recording observation; they do not identify cell or synapse instances.</p>
      <div className="dandi-trace-electrodes"><table><caption>Original I09 reference: 32 native electrode rows; bundled first-second samples are channel 0</caption><thead><tr><th scope="col">Channel</th><th scope="col">Native ID</th><th scope="col">Source label</th><th scope="col">Location</th></tr></thead><tbody>{contract.electrodes.map(row => <tr key={row.nativeElectrodeId}><th scope="row">{row.channelIndex}</th><td>{row.nativeElectrodeId}</td><td>{row.label}</td><td>{row.location}</td></tr>)}</tbody></table></div>
    </details>
  </section>;
}

export default function DandiSpinalCordTracePreview() {
  const [referenceOpen, setReferenceOpen] = useState(() => typeof window !== "undefined"
    && new URLSearchParams(window.location.search).has("dandiTraceStart"));
  return <>
    <DandiFullRecordingBrowser />
    <details className="dandi-trace-preview" open={referenceOpen} onToggle={event => setReferenceOpen(event.currentTarget.open)}>
      <summary>First-second channel 0 reference preview</summary>
      {referenceOpen && <FirstSecondReferencePreview />}
    </details>
  </>;
}
