import { validateComparativeSwcViewReplay } from './comparative-swc-view-replay.js';
import { assertVerifiedComparativeSwcPayload } from './comparative-swc-reference.js';
import { appendMainScenePngReceipt } from './main-scene-source-view.js';
import { encodeSourceViewPng } from './source-view-png-raster.js';
const check=(ok,message)=>{if(!ok)throw new Error(`Comparative PNG: ${message}`);};
function validate(document,options){
  const saved=structuredClone(document),result=validateComparativeSwcViewReplay(options.index,saved,options.payload,options.applicationVersion,options.rendererVersion);
  const event=assertVerifiedComparativeSwcPayload(result.record,options.payload);
  check(JSON.stringify(saved.verification.runtimeVerification)===JSON.stringify(event),'capture does not bind the current private source verification event');
  return {saved,record:result.record};
}
export function comparativeSwcPngCaptions(document,options){
  const {saved,record}=validate(document,options),view=saved.view;
  return [
    `NeuroMorpho ${record.sourceObjectId} · ${record.context.species} · ${record.context.name} · independent source reconstruction.`,
    `Actual camera and source-centerline layer ${view.layers[0].actual?'shown':'hidden'}; source-native 3D coordinates, source-reported micrometres. Independent auto-fit display; no shared biological scale or anatomical axes.`,
    record.viewer.diameterAuthorized?'Source Diameter attribute present; only native centerlines are displayed. No radius surface or membrane is admitted.':'Source No Diameter; raw radii remain unchanged and unvalidated. No tube, membrane, area or volume is admitted.',
    `Exact API, standardized SWC and current morphometry bytes are verified. SWC SHA256 ${record.files.find(file=>file.id==='swc').checksum.digest}.`,
    `CC BY 4.0; NeuroMorpho.Org RRID:SCR_002145. Original paper ${record.provenance.originalPaper}; ${record.provenance.repositoryMethodsCitation}`,
    ...(record.sourceObjectId==='34024'?['L420-LCN to paper L420_E2 same-object link is unestablished. SWC header reports 23 contours averaged into 23 soma points; exact SWC has 12 type-1 nodes. Historical morphometry bytes remain unavailable.']:['Only axon centerlines are deposited; no soma or dendrites. V3 and tonic-spiking are repository assertions without a same-cell physiology join.']),
    'Unknown physical specimen, section and cell identity. No mouse-census addition, same-cell/internal object, membrane or atlas registration. Image is a camera-framed display, not a biological measurement or complete-frustum claim.',
    'Separate JSON is required for same-build fresh three-file no-store restoration; actual camera, layer, clipping and source display transform are rechecked.',
  ];
}
export async function appendComparativeSwcPng(blob,document,options){
  const {saved,record}=validate(document,options),bytes=new Uint8Array(await blob.arrayBuffer()),header=new DataView(bytes.buffer),renderer=saved.view.renderer;
  check(bytes.length>=33&&header.getUint32(16)===renderer.width&&header.getUint32(20)>renderer.height,'actual canvas raster dimensions or disclosure footer disagree');
  return appendMainScenePngReceipt(blob,saved,{documentType:'comparative_swc_png_export_receipt',schemaVersion:'0.1.0',rendererBuild:saved.rendererBuild,
    exportedAt:new Date().toISOString(),exportKind:'actual_native_centerline_canvas_with_source_disclosure_footer',raster:{x:0,y:0,width:renderer.width,height:renderer.height},
    captureAuthority:{sourceObjectId:record.sourceObjectId,species:record.context.species,primitive:'source_swc_centerlines',layers:saved.view.layers,camera:saved.view.camera,clipping:saved.view.clipping,displayTransform:saved.view.displayTransform,
      sourceDiameterAttributePresent:record.viewer.diameterAuthorized,radiusSurfaceAdmitted:false,membraneSurfaces:0,internalObjects:0,sameCellJoins:0,mouseCensusAdditions:0,registrations:0,imageIsBiologicalMeasurement:false,allSourceEdgesInFrustumEstablished:false},
    replay:{separateJsonRequiredForRestore:true,sameSpecifiedBuildRequired:true,freshSourceCacheMode:'no-store',appliedViewMustMatch:true,adaptedPaths:['view.renderer.width','view.renderer.height','view.revision','view.verificationRevision','view.loadMilliseconds','view.renderMilliseconds','verification.runtimeVerification'],numericTolerance:{absolute:1e-8,relative:1e-8}}});
}
export async function encodeComparativeSwcPng(canvas,document,options,assertCurrent){
  assertCurrent();const {saved}=validate(document,options);
  check(canvas.width===saved.view.renderer.width&&canvas.height===saved.view.renderer.height,'current actual canvas dimensions changed');
  const result=await encodeSourceViewPng(canvas,comparativeSwcPngCaptions(saved,options),{pixelRatio:Math.max(1,canvas.width/canvas.getBoundingClientRect().width),assertCurrent,appendReceipt:blob=>appendComparativeSwcPng(blob,saved,options)});
  assertCurrent();return result;
}
