"""Explicit original capture manifest, no product imports or original Downloads."""
import hashlib
import json
import os
import re
from pathlib import Path

BASE = Path(__file__).parent
QA = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/docs/qa/2026-10-05-implementation-61')
LANDING = Path('/private/tmp/ohri-i61-native-export-landing-20261005')
PREP = Path('/private/tmp/ohri-i61-native-acceptance-preparation-20261005')


def read_pin(path):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        first = os.fstat(fd); body = bytearray(); offset = 0
        while True:
            block = os.pread(fd, 4096, offset)
            if not block: break
            body.extend(block); offset += len(block)
        last = os.fstat(fd)
        assert (first.st_dev, first.st_ino, first.st_size, first.st_mtime_ns, first.st_ctime_ns) == (last.st_dev, last.st_ino, last.st_size, last.st_mtime_ns, last.st_ctime_ns)
        assert len(body) == last.st_size
        return {'path': str(path), 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}, json.loads(body)
    finally:
        os.close(fd)


fixture_pin, fixture = read_pin(PREP / 'I61_SCIENTIFIC_EXPECTED_DOM_AND_EXPORT_FIXTURE.json')
assert fixture_pin['bytes'] == 229401 and fixture_pin['sha256'] == 'e74809a594266181ad5e945d8103b352c47be879c8fc5454d576a6525b1a9176'
_, extra = read_pin(BASE / 'I61_TWO_DERIVED_EXTRA_FILTER_CASES.json')
cases = fixture['filterCases'] + extra['cases']
names_pin, names = read_pin(QA / 'native-capture-names.json')
assert len(names) == 44 and 'actual-06g-registry-Crozat-dossier.json' not in names
exclusions = {
    'actual-01b-parent-open-nav-closed.json': 'Transient asynchronous lazy load; original default parent-disclosure field was not native-observed; no stable scientific state claim.',
    'actual-01c-nav-open-initial.json': 'NaV native disclosure opened but lazy child not yet ready; no stable source row or missing-data inference.',
}
selected_rows = {
    'actual-02-selected-density-row4.json': (56062562, 4),
    'actual-02b-selected-density-export-request.json': (56062562, 4),
    'actual-03-filter-label-attempt-stable-state.json': (56062562, 4),
    'actual-03b-second-duplicate-selected.json': (56062562, 13),
    'actual-04b-selected143point1-conflicts.json': (56062565, 3),
    'actual-04c-percentage28-export-request.json': (56062565, 3),
    'actual-07a-selected-before-close.json': (56062562, 30),
    **{f'actual-08{letter}-{name}.json': (56062562, 2) for letter, name in [
        ('c', 'narrow-explicit-selection'), ('d', 'scroll-button-immediate'),
        ('e', 'scroll-followup-Tab-exit'), ('f', 'desktop-selection-retained'),
        ('g', 'desktop-final-focus')]},
}
page_two = {'actual-03e-Lomb20-page2.json', 'actual-06a-all84-page2.json', 'actual-06b-all84-json-request.json', 'actual-06c-all84-csv-request.json', 'actual-08h-percentage28-page2.json'}
captures, excluded = [], []
for name in names:
    pin, raw = read_pin(QA / name)
    if name in exclusions:
        excluded.append({'pin': pin, 'reason': exclusions[name]})
        continue
    if not raw['workspace']['open']: state = 'workspace_closed'
    elif not raw['parentCrozat']['present']: state = 'workspace_open_parent_closed'
    elif not raw['nav']['present']: state = 'panel_closed'
    else: state = 'panel_open'
    narrow = name.startswith(tuple(f'actual-08{letter}-' for letter in 'abcde'))
    expected = {'state': state, 'expectedWidth': 390 if narrow else 1280}
    if state == 'panel_open':
        controls, filters = raw['nav']['controls'], {}
        for title, field in [('Original source table', 'tableId'), ('Raw source region', 'regionRaw'), ('Deposited condition field', 'condition'), ('Find a native label, row or file', 'query')]:
            matched = [c for c in controls if c.get('label') and c['label'].splitlines()[0].strip() == title]
            assert len(matched) == 1
            filters[field] = matched[0]['value']
        matched = [case for case in cases if case['filter'] == filters]
        assert len(matched) == 1, (name, filters)
        page = 3 if name == 'actual-08i-percentage28-page3-four.json' else 2 if name in page_two else 1
        assert re.search(rf'page {page} / ', raw['nav']['statuses'][0])
        selected = None
        if name in selected_rows:
            file_id, row = selected_rows[name]
            selected = next(r['id'] for r in fixture['expectedExportRows'] if r['sourceFileId'] == file_id and r['sourceRow'] == row)
        actual_keys = [v for v in (raw['nav'].get('selected') or {}).get('codeTexts', []) if v.startswith('crozat-v2:')]
        assert actual_keys == ([] if selected is None else [selected]), (name, actual_keys)
        expected.update(filterCase=matched[0]['name'], page=page, selectedKey=selected, attributionOpen=any(d['open'] for d in raw['nav']['details']))
    captures.append({'pin': pin, 'expected': expected})

