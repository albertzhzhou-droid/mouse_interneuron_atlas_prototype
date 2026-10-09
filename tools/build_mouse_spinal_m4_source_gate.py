"""Normalize bounded current M4 evidence; deliberately supplies no scene geometry."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
CURRENT = ROOT / 'data/source-candidates/mouse-spinal-m4-20260930'


def load(path):
    return json.loads(path.read_text())


def attribute(record, name):
    return next((item.get('value') for item in record.get('attributes', []) if item['name'] == name), None)


def main():
    receipt = load(CURRENT / 'receipt.json')
    wt_receipt = load(ROOT / 'data/source-candidates/janelia-wt-reference-20260930/receipt.json')
    for source in receipt['files'] + wt_receipt['files']:
        data = (ROOT / source['path']).read_bytes()
        if len(data) != source['bytes'] or hashlib.sha256(data).hexdigest() != source['sha256']:
            raise ValueError('Current source receipt mismatch: ' + source['path'])
    article = load(CURRENT / 'pkd2l1-elife-83108.json')
    if article['id'] != '83108' or article['version'] != 2:
        raise ValueError('PKD2L1 source version changed')
    historic = load(ROOT / 'data/pkd2l1-sbfsem-public-availability-audit-0.1.json')
    article_receipt = next(item for item in receipt['files'] if item['path'].endswith('pkd2l1-elife-83108.json'))
    article_pin = historic['scope']['articleApiReceipt']
    article_matches = article_receipt['bytes'] == article_pin['bytes'] and article_receipt['sha256'] == article_pin['sha256']
    wt = load(ROOT / 'data/janelia-wt-bounded-reference-0.1.json')
    mutant = load(CURRENT / 'janelia-mutant-20134979.json')
    bia609 = load(CURRENT / 'biostudies-S-BSST609-study.json')
    bia2822 = load(CURRENT / 'biostudies-S-BIAD2822-study.json')
    info609 = load(CURRENT / 'biostudies-S-BSST609-info.json')
    info2822 = load(CURRENT / 'biostudies-S-BIAD2822-info.json')
    historic_paths = ['data/mouse-spinal-em-repository-search-audit-0.1.json', 'data/open-mouse-spinal-fibsem-near-miss-audit-0.1.json', 'data/pkd2l1-sbfsem-public-availability-audit-0.1.json']
    historical = []
    for path in historic_paths:
        data = (ROOT / path).read_bytes()
        historical.append({'path': path, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'role': 'historical_evidence_not_current_repository_census'})
    gate = {
        'schemaVersion': '0.1.0', 'gateId': 'mouse-spinal-m4-source-gate-20260930', 'checkedDate': '2026-09-30',
        'workstream': 'W04', 'milestone': 'M4', 'disposition': 'blocked_exact_interneuron_source_chain',
        'scope': {'kind': 'bounded_official_known_record_refresh_and_domain_search_screen', 'knownNearMissRecordsReviewed': 5, 'repositoryWideAbsenceClaim': False, 'historicalEmpiar3119CounterRechecked': False, 'universalCandidateCount': None},
        'sourceReceipts': receipt['files'] + wt_receipt['files'], 'historicalAuditPins': historical,
        'retrievalNotes': {'initialElifeAcceptApplicationJson': 'HTTP406; resolved with wildcard content negotiation', 'failedRequestsAtCompletion': receipt['failedRequests'], 'failureIsNotRepositoryAbsence': True},
        'reviewedNearMisses': [
            {'key': 'jrc_mus-sc-zp104a', 'sourceId': 20134574, 'version': 1, 'doi': wt['sourceRecords'][0]['doi'], 'title': wt['sourceRecords'][0]['title'], 'sourceVolume': True, 'manualNucleusSubset': True, 'interneuronIdentityEstablished': False, 'qualifiesForM4': False, 'allowedOutput': 'independent_source_local_native_2d_raw_nucleus_reference', 'blockers': ['cell class unknown', 'partial nucleus instance 2 has no stable biological cell ID', 'no parent cell/soma segmentation or type crosswalk', 'nominal description versus array extent unresolved']},
            {'key': 'jrc_mus-sc-zp105a', 'sourceId': mutant['id'], 'version': mutant['version'], 'doi': mutant['doi'], 'title': mutant['title'], 'license': mutant['license']['name'], 'sourceVolume': True, 'qualifiesForM4': False, 'blockers': ['double-mutant dorsal corticospinal tract volume', 'no exact mouse spinal interneuron object identity/parent/frame chain in acquired metadata'], 'volumePayloadDownloadedThisRefresh': False},
            {'key': 'eLife.83108', 'sourceId': article['id'], 'version': article['version'], 'doi': article['doi'], 'title': article['title'], 'articleLicense': article['copyright']['license'], 'historicalArticleFingerprintMatched': article_matches, 'formalAvailabilityScope': 'numerical source data for Figures 2 and 7', 'figure4AndVideo5Scope': 'publication EM images and serial-section movie; not deposited addressable source voxels and segmentation', 'qualifiesForM4': False, 'blockers': ['no explicit deposited raw volume address in current article availability', 'no stable EM object IDs, deposited segmentation or calibrated object-parent frame chain'], 'singleCellLightTracingCount71IsEmObjectCensus': False},
            {'key': bia609['accno'], 'title': attribute(bia609, 'Title'), 'public': info609['isPublic'], 'listedFileCount': info609['files'], 'listedFiles': [{'path': item['path'], 'bytes': item['size'], 'type': attribute(item, 'Type')} for item in bia609['section']['files']], 'qualifiesForM4': False, 'blockers': ['listed sources are optical image formats, electrophysiology/labchart and spreadsheets', 'no exact raw spinal interneuron EM volume+mask+parent+frame identified in inspected study metadata']},
            {'key': bia2822['accno'], 'title': attribute(bia2822['section'], 'Title'), 'public': info2822['isPublic'], 'listedFileCount': info2822['files'], 'license': attribute(bia2822['section'], 'License'), 'biosamples': [attribute(item, 'Title') for item in bia2822['section']['subsections'] if item['type'] == 'Biosample'], 'qualifiesForM4': False, 'blockers': ['human breast cancer cells, mouse lung tumor, mouse 4T1 cells, human MB-231 cells', '3D nucleus annotation is breast cancer, not mouse spinal interneuron']},
        ],
        'webSearchScreen': {'checkedDate': '2026-09-30', 'method': 'bounded search results from official repository/publisher domains; excerpt screening, not exhaustive API enumeration', 'queries': [
            {'query': 'mouse spinal interneuron volume electron microscopy segmentation raw data repository', 'domains': ['ebi.ac.uk', 'janelia.org', 'figshare.com']},
            {'query': '"mouse spinal interneuron" "electron microscopy" segmentation dataset', 'domains': ['ebi.ac.uk', 'figshare.com', 'janelia.org']},
            {'query': '"spinal cord" "interneuron" volume segmentation EMPIAR', 'domains': ['ebi.ac.uk']},
            {'query': '"spinal cord" "interneuron" volume electron microscopy deposited data', 'domains': ['elifesciences.org', 'cellmapchallenge.janelia.org']},
        ], 'qualifyingExactSourceChainIdentified': False, 'screenedOffTargetExamples': [
            {'url': 'https://cremi.janelia.org/data/', 'reason': 'Drosophila benchmark, not mouse spinal interneuron'},
            {'url': 'https://elifesciences.org/articles/95172', 'reason': 'returned availability excerpt describes quantitative data and confocal/Neurolucida images, not an open segmented EM volume'},
            {'url': 'https://elifesciences.org/articles/15784', 'reason': 'mouse visual cortex, not spinal cord'},
            {'url': 'https://elifesciences.org/articles/42519v1', 'reason': 'paired electrophysiological recordings; no exact segmented EM source identified in returned availability excerpt'},
        ]},
        'admission': {'qualifyingM4SourceChainsInReviewedScope': 0, 'interneuronGeometryObjects': 0, 'selectedCellJoins': 0, 'sameCellInternalChains': 0, 'atlasRegistrations': 0, 'newSummaryCards': 0},
        'restartRequiredInputs': [
            'Exact public mouse spinal interneuron source volume accession/version and bounded downloadable voxel path with checksum.',
            'Deposited cell/soma, nucleus and requested intracellular segmentation or contour payloads with stable object and parent IDs.',
            'Source evidence establishing the exact object as an interneuron; retain unknown type if absent rather than infer from tissue or marker alone.',
            'Explicit axes, units, voxel spacing, origin/translation and segmentation-to-volume transform; source local frame before any atlas mapping.',
            'Exact object/volume reuse license and attribution; distinguish annotation method and unknown/absent labels.',
            'For any same-cell chain, exact parent/cell crosswalk and identity evidence in the same acquisition; spatial overlap alone is insufficient.',
        ],
    }
    (ROOT / 'data/mouse-spinal-m4-source-gate-20260930.json').write_text(json.dumps(gate, indent=2) + '\n')
    print(json.dumps({'reviewedNearMisses': len(gate['reviewedNearMisses']), 'sourceFiles': len(gate['sourceReceipts']), 'sourceBytes': sum(item['bytes'] for item in gate['sourceReceipts']), 'qualifyingM4Chains': 0}))


if __name__ == '__main__':
    main()
