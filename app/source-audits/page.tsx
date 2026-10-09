import type { Metadata } from "next";
import Link from "next/link";
import SourceAuditWorkspaces from "../SourceAuditWorkspaces";

export const metadata: Metadata = { title: "Source inputs and unresolved mappings · Interneuron Atlas" };

export default function SourceAuditsPage() {
  return <main className="atlas-shell research-page" id="research-content" tabIndex={-1}>
    <header className="research-page-heading"><p className="page-eyebrow">Sources · Input records</p><h1>Source inputs and unresolved mappings</h1><p>Inspect verified source metadata and what the available files can establish about geometry and biological identity.</p></header>
    <div className="research-page-content"><SourceAuditWorkspaces followFragments /></div>
    <p className="research-related-link"><Link href="/explore/cell-types/additional">Browse additional study evidence →</Link></p>
  </main>;
}
