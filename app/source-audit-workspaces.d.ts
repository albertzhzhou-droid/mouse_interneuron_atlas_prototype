export type SourceAuditWorkspaceId = "source-xenium-metadata" | "source-exact-inputs" | "source-wt-planes" | "source-comparative-swc";
export const SOURCE_AUDIT_WORKSPACES: readonly { id: SourceAuditWorkspaceId; title: string; description: string; aliases: readonly string[] }[];
export function sourceAuditWorkspaceForFragment(fragment: unknown): SourceAuditWorkspaceId | null;
