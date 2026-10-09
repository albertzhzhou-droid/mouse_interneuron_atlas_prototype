import { Matrix4, Quaternion, Vector3 } from "three";
import iteration from "../data/research-renderer-runtime-inputs-2.91.json" with { type: "json" };
import microns from "../data/microns-observed-cell-nucleus-reference-0.1.json" with { type: "json" };
import micronsClip from "../data/microns-source-native-clipping-0.1.json" with { type: "json" };
import { validateMicronsClipState, buildMicronsWorldClippingPlane } from "./microns-source-native-clipping.js";
import { mainSceneMorphologyVerification } from "./main-scene-morphology-verification.js";
import { MAIN_SCENE_AUXILIARY_PATHS, mainSceneAuxiliaryExpected, mainSceneAuxiliaryProof } from "./main-scene-auxiliary-verification.js";
import { indexSwcNeurites } from "./morphology-neurite-inspection.js";

const applicationVersion = "2.91.0-research.1";
const inputPaths = ["app/SceneCanvas.tsx", "app/AtlasPrototype.tsx", "app/atlas-types.ts", "app/ObservedMorphologyRouteLibrary.tsx", "data/chen-dai-planar-morphology-routes-0.1.json", "data/pv-independent-morphology-routes-0.1.json", "app/MorphologySourceViewControls.tsx",
  "app/main-scene-source-view.js", "app/main-scene-state-import.js", "app/main-scene-export.js", "app/main-scene-auxiliary-verification.js", "app/main-scene-morphology-verification.js",
  "app/morphology-geometry-verification.js", "app/morphology-source-frame-runtime.js", "app/morphology-source-identity.js",
  "app/source-object-identity.js", "app/source-local-morphology-geometry.js", "app/atlas-reference-geometry.js",
  "app/morphology-neurite-inspection.js", "app/MorphologyNeuriteInspector.tsx", "app/morphology-neurite-inspector.css", "app/morphology-viewport-scale.js", "app/main-scene-source-camera-fit.js",
  "app/neurolucida-dat-swc-crosswalk.js", "app/microns-source-native-clipping.js", "app/globals.css", "app/academic-interface.css", "app/ResearchCollectionPage.tsx", "app/ResearchRoutePage.tsx", "app/SiteNavigation.tsx", "app/site-navigation.ts", "app/site-navigation.css", "app/research-pages.css", "app/morphology-source-view.css", "package-lock.json",
  "data/neuromorpho-census-main-scene-index-0.1.json", "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json",
  "data/microns-observed-cell-nucleus-reference-0.1.json", "data/microns-source-native-clipping-0.1.json", "data/neurolucida-dat-swc-crosswalk-0.1.json"];
export const MAIN_SCENE_SOURCE_VIEW_BUILD = Object.freeze({ applicationVersion, scope: "main_scene_actual_camera_layers_and_source_assets",
  inputs: Object.freeze(inputPaths.map(path => {
    const rows = iteration.authoritativeInputs.filter(row => row.path === path);
    if (rows.length !== 1) throw new Error(`Main scene view: build input is unavailable: ${path}`);
    return Object.freeze({ path, bytes: rows[0].bytes, sha256: rows[0].sha256 });
  })) });
const scope = { morphologyObservationUnit: "repository_morphology_record", registrationCount: 0, crossSourceJoinCount: 0,
  neuroMorphoSamePhysicalCellIdentity: false, neuroMorphoSameSpecimenInternalObjectCount: 0, inferredMissingCoordinateCount: 0,
  sourceAxesAreAnatomicalAxes: false, displayTransformUse: "viewer_only", sharedPhysicalScale: false,
  pixelIdenticalAcrossViewportSizes: false, inspectionAvailableInMainScene: true, inspectionAuthority: "exact_swc_parent_path_and_descendant_edges" };
