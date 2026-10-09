import { appendMainScenePngReceipt } from "./main-scene-source-view.js";
import { validateNativeContourSourceViewReplay } from "./native-contour-source-view.js";

export function wrapNativeContourPngCaption(caption, maxWidth, measure) {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) throw new Error("Native contour PNG: caption width is unavailable.");
  const lines = [];
  let line = "";
  for (let word of caption.split(/\s+/).filter(Boolean)) {
    if (measure(word) > maxWidth) {
      if (line) { lines.push(line); line = ""; }
      let part = "";
      for (const character of word) {
        if (part && measure(part + character) > maxWidth) { lines.push(part); part = ""; }
        part += character;
      }
      word = part;
    }
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate) > maxWidth) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

/** The renderer supplies an actual current capture and the privately attested payloads. */
export async function appendNativeContourExportPng(blob, document, { neuronId, contours, shell, rendererRevision }) {
  const saved = validateNativeContourSourceViewReplay(document, neuronId, contours, shell, rendererRevision);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const header = new DataView(bytes.buffer);
  const viewport = saved.view.viewport;
  if (bytes.length < 33 || header.getUint32(16) !== viewport.drawingBufferWidth
    || header.getUint32(20) <= viewport.drawingBufferHeight) {
    throw new Error("Native contour PNG: raster dimensions do not match the captured viewport and disclosure footer.");
  }
  return appendMainScenePngReceipt(blob, saved, {
    documentType: "native_contour_png_export_receipt", schemaVersion: "0.1.0",
    rendererBuild: saved.rendererBuild, exportKind: "actual_native_contour_pixels_with_disclosure_footer",
    sourceViewKeyword: "ohri-source-view", exportedAt: new Date().toISOString(),
    raster: { x: 0, y: 0, width: viewport.drawingBufferWidth, height: viewport.drawingBufferHeight },
    captureAuthority: { observedPrimitive: "source_native_ordered_line_loop", visibleContourIds: saved.view.layers.visibleContourIds,
      derivedDisplayShellCount: Number(saved.view.layers.derivedSurfaceVisible),
      observedMembraneCount: 0, volumeCount: 0, internalStructureCount: 0,
      standardizedSwcOverlayCount: 0, sameCellJoinCount: 0, registrationCount: 0,
      rawDatByteVerification: "verified_original_bytes_and_complete_parser_audit", sourceContextApiByteVerification: "declared_only",
      imageIsBiologicalMeasurement: false, pixelEqualityAcrossViewportSizes: false },
    replay: { sourceViewSchemaVersion: saved.schemaVersion, separateJsonRequiredForRestore: true,
      sameSpecifiedBuildRequired: true, freshSourceCacheMode: "no-store", appliedViewMustMatch: true,
      adaptedPaths: ["view.viewport", "view.camera.aspect"], numericTolerance: { absolute: 1e-8, relative: 1e-8 } },
  });
}
