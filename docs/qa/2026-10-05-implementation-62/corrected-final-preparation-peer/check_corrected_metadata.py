import ast, copy, io, json
from pathlib import Path
import zipfile
import source_epoch_guard as g
from owned_ui_correction_guard import assert_ui_delta, UI_PATH, BEFORE

HERE=Path(__file__).resolve().parent
OWNER=Path('/private/tmp/ohri-i62-final-preservation-preparation-20261005')
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
OLD=OWNER/'preserved-before-owned-ui-44px-12px-correction'
observed, failures={}, []
def body(p): return g.exact_read(p,observed,failures,True)[1]
def pin(p): return g.exact_read(p,observed,failures)[0]
def load(p): return g.strict_json(body(p))
seal=load(OWNER/'I62_CORRECTED_OWNED_UI_FINAL_PRESERVATION_PREPARATION_SEAL.json')
assert seal['actualFinalExecuted'] is False
for row in seal['files']: assert pin(Path(row['path']))==g.only_pin(row)
config=load(OWNER/'I62_PREPARED_REAL_INTAKE_BOUND_CONFIG.json')
old_config=load(OLD/'I62_PREPARED_REAL_INTAKE_BOUND_CONFIG.json')
allowed_changes={'status','boundCopies','finalReadiness','ownedUiCorrectionGuardPin','ownedUiCorrection','ownedUiCorrectionReceiptPin','originalPreparationHistory'}
assert {k for k in set(config)|set(old_config) if config.get(k)!=old_config.get(k)}==allowed_changes
assert config['boundCopies'][:5]==old_config['boundCopies'] and len(config['boundCopies'])==7
copied={}
for row in config['boundCopies']:
    cp, orig=Path(row['copyPath']),Path(row['originalPath'])
    assert pin(cp)==pin(orig)==g.only_pin(row)
    copied[cp.name]=body(cp)
intake=g.strict_json(copied['exact-root-i62-intake.json'])
apply=g.strict_json(copied['exact-root-i62-actual-apply.json'])
checkpoint=g.strict_json(copied['exact-accepted-i61-checkpoint.json'])
correction=g.strict_json(copied['exact-root-i62-owned-ui-correction.json'])
tree=ast.parse(body(OWNER/'check_i62_final_preservation.py'))
ns={};node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='indexed')
exec(compile(ast.Module(body=[node],type_ignores=[]),'pure-indexed-only','exec'),ns)
indexed=ns['indexed']
targets={r['path']:r for r in intake['candidateTargets']}
def validate_flat(rows):
    got=indexed(rows,4);assert set(got)==set(targets)
    for name,row in got.items():assert g.only_pin(row)==targets[name]['after']
    return got
after=validate_flat(apply['candidateTargets'])
assert apply['actualApplyExitCode']==0 and apply['ownedPackage'] is False and apply['scientificAdmissionCount']==0
for mutate in ['duplicate','nested','pin','foreign','missing']:
    rows=copy.deepcopy(apply['candidateTargets'])
    if mutate=='duplicate':rows[1]=copy.deepcopy(rows[0])
    elif mutate=='nested':rows[0]={'path':rows[0]['path'],'after':targets[rows[0]['path']]['after']}
    elif mutate=='pin':rows[0]['sha256']='0'*64
    elif mutate=='foreign':rows[0]['path']='app/foreign.js'
    else:rows.pop()
    try:validate_flat(rows)
    except (AssertionError,KeyError):pass
    else:raise AssertionError('Invalid flat actual apply accepted: '+mutate)
assert correction['before']==BEFORE==g.only_pin(after[UI_PATH])
assert correction['after']==seal['ownedUiCorrection']['after']==config['ownedUiCorrection']['after']
assert correction['occurrences']==1 and type(correction['occurrences']) is int
assert correction['originalCandidatePatchAndApplyReceiptPreserved'] is True and correction['layoutCssChanged'] is False
with zipfile.ZipFile(io.BytesIO(copied['exact-root-i62-owned-ui-correction-preimage.zip'])) as z:
    assert z.namelist()==[UI_PATH]
    ui_before=z.read(UI_PATH)
ui_after=body(ROOT/UI_PATH)
assert g.pin(ui_before)==BEFORE and g.pin(ui_after)==correction['after']
assert assert_ui_delta(ui_before,ui_after)==config['ownedUiCorrection']
assert ui_after==ui_before.replace(correction['literalBefore'].encode(),correction['literalAfter'].encode(),1)
(HERE/'exact-ui-before.tsx').write_bytes(ui_before)
(HERE/'exact-ui-after.tsx').write_bytes(ui_after)
actual_after=[]
for name,row in after.items():
    expected=correction['after'] if name==UI_PATH else g.only_pin(row)
    actual=pin(ROOT/name);assert actual==expected
    actual_after.append({'path':name,**actual})
