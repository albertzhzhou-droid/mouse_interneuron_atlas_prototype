from pathlib import Path
import os,json,hashlib,zipfile,datetime
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype');q=r/'docs/qa/2026-10-05-implementation-56';q.mkdir(parents=True,exist_ok=True)
core=Path('/private/tmp/ohri-upg173-preparation-20261004');addon=Path('/private/tmp/ohri-upg173-parent-integration-addon-20261004')
def read(p):
 fd=os.open(p,os.O_RDONLY);s=os.fstat(fd);b=b''.join(os.pread(fd,min(4096,s.st_size-n),n) for n in range(0,s.st_size,4096));e=os.fstat(fd);os.close(fd);assert len(b)==s.st_size and(s.st_size,s.st_mtime_ns,s.st_ino)==(e.st_size,e.st_mtime_ns,e.st_ino);return b
def pin(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
accepted=r/'docs/qa/2026-10-04-implementation-55/accepted-i55-owned-and-layout-checkpoint.json';a=json.loads(read(accepted));assert a['status']=='PASS_ACCEPTED_I55_CHECKPOINT';assert pin(read(r/a['archive']['path']))=={k:a['archive'][k] for k in ['bytes','sha256']}
m=json.loads(read(r/'data/research-iteration-manifest-2.91.json'));assert pin(read(r/'data/research-iteration-manifest-2.91.json'))==a['canonicalEpoch'];assert len(m['authoritativeInputs'])==2549
c=json.loads(read(core/'UPG173_CANDIDATE_OWNERSHIP.json'))['targets'];d=json.loads(read(addon/'UPG173_PARENT_ADDON_OWNERSHIP.json'))['ownedPaths'];targets=[]
for x in c:targets.append({'path':x['path'],'before':x['preimage'],'proposed':{k:x[k] for k in ['bytes','sha256']},'candidate':'core17'})
for x in d:targets.append({'path':x['path'],'before':x.get('preimage'),'proposed':x['proposal'],'candidate':'addon11'})
assert len(targets)==28 and len({x['path'] for x in targets})==28
patches=[]
for p,expected in [(core/'UPG173_AGGREGATE_PHYSIOLOGY_CANDIDATE.patch',{'bytes':1225868,'sha256':'68006805dbaaa1fb749d08b28cd76d7cc369bab7243aafa3fa838e963fc9fbdf'}),(addon/'UPG173_PARENT_ADDON_AFTER_I55.patch',{'bytes':77329,'sha256':'29405f48c0eaacd72ed72f92563af8b5ba2ff2f6acd2f39c2c314f67cb8ed3d0'})]:
 actual=pin(read(p));assert actual==expected;patches.append({'path':str(p),**actual})
for x in targets:
 p=r/x['path']
 if x['before'] is None:assert not p.exists(),x['path']
 else:assert pin(read(p))==x['before'],x['path']
extra=['tools/build_research_iteration_manifest_2_91.mjs','docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md','data/research-iteration-manifest-2.91.json','data/research-renderer-runtime-inputs-2.91.json'];timeline='docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_56_AGGREGATE_PHYSIOLOGY.md';assert not(r/timeline).exists()
owned={x['path'] for x in targets if x['before'] is not None}|set(extra);preimages=[];archive=q/'preimages.zip';assert not archive.exists()
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for n in sorted(owned):
  b=read(r/n);z.writestr(n,b);preimages.append({'path':n,**pin(b)})
with zipfile.ZipFile(archive) as z:
 for x in preimages:assert pin(z.read(x['path']))=={k:x[k] for k in ['bytes','sha256']}
for x in m['authoritativeInputs']:assert pin(read(r/x['path']))=={k:x[k] for k in ['bytes','sha256']},x['path']
for before,path in [('core-ownership.json',core/'UPG173_CANDIDATE_OWNERSHIP.json'),('addon-ownership.json',addon/'UPG173_PARENT_ADDON_OWNERSHIP.json'),('addon-seal-validation-receipt.json',addon/'qa/UPG173_PARENT_ADDON_SEAL_AND_VALIDATION_RECEIPT.json'),('core-integration-browser-plan.md',core/'UPG173_INTEGRATION_AND_BROWSER_ACCEPTANCE_PLAN.md'),('parent-integration-notes.md',addon/'UPG173_PARENT_ADDON_INTEGRATION_NOTES.md')]: (q/before).write_bytes(read(path))
receipt={'increment':'I56','scope':'current upgraded-layout aggregate adult spinal physiology; core17+addon11 exact patches','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS_BEFORE_MUTATION','acceptedI55Checkpoint':{'path':str(accepted.relative_to(r)),**pin(read(accepted)),'archive':a['archive'],'canonicalEpoch':a['canonicalEpoch']},'baselineInputs':m['authoritativeInputs'],'preimages':preimages,'preimagesArchive':{'path':str(archive.relative_to(r)),**pin(read(archive))},'candidateTargets':targets,'newPathAbsence':[x['path'] for x in targets if x['before'] is None]+[timeline],'rootOwnedExtras':extra,'timeline':timeline,'patches':patches,'newCanonicalCandidatePaths':[x['path'] for x in targets if x['path'] not in {row['path'] for row in m['authoritativeInputs']}],'scientificBoundary':{'sourcesBefore':31,'sourcesAfter':32,'setsBefore':41,'setsAfter':42,'profiles':387,'rosters':13,'objectSets':4,'exactNavigableSets':15,'navigationActions':274,'completed':83,'roadmap':243,'newPhysicalCellRosters':0,'newGeometry':0,'newIdentities':0,'REG':0,'fullGoalComplete':False}}
(q/'intake-preservation.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':receipt['status'],'preimages':len(preimages),'absences':len(receipt['newPathAbsence']),'candidatePaths':len(targets),'newCanonicalCandidatePaths':len(receipt['newCanonicalCandidatePaths']),'projectedCanonicalWithTimeline':2549+len(receipt['newCanonicalCandidatePaths'])+1}))
