import source from "../data/svara-synaptic-contacts-0.1.json" with { type: "json" };

const freeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
export const SVARA_CONTACTS = freeze(source);
export const SVARA_CONTACT_DEFAULT = freeze({ group: "CiD", pre: "CiD 001", post: "Motoneuron 016" });
const owners = new WeakMap();
const check = (ok, message) => { if (!ok) throw new Error(`Svara contacts: ${message}`); };
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;
const same = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const column = index => { let result = ""; for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result; return result; };

export function svaraContactGroup(id) {
  const row = SVARA_CONTACTS.groups.find(x => x.id === id);
  check(row, "unavailable group"); return row;
}
export function inspectSvaraContactSelection(selection) {
  check(selection && same(Object.keys(selection).sort(), ["group", "post", "pre"]), "invalid pair selection");
  const group = svaraContactGroup(selection.group);
  check(group.pre.includes(selection.pre) && group.post.includes(selection.post), "unavailable native pair");
  return { group: selection.group, pre: selection.pre, post: selection.post };
}
export async function verifySvaraContacts(bytes, groupId, { signal } = {}) {
  signal?.throwIfAborted();
  const group = svaraContactGroup(groupId);
  check(bytes instanceof Uint8Array && bytes.byteLength === group.asset.bytes, "byte length mismatch");
  const privateBytes = new Uint8Array(bytes);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", privateBytes));
  signal?.throwIfAborted();
  check(Array.from(digest, b => b.toString(16).padStart(2, "0")).join("") === group.asset.sha256, "checksum mismatch");
  const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(privateBytes));
  check(data.sourceId === source.sourceId && data.releaseId === source.releaseId && data.group === groupId, "source version mismatch");
  check(same(data.matrix.pre, group.pre) && same(data.matrix.post, group.post) && same(data.summary, group.summary), "axes or summary changed");
  const proof = freeze({ group: groupId });
  owners.set(proof, { data: freeze(data), bytes: privateBytes }); return proof;
}
export async function loadSvaraContacts(groupId, { signal, fetchImpl = fetch } = {}) {
  signal?.throwIfAborted();
  const group = svaraContactGroup(groupId);
  const response = await fetchImpl(group.asset.url, { cache: "no-store", signal });
  check(response.ok, `HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  signal?.throwIfAborted(); return verifySvaraContacts(bytes, groupId, { signal });
}
export function svaraVerifiedContactData(proof, groupId) {
  const owner = owners.get(proof);
  check(owner && proof.group === groupId, "current private byte authority required");
  return owner.data;
}
export function svaraVerifiedContactBytes(proof, groupId) {
  svaraVerifiedContactData(proof, groupId); return new Uint8Array(owners.get(proof).bytes);
}
export function svaraContactPair(proof, selection) {
  inspectSvaraContactSelection(selection);
  const data = svaraVerifiedContactData(proof, selection.group);
  const i = data.matrix.pre.indexOf(selection.pre), j = data.matrix.post.indexOf(selection.post);
  const rows = data.contacts.rows.filter(row => row.pre === selection.pre && row.post === selection.post);
  const sum = rows.reduce((total, row) => total + Number(row.areaText), 0);
  return freeze({ selection: { ...selection }, matrixCell: `${column(j + 1)}${i + 2}`,
    matrixSourceText: data.matrix.values[i][j], contacts: rows, derivedContactCount: rows.length,
    derivedContactAreaSumUm2: sum, matrixSumAbsoluteDifference: Math.abs(Number(data.matrix.values[i][j]) - sum) });
}
export function buildSvaraContactReceipt(proof, selection, generatedAt = new Date().toISOString()) {
  const group = svaraContactGroup(selection.group);
  const pair = svaraContactPair(proof, selection);
  check(typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt)), "invalid date");
  return freeze({ receiptVersion: "0.1.0", contractId: source.contractId, generatedAt,
    sourceId: source.sourceId, releaseId: source.releaseId, selection: { ...selection },
    representation: source.representation, biologicalContext: source.biologicalContext,
    sourceWorkbooks: { matrix: group.matrixSource, contacts: group.contactsSource },
    currentLoaderReceipt: { ...group.asset, bytesVerified: true, originalXlsxFetchedByBrowser: false,
      derivativeVerifiedAtRuntime: true, sourceXlsxVerifiedAtExtraction: true },
    pair, interpretation: source.interpretation, rights: source.rights,
    restorationScope: "Exact source-local numeric pair and its listed rows; no geometry, camera, raw endpoints, physical parent mapping or Koh annotation version." });
}
export function inspectSvaraContactReceipt(receipt) {
  check(receipt && typeof receipt === "object" && receipt.receiptVersion === "0.1.0" && receipt.contractId === source.contractId, "invalid receipt contract");
  check(receipt.sourceId === source.sourceId && receipt.releaseId === source.releaseId, "source or release changed");
  check(typeof receipt.generatedAt === "string" && Number.isFinite(Date.parse(receipt.generatedAt)), "invalid date");
  return inspectSvaraContactSelection(receipt.selection);
}
export function restoreSvaraContactReceipt(receipt, proof) {
  const selection = inspectSvaraContactReceipt(receipt);
  check(same(receipt, buildSvaraContactReceipt(proof, selection, receipt.generatedAt)), "receipt values or source claims changed");
  return selection;
}
export function svaraContactCsv(proof, selection) {
  const data = svaraVerifiedContactData(proof, selection.group), pair = svaraContactPair(proof, selection);
  const quote = x => `"${String(x).replaceAll('"', '""')}"`;
  const header = ["record_kind", "source_id", "release_id", "group", "pre_native_label", "post_native_label", "component_id", "sheet", "source_locator", "source_number_text", "explicit_contact_area_unit", "derived_contact_count", "component_sha256", "current_json_sha256"];
  const group = svaraContactGroup(selection.group);
  const base = [source.sourceId, source.releaseId, selection.group, selection.pre, selection.post];
  const rows = [["matrix", ...base, data.matrix.componentId, data.matrix.sheet, pair.matrixCell, pair.matrixSourceText, "", pair.derivedContactCount, data.matrix.sha256, group.asset.sha256],
    ...pair.contacts.map(row => ["contact", ...base, data.contacts.componentId, data.contacts.sheet, `A${row.sourceRow}:C${row.sourceRow}`, row.areaText, "µm²", "", data.contacts.sha256, group.asset.sha256])];
  return [header, ...rows].map(row => row.map(quote).join(",")).join("\r\n") + "\r\n";
}
const LOCATION_FIELDS = ["contactSource", "contactRelease", "contactGroup", "contactPre", "contactPost"];
function contactLocation(href) {
  const url = new URL(href, "http://svara.invalid");
  check(url.pathname === "/connectivity/svara", "URL belongs to another workspace"); return url;
}
export function readSvaraContactLocation(href) {
  try {
    const url = contactLocation(href);
    if (LOCATION_FIELDS.every(name => !url.searchParams.has(name))) return { selection: { ...SVARA_CONTACT_DEFAULT }, refusal: null };
    check(LOCATION_FIELDS.every(name => url.searchParams.getAll(name).length === 1 && url.searchParams.get(name) !== ""), "incomplete or duplicate pair URL");
    check(url.searchParams.get("contactSource") === source.sourceId && url.searchParams.get("contactRelease") === source.releaseId, "source or release changed in URL");
    return { selection: inspectSvaraContactSelection({ group: url.searchParams.get("contactGroup"), pre: url.searchParams.get("contactPre"), post: url.searchParams.get("contactPost") }), refusal: null };
  } catch (error) { return { selection: null, refusal: error.message }; }
}
export function writeSvaraContactLocation(href, selection) {
  inspectSvaraContactSelection(selection); const url = contactLocation(href);
  LOCATION_FIELDS.forEach(name => url.searchParams.delete(name));
  [source.sourceId, source.releaseId, selection.group, selection.pre, selection.post].forEach((value, i) => url.searchParams.set(LOCATION_FIELDS[i], value));
  return url.pathname + url.search + url.hash;
}
export function svaraContactLink(selection) { return writeSvaraContactLocation("/connectivity/svara", selection); }
