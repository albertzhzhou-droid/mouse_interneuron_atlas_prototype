import type { MorphologyFidelityRecord } from "./atlas-types";
import type { MorphologyGeometryPayload } from "./morphology-census-data";
import type { MorphologyGeometryVerificationReceipt } from "./morphology-geometry-verification.js";
import type { SourceIdentityHierarchy } from "./source-object-identity.js";
export type MainSceneMorphologyGeometry = MorphologyGeometryPayload & {
  source: { officialRecordUrl: string; standardizedSwcUrl: string; pmids: string[]; dois: string[]; license: string };
  swc: { sha256: string; nodeCount: number; dimensionality: "2D" | "3D"; sourceDiameterAvailable: boolean };
};
export type MainSceneMorphologyProof = MorphologyGeometryVerificationReceipt & {
  mainSceneVerificationSequence: number; mainSceneRosterCount: 179; repositoryRelease: "8.6.124" | "8.6.126";
  namespace: string; membership: "census" | "supplementary" | "todd_supplementary"; censusContribution: 0 | 1;
};
export type MainSceneMorphologyContext = {
  sourceIdentity: SourceIdentityHierarchy; sourceFrameDisclosure: Record<string, unknown>;
  nativeSourceContext: Record<string, unknown>; scientificUse: string; repositoryRelease: "8.6.124" | "8.6.126";
  membership: "census" | "supplementary" | "todd_supplementary"; censusContribution: 0 | 1;
  independentPhysicalCellIdentity: false; rights: Record<string, unknown>; coordinateRelationshipToAtlas: "none";
  registrationCount: 0; sameCellInternalObjectCount: 0;
};
export function readVerifiedMainSceneMorphology(record: MorphologyFidelityRecord, options?: { fetchImpl?: typeof fetch; signal?: AbortSignal; forceReload?: boolean }): Promise<MainSceneMorphologyGeometry>;
export function mainSceneMorphologyVerification(record: MorphologyFidelityRecord, geometry: MainSceneMorphologyGeometry): { geometryVerification: MainSceneMorphologyProof; sourceContext: MainSceneMorphologyContext };
