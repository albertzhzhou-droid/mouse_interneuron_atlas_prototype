"""Two explicitly authorized producer paths only; actual mode needs parent ready bindings."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import stat
import subprocess
from source_epoch_guard import pin, strict_json, epoch, exact_read

HERE = Path(__file__).resolve().parent
ROOT = Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
QA = ROOT / 'docs/qa/2026-10-05-implementation-62'
BASELINE_PIN = {'bytes': 522, 'sha256': '5c31ab3f7cf0efe1eb39e279fb753ec41fd6df84fb1d710f52678d964160bb77'}
EXPECTED = {
    'src-garcia-ramirez-2022-source-dossier.json': 'SRC-GARCIA-RAMIREZ-2022',
    'src-crozat-2025-source-dossier.json': 'SRC-CROZAT-2025',
}

def utc_ns(value):
    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    assert dt.tzinfo is not None
    delta = dt.astimezone(timezone.utc) - datetime(1970, 1, 1, tzinfo=timezone.utc)
    return (delta.days*86400 + delta.seconds)*1000000000 + delta.microseconds*1000

def baseline_guard(baseline):
    assert baseline['status'] == 'I62_EXACT_TWO_EXPORT_PATHS_PRE_NATIVE_BASELINE'
    assert baseline['directoryEnumeration'] is False and baseline['filenameVariantsRead'] is False
    assert len(baseline['exactPaths']) == 2
    paths = {r['path'] for r in baseline['exactPaths']}
    assert paths == {'/Users/zhouzhenghang/Downloads/'+name for name in EXPECTED}
    assert all(r['exists'] is False for r in baseline['exactPaths'])

def dossier_guard(doc, source_id, start, end):
    assert set(doc) == {'registryReleaseId','researchUpgradeRegistryId','exportedAt','source','recordSetNavigation','linkedResearchUpgrades','scientificPolicy'}
    assert doc['source']['id'] == source_id
    assert start <= utc_ns(doc['exportedAt']) <= end
    sets = doc['source']['recordSets']
    assert len(doc['recordSetNavigation']) == len(sets)
    assert [r['recordSetId'] for r in doc['recordSetNavigation']] == [r['recordSetId'] for r in sets]
    for row in doc['recordSetNavigation']:
        assert row['sourceId'] == source_id and row['authority'] == 'declared_metadata_navigation_only'
        assert row['renderedViewCaptured'] is False and row['sourceBytesVerifiedByThisReceipt'] is False
        assert row['newAdmissionCount'] == row['crossSourceIdentityJoinCount'] == row['registrationCount'] == 0
        assert row['status'] == 'unavailable' and row['entries'] == []
        assert 'sourceInformationNavigation' not in row and 'sourceVerificationToken' not in row

def qa_path(value):
    p = Path(value)
    assert p.resolve(strict=True).is_relative_to(QA.resolve(strict=True))
    return p

def write_owned(name, body):
    p = HERE / name
    assert p.parent.resolve(strict=True) == HERE
    assert not os.path.lexists(p)
    with p.open('xb') as f: f.write(body)
    return {'path': str(p), **pin(body)}

def node_exact_stats():
    # No directory inventory, fallback path, glob, variant or browser operation.
    code = """import fs from 'node:fs';
