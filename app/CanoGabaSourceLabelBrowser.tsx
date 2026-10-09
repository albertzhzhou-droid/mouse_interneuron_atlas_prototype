"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import sourceData from "../data/cano-gomez-gaba-source-labels-0.1.json";
import { canoGabaNucleusReceipt, listCanoGabaNuclei, loadCanoGabaAssignments, validateCanoGabaLabels, type GabaLabel, type GabaRoster } from "./cano-gaba-source-labels.js";
import styles from "./CanoGomezGlutLabelBrowser.module.css";
import "./cano-gaba-source-labels.css";

const document = validateCanoGabaLabels(sourceData);
const number = (value: number) => value.toLocaleString("en-US");
const PAGE_SIZE = 18;

function ExportPreview({ value, filename, title }: { value: Record<string, unknown>; filename: string; title: string }) {
  const text = JSON.stringify(value, null, 2);
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = window.document.createElement("a"); a.href = url; a.download = filename; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return <details className="gaba-assignment-export"><summary>{title}</summary><button type="button" onClick={download}>Download current evidence JSON</button><label>Current source evidence JSON<textarea readOnly value={text} rows={8} /></label></details>;
}

function NucleusRows({ label }: { label: GabaLabel }) {
  const [roster, setRoster] = useState<GabaRoster | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [query, setQuery] = useState(""), [page, setPage] = useState(0), [selectedKey, setSelectedKey] = useState("");
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => { pending.current?.abort(); }, []);
  const load = async () => {
    pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
    setLoading(true); setError(""); setRoster(null); setSelectedKey("");
    try { const current = await loadCanoGabaAssignments(document, { signal: controller.signal }); if (!controller.signal.aborted) setRoster(current); }
    catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Source rows could not load"); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  };
  const result = useMemo(() => roster ? listCanoGabaNuclei(roster, label.id, { query, page }) : null, [roster, label.id, query, page]);
  const selected = result?.rows.find(row => row.key === selectedKey) ?? null;
  return <section className="gaba-nucleus-assignments" aria-label={`Exact source nucleus assignments for ${label.rawLabel}`}>
    <h6>Inspect original nucleus IDs</h6>
    {!roster && <p>Load the {number(document.artifact.compressedBytes)}-byte bundled roster to verify and inspect this label&apos;s source rows.</p>}
    <button type="button" disabled={loading} onClick={load}>{loading ? "Verifying source assignments…" : roster ? "Reload and verify source assignments" : error ? "Retry source assignments" : "Load nucleus assignments"}</button>
    {loading && <p role="status">Reading and verifying the exact retained source rows…</p>}
    {error && <p role="alert">{error}</p>}
    {roster && result && <>
      <p className="gaba-verified-count" role="status">{number(result.sourceCount)} source nuclei for <code>{label.rawLabel}</code> · all {number(document.denominators.nucleusCount)} roster rows verified.</p>
      <label>Search nucleus ID or region<input type="search" value={query} placeholder="Exact row name or Cervical" onChange={event => { setQuery(event.target.value); setPage(0); setSelectedKey(""); }} /></label>
      <p>{number(result.matchedCount)} matching nuclei · {result.currentPage + 1} / {result.pageCount}</p>
      <ul className="gaba-nucleus-list" aria-label="Current source nucleus rows">{result.rows.map(row => <li key={row.key}><button type="button" aria-pressed={selected?.key === row.key} onClick={() => setSelectedKey(row.key)}><code>{row.raw.nucleus_id}</code><span>{row.raw.anatomy ?? "Source NA"} · source row {number(row.sourceRow)}</span></button></li>)}</ul>
      {result.rows.length === 0 && <p>No source nucleus matches this search.</p>}
      <nav className={styles.pagination} aria-label="Nucleus result pages"><button type="button" disabled={result.currentPage === 0} onClick={() => { setPage(result.currentPage - 1); setSelectedKey(""); }}>Previous nuclei</button><span>{result.currentPage + 1} / {result.pageCount}</span><button type="button" disabled={result.currentPage + 1 >= result.pageCount} onClick={() => { setPage(result.currentPage + 1); setSelectedKey(""); }}>Next nuclei</button></nav>
      {selected && <article aria-label="Selected GABA source nucleus" data-gaba-nucleus-key={selected.key}>
        <h6><code>{selected.raw.nucleus_id}</code></h6><dl><dt>Compound source key</dt><dd><code>{selected.key}</code></dd><dt>Exact group</dt><dd>{selected.raw.group}</dd><dt>Source anatomy</dt><dd>{selected.raw.anatomy ?? "Source NA"}</dd><dt>Sex / source</dt><dd>Source columns absent · no animal or library identity assigned</dd><dt>Age</dt><dd>P56 · dataset context</dd></dl>
        <ExportPreview value={canoGabaNucleusReceipt(document, roster, label.id, selected)} filename={`cano-gaba-source-row-${selected.sourceRow}.json`} title="Export this exact nucleus assignment" />
      </article>}
    </>}
  </section>;
}

