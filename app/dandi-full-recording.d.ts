import type document from "../data/dandi-spinalcordnet-full-recording-0.1.json";
export const DANDI_FULL_RECORDING: typeof document;
export interface DandiFullProof { readonly channelIndex: number; readonly nativeElectrodeId: string; readonly blockIndex: number; }
export interface DandiFullWindow { readonly firstSample: number; readonly sampleCount: number; readonly cursorOffset: number; readonly firstTimeSeconds: number; readonly lastTimeSeconds: number; readonly cursor: { sourceSampleIndex: number; timeSeconds: number; storedValue: number }; readonly samples: readonly number[]; }
export interface DandiFullSelection { channelIndex: number; firstSample: number; cursorOffset: number; }
export function validateDandiFullDocument(value?: typeof document): typeof document;
export function dandiFullChunkFor(channelIndex: number, firstSample: number): typeof document.chunks[number];
export function verifyDandiFullChunk(bytes: Uint8Array, channelIndex: number, firstSample: number, options?: { signal?: AbortSignal }): Promise<DandiFullProof>;
export function loadDandiFullChunk(channelIndex: number, firstSample: number, options?: { signal?: AbortSignal; fetchImpl?: typeof fetch }): Promise<DandiFullProof>;
export function dandiFullWindow(proof: DandiFullProof, channelIndex: number, firstSample: number, cursorOffset?: number): DandiFullWindow;
export function buildDandiFullReceipt(proof: DandiFullProof, channelIndex: number, firstSample: number, cursorOffset?: number, generatedAt?: string): Record<string, unknown>;
export function inspectDandiFullReceipt(receipt: unknown): DandiFullSelection;
export function restoreDandiFullReceipt(receipt: unknown, proof: DandiFullProof): DandiFullSelection;
export function dandiFullWindowCsv(proof: DandiFullProof, channelIndex: number, firstSample: number): string;
