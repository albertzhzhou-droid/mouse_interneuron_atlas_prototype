"""Authorized exact six personal paths, once; no variants/enumeration/export."""
from pathlib import Path
import csv
import datetime as dt
import hashlib
import io
import json
import os
import stat
import subprocess

ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA = ROOT / 'docs/qa/2026-10-05-implementation-61'
OUT = Path('/private/tmp/ohri-i61-native-export-landing-20261005')
assert OUT.resolve(strict=True) == OUT
BASELINE_PIN = {'bytes':2177,'sha256':'9db297d52dde5bf7d51b9c6cff45f00eed43c70822b2c687bbb4309f7f78fe7b'}
CASES = [
    ('crozat-nav-selected_row-1-rows.json','02-export-selected-density-row4-json','actual-02b-selected-density-export-request.json',1),
    ('crozat-nav-filtered_rows-28-rows.json','04-export-full-percentage28-json','actual-04c-percentage28-export-request.json',28),
    ('crozat-nav-filtered_rows-84-rows.json','06-export-all84-json','actual-06b-all84-json-request.json',84),
    ('crozat-nav-filtered_rows-84-rows.csv','06-export-all84-csv','actual-06c-all84-csv-request.json',84),
    ('crozat-nav-filtered_rows-12-rows.json','06-export-density-Cerv-TTX12-json','actual-06e-twelve-json-request.json',12),
    ('crozat-nav-filtered_rows-12-rows.csv','06-export-density-Cerv-TTX12-csv','actual-06f-twelve-csv-request.json',12),
]

