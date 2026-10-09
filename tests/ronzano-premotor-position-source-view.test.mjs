import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import * as THREE from 'three';
import { RONZANO_SOURCE_VIEW_BUILD, RONZANO_CAMERA_PRESETS, readVerifiedRonzanoPositions, ronzanoPositionPayload, ronzanoPositionVerification,
  createRonzanoPositionObject, computeRonzanoSourceCameraFit, attestRonzanoRenderedView, captureRonzanoSourceView, validateRonzanoSourceViewReplay, validateRonzanoPositionDescriptor, compareRonzanoSourceViewReplayApplied,
  assertRonzanoSourceViewApplied, ronzanoSelectedRow, browseRonzanoRow, sameRonzanoCameraForCapture, disposeRonzanoPositionObject } from '../app/ronzano-premotor-position-source-view.js';
const root = new URL('../', import.meta.url), contract = JSON.parse(fs.readFileSync(new URL('data/ronzano-premotor-position-reference-0.1.json', root)));
const read = url => fs.readFileSync(new URL(`public${url}`, root));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const defaultRequest = { frame: 'raw', muscle: 'all', segment: 'all', cameraPreset: 'three_quarter', pointSizePixels: 3, layers: { points: true, axes: true } };
const actualFetch = async (url, request) => { assert.ok(['default', 'no-store'].includes(request.cache));
  const bytes = read(url); return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }; };
const token = await readVerifiedRonzanoPositions({ fetchImpl: actualFetch });
function boundsFor(object) { const bounds = new THREE.Box3().setFromObject(object); return { minimum: bounds.min.toArray(), maximum: bounds.max.toArray() }; }
function cameraFor(bounds, aspect, preset) { const pose = computeRonzanoSourceCameraFit({ bounds, aspect, preset }), camera = new THREE.PerspectiveCamera(38, aspect, pose.near, pose.far);
  camera.position.fromArray(pose.position); camera.up.fromArray(pose.up); const target = new THREE.Vector3(...pose.target); camera.lookAt(target); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  return { camera, controls: { object: camera, target } }; }
// Descriptor mock exercises real THREE object/buffer/projection and private-byte
// validation only. It is not an observed browser/WebGL or pixel result.
function descriptor(sourceToken, request = defaultRequest, width = 990, height = 460) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1513); const object = createRonzanoPositionObject(sourceToken, request); scene.add(object);
  const axes = new THREE.AxesHelper(3); axes.visible = request.layers.axes; scene.add(axes);
  const pose = cameraFor(boundsFor(object), width / height, request.cameraPreset);
  const renderer = { isWebGLRenderer: true, domElement: { isConnected: true, getBoundingClientRect: () => ({ width, height }) },
    info: { render: { calls: object.children.length } }, getContext: () => ({ isContextLost: () => false, getContextAttributes: () => ({ alpha: false, antialias: true }) }),
    getDrawingBufferSize: vector => vector.set(width, height), getPixelRatio: () => 1, outputColorSpace: 'srgb', toneMapping: 0, clippingPlanes: [], localClippingEnabled: false };
  return { token: sourceToken, request, root: object, scene, axes, ...pose, renderer, selectedRowId: null, sceneInstanceId: 'ronzano-scene-1', revision: 1 };
}
// Synthetic untrusted replay fixture, never an actual captured view proof.
function documentFor(actual) {
  const facts = validateRonzanoPositionDescriptor(actual.token, actual), sourceVerification = ronzanoPositionVerification(actual.token), frame = actual.request.frame;
  const scope = { observationUnit: 'source_file_id_plus_one_based_excel_row', objectClaim: 'labelled_cell_position_only', crossFramePointIdentity: 'not_established', crossSourceIdentity: 'not_established', animalIdentity: 'unknown', experimentIdentity: 'unknown', laboratoryIdentity: 'unknown', rowAcquisitionMethod: 'unknown', pointRadiusAuthority: 'display_pixels_only', biologicalCellGeometryCount: 0, morphologyCount: 0, sameCellInternalObjectCount: 0, M2Count: 0, M4Count: 0, registrationCount: 0, atlasJoinCount: 0, biologicalMeasurements: 0, adultTransfer: 'not_established', sharedPhysicalDisplayScale: false };
  return { documentType: 'ronzano_premotor_position_actual_view_receipt', schemaVersion: '0.1.0', applicationVersion: RONZANO_SOURCE_VIEW_BUILD.applicationVersion, generatedAt: '2026-10-04T00:00:00.000Z', rendererBuild: structuredClone(RONZANO_SOURCE_VIEW_BUILD), sourceVerification,
    sourceContext: { releaseId: contract.releaseId, sourceDoi: contract.source.doi, frame, frameDenominator: structuredClone(contract.sourceObjectContract.representations[frame]), coordinateFrame: structuredClone(contract.coordinateFrames[frame]), rowIdentity: contract.sourceObjectContract.rowIdentity, rights: structuredClone(contract.rights), relationshipBoundary: structuredClone(contract.relationshipBoundary) }, scientificScope: scope,
    view: { status: 'rendered_source_points', runtimeBinding: { sourceVerificationSequence: sourceVerification.verificationSequence, sceneInstanceId: actual.sceneInstanceId, revision: actual.revision, renderSequence: 1 }, ...facts,
      drawing: { authority: 'owned_real_webgl_render_of_verified_uploaded_position_rows', sourceFileIds: facts.sourceObject.sourceFileIds, submittedPointCount: facts.sourceObject.pointCount, pixelsAttested: false } } };
}
function dispose(actual) { disposeRonzanoPositionObject(actual.root); actual.axes.geometry.dispose(); actual.axes.material.dispose(); }

