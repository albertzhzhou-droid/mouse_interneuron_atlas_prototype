"use client";

import { useMemo, useState } from "react";
import { interneuronKnowledgeCoverage as knowledgeCoverageJson } from "./atlas-types";

type CoverageStatus = "direct" | "contextual" | "not_measured" | "not_ingested";
type Axis = { id: string; label: string; precisionQuestion: string };
type CoverageEntry = { axisId: string; status: CoverageStatus; evidence: string; sourceLocator: string; displayBoundary: string };
type Lane = {
  id: string;
  shortLabel: string;
  role: string;
  citation: string;
  doi: string;
  articleUrl: string;
  accessions: Array<{ id: string; url: string }>;
  sampleFrame: string;
  sourceLocalLabelScope: string;
  sourceLocalLabels: string[];
  crossStudyMappingStatus: "not_established";
  coordinateAuthority: "SOURCE_LOCAL_ONLY";
  projectRegistrationCount: 0;
  assetAccess: { publicMetadata: true; sourceObjectsBundled: false; assetLevelReuseStatus: "not_assumed" };
  coverage: CoverageEntry[];
  canAnswer: string[];
  cannotAnswer: string[];
};
type KnowledgeCoverage = {
  releaseId: string;
  releaseDate: string;
  projectRegistrationCount: 0;
  statusSemantics: Array<{ id: CoverageStatus; label: string; meaning: string }>;
  axes: Axis[];
  lanes: Lane[];
  hardBoundaries: string[];
};

