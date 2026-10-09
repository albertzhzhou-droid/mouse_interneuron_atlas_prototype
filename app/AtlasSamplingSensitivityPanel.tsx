"use client";

import { useState } from "react";
import report from "../data/atlas-sampling-sensitivity-0.1.json";
import "./atlas-sampling-sensitivity.css";

const percentage = (value: number | null) => value === null ? "Unknown" : `${(value * 100).toFixed(2)}%`;

export default function AtlasSamplingSensitivityPanel() {
  const [selectedId, setSelectedId] = useState("archived_15");
  const selected = report.strategies.find((strategy) => strategy.id === selectedId) ?? report.strategies[0];
  const exportReport = () => {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(report, null, 2)}\n`], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "allen-cord-source-local-sampling-sensitivity.json";
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="atlas-sampling-sensitivity" aria-labelledby="sampling-sensitivity-title">
      <div className="sampling-sensitivity-heading">
        <div>
          <p className="sampling-sensitivity-eyebrow">Same-source sampling · UPG-026</p>
          <h3 id="sampling-sensitivity-title">How much annotation does each plane selection represent?</h3>
        </div>
        <button type="button" onClick={exportReport}>Export counts and evidence</button>
      </div>
      <p>These counts replay four plane selections against the same fixed Allen annotation. The current 38 planes cover all 32 repeating annotation states and all 73 direct labels. Adding 37 midpoint planes increases the sampled budget but finds no additional state.</p>
      <div className="sampling-sensitivity-table-wrap">
        <table>
          <caption>All direct labels, including separate motor and structural context lanes</caption>
          <thead><tr><th scope="col">Plane selection</th><th scope="col">States covered</th><th scope="col">Labels sampled</th><th scope="col">Represented state voxels</th><th scope="col">Voxels on selected planes</th></tr></thead>
          <tbody>{report.strategies.map((strategy) => (
            <tr key={strategy.id}>
              <th scope="row">{strategy.label}</th>
              <td>{strategy.coveredStateCount}/{strategy.sourceStateCount}</td>
              <td>{strategy.totals.sampledLabelCount}/{strategy.totals.directLabelCount}</td>
              <td>{percentage(strategy.totals.representedStateVoxelFraction)}</td>
              <td>{percentage(strategy.totals.sampledVoxelFraction)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="sampling-sensitivity-boundary">Represented state voxels count all native planes in a hash-verified repeating state. Selected-plane voxels count only the actual chosen planes. Neither percentage measures anatomical accuracy, biological error or registration quality; states are not spinal segments or independent specimens.</p>
      <p>The 15 and 38 selections have verified local plane assets. The historical 33 selection is declared in the fixed generator; its old output is unavailable. The 75 selection is a declared counting strategy and has no new slice assets. The original compressed cache is unavailable; all 32 state hashes and the full annotation semantic hash were reverified from existing lossless masks.</p>
      <details>
        <summary>Inspect exact labels, missed states and evidence</summary>
        <label className="sampling-sensitivity-choice">Selection
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {report.strategies.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.label}</option>)}
          </select>
        </label>
        <p>{selected.definition}</p>
        <p>Missed annotation states: {selected.missedStateIndices.length ? selected.missedStateIndices.join(", ") : "None"}. A source label missed by sampling remains source-present.</p>
        <div className="sampling-sensitivity-table-wrap">
          <table>
            <caption>{selected.label} · exact direct-label counts</caption>
            <thead><tr><th scope="col">Source label</th><th scope="col">Lane</th><th scope="col">Full source voxels</th><th scope="col">Represented state voxels</th><th scope="col">Selected-plane voxels</th><th scope="col">Source states missed</th></tr></thead>
            <tbody>{selected.labels.map((label) => (
              <tr key={label.identifier}>
                <th scope="row">{label.identifier} · {label.name}</th>
                <td>{label.semanticLaneId.replaceAll("_", " ")}</td>
                <td>{label.fullSourceVoxelCount.toLocaleString("en-US")}</td>
                <td>{percentage(label.representedStateVoxelFraction)}</td>
                <td>{label.sampledVoxelCount.toLocaleString("en-US")}{label.sampledVoxelCount === 0 ? " · source-present, unsampled" : ""}</td>
                <td>{label.missedPresenceStateIndices.length ? label.missedPresenceStateIndices.join(", ") : "None"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p>Fixed annotation: <code>{report.source.annotationComponent}</code> · frame <code>{report.source.coordinateSpaceId}</code>. SHA-256, exact native indices, 73 mask receipts and all plane receipts are included in the export.</p>
      </details>
    </section>
  );
}
