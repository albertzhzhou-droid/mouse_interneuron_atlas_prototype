#!/usr/bin/env python3
"""Prepared I55 final preservation replay. Run only after parent final QA/doc epoch notice.
Shared root and parent stage remain read-only; all audit outputs are temporary.
"""
from pathlib import Path
import collections,datetime,difflib,hashlib,io,json,os,re,subprocess,time,zipfile
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA=ROOT/'docs/qa/2026-10-04-implementation-55'
OUT=Path(__file__).resolve().parent
CANDIDATE=Path('/private/tmp/ohri-i55-rebased-current-i54-20261004')
cache,contents={},{}
stats={'strategy':'full_file_os_pread_4096_byte_chunks','chunkBytes':4096,'preadCalls':0,'bytesRead':0,'filesRead':0}
started=time.time()
def read(path,keep=False,fresh=False):
 path=Path(path)
 if not fresh and path in cache and (not keep or path in contents):return cache[path],contents.get(path)
 fd=os.open(path,os.O_RDONLY);h=hashlib.sha256();parts=[];offset=0
 try:
  a=os.fstat(fd)
  while True:
   block=os.pread(fd,4096,offset);stats['preadCalls']+=1
   if not block:break
   h.update(block);offset+=len(block);stats['bytesRead']+=len(block)
   if keep:parts.append(block)
  z=os.fstat(fd);assert (a.st_ino,a.st_size,a.st_mtime_ns)==(z.st_ino,z.st_size,z.st_mtime_ns) and offset==z.st_size,('Changed/incomplete read',path)
 finally:os.close(fd)
 value={'bytes':offset,'sha256':h.hexdigest()};cache[path]=value;stats['filesRead']+=1
 if keep:contents[path]=b''.join(parts)
 return value,contents.get(path) if keep else None
def actual(rel,keep=False,fresh=False):return read(ROOT/rel,keep,fresh) if (ROOT/rel).is_file() else (None,None)
def load(rel):return json.loads(actual(rel,True)[1])
def pin(row):return {k:row[k] for k in ['bytes','sha256']}
def table(rows):
 value={row['path']:row for row in rows};assert len(value)==len(rows),'Duplicate path';return value
# No incomplete native/engineering state is promoted by merely running this helper.
summaryPath='docs/qa/2026-10-04-implementation-55/verification-summary.json'
if not (ROOT/summaryPath).is_file():raise RuntimeError('Final I55 engineering/native QA summary is not available; wait for parent final epoch notice')
summary=load(summaryPath)
engineering=summary.get('engineering')
native=summary.get('actualBrowser')
if not isinstance(engineering,dict) or engineering.get('exitCode')!=0 or not isinstance(native,dict):raise RuntimeError('Final successful engineering and actual browser QA must be present before I55 preservation closure replay')
manifestPath='data/research-iteration-manifest-2.91.json';epochStart,body=actual(manifestPath,True);manifest=json.loads(body)
assert len(manifest['authoritativeInputs'])==2549,'Expected final I55 canonical2549 epoch'
intake=load('docs/qa/2026-10-04-implementation-55/intake-preservation.json')
candidate= json.loads(read(CANDIDATE/'I55_CURRENT_I54_VERIFICATION_RECEIPT.json',True)[1])
before=table(intake['baselineInputs']);current=table(manifest['authoritativeInputs']);owned=table(intake['preimages']);absences=set(intake['newPathAbsence']);candidateRows=table(candidate['touchedPaths'])
assert len(before)==2541 and len(owned)==8 and len(absences)==7 and len(candidateRows)==10
assert set(table(intake['candidateTouchedPaths']))==set(candidateRows)
timeline='docs/RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_55_SOURCE_NAVIGATION.md'
rootDocs={'docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md',timeline}
newExpected=set(absences)|{'app/ResearchSourceRegistry.tsx'}
def classify(rel,state):
 if state=='unchanged':return 'prior_current_input_byte_preserved'
 if rel in candidateRows:return 'sealed_ten_path_I55_candidate_or_exact_recorded_root_recipe_visual_or_initialization_delta'
 if rel in rootDocs:return 'root_owned_bounded_I55_scope_document'
 if rel=='data/research-renderer-runtime-inputs-2.91.json':return 'regenerated_current_runtime_input_transport'
 return 'unclassified_requires_review'
