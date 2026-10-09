#!/usr/bin/env python3
"""Extract two exact Crozat v2 NaV tables; retain row identity and source conflicts.

No source script execution, statistics, label repair, row/cell pairing, animal
mapping or raw-trace reconstruction is performed. Uses Python's standard library.
"""
import argparse
import collections
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = 'data/source-candidates/crozat-nav-inhibition-20261004/crozat-nav-inhibition-inputs-manifest-0.1.json'
OUTPUT = 'data/crozat-nav-inhibition-information-0.1.json'
RECEIPT = 'data/crozat-nav-inhibition-derivation-receipt-0.1.json'
EXTRACTOR = 'tools/build_crozat_nav_inhibition_information.py'
N = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REGIONS = {'Cerv': 'cervical', 'Tho': 'thoracic', 'Lomb': 'lumbar'}
TABLES = [
    (56062562, 'nav-ttx-density', ['Cell', 'Region', 'Cond', 'Dens'], 'Dens', ['CTR', 'TTX'], 'pA/pF', 56, 198),
    (56062565, 'nav-ttx-percent', ['Cell', 'Region', 'Perc'], 'Perc', [], '%', 28, 301),
]


def pin(p, label):
    b = p.read_bytes()
    return {'path': label, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}


class ArticleParagraphs(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = None; self.heading_parts = None; self.heading = ''; self.rows = []
    def handle_starttag(self, tag, _attrs):
        if tag == 'p': self.parts = []
        if tag in ['h2', 'h3', 'h4']: self.heading_parts = []
    def handle_data(self, data):
        if self.parts is not None: self.parts.append(data)
        if self.heading_parts is not None: self.heading_parts.append(data)
    def handle_endtag(self, tag):
        if tag == 'p' and self.parts is not None:
            text = ' '.join(''.join(self.parts).split())
            self.rows.append({'ordinal': len(self.rows) + 1, 'heading': self.heading, 'text': text,
                             'textSha256': hashlib.sha256(text.encode()).hexdigest()})
            self.parts = None
        if tag in ['h2', 'h3', 'h4'] and self.heading_parts is not None:
            self.heading = ' '.join(''.join(self.heading_parts).split()); self.heading_parts = None


def workbook_rows(path):
    with zipfile.ZipFile(path) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', N)]
        relationships = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = ET.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet', N)
        if len(sheets) != 1: raise ValueError('one exact worksheet required')
        sheet = sheets[0]; rid = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        target = relationships[rid]
        member = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join('xl', target))
        tree = ET.fromstring(z.read(member)); output = []
        for row in tree.findall('m:sheetData/m:row', N):
            cells = {}
            for cell in row.findall('m:c', N):
                if cell.find('m:f', N) is not None: raise ValueError('formula cells are not source observations')
                value = cell.find('m:v', N)
                text = None if value is None else value.text
                if cell.attrib.get('t') == 's' and text is not None: text = strings[int(text)]
                if cell.attrib.get('t') == 'inlineStr': text = ''.join(cell.find('m:is', N).itertext())
                if text is not None: cells[cell.attrib['r']] = text
            if cells: output.append((int(row.attrib['r']), cells))
        return sheet.attrib['name'], member, tree.find('m:dimension', N).attrib['ref'], output


