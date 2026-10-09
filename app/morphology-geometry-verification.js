import sourceFrames from "../data/morphology-source-frame-disclosure-0.1.json" with { type: "json" };
import { assertMorphologyGeometrySourceFrame } from "./morphology-source-frame-runtime.js";

const verifiedPayloads = new WeakMap();
let verificationSequence = 0;
function check(ok, message) { if (!ok) throw new Error(`Morphology byte verification: ${message}`); }
function same(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && (a.length !== b.length || Object.keys(a).length !== a.length || Object.keys(b).length !== b.length)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
}
function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function abortIfNeeded(signal) {
  if (signal?.aborted) throw new DOMException("Morphology verification was cancelled", "AbortError");
}
function canonicalRecord(record, disclosure) {
  const canonical = sourceFrames.records.filter(row => row.neuronId === record?.neuronId);
  check(canonical.length === 1 && same(disclosure, canonical[0]), "the exact current 149-record source disclosure is required");
  check(record.assetId === disclosure.assetId && record.geometry?.available === true
    && ["path", "bytes", "sha256", "rawSwcSha256"].every(key => record.geometry[key] === disclosure.geometryReceipt[key]), "source identity, file bytes or checksum drifted");
  check(record.normalizedMetadata?.sourceFrame === disclosure.sourceCoordinates.sourceFrame
    && record.normalizedMetadata?.dimensionality === disclosure.preparation.dimensionality, "source frame or dimensionality drifted");
  check(record.comparisonMembership === undefined || same(disclosure.membership, {
    collection: record.comparisonMembership.collection, censusContribution: record.comparisonMembership.censusContribution,
    supplementaryContribution: record.comparisonMembership.supplementaryContribution,
  }), "source collection membership drifted");
  return disclosure;
}
export function verifiedMorphologyGeometryUrl(record, disclosure) {
  canonicalRecord(record, disclosure);
  const path = record.geometry.path;
  return path.startsWith("/") ? path : `/data/neuromorpho_release_8_6_124_census_v1/${path}`;
}

/** The only producer of private receipts reads and verifies the actual source bytes. */
export async function readVerifiedMorphologyGeometry(record, disclosure, { fetchImpl = fetch, signal, forceReload = false } = {}) {
  const url = verifiedMorphologyGeometryUrl(record, disclosure);
  abortIfNeeded(signal);
  const response = await fetchImpl(url, { signal, cache: forceReload ? "no-store" : "default" });
  abortIfNeeded(signal);
  check(response.ok, `geometry request failed (${response.status})`);
  const bytes = await response.arrayBuffer();
  abortIfNeeded(signal);
  check(bytes.byteLength === record.geometry.bytes, "geometry byte count changed");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actualSha256 = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
  abortIfNeeded(signal);
  check(actualSha256 === record.geometry.sha256, "geometry checksum verification failed");
  const geometry = JSON.parse(new TextDecoder().decode(bytes));
  check(geometry.neuronId === record.neuronId && geometry.assetId === record.assetId
    && Array.isArray(geometry.segments) && geometry.segments.length === Number(record.morphometrics?.computed?.segmentCount), "geometry identity or authority receipt mismatch");
  assertMorphologyGeometrySourceFrame(disclosure, geometry);
  canonicalRecord(record, disclosure);
  abortIfNeeded(signal);
  freeze(geometry);
  verifiedPayloads.set(geometry, Object.freeze({ status: "verified", neuronId: record.neuronId, assetId: record.assetId,
    path: record.geometry.path, requestUrl: url, bytes: bytes.byteLength, sha256: actualSha256,
    rawSwcSha256: record.geometry.rawSwcSha256, geometryStatus: geometry.geometryStatus,
    sourceFrame: geometry.sourceFrame, dimensionality: disclosure.preparation.dimensionality,
    verifiedAt: new Date().toISOString(), verificationSequence: ++verificationSequence,
    requestCacheMode: forceReload ? "no-store" : "default", scope: "standardized_geometry_bytes_only_raw_swc_hash_declared" }));
  return geometry;
}

/** Cloned payloads and public verified=true declarations cannot manufacture a loader receipt. */
export function morphologyGeometryVerificationReceipt(record, disclosure, geometry) {
  canonicalRecord(record, disclosure);
  const receipt = verifiedPayloads.get(geometry);
  check(receipt && Object.isFrozen(geometry), "this exact immutable payload has no runtime byte-verification receipt");
  check(receipt.neuronId === record.neuronId && receipt.assetId === record.assetId
    && ["path", "bytes", "sha256", "rawSwcSha256"].every(key => receipt[key] === record.geometry[key]), "the current source differs from the verified payload");
  check(geometry.segments.length === Number(record.morphometrics?.computed?.segmentCount), "geometry identity or authority receipt mismatch");
  assertMorphologyGeometrySourceFrame(disclosure, geometry);
  return receipt;
}
