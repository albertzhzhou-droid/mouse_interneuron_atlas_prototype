import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import registry from '../data/research-source-registry-0.1.json' with { type: 'json' };
import glut from '../data/cano-gomez-glut-active-ident-labels-0.1.json' with { type: 'json' };
import todd from '../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json' with { type: 'json' };
import { getSourceRecordSetNavigation, sourceDrilldownReceipt, readSourceRegistrySelection, readSourceRegistryRecordSetSelection, writeSourceRegistryLocation } from '../app/research-source-drilldown.js';
import { INDEPENDENT_OBJECT_VIEW_INDEX } from '../app/independent-source-object-view.js';
import { readIndependentSourceLocation } from '../app/independent-source-workspace-state.js';
import { CORE_INPUTS_291 } from '../tools/build_research_iteration_manifest_2_91.mjs';
import { nextSourceListRovingKey, resolveSourceListRovingKey } from '../app/source-list-roving-focus.js';

const sets = registry.sources.flatMap(source => source.recordSets.map(recordSet => ({ source, recordSet, navigation: getSourceRecordSetNavigation(source.id, recordSet.recordSetId, recordSet) })));
const available = sets.filter(row => row.navigation.status === 'available');
const entries = available.flatMap(row => row.navigation.entries);
const source124 = registry.sources.find(row => row.id === 'SRC-NEUROMORPHO-8-6-124');
const delile = registry.sources.find(row => row.id === 'SRC-DELILE-2019');
const delileFine = delile.recordSets.find(row => row.recordSetId === 'RS-DELILE-FINE-SUBTYPES');
const profileEntries = entries.filter(row => new URL(row.href, 'http://localhost').searchParams.get('focusKind') === 'molecular_profile');

test('only 15 exact bundled owner-scoped record sets offer navigation; unavailable reasons remain source-owned', () => {
  assert.equal(registry.sources.length, 32);
  assert.equal(sets.length, 42);
  assert.equal(available.length, 15);
  assert.equal(entries.length, 274);
  assert.equal(sets.filter(row => row.recordSet.childRosterRef.status === 'bundled_exact').length, 13);
  assert.equal(sets.filter(row => row.recordSet.sourceObjectSetRef?.status === 'bundled_exact').length, 4);
  for (const { source, recordSet, navigation } of sets) {
    assert.deepEqual(navigation.includedRecordCount, recordSet.includedRecordCount);
    assert.equal(navigation.unitOfObservation, recordSet.unitOfObservation);
    assert.equal(navigation.sourceId, source.id);
    assert.equal(navigation.recordSetId, recordSet.recordSetId);
    assert.equal(navigation.newAdmissionCount, 0);
    assert.equal(navigation.crossSourceIdentityJoinCount, 0);
    assert.equal(navigation.registrationCount, 0);
    if (navigation.status === 'unavailable') {
      assert.deepEqual(navigation.entries, []);
      assert.equal(navigation.reason, recordSet.childRosterRef.missingReason);
    }
  }
});

test('foreign ownership, stale denominators and stale roster declarations cannot produce a link', () => {
  assert.throws(() => getSourceRecordSetNavigation(delile.id, source124.recordSets[0].recordSetId), /not owned/);
  assert.throws(() => getSourceRecordSetNavigation('missing-source', delile.recordSets[0].recordSetId), /unknown canonical/);
  const original = delile.recordSets[0];
  for (const field of ['count', 'path', 'field', 'status']) {
    const altered = structuredClone(original);
    if (field === 'count') altered.includedRecordCount.value += 1;
    if (field === 'path') altered.childRosterRef.path = source124.recordSets[0].childRosterRef.path;
    if (field === 'field') altered.childRosterRef.idField = 'inventedCellId';
    if (field === 'status') altered.childRosterRef.status = 'not_available';
    assert.throws(() => getSourceRecordSetNavigation(delile.id, original.recordSetId, altered), /declaration changed/);
  }
});

