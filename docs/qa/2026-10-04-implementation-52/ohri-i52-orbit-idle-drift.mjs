import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '/private/tmp/ohri-i51-verification/node_modules/three/build/three.module.js';
import { OrbitControls } from '/private/tmp/ohri-i51-verification/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { readVerifiedMainSceneMorphology, mainSceneMorphologyVerification } from '/private/tmp/ohri-i51-verification/app/main-scene-morphology-verification.js';
import { createObservedSwcCenterlines, createObservedTopologyLandmarks } from '/private/tmp/ohri-i51-verification/app/source-local-morphology-geometry.js';
import { computeMainSceneSourceCameraFit, sameMainSceneCameraForCapture } from '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/app/main-scene-source-camera-fit.js';

const rootPath = '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const data = JSON.parse(fs.readFileSync(rootPath + '/data/supplementary-morphology-comparison-adapter-0.1.json'));
const row = data.records.find(record => record.neuronId === 45718), metadata = row.normalizedMetadata, counts = row.morphometrics.computed;
const geometryRecord = { ...row.geometry, geometryStatus: 'OBS_STANDARDIZED_SOURCE_LOCAL', sourceFrame: metadata.sourceFrame,
  dimensionality: metadata.dimensionality, sourceDiameterAvailable: metadata.sourceDiameterAvailable, nodeCount: counts.nodeCount, segmentCount: counts.segmentCount };
const record = { neuronId: row.neuronId, assetId: row.assetId, geometry: geometryRecord,
  axon: { sourceDomain: metadata.domain, sourceType2NodeCount: counts.nodeTypeCounts['2'] ?? 0, completeAxon: false },
  modes: { observedSwc: { available: true }, radiusSurface: { available: geometryRecord.dimensionality === '3D' && geometryRecord.sourceDiameterAvailable }, internalStructure: { available: false } } };
const geometry = await readVerifiedMainSceneMorphology(record, { forceReload: true, fetchImpl: async url => {
  const bytes = fs.readFileSync(rootPath + '/public' + url);
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) };
} });
const proof = mainSceneMorphologyVerification(record, geometry);
const object = new THREE.Group(); object.position.x = -4.4;
object.add(createObservedSwcCenterlines(geometry, { colors: {} }), createObservedTopologyLandmarks(geometry, { markerSizeViewer: 0.052 }));
object.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(object);
const bounds = { minimum: box.min.toArray(), maximum: box.max.toArray() }, aspect = 845 / 641;

// Sufficient actual OrbitControls DOM surface; no canvas rendering is claimed.
const documentMock = { addEventListener() {}, removeEventListener() {} };
const dom = { style: {}, clientWidth: 845, clientHeight: 641, ownerDocument: documentMock,
  addEventListener() {}, removeEventListener() {}, getRootNode: () => documentMock,
  getBoundingClientRect: () => ({ width: 845, height: 641, left: 0, top: 0 }) };
const camera = new THREE.PerspectiveCamera(35, aspect, 0.05, 250); camera.position.set(11, 8, 26);
const controls = new OrbitControls(camera, dom);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 4; controls.maxDistance = 100;
const pose = computeMainSceneSourceCameraFit({ bounds, aspect, dimensionality: geometry.swc.dimensionality });
controls.enableDamping = false; controls.update();
camera.position.fromArray(pose.position); camera.up.fromArray(pose.up); controls.target.fromArray(pose.target);
controls.update(); controls.enableDamping = true; camera.updateMatrixWorld(true);

const cameraData = () => ({ kind: 'PerspectiveCamera', position: camera.position.toArray(), target: controls.target.toArray(),
  up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect,
  near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset });
const orderedFloat = number => {
  const bytes = new ArrayBuffer(8), view = new DataView(bytes); view.setFloat64(0, number); const bits = view.getBigUint64(0);
  return bits >> 63n ? ~bits & 0xffffffffffffffffn : bits | 0x8000000000000000n;
};
const ulps = (first, second) => { const a = orderedFloat(first), b = orderedFloat(second); return String(a > b ? a - b : b - a); };

function reproduce(label, frames) {
  let previous = cameraData(); const baseline = previous;
  let rawChanges = 0, reportedChanges = 0, tolerantChanges = 0, maxDelta = 0, maxPerStep = 0;
  const changedFields = new Set(), samples = [];
  for (let frame = 1; frame <= frames; frame++) {
    const changed = controls.update(); camera.updateMatrixWorld(true); const current = cameraData();
    if (changed) reportedChanges++;
    if (!sameMainSceneCameraForCapture(baseline, current)) tolerantChanges++;
    if (JSON.stringify(current) !== JSON.stringify(previous)) {
      rawChanges++; let perStep = 0; const differences = {};
      for (const key of ['position', 'target', 'up', 'quaternion']) for (let axis = 0; axis < current[key].length; axis++) {
        const delta = Math.abs(current[key][axis] - previous[key][axis]);
        maxDelta = Math.max(maxDelta, Math.abs(current[key][axis] - baseline[key][axis])); perStep = Math.max(perStep, delta);
        if (delta) { changedFields.add(key); differences[key + '[' + axis + ']'] = { before: previous[key][axis], after: current[key][axis], delta, ulps: ulps(previous[key][axis], current[key][axis]) }; }
      }
      maxPerStep = Math.max(maxPerStep, perStep);
      if (samples.length < 8) samples.push({ frame, controlsReportedChange: changed, differences });
    }
    previous = current;
  }
  assert.equal(rawChanges, frames, 'The exact current source idle-fingerprint regression was not reproduced');
  assert.equal(reportedChanges, 0); assert.equal(tolerantChanges, 0);
  assert.ok(maxDelta < 1e-12);
  return { label, frames, rawJsonChanges: rawChanges, controlsReportedChanges: reportedChanges,
    anchoredTolerantChanges: tolerantChanges, changedFields: [...changedFields], maxDeltaFromBaseline: maxDelta,
    maxPerStep, baseline, last: previous, samples };
}
const results = [reproduce('default fit idle', 3000)];
// Exact current SceneCanvas ArrowLeft implementation, followed by idle RAF updates.
const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
spherical.theta -= Math.PI / 36;
camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); camera.lookAt(controls.target); controls.update();
results.push(reproduce('one exact main ArrowLeft then idle', 3000));
const output = { scope: 'deterministic actual Three/OrbitControls update with current private NMO45718 geometry; not live WebGL evidence',
  rendererRevision: THREE.REVISION, sourceSha256: proof.geometryVerification.sha256, bounds,
  viewport: { width: 845, height: 641, aspect }, cameraVectorAbsoluteTolerance: 1e-12, results };
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
controls.dispose();
object.traverse(drawable => { drawable.geometry?.dispose();
  (Array.isArray(drawable.material) ? drawable.material : drawable.material ? [drawable.material] : []).forEach(material => material.dispose()); });
