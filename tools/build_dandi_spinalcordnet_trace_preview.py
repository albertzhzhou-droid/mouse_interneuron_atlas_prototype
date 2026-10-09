#!/usr/bin/env python3
"""Offline-only lossless derivative of already pinned HTTP ranges; no full NWB download."""
import hashlib
import io
import json
import sys
from pathlib import Path
import h5py
import numpy as np
import yaml

ROOT = Path(__file__).resolve().parents[1]
REL = 'data/source-candidates/dandi-spinalcordnet-001469-0.250611.1844'
BASE = ROOT / REL
ASSET_ID = '0e0ca61c-4206-46ad-8c78-0ce7b1252b33'
SHA = 'b7e323f222791499af6d13ad8fa7d5ea9850fcf59e0de0dfa84c598a4a1be0ae'
ETAG = '992cec0901b7b705d0fa1ccb8b7de263-6'
SIZE = 355191072
PINNED_METADATA = {
    'version.json': '3992ce1cf8ba05c4fc6fa6dbc1e7c744c73cde9fe1f3f4b2c01e94087e063108',
    'asset.json': '5fcd73c5a760355d234ef6dbe4a709a432ba7b2c24c80664e31c81985bcc55d6',
    'assets.yaml': '509b87eff58ea92e362caab5bd3245f7992fd10c094258c44b09d24666f61d46',
}
def digest(data): return hashlib.sha256(data).hexdigest()
def plain(value):
    if isinstance(value, bytes): return value.decode('utf8', errors='strict')
    if isinstance(value, np.ndarray): return [plain(v) for v in value.tolist()]
    if isinstance(value, np.generic): return plain(value.item())
    return value
def receipt(name):
    data = (BASE / name).read_bytes()
    return {'path': f'{REL}/{name}', 'bytes': len(data), 'sha256': digest(data), 'verificationScope': 'complete_local_file_bytes'}
