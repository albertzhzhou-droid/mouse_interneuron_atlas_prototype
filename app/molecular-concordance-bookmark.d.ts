import type { ResearchRecord } from "./ResearchExplorer";

export type MolecularConcordanceViewState = {
  query: string;
  namespace: string;
  page: number;
  selectedKeys: string[];
  anchorKey: string;
};
export type MolecularConcordanceBookmarkAuthority = {
  records: ResearchRecord[];
  verifiedDecodedSha256: string;
};
export type MolecularConcordanceBookmarkResult = {
  status: "default" | "ready" | "invalid";
  error: string;
  view: MolecularConcordanceViewState;
};
export const MOLECULAR_CONCORDANCE_BOOKMARK_KEYS: readonly string[];
export const MOLECULAR_CONCORDANCE_PAGE_SIZE: 12;
export const MOLECULAR_CONCORDANCE_QUERY_LIMIT: 180;
export function emptyMolecularConcordanceView(): MolecularConcordanceViewState;
export function filterMolecularConcordanceCandidates<R extends ResearchRecord>(records: R[], filter?: { query?: string; namespace?: string }): R[];
export function readMolecularConcordanceBookmark(input: string | URLSearchParams, authority: MolecularConcordanceBookmarkAuthority): MolecularConcordanceBookmarkResult;
export function makeMolecularConcordanceBookmarkParams(input: string | URLSearchParams, authority: MolecularConcordanceBookmarkAuthority, view: MolecularConcordanceViewState, options?: { clear?: boolean }): URLSearchParams;
