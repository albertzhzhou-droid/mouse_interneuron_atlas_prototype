import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { garciaRamirezPhysiologyFacts as facts, garciaRamirezPhysiologyDerivation as receipt, validateGarciaRamirezPhysiology, readGarciaRamirezPhysiologyView, writeGarciaRamirezPhysiologyView, garciaRamirezSourceTable, garciaRamirezPropertyRows, exportGarciaRamirezPhysiology } from '../app/garcia-ramirez-physiology.js';
import { validatePersistedGarciaRamirezPhysiology } from '../scripts/validate-garcia-ramirez-physiology-0.1.mjs';

test('Retained physical source bytes, rights, schema, extractor and derived receipt agree', async () => {
  const result = await validatePersistedGarciaRamirezPhysiology();
  assert.equal(result.sourceInputFiles, 3);
  assert.equal(result.exactSourceBytes, 951043);
  assert.equal(result.sourceMeanSdValues, 192);
  assert.equal(result.propertyRows, 48);
  assert.equal(result.sourceReportedComparisons, 48);
});
test('Four alternative partitions retain one recorded observation pool and separate animals/reuse', () => {
  for (const table of facts.tables) {
    assert.equal(table.groups.reduce((sum, group) => sum + group.recordedObservationCount, 0), 171);
    assert.equal(table.sourceRecordedPoolDenominatorId, facts.studyScope.recordedPool.id);
  }
  assert.deepEqual(facts.studyScope.animalCohorts.map(row => row.reportedMice), [51, 6]);
  assert.equal(facts.studyScope.priorStudyReuse.isSubsetOfCurrentShox2Cohort, true);
  assert.equal(facts.studyScope.recordedPool.cellToAnimalMapping, null);
  assert.equal(facts.studyScope.recordedPool.independentAnimalCount, null);
  assert.equal(facts.studyScope.sex, null);
});
test('All 192 displayed raw summaries retain exact row-column locators and SD interpretation', () => {
  let total = 0;
  facts.tables.forEach((table, index) => table.propertyRows.forEach((row, rowIndex) => row.values.forEach((value, column) => {
    assert.equal(value.locator.tableOrdinal, index + 1);
    assert.equal(value.locator.rowOneBased, rowIndex + 2);
    assert.equal(value.locator.columnOneBased, column + 2);
    assert.equal(value.uncertaintyKind, 'source_reported_standard_deviation');
    assert.equal(value.groupId, table.groups[column].id); total++;
  })));
  assert.equal(total, 192);
});
test('Unprinted units and unresolved printed statements remain bounded', () => {
  for (const table of facts.tables) {
    for (const property of ['normalized_fahp_amplitude', 'fi_slope']) {
      const row = table.propertyRows.find(row => row.propertyId === property);
      assert.equal(row.unitRaw, null); assert.ok(row.unitNotPrintedReason);
    }
  }
  assert.equal(facts.rawSourceDiscrepancies[0].sourceRawFragment, 'Cm = Rin/τ');
  assert.equal(facts.rawSourceDiscrepancies[1].reportedChx10Positive, 6);
  assert.equal(facts.rawSourceDiscrepancies[1].listedPositiveCountSum, 4);
});
test('Scientific counterfactual mutations fail semantic validation', () => {
  const mutations = [
    value => value.studyScope.recordedPool.value = 684,
    value => value.studyScope.recordedPool.independentAnimalCount = 171,
    value => value.studyScope.priorStudyReuse.isSubsetOfCurrentShox2Cohort = false,
    value => value.tables[2].groups[0].recordedObservationCount = 24,
    value => value.tables[0].propertyRows[9].unitRaw = 'mV',
    value => value.tables[0].propertyRows[0].values[0].standardDeviation = 0,
    value => value.tables[0].propertyRows[0].values[0].uncertaintyKind = 'standard_error',
    value => value.tables[1].propertyRows[1].values[0].locator.tableOrdinal = 1,
    value => value.studyScope.firingComposition[0].recordedObservationCount = 79,
    value => value.studyScope.interpretationBoundary.newMolecularProfiles = 16,
    value => value.studyScope.interpretationBoundary.registrations = 1,
    value => value.tables[3].groups[0].physicalCellRosterAvailable = true,
    value => value.derivation.statisticalReanalysisPerformed = true,
  ];
  for (const mutate of mutations) { const value = structuredClone(facts); mutate(value); assert.throws(() => validateGarciaRamirezPhysiology(value, receipt)); }
});
test('Namespaced URL selections preserve the current route and unrelated source choices', () => {
  const href = 'http://localhost/explore/cell-types/additional?source=Russ&search=rheobase#garcia-ramirez-physiology-panel';
  const written = writeGarciaRamirezPhysiologyView(href, { tableId: 'ST4', query: 'input resistance' });
  const url = new URL(written, 'http://localhost');
  assert.equal(url.pathname, '/explore/cell-types/additional');
  assert.equal(url.hash, '#garcia-ramirez-physiology-panel');
  assert.equal(url.searchParams.get('source'), 'Russ');
  assert.equal(url.searchParams.get('search'), 'rheobase');
  assert.deepEqual(readGarciaRamirezPhysiologyView(url.searchParams), { tableId: 'ST4', query: 'input resistance', error: null });
  assert.equal(new URL(writeGarciaRamirezPhysiologyView(written, { tableId: 'ST1', query: '' }), 'http://localhost').searchParams.has('physiologyQuery'), false);
});
test('Unknown, empty and duplicate grouping selectors fail closed, default is the source reporter table', () => {
  assert.equal(readGarciaRamirezPhysiologyView(new URLSearchParams()).tableId, 'ST1');
  for (const query of ['physiologyTable=ST5', 'physiologyTable=', 'physiologyTable=ST1&physiologyTable=ST1', 'physiologyTable=ST1&physiologyTable=ST4']) {
    assert.equal(readGarciaRamirezPhysiologyView(new URLSearchParams(query)).tableId, null);
  }
  assert.equal(garciaRamirezSourceTable('ST5'), null);
  assert.throws(() => exportGarciaRamirezPhysiology({ tableId: null, query: '' }));
  assert.throws(() => writeGarciaRamirezPhysiologyView('/explore/cell-types/additional', { tableId: 'ST5', query: '' }));
});
test('Property search filters presentation and full facts export retains all four attributed tables', () => {
  assert.equal(garciaRamirezPropertyRows(garciaRamirezSourceTable('ST1'), 'input resistance').length, 1);
  assert.equal(garciaRamirezPropertyRows(garciaRamirezSourceTable('ST4'), 'F/I').length, 1);
  assert.equal(garciaRamirezPropertyRows(garciaRamirezSourceTable('ST4'), 'unknown-property').length, 0);
  const exported = exportGarciaRamirezPhysiology({ tableId: 'ST4', query: 'rheobase' });
  assert.equal(exported.sourceFacts.tables.length, 4);
  assert.equal(exported.sourceFacts.source.inputPins.length, 3);
  assert.deepEqual(exported.selection.visiblePropertyIds, ['rheobase']);
  assert.equal(exported.derivationReceipt.output.sha256, receipt.output.sha256);
  assert.equal(exported.actualViewCaptured, false); assert.equal(exported.sourceInputsFetchedDuringThisExport, false);
  for (const key of ['newMolecularProfiles', 'newPhysicalCellRosterRows', 'geometryObjects', 'sameCellCrossSourceJoins', 'registrations']) assert.equal(exported[key], 0);
  exported.sourceFacts.tables[0].groups[0].recordedObservationCount = 999;
  assert.equal(facts.tables[0].groups[0].recordedObservationCount, 143);
});
test('Current additional-evidence route mounts this panel lazily and preserves all existing workspaces', async () => {
  const mount = await readFile(new URL('../app/AdditionalResearchEvidence.tsx', import.meta.url), 'utf8');
  assert.match(mount, /const GarciaRamirezPhysiologyPanel = lazy\(/);
  assert.match(mount, /physiologyOpen && <Suspense/);
  assert.match(mount, /id="garcia-ramirez-physiology-panel"/);
  for (const entry of ['MccreedyV2aPopulationMovie', 'DandiSpinalCordTracePreview', 'ConnectivityAssertionWorkbench', 'AtlasSamplingSensitivityPanel']) assert.match(mount, new RegExp(entry));
  assert.match(mount, /physiologyRef.current, movieRef.current/);
});