def build(root):
    manifest = json.loads((root / MANIFEST).read_text())
    inputs = manifest['inputs']
    for row in inputs:
        actual = pin(root / row['path'], row['path'])
        if any(actual[k] != row[k] for k in ['path', 'bytes', 'sha256']): raise ValueError('source input pin mismatch')
        if row.get('publisherMd5') and hashlib.md5((root / row['path']).read_bytes()).hexdigest() != row['publisherMd5']:
            raise ValueError('source publisher MD5 mismatch')
    by_role = {r['role']: r for r in inputs}
    api = json.loads((root / by_role['official-version-api']['path']).read_text())
    if api['version'] != 2 or api['license']['name'] != 'CC BY 4.0': raise ValueError('exact version/file rights changed')
    native = {f['id']: f for f in api['files']}
    population = json.loads((root / by_role['prior-population-context']['path']).read_text())
    if population['scope']['lifeStage'] != '3–6 weeks' or population['scope']['displayedProfileCount'] != 1:
        raise ValueError('prior attributed source-population context changed')
    script = (root / by_role['author-analysis']['path']).read_text().splitlines()
    article = ArticleParagraphs(); article.feed((root / by_role['primary-article']['path']).read_text())
    results = next(p for p in article.rows if 'Tetrodotoxin (TTX, 0.5 µM;' in p['text'])
    caption = next(p for p in article.rows if p['text'].startswith('A Left. Representative whole-cell current traces') and 'D Summary boxplots' in p['text'])
    result_counts = re.search(r'in TTX \(N = (\d+), n = (\d+)\); cervical:.*?\(N = (\d+), n = (\d+)\); thoracic:.*?\(N = (\d+), n = (\d+)\) and lumbar:.*?\(N = (\d+), n = (\d+)\)', results['text'])
    caption_counts = re.search(r'C: N = (\d+), n = (\d+); T: N = (\d+), n = (\d+) and L: N = (\d+), n = (\d+)\)', caption['text'].split('D Summary boxplots')[1])
    if not result_counts or not caption_counts: raise ValueError('exact primary count locators changed')
    rv = list(map(int, result_counts.groups())); cv = list(map(int, caption_counts.groups()))
    if rv != [10, 28, 4, 12, 4, 6, 2, 10] or cv != [4, 12, 4, 8, 2, 6]: raise ValueError('primary reported counts changed')
    if '100 ms; Fig. 5ALeft' not in results['text'] or 'increments for 50 ms' not in caption['text']:
        raise ValueError('reported duration context changed')
    locator = lambda p: {'articleUrl': 'https://www.nature.com/articles/s42003-025-08559-x', 'paragraphOrdinal': p['ordinal'],
                          'heading': p['heading'], 'normalizedParagraphTextSha256': p['textSha256'],
                          'ordinalMethod': 'all HTML p elements; text whitespace normalized by standard HTMLParser'}
    tables = []
    for fid, tid, headers, metric, conditions, unit, count, line in TABLES:
        source = next(r for r in inputs if r.get('fileId') == fid)
        f = native[fid]
        if f['size'] != source['bytes'] or f['computed_md5'] != source['publisherMd5'] or f['is_link_only']:
            raise ValueError('official version/asset mismatch')
        if f'"{f["name"]}"' not in script[line - 1]: raise ValueError('author read_excel mapping changed')
        sheet, member, dimension, cells = workbook_rows(root / source['path'])
        expected_header = {f'{chr(65+i)}1': h for i, h in enumerate(headers)}
        if cells[0] != (1, expected_header): raise ValueError('native header changed')
        observations = []
        for rownum, row in cells[1:]:
            if sorted(row) != sorted(f'{chr(65+i)}{rownum}' for i in range(len(headers))): raise ValueError('incomplete or extra meaningful row')
            raw = {h: row[f'{chr(65+i)}{rownum}'] for i, h in enumerate(headers)}
            if raw['Region'] not in REGIONS or not re.fullmatch(r'[1-9]\d*', raw['Cell']): raise ValueError('raw region/label changed')
            if conditions and raw['Cond'] not in conditions: raise ValueError('native condition changed')
            value = float(raw[metric])
            if not (-1e9 < value < 1e9): raise ValueError('nonfinite source measurement')
            observations.append({'id': f'crozat-v2:{fid}:{source["sha256"]}:{sheet}:row{rownum}', 'tableId': tid,
                'sourceRow': rownum, 'raw': raw, 'nativeCellLabel': raw['Cell'], 'regionRaw': raw['Region'],
                'region': REGIONS[raw['Region']], 'conditionRaw': raw.get('Cond'), 'value': value,
                'rawNumericLexical': raw[metric], 'metricField': metric, 'metricUnit': unit,
                'cellLocators': {h: f'{sheet}!{chr(65+i)}{rownum}' for i, h in enumerate(headers)},
                'nativeLabelIsPhysicalCellIdentity': False, 'animalId': None, 'perRowAge': None, 'perRowSex': None,
                'rawTraceId': None, 'sourcePairId': None})
        if len(observations) != count: raise ValueError('exact source row count changed')
        grouped = collections.defaultdict(list)
        for row in observations: grouped[(row['regionRaw'], row['nativeCellLabel'], row['conditionRaw'])].append(row)
        duplicates = [{'regionRaw': region, 'nativeCellLabel': label, 'conditionRaw': cond,
                       'observationIds': [r['id'] for r in rs], 'sourceRows': [r['sourceRow'] for r in rs]}
                      for (region, label, cond), rs in grouped.items() if len(rs) > 1]
        collision_ids = {rid for group in duplicates for rid in group['observationIds']}
        for row in observations: row['nativeLabelAuditStatus'] = 'ambiguous_repeated_native_label' if row['id'] in collision_ids else 'table_local_label_only_not_physical_identity'
        counts = [{'regionRaw': reg, 'region': REGIONS[reg], 'conditionRaw': cond,
                   'observationRowCount': sum(r['regionRaw'] == reg and r['conditionRaw'] == cond for r in observations)}
                  for reg in REGIONS for cond in conditions or [None]]
        tables.append({'id': tid, 'title': 'NaV current density: control and TTX' if metric == 'Dens' else 'Deposited TTX inhibition percentages',
            'fileId': fid, 'sourceFile': source, 'sheet': sheet, 'worksheetMember': member, 'formattingDimension': dimension,
            'nativeHeaders': headers, 'metricField': metric, 'metricUnit': unit, 'sourceHeaderUnit': None,
            'unitAuthority': {'mode': 'attributed_primary_article_unit_not_workbook_header', 'locator': locator(results if metric == 'Dens' else caption)},
            'sourceAnalysis': {'fileId': 56062553, 'path': by_role['author-analysis']['path'], 'sha256': by_role['author-analysis']['sha256'], 'readExcelLine': line},
            'observationRowCount': count, 'distinctRegionNativeLabelKeyCount': len({(r['regionRaw'], r['nativeCellLabel']) for r in observations}),
            'distinctKeysCountPhysicalCells': False, 'regionConditionCounts': counts, 'duplicateNativeLabels': duplicates,
            'observedNativeLabelGaps': [{'regionRaw': 'Lomb', 'missingIntegerLabel': '4', 'interpretation': 'source label gap only; no missing row/cell imputed'}],
            'rawRange': {'minimum': min(r['value'] for r in observations), 'maximum': max(r['value'] for r in observations)},
            'observations': observations})
    return {'schemaVersion': '0.1.0', 'adapterId': 'crozat-nav-inhibition-information-0.1',
        'documentType': 'source_table_information_not_cell_roster', 'parentSourceId': 'SRC-CROZAT-2025',
        'profileId': 'crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn',
        'source': {'doi': api['doi'], 'version': 2, 'datasetUrl': 'https://doi.org/10.6084/m9.figshare.29430869.v2',
            'articleUrl': 'https://www.nature.com/articles/s42003-025-08559-x', 'license': api['license'],
            'changeNotice': 'Two source workbooks transcribed to row-scoped JSON; raw labels and OOXML numeric text retained, article units/context attributed, conflicts exposed. No source measurements repaired or recomputed.'},
        'summary': {'tableCount': 2, 'sourceObservationRowCount': 84, 'densityObservationRows': 56, 'percentageObservationRows': 28,
            'depositWideUniqueCellCount': None, 'animalMappedRowCount': 0, 'pairedRowCount': 0, 'newSourceProfiles': 0,
            'newGeometryObjects': 0, 'newInternalObjects': 0, 'registrations': 0},
        'articleContext': {'resultsCounts': {'reportedAnimalN': rv[0], 'reportedObservationN': rv[1],
                'regions': [{'region': reg, 'reportedAnimalN': rv[2+2*i], 'reportedObservationN': rv[3+2*i]} for i,reg in enumerate(REGIONS.values())], 'locator': locator(results)},
            'figure5DCaptionCounts': {'regions': [{'region': reg, 'reportedAnimalN': cv[2*i], 'reportedObservationN': cv[1+2*i]} for i,reg in enumerate(REGIONS.values())],
                'derivedSumOfPrintedRegionalN': sum(cv[1::2]), 'locator': locator(caption)},
            'ttxConcentration': {'value': 0.5, 'unit': 'µM', 'scope': 'reported experiment context, not verified per-row dose', 'locator': locator(results)},
            'reportedProtocolContexts': [{'role': 'Results incremental IV protocol', 'stepDurationMs': 100, 'reportedIVPeakVoltageMv': 0, 'locator': locator(results)},
                {'role': 'Figure5 A incremental IV caption', 'stepDurationMs': 50, 'reportedInhibitionStepVoltageMv': 10, 'locator': locator(caption)}],
            'rowSpecificStepDurationOrVoltage': None, 'sourcePopulationAgeWeeks': [3,6], 'sourcePopulationAgeLocator': {'path': by_role['prior-population-context']['path'], 'field': 'scope.lifeStage', 'sha256': by_role['prior-population-context']['sha256']}, 'perRowAnimalAgeSexAndPhysicalCellMapping': None},
        'conflicts': [{'code': 'native_label_ambiguity', 'status': 'retained_unresolved', 'detail': 'Cerv Cell11 is repeated within both tables; Lomb has no Cell4 and does have Cell11. No label repair, physical-cell denominator or pair inferred.'},
            {'code': 'regional_observation_denominator', 'status': 'retained_unresolved', 'detail': 'Tables and Results report Cerv/Tho/Lomb12/6/10 (28); Figure5D caption prints12/8/6 (sum26). Raw rows and each attributed statement remain separate.'},
            {'code': 'iv_step_duration', 'status': 'retained_unresolved', 'detail': 'Results incremental IV steps100ms versus Figure5A caption50ms; no exact per-row duration assigned. IV peak0mV and inhibition+10mV remain their distinct reported contexts.'}],
        'scope': {'species': 'Mus musculus', 'observationUnit': 'one original worksheet measurement row',
            'identityKey': 'source version/file ID/hash/worksheet/source row, never native Cell alone', 'rnaOrMorphologyAssociation': 'not_established'},
        'interpretation': {'rawObservationsOnly': True, 'inhibitionPercentRecomputed': False, 'percentageClamped': False,
            'withinFilePairing': False, 'crossFilePairing': False, 'animalPooling': False, 'statisticalTestsOrSignificanceRecomputed': False,
            'clinicalInference': False, 'molecularClassification': False, 'crossSourceIdentity': False,
            'morphology': False, 'rawTraceSynthesis': False, 'internalStructure': False, 'atlasRegistration': False},
        'derivation': {'extractor': 'tools/build_crozat_nav_inhibition_information.py', 'inputManifest': MANIFEST, 'inputs': inputs,
            'sourceScriptsExecuted': False, 'networkRequestsDuringDerivation': 0, 'rowOrder': 'original meaningful worksheet rows; formatting-only cells excluded'},
        'tables': tables}


