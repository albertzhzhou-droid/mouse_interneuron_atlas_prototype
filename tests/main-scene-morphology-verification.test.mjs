import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { readVerifiedMainSceneMorphology, mainSceneMorphologyVerification } from "../app/main-scene-morphology-verification.js";

const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url)));
const census = await json("data/neuromorpho-census-main-scene-index-0.1.json");
const supplement = await json("data/supplementary-morphology-comparison-adapter-0.1.json");
const pv = await json("data/pv-independent-morphology-routes-0.1.json");
const todd = await json("data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json");
function recordFor(row, supplement = false) {
  const metadata = supplement ? row.normalizedMetadata : row.sourceMetadata, counts = supplement ? row.morphometrics.computed : row.geometry;
  const geometry = { ...row.geometry, geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL", sourceFrame: metadata.sourceFrame,
    dimensionality: metadata.dimensionality, sourceDiameterAvailable: metadata.sourceDiameterAvailable,
    nodeCount: counts.nodeCount, segmentCount: counts.segmentCount };
  return { neuronId: row.neuronId, assetId: row.assetId, geometry,
    axon: { sourceDomain: metadata.domain, sourceType2NodeCount: counts.nodeTypeCounts["2"] ?? 0, completeAxon: false },
    modes: { observedSwc: { available: true }, radiusSurface: { available: geometry.dimensionality === "3D" && geometry.sourceDiameterAvailable }, internalStructure: { available: false } } };
}
const records = [...census.records.map(row => recordFor(row)), ...supplement.records.map(row => recordFor(row, true)), ...todd.routes.map(row => row.fidelityRecord), ...pv.routes.map(row => row.fidelityRecord)];
const byId = id => records.find(row => row.neuronId === id);
const actualFetch = async url => {
  const bytes = await readFile(new URL(`../public${url}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const load = (record, options = {}) => readVerifiedMainSceneMorphology(record, { fetchImpl: actualFetch, ...options });

test("all 181 exact current source files produce private proofs with independent 142 + 7 + 30 + 2 memberships", async () => {
  const count = { census: 0, supplementary: 0, todd_supplementary: 0, pv_supplementary: 0 };
  for (const record of records) {
    const geometry = await load(record), { geometryVerification: proof, sourceContext: context } = mainSceneMorphologyVerification(record, geometry);
    count[proof.membership] += 1;
    assert.equal(proof.neuronId, record.neuronId); assert.equal(proof.bytes, record.geometry.bytes);
    assert.equal(proof.sha256, record.geometry.sha256); assert.equal(proof.scope, "standardized_geometry_bytes_only_raw_swc_hash_declared");
    assert.equal(context.sourceIdentity.nodes.cell.id, null); assert.equal(context.sourceIdentity.nodes.section.id, null);
    assert.equal(context.sourceIdentity.nodes.component.id, String(record.neuronId));
    assert.equal(context.registrationCount, 0); assert.equal(context.sameCellInternalObjectCount, 0);
    assert.equal(proof.repositoryRelease, proof.membership === "todd_supplementary" ? "8.6.126" : "8.6.124");
    assert.equal(context.sourceIdentity.releaseId, proof.repositoryRelease);
    assert.equal(proof.censusContribution, proof.membership === "census" ? 1 : 0);
    assert.ok(Object.isFrozen(geometry.nodes[0]) && Object.isFrozen(context.sourceFrameDisclosure));
    if (proof.membership === "todd_supplementary") {
      assert.equal(context.sourceFrameDisclosure.documentType, "todd_8_6_126_verified_geometry_frame");
      assert.equal(context.sourceFrameDisclosure.paperMapping.exactStudyCellJoin, false);
      assert.deepEqual(context.sourceFrameDisclosure.paperMapping.rawReferenceFields.reference_pmid, ["2017"]);
      assert.equal(context.sourceFrameDisclosure.paperMapping.candidateContext.relationStatus, "candidate_context_only_record_level_crosswalk_unverified");
    }
  }
  assert.deepEqual(count, { census: 142, supplementary: 7, todd_supplementary: 30, pv_supplementary: 2 });
});

test("copies, public verified status and cross-source payloads cannot supply current loader proof", async () => {
  const record = byId(322379), geometry = await load(record);
  assert.throws(() => mainSceneMorphologyVerification(record, structuredClone(geometry)), /no current main-scene runtime proof/);
  assert.throws(() => mainSceneMorphologyVerification(record, { ...geometry, verified: true }), /no current main-scene runtime proof/);
  assert.throws(() => mainSceneMorphologyVerification(byId(322380), geometry), /no current main-scene runtime proof/);
  const returned = mainSceneMorphologyVerification(record, geometry);
  assert.throws(() => { returned.sourceContext.repositoryRelease = "8.6.124"; }, TypeError);
  assert.throws(() => { geometry.nodes[1][4] += 10; }, TypeError);
});

test("file, counts, domain, dimensionality and internal authorization drift fail before any request", async () => {
  for (const id of [108974, 194469, 45674, 322379, 170034, 118824]) for (const mutate of [
    row => { row.geometry.path = "/data/another-record.json"; }, row => { row.geometry.rawSwcSha256 = "0".repeat(64); },
    row => { row.geometry.bytes += 1; }, row => { row.geometry.nodeCount += 1; }, row => { row.geometry.dimensionality = "fake"; },
    row => { row.geometry.sourceDiameterAvailable = !row.geometry.sourceDiameterAvailable; }, row => { row.axon.sourceDomain = "new domain"; },
    row => { row.axon.completeAxon = true; }, row => { row.modes.internalStructure.available = true; },
    row => { row.modes.radiusSurface.available = !row.modes.radiusSurface.available; },
  ]) {
    const changed = structuredClone(byId(id)); mutate(changed); let requests = 0;
    await assert.rejects(() => load(changed, { fetchImpl: async () => { requests += 1; } }), /changed/);
    assert.equal(requests, 0);
  }
});

test("truncated, altered, missing and cancelled Todd bytes never issue a geometry proof", async () => {
  const record = byId(322379), bytes = await readFile(new URL(`../public${record.geometry.path}`, import.meta.url));
  const fetchBytes = value => async () => ({ ok: true, status: 200, arrayBuffer: async () => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) });
  await assert.rejects(() => load(record, { fetchImpl: fetchBytes(bytes.subarray(1)) }), /byte count changed/);
  const changed = Buffer.from(bytes); changed[changed.length - 2] ^= 1;
  await assert.rejects(() => load(record, { fetchImpl: fetchBytes(changed) }), /checksum verification failed/);
  await assert.rejects(() => load(record, { fetchImpl: async () => ({ ok: false, status: 404 }) }), /request failed \(404\)/);
  for (const stage of ["before", "response", "body"]) {
    const controller = new AbortController(); if (stage === "before") controller.abort();
    await assert.rejects(() => load(record, { signal: controller.signal, fetchImpl: async () => {
      if (stage === "response") controller.abort();
      return { ok: true, status: 200, arrayBuffer: async () => { if (stage === "body") controller.abort(); return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); } };
    } }), { name: "AbortError" });
  }
});

test("fresh same-source requests use no-store and create a new attestation without changing native geometry", async () => {
  for (const id of [108974, 194469, 45674, 322379, 170034, 118824]) {
    const record = byId(id), before = await load(record); let observedOptions;
    const after = await load(record, { forceReload: true, fetchImpl: async (url, options) => { observedOptions = options; return actualFetch(url, options); } });
    const left = mainSceneMorphologyVerification(record, before), right = mainSceneMorphologyVerification(record, after);
    assert.deepEqual(after, before); assert.notEqual(after, before); assert.equal(observedOptions.cache, "no-store");
    assert.ok(right.geometryVerification.mainSceneVerificationSequence > left.geometryVerification.mainSceneVerificationSequence);
    assert.equal(right.geometryVerification.requestCacheMode, "no-store");
    assert.equal(right.sourceContext.sourceFrameDisclosure.sourceCoordinates.sharedScaleAuthority, false);
  }
});
