#!/usr/bin/env python3
"""I57 independent final preservation. Execute only after parent's final epoch notice.
Read-only shared root/stage; every generated replay or receipt is in this temp folder.
"""
from pathlib import Path
import collections, datetime, hashlib, importlib.util, io, json, os, re, subprocess, sys, time, zipfile
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA=ROOT/'docs/qa/2026-10-05-implementation-57'
OUT=Path(__file__).resolve().parent
cache, contents={}, {}
stats={'strategy':'full_file_os_pread_4096_byte_chunks','chunkBytes':4096,'preadCalls':0,'bytesRead':0,'filesRead':0}
started=time.time()
def read(path,keep=False,fresh=False):
 path=Path(path)
 if not fresh and path in cache and (not keep or path in contents): return cache[path],contents.get(path)
 fd=os.open(path,os.O_RDONLY); h=hashlib.sha256(); parts=[]; offset=0
 try:
  a=os.fstat(fd)
  while True:
   block=os.pread(fd,4096,offset);stats['preadCalls']+=1
   if not block:break
   h.update(block);offset+=len(block);stats['bytesRead']+=len(block)
   if keep:parts.append(block)
  z=os.fstat(fd)
  assert (a.st_ino,a.st_size,a.st_mtime_ns)==(z.st_ino,z.st_size,z.st_mtime_ns) and offset==z.st_size,('Changed/incomplete read',path)
 finally:os.close(fd)
 value={'bytes':offset,'sha256':h.hexdigest()};cache[path]=value;stats['filesRead']+=1
 if keep:contents[path]=b''.join(parts)
 return value,contents.get(path) if keep else None
def actual(rel,keep=False,fresh=False):return read(ROOT/rel,keep,fresh) if (ROOT/rel).is_file() else (None,None)
def load(rel):return json.loads(actual(rel,True)[1])
def pin(row):return {k:row[k] for k in ('bytes','sha256')}
def table(rows):
 value={row['path']:row for row in rows};assert len(value)==len(rows),'Duplicate path';return value
def zip_read(rel,expected):
 zp,body=actual(rel,True);archive=zipfile.ZipFile(io.BytesIO(body));names=archive.namelist()
 assert len(names)==len(set(names)) and set(names)==set(expected),('Unexpected ZIP members',rel)
 bodies={};rows=[]
 for name in names:
  assert not name.startswith('/') and '..' not in Path(name).parts
  h=hashlib.sha256();parts=[];length=0
  with archive.open(name) as handle:
   while block:=handle.read(4096):h.update(block);parts.append(block);length+=len(block)
  value={'bytes':length,'sha256':h.hexdigest()};bodies[name]=b''.join(parts)
  rows.append({'path':name,'expected':pin(expected[name]),'archivedActual':value,'exact':value==pin(expected[name])})
 return zp,bodies,rows
summaryPath='docs/qa/2026-10-05-implementation-57/verification-summary.json'
if not (ROOT/summaryPath).is_file():raise RuntimeError('Wait for parent final I57 epoch notice: successful engineering/native QA required')
summary=load(summaryPath);engineering=summary.get('engineering');native=summary.get('actualBrowser')
if not isinstance(engineering,dict) or engineering.get('exitCode')!=0 or not isinstance(native,dict):raise RuntimeError('Final successful I57 engineering/native QA is not yet available')
manifestPath='data/research-iteration-manifest-2.91.json';runtimePath='data/research-renderer-runtime-inputs-2.91.json'
epochStart,body=actual(manifestPath,True);manifest=json.loads(body);current=table(manifest['authoritativeInputs']);assert len(current)==2573,'Expected actual final I57 canonical2573 epoch'
intake=load('docs/qa/2026-10-05-implementation-57/intake-preservation.json');before=table(intake['baselineInputs']);owned=table(intake['preimages']);targets=table(intake['candidateTargets']);absences=set(intake['newPathAbsence'])
assert len(before)==2570 and len(owned)==6 and len(targets)==3 and len(absences)==3
timeline=intake['timeline'];rootDocs={'docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md',timeline};newExpected=set(intake['newCanonicalCandidatePaths'])|{timeline}
def classify(rel,state):
 if state=='unchanged':return 'prior_current_input_byte_preserved'
 if rel in targets:return 'exact_I57_three_path_explorer_focus_only_candidate'
 if rel in rootDocs:return 'root_owned_bounded_I57_document'
 if rel=='tools/build_research_iteration_manifest_2_91.mjs':return 'exact_three_declared_canonical_pins_only_recipe_delta'
 if rel==runtimePath:return 'regenerated_runtime_transport_if_needed_no_scientific_or_membership_change'
 return 'unclassified_requires_review'
