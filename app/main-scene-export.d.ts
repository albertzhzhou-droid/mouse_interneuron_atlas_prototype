import type { MainSceneSourceViewDocument } from "./main-scene-source-view.js";
export type MainSceneUnavailableView = { status: "unavailable"; reason: string; currentNeuronId: number | null };
export type MainSceneExportView = MainSceneSourceViewDocument | MainSceneUnavailableView;
export const MAIN_SCENE_CSV_FORMAT_VERSION: "1.0.0";
export function createMainSceneCsvMetadataRow(headers: string[], options: {
  releaseId: string; disclaimer: string; sourceView: MainSceneExportView;
}): string[];
export function buildMainSceneRoundTripContract(receipt: MainSceneExportView): {
  schemaVersion: string; equalityUnit: string; excludedTopLevelFields: string[];
  regeneratedNonAuthoritativePaths: string[]; persistentState: { path: string; urlIsInformational: boolean; entityLayerNormalization: string };
  actualView: { status: string; receiptPath: string; [key: string]: unknown };
};
export function appendMainSceneExportPng(blob: Blob, receipt: MainSceneExportView, options: {
  exportKind: "rendered_main_scene" | "accessible_fallback"; requestedState: object; currentNeuronId: number | null;
}): Promise<Blob>;
