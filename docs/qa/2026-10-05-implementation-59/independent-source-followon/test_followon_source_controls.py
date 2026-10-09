"""Bounded follow-on numeric controls; no product, browser or network calls."""
import copy
import json
import unittest
import replay_followon_i59 as replay


class FollowonSourceControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = replay.literal.LiteralSource()
        cls.payload = json.loads(json.loads((replay.QA / 'actual-18-selected-native-row.json').read_bytes())['pairJSON'])

    def reject(self, mutate):
        value = copy.deepcopy(self.payload); mutate(value)
        with self.assertRaises(AssertionError): self.source.check_payload(value)

    def test_native000_source_rows_and_complete74(self):
        e = self.source.check_payload(self.payload)
        self.assertEqual(e['sourceFeatureRows'], [1, 2])
        self.assertEqual([e['currentProfile'][k] for k in ['nucleusCount','bothPositive','firstOnly','secondOnly','neitherPositive','firstTotalCount','secondTotalCount']], [74,28,46,0,0,4676,40])
        self.assertEqual(sum(p['nucleusCount'] for p in e['profiles']), 923)
        self.assertEqual(len(e['profiles']), 11)

    def test_selected_exact_source_row30_values_separate(self):
        e = self.source.check_payload(self.payload)['selectedNucleus']
        self.assertEqual(e['nativeId'], 'TCCAGGATCCGTTATT-1_1')
        self.assertEqual([e[k] for k in ['metadataRow','countsColumn','firstCount','secondCount']], [30,30,45,0])

    def test_filtered18_or_empty0_cannot_replace_complete_denominator(self):
        for count in [18, 0]: self.reject(lambda v: v['currentProfile'].update(nucleusCount=count))

    def test_modified_profile_partition_or_total_rejected(self):
        self.reject(lambda v: v['profiles'][8].update(bothPositive=27))
        self.reject(lambda v: v['profiles'][8].update(firstTotalCount=4675))

    def test_unknown_second_query_cannot_turn_into_foreign_gene_zero(self):
        self.reject(lambda v: v.update(secondFeature='NO_SUCH_SOURCE_FEATURE'))

    def test_selected_count_or_column_substitution_rejected(self):
        self.reject(lambda v: v['selectedNucleus'].update(firstCount=44))
        self.reject(lambda v: v['selectedNucleus'].update(countsColumn=31))

    def test_samechunk_inventory_or_animal_promotion_rejected(self):
        self.reject(lambda v: v['verification'].update(requestCount=2))
        self.reject(lambda v: v.update(independentAnimalDenominator=74))


if __name__ == '__main__':
    unittest.main(verbosity=2)
