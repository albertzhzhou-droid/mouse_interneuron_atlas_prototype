"use client";

import { useEffect, useRef, useState } from "react";
import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
import { dandiTraceIdentity } from "./dandi-spinalcordnet-trace.js";
import { DANDI_FULL_RECORDING as source, buildDandiFullReceipt, dandiFullChunkFor, dandiFullWindow,
  dandiFullWindowCsv, inspectDandiFullReceipt, loadDandiFullChunk, restoreDandiFullReceipt,
  type DandiFullProof, type DandiFullSelection } from "./dandi-full-recording.js";
import "./dandi-spinalcordnet-trace.css";

const LAST_WINDOW = 5541000;
function initialSelection(): DandiFullSelection {
  if (typeof window === "undefined") return { channelIndex: 0, firstSample: 0, cursorOffset: 0 };
  const query = new URLSearchParams(window.location.search);
  const channelIndex = Number(query.get("dandiChannel") ?? "0");
  const firstSample = Number(query.get("dandiFullStart") ?? "0");
  try { dandiFullChunkFor(channelIndex, firstSample); return { channelIndex, firstSample, cursorOffset: 0 }; }
  catch { return { channelIndex: 0, firstSample: 0, cursorOffset: 0 }; }
}
function save(filename: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  // Keep the current explicit download link usable until this browser view changes.
  return url;
}
export default function DandiFullRecordingBrowser() {
  const [selection, setSelection] = useState(initialSelection);
  const [proof, setProof] = useState<DandiFullProof | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const [timeText, setTimeText] = useState(() => String(selection.firstSample / 30000));
  const [restoreText, setRestoreText] = useState("");
  const [notice, setNotice] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [plotWidth, setPlotWidth] = useState(800);
  const plotRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<string | null>(null);
  const pendingRestore = useRef<unknown>(null);
  const selectionRef = useRef(selection);
  useEffect(() => { selectionRef.current = selection; }, [selection]);
  const channelIndex = selection.channelIndex;
  const blockIndex = Math.floor(selection.firstSample / 300000);
  const requestKey = `${channelIndex}:${blockIndex}`;
  const active = proof?.channelIndex === selection.channelIndex
    && proof?.blockIndex === Math.floor(selection.firstSample / 300000) ? proof : null;
  useEffect(() => {
    const controller = new AbortController(); let current = true;
    const pending = pendingRestore.current; pendingRestore.current = null;
    const pendingSelection = pending ? inspectDandiFullReceipt(pending) : null;
    loadDandiFullChunk(channelIndex, blockIndex * 300000, { signal: controller.signal }).then(value => {
      if (!current || controller.signal.aborted) return;
      const restoreStillRequested = pendingSelection && pendingSelection.channelIndex === selectionRef.current.channelIndex
        && pendingSelection.firstSample === selectionRef.current.firstSample && pendingSelection.cursorOffset === selectionRef.current.cursorOffset;
      if (pending && restoreStillRequested) restoreDandiFullReceipt(pending, value);
      setProof(value); setFailure(null);
      if (restoreStillRequested) setNotice("Channel, native time, cursor and every imported sample restored against fresh source block bytes.");
    }).catch(error => {
      if (!current || controller.signal.aborted) return;
      setProof(null); setFailure({ key: requestKey, message: error instanceof Error ? error.message : "Source block unavailable." });
    });
    return () => { current = false; controller.abort(); };
  }, [channelIndex, blockIndex, requestKey, retry]);
  useEffect(() => {
    if (!plotRef.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width && Number.isFinite(width)) setPlotWidth(Math.max(300, width));
    });
    observer.observe(plotRef.current); return () => observer.disconnect();
  }, [active]);
  const clearDownload = () => {
    if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
    downloadRef.current = null; setDownloadUrl(null); setDownloadName("");
  };
  useEffect(() => () => { if (downloadRef.current) URL.revokeObjectURL(downloadRef.current); }, []);
  const choose = (next: DandiFullSelection) => {
    dandiFullChunkFor(next.channelIndex, next.firstSample);
    selectionRef.current = next;
    clearDownload(); setNotice(""); setSelection(next); setTimeText(String(next.firstSample / 30000));
    const url = new URL(window.location.href);
    url.searchParams.set("dandiChannel", String(next.channelIndex)); url.searchParams.set("dandiFullStart", String(next.firstSample));
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  };
  useEffect(() => {
    const onPop = () => {
      if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
      downloadRef.current = null; setDownloadUrl(null); setDownloadName(""); pendingRestore.current = null;
      const next = initialSelection(); setSelection(next); setTimeText(String(next.firstSample / 30000)); setNotice("");
    };
    window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop);
  }, []);
  const current = active ? dandiFullWindow(active, selection.channelIndex, selection.firstSample, selection.cursorOffset) : null;
  const receipt = active ? buildDandiFullReceipt(active, selection.channelIndex, selection.firstSample, selection.cursorOffset) : null;
  const magnitude = current ? Math.max(1, Math.ceil(Math.max(...current.samples.map(Math.abs)) * 1.05)) : 1;
  const restore = () => {
    try {
      const incoming: unknown = JSON.parse(restoreText), next = inspectDandiFullReceipt(incoming);
      if (active && active.channelIndex === next.channelIndex && active.blockIndex === Math.floor(next.firstSample / 300000)) {
        restoreDandiFullReceipt(incoming, active); choose(next);
        setNotice("Channel, native time, cursor and every imported sample restored against the current verified bytes.");
      } else { pendingRestore.current = incoming; choose(next); setProof(null); }
    } catch (error) { setNotice(error instanceof Error ? error.message : "Receipt rejected."); }
  };
  const exportCurrent = (kind: "json" | "csv") => {
    if (!active || !receipt) return;
    clearDownload();
    const name = `dandi-channel-${selection.channelIndex}-sample-${selection.firstSample}.${kind}`;
    const text = kind === "json" ? `${JSON.stringify(receipt, null, 2)}\n`
      : dandiFullWindowCsv(active, selection.channelIndex, selection.firstSample);
    const url = save(name, kind === "json" ? "application/json" : "text/csv", text);
    downloadRef.current = url; setDownloadUrl(url); setDownloadName(name);
    setNotice("Current exact window prepared; the same file is available in the download link.");
  };
  const error = failure?.key === requestKey ? failure.message : null;
  return <section className="dandi-trace-preview" data-testid="dandi-full-recording" aria-labelledby="dandi-full-heading">
    <header><p className="panel-kicker">COMPLETE SOURCE RECORDING · 32 CHANNELS</p><h2 id="dandi-full-heading">Mouse spinal extracellular recording</h2>
      <p>Select any native channel and time across 184.7808 seconds. All stored samples are retained; electrodes have no isolated-cell or interneuron assignment.</p></header>
    <p className="dandi-trace-calibration"><strong>Stored integer amplitude.</strong> Physical voltage calibration remains unresolved. The deposited volts/conversion 1/offset 0 declaration is retained without rescaling.</p>
    <div className="dandi-trace-controls">
      <label>Native channel<select aria-label="Native recording channel" value={selection.channelIndex}
        onChange={event => { pendingRestore.current = null; choose({ ...selection, channelIndex: Number(event.target.value), cursorOffset: 0 }); }}>
        {source.electrodes.map(row => <option key={row.channelIndex} value={row.channelIndex}>{row.channelIndex} · electrode {row.nativeElectrodeId} · {row.label}</option>)}
      </select></label>
      <label>Window start (seconds)<input aria-label="Full recording window start seconds" type="number" min={0} max={184.7} step={0.1}
        value={timeText} onChange={event => setTimeText(event.target.value)} /></label>
      <button type="button" onClick={() => {
        const number = Number(timeText), next = Math.round(number * 30000);
        if (!timeText.trim() || !Number.isFinite(number) || Math.abs(number * 30000 - next) > 1e-6 || next % 3000 !== 0 || next < 0 || next > LAST_WINDOW) {
          setNotice("Enter a time from 0 to 184.7 seconds in 0.1-second steps."); return;
        }
        pendingRestore.current = null; choose({ ...selection, firstSample: next, cursorOffset: 0 });
      }}>Go to time</button>
      <button type="button" disabled={selection.firstSample === 0} onClick={() => { pendingRestore.current = null; choose({ ...selection, firstSample: selection.firstSample - 3000, cursorOffset: 0 }); }}>Previous window</button>
      <button type="button" disabled={selection.firstSample === LAST_WINDOW} onClick={() => { pendingRestore.current = null; choose({ ...selection, firstSample: selection.firstSample + 3000, cursorOffset: 0 }); }}>Next window</button>
    </div>
    <p role={error ? "alert" : "status"}>{error ?? (current ? `Current channel ${selection.channelIndex} block bytes and both checksums verified.` : "Verifying the selected channel and native time block…")}</p>
    {error && <button type="button" onClick={() => { clearDownload(); setProof(null); setRetry(value => value + 1); }}>Retry exact source block</button>}
    {current && active && <>
      <p data-testid="dandi-full-current-sample">Electrode {source.electrodes[selection.channelIndex].nativeElectrodeId} · sample {current.cursor.sourceSampleIndex}
        {" · "}{current.cursor.timeSeconds.toFixed(6)} s · stored value {current.cursor.storedValue}.
        {" "}{current.sampleCount} samples in this window{current.sampleCount < 3000 ? "; final partial window, no padding" : ""}.</p>
      <label>Native sample cursor<input type="range" aria-label="Full recording sample cursor" min={0} max={current.sampleCount - 1} step={1}
        value={selection.cursorOffset} onChange={event => { clearDownload(); setNotice(""); setSelection({ ...selection, cursorOffset: Number(event.target.value) }); }} /></label>
      <div ref={plotRef} className="dandi-trace-plot" role="img" aria-label={`${current.sampleCount} actual samples, native channel ${selection.channelIndex}, ${current.firstTimeSeconds} to ${current.lastTimeSeconds} seconds. Stored integer values with symmetric autoscaling; exact sample values follow.`}>
        <svg viewBox={`0 0 ${plotWidth} 260`} aria-hidden="true">
          {[-magnitude, 0, magnitude].map(value => <g key={value}><line x1={65} x2={plotWidth - 20} y1={125 - value * 100 / magnitude} y2={125 - value * 100 / magnitude} className="trace-grid" /><text x={58} y={129 - value * 100 / magnitude} textAnchor="end">{value}</text></g>)}
          <polyline points={current.samples.map((value, i) => `${65 + i / Math.max(1, current.sampleCount - 1) * (plotWidth - 85)},${125 - value * 100 / magnitude}`).join(" ")} />
          <line x1={65 + selection.cursorOffset / Math.max(1, current.sampleCount - 1) * (plotWidth - 85)} x2={65 + selection.cursorOffset / Math.max(1, current.sampleCount - 1) * (plotWidth - 85)} y1={20} y2={230} className="trace-cursor" />
          <text x={65} y={249}>{current.firstTimeSeconds.toFixed(4)} s</text><text x={plotWidth - 20} y={249} textAnchor="end">{current.lastTimeSeconds.toFixed(4)} s</text>
        </svg>
      </div>
      <p>Every selected sample is drawn. The vertical display scale adapts to this window; no filtering, smoothing, spike sorting or voltage conversion is applied.</p>
      <table><caption>Exact stored values around the cursor</caption><thead><tr><th scope="col">Native sample</th><th scope="col">Time (s)</th><th scope="col">Stored int16</th></tr></thead><tbody>
        {Array.from({ length: Math.min(5, current.sampleCount - Math.max(0, selection.cursorOffset - 2)) }, (_, i) => Math.max(0, selection.cursorOffset - 2) + i)
          .map(i => <tr key={i}><th scope="row">{selection.firstSample + i}</th><td>{((selection.firstSample + i) / 30000).toFixed(6)}</td><td>{current.samples[i]}</td></tr>)}
      </tbody></table>
      <div className="dandi-trace-controls"><button type="button" onClick={() => exportCurrent("json")}>Export current recording JSON</button>
        <button type="button" onClick={() => exportCurrent("csv")}>Export current recording CSV</button>
        {downloadUrl && <a href={downloadUrl} download={downloadName}>Download current recording file</a>}</div>
      <details><summary>Current complete-recording window receipt and restore</summary>
        <label>Current recording receipt<textarea aria-label="Current full recording receipt" readOnly rows={6} value={JSON.stringify(receipt, null, 2)} /></label>
        <label>Restore recording receipt<textarea aria-label="Restore full recording receipt" rows={5} value={restoreText} onChange={event => setRestoreText(event.target.value)} /></label>
        <button type="button" disabled={!restoreText.trim()} onClick={restore}>Restore exact recording window</button>
      </details>
    </>}
    <p role="status">{notice}</p>
    <details><summary>Exact recording identity and acquisition scope</summary>
      <p><a href={source.sourceUrl} target="_blank" rel="noreferrer">DANDI 001469 · {source.releaseId}</a> · {source.sourceContext.subjectId} · {source.sourceContext.species} · age {source.sourceContext.age} · sex {source.sourceContext.sex}.</p>
      <p>{source.sourceContext.sessionIdReason} Start: {source.sourceContext.sessionStartTime}. No histological section, cell, synapse or electrode-coordinate unit is established.</p>
      <p>The complete 355,191,072-byte source and its published SHA-256 were verified at extraction. The browser verifies only its currently requested lossless block, at most {source.recording.maximumCompressedChunkBytes.toLocaleString("en-US")} compressed bytes; it does not download the complete NWB.</p>
      <p>{source.recording.totalStoredSamples.toLocaleString("en-US")} stored samples · 32 channels × 5,543,424 native time rows at 30,000 samples/s. All 608 lossless blocks retain every channel and time. No same-cell, molecular-type, morphology, causal motor output or atlas join is introduced.</p>
      <p>{source.citation} {source.licenseScope}</p>
      <SourceIdentityHierarchyPanel hierarchy={dandiTraceIdentity()} />
    </details>
  </section>;
}
