import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";
import * as THREE from "three";
import { readVerifiedMorphologyGeometry, verifiedMorphologyGeometryUrl } from "../app/morphology-geometry-verification.js";
import { createObservedSwcCenterlines, createObservedTopologyLandmarks, createRadiusDerivedSurface } from "../app/source-local-morphology-geometry.js";
import { captureMorphologySourceView, validateMorphologySourceViewReplay, assertMorphologySourceViewSceneBounds, assertMorphologySourceViewAppliedPose } from "../app/morphology-source-view.js";
const census = JSON.parse(await readFile(new URL("../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", import.meta.url)));
const supplementary = JSON.parse(await readFile(new URL("../data/supplementary-morphology-comparison-adapter-0.1.json", import.meta.url)));
const frames = JSON.parse(await readFile(new URL("../data/morphology-source-frame-disclosure-0.1.json", import.meta.url)));
const fixtures = [];
const colors = { 1: 0xffffff, 2: 0x99aaaa, 3: 0x88bb99, 4: 0x77cc88 };
for (const id of [108974, 194468, 45674, 242822]) {
  const record = census.records.find(row => row.neuronId === id) ?? supplementary.records.find(row => row.neuronId === id);
  if (!record.comparisonMembership) record.comparisonMembership = { collection: "census", censusContribution: 1, supplementaryContribution: 0, routeId: null, routeContractPath: null, routeContractSha256: null, routeAssetManifestPath: null, routeAssetManifestSha256: null };
  const frame = frames.records.find(row => row.neuronId === id);
  const bytes = await readFile(new URL(`../public${verifiedMorphologyGeometryUrl(record, frame)}`, import.meta.url));
  const load = options => readVerifiedMorphologyGeometry(record, frame, { fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }), ...options });
  fixtures.push({ record, frame, bytes, load, geometry: await load() });
}
// These are deterministic source-scene/camera fixtures, not claims of a live WebGL render.
function viewFor(fixture, { requestedMode = "skeleton", actualMode = "skeleton", topology = true } = {}) {
  const geometry = fixture.geometry;
  const root = actualMode === "radius" ? createRadiusDerivedSurface(geometry, { colors }) : createObservedSwcCenterlines(geometry, { colors });
  if (actualMode === "radius") root.add(createObservedSwcCenterlines(geometry, { colors }));
  if (topology) root.add(createObservedTopologyLandmarks(geometry));
  const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  const camera = new THREE.PerspectiveCamera(38, 640 / 400, .001, 1000);
  const target = sphere.center.clone();
  const direction = fixture.record.normalizedMetadata.dimensionality === "2D" ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1.45, .9, 1.65).normalize();
  camera.position.copy(target).addScaledVector(direction, sphere.radius * 4);
  camera.lookAt(target);
  const distance = camera.position.distanceTo(sphere.center);
  camera.near = Math.max(Math.min(sphere.radius / 1000, distance / 1000), .001);
  camera.far = Math.max(distance + 2 * sphere.radius, 4 * sphere.radius, 100);
  const view = {
    status: "rendered", runtimeBinding: { neuronId: fixture.record.neuronId, geometrySha256: fixture.record.geometry.sha256, viewportInstanceId: "source-local-runtime-17", viewportRevision: 2 },
    requestedMode, actualMode, sourcePlaneLocked: fixture.record.normalizedMetadata.dimensionality === "2D",
    camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset },
    viewport: { cssWidth: 640, cssHeight: 400, drawingBufferWidth: 864, drawingBufferHeight: 540, pixelRatio: 1.35 },
    renderer: { engine: "THREE", revision: THREE.REVISION, type: "WebGLRenderer", outputColorSpace: "srgb", toneMapping: 0, alpha: true, antialias: true },
    clipping: { globalPlanes: [], localClippingEnabled: false },
    layers: { sourceGeometryVisible: true, centerlinesVisible: true, radiusSurfaceVisible: actualMode === "radius", topologyLandmarksVisible: topology, sourceAxesVisible: true },
    inspection: { selectedNodeId: geometry.nodes.at(-1)[0], contextDimmed: true, overlayAuthority: "exact_swc_parent_path_and_descendant_edges" },
    sceneBounds: { center: sphere.center.toArray(), radius: sphere.radius }, displayTransform: geometry.displayTransform,
  };
  root.traverse(object => { object.geometry?.dispose(); const materials = object.material ? Array.isArray(object.material) ? object.material : [object.material] : []; materials.forEach(material => material.dispose()); });
  return view;
}
function receipt(fixture = fixtures[0], options) { return captureMorphologySourceView(fixture.record, fixture.geometry, viewFor(fixture, options), THREE.REVISION); }

