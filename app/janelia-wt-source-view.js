import reference from '../data/janelia-wt-bounded-reference-0.1.json' with { type: 'json' };
import iteration from '../data/research-renderer-runtime-inputs-2.91.json' with { type: 'json' };
import { buildJaneliaWtPlaneReceipt, getJaneliaWtNativePlanes, validateJaneliaWtReference, verifyJaneliaWtPayload } from './janelia-wt-bounded-reference.js';
import { createSourceIdentityHierarchy, SOURCE_IDENTITY_LEVELS } from './source-object-identity.js';
import { encodeSourceViewPng } from './source-view-png-raster.js';
import { appendMainScenePngReceipt } from './main-scene-source-view.js';

const check = (ok, message) => { if (!ok) throw new Error(`Janelia WT source view: ${message}`); };
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function equal(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
}
function fields(value, names, label) { check(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name)), `${label} fields changed`); }
const source = freeze(structuredClone(reference));
validateJaneliaWtReference(source);
const pairs = new WeakMap(), renders = new WeakMap();
let sourceSequence = 0, viewSequence = 0;
const abort = signal => { if (signal?.aborted) throw new DOMException('Janelia WT source operation cancelled', 'AbortError'); };
const sha256 = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer)), byte => byte.toString(16).padStart(2, '0')).join('');
const paths = [
  'app/janelia-wt-source-view.js', 'app/janelia-wt-source-view.d.ts', 'app/janelia-wt-bounded-reference.js',
  'app/janelia-wt-bounded-reference-viewer.tsx', 'app/janelia-wt-bounded-reference-viewer.module.css', 'app/academic-interface.css', 'app/ResearchCollectionPage.tsx', 'app/ResearchRoutePage.tsx', 'app/SiteNavigation.tsx', 'app/site-navigation.ts', 'app/site-navigation.css', 'app/research-pages.css',
  'app/source-object-identity.js', 'app/source-object-identity.d.ts', 'app/SourceIdentityHierarchyPanel.tsx', 'app/source-identity-hierarchy.css',
  'app/source-view-png-raster.js', 'app/source-view-png-raster.d.ts', 'app/native-contour-png-export.js', 'app/main-scene-source-view.js',
  'data/janelia-wt-bounded-reference-0.1.json', 'public/data/janelia_wt_reference_v1/raw.u8', 'public/data/janelia_wt_reference_v1/nucleus.u8', 'package-lock.json',
];
export const JANELIA_WT_SOURCE_VIEW_BUILD = freeze({ applicationVersion: '2.91.0-research.1', scope: 'specified_native_plane_source_renderer_replay_and_export_inputs', inputs: paths.map(path => {
  const rows = iteration.authoritativeInputs.filter(row => row.path === path);
  check(rows.length === 1 && /^[a-f0-9]{64}$/.test(rows[0].sha256) && Number.isSafeInteger(rows[0].bytes) && rows[0].bytes > 0, `current build input unavailable: ${path}`);
  return { ...rows[0] };
}) });
const scope = freeze({ observationUnit: 'bounded_source_chunk_pair', cellClass: 'unknown', disposition: 'co_display_only', selectedCellJoinCount: 0,
  interneuronGeometryCount: 0, sameCellInternalChainCount: 0, completeNucleusCount: 0, organelleObjects: 0, atlasRegistrations: 0,
  biologicalMeasurements: 0, sourceOverlapAuthority: 'same_source_volume_spatial_overlap_only', sharedPhysicalDisplayScale: false });
