#!/usr/bin/env python3
from pathlib import Path
import collections,datetime,difflib,hashlib,io,json,os,re,subprocess,time,zipfile
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA=ROOT/'docs/qa/2026-10-04-implementation-54'
OUT=Path(__file__).resolve().parent
CANDIDATE=Path('/private/tmp/ohri-i54-ronzano-candidate')
cache,contents={},{}
stats={'strategy':'full_file_os_pread_4096_byte_chunks','chunkBytes':4096,'preadCalls':0,'bytesRead':0,'filesRead':0}
started=time.time()
def read(path,keep=False,fresh=False):
 path=Path(path)
 if not fresh and path in cache and (not keep or path in contents):return cache[path],contents.get(path)
 fd=os.open(path,os.O_RDONLY);h=hashlib.sha256();pieces=[];offset=0
 try:
  a=os.fstat(fd)
  while True:
   block=os.pread(fd,4096,offset);stats['preadCalls']+=1
   if not block:break
   h.update(block);offset+=len(block);stats['bytesRead']+=len(block)
   if keep:pieces.append(block)
  z=os.fstat(fd)
  assert (a.st_ino,a.st_size,a.st_mtime_ns)==(z.st_ino,z.st_size,z.st_mtime_ns) and offset==z.st_size,('Changed or incomplete read',path)
 finally:os.close(fd)
 row={'bytes':offset,'sha256':h.hexdigest()};cache[path]=row;stats['filesRead']+=1
 if keep:contents[path]=b''.join(pieces)
 return row,contents.get(path) if keep else None
def actual(rel,keep=False,fresh=False):return read(ROOT/rel,keep,fresh) if (ROOT/rel).is_file() else (None,None)
def load(rel):return json.loads(actual(rel,True)[1])
def pin(row):return {k:row[k] for k in ['bytes','sha256']}
def table(rows):
 result={x['path']:x for x in rows};assert len(result)==len(rows),'Duplicate path';return result
manifestPath='data/research-iteration-manifest-2.91.json'
epochStart,body=actual(manifestPath,True);manifest=json.loads(body)
assert len(manifest['authoritativeInputs'])==2541,'Not final I54 canonical epoch'
intake=load('docs/qa/2026-10-04-implementation-54/intake-preservation.json')
summary=load('docs/qa/2026-10-04-implementation-54/verification-summary.json')
replay=load('docs/qa/2026-10-04-implementation-54/actual-positions-independent-replay.json')
handReceipt,handBody=read(CANDIDATE/'qa/I54_FINAL_HANDOFF_RECEIPT.json',True);handoff=json.loads(handBody)
before=table(intake['baselineInputs']);current=table(manifest['authoritativeInputs']);owned=table(intake['preimages']);absences=set(intake['newPathAbsence']);addedSet=set(intake['canonicalRecipeAdditions'])
assert len(before)==2511 and len(owned)==9 and len(absences)==4 and len(addedSet)==30
candidateRows=table(handoff['proposedIntegrationFiles']);assert len(candidateRows)==5
rootOwnedCode={'tools/build_research_iteration_manifest_2_91.mjs','tools/build_research_renderer_runtime_inputs.mjs','tests/research-renderer-runtime-inputs.test.mjs'}
rootDocs={'docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md','docs/RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_54_RONZANO_SOURCE_VIEW.md'}
def classify(rel,state):
 if state=='unchanged':return 'prior_current_input_byte_preserved'
 if rel in candidateRows:return 'exact_five_path_I54_candidate'
 if rel in rootOwnedCode:return 'root_owned_exact_input_recipe_or_coverage_migration'
 if rel in rootDocs:return 'root_owned_bounded_I54_scope_document'
 if rel=='data/research-renderer-runtime-inputs-2.91.json':return 'regenerated_current_runtime_input_transport'
 if rel in addedSet and rel.startswith('public/data/ronzano_premotor_positions_v1/'):return 'existing_source_asset_first_current_canonical_pin_verified_against_unchanged_source_reference'
 if rel in addedSet:return 'existing_code_first_current_canonical_pin_no_inferred_before_file_absence'
 return 'unclassified_requires_review'
