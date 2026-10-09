import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { readVerifiedMainSceneMorphology } from "../app/main-scene-morphology-verification.js";
import { MAIN_SCENE_AUXILIARY_PATHS, readVerifiedMainSceneAuxiliary } from "../app/main-scene-auxiliary-verification.js";
import { captureMainSceneSourceView } from "../app/main-scene-source-view.js";
import { createObservedSwcCenterlines, createObservedTopologyLandmarks } from "../app/source-local-morphology-geometry.js";
const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url)));
const census = await json("data/neuromorpho-census-main-scene-index-0.1.json"), supplement = await json("data/supplementary-morphology-comparison-adapter-0.1.json"), todd = await json("data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json");
function recordFor(row, supplementary = false) {
  const metadata = supplementary ? row.normalizedMetadata : row.sourceMetadata, counts = supplementary ? row.morphometrics.computed : row.geometry;
  const geometry = { ...row.geometry, geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL", sourceFrame: metadata.sourceFrame, dimensionality: metadata.dimensionality, sourceDiameterAvailable: metadata.sourceDiameterAvailable, nodeCount: counts.nodeCount, segmentCount: counts.segmentCount };
  return { neuronId: row.neuronId, assetId: row.assetId, geometry,
    axon: { sourceDomain: metadata.domain, sourceType2NodeCount: counts.nodeTypeCounts["2"] ?? 0, completeAxon: false },
    modes: { observedSwc: { available: true }, radiusSurface: { available: geometry.dimensionality === "3D" && geometry.sourceDiameterAvailable }, internalStructure: { available: false } } };
}
const records = [...census.records.map(row => recordFor(row)), ...supplement.records.map(row => recordFor(row, true)), ...todd.routes.map(row => row.fidelityRecord)];
const actualFetch = async (url, options) => {
  assert.ok(["default", "no-store"].includes(options.cache));
  const bytes = await readFile(new URL(`../public${url}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
};
const load = record => readVerifiedMainSceneMorphology(record, { fetchImpl: actualFetch, forceReload: true });
const auxiliary = paths => Promise.all(paths.map(path => readVerifiedMainSceneAuxiliary(path, { fetchImpl: actualFetch })));
function viewFor(record, geometry, viewport = [1000, 500]) {
  const camera = new THREE.PerspectiveCamera(35, viewport[0] / viewport[1], 0.05, 250), target = new THREE.Vector3(-4.4, 0, 0);
  camera.position.set(-4.4, 2.2, 9.6); camera.lookAt(target); camera.updateMatrixWorld(true);
  const source = new THREE.Group(); source.position.x = -4.4;
  source.add(createObservedSwcCenterlines(geometry, { colors: { 1: 0x123456, 2: 0x123456, 3: 0x123456, 4: 0x123456, unknown: 0x123456 } }), createObservedTopologyLandmarks(geometry, { markerSizeViewer: 0.052 }));
  source.updateMatrixWorld(true); const bounds = new THREE.Box3().setFromObject(source);
  return { runtimeBinding: { neuronId: record.neuronId, geometrySha256: record.geometry.sha256, sceneInstanceId: "main-scene-runtime-1", revision: 1 },
    request: { view: "cell_detail", sliceZ: -12, mode: "observed_swc", layers: { scaffold: true, gray: true, entities: true, observedForm: true, datContours: false, micronsCellSurface: true, micronsNucleus: true }, micronsClipping: { enabled: false, axis: "z", positionNanometre: 80000, keepSide: "positive" }, evidenceFilter: { search: "", filters: { transmitter: "all", segment: "all", endpoint: "all", injury: "all" }, retainedSelectedId: null } },
    camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset },
    viewport: { cssWidth: viewport[0], cssHeight: viewport[1], drawingBufferWidth: viewport[0], drawingBufferHeight: viewport[1], pixelRatio: 1 },
    renderer: { engine: "THREE", revision: THREE.REVISION, outputColorSpace: "srgb", toneMapping: 0, requestedAlpha: false, requestedAntialias: true, alpha: false, antialias: true },
    clipping: { globalPlanes: [], localClippingEnabled: true, micronsCellPlanes: [], micronsNucleusPlanes: [] },
    layers: { scaffold: false, grayMatter: false, internalCompartments: false, entities: false, syntheticGuide: false, morphology: true, datContours: false, morphologyGuide: true, micronsReference: false, micronsCell: false, micronsNucleus: false, internalReference: false, slicePlane: false, visibleEntityIds: [], activeSelectedId: null },
    sourceObject: { mode: "observed_swc", dimensionality: geometry.swc.dimensionality, sourceDiameterAvailable: geometry.swc.sourceDiameterAvailable, displayTransform: geometry.displayTransform, worldMatrix: source.matrixWorld.toArray(), bounds: { minimum: bounds.min.toArray(), maximum: bounds.max.toArray() }, topologyLandmarksVisible: true, sourceTypes: [...new Set(geometry.nodes.map(row => row[1]))].sort((a,b) => a-b) },
    inspection: { available: true, selectedNodeId: null, contextDimmed: false, overlayAuthority: "exact_swc_parent_path_and_descendant_edges" } };
}
const capture = (r, g, v, a) => captureMainSceneSourceView(r, g, v, a, THREE.REVISION);
const atlas = await auxiliary(MAIN_SCENE_AUXILIARY_PATHS.slice(0, 2));

import { prepareMainSceneStateViewImport as prepare, createMainSceneStateImportCoordinator as coordinator } from "../app/main-scene-state-import.js";
const stateFor = doc => ({ observedCellFormId: doc.source.neuronId, cameraPreset: doc.view.request.view, sliceZ: doc.view.request.sliceZ,
  morphologyFidelityMode: doc.view.request.mode, layers: structuredClone(doc.view.request.layers), micronsClipping: structuredClone(doc.view.request.micronsClipping),
  ...structuredClone(doc.view.request.evidenceFilter), selectedId: doc.view.request.evidenceFilter.retainedSelectedId });
async function specimen(id = 108974) {
  const record = records.find(row => row.neuronId === id), geometry = await load(record), view = viewFor(record, geometry);
  view.inspection.selectedNodeId = geometry.nodes.find(row => row[6] !== -1)[0]; view.inspection.contextDimmed = true;
  return { record, geometry, view, doc: capture(record,geometry,view,atlas) };
}
const contextFor = doc => ({ neuronId: doc.source.neuronId, focus: { focusKind: "morphology", focusId: `NeuroMorpho:${doc.source.neuronId}` }, request: doc.view.request });
const waiting = (c, doc) => { const t=c.begin(contextFor(doc)); c.waitForRenderer(t,{status:"actual_view",neuronId:doc.source.neuronId,document:doc},contextFor(doc),2); return t; };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve=r; }); return {promise,resolve}; };

test("global actual-view preparation reuses admitted private source frames across the three independent rosters", async () => {
  for (const id of [108974,194469,242822,45674,322379,322385]) {
    const {doc}=await specimen(id), prepared=await prepare(doc,stateFor(doc),id,records,{fetchImpl:actualFetch});
    assert.equal(prepared.status,"actual_view"); assert.deepEqual(prepared.document,doc); assert.notEqual(prepared.document,doc);
    assert.equal(prepared.document.scientificScope.registrationCount,0);
    assert.equal(prepared.document.source.neuronId,id);
    if ([194469,242822,322385].includes(id)) assert.equal(prepared.document.view.sourceObject.mode,"observed_swc");
  }
});
test("legacy and typed unavailable exports remain explicitly settings-only; malformed disclosures reject", async () => {
  assert.deepEqual(await prepare(undefined,{},null,records),{status:"settings_only",reason:"legacy_export_without_actual_view"});
  for (const id of [null,108974]) assert.deepEqual(await prepare({status:"unavailable",reason:"No current verified view",currentNeuronId:id},{},id,records),{status:"settings_only",reason:"saved_actual_view_unavailable"});
  for (const bad of [null,[],{}, {status:"unavailable",reason:"",currentNeuronId:108974}, {status:"unavailable",reason:"missing",currentNeuronId:2}, {status:"unavailable",reason:"missing",currentNeuronId:108974,extra:true}])
    await assert.rejects(()=>prepare(bad,{},108974,records),/State import/);
});
test("old schema, old renderer or mismatched source reject before reading source bytes", async () => {
  const {doc}=await specimen(); let reads=0; const forbidden=async()=>{reads++;throw new Error("must not fetch");};
  for (const mutate of [x=>{x.schemaVersion="0.1.0";},x=>{x.rendererBuild.inputs[0].sha256="0".repeat(64);},x=>{x.source.neuronId=45674;}]) {
    const bad=structuredClone(doc); mutate(bad); await assert.rejects(()=>prepare(bad,stateFor(doc),108974,records,{fetchImpl:forbidden}),/unsupported|build changed|same admitted/);
  }
  await assert.rejects(()=>prepare(doc,{...stateFor(doc),observedCellFormId:45674},108974,records,{fetchImpl:forbidden}),/same admitted/);
  assert.equal(reads,0);
});
test("persistent camera, slice, mode, clipping, layers and evidence contradictions reject without changing source", async () => {
  const {doc}=await specimen();
  for (const mutate of [s=>{s.cameraPreset="home";},s=>{s.sliceZ+=1;},s=>{s.morphologyFidelityMode="radius_surface";},s=>{s.micronsClipping.enabled=true;},s=>{s.layers.gray=false;},s=>{s.layers.observedForm=false;},s=>{s.layers.micronsNucleus=false;},s=>{s.search="invented";},s=>{s.filters.segment="T1";},s=>{s.selectedId="other";}]) {
    const state=stateFor(doc);mutate(state);await assert.rejects(()=>prepare(doc,state,108974,records,{fetchImpl:actualFetch}),/disagree/);
  }
  const effective=stateFor(doc);effective.layers.entities=doc.view.layers.entities;
  assert.equal((await prepare(doc,effective,108974,records,{fetchImpl:actualFetch})).status,"actual_view");
});
test("actual-view preflight rejects invented node, source frames and unsupported source radius", async () => {
  for (const id of [108974,194469,242822]) {
    const {doc}=await specimen(id);
    for (const mutate of [x=>{x.view.inspection.selectedNodeId=999999999;},x=>{x.sourceContext.sourceIdentity.nodes.cell.id="invented";}]) {
      const bad=structuredClone(doc);mutate(bad);await assert.rejects(()=>prepare(bad,stateFor(bad),id,records,{fetchImpl:actualFetch}),/inspection|source|context/);
    }
    if(id!==108974) {const bad=structuredClone(doc);bad.view.request.mode="radius_surface";bad.view.sourceObject.mode="radius_surface";await assert.rejects(()=>prepare(bad,stateFor(bad),id,records,{fetchImpl:actualFetch}),/not authorized/);}
  }
});
test("missing, truncated, altered and cancelled preflight bytes never become an actual preparation", async () => {
  const {doc,record}=await specimen(322379), bytes=await readFile(new URL(`../public${record.geometry.path}`,import.meta.url));
  await assert.rejects(()=>prepare(doc,stateFor(doc),322379,records,{fetchImpl:async()=>({ok:false,status:404})}),/request failed/);
  for(const changed of [bytes.subarray(1),Buffer.from(bytes)]) {
    if(changed.length===bytes.length) changed[0]^=1;
    await assert.rejects(()=>prepare(doc,stateFor(doc),322379,records,{fetchImpl:async()=>({ok:true,arrayBuffer:async()=>changed.buffer.slice(changed.byteOffset,changed.byteOffset+changed.byteLength)})}),/byte count|checksum/);
  }
  const controller=new AbortController();controller.abort();
  await assert.rejects(()=>prepare(doc,stateFor(doc),322379,records,{fetchImpl:actualFetch,signal:controller.signal}),{name:"AbortError"});
});
test("coordinator waits for the exact ready renderer and starts one restoration despite repeated readiness events", async () => {
  const {doc,record,view}=await specimen(), c=coordinator(),ticket=waiting(c,doc), gate=deferred();let restores=0;
  let actual;const tools={restorable:true,restoring:false,neuronId:108974,restore:async()=>{restores++;await gate.promise;const fresh=await load(record);actual=capture(record,fresh,view,atlas);},capture:()=>actual};
  for(const unavailable of [null,{...tools,restorable:false},{...tools,restoring:true},{...tools,neuronId:45674}]) assert.equal((await c.restoreWhenReady(ticket,unavailable)).status,"waiting");
  const run=c.restoreWhenReady(ticket,tools);assert.equal(c.snapshot().phase,"restoring");
  assert.equal((await c.restoreWhenReady(ticket,tools)).status,"waiting");assert.equal(restores,1);gate.resolve();
  const result=await run;assert.equal(result.status,"restored");assert.equal(result.actual.geometryVerification.requestCacheMode,"no-store");
  assert.equal(c.snapshot().phase,"completed");assert.equal(c.finish(ticket),true);assert.equal(c.snapshot(),null);
});
test("a resolved renderer promise alone cannot report success without fresh bytes and applied camera and inspection", async () => {
  const {doc,record,view}=await specimen(322379);
  for(const kind of ["cached","camera","node","dim"]) {
    const c=coordinator(),ticket=waiting(c,doc);let actual;
    await assert.rejects(()=>c.restoreWhenReady(ticket,{restorable:true,restoring:false,neuronId:322379,restore:async()=>{
      const geometry=kind==="cached"?await readVerifiedMainSceneMorphology(record,{fetchImpl:actualFetch}):await load(record);
      actual=capture(record,geometry,view,atlas);
      if(kind==="camera")actual.view.camera.position[0]+=1;
      if(kind==="node")actual.view.inspection.selectedNodeId+=1;
      if(kind==="dim")actual.view.inspection.contextDimmed=false;
    },capture:()=>actual}),/bypass the cache|differ/);
    assert.equal(c.snapshot().phase,"failed");assert.equal(c.finish(ticket),true);
  }
});
test("newer import aborts a preparing ticket and cannot accept its late transition or completion", async () => {
  const {doc}=await specimen(),c=coordinator(),first=c.begin(contextFor(doc)),second=c.begin(contextFor(doc));
  assert.equal(first.signal.aborted,true);assert.equal(c.isCurrent(first),false);assert.equal(c.isCurrent(second),true);
  assert.equal(c.waitForRenderer(first,{status:"actual_view",neuronId:108974,document:doc},contextFor(doc),0),false);
  assert.equal(c.finish(first),false);assert.equal(c.snapshot().ticket,second);assert.equal(c.cancel("Manual source change"),false);
  assert.equal(second.signal.aborted,true);assert.equal(c.snapshot(),null);
});
test("cancelled or superseded renderer cannot overwrite the newer import even when its restore settles late", async () => {
  const {doc}=await specimen();
  for(const lateFailure of [false,true]) {
    const c=coordinator(),first=waiting(c,doc),gate=deferred();let captures=0;
    const run=c.restoreWhenReady(first,{restorable:true,restoring:false,neuronId:108974,restore:async()=>{await gate.promise;if(lateFailure)throw new Error("old failed");},capture:()=>{captures++;return doc;}});
    assert.equal(c.cancel("Source changed"),true);const second=c.begin(contextFor(doc));gate.resolve();
    assert.equal((await run).status,"cancelled");assert.equal(captures,0);assert.equal(c.finish(first),false);assert.equal(c.snapshot().ticket,second);
  }
});
test("renderer failure remains failure and requires an explicit fresh retry", async () => {
  const {doc}=await specimen(),c=coordinator(),ticket=waiting(c,doc);
  await assert.rejects(()=>c.restoreWhenReady(ticket,{restorable:true,restoring:false,neuronId:108974,restore:async()=>{throw new Error("Fresh source missing");},capture:()=>doc}),/Fresh source missing/);
  assert.equal(c.snapshot().phase,"failed");assert.equal((await c.restoreWhenReady(ticket,{restorable:true,restoring:false,neuronId:108974})).status,"waiting");
  assert.equal(c.finish(ticket),true);assert.ok(waiting(c,doc).id>ticket.id);
});

test("an unchanged no-store receipt cannot satisfy a resolved no-op renderer restoration", async () => {
  const {doc}=await specimen(),c=coordinator(),ticket=waiting(c,doc);
  await assert.rejects(()=>c.restoreWhenReady(ticket,{available:true,restorable:true,restoring:false,neuronId:108974,restore:async()=>{},capture:()=>doc}),/producer did not advance/);
  assert.equal(c.snapshot().phase,"failed");
});

test("latest generation remains distinct after cancellation and completion so queued old notices stay obsolete", async () => {
  const {doc}=await specimen(),c=coordinator(),first=c.begin(contextFor(doc));
  c.cancel("old cancelled");assert.equal(c.isCurrent(first),false);assert.equal(c.isLatest(first),true);
  const second=c.begin(contextFor(doc));assert.equal(c.isLatest(first),false);assert.equal(c.isLatest(second),true);
  c.finish(second);assert.equal(c.snapshot(),null);assert.equal(c.isLatest(first),false);assert.equal(c.isLatest(second),true);
});
