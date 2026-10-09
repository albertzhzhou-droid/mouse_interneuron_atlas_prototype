"""Bounded refresh of exact known M4 near-miss records; no image volume downloads."""
from pathlib import Path
import hashlib
import json
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/source-candidates/mouse-spinal-m4-20260930'
MAX_BYTES = 1_000_000
SOURCES = [
    ('pkd2l1-elife-83108.json', 'https://api.elifesciences.org/articles/83108'),
    ('biostudies-S-BSST609-info.json', 'https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BSST609/info'),
    ('biostudies-S-BIAD2822-info.json', 'https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BIAD2822/info'),
    ('biostudies-S-BSST609-study.json', 'https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BSST609'),
    ('biostudies-S-BIAD2822-study.json', 'https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BIAD2822'),
    ('janelia-mutant-20134979.json', 'https://api.figshare.com/v2/articles/20134979'),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    previous = json.loads((OUT / 'receipt.json').read_text()) if (OUT / 'receipt.json').exists() else {}
    prior_failures = previous.get('priorFailedRequests', []) + previous.get('failedRequests', [])
    files, failures = [], []
    for name, url in SOURCES:
        path = OUT / name
        try:
            if path.exists():
                data = path.read_bytes()
            else:
                request = urllib.request.Request(url, headers={'Accept': '*/*', 'User-Agent': 'OHRI-source-gate/0.1'})
                with urllib.request.urlopen(request, timeout=30) as response:
                    data = response.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    raise ValueError('bounded metadata budget exceeded')
                json.loads(data)
                temporary = path.with_suffix('.partial')
                temporary.write_bytes(data)
                temporary.replace(path)
            json.loads(data)
            files.append({'url': url, 'path': str(path.relative_to(ROOT)), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        except Exception as error:
            failures.append({'url': url, 'path': str(path.relative_to(ROOT)), 'error': str(error), 'meaning': 'retrieval failure is not evidence of repository absence'})
    receipt = {'checkedDate': '2026-09-30', 'scope': 'known_candidate_metadata_only_no_repository_census', 'files': files, 'failedRequests': failures, 'priorFailedRequests': prior_failures, 'totalBytes': sum(file['bytes'] for file in files)}
    (OUT / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'files': len(files), 'totalBytes': receipt['totalBytes'], 'failures': failures}))


if __name__ == '__main__':
    main()