rows=[]
for rel in sorted(set(before)|set(current)):
 now,_=actual(rel);state='removed' if rel not in current else 'added' if rel not in before else 'unchanged' if now==pin(before[rel]) else 'changed'
 rows.append({'path':rel,'state':state,'beforeAuthoritative':pin(before[rel]) if rel in before else None,'currentDeclared':pin(current[rel]) if rel in current else None,'currentActual':now,'matchesCurrentDeclared':now==pin(current[rel]) if rel in current else None,'classification':classify(rel,state),'beforePhysicalAbsenceExplicitlyRecorded':rel in absences,'addedPinDoesNotProveFileCreation':state=='added' and rel not in absences})
changes=[x for x in rows if x['state']!='unchanged'];counts=dict(collections.Counter(x['state'] for x in rows))
archiveReceipt,archiveBody=actual('docs/qa/2026-10-04-implementation-54/preimages.zip',True)
archive=zipfile.ZipFile(io.BytesIO(archiveBody));names=archive.namelist();assert len(names)==len(set(names)) and set(names)==set(owned),'ZIP exact nine-file inventory differs'
zipped={};zipRows=[]
for rel in names:
 assert not rel.startswith('/') and '..' not in Path(rel).parts
 h=hashlib.sha256();parts=[];length=0
 with archive.open(rel) as handle:
  while block:=handle.read(4096):h.update(block);parts.append(block);length+=len(block)
 value={'bytes':length,'sha256':h.hexdigest()};zipped[rel]=b''.join(parts);now,_=actual(rel)
 zipRows.append({'path':rel,'recordedBefore':pin(owned[rel]),'decompressedActual':value,'matchesRecordedBefore':value==pin(owned[rel]),'currentActual':now,'currentChangedFromBefore':now!=value})
newRows=[]
for rel in sorted(absences):
 now,_=actual(rel)
 expected=pin(candidateRows[rel]['candidate']) if rel in candidateRows else None
 newRows.append({'path':rel,'beforeAbsenceExplicitlyRecorded':True,'currentActual':now,'currentCanonicalEntryCount':sum(x['path']==rel for x in manifest['authoritativeInputs']),'candidateExpected':expected,'matchesExactCandidate':now==expected if expected else None,'rootOwnedNewTimeline':rel in rootDocs})
candidateParity=[]
for rel,row in candidateRows.items():
 now,_=actual(rel);proposed,_=read(CANDIDATE/rel)
 candidateParity.append({'path':rel,'candidateSealed':pin(row['candidate']),'candidatePhysical':proposed,'currentRoot':now,'rootMatchesSealedCandidate':now==pin(row['candidate']),'physicalCandidateMatchesSeal':proposed==pin(row['candidate']),'currentCanonicalMatches':now==pin(current[rel])})
patchReceipt,_=read(Path(intake['patch']['path']));patchMatches=patchReceipt==pin(intake['patch']) and patchReceipt==pin(handoff['patch'])
collectionBefore=zipped['app/ResearchCollectionPage.tsx'].decode();collectionNow=actual('app/ResearchCollectionPage.tsx',True)[1].decode()
oldLine='case "positions": content = <RonzanoPremotorPositionViewer onNotice={setNotice} />; break;'
newLine='case "positions": content = <RonzanoPremotorPositionViewer initialParams={initialParams} onNotice={setNotice} />; break;'
collectionOnlyProp=collectionBefore.count(oldLine)==1 and collectionBefore.replace(oldLine,newLine)==collectionNow
priorI53=json.loads(read(Path('/private/tmp/ohri-i53-final-preservation-20261004/I53_FINAL_PRESERVATION.json'),True)[1])
layoutPaths={x['path'] for x in priorI53['completeIntakeInventory'] if 'current_multipage_UI_dependency' in x['categories']}
layoutPaths|={'app/page.tsx','app/layout.tsx','app/ResearchCollectionPage.tsx','app/ResearchRoutePage.tsx','app/SiteNavigation.tsx','app/site-navigation.ts','app/site-navigation.css','app/ResearchSkipLink.tsx','app/research-skip-link.css','app/academic-interface.css','app/globals.css','app/research-pages.css','app/research-information-layout.css','app/explore/[...section]/page.tsx','app/research/[...section]/page.tsx','app/sources/page.tsx','app/workspace/page.tsx','app/ResearchOverview.tsx'}
layoutRows=[]
for rel in sorted(layoutPaths):
 now,_=actual(rel)
 layoutRows.append({'path':rel,'I53FinalCurrentBaseline':pin(before[rel]) if rel in before else None,'currentActual':now,'matchesBaseline':now==pin(before[rel]) if rel in before else None,'PositionsInitialParamsOnly':collectionOnlyProp if rel=='app/ResearchCollectionPage.tsx' else None,'currentCanonicalMatches':rel in current and now==pin(current[rel])})
