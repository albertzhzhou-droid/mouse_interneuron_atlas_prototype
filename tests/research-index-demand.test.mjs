import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as focusApi from '../app/research-explorer-index.js';
import * as activeApi from '../app/research-active-record.js';
import * as deltaApi from '../app/research-selection-delta.js';
import * as sciApi from '../app/matson-sci-timecourse.js';
import * as typeViewApi from '../app/type-profile-view-state.js';
import originalIndex from '../public/data/research_explorer_index_v1/search-index.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const jsx = require('react/jsx-runtime');
const recordA = originalIndex.records.find(r => r.focusKind === 'molecular_profile');
const recordB = originalIndex.records.find(r => r.focusKind === 'anatomy_label');
const focusOf = r => ({ focusKind: r.focusKind, focusId: r.focusId });
const index = { ...originalIndex, records: [recordA, recordB] };

// Runs the actual compiled hook and collection callbacks with controlled effect
// scheduling and deferred loader results. These test-local descriptors do not
// prove native navigation, private-byte hashing, browser timing or performance.
function hooks() {
  const slots = []; let cursor = 0; const pending = new Map();
  const react = {
    Component: class {}, createContext: () => ({ Provider: 'provider' }),
    useContext: () => null, lazy: () => 'lazy-component', Suspense: 'suspense',
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useMemo(callback) { cursor++; return callback(); },
    useEffect(callback, deps) {
      const i = cursor++; const old = slots[i];
      if (!old || deps.length !== old.deps.length || deps.some((v, n) => !Object.is(v, old.deps[n]))) pending.set(i, { callback, deps });
    },
  };
  return {
    react, begin() { cursor = 0; },
    effects() { for (const [i, next] of pending) { slots[i]?.cleanup?.(); slots[i] = { deps: next.deps }; slots[i].cleanup = next.callback(); } pending.clear(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); pending.clear(); },
  };
}
function compiled(name, react, imports, window = {}) {
  const path = new URL(`../app/${name}.tsx`, import.meta.url);
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(js, { module: compiledModule, exports: compiledModule.exports, URL, URLSearchParams, AbortController, DOMException, queueMicrotask, window,
    require(name) { if (name === 'react') return react; if (name === 'react/jsx-runtime') return jsx; if (name.endsWith('.css')) return {}; if (name in imports) return imports[name]; throw Error('Unexpected test import: ' + name); } }, { filename: path.pathname });
  return compiledModule.exports;
}
const drain = () => new Promise(resolve => setImmediate(resolve));
function provider() {
  const h = hooks(), requests = [], supplements = []; let focus = null, requested;
  const api = compiled('ResearchActiveRecordProvider', h.react, {
    './research-active-record.js': activeApi, './research-selection-delta.js': deltaApi,
    './research-explorer-index.js': { loadVerifiedResearchExplorerIndex({ signal }) { return new Promise((resolve, reject) => requests.push({ signal, resolve, reject })); } },
    './research-supplemental-morphology-records.js': {
      loadVerifiedSupplementalMorphologyResearchRecords() { return new Promise((resolve, reject) => supplements.push({ resolve, reject })); },
      resolveSupplementalMorphologyResearchRecord: async () => null,
    },
  });
  const render = () => { h.begin(); return api.useResearchActiveRecordLoader(focus, requested); };
  return { requests, supplements, render, h,
    beforeEffect(nextFocus, nextRequested) { focus = nextFocus; requested = nextRequested; return render(); },
    commit(nextFocus, nextRequested) { this.beforeEffect(nextFocus, nextRequested); h.effects(); return render(); },
    async ready(n = requests.length - 1, value = index) { requests[n].resolve(value); await drain(); supplements.at(-1)?.resolve([]); await drain(); return render(); },
  };
}

