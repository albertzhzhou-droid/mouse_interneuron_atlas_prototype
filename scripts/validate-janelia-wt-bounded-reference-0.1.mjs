import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { zstdDecompressSync } from "node:zlib";
import { validateJaneliaWtReference, verifyJaneliaWtPayload } from "../app/janelia-wt-bounded-reference.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root));
const json = async (path) => JSON.parse(await read(path));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const reference = await json("data/janelia-wt-bounded-reference-0.1.json");
const receipt = await json(reference.sourceReceiptPath);
const validation = validateJaneliaWtReference(reference);
assert.deepEqual(receipt.files, reference.sourceReceipts);
assert.equal(receipt.files.length, 8);
let totalBytes = 0;
for (const file of receipt.files) {
  const bytes = await read(file.path);
  assert.equal(bytes.length, file.bytes, file.path);
  assert.equal(sha(bytes), file.sha256, file.path);
  totalBytes += bytes.length;
}
assert.equal(totalBytes, receipt.totalBytes);
for (const [kind, filename] of [["raw", "raw-82-22-17.zstd"], ["nucleus", "nucleus-10-2-2.zstd"]]) {
  const source = zstdDecompressSync(await read("data/source-candidates/janelia-wt-reference-20260930/" + filename));
  const payload = await verifyJaneliaWtPayload(new Uint8Array(await read("public" + reference[kind].payload.url)), reference[kind].payload);
  assert.deepEqual(payload, new Uint8Array(source), kind + " lossless decompression");
}
const rawRecord = await json("data/source-candidates/janelia-wt-reference-20260930/raw-figshare.json");
const nucleusRecord = await json("data/source-candidates/janelia-wt-reference-20260930/nucleus-figshare.json");
for (const [record, admitted] of [[rawRecord, reference.sourceRecords[0]], [nucleusRecord, reference.sourceRecords[1]]]) {
  assert.equal(record.id, admitted.id);
  assert.equal(record.doi, admitted.doi);
  assert.equal(record.version, admitted.version);
  assert.deepEqual(record.license, admitted.license);
  assert.ok(record.description.includes(reference.datasetId));
}
for (const [kind, arrayName, attributesName] of [["raw", "raw_s0_zarray.json", "raw_group_zattrs.json"], ["nucleus", "manual_nucleus_s0_zarray.json", "manual_nucleus_group_zattrs.json"]]) {
  const directory = "data/source-candidates/janelia-wt-reference-20260930/";
  const array = await json(directory + arrayName);
  const attributes = await json(directory + attributesName);
  const multiscale = attributes.multiscales[0];
  const native = multiscale.datasets.find((item) => item.path === "s0");
  assert.deepEqual(reference[kind].axes, multiscale.axes.map((axis) => axis.name));
  assert.ok(multiscale.axes.every((axis) => axis.unit === reference[kind].unit));
  assert.deepEqual(reference[kind].shapeZYX, array.shape);
  assert.deepEqual(reference[kind].chunkShapeZYX, array.chunks);
  assert.equal(array.dtype, "|u1");
  assert.equal(array.order, "C");
  assert.equal(array.compressor.id, "zstd");
  assert.deepEqual(reference[kind].scaleNanometreZYX, native.coordinateTransformations.find((transform) => transform.type === "scale").scale);
  assert.deepEqual(reference[kind].translationNanometreZYX, native.coordinateTransformations.find((transform) => transform.type === "translation").translation);
  assert.deepEqual(reference[kind].firstGlobalIndexZYX, reference[kind].chunkIndexZYX.map((value, axis) => value * array.chunks[axis]));
}
console.log(JSON.stringify({ status: "passed", ...validation, sourceBytes: totalBytes, scope: "native_source_local_2d_reference_only" }));
