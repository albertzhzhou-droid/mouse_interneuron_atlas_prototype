"use client";

import { useEffect, useMemo, useState } from "react";
import SourceRecordSetNavigation from "./SourceRecordSetNavigation";
import { readSourceRegistrySelection, readSourceRegistryRecordSetSelection, writeSourceRegistryLocation, sourceDrilldownReceipt } from "./research-source-drilldown.js";
import { useSourceListRovingFocus } from "./useSourceListRovingFocus";
import {
  researchModelUpgradeRegistry as upgradeRegistryJson,
  researchSourceRegistry as registryJson,
  researchSourceRegistrySummary as registrySummary,
} from "./atlas-types";

type Registry = typeof registryJson;
type Source = Registry["sources"][number];
type RecordSet = Source["recordSets"][number];
type SourceObjectSetRef = {
  status: string;
  path: string | null;
  idField: string | null;
  missingReason: string | null;
};
type Filter = "all" | string;

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function scopeText(values: Array<{ value?: string | null; scientificName?: string; context?: string; missingReason?: string | null }>, key: "value" | "scientificName") {
  if (!values.length) return "Not retained";
  return values.map((item) => item[key] ?? item.missingReason ?? "Not retained").join(" · ");
}

function countText(recordSet: Source["recordSets"][number]) {
  const count = recordSet.includedRecordCount;
  if (count.value === null) return count.missingReason ?? "Not retained";
  return `${count.value.toLocaleString()} ${readable(count.unit)}`;
}

function getSourceObjectSetRef(recordSet: RecordSet): SourceObjectSetRef | null {
  if (!("sourceObjectSetRef" in recordSet)) return null;
  return recordSet.sourceObjectSetRef as SourceObjectSetRef;
}

function integrityText(asset: Source["assets"][number]) {
  const receipt = asset.integrity;
  if (receipt.sha256) return `${readable(receipt.status)} · SHA-256 ${receipt.sha256.slice(0, 12)}…${receipt.sha256.slice(-8)}`;
  return `${readable(receipt.status)} · ${receipt.missingReason ?? "No checksum declared"}`;
}

