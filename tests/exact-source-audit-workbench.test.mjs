import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { filterPublicationDiscoveryRecords, filterSourceAuditSamples, makeSourceAuditExport, reconcileSourceAuditSelection, sourceAuditCsv, sourceAuditNucleusGate } from '../app/exact-source-audit-workbench.js';

const trevisan = JSON.parse(readFileSync(new URL('../data/trevisan-v1-exact-input-crosswalk-audit-0.1.json',import.meta.url)));
const publication = JSON.parse(readFileSync(new URL('../data/neuromorpho-publication-discovery-audit-0.1.json',import.meta.url)));

test('sample filters preserve source exceptions and the empty final Atlas prefix',()=>{
  assert.equal(filterSourceAuditSamples(trevisan.samples,'','atlas').length,24);
  assert.equal(filterSourceAuditSamples(trevisan.samples,'Whole cord','en1').length,4);
  assert.equal(filterSourceAuditSamples(trevisan.samples,'E13.5','embryonic')[0].geoSampleAccession,'GSM8480605');
  const p56lr1=filterSourceAuditSamples(trevisan.samples,'P56LR1','atlas');
  assert.equal(p56lr1.length,1);
  assert.equal(p56lr1[0].workbookRowCount,0);
  assert.equal(p56lr1[0].nativeBarcodeCount,8000);
  assert.deepEqual(filterSourceAuditSamples(trevisan.samples,'not a real sample'),[]);
});

test('filtering out a real selected sample clears identity without choosing or restoring another sample',()=>{
  const all=filterSourceAuditSamples(trevisan.samples,'','all');
  assert.equal(reconcileSourceAuditSelection(all,'GSM8480577'),'GSM8480577');
  const embryo=filterSourceAuditSamples(trevisan.samples,'','embryonic');
  const cleared=reconcileSourceAuditSelection(embryo,'GSM8480577');
  assert.equal(cleared,null);
  assert.equal(reconcileSourceAuditSelection(all,cleared),null);
  assert.equal(reconcileSourceAuditSelection(all,'unknown-gsm'),null);
});

test('real barcode mismatch and complete E13.5 barcode matching both fail the remaining scientific gates',()=>{
  const p0=trevisan.samples.find(row=>row.sampleTitle==='P0CR1');
  const held=sourceAuditNucleusGate({...p0,finalNucleusRosterAdmission:'admitted'},trevisan.rights);
  assert.equal(held.admitted,false);
  assert.ok(held.reasons.some(reason=>reason.includes('crosswalk is incomplete')));
  const embryo=trevisan.samples.find(row=>row.sampleTitle==='E135HetR1');
  assert.equal(embryo.barcodeMatchedRowCount,6676);
  const matched=sourceAuditNucleusGate(embryo,trevisan.rights);
  assert.equal(matched.admitted,false);
  assert.ok(!matched.reasons.some(reason=>reason.includes('crosswalk is incomplete')));
  assert.ok(matched.reasons.some(reason=>reason.includes('cluster assignment')));
  assert.ok(matched.reasons.some(reason=>reason.includes('reuse')));
});

test('bounded discovery never converts the resolved candidate citation into record metadata',()=>{
  const rows=filterPublicationDiscoveryRecords(publication.records,'322379','unassessable');
  assert.equal(rows.length,1);
  assert.deepEqual(rows[0].referencePmidRaw,['2017']);
  assert.equal(filterPublicationDiscoveryRecords(publication.records,'42454582').length,0);
  assert.equal(filterPublicationDiscoveryRecords(publication.records,'','matched').length,0);
  assert.equal(filterPublicationDiscoveryRecords(publication.records,'','unmatched').length,1097);
});

test('exports carry the actual filtered source units and fail on identity collision',()=>{
  const rows=filterSourceAuditSamples(trevisan.samples,'E13.5','embryonic');
  const payload=makeSourceAuditExport({kind:'sample_characteristics',audit:trevisan,records:rows,filter:{query:'E13.5',cohort:'embryonic'},generatedAt:'test'});
  assert.equal(payload.rowCount,1);
  assert.equal(payload.records[0].sourceKey,'trevisan-v1:GSE275595:GSM8480605:source-sample');
  assert.equal(payload.records[0].age.sourceText,'E13.5');
  assert.equal(payload.runtimeRosterAdmission,false);
  assert.equal(payload.sourcePayloadsIncluded,false);
  assert.equal(payload.geometryObjects,0);
  assert.throws(()=>makeSourceAuditExport({kind:'sample_characteristics',audit:trevisan,records:[rows[0],rows[0]],filter:{},generatedAt:'test'}),/Duplicate source identity/);
  const csv=sourceAuditCsv('sample_characteristics',rows);
  assert.equal(csv.split('\r\n').filter(Boolean).length,2);
  assert.match(csv,/GSM8480605,E135HetR1,E13.5,Whole cord/);
  assert.match(csv,/held_cluster_and_reuse_gate/);
  assert.throws(()=>makeSourceAuditExport({kind:'pretend_cell',audit:trevisan,records:[],filter:{},generatedAt:'test'}),/Unknown audit/);
});
