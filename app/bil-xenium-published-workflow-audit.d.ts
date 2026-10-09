import audit from '../data/bil-xenium-published-workflow-audit-0.1.json';
export type BilPublishedWorkflowAudit = typeof audit;
export function validateBilPublishedWorkflowAudit(value: BilPublishedWorkflowAudit): { listedBlobs: number; acquiredTextBlobs: number; verifiedInputCount: number; geometryObjects: number };
export function buildBilPublishedWorkflowContext(value: BilPublishedWorkflowAudit, selectedSourceObjectKey: string): { selectedSourceObjectKey: string; relationshipToSelectedRun: 'independent_software_inspection_only'; exactRunEvidence: false; audit: BilPublishedWorkflowAudit };
