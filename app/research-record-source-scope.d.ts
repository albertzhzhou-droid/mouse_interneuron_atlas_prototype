import type { ResearchRecord } from "./ResearchExplorer";
import type { ResearchMorphologyRenderingPolicy } from "./research-morphology-rendering-policy.js";

export type RecordScopeInput = { record: ResearchRecord; collection: ResearchRecord[]; baseIndex: unknown; registry: unknown; mvp: unknown };
export type ContextScopeField = { value: string | null; status: string; context: string; authority: string; missingReason: string | null; locator: string };
export type ResearchRecordSourceScope = {
  documentType: "research_record_source_scope"; schemaVersion: "0.2.0";
  recordKey: string; namespace: string; focusKind: ResearchRecord["focusKind"]; focusId: string;
  recordLocation: { path: string; pointer: string; releaseId: string; status: string; sourceContract?: string; contractSha256?: string };
  displayUnit: string; underlyingObservationUnit: string | null; registryReleaseId: string;
  sourceId: string | null; sourceResolution: string; sourceLocator: string | null; sourceMissingReason: string | null;
  species: ContextScopeField[]; lifeStages: ContextScopeField[]; regions: ContextScopeField[];
  experimentalUnits: Array<{ unit: string; count: number | null; scope: string; authority: string; missingReason: string | null; status: string; locator: string; pooledWithOtherUnits: false }>;
  conditions: Array<Record<string, unknown> & { id: string; species: string; lifeStage: string; experimentalUnit: string; sampleSize: unknown; locator: string; fieldLocators: Record<string, string> }>;
  fieldLocators: Array<ResearchRecord["evidence"][number] & { index: number; projectFieldLocator: string; materializationStatus: string; upstreamLocatorStatus: string; biologicalTruthVerifiedByHash: false }>;
  gaps: ResearchRecord["gaps"];
  renderingPolicy: ResearchMorphologyRenderingPolicy | null;
  physicalSpecimenIdentity: { status: "not_established"; id: null; reason: string };
  relationship: { type: "co_display_only"; samePhysicalObject: false; sourcePopulationJoinGranted: false; grantsGeometryTransfer: false };
  scientificBoundary: string;
};
export type ResearchRecordScientificDossier = {
  documentType: "research_record_scientific_dossier"; schemaVersion: "0.2.0"; applicationVersion: string;
  selection: { key: string; generation: number; namespace: string; status: "current_verified_record" };
  sourceScope: ResearchRecordSourceScope; record: ResearchRecord;
  view: { status: "not_included"; camera: null; clipping: null; renderedRevision: null; reason: string };
};
export function deriveResearchRecordSourceScope(input: RecordScopeInput): ResearchRecordSourceScope;
export function exportResearchRecordDossier(input: RecordScopeInput, options: { applicationVersion: string; selectionGeneration: number; requestedKey: string }): ResearchRecordScientificDossier;
export function researchRecordDossierCsv(dossier: ResearchRecordScientificDossier): string;
