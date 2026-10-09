#!/usr/bin/env node
// Offline replay of real browser receipts. This script cannot mint render proof
// or infer pixels from JSON. Source math is rebuilt independently from originals.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const defaults = { project: '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype' };
const options = { ...defaults, pairs: [] };
const allowed = new Set(['--project', '--dependency-root', '--captures', '--output', '--restore-pair', '--resize-pair', '--camera-pair', '--fit-pair']);
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (key === '--help') {
    process.stdout.write('actual-positions-replay.mjs --project ROOT --captures DIR [--dependency-root ROOT] [--output JSON]\n  [--restore-pair saved.json:restored.json] [--resize-pair before.json:after.json]\n  [--camera-pair before.json:after.json] [--fit-pair before.json:after.json]\n\nOnly actual-positions-*.json are read. default/preset/fit labels assert full point-center/bounds fitting; user/restored/inspection/before-fit labels report clipping only. No JSON-only render or pixel authority is claimed.\n');
    process.exit(0);
  }
  assert.ok(allowed.has(key) && process.argv[i + 1], `Unsupported or incomplete option: ${key}`);
  const value = process.argv[++i];
  if (key.endsWith('-pair')) {
    const names = value.split(':');
    assert.equal(names.length, 2, 'Pair must name two receipt filenames separated by one colon');
    assert.ok(names.every(name => name && name === path.basename(name)), 'Pair names must be simple basenames');
    options.pairs.push({ kind: key.slice(2, -5), before: names[0], after: names[1] });
  } else options[key.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
}
assert.ok(options.captures, '--captures is required');
const project = path.resolve(options.project), captureDirectory = path.resolve(options.captures);
const dependencyRoot = path.resolve(options.dependencyRoot ?? project);
const THREE = await import(pathToFileURL(path.join(dependencyRoot, 'node_modules/three/build/three.module.js')).href);
const sha = value => createHash('sha256').update(value).digest('hex');
const positionedReadContract = { chunkBytes: 4096, filesRead: 0, bytesRead: 0, positionedReadCalls: 0 };
const positionedBytes = filename => {
  const fd = fs.openSync(filename, 'r'); const pieces = []; let position = 0;
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    while (true) {
      const buffer = Buffer.alloc(4096), size = fs.readSync(fd, buffer, 0, 4096, position);
      positionedReadContract.positionedReadCalls++;
      if (!size) break; pieces.push(buffer.subarray(0, size)); position += size;
    }
    const after = fs.fstatSync(fd, { bigint: true });
    assert.equal(before.ino, after.ino); assert.equal(before.size, after.size); assert.equal(before.mtimeNs, after.mtimeNs); assert.equal(BigInt(position), after.size);
  } finally { fs.closeSync(fd); }
  positionedReadContract.filesRead++; positionedReadContract.bytesRead += position;
  return Buffer.concat(pieces);
};
const bytes = name => positionedBytes(path.join(project, name));
const json = name => JSON.parse(bytes(name));
const pin = name => { const value = bytes(name); return { path: name, bytes: value.length, sha256: sha(value) }; };
const exact = (actual, expected, message = 'Independent actual receipt field mismatch') => assert.deepEqual(actual, expected, message);
const keys = (value, names, label) => { assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label}: object required`); exact(Object.keys(value).sort(), [...names].sort(), `${label}: field set changed`); };
const finiteArray = (value, length, label) => { assert.ok(Array.isArray(value) && value.length === length && value.every(Number.isFinite), `${label}: finite ${length}-vector required`); };
const vectorEqual = (a, b, label) => { finiteArray(a, b.length, label); a.forEach((value, i) => assert.ok(Math.abs(value - b[i]) <= 1e-12, `${label}[${i}]: exceeds anchored camera 1e-12`)); };
const contract = json('data/ronzano-premotor-position-reference-0.1.json');
const expectedFiles = [{ id: contract.assetId, path: contract.derivedAsset.browserUrl, bytes: contract.derivedAsset.bytes, sha256: contract.derivedAsset.sha256 },
  ...contract.sourceFiles.map(file => ({ id: file.id, path: file.browserUrl, bytes: file.bytes, sha256: file.sha256 }))];
assert.equal(expectedFiles.length, 23);
const originalAssetPins = expectedFiles.map(file => {
  assert.ok(file.path.startsWith('/data/') && !file.path.includes('..'), 'Original asset URL must be project-local');
  const actual = pin(`public${file.path}`); assert.equal(actual.bytes, file.bytes, `${file.id}: actual bytes changed`); assert.equal(actual.sha256, file.sha256, `${file.id}: actual SHA changed`);
  return { ...file, actualVerified: true };
});
const payload = JSON.parse(bytes(`public${contract.derivedAsset.browserUrl}`));
exact(payload.totals.byFrame, { raw: 14484, normalized: 17394 });
for (const frame of ['raw', 'normalized']) {
  const groups = payload.representations.find(rep => rep.frame === frame).groups;
  assert.equal(groups.length, 11); assert.equal(groups.reduce((sum, group) => sum + group.points.length, 0), payload.totals.byFrame[frame]);
  for (const group of groups) {
    const file = contract.sourceFiles.find(item => item.id === group.sourceFileId);
    assert.ok(file && file.frame === frame && file.muscle === group.muscle && file.segment === group.segment, 'Original file/group identity changed');
    assert.equal(group.sourceFileSha256, file.sha256); exact(group.sourceRows, { first: 1, last: group.points.length });
    group.points.forEach(point => finiteArray(point, 3, 'original XYZ'));
  }
}
const buildPaths = [
  'app/ResearchActiveRecordProvider.tsx',
  'app/ResearchCollectionPage.tsx',
  'app/ResearchRoutePage.tsx',
  'app/ResearchSkipLink.tsx',
  'app/RonzanoPremotorPositionViewer.tsx',
  'app/SiteNavigation.tsx',
  'app/academic-interface.css',
  'app/explore/[...section]/page.tsx',
  'app/globals.css',
  'app/layout.tsx',
  'app/matson-sci-timecourse.js',
  'app/morphology-viewport-scale.js',
  'app/neurolucida-native-contour-admission.js',
  'app/neurolucida-native-detail-admission.js',
  'app/neurolucida-native-detail-records.js',
  'app/neurolucida-native-soma-contours.js',
  'app/pv-independent-research-records.js',
  'app/research-active-record.js',
  'app/research-explorer-index.js',
  'app/research-information-layout.css',
  'app/research-iteration.js',
  'app/research-pages.css',
  'app/research-record-presentation.js',
  'app/research-selection-delta.js',
  'app/research-skip-link.css',
  'app/research-supplemental-morphology-records.js',
  'app/ronzano-premotor-position-data.js',
  'app/ronzano-premotor-position-source-view.d.ts',
  'app/ronzano-premotor-position-source-view.js',
  'app/site-navigation.css',
  'app/site-navigation.ts',
  'data/neurolucida-native-contour-admission-catalog-0.3.json',
  'data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json',
  'data/pv-independent-morphology-routes-0.1.json',
  'data/research-explorer-transport-0.1.json',
  'data/ronzano-premotor-position-reference-0.1.json',
  'package-lock.json',
  'package.json',
  'public/data/research_explorer_index_v1/asset-manifest.json',
  'public/data/research_explorer_index_v1/search-index.json',
];
const runtime = json('data/research-renderer-runtime-inputs-2.91.json');
const physicalBuild = buildPaths.map(name => {
  const declared = runtime.authoritativeInputs.filter(input => input.path === name); assert.equal(declared.length, 1, `Current runtime must pin exactly one ${name}`);
  const actual = pin(name); exact(actual, { path: declared[0].path, bytes: declared[0].bytes, sha256: declared[0].sha256 }, `Stale current runtime input ${name}`); return actual;
});
assert.equal(physicalBuild.length, 40, 'exact renderer/wrapper build denominator changed');
const authorityPaths = [...new Set([...buildPaths, ...expectedFiles.map(file => `public${file.path}`)])];
assert.equal(authorityPaths.length, 63, 'renderer/wrapper plus separate scientific source authority denominator changed');
const physicalRuntimeAuthority = authorityPaths.map(name => {
  const declared = runtime.authoritativeInputs.filter(input => input.path === name); assert.equal(declared.length, 1, `Current runtime must pin exactly one ${name}`);
  const actual = pin(name); exact(actual, { path: declared[0].path, bytes: declared[0].bytes, sha256: declared[0].sha256 }, `Stale current runtime authority input ${name}`); return actual;
});
const expectedBuild = { applicationVersion: '2.91.0-research.1', scope: 'ronzano_actual_source_points_camera_layers_and_row', inputs: physicalBuild };
const expectedScope = { observationUnit: 'source_file_id_plus_one_based_excel_row', objectClaim: 'labelled_cell_position_only',
  crossFramePointIdentity: 'not_established', crossSourceIdentity: 'not_established', animalIdentity: 'unknown', experimentIdentity: 'unknown',
  laboratoryIdentity: 'unknown', rowAcquisitionMethod: 'unknown', pointRadiusAuthority: 'display_pixels_only', biologicalCellGeometryCount: 0,
  morphologyCount: 0, sameCellInternalObjectCount: 0, M2Count: 0, M4Count: 0, registrationCount: 0, atlasJoinCount: 0,
  biologicalMeasurements: 0, adultTransfer: 'not_established', sharedPhysicalDisplayScale: false };
const documents = new Map(), results = [];
const names = fs.readdirSync(captureDirectory).filter(name => /^actual-positions-.*\.json$/.test(name)).sort();
assert.ok(names.length, 'No actual-positions-*.json captures found');
const expectedRow = (groups, frame, row) => {
  if (row === null) return null;
  const match = /^(.+):row:([1-9]\d*)$/.exec(row.id); assert.ok(match, 'Malformed source-row locator');
  const group = groups.find(item => item.sourceFileId === match[1]), number = Number(match[2]);
  assert.ok(group && Number.isSafeInteger(number) && number <= group.points.length, 'Selected row is outside exact source frame/filters');
  return { id: row.id, sourceFileId: group.sourceFileId, sourceFileSha256: group.sourceFileSha256, sourceRow: number, frame,
    muscle: group.muscle, muscleRole: group.muscleRole, segment: group.segment, sourceCoordinate: group.points[number - 1], objectClaim: 'labelled_cell_position_only', registrationCount: 0 };
};
const presets = { three_quarter: [1.35, 0.75, 1.65], transverse: [0, 0, 1], frontal: [0, 1, 0], lateral: [1, 0, 0] };
const basis = camera => new THREE.Vector3(...camera.position).sub(new THREE.Vector3(...camera.target)).normalize().toArray();
for (const name of names) {
  const raw = positionedBytes(path.join(captureDirectory, name)), doc = JSON.parse(raw), view = doc.view, request = view.request;
  keys(doc, ['documentType', 'schemaVersion', 'applicationVersion', 'generatedAt', 'rendererBuild', 'sourceVerification', 'sourceContext', 'scientificScope', 'view'], name);
  assert.equal(doc.documentType, 'ronzano_premotor_position_actual_view_receipt'); assert.equal(doc.schemaVersion, '0.1.0'); assert.equal(doc.applicationVersion, expectedBuild.applicationVersion);
  assert.ok(Number.isFinite(Date.parse(doc.generatedAt))); exact(doc.rendererBuild, expectedBuild, `${name}: captured build is not the current physical build`); exact(doc.scientificScope, expectedScope);
  keys(doc.sourceVerification, ['status', 'verificationSequence', 'verifiedAt', 'requestCacheMode', 'scope', 'files'], 'sourceVerification');
  assert.equal(doc.sourceVerification.status, 'verified'); assert.ok(Number.isSafeInteger(doc.sourceVerification.verificationSequence) && doc.sourceVerification.verificationSequence > 0);
  assert.ok(['default', 'no-store'].includes(doc.sourceVerification.requestCacheMode)); assert.ok(Number.isFinite(Date.parse(doc.sourceVerification.verifiedAt)));
  assert.equal(doc.sourceVerification.scope, 'actual_derived_xyz_payload_and_all_22_original_workbook_bytes'); exact(doc.sourceVerification.files, expectedFiles);
  keys(view, ['status', 'runtimeBinding', 'request', 'camera', 'viewport', 'renderer', 'layers', 'sourceObject', 'selectedRow', 'drawing'], 'view');
  assert.equal(view.status, 'rendered_source_points'); keys(view.runtimeBinding, ['sourceVerificationSequence', 'sceneInstanceId', 'revision', 'renderSequence'], 'runtimeBinding');
  assert.equal(view.runtimeBinding.sourceVerificationSequence, doc.sourceVerification.verificationSequence); assert.match(view.runtimeBinding.sceneInstanceId, /^ronzano-scene-[1-9]\d*$/);
  for (const key of ['revision', 'renderSequence']) assert.ok(Number.isSafeInteger(view.runtimeBinding[key]) && view.runtimeBinding[key] > 0);
  keys(request, ['frame', 'muscle', 'segment', 'cameraPreset', 'pointSizePixels', 'layers'], 'request');
  assert.ok(['raw', 'normalized'].includes(request.frame)); assert.ok(['all', 'LG', 'TA'].includes(request.muscle)); assert.ok(['all', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'].includes(request.segment));
  assert.ok(Object.hasOwn(presets, request.cameraPreset)); assert.ok(Number.isInteger(request.pointSizePixels) && request.pointSizePixels >= 1 && request.pointSizePixels <= 7);
  keys(request.layers, ['points', 'axes'], 'requested layers'); assert.equal(request.layers.points, true); assert.equal(typeof request.layers.axes, 'boolean'); exact(view.layers, request.layers);
  exact(doc.sourceContext, { releaseId: contract.releaseId, sourceDoi: contract.source.doi, frame: request.frame,
    frameDenominator: contract.sourceObjectContract.representations[request.frame], coordinateFrame: contract.coordinateFrames[request.frame], rowIdentity: contract.sourceObjectContract.rowIdentity,
    rights: contract.rights, relationshipBoundary: contract.relationshipBoundary });
  const groups = payload.representations.find(rep => rep.frame === request.frame).groups.filter(group => (request.muscle === 'all' || request.muscle === group.muscle) && (request.segment === 'all' || request.segment === group.segment));
  assert.ok(groups.length, 'An empty source view cannot be an actual rendered receipt');
  const scale = request.frame === 'normalized' ? [1700, 900, 1] : [1, 1, 1], points = [];
  for (const group of groups) for (const point of group.points) points.push(point.map((value, axis) => Math.fround((value * scale[axis]) * .01)));
  const bounds = { minimum: [Infinity, Infinity, Infinity], maximum: [-Infinity, -Infinity, -Infinity] };
  points.forEach(point => point.forEach((value, axis) => { bounds.minimum[axis] = Math.min(bounds.minimum[axis], value); bounds.maximum[axis] = Math.max(bounds.maximum[axis], value); }));
  const expectedObject = { bounds, pointCount: points.length, sourceFileIds: groups.map(group => group.sourceFileId),
    transform: { sourceFrame: request.frame, illustrationalScale: scale, viewerScale: .01, coordinatePrecision: 'Float32_uploaded_positions', displayUse: 'viewer_only', measurementAuthorized: false, registrationCount: 0 },
    worldMatrix: new THREE.Matrix4().toArray() };
  exact(view.sourceObject, expectedObject); exact(view.selectedRow, expectedRow(groups, request.frame, view.selectedRow));
  exact(view.drawing, { authority: 'owned_real_webgl_render_of_verified_uploaded_position_rows', sourceFileIds: view.drawing.sourceFileIds, submittedPointCount: points.length, pixelsAttested: false });
  exact([...view.drawing.sourceFileIds].sort(), [...expectedObject.sourceFileIds].sort());
  keys(view.renderer, ['engine', 'revision', 'outputColorSpace', 'toneMapping', 'alpha', 'antialias', 'globalClippingPlanes', 'localClippingEnabled'], 'renderer');
  exact(view.renderer, { engine: 'THREE', revision: THREE.REVISION, outputColorSpace: 'srgb', toneMapping: 0, alpha: view.renderer.alpha, antialias: view.renderer.antialias, globalClippingPlanes: [], localClippingEnabled: false }); assert.equal(typeof view.renderer.alpha, 'boolean'); assert.equal(typeof view.renderer.antialias, 'boolean');
  const camera = view.camera; keys(camera, ['kind', 'position', 'target', 'up', 'quaternion', 'fov', 'zoom', 'aspect', 'near', 'far', 'filmGauge', 'filmOffset'], 'camera');
  for (const key of ['position', 'target', 'up']) finiteArray(camera[key], 3, key); finiteArray(camera.quaternion, 4, 'quaternion');
  assert.equal(camera.kind, 'PerspectiveCamera'); assert.equal(camera.fov, 38); assert.equal(camera.zoom, 1); assert.equal(camera.filmGauge, 35); assert.equal(camera.filmOffset, 0);
  assert.ok(Number.isFinite(camera.aspect) && camera.aspect > 0 && Number.isFinite(camera.near) && camera.near >= .01 && Number.isFinite(camera.far) && camera.far > camera.near);
  const actual = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far); actual.position.fromArray(camera.position); actual.up.fromArray(camera.up);
  assert.ok(actual.up.length() > 0 && actual.position.distanceTo(new THREE.Vector3(...camera.target)) > 0);
  actual.lookAt(new THREE.Vector3(...camera.target)); const expectedQ = actual.quaternion.clone(), capturedQ = new THREE.Quaternion(...camera.quaternion);
  assert.ok(Math.abs(capturedQ.length() - 1) <= 1e-8 && Math.abs(Math.abs(expectedQ.dot(capturedQ)) - 1) <= 1e-8, 'Actual camera quaternion disagrees with pose');
  actual.quaternion.copy(capturedQ); actual.updateProjectionMatrix(); actual.updateMatrixWorld(true);
  keys(view.viewport, ['cssWidth', 'cssHeight', 'drawingBufferWidth', 'drawingBufferHeight', 'pixelRatio'], 'viewport');
  for (const key of ['cssWidth', 'cssHeight', 'drawingBufferWidth', 'drawingBufferHeight']) assert.ok(Number.isSafeInteger(view.viewport[key]) && view.viewport[key] > 0);
  assert.ok(view.viewport.pixelRatio > 0 && view.viewport.pixelRatio <= 1.5 && Math.abs(camera.aspect - view.viewport.cssWidth / view.viewport.cssHeight) <= 1e-8);
  for (const axis of ['Width', 'Height']) assert.ok(Math.abs(view.viewport[`drawingBuffer${axis}`] - Math.floor(view.viewport[`css${axis}`] * view.viewport.pixelRatio)) <= 1);
  const crops = { points: 0, boundsCorners: 0, x: 0, y: 0, depth: 0, nonfinite: 0 };
  const projectPoint = (point, kind) => { const projected = new THREE.Vector3(...point).project(actual); if (!projected.toArray().every(Number.isFinite)) { crops.nonfinite++; crops[kind]++; return; }
    const outside = { x: Math.abs(projected.x) > 1 + 1e-9, y: Math.abs(projected.y) > 1 + 1e-9, depth: Math.abs(projected.z) > 1 + 1e-9 };
    if (Object.values(outside).some(Boolean)) { crops[kind]++; for (const [key, value] of Object.entries(outside)) if (value) crops[key]++; } };
  points.forEach(point => projectPoint(point, 'points'));
  for (const x of [bounds.minimum[0], bounds.maximum[0]]) for (const y of [bounds.minimum[1], bounds.maximum[1]]) for (const z of [bounds.minimum[2], bounds.maximum[2]]) projectPoint([x, y, z], 'boundsCorners');
  const preserved = /(?:^|-)(?:user|restored|inspection)(?:-|\.)/.test(name) || name.includes('-before-fit');
  const assertCompleteFit = !preserved && (/(?:^|-)(?:default|preset|fit)(?:-|\.)/.test(name) || name === 'actual-positions-01-current-package-normalized.json');
  if (assertCompleteFit) exact(crops, { points: 0, boundsCorners: 0, x: 0, y: 0, depth: 0, nonfinite: 0 }, `${name}: complete source is cropped`);
  if (assertCompleteFit) vectorEqual(camera.target, bounds.minimum.map((value, axis) => (value + bounds.maximum[axis]) / 2), `${name} complete-fit target`);
  const fitDirection = /(?:^|-)fit(?:-|\.)/.test(name);
  if (assertCompleteFit && !fitDirection) {
    // OrbitControls retains its constructor Y-up orbit basis and Spherical.makeSafe
    // clamps polar singularities. Rebuild that exact Three185 numerical result.
    const intended = new THREE.Vector3(...presets[request.cameraPreset]).normalize();
    const safe = new THREE.Spherical().setFromVector3(intended); safe.makeSafe();
    vectorEqual(basis(camera), new THREE.Vector3().setFromSpherical(safe).normalize().toArray(), `${name} preset direction after owned OrbitControls polar clamp`);
    vectorEqual(camera.up, request.cameraPreset === 'frontal' ? [0, 0, -1] : [0, 1, 0], `${name} preset up`);
  }
  documents.set(name, doc); results.push({ file: name, bytes: raw.length, sha256: sha(raw), frame: request.frame, filter: `${request.muscle}/${request.segment}`,
    exactSourcePointCount: points.length, sourceFileCount: groups.length, selectedRow: view.selectedRow?.id ?? null, viewport: view.viewport, camera: view.camera,
    sourceVerificationSequence: doc.sourceVerification.verificationSequence, sceneInstanceId: view.runtimeBinding.sceneInstanceId, assertCompleteFit, cropped: crops,
    evidenceScope: 'original_source_and_captured_camera_math_replay_only', browserRenderProofReestablished: false, pixelsAttested: false });
}
const pairResults = options.pairs.map(pair => {
  const before = documents.get(pair.before), after = documents.get(pair.after); assert.ok(before && after, `Missing explicit pair ${pair.before}:${pair.after}`);
  const a = before.view, b = after.view;
  if (pair.kind === 'fit') {
    vectorEqual(basis(a.camera), basis(b.camera), 'Fit retained direction'); vectorEqual(a.camera.up, b.camera.up, 'Fit retained up');
    exact(a.request, b.request); exact(a.layers, b.layers); exact(a.selectedRow, b.selectedRow); exact(a.sourceObject, b.sourceObject);
    exact(before.sourceVerification, after.sourceVerification, 'Fit must retain source event'); assert.equal(a.runtimeBinding.sceneInstanceId, b.runtimeBinding.sceneInstanceId, 'Fit replaced source scene');
    vectorEqual(b.camera.target, b.sourceObject.bounds.minimum.map((value, axis) => (value + b.sourceObject.bounds.maximum[axis]) / 2), 'Fit target is source bounds center');
    const result = results.find(item => item.file === pair.after); assert.equal(result.cropped.points, 0); assert.equal(result.cropped.boundsCorners, 0);
  } else {
    for (const key of Object.keys(a.camera)) { if (key === 'aspect') continue; if (['position', 'target', 'up', 'quaternion'].includes(key)) vectorEqual(a.camera[key], b.camera[key], `Retained ${key}`); else exact(a.camera[key], b.camera[key], `Retained camera ${key}`); }
    if (pair.kind === 'restore') {
      exact(a.request, b.request); exact(a.layers, b.layers); exact(a.selectedRow, b.selectedRow); exact(a.sourceObject, b.sourceObject); exact(before.sourceContext, after.sourceContext);
      assert.equal(after.sourceVerification.requestCacheMode, 'no-store'); assert.ok(after.sourceVerification.verificationSequence > before.sourceVerification.verificationSequence, 'Restored source event is not fresh');
      assert.notEqual(a.runtimeBinding.sceneInstanceId, b.runtimeBinding.sceneInstanceId, 'Restore reused source scene');
    } else {
      exact(before.sourceVerification, after.sourceVerification, 'Same verified source event required'); assert.equal(a.runtimeBinding.sceneInstanceId, b.runtimeBinding.sceneInstanceId, 'Material/row/resize action replaced scene');
      if (pair.kind === 'resize') { exact(a.request, b.request); exact(a.layers, b.layers); exact(a.selectedRow, b.selectedRow); exact(a.sourceObject, b.sourceObject); assert.notDeepEqual(a.viewport, b.viewport, 'Resize pair needs a changed actual viewport'); }
    }
  }
  return { ...pair, pass: true, cameraVectorTolerance: 1e-12, otherComparedFields: 'exact_except_aspect_for_retained_camera', browserObservationRequiredSeparately: true };
});
const output = { status: 'PASS', generatedAt: new Date().toISOString(), project, captures: captureDirectory,
  evidenceScope: 'offline_original_asset_current_build_and_captured_camera_projection_replay', actualBrowserExecutionByThisScript: false,
  privateActualRenderProofMintedByThisScript: false, pixelsAttested: false,
  build: expectedBuild, originalAssetPins, physicalRuntimeAuthority, mandatoryRuntimeAuthorityInputCount: physicalRuntimeAuthority.length,
  originalSourceProofSeparateFromWrapperBuild: true, sourceTotals: payload.totals.byFrame, captureCount: results.length, results, pairs: pairResults };
output.script = { path: new URL(import.meta.url).pathname, sha256: sha(positionedBytes(new URL(import.meta.url))) };
const qa59 = 'docs/qa/2026-10-05-implementation-59';
const capture1 = documents.get('actual-positions-01-current-package-normalized.json');
const capture2 = documents.get('actual-positions-02-current-package-transverse-fit.json');
const capture3 = documents.get('actual-positions-03-current-package-restored.json');
assert.ok(capture1 && capture2 && capture3 && documents.size === 3);
const comparable = doc => Object.fromEntries(Object.entries(doc.view).filter(([key]) => key !== 'runtimeBinding'));
exact(comparable(capture1), comparable(capture3), 'Restore preserves all ten observable view fields exactly, with fresh runtime binding separately');
assert.equal(capture1.view.request.cameraPreset, 'three_quarter');
assert.equal(capture2.view.request.cameraPreset, 'transverse');
vectorEqual(basis(capture2.view.camera), [0, 0, 1], 'Transverse captured source direction');
vectorEqual(capture2.view.camera.up, [0, 1, 0], 'Transverse captured up');
exact(capture1.sourceVerification, capture2.sourceVerification, 'Preset/Fit retained original verified source event');
assert.equal(capture1.view.runtimeBinding.sceneInstanceId, capture2.view.runtimeBinding.sceneInstanceId);
const packagePin = pin('package.json');
exact(packagePin, { path:'package.json', bytes:40345, sha256:'208fe6a1e92e9e2af82306d359ea5bb11226d27bcc701743bc8b9c9e9b50e585' });
const oldDOMPath = `${qa59}/actual-23-positions-old-package-refusal-complete.json`;
const oldDOM = json(oldDOMPath), oldReceipt = JSON.parse(oldDOM.restore);
assert.equal(oldDOM.canvases, 0); assert.equal(oldDOM.capture, '');
assert.ok(oldDOM.statuses.includes('Restore failed closed · Ronzano source view: renderer build or scientific scope changed'));
const oldPackage = oldReceipt.rendererBuild.inputs.find(item => item.path === 'package.json');
exact(oldPackage, {"path":"package.json","bytes":40210,"sha256":"8ab53acc6e3ac86015fb8aeb0bc1f9b93f4af49bd975fda5ec21d0b17511efde"}); assert.notEqual(oldPackage.sha256, packagePin.sha256);
const oldBuild = new Map(oldReceipt.rendererBuild.inputs.map(item => [item.path, item]));
assert.equal(oldBuild.size, 40); const buildChanges = physicalBuild.filter(item => JSON.stringify(item) !== JSON.stringify(oldBuild.get(item.path)));
assert.equal(buildChanges.length, 1); assert.equal(buildChanges[0].path, 'package.json');
const restoreDOMPath = `${qa59}/actual-24-positions-fresh-restore-status-observed.json`;
const restoreDOM = json(restoreDOMPath);
assert.equal(restoreDOM.canvases, 1);
assert.ok(restoreDOM.statuses.includes('Restored actual camera, row and layers after fresh verification of all23 source files.'));
const rechecked = [];
for (const [name, doc] of documents) {
  const build = doc.rendererBuild.inputs.map(item => { const actual = pin(item.path); exact(actual, item); return actual; });
  const sources = doc.sourceVerification.files.map(item => { const actual = pin(`public${item.path}`); assert.equal(actual.bytes, item.bytes); assert.equal(actual.sha256, item.sha256); return actual; });
  assert.equal(build.length, 40); assert.equal(sources.length, 23);
  rechecked.push({ file:name, buildActualPins:build, sourceActualPins:sources });
}
output.currentPackageI59Replay = {
  packagePin, threeActualCapturesAllRechecked:rechecked, actualBuildPinChecks:120, actualSourcePinChecks:69,
  restoredObservableViewFieldsAllTenExact:true, sourceVerificationEventAndSceneFresh:true,
  capture2TransversePresetAndFullFitIndependentlyChecked:true,
  isolatedFitRetainedDirectionPairObserved:false,
  presetAndFitBoundary:'Capture2 records Transverse then Fit; no separate pre-Fit capture is invented.',
  oldI56PackageRejection:{ DOM:pin(oldDOMPath), oldPackage, actualCurrentPackage:packagePin, oldBuildChangedPaths:buildChanges.map(item=>item.path), capturedCanvasCount:oldDOM.canvases, captureEmpty:true },
  freshRestoreStatus:{ DOM:pin(restoreDOMPath), observedExactStatus:restoreDOM.statuses.find(item=>item.startsWith('Restored actual camera')) },
  originalQA56ReplayScript:{ path:'docs/qa/2026-10-05-implementation-56/actual-positions-replay.mjs', ...pin('docs/qa/2026-10-05-implementation-56/actual-positions-replay.mjs') },
  noNativeBrowserExecutionOrPixelAttestation:true
};
output.positionedReadContract = positionedReadContract;

if (options.output) fs.writeFileSync(path.resolve(options.output), `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ status: output.status, captureCount: results.length, pairCount: pairResults.length, completeFitCaptures: results.filter(item => item.assertCompleteFit).length, output: options.output ?? null, pixelsAttested: false }, null, 2)}\n`);
