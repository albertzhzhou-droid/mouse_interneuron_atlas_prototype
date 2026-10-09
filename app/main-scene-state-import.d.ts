import type { MorphologyFidelityRecord } from "./atlas-types";
import type { MainSceneSourceViewDocument, MainSceneSourceViewTools, MainSceneViewRequest } from "./main-scene-source-view.js";
export type MainSceneImportContext = { neuronId: number | null; focus: { focusKind: string; focusId: string } | null; request: MainSceneViewRequest };
export type MainSceneImportState = { observedCellFormId: number; cameraPreset: string; sliceZ: number; morphologyFidelityMode: string; layers: MainSceneViewRequest["layers"] | Omit<MainSceneViewRequest["layers"], "datContours">; micronsClipping: MainSceneViewRequest["micronsClipping"]; search: string; filters: MainSceneViewRequest["evidenceFilter"]["filters"]; selectedId: string | null };
export type MainSceneImportPreparation = { status: "settings_only"; reason: "legacy_export_without_actual_view" | "saved_actual_view_unavailable" } | { status: "actual_view"; neuronId: number; document: MainSceneSourceViewDocument };
export type MainSceneImportTicket = { readonly id: number; readonly signal: AbortSignal };
export function prepareMainSceneStateViewImport(value: unknown, state: MainSceneImportState, targetNeuronId: number | null, records: MorphologyFidelityRecord[], options?: { signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<MainSceneImportPreparation>;
export function createMainSceneStateImportCoordinator(): {
  begin(context: MainSceneImportContext): MainSceneImportTicket;
  isCurrent(ticket: MainSceneImportTicket): boolean;
  isLatest(ticket: MainSceneImportTicket): boolean;
  cancel(reason: string): boolean;
  snapshot(): { ticket: MainSceneImportTicket; phase: "preparing" | "waiting" | "restoring" | "completed" | "failed"; baseline: MainSceneImportContext; expected?: MainSceneImportContext; preparation?: Extract<MainSceneImportPreparation, { status: "actual_view" }>; comparisonCount?: number } | null;
  waitForRenderer(ticket: MainSceneImportTicket, preparation: Extract<MainSceneImportPreparation, { status: "actual_view" }>, expected: MainSceneImportContext, comparisonCount: number): boolean;
  finish(ticket: MainSceneImportTicket): boolean;
  restoreWhenReady(ticket: MainSceneImportTicket, tools: MainSceneSourceViewTools | null): Promise<{ status: "waiting" | "cancelled" } | { status: "restored"; actual: MainSceneSourceViewDocument }>;
};
