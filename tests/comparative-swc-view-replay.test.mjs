import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createComparativeSwcReferenceIndex, loadComparativeSwcReference } from "../app/comparative-swc-reference.js";
import { comparativeSourceCoDisplayRelationship, comparativeSourceIdentityHierarchy, exportComparativeSwcView, validateComparativeSwcViewReplay } from "../app/comparative-swc-view-replay.js";
const contract = JSON.parse(await readFile(new URL("../data/comparative-swc-reference-0.1.json", import.meta.url), "utf8"));
const index = createComparativeSwcReferenceIndex(contract), VERSION = "2.91.0-research.1";
const fetchImpl = async (path) => { const data = await readFile(new URL(`../public${path}`, import.meta.url)); return { ok: true, arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) }; };
const payloads = await Promise.all(index.objects.map((object) => loadComparativeSwcReference(object, { fetchImpl })));
function fixture(position = 0) {
  const object = index.objects[position], payload = payloads[position], metrics = object.context.computedFromExactSwc;
  const view = { key: object.key, revision: `${object.key}:3:rendered1`, verificationRevision: 3, representation: "comparative_swc", status: "rendered",
    layers: [{ id: "source-swc-centerline", requested: true, actual: true }],
    camera: { position: [230, 190, 300], target: [0, 0, 0], up: [0, 1, 0], projection: "perspective", fov: 38, near: .1, far: 4000 },
    displayTransform: { centerNative: metrics.boundsMicrometre.min.map((value, axis) => (value + metrics.boundsMicrometre.max[axis]) / 2), scale: 200 / Math.max(...metrics.extentMicrometre), coordinateFrame: object.coordinateFrame },
    renderer: { name: "three", version: "185", width: 600, height: 400 }, clipping: { globalPlanes: [], localClippingEnabled: false }, loadMilliseconds: 4, renderMilliseconds: 12 };
  return { object, payload, view, document: exportComparativeSwcView(index, object.key, payload, view, VERSION, 3) };
}

test("both exact SWC sources capture and replay actual camera/layers against their current loader receipts", () => {
  for (let position = 0; position < 2; position++) {
    const f = fixture(position), replay = validateComparativeSwcViewReplay(index, f.document, f.payload, VERSION, "185");
    assert.equal(replay.record.key, f.object.key); assert.deepEqual(replay.view, f.view);
    assert.equal(f.document.verification.verifiedFiles.length, 3);
    assert.equal(f.document.scientificScope.mouseCensusAdditions, 0);
  }
});

test("source reconstruction identity retains unknown physical cell/specimen/section and co-display semantics", () => {
  for (const object of index.objects) {
    const h = comparativeSourceIdentityHierarchy(index, object.key);
    assert.equal(h.nodes.component.id, object.sourceObjectId);
    assert.equal(h.nodes.cell.id, null); assert.equal(h.nodes.section.id, null); assert.equal(h.nodes.specimen.id, null);
    assert.equal(h.geometryTransferAllowed, false);
  }
  const relation = comparativeSourceCoDisplayRelationship(index);
  assert.equal(relation.type, "co_display_only"); assert.equal(relation.sameCellInternalAdmission, false);
});

test("the current object, renderer generation and verified asset set are mandatory at capture", () => {
  const f = fixture();
  assert.throws(() => exportComparativeSwcView(index, f.object.key, f.payload, f.view, VERSION, 4), /generation/);
  assert.throws(() => exportComparativeSwcView(index, index.objects[1].key, f.payload, f.view, VERSION, 3), /current source loader/);
  const broken = structuredClone(f.payload); broken.receipt.verifiedFiles.pop();
  assert.throws(() => exportComparativeSwcView(index, f.object.key, broken, f.view, VERSION, 3), /asset receipts/);
});

