import datetime,json,pathlib
from replay import *
ROOT=pathlib.Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
paths=['data/research-source-registry-0.1.json','data/research-model-upgrade-registry-0.1.json','data/garcia-ramirez-adult-spinal-physiology-0.1.json','data/crozat-experiment-family-observations-0.1.json','data/crozat-nav-inhibition-information-0.1.json','data/source-candidates/crozat-experiment-families-20260930/download-receipt.json','data/source-candidates/crozat-nav-inhibition-20261004/crozat-nav-inhibition-inputs-manifest-0.1.json']
pins=[pin(ROOT/p) for p in paths]
registry,upgrades,garcia,crozat,nav,receipt,navinputs=[strict_load(ROOT/p) for p in paths]
check(len(registry['sources'])==32 and sum(len(s['recordSets']) for s in registry['sources'])==42,'current source/set denominators changed')
gs=one_source(registry,GAR);cs=one_source(registry,CRO);rs=one_set(gs,GSET)
check(len(gs['assets'])==4 and len(cs['assets'])==6,'information asset inventories changed')
check(rs['includedRecordCount']['value']==1 and rs['includedRecordCount']['unit']=='study_aggregate_information_adapters','aggregate adapter count/unit changed')
check(rs['sourceInformationRef']=={'status':'bundled_aggregate_information','path':'data/garcia-ramirez-adult-spinal-physiology-0.1.json','idField':'adapterId','href':'/explore/cell-types/additional#garcia-ramirez-physiology-panel'},'information source/ref changed')
check([u['count'] for u in gs['experimentalUnits']]==[171,51,6,60,28],'independent recorded/animal/subset unit counts changed')
check([u['count'] for u in cs['experimentalUnits']]==[1,65,654],'Crozat original unit counts changed')
check(rs['alternativePartitions'][0]['groupCounts']==[143,28] and all(sum(p['groupCounts'])==171 for p in rs['alternativePartitions']),'partition denominator pooled')
check(gs['experimentalUnits'][0]['cellToAnimalMapping'] is None and gs['experimentalUnits'][0]['independentAnimalCount'] is None,'unknown cell/animal identity filled')
check(gs['experimentalUnits'][3]['parentDenominatorId']==gs['experimentalUnits'][0]['denominatorId'] and gs['experimentalUnits'][4]['parentDenominatorId']==gs['experimentalUnits'][1]['denominatorId'],'prior-study subsets added as independent cohorts')
check(all(v==0 for k,v in rs['admissionBoundary'].items() if k in ['newMolecularProfiles','newPhysicalCellRosterRows','newObservedGeometryObjects','sameCellCrossSourceJoins','registrations','M2Admission','M4Admission']),'source information promoted scientific admissions')
oldids={f['sourceFile']['fileId'] for f in crozat['families']};newids={t['fileId'] for t in nav['tables']};retained={r['fileId'] for r in receipt if r.get('fileName','').endswith('.xlsx')}|newids
check(len(oldids)==23 and len(oldids|newids)==25 and len(retained)==26 and retained-(oldids|newids)=={56062547},'selected vs retained workbook scope changed')
check(crozat['summary']['adapterTableCount']==23 and crozat['summary']['observationRowCount']==2115 and crozat['summary']['completeWithinTablePairGroupCount']==220,'old experiment family scope changed')
check(nav['summary']['sourceObservationRowCount']==84 and nav['summary']['densityObservationRows']==56 and nav['summary']['percentageObservationRows']==28,'new additional source rows changed')
check(not any('sourceInformationRef' in s for s in cs['recordSets']),'Crozat acquired Garcia information adapter')
tables={f'ST{i+1}':t for i,t in enumerate(garcia['tables'])}
check(len(tables)==4 and sum(len(t['propertyRows']) for t in tables.values())==48,'current destination source table scope changed')
fixture={'iteration':'I62','mode':'PREPARATION_LITERAL_SOURCE_REFERENCE_NOT_NATIVE','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'registry':registry,'sourcePins':pins,'expectedDossiers':{s:expected_dossier(registry,upgrades,s) for s in [GAR,CRO]},'garciaTables':tables,'sourceScope':{'canonicalSources':32,'canonicalRecordSets':42,'Garcia':{'adapters':1,'sourceAssetMetadataPins':4,'recordedObservations':171,'separateAnimalCohorts':[51,6],'priorStudyRecordedSubset':60,'priorStudyMiceSubset':28,'alternativeGroupPartitions':[[143,28],[88,49,24,10],[23,11,68,69],[15,20,32,25,27,52]],'sourceRecordedObservationPoolCount':1,'independentAnimalCount':None,'cellToAnimalMapping':None},'Crozat':{'profileCount':1,'firingPatternCells':65,'passivePropertyObservations':654,'oldSourceTables':23,'oldRows':2115,'oldCompleteWithinTableGroups':220,'additionalDensityRows':56,'additionalPercentageRows':28,'additionalRows':84,'selectedWorkbooks':25,'retainedWorkbooks':26,'unselectedWorkbookId':56062547,'sourceAssets':6,'GarciaInformationActionCount':0}},'scope':'Literal current registry, upgraded route destination facts and linked upgrade records; no original parser/network/file landing/render proof repeated.'}
target=HERE/'I62_LITERAL_SOURCE_REFERENCE_FIXTURE.json';target.write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
for p in pins:pinned(p)
draft={'iteration':'I62','parentActualReady':False,'parentActualReadyUTC':None,'actualClockAuthority':'original_raw_tool_brackets_only','fixture':pin(target),'captures':[],'exports':[],'landingAuthority':None,'scope':'PREPARED ONLY. Parent ACTUAL_READY and immutable original raw captures plus independently attributed two sealed temp file copies required before actual replay.'}
(HERE/'I62_ACTUAL_REPLAY_MANIFEST_DRAFT_NOT_READY.json').write_text(json.dumps(draft,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'fixture':pin(target),'sourcePins':len(pins),'mode':'PREPARATION_ONLY','scope':fixture['sourceScope']},indent=2))
