import type { NativeContourPayload, DerivedSurfacePayload } from "./NativeContourRecordViewer";
import type { NativeContourSourceViewDocument } from "./native-contour-source-view.js";
export function wrapNativeContourPngCaption(caption: string, maxWidth: number, measure: (text: string) => number): string[];
export function appendNativeContourExportPng(blob: Blob, document: NativeContourSourceViewDocument, options: {
  neuronId: number; contours: NativeContourPayload; shell: DerivedSurfacePayload | null; rendererRevision: string;
}): Promise<Blob>;