science=[x for x in rows if x['path'].startswith(('data/','public/data/')) and x['path'] not in {manifestPath,'data/research-renderer-runtime-inputs-2.91.json'}]
nonownedChanges=[x for x in rows if x['state']=='changed' and x['path'] not in owned]
scientificBefore=[x for x in science if x['beforeAuthoritative'] is not None]
scientificAdded=[x for x in science if x['state']=='added']
# Original sources have pre-existing exact authority in the unchanged Ronzano reference;
# new current canonical pins do not introduce new physical observations.
reference=load('data/ronzano-premotor-position-reference-0.1.json')
sourceRows=[{'path':'public'+reference['derivedAsset']['browserUrl'],**{k:reference['derivedAsset'][k] for k in ['bytes','sha256']}},*[{'path':'public'+x['browserUrl'],**{k:x[k] for k in ['bytes','sha256']}} for x in reference['sourceFiles']]]
sourcePins=[]
for row in sourceRows:
 now,_=actual(row['path']);sourcePins.append({'path':row['path'],'originalReference':pin(row),'actual':now,'matches':now==pin(row),'currentCanonicalMatches':now==pin(current[row['path']])})
runtimeBefore=json.loads(zipped['data/research-renderer-runtime-inputs-2.91.json']);runtimeNow=load('data/research-renderer-runtime-inputs-2.91.json');runtimeOld=table(runtimeBefore['authoritativeInputs']);runtime=table(runtimeNow['authoritativeInputs'])
runtimeRows=[]
for rel,row in runtime.items():
 now,_=actual(rel);runtimeRows.append({'path':rel,'declared':pin(row),'actual':now,'matches':now==pin(row),'canonicalMatches':rel in current and pin(row)==pin(current[rel])})
buildRows=replay['build']['inputs'];buildPaths=[x['path'] for x in buildRows];required=intake['requiredRendererBuildPaths']
assert set(buildPaths)==set(required) and len(buildPaths)==40
buildPinRows=[{'path':x['path'],'savedReplay':pin(x),'currentRoot':actual(x['path'])[0],'matches':actual(x['path'])[0]==pin(x),'runtimeMatches':x['path'] in runtime and pin(x)==pin(runtime[x['path']])} for x in buildRows]
captureNames=sorted(p.name for p in (QA/'captures').glob('actual-positions-*.json'));captureRows=[]
expectedSourceFiles=[{'id':reference['assetId'],'path':reference['derivedAsset']['browserUrl'],**pin(reference['derivedAsset'])},*[{'id':x['id'],'path':x['browserUrl'],**pin(x)} for x in reference['sourceFiles']]]
for name in captureNames:
 rowReceipt,rowBody=read(QA/'captures'/name,True);doc=json.loads(rowBody)
 captureRows.append({'file':name,**rowReceipt,'rendererBuildExactlyCurrent':doc['rendererBuild']==replay['build'],'sourceVerificationFilesExactly23Originals':doc['sourceVerification']['files']==expectedSourceFiles,'privateRenderClaimFromOriginalCaptureOnly':doc['view']['drawing']['authority'],'pixelsAttested':doc['view']['drawing']['pixelsAttested'],'scientificScope':doc['scientificScope'],'frame':doc['view']['request']['frame'],'selectedRow':doc['view']['selectedRow']['id'] if doc['view']['selectedRow'] else None})
