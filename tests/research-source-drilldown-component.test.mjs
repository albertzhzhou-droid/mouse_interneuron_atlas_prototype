import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import registry from '../data/research-source-registry-0.1.json' with { type: 'json' };

// Render the actual component with the same vinext Link alias as production.
// This checks React static markup, not a browser interaction or production route.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/link') return nextResolve('vinext/shims/link', context);
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const url = new URL(specifier, context.parentURL);
      if (!existsSync(url)) for (const suffix of ['.tsx', '.ts', '.js']) if (existsSync(new URL(`${url}${suffix}`))) return nextResolve(`${specifier}${suffix}`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.tsx') || url.endsWith('.ts')) return { format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8').replace(/(from\s+["'][^"']+\.json["']);/g, '$1 with { type: "json" };'), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText, shortCircuit: true };
    if (url.endsWith('.module.css')) return { format: 'module', source: 'export default new Proxy({}, { get: (_, key) => String(key) })', shortCircuit: true };
    if (url.endsWith('.css')) return { format: 'module', source: 'export {}', shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { default: SourceRecordSetNavigation } = await import('../app/SourceRecordSetNavigation.tsx');
const render = (source, recordSet, open = true) => renderToStaticMarkup(createElement(SourceRecordSetNavigation, { sourceId: source.id, recordSet, initiallyOpen: open }));
const roome = registry.sources.find(row => row.id === 'SRC-ROOME-2026');

test('open Roome set renders 12 current exact links, one Tab stop, disabled previous and live denominator disclosure', () => {
  const html = render(roome, roome.recordSets[0]);
  assert.equal((html.match(/<a /g) ?? []).length, 12);
  assert.equal((html.match(/tabindex="0"/g) ?? []).length, 1);
  assert.equal((html.match(/tabindex="-1"/g) ?? []).length, 11);
  assert.match(html, /Page 1 of 14/);
  assert.match(html, /<button type="button" disabled="">Previous/);
  assert.match(html, /157 of 157 navigation entries match/);
  assert.match(html, /Entry count does not replace the source record-set denominator/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /focusKind=molecular_profile/);
  assert.match(html, /fromSource=SRC-ROOME-2026/);
  assert.match(html, /Export navigation receipt/);
});

test('collapsed set does not mount 157 links or a hidden receipt action', () => {
  const html = render(roome, roome.recordSets[0], false);
  assert.match(html, /157 navigation entries/);
  assert.equal((html.match(/<a /g) ?? []).length, 0);
  assert.doesNotMatch(html, /Export navigation receipt/);
});

test('unavailable roster keeps exact source missingness and no destination or export action', () => {
  const source = registry.sources.find(row => row.recordSets.some(set => set.childRosterRef.status !== 'bundled_exact' && set.sourceObjectSetRef?.status !== 'bundled_exact'));
  const recordSet = source.recordSets.find(set => set.childRosterRef.status !== 'bundled_exact' && set.sourceObjectSetRef?.status !== 'bundled_exact');
  const html = render(source, recordSet);
  assert.equal((html.match(/<a /g) ?? []).length, 0);
  assert.doesNotMatch(html, /Export navigation receipt/);
  assert.match(html, new RegExp(recordSet.childRosterRef.missingReason.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('stale declaration removes links and renders an explicit status instead of old-source actions', () => {
  const altered = structuredClone(roome.recordSets[0]);
  altered.includedRecordCount.value = 0;
  const html = render(roome, altered);
  assert.match(html, /role="status"/);
  assert.match(html, /declaration changed/);
  assert.equal((html.match(/<a /g) ?? []).length, 0);
  assert.doesNotMatch(html, /Export navigation receipt/);
});

test('GLUT markup offers aggregate labels and exact deposited rows with distinct units', () => {
  const source = registry.sources.find(row => row.id === 'SRC-CANOGOMEZ-2026');
  const recordSet = source.recordSets.find(row => row.recordSetId === 'RS-CANOGOMEZ-GLUT-ACTIVE-IDENT-LABELS');
  const html = render(source, recordSet);
  assert.equal((html.match(/<a /g) ?? []).length, 2);
  assert.match(html, /277 aggregate raw GLUT-label summaries; these are not nucleus rows/);
  assert.match(html, /92,782 deposited assignment rows/);
  assert.match(html, /sourcePanel=glut/);
  assert.match(html, /download=""/);
  assert.doesNotMatch(html, /focusKind=molecular_profile/);
});


const { default: ResearchSourceRegistry } = await import('../app/ResearchSourceRegistry.tsx');
const renderRegistry = initialParams => renderToStaticMarkup(createElement(ResearchSourceRegistry, { initialParams }));

test('source bookmark renders the owned Delile dossier and exact fine-roster disclosure on the dedicated source surface', () => {
  const html = renderRegistry({ source: 'SRC-DELILE-2019', recordSet: 'RS-DELILE-FINE-SUBTYPES', lang: 'zh' });
  assert.match(html, /data-source-id="SRC-DELILE-2019"/);
  assert.match(html, /data-record-set-navigation="RS-DELILE-FINE-SUBTYPES"/);
  assert.equal((html.match(/<details class="disclosure" open=""/g) ?? []).length, 1);
  assert.match(html, /51 of 51 navigation entries match/);
  assert.match(html, /focusId=delile-2019/);
  assert.match(html, /0 CROSS-SOURCE IDENTITIES/);
  assert.match(html, /0 REG/);
});

test('unknown source renders explicit missingness without a prior dossier, child links or source export', () => {
  const html = renderRegistry({ source: 'missing-source', recordSet: 'RS-DELILE-FINE-SUBTYPES' });
  assert.match(html, /Requested source unavailable/);
  assert.match(html, /No replacement source was selected/);
  assert.doesNotMatch(html, /data-source-id=/);
  assert.doesNotMatch(html, /data-record-set-navigation=/);
  assert.doesNotMatch(html, /Export source dossier/);
});

test('foreign record-set bookmark retains the requested source but opens no substitute roster', () => {
  const html = renderRegistry({ source: 'SRC-ROOME-2026', recordSet: 'RS-DELILE-FINE-SUBTYPES' });
  assert.match(html, /data-source-id="SRC-ROOME-2026"/);
  assert.match(html, /No replacement record set was opened/);
  assert.equal((html.match(/<details class="disclosure" open=""/g) ?? []).length, 0);
  assert.doesNotMatch(html, /focusId=delile-2019/);
});


test('server source controls stay inert until URL source and owned-set restoration is committed', () => {
  for (const initialParams of [
    { source: 'SRC-CANOGOMEZ-2026', recordSet: 'RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES' },
    { source: 'missing-source' },
    { source: 'SRC-ROOME-2026', recordSet: 'RS-DELILE-FINE-SUBTYPES' },
  ]) {
    const html = renderRegistry(initialParams);
    assert.match(html, /<p class="source-registry-boundary" role="status" aria-live="polite">Preparing source selection…<\/p><section class="source-registry" aria-labelledby="source-registry-heading" inert="" aria-busy="true">/);
  }
});