export function janeliaWtSourceIdentity() {
  const missing = reason => ({ status: 'unknown', id: null, reason });
  const nodes = Object.fromEntries(SOURCE_IDENTITY_LEVELS.map(level => [level, missing(`No exact ${level} identifier is retained in this bounded reference.`)]));
  nodes.specimen = missing('The volume accession is a dataset key; no exact specimen or donor ID is retained.');
  nodes.section = missing('A raw Z sample index is not an identified physical tissue section.');
  nodes.cell = missing('Manual label 2 is a partial nucleus instance; no stable biological cell ID or verified cell class is retained.');
  nodes.component = { status: 'known', id: source.contractId, locator: 'data/janelia-wt-bounded-reference-0.1.json#contractId' };
  return createSourceIdentityHierarchy({ sourceId: 'Janelia Figshare', releaseId: 'raw20134574.v1+manual26513224.v1',
    namespace: 'ohri:repository_bounded_reference:jrc_mus-sc-zp104a', objectKind: 'bounded_source_reference', objectId: source.contractId,
    objectLocator: nodes.component.locator, objectLevel: 'component', unit: 'bounded_source_chunk_pair', nodes,
    population: missing('A volume, genotype or untyped manual nucleus instance does not establish a source cell-population assignment.') });
}
function pair(token) { const proof = pairs.get(token); check(proof && Object.isFrozen(token), 'the chunk pair has no private source-byte proof'); return proof; }
export async function readVerifiedJaneliaWtChunks({ fetchImpl = globalThis.fetch, signal, forceReload = false } = {}) {
  abort(signal);
  const requestCacheMode = forceReload ? 'no-store' : 'default';
  const loaded = await Promise.all(['raw', 'nucleus'].map(async kind => {
    const descriptor = source[kind].payload;
    const response = await fetchImpl(descriptor.url, { signal, cache: requestCacheMode });
    abort(signal); check(response.ok, `${kind} source request failed (${response.status})`);
    const bytes = await response.arrayBuffer(); abort(signal);
    const owned = await verifyJaneliaWtPayload(new Uint8Array(bytes), descriptor); abort(signal);
    return owned;
  }));
  abort(signal);
  const verificationSequence = ++sourceSequence, verifiedAt = new Date().toISOString();
  const token = freeze({ kind: 'verified_janelia_wt_native_chunks', verificationSequence });
  pairs.set(token, { raw: loaded[0], nucleus: loaded[1], verification: freeze({ status: 'verified', verificationSequence, verifiedAt, requestCacheMode,
    scope: 'two_current_lossless_native_chunk_payloads_original_compressed_chunk_hashes_declared',
    files: ['raw', 'nucleus'].map(kind => ({ path: source[kind].payload.url, bytes: source[kind].payload.bytes, sha256: source[kind].payload.sha256 })) }) });
  return token;
}
export function janeliaWtChunkVerification(token) { return pair(token).verification; }
export function readJaneliaWtNativePlanes(token, rawSlice) {
  const proof = pair(token), planes = getJaneliaWtNativePlanes(proof.raw, proof.nucleus, rawSlice);
  return { raw: new Uint8Array(planes.raw), nucleus: new Uint8Array(planes.nucleus) };
}
export function janeliaWtPlaneRgba(plane, labelPlane = false) {
  check(plane instanceof Uint8Array, 'native values require a uint8 plane');
  const rgba = new Uint8ClampedArray(plane.length * 4);
  for (let index = 0; index < plane.length; index++) {
    const value = plane[index], color = labelPlane ? value === 2 ? [230, 177, 77] : value === 255 ? [143, 143, 143] : value === 0 ? [25, 32, 39] : [154, 110, 173] : [value, value, value];
    rgba.set([...color, 255], index * 4);
  }
  return rgba;
}
async function nativeFacts(token, rawSlice) {
  const planes = readJaneliaWtNativePlanes(token, rawSlice), rgba = { raw: janeliaWtPlaneRgba(planes.raw), nucleus: janeliaWtPlaneRgba(planes.nucleus, true) };
  const facts = {};
  for (const [kind, width] of [['raw', 128], ['nucleus', 64]]) facts[kind] = { width, height: width, sourceValuesSha256: await sha256(planes[kind]), rgbaSha256: await sha256(rgba[kind]) };
  return { rgba, facts };
}
const renderer = freeze({ engine: 'Canvas2D', nativeSamplesPreserved: true, nativeInterpolation: 'none', cssImageRendering: 'pixelated',
  coordinateOrientation: 'X_right_Y_down', rawColor: 'source_grayscale', labelPalette: { absent0: [25, 32, 39, 255], instance2: [230, 177, 77, 255], unknown255: [143, 143, 143, 255], other: [154, 110, 173, 255] } });
