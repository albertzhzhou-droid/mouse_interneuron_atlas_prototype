import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Matrix4, Quaternion, Vector3, REVISION } from "three";
import { NATIVE_CONTOUR_SOURCE_IDS, canonicalNativeContourSource, readVerifiedNativeContours, readVerifiedNativeContourShell, nativeContourVerification } from "../app/native-contour-verification.js";
import { nativeContourDisplayTransform } from "../app/neurolucida-native-contour-admission.js";
import { NATIVE_CONTOUR_VIEW_BUILD, nativeContourRenderedBounds, captureNativeContourSourceView, preflightNativeContourSourceView, validateNativeContourSourceViewReplay, assertNativeContourSourceViewApplied } from "../app/native-contour-source-view.js";

const clone = value => structuredClone(value);
const requests = [];
const fetchActual = async (url, init) => { requests.push({url,cache:init.cache});const b=await readFile(new URL(`../public${url}`,import.meta.url));return {ok:true,status:200,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}; };
const loaded = new Map();
for (const id of NATIVE_CONTOUR_SOURCE_IDS) {
  const contours=await readVerifiedNativeContours(id,{fetchImpl:fetchActual});
  const shell=id===50394?await readVerifiedNativeContourShell(id,contours,{fetchImpl:fetchActual}):null;
  loaded.set(id,{contours,shell});
}
function viewFor(id,contours,shell,{selected=null,isolate=false,primary=true,secondary=true,derived=Boolean(shell)}={}) {
  const bounds=nativeContourRenderedBounds(contours,shell),r=bounds.radius,target=new Vector3().fromArray(bounds.center),position=target.clone().add(new Vector3(r*1.4,r*.95,r*1.65)),up=new Vector3(0,1,0);
  const q=new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(position,target,up));
  const secondaryNames=new Set(canonicalNativeContourSource(id).record.viewer?.secondarySourceNames??[]);
  return {status:"rendered",runtimeBinding:{instanceId:"native-contour-runtime-1",revision:1},camera:{kind:"PerspectiveCamera",position:position.toArray(),target:target.toArray(),up:up.toArray(),quaternion:q.toArray(),fov:40,zoom:1,aspect:2,near:Math.max(r/500,.01),far:Math.max(r*40,100)},viewport:{cssWidth:800,cssHeight:400,drawingBufferWidth:800,drawingBufferHeight:400,pixelRatio:1},renderer:{engine:"THREE",revision:REVISION,type:"WebGLRenderer",outputColorSpace:"srgb",toneMapping:0,alpha:true,antialias:true},clipping:{globalPlanes:[],localClippingEnabled:false},layers:{showPrimary:primary,showSecondary:secondary,showDerivedSurface:derived,primaryVisible:primary,secondaryVisible:secondary,derivedSurfaceVisible:Boolean(shell&&derived&&!(isolate&&selected)),visibleContourIds:contours.contours.filter(c=>(secondaryNames.has(c.sourceName)?secondary:primary)&&(!isolate||!selected||c.id===selected)).map(c=>c.id),axesVisible:true,scaleGuideVisible:true},inspection:{selectedContourId:selected,isolateContour:isolate},displayTransform:nativeContourDisplayTransform(contours.contours),sceneBounds:bounds};
}
test("all seven actual native files retain 72 loops and 5149 vertices, private proof and unknown physical parents",async()=>{
  assert.equal(loaded.size,7);let loops=0,vertices=0;
  for(const [id,{contours,shell}] of loaded){
    loops+=contours.contours.length;vertices+=contours.summary.vertexCount;
    const proof=nativeContourVerification(id,contours,shell);assert.equal(proof.sourceGeometry.sha256,canonicalNativeContourSource(id).record.derivedObject.sha256);
    assert.equal(Object.isFrozen(contours.contours[0].points[0]),true);
    const doc=captureNativeContourSourceView(id,contours,shell,viewFor(id,contours,shell),REVISION);
    assert.equal(doc.source.identity.nodes.cell.status,"unknown");assert.equal(doc.source.scope.rawDatByteVerification,"verified_original_bytes_and_complete_parser_audit");assert.equal(doc.source.scope.observedMembraneCount,0);
    const locator=doc.source.identity.nodes.component.locator;
    const [path,fragment]=locator.split("#"),[field,exactId]=fragment.split("/");
    const admission=JSON.parse(await readFile(new URL(`../${path}`,import.meta.url),"utf8"));
    assert.equal(exactId,`neuronId=${id}`);assert.equal(admission[field].filter(row=>row.neuronId===id).length,1);
    assert.equal(doc.verification.derivedShell!==null,id===50394);
  }
  assert.equal(loops,72);assert.equal(vertices,5149);
});
test("copied, corrupted, truncated, cancelled or cross-record bytes never gain native or DER private proof",async()=>{
  const {contours,shell}=loaded.get(50394);
  assert.throws(()=>nativeContourVerification(50394,clone(contours),shell),/private/);
  assert.throws(()=>nativeContourVerification(50394,contours,clone(shell)),/proof/);
  assert.throws(()=>nativeContourVerification(50424,contours),/proof/);
  const fresh=await readVerifiedNativeContours(50394,{fetchImpl:fetchActual,forceReload:true});
  assert.throws(()=>nativeContourVerification(50394,fresh,shell),/current OBS/);
  for(const change of [b=>b.subarray(1),b=>{b[100]^=1;return b;}]){
    const bad=async url=>{const b=change(Buffer.from(await readFile(new URL(`../public${url}`,import.meta.url))));return {ok:true,status:200,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
    await assert.rejects(readVerifiedNativeContours(50394,{fetchImpl:bad}),/byte count|SHA-256/);
    await assert.rejects(readVerifiedNativeContourShell(50394,contours,{fetchImpl:bad}),/byte count|SHA-256/);
  }
  await assert.rejects(readVerifiedNativeContours(50394,{fetchImpl:async()=>({ok:false,status:404})}),/404/);
  const controller=new AbortController();controller.abort();await assert.rejects(readVerifiedNativeContours(50394,{fetchImpl:fetchActual,signal:controller.signal}),/cancelled/);
  const late=new AbortController();
  const cancelledBytes=async url=>{const response=await fetchActual(url,{cache:"no-store"});return {...response,arrayBuffer:async()=>{const bytes=await response.arrayBuffer();late.abort();return bytes;}};};
  await assert.rejects(readVerifiedNativeContours(50394,{fetchImpl:cancelledBytes,signal:late.signal}),/cancelled/);
  await assert.rejects(readVerifiedNativeContourShell(50424,loaded.get(50424).contours,{fetchImpl:fetchActual}),/no derived shell/);
});
test("source-backed trace selections, group visibility and isolation replay exactly for all seven sources",async()=>{
  for(const [id,{contours,shell}] of loaded){
    for(const options of [{},{selected:contours.contours[0].id,isolate:true},{primary:false,secondary:false}]){
      const view=viewFor(id,contours,shell,options),saved=captureNativeContourSourceView(id,contours,shell,view,REVISION);
      const fresh=await readVerifiedNativeContours(id,{fetchImpl:fetchActual,forceReload:true}),freshShell=shell?await readVerifiedNativeContourShell(id,fresh,{fetchImpl:fetchActual,forceReload:true}):null;
      const replay=validateNativeContourSourceViewReplay(saved,id,fresh,freshShell,REVISION),current=captureNativeContourSourceView(id,fresh,freshShell,replay.view,REVISION);
      assertNativeContourSourceViewApplied(saved,current);
      assert.equal(current.verification.fileManifest.requestCacheMode,"no-store");assert.equal(current.verification.originalDat.requestCacheMode,"no-store");assert.equal(current.verification.sourceGeometry.requestCacheMode,"no-store");assert.equal(current.view.layers.visibleContourIds.length,options.primary===false?0:options.isolate?1:contours.contours.length);
    }
  }
  assert.equal(requests.some(r=>r.cache==="no-store"),true);
});
test("changed source, build, trace, pose, units, private scope and false actual visibility reject",()=>{
  const id=50394,{contours,shell}=loaded.get(id),saved=captureNativeContourSourceView(id,contours,shell,viewFor(id,contours,shell),REVISION);
  const changes=[d=>d.verification.fileManifest.sha256="0".repeat(64),d=>d.verification.fileManifest.path="/data/other.json",d=>delete d.verification.fileManifest,d=>d.source.datFileSnapshot.topLevelObjectCount++,d=>d.verification.originalDat.sha256="0".repeat(64),d=>d.verification.originalDat.fullAuditSha256="0".repeat(64),d=>d.verification.originalDat.parserVersion="other",d=>delete d.verification.originalDat,d=>d.source.neuronId=50424,d=>d.rendererBuild.inputs[0].sha256="0".repeat(64),d=>d.source.scope.registrationCount=1,d=>d.source.scope.units="pixel",d=>d.verification.sourceGeometry.sha256="0".repeat(64),d=>d.verification.sourceGeometry.verifiedAt="not-a-date",d=>d.view.inspection.selectedContourId="absent",d=>d.view.layers.visibleContourIds.pop(),d=>d.view.layers.derivedSurfaceVisible=false,d=>d.view.camera.quaternion[0]+=.2,d=>d.view.camera.fov=38,d=>d.view.viewport.cssWidth=390,d=>d.view.sceneBounds.radius+=1,d=>d.view.displayTransform.scaleViewerUnitPerMicrometre*=2,d=>d.view.clipping.localClippingEnabled=true];
  for(const change of changes){const bad=clone(saved);change(bad);assert.throws(()=>validateNativeContourSourceViewReplay(bad,id,contours,shell,REVISION));}
  assert.throws(()=>preflightNativeContourSourceView(saved,50424),/source/);
  const current=captureNativeContourSourceView(id,contours,shell,saved.view,REVISION);assert.throws(()=>assertNativeContourSourceViewApplied(saved,current),/freshly/);
});
test("specified native renderer build pins match actual workspace bytes without a whole-build claim",async()=>{
  const {createHash}=await import("node:crypto");assert.equal(NATIVE_CONTOUR_VIEW_BUILD.inputs.length,41);
  for (const path of ['app/ResearchCollectionPage.tsx', 'app/ResearchRoutePage.tsx', 'app/SiteNavigation.tsx', 'app/site-navigation.ts', 'app/site-navigation.css', 'app/research-pages.css']) {
    assert.equal(NATIVE_CONTOUR_VIEW_BUILD.inputs.filter(row => row.path === path).length, 1, `Navigation input ${path} must be pinned exactly once`);
  }
  for(const row of NATIVE_CONTOUR_VIEW_BUILD.inputs){const bytes=await readFile(new URL(`../${row.path}`,import.meta.url));assert.equal(bytes.length,row.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),row.sha256);}
});
