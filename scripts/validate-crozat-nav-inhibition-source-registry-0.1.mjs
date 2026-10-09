import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { crozatNaVInformation, validateCrozatNaVDocument } from '../app/crozat-nav-inhibition-information.js';

const read = promisify(readFile);
const ROOT = new URL('../', import.meta.url);
const LEGACY_PATH = 'data/crozat-experiment-family-observations-0.1.json';
const INFO_PATH = 'data/crozat-nav-inhibition-information-0.1.json';
const legacy = JSON.parse(readFileSync(new URL(LEGACY_PATH, ROOT), 'utf8'));
export const CROZAT_SOURCE_ID = 'SRC-CROZAT-2025';
const sha = body => createHash('sha256').update(body).digest('hex');
const md5 = body => createHash('md5').update(body).digest('hex');
const inputs = value => [...legacy.source.receipts.filter(row => row.fileName?.endsWith('.xlsx')), ...value.tables.map(table => table.sourceFile)];

export function validateCrozatNaVSourceRegistryRelationship(registry, value = crozatNaVInformation) {
  validateCrozatNaVDocument(value);
  const source = registry.sources.find(row => row.id === CROZAT_SOURCE_ID);
  assert.ok(source, 'Crozat source is missing');
  assert.equal(source.citation.doi, '10.1038/s42003-025-08559-x');
  assert.deepEqual(source.linkedUpgradeIds, ['UPG-168', 'UPG-172']);
  assert.equal(source.rights.status, 'CC-BY-4.0');
  assert.equal(source.recordSets.length, 1, 'Information workbooks do not add a record set');
  const set = source.recordSets[0];
  assert.equal(set.recordSetId, 'RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE');
  assert.equal(set.includedRecordCount.value, 1);
  assert.equal(set.includedRecordCount.unit, 'source_profiles');
  assert.equal(set.childRosterRef.status, 'none_reported');
  assert.equal(set.childRosterRef.path, null);
  assert.equal(set.sourceObjectSetRef, undefined);
  assert.equal(set.cellRosterAvailability, 'none_reported');
  assert.equal(set.dataPath, 'data/crozat-pkd2l1-functional-profile-0.1.json');
  assert.equal(source.experimentalUnits.length, 3, 'Existing population/firing/passive units stay separate');
  assert.deepEqual(source.experimentalUnits.map(row => [row.unit, row.count]), [['marker_defined_source_population', 1], ['firing_pattern_cell', 65], ['passive_property_observation', 654]]);
  const ready = source.localWorkbookReadiness;
  assert.equal(ready.status, 'checksum_verified_selected_source_information_workbooks');
  assert.equal(ready.unit, 'original_xlsx_files');
  assert.equal(legacy.summary.adapterTableCount, 23);
  assert.equal(legacy.summary.observationRowCount, 2115);
  assert.equal(legacy.summary.completeWithinTablePairGroupCount, 220);
  const selected = new Set(legacy.families.map(row => row.sourceFile.fileId));
  assert.equal(selected.size, 23);
  const retained = legacy.source.receipts.filter(row => row.fileName?.endsWith('.xlsx'));
  assert.equal(retained.length, 24, 'Existing adapter table count is not the entire physical XLSX inventory');
  const excluded = retained.filter(row => !selected.has(row.fileId));
  assert.deepEqual(excluded.map(row => [row.fileId, row.fileName]), [[56062547, 'INa.xlsx']]);
  assert.deepEqual(ready.retainedButUnselectedWorkbookPins, excluded.map(row => Object.fromEntries(['fileId', 'fileName', 'path', 'bytes', 'sha256', 'publisherMd5'].map(key => [key, row[key]]))));
  assert.deepEqual([ready.selectedInformationWorkbookFiles, ready.allRetainedOriginalWorkbookFiles, ready.existingExperimentFamilyWorkbookFiles, ready.additionalNaVInhibitionWorkbookFiles, ready.retainedButUnselectedWorkbookFiles], [25, 26, 23, 2, 1]);
  assert.deepEqual([ready.existingExperimentFamilySourceObservationRows, ready.additionalNaVInhibitionWorksheetMeasurementRows, ready.additionalNaVDensityRows, ready.additionalNaVPercentageRows], [2115, 84, 56, 28]);
  assert.equal(ready.existingInformationPath, LEGACY_PATH);
  assert.equal(ready.additionalInformationPath, INFO_PATH);
  assert.equal(ready.additionalInputManifestPath, 'data/source-candidates/crozat-nav-inhibition-20261004/crozat-nav-inhibition-inputs-manifest-0.1.json');
  assert.equal(ready.individualPhysicalCellDenominator, null);
  assert.equal(ready.individualAnimalMappingEstablished, false);
  for (const field of ['crossExperimentFamilyJoins', 'crossWorkbookNaVRowPairing', 'newSourceProfiles', 'newExactCellRosterRows', 'newGeometryObjects', 'newInternalObjects', 'registrations']) assert.equal(ready[field], 0, `${field} is not supported by local file readiness`);
  assert.match(ready.scope, /INa\.xlsx retained but not selected/);
  assert.match(source.admission.note, /25 original workbooks/);
  assert.match(source.admission.note, /Four source conflicts stay quarantined/);
  assert.equal(source.assets.length, 6);
  const expected = [
    ['ASSET-CROZAT-EXPERIMENT-FAMILY-OBSERVATIONS', LEGACY_PATH, legacy.auditId, 'checksum_pinned_project_derivative', null, 1878506, '94b3dfda943df4979ae6dec09ebf2ff9d74e12cf81b04cbae6ac9c9c54ae0e42'],
    ['ASSET-CROZAT-NAV-INHIBITION-INFORMATION', INFO_PATH, value.adapterId, 'checksum_pinned_project_derivative', null, 104945, '43be824627a3d8b4f8c647b7d162735ab4e57a5243f84ec695d3265d67be6339'],
    ...value.tables.map((table, index) => { const f = table.sourceFile; return [index === 0 ? 'ASSET-CROZAT-NAV-INHNA-ORIGINAL' : 'ASSET-CROZAT-NAV-INHNAPERC-ORIGINAL', f.path, `Figshare-file:${f.fileId}`, 'checksum_pinned_original_source', f.url, f.bytes, f.sha256]; }),
  ];
  for (const [id, path, accession, kind, url, bytes, sha256] of expected) {
    const asset = source.assets.find(row => row.id === id);
    assert.ok(asset, `Crozat local source asset missing: ${id}`);
    assert.deepEqual([asset.path, asset.accession, asset.kind, asset.url, asset.bundled], [path, accession, kind, url, true]);
    assert.deepEqual(asset.integrity, { status: 'verified', bytes, sha256, missingReason: null });
  }
  return { selectedInformationWorkbookFiles: 25, retainedOriginalWorkbookFiles: 26, retainedUnselectedWorkbookFiles: 1, existingObservationRows: 2115, separateNaVWorksheetRows: 84, independentPhysicalCellCount: null, addedSourceCount: 0, addedRecordSets: 0, addedProfiles: 0, addedExactCellRosterRows: 0, addedGeometryObjects: 0, addedInternalObjects: 0, addedRegistrations: 0 };
}

