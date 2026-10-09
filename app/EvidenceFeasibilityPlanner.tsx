"use client";

import { useMemo } from "react";
import { evidenceFeasibilityPlanner, publicDataCatalog } from "./atlas-types";
import {
  assessResearchQuestion,
  buildResearchFeasibilityReceipt,
  feasibilityReceiptFilename,
} from "./evidence-feasibility-planner.js";

type FeasibilityRoute = (typeof evidenceFeasibilityPlanner.routes)[number];

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export default function EvidenceFeasibilityPlanner({
  selectedAxisIds,
  onSelectedAxisIdsChange,
  onNotice,
}: {
  selectedAxisIds: string[];
  onSelectedAxisIdsChange: (axisIds: string[]) => void;
  onNotice: (notice: string) => void;
}) {
  const assessment = useMemo(
    () => assessResearchQuestion({ axisIds: selectedAxisIds, planner: evidenceFeasibilityPlanner }),
    [selectedAxisIds],
  );
  const selectedIds = new Set(assessment.selectedAxisIds);
  const sourceNames = new Map(publicDataCatalog.sources.map((source) => [source.id, source.title]));
  const toggleAxis = (axisId: string) => {
    if (selectedIds.has(axisId)) {
      onSelectedAxisIdsChange(assessment.selectedAxisIds.filter((candidate) => candidate !== axisId));
      return;
    }
    if (assessment.selectedAxisIds.length >= evidenceFeasibilityPlanner.selectedAxisLimit) {
      onNotice(`Select at most ${evidenceFeasibilityPlanner.selectedAxisLimit} evidence axes`);
      return;
    }
    onSelectedAxisIdsChange([...assessment.selectedAxisIds, axisId]);
  };
  const exportReceipt = () => {
    const receipt = buildResearchFeasibilityReceipt({
      axisIds: assessment.selectedAxisIds,
      planner: evidenceFeasibilityPlanner,
      catalog: publicDataCatalog,
      generatedAt: new Date().toISOString(),
    });
    downloadJson(receipt, feasibilityReceiptFilename(assessment.selectedAxisIds));
    onNotice("Research-feasibility receipt exported · planning metadata only; no source object acquired or registered");
  };

  return <section className="feasibility-planner" aria-labelledby="feasibility-planner-heading">
    <div className="feasibility-planner-heading">
      <div>
        <span>UPG-015 · PUBLIC-SOURCE FEASIBILITY PLANNER</span>
        <h4 id="feasibility-planner-heading">Can this research question be supported?</h4>
      </div>
      <span className="badge inferred">PLANNING ONLY · 0 REG</span>
    </div>
    <p>Select up to {evidenceFeasibilityPlanner.selectedAxisLimit} evidence axes. The planner identifies only declared package routes and explicitly reports when sources remain separate or no qualified route is catalogued.</p>
    <fieldset className="feasibility-axis-grid">
      <legend>Requested evidence axes ({assessment.selectedAxisIds.length}/{evidenceFeasibilityPlanner.selectedAxisLimit})</legend>
      {evidenceFeasibilityPlanner.axes.map((axis) => <label aria-label={axis.label} className="feasibility-axis" htmlFor={`feasibility-axis-${axis.id}`} key={axis.id}>
        <input id={`feasibility-axis-${axis.id}`} type="checkbox" checked={selectedIds.has(axis.id)} onChange={() => toggleAxis(axis.id)} />
        <span><strong>{axis.label}</strong><small>{axis.description}</small></span>
      </label>)}
    </fieldset>
    <div className={`feasibility-decision ${assessment.decisionKind}`} aria-live="polite">
      <strong>{prettify(assessment.decisionKind)}</strong>
      <p>{assessment.decision}</p>
    </div>
    {assessment.selectedAxes.length > 0 && <div className="feasibility-results">
      {assessment.routeAssessments.map(({ axis, routes }) => <section key={axis.id} className="feasibility-result-row">
        <strong>{axis.label}</strong>
          {routes.length === 0 ? <p><b>No qualified package route.</b> {evidenceFeasibilityPlanner.unqualifiedAxisDecision}</p> : <ul>{routes.map((route: FeasibilityRoute) => <li key={route.id}><b>{route.label}</b> · {prettify(route.readiness)} · {route.sourceIds.map((sourceId) => sourceNames.get(sourceId) ?? sourceId).join(" + ")}<br /><span>{route.boundary}</span></li>)}</ul>}
      </section>)}
      {assessment.directRoutes.length > 0 && <p className="feasibility-direct-route"><b>Single-route coverage:</b> {assessment.directRoutes.map((route: FeasibilityRoute) => route.label).join(" · ")}</p>}
    </div>}
    <div className="catalog-actions">
      <button type="button" onClick={exportReceipt}>Export feasibility receipt</button>
    </div>
    <p className="taxonomy-boundary">{evidenceFeasibilityPlanner.scientificBoundary}</p>
  </section>;
}
