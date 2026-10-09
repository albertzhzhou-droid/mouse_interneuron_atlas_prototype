import canonical from "../data/dandi-spinalcordnet-full-recording-0.1.json" with { type: "json" };
import { dandiTraceIdentity } from "./dandi-spinalcordnet-trace.js";

const freeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
export const DANDI_FULL_RECORDING = freeze(canonical);
const owners = new WeakMap();
const assert = (ok, message) => { if (!ok) throw new Error(`DANDI full recording: ${message}`); };
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;
const same = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const sha = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  v => v.toString(16).padStart(2, "0")).join("");

export function validateDandiFullDocument(value = canonical) {
  assert(same(value, canonical), "document differs from the exact complete-source derivative");
  assert(value.sourceAsset.wholeFileSha256Verified === true
    && value.sourceAsset.sha256Declared === "b7e323f222791499af6d13ad8fa7d5ea9850fcf59e0de0dfa84c598a4a1be0ae"
    && value.recording.sampleCountPerChannel === 5543424 && value.recording.channelCount === 32
    && value.chunks.length === 608 && value.amplitude.physicalVoltageClaimAllowed === false,
  "complete recording or scientific scope changed");
  return value;
}

export function dandiFullChunkFor(channelIndex, firstSample) {
  assert(Number.isInteger(channelIndex) && channelIndex >= 0 && channelIndex < 32, "unknown native channel");
  assert(Number.isInteger(firstSample) && firstSample >= 0 && firstSample < 5543424 && firstSample % 3000 === 0,
    "time window must begin at a native 0.1-second boundary within the recording");
  const chunk = canonical.chunks.find(row => row.channelIndex === channelIndex
    && row.blockIndex === Math.floor(firstSample / canonical.recording.blockSamples));
  assert(chunk && firstSample >= chunk.firstSample && firstSample < chunk.firstSample + chunk.sampleCount,
    "source block is missing");
  return chunk;
}

export async function verifyDandiFullChunk(bytes, channelIndex, firstSample, { signal } = {}) {
  signal?.throwIfAborted();
  const chunk = dandiFullChunkFor(channelIndex, firstSample);
  assert(bytes instanceof Uint8Array && bytes.length === chunk.bytes, "compressed block byte length mismatch");
  const owned = new Uint8Array(bytes);
  assert(await sha(owned.buffer) === chunk.sha256, "compressed block checksum mismatch");
  signal?.throwIfAborted();
  const stream = new Blob([owned]).stream().pipeThrough(new DecompressionStream("gzip"));
  const decoded = new Uint8Array(await new Response(stream).arrayBuffer());
  signal?.throwIfAborted();
  assert(decoded.length === chunk.decodedBytes && decoded.length === chunk.sampleCount * 2,
    "decoded block length mismatch");
  assert(await sha(decoded.buffer) === chunk.decodedSha256, "decoded block checksum mismatch");
  signal?.throwIfAborted();
  const proof = freeze({ channelIndex, nativeElectrodeId: chunk.nativeElectrodeId, blockIndex: chunk.blockIndex });
  owners.set(proof, { chunk, view: new DataView(decoded.buffer, decoded.byteOffset, decoded.byteLength) });
  return proof;
}

