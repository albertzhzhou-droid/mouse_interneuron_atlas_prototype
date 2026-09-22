/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- exact-value comparison tables are keyboard-scrollable regions */
"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { AnalysisLoadState, MorphologyAnalysisRecord } from "./MorphologyAnalysisPanel";
import {
  type MorphologyComparisonRecord,
  morphologyClassification,
  morphologyHasDiameter,
  useVerifiedMorphologyGeometry,
} from "./morphology-census-data";
import {
  MORPHOLOGY_COMPARISON_METRICS,
  buildMorphologyComparisonReceipt,
  morphologyComparisonReceiptCsv,
} from "./morphology-comparison.js";
import {
  MORPHOLOGY_MATRIX_MAX_SELECTIONS,
  MORPHOLOGY_MATRIX_MIN_SELECTIONS,
} from "./morphology-matrix-state.js";
import SourceLocalMorphologyViewport, {
  type MorphologyRenderMode,
  type MorphologyViewportRuntimeBinding,
  type MorphologyViewportScaleReceipt,
} from "./SourceLocalMorphologyViewport";
import {
  MORPHOLOGY_SOURCE_FRAME_DISCLOSURE_AUTHORITY,
  morphologySourceFrameDisclosureFor,
} from "./morphology-source-frame-disclosure";
import MorphologyRecordDisclosure from "./MorphologyRecordDisclosure";
import MorphologyTopologyDetailPanel from "./MorphologyTopologyDetailPanel";
import MorphologyMicrodetailCoverage from "./MorphologyMicrodetailCoverage";
import SuperClemSynapseReference from "./SuperClemSynapseReference";

const SLOT_COLORS = ["#75cdb9", "#f3b33e", "#cc79a7", "#56b4e9"];

function formatMetric(value: number, unit: string) {
  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return unit === "micrometre" ? `${formatted} µm` : formatted;
}

function metadataText(value: string | string[]) {
  return Array.isArray(value) ? value.join(" · ") : value;
}

function effectiveRenderModeFor(record: MorphologyComparisonRecord, requestedMode: MorphologyRenderMode) {
  return requestedMode === "radius" && morphologyHasDiameter(record) ? "radius" : "skeleton";
}

