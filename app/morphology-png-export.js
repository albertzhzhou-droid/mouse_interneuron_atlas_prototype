import { appendMainScenePngReceipt } from "./main-scene-source-view.js";
import { validateMorphologySourceViewReplay, validateIndividualMorphologySourceViewReplay } from "./morphology-source-view.js";

const check = (ok, message) => { if (!ok) throw new Error(`Morphology PNG: ${message}`); };
function validate(document, { profile, record, geometry, rendererRevision }) {
  check(["source_local", "individual"].includes(profile), "renderer profile is unsupported");
  const saved = structuredClone(document);
  (profile === "individual" ? validateIndividualMorphologySourceViewReplay : validateMorphologySourceViewReplay)(record, geometry, saved, rendererRevision);
  return saved;
}
/** Capture time is regenerated; every actual view/source/build field must still match. */
export function assertMorphologyPngCurrent(saved, current) {
  const stable = value => Object.fromEntries(Object.entries(value).filter(([key]) => key !== "generatedAt"));
  check(JSON.stringify(stable(saved)) === JSON.stringify(stable(current)), "the source view changed while preparing PNG. Capture the current view again.");
}
export function morphologyPngCaptions(document, options) {
  const saved = validate(document, options), view = saved.view, layers = view.layers;
  return [
    `NeuroMorpho ${options.record.neuronId} · ${options.profile === "individual" ? "individual" : "sourceObject" in options.record ? "exact universe" : "comparison"} morphology`,
    `Requested: ${view.requestedMode} · actual: ${view.actualMode === "radius" ? "derived radius surface" : "source centerlines"}`,
    `Centerlines: ${Number(layers.centerlinesVisible)} · radius surface: ${Number(layers.radiusSurfaceVisible)} · topology: ${Number(layers.topologyLandmarksVisible)} · source axes: ${Number(layers.sourceAxesVisible)}`,
    ...(options.profile === "individual" ? [`Enabled SWC types: ${layers.visibleSourceTypes.join(", ")} · rendered centerline types: ${layers.centerlineSourceTypes.join(", ")}`] : []),
    `Inspection node: ${view.inspection.selectedNodeId ?? "none"} · context dimmed: ${view.inspection.contextDimmed}`,
    view.sourcePlaneLocked ? "Source-labelled 2D; deposited coordinates retained without inferred depth or extrusion."
      : "Source-labelled 3D; coordinates are retained. A radius surface is a derivative, not an observed membrane.",
    "Source axes are not anatomical axes. Display transform only; image is not a biological measurement.",
    `Geometry SHA-256: ${saved.source.geometrySha256}`,
    "No same-cell internal objects, cross-source identity or atlas registration. Separate JSON is required for fresh same-build restoration.",
  ];
}
export async function appendMorphologyExportPng(blob, document, options) {
  const saved = validate(document, options), profile = options.profile, rawVerification = saved.geometryVerification.scope === "standardized_swc_bytes_verified_and_runtime_parse";
  const bytes = new Uint8Array(await blob.arrayBuffer()), viewport = saved.view.viewport;
  const header = new DataView(bytes.buffer);
  check(bytes.length >= 33 && header.getUint32(16) === viewport.drawingBufferWidth && header.getUint32(20) > viewport.drawingBufferHeight,
    "raster dimensions disagree with the actual source viewport and disclosure footer");
  return appendMainScenePngReceipt(blob, saved, {
    documentType: "morphology_png_export_receipt", schemaVersion: "0.1.0", rendererProfile: profile,
    rendererBuild: saved.rendererBuild, exportKind: "actual_morphology_pixels_with_disclosure_footer", exportedAt: new Date().toISOString(),
    sourceViewKeyword: "ohri-source-view", raster: { x: 0, y: 0, width: viewport.drawingBufferWidth, height: viewport.drawingBufferHeight },
    captureAuthority: { observedPrimitive: "source_swc_centerlines", actualMode: saved.view.actualMode, requestedMode: saved.view.requestedMode,
      layers: saved.view.layers, inspection: saved.view.inspection,
      radiusSurfaceAuthority: saved.view.layers.radiusSurfaceVisible ? "DER_SOURCE_REPORTED_RADII" : "NONE",
      rawSwcByteVerification: rawVerification ? "verified_raw_swc_bytes_in_source_view" : "declared_raw_hash_only",
      sourcePlaneLocked: saved.view.sourcePlaneLocked, inferredDepthCount: 0, repairedCutNeuriteCount: 0,
      observedMembraneCount: 0, internalStructureCount: 0, sameCellJoinCount: 0, registrationCount: 0,
      imageIsBiologicalMeasurement: false, pixelEqualityAcrossViewportSizes: false },
    replay: { separateJsonRequiredForRestore: true, sameSpecifiedBuildRequired: true, freshSourceCacheMode: "no-store",
      appliedViewMustMatch: true, adaptedPaths: ["view.viewport", "view.camera.aspect"], numericTolerance: { absolute: 1e-9, relative: 1e-9 } },
  });
}
