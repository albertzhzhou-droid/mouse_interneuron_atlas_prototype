import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import reference from '../data/janelia-wt-bounded-reference-0.1.json' with { type: 'json' };
import { JANELIA_WT_SOURCE_VIEW_BUILD, assertJaneliaWtSourceViewApplied, attestJaneliaWtRenderedPlanes,
  captureJaneliaWtSourceView, janeliaWtChunkVerification, janeliaWtPlaneRgba, janeliaWtSourceIdentity,
  readJaneliaWtNativePlanes, readVerifiedJaneliaWtChunks, validateJaneliaWtSourceViewReplay } from '../app/janelia-wt-source-view.js';

const root = new URL('../', import.meta.url);
const bytes = Object.fromEntries(await Promise.all(['raw', 'nucleus'].map(async kind => [kind, new Uint8Array(await readFile(new URL('public' + reference[kind].payload.url, root)))])));
const digest = value => createHash('sha256').update(value).digest('hex');
const requests = [];
async function sourceFetch(url, options) {
  const kind = ['raw', 'nucleus'].find(value => reference[value].payload.url === url);
  assert.ok(kind, 'Only the two exact local source chunks may be requested');
  requests.push({ kind, cache: options.cache, signal: options.signal });
  return new Response(new Uint8Array(bytes[kind]));
}
const load = options => readVerifiedJaneliaWtChunks({ fetchImpl: sourceFetch, ...options });
const layout = width => ({ raw: { cssWidth: width, cssHeight: width }, nucleus: { cssWidth: width, cssHeight: width }, pixelRatio: 1, fit: 'independent_native_planes' });
const actual = (token, slice, patch = true, width = 256) => {
  const planes = readJaneliaWtNativePlanes(token, slice);
  return { raw: janeliaWtPlaneRgba(planes.raw), nucleus: janeliaWtPlaneRgba(planes.nucleus, true), rawPatchOutlineVisible: patch, layout: layout(width) };
};
const rendered = (token, slice = 64, patch = true, width = 256) => attestJaneliaWtRenderedPlanes(token, slice, actual(token, slice, patch, width));

test('all 24 specified build inputs are pinned to their actual byte counts and hashes', async () => {
  assert.equal(JANELIA_WT_SOURCE_VIEW_BUILD.inputs.length, 24);
  for (const path of ['app/ResearchCollectionPage.tsx', 'app/ResearchRoutePage.tsx', 'app/SiteNavigation.tsx', 'app/site-navigation.ts', 'app/site-navigation.css', 'app/research-pages.css']) {
    assert.equal(JANELIA_WT_SOURCE_VIEW_BUILD.inputs.filter(row => row.path === path).length, 1, `Navigation input ${path} must be pinned exactly once`);
  }
  assert.equal(new Set(JANELIA_WT_SOURCE_VIEW_BUILD.inputs.map(row => row.path)).size, 24);
  for (const row of JANELIA_WT_SOURCE_VIEW_BUILD.inputs) {
    const file = await readFile(new URL(row.path, root));
    assert.equal(file.length, row.bytes, row.path);
    assert.equal(digest(file), row.sha256, row.path);
  }
});

test('two privately verified exact source chunks use the requested cache mode and return isolated native copies', async () => {
  requests.length = 0;
  const token = await load(), proof = janeliaWtChunkVerification(token);
  assert.deepEqual(requests.map(row => row.cache), ['default', 'default']);
  assert.equal(proof.files.length, 2);
  assert.ok(Object.isFrozen(proof.files[0]));
  assert.throws(() => janeliaWtChunkVerification(structuredClone(token)), /private source-byte proof/);
  assert.throws(() => readJaneliaWtNativePlanes(Object.freeze({ ...token }), 64), /private source-byte proof/);
  const planes = readJaneliaWtNativePlanes(token, 64), first = planes.raw[0];
  planes.raw.fill(255); planes.nucleus.fill(255);
  assert.equal(readJaneliaWtNativePlanes(token, 64).raw[0], first);
  assert.ok(!readJaneliaWtNativePlanes(token, 64).nucleus.includes(255));
  const next = await load({ forceReload: true });
  assert.equal(janeliaWtChunkVerification(next).requestCacheMode, 'no-store');
  assert.deepEqual(requests.slice(-2).map(row => row.cache), ['no-store', 'no-store']);
  assert.ok(next.verificationSequence > token.verificationSequence);
});

