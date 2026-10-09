import Link from "next/link";
import SvaraSynapticContacts from "../../SvaraSynapticContacts";

export default function SvaraConnectivityPage() {
  return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "1rem" }}>
    <nav aria-label="Research workspaces"><Link href="/" prefetch={false}>← Atlas</Link>{" · "}<Link href="/catalogues/svara" prefetch={false}>Original catalogue pages</Link></nav>
    <h1>Svara source-local synaptic contacts</h1>
    <SvaraSynapticContacts />
  </main>;
}