rows=[]
for rel in sorted(set(before)|set(current)):
 now,_=actual(rel);state='removed' if rel not in current else 'added' if rel not in before else 'unchanged' if now==pin(before[rel]) else 'changed'
 rows.append({'path':rel,'state':state,'beforeAuthoritative':pin(before[rel]) if rel in before else None,'currentDeclared':pin(current[rel]) if rel in current else None,'currentActual':now,'matchesCurrentDeclared':rel in current and now==pin(current[rel]),'classification':classify(rel,state),'beforePhysicalAbsenceExplicitlyRecorded':rel in absences,'addedPinDoesNotProveFileCreation':state=='added' and rel not in absences})
counts=dict(collections.Counter(x['state'] for x in rows));changes=[x for x in rows if x['state']!='unchanged']
zipPin,zipped,zipRows=zip_read(intake['preimagesArchive']['path'],owned)
candidateRows=[{'path':rel,'before':row['before'],'sealedAfter':pin(row['after']),'currentActual':actual(rel)[0],'exactCandidate':actual(rel)[0]==pin(row['after']),'exactCanonical':rel in current and pin(current[rel])==pin(row['after'])} for rel,row in targets.items()]
patchPin,_=read(intake['patch']['path']);recipeFix=load('docs/qa/2026-10-05-implementation-57/root-recipe-admission.json');recipePath=recipeFix['path'];recipeExpected=zipped[recipePath]
for delta in recipeFix['exactReplacements']:
 prior=delta['before'].encode();after=delta['after'].encode();assert recipeExpected.count(prior)==1
 recipeExpected=recipeExpected.replace(prior,after)
