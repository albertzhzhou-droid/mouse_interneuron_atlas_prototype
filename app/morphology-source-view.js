import { Matrix4, Quaternion, Vector3 } from "three";
import frames from "../data/morphology-source-frame-disclosure-0.1.json" with { type: "json" };
import iteration from "../data/research-renderer-runtime-inputs-2.91.json" with { type: "json" };
import { morphologySourceIdentityHierarchy } from "./morphology-source-identity.js";
import { morphologyGeometryVerificationReceipt } from "./morphology-geometry-verification.js";
import { universeGeometryVerificationReceipt, universeGeometrySourceFrame, universeSourceIdentityHierarchy } from "./neuromorpho-universe-verification.js";
import { resolveMorphologyRenderMode } from "./morphology-render-mode.js";

export const MORPHOLOGY_SOURCE_VIEW_VERSION = "0.1.0";
export const MORPHOLOGY_SOURCE_VIEW_APPLICATION_VERSION = "2.91.0-research.1";
const rendererInputPaths = Object.freeze([
  "app/morphology-png-export.js", "app/source-view-png-raster.js", "app/native-contour-png-export.js", "app/main-scene-source-view.js",
  "app/SourceLocalMorphologyViewport.tsx", "app/MorphologySourceViewControls.tsx", "app/MorphologyNeuriteInspector.tsx",
  "app/morphology-source-view.js", "app/morphology-census-data.ts", "app/morphology-geometry-verification.js",
  "app/morphology-source-frame-runtime.js", "app/morphology-source-identity.js", "app/source-object-identity.js",
  "app/source-local-morphology-geometry.js", "app/morphology-neurite-inspection.js", "app/morphology-render-mode.js",
  "app/morphology-viewport-scale.js", "package-lock.json",
  "app/neuromorpho-universe-view.css", "app/neuromorpho-universe-verification.js", "app/neuromorpho-swc-runtime.js", "app/NeuroMorphoUniversePanel.tsx",
  "data/neuromorpho-no-age-query-universe-0.1.json", "data/neuromorpho-no-age-query-universe-roster-0.1.json",
  "app/MorphologyViewer.tsx",
  "app/source-list-roving-focus.js", "app/source-list-roving-focus.d.ts", "app/useSourceListRovingFocus.ts", "app/source-list-keyboard.css",
  "app/globals.css", "app/academic-interface.css", "app/ResearchCollectionPage.tsx", "app/ResearchRoutePage.tsx", "app/SiteNavigation.tsx", "app/site-navigation.ts", "app/site-navigation.css", "app/research-pages.css", "app/morphology-neurite-inspector.css", "app/morphology-source-view.css", "app/morphology-source-proof.css",
]);
export const MORPHOLOGY_SOURCE_VIEW_RENDERER_BUILD = Object.freeze({
  applicationVersion: MORPHOLOGY_SOURCE_VIEW_APPLICATION_VERSION,
  scope: "pinned_source_local_renderer_inspection_and_replay_inputs",
  inputs: Object.freeze(rendererInputPaths.map(path => {
    const matches = iteration.authoritativeInputs.filter(row => row.path === path);
    if (matches.length !== 1 || !/^[a-f0-9]{64}$/.test(matches[0].sha256) || !Number.isSafeInteger(matches[0].bytes) || matches[0].bytes <= 0) throw new Error(`Morphology source view: current build input is unavailable: ${path}`);
    return Object.freeze({ path, bytes: matches[0].bytes, sha256: matches[0].sha256 });
  })),
});
const scope = Object.freeze({ observationUnit: "repository_morphology_record", registrationCount: 0,
  samePhysicalCellIdentity: false, sameSpecimenInternalPrimitiveCount: 0, observedMembranePrimitiveCount: 0,
  inferredMissingCoordinateCount: 0, repairedCutNeuriteCount: 0, sourceAxesAreAnatomicalAxes: false,
  displayTransformUse: "viewer_only", sharedPhysicalScale: false, pixelIdenticalAcrossViewportSizes: false });
