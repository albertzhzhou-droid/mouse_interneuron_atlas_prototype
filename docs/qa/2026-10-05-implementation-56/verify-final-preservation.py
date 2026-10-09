#!/usr/bin/env python3
"""I56 independent final preservation. Execute only after parent's final epoch notice.
Read-only shared root/stage; every generated replay or receipt is in this temp folder.
"""
from pathlib import Path
import collections, datetime, hashlib, importlib.util, io, json, os, re, subprocess, sys, time, zipfile
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA=ROOT/'docs/qa/2026-10-05-implementation-56'
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
summaryPath='docs/qa/2026-10-05-implementation-56/verification-summary.json'
if not (ROOT/summaryPath).is_file():raise RuntimeError('Wait for parent final I56 epoch: successful engineering and native QA summary required')
summary=load(summaryPath);engineering=summary.get('engineering');native=summary.get('actualBrowser')
if not isinstance(engineering,dict) or engineering.get('exitCode')!=0 or not isinstance(native,dict):raise RuntimeError('I56 final successful engineering/native epoch is not available')
manifestPath='data/research-iteration-manifest-2.91.json';runtimePath='data/research-renderer-runtime-inputs-2.91.json'
epochStart,manifestBody=actual(manifestPath,True);manifest=json.loads(manifestBody)
current=table(manifest['authoritativeInputs']);assert len(current)==2570,'Expected final I56 canonical2570 epoch'
intake=load('docs/qa/2026-10-05-implementation-56/intake-preservation.json')
before=table(intake['baselineInputs']);owned=table(intake['preimages']);targets=table(intake['candidateTargets']);absences=set(intake['newPathAbsence'])
assert len(before)==2549 and len(owned)==15 and len(targets)==28 and len(absences)==19
timeline=intake['timeline'];rootDocs={'docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md',timeline}
newExpected=set(intake['newCanonicalCandidatePaths'])|{timeline}
assert len(newExpected)==21 and set(current)-set(before)==newExpected
def classify(rel,state):
 if state=='unchanged':return 'prior_current_input_byte_preserved'
 if rel in targets:return 'exact_I56_core17_or_AFTER_I55_addon11_candidate'
 if rel in rootDocs:return 'root_owned_bounded_I56_document'
 if rel=='tools/build_research_iteration_manifest_2_91.mjs':return 'exact_recorded_21_pin_and_32_42_guard_recipe_delta'
 if rel==runtimePath:return 'regenerated_runtime_input_transport_same_198_membership'
 return 'unclassified_requires_review'
rows=[]
for rel in sorted(set(before)|set(current)):
 now,_=actual(rel);state='removed' if rel not in current else 'added' if rel not in before else 'unchanged' if now==pin(before[rel]) else 'changed'
 rows.append({'path':rel,'state':state,'beforeAuthoritative':pin(before[rel]) if rel in before else None,'currentDeclared':pin(current[rel]) if rel in current else None,'currentActual':now,'matchesCurrentDeclared':rel in current and now==pin(current[rel]),'classification':classify(rel,state),'beforePhysicalAbsenceExplicitlyRecorded':rel in absences,'addedPinDoesNotProveCreation':state=='added' and rel not in absences})
