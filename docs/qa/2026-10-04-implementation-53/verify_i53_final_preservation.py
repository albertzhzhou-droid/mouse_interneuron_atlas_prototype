#!/usr/bin/env python3
"""Audit actual I53 intake; shared root is read only, output is temporary."""
from pathlib import Path
import collections, datetime, difflib, gzip, hashlib, json, os, re, time, zipfile

ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA = ROOT / 'docs/qa/2026-10-04-implementation-53'
OUT = Path(__file__).resolve().parent
CHUNK = 4096
cache, contents = {}, {}
stats = {'strategy': 'full_file_os_pread_4096_byte_chunks', 'chunkBytes': CHUNK,
         'preadCalls': 0, 'bytesRead': 0, 'filesRead': 0}
started = time.time()

def read(path, keep=False, fresh=False):
    path = Path(path)
    if not fresh and path in cache and (not keep or path in contents):
        return cache[path], contents.get(path)
    digest, pieces, offset = hashlib.sha256(), [], 0
    fd = os.open(path, os.O_RDONLY)
    try:
        before = os.fstat(fd)
        while True:
            block = os.pread(fd, CHUNK, offset)
            stats['preadCalls'] += 1
            if not block: break
            digest.update(block); offset += len(block); stats['bytesRead'] += len(block)
            if keep: pieces.append(block)
        after = os.fstat(fd)
        if (before.st_size, before.st_mtime_ns, before.st_ino) != (after.st_size, after.st_mtime_ns, after.st_ino):
            raise RuntimeError('Changed during full byte read: ' + str(path))
        if after.st_size != offset: raise RuntimeError('Incomplete read: ' + str(path))
    finally: os.close(fd)
    stats['filesRead'] += 1
    result = {'bytes': offset, 'sha256': digest.hexdigest()}
    cache[path] = result
    if keep: contents[path] = b''.join(pieces)
    return result, contents.get(path) if keep else None

def actual(path, keep=False):
    return read(ROOT/path, keep=keep) if (ROOT/path).is_file() else (None, None)

def load(path): return json.loads(actual(path, keep=True)[1])
def receipt(row): return {k:row[k] for k in ['bytes','sha256']}
def same(a,b): return a is not None and a == receipt(b)
def table(rows):
    result = {row['path']: row for row in rows}
    if len(result) != len(rows): raise RuntimeError('Duplicate receipt path')
    return result

manifest_path = 'data/research-iteration-manifest-2.91.json'
epoch_start, manifest_bytes = actual(manifest_path, keep=True)
manifest = json.loads(manifest_bytes)
intake = load('docs/qa/2026-10-04-implementation-53/intake-preservation.json')
addon = load('docs/qa/2026-10-04-implementation-53/I53_PARENT_INTEGRATION_ADDON_RECEIPT.json')
before, current = table(intake['baselineInputs']), table(manifest['authoritativeInputs'])
owned = table(intake['preimages'])
new_paths = set(intake['newPathAbsence'])
existing_closure_paths=set(json.loads(Path('/private/tmp/ohri-i53-runtime-dependency-inventory-20261004.json').read_text())['proposedExistingRecipeAdditions'])

def classify(path):
    if path in new_paths: return 'I53_new_exact_source_information_adapter_input'
    if path in existing_closure_paths:return 'I53_existing_runtime_dependency_receipted_from_actual_current_bytes'
    if path == 'docs/RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_53_RUSS_INFORMATION.md': return 'I53_root_intake_timeline'
    if path in {'data/research-iteration-manifest-2.91.json','data/research-renderer-runtime-inputs-2.91.json','tools/build_research_iteration_manifest_2_91.mjs'}: return 'current_integrated_input_recipe_or_regenerated_receipt'
    if path in {'data/research-source-registry-0.1.json','data/research-model-upgrade-registry-0.1.json','docs/RESEARCH_MODEL_UPGRADE_QUEUE.md'}: return 'I53_Russ_source_and_UPG132_scope_only'
    if path in {'public/data/research_explorer_index_v1/search-index.json','public/data/research_explorer_index_v1/search-index.json.gz','public/data/research_explorer_index_v1/asset-manifest.json','data/research-explorer-transport-0.1.json'}: return 'I53_regenerated_explorer_and_transport'
    if path in {'docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md','package.json'}: return 'I53_root_scope_documentation_or_full_validator_wiring'
    if path in owned: return 'I53_owned_code_test_or_live_index_builder'
    return 'unclassified_requires_parent_review'