const knowledgeCoverage = knowledgeCoverageJson as unknown as KnowledgeCoverage;
const STATUS_LABEL: Record<CoverageStatus, string> = {
  direct: "Direct",
  contextual: "Context",
  not_measured: "Not measured",
  not_ingested: "Not ingested",
};

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function downloadCoverage() {
  const blob = new Blob([JSON.stringify(knowledgeCoverage, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ohri-interneuron-knowledge-coverage-0.1.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function InterneuronKnowledgeCoverage({
  selectedFocusId,
  onSelectedFocusChange,
  onNotice,
}: {
  selectedFocusId?: string | null;
  onSelectedFocusChange?: (focusId: string) => void;
  onNotice?: (notice: string) => void;
}) {
  const [internalSelectedLaneId, setInternalSelectedLaneId] = useState(
    selectedFocusId && knowledgeCoverage.lanes.some((lane) => lane.id === selectedFocusId)
      ? selectedFocusId
      : knowledgeCoverage.lanes[0].id,
  );
  const [selectedAxisId, setSelectedAxisId] = useState(knowledgeCoverage.axes[0].id);
  const [statusFilter, setStatusFilter] = useState<"all" | CoverageStatus>("all");
  const [query, setQuery] = useState("");

  const visibleLanes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return knowledgeCoverage.lanes.filter((lane) => {
      const matchesText = !normalized || [
        lane.shortLabel,
        lane.role,
        lane.sampleFrame,
        lane.sourceLocalLabels.join(" "),
        lane.accessions.map((item) => item.id).join(" "),
      ].join(" ").toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || lane.coverage.some((entry) => entry.status === statusFilter);
      return matchesText && matchesStatus;
    });
  }, [query, statusFilter]);

  const selectedLaneId = selectedFocusId && knowledgeCoverage.lanes.some((lane) => lane.id === selectedFocusId)
    ? selectedFocusId
    : internalSelectedLaneId;

  const selectLane = (laneId: string) => {
    setInternalSelectedLaneId(laneId);
    onSelectedFocusChange?.(laneId);
  };

  const selectedLane = knowledgeCoverage.lanes.find((lane) => lane.id === selectedLaneId) ?? null;
  const selectedLaneVisible = selectedLane === null || visibleLanes.some((lane) => lane.id === selectedLane.id);
  const selectedAxis = knowledgeCoverage.axes.find((axis) => axis.id === selectedAxisId) ?? knowledgeCoverage.axes[0];
  const selectedCoverage = selectedLane?.coverage.find((entry) => entry.axisId === selectedAxis.id);

  return (
    <section className="knowledge-coverage" aria-labelledby="knowledge-coverage-heading">
      <div className="taxonomy-crosswalk-heading">
        <div>
          <span>PROJECT-CURATED SOURCE COVERAGE · METADATA ONLY</span>
          <h4 id="knowledge-coverage-heading">Interneuron knowledge coverage matrix</h4>
        </div>
        <span className="badge schematic">0 PROJECT REGISTRATIONS</span>
      </div>
      <p>
        Compare six public primary-source lanes across seven precision axes. Every label remains in its source namespace;
        a shared row or column does not establish cross-study identity.
      </p>
      <p className="taxonomy-boundary">
        Empty coverage is shown explicitly as not measured or not ingested. Neither status means that the biological feature is absent.
      </p>
      <p className="coverage-curation-note" id="knowledge-matrix-instructions">
        Coverage statuses are project-curated judgments dated <time dateTime={knowledgeCoverage.releaseDate}>{knowledgeCoverage.releaseDate}</time>,
        not author-supplied labels. Select a matrix cell to inspect its source locator and display boundary.
      </p>

      <div className="taxonomy-controls">
        <label>
          Search source, accession or label
          <input
            type="search"
            value={query}
            maxLength={160}
            placeholder="e.g. GSE103840, dorsal horn, DE-1"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          Coverage status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | CoverageStatus)}>
            <option value="all">All statuses</option>
            {knowledgeCoverage.statusSemantics.map((status) => (
              <option value={status.id} key={status.id}>{status.label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            downloadCoverage();
            onNotice?.("Project-curated knowledge coverage metadata exported · no source matrices, images or coordinates included");
          }}
        >
          Export coverage
        </button>
      </div>

      <dl className="coverage-status-definitions" aria-label="Coverage status definitions">
        {knowledgeCoverage.statusSemantics.map((status) => (
          <div key={status.id}>
            <dt><span className={`badge coverage-${status.id}`}>{status.label}</span></dt>
            <dd>{status.meaning}</dd>
          </div>
        ))}
      </dl>

      <p className="taxonomy-result-count" role="status">{visibleLanes.length} of {knowledgeCoverage.lanes.length} source lanes match</p>
      <div
        className="knowledge-matrix-scroll"
        role="region"
        aria-label="Scrollable source-by-evidence coverage matrix"
        aria-describedby="knowledge-matrix-instructions"
      >
        <table className="comparison-table knowledge-matrix">
          <thead>
            <tr>
              <th scope="col">Source lane</th>
              {knowledgeCoverage.axes.map((axis) => <th scope="col" key={axis.id}>{axis.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {visibleLanes.map((lane) => (
              <tr key={lane.id}>
                <th scope="row">
                  <button type="button" onClick={() => selectLane(lane.id)} aria-pressed={selectedLane?.id === lane.id}>
                    <strong>{lane.shortLabel}</strong><span>{lane.role}</span>
                  </button>
                </th>
                {knowledgeCoverage.axes.map((axis) => {
                  const entry = lane.coverage.find((item) => item.axisId === axis.id);
                  return (
                    <td key={axis.id}>
                      {entry && (
                        <button
                          type="button"
                          className={`coverage-cell coverage-${entry.status}`}
                          aria-label={`${lane.shortLabel}, ${axis.label}: project-curated status ${STATUS_LABEL[entry.status]}`}
                          aria-pressed={selectedLane?.id === lane.id && selectedAxis.id === axis.id}
                          onClick={() => {
                            selectLane(lane.id);
                            setSelectedAxisId(axis.id);
                          }}
                        >
                          {STATUS_LABEL[entry.status]}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visibleLanes.length && <p className="taxonomy-empty">No source lane matches these filters. This is not evidence that a cell type or feature is absent.</p>}
      {!selectedLaneVisible && selectedLane && (
        <p className="taxonomy-empty" role="status">
          Focus retained outside the filtered matrix: {selectedLane.shortLabel}. Filters never substitute another source lane.
        </p>
      )}

      {selectedLane && <article className="taxonomy-population-detail knowledge-lane-detail" aria-live="polite">
        <p>{selectedLane.role.toUpperCase()} · {selectedLane.accessions.map((item) => item.id).join(" + ")}</p>
        <h5>{selectedLane.shortLabel}</h5>
        <dl className="catalog-detail-grid">
          <div><dt>Selected precision axis</dt><dd>{selectedAxis.label}</dd></div>
          <div><dt>Coverage status</dt><dd>{selectedCoverage ? STATUS_LABEL[selectedCoverage.status] : "Unavailable"}</dd></div>
          <div><dt>Judgment authority</dt><dd>Project-curated</dd></div>
          <div><dt>Curation date</dt><dd><time dateTime={knowledgeCoverage.releaseDate}>{knowledgeCoverage.releaseDate}</time></dd></div>
          <div><dt>Source locator</dt><dd>{selectedCoverage?.sourceLocator ?? "Unavailable"}</dd></div>
          <div><dt>Cross-study mapping</dt><dd>{prettify(selectedLane.crossStudyMappingStatus)}</dd></div>
          <div><dt>Project registrations</dt><dd>{selectedLane.projectRegistrationCount}</dd></div>
          <div><dt>Asset reuse</dt><dd>{prettify(selectedLane.assetAccess.assetLevelReuseStatus)}</dd></div>
          <div><dt>Coordinate authority</dt><dd>{prettify(selectedLane.coordinateAuthority)}</dd></div>
        </dl>
        <p><strong>{selectedAxis.precisionQuestion}</strong></p>
        {selectedCoverage && (
          <>
            <p>{selectedCoverage.evidence}</p>
            <p className="taxonomy-boundary"><strong>Display boundary:</strong> {selectedCoverage.displayBoundary}</p>
          </>
        )}
        <p><strong>Sample frame:</strong> {selectedLane.sampleFrame}</p>
        <p><strong>Source-local labels:</strong> {selectedLane.sourceLocalLabels.join(" · ")}</p>
        <p>{selectedLane.sourceLocalLabelScope}</p>
        <div className="source-stack">
          <a className="source-link" href={selectedLane.articleUrl} target="_blank" rel="noreferrer">Primary article · DOI {selectedLane.doi} ↗</a>
          {selectedLane.accessions.map((accession) => (
            <a className="source-link" href={accession.url} target="_blank" rel="noreferrer" key={accession.id}>Public record · {accession.id} ↗</a>
          ))}
        </div>
      </article>}

      {selectedLane && <div className="taxonomy-crosswalk-mapping-list knowledge-answer-grid">
        <article>
          <strong>What this lane can answer</strong>
          <ul>{selectedLane.canAnswer.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article>
          <strong>What this lane cannot answer</strong>
          <ul>{selectedLane.cannotAnswer.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>}

      <details className="taxonomy-crosswalk-details">
        <summary>Global safeguards for more detailed modeling</summary>
        <ul>{knowledgeCoverage.hardBoundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul>
      </details>
    </section>
  );
}

export { knowledgeCoverage };
