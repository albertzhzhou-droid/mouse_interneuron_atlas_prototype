const FILE = "GSE318731_P56_gabaergic_multiome.rds";
const SOURCE_SHA = "700361c804806b521bb01aa58c263cd01b189fe03d3299aeef5806839a4f5f31";
const FIELDS = ["nucleus_id", "transmitter_class", "group", "neuron_type", "source", "anatomy", "sex"];
const HOLDERS = new WeakMap();
const CLAIMS = Object.freeze({ confirmedInterneuronProfilesAdded: 0, donorIdentities: 0, sectionIdentities: 0, geometryObjects: 0, internalStructures: 0, markerAssertions: 0, crossAssayCellJoins: 0, crossSourceIdentities: 0, atlasRegistrations: 0 });
function check(value, message) { if (!value) throw new Error(`Cano GABA source assignments: ${message}`); }
function counts(values) {
  const map = new Map(); for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map].sort(([a], [b]) => a === b ? 0 : a === null ? -1 : b === null ? 1 : a < b ? -1 : 1).map(([value, count]) => ({ value, count }));
}
function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
async function digest(bytes) {
  const owned = new Uint8Array(bytes);
  check(globalThis.crypto?.subtle, "SHA-256 verification unavailable");
  return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", owned.buffer)), b => b.toString(16).padStart(2, "0")).join("");
}
const orderedDigest = values => digest(new TextEncoder().encode(values.join("\n") + "\n"));

export function validateCanoGabaLabels(document) {
  check(document?.schemaVersion === "0.1.0" && document.adapterId === "cano-gomez-p56-gaba-metadata-labels-0.1.0", "wrong source adapter");
  check(document.source.fileName === FILE && document.source.sha256 === SOURCE_SHA && document.source.bytes === 1646402816 && document.source.accession === "GSE318731" && document.source.slot === "meta.data" && document.source.labelColumn === "neuron_types" && document.source.authorityMode === "BASE_R_STREAM_META_DATA_ROW_ONLY" && document.source.lifeStage === "P56" && document.source.lifeStageScope === "source_dataset_context_not_per_nucleus_measurement" && document.source.originalRdsReacquiredThisIteration === false, "original source scope mismatch");
  check(equal(document.denominators, { nucleusCount: 73364, sourceLabelCount: 204, sourceGroupCount: 24, confirmedInterneuronProfilesAdded: 0 }), "source denominators changed");
  check(document.identity.crossAssayCellIdentityVerified === false && document.identity.uniqueNonemptyNameCount === 73364 && document.identity.stableKeyExpression === "GSE318731|exact source filename|meta.data row.name", "source-row authority changed");
  for (const key of ["confirmedInterneuronAdmission", "markerInferenceFromLabelTokens", "crossAssayCellIdentity", "crossSourceIdentity", "geometry", "internalStructures", "atlasRegistration", "donorIdentity", "sectionIdentity"]) check(document.boundaries[key] === false, `unestablished ${key} claim`);
  for (const key of ["source", "sex"]) check(document.sourceFields[key].sourceColumnPresent === false && document.sourceFields[key].missingCount === 73364 && document.sourceFields[key].reason === "source_meta_data_column_absent", "absent source field substituted");
  check(document.labels.length === 204 && new Set(document.labels.map(r => r.id)).size === 204 && new Set(document.labels.map(r => r.rawLabel)).size === 204 && document.labels.reduce((n, r) => n + r.nucleusCount, 0) === 73364, "invalid label roster");
  check(document.groupCounts.length === 24 && document.groupCounts.reduce((n, r) => n + r.count, 0) === 73364, "source group counts changed");
  for (const label of document.labels) {
    check(typeof label.rawLabel === "string" && label.rawLabel.length > 0 && /^cano\.gaba\.metadata-label\.sha256\.[a-f0-9]{24}$/.test(label.id) && Number.isSafeInteger(label.nucleusCount) && label.nucleusCount > 0, "invalid raw label identity");
    check(label.groupCounts.reduce((n, r) => n + r.count, 0) === label.nucleusCount && /^[a-f0-9]{64}$/.test(label.orderedCompoundNucleusKeysSha256), "invalid label source membership");
  }
  const a = document.artifact;
  check(a.publicUrl === "/data/cano_gomez_gaba_source_labels_v1/GSE318731_P56_gabaergic_metadata_assignments.jsonl.gzip" && a.path === `public${a.publicUrl}` && a.rowCount === 73364 && Number.isSafeInteger(a.compressedBytes) && a.compressedBytes > 0 && a.compressedBytes < 3000000 && Number.isSafeInteger(a.uncompressedBytes) && a.uncompressedBytes > a.compressedBytes && a.uncompressedBytes < 40000000 && [a.compressedSha256, a.uncompressedSha256].every(v => /^[a-f0-9]{64}$/.test(v)), "invalid bundled artifact receipt");
  return document;
}

