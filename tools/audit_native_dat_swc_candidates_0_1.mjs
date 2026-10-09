#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readVerifiedNativeContours,nativeContourVerification} from '../app/native-contour-verification.js';
import {buildStandardizationLogAudit,LOG_AUDIT_PATH} from './audit_nmo249676_standardization_logs_0_1.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const CANDIDATE_IDS=Object.freeze([249676,50424,50394,50408,45674,108978]);
export const PROTOCOL_PATH='docs/NATIVE_DAT_SWC_CANDIDATE_PROTOCOL_2026-10-03.md';
export const AUDIT_PATH='data/native-dat-swc-candidate-audit-0.1.json';
const routes={249676:'dorsal_horn_observed_morphology_route_pack_v1',50424:'functional_class_observed_morphology_route_pack_v1',50394:'prp_dorsal_horn_observed_morphology_route_pack_v1',50408:'prp_dorsal_horn_observed_morphology_route_pack_v1',45674:'functional_class_observed_morphology_route_pack_v1',108978:'neuromorpho_release_8_6_124_census_v1'};
const sha=b=>createHash('sha256').update(b).digest('hex');

export function contourArithmeticMean(contour){
 assert.ok(contour.points.length>0);const n=contour.points.length;
 return [0,1,2].map(axis=>contour.points.reduce((sum,p)=>sum+p[axis]/n,0));
}
export function contourPolygonCentroid(contour){
 const points=contour.points;let twiceArea=0,x=0,y=0;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],cross=a[0]*b[1]-b[0]*a[1];twiceArea+=cross;x+=(a[0]+b[0])*cross;y+=(a[1]+b[1])*cross;}
 assert.ok(Number.isFinite(twiceArea)&&Math.abs(twiceArea)>1e-9,'Degenerate XY area centroid');
 return [x/(3*twiceArea),y/(3*twiceArea),points[0][2]];
}

export function fitCandidateFamily(source,target,indices,family,zOffsetMicrometre){
 assert.ok(['proper_similarity','reflected_similarity'].includes(family));
 assert.ok(indices.length>=3&&new Set(indices).size===indices.length);
 const mean=rows=>[0,1].map(axis=>indices.reduce((sum,i)=>sum+rows[i][axis]/indices.length,0));
 const sm=mean(source),tm=mean(target);let xx=0,yy=0,xy=0,an=0,bn=0;
 for(const i of indices){const dx=source[i][0]-sm[0],dy=source[i][1]-sm[1],tx=target[i][0]-tm[0],ty=target[i][1]-tm[1];xx+=dx*dx;yy+=dy*dy;xy+=dx*dy;
  if(family==='proper_similarity'){an+=dx*tx+dy*ty;bn+=dx*ty-dy*tx;}else{an+=dx*tx-dy*ty;bn+=dy*tx+dx*ty;}}
 const denominator=xx+yy,determinant=xx*yy-xy*xy;
 assert.ok(denominator>0&&determinant>Number.EPSILON*16*denominator*denominator,'Landmarks do not identify a two-dimensional family');
 const a=an/denominator,b=bn/denominator;
 return {family,a,b,sourceXYMean:sm,targetXYMean:tm,zOffsetMicrometre,scale:Math.hypot(a,b),determinant:(family==='proper_similarity'?1:-1)*(a*a+b*b),trainingCovariance:{xx,yy,xy,determinant}};
}
export function mapCandidatePoint(point,fit){
 const x=point[0]-fit.sourceXYMean[0],y=point[1]-fit.sourceXYMean[1];
 return [fit.a*x+(fit.family==='proper_similarity'?-fit.b:fit.b)*y+fit.targetXYMean[0],fit.b*x+(fit.family==='proper_similarity'?fit.a:-fit.a)*y+fit.targetXYMean[1],point[2]+fit.zOffsetMicrometre];
}
function residuals(source,target,fit,indices,grid){
 const rows=indices.map(i=>{const p=mapCandidatePoint(source[i],fit),delta=p.map((v,axis)=>v-target[i][axis]);return{pairIndex:i,deltaXMicrometre:delta[0],deltaYMicrometre:delta[1],deltaZMicrometre:delta[2],xyEuclideanMicrometre:Math.hypot(delta[0],delta[1]),withinExploratoryXYHalfGrid:Math.abs(delta[0])<=grid/2+1e-9&&Math.abs(delta[1])<=grid/2+1e-9};});
 return {pairCount:rows.length,rmsXYMicrometre:Math.sqrt(rows.reduce((s,r)=>s+r.xyEuclideanMicrometre**2,0)/rows.length),maximumXYMicrometre:Math.max(...rows.map(r=>r.xyEuclideanMicrometre)),maximumAbsoluteZMicrometre:Math.max(...rows.map(r=>Math.abs(r.deltaZMicrometre))),allWithinExploratoryXYHalfGrid:rows.every(r=>r.withinExploratoryXYHalfGrid),rows};
}
function parseSwc(text){
 const lines=text.split(/\r?\n/),rows=[],tokens=[],statements=[];
 for(let i=0;i<lines.length;i++){const line=lines[i].trim();if(!line)continue;if(line.startsWith('#')){const match=line.match(/original file has (\d+) soma contours that are averaged into (\d+) soma points/);if(match)statements.push({line:i+1,text:line,nativeContourCount:Number(match[1]),somaPointCount:Number(match[2])});continue;}
  const fields=line.split(/\s+/);assert.equal(fields.length,7);const row=fields.map(Number);assert.ok(row.every(Number.isFinite));rows.push(row);if(row[1]===1)tokens.push(fields);
 }
 return {rows,soma:rows.filter(r=>r[1]===1),somaTokens:tokens,headerStatements:statements};
}
function observedXYGrid(tokens){
 const decimals=tokens.flatMap(r=>r.slice(2,4)).map(v=>{assert.ok(/^-?\d+(?:\.\d+)?$/.test(v),'Unsupported serialized coordinate notation');return v.includes('.')?v.split('.')[1].length:0;});
 const maximumPrintedDecimalPlaces=Math.max(...decimals);return {maximumPrintedDecimalPlaces,gridMicrometre:10**(-maximumPrintedDecimalPlaces),interpretation:'Observed SWC XY serialization grid; nearest-grid rounding is an unverified exploratory hypothesis, not source measurement accuracy.'};
}
function stableProofs(payload,id){
 const proofs=structuredClone(nativeContourVerification(id,payload));
 for(const v of Object.values(proofs))if(v){delete v.verifiedAt;delete v.verificationSequence;delete v.requestCacheMode;}
 return proofs;
}

