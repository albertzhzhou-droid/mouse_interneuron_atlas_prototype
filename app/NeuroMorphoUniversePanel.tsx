"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import universeContractJson from "../data/neuromorpho-no-age-query-universe-0.1.json";
import SourceLocalMorphologyViewport, { type MorphologyRenderMode } from "./SourceLocalMorphologyViewport";
import NativeContourRecordViewer from "./NativeContourRecordViewer";
import {
  type MorphologyCensusRecord,
  type MorphologyGeometryPayload,
} from "./morphology-census-data";
import { loadVerifiedUniverseSwc } from "./neuromorpho-swc-runtime.js";
import { sha256Hex } from "./source-local-morphology-geometry.js";

type UniverseMembership = {
  noAgeQueryUniverse: true;
  frozenAdultSubset: boolean;
  namedRouteIds: string[];
};

type UniverseRecord = {
  assetId: string;
  neuronId: number;
  officialMetadata: Record<string, unknown>;
  normalizedMetadata: {
    name: string;
    archive: string;
    species: string | string[];
    lifeStage: string;
    brainRegion: string[];
    cellType: string[];
    strain: string | string[];
    gender: string | string[];
    experimentCondition: string | string[];
    domain: string;
    physicalIntegrity: string;
    attributes: string;
    dimensionality: "2D" | "3D";
    sourceDiameterAvailable: boolean;
    sourceFrame: string;
    registrationStatus: "unregistered";
  };
  missingness: Record<string, { value: unknown; missingReason: string | null }>;
  sourcePaper: { pmids: string[]; dois: string[] };
  memberships: UniverseMembership;
  sourceObject: {
    status: "admitted" | "quarantined";
    transport: "existing_generated_geometry" | "raw_swc_lazy_parse" | "unavailable";
    directUrl: string;
    rawSwcPath: string | null;
    rawSwcSha256: string | null;
    rawSwcBytes: number | null;
    existingGeometryPath: string | null;
    existingGeometrySha256: string | null;
    existingGeometryBytes: number | null;
    geometryCopyCount: 0;
    registrationCount: 0;
    errors: string[];
  };
  qc: Record<string, unknown>;
  morphometrics: {
    sourceReported: Record<string, unknown>;
    computed: Record<string, unknown>;
  };
};

type UniversePayload = {
  documentType: "neuromorpho_no_age_query_universe_index";
  schemaVersion: string;
  assetSetId: string;
  repositoryRelease: string;
  snapshotDate: string;
  query: Record<string, unknown>;
  summary: {
    queryRecordCount: number;
    admittedSourceObjectCount: number;
    quarantinedSourceObjectCount: number;
    frozenAdultSubsetCount: number;
    namedRouteCount: number;
    existingGeometryReferenceCount: number;
    deltaRawSwcCount: number;
    sourceLabelled3DCount: number;
    sourceLabelled2DCount: number;
    diameterAuthorizedCount: number;
    diameterUnavailableCount: number;
    axonDomainCount: number;
    completeAxonClaimCount: 0;
    registrationCount: 0;
    sameSpecimenInternalStructureCount: 0;
    paperCount: number;
    archiveCount: number;
  };
  records: UniverseRecord[];
};

type UniverseContract = {
  dataset: {
    indexPath: string;
    indexSha256: string;
    indexBytes: number;
  };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isCoordinate(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3
    && value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));
}

