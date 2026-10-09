#!/usr/bin/env python3
"""Follow-on source-only replay; original seven captures/copies remain untouched."""
import argparse
import csv
import datetime
import gzip
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
BASE = Path('/private/tmp/ohri-i59-actual-dom-source-replay-20261005/replay_actual_i59.py')
BASE_SHA = '4691e3d0f48fffd64b9a720553b32c485cbfd2a0f93a0e8037d28dcaff6bbb19'
assert hashlib.sha256(BASE.read_bytes()).hexdigest() == BASE_SHA
spec = importlib.util.spec_from_file_location('independent_i59_literal_source_replay', BASE)
literal = importlib.util.module_from_spec(spec)
spec.loader.exec_module(literal)
OUT = Path(__file__).resolve().parent
QA = literal.QA
OLD_SEAL = BASE.parent / 'I59_ACTUAL_SOURCE_REPLAY_AND_DOWNLOAD_SEAL.json'
OLD_DETAIL = BASE.parent / 'I59_ACTUAL_DOM_SOURCE_AND_NATIVE_LANDING_REVIEW.json'
PRESERVED_PINS = {
    OLD_SEAL: '7cd6f6b372f933d12c974cd44c52f77982a0e1b13b064d26eaa51d0309500429',
    OLD_DETAIL: '906db296e4edf61184c75403a74030ff29408169808035d6864073d54ba4f846',
    BASE.parent / 'exact-landed-cano-chol-rna-pair-Chat-Pitx2.json': 'c4419ba7c8434d82e40499b8386c04b90b5d2f04264a0e23162ac5f53f947ae0',
    BASE.parent / 'exact-landed-cano-chol-rna-pair-Chat-Pitx2-profile.csv': 'dd64e6987998d24427a4117d69d7cea26736b23ab00830f0b242803e1a98e347',
}


def preserved():
    pins = []
    for path, expected in PRESERVED_PINS.items():
        pin = literal.pin(path)
        literal.require(pin['sha256'] == expected, 'prior sealed evidence changed')
        pins.append(pin)
    return pins


