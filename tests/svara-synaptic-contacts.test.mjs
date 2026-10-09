import assert from "node:assert/strict";
import test from "node:test";
import { open } from "node:fs/promises";
import { SVARA_CONTACTS, SVARA_CONTACT_DEFAULT, svaraContactGroup, verifySvaraContacts, loadSvaraContacts,
  svaraVerifiedContactData, svaraVerifiedContactBytes, svaraContactPair, buildSvaraContactReceipt,
  inspectSvaraContactReceipt, restoreSvaraContactReceipt, svaraContactCsv,
  readSvaraContactLocation, writeSvaraContactLocation, svaraContactLink } from "../app/svara-synaptic-contacts.js";
import { validateSvaraSynapticContacts } from "../scripts/validate-svara-synaptic-contacts-0.1.mjs";
const bytes = async group => {
  const file = await open(new URL(`../public${svaraContactGroup(group).asset.url}`, import.meta.url), "r");
  try {
    const info = await file.stat(), data = new Uint8Array(info.size); let at = 0;
    while (at < data.length) { const result = await file.read(data, at, Math.min(4096, data.length - at), at); assert.ok(result.bytesRead); at += result.bytesRead; }
    assert.equal((await file.stat()).size, data.length); return data;
  } finally { await file.close(); }
};
const proofFor = async group => verifySvaraContacts(await bytes(group), group);

