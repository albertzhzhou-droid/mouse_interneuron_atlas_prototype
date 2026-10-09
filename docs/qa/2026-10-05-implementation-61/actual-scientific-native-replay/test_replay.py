"""Synthetic capture counterexamples only; no actual DOM/download reads."""
import copy
import importlib.util
import json
import unittest
from pathlib import Path

BASE = Path(__file__).parent
spec = importlib.util.spec_from_file_location('scientific_replay', BASE / 'replay.py')
replay = importlib.util.module_from_spec(spec); spec.loader.exec_module(replay)
ledger = {}
FIXTURE = replay.strict_json(replay.read_pinned(replay.FIXTURE_PIN, ledger))
FIXTURE['filterCases'].extend(replay.derive_extra_cases(FIXTURE))
SELECTORS = replay.strict_json(replay.read_pinned(replay.SELECTORS_PIN, ledger))
CONTEXT = ' '.join(['Cerv/Tho/Lomb counts 12/6/10', 'n=28 and N=10 animals', 'regional animal counts are 4/4/2', 'regional n=12/8/6, summing to 26', '0.5 µM', 'IV steps of 100 ms', 'Figure 5A says 50 ms', 'IV peak at 0 mV', '+10 mV', 'No single protocol is assigned to all rows', 'not recomputed from the density file', '27 distinct raw region/label combinations', 'Lomb label sequence without 4', 'not 27 physical cells', '3–6 weeks', 'does not fetch the workbooks'])


def fake_capture(case_name='all', page=1, selected=None, state='panel_open', attribution=False):
    case = next(c for c in FIXTURE['filterCases'] if c['name'] == case_name)
    rows = {r['id']: r for r in FIXTURE['expectedExportRows']}
    keys = case['orderedRowKeys'][(page - 1) * 12:page * 12]
    controls = [{'tag': 'select', 'label': label, 'value': case['filter'][field], 'text': '', 'disabled': False}
                for label, field in zip(SELECTORS['navPanel']['filterLabels'], ['tableId', 'regionRaw', 'condition', 'query'])]
    for format in ['JSON', 'CSV']:
        controls.append({'tag': 'button', 'text': f"Export {case['matchingRowCount']} NaV rows {format}", 'disabled': not bool(case['matchingRowCount'])})
    controls.extend([{'tag': 'button', 'text': 'Previous NaV rows', 'disabled': page == 1}, {'tag': 'button', 'text': 'Next NaV rows', 'disabled': page == case['pageCount']}])
    selection = None
    if selected:
        row = rows[selected]
        selection = {'present': True, 'heading': f"{row['sourceFileName']} · original row {row['sourceRow']}", 'codeTexts': [selected, row['sourceFileSha256']],
                     'rawFields': [{'field': k, 'text': f"{v} · {row['cellLocators'][k]}"} for k, v in row['raw'].items()],
                     'sourceLinks': [{'text': f"Original workbook {row['sourceFileId']}", 'href': row['sourceFileUrl']}],
                     'text': 'Native is a source label with unresolved physical-cell identity. Unit comes from the published experiment context. The workbook header has no unit. Animals, age, sex, recording file and exact voltage/duration are not mapped to this row.'}
        controls.append({'tag': 'button', 'text': 'Export this NaV row JSON', 'disabled': False})
    capture = {'toolCaptureWindowUTC': {'startUTC': '2026-10-05T12:00:00.000Z', 'endUTC': '2026-10-05T12:00:01.000Z'},
               'url': 'http://127.0.0.1:3004/source-audits#source-exact-inputs', 'h1': 'Source inputs and unresolved mappings', 'width': 1280, 'scrollWidth': 1280,
               'workspace': {'present': True, 'open': True, 'summary': 'Sample conditions and publication mapping\nInspect GEO sample conditions, exact barcode checks and bounded publication discovery.'},
               'parentCrozat': {'present': True, 'parentDisclosureOpen': True, 'directHeaderText': 'PKD2L1 physiology. 23 declared experiment tables · 2,115 separate-table observation rows · 220 complete condition groups within their own tables.'},
               'nav': {'disclosurePresent': True, 'disclosureOpen': True, 'present': True, 'controls': controls,
                       'sectionText': 'NaV current and TTX inhibition. 56 control/TTX current-density rows and 28 deposited inhibition-percentage rows. These 84 measurements do not count independent cells or animals. Source percentages span 93–143.1%. No rows are paired across or within these tables.',
                       'statuses': [f"{case['matchingRowCount']} matching original measurement rows · page {page} / {case['pageCount']}. Complete original table denominators remain 56 and 28.", ''],
                       'visibleRows': [{'cells': replay.row_facts(rows[key]), 'buttonText': replay.row_facts(rows[key])[0], 'pressed': key == selected} for key in keys],
                       'selected': selection, 'details': [{'summary': SELECTORS['navPanel']['attributionSummary'], 'open': attribution, 'text': CONTEXT}]}}
    if state != 'panel_open':
        capture['nav'].update(present=False, sectionText=None, controls=[], statuses=[], visibleRows=[], selected=None, details=[], disclosureOpen=False)
        if state in ['workspace_closed', 'workspace_open_parent_closed']:
            capture['parentCrozat'].update(present=False, parentDisclosureOpen=False, directHeaderText=None)
            capture['nav'].update(disclosurePresent=False, disclosureOpen=None)
        if state == 'workspace_closed': capture['workspace']['open'] = False
    declaration = {'state': state, 'filterCase': case_name, 'page': page, 'selectedKey': selected, 'attributionOpen': attribution}
    return capture, declaration


