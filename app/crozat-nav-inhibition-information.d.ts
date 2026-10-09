import document from '../data/crozat-nav-inhibition-information-0.1.json';
export type CrozatNaVDocument = typeof document;
export type CrozatNaVRow = CrozatNaVDocument['tables'][number]['observations'][number] & {
  sourceFileId: number; sourceFileName: string; sourceFileSha256: string; sourceFileUrl: string; sourceSheet: string;
  sourceHeaderUnit: CrozatNaVDocument['tables'][number]['sourceHeaderUnit'];
  metricUnitAuthority: CrozatNaVDocument['tables'][number]['unitAuthority'];
};
export type CrozatNaVFilter = { tableId?: string; regionRaw?: string; condition?: string; query?: string };
export const crozatNaVInformation: CrozatNaVDocument;
export function validateCrozatNaVDocument(doc: unknown): CrozatNaVDocument;
export function filterCrozatNaVRows(filter?: CrozatNaVFilter): CrozatNaVRow[];
export function reconcileCrozatNaVSelection(rows: readonly CrozatNaVRow[], id: string | null): string | null;
export function makeCrozatNaVExport(rows: readonly CrozatNaVRow[], filter?: CrozatNaVFilter, scope?: 'filtered_rows' | 'selected_row'): Readonly<Record<string, unknown>>;
export function crozatNaVCsv(rows: readonly CrozatNaVRow[]): string;