rows=[]
for path in sorted(set(before)|set(current)):
    cur,_=actual(path)
    state='removed' if path not in current else 'added' if path not in before else 'unchanged' if same(cur,before[path]) else 'changed'
    rows.append({'path':path,'before':receipt(before[path]) if path in before else None,
                 'currentDeclared':receipt(current[path]) if path in current else None,'currentActual':cur,
                 'state':state,'matchesCurrentDeclaration':same(cur,current[path]) if path in current else None,
                 'beforeAbsenceExplicitlyRecorded':path in new_paths,
                 'addedToReceiptDoesNotProveNewFileCreation':state=='added',
                 'classification':'prior_input_byte_preserved' if state=='unchanged' else classify(path)})
changed=[x for x in rows if x['state']!='unchanged']
counts=dict(collections.Counter(x['state'] for x in rows))

archive_receipt, archive_bytes=actual('docs/qa/2026-10-04-implementation-53/preimages.zip',keep=True)
import io
archive=zipfile.ZipFile(io.BytesIO(archive_bytes))
members=archive.namelist()
if len(members)!=len(set(members)) or set(members)!=set(owned): raise RuntimeError('ZIP inventory mismatch')
zipped={}
zip_rows=[]
for path in members:
    if path.startswith('/') or '..' in Path(path).parts: raise RuntimeError('Unsafe member')
    digest,pieces,size=hashlib.sha256(),[],0
    with archive.open(path) as handle:
        while block:=handle.read(CHUNK): digest.update(block);pieces.append(block);size+=len(block)
    zipped[path]=b''.join(pieces)
    old={'bytes':size,'sha256':digest.hexdigest()}; now,_=actual(path)
    zip_rows.append({'path':path,'savedBefore':receipt(owned[path]),'decompressedActual':old,
                     'zipMatchesBefore':same(old,owned[path]),'currentActual':now,
                     'currentUnchanged':same(now,owned[path]),'classification':classify(path)})

layout_rows=[]
for row in intake['layoutBefore']:
    now,_=actual(row['path'])
    layout_rows.append({'path':row['path'],'before':receipt(row),'currentActual':now,'byteIdentical':same(now,row)})
layout_css='app/research-information-layout.css'
expected_css_append='\n/* Retain complete Russ source locators within the current narrow dossier. */\n.type-record-metadata[data-source-profile-id^="russ-2021:"] code {\n  white-space: normal;\n  overflow-wrap: anywhere;\n  word-break: normal;\n}\n'
css_current=actual(layout_css,keep=True)[1].decode()
css_before=zipped[layout_css].decode()
css_scope_exact=css_current==css_before+expected_css_append
added_rows=[]
addon_new=table(addon['newCurrentManifestInputs'])
for path in sorted(new_paths):
    now,_=actual(path); expected=addon_new.get(path)
    added_rows.append({'path':path,'beforeAbsenceRecorded':True,'currentlyPresent':now is not None,
                       'expectedCandidate':receipt(expected) if expected else None,'currentActual':now,
                       'matchesSealedCandidate':same(now,expected) if expected else None})
generated=[]
for row in addon['generatedIndexTransport']:
    now,_=actual(row['path']); generated.append({'path':row['path'],'sealedCandidate':receipt(row),'currentActual':now,'candidateMatchesRoot':same(now,row)})

