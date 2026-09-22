"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type MorphologyCensusRecord,
  MORPHOLOGY_TYPE_CSS_COLORS,
  morphologyClassification,
  morphologyHasAxon,
  morphologyHasDiameter,
  useVerifiedMorphologyGeometry,
} from "./morphology-census-data";
import {
  MORPHOLOGY_PROJECTION_PLANES,
  fitProjectionToViewport,
  projectPointToViewport,
  projectSourceLocalMorphology,
} from "./morphology-projection.js";
import {
  MORPHOLOGY_MATRIX_MAX_SELECTIONS,
  MORPHOLOGY_MATRIX_MIN_SELECTIONS,
} from "./morphology-matrix-state.js";

type ProjectionPlane = "xy" | "xz" | "yz";
type MatrixFilter = "all" | string;
const PAGE_SIZE = 12;

function searchableText(record: MorphologyCensusRecord) {
  return [
    record.neuronId,
    record.normalizedMetadata.name,
    record.normalizedMetadata.archive,
    ...record.normalizedMetadata.cellType,
    ...record.normalizedMetadata.brainRegion,
    ...record.sourcePaper.dois,
    ...record.sourcePaper.pmids,
  ].join(" ").toLowerCase();
}

function formatExtent(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function ProjectionThumbnail({ record, plane }: { record: MorphologyCensusRecord; plane: ProjectionPlane }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useVerifiedMorphologyGeometry(record);
  const [extent, setExtent] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.status !== "verified") return;
    const projection = projectSourceLocalMorphology(state.geometry, plane);
    setExtent({ width: projection.bounds.widthMicrometre, height: projection.bounds.heightMicrometre });
    let frame = 0;
    const draw = () => {
      const width = Math.max(180, canvas.clientWidth);
      const height = Math.max(150, canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#0e1715";
      context.fillRect(0, 0, width, height);
      const fit = fitProjectionToViewport(projection, width, height, 13);
      for (const sourceType of projection.sourceTypes) {
        context.beginPath();
        for (const segment of projection.segments) {
          if (segment.sourceType !== sourceType) continue;
          const start = projectPointToViewport({ x: segment.x1, y: segment.y1 }, fit);
          const end = projectPointToViewport({ x: segment.x2, y: segment.y2 }, fit);
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
        }
        context.strokeStyle = MORPHOLOGY_TYPE_CSS_COLORS[sourceType] ?? "#687a75";
        context.lineWidth = sourceType === 2 ? 1.25 : 0.9;
        context.globalAlpha = sourceType === 1 ? 1 : 0.86;
        context.stroke();
      }
      context.globalAlpha = 1;
    };
    draw();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    });
    observer.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [plane, state]);

  return (
    <div className="morphology-projection-frame">
      <canvas ref={canvasRef} aria-label={`NeuroMorpho ${record.neuronId} exact source-local ${plane.toUpperCase()} orthographic SWC projection. Fit independently; apparent size is not comparable.`} />
      {state.status !== "verified" && <p role={state.status === "unavailable" ? "alert" : "status"}>{state.message}</p>}
      <span>{extent ? `${formatExtent(extent.width)} × ${formatExtent(extent.height)} µm` : "Extent pending"} · FIT PER RECORD</span>
    </div>
  );
}

function MatrixCard({
  record,
  plane,
  selected,
  canRemove,
  canAdd,
  onToggle,
  onOpen,
}: {
  record: MorphologyCensusRecord;
  plane: ProjectionPlane;
  selected: boolean;
  canRemove: boolean;
  canAdd: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <article className={`morphology-matrix-card ${selected ? "selected" : ""}`}>
      <header>
        <span>NMO {record.neuronId}</span>
        <div><i className={`morphology-availability ${record.geometry.available ? "available" : "quarantined"}`} aria-hidden="true" />{record.normalizedMetadata.dimensionality}</div>
      </header>
      <ProjectionThumbnail record={record} plane={plane} />
      <div className="morphology-matrix-card-copy">
        <h4>{record.normalizedMetadata.name}</h4>
        <p>{record.normalizedMetadata.cellType.join(" · ") || "Source class not reported"}</p>
        <dl>
          <div><dt>Source class</dt><dd>{morphologyClassification(record)}</dd></div>
          <div><dt>Axon field</dt><dd>{morphologyHasAxon(record) ? "present · moderate only" : "not reconstructed"}</dd></div>
          <div><dt>Radius input</dt><dd>{morphologyHasDiameter(record) ? "source-authorized" : "No Diameter · disabled"}</dd></div>
          <div><dt>Registration</dt><dd>0 · source-local</dd></div>
        </dl>
      </div>
      <div className="morphology-matrix-card-actions">
        <button type="button" onClick={onToggle} disabled={selected ? !canRemove : !canAdd}>{selected ? "Remove from comparison" : "Add to comparison"}</button>
        <button type="button" onClick={onOpen}>Open 3D dossier</button>
      </div>
    </article>
  );
}