rows=[]
for rel in sorted(set(before)|set(current)):
 now,_=actual(rel);state='removed' if rel not in current else 'added' if rel not in before else 'unchanged' if now==pin(before[rel]) else 'changed'
 rows.append({'path':rel,'state':state,'beforeAuthoritative':pin(before[rel]) if rel in before else None,'currentDeclared':pin(current[rel]) if rel in current else None,'currentActual':now,'matchesCurrentDeclared':now==pin(current[rel]) if rel in current else None,'classification':classify(rel,state),'beforePhysicalAbsenceExplicitlyRecorded':rel in absences,'addedPinDoesNotProveFileCreation':state=='added' and rel not in absences})
counts=dict(collections.Counter(x['state'] for x in rows));changes=[x for x in rows if x['state']!='unchanged']
zipReceipt,zipBody=actual('docs/qa/2026-10-04-implementation-55/preimages.zip',True);archive=zipfile.ZipFile(io.BytesIO(zipBody));names=archive.namelist();assert len(names)==len(set(names)) and set(names)==set(owned)
zipped={};zipRows=[]
for rel in names:
 assert not rel.startswith('/') and '..' not in Path(rel).parts
 h=hashlib.sha256();parts=[];length=0
 with archive.open(rel) as handle:
  while block:=handle.read(4096):h.update(block);parts.append(block);length+=len(block)
 value={'bytes':length,'sha256':h.hexdigest()};zipped[rel]=b''.join(parts)
 zipRows.append({'path':rel,'recordedBefore':pin(owned[rel]),'archivedActual':value,'archiveExactlyBefore':value==pin(owned[rel]),'currentActual':actual(rel)[0]})
candidateParity=[]
recipePath='tools/build_research_iteration_manifest_2_91.mjs';timelineLine=f'  "{timeline}",\n'.encode()
styleFixPath='docs/qa/2026-10-04-implementation-55/root-scoped-search-visibility-fix.json'
styleFixReceipt,styleFixBody=actual(styleFixPath,True);styleFix=json.loads(styleFixBody)
stylePath='app/SourceRecordSetNavigation.module.css'
assert styleFix['path']==stylePath
styleBeforeReceipt,styleBeforeBody=actual('docs/qa/2026-10-04-implementation-55/candidate-style-before-visibility-fix.css',True)
assert styleBeforeReceipt==pin(styleFix['before'])==pin(candidateRows[stylePath]['proposed'])
styleBeforeLine=styleFix['exactBeforeLine'].encode();styleAfterLines=styleFix['exactAfterLines'].encode()
assert styleBeforeBody.count(styleBeforeLine)==1
styleExpected=styleBeforeBody.replace(styleBeforeLine,styleAfterLines)
rootCorrectionExpected={stylePath:styleExpected}
initializationFixPath='docs/qa/2026-10-04-implementation-55/root-source-initialization-gate.json'
regressionFixPath='docs/qa/2026-10-04-implementation-55/root-source-initialization-regression.json'
initializationFixActual,initializationFixBody=actual(initializationFixPath,True);initializationFix=json.loads(initializationFixBody)
regressionFixActual,regressionFixBody=actual(regressionFixPath,True);regressionFix=json.loads(regressionFixBody)
rootCorrectionZipActual,rootCorrectionZipBody=actual('docs/qa/2026-10-04-implementation-55/root-source-initialization-preimage.zip',True)
rootCorrectionZip=zipfile.ZipFile(io.BytesIO(rootCorrectionZipBody))
assert len(rootCorrectionZip.namelist())==2 and set(rootCorrectionZip.namelist())=={initializationFix['path'],regressionFix['path']}
rootCorrectionRows=[]
for correction in [initializationFix,regressionFix]:
 rel=correction['path'];assert correction['beforeArchive']=='root-source-initialization-preimage.zip'
 assert pin(correction['before'])==pin(candidateRows[rel]['proposed'])
 h=hashlib.sha256();parts=[];length=0
 with rootCorrectionZip.open(rel) as handle:
  while block:=handle.read(4096):h.update(block);parts.append(block);length+=len(block)
 archived={'bytes':length,'sha256':h.hexdigest()};archivedBody=b''.join(parts)
 assert archived==pin(correction['before']) and archivedBody==read(CANDIDATE/'proposed'/rel,True)[1]
 expected=archivedBody
 if rel==initializationFix['path']:
  assert rel=='app/ResearchSourceRegistry.tsx' and len(correction['exactReplacements'])==4
  for delta in correction['exactReplacements']:
   prior=delta['before'].encode();after=delta['after'].encode();assert expected.count(prior)==1
   expected=expected.replace(prior,after)
 else:
  assert rel=='tests/research-source-drilldown-component.test.mjs'
  expected+=correction['exactAppend'].encode()
 assert {'bytes':len(expected),'sha256':hashlib.sha256(expected).hexdigest()}==pin(correction['after'])
 rootCorrectionExpected[rel]=expected
 rootCorrectionRows.append({'path':rel,'recorded':correction,'candidateBeforeArchiveActual':archived,'exactlyCandidateBefore':True,'exactExpectedAfter':pin(correction['after']),'scope':'four exact initialization replacements' if rel==initializationFix['path'] else 'one exact meaningful SSR regression append'})
