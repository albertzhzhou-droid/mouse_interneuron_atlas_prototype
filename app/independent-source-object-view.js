import iteration from '../data/research-renderer-runtime-inputs-2.91.json' with { type: 'json' };
import nativeBase from '../data/neurolucida-native-contour-admission-catalog-0.3.json' with { type: 'json' };
import nativeDelta from '../data/neurolucida-native-contour-admission-catalog-0.4.json' with { type: 'json' };
import micronsReference from '../data/microns-observed-cell-nucleus-reference-0.1.json' with { type: 'json' };
import bancMorphologyRoute from '../data/banc-v888-in14a018-morphology-route-0.1.json' with { type: 'json' };
import superClemReference from '../data/super-clem-palm-localization-reference-0.1.json' with { type: 'json' };
import microStructFormerReference from '../data/microstructformer-ultrastructure-reference-0.1.json' with { type: 'json' };
import nativeContourDerivedSurface from '../data/native-contour-derived-soma-surface-0.1.json' with { type: 'json' };
import nativeContourCrosswalk from '../data/neurolucida-dat-swc-crosswalk-0.1.json' with { type: 'json' };
import bancCandidateAudit from '../data/banc-v888-candidate-audit-0.1.json' with { type: 'json' };
import nativeContourSourceContext from '../data/native-contour-source-context-0.1.json' with { type: 'json' };
import { REVISION } from 'three';
import { buildIndependentSourceObjectIndex, findIndependentSourceObject, listIndependentSourceObjects, exportIndependentSourceObject } from './independent-source-objects.js';
import { assertVerifiedIndependentSourcePayload } from './independent-source-object-loader.js';
import { independentSourceReplayExport, validateIndependentSourceViewReplay } from './independent-source-workspace-state.js';
import { independentSourceIdentityHierarchy } from './source-object-identity.js';

