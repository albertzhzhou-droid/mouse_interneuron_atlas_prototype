import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import glut from '../data/cano-gomez-glut-active-ident-labels-0.1.json' with { type: 'json' };
import gaba from '../data/cano-gomez-gaba-source-labels-0.1.json' with { type: 'json' };
import * as gabaApi from '../app/cano-gaba-source-labels.js';

const require = createRequire(import.meta.url);
const jsxRuntime = require('react/jsx-runtime');
const css = new Proxy({}, { get: (_target, name) => String(name) });
const datasets = { glut, gaba };
const paths = { glut: '../app/CanoGomezGlutLabelBrowser.tsx', gaba: '../app/CanoGabaSourceLabelBrowser.tsx' };
const textOf = node => Array.isArray(node) ? node.map(textOf).join('') : node == null || typeof node === 'boolean' ? '' : typeof node === 'object' ? textOf(node.props?.children) : String(node);
function nodes(tree, match) {
  const found = [];
  const walk = node => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object' || !node.props) return;
    if (match(node)) found.push(node);
    walk(node.props.children);
  };
  walk(tree); return found;
}

// Descriptor-only replay of actual compiled components/callbacks/Blob handlers.
// The hook state override below is test-local and creates no public app hook.
// This cannot prove native focus/keyboard, hydration, mounted-child lifecycle or
// browser downloads. Original source/roster proof stays in the unchanged loader.
function harness(kind) {
  const source = readFileSync(new URL(paths[kind], import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  const slots = []; let cursor = 0, tree, blob;
  const react = {
    useId: () => `descriptor-${kind}`,
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useMemo: callback => callback(), useEffect() {}, useRef: value => ({ current: value }),
  };
  const document = { createElement: () => ({ click() {}, remove() {} }) };
  const window = { document, setTimeout: callback => callback() };
  class DescriptorURL extends URL { static createObjectURL(value) { blob = value; return 'blob:descriptor-source-label'; } static revokeObjectURL() {} }
  const compiledModule = { exports: {} };
  const localRequire = name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return jsxRuntime;
    if (name.endsWith('.css')) return name.endsWith('.module.css') ? css : {};
    if (name === './cano-gaba-source-labels.js') return gabaApi;
    if (name.includes('cano-gomez-glut-active-ident-labels')) return glut;
    if (name.includes('cano-gomez-gaba-source-labels')) return gaba;
    throw new Error(`Unexpected source/runtime import: ${name}`);
  };
  vm.runInNewContext(compiled, { module: compiledModule, exports: compiledModule.exports, require: localRequire, window, document, URL: DescriptorURL, Blob, AbortController }, { filename: `${kind}-actual-source-label-component.cjs` });
  const Component = compiledModule.exports.default;
  function render() { cursor = 0; tree = Component(); return tree; }
  function sourceButtons() { return nodes(tree, node => node.type === 'button' && node.props['aria-pressed'] !== undefined); }
  function selectedId() {
    if (kind === 'gaba') return nodes(tree, node => node.type === 'article' && node.props['data-gaba-label-id'] !== undefined)[0].props['data-gaba-label-id'] || null;
    const ids = nodes(tree, node => node.type === 'code' && textOf(node).startsWith('cano.glut.active-ident.sha256.')).map(textOf);
    assert.ok(ids.length <= 1); return ids[0] ?? null;
  }
  function query(value) { nodes(tree, node => node.type === 'input')[0].props.onChange({ target: { value } }); render(); }
  function group(value) { nodes(tree, node => node.type === 'select')[0].props.onChange({ target: { value } }); render(); }
  function order(value) { nodes(tree, node => node.type === 'select')[1].props.onChange({ target: { value } }); render(); }
  function activate(label) {
    const button = sourceButtons().find(node => textOf(node.props.children[0]) === label.rawLabel);
    assert.ok(button, `Exact current label button unavailable: ${label.rawLabel}`);
    button.props.onClick(); render();
  }
  function page(direction) {
    const title = kind === 'glut' ? direction : `${direction} labels`;
    const button = nodes(tree, node => node.type === 'button' && textOf(node) === title)[0];
    assert.ok(button && !button.props.disabled); button.props.onClick(); render();
  }
  function retained() { return nodes(tree, node => node.type === 'p' && node.props.role === 'status' && textOf(node).includes('Selected label retained outside')).length === 1; }
  function selectedSummary() { return nodes(tree, node => typeof node.type === 'function' && node.props.title === 'Export selected-label summary')[0]; }
  async function exportCurrent() {
    blob = null;
    if (kind === 'glut') {
      const button = nodes(tree, node => node.type === 'button' && textOf(node) === 'Export selected-label evidence')[0];
      assert.ok(button, 'No selected source-label export action'); button.props.onClick();
    } else {
      const summary = selectedSummary(); assert.ok(summary, 'No selected source-label export action');
      const preview = summary.type(summary.props); nodes(preview, node => node.type === 'button')[0].props.onClick();
    }
    assert.ok(blob); return JSON.parse(await blob.text());
  }
  function assertExact(label) {
    assert.equal(selectedId(), label.id);
    const header = nodes(tree, node => node.type === 'h5')[0]; assert.equal(textOf(header), label.rawLabel);
    if (kind === 'gaba') {
      const rows = nodes(tree, node => typeof node.type === 'function' && Object.hasOwn(node.props, 'label') && !Object.hasOwn(node.props, 'title'));
      assert.equal(rows.length, 1); assert.equal(rows[0].props.label.id, label.id);
      assert.deepEqual(rows[0].props.label, gaba.labels.find(row => row.id === label.id));
      assert.ok(nodes(tree, node => node.type === 'div' && node.key === label.id).length === 1, 'same full-ID child key is retained');
    }
  }
  return { render, sourceButtons, selectedId, query, group, order, activate, page, retained, assertExact, exportCurrent,
    forceUnknown(value) { slots[4] = value; render(); }, get tree() { return tree; } };
}
const initialDefault = document => document.labels.slice().sort((a, b) => b.nucleusCount - a.nucleusCount || a.rawLabel.localeCompare(b.rawLabel, 'en'))[0];
const secondInitial = document => document.labels.slice().sort((a, b) => b.nucleusCount - a.nucleusCount || a.rawLabel.localeCompare(b.rawLabel, 'en'))[1];
async function assertExport(h, document, label) {
  const receipt = await h.exportCurrent();
  assert.equal(receipt.adapterId, document.adapterId);
  assert.deepEqual(receipt.source, document.source);
  assert.deepEqual(receipt.label, label);
  assert.deepEqual(receipt.boundaries, document.boundaries);
  if (Object.hasOwn(receipt, 'runtimeNucleusRowsIncluded')) assert.equal(receipt.runtimeNucleusRowsIncluded, false);
  return receipt;
}

for (const kind of ['glut', 'gaba']) {
  const document = datasets[kind];
  test(`${kind}: exact initial default matches the original count/tie order and one pressed source button`, async () => {
    const originalOrder = document.labels.map(label => label.id), h = harness(kind); h.render();
    const label = initialDefault(document); h.assertExact(label);
    assert.equal(h.sourceButtons().length, 18);
    assert.equal(h.sourceButtons().filter(node => node.props['aria-pressed']).length, 1);
    assert.equal(h.retained(), false); await assertExport(h, document, label);
    assert.deepEqual(document.labels.map(row => row.id), originalOrder, 'source label array/order must not mutate');
  });
  test(`${kind}: query excluding an explicitly selected label retains its exact dossier and export`, async () => {
    const h = harness(kind); h.render(); const label = secondInitial(document); h.activate(label);
    const before = await assertExport(h, document, label);
    h.query(initialDefault(document).rawLabel); h.assertExact(label);
    assert.equal(h.retained(), true); assert.equal(h.sourceButtons().filter(node => node.props['aria-pressed']).length, 0);
    assert.deepEqual(await assertExport(h, document, label), before);
    h.query(''); h.assertExact(label); assert.equal(h.retained(), false);
    assert.equal(h.sourceButtons().filter(node => node.props['aria-pressed']).length, 1);
  });
  test(`${kind}: next/previous page and sort never implicitly replace a selected label`, async () => {
    const h = harness(kind); h.render(); const label = secondInitial(document); h.activate(label);
    h.page('Next'); h.assertExact(label); assert.equal(h.retained(), true);
    assert.equal(h.sourceButtons().filter(node => node.props['aria-pressed']).length, 0);
    await assertExport(h, document, label);
    h.page('Previous'); h.assertExact(label); assert.equal(h.retained(), false);
    h.order('label'); h.assertExact(label); await assertExport(h, document, label);
    h.order('count'); h.assertExact(label); assert.equal(h.retained(), false);
  });
  test(`${kind}: group exclusion and zero-result filters retain a source full ID without changing matching denominators`, async () => {
    const target = document.labels.find(label => label.groupCounts.length < document.groupCounts.length);
    assert.ok(target); const absentGroup = document.groupCounts.find(group => !target.groupCounts.some(item => item.value === group.value));
    assert.ok(absentGroup && absentGroup.value !== null);
    const h = harness(kind); h.render(); h.query(target.rawLabel); h.activate(target); h.query('');
    h.group(absentGroup.value); h.assertExact(target); assert.equal(h.retained(), true);
    await assertExport(h, document, target);
    h.query('no-such-source-label-i64'); h.assertExact(target); assert.equal(h.sourceButtons().length, 0);
    assert.match(textOf(h.tree), /0 matching (source )?labels/); assert.match(textOf(h.tree), /0 nuclei represented/);
    assert.equal(h.retained(), true); await assertExport(h, document, target);
    h.group('all'); h.query(''); h.assertExact(target);
  });
  test(`${kind}: unknown, empty, foreign and stale IDs clear details/exports and explicit activation alone recovers`, async () => {
    const h = harness(kind); h.render(); const otherKind = kind === 'glut' ? 'gaba' : 'glut';
    for (const id of ['unknown-label', '', datasets[otherKind].labels[0].id, document.labels[0].id + ':old-version']) {
      h.forceUnknown(id); assert.equal(h.selectedId(), null);
      assert.equal(h.sourceButtons().filter(node => node.props['aria-pressed']).length, 0);
      assert.match(textOf(h.tree), /Selected source label is unavailable/);
      assert.equal(nodes(h.tree, node => node.type === 'h5').length, 0);
      assert.equal(nodes(h.tree, node => typeof node.type === 'function' && Object.hasOwn(node.props, 'label')).length, 0);
      await assert.rejects(h.exportCurrent(), /No selected source-label export action/);
      h.query(''); h.order('count'); assert.equal(h.selectedId(), null, 'query/sort cannot infer a replacement');
    }
    const selected = initialDefault(document); h.activate(selected); h.assertExact(selected); await assertExport(h, document, selected);
  });
}

test('all 481 current qualified raw labels activate/export by full ID and stay selected through zero results', async () => {
  assert.equal(glut.labels.length, 277); assert.equal(gaba.labels.length, 204);
  assert.equal(glut.denominators.nucleusCount, 92782); assert.equal(gaba.denominators.nucleusCount, 73364);
  for (const kind of ['glut', 'gaba']) {
    const document = datasets[kind], h = harness(kind); h.render();
    for (const label of document.labels) {
      h.query(label.rawLabel); h.activate(label); h.assertExact(label);
      await assertExport(h, document, label);
      h.query('no-such-source-label-i64'); h.assertExact(label); assert.equal(h.sourceButtons().length, 0); assert.equal(h.retained(), true);
      await assertExport(h, document, label);
    }
  }
});

// Render actual components with React server hooks and unchanged source helpers.
// CSS is the only omitted presentation input; this is not native layout/AT QA.
registerHooks({
  resolve(specifier, context, nextResolve) {
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
test('actual SSR retains the current browser wrappers, source labels, initial source evidence and no new profiles', async () => {
  for (const kind of ['glut', 'gaba']) {
    const { default: Component } = await import(paths[kind]);
    const html = renderToStaticMarkup(createElement(Component));
    assert.match(html, new RegExp(`data-cano-${kind}-source-label-browser="true"`));
    assert.match(html, /data-confirmed-interneuron-profiles-added="0"/);
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.match(html, new RegExp(initialDefault(datasets[kind]).id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(html, /Selected label retained outside|Selected source label is unavailable/);
    if (kind === 'gaba') assert.match(html, /Load nucleus assignments/);
    else assert.match(html, /Export selected-label evidence/);
  }
});
