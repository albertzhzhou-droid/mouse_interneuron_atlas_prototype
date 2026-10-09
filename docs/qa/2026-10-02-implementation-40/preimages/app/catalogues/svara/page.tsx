import Link from "next/link";
import SvaraCatalogueGallery from "../../SvaraCatalogueGallery";

export default function SvaraCataloguesPage() {
  return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "1rem" }}>
    <nav aria-label="Research workspaces"><Link href="/" prefetch={false}>← Atlas</Link>{" · "}<Link href="/source-audits" prefetch={false}>Source inputs and mappings</Link>{" · "}<Link href="/connectivity/svara" prefetch={false}>Synaptic contact tables</Link></nav>
    <h1>Svara spinal EM publication catalogues</h1>
    <p>One source study of 6 dpf larval zebrafish. Three exact official supplements contain PDF catalogues. The original publication entries retain their own labels and do not add mouse cells or editable three dimensional models.</p>
    <SvaraCatalogueGallery syncLocation />
  </main>;
}
