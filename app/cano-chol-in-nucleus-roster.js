export const CANO_CHOL_IN_ROSTER_URL = "/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz";
export const CANO_CHOL_IN_ROSTER_TRANSPORT_URL = "/api/source-rosters/cano-chol-in";
const COMPRESSED_SHA = "1db93e5f6e52ead4f869553cf3634a82237fc3817aadb4c8187a75b81323db9a";
const UNCOMPRESSED_SHA = "2ec453defffb0a1a8ac7de27b3189d56059571166dd984f73356b5cdf0eaccb7";
const SOURCE_FILE = "GSE318731_P56_cholinergic_multiome.rds";
const CLAIMS = Object.freeze({ geometryObjects: 0, internalStructures: 0, sameCellJoins: 0, crossAssayCellJoins: 0, atlasRegistrations: 0 });
function check(condition, message) { if (!condition) throw new Error(`Cano CHOL_IN roster: ${message}`); }

function validateRegistry(registry) {
  check(registry?.datasetId === "GSE318731" && registry.releaseId === "ohri-cano-gomez-p56-multiome-interneuron-registry-0.1.0" && registry.lifeStage === "P56", "source release or age context mismatch");
  check(registry.identityAuthority.mode === "BASE_R_STREAM_META_DATA_ROW_ONLY" && registry.identityAuthority.crossAssayCellIdentityVerified === false && registry.identityAuthority.sameCellAssertionAdmitted === false, "source-row authority cannot establish same-cell identity");
  check(registry.profiles.length === 11 && new Set(registry.profiles.map((profile) => profile.profileId)).size === 11 && registry.denominatorReconciliation.confirmedInterneuronNucleusCount === 923, "confirmed source denominator changed");
  for (const profile of registry.profiles) {
    check(profile.sourceGroup === "CHOL_IN" && profile.sourceObjectId === "cholinergic" && profile.sourceFileName === SOURCE_FILE && profile.unitOfObservation === "nucleus" && profile.assignmentAuthority === "source_explicit_groups_equals_CHOL_IN", "unadmitted profile source assignment");
    check(profile.rosterLink.idField === "compound_nucleus_key" && profile.rosterLink.filterField === "confirmed_interneuron_profile_id" && profile.rosterLink.filterEquals === profile.profileId, "profile roster locator mismatch");
    check(Object.values(profile.geometryAuthority).every((value) => value === 0), "source rows cannot admit geometry or identity joins");
  }
  const artifact = registry.artifacts.find((item) => item.artifactKind === "confirmed_interneuron_nucleus_roster");
  check(artifact?.fileName === "GSE318731_confirmed_interneuron_nucleus_roster.csv.gz" && artifact.rowCount === 923 && artifact.columnCount === 22 && artifact.compressedBytes === 16348 && artifact.compressedSha256 === COMPRESSED_SHA && artifact.uncompressedBytes === 428897 && artifact.uncompressedSha256 === UNCOMPRESSED_SHA, "exact bundled roster receipt mismatch");
  return artifact;
}

export function findCanoCholInProfile(registry, profileId) {
  validateRegistry(registry);
  return typeof profileId === "string" ? registry.profiles.find((profile) => profile.profileId === profileId) ?? null : null;
}

async function sha256(bytes) {
  check(globalThis.crypto?.subtle, "SHA-256 verification unavailable");
  const owned = new Uint8Array(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", owned.buffer);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

/** Retains source NA separately from a quoted literal "NA", empty and Unassigned. */
function csvRecords(text) {
  const records = []; let row = []; let field = ""; let quoted = false; let inQuote = false; let closed = false;
  const finishField = () => { row.push(!quoted && field === "NA" ? null : field); field = ""; quoted = false; closed = false; };
  const finishRow = () => { finishField(); records.push(row); row = []; };
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuote) {
      if (character !== '"') field += character;
      else if (text[index + 1] === '"') { field += '"'; index += 1; }
      else { inQuote = false; closed = true; }
    } else if (character === ",") finishField();
    else if (character === "\n") finishRow();
    else if (character === '"' && field === "" && !closed) { quoted = true; inQuote = true; }
    else { check(!closed && character !== '"' && character !== "\r", "malformed source CSV"); field += character; }
  }
  check(!inQuote, "unterminated source CSV field");
  if (row.length || field || closed) finishRow();
  return records;
}

