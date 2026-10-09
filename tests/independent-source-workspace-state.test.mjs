import assert from "node:assert/strict";
import test from "node:test";
import { independentSourceObjectKey, listIndependentSourceObjects } from "../app/independent-source-objects.js";
import { independentSourceReplayExport, independentSourceVisiblePayload, readIndependentSourceLocation, validateIndependentSourceViewReplay, writeIndependentSourceLocation } from "../app/independent-source-workspace-state.js";

const object = (sourceId, releaseId, sourceObjectId) => {
  const record = { sourceId, releaseId, objectKind: "cell_root", sourceObjectId };
  return { ...record, key: independentSourceObjectKey(record), title: `Exact source root ${sourceObjectId}` };
};
const first = object("source-a", "v1", "648518346349516051"), second = object("source-b", "v1", "648518346349516051");
const index = { sources: [{ id: "source-a", sourceId: "source-a" }, { id: "source-b", sourceId: "source-b" }], fixedRecords: [first, second], collections: [] };

test("source URL roundtrip retains full large IDs, existing atlas query and hash", () => {
  const url = writeIndependentSourceLocation("https://example.org/objects?camera=home#notes", { sourceId: first.sourceId, key: first.key, query: "root & 051", page: 2 });
  assert.match(url, /camera=home/); assert.match(url, /#notes$/);
  assert.equal(new URL(url, "https://example.org").searchParams.get("objectQuery"), "root & 051");
  const matching = writeIndependentSourceLocation(url, { sourceId: first.sourceId, key: first.key, query: "051", page: 2 });
  assert.deepEqual(readIndependentSourceLocation(index, matching), { sourceId: first.sourceId, key: first.key, query: "051", page: 0, error: null });
  assert.match(readIndependentSourceLocation(index, url).error, /outside the current search results/);
});

test("restored pages clamp to actual filtered rows before any offset multiplication", () => {
  const rows = Array.from({ length: 53 }, (_, row) => ({ ...object("source-a", "v1", String(row)), title: row < 28 ? `needle ${row}` : `other ${row}` }));
  const pageIndex = { ...index, fixedRecords: rows };
  for (const requestedPage of [Number.MAX_SAFE_INTEGER, 999999, 53, 2]) {
    const url = writeIndependentSourceLocation("/objects", { sourceId: "source-a", key: null, query: "", page: requestedPage });
    const restored = readIndependentSourceLocation(pageIndex, url);
    assert.equal(restored.page, 2);
    assert.ok(Number.isSafeInteger(restored.page * 25));
    const last = listIndependentSourceObjects(pageIndex, { sourceId: restored.sourceId, query: restored.query, offset: restored.page * 25, limit: 25 });
    assert.equal(last.total, 53); assert.equal(last.records.length, 3);
  }
  const filtered = readIndependentSourceLocation(pageIndex, "/objects?objectSource=source-a&objectQuery=needle&objectPage=999999");
  assert.equal(filtered.page, 1, "28 filtered rows have two pages despite a larger source denominator");
  const empty = readIndependentSourceLocation(pageIndex, "/objects?objectSource=source-a&objectQuery=unmatched&objectPage=9007199254740991");
  assert.equal(empty.page, 0); assert.equal(empty.error, null);
  const missing = readIndependentSourceLocation(pageIndex, "/objects?objectSource=missing&objectPage=999999");
  assert.equal(missing.sourceId, "missing"); assert.equal(missing.page, 0); assert.match(missing.error, /Unknown source/);
  const noSourceParameter = readIndependentSourceLocation(pageIndex, "/objects?objectPage=999999");
  assert.equal(noSourceParameter.sourceId, "source-a"); assert.equal(noSourceParameter.page, 2);
  const noSources = readIndependentSourceLocation({ sources: [], fixedRecords: [], collections: [] }, "/objects?objectPage=999999");
  assert.equal(noSources.page, 0); assert.match(noSources.error, /Unknown source/);
  for (const value of ["-1", "1.5", "Infinity", "9007199254740992", "NaN"]) {
    assert.equal(readIndependentSourceLocation(pageIndex, `/objects?objectPage=${value}`).page, 0);
  }
});

test("URL rejects a wrong release, unknown source and conflicting object namespace without a fallback", () => {
  const unknown = object("source-a", "v2", first.sourceObjectId);
  for (const selection of [{ sourceId: "source-a", key: unknown.key }, { sourceId: "source-b", key: first.key }, { sourceId: "missing", key: null }]) {
    const restored = readIndependentSourceLocation(index, writeIndependentSourceLocation("/objects", { ...selection, query: "", page: 0 }));
    assert.ok(restored.error); assert.equal(restored.key, selection.key);
  }
  assert.equal(readIndependentSourceLocation(index, "/objects?objectPage=9007199254740999").page, 0);
});

test("changing or clearing the selection hides the old loaded payload synchronously", () => {
  const payload = { key: first.key, receipt: { sourceId: "source-a" } };
  const ready = { key: first.key, status: "ready", payload };
  assert.equal(independentSourceVisiblePayload(first.key, ready), payload);
  assert.equal(independentSourceVisiblePayload(second.key, ready), null);
  assert.equal(independentSourceVisiblePayload(null, ready), null);
  assert.equal(independentSourceVisiblePayload(first.key, { ...ready, status: "error" }), null);
});

test("view export binds current verified object, actual layers and source frame", () => {
  const payload = { key: first.key, receipt: { objectKey: first.key } };
  const view = { key: first.key, revision: "r1", layers: [{ id: "nucleus", requested: false, actual: false }], camera: { position: [1, 2, 3] }, displayTransform: { coordinateFrame: "source-native" } };
  const exported = independentSourceReplayExport(first, payload, view, "2.91.0-research.1");
  assert.equal(exported.object.sourceObjectId, "648518346349516051");
  assert.equal(exported.view.layers[0].actual, false);
  assert.throws(() => independentSourceReplayExport(second, payload, view, "2.91.0-research.1"), /current verified object/);
  assert.throws(() => independentSourceReplayExport(first, null, view, "2.91.0-research.1"), /current verified object/);
});

test("replay rejects changed files, versions, camera and coordinate frames before applying a view", () => {
  const current = { ...first, files: [{ checksum: { algorithm: "SHA-256", digest: "a".repeat(64) } }], coordinateFrame: { frame: "source-native", unit: "nm", dimensions: 3 }, viewer: { kind: "microns_mesh", component: "cell" }, components: [{ id: "cell" }] };
  const currentIndex = { ...index, fixedRecords: [current] };
  const view = { key: current.key, status: "rendered", representation: "microns_mesh", revision: "r1", layers: [{ id: "cell", requested: true, actual: true }], camera: { position: [1, 2, 3], target: [0, 0, 0], up: [0, 1, 0], projection: "perspective", fov: 38, near: .1, far: 4000 }, displayTransform: { centerNative: [1, 2, 3], scale: 2, coordinateFrame: current.coordinateFrame }, renderer: { name: "three", version: "185", width: 600, height: 400 } };
  const saved = independentSourceReplayExport(current, { key: current.key, receipt: { objectKey: current.key, status: "verified" } }, view, "2.91.0-research.1");
  assert.equal(validateIndependentSourceViewReplay(currentIndex, saved, "2.91.0-research.1").record.key, current.key);
  for (const mutate of [
    (value) => { value.applicationVersion = "2.90.0-research.1"; },
    (value) => { value.object.files[0].checksum.digest = "b".repeat(64); },
    (value) => { value.view.camera.position = [1, 2, null]; },
    (value) => { value.view.displayTransform.coordinateFrame.unit = "µm"; },
  ]) {
    const changed = structuredClone(saved); mutate(changed);
    assert.throws(() => validateIndependentSourceViewReplay(currentIndex, changed, "2.91.0-research.1"));
  }
});

const VERSION = "2.91.0-research.1";
function replayFixture(kind, componentIds, layerIds, component) {
  const record = { ...first, files: [{ checksum: { algorithm: "SHA-256", digest: "a".repeat(64) } }], coordinateFrame: { frame: "source-native", unit: "nanometre", unitStatus: "source_reported", dimensions: 3 },
    viewer: { kind, ...(component ? { component } : {}) }, components: componentIds.map((id) => ({ id })) };
  const view = { key: record.key, representation: kind, status: "rendered", revision: "r1", verificationRevision: 1,
    layers: layerIds.map((id) => ({ id, requested: true, actual: true })),
    camera: { position: [1, 2, 3], target: [0, 0, 0], up: [0, 1, 0], projection: "perspective", fov: 38, near: .1, far: 4000 },
    displayTransform: { centerNative: [1, 2, 3], scale: 2, coordinateFrame: record.coordinateFrame },
    renderer: { name: "three", version: "185", width: 600, height: 400 }, loadMilliseconds: 4, renderMilliseconds: 12 };
  const saved = independentSourceReplayExport(record, { key: record.key, receipt: { objectKey: record.key, status: "verified" } }, view, VERSION);
  return { record, saved, currentIndex: { ...index, fixedRecords: [record] } };
}
function checkReplay(fixture, document = fixture.saved) { return validateIndependentSourceViewReplay(fixture.currentIndex, document, VERSION); }

test("replay layer sets are source/viewer/component scoped and permit a present but hidden native DER", () => {
  const fixtures = [
    replayFixture("native_contours", ["soma-contours"], ["source-contour-traces"]),
    replayFixture("native_contours", ["soma-contours", "derived-open-shell"], ["source-contour-traces", "derived-open-shell"]),
    replayFixture("microns_mesh", ["cell", "nucleus"], ["cell", "nucleus"], "cell"),
    replayFixture("microns_mesh", ["nucleus"], ["nucleus"], "nucleus"),
    replayFixture("banc_swc", ["swc-centerline", "nucleus-point"], ["source-swc-centerline", "source-points"]),
    replayFixture("banc_nucleus_point", ["nucleus-point"], ["source-points"]),
    replayFixture("palm_detection", ["localization-point"], ["source-points"]),
  ];
  for (const fixture of fixtures) {
    assert.equal(checkReplay(fixture).record.key, fixture.record.key);
    for (const mutate of [
      (value) => { value.view.layers.push({ id: "invented-internal-object", requested: false, actual: false }); },
      (value) => { value.view.layers.push(structuredClone(value.view.layers[0])); },
      (value) => { value.view.layers.shift(); },
      (value) => { value.view.layers[0].requested = false; value.view.layers[0].actual = true; },
    ]) {
      const changed = structuredClone(fixture.saved); mutate(changed); assert.throws(() => checkReplay(fixture, changed));
    }
  }
  const native = fixtures[1], hidden = structuredClone(native.saved);
  hidden.view.layers[1] = { id: "derived-open-shell", requested: false, actual: false };
  assert.deepEqual(checkReplay(native, hidden).view.layers[1], { id: "derived-open-shell", requested: false, actual: false });
  const notLoaded = structuredClone(native.saved); notLoaded.view.layers.pop();
  assert.equal(checkReplay(native, notLoaded).view.layers.length, 1, "admitted DER need not have been loaded");
  const unadmitted = structuredClone(fixtures[0].saved); unadmitted.view.layers.push(hidden.view.layers[1]);
  assert.throws(() => checkReplay(fixtures[0], unadmitted), /layers/);
  const nucleus = fixtures[3], foreignCell = structuredClone(nucleus.saved); foreignCell.view.layers.push({ id: "cell", requested: true, actual: true });
  assert.throws(() => checkReplay(nucleus, foreignCell), /layers/);
});

test("rendered replay requires a camera, source transform and valid THREE dimensions/actual layers", () => {
  const fixture = replayFixture("microns_mesh", ["cell"], ["cell"], "cell");
  const mutations = [
    (value) => { value.view.camera = null; }, (value) => { value.view.displayTransform = null; },
    (value) => { value.view.status = "unknown"; }, (value) => { value.view.renderer.name = "text"; },
    (value) => { value.view.renderer.version = " "; }, (value) => { value.view.layers[0].actual = false; },
    (value) => { value.verification.status = "link_only"; },
  ];
  for (const dimension of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER]) {
    mutations.push((value) => { value.view.renderer.width = dimension; });
    mutations.push((value) => { value.view.renderer.height = dimension; });
  }
  for (const mutate of mutations) {
    const changed = structuredClone(fixture.saved); mutate(changed); assert.throws(() => checkReplay(fixture, changed));
  }
  const allHidden = structuredClone(fixture.saved); allHidden.view.layers[0] = { id: "cell", requested: false, actual: false };
  assert.equal(checkReplay(fixture, allHidden).view.status, "rendered", "a valid blank frame with intentionally hidden source layers can replay");
});

