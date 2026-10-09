import { validateIndependentObjectView } from './independent-source-object-view.js';
import { assertVerifiedIndependentSourcePayload } from './independent-source-object-loader.js';
import { appendMainScenePngReceipt } from './main-scene-source-view.js';
import { encodeSourceViewPng } from './source-view-png-raster.js';
const check=(ok,message)=>{if(!ok)throw new Error('Independent object PNG: '+message);};
function current(document,payload,applicationVersion){const saved=structuredClone(document),{record}=validateIndependentObjectView(saved,payload,applicationVersion),event=assertVerifiedIndependentSourcePayload(record,payload);check(JSON.stringify(saved.verification.runtimeVerification)===JSON.stringify(event),'capture does not bind the current private source event');return {saved,record,event};}
export function independentObjectPngCaptions(document,payload,applicationVersion){
 const {saved,record,event}=current(document,payload,applicationVersion),v=saved.view;
 const kind=record.viewer.kind;
 const attribution=kind==='native_contours'?`NeuroMorpho.Org ${record.admission.source.repositoryRrid??'RRID:SCR_002145'}; original paper ${record.admission.sourceLinks?.primaryPaper??record.admission.source.sourcePaperDoi}; terms ${record.admission.source.rightsUrl??'https://neuromorpho.org/useterm.jsp'}.`
  :kind==='microns_mesh'?`MICrONS Phase 1; primary paper DOI ${record.sourceContract.sourceDataset.primaryPublicationDoi}; metadata deposit DOI ${record.sourceContract.sourceDataset.metadataDepositDoi}; terms ${record.sourceContract.sourceDataset.rights.termsUrl}.`
  :kind==='banc_swc'||kind==='banc_nucleus_point'?record.sourceContract.rights.attribution
  :kind==='palm_detection'?`${record.sourceContract.source.citation} DOI ${record.sourceContract.source.doi}; dataset DOI ${record.sourceContract.source.datasetDoi}.`
  :'External dataset repository citation and pinned release are in the exact source URL; no image or mask redistribution is claimed.';
 const description=kind==='native_contours'?'Native source contour line traces. Any loaded DER open shell is uncapped interpolation only; no observed membrane, physical volume or intracellular structure.'
  :kind==='microns_mesh'?'Public source segmentation meshes; cortical P36 reference. Exact root and nucleus relation is source-reported. No spinal identity, observed membrane or new same-cell interior chain.'
  :kind==='banc_swc'||kind==='banc_nucleus_point'?'Drosophila comparative source: skeleton centerline and/or source annotation point. The retained annotation MD5 does not verify its unrequested source bytes; no nucleus surface or volume.'
  :kind==='palm_detection'?'One native MAT detection column. Source XY has no established physical calibration, origin or axis orientation. No neuron identity, trajectory, receptor count or inferred surface.'
  :'Text reference only: exact release/split/row key. No local image, mask, geometry or physical-cell identity. The external live row viewer revision is not verified as this pinned release.';
 return [`${record.title} · ${record.sourceId} · ${record.releaseId} · exact object ${record.sourceObjectId}.`,
  `Actual view ${v.status}; ${v.layers.map(layer=>`${layer.id} ${layer.actual?'shown':'hidden'}`).join('; ')||'no rendered layers'}. Independent auto-fit display only; no between-source scale, anatomical axes or atlas transform.`,
  `Source frame ${record.coordinateFrame.frame}; units ${record.coordinateFrame.unit??'physical unit not established'}. ${description}`,
  `Current proof ${event.authority}; ${event.verifiedFileCount} runtime source files checked. Source-only receipts remain declared, not freshly byte verified.`,
  ...saved.verification.verifiedFiles.map(file=>`${file.fileId}: ${file.bytes} bytes; SHA256 ${file.checksum.digest}.`),
  `Reuse scope: ${record.context.license??'see exact source terms'}; exact source ${record.sourceUrl}. Attribution and source context are retained in the embedded JSON; source-only restrictions are unchanged.`,
  attribution,
  'Source/namespace/physical parents and typed relations retain their original evidence and missingness. No new biological measurement, whole-cell completeness, organelle, membrane, mouse-interneuron identity, same-cell join or registration is asserted.',
  'Separate JSON restores the same specified build with fresh current source verification and actual pose/layers/clipping/transform checks. Raster dimensions and current-page event numbers adapt; image is not a complete-frustum or measurement claim.'];
}
export async function appendIndependentObjectPng(blob,document,payload,applicationVersion){
 const {saved,record,event}=current(document,payload,applicationVersion),b=new Uint8Array(await blob.arrayBuffer());check(b.length>=33,'PNG header is missing');const header=new DataView(b.buffer),rendered=saved.view.status==='rendered';
 check(rendered?header.getUint32(16)===saved.view.renderer.width&&header.getUint32(20)>saved.view.renderer.height:header.getUint32(16)===900&&header.getUint32(20)>60,'actual source canvas or text disclosure dimensions disagree');
 return appendMainScenePngReceipt(blob,saved,{documentType:'independent_source_object_png_export_receipt',schemaVersion:'0.1.0',exportedAt:new Date().toISOString(),exportKind:rendered?'actual_source_canvas_with_disclosure_footer':'source_reference_text_disclosure_only',rendererBuild:saved.rendererBuild,
  raster:rendered?{x:0,y:0,width:saved.view.renderer.width,height:saved.view.renderer.height}:null,
  captureAuthority:{sourceId:record.sourceId,releaseId:record.releaseId,sourceObjectId:record.sourceObjectId,representation:record.viewer.kind,status:saved.view.status,sourceByteAuthority:event.authority,verifiedFileCount:event.verifiedFileCount,layers:saved.view.layers,camera:saved.view.camera,clipping:saved.view.clipping,displayTransform:saved.view.displayTransform,sourceOnlyReceipts:saved.verification.sourceOnlyFiles,sourceRelationships:record.relationships,newMembraneSurfaces:0,newInternalObjects:0,newSameCellJoins:0,mouseCensusAdditions:0,registrations:0,biologicalMeasurement:false,allSourceGeometryInFrustumEstablished:false},
  replay:{separateJsonRequired:true,sameSpecifiedBuildRequired:true,freshCurrentSourceVerificationRequired:true,sourceFileCacheMode:'no-store',metadataOnlySourceDoesNotAcquireRuntimeBytes:event.verifiedFileCount===0,actualAppliedViewRequired:true,adaptedPaths:['view.renderer.width','view.renderer.height','view.verificationRevision','view.revision','view.loadMilliseconds','view.renderMilliseconds','verification.runtimeVerification'],numericTolerance:{absolute:1e-8,relative:1e-8}}});
}
export async function encodeIndependentObjectPng(canvas,document,payload,applicationVersion,assertCurrent){
 assertCurrent();const {saved}=current(document,payload,applicationVersion);let source=canvas;
 if(saved.view.status==='rendered'){check(source&&source.width===saved.view.renderer.width&&source.height===saved.view.renderer.height,'actual current source canvas is unavailable or resized');}
 else {source=globalThis.document.createElement('canvas');source.width=900;source.height=60;const context=source.getContext('2d');check(context,'text disclosure canvas is unavailable');context.fillStyle='#f5f8f2';context.fillRect(0,0,900,60);}
 const result=await encodeSourceViewPng(source,independentObjectPngCaptions(saved,payload,applicationVersion),{pixelRatio:saved.view.status==='rendered'?Math.max(1,source.width/source.getBoundingClientRect().width):1,assertCurrent,appendReceipt:blob=>appendIndependentObjectPng(blob,saved,payload,applicationVersion)});assertCurrent();return result;
}
