import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {validateResearchSourceExtensions243} from '../scripts/validate-research-source-extensions-2.43.mjs';
const registry=JSON.parse(await readFile(new URL('../data/research-source-registry-0.1.json',import.meta.url)));
test('source cards resolve exact new source-slot rows and disjoint native-object delta',async()=>{
  assert.deepEqual(await validateResearchSourceExtensions243(registry),{sourceSlotLabels:277,sourceSlotNuclei:92782,confirmedInterneuronProfilesAdded:0,deltaNativeRecords:2});
});
test('source cards reject label promotion, wrong row routing, and altered delta hashes',async()=>{
  for(const mutate of [
    r=>{r.sources.find(s=>s.id==='SRC-CANOGOMEZ-2026').recordSets.find(s=>s.recordSetId==='RS-CANOGOMEZ-GLUT-ACTIVE-IDENT-LABELS').recordKind='confirmed_interneuron';},
    r=>{r.sources.find(s=>s.id==='SRC-CANOGOMEZ-2026').recordSets.find(s=>s.recordSetId==='RS-CANOGOMEZ-GLUT-ACTIVE-IDENT-LABELS').childRosterRef.idField='invented_global_cell_id';},
    r=>{r.sources.find(s=>s.id==='SRC-NEUROMORPHO-8-6-124').assets.find(a=>a.id==='ASSET-NEUROMORPHO-NATIVE-CONTOUR-DELTA-04').integrity.sha256='0'.repeat(64);},
  ]) {const changed=structuredClone(registry);mutate(changed);await assert.rejects(validateResearchSourceExtensions243(changed),/changed|mismatch/);}
});
