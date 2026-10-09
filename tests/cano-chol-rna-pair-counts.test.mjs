import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';
import doc from '../data/cano-chol-rna-counts-0.1.json' with { type: 'json' };
import {
  loadCanoCholRnaPair, canoCholRnaPairStatistics, canoCholRnaPairReceipt,
  canoCholRnaPairCsv, validateCanoCholRnaDocument,
} from '../app/cano-chol-rna-counts.js';

validateCanoCholRnaDocument(doc);
const profile = doc.profiles.at(-1), selected = doc.nuclei.find(row => row.profileId === profile.id);
const bytesFor = url => readFile(new URL(`../public${url}`, import.meta.url));
const sourceFetch = async (url, options) => {
  assert.equal(options.cache, 'no-store');
  const bytes = await bytesFor(url); return new Response(bytes, { status: 200 });
};
const decompressImpl = async bytes => new Uint8Array(gunzipSync(bytes));
const options = { fetchImpl: sourceFetch, decompressImpl };
async function vector(feature) {
  const row = doc.genes.indexOf(feature), chunk = doc.chunks[Math.floor(row / 256)];
  return JSON.parse(gunzipSync(await bytesFor(chunk.url))).features.find(entry => entry[1] === feature)[2];
}

test('two original vectors independently reconcile all923 named columns and eleven2x2 profile partitions', async () => {
  const pair = await loadCanoCholRnaPair(doc, 'Chat', 'Pitx2', options);
  const result = canoCholRnaPairStatistics(doc, pair, profile.id, selected.key);
  const [a, b] = await Promise.all([vector('Chat'), vector('Pitx2')]);
  let count = 0;
  for (const summary of result.profiles) {
    const indices = doc.nuclei.flatMap((row, i) => row.profileId === summary.profileId ? [i] : []);
    const both = indices.filter(i => a[i] > 0 && b[i] > 0).length;
    const firstOnly = indices.filter(i => a[i] > 0 && b[i] === 0).length;
    const secondOnly = indices.filter(i => a[i] === 0 && b[i] > 0).length;
    const neither = indices.filter(i => a[i] === 0 && b[i] === 0).length;
    assert.deepEqual([summary.bothPositive, summary.firstOnly, summary.secondOnly, summary.neitherPositive], [both, firstOnly, secondOnly, neither]);
    assert.equal(both + firstOnly + secondOnly + neither, summary.nucleusCount);
    assert.equal(summary.firstPositive, both + firstOnly); assert.equal(summary.secondPositive, both + secondOnly);
    count += summary.nucleusCount;
  }
  assert.equal(count, 923); assert.equal(result.profiles.length, 11);
  const index = doc.nuclei.findIndex(row => row.key === selected.key);
  assert.equal(result.selectedNucleus.firstCount, a[index]); assert.equal(result.selectedNucleus.secondCount, b[index]);
  assert.equal(result.selectedNucleus.countsColumn, selected.metadataRow);
  assert.equal(result.currentProfile.nucleusCount, 53);
});
test('same-chunk features reuse one fresh private source proof while distinct chunks fetch at most two', async () => {
  const first = doc.genes[0], second = doc.genes[1];
  const calls = [];
  const pair = await loadCanoCholRnaPair(doc, first, second, { ...options, fetchImpl: async (url, opts) => { calls.push(url); return sourceFetch(url, opts); } });
  assert.equal(calls.length, 1); assert.equal(pair.verification.requestCount, 1);
  assert.equal(pair.verification.chunks.length, 1);
  assert.deepEqual(pair.verification.sourceFeatureRows, [1, 2]);
  const distinct = await loadCanoCholRnaPair(doc, 'Chat', 'Pitx2', options);
  assert.equal(distinct.verification.requestCount, new Set(['Chat', 'Pitx2'].map(feature => Math.floor(doc.genes.indexOf(feature) / 256))).size);
});
test('paired proof clones, foreign documents, missing features and invalid profile/nucleus keys fail closed', async () => {
  const pair = await loadCanoCholRnaPair(doc, 'Chat', 'Pitx2', options);
  assert.throws(() => canoCholRnaPairStatistics(doc, structuredClone(pair), profile.id), /private pair/);
  assert.throws(() => canoCholRnaPairStatistics(structuredClone(doc), pair, profile.id), /private pair/);
  assert.throws(() => canoCholRnaPairStatistics(doc, pair, 'not-a-profile'), /unknown exact/);
  const foreign = doc.nuclei.find(row => row.profileId !== profile.id);
  assert.throws(() => canoCholRnaPairStatistics(doc, pair, profile.id, foreign.key), /does not belong/);
  await assert.rejects(loadCanoCholRnaPair(doc, 'Chat', 'Chat', options), /distinct/);
  await assert.rejects(loadCanoCholRnaPair(doc, 'Chat', 'missing-gene', options), /absent/);
  assert.ok(Object.isFrozen(pair) && Object.isFrozen(pair.verification) && Object.isFrozen(pair.verification.chunks));
});
test('one unavailable/corrupt vector cannot mint a pair and aborts remaining work', async () => {
  const secondUrl = doc.chunks[Math.floor(doc.genes.indexOf('Pitx2') / 256)].url;
  const signals = [];
  await assert.rejects(loadCanoCholRnaPair(doc, 'Chat', 'Pitx2', { ...options, fetchImpl: async (url, opts) => {
    signals.push(opts.signal); return url === secondUrl ? new Response('', { status: 404 }) : sourceFetch(url, opts);
  } }), /unavailable/);
  assert.equal(signals.length, 2); assert.ok(signals.every(signal => signal.aborted));
  await assert.rejects(loadCanoCholRnaPair(doc, 'Chat', 'Pitx2', { ...options, fetchImpl: async (url, opts) => {
    if (url !== secondUrl) return sourceFetch(url, opts);
    const changed = new Uint8Array(await bytesFor(url)); changed[0] ^= 1; return new Response(changed);
  } }), /checksum/);
  await assert.rejects(loadCanoCholRnaPair(doc, 'Chat', 'Pitx2', { ...options, decompressImpl: async bytes => { const changed = new Uint8Array(gunzipSync(bytes)); changed[0] ^= 1; return changed; } }), /decoded counts checksum/);
});
test('cancellation while a source response is pending never publishes a paired source token', async () => {
  const controller = new AbortController(); let entered;
  const started = new Promise(resolve => { entered = resolve; });
  const pending = loadCanoCholRnaPair(doc, 'Chat', 'Pitx2', { ...options, signal: controller.signal, fetchImpl: async (url, opts) => {
    entered(); await new Promise((resolve, reject) => opts.signal.addEventListener('abort', () => reject(new Error('cancelled retained fetch')), { once: true }));
    return sourceFetch(url, opts);
  } });
  await started; controller.abort(); await assert.rejects(pending, /cancelled/);
});
test('source JSON/CSV exports retain raw labels, complete-profile denominator and zero scientific promotion', async () => {
  const pair = await loadCanoCholRnaPair(doc, 'Chat', 'Pitx2', options);
  const receipt = canoCholRnaPairReceipt(doc, pair, profile.id, selected.key);
  assert.equal(receipt.currentProfile.nucleusCount, 53);
  assert.equal(receipt.scope.nucleusCount, 923); assert.equal(receipt.scope.profileCount, 11);
  assert.equal(receipt.actualViewCaptured, false); assert.equal(receipt.originalSourceFetchedInBrowser, false);
  assert.equal(receipt.independentAnimalDenominator, null); assert.equal(receipt.cellToAnimalMapping, null);
  assert.deepEqual(receipt.interpretation, { descriptiveCountsOnly: true, biologicalAbsence: false, differentialExpression: false, correlationOrPValue: false, causation: false, markerClassification: false, rnaAtacPairing: false, crossSourceIdentity: false, geometry: false, registrations: 0, newSourceProfiles: 0 });
  const csv = canoCholRnaPairCsv(doc, pair, profile.id);
  assert.equal(csv.trimEnd().split('\n').length, 54); assert.match(csv, /raw_positive_partition/);
  for (const row of doc.nuclei.filter(row => row.profileId === profile.id)) assert.ok(csv.includes(`"${row.key}"`));
  const spaced = doc.profiles.find(row => row.label.includes(' '));
  assert.ok(canoCholRnaPairCsv(doc, pair, spaced.id).includes(`"${spaced.label}"`));
  assert.throws(() => canoCholRnaPairCsv(doc, structuredClone(pair), profile.id), /private pair/);
});
async function sourceComponent(filename) {
  const location = new URL(`../app/${filename}`, import.meta.url);
  const source = await readFile(location, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const componentRequire = createRequire(location);
  const commonjsModule = { exports: {} };
  const context = vm.createContext({ module: commonjsModule, exports: commonjsModule.exports,
    require: name => name.endsWith('.css') ? {} : componentRequire(name),
  });
  new vm.Script(output, { filename: location.pathname }).runInContext(context);
  return commonjsModule.exports.default;
}

test('actual component SSR starts with a closed disclosure and withholds pair facts and exports before proof', async () => {
  // Actual React server markup; effects/native browser disclosure and cancellation require browser QA.
  const [Parent, Pair] = await Promise.all([
    sourceComponent('CanoCholInRnaCounts.tsx'), sourceComponent('CanoCholInRnaPairCounts.tsx'),
  ]);
  const parent = renderToStaticMarkup(React.createElement(Parent, { profileId: profile.id, selectedKey: selected.key }));
  assert.match(parent, /data-testid="cano-chol-rna-counts"/);
  assert.match(parent, /Loading and verifying source counts for Chat/);
  assert.match(parent, /<details data-testid="cano-rna-pair-disclosure"><summary>Compare two source RNA features<\/summary><\/details>/);
  assert.doesNotMatch(parent, /data-testid="cano-chol-rna-pair-counts"|cano-rna-pair-current-profile|Export pair summary JSON|two-feature nucleus rows CSV/);
  const child = renderToStaticMarkup(React.createElement(Pair, { firstFeature: 'Chat', profileId: profile.id, selectedKey: selected.key }));
  assert.match(child, /data-testid="cano-chol-rna-pair-counts"/);
  assert.match(child, /data-first-feature="Chat" data-second-feature="Pitx2"/);
  assert.match(child, /Loading and verifying both source feature counts/);
  assert.doesNotMatch(child, /cano-rna-pair-current-profile|cano-rna-pair-selected-nucleus|Export pair summary JSON|two-feature nucleus rows CSV|<textarea/);
  const distinctDefault = renderToStaticMarkup(React.createElement(Pair, { firstFeature: 'Pitx2', profileId: profile.id, selectedKey: null }));
  assert.match(distinctDefault, /data-first-feature="Pitx2" data-second-feature="Chat"/);
});
