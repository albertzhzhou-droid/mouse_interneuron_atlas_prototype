#!/usr/bin/env python3
"""Seal only four temp I62 paths; verify current root without applying."""
from pathlib import Path
from datetime import datetime, timezone
import difflib, hashlib, json, re, subprocess

BASE=Path('/private/tmp/ohri-i62-source-information-navigation-candidate')
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
PROPOSED=BASE/'proposed'; QA=BASE/'qa'
MODIFIED=('app/ResearchSourceRegistry.tsx',)
NEW=('app/research-source-information-navigation.js','app/research-source-information-navigation.d.ts','tests/research-source-information-navigation.test.mjs')
NODE='/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'

def pin(path):
    data=path.read_bytes();return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

for relative in MODIFIED: assert (ROOT/relative).read_bytes()==(QA/'preimages'/relative).read_bytes(), f'Root preimage changed: {relative}'
for relative in NEW: assert not (ROOT/relative).exists(), f'New path already exists: {relative}'
before=(QA/'preimages'/MODIFIED[0]).read_text();after=(PROPOSED/MODIFIED[0]).read_text()
stripped=after.replace('import Link from "next/link";\n','',1).replace('import { getSourceRecordSetInformation } from "./research-source-information-navigation.js";\n','',1)
start=stripped.index('function SourceInformationNavigation(');end=stripped.index('function integrityText(',start)
stripped=stripped[:start]+stripped[end:]
stripped=stripped.replace('                  {!recordSetError && <SourceInformationNavigation sourceId={selected.id} recordSet={recordSet} />}\n','',1)
assert stripped==before, 'Original selection/filter/URL/provider/export/style/child navigation behavior changed outside the new information action'
export_start=before.index('function downloadSource(');export_end=before.index('function sourceParams(',export_start)
export_bytes=before[export_start:export_end].encode()
retained_inputs=[];layout_pins=[]
initial=json.loads((QA/'READ_ONLY_BEFORE_SCOPE_PINS.json').read_text())
immutable={'app/SourceRecordSetNavigation.tsx','app/research-source-drilldown.js','app/research-source-drilldown.d.ts','app/AdditionalResearchEvidence.tsx','app/GarciaRamirezPhysiologyPanel.tsx','app/garcia-ramirez-physiology.js','app/garcia-ramirez-physiology.d.ts','data/research-source-registry-0.1.json','data/garcia-ramirez-adult-spinal-physiology-0.1.json','data/garcia-ramirez-adult-spinal-physiology-derivation-receipt-0.1.json','scripts/validate-garcia-ramirez-source-registry-0.1.mjs'}
for item in initial['pins']:
    if item['path'] in MODIFIED: continue
    now=pin(ROOT/item['path'])
    if item['path'] in immutable:
        assert now=={'bytes':item['bytes'],'sha256':item['sha256']},f'Reused authority/source input changed: {item["path"]}'
        retained_inputs.append({'path':item['path'],**now})
    else: layout_pins.append({'path':item['path'],'initialRead':{'bytes':item['bytes'],'sha256':item['sha256']},'current':now,'candidateWrites':0})
registry=json.loads((ROOT/'data/research-source-registry-0.1.json').read_text())
source=next(source for source in registry['sources'] if source['id']=='SRC-GARCIA-RAMIREZ-2022')
set_=source['recordSets'][0]
assert len(registry['sources'])==32 and sum(len(source['recordSets']) for source in registry['sources'])==42
original_assets=[]
for asset in source['assets']:
    now=pin(ROOT/asset['path']);assert now=={'bytes':asset['integrity']['bytes'],'sha256':asset['integrity']['sha256']}
    original_assets.append({'path':asset['path'],'assetId':asset['id'],'accession':asset['accession'],**now})
