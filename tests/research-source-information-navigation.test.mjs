import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import registry from '../data/research-source-registry-0.1.json' with { type: 'json' };
import { getSourceRecordSetInformation } from '../app/research-source-information-navigation.js';
import { getSourceRecordSetNavigation } from '../app/research-source-drilldown.js';

const sourceId = 'SRC-GARCIA-RAMIREZ-2022';
const setId = 'RS-GARCIA-RAMIREZ-ADULT-SPINAL-AGGREGATE-PHYSIOLOGY';
const source = registry.sources.find(row => row.id === sourceId);
const recordSet = source.recordSets.find(row => row.recordSetId === setId);
const helperText = readFileSync(new URL('../app/research-source-information-navigation.js', import.meta.url), 'utf8');

// Isolated current-metadata counterfactuals. This does not expose a product
// injection hook and never mutates the real imported registry or source bytes.
function againstCurrentMetadata(fixture) {
  const code = helperText.replace(/^import registry from '[^']+' with \{ type: 'json' \};\n/, '').replace('export function getSourceRecordSetInformation', 'function getSourceRecordSetInformation');
  assert.ok(!code.includes('import registry'));
  return vm.runInNewContext(`${code}\ngetSourceRecordSetInformation;`, { registry: fixture, structuredClone, URLSearchParams });
}
function counterfactual(change) {
  const fixture = structuredClone(registry);
  const fixtureSource = fixture.sources.find(row => row.id === sourceId);
  const fixtureSet = fixtureSource.recordSets.find(row => row.recordSetId === setId);
  change(fixture, fixtureSource, fixtureSet);
  return () => againstCurrentMetadata(fixture)(sourceId, setId);
}

test('one current source-owned information action stays separate from exact child navigation and all biological counts', () => {
  const results = registry.sources.flatMap(owner => owner.recordSets.map(set => getSourceRecordSetInformation(owner.id, set.recordSetId, set)));
  assert.equal(registry.sources.length, 32); assert.equal(results.length, 42);
  const available = results.filter(result => result.status === 'available');
  assert.equal(available.length, 1);
  const information = available[0];
  assert.equal(information.sourceId, sourceId); assert.equal(information.recordSetId, setId);
  assert.equal(information.includedRecordCount.value, 1);
  assert.equal(information.includedRecordCount.unit, 'study_aggregate_information_adapters');
  assert.equal(information.unitOfObservation, 'source_study_aggregate_information_adapter');
  assert.equal(information.authority, 'declared_source_information_navigation_only');
  assert.equal(information.sourceBytesVerifiedByThisAction, false); assert.equal(information.renderedViewCaptured, false);
  for (const key of ['newAdmissionCount', 'newPhysicalCellRosterRows', 'crossSourceIdentityJoinCount', 'registrationCount']) assert.equal(information[key], 0);
  assert.match(information.boundary, /Four alternative partitions share 171 recorded neuronal observations/);
  assert.match(information.boundary, /does not identify individual cells or animals/);
  assert.deepEqual(getSourceRecordSetNavigation(sourceId, setId).entries, []);
  const navigation = registry.sources.flatMap(owner => owner.recordSets.map(set => getSourceRecordSetNavigation(owner.id, set.recordSetId)));
  assert.equal(navigation.filter(row => row.status === 'available').length, 15);
  assert.equal(navigation.flatMap(row => row.entries).length, 274);
  assert.equal(registry.sources.flatMap(owner => owner.recordSets).filter(set => set.childRosterRef.status === 'bundled_exact').length, 13);
  assert.equal(registry.sources.flatMap(owner => owner.recordSets).filter(set => set.sourceObjectSetRef?.status === 'bundled_exact').length, 4);
});

