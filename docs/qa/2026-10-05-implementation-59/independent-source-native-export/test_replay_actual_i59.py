"""Counterfactual gates on actual captures; no browser, server or product imports."""
import copy
import csv
import io
import json
import unittest
from pathlib import Path
import replay_actual_i59 as replay


class SourceReplayControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = replay.LiteralSource()
        cls.capture = json.loads((replay.QA / 'actual-04-exact-nucleus-32.json').read_bytes())
        cls.payload = json.loads(cls.capture['pairJSON'])

    def reject(self, mutate):
        value = copy.deepcopy(self.payload)
        mutate(value)
        with self.assertRaises(AssertionError):
            self.source.check_payload(value)

    def test_actual_complete_source_expected_values(self):
        expected = self.source.check_payload(self.payload)
        self.assertEqual(sum(p['nucleusCount'] for p in expected['profiles']), 923)
        self.assertEqual(len(expected['profiles']), 11)
        self.assertEqual(expected['currentProfile']['nucleusCount'], 53)
        self.assertEqual([expected['currentProfile'][k] for k in ['bothPositive','firstOnly','secondOnly','neitherPositive']], [37,14,1,1])
        self.assertEqual(expected['selectedNucleus']['nativeId'], 'TCTGGCTTCACGAATC-1_1')
        self.assertEqual([expected['selectedNucleus'][k] for k in ['firstCount','secondCount','metadataRow','countsColumn']], [14,2,32,32])

    def test_profile_partition_and_total_mutation(self):
        self.reject(lambda v: v['profiles'][0].update(bothPositive=1))
        self.reject(lambda v: v['profiles'][0].update(firstTotalCount=-1))

    def test_current_profile_denominator_mutation(self):
        self.reject(lambda v: v['currentProfile'].update(nucleusCount=52))

    def test_selected_count_and_source_row_mutations(self):
        self.reject(lambda v: v['selectedNucleus'].update(firstCount=15))
        self.reject(lambda v: v['selectedNucleus'].update(countsColumn=31))

    def test_selected_foreign_key_rejected(self):
        self.reject(lambda v: v['selectedNucleus'].update(key='foreign-nucleus'))

    def test_wrong_feature_row_and_chunk_rejected(self):
        self.reject(lambda v: v.update(sourceFeatureRows=[23904,5471]))
        self.reject(lambda v: v['verification']['chunks'][0].update(chunk=0))

    def test_animal_geometry_and_runtime_original_promotions(self):
        self.reject(lambda v: v.update(independentAnimalDenominator=923))
        self.reject(lambda v: v['interpretation'].update(geometry=True))
        self.reject(lambda v: v.update(originalSourceFetchedInBrowser=True))

    def test_csv_complete_53_rows_and_corruption_controls(self):
        fields = replay.HEADERS
        expected_rows = self.source.csv_rows(self.payload)
        def encoded(rows):
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=fields)
            writer.writeheader();writer.writerows(rows)
            return output.getvalue().encode()
        self.assertEqual(len(self.source.check_csv_bytes(encoded(expected_rows), self.payload)), 53)
        bad = copy.deepcopy(expected_rows);bad[0]['first_raw_count'] = '999999'
        with self.assertRaises(AssertionError): self.source.check_csv_bytes(encoded(bad), self.payload)
        with self.assertRaises(AssertionError): self.source.check_csv_bytes(encoded(expected_rows[:-1]), self.payload)
        bad = copy.deepcopy(expected_rows);bad.reverse()
        with self.assertRaises(AssertionError): self.source.check_csv_bytes(encoded(bad), self.payload)

    def test_same_chunk_exact_pair_uses_source_rows_without_new_denominator(self):
        same = self.source.expected('Xkr4','Rp1',self.payload['currentProfile']['profileId'],None)
        self.assertEqual(same['sourceFeatureRows'], [1,5])
        self.assertEqual(sum(p['nucleusCount'] for p in same['profiles']), 923)
        self.assertEqual(len(same['profiles']), 11)


if __name__ == '__main__':
    unittest.main(verbosity=2)