replayResults=table([{'path':x['file'],**x} for x in replay['results']]);captureHashesMatch=all(pin(row)==pin(replayResults[row['file']]) for row in captureRows)
scriptPath=Path(replay['script']['path']);scriptReceipt,_=read(scriptPath);scriptMatches=scriptReceipt['sha256']==replay['script']['sha256']
# Replay actual saved captures independently in temp; this does not perform browser actions
# or turn JSON/math into private render proof.
command=['node',str(scriptPath),'--project',str(ROOT),'--dependency-root','/private/tmp/ohri-i51-verification','--captures',str(QA/'captures'),'--output',str(OUT/'I54_NATIVE_CAPTURES_INDEPENDENT_REPLAY.json')]
for pair in replay['pairs']:command.extend([f"--{pair['kind']}-pair",pair['before']+':'+pair['after']])
run=subprocess.run(command,capture_output=True,text=True);(OUT/'I54_NATIVE_CAPTURES_INDEPENDENT_REPLAY.log').write_text(run.stdout+run.stderr)
assert run.returncode==0,run.stderr
replayed=json.loads(read(OUT/'I54_NATIVE_CAPTURES_INDEPENDENT_REPLAY.json',True)[1])
replayedComparable={k:v for k,v in replayed.items() if k not in ['generatedAt']};savedComparable={k:v for k,v in replay.items() if k not in ['generatedAt']}
replayExact=replayedComparable==savedComparable
# Frozen parent receipt and current source/upgrade unit semantics remain unchanged.
manifestBefore=json.loads(zipped[manifestPath]);parent=manifest['parentIterationManifest'];parentBefore=manifestBefore['parentIterationManifest'];parentFile,_=actual(parent['path'])
sourceRegistry=load('data/research-source-registry-0.1.json');upgradeRegistry=load('data/research-model-upgrade-registry-0.1.json')
sourceCounts={'sources':len(sourceRegistry['sources']),'recordSets':sum(len(x['recordSets']) for x in sourceRegistry['sources']),'strictCompleted':upgradeRegistry['summary']['byStatus']['completed'],'totalUpgrades':len(upgradeRegistry['upgrades']),'profiles':manifest['registrySummary']['sourceProfileCount'],'newScientificAdmissions':0,'fullGoalComplete':manifest['implementationScope']['fullGoalComplete']}
engineering=summary['engineering'];docRows=[]
for rel in sorted(rootDocs):
 now,body=actual(rel,True);text=body.decode();docRows.append({'path':rel,'actual':now,'currentDeclared':pin(current[rel]),'matchesCurrentDeclared':now==pin(current[rel]),'containsBoundedI54FullTestCount':bool(re.search(r'(?:1,?468|1468)',text)) and bool(re.search(r'(?:1,?453|1453)',text)),'retainsPartialOrIncompleteScope':any(word in text for word in ['partial','部分','未完成'])})