# Inventory physical patch targets; core artifact is unified diff, addon has git headers.
patch_inventories=[]
patch_paths=set()
for row in intake['patches']:
    patch_actual,patch_bytes=read(row['path'],keep=True)
    paths=re.findall(r'^\+\+\+ b/(.+)$',patch_bytes.decode(),re.M)
    if len(paths)!=len(set(paths)): raise RuntimeError('Duplicate patch target header')
    patch_paths.update(paths)
    patch_inventories.append({'path':row['path'],'savedReceipt':receipt(row),'actual':patch_actual,
                              'receiptMatches':same(patch_actual,row),'targetCount':len(paths),'targets':paths})
copied_paths=sorted(new_paths-patch_paths)
generated_paths={row['path'] for row in addon['generatedIndexTransport']}
new_ui_paths={row['path'] for row in intake['layoutBefore']}|{
    'app/layout.tsx','app/ResearchSkipLink.tsx','app/academic-interface.css',
    'app/explore/[...section]/page.tsx','app/research/[...section]/page.tsx','app/sources/page.tsx',
    'app/ResearchRecordSourceScope.tsx','app/ResearchRecordEvidenceFingerprint.tsx',
    'app/ResearchActiveRecordProvider.tsx','app/SourceRecordDeltaInspector.tsx','app/source-record-delta.js'}
old_unpinned_ui_helpers={'app/ResearchRecordEvidenceFingerprint.tsx','app/SourceRecordDeltaInspector.tsx','app/source-record-delta.js'}
inventory=[]
for path in sorted(patch_paths|set(copied_paths)|generated_paths|new_ui_paths):
    now,_=actual(path)
    categories=[]
    if path in patch_paths: categories.append('sealed_patch_target')
    if path in copied_paths: categories.append('separately_copied_exact_scientific_or_extractor_input')
    if path in generated_paths: categories.append('root_regenerated_output')
    if path in new_ui_paths: categories.append('current_multipage_UI_dependency')
    inventory.append({'path':path,'categories':categories,'currentActual':now,
                      'currentDeclared':receipt(current[path]) if path in current else None,
                      'declaredCurrentPinMatches':same(now,current[path]) if path in current else False,
                      'baselineAuthoritativeInput':receipt(before[path]) if path in before else None,
                      'baselineOwnedPreimage':receipt(owned[path]) if path in owned else None,
                      'explicitBeforeAbsenceRecorded':path in new_paths,
                      'baselineUnrecordedDoesNotProveAbsence':path not in before and path not in owned and path not in new_paths})

# Read actual local import dependencies individually. This graph records direct code imports;
# it does not infer that excluded historical builder functions were executed.
import_edges=[]
dependency_rows={}
seeds={p for p in patch_paths if Path(p).suffix in {'.js','.mjs','.ts','.tsx'}}|new_ui_paths
for parent in sorted(seeds):
    if Path(parent).suffix not in {'.js','.mjs','.ts','.tsx'}:continue
    _,body=actual(parent,keep=True)
    for specifier in sorted(set(re.findall(r'(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)[\"\'](\.[^\"\']+)[\"\']',body.decode()))):
        base=(ROOT/parent).parent/specifier
        choices=[base]+[Path(str(base)+s) for s in ['.tsx','.ts','.js','.mjs','.json','.css','.d.ts']]+[base/'index.tsx',base/'index.ts',base/'index.js']
        resolved=next((p for p in choices if p.is_file()),None)
        if resolved is None:
            import_edges.append({'from':parent,'specifier':specifier,'resolvedPath':None})
            continue
        path=str(resolved.resolve().relative_to(ROOT))
        now,_=actual(path)
        import_edges.append({'from':parent,'specifier':specifier,'resolvedPath':path})
        dependency_rows[path]={'path':path,'currentActual':now,'currentDeclared':receipt(current[path]) if path in current else None,
                              'declaredCurrentPinMatches':same(now,current[path]) if path in current else False,
                              'baselineAuthoritativeInput':receipt(before[path]) if path in before else None,
                              'explicitBeforeAbsenceRecorded':path in new_paths}