function check(ok, message) { if (!ok) throw new Error(`Morphology source view: ${message}`); }
function same(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && (a.length !== b.length || Object.keys(a).length !== a.length || Object.keys(b).length !== b.length)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
}
function keys(value, names, label) {
  check(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === names.length
    && names.every(name => Object.hasOwn(value, name)), `${label} fields are incomplete or unsupported`);
}
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-9);
const vector = (value, count = 3) => Array.isArray(value) && value.length === count && Object.keys(value).length === count && value.every(Number.isFinite);
const isUniverseRecord = record => record?.memberships?.noAgeQueryUniverse === true && record?.sourceObject !== undefined;
const sourceIdentity = record => isUniverseRecord(record) ? universeSourceIdentityHierarchy(record) : morphologySourceIdentityHierarchy(record);
function sourceVerification(record, frame, geometry) {
  return isUniverseRecord(record) ? universeGeometryVerificationReceipt(record, geometry) : morphologyGeometryVerificationReceipt(record, frame, geometry);
}
function sourceFrame(record, geometry) {
  if (isUniverseRecord(record)) return universeGeometrySourceFrame(record, geometry);
  const matches = frames.records.filter(row => row.neuronId === record.neuronId);
  check(matches.length === 1, "the exact source observation is outside the 149-record roster");
  morphologySourceIdentityHierarchy(record);
  return matches[0];
}
function sourceDescriptor(record, geometry) {
  const source = isUniverseRecord(record) ? { path: record.sourceObject.rawSwcPath, bytes: record.sourceObject.rawSwcBytes,
    sha256: record.sourceObject.rawSwcSha256, rawSwcSha256: record.sourceObject.rawSwcSha256 } : record.geometry;
  return { neuronId: record.neuronId, assetId: record.assetId, geometryPath: source.path,
    geometryBytes: source.bytes, geometrySha256: source.sha256,
    rawSwcSha256: source.rawSwcSha256, repositoryObservationUrl: `https://neuromorpho.org/api/neuron/id/${record.neuronId}`,
    nativeObservationId: String(record.neuronId), nativeSourceContext: geometry.source, scientificUse: geometry.scientificUse };
}
function validateView(record, geometry, view, rendererRevision, profile = "source_local") {
  const individual = profile === "individual";
  keys(view, ["status", "runtimeBinding", "requestedMode", "actualMode", "sourcePlaneLocked", "camera", "viewport", "renderer", "clipping", "layers", "inspection", "sceneBounds", "displayTransform"], "view");
  check(view.status === "rendered", "an actual rendered viewport is required");
  keys(view.runtimeBinding, ["neuronId", "geometrySha256", "viewportInstanceId", "viewportRevision"], "runtime binding");
  check(view.runtimeBinding.neuronId === record.neuronId && view.runtimeBinding.geometrySha256 === sourceDescriptor(record, geometry).geometrySha256
    && typeof view.runtimeBinding.viewportInstanceId === "string" && (individual ? /^individual-runtime-[1-9]\d*$/ : /^source-local-runtime-[1-9]\d*$/).test(view.runtimeBinding.viewportInstanceId)
    && Number.isSafeInteger(view.runtimeBinding.viewportRevision) && view.runtimeBinding.viewportRevision > 0,
  "source or rendered generation changed");
  check(["skeleton", "radius"].includes(view.requestedMode) && ["skeleton", "radius"].includes(view.actualMode)
    && view.actualMode === resolveMorphologyRenderMode(record.normalizedMetadata, view.requestedMode), "render mode gained unsupported source radius or depth");
  const planar = record.normalizedMetadata.dimensionality === "2D";
  check(view.sourcePlaneLocked === planar, "source dimensionality or plane lock changed");
  keys(view.camera, ["kind", "position", "target", "up", "quaternion", "fov", "zoom", "aspect", "near", "far", "filmGauge", "filmOffset"], "camera");
  const camera = view.camera;
  check(camera.kind === "PerspectiveCamera" && vector(camera.position) && vector(camera.target) && vector(camera.up) && vector(camera.quaternion, 4), "camera vectors are invalid");
  check(camera.fov === 38 && camera.zoom === 1 && camera.filmGauge === 35 && camera.filmOffset === 0
    && Number.isFinite(camera.aspect) && camera.aspect > 0 && Number.isFinite(camera.near) && camera.near >= 0.001
    && Number.isFinite(camera.far) && camera.far > camera.near, "camera projection is incompatible with the current renderer");
  const position = new Vector3().fromArray(camera.position), target = new Vector3().fromArray(camera.target), up = new Vector3().fromArray(camera.up);
  const delta = position.clone().sub(target);
  check(delta.length() > 1e-9 && up.length() > 1e-9 && new Vector3().crossVectors(delta, up).length() > 1e-9, "camera basis is degenerate");
  check(close(up.length(), 1), "camera up vector is not normalized");
  const expectedQuaternion = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(position, target, up));
  const quaternion = new Quaternion().fromArray(camera.quaternion);
  check(close(quaternion.length(), 1) && close(Math.abs(quaternion.dot(expectedQuaternion)), 1), "camera quaternion differs from its source-view pose");
  if (planar) check(close(delta.x, 0) && close(delta.y, 0) && delta.z > 0 && same(camera.up, [0, 1, 0]), "planar source view became oblique or reversed");
  keys(view.viewport, ["cssWidth", "cssHeight", "drawingBufferWidth", "drawingBufferHeight", "pixelRatio"], "viewport");
  const viewport = view.viewport;
  check([viewport.cssWidth, viewport.cssHeight, viewport.drawingBufferWidth, viewport.drawingBufferHeight].every(value => Number.isSafeInteger(value) && value > 0)
    && Number.isFinite(viewport.pixelRatio) && viewport.pixelRatio > 0 && viewport.pixelRatio <= (individual ? 1.5 : 1.35)
    && Math.abs(viewport.drawingBufferWidth - Math.floor(viewport.cssWidth * viewport.pixelRatio)) <= 1
    && Math.abs(viewport.drawingBufferHeight - Math.floor(viewport.cssHeight * viewport.pixelRatio)) <= 1
    && close(camera.aspect, viewport.cssWidth / viewport.cssHeight), "actual viewport dimensions or projection aspect changed");
  keys(view.renderer, ["engine", "revision", "type", "outputColorSpace", "toneMapping", "alpha", "antialias"], "renderer");
  check(same(view.renderer, { engine: "THREE", revision: rendererRevision, type: "WebGLRenderer", outputColorSpace: "srgb", toneMapping: 0, alpha: true, antialias: true }), "renderer version or configuration differs from the current build");
  check(same(view.clipping, { globalPlanes: [], localClippingEnabled: false }), "custom clipping is unsupported by this source viewport");
  keys(view.layers, ["sourceGeometryVisible", "centerlinesVisible", "radiusSurfaceVisible", "topologyLandmarksVisible", "sourceAxesVisible", ...(individual ? ["visibleSourceTypes", "centerlineSourceTypes"] : [])], "layers");
  check(view.layers.sourceGeometryVisible === true && view.layers.centerlinesVisible === true && view.layers.sourceAxesVisible === true
    && view.layers.radiusSurfaceVisible === (view.actualMode === "radius") && typeof view.layers.topologyLandmarksVisible === "boolean", "saved layer visibility differs from the authorized source rendering");
  if (individual) {
    const types = [...new Set(geometry.nodes.map(node => node[1]))].sort((a, b) => a - b);
    const visible = view.layers.visibleSourceTypes;
    check(Array.isArray(visible) && Object.keys(visible).length === visible.length
      && visible.every((type, index) => Number.isSafeInteger(type) && types.includes(type) && (index === 0 || visible[index - 1] < type)),
    "visible source types are absent, duplicated or not in canonical source order");
    const rendered = [...new Set(geometry.segments.map(segment => segment[8]))].filter(type => visible.includes(type)).sort((a, b) => a - b);
    check(same(view.layers.centerlineSourceTypes, rendered), "actual centerline types disagree with source segments and visibility filters");
  }
  keys(view.inspection, ["selectedNodeId", "contextDimmed", "overlayAuthority"], "inspection");
  check(view.inspection.overlayAuthority === "exact_swc_parent_path_and_descendant_edges"
    && typeof view.inspection.contextDimmed === "boolean", "inspection authority or dim state changed");
  check(view.inspection.selectedNodeId === null ? view.inspection.contextDimmed === false
    : Number.isSafeInteger(view.inspection.selectedNodeId) && geometry.nodes.some(node => node[0] === view.inspection.selectedNodeId), "inspection node is absent from this exact source geometry");
  keys(view.sceneBounds, ["center", "radius"], "scene bounds");
  check(vector(view.sceneBounds.center) && Number.isFinite(view.sceneBounds.radius) && view.sceneBounds.radius > 0, "rendered source bounds are invalid");
  const radius = view.sceneBounds.radius, distance = position.distanceTo(new Vector3().fromArray(view.sceneBounds.center));
  check(delta.length() >= Math.max(radius * 0.08, 0.001) - 1e-9 && delta.length() <= Math.max(radius * 64, 100) + 1e-9, "camera distance is outside the current source orbit limits");
  check(close(camera.near, individual ? Math.max(radius / 1000, 0.001) : Math.max(Math.min(radius / 1000, distance / 1000), 0.001))
    && close(camera.far, individual ? Math.max(radius * 50, 100) : Math.max(distance + radius * 2, radius * 4, 100)), "camera clipping distances differ from actual source scene bounds");
  check(same(view.displayTransform, geometry.displayTransform), "display transform differs from the verified source geometry");
  return view;
}