function replaceUrlValue(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function initialModes(): MorphologyRenderMode[] {
  if (typeof window === "undefined") return ["skeleton", "skeleton", "skeleton", "skeleton"];
  const values = new URLSearchParams(window.location.search).get("morphologyModes")?.split(",") ?? [];
  return [0, 1, 2, 3].map((index) => values[index] === "radius" ? "radius" : "skeleton");
}

function downloadText(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ComparisonCard({
  record,
  slot,
  mode,
  analysis,
  canRemove,
  onModeChange,
  onRemove,
  onGeometryVerificationChange,
  onScaleBarChange,
  onViewportBindingChange,
}: {
  record: MorphologyComparisonRecord;
  slot: number;
  mode: MorphologyRenderMode;
  analysis: MorphologyAnalysisRecord | null;
  canRemove: boolean;
  onModeChange: (mode: MorphologyRenderMode) => void;
  onRemove: () => void;
  onGeometryVerificationChange: (neuronId: number, verifiedSha256: string | null) => void;
  onScaleBarChange: (neuronId: number, receipt: MorphologyViewportScaleReceipt | null) => void;
  onViewportBindingChange: (neuronId: number, binding: MorphologyViewportRuntimeBinding | null) => void;
}) {
  const geometryState = useVerifiedMorphologyGeometry(record);
  const disclosure = morphologySourceFrameDisclosureFor(record);
  useEffect(() => {
    onGeometryVerificationChange(
      record.neuronId,
      geometryState.status === "verified" ? record.geometry.sha256 : null,
    );
    return () => onGeometryVerificationChange(record.neuronId, null);
  }, [geometryState.status, onGeometryVerificationChange, record.geometry.sha256, record.neuronId]);
  const radiusAuthorized = morphologyHasDiameter(record);
  const effectiveMode = effectiveRenderModeFor(record, mode);
  return (
    <article className="morphology-compare-card" style={{ "--slot-color": SLOT_COLORS[slot] } as React.CSSProperties}>
      <header>
        <div><span>SLOT {String.fromCharCode(65 + slot)} · NMO {record.neuronId}</span><h4>{record.normalizedMetadata.name}</h4></div>
        <button type="button" onClick={onRemove} disabled={!canRemove}>Remove</button>
      </header>
      <div className="morphology-compare-tags">
        <span>OBS SWC</span><span>{record.normalizedMetadata.dimensionality}</span><span>{morphologyClassification(record)}</span>
      </div>
      <div className="morphology-compare-render-controls" aria-label={`Rendering mode for NeuroMorpho ${record.neuronId}`}>
        <button type="button" className={effectiveMode === "skeleton" ? "active" : ""} onClick={() => onModeChange("skeleton")}>Observed centerlines</button>
        <button type="button" className={effectiveMode === "radius" ? "active" : ""} onClick={() => onModeChange("radius")} disabled={!radiusAuthorized}>Radius-derived</button>
        <button type="button" disabled>Internal detail unavailable</button>
      </div>
      {geometryState.status === "verified"
        ? <SourceLocalMorphologyViewport
            record={record}
            geometry={geometryState.geometry}
            mode={effectiveMode}
            onScaleBarChange={(receipt) => onScaleBarChange(record.neuronId, receipt)}
            onViewportBindingChange={(binding) => onViewportBindingChange(record.neuronId, binding)}
          />
        : <div className="morphology-source-local-viewport"><p className="morphology-viewport-failure" role={geometryState.status === "unavailable" ? "alert" : "status"}>{geometryState.message}</p></div>}
      <p className="morphology-compare-render-note">{effectiveMode === "radius"
        ? "Exact source radii drive open tapered frusta; this is a display derivative, not membrane segmentation."
        : radiusAuthorized
          ? "Exact coordinates and topology; constant-width strokes are display aids. Radius mode is available on request."
          : "Official source attributes report No Diameter. Numeric placeholder radii are ignored and surface mode fails closed."}</p>
      <MorphologyRecordDisclosure
        disclosure={disclosure}
        geometryVerification={geometryState.status === "verified" ? "verified" : geometryState.status === "unavailable" ? "unavailable" : "pending"}
      />
      <dl className="morphology-compare-metadata">
        <div><dt>Source scope</dt><dd>{metadataText(record.normalizedMetadata.species)} · {record.normalizedMetadata.lifeStage}</dd></div>
        <div><dt>Reported region</dt><dd>{record.normalizedMetadata.brainRegion.join(" · ") || "Not reported"}</dd></div>
        <div><dt>Source labels</dt><dd>{record.normalizedMetadata.cellType.join(" · ") || "Not reported"}</dd></div>
        {record.comparisonMembership.routeId && <div><dt>Supplementary route</dt><dd>{record.comparisonMembership.routeId}</dd></div>}
        <div><dt>Analysis unit</dt><dd>{analysis ? "1 NeuroMorpho record" : "Derived analysis unavailable"}</dd></div>
      </dl>
      {analysis && <div className="morphology-compare-card-metrics"><span><b>{analysis.metrics.neuriteCableLengthMicrometre.toLocaleString(undefined, { maximumFractionDigits: 1 })} µm</b>cable</span><span><b>{analysis.metrics.terminalNodeCount}</b>terminals</span><span><b>{analysis.metrics.maximumCentrifugalBranchOrder}</b>max branch order</span></div>}
      <MorphologyTopologyDetailPanel neuronId={record.neuronId} compact />
    </article>
  );
}

function ShollComparisonChart({ records }: { records: { record: MorphologyComparisonRecord; analysis: MorphologyAnalysisRecord }[] }) {
  const width = 760;
  const height = 270;
  const padding = { left: 48, right: 18, top: 24, bottom: 42 };
  const maxRadius = Math.max(10, ...records.flatMap(({ analysis }) => analysis.metrics.shollProfile.map((point) => point.radiusMicrometre)));
  const maxIntersections = Math.max(1, ...records.flatMap(({ analysis }) => analysis.metrics.shollProfile.map((point) => point.intersectionCount)));
  const x = (radius: number) => padding.left + radius / maxRadius * (width - padding.left - padding.right);
  const y = (count: number) => height - padding.bottom - count / maxIntersections * (height - padding.top - padding.bottom);
  const xTicks = [0, .25, .5, .75, 1].map((fraction) => Math.round(maxRadius * fraction / 10) * 10);
  const yTicks = [0, .25, .5, .75, 1].map((fraction) => Math.round(maxIntersections * fraction));
  return (
    <section className="morphology-sholl-comparison" aria-labelledby="morphology-sholl-comparison-heading">
      <header><div><span>EXACT RECORD PROFILES</span><h4 id="morphology-sholl-comparison-heading">Root-node-centred Sholl comparison</h4></div><p>10 µm shells · descriptive only</p></header>
      <div className="morphology-sholl-chart-scroll" role="img" aria-label={`Sholl intersection profiles for ${records.map(({ record }) => `NeuroMorpho ${record.neuronId}`).join(", ")}. Exact values follow in the comparison data table.`}>
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {yTicks.map((tick) => <g key={`y-${tick}`}><line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} /><text x={padding.left - 8} y={y(tick) + 4} textAnchor="end">{tick}</text></g>)}
          {xTicks.map((tick) => <g key={`x-${tick}`}><line x1={x(tick)} x2={x(tick)} y1={padding.top} y2={height - padding.bottom} /><text x={x(tick)} y={height - 17} textAnchor="middle">{tick}</text></g>)}
          {records.map(({ record, analysis }, index) => <polyline key={record.neuronId} points={analysis.metrics.shollProfile.map((point) => `${x(point.radiusMicrometre)},${y(point.intersectionCount)}`).join(" ")} style={{ stroke: SLOT_COLORS[index] }} />)}
          <text className="axis-label" x={(padding.left + width - padding.right) / 2} y={height - 2} textAnchor="middle">Radius from root node (µm)</text>
          <text className="axis-label" transform={`translate(13 ${(padding.top + height - padding.bottom) / 2}) rotate(-90)`} textAnchor="middle">Intersections</text>
        </svg>
      </div>
      <div className="morphology-sholl-legend">{records.map(({ record }, index) => <span key={record.neuronId}><i style={{ background: SLOT_COLORS[index] }} />{String.fromCharCode(65 + index)} · NMO {record.neuronId}</span>)}</div>
    </section>
  );
}

export default function MorphologyComparePanel({
  records,
  comparisonIds,
  analysisState,
  censusIndexStatus,
  supplementaryAdapterStatus,
  supplementaryAnalysisRecords = [],
  supplementaryAnalysisSha256 = null,
  supplementaryAnalysisMessage = "Supplementary analysis delta is unavailable.",
  onComparisonChange,
  onOpenMatrix,
}: {
  records: MorphologyComparisonRecord[];
  comparisonIds: number[];
  analysisState: AnalysisLoadState;
  censusIndexStatus: "loading" | "verified" | "unavailable";
  supplementaryAdapterStatus: "verified" | "unavailable";
  supplementaryAnalysisRecords?: MorphologyAnalysisRecord[];
  supplementaryAnalysisSha256?: string | null;
  supplementaryAnalysisMessage?: string;
  onComparisonChange: (ids: number[]) => void;
  onOpenMatrix: () => void;
}) {
  const [modes, setModes] = useState<MorphologyRenderMode[]>(initialModes);
  const [collectionFilter, setCollectionFilter] = useState<"all" | "census" | "supplementary">("all");
  const [candidateQuery, setCandidateQuery] = useState("");
  const [verifiedGeometryReceipts, setVerifiedGeometryReceipts] = useState<Map<number, string>>(() => new Map());
  const [runtimeScaleReceipts, setRuntimeScaleReceipts] = useState<Map<number, MorphologyViewportScaleReceipt>>(() => new Map());
  const [runtimeViewportBindings, setRuntimeViewportBindings] = useState<Map<number, MorphologyViewportRuntimeBinding>>(() => new Map());
  const deferredCandidateQuery = useDeferredValue(candidateQuery.trim().toLowerCase());
  const indexedCensusRecordCount = records.filter((record) => record.comparisonMembership.collection === "census").length;
  const indexedSupplementaryRecordCount = records.filter((record) => record.comparisonMembership.collection === "supplementary").length;
  const indexedSourceObjectCount = indexedCensusRecordCount + indexedSupplementaryRecordCount;
  const selectedRecords = comparisonIds.map((id) => records.find((record) => record.neuronId === id)).filter((record): record is MorphologyComparisonRecord => Boolean(record));
  const analysisById = useMemo(() => new Map([
    ...(analysisState.payload?.records ?? []),
    ...supplementaryAnalysisRecords,
  ].map((record) => [record.neuronId, record])), [analysisState.payload, supplementaryAnalysisRecords]);
  const plotted = selectedRecords.map((record) => ({ record, analysis: analysisById.get(record.neuronId) ?? null })).filter((item): item is { record: MorphologyComparisonRecord; analysis: MorphologyAnalysisRecord } => Boolean(item.analysis));
  const filteredCandidates = useMemo(() => records.filter((record) => {
    if (collectionFilter !== "all" && record.comparisonMembership.collection !== collectionFilter) return false;
    if (!deferredCandidateQuery) return true;
    return [
      record.neuronId,
      record.normalizedMetadata.name,
      record.normalizedMetadata.archive,
      ...record.normalizedMetadata.cellType,
      ...record.normalizedMetadata.brainRegion,
    ].join(" ").toLowerCase().includes(deferredCandidateQuery);
  }), [collectionFilter, deferredCandidateQuery, records]);
  const selectedAnalysisComplete = selectedRecords.length >= MORPHOLOGY_MATRIX_MIN_SELECTIONS
    && plotted.length === selectedRecords.length;
  const selectedGeometryComplete = selectedRecords.length >= MORPHOLOGY_MATRIX_MIN_SELECTIONS
    && selectedRecords.every((record) => verifiedGeometryReceipts.get(record.neuronId) === record.geometry.sha256);
  const selectedScaleComplete = selectedRecords.length >= MORPHOLOGY_MATRIX_MIN_SELECTIONS
    && selectedRecords.every((record, index) => {
      const receipt = runtimeScaleReceipts.get(record.neuronId);
      const binding = runtimeViewportBindings.get(record.neuronId);
      const expectedMode = effectiveRenderModeFor(record, modes[index] ?? "skeleton");
      return receipt?.geometrySha256 === record.geometry.sha256
        && binding?.geometrySha256 === record.geometry.sha256
        && receipt.effectiveRenderMode === expectedMode
        && binding.effectiveRenderMode === expectedMode
        && receipt.viewportInstanceId === binding.viewportInstanceId
        && receipt.viewportRevision === binding.viewportRevision;
    });
  const analysisMessage = selectedRecords.some((record) => record.comparisonMembership.collection === "supplementary" && !analysisById.has(record.neuronId))
    ? supplementaryAnalysisMessage
    : analysisState.message;
  const invalidateViewportRuntime = useCallback((neuronIds?: number[]) => {
    setRuntimeScaleReceipts((current) => {
      if (!neuronIds) return new Map();
      const next = new Map(current);
      neuronIds.forEach((neuronId) => next.delete(neuronId));
      return next;
    });
    setRuntimeViewportBindings((current) => {
      if (!neuronIds) return new Map();
      const next = new Map(current);
      neuronIds.forEach((neuronId) => next.delete(neuronId));
      return next;
    });
  }, []);
  const updateMode = (index: number, mode: MorphologyRenderMode) => {
    const neuronId = selectedRecords[index]?.neuronId;
    if (neuronId !== undefined) invalidateViewportRuntime([neuronId]);
    const next = modes.map((candidate, candidateIndex) => candidateIndex === index ? mode : candidate);
    setModes(next);
    replaceUrlValue("morphologyModes", next.slice(0, selectedRecords.length).join(","));
  };
  const reportGeometryVerification = useCallback((neuronId: number, verifiedSha256: string | null) => {
    setVerifiedGeometryReceipts((current) => {
      const next = new Map(current);
      if (verifiedSha256) next.set(neuronId, verifiedSha256);
      else next.delete(neuronId);
      return next;
    });
  }, []);
  const reportScaleBar = useCallback((neuronId: number, receipt: MorphologyViewportScaleReceipt | null) => {
    setRuntimeScaleReceipts((current) => {
      const next = new Map(current);
      if (receipt) next.set(neuronId, receipt);
      else next.delete(neuronId);
      return next;
    });
  }, []);
  const reportViewportBinding = useCallback((neuronId: number, binding: MorphologyViewportRuntimeBinding | null) => {
    setRuntimeViewportBindings((current) => {
      const next = new Map(current);
      if (binding) next.set(neuronId, binding);
      else next.delete(neuronId);
      return next;
    });
  }, []);
  useEffect(() => {
    const restoreModes = () => {
      invalidateViewportRuntime();
      setModes(initialModes());
    };
    window.addEventListener("popstate", restoreModes);
    return () => window.removeEventListener("popstate", restoreModes);
  }, [invalidateViewportRuntime]);
  const updateRecord = (index: number, neuronId: number) => {
    if (comparisonIds.some((id, candidateIndex) => id === neuronId && candidateIndex !== index)) return;
    const next = comparisonIds.map((id, candidateIndex) => candidateIndex === index ? neuronId : id);
    invalidateViewportRuntime();
    const record = records.find((candidate) => candidate.neuronId === neuronId);
    if (record && !morphologyHasDiameter(record) && modes[index] === "radius") updateMode(index, "skeleton");
    onComparisonChange(next);
  };
  const removeRecord = (index: number) => {
    if (comparisonIds.length <= MORPHOLOGY_MATRIX_MIN_SELECTIONS) return;
    invalidateViewportRuntime();
    onComparisonChange(comparisonIds.filter((_, candidateIndex) => candidateIndex !== index));
    const nextModes = [...modes.filter((_, candidateIndex) => candidateIndex !== index), "skeleton" as MorphologyRenderMode]
      .slice(0, MORPHOLOGY_MATRIX_MAX_SELECTIONS);
    setModes(nextModes);
    replaceUrlValue("morphologyModes", nextModes.slice(0, comparisonIds.length - 1).join(","));
  };
  const addRecord = () => {
    if (comparisonIds.length >= MORPHOLOGY_MATRIX_MAX_SELECTIONS) return;
    const nextRecord = filteredCandidates.find((record) => !comparisonIds.includes(record.neuronId));
    if (nextRecord) {
      invalidateViewportRuntime();
      onComparisonChange([...comparisonIds, nextRecord.neuronId]);
    }
  };
  const exportReceipt = (format: "json" | "csv") => {
    if (!selectedAnalysisComplete || !selectedGeometryComplete || !selectedScaleComplete) return;
    const receipt = buildMorphologyComparisonReceipt(
      selectedRecords,
      Array.from(analysisById.values()),
      modes,
      undefined,
      {
        census: analysisState.status === "verified" ? {
          path: "/data/neuromorpho_release_8_6_124_analysis_v1/analysis-index.json",
          sha256: analysisState.sha256,
          recordCount: 142,
        } : null,
        supplementary: supplementaryAnalysisSha256 ? {
          path: "/data/supplementary_morphology_comparison_v1/analysis-delta.json",
          sha256: supplementaryAnalysisSha256,
          recordCount: 7,
        } : null,
        runtimeGeometryReceipts: selectedRecords.map((record) => ({
          neuronId: record.neuronId,
          sha256: verifiedGeometryReceipts.get(record.neuronId),
        })),
        sourceFrameDisclosureAuthority: MORPHOLOGY_SOURCE_FRAME_DISCLOSURE_AUTHORITY,
        sourceFrameDisclosures: selectedRecords.map(morphologySourceFrameDisclosureFor),
        runtimeScaleReceipts: selectedRecords.map((record) => runtimeScaleReceipts.get(record.neuronId)),
        runtimeViewportBindings: selectedRecords.map((record) => runtimeViewportBindings.get(record.neuronId)),
        runtimeAvailability: {
          censusIndexStatus,
          supplementaryAdapterStatus,
          indexedCensusRecordCount,
          indexedSupplementaryRecordCount,
        },
      },
    );
    if (format === "json") downloadText("morphology-comparison-receipt.json", "application/json", `${JSON.stringify(receipt, null, 2)}\n`);
    else downloadText("morphology-comparison-metrics.csv", "text/csv", morphologyComparisonReceiptCsv(receipt));
  };

  return (
    <section className="morphology-compare" aria-labelledby="morphology-compare-heading">
      <header className="morphology-compare-heading">
        <div>
          <p className="panel-kicker">2–4 REAL RECONSTRUCTIONS · INDEPENDENT SOURCE FRAMES · CO-DISPLAY ONLY</p>
          <h3 id="morphology-compare-heading">Source-object 3D comparator</h3>
          <p>Inspect exact deposited topology and source-authorized radius derivatives side by side. Cameras auto-fit independently; visual scale, orientation and card proximity do not establish registration, physical size equivalence, identity, or connectivity.</p>
        </div>
        <div><button type="button" onClick={onOpenMatrix}>Back to census matrix</button><button type="button" onClick={() => exportReceipt("json")} disabled={!selectedAnalysisComplete || !selectedGeometryComplete || !selectedScaleComplete}>Export receipt JSON</button><button type="button" onClick={() => exportReceipt("csv")} disabled={!selectedAnalysisComplete || !selectedGeometryComplete || !selectedScaleComplete}>Export metrics CSV</button></div>
      </header>

      <div className="morphology-comparison-denominators" role="note">
        <div><b>149</b><span>declared release objects</span></div>
        <div><b>142</b><span>declared frozen census</span></div>
        <div><b>7</b><span>declared supplementary routes</span></div>
        <p>Declared membership is 142 + 7, never a 149-record census. Runtime index: {indexedCensusRecordCount} census + {indexedSupplementaryRecordCount} supplementary = {indexedSourceObjectCount} selectable. Census index: {censusIndexStatus}; supplementary adapter: {supplementaryAdapterStatus}.</p>
      </div>

      <div className="morphology-compare-filterbar">
        <label>Search comparator records<input value={candidateQuery} onChange={(event) => setCandidateQuery(event.target.value)} placeholder="ID, source label, archive or region" /></label>
        <label>Collection<select value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value as "all" | "census" | "supplementary")}><option value="all">{indexedCensusRecordCount} census + {indexedSupplementaryRecordCount} supplementary indexed</option><option value="census">Frozen census indexed · {indexedCensusRecordCount}</option><option value="supplementary">Supplementary routes indexed · {indexedSupplementaryRecordCount}</option></select></label>
        <p>{filteredCandidates.length} selectable records match · filters never relabel collection membership</p>
      </div>

      <div className="morphology-compare-selectors">
        {selectedRecords.map((record, index) => {
          const candidates = filteredCandidates.some((candidate) => candidate.neuronId === record.neuronId)
            ? filteredCandidates
            : [record, ...filteredCandidates];
          return <label key={`${index}-${record.neuronId}`}>Slot {String.fromCharCode(65 + index)} · {record.comparisonMembership.collection === "census" ? "census" : "supplementary"}<select value={record.neuronId} onChange={(event) => updateRecord(index, Number(event.target.value))}>{candidates.map((candidate) => <option key={candidate.neuronId} value={candidate.neuronId} disabled={comparisonIds.some((id, candidateIndex) => id === candidate.neuronId && candidateIndex !== index)}>{candidate.comparisonMembership.collection === "census" ? "CENSUS" : "SUPP"} · NMO {candidate.neuronId} · {candidate.normalizedMetadata.name}</option>)}</select></label>;
        })}
        <button type="button" onClick={addRecord} disabled={comparisonIds.length >= MORPHOLOGY_MATRIX_MAX_SELECTIONS || !filteredCandidates.some((record) => !comparisonIds.includes(record.neuronId))}>Add viewport</button>
      </div>

      <div className="morphology-compare-boundary" role="note">
        <strong>0 REGISTRATIONS · 0 SAME-CELL LINKS · 0 COMPLETE AXONS · 0 SAME-SPECIMEN INTERNAL MODELS · 0 COMMON-SCALE ADMISSIONS</strong>
        <span>Cross-paper acquisition and shrinkage are not harmonized. Metrics are descriptive per repository record, not population effect sizes.</span>
        <span>{selectedGeometryComplete ? "Every selected geometry passed runtime byte, checksum, identity, unit, source-frame, bounds, transform and zero-registration gates." : "Receipt export remains locked until every selected geometry passes the full source-frame authority gate."}</span>
        <span>{selectedScaleComplete ? "Every viewport has its own target-plane source-coordinate scale receipt; perspective varies with depth and apparent physical size is not comparable across cards." : "Receipt export remains locked until every selected viewport has its own current target-plane source-coordinate scale receipt; no shared scale is inferred."}</span>
      </div>

      <div className={`morphology-compare-grid count-${selectedRecords.length}`}>
        {selectedRecords.map((record, index) => <ComparisonCard
          key={record.neuronId}
          record={record}
          slot={index}
          mode={modes[index] ?? "skeleton"}
          analysis={analysisById.get(record.neuronId) ?? null}
          canRemove={selectedRecords.length > MORPHOLOGY_MATRIX_MIN_SELECTIONS}
          onModeChange={(mode) => updateMode(index, mode)}
          onRemove={() => removeRecord(index)}
          onGeometryVerificationChange={reportGeometryVerification}
          onScaleBarChange={reportScaleBar}
          onViewportBindingChange={reportViewportBinding}
        />)}
      </div>

      <MorphologyMicrodetailCoverage records={selectedRecords} />
      <SuperClemSynapseReference />

      {selectedAnalysisComplete ? (
        <>
          <section className="morphology-record-comparison-table" aria-labelledby="morphology-record-comparison-table-heading">
            <header><div><span>EXACT DESCRIPTIVE VALUES</span><h4 id="morphology-record-comparison-table-heading">Record-level phenotype matrix</h4></div><p>Analysis unit: one NeuroMorpho record · no inferential statistics</p></header>
            <div className="morphology-table-scroll" role="region" tabIndex={0} aria-label="Record-level morphology metric comparison">
              <table><thead><tr><th scope="col">Metric</th>{plotted.map(({ record }, index) => <th scope="col" key={record.neuronId}><i style={{ background: SLOT_COLORS[index] }} />{String.fromCharCode(65 + index)} · NMO {record.neuronId}</th>)}</tr></thead><tbody>{MORPHOLOGY_COMPARISON_METRICS.map((metric) => <tr key={metric.key}><th scope="row">{metric.label}</th>{plotted.map(({ record, analysis }) => <td key={record.neuronId}>{formatMetric(Number(analysis.metrics[metric.key as keyof typeof analysis.metrics]), metric.unit)}</td>)}</tr>)}</tbody></table>
            </div>
          </section>
          <ShollComparisonChart records={plotted} />
        </>
      ) : <section className="morphology-analysis-unavailable" aria-live="polite"><h3>Comparison analysis</h3><p>{analysisMessage}</p><p>No metric or Sholl value is substituted.</p></section>}

      <div className="morphology-analysis-boundaries">
        <article><strong>Observed inputs</strong><p>Checksum-verified standardized SWC coordinates, topology, source types, and radii only where the official record reports diameter.</p></article>
        <article><strong>Display derivatives</strong><p>Independent camera auto-fit, constant-width centreline strokes, and optional open six-sided tapered frusta. None is an observed membrane.</p></article>
        <article><strong>Still unavailable</strong><p>Atlas placement, same-cell molecular identity, complete axons, synapses, nuclei, organelles, receptor maps, connectivity, and canonical cell forms.</p></article>
      </div>
    </section>
  );
}
