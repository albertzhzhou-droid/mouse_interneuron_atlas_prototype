/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- overflow tables are intentional keyboard-focusable scroll regions */
"use client";

import { useEffect, useState } from "react";

export type MetricSummary = {
  n: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
};

export type SourceTypeSummary = {
  sourceType: number;
  interpretation: string;
  segmentCount: number;
  terminalNodeCount: number;
  cableLengthMicrometre: number;
};

export type MorphologyAnalysisRecord = {
  neuronId: number;
  name: string;
  source: {
    dois: string[];
    pmids: string[];
    archive: string;
    cellTypeLabels: string[];
    sourceClass: string;
    sourceSubtypeLabels: string[];
    sourceTertiaryLabel: string;
  };
  dimensionality: "2D" | "3D";
  domain: string;
  physicalIntegrity: string;
  sourceGeometry: { assetSetId: string; path: string; sha256: string };
  denominatorBoundary: {
    analysisUnit: "NeuroMorpho_record";
    recordCountContribution: 1;
    independentAnimalCount: { value: null; missingReason: string };
    independentDonorCount: { value: null; missingReason: string };
    independentSpecimenCount: { value: null; missingReason: string };
    prevalenceDenominator: { value: null; missingReason: string };
    boundary: string;
  };
  metrics: {
    stemCount: number;
    terminalNodeCount: number;
    bifurcationNodeCount: number;
    maximumCentrifugalBranchOrder: number;
    maximumRootPathLengthMicrometre: number;
    maximumRootEuclideanDistanceMicrometre: number;
    neuriteCableLengthMicrometre: number;
    bySourceType: SourceTypeSummary[];
    shollProfile: { radiusMicrometre: number; intersectionCount: number }[];
  };
};

export type MorphologyAnalysisCohort = {
  cohortId: string;
  cohortKey: {
    sourceCitation: { scheme: "DOI" | "PMID"; value: string };
    sourceTertiaryLabel: string;
    dimensionality: "2D" | "3D";
    domain: string;
    physicalIntegrity: string;
  };
  denominatorBoundary: {
    analysisUnit: "NeuroMorpho_record";
    n: number;
    boundary: string;
  };
  neuronIds: number[];
  metricSummaries: Record<MorphologyMetricKey, MetricSummary>;
  bySourceTypeMetricSummaries: {
    sourceType: number;
    interpretation: string;
    segmentCount: MetricSummary;
    terminalNodeCount: MetricSummary;
    cableLengthMicrometre: MetricSummary;
  }[];
  shollMedianProfile: { radiusMicrometre: number; n: number; medianIntersectionCount: number }[];
};

export type MorphologyAnalysisPayload = {
  documentType: "neuromorpho_morphology_analysis_index";
  schemaVersion: "1.0.0";
  assetSetId: string;
  release: string;
  source: {
    assetSetId: string;
    censusIndex: { path: string; sha256: string };
    assetManifest: { path: string; sha256: string };
    geometryRecordCount: number;
  };
  builder: { path: string; version: string; sha256: string; runtime: string; determinism: string };
  rights: Record<string, unknown>;
  scientificBoundary: {
    geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL";
    registrationCount: 0;
    analysisUnit: "NeuroMorpho_record";
    type6Policy: string;
    forbiddenClaims: string[];
  };
  analysisPolicy: Record<string, unknown>;
  summary: {
    recordCount: number;
    cohortCount: number;
    registrationCount: 0;
    recordsWithSourceType6: number;
    maximumShollRadiusMicrometre: number;
  };
  records: MorphologyAnalysisRecord[];
  cohorts: MorphologyAnalysisCohort[];
};

export type AnalysisLoadState =
  | { status: "loading"; payload: null; message: string }
  | { status: "verified"; payload: MorphologyAnalysisPayload; message: string; sha256: string }
  | { status: "unavailable"; payload: null; message: string };

export type MorphologyMetricKey =
  | "stemCount"
  | "terminalNodeCount"
  | "bifurcationNodeCount"
  | "maximumCentrifugalBranchOrder"
  | "maximumRootPathLengthMicrometre"
  | "maximumRootEuclideanDistanceMicrometre"
  | "neuriteCableLengthMicrometre";

const ANALYSIS_BASE = "/data/neuromorpho_release_8_6_124_analysis_v1/";
const EXPECTED_ASSET_SET_ID = "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-morphology-analysis-v1";
const EXPECTED_CENSUS_HASH = "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364";
const EXPECTED_CENSUS_MANIFEST_HASH = "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91";

