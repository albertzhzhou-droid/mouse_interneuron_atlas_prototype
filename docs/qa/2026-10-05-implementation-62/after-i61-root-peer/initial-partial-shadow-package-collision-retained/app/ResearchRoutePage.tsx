import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ResearchCollectionPage, { type ResearchPageId } from "./ResearchCollectionPage";

type Query = Record<string, string | string[] | undefined>;
const PAGES: Record<string, { id: ResearchPageId; title: string; section: string; description: string }> = {
  "/explore/morphology": { id: "morphology", title: "Morphology library", section: "Explore · Morphology", description: "Choose a documented reconstruction, then open its exact source object in the 3D workspace." },
  "/explore/morphology/viewer": { id: "morphology-viewer", title: "Morphology record viewer", section: "Explore · Morphology", description: "Search deposited records and inspect one source at a time. Repository labels preserve their original meaning." },
  "/explore/cell-types": { id: "cell-types", title: "Cell-type profiles", section: "Explore · Cell types", description: "Browse source-defined profiles, marker evidence and sampling context within each study." },
  "/explore/cell-types/zebrafish": { id: "zebrafish", title: "Zebrafish comparison", section: "Explore · Cell types", description: "Read the separate larval zebrafish taxonomy. These labels do not establish equivalence to mouse cell types." },
  "/explore/cell-types/additional": { id: "additional-types", title: "Additional study evidence", section: "Explore · Cell types", description: "Inspect complementary study-local populations, experimental observations and their reported limits." },
  "/explore/cell-types/compare": { id: "type-compare", title: "Profile comparison", section: "Explore · Cell types", description: "Compare source-reported molecular features while keeping each study's identities and denominators separate." },
  "/explore/anatomy": { id: "anatomy", title: "Reference anatomy", section: "Explore · Anatomy", description: "Browse source-labelled spinal reference planes. Anatomy labels do not assign a molecular identity to a cell." },
  "/explore/positions": { id: "positions", title: "Premotor positions", section: "Explore · Positions", description: "Inspect exact early-postnatal source coordinates in their original or source-normalized frames." },
  "/research/explorer": { id: "explorer", title: "Search source records", section: "Research · Record search", description: "Find a label, marker, publication or accession, then continue to its dedicated research page." },
  "/research/overview": { id: "overview", title: "Evidence map", section: "Research · Evidence", description: "Review source coverage, admitted objects and unresolved evidence limits before opening a study or record." },
  "/research/sci": { id: "sci", title: "SCI study conditions", section: "Research · Injury", description: "Follow reported population counts across samples and conditions. Counts retain their source-specific sampling context." },
  "/research/coverage": { id: "coverage", title: "Evidence coverage", section: "Research · Coverage", description: "Compare which questions each source can address and where evidence is missing." },
  "/sources": { id: "sources", title: "Source registry", section: "Sources · Registry", description: "Trace citations, exact records, source files, reuse terms and the boundaries of each admitted dataset." },
};
const morphologyLinks = [{ href: "/explore/morphology", label: "Curated library" }, { href: "/explore/morphology/viewer", label: "Record viewer" }];
const typeLinks = [{ href: "/explore/cell-types", label: "Profiles" }, { href: "/explore/cell-types/compare", label: "Compare profiles" }, { href: "/explore/cell-types/additional", label: "Additional studies" }, { href: "/explore/cell-types/zebrafish", label: "Zebrafish comparison" }];

export function getResearchPageMetadata(path: string): Metadata {
  const page = PAGES[path];
  if (!page) notFound();
  return { title: `${page.title} · Interneuron Atlas`, description: page.description };
}

export default function ResearchRoutePage({ path, initialParams }: { path: string; initialParams: Query }) {
  const page = PAGES[path];
  if (!page) notFound();
  const localLinks = path.startsWith("/explore/morphology") ? morphologyLinks : path.startsWith("/explore/cell-types") ? typeLinks : null;
  return <main className="atlas-shell research-page" id="research-content" tabIndex={-1}>
    <header className="research-page-heading">
      <p className="page-eyebrow">{page.section}</p>
      <h1>{page.title}</h1>
      <p>{page.description}</p>
    </header>
    {localLinks && <nav className="research-subnav" aria-label={`${page.section} pages`}>
      {localLinks.map(link => <a key={link.href} href={link.href} aria-current={path === link.href ? "page" : undefined}>{link.label}</a>)}
    </nav>}
    <div className="research-page-content"><ResearchCollectionPage key={page.id} pageId={page.id} initialParams={initialParams} /></div>
  </main>;
}
