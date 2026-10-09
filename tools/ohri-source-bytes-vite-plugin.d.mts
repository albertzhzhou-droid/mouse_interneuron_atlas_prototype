import type { Plugin } from "vite";
export const OHRI_SOURCE_BYTES_QUERY: "?ohri-source-bytes";
export const CANO_CHOL_IN_BYTE_RECEIPT: Readonly<{ path: string; bytes: 16348; sha256: string }>;
export const RESEARCH_EXPLORER_BYTE_RECEIPT: Readonly<{ path: string; bytes: number; sha256: string; contentEncoding: string; route: string }>;
export function compileOhriSourceBytesModule(projectRoot: string, filePath: string, bytes: Uint8Array): string;
export function ohriSourceBytesPlugin(projectRoot: string): Plugin;
