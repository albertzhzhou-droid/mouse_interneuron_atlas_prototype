"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  PUBLIC_DATA_ADMISSION_STATUSES,
  effectivePublicDataAdmissionStatus,
  publicDataCatalog,
  publicSourceIntakes,
  type PublicDataAdmissionStatus,
  type PublicDataCatalogSource,
} from "./atlas-types";
import TaxonomyCrosswalkExplorer from "./TaxonomyCrosswalkExplorer";
import TabulaeConditionExplorer from "./TabulaeConditionExplorer";
import TabulaeSpatialComparisonBoard from "./TabulaeSpatialComparisonBoard";
import PublicFileAdmissionManifestComposer from "./PublicFileAdmissionManifestComposer";
import PublicSourceReleaseAdmissionReview from "./PublicSourceReleaseAdmissionReview";
import PublicSourceAssertionProvenance from "./PublicSourceAssertionProvenance";
import PublicSourceAuthorizationPlan from "./PublicSourceAuthorizationPlan";
import PublicSourceIndependentAuthorizationEvidence from "./PublicSourceIndependentAuthorizationEvidence";
import PublicProvenanceCrateExporter from "./PublicProvenanceCrateExporter";
import EvidenceFeasibilityPlanner from "./EvidenceFeasibilityPlanner";
import EvidenceProvenanceTrace from "./EvidenceProvenanceTrace";
import CrossLaneRelationshipAdmission from "./CrossLaneRelationshipAdmission";

export type PublicDataCatalogState = {
  query: string;
  admissionStatus: "all" | PublicDataAdmissionStatus;
  selectedSourceId: string | null;
  plannerAxisIds: string[];
};

type GenericFileAdmissionManifest = {
  formatVersion: "0.7.0";
  manifestId: string;
  sourceId: "PDS-SPINALJ-PROCESSED" | "PDS-CANOGOMEZ-2026";
  dataset: {
    accession: string;
    version: string;
    landingPageUrl: string;
    rightsDecision: "recorded_for_file" | "pending_reject";
  };
  reviewDate: string;
  files: Array<{
    id: string;
    stableName: string;
    sourceUrl: string;
    bytes: number;
    format: string;
    sourceChecksum: {
      algorithm: "sha1" | "sha256";
      value: string;
      provenance: "source_metadata";
    };
    localSha256: null;
    rightsDecision: "recorded_for_file";
    coordinates: {
      unit: string | null;
      axisOrder: string | null;
      origin: string | null;
      missingReason: string | null;
    };
  }>;
  admissionDecision: "metadata_only_not_downloaded_not_registered";
};

type CanoSpecimenManifest = {
  formatVersion: "0.8.0";
  manifestId: string;
  sourceId: "PDS-CANOGOMEZ-2026";
  dataset: { accession: string; version: string; landingPageUrl: string; preprintStatus: "preprint_resource"; rightsDecision: "recorded_for_file" };
  reviewDate: string;
  specimens: Array<{ specimenId: string; animalId: string | null; sex: "female" | "male" | "not_reported"; spinalRegion: string; assay: string; sourceFrame: string; coordinateUnit: string | null; axisOrder: string | null; axisDirection: string | null; coordinateOrigin: string | null; pixelOrVoxelScale: string | null; missingReason: string | null }>;
  files: Array<{ id: string; stableName: string; sourceUrl: string; bytes: number; format: string; modality: "Xenium spatial transcriptomics" | "snMultiome"; specimenIds: string[]; sourceChecksum: { algorithm: "sha1" | "sha256"; value: string; provenance: "source_metadata" }; localSha256: null; rightsDecision: "recorded_for_file" }>;
  admissionDecision: "metadata_only_not_downloaded_not_registered";
};

type PublicFileAdmissionManifest = GenericFileAdmissionManifest | CanoSpecimenManifest;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every((key) => keys.includes(key)) && keys.every((key) => key in value);
}

function isHttpsUrl(value: unknown): value is string {
  return typeof value === "string" && /^https:\/\//.test(value);
}