recipeReplay={'beforeExact':pin(recipeFix['before'])==pin(owned[recipePath]),'expectedAfter':{'bytes':len(recipeExpected),'sha256':hashlib.sha256(recipeExpected).hexdigest()},'reportedAfter':pin(recipeFix['after']),'currentExactlyReplay':actual(recipePath,True)[1]==recipeExpected,'exactReplacements':recipeFix['exactReplacements'],'newlyAdmittedPaths':recipeFix['newlyAdmittedPaths']}
science=[x for x in rows if x['path'].startswith(('data/','public/data/')) and x['path'] not in {manifestPath,runtimePath}]
reusedRows=[{'path':x['path'],'intakeExpected':pin(x),'beforeCanonical':pin(before[x['path']]),'currentActual':actual(x['path'])[0],'exactUnchanged':actual(x['path'])[0]==pin(x)==pin(before[x['path']])} for x in intake['reusedInputsUntouched']]
priorI56=json.loads(read('/private/tmp/ohri-i56-final-preservation-20261005/I56_FINAL_PRESERVATION.json',True)[1])
layoutPaths={x['path'] for x in priorI56['newMultipageLayoutPreservation']}|{'app/ResearchExplorer.tsx','app/GarciaRamirezPhysiologyPanel.tsx','app/garcia-ramirez-physiology.css','app/SourceRecordSetNavigation.tsx','app/SourceRecordSetNavigation.module.css','app/research-source-drilldown.js'}
layoutRows=[{'path':rel,'before':pin(before[rel]),'currentActual':actual(rel)[0],'unchanged':actual(rel)[0]==pin(before[rel]),'ownedExplorerSurface':rel=='app/ResearchExplorer.tsx','exactCandidate':rel in targets and actual(rel)[0]==pin(targets[rel]['after'])} for rel in sorted(layoutPaths)]
privateRows=[{'path':x['path'],'before':pin(before[x['path']]),'currentActual':actual(x['path'])[0],'unchanged':actual(x['path'])[0]==pin(before[x['path']])} for x in priorI56['privateRendererPreservation']]
runtimeBefore=json.loads(zipped[runtimePath]);runtimeNow=load(runtimePath);runtimeOld=table(runtimeBefore['authoritativeInputs']);runtime=table(runtimeNow['authoritativeInputs'])
runtimeRows=[{'path':rel,'declared':pin(x),'currentActual':actual(rel)[0],'exactPhysical':actual(rel)[0]==pin(x),'exactCanonical':rel in current and pin(current[rel])==pin(x)} for rel,x in runtime.items()]
positionsPaths=[x['path'] for x in priorI56['Positions40BuildPins']];positionsRows=[{'path':rel,'before':pin(before[rel]),'currentActual':actual(rel)[0],'currentRuntime':pin(runtime[rel]),'exactUnchanged':actual(rel)[0]==pin(before[rel])==pin(runtime[rel])} for rel in positionsPaths]
accepted=intake['acceptedI56Checkpoint'];acceptedPin,acceptedBody=actual(accepted['path'],True);acceptedJSON=json.loads(acceptedBody);acceptedZip,_,acceptedRows=zip_read(accepted['archive']['path'],table(acceptedJSON['members']))
acceptedBaselineRows=[{'path':x['path'],'acceptedMember':pin(x),'beforeCanonical':pin(before[x['path']]) if x['path'] in before else None,'sameI56CanonicalCheckpoint':pin(before[x['path']])==pin(x) if x['path'] in before else None,'unlistedBeforeDoesNotProveAbsence':x['path'] not in before} for x in acceptedJSON['members']]
manifestBefore=json.loads(zipped[manifestPath]);parent=manifest['parentIterationManifest'];frozenPin,_=actual(parent['path'])
registry=load('data/research-source-registry-0.1.json');upgrade=load('data/research-model-upgrade-registry-0.1.json')
sourceCounts={'sources':len(registry['sources']),'recordSets':sum(len(x['recordSets']) for x in registry['sources']),'profiles':manifest['registrySummary']['sourceProfileCount'],'rosters':manifest['registrySummary']['bundledExactCellProfileRosterCount'],'objects':manifest['registrySummary']['bundledExactSourceObjectSetCount'],'completed':upgrade['summary']['byStatus']['completed'],'upgrades':len(upgrade['upgrades']),'REG':manifest['implementationScope']['atlasRegistrationCount'],'identities':manifest['implementationScope']['exactCrossSourceIdentityCount'],'fullGoalComplete':manifest['implementationScope']['fullGoalComplete']}
explorerBefore=zipped['app/ResearchExplorer.tsx'].decode();explorerNow=actual('app/ResearchExplorer.tsx',True)[1].decode()
fingerprintNames=['ResearchRecordEvidenceFingerprint','ResearchRecordSourceScope','ResearchRecordSelectionDelta','researchActiveSelection']
preservedSelectors=[name for name in fingerprintNames if name in explorerBefore]
selectorsRetained=all(name in explorerNow for name in preservedSelectors)
# Current source/data/Provider/private receipt gates stay exact; this wrapper focuses buttons only.
newComponent=actual('app/ResearchExplorerResultGroup.tsx',True)[1].decode()
logName=engineering.get('log');assert isinstance(logName,str) and not Path(logName).is_absolute() and '..' not in Path(logName).parts
logPath=str((QA/logName).relative_to(ROOT));logPin,logBody=actual(logPath,True);fullCounts={}
for key in ('tests','pass','fail','cancelled','skipped'):
 matches=re.findall(rf'ℹ {key} (\d+)\b',logBody.decode());assert matches,f'Missing final full count {key}';fullCounts[key]=int(matches[-1])
