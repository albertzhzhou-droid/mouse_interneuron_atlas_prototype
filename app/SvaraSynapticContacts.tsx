"use client";

import { useEffect, useState } from "react";
import { SVARA_CONTACTS, SVARA_CONTACT_DEFAULT, loadSvaraContacts, svaraContactGroup,
  svaraVerifiedContactData, svaraContactPair, buildSvaraContactReceipt, inspectSvaraContactReceipt,
  restoreSvaraContactReceipt, svaraContactCsv, readSvaraContactLocation, writeSvaraContactLocation,
  svaraContactLink, type SvaraContactSelection, type SvaraContactProof } from "./svara-synaptic-contacts.js";
import "./svara-synaptic-contacts.css";
import { svaraContactCatalogueChoices } from "./svara-publication-navigation.js";

type Request = { selection: SvaraContactSelection | null; imported: unknown; refusal: string | null };
type Loaded = { request: Request; proof: SvaraContactProof; receipt: Record<string, unknown>; jsonUrl: string; csvUrl: string };

export default function SvaraSynapticContacts() {
  const [request, setRequest] = useState<Request>({ selection: null, imported: null, refusal: null });
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const current = loaded?.request === request && !request.refusal ? loaded : null;
  const selection = request.selection;
  const group = selection ? svaraContactGroup(selection.group) : null;
  const pair = current && selection ? svaraContactPair(current.proof, selection) : null;
  const data = current && selection ? svaraVerifiedContactData(current.proof, selection.group) : null;

  useEffect(() => {
    function restoreLocation() {
      const location = readSvaraContactLocation(window.location.href);
      setLoaded(null); setError(""); setMessage(""); setRequest({ ...location, imported: null });
    }
    window.addEventListener("popstate", restoreLocation);
    const timer = window.setTimeout(restoreLocation, 0);
    return () => { window.clearTimeout(timer); window.removeEventListener("popstate", restoreLocation); };
  }, []);

  useEffect(() => {
    const controller = new AbortController(); const urls: string[] = [];
    if (!request.selection || request.refusal) return () => controller.abort();
    const active = request.selection;
    void (async () => {
      try {
        const proof = await loadSvaraContacts(active.group, { signal: controller.signal });
        controller.signal.throwIfAborted();
        if (request.imported !== null) restoreSvaraContactReceipt(request.imported, proof);
        const receipt = buildSvaraContactReceipt(proof, active);
        const jsonUrl = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2) + "\n"], { type: "application/json" }));
        const csvUrl = URL.createObjectURL(new Blob([svaraContactCsv(proof, active)], { type: "text/csv;charset=utf-8" }));
        urls.push(jsonUrl, csvUrl);
        if (request.imported !== null) {
          const next = writeSvaraContactLocation(window.location.href, active);
          if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, "", next);
          setMessage("Restored the exact pair and listed contact rows after fresh source table verification.");
        }
        setLoaded({ request, proof, receipt, jsonUrl, csvUrl });
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure instanceof Error ? failure.message : "Source table verification failed.");
          if (request.imported !== null) setMessage("Restore refused; no imported values or downloads were displayed.");
        }
      }
    })();
    return () => { controller.abort(); urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [request]);

  function select(nextSelection: SvaraContactSelection) {
    const next = writeSvaraContactLocation(window.location.href, nextSelection);
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, "", next);
    setLoaded(null); setError(""); setMessage(""); setRequest({ selection: nextSelection, imported: null, refusal: null });
  }
  function restore() {
    setLoaded(null); setError("");
    try {
      if (importText.length > 30000) throw new Error("Receipt exceeds the pair size limit.");
      const imported: unknown = JSON.parse(importText);
      const nextSelection = inspectSvaraContactReceipt(imported);
      setMessage("Verifying fresh source table bytes and every imported value…");
      setRequest({ selection: nextSelection, imported, refusal: null });
    } catch (failure) {
      const refusal = `Restore refused: ${failure instanceof Error ? failure.message : "invalid receipt"}`;
      setMessage(refusal); setError(refusal); setRequest({ selection: null, imported: null, refusal });
    }
  }

  return <section className="svara-contacts" aria-label="Svara source-local synaptic contacts">
    <p>Explore 265 CiD and 469 CoBL contact rows from four exact official supplements. Each row retains its native labels, original number and spreadsheet location.</p>
    <div className="svara-contact-controls">
      <label>Source group<select aria-label="Svara contact group" value={selection?.group ?? ""} onChange={event => {
        const next = svaraContactGroup(event.target.value); select({ group: next.id, pre: next.pre[0], post: next.post[0] });
      }}>
        {!selection && <option value="" disabled>Select a group</option>}
        {SVARA_CONTACTS.groups.map(row => <option key={row.id} value={row.id}>{row.id} → MN · {row.summary.contactRows} contacts</option>)}
      </select></label>
      <label>Presynaptic entry<select aria-label="Svara presynaptic entry" disabled={!selection} value={selection?.pre ?? ""} onChange={event => select({ ...selection!, pre: event.target.value })}>
        {!selection && <option value="" disabled>No entry selected</option>}
        {group?.pre.map(label => <option key={label} value={label}>{label}</option>)}
      </select></label>
      <label>Postsynaptic entry<select aria-label="Svara postsynaptic entry" disabled={!selection} value={selection?.post ?? ""} onChange={event => select({ ...selection!, post: event.target.value })}>
        {!selection && <option value="" disabled>No entry selected</option>}
        {group?.post.map(label => <option key={label} value={label}>{label}</option>)}
      </select></label>
    </div>
    <p role="status" aria-live="polite" data-testid="svara-contact-status">{request.refusal || error || (current && selection ? `${selection.pre} → ${selection.post} · current source table bytes verified` : "Verifying this source table…")}</p>
    {error && selection && !request.refusal && <button type="button" onClick={() => select(selection)}>Retry contact verification</button>}
    {request.refusal && <button type="button" onClick={() => select(SVARA_CONTACT_DEFAULT)}>Open default CiD contact pair</button>}
    {current && pair && selection && group && data && <>
      <h2>{selection.pre} → {selection.post}</h2>
      <dl className="svara-contact-summary" data-testid="svara-contact-pair">
        <div><dt>Published matrix value</dt><dd>{pair.matrixSourceText}</dd><dd>{data.matrix.sheet}!{pair.matrixCell}</dd></div>
        <div><dt>Listed contacts · derived count</dt><dd>{pair.derivedContactCount}</dd></div>
        <div><dt>Sum of listed areas · derived</dt><dd>{pair.derivedContactAreaSumUm2.toLocaleString("en", { maximumSignificantDigits: 14 })} µm²</dd></div>
      </dl>
      <p>The wiring matrix values agree with sums of contact areas. Its sheet does not explicitly state a unit. Contact areas are labelled µm² in their source header; contact counts are calculated from rows.</p>
      <h3>Original contact rows for this pair</h3>
      {pair.contacts.length === 0 ? <p data-testid="svara-contact-zero">The source matrix contains a literal zero and lists no contacts for this pair. This is not proof of biological absence.</p> : <div className="svara-contact-table-scroll" role="region" aria-label="Original contact rows">
        <table data-testid="svara-contact-rows"><caption>{data.contacts.sheet} · {group.contactsSource.name}</caption><thead><tr><th scope="col">Source row</th><th scope="col">Original contact area · µm²</th><th scope="col">Native cells</th></tr></thead>
          <tbody>{pair.contacts.map(row => <tr key={row.sourceRow}><th scope="row">{row.sourceRow}</th><td>{row.areaText}</td><td>A{row.sourceRow}:C{row.sourceRow}</td></tr>)}</tbody>
        </table>
      </div>}
      <p>Repeated presynaptic and postsynaptic labels identify separate listed contacts. No rows were combined or removed.</p>
      <nav className="svara-contact-downloads" aria-label="Original catalogue pages for this pair" data-testid="svara-contact-page-context">
        {svaraContactCatalogueChoices(selection).choices.map(choice =>
          <a key={choice.role} href={choice.href}>Original page · {choice.label}</a>)}
      </nav>
      <p>These links match native labels within the same article and release. Each page checks its own PNG bytes; the links do not establish raw physical cell IDs or coordinate registration.</p>
      <nav className="svara-contact-downloads" aria-label="Verified Svara contact downloads">
        <a href={current.csvUrl} download={`svara-${selection.group}-pair-contacts.csv`}>Download pair CSV</a>
        <a href={current.jsonUrl} download={`svara-${selection.group}-pair-source.json`}>Download pair source receipt</a>
        <a href={svaraContactLink(selection)} data-testid="svara-contact-link">Link to this exact pair</a>
      </nav>
      <details><summary>All 68 postsynaptic entries for {selection.pre}</summary>
        <p>Each button selects a published matrix position, including literal zeros. Counts come from the listed contact rows.</p>
        <div className="svara-contact-matrix">{group.post.map((post, j) => {
          const token = data.matrix.values[group.pre.indexOf(selection.pre)][j];
          const count = data.contacts.rows.filter(row => row.pre === selection.pre && row.post === post).length;
          return <button type="button" key={post} aria-pressed={selection.post === post} onClick={() => select({ ...selection, post })}><span>{post}</span><span>{token} · {count} contacts</span></button>;
        })}</div>
      </details>
      <details><summary>Source files, reconciliation and current receipt</summary>
        <p>{group.summary.presynapticEntries} presynaptic × 68 postsynaptic publication entries; {group.summary.contactRows} original rows; {group.summary.distinctListedPairs} distinct listed pairs. {group.summary.literalZeros} literal matrix zeros; no missing matrix positions.</p>
        <p>All {group.summary.pairsCompared} positions were compared against the sum of contact rows. Largest absolute difference: {group.summary.maxMatrixAreaSumAbsoluteDifference}. The 10⁻⁹ reconciliation tolerance addresses decimal precision, not biology.</p>
        <p>This browser checks a {group.asset.bytes.toLocaleString()}-byte extracted JSON table. Original XLSX size, published MD5 and SHA-256 were checked during extraction. Fresh JSON bytes are required for display and export.</p>
        <p><a href={group.matrixSource.sourceUrl}>Official wiring workbook</a>{" · "}<a href={group.contactsSource.sourceUrl}>Official contact workbook</a></p>
        <pre data-testid="svara-contact-receipt">{JSON.stringify(current.receipt, null, 2)}</pre>
      </details>
    </>}
    <details className="svara-contact-restore"><summary>Restore a pair source receipt</summary>
      <label>Pair source receipt JSON<textarea aria-label="Svara pair source receipt JSON" value={importText} onChange={event => setImportText(event.target.value)} rows={5} maxLength={30001} /></label>
      <button type="button" onClick={restore}>Restore exact contact pair</button><p role="status" aria-live="polite" data-testid="svara-contact-restore-status">{message}</p>
    </details>
    <p className="svara-contact-boundary">These are publication labels from one larval zebrafish study. No source XYZ endpoints, editable geometry, exact physical parent mapping, functional transmission or matching Koh annotation version is established. CiD remains a morphological label; these entries do not add mouse cells or genetic V2a assignments.</p>
    <p>{SVARA_CONTACTS.citation} <a href="https://doi.org/10.1016/j.celrep.2018.05.023">Article</a>{" · "}<a href={SVARA_CONTACTS.rights.licenseUrl}>CC BY 4.0</a></p>
    <p>Reuse applies the exact article license and <a href={SVARA_CONTACTS.rights.publisherPolicyUrl}>publisher supplementary-data policy</a> to these four official byte-verified components. This does not license the whole FreiDok wrapper or another annotation version. Source workbooks remain unchanged; JSON extraction, row counts and sums are derived.</p>
  </section>;
}