function parseCanoSpecimenManifest(value: Record<string, unknown>): CanoSpecimenManifest {
  if (!hasOnlyKeys(value, ["formatVersion", "manifestId", "sourceId", "dataset", "reviewDate", "specimens", "files", "admissionDecision"])
    || value.formatVersion !== "0.8.0" || value.sourceId !== "PDS-CANOGOMEZ-2026"
    || typeof value.manifestId !== "string" || !/^PFM-CANOGOMEZ-\d{4}-\d{2}-\d{2}$/.test(value.manifestId)
    || typeof value.reviewDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.reviewDate)
    || value.admissionDecision !== "metadata_only_not_downloaded_not_registered" || !isRecord(value.dataset)
    || !hasOnlyKeys(value.dataset, ["accession", "version", "landingPageUrl", "preprintStatus", "rightsDecision"])
    || value.dataset.accession !== "GSE318731 / BIL DOI 10.35077/g.1196" || typeof value.dataset.version !== "string" || !value.dataset.version
    || !isHttpsUrl(value.dataset.landingPageUrl) || value.dataset.preprintStatus !== "preprint_resource" || value.dataset.rightsDecision !== "recorded_for_file"
    || !Array.isArray(value.specimens) || value.specimens.length === 0 || !Array.isArray(value.files) || value.files.length === 0) {
    throw new Error("invalid 0.8 specimen-aware Cano-Gomez manifest identity or dataset metadata");
  }
  const specimenIds = new Set<string>();
  for (const specimen of value.specimens) {
    if (!isRecord(specimen) || !hasOnlyKeys(specimen, ["specimenId", "animalId", "sex", "spinalRegion", "assay", "sourceFrame", "coordinateUnit", "axisOrder", "axisDirection", "coordinateOrigin", "pixelOrVoxelScale", "missingReason"])
      || typeof specimen.specimenId !== "string" || !specimen.specimenId || specimenIds.has(specimen.specimenId)
      || !(specimen.animalId === null || typeof specimen.animalId === "string")
      || !["female", "male", "not_reported"].includes(specimen.sex as string)
      || ![specimen.spinalRegion, specimen.assay, specimen.sourceFrame].every((item) => typeof item === "string" && item)
      || ![specimen.coordinateUnit, specimen.axisOrder, specimen.axisDirection, specimen.coordinateOrigin, specimen.pixelOrVoxelScale, specimen.missingReason].every((item) => item === null || typeof item === "string")) {
      throw new Error("each Cano-Gomez specimen requires identity, condition, source frame and explicit coordinate missingness");
    }
    if ((specimen.animalId === null || [specimen.coordinateUnit, specimen.axisOrder, specimen.axisDirection, specimen.coordinateOrigin, specimen.pixelOrVoxelScale].some((item) => item === null)) && !specimen.missingReason) {
      throw new Error("incomplete Cano-Gomez specimen metadata requires a missingReason");
    }
    specimenIds.add(specimen.specimenId);
  }
  const files = value.files.map((candidate) => {
    if (!isRecord(candidate) || !hasOnlyKeys(candidate, ["id", "stableName", "sourceUrl", "bytes", "format", "modality", "specimenIds", "sourceChecksum", "localSha256", "rightsDecision"])
      || typeof candidate.id !== "string" || !candidate.id || typeof candidate.stableName !== "string" || !candidate.stableName || !isHttpsUrl(candidate.sourceUrl)
      || typeof candidate.bytes !== "number" || !Number.isInteger(candidate.bytes) || candidate.bytes < 1 || typeof candidate.format !== "string" || !candidate.format
      || (candidate.modality !== "Xenium spatial transcriptomics" && candidate.modality !== "snMultiome") || !Array.isArray(candidate.specimenIds) || candidate.specimenIds.length === 0 || !candidate.specimenIds.every((id) => typeof id === "string" && specimenIds.has(id))
      || !isRecord(candidate.sourceChecksum) || !hasOnlyKeys(candidate.sourceChecksum, ["algorithm", "value", "provenance"])
      || (candidate.sourceChecksum.algorithm !== "sha1" && candidate.sourceChecksum.algorithm !== "sha256") || typeof candidate.sourceChecksum.value !== "string"
      || (candidate.sourceChecksum.algorithm === "sha1" && !/^[a-f0-9]{40}$/.test(candidate.sourceChecksum.value)) || (candidate.sourceChecksum.algorithm === "sha256" && !/^[a-f0-9]{64}$/.test(candidate.sourceChecksum.value))
      || candidate.sourceChecksum.provenance !== "source_metadata" || candidate.localSha256 !== null || candidate.rightsDecision !== "recorded_for_file") {
      throw new Error("each Cano-Gomez file needs declared specimens, source checksum, rights and null local SHA-256");
    }
    return candidate;
  });
  return { ...value, specimens: value.specimens as CanoSpecimenManifest["specimens"], files: files as CanoSpecimenManifest["files"] } as CanoSpecimenManifest;
}

