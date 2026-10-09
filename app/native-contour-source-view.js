import { Box3, Matrix4, Quaternion, Sphere, Vector3 } from "three";
import iteration from "../data/research-renderer-runtime-inputs-2.91.json" with { type: "json" };
import { canonicalNativeContourSource, nativeContourSourceHierarchy, nativeContourVerification } from "./native-contour-verification.js";
import { nativeContourDisplayTransform, transformNativeContourPoint } from "./neurolucida-native-contour-admission.js";

const paths = ["app/NativeContourRecordViewer.tsx", "app/native-contour-verification.js", "app/native-contour-source-view.js",
  "app/MorphologySourceViewControls.tsx", "app/native-contour-png-export.js", "app/main-scene-source-view.js", "app/native-contour-detail.css", "app/morphology-source-view.css", "app/globals.css", "app/academic-interface.css", "app/ResearchCollectionPage.tsx", "app/ResearchRoutePage.tsx", "app/SiteNavigation.tsx", "app/site-navigation.ts", "app/site-navigation.css", "app/research-pages.css",
  "app/neurolucida-native-contour-admission.js", "app/neurolucida-native-soma-contours.js", "app/neurolucida-native-detail-admission.js",
  "app/neurolucida-native-detail-records.js", "app/native-contour-derived-soma-surface.js", "app/source-object-identity.js", "app/independent-source-objects.js",
  "data/neurolucida-native-contour-admission-catalog-0.3.json", "data/neurolucida-native-contour-admission-catalog-0.4.json",
  "data/native-contour-source-context-0.1.json", "data/native-contour-derived-soma-surface-0.1.json", "package-lock.json",
  "app/neurolucida-dat-inventory.js", "app/neurolucida-dat-file-admission.js", "data/neurolucida-dat-file-manifest-0.1.json",
  "app/native-dat-manifest-transport.js", "data/native-dat-manifest-transport-0.1.json", "app/morphology-viewport-scale.js",
  ...[45718,45674,50424,50394,50408,108978,249676].map(id=>`public/data/native_dat_file_manifests_v1/nmo-${id}.json`)];
export const NATIVE_CONTOUR_VIEW_BUILD = Object.freeze({ applicationVersion: "2.91.0-research.1", scope: "specified_native_contour_renderer_source_restore_and_png_inputs",
  inputs: Object.freeze(paths.flatMap(path => { const rows = iteration.authoritativeInputs.filter(row => row.path === path);
    if (rows.length !== 1 || !Number.isSafeInteger(rows[0].bytes) || rows[0].bytes <= 0 || !/^[a-f0-9]{64}$/.test(rows[0].sha256)) return [];
    return [Object.freeze({ path, bytes: rows[0].bytes, sha256: rows[0].sha256 })]; })) });
export const NATIVE_CONTOUR_VIEW_BUILD_READY = NATIVE_CONTOUR_VIEW_BUILD.inputs.length === paths.length;
const scope = Object.freeze({ sourceFrame: "Neurolucida_DAT_source_native_unregistered", units: "source_reported_micrometre",
  sourceCoordinateAndTraceRadiusPreserved: true, traceRadiusUsedAsThickness: false, displayTransformUse: "viewer_only",
  observedMembraneCount: 0, volumeCount: 0, internalStructureCount: 0, standardizedSwcOverlayCount: 0, sameCellJoinCount: 0, registrationCount: 0,
  pixelIdenticalAcrossViewportSizes: false, rawDatByteVerification: "verified_original_bytes_and_complete_parser_audit", sourceContextApiByteVerification: "declared_only" });