for rel,row in candidateRows.items():
 now,nowBody=actual(rel,True);proposed,proposedBody=read(CANDIDATE/'proposed'/rel,True)
 timelineOnly=rel==recipePath and nowBody.count(timelineLine)==1 and nowBody.replace(timelineLine,b'')==proposedBody
 styleOnly=rel==stylePath and proposedBody==styleBeforeBody and nowBody==styleExpected and now==pin(styleFix['after'])
 correctionOnly=rel in rootCorrectionExpected and nowBody==rootCorrectionExpected[rel]
 candidateParity.append({'path':rel,'sealedProposed':pin(row['proposed']),'physicalProposed':proposed,'currentActual':now,'physicalProposalExactlySealed':proposed==pin(row['proposed']),'rootExactProposal':now==proposed,'rootOwnedI55TimelineOnlyAddition':timelineOnly,'rootOwnedScopedSearchVisualDeltaOnly':styleOnly,'rootOwnedExactRecordedCorrectionOnly':correctionOnly,'rootOwnedSourceInitializationGateOnly':rel==initializationFix['path'] and correctionOnly,'rootOwnedInitializationSSRTestAppendOnly':rel==regressionFix['path'] and correctionOnly,'accepted':now==proposed or timelineOnly or correctionOnly,'currentCanonicalMatches':now==pin(current[rel])})
