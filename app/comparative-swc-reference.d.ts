import type { IndependentObject, IndependentPayload } from "./independent-source-workspace-types";
export type ComparativeConflict = { id: string; status: string; locator: string; consequence: string; [field: string]: unknown };
export type ComparativeMetrics = {
  nodeCount: number; segmentCount: number; rootNodeId: number; nodeTypeCounts: Record<string, number>;
  boundsMicrometre: { min: number[]; max: number[] }; extentMicrometre: number[]; zeroLengthEdgeCount: number;
  totalCableLengthMicrometre: number; sourceDiameterAttributePresent: boolean;
  radiusDerived: { value: Record<string, number> | null; missingReason: string | null };
};
export type ComparativeObject = Omit<IndependentObject, "context" | "viewer" | "files"> & {
  context: IndependentObject["context"] & {
    species: string; name: string; archive: string; rawMetadata: Record<string, unknown>; sourceMorphometry: Record<string, unknown>;
    sourceMorphometryPolicy: string; qc: Record<string, unknown>; computedFromExactSwc: ComparativeMetrics;
    conflicts: ComparativeConflict[]; boundaries: string[];
  };
  viewer: IndependentObject["viewer"] & { neuronId: number; diameterAuthorized: boolean; radiusSurfaceAdmitted: false };
  files: { id: string; path: string; url: string; sourcePath: string; bytes: number; checksum: { algorithm: "SHA-256"; digest: string }; retrievedDate: string }[];
  provenance: { originalPaper: string; repositoryCitation: string; repositoryMethodsCitation: string; reuse: { status: string; license: string; termsUrl: string; attributionRequirement: string } };
};
export type ComparativeIndex = { contractId: string; releaseId: string; objects: ComparativeObject[]; scope: Record<string, unknown>; coordinatePolicy: Record<string, unknown> };
export type ComparativePayload = IndependentPayload & { rawNodes: number[][] };
export function createComparativeSwcReferenceIndex(contract: unknown): ComparativeIndex;
export function findComparativeSwcReference(index: ComparativeIndex, key: unknown): ComparativeObject | null;
export type ComparativeSourceVerification = Readonly<{ status: 'verified_owned_native_source_bytes'; verificationSequence: number; verifiedAt: string; requestCacheMode: 'default' | 'no-store' }>;
export function loadComparativeSwcReference(object: ComparativeObject, options?: { fetchImpl?: typeof fetch; signal?: AbortSignal; forceReload?: boolean }): Promise<ComparativePayload>;
export function assertVerifiedComparativeSwcPayload(object: ComparativeObject, payload: ComparativePayload): ComparativeSourceVerification;
export function comparativeSwcNodesCsv(object: ComparativeObject, payload: ComparativePayload): string;
