import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { readVerifiedMainSceneMorphology, mainSceneMorphologyVerification } from "../app/main-scene-morphology-verification.js";
import { MAIN_SCENE_AUXILIARY_PATHS, readVerifiedMainSceneAuxiliary, mainSceneAuxiliaryProof, mainSceneAuxiliaryBytes, mainSceneAuxiliaryJson } from "../app/main-scene-auxiliary-verification.js";
import { captureMainSceneSourceView, validateMainSceneSourceViewReplay, assertMainSceneSourceViewApplied, appendMainScenePngReceipt } from "../app/main-scene-source-view.js";
import { createObservedSwcCenterlines, createObservedTopologyLandmarks } from "../app/source-local-morphology-geometry.js";
import { indexSwcNeurites, inspectSwcNode, attachSwcNeuriteInspection } from "../app/morphology-neurite-inspection.js";
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
  assert.equal(options.cache, "no-store");
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
const replay = (r, g, d) => validateMainSceneSourceViewReplay(r, g, d, THREE.REVISION);
const atlas = await auxiliary(MAIN_SCENE_AUXILIARY_PATHS.slice(0, 2));

test("all 179 exact observations retain independent memberships, frames and actual source placement in main-scene receipts", async () => {
  const counts = { census: 0, supplementary: 0, todd_supplementary: 0 };
  for (const record of records) {
    const geometry = await load(record), view = viewFor(record, geometry), document = capture(record, geometry, view, atlas);
    assert.deepEqual(replay(record, geometry, document), view);
    assert.equal(document.geometryVerification.sha256, record.geometry.sha256);
    assert.equal(document.sourceContext.registrationCount, 0); assert.equal(document.sourceContext.sameCellInternalObjectCount, 0);
    assert.equal(document.view.sourceObject.worldMatrix[12], -4.4);
    const nodeId = geometry.nodes.find(row => row[6] !== -1)[0];
    view.inspection.selectedNodeId = nodeId; view.inspection.contextDimmed = true;
    const inspected = capture(record, geometry, view, atlas);
    assert.deepEqual(replay(record,geometry,inspected).inspection,view.inspection);
    const description = inspectSwcNode(indexSwcNeurites(geometry),nodeId,{ sourceRadiusAvailable: geometry.swc.sourceDiameterAvailable });
    assert.equal(description.sameSpecimenInternalStructureClaim,false);
    if (!geometry.swc.sourceDiameterAvailable) { assert.equal(description.radiusMicrometre,null); assert.deepEqual(description.radiusProfile,[]); }
    counts[document.geometryVerification.membership] += 1;
  }
  assert.deepEqual(counts, { census: 142, supplementary: 7, todd_supplementary: 30 });
});

test("private auxiliary reads reject copies, altered bytes, truncation and cancellation; byte copies cannot mutate proof", async () => {
  for (const token of await auxiliary(MAIN_SCENE_AUXILIARY_PATHS)) {
    assert.equal(mainSceneAuxiliaryProof(token).path, token.path);
    assert.throws(() => mainSceneAuxiliaryProof({ ...token }), /no private current source proof/);
    const copy = new Uint8Array(mainSceneAuxiliaryBytes(token)), original = copy[0]; copy[0] ^= 1;
    assert.equal(new Uint8Array(mainSceneAuxiliaryBytes(token))[0], original);
    if (token.path.endsWith(".json")) assert.ok(Object.isFrozen(mainSceneAuxiliaryJson(token)));
  }
  const path = MAIN_SCENE_AUXILIARY_PATHS[0], bytes = await readFile(new URL(`../public${path}`, import.meta.url));
  for (const kind of ["truncate", "change"]) {
    const changed = kind === "truncate" ? bytes.subarray(1) : Buffer.from(bytes); if (kind === "change") changed[0] ^= 1;
    await assert.rejects(() => readVerifiedMainSceneAuxiliary(path, { fetchImpl: async () => ({ ok: true, arrayBuffer: async () => changed.buffer.slice(changed.byteOffset, changed.byteOffset + changed.byteLength) }) }), kind === "truncate" ? /byte count changed/ : /checksum changed/);
  }
  for (const stage of ["before", "body"]) {
    const controller = new AbortController(); if (stage === "before") controller.abort();
    await assert.rejects(() => readVerifiedMainSceneAuxiliary(path, { signal: controller.signal, fetchImpl: async () => ({ ok: true, arrayBuffer: async () => { controller.abort(); return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); } }) }), { name: "AbortError" });
  }
  await assert.rejects(() => readVerifiedMainSceneAuxiliary("/another.json"), /not admitted/);
});

