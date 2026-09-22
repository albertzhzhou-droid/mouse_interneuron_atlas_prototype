import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = (value, message) => { if (!value) throw new Error(message); };
const hash = value => createHash('sha256').update(value).digest('hex');
export async function validateResearchSourceExtensions243(registry) {
  const cano = registry.sources.find(source=>source.id==='SRC-CANOGOMEZ-2026');
  const native = registry.sources.find(source=>source.id==='SRC-NEUROMORPHO-8-6-124');
  const gp='data/cano-gomez-glut-active-ident-labels-0.1.json';
  const np='data/neurolucida-native-contour-admission-catalog-0.4.json';
  const [gb,nb] = await Promise.all([readFile(path.join(ROOT,gp)),readFile(path.join(ROOT,np))]);
  const labels=JSON.parse(gb), delta=JSON.parse(nb);
  const gs=cano.recordSets.find(record=>record.recordSetId==='RS-CANOGOMEZ-GLUT-ACTIVE-IDENT-LABELS');
  const ns=native.recordSets.find(record=>record.recordSetId==='RS-NEUROMORPHO-NATIVE-CONTOUR-DELTA-04');
  check(gs?.includedRecordCount.value===labels.labels.length && labels.labels.length===277,'GLUT source label count mismatch');
  check(gs?.recordKind==='source_slot_assignment_label_unresolved_neuron_class' && gs?.assignmentAuthority==='checksum_pinned_active_ident_names_exact_metadata_row_order','GLUT source slot or unresolved class changed');
  check(gs?.dataPath===gp && gs?.idField==='labels[].id' && gs?.childRosterRef.path===labels.artifact.path && gs?.childRosterRef.idField==='compound_nucleus_key','GLUT label/row routing mismatch');
  check(labels.denominators.confirmedInterneuronProfilesAdded===0 && labels.denominators.nucleusCount===92782,'GLUT assignment context was promoted to confirmed interneuron profiles');
  check(ns?.includedRecordCount.value===2 && ns?.unitOfObservation==='audited_DAT_file','Native delta count/unit changed');
  check(ns?.dataPath===np && ns?.idField==='addedRecords[].assetId' && ns?.sourceObjectSetRef.path===np && ns?.sourceObjectSetRef.idField==='addedRecords[].assetId','Native delta routing mismatch');
  check(JSON.stringify(delta.addedRecords.map(record=>record.neuronId).sort((a,b)=>a-b))==='[108978,249676]','Native delta object identity changed');
  const rosterBytes=await readFile(path.join(ROOT,labels.artifact.path));
  for(const [source,id,bytes] of [[cano,'ASSET-CANOGOMEZ-GLUT-ACTIVE-IDENT-SUMMARY',gb],[cano,'ASSET-CANOGOMEZ-GLUT-ACTIVE-IDENT-ROWS',rosterBytes],[native,'ASSET-NEUROMORPHO-NATIVE-CONTOUR-DELTA-04',nb]]) {
    const asset=source.assets.find(item=>item.id===id);
    check(asset?.bundled===true && asset?.integrity.status==='verified' && asset?.integrity.bytes===bytes.byteLength && asset?.integrity.sha256===hash(bytes),`2.43 source asset receipt mismatch: ${id}`);
  }
  return { sourceSlotLabels:277, sourceSlotNuclei:92782, confirmedInterneuronProfilesAdded:0, deltaNativeRecords:2 };
}
