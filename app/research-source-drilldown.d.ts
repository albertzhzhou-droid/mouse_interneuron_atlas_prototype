export type SourceNavigationEntry = { id: string; label: string; href: string; sourceId: string; recordSetId: string; download: boolean };
export type SourceRecordSetNavigation = {
  schemaVersion: string; registryReleaseId: string; sourceId: string; recordSetId: string; recordKind: string; unitOfObservation: string;
  includedRecordCount: { value: number | null; unit: string; scope: string; authority: string; missingReason: string | null };
  authority: 'declared_metadata_navigation_only'; boundary: string; newAdmissionCount: 0; crossSourceIdentityJoinCount: 0; registrationCount: 0;
  status: 'available' | 'unavailable'; referenceKind?: 'childRosterRef' | 'sourceObjectSetRef';
  reference: { status: string; path: string | null; idField: string | null; missingReason: string | null };
  sourceObjectSetReference?: { status: string; path: string | null; idField: string | null; missingReason: string | null } | null;
  entries: SourceNavigationEntry[]; reason: string | null;
};
export function getSourceRecordSetNavigation(sourceId: string, recordSetId: string, declaredRecordSet?: unknown): SourceRecordSetNavigation;
export function sourceDrilldownReceipt(sourceId: string, recordSetId: string): SourceRecordSetNavigation & { requestedSourcePage: string; renderedViewCaptured: false; sourceBytesVerifiedByThisReceipt: false; sourceCitation: unknown; rights: unknown };
export function writeSourceRegistryLocation(href: string, values: Record<string, string | null>): string;
export function readSourceRegistryRecordSetSelection(params: URLSearchParams, sourceId: string | null): { recordSetId: string | null; error: string | null };
export function readSourceRegistrySelection(params: URLSearchParams): { sourceId: string | null; error: string | null };
