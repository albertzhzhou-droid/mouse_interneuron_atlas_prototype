import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { GARCIA_RAMIREZ_SOURCE_ID as sourceId, GARCIA_RAMIREZ_RECORD_SET_ID as setId, validateGarciaRamirezSourceRegistryRelationship, validatePersistedGarciaRamirezSourceRegistryRelationship } from '../scripts/validate-garcia-ramirez-source-registry-0.1.mjs';
import { deriveResearchSourceRegistrySummary } from '../app/research-source-registry-summary.js';
import { summarizeResearchSourceRegistry, validateResearchSourceRegistry, validateResearchSourceUpgradeLinks } from '../scripts/validate-research-source-registry-0.1.mjs';
import { buildResearchUpgradeRegistry, stableJson } from '../tools/build_research_upgrade_registry.mjs';
import { validateResearchUpgradeRegistry } from '../scripts/validate-research-model-upgrade-registry-0.1.mjs';
import { getSourceRecordSetNavigation } from '../app/research-source-drilldown.js';

const readJson = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const registry = await readJson('data/research-source-registry-0.1.json');
const upgrades = await readJson('data/research-model-upgrade-registry-0.1.json');
const packageJson = await readJson('package.json');
const queue = await readFile(new URL('../docs/RESEARCH_MODEL_UPGRADE_QUEUE.md', import.meta.url), 'utf8');
const source = registry.sources.find(source => source.id === sourceId);
const set = source.recordSets[0];

