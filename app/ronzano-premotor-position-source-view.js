import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import reference from '../data/ronzano-premotor-position-reference-0.1.json' with { type: 'json' };
import iteration from '../data/research-renderer-runtime-inputs-2.91.json' with { type: 'json' };
import { displayCoordinate, pointReceipt, positionGroupsFor, sha256Hex, validateRonzanoPositionPayload } from './ronzano-premotor-position-data.js';
import { computePerspectiveSphereFitDistance } from './morphology-viewport-scale.js';

const check = (ok, message) => { if (!ok) throw new Error(`Ronzano source view: ${message}`); };
const copy = value => structuredClone(value);
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function equal(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const names = Object.keys(a); return names.length === Object.keys(b).length && names.every(name => Object.hasOwn(b, name) && equal(a[name], b[name]));
}
function fields(value, names, label) { check(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name)), `${label} fields changed`); }
const vector = (value, length = 3) => Array.isArray(value) && value.length === length && Object.keys(value).length === length && Array.from({ length }, (_, index) => index).every(index => Object.hasOwn(value, index) && Number.isFinite(value[index]));
const close = (a, b, epsilon = 1e-8) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= epsilon;
const source = freeze(copy(reference));
const sources = new WeakMap(), objects = new WeakMap(), renders = new WeakMap(), viewports = new WeakMap();
let sourceSequence = 0, renderSequence = 0;
const abort = signal => { if (signal?.aborted) throw new DOMException('Ronzano source operation cancelled', 'AbortError'); };
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
export const RONZANO_SOURCE_VIEW_BUILD = freeze({ applicationVersion: '2.91.0-research.1', scope: 'ronzano_actual_source_points_camera_layers_and_row',
  inputs: buildPaths.map(path => { const rows = iteration.authoritativeInputs.filter(row => row.path === path);
    check(rows.length === 1 && Number.isSafeInteger(rows[0].bytes) && rows[0].bytes > 0 && /^[a-f0-9]{64}$/.test(rows[0].sha256), `current build input unavailable: ${path}`);
    return { path, bytes: rows[0].bytes, sha256: rows[0].sha256 }; }) });
export const RONZANO_CAMERA_PRESETS = freeze(['three_quarter', 'transverse', 'frontal', 'lateral']);
export const RONZANO_POINT_COLORS = freeze({ LG: 0x55b5df, TA: 0xf2ad4f });
const scope = freeze({ observationUnit: 'source_file_id_plus_one_based_excel_row', objectClaim: 'labelled_cell_position_only',
  crossFramePointIdentity: 'not_established', crossSourceIdentity: 'not_established', animalIdentity: 'unknown', experimentIdentity: 'unknown',
  laboratoryIdentity: 'unknown', rowAcquisitionMethod: 'unknown', pointRadiusAuthority: 'display_pixels_only',
  biologicalCellGeometryCount: 0, morphologyCount: 0, sameCellInternalObjectCount: 0, M2Count: 0, M4Count: 0,
  registrationCount: 0, atlasJoinCount: 0, biologicalMeasurements: 0, adultTransfer: 'not_established', sharedPhysicalDisplayScale: false });
