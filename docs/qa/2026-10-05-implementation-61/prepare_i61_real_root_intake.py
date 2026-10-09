#!/usr/bin/env python3
"""I61 preparation and real pre-apply intake guards; writes only its temp directory.
--prepare never attests accepted I60 or the whole current canonical corpus.
--intake refuses before source reads unless the final accepted64 checkpoint exists.
"""
from pathlib import Path
import argparse,collections,datetime,hashlib,io,json,os,re,subprocess,sys,zipfile
ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
OUT=Path(__file__).resolve().parent
CORE=Path('/private/tmp/ohri-crozat-nav-inhibition-candidate-20261004')
ADDON=Path('/private/tmp/ohri-i61-parent-addon-after-i59-20261005')
READY=Path('/private/tmp/ohri-i61-after-i59-queued-readiness-20261005')
MANIFEST='data/research-iteration-manifest-2.91.json'
RECIPE='tools/build_research_iteration_manifest_2_91.mjs'
RUNTIME='data/research-renderer-runtime-inputs-2.91.json'
ROOT_OWNED_EXTRAS=[RECIPE,'docs/UPGRADE_PLAN_2026-09-24.md','docs/GOAL_REQUIREMENT_AUDIT_2026-09-30.md',MANIFEST,RUNTIME,'package.json']
DEFAULT_ACCEPTED=ROOT/'docs/qa/2026-10-05-implementation-60/accepted-i60-owned-and-layout-checkpoint.json'
stats={'strategy':'full_file_os_pread4096_with_fstat_epoch','files':0,'bytes':0,'preadCalls':0}
epoch={}
def read(p,keep=True):
 p=Path(p);assert not p.is_symlink(),('Refuse leaf symlink',str(p))
 fd=os.open(p,os.O_RDONLY|os.O_NOFOLLOW);sha=hashlib.sha256();md5=hashlib.md5();parts=[];n=0
 try:
  a=os.fstat(fd)
  while True:
   b=os.pread(fd,4096,n);stats['preadCalls']+=1
   if not b:break
   n+=len(b);sha.update(b);md5.update(b)
   if keep:parts.append(b)
  z=os.fstat(fd);assert(a.st_ino,a.st_size,a.st_mtime_ns)==(z.st_ino,z.st_size,z.st_mtime_ns);assert n==a.st_size
 finally:os.close(fd)
 actual={'bytes':n,'sha256':sha.hexdigest()};stats['files']+=1;stats['bytes']+=n
 if p in epoch:assert epoch[p]==actual,('Input changed between reads',str(p))
 else:epoch[p]=actual
 return actual,b''.join(parts)if keep else None,md5.hexdigest()
def pin(r):return {k:r[k]for k in ('bytes','sha256')}
def load(p):return json.loads(read(p)[1])
def exact(p,r):
 actual=read(p,False)[0];assert actual==pin(r),('Exact descriptor mismatch',str(p));return {'path':str(p),'actual':actual,'exact':True}
def present(p):return os.path.lexists(p)
def relative(p):
 assert isinstance(p,str)and p and not Path(p).is_absolute()and '..'not in Path(p).parts
 return ROOT/p
