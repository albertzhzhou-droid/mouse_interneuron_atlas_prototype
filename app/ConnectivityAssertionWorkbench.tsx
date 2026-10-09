"use client";

import { useMemo, useState } from "react";
import mvp from "../data/research-mvp-release-0.2.json";
import hayashi from "../data/hayashi-v2a-source-taxonomy-0.1.json";
import ronzano from "../data/ronzano-premotor-position-reference-0.1.json";
import { buildConnectivityAssertionCatalog, connectivityAssertionCsv, connectivityAssertionSummary, filterConnectivityAssertions, makeConnectivityAssertionExport, reconcileConnectivityAssertionSelection } from "./connectivity-assertions.js";
import "./exact-source-audit-workbench.css";
import "./connectivity-assertion-workbench.css";

const catalog = buildConnectivityAssertionCatalog({ mvp, hayashi, ronzano });
const categoryCounts = connectivityAssertionSummary(catalog);
const INITIAL_FILTER = { category: "all", species: "all", sourceId: "all", lifeStage: "all", query: "" };

export default function ConnectivityAssertionWorkbench() {
  const [filter, setFilter] = useState(INITIAL_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const rows = useMemo(() => filterConnectivityAssertions(catalog.records, filter), [filter]);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  function updateFilter(next: typeof filter) {
    setSelectedId(reconcileConnectivityAssertionSelection(filterConnectivityAssertions(catalog.records, next), selectedId));
    setFilter(next); setNotice("");
  }

  function exportRows(format: "json" | "csv", onlySelected = false) {
    const records = onlySelected ? selected ? [selected] : [] : rows;
    if (onlySelected && !selected) return;
    const exported = makeConnectivityAssertionExport(catalog, records, { ...filter, selection: onlySelected ? selected?.id : null }, new Date().toISOString());
    const content = format === "json" ? JSON.stringify(exported, null, 2) : connectivityAssertionCsv(exported);
    const url = URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `connectivity-${records.length}-exact-assertion-contexts.${format}`; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${records.length} exact source assertion contexts with methods, locators and missingness. Cell edges: 0; synapse count unknown.`);
  }

  return <section className="exact-source-audit connectivity-assertions" aria-labelledby="connectivity-assertion-heading">
    <header><span className="esa-kicker">CONNECTION EVIDENCE · UPG-047</span><h3 id="connectivity-assertion-heading">What kind of connection does the source support?</h3><p>{catalog.records.length} admitted source assertion contexts from 9 publications. Separate conditions retain their own result, method, age and injury scope. These rows count assertions, not neurons or synapses.</p></header>
    <p className="esa-boundary">Exact source and target cell keys are unavailable in this bounded set. The view contains assertion rows and draws no cell connections. Functional effects and pooled tracing context do not establish direct synaptic partners. A zero below applies only to these admitted contracts; connectivity elsewhere remains unknown.</p>
    <div className="ca-legend" aria-label="Connectivity category legend">{catalog.categories.map((category) => <article key={category.id} className={`ca-category ca-${category.id}`}><h4>{category.label} <span>{categoryCounts[category.id]}</span></h4><p>{category.definition}</p></article>)}</div>
    <div className="esa-controls"><label>Search assertion, condition, method or locator<input value={filter.query} onChange={(event) => updateFilter({ ...filter, query: event.target.value })} placeholder="C2, CLP290, rabies, P09…" /></label><label>Connection evidence<select value={filter.category} onChange={(event) => updateFilter({ ...filter, category: event.target.value })}><option value="all">All categories</option>{catalog.categories.map((category) => <option key={category.id} value={category.id}>{category.label} ({categoryCounts[category.id]})</option>)}</select></label><label>Species<select value={filter.species} onChange={(event) => updateFilter({ ...filter, species: event.target.value })}><option value="all">All source species</option>{[...new Set(catalog.records.map((row) => row.species))].map((value) => <option key={value}>{value}</option>)}</select></label><label>Source<select value={filter.sourceId} onChange={(event) => updateFilter({ ...filter, sourceId: event.target.value })}><option value="all">All admitted sources</option>{[...new Map(catalog.records.map((row) => [row.sourceId, row.citation])).entries()].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Age context<select value={filter.lifeStage} onChange={(event) => updateFilter({ ...filter, lifeStage: event.target.value })}><option value="all">All source ages</option>{[...new Set(catalog.records.map((row) => row.lifeStage))].map((value) => <option key={value}>{value}</option>)}</select></label><div className="esa-actions"><button onClick={() => exportRows("json")}>Export filtered JSON</button><button onClick={() => exportRows("csv")}>Export filtered CSV</button><button disabled={!selected} onClick={() => exportRows("json", true)}>Export selected assertion</button><button onClick={() => updateFilter({ ...INITIAL_FILTER })}>Clear filters</button></div></div>
    <p role="status">{rows.length} source assertion contexts match this filter.</p>
    {/* This focusable region lets keyboard users scroll the wide source table. */}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
    <div className="esa-table-scroll" tabIndex={0} role="region" aria-label="Admitted connection assertion contexts"><table><caption>Evidence rows preserve context without creating cell partners</caption><thead><tr><th>Assertion / source</th><th>Category / directness</th><th>Condition-specific result</th><th>Species / age / output</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={selected?.id === row.id ? "esa-selected-row" : ""}><td><button className="esa-record-button" aria-pressed={selected?.id === row.id} onClick={() => { setSelectedId(row.id); setNotice(""); }}>{row.title}</button><small>{row.citation}</small></td><td><span className={`ca-tag ca-${row.category}`}>{catalog.categories.find((category) => category.id === row.category)?.label}</span><small>Direct synapse: unknown</small></td><td>{row.statement}</td><td>{row.species}<small>{row.lifeStage}</small><small>{row.endpoint}</small></td></tr>)}</tbody></table>{rows.length === 0 && <p>No admitted assertion matches this filter. This bounded result does not establish biological absence.</p>}</div>
    {selected ? <article className="esa-selected"><h4>{selected.title}</h4><p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.citation}</a> · DOI {selected.doi}</p><p className="esa-locator"><code>{selected.id}</code></p><dl className="esa-fields"><div><dt>Classification basis</dt><dd>{selected.classificationBasis}</dd></div><div><dt>Condition-specific statement</dt><dd>{selected.statement}</dd></div><div><dt>Parent statement context</dt><dd>{selected.parentStatement ?? "No separate parent claim."}</dd></div><div><dt>Reported grades</dt><dd>{selected.parentClaimGrades.join(", ") || "None attached"}<small>{selected.parentClaimGradesScope}</small></dd></div><div><dt>Region / injury context</dt><dd>{selected.region}</dd></div><div><dt>Population references</dt><dd>{selected.populationEntityContextIds.join(", ") || "No mouse population identity assigned to this context."}<small>Reference IDs are not exact cell keys.</small></dd></div><div><dt>Exact source / target cells</dt><dd>Unknown / unknown · no cell edge admitted.</dd></div></dl><h4>Original methods and context</h4><pre className="ca-source-json">{JSON.stringify(selected.methods, null, 2)}</pre><h4>Source locators</h4><ul className="esa-locator">{selected.locators.map((value) => <li key={value}><code>{value}</code></li>)}</ul><h4>Missingness</h4><ul>{selected.missingness.map((item) => <li key={item.field}>{item.field}: {item.status} — {item.reason}</li>)}</ul><details><summary>Unchanged admitted source objects, controls and limitations</summary><pre className="ca-source-json">{JSON.stringify(selected.sourceObjects, null, 2)}</pre></details></article> : <p>Select an assertion to inspect its methods, controls and exact locators.</p>}
    <p className="esa-export-status" role="status">{notice}</p>
  </section>;
}
