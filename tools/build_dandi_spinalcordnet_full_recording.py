#!/usr/bin/env python3
"""Losslessly derive every stored sample of one exact NWB recording.

Run with --write once; default mode independently replays every derivative
from the retained complete NWB without making network requests.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

import h5py
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT/'data/source-candidates/dandi-spinalcordnet-full-20261002'
SOURCE = BASE/'0e0ca61c-4206-46ad-8c78-0ce7b1252b33.nwb'
DOCUMENT = 'data/dandi-spinalcordnet-full-recording-0.1.json'
PUBLIC = 'public/data/dandi_spinalcordnet_full_recording_v1'
SHA = 'b7e323f222791499af6d13ad8fa7d5ea9850fcf59e0de0dfa84c598a4a1be0ae'
SIZE = 355191072
SHAPE = (5543424, 32)
BLOCK_SAMPLES = 300000

def digest(data): return hashlib.sha256(data).hexdigest()
def file_hash(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024), b''):h.update(b)
    return h.hexdigest()
def plain(v):
    if isinstance(v,bytes): return v.decode('utf8',errors='strict')
    if isinstance(v,np.ndarray): return [plain(x) for x in v.tolist()]
    if isinstance(v,np.generic): return plain(v.item())
    return v
def canonical(v): return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)
def output(relative, data, write):
    path=ROOT/relative
    if write:
        path.parent.mkdir(parents=True,exist_ok=True)
        if path.exists(): assert path.read_bytes()==data, f'Differing derivative preserved: {relative}'
        else:path.write_bytes(data)
    else:assert path.read_bytes()==data, f'Derivative mismatch: {relative}'
def build(write=False):
    assert SOURCE.stat().st_size==SIZE and file_hash(SOURCE)==SHA
    before=(SOURCE.stat().st_size,SOURCE.stat().st_mtime_ns)
    source_receipt=json.loads((BASE/'source-download-receipt.json').read_text())
    assert source_receipt['bytes']==SIZE and source_receipt['sha256']==SHA
    assert source_receipt['completeSourceSha256Verified'] is True
    old=json.loads((ROOT/'data/dandi-spinalcordnet-trace-preview-0.1.json').read_text())
    preview=json.loads((ROOT/('public'+old['preview']['url'])).read_text())
    audit=json.loads((ROOT/'data/source-candidates/dandi-spinalcordnet-001469-0.250611.1844/bounded-nwb-audit.json').read_text())
    chunks=[]; channel_stats=[{'channelIndex':i,'sampleCount':0,'minimumStoredValue':32767,
        'maximumStoredValue':-32768,'storedValueSum':0,'zeroSamples':0} for i in range(32)]
    channel_hashes=[hashlib.sha256() for _ in range(32)]
    array_hash=hashlib.sha256()
    with h5py.File(SOURCE,'r') as f:
        assert plain(f.attrs['nwb_version'])=='2.6.0'
        series=f['/acquisition/ElectricalSeries']; data=series['data']; region=series['electrodes']
        assert data.shape==SHAPE and str(data.dtype)=='int16' and data.chunks==(43308,1) and data.compression is None
        assert plain(series.attrs['object_id'])==old['sourceContext']['seriesObjectId']
        assert list(series.keys())==['data','electrodes','starting_time'], 'New fields must be inspected, never ignored.'
        declaration={k:plain(v) for k,v in data.attrs.items()}
        assert declaration==old['amplitude']['nativeDeclaration']=={'conversion':1.0,'offset':0.0,'resolution':-1.0,'unit':'volts'}
        assert float(series['starting_time'][()])==0.0 and float(series['starting_time'].attrs['rate'])==30000.0
        assert plain(series['starting_time'].attrs['unit'])=='seconds'
        assert 'session_id' not in f
        for key,path in [('subjectId','general/subject/subject_id'),('age','general/subject/age'),
                ('sex','general/subject/sex'),('species','general/subject/species'),('fileIdentifier','identifier'),
                ('sessionStartTime','session_start_time'),('timestampsReferenceTime','timestamps_reference_time')]:
            assert plain(f[path][()])==old['sourceContext'][key]
        table=f[region.attrs['table']]
        assert table.name==old['sourceContext']['electrodeTablePath']
        assert plain(table.attrs['object_id'])==old['sourceContext']['electrodeTableObjectId']
        assert list(region[()])==list(range(32)) and list(table['id'][()])==list(range(32))
        for i, electrode in enumerate(old['electrodes']):
            assert electrode['channelIndex']==i and electrode['nativeElectrodeId']==str(int(table['id'][i]))
            for name in ['label','group_name','location']:
                expected_key='groupName' if name=='group_name' else name
                assert plain(table[name][i])==electrode[expected_key]
            assert f[table['group'][i]].name==electrode['groupPath']
            assert float(table['imp'][i])==electrode['impedanceOhm']
            assert {axis:float(table[axis][i]) for axis in ['x','y','z','rel_x','rel_y','rel_z']}==electrode['sourceCoordinates']
            assert f[f[table['group'][i]].name].attrs['object_id']==old['sourceContext']['electrodeGroupObjectId']
        assert np.array_equal(data[:30000,0],np.asarray(preview['samples'],dtype=np.int16))
        assert np.array_equal(data[:3000,:],np.asarray(audit['tracePreview']['sourceData'],dtype=np.int16))
        for block_index,start in enumerate(range(0,SHAPE[0],BLOCK_SAMPLES)):
            stop=min(start+BLOCK_SAMPLES,SHAPE[0]); block=np.asarray(data[start:stop,:],dtype='<i2')
            assert block.shape==(stop-start,32)
            array_hash.update(block.tobytes(order='C'))
            for channel in range(32):
                values=block[:,channel]; raw=values.tobytes(order='C')
                compressed=bytearray(gzip.compress(raw,compresslevel=9,mtime=0)); compressed[9]=255
                compressed=bytes(compressed)
                assert gzip.decompress(compressed)==raw
                name=f'channel-{channel:02d}-block-{block_index:02d}.i16le.gzip'
                output(f'{PUBLIC}/{name}',compressed,write)
                chunks.append({'channelIndex':channel,'nativeElectrodeId':old['electrodes'][channel]['nativeElectrodeId'],
                    'blockIndex':block_index,'firstSample':start,'sampleCount':stop-start,
                    'url':f'/data/dandi_spinalcordnet_full_recording_v1/{name}',
                    'bytes':len(compressed),'sha256':digest(compressed),'decodedBytes':len(raw),
                    'decodedSha256':digest(raw),'encoding':'gzip of little-endian int16 source samples',
                    'minimumStoredValue':int(values.min()),'maximumStoredValue':int(values.max())})
                channel_hashes[channel].update(raw)
                stats=channel_stats[channel]; stats['sampleCount']+=len(values)
                stats['minimumStoredValue']=min(stats['minimumStoredValue'],int(values.min()))
                stats['maximumStoredValue']=max(stats['maximumStoredValue'],int(values.max()))
                stats['storedValueSum']+=int(np.sum(values,dtype=np.int64))
                stats['zeroSamples']+=int(np.count_nonzero(values==0))
            print(f'{stop}/{SHAPE[0]} time rows across all 32 channels replayed',flush=True)
        structure={'rootKeys':list(f.keys()),'acquisitionKeys':list(f['acquisition'].keys()),
            'analysisKeys':list(f['analysis'].keys()),'processingKeys':list(f['processing'].keys()),
            'seriesKeys':list(series.keys()),'channelConversionPresent':False,'sessionIdPresent':False}
    for i,stats in enumerate(channel_stats):
        assert stats['sampleCount']==SHAPE[0]
        stats['orderedStoredInt16LeSha256']=channel_hashes[i].hexdigest()
    assert len(chunks)==608 and sum(c['sampleCount'] for c in chunks)==177389568
    assert before==(SOURCE.stat().st_size,SOURCE.stat().st_mtime_ns) and file_hash(SOURCE)==SHA
    receipt_bytes=(BASE/'source-download-receipt.json').read_bytes()
    doc={'schemaVersion':'0.1.0','contractId':'dandi-spinalcordnet-full-recording-0.1',
        'sourceId':old['sourceId'],'releaseId':old['releaseId'],'namespace':old['namespace'],
        'sourceUrl':old['sourceUrl'],'citation':old['citation'],'doi':old['doi'],
        'datasetInventory':old['datasetInventory'],'datasetLicense':old['datasetLicense'],'licenseScope':old['licenseScope'],
        'sourceAsset':{**old['sourceAsset'],'wholeFileSha256Verified':True},
        'sourceVerificationScope':'complete retained source bytes and published SHA-256 verified at build; runtime verifies requested derivatives only',
        'sourceContext':old['sourceContext'],'electrodes':old['electrodes'],
        'amplitude':old['amplitude'],'coordinateScope':old['coordinateScope'],'claims':old['claims'],
        'nwbStructure':structure,
        'recording':{'sampleCountPerChannel':SHAPE[0],'channelCount':32,'totalStoredSamples':177389568,
            'sampleRateHz':30000,'startingTimeSeconds':0,'durationSeconds':SHAPE[0]/30000,
            'lastSampleTimeSeconds':(SHAPE[0]-1)/30000,'dataPath':'/acquisition/ElectricalSeries/data',
            'blockSamples':BLOCK_SAMPLES,'blocksPerChannel':19,'chunkCount':608,
            'sourceArrayCOrderInt16LeSha256':array_hash.hexdigest(),
            'allTimeSamplesAndChannelsRetained':True,'filtering':False,'decimation':False,
            'physicalAmplitudeRescaling':False,'zeroPadding':False,
            'compressedBytes':sum(c['bytes'] for c in chunks),'maximumCompressedChunkBytes':max(c['bytes'] for c in chunks)},
        'priorPreviewReconciliation':{'channel0First30000Exact':True,'all32ChannelsFirst3000Exact':True,
            'priorI09ContractsAndRangesUnchanged':True},
        'sourceDownloadReceipt':{'path':str((BASE/'source-download-receipt.json').relative_to(ROOT)),
            'bytes':len(receipt_bytes),'sha256':digest(receipt_bytes)},
        'extraction':{'builder':'tools/build_dandi_spinalcordnet_full_recording.py','h5py':h5py.__version__,
            'numpy':np.__version__,'networkReads':0,'sourceStableDuringExtraction':True,
            'sampleOrder':'native time rows and native electrode region order; no transpose or sorting'},
        'channels':channel_stats,'chunks':chunks,'disposition':'independent_complete_extracellular_recording_only'}
    output(DOCUMENT,(json.dumps(doc,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode(),write)
    print(canonical({'fullSourceBytes':SIZE,'sourceSha256':SHA,'channels':32,'samplesPerChannel':SHAPE[0],
        'totalSamples':177389568,'durationSeconds':doc['recording']['durationSeconds'],
        'chunks':608,'compressedBytes':doc['recording']['compressedBytes'],
        'maximumCompressedChunkBytes':doc['recording']['maximumCompressedChunkBytes'],
        'sourceArrayCOrderInt16LeSha256':array_hash.hexdigest(),'mode':'write' if write else 'exact_replay'}),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true')
    build(parser.parse_args().write)