files=[];parts=[]
for relative in MODIFIED+NEW:
    is_new=relative in NEW;old='' if is_new else (QA/'preimages'/relative).read_text();new=(PROPOSED/relative).read_text()
    assert old!=new
    parts.append(f'diff --git a/{relative} b/{relative}\n')
    if is_new:parts.append('new file mode 100644\n')
    parts.extend(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='/dev/null' if is_new else 'a/'+relative,tofile='b/'+relative))
    files.append({'path':relative,'operation':'add' if is_new else 'modify','before':None if is_new else pin(QA/'preimages'/relative),'after':pin(PROPOSED/relative)})
patch=BASE/'I62_SOURCE_INFORMATION_NAVIGATION_CANDIDATE.patch';patch.write_text(''.join(parts))
check=subprocess.run(['git','apply','--check',str(patch)],cwd=ROOT,capture_output=True,text=True)
(QA/'git-apply-check.stdout.log').write_text(check.stdout);(QA/'git-apply-check.stderr.log').write_text(check.stderr)
assert check.returncode==0,check.stderr
ownership={'iteration':'I62','candidateRoot':str(BASE),'rootProject':str(ROOT),'ownedPathCount':4,'integrationTargets':files,'patch':{'path':str(patch),**pin(patch)},
 'excluded':['all shadow symlinks/QA configs/node_modules','all source/data/schema/package/queue/recipe/manifest files','SiteNavigation/sidebar/Collection/TypeAtlas/SourceRecordSetNavigation/I55 drilldown helper/CSS','AdditionalResearchEvidence/Garcia facts/panel/exports'],
 'parentOwns':['integration/current input recipe and mounted closure update','full root production build/tests','actual browser/history/focus/narrow/zoom/AT/download QA','scientific milestones/counts'],
 'buildClosureImpact':{'newRuntimeModule':'app/research-source-information-navigation.js','newDeclaredTypeInput':'app/research-source-information-navigation.d.ts','newTestInput':'tests/research-source-information-navigation.test.mjs','newDataImports':0,'existingJsonInput':'data/research-source-registry-0.1.json','eagerAggregateFactsOrOriginalAssetImports':False,'mountedPositionsClosureNeedsRecalculation':True},
 'reusedAuthorityAndSourcePins':retained_inputs,'originalSourceAndAdapterPins':original_assets,'currentReadOnlyLayoutPins':layout_pins,
 'originalBehaviorPreservation':'After removing only two new imports, internal information action component and one gated JSX mount, the proposed Registry is byte-identical to its saved current preimage.',
 'originalSourceDossierExportSegment':{'bytes':len(export_bytes),'sha256':hashlib.sha256(export_bytes).hexdigest(),'byteIdentical':True},
 'sharedProductRootWrites':0,'scientificSourceEdits':0,'dependencyChanges':0}
save(BASE/'ownership.json',ownership)
validation=json.loads((QA/'VALIDATION_EXIT_CODES.json').read_text())
for name,paths in {'focusedAndExistingSourceNavigationRegression':['focused-tests.stdout.log','focused-tests.stderr.log'],'fullCurrentShadowTypeScript':['typecheck.stdout.log','typecheck.stderr.log'],'scopedRootConfigESLint':['eslint.stdout.log','eslint.stderr.log']}.items():
    assert validation[name]['exitCode']==0
    validation[name]['logs']=[{'path':str(QA/path),**pin(QA/path)} for path in paths]
