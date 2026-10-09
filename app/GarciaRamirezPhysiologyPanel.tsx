"use client";

import { useEffect, useState } from "react";
import { garciaRamirezPhysiologyFacts as facts, garciaRamirezSourceTable, garciaRamirezPropertyRows, readGarciaRamirezPhysiologyView, type GarciaRamirezPhysiologyView } from "./garcia-ramirez-physiology.js";
import "./garcia-ramirez-physiology.css";

const partitionLabels = ["Reporter populations", "Firing patterns", "Four k-means groups", "Six hierarchical groups"];
const locatorText = (locator: { tableOrdinal: number; rowOneBased: number; columnOneBased: number }) => `Data Sheet 1 · table ${locator.tableOrdinal}, row ${locator.rowOneBased}, column ${locator.columnOneBased}`;

export default function GarciaRamirezPhysiologyPanel() {
  const [view, setView] = useState<GarciaRamirezPhysiologyView>({ tableId: null, query: "", error: null });
  const [ready, setReady] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  useEffect(() => {
    const restore = () => { setView(readGarciaRamirezPhysiologyView(new URLSearchParams(window.location.search))); setExportStatus(""); setReady(true); };
    restore(); window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const table = view.error ? null : garciaRamirezSourceTable(view.tableId);
  const rows = table ? garciaRamirezPropertyRows(table, view.query) : [];
  const select = (changed: { tableId?: string; query?: string }) => {
    const url = new URL(window.location.href);
    if (changed.tableId !== undefined) url.searchParams.set("physiologyTable", changed.tableId);
    if (changed.query !== undefined) {
      if (changed.query) url.searchParams.set("physiologyQuery", changed.query);
      else url.searchParams.delete("physiologyQuery");
    }
    setView(readGarciaRamirezPhysiologyView(url.searchParams)); setExportStatus("");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  };
  return <section className="garcia-ramirez-physiology" aria-label="Garcia-Ramirez adult spinal electrophysiology" data-source-study="garcia-ramirez-2022">
    <header><p>ADULT MOUSE · LUMBAR SPINAL CORD</p><h3>Shox2 and Chx10 electrophysiology</h3><p>Explore the published membrane-property summaries and the study’s alternative ways of grouping recorded neurons.</p></header>
    <div className="garcia-physiology-context">
      <div><strong>171 recorded neurons</strong><span>143 Shox2 · 28 Chx10 observations</span></div>
      <div><strong>8–25 weeks</strong><span>Study age range · L2–L5 slices</span></div>
      <div><strong>Mean ± SD</strong><span>Whole-cell recordings · source-reported summaries</span></div>
    </div>
    <p>Reporter, firing, k-means and hierarchical groups partition the same 171-observation study pool. Group counts retain that denominator; individual animal assignments are unavailable.</p>
    <div className="garcia-physiology-controls">
      <label>Published grouping<select value={view.tableId ?? ""} disabled={!ready} onChange={event => select({ tableId: event.target.value })}>
        {!table && <option value="" disabled>{ready ? "Choose a source table" : "Preparing source tables…"}</option>}
        {facts.tables.map((sourceTable, index) => <option key={sourceTable.id} value={`ST${index + 1}`}>{partitionLabels[index]} · {sourceTable.sourceTableLabel}</option>)}
      </select></label>
      <label>Find a membrane property<input value={view.query} disabled={!ready || !garciaRamirezSourceTable(view.tableId)} onChange={event => select({ query: event.target.value })} placeholder="e.g. resistance or rheobase" /></label>
      <form action="/api/study-facts/garcia-ramirez-2022" method="get" onSubmit={() => setExportStatus("Download requested. Your browser saves the file, which includes all four source tables, sampling context and source receipts.")}>
        <input type="hidden" name="physiologyTable" value={view.tableId ?? ""} />
        <input type="hidden" name="physiologyQuery" value={view.query} />
        <button type="submit" disabled={!table}>Export study facts</button>
      </form>
    </div>
    <p role="status" aria-live="polite">{view.error ?? (ready ? `${rows.length} of 12 source properties shown.` : "Preparing attributed source information…")} {exportStatus}</p>
    {table && <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- The labelled overflowing source table needs keyboard scrolling. */}
      <div className="garcia-physiology-table-scroll" tabIndex={0} role="region" aria-label={`${table.sourceTableLabel} membrane property summaries`}>
        <table>
          <caption>{table.captionRaw} Values are published mean ± SD; statistical test and p annotations remain as printed.</caption>
          <thead><tr><th scope="col">Source property</th>{table.groups.map(group => <th scope="col" key={group.id}>{group.labelRaw}<br /><span>n = {group.recordedObservationCount}</span></th>)}<th scope="col">Source test</th><th scope="col">Reported p</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.propertyId}>
            <th scope="row">{row.propertyLabelRaw}</th>
            {row.values.map(value => <td key={value.groupId} data-source-locator={locatorText(value.locator)}>{value.raw}</td>)}
            <td>{row.reportedComparison.statisticRaw}</td><td>{row.reportedComparison.pValueRaw}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!rows.length && <p>No source properties match this search. Clear the field to show the complete table.</p>}
      <details><summary>Source field locations for this table</summary>
        <ul>{table.propertyRows.map(row => <li key={row.propertyId}>{row.propertyLabelRaw} · <code>{locatorText(row.propertyLocator)}</code>{row.unitNotPrintedReason && <p>{row.unitNotPrintedReason}</p>}</li>)}</ul>
        <p>Each mean/SD cell retains its own exact table, row and column locator in the exported facts. Normalized fAHP amplitude has no printed unit; a F/I slope unit is also absent from the table.</p>
      </details>
    </>}
    <details><summary>Animals, recording scope and earlier study records</summary>
      <p>The study reports 51 Shox2 reporter mice and 6 Chx10 reporter mice. Individual cell-to-animal assignments and individual cell ages are unavailable in these summary tables. Sex is not stated in the retained article methods.</p>
      <p>Sixty Shox2 recordings from 28 of the Shox2 mice were included from an earlier study. They remain a subset of the present analysis pool.</p>
      <p>The article&apos;s reporter-by-firing counts describe this same recording pool:</p>
      <ul>{facts.studyScope.firingComposition.map(row => <li key={`${row.firingPatternRaw}-${row.reporterPopulationRaw}`}>{row.firingPatternRaw} · {row.reporterPopulationRaw}: {row.recordedObservationCount} recorded observations</li>)}</ul>
      <p>{facts.studyScope.preparation} Age and lumbar level describe the study; physiological group labels remain analytical groupings.</p>
      <p>{facts.studyScope.interpretationBoundary.text}</p>
    </details>
    <details><summary>Source statements and interpretation limits</summary>
      {facts.rawSourceDiscrepancies.map(item => <p key={item.id}>{item.sourceRawFragment && <><code>{item.sourceRawFragment}</code>{" · "}</>}{item.reason}</p>)}
      <p>The clustering results remain study-local physiology context, with no mapping to the molecular profiles or morphology records in this app.</p>
    </details>
    <details><summary>Primary sources and byte receipts</summary>
      <p><a href={facts.source.publication.articleUrl} target="_blank" rel="noreferrer">Garcia-Ramirez et al. 2022</a> · <a href={facts.source.supplement.metadataUrl} target="_blank" rel="noreferrer">Data Sheet 1</a> · <a href={facts.source.rights.url} target="_blank" rel="noreferrer">CC BY 4.0</a></p>
      <p>{facts.source.rights.attribution}</p>
      <ul>{facts.source.inputPins.map(pin => <li key={pin.fileName}>{pin.fileName} · {pin.bytes.toLocaleString("en-US")} bytes <code>{pin.sha256}</code></li>)}</ul>
      <p>The retained source bytes were checked during extraction. This facts export captures published statistics and its selection context.</p>
    </details>
  </section>;
}
