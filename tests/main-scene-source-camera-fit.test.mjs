import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { computeMainSceneSourceCameraFit, sameMainSceneCameraForCapture } from "../app/main-scene-source-camera-fit.js";
import { readVerifiedMainSceneMorphology, mainSceneMorphologyVerification } from "../app/main-scene-morphology-verification.js";
import { readVerifiedMainSceneAuxiliary, mainSceneAuxiliaryJson } from "../app/main-scene-auxiliary-verification.js";
import { createObservedSwcCenterlines, createObservedTopologyLandmarks, createRadiusDerivedSurface } from "../app/source-local-morphology-geometry.js";
import { NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS, validateNmo45718DatSwcCrosswalk } from "../app/neurolucida-dat-swc-crosswalk.js";

const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url)));
const census = await json("data/neuromorpho-census-main-scene-index-0.1.json");
const supplement = await json("data/supplementary-morphology-comparison-adapter-0.1.json");
const todd = await json("data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json");
const pv = await json("data/pv-independent-morphology-routes-0.1.json");
const colors = { 1: 0xffffff, 2: 0xaaaaaa, 3: 0x88bb99, 4: 0x77cc88, unknown: 0xccbb99 };
const aspects = [990 / 460, 1, 356 / 549, 320 / 844, 240 / 600];

function recordFor(row, supplementary = false) {
  const metadata = supplementary ? row.normalizedMetadata : row.sourceMetadata;
  const counts = supplementary ? row.morphometrics.computed : row.geometry;
  const geometry = { ...row.geometry, geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL", sourceFrame: metadata.sourceFrame,
    dimensionality: metadata.dimensionality, sourceDiameterAvailable: metadata.sourceDiameterAvailable,
    nodeCount: counts.nodeCount, segmentCount: counts.segmentCount };
  return { neuronId: row.neuronId, assetId: row.assetId, geometry,
    axon: { sourceDomain: metadata.domain, sourceType2NodeCount: counts.nodeTypeCounts["2"] ?? 0, completeAxon: false },
    modes: { observedSwc: { available: true }, radiusSurface: { available: geometry.dimensionality === "3D" && geometry.sourceDiameterAvailable }, internalStructure: { available: false } } };
}
const records = [...census.records.map(row => recordFor(row)), ...supplement.records.map(row => recordFor(row, true)),
  ...todd.routes.map(row => row.fidelityRecord), ...pv.routes.map(row => row.fidelityRecord)];