stage=Path('/private/tmp/ohri-i51-verification')
stage_parity=[]
for path in sorted(set(dependency_rows)|new_ui_paths|patch_paths|set(copied_paths)|generated_paths):
    stage_path=stage/path
    staged,_=read(stage_path) if stage_path.is_file() else (None,None)
    root_actual,_=actual(path)
    stage_parity.append({'path':path,'rootActual':root_actual,'stageActual':staged,
                         'byteIdenticalAtReadCheckpoint':root_actual==staged and root_actual is not None,
                         'stageComparisonDoesNotCreateBeforeReceipt':True})

def semantic_records(path,field,key):
    old=json.loads(zipped[path]); now=load(path)
    a={x[key]:x for x in old[field]}; b={x[key]:x for x in now[field]}
    return {'beforeCount':len(a),'currentCount':len(b),'added':sorted(set(b)-set(a)),
            'removed':sorted(set(a)-set(b)),'changed':sorted(k for k in set(a)&set(b) if a[k]!=b[k]),
            'unchangedCount':sum(a[k]==b[k] for k in set(a)&set(b))},old,now

source_result,source_before,source_now=semantic_records('data/research-source-registry-0.1.json','sources','id')
upgrade_result,upgrade_before,upgrade_now=semantic_records('data/research-model-upgrade-registry-0.1.json','upgrades','id')
source_result['changedTopLevelKeys']=[k for k in sorted(set(source_before)|set(source_now)) if source_before.get(k)!=source_now.get(k)]
upgrade_result['changedTopLevelKeys']=[k for k in sorted(set(upgrade_before)|set(upgrade_now)) if upgrade_before.get(k)!=upgrade_now.get(k)]
index_result,index_before,index_now=semantic_records('public/data/research_explorer_index_v1/search-index.json','records','key')
old_index={x['key']:x for x in index_before['records']}; new_index={x['key']:x for x in index_now['records']}
russ_keys={x['key'] for x in index_now['records'] if x['namespace']=='russ-2021'}
index_result.update({'countsBefore':index_before['counts'],'countsCurrent':index_now['counts'],
                    'russRecordCount':len(russ_keys),'nonRussRecordsUnchanged':all(old_index[k]==new_index[k] for k in old_index if k not in russ_keys),
                    'nonRussRecordCount':len(old_index)-len(russ_keys)})
raw_receipt,raw=actual('public/data/research_explorer_index_v1/search-index.json',keep=True)
gzip_receipt,gz=actual('public/data/research_explorer_index_v1/search-index.json.gz',keep=True)
transport=load('data/research-explorer-transport-0.1.json')
asset=load('public/data/research_explorer_index_v1/asset-manifest.json')
asset_pin_rows=[]
for pin in asset['sourceFiles']:
    now,_=actual(pin['path']); asset_pin_rows.append({'path':pin['path'],'name':pin['name'],'pin':receipt(pin),'actual':now,'matches':same(now,pin)})

runtime_path='data/research-renderer-runtime-inputs-2.91.json'
runtime_before=json.loads(zipped[runtime_path]); runtime_now=load(runtime_path)
runtime_old=table(runtime_before['authoritativeInputs']);runtime_new=table(runtime_now['authoritativeInputs'])
runtime_pin_rows=[]
for p,row in runtime_new.items():
    now,_=actual(p);runtime_pin_rows.append({'path':p,'currentPin':receipt(row),'actual':now,'matches':same(now,row)})
runtime_result={'beforeCount':len(runtime_old),'currentCount':len(runtime_new),
                'addedPaths':sorted(set(runtime_new)-set(runtime_old)),'removedPaths':sorted(set(runtime_old)-set(runtime_new)),
                'updatedPinPaths':sorted(p for p in set(runtime_old)&set(runtime_new) if receipt(runtime_old[p])!=receipt(runtime_new[p])),
                'currentPinMismatches':[x['path'] for x in runtime_pin_rows if not x['matches']],
                'scopeBefore':runtime_before['scope'],'scopeCurrent':runtime_now['scope']}

frozen=[]
for row in addon['frozen241ReadOnlyObservedFiles']:
    now,_=actual(row['path']); frozen.append({'path':row['path'],'candidateObservation':row,'currentActual':now,
                   'preserved':same(now,row) if row['presentAtActivePath'] else now is None})

