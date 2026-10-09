export type SameCellInternalSourceGate = {
  documentType: "same_cell_internal_source_gate"; schemaVersion: "0.1.0"; upgradeId: "UPG-118";
  targetKey: string | null; componentKey: string | null; eligible: boolean;
  internalLayerStatus: "Eligible_for_source_local_renderer" | "Unavailable";
  checks: readonly { id: string; label: string; status: "passed" | "unavailable"; reason: string; locator: string | null }[];
  missingRequiredFields: readonly string[]; geometryObjectsAdmittedByThisEvaluation: 0;
  registrationsCreated: 0; crossSourceIdentityCreated: false; boundary: string;
};
export const SAME_CELL_INTERNAL_SOURCE_FIELDS: readonly { id: string; label: string }[];
export function evaluateSameCellInternalSource(options?: { targetHierarchy?: unknown; targetCoordinateFrame?: unknown; candidate?: unknown; requiredStructureKind?: "nucleus" | "organelle" | "synaptic_structure" | "receptor_distribution"; verifiedEvidence?: readonly unknown[]; runtimeReceipts?: readonly unknown[] }): SameCellInternalSourceGate;
