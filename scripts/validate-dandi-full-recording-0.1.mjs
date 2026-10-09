#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DANDI_FULL_RECORDING as doc, validateDandiFullDocument } from "../app/dandi-full-recording.js";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const assert = (ok, message) => { if (!ok) throw new Error(message); };
export async function validateDandiFullRecording() {
  validateDandiFullDocument();
  const receiptBytes = await readFile(path.join(ROOT, doc.sourceDownloadReceipt.path));
  assert(receiptBytes.length === doc.sourceDownloadReceipt.bytes && hash(receiptBytes) === doc.sourceDownloadReceipt.sha256,
    "Complete source acquisition receipt differs");
  const acquisition = JSON.parse(receiptBytes);
  assert(acquisition.completeSourceSha256Verified === true && acquisition.bytes === 355191072
    && acquisition.sha256 === doc.sourceAsset.sha256Declared && acquisition.reusedPriorBytes === 3918112
    && acquisition.newlyFetchedBytes === 351272960, "Source acquisition scope differs");
  let previousEnd = -1;
  for (const row of acquisition.ranges) {
    assert(row.start === previousEnd + 1 && row.bytes === row.end - row.start + 1 && row.end < acquisition.bytes,
      "Acquisition ranges do not form a complete disjoint source coverage");
    assert(/^[a-f0-9]{64}$/.test(row.sha256), "Invalid source range fingerprint"); previousEnd = row.end;
  }
  assert(previousEnd === acquisition.bytes - 1, "Acquisition final byte missing");
  const stats = Array.from({ length: 32 }, (_, channelIndex) => ({ channelIndex, sampleCount: 0,
    minimumStoredValue: 32767, maximumStoredValue: -32768, storedValueSum: 0, zeroSamples: 0 }));
  const channelHashes = Array.from({ length: 32 }, () => createHash("sha256"));
  const arrayHash = createHash("sha256");
  let compressedBytes = 0, totalSamples = 0, maximumCompressedChunkBytes = 0;
  const seen = new Set();
  for (let blockIndex = 0; blockIndex < 19; blockIndex++) {
    const firstSample = blockIndex * 300000, sampleCount = Math.min(300000, 5543424 - firstSample);
    const columns = [];
    for (let channelIndex = 0; channelIndex < 32; channelIndex++) {
      const chunk = doc.chunks[blockIndex * 32 + channelIndex];
      const name = `/data/dandi_spinalcordnet_full_recording_v1/channel-${String(channelIndex).padStart(2, "0")}-block-${String(blockIndex).padStart(2, "0")}.i16le.gzip`;
      assert(chunk.channelIndex === channelIndex && chunk.blockIndex === blockIndex && chunk.url === name
        && chunk.firstSample === firstSample && chunk.sampleCount === sampleCount
        && chunk.nativeElectrodeId === doc.electrodes[channelIndex].nativeElectrodeId,
      "Channel, block, native identity or source sample order mismatch");
      assert(!seen.has(name), "Duplicate source block"); seen.add(name);
      const compressed = await readFile(path.join(ROOT, "public", name));
      assert(compressed.length === chunk.bytes && hash(compressed) === chunk.sha256, `Compressed bytes differ: ${name}`);
      const raw = gunzipSync(compressed);
      assert(raw.length === chunk.decodedBytes && raw.length === sampleCount * 2 && hash(raw) === chunk.decodedSha256,
        `Decoded sample bytes differ: ${name}`);
      channelHashes[channelIndex].update(raw); columns.push(raw);
      const current = stats[channelIndex]; let minimum = 32767, maximum = -32768;
      for (let i = 0; i < sampleCount; i++) {
        const value = raw.readInt16LE(i * 2);
        minimum = Math.min(minimum, value); maximum = Math.max(maximum, value);
        current.storedValueSum += value; if (value === 0) current.zeroSamples++;
      }
      assert(minimum === chunk.minimumStoredValue && maximum === chunk.maximumStoredValue, "Native block extrema mismatch");
      current.sampleCount += sampleCount;
      current.minimumStoredValue = Math.min(current.minimumStoredValue, minimum);
      current.maximumStoredValue = Math.max(current.maximumStoredValue, maximum);
      compressedBytes += compressed.length; totalSamples += sampleCount;
      maximumCompressedChunkBytes = Math.max(maximumCompressedChunkBytes, compressed.length);
    }
    const matrix = Buffer.alloc(sampleCount * 32 * 2);
    for (let row = 0; row < sampleCount; row++) {
      for (let column = 0; column < 32; column++) {
        const from = row * 2, to = (row * 32 + column) * 2;
        matrix[to] = columns[column][from]; matrix[to + 1] = columns[column][from + 1];
      }
    }
    arrayHash.update(matrix);
  }
  for (let channelIndex = 0; channelIndex < 32; channelIndex++) {
    stats[channelIndex].orderedStoredInt16LeSha256 = channelHashes[channelIndex].digest("hex");
    assert(JSON.stringify(stats[channelIndex]) === JSON.stringify(doc.channels[channelIndex]), "Full native channel statistics mismatch");
  }
  const arraySha256 = arrayHash.digest("hex");
  assert(arraySha256 === doc.recording.sourceArrayCOrderInt16LeSha256
    && arraySha256 === "493853ea12ef93f5952a30528fe0433faf1a09b5d1333c2e0c4fc2bfb143ddd4", "Full native time/channel matrix differs");
  assert(totalSamples === 177389568 && compressedBytes === 160220016
    && maximumCompressedChunkBytes === 306357 && seen.size === 608, "Complete recording inventory mismatch");
  return { channels: 32, samplesPerChannel: 5543424, totalSamples, durationSeconds: 184.7808,
    chunks: 608, compressedBytes, maximumCompressedChunkBytes, reconstructedSourceArraySha256: arraySha256,
    allChannelStatisticsReplayed: 32, mismatches: 0, physicalVoltageCalibrationEstablished: false,
    identifiedInterneurons: 0, isolatedUnits: 0, sourceVerificationScope: "independent full derivative replay; complete NWB extraction replay is a separate Python check" };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await validateDandiFullRecording())); }
  catch (error) { console.error(error.stack ?? error); process.exitCode = 1; }
}
