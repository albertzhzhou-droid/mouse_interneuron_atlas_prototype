from pathlib import Path
import json,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,'/private/tmp/ohri-i62-exact-native-dossier-landing-20261005')
from source_epoch_guard import exact_read,strict_json,epoch
observed={};fail=[];pins=[]
def load(q):
 pin,b=exact_read(q,observed,fail,True);pins.append({'path':str(q),**pin});return strict_json(b)
def eq(a,b):
 assert type(a) is type(b)
 if isinstance(a,dict):
  assert set(a)==set(b)
  for k in a:eq(a[k],b[k])
 elif isinstance(a,list):
  assert len(a)==len(b)
  for x,y in zip(a,b):eq(x,y)
 else:assert a==b
f=load(HERE/'I62_LITERAL_SOURCE_REFERENCE_FIXTURE.json')
root=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
r=load(root/'data/research-source-registry-0.1.json');u=load(root/'data/research-model-upgrade-registry-0.1.json');g=load(root/'data/garcia-ramirez-adult-spinal-physiology-0.1.json')
# Small derived context only; no original XLSX/parser or all7 source rehash.
eq(f['registry'],r)
assert len(r['sources'])==32 and sum(len(x['recordSets']) for x in r['sources'])==42
for sid in ['SRC-GARCIA-RAMIREZ-2022','SRC-CROZAT-2025']:
 s=next(x for x in r['sources'] if x['id']==sid);d=f['expectedDossiers'][sid]
 assert set(d)=={'registryReleaseId','researchUpgradeRegistryId','exportedAt','source','recordSetNavigation','linkedResearchUpgrades','scientificPolicy'}
 eq(d['source'],s);eq(d['scientificPolicy'],r['scientificPolicy'])
 assert d['registryReleaseId']==r['releaseId'] and d['researchUpgradeRegistryId']==u['registryId'] and d['exportedAt'] is None
 linked=[]
 for i in s['linkedUpgradeIds']:
  rows=[x for x in u['upgrades'] if x['id']==i];assert len(rows)<=1;linked.append(rows[0] if rows else {'id':i,'resolutionStatus':'unresolved'})
 eq(d['linkedResearchUpgrades'],linked)
 assert len(d['recordSetNavigation'])==len(s['recordSets'])
 for nav,rs in zip(d['recordSetNavigation'],s['recordSets']):
  for k in ['recordSetId','recordKind','unitOfObservation','includedRecordCount']:eq(nav[k],rs[k])
  eq(nav['reference'],rs['childRosterRef']);eq(nav['sourceCitation'],s['citation']);eq(nav['rights'],s['rights'])
  assert nav['authority']=='declared_metadata_navigation_only' and nav['sourceId']==sid and nav['status']=='unavailable' and nav['entries']==[]
  assert all(type(nav[k]) is int and nav[k]==0 for k in ['newAdmissionCount','crossSourceIdentityJoinCount','registrationCount'])
  assert nav['renderedViewCaptured'] is False and nav['sourceBytesVerifiedByThisReceipt'] is False
for t in g['tables']:
 key=t['id'].rsplit(':',1)[1];assert key in f['garciaTables'];eq(f['garciaTables'][key],t)
 assert sum(x['recordedObservationCount'] for x in t['groups'])==171
assert f['sourceScope']['Garcia']['recordedObservations']==171
assert f['sourceScope']['Garcia']['separateAnimalCohorts']==[51,6]
assert f['sourceScope']['Garcia']['priorStudyRecordedSubset']==60 and f['sourceScope']['Garcia']['priorStudyMiceSubset']==28
assert f['sourceScope']['Garcia']['independentAnimalCount'] is None and f['sourceScope']['Garcia']['cellToAnimalMapping'] is None
c=f['sourceScope']['Crozat'];assert (c['selectedWorkbooks'],c['retainedWorkbooks'],c['unselectedWorkbookId'])==(25,26,56062547)
assert (c['profileCount'],c['firingPatternCells'],c['passivePropertyObservations'])==(1,65,654)
assert (c['oldSourceTables'],c['oldRows'],c['oldCompleteWithinTableGroups'])==(23,2115,220)
assert (c['additionalDensityRows'],c['additionalPercentageRows'],c['additionalRows'])==(56,28,84)
for q,e in observed.items():assert epoch(q.stat())==e
out={'status':'PASS_BOUNDED_CURRENT_DERIVED_LITERAL_CONTEXT_AND_SCIENTIFIC_DENOMINATORS','inputPins':pins,'sourceScopes':f['sourceScope'],'wholeRegistryLiteralExact':True,'linkedUpgradeLiteralExact':True,'fourPublishedTablesLiteralExact':True,'strictEpochRefusals':fail,'endEpochsStable':True,'scope':{'smallDerivedContextFilesRead':3,'originalXLSXRead':0,'originalSourceParser':0,'all7ContextPinReplay':0,'futureActualCapturesRead':0,'DownloadsRead':0,'rootWrites':0,'ownerFolderWrites':0}}
with (HERE/'BOUNDED_CURRENT_SOURCE_LITERAL_CONTEXT_REVIEW.json').open('x') as h:json.dump(out,h,ensure_ascii=False,indent=2);h.write('\n')
print(out['status'])
