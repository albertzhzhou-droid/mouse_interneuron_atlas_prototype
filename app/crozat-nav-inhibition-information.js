import document from '../data/crozat-nav-inhibition-information-0.1.json' with { type: 'json' };

const SOURCE_FILES = new Map([
  [56062562, { sha256: '53216ac2508ca26a3ac03cb40d796ca9973db25bbc120dce9fcf802e33dfbf81', bytes: 11543, rows: 56, metric: 'Dens', unit: 'pA/pF', id: 'nav-ttx-density', headers: ['Cell', 'Region', 'Cond', 'Dens'] }],
  [56062565, { sha256: 'b5e7f7f67d4efc94b0582da92046c292b477f54d03f4016dcbbd6a0c197d5226', bytes: 11016, rows: 28, metric: 'Perc', unit: '%', id: 'nav-ttx-percent', headers: ['Cell', 'Region', 'Perc'] }],
]);
const REGIONS = { Cerv: 'cervical', Tho: 'thoracic', Lomb: 'lumbar' };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (value, reason) => { if (!value) throw new Error(`Crozat NaV source information: ${reason}`); };
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
/** Schema/semantic checks only. Original source bytes are replayed offline by the physical validator. */
export function validateCrozatNaVDocument(doc) {
  check(doc.schemaVersion === '0.1.0' && doc.adapterId === 'crozat-nav-inhibition-information-0.1' && doc.documentType === 'source_table_information_not_cell_roster', 'adapter identity changed');
  check(doc.parentSourceId === 'SRC-CROZAT-2025' && doc.source.version === 2 && doc.source.doi === '10.6084/m9.figshare.29430869.v2' && doc.source.license.name === 'CC BY 4.0', 'version or explicit file rights changed');
  check(equal(doc.summary, { tableCount: 2, sourceObservationRowCount: 84, densityObservationRows: 56, percentageObservationRows: 28, depositWideUniqueCellCount: null, animalMappedRowCount: 0, pairedRowCount: 0, newSourceProfiles: 0, newGeometryObjects: 0, newInternalObjects: 0, registrations: 0 }), 'denominator/admission changed');
  check(doc.scope.observationUnit === 'one original worksheet measurement row' && doc.articleContext.rowSpecificStepDurationOrVoltage === null && doc.articleContext.perRowAnimalAgeSexAndPhysicalCellMapping === null, 'unknown individual evidence promoted');
  check(doc.articleContext.resultsCounts.reportedAnimalN === 10 && doc.articleContext.resultsCounts.reportedObservationN === 28 && equal(doc.articleContext.resultsCounts.regions.map(row => row.reportedObservationN), [12, 6, 10]) && equal(doc.articleContext.figure5DCaptionCounts.regions.map(row => row.reportedObservationN), [12, 8, 6]) && doc.articleContext.figure5DCaptionCounts.derivedSumOfPrintedRegionalN === 26, 'attributed count discrepancy lost');
  check(equal(doc.articleContext.reportedProtocolContexts.map(row => row.stepDurationMs), [100, 50]) && doc.articleContext.ttxConcentration.value === 0.5 && doc.articleContext.ttxConcentration.unit === 'µM', 'attributed protocol context changed');
  check(Object.entries(doc.interpretation).every(([key, value]) => key === 'rawObservationsOnly' ? value === true : value === false), 'scientific interpretation promoted');
  check(doc.tables?.length === 2 && new Set(doc.tables.map(table => table.fileId)).size === 2, 'exact two-table set required');
  const ids = new Set();
  for (const table of doc.tables) {
    const source = SOURCE_FILES.get(table.fileId);
    check(source && table.id === source.id && table.sourceFile.sha256 === source.sha256 && table.sourceFile.bytes === source.bytes && table.sheet === 'DATA R' && equal(table.nativeHeaders, source.headers) && table.metricField === source.metric && table.metricUnit === source.unit && table.sourceHeaderUnit === null, 'source file/header/unit changed');
    check(table.observationRowCount === source.rows && table.observations.length === source.rows && table.distinctRegionNativeLabelKeyCount === 27 && table.distinctKeysCountPhysicalCells === false, 'source row or label count changed');
    for (const [index, row] of table.observations.entries()) {
      check(row.id === `crozat-v2:${table.fileId}:${source.sha256}:DATA R:row${index + 2}` && !ids.has(row.id) && row.sourceRow === index + 2 && row.tableId === table.id, 'row identity/order duplicated or reassigned'); ids.add(row.id);
      check(equal(Object.keys(row.raw), source.headers) && row.nativeCellLabel === row.raw.Cell && /^[1-9]\d*$/.test(row.nativeCellLabel) && row.regionRaw === row.raw.Region && row.region === REGIONS[row.regionRaw], 'raw label/region changed');
      check(row.conditionRaw === (row.raw.Cond ?? null) && (table.fileId === 56062562 ? ['CTR', 'TTX'].includes(row.conditionRaw) : row.conditionRaw === null), 'condition inferred or changed');
      check(row.metricField === source.metric && row.metricUnit === source.unit && row.rawNumericLexical === row.raw[source.metric] && Number(row.rawNumericLexical) === row.value && Number.isFinite(row.value), 'literal measurement or unit changed');
      check(source.headers.every((field, col) => row.cellLocators[field] === `DATA R!${String.fromCharCode(65 + col)}${row.sourceRow}`), 'exact source cell locator changed');
      check(row.nativeLabelIsPhysicalCellIdentity === false && [row.animalId, row.perRowAge, row.perRowSex, row.rawTraceId, row.sourcePairId].every(value => value === null), 'individual identity/pair inferred');
    }
    const conditions = table.fileId === 56062562 ? ['CTR', 'TTX'] : [null];
    for (const [index, raw] of Object.keys(REGIONS).entries()) for (const condition of conditions) check(table.observations.filter(row => row.regionRaw === raw && row.conditionRaw === condition).length === [12, 6, 10][index], 'source regional row denominator changed');
    const collisions = table.observations.filter(row => row.regionRaw === 'Cerv' && row.nativeCellLabel === '11');
    check(collisions.length === (table.fileId === 56062562 ? 4 : 2) && collisions.every(row => row.nativeLabelAuditStatus === 'ambiguous_repeated_native_label'), 'native label collision concealed');
    check(!table.observations.some(row => row.regionRaw === 'Lomb' && row.nativeCellLabel === '4'), 'missing label repaired');
    check(table.rawRange.minimum === Math.min(...table.observations.map(row => row.value)) && table.rawRange.maximum === Math.max(...table.observations.map(row => row.value)), 'raw range changed');
    check(table.fileId === 56062562 ? table.rawRange.minimum === -291.05 && table.rawRange.maximum === 42.67 : table.rawRange.minimum === 93 && table.rawRange.maximum === 143.1, 'raw source values clipped/changed');
  }
  check(ids.size === 84 && doc.conflicts.length === 3 && doc.conflicts.every(row => row.status === 'retained_unresolved'), 'observations/conflicts lost');
  return freeze(doc);
}

