import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { CANO_CHOL_IN_ROSTER_TRANSPORT_URL, CANO_CHOL_IN_ROSTER_URL, canoCholInNucleusCsv, canoCholInNucleusReceipt, findCanoCholInProfile, listCanoCholInNuclei, loadCanoCholInRoster, parseCanoCholInRosterCsv, selectedCanoCholInNucleus } from "../app/cano-chol-in-nucleus-roster.js";

const registry = JSON.parse(await readFile(new URL("../data/cano-gomez-p56-multiome-interneuron-registry-0.1.json", import.meta.url), "utf8"));
const compressed = await readFile(new URL("../public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz", import.meta.url));
const text = gunzipSync(compressed).toString("utf8");
const fetchReal = async () => new Response(new Uint8Array(compressed));
const roster = await loadCanoCholInRoster(registry, { fetchImpl: fetchReal });
const profile = registry.profiles[0];

test("real 16,348-byte roster verifies both hashes and all eleven profile identity chains", async () => {
  assert.equal(roster.rows.length, 923);
  assert.equal(roster.verification.compressedBytes, 16348);
  assert.equal(roster.verification.uncompressedBytes, 428897);
  assert.equal(new Set(roster.rows.map((row) => row.key)).size, 923);
  assert.equal(new Set(roster.rows.map((row) => row.profileId)).size, 11);
  for (const current of registry.profiles) assert.equal(listCanoCholInNuclei(roster, current.profileId).profileCount, current.nucleusCount);
  assert.ok(roster.rows.every((row) => row.raw.groups === "CHOL_IN" && row.raw.source_object_id === "cholinergic" && row.claims.sameCellJoins === 0 && row.claims.geometryObjects === 0));
  let requestedUrl;
  const delivered = await loadCanoCholInRoster(registry, { fetchImpl: async (url) => { requestedUrl = url; return new Response(new Uint8Array(compressed), { headers: { "Content-Type": "application/gzip" } }); } });
  assert.equal(requestedUrl, "/api/source-rosters/cano-chol-in");
  assert.equal(requestedUrl, CANO_CHOL_IN_ROSTER_TRANSPORT_URL);
  assert.equal(delivered.verification.url, CANO_CHOL_IN_ROSTER_URL);
  assert.equal(delivered.verification.canonicalSourceFileUrl, CANO_CHOL_IN_ROSTER_URL);
  assert.equal(delivered.verification.requestedTransportUrl, CANO_CHOL_IN_ROSTER_TRANSPORT_URL);
  assert.equal(delivered.verification.responseTransportUrl, null);
  assert.equal(delivered.verification.transport, "raw-gzip");
  assert.ok(delivered.rows.every((row) => row.sourceLocator.startsWith(CANO_CHOL_IN_ROSTER_URL + "#")));
});

test("corrupt, truncated or falsely decompressed files cannot return source rows", async () => {
  const corrupt = new Uint8Array(compressed); corrupt[100] ^= 1;
  await assert.rejects(loadCanoCholInRoster(registry, { fetchImpl: async () => new Response(corrupt) }), /compressed roster/);
  await assert.rejects(loadCanoCholInRoster(registry, { fetchImpl: async () => new Response(new Uint8Array(compressed.subarray(1))) }), /compressed roster/);
  const corruptedDecoded = new Uint8Array(gunzipSync(compressed)); corruptedDecoded[100] ^= 1;
  await assert.rejects(loadCanoCholInRoster(registry, { fetchImpl: fetchReal, decompressImpl: async () => corruptedDecoded }), /uncompressed roster/);
});

test("HTTP gzip decoding verifies exact decoded content without claiming runtime access to compressed bytes", async () => {
  const decoded = new Uint8Array(gunzipSync(compressed));
  const result = await loadCanoCholInRoster(registry, { fetchImpl: async () => new Response(decoded, { headers: { "Content-Encoding": "gzip" } }), decompressImpl: async () => { throw new Error("Must not decode HTTP-decoded bytes twice"); } });
  assert.equal(result.rows.length, 923);
  assert.equal(result.verification.transport, "http-decoded-gzip");
  assert.equal(result.verification.receivedBytes, 428897);
  assert.equal(result.verification.compressedVerification, "canonical_build_receipt_only_not_visible_to_fetch");
  assert.equal(result.verification.uncompressedVerification, "runtime_sha256_verified");
  assert.equal(roster.verification.transport, "raw-gzip");
  assert.equal(roster.verification.compressedVerification, "runtime_sha256_verified");
  await assert.rejects(loadCanoCholInRoster(registry, { fetchImpl: async () => new Response(decoded) }), /compressed roster/);
  const corrupt = new Uint8Array(decoded); corrupt[100] ^= 1;
  await assert.rejects(loadCanoCholInRoster(registry, { fetchImpl: async () => new Response(corrupt, { headers: { "Content-Encoding": "gzip" } }) }), /uncompressed roster/);
});