test("3D, planar fallback and supplementary views round-trip against a freshly byte-verified source", async () => {
  for (const fixture of fixtures) {
    const document = receipt(fixture, fixture.record.normalizedMetadata.dimensionality === "2D" || !fixture.record.normalizedMetadata.sourceDiameterAvailable ? { requestedMode: "radius" } : undefined);
    const fresh = await fixture.load({ forceReload: true });
    assert.notEqual(fresh, fixture.geometry);
    assert.deepEqual(validateMorphologySourceViewReplay(fixture.record, fresh, JSON.parse(JSON.stringify(document)), THREE.REVISION), document.view);
    assert.equal(document.scientificScope.registrationCount, 0);
    assert.equal(document.scientificScope.samePhysicalCellIdentity, false);
    assert.equal(document.geometryVerification.scope, "standardized_geometry_bytes_only_raw_swc_hash_declared");
    assert.equal(document.source.nativeObservationId, String(fixture.record.neuronId));
    assert.ok(assertMorphologySourceViewSceneBounds(document, viewFor(fixture).sceneBounds));
  }
});

test("saved public verification and geometry clones cannot replace current private byte proof", () => {
  const fixture = fixtures[0], document = receipt(fixture);
  assert.throws(() => captureMorphologySourceView(fixture.record, structuredClone(fixture.geometry), document.view, THREE.REVISION), /no runtime byte-verification receipt/);
  assert.throws(() => validateMorphologySourceViewReplay(fixture.record, structuredClone(fixture.geometry), document, THREE.REVISION), /no runtime byte-verification receipt/);
  assert.throws(() => validateMorphologySourceViewReplay(fixtures[1].record, fixtures[1].geometry, document, THREE.REVISION), /saved source identity/);
});

test("schema, source, units, unknown identity, source rights context and runtime verification scope fail closed", () => {
  const fixture = fixtures[0];
  for (const mutate of [
    doc => { doc.schemaVersion = "future"; }, doc => { doc.applicationVersion = "other"; }, doc => { doc.extra = true; },
    doc => { doc.source.geometrySha256 = "0".repeat(64); }, doc => { doc.source.nativeObservationId = "another"; },
    doc => { doc.source.nativeSourceContext = {}; }, doc => { doc.source.scientificUse = {}; },
    doc => { doc.sourceIdentity.specimen = { id: "invented" }; }, doc => { doc.sourceFrameDisclosure.sourceCoordinates.unit = "millimetre"; },
    doc => { doc.geometryVerification.rawSwcSha256 = "1".repeat(64); }, doc => { doc.geometryVerification.scope = "raw_swc_also_verified"; },
    doc => { doc.geometryVerification.verificationSequence = 0; }, doc => { doc.scientificScope.samePhysicalCellIdentity = true; },
    doc => { doc.scientificScope.registrationCount = 1; }, doc => { doc.scientificScope.pixelIdenticalAcrossViewportSizes = true; },
  ]) {
    const document = structuredClone(receipt(fixture)); mutate(document);
    assert.throws(() => validateMorphologySourceViewReplay(fixture.record, fixture.geometry, document, THREE.REVISION), /Morphology source view/);
  }
});

test("incompatible camera, renderer, clipping, inspection and source layers are rejected", () => {
  const fixture = fixtures[0];
  for (const mutate of [
    doc => { doc.view.camera.position[0] = NaN; }, doc => { doc.view.camera.target = [...doc.view.camera.position]; },
    doc => { doc.view.camera.up = [0, 0, 0]; }, doc => { doc.view.camera.quaternion = [0, 0, 0, 1]; },
    doc => { doc.view.camera.fov = 60; }, doc => { doc.view.camera.near *= 2; }, doc => { doc.view.camera.far *= 2; },
    doc => { doc.view.camera.aspect = 99; }, doc => { doc.view.viewport.drawingBufferWidth = 10; }, doc => { doc.view.viewport.pixelRatio = 2; },
    doc => { doc.view.renderer.revision = "184"; }, doc => { doc.view.clipping.globalPlanes = [{ normal: [1, 0, 0], constant: 0 }]; },
    doc => { doc.view.layers.sourceGeometryVisible = false; }, doc => { doc.view.layers.radiusSurfaceVisible = true; },
    doc => { doc.view.inspection.selectedNodeId = -9999; }, doc => { doc.view.inspection.selectedNodeId = null; },
    doc => { doc.view.runtimeBinding.neuronId += 1; }, doc => { doc.view.runtimeBinding.viewportRevision = 0; },
    doc => { doc.view.displayTransform = { ...doc.view.displayTransform, scaleViewerUnitPerMicrometre: 100 }; },
  ]) {
    const document = receipt(fixture); mutate(document);
    assert.throws(() => validateMorphologySourceViewReplay(fixture.record, fixture.geometry, document, THREE.REVISION), /Morphology source view/);
  }
});

