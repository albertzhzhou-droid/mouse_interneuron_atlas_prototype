#!/usr/bin/env python3
"""Validate the two retained I60 exact file copies + original action windows.

Uses only captured file-stat manifests, exact temp copies and known QA paths.
Never rereads/enumerates Downloads, runs product helpers or triggers an export.
"""
import csv
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent
QA = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/docs/qa/2026-10-05-implementation-60')
PREPARED_BASELINE = Path('/private/tmp/ohri-i60-intake-preservation-helpers-20261005/I60_EXACT_EXPORT_DOWNLOADS_PRE_NATIVE_BASELINE.json')
KEYS = [
    'molecular_profile:alkaslasi-2021:GSE167597:I1',
    'molecular_profile:hayashi-2018:GSE108788:cluster-1',
    'molecular_profile:cano.gomez.p56.chol_in.sha256.e34a2e59ec5151d120eff617',
    'molecular_profile:haring-2018:GSE103840:Gaba1',
]
EXPECTED_COPIES = {
    'json': {'bytes': 49648, 'sha256': '876000269ce0529ad2e84dd984b41c983d410c5d308015ab27d45e9bbd2c2ae4'},
    'csv': {'bytes': 18219, 'sha256': 'f2b49ed140c2ffaf30c03f315bf3f7346ca221d7b91bd0512de517ac3e79789d'},
}