test("text-only and link-only replay retain availability and cannot claim a rendered camera or layer", () => {
  const geometry = replayFixture("native_contours", ["soma-contours", "derived-open-shell"], ["source-contour-traces", "derived-open-shell"]);
  const text = structuredClone(geometry.saved);
  text.view.status = "text-only"; text.view.layers.forEach((layer) => { layer.actual = false; });
  text.view.camera = null; text.view.displayTransform = null; text.view.renderer = { name: "text", version: null, width: 0, height: 0 };
  assert.equal(checkReplay(geometry, text).view.status, "text-only");
  for (const mutate of [
    (value) => { value.view.status = "link-only"; }, (value) => { value.view.layers[0].actual = true; },
    (value) => { value.view.camera = geometry.saved.view.camera; }, (value) => { value.view.displayTransform = geometry.saved.view.displayTransform; },
    (value) => { value.view.renderer.width = 600; }, (value) => { value.view.renderer.name = "three"; },
    (value) => { value.view.renderer.version = "185"; }, (value) => { value.verification.status = "unavailable"; },
  ]) {
    const changed = structuredClone(text); mutate(changed); assert.throws(() => checkReplay(geometry, changed));
  }
  const link = replayFixture("link_only", ["image", "semantic-mask"], []);
  link.saved.view = { ...link.saved.view, status: "link-only", camera: null, displayTransform: null, renderer: { name: "text", version: null, width: 0, height: 0 } };
  link.saved.verification.status = "link_only";
  assert.equal(checkReplay(link).view.status, "link-only");
  for (const mutate of [
    (value) => { value.view.status = "text-only"; }, (value) => { value.view.status = "rendered"; },
    (value) => { value.view.layers = [{ id: "image", requested: true, actual: false }]; },
    (value) => { value.view.renderer.height = 1; }, (value) => { value.verification.status = "verified"; },
  ]) {
    const changed = structuredClone(link.saved); mutate(changed); assert.throws(() => checkReplay(link, changed));
  }
});