const outline = freeze({ roiXY: { x: 8, y: 48, width: 8, height: 8 }, coordinateFrame: 'native_nucleus_label_plane', color: '#5ee5f5', strokeWidthNativePixels: 0.6, isNucleusBoundary: false });
function validateLayout(layout) {
  fields(layout, ['raw', 'nucleus', 'pixelRatio', 'fit'], 'layout');
  check(layout.fit === 'independent_native_planes' && Number.isFinite(layout.pixelRatio) && layout.pixelRatio > 0, 'display layout or pixel ratio is invalid');
  for (const kind of ['raw', 'nucleus']) {
    fields(layout[kind], ['cssWidth', 'cssHeight'], `${kind} layout`);
    const { cssWidth, cssHeight } = layout[kind];
    check(Number.isFinite(cssWidth) && Number.isFinite(cssHeight) && cssWidth > 0 && cssHeight > 0 && Math.abs(cssWidth - cssHeight) < 0.1, 'native plane display is unavailable or non-square');
  }
}
export async function attestJaneliaWtRenderedPlanes(token, rawSlice, actual) {
  const proof = pair(token); validateLayout(actual.layout);
  check(typeof actual.rawPatchOutlineVisible === 'boolean', 'patch outline visibility is unavailable');
  const { rgba, facts } = await nativeFacts(token, rawSlice);
  for (const kind of ['raw', 'nucleus']) {
    const pixels = actual[kind];
    check((pixels instanceof Uint8ClampedArray || pixels instanceof Uint8Array) && pixels.length === rgba[kind].length
      && pixels.every((value, index) => value === rgba[kind][index]), `actual ${kind} canvas pixels differ from the verified native slice`);
  }
  const rendered = freeze({ kind: 'attested_janelia_wt_native_planes', viewSequence: ++viewSequence });
  const view = freeze({ status: 'rendered', runtimeBinding: { sourceVerificationSequence: proof.verification.verificationSequence, viewSequence: rendered.viewSequence },
    rawSlice, mapping: buildJaneliaWtPlaneReceipt(source, rawSlice).plane, nativePlanes: facts, renderer: structuredClone(renderer), layout: structuredClone(actual.layout),
    layers: { rawVisible: true, nucleusVisible: true, rawPatchOutlineVisible: actual.rawPatchOutlineVisible }, rawPatchOutline: structuredClone(outline) });
  const document = freeze({ documentType: 'janelia_wt_native_plane_view_receipt', schemaVersion: '0.1.0', applicationVersion: JANELIA_WT_SOURCE_VIEW_BUILD.applicationVersion,
    generatedAt: new Date().toISOString(), rendererBuild: structuredClone(JANELIA_WT_SOURCE_VIEW_BUILD), sourceContext: buildJaneliaWtPlaneReceipt(source, rawSlice),
    sourceIdentity: janeliaWtSourceIdentity(), sourceVerification: structuredClone(proof.verification), scientificScope: structuredClone(scope), view });
  renders.set(rendered, { token, document, rgba });
  return rendered;
}
function render(token) { const proof = renders.get(token); check(proof && Object.isFrozen(token), 'actual rendered planes have no private source/pixel proof'); return proof; }
export function captureJaneliaWtSourceView(rendered) { return structuredClone(render(rendered).document); }
export async function validateJaneliaWtSourceViewReplay(document, token) {
  const proof = pair(token);
  fields(document, ['documentType', 'schemaVersion', 'applicationVersion', 'generatedAt', 'rendererBuild', 'sourceContext', 'sourceIdentity', 'sourceVerification', 'scientificScope', 'view'], 'document');
  check(document.documentType === 'janelia_wt_native_plane_view_receipt' && document.schemaVersion === '0.1.0' && document.applicationVersion === JANELIA_WT_SOURCE_VIEW_BUILD.applicationVersion
    && typeof document.generatedAt === 'string' && Number.isFinite(Date.parse(document.generatedAt)), 'unsupported view document');
  check(equal(document.rendererBuild, JANELIA_WT_SOURCE_VIEW_BUILD), 'source renderer, style or export code build changed');
  const saved = document.sourceVerification;
  fields(saved, ['status', 'verificationSequence', 'verifiedAt', 'requestCacheMode', 'scope', 'files'], 'verification');
  check(saved.status === 'verified' && Number.isSafeInteger(saved.verificationSequence) && saved.verificationSequence > 0 && typeof saved.verifiedAt === 'string' && Number.isFinite(Date.parse(saved.verifiedAt))
    && ['default', 'no-store'].includes(saved.requestCacheMode) && saved.scope === proof.verification.scope && equal(saved.files, proof.verification.files), 'saved source verification event or exact file proof is invalid');
  const view = document.view;
  fields(view, ['status', 'runtimeBinding', 'rawSlice', 'mapping', 'nativePlanes', 'renderer', 'layout', 'layers', 'rawPatchOutline'], 'view');
  fields(view.runtimeBinding, ['sourceVerificationSequence', 'viewSequence'], 'render binding');
  check(view.status === 'rendered' && view.runtimeBinding.sourceVerificationSequence === saved.verificationSequence && Number.isSafeInteger(view.runtimeBinding.viewSequence) && view.runtimeBinding.viewSequence > 0, 'rendered source binding is invalid');
  const expectedContext = buildJaneliaWtPlaneReceipt(source, view.rawSlice), expected = await nativeFacts(token, view.rawSlice);
  check(equal(document.sourceContext, expectedContext) && equal(document.sourceIdentity, janeliaWtSourceIdentity()) && equal(document.scientificScope, scope), 'exact source context, missing identity or scientific scope changed');
  check(equal(view.mapping, expectedContext.plane) && equal(view.nativePlanes, expected.facts) && equal(view.renderer, renderer) && equal(view.rawPatchOutline, outline), 'native slice, pixel hashes, calibration or display palette changed');
  fields(view.layers, ['rawVisible', 'nucleusVisible', 'rawPatchOutlineVisible'], 'layers');
  check(view.layers.rawVisible === true && view.layers.nucleusVisible === true && typeof view.layers.rawPatchOutlineVisible === 'boolean', 'native plane or outline layers are invalid');
  validateLayout(view.layout);
  return structuredClone(view);
}
export async function assertJaneliaWtSourceViewApplied(document, rendered, previousToken) {
  const actual = render(rendered), currentProof = pair(actual.token), previousProof = pair(previousToken);
  await validateJaneliaWtSourceViewReplay(document, actual.token);
  const adapt = value => { const result = structuredClone(value); delete result.layout; delete result.runtimeBinding; return result; };
  check(equal(adapt(document.view), adapt(actual.document.view)), 'restored actual native pixels, slice or outline differ');
  check(currentProof.verification.requestCacheMode === 'no-store' && currentProof.verification.verificationSequence > previousProof.verification.verificationSequence, 'restoration did not freshly recheck both exact source chunks');
  return true;
}
export const JANELIA_WT_PNG_LAYOUT = freeze({ width: 560, height: 320, raw: { x: 16, y: 48, width: 256, height: 256, integerEnlargement: 2 }, nucleus: { x: 288, y: 48, width: 256, height: 256, integerEnlargement: 4 } });
/** Uses the actual attested canvas buffers; only the export layout, integer enlargement and source patch outline are composed. */
export async function encodeJaneliaWtSourceViewPng(rendered, { assertCurrent }) {
  assertCurrent();
  const { document: receipt, rgba } = render(rendered), view = receipt.view, layout = JANELIA_WT_PNG_LAYOUT;
  const canvas = document.createElement('canvas'); canvas.width = layout.width; canvas.height = layout.height;
  const context = canvas.getContext('2d'); check(context, 'PNG canvas is unavailable');
  context.fillStyle = '#f5f8f2'; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = '#203c32'; context.font = '14px sans-serif';
  context.fillText(`Raw Z ${view.rawSlice + 1}/128 · 6 nm samples`, 16, 25);
  context.fillText(`Manual label Z ${view.mapping.labelSlice} · 96 nm`, 288, 25);
  for (const kind of ['raw', 'nucleus']) {
    const width = view.nativePlanes[kind].width, plane = document.createElement('canvas'); plane.width = width; plane.height = width;
    const painter = plane.getContext('2d'); check(painter, 'native PNG plane is unavailable');
    const image = painter.createImageData(width, width); image.data.set(rgba[kind]); painter.putImageData(image, 0, 0);
    const rect = layout[kind]; context.imageSmoothingEnabled = false; context.drawImage(plane, rect.x, rect.y, rect.width, rect.height);
  }
  if (view.layers.rawPatchOutlineVisible) {
    const roi = view.rawPatchOutline.roiXY, rect = layout.nucleus, scale = rect.integerEnlargement;
    context.strokeStyle = view.rawPatchOutline.color; context.lineWidth = view.rawPatchOutline.strokeWidthNativePixels * scale;
    context.strokeRect(rect.x + roi.x * scale, rect.y + roi.y * scale, roi.width * scale, roi.height * scale);
  }
  const captions = [
    'Janelia WT jrc_mus-sc-zp104a · paired source-local native planes · cell class unknown; partial manual nucleus instance 2.',
    `Raw global Z ${view.mapping.rawGlobalZIndex} at ${view.mapping.rawSampleZNanometre} nm; manual label global Z ${view.mapping.labelGlobalZIndex} at ${view.mapping.labelSampleZNanometre} nm. Label plane maps to raw samples ${view.mapping.rawGroupMinimumSlice}–${view.mapping.rawGroupMaximumExclusiveSlice - 1}, zero-based.`,
    `Actual native canvas buffers enlarged by integer factors raw×2 and labels×4; independent export layout, no interpolation or shared physical display scale. Patch outline ${view.layers.rawPatchOutlineVisible ? 'shown' : 'hidden'} is a raw-patch locator, not a nucleus boundary.`,
    'Raw DOI 10.25378/janelia.20134574.v1; manual DOI 10.25378/janelia.26513224.v1; CC BY 4.0. Losslessly decoded bounded chunks only; original compressed chunks are declared source receipts.',
    `Raw payload SHA256 ${source.raw.payload.sha256}; manual payload SHA256 ${source.nucleus.payload.sha256}.`,
    'No exact biological cell ID; 0 selected-interneuron joins, same-cell internal chains, complete nuclei, atlas registrations or biological measurements. Nominal/live source extent discrepancy remains unresolved.',
  ];
  const metadata = { documentType: 'janelia_wt_native_plane_png_export_receipt', schemaVersion: '0.1.0', rendererBuild: structuredClone(JANELIA_WT_SOURCE_VIEW_BUILD),
    exportedAt: new Date().toISOString(), exportKind: 'actual_native_canvas_pixels_integer_enlarged_with_patch_outline_and_disclosure_footer', raster: structuredClone(layout),
    captureAuthority: { sourceNativePlanes: structuredClone(view.nativePlanes), rawSlice: view.rawSlice, rawPatchOutlineVisible: view.layers.rawPatchOutlineVisible,
      interpolation: false, sharedPhysicalDisplayScale: false, imageIsBiologicalMeasurement: false, cellClass: 'unknown', sameCellInternalChainCount: 0, atlasRegistrationCount: 0 },
    replay: { separateJsonRequiredForRestore: true, sameSpecifiedBuildRequired: true, freshSourceCacheMode: 'no-store', appliedNativePixelsMustMatch: true, adaptedPaths: ['view.layout', 'view.runtimeBinding'] } };
  const result = await encodeSourceViewPng(canvas, captions, { pixelRatio: 1, assertCurrent, appendReceipt: blob => appendMainScenePngReceipt(blob, receipt, metadata) });
  assertCurrent(); return result;
}
