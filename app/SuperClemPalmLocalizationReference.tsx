"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import palmReference from "../data/super-clem-palm-localization-reference-0.1.json";

type PalmPayload = {
  matrix: {
    detections: number[][];
    detectionCount: number;
    frameRange: { minimum: number; maximum: number };
    xRangeNative: { minimum: number; maximum: number };
    yRangeNative: { minimum: number; maximum: number };
  };
};

const WIDTH = 720;
const HEIGHT = 440;
const MARGIN = { top: 24, right: 24, bottom: 58, left: 70 };

export default function SuperClemPalmLocalizationReference() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<PalmPayload | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "ready" | "error">("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || payload || loadState === "error") return;
    const controller = new AbortController();
    fetch(palmReference.pointDataUrl, { signal: controller.signal, cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Point asset request failed (${response.status})`);
        return response.arrayBuffer();
      })
      .then(async (bytes) => {
        const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
        const digestHex = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
        if (digestHex !== palmReference.pointPayloadSha256) throw new Error("Point asset SHA-256 differs from its source receipt");
        const nextPayload = JSON.parse(new TextDecoder().decode(bytes)) as PalmPayload;
        if (nextPayload.matrix?.detectionCount !== 18358 || nextPayload.matrix.detections.length !== 18358) {
          throw new Error("Point asset does not match the source receipt");
        }
        setPayload(nextPayload);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadState("error");
      });
    return () => controller.abort();
  }, [open, payload, loadState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(WIDTH * ratio);
    canvas.height = Math.round(HEIGHT * ratio);
    canvas.style.aspectRatio = `${WIDTH} / ${HEIGHT}`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, WIDTH, HEIGHT);

    const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const xMin = payload.matrix.xRangeNative.minimum;
    const xMax = payload.matrix.xRangeNative.maximum;
    const yMin = payload.matrix.yRangeNative.minimum;
    const yMax = payload.matrix.yRangeNative.maximum;
    const xSpan = Math.max(xMax - xMin, Number.EPSILON);
    const ySpan = Math.max(yMax - yMin, Number.EPSILON);
    const sourceSpan = Math.max(xSpan, ySpan);
    const scale = Math.min(plotWidth / sourceSpan, plotHeight / sourceSpan);
    const usedWidth = xSpan * scale;
    const usedHeight = ySpan * scale;
    const left = MARGIN.left + (plotWidth - usedWidth) / 2;
    const top = MARGIN.top + (plotHeight - usedHeight) / 2;
    const x = (value: number) => left + (value - xMin) * scale;
    const y = (value: number) => top + (yMax - value) * scale;

    context.strokeStyle = "#e4e9ef";
    context.lineWidth = 1;
    for (let tick = 0; tick <= 4; tick += 1) {
      const gx = left + (usedWidth * tick) / 4;
      const gy = top + (usedHeight * tick) / 4;
      context.beginPath();
      context.moveTo(gx, top);
      context.lineTo(gx, top + usedHeight);
      context.stroke();
      context.beginPath();
      context.moveTo(left, gy);
      context.lineTo(left + usedWidth, gy);
      context.stroke();
    }
    context.strokeStyle = "#738399";
    context.strokeRect(left, top, usedWidth, usedHeight);
    context.fillStyle = "#176e73";
    for (const [, xValue, yValue] of payload.matrix.detections) {
      context.beginPath();
      context.arc(x(xValue), y(yValue), 1.25, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = "#43546a";
    context.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.textAlign = "center";
    context.fillText(`X · native source values (${xMin.toFixed(2)}–${xMax.toFixed(2)})`, WIDTH / 2, HEIGHT - 17);
    context.save();
    context.translate(19, HEIGHT / 2);
    context.rotate(-Math.PI / 2);
    context.fillText(`Y · native source values (${yMin.toFixed(2)}–${yMax.toFixed(2)})`, 0, 0);
    context.restore();
    context.textAlign = "left";
    context.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillStyle = "#6f7f91";
    context.fillText("2D plot · no physical scale · no drift transform", MARGIN.left, 16);
  }, [payload]);

  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open);

  return (
    <details id="superclem-palm-reference" className="superclem-palm-reference-card" onToggle={handleToggle}>
      <summary>
        <div><span>UPG-214 · SOURCE-ONLY PALM OBSERVATION</span><strong>2D localization detections · independent of selected cell</strong></div>
        <em>18,358 XY RECORDS · 0 CELL JOINS</em>
      </summary>
      <p>AQ848 dorsal spinal acquisition <code>181130_EosRmov009</code> · Figshare file 32526932 · source MAT row order: frame, X, Y, alpha, sigma.</p>
      <div className="superclem-palm-boundary" role="note">
        <strong>Source coordinates only; physical calibration is unavailable here</strong>
        <span>Axes retain the file&apos;s numeric X/Y values without assigning units. The source README does not establish this file&apos;s coordinate origin, axis orientation, or drift correction. Detections are not unique GlyR molecules. This view does not change when an atlas record is selected.</span>
      </div>
      {open && loadState === "idle" && <p role="status">Loading the checksum-verified source-coordinate plot…</p>}
      {loadState === "error" && <p role="alert">The source-coordinate payload could not be verified or loaded. No fallback geometry is shown.</p>}
      {payload && (
        <figure className="superclem-palm-figure">
          <canvas ref={canvasRef} role="img" aria-label="All 18,358 source PALM localization detections plotted in uncalibrated native X and Y coordinates; the points are not linked to a cell or synapse." />
          <figcaption>All {payload.matrix.detectionCount.toLocaleString()} source records are plotted once. Frame index: {payload.matrix.frameRange.minimum.toLocaleString()}–{payload.matrix.frameRange.maximum.toLocaleString()}; x and y scales are display transforms only, with equal numeric scale on both axes. Increasing Y upward is a plotting convention, not an asserted acquisition origin.</figcaption>
        </figure>
      )}
      <dl className="superclem-palm-facts">
        <div><dt>Unit / origin / drift</dt><dd>Not established for this file</dd></div>
        <div><dt>Count table</dt><dd>2 reported clusters; not an exhaustive detection partition</dd></div>
        <div><dt>3D / cell / subtype links</dt><dd>None · no overlay with BP057 EM</dd></div>
      </dl>
      <nav className="spinal-volume-em-links" aria-label="Super-CLEM PALM source links">
        <a href={palmReference.source.articleUrl} target="_blank" rel="noreferrer">Primary article ↗</a>
        <a href={`https://doi.org/${palmReference.source.datasetDoi}`} target="_blank" rel="noreferrer">Figshare v1 dataset ↗</a>
        <a href="https://ndownloader.figshare.com/files/32526932" target="_blank" rel="noreferrer">Original MAT file ↗</a>
      </nav>
    </details>
  );
}
