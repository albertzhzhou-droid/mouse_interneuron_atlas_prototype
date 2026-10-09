import contract from "../data/neuromorpho-no-age-query-universe-0.1.json" with { type: "json" };
import roster from "../data/neuromorpho-no-age-query-universe-roster-0.1.json" with { type: "json" };
import { parseNeuromorphoSwc } from "./neuromorpho-swc-runtime.js";
import { createSourceIdentityHierarchy } from "./source-object-identity.js";

const namespace = "neuromorpho:8.6.124:mouse-spinal-interneuron-no-age-universe-v1";
const indexSha256 = "1ba52eb81aa141349f9e9a6916f8acf5a089ba079e9de34507e50f32bd6cfd68";
const indexes = new WeakMap(), records = new WeakMap(), geometries = new WeakMap();
let sequence = 0;
function check(ok, message) { if (!ok) throw new Error(`NeuroMorpho universe verification: ${message}`); }
function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function abort(signal) { if (signal?.aborted) throw new DOMException("Universe verification cancelled", "AbortError"); }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
const safePath = (path, id) => typeof path === "string" && /^\/data\/[A-Za-z0-9_/-]+\.swc$/.test(path)
  && !path.split("/").includes("..") && !path.includes("//") && path.endsWith(`/nmo-${id}.swc`);
check(contract.dataset.indexSha256 === indexSha256 && contract.dataset.indexBytes === 8025022
  && roster.indexSha256 === indexSha256 && roster.queryRecordCount === 1097
  && roster.admittedNeuronIds.length === 1097 && new Set(roster.admittedNeuronIds).size === 1097
  && roster.quarantinedNeuronIds.length === 0, "the fixed source index or exact roster changed");

async function readBytes(path, bytes, sha256, { fetchImpl = fetch, signal, forceReload = false } = {}) {
  abort(signal);
  const response = await fetchImpl(path, { signal, cache: forceReload ? "no-store" : "default" });
  abort(signal); check(response?.ok, `source request failed (${response?.status ?? "unavailable"})`);
  const body = await response.arrayBuffer();
  abort(signal); check(body instanceof ArrayBuffer && body.byteLength === bytes, "source byte count changed");
  const digest = await crypto.subtle.digest("SHA-256", body);
  abort(signal);
  const actual = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
  check(actual === sha256, "source checksum changed");
  return body;
}

