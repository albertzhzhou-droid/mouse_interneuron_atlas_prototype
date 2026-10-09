import SourceAuditWorkspaces from "../SourceAuditWorkspaces";
import Link from "next/link";
import AdditionalResearchEvidence from "../AdditionalResearchEvidence";

export default function SourceAuditsPage() {
  return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "1rem" }}>
    <nav aria-label="Research workspaces"><Link href="/" prefetch={false}>← Atlas</Link>{" · "}<Link href="/objects" prefetch={false}>Exact structural objects</Link></nav>
    <h1>Source inputs and unresolved mappings</h1>
    <p>These views separate verified source metadata from the geometry and biological identities that the available files can establish.</p>
    <SourceAuditWorkspaces followFragments />
    <AdditionalResearchEvidence />
  </main>;
}
