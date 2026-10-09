import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTypeProfileViewState as parse, serializeTypeProfileViewState as serialize } from '../app/type-profile-view-state.js';

const ids = new Set(['sathyamurthy-2018:DE-1', 'sathyamurthy-2018:DE-2', 'russ-2021:SYNTHETIC_TEST_ID']);
const namespaces = new Set(['sathyamurthy-2018', 'russ-2021']);
const defaultId = 'sathyamurthy-2018:DE-1';
const read = text => parse(new URLSearchParams(text), ids, namespaces, defaultId);
const deny = text => {
  const state = read(text);
  assert.equal(state.available, false);
  assert.ok(state.errors.length);
  assert.deepEqual(state.comparisonIds, []);
  assert.equal(state.baselineId, null);
  return state;
};

test('absent profile request preserves the explicit existing default', () => {
  const state = read('sourcePanel=glut');
  assert.equal(state.available, true);
  assert.equal(state.explicitSelection, false);
  assert.equal(state.selectedId, defaultId);
});
test('unknown, empty, foreign, stale and modified literal profile IDs are unavailable', () => {
  for (const id of ['', 'missing-profile', 'NeuroMorpho:45718', defaultId + ':old', defaultId.toUpperCase(), ' ' + defaultId]) {
    const state = deny(new URLSearchParams({ type: id }).toString());
    assert.equal(state.selectedId, id);
    assert.equal(state.explicitSelection, true);
  }
});
test('duplicate legacy requests never use the first occurrence', () => {
  for (const second of [defaultId, 'missing-profile']) {
    assert.equal(deny(`type=${defaultId}&type=${second}`).selectedId, null);
  }
});
test('partial and foreign canonical requests own selection and refuse legacy substitution', () => {
  for (const text of ['focusKind=molecular_profile', `focusId=${defaultId}`,
    `focusKind=morphology_record&focusId=${defaultId}`, 'focusKind=molecular_profile&focusId=missing-profile']) {
    const state = deny(text + `&type=${defaultId}`);
    assert.equal(state.explicitSelection, true);
  }
});
test('duplicate canonical fields are unavailable even when the copies agree', () => {
  for (const tail of ['focusKind=molecular_profile', `focusId=${defaultId}`]) {
    deny(`focusKind=molecular_profile&focusId=${defaultId}&${tail}`);
  }
});
test('a valid canonical request retains its exact ID and owns the legacy alias', () => {
  const state = read(`focusKind=molecular_profile&focusId=${defaultId}&type=missing-profile`);
  assert.equal(state.available, true);
  assert.equal(state.selectedId, defaultId);
});
test('partial, duplicate, unknown and over-limit comparisons fail closed as a whole', () => {
  for (const value of ['', `${defaultId},`, `${defaultId},missing-profile`, `${defaultId},${defaultId}`,
    Array(5).fill(defaultId).join(',')]) deny(new URLSearchParams({ typeCompare: value }).toString());
  deny(`typeCompare=${defaultId}&typeCompare=sathyamurthy-2018:DE-2`);
});
test('invalid or same-record baselines cannot produce a delta authority', () => {
  for (const id of ['', 'missing-profile', defaultId]) deny(new URLSearchParams({ typeBaseline: id }).toString());
  deny('typeBaseline=sathyamurthy-2018:DE-2&typeBaseline=sathyamurthy-2018:DE-2');
});
test('all four filters restore complete literal values alongside selection and comparison', () => {
  const state = read(new URLSearchParams({ type: 'sathyamurthy-2018:DE-2', typeQuery: ' GSE318731 + "raw" ',
    typeSource: 'russ-2021', typeRegion: 'not_established', typeTransmitter: 'mixed',
    typeBaseline: defaultId, typeCompare: `${defaultId},russ-2021:SYNTHETIC_TEST_ID` }).toString());
  assert.equal(state.available, true);
  assert.equal(state.selectedId, 'sathyamurthy-2018:DE-2');
  assert.equal(state.query, ' GSE318731 + "raw" ');
  assert.equal(state.sourceFilter, 'russ-2021');
  assert.equal(state.regionFilter, 'not_established');
  assert.equal(state.transmitterFilter, 'mixed');
  assert.equal(state.baselineId, defaultId);
  assert.deepEqual(state.comparisonIds, [defaultId, 'russ-2021:SYNTHETIC_TEST_ID']);
});
test('unknown, case-modified and duplicate filter values do not preserve evidence authority', () => {
  for (const [key, valid] of [['typeSource', 'russ-2021'], ['typeRegion', 'dorsal'], ['typeTransmitter', 'excitatory']]) {
    for (const value of ['', 'foreign-value', valid.toUpperCase()]) deny(new URLSearchParams({ [key]: value }).toString());
    deny(`${key}=${valid}&${key}=${valid}`);
  }
  deny('typeQuery=first&typeQuery=second');
});
test('query limits are validated rather than silently truncating source search', () => {
  assert.equal(read('typeQuery=').available, true);
  assert.equal(read(`typeQuery=${'x'.repeat(160)}`).available, true);
  deny(`typeQuery=${'x'.repeat(161)}`);
});
test('serialization round trips full source state and retains unrelated route fields', () => {
  const state = read('type=sathyamurthy-2018:DE-2&typeQuery=rheobase&typeSource=russ-2021&typeRegion=mid&typeTransmitter=excitatory&typeBaseline=sathyamurthy-2018:DE-1');
  const params = serialize(new URLSearchParams('sourcePanel=glut&rnaFeature=unrelated&type=old&focusId=old&focusId=duplicate'), state, ids, namespaces, defaultId);
  const result = parse(params, ids, namespaces, defaultId);
  assert.equal(result.available, true);
  for (const key of ['selectedId', 'query', 'sourceFilter', 'regionFilter', 'transmitterFilter', 'comparisonIds', 'baselineId']) assert.deepEqual(result[key], state[key]);
  assert.equal(params.get('sourcePanel'), 'glut');
  assert.equal(params.get('rnaFeature'), 'unrelated');
  assert.equal(params.has('type'), false);
  assert.equal(params.getAll('focusId').length, 1);
});
test('serialization removes default filter keys without changing exact selection', () => {
  const params = serialize(new URLSearchParams('typeQuery=old&typeSource=russ-2021&typeRegion=mid&typeTransmitter=mixed&typeBaseline=old&typeCompare=old'), read(''), ids, namespaces, defaultId);
  for (const key of ['typeQuery', 'typeSource', 'typeRegion', 'typeTransmitter', 'typeBaseline', 'typeCompare']) assert.equal(params.has(key), false);
  assert.equal(params.get('focusId'), defaultId);
});
test('invalid or incomplete state cannot be published as a valid bookmark', () => {
  const valid = read('');
  for (const mutation of [{ selectedId: null }, { selectedId: 'unknown' }, { query: undefined }, { sourceFilter: 'foreign' },
    { regionFilter: 'foreign' }, { transmitterFilter: 'foreign' }, { comparisonIds: [defaultId, defaultId] }, { baselineId: defaultId }]) {
    assert.throws(() => serialize(new URLSearchParams(), { ...valid, ...mutation }, ids, namespaces, defaultId));
  }
});
test('a caller cannot invent the default outside current source membership', () => {
  assert.throws(() => parse(new URLSearchParams(), ids, namespaces, 'missing-profile'));
});

