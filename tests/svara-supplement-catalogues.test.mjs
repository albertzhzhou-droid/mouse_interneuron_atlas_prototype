import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { SVARA_CATALOGUES, svaraCatalogueEntry, svaraCatalogueIdentity, verifySvaraCataloguePage,
  loadSvaraCataloguePage, svaraVerifiedPageBytes, buildSvaraCatalogueReceipt,
  inspectSvaraCatalogueReceipt, restoreSvaraCatalogueReceipt } from "../app/svara-catalogues.js";
import { validateSvaraSupplementCatalogues } from "../scripts/validate-svara-supplement-catalogues-0.1.mjs";
const bytes = async key => new Uint8Array(await readFile(new URL(`../public${svaraCatalogueEntry(key).raster.url}`, import.meta.url)));
const key = "mmc7:CiD 001";

test("all 212 pages retain exact official archive/member lineage, published strings and PNG receipts", async () => {
  assert.equal((await validateSvaraSupplementCatalogues()).publicationEntries, 212);
  assert.deepEqual(SVARA_CATALOGUES.summary.bySourceClass, { Motoneuron: 139, CiD: 39, CoBL: 34 });
  assert.equal(svaraCatalogueEntry(key).reportedFields.find(field => field.label === "TSI").sourceText, "-1");
  assert.equal(svaraCatalogueEntry("mmc8:CoBL 034").reportedFields.find(field => field.label === "TSI").sourceText, "-0.27");
  assert.equal(SVARA_CATALOGUES.entries.reduce((total, entry) => total + entry.reportedFields.length, 0), 914);
  assert.deepEqual(SVARA_CATALOGUES.entries.filter(entry => entry.reportedFields.some(field => field.label === "TSI" && field.sourceText === "N / A")).map(entry => entry.key),
    ["mmc7:CiD 002", "mmc7:CiD 006", "mmc7:CiD 010", "mmc7:CiD 019"]);
  assert.equal(svaraCatalogueEntry("mmc6:Motoneuron 041").reportedFields.find(field => field.label === "Dendritic Path Length").sourceText, "0.00 µm");
});

test("publication entry identity does not manufacture a physical cell, parent chain or mouse linkage", () => {
  const identity = svaraCatalogueIdentity(key);
  assert.equal(identity.namespace, "file_3055231"); assert.equal(identity.nodes.component.id, "CiD 001");
  assert.equal(identity.nodes.cell.id, null); assert.equal(identity.parents.component.key, null);
  assert.equal(identity.registrationCount, 0); assert.equal(identity.population.status, "unknown");
  assert.throws(() => svaraCatalogueEntry("mmc6:CiD 001"), /unavailable/);
  assert.throws(() => svaraCatalogueEntry("mmc7:CiD 040"), /unavailable/);
});

test("caller buffers and exported byte copies cannot alter private current page proof", async () => {
  const source = await bytes(key), original = source.slice();
  const proof = await verifySvaraCataloguePage(source, key);
  source.fill(0); const exported = svaraVerifiedPageBytes(proof, key); exported.fill(1);
  assert.deepEqual(svaraVerifiedPageBytes(proof, key), original);
  assert.ok(Object.isFrozen(proof));
});

test("metadata, cloned proofs, other pages and corrupted PNG bytes cannot authorize display/export", async () => {
  const proof = await verifySvaraCataloguePage(await bytes(key), key);
  for (const fake of [{ key }, structuredClone(proof), SVARA_CATALOGUES.entries[139]]) assert.throws(() => svaraVerifiedPageBytes(fake, key), /authority/);
  assert.throws(() => svaraVerifiedPageBytes(proof, "mmc7:CiD 002"), /authority/);
  const damaged = await bytes(key); damaged[damaged.length - 30] ^= 1;
  await assert.rejects(verifySvaraCataloguePage(damaged, key), /checksum/);
  await assert.rejects(verifySvaraCataloguePage(damaged.subarray(1), key), /length/);
  await assert.rejects(verifySvaraCataloguePage(await bytes("mmc7:CiD 002"), key), /length|checksum/);
});

