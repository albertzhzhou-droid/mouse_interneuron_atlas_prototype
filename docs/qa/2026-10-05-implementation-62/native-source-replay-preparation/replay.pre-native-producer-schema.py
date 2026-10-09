"""Independent literal registry/export/DOM replay. No product helper imports."""
import copy,datetime,hashlib,json,math,os,pathlib,re,urllib.parse

HERE=pathlib.Path(__file__).resolve().parent
GAR='SRC-GARCIA-RAMIREZ-2022'
CRO='SRC-CROZAT-2025'
GSET='RS-GARCIA-RAMIREZ-ADULT-SPINAL-AGGREGATE-PHYSIOLOGY'
CSET='RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE'
HREF='/explore/cell-types/additional?fromSource='+GAR+'&fromRecordSet='+GSET+'#garcia-ramirez-physiology-panel'
BOUNDARY='Navigation uses declared source metadata only. The destination verifies its own source files and rendering permissions. No new profile, physical-cell identity, geometry, internal object or registration is admitted.'

def check(ok,message):
    if not ok:raise ValueError(message)
def duplicate_pairs(items):
    out={}
    for key,value in items:
        check(key not in out,'duplicate JSON key: '+key);out[key]=value
    return out
def reject_constant(value):raise ValueError('nonfinite JSON constant: '+value)
def finite_float(value):
    n=float(value);check(math.isfinite(n),'overflow/nonfinite JSON float');return n
def strict_loads(text):
    return json.loads(text,object_pairs_hook=duplicate_pairs,parse_constant=reject_constant,parse_float=finite_float)
def strict_load(path):return strict_loads(pathlib.Path(path).read_text(encoding='utf-8'))
def pin(path):
    path=pathlib.Path(path);fd=os.open(path,os.O_RDONLY);before=os.fstat(fd);h=hashlib.sha256();off=0
    try:
        while True:
            part=os.pread(fd,4096,off)
            if not part:break
            h.update(part);off+=len(part)
        after=os.fstat(fd)
        check((before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns,before.st_ctime_ns)==(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns,after.st_ctime_ns),'input changed during read')
        check(off==before.st_size,'partial read')
        return {'path':str(path.resolve()),'bytes':off,'sha256':h.hexdigest()}
    finally:os.close(fd)
def pinned(e):
    p=pin(e['path']);check(all(p[k]==e[k] for k in ('bytes','sha256')),'input pin mismatch: '+e['path']);return p
def exact(a,b,path='$'):
    check(type(a) is type(b),'JSON type mismatch at '+path)
    if isinstance(a,dict):
        check(set(a)==set(b),'JSON keys differ at '+path)
        for key in a:exact(a[key],b[key],path+'.'+key)
    elif isinstance(a,list):
        check(len(a)==len(b),'JSON list length differs at '+path)
        for i,(x,y) in enumerate(zip(a,b)):exact(x,y,path+f'[{i}]')
    else:check(a==b,'JSON literal differs at '+path)
def utc(value):
    check(isinstance(value,str) and bool(re.search(r'(Z|\+00:00| UTC)$',value)),'UTC clock required')
    if value.endswith(' UTC'):value=value[:-4].replace(' ','T')+'Z'
    try:return datetime.datetime.fromisoformat(value.replace('Z','+00:00'))
    except ValueError:raise ValueError('invalid original UTC clock')
def bracket(capture):
    w=capture.get('toolCaptureWindowUTC');check(isinstance(w,dict),'missing original capture bracket')
    start,end=utc(w.get('startUTC')),utc(w.get('endUTC'));check(start<=end,'capture bracket reversed');return w
def norm(value):return re.sub(r'\s+',' ',str(value)).strip()
def readable(value):return re.sub(r'\b\w',lambda m:m.group(0).upper(),value.replace('_',' '))
def one_source(registry,source_id):
    rows=[s for s in registry['sources'] if s['id']==source_id];check(len(rows)==1,'unknown/ambiguous canonical source');return rows[0]
def one_set(source,set_id):
    rows=[s for s in source['recordSets'] if s['recordSetId']==set_id];check(len(rows)==1,'unknown/foreign/ambiguous record set');return rows[0]

def source_selection(registry,url):
    q=urllib.parse.parse_qs(urllib.parse.urlsplit(url).query,keep_blank_values=True)
    requests=q.get('source',[])
    if not requests:source=registry['sources'][0]
    else:
        owners=[[s for s in registry['sources'] if v==s['id'] or v in s['aliases']] for v in requests]
        if any(len(o)!=1 for o in owners) or len({o[0]['id'] for o in owners})!=1:return None,None,True,False
        source=owners[0][0]
    sets=q.get('recordSet',[])
    invalid_set=bool(sets) and (len(set(sets))!=1 or not any(r['recordSetId']==sets[0] for r in source['recordSets']))
    record_set=None if not sets or invalid_set else one_set(source,sets[0])
    return source,record_set,False,invalid_set

