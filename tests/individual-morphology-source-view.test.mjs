import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as THREE from "three";
import { readVerifiedMorphologyGeometry, verifiedMorphologyGeometryUrl } from "../app/morphology-geometry-verification.js";
import { createObservedSwcCenterlines, createObservedTopologyLandmarks, createRadiusDerivedSurface } from "../app/source-local-morphology-geometry.js";
import { captureIndividualMorphologySourceView, validateIndividualMorphologySourceViewReplay, validateMorphologySourceViewReplay, assertMorphologySourceViewSceneBounds, assertMorphologySourceViewAppliedPose } from "../app/morphology-source-view.js";
const census = JSON.parse(await readFile(new URL("../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", import.meta.url)));
const frames = JSON.parse(await readFile(new URL("../data/morphology-source-frame-disclosure-0.1.json", import.meta.url)));
const fixtures = [];
for (const record of census.records) {
  record.comparisonMembership = { collection: "census", censusContribution: 1, supplementaryContribution: 0, routeId: null, routeContractPath: null, routeContractSha256: null, routeAssetManifestPath: null, routeAssetManifestSha256: null };
  const frame = frames.records.find(row => row.neuronId === record.neuronId);
  const bytes = await readFile(new URL(`../public${verifiedMorphologyGeometryUrl(record, frame)}`, import.meta.url));
  const loads = [];
  const load = options => readVerifiedMorphologyGeometry(record, frame, { fetchImpl: async (_url, init) => { loads.push(init.cache); return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }; }, ...options });
  fixtures.push({ record, load, loads, geometry: await load() });
}
const find = id => fixtures.find(row => row.record.neuronId === id);
// Source-backed THREE scene and camera fixtures. Live WebGL behavior is separately checked in the browser.
function viewFor(fixture, { mode = "skeleton", topology = true, hidden = [], requestedMode = mode } = {}) {
  const { geometry, record } = fixture;
  const colors = { 1: 0xffffff, 2: 0x99aaaa, 3: 0x88bb99, 4: 0x77cc88 };
  const root = new THREE.Group(); root.add(createObservedSwcCenterlines(geometry, { colors }));
  if (mode === "radius") { root.add(createRadiusDerivedSurface(geometry, { colors })); root.add(createObservedSwcCenterlines(geometry, { colors })); }
  if (topology) root.add(createObservedTopologyLandmarks(geometry));
  const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  const camera = new THREE.PerspectiveCamera(38, 640 / 400, Math.max(sphere.radius / 1000, .001), Math.max(sphere.radius * 50, 100));
  const target = sphere.center.clone();
  camera.position.copy(target).addScaledVector(record.normalizedMetadata.dimensionality === "2D" ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1.45, .9, 1.65).normalize(), sphere.radius * 4);
  camera.lookAt(target);
  const visibleSourceTypes = [...new Set(geometry.nodes.map(node => node[1]))].filter(type => !hidden.includes(type)).sort((a, b) => a - b);
  const view = {
    status: "rendered", runtimeBinding: { neuronId: record.neuronId, geometrySha256: record.geometry.sha256, viewportInstanceId: "individual-runtime-17", viewportRevision: 2 },
    requestedMode, actualMode: mode, sourcePlaneLocked: record.normalizedMetadata.dimensionality === "2D",
    camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset },
    viewport: { cssWidth: 640, cssHeight: 400, drawingBufferWidth: 960, drawingBufferHeight: 600, pixelRatio: 1.5 },
    renderer: { engine: "THREE", revision: THREE.REVISION, type: "WebGLRenderer", outputColorSpace: "srgb", toneMapping: 0, alpha: true, antialias: true },
    clipping: { globalPlanes: [], localClippingEnabled: false },
    layers: { sourceGeometryVisible: true, centerlinesVisible: true, radiusSurfaceVisible: mode === "radius", topologyLandmarksVisible: topology, sourceAxesVisible: true, visibleSourceTypes,
      centerlineSourceTypes: [...new Set(geometry.segments.map(segment => segment[8]))].filter(type => visibleSourceTypes.includes(type)).sort((a, b) => a - b) },
    inspection: { selectedNodeId: geometry.nodes.at(-1)[0], contextDimmed: true, overlayAuthority: "exact_swc_parent_path_and_descendant_edges" },
    sceneBounds: { center: sphere.center.toArray(), radius: sphere.radius }, displayTransform: geometry.displayTransform,
  };
  root.traverse(object => { object.geometry?.dispose(); const materials = object.material ? Array.isArray(object.material) ? object.material : [object.material] : []; materials.forEach(material => material.dispose()); });
  return view;
}
const receipt = (fixture = find(108974), options) => captureIndividualMorphologySourceView(fixture.record, fixture.geometry, viewFor(fixture, options), THREE.REVISION);

test("all 142 exact individual sources retain their private byte proof, native frame and strict individual renderer profile", async () => {
  assert.equal(fixtures.length, 142);
  let radius = 0, planar = 0, noDiameter = 0;
  for (const fixture of fixtures) {
    const metadata = fixture.record.normalizedMetadata;
    const mode = metadata.dimensionality === "3D" && metadata.sourceDiameterAvailable ? "radius" : "skeleton";
    if (mode === "radius") radius++; if (metadata.dimensionality === "2D") planar++; if (!metadata.sourceDiameterAvailable) noDiameter++;
    const document = receipt(fixture, { mode });
    assert.equal(document.documentType, "individual_morphology_view_receipt");
    assert.deepEqual(validateIndividualMorphologySourceViewReplay(fixture.record, fixture.geometry, JSON.parse(JSON.stringify(document)), THREE.REVISION), document.view);
    assert.equal(document.geometryVerification.scope, "standardized_geometry_bytes_only_raw_swc_hash_declared");
    assert.equal(document.scientificScope.samePhysicalCellIdentity, false);
    assert.equal(document.scientificScope.registrationCount, 0);
    assert.equal(document.sourceFrameDisclosure.neuronId, fixture.record.neuronId);
  }
  assert.deepEqual({ radius, planar, noDiameter }, { radius: 92, planar: 2, noDiameter: 48 });
});