test('219 exact molecular profile destinations exist in the current index, retaining raw source labels and namespaces', async () => {
  const index = JSON.parse(await readFile(new URL('../public/data/research_explorer_index_v1/search-index.json', import.meta.url), 'utf8'));
  const molecular = new Map(index.records.filter(row => row.focusKind === 'molecular_profile').map(row => [row.focusId, row]));
  assert.equal(profileEntries.length, 219);
  for (const row of profileEntries) {
    const url = new URL(row.href, 'http://localhost');
    assert.equal(url.pathname, '/explore/cell-types');
    assert.equal(url.searchParams.get('focusId'), row.id);
    assert.equal(url.searchParams.get('type'), row.id);
    assert.ok(molecular.has(row.id), row.id);
    assert.equal(url.searchParams.get('fromSource'), row.sourceId);
    assert.equal(url.searchParams.get('fromRecordSet'), row.recordSetId);
  }
  const raw = profileEntries.find(row => row.id === 'delile-2019:E-MTAB-7320:dl1.1');
  assert.ok(raw);
  assert.equal(raw.label, 'dl1.1');
  assert.ok(!entries.some(row => row.id === 'delile-2019:E-MTAB-7320:dI1'));
});

test('40 exact NeuroMorpho destinations resolve baseline or Todd supplement IDs without expanding the frozen census', async () => {
  const index = JSON.parse(await readFile(new URL('../public/data/research_explorer_index_v1/search-index.json', import.meta.url), 'utf8'));
  const morphologyIds = new Set(index.records.filter(row => row.focusKind === 'morphology_record').map(row => row.focusId));
  for (const row of todd.routes) morphologyIds.add(row.sourceRecord.assetId);
  const destinations = entries.filter(row => new URL(row.href, 'http://localhost').searchParams.get('focusKind') === 'morphology_record');
  assert.equal(destinations.length, 40);
  for (const row of destinations) {
    const url = new URL(row.href, 'http://localhost');
    assert.ok(morphologyIds.has(row.id), row.id);
    assert.equal(url.pathname, '/workspace');
    assert.equal(url.searchParams.get('focusId'), row.id);
    assert.equal(url.searchParams.get('cellForm'), row.id.slice('NeuroMorpho:'.length));
    assert.equal(url.searchParams.get('observedForm'), '1');
    assert.equal(url.searchParams.get('view'), 'cell_detail');
    assert.equal(url.searchParams.get('panel'), 'structure');
  }
  const census = sets.find(row => row.recordSet.recordSetId === 'RS-NEUROMORPHO-RECONSTRUCTIONS').navigation;
  assert.equal(census.includedRecordCount.value, 142);
  assert.equal(census.entries.length, 1);
  assert.equal(new URL(census.entries[0].href, 'http://localhost').pathname, '/explore/morphology/viewer');
  assert.equal(new URL(census.entries[0].href, 'http://localhost').searchParams.get('morphologyView'), 'matrix');
});

test('10 source-object links resolve current exact release keys and retain object/parent identities', () => {
  const objectEntries = entries.filter(row => new URL(row.href, 'http://localhost').pathname === '/objects');
  assert.equal(objectEntries.length, 10);
  for (const row of objectEntries) {
    const url = new URL(row.href, 'http://localhost');
    const state = readIndependentSourceLocation(INDEPENDENT_OBJECT_VIEW_INDEX, row.href);
    assert.equal(state.error, null, row.href);
    assert.equal(state.key, url.searchParams.get('sourceObject'));
    assert.equal(state.sourceId, url.searchParams.get('objectSource'));
  }
  const banc = objectEntries.filter(row => row.sourceId === 'SRC-BANC-V888-IN14A018');
  assert.equal(banc.length, 1);
  assert.equal(new URL(banc[0].href, 'http://localhost').searchParams.get('sourceObject'), 'banc-v888/v888/neuron_root/720575941350424112');
  const microns = objectEntries.filter(row => row.sourceId === 'SRC-MICRONS-PHASE1-V185-4');
  assert.deepEqual(microns.map(row => new URL(row.href, 'http://localhost').searchParams.get('sourceObject')), ['microns-phase1/v185.4/cell_root/648518346349516051', 'microns-phase1/v185.4/nucleus/4309']);
  assert.equal(objectEntries.filter(row => row.sourceId === source124.id).length, 7);
});

