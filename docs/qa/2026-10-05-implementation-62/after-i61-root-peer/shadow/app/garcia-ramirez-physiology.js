import data from '../data/garcia-ramirez-adult-spinal-physiology-0.1.json' with { type: 'json' };
import derivation from '../data/garcia-ramirez-adult-spinal-physiology-derivation-receipt-0.1.json' with { type: 'json' };

const fail = message => { throw new Error(`Garcia-Ramirez aggregate physiology: ${message}`); };
const check = (value, message) => { if (!value) fail(message); };
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const prefix = 'garcia-ramirez-2022:aggregate-physiology:';
const counts = [[143, 28], [88, 49, 24, 10], [23, 11, 68, 69], [15, 20, 32, 25, 27, 52]];
const partitions = ['reporter_population', 'firing_pattern', 'k_means', 'hierarchical'];
const properties = ['membrane_potential', 'input_resistance', 'time_constant', 'capacitance', 'rheobase', 'ap_threshold', 'ap_half_width', 'fahp_duration', 'sahp_duration', 'normalized_fahp_amplitude', 'pic_on_voltage', 'fi_slope'];

export function validateGarciaRamirezPhysiology(facts = data, receipt = derivation) {
  check(facts.schemaVersion === '0.1.0' && facts.authority === 'source_reported_aggregate_statistics', 'schema or source authority changed');
  check(facts.source.publication.doi === '10.3389/fncir.2022.957084' && facts.source.publication.pmcid === 'PMC9385948', 'publication identity changed');
  check(facts.source.supplement.fileId === 36551718 && facts.source.supplement.md5 === 'cd540639b14fda1fd1149b235384b795', 'exact supplement identity changed');
  check(facts.source.rights.url === 'https://creativecommons.org/licenses/by/4.0/' && same(facts.source.inputPins, receipt.sourceInputs), 'source pin or asset licence changed');
  check(facts.studyScope.ageWeeksMinimum === 8 && facts.studyScope.ageWeeksMaximum === 25 && facts.studyScope.spinalSegmentsSourceRaw === 'L2–5', 'study stage or spinal scope changed');
  const pool = facts.studyScope.recordedPool;
  check(pool.id === prefix + 'recorded-pool-171' && pool.value === 171 && pool.Shox2 === 143 && pool.Chx10 === 28 && pool.unit === 'source_recorded_neuronal_observations', 'recorded source denominator changed');
  check(pool.independentAnimalCount === null && pool.cellToAnimalMapping === null && facts.studyScope.sex === null, 'unknown cell-level or sex metadata was filled');
  check(same(facts.studyScope.animalCohorts.map(row => row.reportedMice), [51, 6]), 'animal cohorts changed');
  check(facts.studyScope.priorStudyReuse.recordedShox2Observations === 60 && facts.studyScope.priorStudyReuse.reportedMice === 28 && facts.studyScope.priorStudyReuse.isSubsetOfCurrentShox2Cohort === true, 'prior-study subset was changed or pooled');
  check(facts.studyScope.statisticsConvention.summary === 'mean ± SD', 'source uncertainty kind changed');
  check(same(facts.studyScope.firingComposition.map(row => row.recordedObservationCount), [78, 10, 36, 13, 21, 3, 8, 2]), 'source firing composition changed');
  check(same(facts.studyScope.firingComposition.map(row => row.reporterPopulationRaw), ['Shox2', 'Chx10', 'Shox2', 'Chx10', 'Shox2', 'Chx10', 'Shox2', 'Chx10']), 'source firing reporter labels changed');
  check(facts.tables.length === 4, 'source table count changed');
  let valueCount = 0;
  facts.tables.forEach((table, index) => {
    check(table.id === prefix + `ST${index + 1}` && table.partitionKind === partitions[index], 'source partition identity changed');
    check(table.sourceRecordedPoolDenominatorId === pool.id && table.groupCountSum === pool.value && same(table.groups.map(row => row.recordedObservationCount), counts[index]), 'alternative partition denominator changed');
    check(table.groups.every((group, column) => group.id === prefix + `ST${index + 1}:group:${column + 1}` && group.physicalCellRosterAvailable === false && group.countUnit === pool.unit), 'aggregate group was promoted to a cell roster');
    check(same(table.propertyRows.map(row => row.propertyId), properties), 'source property membership changed');
    for (const [rowIndex, row] of table.propertyRows.entries()) {
      check(row.values.length === table.groups.length, 'source group summary count changed');
      const printedUnit = /\[([^\]]+)\]/.exec(row.propertyLabelRaw);
      check(row.unitRaw === (printedUnit?.[1] ?? null), 'source printed property unit changed');
      if (row.propertyId === 'normalized_fahp_amplitude' || row.propertyId === 'fi_slope') check(row.unitRaw === null && typeof row.unitNotPrintedReason === 'string', 'missing source unit was inferred');
      row.values.forEach((value, column) => {
        const match = /^\s*([-−]?\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)\s*$/.exec(value.raw);
        check(match && Number(match[1].replace('−', '-')) === value.mean && Number(match[2]) === value.standardDeviation && value.uncertaintyKind === 'source_reported_standard_deviation', 'reported mean/SD raw value changed');
        check(value.groupId === table.groups[column].id && value.locator.tableOrdinal === index + 1 && value.locator.rowOneBased === rowIndex + 2 && value.locator.columnOneBased === column + 2, 'source row/column context changed');
        valueCount++;
      });
      const p = /^\s*(\*)?(\d+(?:\.\d+)?)\s*$/.exec(row.reportedComparison.pValueRaw);
      check(p && Number(p[2]) === row.reportedComparison.pValue && Boolean(p[1]) === row.reportedComparison.asteriskRaw, 'reported comparison annotation changed');
    }
  });
  check(valueCount === 192 && facts.derivation.propertyRows === 48 && facts.derivation.reportedStatisticalComparisons === 48 && same(facts.derivation, receipt.validation), 'source derivation counts changed');
  const boundary = facts.studyScope.interpretationBoundary;
  check(['newMolecularProfiles', 'newPhysicalCellRosterRows', 'newObservedGeometryObjects', 'sameCellCrossSourceJoins', 'registrations', 'M2Admission', 'M4Admission'].every(key => boundary[key] === 0), 'aggregate facts gained unsupported objects or joins');
  check(boundary.sourceTracesAvailableInAdapterScope === false && boundary.rawAbfFilesAvailableInAdapterScope === false && boundary.physiologyGroupsAreMolecularCellTypes === false && boundary.clusterLabelsAreGeneticLineage === false && boundary.adultAtlasCoordinatesEstablished === false, 'source interpretation boundary changed');
  check(same(boundary, receipt.admissionBoundary) && facts.derivation.sourceCodeExecuted === false && facts.derivation.statisticalReanalysisPerformed === false && facts.derivation.rosterCreated === false, 'source authority or receipt changed');
  return { sourceTables: 4, propertyRows: 48, sourceMeanSdValues: valueCount, sourceReportedComparisons: 48, recordedObservationDenominator: pool.value, newProfiles: 0, newCellRosterRows: 0, geometryObjects: 0, registrations: 0 };
}

