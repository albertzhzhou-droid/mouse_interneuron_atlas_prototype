"use client";

import { useEffect, useRef, useState } from "react";
import { MCCREEDY_MOVIE as source, buildMccreedyReceipt, inspectMccreedyReceipt, loadMccreedyMovie,
  mccreedyMovieBytes, restoreMccreedyReceipt, validateMccreedyDecodedMetadata,
  type MccreedyProof, type MccreedySelection } from "./mccreedy-v2a-movie.js";
import "./mccreedy-v2a-movie.css";

type Request = { epoch: number; receipt: unknown | null };
type View = { request: Request; proof: MccreedyProof; url: string; selection: MccreedySelection | null };
export default function MccreedyV2aPopulationMovie() {
  const [request, setRequest] = useState<Request | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [status, setStatus] = useState("Original movie has not been loaded.");
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [timeText, setTimeText] = useState("0");
  const [restoreText, setRestoreText] = useState("");
  const [receiptText, setReceiptText] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<Request | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const movieUrlRef = useRef<string | null>(null);
  const receiptUrlRef = useRef<string | null>(null);
  const epoch = useRef(0);
  const restoreSeekRef = useRef<number | null>(null);
  const active = view && view.request === request ? view : null;
  const isCurrent = () => !!active && requestRef.current === active.request;
  const clearReceipt = () => {
    if (receiptUrlRef.current) URL.revokeObjectURL(receiptUrlRef.current);
    receiptUrlRef.current = null; setReceiptUrl(null); setReceiptText("");
  };
  const clear = () => {
    controllerRef.current?.abort(); videoRef.current?.pause();
    if (movieUrlRef.current) URL.revokeObjectURL(movieUrlRef.current);
    movieUrlRef.current = null; restoreSeekRef.current = null; clearReceipt(); setView(null); setReady(false); setTime(0); setTimeText("0"); setPaused(true);
  };
  const begin = (receipt: unknown | null = null) => {
    clear(); const next = { epoch: ++epoch.current, receipt };
    requestRef.current = next; setRequest(next); setStatus("Checking the complete original movie…");
  };
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController(); controllerRef.current = controller;
    loadMccreedyMovie({ signal: controller.signal }).then(proof => {
      if (controller.signal.aborted || requestRef.current !== request) return;
      const selection = request.receipt ? restoreMccreedyReceipt(request.receipt, proof) : null;
      const bytes = mccreedyMovieBytes(proof);
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: source.asset.mime }));
      movieUrlRef.current = url; setView({ request, proof, url, selection });
      setStatus("Original bytes verified. Checking playback metadata…");
    }).catch(error => {
      if (controller.signal.aborted || requestRef.current !== request) return;
      setView(null); setReady(false); setStatus(error instanceof Error ? error.message : "Original movie unavailable.");
    });
    return () => { controller.abort(); };
  }, [request]);
  useEffect(() => () => {
    requestRef.current = null; controllerRef.current?.abort();
    if (movieUrlRef.current) URL.revokeObjectURL(movieUrlRef.current);
    if (receiptUrlRef.current) URL.revokeObjectURL(receiptUrlRef.current);
  }, []);
  const fail = (message: string) => { clear(); requestRef.current = null; setRequest(null); setStatus(message); };
  const sync = () => {
    const video = videoRef.current; if (!video || !isCurrent()) return;
    setTime(video.currentTime); setPaused(video.paused);
  };
  const metadataReady = () => {
    const video = videoRef.current; if (!video || !active || requestRef.current !== active.request) return;
    try {
      validateMccreedyDecodedMetadata({ width: video.videoWidth, height: video.videoHeight, durationSeconds: video.duration });
      video.pause();
      if (active.selection) {
        video.playbackRate = active.selection.playbackRate;
        setTimeText(String(active.selection.timeSeconds));
        if (Math.abs(video.currentTime - active.selection.timeSeconds) > 1e-6) {
          restoreSeekRef.current = active.selection.timeSeconds;
          video.currentTime = active.selection.timeSeconds;
          setStatus("Fresh original bytes verified. Seeking to the paused source position…"); return;
        }
      }
      setReady(true); sync();
      setStatus(active.selection ? "Fresh original bytes verified; paused movie position restored." : "Original bytes and playback metadata verified. Ready to play.");
    } catch (error) { fail(error instanceof Error ? error.message : "Playback metadata unavailable."); }
  };
  const snapshot = () => {
    const video = videoRef.current; if (!active || !ready || !video) return;
    try {
      video.pause(); clearReceipt();
      const receipt = buildMccreedyReceipt(active.proof, { timeSeconds: video.currentTime, playbackRate: video.playbackRate });
      const text = JSON.stringify(receipt, null, 2) + "\n";
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      receiptUrlRef.current = url; setReceiptUrl(url); setReceiptText(text); sync();
      setStatus("Paused source snapshot prepared. It restores playback time and rate against fresh original bytes.");
    } catch (error) { fail(error instanceof Error ? error.message : "Snapshot unavailable."); }
  };
  return <section className="mccreedy-movie" aria-labelledby="mccreedy-movie-heading" data-testid="mccreedy-v2a-movie">
    <p className="panel-kicker">MOUSE · V2a POPULATION · SOURCE MOVIE</p>
    <h2 id="mccreedy-movie-heading">{source.title}</h2>
    <p>Adult-study Chx10:tdTomato spinal cord, C1–L1. The published movie shows population fluorescence in a cleared cord. Exact movie age, sex, specimen identifier and individual cell identities are unavailable.</p>
    <p>{source.citation.caption}</p>
    <p><strong>Visual reference.</strong> Perspective and rotation are baked into the source movie. Playback seconds do not represent acquisition time, depth or distance. This view provides no raw stack, calibrated volume, editable 3D camera, single-cell morphology or internal structure.</p>
    <div className="mccreedy-controls">
      <button type="button" onClick={() => { setRestoreText(""); begin(); }}>{active ? "Reload original movie" : "Load original movie"}</button>
      <button type="button" disabled={!request} onClick={() => { clear(); requestRef.current = null; setRequest(null); setRestoreText(""); setStatus("Movie cleared. No source playback or snapshot remains."); }}>Clear or cancel movie</button>
    </div>
    <p role="status" data-testid="mccreedy-movie-status">{status}</p>
    {active && <>
      <video key={active.request.epoch} ref={videoRef} src={active.url} controls playsInline preload="metadata"
        aria-label="Verified Supplementary Movie 2" aria-describedby="mccreedy-playback-scope"
        onLoadedMetadata={metadataReady} onError={() => { if (isCurrent()) fail("Verified bytes could not be played. Source playback and snapshots cleared."); }}
        onTimeUpdate={sync} onPause={sync} onPlay={() => { if (isCurrent()) { clearReceipt(); sync(); } }} onSeeking={() => { if (isCurrent()) { clearReceipt(); sync(); } }}
        onSeeked={() => {
          if (!isCurrent()) return;
          const video = videoRef.current, expected = restoreSeekRef.current;
          if (video && expected !== null) {
            if (Math.abs(video.currentTime - expected) > 1e-6) { fail("Source playback position did not restore. Movie cleared."); return; }
            restoreSeekRef.current = null; setReady(true); setStatus("Fresh original bytes verified; paused movie position restored.");
          }
          sync();
        }} onRateChange={() => { if (isCurrent()) { clearReceipt(); sync(); } }}>
        <track kind="captions" src="/data/mccreedy_v2a_movie_v1/description.vtt" srcLang="en" label="Source visual description" />
        Published population movie; the source and its visual scope are described above.
      </video>
      <p id="mccreedy-playback-scope">20 seconds · 1600×1200 · 400 encoded frames · no audio. Original MP4 bytes unchanged. Current position: <output>{time.toFixed(2)} seconds</output> · {paused ? "paused" : "playing"}.</p>
      <div className="mccreedy-controls">
        <button type="button" disabled={!ready} onClick={() => { clearReceipt(); videoRef.current?.play().catch(() => setStatus("Playback was prevented by this browser. Use the movie's native play control.")); }}>Play movie</button>
        <button type="button" disabled={!ready} onClick={() => videoRef.current?.pause()}>Pause movie</button>
        <label>Movie time (seconds)<input type="number" min={0} max={20} step={0.05} value={timeText} onChange={event => setTimeText(event.target.value)} /></label>
        <button type="button" disabled={!ready} onClick={() => {
          const next = Number(timeText);
          if (!timeText.trim() || !Number.isFinite(next) || next < 0 || next > 20) { setStatus("Enter a movie time from 0 to 20 seconds."); return; }
          clearReceipt(); const video = videoRef.current; if (video) { video.pause(); video.currentTime = next; }
        }}>Go to movie time</button>
        <button type="button" disabled={!ready} onClick={snapshot}>Prepare paused source snapshot</button>
      </div>
    </>}
    {receiptText && <label>Current movie source snapshot<textarea readOnly value={receiptText} rows={8} /></label>}
    {receiptUrl && <a href={receiptUrl} download="mccreedy-v2a-source-snapshot.json">Download current movie snapshot JSON</a>}
    <label>Restore movie source snapshot<textarea value={restoreText} onChange={event => setRestoreText(event.target.value)} rows={4} /></label>
    <button type="button" onClick={() => {
      try { const incoming: unknown = JSON.parse(restoreText); inspectMccreedyReceipt(incoming); begin(incoming); }
      catch (error) { fail(error instanceof Error ? error.message : "Source snapshot rejected."); }
    }}>Restore against fresh original bytes</button>
    <details><summary>Source, reuse and evidence boundary</summary>
      <p>{source.rights.attribution}. <a href={source.citation.articleUrl} target="_blank" rel="noreferrer">Original article and supplements</a> · <a href={source.rights.url} target="_blank" rel="noreferrer">{source.rights.license}</a>.</p>
      <p>{source.citation.authors.join(", ")}. {source.rights.modification}. {source.rights.basis}.</p>
      <p>{source.sourceId} · {source.releaseId} · original {source.asset.bytes.toLocaleString("en-US")} bytes · SHA-256 <code>{source.asset.sha256}</code>.</p>
      <ul>{source.boundaries.map(text => <li key={text}>{text}</li>)}</ul>
      <p>Full source decoding was verified during build. Browser checksum verification covers the complete current MP4; metadata checks and observed playback do not certify decoding every frame in this browser.</p>
    </details>
  </section>;
}
