"""Audit two exact GEO identifier files without admitting a public cell roster.

Originals remain in an explicitly supplied private input directory. This tool
does not fetch data, execute classification, read a matrix or write native IDs.
"""
import argparse
import collections
import csv
import gzip
import hashlib
import io
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

FILES = [
    ('GSE158380_cells.csv.gz', 111999, '2268141a1c5efbecd9dc85fc80bc7296c00f3dea04d2a6555be90c9c831729c6', 'cells', 24927),
    ('GSE158380_features.updated-11-22-2022.csv.gz', 113707, '9ed13abf990d17d5b19a2c9f18db7ccd3e662d4325f184324f639882a8db917d', 'features', 31040),
]
ARTICLE = 'data/source-candidates/russ-spinal-information-20261004/PMC8481483.fullText.xml'
INFORMATION = 'data/russ-spinal-information-adapter-0.1.json'
OUTPUT = 'data/russ-geo-original-object-schema-audit-0.1.json'
SOURCE_CANDIDATE_DIR = 'data/source-candidates/russ-geo-original-audit-20261005'
PRIOR_METADATA = SOURCE_CANDIDATE_DIR + '/UPG132_PRIOR_PROJECT_QUEUE_METADATA.json'
PRIOR_METADATA_SHA = '34d68718d39ab6d983ac358b0bed2625a7944958d4faf84ca0ef16456f4c697b'
ACQUISITION_RECEIPT = 'data/source-candidates/russ-geo-original-audit-20261005/GEO_ORIGINAL_ACQUISITION_RECEIPT.json'
PRIOR_MATRIX_LEVEL = 'prior_project_queue_report_not_externally_rechecked_in_I63'
BASE_URL = 'https://ftp.ncbi.nlm.nih.gov/geo/series/GSE158nnn/GSE158380/suppl/'


def pin(path, label):
    body = Path(path).read_bytes()
    return {'path': label, 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}


def object_schema(path, name, expected_bytes, expected_sha, header, expected_rows):
    compressed = path.read_bytes()
    if len(compressed) != expected_bytes or hashlib.sha256(compressed).hexdigest() != expected_sha:
        raise ValueError('exact original source pin mismatch')
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
        decoded = stream.read(8 * 1024 * 1024 + 1)
        if len(decoded) > 8 * 1024 * 1024: raise ValueError('decoded object exceeds source audit cap')
    text = decoded.decode('utf-8')
    rows = list(csv.reader(io.StringIO(text, newline='')))
    if rows[0] != [header] or any(len(row) != 1 for row in rows): raise ValueError('exact one-column native schema changed')
    values = [row[0] for row in rows[1:]]
    if len(values) != expected_rows or any(not value for value in values): raise ValueError('native identifier row count or empty value changed')
    counts = collections.Counter(values)
    if len(counts) != expected_rows: raise ValueError('native duplicate identifier values detected')
    facts = {'fileName': name, 'url': BASE_URL + name, 'compressedBytes': len(compressed), 'compressedSha256': expected_sha,
        'sha256Authority': 'locally_computed_exact_match_to_prior_inspected_queue_pin_not_a_publisher_checksum_manifest',
        'decodedBytes': len(decoded), 'decodedSha256': hashlib.sha256(decoded).hexdigest(), 'gzipCrcAndSizeValidated': True,
        'nativeCsvHeader': rows[0], 'nativeHeaderLexical': text.splitlines()[0], 'columnCount': 1,
        'rowsIncludingHeader': len(rows), 'identifierEntryCount': len(values), 'distinctRawIdentifierEntryCount': len(counts),
        'duplicateOccurrenceRows': 0, 'emptyIdentifierRows': 0,
        'identifierOrderSha256': hashlib.sha256(('\n'.join(values) + '\n').encode()).hexdigest(),
        'publicRawIdentifierListBundled': False, 'individualMetadataColumns': [],
        'matrixRowOrColumnCorrespondenceVerified': False}
    if header == 'cells':
        if any(not re.fullmatch(r'E\d+_[ACGT]{16}', value) for value in values): raise ValueError('native lexical identifier form changed')
        prefixes = collections.Counter(value.partition('_')[0] for value in values)
        facts.update({'opaqueNativePrefixCounts': [{'prefixRaw': key, 'identifierEntries': value} for key, value in sorted(prefixes.items())],
            'prefixInterpretation': 'literal text before underscore only; no animal, sample, study, age, region or cluster mapping established',
            'physicalOrNeuronalCellCountVerified': False})
    else:
        facts.update({'canonicalGeneIdentitiesOrAliasesResolved': False, 'expressionOrValidatedMarkerEvidence': False})
    return facts