patchReceipt,_=read(Path(intake['patch']['path']));patchExact=patchReceipt==pin(intake['patch'])==pin(candidate['patch'])
absenceRows=[{'path':rel,'recordedBeforeAbsence':True,'currentActual':actual(rel)[0],'currentCanonicalCount':sum(row['path']==rel for row in manifest['authoritativeInputs']),'candidateProposalMatches':actual(rel)[0]==pin(candidateRows[rel]['proposed']) if rel in candidateRows else None,'rootOwnedExactRecordedCorrectionOnly':next((row['rootOwnedExactRecordedCorrectionOnly'] for row in candidateParity if row['path']==rel),False),'rootOwnedTimeline':rel==timeline} for rel in sorted(absences)]
# All scientific/reference/source/generated index inputs predate this navigation-only change.
science=[row for row in rows if row['path'].startswith(('data/','public/data/')) and row['path'] not in {manifestPath,'data/research-renderer-runtime-inputs-2.91.json'}]
nonownedChanged=[row for row in rows if row['state']=='changed' and row['path'] not in owned]
priorI54=json.loads(read(Path('/private/tmp/ohri-i54-final-preservation-20261004/I54_CORE_PRESERVATION.json'),True)[1])
layoutPaths={row['path'] for row in priorI54['newLayoutPreservation']}|{'app/InterneuronTypeAtlas.tsx','app/ResearchSourceRegistry.tsx'}
allowedUi={'app/ResearchCollectionPage.tsx','app/InterneuronTypeAtlas.tsx','app/ResearchSourceRegistry.tsx'}
layoutRows=[]
for rel in sorted(layoutPaths):
 now,_=actual(rel);prior=pin(before[rel]) if rel in before else pin(owned[rel]) if rel in owned else None
 accepted=next((x['accepted'] for x in candidateParity if x['path']==rel),False)
 layoutRows.append({'path':rel,'beforeExact':prior,'beforeOrigin':'I54_current_authoritative' if rel in before else 'I55_explicit_owned_preimage' if rel in owned else 'unrecorded_no_absence_inference','currentActual':now,'byteIdentical':now==prior,'ownedI55Surface':rel in allowedUi,'ownedDeltaExactlySealed':accepted if rel in allowedUi else None,'currentCanonicalMatches':rel in current and now==pin(current[rel])})
# Existing Russ source evidence/export condition and I54 Positions authority survive the owned wrappers.
typeBefore=zipped['app/InterneuronTypeAtlas.tsx'].decode();typeNow=actual('app/InterneuronTypeAtlas.tsx',True)[1].decode();russConditions=[line.strip() for line in typeBefore.splitlines() if 'russInformationEvidence:' in line]
assert len(russConditions)==1
collectionNow=actual('app/ResearchCollectionPage.tsx',True)[1].decode();positionsProp='case "positions": content = <RonzanoPremotorPositionViewer initialParams={initialParams} onNotice={setNotice} />; break;'
privatePaths=['app/RonzanoPremotorPositionViewer.tsx','app/ronzano-premotor-position-source-view.js','app/ronzano-premotor-position-source-view.d.ts','tests/ronzano-premotor-position-source-view.test.mjs','tests/research-renderer-runtime-inputs.test.mjs','tools/build_research_renderer_runtime_inputs.mjs','app/main-scene-source-view.js','app/main-scene-source-camera-fit.js','app/morphology-source-view.js','app/independent-source-object-view.js','app/native-contour-source-view.js']
privateRows=[{'path':rel,'before':pin(before[rel]),'currentActual':actual(rel)[0],'exactlyUnchanged':actual(rel)[0]==pin(before[rel])} for rel in privatePaths]
runtimeBefore=json.loads(zipped['data/research-renderer-runtime-inputs-2.91.json']);runtimeNow=load('data/research-renderer-runtime-inputs-2.91.json');runtimeOld=table(runtimeBefore['authoritativeInputs']);runtime=table(runtimeNow['authoritativeInputs'])
runtimeRows=[{'path':rel,'declared':pin(row),'currentActual':actual(rel)[0],'exactPhysical':actual(rel)[0]==pin(row),'exactCanonical':rel in current and pin(current[rel])==pin(row)} for rel,row in runtime.items()]
# The actual import graph/40-build closure already independently proved unchanged;
# source modules are not replaced by navigation metadata and their current pins are exact.
positionsClosure=load('docs/qa/2026-10-04-implementation-55/candidate-positions-static-closure.json')
positionsBuild=positionsClosure['declaredPositionsBuildPaths'];positionsRows=[{'path':rel,'currentActual':actual(rel)[0],'currentRuntime':pin(runtime[rel]),'exact':actual(rel)[0]==pin(runtime[rel])} for rel in positionsBuild]
sourceRegistry=load('data/research-source-registry-0.1.json');upgradeRegistry=load('data/research-model-upgrade-registry-0.1.json')
sourceCounts={'sources':len(sourceRegistry['sources']),'recordSets':sum(len(source['recordSets']) for source in sourceRegistry['sources']),'profiles':manifest['registrySummary']['sourceProfileCount'],'completed':upgradeRegistry['summary']['byStatus']['completed'],'upgrades':len(upgradeRegistry['upgrades']),'registrations':manifest['implementationScope']['atlasRegistrationCount'],'crossSourceIdentities':manifest['implementationScope']['exactCrossSourceIdentityCount'],'newScientificAdmissions':0,'fullGoalComplete':manifest['implementationScope']['fullGoalComplete']}
run=subprocess.run(['node',str(OUT/'audit_i55_destination_metadata.mjs')],capture_output=True,text=True);(OUT/'I55_DESTINATION_METADATA_AUTHORITY.log').write_text(run.stdout+run.stderr);assert run.returncode==0,run.stderr
nav=json.loads(read(OUT/'I55_DESTINATION_METADATA_AUTHORITY.json',True)[1])
fullLogPath='docs/qa/2026-10-04-implementation-55/full-research-final.log'
fullLogPin,fullLog=actual(fullLogPath,True)
if fullLog is None:raise RuntimeError('Final full-research-final.log for all root visual/initialization fixes is required; first-pass1489 is not final authority')
fullCounts={}
for name in ['tests','pass','fail','cancelled','skipped']:
 matches=re.findall(rf'ℹ {name} (\d+)\b',fullLog.decode());assert matches,f'Missing final native Node count {name}';fullCounts[name]=int(matches[-1])