test('actual positions and all22 XLSX bytes have private immutable proof; frame populations remain distinct', () => {
  const payload = ronzanoPositionPayload(token), verification = ronzanoPositionVerification(token);
  assert.equal(contract.rights.status, "CC-BY-4.0"); assert.equal(contract.sourceObjectContract.rowIdentity, "source_file_id_plus_one_based_excel_row");
  assert.deepEqual(payload.totals.byFrame, { raw: 14484, normalized: 17394 }); assert.equal(verification.files.length, 23);
  assert.equal(verification.files[0].bytes, 1274690); assert.equal(verification.files[0].sha256, 'abf46460d0e37c2ea82b90f2eaf6531d5df8f44e9dcea8448d43d321835184f3');
  for (const file of verification.files) { const bytes = read(file.path); assert.equal(bytes.length, file.bytes); assert.equal(sha256(bytes), file.sha256); }
  assert.ok(Object.isFrozen(payload.representations[0].groups[0].points[0]));
  assert.throws(() => { payload.representations[0].groups[0].points[0][0] = 0; }, TypeError);
  assert.throws(() => ronzanoPositionPayload(structuredClone(token)), /no private byte proof/);
  assert.throws(() => ronzanoPositionPayload(Object.freeze(JSON.parse(JSON.stringify(token)))), /no private byte proof/);
  verification.files.pop(); assert.equal(ronzanoPositionVerification(token).files.length, 23);
});

test('build identity physically binds forty route/renderer/style inputs and sixty-three runtime authority inputs', () => {
  assert.equal(RONZANO_SOURCE_VIEW_BUILD.inputs.length, 40);
  for (const pin of RONZANO_SOURCE_VIEW_BUILD.inputs) { const bytes = fs.readFileSync(new URL(pin.path, root)); assert.equal(bytes.length, pin.bytes); assert.equal(sha256(bytes), pin.sha256); }
  const runtime = JSON.parse(fs.readFileSync(new URL('data/research-renderer-runtime-inputs-2.91.json', root)));
  const originalSourcePaths = ronzanoPositionVerification(token).files.map(file => `public${file.path}`);
  assert.equal(originalSourcePaths.length, 23);
  assert.ok(originalSourcePaths.every(path => !RONZANO_SOURCE_VIEW_BUILD.inputs.some(input => input.path === path)), 'original scientific source pins must remain separate from renderer/wrapper build pins');
  const authorityPaths = new Set([...RONZANO_SOURCE_VIEW_BUILD.inputs.map(input => input.path), ...originalSourcePaths]);
  assert.equal(authorityPaths.size, 63);
  for (const path of authorityPaths) {
    const declared = runtime.authoritativeInputs.filter(input => input.path === path); assert.equal(declared.length, 1, `runtime authority must pin exactly one ${path}`);
    const actual = fs.readFileSync(new URL(path, root)); assert.equal(actual.length, declared[0].bytes); assert.equal(sha256(actual), declared[0].sha256);
  }
});