function parsePublicFileAdmissionManifest(value: unknown): PublicFileAdmissionManifest {
  if (isRecord(value) && value.formatVersion === "0.8.0") return parseCanoSpecimenManifest(value);
  if (!isRecord(value) || !hasOnlyKeys(value, ["formatVersion", "manifestId", "sourceId", "dataset", "reviewDate", "files", "admissionDecision"])) {
    throw new Error("expected the versioned file-admission manifest fields only");
  }
  if (value.formatVersion !== "0.7.0" || typeof value.manifestId !== "string" || !/^PFM-[A-Z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(value.manifestId)) {
    throw new Error("invalid 0.7 manifest identity");
  }
  if (value.sourceId !== "PDS-SPINALJ-PROCESSED" && value.sourceId !== "PDS-CANOGOMEZ-2026") {
    throw new Error("source is not eligible for object-level preflight");
  }
  if (!isRecord(value.dataset) || !hasOnlyKeys(value.dataset, ["accession", "version", "landingPageUrl", "rightsDecision"])
    || typeof value.dataset.accession !== "string" || !value.dataset.accession
    || typeof value.dataset.version !== "string" || !value.dataset.version
    || !isHttpsUrl(value.dataset.landingPageUrl)
    || (value.dataset.rightsDecision !== "recorded_for_file" && value.dataset.rightsDecision !== "pending_reject")) {
    throw new Error("dataset provenance or rights decision is incomplete");
  }
  if (typeof value.reviewDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.reviewDate)
    || value.admissionDecision !== "metadata_only_not_downloaded_not_registered"
    || !Array.isArray(value.files) || value.files.length === 0) {
    throw new Error("manifest must remain metadata-only and list at least one candidate file");
  }
  const files = value.files.map((candidate) => {
    if (!isRecord(candidate) || !hasOnlyKeys(candidate, ["id", "stableName", "sourceUrl", "bytes", "format", "sourceChecksum", "localSha256", "rightsDecision", "coordinates"])
      || typeof candidate.id !== "string" || !candidate.id
      || typeof candidate.stableName !== "string" || !candidate.stableName
      || !isHttpsUrl(candidate.sourceUrl)
      || typeof candidate.bytes !== "number" || !Number.isInteger(candidate.bytes) || candidate.bytes < 1
      || typeof candidate.format !== "string" || !candidate.format
      || !isRecord(candidate.sourceChecksum)
      || !hasOnlyKeys(candidate.sourceChecksum, ["algorithm", "value", "provenance"])
      || (candidate.sourceChecksum.algorithm !== "sha1" && candidate.sourceChecksum.algorithm !== "sha256")
      || typeof candidate.sourceChecksum.value !== "string"
      || (candidate.sourceChecksum.algorithm === "sha1" && !/^[a-f0-9]{40}$/.test(candidate.sourceChecksum.value))
      || (candidate.sourceChecksum.algorithm === "sha256" && !/^[a-f0-9]{64}$/.test(candidate.sourceChecksum.value))
      || candidate.sourceChecksum.provenance !== "source_metadata"
      || candidate.localSha256 !== null
      || candidate.rightsDecision !== "recorded_for_file"
      || !isRecord(candidate.coordinates)
      || !hasOnlyKeys(candidate.coordinates, ["unit", "axisOrder", "origin", "missingReason"])) {
      throw new Error("each file needs public URL, bytes, source checksum, null local SHA-256, rights and coordinate fields");
    }
    const { unit, axisOrder, origin, missingReason } = candidate.coordinates;
    if (![unit, axisOrder, origin, missingReason].every((item) => item === null || typeof item === "string")
      || (!(unit && axisOrder && origin) && !missingReason)) {
      throw new Error("incomplete file coordinates require a missingReason");
    }
    return candidate as PublicFileAdmissionManifest["files"][number];
  });
  return { ...value, files } as GenericFileAdmissionManifest;
}

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function catalogSearchText(source: PublicDataCatalogSource) {
  return [
    source.id,
    source.title,
    source.role,
    source.provenance.accession,
    source.provenance.version,
    source.provenance.primaryCitation,
    source.content.modalities.join(" "),
    source.content.spinalCoverage,
    source.admissibleUse,
    source.prohibitedClaims.join(" "),
    source.nextChecks.join(" "),
  ].join(" ").toLowerCase();
}

