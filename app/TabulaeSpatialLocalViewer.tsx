"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { tabulaeSpatialLocalSession } from "./atlas-types";

type MemberKind = "low_resolution_tissue_image" | "spot_positions" | "scale_factors";
type Spot = { barcode: string; inTissue: boolean; arrayRow: number; arrayColumn: number; x: number; y: number };
type ScaleFactors = { lowResolutionScale: number; spotDiameterFullResolution: number | null };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

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

export function parseVisiumPositions(value: string): Spot[] {
  const rows = value.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  const withoutHeader = rows[0]?.toLowerCase().startsWith("barcode,") ? rows.slice(1) : rows;
  if (!withoutHeader.length) throw new Error("spot-position CSV contains no rows");
  const spots = withoutHeader.map((row, index) => {
    const fields = row.split(",");
    if (fields.length !== 6) throw new Error(`spot-position row ${index + 1} must contain six comma-separated fields`);
    const [barcode, inTissue, arrayRow, arrayColumn, y, x] = fields;
    const numeric = [arrayRow, arrayColumn, x, y].map(Number);
    if (!barcode || !["0", "1"].includes(inTissue) || numeric.some((item) => !Number.isFinite(item))) {
      throw new Error(`spot-position row ${index + 1} has an unsupported source-local Visium value`);
    }
    return { barcode, inTissue: inTissue === "1", arrayRow: numeric[0], arrayColumn: numeric[1], x: numeric[2], y: numeric[3] };
  });
  return spots;
}

export function parseScaleFactors(value: string): ScaleFactors {
  const parsed: unknown = JSON.parse(value);
  if (!isRecord(parsed) || typeof parsed.tissue_lowres_scalef !== "number" || !Number.isFinite(parsed.tissue_lowres_scalef) || parsed.tissue_lowres_scalef <= 0) {
    throw new Error("scale-factor JSON needs a finite positive tissue_lowres_scalef");
  }
  const spot = parsed.spot_diameter_fullres;
  if (spot !== undefined && (typeof spot !== "number" || !Number.isFinite(spot) || spot <= 0)) {
    throw new Error("spot_diameter_fullres must be a finite positive number when supplied");
  }
  return { lowResolutionScale: parsed.tissue_lowres_scalef, spotDiameterFullResolution: typeof spot === "number" ? spot : null };
}

