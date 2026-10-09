#!/usr/bin/env python3
"""Acquire only both polygon sets of the exact Run8 archive via bounded HTTP206.

Existing coordinate ranges are verified and reused; no masks, whole ZIP,
geometry admission or original input overwriting. --metadata inspects layouts.
"""
import datetime
import hashlib
import io
import json
from pathlib import Path
import sys
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent.parent
PRIOR = ROOT / 'data/source-candidates/bil-xenium-source-gate-20261001/cells-zarr-coordinate-inputs'
OUT = ROOT / 'data/source-candidates/bil-xenium-polygons-20261002'
URL = 'https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/Run8_Slide2_Mus_M7_F7/cells.zarr.zip'
SIZE = 252307597
BUDGET = 52_000_000

def sha(data): return hashlib.sha256(data).hexdigest()
def checked_file(row):
    data = (ROOT / row.get('path', row.get('extractedPath'))).read_bytes()
    if len(data) != row['bytes'] or sha(data) != row['sha256']:
        raise ValueError('Retained original bytes changed; no overwrite permitted')
    return data

class SelectedRanges(io.RawIOBase):
    def __init__(self):
        prior = json.loads((PRIOR / 'receipt.json').read_text())
        if prior['sourceUrl'] != URL or prior['archiveBytesDeclaredAndRangeChecked'] != SIZE:
            raise ValueError('Exact prior archive identity differs')
        self.pos = 0; self.extents = []; self.total = 0; self.records = {}
        self.prior = [(r['rangeStart'], r['rangeEnd'] + 1, checked_file(r)) for r in prior['rangeReceipts']]
    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.pos
    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else SIZE + offset
        if not 0 <= self.pos <= SIZE: raise ValueError('Invalid ZIP seek')
        return self.pos
    def read(self, n=-1):
        end = min(SIZE, self.pos + n) if n >= 0 else SIZE
        chunks = []
        while self.pos < end:
            available = [r for r in self.prior if r[0] <= self.pos < r[1]]
            if available:
                start, stop, data = max(available, key=lambda r:r[1])
            else:
                matching = [(s,e) for s,e in self.extents if s <= self.pos < e]
                if len(matching) != 1: raise ValueError('Request outside selected polygon entries')
                start, stop = matching[0]; length = stop - start
                if length > 2_000_000 or self.total + length > BUDGET:
                    raise ValueError('Exact polygon range budget exceeded')
                p = OUT / f'range-{start}-{stop-1}.bin'
                if p.exists():
                    data = p.read_bytes(); acquisition = 'retained exact HTTP206 range from partial attempt'
                else:
                    req = urllib.request.Request(URL, headers={'Range':f'bytes={start}-{stop-1}', 'User-Agent':'OHRI-source-audit/1.0'})
                    with urllib.request.urlopen(req, timeout=45) as response:
                        if response.status != 206 or response.headers.get('Content-Range') != f'bytes {start}-{stop-1}/{SIZE}':
                            raise ValueError('Exact HTTP206 archive size and range required')
                        data = response.read(length + 1)
                    if len(data) != length: raise ValueError('Original interval length differs')
                    p.write_bytes(data); acquisition = 'new exact HTTP206 range'
                if len(data) != length: raise ValueError('Retained interval length differs')
                self.total += length; self.prior.append((start, stop, data))
                self.records[start] = {'path':str(p.relative_to(ROOT)), 'rangeStart':start, 'rangeEnd':stop-1, 'bytes':length, 'sha256':sha(data), 'acquisition':acquisition}
            count = min(stop, end) - self.pos
            chunks.append(data[self.pos-start:self.pos-start+count]); self.pos += count
        return b''.join(chunks)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    receipt_path = OUT / 'receipt.json'
    if receipt_path.exists():
        receipt = json.loads(receipt_path.read_text())
        for row in receipt['rangeReceipts'] + receipt['selectedEntryReceipts']: checked_file(row)
        if receipt['sourceUrl'] != URL or len(receipt['selectedEntryReceipts']) != 163:
            raise ValueError('Retained source inventory differs')
        print('Retained polygon entries verified; no remote fetch'); return
    remote = SelectedRanges(); entries = []
    with zipfile.ZipFile(remote) as archive:
        infos = sorted(archive.infolist(), key=lambda i:i.header_offset)
        next_offsets = {i.filename:infos[j+1].header_offset if j+1 < len(infos) else archive.start_dir for j,i in enumerate(infos)}
        wanted = [i for i in infos if i.filename.startswith('polygon_sets/') and ('--metadata' not in sys.argv or i.filename.endswith(('.zarray','.zgroup','.zattrs')))]
        if '--metadata' not in sys.argv and len(wanted) != 163: raise ValueError('Polygon source inventory differs')
        remote.extents = [(i.header_offset, next_offsets[i.filename]) for i in wanted]
        planned = sum(e-s for s,e in remote.extents)
        if planned > BUDGET: raise ValueError('Polygon acquisition exceeds fixed budget')
        print(json.dumps({'entries':len(wanted), 'plannedRangeBytes':planned, 'budget':BUDGET}), flush=True)
        for index, info in enumerate(wanted):
            data = archive.read(info.filename)  # validates local ZIP header and entry CRC
            p = OUT / info.filename.replace('/', '__')
            if p.exists() and p.read_bytes() != data: raise ValueError('Retained selected entry differs')
            if not p.exists(): p.write_bytes(data)
            entries.append({'entry':info.filename,'extractedPath':str(p.relative_to(ROOT)),'bytes':len(data),'sha256':sha(data),'centralDirectoryCrc32':f'{info.CRC:08x}','entryCrcVerifiedByZipReader':True})
            if info.filename.endswith('.zarray'): print(info.filename, data.decode(), flush=True)
            elif index % 16 == 0: print('Verified polygon entries', index + 1, '/', len(wanted), flush=True)
    result = {'sourceObjectKey':'BIL:ace-pie-cot','directoryFolder':'Run8_Slide2_Mus_M7_F7','sourceUrl':URL,'archiveBytesDeclaredAndRangeChecked':SIZE,'obtainedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'acquisition':'Exact HTTP206 local-entry intervals; original ZIP directory reused; both polygon sets only','rangeTransferBytes':remote.total,'rangeBudgetBytes':BUDGET,'wholeArchiveDownloaded':False,'wholeArchiveSha256':None,'priorCoordinateReceipt':{'path':str((PRIOR/'receipt.json').relative_to(ROOT)),'bytes':len((PRIOR/'receipt.json').read_bytes()),'sha256':sha((PRIOR/'receipt.json').read_bytes())},'rangeReceipts':list(remote.records.values()),'selectedEntryReceipts':entries,'doesNotAuthorizeGeometry':True}
    destination = OUT / ('metadata-receipt.json' if '--metadata' in sys.argv else 'receipt.json')
    destination.write_text(json.dumps(result,indent=2)+'\n')
    print('Verified selected original polygon bytes',remote.total,flush=True)

if __name__ == '__main__': main()
