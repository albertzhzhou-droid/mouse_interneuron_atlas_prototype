"use client";

import {
  dorsalHornObservedMorphologyRoutePack,
  functionalClassObservedMorphologyRoutePack,
  neurolucidaNativeContourAdmissionCatalog,
  observedCellFormRecords,
  observedMorphologyRoutes,
  premotorComparisonObservedMorphologyRoutePack,
  prpDorsalHornObservedMorphologyRoutePack,
} from "./atlas-types";

export default function ObservedMorphologyRouteLibrary({
  activeNeuronId,
  onOpenMainScene,
}: {
  activeNeuronId: number;
  onOpenMainScene: (neuronId: number) => void;
}) {
  return (
    <section className="observed-route-library" aria-labelledby="observed-route-library-title">
      <header>
        <div>
          <p className="panel-kicker">EXACT SPINAL ROUTES · SOURCE-LOCAL · UNREGISTERED</p>
          <h3 id="observed-route-library-title">Observed morphology route library</h3>
          <p>
            {observedMorphologyRoutes.length} named public-data routes open exact deposited dorsal- or ventral-horn
            reconstructions in the main 3D scene. They are independent cells—not averaged type
            models, atlas placements, connectomes or same-specimen internal reconstructions.
          </p>
        </div>
        <div className="observed-route-summary" aria-label="Observed route denominators">
          <span><strong>{observedMorphologyRoutes.length}</strong> named routes</span>
          <span><strong>{observedCellFormRecords.length}</strong> unique main-scene forms</span>
          <span><strong>142</strong> frozen census records</span>
          <span><strong>7</strong> supplementary comparator objects</span>
          <span><strong>0</strong> internal primitives</span>
        </div>
      </header>

      <div className="observed-route-boundary" role="note">
        <strong>Membership is not census expansion.</strong>
        <span>
          The four-record dorsal-horn subtype pack reuses {dorsalHornObservedMorphologyRoutePack.runtimeMergePolicy.overlappingFrozenNeuronIds.length} frozen records and adds {dorsalHornObservedMorphologyRoutePack.runtimeMergePolicy.supplementaryNeuronIds.length} supplementary exact objects. The Renshaw/NPY functional-class pack adds {functionalClassObservedMorphologyRoutePack.runtimeMergePolicy.supplementaryNeuronIds.length}, the nNOS/galanin PrP-reporter pack adds {prpDorsalHornObservedMorphologyRoutePack.runtimeMergePolicy.supplementaryNeuronIds.length}, and the independent premotor comparison pack adds {premotorComparisonObservedMorphologyRoutePack.runtimeMergePolicy.supplementaryNeuronIds.length}; none expands the census. No route is assigned to another molecular profile, SCI entity or paper-level electrophysiology record. NeuroMorpho reuse terms cover the admitted repository assets; article figures and microscopy panels are not bundled.
        </span>
      </div>

      <div className="observed-route-grid">
        {observedMorphologyRoutes.map((route) => {
          const record = route.fidelityRecord;
          const neuronId = route.sourceRecord.neuronId;
          const active = neuronId === activeNeuronId;
          const repositorySlicingThickness = "repositorySlicingThicknessMicrometre" in route.sourceRecord
            ? route.sourceRecord.repositorySlicingThicknessMicrometre
            : route.sourceRecord.slicingThicknessMicrometre;
          const repositorySlicingDirection = "repositorySlicingDirection" in route.sourceRecord
            ? route.sourceRecord.repositorySlicingDirection
            : route.sourceRecord.slicingDirection;
          const hasNativeDatReceipt = "nativeDatContract" in route;
          const nativeContourRecord = neurolucidaNativeContourAdmissionCatalog.records.find((item) => item.neuronId === neuronId) ?? null;
          const preparationContext = "paperPreparationContext" in route.sourceRecord
            ? route.sourceRecord.paperPreparationContext
            : null;
          const hasStrainConflict = "strainJoinStatus" in route.sourceRecord
            && route.sourceRecord.strainJoinStatus === "conflict_unresolved";
          const repositoryWeight = "repositoryWeightGrams" in route.sourceRecord
            ? route.sourceRecord.repositoryWeightGrams
            : null;
          const hasMetadataWarning = hasStrainConflict
            || repositoryWeight?.validForBiologicalInterpretation === false;
          const repositoryStrainRaw = "repositoryStrainRaw" in route.sourceRecord
            ? route.sourceRecord.repositoryStrainRaw
            : "not reported";
          const paperStrainContext = "paperStrainContext" in route.sourceRecord
            ? route.sourceRecord.paperStrainContext
            : "not linked at individual-record level";
          const isRepositoryLabelComparison = neuronId === 45718;
          return (
            <article key={route.routeId} className={active ? "active" : ""}>
              <div className="observed-route-card-heading">
                <div>
                  <span>NMO {neuronId} · {route.censusMembership ? "CENSUS CHILD" : "SUPPLEMENTARY EXACT OBJECT"}</span>
                  <h4>{route.title}</h4>
                </div>
                <em>{active ? "ACTIVE IN MAIN 3D" : "OBS"}</em>
              </div>

              <dl>
                <div><dt>Source domain</dt><dd>{route.sourceRecord.domain}</dd></div>
                <div><dt>Integrity</dt><dd>{route.sourceRecord.physicalIntegrity}</dd></div>
                <div><dt>Nodes / edges</dt><dd>{record.geometry.nodeCount.toLocaleString()} / {record.geometry.segmentCount.toLocaleString()}</dd></div>
                <div><dt>Repository section</dt><dd>{repositorySlicingThickness} µm · {repositorySlicingDirection}</dd></div>
                <div><dt>Diameter</dt><dd>{record.geometry.sourceDiameterAvailable ? "Source-authorized" : "Unavailable · surface fails closed"}</dd></div>
                <div><dt>Axon</dt><dd>{record.axon.sourceType2NodeCount > 0 ? `${record.axon.sourceType2NodeCount.toLocaleString()} source nodes · incomplete` : "Not reconstructed"}</dd></div>
                {hasNativeDatReceipt ? <div><dt>Native DAT</dt><dd>{nativeContourRecord
                  ? nativeContourRecord.admission.admittedContourObjectCount > 0
                    ? `${nativeContourRecord.admission.admittedContourObjectCount} exact line traces · ${nativeContourRecord.admission.admittedVertexCount} vertices · identity-gated native-frame viewer`
                    : `${nativeContourRecord.audit.somaNamedContourObjectCount} soma traces audited · 0 admitted · raw closure flags held`
                  : "Pinned provenance · not yet parsed or rendered"}</dd></div> : null}
              </dl>

              {preparationContext ? (
                <div className="observed-route-context" role="note">
                  <strong>Preparation context</strong>
                  <span>{preparationContext}</span>
                </div>
              ) : null}

              {hasMetadataWarning ? (
                <div className="observed-route-conflict" role="note">
                  <strong>Repository metadata warning</strong>
                  <span>
                    Strain: {repositoryStrainRaw} · paper context: {paperStrainContext}.
                    {repositoryWeight ? ` Repository weight bounds are ${repositoryWeight.minimum}–${repositoryWeight.maximum} g and are invalid for interpretation.` : ""}
                  </span>
                </div>
              ) : null}

              {isRepositoryLabelComparison ? (
                <div className="observed-route-conflict" role="note">
                  <strong>Repository label ≠ definitive paper-level subtype</strong>
                  <span>
                    NeuroMorpho labels this object calbindin-negative, glycinergic, pre-motor and non-renshaw. The linked paper exposes no NMO/file crosswalk, notes that calbindin non-detection can reflect washout and states that non-Renshaw glycinergic cells are not necessarily premotor. These labels remain source wording—not an exact physiology join or verified Renshaw exclusion.
                  </span>
                </div>
              ) : null}

              {nativeContourRecord ? (
                <div className="observed-route-context" role="note">
                  <strong>Per-record native DAT decision</strong>
                  <span>
                    {nativeContourRecord.admission.reason} No DAT↔SWC transform is established; membrane and internal structures remain unavailable.
                  </span>
                </div>
              ) : null}

              <div className="observed-route-zero-row">
                <span>0 identity joins</span><span>0 exact physiology joins</span><span>0 REG</span><span>0 internal primitives</span>
              </div>

              <details>
                <summary>Evidence boundaries and source links</summary>
                <ul>
                  {route.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
                <nav aria-label={`Sources for NeuroMorpho ${neuronId}`}>
                  <a href={route.sourceLinks.officialRecord} target="_blank" rel="noreferrer">Official record ↗</a>
                  {"officialMorphometry" in route.sourceLinks ? <a href={route.sourceLinks.officialMorphometry} target="_blank" rel="noreferrer">Morphometry ↗</a> : null}
                  {"originalDat" in route.sourceLinks ? <a href={route.sourceLinks.originalDat} target="_blank" rel="noreferrer">Original DAT ↗</a> : null}
                  <a href={route.sourceLinks.primaryPaper} target="_blank" rel="noreferrer">Primary paper ↗</a>
                  <a href={route.sourceLinks.rights} target="_blank" rel="noreferrer">Reuse terms ↗</a>
                </nav>
              </details>

              <button
                type="button"
                className="observed-route-open"
                aria-pressed={active}
                onClick={() => onOpenMainScene(neuronId)}
              >{active ? "Re-open active route in main 3D" : "Open exact route in main 3D"}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