/** Canonical membership is granted only after reading the fixed index bytes, never by a copied record. */
export async function readVerifiedUniverseIndex(options = {}) {
  const body = await readBytes(contract.dataset.indexPath, contract.dataset.indexBytes, indexSha256, options);
  const index = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  check(index.documentType === "neuromorpho_no_age_query_universe_index" && index.schemaVersion === "1.0.0"
    && index.assetSetId === namespace && index.repositoryRelease === "8.6.124" && index.snapshotDate === "2026-09-01"
    && index.summary.queryRecordCount === 1097 && index.summary.admittedSourceObjectCount === 1097
    && index.summary.registrationCount === 0 && index.summary.sameSpecimenInternalStructureCount === 0
    && Array.isArray(index.records) && same(index.records.map(row => row.neuronId), roster.admittedNeuronIds), "index schema, release or exact membership changed");
  for (const row of index.records) {
    const source = row.sourceObject, metadata = row.normalizedMetadata;
    check(row.assetId === `NeuroMorpho:${row.neuronId}` && row.officialMetadata.neuron_id === row.neuronId
      && row.memberships.noAgeQueryUniverse === true && source.status === "admitted" && row.qc.status === "passed"
      && safePath(source.rawSwcPath, row.neuronId) && Number.isSafeInteger(source.rawSwcBytes) && source.rawSwcBytes > 0
      && /^[a-f0-9]{64}$/.test(source.rawSwcSha256) && source.geometryCopyCount === 0 && source.registrationCount === 0
      && ["2D", "3D"].includes(metadata.dimensionality) && typeof metadata.sourceDiameterAvailable === "boolean"
      && metadata.sourceFrame === "NeuroMorpho_CNG_standardized_local_frame" && metadata.registrationStatus === "unregistered"
      && row.missingness.specimenId.value === null && row.missingness.donorId.value === null
      && row.missingness.atlasTransform.value === null && row.missingness.atlasPlacement.value === null,
    `record ${row.neuronId} source, frame or scientific boundary changed`);
  }
  abort(options.signal); freeze(index);
  const receipt = Object.freeze({ status: "verified", path: contract.dataset.indexPath, bytes: body.byteLength,
    sha256: indexSha256, repositoryRelease: index.repositoryRelease, namespace, recordCount: index.records.length,
    verifiedAt: new Date().toISOString(), verificationSequence: ++sequence,
    requestCacheMode: options.forceReload ? "no-store" : "default", scope: "fixed_universe_index_bytes_and_exact_1097_record_membership" });
  indexes.set(index, receipt);
  for (const row of index.records) records.set(row, { index, receipt });
  return index;
}
export function universeIndexVerificationReceipt(index) {
  const receipt = indexes.get(index);
  check(receipt && Object.isFrozen(index), "this exact index has no private byte verification");
  return receipt;
}
function currentRecord(record) {
  const binding = records.get(record);
  check(binding && Object.isFrozen(record) && indexes.get(binding.index) === binding.receipt,
    "this exact record is outside the currently byte-verified 1097-record index");
  return binding;
}
function checkComputed(record, geometry) {
  const expected = record.morphometrics.computed, computed = geometry.computed;
  check(["nodeCount", "segmentCount", "rootNodeId", "zeroLengthEdgeCount"].every(key => expected[key] === computed[key])
    && same(expected.nodeTypeCounts, computed.nodeTypeCounts)
    && ["min", "max"].every(key => expected.boundsMicrometre[key].every((value, axis) => close(value, computed.boundsMicrometre[key][axis])))
    && expected.extentMicrometre.every((value, axis) => close(value, computed.extentMicrometre[axis]))
    && close(expected.totalCableLengthMicrometre, computed.totalCableLengthMicrometre), "parsed native topology or source-local metrics changed");
  check(geometry.radiusSurfaceAuthorized === (record.normalizedMetadata.dimensionality === "3D" && record.normalizedMetadata.sourceDiameterAvailable)
    && geometry.extrusionApplied === false && geometry.registration.registrationCount === 0,
  "parsed geometry gained unauthorized radius, depth or registration");
}

/** Uses actual WebCrypto SHA-256; the standalone parser's public verified flags never grant this proof. */
export async function readVerifiedUniverseGeometry(record, options = {}) {
  const binding = currentRecord(record), source = record.sourceObject, metadata = record.normalizedMetadata;
  const body = await readBytes(source.rawSwcPath, source.rawSwcBytes, source.rawSwcSha256, options);
  const geometry = parseNeuromorphoSwc(body, { assetId: record.assetId, neuronId: record.neuronId, name: metadata.name,
    sourceFrame: metadata.sourceFrame, dimensionality: metadata.dimensionality, diameterAuthorized: metadata.sourceDiameterAvailable,
    sourceReceipt: { path: source.rawSwcPath, bytes: body.byteLength, sha256: source.rawSwcSha256,
      verified: true, transport: "standardized_swc", sourceAssetSetId: namespace, repositoryRelease: "8.6.124",
      nativeSourceUrl: source.directUrl, paper: record.sourcePaper, authority: binding.index.authority, rights: binding.index.rights } });
  checkComputed(record, geometry); currentRecord(record); abort(options.signal); freeze(geometry);
  const receipt = Object.freeze({ status: "verified", neuronId: record.neuronId, assetId: record.assetId,
    path: source.rawSwcPath, requestUrl: source.rawSwcPath, bytes: body.byteLength, sha256: source.rawSwcSha256,
    rawSwcSha256: source.rawSwcSha256, geometryStatus: geometry.geometryStatus, sourceFrame: geometry.sourceFrame,
    dimensionality: metadata.dimensionality, indexPath: binding.receipt.path, indexBytes: binding.receipt.bytes,
    indexSha256, namespace, repositoryRelease: "8.6.124", verifiedAt: new Date().toISOString(), verificationSequence: ++sequence,
    requestCacheMode: options.forceReload ? "no-store" : "default", scope: "standardized_swc_bytes_verified_and_runtime_parse" });
  geometries.set(geometry, { record, receipt });
  return geometry;
}
export function universeGeometryVerificationReceipt(record, geometry) {
  currentRecord(record);
  const binding = geometries.get(geometry);
  check(binding?.record === record && Object.isFrozen(geometry), "this exact immutable source geometry has no private SWC byte proof");
  checkComputed(record, geometry);
  return binding.receipt;
}

