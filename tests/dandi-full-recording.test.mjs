import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { DANDI_FULL_RECORDING as doc, validateDandiFullDocument, dandiFullChunkFor, verifyDandiFullChunk,
  loadDandiFullChunk, dandiFullWindow, buildDandiFullReceipt, inspectDandiFullReceipt,
  restoreDandiFullReceipt, dandiFullWindowCsv } from "../app/dandi-full-recording.js";
import { validateDandiFullRecording } from "../scripts/validate-dandi-full-recording-0.1.mjs";
const chunkBytes = async (channel, start) => new Uint8Array(await readFile(new URL(`../public${dandiFullChunkFor(channel, start).url}`, import.meta.url)));
const firstBytes = await chunkBytes(0, 0), finalBytes = await chunkBytes(31, 5541000);
const first = await verifyDandiFullChunk(firstBytes, 0, 0), final = await verifyDandiFullChunk(finalBytes, 31, 5541000);

test("all 608 blocks independently reconstruct the complete native time-by-channel matrix and all 32 channel statistics", async () => {
  const actual = await validateDandiFullRecording();
  assert.equal(actual.totalSamples, 177389568); assert.equal(actual.mismatches, 0);
  assert.equal(actual.reconstructedSourceArraySha256, doc.recording.sourceArrayCOrderInt16LeSha256);
  assert.equal(actual.physicalVoltageCalibrationEstablished, false); assert.equal(actual.identifiedInterneurons, 0);
});
test("old first-second preview and the real final partial window agree sample by sample; no zero padding or channel alias", async () => {
  const old = JSON.parse(await readFile(new URL("../public/data/dandi_spinalcordnet_trace_preview_v1/trace-channel-0.json", import.meta.url)));
  for (let start = 0; start < 30000; start += 3000) assert.deepEqual(dandiFullWindow(first, 0, start).samples, old.samples.slice(start, start + 3000));
  const current = dandiFullWindow(final, 31, 5541000, 2423);
  assert.equal(current.sampleCount, 2424); assert.equal(current.cursor.sourceSampleIndex, 5543423);
  assert.equal(current.lastTimeSeconds, 5543423 / 30000);
  const native = gunzipSync(finalBytes), offset = (5541000 - 5400000) * 2;
  for (let i = 0; i < 2424; i++) assert.equal(current.samples[i], native.readInt16LE(offset + i * 2));
  assert.throws(() => dandiFullWindow(final, 31, 5541000, 2424), /final window/);
  assert.throws(() => dandiFullWindow(first, 31, 0), /byte authority/);
  assert.throws(() => dandiFullWindow(final, 31, 0), /byte authority/);
  assert.throws(() => dandiFullWindow(structuredClone(final), 31, 5541000), /byte authority/);
});
test("every channel and the last valid time resolve one exact block, with complete native IDs and safe source windows", () => {
  for (let channel = 0; channel < 32; channel++) {
    for (let start = 0; start <= 5541000; start += 3000) {
      const row = dandiFullChunkFor(channel, start);
      assert.equal(row.channelIndex, channel); assert.equal(row.nativeElectrodeId, doc.electrodes[channel].nativeElectrodeId);
      assert.ok(start >= row.firstSample && start < row.firstSample + row.sampleCount);
    }
  }
  for (const [channel, start] of [[-1, 0], [32, 0], [0, 5544000], [0, -3000], [0, 1], [0, NaN]]) assert.throws(() => dandiFullChunkFor(channel, start));
});
test("source layer, calibration, full-source scope, electrode mapping and biological claims cannot be rewritten", () => {
  for (const edit of [x => x.sourceAsset.sha256Declared = "0".repeat(64), x => x.recording.sampleCountPerChannel--,
    x => x.amplitude.physicalVoltageClaimAllowed = true, x => x.amplitude.nativeDeclaration.unit = "microvolts",
    x => x.sourceContext.sessionId = "invented", x => x.electrodes.reverse(), x => x.claims.isolatedUnits = 1,
    x => x.chunks[0].nativeElectrodeId = "1", x => x.chunks.pop()]) {
    const changed = structuredClone(doc); edit(changed); assert.throws(() => validateDandiFullDocument(changed), /exact complete-source/);
  }
});
test("compressed corruption, wrong channel, HTTP error and cancellation never create current byte authority", async () => {
  const bad = new Uint8Array(firstBytes); bad[bad.length - 10] ^= 1;
  await assert.rejects(verifyDandiFullChunk(bad, 0, 0), /checksum/);
  await assert.rejects(verifyDandiFullChunk(firstBytes.subarray(1), 0, 0), /length/);
  await assert.rejects(verifyDandiFullChunk(firstBytes, 1, 0));
  await assert.rejects(loadDandiFullChunk(0, 0, { fetchImpl: async () => ({ ok: false, status: 404 }) }), /404/);
  const controller = new AbortController(); let release;
  const pending = loadDandiFullChunk(0, 0, { signal: controller.signal, fetchImpl: async (url, options) => {
    assert.equal(url, dandiFullChunkFor(0, 0).url); assert.equal(options.cache, "no-store");
    return { ok: true, arrayBuffer: () => new Promise(resolve => { release = resolve; }) };
  } });
  await Promise.resolve(); controller.abort(); release(firstBytes.buffer); await assert.rejects(pending, /abort/i);
});
test("receipt preflight stays non-authorizing and fresh restore requires every imported sample and actual final window scale", () => {
  const receipt = JSON.parse(JSON.stringify(buildDandiFullReceipt(final, 31, 5541000, 2423, "2026-10-02T20:00:00Z")));
  const state = { channelIndex: 31, firstSample: 5541000, cursorOffset: 2423 };
  assert.deepEqual(inspectDandiFullReceipt(receipt), state); assert.deepEqual(restoreDandiFullReceipt(receipt, final), state);
  for (const edit of [x => x.selection.samples[2]++, x => x.selection.cursor.storedValue++,
    x => x.selection.lastTimeSeconds++, x => x.selection.sampleCount = 3000, x => x.plot.yMaximum++,
    x => x.currentLoaderReceipt.decodedSha256 = "0".repeat(64), x => x.claims.sameCellLinks = 1,
    x => x.sourceIdentity.nodes.cell.id = "0", x => x.channel.channelIndex = 30]) {
    const bad = structuredClone(receipt); edit(bad); assert.throws(() => restoreDandiFullReceipt(bad, final));
  }
  const bad = structuredClone(receipt); bad.selection.samples[0]++;
  assert.deepEqual(inspectDandiFullReceipt(bad), state); assert.throws(() => restoreDandiFullReceipt(bad, final), /current exact source/);
  assert.throws(() => restoreDandiFullReceipt(receipt, structuredClone(final)), /byte authority/);
});
test("CSV preserves all final-window observations, source time, native electrode and unresolved calibration", () => {
  const lines = dandiFullWindowCsv(final, 31, 5541000).trimEnd().split("\n");
  assert.equal(lines.length, 2425); const header = lines.shift().split(","), ix = value => header.indexOf(value);
  const current = dandiFullWindow(final, 31, 5541000);
  for (let i = 0; i < 2424; i++) {
    const row = lines[i].split(","); assert.equal(Number(row[ix("stored_int16_value")]), current.samples[i]);
    assert.equal(row[ix("native_electrode_id")], "31"); assert.equal(row[ix("source_sample_index")], String(5541000 + i));
    assert.equal(Number(row[ix("source_time_seconds")]), (5541000 + i) / 30000);
    assert.equal(row[ix("session_id")], ""); assert.equal(row[ix("physical_calibration")], "unverified");
    assert.equal(row[ix("complete_source_sha256_verified_at_build")], "true"); assert.equal(row.length, header.length);
  }
});
