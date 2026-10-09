"use client";

import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import registry from "../data/cano-gomez-p56-multiome-interneuron-registry-0.1.json";
import { canoCholInNucleusCsv, canoCholInNucleusReceipt, findCanoCholInProfile, listCanoCholInNuclei, loadCanoCholInRoster, selectedCanoCholInNucleus, type CanoCholInProfile, type CanoNucleusRow, type CanoVerifiedRoster } from "./cano-chol-in-nucleus-roster.js";
import styles from "./CanoCholInNucleusRoster.module.css";
import { canoSourceIdentityHierarchy, canoSourcePopulationEvidence, resolveSourceRelationship } from "./source-object-identity.js";
import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
const CanoCholInRnaCounts = lazy(() => import("./CanoCholInRnaCounts"));

type Load = { status: "loading" } | { status: "failed"; message: string } | { status: "ready"; roster: CanoVerifiedRoster };
const sourceText = (value: string | null) => value === null ? "Source NA · unknown" : value === "" ? "Source empty string" : value;
function download(value: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ProfileRoster({ profile }: { profile: CanoCholInProfile }) {
  const id = useId();
  const table = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [anatomy, setAnatomy] = useState("*");
  const [sex, setSex] = useState("*");
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [rnaOpen, setRnaOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    loadCanoCholInRoster(registry, { signal: controller.signal }).then((roster) => { if (!controller.signal.aborted) setLoad({ status: "ready", roster }); }).catch((error: unknown) => { if (!controller.signal.aborted) setLoad({ status: "failed", message: error instanceof Error ? error.message : "Source roster verification failed" }); });
    return () => controller.abort();
  }, []);
  const result = useMemo(() => load.status === "ready" ? listCanoCholInNuclei(load.roster, profile.profileId, { query, anatomy: anatomy === "*" ? undefined : JSON.parse(anatomy) as string | null, sex: sex === "*" ? undefined : JSON.parse(sex) as string | null, page, pageSize: 20 }) : null, [load, profile.profileId, query, anatomy, sex, page]);
  const selected = result ? selectedCanoCholInNucleus(result, selectedKey) : null;
  const sourceIdentity = load.status === "ready" ? canoSourceIdentityHierarchy(registry, load.roster, profile.profileId, selected?.key ?? null) : null;
  const sourcePopulationRelation = (() => {
    if (!selected || load.status !== "ready" || !sourceIdentity) return null;
    const aggregate = canoSourceIdentityHierarchy(registry, load.roster, profile.profileId);
    const evidence = canoSourcePopulationEvidence(registry, load.roster, profile.profileId, null, selected.key);
    return resolveSourceRelationship(aggregate, sourceIdentity, "same_source_population", evidence, [evidence]);
  })();
  const contextOptions = (field: string) => result ? [...new Set(result.sourceRows.map((row) => row.raw[field]))].sort((a, b) => sourceText(a).localeCompare(sourceText(b), "en")) : [];
  const exportJson = (rows: readonly CanoNucleusRow[], scope: string) => {
    if (load.status !== "ready") return;
    const identity = canoSourceIdentityHierarchy(registry, load.roster, profile.profileId, scope === "selected_nucleus_row" ? rows[0]?.key ?? null : null);
    download(JSON.stringify({ ...canoCholInNucleusReceipt(registry, load.roster, profile.profileId, rows, scope), sourceIdentity: identity,
      ...(scope === "selected_nucleus_row" ? { sourcePopulationRelation } : {}) }, null, 2) + "\n", `cano-chol-in-${profile.profileId}-${scope}.json`, "application/json");
  };
  return <section className={styles.panel} aria-labelledby={`${id}-title`} data-testid="cano-chol-in-nucleus-roster" data-profile-id={profile.profileId}>
    <header><small>Exact source-local nucleus assignments · GSE318731</small><h4 id={`${id}-title`}>Nucleus roster · {profile.sourceLocalLabel}</h4><p>{profile.nucleusCount} nuclei in this profile · source dataset age context P56 · 11 confirmed CHOL_IN profiles / 923 roster rows in total.</p></header>
    <p className={styles.boundary}>Each row is an exact deposited metadata-row assignment. P56 is dataset context. Raw anatomy, source and Sex fields retain their source values; source keys are not animal IDs. No coordinates, cell geometry, cross-assay or cross-study same-cell identity is established.</p>
    {load.status === "loading" && <p role="status">Loading and verifying the existing nucleus roster…</p>}
    {load.status === "failed" && <p role="alert">{load.message}. No nucleus rows are displayed.</p>}
    {result && <>
      <div className={styles.controls}>
        <label htmlFor={`${id}-query`}>Find native ID or source context<input id={`${id}-query`} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); setSelectedKey(null); }} placeholder="e.g. GATCGAGC, AC03" /></label>
        <label htmlFor={`${id}-anatomy`}>Raw source anatomy<select id={`${id}-anatomy`} value={anatomy} onChange={(event) => { setAnatomy(event.target.value); setPage(0); setSelectedKey(null); }}><option value="*">All source values</option>{contextOptions("anatomy").map((value) => <option key={JSON.stringify(value)} value={JSON.stringify(value)}>{sourceText(value)}</option>)}</select></label>
        <label htmlFor={`${id}-sex`}>Raw source Sex<select id={`${id}-sex`} value={sex} onChange={(event) => { setSex(event.target.value); setPage(0); setSelectedKey(null); }}><option value="*">All source values</option>{contextOptions("Sex").map((value) => <option key={JSON.stringify(value)} value={JSON.stringify(value)}>{sourceText(value)}</option>)}</select></label>
      </div>
      <p role="status">{result.matchedCount} matching source-local nucleus rows / {result.profileCount} in the current profile. Counts describe this source roster, not prevalence or independent animals.</p>
      <p id={`${id}-table-help`} className={styles.tableHelp}>Focus a nucleus ID and use Left / Right to scroll the source table.</p>
      <div ref={table} className={styles.table} role="region" aria-label="Scrollable exact nucleus roster" aria-describedby={`${id}-table-help`}>
        <table><thead><tr><th>Native nucleus ID</th><th>Raw source anatomy</th><th>Raw source key</th><th>Raw source Sex</th></tr></thead><tbody>{result.rows.map((row) => <tr key={row.key}><td><button type="button" aria-pressed={selected?.key === row.key} onClick={() => setSelectedKey(row.key)} onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); table.current?.scrollBy({ left: event.key === "ArrowLeft" ? -120 : 120 }); } }}>{row.raw.source_nucleus_id}</button></td><td>{sourceText(row.raw.anatomy)}</td><td>{sourceText(row.raw.source)}</td><td>{sourceText(row.raw.Sex)}</td></tr>)}</tbody></table>
      </div>
      {result.matchedCount === 0 && <p>No verified nucleus rows match these filters.</p>}
      <nav className={styles.actions} aria-label="Nucleus roster pages"><button type="button" disabled={result.currentPage === 0} onClick={() => { setPage(result.currentPage - 1); setSelectedKey(null); }}>Previous</button><span>{result.currentPage + 1} / {result.pageCount}</span><button type="button" disabled={result.currentPage + 1 >= result.pageCount} onClick={() => { setPage(result.currentPage + 1); setSelectedKey(null); }}>Next</button></nav>
      {selected ? <article className={styles.detail} aria-live="polite"><h5>Selected native nucleus ID · {selected.raw.source_nucleus_id}</h5><dl>
        <div><dt>Exact compound identity</dt><dd>{selected.key}</dd></div><div><dt>Observation unit</dt><dd>{selected.unit.replaceAll("_", " ")}</dd></div>
        <div><dt>Source age context</dt><dd>{selected.ageContext.value} · dataset context; per-nucleus age measurement unknown</dd></div>
        <div><dt>Source assignment</dt><dd>groups={selected.raw.groups}; neuron_types={selected.raw.neuron_types}; metadata row-name authority</dd></div>
        <div><dt>Active assay / active identity</dt><dd>{sourceText(selected.raw.source_active_assay)} / {sourceText(selected.raw.source_active_ident)}</dd></div>
        <div><dt>Source locator</dt><dd>{selected.sourceLocator}</dd></div><div><dt>Original metadata locator</dt><dd>{selected.originalMetadataLocator}</dd></div>
      </dl><button type="button" onClick={() => exportJson([selected], "selected_nucleus_row")}>Export selected nucleus JSON</button><button type="button" onClick={() => setSelectedKey(null)}>Clear nucleus selection</button><details><summary>All 22 exact source/audit fields</summary><dl>{Object.entries(selected.raw).map(([field, value]) => <div key={field}><dt>{field}</dt><dd>{sourceText(value)}</dd></div>)}</dl></details></article> : <p>Select a native nucleus row to inspect its exact identity and fields. Previous profile or filtered-out selections are cleared.</p>}
      <div className={styles.actions}><button type="button" disabled={!result.matchedCount} onClick={() => exportJson(result.filteredRows, "filtered_profile_rows")}>Export {result.matchedCount} matched rows JSON</button><button type="button" disabled={!result.matchedCount || load.status !== "ready"} onClick={() => { if (load.status === "ready") download(canoCholInNucleusCsv(registry, load.roster, profile.profileId, result.filteredRows), `cano-chol-in-${profile.profileId}-matched-rows.csv`, "text/csv;charset=utf-8"); }}>Export {result.matchedCount} matched rows CSV</button></div>
      <details data-testid="cano-chol-rna-disclosure" onToggle={event => setRnaOpen(event.currentTarget.open)}><summary style={{ minHeight:44, display:"flex", alignItems:"center", cursor:"pointer" }}>Explore source RNA counts · 32,285 features</summary>{rnaOpen && <Suspense fallback={<p role="status">Loading the source RNA feature browser…</p>}><CanoCholInRnaCounts profileId={profile.profileId} selectedKey={selected?.key ?? null} /></Suspense>}</details>
    </>}
    {sourceIdentity && <SourceIdentityHierarchyPanel hierarchy={sourceIdentity} relationship={sourcePopulationRelation} />}
    <details><summary>Source receipt and identity limits</summary><p>{registry.identityAuthority.boundary}</p><p>{registry.sourceReferences.publication.rightsBoundary}</p><p>This nucleus-roster request loads the existing factual derivative; it does not fetch the original RDS. The separate RNA browser uses counts derived from the checksum-pinned CHOL object. The exact decoded roster, per-profile counts and ordered compound identity checksums verify before display. When HTTP has already decoded gzip, the compressed hash remains a build receipt and the runtime receipt states that distinction.</p><a href={registry.sourceReferences.dataRepository.url} target="_blank" rel="noreferrer">Exact GEO source</a><span> · </span><a href={registry.sourceReferences.publication.articleUrl} target="_blank" rel="noreferrer">Source publication</a></details>
  </section>;
}

/** Exact Cano profile IDs only. The keyed child synchronously clears old rows/detail. */
export default function CanoCholInNucleusRoster({ profileId }: { profileId: string | null }) {
  const profile = findCanoCholInProfile(registry, profileId);
  return profile ? <ProfileRoster key={profile.profileId} profile={profile} /> : <p role="status" data-testid="cano-roster-unavailable">No bundled exact Cano CHOL_IN roster is admitted for this profile. No nucleus individuals are generated.</p>;
}
