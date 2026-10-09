"""Exact-source and fail-closed extraction checks; no shared files are changed."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / 'tools/build_crozat_nav_inhibition_information.py'
spec = importlib.util.spec_from_file_location('crozat_nav_extractor', TOOL)
extractor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extractor)


class CrozatNaVExactSourceTests(unittest.TestCase):
    def fixture(self, directory):
        root = Path(directory)
        manifest = json.loads((ROOT / extractor.MANIFEST).read_text())
        for relative in [extractor.MANIFEST, extractor.EXTRACTOR] + [row['path'] for row in manifest['inputs']]:
            destination = root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, destination)
        (root / 'data').mkdir(exist_ok=True)
        return root, manifest

    def test_exact_replay_and_receipt_are_deterministic(self):
        replay = extractor.build(ROOT)
        payload = (json.dumps(replay, ensure_ascii=False, indent=2) + '\n').encode()
        self.assertEqual(payload, (ROOT / extractor.OUTPUT).read_bytes())
        receipt = extractor.receipt(ROOT, payload)
        self.assertEqual(receipt, json.loads((ROOT / extractor.RECEIPT).read_text()))
        self.assertEqual(receipt['output']['sha256'], hashlib.sha256(payload).hexdigest())
        self.assertEqual(len(receipt['inputs']), 6)
        self.assertFalse(receipt['actualBrowserValidated'])

    def test_native_rows_labels_lexical_text_and_unresolved_identity(self):
        replay = extractor.build(ROOT)
        density, percent = replay['tables']
        self.assertEqual([row['observationRowCount'] for row in replay['tables']], [56, 28])
        self.assertEqual([row['sheet'] for row in replay['tables']], ['DATA R', 'DATA R'])
        self.assertEqual(density['observations'][2]['rawNumericLexical'], '-147.41999999999999')
        self.assertEqual(percent['rawRange']['maximum'], 143.1)
        self.assertEqual([group['sourceRows'] for group in density['duplicateNativeLabels']], [[12, 13], [40, 41]])
        self.assertEqual(percent['duplicateNativeLabels'][0]['sourceRows'], [12, 13])
        for table in replay['tables']:
            self.assertEqual(table['distinctRegionNativeLabelKeyCount'], 27)
            self.assertFalse(table['distinctKeysCountPhysicalCells'])
            self.assertFalse(any(row['raw']['Region'] == 'Lomb' and row['raw']['Cell'] == '4' for row in table['observations']))
            self.assertTrue(all(row['animalId'] is None and row['sourcePairId'] is None for row in table['observations']))

    def test_corrupted_primary_workbook_cannot_replay(self):
        with tempfile.TemporaryDirectory(prefix='crozat-nav-corrupt-') as directory:
            root, manifest = self.fixture(directory)
            source = next(row for row in manifest['inputs'] if row.get('fileId') == 56062562)
            path = root / source['path']
            path.write_bytes(path.read_bytes() + b'changed')
            with self.assertRaisesRegex(ValueError, 'source input pin mismatch'):
                extractor.build(root)

    def test_unknown_rights_or_wrong_official_file_md5_cannot_replay_even_with_updated_local_pin(self):
        for mode in ['rights', 'file-md5']:
            with self.subTest(mode=mode), tempfile.TemporaryDirectory(prefix='crozat-nav-rights-') as directory:
                root, manifest = self.fixture(directory)
                api_pin = next(row for row in manifest['inputs'] if row['role'] == 'official-version-api')
                path = root / api_pin['path']; api = json.loads(path.read_text())
                if mode == 'rights': api['license']['name'] = 'NOASSERTION'
                else: next(row for row in api['files'] if row['id'] == 56062562)['computed_md5'] = '0' * 32
                path.write_text(json.dumps(api))
                api_pin.update(extractor.pin(path, api_pin['path']))
                (root / extractor.MANIFEST).write_text(json.dumps(manifest))
                with self.assertRaisesRegex(ValueError, 'rights changed|asset mismatch'):
                    extractor.build(root)

    def test_repaired_or_clipped_derived_output_is_rejected_by_exact_source_check(self):
        for mode in ['repair-label', 'clip-percent', 'invent-pair']:
            with self.subTest(mode=mode), tempfile.TemporaryDirectory(prefix='crozat-nav-output-') as directory:
                root, _manifest = self.fixture(directory)
                original = extractor.build(root)
                payload = (json.dumps(original, ensure_ascii=False, indent=2) + '\n').encode()
                (root / extractor.RECEIPT).write_text(json.dumps(extractor.receipt(root, payload), ensure_ascii=False, indent=2) + '\n')
                changed = copy.deepcopy(original)
                if mode == 'repair-label': changed['tables'][0]['observations'][10]['raw']['Cell'] = '12'
                elif mode == 'clip-percent': changed['tables'][1]['observations'][1]['value'] = 100
                else: changed['tables'][0]['observations'][0]['sourcePairId'] = 'inferred'
                (root / extractor.OUTPUT).write_text(json.dumps(changed, ensure_ascii=False, indent=2) + '\n')
                result = subprocess.run(['python3', str(root / extractor.EXTRACTOR), '--root', str(root), '--check'], capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('derived output differs from exact-source replay', result.stderr)

    def test_missing_or_stale_derivation_receipt_cannot_pass(self):
        with tempfile.TemporaryDirectory(prefix='crozat-nav-receipt-') as directory:
            root, _manifest = self.fixture(directory)
            source = extractor.build(root); payload = (json.dumps(source, ensure_ascii=False, indent=2) + '\n').encode()
            (root / extractor.OUTPUT).write_bytes(payload)
            receipt = extractor.receipt(root, payload); receipt['measurementRows'] = 27
            (root / extractor.RECEIPT).write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
            result = subprocess.run(['python3', str(root / extractor.EXTRACTOR), '--root', str(root), '--check'], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('derivation receipt differs from exact-source replay', result.stderr)


if __name__ == '__main__':
    unittest.main()
