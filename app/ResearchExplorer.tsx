"use client";

import { useMemo, useState } from "react";
import alkaslasiSourceTaxonomyJson from "../data/alkaslasi-cholinergic-source-taxonomy-0.1.json";
import sathyamurthySourceTaxonomyJson from "../data/sathyamurthy-source-taxonomy-0.1.json";
import {
  RESEARCH_EXPLORER_EXPECTED_COUNTS,
  RESEARCH_EXPLORER_EXPECTED_TOTAL,
  RESEARCH_FOCUS_KINDS,
  groupResearchResults,
  includeSelectedResearchGroup,
  resolveMolecularRecordLifeStage,
  searchResearchRecords,
} from "./research-explorer-index.js";
import { useResearchActiveRecord } from "./ResearchActiveRecordProvider";
import { rowsForPresentationIndices } from "./research-record-presentation.js";
import ResearchRecordEvidenceFingerprint, {
  humanizeEvidenceToken,
  type EvidenceFingerprintAxis,
} from "./ResearchRecordEvidenceFingerprint";

export type ResearchFocusKind = (typeof RESEARCH_FOCUS_KINDS)[number];
export type ResearchFocus = { focusKind: ResearchFocusKind; focusId: string };
export type ResearchFocusView = "summary" | "evidence" | "gaps" | "provenance";

type ResearchEvidenceRow = {
  label: string;
  value: string;
  authority: string;
  locator: string;
};

type ResearchGap = {
  axisId: string;
  label: string;
  status: string;
  reasonCode: string;
  scope: "record_specific" | "shared_dataset_limit" | "shared_project_limit";
  authority: string;
  sourceLocator: string;
  rawValue: string | null;
  detail: string;
  inferenceAllowed: false;
};

export type ResearchRecord = ResearchFocus & {
  key: string;
  title: string;
  subtitle: string;
  namespace: string;
  laneLabel: string;
  summary: string;
  recordSemantics?: {
    parentSourceId: string;
    parentRecordIds?: string[];
    recordKind: string;
    unitOfObservation: string;
    assignmentAuthority: string;
    cellRosterAvailability: string;
    canonicalIdentityStatus: "not_established";
  };
  morphologyMembership?: {
    collection: "census" | "supplementary";
    censusContribution: 0 | 1;
    supplementaryContribution: 0 | 1;
    sourceFrameLocator: string;
    analysisLocator: string;
    geometryPath: string;
    geometrySha256: string;
    routeId: string | null;
  };
  searchTerms: string[];
  evidence: ResearchEvidenceRow[];
  gaps: ResearchGap[];
  provenance: {
    label: string;
    citation: string;
    doi: string | null;
    urls: Array<{ label: string; url: string }>;
    accessions: string[];
    locators: string[];
    objectHashes: Array<{ label: string; sha256: string }>;
  };
  coordinate: {
    geometryStatus: string;
    frame: string;
    registrationStatus: string;
    registrationCount: number;
    measurementUse: string;
  };
  presentation: {
    contractId: "research-record-presentation-0.1";
    sourceSiblingCount: number;
    evidencePartition: {
      identityEvidenceIndices: number[];
      recordSpecificEvidenceIndices: number[];
      sharedEvidenceIndices: number[];
    };
    missingnessPartition: {
      recordSpecificGapIndices: number[];
      sharedGapIndices: number[];
    };
    modeling: {
      route: string;
      admittedCellGeometryObjectCount: number;
      admittedInternalObjectCount: 0;
      generatedFallbackPrimitiveCount: 0;
      registrationCount: 0;
      sameCellJoinCount: 0;
      switchEffect: string;
      noFallbackPrimitive: true;
      axes: Array<{ axisId: string; status: string; authority: string; detail: string }>;
    };
  };
  relationshipStatus: string;
  boundary: string;
  navigation: {
    lab: "overview" | "types" | "sci" | "atlas" | "morphology" | "coverage";
    params: Record<string, string>;
    anchor: string;
  };
};

export type ResearchIndex = {
  records: ResearchRecord[];
  counts: {
    total: number;
    byFocusKind: Record<ResearchFocusKind, number>;
    byNamespace: Record<string, number>;
  };
};