/** Pure source-row parsing; runtime display also requires both byte receipts below. */
export function parseCanoCholInRosterCsv(text, registry) {
  const artifact = validateRegistry(registry);
  const [columns, ...records] = csvRecords(text);
  check(JSON.stringify(columns) === JSON.stringify(artifact.orderedColumnNames) && records.length === 923, "source header or row denominator mismatch");
  const profiles = new Map(registry.profiles.map((profile) => [profile.profileId, profile]));
  const seen = new Set();
  const rows = records.map((values, index) => {
    check(values.length === columns.length, "source row width mismatch");
    const raw = Object.freeze(Object.fromEntries(columns.map((column, columnIndex) => [column, values[columnIndex]])));
    const profile = profiles.get(raw.confirmed_interneuron_profile_id);
    check(profile && raw.source_accession === "GSE318731" && raw.source_file_name === SOURCE_FILE && raw.source_object_id === "cholinergic" && raw.groups === "CHOL_IN" && raw.neuron_types === profile.sourceLocalLabel && raw.transmitter_class === "CHOL", "source row assignment or parent profile mismatch");
    check(typeof raw.source_nucleus_id === "string" && raw.source_nucleus_id.length > 0 && raw.compound_nucleus_key === `GSE318731|${SOURCE_FILE}|${raw.source_nucleus_id}` && !seen.has(raw.compound_nucleus_key), "duplicate or unestablished compound nucleus identity");
    check(raw.identity_authority_mode === "BASE_R_STREAM_META_DATA_ROW_ONLY" && raw.cross_assay_cell_identity_verified === "false" && raw.scope_decision === "CONFIRMED_INTERNEURON" && raw.scope_decision_reason === "source_explicit_groups_equals_CHOL_IN" && [raw.geometry_object_count, raw.internal_structure_object_count, raw.same_cell_link_count].every((value) => value === "0"), "source row scientific boundary changed");
    seen.add(raw.compound_nucleus_key);
    return Object.freeze({ key: raw.compound_nucleus_key, profileId: profile.profileId, sourceRow: index + 1, raw,
      unit: "source_local_nucleus_assignment", sourceLocator: `${CANO_CHOL_IN_ROSTER_URL}#data-row=${index + 1}&compound_nucleus_key=${encodeURIComponent(raw.compound_nucleus_key)}`,
      originalMetadataLocator: `${SOURCE_FILE}#meta.data[row.name=${encodeURIComponent(raw.source_nucleus_id)}]`,
      ageContext: Object.freeze({ value: registry.lifeStage, scope: "source_dataset_context_not_per_nucleus_measurement", locator: "data/cano-gomez-p56-multiome-interneuron-registry-0.1.json#lifeStage" }), claims: CLAIMS });
  });
  for (const profile of registry.profiles) check(rows.filter((row) => row.profileId === profile.profileId).length === profile.nucleusCount, "per-profile source denominator mismatch");
  return Object.freeze(rows);
}