function downloadSource(source: Source) {
  const linkedResearchUpgrades = source.linkedUpgradeIds.map((id) => (
    upgradeRegistryJson.upgrades.find((upgrade) => upgrade.id === id) ?? { id, resolutionStatus: "unresolved" }
  ));
  const blob = new Blob([JSON.stringify({
    registryReleaseId: registryJson.releaseId,
    researchUpgradeRegistryId: upgradeRegistryJson.registryId,
    exportedAt: new Date().toISOString(),
    source,
    recordSetNavigation: source.recordSets.map(recordSet => sourceDrilldownReceipt(source.id, recordSet.recordSetId)),
    linkedResearchUpgrades,
    scientificPolicy: registryJson.scientificPolicy,
  }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${source.id.toLowerCase()}-source-dossier.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function sourceParams(initialParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(initialParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  return params;
}

function updateSourceUrl(values: Record<string, string | null>, push = false) {
  const location = writeSourceRegistryLocation(window.location.href, values);
  if (push) window.history.pushState(window.history.state, "", location);
  else window.history.replaceState(window.history.state, "", location);
}

export default function ResearchSourceRegistry({ initialParams = {}, onNotice }: {
  initialParams?: Record<string, string | string[] | undefined>;
  onNotice?: (notice: string) => void;
}) {
  const sources = registryJson.sources;
  const initial = sourceParams(initialParams);
  const initialSelection = readSourceRegistrySelection(initial);
  const initialRecordSet = readSourceRegistryRecordSetSelection(initial, initialSelection.sourceId);
  const initialParamsKey = JSON.stringify(initialParams);
  const [locationHydrated, setLocationHydrated] = useState(false);
  const [query, setQuery] = useState(initial.get("sourceQuery") ?? "");
  const [laneFilter, setLaneFilter] = useState<Filter>(initial.get("sourceLane") ?? "all");
  const [speciesFilter, setSpeciesFilter] = useState<Filter>(initial.get("sourceSpecies") ?? "all");
  const [lifeStageFilter, setLifeStageFilter] = useState<Filter>(initial.get("sourceStage") ?? "all");
  const [admissionFilter, setAdmissionFilter] = useState<Filter>(initial.get("sourceAdmission") ?? "all");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelection.sourceId);
  const [sourceError, setSourceError] = useState(initialSelection.error);
  const [requestedRecordSetId, setRequestedRecordSetId] = useState(initialRecordSet.recordSetId);
  const [recordSetError, setRecordSetError] = useState(initialRecordSet.error);

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      const selection = readSourceRegistrySelection(params);
      setSelectedId(selection.sourceId); setSourceError(selection.error);
      const recordSet = readSourceRegistryRecordSetSelection(params, selection.sourceId);
      setRequestedRecordSetId(recordSet.recordSetId); setRecordSetError(recordSet.error);
      setQuery(params.get("sourceQuery") ?? ""); setLaneFilter(params.get("sourceLane") ?? "all");
      setSpeciesFilter(params.get("sourceSpecies") ?? "all"); setLifeStageFilter(params.get("sourceStage") ?? "all");
      setAdmissionFilter(params.get("sourceAdmission") ?? "all");
      setLocationHydrated(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [initialParamsKey]);

  const selectSource = (id: string) => {
    setSelectedId(id); setSourceError(null); setRequestedRecordSetId(null); setRecordSetError(null);
    updateSourceUrl({ source: id, recordSet: null }, true);
    onNotice?.(`Selected source ${id}; no biological identity or geometry was changed`);
  };

  const lanes = unique(sources.flatMap((source) => source.researchLanes));
  const species = unique(sources.flatMap((source) => source.speciesScopes.map((scope) => scope.scientificName)));
  const lifeStages = unique(sources.flatMap((source) => source.lifeStageScopes.map((scope) => scope.value ?? scope.missingReason ?? "Not retained")));
  const admissions = unique(sources.map((source) => source.admission.status));

  const visibleSources = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en");
    return sources.filter((source) => {
      const corpus = [
        source.id,
        source.aliases,
        source.title,
        source.shortLabel,
        source.citation.text,
        source.citation.doi,
        source.accessions,
        source.sourceKind,
        source.speciesScopes.map((scope) => scope.scientificName),
        source.lifeStageScopes.map((scope) => [scope.value, scope.context]),
        source.regionScopes.map((scope) => [scope.value, scope.context]),
        source.conditionScopes,
        source.modalities,
        source.experimentalUnits.map((unit) => [unit.unit, unit.scope]),
        source.recordSets.map((recordSet) => [recordSet.recordKind, recordSet.unitOfObservation, recordSet.assignmentAuthority]),
        source.linkedUpgradeIds,
      ].flat(Infinity).filter(Boolean).join(" ").toLocaleLowerCase("en");
      return (!normalized || corpus.includes(normalized))
        && (laneFilter === "all" || source.researchLanes.includes(laneFilter))
        && (speciesFilter === "all" || source.speciesScopes.some((scope) => scope.scientificName === speciesFilter))
        && (lifeStageFilter === "all" || source.lifeStageScopes.some((scope) => (scope.value ?? scope.missingReason ?? "Not retained") === lifeStageFilter))
        && (admissionFilter === "all" || source.admission.status === admissionFilter);
    });
  }, [admissionFilter, laneFilter, lifeStageFilter, query, sources, speciesFilter]);

  const selected = sources.find((source) => source.id === selectedId) ?? null;
  const sourceListFocus = useSourceListRovingFocus(visibleSources.map(source => source.id), selectedId, "canonical-source-registry");
  const selectedUpgrades = (selected?.linkedUpgradeIds ?? []).map((id) => (
    upgradeRegistryJson.upgrades.find((upgrade) => upgrade.id === id)
  )).filter((upgrade): upgrade is (typeof upgradeRegistryJson.upgrades)[number] => Boolean(upgrade));
  const selectedVisible = visibleSources.some((source) => source.id === selected?.id);
  const aliases = sources.reduce((count, source) => count + source.aliases.length, 0);
  return (
    <>
    {!locationHydrated && <p className="source-registry-boundary" role="status" aria-live="polite">Preparing source selection…</p>}
    <section className="source-registry" aria-labelledby="source-registry-heading" inert={!locationHydrated} aria-busy={!locationHydrated}>
      <header className="source-registry-heading">
        <div>
          <p className="panel-kicker">UPG-108 / UPG-110 / UPG-113 · CANONICAL PROVENANCE · LANE-SCOPED CONTEXT</p>
          <h3 id="source-registry-heading">Research source registry</h3>
          <p>
            One canonical record for every source package used across anatomy, molecular types, morphology, SCI evidence,
            coverage and internal-reference views. Aliases resolve old page-specific IDs; they never merge biological records.
          </p>
        </div>
        <span className="badge inferred">0 CROSS-SOURCE IDENTITIES · 0 REG</span>
      </header>

      <div className="source-registry-metrics" aria-label="Canonical source registry summary">
        <article><strong>{registrySummary.sourceCount}</strong><span>canonical source packages</span></article>
        <article><strong>{aliases}</strong><span>legacy aliases resolved</span></article>
        <article><strong>{registrySummary.recordSetCount}</strong><span>declared record sets</span></article>
        <article><strong>{registrySummary.bundledExactCellProfileRosterCount}</strong><span>bundled exact cell/profile rosters</span></article>
        <article><strong>{registrySummary.bundledExactSourceObjectSetCount}</strong><span>bundled exact source-object sets</span></article>
      </div>

      <p className="source-registry-boundary" role="note">
        <strong>Drill-down gate:</strong> {registryJson.scientificPolicy.drillDownGate}. Public access does not imply redistribution permission,
        and registry metadata cannot authorize geometry, atlas registration or a cross-source identity.
      </p>

      <div className="source-registry-controls">
        <label>Search source, DOI, accession or scope
          <input type="search" value={query} maxLength={180} placeholder="e.g. GSE103840, P17–P28, nucleus, UPG-109" onChange={(event) => { setQuery(event.target.value); updateSourceUrl({ sourceQuery: event.target.value }); }} />
        </label>
        <label>Research lane
          <select value={laneFilter} onChange={(event) => { setLaneFilter(event.target.value); updateSourceUrl({ sourceLane: event.target.value }); }}>
            <option value="all">All lanes</option>
            {lanes.map((lane) => <option value={lane} key={lane}>{readable(lane)}</option>)}
          </select>
        </label>
        <label>Species
          <select value={speciesFilter} onChange={(event) => { setSpeciesFilter(event.target.value); updateSourceUrl({ sourceSpecies: event.target.value }); }}>
            <option value="all">All source-declared species</option>
            {species.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label>Life stage
          <select value={lifeStageFilter} onChange={(event) => { setLifeStageFilter(event.target.value); updateSourceUrl({ sourceStage: event.target.value }); }}>
            <option value="all">All source-declared stages</option>
            {lifeStages.map((stage) => <option value={stage} key={stage}>{stage}</option>)}
          </select>
        </label>
        <label>Admission
          <select value={admissionFilter} onChange={(event) => { setAdmissionFilter(event.target.value); updateSourceUrl({ sourceAdmission: event.target.value }); }}>
            <option value="all">All admission states</option>
            {admissions.map((status) => <option value={status} key={status}>{readable(status)}</option>)}
          </select>
        </label>
      </div>

      <p className="taxonomy-result-count" role="status">{visibleSources.length} of {sources.length} canonical sources match · filtered absence is not biological absence</p>
      <p id={sourceListFocus.helpId} className="sr-only">Use Up / Down, Home / End to move between sources; Enter selects the focused source.</p>
      <div className="source-registry-workspace">
        <div className="source-registry-list" role="listbox" aria-label="Canonical research sources" aria-describedby={sourceListFocus.helpId}>
          {visibleSources.map((source) => (
            <button
              type="button"
              role="option"
              aria-selected={selected?.id === source.id}
              className={selected?.id === source.id ? "selected" : ""}
              key={source.id}
              {...sourceListFocus.buttonProps(source.id)}
              onClick={() => selectSource(source.id)}
            >
              <span>{source.shortLabel} · {readable(source.sourceKind)}</span>
              <strong>{source.title}</strong>
              <em>{scopeText(source.lifeStageScopes, "value")} · {scopeText(source.regionScopes, "value")}</em>
              <small>{readable(source.admission.status)} · {source.recordSets.length} record set{source.recordSets.length === 1 ? "" : "s"}</small>
            </button>
          ))}
          {!visibleSources.length && <p className="type-empty">No canonical source matches these filters. This is not evidence that a source or biological feature is absent.</p>}
        </div>

        {!selected && <article className="source-registry-dossier" role="status"><h4>Requested source unavailable</h4><p>{sourceError}</p><p>No source dossier, navigation receipt or prior-source export is retained.</p></article>}
        {selected && <article className="source-registry-dossier" data-source-id={selected.id} aria-labelledby="selected-source-heading">
          {!selectedVisible && <p className="source-registry-retained">Selected source retained outside the current filters; no replacement was inferred.</p>}
          <header>
            <div><span>{selected.id}</span><h4 id="selected-source-heading">{selected.title}</h4><p>{selected.citation.text}</p></div>
            <button type="button" onClick={() => { downloadSource(selected); onNotice?.(`${selected.shortLabel} source dossier exported · no source object downloaded`); }}>Export source dossier</button>
          </header>

          <dl className="source-registry-scope-grid">
            <div><dt>Species</dt><dd>{scopeText(selected.speciesScopes, "scientificName")}</dd></div>
            <div><dt>Life stage</dt><dd>{scopeText(selected.lifeStageScopes, "value")}</dd></div>
            <div><dt>Region</dt><dd>{scopeText(selected.regionScopes, "value")}</dd></div>
            <div><dt>Conditions</dt><dd>{selected.conditionScopes.join(" · ") || "Not retained"}</dd></div>
            <div><dt>Modalities</dt><dd>{selected.modalities.join(" · ") || "Not retained"}</dd></div>
            <div><dt>Admission</dt><dd>{readable(selected.admission.status)}</dd></div>
            <div><dt>Rights</dt><dd>{readable(selected.rights.status)}</dd></div>
            <div><dt>Research lanes</dt><dd>{selected.researchLanes.map(readable).join(" · ")}</dd></div>
          </dl>

          <section className="source-registry-citation" aria-label="Source citation and identifiers">
            <div><strong>Canonical and legacy identity</strong><p>{selected.aliases.join(" · ") || "No legacy aliases"}</p></div>
            <div><strong>Accessions</strong><p>{selected.accessions.join(" · ") || "No accession retained"}</p></div>
            <div className="source-registry-links">
              {selected.citation.articleUrl && <a href={selected.citation.articleUrl} target="_blank" rel="noreferrer">Primary source ↗</a>}
              {selected.citation.doi && <a href={`https://doi.org/${selected.citation.doi}`} target="_blank" rel="noreferrer">DOI {selected.citation.doi} ↗</a>}
            </div>
          </section>

          <section className="source-registry-section" aria-labelledby="experimental-unit-heading">
            <h5 id="experimental-unit-heading">Experimental units · no denominator pooling</h5>
            <div className="source-registry-unit-grid">
              {selected.experimentalUnits.map((unit, index) => <article key={`${unit.unit}-${unit.scope}-${index}`}>
                <span>{readable(unit.unit)}</span>
                <strong>{unit.count === null ? "Not retained" : unit.count.toLocaleString()}</strong>
                <p>{unit.scope} · {readable(unit.authority)}{unit.missingReason ? ` · ${unit.missingReason}` : ""}</p>
              </article>)}
            </div>
          </section>

          {recordSetError && <p role="status">{recordSetError}</p>}
          <section className="source-registry-section" aria-labelledby="record-set-heading">
            <h5 id="record-set-heading">Source → record set → exact child gate</h5>
            <div className="source-record-set-list">
              {selected.recordSets.map((recordSet) => {
                const sourceObjectSetRef = getSourceObjectSetRef(recordSet as RecordSet);
                return <article key={recordSet.recordSetId} id={recordSet.recordSetId} data-record-set-id={recordSet.recordSetId}>
                  <header><span>{recordSet.recordSetId}</span><strong>{countText(recordSet)}</strong></header>
                  <dl>
                    <div><dt>Record kind</dt><dd>{readable(recordSet.recordKind)}</dd></div>
                    <div><dt>Observation unit</dt><dd>{readable(recordSet.unitOfObservation)}</dd></div>
                    <div><dt>Assignment authority</dt><dd>{readable(recordSet.assignmentAuthority)}</dd></div>
                    <div><dt>Cell/profile roster</dt><dd>{readable(recordSet.cellRosterAvailability)}</dd></div>
                    <div><dt>Canonical identity</dt><dd>{readable(recordSet.canonicalIdentityStatus)}</dd></div>
                    <div><dt>Child-roster drill-down</dt><dd>{readable(recordSet.childRosterRef.status)}</dd></div>
                    {sourceObjectSetRef && <div><dt>Source-object set</dt><dd>{readable(sourceObjectSetRef.status)}</dd></div>}
                  </dl>
                  <p>{recordSet.childRosterRef.missingReason ?? "Exact bundled roster is available for constrained drill-down."}</p>
                  {sourceObjectSetRef && <p><strong>Source-object drill-down:</strong> {sourceObjectSetRef.missingReason ?? `Exact bundled objects are keyed by ${sourceObjectSetRef.idField}.`}</p>}
                  <SourceRecordSetNavigation key={`${selected.id}:${recordSet.recordSetId}`} sourceId={selected.id} recordSet={recordSet} initiallyOpen={requestedRecordSetId === recordSet.recordSetId} onOpenChange={open => {
                    if (open) { setRequestedRecordSetId(recordSet.recordSetId); setRecordSetError(null); updateSourceUrl({ source: selected.id, recordSet: recordSet.recordSetId }); }
                    else if (requestedRecordSetId === recordSet.recordSetId) { setRequestedRecordSetId(null); updateSourceUrl({ recordSet: null }); }
                  }} />
                </article>;
              })}
            </div>
          </section>

          <section className="source-registry-section" aria-labelledby="source-asset-heading">
            <h5 id="source-asset-heading">Assets and integrity</h5>
            <div className="source-asset-list">
              {selected.assets.map((asset) => <article key={asset.id}>
                <div><span>{asset.id}</span><strong>{readable(asset.kind)}</strong></div>
                <p>{asset.accession ?? "No accession"} · {asset.bundled ? "bundled" : "not bundled"}</p>
                <small>{integrityText(asset)}</small>
                {asset.url && <a href={asset.url} target="_blank" rel="noreferrer">Source object ↗</a>}
              </article>)}
            </div>
          </section>

          <section className="source-registry-section source-registry-boundaries" aria-labelledby="source-gap-heading">
            <h5 id="source-gap-heading">Explicit missingness and acceptance boundary</h5>
            <p><strong>Rights:</strong> {selected.rights.note}</p>
            <p><strong>Admission:</strong> {selected.admission.note}</p>
            <ul>{selected.missingness.map((item) => <li key={item.field}><strong>{readable(item.field)} · {readable(item.status)}:</strong> {item.reason}</li>)}</ul>
            <div className="source-registry-upgrades">
              <strong>Linked research milestones · machine-resolved</strong>
              {selectedUpgrades.length ? selectedUpgrades.map((upgrade) => (
                <article key={upgrade.id}>
                  <header><span>{upgrade.id} · {upgrade.priority} · {readable(upgrade.lane)}</span><em>{readable(upgrade.status)}</em></header>
                  <p>{upgrade.description}</p>
                  <dl>
                    <div><dt>Current blocker</dt><dd>{readable(upgrade.blocker.code)} · {upgrade.blocker.detail}</dd></div>
                    <div><dt>Evidence basis</dt><dd>{upgrade.evidenceBasis.unlinkedText}</dd></div>
                    <div><dt>Last verification</dt><dd>{upgrade.lastVerification.date} · {readable(upgrade.lastVerification.scope)}</dd></div>
                    <div><dt>Acceptance boundary</dt><dd>{upgrade.acceptanceBoundary}</dd></div>
                  </dl>
                  {!!upgrade.evidenceBasis.references.length && <nav aria-label={`${upgrade.id} evidence links`}>
                    {upgrade.evidenceBasis.references.map((reference) => <a href={reference.url} target="_blank" rel="noreferrer" key={`${upgrade.id}-${reference.url}`}>{reference.label} ↗</a>)}
                  </nav>}
                </article>
              )) : <p>None declared for this source.</p>}
            </div>
          </section>
        </article>}
      </div>
    </section>
    </>
  );
}
