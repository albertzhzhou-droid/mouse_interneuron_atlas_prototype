"use client";

import { useId, useMemo, useState } from "react";
import coordinateAudit from "../data/bil-xenium-coordinate-source-audit-0.1.json";
import polygonAudit from "../data/bil-xenium-polygon-source-audit-0.1.json";
import imageMetadataAudit from "../data/bil-xenium-image-metadata-audit-0.1.json";
import { validateBilXeniumImageMetadataAudit } from "./bil-xenium-image-metadata-audit.js";
import { validateBilXeniumPolygonSourceAudit } from "./bil-xenium-polygon-source-audit.js";
import { validateBilXeniumCoordinateSourceAudit } from "./bil-xenium-coordinate-source-audit.js";
import audit from "../data/bil-xenium-geometry-schema-audit-0.1.json";
import metadata from "../data/bil-xenium-source-metadata-0.1.json";
import { buildBilXeniumAuditedCellHierarchy, validateBilXeniumGeometrySchemaAudit } from "./bil-xenium-geometry-schema-audit.js";
import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
import styles from "./bil-xenium-metadata-explorer.module.css";

export default function BilXeniumGeometrySchemaAudit({ sourceObjectKey, onSelectAcquiredRun }: { sourceObjectKey: string; onSelectAcquiredRun: () => void }) {
  const id = useId();
  const [sampleId, setSampleId] = useState(audit.tables.cells.sampleRows[0].cellId);
  const validation = useMemo(() => {
    try { validateBilXeniumGeometrySchemaAudit(audit, metadata); validateBilXeniumCoordinateSourceAudit(coordinateAudit, audit); validateBilXeniumPolygonSourceAudit(polygonAudit, coordinateAudit, audit); validateBilXeniumImageMetadataAudit(imageMetadataAudit, coordinateAudit, audit); return null; }
    catch (error) { return error instanceof Error ? error.message : "Source-table audit validation failed"; }
  }, []);
  if (validation) return <p role="alert">{validation}</p>;
  const acquired = sourceObjectKey === audit.sourceObjectKey;
  const cells = audit.tables.cells, boundaries = audit.tables.cellBoundaries, nuclei = audit.tables.nucleusBoundaries;
  const sample = acquired ? cells.sampleRows.find((row) => row.cellId === sampleId) : null;
  const hierarchy = sample ? buildBilXeniumAuditedCellHierarchy(audit, metadata, sample.cellId) : null;

  return <details className={styles.schemaAudit} data-testid="bil-xenium-geometry-schema-audit" data-current-source-key={sourceObjectKey}>
    <summary>Source table audit · {acquired ? "cell and nucleus IDs inspected" : "one other run inspected"}</summary>
    {!acquired ? <div className={styles.auditBody}>
      <p>No original cell or boundary table has been inspected for the selected run. A bounded three-table audit is available for {audit.directoryFolder}.</p>
      <button type="button" className={styles.auditButton} onClick={onSelectAcquiredRun}>Open the inspected run</button>
    </div> : <div className={styles.auditBody} data-testid="bil-xenium-current-schema-audit">
      <p>{cells.rowCount.toLocaleString()} source segmentation rows and three original Parquet tables ({(audit.totalSourceBytes / 1_000_000).toFixed(2)} MB) were inspected. This is one processing ROI; its cells have no verified section, donor or curated type assignment in these inputs.</p>
      <dl className={styles.facts}>
        <div><dt>Cell table IDs / duplicate IDs</dt><dd>{cells.uniqueCellIdCount.toLocaleString()} / {cells.duplicateCellIdCount}</dd></div>
        <div><dt>Cell boundary IDs / vertex rows</dt><dd>{boundaries.uniqueCellIdCount.toLocaleString()} / {boundaries.rowCount.toLocaleString()}</dd></div>
        <div><dt>IDs with nucleus boundaries / nucleus polygons</dt><dd>{nuclei.uniqueCellIdCount.toLocaleString()} / {nuclei.polygonGroupCount.toLocaleString()}</dd></div>
        <div><dt>No detected nucleus / multiple detected nuclei</dt><dd>{cells.nucleusCountDistribution["0"].toLocaleString()} / {nuclei.cellsWithMultiplePolygonGroups}</dd></div>
      </dl>
      <p className={styles.notice}>Join the three files by exact cell_id within this analysis and ROI. {audit.idJoins.crossFileLabelIdDifferentCellCount.toLocaleString()} shared numeric label IDs point to different cells across the two boundary files. Polygon vertices are repeated observations, and multiple nucleus polygons can belong to one cell.</p>
      <p>All cell IDs have a cell boundary; no boundary ID is orphaned. The {audit.idJoins.cellTableIdsWithoutNucleusBoundary.toLocaleString()} IDs without a nucleus boundary match source nucleus_count = 0. Per-cell nucleus counts agree with the number of nucleus polygons, including all 62 multi-nucleus records.</p>
      <p className={styles.notice}>The {audit.methodCrosscheck.tableCounts.nuc_expansion.toLocaleString()} rows with the native label “{audit.methodCrosscheck.distanceEvidence.nativeValue}” explicitly report 5.0 µm. This applies to those rows in this run. The other two methods use source stain segmentation.</p>
      <details data-testid="bil-xenium-current-coordinate-evidence"><summary>Original coordinate evidence · 182,698 exact cell IDs</summary>
        <p>The original cells.zarr.zip metadata for this run declares “microns”. Every cell ID joins the original cells.parquet, and all X/Y centroids, cell areas, nucleus areas and nucleus counts are exactly equal. The 2,262 missing nucleus areas remain source NaN.</p>
        <dl className={styles.facts}><div><dt>Cell centroid coordinates</dt><dd>µm · original archive declaration</dd></div><div><dt>Exact ID joins / different centroid values</dt><dd>182,698 / 0</dd></div><div><dt>Archive entry version</dt><dd>6.2 · XOA 3.3.0.1 run</dd></div><div><dt>Coordinate evidence scope</dt><dd>Cell centroids · no section or atlas transform</dd></div></dl>
        <p>The stored physical-to-image matrix has X/Y scale 4.7058820724487305, with the run’s pixel_size 0.2125. The matrix is retained at its original float32 precision; it does not map named outlines to cells or establish anatomical orientation. The Parquet files themselves contain no unit metadata. This 2026-10-01 centroid audit did not inspect polygon arrays; the separate 2026-10-02 polygon comparison follows below.</p>
        <p>The historical centroid audit replayed its selected entries from exact byte ranges with ZIP CRC checks. The complete archive and its unacquired masks remain unverified.</p>
        <p>Ten automatic clusterings assign 182,490 cells and leave 208 unassigned. Their “Cluster” names are algorithm groups, with no curated interneuron labels. The 609 fields of view in each source location file do not establish sections.</p>
        <p className={styles.notice}>Section, per-section donor, curated types and the separate rights declarations remain unresolved. This coordinate evidence adds 0 viewer geometry, 0 3D cells, 0 identity joins and 0 REG.</p>
      </details>
      <details data-testid="bil-xenium-current-polygon-evidence" data-current-source-key={sourceObjectKey}>
        <summary>Original polygon comparison · 9,032,645 exact vertex rows</summary>
        <p>Both original polygon sets were replayed from 163 ZIP entries. Every native X/Y vertex and full-string parent cell ID agrees exactly with the corresponding Parquet row: 182,698 cell polygons and 180,502 nucleus polygons. No rounding, tolerance, coordinate transform or polygon reordering was used.</p>
        <dl className={styles.facts}>
          <div><dt>Boundary coordinates</dt><dd>µm · original archive declaration and exact equality</dd></div>
          <div><dt>Cell / nucleus vertex rows</dt><dd>4,564,211 / 4,468,434</dd></div>
          <div><dt>Different X/Y / parent rows</dt><dd>0 / 0</dd></div>
          <div><dt>Nucleus polygons / cells with nucleus polygons</dt><dd>180,502 / 180,436</dd></div>
        </dl>
        <p>All 182,698 source nucleus counts and cell segmentation methods agree. The 2,262 cells with no nucleus polygon and the 62 with multiple nuclei remain distinct. Nuclear polygons retain their DAPI method; they do not inherit their parent cell’s boundary, interior or 5.0 µm expansion method. The {polygonAudit.coordinateEvidence.polygonSets.reduce((n, set) => n + set.paddedSlots, 0).toLocaleString()} padded vertex slots are excluded from the comparison.</p>
        <p className={styles.notice}>Use polygon cell_index → the original cell_id array → exact cell_id. Each boundary file’s numeric label_id matches its own polygon row plus one; 180,502 shared labels point to different parent cells across the two files. Numeric labels must not join cell and nucleus boundaries.</p>
        <p>Only the selected polygon intervals ({(polygonAudit.archiveIntegrityScope.selectedLocalIntervalBytes / 1_000_000).toFixed(2)} MB) and earlier coordinate entries were replayed, with retained SHA-256 and ZIP CRC checks. No complete archive checksum, unread segmentation mask or rendered geometry verification is claimed.</p>
        <p>These polygons simplify segmentation masks for visualization. They do not establish an observed membrane or 3D anatomy. <a href={polygonAudit.formatDocumentation.reviewedUrl} target="_blank" rel="noreferrer">10x polygon format description</a></p>
        <p className={styles.notice}>Section identity, donor, curated type, outline-to-cell frame and rights declarations remain unresolved. This original polygon audit adds 0 viewer geometry, 0 interneuron labels, 0 same-cell morphology and 0 atlas registration.</p>
      </details>
      <details data-testid="bil-xenium-current-image-metadata" data-current-source-key={sourceObjectKey}>
        <summary>Original image metadata · DAPI calibration</summary>
        <p>The exact run manifest points to this original morphology.ome.tif. Five HTTP206 metadata intervals ({imageMetadataAudit.integrityScope.rangeTransferBytes.toLocaleString()} bytes) replay its first BigTIFF directory and OME XML; image pixels were not read.</p>
        <dl className={styles.facts}>
          <div><dt>Native image dimensions</dt><dd>54,030 × 112,160 pixels · uint16 DAPI</dd></div>
          <div><dt>XY calibration</dt><dd>0.2125 µm/pixel · OME and run manifest agree</dd></div>
          <div><dt>Declared optical planes</dt><dd>16 · 3.0 µm Z step · XYZCT order</dd></div>
          <div><dt>Source cell centroids in image bounds</dt><dd>182,698 / 182,698 · continuous pixel coordinates</dd></div>
          <div><dt>Named outline areas reproduced</dt><dd>29 / 29 · original µm² header precision</dd></div>
        </dl>
        <p>The source float32 matrix is used unchanged, with no pixel rounding or clamping. Its maximum difference from division by the exact XY calibration is {imageMetadataAudit.cellImageBounds.maxAbsStoredMatrixVsExactCalibrationPixels[0].toFixed(6)} pixels in X and {imageMetadataAudit.cellImageBounds.maxAbsStoredMatrixVsExactCalibrationPixels[1].toFixed(6)} in Y. All centroids fit the image domain; this does not verify segmentation against image pixels.</p>
        <p>Each named outline’s shoelace area reproduces its own source header at one decimal. This supports dimensional consistency; it does not prove a shared origin, rotation, cell-to-section mapping or donor assignment. Sixteen declared optical planes do not establish biological section thickness, and the remaining TIFF directories and pyramid pixels were not inspected.</p>
        <p><a href={imageMetadataAudit.sourceUrl} target="_blank" rel="noreferrer">Exact original morphology file</a> · <a href={imageMetadataAudit.formatDocumentation.reviewedUrl} target="_blank" rel="noreferrer">OME metadata format</a></p>
        <p className={styles.notice}>Source metadata only. Section identity, donor, curated type, outline frame and applicable rights remain unresolved; no image, cell geometry, 3D anatomy or atlas registration is admitted.</p>
      </details>
      <div className={styles.controls}>
        <label htmlFor={`${id}-row`}>Inspect a pinned source row
          <select id={`${id}-row`} value={sampleId} onChange={(event) => setSampleId(event.target.value)}>
            {cells.sampleRows.map((row) => <option key={row.cellId} value={row.cellId}>{row.cellId} · row {row.rowIndexZeroBased} · nucleus count {row.fields.nucleus_count.value}</option>)}
          </select>
        </label>
      </div>
      {sample ? <div key={sample.cellId} data-testid="bil-xenium-audited-source-row" data-cell-id={sample.cellId}>
        <p><strong>{sample.cellId}</strong> · cells.parquet · zero-based row {sample.rowIndexZeroBased}. Four pinned examples illustrate source fields; this is not the full cell roster.</p>
        <table className={styles.table} aria-label="Pinned Xenium source row fields"><thead><tr><th>Source column</th><th>Source value</th></tr></thead>
          <tbody>{Object.entries(sample.fields).map(([name, field]) => <tr key={name}><th scope="row">{name}</th><td>{field.state === "source_value" ? String(field.value) : field.state === "source_nonfinite" ? "Source NaN · missing numeric value" : "Source null"}<small className={styles.fieldLocator}>cells.parquet · row {field.locator.rowIndexZeroBased} · {field.locator.column}</small></td></tr>)}</tbody>
        </table>
        {hierarchy && <SourceIdentityHierarchyPanel hierarchy={hierarchy} />}
      </div> : <p role="status">Pinned row unavailable; no preceding row is retained.</p>}
      <details><summary>Original file receipts and remaining pilot inputs</summary>
        <ul className={styles.gates}>{audit.sourceFiles.map((file) => <li key={file.path}><a href={file.url} target="_blank" rel="noreferrer">{file.path.split("/").at(-1)}</a> · {file.bytes.toLocaleString()} bytes<br /><code>{file.sha256}</code></li>)}</ul>
        <ul className={styles.gates}>{audit.remainingGates.map((gate) => <li key={gate.id}><strong>{gate.id.replaceAll("_", " ")}</strong>: {gate.reason}</li>)}</ul>
      </details>
      <p className={styles.notice}>Local source inspection only · 0 viewer geometry. Simplified segmentation polygons do not establish observed membranes, 3D cells, interneuron classification or same-cell morphology. Dataset CC-BY-4.0 and site CC-BY-SA-4.0 declarations remain separate.</p>
    </div>}
  </details>;
}
