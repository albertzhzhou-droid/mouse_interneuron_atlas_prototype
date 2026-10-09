import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { crozatNaVInformation as doc, validateCrozatNaVDocument, filterCrozatNaVRows, makeCrozatNaVExport, crozatNaVCsv, reconcileCrozatNaVSelection } from '../app/crozat-nav-inhibition-information.js';

const rows = filterCrozatNaVRows();
const digest = (bytes, kind = 'sha256') => createHash(kind).update(bytes).digest('hex');
function originalCells(path) {
  const workbook = execFileSync('unzip', ['-p', path, 'xl/workbook.xml'], { encoding: 'utf8' });
  const sheet = workbook.match(/<sheet\b[^>]*\bname="([^"]+)"/)[1];
  const strings = [...execFileSync('unzip', ['-p', path, 'xl/sharedStrings.xml'], { encoding: 'utf8' }).matchAll(/<si>(.*?)<\/si>/gs)].map(match => [...match[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(item => item[1]).join(''));
  const xml = execFileSync('unzip', ['-p', path, 'xl/worksheets/sheet1.xml'], { encoding: 'utf8' });
  assert.doesNotMatch(xml, /<f[ >]/);
  const cells = new Map();
  for (const [, attrs, body] of xml.matchAll(/<c\b([^>]*)>(.*?)<\/c>/gs)) {
    const ref = attrs.match(/\br="([A-Z]+\d+)"/)[1], value = body.match(/<v>(.*?)<\/v>/s)?.[1];
    if (value !== undefined) cells.set(ref, /\bt="s"/.test(attrs) ? strings[Number(value)] : value);
  }
  return { cells, sheet };
}

test('all84 raw measurements and row identities reconcile independently against exact original workbook bytes/cells', async () => {
  for (const table of doc.tables) {
    const location = new URL(`../${table.sourceFile.path}`, import.meta.url), bytes = await readFile(location);
    assert.equal(bytes.length, table.sourceFile.bytes); assert.equal(digest(bytes), table.sourceFile.sha256); assert.equal(digest(bytes, 'md5'), table.sourceFile.publisherMd5);
    const { cells, sheet } = originalCells(location.pathname);
    assert.equal(table.sheet, sheet); assert.equal(sheet, 'DATA R');
    for (const row of table.observations) for (const [field, raw] of Object.entries(row.raw)) {
      assert.equal(cells.get(row.cellLocators[field].split('!')[1]), raw);
      assert.equal(row.id, `crozat-v2:${table.fileId}:${table.sourceFile.sha256}:${sheet}:row${row.sourceRow}`);
    }
    assert.equal(table.observationRowCount + 1, new Set([...cells.keys()].map(key => key.match(/\d+/)[0])).size);
  }
  assert.equal(rows.length, 84); assert.equal(doc.summary.depositWideUniqueCellCount, null);
});
test('duplicate Cerv11, missing Lomb4, signed density and percentages above100 remain unmodified row evidence', () => {
  assert.equal(rows.filter(row => row.nativeLabelAuditStatus === 'ambiguous_repeated_native_label').length, 6);
  assert.ok(!rows.some(row => row.regionRaw === 'Lomb' && row.nativeCellLabel === '4'));
  assert.equal(rows.find(row => row.sourceFileId === 56062562 && row.sourceRow === 4).rawNumericLexical, '-147.41999999999999');
  assert.equal(Math.max(...rows.filter(row => row.metricField === 'Perc').map(row => row.value)), 143.1);
  assert.equal(Math.min(...rows.filter(row => row.metricField === 'Dens').map(row => row.value)), -291.05);
  for (const table of doc.tables) { assert.equal(table.distinctRegionNativeLabelKeyCount, 27); assert.equal(table.distinctKeysCountPhysicalCells, false); assert.equal(table.sourceHeaderUnit, null); }
});
test('exact table/region/condition filters retain separate denominators and clear unavailable selection', () => {
  const filtered = filterCrozatNaVRows({ tableId: 'nav-ttx-density', regionRaw: 'Cerv', condition: 'TTX' });
  assert.equal(filtered.length, 12); assert.equal(filterCrozatNaVRows({ condition: 'not-deposited' }).length, 28);
  assert.equal(filterCrozatNaVRows({ tableId: 'nav-ttx-percent', condition: 'TTX' }).length, 0);
  assert.equal(filterCrozatNaVRows({ regionRaw: 'Thor' }).length, 0);
  assert.equal(filterCrozatNaVRows({ query: 'not-an-original-label' }).length, 0);
  assert.equal(filterCrozatNaVRows({ query: 'Cell 11' }).length, 9); // Also includes the deposited Lomb11 labels, without treating labels as physical identity.
  assert.equal(filterCrozatNaVRows({ query: 'row12' }).length, 2);
  assert.equal(filterCrozatNaVRows({ query: doc.tables[0].sourceFile.sha256 }).length, 0); // Hash substrings do not replace a label or row search.
  assert.equal(filterCrozatNaVRows({ query: filtered[0].id }).length, 1);
  assert.equal(reconcileCrozatNaVSelection(filtered, rows[0].id), null);
  assert.equal(reconcileCrozatNaVSelection(filtered, filtered[0].id), filtered[0].id);
});
test('only owned immutable source rows can export; clones, foreign filters, duplicates and inferred scopes reject', () => {
  assert.ok(rows.every(Object.isFrozen));
  const filtered = filterCrozatNaVRows({ tableId: 'nav-ttx-density', regionRaw: 'Cerv', condition: 'TTX' });
  const receipt = makeCrozatNaVExport(filtered, { tableId: 'nav-ttx-density', regionRaw: 'Cerv', condition: 'TTX' });
  assert.equal(receipt.rowCount, 12); assert.deepEqual(receipt.completeOriginalTableRowCounts.map(item => item.sourceRows), [56, 28]);
  assert.equal(receipt.independentPhysicalCellCount, null); assert.equal(receipt.pairCount, 0); assert.equal(receipt.animalMappedRowCount, 0);
  assert.equal(receipt.originalWorkbooksFetchedInBrowser, false); assert.equal(receipt.actualViewCaptured, false);
  assert.throws(() => makeCrozatNaVExport(structuredClone(filtered)), /owned/);
  assert.throws(() => crozatNaVCsv([filtered[0], filtered[0]]), /distinct/);
  assert.throws(() => makeCrozatNaVExport(filtered, { tableId: 'nav-ttx-percent' }), /membership/);
  assert.throws(() => makeCrozatNaVExport(filtered, {}, 'paired_cells'), /factual/);
  assert.throws(() => makeCrozatNaVExport([filtered[0]], { tableId: 'nav-ttx-percent' }, 'selected_row'), /membership/);
  const csv = crozatNaVCsv(rows); assert.equal(csv.trimEnd().split('\n').length, 85); assert.match(csv, /-147\.41999999999999/);
  assert.match(csv, /nativeLabelIsPhysicalCellIdentity/); assert.match(csv, /attributed_primary_article_unit_not_workbook_header/);
  assert.ok(rows.every(row => row.sourceHeaderUnit === null && row.metricUnitAuthority.locator.articleUrl === doc.source.articleUrl));
});
test('runtime checks reject source/unit/count, repaired-label, clipping and unverified individual-evidence promotions', () => {
  for (const mutate of [
    d => { d.source.license.name = 'NOASSERTION'; }, d => { d.tables[0].sourceFile.sha256 = '0'.repeat(64); },
    d => { d.tables[0].observations[0].metricUnit = 'mV'; }, d => { d.summary.depositWideUniqueCellCount = 84; },
    d => { d.tables[0].observations[10].nativeCellLabel = '12'; },
    d => { d.tables[1].observations[1].value = 100; d.tables[1].observations[1].raw.Perc = '100'; d.tables[1].observations[1].rawNumericLexical = '100'; },
    d => { d.articleContext.rowSpecificStepDurationOrVoltage = 100; },
    d => { d.tables[0].observations[0].sourcePairId = 'invented'; },
    d => { d.interpretation.statisticalTestsOrSignificanceRecomputed = true; },
  ]) { const changed = structuredClone(doc); mutate(changed); assert.throws(() => validateCrozatNaVDocument(changed)); }
});
test('primary count and protocol contradictions retain their attributed roles without becoming per-row settings', () => {
  assert.deepEqual(doc.articleContext.resultsCounts.regions.map(row => row.reportedObservationN), [12, 6, 10]);
  assert.deepEqual(doc.articleContext.figure5DCaptionCounts.regions.map(row => row.reportedObservationN), [12, 8, 6]);
  assert.equal(doc.articleContext.resultsCounts.reportedAnimalN, 10);
  assert.deepEqual(doc.articleContext.reportedProtocolContexts.map(row => row.stepDurationMs), [100, 50]);
  assert.equal(doc.articleContext.reportedProtocolContexts[0].reportedIVPeakVoltageMv, 0);
  assert.equal(doc.articleContext.reportedProtocolContexts[1].reportedInhibitionStepVoltageMv, 10);
  assert.equal(doc.articleContext.rowSpecificStepDurationOrVoltage, null);
  assert.ok(rows.every(row => row.animalId === null && row.perRowAge === null && row.sourcePairId === null));
});
async function component(filename) {
  const url = new URL(`../app/${filename}`, import.meta.url), source = await readFile(url, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const nativeRequire = createRequire(url), commonjsModule = { exports: {} };
  new vm.Script(output, { filename: url.pathname }).runInContext(vm.createContext({ module: commonjsModule, exports: commonjsModule.exports, require: name => name.endsWith('.css') ? {} : nativeRequire(name) }));
  return commonjsModule.exports.default;
}
test('actual React SSR preserves the previous23-table browser and closed new disclosure; new panel has rows and no default selected record', async () => {
  const [Parent, Child] = await Promise.all([component('CrozatExperimentObservationBrowser.tsx'), component('CrozatNaVInhibitionInformation.tsx')]);
  const parent = renderToStaticMarkup(React.createElement(Parent));
  assert.match(parent, /23 declared experiment tables/); assert.match(parent, /2,115 separate-table observation rows/);
  assert.match(parent, /data-testid="crozat-nav-additional-disclosure"/); assert.doesNotMatch(parent, /data-testid="crozat-nav-inhibition-information"/);
  const child = renderToStaticMarkup(React.createElement(Child));
  assert.match(child, /84 matching original measurement rows/); assert.match(child, /Cell 11/); assert.match(child, /No rows are paired/);
  assert.doesNotMatch(child, /data-testid="crozat-nav-selected-row"|Export this NaV row JSON/);
  assert.match(child, /-30\.98/); // Actual server markup retains the first original signed source value.
});