export function mainSceneViewEqual(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && mainSceneViewEqual(a[key], b[key]));
}
const check = (ok, reason) => { if (!ok) throw new Error(`Main scene view: ${reason}`); };
const vector = (v, n = 3) => Array.isArray(v) && v.length === n && Object.keys(v).length === n && v.every(Number.isFinite);
export const MAIN_SCENE_VIEW_NUMERIC_TOLERANCE = 1e-8;
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= Math.max(MAIN_SCENE_VIEW_NUMERIC_TOLERANCE, Math.abs(b) * MAIN_SCENE_VIEW_NUMERIC_TOLERANCE);
const inspectionIndexes = new WeakMap();
function inspectionIndex(geometry) {
  if (!inspectionIndexes.has(geometry)) inspectionIndexes.set(geometry, indexSwcNeurites(geometry));
  return inspectionIndexes.get(geometry);
}
function keys(value, fields, name) {
  check(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === fields.length && fields.every(key => Object.hasOwn(value, key)), `${name} fields are incomplete or unsupported`);
}
function canonicalProof(proof) { const rest = { ...proof }; delete rest.verificationSequence; return rest; }
function sourceProof(proof) { const rest = { ...proof }; delete rest.verificationSequence; delete rest.mainSceneVerificationSequence; delete rest.verifiedAt; delete rest.requestCacheMode; return rest; }
function validate(record, geometry, view, revision) {
  keys(view, ["runtimeBinding", "request", "camera", "viewport", "renderer", "clipping", "layers", "sourceObject", "inspection"], "view");
  const binding = view.runtimeBinding;
  keys(binding, ["neuronId", "geometrySha256", "sceneInstanceId", "revision"], "runtime binding");
  check(binding.neuronId === record.neuronId && binding.geometrySha256 === record.geometry.sha256 && /^main-scene-runtime-[1-9]\d*$/.test(binding.sceneInstanceId)
    && Number.isSafeInteger(binding.revision) && binding.revision > 0, "source or scene binding changed");
  const request = view.request;
  keys(request, ["view", "sliceZ", "mode", "layers", "micronsClipping", "evidenceFilter"], "request");
  check(["home", "cell_detail", "microns_observed_reference", "internal_reference", "dorsal", "right", "transverse"].includes(request.view)
    && Number.isFinite(request.sliceZ) && request.sliceZ >= -20 && request.sliceZ <= 20 && Number.isInteger(request.sliceZ * 2), "camera preset or display slice is unsupported");
  check(["observed_swc", "radius_surface"].includes(request.mode) && (request.mode !== "radius_surface" || record.modes.radiusSurface.available), "source radius or dimensionality is not authorized");
  keys(request.layers, ["scaffold", "gray", "entities", "observedForm", "datContours", "micronsCellSurface", "micronsNucleus"], "requested layers");
  check(Object.values(request.layers).every(value => typeof value === "boolean"), "requested layer state is invalid");
  const clip = request.micronsClipping;
  keys(clip, ["enabled", "axis", "positionNanometre", "keepSide"], "MICrONS clipping request");
  check(typeof clip.enabled === "boolean" && ["x", "y", "z"].includes(clip.axis) && Number.isFinite(clip.positionNanometre) && ["positive", "negative"].includes(clip.keepSide), "MICrONS clipping request is invalid");
  validateMicronsClipState(clip, micronsClip);
  keys(request.evidenceFilter, ["search", "filters", "retainedSelectedId"], "evidence filter");
  check(typeof request.evidenceFilter.search === "string" && request.evidenceFilter.search.length <= 10000 && (request.evidenceFilter.retainedSelectedId === null || typeof request.evidenceFilter.retainedSelectedId === "string"), "evidence selection is invalid");
  keys(request.evidenceFilter.filters, ["transmitter", "segment", "endpoint", "injury"], "evidence filter values");
  check(Object.values(request.evidenceFilter.filters).every(value => typeof value === "string" && value.length <= 100), "evidence filter value is invalid");
  const camera = view.camera;
  keys(camera, ["kind", "position", "target", "up", "quaternion", "fov", "zoom", "aspect", "near", "far", "filmGauge", "filmOffset"], "camera");
  check(camera.kind === "PerspectiveCamera" && vector(camera.position) && vector(camera.target) && vector(camera.up) && vector(camera.quaternion, 4), "camera vectors are invalid");
  check(camera.fov === 35 && camera.near === 0.05 && camera.far === 250 && camera.zoom === 1 && camera.filmGauge === 35 && camera.filmOffset === 0 && Number.isFinite(camera.aspect) && camera.aspect > 0, "camera projection differs from the current renderer");
  const position = new Vector3().fromArray(camera.position), target = new Vector3().fromArray(camera.target), up = new Vector3().fromArray(camera.up);
  const delta = position.clone().sub(target);
  check(delta.length() >= 4 - 1e-8 && delta.length() <= 100 + 1e-8 && close(up.length(), 1) && new Vector3().crossVectors(delta, up).length() > 1e-8, "camera basis or orbit distance is invalid");
  const expectedQuaternion = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(position, target, up)), q = new Quaternion().fromArray(camera.quaternion);
  check(close(q.length(), 1) && close(Math.abs(q.dot(expectedQuaternion)), 1), "camera orientation differs from its position and target");
  const vp = view.viewport;
  keys(vp, ["cssWidth", "cssHeight", "drawingBufferWidth", "drawingBufferHeight", "pixelRatio"], "viewport");
  check([vp.cssWidth, vp.cssHeight, vp.drawingBufferWidth, vp.drawingBufferHeight].every(value => Number.isSafeInteger(value) && value > 0)
    && Number.isFinite(vp.pixelRatio) && vp.pixelRatio > 0 && vp.pixelRatio <= 1.75 && close(camera.aspect, vp.cssWidth / vp.cssHeight)
    && Math.abs(vp.drawingBufferWidth - Math.floor(vp.cssWidth * vp.pixelRatio)) <= 1 && Math.abs(vp.drawingBufferHeight - Math.floor(vp.cssHeight * vp.pixelRatio)) <= 1, "actual viewport dimensions disagree");
  keys(view.renderer, ["engine", "revision", "outputColorSpace", "toneMapping", "requestedAlpha", "requestedAntialias", "alpha", "antialias"], "renderer");
  check(view.renderer.engine === "THREE" && view.renderer.revision === revision && view.renderer.outputColorSpace === "srgb" && view.renderer.toneMapping === 0
    && view.renderer.requestedAlpha === false && view.renderer.requestedAntialias === true && typeof view.renderer.alpha === "boolean" && typeof view.renderer.antialias === "boolean",
    `renderer configuration differs from the current build: ${JSON.stringify(view.renderer)}`);
  keys(view.clipping, ["globalPlanes", "localClippingEnabled", "micronsCellPlanes", "micronsNucleusPlanes"], "actual clipping");
  check(mainSceneViewEqual(view.clipping.globalPlanes, []) && view.clipping.localClippingEnabled === true && mainSceneViewEqual(view.clipping.micronsNucleusPlanes, []), "unsupported global or nucleus clipping");
  check(Array.isArray(view.clipping.micronsCellPlanes) && view.clipping.micronsCellPlanes.length <= 1 && view.clipping.micronsCellPlanes.every(plane => vector(plane.normal) && close(new Vector3().fromArray(plane.normal).length(), 1) && Number.isFinite(plane.constant)), "invalid cell shader plane");
  keys(view.layers, ["scaffold", "grayMatter", "internalCompartments", "entities", "syntheticGuide", "morphology", "datContours", "morphologyGuide", "micronsReference", "micronsCell", "micronsNucleus", "internalReference", "slicePlane", "visibleEntityIds", "activeSelectedId"], "actual layers");
  const cross = ["microns_observed_reference", "internal_reference"].includes(request.view), detail = request.view === "cell_detail", layers = request.layers;
  const expected = { scaffold: layers.scaffold && !cross && !detail, grayMatter: layers.gray && !cross && !detail, internalCompartments: layers.gray && !cross && !detail,
    entities: false, syntheticGuide: false, morphology: layers.observedForm && !cross,
    datContours: layers.datContours && layers.observedForm && record.neuronId === 45718 && detail,
    morphologyGuide: layers.observedForm && !cross, micronsReference: request.view === "microns_observed_reference",
    micronsCell: request.view === "microns_observed_reference" && layers.micronsCellSurface, micronsNucleus: request.view === "microns_observed_reference" && layers.micronsNucleus,
    internalReference: request.view === "internal_reference", slicePlane: false };
  check(Object.entries(expected).every(([key, value]) => view.layers[key] === value), "actual layer visibility differs from the authorized main-scene morphology focus");
  check(view.layers.activeSelectedId === null && Array.isArray(view.layers.visibleEntityIds) && view.layers.visibleEntityIds.every((id, i, ids) => typeof id === "string" && (i === 0 || ids[i - 1] < id)), "actual evidence selection is invalid");
  const object = view.sourceObject;
  keys(object, ["mode", "dimensionality", "sourceDiameterAvailable", "displayTransform", "worldMatrix", "bounds", "topologyLandmarksVisible", "sourceTypes"], "source object");
  check(object.mode === request.mode && object.dimensionality === geometry.swc.dimensionality && object.sourceDiameterAvailable === geometry.swc.sourceDiameterAvailable
    && mainSceneViewEqual(object.displayTransform, geometry.displayTransform) && mainSceneViewEqual(object.worldMatrix, new Matrix4().makeTranslation(-4.4, 0, 0).toArray())
    && object.topologyLandmarksVisible === true && mainSceneViewEqual(object.sourceTypes, [...new Set(geometry.nodes.map(row => row[1]))].sort((a, b) => a - b)), "source frame, placement or topology changed");
  keys(object.bounds, ["minimum", "maximum"], "source bounds");
  check(vector(object.bounds.minimum) && vector(object.bounds.maximum) && object.bounds.minimum.every((v, i) => v <= object.bounds.maximum[i]), "source object bounds are invalid");
  keys(view.inspection, ["available", "selectedNodeId", "contextDimmed", "overlayAuthority"], "inspection");
  const inspection = view.inspection;
  check(inspection.available === true && inspection.overlayAuthority === "exact_swc_parent_path_and_descendant_edges"
    && typeof inspection.contextDimmed === "boolean" && (inspection.selectedNodeId === null ? !inspection.contextDimmed
      : Number.isSafeInteger(inspection.selectedNodeId) && inspectionIndex(geometry).nodes.has(inspection.selectedNodeId)), "inspection node or source topology is invalid");
  return view;
}
function validateAuxiliary(receipts, view) {
  check(Array.isArray(receipts) && receipts.length >= 2 && receipts.length <= 9, "auxiliary asset receipts are incomplete");
  const paths = receipts.map(row => row.path);
  check(new Set(paths).size === paths.length && paths.every((path, i) => MAIN_SCENE_AUXILIARY_PATHS.includes(path) && (i === 0 || paths[i - 1] < path)), "auxiliary asset identities changed");
  for (const receipt of receipts) {
    check(mainSceneViewEqual(canonicalProof(receipt), { ...mainSceneAuxiliaryExpected(receipt.path), verifiedSha256: receipt.sha256, authority: "actual_auxiliary_source_bytes", scope: "pinned_asset_bytes_only" }) && Number.isSafeInteger(receipt.verificationSequence) && receipt.verificationSequence > 0, "auxiliary asset receipt differs from current exact bytes");
  }
  check(MAIN_SCENE_AUXILIARY_PATHS.slice(0, 2).every(path => paths.includes(path)), "verified atlas reference assets are required");
  const mic = MAIN_SCENE_AUXILIARY_PATHS.slice(2, 7), dat = MAIN_SCENE_AUXILIARY_PATHS.slice(7);
  check(mic.every(path => paths.includes(path)) || mic.every(path => !paths.includes(path)), "partial MICrONS asset bundle");
  check(dat.every(path => paths.includes(path)) === view.layers.datContours && (view.layers.datContours || dat.every(path => !paths.includes(path))), "DAT assets disagree with the actual layer");
  const micLoaded = mic.every(path => paths.includes(path));
  check(!view.layers.micronsReference || micLoaded, "requested MICrONS geometry is not verified");
  check(view.clipping.micronsCellPlanes.length === (micLoaded && view.request.micronsClipping.enabled ? 1 : 0), "actual cell clipping disagrees with the loaded bundle");
  if (micLoaded && view.request.micronsClipping.enabled) {
    const plane = buildMicronsWorldClippingPlane(view.request.micronsClipping, micronsClip, microns.coordinateContract.displayTransformReceipt.canonical);
    check(mainSceneViewEqual(view.clipping.micronsCellPlanes, [{ normal: plane.worldNormal, constant: plane.worldConstant }]), "actual cell shader plane differs from its exact native request");
  }
}
export function captureMainSceneSourceView(record, geometry, view, tokens, revision) {
  const verified = mainSceneMorphologyVerification(record, geometry);
  validate(record, geometry, view, revision);
  const auxiliaryAssets = tokens.map(mainSceneAuxiliaryProof).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  validateAuxiliary(auxiliaryAssets, view);
  return { documentType: "main_scene_morphology_view_receipt", schemaVersion: "0.2.0", applicationVersion, generatedAt: new Date().toISOString(),
    rendererBuild: structuredClone(MAIN_SCENE_SOURCE_VIEW_BUILD), source: { neuronId: record.neuronId, assetId: record.assetId, ...record.geometry },
    geometryVerification: { ...verified.geometryVerification }, sourceContext: structuredClone(verified.sourceContext), scientificScope: { ...scope }, auxiliaryAssets: structuredClone(auxiliaryAssets), view: structuredClone(view) };
}
export function validateMainSceneSourceViewReplay(record, geometry, document, revision) {
  const verified = mainSceneMorphologyVerification(record, geometry);
  keys(document, ["documentType", "schemaVersion", "applicationVersion", "generatedAt", "rendererBuild", "source", "geometryVerification", "sourceContext", "scientificScope", "auxiliaryAssets", "view"], "document");
  check(document.documentType === "main_scene_morphology_view_receipt" && document.schemaVersion === "0.2.0" && document.applicationVersion === applicationVersion && typeof document.generatedAt === "string" && Number.isFinite(Date.parse(document.generatedAt)), "unsupported view document");
  check(mainSceneViewEqual(document.rendererBuild, MAIN_SCENE_SOURCE_VIEW_BUILD), "renderer code, style or dependency build changed");
  check(Number.isSafeInteger(document.geometryVerification?.mainSceneVerificationSequence) && document.geometryVerification.mainSceneVerificationSequence > 0, "source verification sequence is invalid");
  check(Number.isSafeInteger(document.geometryVerification.verificationSequence) && document.geometryVerification.verificationSequence > 0
    && typeof document.geometryVerification.verifiedAt === "string" && Number.isFinite(Date.parse(document.geometryVerification.verifiedAt))
    && ["default", "no-store"].includes(document.geometryVerification.requestCacheMode), "saved source verification event is invalid");
  check(mainSceneViewEqual(document.source, { neuronId: record.neuronId, assetId: record.assetId, ...record.geometry }) && mainSceneViewEqual(sourceProof(document.geometryVerification), sourceProof(verified.geometryVerification))
    && mainSceneViewEqual(document.sourceContext, verified.sourceContext) && mainSceneViewEqual(document.scientificScope, scope), "exact source, frame or scientific scope changed");
  validate(record, geometry, document.view, revision);
  validateAuxiliary(document.auxiliaryAssets, document.view);
  return structuredClone(document.view);
}
export function assertMainSceneSourceViewApplied(document, actual) {
  const saved = document.view;
  const adapt = value => { const result = structuredClone(value); delete result.runtimeBinding; delete result.viewport; delete result.camera.aspect; return result; };
  const compare = (a, b) => typeof a === "number" && typeof b === "number" ? close(a, b)
    : a && b && typeof a === "object" && typeof b === "object" ? Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.hasOwn(b, key) && compare(a[key], b[key])) : a === b;
  check(compare(adapt(saved), adapt(actual.view)), "restored actual camera, layers, clipping or source bounds differ from the saved view");
  check(mainSceneViewEqual(document.auxiliaryAssets.map(canonicalProof), actual.auxiliaryAssets.map(canonicalProof)), "fresh auxiliary source assets differ from the saved view");
  // Sequence values are local to one page lifetime. The renderer checks advancement
  // against its current producer before applying the pose, including after a reload.
  check(Number.isSafeInteger(actual.geometryVerification.mainSceneVerificationSequence) && actual.geometryVerification.mainSceneVerificationSequence > 0, "current source verification is unavailable");
  check(actual.geometryVerification.requestCacheMode === "no-store", "fresh source verification must bypass the cache");
  return true;
}

