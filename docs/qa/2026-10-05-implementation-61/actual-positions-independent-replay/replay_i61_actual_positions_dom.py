#!/usr/bin/env python3
"""Read-only original-clock DOM/producer replay. No browser or private proof producer."""
import copy, datetime, hashlib, json, math, os, pathlib, stat, zipfile

ROOT=pathlib.Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
HERE=pathlib.Path(__file__).parent
QA=ROOT/'docs/qa/2026-10-05-implementation-61'
READY='2026-10-05T09:19:41.099Z'
NAMES=['actual-positions-01-old-package-refused','actual-positions-02-current-package-fresh-normalized','actual-positions-02b-transverse-precondition','actual-positions-03-current-package-fresh-restored']
ACTIONS=['09a-paste-old-position-proof','09b-restore-old-position-proof','09c-reload-exact-current-position-files','09d-capture-fresh-current-position-view','09e-change-position-camera-to-transverse','09f-paste-current-position-proof','09g-restore-current-position-proof']
OLD=ROOT/'docs/qa/2026-10-05-implementation-59/captures/actual-positions-01-current-package-normalized.json'
CAPTURE_LABEL='Captured Ronzano actual source view JSON'
RESTORE_LABEL='Restore Ronzano actual source view JSON'
OBSERVED={}

def epoch(s): return (s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns,s.st_ctime_ns)
def body(p):
    p=pathlib.Path(p).absolute(); fd=os.open(p,os.O_RDONLY|os.O_NOFOLLOW)
    try:
        before=os.fstat(fd); assert stat.S_ISREG(before.st_mode)
        if p in OBSERVED: assert epoch(before)==OBSERVED[p]['epoch'],f'cross-read epoch: {p}'
        data=bytearray(); offset=0
        while offset<before.st_size:
            chunk=os.pread(fd,min(4096,before.st_size-offset),offset); assert chunk,'unexpected EOF'
            data.extend(chunk); offset+=len(chunk)
        assert epoch(before)==epoch(os.fstat(fd))==epoch(p.stat())
        data=bytes(data); digest=hashlib.sha256(data).hexdigest()
        if p in OBSERVED: assert digest==OBSERVED[p]['sha256'],f'cross-read body: {p}'
        else: OBSERVED[p]={'path':str(p),'bytes':len(data),'sha256':digest,'epoch':epoch(before)}
        return data
    finally: os.close(fd)
def pairs(values):
    out={}
    for key,value in values:
        assert key not in out,f'duplicate JSON key: {key}'
        out[key]=value
    return out
def floating(v):
    value=float(v); assert math.isfinite(value),'nonfinite or overflow JSON float'; return value

def strict(data):
    return json.loads(data,object_pairs_hook=pairs,parse_constant=lambda value: (_ for _ in ()).throw(AssertionError('nonfinite JSON constant')),parse_float=floating)
def load(p): return strict(body(p))
def clock(v):
    assert isinstance(v,str) and v.endswith('Z'), 'original UTC clock required'
    return datetime.datetime.fromisoformat(v[:-1]+'+00:00')
def bracket(doc):
    w=doc['toolCaptureWindowUTC']; assert set(w)=={'startedAt','finishedAt'}
    start,end=clock(w['startedAt']),clock(w['finishedAt']); assert start<=end<=clock(READY)
    return start,end

def one(values,predicate):
    matches=[v for v in values if predicate(v)]; assert len(matches)==1, 'unique scoped DOM owner required'; return matches[0]
def text(doc,label): return one(doc['textareas'],lambda t:t['label']==label)['value']
def button(doc,label): return one(doc['controls'],lambda t:t['tag']=='BUTTON' and t['text']==label)
def vec(a,b):
    assert len(a)==len(b) and all(math.isfinite(x) and math.isfinite(y) and abs(x-y)<=1e-12 for x,y in zip(a,b))