export async function loadDandiFullChunk(channelIndex, firstSample, { signal, fetchImpl = globalThis.fetch } = {}) {
  signal?.throwIfAborted();
  const chunk = dandiFullChunkFor(channelIndex, firstSample);
  const response = await fetchImpl(chunk.url, { signal, cache: "no-store" });
  assert(response.ok, `source block response ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  signal?.throwIfAborted();
  return verifyDandiFullChunk(bytes, channelIndex, firstSample, { signal });
}

export function dandiFullWindow(proof, channelIndex, firstSample, cursorOffset = 0) {
  const owner = owners.get(proof), chunk = dandiFullChunkFor(channelIndex, firstSample);
  assert(owner && owner.chunk === chunk && proof.channelIndex === channelIndex,
    "current exact block byte authority is required for this channel and time");
  const count = Math.min(3000, canonical.recording.sampleCountPerChannel - firstSample);
  assert(firstSample + count <= chunk.firstSample + chunk.sampleCount, "window crosses a source block");
  assert(Number.isInteger(cursorOffset) && cursorOffset >= 0 && cursorOffset < count,
    "cursor is outside this actual window; the final window is not padded");
  const samples = Object.freeze(Array.from({ length: count }, (_, i) =>
    owner.view.getInt16((firstSample - chunk.firstSample + i) * 2, true)));
  return freeze({ firstSample, sampleCount: count, cursorOffset,
    firstTimeSeconds: firstSample / 30000, lastTimeSeconds: (firstSample + count - 1) / 30000,
    cursor: { sourceSampleIndex: firstSample + cursorOffset,
      timeSeconds: (firstSample + cursorOffset) / 30000, storedValue: samples[cursorOffset] }, samples });
}

function fixedReceiptFields(channelIndex, firstSample) {
  const chunk = dandiFullChunkFor(channelIndex, firstSample);
  return { documentType: "source_native_complete_extracellular_recording_window", schemaVersion: "0.1.0",
    contractId: canonical.contractId, sourceIdentity: dandiTraceIdentity(), sourceContext: canonical.sourceContext,
    sourceAsset: canonical.sourceAsset, sourceVerificationScope: canonical.sourceVerificationScope,
    sourceDownloadReceipt: canonical.sourceDownloadReceipt, sourceCitation: canonical.citation,
    sourceUrl: canonical.sourceUrl, datasetDoi: canonical.doi, datasetLicense: canonical.datasetLicense,
    licenseScope: canonical.licenseScope, channel: canonical.electrodes[channelIndex],
    recording: canonical.recording, amplitude: canonical.amplitude, coordinateScope: canonical.coordinateScope,
    claims: canonical.claims, currentLoaderReceipt: { ...chunk, status: "current_derivative_bytes_verified",
      wholeNwbFetchedByBrowser: false },
    display: { representation: "polyline_of_every_stored_sample", xAxis: "source_time_seconds",
      yAxis: "stored_int16_value", physicalAmplitudeRescaling: false, filtering: false,
      decimation: false, zeroPadding: false, isolatedUnitInference: false } };
}

export function buildDandiFullReceipt(proof, channelIndex, firstSample, cursorOffset = 0,
  generatedAt = new Date().toISOString()) {
  assert(typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt)), "invalid receipt date");
  const selection = dandiFullWindow(proof, channelIndex, firstSample, cursorOffset);
  const magnitude = Math.max(1, Math.ceil(Math.max(...selection.samples.map(Math.abs)) * 1.05));
  return freeze({ ...fixedReceiptFields(channelIndex, firstSample), generatedAt, selection,
    plot: { yMinimum: -magnitude, yMaximum: magnitude, autoscale: "symmetric about stored zero from every selected sample" } });
}

/** Preflight metadata only; this never authorizes imported sample values. */
export function inspectDandiFullReceipt(receipt) {
  assert(receipt && typeof receipt === "object", "receipt is not an object");
  const channelIndex = receipt.channel?.channelIndex, firstSample = receipt.selection?.firstSample;
  const cursorOffset = receipt.selection?.cursorOffset;
  const fixed = Object.fromEntries(Object.entries(receipt).filter(([key]) => !["selection", "generatedAt", "plot"].includes(key)));
  assert(same(fixed, fixedReceiptFields(channelIndex, firstSample)), "source, calibration, channel, block or claims changed");
  assert(typeof receipt.generatedAt === "string" && Number.isFinite(Date.parse(receipt.generatedAt)), "invalid receipt date");
  const count = Math.min(3000, 5543424 - firstSample);
  assert(Number.isInteger(cursorOffset) && cursorOffset >= 0 && cursorOffset < count, "invalid native cursor");
  return { channelIndex, firstSample, cursorOffset };
}

export function restoreDandiFullReceipt(receipt, proof) {
  const state = inspectDandiFullReceipt(receipt);
  const expected = buildDandiFullReceipt(proof, state.channelIndex, state.firstSample, state.cursorOffset, receipt.generatedAt);
  assert(same(receipt, expected), "imported values or time differ from current exact source bytes");
  return state;
}

export function dandiFullWindowCsv(proof, channelIndex, firstSample) {
  const current = dandiFullWindow(proof, channelIndex, firstSample);
  const chunk = dandiFullChunkFor(channelIndex, firstSample);
  const header = ["dandiset", "version", "asset_id", "electrical_series_id", "subject_id", "session_id",
    "native_electrode_id", "source_channel_index", "source_sample_index", "source_time_seconds",
    "stored_int16_value", "physical_calibration", "native_declared_unit", "native_conversion", "native_offset",
    "complete_source_sha256", "complete_source_sha256_verified_at_build", "current_block_sha256", "decoded_block_sha256"];
  const rows = current.samples.map((value, i) => ["001469", canonical.releaseId, canonical.sourceAsset.id,
    canonical.sourceContext.seriesObjectId, canonical.sourceContext.subjectId, "",
    canonical.electrodes[channelIndex].nativeElectrodeId, channelIndex, firstSample + i,
    (firstSample + i) / 30000, value, "unverified", "volts", 1, 0, canonical.sourceAsset.sha256Declared,
    true, chunk.sha256, chunk.decodedSha256]);
  const csv = value => { const s = String(value); return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; };
  return [header, ...rows].map(row => row.map(csv).join(",")).join("\n") + "\n";
}