// Ownership denotes this reviewed bundled derivative, never fresh XLSX proof or biological verification.
export const crozatNaVInformation = validateCrozatNaVDocument(document);
const ROW_OWNERS = new WeakSet();
const ROWS = freeze(crozatNaVInformation.tables.flatMap(table => table.observations.map(row => {
  const result = freeze({ ...row, sourceFileId: table.fileId, sourceFileName: table.sourceFile.fileName,
    sourceFileSha256: table.sourceFile.sha256, sourceFileUrl: table.sourceFile.url, sourceSheet: table.sheet,
    sourceHeaderUnit: table.sourceHeaderUnit, metricUnitAuthority: table.unitAuthority });
  ROW_OWNERS.add(result); return result;
})));
export function filterCrozatNaVRows(filter = {}) {
  const q = String(filter.query ?? '').trim().toLowerCase();
  return ROWS.filter(row => (!filter.tableId || filter.tableId === 'all' || row.tableId === filter.tableId)
    && (!filter.regionRaw || filter.regionRaw === 'all' || row.regionRaw === filter.regionRaw)
    && (!filter.condition || filter.condition === 'all' || (filter.condition === 'not-deposited' ? row.conditionRaw === null : row.conditionRaw === filter.condition))
    && (!q || row.id.toLowerCase() === q || `${row.sourceFileName} Cell ${row.nativeCellLabel} ${row.regionRaw} ${row.conditionRaw ?? ''} row${row.sourceRow}`.toLowerCase().includes(q)));
}
export function reconcileCrozatNaVSelection(rows, id) { return id && rows.some(row => row.id === id) ? id : null; }
function ownedRows(rows) {
  const ids = new Set();
  for (const row of rows) { check(ROW_OWNERS.has(row) && !ids.has(row.id), 'distinct owned original source rows required'); ids.add(row.id); }
}
export function makeCrozatNaVExport(rows, filter = {}, scope = 'filtered_rows') {
  ownedRows(rows); check(['filtered_rows', 'selected_row'].includes(scope), 'only factual row exports supported');
  const visible = filterCrozatNaVRows(filter);
  check(scope === 'filtered_rows' ? equal(rows.map(row => row.id), visible.map(row => row.id)) : rows.length === 1 && visible.some(row => row === rows[0]), 'current exact filter/selection membership required');
  return freeze({ schemaVersion: '0.1.0', documentType: 'crozat_nav_original_source_rows', adapterId: crozatNaVInformation.adapterId,
    source: crozatNaVInformation.source, scope, filter: { ...filter }, rowCount: rows.length, observationUnit: crozatNaVInformation.scope.observationUnit,
    completeOriginalTableRowCounts: crozatNaVInformation.tables.map(table => ({ fileId: table.fileId, sourceRows: table.observationRowCount })),
    independentPhysicalCellCount: null, animalMappedRowCount: 0, pairCount: 0,
    articleContext: crozatNaVInformation.articleContext, sourceConflicts: crozatNaVInformation.conflicts,
    interpretation: crozatNaVInformation.interpretation, sourceInputs: crozatNaVInformation.derivation.inputs,
    sourceEvidenceMode: 'reviewed_bundled_facts_with_offline_original_xlsx_replay', originalWorkbooksFetchedInBrowser: false,
    actualViewCaptured: false, newSourceProfiles: 0, geometry: 0, registrations: 0, rows });
}
export function crozatNaVCsv(rows) {
  ownedRows(rows);
  const columns = ['id', 'sourceFileId', 'sourceFileName', 'sourceFileSha256', 'sourceSheet', 'sourceRow', 'nativeCellLabel', 'nativeLabelIsPhysicalCellIdentity', 'regionRaw', 'region', 'conditionRaw', 'metricField', 'metricUnit', 'sourceHeaderUnit', 'metricUnitAuthority', 'rawNumericLexical', 'value', 'nativeLabelAuditStatus', 'animalId', 'perRowAge', 'perRowSex', 'sourcePairId', 'raw', 'cellLocators'];
  const quote = value => `"${(value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)).replaceAll('"', '""')}"`;
  return [columns.map(quote).join(','), ...rows.map(row => columns.map(col => quote(row[col])).join(','))].join('\n') + '\n';
}
