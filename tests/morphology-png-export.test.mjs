import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { appendMorphologyExportPng, assertMorphologyPngCurrent, morphologyPngCaptions } from "../app/morphology-png-export.js";
import { captureIndividualMorphologySourceView } from "../app/morphology-source-view.js";
import { readVerifiedUniverseIndex, readVerifiedUniverseGeometry } from "../app/neuromorpho-universe-verification.js";
import test from "node:test";
import * as THREE from "three";
import { readVerifiedMorphologyGeometry, verifiedMorphologyGeometryUrl } from "../app/morphology-geometry-verification.js";
import { createObservedSwcCenterlines, createObservedTopologyLandmarks, createRadiusDerivedSurface } from "../app/source-local-morphology-geometry.js";
import { captureMorphologySourceView } from "../app/morphology-source-view.js";
const census = JSON.parse(await readFile(new URL("../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json", import.meta.url)));
const supplementary = JSON.parse(await readFile(new URL("../data/supplementary-morphology-comparison-adapter-0.1.json", import.meta.url)));
const frames = JSON.parse(await readFile(new URL("../data/morphology-source-frame-disclosure-0.1.json", import.meta.url)));
const fixtures = [];
const colors = { 1: 0xffffff, 2: 0x99aaaa, 3: 0x88bb99, 4: 0x77cc88 };
for (const id of [108974, 194468, 45674, 242822]) {
  const record = census.records.find(row => row.neuronId === id) ?? supplementary.records.find(row => row.neuronId === id);
  if (!record.comparisonMembership) record.comparisonMembership = { collection: "census", censusContribution: 1, supplementaryContribution: 0, routeId: null, routeContractPath: null, routeContractSha256: null, routeAssetManifestPath: null, routeAssetManifestSha256: null };
  const frame = frames.records.find(row => row.neuronId === id);
  const bytes = await readFile(new URL(`../public${verifiedMorphologyGeometryUrl(record, frame)}`, import.meta.url));
  const load = options => readVerifiedMorphologyGeometry(record, frame, { fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }), ...options });
  fixtures.push({ record, frame, bytes, load, geometry: await load() });
}
// These are deterministic source-scene/camera fixtures, not claims of a live WebGL render.
function viewFor(fixture, { requestedMode = "skeleton", actualMode = "skeleton", topology = true } = {}) {
  const geometry = fixture.geometry;
  const root = actualMode === "radius" ? createRadiusDerivedSurface(geometry, { colors }) : createObservedSwcCenterlines(geometry, { colors });
  if (actualMode === "radius") root.add(createObservedSwcCenterlines(geometry, { colors }));
  if (topology) root.add(createObservedTopologyLandmarks(geometry));
  const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  const camera = new THREE.PerspectiveCamera(38, 640 / 400, .001, 1000);
  const target = sphere.center.clone();
  const direction = fixture.record.normalizedMetadata.dimensionality === "2D" ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1.45, .9, 1.65).normalize();
  camera.position.copy(target).addScaledVector(direction, sphere.radius * 4);
  camera.lookAt(target);
  const distance = camera.position.distanceTo(sphere.center);
  camera.near = Math.max(Math.min(sphere.radius / 1000, distance / 1000), .001);
  camera.far = Math.max(distance + 2 * sphere.radius, 4 * sphere.radius, 100);
  const view = {
    status: "rendered", runtimeBinding: { neuronId: fixture.record.neuronId, geometrySha256: (fixture.record.sourceObject?.rawSwcSha256 ?? fixture.record.geometry.sha256), viewportInstanceId: "source-local-runtime-17", viewportRevision: 2 },
    requestedMode, actualMode, sourcePlaneLocked: fixture.record.normalizedMetadata.dimensionality === "2D",
    camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset },
    viewport: { cssWidth: 640, cssHeight: 400, drawingBufferWidth: 864, drawingBufferHeight: 540, pixelRatio: 1.35 },
    renderer: { engine: "THREE", revision: THREE.REVISION, type: "WebGLRenderer", outputColorSpace: "srgb", toneMapping: 0, alpha: true, antialias: true },
    clipping: { globalPlanes: [], localClippingEnabled: false },
    layers: { sourceGeometryVisible: true, centerlinesVisible: true, radiusSurfaceVisible: actualMode === "radius", topologyLandmarksVisible: topology, sourceAxesVisible: true },
    inspection: { selectedNodeId: geometry.nodes.at(-1)[0], contextDimmed: true, overlayAuthority: "exact_swc_parent_path_and_descendant_edges" },
    sceneBounds: { center: sphere.center.toArray(), radius: sphere.radius }, displayTransform: geometry.displayTransform,
  };
  root.traverse(object => { object.geometry?.dispose(); const materials = object.material ? Array.isArray(object.material) ? object.material : [object.material] : []; materials.forEach(material => material.dispose()); });
  return view;
}

