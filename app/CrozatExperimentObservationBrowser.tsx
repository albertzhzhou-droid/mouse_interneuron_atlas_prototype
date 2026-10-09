"use client";

import { lazy, Suspense, useMemo, useState } from "react";
import audit from "../data/crozat-experiment-family-observations-0.1.json";
import { crozatObservationCsv, crozatWithinFamilyPairs, filterCrozatObservations, makeCrozatObservationExport, reconcileCrozatSelection } from "./crozat-experiment-observations.js";
import "./exact-source-audit-workbench.css";

type Observation = (typeof audit.families)[number]["observations"][number];
type BrowserRow = Observation & { familyTitle: string; sourceFileId: number; sourceFileName: string; sourceSheet: string; sourceUrl: string; sourceSha256: string; metrics: (typeof audit.families)[number]["metrics"] };
const PER_PAGE = 15;
const CrozatNaVInhibitionInformation = lazy(() => import("./CrozatNaVInhibitionInformation"));

export default function CrozatExperimentObservationBrowser() {
  const [filter, setFilter] = useState({ familyId: "all", category: "all", region: "all", query: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const rows = useMemo(() => filterCrozatObservations(audit.families, filter) as BrowserRow[], [filter]);
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const family = selected ? audit.families.find((item) => item.id === selected.familyId) : null;
  const pairs = crozatWithinFamilyPairs(family, selected) as Observation[];
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);

  function updateFilter(next: typeof filter) {
    setSelectedId(reconcileCrozatSelection(filterCrozatObservations(audit.families, next), selectedId));
    setFilter(next); setPage(0); setNotice("");
  }

  function exportRows(format: "json" | "csv") {
    const exportObject = makeCrozatObservationExport(audit, rows, filter, new Date().toISOString());
    const content = format === "json" ? JSON.stringify(exportObject, null, 2) : crozatObservationCsv(rows);
    const url = URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `crozat-v2-${rows.length}-source-observations.${format}`; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${rows.length} filtered source observations, with units and exact cell locators. No deposit-wide unique-cell denominator or cross-family join.`);
  }

  return <section className="exact-source-audit" aria-labelledby="crozat-observations-heading">
    <header><span className="esa-kicker">OBSERVED EXPERIMENT TABLES · UPG-175</span><h3 id="crozat-observations-heading">PKD2L1 physiology · inspect the source measurements</h3><p><a href={audit.source.articleUrl} target="_blank" rel="noreferrer">Crozat et al. 2025</a> · <a href={audit.source.datasetUrl} target="_blank" rel="noreferrer">Figshare version 2 · CC BY 4.0</a></p>
      <p>{audit.summary.adapterTableCount} declared experiment tables · {audit.summary.observationRowCount.toLocaleString("en-US")} separate-table observation rows · {audit.summary.completeWithinTablePairGroupCount} complete condition groups within their own tables. Cell integers are local labels, reused by other experiments; these totals do not count unique cells across the deposit.</p></header>
    <details className="esa-section"><summary>Protocols, denominator differences and measurement limits</summary><dl><dt>Recording context</dt><dd>Mouse source population, 3–6 weeks; age is not attached to each observation. Whole-cell recordings at approximately 20 °C. Individual animals, slices, raw recording files and sweep voltages remain unknown for these rows.</dd><dt>Passive and resting potential</dt><dd>{audit.protocolContext.passive}</dd><dt>Ionic currents</dt><dd>{audit.protocolContext.ionic}</dd><dt>Ligand responses</dt><dd>{audit.protocolContext.receptor}</dd><dt>Calcium-current modulation</dt><dd>{audit.protocolContext.cavModulation}</dd><dt>Extracellular pH</dt><dd>{audit.protocolContext.ph}</dd></dl><ul>{audit.conflicts.map((conflict, index) => <li key={index}>{conflict.familyId}: {"depositSourceLocalLabels" in conflict ? `${conflict.depositSourceLocalLabels} deposited local labels versus article results n=${conflict.articleReportedSamples}; neither count is repaired.` : "detail" in conflict ? conflict.detail : `Pressure duration differs: methods ${conflict.methodsSeconds} s versus figure caption ${conflict.figure12CaptionSeconds} s.`}</li>)}</ul><p>Fig.4D lists 10 cervical, 13 thoracic and 12 lumbar cells (35), agreeing with the pH9 frequency table; its results paragraph reports n=32. Tau has no unit in the source header: its raw values are visible with the scale unresolved. No trace synthesis, fitted model, molecular type addition, morphology or SBF-SEM identity link is admitted.</p><p>{audit.scope.remainingDepositFiles}</p></details>
    <div className="esa-controls"><label>Search family, source file or local label<input value={filter.query} onChange={(event) => updateFilter({ ...filter, query: event.target.value })} placeholder="pH9, RMP, local label…" /></label><label>Experiment category<select value={filter.category} onChange={(event) => updateFilter({ ...filter, category: event.target.value, familyId: "all" })}><option value="all">All declared categories</option>{["passive", "ionic-current", "receptor", "pH"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Exact table family<select value={filter.familyId} onChange={(event) => updateFilter({ ...filter, familyId: event.target.value })}><option value="all">All tables in category</option>{audit.families.filter((item) => filter.category === "all" || item.category === filter.category).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Spinal region<select value={filter.region} onChange={(event) => updateFilter({ ...filter, region: event.target.value })}><option value="all">All source regions</option>{["cervical", "thoracic", "lumbar"].map((value) => <option key={value}>{value}</option>)}</select></label><div className="esa-actions"><button onClick={() => exportRows("json")}>Export filtered JSON</button><button onClick={() => exportRows("csv")}>Export filtered CSV</button><button onClick={() => updateFilter({ familyId: "all", category: "all", region: "all", query: "" })}>Clear filters</button></div></div>
    <p role="status">{rows.length.toLocaleString("en-US")} source observations in this filter · page {safePage + 1} of {pages}</p>
    {/* Native scroll container is a keyboard tab stop so wide source tables can be scrolled with arrow keys. */}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
    <div className="esa-table-scroll" tabIndex={0} role="region" aria-label="Crozat experiment observation rows"><table><caption>Native measurements with explicit table and row identity</caption><thead><tr><th>Experiment table</th><th>Source label / row</th><th>Region / condition</th><th>Raw measurements</th></tr></thead><tbody>{rows.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE).map((row) => <tr key={row.id} className={selected?.id === row.id ? "esa-selected-row" : ""}><td>{row.familyTitle}<small>{row.sourceFileName}</small></td><td><button aria-pressed={selected?.id === row.id} onClick={() => setSelectedId(row.id)}>{row.sourceCellLabel === null ? `Row ${row.sourceRow} · no cell label` : `Local cell ${row.sourceCellLabel} · row ${row.sourceRow}`}</button></td><td>{row.region}<small>{row.conditionRaw} · {row.conditionOrigin.replaceAll("_", " ")}</small></td><td>{Object.entries(row.values).map(([field, value]) => <small key={field}>{field}: {value} {row.metrics.find((metric) => metric.field === field)?.unit ?? "(source scale unresolved)"}</small>)}</td></tr>)}</tbody></table>{rows.length === 0 && <p>No source observation matches this filter.</p>}</div>
    <div className="esa-pagination"><button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous page</button><button disabled={safePage + 1 >= pages} onClick={() => setPage(safePage + 1)}>Next page</button></div>
    {selected && family ? <article className="esa-selected"><h4>{family.title} · exact observation</h4><p><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Original file {selected.sourceFileId}</a> · {selected.sourceSheet} · row {selected.sourceRow}<br /><code className="esa-locator">{selected.sourceSha256}</code></p><p className="esa-locator"><code>{selected.id}</code></p><ul>{Object.entries(selected.values).map(([field, value]) => <li key={field}>{field} = {value} {family.metrics.find((metric) => metric.field === field)?.unit ?? "(unit/scale unresolved)"} · <code>{(selected.cellLocators as Record<string, string>)[field]}</code></li>)}</ul><p>Table: {family.observationRowCount} source rows; {family.sourceLocalLabelCount === null ? "no native cell labels to count or pair" : `${family.sourceLocalLabelCount} labels within this table only`}. Article animal N: {family.articleAnimalN ?? "not assessed for this table"}; no per-row animal roster. Analysis locator: file {family.sourceAnalysis.fileId}, line {family.sourceAnalysis.line}.</p><h5>Conditions paired within this exact table</h5>{pairs.length ? <ul>{pairs.map((row) => <li key={row.id}>{row.conditionRaw} · row {row.sourceRow}: <code>{JSON.stringify(row.values)}</code></li>)}</ul> : <p>No complete condition pair is admitted for this observation. A row number or a label shared with another file cannot supply one.</p>}</article> : <p>Select a visible source row to inspect its measurements and any complete conditions within that exact table.</p>}
    <details className="esa-section" data-testid="crozat-nav-additional-disclosure" onToggle={event => setNavOpen(event.currentTarget.open)}><summary>Additional NaV inhibition source tables · 84 measurement rows</summary>{navOpen && <Suspense fallback={<p role="status">Loading the additional original NaV measurements…</p>}><CrozatNaVInhibitionInformation /></Suspense>}</details>
    <p role="status" aria-live="polite">{notice}</p>
  </section>;
}
