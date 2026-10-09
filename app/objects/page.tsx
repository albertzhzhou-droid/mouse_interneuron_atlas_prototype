import type { Metadata } from "next";
import IndependentSourceObjectWorkspace from "../IndependentSourceObjectWorkspace";

export const metadata: Metadata = { title: "Exact structural objects · Interneuron Atlas" };

export default function SourceObjectsPage() {
  return <main className="atlas-shell research-page" id="research-content" tabIndex={-1}>
    <header className="research-page-heading"><p className="page-eyebrow">Sources · Structural objects</p><h1>Exact structural objects</h1><p>Inspect source-specific contours, segmentation objects and comparative structural references with their provenance.</p></header>
    <div className="research-page-content"><IndependentSourceObjectWorkspace /></div>
  </main>;
}
