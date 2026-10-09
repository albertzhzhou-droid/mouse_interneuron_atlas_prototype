"use client";

import { useEffect, useRef, useState } from "react";
import type { MorphologySourceViewDocument, IndividualMorphologySourceViewDocument } from "./morphology-source-view.js";
import type { MainSceneSourceViewDocument } from "./main-scene-source-view.js";
import type { NativeContourSourceViewDocument } from "./native-contour-source-view.js";
import "./morphology-source-view.css";

export default function MorphologySourceViewControls({ neuronId, signature, available, restoring, capture, restore, exportPng, pngFilename, description, unavailableReason }: {
  neuronId: number; signature: string; available: boolean; restoring: boolean;
  capture: () => MorphologySourceViewDocument | IndividualMorphologySourceViewDocument | MainSceneSourceViewDocument | NativeContourSourceViewDocument;
  restore: (document: unknown) => Promise<void>;
  exportPng?: (document: unknown) => Promise<{ blob: Blob; preview: string }>;
  pngFilename?: string;
  description?: string; unavailableReason?: string;
}) {
  const [prepared, setPrepared] = useState<{ signature: string; document: MorphologySourceViewDocument | IndividualMorphologySourceViewDocument | MainSceneSourceViewDocument | NativeContourSourceViewDocument } | null>(null);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [png, setPng] = useState<{ signature: string; url: string; preview: string } | null>(null);
  const [encodingSignature, setEncodingSignature] = useState<string | null>(null);
  const exportEpoch = useRef(0);
  const pngUrl = useRef<string | null>(null);
  useEffect(() => () => {
    exportEpoch.current += 1;
    if (pngUrl.current) URL.revokeObjectURL(pngUrl.current);
    pngUrl.current = null;
  }, [neuronId, signature, available, restoring]);
  const current = available && prepared?.signature === signature ? prepared.document : null;
  const currentPng = current && png?.signature === signature ? png : null;
  const staleSuccessMessage = (message.startsWith("Current source view captured.") && !current)
    || (message.startsWith("PNG prepared") && !currentPng)
    || (message.startsWith("Source file rechecked and view restored.") && !available);
  const encoding = encodingSignature === signature;
  const invalidatePng = () => {
    exportEpoch.current += 1;
    if (pngUrl.current) URL.revokeObjectURL(pngUrl.current);
    pngUrl.current = null;
    setPng(null); setEncodingSignature(null);
  };
  const prepare = () => {
    invalidatePng();
    try { setPrepared({ signature, document: capture() }); setMessage("Current source view captured. Changes to the view clear this capture."); }
    catch (error) { setPrepared(null); setMessage(error instanceof Error ? error.message : "The current view is unavailable."); }
  };
  const download = () => {
    if (!current) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(current, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `neuromorpho-${neuronId}-source-view.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const replay = async () => {
    invalidatePng();
    try {
      const document = JSON.parse(input);
      setPrepared(null); setMessage("Rechecking the exact source file before restoring the view…");
      await restore(document);
      setMessage("Source file rechecked and view restored. Capture again to record the new verification and viewport.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The source view could not be restored."); }
  };
  const downloadPng = async () => {
    if (!current || !exportPng || encoding) return;
    const epoch = ++exportEpoch.current;
    setEncodingSignature(signature);
    try {
      const result = await exportPng(current);
      if (epoch !== exportEpoch.current) return;
      if (pngUrl.current) URL.revokeObjectURL(pngUrl.current);
      const url = URL.createObjectURL(result.blob);
      pngUrl.current = url; setPng({ signature, url, preview: result.preview });
      const link = document.createElement("a");
      link.href = url; link.download = pngFilename ?? `neuromorpho-${neuronId}-native-source-view.png`; link.click();
      setMessage("PNG prepared with the actual view and source disclosure. Preview or download it below.");
    } catch (error) {
      if (epoch === exportEpoch.current) setMessage(error instanceof Error ? error.message : "The PNG could not be prepared.");
    } finally {
      if (epoch === exportEpoch.current) setEncodingSignature(null);
    }
  };
  return <details className="morphology-source-view-controls" aria-label={`Source view receipt for NeuroMorpho ${neuronId}`}>
    <summary>Save or restore this source view</summary>
    <p>{description ?? "Save this camera, topology layer and branch selection. Restoration rechecks the exact source file and adapts to the current viewport size. Source axes remain local; no atlas registration or internal anatomy is added."}</p>
    {!available && !restoring && unavailableReason && <p role="status">{unavailableReason}</p>}
    <div className="morphology-source-view-actions">
      <button type="button" disabled={!available || restoring} onClick={prepare}>Capture source view</button>
      <button type="button" disabled={!current || restoring} onClick={download}>Export source view JSON</button>
      {exportPng && <button type="button" disabled={!current || restoring || encoding} onClick={() => { void downloadPng(); }}>{encoding ? "Preparing PNG…" : "Export source view PNG"}</button>}
    </div>
    {currentPng && <details className="morphology-source-view-png-preview">
      <summary>Preview exported PNG</summary>
      <p><a href={currentPng.url} download={pngFilename ?? `neuromorpho-${neuronId}-native-source-view.png`}>Download exported PNG</a></p>
      {/* The local data URL previews the exact encoded export rather than an optimized replacement. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={currentPng.preview} alt={`Exported source view PNG for NeuroMorpho ${neuronId}, with a source disclosure footer`} />
    </details>}
    {current && <textarea readOnly aria-label={`Current source view receipt for NeuroMorpho ${neuronId}`} value={JSON.stringify(current, null, 2)} rows={7} />}
    <label>Paste a saved view for this source
      <textarea aria-label={`Saved source view for NeuroMorpho ${neuronId}`} value={input} onChange={event => setInput(event.target.value)} rows={5} disabled={restoring} />
    </label>
    <button type="button" disabled={!input.trim() || restoring} onClick={() => { void replay(); }}>Restore source view</button>
    {message && !staleSuccessMessage && <p role="status">{message}</p>}
  </details>;
}