test('GLUT labels and deposited nucleus assignments remain different units with no fabricated nucleus route', () => {
  const navigation = sets.find(row => row.recordSet.recordSetId === 'RS-CANOGOMEZ-GLUT-ACTIVE-IDENT-LABELS').navigation;
  assert.equal(navigation.includedRecordCount.value, 277);
  assert.equal(glut.denominators.nucleusCount, 92782);
  assert.equal(navigation.entries.length, 2);
  const aggregate = new URL(navigation.entries[0].href, 'http://localhost');
  assert.equal(aggregate.pathname, '/explore/cell-types');
  assert.equal(aggregate.searchParams.get('sourcePanel'), 'glut');
  assert.equal(aggregate.hash, '#cano-glut-source-labels');
  assert.equal(aggregate.searchParams.has('focusId'), false);
  assert.match(navigation.entries[0].label, /not nucleus rows/);
  assert.equal(navigation.entries[1].href, glut.artifact.publicUrl);
  assert.equal(navigation.entries[1].download, true);
  assert.match(navigation.entries[1].label, /92,782 deposited assignment rows/);
});

test('Ronzano links preserve two representations; coordinate-row totals never become independent cells', () => {
  const navigation = sets.find(row => row.recordSet.recordSetId === 'RS-RONZANO-PREMOTOR-POSITIONS').navigation;
  assert.equal(navigation.includedRecordCount.value, 31878);
  assert.equal(navigation.unitOfObservation, 'source_coordinate_row');
  assert.equal(navigation.includedRecordCount.unit, 'coordinate_rows_across_two_independent_representations');
  assert.deepEqual(navigation.entries.map(row => new URL(row.href, 'http://localhost').searchParams.get('positionFrame')), ['raw', 'normalized']);
  assert.match(navigation.entries[0].label, /14,484 rows/);
  assert.match(navigation.entries[1].label, /17,394 rows/);
  assert.ok(navigation.entries.every(row => !new URL(row.href, 'http://localhost').searchParams.has('positionRow')));
});

test('navigation receipts retain original rights and both declared refs without claiming fetched bytes or rendered views', () => {
  for (const { source, recordSet } of sets) {
    const receipt = sourceDrilldownReceipt(source.id, recordSet.recordSetId);
    assert.deepEqual(receipt.sourceCitation, source.citation);
    assert.deepEqual(receipt.rights, source.rights);
    assert.equal(receipt.renderedViewCaptured, false);
    assert.equal(receipt.sourceBytesVerifiedByThisReceipt, false);
    assert.equal(receipt.authority, 'declared_metadata_navigation_only');
    assert.equal(receipt.requestedSourcePage, `/sources?${new URLSearchParams({ source: source.id, recordSet: recordSet.recordSetId })}#${recordSet.recordSetId}`);
    assert.deepEqual(receipt.sourceObjectSetReference, recordSet.sourceObjectSetRef ?? null);
  }
  const original = sourceDrilldownReceipt(delile.id, delileFine.recordSetId);
  original.includedRecordCount.value = 0;
  original.reference.path = 'changed';
  assert.equal(sourceDrilldownReceipt(delile.id, delileFine.recordSetId).includedRecordCount.value, 51);
  assert.equal(sourceDrilldownReceipt(delile.id, delileFine.recordSetId).reference.path, delileFine.childRosterRef.path);
});

test('canonical sources and unambiguous legacy aliases restore; unknown/conflicting requests select no replacement', () => {
  assert.equal(readSourceRegistrySelection(new URLSearchParams()).sourceId, registry.sources[0].id);
  for (const source of registry.sources) {
    assert.deepEqual(readSourceRegistrySelection(new URLSearchParams({ source: source.id })), { sourceId: source.id, error: null });
    for (const alias of source.aliases) {
      if (registry.sources.filter(row => row.id === alias || row.aliases.includes(alias)).length === 1) assert.equal(readSourceRegistrySelection(new URLSearchParams({ source: alias })).sourceId, source.id);
    }
  }
  assert.equal(readSourceRegistrySelection(new URLSearchParams(`source=${source124.id}&source=${source124.id}`)).sourceId, source124.id);
  for (const query of ['source=missing', `source=${source124.id}&source=${delile.id}`, 'source=']) {
    const selection = readSourceRegistrySelection(new URLSearchParams(query));
    assert.equal(selection.sourceId, null);
    assert.match(selection.error, /No replacement source/);
  }
});

