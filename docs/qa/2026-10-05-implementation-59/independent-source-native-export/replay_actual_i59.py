#!/usr/bin/env python3
"""Independent admitted gzip-literal replay; no product-helper import or RDS parser.

Only explicit root QA captures and the two authorized exact Downloads filenames
are inspected. The original RDS is a prior authority, not rehashed/reparsed here.
"""
import argparse
import copy
import csv
import datetime
import gzip
import hashlib
import io
import json
import os
from pathlib import Path

ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA = ROOT / 'docs/qa/2026-10-05-implementation-59'
OUT = Path(__file__).resolve().parent
DOC = 'data/cano-chol-rna-counts-0.1.json'
CHUNKS = (0, 21, 93)
DOWNLOADS = Path('/Users/zhouzhenghang/Downloads')
SOURCE_SHA = 'd4ad07a1e434f2ed4553738f3e1df1b395ce81b154f974c41f3ba6a9d674aed2'
CAPTURES = [
    'actual-03-default-chat-pitx2-ready.json',
    'actual-04-exact-nucleus-32.json',
    'actual-05-all-eleven-source-profiles.json',
    'actual-06-before-native-pair-json-export.json',
    'actual-06-after-native-pair-json-export.json',
    'actual-07-before-native-pair-csv-export.json',
    'actual-07-after-native-pair-csv-export.json',
]
HEADERS = ['source_accession', 'source_file', 'source_sha256', 'matrix_layer',
           'first_feature', 'first_source_row', 'second_feature', 'second_source_row',
           'compound_nucleus_key', 'source_metadata_row', 'source_counts_column',
           'profile_id', 'raw_source_label', 'first_raw_count', 'second_raw_count',
           'raw_positive_partition', 'total_rna_count', 'detected_feature_count']


def fail(message):
    raise AssertionError(message)


def require(condition, message):
    if not condition:
        fail(message)


def sha(body):
    return hashlib.sha256(body).hexdigest()


def pin(path):
    body = path.read_bytes()
    stat = path.stat()
    return {'path': str(path), 'bytes': len(body), 'sha256': sha(body),
            'mtimeNs': stat.st_mtime_ns,
            'mtimeUtc': datetime.datetime.fromtimestamp(stat.st_mtime, datetime.timezone.utc).isoformat()}


def safe_write(path, body):
    path.parent.mkdir(parents=True, exist_ok=True)
    require(str(path.parent.resolve()).startswith('/private/tmp/'), 'write parent must be real private temp')
    require(not path.is_symlink(), 'write destination cannot be a symlink')
    path.write_bytes(body)


def category(a, b):
    if a > 0:
        return 'both_positive' if b > 0 else 'first_only'
    return 'second_only' if b > 0 else 'neither_positive'


