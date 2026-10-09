import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ROOT='/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const OUT='/private/tmp/ohri-i55-final-preservation-20261004';
const read=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const {getSourceRecordSetNavigation,sourceDrilldownReceipt}=await import(pathToFileURL(path.join(ROOT,'app/research-source-drilldown.js')));
const {INDEPENDENT_OBJECT_VIEW_INDEX}=await import(pathToFileURL(path.join(ROOT,'app/independent-source-object-view.js')));
const {readIndependentSourceLocation}=await import(pathToFileURL(path.join(ROOT,'app/independent-source-workspace-state.js')));
const {loadVerifiedSupplementalMorphologyResearchRecords}=await import(pathToFileURL(path.join(ROOT,'app/research-supplemental-morphology-records.js')));
const registry=read('data/research-source-registry-0.1.json'), index=read('public/data/research_explorer_index_v1/search-index.json');
const supplements=await loadVerifiedSupplementalMorphologyResearchRecords();
const allRecords=[...index.records,...supplements], profileIds=new Set(allRecords.filter(x=>x.focusKind==='molecular_profile').map(x=>x.focusId)), morphologyIds=new Set(allRecords.filter(x=>x.focusKind==='morphology_record').map(x=>x.focusId));
const sets=registry.sources.flatMap(source=>source.recordSets.map(recordSet=>({sourceId:source.id,recordSetId:recordSet.recordSetId,recordSet,navigation:getSourceRecordSetNavigation(source.id,recordSet.recordSetId,recordSet)})));
const available=sets.filter(x=>x.navigation.status==='available'), actions=available.flatMap(x=>x.navigation.entries), rows=[], classes={profiles:0,morphology:0,objects:0,collectionOrDownload:0};
for(const set of sets){const receipt=sourceDrilldownReceipt(set.sourceId,set.recordSetId);
 assert.deepEqual(receipt.includedRecordCount,set.recordSet.includedRecordCount);assert.equal(receipt.unitOfObservation,set.recordSet.unitOfObservation);assert.equal(receipt.sourceBytesVerifiedByThisReceipt,false);assert.equal(receipt.renderedViewCaptured,false);assert.equal(receipt.newAdmissionCount,0);assert.equal(receipt.crossSourceIdentityJoinCount,0);assert.equal(receipt.registrationCount,0);
 if(set.navigation.status==='unavailable'){assert.deepEqual(set.navigation.entries,[]);assert.equal(set.navigation.reason,set.recordSet.childRosterRef.missingReason);}
}
for(const action of actions){const url=new URL(action.href,'http://localhost');let kind;
 if(url.searchParams.get('focusKind')==='molecular_profile'){kind='profiles';assert(profileIds.has(url.searchParams.get('focusId')));assert.equal(url.pathname,'/explore/cell-types');}
 else if(url.searchParams.get('focusKind')==='morphology_record'){kind='morphology';assert(morphologyIds.has(url.searchParams.get('focusId')));assert.equal(url.pathname,'/workspace');assert.equal(url.searchParams.get('observedForm'),'1');assert.equal(url.searchParams.get('view'),'cell_detail');assert.equal(url.searchParams.get('panel'),'structure');}
 else if(url.pathname==='/objects'){kind='objects';const state=readIndependentSourceLocation(INDEPENDENT_OBJECT_VIEW_INDEX,action.href);assert.equal(state.error,null);assert.equal(state.key,url.searchParams.get('sourceObject'));assert.equal(state.sourceId,url.searchParams.get('objectSource'));}
 else {kind='collectionOrDownload';assert(['/explore/morphology/viewer','/explore/cell-types','/explore/positions'].includes(url.pathname)||action.download===true);if(action.download)assert(url.pathname.startsWith('/data/'));}
 classes[kind]++;rows.push({sourceId:action.sourceId,recordSetId:action.recordSetId,id:action.id,href:action.href,kind,exactExistingDestinationContract:true,destinationSourceByteOrRenderProofClaimed:false});
}
const nav=(sourceId,recordSetId)=>getSourceRecordSetNavigation(sourceId,recordSetId);
const census=nav('SRC-NEUROMORPHO-8-6-124','RS-NEUROMORPHO-RECONSTRUCTIONS');assert.equal(census.includedRecordCount.value,142);assert.equal(census.entries.length,1);
const glut=nav('SRC-CANOGOMEZ-2026','RS-CANOGOMEZ-GLUT-ACTIVE-IDENT-LABELS');assert.equal(glut.includedRecordCount.value,277);assert.equal(glut.entries.length,2);assert.equal(new URL(glut.entries[0].href,'http://localhost').searchParams.has('focusKind'),false);assert.match(glut.entries[1].label,/92,782/);assert.equal(glut.entries[1].download,true);
const positions=nav('SRC-RONZANO-2022-81976','RS-RONZANO-PREMOTOR-POSITIONS');assert.equal(positions.includedRecordCount.value,31878);assert.deepEqual(positions.entries.map(x=>new URL(x.href,'http://localhost').searchParams.get('positionFrame')),['raw','normalized']);
const result={status:'PASS',scope:'Declared metadata navigation destinations only, existing scientific receiver gates keep authority',generatedAt:new Date().toISOString(),root:ROOT,sharedRootWrites:0,currentStoredIndexRecords:index.records.length,supplementalExistingRecords:supplements.length,runtimeExistingRecords:allRecords.length,sourceCount:registry.sources.length,recordSetCount:sets.length,bundledRosters:sets.filter(x=>x.recordSet.childRosterRef.status==='bundled_exact').length,bundledObjects:sets.filter(x=>x.recordSet.sourceObjectSetRef?.status==='bundled_exact').length,availableRecordSets:available.length,navigationActions:actions.length,actionClasses:classes,newAdmissions:0,exactCrossSourceIdentities:0,registrations:0,allReceiptsMetadataOnly:true,observationalUnits:{censusRecords142_navigationActions1:true,GLUTAggregateLabels277_AssignmentRows92782_Separate:true,RonzanoRaw14484_Normalized17394_NotJoined:true,nativeBase5_Delta2_InActualMerged04Keys:true,MICrONSParentAndNucleusSeparate:true,BANCOneNeuronRootNotSkeletonMemberOrNucleusSecondCell:true},rows};
assert.equal(result.sourceCount,31);assert.equal(result.recordSetCount,41);assert.equal(result.bundledRosters,13);assert.equal(result.bundledObjects,4);assert.equal(result.availableRecordSets,15);assert.equal(result.navigationActions,274);assert.deepEqual(classes,{profiles:219,morphology:40,objects:10,collectionOrDownload:5});assert.equal(index.records.length,641);assert.equal(supplements.length,32);
fs.writeFileSync(path.join(OUT,'I55_DESTINATION_METADATA_AUTHORITY.json'),JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({status:result.status,sourceCount:result.sourceCount,recordSetCount:result.recordSetCount,available:result.availableRecordSets,actions:result.navigationActions,classes,records:result.runtimeExistingRecords,proofClaim:'metadata_only'},null,2)+'\n');
