import { independentSourceObjectKey } from "./independent-source-objects.js";
import { verifyIndependentSourceObjectAsset } from "./independent-source-object-loader.js";
import { parseNeuromorphoSwc } from "./neuromorpho-swc-runtime.js";

const RELEASE = "exact-source-snapshot-2026-09-30";
const FRAME = "NeuroMorpho_CNG_standardized_local_frame";
const sourceProofs = new WeakMap();
let verificationSequence = 0;
const PINS = Object.freeze({
  "183779": {
    sourceId: "neuromorpho-zebrafish-comparative", species: "zebrafish", name: "20190706_8_1", archive: "Cohen_A", domain: "No Dendrites, No Soma, Axon", attributes: "No Diameter, 3D, Angles", diameter: false,
    api: [1461, "8345b0ee16cb7b183666790e06a18a5f0ed0018cf1e53e79c48e25c9dbc6d348"],
    swc: [145055, "40c6fc025a7224390b5d74064301250281ca1bc8deac63cbcd5fdabb134413c7"],
    morphometry: [457, "3e81f6abc0a7f24e57f481884f174c94ab3579eea37e7352338097bbffc61f8a"],
  },
  "34024": {
    sourceId: "neuromorpho-rat-comparative", species: "rat", name: "L420-LCN", archive: "Szucs", domain: "Dendrites, Soma, Axon", attributes: "Diameter, 3D, Angles", diameter: true,
    api: [1466, "b8c71a80fe29e4be2e0806349c4ba2ba5f611e7c24262d6bf5157ad39a05201e"],
    swc: [731956, "7b71de215c860af28ed78381eaaaad2c03d24d19038ee5e1e8c7962cdf901357"],
    morphometry: [468, "a1ea035737fb8bc47afef7292e00216fa9bea068d09bc3346dae0637eb893d38"],
  },
});
function check(condition, message) { if (!condition) throw new Error(message); }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

function checkObject(object) {
  const pin = PINS[object?.sourceObjectId];
  check(pin && object.key === independentSourceObjectKey(object) && object.sourceId === pin.sourceId && object.releaseId === RELEASE && object.objectKind === "standardized_swc", "Comparative source/version/kind/native ID mismatch; no fallback is allowed");
  check(same(object.coordinateFrame, { frame: FRAME, unit: "micrometre", unitStatus: "source_reported", dimensions: 3 }), "Comparative coordinate frame, units or dimensions mismatch");
  check(object.viewer?.kind === "comparative_swc" && object.viewer.neuronId === Number(object.sourceObjectId) && object.viewer.diameterAuthorized === pin.diameter && object.viewer.radiusSurfaceAdmitted === false, "Comparative display policy or exact native ID mismatch");
  check(object.context?.species === pin.species && object.context.name === pin.name && object.context.archive === pin.archive, "Comparative species/name/archive mismatch");
  const metadata = object.context.rawMetadata;
  check(String(metadata?.neuron_id) === object.sourceObjectId && metadata.neuron_name === pin.name && metadata.archive === pin.archive && metadata.species === pin.species && metadata.domain === pin.domain && metadata.attributes === pin.attributes, "Exact comparative source metadata mismatch");
  check(Array.isArray(object.relationships) && object.relationships.length === 0, "No source-deposited same-cell or cross-source relation is admitted for these comparative objects");
  check(object.provenance?.reuse?.status === "source_license_confirmed" && object.provenance.reuse.license === "CC-BY-4.0" && object.provenance.reuse.termsUrl === "https://neuromorpho.org/useterm.jsp", "Comparative asset rights gate is unresolved");
  check(Array.isArray(object.files) && object.files.length === 3, "Comparative exact source asset set is incomplete");
  for (const id of ["api", "swc", "morphometry"]) {
    const matches = object.files.filter((file) => file.id === id);
    check(matches.length === 1, `Comparative ${id} receipt is missing or duplicated`);
    const file = matches[0], [bytes, digest] = pin[id];
    const suffix = id === "swc" ? ".swc" : `-${id}.json`;
    const sourceUrl = id === "swc" ? `https://neuromorpho.org/dableFiles/${pin.archive.toLowerCase()}/CNG%20version/${pin.name}.CNG.swc`
      : `https://neuromorpho.org/api/${id === "api" ? "neuron" : "morphometry"}/id/${object.sourceObjectId}`;
    check(file.path === `/data/comparative_swc_reference_v1/nmo-${object.sourceObjectId}${suffix}` && file.url === sourceUrl && file.bytes === bytes && same(file.checksum, { algorithm: "SHA-256", digest }), `Comparative ${id} URI/bytes/checksum binding mismatch`);
  }
  if (object.sourceObjectId === "34024") {
    const conflicts = object.context.conflicts;
    check(Array.isArray(conflicts) && conflicts.length === 3
      && conflicts.some((entry) => entry.id === "paper-repository-name" && entry.status === "not_established" && entry.left === "L420-LCN (exact repository object)" && entry.right === "L420_E2 (primary paper)")
      && conflicts.some((entry) => entry.id === "soma-conversion-count" && entry.status === "source_assertion_difference" && entry.left === "SWC header: 23 contours averaged into 23 soma points" && entry.right === "Exact parsed SWC: 12 type-1 nodes")
      && conflicts.some((entry) => entry.id === "historical-morphometry-receipt" && entry.status === "receipt_drift" && entry.historicalBytesAvailable === false && entry.currentSha256 === pin.morphometry[1]),
    "Rat paper identity, soma conversion or historical receipt gate is missing");
  }
  return pin;
}