class LiteralSource:
    def __init__(self, root=ROOT):
        self.root = root
        doc_path = root / DOC
        doc_bytes = doc_path.read_bytes()
        self.doc = json.loads(doc_bytes)
        self.inputs = [pin(doc_path)]
        d = self.doc
        require(d['source']['sha256'] == SOURCE_SHA, 'original source authority changed')
        require(d['source']['matrixLocator'] == 'assays$RNA@layers$counts', 'wrong source layer')
        require(d['scope']['nucleusCount'] == len(d['nuclei']) == 923, '923 source column denominator changed')
        require(d['scope']['profileCount'] == len(d['profiles']) == 11, '11 source profiles changed')
        require(d['scope']['featureCount'] == len(d['genes']) == 32285, 'feature roster changed')
        require(len({n['key'] for n in d['nuclei']}) == 923, 'duplicate source key')
        require(len({n['countsColumn'] for n in d['nuclei']}) == 923, 'duplicate source column')
        self.members = {}
        for profile in d['profiles']:
            indices = [i for i, n in enumerate(d['nuclei']) if n['profileId'] == profile['id']]
            require(len(indices) == profile['nucleusCount'], 'profile membership count mismatch')
            ordered = ''.join(d['nuclei'][i]['key'] + '\n' for i in indices).encode()
            require(sha(ordered) == profile['orderedNucleusKeysSha256'], 'ordered profile key hash mismatch')
            self.members[profile['id']] = indices
        require(sum(map(len, self.members.values())) == 923, 'source profile partition mismatch')
        for n in d['nuclei']:
            require(n['key'].endswith('|' + n['nativeId']), 'native key mismatch')
            require(n['metadataRow'] == n['countsColumn'], 'source named-order mapping changed')
        self.features = {}
        self.chunk_pins = {}
        for number in CHUNKS:
            receipt = d['chunks'][number]
            require(receipt['index'] == number, 'chunk index mismatch')
            path = root / receipt['path']
            packed = path.read_bytes()
            require(len(packed) == receipt['bytes'] and sha(packed) == receipt['sha256'], 'compressed source chunk pin mismatch')
            plain = gzip.decompress(packed)  # gzip CRC/trailer validation; no recompression.
            require(len(plain) == receipt['decodedBytes'] and sha(plain) == receipt['decodedSha256'], 'decoded source chunk pin mismatch')
            chunk = json.loads(plain)
            require(chunk['chunk'] == number and chunk['sourceSha256'] == SOURCE_SHA and chunk['nucleusCount'] == 923, 'chunk identity changed')
            require(len(chunk['features']) == receipt['featureCount'], 'chunk feature count changed')
            require(chunk['firstFeatureRow'] == receipt['firstFeatureRow'], 'source row boundary changed')
            for offset, (row, name, vector) in enumerate(chunk['features']):
                require(row == receipt['firstFeatureRow'] + offset and d['genes'][row - 1] == name, 'source row/name mismatch')
                require(len(vector) == 923 and all(type(v) is int and v >= 0 for v in vector), 'invalid original raw vector')
                self.features[name] = (row, vector, number)
            self.chunk_pins[number] = {'compressed': pin(path), 'decodedBytes': len(plain), 'decodedSha256': sha(plain)}
            self.inputs.append(self.chunk_pins[number]['compressed'])

    def expected(self, first, second, profile_id, selected_key):
        require(first != second and first in self.features and second in self.features, 'pair must use distinct features in the three approved source chunks')
        require(profile_id in self.members, 'foreign profile')
        a_row, av, _ = self.features[first]
        b_row, bv, _ = self.features[second]
        profiles = []
        for profile in self.doc['profiles']:
            indices = self.members[profile['id']]
            groups = {'both_positive': 0, 'first_only': 0, 'second_only': 0, 'neither_positive': 0}
            for i in indices:
                groups[category(av[i], bv[i])] += 1
            item = {'profileId': profile['id'], 'rawLabel': profile['label'], 'nucleusCount': len(indices),
                    'orderedNucleusKeysSha256': profile['orderedNucleusKeysSha256'],
                    'firstPositive': sum(av[i] > 0 for i in indices), 'secondPositive': sum(bv[i] > 0 for i in indices),
                    'bothPositive': groups['both_positive'], 'firstOnly': groups['first_only'],
                    'secondOnly': groups['second_only'], 'neitherPositive': groups['neither_positive'],
                    'firstTotalCount': sum(av[i] for i in indices), 'secondTotalCount': sum(bv[i] for i in indices)}
            require(sum(groups.values()) == len(indices), 'partition does not reconcile')
            profiles.append(item)
        selected = None
        if selected_key is not None:
            indices = [i for i in self.members[profile_id] if self.doc['nuclei'][i]['key'] == selected_key]
            require(len(indices) == 1, 'selected row outside current exact profile')
            i = indices[0]
            selected = {**self.doc['nuclei'][i], 'firstCount': av[i], 'secondCount': bv[i], 'category': category(av[i], bv[i])}
        return {'firstFeature': first, 'secondFeature': second, 'sourceFeatureRows': [a_row, b_row],
                'profiles': profiles, 'currentProfile': next(p for p in profiles if p['profileId'] == profile_id),
                'selectedNucleus': selected}

    def check_payload(self, payload):
        require(payload['documentType'] == 'source_chol_in_rna_feature_pair_counts', 'wrong receipt kind')
        for field in ['source', 'sourceAudit', 'scope', 'rights']:
            require(payload[field] == self.doc[field], 'source facts changed: ' + field)
        selected_key = payload['selectedNucleus']['key'] if payload.get('selectedNucleus') else None
        expected = self.expected(payload['firstFeature'], payload['secondFeature'], payload['currentProfile']['profileId'], selected_key)
        for field, value in expected.items():
            require(payload[field] == value, 'literal source replay mismatch: ' + field)
        require(payload['independentAnimalDenominator'] is None and payload['cellToAnimalMapping'] is None, 'animal promotion')
        require(payload['actualViewCaptured'] is False and payload['originalSourceFetchedInBrowser'] is False, 'original/view promotion')
        boundary = payload['interpretation']
        require(boundary['descriptiveCountsOnly'] is True, 'descriptive scope lost')
        for field in ['biologicalAbsence', 'differentialExpression', 'correlationOrPValue', 'causation', 'markerClassification', 'rnaAtacPairing', 'crossSourceIdentity', 'geometry']:
            require(boundary[field] is False, 'scientific promotion: ' + field)
        require(boundary['registrations'] == boundary['newSourceProfiles'] == 0, 'admission count changed')
        require(payload['verification']['originalRdsVerification'] == 'offline_exact_source_replay_not_runtime_rds_download', 'original RDS runtime claim')
        require(payload['verification']['sourceSha256'] == SOURCE_SHA, 'captured pair original authority mismatch')
        require(payload['verification']['sourceFeatureRows'] == expected['sourceFeatureRows'], 'captured pair feature locator mismatch')
        numbers = list(dict.fromkeys([self.features[payload['firstFeature']][2], self.features[payload['secondFeature']][2]]))
        require(payload['verification']['requestCount'] == len(numbers), 'declared unique chunk count mismatch')
        observed = payload['verification']['chunks']
        require(len(observed) == len(numbers), 'declared chunk inventory mismatch')
        for item, number in zip(observed, numbers):
            source_pin = self.chunk_pins[number]
            require(item['chunk'] == number, 'declared wrong chunk')
            # Captured proof facts are checked; this never mints a private runtime token.
            for field, value in [('receivedBytes', source_pin['compressed']['bytes']), ('compressedSha256', source_pin['compressed']['sha256']), ('decodedBytes', source_pin['decodedBytes']), ('decodedSha256', source_pin['decodedSha256'])]:
                require(item[field] == value, 'captured proof pin mismatch: ' + field)
            require(item['requestedUrl'] == self.doc['chunks'][number]['url'], 'captured request target mismatch')
        return expected

    def check_capture(self, path):
        require(path.resolve().parent == QA.resolve(), 'only explicit root QA capture allowed')
        capture = json.loads(path.read_bytes())
        require(isinstance(capture.get('pairJSON'), str) and capture['pairJSON'].strip(), 'no ready readonly pair JSON capture')
        payload = json.loads(capture['pairJSON'])
        expected = self.check_payload(payload)
        require(capture['firstFeature'] == expected['firstFeature'] and capture['secondFeature'] == expected['secondFeature'], 'DOM feature selection mismatch')
        table = [[p['rawLabel'], str(p['nucleusCount']), str(p['bothPositive']), str(p['firstOnly']), str(p['secondOnly']), str(p['neitherPositive'])] for p in expected['profiles']]
        require(capture['pairTable'] == table, 'actual eleven-profile table mismatch')
        require(capture['pairChild'] == 1, 'more than one current pair child')
        current = expected['currentProfile']
        profile_text = f"{current['rawLabel']} · {current['nucleusCount']} source nuclei: both positive {current['bothPositive']}, {expected['firstFeature']} only {current['firstOnly']}, {expected['secondFeature']} only {current['secondOnly']}, neither positive {current['neitherPositive']}."
        require(capture['pairProfile'] == profile_text, 'current DOM denominator mismatch')
        selected = expected['selectedNucleus']
        if selected:
            text = capture.get('pairNucleus', '')
            require(selected['nativeId'] in text and f"{expected['firstFeature']} raw count{selected['firstCount']}" in text and f"{expected['secondFeature']} raw count{selected['secondCount']}" in text, 'selected DOM exact raw counts mismatch')
            require(f"{selected['metadataRow']} / {selected['countsColumn']}" in text, 'selected DOM source row mismatch')
        return {'capture': pin(path), 'pairJSONSha256': sha(capture['pairJSON'].encode()), 'independentExpected': expected, 'allElevenActualTableRowsExact': True}, capture, payload

    def csv_rows(self, payload):
        expected = self.check_payload(payload)
        first, second = payload['firstFeature'], payload['secondFeature']
        a_row, av, _ = self.features[first]
        b_row, bv, _ = self.features[second]
        profile = expected['currentProfile']
        rows = []
        for i in self.members[profile['profileId']]:
            n = self.doc['nuclei'][i]
            values = ['GSE318731', self.doc['source']['fileName'], SOURCE_SHA, self.doc['source']['matrixLocator'], first, a_row, second, b_row, n['key'], n['metadataRow'], n['countsColumn'], profile['profileId'], profile['rawLabel'], av[i], bv[i], category(av[i], bv[i]), n['totalRnaCount'], n['detectedFeatureCount']]
            rows.append(dict(zip(HEADERS, map(str, values))))
        return rows

    def check_csv_bytes(self, body, payload):
        reader = csv.DictReader(io.StringIO(body.decode()))
        require(reader.fieldnames == HEADERS, 'CSV schema mismatch')
        actual_rows = list(reader)
        expected_rows = self.csv_rows(payload)
        require(actual_rows == expected_rows, 'CSV original source rows/value/order mismatch')
        return actual_rows


