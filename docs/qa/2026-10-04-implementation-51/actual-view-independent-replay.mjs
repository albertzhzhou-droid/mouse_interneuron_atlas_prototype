import fs from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { readVerifiedMainSceneMorphology } from '/private/tmp/ohri-i51-verification/app/main-scene-morphology-verification.js';
import { validateMainSceneSourceViewReplay, assertMainSceneSourceViewApplied } from '/private/tmp/ohri-i51-verification/app/main-scene-source-view.js';
const root='/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const qa=root+'/docs/qa/2026-10-04-implementation-51';
const pack=JSON.parse(fs.readFileSync(root+'/data/pv-independent-morphology-routes-0.1.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const names=['actual-main-view-170034.json','actual-main-view-118824.json','actual-main-view-170034-restored-390.json','actual-main-view-118824-restored-390.json'];
const results=[];const docs=new Map();
for(const name of names){
 const b=fs.readFileSync(qa+'/'+name),d=JSON.parse(b);docs.set(name,d);
 const record=pack.routes.find(r=>r.sourceRecord.neuronId===d.source.neuronId).fidelityRecord;
 const geometry=await readVerifiedMainSceneMorphology(record,{forceReload:true,fetchImpl:async url=>{const v=fs.readFileSync(root+'/public'+url);return {ok:true,status:200,arrayBuffer:async()=>v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength)}}});
 validateMainSceneSourceViewReplay(record,geometry,d,'185');
 for(const p of d.rendererBuild.inputs){const v=fs.readFileSync(root+'/'+p.path);assert.equal(v.length,p.bytes,p.path);assert.equal(hash(v),p.sha256,p.path);const t=fs.readFileSync('/private/tmp/ohri-i51-verification/'+p.path);assert.equal(hash(t),p.sha256,p.path);}
 for(const p of d.auxiliaryAssets){const v=fs.readFileSync(root+'/public'+p.path);assert.equal(v.length,p.bytes,p.path);assert.equal(hash(v),p.sha256,p.path);}
 results.push({file:name,bytes:b.length,sha256:hash(b),neuronId:d.source.neuronId,mode:d.view.request.mode,buildInputCount:d.rendererBuild.inputs.length,actualGeometryBytes:d.source.bytes,sourceSha256:d.source.sha256,auxiliaryFileCount:d.auxiliaryAssets.length,cacheMode:d.geometryVerification.requestCacheMode,verifiedAt:d.geometryVerification.verifiedAt,mainSceneVerificationSequence:d.geometryVerification.mainSceneVerificationSequence,viewport:d.view.viewport,sourceIdentityPhysicalCell:d.sourceContext.sourceIdentity.nodes.cell.status,registrationCount:d.scientificScope.registrationCount});
}
for(const id of [170034,118824]){
 const a=docs.get('actual-main-view-'+id+'.json'),b=docs.get('actual-main-view-'+id+'-restored-390.json');
 assert.equal(assertMainSceneSourceViewApplied(a,b),true);assert.equal(b.geometryVerification.requestCacheMode,'no-store');assert.ok(b.geometryVerification.mainSceneVerificationSequence>a.geometryVerification.mainSceneVerificationSequence);assert.notEqual(b.geometryVerification.verifiedAt,a.geometryVerification.verifiedAt);
}
const out={scope:'four actual final-build DOM captures independently replayed against current private geometry producer and actual source/build/auxiliary bytes',receipts:results,buildPinChecks:results.reduce((n,r)=>n+r.buildInputCount,0),geometryChecks:results.length,auxiliaryFileChecks:results.reduce((n,r)=>n+r.auxiliaryFileCount,0),sameSourceRestoredPairs:2,mismatchCount:0};
fs.writeFileSync(qa+'/actual-view-independent-replay.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
