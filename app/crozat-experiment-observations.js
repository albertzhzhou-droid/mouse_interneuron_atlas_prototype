/** Source-row browsing only: reused cell integers never become global IDs. */
export function filterCrozatObservations(families, filter = {}) {
  const query = String(filter.query ?? "").trim().toLowerCase();
  return families.flatMap((family) => {
    if (filter.familyId && filter.familyId !== "all" && family.id !== filter.familyId) return [];
    if (filter.category && filter.category !== "all" && family.category !== filter.category) return [];
    return family.observations.filter((row) => {
      if (filter.region && filter.region !== "all" && row.region !== filter.region) return false;
      if (filter.condition && filter.condition !== "all" && row.conditionRaw !== filter.condition) return false;
      return !query || `${family.title} ${family.sourceFile.fileName} ${row.regionRaw} ${row.conditionRaw} ${row.sourceCellLabel ?? "source row"} ${row.sourceRow} ${row.id}`.toLowerCase().includes(query);
    }).map((row) => ({ ...row, familyTitle: family.title, sourceFileId: family.fileId, sourceFileName: family.sourceFile.fileName, sourceSheet: family.sheet, sourceSha256: family.sourceFile.sha256, sourceUrl: family.sourceFile.url, metrics: family.metrics }));
  });
}

export function reconcileCrozatSelection(visible, selectedId) {
  return selectedId && visible.some((row) => row.id === selectedId) ? selectedId : null;
}

export function crozatWithinFamilyPairs(family, observation) {
  if (!family || !observation || family.id !== observation.familyId || observation.sourceCellLabel === null) return [];
  const group = family.completePairGroups.find((item) => item.groupKey === observation.groupKey);
  if (!group) return [];
  const ids = new Set(group.observationIds);
  return family.observations.filter((row) => ids.has(row.id));
}

export function makeCrozatObservationExport(audit, rows, filter, generatedAt, requestedJoinScope = "within_declared_table_family") {
  if (requestedJoinScope !== "within_declared_table_family") throw new Error("Cross-file, cross-family and cross-study identity joins are not supported.");
  const ids = new Set();
  const sourceRows = new Map(audit.families.flatMap((family) => family.observations.map((row) => [row.id, row])));
  for (const row of rows) {
    const source = sourceRows.get(row.id);
    if (!source || ids.has(row.id) || source.familyId !== row.familyId || source.sourceRow !== row.sourceRow || JSON.stringify(source.values) !== JSON.stringify(row.values)) throw new Error("Export requires distinct unchanged source observations.");
    ids.add(row.id);
  }
  return { schemaVersion: "0.1", kind: "crozat_source_experiment_observations", auditId: audit.auditId, generatedAt, filter, source: audit.source, identityPolicy: audit.identityPolicy, rowCount: rows.length, unitOfCount: "source_observation_rows_across_separate_experiment_tables", depositWideUniqueCellCount: null, crossFamilyJoinCount: 0, sameCellJoinCount: 0, geometryCount: 0, registrationAdmissionCount: 0, rows };
}

export function crozatObservationCsv(rows) {
  const columns = ["id", "familyId", "familyTitle", "region", "regionRaw", "sourceCellLabel", "labelKind", "conditionRaw", "conditionOrigin", "sourceFileId", "sourceFileName", "sourceSheet", "sourceRow", "sourceSha256", "sourceUrl", "values", "metrics", "cellLocators"];
  const escape = (value) => `"${(value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)).replaceAll('"', '""')}"`;
  return [columns.join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\r\n");
}
