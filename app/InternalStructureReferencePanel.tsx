"use client";

import {
  crossRegionInternalReference,
  bancV888ComparativeInternalReference,
  bancV888CandidateAudit,
  bancV888MitochondriaRouteAudit,
  bancV888InternalObjectSourceAudit,
  micronsObservedCellNucleusReference,
  micronsSubcellularSourceAudit,
  micronsMitochondriaSpatialCompatibility,
  micronsSourceNativeClipping,
  pkd2l1SbfsemVideoReference,
  pkd2l1SbfsemPublicAvailabilityAudit,
  spinalInhibitoryInterneuronVolumeEmReference,
} from "./atlas-types";
import type { MicronsClippingState } from "./SceneCanvas";
import SuperClemPalmLocalizationReference from "./SuperClemPalmLocalizationReference";
import MicroStructFormerUltrastructureReference from "./MicroStructFormerUltrastructureReference";
import SvaraLarvalZebrafishSpinalSbemReference from "./SvaraLarvalZebrafishSpinalSbemReference";
import MouseSpinalEmRepositorySearchAudit from "./MouseSpinalEmRepositorySearchAudit";
import BancV888IN14A018MorphologyReference from "./BancV888IN14A018MorphologyReference";
import IndependentSourceObjectCoverage from "./IndependentSourceObjectCoverage";
import { useResearchActiveRecord } from "./ResearchActiveRecordProvider";
import { buildExactRecordDetailCoverage } from "./exact-record-detail-coverage.js";
import "./same-cell-internal-source.css";

type Props = {
  schematicActive: boolean;
  micronsActive: boolean;
  focusKind: string | null;
  focusId: string | null;
  showMicronsCellSurface: boolean;
  showMicronsNucleus: boolean;
  micronsClipping: MicronsClippingState;
  onOpenSchematic: () => void;
  onOpenMicrons: () => void;
  onToggleMicronsCellSurface: (visible: boolean) => void;
  onToggleMicronsNucleus: (visible: boolean) => void;
  onToggleMicronsClipping: (enabled: boolean) => void;
  onMicronsClippingAxisChange: (axis: MicronsClippingState["axis"]) => void;
  onMicronsClippingPositionChange: (positionNanometre: number) => void;
  onMicronsClippingSideChange: (side: MicronsClippingState["keepSide"]) => void;
  onResetMicronsClipping: () => void;
};