baseline=indexed(intake['baselineInputs'],2601);mutable=set(config['allowedMutablePaths']);core=config['requiredCore4']
assert core==apply['exactCoreAdditions']==intake['newCanonicalPaths'] and len(core)==len(set(core))==4
assert not set(core)&set(baseline) and len(set(core)|set(baseline))==2605
assert len([p for p in baseline if p not in mutable])==2596
assert 'package.json' not in mutable and config['packageIsOwned'] is False
with zipfile.ZipFile(io.BytesIO(copied['exact-root-i62-preimages.zip'])) as z:
    assert len(z.namelist())==len(set(z.namelist()))==6 and set(z.namelist())==set(intake['preimagePaths'])
    for r in intake['preimagePins']: assert g.pin(z.read(r['path']))==g.only_pin(r)
    old_runtime_body=z.read('data/research-renderer-runtime-inputs-2.91.json')
    old_manifest=g.strict_json(z.read('data/research-iteration-manifest-2.91.json'))
    assert old_manifest['authoritativeInputs']==intake['baselineInputs']
runtime_name='data/research-renderer-runtime-inputs-2.91.json'
assert body(ROOT/runtime_name)==old_runtime_body and g.pin(old_runtime_body)==config['runtimeBeforePin']
runtime=g.strict_json(old_runtime_body);runtime_rows=indexed(runtime['authoritativeInputs'],198)
assert pin(ROOT/'package.json')==g.only_pin(baseline['package.json'])
members=indexed(checkpoint['members'],83)
assert checkpoint['status']=='PASS_ACCEPTED_I61_CHECKPOINT' and checkpoint['canonicalEpoch']==intake['baselineManifestPin']
with zipfile.ZipFile(io.BytesIO(copied['exact-accepted-i61-checkpoint.zip'])) as z:
    assert len(z.namelist())==len(set(z.namelist()))==83 and set(z.namelist())==set(members)
    for row in members.values():assert g.pin(z.read(row['path']))==g.only_pin(row)
accepted_protected=[r for n,r in members.items() if n not in mutable]
assert len(accepted_protected)==77 and config['acceptedI61ProtectedMembers'] is None
assert len(config['privateScopes'])==8 and len(config['positionsBuildPaths'])==40 and len(config['positionsSourcePins'])==23
assert all(set(s['paths'])<=set(runtime_rows) and not set(s['paths'])&set(after) for s in config['privateScopes'])
assert len(config['sourceInformationScope']['assets'])==4
layout_names=['app/layout.tsx','app/SiteNavigation.tsx','app/site-navigation.ts','app/site-navigation.css','app/ResearchCollectionPage.tsx','app/ResearchRoutePage.tsx','app/ResearchSourceRegistry.tsx']
css_names=['app/globals.css','app/academic-interface.css','app/research-pages.css','app/research-information-layout.css','app/site-navigation.css']
checked_layout=[]
for name in dict.fromkeys(layout_names+css_names):
    expected=correction['after'] if name==UI_PATH else g.only_pin(baseline[name])
    actual=pin(ROOT/name);assert actual==expected
    checked_layout.append({'path':name,**actual})
source=body(OWNER/'check_i62_final_preservation.py')
for literal in [b'assert expected_pin is not None and actual == expected_pin',b'assert body(RUNTIME) == old_runtime_body',b"assert only_pin(current['package.json']) == only_pin(baseline['package.json'])",b'acceptedI61ProtectedMembersVerified=len(accepted_protected)',b'assert current_manifest[\'implementationScope\'] == old_manifest[\'implementationScope\']']:
    assert literal in source
old_table=load(OLD/'I62_PREPARED_FINAL_SOURCE_PROTECTION_TABLE.json')
new_table=load(OWNER/'I62_PREPARED_FINAL_SOURCE_PROTECTION_TABLE.json')
for name in ['counts','protectedPriorInputs','requiredCore4','allowedMutablePaths','runtimeMustRemainWholeBytePin','scientificRegistrySummaryExpected','acceptedI61MutableIntersection','sourceInformationScope']:
    assert new_table[name]==old_table[name]
assert new_table['candidateOriginalExpectedAfter']==old_table['candidateExpectedAfter']
assert new_table['candidateExpectedAfter']==actual_after
for p,e in observed.items():assert g.epoch(p.stat())==e
result={'status':'PASS_BOUNDED_CORRECTED_I62_PREPARATION_METADATA_ONLY','sealedInputsStable':len(seal['files']),'originalQaCopiesExact':config['boundCopies'],'flatPositiveAndNegativeGuards':6,'soleLiteralOwnedUiDelta':assert_ui_delta(ui_before,ui_after),'actualFourAfterimages':actual_after,'packageWholeByteUnchanged':g.only_pin(baseline['package.json']),'runtime198WholeByteUnchanged':config['runtimeBeforePin'],'canonicalProjection':2605,'protectedMetadataRowsUnchanged':2596,'actualAcceptedI61Members':83,'derivedAcceptedProtected':77,'privateDeclarations':8,'positionsBuild':40,'positionsSources':23,'aggregateSourceAssetsUnchanged':4,'sevenLayoutMembersAndCssBound':checked_layout,'epochRefusals':failures,'helperMainPrepareFinalExecuted':False,'fullRootSourceHashScan':False}
(HERE/'I62_CORRECTED_BOUNDED_METADATA_CHECK.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k in ['status','sealedInputsStable','flatPositiveAndNegativeGuards','canonicalProjection','protectedMetadataRowsUnchanged','actualAcceptedI61Members','derivedAcceptedProtected','helperMainPrepareFinalExecuted','fullRootSourceHashScan']}))
