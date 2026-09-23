import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import { resolveMolecularRecordLifeStage } from "../app/research-explorer-index.js";
import {
  deriveResearchSourceRegistrySummary,
  formatResearchSourceRegistrySummary,
  formatResearchSourceRegistryTab,
} from "../app/research-source-registry-summary.js";

const researchSourceRegistry = JSON.parse(await readFile(new URL("../data/research-source-registry-0.1.json", import.meta.url), "utf8"));
const researchSourceRegistrySummary = deriveResearchSourceRegistrySummary(researchSourceRegistry);
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const currentIteration = packageJson.version.match(/^(\d+\.\d+)\.\d+/)?.[1];
assert.ok(currentIteration, "The active package must declare a research iteration version");

const CJK_CHARACTER = /[\u1100-\u11ff\u2e80-\u2eff\u3000-\u303f\u3040-\u30ff\u3100-\u312f\u3130-\u318f\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\ua960-\ua97f\uac00-\ud7af\uf900-\ufaff\ufe30-\ufe4f\uff66-\uff9f\u{20000}-\u{2fa1f}]/u;

async function collectUiSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) return collectUiSourceFiles(url);
    return /\.(?:css|[jt]sx?)$/.test(entry.name) ? [url] : [];
  }));
  return files.flat();
}

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the mouse spinal Research MVP atlas", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  const normalized = html.replaceAll("<!-- -->", "");
  assert.match(html, /Mouse Spinal Interneuron Atlas/);
  assert.ok(html.includes(`LOCALHOST PUBLIC-DATA RESEARCH ITERATION ${currentIteration}`));
  assert.ok(normalized.includes(`Unpackaged research iteration ${currentIteration}`));
  assert.match(normalized, /source catalog 0\.4\.0/);
  assert.match(normalized, /7 public sources · 21 source-admission records/);
  assert.match(html, /Mus musculus/);
  assert.match(html, /Five populations \+ two state overlays/);
  assert.match(html, /Research visualization only/);
  assert.match(html, /Import state/);
  assert.match(html, /Export JSON/);
  assert.match(html, /Export CSV/);
  assert.match(html, /Export PNG/);
  assert.match(normalized, /-12\.0 display u\. · SYN guide/);
  assert.match(html, /aria-controls="evidence-panel"/);
  assert.match(html, /aria-controls="benchmarks-panel"/);
  assert.match(html, /aria-controls="sources-panel"/);
  assert.match(html, /aria-controls="review-panel"/);
  const fileInput = html.match(/<input[^>]*type="file"[^>]*>/)?.[0] ?? "";
  assert.match(fileInput, /accept="application\/json,.json"/);
  assert.match(fileInput, /hidden=""/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("keeps UI source, metadata and representative SSR states English-only", async () => {
  const sourceFiles = await collectUiSourceFiles(new URL("../app/", import.meta.url));
  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, CJK_CHARACTER, `CJK UI text found in ${file.pathname}`);
  }

  for (const path of ["/", "/?lab=morphology&cellForm=249676&observedForm=1&morphologyView=compare", "/?panel=gaps", "/?panel=sources", "/?panel=review", "/?panel=benchmarks"]) {
    const response = await render(path);
    assert.equal(response.status, 200);
    const html = await response.text();
    const normalized = html.replaceAll("<!-- -->", "");
    assert.match(html, /<html lang="en">/);
    assert.ok(html.includes(`Mouse Spinal Interneuron Atlas · Public-Data Research Iteration ${currentIteration}`));
    assert.match(html, /A localhost evidence-linked public-data workbench for mouse spinal interneuron and SCI research across source-declared life stages\./);
    assert.doesNotMatch(html, CJK_CHARACTER, `CJK text found in SSR output for ${path}`);
    if (path === "/?panel=gaps") {
      assert.match(html, /Highest-impact cross-lane gaps/);
      assert.match(html, /No validated Russ ↔ Sathyamurthy ↔ canonical-family mapping/);
      assert.match(html, /Zero complete axons are reported; morphology cannot establish a connectome/);
    }
    if (path === "/?lab=morphology&cellForm=249676&observedForm=1&morphologyView=compare") {
      assert.match(normalized, /UPG-213 · SOURCE-LOCAL MOUSE SPINAL MICRODETAIL/);
      assert.match(normalized, /One recorded inhibitory interneuron, shown from morphology to ultrastructure/);
      assert.match(normalized, /Source caption links panel d to panels e–g only/);
      assert.match(normalized, /Figure 1 reproduced unchanged under CC BY 4\.0/);
      assert.match(normalized, /0 segmentations · 0 meshes · 0 source z-coordinates · 0 active-record joins · 0 atlas registrations/);
      assert.match(normalized, /Figure 1: panels a to d show black dendritic trees and red axonal arbors/);
    }
    if (path === "/?panel=sources") {
      assert.match(html, /Public-data-only policy/);
      assert.match(html, /SpinalJ registration reproducibility benchmark/);
      assert.match(html, /no automatic remote acquisition/);
      assert.match(html, /Metadata audited; files not admitted/);
      assert.match(html, /OBJECT-LEVEL PREFLIGHT · LOCAL JSON ONLY/);
      assert.match(html, /File manifest gate/);
      assert.match(html, /Import file manifest/);
      assert.match(html, /LOCAL METADATA COMPOSER/);
      assert.match(html, /Export file-admission manifest/);
      assert.match(html, /NO DOWNLOAD · 0 REG/);
      assert.match(html, /DETACHED RO-CRATE 1\.3/);
      assert.match(html, /Export RO-Crate metadata/);
      assert.match(html, /EXTERNAL ONLY · 0 REG/);
      assert.match(html, /PUBLIC-SOURCE FEASIBILITY PLANNER/);
      assert.match(html, /Can this research question be supported\?/);
      assert.match(html, /Export feasibility receipt/);
      assert.match(html, /PLANNING ONLY · 0 REG/);
      assert.match(html, /TWO-LANE PROVENANCE TRACE/);
      assert.match(html, /Trace evidence without inventing a join/);
      assert.match(html, /NO CROSS-LANE EDGE/);
      assert.match(html, /Export provenance trace receipt/);
      assert.match(html, /CROSS-LANE ADMISSION GATE/);
      assert.match(html, /Describe the missing evidence; do not create the edge/);
      assert.match(html, /NOT ADMITTED · 0 REG/);
      assert.match(html, /Export not-admitted proposal/);
      assert.match(html, /0/);
    }
    if (path === "/?panel=review") {
      assert.match(html, /Review receipt inbox/);
      assert.match(html, /2\.8\.0-curator\.1/);
      assert.match(html, /feedback cannot alter it/);
      assert.match(html, /Import curator feedback/);
      assert.match(html, /Independent-curator comparison/);
      assert.match(html, /does not recalculate or certify the original ZIP digest/);
      assert.match(html, /Verify adjudication packet/);
      assert.match(html, /Fewer than the required number of independent curator records are loaded/);
    }
  }
});

