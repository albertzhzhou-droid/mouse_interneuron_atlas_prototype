import type document from "../data/mccreedy-v2a-movie-0.1.json";
export const MCCREEDY_MOVIE: typeof document;
export interface MccreedyProof { readonly sourceId: string; readonly releaseId: string; }
export interface MccreedySelection { timeSeconds: number; playbackRate: number; }
export function verifyMccreedyMovie(bytes: Uint8Array, options?: { signal?: AbortSignal }): Promise<MccreedyProof>;
export function loadMccreedyMovie(options?: { signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<MccreedyProof>;
export function mccreedyMovieBytes(proof: MccreedyProof): Uint8Array;
export function inspectMccreedySelection(selection: unknown): MccreedySelection;
export function validateMccreedyDecodedMetadata(value: { width: number; height: number; durationSeconds: number }): unknown;
export function buildMccreedyReceipt(proof: MccreedyProof, selection: MccreedySelection, generatedAt?: string): Record<string, unknown>;
export function inspectMccreedyReceipt(receipt: unknown): MccreedySelection;
export function restoreMccreedyReceipt(receipt: unknown, proof: MccreedyProof): MccreedySelection;