/** Add an uncompressed iTXt receipt to already encoded pixels without redrawing them. */
export async function appendMainScenePngReceipt(blob, receipt, exportMetadata) {
  const savedReceipt = structuredClone(receipt), savedMetadata = exportMetadata === undefined ? undefined : structuredClone(exportMetadata);
  const bytes = new Uint8Array(await blob.arrayBuffer()), dataView = new DataView(bytes.buffer);
  check(bytes.length >= 20 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value), "PNG encoding is invalid");
  check(bytes.length >= 33 && dataView.getUint32(8) === 13 && String.fromCharCode(...bytes.slice(12, 16)) === "IHDR"
    && dataView.getUint32(16) > 0 && dataView.getUint32(20) > 0, "PNG image dimensions are invalid");
  let offset = 8, end = -1;
  while (offset + 12 <= bytes.length) {
    const size = dataView.getUint32(offset);
    check(size <= bytes.length - offset - 12, "PNG chunk is truncated");
    if (String.fromCharCode(...bytes.slice(offset + 4, offset + 8)) === "iTXt") {
      const data = bytes.slice(offset + 8, offset + 8 + size), separator = data.indexOf(0);
      const keyword = new TextDecoder().decode(data.slice(0, separator));
      check(!["ohri-source-view", "ohri-png-export"].includes(keyword), "PNG already contains an OHRI export receipt");
    }
    if (String.fromCharCode(...bytes.slice(offset + 4, offset + 8)) === "IEND") { check(size === 0 && offset + 12 === bytes.length, "PNG ending is invalid"); end = offset; break; }
    offset += size + 12;
  }
  check(end >= 0, "PNG ending is missing");
  const textChunk = (keyword, value) => {
    const payload = new TextEncoder().encode(`${keyword}\0\0\0\0\0${JSON.stringify(value)}`);
    const chunk = new Uint8Array(payload.length + 12), chunkView = new DataView(chunk.buffer);
    chunkView.setUint32(0, payload.length); chunk.set([105, 84, 88, 116], 4); chunk.set(payload, 8);
    let crc = 0xffffffff;
    for (const value of chunk.slice(4, -4)) {
      crc ^= value;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    chunkView.setUint32(chunk.length - 4, (crc ^ 0xffffffff) >>> 0);
    return chunk;
  };
  const chunks = [textChunk("ohri-source-view", savedReceipt)];
  if (savedMetadata !== undefined) {
    check(savedMetadata && typeof savedMetadata === "object" && !Array.isArray(savedMetadata), "PNG export metadata is invalid");
    chunks.push(textChunk("ohri-png-export", { ...savedMetadata, image: { format: "image/png", width: dataView.getUint32(16), height: dataView.getUint32(20) } }));
  }
  return new Blob([bytes.slice(0, end), ...chunks, bytes.slice(end)], { type: "image/png" });
}
