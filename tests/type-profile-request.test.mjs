import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const url = new URL(specifier, context.parentURL);
      if (!existsSync(url)) for (const suffix of ['.ts', '.tsx', '.js']) {
        if (existsSync(new URL(`${url}${suffix}`))) return next(`${specifier}${suffix}`, context);
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts') || url.endsWith('.tsx')) return {
      format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8')
        .replace(/(from\s+["'][^"']+\.json["']);/g, '$1 with { type: "json" };'),
        { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText,
      shortCircuit: true,
    };
    return next(url, context);
  },
});
const atlas = await import('../app/atlas-types.ts');
const russ = await import('../app/russ-spinal-information-adapter.js');
const focusApi = await import('../app/research-explorer-index.js');
const sciApi = await import('../app/matson-sci-timecourse.js');
const viewApi = await import('../app/type-profile-view-state.js');
const require = createRequire(import.meta.url);
const jsx = require('react/jsx-runtime');
const textOf = node => Array.isArray(node) ? node.map(textOf).join('') : node == null || typeof node === 'boolean' ? '' : typeof node === 'object' ? textOf(node.props?.children) : String(node);
function nodes(tree, predicate) {
  const result = [];
  const walk = node => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node?.props) return;
    if (predicate(node)) result.push(node);
    walk(node.props.children);
  };
  walk(tree); return result;
}