checks={'all2541CurrentPhysicalPinsExact':len(current)==2541 and all(x['matchesCurrentDeclared'] for x in rows if x['state']!='removed'),
 'baseline2511AllRetained':not any(x['state']=='removed' for x in rows),'onlyDeclared30CanonicalPathsAdded':set(current)-set(before)==addedSet,
 'allChangesClassified':not any(x['classification']=='unclassified_requires_review' for x in changes),'noChangedNonownedPreviousInput':not nonownedChanges,
 'nineExactPreimagesAndArchiveInventory':len(zipRows)==9 and all(x['matchesRecordedBefore'] for x in zipRows),'fourBeforeAbsencesNowExactlyPinned':len(newRows)==4 and all(x['currentActual'] and x['currentCanonicalEntryCount']==1 and (x['matchesExactCandidate'] if x['candidateExpected'] else x['rootOwnedNewTimeline']) for x in newRows),
 'exactFiveSealedCandidatePhysicalAndRootPins':len(candidateParity)==5 and all(x['rootMatchesSealedCandidate'] and x['physicalCandidateMatchesSeal'] and x['currentCanonicalMatches'] for x in candidateParity),'sealedCandidatePatchExact':patchMatches,
 'CollectionChangeIsOnlyPositionsInitialParams':collectionOnlyProp,'currentNewMultipageLayoutPreserved':all(x['currentCanonicalMatches'] and (x['PositionsInitialParamsOnly'] if x['path']=='app/ResearchCollectionPage.tsx' else x['matchesBaseline']) for x in layoutRows),
 'allPriorScientificDataBytesPreserved':all(x['state']=='unchanged' for x in scientificBefore),'only23ExistingSourceAssetsNewlySciencePinned':len(scientificAdded)==23 and {x['path'] for x in scientificAdded}=={x['path'] for x in sourceRows},'all23OriginalSourceReferencePinsExact':len(sourcePins)==23 and all(x['matches'] and x['currentCanonicalMatches'] for x in sourcePins),
 'current198RuntimePinsExactAndCanonical':len(runtime)==198 and all(x['matches'] and x['canonicalMatches'] for x in runtimeRows),'runtime153To198PreservesEveryPriorPath':len(runtimeOld)==153 and not(set(runtimeOld)-set(runtime)),
 'fortyCapturedBuildPinsAreCurrent':len(buildPinRows)==40 and all(x['matches'] and x['runtimeMatches'] for x in buildPinRows),'fifteenCaptureHashesCurrentBuildAndSourceProofExact':len(captureRows)==15 and captureHashesMatch and all(x['rendererBuildExactlyCurrent'] and x['sourceVerificationFilesExactly23Originals'] and x['pixelsAttested'] is False for x in captureRows),
 '600BuildAnd345SourceComparisons':len(captureRows)*len(buildPinRows)==600 and len(captureRows)*len(sourcePins)==345,'fourExplicitPairsAndSevenFullFitsReplay':len(replay['pairs'])==4 and all(x['pass'] for x in replay['pairs']) and sum(x['assertCompleteFit'] for x in replay['results'])==7,
 'savedHelperExactAndIndependentReplayMatchesEverySemanticField':scriptMatches and run.returncode==0 and replayExact,'offlineReplayDoesNotMintRenderOrPixels':replayed['actualBrowserExecutionByThisScript'] is False and replayed['privateActualRenderProofMintedByThisScript'] is False and replayed['pixelsAttested'] is False,
 'frozen290ParentDescriptorAndActualFileUnchanged':parent==parentBefore and parentFile=={'bytes':parent['bytes'],'sha256':parent['fileSha256']},'sourceUnitsAndFullGoalNotPromoted':sourceCounts=={'sources':31,'recordSets':41,'strictCompleted':83,'totalUpgrades':243,'profiles':387,'newScientificAdmissions':0,'fullGoalComplete':False},
 'fullResearchSummaryExactlyBounded':engineering['exitCode']==0 and engineering['tests']==1468 and engineering['passed']==1453 and engineering['existingConditionalSkips']==15 and engineering['failed']==0 and engineering['cancelled']==0,
 'finalThreeDocumentPinsExact':len(docRows)==3 and all(x['matchesCurrentDeclared'] for x in docRows)}
epochEnd,_=actual(manifestPath,False,True);checks['manifestEpochStable']=epochStart==epochEnd
endCritical=[]
for rel in sorted(set(candidateRows)|rootDocs|{'data/research-renderer-runtime-inputs-2.91.json'}):
 old=cache[ROOT/rel];now,_=actual(rel,False,True);endCritical.append({'path':rel,'readCheckpoint':old,'endCheckpoint':now,'stable':old==now})