test("planar observations retain diameter inputs while rejecting depth, radius surfaces and oblique poses", () => {
  const fixture = fixtures[1], document = receipt(fixture, { requestedMode: "radius" });
  assert.equal(document.view.requestedMode, "radius"); assert.equal(document.view.actualMode, "skeleton");
  for (const mutate of [doc => { doc.view.actualMode = "radius"; }, doc => { doc.view.sourcePlaneLocked = false; }, doc => { doc.view.camera.position[0] += 1; }]) {
    const changed = structuredClone(document); mutate(changed);
    assert.throws(() => validateMorphologySourceViewReplay(fixture.record, fixture.geometry, changed, THREE.REVISION), /source view/);
  }
});

test("radius-derived scenes and hidden topology use their newly computed bounds", () => {
  const fixture = fixtures[2], document = receipt(fixture, { requestedMode: "radius", actualMode: "radius", topology: false });
  assert.equal(document.view.layers.radiusSurfaceVisible, true);
  assert.equal(document.view.layers.topologyLandmarksVisible, false);
  assert.equal(assertMorphologySourceViewSceneBounds(document, viewFor(fixture, { requestedMode: "radius", actualMode: "radius", topology: false }).sceneBounds), true);
  const changedBounds = { ...document.view.sceneBounds, radius: document.view.sceneBounds.radius + .01 };
  assert.throws(() => assertMorphologySourceViewSceneBounds(document, changedBounds), /newly rendered source scene/);
});

test("restoration verifies actual camera and layers while allowing a changed viewport size and generation", () => {
  const document = receipt(), actual = structuredClone(document.view);
  actual.viewport = { cssWidth: 336, cssHeight: 400, drawingBufferWidth: 453, drawingBufferHeight: 540, pixelRatio: 1.35 };
  actual.camera.aspect = 336 / 400; actual.runtimeBinding.viewportRevision += 1;
  assert.equal(assertMorphologySourceViewAppliedPose(document, actual), true);
  actual.camera.position[0] += .01;
  assert.throws(() => assertMorphologySourceViewAppliedPose(document, actual), /actual restored camera/);
  const changedLayer = structuredClone(document.view); changedLayer.layers.topologyLandmarksVisible = false;
  assert.throws(() => assertMorphologySourceViewAppliedPose(document, changedLayer), /applied source layers/);
});

test("the same application version cannot disguise changed renderer or replay code bytes", async () => {
  const fixture = fixtures[0], document = receipt(fixture);
  assert.equal(document.rendererBuild.inputs.length, 40);
  for (const path of ['app/ResearchCollectionPage.tsx', 'app/ResearchRoutePage.tsx', 'app/SiteNavigation.tsx', 'app/site-navigation.ts', 'app/site-navigation.css', 'app/research-pages.css']) {
    assert.equal(document.rendererBuild.inputs.filter(row => row.path === path).length, 1, `Navigation input ${path} must be pinned exactly once`);
  }
  for (const path of ['app/source-list-roving-focus.js', 'app/source-list-roving-focus.d.ts', 'app/useSourceListRovingFocus.ts', 'app/source-list-keyboard.css']) {
    assert.equal(document.rendererBuild.inputs.filter(input => input.path === path).length, 1);
  }
  for (const input of document.rendererBuild.inputs) {
    const bytes = await readFile(new URL(`../${input.path}`, import.meta.url));
    assert.equal(bytes.byteLength, input.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), input.sha256);
  }
  for (const mutate of [doc => { doc.rendererBuild.inputs[0].sha256 = "0".repeat(64); }, doc => { doc.rendererBuild.inputs.pop(); }, doc => { doc.rendererBuild.scope = "version_number_only"; }]) {
    const changed = structuredClone(document); mutate(changed);
    assert.equal(changed.applicationVersion, document.applicationVersion);
    assert.throws(() => validateMorphologySourceViewReplay(fixture.record, fixture.geometry, changed, THREE.REVISION), /code build changed/);
  }
});

test("a source-labelled 3D observation without reported diameter cannot gain a radius surface through replay", () => {
  const fixture = fixtures[3], document = receipt(fixture, { requestedMode: "radius" });
  assert.equal(fixture.record.normalizedMetadata.dimensionality, "3D");
  assert.equal(fixture.record.normalizedMetadata.sourceDiameterAvailable, false);
  assert.equal(document.view.requestedMode, "radius"); assert.equal(document.view.actualMode, "skeleton");
  document.view.actualMode = "radius"; document.view.layers.radiusSurfaceVisible = true;
  assert.throws(() => validateMorphologySourceViewReplay(fixture.record, fixture.geometry, document, THREE.REVISION), /unsupported source radius or depth/);
});
