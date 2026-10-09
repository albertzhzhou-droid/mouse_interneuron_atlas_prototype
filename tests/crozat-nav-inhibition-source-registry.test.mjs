import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { crozatNaVInformation } from '../app/crozat-nav-inhibition-information.js';
import { validateCrozatNaVSourceRegistryRelationship, validateCrozatLocalWorkbookPackage, loadCrozatLocalWorkbookPackage, validatePersistedCrozatNaVSourceRegistryRelationship } from '../scripts/validate-crozat-nav-inhibition-source-registry-0.1.mjs';
import { summarizeResearchSourceRegistry } from '../scripts/validate-research-source-registry-0.1.mjs';
const root = new URL('../', import.meta.url);
const registry = JSON.parse(await readFile(new URL('data/research-source-registry-0.1.json', root), 'utf8'));
const source = value => value.sources.find(row => row.id === 'SRC-CROZAT-2025');
const files = await loadCrozatLocalWorkbookPackage(registry);

test('25 selected information workbooks remain distinct from26 retained originals and one source profile', () => {
  const result = validateCrozatNaVSourceRegistryRelationship(registry);
  assert.equal(result.selectedInformationWorkbookFiles, 25); assert.equal(result.retainedOriginalWorkbookFiles, 26);
  assert.equal(result.retainedUnselectedWorkbookFiles, 1); assert.equal(result.independentPhysicalCellCount, null);
  const units = source(registry).experimentalUnits;
  assert.deepEqual(units.map(row => row.count), [1,65,654]);
  assert.deepEqual(source(registry).localWorkbookReadiness.retainedButUnselectedWorkbookPins.map(row => [row.fileId,row.fileName]), [[56062547,'INa.xlsx']]);
});
test('file/table/row scopes cannot be pooled or relabeled as cells or animals', () => {
  const mutations = [r => r.selectedInformationWorkbookFiles=26, r => r.allRetainedOriginalWorkbookFiles=25, r => r.unit='physical_cells', r => r.individualPhysicalCellDenominator=84, r => r.individualAnimalMappingEstablished=true, r => r.additionalNaVInhibitionWorksheetMeasurementRows=28, r => r.existingExperimentFamilySourceObservationRows=2199, r => r.crossWorkbookNaVRowPairing=28, r => r.retainedButUnselectedWorkbookPins[0].fileName='CAV.xlsx'];
  for (const mutate of mutations) { const changed=structuredClone(registry); mutate(source(changed).localWorkbookReadiness); assert.throws(() => validateCrozatNaVSourceRegistryRelationship(changed)); }
});
test('information readiness cannot create record sets, exact cell rosters, geometry or registrations', () => {
  for (const mutate of [s=>s.recordSets.push(structuredClone(s.recordSets[0])),s=>s.recordSets[0].includedRecordCount.value=85,s=>s.recordSets[0].childRosterRef.status='bundled_exact',s=>s.recordSets[0].sourceObjectSetRef={},s=>s.experimentalUnits.push({unit:'independent_animals',count:28}),s=>s.localWorkbookReadiness.newGeometryObjects=1,s=>s.localWorkbookReadiness.registrations=1]) { const changed=structuredClone(registry); mutate(source(changed)); assert.throws(() => validateCrozatNaVSourceRegistryRelationship(changed)); }
});
test('source metadata pins and current bundled dispositions are exact', () => {
  for (const mutate of [s=>s.assets[2].integrity.sha256='0'.repeat(64),s=>s.assets[3].bundled=false,s=>s.assets[4].url='https://example.com/wrong',s=>s.assets[5].path='data/other.xlsx',s=>s.rights.status='rights_unknown']) { const changed=structuredClone(registry); mutate(source(changed)); assert.throws(() => validateCrozatNaVSourceRegistryRelationship(changed)); }
});
test('all26 actual original workbook bytes, including unselectedINa, independently match SHA and publisherMD5', async () => {
  const result=validateCrozatLocalWorkbookPackage(registry,files);
  assert.equal(result.retainedOriginalWorkbookFiles,26);assert.ok(result.originalXlsxBytes>0);assert.equal(result.reacquiredOriginals,0);
  assert.deepEqual(await validatePersistedCrozatNaVSourceRegistryRelationship(registry),result);
});
test('same-length corrupted selected or unselected original and missing source bytes fail closed', () => {
  for (const name of ['data/source-candidates/crozat-nav-inhibition-20261004/56062562-InhNa.xlsx','data/source-candidates/crozat-experiment-families-20260930/56062547-INa.xlsx']) {
    const corrupted=new Map(files), body=Buffer.from(files.get(name));body[body.length-1]^=1;corrupted.set(name,body);
    assert.throws(() => validateCrozatLocalWorkbookPackage(registry,corrupted),/SHA changed/);
    const missing=new Map(files);missing.delete(name);assert.throws(() => validateCrozatLocalWorkbookPackage(registry,missing),/missing/);
  }
});
test('new NaV rows retain original raw labels/units and do not authorize paired rows', () => {
  const changed=structuredClone(crozatNaVInformation);changed.summary.pairedRowCount=28;
  assert.throws(() => validateCrozatNaVSourceRegistryRelationship(registry,changed));
});
test('canonical source/set/profile/roster/REG denominators remain unchanged', () => {
  const summary=summarizeResearchSourceRegistry(registry);
  assert.deepEqual([summary.sourceCount,summary.recordSetCount,summary.typeRecordCount,summary.bundledExactRosterCount,summary.bundledExactSourceObjectSetCount,summary.registrationCount],[32,42,387,13,4,0]);
});
test('full research entry includes one exact source replay and one registry relationship validation', async () => {
  const packageJson=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
  assert.equal(packageJson.scripts['validate:crozat-nav-inhibition'],'node scripts/validate-crozat-nav-inhibition-information-0.1.mjs && node scripts/validate-crozat-nav-inhibition-source-registry-0.1.mjs');
  assert.equal(packageJson.scripts['test:research'].split('npm run validate:crozat-nav-inhibition').length-1,1);
});
