"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import document from "../data/cano-chol-rna-counts-0.1.json";
import {
  canoCholRnaPairCsv, canoCholRnaPairReceipt, canoCholRnaPairStatistics,
  findCanoCholRnaFeatures, loadCanoCholRnaPair, validateCanoCholRnaDocument,
  type CanoRnaPair,
} from "./cano-chol-rna-counts.js";

const doc = validateCanoCholRnaDocument(document);
type Load = { status: "loading" } | { status: "failed"; message: string } | { status: "ready"; pair: CanoRnaPair };
function download(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = window.document.createElement("a"); link.href = url; link.download = filename;
  window.document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PairCounts({ firstFeature, secondFeature, profileId, selectedKey }: {
  firstFeature: string; secondFeature: string; profileId: string; selectedKey: string | null;
}) {
  const id = useId(), table = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void loadCanoCholRnaPair(doc, firstFeature, secondFeature, { signal: controller.signal })
      .then(pair => { if (!controller.signal.aborted) setLoad({ status: "ready", pair }); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setLoad({ status: "failed", message: error instanceof Error ? error.message : "Source pair verification failed" }); });
    return () => controller.abort();
  }, [firstFeature, secondFeature, attempt]);
  const result = load.status === "ready" ? canoCholRnaPairStatistics(doc, load.pair, profileId, selectedKey) : null;
  const receipt = load.status === "ready" ? canoCholRnaPairReceipt(doc, load.pair, profileId, selectedKey) : null;
  return <section data-testid="cano-rna-pair-result" data-first-feature={firstFeature} data-second-feature={secondFeature} aria-labelledby={`${id}-title`}>
    <h5 id={`${id}-title`}>{firstFeature} and {secondFeature} · raw count partitions</h5>
    {load.status === "loading" && <p role="status">Loading and verifying both source feature counts…</p>}
    {load.status === "failed" && <div role="alert"><p>{load.message}. Pair counts and exports are unavailable.</p><button type="button" onClick={() => { setLoad({ status: "loading" }); setAttempt(value => value + 1); }}>Retry both source features</button></div>}
    {result && receipt && load.status === "ready" && <>
      <p data-testid="cano-rna-pair-current-profile"><strong>{result.currentProfile.rawLabel}</strong> · {result.currentProfile.nucleusCount} source nuclei: both positive {result.currentProfile.bothPositive}, {firstFeature} only {result.currentProfile.firstOnly}, {secondFeature} only {result.currentProfile.secondOnly}, neither positive {result.currentProfile.neitherPositive}.</p>
      <p>Positive means the raw RNA count is greater than zero in the same source column. These four groups include every nucleus in the complete source profile; roster search and page filters do not change this denominator. Zero means undetected in this counts layer.</p>
      {result.selectedNucleus ? <article className="cano-rna-nucleus" data-testid="cano-rna-pair-selected-nucleus">
        <h6>Current source nucleus · {result.selectedNucleus.nativeId}</h6>
        <dl><div><dt>{firstFeature} raw count</dt><dd>{result.selectedNucleus.firstCount}</dd></div><div><dt>{secondFeature} raw count</dt><dd>{result.selectedNucleus.secondCount}</dd></div><div><dt>All-feature RNA count</dt><dd>{result.selectedNucleus.totalRnaCount.toLocaleString("en-US")}</dd></div><div><dt>Original metadata row / counts column</dt><dd>{result.selectedNucleus.metadataRow} / {result.selectedNucleus.countsColumn}</dd></div><div><dt>Original feature rows</dt><dd>{result.sourceFeatureRows.join(" / ")}</dd></div></dl>
      </article> : <p data-testid="cano-rna-pair-no-nucleus">Select a nucleus in the current roster to inspect its two exact raw counts.</p>}
      <details><summary>Compare the raw count partitions across 11 source profiles</summary>
        <div ref={table} id={`${id}-table`} className="cano-rna-table" role="region" aria-label="Two-feature source RNA count partitions">
          <table><thead><tr><th>Exact source label</th><th>All nuclei</th><th>Both positive</th><th>{firstFeature} only</th><th>{secondFeature} only</th><th>Neither positive</th></tr></thead>
            <tbody>{result.profiles.map(profile => <tr key={profile.profileId} aria-current={profile.profileId === profileId ? "true" : undefined}><th scope="row">{profile.rawLabel}</th><td>{profile.nucleusCount}</td><td>{profile.bothPositive}</td><td>{profile.firstOnly}</td><td>{profile.secondOnly}</td><td>{profile.neitherPositive}</td></tr>)}</tbody>
          </table>
        </div><div className="cano-rna-actions"><button type="button" aria-controls={`${id}-table`} onClick={() => table.current?.scrollBy({ left: -200 })}>Scroll pair table left</button><button type="button" aria-controls={`${id}-table`} onClick={() => table.current?.scrollBy({ left: 200 })}>Scroll pair table right</button></div>
      </details>
      <p>Raw counts depend on library depth. Co-detection does not establish a marker, correlation, co-regulation, function or classification. P56 remains source dataset context; animal, ATAC and cross-study identities are unverified.</p>
      <div className="cano-rna-actions"><button type="button" onClick={() => download(JSON.stringify(receipt, null, 2) + "\n", `cano-chol-rna-pair-${firstFeature}-${secondFeature}.json`, "application/json")}>Export pair summary JSON</button><button type="button" onClick={() => download(canoCholRnaPairCsv(doc, load.pair, profileId), `cano-chol-rna-pair-${firstFeature}-${secondFeature}-profile.csv`, "text/csv;charset=utf-8")}>Export {result.currentProfile.nucleusCount} two-feature nucleus rows CSV</button></div>
      <details><summary>Exact pair counts and source proof</summary><label htmlFor={`${id}-json`}>Current source pair JSON</label><textarea id={`${id}-json`} readOnly rows={10} value={JSON.stringify(receipt, null, 2)} /><p>Both compressed and decoded chunk bytes verified. At most two existing chunks are fetched; the original RDS is retained for offline replay. This JSON contains source count facts, not a captured viewport.</p><a href={doc.source.url} target="_blank" rel="noreferrer">Original CHOL source RDS</a></details>
    </>}
  </section>;
}

