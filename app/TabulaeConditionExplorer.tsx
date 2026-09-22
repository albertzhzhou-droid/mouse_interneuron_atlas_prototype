"use client";

import { useMemo, useState } from "react";
import { tabulaeConditionCatalog } from "./atlas-types";

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

export default function TabulaeConditionExplorer({ onNotice }: { onNotice: (notice: string) => void }) {
  const catalog = tabulaeConditionCatalog;
  const [family, setFamily] = useState<"all" | (typeof catalog.conditions)[number]["family"]>("all");
  const visibleConditions = useMemo(
    () => catalog.conditions.filter((condition) => family === "all" || condition.family === family),
    [catalog.conditions, family],
  );
  const families = [...new Set(catalog.conditions.map((condition) => condition.family))];

  return (
    <section className="tabulae-condition-explorer" aria-labelledby="tabulae-condition-heading">
      <div className="tabulae-condition-heading">
        <div>
          <span>METADATA-ONLY CONDITION INDEX · 2 GEO SERIES</span>
          <h5 id="tabulae-condition-heading">Tabulae Paralytica condition browser</h5>
        </div>
        <span className="badge inferred">NO SOURCE BODY</span>
      </div>
      <p>{catalog.purpose}</p>
      <p className="taxonomy-boundary">{catalog.releaseDecision.forbidden}</p>

      <div className="tabulae-condition-actions">
        {catalog.sources.map((source) => (
          <a key={source.accession} href={source.url} target="_blank" rel="noreferrer">Open {source.accession} ↗</a>
        ))}
        <button
          type="button"
          onClick={() => {
            downloadJson(catalog, "ohri-tabulae-paralytica-condition-catalog-0.1.json");
            onNotice("Tabulae condition index exported · metadata only; no source body, analysis or registration added");
          }}
        >
          Export index
        </button>
      </div>

      <dl className="catalog-detail-grid tabulae-condition-receipt-grid">
        <div><dt>Authority</dt><dd>{prettify(catalog.authority)}</dd></div>
        <div><dt>Admission</dt><dd>{prettify(catalog.admissionDecision)}</dd></div>
        <div><dt>Condition groups</dt><dd>{catalog.conditions.length} metadata-only groups</dd></div>
        <div><dt>Source file bodies</dt><dd>0 bundled · local hash null</dd></div>
      </dl>

      <label className="tabulae-condition-filter">
        Condition family
        <select value={family} onChange={(event) => setFamily(event.target.value as typeof family)}>
          <option value="all">All condition groups</option>
          {families.map((item) => <option value={item} key={item}>{prettify(item)}</option>)}
        </select>
      </label>
      <p className="tabulae-condition-count" role="status">{visibleConditions.length} of {catalog.conditions.length} condition groups shown</p>

      <div className="tabulae-condition-list" aria-label="Tabulae condition records">
        {visibleConditions.map((condition) => (
          <details key={condition.id} open={condition.id === "TPC-001"}>
            <summary>
              <span>{condition.id} · {condition.accession} · {prettify(condition.family)}</span>
              <strong>{condition.title}</strong>
            </summary>
            <dl className="catalog-detail-grid">
              <div><dt>Modality</dt><dd>{condition.sourceModality}</dd></div>
              <div><dt>Material</dt><dd>{condition.sourceMaterial}</dd></div>
              <div><dt>Aggregation level</dt><dd>{condition.aggregationLevel}</dd></div>
              <div><dt>Visible source labels</dt><dd>{condition.sourceSampleLabels.length}</dd></div>
            </dl>
            <p><b>Established:</b> {condition.established}</p>
            <p><b>Not established:</b> {condition.notEstablished}</p>
            <p><b>Next gate:</b> {condition.nextGate}</p>
            <ul aria-label={condition.id + " condition axes"}>
              {condition.conditionAxes.map((axis) => (
                <li key={axis.name}><b>{prettify(axis.name)}:</b> {axis.sourceValues.join(" · ")} <span>— {axis.interpretationBoundary}</span></li>
              ))}
            </ul>
            <details className="tabulae-source-labels">
              <summary>Visible GEO sample labels ({condition.sourceSampleLabels.length})</summary>
              <code>{condition.sourceSampleLabels.join(", ")}</code>
            </details>
          </details>
        ))}
      </div>

      <section className="tabulae-condition-decision" aria-label="Tabulae condition catalog release decision">
        <strong>Current release boundary</strong>
        <p>{catalog.releaseDecision.permitted}</p>
        <p><b>Next curator gate:</b> {catalog.releaseDecision.nextCuratorGate}</p>
      </section>
    </section>
  );
}