counts=dict(collections.Counter(x['state'] for x in rows));changes=[x for x in rows if x['state']!='unchanged']
zipPin,zipped,zipRows=zip_read(intake['preimagesArchive']['path'],owned)
panelFix=load('docs/qa/2026-10-05-implementation-56/root-source-statement-render-fix.json')
panelPath=panelFix['path'];panelArchiveRel=str((QA/panelFix['beforeArchive']).relative_to(ROOT));panelZip,panelBodies,panelZipRows=zip_read(panelArchiveRel,{panelPath:{'path':panelPath,**panelFix['before']}})
panelBefore=panelBodies[panelPath];assert panelBefore.count(panelFix['exactBefore'].encode())==1
panelExpected=panelBefore.replace(panelFix['exactBefore'].encode(),panelFix['exactAfter'].encode())
panelReplay={'recorded':panelFix,'archiveActual':panelZip,'archiveRows':panelZipRows,'expectedAfter':{'bytes':len(panelExpected),'sha256':hashlib.sha256(panelExpected).hexdigest()},'currentExactlyOneSourceRawFragmentRenderDelta':actual(panelPath,True)[1]==panelExpected,'beforeExactlyCandidate':pin(panelFix['before'])==pin(targets[panelPath]['proposed'])}
candidateRows=[{'path':rel,'candidate':row['candidate'],'recordedBefore':row['before'],'sealedProposed':pin(row['proposed']),'currentActual':actual(rel)[0],'exactProposed':actual(rel)[0]==pin(row['proposed']),'rootOwnedSourceRawFragmentDeltaOnly':rel==panelPath and actual(rel,True)[1]==panelExpected,'accepted':actual(rel)[0]==pin(row['proposed']) or (rel==panelPath and actual(rel,True)[1]==panelExpected),'canonicalMatches':rel in current and actual(rel)[0]==pin(current[rel])} for rel,row in targets.items()]
patchRows=[{'path':x['path'],'expected':pin(x),'actual':read(x['path'])[0],'exact':read(x['path'])[0]==pin(x)} for x in intake['patches']]
absenceRows=[{'path':rel,'beforeAbsenceRecorded':True,'currentActual':actual(rel)[0],'currentCanonical':rel in current,'ownedCandidate':rel in targets,'candidateExact':(actual(rel)[0]==pin(targets[rel]['proposed']) or rel==panelPath and actual(rel,True)[1]==panelExpected) if rel in targets else None,'rootTimeline':rel==timeline} for rel in sorted(absences)]
recipeFix=load('docs/qa/2026-10-05-implementation-56/root-recipe-admission.json');recipePath=recipeFix['path'];recipeExpected=zipped[recipePath]
for delta in recipeFix['exactReplacements']:
 old,new=delta['before'].encode(),delta['after'].encode();assert recipeExpected.count(old)==1
 recipeExpected=recipeExpected.replace(old,new)
recipeReplay={'beforeExact':pin(recipeFix['before'])==pin(owned[recipePath]),'exactReplacementCount':len(recipeFix['exactReplacements']),'expectedAfter':{'bytes':len(recipeExpected),'sha256':hashlib.sha256(recipeExpected).hexdigest()},'reportedAfter':pin(recipeFix['after']),'currentActual':actual(recipePath)[0],'currentEqualsExactReplay':actual(recipePath,True)[1]==recipeExpected,'newlyAdmittedPaths':recipeFix['newlyAdmittedPaths']}
science=[row for row in rows if row['path'].startswith(('data/','public/data/')) and row['path'] not in {manifestPath,runtimePath}]
priorScience=[x for x in science if x['path'] in before];newScience=[x for x in science if x['path'] not in before]
ownedScience={'data/research-source-registry-0.1.json','data/research-model-upgrade-registry-0.1.json'}
nonownedScience=[x for x in priorScience if x['path'] not in ownedScience]
sourcesBefore=json.loads(zipped['data/research-source-registry-0.1.json']);sourcesNow=load('data/research-source-registry-0.1.json')
oldSources=sourcesBefore['sources'];newSources=sourcesNow['sources'];newSource=newSources[-1]
upgradeBefore=json.loads(zipped['data/research-model-upgrade-registry-0.1.json']);upgradeNow=load('data/research-model-upgrade-registry-0.1.json')
oldUpgrades={x['id']:x for x in upgradeBefore['upgrades']};newUpgrades={x['id']:x for x in upgradeNow['upgrades']}
changedUpgradeIds=[k for k in oldUpgrades if oldUpgrades[k]!=newUpgrades[k]]
facts=load('data/garcia-ramirez-adult-spinal-physiology-0.1.json');scope=facts['studyScope'];pool=scope['recordedPool'];boundary=scope['interpretationBoundary']
groupCounts=[[g['recordedObservationCount'] for g in t['groups']] for t in facts['tables']]
sourceInputRows=[]
sourceBase='data/source-candidates/garcia-ramirez-physiology-20261004/'
for x in facts['source']['inputPins']:
 rel=sourceBase+x['fileName'];value,_=actual(rel);sourceInputRows.append({'path':rel,'expected':pin(x),'actual':value,'exact':value==pin(x)})
