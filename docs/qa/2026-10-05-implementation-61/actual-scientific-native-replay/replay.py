"""Independent bounded factual replay; CLI refuses before explicit ACTUAL_READY.

This imports only the independently fixed QA export checker, never an application
helper/comparator/parser. Synthetic functions confer no native or source-byte proof.
"""
import argparse
import copy
import datetime as dt
import hashlib
import importlib.util
import json
import math
import os
import re
import stat
from pathlib import Path

ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA = ROOT / 'docs/qa/2026-10-05-implementation-61'
PREP = Path('/private/tmp/ohri-i61-native-acceptance-preparation-20261005')
FIXTURE_PIN = {'path': str(PREP / 'I61_SCIENTIFIC_EXPECTED_DOM_AND_EXPORT_FIXTURE.json'), 'bytes': 229401, 'sha256': 'e74809a594266181ad5e945d8103b352c47be879c8fc5454d576a6525b1a9176'}
SELECTORS_PIN = {'path': str(PREP / 'I61_NATIVE_SELECTORS_AND_RAW_CAPTURE_SCHEMA.json'), 'bytes': 5339, 'sha256': '970c708d22c6c79b4596556ec2aa415ae9ca2b4fb7e80d4aa3b172f4720e80e4'}
CHECKER_PIN = {'path': str(PREP / 'verify-export.py'), 'bytes': 6607, 'sha256': 'e1d5b18c354d4df52815d9621b3ed5e1d4aad10c6f68d9a1951999094a4ac745'}
PREPARATION_PIN = {'path': str(PREP / 'I61_NATIVE_ACCEPTANCE_PREPARATION_SEAL.json'), 'bytes': 11680, 'sha256': 'eb3469889ccd7330a9bcc265830b0851d531a8fc0dc2b17d7f058dca2879dacf'}
EXTRA_CASES_PIN = {'path': str(Path(__file__).parent / 'I61_TWO_DERIVED_EXTRA_FILTER_CASES.json'), 'bytes': 3726, 'sha256': '88a9a76f4e1a89f11b3b7dd87590a17928d9cb40a756cc9af96d8f017abc5883'}
LANDING_SEAL_PIN = {'path': '/private/tmp/ohri-i61-native-export-landing-20261005/I61_EXACT_SIX_NATIVE_EXPORT_LANDING_SEAL.json', 'bytes': 7429, 'sha256': '75bf508e5423972cab84b066c4ec971312c225fc4b5a6ba409b6111edca9cb45'}
LANDING_REVIEW_PIN = {'path': '/private/tmp/ohri-i61-native-export-landing-20261005/I61_INDEPENDENT_SIX_NATIVE_EXACT_FILE_LANDING_REVIEW.json', 'bytes': 17383, 'sha256': 'a7be37f867f55912a0d53d35c5339d2a29073d1b4b31f813a043f41c1b4d7c66'}
PINNED_SOURCE_PATHS = [
    ('data/crozat-nav-inhibition-information-0.1.json', 104945, '43be824627a3d8b4f8c647b7d162735ab4e57a5243f84ec695d3265d67be6339'),
    ('data/crozat-experiment-family-observations-0.1.json', 1878506, '94b3dfda943df4979ae6dec09ebf2ff9d74e12cf81b04cbae6ac9c9c54ae0e42'),
    ('data/research-source-registry-0.1.json', 227257, '800baf2fca79cbf5752949e4f0332ba7d93feb6e79ca0582f20e9a3bcfdd4a15'),
]
STATES = {'workspace_closed', 'workspace_open_parent_closed', 'panel_closed', 'panel_open'}


def strict_json(body):
    def object_unique(pairs):
        result = {}
        for key, value in pairs:
            assert key not in result, f'Duplicate JSON key {key}'
            result[key] = value
        return result
    def number(lexical):
        value = float(lexical)
        assert math.isfinite(value), 'Nonfinite JSON number'
        return value
    def constant(lexical):
        raise AssertionError(f'Nonfinite JSON constant {lexical}')
    return json.loads(body, object_pairs_hook=object_unique, parse_float=number, parse_constant=constant)