def validate(dom,producer,raw_producer,actions,old_bytes,current_build,math_result):
    old_doc=strict(old_bytes); p2,p3=producer; d1,d2,dp,d3=dom
    for name,d in zip(NAMES,dom):
        assert d['name']==name
        bracket(d)
        assert d['h1']=='Premotor positions' and d['sidebar'] is True and d['breadcrumb'] is True
        assert d['width']==1280 and d['height']==720 and d['scrollWidth']<=d['width']
        url='http://127.0.0.1:3004/explore/positions?positionFrame=normalized'
        if name==NAMES[2]: url+='&positionCamera=transverse'
        assert d['url']==url
        assert [c['value'] for c in d['controls'] if c['tag']=='SELECT']==['normalized','all','all']
        assert button(d,'Cancel restore')['disabled'] is True
        assert 'Source-local · 0 atlas joins · 0 REG' in d['sectionText'] and 'POINT POSITION ONLY · NO CELL GEOMETRY' in d['sectionText']
    windows=[bracket(d) for d in dom]
    assert all(a[1]<=b[0] for a,b in zip(windows,windows[1:]))
    assert [a['name'] for a in actions]==ACTIONS
    for a in actions: assert a['error'] is None and clock(a['startUTC'])<=clock(a['endUTC'])
    for a,b in zip(actions,actions[1:]): assert clock(a['endUTC'])<=clock(b['startUTC'])
    ai={a['name']:a for a in actions}
    assert clock(ai[ACTIONS[1]]['endUTC'])<=windows[0][0]
    assert windows[0][1]<=clock(ai[ACTIONS[2]]['startUTC'])
    assert clock(ai[ACTIONS[3]]['endUTC'])<=windows[1][0]
    assert windows[1][1]<=clock(ai[ACTIONS[4]]['startUTC'])
    assert clock(ai[ACTIONS[4]]['endUTC'])<=windows[2][0]
    assert windows[2][1]<=clock(ai[ACTIONS[5]]['startUTC'])
    assert clock(ai[ACTIONS[6]]['endUTC'])<=windows[3][0]
    # Failed old build cannot mint a view, canvas, row selection or exports.
    assert d1['canvasCount']==0
    assert d1['statuses']==['Restore failed closed · Ronzano source view: renderer build or scientific scope changed']
    assert 'Zero points are reported as rendered.' in d1['stageText']
    assert text(d1,CAPTURE_LABEL)=='' and text(d1,RESTORE_LABEL).encode()==old_bytes
    for label in ['Capture actual view','Export actual view receipt','Fit visible source rows','First row','Previous row','Next row','Last row','Clear row','Restore with fresh source verification']:
        assert button(d1,label)['disabled'] is True
    assert button(d1,'Reload exact source files')['disabled'] is False
    oldbuild=old_doc['rendererBuild']['inputs']; current=current_build['inputs']
    assert len(oldbuild)==len(current)==40
    assert [v['path'] for v in oldbuild]==[v['path'] for v in current]
    differences=[(a,b) for a,b in zip(oldbuild,current) if a!=b]
    assert len(differences)==1 and differences[0][0]['path']=='package.json'
    assert differences[0][0]['bytes']==40345 and differences[0][1]['bytes']==40563
    assert differences[0][0]['sha256']=='208fe6a1e92e9e2af82306d359ea5bb11226d27bcc701743bc8b9c9e9b50e585'
    assert differences[0][1]['sha256']=='eb9e4087b417a7b91397902fc02b5ac3d606f464c306e75599a0b82f85449ad1'
    # Both actual current producers are byte-identical to the scoped original textarea.
    for d,p,raw in zip([d2,d3],producer,raw_producer):
        assert d['canvasCount']==1 and '17,394 exact source rows drawn' in d['sectionText']
        assert text(d,CAPTURE_LABEL).encode()==raw and not raw.endswith(b'\n')
        assert strict(text(d,CAPTURE_LABEL))==p
        assert p['rendererBuild']==current_build
        assert p['view']['status']=='rendered_source_points' and p['view']['drawing']['submittedPointCount']==17394
        assert p['view']['sourceObject']['pointCount']==17394 and len(p['view']['sourceObject']['sourceFileIds'])==11
        assert p['view']['request']=={'frame':'normalized','muscle':'all','segment':'all','cameraPreset':'three_quarter','pointSizePixels':3,'layers':{'points':True,'axes':True}}
        assert p['view']['layers']=={'points':True,'axes':True} and p['view']['selectedRow'] is None
        assert p['sourceVerification']['requestCacheMode']=='no-store'
        assert len(p['sourceVerification']['files'])==23
        assert p['view']['runtimeBinding']['sourceVerificationSequence']==p['sourceVerification']['verificationSequence']
        assert clock(p['sourceVerification']['verifiedAt'])<=clock(p['generatedAt'])<=bracket(d)[0]
        for label in ['Capture actual view','Export actual view receipt','Fit visible source rows','First row','Previous row','Next row','Last row']:
            assert button(d,label)['disabled'] is False
        assert button(d,'Clear row')['disabled'] is True
        assert button(d,'Three Quarter')['pressed']=='true' and button(d,'Transverse')['pressed']=='false'
        inputs=[c for c in d['controls'] if c['tag']=='INPUT']
        assert len(inputs)==2 and inputs[0]['value']=='3' and inputs[1]['checked'] is True
    assert d2['statuses']==['Actual rendered camera, layers, source frame and selected row captured.']
    assert text(d2,RESTORE_LABEL).encode()==old_bytes
    assert p2['sourceVerification']['verificationSequence']==2
    assert clock(ai[ACTIONS[2]]['startUTC'])<=clock(p2['sourceVerification']['verifiedAt'])<windows[1][0]
    assert clock(ai[ACTIONS[3]]['startUTC'])<=clock(p2['generatedAt'])<=clock(ai[ACTIONS[3]]['endUTC'])
    # There is no transverse producer: only button/URL transition and old-proof invalidation are claimed.
    assert dp['canvasCount']==1 and '17,394 exact source rows drawn' in dp['sectionText']
    assert button(dp,'Transverse')['pressed']=='true' and button(dp,'Three Quarter')['pressed']=='false'
    assert text(dp,CAPTURE_LABEL)=='' and button(dp,'Export actual view receipt')['disabled'] is True
    assert text(dp,RESTORE_LABEL).encode()==old_bytes
    assert d3['statuses']==['Restored actual camera, row and layers after fresh verification of all23 source files.']
    assert text(d3,RESTORE_LABEL).encode()==raw_producer[0]
    assert p3['sourceVerification']['verificationSequence']==3
    assert clock(ai[ACTIONS[6]]['startUTC'])<=clock(p3['sourceVerification']['verifiedAt'])<=clock(p3['generatedAt'])<=clock(ai[ACTIONS[6]]['endUTC'])
    assert p2['sourceVerification']['files']==p3['sourceVerification']['files']==old_doc['sourceVerification']['files']
    assert p2['view']['runtimeBinding']['sceneInstanceId']!=p3['view']['runtimeBinding']['sceneInstanceId']
    for key in ['request','layers','selectedRow','sourceObject','renderer','drawing','viewport']:
        assert p2['view'][key]==p3['view'][key]
    for key,value in p2['view']['camera'].items():
        if key in ['position','target','up','quaternion']: vec(value,p3['view']['camera'][key])
        else: assert value==p3['view']['camera'][key]
    assert p2['sourceContext']==p3['sourceContext'] and p2['scientificScope']==p3['scientificScope']
    assert math_result['status']=='PASS' and math_result['captureCount']==2 and len(math_result['pairs'])==1
    assert math_result['mandatoryRuntimeAuthorityInputCount']==63
    for r in math_result['results']:
        assert r['exactSourcePointCount']==17394 and r['sourceFileCount']==11 and r['selectedRow'] is None
        assert r['cropped']=={'points':0,'boundsCorners':0,'x':0,'y':0,'depth':0,'nonfinite':0}
    return {'rejection':{'reason':'only current package pin changed','oldProducerExactBytes':len(old_bytes),'canvasCount':0,'capturedProducerEmpty':True,'captureAndExportDisabled':True},
      'fresh':{'verificationSequence':2,'requestCacheMode':'no-store','files':23,'normalizedRows':17394,'sourceFileGroups':11,'selectedRow':None,'canvasCount':1},
      'transversePrecondition':{'pressed':True,'capturedProducerEmpty':True,'exportDisabled':True,'exactCameraAbsentNotInvented':True},
      'restored':{'verificationSequence':3,'requestCacheMode':'no-store','files':23,'normalizedRows':17394,'freshScene':True,'priorCameraPreservedTolerance':1e-12,'sameRequestLayersNullRowSourceObjectRendererDrawingViewport':True},
      'originalActionWindows':actions,'originalCaptureWindows':[{'name':d['name'],**d['toolCaptureWindowUTC']} for d in dom]}