test("makes the research overview the first/default information experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /Research atlas/);
  assert.match(normalized, /Interneuron Research Explorer/);
  assert.match(normalized, /Search 641 cross-lane source records by label, marker, DOI, PMID or accession/);
  assert.match(normalized, /387 source profiles · 149 frozen cross-lane morphologies · 73 anatomy labels · 17 SCI populations · 7 SCI entities · 8 source lanes · separate exact morphology universe 1,097/);
  assert.match(normalized, /157 Roome embryonic refined dIL aggregates, 51 Delile E9\.5–E13\.5 fine-subtype aggregates/);
  assert.match(normalized, /membership-aware comparison over 142 census plus seven supplementary exact routes/);
  assert.match(normalized, /aria-label="Start exploring"/);
  assert.match(normalized, /Explore a reconstructed neuron/);
  assert.match(normalized, /Find a molecular profile/);
  assert.match(normalized, /Explore SCI study conditions/);
  assert.match(normalized, /What the current model can answer/);
  assert.ok(normalized.includes(formatResearchSourceRegistrySummary(researchSourceRegistrySummary)));
  assert.match(normalized, /387 source profiles · 10 studies/);
  assert.match(normalized, /17 populations · 5 conditions · 15 cords/);
  assert.match(normalized, /<strong>1,097 exact SWCs · frozen adult subset 142<\/strong>/);
  assert.match(normalized, /checksum-gated browser over all 1,097 no-age-query source objects/);
  assert.match(normalized, /Seven exact records now expose 72 checksum-gated source-native soma-contour LineLoops \/ 5,149 vertices/);
  assert.match(normalized, /NMO_108978 \(12 loops \/ 2,614 vertices\) and NMO_249676 \(12 \/ 156\) in their independent source-native frames/);
  assert.match(normalized, /NMO_50424 = 8 \/ 427, NMO_50394 = 14 \/ 768 and NMO_50408 = 11 \/ 709/);
  assert.match(normalized, /raw sourceClosedFlag=false is preserved/);
  assert.match(normalized, /User Line 1–4 remain excluded/);
  assert.match(normalized, /<strong>Internal-detail evidence gate · UPG-118–136:<\/strong>/);
  assert.match(normalized, /no admitted open source currently provides same-cell EM or organelle segmentation for <code>mouse\.sc\.vsx2_hoxa10<\/code>/);
  assert.match(normalized, /No molecular population, SCI time-course population, morphology or causal SCI evidence entity is registered/);
  assert.ok(normalized.indexOf("Research atlas") < normalized.indexOf("id=\"sci-evidence-workspace\""), "research overview should precede the 3D evidence workspace");
});

test("server-renders the canonical source registry with lane-scoped filters and record granularity", async () => {
  const response = await render("/?lab=sources");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /Research source registry/);
  assert.ok(normalized.includes(formatResearchSourceRegistryTab(researchSourceRegistrySummary)));
  assert.match(normalized, /canonical source packages/);
  assert.match(normalized, /legacy aliases resolved/);
  assert.match(normalized, /All source-declared species/);
  assert.match(normalized, /All source-declared stages/);
  assert.match(normalized, /Source → record set → exact child gate/);
  assert.match(normalized, /bundled exact cell\/profile rosters/);
  assert.match(normalized, /bundled exact source-object sets/);
  assert.match(normalized, /SRC-ALLEN-CORD-20UM-3/);
  assert.match(normalized, /Observation unit/);
  assert.match(normalized, /Public access does not imply redistribution permission/);
  assert.match(normalized, /0 CROSS-SOURCE IDENTITIES · 0 REG/);
  assert.match(normalized, /Linked research milestones · machine-resolved/);
  assert.match(normalized, /Current blocker/);
  assert.match(normalized, /Acceptance boundary/);
});

test("server-renders the exact early-postnatal Ronzano point lane without cell or registration promotion", async () => {
  const response = await render("/?lab=positions&positionFrame=normalized&positionMuscle=TA&positionSegment=L4");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /Positions · 22 exact XYZ workbooks/);
  assert.match(normalized, /UPG-114 · PHASE A · EXACT SOURCE COORDINATE ROWS/);
  assert.match(normalized, /Lumbar premotor position atlas/);
  assert.match(normalized, /Every visible mark is one exact numeric XYZ row from a checksum-pinned Ronzano et al\. eLife source workbook/);
  assert.match(normalized, /22 \/ 22/);
  assert.match(normalized, /14,484/);
  assert.match(normalized, /17,394/);
  assert.match(normalized, /POINT POSITION ONLY · NO CELL GEOMETRY/);
  assert.match(normalized, /RAW ↔ NORMALIZED IDENTITY IS DELIBERATELY BLOCKED/);
  assert.match(normalized, /Source-local · 0 atlas joins · 0 REG/);
  assert.match(normalized, /The source does not establish persistence of this output-connectivity organization into adulthood/);
  assert.match(normalized, /10\.7554\/eLife\.81976|Primary article/);
});

test("server-renders the exact MICrONS cell+nucleus reference with hard cross-region boundaries", async () => {
  const response = await render("/?view=microns_observed_reference&panel=structure&micronsCell=1&micronsNucleus=1");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /Observed EM cell \+ nucleus/);
  assert.match(normalized, /Exact cell segmentation \+ linked nucleus/);
  assert.match(normalized, /648518346349516051/);
  assert.match(normalized, /Linked nucleus segmentation/);
  assert.match(normalized, /372,382 vertices · 704,444 triangles/);
  assert.match(normalized, /12,682 vertices · 23,344 triangles/);
  assert.match(normalized, /Segmentation surface ≠ membrane measurement/);
  assert.match(normalized, /No mitochondria, synapses, ER, Golgi, receptors, other organelles, spinal identity or molecular subtype are admitted/);
  assert.match(normalized, /False · co-display only · 0 joins/);
});

test("server rendering keeps NMO 109021 geometry closed until the shared active record verifies", async () => {
  const morphologyResponse = await render("/?focusKind=morphology_record&focusId=NeuroMorpho:109021&cellForm=109021&observedForm=1&cellFidelity=surface&view=cell_detail&panel=structure");
  assert.equal(morphologyResponse.status, 200);
  const morphology = (await morphologyResponse.text()).replaceAll("<!-- -->", "");
  assert.match(morphology, /0 admitted main-scene geometry/);
  assert.doesNotMatch(morphology, /Source-local cell detail · NMO 109021/);
  assert.match(morphology, /Independent adult-mouse GRP dorsal-horn observed morphology/);
  assert.match(morphology, /2,790 \/ 2,789/);

  const internalResponse = await render("/?focusKind=morphology_record&focusId=NeuroMorpho:109021&cellForm=109021&observedForm=1&cellFidelity=surface&view=internal_reference&panel=structure");
  assert.equal(internalResponse.status, 200);
  const internal = (await internalResponse.text()).replaceAll("<!-- -->", "");
  assert.match(internal, /Object-level compartment evidence audit/);
  assert.match(internal, /0 same-record internal primitives · 5 vocabulary classes remain UNAVAILABLE/);
  assert.match(internal, /0 rendered primitives · 0 source meshes · 0 joins · 0 REG/);
  assert.match(internal, /Compartment evidence audit/);
  assert.match(internal, /Cross-region internal object-geometry audit/);
  assert.match(internal, /zero primitives/);
});