test("source/build/frame/pose/layer/inspection drift and fake proof are rejected", async () => {
  const r = records.find(row => row.neuronId === 108974), g = await load(r), d = capture(r, g, viewFor(r,g), atlas);
  assert.throws(() => capture(r, structuredClone(g), d.view, atlas), /no current main-scene runtime proof/);
  assert.throws(() => capture(r, g, d.view, atlas.map(token => ({ ...token }))), /no private current source proof/);
  for (const mutate of [
    x => { x.source.neuronId += 1; }, x => { x.rendererBuild.inputs[0].sha256 = "0".repeat(64); },
    x => { x.sourceContext.sourceIdentity.nodes.cell.id = "invented"; }, x => { x.scientificScope.registrationCount = 1; },
    x => { x.view.request.micronsClipping.positionNanometre = -1; }, x => { x.geometryVerification.mainSceneVerificationSequence = 0; },
    x => { x.view.camera.fov = 38; }, x => { x.view.camera.quaternion = [0,0,0,1]; }, x => { x.view.camera.aspect = 1; },
    x => { x.view.layers.entities = true; }, x => { x.view.sourceObject.worldMatrix[12] = -8.8; },
    x => { x.view.inspection.selectedNodeId = 999999999; }, x => { x.auxiliaryAssets[0].verifiedSha256 = "0".repeat(64); },
    x => { x.view.clipping.micronsNucleusPlanes = [{ normal: [0,0,1], constant: 0 }]; }, x => { x.extra = true; },
  ]) { const changed = structuredClone(d); mutate(changed); assert.throws(() => replay(r,g,changed), /Main scene view|MICrONS clipping/); }
});

test("fresh producer and viewport adaptation verify actual pose while camera, bounds or auxiliary drift fails", async () => {
  const r = records.find(row => row.neuronId === 45674), g = await load(r), old = capture(r,g,viewFor(r,g),atlas);
  const fresh = await load(r), freshAtlas = await auxiliary(MAIN_SCENE_AUXILIARY_PATHS.slice(0,2));
  assert.ok(mainSceneMorphologyVerification(r,fresh).geometryVerification.mainSceneVerificationSequence > old.geometryVerification.mainSceneVerificationSequence);
  const actual = capture(r,fresh,viewFor(r,fresh,[390,420]),freshAtlas);
  assert.equal(assertMainSceneSourceViewApplied(old,actual), true);
  for (const mutate of [x => { x.view.camera.position[0] += 1; }, x => { x.view.sourceObject.bounds.maximum[0] += 1; }, x => { x.auxiliaryAssets.pop(); }]) {
    const changed = structuredClone(actual); mutate(changed); assert.throws(() => assertMainSceneSourceViewApplied(old,changed), /differ/);
  }
  // Verification sequences are per page; an imported receipt can come from a later sequence in a prior page lifetime.
  const previousPage = structuredClone(old); previousPage.geometryVerification.mainSceneVerificationSequence = 100000;
  assert.equal(assertMainSceneSourceViewApplied(previousPage, actual), true);
});

test("saved verification events survive a new page and cache mode; fresh replay still requires actual no-store bytes", async () => {
  const r = records.find(row => row.neuronId === 108974);
  const normal = await readVerifiedMainSceneMorphology(r, { fetchImpl: async (url, options) => {
    assert.equal(options.cache, "default");
    const b = await readFile(new URL(`../public${url}`, import.meta.url));
    return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) };
  } });
  const normalDoc = capture(r,normal,viewFor(r,normal),atlas), fresh = await load(r);
  assert.deepEqual(replay(r,fresh,normalDoc),normalDoc.view);
  const freshDoc = capture(r,fresh,viewFor(r,fresh),atlas), previousPage = structuredClone(freshDoc);
  previousPage.geometryVerification.verifiedAt = "2026-01-01T00:00:00.000Z";
  previousPage.geometryVerification.mainSceneVerificationSequence = 100000;
  previousPage.geometryVerification.verificationSequence = 100000;
  assert.deepEqual(replay(r,normal,previousPage),previousPage.view);
  assert.equal(assertMainSceneSourceViewApplied(previousPage,freshDoc),true);
  assert.throws(() => assertMainSceneSourceViewApplied(previousPage,normalDoc),/bypass the cache/);
  for (const [key,value] of [["verifiedAt","not a date"],["verificationSequence",0],["requestCacheMode","force-cache"]]) {
    const wrong = structuredClone(previousPage); wrong.geometryVerification[key] = value;
    assert.throws(() => replay(r,normal,wrong),/verification event/);
  }
});

