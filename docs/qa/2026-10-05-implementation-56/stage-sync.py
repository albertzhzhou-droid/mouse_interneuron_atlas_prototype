from pathlib import Path
import os,json,hashlib
r=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype');t=Path('/private/tmp/ohri-i51-verification');q=r/'docs/qa/2026-10-05-implementation-56'
def read(p):
 f=os.open(p,os.O_RDONLY);s=os.fstat(f);b=b''.join(os.pread(f,min(4096,s.st_size-i),i) for i in range(0,s.st_size,4096));e=os.fstat(f);os.close(f);assert len(b)==s.st_size and(s.st_size,s.st_mtime_ns)==(e.st_size,e.st_mtime_ns);return b
m=json.loads(read(r/'data/research-iteration-manifest-2.91.json'));pins={x['path']:x for x in m['authoritativeInputs']};names=list(pins)+['data/research-iteration-manifest-2.91.json','data/research-renderer-runtime-inputs-2.91.json','docs/qa/2026-10-04-implementation-51/actual-main-view-118824.json'];rows=[];changed=0;stats={}
for n in names:
 b=read(r/n);s=os.stat(r/n);stats[n]=(s.st_size,s.st_mtime_ns,s.st_ino);p=t/n;p.parent.mkdir(parents=True,exist_ok=True)
 if n in pins:assert len(b)==pins[n]['bytes'] and hashlib.sha256(b).hexdigest()==pins[n]['sha256'],f'Current manifest pin drift: {n}'
 if not p.exists() or read(p)!=b:
  assert not p.is_symlink(),n;p.write_bytes(b);changed+=1
 rows.append(dict(path=n,bytes=len(b),sha256=hashlib.sha256(b).hexdigest()))
for n,before in stats.items():
 s=os.stat(r/n);assert before==(s.st_size,s.st_mtime_ns,s.st_ino),f'Concurrent source changed during stage: {n}'
(q/'current-stage-inputs.json').write_text(json.dumps(rows,indent=2)+'\n');print('synced',len(rows),'changed',changed,'all source stats and manifest pins stable',flush=True)
