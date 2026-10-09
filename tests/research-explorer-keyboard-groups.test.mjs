import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { groupResearchResults, searchResearchRecords } from "../app/research-explorer-index.js";
import { loadVerifiedSupplementalMorphologyResearchRecords } from "../app/research-supplemental-morphology-records.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const base = JSON.parse(read("public/data/research_explorer_index_v1/search-index.json"));
const records = [...base.records, ...await loadVerifiedSupplementalMorphologyResearchRecords({ cryptoImpl: webcrypto })];
const groups = groupResearchResults(searchResearchRecords(records, ""));

// Compile the actual TSX and unchanged hook in memory, with no dependency writes.
// SSR below uses actual React. Descriptor event replay substitutes only the hook
// dispatcher and focusable node refs; it is not actual browser/assistive-tech proof.
function loadComponent(reactHooks = React) {
  const compiled = new Map();
  function load(relative) {
    if (compiled.has(relative)) return compiled.get(relative).exports;
    const compiledModule = { exports: {} }; compiled.set(relative, compiledModule);
    const output = ts.transpileModule(read(relative), {
      fileName: relative,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const localRequire = (name) => {
      if (name === "react") return reactHooks;
      if (name.endsWith(".css")) return {};
      if (name === "./useSourceListRovingFocus") return load("app/useSourceListRovingFocus.ts");
      if (name === "./source-list-roving-focus.js") return require("../app/source-list-roving-focus.js");
      return require(name);
    };
    vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, require: localRequire }, { filename: relative });
    return compiledModule.exports;
  }
  return load("app/ResearchExplorerResultGroup.tsx").default;
}

const Component = loadComponent();
const snippet = (record) => record.subtitle;
const groupProps = (group, visibleRecords = group.results.map(({ record }) => record), selectedKey = null) => ({
  laneLabel: group.laneLabel, namespace: group.namespace, resultCount: group.results.length,
  visibleRecords, selectedKey, keyboardHelpId: "source-keyboard-help", snippet,
  onSelect: () => {}, onToggleExpanded: () => {}, expanded: true, canExpand: group.results.length > 4,
});
const buttonsFromHtml = (html) => [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
  .filter((match) => match[1].includes("data-source-list-key="));
const treeButtons = (element) => {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(treeButtons);
  return [...(element.type === "button" ? [element] : []), ...treeButtons(element.props?.children)];
};

function eventReplay(initialProps) {
  const slots = []; let cursor = 0; let props = initialProps; let buttons = []; let tree;
  const nodes = new Map(); const focused = [];
  const hooks = {
    ...React,
    useId() { const slot = cursor++; return slots[slot] ??= `test-source-id-${slot}`; },
    useState(initial) {
      const slot = cursor++; if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
      return [slots[slot], (value) => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }];
    },
    useRef(initial) { const slot = cursor++; return slots[slot] ??= { current: initial }; },
  };
  const ReplayComponent = loadComponent(hooks);
  const render = (nextProps = props) => {
    for (const button of buttons) button.props.ref?.(null);
    props = nextProps; cursor = 0; tree = ReplayComponent(props);
    buttons = treeButtons(tree).filter((button) => button.props["data-source-list-key"]);
    for (const button of buttons) {
      const key = button.props["data-source-list-key"];
      const node = nodes.get(key) ?? {}; nodes.set(key, node);
      node.focus = () => { focused.push(key); button.props.onFocus(); };
      button.props.ref(node);
    }
    return buttons;
  };
  render();
  const current = (key) => buttons.find((button) => button.props["data-source-list-key"] === key);
  return {
    render, focused, get props() { return props; },
    get buttons() { return buttons; }, get tree() { return tree; },
    tabKeys: () => buttons.filter((button) => button.props.tabIndex === 0).map((button) => button.props["data-source-list-key"]),
    focus(key) { assert.ok(current(key)); nodes.get(key).focus(); render(); },
    key(key, eventKey, modifiers = {}) {
      let prevented = false;
      current(key).props.onKeyDown({ key: eventKey, preventDefault() { prevented = true; }, ...modifiers });
      render(); return prevented;
    },
    click(key) { current(key).props.onClick(); },
  };
}

test("actual React SSR preserves all 673 source records and gives one result-entry tab stop per namespace", () => {
  assert.equal(base.records.length, 641); assert.equal(records.length, 673); assert.equal(groups.length, 28);
  const before = JSON.stringify(records); let count = 0;
  for (const group of groups) {
    const visible = group.results.map(({ record }) => record);
    const selected = visible.at(-1).key;
    const html = renderToStaticMarkup(React.createElement(Component, groupProps(group, visible, selected)));
    const buttons = buttonsFromHtml(html); count += buttons.length;
    assert.equal(buttons.length, visible.length);
    assert.equal(buttons.filter((match) => /tabindex="0"/.test(match[1])).length, 1);
    assert.ok(buttons.at(-1)[1].includes('tabindex="0"'));
    assert.ok(buttons.at(-1)[1].includes('aria-pressed="true"'));
    assert.match(html, /role="group"/); assert.match(html, /aria-describedby="source-keyboard-help"/);
    const escape = (text) => String(text).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    visible.forEach((record, index) => {
      assert.ok(buttons[index][1].includes(`data-source-list-key="${escape(record.key)}"`));
      assert.ok(buttons[index][2].includes(`<code>${escape(record.focusId)}</code>`));
    });
  }
  assert.equal(count, 673); assert.equal(JSON.stringify(records), before);
});

