from pathlib import Path
import json,hashlib,os,datetime
p=Path('/private/tmp/ohri-i61-real-intake-preparation-20261005')
def pin(f):
 fd=os.open(f,os.O_RDONLY|os.O_NOFOLLOW);h=hashlib.sha256();n=0;c=0
 try:
  a=os.fstat(fd)
  while True:
   b=os.pread(fd,4096,n);c+=1
   if not b:break
   n+=len(b);h.update(b)
  z=os.fstat(fd)
  assert (a.st_ino,a.st_size,a.st_mtime_ns)==(z.st_ino,z.st_size,z.st_mtime_ns) and n==a.st_size
 finally:os.close(fd)
 return {'path':str(f),'bytes':n,'sha256':h.hexdigest(),'preadCalls':c}
x=json.loads((p/'I61_REAL_INTAKE_PREPARATION.json').read_text())
assert len(x['candidateTargets'])==19 and len(x['ownedPreimages'])==9 and len(x['physicalAbsences'])==16
assert x['acceptedI60Checkpoint'] is None and not x['allActualCanonicalFilesChecked']
assert len(x['sourceUnitAndPhysicalInputs']['actual26PhysicalWorkbookRead'])==26
root=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
for row in x['candidateTargets']:
 a=pin(row['proposalPath']);assert {k:a[k] for k in ('bytes','sha256')}==row['proposedActual'];rp=root/row['path']
 if row['physicalAbsent']:assert not os.path.lexists(rp)
 else:
  a=pin(rp);assert {k:a[k] for k in ('bytes','sha256')}==row['beforeActual']
assert not (p/'I61_REAL_ROOT_INTAKE.json').exists() and not (p/'I61_REAL_ROOT_INTAKE_PREIMAGES.zip').exists()
assert 'REFUSE_MISSING_FINAL_ACCEPTED_I60_CHECKPOINT' in (p/'I61_MISSING_ACCEPTED_I60_REFUSAL_GUARD.log').read_text()
files=['prepare_i61_real_root_intake.py','README.md','I61_REAL_INTAKE_PREPARATION.json','I61_REAL_INTAKE_PREPARATION_FINAL.log','I61_EXACT_CORE_INPUT_ADDITIONS.txt','I61_MISSING_ACCEPTED_I60_REFUSAL_GUARD.log','I61_REAL_INTAKE_PREPARATION.log','I61_PREPARATION_INITIAL_DIAGNOSTIC.log','I61_PREPARATION_SOURCE_FIELD_UNION_REPAIR.json','prepare_i61_real_root_intake.before-all-new-field-delta.py','I61_NONOWNED_SOURCE_SHADOW_SYMLINK_STOP.log','I61_NONOWNED_SOURCE_ASSET_ORIGIN_REPAIR.json','prepare_i61_real_root_intake.before-nonowned-source-origin.py','seal_preparation.py']
r={'status':'SEALED_I61_REAL_ROOT_INTAKE_PREPARATION_NOT_EXECUTED_BEFORE_ACCEPTED_I60','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':[pin(p/f) for f in files],'currentRootPackage':{'bytes':40345,'sha256':'208fe6a1e92e9e2af82306d359ea5bb11226d27bcc701743bc8b9c9e9b50e585'},'candidateTargets':19,'candidateCurrentPreimages':4,'candidatePhysicalAbsences':15,'deduplicatedOwnedPreimages':9,'physicalAbsencesIncludingConfirmedTimeline':16,'timeline':'docs/RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_61_CROZAT_NAV_INHIBITION.md','currentCanonicalInputCount':2585,'requiredExactCoreAdditions':16,'projectedCanonicalInputCountNoOtherNewAdmissions':2601,'actualSourceWorkbookRead':{'physicalFiles':26,'retained':26,'selected':25,'legacyRetained':24,'legacySelected':23,'newSeparateNaVFiles':2,'soleUnselected':[56062547,'INa.xlsx'],'method':'full4096 positioned SHA256 and publisherMD5 with fstat epoch stability'},'existing2115Rows220GroupsAndNew84RowsSeparate':True,'allInheritedCoreAddonCorrectionTwoPeerReadinessPinsExact':True,'acceptedI60RequiredBeforeIntake':{'memberCount':64,'receiptAndZIPAndFinalCanonicalEpochAndIndependentPreservationRequired':True,'actualAcceptanceCurrentlyAvailable':os.path.lexists(root/'docs/qa/2026-10-05-implementation-60/accepted-i60-owned-and-layout-checkpoint.json'),'missingAcceptanceGuardActualExitCode':2,'noIntakePASSOrZIPGeneratedOnRefusal':True},'actualPrepareExitCode':0,'originalFirstGuardFailuresRetained':2,'exactScopedHelperRepairs':'Old/new source key union exact3field delta; nonowned old source assets read root rather than shadow symlinks. All SHA/symlink/source-unit guards retained.','realIntakeExecuted':False,'wholeCanonicalCorpusCheckedDuringPreparation':False,'rootWrites':0,'stageWrites':0,'candidateWrites':0,'patchApplyExecuted':False,'networkBrowserServerOperations':0,'scienceCountsPromoted':False,'fullGoalComplete':False}
f=p/'I61_REAL_INTAKE_PREPARATION_SEAL.json';f.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
for v in [f,p/'prepare_i61_real_root_intake.py',p/'I61_REAL_INTAKE_PREPARATION.json']:print(json.dumps(pin(v)))
