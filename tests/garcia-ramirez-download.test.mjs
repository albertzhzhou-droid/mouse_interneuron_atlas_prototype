import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as physiology from '../app/garcia-ramirez-physiology.js';

const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
function compile(relative, extra = {}) {
  const file = new URL(relative, import.meta.url);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, URL, URLSearchParams, Request, Response, ...extra,
    require(name) {
      if (name.endsWith('/garcia-ramirez-physiology.js')) return physiology;
      if (name === 'react/jsx-runtime') return jsx;
      if (name === 'react') return extra.react;
      if (name.endsWith('.css')) return {};
      throw new Error('Unexpected import: ' + name);
    },
  }, { filename: file.pathname });
  return mod.exports;
}
const { GET } = compile('../app/api/study-facts/garcia-ramirez-2022/route.ts');
const download = search => GET(new Request('http://localhost/api/study-facts/garcia-ramirez-2022' + search));

test('Every exact table downloads all four original source tables and its own selection', async () => {
  for (let i = 1; i <= 4; i++) {
    const response = download(`?physiologyTable=ST${i}&physiologyQuery=rheobase`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-disposition'), `attachment; filename="garcia-ramirez-2022-ST${i}-aggregate-physiology.json"`);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ['documentType', 'schemaVersion', 'sourceFacts', 'derivationReceipt', 'selection', 'authority', 'newMolecularProfiles', 'newPhysicalCellRosterRows', 'geometryObjects', 'sameCellCrossSourceJoins', 'registrations', 'actualViewCaptured', 'sourceInputsFetchedDuringThisExport'].sort());
    assert.deepEqual(body.sourceFacts, physiology.garciaRamirezPhysiologyFacts);
    assert.deepEqual(body.derivationReceipt, physiology.garciaRamirezPhysiologyDerivation);
    assert.deepEqual(body.selection, { sourceTableId: `garcia-ramirez-2022:aggregate-physiology:ST${i}`, sourceTableLabel: `Supplementary Table ${i}`, query: 'rheobase', visiblePropertyIds: ['rheobase'] });
    assert.equal(body.actualViewCaptured, false);
    assert.equal(body.sourceInputsFetchedDuringThisExport, false);
    for (const field of ['newMolecularProfiles', 'newPhysicalCellRosterRows', 'geometryObjects', 'sameCellCrossSourceJoins', 'registrations']) assert.equal(body[field], 0);
  }
});

test('Absent, empty, wrong and repeated owned fields produce no attachment or borrowed source facts', async () => {
  for (const search of ['', '?physiologyQuery=rheobase', '?physiologyTable=', '?physiologyTable=ST5', '?physiologyTable=st4', '?physiologyTable=ST4&physiologyTable=ST4', '?physiologyTable=ST4&physiologyTable=ST1', '?physiologyTable=ST4&physiologyQuery=rheobase&physiologyQuery=rheobase', '?physiologyTable=ST4&physiologyQuery=&physiologyQuery=rheobase']) {
    const response = download(search);
    assert.equal(response.status, 400, search);
    assert.equal(response.headers.has('content-disposition'), false, search);
    const body = await response.json();
    assert.equal(body.exportAvailable, false);
    assert.deepEqual(Object.keys(body).sort(), ['error', 'exportAvailable']);
  }
});

test('Query is literal and affects only the displayed property selection, including zero matches', async () => {
  for (const query of ['', 'input resistance', '源 文 + & ? #', 'no-source-property-matches']) {
    const response = download('?physiologyTable=ST4&physiologyQuery=' + encodeURIComponent(query));
    const body = await response.json();
    assert.equal(body.selection.query, query);
    assert.equal(body.sourceFacts.tables.length, 4);
    assert.equal(body.sourceFacts.tables.reduce((n, table) => n + table.propertyRows.length, 0), 48);
    const expected = query === '' ? 12 : query === 'input resistance' ? 1 : 0;
    assert.equal(body.selection.visiblePropertyIds.length, expected);
  }
});

test('Both successful and refused downloads have explicit JSON, no-store and nosniff responses', async () => {
  for (const search of ['?physiologyTable=ST1', '?physiologyTable=ST9']) {
    const response = download(search);
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal((await response.text()).endsWith('\n'), true);
  }
});

function panel(href) {
  let current = new URL(href), cursor = 0, installed = false;
  const slots = [], effects = [], listeners = new Map();
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useEffect(callback) { if (!installed) { effects.push(callback); installed = true; } },
  };
  const window = {
    location: { get href() { return current.href; }, get search() { return current.search; } },
    history: { state: { preserved: true }, replaceState(state, title, href) { assert.equal(state, this.state); current = new URL(href, current); } },
    addEventListener(name, handler) { listeners.set(name, handler); }, removeEventListener(name) { listeners.delete(name); },
  };
  const { default: Panel } = compile('../app/GarciaRamirezPhysiologyPanel.tsx', { react, window });
  const render = () => { cursor = 0; return Panel(); };
  const api = { render, get url() { return current; }, mount() { render(); effects.splice(0).forEach(cb => cb()); return render(); }, pop(href) { current = new URL(href, current); listeners.get('popstate')(); return render(); } };
  return api;
}
function nodes(root, type) {
  const result = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (node.type === type) result.push(node);
    visit(node.props?.children);
  }
  visit(root); return result;
}
const button = tree => nodes(tree, 'button').find(n => n.props.children === 'Export study facts');
const queryInput = tree => nodes(tree, 'input').find(n => n.props.placeholder);