// Executes the actual compiled component, real profile adapters and callbacks.
// Child widgets are descriptors. This does not prove browser history, focus,
// native downloads or the private source-roster verification path.
function harness(initialProps = {}, params = {}) {
  const slots = [], pending = new Map(), listeners = new Map(), notices = [], focusChanges = [], history = [];
  let cursor = 0, tree, blob, props = { onNotice: s => notices.push(s), onSelectedFocusChange: s => focusChanges.push(s), ...initialProps };
  const react = {
    lazy: () => 'lazy-child', Suspense: 'suspense',
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useMemo(callback) { cursor++; return callback(); },
    useEffect(callback, deps) { const i = cursor++; const old = slots[i]; if (!old || deps.some((d, n) => !Object.is(d, old.deps[n]))) pending.set(i, { callback, deps }); },
  };
  const document = { body: { appendChild() {} }, createElement: () => ({ click() {}, remove() {} }) };
  const locationParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) for (const item of Array.isArray(value) ? value : [value]) locationParams.append(key, item);
  const location = new URL('http://test.local/explore/cell-types?' + locationParams.toString());
  const historyEntries = [location.href]; let historyPosition = 0;
  const publish = (url, push) => {
    const next = new URL(url, location.href); location.href = next.href; history.push(url);
    if (push) { historyEntries.splice(historyPosition + 1); historyEntries.push(next.href); historyPosition++; }
    else historyEntries[historyPosition] = next.href;
  };
  const window = {
    document, location,
    addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name) { listeners.delete(name); },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setTimeout: fn => fn(),
    history: { state: null, replaceState(_state, _unused, url) { publish(url, false); }, pushState(_state, _unused, url) { publish(url, true); } },
  };
  class CaptureURL extends URL { static createObjectURL(value) { blob = value; return 'blob:test-profile'; } static revokeObjectURL() {} }
  const path = new URL('../app/InterneuronTypeAtlas.tsx', import.meta.url);
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} };
  let localDelta;
  const context = vm.createContext({ module: compiledModule, exports: compiledModule.exports,
    window, document, URL: CaptureURL, URLSearchParams, Blob, Set, Map,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return jsx;
      if (name === './atlas-types') return atlas;
      if (name === './source-record-delta.js') return localDelta;
      if (name === './russ-spinal-information-adapter.js') return russ;
      if (name === './type-profile-view-state.js') return viewApi;
      if (name.endsWith('.json')) return JSON.parse(readFileSync(new URL(name, path), 'utf8'));
      if (['./CanoGomezGlutLabelBrowser', './ResearchRecordEvidenceFingerprint', './Pkd2l1IndependentPopulationContext', './SourceRecordDeltaInspector', './TrevisanV1AgeAtlas', './RussSpinalInformationPanel'].includes(name)) return () => null;
      throw Error('Unexpected component dependency: ' + name);
    } });
  // Compile the actual strict plain-object delta helper in the same realm as
  // the component. Its production guards are unchanged.
  const deltaModule = { exports: {} };
  context.module = deltaModule; context.exports = deltaModule.exports;
  const deltaScript = ts.transpileModule(readFileSync(new URL('../app/source-record-delta.js', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInContext(deltaScript, context); localDelta = deltaModule.exports;
  context.module = compiledModule; context.exports = compiledModule.exports;
  vm.runInContext(js, context, { filename: path.pathname });
  function render() { cursor = 0; tree = compiledModule.exports.default(props); return tree; }
  function effects() { for (const [i, n] of pending) { slots[i]?.cleanup?.(); slots[i] = { deps: n.deps }; slots[i].cleanup = n.callback(); } pending.clear(); }
  function options() { return nodes(tree, n => n.type === 'button' && n.props.role === 'option'); }
  function dossier() { return nodes(tree, n => n.type === 'article' && String(n.props['aria-label']).startsWith('Source-record dossier for ')); }
  function exportButton() { return nodes(tree, n => n.type === 'button' && textOf(n) === 'Export dossier')[0]; }
  function unavailable() { return nodes(tree, n => n.type === 'article' && n.props['aria-label'] === 'Unavailable source-profile request'); }
  return { render, effects, options, dossier, unavailable, notices, focusChanges, history,
    location: () => new URL(location.href),
    readingFragment(hash) { location.hash = hash; historyEntries[historyPosition] = location.href; },
    travel(delta) { effects(); const next = historyPosition + delta; assert.ok(next >= 0 && next < historyEntries.length); historyPosition = next; location.href = historyEntries[next]; listeners.get("popstate")?.(); return render(); },
    controls() { return { query: nodes(tree, n => n.type === "input")[0].props.value, filters: nodes(tree, n => n.type === "select").map(n => n.props.value) }; },
    clickButton(label) { const b = nodes(tree, n => n.type === "button" && textOf(n) === label)[0]; assert.ok(b && !b.props.disabled); b.props.onClick(); return render(); },
    update(next) { props = { ...props, ...next }; return render(); },
    query(value) { nodes(tree, n => n.type === 'input')[0].props.onChange({ target: { value } }); return render(); },
    filter(index, value) { nodes(tree, n => n.type === 'select')[index].props.onChange({ target: { value } }); return render(); },
    clickOption(label) { const o = options().find(n => textOf(n).includes(label)); assert.ok(o); o.props.onClick(); return render(); },
    async export() { blob = null; const b = exportButton(); assert.ok(b && !b.props.disabled && typeof b.props.onClick === 'function', 'No valid selected-profile export'); b.props.onClick(); assert.ok(blob); return JSON.parse(await blob.text()); },
    exportButton, text() { return textOf(tree); },
  };
}
function assertUnavailable(h) {
  assert.equal(h.dossier().length, 0); assert.equal(h.unavailable().length, 1);
  assert.equal(h.options().filter(n => n.props['aria-selected']).length, 0);
  assert.equal(h.exportButton().props.disabled, true); assert.equal(h.exportButton().props.onClick, undefined);
  assert.equal(nodes(h.render(), n => n.props?.['aria-label'] === 'Selected source profile').length, 0);
}

test('an absent request keeps the original DE-1 default and all 387 independent source profiles', async () => {
  const h = harness(); h.render(); assert.equal(h.options().length, 387);
  assert.equal(h.dossier()[0].props['aria-label'], 'Source-record dossier for DE-1');
  const receipt = await h.export(); assert.equal(receipt.selected.id, 'sathyamurthy-2018:DE-1');
  assert.equal(receipt.exactCrossStudyIdentityCount, 0);
  assert.equal(receipt.projectRegistrationCount, 0);
});
test('unknown, empty, foreign and stale explicit profile requests have no substituted dossier or export', async () => {
  for (const id of ['unavailable-source:explicit-invalid-profile', '', 'NeuroMorpho:1', 'sathyamurthy-2018:DE-1:old-version']) {
    const h = harness({ initialSelected: id }); h.render(); assertUnavailable(h);
    assert.equal(h.options().length, 387); await assert.rejects(h.export(), /No valid selected-profile export/);
  }
});
test('an explicit empty legacy URL type remains an empty request', () => {
  const h = harness({}, { type: '' }); h.render(); assertUnavailable(h); assert.match(h.text(), /\(empty ID\)/);
});
test('source-local IDs are not case-folded, trimmed or prefix-matched', () => {
  for (const id of [' sathyamurthy-2018:DE-1', 'SATHYAMURTHY-2018:DE-1', 'sathyamurthy-2018:DE']) {
    const h = harness({ initialSelected: id }); h.render(); assertUnavailable(h);
  }
});
test('an invalid controlled focus immediately clears the prior valid dossier and export', async () => {
  const h = harness({ selectedFocusId: 'sathyamurthy-2018:DE-1' }); h.render(); h.effects();
  await h.export(); h.update({ selectedFocusId: 'unavailable-source:explicit-invalid-profile' });
  assertUnavailable(h); h.effects(); assert.equal(h.history.length, 0, 'invalid requests do not fabricate a baseline transition');
  h.update({ selectedFocusId: '' }); assertUnavailable(h); await assert.rejects(h.export());
});
test('filtering an invalid request never selects a visible row; explicit activation recovers exact DE-2', async () => {
  const h = harness({ initialSelected: 'missing-id' }); h.render();
  h.query('no-such-record-request-test'); assertUnavailable(h); assert.equal(h.options().length, 0);
  h.query(''); h.filter(0, 'sathyamurthy-2018'); assertUnavailable(h);
  h.clickOption('DE-2'); assert.equal(h.dossier()[0].props['aria-label'], 'Source-record dossier for DE-2');
  assert.deepEqual(h.focusChanges, ['sathyamurthy-2018:DE-2']);
  const receipt = await h.export(); assert.equal(receipt.selected.id, 'sathyamurthy-2018:DE-2');
  assert.equal(receipt.selected.samplingCount, 80);
});
test('a valid selected profile and its complete export remain exact outside query and source filters', async () => {
  const h = harness({ initialSelected: 'sathyamurthy-2018:DE-2' }); h.render(); const before = await h.export();
  h.query('no-such-record-request-test'); assert.equal(h.options().length, 0);
  assert.equal(h.dossier()[0].props['aria-label'], 'Source-record dossier for DE-2');
  h.filter(0, 'russ-2021'); const after = await h.export();
  delete before.exportedAt; delete after.exportedAt; assert.deepEqual(after, before);
});

// Exercise the real outer route and its child props, including repeated RSC
// query values and recovery through the route's actual selection callback.
function collectionHarness(initialParams, verifiedRecords = null) {
  const slots = [], effects = [], microtasks = [], history = []; let cursor = 0, requestedFocus;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(initialParams)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  const react = { Component: class {}, Suspense: 'suspense',
    lazy: fn => fn.toString().includes('./InterneuronTypeAtlas') ? 'type-atlas' : 'other-lazy',
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useEffect(fn) { effects.push(fn); },
  };
  const path = new URL('../app/ResearchCollectionPage.tsx', import.meta.url);
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(js, { module: compiledModule, exports: compiledModule.exports, URL, URLSearchParams,
    queueMicrotask: fn => microtasks.push(fn),
    window: { location: { href: 'http://test.local/explore/cell-types?' + params.toString(), search: '?' + params.toString() },
      history: { state: null, replaceState(_state, _unused, url) { history.push(url); } }, addEventListener() {}, removeEventListener() {} },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return jsx;
      if (name === 'next/link') return () => null;
      if (name.endsWith('.css')) return {};
      if (name === './research-explorer-index.js') return focusApi;
      if (name === './matson-sci-timecourse.js') return sciApi;
      if (name === './type-profile-view-state.js') return viewApi;
      if (name === './ResearchActiveRecordProvider') return { ResearchActiveRecordProvider: 'provider',
        useResearchActiveRecordLoader: focus => { requestedFocus = focus; return { indexState: verifiedRecords
          ? { status: 'ready', records: verifiedRecords } : { status: 'loading' } }; } };
      throw Error('Unexpected route dependency: ' + name);
    },
  }, { filename: path.pathname });
  return { requestedFocus: () => requestedFocus, history,
    effects() { for (const fn of effects.splice(0)) fn(); for (const fn of microtasks.splice(0)) fn(); },
    childProps() { cursor = 0; const tree = compiledModule.exports.default({ pageId: 'cell-types', initialParams });
    const children = nodes(tree, n => n.type === 'type-atlas'); assert.equal(children.length, 1); return children[0].props; } };
}
test('outer canonical empty, incomplete, foreign-kind and repeated requests cannot substitute a valid profile', () => {
  const id = 'sathyamurthy-2018:DE-1';
  for (const params of [
    { focusKind: 'molecular_profile', focusId: '' }, { focusKind: 'molecular_profile' }, { focusId: id },
    { focusKind: 'morphology_record', focusId: id }, { focusKind: ['molecular_profile', 'molecular_profile'], focusId: id },
    { focusKind: 'molecular_profile', focusId: [id, id] }, { type: [id, id] },
    { focusKind: 'molecular_profile', focusId: 'unknown-version-profile' },
  ]) { const c = collectionHarness(params), props = c.childProps(), h = harness(props); h.render(); assertUnavailable(h);
    if (props.requestError) assert.equal(c.requestedFocus(), null, 'Malformed profile requests cannot load a different canonical active record'); }
});
test('outer canonical invalid request recovers only through an actual valid profile activation', async () => {
  const c = collectionHarness({ focusKind: 'molecular_profile', focusId: '' });
  const h = harness(c.childProps()); h.render(); assertUnavailable(h);
  h.clickOption('DE-2'); h.update(c.childProps());
  assert.equal(h.dossier()[0].props['aria-label'], 'Source-record dossier for DE-2');
  assert.equal((await h.export()).selected.id, 'sathyamurthy-2018:DE-2');
});
test('an unavailable canonical request using a valid literal ID cannot fabricate a previous-profile baseline', () => {
  const h = harness({ selectedFocusId: 'sathyamurthy-2018:DE-2' }); h.render(); h.effects();
  h.update({ selectedFocusId: 'sathyamurthy-2018:DE-1', requestError: 'Repeated canonical request' });
  assertUnavailable(h); h.effects();
  h.update({ selectedFocusId: 'sathyamurthy-2018:DE-3', requestError: null }); h.effects();
  assert.equal(h.history.length, 0, 'An unavailable request never becomes a source-profile comparison baseline');
});

test('verified legacy migration rejects repeated IDs and only canonicalizes a single exact source request', () => {
  const records = JSON.parse(readFileSync(new URL('../public/data/research_explorer_index_v1/search-index.json', import.meta.url), 'utf8')).records;
  const id = 'sathyamurthy-2018:DE-1';
  const bad = collectionHarness({ type: [id, id] }, records); bad.childProps(); bad.effects();
  assert.equal(bad.history.length, 0, 'Invalid repeated aliases must not acquire a canonical focus');
  const valid = collectionHarness({ type: id }, records); valid.childProps(); valid.effects();
  assert.equal(valid.history.length, 1);
  const params = new URL(valid.history[0], 'http://test.local').searchParams;
  assert.equal(params.get('focusKind'), 'molecular_profile'); assert.equal(params.get('focusId'), id);
});

test('actual compiled profile membership equals the full lightweight source registry', () => {
  const h = harness(); h.render();
  const membership = JSON.parse(readFileSync(new URL('../data/type-profile-view-membership-0.1.json', import.meta.url), 'utf8'));
  assert.deepEqual(h.options().map(option => option.key).sort(), membership.profiles.map(profile => profile.id).sort());
});
test('a complete bookmarked view restores all controls, selected dossier, comparison and baseline', async () => {
  const params = { focusKind: 'molecular_profile', focusId: 'sathyamurthy-2018:DE-2', typeQuery: ' no matching literal + ',
    typeSource: 'russ-2021', typeRegion: 'ventral', typeTransmitter: 'inhibitory',
    typeCompare: 'sathyamurthy-2018:DE-1,sathyamurthy-2018:DE-3', typeBaseline: 'sathyamurthy-2018:DE-1' };
  const h = harness({}, params); h.render();
  assert.deepEqual(h.controls(), { query: params.typeQuery, filters: ['russ-2021', 'ventral', 'inhibitory'] });
  assert.equal(h.options().length, 0); assert.equal(h.dossier()[0].props['aria-label'], 'Source-record dossier for DE-2');
  const payload = await h.export(); assert.equal(payload.selected.id, params.focusId);
  assert.deepEqual(payload.comparison.map(profile => profile.id), params.typeCompare.split(','));
  assert.ok(payload.sourceRecordDelta); assert.equal(h.history.length, 0);
});
test('explicit selection and Back/Forward restore the exact full view without fabricating a baseline', async () => {
  const h = harness(); h.render(); h.effects();
  const first = await h.export(); h.query('DE-'); h.filter(0, 'sathyamurthy-2018'); h.clickOption('DE-2');
  h.clickButton('Add to compare');
  const selectedUrl = h.location().href, selectedPayload = await h.export();
  h.filter(1, 'ventral'); const filteredUrl = h.location().href;
  h.travel(-1); assert.equal(h.location().href, selectedUrl); assert.equal(h.controls().filters[1], 'all');
  const restored = await h.export(); delete selectedPayload.exportedAt; delete restored.exportedAt; assert.deepEqual(restored, selectedPayload);
  h.travel(-1); assert.equal(h.location().searchParams.has('typeCompare'), false);
  h.travel(-1); assert.equal((await h.export()).selected.id, first.selected.id);
  assert.equal(h.location().searchParams.has('typeBaseline'), false, 'Back restored the original absent baseline');
  h.travel(1); assert.equal((await h.export()).selected.id, 'sathyamurthy-2018:DE-2');
  h.travel(1); h.travel(1); assert.equal(h.location().href, filteredUrl); assert.equal(h.controls().filters[1], 'ventral');
});
test('user actions preserve repeated unrelated fields and the reading fragment', () => {
  const h = harness({}, { type: 'sathyamurthy-2018:DE-2' }); h.render();
  const p = h.location().searchParams; p.append('rnaFeature', 'A'); p.append('rnaFeature', 'B');
  h.update({ profileLocation: p.toString() });
  h.readingFragment("selected-evidence");
  h.filter(0, 'russ-2021'); assert.deepEqual(h.location().searchParams.getAll('rnaFeature'), ['A', 'B']);
  assert.equal(h.location().searchParams.get('type'), 'sathyamurthy-2018:DE-2');
  assert.equal(h.location().hash, '#selected-evidence');
});
test('malformed filters, comparisons and baselines disable both parent focus and profile export', () => {
  const id = 'sathyamurthy-2018:DE-2';
  for (const extra of [{ typeCompare: id + ',missing' }, { typeCompare: [id, id] }, { typeBaseline: id },
    { typeSource: 'unknown-source' }, { typeRegion: ['ventral', 'ventral'] }, { typeTransmitter: 'foreign' },
    { typeQuery: ['A', 'B'] }, { typeQuery: 'x'.repeat(161) }]) {
    const c = collectionHarness({ focusKind: 'molecular_profile', focusId: id, ...extra });
    const h = harness(c.childProps()); h.render(); assertUnavailable(h); assert.equal(c.requestedFocus(), null);
  }
});
test('changing one filter preserves an invalid repeated request until explicit valid activation', async () => {
  const h = harness({}, { focusKind: 'molecular_profile', focusId: ['sathyamurthy-2018:DE-1', 'sathyamurthy-2018:DE-1'] });
  h.render(); assertUnavailable(h); h.filter(0, 'sathyamurthy-2018'); assertUnavailable(h);
  assert.deepEqual(h.location().searchParams.getAll('focusId'), ['sathyamurthy-2018:DE-1', 'sathyamurthy-2018:DE-1']);
  h.clickOption('DE-2'); assert.equal((await h.export()).selected.id, 'sathyamurthy-2018:DE-2');
});
test('invalid comparison is retained through selection until the reader explicitly clears it', async () => {
  const h = harness({}, { type: 'sathyamurthy-2018:DE-1', typeCompare: 'missing-source-profile' });
  h.render(); assertUnavailable(h); h.clickOption('DE-2'); assertUnavailable(h);
  assert.equal(h.location().searchParams.get('typeCompare'), 'missing-source-profile');
  h.clickButton('Clear requested comparison and baseline');
  assert.equal((await h.export()).selected.id, 'sathyamurthy-2018:DE-2');
  assert.equal(h.location().searchParams.has('typeCompare'), false);
});
test('controlled route restoration takes precedence over an earlier locally edited view', async () => {
  const h = harness({ profileLocation: 'focusKind=molecular_profile&focusId=sathyamurthy-2018%3ADE-2&typeQuery=first' });
  h.render(); h.query('changed');
  h.update({ profileLocation: 'focusKind=molecular_profile&focusId=sathyamurthy-2018%3ADE-3&typeQuery=restored&typeSource=russ-2021' });
  assert.equal(h.controls().query, 'restored'); assert.equal(h.controls().filters[0], 'russ-2021');
  assert.equal((await h.export()).selected.id, 'sathyamurthy-2018:DE-3');
  assert.equal(h.location().searchParams.has('typeBaseline'), false);
});
test('Browse this source serializes its four changed fields and preserves exact selection and comparison', async () => {
  const h = harness({}, { type: 'sathyamurthy-2018:DE-2', typeQuery: 'zero match', typeSource: 'russ-2021',
    typeRegion: 'ventral', typeTransmitter: 'cholinergic', typeCompare: 'sathyamurthy-2018:DE-1' });
  h.render(); h.clickButton('Browse this source');
  assert.deepEqual(h.controls(), { query: '', filters: ['sathyamurthy-2018', 'all', 'all'] });
  const payload = await h.export(); assert.equal(payload.selected.id, 'sathyamurthy-2018:DE-2');
  assert.deepEqual(payload.comparison.map(profile => profile.id), ['sathyamurthy-2018:DE-1']);
  assert.equal(h.location().searchParams.get('typeSource'), 'sathyamurthy-2018');
});

test('unavailable request messages distinguish duplicate, empty and missing literal IDs', () => {
  const id = 'sathyamurthy-2018:DE-2';
  const duplicate = harness({}, { focusKind: 'molecular_profile', focusId: [id, id] }); duplicate.render();
  assertUnavailable(duplicate); assert.equal(duplicate.text().includes('(empty ID)'), false);
  assert.ok(duplicate.text().includes(JSON.stringify(id) + ' · ' + JSON.stringify(id)));
  const empty = harness({}, { focusKind: 'molecular_profile', focusId: '' }); empty.render(); assert.match(empty.text(), /\(empty ID\)/);
  const missing = harness({}, { focusKind: 'molecular_profile' }); missing.render(); assert.match(missing.text(), /\(missing ID\)/);
});
