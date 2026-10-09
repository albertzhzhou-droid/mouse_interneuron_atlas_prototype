import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import {
  filterSourceAuditSamples, makeSourceAuditExport, readSourceAuditSampleBookmark,
  sourceAuditNucleusGate, sourceAuditSampleHref, sourceAuditSampleKey, writeSourceAuditSampleBookmark,
} from '../app/exact-source-audit-workbench.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const audit = JSON.parse(read('data/trevisan-v1-exact-input-crosswalk-audit-0.1.json'));
const initialBytes = JSON.stringify(audit);
const defaultState = { query: '', cohort: 'all', selectedKey: null };
const selectedState = (sample, overrides = {}) => ({ ...defaultState, selectedKey: sourceAuditSampleKey(sample), ...overrides });
const paramsFor = (state) => writeSourceAuditSampleBookmark(new URLSearchParams(), state, audit);
const selectedRecord = (result) => audit.samples.find((sample) => sourceAuditSampleKey(sample) === result.selectedKey) ?? null;

// Compile the real component code in memory. SSR uses actual React. The clearly
// labeled lifecycle descriptor below replaces hooks/window only; no actual
// browser, download, assistive-technology or rendered source-view claim follows.
function loadComponent(relative, hooks = React, browserWindow) {
  const compiledModule = { exports: {} };
  const output = ts.transpileModule(read(relative), { fileName: relative,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const localRequire = (name) => {
    if (name === 'react') return hooks;
    if (name.endsWith('.css')) return {};
    if (name === './exact-source-audit-workbench.js') return require('../app/exact-source-audit-workbench.js');
    if (name.startsWith('../data/')) return require(path.join(root, 'app', name));
    return require(name);
  };
  vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, require: localRequire,
    window: browserWindow, URL, URLSearchParams }, { filename: relative });
  return compiledModule.exports.default;
}
const nodes = (tree) => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes)
  : [tree, ...nodes(tree.props?.children)];
const text = (tree) => tree == null || typeof tree === 'boolean' ? '' : typeof tree !== 'object' ? String(tree)
  : Array.isArray(tree) ? tree.map(text).join('') : text(tree.props?.children);

function lifecycleDescriptor(initialHref) {
  let currentUrl = new URL(initialHref); const historyEntries = []; const listeners = new Map();
  const browserWindow = {
    location: { get href() { return currentUrl.href; }, get search() { return currentUrl.search; } },
    history: { state: { preservedRouterState: 1 }, pushState(state, title, href) {
      assert.deepEqual(state, { preservedRouterState: 1 }); assert.equal(title, '');
      currentUrl = new URL(href); historyEntries.push(currentUrl.href);
    } },
    addEventListener(event, callback) { const set = listeners.get(event) ?? new Set(); set.add(callback); listeners.set(event, set); },
    removeEventListener(event, callback) { listeners.get(event)?.delete(callback); },
  };
  const slots = []; let cursor = 0; let tree; const effects = []; const cleanups = [];
  const hooks = { ...React,
    useState(initial) {
      const slot = cursor++; if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial;
      return [slots[slot], (value) => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
    },
    useEffect(effect, deps) {
      const slot = cursor++;
      if (!(slot in slots)) { slots[slot] = deps; effects.push(effect); }
    },
  };
  const Component = loadComponent('app/ExactSourceAuditWorkbench.tsx', hooks, browserWindow);
  const render = () => { cursor = 0; tree = Component(); return tree; };
  render();
  const find = (predicate) => nodes(tree).find(predicate);
  return {
    get tree() { return tree; }, get href() { return currentUrl.href; }, historyEntries,
    get listenerCount() { return [...listeners.values()].reduce((count, set) => count + set.size, 0); },
    restoreMount() { for (const effect of effects.splice(0)) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } render(); },
    selected: () => nodes(tree).filter((node) => node.type === 'button' && node.props.className === 'esa-record-button' && node.props['aria-pressed']).map(text),
    select(sample) { find((node) => node.type === 'button' && node.props.className === 'esa-record-button' && text(node).includes(sample.geoSampleAccession)).props.onClick(); render(); },
    query(value) { find((node) => node.type === 'input' && node.props.placeholder === 'P56, Whole cord, E13.5…').props.onChange({ target: { value } }); render(); },
    cohort(value) { find((node) => node.type === 'select' && nodes(node).some((child) => child.type === 'option' && child.props.value === 'embryonic')).props.onChange({ target: { value } }); render(); },
    reset() { find((node) => node.type === 'button' && text(node) === 'Reset sample filters').props.onClick(); render(); },
    backOrForward(href) { currentUrl = new URL(href); for (const callback of listeners.get('popstate') ?? []) callback(); render(); },
    dispose() { cleanups.forEach((cleanup) => cleanup()); },
  };
}

