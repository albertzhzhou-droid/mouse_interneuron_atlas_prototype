import runtime from "../data/research-renderer-runtime-inputs-2.91.json" with { type: "json" };
import { nativeContourVerification, nativeContourSourceHierarchy, canonicalNativeContourSource } from "./native-contour-verification.js";

export const NATIVE_CONTOUR_DIAGNOSTIC_LIMITS = Object.freeze({ centroidShiftMicrometre: 1.5, areaRatio: 1.6, cyclicRmsMicrometre: 1.5 });
export const NATIVE_CONTOUR_DIAGNOSTIC_PRESETS = Object.freeze({ centroidShiftMicrometre: Object.freeze([0.75,1.5,3]), areaRatio: Object.freeze([1.2,1.6,2.4]), cyclicRmsMicrometre: Object.freeze([0.75,1.5,3]) });
const inputPaths = ["app/NativeContourRecordViewer.tsx","app/NativeContourDiagnosticsDisclosure.tsx","app/NativeContourDiagnostics.tsx","app/native-contour-diagnostics.js","app/native-contour-diagnostics.d.ts","app/native-contour-diagnostics.css","app/academic-interface.css", "app/ResearchCollectionPage.tsx", "app/ResearchRoutePage.tsx", "app/SiteNavigation.tsx", "app/site-navigation.ts", "app/site-navigation.css", "app/research-pages.css","app/native-contour-verification.js","app/neurolucida-native-contour-admission.js","app/neurolucida-native-detail-admission.js","app/neurolucida-dat-inventory.js","app/neurolucida-dat-file-admission.js","app/native-dat-manifest-transport.js","data/neurolucida-native-contour-admission-catalog-0.3.json","data/neurolucida-native-contour-admission-catalog-0.4.json","data/native-contour-source-context-0.1.json","data/neurolucida-dat-file-manifest-0.1.json","data/native-dat-manifest-transport-0.1.json","package-lock.json"];
function assert(ok,message){if(!ok)throw new Error(`Native contour diagnostics: ${message}`);}
export const NATIVE_CONTOUR_DIAGNOSTIC_BUILD = Object.freeze({applicationVersion:"2.91.0-research.1",scope:"specified_source_native_numeric_diagnostic_software_inputs",inputs:Object.freeze(inputPaths.map(path=>{const rows=runtime.authoritativeInputs.filter(r=>r.path===path);assert(rows.length===1&&Number.isSafeInteger(rows[0].bytes)&&rows[0].bytes>0&&/^[a-f0-9]{64}$/.test(rows[0].sha256),"missing current diagnostic build input: "+path);return Object.freeze({...rows[0]});}))});
const freeze=value=>{if(value&&typeof value==="object"){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const privateAnalyses=new WeakMap();
const scope=Object.freeze({coordinateFrame:"Neurolucida_DAT_source_native_unregistered",units:"source_reported_micrometre",grouping:"exact_source_name_within_one_repository_record",ordering:"ascending_unique_numeric_z_only_not_anatomical_section_order",physicalSectionCorrespondenceEstablished:false,independentBiologicalToleranceCalibration:false,sourcePointRepair:false,spatialRegistration:false,sourceGeometryChanged:false,sourceContextApiByteVerification:"declared_only",sourceCoordinateAndTraceRadiusPreserved:true,traceRadiusUsedAsThickness:false,newSurfaceAdmissionCount:0,observedMembraneCount:0,volumeCount:0,internalStructureCount:0,sameCellJoinCount:0,registrationCount:0,biologicalMeasurementCount:0});
const method=Object.freeze({algorithmId:"source_native_xy_polygon_and_128_sample_cyclic_phase_diagnostics_v1",sampleCount:128,xyTopologyEpsilon:1e-9,centroid:"signed_xy_polygon_centroid",areaRatio:"maximum_absolute_xy_polygon_area_ratio",cyclicRms:"full_precision_absolute_xy_distances_after_winding_normalization_and_cyclic_index_phase_only",displayDecimalPlaces:4,thresholdComparison:"unrounded_double_precision",diagnosticSamplesPublishedAsGeometry:false});
function signedArea(points) {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    twiceArea += current[0] * next[1] - next[0] * current[1];
  }
  return twiceArea * 0.5;
}

function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a, b, point, epsilon = 1e-9) {
  return Math.abs(orientation(a, b, point)) <= epsilon
    && point[0] >= Math.min(a[0], b[0]) - epsilon
    && point[0] <= Math.max(a[0], b[0]) + epsilon
    && point[1] >= Math.min(a[1], b[1]) - epsilon
    && point[1] <= Math.max(a[1], b[1]) + epsilon;
}

