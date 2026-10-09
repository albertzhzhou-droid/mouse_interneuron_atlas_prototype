export const UNREPORTED_SOURCE_STRAIN = "__source_strain_unreported__";
export const UNREPORTED_SOURCE_CELL_TYPE = "__source_cell_type_unreported__";
export const UNREPORTED_SOURCE_DOI = "__source_doi_unreported__";
export const UNREPORTED_SOURCE_ARCHIVE = "__source_archive_unreported__";

export function sourceStrainValues(record) {
  const raw = record?.officialMetadata?.strain;
  const values = Array.isArray(raw)
    ? raw.filter((value) => typeof value === "string" && value.length > 0)
    : typeof raw === "string" && raw.length > 0 ? [raw] : [];
  return values.length ? [...new Set(values)] : [UNREPORTED_SOURCE_STRAIN];
}

export function buildSourceStrainFacetOptions(records) {
  const counts = new Map();
  for (const record of records) {
    for (const value of sourceStrainValues(record)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: value === UNREPORTED_SOURCE_STRAIN ? "Missing (not source-reported)" : value,
      count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function filterUniverseBySourceStrain(records, selectedValue) {
  if (selectedValue === "all") return records;
  return records.filter((record) => sourceStrainValues(record).includes(selectedValue));
}

// NeuroMorpho's official cell_type values are source-curated hierarchy labels.
// Keep their exact strings and multi-label membership; do not harmonize types.
export function sourceCellTypeValues(record) {
  const raw = record?.officialMetadata?.cell_type;
  const values = Array.isArray(raw)
    ? raw.filter((value) => typeof value === "string" && value.length > 0)
    : typeof raw === "string" && raw.length > 0 ? [raw] : [];
  return values.length ? [...new Set(values)] : [UNREPORTED_SOURCE_CELL_TYPE];
}

export function buildSourceCellTypeFacetOptions(records) {
  const counts = new Map();
  for (const record of records) {
    for (const value of sourceCellTypeValues(record)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: value === UNREPORTED_SOURCE_CELL_TYPE ? "Missing (not source-reported)" : value,
      count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function filterUniverseBySourceCellType(records, selectedValue) {
  if (selectedValue === "all") return records;
  return records.filter((record) => sourceCellTypeValues(record).includes(selectedValue));
}

// Source-paper and cell-type strings are deliberately not normalized. DOI × label
// membership is a provenance cross-tab, not a reconciled biological taxonomy.
export function sourcePaperDoiValues(record) {
  const raw = record?.sourcePaper?.dois;
  const values = Array.isArray(raw)
    ? raw.filter((value) => typeof value === "string" && value.length > 0)
    : typeof raw === "string" && raw.length > 0 ? [raw] : [];
  return values.length ? [...new Set(values)] : [UNREPORTED_SOURCE_DOI];
}

function sourceArchiveValue(record) {
  const raw = record?.officialMetadata?.archive;
  return typeof raw === "string" && raw.length > 0 ? raw : UNREPORTED_SOURCE_ARCHIVE;
}

function exactNmoId(record) {
  const value = record?.neuronId;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return String(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return value;
  return null;
}

function compareNmoIds(left, right) {
  if (/^\d+$/.test(left) && /^\d+$/.test(right)) {
    const a = BigInt(left);
    const b = BigInt(right);
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return left.localeCompare(right);
}

function compareExactStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function countsByValue(counts) {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => compareExactStrings(left.value, right.value));
}

function addUniqueRecord(bucket, recordToken, nmoId) {
  if (bucket.recordTokens.has(recordToken)) return false;
  bucket.recordTokens.add(recordToken);
  if (nmoId !== null) bucket.nmoIds.add(nmoId);
  return true;
}

function createPaperBucket(doi) {
  return {
    doi,
    recordTokens: new Set(),
    nmoIds: new Set(),
    archiveCounts: new Map(),
    multiDoiRecordTokens: new Set(),
    multiLabelRecordTokens: new Set(),
    cellTypes: new Map(),
  };
}

function createCellTypeBucket(value) {
  return { value, recordTokens: new Set(), nmoIds: new Set(), archiveCounts: new Map() };
}

function hasExplicitFigureMembership(record) {
  const candidates = [
    record?.sourcePaper?.figure,
    record?.sourcePaper?.figures,
    record?.sourcePaper?.figureId,
    record?.sourcePaper?.figureIds,
    record?.sourcePaper?.figureMembership,
    record?.sourcePaper?.figureMemberships,
  ];
  return candidates.some((value) => (typeof value === "string" && value.length > 0)
    || (Array.isArray(value) && value.some((entry) => typeof entry === "string" && entry.length > 0)));
}

export function buildPaperCellTypeCrossTab(records) {
  const papers = new Map();
  const allNmoIds = new Set();
  let recordsWithoutNmoIdCount = 0;
  let recordsWithoutDoiCount = 0;
  let multiDoiRecordCount = 0;
  let multiLabelRecordCount = 0;
  let figureMembershipRecordCount = 0;
  const missingDoiBucket = createPaperBucket(UNREPORTED_SOURCE_DOI);

  records.forEach((record, index) => {
    const nmoId = exactNmoId(record);
    if (nmoId === null) recordsWithoutNmoIdCount += 1;
    else allNmoIds.add(nmoId);
    const recordToken = nmoId === null ? `__record_without_nmo_id_${index}__` : `nmo:${nmoId}`;
    const dois = sourcePaperDoiValues(record);
    const cellTypes = sourceCellTypeValues(record);
    const archive = sourceArchiveValue(record);
    if (dois.length === 1 && dois[0] === UNREPORTED_SOURCE_DOI) recordsWithoutDoiCount += 1;
    if (dois.length > 1) multiDoiRecordCount += 1;
    if (cellTypes.length > 1) multiLabelRecordCount += 1;
    if (hasExplicitFigureMembership(record)) figureMembershipRecordCount += 1;

    for (const doi of dois) {
      const paper = doi === UNREPORTED_SOURCE_DOI
        ? missingDoiBucket
        : papers.get(doi) ?? createPaperBucket(doi);
      if (doi !== UNREPORTED_SOURCE_DOI && !papers.has(doi)) papers.set(doi, paper);
      if (!addUniqueRecord(paper, recordToken, nmoId)) continue;
      paper.archiveCounts.set(archive, (paper.archiveCounts.get(archive) ?? 0) + 1);
      if (dois.length > 1) paper.multiDoiRecordTokens.add(recordToken);
      if (cellTypes.length > 1) paper.multiLabelRecordTokens.add(recordToken);

      for (const cellType of cellTypes) {
        let cellTypeBucket = paper.cellTypes.get(cellType);
        if (!cellTypeBucket) {
          cellTypeBucket = createCellTypeBucket(cellType);
          paper.cellTypes.set(cellType, cellTypeBucket);
        }
        if (!addUniqueRecord(cellTypeBucket, recordToken, nmoId)) continue;
        cellTypeBucket.archiveCounts.set(archive, (cellTypeBucket.archiveCounts.get(archive) ?? 0) + 1);
      }
    }
  });

  const toPaperRow = (paper) => ({
    doi: paper.doi,
    recordCount: paper.recordTokens.size,
    nmoIds: [...paper.nmoIds].sort(compareNmoIds),
    recordsWithoutNmoIdCount: paper.recordTokens.size - paper.nmoIds.size,
    archiveCounts: countsByValue(paper.archiveCounts),
    multiDoiRecordCount: paper.multiDoiRecordTokens.size,
    multiLabelRecordCount: paper.multiLabelRecordTokens.size,
    cellTypeRows: [...paper.cellTypes.values()]
      .map((cellType) => ({
        value: cellType.value,
        recordCount: cellType.recordTokens.size,
        nmoIds: [...cellType.nmoIds].sort(compareNmoIds),
        recordsWithoutNmoIdCount: cellType.recordTokens.size - cellType.nmoIds.size,
        archiveCounts: countsByValue(cellType.archiveCounts),
      }))
      .sort((left, right) => compareExactStrings(left.value, right.value)),
  });

  const paperRows = [...papers.values()]
    .map(toPaperRow)
    .sort((left, right) => compareExactStrings(left.doi, right.doi));
  const missingDoi = missingDoiBucket.recordTokens.size ? toPaperRow(missingDoiBucket) : null;
  const doiMembershipCount = paperRows.reduce((sum, paper) => sum + paper.recordCount, 0);
  return {
    recordCount: records.length,
    uniqueNmoIdCount: allNmoIds.size,
    recordsWithoutNmoIdCount,
    doiCount: paperRows.length,
    doiMembershipCount,
    recordsWithoutDoiCount,
    multiDoiRecordCount,
    multiLabelRecordCount,
    figureMembershipRecordCount,
    figureMembershipUnassessableRecordCount: records.length - figureMembershipRecordCount,
    figureMembershipStatus: figureMembershipRecordCount > 0 ? "partially_encoded" : "not_encoded_in_index",
    papers: paperRows,
    missingDoi,
  };
}
