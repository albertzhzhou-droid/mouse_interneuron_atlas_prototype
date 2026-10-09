"use client";

import { useMemo, useState } from "react";

type SourceId = "PDS-SPINALJ-PROCESSED" | "PDS-CANOGOMEZ-2026";
type ChecksumAlgorithm = "sha1" | "sha256";
type GenericDraftFile = {
  id: string;
  stableName: string;
  sourceUrl: string;
  bytes: string;
  format: string;
  checksumAlgorithm: ChecksumAlgorithm;
  checksumValue: string;
  unit: string;
  axisOrder: string;
  origin: string;
  missingReason: string;
};
type CanoDraftSpecimen = {
  specimenId: string;
  animalId: string;
  sex: "female" | "male" | "not_reported";
  spinalRegion: string;
  assay: string;
  sourceFrame: string;
  coordinateUnit: string;
  axisOrder: string;
  axisDirection: string;
  coordinateOrigin: string;
  pixelOrVoxelScale: string;
  missingReason: string;
};
type CanoDraftFile = Omit<GenericDraftFile, "unit" | "axisOrder" | "origin" | "missingReason"> & {
  modality: "Xenium spatial transcriptomics" | "snMultiome";
  specimenIds: string;
};
type ChecksumPatch = Partial<Pick<GenericDraftFile, "checksumAlgorithm" | "checksumValue">>;

const CANO_ACCESSION = "GSE318731 / BIL DOI 10.35077/g.1196";
const CANO_SOURCE_URL = "https://www.biorxiv.org/content/10.64898/2026.06.11.731752v1";
const SPINALJ_ACCESSION = "Mendeley Data mkc37w4rrv.1 / DOI 10.17632/mkc37w4rrv.1";
const SPINALJ_SOURCE_URL = "https://data.mendeley.com/datasets/mkc37w4rrv/1";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function blankGenericFile(id: string): GenericDraftFile {
  return { id, stableName: "", sourceUrl: "", bytes: "", format: "", checksumAlgorithm: "sha256", checksumValue: "", unit: "", axisOrder: "", origin: "", missingReason: "" };
}

function blankCanoSpecimen(): CanoDraftSpecimen {
  return { specimenId: "", animalId: "", sex: "not_reported", spinalRegion: "", assay: "", sourceFrame: "", coordinateUnit: "", axisOrder: "", axisDirection: "", coordinateOrigin: "", pixelOrVoxelScale: "", missingReason: "" };
}

function blankCanoFile(id: string): CanoDraftFile {
  return { id, stableName: "", sourceUrl: "", bytes: "", format: "", checksumAlgorithm: "sha256", checksumValue: "", modality: "Xenium spatial transcriptomics", specimenIds: "" };
}

function isHttps(value: string) {
  return /^https:\/\//.test(value);
}

function dateIsValid(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}

function checksumIsValid(algorithm: ChecksumAlgorithm, value: string) {
  return algorithm === "sha1" ? /^[a-f0-9]{40}$/.test(value) : /^[a-f0-9]{64}$/.test(value);
}

function required(value: string, label: string, errors: string[]) {
  if (!value.trim()) errors.push(label + " is required");
}

function normalizeChecksum(value: string) {
  return value.trim().toLowerCase();
}

