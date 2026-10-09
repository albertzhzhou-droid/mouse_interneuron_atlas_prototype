import IndependentSourceObjectWorkspace from "../IndependentSourceObjectWorkspace";
import Link from "next/link";

export default function SourceObjectsPage() {
  return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "1rem" }}>
    <nav aria-label="Research workspaces"><Link href="/">← Return to the spinal interneuron atlas</Link>{" · "}<Link href="/source-audits">Source inputs and unresolved mappings</Link></nav>
    <h1>Exact structural objects</h1>
    <IndependentSourceObjectWorkspace />
  </main>;
}
