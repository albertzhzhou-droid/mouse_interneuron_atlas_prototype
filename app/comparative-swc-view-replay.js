import { assertVerifiedComparativeSwcPayload, createComparativeSwcReferenceIndex, findComparativeSwcReference } from "./comparative-swc-reference.js";
import iteration from '../data/research-renderer-runtime-inputs-2.91.json' with { type: 'json' };
import { exportIndependentSourceObject } from "./independent-source-objects.js";
import { independentSourceReplayExport, validateIndependentSourceViewReplay } from "./independent-source-workspace-state.js";
import { independentSourceIdentityHierarchy, resolveSourceRelationship } from "./source-object-identity.js";
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function check(condition, message) { if (!condition) throw new Error(`Comparative view replay: ${message}`); }
const paths = ['app/comparative-swc-view-replay.js','app/comparative-swc-view-replay.d.ts','app/comparative-swc-reference.js','app/comparative-swc-reference.d.ts',
  'app/ComparativeSwcReferenceWorkbench.tsx','app/comparative-swc-reference.css','app/academic-interface.css', 'app/ResearchCollectionPage.tsx', 'app/ResearchRoutePage.tsx', 'app/SiteNavigation.tsx', 'app/site-navigation.ts', 'app/site-navigation.css', 'app/research-pages.css','app/IndependentSourceObjectViewport.tsx','app/independent-source-workspace-types.ts',
  'app/independent-source-workspace-state.js','app/independent-source-objects.js','app/independent-source-object-loader.js','app/neuromorpho-swc-runtime.js',
  'app/source-object-identity.js','app/source-object-identity.d.ts','app/SourceIdentityHierarchyPanel.tsx','app/source-identity-hierarchy.css',
  'app/comparative-swc-png-export.js','app/comparative-swc-png-export.d.ts','app/source-view-png-raster.js','app/source-view-png-raster.d.ts',
  'app/native-contour-png-export.js','app/main-scene-source-view.js','data/comparative-swc-reference-0.1.json',
  ...['183779','34024'].flatMap(id=>[`public/data/comparative_swc_reference_v1/nmo-${id}-api.json`,`public/data/comparative_swc_reference_v1/nmo-${id}.swc`,`public/data/comparative_swc_reference_v1/nmo-${id}-morphometry.json`]),'package.json','package-lock.json'];
