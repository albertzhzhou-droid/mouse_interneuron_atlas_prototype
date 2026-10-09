#!/usr/bin/env python3
"""Negative controls for the independent original-source DOM replay."""
import importlib.util
import json
from pathlib import Path
import tempfile

REVIEW = Path(__file__).resolve().parent
ROOT = Path('/private/tmp/ohri-upg173-preparation-20261004/proposed')
spec = importlib.util.spec_from_file_location('peer_replay', REVIEW / 'check_source_aggregate_identity.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
original = json.loads((ROOT / 'data/garcia-ramirez-adult-spinal-physiology-0.1.json').read_bytes())
mutations = [
    ('raw_mean_sd_cell_changed', lambda f: f['tables'][0]['propertyRows'][0]['values'][0].update(raw='-48.3 ± 6', mean=-48.3)),
    ('unprinted_unit_inferred', lambda f: f['tables'][0]['propertyRows'][9].update(unitRaw='mV')),
    ('source_statistic_rewritten', lambda f: f['tables'][0]['propertyRows'][0]['reportedComparison'].update(statisticRaw='U=1973')),
    ('source_locator_shifted', lambda f: f['tables'][0]['propertyRows'][0]['values'][0]['locator'].update(rowOneBased=3)),
    ('partitions_pooled_to_684', lambda f: f['studyScope']['recordedPool'].update(value=684)),
    ('observations_promoted_to_animals', lambda f: f['studyScope']['recordedPool'].update(independentAnimalCount=171)),
    ('aggregate_group_promoted_to_cell_roster', lambda f: f['tables'][0]['groups'][0].update(physicalCellRosterAvailable=True)),
    ('unknown_sex_filled', lambda f: f['studyScope'].update(sex='female')),
    ('registration_admitted', lambda f: f['studyScope']['interpretationBoundary'].update(registrations=1)),
    ('positive_discrepancy_silently_repaired', lambda f: f['rawSourceDiscrepancies'][1].update(kListedChx10PositiveCounts=[1, 2, 3], listedPositiveCountSum=6)),
    ('firing_count_changed', lambda f: f['studyScope']['firingComposition'][0].update(recordedObservationCount=79)),
]
cases = []
with tempfile.TemporaryDirectory(dir=REVIEW) as directory:
    path = Path(directory) / 'mutated-facts.json'
    for name, mutate in mutations:
        facts = json.loads(json.dumps(original))
        mutate(facts)
        path.write_text(json.dumps(facts))
        try:
            module.verify(ROOT, path)
        except AssertionError:
            cases.append({'name': name, 'rejected': True})
        else:
            raise AssertionError('Independent replay accepted ' + name)
receipt = {'status': 'PASS', 'independentNegativeCases': len(cases), 'cases': cases,
           'candidateExtractorImported': False, 'candidateAdapterImported': False,
           'sharedRepositoryWrites': 0}
(REVIEW / 'independent-negative-cases-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'status': 'PASS', 'independentNegativeCases': len(cases)}))
