import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildConnectivityAssertionCatalog, connectivityAssertionCsv, connectivityAssertionSummary, filterConnectivityAssertions, makeConnectivityAssertionExport, reconcileConnectivityAssertionSelection } from '../app/connectivity-assertions.js';

const read = (path) => JSON.parse(readFileSync(new URL(`../data/${path}`, import.meta.url)));
const inputs = {
  mvp: read('research-mvp-release-0.2.json'),
  hayashi: read('hayashi-v2a-source-taxonomy-0.1.json'),
  ronzano: read('ronzano-premotor-position-reference-0.1.json'),
};
const catalog = buildConnectivityAssertionCatalog(inputs);
const row = (conditionId) => catalog.records.find((item) => item.conditionId === conditionId);

test('the bounded adapter uses exact admitted contexts and defines all five distinct categories', () => {
  assert.equal(catalog.records.length, 16);
  assert.equal(new Set(catalog.records.map((item) => item.id)).size, 16);
  assert.equal(new Set(catalog.records.map((item) => item.sourceUrl)).size, 9);
  assert.equal(catalog.records.filter((item) => item.conditionId !== null).length, 13);
  assert.deepEqual(connectivityAssertionSummary(catalog), { direct_monosynaptic: 0, functional_influence: 12, projection_overlap: 0, computational_prediction: 0, unknown: 4 });
  assert.match(catalog.scope, /not a source-wide connectivity inventory/);
  assert.equal(catalog.cellEdgeCount, 0); assert.equal(catalog.synapseCount, null);
  assert.equal(catalog.sameCellJoinCount, 0); assert.equal(catalog.geometryObjectCount, 0); assert.equal(catalog.registrationCount, 0);
  for (const item of catalog.records) {
    assert.equal(item.edgeAdmission, false); assert.equal(item.exactSourceCellKey, null); assert.equal(item.exactTargetCellKey, null);
    assert.equal(item.directness, 'not_established');
    assert.ok(item.locators.every((locator) => locator.startsWith(item.inputPath + '#')));
  }
});

test('negative controls, adult/neonatal experiments and P09 interventions retain their own original results', () => {
  const failed = row('CND-P05-COMPLETE-T8');
  const spared = row('CND-P05-STAGGERED');
  assert.match(failed.statement, /failed to restore stepping/);
  assert.match(spared.statement, /enabled stepping through spared relay/);
  assert.notEqual(failed.methods.causalTest, spared.methods.causalTest);
  assert.equal(failed.sourceObjects.condition.phase.value, null);
  assert.ok(failed.sourceObjects.evidenceStatements.some((statement) => statement.id === 'P05-N03'));
  assert.equal(row('CND-P08-NEONATAL').lifeStage, 'neonatal');
  assert.equal(row('CND-P08-ADULT').lifeStage, 'adult');
  const p09 = catalog.records.filter((item) => item.assertionId === 'CLM-P09-MOUSE-CAUSAL');
  assert.equal(p09.length, 4);
  assert.equal(new Set(p09.map((item) => item.statement)).size, 4);
  assert.match(row('CND-P09-MOUSE-CHRONIC-SILENCING').statement, /reduced recovery/);
  for (const item of catalog.records.filter((record) => record.conditionId !== null)) {
    const original = inputs.mvp.conditions.find((condition) => condition.id === item.conditionId);
    assert.deepEqual(item.sourceObjects.condition, original);
    assert.equal(item.statement, original.resultSummary);
    assert.match(item.parentClaimGradesScope, /Whole parent claim only/);
  }
});

test('human association and population tracing never inherit mouse cell identities or a directness grade', () => {
  const human = row('CND-P09-HUMAN-EES');
  assert.equal(human.species, 'Homo sapiens'); assert.equal(human.category, 'unknown');
  assert.deepEqual(human.populationEntityContextIds, []);
  assert.equal(human.sourceObjects.claim.humanCausalEvidence, false);
  assert.equal(human.sourceObjects.condition.humanCausalEvidence, false);
  const hayashi = catalog.records.filter((item) => item.inputPath.includes('hayashi'));
  assert.equal(hayashi.length, 2);
  for (const item of hayashi) {
    assert.equal(item.category, 'unknown');
    assert.equal(item.sourceObjects.majorType.sameCellProjectionTraceAvailable, false);
    assert.equal(item.sourceObjects.majorType.exactBarcodeAssignmentAvailable, false);
    assert.notEqual(item.lifeStage, 'P0 neonatal');
    assert.ok(item.sourceObjects.sourceLocators.length >= 2);
  }
  const ronzano = catalog.records.find((item) => item.inputPath.includes('ronzano'));
  assert.equal(ronzano.category, 'unknown'); assert.match(ronzano.methods.tracing, /delta-G rabies/);
  assert.match(ronzano.lifeStage, /P1-P2/);
  assert.equal(ronzano.sourceObjects.sourceFiles.length, 22);
  assert.ok(ronzano.sourceObjects.missingness.some((item) => item.field === 'synapse_roster' && item.status === 'UNAVAILABLE'));
  assert.match(ronzano.statement, /not a complete connectome edge list/);
});

