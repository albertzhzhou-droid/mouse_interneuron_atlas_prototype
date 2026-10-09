import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CORE_INPUTS_291 } from '../tools/build_research_iteration_manifest_2_91.mjs';

const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));
const [registry, upgrades, adapter, taxonomy, packageJson] = await Promise.all([
  'data/research-source-registry-0.1.json', 'data/research-model-upgrade-registry-0.1.json',
  'data/russ-spinal-information-adapter-0.1.json', 'data/russ-harmonized-taxonomy-crosswalk-0.1.json', 'package.json',
].map(json));
const source = registry.sources.find(item => item.id === 'SRC-RUSS-2021');

test('published sequencing unit names its six-study denominator without creating an exact child roster', () => {
  const unit = source.experimentalUnits.find(item => item.unit === 'captured_sequenced_cell_or_nucleus');
  assert.equal(unit.count, adapter.sequencingDenominator.value);
  assert.equal(unit.count, 19353); assert.equal(unit.denominatorId, adapter.sequencingDenominator.id);
  assert.equal(unit.denominatorLocator, adapter.sequencingDenominator.countLocator);
  assert.deepEqual(unit.studies.map(item => item.count), [5473, 421, 1042, 11201, 1130, 86]);
  assert.equal(unit.studies.reduce((sum, item) => sum + item.count, 0), unit.count);
  assert.equal(unit.individualAgeAssignmentAvailable, false); assert.equal(unit.animalResolvedReplicationAvailable, false);
  assert.match(unit.scope, /not adult prevalence, independent animals or individual nucleus identities/);
  const record = source.recordSets.find(item => item.recordSetId === 'RS-RUSS-POPULATIONS');
  assert.equal(record.includedRecordCount.value, taxonomy.populations.length); assert.equal(record.includedRecordCount.value, 69);
  assert.equal(record.unitOfObservation, 'source_population'); assert.equal(record.childRosterRef.status, 'not_retained_in_project');
  assert.equal(record.childRosterRef.path, null); assert.equal(record.childRosterRef.idField, null);
  assert.equal(adapter.adultValidationContext.panelCountedCellsSum, 2371);
  assert.notEqual(unit.count, adapter.adultValidationContext.panelCountedCellsSum);
});

test('source card receipts the physically bundled derived facts while exact identities remain missing', async () => {
  const asset = source.assets.find(item => item.id === 'ASSET-RUSS-PUBLISHED-SOURCE-INFORMATION');
  const bytes = await readFile(new URL('../' + asset.path, import.meta.url));
  assert.equal(asset.bundled, true); assert.equal(asset.integrity.bytes, bytes.length);
  assert.equal(asset.integrity.sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.equal(asset.accession, adapter.source.publication.doi); assert.equal(asset.url, adapter.source.publication.articleUrl);
  assert.equal(source.recordSets.length, 1); assert.equal(source.experimentalUnits.find(item => item.unit === 'harmonized_population').count, 69);
  const missing = source.missingness.find(item => item.field === 'population_cell_roster');
  assert.equal(missing.status, 'NOT_RETAINED'); assert.match(missing.reason, /cell identities or GEO cell roster/);
  assert.doesNotMatch(missing.reason, /identities or counts/); assert.match(missing.reason, /counts are retained only as source-level aggregates/);
  assert.match(source.rights.note, /No per-object GEO redistribution licence is established/);
  assert.equal(adapter.source.rights.countMatrixBundled, false);
});

test('queue records achieved information scope and retains pending GEO pins and permission boundary', () => {
  const item = upgrades.upgrades.find(item => item.id === 'UPG-132');
  assert.match(item.status, /^in progress/); assert.notEqual(item.status, 'completed');
  assert.equal(item.blocker.code, 'rights_or_permission'); assert.equal(upgrades.summary.upgradeCount, 243);
  for (const value of ['111,999', '113,707', '112,984,417', '2268141a1c5efbecd9dc85fc80bc7296c00f3dea04d2a6555be90c9c831729c6', '9ed13abf990d17d5b19a2c9f18db7ccd3e662d4325f184324f639882a8db917d']) assert.ok(item.description.includes(value));
  assert.match(item.description, /those GEO objects were not acquired or revalidated by I53/);
  assert.match(item.description, /523 difference remains unresolved/);
  assert.match(item.acceptanceBoundary, /source matrices remain unbundled until rights approval/);
  assert.ok(source.linkedUpgradeIds.includes('UPG-132'));
});

test('current package and manifest recipe include the reproducible source adapter inputs', () => {
  assert.equal(packageJson.scripts['validate:russ-information'], 'node scripts/validate-russ-spinal-information-adapter-0.1.mjs');
  for (const path of ['app/RussSpinalInformationPanel.tsx', 'app/russ-spinal-information-adapter.js',
    'data/russ-spinal-information-adapter-0.1.json', 'data/russ-spinal-information-derivation-receipt-0.1.json',
    'tools/extract_russ_spinal_information_adapter_0_1.py', 'tests/test_russ_spinal_information_adapter_0_1.py',
    'scripts/validate-russ-spinal-information-adapter-0.1.mjs', 'tests/russ-spinal-information-adapter.test.mjs',
    'tests/russ-information-parent-integration.test.mjs',
    'data/source-candidates/russ-spinal-information-20261004/russ-information-inputs-manifest-0.1.json',
    'data/source-candidates/russ-spinal-information-20261004/41467_2021_25125_MOESM6_ESM.xlsx',
    'data/source-candidates/russ-spinal-information-20261004/41467_2021_25125_MOESM7_ESM.xlsx',
    'data/source-candidates/russ-spinal-information-20261004/PMC8481483.fullText.xml',
    'data/source-candidates/russ-spinal-information-20261004/russ-harmonized-taxonomy-crosswalk-0.1.input.json']) {
    assert.equal(CORE_INPUTS_291.filter(item => item === path).length, 1, path);
  }
});