test("all-hidden centerline views replay, but invented/missing layers or requested/actual disagreement fail", () => {
  const f = fixture(), hidden = structuredClone(f.document); hidden.view.layers[0] = { id: "source-swc-centerline", requested: false, actual: false };
  assert.equal(validateComparativeSwcViewReplay(index, hidden, f.payload, VERSION).view.layers[0].actual, false);
  for (const mutate of [(d) => { d.view.layers = []; }, (d) => { d.view.layers[0].actual = false; }, (d) => { d.view.layers.push({ id: "invented-membrane", requested: false, actual: false }); }]) {
    const changed = structuredClone(f.document); mutate(changed); assert.throws(() => validateComparativeSwcViewReplay(index, changed, f.payload, VERSION));
  }
});

test("altered source file evidence, species/frame/scope and historical rat conflict cannot be imported", () => {
  const f = fixture(1);
  for (const mutate of [(d) => { d.verification.verifiedFiles[0].checksum.digest = "f".repeat(64); }, (d) => { d.object.context.species = "mouse"; }, (d) => { d.object.context.conflicts = []; }, (d) => { d.view.displayTransform.coordinateFrame.frame = "atlas"; }, (d) => { d.scientificScope.sameCellJoins = 1; }]) {
    const changed = structuredClone(f.document); mutate(changed); assert.throws(() => validateComparativeSwcViewReplay(index, changed, f.payload, VERSION));
  }
});

test("a finite but false display center/scale cannot override exact source-derived bounds", () => {
  const f = fixture();
  for (const mutate of [(d) => { d.view.displayTransform.centerNative[0] += 1; }, (d) => { d.view.displayTransform.scale *= 2; }]) {
    const changed = structuredClone(f.document); mutate(changed); assert.throws(() => validateComparativeSwcViewReplay(index, changed, f.payload, VERSION), /exact source geometry bounds/);
  }
});

test("zero or parallel camera bases, nonfinite timing and wrong current renderer cannot replay", () => {
  const f = fixture();
  for (const mutate of [(d) => { d.view.camera.up = [0, 0, 0]; }, (d) => { d.view.camera.position = [0, 0, 0]; }, (d) => { d.view.camera.up = d.view.camera.position; }, (d) => { d.view.renderMilliseconds = -1; }, (d) => { d.view.loadMilliseconds = Infinity; }]) {
    const changed = structuredClone(f.document); mutate(changed); assert.throws(() => validateComparativeSwcViewReplay(index, changed, f.payload, VERSION));
  }
  assert.throws(() => validateComparativeSwcViewReplay(index, f.document, f.payload, VERSION, "186"), /renderer version/);
});

test("same-version replay rejects lost hierarchy, changed parents, another source payload and text-only status", () => {
  const f = fixture();
  for (const mutate of [(d) => { delete d.sourceIdentity; }, (d) => { d.sourceIdentity.nodes.cell.id = "invented-cell"; }, (d) => { d.applicationVersion = "2.90.0-research.1"; }, (d) => { d.view.verificationRevision = 0; }, (d) => { d.view.status = "text-only"; }]) {
    const changed = structuredClone(f.document); mutate(changed); assert.throws(() => validateComparativeSwcViewReplay(index, changed, f.payload, VERSION));
  }
  assert.throws(() => validateComparativeSwcViewReplay(index, f.document, payloads[1], VERSION), /current source loader/);
});

test("actual clipping receipts retain camera near/far and refuse absent or invented custom planes", () => {
  const f = fixture();
  assert.equal(f.document.view.camera.near, .1); assert.equal(f.document.view.camera.far, 4000);
  assert.deepEqual(f.document.view.clipping, { globalPlanes: [], localClippingEnabled: false });
  for (const mutate of [(d) => { delete d.view.clipping; }, (d) => { d.view.clipping.localClippingEnabled = true; }, (d) => { d.view.clipping.globalPlanes = [{ normal: [1, 0, 0], constant: 0 }]; }]) {
    const changed = structuredClone(f.document); mutate(changed); assert.throws(() => validateComparativeSwcViewReplay(index, changed, f.payload, VERSION), /clipping/);
  }
});
