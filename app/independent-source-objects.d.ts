import type { IndependentObject } from "./independent-source-workspace-types";

export type IndependentObjectIdentity = { sourceId: string; releaseId: string; objectKind: string; sourceObjectId: string };
export type IndependentSourceDescriptor = {
  id: string; name: string; sourceId: string; label: string; releaseId: string;
  objectCount: number; unit: "indexed_entries"; scope: string;
  counts: { value: number; unit: string; scopeKey: string; derivedFrom: unknown }[];
};
export type IndependentObjectIndex = {
  contractId: string; sources: IndependentSourceDescriptor[]; fixedRecords: IndependentObject[];
  collections: { sourceId: string; registryId: string; releaseId: string; objectKind: string; count: number; split?: string; source: unknown }[];
};
export const INDEPENDENT_SOURCE_IDS: Readonly<{ nativeContours: "native-contours"; microns: "microns-phase1"; banc: "banc-v888"; palm: "super-clem-palm"; microStructFormer: "microstructformer" }>;
export const INDEPENDENT_OBJECT_EVIDENCE_STATES: readonly string[];
export function independentSourceObjectKey(identity: IndependentObjectIdentity | null): string | null;
export function parseIndependentSourceObjectKey(key: string): IndependentObjectIdentity | null;
export function buildIndependentSourceObjectIndex(options: {
  nativeContourCatalog: unknown; micronsReference: unknown; bancMorphologyRoute: unknown;
  superClemReference: unknown; microStructFormerReference: unknown;
  nativeContourDerivedSurface?: unknown; nativeContourCrosswalk?: unknown; bancCandidateAudit?: unknown; nativeContourSourceContext?: unknown;
}): IndependentObjectIndex;
export function findIndependentSourceObject(index: IndependentObjectIndex, key: string): IndependentObject | null;
export function listIndependentSourceObjects(index: IndependentObjectIndex, options: { sourceId: string; query?: string; offset?: number; limit?: number }): { records: IndependentObject[]; total: number; offset: number; limit: number };
export function exportIndependentSourceObject(object: IndependentObject, receipt?: Record<string, unknown> | null): Record<string, unknown>;