test("wrong registry scope, profile mapping or ordered identities fail closed", async () => {
  const altered = (action) => { const clone = structuredClone(registry); action(clone); return clone; };
  assert.throws(() => findCanoCholInProfile(altered((copy) => { copy.identityAuthority.sameCellAssertionAdmitted = true; }), profile.profileId), /same-cell identity/);
  await assert.rejects(loadCanoCholInRoster(altered((copy) => { copy.profiles[0].orderedCompoundNucleusKeysSha256 = "0".repeat(64); }), { fetchImpl: fetchReal }), /ordered profile identity/);
  assert.throws(() => parseCanoCholInRosterCsv(text.replace('"CHOL_IN"', '"MOTOR"'), registry), /assignment or parent profile/);
  assert.throws(() => parseCanoCholInRosterCsv(text.replace('"false"', '"true"'), registry), /scientific boundary/);
  assert.equal(findCanoCholInProfile(registry, "hayashi-unknown-profile"), null);
  assert.equal(findCanoCholInProfile(registry, null), null);
});

test("native IDs and source NA are preserved; quoted NA does not become missing", () => {
  const row = roster.rows[0];
  assert.equal(row.raw.source_nucleus_id, "GATCGAGCAAACCCTA-1_1");
  assert.equal(row.raw.source_active_assay, null);
  assert.equal(row.raw.source_active_ident, null);
  const literal = parseCanoCholInRosterCsv(text.replace(",NA,NA,", ',"NA",NA,'), registry);
  assert.equal(literal[0].raw.source_active_assay, "NA");
  assert.equal(literal[0].raw.source_active_ident, null);
  assert.equal(row.ageContext.value, "P56");
  assert.equal(row.ageContext.scope, "source_dataset_context_not_per_nucleus_measurement");
  assert.equal(row.raw.anatomy, "Cervical");
  assert.ok(row.sourceLocator.includes("#data-row=1&compound_nucleus_key="));
  assert.ok(row.originalMetadataLocator.includes("meta.data[row.name="));
});

test("profile, source anatomy, raw Sex and query filters retain exact denominators and clamp pages", () => {
  const page = listCanoCholInNuclei(roster, profile.profileId, { anatomy: "Cervical", page: 100 });
  assert.equal(page.profileCount, 146);
  assert.equal(page.matchedCount, 37);
  assert.equal(page.currentPage, 1);
  assert.ok(page.rows.every((row) => row.raw.anatomy === "Cervical" && row.profileId === profile.profileId));
  const unassigned = listCanoCholInNuclei(roster, profile.profileId, { sex: "Unassigned" });
  assert.equal(unassigned.matchedCount, 3);
  const first = listCanoCholInNuclei(roster, profile.profileId).rows[0];
  assert.equal(listCanoCholInNuclei(roster, profile.profileId, { query: first.raw.source_nucleus_id }).matchedCount, 1);
  assert.equal(listCanoCholInNuclei(roster, profile.profileId, { query: "missing-nucleus-id" }).matchedCount, 0);
});

test("profile/page/filter changes cannot retain hidden active nucleus detail or cross-profile exports", () => {
  const firstPage = listCanoCholInNuclei(roster, profile.profileId);
  const first = firstPage.rows[0];
  assert.equal(selectedCanoCholInNucleus(firstPage, first.key), first);
  assert.equal(selectedCanoCholInNucleus(listCanoCholInNuclei(roster, profile.profileId, { page: 1 }), first.key), null);
  assert.equal(selectedCanoCholInNucleus(listCanoCholInNuclei(roster, profile.profileId, { query: "no-match" }), first.key), null);
  const other = listCanoCholInNuclei(roster, registry.profiles[1].profileId);
  assert.equal(selectedCanoCholInNucleus(other, first.key), null);
  assert.throws(() => canoCholInNucleusReceipt(registry, roster, registry.profiles[1].profileId, [first]), /exact verified rows/);
});

test("JSON and CSV export exact current matched rows, locators, unknowns and zero scientific additions", () => {
  const selected = listCanoCholInNuclei(roster, profile.profileId, { anatomy: "Cervical" });
  const receipt = canoCholInNucleusReceipt(registry, roster, profile.profileId, selected.filteredRows);
  assert.equal(receipt.rowCount, 37);
  assert.equal(receipt.profile.nucleusCount, 146);
  assert.equal(receipt.unit, "source_local_nucleus_assignment");
  assert.equal(receipt.rows[0].ageContext.value, "P56");
  assert.equal(receipt.claims.crossAssayCellJoins, 0);
  assert.equal(receipt.sourceObject.sourceRdsBytes, 127862795);
  assert.equal(receipt.originalSourceReceiptVerification, "existing_registry_receipt_not_reacquired_by_roster_browser");
  const csv = canoCholInNucleusCsv(registry, roster, profile.profileId, selected.filteredRows);
  assert.equal(csv.trimEnd().split("\n").length, 38);
  assert.match(csv, /,NA,NA,"CHOL_IN"/);
  assert.ok(csv.includes(selected.filteredRows[0].key));
  const one = canoCholInNucleusReceipt(registry, roster, profile.profileId, [selected.filteredRows[0]], "selected_nucleus_row");
  assert.equal(one.rowCount, 1);
});

test("cancelled old roster requests cannot complete even when an underlying response ignores abort", async () => {
  const controller = new AbortController();
  let resolveResponse;
  const pending = loadCanoCholInRoster(registry, { signal: controller.signal, fetchImpl: () => new Promise((resolve) => { resolveResponse = resolve; }) });
  controller.abort();
  resolveResponse(new Response(new Uint8Array(compressed)));
  await assert.rejects(pending, /cancelled/);
});
