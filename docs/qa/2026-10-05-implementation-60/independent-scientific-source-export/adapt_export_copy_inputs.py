from pathlib import Path
import json,hashlib
p=Path('/private/tmp/ohri-i60-comparison-source-replay/replay_i60_comparison_source.py');before=p.read_bytes();t=before.decode()
old="        attribution = config['nativeExportAttribution']; _, attribution_pin, attribution_body, _ = actual_input(attribution)\n        attribution_json = strict_json(attribution_body); assert str(attribution_json['status']).startswith('PASS')"
new="""        landing_dir = Path('/private/tmp/ohri-i60-exact-native-export-landing-20261005')
        attribution = config['nativeExportAttribution']
        assert attribution['path'] == str(landing_dir / 'I60_INDEPENDENT_NATIVE_EXACT_FILE_LANDING_REVIEW.json')
        assert pin(attribution) == {'bytes': 7855, 'sha256': '1823d342473524c5d70fef74427a051be51f6714d4c42d338960a40989454e63'}
        _, attribution_pin, attribution_body, _ = actual_input(attribution, False)
        attribution_json = strict_json(attribution_body)
        assert attribution_json['iteration'] == 'I60' and attribution_json['status'] == 'PASS_INDEPENDENT_CURRENT_NATIVE_FILE_LANDING_EVENT_APIS_TIMED_OUT'
        seal_item = config['nativeExportLandingSeal']
        assert seal_item['path'] == str(landing_dir / 'I60_EXACT_NATIVE_EXPORT_LANDING_SEAL.json')
        assert pin(seal_item) == {'bytes': 3141, 'sha256': 'b31da496840cd50a508d13f304489e4356fde8b53f90d8e2f93b5047c99818c5'}
        _, landing_seal_pin, seal_body, _ = actual_input(seal_item, False)
        landing_seal = strict_json(seal_body)
        assert landing_seal['iteration'] == 'I60' and landing_seal['landedCount'] == 2 and landing_seal['helperReplayExitCode'] == 0
        sealed_landing_inputs = []
        for descriptor in landing_seal['files']:
            assert Path(descriptor['path']).resolve().is_relative_to(landing_dir.resolve())
            _, actual_landing_pin, _, _ = actual_input(descriptor, False)
            sealed_landing_inputs.append({'path': descriptor['path'], 'actual': actual_landing_pin})
        assert landing_seal['originalDownloadEventApiObserved'] is False and landing_seal['originalDownloadEventTimeoutMilliseconds'] == 5000
        assert len(attribution_json['landedFiles']) == 2 and {item['extension'] for item in attribution_json['landedFiles']} == {'json', 'csv'}"""
old2="""            assert item['path'] == '/Users/zhouzhenghang/Downloads/' + expected_name, 'Only exact two pre-baselined Downloads paths; no variant enumeration'
            path, actual, body, calls = actual_input(item, False)"""
new2="""            assert item['path'] == str(landing_dir / ('exact-landed-' + expected_name)), 'Read only exact independently sealed temp copies; no personal Downloads reread'
            landed = next(row for row in attribution_json['landedFiles'] if row['extension'] == expected_name.rsplit('.', 1)[1])
            assert landed['exactPersonalPath'] == '/Users/zhouzhenghang/Downloads/' + expected_name
            assert landed['exactTempCopy'] == {'path': item['path'], **pin(item)}
            assert all(landed[key] is True for key in ('birthtimeWithinOriginalWindow', 'mtimeWithinOriginalWindow', 'bothEarlierBaselinesActuallyAbsent', 'independentFileLandingObserved'))
            assert landed['originalEventApiObservedDownload'] is False and 'Timed out after 5000ms' in landed['originalEventApiError']
            path, actual, body, calls = actual_input(item, False)"""
old3="""            check = assert_native_json(body, reports[capture_path]) if item['kind'] == 'JSON' else assert_native_csv(body, reports[capture_path])
            export_rows.append({'path': str(path), 'actual': actual, 'sourceCapturePath': capture_path, 'sourceReplay': check, 'landingAttributionActual': attribution_pin, 'preadCalls': calls})"""
new3="""            expected = reports[capture_path]; context = attribution_json['currentDomContentBinding']
            assert context['exactSelectedKeys'] == expected['selectedKeys'] and context['anchorKey'] == expected['anchorKey']
            check = assert_native_json(body, expected) if item['kind'] == 'JSON' else assert_native_csv(body, expected)
            export_rows.append({'path': str(path), 'actual': actual, 'exactPersonalPathOwnedBySeparateLandingPeer': landed['exactPersonalPath'], 'personalPathReadByThisHelper': False,
                                'sourceCapturePath': capture_path, 'sourceReplay': check, 'landingAttributionActual': attribution_pin, 'landingSealActual': landing_seal_pin,
                                'sealedLandingInputs': sealed_landing_inputs, 'originalEventApiObservedDownload': False, 'originalTimeoutRetained': True, 'preadCalls': calls})"""
old4="'Actual native file landing attribution is delegated to and bound from the source-agent receipt; this helper neither triggers exports nor enumerates Downloads.'"
new4="'Actual native file landing attribution is delegated to and bound from the source-agent receipt and exact sealed temp copies; this helper neither rereads personal Downloads, triggers exports nor enumerates files. Original event API timeouts remain retained.'"
reps=[(old,new),(old2,new2),(old3,new3),(old4,new4)]
for a,b in reps:assert t.count(a)==1,a;t=t.replace(a,b)
after=t.encode();q=p.parent/'replay_i60_comparison_source.py.SEALED_TEMP_EXPORT_ADAPTER_BEFORE';q.write_bytes(before);p.write_bytes(after)
pin=lambda b:{'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
(p.parent/'I60_SEALED_TEMP_EXPORT_INPUT_ADAPTER.json').write_text(json.dumps({'status':'EXACT_TEMP_COPY_LANDING_ADAPTER_NO_PERSONAL_DOWNLOADS_REREAD','parentActualReady':True,'sourceAgentInstruction':'Consume exact sealed temp copies instead of rereading personal Downloads.','beforePath':str(q),'before':pin(before),'after':pin(after),'exactReplacements':[{'old':a,'new':b}for a,b in reps],'sourceExportComparisonGuardsWeakened':False,'originalTwoDownloadsLandingAttributionStillRequired':True,'rawOriginalWrites':0,'rootWrites':0,'stageWrites':0},ensure_ascii=False,indent=2)+'\n')
print(pin(after))
