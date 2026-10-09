export type MainSceneAuxiliaryToken = Readonly<{ path: string }>;
export type MainSceneAuxiliaryProof = Readonly<{ path: string; bytes: number; sha256: string; verifiedSha256: string; verificationSequence: number; authority: "actual_auxiliary_source_bytes"; scope: "pinned_asset_bytes_only" }>;
export const MAIN_SCENE_AUXILIARY_PATHS: readonly string[];
export function mainSceneAuxiliaryExpected(path: string): Readonly<{ path: string; bytes: number; sha256: string }>;
export function readVerifiedMainSceneAuxiliary(path: string, options?: { signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<MainSceneAuxiliaryToken>;
export function mainSceneAuxiliaryProof(token: MainSceneAuxiliaryToken): MainSceneAuxiliaryProof;
export function mainSceneAuxiliaryBytes(token: MainSceneAuxiliaryToken): ArrayBuffer;
export function mainSceneAuxiliaryJson(token: MainSceneAuxiliaryToken): unknown;