firstLogPath='docs/qa/2026-10-04-implementation-55/full-research-first-pass.log';firstLogPin,firstLog=actual(firstLogPath,True);firstCounts={}
if firstLog:
 for name in ['tests','pass','fail','cancelled','skipped']:
  matches=re.findall(rf'ℹ {name} (\d+)\b',firstLog.decode());assert matches;firstCounts[name]=int(matches[-1])
failedLintPath='docs/qa/2026-10-04-implementation-55/ready-gate-full-research-failed-lint.log';failedLintPin,failedLintBody=actual(failedLintPath,True)
assert failedLintBody and b'react-hooks/set-state-in-effect' in failedLintBody
lintRepairZipPath='docs/qa/2026-10-04-implementation-55/root-initialization-lint-repair-before.zip';lintRepairZipPin,lintRepairZipBody=actual(lintRepairZipPath,True)
lintRepairZip=zipfile.ZipFile(io.BytesIO(lintRepairZipBody));assert set(lintRepairZip.namelist())=={'root-source-initialization-gate.json','app/ResearchSourceRegistry.tsx'} and len(lintRepairZip.namelist())==2
lintAttemptRows=[];lintAttemptBodies={}
for rel in lintRepairZip.namelist():
 h=hashlib.sha256();parts=[];length=0
 with lintRepairZip.open(rel) as handle:
  while block:=handle.read(4096):h.update(block);parts.append(block);length+=len(block)
 lintAttemptBodies[rel]=b''.join(parts);lintAttemptRows.append({'archiveMember':rel,'actual':{'bytes':length,'sha256':h.hexdigest()}})
lintOldGate=json.loads(lintAttemptBodies['root-source-initialization-gate.json'])
assert pin(lintOldGate['before'])==pin(candidateRows['app/ResearchSourceRegistry.tsx']['proposed'])
assert next(row['actual'] for row in lintAttemptRows if row['archiveMember']=='app/ResearchSourceRegistry.tsx')==pin(lintOldGate['after'])
assert b'restore();\n    setLocationHydrated(true);' in lintAttemptBodies['app/ResearchSourceRegistry.tsx']
# Preserve actual browser outcomes/unverified scope as reported by root; this audit
# hashes source/code/QA evidence and does not perform new native GUI actions.
nativeEvidence=[]
for path in sorted(QA.iterdir()):
 if path.is_file() and (path.suffix in {'.png','.txt'} or path.name.startswith('actual-') and path.suffix in {'.json','.mjs'}):
  value,_=read(path);nativeEvidence.append({'path':str(path.relative_to(ROOT)),'actual':value,'nativeGUIExecutedByThisAudit':False})
