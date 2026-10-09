from pathlib import Path
import hashlib,io,json,os,re,zipfile
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype');OUT=Path(__file__).resolve().parent;QA=ROOT/'docs/qa/2026-10-04-implementation-54'
cache={};reads={'strategy':'os.pread4096 with stable inode,size,mtime','files':0,'bytes':0,'preadCalls':0}
def read(path):
 if path in cache:return cache[path]
 fd=os.open(path,os.O_RDONLY);h=hashlib.sha256();parts=[];offset=0
 try:
  a=os.fstat(fd)
  while True:
   block=os.pread(fd,4096,offset);reads['preadCalls']+=1
   if not block:break
   h.update(block);parts.append(block);offset+=len(block)
  z=os.fstat(fd);assert (a.st_ino,a.st_size,a.st_mtime_ns)==(z.st_ino,z.st_size,z.st_mtime_ns) and offset==z.st_size
 finally:os.close(fd)
 reads['files']+=1;reads['bytes']+=offset
 result=({'bytes':offset,'sha256':h.hexdigest()},b''.join(parts));cache[path]=result;return result
def pin(row):return {k:row[k] for k in ['bytes','sha256']}
corePin,body=read(OUT/'I54_CORE_PRESERVATION.json');base=json.loads(body);assert base['status']=='PASS' and corePin['sha256']=='288491d831f8a4bd7313d62bd5ef50b7536f904dae0f10b0c9883af94818adf2'
parentCorePin,_=read(QA/'final-preservation.json');assert parentCorePin==corePin
checkpoint={row['path']:row['currentActual'] for row in base['fullAuthoritativeInputComparison'] if row['currentActual'] is not None};checkpoint['data/research-iteration-manifest-2.91.json']=base['manifestEpoch']['end']
acceptedJson,body=read(QA/'accepted-i54-inputs.json');accepted=json.loads(body);archivePin,archiveBody=read(QA/'accepted-i54-inputs.zip');archive=zipfile.ZipFile(io.BytesIO(archiveBody))
rows=[];names=archive.namelist();assert len(names)==len(set(names)) and set(names)=={row['path'] for row in accepted['inputs']}
for row in accepted['inputs']:
 rel=row['path'];data=archive.read(rel);zipPin={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};expected=checkpoint[rel]
 rows.append({'path':rel,'acceptedExpected':pin(row),'completedI54AuditActual':expected,'archivedActual':zipPin,'allI54EpochExact':pin(row)==expected==zipPin})
logPin,logBody=read(QA/'full-research-first-pass.log');text=logBody.decode();counts={}
for name,value in [('tests',1468),('pass',1453),('fail',0),('cancelled',0),('skipped',15)]:
 matches=re.findall(rf'ℹ {name} (\d+)\b',text);assert matches and int(matches[-1])==value;counts[name]=int(matches[-1])
# Parent read and accepted the completed PASS receipt, then began authorized I55.
# Later root bytes cannot serve as I54 checkpoint comparisons.
postMoves=[]
for rel in ['app/ResearchCollectionPage.tsx','tools/build_research_iteration_manifest_2_91.mjs']:
 current,currentBody=read(ROOT/rel);i55,i55Body=read(Path('/private/tmp/ohri-i55-rebased-current-i54-20261004/proposed')/rel)
 timelineLine=b'  \"docs/RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_55_SOURCE_NAVIGATION.md\",\n'
 rootTimelineOnly=rel.startswith('tools/') and currentBody.count(timelineLine)==1 and currentBody.replace(timelineLine,b'')==i55Body
 postMoves.append({'path':rel,'completedI54Actual':checkpoint[rel],'laterLiveRootActual':current,'sealedI55Proposed':i55,'laterBytesMatchAuthorizedI55Proposal':current==i55,'parentI55TimelineOnlyRecipePin':rootTimelineOnly,'laterMovementMatchesI55WithParentOwnedTimeline':current==i55 or rootTimelineOnly,'I54BytePreservationFailure':False})
checks={'accepted22ZIPMatchesCompletedI54Checkpoint':len(rows)==22 and all(row['allI54EpochExact'] for row in rows),'acceptedArchiveDeclaredNameAndInventoryExact':Path(accepted['archive']).name=='accepted-i54-inputs.zip' and len(names)==22,'fullResearchNativeLog1468_1453_15_0':counts=={'tests':1468,'pass':1453,'fail':0,'cancelled':0,'skipped':15},'parentCopiedCorePASSReceiptExact':parentCorePin==corePin,'observedLaterTwoCodePathsMatchAuthorizedI55':all(row['laterMovementMatchesI55WithParentOwnedTimeline'] for row in postMoves)}
result={'status':'PASS' if all(checks.values()) else 'FAIL','scope':'I54 accepted archive and native full-test log against the completed I54 audit epoch; future I55 root movement is separate','coreReceipt':{'path':str(OUT/'I54_CORE_PRESERVATION.json'),**corePin},'parentArchivedCoreExact':parentCorePin,'checks':checks,'I54ManifestEpoch':base['manifestEpoch']['end'],'acceptedArchive':{'recordedScope':accepted['scope'],'inputCount':len(rows),'json':acceptedJson,'archive':archivePin,'rows':rows},'actualFullResearchLog':{'actual':logPin,'finalNativeNodeCounts':counts,'exitCodeScope':'Actual process exit0 retained by parent run/summary; this log independently confirms final native Node counts.'},'postAuditI55Movement':postMoves,'epochExplanation':'Parent confirmed I55 started after reading and accepting the actual core PASS receipt. The22ZIP was saved before I55 and is verified against that completed I54 checkpoint, not later live root. The15 native capture replay applies to exact I54 build authority; later I55 wrapper changes require future-current receipts and do not retroactively alter these captures.','sharedRootWrites':0,'parentStageWrites':0,'readContract':reads}
target=OUT/'I54_ACCEPTED_ARCHIVE_CHECKPOINT_ADDENDUM.json';target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'receipt':str(target),'receiptActual':read(target)[0],'status':result['status'],'checks':checks,'readContract':reads},indent=2));assert result['status']=='PASS'