def read_pinned(pin, ledger):
    path = Path(pin['path'])
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        a = os.fstat(fd); assert stat.S_ISREG(a.st_mode)
        out = bytearray(); offset = 0
        while True:
            chunk = os.pread(fd, 4096, offset)
            if not chunk: break
            out.extend(chunk); offset += len(chunk)
        b = os.fstat(fd)
        assert (a.st_dev, a.st_ino, a.st_size, a.st_mtime_ns, a.st_ctime_ns) == (b.st_dev, b.st_ino, b.st_size, b.st_mtime_ns, b.st_ctime_ns)
        actual = {'path': str(path), 'bytes': len(out), 'sha256': hashlib.sha256(out).hexdigest()}
        assert actual == pin, (actual, pin)
        ledger[str(path)] = pin
        return bytes(out)
    finally:
        os.close(fd)


def normalized(value):
    assert isinstance(value, str), 'Original text must be a captured string'
    return ' '.join(value.split())


def utc(value):
    assert isinstance(value, str) and (value.endswith('Z') or value.endswith('+00:00'))
    parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    assert parsed.utcoffset() == dt.timedelta(0)
    return parsed


def original_window(capture):
    bracket = capture['toolCaptureWindowUTC']
    start, end = utc(bracket['startUTC']), utc(bracket['endUTC'])
    assert start <= end, 'Original tool bracket reversed'
    return {'startUTC': bracket['startUTC'], 'endUTC': bracket['endUTC']}


def selection_absent(value):
    if value is None: return True
    assert isinstance(value, dict) and value.get('present') is False
    assert not value.get('heading') and not value.get('codeTexts') and not value.get('rawFields') and not value.get('sourceLinks') and not value.get('text'), 'Absent selection retains factual proof'
    return True


def row_facts(row):
    return [f"{row['sourceFileName']} · row {row['sourceRow']}", row['nativeCellLabel'],
            f"{row['regionRaw']} {row['conditionRaw'] or 'condition column not deposited'}",
            f"{row['rawNumericLexical']} {row['metricUnit']}",
            'Repeated label · identity unresolved' if row['nativeLabelAuditStatus'] == 'ambiguous_repeated_native_label' else 'Table-local label']


def control(controls, label, by='label'):
    # Wrapped select labels contain their option text; retain raw labels and use
    # only their observed first line as the control's title. Null button labels
    # confer no label match and never substitute their text for a source control.
    values = []
    for candidate in controls:
        raw = candidate.get(by)
        if raw is None: continue
        text = normalized(raw.splitlines()[0]) if by == 'label' else normalized(raw)
        if text == label: values.append(candidate)
    assert len(values) == 1, f'One actual control required: {label}'
    return values[0]


def derive_extra_cases(fixture):
    cases = []
    for name, f in [('density_cerv_cell11', {'tableId': 'nav-ttx-density', 'regionRaw': 'Cerv', 'condition': 'all', 'query': 'Cell 11'}),
                    ('density_lomb20', {'tableId': 'nav-ttx-density', 'regionRaw': 'Lomb', 'condition': 'all', 'query': ''})]:
        query = f['query'].strip().lower(); keys = []
        for row in fixture['expectedExportRows']:
            text = f"{row['sourceFileName']} Cell {row['nativeCellLabel']} {row['regionRaw']} {row['conditionRaw'] or ''} row{row['sourceRow']}".lower()
            if row['tableId'] == f['tableId'] and row['regionRaw'] == f['regionRaw'] and (not query or query == row['id'].lower() or query in text):
                keys.append(row['id'])
        cases.append({'name': name, 'filter': f, 'matchingRowCount': len(keys), 'orderedRowKeys': keys, 'pageSize': 12, 'pageCount': max(1, math.ceil(len(keys) / 12)), 'defaultSelectedKey': None})
    assert [c['matchingRowCount'] for c in cases] == [4, 20]
    return cases


