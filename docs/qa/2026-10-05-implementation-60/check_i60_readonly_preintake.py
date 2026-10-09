#!/usr/bin/env python3
"""Read-only I60 intake gate. Replays unified hunks in memory; never applies/writes.

Output is JSON on stdout. Redirect it only to an independently owned temp path.
No product helper imports, subprocess, git command, builder, network or browser.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re


DEFAULT_ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
DEFAULT_CANDIDATE = Path('/private/tmp/ohri-i60-molecular-comparison-bookmark-candidate')
DEFAULT_PEER = Path('/private/tmp/ohri-i60-peer-independent-review/I60_INDEPENDENT_SOURCE_HISTORY_REVIEW.json')
PATCH_NAME = 'I60_MOLECULAR_COMPARISON_BOOKMARK_CANDIDATE.patch'
SEALED_PINS = {
    'patch': {'bytes': 41707, 'sha256': 'c5fb662612b47908209bd8f77fa3be3fc0c35164577ed70465a3f69a10d89020'},
    'ownership': {'bytes': 6495, 'sha256': 'b7119dfc9d92a44b6d8fb6379df54682d343bbb140633e1b1694ecfcd17f7f37'},
    'seal': {'bytes': 8493, 'sha256': '40e544b05981b0678149ab08b0e6725afd0df5ab84bb8afbcf01b3ebc3567b2d'},
    'peer': {'bytes': 14458, 'sha256': '3057be45bce7b4a2286d6765ccd4c7c12928f0ccfff96f08fa22b2e9c3a50852'},
}
FIXTURE_KEYS = [
    'molecular_profile:alkaslasi-2021:GSE167597:I1',
    'molecular_profile:alkaslasi-2021:GSE167597:I2',
    'molecular_profile:hayashi-2018:GSE108788:cluster-1',
    'molecular_profile:sathyamurthy-2018:DE-1',
    'molecular_profile:haring-2018:GSE103840:Gaba1',
    'molecular_profile:cano.gomez.p56.chol_in.sha256.e34a2e59ec5151d120eff617',
]


def pin(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def file_pin(path):
    return pin(path.read_bytes())


def require(condition, detail):
    if not condition:
        raise ValueError(detail)


def patch_blocks(data):
    text = data.decode('utf-8')
    blocks = {}
    for block in re.split(r'(?=^diff --git )', text, flags=re.M):
        if not block:
            continue
        lines = block.splitlines(keepends=True)
        match = re.fullmatch(r'diff --git a/(\S+) b/(\S+)\n', lines[0])
        require(match is not None and match[1] == match[2], 'Unexpected patch target header')
        path = match[1]
        require(path not in blocks, f'Duplicate patch target: {path}')
        require(not path.startswith('/') and '..' not in Path(path).parts, 'Nonlocal patch target')
        blocks[path] = lines
    return blocks


def replay_hunks(original, lines):
    """Exact context/deletion matching plus old/new hunk coordinates, in memory."""
    source = original.decode('utf-8').splitlines(keepends=True)
    result, old_cursor, index, hunks = [], 0, 1, 0
    while index < len(lines):
        if not lines[index].startswith('@@ '):
            index += 1
            continue
        match = re.match(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@', lines[index])
        require(match is not None, 'Invalid hunk coordinates')
        old_start, old_count = int(match[1]), int(match[2] or 1)
        new_start, new_count = int(match[3]), int(match[4] or 1)
        old_position = 0 if old_start == 0 else old_start - 1
        new_position = 0 if new_start == 0 else new_start - 1
        require(old_position >= old_cursor and old_position <= len(source), 'Old hunk outside source')
        result.extend(source[old_cursor:old_position])
        require(len(result) == new_position, 'New hunk coordinate does not match replay')
        old_cursor = old_position
        consumed_old = produced_new = 0
        index += 1
        while index < len(lines) and not lines[index].startswith('@@ '):
            line = lines[index]
            require(line[:1] in (' ', '+', '-'), 'Unexpected hunk line or missing newline marker')
            payload = line[1:]
            if line[:1] in (' ', '-'):
                require(old_cursor < len(source) and source[old_cursor] == payload,
                        f'Patch source/context mismatch at source line {old_cursor + 1}')
                old_cursor += 1
                consumed_old += 1
            if line[:1] in (' ', '+'):
                result.append(payload)
                produced_new += 1
            index += 1
        require(consumed_old == old_count and produced_new == new_count, 'Hunk declared length mismatch')
        hunks += 1
    require(hunks > 0, 'Patch target has no hunks')
    result.extend(source[old_cursor:])
    return ''.join(result).encode('utf-8'), hunks


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--root', type=Path, default=DEFAULT_ROOT)
    args.add_argument('--candidate', type=Path, default=DEFAULT_CANDIDATE)
    args.add_argument('--peer', type=Path, default=DEFAULT_PEER)
    options = args.parse_args()
    root, candidate, peer_path = options.root, options.candidate, options.peer
    artifact_paths = {
        'patch': candidate / PATCH_NAME,
        'ownership': candidate / 'ownership.json',
        'seal': candidate / 'qa/I60_CANDIDATE_SEAL_AND_VALIDATION_RECEIPT.json',
        'peer': peer_path,
    }
    artifact_pins = {key: {'path': str(path), **file_pin(path)} for key, path in artifact_paths.items()}
    for key, expected in SEALED_PINS.items():
        require({field: artifact_pins[key][field] for field in expected} == expected,
                f'Sealed artifact stale: {key}')
    ownership = json.loads(artifact_paths['ownership'].read_bytes())
    seal = json.loads(artifact_paths['seal'].read_bytes())
    peer = json.loads(peer_path.read_bytes())
    require(peer['status'] == 'PASS_SCOPED_READONLY_PEER_REVIEW' and peer['reviewFindings'] == [],
            'Peer is not a finding-free scoped PASS')
    for name, key in [('sealActual', 'seal'), ('ownershipActual', 'ownership'), ('patchActual', 'patch')]:
        require(peer['candidateEpoch'][name] == SEALED_PINS[key], f'Peer epoch mismatch: {key}')
    targets = ownership['integrationTargets']
    require(len(targets) == ownership['ownedPathCount'] == 4 and seal['files'] == targets,
            'Four-target seal/ownership mismatch')
    blocks = patch_blocks(artifact_paths['patch'].read_bytes())
    require(list(blocks) == [target['path'] for target in targets], 'Patch target set/order mismatch')
    target_checks = []
    negative_controls = []
    for target in targets:
        path = target['path']
        current_path, proposed_path = root / path, candidate / 'proposed' / path
        if target['before'] is None:
            require(target['operation'] == 'add' and not os.path.lexists(current_path),
                    f'New target is already present, including dangling symlink: {path}')
            original = b''
            require('--- /dev/null\n' in blocks[path], f'Add target lacks /dev/null: {path}')
        else:
            require(target['operation'] == 'modify' and file_pin(current_path) == target['before'],
                    f'Current preimage stale: {path}')
            original = current_path.read_bytes()
        require(file_pin(proposed_path) == target['after'], f'Proposed file stale/missing: {path}')
        replayed, hunk_count = replay_hunks(original, blocks[path])
        require(pin(replayed) == target['after'] and replayed == proposed_path.read_bytes(),
                f'In-memory patch output differs from sealed proposal: {path}')
        target_checks.append({**target, 'rootLexists': os.path.lexists(current_path),
                              'preimageOrNewAbsenceMatched': True, 'proposalMatched': True,
                              'unifiedHunksReplayedInMemory': hunk_count, 'replayAfterMatched': True})
        if original:
            # A real context line in the first hunk is altered only in this local memory fixture.
            line = next(line for line in blocks[path] if line.startswith(' '))
            mutated = original.replace(line[1:].encode(), b'__I60_COUNTERFACTUAL_CONTEXT__\n', 1)
            require(mutated != original, 'Counterfactual did not alter the preimage')
            try:
                replay_hunks(mutated, blocks[path])
            except ValueError:
                negative_controls.append({'name': 'altered_actual_preimage_context', 'rejected': True,
                                          'inMemoryOnly': True})
            else:
                raise ValueError('Altered actual preimage unexpectedly replayed')
    retained = []
    for item in ownership['scientificInputPinsRetained']:
        expected = {key: item[key] for key in ['bytes', 'sha256']}
        require(file_pin(root / item['path']) == expected, f'Scientific input stale: {item["path"]}')
        retained.append({**item, 'currentRootMatched': True})
    layout = []
    for item in ownership['currentReadOnlyLayoutPins']:
        actual = file_pin(root / item['path'])
        require(actual == item['current'], f'Current layout/provider pin changed: {item["path"]}')
        layout.append({'path': item['path'], **actual, 'currentRootMatched': True, 'ownedByI60': False})
    extra_paths = ['app/site-navigation.ts', 'app/layout.tsx', 'app/globals.css',
                   'tools/build_research_iteration_manifest_2_91.mjs',
                   'tools/build_research_renderer_runtime_inputs.mjs',
                   'tools/run_current_research_tests.mjs', 'package.json',
                   'data/research-iteration-manifest-2.91.json',
                   'data/research-renderer-runtime-inputs-2.91.json']
    context = [{'path': path, **file_pin(root / path)} for path in extra_paths]
    route = (root / 'app/ResearchRoutePage.tsx').read_text()
    collection = (root / 'app/ResearchCollectionPage.tsx').read_text()
    navigation = (root / 'app/site-navigation.ts').read_text()
    require('"/explore/cell-types/compare": { id: "type-compare", title: "Profile comparison"' in route,
            'Dedicated current route changed')
    require('case "type-compare": content = <MolecularConcordanceWorkbench />;' in collection,
            'Dedicated workbench mount changed')
    require('href: "/explore/cell-types/compare", label: "Compare sources"' in navigation,
            'Current navigation entry changed')
    manifest = json.loads((root / 'data/research-iteration-manifest-2.91.json').read_bytes())
    runtime = json.loads((root / 'data/research-renderer-runtime-inputs-2.91.json').read_bytes())
    manifest_paths = {item['path'] for item in manifest['authoritativeInputs']}
    runtime_paths = {item['path'] for item in runtime['authoritativeInputs']}
    require(set(blocks) & manifest_paths == {'app/MolecularConcordanceWorkbench.tsx'},
            'Current canonical target membership changed before intake')
    require(not set(blocks) & runtime_paths, 'I60 targets unexpectedly in renderer runtime allowlist')
    builder = (root / 'tools/build_research_iteration_manifest_2_91.mjs').read_text()
    family_lines = [line for line in builder.splitlines() if '["app", /' in line or '["tests", /' in line]
    require(len(family_lines) == 2 and all('molecular-concordance|MolecularConcordance' in line
                                        for line in family_lines), 'Canonical family admission changed')
    runner = (root / 'tools/run_current_research_tests.mjs').read_text()
    require('readdir(TEST_ROOT)' in runner and 'name.endsWith(".test.mjs")' in runner
            and 'molecular-concordance-bookmark.test.mjs' not in runner,
            'Automatic current test discovery changed')
    index = json.loads((root / 'public/data/research_explorer_index_v1/search-index.json').read_bytes())
    records = [item for item in index['records'] if item['focusKind'] == 'molecular_profile']
    by_key = {item['key']: item for item in records}
    counts = Counter(item['namespace'] for item in records)
    require(len(records) == len(by_key) == 387 and len(counts) == 10, 'Current molecular denominator changed')
    fixtures = [{key: by_key[full_key][key] for key in ['key', 'title', 'namespace']}
                for full_key in FIXTURE_KEYS]
    roome = [item for item in records if item['namespace'] == 'roome-2026:GSE291462']
    require(len(roome) == 157 and roome[156]['key'] == 'molecular_profile:roome-2026:GSE291462:dILB6-E1',
            'Roome final-page source fixture changed')
    print(json.dumps({
        'iteration': 'I60', 'status': 'PASS_READONLY_PRE_INTAKE_CURRENT_PREIMAGES',
        'generatedAtUtc': datetime.now(timezone.utc).isoformat(), 'rootProject': str(root),
        'candidateRoot': str(candidate), 'artifacts': artifact_pins,
        'targets': target_checks, 'negativeControls': negative_controls,
        'scientificInputPinsRetained': retained, 'currentUILayoutAndProvider': layout,
        'additionalCurrentReadContextPins': context,
        'route': {'href': '/explore/cell-types/compare', 'navigationLabel': 'Compare sources',
                  'routeId': 'type-compare', 'pageTitle': 'Profile comparison',
                  'collectionMount': '<MolecularConcordanceWorkbench />', 'changedByI60': False},
        'canonicalIntake': {
            'currentInputCount': len(manifest['authoritativeInputs']),
            'existingOwnedInputRehash': 'app/MolecularConcordanceWorkbench.tsx',
            'threeNewPathsAlreadyMatchedByCurrentAppTestsFamilies': [item['path'] for item in targets if item['before'] is None],
            'minimumOwnedPathCountDelta': 3, 'builderEditRequiredForFourCodeTargets': False,
            'parentTimelineNeedsOwnExplicitRecipeAdmissionIfAdded': True,
            'newTestAutomaticallyDiscoveredByCurrentResearchRunner': True,
            'newPackageAliasRequired': False, 'builderExecuted': False,
        },
        'rendererRuntime': {
            'currentInputCount': len(runtime['authoritativeInputs']), 'i60OwnedPathIntersection': [],
            'compareWorkbenchIsSeparateExistingLazyCollectionBranch': True,
            'wrapperProviderSourceCameraGraphChangedByPatch': False,
            'i60OnlyRuntimeExpansionJustified': False, 'runtimeBuilderExecuted': False,
        },
        'nativeFixtures': {'sourceProfileDenominator': 387, 'namespaceCount': 10,
                           'byNamespace': dict(sorted(counts.items())), 'profiles': fixtures,
                           'roomePagination': {'count': 157, 'pageSize': 12, 'uiPageCount': 14,
                                               'validFinalComparePage': 13, 'invalidComparePage': 14,
                                               'lastPageCount': 1,
                                               'lastProfile': {key: roome[-1][key] for key in ['key', 'title', 'namespace']}},
                           'retainedOriginalPlanErratum': 'Final Roome UI page is 14, not 13; comparePage=13 is valid.'},
        'scope': {'sharedRootWrites': 0, 'candidateWrites': 0, 'gitApplyInvocations': 0,
                  'stagingChanges': 0, 'browserActions': 0, 'networkRequests': 0,
                  'productTestsReexecuted': False, 'buildsReexecuted': False,
                  'sourceCountChanges': 0, 'profileChanges': 0, 'completedChanges': 0,
                  'identityGeometryRightsOrREGAdmissions': 0},
        'limitations': ['This in-memory unified-hunk replay is not an applied root patch or git apply result.',
                        'Historical candidate/peer tests are pinned retained evidence, not tests rerun here.',
                        'The 11 native scenarios remain prepared and unexecuted in this handoff.',
                        'Full root integration, canonical recipe changes and browser acceptance belong to parent.'],
    }, ensure_ascii=False, indent=2) + '\n', end='')


if __name__ == '__main__':
    main()
