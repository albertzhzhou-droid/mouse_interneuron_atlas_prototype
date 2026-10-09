from pathlib import Path
import os,json,hashlib,zipfile,datetime
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
q=r/'docs/qa/2026-10-05-implementation-59'
c=Path('/private/tmp/ohri-i59-cano-rna-pair-candidate')
aRoot=Path('/private/tmp/ohri-i59-current-package-parent-addon')
q.mkdir(parents=True,exist_ok=True)
def read(p):
 f=os.open(p,os.O_RDONLY)
 try:
  s=os.fstat(f);b=b''.join(os.pread(f,min(4096,s.st_size-n),n) for n in range(0,s.st_size,4096));e=os.fstat(f)
  assert len(b)==s.st_size and(s.st_size,s.st_mtime_ns,s.st_ino)==(e.st_size,e.st_mtime_ns,e.st_ino)
  return b
 finally:os.close(f)
pin=lambda b:dict(bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
accepted=r/'docs/qa/2026-10-05-implementation-58/accepted-i58-owned-and-layout-checkpoint.json'
a=json.loads(read(accepted));assert a['status']=='PASS_ACCEPTED_I58_CHECKPOINT'
assert pin(read(r/a['archive']['path']))=={k:a['archive'][k] for k in ('bytes','sha256')}
with zipfile.ZipFile(r/a['archive']['path']) as z:
 for x in a['members']:
  assert pin(z.read(x['path']))=={k:x[k] for k in ('bytes','sha256')}
  assert pin(read(r/x['path']))=={k:x[k] for k in ('bytes','sha256')}
m=json.loads(read(r/'data/research-iteration-manifest-2.91.json'))
assert pin(read(r/'data/research-iteration-manifest-2.91.json'))==a['canonicalEpoch'] and len(m['authoritativeInputs'])==2577
core=json.loads(read(c/'I59_INTEGRATION_OWNERSHIP.json'))
addon=json.loads(read(aRoot/'I59_PARENT_ADDON_OWNERSHIP.json'))
targets=[]
for x in core['ownedPaths']:
 targets.append(dict(path=x['after']['path'],before=None if x['before'] is None else {k:x['before'][k] for k in ('bytes','sha256')},after={k:x['after'][k] for k in ('bytes','sha256')},proposalRoot=str(c/'proposed')))
for x in addon['ownedTargets']:targets.append({**x,'proposalRoot':str(aRoot/'proposed')})
assert len(targets)==7 and len({x['path'] for x in targets})==7
patches=[addon['coreCandidateUnmodified'],addon['patch']]
for x in patches:assert pin(read(Path(x['path'])))=={k:x[k] for k in ('bytes','sha256')}
for x in targets:
 p=r/x['path']
 if x['before'] is None:assert not p.exists() and not p.is_symlink(),x['path']
 else:assert pin(read(p))==x['before'],x['path']
 assert pin(read(Path(x['proposalRoot'])/x['path']))==x['after'],x['path']
extra=['tools/build_research_iteration_manifest_2_91.mjs','docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md','data/research-iteration-manifest-2.91.json','data/research-renderer-runtime-inputs-2.91.json']
timeline='docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_59_CANO_RNA_PAIRS.md'
assert not(r/timeline).exists()
owned={x['path'] for x in targets if x['before'] is not None}|set(extra)
pre=[];archive=q/'preimages.zip';assert not archive.exists()
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for n in sorted(owned):
  b=read(r/n);z.writestr(n,b);pre.append(dict(path=n,**pin(b)))
with zipfile.ZipFile(archive) as z:
 for x in pre:assert pin(z.read(x['path']))=={k:x[k] for k in ('bytes','sha256')}
for x in m['authoritativeInputs']:assert pin(read(r/x['path']))=={k:x[k] for k in ('bytes','sha256')},x['path']
copies=[(c/'I59_INTEGRATION_OWNERSHIP.json','candidate-core-ownership.json'),(c/'I59_SEAL_AND_VALIDATION_RECEIPT.json','candidate-core-seal.json'),(aRoot/'I59_PARENT_ADDON_OWNERSHIP.json','candidate-addon-ownership.json'),(aRoot/'I59_PARENT_ADDON_SEAL_AND_VALIDATION_RECEIPT.json','candidate-addon-seal.json'),(aRoot/'I59_NATIVE_PRIORITY_ACCEPTANCE_PLAN.md','candidate-actual-browser-plan.md'),(Path('/private/tmp/ohri-i59-peer-independent-review/I59_INDEPENDENT_SCIENTIFIC_PAIR_REVIEW.json'),'candidate-independent-source-review.json'),(Path('/private/tmp/ohri-i59-addon-peer-independent-review/I59_ADDON_INDEPENDENT_PACKAGE_REVIEW.json'),'candidate-independent-addon-review.json'),(Path('/private/tmp/ohri-i59-mounted-closure-review/I59_MOUNTED_AST_CLOSURE_REVIEW.json'),'mounted-ast-closure-review.json')]
for p,n in copies:(q/n).write_bytes(read(p))
receipt={'increment':'I59','status':'PASS_BEFORE_MUTATION','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'acceptedI58Checkpoint':{'path':str(accepted.relative_to(r)),**pin(read(accepted)),'archive':a['archive'],'canonicalEpoch':a['canonicalEpoch']},'baselineInputs':m['authoritativeInputs'],'preimages':pre,'preimagesArchive':{'path':str(archive.relative_to(r)),**pin(read(archive))},'candidateTargets':targets,'newPathAbsence':[x['path'] for x in targets if x['before'] is None]+[timeline],'rootOwnedExtras':extra,'timeline':timeline,'patches':patches,'newCanonicalCandidatePaths':[x['path'] for x in targets if x['path'] not in {row['path'] for row in m['authoritativeInputs']}],'scientificBoundary':{'sources':32,'sets':42,'profiles':387,'rosters':13,'objectSets':4,'explorerRecords':673,'morphologySelectable':181,'census':142,'supplementary':39,'completed':83,'roadmap':243,'CHOLProfiles':11,'CHOLNuclei':923,'newScientificSourceAdmissions':0,'newIdentities':0,'REG':0,'fullGoalComplete':False},'privateRuntimeMembershipUnchanged':198,'positionsBuildMembershipUnchanged':40,'packageExistingAuthorityScopesOnly':['COMPARATIVE_SWC_VIEW_BUILD','INDEPENDENT_OBJECT_VIEW_BUILD','RONZANO_SOURCE_VIEW_BUILD']}
(q/'intake-preservation.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':receipt['status'],'preimages':len(pre),'absences':len(receipt['newPathAbsence']),'candidatePaths':len(targets),'newCanonicalCandidatePaths':len(receipt['newCanonicalCandidatePaths']),'projectedCanonicalWithTimeline':2577+len(receipt['newCanonicalCandidatePaths'])+1}))
