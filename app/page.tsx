import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Overview · Interneuron Atlas" };

type Query = Record<string, string | string[] | undefined>;
const first = (value: Query[string]) => Array.isArray(value) ? value[0] : value;

function legacyDestination(params: Query) {
  if (["v", "cellForm", "cell", "view", "panel"].some(key => first(params[key]))) return "/workspace";
  const lab = first(params.lab);
  const paths: Record<string, string> = { overview: "/research/overview", sources: "/sources", types: "/explore/cell-types", sci: "/research/sci", atlas: "/explore/anatomy", positions: "/explore/positions", morphology: "/explore/morphology/viewer", coverage: "/research/coverage" };
  if (lab === "morphology" && first(params.morphologyQuery)?.trim()) return paths.morphology;
  const kind = first(params.focusKind);
  const focusPaths: Record<string, string> = { molecular_profile: "/explore/cell-types", morphology_record: "/explore/morphology/viewer", anatomy_label: "/explore/anatomy", sci_population: "/research/sci", source_lane: "/research/coverage", sci_entity: "/workspace" };
  if (kind && focusPaths[kind]) return focusPaths[kind];
  if (lab && paths[lab]) return paths[lab];
  if (first(params.type) || first(params.typeCompare)) return paths.types;
  if (first(params.morphologyNeuron) || first(params.morphologyView) || first(params.morphologyQuery)) return paths.morphology;
  if (first(params.anatomyStructure)) return paths.atlas;
  if (first(params.coverageLane)) return paths.coverage;
  if (first(params.researchQuery)) return "/research/explorer";
  if (["q", "tx", "segment", "endpoint", "injury", "slice", "scaffold", "gray", "entities", "observedForm", "micronsCell", "micronsNucleus", "micronsClip", "micronsClipAxis", "micronsClipNm", "micronsClipSide", "compare", "catalog_q", "catalog", "source", "plan", "cellFidelity"].some(key => first(params[key]) !== undefined)) return "/workspace";
  if (["positionFrame", "positionMuscle", "positionSegment", "positionCamera"].some(key => first(params[key]) !== undefined)) return paths.positions;
  return null;
}

export default async function Home({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const destination = legacyDestination(params);
  if (destination) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
    redirect(`${destination}?${query.toString()}`);
  }
  return <main className="atlas-home" id="research-content" tabIndex={-1}>
    <header className="home-introduction">
      <p className="page-eyebrow">MOUSE SPINAL INTERNEURON ATLAS</p>
      <h1>A source-grounded view<br />of spinal interneurons.</h1>
      <p>Explore neuronal form, cell-type evidence and experimental context. Start with a question, then follow a record into its own workspace.</p>
      <Link className="home-search-link" href="/research/explorer"><span>Search across source records</span><span aria-hidden="true">↗</span></Link>
    </header>
    <section className="home-destinations" aria-label="Choose a research area">
      <article>
        <span className="home-section-number">01 / FORM</span>
        <h2><Link href="/explore/morphology">Neuronal morphology <span aria-hidden="true">↗</span></Link></h2>
        <p>Browse deposited reconstructions and inspect the structure of one exact source object.</p>
        <nav aria-label="Morphology pages"><Link href="/explore/morphology">Curated library</Link><Link href="/explore/morphology/viewer">Record viewer</Link></nav>
      </article>
      <article>
        <span className="home-section-number">02 / IDENTITY</span>
        <h2><Link href="/explore/cell-types">Cell-type evidence <span aria-hidden="true">↗</span></Link></h2>
        <p>Read study-local labels, marker profiles and the sampling context behind them.</p>
        <nav aria-label="Cell-type pages"><Link href="/explore/cell-types">Browse profiles</Link><Link href="/explore/cell-types/compare">Compare profiles</Link></nav>
      </article>
      <article>
        <span className="home-section-number">03 / CONTEXT</span>
        <h2><Link href="/research/sci">Conditions &amp; location <span aria-hidden="true">↗</span></Link></h2>
        <p>Explore injury study conditions, exact source positions and reference anatomy.</p>
        <nav aria-label="Context pages"><Link href="/research/sci">SCI conditions</Link><Link href="/explore/anatomy">Anatomy</Link><Link href="/explore/positions">Positions</Link></nav>
      </article>
      <article className="home-workspace-destination">
        <span className="home-section-number">04 / INSPECTION</span>
        <h2><Link href="/workspace">3D workspace <span aria-hidden="true">↗</span></Link></h2>
        <p>Work with a selected morphology, its available layers and traceable evidence.</p>
        <nav aria-label="Workspace pages"><Link href="/workspace">Open workspace</Link><Link href="/objects">Structural objects</Link></nav>
      </article>
    </section>
    <footer className="home-source-note"><p>Each source retains its own identities and coordinate system. Shared labels do not establish the same cell or a spatial registration.</p><Link href="/sources">Sources &amp; provenance →</Link></footer>
  </main>;
}
