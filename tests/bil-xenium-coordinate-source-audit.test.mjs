import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBilXeniumCoordinateSourceAudit } from '../app/bil-xenium-coordinate-source-audit.js';
import { buildBilXeniumCurrentRunReceipt } from '../app/bil-xenium-geometry-schema-audit.js';
import { validateBilCoordinateSourceFiles } from '../scripts/validate-bil-xenium-coordinate-source-audit-0.1.mjs';
const json = async p => JSON.parse(await readFile(new URL(p, import.meta.url)));
const [audit, schema, metadata] = await Promise.all([json('../data/bil-xenium-coordinate-source-audit-0.1.json'), json('../data/bil-xenium-geometry-schema-audit-0.1.json'), json('../data/bil-xenium-source-metadata-0.1.json')]);
test('original coordinate source declarations and all original input bytes remain tied to the exact run', async () => {
  const result = await validateBilCoordinateSourceFiles(audit, schema);
  assert.equal(result.exactCellIdJoinCount, 182698); assert.equal(result.geometryObjects, 0); assert.equal(result.verifiedOriginalFileCount, 119);
});
test('a damaged retained source range rejects even when copied audit equality declarations are unchanged', async () => {
  const target = audit.sourceInputs.find(f => f.path.endsWith('.bin')).path;
  await assert.rejects(validateBilCoordinateSourceFiles(audit, schema, async p => {
    const bytes = Buffer.from(await readFile(new URL('../'+p, import.meta.url)));
    if (p === target) bytes[0] ^= 1;
    return bytes;
  }), /original coordinate input changed/);
});
test('acquired-run export retains both historical schema and current coordinate scope; other run exports clear current coordinates', () => {
  const current = buildBilXeniumCurrentRunReceipt(schema, metadata, audit.sourceObjectKey, audit);
  assert.deepEqual(current.sourceCoordinateAudit, audit); assert.deepEqual(current.sourceTableSchemaAudit, schema);
  assert.equal(current.checkedDate, '2026-10-01'); assert.equal(current.metadataSnapshotCheckedDate, metadata.checkedDate);
  assert.equal(current.pilotAdmission.admitted, false);
  const otherKey = metadata.runs.find(r => r.sourceObjectKey !== audit.sourceObjectKey).sourceObjectKey;
  const other = buildBilXeniumCurrentRunReceipt(schema, metadata, otherKey, audit);
  assert.equal(other.sourceCoordinateAudit, null); assert.equal(other.sourceTableSchemaAudit, null);
});
test('exact source, row equality, missingness and field locators cannot be substituted', () => {
  for (const alter of [
    a => { a.manifestIdentity.roi_uuid = 'other-roi'; },
    a => { a.sourceObjectKey = 'BIL:ace-pie-bin'; },
    a => { a.coordinateEvidence.fieldComparisons[0].differentRows = 1; },
    a => { a.coordinateEvidence.fieldComparisons.find(r => r.parquetColumn === 'nucleus_area').bothNaNRows = 0; },
    a => { a.coordinateEvidence.sourceDeclaredUnits = 'pixels'; },
    a => { a.coordinateEvidence.cellSummaryColumns[0] = 'registered_x'; },
  ]) { const changed = structuredClone(audit); alter(changed); assert.throws(() => validateBilXeniumCoordinateSourceAudit(changed, schema)); }
});
test('partial coordinate archive cannot authorize whole masks, polygons, section transforms or scientific geometry', () => {
  for (const alter of [
    a => { a.archiveIntegrityScope.wholeArchiveDownloaded = true; },
    a => { a.archiveIntegrityScope.wholeArchiveSha256 = 'a'.repeat(64); },
    a => { a.archiveIntegrityScope.unacquiredMaskOrPolygonArrayBytesClaimedVerified = true; },
    a => { a.coordinateEvidence.boundaryCoordinateEqualityToZarrNotChecked = false; },
    a => { a.coordinateEvidence.outlineToCellTransform = [1,0,0,1]; },
    a => { a.coordinateEvidence.sourceTransform.matrixRowMajor[0][0] = 1; },
    a => { a.admission.geometryViewerAdmission = true; },
    a => { a.admission.sectionLinkedCellNucleusGeometryCount = 1; },
    a => { a.rights.policyDifferenceResolved = true; },
  ]) { const changed = structuredClone(audit); alter(changed); assert.throws(() => validateBilXeniumCoordinateSourceAudit(changed, schema)); }
});
test('automated cluster labels and FOVs cannot become biological types or sections; 208 unassigned cells remain', () => {
  for (const alter of [
    a => { a.secondaryAnalysis.curatedCellTypeAssignments = 31; },
    a => { a.secondaryAnalysis.groupings[0].groupNames[0] = 'Interneuron'; },
    a => { a.secondaryAnalysis.groupings[0].isCuratedBiologicalType = true; },
    a => { a.secondaryAnalysis.groupings[0].unassignedCellIndexCount = 0; },
    a => { a.fovMetadata.doesNotEstablishSections = false; },
  ]) { const changed = structuredClone(audit); alter(changed); assert.throws(() => validateBilXeniumCoordinateSourceAudit(changed, schema)); }
});