export const COMPARATIVE_SWC_VIEW_BUILD = Object.freeze({applicationVersion:'2.91.0-research.1',scope:'specified_comparative_native_source_renderer_identity_replay_and_png_inputs',inputs:Object.freeze(paths.map(path=>{
  const rows=iteration.authoritativeInputs.filter(row=>row.path===path);
  check(rows.length===1&&Number.isSafeInteger(rows[0].bytes)&&rows[0].bytes>0&&/^[a-f0-9]{64}$/.test(rows[0].sha256),`current build input unavailable: ${path}`);
  return Object.freeze({...rows[0]});
}))});
function verificationEvent(event) {
  check(event && Object.keys(event).length===4 && event.status==='verified_owned_native_source_bytes' && Number.isSafeInteger(event.verificationSequence)&&event.verificationSequence>0
    && typeof event.verifiedAt==='string'&&Number.isFinite(Date.parse(event.verifiedAt))&&['default','no-store'].includes(event.requestCacheMode),'saved verification event is invalid');
}
const withoutEvent = value => Object.fromEntries(Object.entries(value).filter(([key])=>key!=='runtimeVerification'));
function sourceIndex(index) {
  // Revalidate the complete pinned source contract before using shared view/identity rules.
  createComparativeSwcReferenceIndex({ documentType: "independent_comparative_swc_reference", ...index, sourceLocalCoordinatePolicy: index.coordinatePolicy });
  return { contractId: index.contractId, sources: [], fixedRecords: index.objects, collections: [] };
}
function currentPayload(object, payload) {
  check(payload?.key === object?.key && payload.kind === "comparative_swc" && payload.receipt?.status === "verified" && payload.receipt.objectKey === object.key, "the exact current source loader receipt is required");
  check(payload.receipt.sourceId === object.sourceId && payload.receipt.releaseId === object.releaseId && payload.receipt.sourceObjectId === object.sourceObjectId && same(payload.receipt.coordinateFrame, object.coordinateFrame), "source/version/frame differs from the current loader");
  check(payload.receipt.verifiedFiles?.length === object.files.length && object.files.every((file) => payload.receipt.verifiedFiles.filter((receipt) => receipt.fileId === file.id && receipt.path === file.path && receipt.bytes === file.bytes && same(receipt.checksum, file.checksum) && receipt.status === "verified").length === 1), "current loader asset receipts are incomplete");
  assertVerifiedComparativeSwcPayload(object, payload);
}
export function comparativeSourceIdentityHierarchy(index, key) {
  return independentSourceIdentityHierarchy(sourceIndex(index), key);
}
export function comparativeSourceCoDisplayRelationship(index) {
  const current = sourceIndex(index);
  return resolveSourceRelationship(independentSourceIdentityHierarchy(current, index.objects[0].key), independentSourceIdentityHierarchy(current, index.objects[1].key));
}
export function exportComparativeSwcView(index, objectKey, payload, view, applicationVersion, verificationRevision) {
  const current = sourceIndex(index), object = findComparativeSwcReference(index, objectKey);
  check(object && view?.status === "rendered" && view.verificationRevision === verificationRevision, "capture requires the current verified/rendered generation");
  currentPayload(object, payload);
  const document = { ...independentSourceReplayExport(object, payload, view, applicationVersion, current), comparativeContractId: index.contractId, scientificScope: index.scope,
    comparativeViewSchemaVersion:'0.2.0',generatedAt:new Date().toISOString(),rendererBuild:COMPARATIVE_SWC_VIEW_BUILD };
  validateComparativeSwcViewReplay(index, document, payload, applicationVersion, view.renderer?.version ?? null);
  return structuredClone(document);
}
export function validateComparativeSwcViewReplay(index, document, payload, applicationVersion, currentRendererVersion = null) {
  const current = sourceIndex(index), object = findComparativeSwcReference(index, document?.object?.key);
  check(object, "source object/release is unavailable; no substitute selected");
  currentPayload(object, payload);
  check(document.comparativeViewSchemaVersion==='0.2.0' && typeof document.generatedAt==='string'&&Number.isFinite(Date.parse(document.generatedAt))
    && same(document.rendererBuild,COMPARATIVE_SWC_VIEW_BUILD),'source renderer/replay/export build changed or saved view schema is unsupported');
  verificationEvent(document.verification?.runtimeVerification);
  check(document.comparativeContractId === index.contractId && same(document.scientificScope, index.scope), "scientific scope differs from the pinned comparative contract");
  check(same(document.object, exportIndependentSourceObject(object).object) && same(withoutEvent(document.verification), withoutEvent(payload.receipt)), "saved source evidence differs from the current checksum-verified loader receipt");
  check(document.sourceIdentity && same(document.sourceIdentity, comparativeSourceIdentityHierarchy(index, object.key)), "saved reconstruction hierarchy changed its namespace, parent or missingness");
  const result = validateIndependentSourceViewReplay(current, document, applicationVersion);
  const view = result.view;
  check(view.status === "rendered", "a replayable comparative view requires an actual rendered camera; text evidence remains a separate export");
  check(view.clipping && same(view.clipping, { globalPlanes: [], localClippingEnabled: false }), "saved view lacks the actual renderer clipping state");
  check(Number.isSafeInteger(view.verificationRevision) && view.verificationRevision > 0 && typeof view.revision === "string" && view.revision.trim(), "saved view has no actual renderer generation");
  check([view.loadMilliseconds, view.renderMilliseconds].every((value) => Number.isFinite(value) && value >= 0), "saved verification/render timing is invalid");
  if (view.status === "rendered") {
    const bounds = object.context.computedFromExactSwc.boundsMicrometre;
    const expected = { centerNative: bounds.min.map((value, axis) => (value + bounds.max[axis]) / 2), scale: 200 / Math.max(...object.context.computedFromExactSwc.extentMicrometre), coordinateFrame: object.coordinateFrame };
    check(same(view.displayTransform, expected), "saved display transform differs from exact source geometry bounds");
    const delta = view.camera.position.map((value, axis) => value - view.camera.target[axis]), up = view.camera.up;
    const cross = [delta[1] * up[2] - delta[2] * up[1], delta[2] * up[0] - delta[0] * up[2], delta[0] * up[1] - delta[1] * up[0]];
    check(Math.hypot(...delta) > Number.EPSILON && Math.hypot(...up) > Number.EPSILON && Math.hypot(...cross) > Number.EPSILON, "saved camera basis is degenerate");
    check(currentRendererVersion === null || view.renderer.version === currentRendererVersion, "saved renderer version differs from the currently rendered build");
  }
  return { record: object, view };
}

export function assertComparativeSwcViewApplied(index, document, payload, actualView, applicationVersion, previousPayload, revision) {
  const {record,savedView}=(()=>{const result=validateComparativeSwcViewReplay(index,document,payload,applicationVersion,actualView.renderer.version);return {record:result.record,savedView:result.view};})();
  const actual=exportComparativeSwcView(index,record.key,payload,actualView,applicationVersion,revision).view;
  const fresh=assertVerifiedComparativeSwcPayload(record,payload),previous=assertVerifiedComparativeSwcPayload(record,previousPayload);
  check(fresh.requestCacheMode==='no-store'&&fresh.verificationSequence>previous.verificationSequence,'restore did not freshly recheck all three exact source files');
  const near=(a,b)=>typeof a==='number'&&typeof b==='number'?Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)):Array.isArray(a)&&Array.isArray(b)?a.length===b.length&&a.every((v,i)=>near(v,b[i])):a&&b&&typeof a==='object'&&typeof b==='object'?Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&near(a[k],b[k])):a===b;
  for(const key of ['camera','displayTransform','layers','clipping','representation','status'])check(near(savedView[key],actual[key]),`actual restored ${key} differs`);
  return true;
}