function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  if (((abC > 0 && abD < 0) || (abC < 0 && abD > 0))
    && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0))) return true;
  return onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}

function findSelfIntersections(points) {
  assert(points.length >= 3, "Source contour has fewer than three vertices");
  assert(Math.abs(signedArea(points)) > 1e-9, "Source contour has degenerate planar area");
  const pairs = [];
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length;
    if (Math.hypot(points[first][0] - points[firstNext][0], points[first][1] - points[firstNext][1]) <= 1e-9) continue;
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length;
      if (second === firstNext || secondNext === first) continue;
      if (Math.hypot(points[second][0] - points[secondNext][0], points[second][1] - points[secondNext][1]) <= 1e-9) continue;
      if (segmentsIntersect(points[first], points[firstNext], points[second], points[secondNext])) pairs.push([first, second]);
    }
  }
  return pairs;
}

function contourCentroid(points) {
  const area = signedArea(points);
  let x = 0;
  let y = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    x += (current[0] + next[0]) * cross;
    y += (current[1] + next[1]) * cross;
  }
  return [x / (6 * area), y / (6 * area)];
}

function normalizeWinding(points) {
  return signedArea(points) > 0 ? points : [...points].reverse();
}

function resampleClosedPolyline(points, sampleCount) {
  const edges = points.map((from, index) => {
    const to = points[(index + 1) % points.length];
    return { from, to, length: Math.hypot(to[0] - from[0], to[1] - from[1]) };
  });
  const perimeter = edges.reduce((sum, edge) => sum + edge.length, 0);
  assert(Number.isFinite(perimeter) && perimeter > 0, "Contour perimeter is invalid");
  const samples = [];
  let edgeIndex = 0;
  let edgeStart = 0;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const distance = perimeter * sampleIndex / sampleCount;
    while (edgeIndex < edges.length - 1 && distance >= edgeStart + edges[edgeIndex].length) {
      edgeStart += edges[edgeIndex].length;
      edgeIndex += 1;
    }
    const edge = edges[edgeIndex];
    const t = Math.min(1, Math.max(0, (distance - edgeStart) / edge.length));
    samples.push([
      edge.from[0] + (edge.to[0] - edge.from[0]) * t,
      edge.from[1] + (edge.to[1] - edge.from[1]) * t,
    ]);
  }
  return samples;
}