test('record-set bookmarks fail closed on foreign or conflicting ownership', () => {
  const id = delile.recordSets[0].recordSetId;
  assert.deepEqual(readSourceRegistryRecordSetSelection(new URLSearchParams({ recordSet: id }), delile.id), { recordSetId: id, error: null });
  for (const [query, source] of [[`recordSet=${id}`, source124.id], [`recordSet=${id}`, null], ['recordSet=missing', delile.id], [`recordSet=${id}&recordSet=missing`, delile.id]]) {
    const selection = readSourceRegistryRecordSetSelection(new URLSearchParams(query), source);
    assert.equal(selection.recordSetId, null);
    assert.match(selection.error, /No replacement record set/);
  }
});

test('source URL writes preserve unrelated duplicate queries and fragment and only mutate owned keys', () => {
  const href = '/sources?lang=zh&unknown=1&unknown=2&sourceQuery=old#retained';
  const written = new URL(writeSourceRegistryLocation(href, { source: delile.id, recordSet: delile.recordSets[0].recordSetId, sourceQuery: 'dl1' }), 'http://localhost');
  assert.equal(written.pathname, '/sources');
  assert.equal(written.hash, '#retained');
  assert.deepEqual(written.searchParams.getAll('unknown'), ['1', '2']);
  assert.equal(written.searchParams.get('lang'), 'zh');
  assert.equal(readSourceRegistrySelection(written.searchParams).sourceId, delile.id);
  assert.equal(readSourceRegistryRecordSetSelection(written.searchParams, delile.id).recordSetId, delile.recordSets[0].recordSetId);
  const clear = new URL(writeSourceRegistryLocation(written.href, { sourceQuery: '', recordSet: null, sourceLane: 'all' }), 'http://localhost');
  assert.equal(clear.searchParams.has('recordSet'), false);
  assert.equal(clear.searchParams.has('sourceQuery'), false);
  assert.deepEqual(clear.searchParams.getAll('unknown'), ['1', '2']);
  assert.throws(() => writeSourceRegistryLocation(href, { focusId: 'invented' }), /outside the source registry/);
});

test('record-set roving focus remains within exact visible page membership and never turns movement into activation', () => {
  const keys = profileEntries.filter(row => row.sourceId === 'SRC-ROOME-2026').map(row => row.id);
  const first = keys.slice(0, 12), second = keys.slice(12, 24);
  assert.equal(resolveSourceListRovingKey(first, { scope: 'first' }), first[0]);
  assert.equal(nextSourceListRovingKey(first, first[0], 'ArrowUp'), first.at(-1));
  assert.equal(nextSourceListRovingKey(first, first[0], 'End'), first.at(-1));
  assert.equal(nextSourceListRovingKey(first, first[2], 'Home'), first[0]);
  assert.equal(resolveSourceListRovingKey(second, { scope: 'second', focusedScope: 'first', focusedKey: first[5] }), second[0]);
  assert.equal(resolveSourceListRovingKey([], { scope: 'empty', focusedScope: 'first', focusedKey: first[5] }), null);
  for (const key of ['Enter', 'Tab', ' ', 'Escape']) assert.equal(nextSourceListRovingKey(first, first[0], key), null);
  for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey']) assert.equal(nextSourceListRovingKey(first, first[0], 'ArrowDown', { [modifier]: true }), null);
});


test('the current recipe pins every new source workflow module/test and both existing integration surfaces', () => {
  for (const path of ['app/ResearchSourceRegistry.tsx', 'app/SourceRecordSetNavigation.tsx', 'app/SourceRecordSetNavigation.module.css', 'app/research-source-drilldown.js', 'app/research-source-drilldown.d.ts', 'tests/research-source-drilldown.test.mjs', 'tests/research-source-drilldown-component.test.mjs', 'app/ResearchCollectionPage.tsx', 'app/InterneuronTypeAtlas.tsx']) assert.equal(CORE_INPUTS_291.filter(row => row === path).length, 1, path);
});
