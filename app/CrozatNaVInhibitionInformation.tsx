"use client";

import { useId, useMemo, useRef, useState } from "react";
import { crozatNaVInformation as info, crozatNaVCsv, filterCrozatNaVRows, makeCrozatNaVExport, type CrozatNaVFilter, type CrozatNaVRow } from "./crozat-nav-inhibition-information.js";

const PER_PAGE = 12;
function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function CrozatNaVInhibitionInformation() {
  const id = useId(), table = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<CrozatNaVFilter>({ tableId: "all", regionRaw: "all", condition: "all", query: "" });
  const [page, setPage] = useState(0), [selectedId, setSelectedId] = useState<string | null>(null), [notice, setNotice] = useState("");
  const rows = useMemo(() => filterCrozatNaVRows(filter), [filter]);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE)), currentPage = Math.min(page, pages - 1);
  const shown = rows.slice(currentPage * PER_PAGE, (currentPage + 1) * PER_PAGE);
  const selected = shown.find(row => row.id === selectedId) ?? null;
  const sourceTable = selected ? info.tables.find(item => item.id === selected.tableId) : null;
  function update(next: CrozatNaVFilter) { setFilter(next); setPage(0); setSelectedId(null); setNotice(""); }
  function exportRows(format: "json" | "csv", sourceRows: readonly CrozatNaVRow[], scope: "filtered_rows" | "selected_row") {
    const receipt = makeCrozatNaVExport(sourceRows, filter, scope);
    const text = format === "json" ? JSON.stringify(receipt, null, 2) + "\n" : crozatNaVCsv(sourceRows);
    download(text, `crozat-nav-${scope}-${sourceRows.length}-rows.${format}`, format === "json" ? "application/json" : "text/csv;charset=utf-8");
    setNotice(`Export requested for ${sourceRows.length} original measurement rows. Source row keys and raw numeric text are retained.`);
  }
  return <section className="exact-source-audit" data-testid="crozat-nav-inhibition-information" aria-labelledby={`${id}-title`}>
    <header><span className="esa-kicker">ADDITIONAL ORIGINAL MEASUREMENTS · FIGSHARE V2</span><h4 id={`${id}-title`}>NaV current and TTX inhibition</h4>
      <p>Two additional source tables: 56 control/TTX current-density rows and 28 deposited inhibition-percentage rows. These 84 measurements do not count independent cells or animals.</p>
      <p>Native labels repeat: cervical <code>Cell 11</code> occurs twice per condition and twice in the percentage table. Source percentages span 93–143.1%; values and labels are retained. No rows are paired across or within these tables.</p>
    </header>
    <div className="esa-controls">
      <label htmlFor={`${id}-table`}>Original source table<select id={`${id}-table`} value={filter.tableId} onChange={event => update({ ...filter, tableId: event.target.value })}><option value="all">Both separate tables</option>{info.tables.map(item => <option key={item.id} value={item.id}>{item.sourceFile.fileName} · {item.observationRowCount} rows</option>)}</select></label>
      <label htmlFor={`${id}-region`}>Raw source region<select id={`${id}-region`} value={filter.regionRaw} onChange={event => update({ ...filter, regionRaw: event.target.value })}><option value="all">All deposited regions</option>{["Cerv", "Tho", "Lomb"].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label htmlFor={`${id}-condition`}>Deposited condition field<select id={`${id}-condition`} value={filter.condition} onChange={event => update({ ...filter, condition: event.target.value })}><option value="all">All field values</option><option value="CTR">CTR</option><option value="TTX">TTX</option><option value="not-deposited">No condition column · percentage table</option></select></label>
      <label htmlFor={`${id}-query`}>Find a native label, row or file<input id={`${id}-query`} type="search" value={filter.query} onChange={event => update({ ...filter, query: event.target.value })} placeholder="Cell 11, row12, InhNaPerc…" /></label>
    </div>
    <p role="status">{rows.length} matching original measurement rows · page {currentPage + 1} / {pages}. Complete original table denominators remain 56 and 28.</p>
    <div className="esa-table-scroll" ref={table} id={`${id}-rows`} role="region" aria-label="Original NaV inhibition measurement rows"><table><caption>Exact raw table rows · units attributed to the article</caption><thead><tr><th>Source file / row</th><th>Native Cell label</th><th>Raw region / condition</th><th>Original numeric text</th><th>Label status</th></tr></thead><tbody>{shown.map(row => <tr key={row.id} className={selected?.id === row.id ? "esa-selected-row" : ""}><td><button type="button" aria-pressed={selected?.id === row.id} onClick={() => { setSelectedId(row.id); setNotice(""); }}>{row.sourceFileName} · row {row.sourceRow}</button></td><td>{row.nativeCellLabel}</td><td>{row.regionRaw}<small>{row.conditionRaw ?? "condition column not deposited"}</small></td><td>{row.rawNumericLexical} {row.metricUnit}</td><td>{row.nativeLabelAuditStatus === "ambiguous_repeated_native_label" ? "Repeated label · identity unresolved" : "Table-local label"}</td></tr>)}</tbody></table>{!rows.length && <p>No deposited row matches these filters. No values or source selection are generated.</p>}</div>
    <div className="esa-actions"><button type="button" aria-controls={`${id}-rows`} onClick={() => table.current?.scrollBy({ left: -200 })}>Scroll NaV table left</button><button type="button" aria-controls={`${id}-rows`} onClick={() => table.current?.scrollBy({ left: 200 })}>Scroll NaV table right</button></div>
    <div className="esa-pagination"><button type="button" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); setSelectedId(null); setNotice(""); }}>Previous NaV rows</button><button type="button" disabled={currentPage + 1 >= pages} onClick={() => { setPage(currentPage + 1); setSelectedId(null); setNotice(""); }}>Next NaV rows</button></div>
    {selected && sourceTable ? <article className="esa-selected" data-testid="crozat-nav-selected-row"><h5>{selected.sourceFileName} · original row {selected.sourceRow}</h5>
      <p><code className="esa-locator">{selected.id}</code></p><p>Native <code>Cell={selected.nativeCellLabel}</code> is a source label with unresolved physical-cell identity. {selected.nativeLabelAuditStatus === "ambiguous_repeated_native_label" && "This label is repeated within the source condition; no row is discarded or relabelled."}</p>
      <dl>{Object.entries(selected.raw).map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{value} · <code>{(selected.cellLocators as Record<string, string>)[field]}</code></dd></div>)}</dl>
      <p>{selected.metricField} unit {selected.metricUnit} comes from the published experiment context. The workbook header has no unit. Animals, age, sex, recording file and exact voltage/duration are not mapped to this row.</p>
      <p><a href={selected.sourceFileUrl} target="_blank" rel="noreferrer">Original workbook {selected.sourceFileId}</a> · {selected.sourceSheet} · {sourceTable.observationRowCount} original measurement rows<br /><code className="esa-locator">{selected.sourceFileSha256}</code></p>
      <div className="esa-actions"><button type="button" onClick={() => exportRows("json", [selected], "selected_row")}>Export this NaV row JSON</button><button type="button" onClick={() => setSelectedId(null)}>Clear NaV row selection</button></div>
    </article> : <p>Select a displayed original row to inspect its exact cells and source receipt. A new filter or page clears the selection.</p>}
    <div className="esa-actions"><button type="button" disabled={!rows.length} onClick={() => exportRows("json", rows, "filtered_rows")}>Export {rows.length} NaV rows JSON</button><button type="button" disabled={!rows.length} onClick={() => exportRows("csv", rows, "filtered_rows")}>Export {rows.length} NaV rows CSV</button><button type="button" onClick={() => update({ tableId: "all", regionRaw: "all", condition: "all", query: "" })}>Clear NaV filters</button></div>
    <details className="esa-section"><summary>Denominators, protocol differences and source attribution</summary>
      <p>The two source tables retain Cerv/Tho/Lomb counts 12/6/10 for each density condition and for the percentage rows. The Results reports n=28 and N=10 animals; its regional animal counts are 4/4/2. Figure 5D instead prints regional n=12/8/6, summing to 26. These statements remain separate; no individual animal or physical-cell count is inferred.</p>
      <p>Reported TTX concentration is 0.5 µM in the experiment context. Results describes incremental IV steps of 100 ms; Figure 5A says 50 ms. The Results IV peak at 0 mV and the caption&apos;s inhibition example at +10 mV retain their different roles. No single protocol is assigned to all rows. The deposited percentages are not recomputed from the density file.</p>
      <p>Each file has 27 distinct raw region/label combinations, including repeated Cerv 11 and a Lomb label sequence without 4. This describes labels, not 27 physical cells. Original signed density values and percentages above 100 are retained.</p>
      <p>Source population context is mouse, 3–6 weeks. There are no new raw traces, significance tests, molecular types, morphology, internal objects, cross-study identities or atlas registrations.</p>
      <p><a href={info.source.articleUrl} target="_blank" rel="noreferrer">Crozat et al. 2025 · Results and Figure 5</a> · <a href={info.source.datasetUrl} target="_blank" rel="noreferrer">Figshare version 2 · CC BY 4.0</a></p>
      <p>{info.source.changeNotice} Original workbook bytes were verified during offline extraction; this browser uses the bundled factual derivative and does not fetch the workbooks.</p>
    </details>
    <p role="status" aria-live="polite">{notice}</p>
  </section>;
}
