#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { garciaRamirezPhysiologyFacts as facts, validateGarciaRamirezPhysiology } from '../app/garcia-ramirez-physiology.js';
import { validatePersistedGarciaRamirezPhysiology } from './validate-garcia-ramirez-physiology-0.1.mjs';

export const GARCIA_RAMIREZ_SOURCE_ID = 'SRC-GARCIA-RAMIREZ-2022';
export const GARCIA_RAMIREZ_RECORD_SET_ID = 'RS-GARCIA-RAMIREZ-ADULT-SPINAL-AGGREGATE-PHYSIOLOGY';
const infoPath = 'data/garcia-ramirez-adult-spinal-physiology-0.1.json';
const sourcePrefix = 'garcia-ramirez-2022:aggregate-physiology:';
const sourceDirectory = 'data/source-candidates/garcia-ramirez-physiology-20261004/';
const sourceAssets = [
  ['ASSET-GARCIA-RAMIREZ-2022-DATA-SHEET-1', 'data-sheet-1-file36551718.docx', 'checksum_pinned_original_source', 'Figshare-file:36551718', 'https://ndownloader.figshare.com/files/36551718'],
  ['ASSET-GARCIA-RAMIREZ-2022-PRIMARY-ARTICLE-XML', 'PMC9385948.fullText.xml', 'checksum_pinned_original_source', 'PMCID:PMC9385948', 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9385948/fullTextXML'],
  ['ASSET-GARCIA-RAMIREZ-2022-FIGSHARE-METADATA', 'figshare-article-20428674.json', 'checksum_pinned_original_asset_metadata', 'Figshare:20428674', 'https://api.figshare.com/v2/articles/20428674'],
];

export function validateGarciaRamirezSourceRegistryRelationship(registry, value = facts) {
  validateGarciaRamirezPhysiology(value);
  const source = registry.sources.find(source => source.id === GARCIA_RAMIREZ_SOURCE_ID);
  assert.ok(source, 'UPG-173 canonical aggregate-study source is missing');
  assert.equal(source.sourceKind, 'dataset');
  assert.equal(source.citation.doi, value.source.publication.doi);
  assert.deepEqual(source.speciesScopes.map(scope => scope.scientificName), ['Mus musculus']);
  assert.deepEqual(source.lifeStageScopes.map(scope => scope.value), ['adult, 8–25 weeks']);
  assert.equal(source.regionScopes[0].value, 'lumbar spinal cord, L2–L5 transverse slices');
  assert.deepEqual(source.linkedUpgradeIds, ['UPG-173']);
  assert.equal(source.rights.status, 'CC-BY-4.0');
  assert.equal(source.rights.metadataPath, sourceDirectory + 'figshare-article-20428674.json');
  assert.equal(source.admission.status, 'published_aggregate_information_bundled');

  const pool = value.studyScope.recordedPool;
  assert.equal(source.experimentalUnits.length, 5, 'UPG-173 recorded observations, animals and prior reuse must stay distinct');
  const expectedUnits = [
    ['source_recorded_neuronal_observations', 171],
    ['source_reported_shox2_reporter_mice', 51],
    ['source_reported_chx10_reporter_mice', 6],
    ['prior_study_reused_shox2_recorded_observation_subset', 60],
    ['prior_study_reused_shox2_reporter_mice_subset', 28],
  ];
  assert.deepEqual(source.experimentalUnits.map(row => [row.unit, row.count]), expectedUnits, 'UPG-173 unit/count context changed or reuse was pooled');
  source.experimentalUnits.forEach(unit => { assert.equal(unit.sourceInformationPath, infoPath); assert.equal(unit.missingReason, null); });
  const [observations, shox2Animals, chx10Animals, reusedObservations, reusedAnimals] = source.experimentalUnits;
  assert.equal(observations.denominatorId, pool.id);
  assert.deepEqual(observations.reporterComposition, { Shox2: 143, Chx10: 28 });
  assert.equal(observations.independentAnimalCount, null);
  assert.equal(observations.cellToAnimalMapping, null);
  assert.deepEqual(observations.sourceLocator, pool.sourceLocator);
  assert.equal(shox2Animals.denominatorId, sourcePrefix + 'shox2-reporter-mice-51');
  assert.equal(chx10Animals.denominatorId, sourcePrefix + 'chx10-reporter-mice-6');
  assert.deepEqual(shox2Animals.sourceLocator, value.studyScope.animalCohorts[0].locator);
  assert.deepEqual(chx10Animals.sourceLocator, value.studyScope.animalCohorts[1].locator);
  assert.equal(reusedObservations.parentDenominatorId, pool.id);
  assert.equal(reusedAnimals.parentDenominatorId, shox2Animals.denominatorId);
  for (const subset of [reusedObservations, reusedAnimals]) {
    assert.equal(subset.isSubsetOfCurrentShox2Cohort, true);
    assert.deepEqual(subset.sourceLocator, value.studyScope.priorStudyReuse.sourceLocator);
  }

  assert.equal(source.recordSets.length, 1, 'UPG-173 alternative partitions cannot create separate study or physical-cell sets');
  const set = source.recordSets[0];
  assert.equal(set.recordSetId, GARCIA_RAMIREZ_RECORD_SET_ID);
  assert.equal(set.parentSourceId, source.id);
  assert.equal(set.recordKind, 'published_study_aggregate_electrophysiology_information');
  assert.equal(set.unitOfObservation, 'source_study_aggregate_information_adapter');
  assert.equal(set.assignmentAuthority, 'literal_published_supplement_tables_and_attributed_primary_article_context');
  assert.equal(set.includedRecordCount.value, 1);
  assert.equal(set.includedRecordCount.unit, 'study_aggregate_information_adapters');
  assert.equal(set.dataPath, infoPath); assert.equal(set.idField, 'adapterId');
  assert.equal(set.canonicalIdentityStatus, 'source_local_not_cross_source_canonical');
  assert.equal(set.cellRosterAvailability, 'not_applicable_aggregate_summary');
  assert.equal(set.childRosterRef.status, 'not_applicable_aggregate_summary');
  assert.equal(set.childRosterRef.path, null); assert.equal(set.childRosterRef.idField, null);
  assert.equal(set.sourceObjectSetRef, undefined, 'UPG-173 aggregate tables cannot create a physical source-object set');
  assert.deepEqual(set.sourceInformationRef, { status: 'bundled_aggregate_information', path: infoPath, idField: 'adapterId', href: '/explore/cell-types/additional#garcia-ramirez-physiology-panel' });
  assert.equal(set.sourceRecordedPoolDenominatorId, pool.id);
  assert.deepEqual(set.alternativePartitions, value.tables.map(table => ({ tableId: table.id, partitionKind: table.partitionKind, groupCounts: table.groups.map(group => group.recordedObservationCount), sourceRecordedPoolDenominatorId: table.sourceRecordedPoolDenominatorId, groupCountSum: table.groupCountSum })));
  assert.deepEqual(set.sourceSummaryCounts, { supplementTables: 4, propertyRows: 48, meanSdSummaries: 192, sourceReportedComparisons: 48 });
  assert.deepEqual(set.admissionBoundary, value.studyScope.interpretationBoundary);

  assert.equal(source.assets.length, 4, 'UPG-173 source inventory must retain one derivative and three exact original inputs');
  const derived = source.assets.find(asset => asset.id === 'ASSET-GARCIA-RAMIREZ-2022-AGGREGATE-FACTS');
  assert.ok(derived); assert.equal(derived.kind, 'checksum_pinned_project_derivative');
  assert.equal(derived.accession, value.adapterId); assert.equal(derived.url, null); assert.equal(derived.path, infoPath);
  assert.deepEqual(derived.integrity, { status: 'verified', bytes: 203887, sha256: '48e1788f3ee0e4472e7431f349418aea078a4b89b3766c35bcddfb946f4f1bf9', missingReason: null });
  assert.equal(derived.bundled, true);
  for (const [id, name, kind, accession, url] of sourceAssets) {
    const asset = source.assets.find(asset => asset.id === id), pin = value.source.inputPins.find(pin => pin.fileName === name);
    assert.ok(asset && pin, 'UPG-173 exact source asset or pin is missing');
    assert.equal(asset.path, sourceDirectory + name); assert.equal(asset.bundled, true);
    assert.equal(asset.kind, kind); assert.equal(asset.accession, accession); assert.equal(asset.url, url);
    assert.deepEqual(asset.integrity, { status: 'verified', bytes: pin.bytes, sha256: pin.sha256, missingReason: null });
  }
  return { sourceCountAdded: 1, declaredRecordSetsAdded: 1, retainedStudyInformationAdapters: 1, recordedObservationPool: 171, newMolecularProfiles: 0, newPhysicalCellRosterRows: 0, bundledExactCellProfileRostersAdded: 0, bundledExactSourceObjectSetsAdded: 0, sameCellCrossSourceJoins: 0, registrations: 0 };
}

export async function validatePersistedGarciaRamirezSourceRegistryRelationship() {
  const root = new URL('../', import.meta.url);
  const registry = JSON.parse(await readFile(new URL('data/research-source-registry-0.1.json', root), 'utf8'));
  const result = validateGarciaRamirezSourceRegistryRelationship(registry);
  await validatePersistedGarciaRamirezPhysiology();
  const source = registry.sources.find(source => source.id === GARCIA_RAMIREZ_SOURCE_ID);
  for (const asset of source.assets) {
    const bytes = await readFile(new URL(asset.path, root));
    assert.equal(bytes.length, asset.integrity.bytes, 'UPG-173 registry asset length changed');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.integrity.sha256, 'UPG-173 registry asset source pin changed');
  }
  return result;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(JSON.stringify(await validatePersistedGarciaRamirezSourceRegistryRelationship()));
}