test('every raw slice attests the actual native byte ranges, corresponding label slice and four independent pixel hashes', async () => {
  const token = await load();
  for (let slice = 0; slice < 128; slice++) {
    const doc = captureJaneliaWtSourceView(await rendered(token, slice)), labelSlice = 16 + Math.floor(slice / 16);
    assert.equal(doc.view.mapping.labelSlice, labelSlice);
    assert.equal(doc.view.mapping.rawSampleZNanometre, (10496 + slice) * 6);
    assert.equal(doc.view.mapping.labelSampleZNanometre, (640 + labelSlice) * 96 + 45);
    assert.equal(doc.view.nativePlanes.raw.sourceValuesSha256, digest(bytes.raw.subarray(slice * 16384, (slice + 1) * 16384)));
    assert.equal(doc.view.nativePlanes.nucleus.sourceValuesSha256, digest(bytes.nucleus.subarray(labelSlice * 4096, (labelSlice + 1) * 4096)));
    assert.equal(doc.view.nativePlanes.raw.rgbaSha256, digest(actual(token, slice).raw));
    assert.equal(doc.view.nativePlanes.nucleus.rgbaSha256, digest(actual(token, slice).nucleus));
    assert.equal(doc.scientificScope.sameCellInternalChainCount, 0);
    assert.equal(doc.scientificScope.sharedPhysicalDisplayScale, false);
  }
});

test('metadata, copied tokens, stale slices, corrupted actual pixels and unreadable layout cannot attest a rendered view', async () => {
  const token = await load();
  assert.throws(() => captureJaneliaWtSourceView(Object.freeze({ kind: 'attested_janelia_wt_native_planes', viewSequence: 1 })), /private source\/pixel proof/);
  await assert.rejects(attestJaneliaWtRenderedPlanes(token, 64, actual(token, 65)), /actual raw canvas pixels differ/);
  for (const kind of ['raw', 'nucleus']) {
    const copy = actual(token, 64); copy[kind][73] ^= 1;
    await assert.rejects(attestJaneliaWtRenderedPlanes(token, 64, copy), new RegExp(`actual ${kind} canvas pixels differ`));
  }
  for (const change of [value => { value.layout.raw.cssWidth = 0; }, value => { value.layout.nucleus.cssHeight = 100; }, value => { value.layout.pixelRatio = NaN; }, value => { value.rawPatchOutlineVisible = null; }]) {
    const copy = actual(token, 64); change(copy);
    await assert.rejects(attestJaneliaWtRenderedPlanes(token, 64, copy), /Janelia WT source view/);
  }
});

test('replay accepts a saved event from another page and adapts only layout and fresh runtime binding', async () => {
  const previous = await load(), saved = captureJaneliaWtSourceView(await rendered(previous, 127, false));
  saved.sourceVerification.verificationSequence = 9000; saved.view.runtimeBinding.sourceVerificationSequence = 9000; saved.view.runtimeBinding.viewSequence = 9999;
  await validateJaneliaWtSourceViewReplay(saved, previous);
  const current = await load({ forceReload: true }), receipt = await rendered(current, 127, false, 314);
  assert.equal(await assertJaneliaWtSourceViewApplied(saved, receipt, previous), true);
  const copy = captureJaneliaWtSourceView(receipt); copy.view.rawSlice = 0;
  assert.equal(captureJaneliaWtSourceView(receipt).view.rawSlice, 127, 'External documents cannot mutate private pixel proof');
  await assert.rejects(assertJaneliaWtSourceViewApplied(saved, await rendered(current, 127, true), previous), /outline differ/);
  await assert.rejects(assertJaneliaWtSourceViewApplied(saved, await rendered(current, 126, false), previous), /slice or outline differ/);
  await assert.rejects(assertJaneliaWtSourceViewApplied(saved, await rendered(previous, 127, false), previous), /freshly recheck/);
  const cached = await load();
  await assert.rejects(assertJaneliaWtSourceViewApplied(saved, await rendered(cached, 127, false), previous), /freshly recheck/);
});

