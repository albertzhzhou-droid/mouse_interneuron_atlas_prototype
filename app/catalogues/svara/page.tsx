import type { Metadata } from "next";
import SvaraCatalogueGallery from "../../SvaraCatalogueGallery";

export const metadata: Metadata = { title: "Svara spinal EM publication catalogues · Interneuron Atlas" };

export default function SvaraCataloguesPage() {
  return <main className="atlas-shell research-page" id="research-content" tabIndex={-1}>
    <header className="research-page-heading"><p className="page-eyebrow">Sources · Publication catalogues</p><h1>Svara spinal EM publication catalogues</h1><p>One source study of 6 dpf larval zebrafish. Three exact official supplements retain their own labels and do not add mouse cells or editable three dimensional models.</p></header>
    <nav className="research-subnav" aria-label="Svara publication pages"><a href="/catalogues/svara" aria-current="page">Catalogue pages</a><a href="/connectivity/svara">Synaptic contacts</a></nav>
    <div className="research-page-content"><SvaraCatalogueGallery syncLocation /></div>
  </main>;
}