nativeEvidence=[]
for p in sorted(QA.iterdir()):
 if p.is_file() and (p.suffix in {'.png','.txt'} or p.name.startswith('actual-') and p.suffix in {'.json','.mjs'}):nativeEvidence.append({'path':str(p.relative_to(ROOT)),'actual':read(p)[0],'nativeGUIExecutedByThisAudit':False})
checks={'all2573CurrentActualCanonicalPinsExact':len(current)==2573 and all(x['matchesCurrentDeclared'] for x in rows if x['state']!='removed'),'all2570PriorCanonicalInputsRetained':not any(x['state']=='removed' for x in rows),'exactThreeCandidateAndTimelineCanonicalAdmissions':set(current)-set(before)==newExpected and len(newExpected)==3,'allChangesClassified':all(x['classification']!='unclassified_requires_review' for x in changes),'allSixZIPPreimagesExact':len(zipRows)==6 and all(x['exact'] for x in zipRows) and zipPin==pin(intake['preimagesArchive']),'allThreeCandidateTargetsExactlyIntegrated':all(x['exactCandidate'] and x['exactCanonical'] for x in candidateRows),'threePhysicalAbsencePathsNowPresentExactlyDeclared':absences==newExpected and all(actual(x)[0] is not None for x in absences),'candidatePatchExactlySealed':patchPin==pin(intake['patch']),'recipeExactSingleInsertionOnlyThreePinsNoScientificGuardChange':recipeReplay['beforeExact'] and recipeReplay['currentExactlyReplay'] and recipeReplay['expectedAfter']==recipeReplay['reportedAfter'] and len(recipeFix['exactReplacements'])==1 and set(recipeFix['newlyAdmittedPaths'])==newExpected and recipeFix['scientificCountGuardChanges']==0 and recipeFix['runtimeRecipeChanged'] is False,'all2012PriorScientificInputsByteUnchanged':len(science)==2012 and all(x['state']=='unchanged' for x in science),'fourExistingI26RovingInputsBytePreserved':len(reusedRows)==4 and all(x['exactUnchanged'] for x in reusedRows),'currentMultipageLayoutRetainedOutsideExactExplorerSurface':all(x['exactCandidate'] if x['ownedExplorerSurface'] else x['unchanged'] for x in layoutRows),'allElevenPrivateRendererModulesBytePreserved':len(privateRows)==11 and all(x['unchanged'] for x in privateRows),'runtime198MembershipAllActualCanonicalPinsExact':len(runtime)==len(runtimeOld)==198 and set(runtime)==set(runtimeOld) and all(x['exactPhysical'] and x['exactCanonical'] for x in runtimeRows),'Positions40InputsMembershipAndBytesUnchanged':len(positionsRows)==40 and all(x['exactUnchanged'] for x in positionsRows),'currentSourceAndGoalBoundariesRetained':sourceCounts=={'sources':32,'recordSets':42,'profiles':387,'rosters':13,'objects':4,'completed':83,'upgrades':243,'REG':0,'identities':0,'fullGoalComplete':False},'originalExplorerEvidenceSelectorsRetained':selectorsRetained,'newWrapperUsesExistingRovingFocusAndExistingSourceOwnership': 'useSourceListRovingFocus' in newComponent and 'onSelect' in newComponent,'acceptedI56Archive62MembersBoundToCompletedI56Epoch':len(acceptedRows)==62 and all(x['exact'] for x in acceptedRows) and acceptedPin==pin(accepted) and acceptedZip==pin(accepted['archive']) and acceptedJSON['canonicalEpoch']==accepted['canonicalEpoch'] and all(x['sameI56CanonicalCheckpoint'] for x in acceptedBaselineRows if x['beforeCanonical'] is not None),'frozen290DescriptorAndActualParentPreserved':parent==manifestBefore['parentIterationManifest'] and frozenPin=={'bytes':parent['bytes'],'sha256':parent['fileSha256']},'successfulFinalFullRunExactEngineeringLogAndCounts':fullCounts['fail']==fullCounts['cancelled']==0 and fullCounts['tests']==fullCounts['pass']+fullCounts['skipped'] and logPin==pin(engineering['logPin']) and fullCounts==engineering['tests'],'actualNativeQAPresentAndRetainedEvidenceWithoutIndependentGUIClaim':bool(native) and bool(nativeEvidence)}
critical=[]
for rel in sorted(set(targets)|rootDocs|{manifestPath,runtimePath,recipePath,summaryPath}):
 first=actual(rel)[0];last,_=actual(rel,False,True);critical.append({'path':rel,'start':first,'end':last,'stable':first==last})