test('source, calibration, build, pixels, missing identity and scientific claim tampering each fail replay', async () => {
  const token = await load(), saved = captureJaneliaWtSourceView(await rendered(token));
  const changes = [
    copy => { copy.rendererBuild.inputs[0].sha256 = '0'.repeat(64); },
    copy => { copy.sourceContext.sourceRecords[1].doi = '10.0000/wrong'; },
    copy => { copy.sourceVerification.files[1].bytes++; },
    copy => { copy.view.mapping.labelSampleZNanometre += 45; },
    copy => { copy.view.nativePlanes.raw.rgbaSha256 = '0'.repeat(64); },
    copy => { copy.view.rawSlice = 65; },
    copy => { copy.view.renderer.nativeInterpolation = 'linear'; },
    copy => { copy.view.rawPatchOutline.isNucleusBoundary = true; },
    copy => { copy.scientificScope.cellClass = 'interneuron'; },
    copy => { copy.sourceIdentity.objectId = 'biological-cell-2'; },
    copy => { copy.view.runtimeBinding.sourceVerificationSequence++; },
    copy => { copy.view.layers.nucleusVisible = false; },
    copy => { copy.unknownField = true; },
  ];
  for (const change of changes) { const copy = structuredClone(saved); change(copy); await assert.rejects(validateJaneliaWtSourceViewReplay(copy, token), /Janelia WT source view/); }
  await assert.rejects(validateJaneliaWtSourceViewReplay(saved.sourceContext, token), /document fields changed/);
});

test('fetch rejection, HTTP failure, corruption, truncation and cancellation never create a reusable chunk-pair token', async () => {
  const failures = [
    async () => { throw new Error('source offline'); },
    async () => new Response('missing', { status: 404 }),
    async url => { const kind = url === reference.raw.payload.url ? 'raw' : 'nucleus', copy = new Uint8Array(bytes[kind]); copy[100] ^= 1; return new Response(copy); },
    async url => new Response(bytes[url === reference.raw.payload.url ? 'raw' : 'nucleus'].subarray(1)),
  ];
  for (const fetchImpl of failures) await assert.rejects(readVerifiedJaneliaWtChunks({ fetchImpl, forceReload: true }));
  const controller = new AbortController(); controller.abort();
  let calls = 0;
  await assert.rejects(readVerifiedJaneliaWtChunks({ signal: controller.signal, fetchImpl: async () => { calls++; return new Response(bytes.raw); } }), { name: 'AbortError' });
  assert.equal(calls, 0);
  const during = new AbortController();
  await assert.rejects(readVerifiedJaneliaWtChunks({ signal: during.signal, fetchImpl: async url => { during.abort(); return sourceFetch(url, { cache: 'default' }); } }), { name: 'AbortError' });
  const recovered = await load({ forceReload: true });
  assert.equal(janeliaWtChunkVerification(recovered).status, 'verified');
});

test('shared identity retains a repository component key while biological cell, specimen and section remain unknown', () => {
  const identity = janeliaWtSourceIdentity();
  assert.equal(identity.objectId, reference.contractId);
  const text = JSON.stringify(identity);
  assert.match(text, /partial nucleus instance/);
  assert.match(text, /no exact specimen or donor/);
  assert.match(text, /not an identified physical tissue section/);
  assert.doesNotMatch(text, /"status":"known","id":"2"/);
});
