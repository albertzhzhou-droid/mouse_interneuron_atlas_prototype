"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import trevisan from "../data/trevisan-v1-exact-input-crosswalk-audit-0.1.json";
import publications from "../data/neuromorpho-publication-discovery-audit-0.1.json";
import { filterPublicationDiscoveryRecords, filterSourceAuditSamples, makeSourceAuditExport, reconcileSourceAuditSelection, sourceAuditCsv, sourceAuditNucleusGate, sourceAuditSampleKey, readSourceAuditSampleBookmark, writeSourceAuditSampleBookmark, sourceAuditSampleHref } from "./exact-source-audit-workbench.js";
import type { SourceAuditSampleBookmark } from "./exact-source-audit-workbench.js";
import "./exact-source-audit-workbench.css";

const WORKBOOK_URL = trevisan.source.receipts.find((receipt) => receipt.path.endsWith(".xlsx"))!.url;
const PER_PAGE = 20;
const CrozatExperimentObservationBrowser = lazy(() => import("./CrozatExperimentObservationBrowser"));

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExactSourceAuditWorkbench() {
  const [sampleBookmark, setSampleBookmark] = useState<SourceAuditSampleBookmark>({ query: "", cohort: "all", selectedKey: null });
  const [sampleBookmarkReady, setSampleBookmarkReady] = useState(false);
  const [sampleLinkError, setSampleLinkError] = useState("");
  const [publicationQuery, setPublicationQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [showCrozatObservations, setShowCrozatObservations] = useState(false);
  const { query: sampleQuery, cohort } = sampleBookmark;
  const samples = filterSourceAuditSamples(trevisan.samples, sampleQuery, cohort);
  const selected = samples.find((sample) => sourceAuditSampleKey(sample) === sampleBookmark.selectedKey) ?? null;
  const selectedGsm = selected?.geoSampleAccession ?? null;
  const records = filterPublicationDiscoveryRecords(publications.records, publicationQuery, status) as typeof publications.records;
  const pages = Math.max(1, Math.ceil(records.length / PER_PAGE));
  const safePage = Math.min(page, pages - 1);
  const visibleRecords = records.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  useEffect(() => {
    const restore = () => {
      const current = readSourceAuditSampleBookmark(new URLSearchParams(window.location.search), trevisan);
      setSampleBookmark({ query: current.query, cohort: current.cohort, selectedKey: current.selectedKey });
      setSampleLinkError(current.error ?? "");
      setExportStatus("");
      setSampleBookmarkReady(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  function changeSampleBookmark(next: SourceAuditSampleBookmark) {
    const url = new URL(window.location.href);
    url.search = writeSourceAuditSampleBookmark(url.searchParams, next, trevisan).toString();
    if (url.href !== window.location.href) window.history.pushState(window.history.state, "", url.href);
    setSampleBookmark(next); setSampleLinkError(""); setExportStatus("");
  }

  function changeSampleFilter(nextQuery: string, nextCohort: SourceAuditSampleBookmark["cohort"]) {
    const visible = filterSourceAuditSamples(trevisan.samples, nextQuery, nextCohort);
    const retained = reconcileSourceAuditSelection(visible, selectedGsm);
    const current = visible.find((sample) => sample.geoSampleAccession === retained);
    changeSampleBookmark({ query: nextQuery, cohort: nextCohort, selectedKey: current ? sourceAuditSampleKey(current) : null });
  }

  function exportSelectedSample() {
    if (!selected || !sampleBookmarkReady) return;
    const payload = makeSourceAuditExport({ kind: "sample_characteristics", audit: trevisan, records: [selected],
      filter: { query: sampleQuery, cohort, selectedSourceKey: sourceAuditSampleKey(selected) }, generatedAt: new Date().toISOString() });
    download(JSON.stringify(payload, null, 2), `ohri-${trevisan.auditId}-${selected.geoSampleAccession}.json`, "application/json");
    setExportStatus(`Exported the exact ${selected.geoSampleAccession} source-sample audit row; no nucleus roster or source matrix payload.`);
  }

  function exportRows(kind: "sample_characteristics" | "bounded_publication_discovery", format: "json" | "csv") {
    if (kind === "sample_characteristics" && !sampleBookmarkReady) return;
    const rows = kind === "sample_characteristics" ? samples : records;
    const audit = kind === "sample_characteristics" ? trevisan : publications;
    const filter = kind === "sample_characteristics" ? { query: sampleQuery, cohort, selectedSourceKey: sampleBookmark.selectedKey } : { query: publicationQuery, status };
    const payload = format === "json" ? JSON.stringify(makeSourceAuditExport({ kind, audit, records: rows, filter, generatedAt: new Date().toISOString() }), null, 2) : sourceAuditCsv(kind, rows);
    download(payload, `ohri-${audit.auditId}-${rows.length}-rows.${format}`, format === "json" ? "application/json" : "text/csv;charset=utf-8");
    setExportStatus(`Exported ${rows.length.toLocaleString("en-US")} filtered ${kind === "sample_characteristics" ? "sample" : "publication-screen"} rows as ${format.toUpperCase()}; zero roster admissions, identities or geometry.`);
  }

  return <section className="exact-source-audit" aria-labelledby="exact-source-audit-heading">
    <header><span className="esa-kicker">EXACT SOURCE INPUTS · UPG-254 / 253 / 247</span><h3 id="exact-source-audit-heading">Inspect sample conditions and publication mapping</h3>
      <p>Check the actual source rows, the files that were tested, and the relationships that remain unresolved. These audits preserve the current 387-profile collection.</p></header>
    <details open className="esa-section">
      <summary>V1 age atlas · 29 GEO samples and the final-figure barcode workbook</summary>
      <p><a href={trevisan.source.articleUrl} target="_blank" rel="noreferrer">Trevisan et al. 2026</a> · <a href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE275595" target="_blank" rel="noreferrer">GSE275595</a> · <a href={WORKBOOK_URL} target="_blank" rel="noreferrer">Supplementary Data 3</a></p>
      <div className="esa-summary"><p><strong>89,494</strong><span>unique final Atlas-sheet barcodes · 23 sample prefixes</span></p><p><strong>28 / 29</strong><span>separately named GEO barcode files have identical bytes</span></p><p><strong>0</strong><span>validated cluster assignments or admitted nucleus-roster rows</span></p></div>
      <p className="esa-boundary" role="note">The workbook identifies selected final-figure nuclei. Most of its barcodes fail exact matching to the deposited GEO columns. P56LR1 is listed by GEO but has no row in the final Atlas sheet; that does not establish biological absence. E13.5 stays embryonic, and Het/Ko samples retain the source region “Whole cord”.</p>
      {!sampleBookmarkReady && <p role="status">Restoring the exact source-sample link…</p>}
      {sampleLinkError && <p role="alert" className="esa-boundary">{sampleLinkError} No sample was selected. Choose a visible sample or reset these filters.</p>}
      <div className="esa-controls" aria-busy={!sampleBookmarkReady}><label>Search accession, title or condition<input disabled={!sampleBookmarkReady} maxLength={180} value={sampleQuery} onChange={(event) => changeSampleFilter(event.target.value, cohort)} placeholder="P56, Whole cord, E13.5…" /></label><label>Sample set<select disabled={!sampleBookmarkReady} value={cohort} onChange={(event) => changeSampleFilter(sampleQuery, event.target.value as SourceAuditSampleBookmark["cohort"])}><option value="all">All 29 samples</option><option value="atlas">24 postnatal atlas samples</option><option value="en1">En1 Het/Ko experiments</option><option value="embryonic">Embryonic sample</option></select></label><div className="esa-actions"><button disabled={!sampleBookmarkReady} onClick={() => exportRows("sample_characteristics", "json")}>Export filtered JSON</button><button disabled={!sampleBookmarkReady} onClick={() => exportRows("sample_characteristics", "csv")}>Export filtered CSV</button><button disabled={!sampleBookmarkReady} onClick={() => changeSampleBookmark({ query: "", cohort: "all", selectedKey: null })}>Reset sample filters</button></div></div>
      <p role="status">{samples.length} of 29 sample records. Workbook selection rows and native columns are separate units.</p>
      <p>Reopening restores the sample and filters saved in the current URL; Reset sample filters clears that bookmark.</p>
      {/* Native scroll container is a keyboard tab stop so wide source tables can be scrolled with arrow keys. */}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
    <div className="esa-table-scroll" tabIndex={0} role="region" aria-label="Searchable GEO sample records"><table><caption>Source sample characteristics and barcode crosswalk</caption><thead><tr><th>Sample</th><th>Age / region</th><th>Final workbook rows</th><th>GEO columns</th><th>Matched / missing</th></tr></thead><tbody>{samples.map((sample) => <tr key={sourceAuditSampleKey(sample)} aria-selected={sample.geoSampleAccession === selectedGsm}><td><button disabled={!sampleBookmarkReady} className="esa-record-button" aria-pressed={sample.geoSampleAccession === selectedGsm} onClick={() => changeSampleBookmark({ ...sampleBookmark, selectedKey: sourceAuditSampleKey(sample) })}>{sample.sampleTitle}<small>{sample.geoSampleAccession}</small></button></td><td>{sample.age.sourceText} · {sample.characteristics.region.value}</td><td>{sample.workbookRowCount.toLocaleString("en-US")}</td><td>{sample.nativeBarcodeCount.toLocaleString("en-US")}</td><td>{sample.barcodeMatchedRowCount.toLocaleString("en-US")} / {sample.barcodeMissingRowCount.toLocaleString("en-US")}</td></tr>)}</tbody></table>{samples.length === 0 && <p>No source sample matches this search. Clear or change the filters.</p>}</div>
      {selected ? <article className="esa-selected" aria-labelledby="esa-selected-sample-heading"><h4 id="esa-selected-sample-heading">{selected.sampleTitle} · exact source conditions</h4>
        <p><a href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${selected.geoSampleAccession}`} target="_blank" rel="noreferrer">Open {selected.geoSampleAccession}</a> · {selected.finalNucleusRosterAdmission === "held_source_conflict" ? "Nucleus mapping held: source barcode conflict" : "Nucleus mapping held: cluster labels and reuse scope unresolved"}</p>
        <div className="esa-actions"><a href={sourceAuditSampleHref(trevisan, selected)}>Link to this exact sample</a><button onClick={exportSelectedSample}>Export selected sample JSON</button></div>
        <dl className="esa-fields">{Object.entries(selected.characteristics).map(([field, evidence]) => <div key={field}><dt>{field}</dt><dd>{evidence.value}<small>Source field: {evidence.locator}</small></dd></div>)}</dl>
        <p className="esa-boundary">Runtime nucleus-roster gate: unavailable</p><ul>{sourceAuditNucleusGate(selected, trevisan.rights).reasons.map((reason: string) => <li key={reason}>{reason}</li>)}</ul>
        <details><summary>Exact file and row evidence</summary><p><code>{selected.nativeBarcodeFile}</code></p><p className="esa-hash">SHA-256 <code>{selected.nativeBarcodeSha256}</code></p><p>The explicit normalization only restores Cell Ranger’s <code>-1</code> suffix or removes the workbook’s genotype suffix. No approximate barcode matching or title-helper repair is used.</p>{selected.workbookMissingExamples.length > 0 && <ul>{selected.workbookMissingExamples.map((row) => <li key={`${row.sheet}-${row.row}`}>{row.sheet} · row {row.row}: <code>{row.rawValue}</code> → tested <code>{row.testedNativeValue}</code>, missing from source columns.</li>)}</ul>}{selected.matchingExamples.length > 0 && <ul>{selected.matchingExamples.map((row) => <li key={`${row.sheet}-${row.row}`}>{row.sheet} · row {row.row}: <code>{row.rawValue}</code> → source matrix column {row.nativeMatrixColumnOneBased}. This source match does not assign a cluster.</li>)}</ul>}</details>
      </article> : <p className="esa-selected" role="status">Select a sample from the visible result list to inspect its exact source conditions. A filter that removes the selection clears its detail.</p>}
      <details><summary>Workbook counts, matrix validation and reuse boundary</summary><ul>{trevisan.workbookSheets.map((sheet) => <li key={sheet.sheet}><strong>{sheet.sheet}</strong>: {sheet.dataRowCount.toLocaleString("en-US")} unique source values, rows {sheet.firstSourceRow}–{sheet.lastSourceRow}; no cluster column.</li>)}</ul><p>One P0CR1 matrix passed all {trevisan.representativeMatrix.observedNonzeroEntryCount.toLocaleString("en-US")} sparse-entry checks: {trevisan.representativeMatrix.featureRowCount.toLocaleString("en-US")} feature rows × {trevisan.representativeMatrix.barcodeColumnCount.toLocaleString("en-US")} columns. This proves file structure; its final-figure barcode mapping remains conflicted.</p><p>GEO files remain local audit inputs with no verified file-specific submitter reuse licence. The article and MIT analysis code do not independently license these files. This page exports factual audit rows and includes no raw count payload.</p></details>
    </details>
    <details className="esa-section">
      <summary>Publication discovery · 1,127 exact morphology records and ten pinned taxonomy papers</summary>
      <p>The current bounded screen finds 0 exact PMID, full-title or strict shared-author candidates. Its scope is the frozen 1,097-record corpus plus the separate 30 Todd records; this result does not prove a mapping is absent elsewhere. Supplement and animal/figure crosswalks remain unassessable.</p>
      <div className="esa-controls"><label>Search NMO, source name or raw citation<input value={publicationQuery} onChange={(event) => { setPublicationQuery(event.target.value); setPage(0); }} placeholder="322379, Todd, PMID…" /></label><label>Screen status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><option value="all">All source records</option><option value="unmatched">Unmatched in this bounded screen</option><option value="unassessable">Unassessable citation metadata</option><option value="matched">Publication candidates</option></select></label><div className="esa-actions"><button onClick={() => exportRows("bounded_publication_discovery", "json")}>Export filtered JSON</button><button onClick={() => exportRows("bounded_publication_discovery", "csv")}>Export filtered CSV</button></div></div>
      <p role="status">{records.length.toLocaleString("en-US")} records in this filter · page {safePage + 1} of {pages}</p>
      {/* Native scroll container is a keyboard tab stop so wide source tables can be scrolled with arrow keys. */}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
    <div className="esa-table-scroll" tabIndex={0} role="region" aria-label="Bounded publication discovery records"><table><caption>Raw citations and source-record discovery status</caption><thead><tr><th>Exact morphology record</th><th>Source PMID / DOI</th><th>Bounded result</th></tr></thead><tbody>{visibleRecords.map((record) => <tr key={`${record.release}-${record.neuronId}`}><td><a href={`https://neuromorpho.org/api/neuron/id/${record.neuronId}`} target="_blank" rel="noreferrer">NMO {record.neuronId}</a><small>{record.archiveRaw} · {record.release}<br />{record.nameRaw}</small></td><td><code>{JSON.stringify(record.referencePmidRaw)}</code><br /><code>{JSON.stringify(record.referenceDoiRaw)}</code></td><td>{record.publicationDiscoveryStatus}<details><summary>Reason and exact locator</summary><p>{record.reason}</p><p className="esa-locator"><code>{record.locator}</code></p><p>Specimen, figure, lamina and exact object identity remain unresolved.</p></details></td></tr>)}</tbody></table>{records.length === 0 && <p>No record matches this filter within the audited corpus.</p>}</div>
      <div className="esa-pagination"><button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous page</button><button disabled={safePage + 1 >= pages} onClick={() => setPage(safePage + 1)}>Next page</button></div>
      <article className="esa-selected"><h4>Todd neurotensin paper · citation resolved, object mapping unresolved</h4><p><a href={publications.toddRefresh.candidateArticleUrl} target="_blank" rel="noreferrer">{publications.toddRefresh.candidateStudyCitationResolved.titleRaw}</a> · <a href={publications.toddRefresh.candidateStudyCitationResolved.officialUrl} target="_blank" rel="noreferrer">PMID 42454582</a></p><p>The current 339-record Todd query has the same ID set as the pinned receipt. NMO 322379–322408 still expose an empty DOI and raw PMID <code>2017</code>. The article remains candidate context: its citation is never substituted into those records. The reviewed article offers data on reasonable request, with no public exact NMO-to-animal/figure/lamina crosswalk identified.</p></article>
      <details><summary>Ten exact taxonomy citations checked</summary><ul>{publications.taxonomyPublications.map((source) => <li key={source.namespace}><a href={source.resolvedPublication.officialUrl} target="_blank" rel="noreferrer">{source.resolvedPublication.titleRaw}</a><small>{source.namespace} · PMID {source.resolvedPublication.pmid} · {source.sourcePublicationDoiRaw}</small></li>)}</ul><p>PMIDs are exact source-native strings. Titles use the documented Unicode accent/punctuation normalization and exact full-title equality. Shared authors require exact surname plus provided initials and would remain weak discovery clues. None of these methods can establish a same-cell relationship.</p></details>
    </details>
    <details className="esa-section" onToggle={(event) => setShowCrozatObservations(event.currentTarget.open)}><summary>PKD2L1 physiology · source experiment observations</summary>{showCrozatObservations && <Suspense fallback={<p role="status">Loading the pinned experiment tables…</p>}><CrozatExperimentObservationBrowser /></Suspense>}</details>
    <p className="esa-export-status" role="status" aria-live="polite">{exportStatus}</p>
  </section>;
}