const check = (ok, message) => { if (!ok) throw new Error(`Native contour view: ${message}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const vector = (v, n = 3) => Array.isArray(v) && v.length === n && Object.keys(v).length === n && v.every(Number.isFinite);
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a-b) <= Math.max(1e-8, Math.abs(b)*1e-8);
function keys(v, names) { check(v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === names.length && names.every(k => Object.hasOwn(v,k)), "fields are incomplete or unsupported"); }
function stableProof(proof) { return Object.fromEntries(Object.entries(proof).filter(([key]) => !["verifiedAt", "verificationSequence", "requestCacheMode"].includes(key))); }
function validProofEvent(proof) {
  check(proof && Number.isSafeInteger(proof.verificationSequence) && proof.verificationSequence > 0 && ["default","no-store"].includes(proof.requestCacheMode)
    && typeof proof.verifiedAt === "string" && /^\d{4}-\d{2}-\d{2}T/.test(proof.verifiedAt) && Number.isFinite(Date.parse(proof.verifiedAt)), "verification event is invalid");
}
function source(neuronId) {
  const item = canonicalNativeContourSource(neuronId);
  const datFileSnapshot = item.datFile;
  return { neuronId, catalogReleaseId: item.catalogReleaseId, admission: item.record, sourceContextSnapshot: item.sourceContext,
    datFileSnapshot, identity: nativeContourSourceHierarchy(neuronId), scope };
}
export function nativeContourRenderedBounds(contours, shell = null) {
  const transform = nativeContourDisplayTransform(contours.contours), box = new Box3();
  const add = point => box.expandByPoint(new Vector3(...transformNativeContourPoint(point, transform).map(Math.fround)));
  contours.contours.forEach(contour => contour.points.forEach(add));
  shell?.geometry.rings.forEach(ring => ring.pointsMicrometre.forEach(add));
  const sphere = box.getBoundingSphere(new Sphere());
  return { min: box.min.toArray(), max: box.max.toArray(), center: sphere.center.toArray(), radius: sphere.radius };
}
function validateView(neuronId, contours, shell, view, rendererRevision) {
  const { record } = canonicalNativeContourSource(neuronId);
  keys(view,["status","runtimeBinding","camera","viewport","renderer","clipping","layers","inspection","displayTransform","sceneBounds"]);
  check(view.status === "rendered", "no actual rendered view");
  keys(view.runtimeBinding,["instanceId","revision"]);
  check(/^native-contour-runtime-[1-9]\d*$/.test(view.runtimeBinding.instanceId) && Number.isSafeInteger(view.runtimeBinding.revision) && view.runtimeBinding.revision > 0, "runtime generation is invalid");
  check(same(view.displayTransform, nativeContourDisplayTransform(contours.contours)), "display transform changed");
  const bounds = nativeContourRenderedBounds(contours,shell);
  check(same(view.sceneBounds,bounds), "scene bounds do not match exact source geometry");
  keys(view.camera,["kind","position","target","up","quaternion","fov","zoom","aspect","near","far"]);
  const c=view.camera;
  check(c.kind === "PerspectiveCamera" && c.fov === 40 && c.zoom === 1 && vector(c.position) && vector(c.target) && vector(c.up) && vector(c.quaternion,4)
    && close(c.near,Math.max(bounds.radius/500,0.01)) && close(c.far,Math.max(bounds.radius*40,100)), "camera vectors or projection changed");
  const position=new Vector3().fromArray(c.position),target=new Vector3().fromArray(c.target),up=new Vector3().fromArray(c.up);
  check(position.distanceTo(target)>1e-9 && close(up.length(),1) && new Vector3().crossVectors(position.clone().sub(target),up).length()>1e-9, "camera basis is degenerate");
  const actual=new Quaternion().fromArray(c.quaternion),expected=new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(position,target,up));
  check(close(actual.length(),1) && close(Math.abs(actual.dot(expected)),1), "camera quaternion differs from position and target");
  keys(view.viewport,["cssWidth","cssHeight","drawingBufferWidth","drawingBufferHeight","pixelRatio"]);
  const v=view.viewport;
  check([v.cssWidth,v.cssHeight,v.drawingBufferWidth,v.drawingBufferHeight].every(n=>Number.isSafeInteger(n)&&n>0) && Number.isFinite(v.pixelRatio) && v.pixelRatio>0 && v.pixelRatio<=1.5
    && Math.abs(v.drawingBufferWidth-Math.floor(v.cssWidth*v.pixelRatio))<=1 && Math.abs(v.drawingBufferHeight-Math.floor(v.cssHeight*v.pixelRatio))<=1
    && close(c.aspect,v.cssWidth/v.cssHeight), "viewport dimensions or aspect disagree");
  check(same(view.renderer,{engine:"THREE",revision:rendererRevision,type:"WebGLRenderer",outputColorSpace:"srgb",toneMapping:0,alpha:true,antialias:true}), "renderer revision or settings changed");
  check(same(view.clipping,{globalPlanes:[],localClippingEnabled:false}), "clipping is unsupported");
  keys(view.inspection,["selectedContourId","isolateContour"]);
  const selected=view.inspection.selectedContourId;
  check(selected===null || contours.contours.some(contour=>contour.id===selected), "selected trace is outside this source");
  check(typeof view.inspection.isolateContour === "boolean" && (selected!==null || !view.inspection.isolateContour), "isolation requires an exact selected trace");
  keys(view.layers,["showPrimary","showSecondary","showDerivedSurface","primaryVisible","secondaryVisible","derivedSurfaceVisible","visibleContourIds","axesVisible","scaleGuideVisible"]);
  const l=view.layers, secondary=new Set(record.viewer?.secondarySourceNames ?? []);
  check([l.showPrimary,l.showSecondary,l.showDerivedSurface,l.primaryVisible,l.secondaryVisible,l.derivedSurfaceVisible].every(b=>typeof b==="boolean")
    && l.primaryVisible===l.showPrimary && l.secondaryVisible===l.showSecondary && l.axesVisible===true && l.scaleGuideVisible===true
    && (!l.showDerivedSurface || neuronId===50394) && l.derivedSurfaceVisible===Boolean(shell && l.showDerivedSurface && !(view.inspection.isolateContour && selected)), "requested and actual layers disagree or gained geometry");
  const visible=contours.contours.filter(contour=>(secondary.has(contour.sourceName)?l.showSecondary:l.showPrimary)
    && (!view.inspection.isolateContour || !selected || contour.id===selected)).map(contour=>contour.id);
  check(same(l.visibleContourIds,visible), "actual visible source trace IDs differ from filters");
  return view;
}
export function captureNativeContourSourceView(neuronId,contours,shell,view,rendererRevision) {
  check(NATIVE_CONTOUR_VIEW_BUILD_READY,"the current source-view build record is incomplete");
  const verification=nativeContourVerification(neuronId,contours,shell);
  validateView(neuronId,contours,shell,view,rendererRevision);
  return structuredClone({documentType:"native_contour_source_view",schemaVersion:"0.1.0",rendererBuild:NATIVE_CONTOUR_VIEW_BUILD,source:source(neuronId),verification,view});
}
export function preflightNativeContourSourceView(document,neuronId) {
  check(NATIVE_CONTOUR_VIEW_BUILD_READY,"the current source-view build record is incomplete");
  keys(document,["documentType","schemaVersion","rendererBuild","source","verification","view"]);
  check(document.documentType==="native_contour_source_view" && document.schemaVersion==="0.1.0", "unsupported document");
  check(same(document.rendererBuild,NATIVE_CONTOUR_VIEW_BUILD), "saved renderer build differs from current specified inputs");
  check(same(document.source,source(neuronId)), "saved exact source, identity, context or scope differs");
  keys(document.verification,["fileManifest","originalDat","sourceGeometry","derivedShell"]);validProofEvent(document.verification.sourceGeometry);validProofEvent(document.verification.originalDat);validProofEvent(document.verification.fileManifest);
  const item=canonicalNativeContourSource(neuronId),proof=document.verification.sourceGeometry;
  const manifest=document.verification.fileManifest;
  check(manifest.neuronId===neuronId && manifest.path===item.datFile.transport.path && manifest.bytes===item.datFile.transport.bytes
    && manifest.sha256===item.datFile.transport.sha256, "saved selected DAT manifest changed");
  check(proof.neuronId===neuronId && proof.path===item.record.derivedObject.path && proof.bytes===item.record.derivedObject.bytes && proof.sha256===item.record.derivedObject.sha256, "saved source file changed");
  const original=document.verification.originalDat;
  check(original.neuronId===neuronId && original.path===item.datFile.originalDat.publicPath && original.bytes===item.datFile.originalDat.bytes
    && original.sha256===item.datFile.originalDat.sha256 && original.parserVersion===item.datFile.parserVersion && original.fullAuditSha256===item.datFile.fullAuditSha256,
    "saved original DAT authority changed");
  if (document.verification.derivedShell) { validProofEvent(document.verification.derivedShell);check(item.shell && document.verification.derivedShell.path===item.shell.artifact.publicPath
    && document.verification.derivedShell.bytes===item.shell.artifact.bytes && document.verification.derivedShell.sha256===item.shell.artifact.sha256,"saved derived shell changed"); }
  return structuredClone(document);
}
export function validateNativeContourSourceViewReplay(document,neuronId,contours,shell,rendererRevision) {
  const saved=preflightNativeContourSourceView(document,neuronId),verification=nativeContourVerification(neuronId,contours,shell);
  check(same(stableProof(saved.verification.fileManifest),stableProof(verification.fileManifest)), "saved selected DAT manifest authority changed");
  check(same(stableProof(saved.verification.originalDat),stableProof(verification.originalDat)), "saved original DAT authority changed");
  check(same(stableProof(saved.verification.sourceGeometry),stableProof(verification.sourceGeometry)), "saved native geometry authority changed");
  check(Boolean(saved.verification.derivedShell)===Boolean(verification.derivedShell) && (!verification.derivedShell || same(stableProof(saved.verification.derivedShell),stableProof(verification.derivedShell))), "saved derived geometry authority changed");
  validateView(neuronId,contours,shell,saved.view,rendererRevision);return saved;
}
export function assertNativeContourSourceViewApplied(saved,current) {
  for (const key of ["layers","inspection","displayTransform","sceneBounds","renderer","clipping"]) check(same(saved.view[key],current.view[key]),`applied ${key} differs from saved view`);
  for (const key of ["position","target","up","quaternion"]) check(current.view.camera[key].every((n,i)=>close(n,saved.view.camera[key][i])),`applied camera ${key} differs`);
  for (const key of ["kind","fov","zoom","near","far"]) check(saved.view.camera[key]===current.view.camera[key],`applied camera ${key} differs`);
  check(current.verification.fileManifest.requestCacheMode==="no-store" && current.verification.originalDat.requestCacheMode==="no-store" && current.verification.sourceGeometry.requestCacheMode==="no-store" && (!current.verification.derivedShell || current.verification.derivedShell.requestCacheMode==="no-store"),"restoration did not freshly read all selected source files");
}