async function decompressGzip(bytes) {
  check(typeof DecompressionStream === "function", "gzip decoding unavailable");
  const owned = new Uint8Array(bytes);
  const decoded = new Blob([owned.buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(decoded).arrayBuffer());
}

/** Fetch only the already bundled small roster; retain original source-row order. */
export async function loadCanoCholInRoster(registry, { fetchImpl = globalThis.fetch, signal, decompressImpl = decompressGzip } = {}) {
  const artifact = validateRegistry(registry);
  const active = () => check(!signal?.aborted, "request cancelled");
  active();
  const response = await fetchImpl(CANO_CHOL_IN_ROSTER_TRANSPORT_URL, { signal });
  check(response.ok, `source roster unavailable (${response.status})`);
  const received = new Uint8Array(await response.arrayBuffer()); active();
  const decodedByHttp = received.length === artifact.uncompressedBytes && /(?:^|,)\s*gzip\s*(?:,|$)/i.test(response.headers?.get("content-encoding") ?? "");
  if (!decodedByHttp) check(received.length === artifact.compressedBytes && await sha256(received) === artifact.compressedSha256, "compressed roster bytes or SHA-256 mismatch"); active();
  const uncompressed = decodedByHttp ? received : await decompressImpl(received); active();
  check(uncompressed instanceof Uint8Array && uncompressed.length === artifact.uncompressedBytes && await sha256(uncompressed) === artifact.uncompressedSha256, "uncompressed roster bytes or SHA-256 mismatch"); active();
  const rows = parseCanoCholInRosterCsv(new TextDecoder("utf-8", { fatal: true }).decode(uncompressed), registry);
  for (const profile of registry.profiles) {
    const selected = rows.filter((row) => row.profileId === profile.profileId);
    check(await sha256(new TextEncoder().encode(selected.map((row) => row.key).join("\n") + "\n")) === profile.orderedCompoundNucleusKeysSha256, "ordered profile identity checksum mismatch");
  }
  active();
  return Object.freeze({ documentType: "verified_cano_chol_in_roster", registryReleaseId: registry.releaseId, rows,
    verification: Object.freeze({ status: "verified", url: CANO_CHOL_IN_ROSTER_URL,
      canonicalSourceFileUrl: CANO_CHOL_IN_ROSTER_URL, requestedTransportUrl: CANO_CHOL_IN_ROSTER_TRANSPORT_URL,
      responseTransportUrl: response.url || null,
      transport: decodedByHttp ? "http-decoded-gzip" : "raw-gzip",
      receivedBytes: received.length,
      compressedBytes: artifact.compressedBytes, compressedSha256: artifact.compressedSha256,
      compressedVerification: decodedByHttp ? "canonical_build_receipt_only_not_visible_to_fetch" : "runtime_sha256_verified",
      uncompressedBytes: uncompressed.length, uncompressedSha256: artifact.uncompressedSha256,
      uncompressedVerification: "runtime_sha256_verified" }), claims: CLAIMS });
}

export function listCanoCholInNuclei(roster, profileId, { query = "", anatomy, sex, page = 0, pageSize = 20 } = {}) {
  check(roster?.verification.status === "verified" && typeof profileId === "string", "current verified profile required");
  check(Number.isSafeInteger(page) && page >= 0 && Number.isSafeInteger(pageSize) && pageSize >= 1 && pageSize <= 100, "invalid page size or index");
  const sourceRows = roster.rows.filter((row) => row.profileId === profileId);
  const terms = query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
  const filtered = sourceRows.filter((row) => (anatomy === undefined || row.raw.anatomy === anatomy) && (sex === undefined || row.raw.Sex === sex) && terms.every((term) => [row.key, row.raw.neuron_types, row.raw.source, row.raw.anatomy, row.raw.Sex].filter((value) => value !== null).join(" ").toLocaleLowerCase("en").includes(term)));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  return { sourceRows, filteredRows: filtered, rows: filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize), currentPage, pageCount, profileCount: sourceRows.length, matchedCount: filtered.length };
}

/** A row hidden by profile, filter or page has no active detail/export. */
export function selectedCanoCholInNucleus(page, key) { return page.rows.find((row) => row.key === key) ?? null; }

export function canoCholInNucleusReceipt(registry, roster, profileId, rows, scope = "filtered_profile_rows") {
  const profile = findCanoCholInProfile(registry, profileId);
  check(profile && roster.registryReleaseId === registry.releaseId && roster.verification.status === "verified" && rows.every((row) => row.profileId === profileId && roster.rows.includes(row)), "export requires exact verified rows of the current profile");
  const sourceObject = registry.sourceObjects.find((object) => object.objectId === profile.sourceObjectId);
  check(sourceObject?.sourceFileName === SOURCE_FILE && sourceObject.sourceRdsBytes === 127862795 && sourceObject.sourceRdsSha256 === "d4ad07a1e434f2ed4553738f3e1df1b395ce81b154f974c41f3ba6a9d674aed2", "original source receipt mismatch");
  return { documentType: "cano_chol_in_source_nucleus_rows", schemaVersion: "0.1.0", source: registry.sourceReferences, sourceObject, originalSourceReceiptVerification: "existing_registry_receipt_not_reacquired_by_roster_browser", registryReleaseId: registry.releaseId, profile,
    scope, rowCount: rows.length, unit: "source_local_nucleus_assignment", verification: roster.verification, identityAuthority: registry.identityAuthority, rows, claims: CLAIMS,
    boundary: "Exact source meta.data row assignments only. P56 is dataset context; anatomy/source/Sex are raw source fields. No biological prevalence, animal identity, coordinates, morphology, cross-assay same cell or cross-source identity is inferred." };
}

export function canoCholInNucleusCsv(registry, roster, profileId, rows) {
  canoCholInNucleusReceipt(registry, roster, profileId, rows);
  const columns = validateRegistry(registry).orderedColumnNames;
  const quote = (value) => value === null ? "NA" : `"${String(value).replaceAll('"', '""')}"`;
  return [columns.map(quote).join(","), ...rows.map((row) => columns.map((column) => quote(row.raw[column])).join(","))].join("\n") + "\n";
}