def validate_scope(doc):
    if doc['auditId'] != 'russ-geo-original-object-schema-audit-0.1' or doc['evidenceUnit'] != 'two_original_identifier_file_objects_and_their_CSV_rows': raise ValueError('audit identity/observation unit changed')
    if doc['rawCellIdEntries']['value'] != 24927 or doc['rawCellIdEntries']['unit'] != 'opaque_native_identifier_entries': raise ValueError('raw identifiers promoted to physical or neuronal counts')
    if doc['featureIdentifierEntries']['value'] != 31040 or doc['featureIdentifierEntries']['unit'] != 'native_feature_identifier_entries': raise ValueError('feature identifier scope changed')
    if doc['rawCellIdEntries']['physicalOrNeuronalCellCount'] is not None or doc['featureIdentifierEntries']['canonicalGeneIdentityCount'] is not None: raise ValueError('identifier lists promoted to physical cells or canonical genes')
    if doc['harmonizedReference']['capturedSequencedCellsAndNuclei'] != 19353 or doc['harmonizedReference']['sourcePopulations'] != 69 or doc['harmonizedReference']['populationStudyCountFacts'] != 414: raise ValueError('harmonized published scope replaced by raw file count')
    if doc['independentNewSequencingContext']['articleReportedNucleiTotal'] != 28584 or doc['independentNewSequencingContext']['sourceReportedAdultMice'] != 4 or doc['independentNewSequencingContext']['sourceReportedAgeWeeks'] != 9: raise ValueError('independent article cohort context changed')
    if doc['independentNewSequencingContext']['individualCSVIdentifierAgeSexAnimalMappingEstablished'] or doc['independentNewSequencingContext']['notIncludedInIntegrationOrModelTraining'] is not True: raise ValueError('independent cohort treated as row metadata or training reference')
    if doc['adultInSituContext']['supplementPanelCountedCellsSum'] != 2371 or doc['adultInSituContext']['articleReportedCountedCells'] != 2894: raise ValueError('adult panel discrepancy changed')
    if any(doc['correspondence'][key] is not None for key in ['csvIdentifiersToHarmonized69Populations', 'csvIdentifiersToSixStudies', 'csvIdentifiersToIndividualAnimals', 'csvIdentifiersToIndividualAgeOrSex', 'csvIdentifiersToArticle28584ProcessingStage', 'inferredRemovedIdentifiers', 'matrixRowColumnMapping']): raise ValueError('unsupported identity, processing or matrix mapping inferred')
    if doc['rights']['GEOObjectRedistributionLicenceEstablished'] or doc['rights']['articleLicenceTransferredToGEOObjects'] or doc['rights']['rawObjectsPubliclyBundled']: raise ValueError('unknown file rights promoted')
    matrix = doc['matrixScope']
    if matrix['availabilityPreviouslyReported'] is not True or matrix['acquiredInThisAudit'] or matrix['matrixExistsConcludedFalse']: raise ValueError('excluded matrix download confused with absent deposit')
    if matrix['depositEvidenceLevel'] != PRIOR_MATRIX_LEVEL or matrix['externallyRecheckedInThisAudit'] is not False or matrix['priorReportedBytes'] != 112984417: raise ValueError('prior matrix report promoted to current matrix verification')
    if matrix['priorProjectMetadataLocation'] != PRIOR_METADATA + '#reportedMatrix' or doc['derivation']['priorProjectMetadataInput']['sha256'] != PRIOR_METADATA_SHA or doc['derivation']['priorProjectMetadataIsOriginalGEOResponse']: raise ValueError('prior matrix report lost pinned local metadata attribution')
    if any(value != 0 for value in doc['admissions'].values()): raise ValueError('unsupported profile, roster, physical, geometry or identity admission')
    if doc['sourceClassificationExecuted'] or doc['featurePresenceTreatedAsExpressionOrValidation']: raise ValueError('identifier presence promoted to classification or marker validation')
    if len(doc['objects']) != 2 or [row['nativeCsvHeader'] for row in doc['objects']] != [['cells'], ['features']]: raise ValueError('source CSV columns changed')
    if any(row['publicRawIdentifierListBundled'] or row['individualMetadataColumns'] or row['matrixRowOrColumnCorrespondenceVerified'] for row in doc['objects']): raise ValueError('one-column lists promoted to metadata roster or matrix proof')
    if doc['objects'][0]['prefixInterpretation'] != 'literal text before underscore only; no animal, sample, study, age, region or cluster mapping established' or doc['objects'][0]['physicalOrNeuronalCellCountVerified']: raise ValueError('opaque native prefixes promoted to cohort/physical identity')
    if doc['objects'][1]['canonicalGeneIdentitiesOrAliasesResolved'] or doc['objects'][1]['expressionOrValidatedMarkerEvidence']: raise ValueError('feature strings promoted to gene identity or expression validation')
    if doc['derivation']['originalAcquisitionReceiptIsReplayedNetworkResponse'] or doc['derivation']['originalAcquisitionReceipt']['path'] != ACQUISITION_RECEIPT: raise ValueError('offline receipt replay claimed as new HTTP response')
    if doc['derivation']['rawNativeIdentifiersSerializedInAudit'] or doc['derivation']['rawNativeIdentifiersRetainedOnlyInOriginalPrivateFiles'] is not True: raise ValueError('unlicensed native identifier roster serialization')
    return doc