export function filterPublicDataSources(
  query: string,
  admissionStatus: PublicDataCatalogState["admissionStatus"],
) {
  const normalized = query.trim().toLowerCase();
  return publicDataCatalog.sources.filter((source) => (
    (admissionStatus === "all" || effectivePublicDataAdmissionStatus(source) === admissionStatus)
    && (!normalized || catalogSearchText(source).includes(normalized))
  ));
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

function statusDetail(status: PublicDataAdmissionStatus) {
  if (status === "bundled_local") return "Bundled local reference; source and derivative provenance are pinned.";
  if (status === "ready_for_metadata_audit") return "Public lead found; no candidate file is bundled until its metadata, rights and coordinate checks pass.";
  if (status === "metadata_audited") return "Public metadata is audited in the intake registry; no candidate file, transform, bundle authorization or registration has been admitted.";
  return "Public lead found; adapter work may start only from a pinned processed release.";
}

export default function PublicDataWorkbench({
  state,
  entityId,
  onStateChange,
  onNotice,
}: {
  state: PublicDataCatalogState;
  entityId: string | null;
  onStateChange: (next: PublicDataCatalogState) => void;
  onNotice: (notice: string) => void;
}) {
  const fileManifestInputRef = useRef<HTMLInputElement>(null);
  const [fileManifest, setFileManifest] = useState<PublicFileAdmissionManifest | null>(null);
  const matchingSources = useMemo(
    () => filterPublicDataSources(state.query, state.admissionStatus),
    [state.admissionStatus, state.query],
  );
  const selected = matchingSources.find((source) => source.id === state.selectedSourceId)
    ?? matchingSources[0]
    ?? null;
  const selectedQueue = selected
    ? publicDataCatalog.upgradeQueue.filter((item) => item.sourceIds.includes(selected.id))
    : [];
  const intake = selected
    ? publicSourceIntakes.find((record) => record.sourceId === selected.id)
    : null;
  const supportsFileManifestPreflight = selected?.id === "PDS-SPINALJ-PROCESSED" || selected?.id === "PDS-CANOGOMEZ-2026";

  const update = (patch: Partial<PublicDataCatalogState>) => {
    const next = { ...state, ...patch };
    const candidates = filterPublicDataSources(next.query, next.admissionStatus);
    if (!candidates.some((source) => source.id === next.selectedSourceId)) {
      next.selectedSourceId = candidates[0]?.id ?? null;
    }
    onStateChange(next);
  };

  const copyAccession = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.provenance.accession);
      onNotice(selected.id + " accession copied");
    } catch {
      onNotice("Copy unavailable; select and copy the accession from the catalog");
    }
  };

  const exportSelectedIntake = () => {
    if (!selected) return;
    const linkedQueue = publicDataCatalog.upgradeQueue.filter((item) => item.sourceIds.includes(selected.id));
    downloadJson({
      catalogReleaseId: publicDataCatalog.releaseId,
      catalogSchemaVersion: publicDataCatalog.schemaVersion,
      exportedAt: new Date().toISOString(),
      scientificInputPolicy: publicDataCatalog.scientificInputPolicy,
      institutionalExperimentalDataUsed: publicDataCatalog.institutionalExperimentalDataUsed,
      source: selected,
      publicMetadataIntake: intake ?? null,
      linkedUpgradeQueue: linkedQueue,
      decision: "catalog_only_not_downloaded_or_registered",
    }, "ohri-public-data-intake-" + selected.id.toLowerCase() + ".json");
    onNotice(selected.id + " intake record exported");
  };

  const importFileManifest = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onNotice("File-manifest import rejected · maximum size is 2 MB");
      return;
    }
    try {
      const manifest = parsePublicFileAdmissionManifest(JSON.parse(await file.text()));
      setFileManifest(manifest);
      update({ admissionStatus: "all", selectedSourceId: manifest.sourceId });
      onNotice(manifest.manifestId + " preflight loaded · metadata only; no file acquired or registered");
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid JSON";
      onNotice("File-manifest import rejected · " + message);
    }
  };

  return (
    <div className="public-data-workbench">
      <div className="panel-heading evidence-title">
        <p className="panel-kicker">PUBLIC DATA WORKBENCH · CATALOG {publicDataCatalog.schemaVersion}</p>
        <h2>Source admission & upgrade queue</h2>
        <p>{publicDataCatalog.sources.length} public-source leads · {publicDataCatalog.upgradeQueue.length} versioned upgrades · no automatic remote acquisition</p>
      </div>

      <div className="public-policy-callout">
        <strong>Public-data-only policy</strong>
        <p>{publicDataCatalog.policySummary}</p>
      </div>

      <div className="catalog-controls">
        <label>
          Search catalog
          <input
            type="search"
            value={state.query}
            maxLength={300}
            placeholder="Source, accession, modality, boundary"
            onChange={(event) => update({ query: event.target.value })}
          />
        </label>
        <label>
          Admission stage
          <select
            value={state.admissionStatus}
            onChange={(event) => update({
              admissionStatus: event.target.value as PublicDataCatalogState["admissionStatus"],
            })}
          >
            <option value="all">All stages</option>
            {PUBLIC_DATA_ADMISSION_STATUSES.map((status) => (
              <option value={status} key={status}>{prettify(status)}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="catalog-result-count" role="status">
        {matchingSources.length} of {publicDataCatalog.sources.length} cataloged public sources match
      </p>

      <div className="catalog-source-picker" aria-label="Public data sources">
        {matchingSources.map((source) => (
          <button
            type="button"
            key={source.id}
            className={selected?.id === source.id ? "selected" : ""}
            aria-pressed={selected?.id === source.id}
            onClick={() => update({ selectedSourceId: source.id })}
          >
            <span>{source.priority} · {prettify(effectivePublicDataAdmissionStatus(source))}</span>
            <strong>{source.title}</strong>
            <em>{source.role} · {source.content.coordinateAuthority}</em>
          </button>
        ))}
      </div>

      {!selected && (
        <p className="catalog-empty">No catalog lead matches this query. This is not evidence that no public data exist.</p>
      )}

      {selected && (
        <section className="catalog-source-detail" aria-labelledby="catalog-source-title">
          <div className="catalog-source-title-row">
            <div>
              <span>{selected.id}</span>
              <h3 id="catalog-source-title">{selected.title}</h3>
            </div>
            <span className="badge observed">{selected.content.coordinateAuthority}</span>
          </div>
          <p className="catalog-status">{statusDetail(effectivePublicDataAdmissionStatus(selected))}</p>
          <dl className="catalog-detail-grid">
            <div><dt>Accession</dt><dd>{selected.provenance.accession}</dd></div>
            <div><dt>Version</dt><dd>{selected.provenance.version}</dd></div>
            <div><dt>Source verified</dt><dd>{selected.provenance.accessVerifiedOn}</dd></div>
            <div><dt>Source coordinate authority</dt><dd>{selected.content.coordinateAuthority}</dd></div>
            <div><dt>Content</dt><dd>{selected.content.modalities.join(" · ")}</dd></div>
            <div><dt>Coverage</dt><dd>{selected.content.spinalCoverage}</dd></div>
          </dl>

          <div className="catalog-actions">
            <a href={selected.provenance.sourceUrl} target="_blank" rel="noreferrer">Open primary source ↗</a>
            <button type="button" onClick={() => void copyAccession()}>Copy accession</button>
            <button type="button" onClick={exportSelectedIntake}>Export intake record</button>
          </div>

          {supportsFileManifestPreflight && <section className="catalog-file-preflight" aria-labelledby="file-preflight-heading">
            <div>
              <span>{selected.id === "PDS-CANOGOMEZ-2026" ? "SPECIMEN-AWARE PREFLIGHT · LOCAL JSON ONLY" : "OBJECT-LEVEL PREFLIGHT · LOCAL JSON ONLY"}</span>
              <h4 id="file-preflight-heading">{selected.id === "PDS-CANOGOMEZ-2026" ? "Specimen and file manifest gate" : "File manifest gate"}</h4>
            </div>
            <p>{selected.id === "PDS-CANOGOMEZ-2026"
              ? "Review a curator-supplied specimen-aware manifest before acquisition. It requires preprint status, declared specimens, source frame, source checksum and explicit coordinate missingness; local SHA-256 remains null and it cannot download, bundle, transform or register source data."
              : "Review a curator-supplied manifest before acquisition. It requires a declared source SHA-1 or SHA-256, keeps local SHA-256 null, and cannot download, bundle, transform or register source data."}</p>
            <button type="button" onClick={() => fileManifestInputRef.current?.click()}>Import file manifest</button>
            <input
              ref={fileManifestInputRef}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void importFileManifest(event)}
              aria-label="Import object-level public file-admission manifest"
            />
            {(selected.id === "PDS-SPINALJ-PROCESSED" || selected.id === "PDS-CANOGOMEZ-2026") && <PublicFileAdmissionManifestComposer sourceId={selected.id} onNotice={onNotice} />}
            {fileManifest && fileManifest.sourceId === selected.id && (
              <>
              <dl className="catalog-detail-grid" aria-live="polite">
                <div><dt>Manifest</dt><dd>{fileManifest.manifestId}</dd></div>
                <div><dt>Files reviewed</dt><dd>{fileManifest.files.length} metadata records · no files acquired</dd></div>
                <div><dt>Source checksum</dt><dd>{[...new Set(fileManifest.files.map((file) => file.sourceChecksum.algorithm.toUpperCase()))].join(" · ")} from source metadata · local SHA-256 null</dd></div>
                <div><dt>Admission decision</dt><dd>{fileManifest.admissionDecision.replaceAll("_", " ")}</dd></div>
                <div><dt>Dataset rights</dt><dd>{fileManifest.dataset.rightsDecision.replaceAll("_", " ")}</dd></div>
                {"specimens" in fileManifest && <>
                  <div><dt>Preprint status</dt><dd>{fileManifest.dataset.preprintStatus.replaceAll("_", " ")}</dd></div>
                  <div><dt>Source frames</dt><dd>{[...new Set(fileManifest.specimens.map((specimen) => specimen.sourceFrame))].join(" · ")}</dd></div>
                </>}
              </dl>
              <PublicSourceReleaseAdmissionReview manifest={fileManifest} onNotice={onNotice} />
              <PublicSourceAssertionProvenance manifest={fileManifest} onNotice={onNotice} />
              <PublicSourceAuthorizationPlan manifest={fileManifest} onNotice={onNotice} />
              <PublicSourceIndependentAuthorizationEvidence manifest={fileManifest} onNotice={onNotice} />
              </>
            )}
          </section>}

          <PublicProvenanceCrateExporter source={selected} onNotice={onNotice} />

          {selected.id === "PDS-RUSS-2021" && <TaxonomyCrosswalkExplorer onNotice={onNotice} />}
          {selected.id === "PDS-TABULAE-PARALYTICA" && <>
            <TabulaeConditionExplorer onNotice={onNotice} />
            <TabulaeSpatialComparisonBoard onNotice={onNotice} />
          </>}

          <div className="catalog-section">
            <strong>Admissible use</strong>
            <p>{selected.admissibleUse}</p>
          </div>
          <div className="catalog-section warning">
            <strong>Prohibited claims</strong>
            <ul>{selected.prohibitedClaims.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="catalog-section">
            <strong>Required next checks</strong>
            <ul>{selected.nextChecks.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <p className="catalog-rights"><b>Rights:</b> {selected.rights.note}</p>

          {intake && (
            <section className="catalog-intake-audit" aria-labelledby="catalog-intake-heading">
              <div>
                <span>PINNED PUBLIC METADATA INTAKE · {intake.intakeId}</span>
                <h4 id="catalog-intake-heading">Metadata audited; files not admitted</h4>
              </div>
              <p>{prettify(intake.studyStatus)} · {prettify(intake.admission.status)}.</p>
              <dl className="catalog-detail-grid">
                <div><dt>Candidate files</dt><dd>{intake.acquisition.status.replaceAll("_", " ")}</dd></div>
                <div><dt>Bundled assets</dt><dd>{intake.acquisition.bundledAssetCount}</dd></div>
                <div><dt>Source transforms</dt><dd>{intake.coordinates.transformStatus.replaceAll("_", " ")}</dd></div>
                <div><dt>Project registration</dt><dd>{intake.coordinates.projectRegistrationStatus.replaceAll("_", " ")} · {intake.coordinates.projectRegistrationCount}</dd></div>
                <div><dt>Public-record license</dt><dd>{intake.rights.publicRecordLicense}</dd></div>
                <div><dt>File-level reuse</dt><dd>{intake.rights.fileLevelReuseDecision.replaceAll("_", " ")}</dd></div>
              </dl>
              <details>
                <summary>Public evidence basis ({intake.publicSourceEvidence.records.length} records; {intake.publicSourceEvidence.reportedFacts.length} reported facts)</summary>
                <ul>
                  {intake.publicSourceEvidence.reportedFacts.map((fact) => <li key={fact.id}>{fact.statement}</li>)}
                </ul>
              </details>
              <details>
                <summary>What must happen before any file admission</summary>
                <ol>{intake.requiredBeforeFileAdmission.map((requirement) => <li key={requirement}>{requirement}</li>)}</ol>
              </details>
              <details>
                <summary>Scientific boundaries for this intake</summary>
                <ul>{intake.scientificBoundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
              </details>
              {intake.objectInventory.objects.length > 0 && (
                <section className="catalog-object-inventory" aria-label="Pinned public object header inventory">
                  <strong>PINNED OBJECT HEADER · NOT ADMITTED</strong>
                  {intake.objectInventory.objects.map((object) => (
                    <dl className="catalog-detail-grid" key={object.id}>
                      <div><dt>Object</dt><dd>{object.stableName}</dd></div>
                      <div><dt>Header bytes</dt><dd>{object.bytes.toLocaleString()} · {object.contentType}</dd></div>
                      <div><dt>Last modified</dt><dd>{object.lastModified}</dd></div>
                      <div><dt>Source checksum</dt><dd>{object.sourceChecksum === null ? "not published in this audit" : object.sourceChecksum}</dd></div>
                      <div><dt>Local SHA-256</dt><dd>{object.localSha256 === null ? "null · no body acquired" : object.localSha256}</dd></div>
                      <div><dt>Rights decision</dt><dd>{object.assetRightsDecision.replaceAll("_", " ")}</dd></div>
                    </dl>
                  ))}
                  <p>Header metadata identifies an object but does not admit it, establish its contents, or authorize reuse.</p>
                </section>
              )}
            </section>
          )}

          <div className="source-queue-summary">
            <strong>Linked upgrade work</strong>
            {selectedQueue.length ? (
              <ul>{selectedQueue.map((item) => <li key={item.id}>{item.id} · {item.title} · {prettify(item.status)}</li>)}</ul>
            ) : <p>No queued work currently references this source.</p>}
          </div>
        </section>
      )}

      <section className="upgrade-queue" aria-labelledby="upgrade-queue-heading">
        <div className="upgrade-queue-heading">
          <p className="panel-kicker">VERSIONED UPGRADE QUEUE</p>
          <h3 id="upgrade-queue-heading">What becomes possible next</h3>
        </div>
        {publicDataCatalog.upgradeQueue.map((item) => (
          <details key={item.id} open={item.status === "ready"}>
            <summary>
              <span>{item.id} · {item.priority} · {prettify(item.status)}</span>
              <strong>{item.title}</strong>
            </summary>
            <p><b>Deliverable:</b> {item.deliverable}</p>
            <p><b>Reject if:</b> {item.rejectIf}</p>
            <p><b>Scientific boundary:</b> {item.scientificBoundary}</p>
            <ul>{item.acceptanceCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
          </details>
        ))}
      </section>

      <EvidenceFeasibilityPlanner
        selectedAxisIds={state.plannerAxisIds}
        onSelectedAxisIdsChange={(plannerAxisIds) => update({ plannerAxisIds })}
        onNotice={onNotice}
      />
      <EvidenceProvenanceTrace entityId={entityId} plannerAxisIds={state.plannerAxisIds} onNotice={onNotice} />
      <CrossLaneRelationshipAdmission entityId={entityId} sourceId={state.selectedSourceId} onNotice={onNotice} />
    </div>
  );
}