export const INDEPENDENT_OBJECT_VIEW_INDEX = buildIndependentSourceObjectIndex({nativeContourCatalog:{...nativeDelta,baseCatalogSnapshot:nativeBase,records:[...nativeBase.records,...nativeDelta.addedRecords]},micronsReference,bancMorphologyRoute,superClemReference,microStructFormerReference,nativeContourDerivedSurface,nativeContourCrosswalk,bancCandidateAudit,nativeContourSourceContext});
const corePaths = ['app/IndependentSourceObjectWorkspace.tsx','app/IndependentSourceObjectViewport.tsx','app/independent-source-workspace.css','app/academic-interface.css', 'app/ResearchCollectionPage.tsx', 'app/ResearchRoutePage.tsx', 'app/SiteNavigation.tsx', 'app/site-navigation.ts', 'app/site-navigation.css', 'app/research-pages.css','app/independent-source-workspace-types.ts','app/independent-source-objects.js','app/independent-source-object-loader.js','app/independent-source-object-loader.d.ts','app/independent-source-workspace-state.js','app/independent-source-object-view.js','app/independent-source-object-view.d.ts','app/independent-source-object-png.js','app/independent-source-object-png.d.ts','app/source-object-identity.js','app/source-object-identity.d.ts','app/SourceIdentityHierarchyPanel.tsx','app/source-identity-hierarchy.css','app/source-list-roving-focus.js','app/source-list-roving-focus.d.ts','app/useSourceListRovingFocus.ts','app/source-list-keyboard.css','app/neurolucida-native-contour-admission.js','app/native-contour-derived-soma-surface.js','app/banc-v888-in14a018-morphology-route.js','app/source-view-png-raster.js','app/source-view-png-raster.d.ts','app/native-contour-png-export.js','app/main-scene-source-view.js','data/neurolucida-native-contour-admission-catalog-0.3.json','data/neurolucida-native-contour-admission-catalog-0.4.json','data/microns-observed-cell-nucleus-reference-0.1.json','data/banc-v888-in14a018-morphology-route-0.1.json','data/super-clem-palm-localization-reference-0.1.json','data/microstructformer-ultrastructure-reference-0.1.json','data/native-contour-derived-soma-surface-0.1.json','data/neurolucida-dat-swc-crosswalk-0.1.json','data/banc-v888-candidate-audit-0.1.json','data/native-contour-source-context-0.1.json','package.json','package-lock.json'];
const runtimeIds = new Set(['native-contours','derived-open-shell','asset-manifest','parent-cell-row','swc','palm-points']);
const records = INDEPENDENT_OBJECT_VIEW_INDEX.sources.flatMap(source=>listIndependentSourceObjects(INDEPENDENT_OBJECT_VIEW_INDEX,{sourceId:source.sourceId,limit:25}).records);
const assetPaths = records.flatMap(record=>record.files.filter(file=>runtimeIds.has(file.id)&&file.path?.startsWith('/data/')&&file.checksum?.algorithm==='SHA-256').map(file=>'public'+file.path));
const meshPaths = ['cell.positions.f32le.bin','cell.triangles.u32le.bin','nucleus.positions.f32le.bin','nucleus.triangles.u32le.bin'].map(name=>'public/data/microns_phase1_v185_4_root_648518346349516051_v1/browser/'+name);
const paths = [...new Set([...corePaths,...assetPaths,...meshPaths])];
export const INDEPENDENT_OBJECT_VIEW_BUILD = Object.freeze({applicationVersion:'2.91.0-research.1',scope:'specified_objects_workspace_native_geometry_identity_replay_png_and_dependency_inputs',inputs:Object.freeze(paths.map(path=>{
 const rows=iteration.authoritativeInputs.filter(row=>row.path===path);if(rows.length!==1||!Number.isSafeInteger(rows[0].bytes)||rows[0].bytes<=0||!/^[a-f0-9]{64}$/.test(rows[0].sha256))throw new Error('Independent object build receipt is missing: '+path);
 return Object.freeze({path,bytes:rows[0].bytes,sha256:rows[0].sha256});
}))});
const check=(ok,message)=>{if(!ok)throw new Error('Independent object view: '+message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(s)&&Number.isFinite(Date.parse(s));
const sourceTransforms=new WeakMap();
function recordFor(key){const record=findIndependentSourceObject(INDEPENDENT_OBJECT_VIEW_INDEX,key);check(record,'exact source object is unavailable');return record;}
function validEvent(event){check(event&&Object.keys(event).length===5&&Number.isSafeInteger(event.verificationSequence)&&event.verificationSequence>0&&validDate(event.verifiedAt)&&['default','no-store'].includes(event.requestCacheMode)&&Number.isSafeInteger(event.verifiedFileCount)&&event.verifiedFileCount>=0&&['verified_selected_runtime_source_bytes','source_contract_only_no_runtime_asset_bytes','exact_row_reference_only_no_geometry_or_bytes'].includes(event.authority),'saved source event is invalid');}
function stableReceipt(receipt){const result=structuredClone(receipt);delete result.runtimeVerification;return result;}
function expectedViewFiles(record,view){
 const kind=record.viewer.kind;
 const ids=kind==='native_contours'?['native-contours',...(view.layers.some(layer=>layer.id==='derived-open-shell')?['derived-open-shell']:[])]:kind==='microns_mesh'?['asset-manifest','parent-cell-row',...record.components.flatMap(component=>[component.id+'-positions',component.id+'-triangles'])]:kind==='banc_swc'?['swc']:kind==='palm_detection'?['palm-points']:[];
 return ids.map(fileId=>{
  const file=record.files.find(file=>file.id===fileId);
  const path=file?.path??(kind==='microns_mesh'?'public/data/microns_phase1_v185_4_root_648518346349516051_v1/browser/'+fileId.replace(/-positions$/,'.positions.f32le.bin').replace(/-triangles$/,'.triangles.u32le.bin'):null);
  const pin=INDEPENDENT_OBJECT_VIEW_BUILD.inputs.find(input=>input.path===(path?.startsWith('/data/')?'public'+path:path));
  check(pin,'exact saved runtime file has no current source build receipt');
  if(file)check(file.bytes===pin.bytes&&file.checksum?.algorithm==='SHA-256'&&file.checksum.digest===pin.sha256,'declared runtime file differs from the current source build');
  return {fileId,path:pin.path.slice(6),bytes:pin.bytes,checksum:{algorithm:'SHA-256',digest:pin.sha256},status:'verified'};
 });
}
export function independentObjectSourceTransform(payload,record){
 assertVerifiedIndependentSourcePayload(record,payload);
 if(sourceTransforms.has(payload))return sourceTransforms.get(payload);
 const minimum=[Infinity,Infinity,Infinity],maximum=[-Infinity,-Infinity,-Infinity];const include=point=>{for(let axis=0;axis<3;axis++){const v=point[axis]??0;check(Number.isFinite(v),'native geometry extent is invalid');minimum[axis]=Math.min(minimum[axis],v);maximum[axis]=Math.max(maximum[axis],v);}};
 payload.edges.forEach(edge=>edge.forEach(include));payload.points.forEach(point=>include(point.position));payload.contours.forEach(contour=>contour.points.forEach(include));payload.meshes.forEach(mesh=>{const positions=mesh.positions;for(let i=0;i<positions.length;i+=3)include([positions[i],positions[i+1],positions[i+2]]);});
 if(minimum.some(v=>!Number.isFinite(v)))return null;
 const transform=Object.freeze({centerNative:Object.freeze(minimum.map((v,axis)=>(v+maximum[axis])/2)),scale:200/Math.max(...maximum.map((v,axis)=>v-minimum[axis]),Number.EPSILON),coordinateFrame:record.coordinateFrame});sourceTransforms.set(payload,transform);return transform;
}
export function preflightIndependentObjectView(document,applicationVersion){
 check(document?.independentObjectViewSchemaVersion==='0.2.0'&&same(document.rendererBuild,INDEPENDENT_OBJECT_VIEW_BUILD)&&applicationVersion===INDEPENDENT_OBJECT_VIEW_BUILD.applicationVersion&&validDate(document.generatedAt),'source/render/identity/export build changed or view schema is unsupported');
 const record=recordFor(document?.object?.key);check(same(document.object,exportIndependentSourceObject(record).object),'saved exact source context or declared receipts changed');check(same(document.sourceIdentity,independentSourceIdentityHierarchy(INDEPENDENT_OBJECT_VIEW_INDEX,record.key)),'saved physical parent identity or source namespace changed');validEvent(document.verification?.runtimeVerification);
 check(document.view?.verificationRevision>=0&&Number.isSafeInteger(document.view.verificationRevision)&&typeof document.view.revision==='string'&&document.view.revision.startsWith(record.key+':'),'saved renderer generation is invalid');
 const result=validateIndependentSourceViewReplay(INDEPENDENT_OBJECT_VIEW_INDEX,document,applicationVersion);
 const files=expectedViewFiles(record,result.view),event=document.verification.runtimeVerification;
 check(same(document.verification.verifiedFiles,files)&&event.verifiedFileCount===files.length,'saved runtime file set or hash differs from the exact current source build');
 check(event.authority===(record.viewer.kind==='link_only'?'exact_row_reference_only_no_geometry_or_bytes':files.length?'verified_selected_runtime_source_bytes':'source_contract_only_no_runtime_asset_bytes'),'saved source byte authority differs from its exact runtime file scope');
 check(same(document.verification.sourceOnlyFiles,record.files.filter(file=>!files.some(verified=>verified.fileId===file.id))),'saved source-only declarations differ from the exact source contract');
 if(result.view.status==='rendered'){check(result.view.renderer.version===REVISION,'renderer version changed');const c=result.view.camera;check(c.fov===38&&c.near===.1&&c.far===4000&&same(c.up,[0,1,0])&&Math.hypot(c.position[0]-c.target[0],c.position[2]-c.target[2])>1e-9,'camera projection or basis is invalid');check(same(result.view.clipping,{globalPlanes:[],localClippingEnabled:false}),'clipping does not match this source viewer');if(record.coordinateFrame.dimensions===2)check(close(c.position.slice(0,2),c.target.slice(0,2)),'the source-native 2D plane cannot be rotated');}
 else check(result.view.clipping===null,'text/reference status cannot declare geometry clipping');
 return result;
}
export function validateIndependentObjectView(document,payload,applicationVersion){
 const result=preflightIndependentObjectView(document,applicationVersion);assertVerifiedIndependentSourcePayload(result.record,payload);
 check(document.verification.runtimeVerification.authority===payload.receipt.runtimeVerification.authority&&document.verification.runtimeVerification.verifiedFileCount===payload.receipt.runtimeVerification.verifiedFileCount,'saved source event changed its byte-verification authority');
 check(same(stableReceipt(document.verification),stableReceipt(payload.receipt)),'saved verification scope differs from the exact current source producer');
 if(result.view.status==='rendered')check(same(result.view.displayTransform,independentObjectSourceTransform(payload,result.record)),'saved display transform differs from current private native geometry');
 return result;
}
export function exportIndependentObjectView(key,payload,view,applicationVersion,verificationRevision){
 const record=recordFor(key);assertVerifiedIndependentSourcePayload(record,payload);check(view?.verificationRevision===verificationRevision,'actual renderer generation is stale');
 const document={...independentSourceReplayExport(record,payload,view,applicationVersion,INDEPENDENT_OBJECT_VIEW_INDEX),independentObjectViewSchemaVersion:'0.2.0',generatedAt:new Date().toISOString(),rendererBuild:INDEPENDENT_OBJECT_VIEW_BUILD};validateIndependentObjectView(document,payload,applicationVersion);return structuredClone(document);
}
function close(a,b){if(typeof a==='number'&&typeof b==='number')return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8+1e-8*Math.max(Math.abs(a),Math.abs(b));if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>close(v,b[i]));if(a&&b&&typeof a==='object'&&typeof b==='object')return Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&close(a[k],b[k]));return a===b;}
export function assertIndependentObjectViewApplied(document,payload,actualView,applicationVersion,previousPayload,revision){
 const {record}=validateIndependentObjectView(document,payload,applicationVersion);const actual=exportIndependentObjectView(record.key,payload,actualView,applicationVersion,revision);const event=assertVerifiedIndependentSourcePayload(record,payload);
 check(event.requestCacheMode==='no-store'&&(!previousPayload||event.verificationSequence>assertVerifiedIndependentSourcePayload(record,previousPayload).verificationSequence),'restore requires a new current-page source verification event');
 check(['camera','layers','clipping','displayTransform','representation','status'].every(key=>close(document.view[key],actual.view[key])),'actual applied source view differs from the saved pose or layers');return true;
}
