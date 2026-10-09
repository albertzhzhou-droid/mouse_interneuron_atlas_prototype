import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBilXeniumPolygonSourceAudit } from '../app/bil-xenium-polygon-source-audit.js';
import { validateBilPolygonSourceFiles } from '../scripts/validate-bil-xenium-polygon-source-audit-0.1.mjs';
import { buildBilXeniumCurrentRunReceipt } from '../app/bil-xenium-geometry-schema-audit.js';
const json = async p => JSON.parse(await readFile(new URL('../data/'+p,import.meta.url)));
const [audit,coordinates,schema,metadata,workflow] = await Promise.all(['bil-xenium-polygon-source-audit-0.1.json','bil-xenium-coordinate-source-audit-0.1.json','bil-xenium-geometry-schema-audit-0.1.json','bil-xenium-source-metadata-0.1.json','bil-xenium-published-workflow-audit-0.1.json'].map(json));
const validate = a => validateBilXeniumPolygonSourceAudit(a,coordinates,schema);
test('all original polygon intervals, entries and prior dependencies still match their sealed bytes',async () => {
  const result=await validateBilPolygonSourceFiles(audit,coordinates,schema);
  assert.equal(result.verifiedOriginalFileCount,449);assert.equal(result.activeVertexRows,9032645);
  assert.equal(result.nucleusPolygons,180502);assert.equal(result.boundaryPhysicalUnits,'um');assert.equal(result.geometryObjects,0);
});
test('a same-length damaged original interval rejects despite unchanged copied equality claims',async () => {
  const target=audit.sourceInputs.find(r => r.path.includes('/range-') && r.bytes>100000).path;
  await assert.rejects(validateBilPolygonSourceFiles(audit,coordinates,schema,async p => {
    const b=Buffer.from(await readFile(new URL('../'+p,import.meta.url)));if(p===target)b[64]^=1;return b;
  }),/original polygon input changed/);
});
test('an altered extracted Blosc chunk rejects independently of original interval declarations',async () => {
  const target=audit.sourceInputs.find(r => r.path.endsWith('polygon_sets__0__vertices__0.0')).path;
  await assert.rejects(validateBilPolygonSourceFiles(audit,coordinates,schema,async p => {
    const b=Buffer.from(await readFile(new URL('../'+p,import.meta.url)));if(p===target)b[b.length-1]^=1;return b;
  }),/original polygon input changed/);
});
test('current-run export retains the separate polygon audit and its current date; all other runs clear it', () => {
  const receipt=buildBilXeniumCurrentRunReceipt(schema,metadata,audit.sourceObjectKey,coordinates,workflow,audit);
  assert.deepEqual(receipt.sourcePolygonAudit,audit);assert.deepEqual(receipt.sourceCoordinateAudit,coordinates);
  assert.equal(receipt.checkedDate,'2026-10-02');assert.equal(receipt.pilotAdmission.admitted,false);
  for(const run of metadata.runs.filter(r=>r.sourceObjectKey!==audit.sourceObjectKey)) {
    const other=buildBilXeniumCurrentRunReceipt(schema,metadata,run.sourceObjectKey,coordinates,workflow,audit);
    assert.equal(other.sourcePolygonAudit,null);assert.equal(other.sourceCoordinateAudit,null);assert.equal(other.sourceTableSchemaAudit,null);
  }
  const historical=buildBilXeniumCurrentRunReceipt(schema,metadata,audit.sourceObjectKey,coordinates,workflow);
  assert.equal(historical.sourcePolygonAudit,null);assert.equal(historical.checkedDate,'2026-10-01');
});
test('different exact source, parent joins, coordinate equality and padded vertices cannot be promoted', () => {
  for(const change of [
    a=>{a.sourceObjectKey='BIL:ace-pie-bin';},
    a=>{a.manifestIdentity.roi_uuid='different-roi';},
    a=>{a.coordinateEvidence.polygonSets[0].differentParentCellIdRows=1;},
    a=>{a.coordinateEvidence.polygonSets[0].coordinateComparisons[1].differentRows=1;},
    a=>{a.coordinateEvidence.polygonSets[1].activeVertexRows+=a.coordinateEvidence.polygonSets[1].paddedSlots;},
    a=>{a.coordinateEvidence.polygonSets[0].perFileLabelJoinRule='join all files using label_id';},
    a=>{a.coordinateEvidence.polygonSets[1].coordinateComparisons[0].comparison='float32 rounded with tolerance';},
    a=>{a.coordinateEvidence.polygonSets[0].arrayLayouts.vertices.shape[1]=48;}
  ]) {const copy=structuredClone(audit);change(copy);assert.throws(()=>validate(copy),/polygon source audit/);}
});
test('nuclear methods, zero-nucleus and multiple-nucleus source records retain their own semantics', () => {
  for(const change of [
    a=>{a.parentEvidence.cellsWithoutNucleusPolygon=0;},
    a=>{a.parentEvidence.cellsWithMultipleNucleusPolygons=0;},
    a=>{a.parentEvidence.nucleusCountDistribution['3']=0;},
    a=>{a.coordinateEvidence.polygonSets[0].methodCounts={'Segmented by interior stain (18S)':180502};},
    a=>{a.parentEvidence.differentCellSegmentationMethodCells=1;},
    a=>{a.parentEvidence.crossFileLabelIdsMustNotBeJoinKeys=false;}
  ]) {const copy=structuredClone(audit);change(copy);assert.throws(()=>validate(copy),/polygon source audit/);}
});
test('exact equality cannot clear section, rights, observed membrane, whole-mask or runtime authority gates', () => {
  for(const change of [
    a=>{a.coordinateEvidence.sectionCoordinateFrame={unit:'um'};},
    a=>{a.coordinateEvidence.observedMembraneOrThreeDimensionalAnatomyEstablished=true;},
    a=>{a.rights.policyDifferenceResolved=true;},
    a=>{a.remainingGates=[];},
    a=>{a.admission.geometryViewerAdmission=true;},
    a=>{a.admission.sectionLinkedCellNucleusGeometryCount=1;},
    a=>{a.archiveIntegrityScope.wholeArchiveSha256='a'.repeat(64);},
    a=>{a.archiveIntegrityScope.unacquiredMaskArrayBytesClaimedVerified=true;},
    a=>{a.archiveIntegrityScope.renderedGeometryBytesClaimedVerified=true;}
  ]) {const copy=structuredClone(audit);change(copy);assert.throws(()=>validate(copy),/polygon source audit/);}
});
