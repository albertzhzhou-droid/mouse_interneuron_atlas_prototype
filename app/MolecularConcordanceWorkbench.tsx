"use client";

import { useEffect, useMemo, useState } from "react";
import { useResearchActiveRecord } from "./ResearchActiveRecordProvider";
import { researchExplorerLoadingReceipt } from "./research-explorer-index.js";
import {
  emptyMolecularConcordanceView,
  filterMolecularConcordanceCandidates,
  makeMolecularConcordanceBookmarkParams,
  MOLECULAR_CONCORDANCE_PAGE_SIZE,
  MOLECULAR_CONCORDANCE_QUERY_LIMIT,
  readMolecularConcordanceBookmark,
  type MolecularConcordanceViewState,
} from "./molecular-concordance-bookmark.js";
import { buildMolecularConcordance, molecularConcordanceCsv, type MolecularSourceScope } from "./molecular-concordance.js";
import sathyamurthy from "../data/sathyamurthy-source-taxonomy-0.1.json";
import alkaslasi from "../data/alkaslasi-cholinergic-source-taxonomy-0.1.json";
import haring from "../data/haring-dorsal-horn-source-taxonomy-0.1.json";
import hayashi from "../data/hayashi-v2a-source-taxonomy-0.1.json";
import roome from "../data/roome-dil-source-taxonomy-0.1.json";
import "./molecular-concordance.css";

const sourceScopes: MolecularSourceScope[] = [
  { namespace: "sathyamurthy-2018", path: "data/sathyamurthy-source-taxonomy-0.1.json", releaseId: sathyamurthy.releaseId, lifeStage: sathyamurthy.scope.lifeStage, profileIds: sathyamurthy.profiles.map((profile) => profile.id) },
  { namespace: "alkaslasi-2021:GSE167597", path: "data/alkaslasi-cholinergic-source-taxonomy-0.1.json", releaseId: alkaslasi.releaseId, lifeStage: alkaslasi.scope.lifeStage, profileIds: alkaslasi.profiles.map((profile) => profile.id) },
  { namespace: "haring-2018:GSE103840", path: "data/haring-dorsal-horn-source-taxonomy-0.1.json", releaseId: haring.releaseId, lifeStage: haring.scope.lifeStage, profileIds: haring.profiles.map((profile) => profile.id) },
  { namespace: "hayashi-2018:GSE108788", path: "data/hayashi-v2a-source-taxonomy-0.1.json", releaseId: hayashi.releaseId, lifeStage: hayashi.scope.lifeStage, profileIds: hayashi.profiles.map((profile) => profile.id) },
  { namespace: "roome-2026:GSE291462", path: "data/roome-dil-source-taxonomy-0.1.json", releaseId: roome.releaseId, lifeStage: roome.scope.lifeStages.join(" · "), lifeStageLocator: "data/roome-dil-source-taxonomy-0.1.json#scope/lifeStages", profileIds: roome.profiles.map((profile) => profile.id) },
];