def pin(path):
    data = path.read_bytes()
    return {'path': str(path), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def date(text):
    return datetime.fromisoformat(text.replace('Z', '+00:00'))


def main():
    prepared = json.loads(PREPARED_BASELINE.read_bytes())
    immediate_path = QA / 'actual-10-immediate-downloads-baseline.json'
    immediate = json.loads(immediate_path.read_bytes())
    exact_paths = ['/Users/zhouzhenghang/Downloads/molecular-concordance.json',
                   '/Users/zhouzhenghang/Downloads/molecular-concordance.csv']
    assert [row['path'] for row in prepared['paths']] == exact_paths
    assert [row['path'] for row in immediate['rows']] == exact_paths
    assert all(row['lexists'] is False for row in prepared['paths'] + immediate['rows'])
    assert immediate['exactPathsOnly'] is True
    expanded_path = QA / 'actual-10-four-source-expanded.json'
    expanded = json.loads(expanded_path.read_bytes())
    expanded_query = parse_qs(urlparse(expanded['url']).query, keep_blank_values=True)
    assert json.loads(expanded_query['compareKeys'][0]) == KEYS
    assert expanded_query['compareAnchor'] == [KEYS[0]]
    assert len(expanded['comparisons']) == 3
    assert all(len(pair['receipts']) == 1 and pair['receipts'][0]['open'] is True
               for pair in expanded['comparisons'])
    event_path = QA / 'actual-10-download-event-observations.json'
    events = json.loads(event_path.read_bytes())
    assert len(events) == 2
    assert all(event['path'] is None and 'Timed out after 5000ms' in event['error'] for event in events)
    inputs = [pin(PREPARED_BASELINE), pin(immediate_path), pin(expanded_path), pin(event_path)]
    landed = []
    for extension in ['json', 'csv']:
        manifest_path = HERE / f'exact-native-{extension}-file-read.json'
        manifest = json.loads(manifest_path.read_bytes())
        assert manifest['path'] == f'/Users/zhouzhenghang/Downloads/molecular-concordance.{extension}'
        assert manifest['lexists'] is True and manifest['sourceUnchangedAcrossRead'] is True
        assert {key: manifest[key] for key in ['bytes', 'sha256']} == EXPECTED_COPIES[extension]
        copy = HERE / f'exact-landed-molecular-concordance.{extension}'
        copy_pin = pin(copy)
        assert {key: copy_pin[key] for key in ['bytes', 'sha256']} == EXPECTED_COPIES[extension]
        action_path = QA / f'actual-10-{extension}-download-native-action.json'
        after_path = QA / f'actual-10-{extension}-download-after.json'
        action = json.loads(action_path.read_bytes())
        after = json.loads(after_path.read_bytes())
        assert action['error'] is None
        start = date(action['startUTC'])
        end = date(after['toolCaptureWindowUTC']['endUTC'])
        assert date(prepared['observationEndedAtUtc']) < date(immediate['endUTC']) < start
        assert start <= date(action['endUTC']) <= date(after['toolCaptureWindowUTC']['startUTC']) <= end
        assert start <= date(manifest['stat']['birthtimeUtc']) <= end
        assert start <= date(manifest['stat']['mtimeUtc']) <= end
        query = parse_qs(urlparse(after['url']).query, keep_blank_values=True)
        assert json.loads(query['compareKeys'][0]) == KEYS and query['compareAnchor'] == [KEYS[0]]
        landed.append({'extension': extension, 'exactPersonalPath': manifest['path'],
                       'exactTempCopy': copy_pin, 'actualSourceStat': manifest['stat'],
                       'window': {'actionStartUtc': action['startUTC'],
                                  'nativeActionEndUtc': action['endUTC'],
                                  'afterCaptureStartUtc': after['toolCaptureWindowUTC']['startUTC'],
                                  'afterCaptureEndUtc': after['toolCaptureWindowUTC']['endUTC']},
                       'birthtimeWithinOriginalWindow': True, 'mtimeWithinOriginalWindow': True,
                       'bothEarlierBaselinesActuallyAbsent': True,
                       'originalEventApiObservedDownload': False,
                       'originalEventApiError': next(event['error'] for event in events
                                                     if event['name'] == action['name']),
                       'independentFileLandingObserved': True})
        inputs.extend([pin(manifest_path), pin(action_path), pin(after_path), copy_pin])
    report = json.loads((HERE / 'exact-landed-molecular-concordance.json').read_bytes())
    assert report['documentType'] == 'molecular_source_concordance' and report['schemaVersion'] == '1.0.0'
    assert report['selectedKeys'] == KEYS and report['anchorKey'] == KEYS[0]
    assert [profile['key'] for profile in report['profiles']] == KEYS
    assert report['sourceDenominator']['value'] == 387 and report['sourceDenominator']['unit'] == 'source_profiles'
    assert len(report['sourceDenominator']['namespaceCounts']) == 10
    assert report['sourceDenominator']['deduplicationCount'] == 0
    assert report['identity'] == 'not_established'
    assert all(report[field] == 0 for field in ['sameCellJoinCount', 'sameTypeJoinCount', 'generatedGeometryCount'])
    assert len(report['comparisons']) == 3
    by_key = {profile['key']: profile for profile in report['profiles']}
    for index, pair in enumerate(expanded['comparisons']):
        receipt = json.loads(pair['receipts'][0]['json'])
        assert receipt['anchor'] == by_key[KEYS[0]]
        assert receipt['comparison'] == by_key[KEYS[index + 1]]
        assert receipt['sourceConflicts'] == report['comparisons'][index]['sourceConflicts']
    parsed_csv = list(csv.DictReader(io.StringIO((HERE / 'exact-landed-molecular-concordance.csv').read_text())))
    assert len(parsed_csv) == 15
    assert all(row['anchor_key'] == KEYS[0] and row['comparison_key'] in KEYS[1:]
               and row['identity'] == 'not_established' for row in parsed_csv)
    assert [row['comparison_key'] for row in parsed_csv] == [key for key in KEYS[1:] for _ in range(5)]
    result = {
        'iteration': 'I60', 'status': 'PASS_INDEPENDENT_CURRENT_NATIVE_FILE_LANDING_EVENT_APIS_TIMED_OUT',
        'generatedAtUtc': datetime.now(timezone.utc).isoformat(),
        'attribution': 'Each exact filename was absent in both earlier baselines; each complete new file birthtime and mtime falls inside its sole original native action-start to after-capture-end window, with the exact current four-key/anchor DOM context. This proves independently observed current file landing despite the original event API timeouts.',
        'landedFiles': landed, 'inputArtifactPins': inputs,
        'currentDomContentBinding': {'exactSelectedKeys': KEYS, 'anchorKey': KEYS[0],
                                     'expandedReceiptsOpen': 3, 'allFourExportProfileObjectsEqualOriginalDomPreReceipts': True,
                                     'allThreeExportConflictObjectsEqualOriginalDomPreReceipts': True,
                                     'sourceProfileDenominator': 387, 'namespaceCount': 10,
                                     'comparisonPairs': 3, 'csvDataRows': 15,
                                     'csvRowsBelongOnlyToExactCurrentAnchorAndComparisonKeys': True,
                                     'jsonHasGeneratedAtField': False},
        'scientificReplayDelegation': 'Independent primary index/source-scope/dimension/evidence/CSV derivation belongs to goal_audit_i52 and consumes these exact copied files. This landing check does not replace that source replay.',
        'scope': {'exactPersonalPathsRead': 2, 'personalDirectoryEnumeration': False,
                  'filenameVariantsOrFallbackSearch': False, 'sourceDownloadFileWrites': 0,
                  'newExportsTriggered': 0, 'rootOrStageWrites': 0, 'browserActions': 0,
                  'networkRequests': 0, 'productComparatorOrOtherProductHelperImports': 0,
                  'finalPreservationExecuted': False, 'scientificSourceOrRightsAdmissions': 0},
        'limitations': ['Original two 5000ms download event timeouts remain unchanged; they did not supply a saved path.',
                        'This export schema has no generatedAt field; no such timestamp was inferred or added.',
                        'File landing and current DOM identity binding do not independently attest private source loading, full scientific derivation, pixel rendering, performance or M2/M4.'],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2) + '\n', end='')


if __name__ == '__main__':
    main()
