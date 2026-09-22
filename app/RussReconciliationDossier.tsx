"use client";

import { russReconciliationDossier } from "./atlas-types";

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

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RussReconciliationDossier({ onNotice }: { onNotice: (notice: string) => void }) {
  const dossier = russReconciliationDossier;

  return (
    <section className="taxonomy-reconciliation" aria-labelledby="russ-reconciliation-heading">
      <div className="taxonomy-reconciliation-heading">
        <div>
          <span>PINNED PROVENANCE RECONCILIATION · 2 OFFICIAL CORRECTIONS</span>
          <h5 id="russ-reconciliation-heading">Russ 2021 correction review</h5>
        </div>
        <span className="badge inferred">REVIEWABLE</span>
      </div>
      <p>{dossier.purpose}</p>
      <p className="taxonomy-boundary">{dossier.pinnedMarkerTable.boundary}</p>

      <div className="taxonomy-reconciliation-actions">
        <a href={dossier.sourceArticle.url} target="_blank" rel="noreferrer">Open Russ 2021 article ↗</a>
        <button
          type="button"
          onClick={() => {
            downloadJson(dossier, "ohri-russ-2021-reconciliation-dossier-0.1.json");
            onNotice("Russ correction dossier exported · provenance review only; no mapping or registration added");
          }}
        >
          Export dossier
        </button>
      </div>

      <dl className="catalog-detail-grid taxonomy-receipt-grid">
        <div><dt>Authority</dt><dd>{prettify(dossier.authority)}</dd></div>
        <div><dt>Current decision</dt><dd>{prettify(dossier.releaseDecision.currentStatus)}</dd></div>
        <div><dt>Marker-table receipt</dt><dd><code>{dossier.pinnedMarkerTable.sha256}</code></dd></div>
        <div><dt>Source object</dt><dd>{dossier.pinnedMarkerTable.bytes.toLocaleString()} bytes · XLSX not bundled</dd></div>
      </dl>

      <div className="taxonomy-reconciliation-corrections" aria-label="Official Russ correction records">
        {dossier.corrections.map((correction) => (
          <article key={correction.id}>
            <span>{correction.id} · {correction.published}</span>
            <h6><a href={correction.url} target="_blank" rel="noreferrer">{correction.doi} ↗</a></h6>
            <p><b>Corrected scope:</b> {correction.scope}</p>
            <p><b>Marker-table effect:</b> {correction.directEffectOnPinnedMarkerTable}</p>
            <p><b>Crosswalk decision:</b> {correction.crosswalkDecision}</p>
          </article>
        ))}
      </div>

      <details className="taxonomy-crosswalk-details">
        <summary>Curator reconciliation questions — 3 review items</summary>
        <div className="taxonomy-crosswalk-mapping-list">
          {dossier.reconciliationItems.map((item) => (
            <article key={item.id}>
              <strong>{item.id} · {item.topic}</strong>
              <span>{prettify(item.status)}</span>
              <p><b>Evidence:</b> {item.evidence}</p>
              <p><b>Curator question:</b> {item.curatorQuestion}</p>
              <p><b>Not established:</b> {item.notEstablished}</p>
            </article>
          ))}
        </div>
      </details>

      <section className="taxonomy-reconciliation-decision" aria-label="Current reconciliation decision">
        <strong>Current release boundary</strong>
        <p>{dossier.releaseDecision.permitted}</p>
        <p><b>Forbidden:</b> {dossier.releaseDecision.forbidden}</p>
        <p><b>Next curator gate:</b> {dossier.releaseDecision.nextCuratorGate}</p>
      </section>
    </section>
  );
}