def verify_capture(capture, declaration, fixture, selectors):
    state = declaration['state']; assert state in STATES
    bracket = original_window(capture)
    assert capture['url'].split('#', 1)[0].split('?', 1)[0].endswith('/source-audits')
    assert capture['h1'] == 'Source inputs and unresolved mappings'
    assert type(capture['width']) is int and capture['width'] > 0
    assert type(capture['scrollWidth']) is int and capture['scrollWidth'] >= capture['width']
    if 'expectedWidth' in declaration: assert capture['width'] == declaration['expectedWidth'], 'Requested width is not actual viewport evidence'
    workspace, parent, nav = capture['workspace'], capture['parentCrozat'], capture['nav']
    expected_workspace_summary = selectors['workspace']['summary'] + ' Inspect GEO sample conditions, exact barcode checks and bounded publication discovery.'
    assert workspace['present'] is True and normalized(workspace['summary']) == expected_workspace_summary
    assert type(workspace['open']) is bool and type(parent['present']) is bool and type(nav['present']) is bool and type(nav['disclosurePresent']) is bool
    if state == 'workspace_closed':
        assert workspace['open'] is False and parent['present'] is False and nav['disclosurePresent'] is False and nav['present'] is False
    elif state == 'workspace_open_parent_closed':
        assert workspace['open'] is True and parent['present'] is False and parent['parentDisclosureOpen'] is False and nav['disclosurePresent'] is False and nav['present'] is False
    else:
        assert workspace['open'] is True and parent['present'] is True and parent['parentDisclosureOpen'] is True and nav['disclosurePresent'] is True
        header = normalized(parent['directHeaderText'])
        for phrase in ['23 declared experiment tables', '2,115 separate-table observation rows', '220 complete condition groups within their own tables']:
            assert phrase in header, 'Legacy parent header must be scoped independently from child84'
        assert '84' not in header and 'NaV' not in header, 'Descendant child text contaminated legacy header'
    if state != 'panel_open':
        assert nav['present'] is False
        if state == 'panel_closed': assert nav['disclosureOpen'] is False
        assert not nav.get('sectionText') and not nav.get('controls') and not nav.get('visibleRows') and not nav.get('statuses') and not nav.get('details'), 'Closed child contains mounted facts/exports'
        assert selection_absent(nav.get('selected'))
        return {'state': state, 'bracket': bracket, 'captureScopeNaVFactsWithheld': True, 'captureScopePresenceFalse': True, 'wholeDOMSubtreeRemovalEstablished': False, 'scientificRows': 0}

    assert nav['disclosureOpen'] is True and nav['present'] is True
    assert isinstance(nav['controls'], list) and isinstance(nav['statuses'], list) and all(isinstance(s, str) for s in nav['statuses'])
    case = next(c for c in fixture['filterCases'] if c['name'] == declaration['filterCase'])
    page = declaration['page']; assert type(page) is int and 1 <= page <= case['pageCount']
    selected_key = declaration.get('selectedKey')
    source_rows = {r['id']: r for r in fixture['expectedExportRows']}
    keys = case['orderedRowKeys'][(page - 1) * 12:page * 12]
    expected = [source_rows[key] for key in keys]
    captured = nav['visibleRows']; assert len(captured) == len(expected)
    for actual, source in zip(captured, expected):
        assert list(map(normalized, actual['cells'])) == row_facts(source), 'Exact source row order/raw text/unit/label changed'
        assert normalized(actual['buttonText']) == row_facts(source)[0]
        assert type(actual['pressed']) is bool and actual['pressed'] is (source['id'] == selected_key)
    assert selected_key is None or selected_key in keys, 'Selection must own a currently displayed exact source row'
    for label, field in zip(selectors['navPanel']['filterLabels'], ['tableId', 'regionRaw', 'condition', 'query']):
        c = control(nav['controls'], label); assert c['value'] == case['filter'][field]
    expected_status = f"{case['matchingRowCount']} matching original measurement rows · page {page} / {case['pageCount']}. Complete original table denominators remain 56 and 28."
    assert normalized(nav['statuses'][0]) == expected_status
    for format in ['JSON', 'CSV']:
        c = control(nav['controls'], f"Export {case['matchingRowCount']} NaV rows {format}", 'text')
        assert type(c['disabled']) is bool and c['disabled'] is (not bool(case['matchingRowCount']))
    assert control(nav['controls'], 'Previous NaV rows', 'text')['disabled'] is (page == 1)
    assert control(nav['controls'], 'Next NaV rows', 'text')['disabled'] is (page == case['pageCount'])
    text = normalized(nav['sectionText'])
    assert selectors['navPanel']['heading'] in text
    for phrase in ['56 control/TTX current-density rows', '28 deposited inhibition-percentage rows', 'These 84 measurements do not count independent cells or animals', '93–143.1%', 'No rows are paired across or within these tables']:
        assert phrase in text
    selection = nav['selected']
    selected_controls = [c for c in nav['controls'] if normalized(c.get('text', '')) == 'Export this NaV row JSON']
    if selected_key is None:
        assert selection_absent(selection) and not selected_controls
    else:
        source = source_rows[selected_key]; assert selection['present'] is True
        assert normalized(selection['heading']) == f"{source['sourceFileName']} · original row {source['sourceRow']}"
        assert [value for value in selection['codeTexts'] if value.startswith('crozat-v2:')] == [selected_key]
        assert [value for value in selection['codeTexts'] if re.fullmatch('[0-9a-f]{64}', value)] == [source['sourceFileSha256']]
        assert [f['field'] for f in selection['rawFields']] == list(source['raw'])
        for field in selection['rawFields']:
            name = field['field']; assert normalized(field['text']) == f"{source['raw'][name]} · {source['cellLocators'][name]}"
        links = [link for link in selection['sourceLinks'] if normalized(link['text']) == f"Original workbook {source['sourceFileId']}"]
        assert len(selection['sourceLinks']) == len(links) == 1 and links[0]['href'] == source['sourceFileUrl']
        detail = normalized(selection['text'])
        for phrase in ['source label with unresolved physical-cell identity', 'comes from the published experiment context', 'The workbook header has no unit', 'Animals, age, sex, recording file and exact voltage/duration are not mapped to this row']:
            assert phrase in detail
        assert len(selected_controls) == 1 and selected_controls[0]['disabled'] is False
    if declaration.get('attributionOpen'):
        details = [d for d in nav['details'] if normalized(d['summary']) == selectors['navPanel']['attributionSummary']]
        assert len(details) == 1 and details[0]['open'] is True
        attribution = normalized(details[0]['text'])
        for phrase in ['Cerv/Tho/Lomb counts 12/6/10', 'n=28 and N=10 animals', 'regional animal counts are 4/4/2', 'regional n=12/8/6, summing to 26', '0.5 µM', 'IV steps of 100 ms', 'Figure 5A says 50 ms', 'IV peak at 0 mV', "+10 mV", 'No single protocol is assigned to all rows', 'not recomputed from the density file', '27 distinct raw region/label combinations', 'Lomb label sequence without 4', 'not 27 physical cells', '3–6 weeks', 'does not fetch the workbooks']:
            assert phrase in attribution, f'Attributed conflict/source boundary missing: {phrase}'
    return {'state': state, 'bracket': bracket, 'filterCase': case['name'], 'page': page, 'visibleScientificRows': len(expected), 'completeFilterRows': case['matchingRowCount'], 'selectedSourceKey': selected_key, 'sourceConflictsExpanded': bool(declaration.get('attributionOpen')), 'documentWidth': capture['width'], 'documentScrollWidth': capture['scrollWidth'], 'documentHorizontalOverflow': capture['scrollWidth'] > capture['width']}