test('the exact permitted information destination carries source/set context without selecting a biological record', () => {
  const information = getSourceRecordSetInformation(sourceId, setId, recordSet);
  const url = new URL(information.link.href, 'http://localhost');
  assert.equal(url.origin, 'http://localhost');
  assert.equal(url.pathname, '/explore/cell-types/additional');
  assert.equal(url.hash, '#garcia-ramirez-physiology-panel');
  assert.deepEqual([...url.searchParams], [['fromSource', sourceId], ['fromRecordSet', setId]]);
  assert.equal(information.link.adapterId, 'ohri-garcia-ramirez-adult-spinal-aggregate-physiology-0.1.0');
  assert.match(information.link.label, /published aggregate physiology tables/);
  assert.deepEqual(information.reference, recordSet.sourceInformationRef);
  assert.equal(Object.hasOwn(information, 'entries'), false);
  information.reference.path = 'tampered'; information.includedRecordCount.value = 999;
  assert.equal(getSourceRecordSetInformation(sourceId, setId).reference.path, recordSet.dataPath);
  assert.equal(recordSet.includedRecordCount.value, 1);
});

test('unreviewed, foreign, ambiguous or stale source declarations cannot produce an information action', () => {
  assert.throws(() => getSourceRecordSetInformation('missing-source', setId), /unknown or ambiguous/);
  assert.throws(() => getSourceRecordSetInformation('SRC-ROOME-2026', setId), /not owned/);
  const stale = structuredClone(recordSet); stale.sourceInformationRef.path = 'old-adapter.json';
  assert.throws(() => getSourceRecordSetInformation(sourceId, setId, stale), /declaration changed/);
  assert.throws(counterfactual(fixture => fixture.sources.push(structuredClone(source))), /ambiguous canonical/);
  assert.throws(counterfactual((fixture, owner, set) => owner.recordSets.push(structuredClone(set))), /ambiguous or not owned/);
  const fixture = structuredClone(registry), other = fixture.sources.find(row => row.id === 'SRC-ROOME-2026');
  other.recordSets[0].sourceInformationRef = structuredClone(recordSet.sourceInformationRef);
  assert.throws(() => againstCurrentMetadata(fixture)(other.id, other.recordSets[0].recordSetId), /no reviewed source-owned/);
  for (const owner of registry.sources) for (const set of owner.recordSets) if (!Object.hasOwn(set, 'sourceInformationRef')) {
    const information = getSourceRecordSetInformation(owner.id, set.recordSetId);
    assert.equal(information.status, 'unavailable'); assert.equal(information.link, null); assert.equal(information.reference, null);
  }
});

test('absolute, protocol-relative, script, encoded, query-bearing and wrong-fragment destinations fail closed', () => {
  const invalid = ['https://example.com/explore/cell-types/additional#garcia-ramirez-physiology-panel', '//example.com/path', 'javascript:alert(1)', 'data:text/html,test', '/%2f%2fexample.com', '/explore/cell-types/additional?focusId=invented#garcia-ramirez-physiology-panel', '/explore/cell-types/additional#another-panel', '/workspace', '\\explore\\cell-types\\additional', '/explore/cell-types/additional#garcia-ramirez-physiology-panel\n'];
  for (const href of invalid) assert.throws(counterfactual((fixture, owner, set) => { set.sourceInformationRef.href = href; }), /relative destination changed/, href);
  for (const [field, value] of [['status', 'bundled_exact'], ['path', 'other-data.json'], ['idField', 'cellId']]) {
    assert.throws(counterfactual((fixture, owner, set) => { set.sourceInformationRef[field] = value; }), /reference or permitted relative/);
  }
  assert.throws(counterfactual((fixture, owner, set) => { set.sourceInformationRef.download = true; }), /reference or permitted relative/);
});