function crc(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) { value ^= byte; for (let i = 0; i < 8; i++) value = value >>> 1 ^ (value & 1 ? 0xedb88320 : 0); }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12); out.writeUInt32BE(data.length); out.write(type, 4); data.copy(out, 8); out.writeUInt32BE(crc(out.subarray(4, -4)), out.length - 4); return out;
}
// A valid independently encoded blank raster exercises metadata without pretending
// to be actual renderer pixels; browser verification separately inspects the UI export.
function png(width = 864, height = 640) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return new Blob([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.alloc((width * 4 + 1) * height))), chunk("IEND", Buffer.alloc(0))], { type: "image/png" });
}
async function inspect(blob) {
  const b = Buffer.from(await blob.arrayBuffer()), text = {}, unchanged = [b.subarray(0, 8)];
  for (let offset = 8; offset < b.length;) {
    const size = b.readUInt32BE(offset), type = b.toString("ascii", offset + 4, offset + 8);
    assert.equal(b.readUInt32BE(offset + 8 + size), crc(b.subarray(offset + 4, offset + 8 + size)));
    if (type === "iTXt") {
      const data = b.subarray(offset + 8, offset + 8 + size), nul = data.indexOf(0);
      text[data.toString("utf8", 0, nul)] = JSON.parse(data.toString("utf8", nul + 5));
    } else unchanged.push(b.subarray(offset, offset + 12 + size));
    offset += 12 + size;
  }
  return { text, unchanged: Buffer.concat(unchanged) };
}

