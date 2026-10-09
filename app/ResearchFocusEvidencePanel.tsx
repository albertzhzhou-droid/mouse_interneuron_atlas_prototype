"use client";

import type { ReactNode } from "react";
import type { AtlasEntity } from "./atlas-types";
import type { ResearchFocus, ResearchRecord } from "./ResearchExplorer";
import { ResearchEvidenceCard } from "./ResearchEvidencePanels";
import { useResearchActiveRecord } from "./ResearchActiveRecordProvider";
import ResearchSelectionDeltaReceipt from "./ResearchSelectionDeltaReceipt";
import ResearchRecordSourceScope from "./ResearchRecordSourceScope";
import { researchEvidenceDisplayLabel } from "./research-morphology-rendering-policy.js";
import { selectResearchEvidencePreviewRows } from "./research-explorer-index.js";
import {
  rowsForPresentationIndices,
  selectMolecularCompletenessSlots,
} from "./research-record-presentation.js";

const FOCUS_KIND_LABELS: Record<ResearchFocus["focusKind"], string> = {
  sci_entity: "SCI evidence entity",
  molecular_profile: "Source profile",
  morphology_record: "Morphology record",
  anatomy_label: "Anatomy label",
  sci_population: "SCI time-course population",
  source_lane: "Coverage source lane",
};

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortHash(value: string) {
  return value.length > 28 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value;
}

function UnavailableResearchFocus({ focus, message }: { focus: ResearchFocus | null; message: string }) {
  return (
    <section
      className="research-focus-evidence research-focus-evidence-unavailable"
      role="status"
      data-focus-kind={focus?.focusKind ?? "none"}
      data-focus-id={focus?.focusId ?? "none"}
      data-record-status="unavailable"
    >
      <p className="panel-kicker">CURRENT RESEARCH RECORD</p>
      <h2>{focus ? "Exact record unavailable" : "No research record selected"}</h2>
      {focus && <code>{focus.focusKind}:{focus.focusId}</code>}
      <p>{message}</p>
    </section>
  );
}

function VerifiedResearchFocusShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ResearchSelectionDeltaReceipt />
      {children}
    </>
  );
}