function captureSourceView(record, geometry, view, rendererRevision, profile) {
  const frame = sourceFrame(record, geometry), verification = sourceVerification(record, frame, geometry);
  validateView(record, geometry, view, rendererRevision, profile);
  return { documentType: profile === "individual" ? "individual_morphology_view_receipt" : "source_local_morphology_view_receipt", schemaVersion: MORPHOLOGY_SOURCE_VIEW_VERSION,
    applicationVersion: MORPHOLOGY_SOURCE_VIEW_APPLICATION_VERSION, generatedAt: new Date().toISOString(),
    rendererBuild: structuredClone(MORPHOLOGY_SOURCE_VIEW_RENDERER_BUILD),
    source: structuredClone(sourceDescriptor(record, geometry)), sourceIdentity: sourceIdentity(record),
    sourceFrameDisclosure: structuredClone(frame), geometryVerification: { ...verification },
    scientificScope: { ...scope }, view: structuredClone(view) };
}
export function captureMorphologySourceView(record, geometry, view, rendererRevision) {
  return captureSourceView(record, geometry, view, rendererRevision, "source_local");
}
export function captureIndividualMorphologySourceView(record, geometry, view, rendererRevision) {
  check(record?.comparisonMembership?.collection === "census" && !isUniverseRecord(record), "individual renderer requires the frozen census observation");
  return captureSourceView(record, geometry, view, rendererRevision, "individual");
}

