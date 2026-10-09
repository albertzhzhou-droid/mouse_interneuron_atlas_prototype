export type SourceRecordSetInformation = {
  schemaVersion: string; registryReleaseId: string; sourceId: string; recordSetId: string; recordKind: string; unitOfObservation: string;
  includedRecordCount: { value: number | null; unit: string; scope: string; authority: string; missingReason: string | null };
  authority: 'declared_source_information_navigation_only'; sourceBytesVerifiedByThisAction: false; renderedViewCaptured: false;
  newAdmissionCount: 0; newPhysicalCellRosterRows: 0; crossSourceIdentityJoinCount: 0; registrationCount: 0;
  status: 'available' | 'unavailable';
  reference: { status: string; path: string; idField: string; href: string } | null;
  link: { label: string; href: string; adapterId: string } | null;
  reason: string | null; boundary?: string;
};
export function getSourceRecordSetInformation(sourceId: string, recordSetId: string, declaredRecordSet?: unknown): SourceRecordSetInformation;
