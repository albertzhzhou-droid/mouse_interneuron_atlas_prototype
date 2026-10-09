"use client";

import ResearchExplorer, {
  type ResearchFocus,
  type ResearchFocusView,
  type ResearchRecord,
} from "./ResearchExplorer";
import { neurolucidaNativeContourAdmissionCatalog, observedMorphologyRuntimeSummary, researchSourceRegistrySummary } from "./atlas-types";
import { formatResearchSourceRegistrySummary } from "./research-source-registry-summary.js";
import neuromorphoReleaseDelta from "../data/neuromorpho-release-8-6-125-query-delta-audit-0.1.json";
import neuromorphoRelease126ToddStableIdAudit from "../data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.json";
import bilXeniumAudit from "../data/bil-xenium-spinal-audit-0.1.json";

const nativeContourRuntimeSummary = neurolucidaNativeContourAdmissionCatalog.summary;
const nativeContourRecordByNeuronId = new Map(neurolucidaNativeContourAdmissionCatalog.records.map((record) => [record.neuronId, record]));
const nmo108978ContourAudit = nativeContourRecordByNeuronId.get(108978)?.audit;
const nmo249676ContourAudit = nativeContourRecordByNeuronId.get(249676)?.audit;
if (!nmo108978ContourAudit || !nmo249676ContourAudit) {
  throw new Error("The exact NMO 108978 and NMO 249676 native-contour receipts are unavailable");
}

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
    metric: "387 source profiles · 10 studies · separate fish comparison",
    available: "Searchable mouse-centric molecular and functional profiles, source labels, exact counts, marker panels where reported, region and transmitter context where established, 11 source-explicit Cano-Gomez P56 CHOL_IN profiles, 157 Roome embryonic refined dIL aggregates, 51 Delile E9.5–E13.5 fine-subtype aggregates with exact five-stage distributions, eight adult cholinergic I1–I8 clusters, 17–28-day (P17–P28) dorsal-horn Glut/Gaba clusters, the P0 V2a Type I/II framework, one PKD2L1 CSF-contacting-neuron functional population, and a separate 4 dpf zebrafish source-label panel.",
    boundary: "The 387 core records are not unique or cross-study-harmonized types; the separate zebrafish panel reports ten larval spinal interneuron labels but no barcode-level roster, reconciled animal denominator, cell geometry, mouse equivalences or atlas registration. The 11 Cano-Gomez rows are admitted only from exact groups=CHOL_IN source assignments and do not turn the paper's reported 516 neuronal types into an interneuron denominator; Delile's 51 records cover 15,217 fine-subtype cells and retain the source's `dl` spelling, but the pinned annotation object does not establish canonical transmitter, adult identity, cell geometry or biological-animal count; Roome's 157 records are captured-cell aggregates within a 61,444-cell embryonic dIL denominator, and their displayed genes are differential features rather than canonical or universal markers; Dmrt3 M1–M6 are embryonic study-local groups from one pooled library and PKD2L1 firing-pattern/segment rows remain nested evidence. Exact cross-study identity and type-specific geometry remain 0.",
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
    available: `A checksum-gated browser over all 1,097 no-age-query source objects, plus the frozen ${observedMorphologyRuntimeSummary.frozenCensusRecordCount}-record adult query matrix. All ${observedMorphologyRuntimeSummary.selectableCensusMorphologyCount} census records now have distinct main-scene selections (${observedMorphologyRuntimeSummary.sourceLabelledThreeDimensionalCensusCount} source-labelled 3D and ${observedMorphologyRuntimeSummary.sourceLabelledPlanarCensusCount} planar inputs), alongside ${observedMorphologyRuntimeSummary.supplementaryComparatorObjectCount} supplementary exact routes and per-record micro-detail analysis. The ${observedMorphologyRuntimeSummary.namedRouteCount} named spinal routes remain a curated route subset; NMO 108978 retains its separate native-soma contour view.`,
    boundary: `The full query is a repository-record universe, not 1,097 biological types, animals or complete cells. The frozen adult subset (${observedMorphologyRuntimeSummary.frozenCensusRecordCount}) and ${observedMorphologyRuntimeSummary.supplementaryComparatorObjectCount} supplementary-route layer remain separate denominators. All ${observedMorphologyRuntimeSummary.selectableCensusMorphologyCount} frozen-census records are now selectable in the main scene alongside ${observedMorphologyRuntimeSummary.supplementaryComparatorObjectCount} supplementary objects; the two source-labelled 2D records remain planar even where diameter metadata exists. ${nativeContourRuntimeSummary.admittedRecordCount} exact records expose ${nativeContourRuntimeSummary.admittedContourObjectCount} checksum-gated source-native soma-contour LineLoops / ${nativeContourRuntimeSummary.admittedVertexCount.toLocaleString("en-US")} vertices. NMO_108978 (${nmo108978ContourAudit.somaNamedContourObjectCount} loops / ${nmo108978ContourAudit.somaNamedVertexCount.toLocaleString("en-US")} vertices) and NMO_249676 (${nmo249676ContourAudit.somaNamedContourObjectCount} / ${nmo249676ContourAudit.somaNamedVertexCount.toLocaleString("en-US")}) have their own source-native frames; NMO 108978 remains a named source-specific route without a new cell type or census contribution. NMO_45718 retains 8 legacy-contract traces / 275 vertices; NMO_45674 retains 7 explicitly source-closed traces / 200 vertices. The Todd subset adds exactly NMO_50424 = 8 / 427, NMO_50394 = 14 / 768 and NMO_50408 = 11 / 709: raw sourceClosedFlag=false is preserved, and interpreted closure requires the exact Cell Body name, empty-value CellBody presence property, pinned-parser somaContour classification and documented MBF cell-body semantics. User Line 1–4 remain excluded. No fill, triangle, loft, surface, membrane, volume, biological measurement, DAT-to-SWC overlay, join or registration is asserted. Most records still lack a same-specimen native soma contour, and all records lack an admitted same-specimen membrane surface, nucleus, organelles, boutons, receptors and partners. Zero records support a complete biological axon, zero are registered, and none has an exact same-cell transcriptomic join.`,
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

      <article className="research-release-watch" aria-labelledby="research-release-watch-125-heading" data-research-upgrade-id={neuromorphoReleaseDelta.assetAndAdmissionBoundaries.researchUpgradeId}>
        <div>
          <p>HISTORICAL RELEASE CHECK · {neuromorphoReleaseDelta.assetAndAdmissionBoundaries.researchUpgradeId}</p>
          <h3 id="research-release-watch-125-heading">NeuroMorpho {neuromorphoReleaseDelta.candidateRepositoryRelease.version}: adult query unchanged</h3>
          <strong>{neuromorphoReleaseDelta.comparison.semanticallyUnchangedRecordCount} of {neuromorphoReleaseDelta.comparison.candidateRecordCount} queried records retain matching semantic metadata.</strong>
          <p>The active morphology collection remains {neuromorphoReleaseDelta.assetAndAdmissionBoundaries.activeGeometryReleaseRemains}. This check does not cover geometry-file hashes, dimensionality changes, or file-specific reuse rights.</p>
        </div>
        <details>
          <summary>Query and audit limits</summary>
          <p>Exact filters: mouse · spinal cord · interneuron · adult; page 0, up to 500 rows, sorted by neuron ID. Added, removed, and semantically changed records: 0 each. The observed {neuromorphoReleaseDelta.observedResponseReceipt.byteCount.toLocaleString("en-US")}-byte response was not retained, so independent reproduction requires rerunning the GET. The reported response digest is a historical receipt, not a substitute for that response.</p>
          <nav aria-label="NeuroMorpho release audit sources">
            <a href={neuromorphoReleaseDelta.candidateRepositoryRelease.officialMetadataUrl} target="_blank" rel="noreferrer">Official release metadata</a>
            <a href={neuromorphoReleaseDelta.query.apiDocumentationUrl} target="_blank" rel="noreferrer">API documentation</a>
            <a href={neuromorphoReleaseDelta.rightsLocator} target="_blank" rel="noreferrer">Terms of use</a>
          </nav>
        </details>
      </article>

      <article className="research-release-watch" aria-labelledby="research-release-watch-126-heading" data-research-upgrade-id={neuromorphoRelease126ToddStableIdAudit.researchUpgradeId}>
        <div>
          <p>CURRENT RELEASE WATCH · {neuromorphoRelease126ToddStableIdAudit.researchUpgradeId}</p>
          <h3 id="research-release-watch-126-heading">NeuroMorpho {neuromorphoRelease126ToddStableIdAudit.currentRelease.version}: 30 stable IDs reviewed; full query delta remains open</h3>
          <strong>{neuromorphoRelease126ToddStableIdAudit.releaseSetReview.candidateStableIdCount} Todd release candidates · {neuromorphoRelease126ToddStableIdAudit.comparison.candidateIdsFoundInBaseline} in the prior baseline · {neuromorphoRelease126ToddStableIdAudit.currentQuery.observedMetadataUiHitCount} current-query UI hits</strong>
          <p>The prior Todd subset ({neuromorphoRelease126ToddStableIdAudit.baseline.archiveQueryRecordCount}) plus 30 candidates matches the 339-hit UI count arithmetically, but the complete current ID roster is still unavailable. Keep 8.6.124 active; no new record or 3D object is admitted.</p>
        </div>
        <details>
          <summary>30 reviewed stable IDs and audit limits</summary>
          <p>The official release reports {neuromorphoRelease126ToddStableIdAudit.currentRelease.announcedToddNovelReconstructionCount} novel Todd reconstructions. All listed records were individually checked for Todd archive, mouse, spinal cord and interneuron metadata, then compared with the {neuromorphoRelease126ToddStableIdAudit.baseline.release} index ({neuromorphoRelease126ToddStableIdAudit.baseline.queryRecordCount.toLocaleString("en-US")} total records; {neuromorphoRelease126ToddStableIdAudit.baseline.archiveQueryRecordCount} Todd records). All 30 candidate stable IDs are absent from that baseline. The 309 + 30 = 339 arithmetic match does not prove a complete current roster or rule out removals and metadata changes; those counts remain unresolved.</p>
          <p>These are source metadata candidates, not admitted geometry. No candidate files were downloaded or hashed; file dimensionality, completeness and object-level reuse terms remain unreviewed. Keep the 8.6.124 query and geometry universe active, with zero new records, objects, identity joins, registrations or measurements.</p>
          <ul className="research-release-candidate-list" aria-label="Reviewed NeuroMorpho Todd release candidates">
            {neuromorphoRelease126ToddStableIdAudit.releaseSetReview.candidateRecords.map((record) => <li key={record.neuronId}><a href={record.recordUrl} target="_blank" rel="noreferrer">NMO_{record.neuronId} · {record.neuronName}</a></li>)}
          </ul>
          <nav aria-label="NeuroMorpho 8.6.126 audit sources">
            {neuromorphoRelease126ToddStableIdAudit.sources.map((source) => <a key={source.label} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}
          </nav>
        </details>
      </article>

      <article className="research-release-watch research-xenium-watch" aria-labelledby="research-xenium-watch-heading" data-research-upgrade-id={bilXeniumAudit.researchUpgradeId}>
        <div>
          <p>SPATIAL MOLECULAR DATA CANDIDATE · {bilXeniumAudit.researchUpgradeId} · {bilXeniumAudit.study.publicationStatus.replaceAll("_", " ").toUpperCase()}</p>
          <h3 id="research-xenium-watch-heading">A promising cell-local evidence lane—kept 2D and source-specific</h3>
          <strong>{bilXeniumAudit.study.sectionCount} sections · {bilXeniumAudit.study.animalCounts.total} adult mice ({bilXeniumAudit.study.animalCounts.male} male / {bilXeniumAudit.study.animalCounts.female} female) · {bilXeniumAudit.study.targetedGeneCount}-gene Xenium panel</strong>
          <p>The linked preprint reports {bilXeniumAudit.study.reportedNeuronCellCounts.total.toLocaleString("en-US")} neuronal and {bilXeniumAudit.study.reportedNonNeuronalCellCount.toLocaleString("en-US")} non-neuronal profiles. BIL lists cell-boundary, nucleus-boundary and transcript files for a sampled slide; a future source-local viewer could expose their 2D evidence after the table schema, IDs and annotations are verified.</p>
        </div>
        <details>
          <summary>Availability, classification and reuse limits</summary>
          <p>The paper reports {bilXeniumAudit.study.reportedNeuronTypeCounts.glutamatergic} glutamatergic, {bilXeniumAudit.study.reportedNeuronTypeCounts.gabaergic} GABAergic and {bilXeniumAudit.study.reportedNeuronTypeCounts.cholinergic} cholinergic neuron types. These are not an interneuron roster: exact cell-to-type assignments and motor/projection/other exclusions still need auditing. The data record spans {bilXeniumAudit.study.reportedRegions.join(", ")} but omits rostral and coccygeal segments; the 16 listed run/slide folders are not reconciled to the {bilXeniumAudit.study.animalCounts.total} paper-reported animals.</p>
          <p>{bilXeniumAudit.interpretationBoundaries[0]} The BIL general policy is CC BY-SA 4.0, but dataset-specific rights remain unverified and the record carries a repository-review notice. Disposition: {bilXeniumAudit.rightsAndAcquisition.disposition.replaceAll("_", " ")}. A single sampled OME-TIFF is listed at {bilXeniumAudit.dataset.sampledFolderFileListing.find((file) => file.fileName === "morphology.ome.tif")?.bytes.toLocaleString("en-US")} bytes; no payload was downloaded.</p>
          <nav aria-label="BIL Xenium spatial audit sources">
            {bilXeniumAudit.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}
          </nav>
        </details>
      </article>

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
        Fish1 and Guan zebrafish volumes remain independent research candidates. The {observedMorphologyRuntimeSummary.namedRouteCount} named spinal routes comprise {observedMorphologyRuntimeSummary.dorsalHornRouteCount} dorsal-horn routes and {observedMorphologyRuntimeSummary.ventralHornRouteCount} ventral-horn routes across exact source-local objects. The original four-record dorsal-horn pack reuses frozen <code>NMO_104003</code> and <code>NMO_108974</code> and adds supplementary <code>NMO_170035</code> and <code>NMO_249676</code>; the separate <code>NMO_108978</code> census-child route reuses the existing adult census and native DAT evidence without changing its denominator. The functional-class pack adds supplementary <code>NMO_50424</code> and Renshaw <code>NMO_45674</code>; the independent PrP-reporter pack adds nNOS-positive <code>NMO_50394</code> and galanin-positive <code>NMO_50408</code>; and the premotor comparison pack adds repository-labelled <code>NMO_45718</code>. Its calbindin-negative, pre-motor and non-renshaw terms remain repository wording because the paper exposes no exact object crosswalk and notes washout/location limitations. None supplies marker exclusivity, a transferable interior, a same-cell physiology join, a registration, or an addition to the frozen adult census.
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
