import pv from "../data/pv-independent-morphology-routes-0.1.json" with { type: "json" };
import census from "../data/neuromorpho-census-main-scene-index-0.1.json" with { type: "json" };
import supplementary from "../data/supplementary-morphology-comparison-adapter-0.1.json" with { type: "json" };
import frames from "../data/morphology-source-frame-disclosure-0.1.json" with { type: "json" };
import todd from "../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json" with { type: "json" };
import { readVerifiedMorphologyGeometry, morphologyGeometryVerificationReceipt } from "./morphology-geometry-verification.js";
import { morphologySourceIdentityHierarchy } from "./morphology-source-identity.js";
import { createSourceIdentityHierarchy } from "./source-object-identity.js";

const proofs = new WeakMap();
let sequence = 0;
const check = (ok, message) => { if (!ok) throw new Error(`Main-scene source verification: ${message}`); };
function same(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
}
function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const copy = value => freeze(structuredClone(value));
const abort = signal => { if (signal?.aborted) throw new DOMException("Morphology verification was cancelled", "AbortError"); };
const absolutePath = path => path.startsWith("/") ? path : `/data/neuromorpho_release_8_6_124_census_v1/${path}`;
const rows = new Map();
check(census.source.repositoryRelease === "8.6.124" && census.records.length === 142 && frames.records.length === 149
  && supplementary.records.length === 7 && todd.routes.length === 30 && todd.baselineComparison.baselineRelease === "8.6.124",
"the independent 142 + 7 + 30 source rosters changed");
for (const original of census.records) {
  const frame = frames.records.find(row => row.neuronId === original.neuronId);
  check(frame?.membership.collection === "census", "census source frame is absent");
  rows.set(original.neuronId, copy({ kind: "census", release: "8.6.124", original, frame,
    geometry: { ...original.geometry, geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL", sourceFrame: original.sourceMetadata.sourceFrame },
    adapter: { neuronId: original.neuronId, assetId: original.assetId,
      geometry: { ...frame.geometryReceipt, available: true },
      normalizedMetadata: { sourceFrame: frame.sourceCoordinates.sourceFrame, dimensionality: frame.preparation.dimensionality },
      morphometrics: { computed: { segmentCount: original.geometry.segmentCount } },
      comparisonMembership: { ...frame.membership, routeId: null, routeContractPath: null, routeContractSha256: null, routeAssetManifestPath: null, routeAssetManifestSha256: null } } }));
}
for (const original of supplementary.records) {
  const frame = frames.records.find(row => row.neuronId === original.neuronId);
  check(frame?.membership.collection === "supplementary" && !rows.has(original.neuronId), "supplementary source frame or membership changed");
  rows.set(original.neuronId, copy({ kind: "supplementary", release: "8.6.124", original, frame, adapter: original,
    geometry: { ...original.geometry, path: absolutePath(original.geometry.path),
      geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL", sourceFrame: original.normalizedMetadata.sourceFrame,
      dimensionality: original.normalizedMetadata.dimensionality, sourceDiameterAvailable: original.normalizedMetadata.sourceDiameterAvailable,
      nodeCount: original.morphometrics.computed.nodeCount, segmentCount: original.morphometrics.computed.segmentCount } }));
}
for (const original of todd.routes) {
  check(original.sourceRecord.repositoryRelease === "8.6.126" && !original.censusMembership && !rows.has(original.sourceRecord.neuronId),
    "Todd release, identity or independent membership changed");
  rows.set(original.sourceRecord.neuronId, copy({ kind: "todd_supplementary", release: "8.6.126", original, geometry: original.fidelityRecord.geometry }));
}
for (const original of pv.routes) {
  check(original.sourceRecord.repositoryRelease === "8.6.124" && !original.censusMembership && !rows.has(original.sourceRecord.neuronId), "PV independent source membership changed");
  rows.set(original.sourceRecord.neuronId, copy({ kind: "pv_supplementary", release: "8.6.124", original, geometry: original.fidelityRecord.geometry }));
}
check(rows.size === 181, "main-scene exact object denominator changed");

function canonical(record) {
  const row = rows.get(record?.neuronId), expected = row?.geometry;
  check(row && record.assetId === `NeuroMorpho:${record.neuronId}`, "unknown exact source object");
  check(["path", "bytes", "sha256", "rawSwcSha256", "geometryStatus", "sourceFrame", "dimensionality", "sourceDiameterAvailable", "nodeCount", "segmentCount"]
    .every(key => record.geometry?.[key] === expected[key]), "source file, frame, counts or native diameter changed");
  const domain = row.kind === "census" ? row.original.sourceMetadata.domain
    : row.kind === "supplementary" ? row.original.normalizedMetadata.domain : row.original.sourceRecord.domain;
  const axonCount = row.kind === "census" ? row.original.geometry.nodeTypeCounts["2"] ?? 0
    : row.kind === "supplementary" ? row.original.morphometrics.computed.nodeTypeCounts["2"] ?? 0 : row.original.fidelityRecord.axon.sourceType2NodeCount;
  check(record.axon?.sourceDomain === domain && record.axon.sourceType2NodeCount === axonCount && record.axon.completeAxon === false,
    "source domain or axon authority changed");
  check(record.modes?.observedSwc.available === true && record.modes.radiusSurface.available === (expected.dimensionality === "3D" && expected.sourceDiameterAvailable)
    && record.modes.internalStructure.available === false, "surface or internal-structure authority changed");
  return row;
}
function identity(row) {
  if (!["todd_supplementary", "pv_supplementary"].includes(row.kind)) return morphologySourceIdentityHierarchy(row.adapter);
  const id = String(row.original.sourceRecord.neuronId);
  const locator = `${row.kind === "pv_supplementary" ? "data/pv-independent-morphology-routes-0.1.json" : "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json"}#routes/sourceRecord/neuronId=${id}`;
  const missing = reason => ({ status: "unknown", id: null, locator: null, reason });
  return createSourceIdentityHierarchy({ sourceId: "NeuroMorpho.Org", releaseId: row.release,
    namespace: row.kind === "pv_supplementary" ? "neuromorpho:8.6.124:pv-independent-supplement-v1" : "neuromorpho:8.6.126:todd-nts-supplement-v1", objectKind: "swc_reconstruction", objectId: id,
    objectLevel: "component", objectLocator: locator, unit: "repository_morphology_record",
    nodes: { specimen: missing("No stable physical specimen or donor ID is retained in this source route."),
      section: missing("Slicing labels and thickness do not identify an exact physical section."),
      cell: missing("The deposited reconstruction has no independent physical-cell ID or experimental parent chain."),
      component: { status: "known", id, locator, reason: null }, synapse: missing("No exact synapse ID or parent mapping is supplied.") },
    population: missing("Repository labels and the candidate paper do not establish a source-population or study-cell assignment."), parentEvidence: {} });
}
function context(row, geometry) {
  const sourceIdentity = identity(row);
  const sourceFrameDisclosure = !["todd_supplementary", "pv_supplementary"].includes(row.kind) ? row.frame : {
    documentType: row.kind === "pv_supplementary" ? "pv_8_6_124_verified_geometry_frame" : "todd_8_6_126_verified_geometry_frame", schemaVersion: "0.1.0", neuronId: geometry.neuronId, assetId: geometry.assetId,
    geometryReceipt: row.geometry, sourceCoordinates: { unit: geometry.units, sourceFrame: geometry.sourceFrame,
      boundsMicrometre: geometry.morphometrics.computedFromStandardizedSwc.boundsMicrometre,
      extentMicrometre: geometry.morphometrics.computedFromStandardizedSwc.extentMicrometre, displayTransform: geometry.displayTransform,
      viewportScaleAuthority: "viewer_only", sharedScaleAuthority: false, anatomicalOrientationAuthority: false, atlasRegistrationAuthority: false },
    preparation: row.original.sourceRecord, sourceMethodMissingness: { originalMorphologyFile: row.original.sourceObjects.originalMorphologyFile,
      standardizationLog: row.original.sourceObjects.standardizationLog },
    paperMapping: { status: row.original.sourceRecord.sourcePaperMappingStatus,
      rawReferenceFields: row.original.sourceRecord.repositoryReferenceFieldsRaw,
      candidateContext: row.original.studyContext ?? null, exactStudyCellJoin: false },
    truncation: { sourceDomainVerbatim: row.original.sourceRecord.domain, sourcePhysicalIntegrityVerbatim: row.original.sourceRecord.physicalIntegrity,
      wholeBiologicalAxonClaim: false, cutNeuriteRepairApplied: false, missingCoordinateInferenceApplied: false, restoredInVivoDimensions: false } };
  return copy({ sourceIdentity, sourceFrameDisclosure, nativeSourceContext: geometry.source, scientificUse: geometry.scientificUse,
    repositoryRelease: row.release, membership: row.kind,
    censusContribution: row.kind === "census" ? 1 : 0, independentPhysicalCellIdentity: false,
    rights: row.kind === "todd_supplementary" ? todd.licenseAndAttribution : census.source.rights,
    coordinateRelationshipToAtlas: "none", registrationCount: 0, sameCellInternalObjectCount: 0 });
}
function assertGeometry(row, geometry) {
  const expected = row.geometry, computed = geometry.morphometrics?.computedFromStandardizedSwc;
  check(geometry.schemaVersion === "1.0.0" && geometry.neuronId === (row.original.neuronId ?? row.original.sourceRecord?.neuronId), "parsed source identity changed");
  check(geometry.assetId === `NeuroMorpho:${geometry.neuronId}` && geometry.geometryStatus === expected.geometryStatus
    && geometry.sourceFrame === expected.sourceFrame && geometry.units === "micrometre_reported_by_source", "source authority, unit or frame changed");
  check(geometry.registration?.status === "unregistered" && geometry.registration.registrationCount === 0
    && geometry.registration.atlasTransform?.value === null && geometry.registration.atlasPlacement?.value === null, "source gained atlas placement");
  check(geometry.nodes?.length === expected.nodeCount && geometry.segments?.length === expected.segmentCount
    && geometry.swc?.sha256 === expected.rawSwcSha256 && geometry.swc.dimensionality === expected.dimensionality
    && geometry.swc.sourceDiameterAvailable === expected.sourceDiameterAvailable && computed?.nodeCount === expected.nodeCount
    && computed.segmentCount === expected.segmentCount && computed.rawSwcSha256 === expected.rawSwcSha256,
  "parsed source topology, dimension or radius metadata changed");
  check(geometry.qc?.status === "passed" && geometry.qc.errors.length === 0 && geometry.scientificUse === "source_local_morphology_visualization_and_qc_only",
    "source quality or scientific-use scope changed");
  const axes = [0, 1, 2];
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const node of geometry.nodes) for (const axis of axes) { min[axis] = Math.min(min[axis], node[axis + 2]); max[axis] = Math.max(max[axis], node[axis + 2]); }
  check(same(computed.boundsMicrometre, { min, max }) && axes.every(axis => Math.abs(computed.extentMicrometre[axis] - (max[axis] - min[axis])) < 1e-7),
    "source coordinates disagree with parsed bounds");
}

