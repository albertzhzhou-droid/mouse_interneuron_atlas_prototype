const SHA = "d4ad07a1e434f2ed4553738f3e1df1b395ce81b154f974c41f3ba6a9d674aed2";
const FILE = "GSE318731_P56_cholinergic_multiome.rds";
const OWNERS = new WeakMap();
function check(v, m) { if (!v) throw new Error(`Cano CHOL RNA counts: ${m}`); }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function freeze(v) { if (v && typeof v === "object" && !Object.isFrozen(v)) { Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
async function hash(bytes) {
  check(globalThis.crypto?.subtle, "SHA-256 unavailable");
  const b = new Uint8Array(bytes);
  return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", b.buffer)), n => n.toString(16).padStart(2, "0")).join("");
}
export function validateCanoCholRnaDocument(doc) {
  check(doc?.schemaVersion === "0.1.0" && doc.source?.sha256 === SHA && doc.source.fileName === FILE && doc.source.bytes === 127862795 && doc.source.accession === "GSE318731" && doc.source.matrixLocator === "assays$RNA@layers$counts" && doc.source.layer === "counts" && doc.source.assayClass === "Assay5" && doc.source.matrixClass === "dgCMatrix", "exact source/counts layer changed");
  const scope = doc.scope;
  check(scope?.group === "CHOL_IN" && scope.nucleusCount === 923 && scope.profileCount === 11 && scope.featureCount === 32285 && scope.excludedOtherCholNuclei === 2276 && scope.rnaCountsToMetadataNamedMappingVerified === true && [scope.rnaAtacPairingVerified, scope.samePhysicalCellAcrossSources, scope.markerOrDifferentialExpressionClaim, scope.geometryClaim].every(v => v === false), "source scope or relationship claims changed");
  const audit = doc.sourceAudit;
  check(same(audit?.dimensions, [32285, 3199]) && audit.rnaCellNamesExactlyEqualMetadataRowNamesInOrder === true && audit.all3199ColumnSumsMatchMetadataNCountRna === true && audit.all3199DetectionCountsMatchMetadataNFeatureRna === true, "source named mapping/column replay missing");
  check(doc.genes?.length === 32285 && new Set(doc.genes).size === 32285 && doc.genes.every(g => typeof g === "string" && g.length > 0), "feature names changed");
  check(doc.nuclei?.length === 923 && new Set(doc.nuclei.map(n => n.key)).size === 923 && doc.profiles?.length === 11 && new Set(doc.profiles.map(p => p.id)).size === 11, "source identities duplicated/missing");
  const profiles = new Map(doc.profiles.map(p => [p.id, p]));
  for (const [j, n] of doc.nuclei.entries()) {
    check(n.key === `GSE318731|${FILE}|${n.nativeId}` && profiles.has(n.profileId) && Number.isSafeInteger(n.metadataRow) && n.metadataRow >= 1 && n.metadataRow <= 3199 && n.countsColumn === n.metadataRow && (!j || doc.nuclei[j - 1].metadataRow < n.metadataRow) && Number.isSafeInteger(n.totalRnaCount) && n.totalRnaCount >= 0 && Number.isSafeInteger(n.detectedFeatureCount) && n.detectedFeatureCount >= 0 && n.detectedFeatureCount <= 32285, "invalid named counts column/metadata identity");
  }
  for (const p of doc.profiles) check(p.nucleusCount === doc.nuclei.filter(n => n.profileId === p.id).length && typeof p.label === "string" && p.label.length > 0 && /^[0-9a-f]{64}$/.test(p.orderedNucleusKeysSha256), "profile membership mismatch");
  check(doc.chunkSize === 256 && doc.chunks?.length === 127, "bounded chunk plan changed");
  for (const [j, c] of doc.chunks.entries()) check(c.index === j && c.firstFeatureRow === j * 256 + 1 && c.featureCount === Math.min(256, 32285 - j * 256) && c.path === `public/data/cano_chol_rna_counts_v1/counts-${String(j).padStart(3, "0")}.json.gzip` && c.url === "/" + c.path.slice(7) && c.bytes > 0 && c.decodedBytes > 0 && c.decodedBytes < 3000000 && /^[0-9a-f]{64}$/.test(c.sha256) && /^[0-9a-f]{64}$/.test(c.decodedSha256), "invalid feature chunk receipt");
  return freeze(doc);
}
/** Case-insensitive discovery only; selected native feature names retain exact case. */
export function findCanoCholRnaFeatures(doc, query = "", limit = 15) {
  const q = String(query).trim().toLowerCase();
  const indices = doc.genes.flatMap((name, index) => name.toLowerCase().includes(q) ? [index] : []);
  indices.sort((a, b) => Number(doc.genes[b].toLowerCase() === q) - Number(doc.genes[a].toLowerCase() === q) || Number(doc.genes[b].toLowerCase().startsWith(q)) - Number(doc.genes[a].toLowerCase().startsWith(q)) || a - b);
  return { total: indices.length, features: indices.slice(0, Math.max(1, Math.min(30, limit))).map(index => ({ name: doc.genes[index], sourceRow: index + 1 })) };
}
export function parseCanoCholRnaChunk(text, doc, number) {
  const expected = doc.chunks[number]; check(expected, "unknown feature chunk");
  const data = JSON.parse(text);
  check(data.schemaVersion === "0.1.0" && data.sourceSha256 === SHA && data.chunk === number && data.nucleusCount === 923 && data.firstFeatureRow === expected.firstFeatureRow && data.features?.length === expected.featureCount, "feature chunk/source identity mismatch");
  for (const [j, f] of data.features.entries()) {
    const row = expected.firstFeatureRow + j;
    check(Array.isArray(f) && f.length === 3 && f[0] === row && f[1] === doc.genes[row - 1] && f[2]?.length === 923 && f[2].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 4294967295), "feature names/order/counts changed");
    Object.freeze(f[2]); Object.freeze(f);
  }
  Object.freeze(data.features); return Object.freeze(data);
}
export async function loadCanoCholRnaChunk(doc, feature, { signal, fetchImpl = globalThis.fetch, decompressImpl } = {}) {
  validateCanoCholRnaDocument(doc);
  const index = doc.genes.indexOf(feature); check(index >= 0, "feature absent from source counts layer");
  const number = Math.floor(index / 256), receipt = doc.chunks[number];
  const active = () => check(!signal?.aborted, "request cancelled"); active();
  const response = await fetchImpl(receipt.url, { cache: "no-store", signal }); active();
  check(response.ok, `source feature chunk unavailable (${response.status})`);
  const compressed = new Uint8Array(await response.arrayBuffer()); active();
  check(compressed.length === receipt.bytes && await hash(compressed) === receipt.sha256, "compressed counts checksum mismatch"); active();
  const plain = decompressImpl ? await decompressImpl(compressed) : new Uint8Array(await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()); active();
  check(plain instanceof Uint8Array && plain.length === receipt.decodedBytes && await hash(plain) === receipt.decodedSha256, "decoded counts checksum mismatch"); active();
  const data = parseCanoCholRnaChunk(new TextDecoder("utf-8", { fatal: true }).decode(plain), doc, number); active();
  const result = Object.freeze({ chunk: number, verification: Object.freeze({ compressedSha256: receipt.sha256, decodedSha256: receipt.decodedSha256, receivedBytes: compressed.length, decodedBytes: plain.length, status: "runtime_both_sha256_verified", requestedUrl: receipt.url, responseUrl: response.url || null, originalRdsVerification: "offline_exact_source_replay_not_runtime_rds_download" }) });
  OWNERS.set(result, { doc, data }); return result;
}
function owned(doc, chunk, feature) {
  const holder = OWNERS.get(chunk); check(holder && holder.doc === doc, "current private byte verification required");
  const row = doc.genes.indexOf(feature); check(row >= 0 && Math.floor(row / 256) === chunk.chunk, "feature is outside current verified chunk");
  const f = holder.data.features.find(f => f[0] === row + 1); check(f?.[1] === feature, "current feature identity changed");
  return f;
}
export function canoCholRnaStatistics(doc, chunk, feature, profileId, selectedKey = null) {
  const f = owned(doc, chunk, feature); const profile = doc.profiles.find(p => p.id === profileId); check(profile, "unknown exact CHOL_IN profile");
  const summaries = doc.profiles.map(p => {
    const counts = doc.nuclei.flatMap((n, j) => n.profileId === p.id ? [f[2][j]] : []).sort((a, b) => a - b);
    const totalCount = counts.reduce((a, b) => a + b, 0), mid = Math.floor(counts.length / 2);
    return { profileId: p.id, rawLabel: p.label, nucleusCount: counts.length, detectedNuclei: counts.filter(n => n > 0).length, totalCount, meanCount: totalCount / counts.length, medianCount: counts.length % 2 ? counts[mid] : (counts[mid - 1] + counts[mid]) / 2, maximumCount: counts[counts.length - 1] };
  });
  const selectedIndex = selectedKey === null ? -1 : doc.nuclei.findIndex(n => n.key === selectedKey && n.profileId === profileId);
  check(selectedKey === null || selectedIndex >= 0, "selected nucleus does not belong to current profile");
  return { feature, sourceFeatureRow: f[0], profiles: summaries, currentProfile: summaries.find(s => s.profileId === profileId), selectedNucleus: selectedIndex < 0 ? null : { ...doc.nuclei[selectedIndex], feature, count: f[2][selectedIndex] } };
}
export function canoCholRnaReceipt(doc, chunk, feature, profileId, selectedKey = null) {
  const statistics = canoCholRnaStatistics(doc, chunk, feature, profileId, selectedKey);
  return { schemaVersion: "0.1.0", documentType: "source_chol_in_rna_counts", source: doc.source, sourceAudit: doc.sourceAudit, scope: doc.scope, verification: chunk.verification, ...statistics, summaryDenominator: "All deposited nuclei in each exact CHOL_IN profile, independently of roster search filters", bounds: "Raw counts without normalization, differential-expression inference, RNA/ATAC pairing, donor inference, morphology, geometry, or cross-source same-cell identity" };
}
export function canoCholRnaCsv(doc, chunk, feature, profileId) {
  const f = owned(doc, chunk, feature); check(doc.profiles.some(p => p.id === profileId), "unknown profile");
  const quote = s => `"${String(s).replaceAll('"', '""')}"`;
  const columns = ["source_accession", "source_file", "source_sha256", "matrix_layer", "source_feature_row", "feature", "compound_nucleus_key", "source_metadata_row", "source_counts_column", "profile_id", "raw_count", "total_rna_count", "detected_feature_count"];
  const lines = [columns];
  doc.nuclei.forEach((n, j) => { if (n.profileId === profileId) lines.push(["GSE318731", FILE, SHA, doc.source.matrixLocator, f[0], feature, n.key, n.metadataRow, n.countsColumn, profileId, f[2][j], n.totalRnaCount, n.detectedFeatureCount]); });
  return lines.map(row => row.map(quote).join(",")).join("\n") + "\n";
}

const RNA_PAIR_OWNERS = new WeakMap();
/** At most two existing source chunks; identical chunk membership reuses one proof. */
export async function loadCanoCholRnaPair(doc, firstFeature, secondFeature, options = {}) {
  validateCanoCholRnaDocument(doc);
  check(typeof firstFeature === "string" && typeof secondFeature === "string" && firstFeature !== secondFeature, "two distinct exact source features required");
  const rows = [firstFeature, secondFeature].map(feature => doc.genes.indexOf(feature));
  check(rows.every(row => row >= 0), "pair feature absent from source counts layer");
  const active = () => check(!options.signal?.aborted, "pair request cancelled"); active();
  const numbers = rows.map(row => Math.floor(row / 256));
  const controller = new AbortController(), abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    const requestOptions = { ...options, signal: controller.signal };
    const chunks = numbers[0] === numbers[1]
      ? [await loadCanoCholRnaChunk(doc, firstFeature, requestOptions)]
      : await Promise.all([loadCanoCholRnaChunk(doc, firstFeature, requestOptions), loadCanoCholRnaChunk(doc, secondFeature, requestOptions)]);
    active();
    const firstChunk = chunks[0], secondChunk = chunks.length === 1 ? chunks[0] : chunks[1];
    owned(doc, firstChunk, firstFeature); owned(doc, secondChunk, secondFeature);
    const pair = freeze({ firstFeature, secondFeature, verification: {
      status: "runtime_pair_both_source_vectors_sha256_verified",
      sourceSha256: SHA, sourceFeatureRows: rows.map(row => row + 1), requestCount: chunks.length,
      chunks: chunks.map(chunk => ({ chunk: chunk.chunk, ...chunk.verification })),
      originalRdsVerification: "offline_exact_source_replay_not_runtime_rds_download",
    } });
    RNA_PAIR_OWNERS.set(pair, { doc, firstFeature, secondFeature, firstChunk, secondChunk });
    return pair;
  } catch (error) {
    controller.abort(); throw error;
  } finally {
    options.signal?.removeEventListener("abort", abort);
  }
}
function ownedPair(doc, pair) {
  const owner = RNA_PAIR_OWNERS.get(pair);
  check(owner && owner.doc === doc, "current private pair byte verification required");
  return [owned(doc, owner.firstChunk, owner.firstFeature), owned(doc, owner.secondChunk, owner.secondFeature)];
}
function positivePairCategory(a, b) {
  return a > 0 ? (b > 0 ? "both_positive" : "first_only") : (b > 0 ? "second_only" : "neither_positive");
}
export function canoCholRnaPairStatistics(doc, pair, profileId, selectedKey = null) {
  const [first, second] = ownedPair(doc, pair);
  check(doc.profiles.some(profile => profile.id === profileId), "unknown exact CHOL_IN pair profile");
  const profiles = doc.profiles.map(profile => {
    const result = { profileId: profile.id, rawLabel: profile.label, nucleusCount: profile.nucleusCount,
      orderedNucleusKeysSha256: profile.orderedNucleusKeysSha256,
      firstPositive: 0, secondPositive: 0, bothPositive: 0, firstOnly: 0, secondOnly: 0, neitherPositive: 0,
      firstTotalCount: 0, secondTotalCount: 0 };
    doc.nuclei.forEach((nucleus, index) => {
      if (nucleus.profileId !== profile.id) return;
      const a = first[2][index], b = second[2][index];
      result.firstTotalCount += a; result.secondTotalCount += b;
      if (a > 0) result.firstPositive++; if (b > 0) result.secondPositive++;
      if (a > 0 && b > 0) result.bothPositive++;
      else if (a > 0) result.firstOnly++;
      else if (b > 0) result.secondOnly++;
      else result.neitherPositive++;
    });
    check(result.bothPositive + result.firstOnly + result.secondOnly + result.neitherPositive === result.nucleusCount, "pair partition does not reconcile exact profile membership");
    return result;
  });
  const index = selectedKey === null ? -1 : doc.nuclei.findIndex(nucleus => nucleus.key === selectedKey && nucleus.profileId === profileId);
  check(selectedKey === null || index >= 0, "selected pair nucleus does not belong to current profile");
  return freeze({ firstFeature: pair.firstFeature, secondFeature: pair.secondFeature,
    sourceFeatureRows: [first[0], second[0]], profiles,
    currentProfile: profiles.find(profile => profile.profileId === profileId),
    selectedNucleus: index < 0 ? null : { ...doc.nuclei[index], firstCount: first[2][index], secondCount: second[2][index], category: positivePairCategory(first[2][index], second[2][index]) },
  });
}
export function canoCholRnaPairReceipt(doc, pair, profileId, selectedKey = null) {
  return freeze({ schemaVersion: "0.1.0", documentType: "source_chol_in_rna_feature_pair_counts",
    source: doc.source, sourceAudit: doc.sourceAudit, scope: doc.scope, rights: doc.rights,
    verification: pair.verification, ...canoCholRnaPairStatistics(doc, pair, profileId, selectedKey),
    criterion: "Each selected raw RNA count > 0 in the same source counts column; no normalization",
    summaryDenominator: "Every deposited nucleus in each exact CHOL_IN profile, independently of roster search or page filters",
    observationUnit: "one source RNA counts column with its exact source-local nucleus metadata key",
    independentAnimalDenominator: null, cellToAnimalMapping: null,
    interpretation: { descriptiveCountsOnly: true, biologicalAbsence: false, differentialExpression: false,
      correlationOrPValue: false, causation: false, markerClassification: false, rnaAtacPairing: false,
      crossSourceIdentity: false, geometry: false, registrations: 0, newSourceProfiles: 0 },
    actualViewCaptured: false, originalSourceFetchedInBrowser: false,
    bounds: "Positive/zero partitions describe this deposited raw counts layer only; library depth matters. No co-regulation, functional trajectory, independent-animal inference, classification, normalized expression, ATAC pairing, morphology or cross-source biological identity is established.",
  });
}
export function canoCholRnaPairCsv(doc, pair, profileId) {
  const [first, second] = ownedPair(doc, pair);
  check(doc.profiles.some(profile => profile.id === profileId), "unknown exact CHOL_IN pair profile");
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [["source_accession", "source_file", "source_sha256", "matrix_layer", "first_feature", "first_source_row", "second_feature", "second_source_row", "compound_nucleus_key", "source_metadata_row", "source_counts_column", "profile_id", "raw_source_label", "first_raw_count", "second_raw_count", "raw_positive_partition", "total_rna_count", "detected_feature_count"]];
  const profile = doc.profiles.find(profile => profile.id === profileId);
  doc.nuclei.forEach((nucleus, index) => {
    if (nucleus.profileId === profileId) rows.push(["GSE318731", FILE, SHA, doc.source.matrixLocator,
      pair.firstFeature, first[0], pair.secondFeature, second[0], nucleus.key, nucleus.metadataRow, nucleus.countsColumn,
      profileId, profile.label, first[2][index], second[2][index], positivePairCategory(first[2][index], second[2][index]),
      nucleus.totalRnaCount, nucleus.detectedFeatureCount]);
  });
  return rows.map(row => row.map(quote).join(",")).join("\n") + "\n";
}
