/**
 * Additional source-camera action QA for existing actual-main-view-*.json files.
 * No browser interaction, new source data or WebGL/pixel claim is produced.
 * Repeated explicit actions:
 *   --home result.json
 *   --default result.json
 *   --fit before.json:after.json
 *   --slice before.json:after.json
 *   --planar-reveal hidden.json:visible.json
 *   --dat-toggle before.json:after.json
 *   --mode-change before.json:after.json
 *   --retained first-read.json:later-read.json
 * Also: --root PATH --verification-root PATH --receipt-dir PATH --out PATH
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const defaultRoot = '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const options = { root: defaultRoot, verificationRoot: '/private/tmp/ohri-i51-verification',
  receiptDir: defaultRoot + '/docs/qa/2026-10-04-implementation-52', out: null, actions: [] };
const singleFlags = new Set(['--home', '--default']);
const pairFlags = new Set(['--fit', '--slice', '--planar-reveal', '--dat-toggle', '--mode-change', '--retained']);
const pathFlags = new Map([['--root', 'root'], ['--verification-root', 'verificationRoot'], ['--receipt-dir', 'receiptDir'], ['--out', 'out']]);
for (let index = 2; index < process.argv.length; index++) {
  const flag = process.argv[index];
  if (flag === '--help') {
    console.log('Usage: node /private/tmp/ohri-i52-camera-action-replay.mjs [--root PATH] [--verification-root PATH] [--receipt-dir PATH] [--out PATH] --home result.json --fit before.json:after.json --slice before.json:after.json --planar-reveal hidden.json:visible.json --dat-toggle before.json:after.json --mode-change before.json:after.json --retained first.json:later.json');
    process.exit(0);
  }
  assert.ok(singleFlags.has(flag) || pairFlags.has(flag) || pathFlags.has(flag), `Unsupported flag ${flag}`);
  const value = process.argv[++index]; assert.ok(value && !value.startsWith('--'), `${flag} needs a value`);
  if (pathFlags.has(flag)) options[pathFlags.get(flag)] = path.resolve(value);
  else {
    const files = value.split(':'); assert.equal(files.length, singleFlags.has(flag) ? 1 : 2, `${flag}: wrong number of files`);
    assert.ok(files.every(name => name === path.basename(name) && /^actual-main-view-.+\.json$/.test(name)), `${flag}: use actual capture basenames`);
    options.actions.push({ action: flag.slice(2), files });
  }
}
assert.ok(options.actions.length > 0, 'Specify captured camera actions; no scenario is inferred from filenames');

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = (root, relative) => {
  assert.ok(!path.isAbsolute(relative) && relative.split(/[\\/]/).every(piece => piece && piece !== '..'), `Unsafe source path ${relative}`);
  return fs.readFileSync(path.join(root, relative));
};
const json = relative => JSON.parse(read(options.root, relative));
const loadModule = relative => import(pathToFileURL(path.join(options.verificationRoot, relative)).href);
const [THREE, producer, sourceView, auxiliary, geometryTools, crosswalkTools] = await Promise.all([
  loadModule('node_modules/three/build/three.module.js'), loadModule('app/main-scene-morphology-verification.js'),
  loadModule('app/main-scene-source-view.js'), loadModule('app/main-scene-auxiliary-verification.js'),
  loadModule('app/source-local-morphology-geometry.js'), loadModule('app/neurolucida-dat-swc-crosswalk.js'),
]);
const census = json('data/neuromorpho-census-main-scene-index-0.1.json');
const supplement = json('data/supplementary-morphology-comparison-adapter-0.1.json');
const todd = json('data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json');
const pv = json('data/pv-independent-morphology-routes-0.1.json');
function recordFor(row, supplementary = false) {
  const metadata = supplementary ? row.normalizedMetadata : row.sourceMetadata;
  const counts = supplementary ? row.morphometrics.computed : row.geometry;
  const geometry = { path: row.geometry.path, bytes: row.geometry.bytes, sha256: row.geometry.sha256, rawSwcSha256: row.geometry.rawSwcSha256, geometryStatus: 'OBS_STANDARDIZED_SOURCE_LOCAL', sourceFrame: metadata.sourceFrame,
    dimensionality: metadata.dimensionality, sourceDiameterAvailable: metadata.sourceDiameterAvailable,
    nodeCount: counts.nodeCount, segmentCount: counts.segmentCount };
  return { neuronId: row.neuronId, assetId: row.assetId, geometry,
    axon: { sourceDomain: metadata.domain, sourceType2NodeCount: counts.nodeTypeCounts['2'] ?? 0, completeAxon: false },
    modes: { observedSwc: { available: true }, radiusSurface: { available: geometry.dimensionality === '3D' && geometry.sourceDiameterAvailable }, internalStructure: { available: false } } };
}
const records = [...census.records.map(row => recordFor(row)), ...supplement.records.map(row => recordFor(row, true)),
  ...todd.routes.map(row => row.fidelityRecord), ...pv.routes.map(row => row.fidelityRecord)];
assert.equal(records.length, 181); const byId = new Map(records.map(record => [record.neuronId, record]));
const canonicalAux = receipt => { const copy = { ...receipt }; delete copy.verificationSequence; return copy; };
const colours = { 1: 0xffffff, 2: 0xaaaaaa, 3: 0x88bb99, 4: 0x77cc88, unknown: 0xccbb99 };
const verified = new Map();
const output = { scope: 'independent private source/build replay and explicit camera-action comparisons of actual captured JSON',
  root: options.root, verificationRoot: options.verificationRoot, receiptDir: options.receiptDir,
  rosterCount: records.length, rendererRevision: THREE.REVISION, pixelComparisonPerformed: false,
  capturedNumbersModified: false, receipts: [], actions: [], errors: [], mismatchCount: 0 };
function checkPhysicalFile(relative, receipt) {
  for (const root of new Set([options.root, options.verificationRoot])) {
    const bytes = read(root, relative); assert.equal(bytes.length, receipt.bytes, `${relative}: byte count differs`);
    assert.equal(hash(bytes), receipt.sha256, `${relative}: checksum differs`);
  }
}
const actualFetch = async (url, request) => {
  assert.equal(request.cache, 'no-store'); const bytes = read(options.root, `public${url}`);
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) };
};
const numericClose = (first, second, epsilon = 1e-8) => Number.isFinite(first) && Number.isFinite(second) && Math.abs(first - second) <= epsilon;
function closeVector(first, second, label, epsilon = 1e-8) {
  assert.equal(first.length, second.length, `${label}: shape differs`);
  assert.ok(first.every((value, index) => numericClose(value, second[index], epsilon)), `${label}: numeric values differ`);
}
async function verify(name) {
  if (verified.has(name)) return verified.get(name);
  const bytes = fs.readFileSync(path.join(options.receiptDir, name)), document = JSON.parse(bytes);
  const record = byId.get(document.source?.neuronId); assert.ok(record, `${name}: source is absent from the exact roster`);
  const geometry = await producer.readVerifiedMainSceneMorphology(record, { fetchImpl: actualFetch, forceReload: true });
  producer.mainSceneMorphologyVerification(record, geometry);
  sourceView.validateMainSceneSourceViewReplay(record, geometry, document, THREE.REVISION);
  for (const pin of document.rendererBuild.inputs) checkPhysicalFile(pin.path, pin);
  checkPhysicalFile(`public${document.source.path}`, document.source);
  const tokens = [];
  for (const pin of document.auxiliaryAssets) {
    checkPhysicalFile(`public${pin.path}`, pin);
    const token = await auxiliary.readVerifiedMainSceneAuxiliary(pin.path, { fetchImpl: actualFetch }); tokens.push(token);
    assert.deepEqual(canonicalAux(auxiliary.mainSceneAuxiliaryProof(token)), canonicalAux(pin));
  }
  sourceView.captureMainSceneSourceView(record, geometry, document.view, tokens, THREE.REVISION);
  const lane = new THREE.Group(); lane.position.x = -4.4;
  lane.add(geometryTools.createObservedSwcCenterlines(geometry, { colors: colours }),
    geometryTools.createObservedTopologyLandmarks(geometry, { markerSizeViewer: 0.052 }));
  if (document.view.request.mode === 'radius_surface') {
    assert.equal(record.modes.radiusSurface.available, true);
    lane.add(geometryTools.createRadiusDerivedSurface(geometry, { colors: colours, radialSegments: 6 }));
  }
  lane.updateMatrixWorld(true); const bounds = new THREE.Box3().setFromObject(lane);
  closeVector(bounds.min.toArray(), document.view.sourceObject.bounds.minimum, `${name}: actual source min`);
  closeVector(bounds.max.toArray(), document.view.sourceObject.bounds.maximum, `${name}: actual source max`);
  if (document.view.layers.datContours) {
    assert.equal(record.neuronId, 45718);
    const tokenFor = key => tokens.find(token => token.path === '/' + crosswalkTools.NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[key].path.replace(/^public\//, ''));
    assert.ok(tokenFor('nativeContours') && tokenFor('standardizedGeometry'));
    const mapped = crosswalkTools.validateNmo45718DatSwcCrosswalk(json('data/neurolucida-dat-swc-crosswalk-0.1.json'),
      auxiliary.mainSceneAuxiliaryJson(tokenFor('nativeContours')), auxiliary.mainSceneAuxiliaryJson(tokenFor('standardizedGeometry')));
    for (const contour of mapped.somaContours) for (const point of contour.points) bounds.expandByPoint(new THREE.Vector3(
      ...point.slice(0, 3).map((value, axis) => Math.fround((value - geometry.displayTransform.originMicrometre[axis]) * geometry.displayTransform.scaleViewerUnitPerMicrometre))
    ).add(new THREE.Vector3(-4.4, 0, 0)));
  }
  lane.traverse(drawable => { drawable.geometry?.dispose();
    (Array.isArray(drawable.material) ? drawable.material : drawable.material ? [drawable.material] : []).forEach(material => material.dispose()); });
  const value = { name, document, record, geometry, bounds };
  verified.set(name, value); output.receipts.push({ file: name, bytes: bytes.length, sha256: hash(bytes),
    neuronId: record.neuronId, mode: document.view.request.mode, buildInputCount: document.rendererBuild.inputs.length,
    geometrySha256: document.source.sha256, auxiliaryAssetCount: document.auxiliaryAssets.length });
  return value;
}
function sameSource(first, second) {
  assert.equal(first.document.source.neuronId, second.document.source.neuronId, 'Action changed exact source identity');
  assert.equal(first.document.source.sha256, second.document.source.sha256, 'Action changed source bytes');
  assert.deepEqual(first.document.sourceContext, second.document.sourceContext, 'Action changed source context/frame/identity');
  assert.deepEqual(first.document.scientificScope, second.document.scientificScope, 'Action changed scientific scope');
}
function direction(camera) { return new THREE.Vector3().fromArray(camera.position).sub(new THREE.Vector3().fromArray(camera.target)).normalize().toArray(); }
function sameCamera(first, second, exceptAspect = false) {
  for (const key of ['position', 'target', 'up', 'quaternion']) closeVector(first[key], second[key], `camera ${key}`, 1e-12);
  for (const key of ['kind', 'fov', 'zoom', 'aspect', 'near', 'far', 'filmGauge', 'filmOffset'])
    if (!(exceptAspect && key === 'aspect')) assert.equal(first[key], second[key], `camera ${key} changed`);
}
function assertFit(value, preserve = null) {
  const { document, bounds } = value, camera = document.view.camera;
  assert.equal(document.view.request.view, 'cell_detail'); assert.equal(document.view.layers.morphology, true);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  closeVector(camera.target, sphere.center.toArray(), 'whole-source fit target');
  const verticalHalf = camera.fov * Math.PI / 360;
  const horizontalHalf = Math.atan(Math.tan(verticalHalf) * camera.aspect);
  const expectedDistance = Math.max(4, sphere.radius / Math.sin(Math.min(verticalHalf, horizontalHalf)) * 1.12);
  const actualDistance = new THREE.Vector3().fromArray(camera.position).distanceTo(new THREE.Vector3().fromArray(camera.target));
  assert.ok(numericClose(actualDistance, expectedDistance), 'Actual fit distance disagrees with fixed-FOV complete bounds');
  assert.ok(actualDistance >= 4 && actualDistance <= 100); assert.equal(camera.fov, 35); assert.equal(camera.near, 0.05); assert.equal(camera.far, 250);
  const expectedDirection = preserve ? direction(preserve) : document.view.sourceObject.dimensionality === '2D' ? [0, 0, 1] : new THREE.Vector3(0, 2.2, 9.6).normalize().toArray();
  closeVector(direction(camera), expectedDirection, 'fit direction');
  closeVector(camera.up, preserve ? new THREE.Vector3().fromArray(preserve.up).normalize().toArray() : [0, 1, 0], 'fit up');
  return { wholeSourceTargetVerified: true, defaultDirection: !preserve, previousDirectionPreserved: Boolean(preserve), distance: actualDistance };
}
function comparableRequest(document, omitted) {
  const request = structuredClone(document.view.request);
  for (const name of omitted) {
    if (name.startsWith('layers.')) delete request.layers[name.slice(7)]; else delete request[name];
  }
  return request;
}
for (const action of options.actions) {
  try {
    const values = await Promise.all(action.files.map(verify));
    const first = values[0], second = values[1];
    let evidence = {};
    if (action.action === 'home' || action.action === 'default') evidence = assertFit(first);
    else if (action.action === 'fit') {
      sameSource(first, second);
      assert.deepEqual(first.document.view.request, second.document.view.request);
      assert.deepEqual(first.document.view.inspection, second.document.view.inspection, 'Explicit Fit changed the selected source node/dimming');
      evidence = assertFit(second, first.document.view.camera);
    } else if (action.action === 'slice') {
      sameSource(first, second);
      assert.equal(first.document.view.request.view, 'cell_detail'); assert.equal(second.document.view.request.view, 'cell_detail');
      assert.notEqual(first.document.view.request.sliceZ, second.document.view.request.sliceZ, 'Slice value did not change');
      assert.deepEqual(comparableRequest(first.document, ['sliceZ']), comparableRequest(second.document, ['sliceZ']));
      sameCamera(first.document.view.camera, second.document.view.camera);
      assert.deepEqual(first.document.view.viewport, second.document.view.viewport);
      assert.deepEqual(first.document.view.inspection, second.document.view.inspection);
      assert.deepEqual(first.document.auxiliaryAssets.map(canonicalAux), second.document.auxiliaryAssets.map(canonicalAux));
      evidence = { sliceChanged: true, posePreserved: true, viewportPreserved: true, inspectionPreserved: true };
    } else if (action.action === 'planar-reveal') {
      sameSource(first, second); assert.equal(first.geometry.swc.dimensionality, '2D'); assert.equal(second.geometry.swc.dimensionality, '2D');
      assert.equal(first.document.view.request.layers.observedForm, false); assert.equal(second.document.view.request.layers.observedForm, true);
      assert.equal(first.document.view.layers.morphology, false); assert.equal(second.document.view.layers.morphology, true);
      assert.equal(second.document.view.request.mode, 'observed_swc'); assert.equal(second.record.modes.radiusSurface.available, false);
      assert.deepEqual(comparableRequest(first.document, ['layers.observedForm']), comparableRequest(second.document, ['layers.observedForm']));
      evidence = { ...assertFit(second), planarSourceRevealed: true, threeDimensionalSurfaceAuthorized: false };
    } else if (action.action === 'dat-toggle') {
      sameSource(first, second); assert.equal(first.record.neuronId, 45718);
      assert.notEqual(first.document.view.request.layers.datContours, second.document.view.request.layers.datContours);
      assert.deepEqual(comparableRequest(first.document, ['layers.datContours']), comparableRequest(second.document, ['layers.datContours']));
      assert.equal(first.document.view.layers.datContours, first.document.view.request.layers.datContours);
      assert.equal(second.document.view.layers.datContours, second.document.view.request.layers.datContours);
      const datPaths = new Set(['nativeContours', 'standardizedGeometry'].map(key => '/' + crosswalkTools.NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[key].path.replace(/^public\//, '')));
      for (const value of values) {
        const actualCount = value.document.auxiliaryAssets.filter(asset => datPaths.has(asset.path)).length;
        assert.equal(actualCount, value.document.view.layers.datContours ? 2 : 0, 'Mapped DAT source receipts disagree with actual visibility');
      }
      assert.deepEqual(first.document.auxiliaryAssets.filter(asset => !datPaths.has(asset.path)).map(canonicalAux),
        second.document.auxiliaryAssets.filter(asset => !datPaths.has(asset.path)).map(canonicalAux));
      // For this exact admitted record, the seven mapped contours are enclosed
      // by the morphology bounds. Neither visibility change needs a new pose.
      closeVector(first.bounds.min.toArray(), second.bounds.min.toArray(), 'mapped DAT union min');
      closeVector(first.bounds.max.toArray(), second.bounds.max.toArray(), 'mapped DAT union max');
      sameCamera(first.document.view.camera, second.document.view.camera);
      assert.deepEqual(first.document.view.inspection, second.document.view.inspection);
      evidence = { exactMappedDatLayerToggled: true, actualAuxiliaryProofCountVerified: true, posePreserved: true };
    } else if (action.action === 'mode-change') {
      sameSource(first, second); assert.notEqual(first.document.view.request.mode, second.document.view.request.mode);
      assert.deepEqual(comparableRequest(first.document, ['mode']), comparableRequest(second.document, ['mode']));
      assert.ok(second.document.geometryVerification.mainSceneVerificationSequence > first.document.geometryVerification.mainSceneVerificationSequence,
        'Mode change did not advance actual main-source verification');
      assert.notEqual(first.document.geometryVerification.verifiedAt, second.document.geometryVerification.verifiedAt);
      evidence = { ...assertFit(second), modeChanged: true, newSourceVerificationEvent: true };
    } else if (action.action === 'retained') {
      // Two reads of the same prepared DOM textarea must keep the original
      // numbers, generatedAt and event binding, rather than fabricate a recapture.
      assert.deepEqual(first.document, second.document, 'The prepared source-view receipt was changed between reads');
      evidence = { samePreparedDocument: true, originalCapturedNumbersRetained: true, sameGeneratedAtAndSourceEvent: true };
    }
    output.actions.push({ ...action, verified: true, evidence });
  } catch (error) { output.errors.push({ ...action, error: error instanceof Error ? error.message : String(error) }); }
}
output.mismatchCount = output.errors.length;
const result = JSON.stringify(output, null, 2) + '\n';
if (options.out) fs.writeFileSync(options.out, result);
process.stdout.write(result); if (output.mismatchCount) process.exitCode = 1;
