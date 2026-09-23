"use client";

import {
  crossRegionInternalReference,
  bancV888ComparativeInternalReference,
  bancV888CandidateAudit,
  micronsObservedCellNucleusReference,
  micronsSourceNativeClipping,
  pkd2l1SbfsemVideoReference,
  spinalInhibitoryInterneuronVolumeEmReference,
} from "./atlas-types";
import type { MicronsClippingState } from "./SceneCanvas";

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

      <div className="internal-reference-decision" data-focus-kind={focusKind ?? "none"} data-focus-id={focusId ?? "none"}>
        <strong>Current knowledge record: {focusId ?? "none selected"}</strong>
        <p>{focusKind ? `${focusKind.replaceAll("_", " ")} · ` : ""}No admitted object links this exact record to boundary, nucleus, organelle, bouton, receptor, or synapse geometry. Switching records updates the evidence fingerprint, while this same-record internal scene correctly stays empty. Cross-region references remain separate scenes.</p>
      </div>

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
          <em>v888 · {bancV888ComparativeInternalReference.projectAdmission.sourceObjectsImported} LOCAL OBJECTS</em>
        </summary>
        <p>{bancV888ComparativeInternalReference.biologicalScope.species} · {bancV888ComparativeInternalReference.biologicalScope.lifeStage} {bancV888ComparativeInternalReference.biologicalScope.sex} · one specimen · whole VNC · CAVE {bancV888ComparativeInternalReference.snapshot.materializationId}. The pinned Dataverse v{bancV888CandidateAudit.source.dataverseVersion.versionNumber} metadata has {bancV888CandidateAudit.metadataSnapshot.file.rows.toLocaleString()} rows × {bancV888CandidateAudit.metadataSnapshot.file.columns} columns; its documentation says {bancV888CandidateAudit.metadataSnapshot.documentationDiscrepancy.documentedRows.toLocaleString()} × {bancV888CandidateAudit.metadataSnapshot.documentationDiscrepancy.documentedColumns}. Both are segment-level metadata counts, not an interneuron denominator.</p>
        <ul aria-label="BANC v888 publicly documented data products">
          <li>{bancV888ComparativeInternalReference.sourceProducts.neuronMeshes.format} per-neuron meshes · {bancV888ComparativeInternalReference.sourceProducts.neuronMeshes.availability.replaceAll("_", " ")}</li>
          <li>{bancV888ComparativeInternalReference.sourceProducts.neuronSkeletons.format} skeletons · {bancV888ComparativeInternalReference.sourceProducts.neuronSkeletons.coordinateFrame}</li>
          <li>Cell-type fields: {bancV888ComparativeInternalReference.sourceProducts.perNeuronMetadata.taxonomyFields.join(" → ")}</li>
          <li>Nucleus ID ↔ root ID: one exact annotation-table row verified; no nucleus surface admitted</li>
          <li>Mitochondria: v3 archive includes the per-mito table; this candidate has a count metric of {bancV888CandidateAudit.candidate.metadataMetrics.mitochondriaCount}, but its annotation rows and segmentation geometry remain unverified</li>
          <li>Synapse tables: {bancV888ComparativeInternalReference.sourceProducts.synapseTables.versions.join(" / ")}; candidate-specific rows not extracted</li>
        </ul>
        <div className="spinal-volume-em-boundary" role="note">
          <strong>One exact candidate is audited; its internal-detail chain is still incomplete</strong>
          <p>Audit sentinel {bancV888CandidateAudit.candidate.rootId} · {bancV888CandidateAudit.candidate.cellType} · {bancV888CandidateAudit.candidate.cellSubClass} · proofread. Its root ID is stable across v626/v850/v888/v890; the linked nucleus row is verified. A pinned full-resolution SWC member has {bancV888CandidateAudit.objectReceipts.fullResolutionSkeletonMember.swcNodeCount.toLocaleString()} nodes (SHA-256 {bancV888CandidateAudit.objectReceipts.fullResolutionSkeletonMember.memberSha256.slice(0, 12)}…). The screen found {bancV888CandidateAudit.metadataSnapshot.screenCounts.strictlyProofreadWithNucleusPositionSubclassAndType.toLocaleString()} records meeting the stated metadata gates; this is a candidate filter, not a census. No BANC objects or geometries are imported, and this fly record is not linked to the selected mouse record.</p>
          <span>The public neuron-mesh fragments matching this root are mutable GCS objects last updated {bancV888CandidateAudit.objectReceipts.neuronMeshCandidateObjects.objects[0].updated.slice(0, 10)}, before the paper&apos;s v888 date ({bancV888ComparativeInternalReference.snapshot.paperReleaseDate}); their v888 version and reuse terms are unverified. The per-mito table is listed in the DOI archive, while a separate detected-mitochondria entry remains {bancV888CandidateAudit.objectReceipts.mitochondria.separateDetectedMitochondriaMapEntry}; exact candidate mito rows and synapses remain pending.</span>
        </div>
        <nav className="spinal-volume-em-links" aria-label="BANC v888 comparative source links">
          <a href={bancV888ComparativeInternalReference.source.portalUrl} target="_blank" rel="noreferrer">Official 3D viewer ↗</a>
          <a href={bancV888ComparativeInternalReference.source.articleUrl} target="_blank" rel="noreferrer">Primary paper ↗</a>
          <a href={bancV888ComparativeInternalReference.source.dataLocationsUrl} target="_blank" rel="noreferrer">Data-product map ↗</a>
          <a href={`https://doi.org/${bancV888ComparativeInternalReference.source.dataverseDoi}`} target="_blank" rel="noreferrer">Dataverse v888 ↗</a>
          <a href={`https://doi.org/${bancV888ComparativeInternalReference.source.bossDbDoi}`} target="_blank" rel="noreferrer">BossDB segmentations ↗</a>
        </nav>
      </details>

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
        <nav className="microns-reference-links" aria-label="PKD2L1 SBF-SEM publication links">
          <a href={pkd2l1SbfsemVideoReference.source.articleUrl} target="_blank" rel="noreferrer">Primary article ↗</a>
          <a href={pkd2l1SbfsemVideoReference.video.sources[0].url} target="_blank" rel="noreferrer">Open Video 5 ↗</a>
        </nav>
      </section>

      <section className="microns-observed-reference-card" aria-labelledby="microns-observed-reference-title">
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
          <span>No mitochondria, synapses, ER, Golgi, receptors, other organelles, spinal identity or molecular subtype are admitted.</span>
        </div>

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
    </section>
  );
}