test("server-renders ten exact spinal route records while active geometry remains client-verification gated", async () => {
  const [libraryResponse, grprResponse, pvResponse, pdynResponse, renshawResponse, npyResponse, nnosPrpResponse, galaninPrpResponse, premotorResponse] = await Promise.all([
    render("/?lab=morphology&cellForm=249676&observedForm=1&view=cell_detail"),
    render("/?cellForm=249676&observedForm=1&cellFidelity=surface&view=cell_detail"),
    render("/?cellForm=170035&observedForm=1&cellFidelity=surface&view=cell_detail"),
    render("/?cellForm=104003&observedForm=1&view=cell_detail"),
    render("/?cellForm=45674&observedForm=1&cellFidelity=surface&view=cell_detail"),
    render("/?cellForm=50424&observedForm=1&cellFidelity=surface&view=cell_detail"),
    render("/?cellForm=50394&observedForm=1&cellFidelity=surface&view=cell_detail"),
    render("/?cellForm=50408&observedForm=1&cellFidelity=surface&view=cell_detail"),
    render("/?cellForm=45718&observedForm=1&cellFidelity=surface&view=cell_detail"),
  ]);
  for (const response of [libraryResponse, grprResponse, pvResponse, pdynResponse, renshawResponse, npyResponse, nnosPrpResponse, galaninPrpResponse, premotorResponse]) assert.equal(response.status, 200);

  const library = (await libraryResponse.text()).replaceAll("<!-- -->", "");
  assert.match(library, /Morphology · 1,097 exact source objects/);
  assert.match(library, /Exact universe · 1,097 source objects/);
  assert.match(library, /Frozen adult subset · 142 exact SWCs/);
  assert.doesNotMatch(library, /Morphology · 142 census · 9 separate exact routes/);
  assert.match(library, /Observed morphology route library/);
  assert.match(library, /10<\/strong> named routes/);
  assert.match(library, /13<\/strong> unique main-scene forms/);
  assert.match(library, /7<\/strong> supplementary comparator objects/);
  assert.match(library, /The four-record dorsal-horn subtype pack reuses 2 frozen records and adds 2 supplementary exact objects/);
  assert.match(library, /The Renshaw\/NPY functional-class pack adds 2, the nNOS\/galanin PrP-reporter pack adds 2, and the independent premotor comparison pack adds 1; none expands the census/);
  assert.match(library, /GRPRCreERT2-captured excitatory lamina I-II interneuron/);
  assert.match(library, /Tac1Cre \/ Brainbow SP-class excitatory interneuron/);
  assert.match(library, /PVCre \/ Brainbow Pax2-positive inhibitory lamina II-III interneuron/);
  assert.match(library, /PdynCre \/ AAV-eGFP, Sst2a-receptor-positive inhibitory interneuron/);
  assert.match(library, /Calbindin-positive glycinergic Renshaw interneuron/);
  assert.match(library, /NPY-positive superficial lumbar dorsal-horn interneuron/);
  assert.match(library, /PrP-promoter reporter-positive nNOS-positive interneuron/);
  assert.match(library, /PrP-promoter reporter-positive galanin-positive interneuron/);
  assert.match(library, /Repository-labelled calbindin-negative glycinergic premotor \/ non-Renshaw interneuron/);
  assert.match(library, /Repository label ≠ definitive paper-level subtype/);
  assert.match(library, /calbindin non-detection can reflect washout/);
  assert.match(library, /standardized SWC header states that 8 original soma contours were averaged into 8 type-1 soma points/i);
  assert.doesNotMatch(library, /Shrinkage is reported but uncorrected with no numeric factor/);
  assert.match(library, /Repository metadata warning/);
  assert.match(library, /Repository weight bounds are 27–15 g and are invalid for interpretation/);
  assert.match(library, /0 identity joins/);
  assert.match(library, /0 exact physiology joins/);
  assert.match(library, /0 internal primitives/);

  for (const response of [grprResponse, pvResponse, pdynResponse, renshawResponse, npyResponse, nnosPrpResponse, galaninPrpResponse, premotorResponse]) {
    const record = (await response.text()).replaceAll("<!-- -->", "");
    assert.match(record, /0 admitted main-scene geometry/);
    assert.doesNotMatch(record, /Source-local cell detail · NMO/);
  }
});

test("server-renders one canonical research focus into the matching controlled lane", async () => {
  const response = await render("/?lab=types&focusKind=molecular_profile&focusId=russ-2021%3AExcit-36");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /data-focus-kind="molecular_profile"/);
  assert.match(normalized, /data-focus-id="russ-2021:Excit-36"/);
  assert.match(normalized, /data-active-lab="types"/);
  assert.match(normalized, /data-canonical-focus-lab="types"/);
  assert.match(normalized, /data-focus-lab-state="aligned"/);
  assert.match(normalized, /data-record-status="verifying"/);
  assert.match(normalized, /molecular_profile:russ-2021:Excit-36/);
  assert.doesNotMatch(normalized, /No evidence entity selected/);
  assert.match(normalized, /Vsx2 · Sox14 · Shox2/);
  assert.match(normalized, /Source-local interneuron or projection-neuron candidate/);
});

test("a morphology focus overrides a stale requested type lab and receives a record-aware evidence rail", async () => {
  const response = await render("/?lab=types&panel=evidence&focusKind=morphology_record&focusId=NeuroMorpho%3A109021&cellForm=109021&observedForm=1&cellFidelity=surface");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /data-focus-kind="morphology_record"/);
  assert.match(normalized, /data-focus-id="NeuroMorpho:109021"/);
  assert.match(normalized, /data-active-lab="morphology"/);
  assert.match(normalized, /data-canonical-focus-lab="morphology"/);
  assert.match(normalized, /data-focus-lab-state="aligned"/);
  assert.match(normalized, /data-record-status="verifying"/);
  assert.match(normalized, /morphology_record:NeuroMorpho:109021/);
  assert.doesNotMatch(normalized, /No evidence entity selected/);
});

test("server-renders the source-local Matson SCI time course with exact replicate denominators", async () => {
  const response = await render("/?lab=sci&focusKind=sci_population&focusId=matson-2022%3AGSE172167%3APdyn_Neurons&sciTime=3wpi");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /SCI states · 17 populations \/ 5 conditions/);
  assert.match(normalized, /Lumbar neuronal states after T9 contusion/);
  assert.match(normalized, /15 independent cords/);
  assert.match(normalized, /23,651/);
  assert.match(normalized, /data-focus-kind="sci_population"/);
  assert.match(normalized, /data-focus-id="matson-2022:GSE172167:Pdyn_Neurons"/);
  assert.match(normalized, /Pdyn Neurons/);
  assert.match(normalized, /Complete ranked marker panel/);
  assert.match(normalized, /20 \/ 20 retained/);
  assert.match(normalized, /Gal/);
  assert.match(normalized, /Parm1/);
  assert.match(normalized, /Pax8/);
  assert.match(normalized, /Sheet1!K1, K2:K21/);
  assert.match(normalized, /Ranks 1–20 are the complete source-native ranked marker panel for this workbook column\. Marker rank is not an exact identity rule, expression magnitude, specificity score or p-value/);
  assert.match(normalized, /328/);
  assert.match(normalized, /D-25 · GSM5243310/);
  assert.match(normalized, /67 \/ 1,504/);
  assert.match(normalized, /RAG-expressing neuronal state · independent neuronal cluster 23/);
  assert.match(normalized, /Six retained source discrepancies/);
  assert.match(normalized, /sequencing platform and loading target/);
  assert.match(normalized, /Coordinates, neurite geometry, atlas placement, same-cell tracing and synaptic edges are unavailable and remain empty/);
});

test("server-renders a URL-addressed type dossier and non-pooled comparison", async () => {
  const response = await render("/?lab=types&type=sathyamurthy-2018%3ADE-12&typeCompare=sathyamurthy-2018%3ADE-12%2Cruss-2021%3AExcit-36");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /Spinal neuron type evidence atlas/);
  assert.match(normalized, /387 source profiles: 69 Russ \+ 43 Sathyamurthy \+ 11 Hayashi P0 V2a \+ 30 Häring P17–P28 dorsal-horn \+ 8 Alkaslasi adult cholinergic clusters \+ 6 embryonic Dmrt3\/dI6 groups \+ 157 Roome embryonic refined dIL types \+ 51 Delile E9\.5–E13\.5 fine subtypes \+ 1 Crozat PKD2L1 functional population \+ 11 Cano-Gomez P56 source-explicit CHOL_IN profiles/);
  assert.match(normalized, /42 non-motor profiles are not confirmed interneurons/);
  assert.match(normalized, /19 independent pooled Drop-Seq samples/);
  assert.match(normalized, /24 GEO accessions are not replicates/);
  assert.match(normalized, /4,280/);
  assert.match(normalized, /DE-12/);
  assert.match(normalized, /Grpr · Col5a2 · Atp2b4/);
  assert.match(normalized, /DE12/);
  assert.match(normalized, /74 nuclei/);
  assert.match(normalized, /Compare 2–4 source records/);
  assert.match(normalized, /Excit-36/);
  assert.match(normalized, /Shared rows support inspection only\. Counts, labels and markers remain source-local/);
  assert.match(normalized, /Electrophysiology/);
  assert.match(normalized, /Projection target/);
  assert.match(normalized, /Synaptic connectivity/);
  assert.match(normalized, /Cross-source same-cell link/);
  assert.match(normalized, /exact cross-study identities · linked morphologies · registrations/);
});