export function auditCandidateCorrespondence(neuronId,payload,swcText){
 // Only an actual original-DAT / complete-inventory / admitted-coordinate producer authorizes this analysis.
 const sourceProofs=stableProofs(payload,neuronId),swc=parseSwc(swcText),contours=payload.contours,names=[...new Set(contours.map(c=>c.sourceName))],sourceZ=contours.map(c=>[...new Set(c.points.map(p=>p[2]))]),targetZ=swc.soma.map(r=>r[4]),reasons=[];
 if(names.length!==1)reasons.push('multiple_exact_source_name_groups');
 if(sourceZ.some(z=>z.length!==1))reasons.push('native_contour_spans_multiple_z_values');
 if(new Set(sourceZ.filter(z=>z.length===1).map(z=>z[0])).size!==contours.length)reasons.push('repeated_or_nonplanar_native_z_prevents_unique_matching');
 if(new Set(targetZ).size!==targetZ.length)reasons.push('repeated_swc_soma_z_prevents_unique_matching');
 if(contours.length!==swc.soma.length)reasons.push('native_contour_and_swc_soma_point_counts_differ');
 if(swc.headerStatements.length!==1)reasons.push('one_explicit_header_contour_to_point_statement_unavailable');
 else if(swc.headerStatements[0].nativeContourCount!==contours.length||swc.headerStatements[0].somaPointCount!==swc.soma.length)reasons.push('header_statement_count_disagrees_with_exact_inputs');
 const base={neuronId,assetId:`NeuroMorpho:${neuronId}`,sourceFrame:payload.sourceFrame,targetFrame:'NeuroMorpho_CNG_standardized_local_frame',sourceProofs,sourceContourCount:contours.length,sourceVertexCount:contours.reduce((s,c)=>s+c.points.length,0),swcSomaPointCount:swc.soma.length,swcNodeCount:swc.rows.length,headerStatements:swc.headerStatements,exactSourceNames:names,sourceOrder:contours.map((c,i)=>({contourId:c.id,sourceOrderIndex:i,zValuesMicrometre:sourceZ[i],vertexCount:c.points.length,sourceClosedFlag:c.sourceClosedFlag,interpretedClosed:c.interpretedClosed})),swcSomaSourceOrder:swc.soma.map(r=>({nodeId:r[0],parentId:r[6],positionMicrometre:r.slice(2,5)})),observedSWCXYSerialization:observedXYGrid(swc.somaTokens),newGeometryAdmissionCount:0,newSurfaceVolumeInternalObjectCount:0,sameCellInternalJoinCount:0,registrationCount:0};
 if(reasons.length)return {...base,status:'correspondence_held_under_declared_method',reasons,zTranslationCandidates:[],matchedPairs:[],modelEvaluations:[]};
 const zs=sourceZ.map(z=>z[0]),targetSet=new Set(targetZ),offsets=[...new Set(targetZ.map(z=>z-zs[0]))].filter(offset=>zs.every(z=>targetSet.has(z+offset)));
 if(offsets.length!==1)return {...base,status:'correspondence_held_under_declared_method',reasons:['unique_full_set_constant_z_translation_unavailable'],zTranslationCandidates:offsets,matchedPairs:[],modelEvaluations:[]};
 const offset=offsets[0],pairs=contours.map((c,i)=>{const node=swc.soma.find(r=>r[4]===zs[i]+offset);return {contourId:c.id,sourceOrderIndex:i,swcNodeId:node[0],swcParentId:node[6],sourceZMicrometre:zs[i],swcPositionMicrometre:node.slice(2,5),nativeArithmeticMeanMicrometre:contourArithmeticMean(c),nativePolygonCentroidMicrometre:contourPolygonCentroid(c)};}).sort((a,b)=>a.sourceZMicrometre-b.sourceZMicrometre);
 const n=pairs.length,primaryFit=Array.from({length:Math.floor(2*n/3)},(_,i)=>i),primaryHeld=Array.from({length:n-primaryFit.length},(_,i)=>i+primaryFit.length),even=Array.from({length:n},(_,i)=>i).filter(i=>i%2===0),odd=Array.from({length:n},(_,i)=>i).filter(i=>i%2===1),splits=[{name:'primary_numeric_z_two_thirds',fit:primaryFit,held:primaryHeld},{name:'alternating_numeric_z_sensitivity',fit:even,held:odd}],target=pairs.map(p=>p.swcPositionMicrometre),evaluations=[];
 for(const averaging of ['arithmetic_mean_primary','polygon_area_centroid_alternative'])for(const family of ['proper_similarity','reflected_similarity'])for(const split of splits){assert.ok(split.fit.length>=3&&split.held.length>=3);assert.ok(split.fit.every(i=>!split.held.includes(i)));const source=pairs.map(p=>averaging==='arithmetic_mean_primary'?p.nativeArithmeticMeanMicrometre:p.nativePolygonCentroidMicrometre),fit=fitCandidateFamily(source,target,split.fit,family,offset);
  evaluations.push({averagingHypothesis:averaging,family,split:split.name,fitPairIndices:split.fit,heldOutPairIndices:split.held,fitPairIds:split.fit.map(i=>({contourId:pairs[i].contourId,swcNodeId:pairs[i].swcNodeId})),heldOutPairIds:split.held.map(i=>({contourId:pairs[i].contourId,swcNodeId:pairs[i].swcNodeId})),fit,training:residuals(source,target,fit,split.fit,base.observedSWCXYSerialization.gridMicrometre),heldOut:residuals(source,target,fit,split.held,base.observedSWCXYSerialization.gridMicrometre)});
 }
 return {...base,status:'unique_numeric_z_soma_landmark_candidate',reasons:[],zTranslationCandidates:offsets,zOffsetMicrometre:offset,matchedPairs:pairs,modelEvaluations:evaluations,displayAdmission:'held: this numerical audit does not establish a source/view display contract',physicalSectionCorrespondenceEstablished:false,sourceDepositedVertexToNodeIdentity:false,sourceRoundingRuleEstablished:false,biologicalToleranceCalibrated:false};
}

