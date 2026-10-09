export function sourceAuditSampleKey(sample) {
  return `trevisan-v1:GSE275595:${sample.geoSampleAccession}:source-sample`;
}

export function reconcileSourceAuditSelection(visibleSamples, selectedGsm) {
  return visibleSamples.some((sample) => sample.geoSampleAccession === selectedGsm) ? selectedGsm : null;
}

export function sourceAuditNucleusGate(sample, rights) {
  const reasons = [];
  if (sample.workbookRowCount === 0) reasons.push('No final-workbook rows are available for this sample.');
  if (sample.barcodeMissingRowCount > 0 || sample.barcodeMatchedRowCount !== sample.workbookRowCount) reasons.push('The exact final-workbook to source-native barcode crosswalk is incomplete.');
  if (sample.clusterAssignment == null) reasons.push('No exact per-nucleus cluster assignment is supplied.');
  if (rights.publicAssetPackagingAllowed !== true) reasons.push('File-specific reuse and release scope remain unresolved.');
  return { admitted: reasons.length === 0, reasons };
}

export function filterSourceAuditSamples(samples, query = "", cohort = "all") {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return samples.filter((sample) => {
    const atlas = /^P(?:0|14|28|56)[CLT]R[12]$/.test(sample.sampleTitle);
    if (cohort === "atlas" && !atlas) return false;
    if (cohort === "en1" && !/^P0(?:Het|Ko)R[12]$/.test(sample.sampleTitle)) return false;
    if (cohort === "embryonic" && sample.age.developmentalEpoch !== "embryonic") return false;
    const text = [sample.geoSampleAccession, sample.sampleTitle, ...Object.values(sample.characteristics).map((field) => field.value)].join(" ").toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

export function filterPublicationDiscoveryRecords(records, query = "", status = "all") {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    if (status !== "all" && record.publicationDiscoveryStatus !== status) return false;
    const text = [record.neuronId, record.nameRaw, record.archiveRaw, record.release, ...record.referencePmidRaw, ...record.referenceDoiRaw].join(" ").toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

export function makeSourceAuditExport({ kind, audit, records, filter, generatedAt }) {
  if (!['sample_characteristics', 'bounded_publication_discovery'].includes(kind)) throw new Error('Unknown audit export kind');
  const keys = records.map((row) => kind === 'sample_characteristics' ? sourceAuditSampleKey(row) : `NeuroMorpho:${row.release}:${row.neuronId}`);
  if (keys.length !== new Set(keys).size) throw new Error('Duplicate source identity in audit export');
  return {
    format: 'ohri-exact-source-audit-export', version: '0.1.0', kind, auditId: audit.auditId,
    sourceAuditDate: audit.auditDate, generatedAt, filter, rowCount: records.length,
    interpretation: kind === 'sample_characteristics'
      ? 'GEO sample characteristics and final-figure workbook selection counts. Barcode/matrix conflicts prevent runtime nucleus-roster admission; samples and workbook rows are not independent-animal or prevalence counts.'
      : 'Bounded candidate discovery across 1097 frozen morphology records plus 30 independent Todd records and ten pinned taxonomy publications. Unmatched here does not prove absence elsewhere.',
    sourcePayloadsIncluded: false, runtimeRosterAdmission: false, sameCellJoins: 0, geometryObjects: 0, atlasRegistrations: 0,
    records: records.map((record, index) => ({ sourceKey: keys[index], ...record })),
  };
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function sourceAuditCsv(kind, records) {
  const fields = kind === 'sample_characteristics'
    ? ['source_key','gsm','sample_title','source_age','region','replicate','genotype','workbook_selection_rows','native_barcode_columns','matched_rows','missing_rows','admission','source_locator','geometry_objects','same_cell_joins']
    : ['source_key','nmo_id','release','source_name','raw_pmids','raw_dois','bounded_publication_status','reason','object_identity','source_locator','geometry_objects','same_cell_joins'];
  const rows = records.map((row) => kind === 'sample_characteristics'
    ? [sourceAuditSampleKey(row),row.geoSampleAccession,row.sampleTitle,row.age.sourceText,row.characteristics.region.value,row.characteristics.replicate.value,row.characteristics.genotype.value,row.workbookRowCount,row.nativeBarcodeCount,row.barcodeMatchedRowCount,row.barcodeMissingRowCount,row.finalNucleusRosterAdmission,row.characteristics.age.locator,0,0]
    : [`NeuroMorpho:${row.release}:${row.neuronId}`,row.neuronId,row.release,row.nameRaw,JSON.stringify(row.referencePmidRaw),JSON.stringify(row.referenceDoiRaw),row.publicationDiscoveryStatus,row.reason,'not_established',row.locator,0,0]);
  return [fields, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

const SAMPLE_BOOKMARK_PARAMETERS = ['sampleAudit', 'sampleAuditDate', 'sampleKey', 'sampleQuery', 'sampleCohort'];
const SAMPLE_COHORTS = new Set(['all', 'atlas', 'en1', 'embryonic']);
const EMPTY_SAMPLE_BOOKMARK = { query: '', cohort: 'all', selectedKey: null };

function sampleBookmarkContext(audit) {
  if (audit?.auditId !== 'trevisan-v1-exact-input-crosswalk-audit-0.1'
      || audit.source?.geoSeries !== 'GSE275595' || !/^\d{4}-\d{2}-\d{2}$/.test(audit.auditDate)
      || !Array.isArray(audit.samples)) throw new Error('Invalid current V1 sample audit context');
  const records = new Map();
  for (const sample of audit.samples) {
    if (!/^GSM\d+$/.test(sample?.geoSampleAccession)) throw new Error('Invalid exact GEO sample identity');
    const key = sourceAuditSampleKey(sample);
    if (records.has(key)) throw new Error('Duplicate exact GEO sample identity');
    records.set(key, sample);
  }
  return records;
}

/** Product bookmark only: decoding a sample never admits its barcode/cluster roster. */
export function readSourceAuditSampleBookmark(params, audit) {
  const records = sampleBookmarkContext(audit);
  if (!(params instanceof URLSearchParams)) throw new TypeError('Expected URLSearchParams');
  const invalid = (error, state = EMPTY_SAMPLE_BOOKMARK) => ({ status: 'invalid', error, ...state, selectedKey: null });
  if (!SAMPLE_BOOKMARK_PARAMETERS.some((key) => params.has(key))) return { status: 'default', error: null, ...EMPTY_SAMPLE_BOOKMARK };
  if (SAMPLE_BOOKMARK_PARAMETERS.some((key) => params.getAll(key).length > 1)) return invalid('This sample link repeats a source or selection parameter.');
  if (params.get('sampleAudit') !== audit.auditId || params.get('sampleAuditDate') !== audit.auditDate) {
    return invalid('This sample link does not match the current V1 source audit and date.');
  }
  const query = params.get('sampleQuery') ?? '';
  const cohort = params.get('sampleCohort') ?? 'all';
  if (query.length > 180 || !SAMPLE_COHORTS.has(cohort)) return invalid('This sample link has an invalid search or sample set.');
  const state = { query, cohort, selectedKey: params.get('sampleKey') };
  if (state.selectedKey !== null && !records.has(state.selectedKey)) return invalid('This sample link does not identify an exact current GEO sample.', state);
  if (state.selectedKey !== null && !filterSourceAuditSamples(audit.samples, query, cohort).some((sample) => sourceAuditSampleKey(sample) === state.selectedKey)) {
    return invalid('The linked sample is outside its saved search or sample set.', state);
  }
  return { status: 'ready', error: null, ...state };
}

export function writeSourceAuditSampleBookmark(params, state, audit) {
  const records = sampleBookmarkContext(audit);
  if (!(params instanceof URLSearchParams)) throw new TypeError('Expected URLSearchParams');
  if (typeof state?.query !== 'string' || state.query.length > 180 || !SAMPLE_COHORTS.has(state.cohort)
      || (state.selectedKey !== null && (typeof state.selectedKey !== 'string' || !records.has(state.selectedKey)))) {
    throw new Error('Invalid exact source sample bookmark state');
  }
  if (state.selectedKey !== null && !filterSourceAuditSamples(audit.samples, state.query, state.cohort).some((sample) => sourceAuditSampleKey(sample) === state.selectedKey)) {
    throw new Error('Selected sample is outside the current visible sample set');
  }
  const next = new URLSearchParams(params);
  for (const key of SAMPLE_BOOKMARK_PARAMETERS) next.delete(key);
  if (state.query !== '' || state.cohort !== 'all' || state.selectedKey !== null) {
    next.set('sampleAudit', audit.auditId);
    next.set('sampleAuditDate', audit.auditDate);
    if (state.query !== '') next.set('sampleQuery', state.query);
    if (state.cohort !== 'all') next.set('sampleCohort', state.cohort);
    if (state.selectedKey !== null) next.set('sampleKey', state.selectedKey);
  }
  return next;
}

export function sourceAuditSampleHref(audit, sample) {
  const params = writeSourceAuditSampleBookmark(new URLSearchParams(), {
    query: '', cohort: 'all', selectedKey: sourceAuditSampleKey(sample),
  }, audit);
  return `/source-audits?${params.toString()}#source-exact-inputs`;
}