test('all40 nonempty exact frame/group/segment filters fit complete Float32 bounds across five aspects and four presets', () => {
  let nonempty = 0, fits = 0, projectedPoints = 0;
  for (const frame of ['raw', 'normalized']) for (const muscle of ['all', 'LG', 'TA']) for (const segment of ['all', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']) {
    const request = { ...defaultRequest, frame, muscle, segment }, object = createRonzanoPositionObject(token, request);
    try {
      if (!object.children.length) continue; nonempty++;
      for (const aspect of [990 / 460, 1, 390 / 520, 320 / 844, 240 / 600]) for (const preset of RONZANO_CAMERA_PRESETS) {
        const { camera } = cameraFor(boundsFor(object), aspect, preset); fits++;
        object.traverse(drawable => { const positions = drawable.geometry?.getAttribute('position'); if (!positions) return;
          for (let index = 0; index < positions.count; index++) { const projected = new THREE.Vector3().fromBufferAttribute(positions, index).project(camera); projectedPoints++;
            assert.ok(projected.toArray().every(Number.isFinite)); assert.ok(Math.abs(projected.x) <= 1 + 1e-9 && Math.abs(projected.y) <= 1 + 1e-9 && Math.abs(projected.z) <= 1 + 1e-9,
              `${frame}/${muscle}/${segment}/${preset}/${aspect}: exact point cropped`); }
        });
      }
    } finally { disposeRonzanoPositionObject(object); }
  }
  assert.equal(nonempty, 40); assert.equal(fits, 800); assert.ok(projectedPoints > 1_000_000);
});

test('explicit THREE descriptor replay fixture retains source row/camera/frame facts and cannot mint actual-view proof', () => {
  const actual = descriptor(token), row = browseRonzanoRow(token, defaultRequest, null, 'first'); actual.selectedRowId = row;
  try {
    const document = documentFor(actual); assert.deepEqual(validateRonzanoSourceViewReplay(token, document), document.view);
    assert.deepEqual(document.view.camera.position, actual.camera.position.toArray()); assert.equal(document.view.sourceObject.pointCount, 14484);
    assert.equal(document.view.selectedRow.id, row); assert.deepEqual(document.view.selectedRow.sourceCoordinate, ronzanoPositionPayload(token).representations[0].groups[0].points[0]);
    for (const field of ['animalIdentity', 'experimentIdentity', 'laboratoryIdentity', 'rowAcquisitionMethod']) assert.equal(document.scientificScope[field], 'unknown');
    for (const field of ['M2Count', 'M4Count', 'biologicalCellGeometryCount', 'sameCellInternalObjectCount', 'registrationCount', 'atlasJoinCount']) assert.equal(document.scientificScope[field], 0);
    document.view.camera.position[0] = 0; assert.notEqual(documentFor(actual).view.camera.position[0], 0);
    assert.throws(() => attestRonzanoRenderedView(token, actual), /no privately owned real WebGL render authority/); assert.throws(() => captureRonzanoSourceView(Object.freeze({ kind: 'attested_ronzano_source_view', renderSequence: 1 })), /no private rendered-source proof/);
  } finally { dispose(actual); }
});

test('every row navigation uses file+one-based source row and blocks cross-frame identity', () => {
  const request = { ...defaultRequest, muscle: 'TA', segment: 'L1' }, first = browseRonzanoRow(token, request, null, 'first'), last = browseRonzanoRow(token, request, null, 'last');
  assert.match(first, /RAW-TA-L1:row:1$/); assert.match(last, /RAW-TA-L1:row:296$/);
  assert.equal(browseRonzanoRow(token, request, last, 'next'), last); assert.equal(browseRonzanoRow(token, request, first, 'previous'), first);
  assert.match(browseRonzanoRow(token, request, first, 'next'), /:row:2$/); assert.equal(browseRonzanoRow(token, request, first, 'clear'), null);
  assert.throws(() => ronzanoSelectedRow(token, { ...request, frame: 'normalized' }, first), /not in the current source frame/);
  assert.throws(() => ronzanoSelectedRow(token, request, first.replace(':row:1', ':row:0')), /locator is invalid/);
  assert.equal(browseRonzanoRow(token, { ...request, muscle: 'LG' }, null, 'first'), null);
  const allLast = browseRonzanoRow(token, defaultRequest, null, 'last'); assert.equal(ronzanoSelectedRow(token, defaultRequest, allLast).sourceRow, 1123);
});

test('original byte mismatch, HTTP failure and before/during-read cancellation issue no source token', async () => {
  await assert.rejects(readVerifiedRonzanoPositions({ fetchImpl: async (url, request) => {
    const response = await actualFetch(url, request); if (url.endsWith('.xlsx')) return { ...response, arrayBuffer: async () => new Uint8Array(1).buffer }; return response;
  } }), /source bytes differ/);
  await assert.rejects(readVerifiedRonzanoPositions({ fetchImpl: async () => ({ ok: false, status: 503 }) }), /source request failed/);
  const before = new AbortController(); before.abort(); await assert.rejects(readVerifiedRonzanoPositions({ signal: before.signal, fetchImpl: actualFetch }), { name: 'AbortError' });
  const during = new AbortController(); await assert.rejects(readVerifiedRonzanoPositions({ signal: during.signal, fetchImpl: async (url, request) => {
    const response = await actualFetch(url, request); during.abort(); return response;
  } }), { name: 'AbortError' });
});

test('fresh no-store replay comparison rechecks all23 files and preserves manual pose/row/layers across aspect', async () => {
  const request = { ...defaultRequest, frame: 'normalized', muscle: 'TA', segment: 'L6', layers: { points: true, axes: false } }, before = descriptor(token, request);
  let after;
  try {
    before.selectedRowId = browseRonzanoRow(token, request, null, 'last');
    before.camera.position.add(new THREE.Vector3(2, 3, 4)); before.camera.lookAt(before.controls.target); before.camera.updateMatrixWorld(true);
    const saved = documentFor(before), calls = [];
    const fresh = await readVerifiedRonzanoPositions({ forceReload: true, fetchImpl: async (url, options) => { calls.push({ url, cache: options.cache }); return actualFetch(url, options); } });
    assert.equal(calls.length, 23); assert.ok(calls.every(call => call.cache === 'no-store')); assert.ok(fresh.verificationSequence > token.verificationSequence);
    after = descriptor(fresh, request, 390, 520); after.selectedRowId = before.selectedRowId;
    after.camera.position.fromArray(saved.view.camera.position); after.camera.up.fromArray(saved.view.camera.up); after.controls.target.fromArray(saved.view.camera.target);
    after.camera.near = saved.view.camera.near; after.camera.far = saved.view.camera.far; after.camera.lookAt(after.controls.target); after.camera.updateProjectionMatrix(); after.camera.updateMatrixWorld(true);
    const actual = documentFor(after); assert.equal(compareRonzanoSourceViewReplayApplied(saved, fresh, actual, token), true); assert.deepEqual(actual.view.selectedRow, saved.view.selectedRow); assert.deepEqual(actual.view.camera.position, saved.view.camera.position);
    assert.equal(actual.view.camera.aspect, 390 / 520); assert.notEqual(actual.sourceVerification.verificationSequence, saved.sourceVerification.verificationSequence);
    assert.throws(() => compareRonzanoSourceViewReplayApplied(saved, token, saved, token), /freshly verify/);
    assert.throws(() => assertRonzanoSourceViewApplied(saved, Object.freeze({ kind: "attested_ronzano_source_view", renderSequence: 1 }), token), /no private rendered-source proof/);
  } finally { dispose(before); if (after) dispose(after); }
});

test('replay rejects changes to source frame/row/build/missing identity/biological scope/projection/layers', () => {
  const actual = descriptor(token); actual.selectedRowId = browseRonzanoRow(token, defaultRequest, null, 'first');
  try { const saved = documentFor(actual);
    const changes = [doc => { doc.rendererBuild.inputs[0].sha256 = '0'.repeat(64); }, doc => { doc.sourceVerification.files.pop(); },
      doc => { doc.scientificScope.registrationCount = 1; }, doc => { doc.scientificScope.animalIdentity = 'inferred_mouse'; }, doc => { doc.scientificScope.M4Count = 1; },
      doc => { doc.sourceContext.frame = 'normalized'; }, doc => { doc.view.selectedRow.sourceCoordinate[0] += 1; }, doc => { doc.view.selectedRow.sourceRow = 0; },
      doc => { doc.view.camera.fov = 39; }, doc => { doc.view.camera.quaternion[0] += 0.1; }, doc => { doc.view.layers.axes = false; },
      doc => { doc.view.sourceObject.bounds.maximum[0] += 1; }, doc => { doc.view.sourceObject.transform.illustrationalScale[0] = 1700; }, doc => { doc.view.runtimeBinding.sourceVerificationSequence++; }];
    for (const change of changes) { const forged = structuredClone(saved); change(forged); assert.throws(() => validateRonzanoSourceViewReplay(token, forged), /Ronzano source view:/); }
  } finally { dispose(actual); }
});

test('descriptor facts reject changed source buffers/draw state/layers/material/world transforms; actual producer rejects every mock renderer', () => {
  const mutations = [actual => { actual.root = actual.root.clone(); actual.scene.add(actual.root); }, actual => { actual.root.children[0].geometry.attributes.position.array[0] += 0.5; },
    actual => { actual.root.children[0].visible = false; }, actual => { actual.root.children[0].material.size = 7; }, actual => { actual.root.children[0].material.color.set(0); },
    actual => { actual.root.children[0].position.x = 1; }, actual => { actual.root.position.x = 1; }, actual => { actual.root.add(new THREE.Group()); },
    actual => { actual.root.children[0].geometry.setDrawRange(0, 0); }, actual => { actual.root.children[0].geometry.setIndex([0, 1, 2]); },
    actual => { actual.root.children[0].material.visible = false; }, actual => { actual.root.children[0].layers.set(2); }, actual => { actual.camera.layers.set(2); }, actual => { actual.camera.projectionMatrix.elements[0] += 0.1; }, actual => { actual.camera.scale.x = 2; }, actual => { actual.camera.matrixAutoUpdate = false; },
    actual => { actual.scene.visible = false; }, actual => { actual.scene.overrideMaterial = new THREE.PointsMaterial(); }, actual => { actual.scene.add(new THREE.Group()); }, actual => { actual.renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)]; }];
  for (const mutate of mutations) { const actual = descriptor(token); try { mutate(actual); assert.throws(() => validateRonzanoPositionDescriptor(token, actual), /Ronzano source view:/); assert.throws(() => attestRonzanoRenderedView(token, actual), /no privately owned real WebGL render authority/); } finally { dispose(actual); } }
});