test("server-renders an evidence-bounded Hayashi P0 V2a dossier", async () => {
  const response = await render("/?lab=types&focusKind=molecular_profile&focusId=hayashi-2018%3AGSE108788%3Acluster-6");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /data-focus-id="hayashi-2018:GSE108788:cluster-6"/);
  assert.match(normalized, /Cluster 6/);
  assert.match(normalized, /86 cells/);
  assert.match(normalized, /Nefl/);
  assert.match(normalized, /Mostly Cervical/);
  assert.match(normalized, /Mixed Type I And Type Ii/);
  assert.match(normalized, /2 neonates → 1 library → 949 cells/);
  assert.match(normalized, /2,800 cervical \+ 2,800 lumbar cells collected/);
  assert.match(normalized, /Cluster: false · Type I\/II: false · spinal region: false/);
  assert.match(normalized, /942\/949 \(99\.262%\)/);
  assert.match(normalized, /862\/949 \(90\.832%\)/);
  assert.match(normalized, /unresolved rather than harmonized/);
  assert.match(normalized, /Type II is supraspinal projection context and is excluded from confirmed local-interneuron counts/);
});

test("switching Dmrt3 M1 and M4 changes the evidence fingerprint while same-record internal geometry stays empty", async () => {
  const [m1Response, m4Response] = await Promise.all([
    render("/?lab=types&view=internal_reference&panel=structure&focusKind=molecular_profile&focusId=iglesias-gonzalez-2021%3Agse185731%3Ammusculus%3Am1"),
    render("/?lab=types&view=internal_reference&panel=structure&focusKind=molecular_profile&focusId=iglesias-gonzalez-2021%3Agse185731%3Ammusculus%3Am4"),
  ]);
  assert.equal(m1Response.status, 200);
  assert.equal(m4Response.status, 200);
  const m1Html = (await m1Response.text()).replaceAll("<!-- -->", "");
  const m4Html = (await m4Response.text()).replaceAll("<!-- -->", "");
  const m1Fingerprint = m1Html.match(/<section class="research-record-fingerprint"[^>]*data-record-id="iglesias-gonzalez-2021:gse185731:mmusculus:m1"[\s\S]*?<\/section>/)?.[0] ?? "";
  const m4Fingerprint = m4Html.match(/<section class="research-record-fingerprint"[^>]*data-record-id="iglesias-gonzalez-2021:gse185731:mmusculus:m4"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(m1Fingerprint, /<h5[^>]*>M1<\/h5>/);
  assert.match(m1Fingerprint, /84 sampled retained cells<\/strong>/);
  assert.match(m1Fingerprint, /Zfhx3 · Meis2 · Zfhx4/);
  assert.doesNotMatch(m1Fingerprint, /Hoxb8 · Hoxb7 · Hoxb9/);
  assert.match(m4Fingerprint, /<h5[^>]*>M4<\/h5>/);
  assert.match(m4Fingerprint, /45 sampled retained cells<\/strong>/);
  assert.match(m4Fingerprint, /Hoxb8 · Hoxb7 · Hoxb9/);
  assert.doesNotMatch(m4Fingerprint, /Zfhx3 · Meis2 · Zfhx4/);
  assert.notEqual(m1Fingerprint, m4Fingerprint);

  for (const [html, id] of [[m1Html, "m1"], [m4Html, "m4"]]) {
    assert.match(html, new RegExp(`data-focus-kind="molecular_profile" data-focus-id="iglesias-gonzalez-2021:gse185731:mmusculus:${id}"`));
    assert.match(html, /0 same-record internal primitives · 5 vocabulary classes remain UNAVAILABLE/);
    assert.match(html, /Switching records updates the evidence fingerprint, while this same-record internal scene correctly stays empty/);
    assert.doesNotMatch(html, /SCI SYN DATA ANCHORS/);
  }
  for (const fingerprint of [m1Fingerprint, m4Fingerprint]) {
    assert.match(fingerprint, /data-geometry-status="no-admitted-cell-geometry"/);
    assert.match(fingerprint, /data-missing-axis-count="9"/);
    assert.match(fingerprint, /9 unavailable or unlinked evidence axes · consolidated/);
    assert.match(fingerprint, /0 admitted cell-geometry primitives/);
    assert.equal((fingerprint.match(/Shared project limit:/g) ?? []).length, 1);
  }

  assert.match(m1Html, /3 E14\.5 embryos → 1 pool → 1 library/);
  assert.match(m1Html, /384 wells → 354 QC → 274 dI6/);
  assert.match(m1Html, /Per-well M1–M6 assignments and scalar pseudotime are absent from the loom and are not reconstructed/);
});

test("server-renders an evidence-bounded Alkaslasi I8 dossier without prevalence or 3D promotion", async () => {
  const response = await render("/?lab=types&focusKind=molecular_profile&focusId=alkaslasi-2021%3AGSE167597%3AI8");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /data-focus-id="alkaslasi-2021:GSE167597:I8"/);
  assert.match(normalized, /I8/);
  assert.match(normalized, /329 nuclei/);
  assert.match(normalized, /Mpped2 · Piezo2 · Reln · Chat/);
  assert.match(normalized, /Cervical 100 · Thoracic 70 · <code>Lumbar<\/code> 159/);
  assert.match(normalized, /M 81 · F 72 · NA 176/);
  assert.match(normalized, /34,231 QC → 16,042 cholinergic → 5,375 I1–I8/);
  assert.match(normalized, /matching regions first pooled from 2 mice · 4 mice per processing replicate/);
  assert.match(normalized, /cervical-cervical_6/);
  assert.match(normalized, /4 excluded skeletal-label conflicts · preserved, not repaired/);
  assert.match(normalized, /authoritative PMID <code>33931636<\/code>/);
  assert.match(normalized, /GEO currently displays PMID <code>37559423<\/code>/);
  assert.match(normalized, /Internal structure/);
  assert.match(normalized, /not prevalence|prevalence/i);
  assert.match(normalized, /<strong>0<\/strong><span>exact cross-study identities · linked morphologies · registrations<\/span>/);
});

test("server-renders the PKD2L1 functional profile with observed electrophysiology, quarantined conflicts and zero geometry", async () => {
  const response = await render("/?lab=types&focusKind=molecular_profile&focusId=crozat-2025%3Afigshare-29430869-v2%3Apkd2l1-csf-cn");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /data-focus-id="crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn"/);
  assert.match(normalized, /PKD2L1\+ CSF-contacting neurons/);
  assert.match(normalized, /Multiple experiment-specific N\/n/);
  assert.match(normalized, /Cervical 1,193 cells \/ 50 fields · Thoracic 1,167 cells \/ 51 fields · Lumbar 1,594 cells \/ 51 fields/);
  assert.match(normalized, /aggregate source evidence, not cell coordinates/);
  assert.match(normalized, /Population-level source data support central-canal contact, primarily ventral localization and higher lumbar density/);
  assert.match(normalized, /Cervical: N=10 animals, n=21 cells \(14 tonic, 7 single-spike\); thoracic: N=12 animals, n=23 cells \(9 tonic, 14 single-spike\); lumbar: N=9 animals, n=21 cells \(15 tonic, 6 single-spike\)/);
  assert.match(normalized, /Inhibitory \/ GABAergic/);
  assert.doesNotMatch(normalized, /Sampling count<\/dt><dd>Not retained/);
  assert.match(normalized, /The paper reports 659 cells from 191 animals; the deposited passive-property table contains 654 complete rows/);
  assert.match(normalized, /Observed at cohort and experiment family level/);
  assert.match(normalized, /4 quarantined source conflicts/);
  assert.match(normalized, /Firing-Inference-P-Value/);
  assert.match(normalized, /1,848,613 bytes · CC BY 4\.0/);
  assert.match(normalized, /0 admitted cell-geometry primitives/);
  assert.match(normalized, /class="research-record-model-readout loading" role="status" data-focus-kind="molecular_profile" data-focus-id="crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn"/);
  assert.match(normalized, /Prior record content and cell geometry are not retained during the switch/);
  assert.match(normalized, /This is one source-local marker-defined population/);
  assert.doesNotMatch(normalized, /representative PKD2L1 cell/);
});

