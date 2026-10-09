import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { readVerifiedUniverseIndex, readVerifiedUniverseGeometry, universeIndexVerificationReceipt, universeGeometryVerificationReceipt,
  universeSourceIdentityHierarchy, universeGeometrySourceFrame } from "../app/neuromorpho-universe-verification.js";
import { captureMorphologySourceView, validateMorphologySourceViewReplay } from "../app/morphology-source-view.js";
import { createObservedSwcCenterlines, createObservedTopologyLandmarks, createRadiusDerivedSurface } from "../app/source-local-morphology-geometry.js";
const calls = [];
async function fetchFile(url, options) {
  calls.push({ url, cache: options.cache, signal: options.signal });
  const bytes = await readFile(new URL(`../public${url}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
}
const index = await readVerifiedUniverseIndex({ fetchImpl: fetchFile });
const fixtures = [];
for (const id of [45677, 45675, 170034, 108974]) {
  const record = index.records.find(row => row.neuronId === id);
  fixtures.push({ record, geometry: await readVerifiedUniverseGeometry(record, { fetchImpl: fetchFile }) });
}
// Deterministic scene fixtures do not claim live browser or WebGL execution.
function view(fixture, radius = false) {
  const { record, geometry } = fixture;
  const root = radius ? createRadiusDerivedSurface(geometry, { colors: {} }) : createObservedSwcCenterlines(geometry, { colors: {} });
  if (radius) root.add(createObservedSwcCenterlines(geometry, { colors: {} }));
  root.add(createObservedTopologyLandmarks(geometry));
  const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  const camera = new THREE.PerspectiveCamera(38, 1.6, .001, 1000), target = sphere.center.clone();
  const planar = record.normalizedMetadata.dimensionality === "2D";
  camera.position.copy(target).addScaledVector(planar ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, .7, 1).normalize(), sphere.radius * 4);
  camera.lookAt(target); const distance = camera.position.distanceTo(sphere.center);
  camera.near = Math.max(Math.min(sphere.radius / 1000, distance / 1000), .001);
  camera.far = Math.max(distance + 2 * sphere.radius, 4 * sphere.radius, 100);
  const result = { status: "rendered", runtimeBinding: { neuronId: record.neuronId, geometrySha256: record.sourceObject.rawSwcSha256,
    viewportInstanceId: "source-local-runtime-19", viewportRevision: 3 }, requestedMode: "radius", actualMode: radius ? "radius" : "skeleton", sourcePlaneLocked: planar,
    camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: 38, zoom: 1, aspect: 1.6, near: camera.near, far: camera.far, filmGauge: 35, filmOffset: 0 },
    viewport: { cssWidth: 640, cssHeight: 400, drawingBufferWidth: 864, drawingBufferHeight: 540, pixelRatio: 1.35 },
    renderer: { engine: "THREE", revision: THREE.REVISION, type: "WebGLRenderer", outputColorSpace: "srgb", toneMapping: 0, alpha: true, antialias: true },
    clipping: { globalPlanes: [], localClippingEnabled: false }, layers: { sourceGeometryVisible: true, centerlinesVisible: true, radiusSurfaceVisible: radius, topologyLandmarksVisible: true, sourceAxesVisible: true },
    inspection: { selectedNodeId: geometry.nodes.at(-1)[0], contextDimmed: true, overlayAuthority: "exact_swc_parent_path_and_descendant_edges" },
    sceneBounds: { center: sphere.center.toArray(), radius: sphere.radius }, displayTransform: geometry.displayTransform };
  root.traverse(object => { object.geometry?.dispose(); (Array.isArray(object.material) ? object.material : object.material ? [object.material] : []).forEach(material => material.dispose()); });
  return result;
}

test("actual fixed index bytes admit exactly 1097 immutable source observations with separate unknown physical parents", () => {
  const proof = universeIndexVerificationReceipt(index);
  assert.equal(proof.bytes, 8025022); assert.equal(proof.recordCount, 1097);
  const identities = index.records.map(universeSourceIdentityHierarchy);
  assert.equal(new Set(identities.map(row => row.key)).size, 1097);
  for (const row of identities) {
    assert.equal(row.nodes.component.status, "known"); assert.equal(row.nodes.cell.id, null);
    assert.equal(row.nodes.specimen.id, null); assert.equal(row.nodes.section.id, null);
    assert.equal(row.geometryTransferAllowed, false); assert.equal(row.registrationCount, 0);
  }
  assert.ok(Object.isFrozen(index.records[0].officialMetadata));
  assert.throws(() => universeIndexVerificationReceipt(structuredClone(index)), /no private byte verification/);
});

test("index request, actual byte length, actual SHA and cancellation fail closed without admitting copied records", async () => {
  const bytes = await readFile(new URL(`../public${proofPath()}`, import.meta.url));
  for (const fetchImpl of [async () => ({ ok: false, status: 404 }),
    async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }),
    async () => ({ ok: true, arrayBuffer: async () => { const corrupt = Uint8Array.from(bytes); corrupt[0] ^= 1; return corrupt.buffer; } })]) {
    await assert.rejects(readVerifiedUniverseIndex({ fetchImpl }), /source request|byte count|checksum/);
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(readVerifiedUniverseIndex({ fetchImpl: fetchFile, signal: controller.signal }), { name: "AbortError" });
  await assert.rejects(readVerifiedUniverseGeometry(structuredClone(fixtures[0].record), { fetchImpl: fetchFile }), /outside the currently byte-verified/);
});
function proofPath() { return universeIndexVerificationReceipt(index).path; }

test("delta 3D, deposited 2D with nonzero z, No Diameter and reused frozen adult SWCs retain native values and exact raw-byte proof", () => {
  for (const { record, geometry } of fixtures) {
    const proof = universeGeometryVerificationReceipt(record, geometry), frame = universeGeometrySourceFrame(record, geometry);
    assert.equal(proof.sha256, record.sourceObject.rawSwcSha256); assert.equal(proof.bytes, record.sourceObject.rawSwcBytes);
    assert.equal(proof.scope, "standardized_swc_bytes_verified_and_runtime_parse");
    assert.equal(frame.sourceCoordinates.unit, "micrometre_reported_by_source");
    assert.equal(geometry.computed.nodeCount, record.morphometrics.computed.nodeCount);
    assert.ok(Object.isFrozen(geometry.nodes[0]));
    assert.throws(() => universeGeometryVerificationReceipt(record, structuredClone(geometry)), /no private SWC byte proof/);
  }
  const planar = fixtures[1].geometry;
  assert.equal(planar.diameterAuthorized, true); assert.equal(planar.radiusSurfaceAuthorized, false);
  assert.deepEqual(planar.computed.boundsMicrometre, { min: [-279.7, -123.4, -65], max: [9.6, 248.2, 147] });
  assert.equal(planar.extrusionApplied, false);
  assert.equal(fixtures[2].geometry.swc.sourceDiameterAvailable, false);
  assert.equal(fixtures[2].geometry.computed.radiusDerived.value, null);
  assert.equal(fixtures[3].record.memberships.frozenAdultSubset, true);
  assert.ok(!fixtures[3].record.sourceObject.rawSwcPath.includes("no_age_universe_v1/swc"));
});

test("fresh raw SWC requests use no-store, reject changed bytes and stop after cancellation before issuing private proof", async () => {
  const { record } = fixtures[0];
  const fresh = await readVerifiedUniverseGeometry(record, { fetchImpl: fetchFile, forceReload: true });
  assert.equal(calls.at(-1).cache, "no-store"); assert.notEqual(fresh, fixtures[0].geometry);
  assert.ok(universeGeometryVerificationReceipt(record, fresh).verificationSequence > universeGeometryVerificationReceipt(record, fixtures[0].geometry).verificationSequence);
  await assert.rejects(readVerifiedUniverseGeometry(record, { fetchImpl: async () => ({ ok: false, status: 404 }) }), /source request/);
  await assert.rejects(readVerifiedUniverseGeometry(record, { fetchImpl: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(record.sourceObject.rawSwcBytes) }) }), /checksum/);
  const controller = new AbortController();
  await assert.rejects(readVerifiedUniverseGeometry(record, { signal: controller.signal, fetchImpl: async (url, options) => {
    const response = await fetchFile(url, options); controller.abort(); return response;
  } }), { name: "AbortError" });
});

test("all four Universe source classes replay full views using fresh raw SWC proof rather than the 149 JSON geometry roster", async () => {
  for (const fixture of fixtures) {
    const radius = fixture.record.normalizedMetadata.dimensionality === "3D" && fixture.record.normalizedMetadata.sourceDiameterAvailable;
    const document = captureMorphologySourceView(fixture.record, fixture.geometry, view(fixture, radius), THREE.REVISION);
    const fresh = await readVerifiedUniverseGeometry(fixture.record, { fetchImpl: fetchFile, forceReload: true });
    assert.deepEqual(validateMorphologySourceViewReplay(fixture.record, fresh, structuredClone(document), THREE.REVISION), document.view);
    assert.equal(document.source.nativeObservationId, String(fixture.record.neuronId));
    assert.equal(document.sourceFrameDisclosure.namespace, index.assetSetId);
    assert.equal(document.scientificScope.samePhysicalCellIdentity, false);
    assert.equal(document.geometryVerification.scope, "standardized_swc_bytes_verified_and_runtime_parse");
  }
});

test("Universe view source scope, membership, file identity, frame, native preparation, rights and hierarchy cannot be changed", () => {
  const fixture = fixtures[1], document = captureMorphologySourceView(fixture.record, fixture.geometry, view(fixture), THREE.REVISION);
  for (const mutate of [doc => { doc.sourceFrameDisclosure.membership.frozenAdultSubset = true; },
    doc => { doc.geometryVerification.scope = "standardized_geometry_bytes_only_raw_swc_hash_declared"; },
    doc => { doc.geometryVerification.indexSha256 = "0".repeat(64); }, doc => { doc.sourceFrameDisclosure.preparation.nativeMethodFields.slicing_thickness = "500"; },
    doc => { doc.sourceFrameDisclosure.rights.license = "unrestricted"; }, doc => { doc.sourceIdentity.nodes.cell.id = "invented"; },
    doc => { doc.sourceFrameDisclosure.sourceCoordinates.boundsMicrometre.min[2] = 0; },
    doc => { doc.view.actualMode = "radius"; }, doc => { doc.view.sourcePlaneLocked = false; }]) {
    const changed = structuredClone(document); mutate(changed);
    assert.throws(() => validateMorphologySourceViewReplay(fixture.record, fixture.geometry, changed, THREE.REVISION), /Morphology source view/);
  }
  assert.throws(() => validateMorphologySourceViewReplay(fixtures[0].record, fixtures[0].geometry, document, THREE.REVISION), /saved source identity/);
  assert.throws(() => captureMorphologySourceView(fixture.record, structuredClone(fixture.geometry), document.view, THREE.REVISION), /no private SWC byte proof/);
});

test("the current private producer replays every admitted SWC: 1097 exact objects, 916 authorized 3D surfaces, 39 source-labelled 2D and 142 No Diameter", async () => {
  const counts = { verified: 0, surface: 0, planar: 0, noDiameter: 0, reused: 0 };
  for (const record of index.records) {
    const geometry = await readVerifiedUniverseGeometry(record, { fetchImpl: fetchFile });
    const proof = universeGeometryVerificationReceipt(record, geometry);
    assert.equal(proof.neuronId, record.neuronId); assert.equal(proof.sha256, record.sourceObject.rawSwcSha256);
    assert.equal(geometry.nodes.length, record.morphometrics.computed.nodeCount);
    counts.verified += 1;
    if (geometry.radiusSurfaceAuthorized) counts.surface += 1;
    if (geometry.dimensionality === "2D") counts.planar += 1;
    if (!geometry.swc.sourceDiameterAvailable) counts.noDiameter += 1;
    if (record.sourceObject.transport === "existing_generated_geometry") counts.reused += 1;
  }
  assert.deepEqual(counts, { verified: 1097, surface: 916, planar: 39, noDiameter: 142, reused: 149 });
});
