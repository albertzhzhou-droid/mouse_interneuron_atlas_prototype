#!/usr/bin/env python3
"""Bounded exact-run coordinate entry acquisition; retained original receipts never overwritten."""
import urllib.request,zipfile,io,json,hashlib,datetime,struct
from pathlib import Path
URL='https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/Run8_Slide2_Mus_M7_F7/cells.zarr.zip'
SIZE=252307597;BUDGET=9_000_000
ROOT=Path(__file__).resolve().parent.parent
out=ROOT/'data/source-candidates/bil-xenium-source-gate-20261001/cells-zarr-coordinate-inputs';out.mkdir(parents=True,exist_ok=True)
if (out/'receipt.json').exists():
 receipt=json.loads((out/'receipt.json').read_text())
 for row in receipt['rangeReceipts']+receipt['selectedEntryReceipts']:
  data=(ROOT/row.get('path',row.get('extractedPath'))).read_bytes()
  if len(data)!=row['bytes'] or hashlib.sha256(data).hexdigest()!=row['sha256']:raise ValueError('Retained coordinate receipt differs; original inputs will not be overwritten')
 print('Retained original coordinate inputs verified; no remote fetch required')
 raise SystemExit(0)
class Ranges(io.RawIOBase):
 def __init__(self):self.pos=0;self.total=0;self.records=[]
 def seekable(self):return True
 def readable(self):return True
 def tell(self):return self.pos
 def seek(self,offset,whence=0):
  self.pos=offset if whence==0 else self.pos+offset if whence==1 else SIZE+offset
  if not 0<=self.pos<=SIZE:raise ValueError('Invalid offset')
  return self.pos
 def read(self,n=-1):
  if n<0:n=SIZE-self.pos
  n=min(n,SIZE-self.pos)
  if n==0:return b''
  if n>2_000_000 or self.total+n>BUDGET:raise ValueError('Bounded metadata-only range budget exceeded')
  start=self.pos;end=start+n-1
  cached=out/f'range-{start}-{end}.bin'
  if cached.exists():
   data=cached.read_bytes()
   if len(data)!=n:raise ValueError('Cached exact range length mismatch')
   self.pos+=n;self.total+=n
   self.records.append({'path':str(cached.relative_to(ROOT)),'rangeStart':start,'rangeEnd':end,'bytes':n,'sha256':hashlib.sha256(data).hexdigest(),'acquisition':'retained exact HTTP206 range from prior partial attempt'})
   return data
  req=urllib.request.Request(URL,headers={'Range':f'bytes={start}-{end}','User-Agent':'OHRI-source-audit/1.0'})
  with urllib.request.urlopen(req,timeout=60) as r:
   if r.status!=206 or r.headers.get('Content-Range')!=f'bytes {start}-{end}/{SIZE}':raise ValueError('Exact HTTP range and archive length required')
   data=r.read(n+1)
  if len(data)!=n:raise ValueError('Range length mismatch')
  self.pos+=n;self.total+=n;name=f'range-{start}-{end}.bin';(out/name).write_bytes(data)
  self.records.append({'path':str((out/name).relative_to(ROOT)),'rangeStart':start,'rangeEnd':end,'bytes':n,'sha256':hashlib.sha256(data).hexdigest(),'acquisition':'new exact HTTP206 range'})
  return data
remote=Ranges();entries=[]
with zipfile.ZipFile(remote) as z:
 names=z.namelist(); (out/'entry-index.json').write_text(json.dumps([{'name':i.filename,'uncompressedBytes':i.file_size,'compressedBytes':i.compress_size,'crc32':f'{i.CRC:08x}'} for i in z.infolist()],indent=2)+'\n')
 wanted=[n for n in names if n in ['.zattrs','masks/homogeneous_transform/.zarray','masks/homogeneous_transform/0.0'] or n.startswith('cell_id/') or n.startswith('cell_summary/')]
 print('entries',len(names),'coordinate entries',len(wanted),flush=True)
 for name in wanted:
  info=z.getinfo(name)
  if info.file_size>2_000_000:raise ValueError('Oversized metadata entry')
  data=z.read(name);safe=name.replace('/','__');p=out/safe
  if p.exists() and p.read_bytes()!=data:raise ValueError('Retained entry differs')
  if not p.exists():p.write_bytes(data)
  entries.append({'entry':name,'extractedPath':str(p.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'centralDirectoryCrc32':f'{info.CRC:08x}','entryCrcVerifiedByZipReader':True})
  print(name,data[:500].decode('utf8',errors='replace') if name.endswith('.zattrs') else len(data),flush=True)
result={'sourceUrl':URL,'archiveBytesDeclaredAndRangeChecked':SIZE,'obtainedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'acquisition':'Exact HTTP206 ranges; ZIP central directory and selected coordinate entries only','rangeTransferBytes':remote.total,'wholeArchiveDownloaded':False,'wholeArchiveSha256':None,'rangeReceipts':remote.records,'selectedEntryReceipts':entries,'doesNotAuthorizeGeometry':True}
(out/'receipt.json').write_text(json.dumps(result,indent=2)+'\n')
print('range bytes',remote.total,flush=True)