test('Compiled panel submits the exact selected table and query through a native GET form', () => {
  const p = panel('http://localhost/explore/cell-types/additional?physiologyTable=ST4&physiologyQuery=rheobase');
  assert.equal(button(p.render()).props.disabled, true);
  const tree = p.mount(), form = nodes(tree, 'form')[0];
  assert.equal(form.props.action, '/api/study-facts/garcia-ramirez-2022');
  assert.equal(form.props.method, 'get');
  assert.equal(button(tree).props.type, 'submit');
  assert.equal(button(tree).props.disabled, false);
  assert.deepEqual(nodes(form, 'input').map(n => [n.props.name, n.props.value]), [['physiologyTable', 'ST4'], ['physiologyQuery', 'rheobase']]);
  form.props.onSubmit();
  const status = nodes(p.render(), 'p').find(n => n.props.role === 'status');
  assert.match(status.props.children.join(''), /Download requested/);
  assert.doesNotMatch(status.props.children.join(''), /facts exported|download complete|file saved/i);
});

test('A repeated query closes facts and download; only editing that field repairs the ambiguity', () => {
  const p = panel('http://localhost/explore/cell-types/additional?physiologyTable=ST4&physiologyQuery=rheobase&physiologyQuery=input&other=A&other=B#source-study');
  let tree = p.mount();
  assert.equal(button(tree).props.disabled, true);
  assert.equal(nodes(tree, 'table').length, 0);
  assert.equal(queryInput(tree).props.disabled, false);
  nodes(tree, 'select')[0].props.onChange({ target: { value: 'ST3' } });
  tree = p.render();
  assert.equal(button(tree).props.disabled, true);
  assert.deepEqual(p.url.searchParams.getAll('physiologyQuery'), ['rheobase', 'input']);
  queryInput(tree).props.onChange({ target: { value: 'rheobase' } });
  tree = p.render();
  assert.equal(button(tree).props.disabled, false);
  assert.equal(nodes(tree, 'tbody')[0].props.children.length, 1);
  assert.deepEqual(p.url.searchParams.getAll('physiologyQuery'), ['rheobase']);
  assert.deepEqual(p.url.searchParams.getAll('other'), ['A', 'B']);
  assert.equal(p.url.hash, '#source-study');
});

test('Unknown and repeated table requests stay closed until explicit source-table selection', () => {
  for (const search of ['physiologyTable=ST99', 'physiologyTable=ST4&physiologyTable=ST1']) {
    const p = panel('http://localhost/explore/cell-types/additional?' + search);
    let tree = p.mount();
    assert.equal(button(tree).props.disabled, true);
    assert.equal(nodes(tree, 'table').length, 0);
    nodes(tree, 'select')[0].props.onChange({ target: { value: 'ST2' } });
    tree = p.render();
    assert.equal(button(tree).props.disabled, false);
    assert.deepEqual(p.url.searchParams.getAll('physiologyTable'), ['ST2']);
  }
});

test('Popstate restores the exact form values and clears a prior requested-download status', () => {
  const p = panel('http://localhost/explore/cell-types/additional?physiologyTable=ST4&physiologyQuery=rheobase');
  nodes(p.mount(), 'form')[0].props.onSubmit();
  const tree = p.pop('?physiologyTable=ST1&physiologyQuery=input%20resistance');
  assert.deepEqual(nodes(nodes(tree, 'form')[0], 'input').map(n => n.props.value), ['ST1', 'input resistance']);
  assert.doesNotMatch(nodes(tree, 'p').find(n => n.props.role === 'status').props.children.join(''), /Download requested/);
});
