"use client";

import { useEffect, useState } from "react";
import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
import { SVARA_CATALOGUES, SVARA_DEFAULT_ENTRY, svaraCatalogueEntry, svaraCatalogueIdentity, loadSvaraCataloguePage,
  svaraVerifiedPageBytes, buildSvaraCatalogueReceipt, inspectSvaraCatalogueReceipt,
  restoreSvaraCatalogueReceipt, readSvaraCatalogueLocation, writeSvaraCatalogueLocation,
  svaraCataloguePageLink } from "./svara-catalogues.js";
import "./svara-catalogues.css";
import { svaraPublicationContactChoices } from "./svara-publication-navigation.js";

type PageRequest = { key: string | null; revision: number; imported: unknown; refusal: string | null };
type Loaded = { request: PageRequest; pngUrl: string; jsonUrl: string; receipt: Record<string, unknown> };

export default function SvaraCatalogueGallery({ syncLocation = false }: { syncLocation?: boolean }) {
  const [request, setRequest] = useState<PageRequest>({ key: syncLocation ? null : SVARA_DEFAULT_ENTRY, revision: 0, imported: null, refusal: null });
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const entry = request.key === null ? null : svaraCatalogueEntry(request.key);
  const catalogue = SVARA_CATALOGUES.catalogues.find(row => row.id === entry?.catalogueId);
  const entries = SVARA_CATALOGUES.entries.filter(row => row.catalogueId === entry?.catalogueId);
  const contactChoices = entry ? svaraPublicationContactChoices(entry.key) : null;
  const index = entries.findIndex(row => row.key === request.key);
  const current = loaded?.request === request && !request.refusal ? loaded : null;

  useEffect(() => {
    if (!syncLocation) return;
    function restoreLocation() {
      const location = readSvaraCatalogueLocation(window.location.href);
      setLoaded(null); setError(""); setImportMessage("");
      setRequest(previous => ({ ...location, revision: previous.revision + 1, imported: null }));
    }
    window.addEventListener("popstate", restoreLocation);
    const timer = window.setTimeout(restoreLocation, 0);
    return () => { window.clearTimeout(timer); window.removeEventListener("popstate", restoreLocation); };
  }, [syncLocation]);

  useEffect(() => {
    const controller = new AbortController();
    const urls: string[] = [];
    const key = request.key;
    if (request.refusal || key === null) return () => controller.abort();
    void (async () => {
      try {
        const proof = await loadSvaraCataloguePage(key, { signal: controller.signal });
        controller.signal.throwIfAborted();
        if (request.imported !== null) restoreSvaraCatalogueReceipt(request.imported, proof);
        const receipt = buildSvaraCatalogueReceipt(proof, key);
        const pngUrl = URL.createObjectURL(new Blob([svaraVerifiedPageBytes(proof, key)], { type: "image/png" }));
        const jsonUrl = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2) + "\n"], { type: "application/json" }));
        urls.push(pngUrl, jsonUrl);
        setLoaded({ request, pngUrl, jsonUrl, receipt });
        if (request.imported !== null) setImportMessage("Restored this exact catalogue page after fresh PNG byte verification.");
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure instanceof Error ? failure.message : "Page verification failed.");
          if (request.imported !== null) setImportMessage("Restore refused; no imported page or values were displayed.");
        }
      }
    })();
    return () => { controller.abort(); urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [request]);

  function select(key: string) {
    if (syncLocation) {
      const next = writeSvaraCatalogueLocation(window.location.href, key);
      if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, "", next);
    }
    setLoaded(null); setError(""); setImportMessage("");
    setRequest(previous => ({ key, revision: previous.revision + 1, imported: null, refusal: null }));
  }
  function restore() {
    try {
      if (importText.length > 24000) throw new Error("Receipt exceeds the catalogue page size limit.");
      const imported: unknown = JSON.parse(importText);
      const { key } = inspectSvaraCatalogueReceipt(imported);
      if (syncLocation) {
        const next = writeSvaraCatalogueLocation(window.location.href, key);
        if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, "", next);
      }
      setLoaded(null); setError(""); setImportMessage("Checking fresh source page bytes…");
      setRequest(previous => ({ key, revision: previous.revision + 1, imported, refusal: null }));
    } catch (failure) {
      const refusal = `Restore refused: ${failure instanceof Error ? failure.message : "invalid receipt"}`;
      setLoaded(null); setError(refusal); setImportMessage(refusal);
      setRequest(previous => ({ key: previous.key, revision: previous.revision + 1, imported: null, refusal }));
    }
  }

  return <section id="svara-catalogue-gallery" className="svara-catalogue-gallery" aria-label="Svara original supplementary catalogue pages">
    <h3>Original supplementary catalogues</h3>
    <p>Browse 139 MN, 39 CiD and 34 CoBL publication entries. Labels and reported values remain in their original catalogue. Each image contains the full published page.</p>
    <div className="svara-catalogue-controls">
      <label>Catalogue<select aria-label="Svara catalogue" value={entry?.catalogueId ?? ""} onChange={event => select(SVARA_CATALOGUES.entries.find(row => row.catalogueId === event.target.value)!.key)}>
        {!entry && <option value="" disabled>Select a catalogue</option>}
        {SVARA_CATALOGUES.catalogues.map(row => <option key={row.id} value={row.id}>{row.classLabel} · {row.entryCount} entries · {row.id}</option>)}
      </select></label>
      <label>Original entry<select aria-label="Svara original entry" value={request.key ?? ""} disabled={!entry} onChange={event => select(event.target.value)}>
        {!entry && <option value="" disabled>No entry selected</option>}
        {entries.map(row => <option key={row.key} value={row.key}>{row.sourceHeader}</option>)}
      </select></label>
      <button type="button" disabled={index <= 0} onClick={() => select(entries[index - 1].key)}>Previous entry</button>
      <button type="button" disabled={index < 0 || index === entries.length - 1} onClick={() => select(entries[index + 1].key)}>Next entry</button>
    </div>
    <p role="status" aria-live="polite" data-testid="svara-page-status">{request.refusal || error || (current && entry && catalogue ? `${entry.sourceLabel} · page ${entry.sourcePage}/${catalogue.entryCount} · current PNG bytes verified` : "Verifying this original page image…")}</p>
    {error && request.key && !request.refusal && <button type="button" onClick={() => select(request.key!)}>Retry page verification</button>}
    {request.refusal && <button type="button" onClick={() => select(SVARA_DEFAULT_ENTRY)}>Open default CiD 001 page</button>}
    {current && entry && <>
      <figure>
        {/* The Blob contains privately verified bytes, never an unverified source URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.pngUrl} alt={`Complete original ${entry.sourceHeader} publication page, ${entry.sourcePdfMember}, page ${entry.sourcePage}`} width={entry.raster.widthPixels} height={entry.raster.heightPixels} data-testid="svara-source-page" />
        <figcaption>{entry.sourceHeader} · {entry.sourcePdfMember}, page {entry.sourcePage}. Svara et al. (2018), CC BY 4.0. PDF page rendered at 96 dpi; diagrams unchanged.</figcaption>
      </figure>
      <h4>Values reported on this source page</h4>
      <p>These strings come from the published table. No measurements were calculated from the image.</p>
      <dl className="svara-catalogue-fields" data-testid="svara-reported-fields">{entry.reportedFields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.sourceText}</dd></div>)}</dl>
      <aside aria-label="Contact tables for this publication entry" data-testid="svara-page-contact-context">
        <h4>Contact tables for {entry.sourceLabel}</h4>
        {contactChoices?.unavailableReason ?
          <p>{contactChoices.unavailableReason}</p> : <>
            <p>Keep this publication label when opening the tables. Each link names its starting pair; you can then browse the other partners. The target checks its own source bytes.</p>
            <nav className="svara-catalogue-downloads" aria-label="Contact table starting pairs">
              {contactChoices?.choices.map(choice =>
                <a key={choice.selection.group} href={choice.href}>{choice.label}</a>)}
            </nav>
          </>}
        <p>Matching labels within this article do not establish raw physical cell IDs or a three dimensional coordinate mapping.</p>
      </aside>
      <nav className="svara-catalogue-downloads" aria-label="Verified Svara page downloads">
        <a href={current.pngUrl} download={`svara-${entry.catalogueId}-page-${entry.sourcePage}.png`}>Download original page PNG</a>
        <a href={current.jsonUrl} download={`svara-${entry.catalogueId}-page-${entry.sourcePage}-source.json`}>Download page source receipt</a>
        <a href={svaraCataloguePageLink(entry.key)} data-testid="svara-page-link">Link to this exact page</a>
      </nav>
      <p className="svara-catalogue-proof">Only this {entry.raster.bytes.toLocaleString()}-byte PNG is fetched and checked here. Full ZIP and PDF hashes were checked during extraction. The receipt includes attribution, original component, page, reported values and this distinction.</p>
      <p>The page link preserves source, release and entry. Opening it checks the page bytes again; it does not restore a three dimensional view.</p>
      <SourceIdentityHierarchyPanel hierarchy={svaraCatalogueIdentity(entry.key)} />
      <details><summary>Extracted original page text and source receipt</summary><pre data-testid="svara-page-text">{entry.sourcePageText}</pre><pre data-testid="svara-page-receipt">{JSON.stringify(current.receipt, null, 2)}</pre></details>
    </>}
    <details className="svara-catalogue-restore"><summary>Restore a downloaded page receipt</summary>
      <label>Page source receipt JSON<textarea aria-label="Svara page source receipt JSON" value={importText} onChange={event => setImportText(event.target.value)} rows={6} maxLength={24001} /></label>
      <button type="button" onClick={restore}>Restore exact catalogue page</button><p role="status" aria-live="polite" data-testid="svara-restore-status">{importMessage}</p>
    </details>
    <p className="svara-catalogue-boundary">These catalogue PDFs contain published two dimensional views. They provide no editable skeleton, mesh, raw volume or XYZ endpoint table. Separate official spreadsheets are available through the publication entry links above. Physical cell/section IDs, coordinate frames and the exact Koh annotation version remain unestablished. CiD is a morphological source label; no genetic V2a assignment or mouse registration is made.</p>
    <p>{SVARA_CATALOGUES.citation} <a href="https://doi.org/10.1016/j.celrep.2018.05.023" target="_blank" rel="noreferrer">Article ↗</a>{" · "}<a href={SVARA_CATALOGUES.rights.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0 ↗</a></p>
    <p>Reuse basis: the exact article&apos;s license and the publisher&apos;s explicit policy for its supplementary data. The ZIP metadata has no separate license field. <a href={SVARA_CATALOGUES.rights.publisherPolicyUrl} target="_blank" rel="noreferrer">Publisher policy ↗</a></p>
  </section>;
}
