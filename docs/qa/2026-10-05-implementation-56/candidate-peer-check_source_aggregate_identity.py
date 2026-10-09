#!/usr/bin/env python3
"""Independent DOM replay of the original DOCX/article and proposed aggregate facts.

Uses xml.dom.minidom, never imports the proposed extractor or JavaScript adapter.
Writes only an explicitly chosen review receipt, outside the shared repository.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from xml.dom import Node, minidom
from zipfile import ZipFile

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
SOURCE_REL = 'data/source-candidates/garcia-ramirez-physiology-20261004'
PINS = {
    'data-sheet-1-file36551718.docx': (687234, '7ef955d8378020d95eeff07be83ad0c602699337fdb89b79f6796c3e96b845e2'),
    'PMC9385948.fullText.xml': (228780, 'b997e9c1565ba55dd361dcf47ac315883a9d1108c55d74c48db87f70f8bb7517'),
    'figshare-article-20428674.json': (35029, 'ea6183d6e34233889e2900b14d980ad61edaf28f616052291bfaefac2406d865'),
}
PREFIX = 'garcia-ramirez-2022:aggregate-physiology:'
EXPECTED_COUNTS = [[143, 28], [88, 49, 24, 10], [23, 11, 68, 69], [15, 20, 32, 25, 27, 52]]
PROPOSED_PATHS = [
    'app/AdditionalResearchEvidence.tsx', 'app/GarciaRamirezPhysiologyPanel.tsx',
    'app/garcia-ramirez-physiology.js', 'app/garcia-ramirez-physiology.d.ts',
    'app/garcia-ramirez-physiology.css',
    'data/garcia-ramirez-adult-spinal-physiology-0.1.json',
    'data/garcia-ramirez-adult-spinal-physiology-derivation-receipt-0.1.json',
    *[SOURCE_REL + '/' + name for name in PINS],
    SOURCE_REL + '/exact-source-acquisition-receipt.json',
    SOURCE_REL + '/figshare-metadata-acquisition-receipt.json',
    'tools/extract_garcia_ramirez_physiology.py',
    'schemas/garcia-ramirez-adult-spinal-physiology-0.1.schema.json',
    'scripts/validate-garcia-ramirez-physiology-0.1.mjs',
    'tests/garcia-ramirez-physiology.test.mjs',
    'tests/test_garcia_ramirez_physiology_0_1.py',
]


def direct(node, local, namespace=None):
    return [child for child in node.childNodes if child.nodeType == Node.ELEMENT_NODE
            and child.localName == local and (namespace is None or child.namespaceURI == namespace)]


def content(node):
    return ''.join(child.data if child.nodeType in (Node.TEXT_NODE, Node.CDATA_SECTION_NODE)
                   else content(child) for child in node.childNodes)


def word_text(node):
    value = ''
    for child in node.childNodes:
        if child.nodeType != Node.ELEMENT_NODE:
            continue
        if child.namespaceURI == W and child.localName == 't':
            value += content(child)
        elif child.namespaceURI == W and child.localName == 'tab':
            value += '\t'
        elif child.namespaceURI == W and child.localName in ('br', 'cr'):
            value += '\n'
        else:
            value += word_text(child)
    return value


def locator(value, table, row, column):
    assert value == {'fileName': 'data-sheet-1-file36551718.docx',
                     'ooxmlMember': 'word/document.xml', 'tableOrdinal': table,
                     'rowOneBased': row, 'columnOneBased': column}, value


def file_pin(path, relative):
    raw = path.read_bytes()
    return {'path': relative, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def verify(root, facts_path=None):
    source = root / SOURCE_REL
    facts_path = facts_path or root / 'data/garcia-ramirez-adult-spinal-physiology-0.1.json'
    facts = json.loads(facts_path.read_bytes())
    for name, (size, sha) in PINS.items():
        raw = (source / name).read_bytes()
        assert len(raw) == size and hashlib.sha256(raw).hexdigest() == sha, name
    metadata = json.loads((source / 'figshare-article-20428674.json').read_bytes())
    source_file = next(row for row in metadata['files'] if row['id'] == 36551718)
    assert source_file['size'] == PINS['data-sheet-1-file36551718.docx'][0]
    assert source_file['computed_md5'] == source_file['supplied_md5'] == 'cd540639b14fda1fd1149b235384b795'
    assert hashlib.md5((source / 'data-sheet-1-file36551718.docx').read_bytes()).hexdigest() == source_file['computed_md5']
    assert metadata['license']['url'] == 'https://creativecommons.org/licenses/by/4.0/'
    with ZipFile(source / 'data-sheet-1-file36551718.docx') as archive:
        assert archive.testzip() is None
        document_bytes = archive.read('word/document.xml')
    assert hashlib.sha256(document_bytes).hexdigest() == 'd11516b563f118496a7201c776da953eecf72a4f4d4b314562615acf854e5ebf'
    doc = minidom.parseString(document_bytes)
    for tag in ('ins', 'del', 'commentRangeStart', 'commentReference'):
        assert len(doc.getElementsByTagNameNS(W, tag)) == 0
    body = doc.getElementsByTagNameNS(W, 'body')[0]
    blocks = [node for node in body.childNodes if node.nodeType == Node.ELEMENT_NODE and node.localName != 'sectPr']
    original_tables = direct(body, 'tbl', W)
    assert len(original_tables) == len(facts['tables']) == 4
    counters = {'rawHeaders': 0, 'rawPropertyLabels': 0, 'rawMeanSdCells': 0, 'rawStatisticalCells': 0,
                'exactCellLocators': 0, 'unprintedUnitRows': 0, 'sourceMethodStatements': 0}
    for table_index, (original, table) in enumerate(zip(original_tables, facts['tables']), 1):
        assert blocks.index(original) + 1 == table['ooxmlBodyBlockOneBased']
        assert word_text(blocks[blocks.index(original) - 1]) == table['captionRaw']
        matrix = [[word_text(cell) for cell in direct(row, 'tc', W)] for row in direct(original, 'tr', W)]
        assert len(matrix) == 13
        assert matrix[0] == table['sourceHeadersRaw']
        counters['rawHeaders'] += len(matrix[0])
        observed = []
        for column, (header, group) in enumerate(zip(matrix[0][1:-2], table['groups']), 2):
            match = re.fullmatch(r'(.*?)\s*\(n=(\d+)\)', header)
            assert match and match[1].strip() == group['labelRaw'] and header == group['headerRaw']
            assert int(match[2]) == group['recordedObservationCount']
            locator(group['countLocator'], table_index, 1, column)
            observed.append(int(match[2]))
            assert group['countUnit'] == 'source_recorded_neuronal_observations'
            assert group['physicalCellRosterAvailable'] is False
        assert observed == EXPECTED_COUNTS[table_index - 1] and sum(observed) == 171
        assert table['sourceRecordedPoolDenominatorId'] == PREFIX + 'recorded-pool-171'
        assert table['groupCountSum'] == 171
        assert len(table['propertyRows']) == 12
        for row_index, (raw, row) in enumerate(zip(matrix[1:], table['propertyRows']), 2):
            assert len(raw) == len(matrix[0])
            assert raw[0] == row['propertyLabelRaw']
            locator(row['propertyLocator'], table_index, row_index, 1)
            counters['rawPropertyLabels'] += 1
            counters['exactCellLocators'] += 1
            unit = re.search(r'\[([^\]]+)\]', raw[0])
            assert row['unitRaw'] == (unit[1] if unit else None)
            if not unit:
                assert row['propertyId'] in ('normalized_fahp_amplitude', 'fi_slope')
                assert isinstance(row['unitNotPrintedReason'], str)
                counters['unprintedUnitRows'] += 1
            assert len(raw[1:-2]) == len(row['values'])
            for column, (raw_value, value) in enumerate(zip(raw[1:-2], row['values']), 2):
                assert raw_value == value['raw']
                mean, sd = raw_value.split('±')
                assert float(mean.strip().replace('−', '-')) == value['mean']
                assert float(sd.strip()) == value['standardDeviation']
                assert value['uncertaintyKind'] == 'source_reported_standard_deviation'
                locator(value['locator'], table_index, row_index, column)
                counters['rawMeanSdCells'] += 1
                counters['exactCellLocators'] += 1
            comparison = row['reportedComparison']
            assert raw[-2] == comparison['statisticRaw'] and raw[-1] == comparison['pValueRaw']
            locator(comparison['statisticLocator'], table_index, row_index, len(raw) - 1)
            locator(comparison['pValueLocator'], table_index, row_index, len(raw))
            assert float(raw[-1].strip().removeprefix('*')) == comparison['pValue']
            assert raw[-1].strip().startswith('*') == comparison['asteriskRaw']
            counters['rawStatisticalCells'] += 2
            counters['exactCellLocators'] += 2
    article = minidom.parseString((source / 'PMC9385948.fullText.xml').read_bytes())
    sections = article.getElementsByTagName('sec')
    for statement in facts['sourceMethodStatements']:
        loc = statement['locator']
        candidates = [section for section in sections if direct(section, 'title')
                      and content(direct(section, 'title')[0]) == loc['sectionTitleRaw']]
        assert len(candidates) == 1
        paragraph = direct(candidates[0], 'p')[loc['paragraphOrdinalWithinSection'] - 1]
        assert content(paragraph) == statement['raw']
        assert (candidates[0].getAttribute('id') or None) == loc['sectionId']
        counters['sourceMethodStatements'] += 1
    methods = {s['locator']['sectionTitleRaw']: s['raw'] for s in facts['sourceMethodStatements']}
    assert '51 Shox2::Cre' in methods['Materials and methods'] and '6 Chx10-eGFP' in methods['Materials and methods']
    assert '60 of the Shox2 neurons (from 28 of the mice) included in the new analyses' in methods['Materials and methods']
    assert 'adult mice (8–25 weeks postnatal)' in methods['Spinal cord preparations']
    assert 'segments L2–5' in methods['Spinal cord preparations']
    assert '143 Shox2 neurons and 28 Chx10 neurons' in methods['Measurement and calculation of passive and active membrane properties']
    assert 'Cm = Rin/τ' in methods['Measurement and calculation of passive and active membrane properties']
    assert 'All results are presented as mean ± SD' in methods['Statistical analyses']
    firing_table = next(table for table in article.getElementsByTagName('table-wrap') if table.getAttribute('id') == 'T1')
    firing_headers = firing_table.getElementsByTagName('thead')[0].getElementsByTagName('tr')[1]
    firing_cells = direct(firing_headers, 'th')
    firing_counts = []
    for value in facts['studyScope']['firingComposition']:
        loc = value['locator']
        assert loc['tableId'] == 'T1' and loc['headerRowOneBased'] == 2
        raw = content(firing_cells[loc['columnOneBased'] - 1]).strip()
        assert raw == value['headerRaw']
        match = re.fullmatch(r'(Shox2|Chx10) \(n = (\d+)\)', raw)
        assert match and match[1] == value['reporterPopulationRaw']
        assert int(match[2]) == value['recordedObservationCount']
        firing_counts.append(int(match[2]))
    assert firing_counts == [78, 10, 36, 13, 21, 3, 8, 2]
    whole_body = content(article.getElementsByTagName('body')[0])
    assert not re.search(r'\b(sex|male|female)\b', whole_body, re.I)
    pool = facts['studyScope']['recordedPool']
    assert pool['value'] == 171 and pool['Shox2'] == 143 and pool['Chx10'] == 28
    assert pool['unit'] == 'source_recorded_neuronal_observations'
    assert pool['independentAnimalCount'] is None and pool['cellToAnimalMapping'] is None
    assert facts['studyScope']['sex'] is None
    assert [cohort['reportedMice'] for cohort in facts['studyScope']['animalCohorts']] == [51, 6]
    assert facts['studyScope']['priorStudyReuse']['isSubsetOfCurrentShox2Cohort'] is True
    positive = next(d for d in facts['rawSourceDiscrepancies'] if d['kind'] == 'unresolved_reported_subgroup_total')
    assert positive['reportedChx10Positive'] == 6 and positive['kListedChx10PositiveCounts'] == [1, 2, 1]
    assert positive['listedPositiveCountSum'] == 4
    immune = methods['Further validation of clustering with immunohistochemistry identified cells']
    assert '6 Shox2 neurons expressed Chx10' in immune
    assert 'k2 (1 neuron), k3 (2 neurons), and k4 (1 neuron)' in immune
    boundary = facts['studyScope']['interpretationBoundary']
    for key in ('newMolecularProfiles', 'newPhysicalCellRosterRows', 'newObservedGeometryObjects', 'sameCellCrossSourceJoins', 'registrations', 'M2Admission', 'M4Admission'):
        assert boundary[key] == 0
    for key in ('sourceTracesAvailableInAdapterScope', 'rawAbfFilesAvailableInAdapterScope', 'physiologyGroupsAreMolecularCellTypes', 'clusterLabelsAreGeneticLineage', 'adultAtlasCoordinatesEstablished'):
        assert boundary[key] is False
    assert counters == {'rawHeaders': 28, 'rawPropertyLabels': 48, 'rawMeanSdCells': 192,
                        'rawStatisticalCells': 96, 'exactCellLocators': 336,
                        'unprintedUnitRows': 8, 'sourceMethodStatements': 7}
    return counters


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path('/private/tmp/ohri-upg173-preparation-20261004/proposed'))
    parser.add_argument('--facts', type=Path)
    parser.add_argument('--receipt', type=Path)
    args = parser.parse_args()
    counts = verify(args.root, args.facts)
    receipt = {'review': 'independent_original_source_aggregate_identity', 'status': 'PASS',
               'parser': 'xml.dom.minidom; no candidate extractor or adapter imported',
               'sourceInputFiles': 3, 'exactSourceBytes': sum(pin[0] for pin in PINS.values()),
               'sourceCheckCounts': counts, 'alternativePartitionCounts': EXPECTED_COUNTS,
               'sharedObservationDenominator': 171, 'partitionsPooled': False,
               'perCellRosterCreated': False, 'newProfiles': 0, 'newGeometryObjects': 0,
               'sameCellJoins': 0, 'registrations': 0, 'sharedRepositoryWrites': 0,
               'candidatePaths': [file_pin(args.root / path, path) for path in PROPOSED_PATHS]}
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': receipt['status'], **counts}))


if __name__ == '__main__':
    main()