adapter=load('data/russ-spinal-information-adapter-0.1.json')
populations=adapter['populations'];adult=adapter['adultValidationContext'];seq=adapter['sequencingDenominator']
queue_before=zipped['docs/RESEARCH_MODEL_UPGRADE_QUEUE.md'].decode().splitlines()
queue_now=actual('docs/RESEARCH_MODEL_UPGRADE_QUEUE.md',keep=True)[1].decode().splitlines()
queue_changes=[{'line':i+1,'before':a,'current':b} for i,(a,b) in enumerate(zip(queue_before,queue_now)) if a!=b]
scientific=[x for x in rows if x['path'].startswith(('data/','public/data/')) and x['path'] not in {runtime_path,manifest_path}]
full_test=load('package.json')['scripts']['test:research']
scientific_scope={'populationCount':len(populations),'studyCountFields':sum(len(p['sequencingSampling']['byStudy']) for p in populations),
                  'sequencingDenominator':seq['value'],'studyCounts':[s['value'] for s in seq['studies']],
                  'studiesSum':sum(s['value'] for s in seq['studies']),
                  'adultPanelCount':len(adult['panels']),'articleAdultCountedCells':adult['articleReportedCountedCells'],
                  'panelCountedCellsSum':adult['panelCountedCellsSum'],
                  'unresolvedArticleMinusPanelDifference':adult['articleReportedCountedCells']-adult['panelCountedCellsSum'],
                  'adultAggregateReceipt':{k:v for k,v in adult.items() if any(t in k.lower() for t in ['sum','difference','reconcil','total'])},
                  'admissionBoundary':adapter['admissionBoundary'],'hardBoundaries':adapter['hardBoundaries'],
                  'samePhysicalCellJoinsAllFalse':all(not p['sourceProfileJoin']['samePhysicalCell'] for p in populations),
                  'originalTaxonomyMatchesRetainedInputCopy':actual('data/russ-harmonized-taxonomy-crosswalk-0.1.json')[0]==actual('data/source-candidates/russ-spinal-information-20261004/russ-harmonized-taxonomy-crosswalk-0.1.input.json')[0]}

