#!/usr/bin/env python3
"""Acquire only exact-run first-IFD and OME metadata, at most 2 MB HTTP206."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request
from bil_xenium_ome_metadata import inspect_first_ifd, require

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/source-candidates/bil-xenium-ome-20261002'
URL = 'https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/Run8_Slide2_Mus_M7_F7/morphology.ome.tif'
SIZE = 25_611_493_268
BUDGET = 2_000_000

def sha(data): return hashlib.sha256(data).hexdigest()

class MetadataRanges:
    def __init__(self):
        self.records = []; self.total = 0
        self.journal = OUT / 'range-journal.json'
        if self.journal.exists():
            prior = json.loads(self.journal.read_text())
            require(prior['sourceUrl'] == URL and prior['sourceBytes'] == SIZE, 'Retained metadata source differs')
            self.records = prior['rangeReceipts']; self.total = sum(r['bytes'] for r in self.records)
            for row in self.records:
                data = (ROOT / row['path']).read_bytes()
                require(len(data) == row['bytes'] and sha(data) == row['sha256'], 'Retained metadata interval changed')
    def read(self, start, length, purpose):
        require(0 <= start <= SIZE - length and 0 < length <= 1_000_000, 'Range outside bounded metadata scope')
        for row in self.records:
            if row['rangeStart'] <= start and start + length <= row['rangeEnd'] + 1:
                data = (ROOT / row['path']).read_bytes()
                return data[start - row['rangeStart']:start - row['rangeStart'] + length]
        require(self.total + length <= BUDGET, 'Metadata range budget exceeded')
        end = start + length - 1
        request = urllib.request.Request(URL, headers={'Range': f'bytes={start}-{end}', 'Accept-Encoding': 'identity', 'User-Agent': 'OHRI-source-audit/1.0'})
        with urllib.request.urlopen(request, timeout=45) as response:
            require(response.geturl() == URL and response.status == 206, 'Exact source URL and HTTP206 required')
            require(response.headers.get('Content-Range') == f'bytes {start}-{end}/{SIZE}', 'Exact source size and interval required')
            require(response.headers.get('Content-Encoding', 'identity') == 'identity', 'Encoded metadata range rejected')
            if self.records:
                require(response.headers.get('ETag') == self.records[0]['responseHeaders']['ETag'], 'Source ETag changed between metadata ranges')
            data = response.read(length + 1)
            headers = {key: response.headers.get(key) for key in ('Content-Range', 'Content-Length', 'ETag', 'Last-Modified', 'Content-Type')}
        require(len(data) == length, 'Source metadata interval length differs')
        path = OUT / f'range-{start}-{end}.bin'
        require(not path.exists(), 'Unreceipted retained interval requires inspection; no overwrite')
        path.write_bytes(data)
        self.records.append({'path': str(path.relative_to(ROOT)), 'rangeStart': start, 'rangeEnd': end,
                             'bytes': length, 'sha256': sha(data), 'purpose': purpose, 'httpStatus': 206,
                             'responseHeaders': headers, 'obtainedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()})
        self.total += length
        self.journal.write_text(json.dumps({'sourceUrl': URL, 'sourceBytes': SIZE, 'rangeBudgetBytes': BUDGET, 'rangeReceipts': self.records}, indent=2) + '\n')
        print('Retained metadata', purpose, length, 'bytes', flush=True)
        return data

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ranges = MetadataRanges(); metadata, xml = inspect_first_ifd(ranges.read, SIZE)
    xml_path = OUT / 'first-ifd-ome.xml'; xml_bytes = xml.encode('utf-8')
    require(not xml_path.exists() or xml_path.read_bytes() == xml_bytes, 'Retained OME XML changed')
    xml_path.write_bytes(xml_bytes)
    result = {'sourceObjectKey': 'BIL:ace-pie-cot', 'directoryFolder': 'Run8_Slide2_Mus_M7_F7', 'sourceUrl': URL,
              'sourceBytesDeclaredAndRangeChecked': SIZE, 'rangeTransferBytes': ranges.total, 'rangeBudgetBytes': BUDGET,
              'rangeReceipts': ranges.records, 'derivedXmlReceipt': {'path': str(xml_path.relative_to(ROOT)), 'bytes': len(xml_bytes), 'sha256': sha(xml_bytes)},
              'metadata': metadata, 'wholeFileDownloaded': False, 'wholeFileSha256': None,
              'scope': 'first_IFD_and_OME_XML_metadata_only_no_image_pixels', 'doesNotAuthorizeGeometry': True}
    receipt = OUT / 'receipt.json'; rendered = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    require(not receipt.exists() or receipt.read_text() == rendered, 'Retained metadata receipt differs')
    receipt.write_text(rendered)
    print(json.dumps({'rangeBytes': ranges.total, 'format': metadata['tiffFormat'], 'pixels': metadata['ome']['pixelsAttributes'], 'channels': metadata['ome']['channels']}), flush=True)

if __name__ == '__main__': main()
