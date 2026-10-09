from pathlib import Path
import os,hashlib,json,gzip,datetime
stage=Path('/private/tmp/ohri-i51-verification');root=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype');out=Path('/private/tmp/ohri-i57-wire-fault');out.mkdir(exist_ok=True);qa=root/'docs/qa/2026-10-05-implementation-57'
def read(p):
 f=os.open(p,os.O_RDONLY)
 try:
  s=os.fstat(f);b=b''.join(os.pread(f,min(4096,s.st_size-i),i) for i in range(0,s.st_size,4096));z=os.fstat(f);assert len(b)==s.st_size and(s.st_size,s.st_mtime_ns)==(z.st_size,z.st_mtime_ns);return b
 finally:os.close(f)
def pin(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
raw=read(root/'public/data/research_explorer_index_v1/search-index.json');gz=read(root/'public/data/research_explorer_index_v1/search-index.json.gz');assert gzip.decompress(gz)==raw
fault=raw.replace(b'CSF-cN',b'CSF-cM',1);assert len(fault)==len(raw) and fault!=raw;json.loads(fault);faultgz=gzip.compress(fault,compresslevel=9,mtime=0);assert gzip.decompress(faultgz)==fault
rows=[]
for prefix in ['public','dist/client']:
 for suffix,original,bad in [('json',raw,fault),('json.gz',gz,faultgz)]:
  n=prefix+'/data/research_explorer_index_v1/search-index.'+suffix;p=stage/n;before=read(p);assert before==original,n;backup=out/(prefix.replace('/','_')+'-search-index.'+suffix);assert not backup.exists();backup.write_bytes(before);assert read(backup)==before;rows.append({'path':str(p),'backup':str(backup),'before':pin(before),'fault':pin(bad)});p.write_bytes(bad);assert read(p)==bad
receipt={'case':'actual valid-JSON/gzip same-size decoded checksum fault; isolated preview only','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'rootScientificInputsModified':False,'decodedBytes':len(raw),'originalDecoded':pin(raw),'faultDecoded':pin(fault),'gzipWireSizeAssertedEqual':False,'files':rows,'restored':False,'browserObserved':False,'originalRootIndexStillExact':read(root/'public/data/research_explorer_index_v1/search-index.json')==raw and read(root/'public/data/research_explorer_index_v1/search-index.json.gz')==gz}
(qa/'actual-isolated-wire-fault-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'faultDecoded':pin(fault),'faultWire':pin(faultgz),'files':len(rows),'rootUnmodified':receipt['originalRootIndexStillExact']}))