const fetchActual = async url => { const b = await readFile(new URL(`../public${url}`, import.meta.url)); return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }; };
const universe = await readVerifiedUniverseIndex({ fetchImpl: fetchActual });
const universeFixtures = [];
for (const id of [45677, 45675, 170034, 108974]) { const record = universe.records.find(row => row.neuronId === id); universeFixtures.push({ record, geometry: await readVerifiedUniverseGeometry(record, { fetchImpl: fetchActual }) }); }
function make(fixture, profile, requestedMode = "radius") {
  const validRadius = fixture.record.normalizedMetadata.dimensionality === "3D" && fixture.record.normalizedMetadata.sourceDiameterAvailable;
  const view = viewFor(fixture, { requestedMode, actualMode: validRadius && requestedMode === "radius" ? "radius" : "skeleton" });
  if ("sourceObject" in fixture.record) view.runtimeBinding.geometrySha256 = fixture.record.sourceObject.rawSwcSha256;
  if (profile === "individual") {
    view.runtimeBinding.viewportInstanceId = "individual-runtime-3";
    view.camera.near = Math.max(view.sceneBounds.radius / 1000, .001); view.camera.far = Math.max(view.sceneBounds.radius * 50, 100);
    view.layers.visibleSourceTypes = [...new Set(fixture.geometry.nodes.map(n => n[1]))].filter(type => type !== 3).sort((a,b) => a-b);
    view.layers.centerlineSourceTypes = [...new Set(fixture.geometry.segments.map(n => n[8]))].filter(type => view.layers.visibleSourceTypes.includes(type)).sort((a,b) => a-b);
  }
  return (profile === "individual" ? captureIndividualMorphologySourceView : captureMorphologySourceView)(fixture.record, fixture.geometry, view, THREE.REVISION);
}
const options = (fixture, profile) => ({ record: fixture.record, geometry: fixture.geometry, profile, rendererRevision: THREE.REVISION });
test("source-backed comparison, individual and raw-universe PNG receipts preserve raster bytes, current layers and evidence boundaries", async () => {
  for (const [fixture,profile] of [...fixtures.map(f=>[f,"source_local"]), ...fixtures.filter(f=>f.record.comparisonMembership.collection==="census").map(f=>[f,"individual"]), ...universeFixtures.map(f=>[f,"source_local"])]) {
    const saved = make(fixture,profile), raster = png(), result = await inspect(await appendMorphologyExportPng(raster,saved,options(fixture,profile)));
    assert.deepEqual(result.unchanged,Buffer.from(await raster.arrayBuffer())); assert.deepEqual(result.text["ohri-source-view"],saved);
    const meta=result.text["ohri-png-export"]; assert.deepEqual(meta.raster,{x:0,y:0,width:864,height:540}); assert.equal(meta.image.height,640);
    assert.equal(meta.rendererProfile,profile); assert.deepEqual(meta.captureAuthority.layers,saved.view.layers); assert.deepEqual(meta.captureAuthority.inspection,saved.view.inspection);
    assert.equal(meta.captureAuthority.rawSwcByteVerification,"sourceObject" in fixture.record ? "verified_raw_swc_bytes_in_source_view" : "declared_raw_hash_only");
    for(const key of ["inferredDepthCount","repairedCutNeuriteCount","observedMembraneCount","internalStructureCount","sameCellJoinCount","registrationCount"]) assert.equal(meta.captureAuthority[key],0);
    assert.equal(meta.captureAuthority.imageIsBiologicalMeasurement,false); assert.ok(morphologyPngCaptions(saved,options(fixture,profile)).join(" ").includes(saved.source.geometrySha256));
  }
});
test("private source proof, profile, build and radius/planar gates are required before PNG metadata admission", async () => {
  const f=fixtures[0],doc=make(f,"source_local");
  await assert.rejects(appendMorphologyExportPng(png(),doc,{...options(f,"source_local"),geometry:structuredClone(f.geometry)}),/runtime byte-verification/);
  await assert.rejects(appendMorphologyExportPng(png(),doc,options(fixtures[1],"source_local")),/source identity/);
  await assert.rejects(appendMorphologyExportPng(png(),doc,options(f,"individual")),/schema or application/);
  for(const change of [d=>d.rendererBuild.inputs.pop(),d=>d.view.inspection.selectedNodeId=-77,d=>d.geometryVerification.scope="raw_verified",d=>d.scientificScope.samePhysicalCellIdentity=true]) { const changed=structuredClone(doc);change(changed);await assert.rejects(appendMorphologyExportPng(png(),changed,options(f,"source_local")),/Morphology source view/); }
  const planar=make(fixtures[1],"source_local");planar.view.layers.radiusSurfaceVisible=true;await assert.rejects(appendMorphologyExportPng(png(),planar,options(fixtures[1],"source_local")),/source view/);
  await assert.rejects(appendMorphologyExportPng(png(800),doc,options(f,"source_local")),/raster dimensions/);
});
test("only regenerated capture time may change during encoding; camera, source proof, mode and inspection invalidate PNG",()=>{
  const saved=make(fixtures[0],"source_local"),copy=structuredClone(saved);copy.generatedAt=new Date(Date.now()+1000).toISOString();assert.doesNotThrow(()=>assertMorphologyPngCurrent(saved,copy));
  for(const change of [d=>d.view.camera.position[0]+=.01,d=>d.view.runtimeBinding.viewportRevision++,d=>d.view.inspection.contextDimmed=false,d=>d.view.requestedMode="skeleton",d=>d.geometryVerification.verificationSequence++,d=>d.rendererBuild.inputs.pop()]) { const changed=structuredClone(saved);change(changed);assert.throws(()=>assertMorphologyPngCurrent(saved,changed),/view changed/); }
});
test("PNG receipt snapshots the validated document before asynchronous byte encoding",async()=>{
 const f=fixtures[0],doc=make(f,"source_local"),before=structuredClone(doc),raster=png();let release;const delay=new Promise(resolve=>release=resolve);const wrapped={arrayBuffer:async()=>{await delay;return raster.arrayBuffer();}};
 const pending=appendMorphologyExportPng(wrapped,doc,options(f,"source_local"));doc.view.camera.position[0]+=1;release();const result=await inspect(await pending);assert.deepEqual(result.text["ohri-source-view"],before);
});
