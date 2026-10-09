import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildBilXeniumAuditedCellHierarchy, buildBilXeniumCurrentRunReceipt, validateBilXeniumGeometrySchemaAudit } from "../app/bil-xenium-geometry-schema-audit.js";
import { validateBilXeniumGeometrySchemaAuditSources } from "../scripts/validate-bil-xenium-geometry-schema-audit-0.1.mjs";
import { validateSourceIdentityHierarchy } from "../app/source-object-identity.js";
const audit = JSON.parse(await readFile(new URL("../data/bil-xenium-geometry-schema-audit-0.1.json", import.meta.url), "utf8"));
const metadata = JSON.parse(await readFile(new URL("../data/bil-xenium-source-metadata-0.1.json", import.meta.url), "utf8"));

test("the three actual bounded BIL source files and all dependencies match current byte receipts", async () => {
  assert.deepEqual(await validateBilXeniumGeometrySchemaAuditSources(), { sourceObjectKey: "BIL:ace-pie-cot", rawCellRows: 182698, sourceBytes: 37282469, cellBoundaryVertexRows: 4564211, nucleusBoundaryVertexRows: 4468434, geometryObjects: 0, sourceFiles: 3, dependencyFiles: 5, geometryViewerAdmission: false });
});

test("zero and multiple source nuclei remain distinct from absent/orphan IDs and duplicate cells", () => {
  validateBilXeniumGeometrySchemaAudit(audit, metadata);
  assert.deepEqual(audit.tables.cells.nucleusCountDistribution, { 0: 2262, 1: 180374, 2: 58, 3: 4 });
  assert.equal(audit.tables.nucleusBoundaries.uniqueCellIdCount, 180436);
  assert.equal(audit.tables.nucleusBoundaries.polygonGroupCount, 180502);
  assert.equal(audit.idJoins.nucleusCountVersusPolygonGroupMismatchCellCount, 0);
  assert.equal(audit.idJoins.orphanNucleusBoundaryIds, 0);
  const changed = structuredClone(audit);
  changed.tables.cells.nucleusCountDistribution["2"] = 0;
  assert.throws(() => validateBilXeniumGeometrySchemaAudit(changed, metadata), /nucleus count denominator/);
});

test("equal numeric label IDs cannot become a cross-file cell/nucleus join", () => {
  assert.equal(audit.idJoins.crossFileLabelIdDifferentCellCount, 180502);
  const changed = structuredClone(audit);
  changed.idJoins.labelIdCanJoinCellAndNucleusFiles = true;
  assert.throws(() => validateBilXeniumGeometrySchemaAudit(changed, metadata), /unsafe join/);
});

test("source-reported 5 µm is limited to the exact run's native expansion method rows", () => {
  const current = buildBilXeniumCurrentRunReceipt(audit, metadata, audit.sourceObjectKey);
  assert.equal(current.sourceTableSchemaAudit.methodCrosscheck.nuclearExpansionDistanceUm, 5);
  assert.equal(current.sourceTableSchemaAudit.methodCrosscheck.tableCounts.nuc_expansion, 10316);
  assert.equal(current.metadataSnapshotPilotAdmission.methodEvidence.status, "run_level_verified_parameters_partial");
  const another = buildBilXeniumCurrentRunReceipt(audit, metadata, "BIL:ace-pie-bin");
  assert.equal(another.sourceTableSchemaAudit, null);
  assert.equal(another.processing.nuclearExpansionDistanceUm, null);
  const changed = structuredClone(audit);
  changed.methodCrosscheck.distanceScope = "all_cells_all_runs";
  assert.throws(() => validateBilXeniumGeometrySchemaAudit(changed, metadata), /parameter scope/);
});

test("run switches and missing keys cannot retain the acquired run's table or identity", () => {
  assert.ok(buildBilXeniumCurrentRunReceipt(audit, metadata, audit.sourceObjectKey).sourceTableSchemaAudit);
  assert.equal(buildBilXeniumCurrentRunReceipt(audit, metadata, "BIL:ace-pie-bin").sourceTableSchemaAudit, null);
  assert.equal(buildBilXeniumCurrentRunReceipt(audit, metadata, "BIL:missing"), null);
  assert.equal(buildBilXeniumAuditedCellHierarchy(audit, metadata, "unverified-id"), null);
});

test("an audited source cell row retains exact source scope while section and donor stay unknown", () => {
  const hierarchy = buildBilXeniumAuditedCellHierarchy(audit, metadata, "aaaalblj-1");
  validateSourceIdentityHierarchy(hierarchy);
  assert.equal(hierarchy.nodes.cell.id, "aaaalblj-1");
  assert.equal(hierarchy.nodes.specimen.id, null);
  assert.equal(hierarchy.nodes.section.id, null);
  assert.equal(hierarchy.parents.cell.status, "not_established");
  assert.equal(hierarchy.geometryTransferAllowed, false);
  assert.match(hierarchy.objectLocator, /row-index-zero-based=0&column=cell_id;sha256=[a-f0-9]{64}$/);
  assert.ok(hierarchy.namespace.includes(audit.manifestIdentity.roi_uuid));
});

test("source NaN keeps a field locator and cannot silently become numerical zero", () => {
  const field = audit.tables.cells.sampleRows[0].fields.nucleus_area;
  assert.equal(field.state, "source_nonfinite");
  assert.equal(field.value, null);
  assert.deepEqual(field.locator, { file: "cells.parquet", rowIndexZeroBased: 0, column: "nucleus_area" });
  const changed = structuredClone(audit);
  changed.tables.cells.sampleRows[0].fields.nucleus_area.value = 0;
  assert.throws(() => validateBilXeniumGeometrySchemaAudit(changed, metadata), /missingness/);
});

test("schema success cannot grant section/specimen identities, physical frames, rights or geometry", () => {
  for (const mutate of [
    (value) => { value.manifestIdentity.roi_uuid = "invented"; },
    (value) => { value.coordinateEvidence.sectionCoordinateFrame = { unit: "um" }; },
    (value) => { value.coordinateEvidence.atlasRegistration = "identity"; },
    (value) => { value.remainingGates[0].status = "verified"; },
    (value) => { value.admission.geometryViewerAdmission = true; },
    (value) => { value.admission.interneuronObjects = 182698; },
  ]) {
    const changed = structuredClone(audit); mutate(changed);
    assert.throws(() => validateBilXeniumGeometrySchemaAudit(changed, metadata));
  }
});

test("changed source hashes are rejected against the acquired original files", async () => {
  const changed = structuredClone(audit);
  changed.sourceFiles[1].sha256 = "f".repeat(64);
  await assert.rejects(validateBilXeniumGeometrySchemaAuditSources(changed), /source bytes changed/);
});