# Re-extract original DOCX/XML into a temporary directory; default main/output is never invoked.
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('i56_source_independent_replay',ROOT/'tools/extract_garcia_ramirez_physiology.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
sourceReplay=OUT/'source-replay';sourceReplay.mkdir(exist_ok=True)
module.extract(ROOT/sourceBase,sourceReplay)
sourceReplayRows=[]
for name in ('garcia-ramirez-adult-spinal-physiology-0.1.json','garcia-ramirez-adult-spinal-physiology-derivation-receipt-0.1.json'):
 value,_=read(sourceReplay/name);rootPin,_=actual('data/'+name);sourceReplayRows.append({'name':name,'replayed':value,'current':rootPin,'exact':value==rootPin})
runtimeBefore=json.loads(zipped[runtimePath]);runtimeNow=load(runtimePath);runtimeOld=table(runtimeBefore['authoritativeInputs']);runtime=table(runtimeNow['authoritativeInputs'])
runtimeRows=[{'path':rel,'currentDeclared':pin(row),'currentActual':actual(rel)[0],'exactActual':actual(rel)[0]==pin(row),'exactCanonical':rel in current and pin(current[rel])==pin(row)} for rel,row in runtime.items()]
i55=json.loads(read('/private/tmp/ohri-i55-final-preservation-20261004/I55_FINAL_PRESERVATION.json',True)[1]);layoutPaths={x['path'] for x in i55['newMultipageLayoutPreservation']}|{'app/AdditionalResearchEvidence.tsx','tests/research-source-drilldown-component.test.mjs','app/SourceRecordSetNavigation.module.css','app/research-source-drilldown.js'}
layoutRows=[{'path':rel,'before':pin(before[rel]),'currentActual':actual(rel)[0],'unchanged':actual(rel)[0]==pin(before[rel]),'ownedI56AdditionalEvidenceSurface':rel=='app/AdditionalResearchEvidence.tsx','exactCoreCandidate':rel in targets and actual(rel)[0]==pin(targets[rel]['proposed'])} for rel in sorted(layoutPaths)]
privateRows=[{'path':x['path'],'before':pin(before[x['path']]),'currentActual':actual(x['path'])[0],'unchanged':actual(x['path'])[0]==pin(before[x['path']])} for x in i55['privateRendererPreservation']]
positionsPaths=[x['path'] for x in i55['PositionsClosureCurrentPins']];positionsRows=[{'path':rel,'currentActual':actual(rel)[0],'currentRuntime':pin(runtime[rel]),'exact':actual(rel)[0]==pin(runtime[rel])} for rel in positionsPaths]
# Bind accepted I55 archive to its own completed epoch, never to later I56 live bytes.
accepted=intake['acceptedI55Checkpoint'];acceptedPin,acceptedBody=actual(accepted['path'],True);acceptedJSON=json.loads(acceptedBody)
acceptedZip,_,acceptedRows=zip_read(accepted['archive']['path'],table(acceptedJSON['members']))
acceptedEpochBaselineMatch=all(pin(before[x['path']])==pin(x) for x in acceptedJSON['members'] if x['path'] in before)
manifestBefore=json.loads(zipped[manifestPath]);parent=manifest['parentIterationManifest'];frozenPin,_=actual(parent['path'])
node='/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
run=subprocess.run([node,str(OUT/'audit_i56_destination_metadata.mjs')],capture_output=True,text=True);(OUT/'I56_DESTINATION_METADATA_AUTHORITY.log').write_text(run.stdout+run.stderr);assert run.returncode==0,run.stderr
nav=json.loads(read(OUT/'I56_DESTINATION_METADATA_AUTHORITY.json',True)[1])
logName=engineering.get('log');assert isinstance(logName,str) and not Path(logName).is_absolute() and '..' not in Path(logName).parts
logPath=str((QA/logName).relative_to(ROOT));logPin,logBody=actual(logPath,True);assert logBody
fullCounts={}
for name in ('tests','pass','fail','cancelled','skipped'):
 matches=re.findall(rf'ℹ {name} (\d+)\b',logBody.decode());assert matches,f'Missing full run count {name}';fullCounts[name]=int(matches[-1])
nativeEvidence=[]
for p in sorted(QA.iterdir()):
 if p.is_file() and (p.suffix in {'.png','.txt'} or p.name.startswith('actual-') and p.suffix in {'.json','.mjs'}):nativeEvidence.append({'path':str(p.relative_to(ROOT)),'actual':read(p)[0],'nativeGUIExecutedByThisAudit':False})
sourceCounts={'sources':len(newSources),'recordSets':sum(len(x['recordSets']) for x in newSources),'rosters':manifest['registrySummary']['bundledExactCellProfileRosterCount'],'objectSets':manifest['registrySummary']['bundledExactSourceObjectSetCount'],'profiles':manifest['registrySummary']['sourceProfileCount'],'completed':upgradeNow['summary']['byStatus']['completed'],'upgrades':len(newUpgrades),'registrations':manifest['implementationScope']['atlasRegistrationCount'],'identities':manifest['implementationScope']['exactCrossSourceIdentityCount'],'fullGoalComplete':manifest['implementationScope']['fullGoalComplete']}
checks={
 'all2570CanonicalActualPinsExact':all(x['matchesCurrentDeclared'] for x in rows if x['state']!='removed'),
 'all2549PriorCanonicalInputsRetained':not any(x['state']=='removed' for x in rows),
 'exact21CanonicalAdmissionsIncludingTwoExistingTests':set(current)-set(before)==newExpected and len(newExpected)==21,
 'allChangesClassified':not any(x['classification']=='unclassified_requires_review' for x in changes),
 'all15OwnedZIPPreimagesExact':len(zipRows)==15 and all(x['exact'] for x in zipRows) and zipPin==pin(intake['preimagesArchive']),
 '27CandidateTargetsExactAndOneBoundedSourceRawFragmentRenderDelta':sum(x['exactProposed'] for x in candidateRows)==27 and sum(x['rootOwnedSourceRawFragmentDeltaOnly'] for x in candidateRows)==1 and all(x['accepted'] and x['canonicalMatches'] for x in candidateRows) and panelReplay['beforeExactlyCandidate'] and panelReplay['currentExactlyOneSourceRawFragmentRenderDelta'] and panelReplay['expectedAfter']==pin(panelFix['after']),
 'bothCandidatePatchesExactlySealed':len(patchRows)==2 and all(x['exact'] for x in patchRows),
 'all19PhysicalAbsencesNowPresentWithBoundedAuthority':all(x['currentCanonical'] and (x['candidateExact'] if x['ownedCandidate'] else x['rootTimeline']) for x in absenceRows),
 'recipeExactly21AdmissionsAndTwo32_42GuardReplacements':recipeReplay['beforeExact'] and recipeReplay['currentEqualsExactReplay'] and recipeReplay['expectedAfter']==recipeReplay['reportedAfter'] and set(recipeFix['newlyAdmittedPaths'])==newExpected and len(recipeFix['exactReplacements'])==2,
 'all2003NonownedPriorScientificInputsUnchanged':len(nonownedScience)==2003 and all(x['state']=='unchanged' for x in nonownedScience),
 'twoOwnedScientificRegistryDeltasOnlyAndSevenNewSourcePins':len(priorScience)==2005 and len(newScience)==7 and {x['path'] for x in priorScience if x['state']!='unchanged'}==ownedScience,
 'all31PriorSourceObjectsDeepEqualInSameOrder':len(oldSources)==31 and len(newSources)==32 and newSources[:31]==oldSources,
 'onlyUPG173ChangedAmong243UpgradeObjects':set(oldUpgrades)==set(newUpgrades) and changedUpgradeIds==['UPG-173'],
 'strictSourceAndGoalBoundariesRetained':sourceCounts=={'sources':32,'recordSets':42,'rosters':13,'objectSets':4,'profiles':387,'completed':83,'upgrades':243,'registrations':0,'identities':0,'fullGoalComplete':False},
 'one171PoolFourAlternativePartitionsNo684Sum':pool['value']==171 and [pool['Shox2'],pool['Chx10']]==[143,28] and pool['independentAnimalCount'] is None and pool['cellToAnimalMapping'] is None and groupCounts==[[143,28],[88,49,24,10],[23,11,68,69],[15,20,32,25,27,52]] and all(t['sourceRecordedPoolDenominatorId']==pool['id'] and t['groupCountSum']==171 for t in facts['tables']),
 'mouseCohortsAndPriorReuseKeptNested': [x['reportedMice'] for x in scope['animalCohorts']]==[51,6] and scope['priorStudyReuse']['recordedShox2Observations']==60 and scope['priorStudyReuse']['reportedMice']==28 and scope['priorStudyReuse']['isSubsetOfCurrentShox2Cohort'],
 'aggregateDoesNotPromoteCellsProfilesGeometryIdentityREGM2M4':all(boundary[k]==0 for k in ('newMolecularProfiles','newPhysicalCellRosterRows','newObservedGeometryObjects','sameCellCrossSourceJoins','registrations','M2Admission','M4Admission')),
 'threeExactOriginalSourceInputsAndFullExtractorReplay':len(sourceInputRows)==3 and all(x['exact'] for x in sourceInputRows) and all(x['exact'] for x in sourceReplayRows),
 'current274MetadataDestinationsAndNewAggregateUnavailable':nav['status']=='PASS' and nav['navigationActions']==274 and nav['availableRecordSets']==15 and nav['aggregateNotExactNavigation'] and nav['allReceiptsMetadataOnly'],
 'currentMultipageLayoutPreservedOutsideExactAdditionalEvidenceSurface':all(x['exactCoreCandidate'] if x['ownedI56AdditionalEvidenceSurface'] else x['unchanged'] for x in layoutRows),
 'privateRendererModulesAndI55InertSSRAppendBytePreserved':all(x['unchanged'] for x in privateRows) and actual('tests/research-source-drilldown-component.test.mjs')[0]==pin(before['tests/research-source-drilldown-component.test.mjs']),
 'runtime198SameMembershipActualCanonicalPinsExact':len(runtime)==len(runtimeOld)==198 and set(runtime)==set(runtimeOld) and all(x['exactActual'] and x['exactCanonical'] for x in runtimeRows),
 'Positions40BuildPathMembershipRetained':len(positionsPaths)==40 and all(x['exact'] for x in positionsRows),
 'acceptedI55Archive37MembersBoundToI55CompletedCheckpoint':len(acceptedRows)==37 and all(x['exact'] for x in acceptedRows) and acceptedPin==pin(accepted) and acceptedZip==pin(accepted['archive']) and acceptedJSON['canonicalEpoch']==accepted['canonicalEpoch'] and acceptedEpochBaselineMatch,
 'frozen290DescriptorAndActualFilePreserved':parent==manifestBefore['parentIterationManifest'] and frozenPin=={'bytes':parent['bytes'],'sha256':parent['fileSha256']},
 'reportedSuccessfulFinalFullRunAndExactLogPinCounts':fullCounts['fail']==fullCounts['cancelled']==0 and fullCounts['tests']==fullCounts['pass']+fullCounts['skipped'] and logPin==pin(engineering['logPin']) and fullCounts==engineering['tests'],
 'actualNativeQAPresentAndEvidenceRetainedWithoutIndependentGUIClaim':bool(native) and bool(nativeEvidence),
 }
critical=[]
for rel in sorted(set(targets)|rootDocs|{manifestPath,runtimePath,recipePath,summaryPath}):
 first=actual(rel)[0];last,_=actual(rel,False,True);critical.append({'path':rel,'start':first,'end':last,'stable':first==last})
epochEnd=actual(manifestPath)[0];checks['criticalInputEpochStableThroughAudit']=epochStart==epochEnd and all(x['stable'] for x in critical)
result={'increment':'I56','status':'PASS' if all(checks.values()) else 'FAIL','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'One source-owned aggregate physiology information adapter; original full Goal remains active','sharedRootWrites':0,'parentStageWrites':0,'readContract':stats,'elapsedSeconds':time.time()-started,'checks':checks,'summary':{'beforeCanonical':len(before),'currentCanonical':len(current),'comparisonCounts':counts,'priorScience':len(priorScience),'nonownedScientificUnchanged':len(nonownedScience),'newScientificInputs':len(newScience),'preimages':15,'physicalAbsences':19,'candidateTargets':28,'canonicalAdmissions':21,'runtime':198,'positionsBuild':40,'sourceCounts':sourceCounts,'fullTestCounts':fullCounts},'manifestEpoch':{'start':epochStart,'end':epochEnd,'criticalInputs':critical},'fullAuthoritativeInputComparison':rows,'changedOrAddedClassifications':changes,'preimagesArchive':{'actual':zipPin,'rows':zipRows},'newPhysicalAbsenceComparison':absenceRows,'rootOwnedSourceStatementRenderReplay':panelReplay,'exactCandidateIntegration':candidateRows,'candidatePatches':patchRows,'rootRecipeReplay':recipeReplay,'scientificInputPreservation':science,'sourceRegistryParity':{'oldSourceObjectsUnchanged':newSources[:31]==oldSources,'newSource':newSource},'upgradeRegistryParity':{'changedIds':changedUpgradeIds,'currentUPG173':newUpgrades['UPG-173']},'aggregateScientificReplay':{'pool':pool,'groupCounts':groupCounts,'animalCohorts':scope['animalCohorts'],'priorReuse':scope['priorStudyReuse'],'boundary':boundary,'sourceInputPins':sourceInputRows,'sourceExactExtractorReplay':sourceReplayRows,'rawSourceDiscrepanciesRetained':facts['rawSourceDiscrepancies'],'statisticalReanalysisPerformed':facts['derivation']['statisticalReanalysisPerformed']},'newMultipageLayoutPreservation':layoutRows,'privateRendererPreservation':privateRows,'runtimeCurrentPins':runtimeRows,'runtimeChangedExistingFingerprints':[rel for rel in runtimeOld if pin(runtimeOld[rel])!=pin(runtime[rel])],'Positions40BuildPins':positionsRows,'metadataNavigationAuthority':{'path':str(OUT/'I56_DESTINATION_METADATA_AUTHORITY.json'),'actual':read(OUT/'I56_DESTINATION_METADATA_AUTHORITY.json')[0],'summary':{k:nav[k] for k in ('sourceCount','recordSetCount','bundledRosters','bundledObjects','availableRecordSets','navigationActions','aggregatePhysiology','aggregateRegistryRelationship','aggregateNotExactNavigation')}},'acceptedPriorI55Checkpoint':{'currentArchivedJSON':acceptedPin,'archiveActual':acceptedZip,'memberRows':acceptedRows,'comparisonAgainstFutureLiveRoot':False,'canonicalEpoch':accepted['canonicalEpoch']},'frozen290':{'descriptor':parent,'actual':frozenPin,'existingSnapshotValidatorsScope':'Parent current full research suite executes full snapshot validators; this independent audit preserves frozen actual file/descriptor without fabricating absent historical rows.'},'finalEngineeringReported':engineering,'actualFinalLog':{'path':logPath,'actual':logPin,'counts':fullCounts},'actualBrowserReported':native,'nativeEvidenceByteReceipts':nativeEvidence,'unverifiedReported':summary.get('unverified',summary.get('remainingQA',[])),'failedAttemptsReported':summary.get('failedAttempts',[]),'limitations':['No independent native browser, download, viewport, screenreader or performance actions executed here.','Package fingerprint changes intentionally invalidate previous-epoch source-view build proofs; this audit does not reuse old captured receipts as new authority.','Four group partitions share one171 source-recorded pool; no new physical-cell roster, profile, morphology, identity, REG, M2 or M4 admission.','Strict83/243 and complete F01–F20/M0–M4/243+21 Goal remain unchanged.']}
target=OUT/'I56_FINAL_PRESERVATION.json';target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'receipt':str(target),'status':result['status'],'summary':result['summary'],'failedChecks':[k for k,v in checks.items() if not v],'epoch':epochEnd,'readContract':stats},indent=2))
if not all(checks.values()):raise SystemExit(1)