test("all 4,964 native matrix positions reconcile with 734 distinct source rows, not count-valued matrices", async () => {
  const result = await validateSvaraSynapticContacts();
  assert.equal(result.contactRows, 734); assert.equal(result.matrixCells, 4964); assert.equal(result.distinctListedPairs, 516);
  assert.deepEqual(SVARA_CONTACTS.groups.map(x => x.summary.literalZeros), [2470, 1978]);
  const pair = svaraContactPair(await proofFor("CoBL"), { group: "CoBL", pre: "CoBL 001", post: "Motoneuron 001 (CaP)" });
  assert.equal(pair.matrixSourceText, "2.57447328727"); assert.equal(pair.derivedContactCount, 6);
  assert.deepEqual(pair.contacts.map(x => x.sourceRow), [2, 3, 4, 5, 6, 7]);
  assert.equal(pair.contacts[5].areaText, "1.15016741105"); assert.ok(pair.matrixSumAbsoluteDifference < 1e-9);
});
test("source zeros remain zeros; labels and native precision survive without fake contacts or physical parents", async () => {
  const proof = await proofFor("CiD"), zero = svaraContactPair(proof, { group: "CiD", pre: "CiD 002", post: "Motoneuron 001 (CaP)" });
  assert.equal(zero.matrixSourceText, "0"); assert.equal(zero.derivedContactCount, 0); assert.deepEqual(zero.contacts, []);
  const receipt = buildSvaraContactReceipt(proof, SVARA_CONTACT_DEFAULT);
  assert.equal(receipt.pair.matrixCell, "Q2"); assert.equal(receipt.pair.contacts[0].areaText, "0.17030770554800001");
  assert.equal(receipt.representation.physicalCellMappingEstablished, false);
  assert.equal(receipt.representation.functionalTransmissionEstablished, false);
  assert.equal(receipt.interpretation.matrixUnitExplicitInWorkbook, false);
  assert.equal(receipt.interpretation.unitLocator.CiD, "file_3055227 / CiD to MN Contacts!C1: Synaptic Contact Area [µm²]");
  assert.equal(receipt.biologicalContext.specimenId, null); assert.equal(receipt.rights.freidokWrapperCovered, false);
  assert.throws(() => svaraContactPair(proof, { group: "CiD", pre: "CiD 001", post: "Motoneuron 001" }), /unavailable/);
});
test("current table authority is private and immutable, isolated by group and caller buffers", async () => {
  const source = await bytes("CiD"), original = source.slice(), proof = await verifySvaraContacts(source, "CiD");
  source.fill(0); svaraVerifiedContactBytes(proof, "CiD").fill(1);
  assert.deepEqual(svaraVerifiedContactBytes(proof, "CiD"), original);
  assert.ok(Object.isFrozen(svaraVerifiedContactData(proof, "CiD").contacts.rows[0]));
  for (const fake of [{ group: "CiD" }, structuredClone(proof), SVARA_CONTACTS.groups[0]]) assert.throws(() => svaraVerifiedContactData(fake, "CiD"), /authority/);
  assert.throws(() => svaraVerifiedContactData(proof, "CoBL"), /authority/);
  const damaged = original.slice(); damaged[damaged.length - 2] ^= 1;
  await assert.rejects(verifySvaraContacts(damaged, "CiD"), /checksum/);
  await assert.rejects(verifySvaraContacts(original.subarray(1), "CiD"), /length/);
});
test("loader requires no-store current bytes and rejects HTTP failures and latest-request cancellation", async () => {
  let request;
  const proof = await loadSvaraContacts("CiD", { fetchImpl: async (url, options) => { request = { url, options }; return new Response(await bytes("CiD")); } });
  assert.equal(request.options.cache, "no-store"); assert.equal(request.url, SVARA_CONTACTS.groups[0].asset.url);
  assert.equal(buildSvaraContactReceipt(proof, SVARA_CONTACT_DEFAULT).currentLoaderReceipt.originalXlsxFetchedByBrowser, false);
  await assert.rejects(loadSvaraContacts("CiD", { fetchImpl: async () => new Response("", { status: 503 }) }), /503/);
  const before = new AbortController(); before.abort(); let called = false;
  await assert.rejects(loadSvaraContacts("CiD", { signal: before.signal, fetchImpl: async () => { called = true; } }), /abort/i); assert.equal(called, false);
  const during = new AbortController();
  await assert.rejects(loadSvaraContacts("CiD", { signal: during.signal, fetchImpl: async () => ({ ok: true, arrayBuffer: async () => { const source = await bytes("CiD"); during.abort(); return source.buffer; } }) }), /abort/i);
});
test("pair receipt restores against fresh table bytes and refuses tampered row values, units, identity and extra claims", async () => {
  const proof = await proofFor("CoBL"), selection = { group: "CoBL", pre: "CoBL 001", post: "Motoneuron 001 (CaP)" };
  const receipt = buildSvaraContactReceipt(proof, selection, "2026-10-02T23:00:00Z");
  const reordered = Object.fromEntries(Object.entries(structuredClone(receipt)).reverse());
  assert.deepEqual(restoreSvaraContactReceipt(reordered, await proofFor("CoBL")), selection);
  for (const alter of [x => { x.pair.contacts.pop(); }, x => { x.pair.contacts[0].areaText = "0"; }, x => { x.pair.matrixSourceText = "6"; },
    x => { x.interpretation.contactAreaUnit = "mm²"; }, x => { x.rights.freidokWrapperCovered = true; }, x => { x.representation.editableGeometry = true; },
    x => { x.sourceWorkbooks.contacts.sha256 = "0".repeat(64); }, x => { x.currentLoaderReceipt.originalXlsxFetchedByBrowser = true; }, x => { x.geometry = []; }]) {
    const damaged = structuredClone(receipt); alter(damaged); assert.throws(() => restoreSvaraContactReceipt(damaged, proof), /changed/);
  }
  const badVersion = structuredClone(receipt); badVersion.releaseId += ":other"; assert.throws(() => inspectSvaraContactReceipt(badVersion), /release/);
  assert.throws(() => restoreSvaraContactReceipt(receipt, awaitProofPlaceholder()), /authority/);
  function awaitProofPlaceholder() { return { group: "CoBL" }; }
});
test("CSV preserves every selected contact row and native numeric token, with independent matrix metadata for zero pairs", async () => {
  const proof = await proofFor("CoBL"), selection = { group: "CoBL", pre: "CoBL 001", post: "Motoneuron 001 (CaP)" };
  const csv = svaraContactCsv(proof, selection);
  assert.equal(csv.trim().split("\r\n").length, 8); assert.match(csv, /"C[o]BL to MN Contacts","A7:C7","1\.15016741105","µm²"/);
  assert.match(csv, /"matrix".*"2\.57447328727","","6"/);
  const zero = svaraContactCsv(await proofFor("CiD"), { group: "CiD", pre: "CiD 002", post: "Motoneuron 001 (CaP)" });
  assert.equal(zero.trim().split("\r\n").length, 2); assert.doesNotMatch(zero, /"contact",/);
});
test("all 4,964 exact native pairs round trip in source-qualified URLs, without authority or cross-workspace takeover", () => {
  for (const group of SVARA_CONTACTS.groups) for (const pre of group.pre) for (const post of group.post) {
    const selection = { group: group.id, pre, post }; assert.deepEqual(readSvaraContactLocation(svaraContactLink(selection)), { selection, refusal: null });
  }
  assert.deepEqual(readSvaraContactLocation("/connectivity/svara?neighbor=1").selection, SVARA_CONTACT_DEFAULT);
  const link = writeSvaraContactLocation("/connectivity/svara?neighbor=kept#rows", SVARA_CONTACT_DEFAULT); assert.match(link, /neighbor=kept/); assert.match(link, /#rows$/);
  for (const bad of ["/connectivity/svara?contactPre=CiD+001", svaraContactLink(SVARA_CONTACT_DEFAULT) + "&contactPre=CiD+002",
    svaraContactLink(SVARA_CONTACT_DEFAULT).replace("3055210%3A7", "3055210%3A8"),
    svaraContactLink(SVARA_CONTACT_DEFAULT).replace("Motoneuron+016", "Motoneuron+139"), "/catalogues/svara"]) {
    const result = readSvaraContactLocation(bad); assert.equal(result.selection, null); assert.ok(result.refusal);
  }
  assert.throws(() => writeSvaraContactLocation("/?record=mine", SVARA_CONTACT_DEFAULT), /workspace/);
});