test('metadata opt-out performs no index or supplement request', () => {
  const p = provider(); const value = p.commit(null, false);
  assert.equal(value.indexState.status, 'idle'); assert.equal(value.activeRecord.status, 'idle');
  assert.equal(value.selectionDelta, null); assert.equal(p.requests.length, 0); assert.equal(p.supplements.length, 0);
});
test('legacy default loader and explicit index consumer preserve the verified collection flow', async () => {
  for (const requested of [undefined, true]) {
    const p = provider(); p.commit(null, requested); assert.equal(p.requests.length, 1);
    p.requests[0].resolve(index); await drain();
    assert.equal(p.render().indexState.status, 'verifying'); assert.equal(p.supplements.length, 1);
    p.supplements[0].resolve([]); await drain();
    assert.equal(p.render().indexState.status, 'ready'); assert.equal(p.render().indexState.records.length, index.records.length); assert.equal(p.render().indexState.records[0], recordA);
  }
});
test('an exact late focus forces verification even when the metadata route opts out', async () => {
  const p = provider(); p.commit(null, false); const pending = p.commit(focusOf(recordA), false);
  assert.equal(p.requests.length, 1); assert.equal(pending.activeRecord.record, null);
  const ready = await p.ready(); assert.equal(ready.activeRecord.record, recordA); assert.equal(ready.activeRecord.status, 'ready');
});
test('a metadata route transition hides an old ready index synchronously', async () => {
  const p = provider(); p.commit(focusOf(recordA), true); await p.ready();
  const before = p.beforeEffect(null, false);
  assert.equal(before.indexState.status, 'idle'); assert.equal(before.indexState.records.length, 0);
  assert.equal(before.activeRecord.record, null); assert.equal(before.selectionDelta, null);
  p.h.effects(); assert.equal(p.requests[0].signal.aborted, true);
});
test('cancelled index success cannot request supplements or revive a metadata dossier', async () => {
  const p = provider(); p.commit(focusOf(recordA), true); p.commit(null, false);
  assert.equal(p.requests[0].signal.aborted, true); p.requests[0].resolve(index); await drain();
  assert.equal(p.supplements.length, 0); assert.equal(p.render().indexState.status, 'idle'); assert.equal(p.render().activeRecord.record, null);
});
test('a late supplement response cannot publish after cancellation', async () => {
  const p = provider(); p.commit(focusOf(recordA), true); p.requests[0].resolve(index); await drain();
  assert.equal(p.supplements.length, 1); p.commit(null, false); p.supplements[0].resolve([]); await drain();
  assert.equal(p.render().indexState.status, 'idle'); assert.equal(p.render().activeRecord.record, null);
});
test('A to B to A ignores previous responses and publishes only the current exact record', async () => {
  const p = provider(); p.commit(focusOf(recordA), false); p.commit(focusOf(recordB), false); p.commit(focusOf(recordA), false);
  assert.equal(p.requests.length, 3); assert.equal(p.requests[0].signal.aborted, true); assert.equal(p.requests[1].signal.aborted, true);
  p.requests[1].resolve(index); p.requests[0].resolve(index); await drain();
  assert.equal(p.supplements.length, 0); assert.equal(p.render().activeRecord.record, null);
  const value = await p.ready(2); assert.equal(value.activeRecord.record, recordA);
});
test('unknown exact focus and byte-loader failure publish no selected record', async () => {
  const p = provider(); p.commit({ ...focusOf(recordA), focusId: 'test:unknown' }, false);
  const missing = await p.ready(); assert.equal(missing.activeRecord.status, 'unavailable'); assert.equal(missing.activeRecord.record, null);
  const q = provider(); q.commit(focusOf(recordA), false); q.requests[0].reject(Error('test checksum refusal')); await drain();
  assert.equal(q.render().indexState.status, 'unavailable'); assert.equal(q.render().activeRecord.record, null);
});
test('duplicate supplemental keys still refuse the combined collection', async () => {
  const p = provider(); p.commit(focusOf(recordA), false); p.requests[0].resolve(index); await drain(); p.supplements[0].resolve([recordA]); await drain();
  assert.equal(p.render().indexState.status, 'unavailable'); assert.equal(p.render().activeRecord.record, null);
  assert.match(p.render().indexState.error, /duplicate record keys/);
});
test('unmount aborts the active request and a later rejection cannot expose a record', async () => {
  const p = provider(); p.commit(focusOf(recordA), false); p.h.unmount();
  assert.equal(p.requests[0].signal.aborted, true); p.requests[0].reject(new DOMException('test cancelled', 'AbortError')); await drain();
  assert.equal(p.render().activeRecord.record, null);
});

function collection(pageId, initialParams = {}) {
  const h = hooks(), calls = [], listeners = new Map();
  const window = { location: { search: new URLSearchParams(initialParams).toString(), href: 'http://test.local/' },
    addEventListener(name, callback) { listeners.set(name, callback); }, removeEventListener(name) { listeners.delete(name); } };
  const exports = compiled('ResearchCollectionPage', h.react, {
    'next/link': () => null, './research-explorer-index.js': focusApi, './matson-sci-timecourse.js': sciApi, './type-profile-view-state.js': typeViewApi,
    './ResearchActiveRecordProvider': { ResearchActiveRecordProvider: 'provider', useResearchActiveRecordLoader(focus, requested) { calls.push({ focus, requested }); return { indexState: { status: 'idle', records: [] } }; } },
  }, window);
  const render = () => { h.begin(); return exports.default({ pageId, initialParams }); };
  render(); h.effects();
  return { calls, async history(params) { window.location.search = new URLSearchParams(params).toString(); listeners.get('popstate')(); render(); h.effects(); await drain(); } };
}
test('only the two audited metadata pages opt out; every other collection keeps its original loader', () => {
  for (const page of ['sources', 'additional-types']) assert.equal(collection(page).calls[0].requested, false);
  for (const page of ['morphology', 'morphology-viewer', 'cell-types', 'zebrafish', 'type-compare', 'anatomy', 'positions', 'explorer', 'overview', 'sci', 'coverage']) assert.equal(collection(page).calls[0].requested, true, page);
});
test('canonical and all legacy request fields demand verification, including malformed or empty requests', () => {
  for (const page of ['sources', 'additional-types']) for (const field of ['focusKind', 'focusId', 'type', 'morphologyNeuron', 'anatomyStructure', 'coverageLane', 'cell']) for (const value of ['', 'test:unknown']) {
    assert.equal(collection(page, { [field]: value }).calls[0].requested, true, `${page}:${field}:${value}`);
  }
});
test('Back and Forward demand follows the live address, including an unresolved anatomy alias', async () => {
  const c = collection('sources'); assert.equal(c.calls.at(-1).requested, false);
  await c.history({ anatomyStructure: '8' }); assert.equal(c.calls.at(-1).requested, true); assert.equal(c.calls.at(-1).focus, null);
  await c.history({ focusKind: recordA.focusKind, focusId: recordA.focusId }); assert.equal(c.calls.at(-1).focus.focusId, recordA.focusId);
  await c.history({}); assert.equal(c.calls.at(-1).requested, false); assert.equal(c.calls.at(-1).focus, null);
});