/** Pure source parsing remains separate from private runtime byte verification. */
export function parseCanoGabaAssignmentText(text, document) {
  validateCanoGabaLabels(document);
  check(typeof text === "string" && text.endsWith("\n"), "incomplete source transport");
  const lines = text.slice(0, -1).split("\n"); check(lines.length === 73364, "source row count changed");
  const labels = new Map(document.labels.map(label => [label.id, label])); const seen = new Set(); const grouped = new Map(document.labels.map(label => [label.id, []]));
  const rows = lines.map((line, index) => {
    const row = JSON.parse(line), label = labels.get(row.labelId), raw = row.raw;
    check(equal(Object.keys(row), ["sourceRow", "key", "labelId", "raw"]) && row.sourceRow === index + 1 && raw && equal(Object.keys(raw), FIELDS), "source row shape/order mismatch");
    check(FIELDS.every(field => raw[field] === null || typeof raw[field] === "string") && raw.transmitter_class === "GABA" && raw.neuron_type === label?.rawLabel && label?.groupCounts.some(group => group.value === raw.group), "wrong label/group assignment");
    check(typeof raw.nucleus_id === "string" && raw.nucleus_id.length > 0 && !/[|\n]/.test(raw.nucleus_id) && row.key === `GSE318731|${FILE}|${raw.nucleus_id}` && !seen.has(row.key), "wrong or duplicated source-scoped nucleus key");
    check(raw.source === null && raw.sex === null, "absent source field filled");
    seen.add(row.key); grouped.get(row.labelId).push(row);
    return Object.freeze({ ...row, raw: Object.freeze({ ...raw }) });
  });
  for (const label of document.labels) {
    const members = grouped.get(label.id);
    check(members.length === label.nucleusCount && equal(counts(members.map(row => row.raw.group)), label.groupCounts), "per-label source denominator mismatch");
    for (const field of ["anatomy", "source", "sex"]) check(equal(counts(members.map(row => row.raw[field])), label.contextCounts[field]), `per-label ${field} summary mismatch`);
  }
  for (const field of ["anatomy", "source", "sex"]) check(equal(counts(rows.map(row => row.raw[field])), document.contextCounts[field]), `source ${field} counts changed`);
  check(equal(counts(rows.map(row => row.raw.group)), document.groupCounts), "source group summary mismatch");
  return Object.freeze(rows);
}

async function inflate(bytes) {
  check(typeof DecompressionStream === "function", "gzip decoding unavailable");
  const owned = new Uint8Array(bytes);
  return new Uint8Array(await new Response(new Blob([owned.buffer]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}
/** Checks current transport, full source membership, order, and all label counts. */
export async function loadCanoGabaAssignments(document, { fetchImpl = globalThis.fetch, signal, decompressImpl = inflate } = {}) {
  validateCanoGabaLabels(document); const a = document.artifact;
  const active = () => check(!signal?.aborted, "request cancelled"); active();
  const response = await fetchImpl(a.publicUrl, { signal, cache: "no-store" }); active(); check(response.ok, `source unavailable (${response.status})`);
  const received = new Uint8Array(await response.arrayBuffer()); active();
  const decoded = received.length === a.uncompressedBytes && /(?:^|,)\s*gzip\s*(?:,|$)/i.test(response.headers?.get("content-encoding") ?? "");
  if (!decoded) check(received.length === a.compressedBytes && await digest(received) === a.compressedSha256, "compressed source bytes/checksum changed"); active();
  const plain = decoded ? received : await decompressImpl(received); active();
  check(plain instanceof Uint8Array && plain.length === a.uncompressedBytes && await digest(plain) === a.uncompressedSha256, "decoded source bytes/checksum changed"); active();
  const rows = parseCanoGabaAssignmentText(new TextDecoder("utf-8", { fatal: true }).decode(plain), document);
  check(await orderedDigest(rows.map(row => row.raw.nucleus_id)) === document.identity.orderedSourceNucleusNamesSha256, "source nucleus order changed"); active();
  const groups = new Map(document.labels.map(label => [label.id, []])); for (const row of rows) groups.get(row.labelId).push(row.key);
  for (const label of document.labels) {
    check(label.id === `cano.gaba.metadata-label.sha256.${(await digest(new TextEncoder().encode(label.rawLabel))).slice(0, 24)}`, "label identity checksum changed");
    check(await orderedDigest(groups.get(label.id)) === label.orderedCompoundNucleusKeysSha256, "ordered label membership changed"); active();
  }
  const roster = Object.freeze({ rows, verification: Object.freeze({ status: "verified", url: a.publicUrl, receivedBytes: received.length, compressedSha256: a.compressedSha256, uncompressedSha256: a.uncompressedSha256, transport: decoded ? "http-decoded-gzip" : "raw-gzip", compressedVerification: decoded ? "canonical_build_receipt_only_not_visible_to_fetch" : "runtime_sha256_verified", uncompressedVerification: "runtime_sha256_verified" }), claims: CLAIMS });
  HOLDERS.set(roster, { document, members: new Set(rows) }); return roster;
}

export function listCanoGabaNuclei(roster, labelId, { query = "", page = 0, pageSize = 20 } = {}) {
  check(HOLDERS.has(roster), "current private verified roster required");
  check(Number.isSafeInteger(page) && page >= 0 && Number.isSafeInteger(pageSize) && pageSize >= 1 && pageSize <= 100, "invalid page index/size");
  check(HOLDERS.get(roster).document.labels.some(label => label.id === labelId), "unknown source label");
  const terms = query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
  const sourceRows = roster.rows.filter(row => row.labelId === labelId);
  const filtered = sourceRows.filter(row => terms.every(term => [row.raw.nucleus_id, row.raw.anatomy, row.raw.group].join(" ").toLocaleLowerCase("en").includes(term)));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, pageCount - 1);
  return { rows: filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize), currentPage, pageCount, matchedCount: filtered.length, sourceCount: sourceRows.length };
}

export function canoGabaNucleusReceipt(document, roster, labelId, row) {
  const holder = HOLDERS.get(roster), label = document.labels.find(item => item.id === labelId);
  check(holder?.document === document && holder.members.has(row) && row.labelId === labelId && label, "export requires an exact owned row of the current source label");
  return { documentType: "cano_gaba_source_nucleus_assignment", schemaVersion: "0.1.0", source: document.source, label, row, identityAuthority: document.identity, sourceFields: document.sourceFields, verification: roster.verification, claims: CLAIMS, sourceLocator: `${FILE}#meta.data[row.name=${encodeURIComponent(row.raw.nucleus_id)}]`, boundaries: document.boundaries };
}