function download(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function comparisonLabel(status: string) {
  return status === "exact_agreement" ? "Exact source-string agreement"
    : status === "different_source_assertions" ? "Different source assertions"
      : status === "exact_string_comparison" ? "Exact displayed strings compared" : "Unknown / missing source field";
}

export default function MolecularConcordanceWorkbench() {
  const { indexState } = useResearchActiveRecord();
  const records = useMemo(() => indexState.status === "ready" ? indexState.index.records.filter((record) => record.focusKind === "molecular_profile") : [], [indexState]);
  const verifiedDecodedSha256 = indexState.status === "ready"
    ? researchExplorerLoadingReceipt(indexState.index)?.verifiedDecodedSha256 ?? "" : "";
  const authority = useMemo(() => ({ records, verifiedDecodedSha256 }), [records, verifiedDecodedSha256]);
  const [bookmark, setBookmark] = useState(() => ({
    verifiedDecodedSha256: "", view: emptyMolecularConcordanceView(), error: "", href: "",
  }));
  const [notice, setNotice] = useState("");
  const bookmarkReady = Boolean(verifiedDecodedSha256) && bookmark.verifiedDecodedSha256 === verifiedDecodedSha256;
  const view = bookmarkReady ? bookmark.view : emptyMolecularConcordanceView();
  const { query, namespace, selectedKeys, anchorKey, page } = view;
  const namespaces = useMemo(() => [...new Set(records.map((record) => record.namespace))].sort(), [records]);
  const candidates = useMemo(() => filterMolecularConcordanceCandidates(records, { query, namespace }), [namespace, query, records]);

  useEffect(() => {
    if (indexState.status !== "ready" || !verifiedDecodedSha256) return;
    const restore = () => {
      const result = readMolecularConcordanceBookmark(window.location.search, authority);
      setBookmark({
        verifiedDecodedSha256, view: result.view, error: result.error,
        href: result.status === "invalid" ? "" : `${window.location.pathname}${window.location.search}${window.location.hash}`,
      });
      setNotice(result.status === "ready" ? "Comparison restored from its address using the current verified source index." : "");
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [authority, indexState.status, verifiedDecodedSha256]);

  function updateView(next: MolecularConcordanceViewState, historyMode: "push" | "replace" = "push", clear = false) {
    if (!bookmarkReady) return;
    const url = new URL(window.location.href);
    const params = makeMolecularConcordanceBookmarkParams(url.searchParams, authority, next, { clear });
    url.search = params.toString();
    const href = `${url.pathname}${url.search}${url.hash}`;
    if (href !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      // Retain the router's state and every unrelated query/hash field.
      window.history[historyMode === "replace" ? "replaceState" : "pushState"](window.history.state, "", href);
    }
    setBookmark({ verifiedDecodedSha256, view: next, error: "", href });
    setNotice("");
  }
  const selected = useMemo(() => selectedKeys.map((key) => records.find((record) => record.key === key)).filter((record) => record !== undefined), [records, selectedKeys]);
  const report = useMemo(() => selected.length >= 2 && selected.length === selectedKeys.length && selectedKeys.includes(anchorKey)
    ? buildMolecularConcordance(records, { anchorKey, selectedKeys, sourceScopes }) : null, [anchorKey, records, selected.length, selectedKeys]);
  const add = (key: string) => {
    if (!bookmarkReady || selectedKeys.includes(key) || selectedKeys.length >= 4) return;
    updateView({ ...view, selectedKeys: [...selectedKeys, key], anchorKey: anchorKey || key });
  };
  const remove = (key: string) => {
    const retained = selectedKeys.filter((item) => item !== key);
    updateView({ ...view, selectedKeys: retained, anchorKey: anchorKey === key ? retained[0] ?? "" : anchorKey });
  };
  return <section className="molecular-concordance" aria-labelledby="molecular-concordance-title">
    <header><p>UPG-106 · SOURCE ASSERTIONS</p><h4 id="molecular-concordance-title">Compare exact marker strings around an anchor record</h4><p>Select 2–4 source profiles, then choose an anchor. Shared strings and context differences support inspection; identity remains not established.</p></header>
    {indexState.status !== "ready" && <p role={indexState.status === "unavailable" ? "alert" : "status"}>{indexState.status === "unavailable" ? indexState.error : "Waiting for the checksum-verified source index…"}</p>}
    {indexState.status === "ready" && !verifiedDecodedSha256 && <p role="alert">The verified source-index receipt is unavailable. Comparison selection and export are unavailable.</p>}
    {indexState.status === "ready" && !bookmarkReady && verifiedDecodedSha256 && <p role="status">Preparing the saved comparison…</p>}
    {bookmarkReady && bookmark.error && <p role="alert">{bookmark.error} No saved profiles were substituted. Select current source profiles or reset the comparison.</p>}
    {bookmarkReady && notice && <p role="status">{notice}</p>}
    {indexState.status === "ready" && <>
      <p>{records.length} source profiles across {namespaces.length} namespaces · zero deduplication</p>
      <div className="molecular-concordance-controls"><label>Source namespace<select value={namespace} disabled={!bookmarkReady} onChange={(event) => updateView({ ...view, namespace: event.target.value, page: 0 }, "replace")}><option value="">All source namespaces</option>{namespaces.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Search label, ID or source marker<input type="search" value={query} maxLength={MOLECULAR_CONCORDANCE_QUERY_LIMIT} disabled={!bookmarkReady} onChange={(event) => updateView({ ...view, query: event.target.value, page: 0 }, "replace")} /></label><button type="button" disabled={!bookmarkReady} onClick={() => updateView(emptyMolecularConcordanceView(), "push", true)}>Reset comparison</button></div>
      <p>Candidate filters leave your selected source profiles in the comparison. Reopening this address restores its profiles, anchor, filters and page against the current verified index.</p>
      <ul className="molecular-concordance-candidates" aria-label="Concordance source profiles">{candidates.slice(page * MOLECULAR_CONCORDANCE_PAGE_SIZE, (page + 1) * MOLECULAR_CONCORDANCE_PAGE_SIZE).map((record) => <li key={record.key}><button type="button" disabled={!bookmarkReady || selectedKeys.includes(record.key) || selectedKeys.length >= 4} onClick={() => add(record.key)}><strong>{record.title}</strong><span>{record.namespace}</span><small>{selectedKeys.includes(record.key) ? "Selected" : "Add to comparison"}</small></button></li>)}</ul>
      {!candidates.length && <p>No matching exact source profile.</p>}
      <nav aria-label="Concordance source pages"><button type="button" disabled={!bookmarkReady || page === 0} onClick={() => updateView({ ...view, page: page - 1 })}>Previous</button><span>{candidates.length} matches · page {page + 1} / {Math.max(1, Math.ceil(candidates.length / MOLECULAR_CONCORDANCE_PAGE_SIZE))}</span><button type="button" disabled={!bookmarkReady || (page + 1) * MOLECULAR_CONCORDANCE_PAGE_SIZE >= candidates.length} onClick={() => updateView({ ...view, page: page + 1 })}>Next</button></nav>
      {selected.length > 0 && <div className="molecular-concordance-selections"><label>Anchor record<select value={anchorKey} onChange={(event) => updateView({ ...view, anchorKey: event.target.value })}>{selected.map((record) => <option key={record.key} value={record.key}>{record.title} · {record.namespace}</option>)}</select></label>{selected.map((record) => <button type="button" key={record.key} onClick={() => remove(record.key)}>Remove {record.title} · {record.namespace}</button>)}</div>}
      {!report && <p role="status">{selectedKeys.length < 2 ? "Select at least two exact source profiles." : "A selected source record is unavailable; no replacement comparison is generated."}</p>}
      {report && <>
        <div className="molecular-concordance-exports"><a href={bookmark.href}>Link to this comparison</a><button type="button" onClick={() => download(JSON.stringify(report, null, 2) + "\n", "molecular-concordance.json", "application/json")}>Export evidence JSON</button><button type="button" onClick={() => download(molecularConcordanceCsv(report), "molecular-concordance.csv", "text/csv;charset=utf-8")}>Export comparison CSV</button></div>
        {report.comparisons.map((pair) => {
          const anchor = report.profiles.find((profile) => profile.key === pair.anchorKey)!;
          const comparison = report.profiles.find((profile) => profile.key === pair.comparisonKey)!;
          return <article className="molecular-concordance-pair" key={pair.comparisonKey}><h5>{anchor.title} → {comparison.title}</h5><p>{anchor.namespace} → {comparison.namespace}</p>
            <div className="molecular-concordance-shared"><strong>{comparisonLabel(pair.markers.status)}</strong><p>Shared exact strings: {pair.markers.status === "unknown" ? "not assessable" : pair.markers.sharedExactStrings.join(" · ") || "none in the retained display panels"}</p><small>Overlap does not establish the same type or cell; zero overlap does not establish marker absence.</small></div>
            <div className="molecular-concordance-table" role="region" aria-label="Scrollable exact source comparison"
              // Keyboard focus enables horizontal evidence-table scrolling on narrow screens.
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}><table><thead><tr><th scope="col">Dimension</th><th scope="col">Anchor assertion</th><th scope="col">Comparison assertion</th><th scope="col">Assessment</th></tr></thead><tbody><tr><th scope="row">Retained marker / feature strings</th><td>{anchor.markers.exactStrings.join(" · ") || "Unknown"}<small>{anchor.markers.sourceRowLabel} · {anchor.markers.locator}</small></td><td>{comparison.markers.exactStrings.join(" · ") || "Unknown"}<small>{comparison.markers.sourceRowLabel} · {comparison.markers.locator}</small></td><td>{comparisonLabel(pair.markers.status)}</td></tr>{(["transmitter", "region", "life_stage"] as const).map((dimension) => {
              const field = pair.fields[dimension];
              return <tr key={dimension}><th scope="row">{dimension.replaceAll("_", " ")}</th><td>{field.anchorEvidence.rawValue ?? "Unknown"}<small>{field.anchorEvidence.locator}</small></td><td>{field.comparisonEvidence.rawValue ?? "Unknown"}<small>{field.comparisonEvidence.locator}</small></td><td>{comparisonLabel(field.status)}</td></tr>;
            })}</tbody></table></div>
            <details><summary>Source conflicts and complete evidence receipts ({anchor.sourceConflicts.length + comparison.sourceConflicts.length} retained conflicts / discrepancies)</summary><p>Different context strings can reflect cohort or vocabulary scope. Source-reported conflicts remain separately listed without automatic resolution.</p><pre>{JSON.stringify({ sourceConflicts: pair.sourceConflicts, anchor: anchor, comparison: comparison }, null, 2)}</pre></details>
          </article>;
        })}
      </>}
      <details><summary>How this comparison treats source evidence</summary><p>Exact display strings retain case, qualifiers and their evidence labels. Differential features stay differential features; raw source labels are never tokenized into genes. Anatomical context and age remain source assertions, with explicit unknowns when fields are missing. This workbench creates no similarity score, type identity, same-cell relation, pooled cell denominator or cell geometry.</p></details>
    </>}
  </section>;
}
