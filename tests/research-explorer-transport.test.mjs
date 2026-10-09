import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateResearchExplorerTransport } from "../tools/build_research_explorer_transport.mjs";
import { compileOhriSourceBytesModule, ohriSourceBytesPlugin, RESEARCH_EXPLORER_BYTE_RECEIPT } from "../tools/ohri-source-bytes-vite-plugin.mjs";
import { loadVerifiedResearchExplorerIndex, researchExplorerLoadingReceipt, RESEARCH_EXPLORER_INDEX_URL, RESEARCH_EXPLORER_TRANSPORT_URL } from "../app/research-explorer-index.js";

const root = fileURLToPath(new URL("../", import.meta.url)), asUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const raw = await readFile(path.join(root, "public/data/research_explorer_index_v1/search-index.json"));
const compressed = await readFile(path.join(root, RESEARCH_EXPLORER_BYTE_RECEIPT.path));
const manifest = JSON.parse(await readFile(path.join(root, "public/data/research_explorer_index_v1/asset-manifest.json")));
const routePath = path.join(root, "app/api/source-records/search-index.json/route.ts");

test("gzip transport is a deterministic lossless representation of the 641-record canonical1.14 index", async () => {
  const report = await validateResearchExplorerTransport();
  assert.equal(report.sourceBytes, 12327624); assert.equal(report.encodedBytes, 628095);
  assert.ok(report.byteReductionPercent > 94); assert.equal(report.scientificRecordsChanged, false);
  assert.deepEqual(gunzipSync(compressed), raw);
});

test("the actual allowlisted server route emits gzip once with the correct HTTP encoding and decoded identity", async () => {
  const plugin = ohriSourceBytesPlugin(root), id = plugin.resolveId("../../../../" + RESEARCH_EXPLORER_BYTE_RECEIPT.path + "?ohri-source-bytes", routePath);
  const code = await plugin.load.call({ addWatchFile() {} }, id);
  assert.doesNotMatch(code, /node:|Buffer|readFile/);
  const source = await readFile(routePath, "utf8");
  const route = await import(asUrl(source.replace(/from "[^"]+\?ohri-source-bytes"/, `from ${JSON.stringify(asUrl(code))}`)));
  const response = route.GET();
  assert.equal(response.headers.get("content-encoding"), "gzip"); assert.equal(response.headers.get("content-length"), "628095");
  assert.match(response.headers.get("content-type"), /application\/json/);
  const delivered = Buffer.from(await response.arrayBuffer()); assert.deepEqual(delivered, compressed); assert.deepEqual(gunzipSync(delivered), raw);
  delivered[100] ^= 1; assert.deepEqual(Buffer.from(await route.GET().arrayBuffer()), compressed);
});

function verifiedFetcher(requests, alter = false) {
  return async (url, options) => {
    requests.push({ url, options });
    if (String(url).endsWith("asset-manifest.json")) return { ok: true, json: async () => manifest };
    const bytes = new Uint8Array(raw); if (alter) bytes[bytes.length - 10] ^= 1;
    return { ok: true, url: "http://localhost" + url, headers: new Headers({ "content-encoding": url === RESEARCH_EXPLORER_TRANSPORT_URL ? "gzip" : "identity", "content-length": String(url === RESEARCH_EXPLORER_TRANSPORT_URL ? compressed.length : raw.length) }), arrayBuffer: async () => bytes.buffer };
  };
}

test("decoded browser bytes still pass the original manifest hash, schema and values; timing receipts are separate metadata", async () => {
  const requests = [], index = await loadVerifiedResearchExplorerIndex({ fetchImpl: verifiedFetcher(requests), transport: "compressed" });
  assert.equal(requests[1].url, RESEARCH_EXPLORER_TRANSPORT_URL);
  assert.deepEqual(index, JSON.parse(raw));
  const receipt = researchExplorerLoadingReceipt(index);
  assert.equal(receipt.recordCount, 641); assert.equal(receipt.verifiedDecodedBytes, raw.length);
  assert.equal(receipt.verifiedDecodedSha256, manifest.index.sha256); assert.equal(receipt.declaredContentLength, compressed.length);
  assert.equal(receipt.canonicalUrl, RESEARCH_EXPLORER_INDEX_URL); assert.equal(receipt.actualTransferBytes, null);
  for (const [key, value] of Object.entries(receipt)) if (key.endsWith("Milliseconds")) assert.ok(Number.isFinite(value) && value >= 0);
  assert.ok(Object.isFrozen(receipt)); assert.equal(researchExplorerLoadingReceipt({}), null);
});

test("bounded original/compressed fresh measurements bypass shared caching without changing the active collection", async () => {
  const requests = [], index = await loadVerifiedResearchExplorerIndex({ fetchImpl: verifiedFetcher(requests), transport: "canonical", forceFresh: true });
  assert.equal(requests[1].url, RESEARCH_EXPLORER_INDEX_URL); assert.equal(requests[1].options.cache, "no-store");
  assert.equal(researchExplorerLoadingReceipt(index).transport, "canonical"); assert.equal(researchExplorerLoadingReceipt(index).forceFresh, true);
  assert.equal(index.records.length, 641);
  await assert.rejects(loadVerifiedResearchExplorerIndex({ fetchImpl: verifiedFetcher([]), transport: "invented" }), /transport is unavailable/);
});

test("default loads revalidate both mutable URLs after an index upgrade while retaining strict checksum validation", async () => {
  const requests = [], currentFetcher = verifiedFetcher(requests);
  const cachedFetcher = async (url, options) => {
    if (!["no-cache", "no-store"].includes(options?.cache)) {
      return { ok: true, json: async () => ({ ...manifest, schemaVersion: "1.13.0", assetSetId: "ohri:research-explorer-index:1.13.0" }), arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    }
    return currentFetcher(url, options);
  };
  const index = await loadVerifiedResearchExplorerIndex({ fetchImpl: cachedFetcher });
  assert.equal(index.assetSetId, manifest.assetSetId);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(({ options }) => options.cache === "no-cache"));
  assert.match(researchExplorerLoadingReceipt(index).browserCacheScope, /revalidation requested/);
  const corruptRequests = [];
  await assert.rejects(loadVerifiedResearchExplorerIndex({ fetchImpl: verifiedFetcher(corruptRequests, true) }), /checksum/);
  assert.ok(corruptRequests.every(({ options }) => options.cache === "no-cache"));
});

test("corrupt decoded and compressed payloads and unsuccessful routes remain fail-closed", async () => {
  await assert.rejects(loadVerifiedResearchExplorerIndex({ fetchImpl: verifiedFetcher([], true) }), /checksum/);
  await assert.rejects(loadVerifiedResearchExplorerIndex({ fetchImpl: async (url) => String(url).endsWith("asset-manifest.json") ? { ok: true, json: async () => manifest } : { ok: false, status: 404 } }), /failed \(404\)/);
  const corrupt = new Uint8Array(compressed); corrupt[50] ^= 1;
  assert.throws(() => compileOhriSourceBytesModule(root, path.join(root, RESEARCH_EXPLORER_BYTE_RECEIPT.path), corrupt), /receipt mismatch/);
});