test('all 29 exact sample bookmarks round-trip source key/audit date without adding cluster or animal identity', () => {
  assert.equal(audit.samples.length, 29); assert.equal(audit.summary.sampleCharacteristicsChecked, 29);
  for (const sample of audit.samples) {
    const href = new URL(sourceAuditSampleHref(audit, sample), 'https://atlas.example');
    assert.equal(href.pathname, '/source-audits'); assert.equal(href.hash, '#source-exact-inputs');
    const restored = readSourceAuditSampleBookmark(href.searchParams, audit);
    assert.equal(restored.status, 'ready'); assert.equal(restored.error, null);
    assert.strictEqual(selectedRecord(restored), sample);
    assert.equal(href.searchParams.get('sampleAudit'), audit.auditId);
    assert.equal(href.searchParams.get('sampleAuditDate'), audit.auditDate);
    assert.equal(sample.clusterAssignment, null); assert.equal(sample.individualAnimalIdentity, null);
    assert.equal(sourceAuditNucleusGate(sample, audit.rights).admitted, false);
  }
  assert.equal(JSON.stringify(audit), initialBytes);
});

test('sample search/cohort state retains exact original age, region and condition units', () => {
  for (const [cohort, expected] of [['all',29],['atlas',24],['en1',4],['embryonic',1]]) {
    const visible = filterSourceAuditSamples(audit.samples, '', cohort); assert.equal(visible.length, expected);
    for (const sample of visible) {
      const result = readSourceAuditSampleBookmark(paramsFor(selectedState(sample, { query: sample.geoSampleAccession, cohort })), audit);
      assert.equal(result.status, 'ready'); assert.strictEqual(selectedRecord(result), sample);
    }
  }
  const embryo = audit.samples.at(-1);
  const result = readSourceAuditSampleBookmark(paramsFor(selectedState(embryo, { query: '  E13.5 Whole cord ', cohort: 'embryonic' })), audit);
  assert.equal(result.query, '  E13.5 Whole cord '); assert.equal(selectedRecord(result).age.sourceText, 'E13.5');
  assert.equal(selectedRecord(result).age.convertedToPostnatalAge, false);
  assert.equal(selectedRecord(result).characteristics.region.value, 'Whole cord');
  assert.equal(selectedRecord(result).characteristics.replicate.value, '1');
});

