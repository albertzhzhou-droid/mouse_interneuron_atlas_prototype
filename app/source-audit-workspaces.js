// These are presentation entry points, never biological or source object IDs.
export const SOURCE_AUDIT_WORKSPACES = Object.freeze([
  Object.freeze({ id: "source-xenium-metadata", title: "Mouse spinal Xenium · run metadata and boundary evidence", description: "Inspect 16 source runs, exact acquired tables and the remaining section, type and reuse gaps.", aliases: [] }),
  Object.freeze({ id: "source-exact-inputs", title: "Sample conditions and publication mapping", description: "Inspect GEO sample conditions, exact barcode checks and bounded publication discovery.", aliases: ["exact-source-audit-heading", "esa-selected-sample-heading"] }),
  Object.freeze({ id: "source-wt-planes", title: "Mouse spinal raw EM and manual nucleus reference", description: "Open two verified native planes from a bounded WT source patch. Cell class remains unknown.", aliases: [] }),
  Object.freeze({ id: "source-comparative-swc", title: "Independent zebrafish and rat morphology references", description: "Open two source reconstructions in their own frames, with zero mouse-census additions or atlas registrations.", aliases: ["comparative-swc-title"] }),
]);

export function sourceAuditWorkspaceForFragment(fragment) {
  if (typeof fragment !== "string") return null;
  let id;
  try { id = decodeURIComponent(fragment.replace(/^#/, "")); } catch { return null; }
  return SOURCE_AUDIT_WORKSPACES.find(row => row.id === id || row.aliases.includes(id))?.id ?? null;
}
