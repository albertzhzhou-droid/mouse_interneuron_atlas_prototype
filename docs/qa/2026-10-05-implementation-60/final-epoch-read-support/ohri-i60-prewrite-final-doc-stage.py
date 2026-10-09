from pathlib import Path
import os,json,hashlib
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype');t=Path('/private/tmp/ohri-i51-verification');q=r/'docs/qa/2026-10-05-implementation-60'
def read(p):
 f=os.open(p,os.O_RDONLY)
 try:
  s=os.fstat(f);parts=[];position=0
  while position<s.st_size:
   part=os.pread(f,min(4096,s.st_size-position),position)
   assert part,f'Unexpected EOF at {position}/{s.st_size}: {p}'
   parts.append(part);position+=len(part)
  e=os.fstat(f);b=b''.join(parts)
  assert len(b)==s.st_size and(s.st_ino,s.st_size,s.st_mtime_ns)==(e.st_ino,e.st_size,e.st_mtime_ns),f'Source epoch changed: {p}: {s.st_ino,s.st_size,s.st_mtime_ns} -> {e.st_ino,e.st_size,e.st_mtime_ns}; read {len(b)}'
  return b
 finally:os.close(f)
m=json.loads(read(r/'data/research-iteration-manifest-2.91.json'));pins={x['path']:x for x in m['authoritativeInputs']};names=list(pins)+['data/research-iteration-manifest-2.91.json','data/research-renderer-runtime-inputs-2.91.json','docs/qa/2026-10-04-implementation-51/actual-main-view-118824.json'];rows=[];changed=0;stats={}
assert len(pins)==2585
allowed_final_doc_changes={'docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md','docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_60_COMPARISON_BOOKMARK.md'}
doc_deltas=[]
for n in names:
 b=read(r/n);s=os.stat(r/n);stats[n]=(s.st_size,s.st_mtime_ns,s.st_ino);p=t/n;p.parent.mkdir(parents=True,exist_ok=True)
 if n in pins:
  actual={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
  expected={k:pins[n][k]for k in ['bytes','sha256']}
  if actual!=expected:
   assert n in allowed_final_doc_changes,f'Unexpected protected current manifest drift: {n}'
   doc_deltas.append({'path':n,'beforeCurrentManifest':expected,'actualFinalOwnedDocument':actual})
 if not p.exists() or read(p)!=b:
  assert not p.is_symlink(),n;p.write_bytes(b);changed+=1
 rows.append(dict(path=n,bytes=len(b),sha256=hashlib.sha256(b).hexdigest()))
for n,before in stats.items():
 s=os.stat(r/n);assert before==(s.st_size,s.st_mtime_ns,s.st_ino),f'Concurrent source changed during stage: {n}'
(q/'prewrite-final-doc-stage-inputs.json').write_text(json.dumps({'status':'PASS_CURRENT_ROOT_STAGE_PARITY_EXCEPT_DECLARED_FINAL_OWNED_DOC_EPOCH','rows':rows,'ownedFinalDocDeltas':doc_deltas,'canonical':2585,'stageFiles':len(rows),'rootMutations':0,'manifestWritten':False,'sourceHashGateWeakened':False},indent=2)+'\n');print('prewrite synced',len(rows),'changed',changed,'all protected pins and source epochs exact; only',len(doc_deltas),'declared final documents advance',flush=True)