def check_landing(source, kind, before_name, after_name, filename):
    path = DOWNLOADS / filename
    require(filename in ['cano-chol-rna-pair-Chat-Pitx2.json', 'cano-chol-rna-pair-Chat-Pitx2-profile.csv'], 'only exact two authorized filenames')
    require(os.path.lexists(path) and not path.is_symlink() and path.is_file(), 'authorized exact download file not observed')
    before_result, before, payload = source.check_capture(QA / before_name)
    after_result, after, after_payload = source.check_capture(QA / after_name)
    require(before['pairJSON'] == after['pairJSON'], 'native export selection changed')
    # Avoid counting the earlier actual03 receipt with no selected nucleus.
    require(payload['selectedNucleus']['nativeId'] == 'TCTGGCTTCACGAATC-1_1', 'wrong native-export selected row')
    require(payload['selectedNucleus']['metadataRow'] == payload['selectedNucleus']['countsColumn'] == 32, 'wrong native-export selected locator')
    require(payload['selectedNucleus']['firstCount'] == 14 and payload['selectedNucleus']['secondCount'] == 2, 'wrong native-export counts')
    body = path.read_bytes()
    stat = path.lstat()
    start = (QA / before_name).stat().st_mtime_ns
    end = (QA / after_name).stat().st_mtime_ns
    birth = int(stat.st_birthtime * 1000000000)
    require(start <= birth <= end and start <= stat.st_mtime_ns <= end, 'same-name file not created/modified within this exact native event window')
    if kind == 'json':
        require(body == (before['pairJSON'] + '\n').encode(), 'landed pair JSON differs from current readonly receipt')
        source.check_payload(json.loads(body))
        rows = 11
    else:
        actual_rows = source.check_csv_bytes(body, payload)
        require(len(actual_rows) == 53, 'native current-profile CSV denominator must remain53')
        rows = len(actual_rows)
    destination = OUT / ('exact-landed-' + filename)
    safe_write(destination, body)
    require(path.read_bytes() == body and path.stat().st_mtime_ns == stat.st_mtime_ns, 'source download changed during check')
    attempt_name = 'actual-06-native-pair-json-event-attempt.json' if kind == 'json' else 'actual-07-native-pair-csv-event-attempt.json'
    attempt = QA / attempt_name
    event_observation = json.loads(attempt.read_bytes())
    require(event_observation['eventObserved'] is False and 'Timed out after 5000ms' in event_observation['error'], 'native event API observation changed')
    return {'kind': kind, 'status': 'INDEPENDENT_FILE_LANDING_OBSERVED_IN_THIS_NATIVE_EVENT_WINDOW', 'sourceDownload': {**pin(path), 'birthtimeUtc': datetime.datetime.fromtimestamp(stat.st_birthtime, datetime.timezone.utc).isoformat()}, 'before': before_result['capture'], 'after': after_result['capture'], 'eventAttemptReceipt': pin(attempt), 'eventApiObservationRetained': event_observation, 'exactCopy': pin(destination), 'contentMatchesCurrentSelectedRow': True, 'allProfileJsonRowsOrCsvSourceRows': rows, 'nativeSelectedKey': payload['selectedNucleus']['key'], 'noEarlierNoSelectedNucleusReceiptUsed': True, 'sourceContentAndMtimeUnchanged': True, 'cuaDownloadEventApiTimedOut': True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--prepare-only', action='store_true')
    parser.add_argument('--capture', action='append', default=[])
    parser.add_argument('--authorized-native-downloads', action='store_true')
    args = parser.parse_args()
    source = LiteralSource()
    captures = []
    if not args.prepare_only:
        names = args.capture or CAPTURES
        for name in names:
            path = Path(name) if Path(name).is_absolute() else QA / name
            result, _, _ = source.check_capture(path)
            captures.append(result)
    downloads = []
    if args.authorized_native_downloads:
        require(not args.prepare_only, 'no native download check in prepare-only mode')
        downloads.append(check_landing(source, 'json', 'actual-06-before-native-pair-json-export.json', 'actual-06-after-native-pair-json-export.json', 'cano-chol-rna-pair-Chat-Pitx2.json'))
        downloads.append(check_landing(source, 'csv', 'actual-07-before-native-pair-csv-export.json', 'actual-07-after-native-pair-csv-export.json', 'cano-chol-rna-pair-Chat-Pitx2-profile.csv'))
    receipt = {'auditId': 'I59-independent-actual-DOM-and-exact-landed-exports-source-replay-20261005', 'status': 'PREPARED_SOURCE_ONLY_NO_CAPTURE_REPLAY' if args.prepare_only else 'PASS_ACTUAL_DOM_LITERAL_SOURCE_REPLAY', 'checkedAtUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'helper': pin(Path(__file__)), 'sourcePins': source.inputs, 'decodedChunkPins': list(source.chunk_pins.values()), 'sourceNuclei': 923, 'sourceProfiles': 11, 'sourceFeatures': 32285, 'originalRdsRehashedOrReparsed': False, 'productHelperImportedOrExecuted': False, 'runtimePrivateTokenCreated': False, 'actualViewOrPixelAttestedByThisHelper': False, 'nativeBrowserActionsPerformedByThisHelper': False, 'rootStageOrBrowserWrites': 0, 'personalDirectoryEnumerationOrFallbackSearch': False, 'captures': captures, 'exactNativeLandings': downloads, 'scope': 'Independent numeric/content replay of admitted gzip source vectors and source-document metadata. Actual browser execution and private runtime proof production belong to parent captures; prior RDS semantic extraction remains prior authority. Source nuclei/labels remain source-local; no animal denominator, normalization, marker, DE, causation, ATAC, geometry, identity or REG promotion.'}
    name = 'I59_SOURCE_REPLAY_PREPARATION.json' if args.prepare_only else 'I59_ACTUAL_DOM_SOURCE_AND_NATIVE_LANDING_REVIEW.json'
    target = OUT / name
    safe_write(target, (json.dumps(receipt, ensure_ascii=False, indent=2) + '\n').encode())
    print(json.dumps({'receipt': pin(target), 'captures': len(captures), 'landedExports': len(downloads), 'status': receipt['status']}, indent=2))


if __name__ == '__main__':
    main()
