import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { validateCanoCholRnaDocument, findCanoCholRnaFeatures, parseCanoCholRnaChunk, loadCanoCholRnaChunk, canoCholRnaStatistics, canoCholRnaReceipt, canoCholRnaCsv } from "../app/cano-chol-rna-counts.js";
import { validateCanoCholRnaCounts } from "../scripts/validate-cano-chol-rna-counts-0.1.mjs";
const doc = validateCanoCholRnaDocument(JSON.parse(await readFile(new URL("../data/cano-chol-rna-counts-0.1.json", import.meta.url))));
const feature = "Chat", number = Math.floor(doc.genes.indexOf(feature) / 256), profile = doc.profiles[10];
const bytes = new Uint8Array(await readFile(new URL("../" + doc.chunks[number].path, import.meta.url)));
const decoded = gunzipSync(bytes), data = JSON.parse(decoded), row = data.features.find(f => f[1] === feature);
const options = { fetchImpl: async () => new Response(bytes), decompressImpl: async b => new Uint8Array(gunzipSync(b)) };
test("all 32,285 features replay every one of the 923 original RNA column totals and retained profile identities", async () => {
  const r = await validateCanoCholRnaCounts(); assert.equal(r.totalCount, 22637377); assert.equal(r.positiveEntries, 4610528); assert.equal(r.mismatches, 0); assert.equal(r.features, 32285);
});
test("feature discovery preserves native case and absent genes remain distinct from deposited zero", async () => {
  assert.equal(findCanoCholRnaFeatures(doc, "cHaT").features[0].name, "Chat"); assert.equal(findCanoCholRnaFeatures(doc, "no_such_native_feature").total, 0);
  await assert.rejects(loadCanoCholRnaChunk(doc, "no_such_native_feature", options), /absent/);
  const z = doc.genes.find(g => data.features.some(f => f[1] === g && f[2].every(n => n === 0)));
  assert.ok(z); const chunk = await loadCanoCholRnaChunk(doc, z, options); assert.equal(canoCholRnaStatistics(doc, chunk, z, profile.id).currentProfile.totalCount, 0);
});
test("actual counts, selected column identity, all-profile summaries, and per-nucleus CSV agree with the source chunk", async () => {
  const chunk = await loadCanoCholRnaChunk(doc, feature, options); const n = doc.nuclei.find(n => n.profileId === profile.id), j = doc.nuclei.indexOf(n);
  const stats = canoCholRnaStatistics(doc, chunk, feature, profile.id, n.key); assert.equal(stats.selectedNucleus.count, row[2][j]); assert.equal(stats.selectedNucleus.countsColumn, n.metadataRow);
  const independent = doc.nuclei.flatMap((n, i) => n.profileId === profile.id ? [row[2][i]] : []);
  assert.equal(stats.currentProfile.totalCount, independent.reduce((a, b) => a + b, 0)); assert.equal(stats.currentProfile.detectedNuclei, independent.filter(x => x > 0).length);
  const receipt = canoCholRnaReceipt(doc, chunk, feature, profile.id, n.key); assert.equal(receipt.source.layer, "counts"); assert.equal(receipt.scope.rnaAtacPairingVerified, false); assert.equal(receipt.profiles.length, 11);
  const csv = canoCholRnaCsv(doc, chunk, feature, profile.id); assert.equal(csv.trim().split("\n").length, profile.nucleusCount + 1); assert.ok(csv.includes(n.key));
  const other = doc.nuclei.find(n => n.profileId !== profile.id); assert.throws(() => canoCholRnaReceipt(doc, chunk, feature, profile.id, other.key), /does not belong/);
});
test("current byte authority cannot be fabricated, cloned, reassigned to another document, or used for another chunk", async () => {
  const chunk = await loadCanoCholRnaChunk(doc, feature, options); assert.ok(Object.isFrozen(chunk)); assert.ok(Object.isFrozen(doc.nuclei[0]));
  assert.throws(() => canoCholRnaReceipt(doc, { ...chunk }, feature, profile.id), /private byte/);
  assert.throws(() => canoCholRnaReceipt(structuredClone(doc), chunk, feature, profile.id), /private byte/);
  const wrong = doc.genes.find((g, j) => Math.floor(j / 256) !== number); assert.throws(() => canoCholRnaReceipt(doc, chunk, wrong, profile.id), /outside/);
});
test("count checksum, decoded receipt, HTTP and request cancellation fail before any count authority exists", async () => {
  const bad = bytes.slice(); bad[100] ^= 1; await assert.rejects(loadCanoCholRnaChunk(doc, feature, { ...options, fetchImpl: async () => new Response(bad) }), /compressed counts checksum/);
  await assert.rejects(loadCanoCholRnaChunk(doc, feature, { ...options, decompressImpl: async () => new Uint8Array(decoded.length) }), /decoded counts checksum/);
  await assert.rejects(loadCanoCholRnaChunk(doc, feature, { fetchImpl: async () => new Response(null, { status: 404 }) }), /unavailable/);
  const c = new AbortController(); c.abort(); await assert.rejects(loadCanoCholRnaChunk(doc, feature, { ...options, signal: c.signal }), /cancelled/);
  const pending = new AbortController(); let finish; const promise = loadCanoCholRnaChunk(doc, feature, { ...options, signal: pending.signal, fetchImpl: async () => new Promise(r => { finish = r; }) });
  await new Promise(r => setImmediate(r)); pending.abort(); finish(new Response(bytes)); await assert.rejects(promise, /cancelled/);
});
test("wrong layer, inferred pairing, source identities, feature order and noninteger counts are rejected", () => {
  for (const mutate of [d => d.source.layer = "data", d => d.scope.rnaAtacPairingVerified = true, d => d.nuclei[0].countsColumn++, d => d.nuclei[0].key = "fake", d => d.genes[1] = d.genes[0]]) { const d = structuredClone(doc); mutate(d); assert.throws(() => validateCanoCholRnaDocument(d)); }
  for (const mutate of [d => d.features[0][2][0] = 1.5, d => d.features[0][2][0] = -1, d => d.features[0][1] = "wrong_feature", d => d.chunk++]) { const d = structuredClone(data); mutate(d); assert.throws(() => parseCanoCholRnaChunk(JSON.stringify(d), doc, number)); }
});