test('filtering by category, species, method and age clears stale detail selection', () => {
  const human = filterConnectivityAssertions(catalog.records, { species: 'Homo sapiens' });
  assert.equal(human.length, 1);
  assert.equal(reconcileConnectivityAssertionSelection(human, human[0].id), human[0].id);
  assert.equal(reconcileConnectivityAssertionSelection(human, row('CND-P08-ADULT').id), null);
  assert.equal(reconcileConnectivityAssertionSelection(catalog.records, null), null);
  assert.equal(filterConnectivityAssertions(catalog.records, { category: 'direct_monosynaptic' }).length, 0);
  assert.equal(filterConnectivityAssertions(catalog.records, { category: 'computational_prediction' }).length, 0);
  assert.equal(filterConnectivityAssertions(catalog.records, { query: 'rabies P1-P2' }).length, 1);
  assert.equal(filterConnectivityAssertions(catalog.records, { lifeStage: 'neonatal' }).length, 1);
  assert.equal(filterConnectivityAssertions(catalog.records, { sourceId: 'SRC-P05', query: 'COMPLETE-T8 failed' }).length, 1);
});

test('exact JSON/CSV exports preserve original source objects and reject duplicate or invented records', () => {
  const selected = row('CND-P05-COMPLETE-T8');
  const exported = makeConnectivityAssertionExport(catalog, [selected], { sourceId: 'SRC-P05' }, '2026-09-30T00:00:00Z');
  assert.equal(exported.rowCount, 1); assert.equal(exported.cellEdgeCount, 0); assert.equal(exported.synapseCount, null);
  assert.deepEqual(exported.records[0], selected);
  assert.notEqual(exported.records[0], selected);
  assert.equal(exported.categoryLegend.length, 5);
  const csv = connectivityAssertionCsv(exported);
  assert.match(csv, /CLP290 failed to restore stepping/);
  assert.match(csv, /CND-P05-COMPLETE-T8/);
  assert.match(csv, /exactSourceCellKey/); assert.match(csv, /sourceObjects/); assert.match(csv, /not_established/);
  assert.match(csv, /data\/research-mvp-release-0.2.json#conditions/);
  assert.doesNotMatch(JSON.stringify(exported), /schematicPosition|prototype_schematic_v0/);
  assert.throws(() => makeConnectivityAssertionExport(catalog, [selected, selected], {}, 'now'), /distinct/);
  assert.throws(() => makeConnectivityAssertionExport(catalog, [{ ...selected, category: 'direct_monosynaptic' }], {}, 'now'), /unchanged/);
  assert.throws(() => makeConnectivityAssertionExport(catalog, [{ ...selected, exactTargetCellKey: 'invented-partner' }], {}, 'now'), /unchanged/);
  assert.throws(() => makeConnectivityAssertionExport(catalog, [{ ...selected, id: 'unadmitted-assertion' }], {}, 'now'), /one admitted source object/);
  assert.equal(makeConnectivityAssertionExport(catalog, [], { category: 'projection_overlap' }, 'now').rowCount, 0);
});

test('the bounded adapter rejects new conditions, broken source locators, species drift and tracing promotion', () => {
  const changed = () => structuredClone(inputs);
  let bad = changed(); bad.mvp.claims[0].conditionIds.push('UNREVIEWED');
  assert.throws(() => buildConnectivityAssertionCatalog(bad), /Unreviewed condition scope/);
  bad = changed(); bad.mvp.conditions[0].sourceId = 'SRC-P09';
  assert.throws(() => buildConnectivityAssertionCatalog(bad), /Condition\/source mismatch/);
  bad = changed(); bad.mvp.conditions[0].species = 'Homo sapiens';
  assert.throws(() => buildConnectivityAssertionCatalog(bad), /Unreviewed species context/);
  bad = changed(); bad.mvp.evidenceStatements[0].sourceId = 'SRC-P09';
  assert.throws(() => buildConnectivityAssertionCatalog(bad), /Statement\/source mismatch/);
  bad = changed(); bad.hayashi.sourceReportedMajorTypes[0].sameCellProjectionTraceAvailable = true;
  assert.throws(() => buildConnectivityAssertionCatalog(bad), /Unreviewed projection scope/);
  bad = changed(); bad.ronzano.relationshipBoundary.crossSourceJoinCount = 1;
  assert.throws(() => buildConnectivityAssertionCatalog(bad), /Unreviewed tracing relationship scope/);
});
