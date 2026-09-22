"use client";

import ResearchExplorer, {
  type ResearchFocus,
  type ResearchFocusView,
  type ResearchRecord,
} from "./ResearchExplorer";
import { researchSourceRegistrySummary } from "./atlas-types";
import { formatResearchSourceRegistrySummary } from "./research-source-registry-summary.js";

type ResearchLabTab =
  | "sources"
  | "types"
  | "sci"
  | "atlas"
  | "positions"
  | "morphology"
  | "coverage";

const LANES: Array<{
  id: ResearchLabTab;
  eyebrow: string;
  title: string;
  metric: string;
  available: string;
  boundary: string;
}> = [
  {
    id: "sources",
    eyebrow: "CANONICAL PROVENANCE · UPG-108 / UPG-110",
    title: "Research source registry",
    metric: formatResearchSourceRegistrySummary(researchSourceRegistrySummary),
    available: "Canonical citations, aliases, species, exact or source-declared life stages, regions, modalities, experimental units, record sets, assets, rights, admission and linked research milestones.",
    boundary: "A source package is not a biological record. Registry resolution does not merge clusters, cells, nuclei, morphologies, atlas labels or evidence entities, and it authorizes no geometry or registration.",
  },
  {
    id: "types",
    eyebrow: "SOURCE-LOCAL TAXONOMIES",
    title: "Spinal neuron type evidence",
    metric: "387 source profiles · 10 studies",
    available: "Searchable molecular and functional profiles, source labels, exact counts, marker panels where reported, region and transmitter context where established, 11 source-explicit Cano-Gomez P56 CHOL_IN profiles, 157 Roome embryonic refined dIL aggregates, 51 Delile E9.5–E13.5 fine-subtype aggregates with exact five-stage distributions, eight adult cholinergic I1–I8 clusters, 17–28-day (P17–P28) dorsal-horn Glut/Gaba clusters, the P0 V2a Type I/II framework, one PKD2L1 CSF-contacting-neuron functional population, and 2–4 profile comparison.",
    boundary: "Not 387 unique or cross-study-harmonized types: the 11 Cano-Gomez rows are admitted only from exact groups=CHOL_IN source assignments and do not turn the paper's reported 516 neuronal types into an interneuron denominator; Delile's 51 records cover 15,217 fine-subtype cells and retain the source's `dl` spelling, but the pinned annotation object does not establish canonical transmitter, adult identity, cell geometry or biological-animal count; Roome's 157 records are captured-cell aggregates within a 61,444-cell embryonic dIL denominator, and their displayed genes are differential features rather than canonical or universal markers; Dmrt3 M1–M6 are embryonic study-local groups from one pooled library and PKD2L1 firing-pattern/segment rows remain nested evidence. Exact cross-study identity and type-specific geometry remain 0.",
  },
  {
    id: "sci",
    eyebrow: "SOURCE-LOCAL SCI CONDITIONS · OBSERVED COUNTS",
    title: "Neuronal SCI time course",
    metric: "17 populations · 5 conditions · 15 cords",
    available: "Exact per-population, per-condition and per-sample captured nucleus counts with GSM, BioSample and SRA provenance.",
    boundary: "The 16 non-motor labels are not 16 confirmed local interneuron types; counts are not prevalence, and no coordinate, morphology, same-cell trajectory or synaptic edge is available.",
  },
  {
    id: "atlas",
    eyebrow: "REFERENCE ANATOMY · INF",
    title: "Fine internal anatomy",
    metric: "38 planes · 73 direct labels",
    available: "Exact source-ID masks, native overlays, explicit plane-local missingness and all 32 annotation-state runs.",
    boundary: "Runs are not spinal segments; fine labels are not joined across planes and measurement is disabled.",
  },
  {
    id: "positions",
    eyebrow: "UPG-114 · PHASE A · EXACT SOURCE COORDINATES",
    title: "Exact lumbar premotor positions",
    metric: "14,484 raw / 17,394 normalized rows",
    available: "Checksum-verified numeric XYZ coordinate rows, lumbar source segment, LG or TA tracing group, exact workbook row and independent raw or source-normalized representations.",
    boundary: "Early-postnatal source-local point positions only: no soma radius, morphology, atlas registration or adult inference. Raw and normalized rows are not linked as the same cells.",
  },
  {
    id: "morphology",
    eyebrow: "SOURCE-LOCAL RECONSTRUCTIONS · OBS",
    title: "Exact morphology universe + frozen analyses",
    metric: "1,097 exact SWCs · frozen adult subset 142",
    available: "A checksum-gated browser over all 1,097 no-age-query source objects, plus the frozen 142-object adult census matrix, membership-aware comparison over 142 census plus seven supplementary exact routes, per-record micro-detail analysis, and ten named spinal routes across thirteen exact main-scene morphologies.",
    boundary: "The full query is a repository-record universe, not 1,097 biological types, animals or complete cells. The frozen adult subset and seven supplementary-route layer remain separate denominators. Seven exact records now expose 72 checksum-gated source-native soma-contour LineLoops / 5,149 vertices. The 0.4 delta adds NMO_108978 (12 loops / 2,614 vertices) and NMO_249676 (12 / 156) in their independent source-native frames. NMO_45718 retains 8 legacy-contract traces / 275 vertices; NMO_45674 retains 7 explicitly source-closed traces / 200 vertices. The Todd subset adds exactly NMO_50424 = 8 / 427, NMO_50394 = 14 / 768 and NMO_50408 = 11 / 709: raw sourceClosedFlag=false is preserved, and interpreted closure requires the exact Cell Body name, empty-value CellBody presence property, pinned-parser somaContour classification and documented MBF cell-body semantics. User Line 1–4 remain excluded. No fill, triangle, loft, surface, membrane, volume, biological measurement, DAT-to-SWC overlay, join or registration is asserted. Most records still lack a same-specimen native soma contour, and all records lack an admitted same-specimen membrane surface, nucleus, organelles, boutons, receptors and partners. Zero records support a complete biological axon, zero are registered, and none has an exact same-cell transcriptomic join.",
  },
  {
    id: "coverage",
    eyebrow: "COVERAGE · EXPLICIT MISSINGNESS",
    title: "Cross-source coverage",
    metric: "8 sources × 7 precision axes",
    available: "Source-locator-backed judgments for taxonomy, region, life stage, injury, spatial measurement, causality and morphology.",
    boundary: "A shared matrix cell is comparison context, not a same-cell or same-type relationship.",
  },
];

