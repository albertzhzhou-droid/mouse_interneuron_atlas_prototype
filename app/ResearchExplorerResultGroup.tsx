"use client";

import type { ResearchRecord } from "./ResearchExplorer";
import { useSourceListRovingFocus } from "./useSourceListRovingFocus";

export default function ResearchExplorerResultGroup({
  laneLabel,
  namespace,
  resultCount,
  visibleRecords,
  selectedKey,
  keyboardHelpId,
  snippet,
  onSelect,
  onToggleExpanded,
  expanded,
  canExpand,
}: {
  laneLabel: string;
  namespace: string;
  resultCount: number;
  visibleRecords: ResearchRecord[];
  selectedKey: string | null;
  keyboardHelpId: string;
  snippet: (record: ResearchRecord) => string;
  onSelect: (record: ResearchRecord) => void;
  onToggleExpanded: () => void;
  expanded: boolean;
  canExpand: boolean;
}) {
  const listFocus = useSourceListRovingFocus(
    visibleRecords.map((record) => record.key),
    selectedKey,
    JSON.stringify([laneLabel, namespace]),
  );

  return (
    <section className="research-result-group" aria-label={`${namespace} results`}>
      <header><div><span>{laneLabel}</span><h5>{namespace}</h5></div><strong>{resultCount}</strong></header>
      <div className="research-result-list" role="group" aria-label={`${namespace} source records`} aria-describedby={keyboardHelpId}>
        {visibleRecords.map((record) => (
          <button
            {...listFocus.buttonProps(record.key)}
            type="button"
            className={selectedKey === record.key ? "selected" : ""}
            aria-pressed={selectedKey === record.key}
            key={record.key}
            onClick={() => onSelect(record)}
          >
            <span>{record.title}</span>
            <small>{snippet(record)}</small>
            <code>{record.focusId}</code>
          </button>
        ))}
      </div>
      {canExpand && (
        <button type="button" className="research-group-toggle" onClick={onToggleExpanded}>
          {expanded ? "Show fewer" : `Show all ${resultCount}`}
        </button>
      )}
    </section>
  );
}
