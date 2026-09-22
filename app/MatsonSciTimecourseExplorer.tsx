"use client";

import { useMemo, useState } from "react";
import { matsonNeuronalSciTimecourse } from "./atlas-types";
import {
  MATSON_SCI_TIMEPOINT_IDS,
  filterMatsonPopulations,
  findMatsonPopulation,
  groupMatsonPopulations,
  populationReplicatesForTimepoint,
} from "./matson-sci-timecourse.js";

export type MatsonSciTimepoint = (typeof MATSON_SCI_TIMEPOINT_IDS)[number];
type Population = (typeof matsonNeuronalSciTimecourse.populations)[number];
type ClassFilter = "all" | "excitatory" | "inhibitory" | "motor_context";

const CLASS_LABELS: Record<Exclude<ClassFilter, "all">, string> = {
  excitatory: "Excitatory source populations",
  inhibitory: "Inhibitory source populations",
  motor_context: "Motor-neuron context",
};

function readable(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function percent(value: number) {
  return `${(value * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

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

function RankedMarkerPanel({ population }: { population: Population }) {
  const dataset = matsonNeuronalSciTimecourse;
  const panel = population.rankedMarkerPanel;
  const headingId = `matson-marker-panel-${population.shortLabel.toLowerCase().replaceAll(" ", "-")}`;
  const visibleRanks = panel.rankedGenes.slice(0, 5);
  const remainingRanks = panel.rankedGenes.slice(5);

  const renderMarker = (marker: (typeof panel.rankedGenes)[number]) => (
    <li key={`${marker.rank}-${marker.gene}`}>
      <span aria-label={`Rank ${marker.rank}`}>{marker.rank}</span>
      <strong>{marker.gene}</strong>
      <code title={`${panel.worksheet}!${marker.sourceCell}`}>{marker.sourceCell}</code>
    </li>
  );

  return (
    <section className="matson-marker-panel" aria-labelledby={headingId} data-marker-count={panel.rankedGenes.length}>
      <header>
        <div>
          <span>SUPPLEMENTARY DATASET 2 · RANK ONLY</span>
          <h5 id={headingId}>Complete ranked marker panel</h5>
        </div>
        <strong>{panel.retainedRankCount} / {panel.sourceRankCount} retained</strong>
      </header>
      <p>{panel.boundary}</p>
      <ol className="matson-marker-ranks" aria-label={`Ranks 1 through 5 for ${population.sourceLabel}`}>
        {visibleRanks.map(renderMarker)}
      </ol>
      <details>
        <summary>Show ranks 6–20 and source cells</summary>
        <ol className="matson-marker-ranks" start={6} aria-label={`Ranks 6 through 20 for ${population.sourceLabel}`}>
          {remainingRanks.map(renderMarker)}
        </ol>
      </details>
      <dl>
        <div><dt>Workbook range</dt><dd>{panel.worksheet}!{panel.headerCell}, {panel.rankCellRange}</dd></div>
        <div><dt>Workbook SHA-256</dt><dd>{panel.sourceSha256}</dd></div>
        <div><dt>Derived 17 × 20 panel SHA-256</dt><dd>{dataset.rankedMarkerPanelProvenance.derivedPanelSha256}</dd></div>
        <div><dt>Unavailable statistics</dt><dd>Score · expression magnitude · specificity · fold change · p-value</dd></div>
      </dl>
    </section>
  );
}

function PopulationDossier({
  population,
  selectedTimepoint,
}: {
  population: Population;
  selectedTimepoint: MatsonSciTimepoint;
}) {
  const dataset = matsonNeuronalSciTimecourse;
  const replicates = populationReplicatesForTimepoint(population, dataset.samples, selectedTimepoint) as Population["sampleCounts"];
  const focusedTimepoint = selectedTimepoint === "all"
    ? null
    : dataset.timepoints.find((timepoint) => timepoint.id === selectedTimepoint) ?? null;

  return (
    <article className="matson-sci-dossier" data-focus-kind="sci_population" data-focus-id={population.id}>
      <header>
        <div>
          <p className="panel-kicker">SOURCE-LOCAL SCI POPULATION · {population.transmitterContext.toUpperCase()}</p>
          <h4>{population.sourceLabel}</h4>
          <p>{population.sourceSubclass} · {population.capturedNeuronalNuclei.toLocaleString("en-US")} captured neuronal nuclei across 15 cords</p>
        </div>
        <span className={`badge matson-${population.transmitterContext}`}>
          {population.transmitterContext === "motor_context" ? "MOTOR CONTEXT" : "LOCAL / PROJECTION UNRESOLVED"}
        </span>
      </header>

      <p className="matson-sci-boundary"><strong>Record boundary:</strong> {population.evidenceBoundary}</p>

      <section className="matson-timecourse-table" aria-labelledby="matson-timecourse-table-heading">
        <div className="matson-subheading">
          <div>
            <span>FIVE DISCRETE CONDITIONS · NOT A CONTINUOUS TRAJECTORY</span>
            <h5 id="matson-timecourse-table-heading">Captured nucleus counts by timepoint</h5>
          </div>
          <small>Each row: three independent animals</small>
        </div>
        <div className="matson-table-scroll" role="region" aria-label={`${population.sourceLabel} captured nucleus counts by timepoint`}>
          <table>
            <thead>
              <tr>
                <th scope="col">Condition</th>
                <th scope="col">Phase</th>
                <th scope="col">Cords</th>
                <th scope="col">Population nuclei</th>
                <th scope="col">All neuronal nuclei</th>
                <th scope="col">Captured share</th>
              </tr>
            </thead>
            <tbody>
              {population.timepointCounts.map((observation) => {
                const timepoint = dataset.timepoints.find((item) => item.id === observation.timepointId);
                const highlighted = selectedTimepoint !== "all" && selectedTimepoint === observation.timepointId;
                return (
                  <tr key={observation.timepointId} className={highlighted ? "selected" : ""}>
                    <th scope="row">{timepoint?.sourceLabel}</th>
                    <td>{timepoint ? readable(timepoint.phase) : "Unavailable"}</td>
                    <td>{timepoint?.independentAnimalCount ?? "—"}</td>
                    <td>{observation.count.toLocaleString("en-US")}</td>
                    <td>{observation.capturedNeuronalNucleiDenominator.toLocaleString("en-US")}</td>
                    <td>{percent(observation.shareOfCapturedNeuronalNuclei)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="matson-count-boundary">
          Captured share is the population count divided by all neuronal nuclei retained at that timepoint. It is not tissue prevalence, cell loss, expansion, or a longitudinal same-cell measurement.
        </p>
      </section>

      {focusedTimepoint && (
        <section className="matson-replicate-panel" aria-labelledby="matson-replicate-heading">
          <div className="matson-subheading">
            <div>
              <span>{focusedTimepoint.sourceLabel.toUpperCase()} · THREE BIOLOGICAL REPLICATES</span>
              <h5 id="matson-replicate-heading">Sample-level denominator audit</h5>
            </div>
            <strong>{focusedTimepoint.capturedNeuronalNuclei.toLocaleString("en-US")} neuronal nuclei</strong>
          </div>
          <div className="matson-replicate-grid">
            {replicates.map((observation) => {
              const sample = dataset.samples.find((item) => item.id === observation.sampleId);
              return (
                <article key={observation.sampleId}>
                  <span>{observation.sampleId} · {observation.geoAccession}</span>
                  <strong>{observation.count.toLocaleString("en-US")} / {observation.capturedNeuronalNucleiDenominator.toLocaleString("en-US")}</strong>
                  <p>{sample?.geoTitle} · BioSample {sample?.bioSample} · {sample?.sraExperiment}</p>
                  <a href={`https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${observation.geoAccession}`} target="_blank" rel="noreferrer">Open sample record ↗</a>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <RankedMarkerPanel population={population} />

      <div className="matson-dossier-grid">
        <section>
          <h5>What this record establishes</h5>
          <dl>
            <div><dt>Source label</dt><dd>{population.sourceLabel}</dd></div>
            <div><dt>Source subclass</dt><dd>{population.sourceSubclass}</dd></div>
            <div><dt>Transmitter context</dt><dd>{readable(population.transmitterContext)}</dd></div>
            <div><dt>Annotation method</dt><dd>{population.sourceAnnotationMethod}</dd></div>
            <div><dt>Ranked marker depth</dt><dd>{population.rankedMarkerPanel.retainedRankCount} of {population.rankedMarkerPanel.sourceRankCount} source ranks retained with exact workbook cells</dd></div>
            <div><dt>Project use</dt><dd>{readable(population.projectUseClass)}</dd></div>
          </dl>
        </section>
        <section>
          <h5>Unavailable for this exact record</h5>
          <ul>
            {Object.entries(population.missingEvidence).map(([axis, status]) => (
              <li key={axis}><strong>{readable(axis)}</strong><span>{readable(status)}</span></li>
            ))}
          </ul>
        </section>
      </div>

      <details className="matson-technical-provenance">
        <summary>Technical and source provenance</summary>
        <dl>
          <div><dt>Canonical focus</dt><dd>sci_population:{population.id}</dd></div>
          <div><dt>GEO</dt><dd>{dataset.source.repositories.geo.accession}</dd></div>
          <div><dt>Source metadata SHA-256</dt><dd>{dataset.source.sourceFiles[0].sha256}</dd></div>
          <div><dt>Marker workbook SHA-256</dt><dd>{dataset.rankedMarkerPanelProvenance.sourceSha256}</dd></div>
          <div><dt>Derived marker panel SHA-256</dt><dd>{dataset.rankedMarkerPanelProvenance.derivedPanelSha256}</dd></div>
          <div><dt>Project registrations</dt><dd>{dataset.scope.projectRegistrationCount}</dd></div>
          <div><dt>Exact cross-source identities</dt><dd>{dataset.scope.exactCrossSourceIdentityCount}</dd></div>
        </dl>
      </details>
    </article>
  );
}

export default function MatsonSciTimecourseExplorer({
  selectedFocusId,
  selectedTimepoint,
  onSelectedFocusChange,
  onTimepointChange,
  onNotice,
}: {
  selectedFocusId?: string | null;
  selectedTimepoint: MatsonSciTimepoint;
  onSelectedFocusChange: (focusId: string) => void;
  onTimepointChange: (timepoint: MatsonSciTimepoint) => void;
  onNotice?: (notice: string) => void;
}) {
  const dataset = matsonNeuronalSciTimecourse;
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const effectiveFocusId = selectedFocusId ?? dataset.populations[0].id;
  const selectedPopulation = findMatsonPopulation(dataset.populations, effectiveFocusId) as Population | null;
  const visiblePopulations = useMemo(
    () => filterMatsonPopulations(dataset.populations, { query, classFilter }) as Population[],
    [classFilter, dataset.populations, query],
  );
  const groups = useMemo(() => groupMatsonPopulations(visiblePopulations) as Array<{ id: Exclude<ClassFilter, "all">; populations: Population[] }>, [visiblePopulations]);
  const selectedVisible = selectedPopulation === null || visiblePopulations.some((population) => population.id === selectedPopulation.id);

  const selectPopulation = (population: Population) => {
    onSelectedFocusChange(population.id);
    onNotice?.(`${population.sourceLabel} selected · Matson/GSE172167 namespace retained`);
  };

  return (
    <section className="matson-sci-explorer" aria-labelledby="matson-sci-heading">
      <div className="matson-sci-heading">
        <div>
          <p className="panel-kicker">UPG-064 + UPG-076 · SOURCE-LOCAL NEURONAL SCI TIME COURSE</p>
          <h3 id="matson-sci-heading">Lumbar neuronal states after T9 contusion</h3>
          <p>
            Inspect the five sampled conditions, 15 independent cords and all 17 source-local neuronal population labels from Matson et al. Counts retain their exact library denominators and never become biological prevalence.
          </p>
        </div>
        <span className="badge schematic">0 REG · 0 CROSS-SOURCE IDENTITIES</span>
      </div>

      <div className="matson-scope-grid" aria-label="Matson GSE172167 source frame">
        <article><strong>{dataset.scope.independentAnimalCount}</strong><span>female mouse cords</span><small>L2–S1 · 3 per condition · 12–30 weeks</small></article>
        <article><strong>{dataset.scope.conditionCount}</strong><span>sampled conditions</span><small>Uninjured through 6 wpi</small></article>
        <article><strong>{dataset.scope.capturedNeuronalNucleiCount.toLocaleString("en-US")}</strong><span>captured neuronal nuclei</span><small>{dataset.scope.capturedNucleiCount.toLocaleString("en-US")} retained nuclei total</small></article>
        <article><strong>{dataset.scope.neuronalPopulationCount}</strong><span>source populations</span><small>16 unresolved non-motor · 1 motor context</small></article>
      </div>

      <p className="matson-global-boundary" role="note">
        <strong>Modeling boundary:</strong> source labels, counts and timepoints are observed metadata. Coordinates, neurite geometry, atlas placement, same-cell tracing and synaptic edges are unavailable and remain empty.
      </p>

      <div className="matson-timepoint-tabs" role="group" aria-label="Filter the discrete SCI timepoint shown in the denominator audit">
        {MATSON_SCI_TIMEPOINT_IDS.map((timepointId) => {
          const timepoint = dataset.timepoints.find((item) => item.id === timepointId);
          const label = timepointId === "all" ? "All conditions" : timepoint?.sourceLabel ?? timepointId;
          return (
            <button
              type="button"
              className={selectedTimepoint === timepointId ? "active" : ""}
              aria-pressed={selectedTimepoint === timepointId}
              key={timepointId}
              onClick={() => onTimepointChange(timepointId as MatsonSciTimepoint)}
            >
              <strong>{label}</strong>
              <span>{timepoint ? `${readable(timepoint.phase)} · n=3` : "5 source conditions"}</span>
            </button>
          );
        })}
      </div>

      <div className="matson-sci-controls">
        <label>
          Search source population
          <input type="search" value={query} maxLength={120} placeholder="Pdyn, Parm1, SDR42E2…" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          Transmitter/source class
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value as ClassFilter)}>
            <option value="all">All 17 source populations</option>
            <option value="excitatory">Excitatory · 8</option>
            <option value="inhibitory">Inhibitory · 8</option>
            <option value="motor_context">Motor context · 1</option>
          </select>
        </label>
        <button type="button" onClick={() => { setQuery(""); setClassFilter("all"); }}>Reset filters</button>
        <button
          type="button"
          onClick={() => {
            if (!selectedPopulation) return;
            downloadJson({
              releaseId: dataset.releaseId,
              focusKind: "sci_population",
              selectedTimepoint,
              population: selectedPopulation,
              source: dataset.source,
              experimentalDesign: dataset.experimentalDesign,
              hardBoundaries: dataset.hardBoundaries,
            }, `matson-${selectedPopulation.shortLabel.toLowerCase().replaceAll(" ", "-")}-${selectedTimepoint}.json`);
            onNotice?.(`${selectedPopulation.sourceLabel} source-local receipt exported · no coordinates or cross-source joins`);
          }}
          disabled={!selectedPopulation}
        >
          Export focused receipt
        </button>
      </div>

      <div className="matson-sci-layout">
        <section className="matson-population-browser" aria-labelledby="matson-populations-heading">
          <header>
            <div><h4 id="matson-populations-heading">Source population records</h4><p role="status">{visiblePopulations.length} of {dataset.populations.length} shown</p></div>
            <span>Grouped by the paper&apos;s source class</span>
          </header>
          {!visiblePopulations.length && <p className="taxonomy-empty">No source population matches these filters. This is not biological absence.</p>}
          {groups.map((group) => (
            <section className="matson-population-group" aria-label={CLASS_LABELS[group.id]} key={group.id}>
              <div><h5>{CLASS_LABELS[group.id]}</h5><strong>{group.populations.length}</strong></div>
              <div>
                {group.populations.map((population) => (
                  <button
                    type="button"
                    className={selectedPopulation?.id === population.id ? "selected" : ""}
                    aria-pressed={selectedPopulation?.id === population.id}
                    key={population.id}
                    onClick={() => selectPopulation(population)}
                  >
                    <span>{population.sourceLabel}</span>
                    <small>{population.sourceSubclass} · {population.capturedNeuronalNuclei.toLocaleString("en-US")} nuclei</small>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </section>

        <div>
          {!selectedVisible && selectedPopulation && (
            <p className="matson-focus-retained" role="status">Focus retained outside the filtered list: {selectedPopulation.sourceLabel}. Filters did not substitute another population.</p>
          )}
          {selectedPopulation
            ? <PopulationDossier population={selectedPopulation} selectedTimepoint={selectedTimepoint} />
            : (
              <section className="matson-sci-dossier matson-focus-unavailable" data-focus-kind="sci_population" data-focus-id={effectiveFocusId}>
                <p className="panel-kicker">FOCUS UNAVAILABLE · FAIL-CLOSED</p>
                <h4>This exact SCI population record is unavailable</h4>
                <p><code>{effectiveFocusId}</code> was not found. The app did not substitute the first population.</p>
              </section>
            )}
        </div>
      </div>

      <section className="matson-rag-context" aria-labelledby="matson-rag-heading">
        <div>
          <p className="panel-kicker">SEPARATE CONTEXT ASSERTION · NOT IN THE 17-POPULATION DENOMINATOR</p>
          <h4 id="matson-rag-heading">{dataset.rareStateEvidence.label}</h4>
          <p>{dataset.rareStateEvidence.boundary}</p>
        </div>
        <div className="matson-rag-columns">
          <article><strong>RAG-state markers</strong><p>{dataset.rareStateEvidence.stateMarkers.join(" · ")}</p></article>
          <article><strong>Projection-associated markers</strong><p>{dataset.rareStateEvidence.projectionAssociatedMarkers.join(" · ")}</p></article>
          <article><strong>Directly stated observations</strong><ul>{dataset.rareStateEvidence.established.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
      </section>

      <section className="matson-source-conflicts" aria-labelledby="matson-conflicts-heading">
        <div>
          <p className="panel-kicker">SOURCE-CONFLICT LEDGER · NO SILENT REPAIR</p>
          <h4 id="matson-conflicts-heading">Six retained source discrepancies</h4>
          <p>Conflicting paper, GEO, supplementary-data and raw-run statements remain visible. The model does not choose a convenient value unless the source-specific decision is stated.</p>
        </div>
        <div>
          {dataset.sourceConflicts.map((conflict) => (
            <details key={conflict.id}>
              <summary><span>{conflict.id}</span>{conflict.topic}</summary>
              <ul>{conflict.statements.map((statement) => <li key={statement}>{statement}</li>)}</ul>
              <p><strong>Model decision:</strong> {conflict.decision}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="matson-source-footer">
        <div>
          <strong>{dataset.source.citation}</strong>
          <p>{dataset.experimentalDesign.selectionBoundary}</p>
          <p>{dataset.source.license.rightsBoundary}</p>
        </div>
        <div>
          <a href={dataset.source.articleUrl} target="_blank" rel="noreferrer">Primary article ↗</a>
          <a href={dataset.source.repositories.geo.url} target="_blank" rel="noreferrer">GEO GSE172167 ↗</a>
          <a href={dataset.source.repositories.sra.url} target="_blank" rel="noreferrer">SRA SRP315018 ↗</a>
        </div>
      </footer>
    </section>
  );
}
