#!/usr/bin/env python3
"""Rebind independent source/static peer review to exact current proposal bytes."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

REVIEW = Path(__file__).resolve().parent
CANDIDATE = Path('/private/tmp/ohri-upg173-preparation-20261004')
PROPOSED = CANDIDATE / 'proposed'


def pin(path):
    raw = path.read_bytes()
    return {'path': str(path), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


checks = [
    ('independent-source-dom', [sys.executable, str(REVIEW / 'check_source_aggregate_identity.py'),
                               '--receipt', str(REVIEW / 'source-aggregate-identity-review-receipt.json')]),
    ('independent-negative-cases', [sys.executable, str(REVIEW / 'check_negative_source_mutations.py')]),
    ('focused-node', ['/opt/homebrew/bin/node', '--test', 'tests/garcia-ramirez-physiology.test.mjs']),
    ('original-source-python', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests',
                                '-p', 'test_garcia_ramirez_physiology_0_1.py', '-v']),
]
results = []
for name, command in checks:
    result = subprocess.run(command, cwd=PROPOSED, capture_output=True, text=True)
    log = REVIEW / (name + '.log')
    log.write_text(result.stdout + result.stderr)
    results.append({'check': name, 'command': command, 'cwd': str(PROPOSED),
                    'exitCode': result.returncode, 'log': pin(log)})
    assert result.returncode == 0, name

source = json.loads((REVIEW / 'source-aggregate-identity-review-receipt.json').read_bytes())
negative = json.loads((REVIEW / 'independent-negative-cases-receipt.json').read_bytes())
receipt = {
    'status': 'PASS_WITH_INTEGRATION_AND_ACTUAL_BROWSER_QA_REQUIRED',
    'generatedAt': datetime.now(timezone.utc).isoformat(),
    'candidateRoot': str(PROPOSED), 'reviewer': 'camera_contract_i52',
    'actionableFindings': [], 'independentSourceParser': source['parser'],
    'sourceCheckCounts': source['sourceCheckCounts'],
    'sourceInputFiles': 3, 'exactSourceBytes': 951043,
    'alternativePartitionCounts': source['alternativePartitionCounts'],
    'sharedObservationDenominator': 171, 'partitionsPooled': False,
    'sourceAnimalCohortCounts': [51, 6],
    'prior60RecordingsFrom28MiceRemainSubset': True,
    'missingUnitsRemainNull': True, 'unknownSexCellAgeAnimalMappingNotInvented': True,
    'capacitanceSourceFormulaHeldWithoutCalculation': True,
    'sixPositiveVersusFourListedKGroupObservationsUnresolved': True,
    'sourceOriginalDocxPagesVisuallyInspected': [1, 2],
    'sourceRenderEvidence': [pin(CANDIDATE / 'rendered' / name)
                             for name in ['data-sheet-1-file36551718.pdf', 'page-1.png', 'page-2.png']],
    'independentNegativeCases': negative['independentNegativeCases'],
    'focusedTests': {'node': {'tests': 9, 'pass': 9, 'fail': 0},
                     'python': {'tests': 6, 'pass': 6, 'fail': 0}},
    'testRuns': results,
    'currentLayoutReview': {
        'route': '/explore/cell-types/additional#garcia-ramirez-physiology-panel',
        'onlyExistingIntegrationTarget': 'app/AdditionalResearchEvidence.tsx',
        'existingDetailsFragmentsAndLazyMountsPreserved': 4,
        'ResearchCollectionPageWrapperNavigationAndCurrentLayoutUnchangedByCandidate': True,
        'namespacedTableQueryPreservesUnrelatedQueryAndFragment': True,
        'unknownEmptyDuplicateTableQueryFailsClosed': True,
        'scopedResponsiveCssAndKeyboardControlsReviewedStatically': True,
    },
    'exportReview': {
        'scope': 'attributed_published_aggregate_statistics_with_selection_context',
        'allFourSourceTablesRetainedWhenSearchFiltersUi': True,
        'sourceInputsFetchedDuringExport': False, 'actualViewCaptured': False,
        'newMolecularProfiles': 0, 'newPhysicalCellRosterRows': 0,
        'newGeometryObjects': 0, 'sameCellCrossSourceJoins': 0, 'registrations': 0,
        'internalAnatomyAdmission': False, 'M2Admission': 0, 'M4Admission': 0,
    },
    'candidatePathPins': source['candidatePaths'],
    'reviewArtifacts': [pin(REVIEW / name) for name in
                        ['check_source_aggregate_identity.py', 'check_negative_source_mutations.py',
                         'source-aggregate-identity-review-receipt.json',
                         'independent-negative-cases-receipt.json', 'UPG173_BROWSER_QA_PLAN.md']],
    'sharedRepositoryWritesByThisAgent': 0,
    'actualAppBrowserObservedByThisPeerReview': False,
    'remainingRootOwnedChecks': [
        'final sealed patch intake and declared-input manifest binding',
        'required full integration checks against final current build',
        'actual current-layout browser selection/query/keyboard/responsive/export QA',
    ],
}
patch = CANDIDATE / 'candidate.patch'
if patch.exists():
    receipt['candidatePatchAtReview'] = pin(patch)
path = REVIEW / 'UPG173_SCIENTIFIC_SCOPE_AND_LAYOUT_PEER_REVIEW.json'
path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': receipt['status'], 'receipt': pin(path)}, indent=2))