checks['candidateRuntimeAndFinalDocsEpochStable']=all(x['stable'] for x in endCritical)
result={'status':'PASS' if all(checks.values()) else 'FAIL','increment':'I54','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'root':str(ROOT),'sharedRootWrites':0,'parentStageWrites':0,'readContract':stats,'elapsedSeconds':time.time()-started,'manifestEpoch':{'start':epochStart,'end':epochEnd,'endCritical':endCritical},'checks':checks,
 'summary':{'beforeCanonicalInputs':len(before),'currentCanonicalInputs':len(current),'comparisonCounts':counts,'baselineScientificInputCount':len(scientificBefore),'baselineScienceAllByteUnchanged':all(x['state']=='unchanged' for x in scientificBefore),'newScienceCanonicalPins':len(scientificAdded),'preimageCount':len(zipRows),'recordedNewPhysicalAbsences':len(absences),'candidateExactPaths':len(candidateParity),'currentNewLayoutDependencies':len(layoutRows),'layoutByteIdenticalDependencies':sum(x['matchesBaseline'] is True for x in layoutRows),'soleCollectionInitialParamsChange':collectionOnlyProp,'runtimeBefore':len(runtimeOld),'runtimeCurrent':len(runtime),'rendererBuild':40,'originalSources':23,'authorityPaths':63,'nativeCaptures':15,'buildCaptureComparisons':600,'sourceCaptureComparisons':345,'explicitPairs':4,'completeSourceFitCaptures':7},
 'fullAuthoritativeInputComparison':rows,'changedOrAddedClassifications':changes,'preimageArchive':{'actual':archiveReceipt,'rows':zipRows},'recordedNewPathAbsenceComparison':newRows,'exactCandidateFivePathComparison':candidateParity,'candidateHandoff':{'path':str(CANDIDATE/'qa/I54_FINAL_HANDOFF_RECEIPT.json'),'actual':handReceipt},'candidatePatch':{'actual':patchReceipt,'matchesIntakeAndSealedHandoff':patchMatches},
 'CollectionByteDiff':' '.join(difflib.unified_diff(collectionBefore.splitlines(),collectionNow.splitlines(),n=2)),'newLayoutPreservation':layoutRows,'nonownedScientificChanges':nonownedChanges,'originalRonzanoSourcePins':sourcePins,
 'runtimeComparison':{'beforeCount':len(runtimeOld),'currentCount':len(runtime),'added':sorted(set(runtime)-set(runtimeOld)),'removed':sorted(set(runtimeOld)-set(runtime)),'oldExistingChanged':[p for p in runtimeOld if p in runtime and pin(runtimeOld[p])!=pin(runtime[p])],'currentRows':runtimeRows},
 'nativeCaptureEvidence':{'captureRows':captureRows,'buildPins':buildPinRows,'savedReplayActual':actual('docs/qa/2026-10-04-implementation-54/actual-positions-independent-replay.json')[0],'replayHelper':{'actual':scriptReceipt,'matchesSavedSHA':scriptMatches},'independentRun':{'command':command,'exitCode':run.returncode,'output':str(OUT/'I54_NATIVE_CAPTURES_INDEPENDENT_REPLAY.json'),'exactSemanticReplayMatchesSaved':replayExact},'pairs':replay['pairs'],'nativeProofBoundary':'These are saved original browser captures. Independent offline replay verifies source/current-build/camera math and cannot reestablish private actual-render proof or pixels.'},
 'frozen290':{'beforeDescriptor':parentBefore,'currentDescriptor':parent,'actualFile':parentFile,'existingFullSnapshotValidatorsScope':'Parent test:research includes existing snapshot validators; this independent audit confirms frozen receipt file/descriptor and every old scientific/current input byte. No historical snapshot reconstruction or invented absent2.41 baseline is performed.'},'sourceUnitScope':sourceCounts,'fullResearchSummary':engineering,'finalThreeDocuments':docRows,'remainingNativeQA':summary['unverified'],'failedAttemptsRetained':summary['failedAttempts'],'scope':'Partial UPG114 exact labelled-cell source-position viewing/camera/row interaction in the current dedicated layout. F01–F20/M0–M4/243+21 Goal remains active. No physical-cell geometry, M2/M4, same-cell internals, cross-frame identity, registrations, biological scale or measurement admission.'}
target=OUT/'I54_FINAL_PRESERVATION.json';target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'receipt':str(target),'status':result['status'],'summary':result['summary'],'failedChecks':[k for k,v in checks.items() if not v],'epoch':epochEnd,'readContract':stats},indent=2))
if not all(checks.values()):raise SystemExit(1)