export function universeSourceIdentityHierarchy(record) {
  currentRecord(record);
  const id = String(record.neuronId);
  const locator = `public${contract.dataset.indexPath}#records/neuronId=${id}`;
  const unknown = reason => ({ status: "unknown", id: null, locator: null, reason });
  return createSourceIdentityHierarchy({ sourceId: "NeuroMorpho.Org", releaseId: "8.6.124", namespace,
    objectKind: "swc_reconstruction", objectId: id, objectLocator: locator, objectLevel: "component", unit: "repository_morphology_record",
    nodes: { specimen: unknown(record.missingness.specimenId.missingReason),
      section: unknown("No exact physical section identifier or parent linkage is supplied by the source API."),
      cell: unknown("The repository neuron ID identifies a deposited reconstruction, not an independently established physical cell."),
      component: { status: "known", id, locator, reason: null },
      synapse: unknown("SWC source nodes do not establish an exact synapse identity or parent chain.") },
    population: unknown("Repository query membership, source labels and paper identifiers do not establish a physical source population."), parentEvidence: {} });
}

export function universeGeometrySourceFrame(record, geometry) {
  const binding = currentRecord(record), receipt = universeGeometryVerificationReceipt(record, geometry);
  return { documentType: "neuromorpho_universe_runtime_source_frame", schemaVersion: "0.1.0", neuronId: record.neuronId,
    assetId: record.assetId, namespace, repositoryRelease: "8.6.124", membership: structuredClone(record.memberships),
    indexReceipt: { path: binding.receipt.path, bytes: binding.receipt.bytes, sha256: binding.receipt.sha256 },
    geometryReceipt: { path: receipt.path, bytes: receipt.bytes, sha256: receipt.sha256, scope: receipt.scope },
    sourceCoordinates: { unit: geometry.units, sourceFrame: geometry.sourceFrame,
      boundsMicrometre: structuredClone(geometry.computed.boundsMicrometre), extentMicrometre: [...geometry.computed.extentMicrometre],
      displayTransform: structuredClone(geometry.displayTransform), viewportScaleAuthority: "camera_target_plane_source_local_only",
      sharedScaleAuthority: false, anatomicalOrientationAuthority: false, atlasRegistrationAuthority: false },
    preparation: { nativeMethodFields: Object.fromEntries(["protocol", "slicing_direction", "slicing_thickness", "shrinkage_reported", "shrinkage_corrected",
      "reported_value", "reported_xy", "reported_z", "corrected_value", "corrected_xy", "corrected_z"].map(key => [key, record.officialMetadata[key] ?? null])),
      sourceLabels: structuredClone(record.normalizedMetadata), numericAge: structuredClone(record.missingness.numericAge),
      dimensionality: record.normalizedMetadata.dimensionality, sourceDiameterAvailable: record.normalizedMetadata.sourceDiameterAvailable,
      radiusSurfaceAuthorized: geometry.radiusSurfaceAuthorized, zCoordinatePolicy: geometry.zCoordinatePolicy,
      restoredInVivoDimensions: false, extrusionApplied: false },
    truncation: { sourceDomainVerbatim: record.normalizedMetadata.domain, sourcePhysicalIntegrityVerbatim: record.normalizedMetadata.physicalIntegrity,
      wholeBiologicalAxonClaim: false, cutNeuriteRepairApplied: false, missingCoordinateInferenceApplied: false },
    sourcePaper: structuredClone(record.sourcePaper), rights: structuredClone(binding.index.rights), scientificBoundary: structuredClone(binding.index.scientificBoundary) };
}
