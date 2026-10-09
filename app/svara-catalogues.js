import canonical from "../data/svara-supplement-catalogues-0.1.json" with { type: "json" };
import { createSourceIdentityHierarchy } from "./source-object-identity.js";

const freeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
export const SVARA_CATALOGUES = freeze(canonical);
const owners = new WeakMap();
const check = (ok, message) => { if (!ok) throw new Error(`Svara catalogue: ${message}`); };
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;
const same = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const sha = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  v => v.toString(16).padStart(2, "0")).join("");

export function svaraCatalogueEntry(key) {
  const entry = canonical.entries.find(row => row.key === key);
  check(entry, "exact publication entry is unavailable; no replacement was selected");
  return entry;
}

const locationNames = ["svaraSource", "svaraRelease", "svaraEntry"];
export const SVARA_DEFAULT_ENTRY = "mmc7:CiD 001";

/** A URL selects a publication page; it never supplies byte verification authority. */
export function readSvaraCatalogueLocation(href) {
  try {
    const url = new URL(href, "http://catalogue.invalid");
    check(url.pathname === "/catalogues/svara", "catalogue location must use its dedicated workspace");
    const values = locationNames.map(name => url.searchParams.getAll(name));
    if (values.every(value => value.length === 0)) return { key: SVARA_DEFAULT_ENTRY, refusal: null };
    check(values.every(value => value.length === 1), "link requires one exact source, release and entry");
    check(values[0][0] === canonical.sourceId && values[1][0] === canonical.releaseId,
      "link source or release is unavailable; no replacement was selected");
    const key = svaraCatalogueEntry(values[2][0]).key;
    return { key, refusal: null };
  } catch (failure) {
    return { key: null, refusal: `Link refused: ${failure instanceof Error ? failure.message : "invalid catalogue address"}` };
  }
}

export function writeSvaraCatalogueLocation(href, key) {
  svaraCatalogueEntry(key);
  const url = new URL(href, "http://catalogue.invalid");
  check(url.pathname === "/catalogues/svara", "catalogue location must use its dedicated workspace");
  locationNames.forEach(name => url.searchParams.delete(name));
  url.searchParams.set(locationNames[0], canonical.sourceId);
  url.searchParams.set(locationNames[1], canonical.releaseId);
  url.searchParams.set(locationNames[2], key);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function svaraCataloguePageLink(key) {
  return writeSvaraCatalogueLocation("/catalogues/svara", key);
}

export function svaraCatalogueIdentity(key) {
  const entry = svaraCatalogueEntry(key);
  const missing = level => ({ status: "unknown", id: null, locator: null,
    reason: `No exact physical ${level} ID or parent linkage is established by this publication page.` });
  return createSourceIdentityHierarchy({ sourceId: canonical.sourceId, releaseId: canonical.releaseId,
    namespace: entry.sourceComponentId, objectKind: "publication_catalogue_entry", objectLevel: "component",
    objectId: entry.sourceLabel, objectLocator: entry.sourceLocator, unit: "published_catalogue_page_entry",
    nodes: { specimen: missing("specimen"), section: missing("section"), cell: missing("raw-volume cell"),
      component: { status: "known", id: entry.sourceLabel, locator: entry.sourceLocator, reason: null },
      synapse: missing("synapse endpoint") },
    population: { status: "unknown", id: null, locator: null,
      reason: "The native MN, CiD or CoBL catalogue label is retained as source context, not a genetic or cross-study population assignment." } });
}

export async function verifySvaraCataloguePage(bytes, key, { signal } = {}) {
  signal?.throwIfAborted();
  const entry = svaraCatalogueEntry(key);
  check(bytes instanceof Uint8Array && bytes.length === entry.raster.bytes, "page byte length differs");
  const owned = new Uint8Array(bytes);
  check(await sha(owned.buffer) === entry.raster.sha256, "page checksum differs");
  signal?.throwIfAborted();
  check([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => owned[i] === v), "page is not the verified PNG");
  const view = new DataView(owned.buffer);
  check(view.getUint32(16) === entry.raster.widthPixels && view.getUint32(20) === entry.raster.heightPixels,
    "page raster dimensions differ");
  const proof = freeze({ key });
  owners.set(proof, { entry, bytes: owned });
  return proof;
}

export async function loadSvaraCataloguePage(key, { signal, fetchImpl = globalThis.fetch } = {}) {
  signal?.throwIfAborted();
  const entry = svaraCatalogueEntry(key);
  const response = await fetchImpl(entry.raster.url, { signal, cache: "no-store" });
  check(response.ok, `page response ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  signal?.throwIfAborted();
  return verifySvaraCataloguePage(bytes, key, { signal });
}

export function svaraVerifiedPageBytes(proof, key) {
  const owner = owners.get(proof);
  check(owner && owner.entry === svaraCatalogueEntry(key), "current exact page byte authority is required");
  return new Uint8Array(owner.bytes);
}

function fixedReceipt(key) {
  const entry = svaraCatalogueEntry(key), catalogue = canonical.catalogues.find(row => row.id === entry.catalogueId);
  return { documentType: "source_publication_catalogue_page", schemaVersion: "0.1.0",
    contractId: canonical.contractId, sourceIdentity: svaraCatalogueIdentity(key),
    sourceCitation: canonical.citation, sourceRecordUrl: canonical.sourceUrl,
    biologicalContext: canonical.biologicalContext, rights: canonical.rights, catalogue,
    selection: entry, representation: canonical.representation, extraction: canonical.extraction,
    currentLoaderReceipt: { status: "current_png_bytes_verified", ...entry.raster,
      originalZipFetchedByBrowser: false, originalPdfFetchedByBrowser: false },
    display: { kind: "complete_original_publication_page_raster", sourceDpi: 96,
      crop: false, recoloring: false, tracing: false, pixelMeasurements: false,
      reportedValues: "source strings, not recomputed", physicalCoordinateTransform: null } };
}

export function buildSvaraCatalogueReceipt(proof, key, generatedAt = new Date().toISOString()) {
  svaraVerifiedPageBytes(proof, key);
  check(typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt)), "invalid receipt date");
  return freeze({ ...fixedReceipt(key), generatedAt });
}

/** Imported labels, fields or loader declarations cannot supply current PNG authority. */
export function inspectSvaraCatalogueReceipt(receipt) {
  check(receipt && typeof receipt === "object", "receipt must be an object");
  const key = receipt.selection?.key;
  const fixed = Object.fromEntries(Object.entries(receipt).filter(([name]) => name !== "generatedAt"));
  check(same(fixed, fixedReceipt(key)), "source, entry, reported values, rights or representation changed");
  check(typeof receipt.generatedAt === "string" && Number.isFinite(Date.parse(receipt.generatedAt)), "invalid receipt date");
  return { key };
}

export function restoreSvaraCatalogueReceipt(receipt, proof) {
  const { key } = inspectSvaraCatalogueReceipt(receipt);
  check(same(receipt, buildSvaraCatalogueReceipt(proof, key, receipt.generatedAt)), "current source page differs");
  return { key };
}