def prepare_bindings():
 sealed=load(READY/'I61_QUEUED_AFTER_I59_READINESS_SEAL.json');assert sealed['status']=='SEALED_READ_ONLY_QUEUED_I61_AFTER_I59_READINESS'
 assert read(READY/'I61_QUEUED_AFTER_I59_READINESS_SEAL.json')[0]=={'bytes':4159,'sha256':'10faaeb75f1927ec9735acf9bb870b943bb0e627e3c9fe277e6197c14609370f'}
 bound=[exact(row['path'],row)for row in sealed['boundFiles']]
 ready=load(READY/'I61_QUEUED_AFTER_I59_READINESS.json');assert ready['status']=='PASS_QUEUED_I61_AFTER_I59_READINESS_NOT_FINAL_INTAKE'
 assert ready['existingTargets']==4 and ready['physicalAbsentTargets']==15 and ready['fullGoalComplete']is False
 bound+=[exact(row['path'],row['actual'])for row in ready['boundInheritedReceiptsAndLogs']]
 bound+=[exact(row['path'],row['actual'])for row in ready['coreExecutedValidationLogPinsRetained']]
 for field in ('coreSeal','afterI59AddonSeal','coreAdapterPeer'):bound.append(exact(ready[field]['path'],ready[field]['actual']))
 correction=ready['symlinkMistakeCorrection']['receipt'];bound.append(exact(correction['path'],correction['actual']))
 targets=[]
 for row in ready['owned19Targets']:
  rel=row['path'];root_path=relative(rel);proposal=(CORE if row in ready['owned19Targets'][:14] else ADDON)/'proposed'/rel
  assert proposal.resolve().is_relative_to((CORE/'proposed').resolve())or proposal.resolve().is_relative_to((ADDON/'proposed').resolve())
  actual=read(root_path,False)[0]if present(root_path)else None;assert actual==row['beforeActual'],('Current target preimage mismatch',rel)
  proposed=read(proposal,False)[0];assert proposed==row['proposedActual']
  targets.append({'path':rel,'operation':row['operation'],'beforeActual':actual,'proposalPath':str(proposal),'proposedActual':proposed,'physicalAbsent':actual is None})
 assert len(targets)==len({r['path']for r in targets})==19
 assert sum(r['beforeActual']is not None for r in targets)==4 and sum(r['physicalAbsent']for r in targets)==15
 for r in ready['symlinkMistakeCorrection']['currentThreeAbsences']:assert not present(relative(r['path'])),('Historical correction path resurfaced',r['path'])
 core_seal=load(ready['coreSeal']['path']);addon=load(ready['afterI59AddonSeal']['path'])
 patches=[core_seal['patch'],addon['patch']];bound.extend(exact(r['path'],r)for r in patches)
 assert pin(patches[0])=={'bytes':215165,'sha256':'5c32697e1089b86e058b2a451e648271a810991dd8684694b0b027bcc91e799d'}
 assert pin(patches[1])=={'bytes':37147,'sha256':'1214d386d772c3f90c398c23e8628468ba1de36e1f8f250b789524c9c22d9001'}
 return ready,targets,bound,patches

