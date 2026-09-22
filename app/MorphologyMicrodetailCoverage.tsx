/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- exact-value evidence tables are keyboard-scrollable regions */
import type { MorphologyCensusRecord } from "./morphology-census-data";
import {
  MORPHOLOGY_MICRODETAIL_AXIS_ORDER,
  buildMorphologyMicrodetailCoverage,
} from "./morphology-microdetail.js";

const SLOT_COLORS = ["#75cdb9", "#f3b33e", "#cc79a7", "#56b4e9"];

function shortBasis(axis: { status: string; basis: string; limitation: string }) {
  if (axis.status === "UNAVAILABLE") return axis.basis.replaceAll("_", " ");
  return `${axis.basis} ${axis.limitation}`;
}

export default function MorphologyMicrodetailCoverage({ records }: { records: MorphologyCensusRecord[] }) {
  const coverage = records.map(buildMorphologyMicrodetailCoverage);
  if (!coverage.length) return null;
  return (
    <section className="morphology-record-comparison-table morphology-microdetail-coverage" aria-labelledby="morphology-microdetail-coverage-heading">
      <header>
        <div><span>REFERENCE-GATED STRUCTURAL PRECISION</span><h4 id="morphology-microdetail-coverage-heading">Per-record micro-detail evidence matrix</h4></div>
        <p>OBS = deposited input · DERIVED = deterministic display only · UNAVAILABLE = zero primitives</p>
      </header>
      <p className="morphology-microdetail-intro">This matrix does not repair missing anatomy. It identifies exactly which visible detail is authorized for each source object and prevents a generic nucleus, membrane, organelle, bouton, receptor map, partner, or atlas position from being inserted.</p>
      <div className="morphology-table-scroll" role="region" tabIndex={0} aria-label="Per-record micro-detail evidence coverage">
        <table>
          <thead><tr><th scope="col">Structural axis</th>{coverage.map((item, index) => <th scope="col" key={item.neuronId}><i style={{ background: SLOT_COLORS[index] }} />{String.fromCharCode(65 + index)} · NMO {item.neuronId}</th>)}</tr></thead>
          <tbody>{MORPHOLOGY_MICRODETAIL_AXIS_ORDER.map((axisId) => {
            const first = coverage[0].axes.find((axis) => axis.id === axisId)!;
            return <tr key={axisId}><th scope="row">{first.label}</th>{coverage.map((item) => {
              const axis = item.axes.find((candidate) => candidate.id === axisId)!;
              return <td key={item.neuronId}><span className={`microdetail-status ${axis.status.toLowerCase()}`}>{axis.status}</span><small>{shortBasis(axis)}</small><code>{axis.sourceField}</code></td>;
            })}</tr>;
          })}</tbody>
        </table>
      </div>
      <div className="morphology-microdetail-receipts" aria-label="Micro-detail source record locators">
        {coverage.map((item, index) => <article key={item.neuronId}><strong>{String.fromCharCode(65 + index)} · NMO {item.neuronId}</strong><span>DOI {item.sourceRecordLocators.dois.join(" · ") || "not supplied"}</span><span>PMID {item.sourceRecordLocators.pmids.join(" · ") || "not supplied"}</span><code>{item.sourceRecordLocators.geometryPath}</code></article>)}
      </div>
      <p className="morphology-microdetail-footer"><strong>Unavailable means no same-specimen source object is admitted; it does not mean the structure is biologically absent.</strong> Coverage is computed for every one of the 142 admitted records from the pinned census. Co-display creates no same-cell, same-type, synaptic, or atlas relationship.</p>
    </section>
  );
}