epochEnd=actual(manifestPath)[0];checks['manifestAndCriticalEpochStableThroughoutAudit']=epochStart==epochEnd and all(x['stable'] for x in critical)
result={'increment':'I57','status':'PASS' if all(checks.values()) else 'FAIL','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Existing verified Explorer namespace groups focus-only keyboard navigation; complete scientific and Goal scope preserved','sharedRootWrites':0,'parentStageWrites':0,'readContract':stats,'elapsedSeconds':time.time()-started,'checks':checks,'summary':{'beforeCanonical':len(before),'currentCanonical':len(current),'comparisonCounts':counts,'allScientificInputsUnchanged':len(science),'preimages':6,'physicalAbsences':3,'candidatePaths':3,'canonicalAdmissions':3,'runtime':198,'positionsBuild':40,'sourceCounts':sourceCounts,'actualFullCounts':fullCounts},'manifestEpoch':{'start':epochStart,'end':epochEnd,'criticalInputs':critical},'fullAuthoritativeInputComparison':rows,'changedOrAddedClassifications':changes,'ZIPBeforeBytes':{'actual':zipPin,'rows':zipRows},'candidateThreePathParity':candidateRows,'rootRecipeExactReplay':recipeReplay,'scientificInputs':science,'newMultipageLayoutPreservation':layoutRows,'I26RovingReusableInputPreservation':reusedRows,'privateRendererPreservation':privateRows,'runtimeCurrentPins':runtimeRows,'runtimeExistingFingerprintChanges':[rel for rel in runtimeOld if pin(runtimeOld[rel])!=pin(runtime[rel])],'Positions40BuildPreservation':positionsRows,'acceptedPriorI56Checkpoint':{'JSONActual':acceptedPin,'ZIPActual':acceptedZip,'members':acceptedRows,'baselineMatches':acceptedBaselineRows,'comparedToFutureLiveRoot':False},'frozen290':{'descriptor':parent,'actual':frozenPin,'fullSnapshotValidators':'Parent current full research suite owns full snapshot validators; no absent historical row is fabricated.'},'finalEngineeringReported':engineering,'actualFullLog':{'path':logPath,'actual':logPin,'counts':fullCounts},'actualBrowserReported':native,'nativeEvidenceByteReceipts':nativeEvidence,'failedAttemptsReported':summary.get('failedAttempts',[]),'unverifiedReported':summary.get('unverified',summary.get('remainingQA',[])),'limitations':['This preservation replay reads actual source/code/QA bytes; it does not perform native GUI/keyboard/download/pixel checks.','Focus-only arrow/Home/End group movement does not create source selection, comparison, identity, biological data or source render proof.','Existing Enter/Space activation remains owned by current source button/Provider gates; parent native QA remains separately attributed.','32sources/42sets/13rosters/4objects/387profiles/83completed/243 Goal entries and full F01–F20/M0–M4/243+21 scope remain unchanged.']}
target=OUT/'I57_FINAL_PRESERVATION.json';target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'receipt':str(target),'status':result['status'],'summary':result['summary'],'failedChecks':[k for k,v in checks.items() if not v],'epoch':epochEnd,'readContract':stats},indent=2))
if not all(checks.values()):raise SystemExit(1)
