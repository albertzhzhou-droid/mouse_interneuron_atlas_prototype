"""Source-byte replay and independent literal OOXML/Methods checks; no network."""
from pathlib import Path
import hashlib
import importlib.util
import json
import tempfile
import unittest
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/source-candidates/garcia-ramirez-physiology-20261004'
DATA = ROOT / 'data/garcia-ramirez-adult-spinal-physiology-0.1.json'
RECEIPT = ROOT / 'data/garcia-ramirez-adult-spinal-physiology-derivation-receipt-0.1.json'
EXTRACTOR = ROOT / 'tools/extract_garcia_ramirez_physiology.py'
spec = importlib.util.spec_from_file_location('garcia_ramirez_extractor', EXTRACTOR)
extractor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extractor)
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def literal_word(cell):
    result = ''
    for node in cell.iter():
        if node.tag == '{' + NS['w'] + '}t': result += node.text or ''
        elif node.tag == '{' + NS['w'] + '}tab': result += '\t'
        elif node.tag in ('{' + NS['w'] + '}br', '{' + NS['w'] + '}cr'): result += '\n'
    return result

class GarciaRamirezExactSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.facts = json.loads(DATA.read_bytes())
        cls.receipt = json.loads(RECEIPT.read_bytes())
        with zipfile.ZipFile(SOURCE / 'data-sheet-1-file36551718.docx') as archive:
            cls.document_bytes = archive.read('word/document.xml')
        cls.document = ET.fromstring(cls.document_bytes)

    def test_deterministic_replay_is_byte_exact_for_facts_and_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            extractor.extract(SOURCE, out)
            self.assertEqual(DATA.read_bytes(), (out / DATA.name).read_bytes())
            self.assertEqual(RECEIPT.read_bytes(), (out / RECEIPT.name).read_bytes())

    def test_all_four_original_headers_properties_statistics_and_192_values_are_literal(self):
        original_tables = self.document.findall('w:body/w:tbl', NS)
        self.assertEqual(len(original_tables), 4)
        value_count = 0
        for table, facts in zip(original_tables, self.facts['tables']):
            matrix = [[literal_word(cell) for cell in row.findall('w:tc', NS)] for row in table.findall('w:tr', NS)]
            self.assertEqual(matrix[0], facts['sourceHeadersRaw'])
            self.assertEqual(hashlib.sha256(ET.tostring(table, encoding='utf-8')).hexdigest(), facts['ooxmlTableSha256'])
            for raw_row, row in zip(matrix[1:], facts['propertyRows']):
                self.assertEqual(raw_row[0], row['propertyLabelRaw'])
                self.assertEqual(raw_row[-2], row['reportedComparison']['statisticRaw'])
                self.assertEqual(raw_row[-1], row['reportedComparison']['pValueRaw'])
                for raw_value, value in zip(raw_row[1:-2], row['values']):
                    self.assertEqual(raw_value, value['raw'])
                    mean, sd = raw_value.split('±')
                    self.assertEqual(float(mean.strip().replace('−', '-')), value['mean'])
                    self.assertEqual(float(sd.strip()), value['standardDeviation'])
                    value_count += 1
        self.assertEqual(value_count, 192)

    def test_retained_methods_paragraphs_and_source_locations_match_original_xml(self):
        article = ET.fromstring((SOURCE / 'PMC9385948.fullText.xml').read_bytes())
        for statement in self.facts['sourceMethodStatements']:
            locator = statement['locator']
            section = next(section for section in article.findall('.//body//sec') if ''.join(section.find('title').itertext()) == locator['sectionTitleRaw'])
            paragraph = section.findall('p')[locator['paragraphOrdinalWithinSection'] - 1]
            self.assertEqual(''.join(paragraph.itertext()), statement['raw'])
            self.assertEqual(hashlib.sha256(ET.tostring(paragraph, encoding='utf-8')).hexdigest(), locator['elementSha256'])
        methods = self.facts['sourceMethodStatements'][0]['raw']
        for literal in ['51 Shox2', '6 Chx10', '60 of the Shox2', '28 of the mice']:
            self.assertIn(literal, methods)
        self.assertIn('mean ± SD', self.facts['sourceMethodStatements'][4]['raw'])

    def test_source_asset_rights_md5_and_all_sha_pins_are_independently_checked(self):
        for pin in self.facts['source']['inputPins']:
            raw = (SOURCE / pin['fileName']).read_bytes()
            self.assertEqual(len(raw), pin['bytes'])
            self.assertEqual(hashlib.sha256(raw).hexdigest(), pin['sha256'])
        metadata = json.loads((SOURCE / 'figshare-article-20428674.json').read_bytes())
        self.assertEqual(metadata['license']['url'], 'https://creativecommons.org/licenses/by/4.0/')
        file = next(row for row in metadata['files'] if row['id'] == 36551718)
        self.assertEqual(file['computed_md5'], file['supplied_md5'])
        self.assertEqual(hashlib.md5((SOURCE / 'data-sheet-1-file36551718.docx').read_bytes()).hexdigest(), file['computed_md5'])

    def test_one_changed_source_byte_is_rejected_before_any_output(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory); inputs = base / 'input'; inputs.mkdir()
            for name in extractor.PINS:
                (inputs / name).write_bytes((SOURCE / name).read_bytes())
            changed = bytearray((inputs / 'data-sheet-1-file36551718.docx').read_bytes())
            changed[-1] ^= 1
            (inputs / 'data-sheet-1-file36551718.docx').write_bytes(changed)
            with self.assertRaisesRegex(AssertionError, 'Source bytes changed'):
                extractor.extract(inputs, base / 'output')
            self.assertFalse((base / 'output').exists())

    def test_source_boundaries_preserve_unknown_units_and_aggregate_partition_denominator(self):
        for table in self.facts['tables']:
            self.assertEqual(sum(group['recordedObservationCount'] for group in table['groups']), 171)
            self.assertEqual(len(table['propertyRows']), 12)
            for row in table['propertyRows']:
                if row['propertyId'] in ['normalized_fahp_amplitude', 'fi_slope']:
                    self.assertIsNone(row['unitRaw'])
                    self.assertNotIn('[', row['propertyLabelRaw'])
        boundary = self.facts['studyScope']['interpretationBoundary']
        for field in ['newMolecularProfiles', 'newPhysicalCellRosterRows', 'newObservedGeometryObjects', 'sameCellCrossSourceJoins', 'registrations', 'M2Admission', 'M4Admission']:
            self.assertEqual(boundary[field], 0)
        self.assertFalse(boundary['sourceTracesAvailableInAdapterScope'])
        self.assertFalse(boundary['rawAbfFilesAvailableInAdapterScope'])
        self.assertIsNone(self.facts['studyScope']['recordedPool']['cellToAnimalMapping'])

if __name__ == '__main__': unittest.main()