export default function InternalStructureReferencePanel({
  schematicActive,
  micronsActive,
  focusKind,
  focusId,
  showMicronsCellSurface,
  showMicronsNucleus,
  micronsClipping,
  onOpenSchematic,
  onOpenMicrons,
  onToggleMicronsCellSurface,
  onToggleMicronsNucleus,
  onToggleMicronsClipping,
  onMicronsClippingAxisChange,
  onMicronsClippingPositionChange,
  onMicronsClippingSideChange,
  onResetMicronsClipping,
}: Props) {
  const { activeRecord, indexState } = useResearchActiveRecord();
  const detailCoverage = buildExactRecordDetailCoverage({
    indexState,
    activeRecordState: activeRecord,
    focus: focusKind && focusId ? { focusKind, focusId } : null,
  });
  const exactRecord = detailCoverage.record;
  const primarySource = exactRecord?.provenance?.urls?.[0] ?? null;
  const cellComponent = micronsObservedCellNucleusReference.components.find((component) => component.id === "cell-segmentation-surface")!;
  const nucleusComponent = micronsObservedCellNucleusReference.components.find((component) => component.id === "nucleus-segmentation-surface")!;
  const clipBounds = micronsSourceNativeClipping.clippingOperation.boundsNanometre[micronsClipping.axis];

  return (
    <section className="internal-reference-panel" aria-labelledby="internal-reference-panel-title">
      <header className="internal-reference-panel-heading">
        <div>
          <p>STRUCTURAL DETAIL · EVIDENCE-SEPARATED</p>
          <h2 id="internal-reference-panel-title">What can be shown inside a cell?</h2>
        </div>
        <span>{micronsActive ? "OBS MODE ACTIVE" : schematicActive ? "ZERO-GEOMETRY AUDIT ACTIVE" : "OBS / UNAVAILABLE"}</span>
      </header>

      <section className="exact-record-detail-coverage" aria-labelledby="exact-record-detail-coverage-title" data-focus-kind={focusKind ?? "none"} data-focus-id={focusId ?? "none"} data-status={detailCoverage.status}>
        <header>
          <div>
            <p>UPG-251 · ACTIVE-RECORD DETAIL AUDIT</p>
            <p className="exact-record-detail-increment">UPG-258 · shared structural gap shown once</p>
            <h3 id="exact-record-detail-coverage-title">Exact-record model detail</h3>
            <span>{exactRecord ? `${exactRecord.focusKind.replaceAll("_", " ")} · ${exactRecord.title}` : focusId ?? "No selected source record"}</span>
          </div>
          <em>{detailCoverage.status === "ready" ? "VERIFIED RECORD" : detailCoverage.status.toUpperCase()}</em>
        </header>

          <div className="exact-record-detail-index-summary" aria-label="Verified Research Explorer detail-index summary">
          {detailCoverage.indexSummary.status === "ready" ? <>
            <span><strong>{detailCoverage.indexSummary.exactRecordCount.toLocaleString("en-US")}</strong> core Explorer records</span>
            <span><strong>{detailCoverage.indexSummary.supplementalRecordCount.toLocaleString("en-US")}</strong> verified source-route supplements</span>
            <span><strong>{detailCoverage.indexSummary.sourceMorphologyRecordCount.toLocaleString("en-US")}</strong> Explorer morphology records</span>
            <span><strong>{detailCoverage.indexSummary.supplementalMorphologyRecordCount.toLocaleString("en-US")}</strong> supplementary morphology records</span>
            <span><strong>{detailCoverage.indexSummary.admittedInternalObjectCount.toLocaleString("en-US")}</strong> admitted internal objects</span>
            <span><strong>{detailCoverage.indexSummary.fallbackPrimitiveCount.toLocaleString("en-US")}</strong> fallback primitives</span>
          </> : <span>Waiting for the checksum-verified Research Explorer index; prior detail totals are hidden.</span>}
          </div>

        {detailCoverage.status === "ready" ? <>
          <p className="exact-record-detail-policy">The matrix below follows this verified record only. Source-reported values, derived displays and admitted geometry are separate states; unavailable does not mean biologically absent.</p>
          {detailCoverage.sharedInternalBoundary && <aside className="exact-record-shared-internal-boundary" role="note" aria-label="Shared internal-structure boundary">
            <strong>Shared internal-structure boundary · {detailCoverage.sharedInternalBoundary.status.replaceAll("_", " ")}</strong>
            <p>{detailCoverage.sharedInternalBoundary.detail}</p>
            <small>{detailCoverage.sharedInternalBoundary.authority} · <code>{detailCoverage.sharedInternalBoundary.sourceLocator}</code></small>
          </aside>}
          <div className="exact-record-detail-grid" aria-label={`Exact-record cell-detail coverage for ${exactRecord.focusId}`}>
            {detailCoverage.rows.map((item) => (
              <article key={item.id} data-detail-slot={item.id} data-status={item.status}>
                <header><strong>{item.label}</strong><span>{item.statusLabel}</span></header>
                <p>{item.detail}</p>
                <small>{item.authority} · <code>{item.locator}</code></small>
              </article>
            ))}
          </div>
          <details className="exact-record-required-internal-source" data-testid="same-cell-internal-source-gate">
            <summary>Required source evidence for an internal object · UPG-118</summary>
            <p>Internal geometry needs an exact specimen and cell, versioned source objects, physical coordinates, file-specific rights, current byte verification and independent raw-volume linkage. A shared marker, population or plausible image cannot fill a missing field.</p>
            <p>Nucleus source contract · {detailCoverage.internalSourceGates?.nucleus.internalLayerStatus.replaceAll("_", " ")}</p>
            <dl>{detailCoverage.internalSourceGates?.nucleus.checks.map((check) => <div key={check.id}><dt>{check.label}</dt><dd><strong>{check.status === "passed" ? "Verified for this object" : "Unavailable / not verified"}</strong> · {check.reason}{check.locator && <small> Source: <code>{check.locator}</code></small>}</dd></div>)}</dl>
            <p>These requirements apply separately to nuclei, organelles, synaptic structures and receptor geometry. Independent references keep their own source context and do not satisfy the selected record&apos;s same-cell gate.</p>
          </details>
          {primarySource && <a className="exact-record-detail-source" href={primarySource.url} target="_blank" rel="noreferrer">Open this record&apos;s source · {primarySource.label} ↗</a>}
        </> : <p className="exact-record-detail-pending" role="status">{detailCoverage.status === "verifying"
          ? "Verifying the exact selected record. The previous record's detail receipt is not shown."
          : detailCoverage.status === "idle"
            ? "Select an exact knowledge record to see its source-specific detail coverage."
            : "This selection has not produced a verified exact-record detail receipt. No fallback or previous record is shown."}</p>}
      </section>

      <details className="independent-reference-library">
        <summary>
          <div>
            <span>COMPARATIVE / SOURCE-ONLY STRUCTURAL EVIDENCE</span>
            <strong>Independent reference library</strong>
          </div>
          <em>NOT LINKED TO THE ACTIVE RECORD</em>
        </summary>
        <p className="independent-reference-library-note">
          These datasets can demonstrate what source-native structures look like, but they are not substitutes for the selected cell. Each keeps its own species, specimen, modality and geometry boundary; opening a reference does not create a same-cell link.
        </p>

      <IndependentSourceObjectCoverage />

      <SuperClemPalmLocalizationReference />

      <MicroStructFormerUltrastructureReference />

      <SvaraLarvalZebrafishSpinalSbemReference />

      <MouseSpinalEmRepositorySearchAudit />

      <details className="spinal-volume-em-reference-card">
        <summary>
          <div><span>UPG-216 · INDEPENDENT SPINAL EM REFERENCE</span><strong>A published internal-detail example · not the selected record</strong></div>
          <em>LINK ONLY · 0 PROJECT OBJECTS</em>
        </summary>
        <p>Zhang et al. report a {spinalInhibitoryInterneuronVolumeEmReference.acquisition.reportedVolumeMicrometre.join(" × ")} μm dorsal-horn volume and publish a 3D reconstruction of a primary-afferent profile alongside two broadly labeled inhibitory-neuron profiles.</p>
        <ul aria-label="Structures in the published reconstruction">
          {spinalInhibitoryInterneuronVolumeEmReference.publishedReconstruction.reconstructedStructures.map((structure) => (
            <li key={structure}>{structure}</li>
          ))}
        </ul>
        <div className="spinal-volume-em-boundary" role="note">
          <strong>Reference only—not the selected record</strong>
          <p>The Slc32a1-based label is broad inhibitory-neuron context, not a named interneuron subtype. The paper&apos;s axon and dendrite are profiles, not a stable cell count. This app imports no trace, mesh, stack or segmentation, and makes no identity join or measurement.</p>
          <span>Open the publication-hosted figure or supplement; the current project contains zero geometry from this source.</span>
        </div>
        <nav className="spinal-volume-em-links" aria-label="Published spinal volume reconstruction source links">
          <a href={spinalInhibitoryInterneuronVolumeEmReference.source.articleUrl} target="_blank" rel="noreferrer">Primary article ↗</a>
          <a href={spinalInhibitoryInterneuronVolumeEmReference.source.figureUrl} target="_blank" rel="noreferrer">Figure 4 ↗</a>
          <a href={spinalInhibitoryInterneuronVolumeEmReference.source.fullTextAndSupplementUrl} target="_blank" rel="noreferrer">Full text + Supplementary Video 2 ↗</a>
        </nav>
      </details>

      <details className="spinal-volume-em-reference-card banc-comparative-reference-card">
        <summary>
          <div><span>UPG-219 · COMPARATIVE FLY CONNECTOME</span><strong>Public VNC neurons with internal-detail data routes</strong></div>
          <em>v888 DATA MAP · EXACT ROUTE BELOW</em>
        </summary>
        <p>{bancV888ComparativeInternalReference.biologicalScope.species} · {bancV888ComparativeInternalReference.biologicalScope.lifeStage} {bancV888ComparativeInternalReference.biologicalScope.sex} · one specimen · whole VNC · CAVE {bancV888ComparativeInternalReference.snapshot.materializationId}. The pinned Dataverse v{bancV888CandidateAudit.source.dataverseVersion.versionNumber} metadata has {bancV888CandidateAudit.metadataSnapshot.file.rows.toLocaleString()} rows × {bancV888CandidateAudit.metadataSnapshot.file.columns} columns; its documentation says {bancV888CandidateAudit.metadataSnapshot.documentationDiscrepancy.documentedRows.toLocaleString()} × {bancV888CandidateAudit.metadataSnapshot.documentationDiscrepancy.documentedColumns}. Both are segment-level metadata counts, not an interneuron denominator.</p>
        <ul aria-label="BANC v888 publicly documented data products">
          <li>{bancV888ComparativeInternalReference.sourceProducts.neuronMeshes.format} per-neuron meshes · {bancV888ComparativeInternalReference.sourceProducts.neuronMeshes.availability.replaceAll("_", " ")}</li>
          <li>{bancV888ComparativeInternalReference.sourceProducts.neuronSkeletons.format} skeletons · {bancV888ComparativeInternalReference.sourceProducts.neuronSkeletons.coordinateFrame}</li>
          <li>Cell-type fields: {bancV888ComparativeInternalReference.sourceProducts.perNeuronMetadata.taxonomyFields.join(" → ")}</li>
          <li>Nucleus ID ↔ root ID: one exact annotation-table row verified; no nucleus surface admitted</li>
          <li>Source-reported count metric: <strong>{bancV888MitochondriaRouteAudit.candidate.mitochondriaCountMetric.value}</strong> mitochondria for exact root {bancV888MitochondriaRouteAudit.candidate.rootId}; no spatial positions or mitochondria geometry have been verified.</li>
          <li>Per-mito table: the public v888 release lists a {Math.round(bancV888InternalObjectSourceAudit.sources.mitochondriaAnnotations.publicDataverseFile.bytes / 1_000_000)} MB compressed annotation table. A root-filtered query by <code>{bancV888InternalObjectSourceAudit.sources.mitochondriaAnnotations.rootFilterField}</code> is documented, but requires a registered CAVE token; no token was inspected or used and no candidate rows or positions were retrieved.</li>
          <li>Synapse tables: {bancV888InternalObjectSourceAudit.sources.synapses.publicRawVersionsListed.join(" / ")}; v2 coordinates are in nanometres, while v3 uses a distinct voxel grid. The exact v2 archive is about {Math.round(bancV888InternalObjectSourceAudit.sources.synapses.v2File.bytes / 1_000_000_000)} GB compressed; no candidate rows were extracted.</li>
        </ul>
        <div className="spinal-volume-em-boundary" role="note">
          <strong>One exact candidate is audited; its internal-detail chain is still incomplete</strong>
          <p>Audit sentinel {bancV888CandidateAudit.candidate.rootId} · {bancV888CandidateAudit.candidate.cellType} · {bancV888CandidateAudit.candidate.cellSubClass} · proofread. Its root ID is stable across v626/v850/v888/v890; the linked nucleus row is verified. A pinned full-resolution SWC member has {bancV888CandidateAudit.objectReceipts.fullResolutionSkeletonMember.swcNodeCount.toLocaleString()} nodes (SHA-256 {bancV888CandidateAudit.objectReceipts.fullResolutionSkeletonMember.memberSha256.slice(0, 12)}…). The screen found {bancV888CandidateAudit.metadataSnapshot.screenCounts.strictlyProofreadWithNucleusPositionSubclassAndType.toLocaleString()} records meeting the stated metadata gates; this is a candidate filter, not a census. The 31-mitochondria count is metadata only. The exact skeleton + nucleus-point comparison shown below is the only admitted candidate geometry; this availability card imports no additional geometry. It is not linked to the selected mouse record.</p>
          <span>The public neuron-mesh fragments matching this root are mutable GCS objects last updated {bancV888CandidateAudit.objectReceipts.neuronMeshCandidateObjects.objects[0].updated.slice(0, 10)}, before the paper&apos;s v888 date ({bancV888ComparativeInternalReference.snapshot.paperReleaseDate}); their v888 version and reuse terms are unverified. The per-mito table is listed in the DOI archive, while a separate detected-mitochondria entry remains {bancV888CandidateAudit.objectReceipts.mitochondria.separateDetectedMitochondriaMapEntry}; exact candidate mito rows and synapses remain pending.</span>
        </div>
        <div className="spinal-volume-em-boundary" role="note">
          <strong>UPG-249 · public source routes found; no new internal objects admitted</strong>
          <ul>
            <li>Nucleus boundary route: <code>{bancV888InternalObjectSourceAudit.sources.nucleusBoundary.function}</code> exposes the exact nucleus ID through <code>seg_v1</code>, but this audit did not fetch or hash the mesh or verify its v888 binding and reuse terms.</li>
            <li>Mitochondria segmentation: a separate client route exists, but it is not linked to v888 and the official BANC data map marks the detected-mitochondria product missing.</li>
            <li>Synapse coordinates: v2 and v3 must remain separate; v3 points use {bancV888InternalObjectSourceAudit.sources.synapses.v3CoordinateFrame.voxelResolutionNanometres.join(" × ")} nm source voxels, not v2 nanometres.</li>
          </ul>
          <span>These are documented open-source routes, not candidate-specific geometry receipts. Current admission remains 0 nucleus surfaces, 0 mitochondria points/surfaces, 0 synapse objects, and 0 mouse joins.</span>
        </div>
        <nav className="spinal-volume-em-links" aria-label="BANC v888 comparative source links">
          <a href={bancV888ComparativeInternalReference.source.portalUrl} target="_blank" rel="noreferrer">Official 3D viewer ↗</a>
          <a href={bancV888ComparativeInternalReference.source.articleUrl} target="_blank" rel="noreferrer">Primary paper ↗</a>
          <a href={bancV888ComparativeInternalReference.source.dataLocationsUrl} target="_blank" rel="noreferrer">Data-product map ↗</a>
          <a href={bancV888InternalObjectSourceAudit.sources.nucleusBoundary.cloudVolumePrefix.replace("precomputed://gs://", "https://storage.googleapis.com/") + "/info"} target="_blank" rel="noreferrer">Nucleus segmentation metadata ↗</a>
          <a href="https://natverse.org/bancr/reference/banc_all_synapses.html" target="_blank" rel="noreferrer">Synapse table versions and coordinate frames ↗</a>
          <a href="https://natverse.org/bancr/reference/banc_cave_tables.html" target="_blank" rel="noreferrer">Root-filter query documentation ↗</a>
          <a href={`https://doi.org/${bancV888ComparativeInternalReference.source.dataverseDoi}`} target="_blank" rel="noreferrer">Dataverse v888 ↗</a>
          <a href={`https://doi.org/${bancV888ComparativeInternalReference.source.bossDbDoi}`} target="_blank" rel="noreferrer">BossDB segmentations ↗</a>
        </nav>
      </details>

      <BancV888IN14A018MorphologyReference />

      <section className="pkd2l1-sbfsem-reference-card" aria-labelledby="pkd2l1-sbfsem-reference-title">
        <header>
          <div><span>UPG-184 · OBS PUBLICATION VIDEO · MOUSE SPINAL</span><strong id="pkd2l1-sbfsem-reference-title">PKD2L1 CSF-contacting-neuron ultrastructure</strong></div>
          <em>VIDEO / 0 ADMITTED 3D OBJECTS</em>
        </header>
        <p>{pkd2l1SbfsemVideoReference.video.title}</p>
        <div className="pkd2l1-sbfsem-video-shell">
          <video
            controls
            preload="metadata"
            poster={pkd2l1SbfsemVideoReference.video.posterUrl}
            width={pkd2l1SbfsemVideoReference.video.width}
            height={pkd2l1SbfsemVideoReference.video.height}
            aria-label="eLife Video 5 serial SBF-SEM reference for mouse spinal CSF-contacting neurons"
          >
            {pkd2l1SbfsemVideoReference.video.sources.map((source) => (
              <source key={source.format} src={source.url} type={source.mediaType} />
            ))}
            <track
              default
              kind="captions"
              src="/data/pkd2l1_sbfsem_video5_captions.vtt"
              srcLang="en"
              label="English visual description"
            />
            This browser cannot play the remote publication video. Use the source link below.
          </video>
          <div>
            <span>Exact acquisition report</span>
            <strong>{pkd2l1SbfsemVideoReference.acquisition.pixelSizeNanometre} nm/pixel · {pkd2l1SbfsemVideoReference.acquisition.sectionStepNanometre} nm steps · {pkd2l1SbfsemVideoReference.acquisition.reportedDepth}</strong>
            <p>{pkd2l1SbfsemVideoReference.biologicalScope.spinalContext}</p>
            <small>MP4 receipt: {pkd2l1SbfsemVideoReference.video.sources[0].bytes?.toLocaleString()} bytes · streamed from the publication host · not bundled</small>
          </div>
        </div>
        <div className="pkd2l1-sbfsem-readiness" aria-label="PKD2L1 SBF-SEM object readiness">
          <article className="available"><strong>Observed image frames</strong><span>Available</span></article>
          <article><strong>Raw voxel stack</strong><span>Not exposed by article/API</span></article>
          <article><strong>Segmentation labels</strong><span>Not exposed by article/API</span></article>
          <article><strong>Mesh / skeleton</strong><span>Not exposed by article/API</span></article>
          <article><strong>Admitted internal objects</strong><span>{pkd2l1SbfsemVideoReference.objectReadiness.admittedInternalObjectCount}</span></article>
        </div>
        <div className="pkd2l1-sbfsem-boundary" role="note">
          <strong>Observed imagery, not reconstructable project geometry</strong>
          <p>{pkd2l1SbfsemVideoReference.availabilityAudit.finding} This is limited to the official article and its API, not a universal absence claim.</p>
          <span>No frame interpolation, depth estimation, tracing, measurement, molecular-profile join or fallback primitive is permitted.</span>
        </div>
        <details className="pkd2l1-sbfsem-audit-detail">
          <summary>UPG-242 · public-data and reuse audit · bounded source review</summary>
          <dl>
            <div><dt>Paper-reported tracing population</dt><dd>{pkd2l1SbfsemPublicAvailabilityAudit.articleDataAvailability.singleCellLightMicroscopyTracingPopulationCount} CSF-cNs; not an SBF-SEM cell census</dd></div>
            <div><dt>Formal data-availability statement</dt><dd>Numerical source data for Figures {pkd2l1SbfsemPublicAvailabilityAudit.articleDataAvailability.formalStatementNumericalSourceDataFigures.join(" and ")}; it names no EM volume or segmentation deposit</dd></div>
            <div><dt>eLife figure page</dt><dd>{pkd2l1SbfsemPublicAvailabilityAudit.articleDataAvailability.officialFiguresPageCounts.figures} figures · {pkd2l1SbfsemPublicAvailabilityAudit.articleDataAvailability.officialFiguresPageCounts.videos} videos · {pkd2l1SbfsemPublicAvailabilityAudit.articleDataAvailability.officialFiguresPageCounts.additionalFiles} additional file ({pkd2l1SbfsemPublicAvailabilityAudit.articleDataAvailability.officialFiguresPageCounts.additionalFileDescription})</dd></div>
            <div><dt>Figure 4</dt><dd>Panels {pkd2l1SbfsemPublicAvailabilityAudit.figure4.representativeSbfsemSerialImagePanels.join("–")} show publication images; panel {pkd2l1SbfsemPublicAvailabilityAudit.figure4.publicationReconstructionPanel} is a rendered reconstruction, not a released mesh or segmentation</dd></div>
            <div><dt>Video 5</dt><dd>{pkd2l1SbfsemPublicAvailabilityAudit.video5.widthPixels} × {pkd2l1SbfsemPublicAvailabilityAudit.video5.heightPixels}px remote media; its MP4 rendition is {pkd2l1SbfsemPublicAvailabilityAudit.video5.renditions.find((rendition) => rendition.format === "mp4")?.bytes?.toLocaleString()} bytes</dd></div>
            <div><dt>Volume geometry</dt><dd>Full stack dimensions and axis order are not exposed in the reviewed sources; no voxel array, labels, mesh, skeleton or stable EM-object crosswalk was found</dd></div>
            <div><dt>Reuse terms</dt><dd>{pkd2l1SbfsemPublicAvailabilityAudit.objectAndRightsReadiness.articleRelatedMediaReuseTerms}</dd></div>
          </dl>
          <p className="pkd2l1-sbfsem-audit-scope">Bounded review: official article and article API, figures/data/video page, and eLife site terms. This is not a universal absence claim. No video or raw volume payload was downloaded or bundled; 0 EM volumes, internal objects, joins, registrations or measurements are admitted.</p>
          <nav className="microns-reference-links" aria-label="UPG-242 public-availability audit sources">
            <a href={pkd2l1SbfsemPublicAvailabilityAudit.source.figuresUrl} target="_blank" rel="noreferrer">Figures, data, and video page ↗</a>
            <a href={pkd2l1SbfsemPublicAvailabilityAudit.source.termsUrl} target="_blank" rel="noreferrer">eLife terms ↗</a>
            <a href={pkd2l1SbfsemPublicAvailabilityAudit.scope.articleApiReceipt.url} target="_blank" rel="noreferrer">Pinned article API ↗</a>
          </nav>
        </details>
        <nav className="microns-reference-links" aria-label="PKD2L1 SBF-SEM publication links">
          <a href={pkd2l1SbfsemVideoReference.source.articleUrl} target="_blank" rel="noreferrer">Primary article ↗</a>
          <a href={pkd2l1SbfsemVideoReference.video.sources[0].url} target="_blank" rel="noreferrer">Open Video 5 ↗</a>
        </nav>
      </section>

      <section id="microns-observed-reference" className="microns-observed-reference-card" aria-labelledby="microns-observed-reference-title">
        <header>
          <div><span>UPG-111 · PHASE A · OBS EM</span><strong id="microns-observed-reference-title">Exact cell segmentation + linked nucleus</strong></div>
          <em>visual cortex L2/3</em>
        </header>
        <p>One MICrONS Phase 1 v185.4 inhibitory/chandelier cell object and the nucleus linked by its source identity table. The coarse label is not a molecular subtype.</p>

        <button type="button" className="internal-reference-open observed" aria-pressed={micronsActive} onClick={onOpenMicrons}>
          <span>{micronsActive ? "Observed EM reference open" : "Open exact observed EM reference"}</span>
          <em>co-display only</em>
        </button>

        <div className="microns-reference-component-toggles" aria-label="Observed MICrONS component visibility">
          <label aria-label="Show MICrONS cell segmentation surface">
            <input type="checkbox" checked={showMicronsCellSurface} onChange={(event) => onToggleMicronsCellSurface(event.target.checked)} />
            <span><i className="cell-surface" /><strong>Cell segmentation surface</strong><small>{cellComponent.vertexCount.toLocaleString()} vertices · {cellComponent.triangleCount.toLocaleString()} triangles</small></span>
          </label>
          <label aria-label="Show MICrONS linked nucleus segmentation">
            <input type="checkbox" checked={showMicronsNucleus} onChange={(event) => onToggleMicronsNucleus(event.target.checked)} />
            <span><i className="nucleus-surface" /><strong>Linked nucleus segmentation</strong><small>{nucleusComponent.vertexCount.toLocaleString()} vertices · {nucleusComponent.triangleCount.toLocaleString()} triangles</small></span>
          </label>
        </div>

        <section className="microns-clipping-controls" aria-labelledby="microns-clipping-title">
          <header>
            <div><span>UPG-166 · DER DISPLAY OPERATION</span><strong id="microns-clipping-title">Source-native shell clipping</strong></div>
            <em>{micronsClipping.enabled ? "CELL SHELL CUT" : "OFF"}</em>
          </header>
          <label className="microns-clipping-enable" aria-label="Enable source-native MICrONS cell-shell clipping">
            <input type="checkbox" checked={micronsClipping.enabled} onChange={(event) => onToggleMicronsClipping(event.target.checked)} />
            <span><strong>Clip the cell segmentation surface</strong><small>Nucleus remains intact · cell mesh bytes stay unchanged</small></span>
          </label>
          <fieldset>
            <legend>Source-native axis</legend>
            <div className="microns-clipping-axis">
              {(["x", "y", "z"] as const).map((axis) => (
                <button type="button" key={axis} className={micronsClipping.axis === axis ? "active" : ""} aria-pressed={micronsClipping.axis === axis} onClick={() => onMicronsClippingAxisChange(axis)}>{axis.toUpperCase()}</button>
              ))}
            </div>
          </fieldset>
          <label className="microns-clipping-position">Plane position · source nm
            <input
              type="range"
              min={clipBounds.minimum}
              max={clipBounds.maximum}
              step="any"
              value={micronsClipping.positionNanometre}
              onChange={(event) => onMicronsClippingPositionChange(Number(event.target.value))}
            />
            <span><input
              type="number"
              min={clipBounds.minimum}
              max={clipBounds.maximum}
              step="any"
              value={micronsClipping.positionNanometre}
              onChange={(event) => onMicronsClippingPositionChange(Number(event.target.value))}
              aria-label={`MICrONS ${micronsClipping.axis.toUpperCase()} clipping position in source nanometres`}
            /><small>{clipBounds.minimum.toLocaleString()}–{clipBounds.maximum.toLocaleString()} nm exact cell bounds</small></span>
          </label>
          <fieldset>
            <legend>Retained side</legend>
            <div className="microns-clipping-side">
              {(["positive", "negative"] as const).map((side) => (
                <button type="button" key={side} className={micronsClipping.keepSide === side ? "active" : ""} aria-pressed={micronsClipping.keepSide === side} onClick={() => onMicronsClippingSideChange(side)}>Keep {side}</button>
              ))}
            </div>
          </fieldset>
          <button type="button" className="microns-clipping-reset" onClick={onResetMicronsClipping}>Reset to soma-centre Z plane</button>
          <div className="microns-clipping-boundary" role="note">
            <strong>Uncapped shader cut · not a biological section</strong>
            <span>Nucleus remains intact. No cap, repair, resampling, generated geometry, organelle inference, join, registration, or measurement claim is created.</span>
          </div>
        </section>

        <dl className="microns-reference-identity">
          <div><dt>Cell root</dt><dd>{micronsObservedCellNucleusReference.identityChain.cellRootId}</dd></div>
          <div><dt>Nucleus</dt><dd>{micronsObservedCellNucleusReference.identityChain.somaValenceTable.nucleusId}</dd></div>
          <div><dt>Same object</dt><dd>Yes · source-native identity · 0 project REG</dd></div>
          <div><dt>Spinal relationship</dt><dd>False · co-display only · 0 joins</dd></div>
        </dl>

        <div className="microns-reference-boundary">
          <strong>Segmentation surface ≠ membrane measurement</strong>
          <span>Only the exact cell surface and linked nucleus are rendered here. Candidate synapse and mitochondria sources, their access gaps and object-level admission gates are summarized below.</span>
        </div>

        <details className="microns-subcellular-route-card">
          <summary>
            <div><span>UPG-218 · UPG-223 · SOURCE AUDIT</span><strong>Subcellular data routes</strong></div>
            <em>0 NEW 3D OBJECTS</em>
          </summary>
          <p>Potential microscopic detail exists in public MICrONS products, but no cell-specific synapse or mitochondrion object has passed the version and identity gates for this scene.</p>
          <div className="microns-subcellular-route-grid">
            <article>
              <header><strong>Putative synapse detections</strong><span>NO PROOFREAD CONTACT OVERLAY</span></header>
              <p>{micronsSubcellularSourceAudit.synapseTable.publishedRowDescription}.</p>
              <dl>
                <div><dt>Archive</dt><dd>{micronsSubcellularSourceAudit.synapseTable.metadataDepositVersion} metadata · {micronsSubcellularSourceAudit.synapseTable.fileName} · {(micronsSubcellularSourceAudit.synapseTable.fileBytes / 1_000_000).toFixed(1)} MB</dd></div>
                <div><dt>Quality</dt><dd>Automated detections; not a validated connectivity graph and no per-row proofreading flag.</dd></div>
                <div><dt>Access</dt><dd>Exact-root CAVE query requires a configured token; the full table was not downloaded.</dd></div>
              </dl>
            </article>
            <article>
              <header><strong>Manual mitochondria annotations</strong><span>SPATIAL NO-GO FOR THIS ROOT</span></header>
              <p>The official v185 layer metadata is now pinned. Its listed grid is {micronsMitochondriaSpatialCompatibility.mitochondriaLayer.sizeVoxel.join(" × ")} voxels at [{micronsMitochondriaSpatialCompatibility.mitochondriaLayer.resolutionNanometre.join(", ")}] nm, offset [{micronsMitochondriaSpatialCompatibility.mitochondriaLayer.voxelOffset.join(", ")}]. Under direct nominal-frame mapping, the layer bounds do not overlap this exact cell mesh on X or Y.</p>
              <dl>
                <div><dt>Nominal overlap</dt><dd>X: {micronsMitochondriaSpatialCompatibility.coordinateCompatibility.identityMappingXOverlap ? "yes" : "no"} · Y: {micronsMitochondriaSpatialCompatibility.coordinateCompatibility.identityMappingYOverlap ? "yes" : "no"} · Z: {micronsMitochondriaSpatialCompatibility.coordinateCompatibility.identityMappingZOverlap ? "yes" : "no"}</dd></div>
                <div><dt>Cross-layer transform</dt><dd>Not declared in the audited info metadata; a shared origin/axis mapping is unverified.</dd></div>
              </dl>
              <code>{micronsSubcellularSourceAudit.mitochondriaRoute.precomputedLayer.replace("precomputed://", "")}</code>
            </article>
          </div>
          <div className="microns-subcellular-route-boundary" role="note">
            <strong>Version gap: {micronsSubcellularSourceAudit.synapseTable.metadataDepositVersion} table vs. {micronsSubcellularSourceAudit.targetReference.segmentationRelease} mesh</strong>
            <span>The point-coordinate columns use the nominal MICrONS nanometre frame, but exact root lineage and point-to-mesh agreement remain unverified. The table labels detections as putative and many source objects are unproofread; no contacts, functional links or spinal-cell joins are inferred.</span>
            <span>The nominal-grid mismatch blocks this layer for the target cell; without a verified cross-layer transform, this is not evidence of biological absence. Zero mitochondria, registration or additional 3D objects are admitted.</span>
          </div>
          <nav className="microns-reference-links" aria-label="MICrONS subcellular source audit links">
            {micronsSubcellularSourceAudit.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}
          </nav>
        </details>

        <nav className="microns-reference-links" aria-label="MICrONS exact-reference source links">
          <a href={micronsObservedCellNucleusReference.sourceDataset.sourcePage} target="_blank" rel="noreferrer">Dataset ↗</a>
          <a href={`https://doi.org/${micronsObservedCellNucleusReference.sourceDataset.metadataDepositDoi}`} target="_blank" rel="noreferrer">Identity tables ↗</a>
          <a href={`https://doi.org/${micronsObservedCellNucleusReference.sourceDataset.primaryPublicationDoi}`} target="_blank" rel="noreferrer">Primary paper ↗</a>
        </nav>
        <div className="internal-reference-receipt observed">
          <strong>{micronsObservedCellNucleusReference.contractId}</strong>
          <span>97 exact fragments · four checksum-gated browser arrays · {micronsSourceNativeClipping.contractId} · no welding, smoothing, repair, decimation, cap or source-buffer mutation</span>
        </div>
      </section>

      <section className="schematic-reference-card" aria-labelledby="schematic-reference-title">
        <header><span>UNAVAILABLE / REF</span><strong id="schematic-reference-title">Object-level compartment evidence audit</strong></header>
        <button type="button" className="internal-reference-open" aria-pressed={schematicActive} onClick={onOpenSchematic}>
          <span>{schematicActive ? "Zero-geometry audit open" : "Open zero-geometry evidence audit"}</span>
          <em>0 primitives</em>
        </button>

        <p className="internal-reference-explainer">
          Public sources establish the vocabulary, but this route has no admitted object-level cell or organelle geometry. The 3D scene therefore renders nothing: missing evidence is not replaced by spheres, capsules, tubes or other procedural proxies.
        </p>

        <div className="internal-reference-components" aria-label="Unrendered compartment classes awaiting object-level geometry">
          {crossRegionInternalReference.components.map((component) => (
            <article key={component.id}>
              <span>UNAVAILABLE</span>
              <strong>{component.label}</strong>
              <p>{component.claim}</p>
            </article>
          ))}
        </div>

        <details className="internal-reference-omissions">
          <summary>Still not rendered ({crossRegionInternalReference.notRendered.length})</summary>
          <ul>
            {crossRegionInternalReference.notRendered.map((item) => (
              <li key={item.id}><strong>{item.id.replaceAll("-", " ")}</strong><span>{item.reason}</span></li>
            ))}
          </ul>
        </details>

        <div className="internal-reference-sources">
          <h3>Vocabulary basis</h3>
          {crossRegionInternalReference.sources.map((source) => (
            <article key={source.id}>
              <span>{source.relationship.replaceAll("_", " ")}</span>
              <strong>{source.title}</strong>
              <p>{source.region} · {source.lifeStage}</p>
              <small>{source.modality}</small>
              <nav aria-label={`${source.title} source links`}>
                <a href={source.sourceUrl} target="_blank" rel="noreferrer">Dataset ↗</a>
                <a href={`https://doi.org/${source.primaryDoi}`} target="_blank" rel="noreferrer">Primary source ↗</a>
              </nav>
            </article>
          ))}
        </div>

        <div className="internal-reference-receipt">
          <strong>{crossRegionInternalReference.contractId}</strong>
          <span>{crossRegionInternalReference.renderedPrimitiveCount} rendered primitives · {crossRegionInternalReference.sourceDerivedGeometryCount} source meshes · {crossRegionInternalReference.registrationCount} registrations · measurement {crossRegionInternalReference.measurementUse}</span>
        </div>
      </section>
      </details>
    </section>
  );
}
