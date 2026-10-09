#!/usr/bin/env python3
"""Acquire one exact recording, reusing verified I09 ranges and resuming gaps.

No whole-corpus mirror. Only complete bytes with the declared SHA-256 become
the retained .nwb. Partial progress is not scientific authority.
"""
import argparse
import hashlib
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / 'data/source-candidates/dandi-spinalcordnet-001469-0.250611.1844'
BASE = ROOT / 'data/source-candidates/dandi-spinalcordnet-full-20261002'
FILE = BASE / '0e0ca61c-4206-46ad-8c78-0ce7b1252b33.nwb'
PARTIAL = FILE.with_suffix('.partial')
PROGRESS = BASE / 'acquisition-progress.json'
RECEIPT = BASE / 'source-download-receipt.json'
URL = 'https://dandiarchive.s3.amazonaws.com/blobs/cf9/e77/cf9e778d-15af-46ba-ab8a-5b2c84dd8126'
SIZE = 355191072
SHA = 'b7e323f222791499af6d13ad8fa7d5ea9850fcf59e0de0dfa84c598a4a1be0ae'
ETAG = '992cec0901b7b705d0fa1ccb8b7de263-6'
BLOCK = 8 * 1024 * 1024

def digest(data): return hashlib.sha256(data).hexdigest()
def file_hash(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''): h.update(b)
    return h.hexdigest()
def save_progress(rows):
    target = PROGRESS.with_suffix('.json.tmp')
    target.write_text(json.dumps({'sourceUrl': URL, 'bytesDeclared': SIZE,
        'sha256Declared': SHA, 'etagDeclared': ETAG, 'ranges': rows}, indent=2)+'\n')
    target.replace(PROGRESS)
def validate_ranges(rows, f):
    cursor = 0
    for r in sorted(rows, key=lambda x: x['start']):
        assert 0 <= r['start'] <= r['end'] < SIZE and r['start'] >= cursor
        assert r['bytes'] == r['end'] - r['start'] + 1
        f.seek(r['start']); data = f.read(r['bytes'])
        assert len(data) == r['bytes'] and digest(data) == r['sha256']
        cursor = r['end'] + 1
def gaps(rows):
    cursor = 0
    for r in sorted(rows, key=lambda x: x['start']):
        while cursor < r['start']:
            end = min(r['start']-1, cursor+BLOCK-1)
            yield cursor, end; cursor = end+1
        cursor = r['end']+1
    while cursor < SIZE:
        end = min(SIZE-1, cursor+BLOCK-1)
        yield cursor, end; cursor = end+1

def run(fetch=False):
    if FILE.exists():
        assert FILE.stat().st_size == SIZE and file_hash(FILE) == SHA
        assert RECEIPT.exists(), 'Complete source exists without receipt; preserve and inspect.'
        print('Complete source SHA-256 verified; no network reads.', flush=True)
        return
    assert fetch, 'Use --fetch to acquire the exact public asset.'
    BASE.mkdir(parents=True, exist_ok=True)
    if PROGRESS.exists():
        progress = json.loads(PROGRESS.read_text())
        assert progress['sourceUrl'] == URL and progress['sha256Declared'] == SHA
        assert progress['bytesDeclared'] == SIZE and progress['etagDeclared'] == ETAG
        rows = progress['ranges']
        assert PARTIAL.exists(), 'Progress exists but partial source is missing.'
    else:
        assert not PARTIAL.exists(), 'Unreceipted partial source preserved; inspect before reuse.'
        rows = []
        audit = json.loads((OLD/'bounded-nwb-audit.json').read_text())
        assert len(audit['rangeReceipts']) == 15
        with PARTIAL.open('xb') as f:
            f.truncate(SIZE)
            for r in audit['rangeReceipts']:
                assert r['etag'] == ETAG
                data = (OLD/f"range-{r['start']}-{r['end']}.bin").read_bytes()
                assert len(data) == r['bytes'] and digest(data) == r['sha256']
                f.seek(r['start']); f.write(data)
                rows.append({'start': r['start'], 'end': r['end'], 'bytes':len(data),
                    'sha256':digest(data), 'origin':'reused_exact_I09_range'})
            f.flush(); os.fsync(f.fileno())
        save_progress(rows)
    with PARTIAL.open('r+b') as f:
        assert PARTIAL.stat().st_size == SIZE
        validate_ranges(rows, f)
        pending = list(gaps(rows))
        for start, end in pending:
            headers = {'Range':f'bytes={start}-{end}', 'If-Match':f'"{ETAG}"',
                'Accept-Encoding':'identity', 'User-Agent':'OHRI-exact-source-recording/2.91'}
            request = urllib.request.Request(URL, headers=headers)
            with urllib.request.urlopen(request, timeout=45) as response:
                assert response.status == 206
                assert response.headers.get('Content-Range') == f'bytes {start}-{end}/{SIZE}'
                assert response.headers.get('ETag','').strip('"') == ETAG
                data = response.read(end-start+2)
            assert len(data) == end-start+1
            f.seek(start); f.write(data); f.flush(); os.fsync(f.fileno())
            rows.append({'start':start,'end':end,'bytes':len(data),'sha256':digest(data),
                'origin':'new_exact_HTTP_206_range'})
            save_progress(rows)
            print(f'{sum(r["bytes"] for r in rows)}/{SIZE} verified range bytes retained', flush=True)
        validate_ranges(rows, f)
    assert not list(gaps(rows))
    assert file_hash(PARTIAL) == SHA, 'Full checksum mismatch: partial file preserved, not admitted.'
    PARTIAL.replace(FILE)
    receipt = {'sourceId':'DANDI:001469', 'releaseId':'0.250611.1844',
        'assetId':'0e0ca61c-4206-46ad-8c78-0ce7b1252b33', 'url':URL,
        'path':str(FILE.relative_to(ROOT)), 'bytes':SIZE, 'sha256':SHA,
        'etag':ETAG, 'completeSourceSha256Verified':True,
        'reusedPriorBytes':sum(r['bytes'] for r in rows if r['origin']=='reused_exact_I09_range'),
        'newlyFetchedBytes':sum(r['bytes'] for r in rows if r['origin']=='new_exact_HTTP_206_range'),
        'ranges':sorted(rows,key=lambda x:x['start']),
        'acquiredAtUtc':datetime.now(timezone.utc).isoformat(),
        'retainedOutsidePublic':True, 'wholeCorpusDownloaded':False}
    RECEIPT.write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({k:receipt[k] for k in ['bytes','sha256','reusedPriorBytes','newlyFetchedBytes']}),flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--fetch', action='store_true')
    run(parser.parse_args().fetch)
