import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { readVerifiedMorphologyGeometry, morphologyGeometryVerificationReceipt, verifiedMorphologyGeometryUrl } from "../app/morphology-geometry-verification.js";

const census = JSON.parse(await readFile(new URL("../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", import.meta.url)));
const supplementary = JSON.parse(await readFile(new URL("../data/supplementary-morphology-comparison-adapter-0.1.json", import.meta.url)));
const frames = JSON.parse(await readFile(new URL("../data/morphology-source-frame-disclosure-0.1.json", import.meta.url)));
const rows = [108974, 194468, 45674].map(id => ({ record: census.records.find(row => row.neuronId === id) ?? supplementary.records.find(row => row.neuronId === id), disclosure: frames.records.find(row => row.neuronId === id) }));
for (const fixture of rows) fixture.bytes = await readFile(new URL(`../public${verifiedMorphologyGeometryUrl(fixture.record, fixture.disclosure)}`, import.meta.url));
const buffer = bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const loader = (fixture, options = {}) => readVerifiedMorphologyGeometry(fixture.record, fixture.disclosure, { fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => buffer(fixture.bytes) }), ...options });

test("actual 3D, planar and supplementary bytes produce immutable payload-bound receipts", async () => {
  for (const fixture of rows) {
    const geometry = await loader(fixture);
    const receipt = morphologyGeometryVerificationReceipt(fixture.record, fixture.disclosure, geometry);
    assert.equal(receipt.status, "verified");
    assert.equal(receipt.neuronId, fixture.record.neuronId);
    assert.equal(receipt.bytes, fixture.bytes.byteLength);
    assert.equal(receipt.sha256, fixture.record.geometry.sha256);
    assert.equal(receipt.requestUrl, verifiedMorphologyGeometryUrl(fixture.record, fixture.disclosure));
    assert.equal(receipt.dimensionality, fixture.record.normalizedMetadata.dimensionality);
    assert.equal(receipt.scope, "standardized_geometry_bytes_only_raw_swc_hash_declared");
    assert.ok(Number.isSafeInteger(receipt.verificationSequence) && receipt.verificationSequence > 0);
    assert.ok(Number.isFinite(Date.parse(receipt.verifiedAt)));
    assert.ok(Object.isFrozen(geometry) && Object.isFrozen(geometry.nodes) && Object.isFrozen(geometry.nodes[0]) && Object.isFrozen(geometry.displayTransform));
    assert.throws(() => { geometry.nodes[0][2] += 1; }, TypeError);
    assert.throws(() => { receipt.status = "forged"; }, TypeError);
  }
});

test("JSON clones and public status flags cannot forge the private runtime proof", async () => {
  const fixture = rows[0], verified = await loader(fixture);
  for (const forged of [structuredClone(verified), { ...verified, status: "verified" }, JSON.parse(fixture.bytes)]) {
    assert.throws(() => morphologyGeometryVerificationReceipt(fixture.record, fixture.disclosure, forged), /no runtime byte-verification receipt/);
  }
  assert.throws(() => morphologyGeometryVerificationReceipt(rows[1].record, rows[1].disclosure, verified), /current source differs/);
});

test("truncated and same-length altered bytes fail before a runtime proof is issued", async () => {
  const fixture = rows[0];
  await assert.rejects(() => loader({ ...fixture, bytes: fixture.bytes.subarray(1) }), /byte count changed/);
  const altered = Buffer.from(fixture.bytes); altered[altered.length - 2] ^= 1;
  await assert.rejects(() => loader({ ...fixture, bytes: altered }), /checksum verification failed/);
});

test("current source path, hash, frame, identity and comparison membership are checked before reading", async () => {
  for (const mutate of [
    row => { row.record.geometry.path = "/data/another-object.json"; },
    row => { row.record.geometry.sha256 = "0".repeat(64); },
    row => { row.record.geometry.rawSwcSha256 = "1".repeat(64); },
    row => { row.record.assetId = "another-observation"; },
    row => { row.record.normalizedMetadata.dimensionality = "2D"; },
    row => { row.disclosure.sourceCoordinates.unit = "millimetre"; },
    row => { row.disclosure.sourceCoordinates.displayTransform.scaleViewerUnitPerMicrometre *= 2; },
    row => { row.record.comparisonMembership = { collection: "supplementary", censusContribution: 0, supplementaryContribution: 1 }; },
  ]) {
    const fixture = { ...rows[0], record: structuredClone(rows[0].record), disclosure: structuredClone(rows[0].disclosure) };
    mutate(fixture); let requests = 0;
    await assert.rejects(() => loader(fixture, { fetchImpl: async () => { requests += 1; throw new Error("unexpected source request"); } }), /source|disclosure|membership/);
    assert.equal(requests, 0);
  }
});

test("the current record is revalidated on cache reuse without changing the original verified geometry", async () => {
  const fixture = rows[0], geometry = await loader(fixture), originalNode = [...geometry.nodes[0]];
  const changed = structuredClone(fixture.record); changed.morphometrics.computed.segmentCount += 1;
  assert.throws(() => morphologyGeometryVerificationReceipt(changed, fixture.disclosure, geometry), /authority receipt mismatch/);
  assert.deepEqual(geometry.nodes[0], originalNode);
  assert.equal(morphologyGeometryVerificationReceipt(fixture.record, fixture.disclosure, geometry).sha256, fixture.record.geometry.sha256);
});

test("explicit fresh verification requests no-store and creates a new verification sequence", async () => {
  const fixture = rows[2], before = await loader(fixture); let requestOptions;
  const after = await loader(fixture, { forceReload: true, fetchImpl: async (url, options) => { requestOptions = options; return { ok: true, status: 200, arrayBuffer: async () => buffer(fixture.bytes) }; } });
  assert.equal(requestOptions.cache, "no-store");
  assert.notEqual(after, before);
  assert.ok(morphologyGeometryVerificationReceipt(fixture.record, fixture.disclosure, after).verificationSequence > morphologyGeometryVerificationReceipt(fixture.record, fixture.disclosure, before).verificationSequence);
  assert.equal(morphologyGeometryVerificationReceipt(fixture.record, fixture.disclosure, after).requestCacheMode, "no-store");
  assert.deepEqual(after, before);
});

test("aborted or late source responses cannot issue an attested payload", async () => {
  const fixture = rows[1], early = new AbortController(); early.abort(); let requests = 0;
  await assert.rejects(() => loader(fixture, { signal: early.signal, fetchImpl: async () => { requests += 1; } }), { name: "AbortError" });
  assert.equal(requests, 0);
  const late = new AbortController(); let bytesRead = false;
  await assert.rejects(() => loader(fixture, { signal: late.signal, fetchImpl: async () => { late.abort(); return { ok: true, status: 200, arrayBuffer: async () => { bytesRead = true; return buffer(fixture.bytes); } }; } }), { name: "AbortError" });
  assert.equal(bytesRead, false);
  const duringBytes = new AbortController();
  await assert.rejects(() => loader(fixture, { signal: duringBytes.signal, fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => { duringBytes.abort(); return buffer(fixture.bytes); } }) }), { name: "AbortError" });
});

test("an unavailable source fails without another geometry or proxy", async () => {
  let requests = 0;
  await assert.rejects(() => loader(rows[0], { fetchImpl: async () => { requests += 1; return { ok: false, status: 404 }; } }), /request failed \(404\)/);
  assert.equal(requests, 1);
});