const recordById = id => records.find(row => row.neuronId === id);
const actualFetch = async url => {
  const bytes = await readFile(new URL(`../public${url}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const load = record => readVerifiedMainSceneMorphology(record, { fetchImpl: actualFetch });

test("live camera signatures tolerate only anchored finite pose round trips; projection stays exact", () => {
  const baseline = { kind: "PerspectiveCamera", position: [-6.481389471117807, 2, 12], target: [-5.203241968154907, 0, 0],
    up: [0, 1, 0], quaternion: [0, 0, 0, 1], fov: 35, zoom: 1, aspect: 845 / 641,
    near: 0.05, far: 250, filmGauge: 35, filmOffset: 0 };
  const original = structuredClone(baseline), adjacent = structuredClone(baseline);
  adjacent.position[0] = -6.481389471117806; adjacent.target[0] = -5.203241968154908;
  assert.equal(sameMainSceneCameraForCapture(baseline, adjacent), true);
  assert.deepEqual(baseline, original); assert.notDeepEqual(adjacent, baseline);
  for (const field of ["position", "target", "up", "quaternion"]) {
    const within = structuredClone(baseline); within[field][0] += 0.5e-12;
    assert.equal(sameMainSceneCameraForCapture(baseline, within), true, field);
    within[field][0] += 2e-12; assert.equal(sameMainSceneCameraForCapture(baseline, within), false, field);
    within[field][0] = NaN; assert.equal(sameMainSceneCameraForCapture(baseline, within), false, field);
    within[field] = Array(within[field].length); assert.equal(sameMainSceneCameraForCapture(baseline, within), false, `${field} sparse`);
  }
  for (const field of ["fov", "zoom", "aspect", "near", "far", "filmGauge", "filmOffset"]) {
    const changed = structuredClone(baseline); changed[field] += 1e-13;
    assert.equal(sameMainSceneCameraForCapture(baseline, changed), false, field);
  }
  for (const step of [1, 2, 3, 4]) {
    const cumulative = structuredClone(baseline); cumulative.target[1] = step * 0.4e-12;
    assert.equal(sameMainSceneCameraForCapture(baseline, cumulative), step < 3, `anchored step ${step}`);
  }
  for (const invalid of [null, {}, { ...baseline, kind: "OrthographicCamera" }, { ...baseline, extra: 0 }, { ...baseline, fov: Infinity }]) {
    assert.equal(sameMainSceneCameraForCapture(baseline, invalid), false);
  }
});

test("exact privately verified NMO45718 idle OrbitControls round trips cannot invalidate a capture", async () => {
  const record = recordById(45718), geometry = await load(record), root = currentSourceObject(record, geometry);
  const aspect = 845 / 641, camera = new THREE.PerspectiveCamera(35, aspect, 0.05, 250);
  const documentMock = { addEventListener() {}, removeEventListener() {} };
  const dom = { style: {}, clientWidth: 845, clientHeight: 641, ownerDocument: documentMock,
    addEventListener() {}, removeEventListener() {}, getRootNode: () => documentMock,
    getBoundingClientRect: () => ({ width: 845, height: 641, left: 0, top: 0 }) };
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = false; controls.minDistance = 4; controls.maxDistance = 100;
  const pose = computeMainSceneSourceCameraFit({ bounds: boundsFor(root), aspect, dimensionality: geometry.swc.dimensionality });
  camera.position.fromArray(pose.position); camera.up.fromArray(pose.up); controls.target.fromArray(pose.target); controls.update();
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  const current = () => ({ kind: "PerspectiveCamera", position: camera.position.toArray(), target: controls.target.toArray(),
    up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect,
    near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset });
  for (const state of ["default", "user"]) {
    if (state === "user") {
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      spherical.theta -= Math.PI / 36;
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); camera.lookAt(controls.target); controls.update();
    }
    const baseline = current(); let previous = JSON.stringify(baseline), rawChanges = 0;
    for (let frame = 0; frame < 3000; frame++) {
      assert.equal(controls.update(), false, state); const actual = current();
      const serialized = JSON.stringify(actual); rawChanges += serialized !== previous ? 1 : 0; previous = serialized;
      assert.equal(sameMainSceneCameraForCapture(baseline, actual), true, `${state} frame ${frame}`);
    }
    assert.ok(rawChanges > 0, `${state} must reproduce the original exact-float regression`);
  }
  controls.dispose(); dispose(root);
});

function currentSourceObject(record, geometry, mode = "observed_swc") {
  mainSceneMorphologyVerification(record, geometry);
  assert.ok(mode === "observed_swc" || mode === "radius_surface" && record.modes.radiusSurface.available,
    "Test must not construct a surface without the exact source authorization");
  const lane = new THREE.Group();
  lane.position.x = -4.4;
  lane.add(createObservedSwcCenterlines(geometry, { colors }), createObservedTopologyLandmarks(geometry, { markerSizeViewer: 0.052 }));
  if (mode === "radius_surface") lane.add(createRadiusDerivedSurface(geometry, { colors, radialSegments: 6 }));
  lane.updateMatrixWorld(true);
  return lane;
}
function boundsFor(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  return { minimum: box.min.toArray(), maximum: box.max.toArray() };
}
function cameraFor(fit, aspect) {
  const camera = new THREE.PerspectiveCamera(35, aspect, 0.05, 250);
  camera.position.fromArray(fit.position); camera.up.fromArray(fit.up);
  camera.lookAt(new THREE.Vector3().fromArray(fit.target)); camera.updateMatrixWorld(true);
  return camera;
}
function assertBoundsInside(bounds, camera, label) {
  for (const x of [bounds.minimum[0], bounds.maximum[0]])
    for (const y of [bounds.minimum[1], bounds.maximum[1]])
      for (const z of [bounds.minimum[2], bounds.maximum[2]]) {
        const projected = new THREE.Vector3(x, y, z).project(camera);
        assert.ok(projected.toArray().every(value => Number.isFinite(value) && Math.abs(value) <= 1 + 1e-7),
          `${label}: renderer-bound corner outside frustum ${projected.toArray()}`);
      }
}
function dispose(root) {
  root.traverse(object => {
    object.geometry?.dispose();
    for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) material.dispose();
  });
}

test("I51 actual PV DER camera reproduces 109 clipped source nodes before complete bounds fit", async () => {
  // This immutable historical DOM receipt supplies a regression pose, not a
  // claim that its previous renderer build is a current-build WebGL replay.
  const bytes = await readFile(new URL("../docs/qa/2026-10-04-implementation-51/actual-main-view-118824.json", import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "827fd65eb8d7d7eaba3b054c7672547d0bc783b3a6ac3bdc20f505612cb1d00e");
  const receipt = JSON.parse(bytes), record = recordById(118824), geometry = await load(record);
  assert.equal(receipt.source.neuronId, record.neuronId);
  assert.equal(receipt.source.sha256, record.geometry.sha256);
  assert.equal(receipt.view.sourceObject.mode, "radius_surface");
  const oldCamera = new THREE.PerspectiveCamera();
  const saved = receipt.view.camera;
  oldCamera.fov = saved.fov; oldCamera.aspect = saved.aspect; oldCamera.near = saved.near; oldCamera.far = saved.far;
  oldCamera.zoom = saved.zoom; oldCamera.filmGauge = saved.filmGauge; oldCamera.filmOffset = saved.filmOffset;
  oldCamera.position.fromArray(saved.position); oldCamera.up.fromArray(saved.up); oldCamera.lookAt(new THREE.Vector3().fromArray(saved.target));
  oldCamera.updateProjectionMatrix(); oldCamera.updateMatrixWorld(true);
  const outside = geometry.nodes.filter(node => {
    const point = new THREE.Vector3(...node.slice(2, 5).map((value, axis) =>
      Math.fround((value - geometry.displayTransform.originMicrometre[axis]) * geometry.displayTransform.scaleViewerUnitPerMicrometre)));
    point.x -= 4.4;
    return point.project(oldCamera).toArray().some(value => Math.abs(value) > 1);
  });
  assert.equal(outside.length, 109);
  const root = currentSourceObject(record, geometry, "radius_surface"), bounds = boundsFor(root);
  assert.deepEqual(bounds, receipt.view.sourceObject.bounds);
  const fit = computeMainSceneSourceCameraFit({ bounds, aspect: saved.aspect, dimensionality: geometry.swc.dimensionality });
  assertBoundsInside(bounds, cameraFor(fit, saved.aspect), "NMO 118824 current DER");
  dispose(root);
});

test("all 181 exact private sources and 108 authorized DER modes fit complete renderer bounds across layouts", async () => {
  let modes = 0, derived = 0, planar = 0, noDiameter = 0, smallest = Infinity, largest = 0;
  const memberships = { census: 0, supplementary: 0, todd_supplementary: 0, pv_supplementary: 0 };
  for (const record of records) {
    const geometry = await load(record), before = mainSceneMorphologyVerification(record, geometry);
    memberships[before.geometryVerification.membership]++;
    const canDerive = geometry.swc.dimensionality === "3D" && geometry.swc.sourceDiameterAvailable;
    assert.equal(record.modes.radiusSurface.available, canDerive);
    if (canDerive) derived++;
    if (geometry.swc.dimensionality === "2D") planar++;
    if (!geometry.swc.sourceDiameterAvailable) noDiameter++;
    for (const mode of ["observed_swc", ...(canDerive ? ["radius_surface"] : [])]) {
      modes++;
      const root = currentSourceObject(record, geometry, mode), bounds = boundsFor(root);
      for (const aspect of aspects) {
        const fit = computeMainSceneSourceCameraFit({ bounds, aspect, dimensionality: geometry.swc.dimensionality });
        assert.ok(fit.distance >= 4 && fit.distance <= 100);
        smallest = Math.min(smallest, fit.distance); largest = Math.max(largest, fit.distance);
        // Every actual renderer buffer lies within this AABB; a convex frustum
        // containing all eight corners contains those buffers, including DER radii.
        assertBoundsInside(bounds, cameraFor(fit, aspect), `NMO ${record.neuronId} ${mode} aspect ${aspect}`);
        if (geometry.swc.dimensionality === "2D") {
          assert.deepEqual(fit.position.slice(0, 2), fit.target.slice(0, 2));
          assert.ok(fit.position[2] > fit.target[2]);
        }
      }
      if (!canDerive) assert.equal(root.getObjectByName(`radius-derived-${record.neuronId}-source-local`), undefined);
      dispose(root);
    }
    assert.deepEqual(mainSceneMorphologyVerification(record, geometry), before);
    assert.equal(record.modes.internalStructure.available, false);
  }
  assert.deepEqual(memberships, { census: 142, supplementary: 7, todd_supplementary: 30, pv_supplementary: 2 });
  assert.deepEqual({ records: records.length, modes, derived, planar, noDiameter }, { records: 181, modes: 289, derived: 108, planar: 2, noDiameter: 71 });
  assert.ok(smallest > 11 && largest < 42, `actual default distance range ${smallest}–${largest}`);
});

test("exact NMO 118824 DER uses mesh radii beyond the centerline-only bounds", async () => {
  const record = recordById(118824), geometry = await load(record);
  const observed = currentSourceObject(record, geometry), derived = currentSourceObject(record, geometry, "radius_surface");
  const observedBounds = boundsFor(observed), derivedBounds = boundsFor(derived);
  assert.ok(derivedBounds.maximum[2] > observedBounds.maximum[2]);
  const observedFit = computeMainSceneSourceCameraFit({ bounds: observedBounds, aspect: 356 / 549, dimensionality: "3D" });
  const derivedFit = computeMainSceneSourceCameraFit({ bounds: derivedBounds, aspect: 356 / 549, dimensionality: "3D" });
  assert.ok(derivedFit.radius > observedFit.radius);
  assert.notEqual(derivedFit.target[2], observedFit.target[2]);
  assertBoundsInside(derivedBounds, cameraFor(derivedFit, 356 / 549), "NMO 118824 full DER extent");
  dispose(observed); dispose(derived);
});

test("verified NMO 45718 mapped DAT contours retain all 252 rendered vertices within union bounds", async () => {
  const record = recordById(45718), geometry = await load(record);
  const paths = ["nativeContours", "standardizedGeometry"].map(key => NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[key].path.replace(/^public/, ""));
  const tokens = await Promise.all(paths.map(path => readVerifiedMainSceneAuxiliary(path, { fetchImpl: actualFetch })));
  const contours = mainSceneAuxiliaryJson(tokens[0]), standardized = mainSceneAuxiliaryJson(tokens[1]);
  const contract = await json("data/neurolucida-dat-swc-crosswalk-0.1.json");
  const crosswalk = validateNmo45718DatSwcCrosswalk(contract, contours, standardized);
  assert.equal(crosswalk.somaContours.length, 7);
  const points = crosswalk.somaContours.flatMap(contour => contour.points.map(point =>
    new THREE.Vector3(...point.slice(0, 3).map((value, axis) =>
      Math.fround((value - geometry.displayTransform.originMicrometre[axis]) * geometry.displayTransform.scaleViewerUnitPerMicrometre)))
      .add(new THREE.Vector3(-4.4, 0, 0))));
  assert.equal(points.length, 252);
  for (const mode of ["observed_swc", "radius_surface"]) {
    const root = currentSourceObject(record, geometry, mode), morphologyBounds = boundsFor(root);
    const union = new THREE.Box3(new THREE.Vector3().fromArray(morphologyBounds.minimum), new THREE.Vector3().fromArray(morphologyBounds.maximum));
    union.union(new THREE.Box3().setFromPoints(points));
    const bounds = { minimum: union.min.toArray(), maximum: union.max.toArray() };
    for (const aspect of aspects) {
      const camera = cameraFor(computeMainSceneSourceCameraFit({ bounds, aspect, dimensionality: "3D" }), aspect);
      assertBoundsInside(bounds, camera, `NMO 45718 mapped DAT ${mode}`);
      for (const point of points) assert.ok(point.clone().project(camera).toArray().every(value => Math.abs(value) <= 1 + 1e-7));
    }
    dispose(root);
  }
  const changed = structuredClone(contract); changed.transform.a += 0.1;
  assert.throws(() => validateNmo45718DatSwcCrosswalk(changed, contours, standardized), /transform receipt/);
  assert.equal(crosswalk.boundaries.atlasRegistrationCount, 0);
  assert.equal(crosswalk.boundaries.internalStructureObjectCount, 0);
});

test("camera fit does not provide a private proof or grant No Diameter and planar sources a DER mode", async () => {
  for (const id of [170034, 194468, 194469]) {
    const record = recordById(id), geometry = await load(record), proof = mainSceneMorphologyVerification(record, geometry);
    assert.equal(record.modes.radiusSurface.available, false);
    const root = currentSourceObject(record, geometry), bounds = boundsFor(root);
    computeMainSceneSourceCameraFit({ bounds, aspect: 356 / 549, dimensionality: geometry.swc.dimensionality });
    assert.deepEqual(mainSceneMorphologyVerification(record, geometry), proof);
    assert.throws(() => mainSceneMorphologyVerification(record, structuredClone(geometry)), /no current main-scene runtime proof/);
    const changed = structuredClone(record); changed.modes.radiusSurface.available = true;
    await assert.rejects(() => load(changed), /surface or internal-structure authority changed/);
    dispose(root);
  }
});

test("viewer translation shifts pose without modifying source bounds or introducing a shared scale", () => {
  const bounds = { minimum: [-2, -1, -0.5], maximum: [2, 3, 0.5] }, original = structuredClone(bounds);
  const shifted = { minimum: bounds.minimum.map((value, axis) => value + [17, -12, 4][axis]), maximum: bounds.maximum.map((value, axis) => value + [17, -12, 4][axis]) };
  const first = computeMainSceneSourceCameraFit({ bounds, aspect: 1, dimensionality: "3D" });
  const second = computeMainSceneSourceCameraFit({ bounds: shifted, aspect: 1, dimensionality: "3D" });
  assert.deepEqual(bounds, original); assert.equal(first.distance, second.distance); assert.equal(first.radius, second.radius);
  for (let axis = 0; axis < 3; axis++) {
    assert.equal(second.target[axis] - first.target[axis], [17, -12, 4][axis]);
    assert.ok(Math.abs(second.position[axis] - first.position[axis] - [17, -12, 4][axis]) < 1e-12);
  }
  assert.deepEqual(Object.keys(first).sort(), ["distance", "position", "radius", "target", "up"]);
});

test("small finite bounds use the orbit minimum while unsupported fits fail instead of silently clipping", () => {
  const bounds = { minimum: [-0.001, -0.001, 0], maximum: [0.001, 0.001, 0] };
  const fit = computeMainSceneSourceCameraFit({ bounds, aspect: 1, dimensionality: "2D" });
  assert.equal(fit.distance, 4); assertBoundsInside(bounds, cameraFor(fit, 1), "small actual bounds");
  assert.throws(() => computeMainSceneSourceCameraFit({ bounds, aspect: 0.000001, dimensionality: "2D" }), /fixed orbit range/);
  assert.throws(() => computeMainSceneSourceCameraFit({ bounds: { minimum: [-100, -100, -100], maximum: [100, 100, 100] }, aspect: 1, dimensionality: "3D" }), /fixed orbit range/);
  assert.throws(() => computeMainSceneSourceCameraFit({ bounds: { minimum: [1e300, 0, 0], maximum: [1e300, 1, 1] },
    aspect: 1, dimensionality: "3D", direction: [1, 0, 0] }), /world-coordinate precision/);
});

test("explicit fit preserves a valid camera direction and up without locking the main scene's planar orbit", () => {
  const bounds = { minimum: [-2, -1, -0.5], maximum: [2, 3, 0.5] };
  const direction = [1, -2, 3], up = [0.5, 1, 0.5];
  for (const dimensionality of ["2D", "3D"]) {
    const fit = computeMainSceneSourceCameraFit({ bounds, aspect: 356 / 549, dimensionality, direction, up });
    const actualDirection = new THREE.Vector3().fromArray(fit.position).sub(new THREE.Vector3().fromArray(fit.target)).normalize();
    assert.ok(actualDirection.distanceTo(new THREE.Vector3().fromArray(direction).normalize()) < 1e-12);
    assert.ok(new THREE.Vector3().fromArray(fit.up).distanceTo(new THREE.Vector3().fromArray(up).normalize()) < 1e-12);
    assertBoundsInside(bounds, cameraFor(fit, 356 / 549), `current camera direction ${dimensionality}`);
  }
  assert.deepEqual(direction, [1, -2, 3]); assert.deepEqual(up, [0.5, 1, 0.5]);
});

test("invalid, zero or collinear optional direction/up vectors cannot create a camera pose", () => {
  const base = { bounds: { minimum: [-1, -1, -1], maximum: [1, 1, 1] }, aspect: 1, dimensionality: "3D" };
  for (const options of [
    { direction: null }, { direction: [1, 2] }, { direction: [0, 0, 0] }, { direction: [NaN, 1, 0] },
    { direction: [0, Infinity, 1] }, { up: null }, { up: [1, 2] }, { up: [0, 0, 0] }, { up: [0, 1, NaN] },
    { direction: [0, 1, 0], up: [0, 2, 0] }, { direction: [0, 1, 0], up: [0, -1, 0] },
    { direction: [0, 1, 0], up: [1e-15, 1, 0] },
  ]) assert.throws(() => computeMainSceneSourceCameraFit({ ...base, ...options }), /Main scene camera fit/);
});

test("invalid, missing, reversed, zero and non-finite bounds are rejected without proxy geometry", () => {
  const valid = { bounds: { minimum: [-1, -1, -1], maximum: [1, 1, 1] }, aspect: 1, dimensionality: "3D" };
  for (const mutate of [
    input => { input.bounds = null; }, input => { delete input.bounds.minimum; },
    input => { input.bounds.minimum = [0, 0]; }, input => { input.bounds.maximum = [1, 1, 1, 1]; },
    input => { delete input.bounds.minimum[2]; input.bounds.minimum.extra = 1; },
    input => { input.bounds.minimum[1] = NaN; }, input => { input.bounds.maximum[1] = Infinity; },
    input => { input.bounds.minimum[0] = 2; }, input => { input.bounds.maximum = [...input.bounds.minimum]; },
    input => { input.bounds.minimum[0] = -Number.MAX_VALUE; input.bounds.maximum[0] = Number.MAX_VALUE; },
    input => { input.aspect = 0; }, input => { input.aspect = -1; }, input => { input.aspect = NaN; },
    input => { input.aspect = Infinity; }, input => { input.dimensionality = "unknown"; },
  ]) {
    const input = structuredClone(valid); mutate(input);
    assert.throws(() => computeMainSceneSourceCameraFit(input), /Main scene camera fit/);
  }
});
