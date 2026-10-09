import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { buildIndependentSourceObjectIndex, findIndependentSourceObject, independentSourceObjectKey,
  parseIndependentSourceObjectKey, listIndependentSourceObjects, exportIndependentSourceObject } from "../app/independent-source-objects.js";
import { loadIndependentSourceObject, verifyIndependentSourceObjectAsset } from "../app/independent-source-object-loader.js";
import { createIndependentSourceObjectState, beginIndependentSourceObjectRequest, settleIndependentSourceObjectSuccess,
  settleIndependentSourceObjectFailure, deriveIndependentSourceObjectState, createIndependentSourceObjectController } from "../app/independent-source-object-state.js";

const json = async (name) => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), "utf8"));
const nativeBase = await json("neurolucida-native-contour-admission-catalog-0.3");
const nativeDelta = await json("neurolucida-native-contour-admission-catalog-0.4");
const options = {
  nativeContourCatalog: { ...nativeDelta, baseCatalogSnapshot: nativeBase, records: [...nativeBase.records, ...nativeDelta.addedRecords] },
  micronsReference: await json("microns-observed-cell-nucleus-reference-0.1"),
  bancMorphologyRoute: await json("banc-v888-in14a018-morphology-route-0.1"),
  superClemReference: await json("super-clem-palm-localization-reference-0.1"),
  microStructFormerReference: await json("microstructformer-ultrastructure-reference-0.1"),
  nativeContourDerivedSurface: await json("native-contour-derived-soma-surface-0.1"),
  nativeContourCrosswalk: await json("neurolucida-dat-swc-crosswalk-0.1"),
  bancCandidateAudit: await json("banc-v888-candidate-audit-0.1"),
  nativeContourSourceContext: await json("native-contour-source-context-0.1"),
};
const index = buildIndependentSourceObjectIndex(options);
const first = (sourceId, objectKind) => listIndependentSourceObjects(index, { sourceId }).records.find((row) => !objectKind || row.objectKind === objectKind);
const bytesToBuffer = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const fsFetch = async (path) => {
  assert.match(path, /^\/data\//);
  const bytes = await readFile(new URL(`../public${path}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => bytesToBuffer(bytes) };
};
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("all five source indices preserve seven native records and separate scientific denominators", () => {
  assert.deepEqual(index.sources.map((source) => source.objectCount), [7, 2, 2, 18358, 540]);
  assert.deepEqual(first("native-contours").coordinateFrame, { frame: "Neurolucida_DAT_source_native_unregistered", unit: "micrometre", unitStatus: "source_reported", dimensions: 3 });
  assert.deepEqual(listIndependentSourceObjects(index, { sourceId: "native-contours" }).records.map((record) => record.sourceObjectId), ["45718", "45674", "50424", "50394", "50408", "108978", "249676"]);
  assert.ok(index.sources.every((source) => source.unit === "indexed_entries" && source.counts.every((count) => count.unit !== "cells" && count.scopeKey && count.derivedFrom)));
  assert.ok(index.sources.every((source) => source.id !== "bil-xenium"));
  assert.equal(index.fixedRecords.length, 11, "large source ranges do not eagerly duplicate object contracts");
});

test("all seven native contexts come from exact small source APIs with raw age/condition and field locators", async () => {
  assert.match(execFileSync(process.execPath, ["tools/build_native_contour_source_context.mjs", "--check"], { cwd: new URL("..", import.meta.url), encoding: "utf8" }), /seven exact small API/);
  const native = listIndependentSourceObjects(index, { sourceId: "native-contours" }).records;
  for (const record of native) {
    const context = record.context.sourceContext, receipt = context.sourceApiReceipt;
    assert.equal(context.neuronId, record.sourceObjectId);
    assert.equal(record.context.species, "mouse");
    assert.ok(!/See exact/.test(record.context.region));
    assert.equal(record.context.condition, "Control");
    assert.match(context.fields.species.locator, /#species$/);
    const sourcePath = receipt.path.startsWith("/data/") ? `public${receipt.path}` : receipt.path;
    const bytes = await readFile(new URL(`../${sourcePath}`, import.meta.url));
    assert.equal(bytes.length, receipt.bytes);
    assert.equal(digest(bytes), receipt.checksum.digest);
    const source = JSON.parse(bytes);
    assert.deepEqual(context.fields.region.value, source.brain_region);
    assert.deepEqual(context.fields.numericAge.value, { minimum: source.min_age, maximum: source.max_age, scale: source.age_scale });
  }
  const child = native.find((record) => record.sourceObjectId === "108978");
  assert.equal(child.context.sourceContext.fields.numericAge.status, "unknown");
  assert.match(child.context.age, /adult; numeric age unknown/);
  assert.match(native.find((record) => record.sourceObjectId === "45718").context.age, /9.0–9.0 Day/);
  assert.match(native.find((record) => record.sourceObjectId === "50424").context.age, /1.0–1.5 Month/);
  const wrong = structuredClone(options); wrong.nativeContourSourceContext.records[0].neuronName = "invented";
  assert.throws(() => buildIndependentSourceObjectIndex(wrong), /exact source metadata identity/);
  const without = { ...options, nativeContourSourceContext: null };
  assert.match(listIndependentSourceObjects(buildIndependentSourceObjectIndex(without), { sourceId: "native-contours" }).records[0].context.species, /unknown/);
});

test("full source/release/kind/native-ID keys retain large strings, escaping and reject alternate spellings", () => {
  const identity = { sourceId: "one/source", releaseId: "v1.2", objectKind: "root", sourceObjectId: "648518346349516051" };
  const key = independentSourceObjectKey(identity);
  assert.deepEqual(parseIndependentSourceObjectKey(key), identity);
  assert.notEqual(key, independentSourceObjectKey({ ...identity, sourceId: "two/source" }));
  assert.notEqual(key, independentSourceObjectKey({ ...identity, releaseId: "v1.3" }));
  assert.equal(independentSourceObjectKey({ ...identity, sourceObjectId: Number("648518346349516051") }), null);
  assert.equal(parseIndependentSourceObjectKey(key.replace("one%2Fsource", "one%2fsource")), null);
  assert.equal(parseIndependentSourceObjectKey("invalid/%XX/record/id"), null);
  const root = first("microns-phase1", "cell_root");
  assert.equal(root.sourceObjectId, "648518346349516051");
  assert.equal(findIndependentSourceObject(index, independentSourceObjectKey({ ...root, releaseId: "v185.3" })), null);
  assert.equal(findIndependentSourceObject(index, independentSourceObjectKey({ ...root, sourceObjectId: "0" })), null);
});

test("source ranges resolve final detections and all train/validation rows, never out-of-range or fabricated IDs", () => {
  const palmLast = listIndependentSourceObjects(index, { sourceId: "super-clem-palm", offset: 18357, limit: 25 });
  assert.equal(palmLast.total, 18358);
  assert.equal(palmLast.records.length, 1);
  assert.match(palmLast.records[0].sourceObjectId, /column:18358$/);
  assert.equal(findIndependentSourceObject(index, palmLast.records[0].key)?.viewer.detectionIndex, 18357);
  assert.equal(findIndependentSourceObject(index, independentSourceObjectKey({ ...palmLast.records[0], sourceObjectId: "181130_EosRmov009:column:018358" })), null);
  assert.equal(findIndependentSourceObject(index, independentSourceObjectKey({ ...palmLast.records[0], sourceObjectId: "181130_EosRmov009:column:18359" })), null);
  const microLast = listIndependentSourceObjects(index, { sourceId: "microstructformer", offset: 527, limit: 20 });
  assert.equal(microLast.total, 540);
  assert.deepEqual(microLast.records.map((record) => record.sourceObjectId), ["train:row:527", ...Array.from({ length: 12 }, (_, row) => `validation:row:${row}`)]);
  assert.ok(microLast.records.every((record) => record.sourceUrl.endsWith(`/tree/${record.releaseId}`) && record.files.length === 0));
  assert.ok(microLast.records.every((record) => !record.context.externalRowViewerUrl.includes("revision=") && /not verified/.test(record.context.externalRowViewerRevisionStatus)));
  const search = listIndependentSourceObjects(index, { sourceId: "microstructformer", query: "validation:row:11" });
  assert.equal(search.total, 1);
  assert.equal(findIndependentSourceObject(index, search.records[0].key)?.context.rowIndex, 11);
  assert.equal(listIndependentSourceObjects(index, { sourceId: "unknown" }).total, 0);
  assert.throws(() => listIndependentSourceObjects(index, { sourceId: "super-clem-palm", offset: -1 }), /paging/);
});

test("record-specific shell/crosswalk and parent evidence never leak to other records; MD5 remains MD5", () => {
  const native = listIndependentSourceObjects(index, { sourceId: "native-contours" }).records;
  assert.deepEqual(native.filter((record) => record.relationships.some((row) => row.kind === "same_record_frame_crosswalk")).map((record) => record.sourceObjectId), ["45718"]);
  assert.deepEqual(native.filter((record) => record.components.some((row) => row.id === "derived-open-shell")).map((record) => record.sourceObjectId), ["50394"]);
  const root = first("banc-v888", "neuron_root");
  assert.deepEqual(root.files.find((file) => file.id === "nucleus-annotation-source").checksum, { algorithm: "MD5", digest: "54a2b72cb72117fa6358962655625bb1" });
  assert.match(root.files.find((file) => file.id === "nucleus-annotation-source").algorithmEvidence, /candidate-audit/);
  assert.equal(root.structureCoverage.find((row) => row.id === "organelles").status, "source_reported");
  assert.equal(root.components.filter((row) => row.representation === "annotation_point").length, 1);
  assert.ok(first("microns-phase1").relationships[0].evidence.exactSourceRow.includes("648518346349516051"));
  assert.equal(first("super-clem-palm").relationships.length, 0);
});

test("actual assets verify every native contour record and retain exact contour IDs/order/coordinates", async () => {
  let contours = 0;
  for (const record of listIndependentSourceObjects(index, { sourceId: "native-contours" }).records) {
    const result = await loadIndependentSourceObject(record, { fetchImpl: fsFetch });
    const source = JSON.parse(await readFile(new URL(`../public${record.admission.derivedObject.path}`, import.meta.url), "utf8"));
    assert.deepEqual(result.contours, source.contours);
    assert.equal(result.receipt.objectKey, record.key);
    assert.equal(result.receipt.verifiedFiles.length, 1);
    assert.equal(result.receipt.embeddedAssetIdentities[0].releaseId, source.releaseId, "source asset release remains separate from merged selection-catalog release");
    assert.equal(result.meshes.length, 0);
    assert.equal(result.points.length, 0);
    contours += result.contours.length;
  }
  assert.equal(contours, 72);
  const shellRecord = listIndependentSourceObjects(index, { sourceId: "native-contours" }).records.find((record) => record.sourceObjectId === "50394");
  const shell = await loadIndependentSourceObject(shellRecord, { fetchImpl: fsFetch, includeDerivedShell: true });
  assert.equal(shell.meshes.length, 1);
  assert.equal(shell.meshes[0].authority, "DER_INTERPOLATED_SOURCE_CONTOUR_OPEN_SHELL");
  assert.equal(shell.meshes[0].triangles.length, 3328 * 3);
});

test("actual MICrONS bytes verify parent row, two source meshes, bounds and exact selected nucleus", async () => {
  const root = first("microns-phase1", "cell_root");
  const loaded = await loadIndependentSourceObject(root, { fetchImpl: fsFetch });
  assert.deepEqual(loaded.meshes.map((mesh) => mesh.sourceObjectId), ["648518346349516051", "4309"]);
  assert.deepEqual(loaded.meshes.map((mesh) => mesh.positions.length), [372382 * 3, 12682 * 3]);
  assert.equal(loaded.receipt.verifiedFiles.length, 6);
  assert.equal(loaded.points.length, 0);
  const nucleus = await loadIndependentSourceObject(first("microns-phase1", "nucleus"), { fetchImpl: fsFetch });
  assert.equal(nucleus.meshes.length, 1);
  assert.equal(nucleus.meshes[0].sourceObjectId, "4309");
  assert.deepEqual(nucleus.meshes[0].positions, loaded.meshes[1].positions);
});

test("actual BANC SWC and PALM first/final columns display their own representations without inferred mesh", async () => {
  const banc = await loadIndependentSourceObject(first("banc-v888", "neuron_root"), { fetchImpl: fsFetch });
  assert.equal(banc.edges.length, 7450);
  assert.deepEqual(banc.points[0].position, [461824, 954944, 188415]);
  assert.equal(banc.meshes.length, 0);
  const nucleus = await loadIndependentSourceObject(first("banc-v888", "nucleus_annotation"), { fetchImpl: fsFetch });
  assert.equal(nucleus.edges.length, 0);
  assert.equal(nucleus.points.length, 1);
  for (const offset of [0, 18357]) {
    const selected = listIndependentSourceObjects(index, { sourceId: "super-clem-palm", offset, limit: 1 }).records[0];
    const palm = await loadIndependentSourceObject(selected, { fetchImpl: fsFetch });
    assert.equal(palm.points.length, 1);
    assert.equal(palm.points[0].position.length, 2);
    assert.equal(palm.points[0].sourceMatrixColumn, offset + 1);
    assert.equal(palm.receipt.coordinateFrame.unit, null);
    assert.equal(palm.edges.length + palm.meshes.length + palm.contours.length, 0);
    assert.deepEqual(palm.points[0].position, offset === 0 ? [194.9499068158982, 189.3679142343746] : [161.90017261539245, 46.698470497175336]);
  }
  const external = await loadIndependentSourceObject(first("microstructformer"), { fetchImpl: () => { throw new Error("link-only must not fetch"); } });
  assert.equal(external.receipt.status, "link_only");
  assert.equal(external.points.length + external.edges.length + external.meshes.length + external.contours.length, 0);
});

test("bad bytes, digest, native frame, units and identity fail closed with no fallback geometry", async () => {
  const native = first("native-contours");
  const wrongBytes = structuredClone(native);
  wrongBytes.files.find((file) => file.id === "native-contours").bytes += 1;
  await assert.rejects(loadIndependentSourceObject(wrongBytes, { fetchImpl: fsFetch }), /byte-length mismatch/);
  const wrongHash = structuredClone(native);
  wrongHash.files.find((file) => file.id === "native-contours").checksum.digest = "0".repeat(64);
  await assert.rejects(loadIndependentSourceObject(wrongHash, { fetchImpl: fsFetch }), /SHA-256 mismatch/);
  const wrongFrame = structuredClone(first("microns-phase1"));
  wrongFrame.coordinateFrame.frame = "atlas-space";
  await assert.rejects(loadIndependentSourceObject(wrongFrame, { fetchImpl: fsFetch }), /frame.*units/);
  const wrongUnit = structuredClone(first("super-clem-palm"));
  wrongUnit.coordinateFrame.unit = "nanometre";
  await assert.rejects(loadIndependentSourceObject(wrongUnit, { fetchImpl: fsFetch }), /frame.*units/);
  const wrongIdentity = structuredClone(first("banc-v888"));
  wrongIdentity.sourceObjectId = "720575941350424113";
  wrongIdentity.key = independentSourceObjectKey(wrongIdentity);
  await assert.rejects(loadIndependentSourceObject(wrongIdentity, { fetchImpl: fsFetch }), /identity mismatch/);
  const payload = new TextEncoder().encode("hello").buffer;
  await assert.rejects(verifyIndependentSourceObjectAsset(payload, { id: "md5", bytes: 5, checksum: { algorithm: "MD5", digest: "5d41402abc4b2a76b9719d911017c592" } }), /actual SHA-256/);
  const noCrypto = { digest: async () => { throw new Error("No digest available"); } };
  await assert.rejects(verifyIndependentSourceObjectAsset(payload, { id: "sha", bytes: 5, checksum: { algorithm: "SHA-256", digest: digest(new Uint8Array(payload)) } }, { digestImpl: noCrypto }), /No digest/);
});

test("valid byte/hash receipt cannot bypass MICrONS semantic frame or component-ID checks", async () => {
  const root = structuredClone(first("microns-phase1"));
  const manifestFile = root.files.find((file) => file.id === "asset-manifest");
  const sourceManifest = JSON.parse(await readFile(new URL(`../public${manifestFile.path}`, import.meta.url), "utf8"));
  sourceManifest.components[0].browserGeometry.coordinateFrame = "wrong-source-frame";
  const altered = new TextEncoder().encode(JSON.stringify(sourceManifest));
  manifestFile.bytes = altered.byteLength;
  manifestFile.checksum.digest = digest(altered);
  const alteredFetch = async (path) => path === manifestFile.path ? { ok: true, status: 200, arrayBuffer: async () => bytesToBuffer(altered) } : fsFetch(path);
  await assert.rejects(loadIndependentSourceObject(root, { fetchImpl: alteredFetch }), /mesh frame.*units mismatch/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(loadIndependentSourceObject(first("native-contours"), { fetchImpl: fsFetch, signal: controller.signal }), /cancelled/);
});

test("independent nucleus-parent relation requires versioned exact evidence and never equates nucleus with parent object", async () => {
  for (const sourceId of ["microns-phase1", "banc-v888"]) {
    const source = first(sourceId);
    assert.equal(source.relationships[0].samePhysicalObject, false);
    assert.equal(source.relationships[0].sameCellContext, true);
    for (const mutate of [
      (copy) => { copy.relationships = []; },
      (copy) => { copy.relationships[0].parent.releaseId = "wrong-release"; },
      (copy) => { copy.relationships[0].child.sourceObjectId = "unrelated-nucleus"; },
      (copy) => { copy.relationships[0].evidence.locator = ""; },
      (copy) => { copy.relationships[0].evidence.checksum.digest = "0".repeat(copy.relationships[0].evidence.checksum.digest.length); },
      (copy) => { copy.relationships[0].samePhysicalObject = true; },
    ]) {
      const invalid = structuredClone(source);
      mutate(invalid);
      await assert.rejects(loadIndependentSourceObject(invalid, { fetchImpl: () => { throw new Error("relationship must fail before geometry fetch"); } }), /relationship/);
    }
  }
});

test("export rejects a foreign receipt and retains source identity, status and unit boundaries", () => {
  const object = first("banc-v888");
  const exported = exportIndependentSourceObject(object, { objectKey: object.key });
  assert.equal(exported.object.sourceObjectId, "720575941350424112");
  assert.equal(exported.object.files.find((file) => file.id === "nucleus-annotation-source").checksum.algorithm, "MD5");
  assert.equal("sourceContract" in exported.object, false);
  assert.throws(() => exportIndependentSourceObject(object, { objectKey: first("microns-phase1").key }), /different/);
});

test("A → B → A ignores obsolete same-key success/failure and synchronously clears geometry and receipt", () => {
  const a = first("native-contours"); const b = first("microns-phase1");
  let state = createIndependentSourceObjectState();
  state = beginIndependentSourceObjectRequest(state, a.key, 1);
  const payload = { key: a.key, receipt: { objectKey: a.key }, contours: ["A1"] };
  state = settleIndependentSourceObjectSuccess(state, { generation: 1, requestKey: a.key, record: a, payload });
  const hidden = deriveIndependentSourceObjectState(state, { key: a.key, generation: 3 });
  assert.equal(hidden.payload, null); assert.equal(hidden.receipt, null);
  state = beginIndependentSourceObjectRequest(state, b.key, 2);
  assert.equal(state.payload, null); assert.equal(state.receipt, null);
  state = beginIndependentSourceObjectRequest(state, a.key, 3);
  assert.equal(settleIndependentSourceObjectSuccess(state, { generation: 1, requestKey: a.key, record: a, payload }), state);
  assert.equal(settleIndependentSourceObjectFailure(state, { generation: 2, requestKey: b.key, error: "late B failure" }), state);
  assert.equal(state.status, "verifying");
  assert.throws(() => settleIndependentSourceObjectSuccess(state, { generation: 3, requestKey: a.key, record: b, payload }), /exact current object key/);
  assert.throws(() => beginIndependentSourceObjectRequest(state, a.key, 3), /monotonically/);
});

test("asynchronous controller cancels prior requests; late A1/B2 cannot override A3 even when loader ignores abort", async () => {
  const a = first("native-contours"); const b = first("microns-phase1");
  const requests = [];
  const published = [];
  const controller = createIndependentSourceObjectController(index, (record, { signal }) => new Promise((resolve, reject) => requests.push({ record, signal, resolve, reject })), (state) => published.push(state));
  const a1 = controller.select(a.key); const b2 = controller.select(b.key); const a3 = controller.select(a.key);
  assert.equal(requests[0].signal.aborted, true); assert.equal(requests[1].signal.aborted, true);
  requests[0].resolve({ key: a.key, receipt: { objectKey: a.key }, points: ["obsolete-A1"] });
  await a1;
  requests[1].reject(new Error("obsolete-B2")); await b2;
  assert.equal(controller.getState().status, "verifying");
  assert.equal(controller.getState().generation, 3);
  requests[2].resolve({ key: a.key, receipt: { objectKey: a.key }, points: ["current-A3"] }); await a3;
  assert.deepEqual(controller.getState().payload.points, ["current-A3"]);
  assert.deepEqual(published.filter((state) => state.status === "ready").map((state) => state.generation), [3]);
  const unknown = independentSourceObjectKey({ ...a, sourceObjectId: "999999" });
  await controller.select(unknown);
  assert.equal(controller.getState().status, "unavailable");
  assert.equal(controller.getState().payload, null); assert.equal(controller.getState().receipt, null);
  assert.match(controller.getState().error, /Unknown exact source object/);
  controller.dispose(); assert.equal(controller.getState().status, "idle");
});
