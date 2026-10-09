import type { MorphologyCensusRecord, MorphologyGeometryPayload } from "./morphology-census-data";
import type { MorphologySourceFrameDisclosure } from "./morphology-source-frame-disclosure";
export type MorphologyGeometryVerificationReceipt = {
  status: "verified"; neuronId: number; assetId: string; path: string; requestUrl: string;
  bytes: number; sha256: string; rawSwcSha256: string; geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL";
  sourceFrame: string; dimensionality: "2D" | "3D"; verifiedAt: string; verificationSequence: number;
  requestCacheMode: "default" | "no-store"; scope: "standardized_geometry_bytes_only_raw_swc_hash_declared";
};
export function verifiedMorphologyGeometryUrl(record: MorphologyCensusRecord, disclosure: MorphologySourceFrameDisclosure): string;
export function readVerifiedMorphologyGeometry(record: MorphologyCensusRecord, disclosure: MorphologySourceFrameDisclosure, options?: { fetchImpl?: typeof fetch; signal?: AbortSignal; forceReload?: boolean }): Promise<MorphologyGeometryPayload>;
export function morphologyGeometryVerificationReceipt(record: MorphologyCensusRecord, disclosure: MorphologySourceFrameDisclosure, geometry: MorphologyGeometryPayload): MorphologyGeometryVerificationReceipt;