def input_under(path, directory):
    return Path(path).resolve().is_relative_to(directory.resolve()) if hasattr(Path(path), 'is_relative_to') else str(Path(path).resolve()).startswith(str(directory.resolve()) + '/')


def verify_registry_capture(capture, registry):
    bracket = original_window(capture)
    assert capture['url'].split('?', 1)[0].endswith('/sources') and capture['h1'] == 'Source registry'
    source = next(s for s in registry['sources'] if s['id'] == 'SRC-CROZAT-2025')
    text = normalized(capture['articleText'])
    assert source['id'] in text and source['recordSets'][0]['recordSetId'] in text
    assert normalized(source['admission']['note']) in text
    for unit in source['experimentalUnits']:
        title = unit['unit'].replace('_', ' ').title()
        assert f"{title} {unit['count']} {normalized(unit['scope'])}" in text
    for phrase in ['CELL/PROFILE ROSTER None Reported', 'CHILD-ROSTER DRILL-DOWN None Reported', 'Source Local Not Cross Source Canonical', 'no globally stable cell identifier', 'Global Cell Roster · UNAVAILABLE', 'Raw Electrophysiology Traces · UNAVAILABLE', 'Atlas Registration · NOT ESTABLISHED', 'Cross Source Identity · NOT ESTABLISHED']:
        assert phrase in text
    for asset in source['assets']:
        assert asset['id'] in text
        sha = asset['integrity'].get('sha256')
        if sha: assert sha[:12] + '…' + sha[-8:] in text
    for file_id in [56062562, 56062565]:
        assert any(link['href'] == f'https://ndownloader.figshare.com/files/{file_id}' for link in capture['links'])
    return {'bracket': bracket, 'sourceId': source['id'], 'recordSetId': source['recordSets'][0]['recordSetId'], 'selectedInformationWorkbooks': 25, 'retainedOriginalWorkbooks': 26, 'separateLegacyRows': 2115, 'separateNaVRows': 84, 'existingExperimentalUnits': [1, 65, 654], 'childRosterUnavailable': True, 'sourceByteOrBrowserConsumptionProof': False}