/** Raw metadata labels have their own namespace and add no confirmed profiles. */
export default function CanoGabaSourceLabelBrowser() {
  const heading = useId();
  const [query, setQuery] = useState(""), [group, setGroup] = useState("all"), [order, setOrder] = useState("count");
  const [page, setPage] = useState(0), [selectedId, setSelectedId] = useState(() => document.labels.slice().sort((a, b) => b.nucleusCount - a.nucleusCount || a.rawLabel.localeCompare(b.rawLabel, "en"))[0]?.id ?? "");
  const filtered = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
    return document.labels.filter(label => (group === "all" || label.groupCounts.some(item => item.value === group)) && terms.every(term => [label.rawLabel, ...label.groupCounts.map(item => item.value), ...label.contextCounts.anatomy.map(item => item.value)].join(" ").toLocaleLowerCase("en").includes(term))).sort((a, b) => order === "count" ? b.nucleusCount - a.nucleusCount || a.rawLabel.localeCompare(b.rawLabel, "en") : a.rawLabel.localeCompare(b.rawLabel, "en"));
  }, [query, group, order]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selected = document.labels.find(label => label.id === selectedId) ?? null;
  const selectedVisible = visible.some(label => label.id === selectedId);
  return <section className={`${styles.browser} gaba-source-browser`} aria-labelledby={heading} data-cano-gaba-source-label-browser="true" data-confirmed-interneuron-profiles-added="0">
    <header className={styles.heading}><div><p className={styles.kicker}>Cano-Gomez · P56 · original metadata annotations</p><h4 id={heading}>Explore GABA source labels</h4></div><p className={styles.totals}><strong>204</strong> raw labels · <strong>73,364</strong> nuclei</p></header>
    <p className={styles.boundary}>These are exact <code>meta.data$neuron_types</code> assignments. Their interneuron/projection classification remains unresolved in this browser. Source label words are not marker measurements; the separate confirmed CHOL_IN roster retains 11 profiles.</p>
    <div className={styles.controls}>
      <label>Search GABA label or region<input type="search" value={query} placeholder="e.g. Pkd2l1, Cervical" onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
      <label>GABA source group<select value={group} onChange={event => { setGroup(event.target.value); setPage(0); }}><option value="all">All 24 source groups</option>{document.groupCounts.map(item => <option key={item.value} value={item.value ?? ""}>{item.value ?? "Source NA"}</option>)}</select></label>
      <label>GABA label order<select value={order} onChange={event => { setOrder(event.target.value); setPage(0); }}><option value="count">Nucleus count</option><option value="label">Raw label</option></select></label>
    </div>
    <p className={styles.result} role="status">{number(filtered.length)} matching source labels · {number(filtered.reduce((sum, label) => sum + label.nucleusCount, 0))} nuclei represented. Region searches match label summaries and retain each label&apos;s full count.</p>
    <div className={styles.workspace}><div className={styles.listPanel}>
      <ul className={styles.labels} aria-label="GABA raw source labels">{visible.map(label => <li key={label.id}><button type="button" aria-pressed={selected?.id === label.id} onClick={() => setSelectedId(label.id)}><code>{label.rawLabel}</code><span>{number(label.nucleusCount)} source nuclei</span></button></li>)}</ul>
      {!visible.length && <p className={styles.empty}>No source label matches these filters.</p>}
      <nav className={styles.pagination} aria-label="GABA label result pages"><button type="button" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); }}>Previous labels</button><span>{currentPage + 1} / {pages}</span><button type="button" disabled={currentPage + 1 >= pages} onClick={() => { setPage(currentPage + 1); }}>Next labels</button></nav>
    </div><article className={styles.detail} aria-label="Selected GABA source label" data-gaba-label-id={selected?.id ?? ""}>
      {selected ? <div key={selected.id}>
        {!selectedVisible && <p className={styles.result} role="status">Selected label retained outside the current filters or result page. Details and exports still describe <code>{selected.rawLabel}</code>. Choose a label to change the selection.</p>}
        <header><span className={styles.kicker}>Exact source label</span><h5><code>{selected.rawLabel}</code></h5><p>{number(selected.nucleusCount)} nuclei · {selected.groupCounts.map(item => `${item.value} (${number(item.count)})`).join(" · ")}</p></header>
        <section aria-label="Selected-label source anatomy"><h6>Source anatomy</h6><ul>{selected.contextCounts.anatomy.map(item => <li key={item.value ?? "source-na"}>{item.value ?? "Source NA"}: {number(item.count)}</li>)}</ul></section>
        <p className={styles.missing}>The original metadata has no <code>source</code> or <code>Sex</code> column. Missing values are retained for every nucleus. P56 is dataset context.</p>
        <NucleusRows label={selected} />
        <ExportPreview value={{ documentType: "cano_gaba_source_label_summary", adapterId: document.adapterId, source: document.source, label: selected, sourceFields: document.sourceFields, artifact: document.artifact, boundaries: document.boundaries, runtimeNucleusRowsIncluded: false }} filename={`${selected.id}.json`} title="Export selected-label summary" />
        <details className={styles.provenance}><summary>Identity and source provenance</summary><dl><dt>Original source</dt><dd><a href={String(document.source.url)}>{String(document.source.fileName)}</a></dd><dt>Source SHA-256</dt><dd><code>{String(document.source.sha256)}</code></dd><dt>Stable label ID</dt><dd><code>{selected.id}</code></dd></dl><p>Each nucleus key includes the exact source filename. No Xenium, morphology, donor, section, same-cell or atlas link is established.</p></details>
      </div> : <p className={styles.empty} role="status">Selected source label is unavailable. Choose a visible label to inspect its source evidence.</p>}
    </article></div>
  </section>;
}