// Production membership is tested independently of the small malformed-input fixtures above.
import membership from '../data/type-profile-view-membership-0.1.json' with { type: 'json' };
import index from '../public/data/research_explorer_index_v1/search-index.json' with { type: 'json' };
import { buildTypeProfileViewMembership } from '../tools/build_type_profile_view_membership.mjs';
test('the complete current 387-profile, ten-namespace membership equals the actual index and generator', async () => {
  assert.deepEqual(membership, await buildTypeProfileViewMembership());
  const rows = index.records.filter(record => record.focusKind === 'molecular_profile');
  assert.equal(rows.length, 387); assert.equal(new Set(rows.map(record => record.namespace)).size, 10);
  assert.deepEqual(membership.profiles, rows.map(record => ({ id: record.focusId, namespace: record.namespace })));
  for (const row of rows) {
    const state = parse(new URLSearchParams({ focusKind: 'molecular_profile', focusId: row.focusId, typeSource: row.namespace }));
    assert.equal(state.available, true, row.focusId); assert.equal(state.selectedId, row.focusId);
  }
  assert.equal(parse(new URLSearchParams({ type: 'russ-2021:SYNTHETIC_TEST_ID' })).available, false);
});
test('production comparisons retain four exact source namespaces without merging identity', () => {
  const chosen = [...new Map(membership.profiles.map(profile => [profile.namespace, profile.id])).values()].slice(0, 4);
  const state = parse(new URLSearchParams({ typeCompare: chosen.join(',') }));
  assert.equal(state.available, true); assert.deepEqual(state.comparisonIds, chosen);
});
