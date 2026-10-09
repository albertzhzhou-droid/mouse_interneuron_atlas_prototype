export type SourceAuditCohort = 'all' | 'atlas' | 'en1' | 'embryonic';
export type SourceAuditSample = {
  geoSampleAccession: string;
  sampleTitle: string;
  characteristics: Record<string, { value: string; locator: string; sampleBlockLine: number }>;
  age: { sourceText: string; developmentalEpoch: string };
  workbookRowCount: number;
  barcodeMatchedRowCount: number;
  barcodeMissingRowCount: number;
  clusterAssignment: unknown;
};
export type SourceAuditSampleBookmark = { query: string; cohort: SourceAuditCohort; selectedKey: string | null };
export type SourceAuditSampleBookmarkResult = SourceAuditSampleBookmark & { status: 'default' | 'ready' | 'invalid'; error: string | null };
export type SourceAuditSampleContext<T extends SourceAuditSample = SourceAuditSample> = {
  auditId: string;
  auditDate: string;
  source: { geoSeries: string };
  samples: T[];
};
export function sourceAuditSampleKey(sample: { geoSampleAccession: string }): string;
export function reconcileSourceAuditSelection<T extends { geoSampleAccession: string }>(visibleSamples: T[], selectedGsm: string | null): string | null;
export function sourceAuditNucleusGate(sample: Pick<SourceAuditSample, 'workbookRowCount' | 'barcodeMatchedRowCount' | 'barcodeMissingRowCount' | 'clusterAssignment'>, rights: { publicAssetPackagingAllowed: boolean }): { admitted: boolean; reasons: string[] };
export function filterSourceAuditSamples<T extends SourceAuditSample>(samples: T[], query?: string, cohort?: string): T[];
export function filterPublicationDiscoveryRecords<T extends { publicationDiscoveryStatus: string; neuronId: number; nameRaw: string; archiveRaw: string; release: string; referencePmidRaw: unknown[]; referenceDoiRaw: unknown[] }>(records: T[], query?: string, status?: string): T[];
export function makeSourceAuditExport<R extends unknown[]>({ kind, audit, records, filter, generatedAt }: { kind: 'sample_characteristics' | 'bounded_publication_discovery'; audit: { auditId: string; auditDate: string }; records: R; filter: Record<string, unknown>; generatedAt: string }): { format: string; version: string; kind: string; auditId: string; sourceAuditDate: string; generatedAt: string; filter: Record<string, unknown>; rowCount: number; interpretation: string; sourcePayloadsIncluded: false; runtimeRosterAdmission: false; sameCellJoins: 0; geometryObjects: 0; atlasRegistrations: 0; records: (R[number] & { sourceKey: string })[] };
export function sourceAuditCsv(kind: 'sample_characteristics' | 'bounded_publication_discovery', records: unknown[]): string;
export function readSourceAuditSampleBookmark(params: URLSearchParams, audit: SourceAuditSampleContext): SourceAuditSampleBookmarkResult;
export function writeSourceAuditSampleBookmark(params: URLSearchParams, state: SourceAuditSampleBookmark, audit: SourceAuditSampleContext): URLSearchParams;
export function sourceAuditSampleHref(audit: SourceAuditSampleContext, sample: { geoSampleAccession: string }): string;
