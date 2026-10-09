from pathlib import Path
import os,json,hashlib,zipfile,datetime
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
q=r/'docs/qa/2026-10-05-implementation-60';c=Path('/private/tmp/ohri-i60-molecular-comparison-bookmark-candidate')
def read(p):
    f=os.open(p,os.O_RDONLY)
    try:
        s=os.fstat(f);b=b''.join(os.pread(f,min(4096,s.st_size-i),i)for i in range(0,s.st_size,4096));e=os.fstat(f)
        assert len(b)==s.st_size and(s.st_size,s.st_mtime_ns,s.st_ino)==(e.st_size,e.st_mtime_ns,e.st_ino)
        return b
    finally:os.close(f)
def pin(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
accepted=r/'docs/qa/2026-10-05-implementation-59/accepted-i59-owned-and-layout-checkpoint.json';a=json.loads(read(accepted));assert a['status']=='PASS_ACCEPTED_I59_CHECKPOINT' and len(a['members'])==59
assert pin(read(r/a['archive']['path']))=={k:a['archive'][k]for k in ('bytes','sha256')}
with zipfile.ZipFile(r/a['archive']['path'])as z:
    assert len(z.namelist())==59
    for x in a['members']:
        assert pin(z.read(x['path']))=={k:x[k]for k in ('bytes','sha256')}
        assert pin(read(r/x['path']))=={k:x[k]for k in ('bytes','sha256')},x['path']
m=json.loads(read(r/'data/research-iteration-manifest-2.91.json'));assert len(m['authoritativeInputs'])==2581 and pin(read(r/'data/research-iteration-manifest-2.91.json'))==a['canonicalEpoch']
o=json.loads(read(c/'ownership.json'));targets=[{**x,'proposalRoot':str(c/'proposed')}for x in o['integrationTargets']];assert len(targets)==4
for x in targets:
    p=r/x['path']
    if x['before']is None:assert not p.exists() and not p.is_symlink(),x['path']
    else:assert pin(read(p))==x['before'],x['path']
    assert pin(read(c/'proposed'/x['path']))==x['after'],x['path']
assert pin(read(Path(o['patch']['path'])))=={k:o['patch'][k]for k in ('bytes','sha256')}
for x in o['scientificInputPinsRetained']:assert pin(read(r/x['path']))=={k:x[k]for k in ('bytes','sha256')},x['path']
for x in o['currentReadOnlyLayoutPins']:assert pin(read(r/x['path']))==x['current'],x['path']
timeline='docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_60_COMPARISON_BOOKMARK.md';assert not(r/timeline).exists()
extra=['tools/build_research_iteration_manifest_2_91.mjs','docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md','data/research-iteration-manifest-2.91.json','data/research-renderer-runtime-inputs-2.91.json']
for x in m['authoritativeInputs']:assert pin(read(r/x['path']))=={k:x[k]for k in ('bytes','sha256')},x['path']
q.mkdir(parents=True,exist_ok=True);archive=q/'preimages.zip';assert not archive.exists();pre=[]
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED)as z:
    for n in sorted({x['path']for x in targets if x['before']is not None}|set(extra)):
        b=read(r/n);z.writestr(n,b);pre.append({'path':n,**pin(b)})
with zipfile.ZipFile(archive)as z:
    for x in pre:assert pin(z.read(x['path']))=={k:x[k]for k in ('bytes','sha256')}
handoff=Path('/private/tmp/ohri-i60-readonly-preintake-20261005');v=json.loads(read(handoff/'I60_PRE_INTAKE_READONLY_REVIEW.json'))
for key,x in v['artifacts'].items():
    b=read(Path(x['path']));assert pin(b)=={k:x[k]for k in ('bytes','sha256')};(q/('candidate-'+key+'.json' if key!='patch' else 'candidate.patch')).write_bytes(b)
for p in handoff.iterdir():
    if p.is_file() and not p.is_symlink():(q/p.name).write_bytes(read(p))
x={'increment':'I60','status':'PASS_BEFORE_MUTATION','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'acceptedI59Checkpoint':{'path':str(accepted.relative_to(r)),**pin(read(accepted)),'archive':a['archive'],'canonicalEpoch':a['canonicalEpoch']},'baselineInputs':m['authoritativeInputs'],'preimages':pre,'preimagesArchive':{'path':str(archive.relative_to(r)),**pin(read(archive))},'candidateTargets':targets,'newPathAbsence':[t['path']for t in targets if t['before']is None]+[timeline],'rootOwnedExtras':extra,'timeline':timeline,'patches':[o['patch']],'newCanonicalCandidatePaths':[t['path']for t in targets if t['path']not in{z['path']for z in m['authoritativeInputs']}],'scientificBoundary':{'sources':32,'sets':42,'profiles':387,'namespaces':10,'rosters':13,'objectSets':4,'explorerRecords':673,'morphologySelectable':181,'census':142,'supplementary':39,'completed':83,'roadmap':243,'newScientificSourceAdmissions':0,'newIdentities':0,'REG':0,'fullGoalComplete':False},'privateRuntimeMembershipUnchanged':198,'positionsBuildMembershipUnchanged':40,'scientificAndCurrentLayoutPinsRetained':o['scientificInputPinsRetained']+o['currentReadOnlyLayoutPins']}
(q/'intake-preservation.json').write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':x['status'],'preimages':len(pre),'absences':len(x['newPathAbsence']),'candidateTargets':4,'projectedCanonical':2585}))