export function createComparativeSwcReferenceIndex(contract) {
  check(contract?.documentType === "independent_comparative_swc_reference" && contract.contractId === "comparative-swc-reference-0.1" && contract.releaseId === RELEASE, "Unknown comparative SWC contract");
  check(contract.scope?.comparativeSourceObjects === 2 && ["mouseCensusAdditions", "sameCellJoins", "registrations", "membraneSurfaces", "internalObjects"].every((field) => contract.scope[field] === 0), "Comparative scientific scope changed");
  check(Array.isArray(contract.objects) && contract.objects.length === 2, "Exactly two independently scoped comparative objects are required");
  const objects = contract.objects.map((object) => { checkObject(object); return object; });
  check(new Set(objects.map(({ key }) => key)).size === 2 && new Set(objects.map(({ sourceObjectId }) => sourceObjectId)).size === 2, "Duplicate comparative source key");
  return freeze({ contractId: contract.contractId, releaseId: RELEASE, objects, scope: contract.scope, coordinatePolicy: contract.sourceLocalCoordinatePolicy });
}

export function findComparativeSwcReference(index, key) {
  return typeof key === "string" ? index.objects.find((object) => object.key === key) ?? null : null;
}

/** The complete exact API, SWC and current morphometry set must pass before any geometry is returned. */
export async function loadComparativeSwcReference(object, { fetchImpl = globalThis.fetch, signal, forceReload = false } = {}) {
  const pin = checkObject(object);
  check(typeof fetchImpl === "function", "Comparative exact local asset fetch is unavailable");
  const verified = await Promise.all(object.files.map(async (file) => {
    check(!signal?.aborted, "Comparative source request was cancelled");
    const response = await fetchImpl(file.path, { signal, cache: forceReload ? "no-store" : "default" });
    check(response?.ok === true, `Comparative exact source request failed (${response?.status ?? "unknown"})`);
    const bytes = new Uint8Array(await response.arrayBuffer()).slice().buffer;
    const receipt = await verifyIndependentSourceObjectAsset(bytes, file);
    check(!signal?.aborted, "Comparative source request was cancelled");
    return { id: file.id, bytes, receipt };
  }));
  const source = (id) => verified.find((file) => file.id === id).bytes;
  const decode = (id) => JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(source(id)));
  const metadata = decode("api"), sourceMorphometry = decode("morphometry");
  check(same(metadata, object.context.rawMetadata) && same(sourceMorphometry, object.context.sourceMorphometry), "Embedded comparative metadata differs from checksum-verified exact source bytes");
  const geometry = parseNeuromorphoSwc(source("swc"), { assetId: `NeuroMorpho:${object.sourceObjectId}`, neuronId: Number(object.sourceObjectId), name: pin.name, sourceFrame: FRAME, dimensionality: "3D", diameterAuthorized: pin.diameter });
  const { radiusSurfaceAuthorized: sourceDiameterAttributePresent, ...computed } = geometry.computed;
  const nativeMetrics = { ...computed, sourceDiameterAttributePresent };
  check(same(geometry.qc, object.context.qc) && same(nativeMetrics, object.context.computedFromExactSwc), "Comparative exact topology/domain/bounds QC differs from admitted receipt");
  const rawText = new TextDecoder("utf8", { fatal: true }).decode(source("swc"));
  check(object.sourceObjectId !== "34024" || (rawText.includes("23 soma contours that are averaged into 23 soma points") && nativeMetrics.nodeTypeCounts[1] === 12), "Rat soma conversion discrepancy is not preserved");
  const edges = geometry.segments.map((row) => [row.slice(0, 3), row.slice(4, 7)]);
  check(!signal?.aborted, "Comparative source request was cancelled");
  const runtimeVerification = { status: "verified_owned_native_source_bytes", verificationSequence: ++verificationSequence,
    verifiedAt: new Date().toISOString(), requestCacheMode: forceReload ? "no-store" : "default" };
  const payload = freeze({ key: object.key, kind: "comparative_swc", points: [], edges, meshes: [], contours: [], rawNodes: geometry.nodes,
    receipt: { objectKey: object.key, sourceId: object.sourceId, releaseId: object.releaseId, objectKind: object.objectKind, sourceObjectId: object.sourceObjectId, status: "verified", coordinateFrame: object.coordinateFrame,
      verifiedFiles: verified.map(({ receipt }) => receipt), qc: geometry.qc, nativeMetrics,
      sourceMorphometryPolicy: object.context.sourceMorphometryPolicy, sourceDiameterAttributePresent, radiusSurfaceAdmitted: false,
      displayed: { edges: edges.length, meshes: 0, contours: 0, internalObjects: 0 },
      geometryScope: "exact_standardized_source_centerline_only", verificationScope: "Exact source identity, bytes, SHA-256, metadata, finite seven-column topology, domains, units and local frame; no paper-object join, native DAT semantics or membrane validation.",
      conflicts: object.context.conflicts, provenance: object.provenance, relationships: [], mouseCensusAdditions: 0, registrations: 0, runtimeVerification } });
  sourceProofs.set(payload, { objectKey: object.key, runtimeVerification });
  return payload;
}

/** Copied status/hash declarations never authorize a source export or replay. */
export function assertVerifiedComparativeSwcPayload(object, payload) {
  checkObject(object);
  const proof = sourceProofs.get(payload);
  check(proof && proof.objectKey === object.key && payload.key === object.key && Object.isFrozen(payload), "The comparative payload has no private source-byte proof for this exact object");
  return proof.runtimeVerification;
}

export function comparativeSwcNodesCsv(object, payload) {
  checkObject(object);
  check(payload?.key === object.key && payload.receipt?.objectKey === object.key && payload.receipt.status === "verified", "Node export requires the exact selected object's verified receipt");
  assertVerifiedComparativeSwcPayload(object, payload);
  return ["object_key,node_id,source_type,x_micrometre,y_micrometre,z_micrometre,raw_source_radius_micrometre,parent_node_id,source_diameter_attribute_present,radius_surface_admitted",
    ...payload.rawNodes.map((row) => [`"${object.key}"`, ...row, object.viewer.diameterAuthorized, false].join(","))].join("\n") + "\n";
}