function alignByCyclicPhase(reference, candidate) {
  let bestShift = 0;
  let bestSquaredError = Infinity;
  for (let shift = 0; shift < candidate.length; shift += 1) {
    let squaredError = 0;
    for (let index = 0; index < candidate.length; index += 1) {
      const first = reference[index];
      const second = candidate[(index + shift) % candidate.length];
      squaredError += (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2;
    }
    if (squaredError < bestSquaredError) {
      bestSquaredError = squaredError;
      bestShift = shift;
    }
  }
  return { phaseShift: bestShift, rms: Math.sqrt(bestSquaredError / candidate.length) };
}


function inspect(contour,index){
 const xy=contour.points.map(p=>p.slice(0,2)),z=[...new Set(contour.points.map(p=>p[2]))];
 const zeroLengthEdgeIndices=xy.flatMap((p,i)=>Math.hypot(p[0]-xy[(i+1)%xy.length][0],p[1]-xy[(i+1)%xy.length][1])<=1e-9?[i]:[]);
 const area=Math.abs(signedArea(xy));
 return {id:contour.id,sourceName:contour.sourceName,sourceOrderIndex:index,vertexCount:contour.points.length,zValuesMicrometre:z,zeroLengthEdgeIndices,selfIntersectionEdgePairs:area>1e-9?findSelfIntersections(xy):null,areaCalculable:Number.isFinite(area)&&area>1e-9,xy};
}
export function analyseNativeContourGroups(neuronId,payload){
 const verification=nativeContourVerification(neuronId,payload);
 const source=canonicalNativeContourSource(neuronId),names=[...new Set(payload.contours.map(c=>c.sourceName))];
 const groups=names.map(sourceName=>{
  const contours=payload.contours.map(inspect).filter(c=>c.sourceName===sourceName),nonPlanar=contours.filter(c=>c.zValuesMicrometre.length!==1).map(c=>c.id);
  const unique=new Map();for(const c of contours)if(c.zValuesMicrometre.length===1){const z=c.zValuesMicrometre[0];unique.set(z,[...(unique.get(z)??[]),c.id]);}
  const repeatedZ=[...unique].filter(([,ids])=>ids.length>1).map(([zMicrometre,contourIds])=>({zMicrometre,contourIds}));
  const reasons=[];if(nonPlanar.length)reasons.push("source_contour_spans_multiple_z_values");if(repeatedZ.length)reasons.push("multiple_distinct_source_contours_share_z_without_correspondence");if(contours.length<2)reasons.push("fewer_than_two_source_contours");if(contours.some(c=>!c.areaCalculable))reasons.push("degenerate_or_nonfinite_xy_polygon_area");
  const eligible=reasons.length===0,sorted=eligible?[...contours].sort((a,b)=>a.zValuesMicrometre[0]-b.zValuesMicrometre[0]):[],transitions=[];
  for(let i=1;i<sorted.length;i++){
   const from=sorted[i-1],to=sorted[i],a=contourCentroid(from.xy),b=contourCentroid(to.xy),fromArea=Math.abs(signedArea(from.xy)),toArea=Math.abs(signedArea(to.xy));
   const alignment=alignByCyclicPhase(resampleClosedPolyline(normalizeWinding(from.xy),128),resampleClosedPolyline(normalizeWinding(to.xy),128));
   transitions.push({fromContourId:from.id,toContourId:to.id,fromZMicrometre:from.zValuesMicrometre[0],toZMicrometre:to.zValuesMicrometre[0],zGapMicrometre:to.zValuesMicrometre[0]-from.zValuesMicrometre[0],centroidShiftMicrometre:Math.hypot(a[0]-b[0],a[1]-b[1]),areaRatio:Math.max(fromArea/toArea,toArea/fromArea),cyclicRmsMicrometre:alignment.rms,phaseShiftAt128Samples:alignment.phaseShift,bothSourceContoursSimple:from.selfIntersectionEdgePairs.length===0&&to.selfIntersectionEdgePairs.length===0,zeroLengthSourceEdges:from.zeroLengthEdgeIndices.length+to.zeroLengthEdgeIndices.length});
  }
  return {sourceName,status:eligible?"numeric_z_neighbours_available":"not_comparable",reasons,nonPlanarContourIds:nonPlanar,repeatedZ,sourceOrder:contours.map(c=>({id:c.id,sourceName:c.sourceName,sourceOrderIndex:c.sourceOrderIndex,vertexCount:c.vertexCount,zValuesMicrometre:c.zValuesMicrometre,zeroLengthEdgeIndices:c.zeroLengthEdgeIndices,selfIntersectionEdgePairs:c.selfIntersectionEdgePairs,areaCalculable:c.areaCalculable})),sortedContourIds:sorted.map(c=>c.id),transitions};
 });
 const analysis=freeze({neuronId,sourceFrame:payload.sourceFrame,sourceContext:structuredClone(source.sourceContext),sourceIdentity:nativeContourSourceHierarchy(neuronId),summary:{sourceContourCount:payload.contours.length,sourceVertexCount:payload.contours.reduce((n,c)=>n+c.points.length,0),sourceNameGroupCount:groups.length,comparableGroupCount:groups.filter(g=>g.status==="numeric_z_neighbours_available").length,notComparableGroupCount:groups.filter(g=>g.status==="not_comparable").length,numericNeighbourIntervalCount:groups.reduce((n,g)=>n+g.transitions.length,0)},groups});
 privateAnalyses.set(analysis,{neuronId,payload,verification});return analysis;
}
function verified(analysis){const bound=privateAnalyses.get(analysis);assert(bound,"an actual private source analysis is required");nativeContourVerification(bound.neuronId,bound.payload);return bound;}
function limits(value){assert(value&&Object.keys(value).length===3&&Object.keys(NATIVE_CONTOUR_DIAGNOSTIC_LIMITS).every(k=>Object.hasOwn(value,k)&&Number.isFinite(value[k])&&value[k]>0)&&value.areaRatio>=1,"invalid numerical limit fields");return {...value};}
export function evaluateNativeContourDiagnostics(analysis,parameters=NATIVE_CONTOUR_DIAGNOSTIC_LIMITS){
 verified(analysis);const p=limits(parameters);
 const groups=analysis.groups.map(g=>({...g,transitions:g.transitions.map(t=>{const numericalLimitsMet=t.centroidShiftMicrometre<=p.centroidShiftMicrometre&&t.areaRatio<=p.areaRatio&&t.cyclicRmsMicrometre<=p.cyclicRmsMicrometre;const sourceTopologyClear=t.bothSourceContoursSimple&&t.zeroLengthSourceEdges===0;return {...t,numericalLimitsMet,sourceTopologyClear,screenMet:numericalLimitsMet&&sourceTopologyClear};})}));
 return {parameters:p,groups,summary:{...analysis.summary,intervalsWithinNumericalLimits:groups.reduce((n,g)=>n+g.transitions.filter(t=>t.numericalLimitsMet).length,0),intervalsWithinLimitsAndClearSourceTopology:groups.reduce((n,g)=>n+g.transitions.filter(t=>t.screenMet).length,0)}};
}
export function nativeContourDiagnosticSensitivity(analysis){verified(analysis);return NATIVE_CONTOUR_DIAGNOSTIC_PRESETS.centroidShiftMicrometre.flatMap(centroidShiftMicrometre=>NATIVE_CONTOUR_DIAGNOSTIC_PRESETS.areaRatio.flatMap(areaRatio=>NATIVE_CONTOUR_DIAGNOSTIC_PRESETS.cyclicRmsMicrometre.map(cyclicRmsMicrometre=>{const r=evaluateNativeContourDiagnostics(analysis,{centroidShiftMicrometre,areaRatio,cyclicRmsMicrometre});return {parameters:r.parameters,groups:r.groups.map(g=>({sourceName:g.sourceName,intervalCount:g.transitions.length,withinNumericalLimits:g.transitions.filter(t=>t.numericalLimitsMet).length,withinLimitsAndClearSourceTopology:g.transitions.filter(t=>t.screenMet).length}))};})));}
export function createNativeContourDiagnosticReceipt(analysis,parameters=NATIVE_CONTOUR_DIAGNOSTIC_LIMITS){const {neuronId,payload}=verified(analysis);return structuredClone({documentType:"native_contour_numeric_diagnostic_receipt",schemaVersion:"0.1.0",analysisBuild:NATIVE_CONTOUR_DIAGNOSTIC_BUILD,source:{neuronId,sourceFrame:analysis.sourceFrame,sourceContext:analysis.sourceContext,sourceIdentity:analysis.sourceIdentity},verification:nativeContourVerification(neuronId,payload),method,scientificScope:scope,report:evaluateNativeContourDiagnostics(analysis,parameters)});}
function stableReceipt(value){const copy=structuredClone(value);for(const p of Object.values(copy.verification??{}))if(p){assert(Number.isSafeInteger(p.verificationSequence)&&p.verificationSequence>0&&["default","no-store"].includes(p.requestCacheMode)&&typeof p.verifiedAt==="string"&&Number.isFinite(Date.parse(p.verifiedAt)),"invalid saved source verification event");delete p.verificationSequence;delete p.verifiedAt;delete p.requestCacheMode;}return copy;}
export function validateNativeContourDiagnosticReceipt(receipt,neuronId,payload){assert(receipt?.report,"saved diagnostic report is missing");const current=createNativeContourDiagnosticReceipt(analyseNativeContourGroups(neuronId,payload),receipt.report.parameters);assert(JSON.stringify(stableReceipt(receipt))===JSON.stringify(stableReceipt(current)),"saved diagnostic build, source, parameters, scope or numerical results changed");return current;}
export function nativeContourDiagnosticCsv(analysis,parameters=NATIVE_CONTOUR_DIAGNOSTIC_LIMITS){
 const d=createNativeContourDiagnosticReceipt(analysis,parameters),p=d.report.parameters,fields=["application_version","neuron_id","original_dat_sha256","file_manifest_sha256","geometry_sha256","source_frame","source_name","group_status","reason","from_contour_id","to_contour_id","from_z_um","to_z_um","numeric_z_gap_um","xy_centroid_shift_um","xy_area_ratio","cyclic_phase_rms_um","zero_length_source_edges","max_centroid_shift_um","max_xy_area_ratio","max_cyclic_rms_um","numerical_limits_met","source_topology_clear","limits_and_topology_met","biological_tolerance_validated","new_surface_admission_count","registration_count"];
 const quote=v=>'"'+String(v??"").replaceAll('"','""')+'"',rows=[fields];
 for(const g of d.report.groups)for(const t of g.transitions.length?g.transitions:[null])rows.push([d.analysisBuild.applicationVersion,d.source.neuronId,d.verification.originalDat.sha256,d.verification.fileManifest.sha256,d.verification.sourceGeometry.sha256,d.source.sourceFrame,g.sourceName,g.status,g.reasons.join(";"),t?.fromContourId,t?.toContourId,t?.fromZMicrometre,t?.toZMicrometre,t?.zGapMicrometre,t?.centroidShiftMicrometre,t?.areaRatio,t?.cyclicRmsMicrometre,t?.zeroLengthSourceEdges,p.centroidShiftMicrometre,p.areaRatio,p.cyclicRmsMicrometre,t?.numericalLimitsMet,t?.sourceTopologyClear,t?.screenMet,false,0,0]);
 return rows.map(row=>row.map(quote).join(",")).join("\n")+"\n";
}