def expected_unavailable_navigation(registry,source,record_set):
    child=record_set['childRosterRef'];check(child['status']!='bundled_exact','this replay scope has no exact child roster')
    obj=record_set.get('sourceObjectSetRef');check(not obj or obj['status']!='bundled_exact','this replay scope has no exact object roster')
    params=urllib.parse.urlencode({'source':source['id'],'recordSet':record_set['recordSetId']})
    return {'schemaVersion':'0.1.0','registryReleaseId':registry['releaseId'],'sourceId':source['id'],'recordSetId':record_set['recordSetId'],'recordKind':record_set['recordKind'],'unitOfObservation':record_set['unitOfObservation'],'includedRecordCount':copy.deepcopy(record_set['includedRecordCount']),'sourceObjectSetReference':copy.deepcopy(obj),'authority':'declared_metadata_navigation_only','boundary':BOUNDARY,'newAdmissionCount':0,'crossSourceIdentityJoinCount':0,'registrationCount':0,'status':'unavailable','reference':copy.deepcopy(child),'entries':[],'reason':child['missingReason'] or 'No exact bundled roster or source-object set is declared.','sourceCitation':copy.deepcopy(source['citation']),'rights':copy.deepcopy(source['rights']),'requestedSourcePage':'/sources?'+params+'#'+record_set['recordSetId'],'renderedViewCaptured':False,'sourceBytesVerifiedByThisReceipt':False}
def expected_dossier(registry,upgrades,source_id):
    check(source_id in (GAR,CRO),'export outside exact two-source scope')
    source=one_source(registry,source_id);linked=[]
    for upgrade_id in source['linkedUpgradeIds']:
        rows=[r for r in upgrades['upgrades'] if r['id']==upgrade_id]
        check(len(rows)<=1,'ambiguous linked upgrade');linked.append(copy.deepcopy(rows[0] if rows else {'id':upgrade_id,'resolutionStatus':'unresolved'}))
    return {'registryReleaseId':registry['releaseId'],'researchUpgradeRegistryId':upgrades['registryId'],'exportedAt':None,'source':copy.deepcopy(source),'recordSetNavigation':[expected_unavailable_navigation(registry,source,s) for s in source['recordSets']],'linkedResearchUpgrades':linked,'scientificPolicy':copy.deepcopy(registry['scientificPolicy'])}
def check_dossier(actual,fixture,source_id):
    expected=copy.deepcopy(fixture['expectedDossiers'][source_id]);check(isinstance(actual,dict),'dossier object required')
    check(set(actual)==set(expected),'dossier top-level schema changed')
    utc(actual['exportedAt']);actual=copy.deepcopy(actual);actual['exportedAt']=None;exact(actual,expected)
    nav=actual['recordSetNavigation'];check(all(x['entries']==[] and x['renderedViewCaptured'] is False and x['sourceBytesVerifiedByThisReceipt'] is False for x in nav),'metadata receipt acquired native/source proof')
    return {'sourceId':source_id,'topLevelFields':7,'recordSets':len(nav),'navigationEntries':0,'sourceLiteralExact':True,'linkedUpgradesLiteralExact':True,'onlyVariableField':'exportedAt','sourceBytesVerifiedByThisReceipt':False,'renderedViewCaptured':False}

def scope_fields(source):
    def scopes(rows,key):return ' · '.join(str(v.get(key) if v.get(key) is not None else v.get('missingReason') or 'Not retained') for v in rows) if rows else 'Not retained'
    return {'Species':scopes(source['speciesScopes'],'scientificName'),'Life stage':scopes(source['lifeStageScopes'],'value'),'Region':scopes(source['regionScopes'],'value'),'Conditions':' · '.join(source['conditionScopes']) or 'Not retained','Modalities':' · '.join(source['modalities']) or 'Not retained','Admission':readable(source['admission']['status']),'Rights':readable(source['rights']['status']),'Research lanes':' · '.join(map(readable,source['researchLanes']))}
def field_map(items):
    check(isinstance(items,list),'DOM field list required');out={}
    for row in items:
        label=row['label'];check(label not in out,'duplicate DOM field');out[label]=norm(row['text'])
    return out