export async function buildNativeDatSwcCandidateAudit({root=ROOT,readImpl=readFile}={}){
 const read=p=>readImpl(path.join(root,p));
 const current=JSON.parse(await read('data/research-iteration-manifest-2.91.json')),pins=new Map(current.authoritativeInputs.map(p=>[p.path,p]));
 const readPinned=async p=>{const pin=pins.get(p);assert.ok(pin,`Missing authoritative pin ${p}`);const b=await read(p);assert.equal(b.length,pin.bytes,p);assert.equal(sha(b),pin.sha256,p);return {bytes:b,receipt:{path:p,bytes:b.length,sha256:sha(b)}};};
 const frameAuthority=await readPinned('data/morphology-source-frame-disclosure-0.1.json'),frames=JSON.parse(frameAuthority.bytes);
 const readSourceGeometry=async id=>{const matches=frames.records.filter(r=>r.neuronId===id);assert.equal(matches.length,1);const declared=matches[0].geometryReceipt,expected=`/data/${routes[id]}/geometry/nmo-${id}.json`;const sourceUrl=declared.path.startsWith('/')?declared.path:`/data/${routes[id]}/${declared.path}`;assert.equal(sourceUrl,expected);const p='public'+sourceUrl,b=await read(p);assert.equal(b.length,declared.bytes,p);assert.equal(sha(b),declared.sha256,p);return {bytes:b,receipt:{path:p,bytes:b.length,sha256:sha(b),pinAuthority:frameAuthority.receipt.path+' / records / '+id},rawSwcSha256:declared.rawSwcSha256};};
 // Native assets have exact hierarchical pins in their canonical source catalogues.
 // The private producer below checks each actual byte stream against those pins.
 const fetchActual=async(url,options)=>{assert.equal(options.cache,'no-store');const bytes=await read('public'+url);return {ok:true,status:200,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length)};};
 const records=[];
 for(const id of CANDIDATE_IDS){const payload=await readVerifiedNativeContours(id,{forceReload:true,fetchImpl:fetchActual}),geometry=await readSourceGeometry(id),g=JSON.parse(geometry.bytes);
  const rawPath=`public/data/${routes[id]}/swc/nmo-${id}.swc`;assert.equal(g.swc.path,`swc/nmo-${id}.swc`);assert.ok(Number.isSafeInteger(g.swc.bytes)&&g.swc.bytes>0&&/^[0-9a-f]{64}$/.test(g.swc.sha256));
  assert.equal(g.swc.sha256,geometry.rawSwcSha256);const rawBytes=await read(rawPath);assert.equal(rawBytes.length,g.swc.bytes,rawPath);assert.equal(sha(rawBytes),g.swc.sha256,rawPath);
  const swc={bytes:rawBytes,receipt:{path:rawPath,bytes:rawBytes.length,sha256:sha(rawBytes),pinAuthority:geometry.receipt.path+' / swc'}};const parsed=parseSwc(swc.bytes.toString('utf8'));
  assert.equal(g.neuronId,id);assert.equal(g.assetId,`NeuroMorpho:${id}`);assert.equal(g.sourceFrame,'NeuroMorpho_CNG_standardized_local_frame');assert.deepEqual(parsed.rows,g.nodes,`Original SWC / canonical geometry node tuple mismatch for ${id}`);
  records.push({...auditCandidateCorrespondence(id,payload,swc.bytes.toString('utf8')),standardizedSwcReceipt:swc.receipt,standardizedGeometryReceipt:geometry.receipt});
 }
 const logAudit=await buildStandardizationLogAudit({root,readImpl}),logBytes=await read(LOG_AUDIT_PATH);assert.deepEqual(JSON.parse(logBytes),logAudit,'Standardization log sidecar is stale');
 const protocol=await read(PROTOCOL_PATH),generatorPath='tools/audit_native_dat_swc_candidates_0_1.mjs',generator=await read(generatorPath);
 return {schemaVersion:'0.1.0',auditId:'native-dat-swc-candidate-audit-0.1',auditDate:'2026-10-03',authority:'EXACT_SOURCE_NUMERIC_SOMA_LANDMARK_CANDIDATE_AUDIT_NOT_DISPLAY_ADMISSION',standardizationLogAudit:{path:LOG_AUDIT_PATH,bytes:logBytes.length,sha256:sha(logBytes),summary:logAudit.summary,transformOrDisplayAdmission:false},protocolReceipt:{path:PROTOCOL_PATH,bytes:protocol.length,sha256:sha(protocol)},generatorReceipt:{path:generatorPath,bytes:generator.length,sha256:sha(generator)},method:{candidateSource:'Six already checksum-pinned exact mouse-spinal morphology records; existing45718 relation excluded',pairing:'One unique full-set z translation with unique planar native and SWC soma z; no nearest-neighbour XY fitting or inferred source order correspondence',averaging:'Arithmetic mean of exact original vertices primary; polygon-area centroid alternative declared before fitting',modelFamilies:['proper_similarity','reflected_similarity'],splitPolicy:'Primary first floor(2N/3) numeric-z pairs versus remaining held out; alternating even fit versus odd held out',quantization:'Observed serialized SWC XY grid, exploratory half-grid interval with1e-9µm software guard; deposited rounding method remains unknown',scientificBoundary:'No copied45718 coefficients or threshold, source changes, biological calibration, anatomical section ordering, geometry or internal admission, or registration'},summary:{sourceRecords:records.length,uniqueNumericZSomaLandmarkCandidates:records.filter(r=>r.status==='unique_numeric_z_soma_landmark_candidate').length,heldSourceRecords:records.filter(r=>r.status==='correspondence_held_under_declared_method').length,evaluatedModels:records.reduce((s,r)=>s+r.modelEvaluations.length,0),newGeometryAdmissions:0,newCanonicalProfiles:0,newSameCellInternalJoins:0,registrations:0},records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const audit=await buildNativeDatSwcCandidateAudit();if(process.argv.includes('--write'))await writeFile(path.join(ROOT,AUDIT_PATH),JSON.stringify(audit,null,2)+'\n');
 console.log(JSON.stringify({audit:audit.summary,candidates:audit.records.filter(r=>r.matchedPairs.length).map(r=>({id:r.neuronId,zOffset:r.zOffsetMicrometre,models:r.modelEvaluations.map(m=>({averaging:m.averagingHypothesis,family:m.family,split:m.split,max:m.heldOut.maximumXYMicrometre,withinHalfGrid:m.heldOut.allWithinExploratoryXYHalfGrid}))}))}));
}