def source_scope(ready):
 old_path='data/crozat-experiment-family-observations-0.1.json';old=load(relative(old_path));new=load(CORE/'proposed/data/crozat-nav-inhibition-information-0.1.json')
 assert read(relative(old_path),False)[0]==ready['legacyInformationActual']
 assert read(CORE/'proposed/data/crozat-nav-inhibition-information-0.1.json',False)[0]==ready['additionalInformationActual']
 retained=[r for r in old['source']['receipts']if r.get('fileName','').endswith('.xlsx')];selected={f['sourceFile']['fileId']for f in old['families']};additional=[t['sourceFile']for t in new['tables']]
 assert len(retained)==24 and len(selected)==23 and [(r['fileId'],r['fileName'])for r in retained if r['fileId']not in selected]==[(56062547,'INa.xlsx')]
 assert {r['fileId']for r in additional}=={56062562,56062565}and len(retained+additional)==26
 assert old['summary']['adapterTableCount']==23 and old['summary']['observationRowCount']==2115 and old['summary']['completeWithinTablePairGroupCount']==220
 assert new['summary']=={'tableCount':2,'sourceObservationRowCount':84,'densityObservationRows':56,'percentageObservationRows':28,'depositWideUniqueCellCount':None,'animalMappedRowCount':0,'pairedRowCount':0,'newSourceProfiles':0,'newGeometryObjects':0,'newInternalObjects':0,'registrations':0}
 inventory={r['path']:r for r in ready['prior26PhysicalReceiptDescriptorPinsRetainedWithoutRereadingAllOriginals']};assert len(inventory)==26
 physical=[]
 for row in retained+additional:
  p=relative(row['path'])if row['fileId']in {r['fileId']for r in retained}else CORE/'proposed'/row['path']
  actual,_,md5=read(p,False);assert actual==pin(row)==pin(inventory[row['path']]);assert md5==row['publisherMd5']
  physical.append({'path':row['path'],'actualPathRead':str(p),'fileId':row['fileId'],'actual':actual,'publisherMd5':md5,'publisherMd5Exact':True,'legacySelected':row['fileId']in selected,'additionalSeparateNaV':row['fileId']in {56062562,56062565}})
 oldreg=load(relative('data/research-source-registry-0.1.json'));newreg=load(ADDON/'proposed/data/research-source-registry-0.1.json');a={r['id']:r for r in oldreg['sources']};b={r['id']:r for r in newreg['sources']}
 assert set(a)==set(b)and len(a)==32 and sum(len(r['recordSets'])for r in a.values())==42
 assert {k:v for k,v in oldreg.items()if k!='sources'}=={k:v for k,v in newreg.items()if k!='sources'}
 assert [key for key in a if a[key]!=b[key]]==['SRC-CROZAT-2025']
 assert {key for key in set(a['SRC-CROZAT-2025'])|set(b['SRC-CROZAT-2025'])if a['SRC-CROZAT-2025'].get(key)!=b['SRC-CROZAT-2025'].get(key)}=={'assets','admission','localWorkbookReadiness'}
 c=b['SRC-CROZAT-2025'];assert c['recordSets']==a['SRC-CROZAT-2025']['recordSets'];assert [(r['unit'],r['count'])for r in c['experimentalUnits']]==[('marker_defined_source_population',1),('firing_pattern_cell',65),('passive_property_observation',654)]
 s=c['localWorkbookReadiness'];assert [s[k]for k in ['selectedInformationWorkbookFiles','allRetainedOriginalWorkbookFiles','existingExperimentFamilyWorkbookFiles','additionalNaVInhibitionWorkbookFiles','retainedButUnselectedWorkbookFiles']]==[25,26,23,2,1]
 assert s['individualPhysicalCellDenominator']is None and s['individualAnimalMappingEstablished']is False
 assert all(s[k]==0 for k in ['crossExperimentFamilyJoins','crossWorkbookNaVRowPairing','newSourceProfiles','newExactCellRosterRows','newGeometryObjects','newInternalObjects','registrations'])
 assets=[]
 for asset in c['assets'][2:]:
  core_owned={row['path'] for row in ready['owned19Targets'][:14]}
  p=CORE/'proposed'/asset['path'] if asset['path'] in core_owned else relative(asset['path'])
  assets.append({'id':asset['id'],**exact(p,asset['integrity'])})
 return {'scope':ready['sourceUnitScope'],'actual26PhysicalWorkbookRead':physical,'fourOwnedSourceAssetExact':assets,'other31SourcesAndTopLevelExact':True,'publicOld2115AndNew84RemainSeparate':True,'scientificCompletionsPromoted':0}

def membership(manifest,targets,timeline):
 recipe=read(relative(RECIPE))[1].decode();coreblock=recipe.split('export const CORE_INPUTS_291 = Object.freeze([',1)[1].split(']);',1)[0]
 core={json.loads(v)for v in re.findall(r'"(?:[^"\\]|\\.)*"',coreblock)}
 fblock=recipe.split('const FAMILIES = Object.freeze([',1)[1].split(']);',1)[0];families=[(d,re.compile(pattern))for d,pattern in re.findall(r'\["([^"]+)", /([^\n]+?)/\]',fblock)]
 assert len(families)==5
 treeblock=recipe.split('for (const directory of [',1)[1].split(']) await addTree(directory);',1)[0];trees=[json.loads(v)for v in re.findall(r'"(?:[^"\\]|\\.)*"',treeblock)]
 current={r['path']for r in manifest['authoritativeInputs']};assert len(current)==len(manifest['authoritativeInputs'])
 def coverage(rel):
  if rel in core:return 'CORE_EXPLICIT_CURRENT'
  if any(Path(rel).parent.as_posix()==d and pattern.search(Path(rel).name)for d,pattern in families):return 'CURRENT_DIRECT_FAMILY'
  if any(rel.startswith(d+'/')for d in trees):return 'CURRENT_RECURSIVE_TREE'
  return 'REQUIRES_EXACT_CORE_ADDITION'
 rows=[{'path':r['path'],'beforeCanonical':r['path']in current,'recipeCoverageBefore':coverage(r['path']),'newPhysicalPath':r['physicalAbsent']}for r in targets]
 assert sum(r['beforeCanonical']for r in rows)==4
 assert all(r['recipeCoverageBefore']=='REQUIRES_EXACT_CORE_ADDITION'for r in rows if r['newPhysicalPath'])
 additions=[r['path']for r in rows if not r['beforeCanonical']]+[timeline]
 assert len(additions)==len(set(additions))==16
 return {'currentCanonicalInputCount':len(current),'targetMembership':rows,'timeline':{'path':timeline,'beforeCanonical':timeline in current,'recipeCoverageBefore':coverage(timeline),'physicalAbsent':not present(relative(timeline))},'requiredExactCorePaths':additions,'newCanonicalCandidatePaths':15,'newTimelineCanonicalPaths':1,'projectedCanonicalCountIfNoOtherAdmission':len(current)+16,'writeBuilderExecuted':False,'automaticFamilyAdditionsFor15NewTargets':0}