def build(project_root, input_dir, prior_metadata, acquisition_receipt):
    objects = [object_schema(input_dir / name, name, size, sha, header, count) for name, size, sha, header, count in FILES]
    acquisition = json.loads(acquisition_receipt.read_text())
    if acquisition['status'] != 'PASS_TWO_EXACT_ORIGINAL_OBJECTS_ACQUIRED' or acquisition['requestsAttempted'] != 2 or len(acquisition['records']) != 2: raise ValueError('two-object actual acquisition receipt changed')
    if acquisition['matrixDownloaded'] or acquisition['redistributionRightsCleared'] or acquisition['cookieOrCredentialAccess'] or acquisition['interactiveChallengeAttempted']: raise ValueError('bounded source acquisition or rights scope changed')
    for record, (name, size, sha, _header, _rows) in zip(acquisition['records'], FILES):
        url = BASE_URL + name
        if record['requestedUrl'] != url or record['responseUrl'] != url or record['httpStatus'] != 200 or record['fileName'] != name or record['bytes'] != size or record['sha256'] != sha or record['retainedExactBytes'] is not True: raise ValueError('acquisition receipt does not match retained original source')
    acquisition_pin = pin(acquisition_receipt, ACQUISITION_RECEIPT)
    prior_pin = pin(prior_metadata, PRIOR_METADATA)
    if prior_pin['sha256'] != PRIOR_METADATA_SHA: raise ValueError('retained prior project metadata pin mismatch')
    prior = json.loads(prior_metadata.read_text())
    if prior['researchUpgradeId'] != 'UPG-132' or prior['evidenceLevel'] != 'retained_prior_project_metadata_not_a_current_external_source_check': raise ValueError('prior project metadata scope changed')
    row = prior['origin']['rowRaw']
    if hashlib.sha256(row.encode()).hexdigest() != prior['origin']['rowUtf8Sha256'] or '`GSE158380_raw_count_matrix.mtx.gz` at 112,984,417 bytes' not in row: raise ValueError('prior queue matrix report changed')
    report = prior['reportedMatrix']
    if report != {'fileName': 'GSE158380_raw_count_matrix.mtx.gz', 'reportedBytes': 112984417, 'availabilityPreviouslyReported': True, 'externallyRecheckedInI63': False, 'downloadedInI63': False}: raise ValueError('prior report treated as I63 matrix acquisition')
    information = json.loads((project_root / INFORMATION).read_text())
    seq = information['sequencingDenominator']; adult = information['adultValidationContext']
    if seq['value'] != 19353 or information['populationCount'] != 69 or len(information['populations']) != 69: raise ValueError('current I53 published reference scope changed')
    study_counts = sum(len(row['sequencingSampling']['byStudy']) for row in information['populations'])
    if study_counts != 414 or sum(row['value'] for row in seq['studies']) != 19353: raise ValueError('published study denominator changed')
    tree = ET.parse(project_root / ARTICLE)
    def located(paragraph, locator):
        text = ' '.join(''.join(paragraph.itertext()).split())
        return {'sourcePath': ARTICLE, 'locator': locator, 'normalizedTextSha256': hashlib.sha256(text.encode()).hexdigest()}, text
    new_location, new_text = located(tree.find('.//p[@id="Par56"]'), 'PMC8481483.fullText.xml#body//p[@id="Par56"]')
    methods_location, methods_text = located(tree.find('.//p[@id="Par71"]'), 'PMC8481483.fullText.xml#body//p[@id="Par71"]')
    if 'four adult mice' not in new_text or '28,584 total' not in new_text or 'not included in the integration or model training' not in new_text: raise ValueError('independent cohort article context changed')
    if '9 weeks old' not in methods_text or 'sequencing (four mice)' not in methods_text or 'two groups of three mice' not in methods_text: raise ValueError('age/cohort methods context changed')
    availability = [(i, p) for i, p in enumerate(tree.findall('.//p'), 1) if 'GSE158380' in ''.join(p.itertext())]
    if len(availability) != 1: raise ValueError('unambiguous source deposition context required')
    index, paragraph = availability[0]
    availability_location, availability_text = located(paragraph, f'PMC8481483.fullText.xml#all-p-element-ordinal={index}')
    if 'data generated in this study' not in availability_text or 'In addition, the publicly available data utilized' not in availability_text: raise ValueError('new versus reused sequencing source scope changed')
    doc = {'schemaVersion': '0.1.0', 'auditId': 'russ-geo-original-object-schema-audit-0.1', 'researchUpgradeId': 'UPG-132',
        'evidenceUnit': 'two_original_identifier_file_objects_and_their_CSV_rows', 'sourceAccession': 'GSE158380',
        'verifiedOriginalObjects': 2, 'verifiedCompressedBytesTotal': sum(row['compressedBytes'] for row in objects),
        'rawCellIdEntries': {'value': 24927, 'unit': 'opaque_native_identifier_entries', 'authority': 'exact_original_single_column_cells_CSV', 'physicalOrNeuronalCellCount': None},
        'featureIdentifierEntries': {'value': 31040, 'unit': 'native_feature_identifier_entries', 'canonicalGeneIdentityCount': None},
        'objects': objects,
        'harmonizedReference': {'sourceInformationPath': INFORMATION, 'namedDenominatorId': seq['id'],
            'capturedSequencedCellsAndNuclei': seq['value'], 'sourcePopulations': 69, 'populationStudyCountFacts': study_counts,
            'sourceStudies': [{'sourceLabelRaw': row['sourceLabelRaw'], 'capturedSequencedCellsAndNuclei': row['value']} for row in seq['studies']],
            'scope': 'published final six-study harmonized neuronal reference; not the GEO identifier list'},
        'independentNewSequencingContext': {'articleReportedNucleiTotal': 28584, 'sourceReportedAdultMice': 4,
            'sourceReportedAgeWeeks': 9, 'sourceRegionRaw': 'lumbar spinal cords', 'sourceModalityRaw': '10x Chromium single nucleus sequencing',
            'notIncludedInIntegrationOrModelTraining': True, 'GEOAccessionForStudyGeneratedData': 'GSE158380',
            'individualCSVIdentifierAgeSexAnimalMappingEstablished': False, 'locators': [new_location, methods_location, availability_location]},
        'adultInSituContext': {'supplementPanelCountedCellsSum': adult['panelCountedCellsSum'],
            'articleReportedCountedCells': adult['articleReportedCountedCells'], 'unresolvedSourceDiscrepancyRetained': True,
            'sourceLocation': INFORMATION + '#adultValidationContext.countDiscrepancy', 'scope': 'adult lumbar in situ tissue validation; separate from sequencing identifier files'},
        'correspondence': {'csvIdentifiersToHarmonized69Populations': None, 'csvIdentifiersToSixStudies': None,
            'csvIdentifiersToIndividualAnimals': None, 'csvIdentifiersToIndividualAgeOrSex': None,
            'csvIdentifiersToArticle28584ProcessingStage': None, 'inferredRemovedIdentifiers': None, 'matrixRowColumnMapping': None,
            'reason': 'Both native CSVs contain only one identifier column; no assignment, QC, stage, cohort, animal or per-row age/sex crosswalk is present. Different reported scopes are retained without subtracting or identifying removed cells.'},
        'rights': {'GEOObjectRedistributionLicenceEstablished': False, 'articleLicenceTransferredToGEOObjects': False,
            'rawObjectsPubliclyBundled': False, 'disposition': 'private original inspection only; public access does not establish file redistribution terms'},
        'matrixScope': {'fileName': report['fileName'], 'availabilityPreviouslyReported': report['availabilityPreviouslyReported'],
            'depositEvidenceLevel': PRIOR_MATRIX_LEVEL, 'priorReportedBytes': report['reportedBytes'],
            'priorProjectMetadataLocation': PRIOR_METADATA + '#reportedMatrix', 'externallyRecheckedInThisAudit': False,
            'acquiredInThisAudit': False, 'matrixExistsConcludedFalse': False, 'scope': 'Matrix availability/size is attributed only to the retained prior UPG-132 project queue row, not rechecked by I63. Excluded from this bounded two-object acquisition; no matrix dimension, expression or row/column proof.'},
        'sourceClassificationExecuted': False, 'featurePresenceTreatedAsExpressionOrValidation': False,
        'admissions': {'newProfiles': 0, 'newPublicCellRosterRows': 0, 'newPhysicalCells': 0, 'newMolecularTypes': 0,
            'newGeometryObjects': 0, 'newInternalObjects': 0, 'sameCellCrossSourceJoins': 0, 'registrations': 0, 'M2': 0, 'M4': 0},
        'derivation': {'sourceInputs': [pin(input_dir / name, SOURCE_CANDIDATE_DIR + '/' + name) for name, *_rest in FILES],
            'sourceContextInputs': [pin(project_root / ARTICLE, ARTICLE), pin(project_root / INFORMATION, INFORMATION)],
            'originalAcquisitionReceipt': acquisition_pin, 'originalAcquisitionReceiptIsReplayedNetworkResponse': False,
            'priorProjectMetadataInput': prior_pin, 'priorProjectMetadataIsOriginalGEOResponse': False,
            'extractor': 'tools/audit_russ_geo_original_objects_0_1.py', 'networkRequestsDuringReplay': 0,
            'rawNativeIdentifiersRetainedOnlyInOriginalPrivateFiles': True, 'rawNativeIdentifiersSerializedInAudit': False}}
    return validate_scope(doc)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project-root', required=True, type=Path); parser.add_argument('--input-dir', required=True, type=Path)
    parser.add_argument('--acquisition-receipt', required=True, type=Path, help='retained receipt of the two prior successful actual GETs; offline replay makes no GET')
    parser.add_argument('--prior-metadata', required=True, type=Path, help='retained local UPG-132 queue-row snapshot; not a current GEO response')
    parser.add_argument('--output', required=True, type=Path); parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    payload = (json.dumps(build(args.project_root, args.input_dir, args.prior_metadata, args.acquisition_receipt), ensure_ascii=False, indent=2) + '\n').encode()
    if args.check:
        if args.output.read_bytes() != payload: raise ValueError('audit differs from exact-original replay')
    else: args.output.write_bytes(payload)
    print(json.dumps({'status': 'PASS_EXACT_ORIGINAL_REPLAY' if args.check else 'DERIVED_FROM_EXACT_ORIGINALS',
        'audit': pin(args.output, OUTPUT), 'verifiedOriginalObjects': 2, 'rawIdentifierEntries': 24927,
        'featureEntries': 31040, 'assignmentsAdmitted': 0, 'matrixAcquired': False, 'redistributionRightsCleared': False}))


if __name__ == '__main__':
    main()
