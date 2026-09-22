"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { tabulaeSpatialLocalComparison, tabulaeSpatialLocalSession } from "./atlas-types";
import { parseScaleFactors, parseVisiumPositions } from "./TabulaeSpatialLocalViewer";

type MemberKind = "low_resolution_tissue_image" | "spot_positions" | "scale_factors";
type Spot = ReturnType<typeof parseVisiumPositions>[number];
type ScaleFactors = ReturnType<typeof parseScaleFactors>;
type LocalSession = {
  sampleId: string;
  sectionLabel: string;
  geoSampleAccession: string;
  imageUrl: string;
  spots: Spot[];
  scaleFactors: ScaleFactors;
  fileHashes: Record<MemberKind, string>;
  fileNames: Record<MemberKind, string>;
};

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function expectedMembers(sample: (typeof tabulaeSpatialLocalSession.samples)[number]): Record<MemberKind, string> {
  const prefix = `${sample.geoSampleAccession}_${sample.sectionLabel}`;
  return {
    low_resolution_tissue_image: `${prefix}_tissue_lowres_image.png.gz`,
    spot_positions: `${prefix}_tissue_positions_list.csv.gz`,
    scale_factors: `${prefix}_scalefactors_json.json.gz`,
  };
}

async function decompressGzip(file: File): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress gzip locally; use a current Chromium, Firefox or Safari release");
  }
  const source = new Blob([new Uint8Array(await file.arrayBuffer())]);
  const stream = source.stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function SessionCard({ session, tissueOnly, onRemove }: { session: LocalSession; tissueOnly: boolean; onRemove: () => void }) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const visibleSpots = session.spots.filter((spot) => !tissueOnly || spot.inTissue);
  const spotRadius = imageSize
    ? Math.max(0.8, Math.min(6, ((session.scaleFactors.spotDiameterFullResolution ?? 14) * session.scaleFactors.lowResolutionScale) / 2))
    : 1;

  return (
    <article className="tabulae-comparison-card">
      <header>
        <div>
          <strong>{session.sectionLabel}</strong>
          <span>{session.geoSampleAccession} · source-local 2D</span>
        </div>
        <button type="button" onClick={onRemove}>Remove session</button>
      </header>
      <p>{session.spots.length} parsed rows · {visibleSpots.length} displayed {tissueOnly ? "in-tissue" : "all"} spots.</p>
      <div className="tabulae-local-canvas tabulae-comparison-canvas">
        {/* Local object URLs cannot be safely optimized through next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={session.imageUrl}
          alt={`Tabulae ${session.sectionLabel} low-resolution tissue selected locally`}
          onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
        />
        {imageSize && <svg viewBox={`0 0 ${imageSize.width} ${imageSize.height}`} aria-label={`${visibleSpots.length} source-local spatial spots over ${session.sectionLabel}`}>
          {visibleSpots.map((spot) => <circle key={spot.barcode} cx={spot.x * session.scaleFactors.lowResolutionScale} cy={spot.y * session.scaleFactors.lowResolutionScale} r={spotRadius} />)}
        </svg>}
      </div>
      <dl className="catalog-detail-grid tabulae-comparison-detail-grid">
        <div><dt>Scale</dt><dd>{session.scaleFactors.lowResolutionScale}</dd></div>
        <div><dt>Local hash receipt</dt><dd>3 gzip members</dd></div>
      </dl>
      <p className="tabulae-comparison-limit">A session is not section-to-section alignment, a 3D stack, quantitative contrast, cell call, atlas transform or `REG`.</p>
    </article>
  );
}

export default function TabulaeSpatialComparisonBoard({ onNotice }: { onNotice: (notice: string) => void }) {
  const sessionCatalog = tabulaeSpatialLocalSession;
  const comparisonCatalog = tabulaeSpatialLocalComparison;
  const fileInput = useRef<HTMLInputElement>(null);
  const sessionsRef = useRef<LocalSession[]>([]);
  const [sampleId, setSampleId] = useState(sessionCatalog.samples[0].id);
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [tissueOnly, setTissueOnly] = useState(true);
  const selectedSample = useMemo(() => sessionCatalog.samples.find((sample) => sample.id === sampleId) ?? sessionCatalog.samples[0], [sampleId, sessionCatalog.samples]);
  const expected = useMemo(() => expectedMembers(selectedSample), [selectedSample]);
  const maxSessions = comparisonCatalog.comparison.maximumConcurrentSessions;

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);
  useEffect(() => () => {
    sessionsRef.current.forEach((session) => URL.revokeObjectURL(session.imageUrl));
  }, []);

  const removeSession = (sampleIdToRemove: string) => {
    setSessions((previous) => {
      const removed = previous.find((session) => session.sampleId === sampleIdToRemove);
      if (removed) URL.revokeObjectURL(removed.imageUrl);
      return previous.filter((session) => session.sampleId !== sampleIdToRemove);
    });
    onNotice("Local comparison session removed; source content was not retained");
  };

  const clearSessions = () => {
    sessions.forEach((session) => URL.revokeObjectURL(session.imageUrl));
    setSessions([]);
    onNotice("Tabulae local comparison cleared; no source file was retained");
  };

  const importTriplet = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = "";
    if (sessions.length >= maxSessions) {
      onNotice(`Local comparison import rejected · remove a session before adding more than ${maxSessions}`);
      return;
    }
    if (sessions.some((session) => session.sampleId === selectedSample.id)) {
      onNotice("Local comparison import rejected · this declared GEO section is already active");
      return;
    }
    if (files.length !== 3) {
      onNotice("Local comparison import rejected · select exactly the three gzip members for one declared section");
      return;
    }
    if (files.some((file) => file.size > sessionCatalog.localImport.maximumInputBytesPerMember)) {
      onNotice("Local comparison import rejected · one member exceeds the local-viewer size limit");
      return;
    }
    const byName = new Map(files.map((file) => [file.name, file]));
    const kinds = Object.keys(expected) as MemberKind[];
    if (byName.size !== 3 || !kinds.every((kind) => byName.has(expected[kind]))) {
      onNotice("Local comparison import rejected · file names must exactly match the selected GEO section triplet");
      return;
    }
    try {
      const imageFile = byName.get(expected.low_resolution_tissue_image);
      const positionsFile = byName.get(expected.spot_positions);
      const scaleFile = byName.get(expected.scale_factors);
      if (!imageFile || !positionsFile || !scaleFile) throw new Error("complete local triplet missing");
      const [imageBytes, positionsText, scaleText, imageHash, positionsHash, scaleHash] = await Promise.all([
        decompressGzip(imageFile),
        decompressGzip(positionsFile).then((bytes) => new TextDecoder().decode(bytes)),
        decompressGzip(scaleFile).then((bytes) => new TextDecoder().decode(bytes)),
        sha256(imageFile),
        sha256(positionsFile),
        sha256(scaleFile),
      ]);
      const added: LocalSession = {
        sampleId: selectedSample.id,
        sectionLabel: selectedSample.sectionLabel,
        geoSampleAccession: selectedSample.geoSampleAccession,
        imageUrl: URL.createObjectURL(new Blob([imageBytes], { type: sessionCatalog.localImport.acceptedImageMediaType })),
        spots: parseVisiumPositions(positionsText),
        scaleFactors: parseScaleFactors(scaleText),
        fileHashes: { low_resolution_tissue_image: imageHash, spot_positions: positionsHash, scale_factors: scaleHash },
        fileNames: expected,
      };
      setSessions((previous) => [...previous, added]);
      onNotice(`${added.sectionLabel} added to local comparison · ${added.spots.length} source-local spots · no upload, alignment, transform or REG`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unsupported local source files";
      onNotice("Local comparison import rejected · " + message);
    }
  };

  const exportReceipt = () => {
    downloadJson({
      releaseId: comparisonCatalog.releaseId,
      authority: comparisonCatalog.authority,
      baseSessionReleaseId: sessionCatalog.releaseId,
      comparison: comparisonCatalog.comparison,
      sessions: sessions.map((session) => ({
        sampleId: session.sampleId,
        geoSampleAccession: session.geoSampleAccession,
        sectionLabel: session.sectionLabel,
        fileNames: session.fileNames,
        fileHashes: session.fileHashes,
        parsedSpotRows: session.spots.length,
        displayedSpotRows: session.spots.filter((spot) => !tissueOnly || spot.inTissue).length,
        scaleFactors: session.scaleFactors,
        sourceChecksum: null,
        sourceFileBundled: false,
        projectRegistrationCount: 0,
      })),
      boundary: comparisonCatalog.releaseDecision.forbidden,
    }, "ohri-tabulae-local-comparison-receipt.json");
    onNotice("Local comparison receipt exported · it contains no image, source coordinates, expression data, alignment or registration");
  };

  return (
    <section className="tabulae-local-viewer tabulae-comparison-board" aria-labelledby="tabulae-comparison-heading">
      <div className="tabulae-local-viewer-heading">
        <div>
          <span>LOCAL MULTI-SECTION SESSION · GSE234774</span>
          <h5 id="tabulae-comparison-heading">Tabulae source-local comparison board</h5>
        </div>
        <span className="badge inferred">UP TO {maxSessions} · 2D · NOT REGISTERED</span>
      </div>
      <p>{comparisonCatalog.purpose}</p>
      <p className="taxonomy-boundary">{comparisonCatalog.releaseDecision.forbidden}</p>
      <p className="tabulae-comparison-limit">A session is not section-to-section alignment, a 3D stack, quantitative contrast, cell call, atlas transform or `REG`.</p>

      <div className="tabulae-local-controls">
        <label>
          Add declared GEO section
          <select value={sampleId} onChange={(event) => setSampleId(event.target.value)}>
            {sessionCatalog.samples.map((sample) => <option value={sample.id} key={sample.id} disabled={sessions.some((session) => session.sampleId === sample.id)}>{sample.sectionLabel} · {sample.geoSampleAccession}{sessions.some((session) => session.sampleId === sample.id) ? " · active" : ""}</option>)}
          </select>
        </label>
        <div>
          <span>Required extracted members</span>
          <code>{expected.low_resolution_tissue_image}<br />{expected.spot_positions}<br />{expected.scale_factors}</code>
        </div>
      </div>
      <div className="tabulae-local-actions">
        <a href={sessionCatalog.archive.sourceUrl} target="_blank" rel="noreferrer">Open public GEO archive ↗</a>
        <a href={sessionCatalog.archive.publicFileListUrl} target="_blank" rel="noreferrer">Open public file list ↗</a>
        <button type="button" disabled={sessions.length >= maxSessions} onClick={() => fileInput.current?.click()}>Add local triplet</button>
        {sessions.length > 0 && <button type="button" onClick={clearSessions}>Clear comparison</button>}
        <input ref={fileInput} className="sr-only" type="file" multiple accept=".gz,application/gzip" onChange={importTriplet} />
      </div>
      <dl className="catalog-detail-grid tabulae-local-receipt-grid">
        <div><dt>Active sessions</dt><dd>{sessions.length} / {maxSessions} unique declared sections</dd></div>
        <div><dt>Cross-section geometry</dt><dd>not established · no alignment</dd></div>
        <div><dt>Quantitative comparison</dt><dd>not permitted</dd></div>
        <div><dt>Browser handling</dt><dd>local only · no upload or persistence</dd></div>
      </dl>

      {sessions.length === 0 ? <p className="tabulae-local-empty">Add up to four exact local triplets after obtaining them lawfully from the public GEO archive. The board intentionally shows them side by side only; numeric section labels do not establish order, spacing, shared coordinates or a 3D stack.</p> : <>
        <div className="tabulae-comparison-toolbar">
          <label><input type="checkbox" checked={tissueOnly} onChange={(event) => setTissueOnly(event.target.checked)} /> Show in-tissue spots only</label>
          <button type="button" onClick={exportReceipt}>Export comparison receipt</button>
        </div>
        <div className="tabulae-comparison-grid">
          {sessions.map((session) => <SessionCard key={session.sampleId} session={session} tissueOnly={tissueOnly} onRemove={() => removeSession(session.sampleId)} />)}
        </div>
      </>}
      <section className="tabulae-local-decision">
        <strong>Cross-section / 3D gate remains separate</strong>
        <p>{comparisonCatalog.releaseDecision.nextGate}</p>
      </section>
    </section>
  );
}