function VerifiedResearchRecord({ record }: { record: ResearchRecord }) {
  const partition = record.presentation.evidencePartition;
  const identityRows = rowsForPresentationIndices(record, partition.identityEvidenceIndices) as ResearchRecord["evidence"];
  const distinctiveRows = rowsForPresentationIndices(record, partition.recordSpecificEvidenceIndices) as ResearchRecord["evidence"];
  const sharedEvidenceRows = rowsForPresentationIndices(record, partition.sharedEvidenceIndices) as ResearchRecord["evidence"];
  const recordRows = [...identityRows, ...distinctiveRows];
  const recordRowKeys = new Set(recordRows.map((row) => `${row.label}\u0000${row.locator}`));
  const preferredRows = (selectResearchEvidencePreviewRows(record, 8) as ResearchRecord["evidence"])
    .filter((row) => recordRowKeys.has(`${row.label}\u0000${row.locator}`));
  const preferredKeys = new Set(preferredRows.map((row) => `${row.label}\u0000${row.locator}`));
  const previewRows = [...preferredRows, ...recordRows.filter((row) => !preferredKeys.has(`${row.label}\u0000${row.locator}`))].slice(0, 6);
  const previewKeys = new Set(previewRows.map((row) => `${row.label}\u0000${row.locator}`));
  const additionalRows = recordRows.filter((row) => !previewKeys.has(`${row.label}\u0000${row.locator}`));
  const recordSpecificGaps = record.gaps.filter((gap) => gap.scope === "record_specific");
  const sharedGaps = record.gaps.filter((gap) => gap.scope !== "record_specific");
  const morphologyHash = record.morphologyMembership?.geometrySha256
    ?? record.provenance.objectHashes.find((item) => /geometry/i.test(item.label))?.sha256
    ?? null;
  const molecularCompleteness = record.focusKind === "molecular_profile"
    ? selectMolecularCompletenessSlots(record)
    : [];
  const availableMolecularSlots = molecularCompleteness.filter((slot) => slot.status === "available").length;

  return (
    <section
      className="research-focus-evidence"
      aria-labelledby="research-focus-evidence-heading"
      data-focus-kind={record.focusKind}
      data-focus-id={record.focusId}
      data-record-status="verified"
      data-cell-geometry={record.focusKind === "morphology_record" ? record.coordinate.geometryStatus : "none"}
    >
      <header>
        <div>
          <p className="panel-kicker">CURRENT RESEARCH RECORD · SOURCE-LOCKED</p>
          <h2 id="research-focus-evidence-heading">{record.title}</h2>
          <p>{record.subtitle}</p>
        </div>
        <span>{FOCUS_KIND_LABELS[record.focusKind]}</span>
      </header>

      <ResearchRecordSourceScope key={record.key} record={record} />

      <dl className="research-focus-evidence-identity">
        <div><dt>Canonical focus</dt><dd>{record.focusId}</dd></div>
        <div><dt>Source namespace</dt><dd>{record.namespace}</dd></div>
      </dl>

      <div className="research-focus-evidence-metrics" aria-label="Current record evidence status">
        <div><strong>{recordRows.length}</strong><span>record-specific fields</span></div>
        <div><strong>{sharedEvidenceRows.length}</strong><span>shared context fields</span></div>
        <div><strong>{record.presentation.modeling.admittedCellGeometryObjectCount}</strong><span>exact cell-geometry objects</span></div>
      </div>

      {record.focusKind === "molecular_profile" && (
        <p className="research-focus-geometry-boundary" role="status">
          <strong>0 admitted cell-geometry primitives</strong>
          Switching replaces the source-record evidence model and clears prior cell geometry. It does not create a representative cell or internal object.
        </p>
      )}

      {record.focusKind === "molecular_profile" ? (
        <section className="research-focus-completeness" aria-labelledby="research-focus-completeness-heading">
          <div>
            <h3 id="research-focus-completeness-heading">Fixed-slot record completeness</h3>
            <span>{availableMolecularSlots}/8 slots have exact indexed rows</span>
          </div>
          <p>Every molecular record uses the same eight slots. Missing fields remain visible and never inherit content from another profile.</p>
          <div className="research-focus-completeness-slots">
            {molecularCompleteness.map((slot) => (
              <article
                key={slot.slotId}
                className={slot.status}
                data-completeness-slot={slot.slotId}
                data-completeness-status={slot.status}
              >
                <strong>{slot.label}</strong>
                <span>{slot.status === "available" ? "Exact row available" : "Explicitly missing"}</span>
                <small>
                  {slot.status === "available"
                    ? `${slot.rowLabel} · ${readable(slot.authority)} · ${slot.locator}`
                    : `${readable(slot.reasonCode)} · ${slot.sourceLocator}`}
                </small>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="research-focus-model-readiness" aria-labelledby="research-focus-model-readiness-heading">
          <div>
            <h3 id="research-focus-model-readiness-heading">Exact modeling readiness</h3>
            <span>{readable(record.presentation.modeling.route)}</span>
          </div>
          <div className="research-focus-model-readiness-axes">
            {record.presentation.modeling.axes.map((axis) => (
              <article key={axis.axisId} className={axis.status.startsWith("available") ? "available" : "unavailable"}>
                <strong>{readable(axis.axisId)}</strong>
                <span>{readable(axis.status)}</span>
                <small>{axis.detail}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      {record.focusKind === "morphology_record" && (
        <div className="research-focus-morphology-receipt">
          <span>Exact source-local visual target</span>
          <strong>{record.coordinate.geometryStatus}</strong>
          <p>{record.coordinate.frame} · {readable(record.coordinate.measurementUse)}</p>
          {morphologyHash && <code title={morphologyHash}>Geometry {shortHash(morphologyHash)}</code>}
        </div>
      )}

      {!!previewRows.length && (
        <section className="research-focus-evidence-preview" aria-labelledby="research-focus-evidence-preview-heading">
          <h3 id="research-focus-evidence-preview-heading">Record-specific receipt</h3>
          <dl>
            {previewRows.map((row) => (
              <div key={`${row.label}-${row.locator}`}>
                <dt>{researchEvidenceDisplayLabel(record, row)}</dt>
                <dd>{row.value}<small>{readable(row.authority)} · {row.locator}</small></dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {!!additionalRows.length && (
        <details className="research-focus-evidence-details">
          <summary>{additionalRows.length} additional record-specific fields</summary>
          <dl>
            {additionalRows.map((row, index) => (
              <div key={`${row.label}-${row.locator}-${index}`}>
                <dt>{researchEvidenceDisplayLabel(record, row)}</dt>
                <dd>{row.value}<small>{readable(row.authority)} · {row.locator}</small></dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {!!sharedEvidenceRows.length && (
        <details className="research-focus-evidence-details shared-source-context">
          <summary>{sharedEvidenceRows.length} exact shared source-context fields · shown once</summary>
          <p>These rows are exact matches across all {record.presentation.sourceSiblingCount} records in this source namespace. They are retained here once, not repeated as record-specific findings.</p>
          <dl>
            {sharedEvidenceRows.map((row, index) => (
              <div key={`${row.label}-${row.locator}-${index}`}>
                <dt>{researchEvidenceDisplayLabel(record, row)}</dt>
                <dd>{row.value}<small>{readable(row.authority)} · {row.locator}</small></dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {!!recordSpecificGaps.length && (
        <details className="research-focus-gap-details">
          <summary>{recordSpecificGaps.length} record-specific gaps</summary>
          <ul>{recordSpecificGaps.map((gap) => <li key={`${gap.axisId}-${gap.reasonCode}`}><strong>{gap.label}</strong><span>{readable(gap.status)} · {gap.detail}</span></li>)}</ul>
        </details>
      )}

      {!!sharedGaps.length && (
        <details className="research-focus-shared-limits">
          <summary>{sharedGaps.length} shared dataset/project limits · consolidated</summary>
          <p>These limitations are declared once for this active record. Missing evidence is not a biological zero and permits no inferred geometry or relationship.</p>
          <ul>{sharedGaps.map((gap) => <li key={`${gap.axisId}-${gap.reasonCode}`}>{gap.label} · {readable(gap.status)}</li>)}</ul>
        </details>
      )}

      <footer>
        <span>{record.provenance.accessions[0] ?? "No accession retained"}</span>
        <strong>0 REG · no cross-source identity</strong>
      </footer>
    </section>
  );
}

export default function ResearchFocusEvidencePanel({
  focus,
  sciEntity,
}: {
  focus: ResearchFocus | null;
  sciEntity: AtlasEntity | null;
}) {
  const { activeRecord } = useResearchActiveRecord();

  if (!focus) {
    return <UnavailableResearchFocus focus={null} message="Select one exact source record. The app will not substitute a previous or generic record." />;
  }
  if (focus.focusKind === "sci_entity") {
    return activeRecord.status === "ready"
      && activeRecord.record?.focusKind === "sci_entity"
      && activeRecord.record.focusId === focus.focusId
      && sciEntity?.id === focus.focusId
      ? <VerifiedResearchFocusShell><ResearchRecordSourceScope key={activeRecord.record.key} record={activeRecord.record} /><ResearchEvidenceCard entity={sciEntity} /></VerifiedResearchFocusShell>
      : activeRecord.status === "unavailable"
        ? <UnavailableResearchFocus focus={focus} message={`${activeRecord.error} No substitute was selected.`} />
        : (
          <section className="research-focus-evidence research-focus-evidence-loading" role="status" data-focus-kind={focus.focusKind} data-focus-id={focus.focusId} data-record-status="verifying">
            <p className="panel-kicker">CURRENT RESEARCH RECORD</p>
            <h2>Verifying exact SCI evidence entity</h2>
            <code>{focus.focusKind}:{focus.focusId}</code>
            <p>No previous entity or generic evidence card is shown.</p>
          </section>
        );
  }
  if (activeRecord.status === "ready" && activeRecord.record) {
    return <VerifiedResearchFocusShell><VerifiedResearchRecord record={activeRecord.record} /></VerifiedResearchFocusShell>;
  }
  if (activeRecord.status === "unavailable") {
    return <UnavailableResearchFocus focus={focus} message={`${activeRecord.error} No record was substituted.`} />;
  }
  return (
    <section
      className="research-focus-evidence research-focus-evidence-loading"
      role="status"
      data-focus-kind={focus.focusKind}
      data-focus-id={focus.focusId}
      data-record-status="verifying"
    >
      <p className="panel-kicker">CURRENT RESEARCH RECORD</p>
      <h2>Verifying exact source record</h2>
      <code>{focus.focusKind}:{focus.focusId}</code>
      <p>The checksum-pinned evidence index is loading. No previous record or generic cell is shown.</p>
    </section>
  );
}
