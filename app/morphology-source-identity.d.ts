import type { MorphologyComparisonRecord } from "./morphology-census-data";
import type { SourceIdentityHierarchy, SourceRelationship } from "./source-object-identity.js";
export function morphologySourceIdentityHierarchy(record: MorphologyComparisonRecord): SourceIdentityHierarchy;
export function morphologyComparisonSourceRelationships(records: MorphologyComparisonRecord[]): SourceRelationship[];
export function validateMorphologyComparisonIdentityReceipt(receipt: unknown): true;
