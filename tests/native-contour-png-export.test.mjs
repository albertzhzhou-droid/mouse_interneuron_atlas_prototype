import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { Matrix4, Quaternion, Vector3, REVISION } from "three";
import { NATIVE_CONTOUR_SOURCE_IDS, canonicalNativeContourSource, readVerifiedNativeContours, readVerifiedNativeContourShell } from "../app/native-contour-verification.js";
import { captureNativeContourSourceView, nativeContourRenderedBounds } from "../app/native-contour-source-view.js";
import { nativeContourDisplayTransform } from "../app/neurolucida-native-contour-admission.js";
import { appendNativeContourExportPng, wrapNativeContourPngCaption } from "../app/native-contour-png-export.js";

const fetchActual = async url => {
  const b = await readFile(new URL(`../public${url}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
};
const loaded = new Map();
for (const id of NATIVE_CONTOUR_SOURCE_IDS) {
  const contours = await readVerifiedNativeContours(id, { fetchImpl: fetchActual });
  loaded.set(id, { contours, shell: id === 50394 ? await readVerifiedNativeContourShell(id, contours, { fetchImpl: fetchActual }) : null });
}
function capture(id, { isolated = false, hidden = false } = {}) {
  const { contours, shell } = loaded.get(id), bounds = nativeContourRenderedBounds(contours, shell), r = bounds.radius;
  const target = new Vector3().fromArray(bounds.center), position = target.clone().add(new Vector3(r * 1.4, r * .95, r * 1.65)), up = new Vector3(0, 1, 0);
  const secondary = new Set(canonicalNativeContourSource(id).record.viewer?.secondarySourceNames ?? []);
  const selected = isolated ? contours.contours[0].id : null;
  return captureNativeContourSourceView(id, contours, shell, {
    status: "rendered", runtimeBinding: { instanceId: "native-contour-runtime-1", revision: 1 },
    camera: { kind: "PerspectiveCamera", position: position.toArray(), target: target.toArray(), up: up.toArray(), quaternion: new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(position, target, up)).toArray(), fov: 40, zoom: 1, aspect: 2, near: Math.max(r / 500, .01), far: Math.max(r * 40, 100) },
    viewport: { cssWidth: 800, cssHeight: 400, drawingBufferWidth: 800, drawingBufferHeight: 400, pixelRatio: 1 },
    renderer: { engine: "THREE", revision: REVISION, type: "WebGLRenderer", outputColorSpace: "srgb", toneMapping: 0, alpha: true, antialias: true },
    clipping: { globalPlanes: [], localClippingEnabled: false },
    layers: { showPrimary: !hidden, showSecondary: true, showDerivedSurface: Boolean(shell), primaryVisible: !hidden, secondaryVisible: true,
      derivedSurfaceVisible: Boolean(shell && !isolated), visibleContourIds: contours.contours.filter(c => (!hidden || secondary.has(c.sourceName)) && (!isolated || c.id === selected)).map(c => c.id), axesVisible: true, scaleGuideVisible: true },
    inspection: { selectedContourId: selected, isolateContour: isolated }, displayTransform: nativeContourDisplayTransform(contours.contours), sceneBounds: bounds,
  }, REVISION);
}
const options = id => ({ neuronId: id, ...loaded.get(id), rendererRevision: REVISION });
function crc(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) { value ^= byte; for (let i = 0; i < 8; i++) value = value >>> 1 ^ (value & 1 ? 0xedb88320 : 0); }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12); out.writeUInt32BE(data.length); out.write(type, 4); data.copy(out, 8); out.writeUInt32BE(crc(out.subarray(4, -4)), out.length - 4); return out;
}
// A valid independently encoded blank raster exercises metadata without pretending
// to be actual renderer pixels; native verification separately inspects the UI export.
function png(width = 800, height = 480) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return new Blob([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.alloc((width * 4 + 1) * height))), chunk("IEND", Buffer.alloc(0))], { type: "image/png" });
}
async function inspect(blob) {
  const b = Buffer.from(await blob.arrayBuffer()), text = {}, unchanged = [b.subarray(0, 8)];
  for (let offset = 8; offset < b.length;) {
    const size = b.readUInt32BE(offset), type = b.toString("ascii", offset + 4, offset + 8);
    assert.equal(b.readUInt32BE(offset + 8 + size), crc(b.subarray(offset + 4, offset + 8 + size)));
    if (type === "iTXt") {
      const data = b.subarray(offset + 8, offset + 8 + size), nul = data.indexOf(0);
      text[data.toString("utf8", 0, nul)] = JSON.parse(data.toString("utf8", nul + 5));
    } else unchanged.push(b.subarray(offset, offset + 12 + size));
    offset += 12 + size;
  }
  return { text, unchanged: Buffer.concat(unchanged) };
}
test("all seven source-backed PNG receipts preserve encoded pixels, source/build/camera and zero scientific additions", async () => {
  const raster = png(), bytes = Buffer.from(await raster.arrayBuffer());
  for (const id of NATIVE_CONTOUR_SOURCE_IDS) {
    const saved = capture(id), result = await inspect(await appendNativeContourExportPng(raster, saved, options(id)));
    assert.deepEqual(result.unchanged, bytes); assert.deepEqual(result.text["ohri-source-view"], saved);
    const metadata = result.text["ohri-png-export"], authority = metadata.captureAuthority;
    assert.deepEqual(metadata.image, { format: "image/png", width: 800, height: 480 });
    assert.deepEqual(metadata.raster, { x: 0, y: 0, width: 800, height: 400 });
    assert.deepEqual(authority.visibleContourIds, saved.view.layers.visibleContourIds);
    assert.equal(authority.derivedDisplayShellCount, id === 50394 ? 1 : 0);
    for (const key of ["observedMembraneCount", "volumeCount", "internalStructureCount", "standardizedSwcOverlayCount", "sameCellJoinCount", "registrationCount"]) assert.equal(authority[key], 0);
    assert.equal(authority.rawDatByteVerification, "verified_original_bytes_and_complete_parser_audit"); assert.equal(authority.imageIsBiologicalMeasurement, false);
    assert.equal(metadata.replay.separateJsonRequiredForRestore, true); assert.equal(metadata.replay.freshSourceCacheMode, "no-store");
  }
});
test("isolated trace and hidden-group PNG preserve actual visibility without reporting an invisible DER shell", async () => {
  for (const [id, settings] of [[50394, { isolated: true }], [45718, { hidden: true }]]) {
    const saved = capture(id, settings), result = await inspect(await appendNativeContourExportPng(png(), saved, options(id)));
    assert.deepEqual(result.text["ohri-png-export"].captureAuthority.visibleContourIds, saved.view.layers.visibleContourIds);
    assert.equal(result.text["ohri-png-export"].captureAuthority.derivedDisplayShellCount, 0);
  }
});
test("wrong source/build/layers and copied private payloads reject before any PNG publication", async () => {
  const saved = capture(50394);
  for (const mutate of [d => d.source.neuronId = 45718, d => d.rendererBuild.inputs[0].sha256 = "0".repeat(64), d => d.view.layers.visibleContourIds.pop(), d => d.source.scope.registrationCount = 1]) {
    const bad = structuredClone(saved); mutate(bad); await assert.rejects(appendNativeContourExportPng(png(), bad, options(50394)));
  }
  await assert.rejects(appendNativeContourExportPng(png(), saved, { ...options(50394), contours: structuredClone(loaded.get(50394).contours) }), /private/);
});
test("wrong raster dimensions, missing footer, malformed or duplicate PNG receipts reject", async () => {
  const saved = capture(50394), config = options(50394);
  for (const raster of [png(799), png(800, 400), new Blob(["not PNG"])]) await assert.rejects(appendNativeContourExportPng(raster, saved, config), /dimensions/);
  const valid = await appendNativeContourExportPng(png(), saved, config);
  await assert.rejects(appendNativeContourExportPng(valid, saved, config), /already contains/);
});
test("async metadata encoding snapshots the validated receipt rather than observing later caller mutations", async () => {
  const saved = capture(50394), original = structuredClone(saved), raster = png();
  const delayed = { arrayBuffer: async () => { saved.view.layers.visibleContourIds.length = 0; saved.source.neuronId = 45718; return raster.arrayBuffer(); } };
  const result = await inspect(await appendNativeContourExportPng(delayed, saved, options(50394)));
  assert.deepEqual(result.text["ohri-source-view"], original);
});
test("narrow captions retain whole ordinary words and every character of a long checksum", () => {
  const words = "Image is not a biological measurement. Source hashes remain declared.";
  const lines = wrapNativeContourPngCaption(words, 30, text => text.length);
  assert.equal(lines.join(" "), words); assert.ok(lines.every(line => line.length <= 30));
  const hash = "61fddbab3764e761600c2519e478eec4cee7918a581b2fde29ac2d8880c90a92";
  const fragments = wrapNativeContourPngCaption(hash, 30, text => text.length);
  assert.equal(fragments.join(""), hash); assert.ok(fragments.every(line => line.length <= 30));
  assert.throws(() => wrapNativeContourPngCaption(words, 0, text => text.length), /width/);
});