test('Fit preserves manual direction/up; camera signature suppresses only anchored1e-12 vector drift', () => {
  const actual = descriptor(token);
  try { const saved = documentFor(actual).view.camera, direction = new THREE.Vector3(3, 2, -4).normalize(), up = [0, 1, 0];
    const pose = computeRonzanoSourceCameraFit({ bounds: boundsFor(actual.root), aspect: 390 / 520, direction: direction.toArray(), up });
    const output = new THREE.Vector3(...pose.position).sub(new THREE.Vector3(...pose.target)).normalize(); assert.ok(output.distanceTo(direction) < 1e-12); assert.deepEqual(pose.up, up);
    const idle = structuredClone(saved); idle.position[0] += 5e-13; assert.equal(sameRonzanoCameraForCapture(saved, idle), true);
    idle.position[0] += 2e-12; assert.equal(sameRonzanoCameraForCapture(saved, idle), false);
    for (const scalar of ['fov', 'zoom', 'aspect', 'near', 'far', 'filmGauge', 'filmOffset']) { const changed = structuredClone(saved); changed[scalar] += 1e-9; assert.equal(sameRonzanoCameraForCapture(saved, changed), false); }
    assert.throws(() => computeRonzanoSourceCameraFit({ bounds: boundsFor(actual.root), aspect: 1, direction: [0, 1, 0], up: [0, 1, 0] }), /collinear/);
    assert.throws(() => computeRonzanoSourceCameraFit({ bounds: { minimum: [1, 1, 1], maximum: [1, 1, 1] }, aspect: 1 }), /positive extent/);
  } finally { dispose(actual); }
});