review_pin, review = read_pin(LANDING / 'I61_INDEPENDENT_SIX_NATIVE_EXACT_FILE_LANDING_REVIEW.json')
seal_pin, seal = read_pin(LANDING / 'I61_EXACT_SIX_NATIVE_EXPORT_LANDING_SEAL.json')
assert review_pin['sha256'] == 'a7be37f867f55912a0d53d35c5339d2a29073d1b4b31f813a043f41c1b4d7c66'
assert seal_pin['sha256'] == '75bf508e5423972cab84b066c4ec971312c225fc4b5a6ba409b6111edca9cb45'
exports = []
for row in seal['landedExports']:
    owner = next(item for item in review['landedFiles'] if item['exactTempCopyPath'] == row['copyPath'])
    expected = next(c['expected'] for c in captures if c['pin']['path'] == owner['originalAfterCapturePath'])
    scope = 'selected_row' if 'selected_row' in row['name'] else 'filtered_rows'
    exports.append({'exactCopyPin': {'path': row['copyPath'], 'bytes': row['bytes'], 'sha256': row['sha256']},
                    'landingEvidencePin': review_pin, 'capturePath': owner['originalAfterCapturePath'],
                    'format': row['name'].rsplit('.', 1)[1], 'filterCase': expected['filterCase'], 'scope': scope,
                    'selectedKey': expected.get('selectedKey') if scope == 'selected_row' else None})
registry_pin, _ = read_pin(QA / 'actual-06g-registry-Crozat-dossier.json')
manifest = {
    'status': 'I61_EXPLICIT_ACTUAL_SCIENTIFIC_REPLAY_MANIFEST', 'parentActualReady': True,
    'parentActualReadyUTC': '2026-10-05T09:20:50Z',
    'parentReadinessPrecision': 'Observed clock tool UTC with seconds precision; declaration only, never reconstructed capture or action time.',
    'earlierHandwrittenDeclaration': {'value': '2026-10-05T09:20:00.000Z', 'evidenceLevel': 'handwritten parent declaration, corrected and not tool clock evidence'},
    'captureNamesPin': names_pin, 'captures': captures, 'excludedCaptures': excluded,
    'standaloneRegistryCaptures': [{'pin': registry_pin}], 'exports': exports,
    'selectionExpectationsBasis': 'Explicit original native case names and fixed original source rows, checked against raw original codeTexts; no generated row IDs added to raw captures.',
    'stableScienceCaptureCount': len(captures), 'originalListedCaptureCount': len(names), 'standaloneRegistryListedByNativeNames': False,
}
output = BASE / 'I61_ACTUAL_SCIENTIFIC_REPLAY_MANIFEST.json'
output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'path': str(output), 'bytes': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'captures': len(captures), 'excluded': len(excluded), 'registry': 1, 'exports': len(exports)}))
