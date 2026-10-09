import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { MCCREEDY_MOVIE as source, verifyMccreedyMovie, loadMccreedyMovie, mccreedyMovieBytes, buildMccreedyReceipt,
  restoreMccreedyReceipt, inspectMccreedySelection, validateMccreedyDecodedMetadata } from "../app/mccreedy-v2a-movie.js";
const bytes = new Uint8Array(await readFile(new URL("../public" + source.asset.url, import.meta.url)));
const selection = { timeSeconds: 9.5, playbackRate: 1 };
test("exact original bytes authorize only this immutable source population movie", async () => {
  const proof = await verifyMccreedyMovie(bytes); assert.deepEqual(mccreedyMovieBytes(proof), bytes);
  assert.throws(() => mccreedyMovieBytes({ ...proof }), /private byte authority/);
  const copy = mccreedyMovieBytes(proof); copy[0] ^= 1; assert.deepEqual(mccreedyMovieBytes(proof), bytes);
  assert.equal(source.biologicalContext.specimenId, null); assert.equal(source.biologicalContext.perCellIds, null);
});
test("wrong length, same-size corrupted bytes and pre-cancelled verification fail", async () => {
  await assert.rejects(verifyMccreedyMovie(bytes.subarray(1)), /length/);
  const bad = bytes.slice(); bad[1000] ^= 1; await assert.rejects(verifyMccreedyMovie(bad), /checksum/);
  const controller = new AbortController(); controller.abort(); await assert.rejects(verifyMccreedyMovie(bytes, { signal: controller.signal }), /abort/i);
});
test("mutable input cannot alter private bytes while the digest is pending", async () => {
  const copy = bytes.slice(), pending = verifyMccreedyMovie(copy); copy[500] ^= 1;
  assert.deepEqual(mccreedyMovieBytes(await pending), bytes);
});
test("fresh loader binds no-store, signal and exact byte size, rejecting oversized or HTTP failure", async () => {
  const controller = new AbortController(); let calls = 0;
  const proof = await loadMccreedyMovie({ signal: controller.signal, fetchImpl: async (url, options) => {
    calls++; assert.equal(url, source.asset.url); assert.equal(options.cache, "no-store"); assert.equal(options.signal, controller.signal); return new Response(bytes);
  } }); assert.equal(calls, 1); assert.deepEqual(mccreedyMovieBytes(proof), bytes);
  await assert.rejects(loadMccreedyMovie({ fetchImpl: async () => new Response(null, { status: 404 }) }), /HTTP 404/);
  await assert.rejects(loadMccreedyMovie({ fetchImpl: async () => new Response(new Uint8Array(source.asset.bytes + 1)) }), /exceeds exact movie size/);
});
test("cancellation during body reading never yields a proof", async () => {
  const controller = new AbortController();
  await assert.rejects(loadMccreedyMovie({ signal: controller.signal, fetchImpl: async () => new Response(new ReadableStream({ pull(c) { c.enqueue(bytes.subarray(0, 4096)); controller.abort(); c.close(); } })) }), /abort/i);
});
test("source snapshot restores against fresh private bytes; changing any provenance claim fails", async () => {
  const proof = await verifyMccreedyMovie(bytes), receipt = buildMccreedyReceipt(proof, selection, "2026-10-03T01:00:00Z");
  assert.deepEqual(restoreMccreedyReceipt(receipt, await verifyMccreedyMovie(bytes)), selection);
  assert.throws(() => restoreMccreedyReceipt(receipt, { ...proof }), /private byte authority/);
  for (const mutate of [r => r.asset.sha256 = "0".repeat(64), r => r.rights.license = "unrestricted", r => r.currentLoaderReceipt.browserFullFrameDecodeVerified = true, r => r.biologicalContext.specimenId = "invented", r => r.releaseId = "other", r => r.pausedSnapshot = false, r => r.extra = "invented"]) {
    const changed = structuredClone(receipt); mutate(changed); assert.throws(() => restoreMccreedyReceipt(changed, proof));
  }
});
test("playback coordinates are finite source movie time and rate; decoded size/duration must match", () => {
  for (const timeSeconds of [-1, 20.01, NaN, Infinity, "9"]) assert.throws(() => inspectMccreedySelection({ ...selection, timeSeconds }));
  assert.throws(() => inspectMccreedySelection({ ...selection, z: 9 }));
  assert.throws(() => inspectMccreedySelection({ ...selection, playbackRate: 0 }));
  validateMccreedyDecodedMetadata({ width: 1600, height: 1200, durationSeconds: 20 });
  assert.throws(() => validateMccreedyDecodedMetadata({ width: 800, height: 1200, durationSeconds: 20 }));
  assert.throws(() => validateMccreedyDecodedMetadata({ width: 1600, height: 1200, durationSeconds: 21 }));
});