def run(manifest_path, output, actual_ready):
    assert actual_ready, 'Explicit parent ACTUAL_READY required before reading original captures/export copies'
    ledger = {}
    body = Path(manifest_path).read_bytes()
    manifest_pin = {'path': str(Path(manifest_path)), 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}
    manifest = strict_json(read_pinned(manifest_pin, ledger))
    assert manifest['status'] == 'I61_EXPLICIT_ACTUAL_SCIENTIFIC_REPLAY_MANIFEST' and manifest['parentActualReady'] is True
    utc(manifest['parentActualReadyUTC'])
    fixture = strict_json(read_pinned(FIXTURE_PIN, ledger)); selectors = strict_json(read_pinned(SELECTORS_PIN, ledger))
    extra = strict_json(read_pinned(EXTRA_CASES_PIN, ledger))
    assert extra['sourceFixture'] == FIXTURE_PIN and extra['cases'] == derive_extra_cases(fixture)
    fixture = copy.deepcopy(fixture); fixture['filterCases'].extend(extra['cases'])
    read_pinned(PREPARATION_PIN, ledger)
    read_pinned(CHECKER_PIN, ledger)
    integrated = [strict_json(read_pinned({'path': str(ROOT / path), 'bytes': size, 'sha256': sha}, ledger)) for path, size, sha in PINNED_SOURCE_PATHS]
    doc, legacy, registry = integrated
    assert fixture['summary'] == doc['summary'] and fixture['articleContext'] == doc['articleContext'] and fixture['sourceConflicts'] == doc['conflicts']
    assert [len(t['observations']) for t in doc['tables']] == [56, 28]
    assert legacy['summary']['observationRowCount'] == 2115 and legacy['summary']['completeWithinTablePairGroupCount'] == 220
    source = next(s for s in registry['sources'] if s['id'] == 'SRC-CROZAT-2025')
    assert fixture['registryReadiness'] == source['localWorkbookReadiness']
    assert source['localWorkbookReadiness']['selectedInformationWorkbookFiles'] == 25 and source['localWorkbookReadiness']['allRetainedOriginalWorkbookFiles'] == 26
    spec = importlib.util.spec_from_file_location('qa_strict_export_checker', CHECKER_PIN['path'])
    checker = importlib.util.module_from_spec(spec); spec.loader.exec_module(checker)
    results = {}; captures = {}
    original_names = strict_json(read_pinned(manifest['captureNamesPin'], ledger))
    assert isinstance(original_names, list) and len(original_names) == len(set(original_names))
    assert set(Path(item['pin']['path']).name for item in manifest['captures'] + manifest['excludedCaptures']) == set(original_names)
    assert [Path(item['pin']['path']).name for item in manifest['excludedCaptures']] == ['actual-01b-parent-open-nav-closed.json', 'actual-01c-nav-open-initial.json']
    excluded = []
    for item in manifest['excludedCaptures']:
        assert input_under(item['pin']['path'], QA)
        capture = strict_json(read_pinned(item['pin'], ledger))
        excluded.append({'pin': item['pin'], 'bracket': original_window(capture), 'reason': item['reason'], 'scientificStableStateAccepted': False})
    assert manifest['captures'], 'At least one explicitly owned original capture required'
    for item in manifest['captures']:
        pin = item['pin']; assert input_under(pin['path'], QA), 'Capture must be inside actual root QA61 subtree'
        assert pin['path'] not in results, 'Duplicate original capture allocation'
        capture = strict_json(read_pinned(pin, ledger)); captures[pin['path']] = capture
        results[pin['path']] = verify_capture(capture, item['expected'], fixture, selectors)
    standalone = []
    for item in manifest['standaloneRegistryCaptures']:
        assert input_under(item['pin']['path'], QA) and Path(item['pin']['path']).name == 'actual-06g-registry-Crozat-dossier.json'
        standalone.append({'pin': item['pin'], 'sourceDossierReplay': verify_registry_capture(strict_json(read_pinned(item['pin'], ledger)), registry)})
    assert len(standalone) == 1
    landing_seal = strict_json(read_pinned(LANDING_SEAL_PIN, ledger))
    landing_review = strict_json(read_pinned(LANDING_REVIEW_PIN, ledger))
    assert landing_seal['status'] == 'SEALED_PASS_SIX_NATIVE_EXACT_FILE_LANDING_ORIGINAL_EVENT_TIMEOUTS_RETAINED'
    assert landing_review['status'] == 'PASS_SIX_CURRENT_NATIVE_EXACT_FILE_LANDINGS_EVENT_APIS_TIMED_OUT'
    copy_pins = {row['copyPath']: {'path': row['copyPath'], 'bytes': row['bytes'], 'sha256': row['sha256']} for row in landing_seal['landedExports']}
    assert len(copy_pins) == 6 and len(manifest['exports']) == 6
    assert set(item['exactCopyPin']['path'] for item in manifest['exports']) == set(copy_pins)
    exports = []
    for item in manifest.get('exports', []):
        pin = item['exactCopyPin']; assert input_under(pin['path'], Path('/private/tmp')) or input_under(pin['path'], QA), 'Only explicit copied export artifacts; no personal Downloads reads'
        assert pin == copy_pins[pin['path']] and item['landingEvidencePin'] == LANDING_REVIEW_PIN
        assert item['landingEvidencePin']['path'] != pin['path'], 'Factual body cannot be its own native landing authority'
        read_pinned(item['landingEvidencePin'], ledger)
        capture_pin_path = item['capturePath']; assert capture_pin_path in results
        captured = results[capture_pin_path]
        owner = next(row for row in landing_review['landedFiles'] if row['exactTempCopyPath'] == pin['path'])
        assert owner['originalAfterCapturePath'] == capture_pin_path and owner['bytes'] == pin['bytes'] and owner['sha256'] == pin['sha256']
        assert captured['state'] == 'panel_open' and captured['filterCase'] == item['filterCase']
        scope = item['scope']; selected_key = item.get('selectedKey')
        if scope == 'selected_row': assert selected_key is not None and captured['selectedSourceKey'] == selected_key
        assert item['format'] in ['json', 'csv']
        raw = read_pinned(pin, ledger).decode('utf-8')
        verifier = checker.verify_json if item['format'] == 'json' else checker.verify_csv
        facts = verifier(raw, fixture, item['filterCase'], scope, selected_key)
        assert facts['rowCount'] == owner['expectedWorksheetRows']
        exports.append({'exactCopyPin': pin, 'landingEvidencePin': item['landingEvidencePin'], 'capturePath': capture_pin_path, 'factualBodyReplay': facts, 'nativeLandingAttributionVerifiedByThisScientificReplay': False})
    for pin in list(ledger.values()): read_pinned(pin, ledger)
    result = {'status': 'PASS_I61_ACTUAL_CAPTURED_SCIENTIFIC_FACTS_AND_EXACT_COPY_EXPORT_BODIES_ONLY', 'manifest': manifest_pin, 'parentReadiness': {'parentActualReadyUTC': manifest['parentActualReadyUTC'], 'precision': manifest['parentReadinessPrecision'], 'earlierHandwrittenDeclarationRetainedAsNonClockEvidence': manifest['earlierHandwrittenDeclaration'], 'captureAndActionClocks': 'Only original raw brackets, never reconstructed from parent readiness declaration'}, 'captures': results, 'excludedTransientCaptures': excluded, 'standaloneRegistry': standalone, 'exports': exports,
              'sourceScope': {'tables': 2, 'measurementRows': 84, 'densityRows': 56, 'percentageRows': 28, 'selectedInformationWorkbooks': 25, 'retainedOriginalWorkbooks': 26, 'oldTables': 23, 'oldObservations': 2115, 'oldWithinTableGroups': 220, 'newProfiles': 0, 'physicalCellDenominator': None, 'perRowAnimalMapping': None, 'crossTablePairing': False, 'labelRepair': False},
              'limits': {'productHelperImported': False, 'sourceXlsxParserImported': False, 'originalWorkbooksReread': False, 'browserConsumedWorkbookProof': False, 'rawTransportVerifiedByThisReplay': False, 'downloadEventWindowAttributionByThisReplay': False, 'nativeEightCaseCompletenessAsserted': False, 'rootWrites': 0, 'stageWrites': 0, 'browserOperations': 0, 'networkRequests': 0, 'serverStarts': 0}, 'inputPins': list(ledger.values())}
    output = Path(output); assert input_under(output, Path('/private/tmp'))
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--actual-ready', action='store_true')
    arguments = parser.parse_args()
    result = run(arguments.manifest, arguments.output, arguments.actual_ready)
    print(json.dumps({'status': result['status'], 'captures': len(result['captures']), 'exports': len(result['exports']), 'output': str(arguments.output)}))
