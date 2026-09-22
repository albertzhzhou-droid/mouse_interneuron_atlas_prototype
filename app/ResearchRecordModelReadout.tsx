"use client";

import type { ResearchFocus, ResearchRecord } from "./ResearchExplorer";
import { useResearchActiveRecord } from "./ResearchActiveRecordProvider";

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function RecordReadout({ record }: { record: ResearchRecord }) {
  const modeling = record.presentation.modeling;

  return (
    <section
      className="research-record-model-readout"
      aria-label={`Visualization authority for ${record.focusId}`}
      data-focus-kind={record.focusKind}
      data-focus-id={record.focusId}
      data-modeling-route={modeling.route}
      data-cell-geometry-object-count={modeling.admittedCellGeometryObjectCount}
      data-internal-object-count={modeling.admittedInternalObjectCount}
      data-generated-fallback-primitive-count={modeling.generatedFallbackPrimitiveCount}
      data-registration-count={modeling.registrationCount}
      data-same-cell-join-count={modeling.sameCellJoinCount}
      data-switch-effect={modeling.switchEffect}
    >
      <header>
        <span>SELECTED RECORD · VISUALIZATION AUTHORITY ONLY</span>
        <strong>{readable(modeling.route)}</strong>
      </header>

      <dl className="research-record-model-authority-identity">
        <div><dt>Canonical focus ID</dt><dd>{record.focusId}</dd></div>
        <div><dt>Source namespace</dt><dd>{record.namespace}</dd></div>
        <div><dt>Rendering route</dt><dd>{readable(modeling.route)}</dd></div>
      </dl>

      <div className="research-record-model-authority-counts" aria-label="Admitted visualization object counts">
        <article><strong>{modeling.admittedCellGeometryObjectCount}</strong><span>cell geometry</span></article>
        <article><strong>{modeling.admittedInternalObjectCount}</strong><span>internal objects</span></article>
        <article><strong>{modeling.generatedFallbackPrimitiveCount}</strong><span>fallback primitives</span></article>
        <article><strong>{modeling.registrationCount}</strong><span>registrations</span></article>
        <article><strong>{modeling.sameCellJoinCount}</strong><span>same-cell joins</span></article>
      </div>

      <p className="research-record-model-switch-effect">
        <strong>Switch effect</strong>
        {readable(modeling.switchEffect)}
      </p>
    </section>
  );
}

export default function ResearchRecordModelReadout({ focus }: { focus: ResearchFocus | null }) {
  const { activeRecord } = useResearchActiveRecord();

  if (!focus) return null;
  if (activeRecord.status === "ready" && activeRecord.record) {
    return <RecordReadout record={activeRecord.record} />;
  }
  if (activeRecord.status === "unavailable") {
    return <section className="research-record-model-readout unavailable" role="status" data-focus-kind={focus.focusKind} data-focus-id={focus.focusId}><strong>Exact source-record model unavailable</strong><span>{activeRecord.error} No prior record or geometry was substituted.</span></section>;
  }
  return <section className="research-record-model-readout loading" role="status" data-focus-kind={focus.focusKind} data-focus-id={focus.focusId}><strong>Verifying exact source-record model…</strong><span>Prior record content and cell geometry are not retained during the switch.</span></section>;
}
