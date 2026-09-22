"use client";

import { useMemo, useState } from "react";
import {
  russHarmonizedTaxonomyCrosswalk,
  type RussTaxonomyPopulation,
} from "./atlas-types";
import RussReconciliationDossier from "./RussReconciliationDossier";

type GroupFilter = "all" | (typeof russHarmonizedTaxonomyCrosswalk.groups)[number]["id"];
type ScopeFilter = "interneurons" | "all";
type RegionFilter = "all" | "dorsal" | "deep_dorsal_or_mid" | "ventral";
type TransmitterFilter = "all" | "excitatory" | "inhibitory";

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sourceRobustnessContext(regionClass: RegionFilter) {
  if (regionClass === "dorsal") return "Source reports very high cluster robustness";
  if (regionClass === "deep_dorsal_or_mid" || regionClass === "ventral") return "Source reports low-to-moderate cluster robustness";
  return "Source robustness varies by neuronal class";
}

export default function TaxonomyCrosswalkExplorer({ onNotice }: { onNotice: (notice: string) => void }) {
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("interneurons");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [transmitterFilter, setTransmitterFilter] = useState<TransmitterFilter>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [selectedLabel, setSelectedLabel] = useState("Excit-36");
  const groupById = useMemo(
    () => new Map(russHarmonizedTaxonomyCrosswalk.groups.map((group) => [group.id, group])),
    [],
  );
  const candidateGroups = useMemo(
    () => russHarmonizedTaxonomyCrosswalk.groups.filter((group) => group.interneuronCandidate),
    [],
  );
  const candidatePopulations = useMemo(
    () => russHarmonizedTaxonomyCrosswalk.populations.filter((population) => groupById.get(population.groupId)?.interneuronCandidate),
    [groupById],
  );
  const excitatoryCount = candidatePopulations.filter((population) => groupById.get(population.groupId)?.transmitterClass === "excitatory").length;
  const inhibitoryCount = candidatePopulations.filter((population) => groupById.get(population.groupId)?.transmitterClass === "inhibitory").length;
  const matching = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return russHarmonizedTaxonomyCrosswalk.populations.filter((population) => {
      const group = groupById.get(population.groupId);
      return (scopeFilter === "all" || group?.interneuronCandidate)
        && (regionFilter === "all" || group?.regionClass === regionFilter)
        && (transmitterFilter === "all" || group?.transmitterClass === transmitterFilter)
        && (groupFilter === "all" || population.groupId === groupFilter)
        && (!normalized || [population.label, population.primaryMarkers.join(" "), group?.label ?? ""].join(" ").toLowerCase().includes(normalized));
    });
  }, [groupById, groupFilter, query, regionFilter, scopeFilter, transmitterFilter]);
  const selected = matching.find((population) => population.label === selectedLabel)
    ?? matching[0]
    ?? null;
  const selectedGroup = selected ? groupById.get(selected.groupId) : null;
  const selectedCrosswalks = selected
    ? russHarmonizedTaxonomyCrosswalk.prototypeCrosswalks.filter((mapping) => mapping.candidatePopulationLabels.includes(selected.label))
    : [];

  const selectPopulation = (population: RussTaxonomyPopulation) => {
    setSelectedLabel(population.label);
  };

  return (
    <section className="taxonomy-crosswalk" aria-labelledby="taxonomy-crosswalk-heading">
      <div className="taxonomy-crosswalk-heading">
        <div>
          <span>PINNED TYPE-LEVEL CROSSWALK · RUSS 2021</span>
          <h4 id="taxonomy-crosswalk-heading">Harmonized molecular taxonomy</h4>
        </div>
        <span className="badge observed">TYPE LEVEL</span>
      </div>
      <p>
        {russHarmonizedTaxonomyCrosswalk.scope.displayedPopulationCount} published neural populations · {russHarmonizedTaxonomyCrosswalk.scope.displayedInterneuronCandidateCount} project-designated candidate populations after excluding the source motor/preganglionic and CSF-contacting groups · interneurons and projection neurons are not fully separated · no exact prototype mapping.
      </p>
      <p className="taxonomy-boundary">{russHarmonizedTaxonomyCrosswalk.scope.spatialBoundary}</p>

      <div className="taxonomy-landscape-overview" aria-label="Type landscape coverage summary">
        <article><strong>{candidatePopulations.length}</strong><span>candidate populations · not confirmed interneurons</span></article>
        <article><strong>{excitatoryCount}</strong><span>excitatory · source taxonomy</span></article>
        <article><strong>{inhibitoryCount}</strong><span>inhibitory · source taxonomy</span></article>
        <article><strong>0</strong><span>exact cross-study identities or REG placements</span></article>
      </div>
      <p className="taxonomy-source-caution"><strong>Source robustness caution:</strong> {russHarmonizedTaxonomyCrosswalk.scope.knownSourceCaution}</p>

      <div className="taxonomy-group-map" aria-label="Candidate population distribution by source group">
        {candidateGroups.map((group) => (
          <button
            type="button"
            key={group.id}
            className={groupFilter === group.id ? "selected" : ""}
            aria-pressed={groupFilter === group.id}
            onClick={() => setGroupFilter(groupFilter === group.id ? "all" : group.id)}
          >
            <span><b>{group.label}</b><em>{group.populationLabels.length}</em></span>
            <i style={{ width: `${(group.populationLabels.length / 20) * 100}%` }} />
            <small>{sourceRobustnessContext(group.regionClass as RegionFilter)}</small>
          </button>
        ))}
      </div>

      <div className="taxonomy-controls">
        <label>
          Search label or marker
          <input
            type="search"
            value={query}
            maxLength={160}
            placeholder="e.g. Vsx2, Sim1, Inhib-26"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          Display scope
          <select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value as ScopeFilter)}>
            <option value="interneurons">65 candidate populations · not confirmed interneurons</option>
            <option value="all">All 69 neural populations</option>
          </select>
        </label>
        <label>
          Region class
          <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value as RegionFilter)}>
            <option value="all">All source regions</option>
            <option value="dorsal">Dorsal</option>
            <option value="deep_dorsal_or_mid">Deep dorsal / mid</option>
            <option value="ventral">Ventral</option>
          </select>
        </label>
        <label>
          Transmitter class
          <select value={transmitterFilter} onChange={(event) => setTransmitterFilter(event.target.value as TransmitterFilter)}>
            <option value="all">Excitatory + inhibitory</option>
            <option value="excitatory">Excitatory</option>
            <option value="inhibitory">Inhibitory</option>
          </select>
        </label>
        <label>
          Population group
          <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value as GroupFilter)}>
            <option value="all">All 69 populations</option>
            {russHarmonizedTaxonomyCrosswalk.groups.map((group) => (
              <option value={group.id} key={group.id}>{group.label} ({group.populationLabels.length})</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            downloadJson(russHarmonizedTaxonomyCrosswalk, "ohri-russ-2021-type-level-crosswalk-0.1.json");
            onNotice("Russ 2021 type-level crosswalk exported · no cell-level source data included");
          }}
        >
          Export crosswalk
        </button>
      </div>

      <p className="taxonomy-result-count" role="status">
        {matching.length} of {scopeFilter === "interneurons" ? 65 : 69} populations in the selected scope match · filtered absence is not biological absence
      </p>
      <div className="taxonomy-explorer-grid">
        <div className="taxonomy-population-list" aria-label="Russ 2021 population labels">
          {matching.map((population) => {
            const group = groupById.get(population.groupId);
            return (
              <button
                type="button"
                key={population.id}
                className={selected?.id === population.id ? "selected" : ""}
                aria-pressed={selected?.id === population.id}
                onClick={() => selectPopulation(population)}
              >
                <strong>{population.label}</strong>
                <span>{group?.label}</span>
                <em>{population.primaryMarkers.join(" · ")}</em>
              </button>
            );
          })}
          {!matching.length && <p className="taxonomy-empty">No taxonomy label matches this query. This is not evidence that a cell population is absent.</p>}
        </div>
        {selected && selectedGroup && (
          <article className="taxonomy-population-detail" aria-live="polite">
            <p>RUSS POPULATION · {selectedGroup.regionClass.toUpperCase()}</p>
            <h5>{selected.label}</h5>
            <dl className="catalog-detail-grid">
              <div><dt>Group</dt><dd>{selectedGroup.label}</dd></div>
              <div><dt>Transmitter class</dt><dd>{prettify(selectedGroup.transmitterClass)}</dd></div>
              <div><dt>Candidate-pool membership</dt><dd>{selectedGroup.interneuronCandidate ? "yes · project taxonomy context only; interneuron/projection-neuron identity not established" : "no · retained for the complete 69-population source taxonomy"}</dd></div>
              <div><dt>Top source markers</dt><dd>{selected.primaryMarkers.join(" · ")}</dd></div>
              <div><dt>Life-stage scope</dt><dd>{russHarmonizedTaxonomyCrosswalk.scope.lifeStage}</dd></div>
              <div><dt>Source robustness context</dt><dd>{sourceRobustnessContext(selectedGroup.regionClass as RegionFilter)}</dd></div>
              <div><dt>Project placement</dt><dd>unplaced · no project xyz · no linked SWC · no REG</dd></div>
            </dl>
            <p>{selectedGroup.sourceScope}</p>
            <p className="taxonomy-boundary">{selected.markerEvidence}</p>
            <section className="taxonomy-evidence-axis-grid" aria-label={`Evidence coverage for ${selected.label}`}>
              <span className="covered"><b>Molecular taxonomy</b>source reported</span>
              <span className="context"><b>Region</b>{prettify(selectedGroup.regionClass)} group context</span>
              <span className="missing"><b>Exact lamina / xyz</b>not established</span>
              <span className="missing"><b>Developmental identity</b>not retained in this record</span>
              <span className="missing"><b>Morphology</b>no linked reconstruction</span>
              <span className="missing"><b>SCI causal role</b>not established</span>
            </section>
            <div className="taxonomy-interpretation-grid">
              <p><b>Allowed interpretation</b>This is one published population label in the Russ harmonized postnatal molecular reference, shown with its source group and three ranked marker rows.</p>
              <p><b>Not established</b>A complete interneuron census, unique marker rule, same cell as an SCI entity, morphology assignment, causal function, atlas coordinate, or cross-study exact identity.</p>
            </div>
            {selectedCrosswalks.length > 0 && (
              <section className="taxonomy-direct-context" aria-label="Prototype marker-context warnings">
                <strong>Prototype context — not an identity transfer</strong>
                {selectedCrosswalks.map((mapping) => (
                  <p key={mapping.entityId}><b>{mapping.entityId}</b> · {prettify(mapping.mappingStatus)}. {mapping.reason} {mapping.notEstablished}</p>
                ))}
              </section>
            )}
          </article>
        )}
      </div>

      <details className="taxonomy-crosswalk-details">
        <summary>Prototype-entity crosswalk — all seven records remain non-exact</summary>
        <div className="taxonomy-crosswalk-mapping-list">
          {russHarmonizedTaxonomyCrosswalk.prototypeCrosswalks.map((mapping) => (
            <article key={mapping.entityId}>
              <strong>{mapping.entityId}</strong>
              <span>{prettify(mapping.mappingStatus)}</span>
              <p>{mapping.reason}</p>
              <p><b>Not established:</b> {mapping.notEstablished}</p>
            </article>
          ))}
        </div>
      </details>

      <details className="taxonomy-crosswalk-details">
        <summary>Source object and derivation record</summary>
        <dl className="catalog-detail-grid">
          <div><dt>Source table</dt><dd>{russHarmonizedTaxonomyCrosswalk.source.markerTable.title}</dd></div>
          <div><dt>Source SHA-256</dt><dd><code>{russHarmonizedTaxonomyCrosswalk.source.markerTable.sha256}</code></dd></div>
          <div><dt>Source object</dt><dd>{russHarmonizedTaxonomyCrosswalk.source.markerTable.bytes.toLocaleString()} bytes · source XLSX not bundled</dd></div>
          <div><dt>Derived content</dt><dd>{russHarmonizedTaxonomyCrosswalk.source.markerTable.derivation}</dd></div>
        </dl>
        <div className="taxonomy-source-links">
          <a href={russHarmonizedTaxonomyCrosswalk.source.publication.articleUrl} target="_blank" rel="noreferrer">Open article ↗</a>
          <a href={russHarmonizedTaxonomyCrosswalk.source.processedCounts.recordUrl} target="_blank" rel="noreferrer">Open {russHarmonizedTaxonomyCrosswalk.source.processedCounts.accession} ↗</a>
          <a href={russHarmonizedTaxonomyCrosswalk.source.markerTable.sourceUrl} target="_blank" rel="noreferrer">Open Supplementary Table 1 ↗</a>
        </div>
      </details>

      <RussReconciliationDossier onNotice={onNotice} />
    </section>
  );
}