def expected_record_fields(record_set):
    fields={'Record kind':readable(record_set['recordKind']),'Observation unit':readable(record_set['unitOfObservation']),'Assignment authority':readable(record_set['assignmentAuthority']),'Cell/profile roster':readable(record_set['cellRosterAvailability']),'Canonical identity':readable(record_set['canonicalIdentityStatus']),'Child-roster drill-down':readable(record_set['childRosterRef']['status'])}
    if record_set.get('sourceObjectSetRef'):fields['Source-object set']=readable(record_set['sourceObjectSetRef']['status'])
    return fields
def check_registry_dom(raw,fixture):
    bracket(raw);registry=fixture['registry'];source,record_set,source_error,set_error=source_selection(registry,raw['url'])
    dom=raw['registry'];check(dom['ariaBusy'] is False and dom['inert'] is False,'registry restoration not committed')
    dossier=dom['dossier'];actions=dom['informationLinks'];buttons=dom['exportButtons']
    if source_error:
        check(dossier['present'] is False and actions==[] and buttons==[],'unknown source retained prior dossier/action/export')
        check(any('unknown or ambiguous' in x for x in raw['statuses']),'missing explicit source error')
        return {'kind':'registry','sourceError':True,'informationLinks':0,'exports':0}
    check(dossier['present'] is True and dossier['sourceId']==source['id'],'dossier owner mismatch')
    check(norm(dossier['title'])==norm(source['title']),'dossier title mismatch')
    if source['id'] not in (GAR,CRO):
        exact(actions,[]);check(len(buttons)==1 and buttons[0]['text']=='Export source dossier' and buttons[0]['disabled'] is False,'other explicit source export unavailable')
        return {'kind':'registry','sourceId':source['id'],'informationLinks':0,'scope':'other explicit source ownership/no stale Garcia action only; exact-child roster behavior remains its existing authority'}
    exact(field_map(dossier['scopeFields']),{k:norm(v) for k,v in scope_fields(source).items()})
    units=dossier['units'];check(len(units)==len(source['experimentalUnits']),'unit count changed')
    for actual,expected in zip(units,source['experimentalUnits']):
        check(norm(actual['unit'])==readable(expected['unit']),'experimental unit label changed')
        count='Not retained' if expected['count'] is None else f"{expected['count']:,}"
        check(norm(actual['count'])==count,'denominator pooled or filled')
        check(norm(expected['scope']) in norm(actual['scope']),'experimental unit scope missing')
    sets=dossier['recordSets'];check(len(sets)==len(source['recordSets']),'record-set count changed')
    for actual,expected in zip(sets,source['recordSets']):
        check(actual['id']==expected['recordSetId'],'record-set owner/order mismatch');exact(field_map(actual['fields']),{k:norm(v) for k,v in expected_record_fields(expected).items()})
        check(actual['exactChildNavigationCount']==0,'aggregate/current source acquired child navigation')
        check(norm(expected['childRosterRef']['missingReason']) in norm(actual['text']),'missing child-boundary explanation')
    check(len(dossier['assets'])==len(source['assets']),'source asset count mismatch')
    check([a['id'] for a in dossier['assets']]==[a['id'] for a in source['assets']],'asset source/order mismatch')
    for asset,expected in zip(dossier['assets'],source['assets']):
        sha=expected['integrity']['sha256']
        if sha:check(sha[:12]+'…'+sha[-8:] in asset['text'],'asset metadata hash text mismatch')
    check(len(buttons)==1 and buttons[0]['text']=='Export source dossier' and buttons[0]['disabled'] is False,'source export availability changed')
    expected_actions=[]
    if source['id']==GAR and not set_error:expected_actions=[{'text':'Open published aggregate physiology tables','href':HREF}]
    exact(actions,expected_actions)
    if set_error:check(any('record set is unknown, ambiguous or not owned' in x for x in raw['statuses']),'foreign/ambiguous set error missing')
    return {'kind':'registry','sourceId':source['id'],'recordSetRequested':record_set['recordSetId'] if record_set else None,'recordSetError':set_error,'experimentalUnits':len(units),'recordSets':len(sets),'assetCount':len(source['assets']),'informationLinks':len(actions),'childNavigationEntries':0,'exports':1}

