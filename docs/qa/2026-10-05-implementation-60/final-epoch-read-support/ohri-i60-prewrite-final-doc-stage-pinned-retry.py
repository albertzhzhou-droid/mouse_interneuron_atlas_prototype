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
declared_final_doc_pins={'docs/UPGRADE_PLAN_2026-09-24.md': {'bytes': 166136, 'sha256': '9fc983a277be207d560bd709310b3f6332554ebfc4f600484c3deb0f2042c4ec'}, 'docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md': {'bytes': 86274, 'sha256': '665049e1b1368c176e8ebe809837bbd66cf5747faa3f1cb230ba19728859d3ff'}, 'docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_60_COMPARISON_BOOKMARK.md': {'bytes': 9101, 'sha256': 'd9ab4723ab6b28f4b65f9f5af60d030462b07bf55b3d48cb4edb851e597c9b58'}}
doc_deltas=[]
for index,n in enumerate(names):
 if index%100==0: print("progress",index,"of",len(names),n,flush=True)
 assert (t/n).resolve().is_relative_to(t.resolve()) if hasattr(Path,"is_relative_to") else str((t/n).resolve()).startswith(str(t.resolve())+"/"),n
 assert not (t/n).is_symlink(),n
 b=read(r/n);s=os.stat(r/n);stats[n]=(s.st_size,s.st_mtime_ns,s.st_ino);p=t/n;p.parent.mkdir(parents=True,exist_ok=True)
 if n in pins:
  actual={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
  if n in declared_final_doc_pins: assert actual==declared_final_doc_pins[n],f'Declared final document epoch drift: {n}'
  expected={k:pins[n][k]for k in ['bytes','sha256']}
  if actual!=expected:
   assert n in allowed_final_doc_changes,f'Unexpected protected current manifest drift: {n}'
   doc_deltas.append({'path':n,'beforeCurrentManifest':expected,'actualFinalOwnedDocument':actual})
 if not p.exists() or read(p)!=b:
  assert not p.is_symlink(),n;p.write_bytes(b);changed+=1
 rows.append(dict(path=n,bytes=len(b),sha256=hashlib.sha256(b).hexdigest()))
for n,before in stats.items():
 s=os.stat(r/n);assert before==(s.st_size,s.st_mtime_ns,s.st_ino),f'Concurrent source changed during stage: {n}'
(q/'prewrite-final-doc-stage-inputs.json').write_text(json.dumps({'status':'PASS_ROOT_GUARDED_PREWRITE_WITH_DECLARED_DOC_PINS_STAGE_FINAL_REPLAY_PENDING','rows':rows,'ownedFinalDocDeltas':doc_deltas,'canonical':2585,'stageFiles':len(rows),'rootMutations':0,'manifestWritten':False,'sourceHashGateWeakened':False},indent=2)+'\n');print('prewrite synced',len(rows),'changed',changed,'all protected pins and source epochs exact; only',len(doc_deltas),'declared final documents advance',flush=True)