const METRICS: { key: MorphologyMetricKey; label: string; unit?: string }[] = [
  { key: "stemCount", label: "Stem count" },
  { key: "terminalNodeCount", label: "Terminal-node count" },
  { key: "bifurcationNodeCount", label: "Bifurcation-node count" },
  { key: "maximumCentrifugalBranchOrder", label: "Maximum centrifugal branch order" },
  { key: "maximumRootPathLengthMicrometre", label: "Maximum root path", unit: "µm" },
  { key: "maximumRootEuclideanDistanceMicrometre", label: "Maximum root Euclidean distance", unit: "µm" },
  { key: "neuriteCableLengthMicrometre", label: "Neurite cable length", unit: "µm" },
];

function formatNumber(value: number, maximumFractionDigits = 1) {
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function readableToken(value: string) {
  return value.replaceAll("_", " ");
}

function getUrlValue(key: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

function replaceUrlValue(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertAnalysisPayload(value: unknown): asserts value is MorphologyAnalysisPayload {
  if (!value || typeof value !== "object") throw new Error("analysis index is not an object");
  const payload = value as MorphologyAnalysisPayload;
  if (
    payload.documentType !== "neuromorpho_morphology_analysis_index" ||
    payload.schemaVersion !== "1.0.0" ||
    payload.assetSetId !== EXPECTED_ASSET_SET_ID ||
    payload.release !== "8.6.124"
  ) throw new Error("analysis identity does not match the pinned release");
  if (
    payload.scientificBoundary?.geometryStatus !== "OBS_STANDARDIZED_SOURCE_LOCAL" ||
    payload.scientificBoundary?.registrationCount !== 0 ||
    payload.summary?.registrationCount !== 0
  ) throw new Error("analysis scientific boundary changed");
  if (
    payload.source?.censusIndex?.sha256 !== EXPECTED_CENSUS_HASH ||
    payload.source?.assetManifest?.sha256 !== EXPECTED_CENSUS_MANIFEST_HASH
  ) throw new Error("analysis source hashes do not match the admitted census");
  if (!Array.isArray(payload.records) || payload.records.length !== 142 || payload.summary.recordCount !== 142) {
    throw new Error("analysis record denominator changed");
  }
  if (!Array.isArray(payload.cohorts) || payload.cohorts.length !== payload.summary.cohortCount) {
    throw new Error("analysis cohort index is incomplete");
  }
  const assignedIds = payload.cohorts.flatMap((cohort) => cohort.neuronIds);
  if (
    assignedIds.length !== 142 ||
    new Set(assignedIds).size !== 142 ||
    payload.cohorts.some((cohort) =>
      cohort.denominatorBoundary?.analysisUnit !== "NeuroMorpho_record" ||
      cohort.denominatorBoundary.n !== cohort.neuronIds.length,
    )
  ) throw new Error("analysis cohort denominator boundary changed");
}

export function useMorphologyAnalysis(): AnalysisLoadState {
  const [state, setState] = useState<AnalysisLoadState>({
    status: "loading",
    payload: null,
    message: "Loading and verifying the derived analysis asset…",
  });

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const manifestResponse = await fetch(`${ANALYSIS_BASE}asset-manifest.json`, { signal: controller.signal });
        if (!manifestResponse.ok) throw new Error(`analysis manifest request failed (${manifestResponse.status})`);
        const manifest = await manifestResponse.json() as {
          documentType?: string;
          assetSetId?: string;
          release?: string;
          scientificBoundary?: { registrationCount?: number };
          files?: { path?: string; kind?: string; sha256?: string; bytes?: number }[];
        };
        if (
          manifest.documentType !== "neuromorpho_morphology_analysis_asset_manifest" ||
          manifest.assetSetId !== EXPECTED_ASSET_SET_ID ||
          manifest.release !== "8.6.124" ||
          manifest.scientificBoundary?.registrationCount !== 0
        ) throw new Error("analysis manifest identity or registration boundary changed");
        const declaration = manifest.files?.find((file) => file.path === "analysis-index.json");
        if (!declaration || declaration.kind !== "morphology_analysis_index" || !declaration.sha256 || !declaration.bytes) {
          throw new Error("analysis index is not declared by the manifest");
        }
        const indexResponse = await fetch(`${ANALYSIS_BASE}analysis-index.json`, { signal: controller.signal });
        if (!indexResponse.ok) throw new Error(`analysis index request failed (${indexResponse.status})`);
        const bytes = await indexResponse.arrayBuffer();
        if (bytes.byteLength !== declaration.bytes) throw new Error("analysis index byte count does not match the manifest");
        const hash = await sha256Hex(bytes);
        if (hash !== declaration.sha256) throw new Error("analysis index checksum does not match the manifest");
        const payload = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
        assertAnalysisPayload(payload);
        setState({
          status: "verified",
          payload,
          sha256: hash,
          message: `Checksum verified · ${payload.summary.recordCount} records · ${payload.summary.cohortCount} exact source cohorts`,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setState({
            status: "unavailable",
            payload: null,
            message: `Derived cohort analysis is unavailable: ${(error as Error).message}. The source-record viewer remains available.`,
          });
        }
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  return state;
}

function cohortLabel(cohort: MorphologyAnalysisCohort) {
  const key = cohort.cohortKey;
  return `${key.sourceTertiaryLabel} · ${key.dimensionality} · n=${cohort.denominatorBoundary.n} · ${key.sourceCitation.value}`;
}

function CohortIdentity({ cohort, letter }: { cohort: MorphologyAnalysisCohort; letter: "A" | "B" }) {
  const key = cohort.cohortKey;
  return (
    <article className="morphology-cohort-card">
      <span>COHORT {letter} · EXACT SOURCE STRATUM</span>
      <h3>{key.sourceTertiaryLabel}</h3>
      <dl>
        <div><dt>Repository records</dt><dd>{cohort.denominatorBoundary.n}</dd></div>
        <div><dt>Paper</dt><dd>{key.sourceCitation.scheme} {key.sourceCitation.value}</dd></div>
        <div><dt>Geometry</dt><dd>{key.dimensionality} · {key.domain}</dd></div>
        <div><dt>Physical integrity</dt><dd>{key.physicalIntegrity}</dd></div>
        <div><dt>Independent animals</dt><dd>Not established</dd></div>
      </dl>
    </article>
  );
}

function SourceTypeTable({ cohortA, cohortB }: { cohortA: MorphologyAnalysisCohort; cohortB: MorphologyAnalysisCohort }) {
  const sourceTypes = Array.from(new Set([
    ...cohortA.bySourceTypeMetricSummaries.map((row) => row.sourceType),
    ...cohortB.bySourceTypeMetricSummaries.map((row) => row.sourceType),
  ])).sort((left, right) => left - right);
  return (
    <div className="morphology-table-scroll" role="region" tabIndex={0} aria-label="Median cable length by retained source SWC type">
      <table>
        <caption>Median cable length by retained SWC source type</caption>
        <thead><tr><th scope="col">Source type</th><th scope="col">Interpretation</th><th scope="col">Cohort A median</th><th scope="col">Cohort B median</th></tr></thead>
        <tbody>{sourceTypes.map((sourceType) => {
          const rowA = cohortA.bySourceTypeMetricSummaries.find((row) => row.sourceType === sourceType);
          const rowB = cohortB.bySourceTypeMetricSummaries.find((row) => row.sourceType === sourceType);
          const interpretation = rowA?.interpretation ?? rowB?.interpretation ?? "uninterpreted";
          return <tr key={sourceType}><th scope="row">{sourceType}</th><td>{readableToken(interpretation)}</td><td>{formatNumber(rowA?.cableLengthMicrometre.median ?? 0)} µm</td><td>{formatNumber(rowB?.cableLengthMicrometre.median ?? 0)} µm</td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}

function ShollTable({ cohortA, cohortB }: { cohortA: MorphologyAnalysisCohort; cohortB: MorphologyAnalysisCohort }) {
  const radii = Array.from(new Set([
    ...cohortA.shollMedianProfile.map((row) => row.radiusMicrometre),
    ...cohortB.shollMedianProfile.map((row) => row.radiusMicrometre),
  ])).sort((left, right) => left - right);
  return (
    <div className="morphology-table-scroll morphology-sholl-table" role="region" tabIndex={0} aria-label="Root-centred Sholl median comparison">
      <table>
        <caption>Root-node-centred Sholl median profile · 10 µm shells</caption>
        <thead><tr><th scope="col">Radius</th><th scope="col">Cohort A median intersections</th><th scope="col">Cohort B median intersections</th></tr></thead>
        <tbody>{radii.map((radius) => {
          const rowA = cohortA.shollMedianProfile.find((row) => row.radiusMicrometre === radius);
          const rowB = cohortB.shollMedianProfile.find((row) => row.radiusMicrometre === radius);
          return <tr key={radius}><th scope="row">{radius} µm</th><td>{formatNumber(rowA?.medianIntersectionCount ?? 0)}</td><td>{formatNumber(rowB?.medianIntersectionCount ?? 0)}</td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}

export function MorphologyCohortAnalysis({ state }: { state: AnalysisLoadState }) {
  const payload = state.payload;
  const defaultA = payload?.cohorts.find((cohort) => cohort.cohortKey.sourceTertiaryLabel === "GRP") ?? payload?.cohorts[0];
  const defaultB = payload?.cohorts.find((cohort) => cohort.cohortKey.sourceTertiaryLabel === "Substance P") ?? payload?.cohorts[1] ?? payload?.cohorts[0];
  const [cohortAId, setCohortAId] = useState(() => getUrlValue("morphologyCohortA") ?? "");
  const [cohortBId, setCohortBId] = useState(() => getUrlValue("morphologyCohortB") ?? "");
  const [metric, setMetric] = useState<MorphologyMetricKey>(() => {
    const candidate = getUrlValue("morphologyMetric") as MorphologyMetricKey | null;
    return METRICS.some((option) => option.key === candidate) ? candidate! : "neuriteCableLengthMicrometre";
  });

  if (state.status !== "verified" || !payload) {
    return <section className={`morphology-analysis-unavailable ${state.status}`} aria-live="polite"><h3>Morphology phenotyping</h3><p>{state.message}</p><p>No derived value is substituted when the analysis asset cannot be verified.</p></section>;
  }
  const cohortA = payload.cohorts.find((cohort) => cohort.cohortId === cohortAId) ?? defaultA;
  const cohortB = payload.cohorts.find((cohort) => cohort.cohortId === cohortBId) ?? defaultB;
  if (!cohortA || !cohortB) return <p role="alert">The verified analysis contains no usable cohort.</p>;
  const metricOption = METRICS.find((option) => option.key === metric)!;
  const summaryA = cohortA.metricSummaries[metric];
  const summaryB = cohortB.metricSummaries[metric];
  const updateCohort = (side: "A" | "B", value: string) => {
    if (side === "A") setCohortAId(value); else setCohortBId(value);
    replaceUrlValue(side === "A" ? "morphologyCohortA" : "morphologyCohortB", value);
  };
  const updateMetric = (value: MorphologyMetricKey) => {
    setMetric(value);
    replaceUrlValue("morphologyMetric", value);
  };

  return (
    <section className="morphology-analysis-workspace" aria-labelledby="morphology-analysis-heading">
      <header className="morphology-analysis-heading">
        <div>
          <p className="panel-kicker">DERIVED FROM 142 CHECKSUM-PINNED SWCs · 0 REGISTRATIONS</p>
          <h3 id="morphology-analysis-heading">Paper-aware morphology phenotyping</h3>
          <p>Compare exact source strata without claiming biological equivalence. Every denominator below is a repository reconstruction record—not an independent animal, donor, specimen or prevalence observation.</p>
        </div>
        <span className="morphology-analysis-verified">VERIFIED · {state.sha256.slice(0, 12)}…</span>
      </header>

      <div className="morphology-analysis-controls">
        <label>Cohort A<select value={cohortA.cohortId} onChange={(event) => updateCohort("A", event.target.value)}>{payload.cohorts.map((cohort) => <option key={cohort.cohortId} value={cohort.cohortId}>{cohortLabel(cohort)}</option>)}</select></label>
        <label>Cohort B<select value={cohortB.cohortId} onChange={(event) => updateCohort("B", event.target.value)}>{payload.cohorts.map((cohort) => <option key={cohort.cohortId} value={cohort.cohortId}>{cohortLabel(cohort)}</option>)}</select></label>
        <label>Metric<select value={metric} onChange={(event) => updateMetric(event.target.value as MorphologyMetricKey)}>{METRICS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
      </div>

      <div className="morphology-cohort-grid"><CohortIdentity cohort={cohortA} letter="A" /><CohortIdentity cohort={cohortB} letter="B" /></div>

      <section className="morphology-distribution-panel" aria-labelledby="morphology-distribution-heading">
        <div><p>SELECTED DISTRIBUTION</p><h4 id="morphology-distribution-heading">{metricOption.label}</h4><span>Hyndman–Fan Type 7 quantiles · descriptive only{metricOption.unit ? ` · ${metricOption.unit}` : ""}</span></div>
        <div className="morphology-table-scroll" role="region" tabIndex={0} aria-label={`${metricOption.label} five-number summary`}>
          <table>
            <caption>{metricOption.label} · exact cohort five-number summaries</caption>
            <thead><tr><th scope="col">Cohort</th><th scope="col">n records</th><th scope="col">Minimum</th><th scope="col">Q1</th><th scope="col">Median</th><th scope="col">Q3</th><th scope="col">Maximum</th></tr></thead>
            <tbody>
              <tr><th scope="row">A · {cohortA.cohortKey.sourceTertiaryLabel}</th><td>{summaryA.n}</td>{[summaryA.min, summaryA.q1, summaryA.median, summaryA.q3, summaryA.max].map((value, index) => <td key={index}>{formatNumber(value)}{metricOption.unit ? ` ${metricOption.unit}` : ""}</td>)}</tr>
              <tr><th scope="row">B · {cohortB.cohortKey.sourceTertiaryLabel}</th><td>{summaryB.n}</td>{[summaryB.min, summaryB.q1, summaryB.median, summaryB.q3, summaryB.max].map((value, index) => <td key={index}>{formatNumber(value)}{metricOption.unit ? ` ${metricOption.unit}` : ""}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="morphology-analysis-tables"><SourceTypeTable cohortA={cohortA} cohortB={cohortB} /><ShollTable cohortA={cohortA} cohortB={cohortB} /></div>

      <div className="morphology-analysis-boundaries">
        <article><strong>What is computed</strong><p>Straight-segment cable length, root-path length, root Euclidean distance, stems, non-type-1 terminals and bifurcations, centrifugal branch order, and analytic line–sphere Sholl intersections.</p></article>
        <article><strong>What is preserved</strong><p>Original standardized coordinates, topology and child-node SWC type. Source type 6 remains uninterpreted; it is never promoted to axon or dendrite.</p></article>
        <article><strong>What remains unavailable</strong><p>Atlas placement, complete axonal projections, synapses, cell-type equivalence, independent animal counts, prevalence, and harmonized cross-paper biological effect sizes.</p></article>
      </div>
      <p className="reference-method">Sholl shells are centred on the retained root-node coordinate, not a soma centroid. Two-dimensional and three-dimensional records are never implicitly pooled; acquisition and shrinkage corrections are not harmonized.</p>
    </section>
  );
}

export function MorphologyRecordAnalysis({ record }: { record: MorphologyAnalysisRecord | null }) {
  if (!record) return null;
  const peak = record.metrics.shollProfile.reduce<{ radiusMicrometre: number; intersectionCount: number } | null>((best, row) => !best || row.intersectionCount > best.intersectionCount ? row : best, null);
  return (
    <section className="morphology-record-analysis" aria-labelledby="morphology-record-analysis-heading">
      <h4 id="morphology-record-analysis-heading">Source-local phenotype · independently reproducible</h4>
      <div className="morphology-record-metric-grid">
        {METRICS.map((option) => <span key={option.key}><b>{formatNumber(record.metrics[option.key])}{option.unit ? ` ${option.unit}` : ""}</b>{option.label}</span>)}
        <span><b>{peak ? `${formatNumber(peak.intersectionCount)} at ${peak.radiusMicrometre} µm` : "No positive shell"}</b>Peak root-centred Sholl shell</span>
      </div>
      <div className="morphology-table-scroll" role="region" tabIndex={0} aria-label="Selected reconstruction source-type phenotype">
        <table>
          <caption>Retained child-node SWC types</caption>
          <thead><tr><th scope="col">Type</th><th scope="col">Interpretation</th><th scope="col">Segments</th><th scope="col">Terminals</th><th scope="col">Cable</th></tr></thead>
          <tbody>{record.metrics.bySourceType.map((row) => <tr key={row.sourceType}><th scope="row">{row.sourceType}</th><td>{readableToken(row.interpretation)}</td><td>{row.segmentCount}</td><td>{row.terminalNodeCount}</td><td>{formatNumber(row.cableLengthMicrometre)} µm</td></tr>)}</tbody>
        </table>
      </div>
      <p>Analysis unit: one NeuroMorpho record. Independent animals, donors, specimens and prevalence denominator are not established.</p>
    </section>
  );
}