test('foreign, stale, duplicate, partial and filter-invalid source links never select a replacement sample', () => {
  const first = audit.samples[0]; const good = paramsFor(selectedState(first));
  for (const mutate of [
    (p) => p.set('sampleAudit','another-source'), (p) => p.set('sampleAuditDate','2026-09-30'),
    (p) => p.delete('sampleAudit'), (p) => p.delete('sampleAuditDate'),
    (p) => p.set('sampleKey',first.geoSampleAccession), (p) => p.set('sampleKey','trevisan-v1:GSE999999:GSM8480577:source-sample'),
    (p) => p.set('sampleKey','trevisan-v1:GSE275595:GSM999999999:source-sample'),
    (p) => p.set('sampleKey',sourceAuditSampleKey(first).toUpperCase()),
    (p) => p.set('sampleCohort','pretend'), (p) => p.set('sampleQuery','x'.repeat(181)),
    (p) => p.append('sampleKey',sourceAuditSampleKey(first)),
    (p) => p.append('sampleAudit',audit.auditId), (p) => { p.set('sampleCohort','all'); p.append('sampleCohort','all'); },
    (p) => p.set('sampleCohort','embryonic'), (p) => p.set('sampleQuery','does-not-match-any-source'),
  ]) {
    const bad = new URLSearchParams(good); mutate(bad);
    const result = readSourceAuditSampleBookmark(bad, audit);
    assert.equal(result.status, 'invalid'); assert.equal(result.selectedKey, null); assert.ok(result.error);
  }
  const changedAudit = { ...audit, auditDate: '2026-09-30' };
  assert.equal(readSourceAuditSampleBookmark(good, changedAudit).status, 'invalid');
  assert.throws(() => writeSourceAuditSampleBookmark(new URLSearchParams(), selectedState(first, { cohort:'embryonic' }), audit), /outside/);
  assert.throws(() => sourceAuditSampleHref(audit, { geoSampleAccession:'GSM999999999' }), /Invalid exact/);
  assert.throws(() => readSourceAuditSampleBookmark(good, {...audit,samples:[first,first]}), /Duplicate exact/);
});

test('default/reset owns only sample parameters and preserves unrelated duplicate query state and current fragment', () => {
  const url = new URL('https://atlas.example/source-audits?unrelated=one&unrelated=two&focusId=original#source-exact-inputs');
  const originalParams = url.searchParams.toString();
  const next = writeSourceAuditSampleBookmark(url.searchParams, selectedState(audit.samples[0]), audit);
  assert.equal(url.searchParams.toString(), originalParams);
  assert.deepEqual(next.getAll('unrelated'), ['one','two']); assert.equal(next.get('focusId'),'original');
  const reset = writeSourceAuditSampleBookmark(next, defaultState, audit);
  assert.equal(reset.toString(), originalParams); assert.equal(url.hash,'#source-exact-inputs');
  assert.equal(readSourceAuditSampleBookmark(reset,audit).status,'default');
  assert.equal(readSourceAuditSampleBookmark(reset,audit).selectedKey,null);
});

test('selected factual sample export preserves every original field/locator and all held scientific gates', () => {
  const embryo = audit.samples.at(-1);
  const selected = selectedRecord(readSourceAuditSampleBookmark(paramsFor(selectedState(embryo)),audit));
  const payload = makeSourceAuditExport({ kind:'sample_characteristics',audit,records:[selected],
    filter:{query:'',cohort:'all',selectedSourceKey:sourceAuditSampleKey(selected)},generatedAt:'test'});
  assert.equal(payload.rowCount,1); assert.equal(payload.sourceAuditDate,audit.auditDate);
  assert.deepEqual(payload.records[0],{sourceKey:sourceAuditSampleKey(embryo),...embryo});
  assert.equal(payload.runtimeRosterAdmission,false); assert.equal(payload.sourcePayloadsIncluded,false);
  assert.equal(payload.sameCellJoins,0); assert.equal(payload.geometryObjects,0); assert.equal(payload.atlasRegistrations,0);
  assert.equal(payload.records[0].age.sourceText,'E13.5'); assert.equal(payload.records[0].clusterAssignment,null);
  assert.equal(payload.records[0].characteristics.age.locator,'GSM8480605/!Sample_characteristics_ch1:age');
  assert.equal(JSON.stringify(audit), initialBytes);
});