export default function ResearchOverview({
  onOpenTab,
  focus,
  query,
  focusView,
  onFocusChange,
  onQueryChange,
  onFocusViewChange,
  onOpenRecord,
  onNotice,
}: {
  onOpenTab: (tab: ResearchLabTab) => void;
  focus: ResearchFocus | null;
  query: string;
  focusView: ResearchFocusView;
  onFocusChange: (focus: ResearchFocus) => void;
  onQueryChange: (query: string) => void;
  onFocusViewChange: (view: ResearchFocusView) => void;
  onOpenRecord: (record: ResearchRecord) => void;
  onNotice: (notice: string) => void;
}) {
  return (
    <section className="research-overview" aria-labelledby="research-overview-heading">
      <div className="research-start-routes" aria-label="Start exploring">
        <button type="button" onClick={() => onOpenTab("morphology")}>
          <span>01 · CELL SHAPE</span><strong>Explore a reconstructed neuron</strong>
          <span>Rotate deposited axon and dendrite traces; inspect their source detail.</span>
        </button>
        <button type="button" onClick={() => onOpenTab("types")}>
          <span>02 · CELL TYPES</span><strong>Find a molecular profile</strong>
          <span>Compare labels, marker evidence and sampling context within each study.</span>
        </button>
        <button type="button" onClick={() => onOpenTab("sci")}>
          <span>03 · INJURY CONTEXT</span><strong>Explore SCI study conditions</strong>
          <span>Follow population counts across the deposited samples and time points.</span>
        </button>
      </div>
      <ResearchExplorer
        focus={focus}
        query={query}
        activeView={focusView}
        onFocusChange={onFocusChange}
        onQueryChange={onQueryChange}
        onViewChange={onFocusViewChange}
        onOpenRecord={onOpenRecord}
        onNotice={onNotice}
      />

      <div className="research-overview-intro">
        <div>
          <span>RESEARCH-FIRST INFORMATION MAP</span>
          <h3 id="research-overview-heading">What the current model can answer</h3>
          <p>
            Start with the evidence lane that matches the question. Each lane preserves its own
            coordinate frame, sample definition and missingness; co-display never creates identity.
          </p>
        </div>
        <div className="research-overview-guard" role="note">
          <strong>0 REG</strong>
          <span>No molecular population, SCI time-course population, morphology or causal SCI evidence entity is registered to the reference anatomy.</span>
        </div>
      </div>

      <div className="research-lane-grid">
        {LANES.map((lane) => (
          <article key={lane.id}>
            <p>{lane.eyebrow}</p>
            <h4>{lane.title}</h4>
            <strong>{lane.metric}</strong>
            <details className="research-lane-detail">
              <summary>Available data and interpretation</summary>
              <dl>
                <div><dt>Available</dt><dd>{lane.available}</dd></div>
                <div><dt>Boundary</dt><dd>{lane.boundary}</dd></div>
              </dl>
            </details>
            <button type="button" onClick={() => onOpenTab(lane.id)}>
              Open {lane.title.toLowerCase()}
            </button>
          </article>
        ))}
      </div>

      <details className="research-internal-detail-disclosure">
        <summary>What supports intracellular detail in this atlas?</summary>
        <p className="type-classification-boundary" role="note">
        <strong>Internal-detail evidence gate · UPG-118–136:</strong> no admitted open source currently provides same-cell EM or organelle segmentation for <code>mouse.sc.vsx2_hoxa10</code>; UPG-136 keeps true same-cell spinal internals raw-data-blocked behind an explicit admission gate.
        Fish1 and Guan zebrafish volumes remain independent research candidates. The ten named spinal routes comprise eight dorsal-horn routes and two ventral-horn routes across exact source-local objects. The original four-record dorsal-horn pack reuses frozen <code>NMO_104003</code> and <code>NMO_108974</code> and adds supplementary <code>NMO_170035</code> and <code>NMO_249676</code>; the functional-class pack adds supplementary <code>NMO_50424</code> and Renshaw <code>NMO_45674</code>; the independent PrP-reporter pack adds nNOS-positive <code>NMO_50394</code> and galanin-positive <code>NMO_50408</code>; and the premotor comparison pack adds repository-labelled <code>NMO_45718</code>. Its calbindin-negative, pre-motor and non-renshaw terms remain repository wording because the paper exposes no exact object crosswalk and notes washout/location limitations. None supplies marker exclusivity, a transferable interior, a same-cell physiology join, a registration, or an addition to the frozen 142-record census.
        A stable specimen ID, cell ID, geometry version, raw-frame overlay, checksum and object-specific rights record are mandatory before any internal primitive can enter the model.
        </p>
      </details>

      <div className="research-question-router" aria-label="Research question routing guide">
        <div>
          <span>Question</span>
          <strong>Which named molecular populations are reported?</strong>
          <button type="button" onClick={() => onOpenTab("types")}>Use type evidence</button>
        </div>
        <div>
          <span>Question</span>
          <strong>How were source-local neuronal populations captured across five SCI conditions?</strong>
          <button type="button" onClick={() => onOpenTab("sci")}>Use SCI time course</button>
        </div>
        <div>
          <span>Question</span>
          <strong>What source anatomy exists at a sampled plane?</strong>
          <button type="button" onClick={() => onOpenTab("atlas")}>Use reference anatomy</button>
        </div>
        <div>
          <span>Question</span>
          <strong>Where are the exact source-local lumbar premotor coordinate rows?</strong>
          <button type="button" onClick={() => onOpenTab("positions")}>Use position evidence</button>
        </div>
        <div>
          <span>Question</span>
          <strong>What neurite geometry and micro-detail were actually supported, and how do selected source objects differ?</strong>
          <button type="button" onClick={() => onOpenTab("morphology")}>Use morphology census</button>
        </div>
        <div>
          <span>Question</span>
          <strong>Which of the current seven cross-source coverage axes is missing?</strong>
          <button type="button" onClick={() => onOpenTab("coverage")}>Use coverage matrix</button>
        </div>
      </div>
    </section>
  );
}