# Re-read the manifest without cached bytes after all file comparison; concurrent generation is a checkpoint, not a pass.
epoch_end,_=read(ROOT/manifest_path, fresh=True)
epoch_stable=epoch_start==epoch_end
checks={'currentAuthoritativePinsAllMatch':all(x['matchesCurrentDeclaration'] for x in rows if x['currentDeclared']),
        'noBeforeInputDeleted':counts.get('removed',0)==0,'allZIPBeforeBytesMatch':all(x['zipMatchesBefore'] for x in zip_rows),
        'nineLayoutInputsBytePreservedAndSoleScopedCSSUpdate':sum(x['byteIdentical'] for x in layout_rows)==9 and css_scope_exact and all(x['byteIdentical'] for x in layout_rows if x['path']!=layout_css),
        'allFourteenNewPathsMatchSealedCandidate':all(x['matchesSealedCandidate'] for x in added_rows),
        'rawIndexAndAssetManifestMatchCandidate':all(x['candidateMatchesRoot'] for x in generated if x['path'] in {'public/data/research_explorer_index_v1/search-index.json','public/data/research_explorer_index_v1/asset-manifest.json'}),
        'regeneratedRootTransportPinsMatchActual':same(raw_receipt,transport['source']) and same(gzip_receipt,transport['transport']) and same(raw_receipt,asset['index']),
        'onlyRussSourceObjectChanged':source_result['changed']==['SRC-RUSS-2021'] and not source_result['added'] and not source_result['removed'],
        'onlyUPG132ObjectChanged':upgrade_result['changed']==['UPG-132'] and not upgrade_result['added'] and not upgrade_result['removed'],
        'onlyUPG132QueueRowChanged':len(queue_before)==len(queue_now) and len(queue_changes)==1 and '| UPG-132 |' in queue_changes[0]['current'],
        'indexKeysAndCountsRetained':not index_result['added'] and not index_result['removed'] and index_before['counts']==index_now['counts'],
        'all572NonRussRecordsUnchanged':index_result['nonRussRecordCount']==572 and index_result['nonRussRecordsUnchanged'],
        'gzipLosslesslyDecodesExactCurrentIndex':gzip.decompress(gz)==raw,
        'all22AssetSourcePinsMatch':len(asset_pin_rows)==22 and all(x['matches'] for x in asset_pin_rows),
        'runtimeRecipePathSetUnchanged':not runtime_result['addedPaths'] and not runtime_result['removedPaths'],
        'runtimeCurrentPinsMatch':not runtime_result['currentPinMismatches'],
        'frozen241ObservationsPreserved':all(x['preserved'] for x in frozen),
        'scopeCountsRetained':manifest['registrySummary']['completedResearchUpgradeCount']==83 and manifest['registrySummary']['researchUpgradeCount']==243 and manifest['registrySummary']['sourceProfileCount']==387,
        'fullResearchRunnerWiresRussExactSourceValidator':'validate:russ-information' in full_test,
        'stableManifestEpoch':epoch_stable,
        'allPatchArtifactReceiptsMatch':all(x['receiptMatches'] for x in patch_inventories),
        'all23PatchTargetsCurrentPinned':len(patch_paths)==23 and all(x['declaredCurrentPinMatches'] for x in inventory if x['path'] in patch_paths),
        'all8CopiedInputsCurrentPinned':len(copied_paths)==8 and all(x['declaredCurrentPinMatches'] for x in inventory if x['path'] in copied_paths),
        'allGeneratedOutputsCurrentPinned':all(x['declaredCurrentPinMatches'] for x in inventory if x['path'] in generated_paths),
        'currentNewUIEntryAndLayoutInputsPinned':all(x['declaredCurrentPinMatches'] for x in inventory if x['path'] in new_ui_paths),
        'allPreviouslyOmitted71ExistingDependenciesNowCurrentPinned':all(p in current and same(actual(p)[0],current[p]) for p in existing_closure_paths),
        'allActualStageIntakeAndDirectDependencySourceBytesMatchRoot':all(x['byteIdenticalAtReadCheckpoint'] for x in stage_parity),
        'allDeltaPathsClassified':all(x['classification']!='unclassified_requires_parent_review' for x in changed)}