def run():
    dom=[load(QA/(n+'.json')) for n in NAMES]
    raw=[body(QA/'captures'/(n+'.json')) for n in [NAMES[1],NAMES[3]]]
    producer=[strict(v) for v in raw]
    allactions=load(QA/'original-native-actions.json')
    actions=[one(allactions,lambda a:a['name']==n) for n in ACTIONS]
    old=body(OLD); math_result=load(HERE/'I61_ACTUAL_SOURCE_CAMERA_MATH_REPLAY.json')
    current_build=math_result['build']
    result=validate(dom,producer,raw,actions,old,current_build,math_result)
    runtime=load(ROOT/'data/research-renderer-runtime-inputs-2.91.json')
    archive=body(QA/'preimages.zip')
    import io
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        prior=strict(z.read('data/research-renderer-runtime-inputs-2.91.json'))
        prior_package=z.read('package.json')
    assert len(prior['authoritativeInputs'])==len(runtime['authoritativeInputs'])==198
    assert [p['path'] for p in prior['authoritativeInputs']]==[p['path'] for p in runtime['authoritativeInputs']]
    delta=[{'before':a,'after':b} for a,b in zip(prior['authoritativeInputs'],runtime['authoritativeInputs']) if a!=b]
    assert len(delta)==1 and delta[0]['before']['path']=='package.json'
    assert hashlib.sha256(prior_package).hexdigest()==delta[0]['before']['sha256']
    assert hashlib.sha256(body(ROOT/'package.json')).hexdigest()==delta[0]['after']['sha256']
    prep=load(pathlib.Path('/private/tmp/ohri-i61-actual-intake-positions-static-20261005/I61_CURRENT_INTAKE_RUNTIME_PRIVATE_LAYOUT_CHECK.json'))
    private=[]
    for item in prep['eightPrivateScopes']:
        value=body(ROOT/item['module']); expected=item['producer']; assert len(value)==expected['bytes'] and hashlib.sha256(value).hexdigest()==expected['sha256']
        private.append({'module':item['module'],'bytes':len(value),'sha256':expected['sha256'],'membershipCount':item['membershipCount'],'membershipChangeRequired':False})
    layout=[]
    for item in prep['currentLayoutPinsExact']:
        value=body(pathlib.Path(item['path'])); assert len(value)==item['bytes'] and hashlib.sha256(value).hexdigest()==item['sha256']; layout.append(item)
    helper=body(QA/'native-position-capture-helper.js').decode()
    for literal in ['new Date().toISOString()', 'section[aria-labelledby="premotor-position-heading"]', 'Captured Ronzano actual source view JSON', "writeFile(i61QA+'captures/'+name+'.json',val,{flag:'wx'})", 'toolCaptureWindowUTC:{startedAt,finishedAt}']:
        assert literal in helper
    # Assert source/math inputs still have their anchored first epoch; do not rehash all source files.
    for item in math_result['anchoredReadContract']['exactFiles']:
        p=pathlib.Path(item['path']); assert [str(v) for v in epoch(p.stat())]==item['epoch'], f'math final input moved: {p}'
    for p,item in OBSERVED.items(): assert epoch(p.stat())==item['epoch'],f'DOM final input moved: {p}'
    result.update({'status':'PASS_I61_ACTUAL_POSITIONS_SOURCE_BUILD_DOM_CAMERA_REPLAY','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z'),
      'actualReadyUTC':READY,'runtime':{'memberCount':198,'orderedMembershipUnchanged':True,'onlyChangedPin':delta},'positionsBuildCount':40,'separateSourceFiles':23,'runtimeAuthorityUnion':63,
      'eightPrivateProducerPins':private,'currentLayoutPinsExact':layout,'originalSourceBytePins':math_result['originalAssetPins'],
      'producerInputs':[{**OBSERVED[(QA/'captures'/(n+'.json')).absolute()],'textareaExact':True,'appendedNewline':False} for n in [NAMES[1],NAMES[3]]],
      'mathReplayOutput':OBSERVED[(HERE/'I61_ACTUAL_SOURCE_CAMERA_MATH_REPLAY.json').absolute()],
      'readContract':{'chunkBytes':4096,'firstEpochRetained':True,'repeatShaChecked':True,'retries':0,'inputs':list(OBSERVED.values())},
      'scope':{'rootWrites':0,'stageWrites':0,'browserExecution':False,'networkExecution':False,'privateProofMinted':False,'pixelAttestation':False,'freshXlsxNumericReparse':False,'rowSelectionReplay':'null preserved; no nonnull row or keyboard claim','biologicalGeometry':0,'M2':0,'M4':0,'internalObjects':0,'registration':0,'crossFrameOrAnimalIdentity':'not established','scientificCompletionPromotion':False}})
    target=HERE/'I61_ACTUAL_POSITIONS_INDEPENDENT_REPLAY.json'; target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':result['status'],'output':str(target),'runtime':198,'build':40,'sources':23,'currentRows':17394,'capturedProducers':2,'oldProofRefused':True,'restoredFreshSequence':3}))

if __name__=='__main__': run()