finalDocs=[]
for rel in sorted(rootDocs):
 value,_=actual(rel);finalDocs.append({'path':rel,'currentActual':value,'currentDeclared':pin(current[rel]),'exact':value==pin(current[rel])})
manifestBefore=json.loads(zipped[manifestPath]);parent=manifest['parentIterationManifest'];parentBefore=manifestBefore['parentIterationManifest'];parentFile,_=actual(parent['path'])
checks={'all2549CurrentActualPinsExact':len(current)==2549 and all(row['matchesCurrentDeclared'] for row in rows if row['state']!='removed'),'all2541PriorInputsRetained':not any(row['state']=='removed' for row in rows),'onlyEightDeclaredWorkflowAndTimelinePinsAdded':set(current)-set(before)==newExpected,'allChangesClassified':not any(row['classification']=='unclassified_requires_review' for row in changes),'noUnexpectedChangedNonownedPriorInput':not nonownedChanged,
 'eightExactZIPPreimages':len(zipRows)==8 and all(row['archiveExactlyBefore'] for row in zipRows),'sevenObservedNewPathAbsencesNowExact':len(absenceRows)==7 and all(row['currentActual'] and row['currentCanonicalCount']==1 and ((row['candidateProposalMatches'] or row['rootOwnedExactRecordedCorrectionOnly']) if row['candidateProposalMatches'] is not None else row['rootOwnedTimeline']) for row in absenceRows),
 'tenCandidatePathsExactExceptFourNarrowRecordedRootDeltas':len(candidateParity)==10 and all(row['accepted'] and row['physicalProposalExactlySealed'] and row['currentCanonicalMatches'] for row in candidateParity),'sixProposalByteMatchesOneRootRecipeThreeExactRecordedCorrections':sum(row['rootExactProposal'] for row in candidateParity)==6 and sum(row['rootOwnedI55TimelineOnlyAddition'] for row in candidateParity)==1 and sum(row['rootOwnedExactRecordedCorrectionOnly'] for row in candidateParity)==3 and sum(row['rootOwnedScopedSearchVisualDeltaOnly'] for row in candidateParity)==1 and sum(row['rootOwnedSourceInitializationGateOnly'] for row in candidateParity)==1 and sum(row['rootOwnedInitializationSSRTestAppendOnly'] for row in candidateParity)==1,'twoExactPostCandidateInitializationZIPPreimages':len(rootCorrectionRows)==2 and all(row['exactlyCandidateBefore'] for row in rootCorrectionRows),'candidatePatchExactlySealed':patchExact,
 'allPriorScientificAndGeneratedDataInputsByteUnchanged':all(row['state']=='unchanged' for row in science),'noScientificCanonicalPathsAdded':not any(row['state']=='added' for row in science),'newMultipageLayoutProtectedOutsideThreeOwnedSurfaces':all(row['currentCanonicalMatches'] and (row['ownedDeltaExactlySealed'] if row['ownedI55Surface'] else row['byteIdentical']) for row in layoutRows),
 'RussImportsAndExactSelectedBaselineComparisonExportConditionRetained':all(name in typeNow for name in ['russSpinalInformationAdapter','RussSpinalInformationPanel','validateRussSpinalInformationAdapter']) and russConditions[0] in typeNow,'I54PositionsInitialParamsAdapterRetained':positionsProp in collectionNow,'privateSourceRenderingAndCoverageCodeExactlyUnchanged':all(row['exactlyUnchanged'] for row in privateRows),
 'runtime198MembershipAndAllActualCanonicalPinsExact':len(runtime)==len(runtimeOld)==198 and set(runtime)==set(runtimeOld) and all(row['exactPhysical'] and row['exactCanonical'] for row in runtimeRows),'PositionsFortyBuildInputMembershipRetainedAndCurrent':len(positionsBuild)==40 and all(row['exact'] for row in positionsRows) and positionsClosure['sameExecutedPathSet'] and positionsClosure['sameExecutedEdgeSet'],
 'sourceUnitsAndFullGoalNotPromoted':sourceCounts=={'sources':31,'recordSets':41,'profiles':387,'completed':83,'upgrades':243,'registrations':0,'crossSourceIdentities':0,'newScientificAdmissions':0,'fullGoalComplete':False},'existing274MetadataOnlyDestinationsExact':nav['status']=='PASS' and nav['availableRecordSets']==15 and nav['navigationActions']==274 and nav['allReceiptsMetadataOnly'] and nav['newAdmissions']==0,
 'fullResearchNativeCountsAndReportedExitSuccess':engineering['exitCode']==0 and fullCounts['fail']==fullCounts['cancelled']==0 and fullCounts['tests']==fullCounts['pass']+fullCounts['skipped'],'actualBrowserQAReportedWithRetainedEvidence':bool(native) and bool(nativeEvidence),'finalThreeDocumentPinsExact':all(row['exact'] for row in finalDocs),'frozen290ActualReceiptAndDescriptorPreserved':parent==parentBefore and parentFile=={'bytes':parent['bytes'],'sha256':parent['fileSha256']}}
