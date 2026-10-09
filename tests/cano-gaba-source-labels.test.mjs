import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { validateCanoGabaLabels, parseCanoGabaAssignmentText, loadCanoGabaAssignments, listCanoGabaNuclei, canoGabaNucleusReceipt } from "../app/cano-gaba-source-labels.js";
import { sourceCsvRows, validateCanoGabaSourceLabels } from "../scripts/validate-cano-gaba-source-labels-0.1.mjs";
const doc = JSON.parse(readFileSync(new URL("../data/cano-gomez-gaba-source-labels-0.1.json", import.meta.url)));
const compressed = readFileSync(new URL(`../${doc.artifact.path}`, import.meta.url)), plain = gunzipSync(compressed).toString("utf8");
const fetchImpl = async () => new Response(new Uint8Array(compressed));

test("all 73,364 original metadata rows and 204 labels replay without substitution", async () => {
  assert.deepEqual(await validateCanoGabaSourceLabels(), { rows: 73364, labels: 204, groups: 24, exactSourceRows: 73364, mismatches: 0, originalRdsReacquired: false, confirmedProfilesAdded: 0 });
  assert.deepEqual(sourceCsvRows('"x",NA,"NA","","Unassigned"\n'), [["x", null, "NA", "", "Unassigned"]]);
});
test("metadata counts cannot authorize interneuron, marker, donor or same-cell claims", () => {
  for (const key of ["confirmedInterneuronAdmission", "markerInferenceFromLabelTokens", "crossAssayCellIdentity", "geometry", "donorIdentity", "sectionIdentity"]) {
    const forged = structuredClone(doc); forged.boundaries[key] = true; assert.throws(() => validateCanoGabaLabels(forged), /unestablished/);
  }
  const source = structuredClone(doc); source.source.fileName = "GSE318731_P56_cholinergic_multiome.rds"; assert.throws(() => validateCanoGabaLabels(source), /source scope/);
});
test("wrong full-string parent, altered assignment, source NA substitution and reordering are rejected", () => {
  const end = plain.indexOf("\n"), first = JSON.parse(plain.slice(0, end)), rest = plain.slice(end);
  for (const mutate of [r => { r.key = "GSE318731|other.rds|" + r.raw.nucleus_id; }, r => { r.raw.neuron_type = "unknown"; }, r => { r.raw.sex = "Female"; }, r => { r.sourceRow = 2; }]) {
    const row = structuredClone(first); mutate(row); assert.throws(() => parseCanoGabaAssignmentText(JSON.stringify(row) + rest, doc));
  }
  const line2 = plain.indexOf("\n", end + 1); assert.throws(() => parseCanoGabaAssignmentText(plain.slice(end + 1, line2 + 1) + plain.slice(0, end + 1) + plain.slice(line2 + 1), doc), /order/);
});
test("current runtime roster verifies both transport and all source label membership", async () => {
  const roster = await loadCanoGabaAssignments(doc, { fetchImpl }); const row = roster.rows[0];
  const page = listCanoGabaNuclei(roster, row.labelId, { query: row.raw.nucleus_id, page: 100 }); assert.equal(page.currentPage, 0); assert.equal(page.matchedCount, 1);
  const receipt = canoGabaNucleusReceipt(doc, roster, row.labelId, page.rows[0]); assert.equal(receipt.row.key, row.key); assert.equal(receipt.row.raw.source, null); assert.equal(receipt.row.raw.sex, null); assert.equal(receipt.source.originalRdsReacquiredThisIteration, false); assert.ok(Object.values(receipt.claims).every(n => n === 0));
  assert.throws(() => listCanoGabaNuclei({ ...roster }, row.labelId), /private verified/);
  assert.throws(() => canoGabaNucleusReceipt(doc, roster, row.labelId, { ...row }), /owned row/);
  const otherLabel = doc.labels.find(label => label.id !== row.labelId); assert.throws(() => canoGabaNucleusReceipt(doc, roster, otherLabel.id, row), /owned row/);
  assert.equal(listCanoGabaNuclei(roster, row.labelId, { query: "no-such-nucleus" }).rows.length, 0);
});
test("same-length source corruption and changed decoded receipts cannot produce a verified roster", async () => {
  const broken = Uint8Array.from(compressed); broken[50] ^= 1;
  await assert.rejects(loadCanoGabaAssignments(doc, { fetchImpl: async () => new Response(broken) }), /compressed source bytes/);
  const forged = structuredClone(doc); forged.artifact.uncompressedSha256 = "0".repeat(64); await assert.rejects(loadCanoGabaAssignments(forged, { fetchImpl }), /decoded source bytes/);
});
test("cancelled requests never acquire runtime ownership", async () => {
  const controller = new AbortController(); controller.abort(); await assert.rejects(loadCanoGabaAssignments(doc, { fetchImpl, signal: controller.signal }), /cancelled/);
  const next = new AbortController(); await assert.rejects(loadCanoGabaAssignments(doc, { fetchImpl: async () => { next.abort(); return new Response(new Uint8Array(compressed)); }, signal: next.signal }), /cancelled/);
});
test("HTTP-decoded gzip keeps the compressed receipt scope explicit", async () => {
  const roster = await loadCanoGabaAssignments(doc, { fetchImpl: async () => new Response(plain, { headers: { "content-encoding": "gzip" } }) });
  assert.equal(roster.verification.transport, "http-decoded-gzip"); assert.equal(roster.verification.compressedVerification, "canonical_build_receipt_only_not_visible_to_fetch"); assert.equal(roster.rows.length, 73364);
});