test("2D and No Diameter retain exact source branches in a freely orbiting main canvas; no unsupported radius or depth is added", async () => {
  for (const id of [194468,194469,242822]) {
    const r = records.find(row => row.neuronId === id), g = await load(r), d = capture(r,g,viewFor(r,g),atlas);
    assert.equal(replay(r,g,d).sourceObject.dimensionality, g.swc.dimensionality);
    const radius = structuredClone(d); radius.view.request.mode = "radius_surface"; radius.view.sourceObject.mode = "radius_surface";
    assert.throws(() => replay(r,g,radius), /not authorized/);
  }
});

test("fresh applied view must restore the exact source node and dim state; null or invented inspection cannot stand in", async () => {
  const r=records.find(row=>row.neuronId===108974), g=await load(r), v=viewFor(r,g);
  v.inspection.selectedNodeId=62; v.inspection.contextDimmed=true;
  const saved=capture(r,g,v,atlas), fresh=await load(r), actual=capture(r,fresh,v,atlas);
  assert.equal(assertMainSceneSourceViewApplied(saved,actual),true);
  for (const mutate of [x=>{x.view.inspection.selectedNodeId=63;},x=>{x.view.inspection.contextDimmed=false;}]) {
    const changed=structuredClone(actual); mutate(changed); assert.throws(()=>assertMainSceneSourceViewApplied(saved,changed),/differ/);
  }
  for (const mutate of [x=>{x.view.inspection.selectedNodeId=null;},x=>{x.view.inspection.available=false;},x=>{x.view.inspection.overlayAuthority='inferred_branch';},x=>{x.view.inspection.selectedNodeId=62.5;}]) {
    const changed=structuredClone(saved); mutate(changed); assert.throws(()=>replay(r,g,changed),/inspection/);
  }
});

test("main-scene inspection overlay follows the display lane without changing source-object bounds or source measurements", async () => {
  for (const id of [108974,194469,242822,322379]) {
    const r=records.find(row=>row.neuronId===id), g=await load(r), scene=new THREE.Scene(), lane=new THREE.Group();
    lane.position.x=-4.4; scene.add(lane);
    const root=createObservedSwcCenterlines(g,{colors:{1:0xffffff,2:0xffffff,3:0xffffff,4:0xffffff,unknown:0xffffff},opacity:0.8}); lane.add(root);
    scene.updateMatrixWorld(true);
    const before=new THREE.Box3().setFromObject(root), camera=new THREE.PerspectiveCamera(35,2,0.05,250);
    const canvas=new EventTarget(), controls={target:new THREE.Vector3(),minDistance:4,update(){}};
    const controller=attachSwcNeuriteInspection({geometry:g,scene,camera,controls,canvas,contextRoot:root,sourceTransformRoot:lane,sourceRadiusAvailable:g.swc.sourceDiameterAvailable});
    const nodeId=g.nodes.find(row=>row[1]!==1)[0]; controller.select(nodeId); controller.dimContext(); scene.updateMatrixWorld(true);
    const state=controller.getState(), overlay=lane.getObjectByName(`exact-swc-inspection-${nodeId}`);
    assert.equal(state.selection.nodeId,nodeId); assert.equal(state.dimmed,true); assert.equal(overlay.parent,lane);
    const local=g.nodes.find(row=>row[0]===nodeId).slice(2,5).map((v,i)=>(v-g.displayTransform.originMicrometre[i])*g.displayTransform.scaleViewerUnitPerMicrometre);
    const marker=overlay.getObjectByName('selected-node-cross-viewer-aid'), p=new THREE.Vector3().fromBufferAttribute(marker.geometry.attributes.position,0).applyMatrix4(marker.matrixWorld);
    assert.ok(Math.abs(p.x-(local[0]-4.4-0.035))<1e-5); assert.ok(Math.abs(p.y-local[1])<1e-5); assert.ok(Math.abs(p.z-local[2])<1e-5);
    assert.ok(new THREE.Box3().setFromObject(root).equals(before));
    if (!g.swc.sourceDiameterAvailable) { assert.equal(state.selection.radiusMicrometre,null); assert.deepEqual(state.selection.radiusProfile,[]); }
    controller.clear(); assert.equal(controller.getState().selection,null); assert.equal(controller.getState().dimmed,false);
    controller.dispose(); root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  }
});

