"use client";

import {
  SOURCE_RECORD_DELTA_BOUNDARY,
  buildSourceRecordDelta,
} from "./source-record-delta.js";

export type SourceRecordDeltaRecord<T> = {
  id: string;
  label: string;
  namespace: string;
  value: T;
};

export type SourceRecordDeltaDisplayRow<T> = {
  id: string;
  label: string;
  read: (record: T) => string;
};

export type SourceRecordDeltaInspectorProps<T> = {
  oldRecord: SourceRecordDeltaRecord<T>;
  currentRecord: SourceRecordDeltaRecord<T>;
  rows: readonly SourceRecordDeltaDisplayRow<T>[];
  title?: string;
};

type SourceRecordDeltaResult = {
  contractId: string;
  oldRecord: { id: string; label: string; namespace: string };
  currentRecord: { id: string; label: string; namespace: string };
  sharedRows: readonly { id: string; label: string; value: string }[];
  changedRows: readonly { id: string; label: string; oldValue: string; currentValue: string }[];
  summary: { sharedRowCount: number; changedRowCount: number };
  boundary: { authority: string };
};

function safeHeadingId(oldId: string, currentId: string) {
  const pair = `${oldId}-to-${currentId}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `source-record-delta-${pair || "comparison"}`;
}

export default function SourceRecordDeltaInspector<T>({
  oldRecord,
  currentRecord,
  rows,
  title = "What changed between these source records?",
}: SourceRecordDeltaInspectorProps<T>) {
  const delta = buildSourceRecordDelta({ oldRecord, currentRecord, rows }) as SourceRecordDeltaResult;
  const headingId = safeHeadingId(oldRecord.id, currentRecord.id);

  return (
    <section
      className="source-record-delta-inspector"
      aria-labelledby={headingId}
      data-delta-contract={delta.contractId}
      data-comparison-authority={delta.boundary.authority}
      data-identity-relationship="not-established"
      data-geometry-primitive-count="0"
    >
      <header className="source-record-delta-heading">
        <div>
          <span>SOURCE-RECORD DELTA · DISPLAY ONLY</span>
          <h4 id={headingId}>{title}</h4>
          <p>Only the explicitly whitelisted rows below were inspected. Values remain source-local and are not pooled or harmonized.</p>
        </div>
        <strong>{delta.summary.changedRowCount} changed · {delta.summary.sharedRowCount} exact shared</strong>
      </header>

      <div className="source-record-delta-identities" aria-label="Compared source records">
        <article>
          <span>OLD SOURCE RECORD</span>
          <strong>{delta.oldRecord.label}</strong>
          <small>{delta.oldRecord.namespace} · {delta.oldRecord.id}</small>
        </article>
        <article>
          <span>CURRENT SOURCE RECORD</span>
          <strong>{delta.currentRecord.label}</strong>
          <small>{delta.currentRecord.namespace} · {delta.currentRecord.id}</small>
        </article>
      </div>

      {delta.changedRows.length ? (
        <div className="source-record-delta-table-wrap" role="region" aria-label="Changed source-record display rows">
          <table className="source-record-delta-table">
            <caption>Changed whitelisted display rows; old and current values retain their source-record scope.</caption>
            <thead>
              <tr>
                <th scope="col">Dimension</th>
                <th scope="col">Old · {delta.oldRecord.label}</th>
                <th scope="col">Current · {delta.currentRecord.label}</th>
              </tr>
            </thead>
            <tbody>
              {delta.changedRows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  <td>{row.oldValue}</td>
                  <td>{row.currentValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="source-record-delta-empty">All whitelisted display rows are exact string matches. This does not establish same-cell or same-type identity.</p>
      )}

      {delta.sharedRows.length ? (
        <details className="source-record-delta-shared">
          <summary>{delta.sharedRows.length} exact shared display rows · shown once</summary>
          <p>Shared means exact display-string equality under this comparison whitelist only.</p>
          <dl>
            {delta.sharedRows.map((row) => (
              <div key={row.id}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : (
        <p className="source-record-delta-empty">No whitelisted display row is an exact string match.</p>
      )}

      <div className="source-record-delta-boundary" role="note">
        <strong>0 same-cell identities · 0 same-type identities · 0 geometry primitives · 0 joins · 0 registrations</strong>
        <p>Textual equality or difference does not establish biological identity, morphology, geometry, abundance, causality, connectivity, spatial correspondence, or atlas registration.</p>
        <small>Authority {SOURCE_RECORD_DELTA_BOUNDARY.authority} · relationship {SOURCE_RECORD_DELTA_BOUNDARY.relationshipStatus.replaceAll("_", " ")} · measurement {SOURCE_RECORD_DELTA_BOUNDARY.measurementUse}</small>
      </div>
    </section>
  );
}
