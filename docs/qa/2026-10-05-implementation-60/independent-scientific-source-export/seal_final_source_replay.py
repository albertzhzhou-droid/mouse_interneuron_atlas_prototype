from pathlib import Path
import os,json,hashlib,datetime,collections
p=Path('/private/tmp/ohri-i60-comparison-source-replay')
def pin(f):
 fd=os.open(f,os.O_RDONLY|os.O_NOFOLLOW);h=hashlib.sha256();n=0;calls=0
 try:
  a=os.fstat(fd)
  while True:
   b=os.pread(fd,4096,n);calls+=1
   if not b:break
   n+=len(b);h.update(b)
  z=os.fstat(fd);assert(a.st_ino,a.st_size,a.st_mtime_ns)==(z.st_ino,z.st_size,z.st_mtime_ns);assert n==a.st_size
 finally:os.close(fd)
 return {'path':str(f),'bytes':n,'sha256':h.hexdigest(),'preadCalls':calls}
f=p/'I60_ACTUAL_COMPARISON_SOURCE_REPLAY.json';r=json.loads(f.read_text());assert r['status']=='PASS_INDEPENDENT_I60_ACTUAL_SOURCE_COMPARISON_REPLAY';assert len(r['captures'])==49 and len(r['exports'])==2
assert r['nativeScientificExportsExact']is True and r['actualEvidenceRehashedAfterReplay']is True
for row in r['captures']+r['exports']:
 a=pin(row['path']);assert {'bytes':a['bytes'],'sha256':a['sha256']}==row['actual']
assert sum(x['replay']['reportPairs']for x in r['captures'])==52
assert sum(x['replay'].get('actualExpandedReceiptCount',0)for x in r['captures'])==21
log=p/'I60_FINAL_SOURCE_SYNTHETIC_GUARDS.log';assert 'Ran 14 tests' in log.read_text()and log.read_text().rstrip().endswith('OK')
for row in r['exports']:
 assert row['personalPathReadByThisHelper']is False and row['originalTimeoutRetained']is True
 assert row['sourceReplay']['exact']is True
report=next(x['replay']['report']for x in r['captures']if x['path'].endswith('actual-10-four-source-expanded.json'))
assert len(report['profiles'])==4 and len(report['comparisons'])==3 and report['sourceDenominator']['value']==387
assert report['profiles'][2]['markers']['status']=='missing' and report['profiles'][2]['markers']['exactStrings']==[]
owned=[f,p/'replay_i60_comparison_source.py',p/'test_replay_i60_comparison_source.py',p/'I60_ACTUAL_DOM_AND_SEALED_NATIVE_EXPORTS_CONFIG.json',log,p/'I60_ACTUAL_SCIENCE_AND_NATIVE_EXPORT_SOURCE_REPLAY.log',p/'I60_PARENT_RAW_PAGES_SCHEMA_ADAPTER.json',p/'I60_PARENT_RAW_TEXT_BOUNDARY_ADAPTER.json',p/'I60_EXACT_VISIBLE_CANDIDATE_MEMBERSHIP_GUARD.json',p/'I60_SEALED_TEMP_EXPORT_INPUT_ADAPTER.json',p/'I60_ACTUAL_EVIDENCE_EPOCH_RECHECK_GUARD.json',p/'I60_COMPARISON_SOURCE_REPLAY_PREPARATION_SEAL.json',p/'seal_final_source_replay.py']
result={'status':'PASS_FINAL_INDEPENDENT_I60_ACTUAL_SCIENCE_DOM_AND_NATIVE_EXPORT_SOURCE_REPLAY','increment':'I60','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':[pin(x)for x in owned],'authorityPins':r['authorityPins'],'actualCaptures':49,'actualRoles':dict(collections.Counter(x['replay']['role']for x in r['captures'])),'actualReportPairs':52,'exactFourDimensionSourceRows':208,'completeRawJSONReceiptPairs':52,'actuallyExpandedReceiptPairs':21,'expandedCaptures':7,'currentVisibleCandidateSourceMembershipOrderExact':True,'exactSourceProfiles':387,'namespaceCount':10,'fiveTaxonomyScopeInputsExact':True,'nativeExportReplays':r['exports'],'nativeFourProfileContext':{'selectedKeys':report['selectedKeys'],'anchorKey':report['anchorKey'],'profiles':4,'pairs':3,'exactSourceDenominator':report['sourceDenominator'],'sameCellJoinCount':0,'sameTypeJoinCount':0,'generatedGeometryCount':0,'CanoMarkers':'missing/unknown; no strings inferred from label','CSVDataRows':15,'CSVColumns':10},'syntheticGuards':{'tests':14,'pass':14,'fail':0,'actualExitCode':0},'actualReplayExitCode':0,'guardsAndBoundaries':['No product comparator/presentation module was imported or executed; source-profile receipts/pairs/report derived independently from original indexed evidence and five exact taxonomy scopes.','Full native JSON object equality and CSV JSON-in-cells exact source values/qualifiers/authority/locators/conflicts/identity replay.','Retained display marker case and qualifiers preserved; missing Cano marker fields remain unknown; zero overlap is not biological absence; no automatic conflict resolution.','All49 original raw DOM captures/source inputs and two independently sealed temp export copies rehashed after replay; raw captures untouched.','Three not_mounted captures establish no mounted loading/source gate; delayed304/failed502/canonical full200 fault timing are separately owned by camera transport receipt.','Native event APIs both timed out after5000ms; exact2file landing is independently bound from source-agent birth/mtime/baseline/action receipt. No generatedAt timestamp invented.'],'personalDownloadsFilesReadByThisPeer':0,'personalDirectoryEnumerations':0,'nativeExportsTriggeredByThisPeer':0,'browserHTTPServerOperations':0,'rootWrites':0,'stageWrites':0,'newScientificRightsIdentityGeometryOrREGAdmissions':0,'finalPreservationExecuted':False,'fullGoalComplete':False}
t=p/'I60_FINAL_ACTUAL_SCIENCE_AND_NATIVE_EXPORT_REPLAY_SEAL.json';t.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(pin(t)));print(json.dumps(pin(f)));print(json.dumps(pin(p/'replay_i60_comparison_source.py')))