test("collapsed, missing selected, filtered and empty groups do not create a replacement selected record", () => {
  const group = groups.find((item) => item.results.length === 157);
  const selected = group.results.at(-1).record.key;
  const collapsed = group.results.slice(0, 4).map(({ record }) => record);
  const html = renderToStaticMarkup(React.createElement(Component, groupProps(group, collapsed, selected)));
  const buttons = buttonsFromHtml(html);
  assert.equal(buttons.length, 4); assert.equal(buttons.filter((match) => /tabindex="0"/.test(match[1])).length, 1);
  assert.equal(buttons.filter((match) => /aria-pressed="true"/.test(match[1])).length, 0);
  assert.ok(buttons[0][1].includes('tabindex="0"'));
  const empty = renderToStaticMarkup(React.createElement(Component, groupProps(group, [], selected)));
  assert.equal(buttonsFromHtml(empty).length, 0);
});

test("descriptor replay of original hook moves focus through real source keys and activates only via native click callback", () => {
  const group = groups.find((item) => item.namespace === "russ-2021");
  const visible = group.results.slice(0, 5).map(({ record }) => record);
  const selected = visible[0].key; const activations = [];
  const replay = eventReplay({ ...groupProps(group, visible, selected), onSelect: (record) => activations.push(record) });
  replay.focus(selected);
  assert.equal(replay.key(selected, "ArrowDown"), true);
  assert.deepEqual(replay.tabKeys(), [visible[1].key]);
  assert.equal(replay.key(visible[1].key, "End"), true);
  assert.deepEqual(replay.tabKeys(), [visible.at(-1).key]);
  assert.equal(replay.key(visible.at(-1).key, "Home"), true);
  assert.deepEqual(replay.tabKeys(), [selected]);
  assert.equal(replay.key(selected, "ArrowUp"), true);
  assert.deepEqual(replay.tabKeys(), [visible.at(-1).key]);
  assert.equal(activations.length, 0);
  assert.equal(replay.buttons.find((button) => button.props["aria-pressed"] === true).props["data-source-list-key"], selected);
  assert.equal(replay.props.selectedKey, selected);
  assert.equal(replay.key(visible.at(-1).key, "Enter"), false);
  assert.equal(replay.key(visible.at(-1).key, " "), false);
  assert.equal(activations.length, 0);
  replay.click(visible.at(-1).key);
  assert.equal(activations.length, 1); assert.strictEqual(activations[0], visible.at(-1));
});

test("descriptor scope changes retain only current membership and do not publish stale focus or source selection", () => {
  const group = groups.find((item) => item.results.length === 157);
  const visible = group.results.slice(0, 6).map(({ record }) => record); const calls = [];
  const props = { ...groupProps(group, visible, visible[0].key), onSelect: (record) => calls.push(record) };
  const replay = eventReplay(props); replay.focus(visible[5].key);
  assert.deepEqual(replay.tabKeys(), [visible[5].key]);
  replay.render({ ...props, visibleRecords: visible.slice(0, 4) });
  assert.deepEqual(replay.tabKeys(), [visible[0].key]);
  replay.render({ ...props, visibleRecords: visible.slice(1, 4) });
  assert.deepEqual(replay.tabKeys(), [visible[1].key]);
  replay.render({ ...props, visibleRecords: [] });
  assert.deepEqual(replay.tabKeys(), []);
  replay.render({ ...props, visibleRecords: [...visible].reverse() });
  assert.deepEqual(replay.tabKeys(), [visible[0].key]);
  assert.equal(calls.length, 0);
});

test("independent source namespaces retain full keys and native modifier/Tab behavior", () => {
  const actual = groups.find((item) => item.namespace === "russ-2021").results.slice(0, 3).map(({ record }) => record);
  const calls = [];
  const replay = eventReplay({ ...groupProps({ laneLabel: "Molecular population", namespace: "russ-2021", results: actual.map(record => ({ record })) }, actual), onSelect: (record) => calls.push(record) });
  const key = actual[0].key;
  for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) {
    assert.equal(replay.key(key, "ArrowDown", { [modifier]: true }), false);
  }
  for (const event of ["Tab", "ArrowLeft", "ArrowRight", "Escape"]) assert.equal(replay.key(key, event), false);
  assert.deepEqual(replay.tabKeys(), [key]); assert.equal(calls.length, 0);
  const otherGroup = groups.find((item) => item.namespace !== "russ-2021" && item.results.length >= 3);
  const others = otherGroup.results.slice(0, 3).map(({ record }) => record);
  replay.render({ ...groupProps(otherGroup, others), onSelect: (record) => calls.push(record) });
  assert.deepEqual(replay.tabKeys(), [others[0].key]);
  assert.ok(!replay.tabKeys().includes(key)); assert.equal(calls.length, 0);
  assert.throws(() => renderToStaticMarkup(React.createElement(Component, groupProps(otherGroup, [others[0], others[0]]))), /unique full-string keys/);
});