test('current adapter/original asset identity, hashes, size, rights and bundled declarations are required', () => {
  for (const asset of source.assets) for (const kind of ['accession', 'path', 'kind', 'bytes', 'sha256', 'bundled', 'integrityStatus']) {
    assert.throws(counterfactual((fixture, owner) => {
      const row = owner.assets.find(value => value.id === asset.id);
      if (kind === 'bytes') row.integrity.bytes += 1;
      else if (kind === 'sha256') row.integrity.sha256 = '0'.repeat(64);
      else if (kind === 'integrityStatus') row.integrity.status = 'pending';
      else if (kind === 'bundled') row.bundled = false;
      else row[kind] = 'changed';
    }), /asset pin changed/, `${asset.id}:${kind}`);
  }
  assert.throws(counterfactual((fixture, owner) => { owner.assets.push(structuredClone(owner.assets[0])); }), /inventory changed/);
  for (const field of ['citation', 'rights', 'admission']) assert.throws(counterfactual((fixture, owner) => {
    if (field === 'citation') owner.citation.doi = '10.unknown/other';
    else owner[field].status = 'pending';
  }), /publication, admission or rights/);
});

test('source observation pool partitions, cell/animal units and lack of biological child authority cannot be promoted', () => {
  for (const change of [
    set => { set.includedRecordCount.value = 171; }, set => { set.includedRecordCount.unit = 'animals'; },
    set => { set.unitOfObservation = 'physical_cell'; }, set => { set.parentSourceId = 'SRC-ROOME-2026'; },
    set => { set.cellRosterAvailability = 'bundled_exact'; }, set => { set.canonicalIdentityStatus = 'same_cell'; },
    set => { set.childRosterRef.status = 'bundled_exact'; set.childRosterRef.path = set.dataPath; },
    set => { set.sourceObjectSetRef = { status: 'bundled_exact', path: set.dataPath }; },
    set => { set.alternativePartitions[0].groupCountSum = 684; }, set => { set.alternativePartitions[1].sourceRecordedPoolDenominatorId = 'different-pool'; },
    set => { set.alternativePartitions[2].groupCounts[0] += 1; }, set => { set.admissionBoundary.newMolecularProfiles = 1; },
    set => { set.admissionBoundary.physiologyGroupsAreMolecularCellTypes = true; }, set => { set.admissionBoundary.M4Admission = 1; },
  ]) assert.throws(counterfactual((fixture, owner, set) => change(set)));
  for (const change of [
    owner => { owner.experimentalUnits[0].unit = 'animals'; }, owner => { owner.experimentalUnits[0].count = 684; },
    owner => { owner.experimentalUnits[0].independentAnimalCount = 171; }, owner => { owner.experimentalUnits[0].cellToAnimalMapping = {}; },
    owner => { owner.experimentalUnits[3].isSubsetOfCurrentShox2Cohort = false; }, owner => { owner.experimentalUnits[4].parentDenominatorId = 'new-independent-pool'; },
  ]) assert.throws(counterfactual((fixture, owner) => change(owner)), /observations, animals|cell-to-animal|subset authority/);
});

test('information declarations match unchanged persisted adapter/source bytes and destination owns source validation', () => {
  const factsBytes = readFileSync(new URL(`../${recordSet.dataPath}`, import.meta.url));
  const facts = JSON.parse(factsBytes.toString('utf8'));
  const derivative = source.assets.find(asset => asset.path === recordSet.dataPath);
  assert.equal(factsBytes.length, 203887);
  assert.equal(createHash('sha256').update(factsBytes).digest('hex'), derivative.integrity.sha256);
  assert.equal(facts.adapterId, derivative.accession);
  assert.equal(facts.authority, 'source_reported_aggregate_statistics');
  assert.equal(facts.studyScope.recordedPool.value, 171);
  for (const pin of facts.source.inputPins) {
    const asset = source.assets.find(asset => asset.path.endsWith('/' + pin.fileName));
    const bytes = readFileSync(new URL(`../${asset.path}`, import.meta.url));
    assert.equal(bytes.length, pin.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), pin.sha256);
    assert.equal(asset.integrity.sha256, pin.sha256);
  }
  assert.deepEqual(facts.tables.map(table => table.groupCountSum), [171, 171, 171, 171]);
  assert.equal(facts.studyScope.recordedPool.independentAnimalCount, null);
  assert.equal(facts.studyScope.recordedPool.cellToAnimalMapping, null);
  assert.match(readFileSync(new URL('../app/AdditionalResearchEvidence.tsx', import.meta.url), 'utf8'), /id="garcia-ramirez-physiology-panel"/);
  assert.match(readFileSync(new URL('../app/garcia-ramirez-physiology.js', import.meta.url), 'utf8'), /validateGarciaRamirezPhysiology\(\);/);
  assert.equal((helperText.match(/^import /gm) ?? []).length, 1, 'no eager aggregate facts or original byte loading is introduced by the action');
});

