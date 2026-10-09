"use client";
import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import document from "../data/cano-chol-rna-counts-0.1.json";
import { canoCholRnaCsv, canoCholRnaReceipt, canoCholRnaStatistics, findCanoCholRnaFeatures, loadCanoCholRnaChunk, validateCanoCholRnaDocument, type CanoRnaChunk } from "./cano-chol-rna-counts.js";
import "./cano-chol-rna-counts.css";

const doc = validateCanoCholRnaDocument(document);
const CanoCholInRnaPairCounts = lazy(() => import("./CanoCholInRnaPairCounts"));
type Load = { status: "loading" } | { status: "failed"; message: string } | { status: "ready"; chunk: CanoRnaChunk };
function download(value: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const a = window.document.createElement("a"); a.href = url; a.download = filename; window.document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function FeatureCounts({ feature, profileId, selectedKey }: { feature: string; profileId: string; selectedKey: string | null }) {
  const id = useId();
  const comparisonTable = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadCanoCholRnaChunk(doc, feature, { signal: controller.signal }).then(chunk => { if (!controller.signal.aborted) setLoad({ status: "ready", chunk }); }).catch((error: unknown) => { if (!controller.signal.aborted) setLoad({ status: "failed", message: error instanceof Error ? error.message : "Source counts verification failed" }); });
    return () => controller.abort();
  }, [feature, attempt]);
  const result = load.status === "ready" ? canoCholRnaStatistics(doc, load.chunk, feature, profileId, selectedKey) : null;
  const receipt = load.status === "ready" ? canoCholRnaReceipt(doc, load.chunk, feature, profileId, selectedKey) : null;
  return <section aria-labelledby={`${id}-title`} data-testid="cano-chol-rna-feature" data-feature={feature}>
    <h5 id={`${id}-title`}>Source RNA feature · {feature}</h5>
    {load.status === "loading" && <p role="status">Loading and verifying source counts for {feature}…</p>}
    {load.status === "failed" && <div role="alert"><p>{load.message}. Counts and exports are unavailable.</p><button type="button" onClick={() => { setLoad({ status: "loading" }); setAttempt(a => a + 1); }}>Retry source RNA counts</button></div>}
    {result && receipt && load.status === "ready" && <>
      <p data-testid="cano-rna-current-profile"><strong>{result.currentProfile.rawLabel}</strong> · {result.currentProfile.detectedNuclei} / {result.currentProfile.nucleusCount} nuclei with a positive {feature} count · total count {result.currentProfile.totalCount.toLocaleString("en-US")} · median {result.currentProfile.medianCount} · mean {result.currentProfile.meanCount.toFixed(2)}.</p>
      <p>Summaries use every nucleus in each source profile. Zero means undetected in this counts layer. Raw counts depend on library depth.</p>
      {result.selectedNucleus ? <article className="cano-rna-nucleus" data-testid="cano-rna-selected-nucleus"><h6>Current nucleus · {result.selectedNucleus.nativeId}</h6><dl><div><dt>{feature} raw count</dt><dd>{result.selectedNucleus.count}</dd></div><div><dt>All-feature RNA count</dt><dd>{result.selectedNucleus.totalRnaCount.toLocaleString("en-US")}</dd></div><div><dt>Detected RNA features</dt><dd>{result.selectedNucleus.detectedFeatureCount.toLocaleString("en-US")}</dd></div><div><dt>Original metadata row / counts column</dt><dd>{result.selectedNucleus.metadataRow} / {result.selectedNucleus.countsColumn}</dd></div></dl><p>Feature row {result.sourceFeatureRow}; cells/features names resolved from the source counts-layer LogMaps.</p></article> : <p data-testid="cano-rna-no-nucleus">Select a nucleus in the current roster to inspect its own {feature} count.</p>}
      <details className="cano-rna-comparison"><summary>Compare {feature} counts across the 11 source CHOL_IN profiles</summary><div ref={comparisonTable} id={`${id}-comparison`} className="cano-rna-table" role="region" aria-label="Source RNA profile count comparison"><table><thead><tr><th>Exact source label</th><th>Positive / all nuclei</th><th>Total raw count</th><th>Median</th><th>Mean</th><th>Maximum</th></tr></thead><tbody>{result.profiles.map(p => <tr key={p.profileId} aria-current={p.profileId === profileId ? "true" : undefined}><th scope="row">{p.rawLabel}</th><td>{p.detectedNuclei} / {p.nucleusCount}</td><td>{p.totalCount}</td><td>{p.medianCount}</td><td>{p.meanCount.toFixed(2)}</td><td>{p.maximumCount}</td></tr>)}</tbody></table></div><div className="cano-rna-actions"><button type="button" aria-controls={`${id}-comparison`} onClick={() => comparisonTable.current?.scrollBy({ left:-200 })}>Scroll RNA table left</button><button type="button" aria-controls={`${id}-comparison`} onClick={() => comparisonTable.current?.scrollBy({ left:200 })}>Scroll RNA table right</button></div></details>
      <div className="cano-rna-actions"><button type="button" onClick={() => download(JSON.stringify(receipt, null, 2) + "\n", `cano-chol-rna-${feature}.json`, "application/json")}>Export {feature} count summary JSON</button><button type="button" onClick={() => download(canoCholRnaCsv(doc, load.chunk, feature, profileId), `cano-chol-rna-${feature}-profile.csv`, "text/csv;charset=utf-8")}>Export {result.currentProfile.nucleusCount} nucleus counts CSV</button></div>
      <details><summary>Current RNA count JSON preview and source proof</summary><label htmlFor={`${id}-json`}>Exact current RNA count receipt</label><textarea id={`${id}-json`} readOnly rows={10} value={JSON.stringify(receipt, null, 2)} /><p>Counts are separate from normalized data and scaled values; they do not establish markers or differential expression. Both compressed and decoded bytes verified for this request. The original RDS was checked during offline extraction; it is not downloaded in the browser. RNA counts columns match these metadata rows; RNA/ATAC pairing and cross-study cell identity are unverified.</p><a href={doc.source.url} target="_blank" rel="noreferrer">Original CHOL RDS</a></details>
    </>}
  </section>;
}
export default function CanoCholInRnaCounts({ profileId, selectedKey }: { profileId: string; selectedKey: string | null }) {
  const id = useId(); const [query, setQuery] = useState("Chat"); const [feature, setFeature] = useState("Chat");
  const [pairOpen, setPairOpen] = useState(false);
  const matches = useMemo(() => findCanoCholRnaFeatures(doc, query), [query]);
  return <section className="cano-rna-counts" data-testid="cano-chol-rna-counts" aria-labelledby={`${id}-title`}>
    <h4 id={`${id}-title`}>Deposited RNA counts</h4><p>{doc.genes.length.toLocaleString("en-US")} source features · 923 CHOL_IN nuclei. Raw RNA counts, without normalization.</p>
    <label htmlFor={`${id}-find`}>Find source RNA feature<input id={`${id}-find`} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Chat, Pitx2, Skor2" /></label>
    <p role="status">{matches.total.toLocaleString("en-US")} matching source features; showing up to 15. Current feature: {feature}.</p><div className="cano-rna-features" aria-label="Matching source RNA features">{matches.features.map(g => <button key={g.sourceRow} type="button" aria-pressed={g.name === feature} onClick={() => setFeature(g.name)}>{g.name}</button>)}</div>
    {!matches.total && <p>No source feature matches this search. The current verified feature remains {feature}; no missing gene is assigned zero.</p>}
    <FeatureCounts key={feature} feature={feature} profileId={profileId} selectedKey={selectedKey} />
    <details onToggle={event => setPairOpen(event.currentTarget.open)} data-testid="cano-rna-pair-disclosure"><summary>Compare two source RNA features</summary>{pairOpen && <Suspense fallback={<p role="status">Loading the two-feature source browser…</p>}><CanoCholInRnaPairCounts key={JSON.stringify([profileId, feature])} firstFeature={feature} profileId={profileId} selectedKey={selectedKey} /></Suspense>}</details>
  </section>;
}