log=(QA/'focused-tests.stdout.log').read_text();assert re.search(r'(?:ℹ|#) tests 38\b',log) and re.search(r'(?:ℹ|#) pass 38\b',log) and re.search(r'(?:ℹ|#) fail 0\b',log)
validation['focusedAndExistingSourceNavigationRegression'].update({'newInformationTests':9,'unchangedSourceNavigationAndI56Tests':29,'tests':38,'pass':38,'fail':0,'invocationUsesPreserveSymlinks':True})
validation['gitApplyCheck']={'exitCode':0,'applied':False,'logs':[{'path':str(QA/path),**pin(QA/path)} for path in ['git-apply-check.stdout.log','git-apply-check.stderr.log']]}
receipt={'iteration':'I62','status':'SEALED_TEMP_CANDIDATE_PEER_AND_NATIVE_BROWSER_PENDING','sealedAtUtc':datetime.now(timezone.utc).isoformat(),'sourcePage':'/sources','destination':set_['sourceInformationRef']['href'],
 'files':files,'patch':{'path':str(patch),**pin(patch)},'ownership':{'path':str(BASE/'ownership.json'),**pin(BASE/'ownership.json')},'validation':validation,
 'initialUnpassedShadowChecks':{'path':str(QA/'initial-shadow-check/ATTEMPT_NOTES.json'),**pin(QA/'initial-shadow-check/ATTEMPT_NOTES.json')},
 'originalInputAndGapRead':{'path':str(QA/'READ_ONLY_BEFORE_SCOPE_PINS.json'),**pin(QA/'READ_ONLY_BEFORE_SCOPE_PINS.json')},
 'nativeBrowserPlan':{'path':str(QA/'ACTUAL_BROWSER_QA_PLAN.md'),**pin(QA/'ACTUAL_BROWSER_QA_PLAN.md'),'scenarioCount':8,'executed':False},
 'runtime':{'node':NODE,'version':subprocess.check_output([NODE,'--version'],text=True).strip(),'nodeModules':str((PROPOSED/'node_modules').resolve()),'dependencyChanges':0,'qaOnlyEslintConfigByteIdentical':(PROPOSED/'eslint.config.mjs').read_bytes()==(ROOT/'eslint.config.mjs').read_bytes(),'qaOnlyTypeScriptIncremental':False},
 'informationNavigationAuthority':{'type':'declared_source_information_navigation_only','exactSourceId':source['id'],'exactRecordSetId':set_['recordSetId'],'adapterId':source['assets'][0]['accession'],'reference':set_['sourceInformationRef'],'sourceOwnershipAndCurrentDeclarationRequired':True,'safeDestination':'exact reviewed relative path/fragment only; no dynamic href admission','byteProofCreatedByAction':False,'renderProofCreatedByAction':False,'destinationRetainsOwnSourceValidation':True,'newPublicQaHooks':0},
 'scientificScope':{'retainedSources':32,'retainedRecordSets':42,'informationActions':1,'informationAdapterDenominator':1,'recordedObservationPool':171,'alternativePartitionsSharePool':4,'poolCountsNotAdded':True,'unknownCellToAnimalMappingRetained':True,'exactNavigationSetsRetained':15,'exactNavigationEntriesRetained':274,'bundledExactRostersRetained':13,'bundledExactObjectSetsRetained':4,'confirmedProfilesRetained':387,'sameCellJoins':0,'sameTypeJoins':0,'newGeometry':0,'newRawPublication':0,'exactCompletedEntriesRetained':83,'controllingPlanEntries':243,'M2M4Admission':False},
 'evidenceLimits':['Actual React SSR does not prove native hydration/history/focus/layout/download','Isolated VM metadata counterfactuals do not establish source-byte or renderer proof','Node tests verify unchanged adapter/original asset physical bytes, not fresh browser fetching','No full-App narrow/zoom/AT/performance or M2/M4 closure is claimed'],
 'sharedProductRootWrites':0,'scientificSourceEdits':0}
save(QA/'I62_CANDIDATE_SEAL_AND_VALIDATION_RECEIPT.json',receipt)
print(json.dumps({'patch':{'path':str(patch),**pin(patch)},'ownership':{'path':str(BASE/'ownership.json'),**pin(BASE/'ownership.json')},'receipt':{'path':str(QA/'I62_CANDIDATE_SEAL_AND_VALIDATION_RECEIPT.json'),**pin(QA/'I62_CANDIDATE_SEAL_AND_VALIDATION_RECEIPT.json')},'files':files},indent=2))