test("server-renders visibly distinct I1 and I2 evidence fingerprints with zero surrogate geometry", async () => {
  const [i1Response, i2Response] = await Promise.all([
    render("/?lab=types&focusKind=molecular_profile&focusId=alkaslasi-2021%3AGSE167597%3AI1"),
    render("/?lab=types&focusKind=molecular_profile&focusId=alkaslasi-2021%3AGSE167597%3AI2"),
  ]);
  assert.equal(i1Response.status, 200);
  assert.equal(i2Response.status, 200);
  const i1Html = (await i1Response.text()).replaceAll("<!-- -->", "");
  const i2Html = (await i2Response.text()).replaceAll("<!-- -->", "");
  const i1Fingerprint = i1Html.match(/<section class="research-record-fingerprint"[\s\S]*?<\/section>/)?.[0] ?? "";
  const i2Fingerprint = i2Html.match(/<section class="research-record-fingerprint"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(i1Fingerprint, /data-record-id="alkaslasi-2021:GSE167597:I1"/);
  assert.match(i1Fingerprint, /1,520 sampled nuclei<\/strong>/);
  assert.match(i1Fingerprint, /Pax2 · Mpped2 · Slc6a1 · Piezo2/);
  assert.match(i1Fingerprint, /Cervical 361 · Thoracic 404 · Lumbar 755 sampled nuclei/);
  assert.match(i2Fingerprint, /data-record-id="alkaslasi-2021:GSE167597:I2"/);
  assert.match(i2Fingerprint, /780 sampled nuclei<\/strong>/);
  assert.doesNotMatch(i1Fingerprint + i2Fingerprint, /nucleis/);
  assert.match(i2Fingerprint, /Pax2 · Mpped2 · Slc6a1/);
  assert.match(i2Fingerprint, /Cervical 220 · Thoracic 208 · Lumbar 352 sampled nuclei/);
  assert.doesNotMatch(i2Fingerprint, /Piezo2/);
  assert.doesNotMatch(i2Fingerprint, /Pax2 · Mpped2 · Slc6a1 · Piezo2/);
  assert.notEqual(i1Fingerprint, i2Fingerprint);
  for (const fingerprint of [i1Fingerprint, i2Fingerprint]) {
    assert.match(fingerprint, /0 admitted cell-geometry primitives/);
    assert.match(fingerprint, /Identity and geometry limits · collapsed/);
    assert.equal((fingerprint.match(/Shared project limit:/g) ?? []).length, 1);
    assert.doesNotMatch(fingerprint, /\b(?:not_established|cellCoordinates|atlasRegistration|source_local|TYPE_LEVEL)\b/);
  }

  const populationButtons = i1Html.match(/<button[^>]*class="population-card[^"]*"[^>]*>/g) ?? [];
  assert.equal(populationButtons.length, 7);
  assert.equal(populationButtons.filter((button) => /aria-pressed="true"/.test(button)).length, 0);
  assert.equal(populationButtons.filter((button) => /tabindex="0"/.test(button)).length, 1);
});

test("Research Explorer reuses authoritative molecular life-stage facts and preserves record-specific gap counts", async () => {
  const [source, sathyamurthySource, alkaslasiSource, researchIndexSource] = await Promise.all([
    readFile(new URL("../app/ResearchExplorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/sathyamurthy-source-taxonomy-0.1.json", import.meta.url), "utf8"),
    readFile(new URL("../data/alkaslasi-cholinergic-source-taxonomy-0.1.json", import.meta.url), "utf8"),
    readFile(new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url), "utf8"),
  ]);
  const sathyamurthyTaxonomy = JSON.parse(sathyamurthySource);
  const alkaslasiTaxonomy = JSON.parse(alkaslasiSource);
  const researchIndex = JSON.parse(researchIndexSource);
  const sathyamurthyRecord = researchIndex.records.find((record) => record.focusId === "sathyamurthy-2018:DE-12");
  const alkaslasiRecord = researchIndex.records.find((record) => record.focusId === "alkaslasi-2021:GSE167597:I1");
  assert.match(source, /function MolecularRecordFingerprint/);
  assert.match(source, /resolveMolecularRecordLifeStage\(record, \{/);
  assert.equal(sathyamurthyTaxonomy.scope.lifeStage, "adult");
  assert.equal(alkaslasiTaxonomy.profiles.find((profile) => profile.id.endsWith(":I1")).lifeStage, "adult; source mice aged 8 weeks");
  assert.equal(resolveMolecularRecordLifeStage(sathyamurthyRecord, {
    sathyamurthyTaxonomy,
    alkaslasiTaxonomy,
  }), "adult");
  assert.equal(resolveMolecularRecordLifeStage(alkaslasiRecord, {
    sathyamurthyTaxonomy,
    alkaslasiTaxonomy,
  }), "adult; source mice aged 8 weeks");
  assert.equal(resolveMolecularRecordLifeStage({
    namespace: "unknown-source",
    focusId: "unknown-record",
    subtitle: "Unspecified population",
    evidence: [],
  }, {
    sathyamurthyTaxonomy,
    alkaslasiTaxonomy,
  }), "Life stage not retained in this exact record");
  assert.match(source, /record\.focusKind === "molecular_profile"[\s\S]*?<MolecularRecordFingerprint record=\{record\}/);
  assert.match(source, /recordBoundary=\{humanizeEvidenceToken\(record\.boundary\)\}/);
  assert.match(source, /<strong>\{recordSpecific\.length\} record-specific<\/strong>/);
  assert.match(source, /\{view === "gaps" && <span>\{record\.gaps\.length\}<\/span>\}/);
});

test("server-renders a fine-grained Häring P17–P28 dorsal-horn dossier without inventing geometry", async () => {
  const response = await render("/?lab=types&focusKind=molecular_profile&focusId=haring-2018%3AGSE103840%3AGlut7");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /data-focus-id="haring-2018:GSE103840:Glut7"/);
  assert.match(normalized, /Glut7/);
  assert.match(normalized, /104 cells/);
  assert.match(normalized, /Glut_Tac2_1/);
  assert.match(normalized, /Tac2 \(low\) · Nmu/);
  assert.match(normalized, /\+Nmu,\+Sst,\+Tac2 → Glut6-7-Tac2-1-2/);
  assert.match(normalized, /28 source animals → 1,545 sampled cells/);
  assert.match(normalized, /1,639 post-QC → −94 exclude → 1,545 final/);
  assert.match(normalized, /43 initial BackSPIN clusters → 30 final types · 767 Glut-group \+ 778 Gaba-group cells/);
  assert.match(normalized, /101 · code 1: 3/);
  assert.match(normalized, /C57bl6 21 · vGat 0 · vGlut2 83/);
  assert.match(normalized, /2 animals · 6 cervical sections/);
  assert.match(normalized, /Glut7 = 104 ↔ Supplementary Figure 2 legend: Glut7 = 105/);
  assert.match(normalized, /Do not harmonize the conflicting platform metadata/);
  assert.match(normalized, /not an xyz coordinate, a same-cell localization, or a transform into the project atlas/);
  assert.match(normalized, /source file bundled: false/i);
});

test("retains the deposited Häring Gaba1 raw-label anomaly without reinterpretation", async () => {
  const response = await render("/?lab=types&type=haring-2018%3AGSE103840%3AGaba1");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /Gaba1/);
  assert.match(normalized, /Glut_Gal/);
  assert.match(normalized, /deposited raw cluster string is Glut_Gal while the deposited standard_names value is Gaba1/);
  assert.match(normalized, /\+Slc17a6,\+Gad1,\+Gal → GABA1-Glut-Gal/);
  assert.match(normalized, /local-interneuron versus projection-neuron status is not resolved per profile/);
});

test("server-renders the anatomy lane with a fail-closed native-volume control", async () => {
  const response = await render("/?lab=atlas");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /Atlas · 38 planes \/ 73 direct labels/);
  assert.match(normalized, /Full-volume surface target · one exact source label at a time/);
  assert.match(normalized, /Study regions · 37/);
  assert.match(normalized, /Structural landmarks · 3/);
  assert.match(normalized, /Motor-neuron context · 33/);
  assert.match(normalized, /Show selected full-volume voxel surface · off by default/);
  assert.match(normalized, /runtime manifest SHA-256 verification is required/);
  assert.match(normalized, /base atlas remains available; no replacement surface geometry is generated/i);
  assert.match(normalized, /Loading the 73-leaf sampled-plane anatomy contract/);
});

