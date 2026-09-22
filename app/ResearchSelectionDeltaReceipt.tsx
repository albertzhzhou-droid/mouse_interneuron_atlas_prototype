"use client";

import { useResearchActiveRecord } from "./ResearchActiveRecordProvider";

type SelectionIdentity = {
  key: string;
  focusKind: string;
  focusId: string;
  namespace: string;
};

type SlotReceipt = {
  slotId: string;
  label: string;
  status: "available" | "missing";
  rowLabel: string | null;
  value: string | null;
  authority: string;
  sourceLocator: string;
  reasonCode: string | null;
  detail: string | null;
};

type SlotDelta = {
  slotId: string;
  label: string;
  changed: boolean;
  statusChanged: boolean;
  changedFields: readonly string[];
  previous: SlotReceipt;
  current: SlotReceipt;
};

type RecordScopedEvidenceReceipt = {
  evidenceIndex: number;
  label: string;
  value: string;
  authority: string;
  sourceLocator: string;
};

type RecordScopedEvidenceDelta = {
  label: string;
  occurrence: number;
  changed: boolean;
  changedFields: readonly string[];
  previous: RecordScopedEvidenceReceipt | null;
  current: RecordScopedEvidenceReceipt | null;
};

type SelectionDelta = {
  contractId: string;
  previous: SelectionIdentity;
  current: SelectionIdentity;
  namespace: { previous: string; current: string; changed: boolean };
  fixedSlots: {
    status: "compared" | "not_applicable";
    reasonCode: string | null;
    changedSlotCount: number;
    unchangedSlotCount: number;
    changedSlots: readonly SlotDelta[];
    unchangedSlots: readonly SlotDelta[];
  };
  recordScopedEvidence: {
    status: "compared_morphology_records" | "not_applicable";
    reasonCode: string | null;
    comparedRowCount: number;
    changedRowCount: number;
    unchangedRowCount: number;
    changedRows: readonly RecordScopedEvidenceDelta[];
  };
  visualizationAuthority: {
    counts: ReadonlyArray<{
      id: string;
      label: string;
      previousCount: number;
      currentCount: number;
      difference: number;
      changed: boolean;
      previousAuthority: string | null;
      currentAuthority: string | null;
      previousSourceLocator: string | null;
      currentSourceLocator: string | null;
    }>;
    changedCount: number;
  };
  sharedContext: {
    status: "compared_same_namespace" | "not_compared_different_namespace";
    reasonCode: string | null;
    unchangedRowCount: number;
    unchangedRows: ReadonlyArray<{
      label: string;
      value: string;
      authority: string;
      sourceLocator: string;
    }>;
  };
  disclaimer: string;
};

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function differenceLabel(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function SlotReceiptSide({ heading, slot }: { heading: string; slot: SlotReceipt }) {
  return (
    <div className={`research-selection-delta-side ${slot.status}`}>
      <span>{heading} · {slot.status === "available" ? "exact row available" : "explicitly missing"}</span>
      <strong>{slot.status === "available" ? slot.rowLabel : readable(slot.reasonCode ?? "missing")}</strong>
      {slot.value && <p>{slot.value}</p>}
      {slot.detail && slot.status === "missing" && slot.detail !== slot.value && <p>{slot.detail}</p>}
      <small>{readable(slot.authority)}</small>
      <code>{slot.sourceLocator}</code>
    </div>
  );
}

function RecordScopedEvidenceSide({
  heading,
  row,
}: {
  heading: string;
  row: RecordScopedEvidenceReceipt | null;
}) {
  return (
    <div className={`research-selection-delta-side ${row ? "available" : "missing"}`}>
      <span>{heading} · {row ? "exact indexed row" : "row not present in this record"}</span>
      <strong>{row?.label ?? "No corresponding record-scoped row"}</strong>
      {row && <p>{row.value}</p>}
      {row && <small>{readable(row.authority)}</small>}
      {row && <code>{row.sourceLocator}</code>}
    </div>
  );
}

export default function ResearchSelectionDeltaReceipt() {
  const { activeRecord, selectionDelta } = useResearchActiveRecord();
  if (activeRecord.status !== "ready" || !selectionDelta) return null;
  const receipt = selectionDelta as SelectionDelta;

  return (
    <section
      className="research-selection-delta"
      aria-labelledby="research-selection-delta-heading"
      data-delta-contract={receipt.contractId}
      data-previous-focus-key={receipt.previous.key}
      data-current-focus-key={receipt.current.key}
      data-comparison-authority="presentation-audit-only"
    >
      <header>
        <div>
          <p className="panel-kicker">SELECTION RECEIPT · PRESENTATION AUDIT ONLY</p>
          <h2 id="research-selection-delta-heading">What differs between the two adjacent verified selections?</h2>
          <p>Only checksum-verified record presentation fields and admitted visualization-authority counts are compared.</p>
        </div>
        <strong>{receipt.fixedSlots.changedSlotCount} fixed-slot receipts differ · {receipt.recordScopedEvidence.changedRowCount} record-scoped evidence rows differ · {receipt.visualizationAuthority.changedCount} geometry/authority quantities differ</strong>
      </header>

      <div className="research-selection-delta-identities" aria-label="Adjacent verified research selections">
        <article>
          <span>PREVIOUS VERIFIED SELECTION</span>
          <strong>{receipt.previous.focusId}</strong>
          <small>{receipt.previous.focusKind}</small>
          <code>{receipt.namespace.previous}</code>
        </article>
        <article>
          <span>CURRENT VERIFIED SELECTION</span>
          <strong>{receipt.current.focusId}</strong>
          <small>{receipt.current.focusKind}</small>
          <code>{receipt.namespace.current}</code>
        </article>
      </div>

      {receipt.recordScopedEvidence.status === "compared_morphology_records" && (
        <details className="research-selection-delta-slots">
          <summary>{receipt.recordScopedEvidence.changedRowCount} exact record-scoped evidence rows differ · locator receipts retained</summary>
          <p>These are source-record presentation differences only; they do not establish biological change or equivalence.</p>
          {receipt.recordScopedEvidence.changedRows.map((row) => (
            <article key={`${row.label}-${row.occurrence}`} data-record-scoped-evidence-delta={row.label}>
              <header>
                <strong>{row.label}</strong>
                <span>{row.changedFields.map(readable).join(" · ")} differs</span>
              </header>
              <div>
                <RecordScopedEvidenceSide heading="Previous" row={row.previous} />
                <RecordScopedEvidenceSide heading="Current" row={row.current} />
              </div>
            </article>
          ))}
        </details>
      )}

      {receipt.fixedSlots.status === "compared" ? (
        <section className="research-selection-delta-slots" aria-labelledby="research-selection-delta-slots-heading">
          <h3 id="research-selection-delta-slots-heading">Changed fixed-slot receipts</h3>
          {receipt.fixedSlots.changedSlots.length ? receipt.fixedSlots.changedSlots.map((slot) => (
            <article key={slot.slotId} data-delta-slot={slot.slotId} data-slot-status-changed={slot.statusChanged ? "true" : "false"}>
              <header>
                <strong>{slot.label}</strong>
                <span>{slot.statusChanged ? "Availability status differs" : `${slot.changedFields.map(readable).join(" · ")} differs`}</span>
              </header>
              <div>
                <SlotReceiptSide heading="Previous" slot={slot.previous} />
                <SlotReceiptSide heading="Current" slot={slot.current} />
              </div>
            </article>
          )) : <p>No fixed-slot receipt differs between these exact records.</p>}

          {!!receipt.fixedSlots.unchangedSlots.length && (
            <details>
              <summary>{receipt.fixedSlots.unchangedSlotCount} exact unchanged fixed-slot receipts · shown once</summary>
              <ul>{receipt.fixedSlots.unchangedSlots.map((slot) => (
                <li key={slot.slotId}>
                  <strong>{slot.label}</strong>
                  <span>{readable(slot.current.status)} · {slot.current.rowLabel ?? readable(slot.current.reasonCode ?? "missing")}</span>
                  <code>{slot.current.sourceLocator}</code>
                </li>
              ))}</ul>
            </details>
          )}
        </section>
      ) : (
        <p className="research-selection-delta-not-applicable">
          Fixed-slot comparison is not applicable because the eight-slot contract is defined only for molecular profiles. No missing molecular fields were imputed for this comparison.
        </p>
      )}

      <section className="research-selection-delta-counts" aria-labelledby="research-selection-delta-counts-heading">
        <h3 id="research-selection-delta-counts-heading">Visualization-authority counts</h3>
        <p>These are admitted display-object, line-loop vertex and relationship-authority quantities for each record, not biological abundance.</p>
        <table aria-label="Previous and current visualization-authority counts">
          <thead>
            <tr><th scope="col">Authority field</th><th scope="col">Previous</th><th scope="col">Current</th><th scope="col">Difference</th></tr>
          </thead>
          <tbody>
            {receipt.visualizationAuthority.counts.map((item) => (
              <tr className={item.changed ? "changed" : "unchanged"} key={item.id}>
                <th scope="row">{item.label}</th>
                <td>
                  {item.previousCount}
                  {item.previousSourceLocator && <><small>{item.previousAuthority && readable(item.previousAuthority)}</small><code>{item.previousSourceLocator}</code></>}
                </td>
                <td>
                  {item.currentCount}
                  {item.currentSourceLocator && <><small>{item.currentAuthority && readable(item.currentAuthority)}</small><code>{item.currentSourceLocator}</code></>}
                </td>
                <td>{differenceLabel(item.difference)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {receipt.sharedContext.status === "compared_same_namespace" ? (
        receipt.sharedContext.unchangedRows.length ? (
          <details className="research-selection-delta-shared">
            <summary>{receipt.sharedContext.unchangedRowCount} exact unchanged shared source-context rows · shown once</summary>
            <p>Exact equality is reported only inside the shared source namespace and establishes no biological equivalence.</p>
            <dl>{receipt.sharedContext.unchangedRows.map((row, index) => (
              <div key={`${row.label}-${row.sourceLocator}-${index}`}>
                <dt>{row.label}</dt>
                <dd>{row.value}<small>{readable(row.authority)}</small><code>{row.sourceLocator}</code></dd>
              </div>
            ))}</dl>
          </details>
        ) : <p className="research-selection-delta-shared-empty">No exact unchanged shared source-context row was found in this same-namespace comparison.</p>
      ) : (
        <p className="research-selection-delta-shared-empty">Source namespaces differ, so textual overlap is not presented as shared source context.</p>
      )}

      <p className="research-selection-delta-boundary" role="note">
        <strong>{receipt.disclaimer}</strong>
        A record-to-record difference creates zero relationship admissions and authorizes no inferred value, geometry, registration, or biological ordering.
      </p>
    </section>
  );
}