test("the loader fetches only the selected PNG with no-store and verifies its bytes", async () => {
  let call;
  const proof = await loadSvaraCataloguePage(key, { fetchImpl: async (url, options) => {
    call = { url, options }; return new Response(await bytes(key));
  } });
  assert.equal(call.url, svaraCatalogueEntry(key).raster.url); assert.equal(call.options.cache, "no-store");
  const receipt = buildSvaraCatalogueReceipt(proof, key);
  assert.equal(receipt.currentLoaderReceipt.originalPdfFetchedByBrowser, false);
  assert.equal(receipt.currentLoaderReceipt.originalZipFetchedByBrowser, false);
  assert.equal(receipt.extraction.sourcePdfHashesVerifiedAtBuild, true);
});

test("HTTP failure and cancellation before or during loading clear page authority", async () => {
  await assert.rejects(loadSvaraCataloguePage(key, { fetchImpl: async () => new Response("", { status: 503 }) }), /503/);
  const before = new AbortController(); before.abort(); let called = false;
  await assert.rejects(loadSvaraCataloguePage(key, { signal: before.signal, fetchImpl: async () => { called = true; return new Response(); } }), /abort/i);
  assert.equal(called, false);
  const during = new AbortController();
  await assert.rejects(loadSvaraCataloguePage(key, { signal: during.signal, fetchImpl: async () => ({ ok: true,
    arrayBuffer: async () => { const data = await bytes(key); during.abort(); return data.buffer; } }) }), /abort/i);
});

test("fresh byte proof restores an exact source page, independent of JSON object key order", async () => {
  const receipt = buildSvaraCatalogueReceipt(await verifySvaraCataloguePage(await bytes(key), key), key, "2026-10-02T22:00:00Z");
  const reordered = Object.fromEntries(Object.entries(JSON.parse(JSON.stringify(receipt))).reverse());
  assert.deepEqual(inspectSvaraCatalogueReceipt(reordered), { key });
  const fresh = await loadSvaraCataloguePage(key, { fetchImpl: async () => new Response(await bytes(key)) });
  assert.deepEqual(restoreSvaraCatalogueReceipt(reordered, fresh), { key });
  assert.throws(() => restoreSvaraCatalogueReceipt(receipt, structuredClone(fresh)), /authority/);
});

test("restoration refuses changed reported values, source version, rights, dimensions and scientific claims", async () => {
  const proof = await verifySvaraCataloguePage(await bytes(key), key);
  const receipt = buildSvaraCatalogueReceipt(proof, key);
  for (const alter of [
    value => { value.selection.reportedFields[2].sourceText = "0"; },
    value => { value.sourceIdentity.releaseId = "MPG:item_3055210:8"; },
    value => { value.rights.otherRepositoriesOrKohVersionCovered = true; },
    value => { value.selection.raster.widthPixels += 1; },
    value => { value.representation.editableSkeletons = 1; },
    value => { value.biologicalContext.geneticV2aAssignment = true; },
    value => { value.selection.key = "mmc7:CiD 002"; },
    value => { value.currentLoaderReceipt.originalPdfFetchedByBrowser = true; },
    value => { value.geometry = { invented: true }; },
  ]) {
    const changed = structuredClone(receipt); alter(changed);
    assert.throws(() => inspectSvaraCatalogueReceipt(changed), /changed/);
    assert.throws(() => restoreSvaraCatalogueReceipt(changed, proof), /changed/);
  }
  const changed = structuredClone(receipt); changed.generatedAt = "unverified";
  assert.throws(() => inspectSvaraCatalogueReceipt(changed), /date/);
});

test("the canonical source document and all source strings remain immutable", async () => {
  assert.ok(Object.isFrozen(SVARA_CATALOGUES.entries[139].reportedFields));
  const changed = structuredClone(SVARA_CATALOGUES); changed.entries[139].reportedFields[2].sourceText = "1";
  await assert.rejects(validateSvaraSupplementCatalogues(changed));
});