test("server rendering retains a versioned SCI identity but withholds its card until verification", async () => {
  const response = await render("/?cell=mouse.v3.sim1&view=transverse&slice=-17&endpoint=spasm");
  assert.equal(response.status, 200);
  const html = await response.text();
  const normalized = html.replaceAll("<!-- -->", "");
  assert.match(normalized, /Verifying exact SCI evidence entity/);
  assert.match(normalized, /data-focus-kind="sci_entity"/);
  assert.match(normalized, /data-focus-id="mouse\.v3\.sim1"/);
  assert.doesNotMatch(normalized, /V3 activity was required for sensory-driven spasms/);
});

test("retains the selected SCI focus when filters hide every result", async () => {
  const response = await render("/?q=no-such-interneuron&endpoint=spasm");
  assert.equal(response.status, 200);
  const html = await response.text();
  const normalized = html.replaceAll("<!-- -->", "");
  assert.match(normalized, /EXPLORE · 0\/7/);
  assert.match(normalized, /No matching evidence entity/);
  assert.match(normalized, /Focus retained outside the filtered list: SC Vsx2\/Hoxa10/);
  assert.match(normalized, /Filters never substitute another SCI evidence entity/);
  assert.match(normalized, /Verifying exact SCI evidence entity/);
  assert.match(normalized, /No previous entity or generic evidence card is shown/);
  assert.doesNotMatch(normalized, /STRUCTURED EVIDENCE · P09/);
  assert.doesNotMatch(normalized, /No evidence entity selected/);
});

test("restores versioned layer, observed cell form and panel state from the URL", async () => {
  const response = await render("/?v=1&focusKind=morphology_record&focusId=NeuroMorpho:260150&cell=mouse.v3.sim1&view=transverse&slice=-17&endpoint=spasm&scaffold=0&gray=0&entities=0&observedForm=0&cellForm=260150&panel=benchmarks");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Reference architecture/);
  assert.match(html, /value="-17"/);
  const primaryLayerControls = html.match(/<div class="layer-controls">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const checkboxes = primaryLayerControls.match(/<input[^>]*type="checkbox"[^>]*>/g) ?? [];
  assert.equal(checkboxes.length, 6);
  assert.ok(checkboxes.slice(0, 4).every((tag) => !/checked/i.test(tag)), "all four URL-restored primary layers should be hidden");
  assert.ok(checkboxes.slice(4).every((tag) => /checked/i.test(tag)), "the two independent MICrONS component defaults should remain visible");
  assert.match(primaryLayerControls, /<option[^>]*value="260150"[^>]*selected/);
});

test("server rendering withholds radius-derived morphology until the active record verifies", async () => {
  const response = await render("/?cellForm=109005&cellFidelity=surface");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /0 admitted main-scene geometry/);
  assert.doesNotMatch(normalized, /OBS SWC INPUT \+ DERIVED SURFACE/);
  assert.doesNotMatch(normalized, /0\.075–5\.209 µm source radius/);
});

test("server rendering also withholds a no-diameter morphology before verification", async () => {
  const response = await render("/?cellForm=260150&cellFidelity=surface");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /0 admitted main-scene geometry/);
  assert.doesNotMatch(normalized, /Source reports No Diameter/);
  assert.doesNotMatch(normalized, /Official No Diameter record\. Placeholder SWC radii are ignored; zero surface primitives/);
});

test("server-renders the 142-object matrix and bounded 3D comparison research views", async () => {
  const [matrixResponse, comparisonResponse, viewer, matrix, comparison, microdetail, superClem, superClemContract, prototype] = await Promise.all([
    render("/?lab=morphology&morphologyView=matrix"),
    render("/?lab=morphology&morphologyView=compare&morphologyCompare=109005,260150,104003,108974"),
    readFile(new URL("../app/MorphologyViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MorphologyMatrixPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MorphologyComparePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MorphologyMicrodetailCoverage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SuperClemSynapseReference.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/super-clem-synapse-reference-0.1.json", import.meta.url), "utf8"),
    readFile(new URL("../app/AtlasPrototype.tsx", import.meta.url), "utf8"),
  ]);
  assert.equal(matrixResponse.status, 200);
  assert.equal(comparisonResponse.status, 200);
  const matrixHtml = (await matrixResponse.text()).replaceAll("<!-- -->", "");
  const comparisonHtml = (await comparisonResponse.text()).replaceAll("<!-- -->", "");
  assert.match(matrixHtml, /Source-local morphology matrix/);
  assert.match(matrixHtml, /exact SWC segment coordinates and is independently fitted/);
  assert.match(matrixHtml, /FIT PER RECORD/);
  assert.match(comparisonHtml, /Source-object 3D comparator/);
  assert.match(comparisonHtml, /149<\/b><span>declared release objects/);
  assert.match(comparisonHtml, /142<\/b><span>declared frozen census/);
  assert.match(comparisonHtml, /7<\/b><span>declared supplementary routes/);
  assert.match(comparisonHtml, /never a 149-record census/);
  assert.match(comparisonHtml, /0 REGISTRATIONS · 0 SAME-CELL LINKS · 0 COMPLETE AXONS · 0 SAME-SPECIMEN INTERNAL MODELS/);
  // The serial browser is an interactive client island; verify its controls and evidence text in its source contract.
  assert.match(superClem, /Synapse-scale reference — parent cell unresolved/);
  assert.match(superClem, /This serial image series cannot fill the inside of the selected morphology/);
  assert.match(superClem, /aria-label="Select serial electron-microscopy section"/);
  assert.match(superClem, /setSectionIndex/);
  assert.match(superClemContract, /3583cf15007c2c5e62196f2a2fcb8e7393433b6d094688cbc17112ae870e2c1c/);
  assert.match(viewer, /Morphology matrix · 142 exact SWCs/);
  assert.match(viewer, /3D comparator · \{comparisonIds\.length\} selected \/ \{comparisonRecords\.length\} indexed/);
  assert.match(matrix, /PAGE_SIZE = 12/);
  assert.match(matrix, /OBSERVED CENTERLINES ONLY/);
  assert.match(matrix, /No matrix card is linked to a Russ, Sathyamurthy, Hayashi, Häring, Matson, SCI, or atlas entity/);
  assert.match(comparison, /Official source attributes report No Diameter/);
  assert.match(comparison, /buildMorphologyComparisonReceipt/);
  assert.match(comparison, /Internal detail unavailable/);
  assert.match(comparison, /MorphologyMicrodetailCoverage/);
  assert.match(microdetail, /Per-record micro-detail evidence matrix/);
  assert.match(microdetail, /UNAVAILABLE = zero primitives/);
  assert.match(microdetail, /generic nucleus, membrane, organelle, bouton, receptor map, partner, or atlas position/);
  assert.match(microdetail, /Unavailable means no same-specimen source object is admitted; it does not mean the structure is biologically absent/);
  assert.match(microdetail, /sourceRecordLocators\.dois/);
  assert.match(comparison, /SuperClemSynapseReference/);
  assert.match(superClem, /super-clem-synapse-reference-0\.1\.json/);
  assert.match(superClem, /DERIVED PNG · SOURCE PIXELS/);
  assert.match(superClem, /PNG format conversion/);
  assert.match(superClem, /0 CELL · 0 TYPE · 0 ATLAS JOINS/);
  assert.match(superClem, /CC BY 4\.0/);
  assert.match(superClemContract, /super-clem-d2-gb-e9-synapse-1-top-plus-140\.png/);
  assert.match(superClemContract, /384e5d12c9d024feed140b0ab46bb688/);
  assert.match(prototype, /"morphologyCompare"/);
  assert.match(prototype, /"morphologyModes"/);
});

test("restores a public-data catalog view from the versioned URL", async () => {
  const response = await render("/?panel=sources&catalog=metadata_audited&source=PDS-TABULAE-PARALYTICA&catalog_q=injury");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Tabulae Paralytica spinal-cord injury atlas/);
  assert.match(html, /AGGREGATED_OR_SPOT_LEVEL/);
  assert.match(html, /A Visium spot is not one interneuron/);
  assert.match(html, /UPG-004/);
  assert.match(html, /Injury-state condition adapter/);
  assert.match(html, /In Progress/);
});

