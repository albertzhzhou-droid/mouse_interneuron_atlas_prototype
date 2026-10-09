import type { ResearchRecord } from "./ResearchExplorer";
export type ResearchMorphologyRenderingPolicy = {
  documentType: "research_morphology_rendering_policy"; schemaVersion: "0.1.0"; recordKey: string;
  namespace: string; repositoryRelease: "8.6.124" | "8.6.126"; membership: "census" | "supplementary" | "todd_supplementary"; censusContribution: 0 | 1;
  declaredSource: { neuronId: number; dimensionality: "2D" | "3D"; sourceDiameterAvailable: boolean; sourceFrame: string;
    geometryPath: string; geometryBytes: number; geometrySha256: string; rawSwcSha256Declared: string; contractLocator: string };
  radiusSurface: { allowedAfterCurrentByteVerification: boolean; reason: string; authority: "DER_AFTER_VERIFIED_OBS_INPUT" | "UNAVAILABLE";
    requirement: string; observedMembrane: false; thicknessInferenceAllowed: false; depthInferenceAllowed: false; planarCoordinatesChanged: false };
  actualGeometryVerification: { status: "not_included"; verifiedBytes: null; reason: string };
  actualRenderedView: { status: "not_included"; camera: null; layers: null; clipping: null };
  sameCellInternalGeometryAllowed: false; registrationCount: 0;
  archivedSurfaceDeclarations: Array<{ evidenceIndex: number; originalLabel: string; originalValue: string; originalAuthority: string;
    originalLocator: string; interpretation: "archived_project_rendering_declaration_not_current_permission"; currentSurfaceAllowedAfterByteVerification: boolean }>;
  scope: string;
};
export function deriveResearchMorphologyRenderingPolicy(record: ResearchRecord): ResearchMorphologyRenderingPolicy | null;
export function researchEvidenceDisplayLabel(record: ResearchRecord, field: ResearchRecord["evidence"][number]): string;