type LoadState =
  | { status: "loading"; records: ResearchRecord[]; index: null; error: "" }
  | { status: "ready"; records: ResearchRecord[]; index: ResearchIndex; error: "" }
  | { status: "error"; records: ResearchRecord[]; index: null; error: string };

const FOCUS_KIND_LABELS: Record<ResearchFocusKind, string> = {
  sci_entity: "SCI evidence entity",
  molecular_profile: "Source profile",
  morphology_record: "Morphology record",
  anatomy_label: "Anatomy label",
  sci_population: "SCI time-course population",
  source_lane: "Coverage source lane",
};

const DOSSIER_VIEWS: ResearchFocusView[] = ["summary", "evidence", "gaps", "provenance"];
const INITIAL_GROUP_LIMIT = 8;
const INITIAL_RESULTS_PER_GROUP = 4;

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortenHash(value: string) {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

function evidenceValue(record: ResearchRecord, labels: string[]) {
  return labels.map((label) => record.evidence.find((row) => row.label === label)?.value).find(Boolean) ?? null;
}

function compactResultEvidence(value: string, itemLimit = 5, characterLimit = 150) {
  const items = value.split(" · ").slice(0, itemLimit).join(" · ");
  return items.length <= characterLimit ? items : `${items.slice(0, characterLimit - 1).trimEnd()}…`;
}

function resultRecordSnippet(record: ResearchRecord) {
  if (record.focusKind !== "molecular_profile") return record.subtitle;
  const count = evidenceValue(record, [
    "Exact sampled-nucleus count",
    "Exact sampled-cell count",
    "Exact captured-cell count",
    "Sampled nuclei",
    "Figure-reported cell count",
  ]);
  const markers = evidenceValue(record, [
    "Source markers",
    "Primary markers",
    "Figure/source markers",
    "Narrative marker panel",
    "Table 8 marker summary",
    "Article marker context",
    "Positive differential features meeting display thresholds",
  ]);
  const distinctive = [
    count ? compactResultEvidence(count, 1, 72) : null,
    markers && !/^\s*(?:not established|not retained|unavailable)\b/i.test(markers)
      ? `Markers: ${compactResultEvidence(markers)}`
      : null,
  ].filter((value): value is string => Boolean(value));
  return distinctive.length ? distinctive.join(" · ") : record.subtitle;
}

function normalizedEvidenceToken(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function gapStatus(record: ResearchRecord, labels: string | string[]) {
  const tokens = (Array.isArray(labels) ? labels : [labels]).map(normalizedEvidenceToken);
  const gap = record.gaps.find((item) => {
    const haystack = `${normalizedEvidenceToken(item.label)} ${normalizedEvidenceToken(item.axisId)}`;
    return tokens.some((token) => haystack.includes(token));
  });
  return gap ? gap.status : "Not established";
}

function MolecularRecordFingerprint({ record }: { record: ResearchRecord }) {
  const countText = evidenceValue(record, [
    "Exact sampled-nucleus count",
    "Exact sampled-cell count",
    "Exact captured-cell count",
    "Sampled nuclei",
    "Figure-reported cell count",
  ]);
  const countMatch = countText?.match(/([\d,]+)/);
  const markerText = evidenceValue(record, [
    "Source markers",
    "Article marker context",
    "Primary markers",
    "Figure/source markers",
    "Narrative marker panel",
    "Table 8 marker summary",
    "Positive differential features meeting display thresholds",
  ]);
  const hasEstablishedMarkerText = Boolean(markerText && !/^\s*(?:not established|not retained|unavailable)\b/i.test(markerText));
  const regionContext = evidenceValue(record, [
    "Source context counts",
    "Spinal and anatomy context",
    "Deposited sample-region membership",
    "Spatial source context",
    "Article spatial context",
    "Spatial-domain context",
    "Region class",
  ]) ?? "Source-local region evidence not retained";
  const lifeStage = resolveMolecularRecordLifeStage(record, {
    sathyamurthyTaxonomy: sathyamurthySourceTaxonomyJson,
    alkaslasiTaxonomy: alkaslasiSourceTaxonomyJson,
  });
  const transmitter = evidenceValue(record, ["Canonical transmitter"])
    ?? "Canonical transmitter field unavailable";
  const hasElectrophysiology = Boolean(evidenceValue(record, ["Electrophysiology evidence", "Firing-pattern total"]));
  const axes: EvidenceFingerprintAxis[] = [
    { label: "Source profile", status: `${record.evidence.length} source evidence rows`, tone: "observed" },
    { label: "Anatomy context", status: regionContext, tone: "context" },
    ...(hasElectrophysiology ? [{ label: "Electrophysiology", status: "Observed at cohort / experiment-family level", tone: "observed" as const }] : []),
    { label: "Morphology", status: gapStatus(record, "morphology"), tone: "missing" },
    { label: "Cell coordinates", status: gapStatus(record, "coordinate"), tone: "missing" },
    { label: "Atlas registration", status: record.coordinate.registrationStatus, tone: "missing" },
    { label: "SCI context", status: gapStatus(record, "sci"), tone: "missing" },
    { label: "Internal structure", status: gapStatus(record, "internal structure"), tone: "missing" },
    { label: "Projection target", status: gapStatus(record, ["projection target", "projection tracing"]), tone: "missing" },
    { label: "Synaptic / circuit connectivity", status: gapStatus(record, ["synaptic connectivity", "circuit partners"]), tone: "missing" },
    { label: "Cross-source same-cell link", status: gapStatus(record, ["same cell cross modal", "cross source same cell", "exact cross source identity"]), tone: "missing" },
    { label: "Raw electrophysiology traces", status: gapStatus(record, ["raw electrophysiology", "electrophysiology"]), tone: "missing" },
  ];

  return (
    <ResearchRecordEvidenceFingerprint
      recordId={record.focusId}
      sourceLabel={record.title}
      namespace={`${record.laneLabel} · ${record.provenance.accessions[0] ?? "Source accession not retained"}`}
      observationUnit={record.recordSemantics?.unitOfObservation ?? "Source record"}
      samplingCount={countMatch ? Number.parseInt(countMatch[1].replaceAll(",", ""), 10) : null}
      samplingUnit={record.recordSemantics?.unitOfObservation ?? null}
      samplingSummary={record.namespace === "crozat-2025:figshare-29430869-v2" ? "Multiple experiment-specific N/n" : null}
      markers={hasEstablishedMarkerText ? markerText!.split(" · ") : []}
      regionContext={regionContext}
      lifeStage={lifeStage}
      transmitterContext={transmitter}
      axes={axes}
      recordBoundary={humanizeEvidenceToken(record.boundary)}
    />
  );
}

function DossierSummary({ record }: { record: ResearchRecord }) {
  return (
    <div className="research-dossier-summary-grid">
      <article>
        <span>Source namespace</span>
        <strong>{record.namespace}</strong>
        <p>{record.laneLabel}</p>
      </article>
      <article>
        <span>Geometry status</span>
        <strong>{record.coordinate.geometryStatus}</strong>
        <p>{readable(record.coordinate.registrationStatus)} · {record.coordinate.registrationCount} project registrations</p>
      </article>
      <article>
        <span>Coordinate frame</span>
        <strong>{record.coordinate.frame}</strong>
        <p>Measurement: {readable(record.coordinate.measurementUse)}</p>
      </article>
      {record.morphologyMembership && <article>
        <span>Morphology membership</span>
        <strong>{readable(record.morphologyMembership.collection)}</strong>
        <p>Census {record.morphologyMembership.censusContribution} · supplementary {record.morphologyMembership.supplementaryContribution}</p>
      </article>}
      {record.recordSemantics && <article>
        <span>Record granularity</span>
        <strong>{readable(record.recordSemantics.recordKind)}</strong>
        <p>Observation unit: {readable(record.recordSemantics.unitOfObservation)}</p>
      </article>}
      {record.recordSemantics && <article>
        <span>Canonical parent</span>
        <strong>{record.recordSemantics.parentSourceId}</strong>
        <p>Identity: {readable(record.recordSemantics.canonicalIdentityStatus)}</p>
      </article>}
    </div>
  );
}

const PRIMARY_MOLECULAR_EVIDENCE_LABELS = new Set([
  "Canonical transmitter",
  "Source-local label",
  "Standardized source label",
  "Deposited raw cluster label",
  "Source markers",
  "Primary markers",
  "Figure/source markers",
  "Narrative marker panel",
  "Table 8 marker summary",
  "Article marker context",
  "Exact sampled-nucleus count",
  "Exact sampled-cell count",
  "Exact captured-cell count",
  "Percent of captured dIL denominator",
  "Sampled nuclei",
  "Figure-reported cell count",
  "Mean genes per cell",
  "Mean silhouette score",
  "Mean LISI score",
  "Positive differential features meeting display thresholds",
  "Differential-feature display audit",
  "3D and internal model state",
  "Electrophysiology evidence",
  "Firing-pattern total",
  "Spinal and anatomy context",
  "Deposited sample-region membership",
  "Spatial source context",
  "Region class",
]);

function DossierEvidence({ record }: { record: ResearchRecord }) {
  if (!record.evidence.length) {
    return <p className="research-dossier-empty">No evidence rows are available for this exact source record.</p>;
  }
  const identityRows = rowsForPresentationIndices(record, record.presentation.evidencePartition.identityEvidenceIndices) as ResearchEvidenceRow[];
  const distinctiveRows = rowsForPresentationIndices(record, record.presentation.evidencePartition.recordSpecificEvidenceIndices) as ResearchEvidenceRow[];
  const sharedRows = rowsForPresentationIndices(record, record.presentation.evidencePartition.sharedEvidenceIndices) as ResearchEvidenceRow[];
  const recordRows = [...identityRows, ...distinctiveRows];
  const primaryRows = record.focusKind === "molecular_profile"
    ? [...recordRows.filter((row) => PRIMARY_MOLECULAR_EVIDENCE_LABELS.has(row.label)), ...recordRows.filter((row) => !PRIMARY_MOLECULAR_EVIDENCE_LABELS.has(row.label))]
    : recordRows;
  const evidenceRows = (rows: ResearchEvidenceRow[]) => rows.map((row, index) => (
    <div key={`${row.label}-${row.locator}-${index}`}>
      <dt>{row.label}</dt>
      <dd>
        {row.label.startsWith("Complete ranked marker panel")
          ? (
            <ol className="research-marker-ranks" aria-label={`${record.title} complete ranked marker panel`}>
              {row.value.split(" · ").map((marker) => {
                const match = /^(\d+)\.\s+(.+)$/.exec(marker);
                return (
                  <li key={marker}>
                    <span>{match?.[1] ?? "—"}</span>
                    <strong>{match?.[2] ?? marker}</strong>
                  </li>
                );
              })}
            </ol>
          )
          : <strong>{row.value}</strong>}
        <span>{readable(row.authority)} · {row.locator}</span>
      </dd>
    </div>
  ));
  return (
    <div>
      <dl className="research-dossier-evidence-list">{evidenceRows(primaryRows)}</dl>
      {!!sharedRows.length && (
        <details className="research-dossier-shared-gaps">
          <summary>{sharedRows.length} exact shared source-context fields · collapsed</summary>
          <p>These values are exact matches across all {record.presentation.sourceSiblingCount} records in this namespace. They are shown once and are not presented as distinguishing findings.</p>
          <dl className="research-dossier-evidence-list">{evidenceRows(sharedRows)}</dl>
        </details>
      )}
    </div>
  );
}

function DossierGaps({ record }: { record: ResearchRecord }) {
  if (!record.gaps.length) {
    return <p className="research-dossier-empty">No explicit gap rows are declared for this exact source record.</p>;
  }
  const recordSpecific = record.gaps.filter((gap) => gap.scope === "record_specific");
  const shared = record.gaps.filter((gap) => gap.scope !== "record_specific");
  const gapRows = (gaps: ResearchGap[]) => gaps.map((gap, index) => (
    <article key={`${gap.axisId}-${gap.reasonCode}-${gap.sourceLocator}-${index}`}>
      <div><strong>{gap.label}</strong><span>{readable(gap.status)}</span></div>
      <p>{gap.detail}</p>
      <dl>
        <div><dt>Reason code</dt><dd>{gap.reasonCode}</dd></div>
        <div><dt>Scope</dt><dd>{gap.scope}</dd></div>
        <div><dt>Authority</dt><dd>{gap.authority}</dd></div>
        <div><dt>Locator</dt><dd>{gap.sourceLocator}</dd></div>
        <div><dt>Raw value</dt><dd>{gap.rawValue ?? "null"}</dd></div>
        <div><dt>Inference</dt><dd>Forbidden</dd></div>
      </dl>
    </article>
  ));
  return (
    <div className="research-dossier-gap-groups">
      <div className="research-dossier-gap-scope-banner">
        <strong>{recordSpecific.length} record-specific</strong>
        <span>{shared.length} shared dataset/project limits</span>
      </div>
      {recordSpecific.length
        ? <div className="research-dossier-gap-list" aria-label="Record-specific missingness">{gapRows(recordSpecific)}</div>
        : <p className="research-dossier-empty">No record-specific missingness is declared for this source record.</p>}
      {!!shared.length && (
        <details className="research-dossier-shared-gaps">
          <summary>{shared.length} shared dataset/project limits · collapsed</summary>
          <p>These limits apply at source-dataset or project-policy scope and are shown once for this dossier.</p>
          <div className="research-dossier-gap-list">{gapRows(shared)}</div>
        </details>
      )}
    </div>
  );
}

function DossierProvenance({ record }: { record: ResearchRecord }) {
  return (
    <div className="research-dossier-provenance">
      <p><strong>{record.provenance.label}</strong></p>
      <p>{record.provenance.citation}</p>
      {!!record.provenance.urls.length && (
        <div className="research-dossier-links">
          {record.provenance.urls.map((item) => (
            <a href={item.url} target="_blank" rel="noreferrer" key={`${item.label}-${item.url}`}>{item.label} ↗</a>
          ))}
        </div>
      )}
      <div className="research-dossier-provenance-grid">
        <section>
          <h5>Accessions</h5>
          {record.provenance.accessions.length
            ? <ul>{record.provenance.accessions.map((item) => <li key={item}>{item}</li>)}</ul>
            : <p>Not available in this record.</p>}
        </section>
        <section>
          <h5>Source locators</h5>
          {record.provenance.locators.length
            ? <ul>{record.provenance.locators.map((item) => <li key={item}>{item}</li>)}</ul>
            : <p>Not available in this record.</p>}
        </section>
      </div>
      <details>
        <summary>Technical provenance</summary>
        <dl>
          <div><dt>Canonical focus</dt><dd>{record.focusKind}:{record.focusId}</dd></div>
          <div><dt>DOI</dt><dd>{record.provenance.doi ?? "Not available"}</dd></div>
          {record.provenance.objectHashes.map((item) => (
            <div key={`${item.label}-${item.sha256}`}><dt>{item.label}</dt><dd title={item.sha256}>{shortenHash(item.sha256)}</dd></div>
          ))}
        </dl>
      </details>
    </div>
  );
}

function ResearchDossier({
  record,
  focus,
  recordStatus,
  recordError,
  activeView,
  onViewChange,
  onOpenRecord,
}: {
  record: ResearchRecord | null;
  focus: ResearchFocus | null;
  recordStatus: "idle" | "verifying" | "ready" | "unavailable";
  recordError: string;
  activeView: ResearchFocusView;
  onViewChange: (view: ResearchFocusView) => void;
  onOpenRecord: (record: ResearchRecord) => void;
}) {
  if (!focus) {
    return (
      <section className="research-dossier research-dossier-unavailable" aria-labelledby="research-dossier-heading">
        <p className="panel-kicker">SOURCE-LOCKED DOSSIER</p>
        <h3 id="research-dossier-heading">No research record selected</h3>
        <p>Select one exact record from the grouped results. No biological record is inferred from an empty focus.</p>
      </section>
    );
  }
  if (!record) {
    const verifying = recordStatus === "verifying";
    return (
      <section className="research-dossier research-dossier-unavailable" aria-labelledby="research-dossier-heading" data-focus-kind={focus.focusKind} data-focus-id={focus.focusId}>
        <p className="panel-kicker">{verifying ? "VERIFYING EXACT FOCUS" : "FOCUS UNAVAILABLE · FAIL-CLOSED"}</p>
        <h3 id="research-dossier-heading">{verifying ? "Verifying this exact research record" : "This exact research record is unavailable"}</h3>
        <p><code>{focus.focusKind}:{focus.focusId}</code> {verifying ? "is being resolved from the checksum-verified index." : `${recordError || "was not found in the checksum-verified index"}.`} The app did not substitute a different record.</p>
      </section>
    );
  }

  return (
    <section className="research-dossier" aria-labelledby="research-dossier-heading" data-focus-kind={record.focusKind} data-focus-id={record.focusId}>
      <header>
        <div>
          <p className="panel-kicker">{FOCUS_KIND_LABELS[record.focusKind].toUpperCase()} · SOURCE-LOCKED</p>
          <h3 id="research-dossier-heading">{record.title}</h3>
          <p>{record.subtitle}</p>
        </div>
        <button type="button" className="research-dossier-open" onClick={() => onOpenRecord(record)}>
          Open source-specific workspace
        </button>
      </header>
      {record.focusKind !== "molecular_profile" && <>
        <p className="research-dossier-summary">{record.summary}</p>
        <details className="research-dossier-limitations">
          <summary>Record and relationship limits · consolidated</summary>
          <p><strong>Shared project boundary:</strong> Search, co-display and shared terms do not establish same-cell, same-type, anatomical or causal relationships; project registration count remains 0.</p>
          <p><strong>Record-specific boundary:</strong> {humanizeEvidenceToken(record.boundary)}</p>
        </details>
      </>}

      <div className="research-dossier-tabs" role="tablist" aria-label="Focused research dossier views">
        {DOSSIER_VIEWS.map((view) => (
          <button
            type="button"
            role="tab"
            id={`research-dossier-${view}-tab`}
            aria-controls={`research-dossier-${view}-panel`}
            aria-selected={activeView === view}
            tabIndex={activeView === view ? 0 : -1}
            className={activeView === view ? "active" : ""}
            data-focus-kind={record.focusKind}
            data-focus-id={record.focusId}
            key={view}
            onClick={() => onViewChange(view)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const current = DOSSIER_VIEWS.indexOf(view);
              const next = event.key === "Home"
                ? DOSSIER_VIEWS[0]
                : event.key === "End"
                  ? DOSSIER_VIEWS[DOSSIER_VIEWS.length - 1]
                  : DOSSIER_VIEWS[(current + (event.key === "ArrowLeft" ? -1 : 1) + DOSSIER_VIEWS.length) % DOSSIER_VIEWS.length];
              onViewChange(next);
              requestAnimationFrame(() => document.getElementById(`research-dossier-${next}-tab`)?.focus());
            }}
          >
            {readable(view)}
            {view === "evidence" && <span>{record.evidence.length}</span>}
            {view === "gaps" && <span>{record.gaps.length}</span>}
          </button>
        ))}
      </div>

      {DOSSIER_VIEWS.map((view) => (
        <div
          id={`research-dossier-${view}-panel`}
          role="tabpanel"
          aria-labelledby={`research-dossier-${view}-tab`}
          hidden={activeView !== view}
          data-focus-kind={record.focusKind}
          data-focus-id={record.focusId}
          key={view}
        >
          {activeView === view && view === "summary" && (record.focusKind === "molecular_profile"
            ? <MolecularRecordFingerprint record={record} />
            : <DossierSummary record={record} />)}
          {activeView === view && view === "evidence" && <DossierEvidence record={record} />}
          {activeView === view && view === "gaps" && <DossierGaps record={record} />}
          {activeView === view && view === "provenance" && <DossierProvenance record={record} />}
        </div>
      ))}
    </section>
  );
}

export default function ResearchExplorer({
  focus,
  query,
  activeView,
  onFocusChange,
  onQueryChange,
  onViewChange,
  onOpenRecord,
  onNotice,
}: {
  focus: ResearchFocus | null;
  query: string;
  activeView: ResearchFocusView;
  onFocusChange: (focus: ResearchFocus) => void;
  onQueryChange: (query: string) => void;
  onViewChange: (view: ResearchFocusView) => void;
  onOpenRecord: (record: ResearchRecord) => void;
  onNotice?: (notice: string) => void;
}) {
  const { indexState, activeRecord } = useResearchActiveRecord();
  const loadState: LoadState = indexState.status === "ready"
    ? { status: "ready", records: indexState.records, index: indexState.index, error: "" }
    : indexState.status === "unavailable"
      ? { status: "error", records: [], index: null, error: indexState.error }
      : { status: "loading", records: [], index: null, error: "" };
  const [kindFilter, setKindFilter] = useState<"all" | ResearchFocusKind>("all");
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  const results = useMemo(() => {
    const searched = searchResearchRecords(loadState.records, query) as Array<{ record: ResearchRecord; score: number }>;
    return kindFilter === "all" ? searched : searched.filter(({ record }) => record.focusKind === kindFilter);
  }, [kindFilter, loadState.records, query]);
  const groups = useMemo(() => groupResearchResults(results) as Array<{
    laneLabel: string;
    namespace: string;
    results: Array<{ record: ResearchRecord; score: number }>;
  }>, [results]);
  const selectedRecord = activeRecord.status === "ready" ? activeRecord.record : null;
  const displayedCounts = loadState.status === "ready" ? loadState.index.counts.byFocusKind : RESEARCH_EXPLORER_EXPECTED_COUNTS;
  const displayedTotal = loadState.status === "ready" ? loadState.index.counts.total : RESEARCH_EXPLORER_EXPECTED_TOTAL;
  const visibleGroups: typeof groups = showAllGroups
    ? groups
    : includeSelectedResearchGroup(groups, selectedRecord, INITIAL_GROUP_LIMIT) as typeof groups;

  const selectRecord = (record: ResearchRecord) => {
    onFocusChange({ focusKind: record.focusKind, focusId: record.focusId });
    onNotice?.(`${record.title} selected · ${record.namespace} retained as the authority namespace`);
  };

  return (
    <section className="research-explorer" aria-labelledby="research-explorer-heading">
      <div className="research-explorer-heading">
        <div>
          <p className="panel-kicker">UPG-049 + UPG-180 + UPG-183 + UPG-185 + UPG-204 · CHECKSUM-VERIFIED · RECORD-DRIVEN · ZERO BIOLOGICAL JOINS</p>
          <h3 id="research-explorer-heading">Interneuron Research Explorer</h3>
          <p>Search {displayedTotal.toLocaleString("en-US")} cross-lane source records by label, marker, DOI, PMID or accession. The molecular lane includes {displayedCounts.molecular_profile.toLocaleString("en-US")} source profiles, including the exact Cano-Gomez P56 CHOL_IN registry, while retaining {displayedCounts.morphology_record.toLocaleString("en-US")} morphology records (142 census + 7 supplementary); the separate exact morphology universe contains 1,097 source objects. Selecting a molecular record replaces its source-record evidence model and clears prior cell geometry; a shared term never creates a same-cell or same-type relationship.</p>
        </div>
        <div className="research-explorer-denominator" aria-label="Research Explorer source-record denominator">
          <strong>{displayedTotal.toLocaleString("en-US")}</strong>
          <span>source records</span>
          <small>{displayedCounts.molecular_profile.toLocaleString("en-US")} source profiles · {displayedCounts.morphology_record.toLocaleString("en-US")} frozen cross-lane morphologies · {displayedCounts.anatomy_label.toLocaleString("en-US")} anatomy labels · {displayedCounts.sci_population.toLocaleString("en-US")} SCI populations · {displayedCounts.sci_entity.toLocaleString("en-US")} SCI entities · {displayedCounts.source_lane.toLocaleString("en-US")} source lanes · separate exact morphology universe 1,097</small>
        </div>
      </div>

      <div className="research-explorer-controls">
        <label>
          Search exact source records
          <input
            type="search"
            value={query}
            maxLength={180}
            placeholder="Vsx2, dILA1-A1, NeuroMorpho:109005, GSE318731, DOI…"
            onChange={(event) => {
              onQueryChange(event.target.value);
              setShowAllGroups(false);
            }}
          />
        </label>
        <label>
          Evidence lane
          <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as "all" | ResearchFocusKind)}>
            <option value="all">All independent lanes</option>
            {RESEARCH_FOCUS_KINDS.map((kind) => <option value={kind} key={kind}>{FOCUS_KIND_LABELS[kind]}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => { onQueryChange(""); setKindFilter("all"); setShowAllGroups(false); }}>Reset search</button>
      </div>

      {loadState.status === "loading" && <p className="research-explorer-status" role="status">Verifying the local Research Explorer manifest and index…</p>}
      {loadState.status === "error" && (
        <div className="research-explorer-error" role="alert">
          <strong>Research index unavailable · fail-closed</strong>
          <p>{loadState.error}</p>
          <p>No record was substituted and no cross-source relationship was inferred.</p>
        </div>
      )}

      {loadState.status === "ready" && (
        <div className="research-explorer-layout">
          <section className="research-result-browser" aria-labelledby="research-results-heading">
            <div className="research-result-summary">
              <div>
                <h4 id="research-results-heading">Grouped source results</h4>
                <p role="status">{results.length} records across {groups.length} source namespaces</p>
              </div>
              <span>Grouping is bibliographic, not biological</span>
            </div>
            {!results.length && (
              <p className="research-explorer-empty">No exact source record matches this literal search. This is not evidence of biological absence.</p>
            )}
            <div className="research-result-groups">
              {visibleGroups.map((group) => {
                const groupKey = `${group.laneLabel}|||${group.namespace}`;
                const expanded = expandedGroups.has(groupKey);
                const visibleResults = expanded ? group.results : group.results.slice(0, INITIAL_RESULTS_PER_GROUP);
                return (
                  <section key={groupKey} className="research-result-group" aria-label={`${group.namespace} results`}>
                    <header><div><span>{group.laneLabel}</span><h5>{group.namespace}</h5></div><strong>{group.results.length}</strong></header>
                    <div className="research-result-list">
                      {visibleResults.map(({ record }) => {
                        const isSelected = selectedRecord?.key === record.key;
                        return (
                          <button
                            type="button"
                            className={isSelected ? "selected" : ""}
                            aria-pressed={isSelected}
                            key={record.key}
                            onClick={() => selectRecord(record)}
                          >
                            <span>{record.title}</span>
                            <small>{resultRecordSnippet(record)}</small>
                            <code>{record.focusId}</code>
                          </button>
                        );
                      })}
                    </div>
                    {group.results.length > INITIAL_RESULTS_PER_GROUP && (
                      <button type="button" className="research-group-toggle" onClick={() => setExpandedGroups((current) => {
                        const next = new Set(current);
                        if (next.has(groupKey)) next.delete(groupKey); else next.add(groupKey);
                        return next;
                      })}>
                        {expanded ? "Show fewer" : `Show all ${group.results.length}`}
                      </button>
                    )}
                  </section>
                );
              })}
            </div>
            {groups.length > INITIAL_GROUP_LIMIT && (
              <button type="button" className="research-all-groups" onClick={() => setShowAllGroups((current) => !current)}>
                {showAllGroups ? "Show first source namespaces" : `Show all ${groups.length} source namespaces`}
              </button>
            )}
          </section>

          <ResearchDossier
            record={selectedRecord}
            focus={focus}
            recordStatus={activeRecord.status}
            recordError={activeRecord.error}
            activeView={activeView}
            onViewChange={onViewChange}
            onOpenRecord={onOpenRecord}
          />
        </div>
      )}
    </section>
  );
}