test('One aggregate study source/record set changes only its own inventory units', () => {
  validateResearchSourceRegistry(registry); validateResearchSourceUpgradeLinks(registry, upgrades);
  const summary = deriveResearchSourceRegistrySummary(registry);
  assert.deepEqual(summary, { sourceCount: 32, recordSetCount: 42, bundledExactCellProfileRosterCount: 13, bundledExactSourceObjectSetCount: 4 });
  const before = structuredClone(registry); before.sources = before.sources.filter(source => source.id !== sourceId); before.sourceCount = before.sources.length;
  assert.deepEqual(deriveResearchSourceRegistrySummary(before), { sourceCount: 31, recordSetCount: 41, bundledExactCellProfileRosterCount: 13, bundledExactSourceObjectSetCount: 4 });
  assert.equal(summarizeResearchSourceRegistry(registry).typeRecordCount, 387);
  assert.equal(summarizeResearchSourceRegistry(registry).registrationCount, 0);
  assert.equal(source.recordSets.length, 1); assert.equal(set.includedRecordCount.value, 1);
  assert.equal(set.unitOfObservation, 'source_study_aggregate_information_adapter');
});
test('Four source assets retain exact physical bytes and the published CC BY4.0 identity', async () => {
  assert.deepEqual(await validatePersistedGarciaRamirezSourceRegistryRelationship(), { sourceCountAdded: 1, declaredRecordSetsAdded: 1, retainedStudyInformationAdapters: 1, recordedObservationPool: 171, newMolecularProfiles: 0, newPhysicalCellRosterRows: 0, bundledExactCellProfileRostersAdded: 0, bundledExactSourceObjectSetsAdded: 0, sameCellCrossSourceJoins: 0, registrations: 0 });
});
test('Published aggregate metadata never creates a physical-cell or source-object drill-down', () => {
  const navigation = getSourceRecordSetNavigation(sourceId, setId, set);
  assert.equal(navigation.status, 'unavailable'); assert.deepEqual(navigation.entries, []);
  assert.equal(navigation.reason, set.childRosterRef.missingReason);
  assert.equal(navigation.sourceObjectSetReference, null);
  assert.equal(navigation.includedRecordCount.unit, 'study_aggregate_information_adapters');
  assert.equal(navigation.newAdmissionCount, 0);
  assert.equal(set.sourceInformationRef.href, '/explore/cell-types/additional#garcia-ramirez-physiology-panel');
  assert.equal(set.sourceObjectSetRef, undefined);
});
test('Recorded observations, reporter animals and prior-study reuse subsets remain separate', () => {
  assert.deepEqual(source.experimentalUnits.map(row => row.count), [171, 51, 6, 60, 28]);
  assert.equal(source.experimentalUnits[0].independentAnimalCount, null);
  assert.equal(source.experimentalUnits[0].cellToAnimalMapping, null);
  for (const subset of source.experimentalUnits.slice(3)) assert.equal(subset.isSubsetOfCurrentShox2Cohort, true);
  for (const partition of set.alternativePartitions) {
    assert.equal(partition.groupCounts.reduce((sum, count) => sum + count, 0), 171);
    assert.equal(partition.sourceRecordedPoolDenominatorId, source.experimentalUnits[0].denominatorId);
  }
});
test('Counterfactual roster/type/animal/geometry/source-pin promotions fail the relationship gate', () => {
  const mutations = [
    source => source.experimentalUnits[0].count = 684,
    source => source.experimentalUnits[0].unit = 'mouse',
    source => source.experimentalUnits[0].independentAnimalCount = 171,
    source => source.experimentalUnits[1].count = 79,
    source => source.experimentalUnits[3].isSubsetOfCurrentShox2Cohort = false,
    source => source.experimentalUnits[4].parentDenominatorId = source.experimentalUnits[2].denominatorId,
    source => source.recordSets.push(structuredClone(source.recordSets[0])),
    source => source.recordSets[0].includedRecordCount.value = 16,
    source => source.recordSets[0].includedRecordCount.unit = 'canonical_types',
    source => source.recordSets[0].idField = 'tables[].groups[].id',
    source => source.recordSets[0].childRosterRef = { status: 'bundled_exact', path: source.recordSets[0].dataPath, idField: 'tables[].groups[].id', missingReason: null },
    source => source.recordSets[0].sourceObjectSetRef = { status: 'bundled_exact', path: source.recordSets[0].dataPath, idField: 'tables[].groups[].id', missingReason: null },
    source => source.recordSets[0].alternativePartitions[2].groupCounts[0] = 24,
    source => source.recordSets[0].admissionBoundary.registrations = 1,
    source => source.assets[1].integrity.sha256 = '0'.repeat(64),
    source => source.assets[1].url = 'https://ndownloader.figshare.com/files/36551719',
    source => source.rights.status = 'public_access_only',
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(registry); mutate(changed.sources.find(source => source.id === sourceId));
    assert.throws(() => validateGarciaRamirezSourceRegistryRelationship(changed));
  }
});
test('The top-level current research suite runs physical-source and registry-relationship validation', () => {
  assert.equal(packageJson.version, '2.91.0-research.1');
  assert.equal(packageJson.scripts['validate:garcia-ramirez-physiology'], 'node scripts/validate-garcia-ramirez-physiology-0.1.mjs && node scripts/validate-garcia-ramirez-source-registry-0.1.mjs');
  assert.equal(packageJson.scripts['test:research'].match(/npm run validate:garcia-ramirez-physiology/g)?.length, 1);
});
test('Only declared in-progress UPG173 scope is synchronized; completion count remains83', () => {
  assert.equal(stableJson(buildResearchUpgradeRegistry(queue)), stableJson(upgrades));
  const row = upgrades.upgrades.find(row => row.id === 'UPG-173');
  assert.match(row.status, /^in progress/); assert.equal(row.lane, 'electrophysiology');
  assert.equal(row.blocker.code, 'remaining_validation');
  assert.match(row.description, /one 171-recorded-observation pool/);
  assert.match(row.description, /as a subset/);
  assert.equal(upgrades.summary.byStatus.completed, 83);
  validateResearchUpgradeRegistry(upgrades, { queueMarkdown: queue });
  const changed = queue.replace('| UPG-173 | P2 | in progress — exact-source aggregate physiology; integration validation pending |', '| UPG-173 | P2 | completed |');
  assert.notEqual(changed, queue);
  assert.throws(() => validateResearchUpgradeRegistry(buildResearchUpgradeRegistry(changed)), /UPG-173/);
});