class Guards(unittest.TestCase):
    def verify(self, capture, declaration): return replay.verify_capture(capture, declaration, FIXTURE, SELECTORS)

    def test_all_current_filter_visible12_complete84(self):
        result = self.verify(*fake_capture())
        self.assertEqual((result['visibleScientificRows'], result['completeFilterRows']), (12, 84))

    def test_selected_long_decimal_and_exact_cells(self):
        key = FIXTURE['sampleRows'][0]['id']; result = self.verify(*fake_capture(selected=key))
        self.assertEqual(result['selectedSourceKey'], key)

    def test_percentage_unclamped_and_expanded_conflicts(self):
        key = FIXTURE['sampleRows'][1]['id']; result = self.verify(*fake_capture('percent', selected=key, attribution=True))
        self.assertTrue(result['sourceConflictsExpanded']); self.assertEqual(result['completeFilterRows'], 28)

    def test_duplicate_labels_are_separate_original_rows(self):
        self.assertEqual(self.verify(*fake_capture('cerv_cell11'))['visibleScientificRows'], 6)
        self.assertEqual(self.verify(*fake_capture('all_cell11'))['visibleScientificRows'], 9)

    def test_missing_lomb4_and_empty_exports(self):
        self.assertEqual(self.verify(*fake_capture('missing_lomb4'))['completeFilterRows'], 0)

    def test_closed_hierarchy_absent(self):
        for state in ['workspace_closed', 'workspace_open_parent_closed', 'panel_closed']:
            with self.subTest(state=state):
                result = self.verify(*fake_capture(state=state))
                self.assertTrue(result['captureScopeNaVFactsWithheld'])
                self.assertFalse(result['wholeDOMSubtreeRemovalEstablished'])

    def test_wrapped_actual_labels_and_null_button_labels(self):
        capture, declaration = fake_capture()
        for c in capture['nav']['controls']:
            if c.get('label'): c['label'] += '\nBoth separate tables\nRetained actual option text'
            else: c['label'] = None
        self.assertEqual(self.verify(capture, declaration)['completeFilterRows'], 84)

    def test_wrapped_label_wrong_first_line_refused(self):
        capture, declaration = fake_capture(); capture['nav']['controls'][0]['label'] = 'Foreign selector\nOriginal source table'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_original_workspace_present_assertion_preserved(self):
        capture, declaration = fake_capture(state='workspace_closed'); capture['workspace']['present'] = False
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_two_extra_filters_literal_source_counts(self):
        case = next(c for c in FIXTURE['filterCases'] if c['name'] == 'density_cerv_cell11')
        self.assertEqual(case['matchingRowCount'], 4)
        self.assertTrue(case['orderedRowKeys'][1].endswith('row13'))
        self.assertEqual(self.verify(*fake_capture('density_cerv_cell11', selected=case['orderedRowKeys'][1]))['visibleScientificRows'], 4)
        self.assertEqual(self.verify(*fake_capture('density_lomb20', page=1))['visibleScientificRows'], 12)
        self.assertEqual(self.verify(*fake_capture('density_lomb20', page=2))['visibleScientificRows'], 8)

    def test_extra_filter_still_no_label_dedup_or_row_repair(self):
        capture, declaration = fake_capture('density_cerv_cell11')
        capture['nav']['visibleRows'].pop()
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_lomb_second_page_is_not_first_page_fallback(self):
        capture, declaration = fake_capture('density_lomb20', page=2)
        capture['nav']['visibleRows'] = fake_capture('density_lomb20', page=1)[0]['nav']['visibleRows'][:8]
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_closed_hidden_facts_refused(self):
        capture, declaration = fake_capture(state='panel_closed'); capture['nav']['sectionText'] = '84 source rows'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_closed_selection_proof_refused(self):
        capture, declaration = fake_capture(state='panel_closed'); capture['nav']['selected'] = {'present': False, 'codeTexts': ['crozat:foreign']}
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_wrong_worksheet_locator_refused(self):
        capture, declaration = fake_capture(selected=FIXTURE['sampleRows'][0]['id']); capture['nav']['selected']['rawFields'][3]['text'] = '-147.41999999999999 · DATA R!D5'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_wrong_source_workbook_link_refused(self):
        capture, declaration = fake_capture(selected=FIXTURE['sampleRows'][0]['id']); capture['nav']['selected']['sourceLinks'][0]['href'] = 'https://ndownloader.figshare.com/files/56062565'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_clipped_percent_refused(self):
        capture, declaration = fake_capture('percent'); capture['nav']['visibleRows'][1]['cells'][3] = '100 %'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_descendant84_not_legacy_header_refused(self):
        capture, declaration = fake_capture(); capture['parentCrozat']['directHeaderText'] += ' Additional NaV 84'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_visible_page12_not_complete_filter84(self):
        capture, declaration = fake_capture(); capture['nav']['statuses'][0] = capture['nav']['statuses'][0].replace('84 matching', '12 matching')
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_selected_row_outside_current_page_refused(self):
        capture, declaration = fake_capture(page=2, selected=FIXTURE['sampleRows'][0]['id'])
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_filter_control_membership_exact(self):
        capture, declaration = fake_capture('percent'); capture['nav']['controls'][0]['value'] = 'nav-ttx-density'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_selected_foreign_key_refused(self):
        capture, declaration = fake_capture(selected=FIXTURE['sampleRows'][0]['id']); capture['nav']['selected']['codeTexts'][0] = 'crozat-v2:foreign:row4'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_extra_foreign_source_key_or_sha_refused(self):
        for extra in ['crozat-v2:foreign:row4', '0' * 64]:
            capture, declaration = fake_capture(selected=FIXTURE['sampleRows'][0]['id'])
            capture['nav']['selected']['codeTexts'].append(extra)
            with self.subTest(extra=extra):
                with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_row_unknown_scope_must_remain_visible(self):
        capture, declaration = fake_capture(selected=FIXTURE['sampleRows'][0]['id']); capture['nav']['selected']['text'] = 'Native is a source label with unresolved physical-cell identity. Unit comes from the published experiment context. The workbook header has no unit. Age mapped.'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_closed_attribution_is_not_expanded_evidence(self):
        capture, declaration = fake_capture(attribution=True); capture['nav']['details'][0]['open'] = False
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_count_conflict_repair_refused(self):
        capture, declaration = fake_capture(attribution=True); capture['nav']['details'][0]['text'] = CONTEXT.replace('regional n=12/8/6, summing to 26', 'regional n=12/6/10, summing to 28')
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_actual_width_not_requested_width(self):
        capture, declaration = fake_capture(); declaration['expectedWidth'] = 390
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_boolean_pressed_not_string(self):
        capture, declaration = fake_capture(); capture['nav']['visibleRows'][0]['pressed'] = 'false'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_original_tool_bracket_required(self):
        capture, declaration = fake_capture(); del capture['toolCaptureWindowUTC']
        with self.assertRaises(KeyError): self.verify(capture, declaration)

    def test_reversed_tool_bracket_refused(self):
        capture, declaration = fake_capture(); capture['toolCaptureWindowUTC']['startUTC'] = '2026-10-05T12:00:02.000Z'
        with self.assertRaises(AssertionError): self.verify(capture, declaration)

    def test_raw_duplicate_nonfinite_json_refused(self):
        for body in ['{"nav":null,"nav":{"present":true}}', '{"value":NaN}', '{"value":1e9999}']:
            with self.subTest(body=body):
                with self.assertRaises(AssertionError): replay.strict_json(body)

    def test_not_ready_refuses_before_file_read(self):
        with self.assertRaisesRegex(AssertionError, 'ACTUAL_READY'):
            replay.run('/private/tmp/not-a-real-actual-manifest.json', BASE / 'must-not-exist.json', False)
        self.assertFalse((BASE / 'must-not-exist.json').exists())


if __name__ == '__main__': unittest.main(verbosity=2)