test('actual React SSR shows current input checks and qualified source links while preserving 14 article clusters', () => {
  const Component = loadComponent('app/TrevisanV1AgeAtlas.tsx');
  const html = renderToStaticMarkup(React.createElement(Component));
  assert.match(html,/All 29 GEO sample characteristics have been checked/);
  assert.match(html,/13,241,486 sparse entries/); assert.match(html,/104,240 final-workbook rows/);
  assert.doesNotMatch(html,/No matrix payload was downloaded or checksummed for this audit/);
  assert.doesNotMatch(html,/Three representative regular records and all five exceptions were inspected/);
  assert.match(html,/Earlier source-availability audit/); assert.match(html,/E13\.5 remains embryonic/);
  assert.match(html,/No cell form or internal detail admitted/); assert.match(html,/existing 387-profile total/);
  assert.equal((html.match(/Inspect this exact checked sample/g) ?? []).length,5);
  assert.equal((html.match(/<button/g) ?? []).length,14);
  for (const gsm of ['GSM8480577','GSM8480601','GSM8480602','GSM8480603','GSM8480604','GSM8480605']) {
    assert.ok(html.includes(encodeURIComponent(`trevisan-v1:GSE275595:${gsm}:source-sample`)));
  }
});

test('actual React SSR does not export or select a default sample before client bookmark restoration', () => {
  const Component = loadComponent('app/ExactSourceAuditWorkbench.tsx');
  const html = renderToStaticMarkup(React.createElement(Component));
  assert.match(html,/Reopening restores the sample and filters saved in the current URL/);
  assert.match(html,/Restoring the exact source-sample link/); assert.match(html,/aria-busy="true"/);
  assert.equal((html.match(/class="esa-record-button"/g) ?? []).length,29);
  assert.doesNotMatch(html,/aria-pressed="true"/); assert.doesNotMatch(html,/Export selected sample JSON/);
  assert.match(html,/disabled=""[^>]*class="esa-record-button"/);
});

test('descriptor lifecycle replays exact selection/filter/Back and clears removed or invalid selection without touching other state', () => {
  const embryo = audit.samples.at(-1);
  const canonical = new URL(sourceAuditSampleHref(audit,embryo),'https://atlas.example'); canonical.searchParams.append('unrelated','original');
  const replay = lifecycleDescriptor(canonical.href);
  assert.deepEqual(replay.selected(),[]); replay.restoreMount();
  assert.equal(replay.selected().length,1); assert.ok(replay.selected()[0].includes('GSM8480605'));
  assert.equal(replay.historyEntries.length,0); assert.equal(replay.listenerCount,1);
  replay.cohort('atlas'); assert.deepEqual(replay.selected(),[]);
  assert.equal(new URL(replay.href).searchParams.has('sampleKey'),false);
  assert.equal(new URL(replay.href).searchParams.get('unrelated'),'original');
  assert.equal(new URL(replay.href).hash,'#source-exact-inputs');
  const filteredHref = replay.href;
  replay.backOrForward(canonical.href); assert.ok(replay.selected()[0].includes('GSM8480605'));
  replay.backOrForward(filteredHref); assert.deepEqual(replay.selected(),[]);
  replay.select(audit.samples[0]); assert.ok(replay.selected()[0].includes('GSM8480577'));
  replay.query('does-not-match-any-source'); assert.deepEqual(replay.selected(),[]);
  assert.ok(text(replay.tree).includes('No source sample matches this search'));
  const bad = new URL(canonical); bad.searchParams.set('sampleKey','foreign:key');
  replay.backOrForward(bad.href); assert.deepEqual(replay.selected(),[]);
  assert.ok(nodes(replay.tree).some((node) => node.props?.role === 'alert'));
  replay.reset(); assert.deepEqual(replay.selected(),[]);
  assert.equal(new URL(replay.href).searchParams.toString(),'unrelated=original');
  replay.select(embryo); const reopenHref = replay.href;
  replay.dispose(); assert.equal(replay.listenerCount,0);
  const reopened = lifecycleDescriptor(reopenHref);
  assert.deepEqual(reopened.selected(),[]); reopened.restoreMount();
  assert.ok(reopened.selected()[0].includes('GSM8480605'));
  assert.equal(reopened.historyEntries.length,0); reopened.dispose(); assert.equal(reopened.listenerCount,0);
  assert.equal(JSON.stringify(audit),initialBytes);
});
