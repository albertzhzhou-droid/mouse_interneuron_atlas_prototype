"use client";

import { useMemo, useState } from "react";
import taxonomy from "../data/kelly-zebrafish-spinal-interneuron-taxonomy-0.1.json";

type FilterClass = "all" | "inhibitory" | "excitatory" | "mixed";
type Population = typeof taxonomy.populations[number];

const FILTERS: Array<{ id: FilterClass; label: string }> = [
  { id: "all", label: "All" },
  { id: "inhibitory", label: "Inhibitory" },
  { id: "excitatory", label: "Excitatory" },
  { id: "mixed", label: "Mixed" },
];

export default function ZebrafishSpinalTaxonomyPanel() {
  const [filter, setFilter] = useState<FilterClass>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("kelly-2023:v2a");
  const matching = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
    return taxonomy.populations.filter((population) => {
      const matchesFilter = filter === "all" || population.filterClass === filter;
      const searchable = [population.sourceLabel, population.expandedLabel, population.transmitterLabel, ...population.combinationCodeMarkers]
        .join(" ")
        .toLocaleLowerCase("en-US");
      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [filter, query]);
  const selected: Population = taxonomy.populations.find((population) => population.id === selectedId) ?? taxonomy.populations[0];
  const sampleFrame = taxonomy.samplingAndAssignment;

  return (
    <section className="zebrafish-taxonomy-panel" aria-labelledby="zebrafish-taxonomy-heading" data-source-id={taxonomy.source.sourceId}>
      <header className="zebrafish-taxonomy-header">
        <div>
          <p className="zebrafish-taxonomy-eyebrow">UPG-229 · COMPARATIVE SOURCE LANE · DANIO RERIO · 4 DPF</p>
          <h3 id="zebrafish-taxonomy-heading">Larval zebrafish spinal interneuron labels</h3>
          <p>
            Source-reported molecular classes from the Kelly et al. spinal-circuit study. Kept separate from the {" "}
            core mouse type-profile set; this view adds no cross-species equivalence or cell geometry.
          </p>
        </div>
        <div className="zebrafish-taxonomy-authority" role="note">
          <strong>{taxonomy.populations.length} labels</strong>
          <span>0 linked morphologies · 0 internal objects · 0 mouse equivalences</span>
        </div>
      </header>

      <div className="zebrafish-taxonomy-metrics" aria-label="Study-reported sample and assignment context">
        <article><span>Integrated spinal cells</span><strong>{sampleFrame.reportedIntegratedPostQcSpinalCellCount.toLocaleString("en-US")}</strong><small>post-QC cells, two integrated sequencing replicates</small></article>
        <article><span>Assigned clusters</span><strong>{sampleFrame.reportedConfidentlyAssignedClusterCount}/{sampleFrame.reportedAllSpinalNeuronClusterCount}</strong><small>not an interneuron count</small></article>
        <article><span>Label basis</span><strong>Table + figures</strong><small>{sampleFrame.reportedCombinationCodeTableRowCount} combination-code rows include non-interneurons</small></article>
      </div>

      <div className="zebrafish-taxonomy-sample-warning" role="note">
        <strong>Sampling denominator unresolved.</strong> GEO describes 150 fish overall, while the article methods describe about 150 spinal cords in each duplicate experiment. The source animal/cord total is therefore left unknown; captured-cell counts are not prevalence.
      </div>

      <div className="zebrafish-taxonomy-controls">
        <label>
          Search type or marker
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. v2a, foxd3, glycine" />
        </label>
        <div role="group" aria-label="Filter source-reported transmitter classes" className="zebrafish-taxonomy-filters">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="zebrafish-taxonomy-browser">
        <div className="zebrafish-taxonomy-list" role="listbox" aria-label="Article-reported zebrafish interneuron labels">
          {matching.map((population) => (
            <button
              key={population.id}
              type="button"
              role="option"
              aria-selected={selected.id === population.id}
              onClick={() => setSelectedId(population.id)}
            >
              <span>{population.sourceLabel}</span>
              <small>{population.transmitterLabel}</small>
            </button>
          ))}
          {matching.length === 0 && <p className="zebrafish-taxonomy-empty">No source labels match this filter.</p>}
        </div>

        <article className="zebrafish-taxonomy-detail" aria-live="polite" aria-labelledby="zebrafish-selected-label">
          <p className="zebrafish-taxonomy-eyebrow">SOURCE-LOCAL LABEL · {selected.evidenceLocator}</p>
          <h4 id="zebrafish-selected-label">{selected.sourceLabel}</h4>
          <p>{selected.expandedLabel}</p>
          <dl>
            <div><dt>Source role</dt><dd>{selected.sourceRole}</dd></div>
            <div><dt>Transmitter label</dt><dd>{selected.transmitterLabel}</dd></div>
            <div><dt>Combination-code genes</dt><dd>{selected.combinationCodeMarkers.map((marker) => <code key={marker}>{marker}</code>)}</dd></div>
          </dl>
          {"additionalTransmitterEvidence" in selected && (
            <p className="zebrafish-taxonomy-subtype-note">{selected.additionalTransmitterEvidence}</p>
          )}
          {selected.subtypeEvidence.length > 0 && (
            <div className="zebrafish-taxonomy-subtypes">
              <h5>Source-reported v2a subdivisions</h5>
              {selected.subtypeEvidence.map((item) => (
                <div key={item.label}><strong>{item.label}</strong><p>{item.sourceStatement}</p></div>
              ))}
            </div>
          )}
          <p className="zebrafish-taxonomy-subtype-note">
            Markers summarize the paper&apos;s combination code; they are not universal or exclusive markers. The source RDS has not yet been parsed for barcode-level assignments.
          </p>
        </article>
      </div>

      <details className="zebrafish-taxonomy-exclusions">
        <summary>Excluded and unresolved source populations</summary>
        <ul>
          {taxonomy.excludedSourceLabels.map((item) => <li key={item.sourceLabel}><strong>{item.sourceLabel}</strong> — {item.sourceRole}; {item.reason}</li>)}
          <li><strong>Clusters 6, 11 and 17</strong> — mixed neuron/glia signal; source authors could not confidently resolve cell type versus doublets.</li>
          <li><strong>v3 and v0d</strong> — mentioned as known classes but not confidently identified in this 4 dpf dataset.</li>
        </ul>
      </details>

      <footer className="zebrafish-taxonomy-sources">
        <span>Source links:</span>
        <a href={taxonomy.source.article.url} target="_blank" rel="noreferrer">Peer-reviewed article ↗</a>
        <a href={taxonomy.source.article.tableUrl} target="_blank" rel="noreferrer">Table 1 ↗</a>
        <a href={taxonomy.source.geo.url} target="_blank" rel="noreferrer">GEO GSE232801 ↗</a>
        <span>Raw RDS: link-only; file hash and redistribution terms not assessed.</span>
      </footer>
    </section>
  );
}
