from pathlib import Path
import os,json,hashlib,zipfile,datetime
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype');q=r/'docs/qa/2026-10-05-implementation-57';c=Path('/private/tmp/ohri-i57-explorer-keyboard-candidate');q.mkdir(parents=True,exist_ok=True)
def read(p):
 fd=os.open(p,os.O_RDONLY)
 try:
  s=os.fstat(fd);b=b''.join(os.pread(fd,min(4096,s.st_size-n),n) for n in range(0,s.st_size,4096));e=os.fstat(fd);assert len(b)==s.st_size and(s.st_size,s.st_mtime_ns,s.st_ino)==(e.st_size,e.st_mtime_ns,e.st_ino);return b
 finally:os.close(fd)
def pin(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
accepted=r/'docs/qa/2026-10-05-implementation-56/accepted-i56-owned-and-layout-checkpoint.json';a=json.loads(read(accepted));assert a['status']=='PASS_ACCEPTED_I56_CHECKPOINT';assert pin(read(r/a['archive']['path']))=={k:a['archive'][k] for k in ('bytes','sha256')}
m=json.loads(read(r/'data/research-iteration-manifest-2.91.json'));assert pin(read(r/'data/research-iteration-manifest-2.91.json'))==a['canonicalEpoch'];assert len(m['authoritativeInputs'])==2570
ownership=json.loads(read(c/'ownership.json'));targets=ownership['integrationTargets'];assert len(targets)==3
patch=ownership['patch'];assert pin(read(Path(patch['path'])))=={k:patch[k] for k in ('bytes','sha256')}
for x in targets:
 p=r/x['path']
 if x['before'] is None:assert not p.exists(),x['path']
 else:assert pin(read(p))==x['before'],x['path']
 assert pin(read(c/'proposed'/x['path']))==x['after'],x['path']
for x in ownership['reusedInputsUntouched']:assert pin(read(r/x['path']))=={k:x[k] for k in ('bytes','sha256')}
extra=['tools/build_research_iteration_manifest_2_91.mjs','docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md','data/research-iteration-manifest-2.91.json','data/research-renderer-runtime-inputs-2.91.json'];timeline='docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_57_EXPLORER_KEYBOARD.md';assert not(r/timeline).exists()
owned={x['path'] for x in targets if x['before'] is not None}|set(extra);preimages=[];archive=q/'preimages.zip';assert not archive.exists()
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for n in sorted(owned):
  b=read(r/n);z.writestr(n,b);preimages.append({'path':n,**pin(b)})
with zipfile.ZipFile(archive) as z:
 for x in preimages:assert pin(z.read(x['path']))=={k:x[k] for k in ('bytes','sha256')}
for x in m['authoritativeInputs']:assert pin(read(r/x['path']))=={k:x[k] for k in ('bytes','sha256')},x['path']
for source,name in [('ownership.json','candidate-ownership.json'),('qa/I57_CANDIDATE_SEAL_AND_VALIDATION_RECEIPT.json','candidate-seal.json'),('qa/ACTUAL_BROWSER_QA_PLAN.md','candidate-actual-browser-plan.md')]: (q/name).write_bytes(read(c/source))
peer=Path('/private/tmp/ohri-i57-peer-review-20261004/I57_FOCUS_SELECTION_SOURCE_AND_LAYOUT_PEER_REVIEW.json');(q/'candidate-independent-peer-review.json').write_bytes(read(peer))
receipt={'increment':'I57','status':'PASS_BEFORE_MUTATION','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Source namespace keyboard focus in current upgraded independent Explorer layout','acceptedI56Checkpoint':{'path':str(accepted.relative_to(r)),**pin(read(accepted)),'archive':a['archive'],'canonicalEpoch':a['canonicalEpoch']},'baselineInputs':m['authoritativeInputs'],'preimages':preimages,'preimagesArchive':{'path':str(archive.relative_to(r)),**pin(read(archive))},'candidateTargets':targets,'newPathAbsence':[x['path'] for x in targets if x['before'] is None]+[timeline],'rootOwnedExtras':extra,'timeline':timeline,'patch':patch,'reusedInputsUntouched':ownership['reusedInputsUntouched'],'newCanonicalCandidatePaths':[x['path'] for x in targets if x['path'] not in {row['path'] for row in m['authoritativeInputs']}],'scientificBoundary':{'sources':32,'sets':42,'profiles':387,'rosters':13,'objectSets':4,'explorerRecords':673,'morphologySelectable':181,'census':142,'supplementary':39,'completed':83,'roadmap':243,'newScientificSourceAdmissions':0,'newIdentities':0,'REG':0,'fullGoalComplete':False}}
(q/'intake-preservation.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':receipt['status'],'preimages':len(preimages),'absences':len(receipt['newPathAbsence']),'candidatePaths':len(targets),'newCanonicalCandidatePaths':len(receipt['newCanonicalCandidatePaths']),'projectedCanonicalWithTimeline':2570+len(receipt['newCanonicalCandidatePaths'])+1}))
