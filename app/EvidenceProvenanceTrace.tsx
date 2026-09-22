"use client";

import { useMemo } from "react";
import {
  evidenceFeasibilityPlanner,
  evidenceProvenanceTrace,
  publicDataCatalog,
  researchMvpRelease,
} from "./atlas-types";
import {
  buildProvenanceTraceReceipt,
  buildPublicSourceRouteTrace,
  buildResearchEvidenceTrace,
  provenanceTraceReceiptFilename,
} from "./evidence-provenance-trace.js";

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

function TraceNode({ kind, title, detail }: { kind: string; title: string; detail: string }) {
  return <li className={`provenance-node ${kind}`}>
    <span>{kind.replaceAll("_", " ")}</span>
    <strong>{title}</strong>
    <small>{detail}</small>
  </li>;
}

export default function EvidenceProvenanceTrace({
  entityId,
  plannerAxisIds,
  onNotice,
}: {
  entityId: string | null;
  plannerAxisIds: string[];
  onNotice: (notice: string) => void;
}) {
  const researchTrace = useMemo(
    () => buildResearchEvidenceTrace({ entityId, researchRelease: researchMvpRelease }),
    [entityId],
  );
  const publicTrace = useMemo(
    () => buildPublicSourceRouteTrace({ axisIds: plannerAxisIds, planner: evidenceFeasibilityPlanner, catalog: publicDataCatalog }),
    [plannerAxisIds],
  );
  const exportReceipt = () => {
    const receipt = buildProvenanceTraceReceipt({
      entityId: researchTrace.entity?.id ?? null,
      axisIds: plannerAxisIds,
      traceContract: evidenceProvenanceTrace,
      researchRelease: researchMvpRelease,
      planner: evidenceFeasibilityPlanner,
      catalog: publicDataCatalog,
      generatedAt: new Date().toISOString(),
    });
    downloadJson(receipt, provenanceTraceReceiptFilename(receipt.lanes.researchEvidence.entityId));
    onNotice("Provenance-trace receipt exported · declared references only; no source object acquired or registered");
  };

  return <section className="provenance-trace" aria-labelledby="provenance-trace-heading">
    <div className="provenance-trace-heading">
      <div>
        <span>UPG-016 · TWO-LANE PROVENANCE TRACE</span>
        <h4 id="provenance-trace-heading">Trace evidence without inventing a join</h4>
      </div>
      <span className="badge inferred">LOCAL ONLY · 0 REG</span>
    </div>
    <p>Built from frozen release references. The evidence entity selected in the main atlas drives the first lane; axes selected in the feasibility planner drive the second.</p>
    <div className="provenance-lanes">
      <section className="provenance-lane research" aria-labelledby="research-trace-heading">
        <div>
          <span>RESEARCH MVP</span>
          <h5 id="research-trace-heading">Research evidence chain</h5>
        </div>
        {researchTrace.entity ? <ol className="provenance-node-list">
          <TraceNode kind="entity" title={researchTrace.entity.record.id} detail="Selected synthetic evidence entity; not a registered cell" />
          {researchTrace.claims.map((claim) => <TraceNode key={claim.id} kind="claim" title={claim.record.id} detail={claim.record.statement} />)}
          {researchTrace.conditions.map((condition) => <TraceNode key={condition.id} kind="condition" title={condition.record.id} detail={`${condition.record.species} · ${condition.record.lifeStage} · ${condition.record.injuryType} · ${condition.record.endpoint}`} />)}
          {researchTrace.statements.map((statement) => <TraceNode key={statement.id} kind="statement" title={`${statement.record.id} · ${statement.record.kind}`} detail={statement.record.text} />)}
          {researchTrace.sources.map((source) => <TraceNode key={source.id} kind="source" title={source.record.id} detail={`${source.record.citation} · DOI ${source.record.doi}`} />)}
        </ol> : <p className="catalog-empty">No selected evidence entity is available for a research trace.</p>}
      </section>
      <section className="provenance-lane public" aria-labelledby="public-trace-heading">
        <div>
          <span>PUBLIC-SOURCE PLANNING</span>
          <h5 id="public-trace-heading">Declared route chain</h5>
        </div>
        {publicTrace.axes.length ? <ol className="provenance-node-list">
          {publicTrace.axes.map((axis) => <TraceNode key={axis.id} kind="axis" title={axis.record.label} detail={axis.record.description} />)}
          {publicTrace.routes.map((route) => <TraceNode key={route.id} kind="route" title={route.record.label} detail={route.record.boundary} />)}
          {publicTrace.sources.map((source) => <TraceNode key={source.id} kind="public_source" title={source.record.id} detail={`${source.record.title} · ${source.record.content.coordinateAuthority}`} />)}
          {publicTrace.unqualifiedAxisIds.length > 0 && <li className="provenance-unqualified">No qualified package route: {publicTrace.unqualifiedAxisIds.join(" · ")}. This is a package-coverage gap, not a biological-absence claim.</li>}
        </ol> : <p className="catalog-empty">Select one or more feasibility-planner axes to expose their declared public-source routes.</p>}
      </section>
    </div>
    <div className="provenance-no-join" role="note">
      <strong>NO CROSS-LANE EDGE</strong>
      <p>{evidenceProvenanceTrace.crossLanePolicy}</p>
    </div>
    <div className="catalog-actions">
      <button type="button" onClick={exportReceipt}>Export provenance trace receipt</button>
    </div>
    <p className="taxonomy-boundary">{evidenceProvenanceTrace.scientificBoundary}</p>
  </section>;
}
