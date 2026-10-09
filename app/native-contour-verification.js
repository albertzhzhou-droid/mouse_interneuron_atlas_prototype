import base from "../data/neurolucida-native-contour-admission-catalog-0.3.json" with { type: "json" };
import delta from "../data/neurolucida-native-contour-admission-catalog-0.4.json" with { type: "json" };
import shellContract from "../data/native-contour-derived-soma-surface-0.1.json" with { type: "json" };
import context from "../data/native-contour-source-context-0.1.json" with { type: "json" };
import datManifest from "../data/native-dat-manifest-transport-0.1.json" with { type: "json" };
import { validateNativeDatManifestTransport } from "./native-dat-manifest-transport.js";
import { inspectNativeDat } from "./neurolucida-dat-inventory.js";
import { canonicalDatAudit, datAuditPayload, validateNativeDatAdmission } from "./neurolucida-dat-file-admission.js";
import { validateNativeContourAdmissionCatalog, validateNativeContourGeometry } from "./neurolucida-native-contour-admission.js";
import { validateNativeContourDerivedSomaSurface } from "./native-contour-derived-soma-surface.js";
import { createSourceIdentityHierarchy, SOURCE_IDENTITY_LEVELS } from "./source-object-identity.js";

const catalog = validateNativeContourAdmissionCatalog({ ...delta, baseCatalogSnapshot: base, records: [...base.records, ...delta.addedRecords] });
const proofs = new WeakMap(), shellProofs = new WeakMap();
let sequence = 0;
const check = (ok, message) => { if (!ok) throw new Error(`Native contour source: ${message}`); };
function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
freeze(catalog); freeze(context); freeze(shellContract); freeze(datManifest);
const abort = signal => { if (signal?.aborted) throw new DOMException("Native contour request cancelled", "AbortError"); };
export const NATIVE_CONTOUR_SOURCE_IDS = Object.freeze(catalog.records.map(record => record.neuronId));
export function canonicalNativeContourSource(neuronId) {
  const record = catalog.records.find(row => row.neuronId === neuronId);
  check(record?.derivedObject, "the exact record has no admitted native contour geometry");
  const sourceContext = context.records.find(row => row.neuronId === String(neuronId));
  check(sourceContext, "exact source metadata is unavailable");
  const files = datManifest.records.filter(row => row.neuronId === neuronId);
  check(files.length === 1 && files[0].originalDat.sha256 === record.source.sha256 && files[0].originalDat.bytes === record.source.bytes,
    "missing/ambiguous exact original DAT manifest");
  return { record, datFile: files[0], catalogReleaseId: catalog.releaseId, catalogContractId: catalog.contractId, sourceContext,
    shell: neuronId === shellContract.neuronId ? shellContract : null };
}
export function nativeContourSourceHierarchy(neuronId) {
  const source = canonicalNativeContourSource(neuronId), id = String(neuronId);
  const inDelta = delta.addedRecords.some(record => record.neuronId === neuronId);
  const locator = `data/neurolucida-native-contour-admission-catalog-${inDelta ? "0.4" : "0.3"}.json#${inDelta ? "addedRecords" : "records"}/neuronId=${id}`;
  const missing = reason => ({ status: "unknown", id: null, reason });
  const nodes = Object.fromEntries(SOURCE_IDENTITY_LEVELS.map(level => [level, missing(`No exact ${level} ID is retained for this source object.`)]));
  nodes.component = { status: "known", id, locator };
  return createSourceIdentityHierarchy({ sourceId: "native-contours", releaseId: source.catalogReleaseId, namespace: source.catalogContractId,
    objectKind: "native_contour_record", objectId: id, objectLocator: locator, objectLevel: "component", unit: "contours", nodes,
    population: missing("A class label, marker, shared study or root ID is not an exact source-population assignment.") });
}
async function read(file, { fetchImpl = globalThis.fetch, signal, forceReload = false } = {}, binary = false) {
  abort(signal);
  const path = file.publicPath ?? file.path;
  check(typeof path === "string" && path.startsWith("/data/"), "no exact local source path");
  const cache = forceReload ? "no-store" : "default";
  const response = await fetchImpl(path, { signal, cache });
  abort(signal); check(response.ok, `source request failed (${response.status})`);
  const bytes = await response.arrayBuffer(); abort(signal);
  check(bytes.byteLength === file.bytes, "source byte count changed");
  const digest = await crypto.subtle.digest("SHA-256", bytes); abort(signal);
  const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  check(sha256 === file.sha256, "source SHA-256 mismatch");
  return { value: binary ? new Uint8Array(bytes) : JSON.parse(new TextDecoder().decode(bytes)), receipt: { path, bytes: bytes.byteLength, sha256,
    verifiedAt: new Date().toISOString(), verificationSequence: ++sequence, requestCacheMode: cache, status: "verified" } };
}
/** Private proof requires original DAT, full inventory and exact admitted ordered coordinates. */
export async function readVerifiedNativeContours(neuronId, options = {}) {
  const { record, datFile: indexed } = canonicalNativeContourSource(neuronId);
  const manifest = await read(indexed.transport, options);
  const datFile = validateNativeDatManifestTransport(manifest.value, indexed); abort(options.signal);
  const original = await read(datFile.originalDat, options, true);
  const audit = inspectNativeDat(original.value, datFile); abort(options.signal);
  const fingerprint = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalDatAudit(datAuditPayload(audit)))); abort(options.signal);
  check(Array.from(new Uint8Array(fingerprint), n => n.toString(16).padStart(2, "0")).join("") === datFile.fullAuditSha256,
    "complete original DAT parser audit mismatch");
  const { value, receipt } = await read(record.derivedObject, options);
  validateNativeContourGeometry(value, record); validateNativeDatAdmission(audit, value, datFile); abort(options.signal);
  const common = { neuronId, assetId: value.assetId, sourceFrame: value.sourceFrame };
  freeze(value); proofs.set(value, freeze({ fileManifest: { ...manifest.receipt, ...common,
    scope: "complete_selected_dat_manifest_bytes_and_index_metadata_verified" }, geometry: { ...receipt, ...common,
    scope: "native_contour_geometry_bytes_and_original_dat_ordered_coordinates_verified" },
    originalDat: { ...original.receipt, ...common, parserVersion: audit.parserVersion, fullAuditSha256: datFile.fullAuditSha256,
      topLevelObjectCount: audit.topLevelObjects.length, scope: "original_dat_bytes_complete_inventory_and_exact_admitted_coordinates" } }));
  return value;
}
export async function readVerifiedNativeContourShell(neuronId, contours, options = {}) {
  nativeContourVerification(neuronId, contours);
  const { shell } = canonicalNativeContourSource(neuronId); check(shell, "no derived shell is admitted for this record");
  const { value, receipt } = await read(shell.artifact, options);
  validateNativeContourDerivedSomaSurface(value, contours, { originalDat: shell.sourceOriginalDat, nativeContourGeometry: shell.sourceNativeContourGeometry });
  abort(options.signal); freeze(value); shellProofs.set(value, { contours, receipt: freeze({ ...receipt, neuronId, assetId: value.assetId,
    sourceFrame: value.sourceFrame, scope: "separate_derived_open_shell_bytes_not_observed_membrane" }) });
  return value;
}
export function nativeContourVerification(neuronId, contours, derivedShell = null) {
  const { record, shell, datFile } = canonicalNativeContourSource(neuronId), verified = proofs.get(contours), proof = verified?.geometry;
  check(proof && Object.isFrozen(contours) && proof.neuronId === neuronId && proof.assetId === contours.assetId
    && proof.path === record.derivedObject.path && proof.sha256 === record.derivedObject.sha256 && proof.bytes === record.derivedObject.bytes,
  "this exact immutable contour payload has no private source-byte proof");
  check(verified.originalDat.path === datFile.originalDat.publicPath && verified.originalDat.sha256 === record.source.sha256
    && verified.originalDat.bytes === record.source.bytes && verified.originalDat.fullAuditSha256 === datFile.fullAuditSha256,
    "this exact contour payload has no current original DAT authority");
  check(verified.fileManifest.path === datFile.transport.path && verified.fileManifest.sha256 === datFile.transport.sha256
    && verified.fileManifest.bytes === datFile.transport.bytes, "this exact contour payload has no selected DAT manifest authority");
  let derived = null;
  if (derivedShell) {
    const shellVerified = shellProofs.get(derivedShell);
    check(shell && shellVerified && shellVerified.contours === contours && Object.isFrozen(derivedShell)
      && shellVerified.receipt.path === shell.artifact.publicPath && shellVerified.receipt.sha256 === shell.artifact.sha256,
    "this exact DER payload has no proof tied to the current OBS contours");
    derived = shellVerified.receipt;
  }
  return freeze({ fileManifest: verified.fileManifest, originalDat: verified.originalDat, sourceGeometry: proof, derivedShell: derived });
}
