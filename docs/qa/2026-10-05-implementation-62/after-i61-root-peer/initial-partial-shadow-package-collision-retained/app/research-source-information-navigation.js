import registry from '../data/research-source-registry-0.1.json' with { type: 'json' };

const fail = message => { throw new Error(`Source information navigation: ${message}`); };
const check = (value, message) => { if (!value) fail(message); };
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const copy = value => structuredClone(value);
const sourceIdExpected = 'SRC-GARCIA-RAMIREZ-2022';
const setIdExpected = 'RS-GARCIA-RAMIREZ-ADULT-SPINAL-AGGREGATE-PHYSIOLOGY';
const adapterId = 'ohri-garcia-ramirez-adult-spinal-aggregate-physiology-0.1.0';
const infoPath = 'data/garcia-ramirez-adult-spinal-physiology-0.1.json';
const sourceDirectory = 'data/source-candidates/garcia-ramirez-physiology-20261004/';
const target = '/explore/cell-types/additional#garcia-ramirez-physiology-panel';
const referenceExpected = { status: 'bundled_aggregate_information', path: infoPath, idField: 'adapterId', href: target };
const assetPins = [
  { id: 'ASSET-GARCIA-RAMIREZ-2022-AGGREGATE-FACTS', kind: 'checksum_pinned_project_derivative', accession: adapterId, url: null, path: infoPath, bytes: 203887, sha256: '48e1788f3ee0e4472e7431f349418aea078a4b89b3766c35bcddfb946f4f1bf9' },
  { id: 'ASSET-GARCIA-RAMIREZ-2022-DATA-SHEET-1', kind: 'checksum_pinned_original_source', accession: 'Figshare-file:36551718', url: 'https://ndownloader.figshare.com/files/36551718', path: sourceDirectory + 'data-sheet-1-file36551718.docx', bytes: 687234, sha256: '7ef955d8378020d95eeff07be83ad0c602699337fdb89b79f6796c3e96b845e2' },
  { id: 'ASSET-GARCIA-RAMIREZ-2022-PRIMARY-ARTICLE-XML', kind: 'checksum_pinned_original_source', accession: 'PMCID:PMC9385948', url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9385948/fullTextXML', path: sourceDirectory + 'PMC9385948.fullText.xml', bytes: 228780, sha256: 'b997e9c1565ba55dd361dcf47ac315883a9d1108c55d74c48db87f70f8bb7517' },
  { id: 'ASSET-GARCIA-RAMIREZ-2022-FIGSHARE-METADATA', kind: 'checksum_pinned_original_asset_metadata', accession: 'Figshare:20428674', url: 'https://api.figshare.com/v2/articles/20428674', path: sourceDirectory + 'figshare-article-20428674.json', bytes: 35029, sha256: 'ea6183d6e34233889e2900b14d980ad61edaf28f616052291bfaefac2406d865' },
];

export function getSourceRecordSetInformation(sourceId, recordSetId, declaredRecordSet = undefined) {
  const owners = registry.sources.filter(row => row.id === sourceId);
  check(owners.length === 1, 'unknown or ambiguous canonical source');
  const source = owners[0];
  const sets = source.recordSets.filter(row => row.recordSetId === recordSetId);
  check(sets.length === 1, 'record set is unknown, ambiguous or not owned by this source');
  const recordSet = sets[0];
  check(declaredRecordSet === undefined || same(declaredRecordSet, recordSet), 'current record-set declaration changed');
  const base = { schemaVersion: '0.1.0', registryReleaseId: registry.releaseId, sourceId, recordSetId, recordKind: recordSet.recordKind, unitOfObservation: recordSet.unitOfObservation, includedRecordCount: copy(recordSet.includedRecordCount), authority: 'declared_source_information_navigation_only', sourceBytesVerifiedByThisAction: false, renderedViewCaptured: false, newAdmissionCount: 0, newPhysicalCellRosterRows: 0, crossSourceIdentityJoinCount: 0, registrationCount: 0 };
  if (!Object.hasOwn(recordSet, 'sourceInformationRef')) return { ...base, status: 'unavailable', reference: null, link: null, reason: 'No bundled source information destination is declared for this record set.' };
  check(sourceId === sourceIdExpected && recordSetId === setIdExpected, 'information destination has no reviewed source-owned adapter contract');
  check(same(recordSet.sourceInformationRef, referenceExpected), 'exact information reference or permitted relative destination changed');
  check(recordSet.parentSourceId === source.id && recordSet.dataPath === infoPath && recordSet.idField === 'adapterId', 'information adapter ownership or locator changed');
  check(recordSet.recordKind === 'published_study_aggregate_electrophysiology_information' && recordSet.unitOfObservation === 'source_study_aggregate_information_adapter', 'aggregate observation unit changed');
  check(recordSet.includedRecordCount.value === 1 && recordSet.includedRecordCount.unit === 'study_aggregate_information_adapters' && recordSet.includedRecordCount.authority === 'checksum_pinned_project_derivative', 'one-adapter denominator changed');
  check(recordSet.cellRosterAvailability === 'not_applicable_aggregate_summary' && recordSet.canonicalIdentityStatus === 'source_local_not_cross_source_canonical', 'aggregate information was promoted to a cell or canonical identity');
  check(recordSet.childRosterRef.status === 'not_applicable_aggregate_summary' && recordSet.childRosterRef.path === null && recordSet.childRosterRef.idField === null && typeof recordSet.childRosterRef.missingReason === 'string' && !Object.hasOwn(recordSet, 'sourceObjectSetRef'), 'aggregate information acquired physical-child navigation');
  check(source.citation.doi === '10.3389/fncir.2022.957084' && source.admission.status === 'published_aggregate_information_bundled' && source.rights.status === 'CC-BY-4.0' && source.rights.metadataPath === sourceDirectory + 'figshare-article-20428674.json', 'source publication, admission or rights scope changed');
  check(source.assets.length === assetPins.length, 'information asset inventory changed');
  for (const pin of assetPins) {
    const assets = source.assets.filter(asset => asset.id === pin.id);
    check(assets.length === 1, 'information adapter asset is missing or ambiguous');
    const asset = assets[0];
    check(asset.kind === pin.kind && asset.accession === pin.accession && asset.url === pin.url && asset.path === pin.path && asset.bundled === true && same(asset.integrity, { status: 'verified', bytes: pin.bytes, sha256: pin.sha256, missingReason: null }), 'fixed adapter or original source asset pin changed');
  }
  const poolId = 'garcia-ramirez-2022:aggregate-physiology:recorded-pool-171';
  check(same(source.experimentalUnits.map(unit => [unit.unit, unit.count]), [['source_recorded_neuronal_observations', 171], ['source_reported_shox2_reporter_mice', 51], ['source_reported_chx10_reporter_mice', 6], ['prior_study_reused_shox2_recorded_observation_subset', 60], ['prior_study_reused_shox2_reporter_mice_subset', 28]]), 'recorded observations, animals or prior-study subsets changed or were pooled');
  const [observations, shox2Animals, , reusedObservations, reusedAnimals] = source.experimentalUnits;
  check(observations.denominatorId === poolId && observations.independentAnimalCount === null && observations.cellToAnimalMapping === null && reusedObservations.parentDenominatorId === poolId && reusedAnimals.parentDenominatorId === shox2Animals.denominatorId && reusedObservations.isSubsetOfCurrentShox2Cohort === true && reusedAnimals.isSubsetOfCurrentShox2Cohort === true, 'unknown cell-to-animal identity or prior-study subset authority changed');
  const counts = [[143, 28], [88, 49, 24, 10], [23, 11, 68, 69], [15, 20, 32, 25, 27, 52]];
  const partitions = ['reporter_population', 'firing_pattern', 'k_means', 'hierarchical'];
  check(recordSet.sourceRecordedPoolDenominatorId === poolId && same(recordSet.alternativePartitions, counts.map((groupCounts, index) => ({ tableId: `garcia-ramirez-2022:aggregate-physiology:ST${index + 1}`, partitionKind: partitions[index], groupCounts, sourceRecordedPoolDenominatorId: poolId, groupCountSum: 171 }))), 'alternative partitions no longer share the one recorded observation pool');
  check(['newMolecularProfiles', 'newPhysicalCellRosterRows', 'newObservedGeometryObjects', 'sameCellCrossSourceJoins', 'registrations', 'M2Admission', 'M4Admission'].every(key => recordSet.admissionBoundary[key] === 0), 'source information gained an unsupported admission');
  check(['sourceTracesAvailableInAdapterScope', 'rawAbfFilesAvailableInAdapterScope', 'physiologyGroupsAreMolecularCellTypes', 'clusterLabelsAreGeneticLineage', 'adultAtlasCoordinatesEstablished'].every(key => recordSet.admissionBoundary[key] === false), 'source information interpretation boundary changed');
  const params = new URLSearchParams({ fromSource: sourceId, fromRecordSet: recordSetId });
  const [pathname, fragment] = target.split('#');
  return { ...base, status: 'available', reference: copy(referenceExpected), link: { label: 'Open published aggregate physiology tables', href: `${pathname}?${params}#${fragment}`, adapterId }, reason: null,
    boundary: 'Study aggregate information only. Four alternative partitions share 171 recorded neuronal observations; this information link does not identify individual cells or animals. The destination validates its own bundled facts.' };
}