epochEnd,_=actual(manifestPath,False,True);checks['manifestEpochStable']=epochEnd==epochStart
checks['finalFullCurrentRun1490_1475_15_0']=fullCounts=={'tests':1490,'pass':1475,'fail':0,'cancelled':0,'skipped':15}
checks['finalEngineeringLogPinAndCountsExactlyReported']=engineering['log']=='full-research-final.log' and fullLogPin==pin(engineering['logPin']) and fullCounts==engineering['tests']
checks['initializationFailedLintAttemptAndExactBeforeRepairZIPRetained']=bool(failedLintPin) and len(lintAttemptRows)==2 and pin(initializationFix['after'])!=pin(lintOldGate['after'])
endCritical=[]
for rel in sorted(set(candidateRows)|rootDocs|{'data/research-renderer-runtime-inputs-2.91.json'}):
 prior=cache[ROOT/rel];value,_=actual(rel,False,True);endCritical.append({'path':rel,'first':prior,'end':value,'stable':prior==value})
checks['allOwnedRuntimeAndFinalDocInputsStableThroughAudit']=all(row['stable'] for row in endCritical)
result={'status':'PASS' if all(checks.values()) else 'FAIL','increment':'I55','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Bounded current-layout source registry→source-owned record set→existing exact destination metadata navigation; full Goal remains active','sharedRootWrites':0,'parentStageWrites':0,'manifestEpoch':{'start':epochStart,'end':epochEnd,'criticalInputs':endCritical},'readContract':stats,'elapsedSeconds':time.time()-started,'checks':checks,'summary':{'beforeCanonical':len(before),'currentCanonical':len(current),'comparisonCounts':counts,'scientificInputsAllPreserved':len(science),'preimages':8,'beforeAbsences':7,'candidatePaths':10,'privateRendererAuthorityModulesUnchanged':len(privateRows),'runtime':198,'positionsBuild':40,'navigationSets':15,'navigationActions':274,'sourceCounts':sourceCounts,'nativeFullTestCounts':fullCounts},
 'fullAuthoritativeInputComparison':rows,'changedOrAddedClassifications':changes,'preimageArchive':{'actual':zipReceipt,'rows':zipRows},'newPathAbsenceComparison':absenceRows,'candidateTenPathComparison':candidateParity,'rootOwnedScopedSearchVisualDelta':{'path':stylePath,'QAReceiptPath':styleFixPath,'QAActual':styleFixReceipt,'candidateBeforeArchive':styleBeforeReceipt,'exactReplacementCount':1,'reported':styleFix,'scope':'Only the new I55 scoped search input border/background/text/focus affordance; no existing global layout or source/route change'},'newMultipageLayoutPreservation':layoutRows,'currentI53RussExportCondition':russConditions[0],'privateRendererPreservation':privateRows,'PositionsClosureCurrentPins':positionsRows,'runtimeComparison':{'beforeCount':len(runtimeOld),'currentCount':len(runtime),'currentPins':runtimeRows,'oldExistingChanged':[rel for rel in runtimeOld if pin(runtimeOld[rel])!=pin(runtime[rel])]},'destinationMetadataAuthority':{'receipt':str(OUT/'I55_DESTINATION_METADATA_AUTHORITY.json'),'actual':read(OUT/'I55_DESTINATION_METADATA_AUTHORITY.json')[0],'summary':{key:nav[key] for key in ['sourceCount','recordSetCount','bundledRosters','bundledObjects','availableRecordSets','navigationActions','actionClasses','runtimeExistingRecords','newAdmissions','exactCrossSourceIdentities','registrations','allReceiptsMetadataOnly','observationalUnits']}},
 'frozen290':{'descriptor':parent,'actualFile':parentFile,'existingSnapshotValidatorScope':'Parent complete current research suite owns existing snapshot validator execution. This audit confirms frozen parent file/descriptor and all old current source inputs; no absent historical row is fabricated.'},'fullResearchReported':engineering,'actualFullResearchLog':{'path':fullLogPath,'actual':fullLogPin,'nativeFinalCounts':fullCounts},'actualBrowserReported':native,'nativeEvidenceByteReceipts':nativeEvidence,'unverifiedQAReported':summary.get('unverified',summary.get('remainingQA',[])),'failedAttemptsRetained':summary.get('failedAttempts',[]),'finalDocuments':finalDocs,'limitations':['This independent replay establishes actual source/code/input preservation and metadata destination membership; it does not execute native GUI interactions or mint source render proof.','Root actual-browser evidence and its unverified outcomes are retained verbatim. Metadata export does not fetch source files or attest pixels.','Previous I54 captured build receipts apply to their sealed epoch; current I55 wrapper changes require current runtime fingerprints.','Strict83/243 and full F01–F20/M0–M4/243+21 objective are not promoted by engineering/browser success.']}