def pin(body):
    return {'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()}

def utc_ns(value):
    stamp = dt.datetime.fromisoformat(value.replace('Z','+00:00'))
    delta = stamp - dt.datetime(1970,1,1,tzinfo=dt.timezone.utc)
    return (delta.days*86400+delta.seconds)*1000000000+delta.microseconds*1000

def source_read(p):
    pb = p.stat()
    f = os.open(p,os.O_RDONLY)
    try:
        a = os.fstat(f);parts=[];n=0
        while n<a.st_size:
            chunk=os.pread(f,min(4096,a.st_size-n),n)
            assert chunk
            parts.append(chunk);n+=len(chunk)
        e=os.fstat(f);pa=p.stat()
        epochs=[(s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns)for s in [pb,a,e,pa]]
        assert all(v==epochs[0]for v in epochs)
        return b''.join(parts),a
    finally:
        os.close(f)

baseline_body=(OUT/'I61_EXACT_SIX_EXPORT_PATHS_PRE_NATIVE_BASELINE.json').read_bytes()
assert pin(baseline_body)==BASELINE_PIN
baseline=json.loads(baseline_body)
assert all(not x['lexists']for x in baseline['files'])
actions_body,_=source_read(QA/'original-native-actions.json')
events_body,_=source_read(QA/'native-download-event-observations.json')
actions=json.loads(actions_body);events=json.loads(events_body)
assert len(events)==6
for name,body in [('exact-original-native-actions-at-landing.json',actions_body),('exact-native-download-event-observations-at-landing.json',events_body)]:
    p=OUT/name;assert not p.exists();p.write_bytes(body)

# Native Node bigint stat provides integral birthtime ns, independent of Python's float birthtime.
node_code="""
import fs from 'node:fs';
const names=JSON.parse(process.argv[1]);const rows=[];
for(const name of names){const p='/Users/zhouzhenghang/Downloads/'+name;const s=fs.lstatSync(p,{bigint:true});
rows.push({filename:name,inode:String(s.ino),size:String(s.size),mtimeNs:String(s.mtimeNs),ctimeNs:String(s.ctimeNs),birthtimeNs:String(s.birthtimeNs),regular:s.isFile(),symlink:s.isSymbolicLink()});}
console.log(JSON.stringify({runtime:process.version,execPath:process.execPath,rows}));
"""
node_result=subprocess.run(['/opt/homebrew/bin/node','--input-type=module','-e',node_code,json.dumps([c[0]for c in CASES])],check=True,capture_output=True)
assert not node_result.stderr
node=json.loads(node_result.stdout);assert node['runtime']=='v26.0.0'
assert len(node['rows'])==6
(OUT/'I61_EXACT_SIX_NODE26_BIRTH_NS_METADATA.json').write_bytes(node_result.stdout)
metadata={row['filename']:row for row in node['rows']}
input_pins=[{'path':str(QA/'original-native-actions.json'),**pin(actions_body)}, {'path':str(QA/'native-download-event-observations.json'),**pin(events_body)}]
landings=[]
for filename,action_name,capture_name,expected_count in CASES:
    action_matches=[v for v in actions if v['name']==action_name]
    event_matches=[v for v in events if v['name']==action_name]
    assert len(action_matches)==len(event_matches)==1
    action=action_matches[0];event=event_matches[0]
    assert action['error']is None
    assert event['path']is None and 'Timed out after 5000ms' in event['error']
    capture_body,_=source_read(QA/capture_name);capture=json.loads(capture_body)
    capture_copy=OUT/('exact-'+capture_name);assert not capture_copy.exists();capture_copy.write_bytes(capture_body)
    input_pins.append({'path':str(QA/capture_name),**pin(capture_body)})
    clock=capture['toolCaptureWindowUTC'];start=utc_ns(action['startUTC']);end=utc_ns(clock['endUTC'])
    assert start<=utc_ns(action['endUTC'])<=end
    source=Path('/Users/zhouzhenghang/Downloads')/filename
    assert os.path.lexists(source) and not source.is_symlink()
    raw,s=source_read(source);assert stat.S_ISREG(s.st_mode)
    meta=metadata[filename];assert meta['regular']and not meta['symlink']
    assert(int(meta['inode']),int(meta['size']),int(meta['mtimeNs']))==(s.st_ino,s.st_size,s.st_mtime_ns)
    assert start<=int(meta['birthtimeNs'])<=end
    assert start<=s.st_mtime_ns<=end
    dest=OUT/('exact-landed-'+filename);assert not dest.exists();dest.write_bytes(raw)
    if filename.endswith('.json'):
        doc=json.loads(raw)
        assert doc['documentType']=='crozat_nav_original_source_rows' and doc['schemaVersion']=='0.1.0'
        assert doc['rowCount']==len(doc['rows'])==expected_count
        assert doc['independentPhysicalCellCount']is None
        assert doc['animalMappedRowCount']==doc['pairCount']==doc['newSourceProfiles']==doc['geometry']==doc['registrations']==0
        assert doc['originalWorkbooksFetchedInBrowser']is False and doc['actualViewCaptured']is False
        data_rows=doc['rows']
        if expected_count==1:
            assert data_rows[0]['sourceFileId']==56062562 and data_rows[0]['sourceRow']==4
            assert data_rows[0]['rawNumericLexical']=='-147.41999999999999'
        if expected_count==28:
            assert all(row['sourceFileId']==56062565 for row in data_rows)
            assert any(row['sourceRow']==3 and row['rawNumericLexical']=='143.1'for row in data_rows)
        source_hashes=sorted({(row['sourceFileId'],row['sourceFileSha256'])for row in data_rows})
    else:
        csv_rows=list(csv.DictReader(io.StringIO(raw.decode())))
        assert len(csv_rows)==expected_count
        source_hashes=sorted({(int(row['sourceFileId']),row['sourceFileSha256'])for row in csv_rows})
    expected_hashes={56062562:'53216ac2508ca26a3ac03cb40d796ca9973db25bbc120dce9fcf802e33dfbf81',56062565:'b5e7f7f67d4efc94b0582da92046c292b477f54d03f4016dcbbd6a0c197d5226'}
    assert all(sha==expected_hashes[file_id]for file_id,sha in source_hashes)
    landings.append({'filename':filename,'actualOriginalPath':str(source),'exactTempCopyPath':str(dest),**pin(raw),
                     'actualSourceMetadata':meta,'pythonReadEpochStable':True,'originalNativeAction':action,
                     'originalAfterCapturePath':str(QA/capture_name),'originalAfterCaptureWindow':clock,
                     'attributionWindowStartUtc':action['startUTC'],'attributionWindowEndUtc':clock['endUTC'],
                     'birthAndMtimeWithinOriginalNativeWindow':True,'originalEventApiObservation':event,
                     'originalEventApiDownloadObserved':False,'independentFilesystemLandingObserved':True,
                     'expectedWorksheetRows':expected_count,'bodyWorksheetRows':expected_count,
                     'retainedOriginalSourceHashes':source_hashes,
                     'fullScientificReplay':'Delegated to independent goal_audit exact-copy source replay; structural/source-hash checks here do not replace it.'})

receipt={'iteration':'I61','status':'PASS_SIX_CURRENT_NATIVE_EXACT_FILE_LANDINGS_EVENT_APIS_TIMED_OUT',
         'generatedAtUtc':dt.datetime.now(dt.timezone.utc).isoformat(),'preNativeBaseline':{'path':str(OUT/'I61_EXACT_SIX_EXPORT_PATHS_PRE_NATIVE_BASELINE.json'),**BASELINE_PIN},
         'landedFiles':landings,'originalQACaptureInputPins':input_pins,
         'planAdaptation':'Selected density row4 exported once asselected_row1. Selected percentage row3 is explicit DOM; fullfiltered28 JSONcontains143.1 and avoids same selected basename collision.',
         'scope':{'exactDownloadsPathsRead':6,'directoryEnumerations':0,'filenameVariantsRead':0,'nativeExportsTriggeredByReviewer':0,'originalsChanged':0,'rootWrites':0,'stageWrites':0,'networkCalls':0,'originalWorkbooksParsed':0},
         'limitations':['Six original event API timeouts remain retained as unsuccessful event observations. Independent file landing is separate evidence.',
                        'Original action-start→after-capture-end brackets and absent exact-path baseline establish attribution; no unrelated or old collision is inferred.',
                        'Native UI/rendered state, full source values/CSV derivation, fresh original workbook reads and private proof remain separate scopes.']}
body=json.dumps(receipt,ensure_ascii=False,indent=2).encode()+b'\n';p=OUT/'I61_INDEPENDENT_SIX_NATIVE_EXACT_FILE_LANDING_REVIEW.json';p.write_bytes(body)
print(json.dumps({'path':str(p),**pin(body),'status':receipt['status'],'landedFiles':[{'name':r['filename'],'bytes':r['bytes'],'sha256':r['sha256'],'copyPath':r['exactTempCopyPath']}for r in landings]}))
