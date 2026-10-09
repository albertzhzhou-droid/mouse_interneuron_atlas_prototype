"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import metadata from "../data/bil-xenium-source-metadata-0.1.json";
import coordinateAudit from "../data/bil-xenium-coordinate-source-audit-0.1.json";
import polygonAudit from "../data/bil-xenium-polygon-source-audit-0.1.json";
import imageMetadataAudit from "../data/bil-xenium-image-metadata-audit-0.1.json";
import { validateBilXeniumImageMetadataAudit } from "./bil-xenium-image-metadata-audit.js";
import { validateBilXeniumPolygonSourceAudit } from "./bil-xenium-polygon-source-audit.js";
import workflowAudit from "../data/bil-xenium-published-workflow-audit-0.1.json";
import { validateBilPublishedWorkflowAudit } from "./bil-xenium-published-workflow-audit.js";
import { validateBilXeniumCoordinateSourceAudit } from "./bil-xenium-coordinate-source-audit.js";
import geometryAudit from "../data/bil-xenium-geometry-schema-audit-0.1.json";
import { validateBilXeniumMetadata } from "./bil-xenium-source-metadata.js";
import { buildBilXeniumCurrentRunReceipt, validateBilXeniumGeometrySchemaAudit } from "./bil-xenium-geometry-schema-audit.js";
import BilXeniumGeometrySchemaAudit from "./BilXeniumGeometrySchemaAudit";
import styles from "./bil-xenium-metadata-explorer.module.css";

const subscribeToClientReady = () => () => {};
const readClientReady = () => true;
const readServerReady = () => false;

function exportJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BilXeniumMetadataExplorer() {
  const id = useId();
  const clientReady = useSyncExternalStore(subscribeToClientReady, readClientReady, readServerReady);
  const [selectedKey, setSelectedKey] = useState(metadata.runs[0]?.sourceObjectKey ?? "");
  const [query, setQuery] = useState("");
  const [lastExport, setLastExport] = useState<string | null>(null);
  const selectRun = (key: string) => { setSelectedKey(key); setQuery(""); setLastExport(null); };
  const validation = useMemo(() => {
    try { validateBilPublishedWorkflowAudit(workflowAudit); validateBilXeniumGeometrySchemaAudit(geometryAudit, metadata); validateBilXeniumCoordinateSourceAudit(coordinateAudit, geometryAudit); validateBilXeniumPolygonSourceAudit(polygonAudit, coordinateAudit, geometryAudit); validateBilXeniumImageMetadataAudit(imageMetadataAudit, coordinateAudit, geometryAudit); return { valid: true, error: "", counts: validateBilXeniumMetadata(metadata) }; }
    catch (error) { return { valid: false, error: error instanceof Error ? error.message : "Metadata validation failed", counts: null }; }
  }, []);
  const run = validation.valid ? metadata.runs.find((candidate) => candidate.sourceObjectKey === selectedKey) : null;
  const labels = run?.namedOutlineLabels.filter((label) => label.toLowerCase().includes(query.toLowerCase())) ?? [];
  const exportReceipt = () => {
    const receipt = buildBilXeniumCurrentRunReceipt(geometryAudit, metadata, selectedKey, coordinateAudit, workflowAudit, polygonAudit, imageMetadataAudit);
    if (receipt) { setLastExport(JSON.stringify(receipt, null, 2)); exportJson(receipt, `bil-xenium-${run?.bildid}-metadata.json`); }
  };

  return <section className={styles.panel} aria-labelledby={`${id}-title`} data-testid="bil-xenium-metadata-explorer">
    <div className={styles.heading}>
      <div><small>BIL 10.35077/g.1196 · checked {metadata.checkedDate}</small><h3 id={`${id}-title`}>Mouse spinal Xenium · source metadata</h3></div>
      <span className={styles.badge}>Metadata only · 0 cell geometry</span>
    </div>
    <p>{metadata.collection.runSlideBundleCount} run/slide bundles report {metadata.collection.rawSegmentedCellCount.toLocaleString()} raw XOA segmentations. These are processed source counts; they do not identify interneurons or establish an animal or section census.</p>
    {!validation.valid ? <p role="alert">{validation.error}</p> : <>
      <div className={styles.controls}>
        <label htmlFor={`${id}-run`}>Source run/slide
          <select id={`${id}-run`} disabled={!clientReady} value={selectedKey} onChange={(event) => selectRun(event.target.value)}>
            {metadata.runs.map((candidate) => <option key={candidate.sourceObjectKey} value={candidate.sourceObjectKey}>{candidate.directoryFolder} · {candidate.bildid}</option>)}
          </select>
        </label>
        <button type="button" disabled={!run || !clientReady} onClick={exportReceipt}>Export selected metadata</button>
      </div>
      {!clientReady && <p role="status">Loading source controls…</p>}
      {run ? <div aria-live="polite" key={run.sourceObjectKey}>
        <dl className={styles.facts}>
          <div><dt>Exact source object</dt><dd>{run.sourceObjectKey}</dd></div>
          <div><dt>Run / cassette / slide / region</dt><dd>{run.manifestIdentity.run_name} / {run.manifestIdentity.cassette_name} / {run.manifestIdentity.slide_id} / {run.manifestIdentity.region_name}</dd></div>
          <div><dt>ROI identity</dt><dd>{run.manifestIdentity.roi_uuid}</dd></div>
          <div><dt>Analysis identity</dt><dd>{run.manifestIdentity.analysis_uuid}</dd></div>
          <div><dt>Source processing</dt><dd>{run.processing.analysisSoftware} · {run.processing.stain}</dd></div>
          <div><dt>Raw segmentations / named outline labels</dt><dd>{run.rawSegmentedCellCount.toLocaleString()} / {run.namedOutlineLabelCount}</dd></div>
        </dl>
        <p className={styles.notice}>The ROI and directory are processing units. Dataset specimen records and outline names remain separate; neither assigns a donor or section to each cell.</p>
        <table className={styles.table} aria-label="Source run segmentation methods"><thead><tr><th>Source processing method</th><th>Cells in run metrics</th></tr></thead>
          <tbody><tr><td>Boundary stain</td><td>{run.processing.methodCounts.boundary.toLocaleString()}</td></tr><tr><td>Interior stain</td><td>{run.processing.methodCounts.interior.toLocaleString()}</td></tr><tr><td>Nuclear expansion</td><td>{run.processing.methodCounts.nuc_expansion.toLocaleString()}</td></tr></tbody>
        </table>
        <p className={styles.notice}>{selectedKey === geometryAudit.sourceObjectKey ? "The newly inspected cell table explicitly reports 5.0 µm for the nucleus-expansion rows; details are below." : "Nuclear expansion distance is not declared in the acquired run manifest or metrics; no cell table has been inspected for this selected run."} Cell and nucleus polygons describe segmentation approximations; they would not show observed membranes or 3D cell interiors.</p>
        <BilXeniumGeometrySchemaAudit sourceObjectKey={selectedKey} onSelectAcquiredRun={() => selectRun(geometryAudit.sourceObjectKey)} />
        <details className={styles.schemaAudit} data-testid="bil-xenium-published-workflow-inspection" data-current-source-key={selectedKey}>
          <summary>Published registration workflow · source mappings still needed</summary>
          <div className={styles.auditBody}>
          <p>Two pinned public software repositories were inspected on {workflowAudit.checkedDate}: 18 listed files and 17 acquired text files. This is an independent software inspection; neither repository supplies an exact mapping for the selected BIL run.</p>
          <p>The registration code selects the eighth underscore-separated field from each cell ID and adds suffixes to make duplicates unique. No original-to-renamed ID crosswalk is deposited in these pinned trees. Generated names cannot identify a BIL cell, section or donor.</p>
          <p>Registration requires a manually selected polygon, rotation and paired source/target anchors. The supplied CSV has 24 example target anchors with only x/y columns; it has no source-run anchors, section identity or physical calibration. The input/output entries are placeholder files, and the three processed Xenium RDS files named by the analysis are absent from these trees.</p>
          <p>The default type field RNA_snn_res.14 is an algorithm cluster column. The software&apos;s MIT notice does not resolve the BIL dataset&apos;s separate rights declarations or authorise reuse of the other repository.</p>
          <details><summary>Exact source inputs required</summary>
            <p>{workflowAudit.identity.requiredInput}</p><p>{workflowAudit.coordinate.requiredInput}</p>
            <ul className={styles.gates}>{workflowAudit.availability.namedProcessedInputs.map(name => <li key={name}>{name} · referenced input, absent from the pinned tree</li>)}</ul>
          </details>
          <div className={styles.links}>{workflowAudit.repositories.map(repo => <a key={repo.key} href={`https://github.com/${repo.repository}/tree/${repo.commit}`} target="_blank" rel="noreferrer">{repo.key === "registration" ? "Pinned registration source" : "Pinned analysis source"}</a>)}</div>
          <p className={styles.notice}>These findings cover the two pinned Git trees. They do not establish that the files are unavailable elsewhere. No source R code was executed; 0 cell geometry and 0 registration are admitted.</p>
          </div>
        </details>
        {lastExport && <details className={styles.schemaAudit} data-testid="bil-xenium-selected-export-preview"><summary>Inspect exported metadata for this run</summary><div className={styles.auditBody}><p>This is the JSON supplied to the export action. Automatic file download is not verified by this preview.</p><textarea aria-label="Selected metadata JSON" readOnly rows={12} value={lastExport} style={{ width: "100%", minWidth: 0 }} /></div></details>}
        <details><summary>Dataset specimen metadata and source keys</summary>
          <ul>{run.apiSpecimens.map((specimen, index) => <li key={`${specimen.samplelocalid}-${index}`}>{specimen.localid} · {specimen.sex} · {specimen.samplelocalid} · {specimen.linkage.map((link) => `${link.relationship}: ${link.xid}`).join("; ")}</li>)}</ul>
        </details>
        <div className={styles.controls}><label htmlFor={`${id}-outline`}>Find source outline names<input id={`${id}-outline`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Cervical" /></label></div>
        <div className={styles.labels}><strong>{labels.length} matching source labels · section frame unverified</strong>
          {labels.length ? <ul>{labels.map((label) => <li key={label}>{label}</li>)}</ul> : <p>{run.namedOutlineLabelCount ? "No matching source labels." : "No named outline export was listed for this run/slide."}</p>}
        </div>
        <p className={styles.notice}>This run’s BIL API and workbook declare {run.rights.apiIdentifier}; BIL’s site policy declares {run.rights.sitePolicyIdentifier}. Both declarations are retained. Geometry remains outside this metadata adapter.</p>
        <div className={styles.links}><a href={run.sourceUrl} target="_blank" rel="noreferrer">Exact source directory</a><a href={`https://api.brainimagelibrary.org/retrieve?bildid=${run.bildid}`} target="_blank" rel="noreferrer">BIL dataset metadata</a><a href={run.sourceFiles[0].url} target="_blank" rel="noreferrer">Run manifest</a><a href={run.sourceFiles[1].url} target="_blank" rel="noreferrer">Run metrics</a></div>
      </div> : <p role="status">Selected source object is unavailable; no previous run is displayed.</p>}
      <details><summary>Inputs still needed for a cell + nucleus pilot</summary>
        {selectedKey === geometryAudit.sourceObjectKey ? <ul className={styles.gates}>{geometryAudit.remainingGates.map((gate) => <li key={gate.id}><strong>{gate.id.replaceAll("_", " ")}</strong>: {gate.reason}</li>)}</ul> : <ul className={styles.gates}>{metadata.pilotGates.map((gate) => <li key={gate.id}><strong>{gate.id.replaceAll("_", " ")}</strong>: {gate.evidence} <em>Next input:</em> {gate.requiredInput}</li>)}</ul>}
      </details>
    </>}
  </section>;
}