test("MICrONS loaded bundle remains independently verified even while hidden; partial bundle and unsupported clipping fail", async () => {
  const r = records.find(row => row.neuronId === 108974), g = await load(r), mic = await auxiliary(MAIN_SCENE_AUXILIARY_PATHS.slice(2,7)), v = viewFor(r,g);
  const hidden = capture(r,g,v,[...atlas,...mic]); assert.equal(hidden.view.layers.micronsReference,false);
  v.request.view = "microns_observed_reference"; v.layers.morphology = false; v.layers.morphologyGuide = false;
  v.layers.micronsReference = true; v.layers.micronsCell = true; v.layers.micronsNucleus = true;
  assert.equal(replay(r,g,capture(r,g,v,[...atlas,...mic])).layers.micronsNucleus,true);
  assert.throws(() => capture(r,g,v,[...atlas,...mic.slice(0,-1)]), /partial MICrONS/);
  v.request.micronsClipping.enabled = true;
  assert.throws(() => capture(r,g,v,[...atlas,...mic]), /cell clipping disagrees/);
});

test("same-record DAT contours require their two independently rechecked JSON files and are withheld for other records", async () => {
  const r = records.find(row => row.neuronId === 45718), g = await load(r), v = viewFor(r,g), dat = await auxiliary(MAIN_SCENE_AUXILIARY_PATHS.slice(7));
  v.request.layers.datContours = true; v.layers.datContours = true;
  assert.equal(replay(r,g,capture(r,g,v,[...atlas,...dat])).layers.datContours,true);
  assert.throws(() => capture(r,g,v,atlas), /DAT assets/);
  const other = records.find(row => row.neuronId === 108974), og = await load(other), ov = viewFor(other,og);
  ov.request.layers.datContours = true; ov.layers.datContours = true;
  assert.throws(() => capture(other,og,ov,[...atlas,...dat]), /visibility/);
});

test("requested renderer attributes stay distinct from actual browser attributes and fresh actual drift fails", async () => {
  const r = records.find(row => row.neuronId === 108974), g = await load(r), v = viewFor(r,g);
  v.renderer.alpha = true; v.renderer.antialias = false;
  const d = capture(r,g,v,atlas); assert.equal(replay(r,g,d).renderer.requestedAlpha,false); assert.equal(d.view.renderer.alpha,true);
  const fresh = capture(r,g,v,atlas); assert.equal(assertMainSceneSourceViewApplied(d,fresh),true);
  fresh.view.renderer.alpha = false; assert.throws(() => assertMainSceneSourceViewApplied(d,fresh),/differ/);
});

test("PNG embeds a readable receipt with valid iTXt CRC and leaves encoded pixel chunks intact", async () => {
  const original = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const receipt = { status: "unavailable", reason: "No current verified morphology" };
  const result = new Uint8Array(await (await appendMainScenePngReceipt(new Blob([original],{type:"image/png"}),receipt)).arrayBuffer());
  let offset = 8, found = false, pixelChunks = [];
  while (offset + 12 <= result.length) {
    const length = new DataView(result.buffer).getUint32(offset), type = String.fromCharCode(...result.slice(offset+4,offset+8));
    if (type === "iTXt") {
      const data = result.slice(offset+8,offset+8+length), separator = data.indexOf(0);
      assert.equal(new TextDecoder().decode(data.slice(0,separator)),"ohri-source-view");
      assert.deepEqual(JSON.parse(new TextDecoder().decode(data.slice(separator+5))),receipt);
      let crc=0xffffffff;
      for (const value of result.slice(offset+4,offset+8+length)) { crc ^= value; for(let i=0;i<8;i++) crc = (crc>>>1)^((crc&1)*0xedb88320); }
      assert.equal(new DataView(result.buffer).getUint32(offset+8+length),(crc^0xffffffff)>>>0); found=true;
    } else pixelChunks.push(result.slice(offset,offset+length+12));
    offset += length+12;
  }
  assert.ok(found); assert.deepEqual(Buffer.concat([Buffer.from(result.slice(0,8)),...pixelChunks.map(v=>Buffer.from(v))]),original);
  await assert.rejects(() => appendMainScenePngReceipt(new Blob(["not a PNG"]),receipt),/PNG encoding/);
});
