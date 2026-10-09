#!/usr/bin/env python3
"""Explicit fixed-source re-fetch; never reads the whole NWB or overwrites differing bytes."""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CONTRACT = json.loads((ROOT/'data/dandi-spinalcordnet-trace-preview-0.1.json').read_text())
PREFIX = 'data/source-candidates/dandi-spinalcordnet-001469-0.250611.1844/'
URLS = {
    'version.json':'https://api.dandiarchive.org/api/dandisets/001469/versions/0.250611.1844/',
    'asset.json':'https://api.dandiarchive.org/api/assets/0e0ca61c-4206-46ad-8c78-0ce7b1252b33/',
    'assets.yaml':'https://dandiarchive.s3.amazonaws.com/dandisets/001469/0.250611.1844/assets.yaml',
}
BLOB = 'https://dandiarchive.s3.amazonaws.com/blobs/cf9/e77/cf9e778d-15af-46ba-ab8a-5b2c84dd8126'
def verified(data, row):
    return len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256']
def run():
    if '--fetch' not in sys.argv: raise SystemExit('Pass --fetch to explicitly re-fetch the fixed public source. Offline replay uses build_dandi_spinalcordnet_trace_preview.py.')
    rows=[r for r in CONTRACT['sourceReceipts'] if r['path'].split('/')[-1] in URLS]+CONTRACT['rangeReceipts']
    if len(CONTRACT['rangeReceipts'])!=15 or sum(r['bytes'] for r in CONTRACT['rangeReceipts'])!=3918112: raise ValueError('Pinned range inventory changed')
    fetched=0
    for row in rows:
        if not row['path'].startswith(PREFIX) or '..' in Path(row['path']).parts: raise ValueError('Unexpected pinned path')
        target=ROOT/row['path']
        if target.exists():
            if not verified(target.read_bytes(),row): raise ValueError(f'Existing source differs; preserved without overwrite: {row["path"]}')
            continue
        name=target.name; is_range=name.startswith('range-'); url=BLOB if is_range else URLS[name]
        if is_range and (row['start']<0 or row['start']%262144!=0 or row['end']!=min(355191071,row['start']+262143)
                         or row['bytes']!=row['end']-row['start']+1 or not 0<row['bytes']<=262144): raise ValueError('Invalid bounded range')
        if not 0<row['bytes']<=262144 or fetched+row['bytes']>4200000: raise ValueError('Bounded source budget exceeded before request')
        headers={'User-Agent':'OHRI-fixed-source-range-reader/2.91','Accept-Encoding':'identity'}
        if is_range: headers['Range']=f'bytes={row["start"]}-{row["end"]}'
        with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=25) as response:
            if is_range:
                if response.status!=206 or response.headers.get('Content-Range')!=f'bytes {row["start"]}-{row["end"]}/355191072': raise ValueError('Exact range response required')
                if response.headers.get('ETag','').strip('"')!='992cec0901b7b705d0fa1ccb8b7de263-6': raise ValueError('Declared asset ETag changed')
            elif response.status!=200: raise ValueError('Metadata response failed')
            data=response.read(row['bytes']+1)
        if not verified(data,row): raise ValueError('Fetched bytes differ from the pinned snapshot; no file written')
        fetched+=len(data)
        if fetched>4200000: raise ValueError('Bounded source budget exceeded')
        target.parent.mkdir(parents=True,exist_ok=True)
        with target.open('xb') as f: f.write(data)
    print(f'{fetched} newly fetched bytes; existing verified caches reused; whole-file checksum remains unverified')
if __name__=='__main__': run()