def check_ready_capture(source, path):
    literal.require(path.resolve().parent == QA.resolve(), 'only exact root QA59 capture')
    capture = json.loads(path.read_bytes())
    literal.require(isinstance(capture.get('pairJSON'), str) and capture['pairJSON'].strip(), 'capture has no ready pair JSON; not a source failure')
    payload = json.loads(capture['pairJSON'])
    literal.require(payload['firstFeature'] == 'Xkr4' and payload['secondFeature'] == 'Gm1992', 'follow-on source scope is exact Xkr4/Gm1992 only')
    expected = source.check_payload(payload)
    literal.require(expected['sourceFeatureRows'] == [1, 2], 'native features are not original source rows1/2')
    literal.require(expected['currentProfile']['nucleusCount'] == 74, 'current complete source profile must have74 nuclei')
    literal.require(payload['verification']['requestCount'] == 1 and payload['verification']['chunks'][0]['chunk'] == 0, 'same original000 chunk inventory changed')
    table = [[p['rawLabel'], str(p['nucleusCount']), str(p['bothPositive']), str(p['firstOnly']), str(p['secondOnly']), str(p['neitherPositive'])] for p in expected['profiles']]
    literal.require(capture['pairTable'] == table and len(table) == 11, 'actual eleven-source-profile table mismatch')
    literal.require(capture['pairChild'] == 1, 'current pair child count mismatch')
    profile = expected['currentProfile']
    profile_text = f"{profile['rawLabel']} · 74 source nuclei: both positive {profile['bothPositive']}, Xkr4 only {profile['firstOnly']}, Gm1992 only {profile['secondOnly']}, neither positive {profile['neitherPositive']}."
    literal.require(capture['pairProfile'] == profile_text, 'actual current74 source summary mismatch')
    declared_filter_text = 'roster search and page filters do not change this denominator'
    explanation_present = declared_filter_text in capture.get('pairResult', '')
    literal.require(explanation_present, 'captured DOM filter-denominator boundary missing')
    queries = [item['value'] for item in capture.get('rnaInputs', []) if item.get('id', '').endswith('-query')]
    literal.require(len(queries) == 1, 'capture must expose one exact roster query independently of feature query')
    selected = expected['selectedNucleus']
    if selected:
        text = capture.get('pairNucleus', '')
        literal.require(selected['nativeId'] in text, 'captured selected native ID mismatch')
        literal.require(f"Xkr4 raw count{selected['firstCount']}" in text and f"Gm1992 raw count{selected['secondCount']}" in text, 'selected raw value mismatch')
        literal.require(f"{selected['metadataRow']} / {selected['countsColumn']}" in text, 'selected metadata/count column mismatch')
    displayed_matches = re.search(r'(\d+) matching source-local nucleus rows / (\d+) in the current profile', capture.get('rosterText', ''))
    literal.require(displayed_matches is not None and int(displayed_matches.group(2)) == 74, 'roster summary must retain its original74 denominator')
    filtered_rows = int(displayed_matches.group(1))
    if queries[0] == 'NO_MATCHING_NUCLEUS':
        matching_original_rows = [row for row in source.independent_roster if row['confirmed_interneuron_profile_id'] == profile['profileId'] and queries[0].casefold() in ' '.join(row.values()).casefold()]
        literal.require(len(matching_original_rows) == filtered_rows == 0, 'unknown roster query must yield0 source rows, without changing pair74')
    if 'lumbar-roster' in path.name:
        # The parent supplied the native Lumbar action; the snapshot does not
        # retain the select value. Replay its separate factual count from CSV.
        lumbar_rows = [row for row in source.independent_roster if row['confirmed_interneuron_profile_id'] == profile['profileId'] and row['anatomy'] == 'Lumbar']
        literal.require(len(lumbar_rows) == filtered_rows == 18, 'source-local Lumbar subset count mismatch')
    return {'capture': literal.pin(path), 'pairJsonSha256': literal.sha(capture['pairJSON'].encode()),
            'original000ChunkSameSourceFacts': True,
            'completeSourceProfileDenominator': {'nucleusCount': 74, 'profileId': profile['profileId'], 'rawSourceLabel': profile['rawLabel'], 'derivedFromAllNativeProfileIndicesNotFilteredRoster': True},
            'allElevenProfilesAndTotals': expected['profiles'],
            'currentSourceProfilePartition': profile,
            'selectedSourceObjectChecked': selected is not None, 'selectedSourceNucleus': selected,
            'selectedObjectScope': 'One exact RNA source column; individual animal/ATAC/cross-source identity remain unverified.',
            'filterObservation': {'rosterQuery': queries[0], 'capturedFilteredRosterRows': filtered_rows, 'pairDenominatorRemainsComplete74': True, 'rawLumbarRowsReplayed': 18 if 'lumbar-roster' in path.name else None, 'LumbarNativeActionAuthority': 'parent confirmed native action; select value not retained by this snapshot' if 'lumbar-roster' in path.name else None, 'denominatorBoundaryLiteralTextObserved': explanation_present, 'numericPartitionValidatedIndependentlyOfThatText': True},
            'viewportReportedByCapture': {'width': capture.get('width'), 'scrollWidth': capture.get('scrollWidth'), 'height': capture.get('height'), 'localTableMeasurements': capture.get('tables'), 'pixelsOrWebGLNotInspectedByThisHelper': True}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture', action='append', default=[])
    args = parser.parse_args()
    before = preserved()
    source = literal.LiteralSource()
    roster_receipt = source.doc['reproduction']['inputs'][1]
    roster_path = source.root / roster_receipt['path']
    packed = roster_path.read_bytes()
    literal.require(len(packed) == roster_receipt['bytes'] and literal.sha(packed) == roster_receipt['sha256'], 'retained source-local roster pin mismatch')
    plain = gzip.decompress(packed)
    source.independent_roster = list(csv.DictReader(io.StringIO(plain.decode())))
    literal.require([row['compound_nucleus_key'] for row in source.independent_roster] == [row['key'] for row in source.doc['nuclei']], 'source-local roster923 column order mismatch')
    source.inputs.append(literal.pin(roster_path))
    profile = next(p for p in source.doc['profiles'] if p['nucleusCount'] == 74)
    expected = source.expected('Xkr4', 'Gm1992', profile['id'], None)
    results = []
    for name in args.capture:
        path = Path(name) if Path(name).is_absolute() else QA / name
        results.append(check_ready_capture(source, path))
    if results:
        for result in results:
            literal.require(result['allElevenProfilesAndTotals'] == results[0]['allElevenProfilesAndTotals'], 'complete-profile source groups changed across current query/narrow captures')
            literal.require(result['currentSourceProfilePartition'] == results[0]['currentSourceProfilePartition'], 'current74 source denominator/totals changed across captures')
    queries = list(dict.fromkeys(r['filterObservation']['rosterQuery'] for r in results))
    value = {'reviewId': 'I59-followon-000-source-pair-object-filter-independent-replay-20261005',
             'status': 'PREPARED_NO_ACTUAL_PAIR_CAPTURE_REPLAY' if not results else 'PASS_EXPLICIT_FOLLOWON_ACTUAL_SOURCE_PAIR_CAPTURES',
             'checkedAtUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
             'helper': literal.pin(Path(__file__)), 'reusedIndependentSourceHelper': literal.pin(BASE),
             'sourceInputs': source.inputs, 'expectedPreparationOnly': {'firstFeature': 'Xkr4', 'secondFeature': 'Gm1992', 'nativeFeatureRows': [1, 2], 'sourceChunk': 0, 'completeProfile': expected['currentProfile'], 'allSourceProfiles': 11, 'allSourceNuclei': 923},
             'actualCaptures': results,
             'crossCaptureFilterVerification': {'distinctObservedRosterQueries': queries, 'filterQueryChangedObserved': len(queries) > 1, 'allElevenGroupsAndComplete74DenominatorInvariant': bool(results), 'currentSelectedRowValuesCheckedSeparatelyForEveryNonNullSelection': bool(results), 'selectionRetentionNotInferredFromCountInvariance': True},
             'priorSevenCapturesAndTwoLandedCopiesPreserved': before,
             'scope': {'rootOrStageWrites': 0, 'browserOrNetworkActions': 0, 'downloadFilesInspected': 0, 'newSourceFetches': 0, 'productHelperImports': 0, 'originalRdsReadRehashOrParser': False, 'privateRuntimeTokenMinted': False, 'nativeExecutionOrViewPixelAttestedByHelper': False, 'newSourceProfilesGeometryRightsIdentityREGAdmissions': 0, 'countsAreRawSourceColumnDescriptionOnly': True}}
    literal.require(preserved() == before, 'prior preserved inputs changed during replay')
    target = OUT / ('I59_FOLLOWON_PREPARATION.json' if not results else 'I59_FOLLOWON_ACTUAL_SOURCE_REVIEW.json')
    literal.safe_write(target, (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode())
    print(json.dumps({'receipt': literal.pin(target), 'captures': len(results), 'status': value['status']}, indent=2))


if __name__ == '__main__':
    main()