result['rootOwnedInitializationCorrections']={'gateQAPath':initializationFixPath,'gateQAActual':initializationFixActual,'regressionQAPath':regressionFixPath,'regressionQAActual':regressionFixActual,'actualCandidateBeforeZIP':rootCorrectionZipActual,'rows':rootCorrectionRows,'scope':'Initial controls inert until committed URL source/set restoration; one meaningful actual React SSR regression. No source admission or lazy route/layout change.'}
result['firstPassEvidenceRetainedSeparately']={'path':firstLogPath,'actual':firstLogPin,'counts':firstCounts,'validatesFinalRootCorrections':False,'finalAuthorityPath':fullLogPath}
result['initializationLintFailureRetainedSeparately']={'failedRunPath':failedLintPath,'actual':failedLintPin,'failureRule':'react-hooks/set-state-in-effect','beforeRepairZIPPath':lintRepairZipPath,'actualBeforeRepairZIP':lintRepairZipPin,'archivedActual':lintAttemptRows,'failedGateAfter':pin(lintOldGate['after']),'acceptedRepairedGateAfter':pin(initializationFix['after']),'validatesFinalRootCorrections':False,'finalAuthorityPath':fullLogPath,'scope':'Preserved direct effect setter failure; ready setter moved into existing complete URL restore with other source/filter setters. No source admission or private rendering change.'}
target=OUT/'I55_FINAL_PRESERVATION.json';target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'receipt':str(target),'status':result['status'],'summary':result['summary'],'failedChecks':[key for key,value in checks.items() if not value],'epoch':epochEnd,'readContract':stats},indent=2))
if not all(checks.values()):raise SystemExit(1)