def accepted_gate(p):
 p=Path(p);assert p.resolve().is_relative_to((ROOT/'docs/qa/2026-10-05-implementation-60').resolve())
 if not present(p):raise RuntimeError('REFUSE_MISSING_FINAL_ACCEPTED_I60_CHECKPOINT: '+str(p))
 c=load(p);assert c['status']=='PASS_ACCEPTED_I60_CHECKPOINT'and c['fullGoalComplete']is False
 assert len(c['members'])==len({r['path']for r in c['members']})==64
 archive=relative(c['archive']['path']);exact(archive,c['archive']);assert archive.resolve().is_relative_to((ROOT/'docs/qa/2026-10-05-implementation-60').resolve())
 assert read(relative(MANIFEST),False)[0]==pin(c['canonicalEpoch'])
 independent=relative(c['independentPreservation']['path']);exact(independent,c['independentPreservation']);r=load(independent);assert r['status']=='PASS_I60_FINAL_LOCAL_SOURCE_PRESERVATION_ONLY'
 with zipfile.ZipFile(archive)as z:
  assert len(z.namelist())==64 and set(z.namelist())=={r['path']for r in c['members']}
  for row in c['members']:
   actual=read(relative(row['path']),False)[0];assert actual==pin(row);b=z.read(row['path']);assert {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}==pin(row)
 return {'receipt':exact(p,read(p,False)[0]),'archive':exact(archive,c['archive']),'memberCount':64,'everyArchiveBeforeByteAndCurrentRootMemberExact':True,'canonicalEpoch':c['canonicalEpoch'],'independentPreservation':c['independentPreservation'],'fullGoalComplete':False}