/** Saved metadata is never a runtime permit: the current immutable byte-verified payload is required. */
function validateSourceViewReplay(record, geometry, document, rendererRevision, profile) {
  const frame = sourceFrame(record, geometry), current = sourceVerification(record, frame, geometry);
  keys(document, ["documentType", "schemaVersion", "applicationVersion", "generatedAt", "rendererBuild", "source", "sourceIdentity", "sourceFrameDisclosure", "geometryVerification", "scientificScope", "view"], "document");
  check(document.documentType === (profile === "individual" ? "individual_morphology_view_receipt" : "source_local_morphology_view_receipt") && document.schemaVersion === MORPHOLOGY_SOURCE_VIEW_VERSION
    && document.applicationVersion === MORPHOLOGY_SOURCE_VIEW_APPLICATION_VERSION, "view document schema or application version is unavailable");
  check(typeof document.generatedAt === "string" && Number.isFinite(Date.parse(document.generatedAt)), "capture time is invalid");
  check(same(document.rendererBuild, MORPHOLOGY_SOURCE_VIEW_RENDERER_BUILD), "renderer, inspection or replay code build changed despite a matching application version");
  check(same(document.source, sourceDescriptor(record, geometry)) && same(document.sourceIdentity, sourceIdentity(record))
    && same(document.sourceFrameDisclosure, frame), "saved source identity, native context, geometry or source frame changed");
  const saved = document.geometryVerification;
  keys(saved, Object.keys(current), "source verification");
  check(Object.keys(current).filter(key => !["verifiedAt", "verificationSequence", "requestCacheMode"].includes(key)).every(key => same(saved[key], current[key]))
    && typeof saved.verifiedAt === "string" && Number.isFinite(Date.parse(saved.verifiedAt))
    && Number.isSafeInteger(saved.verificationSequence) && saved.verificationSequence > 0
    && ["default", "no-store"].includes(saved.requestCacheMode), "saved file verification scope or source version changed");
  check(same(document.scientificScope, scope), "saved view gained scientific identity, registration or internal-structure authority");
  return validateView(record, geometry, document.view, rendererRevision, profile);
}
export function validateMorphologySourceViewReplay(record, geometry, document, rendererRevision) {
  return validateSourceViewReplay(record, geometry, document, rendererRevision, "source_local");
}
export function validateIndividualMorphologySourceViewReplay(record, geometry, document, rendererRevision) {
  check(record?.comparisonMembership?.collection === "census" && !isUniverseRecord(record), "individual renderer requires the frozen census observation");
  return validateSourceViewReplay(record, geometry, document, rendererRevision, "individual");
}

/** Applied only after rebuilding the exact current source scene, never from saved bounds alone. */
export function assertMorphologySourceViewSceneBounds(document, actualBounds) {
  check(vector(actualBounds?.center) && Number.isFinite(actualBounds?.radius) && actualBounds.radius > 0
    && document.view.sceneBounds.center.every((value, axis) => close(value, actualBounds.center[axis]))
    && close(document.view.sceneBounds.radius, actualBounds.radius), "saved bounds differ from the newly rendered source scene");
  return true;
}

/** The current layout may change aspect and buffer size; source pose and layers must actually match. */
export function assertMorphologySourceViewAppliedPose(document, actualView) {
  const saved = document.view;
  check(["requestedMode", "actualMode", "sourcePlaneLocked", "layers", "inspection", "clipping", "displayTransform"].every(key => same(saved[key], actualView[key])), "the applied source layers or inspection differ from the saved view");
  check(["position", "target", "up"].every(key => saved.camera[key].every((value, axis) => close(value, actualView.camera[key][axis])))
    && ["fov", "zoom", "filmGauge", "filmOffset", "near", "far"].every(key => close(saved.camera[key], actualView.camera[key]))
    && close(Math.abs(new Quaternion().fromArray(saved.camera.quaternion).dot(new Quaternion().fromArray(actualView.camera.quaternion))), 1), "the actual restored camera differs from the saved pose");
  assertMorphologySourceViewSceneBounds(document, actualView.sceneBounds);
  return true;
}
