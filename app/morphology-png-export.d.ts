import type { MorphologyComparisonRecord, MorphologyGeometryPayload } from "./morphology-census-data";
import type { UniverseRecord } from "./neuromorpho-universe-verification.js";
import type { MorphologySourceViewDocument, IndividualMorphologySourceViewDocument } from "./morphology-source-view.js";
type Document = MorphologySourceViewDocument | IndividualMorphologySourceViewDocument;
type Options = { profile: "source_local" | "individual"; record: MorphologyComparisonRecord | UniverseRecord; geometry: MorphologyGeometryPayload; rendererRevision: string };
export function assertMorphologyPngCurrent(saved: unknown, current: Document): void;
export function morphologyPngCaptions(document: unknown, options: Options): string[];
export function appendMorphologyExportPng(blob: Blob, document: unknown, options: Options): Promise<Blob>;