export function validateCrozatLocalWorkbookPackage(registry, packageFiles, value = crozatNaVInformation) {
  const summary = validateCrozatNaVSourceRegistryRelationship(registry, value);
  const originals = inputs(value);
  assert.equal(originals.length, 26);
  assert.equal(new Set(originals.map(row => row.fileId)).size, 26);
  for (const row of originals) {
    const body = packageFiles.get(row.path);
    assert.ok(body instanceof Uint8Array, `Crozat original workbook missing: ${row.path}`);
    assert.equal(body.length, row.bytes, `Crozat original byte count changed: ${row.fileName}`);
    assert.equal(sha(body), row.sha256, `Crozat original SHA changed: ${row.fileName}`);
    assert.equal(md5(body), row.publisherMd5, `Crozat original publisher MD5 mismatch: ${row.fileName}`);
  }
  const source = registry.sources.find(row => row.id === CROZAT_SOURCE_ID);
  for (const asset of source.assets.filter(row => row.path)) {
    const body = packageFiles.get(asset.path);
    assert.ok(body instanceof Uint8Array, `Crozat source asset bytes missing: ${asset.path}`);
    assert.equal(body.length, asset.integrity.bytes);
    assert.equal(sha(body), asset.integrity.sha256);
  }
  return { ...summary, selectedOriginalByteVerification: true, allRetainedOriginalByteVerification: true, originalXlsxBytes: originals.reduce((sum, row) => sum + row.bytes, 0), reacquiredOriginals: 0 };
}
export async function loadCrozatLocalWorkbookPackage(registry, value = crozatNaVInformation) {
  const source = registry.sources.find(row => row.id === CROZAT_SOURCE_ID);
  const paths = new Set([...inputs(value).map(row => row.path), ...source.assets.filter(row => row.path).map(row => row.path)]);
  return new Map(await Promise.all([...paths].map(async path => [path, await read(new URL(path, ROOT))])));
}
export async function validatePersistedCrozatNaVSourceRegistryRelationship(registry) {
  registry ??= JSON.parse(await read(new URL('data/research-source-registry-0.1.json', ROOT), 'utf8'));
  return validateCrozatLocalWorkbookPackage(registry, await loadCrozatLocalWorkbookPackage(registry));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) console.log(JSON.stringify(await validatePersistedCrozatNaVSourceRegistryRelationship()));