// Actual React SSR using the same vinext Link alias as production. These tests
// do not establish browser hydration, native history/focus or download behavior.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/link') return nextResolve('vinext/shims/link', context);
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const url = new URL(specifier, context.parentURL);
      if (!existsSync(url)) for (const suffix of ['.tsx', '.ts', '.js']) if (existsSync(new URL(`${url}${suffix}`))) return nextResolve(`${specifier}${suffix}`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.tsx') || url.endsWith('.ts')) return { format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8').replace(/(from\s+["'][^"']+\.json["']);/g, '$1 with { type: "json" };'), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText, shortCircuit: true };
    if (url.endsWith('.module.css')) return { format: 'module', source: 'export default new Proxy({}, { get: (_, key) => String(key) })', shortCircuit: true };
    if (url.endsWith('.css')) return { format: 'module', source: 'export {}', shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { default: ResearchSourceRegistry } = await import('../app/ResearchSourceRegistry.tsx');
const render = initialParams => renderToStaticMarkup(createElement(ResearchSourceRegistry, { initialParams }));

test('the current source dossier visibly offers aggregate information beside unavailable exact-child navigation', () => {
  const html = render({ source: sourceId, recordSet: setId });
  assert.match(html, /data-source-id="SRC-GARCIA-RAMIREZ-2022"/);
  assert.match(html, /aria-label="Source aggregate information"/);
  assert.match(html, /Open published aggregate physiology tables/);
  assert.equal((html.match(/>Open published aggregate physiology tables<\/a>/g) ?? []).length, 1);
  assert.match(html, /href="\/explore\/cell-types\/additional\?fromSource=SRC-GARCIA-RAMIREZ-2022&amp;fromRecordSet=RS-GARCIA-RAMIREZ-ADULT-SPINAL-AGGREGATE-PHYSIOLOGY#garcia-ramirez-physiology-panel"/);
  assert.match(html, /do not establish an individual physical-cell/);
  assert.doesNotMatch(html, /data-record-set-navigation="RS-GARCIA-RAMIREZ-ADULT-SPINAL-AGGREGATE-PHYSIOLOGY"/);
  assert.match(html, /inert="" aria-busy="true"/);
  assert.match(html, /0 CROSS-SOURCE IDENTITIES/); assert.match(html, /0 REG/);
  const filtered = render({ source: sourceId, recordSet: setId, sourceQuery: 'definitely-no-match' });
  assert.match(filtered, /Selected source retained outside the current filters/);
  assert.match(filtered, /Open published aggregate physiology tables/);
});

test('invalid source, foreign/conflicting record-set states never leave a prior information action while unrelated sources retain their UI', () => {
  for (const params of [
    { source: 'missing-source' }, { source: [sourceId, 'SRC-ROOME-2026'] },
    { source: sourceId, recordSet: 'RS-ROOME-REFINED-DIL-TYPES' }, { source: sourceId, recordSet: [setId, 'RS-ROOME-REFINED-DIL-TYPES'] },
    { source: 'SRC-ROOME-2026', recordSet: setId },
  ]) assert.doesNotMatch(render(params), /Open published aggregate physiology tables|aria-label="Source aggregate information"/);
  const other = render({ source: 'SRC-DELILE-2019', recordSet: 'RS-DELILE-FINE-SUBTYPES' });
  assert.doesNotMatch(other, /Source aggregate information/);
  assert.match(other, /51 of 51 navigation entries match/);
  assert.match(other, /data-record-set-navigation="RS-DELILE-FINE-SUBTYPES"/);
});
