import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as indexApi from "../app/research-explorer-index.js";
import * as comparisonApi from "../app/molecular-concordance.js";
import * as bookmarkApi from "../app/molecular-concordance-bookmark.js";

const require = createRequire(import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const sourceIndexBytes = await readFile(new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url));
const sourceManifest = await readJson("public/data/research_explorer_index_v1/asset-manifest.json");
const fsFetch = async (path) => {
  const bytes = await readFile(new URL(`../public${path}`, import.meta.url));
  return { ok: true, status: 200, json: async () => JSON.parse(bytes), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const index = await indexApi.loadVerifiedResearchExplorerIndex({ fetchImpl: fsFetch });
const records = index.records.filter((record) => record.focusKind === "molecular_profile");
const sourceHash = createHash("sha256").update(sourceIndexBytes).digest("hex");
const authority = { records, verifiedDecodedSha256: indexApi.researchExplorerLoadingReceipt(index).verifiedDecodedSha256 };
const readyContext = { indexState: { status: "ready", index, records: index.records, error: "" } };
const byId = (id) => records.find((record) => record.focusId === id);
const ids = ["alkaslasi-2021:GSE167597:I1", "alkaslasi-2021:GSE167597:I2", "hayashi-2018:GSE108788:cluster-1", "sathyamurthy-2018:DE-1"];
const sourceScopes = [];
for (const [namespace, name] of [["sathyamurthy-2018", "sathyamurthy-source-taxonomy-0.1"], ["alkaslasi-2021:GSE167597", "alkaslasi-cholinergic-source-taxonomy-0.1"], ["haring-2018:GSE103840", "haring-dorsal-horn-source-taxonomy-0.1"], ["hayashi-2018:GSE108788", "hayashi-v2a-source-taxonomy-0.1"], ["roome-2026:GSE291462", "roome-dil-source-taxonomy-0.1"]]) {
  const data = await readJson(`data/${name}.json`);
  sourceScopes.push({ namespace, path: `data/${name}.json`, releaseId: data.releaseId, lifeStage: data.scope.lifeStage ?? data.scope.lifeStages.join(" · "), profileIds: data.profiles.map((row) => row.id) });
}
const viewFor = (keys = ids.slice(0, 2).map((id) => byId(id).key)) => ({ ...bookmarkApi.emptyMolecularConcordanceView(), selectedKeys: keys, anchorKey: keys[0] ?? "" });
const paramsFor = (view = viewFor(), input = "unrelated=a&unrelated=b&focusKind=anatomy_label&focusId=original") => bookmarkApi.makeMolecularConcordanceBookmarkParams(input, authority, view);

test("the real verified canonical index binds all 387 full molecular keys without admitting or substituting a profile", () => {
  assert.equal(records.length, 387);
  assert.equal(new Set(records.map((row) => row.namespace)).size, 10);
  assert.equal(authority.verifiedDecodedSha256, sourceHash);
  assert.equal(sourceHash, sourceManifest.index.sha256);
  const before = JSON.stringify(records);
  for (const record of records) {
    const view = viewFor([record.key]);
    const restored = bookmarkApi.readMolecularConcordanceBookmark(paramsFor(view), authority);
    assert.equal(restored.status, "ready");
    assert.deepEqual(restored.view, view);
    assert.equal(records.find((row) => row.key === restored.view.selectedKeys[0]), record);
  }
  assert.equal(JSON.stringify(records), before);
  assert.equal(bookmarkApi.readMolecularConcordanceBookmark("unrelated=x", authority).status, "default");
});

test("ordered 2–4 profile baskets and exact anchors survive independent candidate filters, empty results and filtered pagination", () => {
  for (const count of [2, 3, 4]) {
    const keys = ids.slice(0, count).map((id) => byId(id).key).reverse();
    const view = { ...viewFor(keys), anchorKey: keys.at(-1), namespace: "roome-2026:GSE291462", page: 12 };
    assert.deepEqual(bookmarkApi.readMolecularConcordanceBookmark(paramsFor(view), authority).view, view);
    assert.equal(bookmarkApi.filterMolecularConcordanceCandidates(records, view).length, 157);
    const emptyCandidates = { ...view, query: "no-source-label-matches-this-string", page: 0 };
    assert.equal(bookmarkApi.filterMolecularConcordanceCandidates(records, emptyCandidates).length, 0);
    assert.deepEqual(bookmarkApi.readMolecularConcordanceBookmark(paramsFor(emptyCandidates), authority).view, emptyCandidates);
  }
  assert.throws(() => paramsFor({ ...viewFor(), namespace: "roome-2026:GSE291462", page: 14 }), /outside/);
});

test("foreign, stale, malformed, duplicate, nonmolecular and out-of-page bookmarks clear the whole saved basket", () => {
  const negatives = [];
  const changed = (key, value) => { const p = paramsFor(); p.set(key, value); return p; };
  negatives.push(changed("compareVersion", "2"), changed("compareIndex", "f".repeat(64)), changed("compareIndex", "not-a-hash"));
  for (const key of ["compareVersion", "compareIndex", "compareKeys"]) { const p = paramsFor(); p.delete(key); negatives.push(p); }
  for (const key of bookmarkApi.MOLECULAR_CONCORDANCE_BOOKMARK_KEYS) { const p = paramsFor(); p.append(key, p.get(key) ?? ""); p.append(key, "duplicate"); negatives.push(p); }
  for (const keys of ["broken JSON", "{}", "null", '["I1"]', JSON.stringify([records[0].key, records[0].key]), JSON.stringify(records.slice(0, 5).map((row) => row.key)), JSON.stringify([index.records.find((row) => row.focusKind === "morphology_record").key]), JSON.stringify(["molecular_profile:foreign-release:I1"])]) negatives.push(changed("compareKeys", keys));
  negatives.push(changed("compareAnchor", records.at(-1).key), changed("compareKeys", "[]"), changed("compareNamespace", "foreign-source"), changed("compareQuery", "x".repeat(181)));
  for (const page of ["-1", "01", "0.5", "Infinity", "9007199254740992", "33"]) negatives.push(changed("comparePage", page));
  negatives.push(changed("compareQuery", "no matching marker here"));
  negatives.at(-1).set("comparePage", "1");
  for (const params of negatives) {
    const result = bookmarkApi.readMolecularConcordanceBookmark(params, authority);
    assert.equal(result.status, "invalid", params.toString());
    assert.ok(result.error);
    assert.deepEqual(result.view, bookmarkApi.emptyMolecularConcordanceView());
  }
  assert.equal(bookmarkApi.readMolecularConcordanceBookmark(paramsFor(), { ...authority, records: [...records, records[0]] }).status, "invalid");
  assert.equal(bookmarkApi.readMolecularConcordanceBookmark(paramsFor(), { ...authority, verifiedDecodedSha256: "" }).status, "invalid");
});

test("reset and canonical encoding retain unrelated duplicate parameters and source focus exactly", () => {
  const params = paramsFor({ ...viewFor(), query: "Pax2 ", namespace: "alkaslasi-2021:GSE167597" });
  assert.deepEqual(params.getAll("unrelated"), ["a", "b"]);
  assert.equal(params.get("focusId"), "original");
  const reset = bookmarkApi.makeMolecularConcordanceBookmarkParams(params, authority, bookmarkApi.emptyMolecularConcordanceView(), { clear: true });
  assert.deepEqual([...reset], [["unrelated", "a"], ["unrelated", "b"], ["focusKind", "anatomy_label"], ["focusId", "original"]]);
  assert.deepEqual(bookmarkApi.readMolecularConcordanceBookmark(reset, authority).view, bookmarkApi.emptyMolecularConcordanceView());
});

test("restored profiles produce byte-equivalent original scientific JSON and CSV with unknowns and zero joins retained", () => {
  const keys = [byId("alkaslasi-2021:GSE167597:I1").key, byId("hayashi-2018:GSE108788:cluster-1").key, records.find((row) => row.namespace === "cano-gomez-2026:GSE318731").key, byId("haring-2018:GSE103840:Gaba1").key];
  const view = { ...viewFor(keys), anchorKey: keys[1] };
  const restored = bookmarkApi.readMolecularConcordanceBookmark(paramsFor(view), authority).view;
  const original = comparisonApi.buildMolecularConcordance(records, { ...view, sourceScopes });
  const replay = comparisonApi.buildMolecularConcordance(records, { ...restored, sourceScopes });
  assert.equal(JSON.stringify(replay), JSON.stringify(original));
  assert.equal(comparisonApi.molecularConcordanceCsv(replay), comparisonApi.molecularConcordanceCsv(original));
  assert.equal(replay.sourceDenominator.value, 387);
  assert.equal(replay.identity, "not_established");
  assert.equal(replay.sameCellJoinCount + replay.sameTypeJoinCount + replay.generatedGeometryCount + replay.sourceDenominator.deduplicationCount, 0);
  assert.equal(replay.profiles.find((row) => row.namespace === "cano-gomez-2026:GSE318731").markers.status, "missing");
  assert.match(replay.profiles.find((row) => row.namespace === "hayashi-2018:GSE108788").fields.life_stage.rawValue, /P0 neonatal/);
});

const componentSource = await readFile(new URL("../app/MolecularConcordanceWorkbench.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(componentSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
function loadComponent(react, context, globals = {}) {
  const compiledModule = { exports: {} };
  const localRequire = (name) => {
    if (name === "react") return react;
    if (name === "./ResearchActiveRecordProvider") return { useResearchActiveRecord: () => context.value };
    if (name === "./research-explorer-index.js") return indexApi;
    if (name === "./molecular-concordance.js") return comparisonApi;
    if (name === "./molecular-concordance-bookmark.js") return bookmarkApi;
    if (name.endsWith(".css")) return {};
    if (name.startsWith("../data/")) return require(fileURLToPath(new URL(name, new URL("../app/", import.meta.url))));
    return require(name);
  };
  vm.runInNewContext(compiled, { module: compiledModule, exports: compiledModule.exports, require: localRequire, URL, Blob, console, ...globals }, { filename: "MolecularConcordanceWorkbench.candidate.cjs" });
  return compiledModule.exports.default;
}

test("actual React SSR exposes current layout but no comparison or export before client bookmark restoration", () => {
  for (const context of [readyContext, { indexState: { status: "verifying", index: null, records: [], error: "" } }, { indexState: { status: "unavailable", index: null, records: [], error: "Source bytes rejected" } }, { indexState: { ...readyContext.indexState, index: structuredClone(index) } }]) {
    const Component = loadComponent(React, { value: context });
    const html = renderToStaticMarkup(React.createElement(Component));
    assert.match(html, /class="molecular-concordance"/);
    assert.doesNotMatch(html, /Export evidence JSON|Export comparison CSV|Link to this comparison/);
    if (context === readyContext) assert.match(html, /387 source profiles across 10 namespaces/);
    if (context.indexState.index && context !== readyContext) assert.match(html, /verified source-index receipt is unavailable/);
  }
});

function nodes(tree, match) {
  const found = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object" || !node.props) return;
    if (match(node)) found.push(node);
    walk(node.props.children);
  }
  walk(tree); return found;
}
function textOf(tree) {
  if (Array.isArray(tree)) return tree.map(textOf).join("");
  if (tree == null || typeof tree === "boolean") return "";
  return typeof tree === "object" ? textOf(tree.props?.children) : String(tree);
}
function descriptorHarness(initialUrl, initialContext = readyContext) {
  const context = { value: initialContext }, slots = [], listeners = new Set(), writes = [], downloaded = [];
  const routerState = { __NA: true, tree: ["exact-existing-router-state"] };
  let url = new URL(initialUrl), cursor = 0, dirty = false, pending = [], tree;
  const equal = (a, b) => a && b && a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
  const fakeReact = {
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === "function" ? initial() : initial }; return [slots[i].value, (next) => { const value = typeof next === "function" ? next(slots[i].value) : next; if (!Object.is(value, slots[i].value)) { slots[i].value = value; dirty = true; } }]; },
    useMemo(callback, deps) { const i = cursor++; if (!slots[i] || !equal(slots[i].deps, deps)) slots[i] = { value: callback(), deps }; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++; if (!slots[i] || !equal(slots[i].deps, deps)) { const old = slots[i]; slots[i] = { deps, cleanup: old?.cleanup }; pending.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
  };
  const location = {}; for (const key of ["href", "pathname", "search", "hash"]) Object.defineProperty(location, key, { get: () => url[key] });
  const window = { location, history: { state: routerState, pushState(state, _, href) { assert.equal(state, routerState); writes.push({ mode: "push", href }); url = new URL(href, url); }, replaceState(state, _, href) { assert.equal(state, routerState); writes.push({ mode: "replace", href }); url = new URL(href, url); } }, addEventListener(name, callback) { assert.equal(name, "popstate"); listeners.add(callback); }, removeEventListener(name, callback) { assert.equal(name, "popstate"); listeners.delete(callback); }, setTimeout(callback) { callback(); } };
  let blob;
  class DescriptorURL extends URL { static createObjectURL(value) { blob = value; return "blob:descriptor-only"; } static revokeObjectURL() {} }
  const document = { createElement() { return { click() { downloaded.push({ blob, name: this.download }); }, remove() {} }; }, body: { appendChild() {} } };
  const Component = loadComponent(fakeReact, context, { window, document, URL: DescriptorURL });
  function render({ commit = true } = {}) { cursor = 0; dirty = false; tree = Component(); if (commit) { let count = 0; do { const callbacks = pending; pending = []; callbacks.forEach((callback) => callback()); if (dirty) { dirty = false; cursor = 0; tree = Component(); } if (++count > 10) throw new Error("Descriptor effect loop"); } while (pending.length || dirty); } return tree; }
  function unmount() { slots.forEach((slot) => slot?.cleanup?.()); listeners.clear(); }
  return { render, context, writes, downloaded, listeners, get url() { return url; }, get tree() { return tree; }, pop(href) { url = new URL(href, url); [...listeners].forEach((callback) => callback()); return render(); }, unmount };
}

test("descriptor-only compiled component replay preserves basket/history/focus, fresh remount and exact original export", async () => {
  const initial = new URL("https://atlas.example/explore/cell-types/compare?unrelated=a&unrelated=b&focusKind=anatomy_label&focusId=original#reading-position");
  initial.search = paramsFor().toString();
  const h = descriptorHarness(initial.href);
  h.render(); assert.equal(h.listeners.size, 1); assert.equal(h.writes.length, 0);
  assert.ok(nodes(h.tree, (node) => node.type === "a" && textOf(node) === "Link to this comparison").length === 1);
  const anchor = nodes(h.tree, (node) => node.type === "select" && node.props.value === viewFor().anchorKey)[0];
  anchor.props.onChange({ target: { value: viewFor().selectedKeys[1] } }); h.render();
  assert.equal(h.writes.at(-1).mode, "push");
  const anchoredUrl = h.url.href;
  const input = nodes(h.tree, (node) => node.type === "input")[0];
  input.props.onChange({ target: { value: "no matching source label" } }); h.render();
  assert.equal(h.writes.at(-1).mode, "replace");
  assert.match(textOf(h.tree), /No matching exact source profile/);
  assert.equal(nodes(h.tree, (node) => node.type === "button" && textOf(node) === "Export evidence JSON").length, 1);
  assert.deepEqual(h.url.searchParams.getAll("unrelated"), ["a", "b"]); assert.equal(h.url.searchParams.get("focusId"), "original"); assert.equal(h.url.hash, "#reading-position");
  const exportButton = nodes(h.tree, (node) => node.type === "button" && textOf(node) === "Export evidence JSON")[0];
  exportButton.props.onClick();
  const exported = JSON.parse(await h.downloaded[0].blob.text());
  assert.equal(h.downloaded[0].name, "molecular-concordance.json");
  assert.equal(exported.anchorKey, viewFor().selectedKeys[1]); assert.equal(exported.identity, "not_established"); assert.equal(exported.sameCellJoinCount, 0);
  const historyCount = h.writes.length;
  h.pop(initial.href); assert.equal(h.writes.length, historyCount);
  assert.equal(nodes(h.tree, (node) => node.type === "select" && node.props.value === viewFor().anchorKey).length, 1);
  h.pop(anchoredUrl); assert.equal(h.writes.length, historyCount);
  const currentUrl = h.url.href; h.unmount(); assert.equal(h.listeners.size, 0);
  const reopened = descriptorHarness(currentUrl); reopened.render(); assert.equal(reopened.writes.length, 0);
  assert.equal(nodes(reopened.tree, (node) => node.type === "select" && node.props.value === viewFor().selectedKeys[1]).length, 1);
  const reset = nodes(reopened.tree, (node) => node.type === "button" && textOf(node) === "Reset comparison")[0];
  reset.props.onClick(); reopened.render();
  assert.ok(bookmarkApi.MOLECULAR_CONCORDANCE_BOOKMARK_KEYS.every((key) => !reopened.url.searchParams.has(key)));
  assert.deepEqual(reopened.url.searchParams.getAll("unrelated"), ["a", "b"]);
  assert.equal(nodes(reopened.tree, (node) => node.type === "button" && textOf(node) === "Export evidence JSON").length, 0);
  reopened.unmount();
});

test("descriptor-only source failure, changed verified byte hash, invalid URL and absent private receipt never expose an old comparison", async () => {
  const initial = `https://atlas.example/explore/cell-types/compare?${paramsFor()}`;
  const foreignAggregation = { ...readyContext, indexState: { ...readyContext.indexState, records: [...index.records, { ...records[0], key: "molecular_profile:foreign:I1", focusId: "foreign:I1", namespace: "foreign" }] } };
  const h = descriptorHarness(initial, foreignAggregation); h.render();
  assert.match(textOf(h.tree), /387 source profiles across 10 namespaces/);
  assert.doesNotMatch(textOf(h.tree), /foreign/);
  h.context.value = { indexState: { status: "unavailable", index: null, records: [], error: "Byte checksum rejected" } };
  h.render({ commit: false });
  assert.match(textOf(h.tree), /Byte checksum rejected/);
  assert.equal(nodes(h.tree, (node) => node.type === "button" && textOf(node) === "Export evidence JSON").length, 0);
  h.render();
  h.context.value = { indexState: { ...readyContext.indexState, index: structuredClone(index) } };
  h.render(); assert.match(textOf(h.tree), /verified source-index receipt is unavailable/);
  assert.equal(nodes(h.tree, (node) => node.type === "button" && textOf(node) === "Export evidence JSON").length, 0);
  // Negative fixture changes only trailing bytes; no source profile or root input is modified.
  const freshBytes = Buffer.concat([sourceIndexBytes, Buffer.from(" ")]);
  const freshManifest = structuredClone(sourceManifest); freshManifest.index.bytes = freshBytes.length; freshManifest.index.sha256 = createHash("sha256").update(freshBytes).digest("hex");
  const freshIndex = await indexApi.loadVerifiedResearchExplorerIndex({ fetchImpl: async (path) => ({ ok: true, status: 200, json: async () => freshManifest, arrayBuffer: async () => { assert.equal(path, indexApi.RESEARCH_EXPLORER_INDEX_URL); return freshBytes.buffer.slice(freshBytes.byteOffset, freshBytes.byteOffset + freshBytes.byteLength); } }) });
  h.context.value = { indexState: { status: "ready", index: freshIndex, records: freshIndex.records, error: "" } };
  h.render({ commit: false });
  assert.equal(nodes(h.tree, (node) => node.type === "button" && textOf(node) === "Export evidence JSON").length, 0);
  h.render(); assert.match(textOf(h.tree), /does not match the current checksum-verified source index/);
  assert.match(textOf(h.tree), /No saved profiles were substituted/);
  h.context.value = readyContext; h.render();
  assert.equal(nodes(h.tree, (node) => node.type === "button" && textOf(node) === "Export evidence JSON").length, 1);
  const invalid = new URL(initial); invalid.searchParams.append("compareAnchor", "duplicate");
  h.pop(invalid.href); assert.match(textOf(h.tree), /duplicate state parameters/);
  assert.equal(nodes(h.tree, (node) => node.type === "button" && textOf(node) === "Export evidence JSON").length, 0);
  assert.equal(h.writes.length, 0); h.unmount(); assert.equal(h.listeners.size, 0);
});
