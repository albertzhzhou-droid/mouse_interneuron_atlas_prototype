import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import contract from '../data/comparative-swc-reference-0.1.json' with {type:'json'};
import { createComparativeSwcReferenceIndex, loadComparativeSwcReference, assertVerifiedComparativeSwcPayload, comparativeSwcNodesCsv } from '../app/comparative-swc-reference.js';
import { COMPARATIVE_SWC_VIEW_BUILD, exportComparativeSwcView, validateComparativeSwcViewReplay, assertComparativeSwcViewApplied } from '../app/comparative-swc-view-replay.js';
import { comparativeSwcPngCaptions, appendComparativeSwcPng } from '../app/comparative-swc-png-export.js';
const root=new URL('../',import.meta.url),index=createComparativeSwcReferenceIndex(structuredClone(contract)),version='2.91.0-research.1';
const calls=[];
async function sourceFetch(path,options){calls.push({path,cache:options.cache});return new Response(await readFile(new URL('public'+path,root)));}
const payloads=await Promise.all(index.objects.map(object=>loadComparativeSwcReference(object,{fetchImpl:sourceFetch})));
function view(object,revision=1,hidden=false){const m=object.context.computedFromExactSwc;return {key:object.key,revision:`${object.key}:${revision}:actual1`,verificationRevision:revision,representation:'comparative_swc',status:'rendered',layers:[{id:'source-swc-centerline',requested:!hidden,actual:!hidden}],camera:{position:[230,190,300],target:[0,0,0],up:[0,1,0],projection:'perspective',fov:38,near:.1,far:4000},displayTransform:{centerNative:m.boundsMicrometre.min.map((x,i)=>(x+m.boundsMicrometre.max[i])/2),scale:200/Math.max(...m.extentMicrometre),coordinateFrame:object.coordinateFrame},renderer:{name:'three',version:'185',width:600,height:400},clipping:{globalPlanes:[],localClippingEnabled:false},loadMilliseconds:1,renderMilliseconds:2};}
const options=i=>({index,payload:payloads[i],applicationVersion:version,rendererVersion:'185'});
const document=i=>exportComparativeSwcView(index,index.objects[i].key,payloads[i],view(index.objects[i]),version,1);
function crc(bytes){let value=0xffffffff;for(const byte of bytes){value^=byte;for(let j=0;j<8;j++)value=(value>>>1)^(value&1?0xedb88320:0);}return(value^0xffffffff)>>>0;}
function chunk(kind,payload){const bytes=new Uint8Array(payload.length+12),data=new DataView(bytes.buffer);data.setUint32(0,payload.length);bytes.set(new TextEncoder().encode(kind),4);bytes.set(payload,8);data.setUint32(bytes.length-4,crc(bytes.slice(4,-4)));return bytes;}
function png(width=600,height=450){const header=new Uint8Array(13),data=new DataView(header.buffer);data.setUint32(0,width);data.setUint32(4,height);header[8]=8;header[9]=6;return new Blob([new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IEND',new Uint8Array())],{type:'image/png'});}

test('38 specified source/renderer/identity/export/build inputs match actual bytes and hashes',async()=>{
 assert.equal(COMPARATIVE_SWC_VIEW_BUILD.inputs.length,38);
  for (const path of ['app/ResearchCollectionPage.tsx', 'app/ResearchRoutePage.tsx', 'app/SiteNavigation.tsx', 'app/site-navigation.ts', 'app/site-navigation.css', 'app/research-pages.css']) {
    assert.equal(COMPARATIVE_SWC_VIEW_BUILD.inputs.filter(row => row.path === path).length, 1, `Navigation input ${path} must be pinned exactly once`);
  }
 assert.ok(COMPARATIVE_SWC_VIEW_BUILD.inputs.some(row=>row.path==='app/academic-interface.css'));
 for(const row of COMPARATIVE_SWC_VIEW_BUILD.inputs){const b=await readFile(new URL(row.path,root));assert.equal(b.length,row.bytes,row.path);assert.equal(createHash('sha256').update(b).digest('hex'),row.sha256,row.path);}
});
test('actual native payloads and every geometry/node row are immutable; cloned declarations cannot export',()=>{
 for(let i=0;i<2;i++){const object=index.objects[i],payload=payloads[i];assert.ok(Object.isFrozen(payload.edges[0][0]));assert.ok(Object.isFrozen(payload.rawNodes[0]));assert.throws(()=>{payload.rawNodes[0][5]=100;},TypeError);assert.equal(assertVerifiedComparativeSwcPayload(object,payload).requestCacheMode,'default');assert.throws(()=>assertVerifiedComparativeSwcPayload(object,structuredClone(payload)),/private source-byte proof/);assert.throws(()=>comparativeSwcNodesCsv(object,structuredClone(payload)),/private source-byte proof/);assert.throws(()=>exportComparativeSwcView(index,object.key,structuredClone(payload),view(object),version,1),/private source-byte proof/);}
});
test('fresh replay uses all three no-store requests and checks actual pose/layers while adapting current events and raster sizes',async()=>{
 for(let i=0;i<2;i++){const object=index.objects[i],saved=document(i),prior=payloads[i];saved.verification.runtimeVerification.verificationSequence=9000;const current=await loadComparativeSwcReference(object,{fetchImpl:sourceFetch,forceReload:true});assert.deepEqual(calls.slice(-3).map(x=>x.cache),['no-store','no-store','no-store']);const actual=view(object,2);actual.renderer.width=324;actual.renderer.height=260;assert.equal(assertComparativeSwcViewApplied(index,saved,current,actual,version,prior,2),true);const wrong=view(object,2);wrong.camera.position[0]+=1;assert.throws(()=>assertComparativeSwcViewApplied(index,saved,current,wrong,version,prior,2),/actual restored camera/);const hidden=view(object,2,true);assert.throws(()=>assertComparativeSwcViewApplied(index,saved,current,hidden,version,prior,2),/actual restored layers/);assert.throws(()=>assertComparativeSwcViewApplied(index,saved,prior,view(object),version,prior,1),/freshly recheck/);}
});
test('changed specified build, invalid saved events or a historical schema cannot become a current view',()=>{
 const saved=document(0);for(const change of [d=>{d.rendererBuild.inputs[0].sha256='0'.repeat(64);},d=>{d.verification.runtimeVerification.verifiedAt='invalid';},d=>{d.verification.runtimeVerification.requestCacheMode='cached-fallback';},d=>{delete d.comparativeViewSchemaVersion;}]){const copy=structuredClone(saved);change(copy);assert.throws(()=>validateComparativeSwcViewReplay(index,copy,payloads[0],version,'185'),/build changed|event is invalid/);}
});
test('source PNG captions retain exact species/identity/No Diameter and all unresolved rat assertions',()=>{
 const fish=comparativeSwcPngCaptions(document(0),options(0)).join('\n'),rat=comparativeSwcPngCaptions(document(1),options(1)).join('\n');assert.match(fish,/No Diameter/);assert.match(fish,/no soma or dendrites/);assert.match(fish,/zebrafish/);assert.match(rat,/L420-LCN to paper L420_E2/);assert.match(rat,/23 contours averaged into 23 soma points; exact SWC has 12 type-1 nodes/);assert.match(rat,/Historical morphometry/);assert.match(rat,/Unknown physical specimen/);assert.match(rat,/not a biological measurement/);
});
test('PNG metadata retains source camera/layers and zero membrane/internal/same-cell/registration authority with valid text CRC',async()=>{
 for(let i=0;i<2;i++){const saved=document(i),blob=await appendComparativeSwcPng(png(),saved,options(i)),bytes=new Uint8Array(await blob.arrayBuffer()),data=new DataView(bytes.buffer),texts={};let offset=8;
  while(offset<bytes.length){const n=data.getUint32(offset),kind=new TextDecoder().decode(bytes.slice(offset+4,offset+8));assert.equal(data.getUint32(offset+8+n),crc(bytes.slice(offset+4,offset+8+n)));if(kind==='iTXt'){const value=bytes.slice(offset+8,offset+8+n),nullIndex=value.indexOf(0);texts[new TextDecoder().decode(value.slice(0,nullIndex))]=JSON.parse(new TextDecoder().decode(value.slice(nullIndex+5)));}offset+=n+12;}
  assert.deepEqual(texts['ohri-source-view'],saved);const meta=texts['ohri-png-export'];assert.deepEqual(meta.captureAuthority.camera,saved.view.camera);assert.deepEqual(meta.captureAuthority.layers,saved.view.layers);for(const name of ['membraneSurfaces','internalObjects','sameCellJoins','mouseCensusAdditions','registrations'])assert.equal(meta.captureAuthority[name],0);assert.equal(meta.captureAuthority.radiusSurfaceAdmitted,false);assert.equal(meta.captureAuthority.allSourceEdgesInFrustumEstablished,false);assert.equal(meta.replay.freshSourceCacheMode,'no-store');assert.deepEqual(meta.image,{format:'image/png',width:600,height:450});
 }
});
test('foreign/stale source events, changed raster dimensions and missing disclosure footer cannot export PNG',async()=>{
 const saved=document(0),copy=structuredClone(saved);copy.verification.runtimeVerification.verificationSequence++;assert.throws(()=>comparativeSwcPngCaptions(copy,options(0)),/current private source verification event/);assert.throws(()=>comparativeSwcPngCaptions(saved,options(1)),/current source loader/);await assert.rejects(appendComparativeSwcPng(png(601,450),saved,options(0)),/raster dimensions/);await assert.rejects(appendComparativeSwcPng(png(600,400),saved,options(0)),/footer/);
});
test('failed fresh checksum or aborted reads cannot produce a substitute or reusable source payload',async()=>{
 const object=index.objects[0];await assert.rejects(loadComparativeSwcReference(object,{forceReload:true,fetchImpl:async path=>{const b=new Uint8Array(await readFile(new URL('public'+path,root)));b[100]^=1;return new Response(b);}}));const controller=new AbortController();controller.abort();await assert.rejects(loadComparativeSwcReference(object,{signal:controller.signal,forceReload:true,fetchImpl:sourceFetch}),/cancelled/);const recovered=await loadComparativeSwcReference(object,{forceReload:true,fetchImpl:sourceFetch});assert.equal(assertVerifiedComparativeSwcPayload(object,recovered).requestCacheMode,'no-store');assert.equal(recovered.edges.length,3848);
});