def receipt(root, payload):
    manifest = json.loads((root / MANIFEST).read_text())
    return {'receiptVersion': '0.1.0', 'status': 'exact_primary_source_derivation',
            'adapterId': 'crozat-nav-inhibition-information-0.1',
            'extractor': pin(root / EXTRACTOR, EXTRACTOR),
            'inputManifest': pin(root / MANIFEST, MANIFEST),
            'inputs': manifest['inputs'],
            'output': {'path': OUTPUT, 'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest()},
            'sourceTables': 2, 'measurementRows': 84, 'sourceObservationUnit': 'one original worksheet measurement row',
            'independentPhysicalCells': None, 'animalMappedRows': 0, 'pairedRows': 0,
            'newSourceProfiles': 0, 'newGeometryObjects': 0, 'newInternalObjects': 0, 'atlasRegistrations': 0,
            'sourceLicense': 'CC BY 4.0', 'rawNumericTextRetained': True, 'nativeLabelsRepaired': False,
            'sourceScriptsExecuted': False, 'networkRequestsDuringDerivation': 0,
            'primaryReportedDiscrepanciesRetained': ['native_label_ambiguity', 'regional_observation_denominator', 'iv_step_duration'],
            'actualBrowserValidated': False,
            'validationScope': 'deterministic source-byte and worksheet derivation; UI and file-download acceptance are separate'}


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--output', type=Path); parser.add_argument('--receipt', type=Path); parser.add_argument('--check', action='store_true')
    args = parser.parse_args(); output = args.output or args.root / OUTPUT
    receipt_path = args.receipt or args.root / RECEIPT
    payload = (json.dumps(build(args.root), ensure_ascii=False, indent=2) + '\n').encode()
    receipt_payload = (json.dumps(receipt(args.root, payload), ensure_ascii=False, indent=2) + '\n').encode()
    if args.check:
        if output.read_bytes() != payload: raise ValueError('derived output differs from exact-source replay')
        if receipt_path.read_bytes() != receipt_payload: raise ValueError('derivation receipt differs from exact-source replay')
    else:
        output.write_bytes(payload)
        receipt_path.write_bytes(receipt_payload)
    print(json.dumps({'status': 'PASS_CHECK' if args.check else 'DERIVED', 'output': str(output), 'bytes': len(payload),
                      'sha256': hashlib.sha256(payload).hexdigest(), 'receipt': pin(receipt_path, RECEIPT),
                      'tables': 2, 'sourceObservationRows': 84, 'pairingAdmissions': 0}))


if __name__ == '__main__': main()