test("renders a URL-restored feasibility plan without creating a cross-source join", async () => {
  const response = await render("/?panel=sources&plan=molecular_taxonomy,adult_lumbar_marker_context");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /Russ 2021 taxonomy and adult-lumbar context/);
  assert.match(normalized, /A single declared source-specific route supports every selected axis/);
  assert.match(normalized, /no exact identity, coordinate, morphology, or same-cell claim/i);
});

test("renders the pinned SpinalJ metadata intake without suggesting acquisition", async () => {
  const response = await render("/?panel=sources&catalog=metadata_audited&source=PDS-SPINALJ-PROCESSED");
  assert.equal(response.status, 200);
  const html = await response.text();
  const normalized = html.replaceAll("<!-- -->", "");
  assert.match(normalized, /PINNED PUBLIC METADATA INTAKE/);
  assert.match(normalized, /PSI-SPINALJ-PROCESSED-2026-08-18/);
  assert.match(normalized, /Metadata audited; files not admitted/);
  assert.match(normalized, /not downloaded/);
  assert.match(normalized, /not file verified/);
  assert.match(normalized, /not proposed · 0/);
  assert.match(normalized, /SpinalJ v1\.13/);
});

test("renders Cano-Gomez as a preprint author-space intake rather than a registration", async () => {
  const response = await render("/?panel=sources&catalog=metadata_audited&source=PDS-CANOGOMEZ-2026");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /PSI-CANOGOMEZ-2026-08-18/);
  assert.match(normalized, /Preprint Resource/);
  assert.match(normalized, /AUTHOR_SPACE_OBS/);
  assert.match(normalized, /method reported transform artifact and error not file verified/);
  assert.match(normalized, /GSE318731/);
  assert.match(normalized, /No source entity, SWC or synthetic evidence entity is registered by this record/);
});

test("renders the Russ 69-population taxonomy explorer without creating an entity or spatial mapping", async () => {
  const response = await render("/?panel=sources&catalog=all&source=PDS-RUSS-2021");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /PINNED TYPE-LEVEL CROSSWALK · RUSS 2021/);
  assert.match(normalized, /Harmonized molecular taxonomy/);
  assert.match(normalized, /69 published neural populations · 65 project-designated candidate populations after excluding the source motor\/preganglionic and CSF-contacting groups · interneurons and projection neurons are not fully separated · no exact prototype mapping/);
  assert.match(normalized, /Excit-36/);
  assert.match(normalized, /Vsx2 · Sox14 · Shox2/);
  assert.match(normalized, /TYPE_LEVEL only/);
  assert.match(normalized, /all seven records remain non-exact/);
  assert.match(normalized, /PINNED PROVENANCE RECONCILIATION · 2 OFFICIAL CORRECTIONS/);
  assert.match(normalized, /10\.1038\/s41467-022-28698-7/);
  assert.match(normalized, /10\.1038\/s41467-022-33998-z/);
  assert.match(normalized, /No Table 1 content or label change is stated/);
  assert.match(normalized, /PROVENANCE RECONCILIATION ONLY/);
  assert.doesNotMatch(normalized, /exact Russ mapping/);
});

test("renders STARmap PLUS only as a source-local metadata-audit lead", async () => {
  const response = await render("/?panel=sources&catalog=ready_for_metadata_audit&source=PDS-STARMAP-PLUS-2023");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /STARmap PLUS adult mouse CNS atlas/);
  assert.match(normalized, /SOURCE_LOCAL_OBS/);
  assert.match(normalized, /one coronal lumbar spinal-cord slice among 20 CNS slices from three mice/i);
  assert.match(normalized, /UPG-010/);
  assert.match(normalized, /A future admitted display remains source-local OBS/);
  assert.match(normalized, /not a whole-spinal-cord atlas or interneuron census/i);
});

test("renders the Tabulae object header as metadata only, not an admitted source asset", async () => {
  const response = await render("/?panel=sources&catalog=metadata_audited&source=PDS-TABULAE-PARALYTICA");
  assert.equal(response.status, 200);
  const normalized = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(normalized, /PSI-TABULAE-PARALYTICA-2026-08-18/);
  assert.match(normalized, /PINNED OBJECT HEADER · NOT ADMITTED/);
  assert.match(normalized, /GSE234774_rnaseq_meta\.txt\.gz/);
  assert.match(normalized, /10,427,632 · application\/x-gzip/);
  assert.match(normalized, /not published in this audit/);
  assert.match(normalized, /null · no body acquired/);
  assert.match(normalized, /unresolved not admitted/);
  assert.match(normalized, /UPG-008/);
  assert.match(normalized, /METADATA-ONLY CONDITION INDEX · 2 GEO SERIES/);
  assert.match(normalized, /Tabulae Paralytica condition browser/);
  assert.match(normalized, /SOURCE METADATA CONDITION INDEX ONLY/);
  assert.match(normalized, /8 metadata-only groups/);
  assert.match(normalized, /0 bundled · local hash null/);
  assert.match(normalized, /Uninjured source-label group/);
  assert.match(normalized, /spatial sections; not a cell-level record/);
  assert.match(normalized, /UPG-011/);
  assert.match(normalized, /LOCAL MULTI-SECTION SESSION · GSE234774/);
  assert.match(normalized, /Tabulae source-local comparison board/);
  assert.match(normalized, /UP TO 4/);
  assert.match(normalized, /Add local triplet/);
  assert.match(normalized, /not established · no alignment/i);
  assert.match(normalized, /A session is not section-to-section alignment/);
});

