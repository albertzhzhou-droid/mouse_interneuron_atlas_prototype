"use client";

import { useId, useMemo, useState } from "react";
import sourceAssignments from "../data/cano-gomez-glut-active-ident-labels-0.1.json";
import styles from "./CanoGomezGlutLabelBrowser.module.css";

export type CanoGomezGlutLabel = (typeof sourceAssignments.labels)[number];
type Count = { value: string | null; count: number };
const PAGE_SIZE = 18;
const number = (value: number) => value.toLocaleString("en-US");
const sourceText = (value: string | null) => value === null ? "Source NA" : value === "" ? "Exact empty string" : value;

function ContextCounts({ title, values, total }: { title: string; values: Count[]; total: number }) {
  return <section className={styles.context} aria-label={title}>
    <h6>{title}</h6>
    <ul>{values.map(({ value, count }) => <li key={value === null ? "source-na" : `raw:${value}`}>
      <span>{sourceText(value)}</span>
      <span className={styles.bar} aria-hidden="true"><i style={{ width: `${count / total * 100}%` }} /></span>
      <strong>{number(count)}</strong>
    </li>)}</ul>
  </section>;
}

function downloadSelection(label: CanoGomezGlutLabel) {
  const blob = new Blob([JSON.stringify({ adapterId: sourceAssignments.adapterId, source: sourceAssignments.source, identity: sourceAssignments.identity, label, metadataNeuronTypes: sourceAssignments.metadataNeuronTypes, roster: sourceAssignments.artifact, boundaries: sourceAssignments.boundaries }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${label.id}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Source-slot evidence only: never contributes to the confirmed CHOL_IN profile list. */
export default function CanoGomezGlutLabelBrowser() {
  const headingId = useId();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [sort, setSort] = useState("count");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const filtered = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
    return sourceAssignments.labels.filter((label) => {
      const corpus = [label.rawLabel, ...label.groupCounts.map((item) => item.value), ...Object.values(label.contextCounts).flatMap((values) => values.map((item) => item.value))].join(" ").toLocaleLowerCase("en");
      return terms.every((term) => corpus.includes(term)) && (group === "all" || label.groupCounts.some((item) => item.value === group));
    }).sort((a, b) => sort === "count" ? b.nucleusCount - a.nucleusCount || a.rawLabel.localeCompare(b.rawLabel, "en") : a.rawLabel.localeCompare(b.rawLabel, "en"));
  }, [query, group, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selected = visible.find((label) => label.id === selectedId) ?? visible[0] ?? null;
  const matchedNuclei = filtered.reduce((total, label) => total + label.nucleusCount, 0);

  return <section className={styles.browser} aria-labelledby={headingId} data-cano-glut-source-label-browser="true" data-confirmed-interneuron-profiles-added="0">
    <header className={styles.heading}>
      <div><p className={styles.kicker}>Cano-Gomez · P56 · source assignment detail</p><h4 id={headingId}>Explore GLUT source labels</h4></div>
      <p className={styles.totals}><strong>{number(sourceAssignments.denominators.sourceLabelCount)}</strong> raw labels <span>·</span> <strong>{number(sourceAssignments.denominators.nucleusCount)}</strong> nuclei</p>
    </header>
    <p className={styles.boundary}>These labels come from the source <code>active.ident</code> slot. Their projection/local interneuron status remains unresolved; the confirmed roster still contains 11 CHOL_IN profiles. The absent <code>meta.data$neuron_types</code> column remains missing for all {number(sourceAssignments.denominators.nucleusCount)} rows.</p>
    <div className={styles.controls}>
      <label>Search raw label or context<input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="e.g. Piezo2, Sacral, AC03" /></label>
      <label>Source group<select value={group} onChange={(event) => { setGroup(event.target.value); setPage(0); }}><option value="all">All {sourceAssignments.denominators.sourceGroupCount} groups</option>{sourceAssignments.groupCounts.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}</select></label>
      <label>Order<select value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }}><option value="count">Nucleus count</option><option value="label">Raw label</option></select></label>
    </div>
    <p className={styles.result} role="status">{number(filtered.length)} matching labels · {number(matchedNuclei)} nuclei represented by these labels. Context searches match label summaries and retain each label&apos;s complete nucleus count.</p>
    <div className={styles.workspace}>
      <div className={styles.listPanel}>
        <ul className={styles.labels} aria-label="GLUT raw source labels">{visible.map((label) => <li key={label.id}><button type="button" aria-pressed={selected?.id === label.id} onClick={() => setSelectedId(label.id)}><code>{label.rawLabel}</code><span>{number(label.nucleusCount)} nuclei</span></button></li>)}</ul>
        {filtered.length === 0 && <p className={styles.empty}>No raw source label matches these filters.</p>}
        <nav className={styles.pagination} aria-label="Source-label result pages"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span>{currentPage + 1} / {pages}</span><button type="button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></nav>
      </div>
      <article className={styles.detail} aria-label="Selected source-label evidence">
        {selected ? <>
          <header><span className={styles.kicker}>Exact source label</span><h5><code>{selected.rawLabel}</code></h5><p><strong>{number(selected.nucleusCount)}</strong> source nuclei · {selected.groupCounts.map((item) => `${sourceText(item.value)} (${number(item.count)})`).join(" · ")}</p></header>
          <div className={styles.contexts}>
            <ContextCounts title="Source anatomy" values={selected.contextCounts.anatomy} total={selected.nucleusCount} />
            <ContextCounts title="Source Sex values" values={selected.contextCounts.Sex} total={selected.nucleusCount} />
            <ContextCounts title="Raw source field values" values={selected.contextCounts.source} total={selected.nucleusCount} />
          </div>
          <p className={styles.missing}><code>meta.data$neuron_types</code>: source column absent for all {number(selected.metadataNeuronTypesMissingCount)} selected-label nuclei. Raw label tokens have not been interpreted as marker evidence.</p>
          <button className={styles.export} type="button" onClick={() => downloadSelection(selected)}>Export selected-label evidence</button>
          <details className={styles.provenance}><summary>Identity and source provenance</summary>
            <dl><dt>Source object</dt><dd><a href={sourceAssignments.source.url}>{sourceAssignments.source.fileName}</a></dd><dt>Assignment origin</dt><dd><code>active.ident</code>, with exact name/order agreement to <code>meta.data</code> row names.</dd><dt>Source SHA-256</dt><dd><code>{sourceAssignments.source.sha256}</code></dd><dt>Stable label ID</dt><dd><code>{selected.id}</code></dd><dt>Ordered selected-nucleus key SHA-256</dt><dd><code>{selected.orderedCompoundNucleusKeysSha256}</code></dd></dl>
            <p>No cross-assay or cross-source identity, morphology, internal structure, or atlas registration is established.</p>
          </details>
        </> : <p className={styles.empty}>Change the filters to inspect source assignments.</p>}
      </article>
    </div>
    <footer className={styles.footer}><a href={sourceAssignments.artifact.publicUrl} download>Download all {number(sourceAssignments.artifact.rowCount)} exact assignment rows (.jsonl.gz)</a><span>Includes exact source filename, row name, group and context; filter by <code>source_label_id</code>. Counts describe this source object, not biological prevalence.</span></footer>
  </section>;
}
