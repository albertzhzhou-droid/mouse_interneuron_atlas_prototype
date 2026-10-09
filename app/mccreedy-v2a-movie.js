import document from "../data/mccreedy-v2a-movie-0.1.json" with { type: "json" };
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const MCCREEDY_MOVIE = freeze(document);
const owners = new WeakMap();
const check = (condition, message) => { if (!condition) throw new Error(`V2a movie: ${message}`); };
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(k => [k, ordered(value[k])])) : value;
const same = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
export async function verifyMccreedyMovie(bytes, { signal } = {}) {
  signal?.throwIfAborted();
  check(bytes instanceof Uint8Array && bytes.byteLength === document.asset.bytes, "byte length mismatch");
  const privateBytes = new Uint8Array(bytes);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", privateBytes));
  signal?.throwIfAborted();
  check(Array.from(digest, x => x.toString(16).padStart(2, "0")).join("") === document.asset.sha256, "checksum mismatch");
  const proof = freeze({ sourceId: document.sourceId, releaseId: document.releaseId });
  owners.set(proof, privateBytes); return proof;
}
export async function loadMccreedyMovie({ signal, fetchImpl = fetch } = {}) {
  signal?.throwIfAborted();
  const response = await fetchImpl(document.asset.url, { cache: "no-store", signal });
  check(response.ok, `HTTP ${response.status}`);
  check(response.body, "empty response body");
  const reader = response.body.getReader(), chunks = []; let length = 0;
  try {
    while (true) {
      signal?.throwIfAborted(); const { value, done } = await reader.read();
      signal?.throwIfAborted(); if (done) break;
      length += value.length; check(length <= document.asset.bytes, "response exceeds exact movie size"); chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
  return verifyMccreedyMovie(bytes, { signal });
}
export function mccreedyMovieBytes(proof) {
  const bytes = owners.get(proof); check(bytes, "current private byte authority required"); return new Uint8Array(bytes);
}
export function inspectMccreedySelection(selection) {
  check(selection && same(Object.keys(selection).sort(), ["playbackRate", "timeSeconds"]), "invalid playback selection");
  check(Number.isFinite(selection.timeSeconds) && selection.timeSeconds >= 0 && selection.timeSeconds <= document.encodedMedia.durationSeconds, "invalid movie time");
  check(Number.isFinite(selection.playbackRate) && selection.playbackRate >= 0.25 && selection.playbackRate <= 4, "invalid playback rate");
  return { ...selection };
}
export function validateMccreedyDecodedMetadata(value) {
  check(value && value.width === document.encodedMedia.width && value.height === document.encodedMedia.height && Number.isFinite(value.durationSeconds) && Math.abs(value.durationSeconds - document.encodedMedia.durationSeconds) < 1e-6, "decoded movie metadata changed");
  return value;
}
export function buildMccreedyReceipt(proof, selection, generatedAt = new Date().toISOString()) {
  check(owners.has(proof), "current private byte authority required"); inspectMccreedySelection(selection);
  check(typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt)), "invalid date");
  return freeze({ receiptVersion: "0.1.0", contractId: document.contractId, generatedAt, sourceId: document.sourceId, releaseId: document.releaseId,
    selection: { ...selection }, pausedSnapshot: true, asset: document.asset,
    currentLoaderReceipt: { bytesVerified: true, originalMp4FetchedByBrowser: true, checksum: document.asset.sha256, browserFullFrameDecodeVerified: false },
    citation: document.citation, biologicalContext: document.biologicalContext, representation: document.representation, rights: document.rights, boundaries: document.boundaries,
    restorationScope: "Fresh original MP4 bytes and paused playback position/rate only; no 3D camera, clipping, raw slice, geometry or physical cell" });
}
export function inspectMccreedyReceipt(receipt) {
  check(receipt && receipt.receiptVersion === "0.1.0" && receipt.contractId === document.contractId && receipt.sourceId === document.sourceId && receipt.releaseId === document.releaseId, "invalid receipt source or version");
  return inspectMccreedySelection(receipt.selection);
}
export function restoreMccreedyReceipt(receipt, proof) {
  const selection = inspectMccreedyReceipt(receipt);
  check(same(receipt, buildMccreedyReceipt(proof, selection, receipt.generatedAt)), "receipt values or source claims changed"); return selection;
}