test("keeps object-level file-manifest imports local, metadata-only and schema-gated", async () => {
  const [workbench, sourceAdmissionReview] = await Promise.all([
    readFile(new URL("../app/PublicDataWorkbench.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/PublicSourceReleaseAdmissionReview.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(workbench, /function parsePublicFileAdmissionManifest\(value: unknown\)/);
  assert.match(workbench, /formatVersion !== "0\.7\.0"/);
  assert.match(workbench, /function parseCanoSpecimenManifest/);
  assert.match(workbench, /SPECIMEN-AWARE PREFLIGHT/);
  assert.match(workbench, /preprintStatus/);
  assert.match(workbench, /metadata_only_not_downloaded_not_registered/);
  assert.match(workbench, /sourceChecksum/);
  assert.match(workbench, /localSha256 !== null/);
  assert.match(workbench, /incomplete file coordinates require a missingReason/);
  assert.match(workbench, /maximum size is 2 MB/);
  assert.match(workbench, /no file acquired or registered/);
  assert.match(workbench, /supportsFileManifestPreflight/);
  assert.match(workbench, /PublicFileAdmissionManifestComposer/);
  assert.match(workbench, /TaxonomyCrosswalkExplorer/);
  assert.match(workbench, /TabulaeConditionExplorer/);
  assert.match(workbench, /TabulaeSpatialComparisonBoard/);
  assert.match(workbench, /EvidenceFeasibilityPlanner/);
  assert.match(workbench, /EvidenceProvenanceTrace/);
  assert.match(workbench, /CrossLaneRelationshipAdmission/);
  assert.match(workbench, /PublicSourceReleaseAdmissionReview/);
  assert.match(sourceAdmissionReview, /Not-admitted source review exported/);
  assert.match(sourceAdmissionReview, /Metadata complete is not data admission/);
  assert.doesNotMatch(workbench, /fetch\(.*sourceUrl/s);
});

test("hydrates static curator URLs before enabling canonical URL synchronization", async () => {
  const prototype = await readFile(new URL("../app/AtlasPrototype.tsx", import.meta.url), "utf8");
  assert.match(prototype, /parseInitialState\(Object\.fromEntries\(new URLSearchParams\(search\)\)\)/);
  assert.match(prototype, /const \[locationHydrated, setLocationHydrated\] = useState\(false\)/);
  assert.match(prototype, /const locationState = parseLocationState\(window\.location\.search\)/);
  for (const setter of [
    "setSearch(locationState.search)",
    "setFilters(locationState.filters)",
    "setView(locationState.view)",
    "setSliceZ(locationState.sliceZ)",
    "setShowScaffold(locationState.layers.scaffold)",
    "setShowGrayMatter(locationState.layers.gray)",
    "setShowEntities(locationState.layers.entities)",
    "setShowObservedCellForm(locationState.layers.observedForm)",
    "setShowMicronsCellSurface(locationState.layers.micronsCellSurface)",
    "setShowMicronsNucleus(locationState.layers.micronsNucleus)",
    "setObservedCellFormId(locationState.observedCellFormId)",
    "setSidePanel(locationState.panel)",
    "setComparisonIds(locationState.comparisonIds)",
    "setCatalogState(locationState.catalog)",
  ]) assert.ok(prototype.includes(setter), `missing static URL hydration step: ${setter}`);
  assert.match(prototype, /setSelectedId\(canonicalSciSelectedId\([\s\S]*?locationState\.selectedId,[\s\S]*?locationState\.research\.selectedResearchObject/);
  const hydrationIndex = prototype.indexOf("const locationState = parseLocationState(window.location.search)");
  const synchronizationGuardIndex = prototype.indexOf("if (!locationHydrated) return;");
  const replaceStateIndex = prototype.indexOf("window.history.replaceState");
  assert.ok(hydrationIndex >= 0 && hydrationIndex < synchronizationGuardIndex);
  assert.ok(synchronizationGuardIndex < replaceStateIndex);
});

test("includes Research MVP export, keyboard, fallback and performance contracts", async () => {
  const [prototype, scene, styles] = await Promise.all([
    readFile(new URL("../app/AtlasPrototype.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SceneCanvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(prototype, /schemaVersion:\s*researchMvpRelease\.schemaVersion/);
  assert.match(prototype, /text\/csv;charset=utf-8/);
  assert.match(prototype, /join\("\\r\\n"\)/);
  assert.match(prototype, /Export PNG/);
  assert.match(prototype, /ArrowDown/);
  assert.match(prototype, /ArrowUp/);
  assert.match(prototype, /aria-controls=\{`\$\{panel\}-panel`\}/);
  assert.match(scene, /webglcontextlost/);
  assert.match(scene, /frameP95Ms/);
  assert.match(scene, /VERIFIED OBS INPUT \+ VISIBLE DERIVED RADIUS SURFACE/);
  assert.match(scene, /VERIFIED VISIBLE OBS SWC CENTERLINES/);
  assert.match(scene, /NO VERIFIED MORPHOLOGY RENDERED/);
  assert.match(scene, /MorphologyRuntimeReceipt/);
  assert.match(prototype, /runtimeReceipt: guardedMorphologyRuntime/);
  assert.match(prototype, /morphologyRuntimeVerificationStatus/);
  assert.match(scene, /morphologyFidelityContract\.sourceObjects\.censusIndex\.sha256/);
  assert.match(scene, /sha256Hex/);
  assert.match(scene, /non-cell-population-evidence-node/);
  assert.match(scene, /createSourceLocalMorphologyObject/);
  assert.doesNotMatch(scene, /SphereGeometry|createDendrites|mulberry32/);
  assert.match(styles, /\.slice-dot\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
});

test("implements a version-locked JSON import and persistent-state round trip", async () => {
  const prototype = await readFile(new URL("../app/AtlasPrototype.tsx", import.meta.url), "utf8");
  assert.match(prototype, /function validateImportedState\(payload: unknown\): PersistentAtlasState/);
  assert.match(prototype, /payload\.releaseId !== researchMvpRelease\.releaseId/);
  assert.match(prototype, /payload\.schemaVersion !== researchMvpRelease\.schemaVersion/);
  assert.match(prototype, /payload\.releaseManifest\.manifestContentSha256 !== researchMvpManifest\.manifestContentSha256/);
  assert.match(prototype, /payload\.publicDataCatalog\.releaseId !== publicDataCatalog\.releaseId/);
  assert.match(prototype, /payload\.publicDataCatalog\.schemaVersion !== publicDataCatalog\.schemaVersion/);
  assert.match(prototype, /payload\.publicDataCatalog\.intakeRegistryReleaseId !== publicSourceIntakeRegistry\.releaseId/);
  assert.match(prototype, /payload\.publicDataCatalog\.evidenceFeasibilityPlannerReleaseId !== evidenceFeasibilityPlanner\.releaseId/);
  assert.match(prototype, /payload\.publicDataCatalog\.evidenceProvenanceTraceReleaseId !== evidenceProvenanceTrace\.releaseId/);
  assert.match(prototype, /payload\.publicDataCatalog\.crossLaneRelationshipAdmissionReleaseId !== crossLaneRelationshipAdmission\.releaseId/);
  assert.match(prototype, /payload\.publicDataCatalog\.publicSourceReleaseAdmissionServiceReleaseId !== publicSourceReleaseAdmissionService\.releaseId/);
  assert.match(prototype, /payload\.publicDataCatalog\.publicSourceAssertionProvenanceReleaseId !== publicSourceAssertionProvenance\.releaseId/);
  assert.match(prototype, /validateMicronsImportProvenance\(payload, state, micronsObservedCellNucleusReference, micronsSourceNativeClipping\)/);
  assert.match(prototype, /plannerAxisIds/);
  assert.match(prototype, /requireOnlyKeys\([\s\S]*?"selectedId"[\s\S]*?"comparisonIds"[\s\S]*?"state"/);
  assert.match(prototype, /"catalog"/);
  assert.match(prototype, /const persistentState: PersistentAtlasState = \{[\s\S]*?selectedId: retainedSelectedId,[\s\S]*?comparisonIds: \[\.\.\.comparisonIds\],[\s\S]*?\};/);
  assert.match(prototype, /state: \{\s*\.\.\.persistentState,\s*url: window\.location\.href,\s*\}/s);
  assert.match(prototype, /releaseManifest: researchMvpManifest/);
  assert.match(prototype, /micronsObservedReference:\s*\{[\s\S]*?contract: micronsObservedCellNucleusReference,[\s\S]*?runtimeReceipt: micronsRuntime,/);
  assert.match(prototype, /regeneratedNonAuthoritativePaths:[\s\S]*?state\.url[\s\S]*?micronsObservedReference\.runtimeReceipt/);
  assert.match(prototype, /setSelectedId\(canonicalSciSelectedId\([\s\S]*?imported\.selectedId,[\s\S]*?imported\.research\.selectedResearchObject/);
  assert.match(prototype, /setSearch\(imported\.search\)/);
  assert.match(prototype, /setFilters\(imported\.filters\)/);
  assert.match(prototype, /const resolvedImportedTarget = resolveResearchVisualTarget\([\s\S]*?currentView: imported\.cameraPreset/);
  assert.match(prototype, /applyResolvedVisualTarget\(importedTarget\)/);
  assert.match(prototype, /setSliceZ\(imported\.sliceZ\)/);
  assert.match(prototype, /setShowScaffold\(imported\.layers\.scaffold\)/);
  assert.match(prototype, /setShowGrayMatter\(imported\.layers\.gray\)/);
  assert.match(prototype, /setShowEntities\(imported\.layers\.entities\)/);
  assert.doesNotMatch(prototype, /setShowObservedCellForm\(imported\.layers\.observedForm\)/);
  assert.match(prototype, /setShowMicronsCellSurface\(imported\.layers\.micronsCellSurface\)/);
  assert.match(prototype, /setShowMicronsNucleus\(imported\.layers\.micronsNucleus\)/);
  assert.match(prototype, /setObservedCellFormId\(imported\.observedCellFormId\)/);
  assert.doesNotMatch(prototype, /setMorphologyFidelityMode\(imported\.morphologyFidelityMode\)/);
  assert.match(prototype, /setSidePanel\(imported\.panel\)/);
  assert.match(prototype, /setComparisonIds\(imported\.comparisonIds\)/);
  assert.match(prototype, /setCatalogState\(imported\.catalog\)/);
  assert.match(prototype, /Import rejected · \$\{reason\}/);
});

test("removes all disposable starter preview code and metadata", async () => {
  const previewFiles = await readdir(new URL("../app/_sites-preview/", import.meta.url)).catch(() => []);
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.deepEqual(previewFiles, []);
  assert.match(page, /AtlasPrototype/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.match(layout, /Mouse Spinal Interneuron Atlas/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.match(packageJson, /"three"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