def check_destination_dom(raw,fixture,expect_open=True):
    bracket(raw);parts=urllib.parse.urlsplit(raw['url']);check(parts.path=='/explore/cell-types/additional','wrong information destination route')
    params=urllib.parse.parse_qs(parts.query,keep_blank_values=True)
    check(params.get('fromSource')==[GAR] and params.get('fromRecordSet')==[GSET],'destination source qualification changed')
    check(parts.fragment=='garcia-ramirez-physiology-panel','destination fragment changed')
    details=raw['physiology'];check(details['id']=='garcia-ramirez-physiology-panel' and details['open'] is expect_open,'destination disclosure state mismatch')
    check(details['summary']=='Adult Shox2 and Chx10 electrophysiology','destination action heading mismatch')
    if not expect_open:
        check(details['panelPresent'] is False and details['table']==[],'closed destination retained visible facts');return {'kind':'destination','open':False,'visibleSourceTables':0,'scope':'captured physiology subtree only; no whole DOM removal inference'}
    check(details['panelPresent'] is True,'destination lazy panel not mounted')
    check('same 171-observation study pool' in details['text'],'aggregate recorded-pool boundary missing')
    check('individual animal assignments are unavailable' in details['text'],'cell-to-animal unknown boundary missing')
    key=details['grouping'];check(key in ['ST1','ST2','ST3','ST4'],'selected table unknown')
    table=fixture['garciaTables'][key]
    query=details['query'].strip().lower();rows=[r for r in table['propertyRows'] if not query or query in (' '.join([r['propertyLabelRaw'],r['propertyId'],r['unitRaw'] or ''])).lower()]
    expected_rows=[[r['propertyLabelRaw']]+[v['raw'] for v in r['values']]+[r['reportedComparison']['statisticRaw'],r['reportedComparison']['pValueRaw']] for r in rows]
    exact(details['table'],expected_rows)
    expected_locators=[[f"Data Sheet 1 · table {v['locator']['tableOrdinal']}, row {v['locator']['rowOneBased']}, column {v['locator']['columnOneBased']}" for v in r['values']] for r in rows]
    exact(details['meanSdCellLocators'],expected_locators)
    return {'kind':'destination','open':True,'table':key,'propertyRows':len(rows),'rawMeanSdCells':len(rows)*len(table['groups']),'sourceReportedStatisticAndPCells':2*len(rows),'sourceLocatorsExact':True,'newProfiles':0,'newCellRosterRows':0,'registration':0}

def check_inputs(fixture):
    for e in fixture['sourcePins']:pinned(e)

def run_actual(manifest_path):
    manifest_path=pathlib.Path(manifest_path);manifest_pin=pin(manifest_path);m=strict_load(manifest_path)
    check(m.get('parentActualReady') is True,'actual replay requires parent ACTUAL_READY')
    utc(m['parentActualReadyUTC']);check(m.get('actualClockAuthority')=='original_raw_tool_brackets_only','raw clock authority missing')
    fixture_entry=m['fixture'];pinned(fixture_entry);fixture=strict_load(fixture_entry['path']);check_inputs(fixture)
    input_pins=[manifest_pin,fixture_entry]+fixture['sourcePins'];results=[]
    for entry in m['captures']:
        pinned(entry['file']);raw=strict_load(entry['file']['path']);input_pins.append(entry['file'])
        if entry['kind']=='registry':results.append(check_registry_dom(raw,fixture))
        elif entry['kind']=='destination':results.append(check_destination_dom(raw,fixture,entry.get('expectOpen',True)))
        else:raise ValueError('unknown capture replay kind')
    exports=m['exports'];check(len(exports)==2 and {e['sourceId'] for e in exports}=={GAR,CRO},'exact two source exports required')
    export_results=[]
    for e in exports:
        path=pathlib.Path(e['file']['path']);check('/Downloads/' not in str(path) and str(path).startswith('/private/tmp/'),'only sealed temp native file copy accepted')
        pinned(e['file']);input_pins.append(e['file']);export_results.append(check_dossier(strict_load(path),fixture,e['sourceId']))
    check(m.get('landingAuthority') is not None,'independent native landing authority required')
    for role in ('review','seal'):
        e=m['landingAuthority'][role];pinned(e);input_pins.append(e)
    for p in input_pins:pinned(p)
    return {'status':'PASS_SCOPED_I62_ACTUAL_SOURCE_DOM_AND_EXACT_TWO_EXPORT_BODIES','captures':results,'exports':export_results,'inputPins':input_pins,'endInputRehash':True,'rootWrites':0,'sourceParserImports':0,'nativeLandingAuthority':m['landingAuthority'],'landingScope':'body semantics replay consumes independently attributed exact temp copies; event API/file creation authority remains separate','sourceBytesOrRenderProofMinted':False,'fullGoalComplete':False}

if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--manifest',required=True);p.add_argument('--output',required=True);args=p.parse_args()
    result=run_actual(args.manifest);pathlib.Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(result['status'])
