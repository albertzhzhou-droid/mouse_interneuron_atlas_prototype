import type { IndependentObject, IndependentPayload } from "./independent-source-workspace-types";

export type VerifiedAssetReceipt = { fileId: string; path: string; bytes: number; checksum: { algorithm: "SHA-256"; digest: string }; status: "verified" };
export function verifyIndependentSourceObjectAsset(bytes: ArrayBuffer, receipt: { id: string; path: string; bytes: number; checksum: { algorithm: string; digest: string } }, options?: { digestImpl?: SubtleCrypto }): Promise<VerifiedAssetReceipt>;
export function loadIndependentSourceObject(object: IndependentObject, options?: {
  fetchImpl?: typeof fetch; signal?: AbortSignal; includeDerivedShell?: boolean; forceReload?: boolean;
}): Promise<IndependentPayload>;
export type IndependentRuntimeEvent = { verificationSequence: number; verifiedAt: string; requestCacheMode: "default" | "no-store"; verifiedFileCount: number; authority: "verified_selected_runtime_source_bytes" | "source_contract_only_no_runtime_asset_bytes" | "exact_row_reference_only_no_geometry_or_bytes" };
export function assertVerifiedIndependentSourcePayload(object: IndependentObject, payload: IndependentPayload): IndependentRuntimeEvent;