export default function MorphologyMatrixPanel({
  records,
  comparisonIds,
  onComparisonChange,
  onOpenIndividual,
  onOpenComparison,
}: {
  records: MorphologyCensusRecord[];
  comparisonIds: number[];
  onComparisonChange: (ids: number[]) => void;
  onOpenIndividual: (neuronId: number) => void;
  onOpenComparison: () => void;
}) {
  const [query, setQuery] = useState("");
  const [plane, setPlane] = useState<ProjectionPlane>("xy");
  const [classFilter, setClassFilter] = useState<MatrixFilter>("all");
  const [axonFilter, setAxonFilter] = useState<MatrixFilter>("all");
  const [diameterFilter, setDiameterFilter] = useState<MatrixFilter>("all");
  const [page, setPage] = useState(0);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => records.filter((record) => {
    if (normalizedQuery && !searchableText(record).includes(normalizedQuery)) return false;
    if (classFilter !== "all" && morphologyClassification(record) !== classFilter) return false;
    if (axonFilter === "present" && !morphologyHasAxon(record)) return false;
    if (axonFilter === "absent" && morphologyHasAxon(record)) return false;
    if (diameterFilter === "available" && !morphologyHasDiameter(record)) return false;
    if (diameterFilter === "unavailable" && morphologyHasDiameter(record)) return false;
    return true;
  }), [axonFilter, classFilter, diameterFilter, normalizedQuery, records]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRecords = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const selectedRecords = comparisonIds.map((id) => records.find((record) => record.neuronId === id)).filter((record): record is MorphologyCensusRecord => Boolean(record));

  useEffect(() => {
    queueMicrotask(() => setPage(0));
  }, [axonFilter, classFilter, diameterFilter, normalizedQuery]);

  const toggle = (record: MorphologyCensusRecord) => {
    if (comparisonIds.includes(record.neuronId)) {
      if (comparisonIds.length <= MORPHOLOGY_MATRIX_MIN_SELECTIONS) return;
      onComparisonChange(comparisonIds.filter((id) => id !== record.neuronId));
    } else if (comparisonIds.length < MORPHOLOGY_MATRIX_MAX_SELECTIONS) {
      onComparisonChange([...comparisonIds, record.neuronId]);
    }
  };

  return (
    <section className="morphology-matrix" aria-labelledby="morphology-matrix-heading">
      <header className="morphology-matrix-heading">
        <div>
          <p className="panel-kicker">142 CHECKSUM-PINNED SOURCE OBJECTS · OBSERVED CENTERLINES ONLY</p>
          <h3 id="morphology-matrix-heading">Source-local morphology matrix</h3>
          <p>Review real deposited reconstructions as paginated orthographic projections. Every thumbnail uses exact SWC segment coordinates and is independently fitted; card size and proximity have no biological meaning.</p>
        </div>
        <button type="button" onClick={onOpenComparison}>Compare selected · {comparisonIds.length}</button>
      </header>

      <div className="morphology-comparison-tray" aria-label="Selected morphology comparison records">
        <span>COMPARISON BASKET · {comparisonIds.length}/{MORPHOLOGY_MATRIX_MAX_SELECTIONS}</span>
        <div>{selectedRecords.map((record) => <button key={record.neuronId} type="button" onClick={() => toggle(record)} disabled={comparisonIds.length <= MORPHOLOGY_MATRIX_MIN_SELECTIONS} aria-label={`Remove NeuroMorpho ${record.neuronId} from comparison`}>NMO {record.neuronId} ×</button>)}</div>
        <p>Two to four distinct repository records · co-display only · zero atlas registrations · no type or same-cell identity.</p>
      </div>

      <div className="morphology-matrix-controls">
        <label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, source label, DOI…" /></label>
        <label>Projection<select value={plane} onChange={(event) => setPlane(event.target.value as ProjectionPlane)}>{MORPHOLOGY_PROJECTION_PLANES.map((option) => <option key={option} value={option}>{option.toUpperCase()} source axes</option>)}</select></label>
        <label>Source class<select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="all">All classes</option><option value="excitatory">Excitatory</option><option value="inhibitory">Inhibitory</option><option value="unclassified">Unclassified</option></select></label>
        <label>Axon field<select value={axonFilter} onChange={(event) => setAxonFilter(event.target.value)}><option value="all">With or without axon</option><option value="present">Axon field present</option><option value="absent">No reconstructed axon</option></select></label>
        <label>Diameter authority<select value={diameterFilter} onChange={(event) => setDiameterFilter(event.target.value)}><option value="all">Available and unavailable</option><option value="available">Radius-authorized</option><option value="unavailable">No Diameter</option></select></label>
      </div>

      <div className="morphology-matrix-status" aria-live="polite">
        <span>{filtered.length} of {records.length} records · page {safePage + 1} of {pageCount}</span>
        <strong>{plane.toUpperCase()} exact-coordinate projection · FIT PER RECORD · apparent size not comparable</strong>
      </div>
      <div className="morphology-matrix-grid">
        {pageRecords.map((record) => <MatrixCard
          key={record.neuronId}
          record={record}
          plane={plane}
          selected={comparisonIds.includes(record.neuronId)}
          canRemove={comparisonIds.length > MORPHOLOGY_MATRIX_MIN_SELECTIONS}
          canAdd={comparisonIds.length < MORPHOLOGY_MATRIX_MAX_SELECTIONS}
          onToggle={() => toggle(record)}
          onOpen={() => onOpenIndividual(record.neuronId)}
        />)}
        {pageRecords.length === 0 && <p className="morphology-matrix-empty">No source reconstruction matches the active filters.</p>}
      </div>
      <nav className="morphology-matrix-pagination" aria-label="Morphology matrix pages">
        <button type="button" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>Previous 12</button>
        <span>Records {filtered.length ? safePage * PAGE_SIZE + 1 : 0}–{Math.min(filtered.length, safePage * PAGE_SIZE + PAGE_SIZE)} of {filtered.length}</span>
        <button type="button" onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))} disabled={safePage >= pageCount - 1}>Next 12</button>
      </nav>
      <div className="morphology-matrix-boundary" role="note">
        <strong>Scientific boundary</strong>
        <p>These are repository reconstructions from five papers and two archives, not independent-animal observations or a biological census. No matrix card is linked to a Russ, Sathyamurthy, Hayashi, Häring, Matson, SCI, or atlas entity. Internal structures remain unavailable for the same specimens.</p>
      </div>
    </section>
  );
}
