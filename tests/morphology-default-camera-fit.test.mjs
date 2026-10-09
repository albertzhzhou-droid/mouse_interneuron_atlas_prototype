import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { computePerspectiveSphereFitDistance } from "../app/morphology-viewport-scale.js";
import { NATIVE_CONTOUR_SOURCE_IDS, readVerifiedNativeContours, readVerifiedNativeContourShell } from "../app/native-contour-verification.js";
import { nativeContourRenderedBounds } from "../app/native-contour-source-view.js";
import { nativeContourDisplayTransform, transformNativeContourPoint } from "../app/neurolucida-native-contour-admission.js";
import { readVerifiedMorphologyGeometry } from "../app/morphology-geometry-verification.js";
import { createObservedSwcCenterlines, createObservedTopologyLandmarks, createRadiusDerivedSurface } from "../app/source-local-morphology-geometry.js";
const fetchActual = async url => { const b = await readFile(new URL(`../public${url}`, import.meta.url));
  return { ok: true, status: 200, arrayBuffer: async () => b.buffer.slice(b.byteOffset,b.byteOffset+b.length) }; };
const aspects = [1280/720, 1, 330/338, 308/300, 240/600];
const colors = { 1: 0xffffff, 2: 0x99aaaa, 3: 0x88bb99, 4: 0x77cc88 };
function cameraFor(center,radius,fov,aspect,direction,profile="native") {
  const camera = new THREE.PerspectiveCamera(fov,aspect,Math.max(radius/(profile==="native"?500:1000),profile==="native"?.01:.001),Math.max(radius*(profile==="native"?40:50),100));
  const target = new THREE.Vector3().fromArray(center);
  camera.position.copy(target).addScaledVector(direction.clone().normalize(),computePerspectiveSphereFitDistance({radiusViewerUnit:radius,verticalFovDegrees:fov,aspect}));
  camera.lookAt(target);camera.updateMatrixWorld();return camera;
}
function inside(point,camera,label) {
  const ndc=point.clone().project(camera);
  assert.ok([ndc.x,ndc.y,ndc.z].every(n=>Number.isFinite(n)&&Math.abs(n)<=1+1e-7),`${label}: projected source/boundary ${ndc.toArray()}`);
}
test("exact NMO 108978 reproduces the former narrow-pane clipping, while aspect-aware fit retains every source vertex",async()=>{
  const contours=await readVerifiedNativeContours(108978,{fetchImpl:fetchActual}),bounds=nativeContourRenderedBounds(contours),transform=nativeContourDisplayTransform(contours.contours);
  const old=new THREE.PerspectiveCamera(40,330/338,.01,Math.max(bounds.radius*40,100));old.position.fromArray(bounds.center).add(new THREE.Vector3(1.4,.95,1.65).multiplyScalar(bounds.radius));old.lookAt(new THREE.Vector3().fromArray(bounds.center));old.updateMatrixWorld();
  const points=contours.contours.flatMap(c=>c.points.map(p=>new THREE.Vector3(...transformNativeContourPoint(p,transform).map(Math.fround))));
  assert.ok(points.some(p=>{const v=p.clone().project(old);return Math.abs(v.x)>1||Math.abs(v.y)>1;}),"Source-backed legacy clipping regression no longer reproduced");
  const current=cameraFor(bounds.center,bounds.radius,40,330/338,new THREE.Vector3(1.4,.95,1.65));
  for(const p of points)inside(p,current,"NMO 108978");
});
test("all seven unchanged native records and the existing separate shell fit desktop, narrow and tall viewports",async()=>{
  let vertices=0,loops=0;
  for(const id of NATIVE_CONTOUR_SOURCE_IDS){
    const contours=await readVerifiedNativeContours(id,{fetchImpl:fetchActual}),shell=id===50394?await readVerifiedNativeContourShell(id,contours,{fetchImpl:fetchActual}):null;
    const bounds=nativeContourRenderedBounds(contours,shell),transform=nativeContourDisplayTransform(contours.contours);
    const sourcePoints=contours.contours.flatMap(c=>c.points.map(p=>new THREE.Vector3(...transformNativeContourPoint(p,transform).map(Math.fround))));
    vertices+=sourcePoints.length;loops+=contours.contours.length;
    const derivedPoints=shell?.geometry.rings.flatMap(r=>r.pointsMicrometre.map(p=>new THREE.Vector3(...transformNativeContourPoint(p,transform).map(Math.fround))))??[];
    for(const aspect of aspects){const camera=cameraFor(bounds.center,bounds.radius,40,aspect,new THREE.Vector3(1.4,.95,1.65));
      for(const p of [...sourcePoints,...derivedPoints])inside(p,camera,`Native ${id} aspect ${aspect}`);
    }
  }
  assert.equal(loops,72);assert.equal(vertices,5149);
});
test("all 142 exact individual renderer bounds fit without granting planar or No Diameter sources a radius surface",async()=>{
  const census=JSON.parse(await readFile(new URL('../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json',import.meta.url)));
  const frames=JSON.parse(await readFile(new URL('../data/morphology-source-frame-disclosure-0.1.json',import.meta.url)));
  let planar=0,radius=0,noDiameter=0;
  for(const record of census.records){
    record.comparisonMembership={collection:"census",censusContribution:1,supplementaryContribution:0,routeId:null,routeContractPath:null,routeContractSha256:null,routeAssetManifestPath:null,routeAssetManifestSha256:null};
    const geometry=await readVerifiedMorphologyGeometry(record,frames.records.find(r=>r.neuronId===record.neuronId),{fetchImpl:fetchActual});
    const isPlanar=record.normalizedMetadata.dimensionality==='2D',allowedRadius=!isPlanar&&record.normalizedMetadata.sourceDiameterAvailable;
    if(isPlanar)planar++;if(allowedRadius)radius++;if(!record.normalizedMetadata.sourceDiameterAvailable)noDiameter++;
    const root=new THREE.Group();root.add(createObservedSwcCenterlines(geometry,{colors}));root.add(createObservedTopologyLandmarks(geometry));if(allowedRadius)root.add(createRadiusDerivedSurface(geometry,{colors}));
    const box=new THREE.Box3().setFromObject(root),sphere=box.getBoundingSphere(new THREE.Sphere());
    for(const aspect of aspects){const camera=cameraFor(sphere.center.toArray(),sphere.radius,38,aspect,isPlanar?new THREE.Vector3(0,0,1):new THREE.Vector3(1.45,.9,1.65),'individual');
      // A convex view frustum containing every actual renderer-bound corner contains the full mesh/centerline bounds.
      for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])inside(new THREE.Vector3(x,y,z),camera,`Individual ${record.neuronId} aspect ${aspect}`);
      if(isPlanar)assert.deepEqual(camera.position.clone().sub(sphere.center).toArray().slice(0,2),[0,0]);
    }
    root.traverse(object=>{object.geometry?.dispose();for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])material.dispose();});
  }
  assert.equal(census.records.length,142);assert.deepEqual({radius,planar,noDiameter},{radius:92,planar:2,noDiameter:48});
});