class VerifiedCachedRanges(io.RawIOBase):
    def __init__(self, audit):
        self.pos = 0; self.blocks = {}; self.size = SIZE
        assert len(audit['rangeReceipts']) == 15 and audit['rangeBytesFetched'] == 3918112
        for row in audit['rangeReceipts']:
            assert row['etag'] == ETAG and row['start'] % 262144 == 0
            assert row['end'] == min(SIZE - 1, row['start'] + 262143)
            data = (BASE / f"range-{row['start']}-{row['end']}.bin").read_bytes()
            assert len(data) == row['bytes'] == row['end'] - row['start'] + 1
            assert digest(data) == row['sha256']
            assert row['start']//262144 not in self.blocks
            self.blocks[row['start']//262144] = data
    def readable(self): return True
    def seekable(self): return True
    def writable(self): return False
    def tell(self): return self.pos
    def seek(self, offset, whence=0):
        target = offset if whence == 0 else self.pos + offset if whence == 1 else self.size + offset if whence == 2 else -1
        if not 0 <= target <= self.size: raise ValueError('Invalid cached-source seek')
        self.pos = target; return target
    def read(self, count=-1):
        if count < 0: raise ValueError('Unbounded reads disabled')
        remaining = min(count, self.size-self.pos); out = bytearray()
        while remaining:
            data = self.blocks.get(self.pos//262144)
            if data is None: raise ValueError('Required range not cached; this builder cannot fetch or invent it')
            offset = self.pos % 262144; take = min(remaining, len(data)-offset)
            if take <= 0: raise ValueError('Invalid cache coverage')
            out.extend(data[offset:offset+take]); self.pos += take; remaining -= take
        return bytes(out)
    def readinto(self, buffer):
        data = self.read(len(buffer)); buffer[:len(data)] = data; return len(data)

def build():
    for name, expected in PINNED_METADATA.items(): assert receipt(name)['sha256'] == expected
    version = json.loads((BASE/'version.json').read_text()); asset = json.loads((BASE/'asset.json').read_text())
    manifest = yaml.safe_load((BASE/'assets.yaml').read_text()); audit = json.loads((BASE/'bounded-nwb-audit.json').read_text())
    assert version['version'] == '0.250611.1844' and version['license'] == ['spdx:CC-BY-4.0']
    assert len(manifest) == 61 and sum(r['contentSize'] for r in manifest) == 148803537183
    matches = [r for r in manifest if r['identifier'] == ASSET_ID]
    assert len(matches) == 1 and matches[0]['path'] == asset['path'] and matches[0]['digest'] == asset['digest']
    assert asset['identifier'] == ASSET_ID and asset['contentSize'] == SIZE and asset['digest']['dandi:sha2-256'] == SHA
    assert asset['digest']['dandi:dandi-etag'] == ETAG and audit['wholeFileSha256Verified'] is False
    source = VerifiedCachedRanges(audit)
    with h5py.File(source, 'r') as f:
        series = f['/acquisition/ElectricalSeries']; data = series['data']; region = series['electrodes']; table = f[region.attrs['table']]
        assert table.name == '/general/extracellular_ephys/electrodes' and list(data.shape) == [5543424,32]
        assert str(data.dtype) == 'int16' and list(data.chunks) == [43308,1] and data.compression is None
        assert plain(series.attrs['object_id']) == '9622a561-6b2a-461b-af83-6b9aae2d1c22'
        assert plain(table.attrs['object_id']) == '1a8aa751-672c-437e-81f2-dbe3692bfc61'
        assert list(region[()]) == list(range(32)) and list(table['id'][()]) == list(range(32))
        group_paths = [f[r].name for r in table['group'][()]]
        assert set(group_paths) == {'/general/extracellular_ephys/shank0'}
        native_units = {k:plain(v) for k,v in data.attrs.items()}
        assert native_units == {'conversion':1.0,'offset':0.0,'resolution':-1.0,'unit':'volts'}
        assert float(series['starting_time'][()]) == 0.0 and float(series['starting_time'].attrs['rate']) == 30000.0
        assert plain(series['starting_time'].attrs['unit']) == 'seconds'
        assert 'session_id' not in f and plain(f['general/subject/subject_id'][()]) == 'Chronic Implant 1'
        samples = plain(data[:30000,0]); assert len(samples) == 30000 and min(samples) == -50 and max(samples) == 51
        assert samples[:3000] == [row[0] for row in audit['tracePreview']['sourceData']]
        electrodes = []
        for i in range(32):
            electrodes.append({'channelIndex':i,'nativeElectrodeId':str(int(table['id'][i])),
                'label':plain(table['label'][i]),'groupName':plain(table['group_name'][i]),'groupPath':group_paths[i],
                'location':plain(table['location'][i]),'impedanceOhm':float(table['imp'][i]),
                'sourceCoordinates':{axis:float(table[axis][i]) for axis in ['x','y','z','rel_x','rel_y','rel_z']},
                'coordinateUnit':None,'atlasRegistrationCount':0})
        payload = {'schemaVersion':'0.1.0','assetId':ASSET_ID,'seriesObjectId':plain(series.attrs['object_id']),
            'dataPath':data.name,'sourceChannelIndex':0,'nativeElectrodeId':'0','firstSample':0,'sampleCount':30000,
            'dataType':'int16','sampleRateHz':30000.0,'startingTimeSeconds':0.0,'nativeAmplitudeDeclaration':native_units,
            'samples':samples}
        source_context = {'subjectId':plain(f['general/subject/subject_id'][()]),'age':plain(f['general/subject/age'][()]),
            'sex':plain(f['general/subject/sex'][()]),'species':plain(f['general/subject/species'][()]),
            'fileIdentifier':plain(f['identifier'][()]),'sessionId':None,'sessionIdReason':'The NWB session_id field is absent; file identifier and start time are retained separately.',
            'sessionStartTime':plain(f['session_start_time'][()]),'timestampsReferenceTime':plain(f['timestamps_reference_time'][()]),
            'seriesObjectId':plain(series.attrs['object_id']),'electrodeTableObjectId':plain(table.attrs['object_id']),
            'electrodeGroupObjectId':plain(f[group_paths[0]].attrs['object_id']),
            'electrodeRegionPath':region.name,'electrodeTablePath':table.name,'electrodeGroupPath':group_paths[0]}
    source.close()
    payload_bytes = (json.dumps(payload,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode()
    file_receipts = [receipt(n) for n in ['version.json','asset.json','assets.yaml','bounded-nwb-audit.json','offline-nwb-reference-proof.json']]
    range_receipts = [{**r,'path':f"{REL}/range-{r['start']}-{r['end']}.bin",'verificationScope':'cached_HTTP_206_range_bytes_only'} for r in audit['rangeReceipts']]
    contract = {'schemaVersion':'0.1.0','contractId':'dandi-spinalcordnet-native-trace-preview-0.1','checkedDate':'2026-09-30',
        'sourceId':'DANDI:001469','releaseId':'0.250611.1844','namespace':f'DANDI:001469/0.250611.1844/{ASSET_ID}',
        'sourceUrl':'https://dandiarchive.org/dandiset/001469/0.250611.1844','doi':'10.48324/dandi.001469/0.250611.1844',
        'citation':version['citation'],'datasetName':version['name'],'datasetLicense':version['license'],
        'assetSpecificLicenseField':None,'licenseScope':'Immutable Dandiset metadata declares CC BY 4.0. The associated asset record has no separate license field.',
        'datasetInventory':{'files':61,'bytes':148803537183,'unit':'source files; not cells or interneurons'},
        'sourceAsset':{'id':ASSET_ID,'path':asset['path'],'bytesDeclared':SIZE,'sha256Declared':SHA,'etagDeclared':ETAG,
            'wholeFileSha256Verified':False,'sourceShape':[5543424,32],'dtype':'int16','chunkShape':[43308,1],
            'compression':None,'nwbVersion':plain(audit['rootAttrs']['nwb_version'])},
        'sourceContext':source_context,'electrodes':electrodes,
        'preview':{'url':'/data/dandi_spinalcordnet_trace_preview_v1/trace-channel-0.json','bytes':len(payload_bytes),'sha256':digest(payload_bytes),
            'firstSample':0,'sampleCount':30000,'sourceChannelIndex':0,'nativeElectrodeId':'0','sourceChannelCount':32,
            'dataPath':'/acquisition/ElectricalSeries/data','sampleRateHz':30000.0,'startingTimeSeconds':0.0,
            'minimumStoredValue':-50,'maximumStoredValue':51,'derivation':'Exact data[0:30000, 0]; unchanged int16 values; no filtering, averaging, unit conversion or spike detection.'},
        'amplitude':{'nativeDeclaration':native_units,'plotUnit':'stored int16 value','calibrationStatus':'unverified','physicalVoltageClaimAllowed':False,
            'reason':'The file declares volts with conversion=1.0 and offset=0.0. No independently verified ADC/physical calibration is retained; stored values are shown without rescaling.'},
        'coordinateScope':{'unit':None,'reason':'Electrode coordinate datasets retain direction descriptions but no explicit coordinate unit. No scale or atlas transform is inferred.','registrationCount':0},
        'sourceReceipts':file_receipts,'rangeReceipts':range_receipts,'acquisition':{'rangeCount':15,'rangeBytesFetched':3918112,'maximumInitialBudgetBytes':16777216,
            'method':'Exact HTTP 206 ranges checked against immutable asset ETag; SHA-256 for each saved range; read-only HDF5 replay from cached bytes.',
            'offlineBuilderNetworkReads':0,'fullNwbDownloaded':False,'wholeCorpusDownloaded':False},
        'claims':{'identifiedInterneurons':0,'isolatedUnits':0,'morphologyJoins':0,'sameCellLinks':0,'synapseLinks':0,'atlasRegistrations':0,'causalMotorOutputLinks':0},
        'disposition':'independent_extracellular_trace_only'}
    contract_bytes = (json.dumps(contract,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode()
    return {'public/data/dandi_spinalcordnet_trace_preview_v1/trace-channel-0.json':payload_bytes,
            'data/dandi-spinalcordnet-trace-preview-0.1.json':contract_bytes}
if __name__ == '__main__':
    for relative, data in build().items():
        target = ROOT / relative
        if '--write' in sys.argv: target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(data)
        else: assert target.read_bytes() == data, f'{relative}: offline derivative drift'
        print(f'{relative}: {len(data)} bytes, SHA-256 {digest(data)}')