const names=JSON.parse(process.argv[1]); const rows=[];
for(const name of names){const p='/Users/zhouzhenghang/Downloads/'+name;
try{const s=fs.lstatSync(p,{bigint:true});rows.push({filename:name,exists:true,dev:String(s.dev),inode:String(s.ino),size:String(s.size),mtimeNs:String(s.mtimeNs),ctimeNs:String(s.ctimeNs),birthtimeNs:String(s.birthtimeNs),regular:s.isFile(),symlink:s.isSymbolicLink()});}
catch(e){if(e.code!=='ENOENT')throw e;rows.push({filename:name,exists:false,errorCode:'ENOENT'});}}
console.log(JSON.stringify({runtime:process.version,execPath:process.execPath,rows}));"""
    result = subprocess.run(['/opt/homebrew/bin/node','--input-type=module','-e',code,json.dumps(list(EXPECTED))], check=True, capture_output=True)
    assert result.stderr == b''
    doc = strict_json(result.stdout)
    assert doc['runtime'] == 'v26.0.0'
    assert {r['filename'] for r in doc['rows']} == set(EXPECTED) and len(doc['rows']) == 2
    return doc, result.stdout

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--prepare', action='store_true')
    mode.add_argument('--actual-export-ready', action='store_true')
    parser.add_argument('--bindings')
    args = parser.parse_args()
    assert HERE.is_relative_to(Path('/private/tmp').resolve(strict=True))
    observed, failures = {}, []
    bp, bb = exact_read(HERE/'exact-root-pre-native-two-path-baseline.json', observed, failures, True)
    assert bp == BASELINE_PIN
    baseline = strict_json(bb); baseline_guard(baseline)
    if args.prepare:
        assert args.bindings is None
        print(json.dumps({'status':'PREPARED_TWO_EXACT_I62_DOSSIER_PATHS_NOT_READ','filenames':list(EXPECTED),'baseline':BASELINE_PIN,'exactPersonalFilesRead':0,'directoryEnumeration':0,'futurePrecondition':'Explicit parent ACTUAL_EXPORT_READY plus exact original action and aftercapture artifact bindings.','independentScience':'Goal agent consumes only sealed temp copies; this helper does structural/stat/time attribution, no producthelper or source parser.'},indent=2))
        return
    assert args.bindings
    bindings_path = Path(args.bindings)
    bindings_pin, bindings_body = exact_read(bindings_path, observed, failures, True)
    bindings = strict_json(bindings_body)
    assert bindings['parentACTUAL_EXPORT_READY'] is True
    assert len(bindings['cases']) == 2 and {r['filename'] for r in bindings['cases']} == set(EXPECTED)
    actions_path = qa_path(bindings['originalNativeActionsPath'])
    events_path = qa_path(bindings['nativeEventObservationsPath'])
    ap, ab = exact_read(actions_path, observed, failures, True)
    ep, eb = exact_read(events_path, observed, failures, True)
    actions, events = strict_json(ab), strict_json(eb)
    proof_copies = [write_owned('exact-original-native-actions-at-landing.json', ab),write_owned('exact-native-event-observations-at-landing.json', eb)]
    node, node_body = node_exact_stats()
    proof_copies.append(write_owned('exact-node26-before-birth-ns-metadata.json', node_body))
    metadata = {r['filename']:r for r in node['rows']}
    rows, proof_inputs = [], [{'path':str(actions_path),**ap},{'path':str(events_path),**ep}]
    for case in bindings['cases']:
        name = case['filename']; source_id = EXPECTED[name]
        assert case['sourceId'] == source_id
        aa = [r for r in actions if r['name'] == case['actionName']]
        ee = [r for r in events if r['name'] == case['actionName']]
        assert len(aa) == len(ee) == 1
        action, event = aa[0], ee[0]
        assert action['error'] is None
        capture_path = qa_path(case['afterCapturePath'])
        capture_pin, capture_body = exact_read(capture_path, observed, failures, True)
        capture = strict_json(capture_body);clock = capture['toolCaptureWindowUTC']
        start, end = utc_ns(action['startUTC']), utc_ns(clock['endUTC'])
        assert start <= utc_ns(action['endUTC']) <= end
        assert utc_ns(baseline['toolCaptureWindowUTC']['finishedAt']) <= start
        proof_inputs.append({'path':str(capture_path),**capture_pin})
        proof_copies.append(write_owned('exact-'+capture_path.name,capture_body))
        meta = metadata[name]
        if not meta['exists']:
            rows.append({'filename':name,'status':'NOT_OBSERVED_EXACT_PATH_ABSENT','originalEvent':event,'exactPath':str(Path('/Users/zhouzhenghang/Downloads')/name),'fallbackAttempted':False})
            continue
        assert meta['regular'] and not meta['symlink']
        source_path = Path('/Users/zhouzhenghang/Downloads')/name
        assert not source_path.is_symlink()
        original_pin, raw = exact_read(source_path, observed, failures, True)
        first = observed[source_path]
        assert (int(meta['dev']),int(meta['inode']),int(meta['size']),int(meta['mtimeNs'])) == first
        assert start <= int(meta['birthtimeNs']) <= end and start <= int(meta['mtimeNs']) <= end
        doc = strict_json(raw); dossier_guard(doc,source_id,start,end)
        copy = write_owned('exact-landed-'+name,raw)
        assert original_pin == {k:copy[k] for k in ['bytes','sha256']}
        rows.append({'filename':name,'sourceId':source_id,'status':'PASS_CURRENT_NATIVE_EXACT_FILE_LANDING','actualOriginalPath':str(source_path),'exactTempCopyPath':copy['path'],**original_pin,'originalNodeMetadata':meta,'originalNativeAction':action,'originalEventApiObservation':event,'eventApiDownloadObserved':bool(event.get('path')),'originalAfterCapturePath':str(capture_path),'originalAfterCaptureWindow':clock,'attributionWindowStartUtc':action['startUTC'],'attributionWindowEndUtc':clock['endUTC'],'birthAndMtimeAndExportedAtWithinOriginalWindow':True,'independentFilesystemLandingObserved':True,'fullScientificReplay':'Independent goal agent full registry/upgrade/receipt literal replay; only structural/time gates run here.'})
    after, after_body = node_exact_stats()
    assert after['rows'] == node['rows'], 'Original exact file stat changed during bounded read'
    proof_copies.append(write_owned('exact-node26-after-birth-ns-metadata.json',after_body))
    for p, before in observed.items(): assert epoch(p.stat()) == before
    result = {'status':'PASS_TWO_CURRENT_I62_NATIVE_EXACT_DOSSIER_LANDINGS' if all(r['status'].startswith('PASS') for r in rows) else 'PARTIAL_EXACT_LANDING_NOT_OBSERVED_NO_FALLBACK','generatedAtUtc':datetime.now(timezone.utc).isoformat(),'bindingsPin':{'path':str(bindings_path),**bindings_pin},'preNativeBaseline':{'path':str(HERE/'exact-root-pre-native-two-path-baseline.json'),**BASELINE_PIN},'landedFiles':rows,'originalProofInputPins':proof_inputs,'exactProofCopies':proof_copies,'strictEpochRefusals':failures,'endOriginalEpochsStable':True,'scope':{'exactDownloadsPathsStatted':2,'exactPersonalFilesRead':sum(r['status'].startswith('PASS') for r in rows),'directoryEnumeration':0,'filenameVariantsRead':0,'nativeExportsTriggered':0,'originalsChanged':0,'rootWrites':0,'stageWrites':0,'browser':0,'network':0,'sourceParsers':0},'limitations':['Original event API outcomes including5s timeouts are retained separately; no failed event is rewritten as success.','Stat/body clocks with the absent exact-path baseline support current landing attribution only; full independent science/nativeUI/source authority are separate.']}
    result_copy = write_owned('I62_INDEPENDENT_TWO_NATIVE_EXACT_FILE_LANDING_REVIEW.json',(json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode())
    print(json.dumps({'review':result_copy,'status':result['status'],'landedFiles':rows},ensure_ascii=False))

if __name__ == '__main__':main()