// The shared JS parser also permits unbound, null-identity results. A universe
// viewport accepts only its verified, identity-bound subset with exact row shapes.
function assertUniverseViewportGeometry(value: unknown, record: UniverseRecord): asserts value is MorphologyGeometryPayload {
  if (!isObject(value)
    || value.assetId !== record.assetId || value.neuronId !== record.neuronId
    || typeof value.name !== "string" || typeof value.schemaVersion !== "string"
    || value.geometryStatus !== "OBS_STANDARDIZED_SOURCE_LOCAL"
    || value.sourceFrame !== record.normalizedMetadata.sourceFrame
    || value.units !== "micrometre_reported_by_source" || typeof value.scientificUse !== "string"
    || !isObject(value.source) || !isObject(value.swc) || !isObject(value.qc)
    || !isObject(value.registration) || value.registration.status !== "unregistered"
    || value.registration.registrationCount !== 0
    || !isObject(value.registration.atlasTransform) || value.registration.atlasTransform.value !== null
    || typeof value.registration.atlasTransform.missingReason !== "string"
    || !isObject(value.registration.atlasPlacement) || value.registration.atlasPlacement.value !== null
    || typeof value.registration.atlasPlacement.missingReason !== "string"
    || !isObject(value.displayTransform) || value.displayTransform.kind !== "soma_centered_uniform_scale"
    || value.displayTransform.use !== "viewer_only" || !isCoordinate(value.displayTransform.originMicrometre)
    || typeof value.displayTransform.scaleViewerUnitPerMicrometre !== "number"
    || !Number.isFinite(value.displayTransform.scaleViewerUnitPerMicrometre)
    || value.displayTransform.scaleViewerUnitPerMicrometre <= 0
    || !Array.isArray(value.nodeColumns) || !value.nodeColumns.every((column) => typeof column === "string")
    || JSON.stringify(value.segmentColumns) !== JSON.stringify(["x1", "y1", "z1", "r1", "x2", "y2", "z2", "r2", "sourceType", "interpretation"])
    || !Array.isArray(value.nodes) || value.nodes.length === 0
    || !value.nodes.every((row) => Array.isArray(row) && row.length === 7 && row.every((entry) => typeof entry === "number" && Number.isFinite(entry)))
    || !Array.isArray(value.segments)
    || !value.segments.every((row) => Array.isArray(row) && row.length === 10 && typeof row[9] === "string"
      && row.slice(0, 9).every((entry) => typeof entry === "number" && Number.isFinite(entry)))
    || !isObject(value.morphometrics)) {
    throw new Error("Verified universe SWC does not match this viewport record and geometry contract");
  }
  const metrics = value.morphometrics;
  const computed = metrics.computedFromStandardizedSwc;
  if ((metrics.sourceReported !== undefined && !isObject(metrics.sourceReported))
    || (computed !== undefined && (!isObject(computed)
      || typeof computed.segmentCount !== "number" || typeof computed.rootNodeId !== "number"
      || !isObject(computed.boundsMicrometre) || !isCoordinate(computed.boundsMicrometre.min)
      || !isCoordinate(computed.boundsMicrometre.max) || !isCoordinate(computed.extentMicrometre)))) {
    throw new Error("Verified universe SWC has invalid descriptive morphometrics");
  }
}

type SelectFilter = "all" | string;
type GeometryState =
  | { status: "idle"; neuronId: null; geometry: null; error: "" }
  | { status: "loading"; neuronId: number; geometry: null; error: "" }
  | { status: "verified"; neuronId: number; geometry: MorphologyGeometryPayload; error: "" }
  | { status: "unavailable"; neuronId: number; geometry: null; error: string };

const PAGE_SIZE = 48;
const contract = universeContractJson as UniverseContract;

function readable(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(" · ") : "Not reported";
  if (value === null || value === undefined || value === "") return "Not reported";
  return String(value);
}

function hasAxon(record: UniverseRecord) {
  return record.normalizedMetadata.domain.includes("Axon")
    && !record.normalizedMetadata.domain.includes("No Axon");
}

function evidenceClass(record: UniverseRecord) {
  const labels = record.normalizedMetadata.cellType.map((label) => label.toLowerCase());
  if (labels.some((label) => label.includes("inhibitory"))) return "inhibitory";
  if (labels.some((label) => label.includes("excitatory"))) return "excitatory";
  return "source-unclassified";
}