validateGarciaRamirezPhysiology();
export const garciaRamirezPhysiologyFacts = freeze(data);
export const garciaRamirezPhysiologyDerivation = freeze(derivation);

export function readGarciaRamirezPhysiologyView(params) {
  const requested = params.getAll('physiologyTable');
  const tableId = requested.length ? requested[0] : 'ST1';
  const valid = requested.length <= 1 && /^ST[1-4]$/.test(tableId);
  return { tableId: valid ? tableId : null, query: params.get('physiologyQuery') ?? '', error: valid ? null : 'The requested published table is unknown or ambiguous. Choose a table to continue.' };
}

export function writeGarciaRamirezPhysiologyView(href, view) {
  check(/^ST[1-4]$/.test(view.tableId) && typeof view.query === 'string', 'unsupported table selection');
  const url = new URL(href, 'http://localhost');
  url.searchParams.set('physiologyTable', view.tableId);
  if (view.query) url.searchParams.set('physiologyQuery', view.query);
  else url.searchParams.delete('physiologyQuery');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function garciaRamirezSourceTable(tableId) {
  if (!/^ST[1-4]$/.test(tableId ?? '')) return null;
  return garciaRamirezPhysiologyFacts.tables.find(table => table.id === prefix + tableId) ?? null;
}

export function garciaRamirezPropertyRows(table, query = '') {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return table.propertyRows.filter(row => tokens.every(token => `${row.propertyLabelRaw} ${row.propertyId}`.toLowerCase().includes(token)));
}

export function exportGarciaRamirezPhysiology(view) {
  const table = garciaRamirezSourceTable(view.tableId);
  check(table, 'no exact source table selected');
  return { documentType: 'garcia_ramirez_source_aggregate_physiology_facts', schemaVersion: '0.1.0', sourceFacts: structuredClone(garciaRamirezPhysiologyFacts), derivationReceipt: structuredClone(garciaRamirezPhysiologyDerivation), selection: { sourceTableId: table.id, sourceTableLabel: table.sourceTableLabel, query: view.query, visiblePropertyIds: garciaRamirezPropertyRows(table, view.query).map(row => row.propertyId) }, authority: 'attributed_published_aggregate_statistics', newMolecularProfiles: 0, newPhysicalCellRosterRows: 0, geometryObjects: 0, sameCellCrossSourceJoins: 0, registrations: 0, actualViewCaptured: false, sourceInputsFetchedDuringThisExport: false };
}