/** Reads actual standardized geometry JSON; a declared raw-SWC digest is not a raw-SWC read. */
export async function readVerifiedMainSceneMorphology(record, { fetchImpl = fetch, signal, forceReload = false } = {}) {
  const row = canonical(record);
  abort(signal);
  let geometry, receipt;
  if (!["todd_supplementary", "pv_supplementary"].includes(row.kind)) {
    geometry = await readVerifiedMorphologyGeometry(row.adapter, row.frame, { fetchImpl, signal, forceReload });
    receipt = morphologyGeometryVerificationReceipt(row.adapter, row.frame, geometry);
  } else {
    const response = await fetchImpl(row.geometry.path, { signal, cache: forceReload ? "no-store" : "default" });
    abort(signal); check(response.ok, `geometry request failed (${response.status})`);
    const bytes = await response.arrayBuffer(); abort(signal); check(bytes.byteLength === row.geometry.bytes, "geometry byte count changed");
    const digest = await crypto.subtle.digest("SHA-256", bytes); abort(signal);
    const sha256 = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
    check(sha256 === row.geometry.sha256, "geometry checksum verification failed");
    geometry = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    receipt = { status: "verified", neuronId: record.neuronId, assetId: record.assetId, path: row.geometry.path,
      requestUrl: row.geometry.path, bytes: bytes.byteLength, sha256, rawSwcSha256: row.geometry.rawSwcSha256,
      geometryStatus: geometry.geometryStatus, sourceFrame: geometry.sourceFrame, dimensionality: geometry.swc?.dimensionality,
      verifiedAt: new Date().toISOString(), verificationSequence: ++sequence, requestCacheMode: forceReload ? "no-store" : "default",
      scope: "standardized_geometry_bytes_only_raw_swc_hash_declared" };
  }
  assertGeometry(row, geometry); canonical(record); abort(signal);
  freeze(geometry);
  const sourceContext = context(row, geometry);
  const proof = copy({ ...receipt, mainSceneVerificationSequence: ++sequence, mainSceneRosterCount: 181,
    repositoryRelease: row.release, namespace: sourceContext.sourceIdentity.namespace,
    membership: row.kind, censusContribution: sourceContext.censusContribution });
  proofs.set(geometry, { row, proof, sourceContext });
  return geometry;
}

/** Only the exact current immutable payload issued above can expose this proof and source context. */
export function mainSceneMorphologyVerification(record, geometry) {
  const row = canonical(record), binding = proofs.get(geometry);
  check(binding && binding.row === row && Object.isFrozen(geometry), "this exact immutable payload has no current main-scene runtime proof");
  assertGeometry(row, geometry);
  return copy({ geometryVerification: binding.proof, sourceContext: binding.sourceContext });
}