export default function TabulaeSpatialLocalViewer({ onNotice }: { onNotice: (notice: string) => void }) {
  const catalog = tabulaeSpatialLocalSession;
  const fileInput = useRef<HTMLInputElement>(null);
  const [sampleId, setSampleId] = useState(catalog.samples[0].id);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [tissueOnly, setTissueOnly] = useState(true);
  const selectedSample = useMemo(() => catalog.samples.find((sample) => sample.id === sampleId) ?? catalog.samples[0], [catalog.samples, sampleId]);
  const expected = useMemo(() => expectedMembers(selectedSample), [selectedSample]);

  useEffect(() => () => {
    if (session) URL.revokeObjectURL(session.imageUrl);
  }, [session]);

  const reset = () => {
    if (session) URL.revokeObjectURL(session.imageUrl);
    setSession(null);
    setImageSize(null);
    if (fileInput.current) fileInput.current.value = "";
    onNotice("Tabulae local spatial session cleared; no source file was retained");
  };

  const importTriplet = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.currentTarget.files ?? [])];
    event.currentTarget.value = "";
    if (files.length !== 3) {
      onNotice("Local spatial import rejected · select exactly the three gzip members for one declared section");
      return;
    }
    if (files.some((file) => file.size > catalog.localImport.maximumInputBytesPerMember)) {
      onNotice("Local spatial import rejected · one member exceeds the local-viewer size limit");
      return;
    }
    const byName = new Map(files.map((file) => [file.name, file]));
    const kinds = Object.keys(expected) as MemberKind[];
    if (byName.size !== 3 || !kinds.every((kind) => byName.has(expected[kind]))) {
      onNotice("Local spatial import rejected · file names must exactly match the selected GEO section triplet");
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
      const spots = parseVisiumPositions(positionsText);
      const scaleFactors = parseScaleFactors(scaleText);
      const imageUrl = URL.createObjectURL(new Blob([imageBytes], { type: catalog.localImport.acceptedImageMediaType }));
      if (session) URL.revokeObjectURL(session.imageUrl);
      setSession({
        sampleId: selectedSample.id,
        sectionLabel: selectedSample.sectionLabel,
        geoSampleAccession: selectedSample.geoSampleAccession,
        imageUrl,
        spots,
        scaleFactors,
        fileHashes: { low_resolution_tissue_image: imageHash, spot_positions: positionsHash, scale_factors: scaleHash },
        fileNames: expected,
      });
      setImageSize(null);
      onNotice(`${selectedSample.sectionLabel} local session opened · ${spots.length} source-local spots parsed · no upload, bundle, transform or REG`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unsupported local source files";
      onNotice("Local spatial import rejected · " + message);
    }
  };

  const visibleSpots = session?.spots.filter((spot) => !tissueOnly || spot.inTissue) ?? [];
  const spotRadius = session && imageSize
    ? Math.max(0.8, Math.min(6, ((session.scaleFactors.spotDiameterFullResolution ?? 14) * session.scaleFactors.lowResolutionScale) / 2))
    : 1;

  return (
    <section className="tabulae-local-viewer" aria-labelledby="tabulae-local-viewer-heading">
      <div className="tabulae-local-viewer-heading">
        <div>
          <span>LOCAL SOURCE-IMAGE SESSION · GSE234774</span>
          <h5 id="tabulae-local-viewer-heading">Tabulae Visium spot inspector</h5>
        </div>
        <span className="badge inferred">2D · NOT REGISTERED</span>
      </div>
      <p>{catalog.purpose}</p>
      <p className="taxonomy-boundary">{catalog.releaseDecision.forbidden}</p>

      <div className="tabulae-local-controls">
        <label>
          Declared GEO section
          <select value={sampleId} onChange={(event) => { setSampleId(event.target.value); reset(); }}>
            {catalog.samples.map((sample) => <option value={sample.id} key={sample.id}>{sample.sectionLabel} · {sample.geoSampleAccession}</option>)}
          </select>
        </label>
        <div>
          <span>Required extracted members</span>
          <code>{expected.low_resolution_tissue_image}<br />{expected.spot_positions}<br />{expected.scale_factors}</code>
        </div>
      </div>
      <div className="tabulae-local-actions">
        <a href={catalog.archive.sourceUrl} target="_blank" rel="noreferrer">Open public GEO archive ↗</a>
        <a href={catalog.archive.publicFileListUrl} target="_blank" rel="noreferrer">Open public file list ↗</a>
        <button type="button" onClick={() => fileInput.current?.click()}>Select local triplet</button>
        {session && <button type="button" onClick={reset}>Clear session</button>}
        <input ref={fileInput} className="sr-only" type="file" multiple accept=".gz,application/gzip" onChange={importTriplet} />
      </div>
      <dl className="catalog-detail-grid tabulae-local-receipt-grid">
        <div><dt>Archive</dt><dd>{catalog.archive.stableName} · {(catalog.archive.bytes / 1024 / 1024).toFixed(1)} MB</dd></div>
        <div><dt>Declared sections</dt><dd>{catalog.samples.length} declared public GEO sections</dd></div>
        <div><dt>Source checksum</dt><dd>null · not published in this session contract</dd></div>
        <div><dt>Asset rights</dt><dd>unresolved · no source file bundled</dd></div>
        <div><dt>Browser handling</dt><dd>local only · no upload or persistence</dd></div>
      </dl>

      {!session ? (
        <p className="tabulae-local-empty">Select the exact three gzip members after obtaining them lawfully from the public GEO archive. The app will validate the declared section filename pattern, decompress in your browser, calculate local SHA-256 receipts, and show only source-local 2D spot geometry.</p>
      ) : (
        <div className="tabulae-local-session">
          <div className="tabulae-local-session-summary">
            <p><strong>{session.sectionLabel} · {session.geoSampleAccession}</strong> · {session.spots.length} parsed source-local rows · {visibleSpots.length} displayed {tissueOnly ? "in-tissue" : "all"} spots.</p>
            <label><input type="checkbox" checked={tissueOnly} onChange={(event) => setTissueOnly(event.target.checked)} /> Show in-tissue spots only</label>
            <button type="button" onClick={() => {
              downloadJson({
                releaseId: catalog.releaseId,
                authority: catalog.authority,
                archive: catalog.archive,
                localSession: {
                  sampleId: session.sampleId,
                  geoSampleAccession: session.geoSampleAccession,
                  sectionLabel: session.sectionLabel,
                  fileNames: session.fileNames,
                  fileHashes: session.fileHashes,
                  parsedSpotRows: session.spots.length,
                  displayedSpotRows: visibleSpots.length,
                  scaleFactors: session.scaleFactors,
                  sourceChecksum: null,
                  sourceFileBundled: false,
                  projectRegistrationCount: 0,
                },
                boundary: catalog.releaseDecision.forbidden,
              }, `ohri-tabulae-local-session-${session.sectionLabel.toLowerCase()}.json`);
              onNotice("Local spatial session receipt exported · it contains no image, coordinate rows, source body or registration");
            }}>Export local receipt</button>
          </div>
          <div className="tabulae-local-canvas">
            {/* eslint-disable-next-line @next/next/no-img-element -- The selected local Blob URL must remain browser-only. */}
            <img
              src={session.imageUrl}
              alt={`Tabulae ${session.sectionLabel} low-resolution tissue selected locally`}
              onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            />
            {imageSize && <svg viewBox={`0 0 ${imageSize.width} ${imageSize.height}`} aria-label={`${visibleSpots.length} source-local spatial spots over the selected tissue image`}>
              {visibleSpots.map((spot) => <circle key={spot.barcode} cx={spot.x * session.scaleFactors.lowResolutionScale} cy={spot.y * session.scaleFactors.lowResolutionScale} r={spotRadius} />)}
            </svg>}
          </div>
          <p className="tabulae-local-limit">The circles are source-local Visium spot positions over a chosen 2D image. They are not individual interneurons, a segmentation, gene-expression result, 3D coordinate, atlas transform, same-cell join or `REG`.</p>
        </div>
      )}
      <section className="tabulae-local-decision">
        <strong>Next admission gate</strong>
        <p>{catalog.releaseDecision.nextGate}</p>
      </section>
    </section>
  );
}