def main():
 a=argparse.ArgumentParser();g=a.add_mutually_exclusive_group(required=True);g.add_argument('--prepare',action='store_true');g.add_argument('--intake',action='store_true');a.add_argument('--accepted-i60',default=str(DEFAULT_ACCEPTED));a.add_argument('--timeline',required=True);v=a.parse_args();timeline=v.timeline
 assert Path(timeline).parent.as_posix()=='docs'and re.fullmatch(r'RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_61_[A-Z0-9_]+\.md',Path(timeline).name)
 accepted=accepted_gate(v.accepted_i60)if v.intake else None
 ready,targets,bound,patches=prepare_bindings();manifest=load(relative(MANIFEST));assert not present(relative(timeline)),('I61 timeline is no longer physically absent',timeline)
 assert read(relative('package.json'),False)[0]=={'bytes':40345,'sha256':'208fe6a1e92e9e2af82306d359ea5bb11226d27bcc701743bc8b9c9e9b50e585'}
 assert manifest['registrySummary']=={'canonicalSourceCount':32,'canonicalRecordSetCount':42,'bundledExactCellProfileRosterCount':13,'bundledExactSourceObjectSetCount':4,'sourceProfileCount':387,'researchUpgradeCount':243,'completedResearchUpgradeCount':83,'displayedResearchUpgradeCount':51,'staleCanonicalDenominatorLiteralCount':0}
 scope=source_scope(ready);coverage=membership(manifest,targets,timeline)
 current_manifest=read(relative(MANIFEST),False)[0];baseline=[]
 if v.intake:
  for r in manifest['authoritativeInputs']:baseline.append({'path':r['path'],**read(relative(r['path']),False)[0]});assert pin(baseline[-1])==pin(manifest['authoritativeInputs'][len(baseline)-1])
  assert all(pin(a)==pin(b)for a,b in zip(baseline,manifest['authoritativeInputs']))
 existing={r['path']for r in targets if r['beforeActual']is not None};existing.update(ROOT_OWNED_EXTRAS)
 preimages=[{'path':rel,'actual':read(relative(rel),False)[0]}for rel in sorted(existing)];assert len(preimages)==9
 absent=sorted([r['path']for r in targets if r['physicalAbsent']]+[timeline]);assert len(absent)==16 and all(not present(relative(rel))for rel in absent)
 root_extras_dedup=[r for r in ROOT_OWNED_EXTRAS if r not in {t['path']for t in targets}];assert len(root_extras_dedup)==5
 apply=None
 if v.intake:
  cp=subprocess.run(['git','apply','--check',*[r['path']for r in patches]],cwd=ROOT,text=True,capture_output=True);assert cp.returncode==0,cp.stderr;apply={'argv':['git','apply','--check',*[r['path']for r in patches]],'exitCode':cp.returncode,'applied':False}
 for row in targets:assert(read(relative(row['path']),False)[0]if present(relative(row['path']))else None)==row['beforeActual']
 assert read(relative(MANIFEST),False)[0]==current_manifest
 archive=None
 if v.intake:
  f=OUT/'I61_REAL_ROOT_INTAKE_PREIMAGES.zip';assert not present(f),'Preserve earlier intake preimages'
  with zipfile.ZipFile(f,'x',compression=zipfile.ZIP_DEFLATED)as z:
   for row in preimages:
    actual,b,_=read(relative(row['path']));assert actual==row['actual'];z.writestr(row['path'],b)
  archive={'path':str(f),**read(f,False)[0]}
 result={'status':'PASS_I61_REAL_PRE_APPLY_INTAKE_WITH_ACCEPTED_I60'if v.intake else'PREPARED_I61_REAL_INTAKE_GUARDS_NOT_EXECUTED_NOT_ACCEPTED_I60_PASS','increment':'I61','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'acceptedI60Checkpoint':accepted,'acceptedI60RequiredBeforeIntake':True,'acceptedI60MemberRequirement':64,'baselineCanonicalManifest':current_manifest,'baselineCanonicalInputCount':len(manifest['authoritativeInputs']),'allActualCanonicalFilesChecked':bool(v.intake),'baselineInputs':baseline,'candidateTargets':targets,'boundSealsCorrectionPeersAndValidationLogs':bound,'sourceUnitAndPhysicalInputs':scope,'manifestAdmissionPlan':coverage,'ownedPreimages':preimages,'preimagesArchive':archive,'physicalAbsences':absent,'rootOwnedExtrasAfter19TargetDeduplication':root_extras_dedup,'readOnlyPatchCheck':apply,'applyExecuted':False,'candidateWrites':0,'rootWrites':0,'stageWrites':0,'networkBrowserServerOperations':0,'scientificCompletionPromotion':0,'fullGoalComplete':False,'readContract':stats,'pending':['Parent final accepted I60 checkpoint and 64-member archive is required before intake.','Parent owns patch apply,16 exact CORE entries, package/runtime repins, source/fullresearch/native UI/exact exports and finalI61preservation.']if not v.intake else['Parent may apply core14+AFTER-I59addon5 only after reviewing this pre-apply intake; this is not post-intake/finalI61 evidence.']}
 f=OUT/('I61_REAL_ROOT_INTAKE.json'if v.intake else'I61_REAL_INTAKE_PREPARATION.json');f.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':result['status'],'receipt':str(f),'owned19':19,'existingPreimages':9,'physicalAbsences':16,'projectedInputs':coverage['projectedCanonicalCountIfNoOtherAdmission'],'allCurrentCanonicalScanned':bool(v.intake)},indent=2))
if __name__=='__main__':
 try:main()
 except Exception as e:
  print(type(e).__name__+': '+str(e),file=sys.stderr);sys.exit(2)