export default function CanoCholInRnaPairCounts({ firstFeature, profileId, selectedKey }: {
  firstFeature: string; profileId: string; selectedKey: string | null;
}) {
  const id = useId(), initial = firstFeature === "Pitx2" ? "Chat" : "Pitx2";
  const [query, setQuery] = useState(initial), [secondFeature, setSecondFeature] = useState(initial);
  const matches = useMemo(() => findCanoCholRnaFeatures(doc, query), [query]);
  return <section data-testid="cano-chol-rna-pair-counts" aria-labelledby={`${id}-title`}>
    <h5 id={`${id}-title`}>Two features in the same source RNA columns</h5>
    <p>First feature: <strong>{firstFeature}</strong>. Choose a distinct second feature from the deposited counts layer.</p>
    <label htmlFor={`${id}-search`}>Find the second source RNA feature<input id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <p role="status">{matches.total.toLocaleString("en-US")} matching source features; showing up to 15. Second feature: {secondFeature}.</p>
    <div className="cano-rna-features" aria-label="Second source RNA feature choices">{matches.features.map(feature => <button key={feature.sourceRow} type="button" disabled={feature.name === firstFeature} aria-pressed={feature.name === secondFeature} onClick={() => setSecondFeature(feature.name)}>{feature.name}</button>)}</div>
    {!matches.total && <p>No source feature matches this search. The current second feature remains {secondFeature}; missing genes are not assigned zero.</p>}
    <PairCounts key={JSON.stringify([profileId, firstFeature, secondFeature])} firstFeature={firstFeature} secondFeature={secondFeature} profileId={profileId} selectedKey={selectedKey} />
  </section>;
}
