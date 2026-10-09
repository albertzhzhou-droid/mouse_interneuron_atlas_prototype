import type { UniverseRecord, UniverseGeometryVerificationReceipt, UniverseGeometrySourceFrame } from "./neuromorpho-universe-verification.js";
import type { MorphologyComparisonRecord, MorphologyGeometryPayload } from "./morphology-census-data";
import type { MorphologyGeometryVerificationReceipt } from "./morphology-geometry-verification.js";
import type { SourceIdentityHierarchy } from "./source-object-identity.js";
import type { MorphologySourceFrameDisclosure } from "./morphology-source-frame-disclosure";
export type MorphologySourceView = {
  status: "rendered";
  runtimeBinding: { neuronId: number; geometrySha256: string; viewportInstanceId: string; viewportRevision: number };
  requestedMode: "skeleton" | "radius"; actualMode: "skeleton" | "radius"; sourcePlaneLocked: boolean;
  camera: { kind: "PerspectiveCamera"; position: number[]; target: number[]; up: number[]; quaternion: number[]; fov: number; zoom: number; aspect: number; near: number; far: number; filmGauge: number; filmOffset: number };
  viewport: { cssWidth: number; cssHeight: number; drawingBufferWidth: number; drawingBufferHeight: number; pixelRatio: number };
  renderer: { engine: "THREE"; revision: string; type: "WebGLRenderer"; outputColorSpace: string; toneMapping: number; alpha: boolean; antialias: boolean };
  clipping: { globalPlanes: { normal: number[]; constant: number }[]; localClippingEnabled: boolean };
  layers: { sourceGeometryVisible: boolean; centerlinesVisible: boolean; radiusSurfaceVisible: boolean; topologyLandmarksVisible: boolean; sourceAxesVisible: boolean };
  inspection: { selectedNodeId: number | null; contextDimmed: boolean; overlayAuthority: "exact_swc_parent_path_and_descendant_edges" };
  sceneBounds: { center: number[]; radius: number }; displayTransform: MorphologyGeometryPayload["displayTransform"];
};
export type MorphologySourceViewDocument = {
  documentType: "source_local_morphology_view_receipt"; schemaVersion: string; applicationVersion: string; generatedAt: string;
  rendererBuild: { applicationVersion: string; scope: string; inputs: { path: string; bytes: number; sha256: string }[] };
  source: object; sourceIdentity: SourceIdentityHierarchy; sourceFrameDisclosure: MorphologySourceFrameDisclosure | UniverseGeometrySourceFrame;
  geometryVerification: MorphologyGeometryVerificationReceipt | UniverseGeometryVerificationReceipt; scientificScope: object; view: MorphologySourceView;
};
export type IndividualMorphologySourceView = Omit<MorphologySourceView, "layers"> & {
  layers: MorphologySourceView["layers"] & { visibleSourceTypes: number[]; centerlineSourceTypes: number[] };
};
export type IndividualMorphologySourceViewDocument = Omit<MorphologySourceViewDocument, "documentType" | "view"> & {
  documentType: "individual_morphology_view_receipt"; view: IndividualMorphologySourceView;
};
export const MORPHOLOGY_SOURCE_VIEW_VERSION: "0.1.0";
export const MORPHOLOGY_SOURCE_VIEW_APPLICATION_VERSION: "2.91.0-research.1";
export const MORPHOLOGY_SOURCE_VIEW_RENDERER_BUILD: Readonly<{ applicationVersion: string; scope: string; inputs: readonly Readonly<{ path: string; bytes: number; sha256: string }>[] }>;
export function captureMorphologySourceView(record: MorphologyComparisonRecord | UniverseRecord, geometry: MorphologyGeometryPayload, view: MorphologySourceView, rendererRevision: string): MorphologySourceViewDocument;
export function validateMorphologySourceViewReplay(record: MorphologyComparisonRecord | UniverseRecord, geometry: MorphologyGeometryPayload, document: unknown, rendererRevision: string): MorphologySourceView;
export function captureIndividualMorphologySourceView(record: MorphologyComparisonRecord, geometry: MorphologyGeometryPayload, view: IndividualMorphologySourceView, rendererRevision: string): IndividualMorphologySourceViewDocument;
export function validateIndividualMorphologySourceViewReplay(record: MorphologyComparisonRecord, geometry: MorphologyGeometryPayload, document: unknown, rendererRevision: string): IndividualMorphologySourceView;
export function assertMorphologySourceViewSceneBounds(document: MorphologySourceViewDocument | IndividualMorphologySourceViewDocument, actualBounds: { center: number[]; radius: number }): true;
export function assertMorphologySourceViewAppliedPose(document: MorphologySourceViewDocument | IndividualMorphologySourceViewDocument, actualView: MorphologySourceView | IndividualMorphologySourceView): true;
