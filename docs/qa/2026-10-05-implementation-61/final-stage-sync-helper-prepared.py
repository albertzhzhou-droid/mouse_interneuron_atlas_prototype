from pathlib import Path
import os,json,hashlib
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype');t=Path('/private/tmp/ohri-i51-verification');q=r/'docs/qa/2026-10-05-implementation-61'
read_epoch_failures=[]
first_root_epochs={}
first_stage_epochs={}
def strict_read_once(p):
 f=os.open(p,os.O_RDONLY)
 try:
  s=os.fstat(f);parts=[];position=0
  while position<s.st_size:
   part=os.pread(f,min(4096,s.st_size-position),position)
   assert part,f'Unexpected EOF at {position}/{s.st_size}: {p}'
   parts.append(part);position+=len(part)
  e=os.fstat(f);b=b''.join(parts)
  assert len(b)==s.st_size and(s.st_ino,s.st_size,s.st_mtime_ns)==(e.st_ino,e.st_size,e.st_mtime_ns),f'Source epoch changed: {p}: {s.st_ino,s.st_size,s.st_mtime_ns} -> {e.st_ino,e.st_size,e.st_mtime_ns}; read {len(b)}'
  return b,(s.st_ino,s.st_size,s.st_mtime_ns)
 finally:os.close(f)
def read(p, track_stage=False):
 is_root=str(p).startswith(str(r)+"/")
 observed=first_root_epochs if is_root else first_stage_epochs
 expected=observed.get(p)
 if expected is not None:
  a=p.stat();assert expected==(a.st_ino,a.st_size,a.st_mtime_ns),f'Already observed root source epoch changed: {p}'
 for attempt in range(1,4):
  try:
   b,accepted_epoch=strict_read_once(p)
   if is_root or track_stage or expected is not None:
    a=p.stat();current=(a.st_ino,a.st_size,a.st_mtime_ns)
    assert current==accepted_epoch,f'Source epoch changed after accepted read: {p}'
    if expected is not None:assert expected==current,f'Already observed root source epoch changed: {p}'
    elif is_root or track_stage:observed[p]=accepted_epoch
   return b
  except AssertionError as err:
   if expected is not None or not str(err).startswith('Source epoch changed:'): raise
   read_epoch_failures.append({'path':str(p),'attempt':attempt,'failure':str(err)})
   print('strict epoch attempt refused',attempt,str(err),flush=True)
   if attempt==3: raise
m=json.loads(read(r/'data/research-iteration-manifest-2.91.json'));pins={x['path']:x for x in m['authoritativeInputs']};names=list(pins)+['data/research-iteration-manifest-2.91.json','data/research-renderer-runtime-inputs-2.91.json','docs/qa/2026-10-04-implementation-51/actual-main-view-118824.json'];rows=[];changed=0;stats={}
stage_stats={}
for index,n in enumerate(names):
 if index%100==0: print("progress",index,"of",len(names),n,flush=True)
 assert not (t/n).is_symlink(),n
 assert str((t/n).resolve()).startswith(str(t.resolve())+"/"),n
 b=read(r/n);s=os.stat(r/n);assert first_root_epochs[r/n]==(s.st_ino,s.st_size,s.st_mtime_ns),f'Root source changed after read: {n}';stats[n]=(s.st_size,s.st_mtime_ns,s.st_ino);p=t/n;p.parent.mkdir(parents=True,exist_ok=True)
 if n in pins:assert len(b)==pins[n]['bytes'] and hashlib.sha256(b).hexdigest()==pins[n]['sha256'],f'Current manifest pin drift: {n}'
 if not p.exists() or read(p)!=b:
  assert not p.is_symlink(),n;p.write_bytes(b);changed+=1
 stage_bytes=read(p,track_stage=True);assert stage_bytes==b,f'Actual stage/root mismatch: {n}'
 ss=p.stat();assert first_stage_epochs[p]==(ss.st_ino,ss.st_size,ss.st_mtime_ns),f'Stage source changed after accepted read: {n}';stage_stats[n]=(ss.st_size,ss.st_mtime_ns,ss.st_ino)
 rows.append(dict(path=n,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),stageBytes=len(stage_bytes),stageSha256=hashlib.sha256(stage_bytes).hexdigest()))
for n,before in stats.items():
 s=os.stat(r/n);assert before==(s.st_size,s.st_mtime_ns,s.st_ino),f'Concurrent source changed during stage: {n}'
for n,before in stage_stats.items():
 s=os.stat(t/n);assert before==(s.st_size,s.st_mtime_ns,s.st_ino),f'Concurrent stage changed: {n}'
assert len(pins)==2601
(q/'final-stage-root-parity-receipt.json').write_text(json.dumps({'status':'PASS_FINAL_I61_ACTUAL_ROOT_STAGE_BYTE_PARITY','canonicalUnique':2601,'stageReplayEntries':len(rows),'stageUniquePaths':len(set(x['path']for x in rows)),'sourceHashGateWeakened':False,'strictReadEpochRefusals':read_epoch_failures,'rows':rows},indent=2)+'\n')
(q/'final-current-stage-inputs.json').write_text(json.dumps(rows,indent=2)+'\n');print('synced',len(rows),'changed',changed,'all source stats and manifest pins stable',flush=True)
