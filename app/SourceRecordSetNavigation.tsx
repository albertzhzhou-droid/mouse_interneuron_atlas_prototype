"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { getSourceRecordSetNavigation, sourceDrilldownReceipt } from "./research-source-drilldown.js";
import { nextSourceListRovingKey, resolveSourceListRovingKey } from "./source-list-roving-focus.js";
import styles from "./SourceRecordSetNavigation.module.css";

const PAGE_SIZE = 12;

export default function SourceRecordSetNavigation({ sourceId, recordSet, initiallyOpen = false, onOpenChange }: {
  sourceId: string;
  recordSet: { recordSetId: string };
  initiallyOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const helpId = useId();
  const [internalOpen, setOpen] = useState(initiallyOpen);
  const open = onOpenChange ? initiallyOpen : internalOpen;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [focus, setFocus] = useState<{ scope: string | null; key: string | null }>({ scope: null, key: null });
  const anchors = useRef(new Map<string, HTMLAnchorElement>());
  const result = useMemo(() => {
    try { return { navigation: getSourceRecordSetNavigation(sourceId, recordSet.recordSetId, recordSet), error: "" }; }
    catch (error) { return { navigation: null, error: error instanceof Error ? error.message : "Source navigation declaration is invalid" }; }
  }, [sourceId, recordSet]);
  const navigation = result.navigation;
  const matching = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
    return (navigation?.entries ?? []).filter(row => terms.every(term => `${row.id} ${row.label}`.toLocaleLowerCase("en-US").includes(term)));
  }, [navigation, query]);
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = matching.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const keys = visible.map(row => row.id);
  const scope = JSON.stringify([sourceId, recordSet.recordSetId, query, currentPage, keys]);
  const rovingKey = resolveSourceListRovingKey(keys, { scope, focusedScope: focus.scope, focusedKey: focus.key });
  const exportReceipt = () => {
    const receipt = { ...sourceDrilldownReceipt(sourceId, recordSet.recordSetId), navigationDisplay: { query, page: currentPage + 1, pageSize: PAGE_SIZE, matchingEntryCount: matching.length, visibleEntryIds: keys } };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${recordSet.recordSetId.toLowerCase()}-navigation-receipt.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  if (!navigation || navigation.status !== "available") return <p className={styles.unavailable} role={result.error ? "status" : undefined}>{result.error || navigation?.reason || "No exact source entry is available."}</p>;
  return <details className={styles.disclosure} open={open} onToggle={event => { const next = event.currentTarget.open; if (next !== open) { setOpen(next); onOpenChange?.(next); } }} data-record-set-navigation={recordSet.recordSetId}>
    <summary>Open this exact record set · {navigation.entries.length} navigation {navigation.entries.length === 1 ? "entry" : "entries"}</summary>
    {open && <div className={styles.content}>
      <p>{navigation.boundary}</p>
      <p><strong>Declared observation unit:</strong> {navigation.unitOfObservation.replaceAll("_", " ")} · <strong>Roster locator:</strong> <code>{navigation.reference.path}</code> · <code>{navigation.reference.idField}</code></p>
      <label className={styles.search}>Find a native ID or source label<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
      <p role="status" aria-live="polite" aria-atomic="true">{matching.length} of {navigation.entries.length} navigation entries match. Entry count does not replace the source record-set denominator.</p>
      <p id={helpId} className={styles.help}>Use Up / Down, Home / End to move between source entries; Enter opens the focused destination.</p>
      <ul className={styles.entries} aria-label={`Navigation entries for ${recordSet.recordSetId}`} aria-describedby={helpId}>
        {visible.map(row => <li key={row.id}><Link href={row.href} download={row.download || undefined} prefetch={row.download ? false : undefined} tabIndex={row.id === rovingKey ? 0 : -1}
          ref={element => { if (element) anchors.current.set(row.id, element); else anchors.current.delete(row.id); }}
          onFocus={() => setFocus(previous => previous.scope === scope && previous.key === row.id ? previous : { scope, key: row.id })}
          onKeyDown={event => { const next = nextSourceListRovingKey(keys, row.id, event.key, event); if (next === null) return; event.preventDefault(); setFocus({ scope, key: next }); anchors.current.get(next)?.focus(); }}>
          <strong>{row.label}</strong><code>{row.id}</code>
        </Link></li>)}
      </ul>
      {!visible.length && <p>No source entry matches this query; no substitute was selected.</p>}
      <nav className={styles.actions} aria-label="Record-set navigation pages">
        <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button>
        <span>Page {currentPage + 1} of {pageCount}</span>
        <button type="button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
        <button type="button" onClick={exportReceipt}>Export navigation receipt</button>
      </nav>
    </div>}
  </details>;
}
