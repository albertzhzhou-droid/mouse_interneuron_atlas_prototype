import type { MorphologyGeometryPayload } from "./morphology-census-data";
import type { SourceIdentityHierarchy } from "./source-object-identity.js";
export type UniverseMembership = {
  noAgeQueryUniverse: true;
  frozenAdultSubset: boolean;
  namedRouteIds: string[];
};

export type UniverseRecord = {
  assetId: string;
  neuronId: number;
  officialMetadata: Record<string, unknown>;
  normalizedMetadata: {
    name: string;
    archive: string;
    species: string | string[];
    lifeStage: string;
    brainRegion: string[];
    cellType: string[];
    strain: string | string[];
    gender: string | string[];
    experimentCondition: string | string[];
    domain: string;
    physicalIntegrity: string;
    attributes: string;
    dimensionality: "2D" | "3D";
    sourceDiameterAvailable: boolean;
    sourceFrame: string;
    registrationStatus: "unregistered";
  };
  missingness: Record<string, { value: unknown; missingReason: string | null }>;
  sourcePaper: { pmids: string[]; dois: string[] };
  memberships: UniverseMembership;
  sourceObject: {
    status: "admitted" | "quarantined";
    transport: "existing_generated_geometry" | "raw_swc_lazy_parse" | "unavailable";
    directUrl: string;
    rawSwcPath: string | null;
    rawSwcSha256: string | null;
    rawSwcBytes: number | null;
    existingGeometryPath: string | null;
    existingGeometrySha256: string | null;
    existingGeometryBytes: number | null;
    geometryCopyCount: 0;
    registrationCount: 0;
    errors: string[];
  };
  qc: Record<string, unknown>;
  morphometrics: {
    sourceReported: Record<string, unknown>;
    computed: Record<string, unknown>;
  };
};

export type UniversePayload = {
  documentType: "neuromorpho_no_age_query_universe_index";
  schemaVersion: string;
  assetSetId: string;
  repositoryRelease: string;
  snapshotDate: string;
  query: Record<string, unknown>;
  summary: {
    queryRecordCount: number;
    admittedSourceObjectCount: number;
    quarantinedSourceObjectCount: number;
    frozenAdultSubsetCount: number;
    namedRouteCount: number;
    existingGeometryReferenceCount: number;
    deltaRawSwcCount: number;
    sourceLabelled3DCount: number;
    sourceLabelled2DCount: number;
    diameterAuthorizedCount: number;
    diameterUnavailableCount: number;
    axonDomainCount: number;
    completeAxonClaimCount: 0;
    registrationCount: 0;
    sameSpecimenInternalStructureCount: 0;
    paperCount: number;
    archiveCount: number;
  };
  records: UniverseRecord[];
};

export type UniverseVerificationOptions = { fetchImpl?: typeof fetch; signal?: AbortSignal; forceReload?: boolean };
export type UniverseIndexVerificationReceipt = { status: "verified"; path: string; bytes: number; sha256: string; repositoryRelease: "8.6.124"; namespace: string; recordCount: 1097; verifiedAt: string; verificationSequence: number; requestCacheMode: "default" | "no-store"; scope: "fixed_universe_index_bytes_and_exact_1097_record_membership" };
export type UniverseGeometryVerificationReceipt = { status: "verified"; neuronId: number; assetId: string; path: string; requestUrl: string; bytes: number; sha256: string; rawSwcSha256: string; geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL"; sourceFrame: string; dimensionality: "2D" | "3D"; indexPath: string; indexBytes: number; indexSha256: string; namespace: string; repositoryRelease: "8.6.124"; verifiedAt: string; verificationSequence: number; requestCacheMode: "default" | "no-store"; scope: "standardized_swc_bytes_verified_and_runtime_parse" };
export type UniverseGeometrySourceFrame = { documentType: "neuromorpho_universe_runtime_source_frame"; sourceCoordinates: { unit: "micrometre_reported_by_source"; sourceFrame: string; boundsMicrometre: { min: number[]; max: number[] }; extentMicrometre: number[]; displayTransform: MorphologyGeometryPayload["displayTransform"] }; [key: string]: unknown };
export function readVerifiedUniverseIndex(options?: UniverseVerificationOptions): Promise<UniversePayload>;
export function universeIndexVerificationReceipt(index: UniversePayload): UniverseIndexVerificationReceipt;
export function readVerifiedUniverseGeometry(record: UniverseRecord, options?: UniverseVerificationOptions): Promise<MorphologyGeometryPayload>;
export function universeGeometryVerificationReceipt(record: UniverseRecord, geometry: MorphologyGeometryPayload): UniverseGeometryVerificationReceipt;
export function universeSourceIdentityHierarchy(record: UniverseRecord): SourceIdentityHierarchy;
export function universeGeometrySourceFrame(record: UniverseRecord, geometry: MorphologyGeometryPayload): UniverseGeometrySourceFrame;
