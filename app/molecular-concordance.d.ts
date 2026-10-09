import type { ResearchRecord } from "./ResearchExplorer";
export type MolecularSourceScope = { namespace: string; path: string; releaseId: string; lifeStage: string; lifeStageLocator?: string; profileIds: string[] };
export type ConcordanceEvidence = { status: string; rawValue: string | null; sourceRowLabel: string | null; authority: string; locator: string | null; reasonCode: string | null; detail: string | null };
export type ConcordanceMarkers = ConcordanceEvidence & { exactStrings: string[]; parsingPolicy: string };
export type ConcordanceProfile = { key: string; focusId: string; title: string; namespace: string; recordKind: string; unitOfObservation: string; identity: "not_established"; markers: ConcordanceMarkers; fields: Record<"transmitter" | "region" | "life_stage", ConcordanceEvidence>; sourceConflicts: Record<string, unknown>[]; provenance: ResearchRecord["provenance"] };
export type ConcordancePair = {
  anchorKey: string; comparisonKey: string; relation: "inspection_candidate"; identity: "not_established";
  markers: { status: string; sharedExactStrings: string[]; anchorOnlyStrings: string[]; comparisonOnlyStrings: string[]; anchorEvidence: ConcordanceMarkers; comparisonEvidence: ConcordanceMarkers; boundary: string };
  fields: Record<"transmitter" | "region" | "life_stage", { status: string; anchorEvidence: ConcordanceEvidence; comparisonEvidence: ConcordanceEvidence; boundary: string }>;
  sourceConflicts: { anchor: Record<string, unknown>[]; comparison: Record<string, unknown>[] };
};
export type MolecularConcordance = { documentType: "molecular_source_concordance"; schemaVersion: string; anchorKey: string; selectedKeys: string[]; profiles: ConcordanceProfile[]; comparisons: ConcordancePair[]; sourceDenominator: { value: number; unit: "source_profiles"; namespaceCounts: Record<string, number>; deduplicationCount: 0 }; identity: "not_established"; sameCellJoinCount: 0; sameTypeJoinCount: 0; generatedGeometryCount: 0; boundary: string };
export function molecularConcordanceProfile(record: ResearchRecord, options?: { sourceScopes?: MolecularSourceScope[] }): ConcordanceProfile;
export function buildMolecularConcordance(records: ResearchRecord[], options: { anchorKey: string; selectedKeys: string[]; sourceScopes?: MolecularSourceScope[] }): MolecularConcordance;
export function molecularConcordanceCsv(report: MolecularConcordance): string;
