import type { Metadata } from "next";
import SvaraSynapticContacts from "../../SvaraSynapticContacts";

export const metadata: Metadata = { title: "Svara source-local synaptic contacts · Interneuron Atlas" };

export default function SvaraConnectivityPage() {
  return <main className="atlas-shell research-page" id="research-content" tabIndex={-1}>
    <header className="research-page-heading"><p className="page-eyebrow">Sources · Synaptic contacts</p><h1>Svara source-local synaptic contacts</h1><p>Read source-reported contacts within this zebrafish study, with their original cell identities and locators.</p></header>
    <nav className="research-subnav" aria-label="Svara publication pages"><a href="/catalogues/svara">Catalogue pages</a><a href="/connectivity/svara" aria-current="page">Synaptic contacts</a></nav>
    <div className="research-page-content"><SvaraSynapticContacts /></div>
  </main>;
}