result={'auditId':'I53-final-preservation-20261004','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'scope':'Actual shared root source bytes and semantics at one checkpoint; no browser, build or full acceptance QA claimed.',
        'documentClosureBoundary':'Final I53 documentation/source checkpoint after parent regeneration and synchronization notice. This replay verifies actual file bytes; it does not promote broad UPG-132 or full goal completion.',
        'sharedFilesModified':False,'root':str(ROOT),'elapsedSeconds':round(time.time()-started,3),'readStrategy':stats,
        'manifestEpochStart':epoch_start,'manifestEpochEnd':epoch_end,'checkpointStable':epoch_stable,
        'checks':checks,'passed':all(checks.values()),
        'summary':{'beforeAuthoritativeInputCount':len(before),'currentAuthoritativeInputCount':len(current),
                   'changes':counts,'ownedPreimageCount':len(owned),'newAbsencePathCount':len(new_paths),
                   'layoutCheckpointCount':len(layout_rows),'layoutByteIdenticalCount':sum(x['byteIdentical'] for x in layout_rows),
                   'layoutIntentionallyChangedCount':sum(not x['byteIdentical'] for x in layout_rows),
                   'patchDistinctTargetCount':len(patch_paths),'separatelyCopiedInputCount':len(copied_paths),
                   'ownedPreimageCurrentChangedCount':sum(not x['currentUnchanged'] for x in zip_rows),
                   'ownedChangedOutsideAuthoritativeComparisonCount':sum(x['path'] not in before and x['path'] not in current and not x['currentUnchanged'] for x in zip_rows),
                   'priorScientificAndPublicDataCounts':dict(collections.Counter(x['state'] for x in scientific)),
                   'registrySummary':manifest['registrySummary']},
        'authoritativeInputComparison':rows,'classifiedDeltas':changed,
        'preimageArchive':{'path':'docs/qa/2026-10-04-implementation-53/preimages.zip','actual':archive_receipt,'exactMemberInventory':True,'rows':zip_rows},
        'ownedChangedOutsideAuthoritativeComparison':[x for x in zip_rows if x['path'] not in before and x['path'] not in current and not x['currentUnchanged']],
        'newPathComparison':added_rows,'layoutBeforeComparison':layout_rows,
        'soleCSSChange':{'path':layout_css,'ownedBeforeReceipt':receipt(owned[layout_css]),'allBeforeTextRetainedAndExactScopedAppend':css_scope_exact,'exactAppendedCSS':expected_css_append},
        'completeIntakeInventory':inventory,'patchInventories':patch_inventories,
        'directLocalImportEdges':import_edges,'directLocalDependencies':list(dependency_rows.values()),
        'unresolvedDirectLocalImports':[x for x in import_edges if x['resolvedPath'] is None],
        'unpinnedDirectLocalDependencies':[x for x in dependency_rows.values() if not x['declaredCurrentPinMatches']],
        'actualStageSourceParity':stage_parity,
        'stageParityBoundary':'Read-only source-byte comparison to existing parent-owned verification directory. No build output, execution result or historical before-file identity inferred from stage equality.',
        'previouslyOmittedExistingDependencyAdmission':{'addedExistingPaths':sorted(existing_closure_paths),
          'all71CurrentActualPinMatches':checks['allPreviouslyOmitted71ExistingDependenciesNowCurrentPinned'],
          'threeEarlierUIHelperAdmissions':[x for x in inventory if x['path'] in old_unpinned_ui_helpers],
          'statement':'These existing dependency inputs are now explicitly admitted from actual current bytes. The absence of a before authoritative entry is not treated as prior file absence or as a before byte receipt.'},
        'importGraphBoundary':'Direct static local imports from patch code and current UI dependencies; no execution inferred, historical 2.41/2.42 rebuild tests remain excluded. Source declaration inputs and generated index sourceFiles are separately fully byte verified.',
        'sourceRegistrySemanticComparison':source_result,'upgradeRegistrySemanticComparison':upgrade_result,
        'upgrade132Current':next(x for x in upgrade_now['upgrades'] if x['id']=='UPG-132'),
        'queueChanges':queue_changes,'indexSemanticComparison':index_result,
        'generatedIndexCandidateComparison':generated,'assetSourceInputPins':asset_pin_rows,
        'generatedCompressionDifference':{'differingPaths':[x['path'] for x in generated if not x['candidateMatchesRoot']],
            'interpretation':'Root regeneration changes gzip bytes and its transport receipt. Actual root raw index and asset manifest retain candidate bytes. Current gzip is pinned to actual bytes in both current inputs and transport, and fully decodes to the exact candidate-matching raw index. Compressor cause was not independently inferred.',
            'requiredHTTPExpectedContentLength':gzip_receipt['bytes']},
        'transportCurrent':transport,'gzipLosslessVerified':checks['gzipLosslesslyDecodesExactCurrentIndex'],
        'rendererRuntimeComparison':runtime_result,'frozen241Comparison':frozen,
        'scientificScope':scientific_scope,'fullResearchCommand':full_test,
        'remainingQA':'Parent owns current exact-source / Python adversarial results, source-qualified integrated release build, actual desktop/mobile Russ interactions and JSON/CSV exports, plus full test:research acceptance.'}
OUT.mkdir(parents=True,exist_ok=True)
target=OUT/'I53_FINAL_PRESERVATION.json'
target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'output':str(target),'passed':result['passed'],'summary':result['summary'],'failedChecks':[k for k,v in checks.items() if not v],
                  'changedPaths':[x['path'] for x in changed],'epochStable':epoch_stable,'readStrategy':stats},ensure_ascii=False,indent=2))