function cleanOptional(value: string) {
  return value.trim() || null;
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

export function buildSpinaljAdmissionManifest(input: {
  manifestId: string;
  reviewDate: string;
  version: string;
  landingPageUrl: string;
  files: GenericDraftFile[];
}) {
  const errors: string[] = [];
  if (!/^PFM-SPINALJ-\d{4}-\d{2}-\d{2}$/.test(input.manifestId)) errors.push("manifest ID must be PFM-SPINALJ-YYYY-MM-DD");
  if (!dateIsValid(input.reviewDate)) errors.push("review date must be a valid ISO date");
  required(input.version, "dataset version", errors);
  if (!isHttps(input.landingPageUrl)) errors.push("landing-page URL must start with https://");
  if (!input.files.length) errors.push("at least one public file metadata record is required");
  const ids = new Set<string>();
  const files = input.files.map((file, index) => {
    const label = "file " + (index + 1);
    for (const [value, name] of [[file.id, "ID"], [file.stableName, "stable name"], [file.sourceUrl, "source URL"], [file.format, "format"]] as const) required(value, label + " " + name, errors);
    if (ids.has(file.id.trim())) errors.push(label + " ID is duplicated");
    ids.add(file.id.trim());
    if (!isHttps(file.sourceUrl)) errors.push(label + " source URL must start with https://");
    const bytes = Number(file.bytes);
    if (!Number.isInteger(bytes) || bytes < 1) errors.push(label + " bytes must be a positive integer from source metadata");
    const checksum = normalizeChecksum(file.checksumValue);
    if (!checksumIsValid(file.checksumAlgorithm, checksum)) errors.push(label + " source checksum does not match the selected algorithm");
    const coordinates = [file.unit, file.axisOrder, file.origin].map((value) => value.trim());
    if (coordinates.some((value) => !value) && !file.missingReason.trim()) errors.push(label + " needs a coordinate missing reason when unit, axis order or origin is absent");
    return {
      id: file.id.trim(), stableName: file.stableName.trim(), sourceUrl: file.sourceUrl.trim(), bytes, format: file.format.trim(),
      sourceChecksum: { algorithm: file.checksumAlgorithm, value: checksum, provenance: "source_metadata" as const }, localSha256: null,
      rightsDecision: "recorded_for_file" as const,
      coordinates: { unit: cleanOptional(file.unit), axisOrder: cleanOptional(file.axisOrder), origin: cleanOptional(file.origin), missingReason: cleanOptional(file.missingReason) },
    };
  });
  if (errors.length) return { errors, manifest: null };
  return {
    errors,
    manifest: {
      formatVersion: "0.7.0", manifestId: input.manifestId, sourceId: "PDS-SPINALJ-PROCESSED", reviewDate: input.reviewDate,
      dataset: { accession: SPINALJ_ACCESSION, version: input.version.trim(), landingPageUrl: input.landingPageUrl.trim(), rightsDecision: "recorded_for_file" as const },
      files, admissionDecision: "metadata_only_not_downloaded_not_registered" as const,
    },
  };
}

export function buildCanoAdmissionManifest(input: {
  manifestId: string;
  reviewDate: string;
  version: string;
  landingPageUrl: string;
  specimens: CanoDraftSpecimen[];
  files: CanoDraftFile[];
}) {
  const errors: string[] = [];
  if (!/^PFM-CANOGOMEZ-\d{4}-\d{2}-\d{2}$/.test(input.manifestId)) errors.push("manifest ID must be PFM-CANOGOMEZ-YYYY-MM-DD");
  if (!dateIsValid(input.reviewDate)) errors.push("review date must be a valid ISO date");
  required(input.version, "dataset version", errors);
  if (!isHttps(input.landingPageUrl)) errors.push("landing-page URL must start with https://");
  if (!input.specimens.length) errors.push("at least one specimen record is required");
  const specimenIds = new Set<string>();
  const specimens = input.specimens.map((specimen, index) => {
    const label = "specimen " + (index + 1);
    for (const [value, name] of [[specimen.specimenId, "ID"], [specimen.spinalRegion, "spinal region"], [specimen.assay, "assay"], [specimen.sourceFrame, "source frame"]] as const) required(value, label + " " + name, errors);
    if (specimenIds.has(specimen.specimenId.trim())) errors.push(label + " ID is duplicated");
    specimenIds.add(specimen.specimenId.trim());
    const coordinateFields = [specimen.coordinateUnit, specimen.axisOrder, specimen.axisDirection, specimen.coordinateOrigin, specimen.pixelOrVoxelScale].map((value) => value.trim());
    if ((!specimen.animalId.trim() || coordinateFields.some((value) => !value)) && !specimen.missingReason.trim()) errors.push(label + " needs a missing reason when animal or coordinate metadata is absent");
    return {
      specimenId: specimen.specimenId.trim(), animalId: cleanOptional(specimen.animalId), sex: specimen.sex,
      spinalRegion: specimen.spinalRegion.trim(), assay: specimen.assay.trim(), sourceFrame: specimen.sourceFrame.trim(),
      coordinateUnit: cleanOptional(specimen.coordinateUnit), axisOrder: cleanOptional(specimen.axisOrder), axisDirection: cleanOptional(specimen.axisDirection), coordinateOrigin: cleanOptional(specimen.coordinateOrigin), pixelOrVoxelScale: cleanOptional(specimen.pixelOrVoxelScale), missingReason: cleanOptional(specimen.missingReason),
    };
  });
  if (!input.files.length) errors.push("at least one public file metadata record is required");
  const fileIds = new Set<string>();
  const files = input.files.map((file, index) => {
    const label = "file " + (index + 1);
    for (const [value, name] of [[file.id, "ID"], [file.stableName, "stable name"], [file.sourceUrl, "source URL"], [file.format, "format"]] as const) required(value, label + " " + name, errors);
    if (fileIds.has(file.id.trim())) errors.push(label + " ID is duplicated");
    fileIds.add(file.id.trim());
    if (!isHttps(file.sourceUrl)) errors.push(label + " source URL must start with https://");
    const bytes = Number(file.bytes);
    if (!Number.isInteger(bytes) || bytes < 1) errors.push(label + " bytes must be a positive integer from source metadata");
    const checksum = normalizeChecksum(file.checksumValue);
    if (!checksumIsValid(file.checksumAlgorithm, checksum)) errors.push(label + " source checksum does not match the selected algorithm");
    const linkedSpecimens = [...new Set(file.specimenIds.split(",").map((id) => id.trim()).filter(Boolean))];
    if (!linkedSpecimens.length || !linkedSpecimens.every((id) => specimenIds.has(id))) errors.push(label + " must list one or more known comma-separated specimen IDs");
    return {
      id: file.id.trim(), stableName: file.stableName.trim(), sourceUrl: file.sourceUrl.trim(), bytes, format: file.format.trim(), modality: file.modality, specimenIds: linkedSpecimens,
      sourceChecksum: { algorithm: file.checksumAlgorithm, value: checksum, provenance: "source_metadata" as const }, localSha256: null, rightsDecision: "recorded_for_file" as const,
    };
  });
  if (errors.length) return { errors, manifest: null };
  return {
    errors,
    manifest: {
      formatVersion: "0.8.0", manifestId: input.manifestId, sourceId: "PDS-CANOGOMEZ-2026", reviewDate: input.reviewDate,
      dataset: { accession: CANO_ACCESSION, version: input.version.trim(), landingPageUrl: input.landingPageUrl.trim(), preprintStatus: "preprint_resource" as const, rightsDecision: "recorded_for_file" as const },
      specimens, files, admissionDecision: "metadata_only_not_downloaded_not_registered" as const,
    },
  };
}

function TextField({ label, value, onChange, placeholder = "", type = "text", readOnly = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: "text" | "url" | "number" | "date"; readOnly?: boolean }) {
  return <label className="manifest-composer-field">{label}<input type={type} value={value} placeholder={placeholder} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ChecksumFields({ file, onChange }: { file: GenericDraftFile | CanoDraftFile; onChange: (patch: ChecksumPatch) => void }) {
  return <div className="manifest-composer-pair"><label className="manifest-composer-field">Source checksum algorithm<select value={file.checksumAlgorithm} onChange={(event) => onChange({ checksumAlgorithm: event.target.value as ChecksumAlgorithm })}><option value="sha256">SHA-256</option><option value="sha1">SHA-1</option></select></label><TextField label="Source checksum value" value={file.checksumValue} onChange={(checksumValue) => onChange({ checksumValue })} placeholder="From the publisher or repository metadata" /></div>;
}

function GenericFileEditor({ file, index, onChange, onRemove, showCoordinates, canRemove }: { file: GenericDraftFile; index: number; onChange: (patch: Partial<GenericDraftFile>) => void; onRemove: () => void; showCoordinates: boolean; canRemove: boolean }) {
  return <fieldset className="manifest-composer-record"><legend>Public file metadata #{index + 1}</legend><button type="button" className="manifest-composer-remove" disabled={!canRemove} onClick={onRemove}>Remove record</button><div className="manifest-composer-grid"><TextField label="File ID" value={file.id} onChange={(id) => onChange({ id })} placeholder="Repository object ID" /><TextField label="Stable file name" value={file.stableName} onChange={(stableName) => onChange({ stableName })} /><TextField label="Publisher object URL" type="url" value={file.sourceUrl} onChange={(sourceUrl) => onChange({ sourceUrl })} placeholder="https://…" /><TextField label="Published bytes" type="number" value={file.bytes} onChange={(bytes) => onChange({ bytes })} placeholder="Exact number from metadata" /><TextField label="Format" value={file.format} onChange={(format) => onChange({ format })} placeholder="e.g. TIFF, CSV, OME-Zarr" /></div><ChecksumFields file={file} onChange={onChange} />{showCoordinates && <><div className="manifest-composer-grid"><TextField label="Coordinate unit" value={file.unit} onChange={(unit) => onChange({ unit })} placeholder="e.g. µm" /><TextField label="Axis order" value={file.axisOrder} onChange={(axisOrder) => onChange({ axisOrder })} placeholder="e.g. z,y,x" /><TextField label="Coordinate origin" value={file.origin} onChange={(origin) => onChange({ origin })} placeholder="Source-declared origin" /></div><TextField label="Missing-coordinate reason (required if any field above is blank)" value={file.missingReason} onChange={(missingReason) => onChange({ missingReason })} /></>}</fieldset>;
}

export default function PublicFileAdmissionManifestComposer({ sourceId, onNotice }: { sourceId: SourceId; onNotice: (notice: string) => void }) {
  const [reviewDate, setReviewDate] = useState(today);
  const [spinaljVersion, setSpinaljVersion] = useState("v1; dataset-declared pipeline SpinalJ v1.13");
  const [spinaljLandingPageUrl, setSpinaljLandingPageUrl] = useState(SPINALJ_SOURCE_URL);
  const [spinaljFiles, setSpinaljFiles] = useState<GenericDraftFile[]>([blankGenericFile("spinalj-file-1")]);
  const [canoVersion, setCanoVersion] = useState("2026 preprint resource");
  const [canoLandingPageUrl, setCanoLandingPageUrl] = useState(CANO_SOURCE_URL);
  const [canoSpecimens, setCanoSpecimens] = useState<CanoDraftSpecimen[]>([blankCanoSpecimen()]);
  const [canoFiles, setCanoFiles] = useState<CanoDraftFile[]>([blankCanoFile("cano-file-1")]);
  const isCano = sourceId === "PDS-CANOGOMEZ-2026";
  const manifestId = isCano ? "PFM-CANOGOMEZ-" + reviewDate : "PFM-SPINALJ-" + reviewDate;
  const result = useMemo(() => isCano
    ? buildCanoAdmissionManifest({ manifestId, reviewDate, version: canoVersion, landingPageUrl: canoLandingPageUrl, specimens: canoSpecimens, files: canoFiles })
    : buildSpinaljAdmissionManifest({ manifestId, reviewDate, version: spinaljVersion, landingPageUrl: spinaljLandingPageUrl, files: spinaljFiles }),
  [canoFiles, canoLandingPageUrl, canoSpecimens, canoVersion, isCano, manifestId, reviewDate, spinaljFiles, spinaljLandingPageUrl, spinaljVersion]);

  const exportManifest = () => {
    if (!result.manifest) {
      onNotice("Manifest export blocked · resolve every metadata-only preflight field first");
      return;
    }
    downloadJson(result.manifest, result.manifest.manifestId.toLowerCase() + ".json");
    onNotice(result.manifest.manifestId + " exported · metadata only; no source file was acquired, bundled, transformed or registered");
  };

  const updateSpinaljFile = (index: number, patch: Partial<GenericDraftFile>) => setSpinaljFiles((files) => files.map((file, current) => current === index ? { ...file, ...patch } : file));
  const updateCanoFile = (index: number, patch: Partial<CanoDraftFile>) => setCanoFiles((files) => files.map((file, current) => current === index ? { ...file, ...patch } : file));
  const updateCanoSpecimen = (index: number, patch: Partial<CanoDraftSpecimen>) => setCanoSpecimens((specimens) => specimens.map((specimen, current) => current === index ? { ...specimen, ...patch } : specimen));

  return <section className="manifest-composer" aria-labelledby="manifest-composer-heading"><div className="manifest-composer-heading"><div><span>UPG-006 · LOCAL METADATA COMPOSER</span><h5 id="manifest-composer-heading">{isCano ? "Cano-Gomez specimen-aware manifest composer" : "SpinalJ object-level manifest composer"}</h5></div><span className="badge inferred">NO DOWNLOAD · 0 REG</span></div><p>Create a schema-shaped admission manifest from already published object metadata. This form never contacts a repository, calculates a local file hash, accepts a source file, stores a record, authorizes reuse, transforms coordinates or creates registration.</p><p className="taxonomy-boundary">A declared checksum and byte count must come from a source record, not from a local file. Exported JSON remains metadata-only and requires curator review before any acquisition.</p><div className="manifest-composer-grid"><TextField label="Review date" type="date" value={reviewDate} onChange={setReviewDate} /><TextField label="Generated manifest ID" value={manifestId} readOnly onChange={() => undefined} /></div>{isCano ? <><div className="manifest-composer-grid"><TextField label="Pinned accession" value={CANO_ACCESSION} readOnly onChange={() => undefined} /><TextField label="Dataset version" value={canoVersion} onChange={setCanoVersion} /><TextField label="Published landing page" type="url" value={canoLandingPageUrl} onChange={setCanoLandingPageUrl} /></div><p className="manifest-composer-fixed">Preprint status: <b>preprint resource</b> · Dataset rights decision: <b>recorded for file</b> · Local SHA-256: <b>null</b></p><div className="manifest-composer-subheading"><h6>Specimen metadata</h6><button type="button" onClick={() => setCanoSpecimens((items) => [...items, blankCanoSpecimen()])}>Add specimen</button></div>{canoSpecimens.map((specimen, index) => <fieldset className="manifest-composer-record" key={index}><legend>Specimen #{index + 1}</legend><button type="button" className="manifest-composer-remove" disabled={canoSpecimens.length === 1} onClick={() => setCanoSpecimens((items) => items.filter((_, current) => current !== index))}>Remove specimen</button><div className="manifest-composer-grid"><TextField label="Specimen ID" value={specimen.specimenId} onChange={(specimenId) => updateCanoSpecimen(index, { specimenId })} /><TextField label="Animal ID" value={specimen.animalId} onChange={(animalId) => updateCanoSpecimen(index, { animalId })} placeholder="Leave blank only with a missing reason" /><label className="manifest-composer-field">Sex<select value={specimen.sex} onChange={(event) => updateCanoSpecimen(index, { sex: event.target.value as CanoDraftSpecimen["sex"] })}><option value="not_reported">Not reported</option><option value="female">Female</option><option value="male">Male</option></select></label><TextField label="Spinal region" value={specimen.spinalRegion} onChange={(spinalRegion) => updateCanoSpecimen(index, { spinalRegion })} /><TextField label="Assay" value={specimen.assay} onChange={(assay) => updateCanoSpecimen(index, { assay })} /><TextField label="Source coordinate frame" value={specimen.sourceFrame} onChange={(sourceFrame) => updateCanoSpecimen(index, { sourceFrame })} /></div><div className="manifest-composer-grid"><TextField label="Coordinate unit" value={specimen.coordinateUnit} onChange={(coordinateUnit) => updateCanoSpecimen(index, { coordinateUnit })} /><TextField label="Axis order" value={specimen.axisOrder} onChange={(axisOrder) => updateCanoSpecimen(index, { axisOrder })} /><TextField label="Axis direction" value={specimen.axisDirection} onChange={(axisDirection) => updateCanoSpecimen(index, { axisDirection })} /><TextField label="Coordinate origin" value={specimen.coordinateOrigin} onChange={(coordinateOrigin) => updateCanoSpecimen(index, { coordinateOrigin })} /><TextField label="Pixel or voxel scale" value={specimen.pixelOrVoxelScale} onChange={(pixelOrVoxelScale) => updateCanoSpecimen(index, { pixelOrVoxelScale })} /></div><TextField label="Missing reason (required if animal or any coordinate field is blank)" value={specimen.missingReason} onChange={(missingReason) => updateCanoSpecimen(index, { missingReason })} /></fieldset>)}<div className="manifest-composer-subheading"><h6>Public file metadata</h6><button type="button" onClick={() => setCanoFiles((items) => [...items, blankCanoFile("cano-file-" + (items.length + 1))])}>Add file record</button></div>{canoFiles.map((file, index) => <fieldset className="manifest-composer-record" key={index}><legend>Public file metadata #{index + 1}</legend><button type="button" className="manifest-composer-remove" disabled={canoFiles.length === 1} onClick={() => setCanoFiles((items) => items.filter((_, current) => current !== index))}>Remove record</button><div className="manifest-composer-grid"><TextField label="File ID" value={file.id} onChange={(id) => updateCanoFile(index, { id })} /><TextField label="Stable file name" value={file.stableName} onChange={(stableName) => updateCanoFile(index, { stableName })} /><TextField label="Publisher object URL" type="url" value={file.sourceUrl} onChange={(sourceUrl) => updateCanoFile(index, { sourceUrl })} /><TextField label="Published bytes" type="number" value={file.bytes} onChange={(bytes) => updateCanoFile(index, { bytes })} /><TextField label="Format" value={file.format} onChange={(format) => updateCanoFile(index, { format })} /><label className="manifest-composer-field">Modality<select value={file.modality} onChange={(event) => updateCanoFile(index, { modality: event.target.value as CanoDraftFile["modality"] })}><option value="Xenium spatial transcriptomics">Xenium spatial transcriptomics</option><option value="snMultiome">snMultiome</option></select></label><TextField label="Specimen IDs (comma-separated)" value={file.specimenIds} onChange={(specimenIds) => updateCanoFile(index, { specimenIds })} placeholder="Must match a record above" /></div><ChecksumFields file={file} onChange={(patch) => updateCanoFile(index, patch)} /></fieldset>)}</> : <><div className="manifest-composer-grid"><TextField label="Pinned accession" value={SPINALJ_ACCESSION} readOnly onChange={() => undefined} /><TextField label="Dataset version" value={spinaljVersion} onChange={setSpinaljVersion} /><TextField label="Published landing page" type="url" value={spinaljLandingPageUrl} onChange={setSpinaljLandingPageUrl} /></div><p className="manifest-composer-fixed">Dataset rights decision: <b>recorded for file</b> · Local SHA-256: <b>null</b> · Admission: <b>metadata only, not downloaded, not registered</b></p><div className="manifest-composer-subheading"><h6>Public file metadata</h6><button type="button" onClick={() => setSpinaljFiles((items) => [...items, blankGenericFile("spinalj-file-" + (items.length + 1))])}>Add file record</button></div>{spinaljFiles.map((file, index) => <GenericFileEditor key={index} file={file} index={index} showCoordinates canRemove={spinaljFiles.length > 1} onChange={(patch) => updateSpinaljFile(index, patch)} onRemove={() => setSpinaljFiles((items) => items.length === 1 ? items : items.filter((_, current) => current !== index))} />)}</>}<div className="manifest-composer-validation" aria-live="polite"><strong>{result.errors.length ? "Export blocked until metadata is complete" : "Ready to export metadata-only manifest"}</strong>{result.errors.length ? <ul>{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>The exported object has null local SHA-256 and `metadata_only_not_downloaded_not_registered`; it cannot be mistaken for an acquired data file or registration.</p>}</div><div className="catalog-actions"><button type="button" onClick={exportManifest} disabled={!result.manifest}>Export file-admission manifest</button></div></section>;
}