function membershipLabel(record: UniverseRecord) {
  if (record.memberships.frozenAdultSubset) return "frozen adult subset";
  if (record.memberships.namedRouteIds.length) return "named exact route";
  return "no-age delta SWC";
}

function searchText(record: UniverseRecord) {
  return [
    record.neuronId,
    record.normalizedMetadata.name,
    record.normalizedMetadata.archive,
    record.normalizedMetadata.lifeStage,
    ...record.normalizedMetadata.brainRegion,
    ...record.normalizedMetadata.cellType,
    ...record.sourcePaper.dois,
    ...record.sourcePaper.pmids,
  ].join(" ").toLowerCase();
}

function unique(valuesToSort: string[]) {
  return [...new Set(valuesToSort.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function asViewportRecord(record: UniverseRecord): MorphologyCensusRecord {
  return {
    assetId: record.assetId,
    neuronId: record.neuronId,
    officialMetadata: record.officialMetadata,
    normalizedMetadata: record.normalizedMetadata,
    missingness: record.missingness,
    sourcePaper: record.sourcePaper,
    geometry: {
      available: record.sourceObject.status === "admitted",
      path: record.sourceObject.rawSwcPath,
      sha256: record.sourceObject.rawSwcSha256,
      bytes: record.sourceObject.rawSwcBytes,
      rawSwcPath: record.sourceObject.rawSwcPath,
      rawSwcSha256: record.sourceObject.rawSwcSha256,
      missingReason: record.sourceObject.status === "admitted" ? null : "source_object_quarantined",
    },
    qc: record.qc,
    morphometrics: record.morphometrics,
  };
}

function asRuntimeRecord(record: UniverseRecord) {
  return {
    assetId: record.assetId,
    neuronId: record.neuronId,
    normalizedMetadata: record.normalizedMetadata,
    swc: {
      neuronId: record.neuronId,
      path: record.sourceObject.rawSwcPath,
      bytes: record.sourceObject.rawSwcBytes,
      sha256: record.sourceObject.rawSwcSha256,
    },
  };
}

function numericMetric(record: UniverseRecord, key: string) {
  const value = record.morphometrics.computed[key];
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "Unavailable";
}

function numericAgeLabel(record: UniverseRecord) {
  const value = record.missingness.numericAge?.value;
  if (!value || typeof value !== "object") return "Not reported";
  const age = value as { minimum?: unknown; maximum?: unknown; scale?: unknown };
  if (typeof age.minimum !== "number" || typeof age.maximum !== "number") return "Not reported";
  const range = age.minimum === age.maximum ? `${age.minimum}` : `${age.minimum}–${age.maximum}`;
  return `${range} ${typeof age.scale === "string" && age.scale ? age.scale : "source age unit"}`;
}

function reportedMetric(record: UniverseRecord, key: string, unit: string) {
  const entry = record.morphometrics.sourceReported[key];
  if (!entry || typeof entry !== "object") return "Not reported";
  const value = (entry as { value?: unknown }).value;
  return typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString()} ${unit}` : "Not reported";
}

function extentLabel(record: UniverseRecord) {
  const value = record.morphometrics.computed.extentMicrometre;
  return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number" && Number.isFinite(item))
    ? `${value.map((item) => Number(item).toLocaleString()).join(" × ")} µm`
    : "Unavailable";
}

function sourceTypeLabel(record: UniverseRecord) {
  const value = record.morphometrics.computed.nodeTypeCounts;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Unavailable";
  return Object.entries(value as Record<string, unknown>)
    .filter(([, count]) => typeof count === "number")
    .map(([type, count]) => `type ${type}: ${Number(count).toLocaleString()}`)
    .join(" · ") || "Unavailable";
}

function controlledNeuronId(focusId: string | null | undefined) {
  if (!focusId?.startsWith("NeuroMorpho:")) return null;
  const value = Number(focusId.slice("NeuroMorpho:".length));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export default function NeuroMorphoUniversePanel({
  selectedFocusId,
  onSelectedFocusChange,
}: {
  selectedFocusId?: string | null;
  onSelectedFocusChange?: (focusId: string) => void;
}) {
  const [payload, setPayload] = useState<UniversePayload | null>(null);
  const [indexError, setIndexError] = useState("");
  const [internalSelectedId, setInternalSelectedId] = useState<number | null>(() => controlledNeuronId(selectedFocusId));
  const [query, setQuery] = useState("");
  const [archive, setArchive] = useState<SelectFilter>("all");
  const [lifeStage, setLifeStage] = useState<SelectFilter>("all");
  const [paper, setPaper] = useState<SelectFilter>("all");
  const [dimension, setDimension] = useState<SelectFilter>("all");
  const [diameter, setDiameter] = useState<SelectFilter>("all");
  const [axon, setAxon] = useState<SelectFilter>("all");
  const [membership, setMembership] = useState<SelectFilter>("all");
  const [page, setPage] = useState(0);
  const [renderModeSelection, setRenderModeSelection] = useState<{ neuronId: number | null; mode: MorphologyRenderMode }>({ neuronId: null, mode: "skeleton" });
  const [geometryState, setGeometryState] = useState<GeometryState>({ status: "idle", neuronId: null, geometry: null, error: "" });
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    const controller = new AbortController();
    fetch(contract.dataset.indexPath, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`No-age universe request failed (${response.status})`);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== contract.dataset.indexBytes || await sha256Hex(bytes) !== contract.dataset.indexSha256) {
          throw new Error("No-age universe index receipt changed");
        }
        return JSON.parse(new TextDecoder().decode(bytes)) as UniversePayload;
      })
      .then((next) => {
        if (next.records.length !== next.summary.queryRecordCount) throw new Error("No-age universe record count mismatch");
        setPayload(next);
        setInternalSelectedId((current) => next.records.some((record) => record.neuronId === current)
          ? current
          : next.records.find((record) => record.neuronId === 104003)?.neuronId ?? next.records[0]?.neuronId ?? null);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setIndexError(error.message);
      });
    return () => controller.abort();
  }, []);

  const externalMorphologyFocus = typeof selectedFocusId === "string" && selectedFocusId.startsWith("NeuroMorpho:");
  const externalId = controlledNeuronId(selectedFocusId);
  const records = useMemo(() => payload?.records ?? [], [payload]);
  const options = useMemo(() => ({
    archives: unique(records.map((record) => record.normalizedMetadata.archive)),
    lifeStages: unique(records.map((record) => record.normalizedMetadata.lifeStage)),
    papers: unique(records.flatMap((record) => record.sourcePaper.dois)),
  }), [records]);
  const filtered = useMemo(() => records.filter((record) => {
    if (deferredQuery && !searchText(record).includes(deferredQuery)) return false;
    if (archive !== "all" && record.normalizedMetadata.archive !== archive) return false;
    if (lifeStage !== "all" && record.normalizedMetadata.lifeStage !== lifeStage) return false;
    if (paper !== "all" && !record.sourcePaper.dois.includes(paper)) return false;
    if (dimension !== "all" && record.normalizedMetadata.dimensionality !== dimension) return false;
    if (diameter === "available" && !record.normalizedMetadata.sourceDiameterAvailable) return false;
    if (diameter === "unavailable" && record.normalizedMetadata.sourceDiameterAvailable) return false;
    if (axon === "present" && !hasAxon(record)) return false;
    if (axon === "not-reconstructed" && hasAxon(record)) return false;
    if (membership !== "all" && membershipLabel(record) !== membership) return false;
    return true;
  }), [archive, axon, deferredQuery, diameter, dimension, lifeStage, membership, paper, records]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const activeSelectedId = externalMorphologyFocus
    ? externalId && records.some((record) => record.neuronId === externalId)
      ? externalId
      : null
    : internalSelectedId;
  const selected = records.find((record) => record.neuronId === activeSelectedId) ?? null;
  const externalFocusRejected = externalMorphologyFocus && payload !== null && selected === null;
  const selectionVisible = selected ? filtered.some((record) => record.neuronId === selected.neuronId) : true;
  const renderMode: MorphologyRenderMode = renderModeSelection.neuronId === selected?.neuronId
    ? renderModeSelection.mode
    : "skeleton";

  useEffect(() => {
    let cancelled = false;
    if (!selected) {
      queueMicrotask(() => {
        if (!cancelled) setGeometryState({ status: "idle", neuronId: null, geometry: null, error: "" });
      });
      return () => { cancelled = true; };
    }
    if (selected.sourceObject.status !== "admitted") {
      queueMicrotask(() => {
        if (!cancelled) setGeometryState({
          status: "unavailable",
          neuronId: selected.neuronId,
          geometry: null,
          error: selected.sourceObject.errors.join(" · ") || "This source object was quarantined.",
        });
      });
      return () => { cancelled = true; };
    }
    queueMicrotask(() => {
      if (!cancelled) setGeometryState({ status: "loading", neuronId: selected.neuronId, geometry: null, error: "" });
    });
    loadVerifiedUniverseSwc(asRuntimeRecord(selected), fetch, sha256Hex)
      .then((parsed: unknown) => {
        assertUniverseViewportGeometry(parsed, selected);
        const geometry = parsed;
        if (!cancelled) setGeometryState({ status: "verified", neuronId: selected.neuronId, geometry, error: "" });
      })
      .catch((error: Error) => {
        if (!cancelled) setGeometryState({ status: "unavailable", neuronId: selected.neuronId, geometry: null, error: error.message });
      });
    return () => { cancelled = true; };
  }, [selected]);

  const activeGeometry = geometryState.status === "verified" && geometryState.neuronId === selected?.neuronId
    ? geometryState.geometry
    : null;
  const viewportRecord = selected ? asViewportRecord(selected) : null;
  const resetFilters = () => {
    setQuery("");
    setArchive("all");
    setLifeStage("all");
    setPaper("all");
    setDimension("all");
    setDiameter("all");
    setAxon("all");
    setMembership("all");
    setPage(0);
  };
  const chooseRecord = (record: UniverseRecord) => {
    setInternalSelectedId(record.neuronId);
    onSelectedFocusChange?.(record.assetId);
  };
  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };

  return (
    <section className="neuromorpho-universe" aria-label="Exact NeuroMorpho no-age query universe">
      <div className="universe-denominator-strip">
        <span><strong>{payload?.summary.queryRecordCount.toLocaleString() ?? "—"}</strong> official query records</span>
        <span><strong>{payload?.summary.admittedSourceObjectCount.toLocaleString() ?? "—"}</strong> exact SWCs admitted</span>
        <span><strong>{payload?.summary.sourceLabelled3DCount.toLocaleString() ?? "—"}</strong> source-labelled 3D</span>
        <span><strong>{payload?.summary.sourceLabelled2DCount.toLocaleString() ?? "—"}</strong> source-labelled 2D</span>
        <span><strong>{payload?.summary.diameterAuthorizedCount.toLocaleString() ?? "—"}</strong> diameter-authorized</span>
        <span><strong>{payload?.summary.axonDomainCount.toLocaleString() ?? "—"}</strong> axon-domain records</span>
        <span><strong>{payload?.summary.paperCount.toLocaleString() ?? "—"}</strong> source papers</span>
        <span className="limit"><strong>0</strong> complete-axon claims</span>
      </div>

      <div className="universe-shared-boundary" role="note">
        <article><strong>Identity</strong><span>Each selection is one exact NeuroMorpho record. It is not a molecular type, animal count, or representative archetype.</span></article>
        <article><strong>Geometry</strong><span>Checksum-gated standardized SWC in its own source-local frame. Every switch discards the prior geometry before loading the next object.</span></article>
        <article><strong>Shared unavailable axes</strong><span>0 atlas registrations; no same-cell membrane, nucleus, organelles, boutons, synapses, receptors, ultrastructure, or SCI identity.</span></article>
      </div>

      <div className="universe-workspace">
        <aside className="universe-browser">
          <header><div><span>NO-AGE OFFICIAL QUERY</span><h3>Exact source objects</h3></div><button type="button" onClick={resetFilters}>Reset</button></header>
          <label className="universe-search">Search ID, label, region, DOI, or PMID<input value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder="e.g. 45674, Renshaw, lumbar…" /></label>
          <div className="universe-filter-grid">
            <label>Life stage<select value={lifeStage} onChange={(event) => updateFilter(setLifeStage, event.target.value)}><option value="all">All life stages</option>{options.lifeStages.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Archive<select value={archive} onChange={(event) => updateFilter(setArchive, event.target.value)}><option value="all">All archives</option>{options.archives.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Dimensionality<select value={dimension} onChange={(event) => updateFilter(setDimension, event.target.value)}><option value="all">2D and 3D</option><option value="3D">3D</option><option value="2D">2D</option></select></label>
            <label>Diameter<select value={diameter} onChange={(event) => updateFilter(setDiameter, event.target.value)}><option value="all">Available and unavailable</option><option value="available">Surface authorized</option><option value="unavailable">Centerline only</option></select></label>
            <label>Axon field<select value={axon} onChange={(event) => updateFilter(setAxon, event.target.value)}><option value="all">All source domains</option><option value="present">Axon reconstructed</option><option value="not-reconstructed">Axon not reconstructed</option></select></label>
            <label>Asset membership<select value={membership} onChange={(event) => updateFilter(setMembership, event.target.value)}><option value="all">All memberships</option><option value="frozen adult subset">Frozen adult subset</option><option value="named exact route">Named exact route</option><option value="no-age delta SWC">No-age delta SWC</option></select></label>
            <label className="wide">Source paper<select value={paper} onChange={(event) => updateFilter(setPaper, event.target.value)}><option value="all">All 12 papers</option>{options.papers.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
          <p className="universe-result-count" aria-live="polite">{filtered.length.toLocaleString()} of {records.length.toLocaleString()} records · page {safePage + 1} of {pageCount}</p>
          {!selectionVisible && selected && <p className="universe-retained-focus">Selected NMO {selected.neuronId} remains active outside the filtered list; no replacement object is substituted.</p>}
          {indexError && <p className="universe-error" role="alert">Universe unavailable: {indexError}</p>}
          {!payload && !indexError && <p className="universe-loading">Verifying the local 1,097-record index…</p>}
          <div className="universe-record-list">
            {visible.map((record) => <button
              type="button"
              key={record.neuronId}
              className={selected?.neuronId === record.neuronId ? "selected" : ""}
              aria-pressed={selected?.neuronId === record.neuronId}
              onClick={() => chooseRecord(record)}
            >
              <i className={record.sourceObject.status} aria-hidden="true" />
              <span><strong>{record.normalizedMetadata.name}</strong><small>NMO {record.neuronId} · {record.normalizedMetadata.lifeStage} · {record.normalizedMetadata.archive}</small><em>{record.normalizedMetadata.dimensionality} · {record.normalizedMetadata.sourceDiameterAvailable ? "diameter" : "centerline only"} · {membershipLabel(record)}</em></span>
            </button>)}
          </div>
          {filtered.length > PAGE_SIZE && <nav className="universe-pagination" aria-label="Morphology result pages"><button type="button" disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button><span>{safePage * PAGE_SIZE + 1}–{Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)}</span><button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Next</button></nav>}
        </aside>

        <section className="universe-viewport-card" aria-label="Selected exact source morphology">
          <header>
            <div><span>{selected ? `NMO ${selected.neuronId}` : "NO RECORD"}</span><strong>{selected?.normalizedMetadata.name ?? "Select an exact source object"}</strong></div>
            {selected && <div className="universe-badges"><b>OBS SWC</b><b>{selected.normalizedMetadata.dimensionality}</b><b>0 REG</b><b>{evidenceClass(selected)}</b></div>}
          </header>
          <div className="universe-render-controls">
            <button type="button" className={renderMode === "skeleton" ? "active" : ""} onClick={() => setRenderModeSelection({ neuronId: selected?.neuronId ?? null, mode: "skeleton" })}>Observed centerlines</button>
            <button type="button" className={renderMode === "radius" ? "active" : ""} disabled={!selected?.normalizedMetadata.sourceDiameterAvailable || !activeGeometry} onClick={() => setRenderModeSelection({ neuronId: selected?.neuronId ?? null, mode: "radius" })}>Radius-derived surface</button>
          </div>
          <div className="universe-stage">
            {externalFocusRejected && <p role="alert"><strong>No geometry rendered.</strong> The requested NeuroMorpho focus is not admitted in this exact source universe.</p>}
            {geometryState.status === "loading" && <p role="status"><strong>Cleared previous cell.</strong> Verifying and parsing NMO {geometryState.neuronId}…</p>}
            {geometryState.status === "unavailable" && <p role="alert"><strong>No geometry rendered.</strong> {geometryState.error}</p>}
            {viewportRecord && activeGeometry && <SourceLocalMorphologyViewport
              key={`${selected?.neuronId}:${selected?.sourceObject.rawSwcSha256}`}
              record={viewportRecord}
              geometry={activeGeometry}
              mode={renderMode}
              className="universe-source-viewport"
            />}
          </div>
          <footer>
            <span>{selected?.normalizedMetadata.sourceDiameterAvailable ? "Exact endpoint radii authorize a deterministic surface; it is not a membrane." : "Official No Diameter authority: source radii remain stored but only centerlines may be rendered."}</span>
            <span>{selected?.normalizedMetadata.dimensionality === "2D" ? "Source-labelled 2D: source z values are preserved, rotation is locked to XY, and no depth is inferred or extruded." : "Source-labelled 3D in an unregistered repository-standardized frame."}</span>
          </footer>
        </section>

        <aside className="universe-dossier" aria-label="Record-specific evidence card">
          {selected ? <>
            <span className="universe-record-id">RECORD-SPECIFIC · NEUROMORPHO {selected.neuronId}</span>
            <h3>{selected.normalizedMetadata.name}</h3>
            <div className="universe-record-tags"><span>{membershipLabel(selected)}</span><span>{selected.sourceObject.status}</span><span>{selected.sourceObject.transport.replaceAll("_", " ")}</span></div>
            <section><h4>What differs for this cell</h4><dl>
              <div><dt>Source labels</dt><dd>{readable(selected.normalizedMetadata.cellType)}</dd></div>
              <div><dt>Reported region</dt><dd>{readable(selected.normalizedMetadata.brainRegion)}</dd></div>
              <div><dt>Life stage / sex</dt><dd>{readable(selected.normalizedMetadata.lifeStage)} · {readable(selected.normalizedMetadata.gender)}</dd></div>
              <div><dt>Numeric age</dt><dd>{numericAgeLabel(selected)}</dd></div>
              <div><dt>Strain</dt><dd>{readable(selected.normalizedMetadata.strain)}</dd></div>
              <div><dt>Condition</dt><dd>{readable(selected.normalizedMetadata.experimentCondition)}</dd></div>
              <div><dt>Domain</dt><dd>{selected.normalizedMetadata.domain}</dd></div>
              <div><dt>Physical integrity</dt><dd>{selected.normalizedMetadata.physicalIntegrity}</dd></div>
              <div><dt>Source attributes</dt><dd>{selected.normalizedMetadata.attributes}</dd></div>
            </dl></section>
            <section><h4>Exact geometry audit</h4><dl>
              <div><dt>Nodes / segments</dt><dd>{numericMetric(selected, "nodeCount")} / {numericMetric(selected, "segmentCount")}</dd></div>
              <div><dt>Cable length</dt><dd>{numericMetric(selected, "totalCableLengthMicrometre")} µm · source-local</dd></div>
              <div><dt>Coordinate extent</dt><dd>{extentLabel(selected)} · source-local</dd></div>
              <div><dt>Source node types</dt><dd>{sourceTypeLabel(selected)}</dd></div>
              <div><dt>Reported soma surface</dt><dd>{reportedMetric(selected, "somaSurface", "µm²")}</dd></div>
              <div><dt>Reported total surface / volume</dt><dd>{reportedMetric(selected, "surface", "µm²")} / {reportedMetric(selected, "volume", "µm³")}</dd></div>
              <div><dt>SWC bytes</dt><dd>{selected.sourceObject.rawSwcBytes?.toLocaleString() ?? "Unavailable"}</dd></div>
              <div className="wide"><dt>Raw SWC SHA-256</dt><dd><code>{selected.sourceObject.rawSwcSha256 ?? "Unavailable"}</code></dd></div>
            </dl></section>
            <details className="universe-method-details"><summary>Source method fields</summary><dl>
              <div><dt>Stain</dt><dd>{readable(selected.officialMetadata.stain)}</dd></div>
              <div><dt>Protocol</dt><dd>{readable(selected.officialMetadata.protocol)}</dd></div>
              <div><dt>Slicing direction</dt><dd>{readable(selected.officialMetadata.slicing_direction)}</dd></div>
              <div><dt>Slicing thickness</dt><dd>{readable(selected.officialMetadata.slicing_thickness)} µm</dd></div>
              <div><dt>Objective / magnification</dt><dd>{readable(selected.officialMetadata.objective_type)} / {readable(selected.officialMetadata.magnification)}</dd></div>
              <div><dt>Reconstruction software</dt><dd>{readable(selected.officialMetadata.reconstruction_software)}</dd></div>
              <div><dt>Original format</dt><dd>{readable(selected.officialMetadata.original_format)}</dd></div>
              <div><dt>Shrinkage reported / corrected</dt><dd>{readable(selected.officialMetadata.shrinkage_reported)} / {readable(selected.officialMetadata.shrinkage_corrected)}</dd></div>
              <div><dt>Deposited / uploaded</dt><dd>{readable(selected.officialMetadata.deposition_date)} / {readable(selected.officialMetadata.upload_date)}</dd></div>
            </dl></details>
            <section className="universe-links"><h4>Provenance · {selected.normalizedMetadata.archive}</h4><a href={`https://neuromorpho.org/api/neuron/id/${selected.neuronId}`} target="_blank" rel="noreferrer">Official API record ↗</a><a href={selected.sourceObject.directUrl} target="_blank" rel="noreferrer">Standardized source SWC ↗</a>{selected.sourcePaper.dois.map((doi) => <a key={doi} href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer">Original paper · {doi} ↗</a>)}{selected.sourcePaper.pmids.map((pmid) => <a key={pmid} href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} target="_blank" rel="noreferrer">PubMed · {pmid} ↗</a>)}</section>
            {!selected.missingness.numericAge?.value && <div className="universe-record-gap"><strong>Record-specific missingness</strong><span>Numeric age unavailable · {selected.missingness.numericAge?.missingReason ?? "not reported"}.</span></div>}
          </> : <p>Select a source object to inspect its record-specific evidence.</p>}
        </aside>
      </div>
      {selected && <NativeContourRecordViewer key={selected.neuronId} neuronId={selected.neuronId} />}
    </section>
  );
}