function proof(token) { const value = sources.get(token); check(value && Object.isFrozen(token) && Object.isFrozen(value.payload), 'exact immutable payload has no private byte proof'); return value; }
function requestValid(request) {
  fields(request, ['frame', 'muscle', 'segment', 'cameraPreset', 'pointSizePixels', 'layers'], 'request');
  check(['raw', 'normalized'].includes(request.frame) && ['all', 'LG', 'TA'].includes(request.muscle)
    && ['all', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'].includes(request.segment) && RONZANO_CAMERA_PRESETS.includes(request.cameraPreset), 'source filter or camera preset is unsupported');
  check(Number.isInteger(request.pointSizePixels) && request.pointSizePixels >= 1 && request.pointSizePixels <= 7, 'point display size is invalid');
  fields(request.layers, ['points', 'axes'], 'requested layers'); check(request.layers.points === true && typeof request.layers.axes === 'boolean', 'point or display-axis visibility is invalid');
}
export async function readVerifiedRonzanoPositions({ fetchImpl = fetch, signal, forceReload = false } = {}) {
  abort(signal); const requestCacheMode = forceReload ? 'no-store' : 'default';
  const descriptors = [{ id: source.assetId, path: source.derivedAsset.browserUrl, bytes: source.derivedAsset.bytes, sha256: source.derivedAsset.sha256 },
    ...source.sourceFiles.map(file => ({ id: file.id, path: file.browserUrl, bytes: file.bytes, sha256: file.sha256 }))];
  const loaded = await Promise.all(descriptors.map(async descriptor => {
    const response = await fetchImpl(descriptor.path, { signal, cache: requestCacheMode }); abort(signal);
    check(response.ok, `source request failed (${response.status}) for ${descriptor.id}`);
    const bytes = await response.arrayBuffer(); abort(signal);
    check(bytes.byteLength === descriptor.bytes && await sha256Hex(bytes) === descriptor.sha256, `source bytes differ for ${descriptor.id}`); abort(signal);
    return bytes;
  }));
  const payload = JSON.parse(new TextDecoder().decode(loaded[0])); validateRonzanoPositionPayload(payload, source); abort(signal);
  const verificationSequence = ++sourceSequence, token = freeze({ kind: 'verified_ronzano_position_sources', verificationSequence });
  sources.set(token, { payload: freeze(payload), verification: freeze({ status: 'verified', verificationSequence, verifiedAt: new Date().toISOString(), requestCacheMode,
    scope: 'actual_derived_xyz_payload_and_all_22_original_workbook_bytes', files: descriptors }) });
  return token;
}
export function ronzanoPositionVerification(token) { return copy(proof(token).verification); }
export function ronzanoPositionPayload(token) { return proof(token).payload; }
export function ronzanoDisplayTransform(frame) {
  check(['raw', 'normalized'].includes(frame), 'source frame is unsupported');
  return { sourceFrame: frame, illustrationalScale: frame === 'normalized' ? [1700, 900, 1] : [1, 1, 1], viewerScale: 0.01,
    coordinatePrecision: 'Float32_uploaded_positions', displayUse: 'viewer_only', measurementAuthorized: false, registrationCount: 0 };
}
function rowFor(token, request, rowId) {
  if (rowId === null) return null;
  check(typeof rowId === 'string', 'selected row identity is invalid');
  const match = /^(.+):row:([1-9]\d*)$/.exec(rowId); check(match, 'selected row locator is invalid');
  const group = positionGroupsFor(proof(token).payload, request).find(item => item.sourceFileId === match[1]);
  check(group && Number.isSafeInteger(Number(match[2])) && Number(match[2]) <= group.points.length, 'selected row is not in the current source frame and filters');
  return copy(pointReceipt(group, Number(match[2]) - 1, request.frame));
}
export function ronzanoSelectedRow(token, request, rowId) { requestValid(request); return rowFor(token, request, rowId); }
export function browseRonzanoRow(token, request, currentId, movement) {
  requestValid(request); check(['first', 'last', 'next', 'previous', 'clear'].includes(movement), 'row navigation is unsupported');
  if (movement === 'clear') return null;
  const groups = positionGroupsFor(proof(token).payload, request), count = groups.reduce((sum, group) => sum + group.points.length, 0);
  if (!count) return null;
  let index = 0;
  if (currentId !== null) { rowFor(token, request, currentId); for (const group of groups) { const prefix = `${group.sourceFileId}:row:`;
    if (currentId.startsWith(prefix)) { index += Number(currentId.slice(prefix.length)) - 1; break; } index += group.points.length; } }
  index = movement === 'first' ? 0 : movement === 'last' ? count - 1 : movement === 'next' ? Math.min(count - 1, currentId === null ? 0 : index + 1) : Math.max(0, index - 1);
  for (const group of groups) { if (index < group.points.length) return pointReceipt(group, index, request.frame).id; index -= group.points.length; }
  return null;
}
export function createRonzanoPositionObject(token, request) {
  requestValid(request); const groups = positionGroupsFor(proof(token).payload, request), root = new THREE.Group();
  root.name = 'ronzano-private-source-coordinate-points';
  for (const group of groups) {
    const positions = new Float32Array(group.points.length * 3);
    group.points.forEach((point, index) => positions.set(displayCoordinate(point, request.frame).map(value => value * 0.01), index * 3));
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.computeBoundingSphere();
    const material = new THREE.PointsMaterial({ color: RONZANO_POINT_COLORS[group.muscle], size: request.pointSizePixels,
      sizeAttenuation: false, transparent: true, opacity: 0.76, depthWrite: false });
    const object = new THREE.Points(geometry, material); object.name = group.sourceFileId; object.renderOrder = Number(group.segment.slice(1)); object.frustumCulled = false;
    object.onAfterRender = () => objects.get(root)?.activeDraws?.add(group.sourceFileId); root.add(object);
  }
  objects.set(root, { token, groups, frame: request.frame, muscle: request.muscle, segment: request.segment,
    members: [...root.children], callbacks: root.children.map(object => ({ before: object.onBeforeRender, after: object.onAfterRender })) });
  return root;
}
export function computeRonzanoSourceCameraFit({ bounds, aspect, preset = 'three_quarter', direction, up }) {
  check(bounds && vector(bounds.minimum) && vector(bounds.maximum) && bounds.minimum.every((value, axis) => value <= bounds.maximum[axis]), 'finite ordered complete bounds are required');
  check(Number.isFinite(aspect) && aspect > 0 && RONZANO_CAMERA_PRESETS.includes(preset), 'fit aspect or preset is invalid');
  const box = new THREE.Box3(new THREE.Vector3(...bounds.minimum), new THREE.Vector3(...bounds.maximum)), sphere = box.getBoundingSphere(new THREE.Sphere());
  check(Number.isFinite(sphere.radius) && sphere.radius > 0, 'source points have no finite positive extent');
  const basis = { three_quarter: [1.35, 0.75, 1.65], transverse: [0, 0, 1], frontal: [0, 1, 0], lateral: [1, 0, 0] };
  const expectedUp = preset === 'frontal' ? [0, 0, -1] : [0, 1, 0];
  check(vector(direction ?? basis[preset]) && vector(up ?? expectedUp), 'fit camera basis is invalid');
  const offset = new THREE.Vector3(...(direction ?? basis[preset])), cameraUp = new THREE.Vector3(...(up ?? expectedUp));
  check(Number.isFinite(offset.length()) && offset.length() > 0 && Number.isFinite(cameraUp.length()) && cameraUp.length() > 0, 'fit camera basis is degenerate');
  offset.normalize(); cameraUp.normalize(); check(new THREE.Vector3().crossVectors(offset, cameraUp).length() > 1e-12, 'fit camera basis is collinear');
  const distance = Math.max(0.1, computePerspectiveSphereFitDistance({ radiusViewerUnit: sphere.radius, verticalFovDegrees: 38, aspect }));
  const near = Math.max(sphere.radius / 1000, 0.01), far = Math.max(sphere.radius * 20, distance + sphere.radius * 2, 1000);
  check(Number.isFinite(distance) && Number.isFinite(far) && distance - sphere.radius > near, 'complete source cannot fit the camera clipping range');
  return { target: sphere.center.toArray(), position: sphere.center.clone().add(offset.multiplyScalar(distance)).toArray(), up: cameraUp.toArray(),
    distance, radius: sphere.radius, fov: 38, near, far };
}
function verifyObject(token, root, request) {
  root.updateWorldMatrix(true, true);
  const owned = objects.get(root); check(owned && owned.token === token && root.isGroup && root.visible && equal(root.matrix.toArray(), new THREE.Matrix4().toArray()), 'current source object has no private source ownership or placement');
  check(owned.frame === request.frame && owned.muscle === request.muscle && owned.segment === request.segment && root.children.length === owned.groups.length, 'source object frame/filter inventory changed');
  for (let groupIndex = 0; groupIndex < owned.groups.length; groupIndex++) {
    const group = owned.groups[groupIndex], object = root.children[groupIndex], attr = object.geometry?.getAttribute('position'), material = object.material;
    check(object === owned.members[groupIndex] && object.isPoints && object.visible && object.name === group.sourceFileId && object.layers.mask === 1 && object.frustumCulled === false
      && object.onBeforeRender === owned.callbacks[groupIndex].before && object.onAfterRender === owned.callbacks[groupIndex].after && equal(object.matrix.toArray(), new THREE.Matrix4().toArray())
      && object.renderOrder === Number(group.segment.slice(1)) && attr?.itemSize === 3 && attr.count === group.points.length && attr.array instanceof Float32Array,
    'actual point geometry or source row order changed');
    check(object.geometry.index === null && object.geometry.drawRange.start === 0 && object.geometry.drawRange.count === Infinity && object.geometry.groups.length === 0
      && Object.keys(object.geometry.attributes).length === 1 && Object.keys(object.geometry.morphAttributes).length === 0 && !object.geometry.isInstancedBufferGeometry, 'source point draw range, indices or attributes changed');
    check(material?.isPointsMaterial && material.visible && material.color.getHex() === RONZANO_POINT_COLORS[group.muscle] && material.size === request.pointSizePixels
      && material.sizeAttenuation === false && material.transparent === true && material.opacity === 0.76 && material.depthWrite === false && material.depthTest === true
      && material.map === null && material.alphaMap === null && material.alphaTest === 0 && material.clippingPlanes === null && material.vertexColors === false
      && material.onBeforeCompile === THREE.Material.prototype.onBeforeCompile, 'actual display material changed');
    group.points.forEach((point, index) => { const xyz = displayCoordinate(point, request.frame); check(xyz.every((value, axis) => attr.array[index * 3 + axis] === Math.fround(value * 0.01)), 'actual uploaded point differs from the exact source row'); });
    object.geometry.computeBoundingBox();
  }
  root.updateWorldMatrix(true, true); check(equal(root.matrixWorld.toArray(), new THREE.Matrix4().toArray()), 'source-local points acquired a world transform');
  const bounds = new THREE.Box3().setFromObject(root), pointCount = owned.groups.reduce((sum, group) => sum + group.points.length, 0);
  check(pointCount > 0 && !bounds.isEmpty(), 'zero source points cannot attest a rendered view');
  return { bounds: { minimum: bounds.min.toArray(), maximum: bounds.max.toArray() }, pointCount,
    sourceFileIds: owned.groups.map(group => group.sourceFileId), transform: ronzanoDisplayTransform(request.frame), worldMatrix: root.matrixWorld.toArray() };
}
function cameraValid(camera) {
  fields(camera, ['kind', 'position', 'target', 'up', 'quaternion', 'fov', 'zoom', 'aspect', 'near', 'far', 'filmGauge', 'filmOffset'], 'camera');
  check(camera.kind === 'PerspectiveCamera' && vector(camera.position) && vector(camera.target) && vector(camera.up) && vector(camera.quaternion, 4)
    && camera.fov === 38 && camera.zoom === 1 && camera.filmGauge === 35 && camera.filmOffset === 0 && Number.isFinite(camera.aspect) && camera.aspect > 0
    && Number.isFinite(camera.near) && camera.near >= 0.01 && Number.isFinite(camera.far) && camera.far > camera.near, 'actual camera projection is invalid');
  const position = new THREE.Vector3(...camera.position), target = new THREE.Vector3(...camera.target), up = new THREE.Vector3(...camera.up), quaternion = new THREE.Quaternion(...camera.quaternion);
  check(position.distanceTo(target) > camera.near && close(up.length(), 1) && new THREE.Vector3().crossVectors(position.clone().sub(target), up).length() > 1e-12,
    'actual camera basis is degenerate');
  const expected = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(position, target, up));
  check(close(quaternion.length(), 1) && close(Math.abs(quaternion.dot(expected)), 1), 'actual camera quaternion disagrees with pose');
}
function viewportValid(viewport, camera) {
  fields(viewport, ['cssWidth', 'cssHeight', 'drawingBufferWidth', 'drawingBufferHeight', 'pixelRatio'], 'viewport');
  check(['cssWidth', 'cssHeight', 'drawingBufferWidth', 'drawingBufferHeight'].every(key => Number.isSafeInteger(viewport[key]) && viewport[key] > 0)
    && Number.isFinite(viewport.pixelRatio) && viewport.pixelRatio > 0 && viewport.pixelRatio <= 1.5 && close(camera.aspect, viewport.cssWidth / viewport.cssHeight)
    && Math.abs(viewport.drawingBufferWidth - Math.floor(viewport.cssWidth * viewport.pixelRatio)) <= 1
    && Math.abs(viewport.drawingBufferHeight - Math.floor(viewport.cssHeight * viewport.pixelRatio)) <= 1, 'actual viewport disagrees with projection');
}
function contextFor(frame) { return { releaseId: source.releaseId, sourceDoi: source.source.doi, frame,
  frameDenominator: copy(source.sourceObjectContract.representations[frame]), coordinateFrame: copy(source.coordinateFrames[frame]),
  rowIdentity: source.sourceObjectContract.rowIdentity, rights: copy(source.rights), relationshipBoundary: copy(source.relationshipBoundary) }; }
/** Explicit descriptor checks return facts only; they cannot mint actual-view authority. */
export function validateRonzanoPositionDescriptor(token, { request, root, scene, camera, controls, renderer, axes, selectedRowId = null }) {
  proof(token); requestValid(request);
  check(camera.isPerspectiveCamera && camera.layers.mask === 1 && camera.parent === null && camera.matrixAutoUpdate && camera.matrixWorldAutoUpdate && equal(camera.scale.toArray(), [1, 1, 1])
    && controls.object === camera && root.parent === scene && scene.isScene && scene.visible
    && scene.children.length === 2 && scene.children.includes(root) && scene.children.includes(axes) && scene.overrideMaterial === null && scene.fog === null
    && scene.background?.isColor && scene.background.getHex() === 0x0b1513 && root.layers.mask === 1, 'source scene inventory, drawing layers or override changed');
  check(axes?.isLineSegments && axes.parent === scene && axes.visible === request.layers.axes, 'actual display axis layer disagrees with request');
  const sourceObject = verifyObject(token, root, request), rect = renderer.domElement.getBoundingClientRect(), size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const actualCamera = { kind: 'PerspectiveCamera', position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(),
    fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset };
  const viewport = { cssWidth: Math.round(rect.width), cssHeight: Math.round(rect.height), drawingBufferWidth: size.x, drawingBufferHeight: size.y, pixelRatio: renderer.getPixelRatio() };
  cameraValid(actualCamera); viewportValid(viewport, actualCamera);
  const projection = new THREE.PerspectiveCamera(actualCamera.fov, actualCamera.aspect, actualCamera.near, actualCamera.far);
  check(camera.projectionMatrix.toArray().every((value, index) => close(value, projection.projectionMatrix.elements[index], 1e-12)), 'actual projection matrix disagrees with camera fields');
  const attributes = renderer.getContext().getContextAttributes();
  const actualRenderer = { engine: 'THREE', revision: THREE.REVISION, outputColorSpace: renderer.outputColorSpace, toneMapping: renderer.toneMapping, alpha: attributes?.alpha, antialias: attributes?.antialias,
    globalClippingPlanes: renderer.clippingPlanes.map(plane => ({ normal: plane.normal.toArray(), constant: plane.constant })), localClippingEnabled: renderer.localClippingEnabled };
  check(actualRenderer.outputColorSpace === 'srgb' && actualRenderer.toneMapping === 0 && typeof actualRenderer.alpha === 'boolean' && typeof actualRenderer.antialias === 'boolean', 'actual renderer configuration is invalid');
  check(actualRenderer.globalClippingPlanes.length === 0 && actualRenderer.localClippingEnabled === false, 'source point shader clipping changed');
  return { request: copy(request), camera: actualCamera, viewport, renderer: actualRenderer, layers: { points: root.visible, axes: axes.visible }, sourceObject, selectedRow: rowFor(token, request, selectedRowId) };
}
export function createRonzanoPositionRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewports.set(renderer, { binding: null, render: renderer.render, getContext: renderer.getContext, context: renderer.getContext() }); return renderer;
}
export function bindRonzanoPositionViewport(renderer, token, { scene, root, camera, controls, axes }) {
  const owned = viewports.get(renderer); check(owned && renderer instanceof THREE.WebGLRenderer && renderer.constructor === THREE.WebGLRenderer
    && renderer.render === owned.render && renderer.getContext === owned.getContext, 'renderer has no privately created real WebGL authority');
  check(objects.get(root)?.token === token && controls instanceof OrbitControls && controls.object === camera && camera instanceof THREE.PerspectiveCamera
    && scene instanceof THREE.Scene && root.parent === scene && axes.parent === scene, 'viewport has no exact private source scene/camera/control binding');
  owned.binding = { token, scene, root, camera, controls, axes };
}
export function renderRonzanoPositionViewport(renderer) {
  const owned = viewports.get(renderer); check(owned?.binding && renderer.render === owned.render && renderer.getContext === owned.getContext
    && !owned.context.isContextLost(), 'owned source viewport is unavailable');
  const { scene, root, camera } = owned.binding, objectProof = objects.get(root); check(objectProof, 'owned source points are unavailable');
  objectProof.activeDraws = new Set(); owned.render.call(renderer, scene, camera); const drawn = [...objectProof.activeDraws]; objectProof.activeDraws = null;
  return drawn;
}
export function disposeRonzanoPositionRenderer(renderer) { viewports.delete(renderer); renderer.dispose(); }
export function attestRonzanoRenderedView(token, actual) {
  const { request, root, scene, camera, controls, renderer, axes, sceneInstanceId, revision } = actual, current = proof(token), owned = viewports.get(renderer);
  check(owned?.binding && renderer instanceof THREE.WebGLRenderer && renderer.constructor === THREE.WebGLRenderer
    && renderer.render === owned.render && renderer.getContext === owned.getContext
    && owned.binding.token === token && ['root', 'scene', 'camera', 'controls', 'axes'].every(key => owned.binding[key] === actual[key])
    && renderer.domElement.isConnected && !renderer.getContext().isContextLost(), 'actual view has no privately owned real WebGL render authority');
  check(/^ronzano-scene-[1-9]\d*$/.test(sceneInstanceId) && Number.isSafeInteger(revision) && revision > 0, 'actual scene binding is invalid');
  const facts = validateRonzanoPositionDescriptor(token, { ...actual, request, root, scene, camera, controls, renderer, axes });
  // Reupload the verified arrays and execute this owned real source render now;
  // a public descriptor or an earlier draw count cannot substitute for a draw.
  root.children.forEach(object => { object.geometry.getAttribute('position').needsUpdate = true; });
  const drawn = renderRonzanoPositionViewport(renderer);
  check(equal([...drawn].sort(), [...facts.sourceObject.sourceFileIds].sort()) && renderer.info.render.calls >= drawn.length && !renderer.getContext().isContextLost(), 'the owned render did not draw every admitted source point group');
  const view = { status: 'rendered_source_points', runtimeBinding: { sourceVerificationSequence: current.verification.verificationSequence, sceneInstanceId, revision, renderSequence: ++renderSequence },
    ...facts, drawing: { authority: 'owned_real_webgl_render_of_verified_uploaded_position_rows', sourceFileIds: drawn, submittedPointCount: facts.sourceObject.pointCount, pixelsAttested: false } };
  const document = freeze({ documentType: 'ronzano_premotor_position_actual_view_receipt', schemaVersion: '0.1.0', applicationVersion: RONZANO_SOURCE_VIEW_BUILD.applicationVersion,
    generatedAt: new Date().toISOString(), rendererBuild: copy(RONZANO_SOURCE_VIEW_BUILD), sourceVerification: copy(current.verification), sourceContext: contextFor(request.frame), scientificScope: copy(scope), view });
  const rendered = freeze({ kind: 'attested_ronzano_source_view', renderSequence }); renders.set(rendered, { token, root, document }); return rendered;
}
function renderProof(rendered) { const current = renders.get(rendered); check(current && Object.isFrozen(rendered), 'actual view has no private rendered-source proof'); return current; }
export function captureRonzanoSourceView(rendered) { return copy(renderProof(rendered).document); }
export function validateRonzanoSourceViewReplay(token, document) {
  const current = proof(token);
  fields(document, ['documentType', 'schemaVersion', 'applicationVersion', 'generatedAt', 'rendererBuild', 'sourceVerification', 'sourceContext', 'scientificScope', 'view'], 'document');
  check(document.documentType === 'ronzano_premotor_position_actual_view_receipt' && document.schemaVersion === '0.1.0' && document.applicationVersion === RONZANO_SOURCE_VIEW_BUILD.applicationVersion
    && typeof document.generatedAt === 'string' && Number.isFinite(Date.parse(document.generatedAt)), 'unsupported saved view document');
  check(equal(document.rendererBuild, RONZANO_SOURCE_VIEW_BUILD) && equal(document.scientificScope, scope), 'renderer build or scientific scope changed');
  const saved = document.sourceVerification; fields(saved, ['status', 'verificationSequence', 'verifiedAt', 'requestCacheMode', 'scope', 'files'], 'source verification');
  check(saved.status === 'verified' && Number.isSafeInteger(saved.verificationSequence) && saved.verificationSequence > 0
    && typeof saved.verifiedAt === 'string' && Number.isFinite(Date.parse(saved.verifiedAt)) && ['default', 'no-store'].includes(saved.requestCacheMode)
    && saved.scope === current.verification.scope && equal(saved.files, current.verification.files), 'saved source-byte event or workbook roster changed');
  const view = document.view; fields(view, ['status', 'runtimeBinding', 'request', 'camera', 'viewport', 'renderer', 'layers', 'sourceObject', 'selectedRow', 'drawing'], 'view');
  fields(view.runtimeBinding, ['sourceVerificationSequence', 'sceneInstanceId', 'revision', 'renderSequence'], 'runtime binding');
  check(view.status === 'rendered_source_points' && view.runtimeBinding.sourceVerificationSequence === saved.verificationSequence
    && /^ronzano-scene-[1-9]\d*$/.test(view.runtimeBinding.sceneInstanceId) && ['revision', 'renderSequence'].every(key => Number.isSafeInteger(view.runtimeBinding[key]) && view.runtimeBinding[key] > 0), 'saved render binding is invalid');
  requestValid(view.request); cameraValid(view.camera); viewportValid(view.viewport, view.camera);
  check(equal(document.sourceContext, contextFor(view.request.frame)) && equal(view.selectedRow, rowFor(token, view.request, view.selectedRow?.id ?? null)), 'source frame, file/row or missing identity changed');
  fields(view.renderer, ['engine', 'revision', 'outputColorSpace', 'toneMapping', 'alpha', 'antialias', 'globalClippingPlanes', 'localClippingEnabled'], 'renderer');
  check(view.renderer.engine === 'THREE' && view.renderer.revision === THREE.REVISION && view.renderer.outputColorSpace === 'srgb' && view.renderer.toneMapping === 0
    && typeof view.renderer.alpha === 'boolean' && typeof view.renderer.antialias === 'boolean' && equal(view.renderer.globalClippingPlanes, []) && view.renderer.localClippingEnabled === false
    && equal(view.layers, view.request.layers), 'saved renderer or actual layers changed');
  const root = createRonzanoPositionObject(token, view.request);
  try { check(equal(view.sourceObject, verifyObject(token, root, view.request)), 'uploaded source points, bounds or display transform changed');
    fields(view.drawing, ['authority', 'sourceFileIds', 'submittedPointCount', 'pixelsAttested'], 'source drawing');
    check(view.drawing.authority === 'owned_real_webgl_render_of_verified_uploaded_position_rows' && equal([...view.drawing.sourceFileIds].sort(), [...view.sourceObject.sourceFileIds].sort())
      && view.drawing.submittedPointCount === view.sourceObject.pointCount && view.drawing.pixelsAttested === false, 'saved source drawing inventory or pixel scope changed'); }
  finally { disposeRonzanoPositionObject(root); }
  return copy(view);
}
export function assertRonzanoSourceViewApplied(saved, rendered, previousToken) {
  const actual = renderProof(rendered); return compareRonzanoSourceViewReplayApplied(saved, actual.token, actual.document, previousToken);
}
/** Replay comparison is separate from actual rendered-view authority. */
export function compareRonzanoSourceViewReplayApplied(saved, currentToken, actualDocument, previousToken) {
  const current = proof(currentToken), previous = proof(previousToken); validateRonzanoSourceViewReplay(currentToken, saved); validateRonzanoSourceViewReplay(currentToken, actualDocument);
  const adapt = view => { const value = copy(view); delete value.runtimeBinding; delete value.viewport; delete value.camera.aspect; return value; };
  const equivalent = (a, b) => typeof a === 'number' && typeof b === 'number' ? close(a, b)
    : a && b && typeof a === 'object' && typeof b === 'object' ? Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.hasOwn(b, key) && equivalent(a[key], b[key])) : a === b;
  check(equivalent(adapt(saved.view), adapt(actualDocument.view)), 'restored actual camera, row, layers or source bounds differ');
  check(current.verification.requestCacheMode === 'no-store' && current.verification.verificationSequence > previous.verification.verificationSequence, 'restore did not freshly verify all23 source files'); return true;
}
export function sameRonzanoCameraForCapture(a, b) {
  if (!a || !b || Object.keys(a).length !== Object.keys(b).length) return false;
  return Object.keys(a).every(key => ['position', 'target', 'up', 'quaternion'].includes(key)
    ? vector(a[key], key === 'quaternion' ? 4 : 3) && vector(b[key], key === 'quaternion' ? 4 : 3) && a[key].every((value, index) => close(value, b[key][index], 1e-12)) : a[key] === b[key]);
}
export function disposeRonzanoPositionObject(root) { root.traverse(object => { object.geometry?.dispose(); if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose()); }); objects.delete(root); }