test("individual hidden types and topology survive a no-store source recheck with a new immutable payload", async () => {
  const fixture = find(108974), document = receipt(fixture, { hidden: [3], topology: false });
  const fresh = await fixture.load({ forceReload: true });
  assert.notEqual(fresh, fixture.geometry); assert.equal(fixture.loads.at(-1), "no-store");
  assert.equal(document.view.layers.visibleSourceTypes.includes(3), false);
  assert.equal(document.view.layers.centerlineSourceTypes.includes(3), false);
  assert.deepEqual(validateIndividualMorphologySourceViewReplay(fixture.record, fresh, document, THREE.REVISION), document.view);
  assert.equal(assertMorphologySourceViewSceneBounds(document, viewFor(fixture, { topology: false }).sceneBounds), true);
});

test("individual source and renderer cannot be replaced by public clones, comparison receipts or another observation", () => {
  const fixture = find(108974), document = receipt(fixture);
  assert.throws(() => captureIndividualMorphologySourceView(fixture.record, structuredClone(fixture.geometry), document.view, THREE.REVISION), /runtime byte-verification/);
  assert.throws(() => validateIndividualMorphologySourceViewReplay(find(194469).record, find(194469).geometry, document, THREE.REVISION), /saved source identity/);
  assert.throws(() => validateMorphologySourceViewReplay(fixture.record, fixture.geometry, document, THREE.REVISION), /schema or application/);
  const changed = structuredClone(document); changed.documentType = "source_local_morphology_view_receipt";
  assert.throws(() => validateIndividualMorphologySourceViewReplay(fixture.record, fixture.geometry, changed, THREE.REVISION), /schema or application/);
  const wrongMembership = structuredClone(fixture.record); wrongMembership.comparisonMembership.collection = "supplementary";
  assert.throws(() => validateIndividualMorphologySourceViewReplay(wrongMembership, fixture.geometry, document, THREE.REVISION), /frozen census/);
});

test("invented source types, unsupported clips, fake camera and changed renderer code fail closed", () => {
  const fixture = find(108974);
  for (const mutate of [
    doc => doc.view.layers.visibleSourceTypes.push(999), doc => doc.view.layers.visibleSourceTypes.reverse(),
    doc => doc.view.layers.visibleSourceTypes.push(doc.view.layers.visibleSourceTypes[0]), doc => doc.view.layers.centerlineSourceTypes.pop(),
    doc => { doc.view.layers.extra = true; }, doc => { doc.view.camera.far *= 2; }, doc => { doc.view.camera.quaternion = [0, 0, 0, 1]; },
    doc => { doc.view.clipping.globalPlanes = [{ normal: [1, 0, 0], constant: 0 }]; }, doc => { doc.view.viewport.pixelRatio = 2; },
    doc => { doc.rendererBuild.inputs.at(-1).sha256 = "0".repeat(64); }, doc => { doc.geometryVerification.scope = "raw_swc_verified"; },
    doc => { doc.scientificScope.registrationCount = 1; }, doc => { doc.view.inspection.selectedNodeId = -123; },
  ]) { const document = receipt(fixture); mutate(document); assert.throws(() => validateIndividualMorphologySourceViewReplay(fixture.record, fixture.geometry, document, THREE.REVISION), /Morphology source view/); }
});

test("both planar diameter sources and a no-diameter 3D source reject radius or inferred depth through restoration", () => {
  for (const id of [194468, 194469, 242822]) {
    const fixture = find(id), document = receipt(fixture, { requestedMode: "radius" });
    assert.equal(document.view.actualMode, "skeleton");
    document.view.actualMode = "radius"; document.view.layers.radiusSurfaceVisible = true;
    assert.throws(() => validateIndividualMorphologySourceViewReplay(fixture.record, fixture.geometry, document, THREE.REVISION), /unsupported source radius or depth/);
  }
  const fixture = find(194469), document = receipt(fixture); document.view.camera.position[0] += 1;
  assert.throws(() => validateIndividualMorphologySourceViewReplay(fixture.record, fixture.geometry, document, THREE.REVISION), /camera quaternion|planar source/);
});

test("actual applied pose accepts current layout dimensions but verifies source filters, inspection, bounds and camera", () => {
  const document = receipt(find(108974), { hidden: [3], topology: false });
  const actual = structuredClone(document.view); actual.viewport = { cssWidth: 306, cssHeight: 400, drawingBufferWidth: 459, drawingBufferHeight: 600, pixelRatio: 1.5 };
  actual.camera.aspect = 306 / 400; actual.runtimeBinding.viewportRevision++;
  assert.equal(assertMorphologySourceViewAppliedPose(document, actual), true);
  for (const mutate of [view => view.layers.visibleSourceTypes.push(3), view => { view.camera.position[0] += .01; }, view => { view.inspection.contextDimmed = false; }, view => { view.sceneBounds.radius += .01; }]) {
    const changed = structuredClone(actual); mutate(changed); assert.throws(() => assertMorphologySourceViewAppliedPose(document, changed), /source layers|actual restored camera|newly rendered source scene/);
  }
});
