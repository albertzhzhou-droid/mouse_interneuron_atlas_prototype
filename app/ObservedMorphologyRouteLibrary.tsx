"use client";

import { useMemo, useState } from "react";
import {
  dorsalHornObservedMorphologyRoutePack,
  functionalClassObservedMorphologyRoutePack,
  neurolucidaNativeContourAdmissionCatalog,
  nmo45718DatSwcDisplayBoundary,
  observedCellFormRecords,
  observedMorphologyRoutes,
  observedMorphologyRuntimeSummary,
  premotorComparisonObservedMorphologyRoutePack,
  prpDorsalHornObservedMorphologyRoutePack,
} from "./atlas-types";

const ROUTES_PER_PAGE = 6;

export default function ObservedMorphologyRouteLibrary({
  activeNeuronId,
  onOpenMainScene,
}: {
  activeNeuronId: number;
  onOpenMainScene: (neuronId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(() => {
    const activeIndex = observedMorphologyRoutes.findIndex((route) => route.sourceRecord.neuronId === activeNeuronId);
    return Math.floor(Math.max(0, activeIndex) / ROUTES_PER_PAGE);
  });
  const matchingRoutes = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
    return observedMorphologyRoutes.filter((route) => {
      const neuronId = route.sourceRecord.neuronId;
      const text = `${route.title} NMO ${neuronId} NMO-${neuronId} NeuroMorpho:${neuronId}`.toLocaleLowerCase("en-US");
      return terms.every((term) => text.includes(term));
    });
  }, [query]);
  const pageCount = Math.max(1, Math.ceil(matchingRoutes.length / ROUTES_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const firstResult = currentPage * ROUTES_PER_PAGE;
  const visibleRoutes = matchingRoutes.slice(firstResult, firstResult + ROUTES_PER_PAGE);

  return (
    <section className="observed-route-library" aria-labelledby="observed-route-library-title">
      <header>
        <div>
          <p className="panel-kicker">EXACT SPINAL ROUTES · SOURCE-LOCAL · UNREGISTERED</p>
          <h3 id="observed-route-library-title">Observed morphology route library</h3>
          <p>
            {observedMorphologyRoutes.length} named public-data routes open exact deposited spinal
            morphology records in the main scene, including two source-labelled 2D lamina X traces.
            Each retains its own source frame, dimensionality and missingness.
          </p>
        </div>
        <div className="observed-route-summary" aria-label="Observed route denominators">
          <span><strong>{observedMorphologyRoutes.length}</strong> named routes</span>
          <span><strong>{observedCellFormRecords.length}</strong> selectable main-scene forms</span>
          <span><strong>{observedMorphologyRuntimeSummary.frozenCensusRecordCount}</strong> frozen census records</span>
          <span><strong>{observedMorphologyRuntimeSummary.supplementaryComparatorObjectCount}</strong> supplementary comparator objects</span>
          <span><strong>0</strong> internal primitives</span>
        </div>
      </header>

      <details className="observed-route-membership">
        <summary>Collection membership and evidence limits</summary>
        <div className="observed-route-boundary" role="note">
        <strong>Membership is not census expansion.</strong>
        <span>
          The four-record dorsal-horn subtype pack reuses {dorsalHornObservedMorphologyRoutePack.runtimeMergePolicy.overlappingFrozenNeuronIds.length} frozen records and adds {dorsalHornObservedMorphologyRoutePack.runtimeMergePolicy.supplementaryNeuronIds.length} supplementary exact objects. The Renshaw/NPY functional-class pack adds {functionalClassObservedMorphologyRoutePack.runtimeMergePolicy.supplementaryNeuronIds.length}, the nNOS/galanin PrP-reporter pack adds {prpDorsalHornObservedMorphologyRoutePack.runtimeMergePolicy.supplementaryNeuronIds.length}, and the independent premotor comparison pack adds {premotorComparisonObservedMorphologyRoutePack.runtimeMergePolicy.supplementaryNeuronIds.length}; none expands the census. The two independent PV routes add separate source objects from different studies, with one No Diameter centerline route and one source-authorized radius derivative; these are not a paired experiment. The two Chen/Dai lamina X planar routes reuse two existing frozen records and add no geometry. No route is assigned to another molecular profile, SCI entity or paper-level electrophysiology record. NeuroMorpho reuse terms cover the admitted repository assets; article figures and microscopy panels are not bundled.
        </span>
        </div>
      </details>

      <div className="observed-route-browser-controls">
        <label htmlFor="observed-route-search">Search by route title or NeuroMorpho ID</label>
        <input
          id="observed-route-search"
          type="search"
          value={query}
          placeholder="For example, PV or 45718"
          aria-controls="observed-route-results"
          onChange={(event) => { setQuery(event.target.value); setPage(0); }}
        />
        <p className="observed-route-result-count" role="status" aria-live="polite" aria-atomic="true">
          {matchingRoutes.length > 0
            ? `Showing ${firstResult + 1}–${firstResult + visibleRoutes.length} of ${matchingRoutes.length} ${query.trim() ? "matching " : ""}routes`
            : "No matching routes"}
        </p>
        <nav className="observed-route-pagination" aria-label="Morphology route pages">
          <button type="button" disabled={currentPage === 0} aria-controls="observed-route-results" onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span>Page {currentPage + 1} of {pageCount}</span>
          <button type="button" disabled={currentPage + 1 >= pageCount} aria-controls="observed-route-results" onClick={() => setPage(currentPage + 1)}>Next</button>
        </nav>
      </div>

      {matchingRoutes.length === 0 && <p className="observed-route-empty">No route title or NeuroMorpho ID matches “{query}”. Try another term or clear the search.</p>}

      <div className="observed-route-grid" id="observed-route-results">
        {visibleRoutes.map((route) => {
          const record = route.fidelityRecord;
          const neuronId = route.sourceRecord.neuronId;
          const toddNtsRecord = "repositoryRelease" in route.sourceRecord && route.sourceRecord.repositoryRelease === "8.6.126"
            && "strain" in route.sourceRecord && "numericAge" in route.sourceRecord && "repositoryReferenceFieldsRaw" in route.sourceRecord
            ? route.sourceRecord
            : null;
          const pvSource = route.sourceAuthority === "NEUROMORPHO_RELEASE_8_6_124_INDEPENDENT_PV_SUPPLEMENT" ? route.sourceRecord : null;
          const toddAgeRange = toddNtsRecord && "minimum" in toddNtsRecord.numericAge && "maximum" in toddNtsRecord.numericAge
            ? toddNtsRecord.numericAge : null;
          const active = neuronId === activeNeuronId;
          const planar = record.geometry.dimensionality === "2D";
          const planarSource = "ageRangeDays" in route.sourceRecord ? route.sourceRecord : null;
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
                <em>{active ? planar ? "ACTIVE · SOURCE 2D" : "ACTIVE IN MAIN 3D" : planar ? "OBS · SOURCE 2D" : "OBS"}</em>
              </div>

              <dl>
                <div><dt>Source domain</dt><dd>{route.sourceRecord.domain}</dd></div>
                <div><dt>Integrity</dt><dd>{route.sourceRecord.physicalIntegrity}</dd></div>
                <div><dt>Nodes / edges</dt><dd>{record.geometry.nodeCount.toLocaleString()} / {record.geometry.segmentCount.toLocaleString()}</dd></div>
                <div><dt>Repository section</dt><dd>{repositorySlicingThickness} µm · {repositorySlicingDirection}</dd></div>
                <div><dt>Diameter</dt><dd>{record.geometry.sourceDiameterAvailable ? planar ? "Reported · no 3D surface" : "Source-authorized" : "Unavailable · surface fails closed"}</dd></div>
                <div><dt>Axon</dt><dd>{record.axon.sourceType2NodeCount > 0 ? `${record.axon.sourceType2NodeCount.toLocaleString()} source nodes · incomplete` : "Not reconstructed"}</dd></div>
                {hasNativeDatReceipt ? <div><dt>Native DAT</dt><dd>{nativeContourRecord
                  ? nativeContourRecord.admission.admittedContourObjectCount > 0
                    ? `${nativeContourRecord.admission.admittedContourObjectCount} exact line traces · ${nativeContourRecord.admission.admittedVertexCount} vertices · identity-gated native-frame viewer`
                    : `${nativeContourRecord.audit.somaNamedContourObjectCount} soma traces audited · 0 admitted · raw closure flags held`
                  : "Pinned provenance · not yet parsed or rendered"}</dd></div> : null}
              </dl>

              {pvSource ? <div className="observed-route-context" role="note"><strong>Independent PV source record · not a paired experiment</strong><span>{pvSource.cellTypeLabels.join(" · ")}. Young adult; numeric age unavailable. This record has soma and dendrites with no reconstructed axon. The source label supplies no exact physiology trace, circuit edge, animal pairing or internal structure.</span></div> : null}

              {planarSource ? (
                <div className="observed-route-context" role="note">
                  <strong>Exact 2D source-plane record</strong>
                  <span>{planarSource.archive} · {planarSource.condition.join(" · ")} · age {planarSource.ageRangeDays.join("–")} days · {planarSource.strain} · sex field {planarSource.sexRaw} (individual sex unresolved). Transverse preparation 250 µm; exact SWC z=0 is preserved. Source type 6 remains uninterpreted. Parent animal/specimen and same-cell physiology are unavailable.</span>
                </div>
              ) : null}

              {toddNtsRecord ? (
                <details className="observed-route-repository-metadata">
                  <summary>Exact NeuroMorpho 8.6.126 metadata · NMO {neuronId}</summary>
                  <dl>
                    <div><dt>Archive · species · stage</dt><dd>{toddNtsRecord.archive} · {toddNtsRecord.species} · {toddNtsRecord.lifeStage}</dd></div>
                    <div><dt>Sex · strain</dt><dd>{toddNtsRecord.sex} · {toddNtsRecord.strain}</dd></div>
                    <div><dt>Repository cell labels</dt><dd>{toddNtsRecord.cellTypeLabels.join(" · ")}</dd></div>
                    <div><dt>Repository region labels</dt><dd>{toddNtsRecord.regionLabels.join(" · ")}</dd></div>
                    <div><dt>Age range</dt><dd>{toddAgeRange ? `${toddAgeRange.minimum.value}–${toddAgeRange.maximum.value} ${toddAgeRange.minimum.unit}` : "Unavailable"}</dd></div>
                    <div><dt>Condition · protocol</dt><dd>{toddNtsRecord.condition.join(" · ")} · {toddNtsRecord.protocol}</dd></div>
                    <div><dt>Reconstruction · stain</dt><dd>{toddNtsRecord.reconstructionSoftware} · {toddNtsRecord.stain}</dd></div>
                    <div><dt>Official attributes · domain</dt><dd>{toddNtsRecord.sourceAttributes} · {toddNtsRecord.domain}</dd></div>
                    <div><dt>Original paper fields</dt><dd>DOI {toddNtsRecord.repositoryReferenceFieldsRaw.reference_doi.filter(Boolean).join(" · ") || "blank"} · PMID {toddNtsRecord.repositoryReferenceFieldsRaw.reference_pmid.join(" · ")} (record-level article mapping unresolved)</dd></div>
                  </dl>
                </details>
              ) : null}

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
                    {nativeContourRecord.admission.reason} {neuronId === 45718
                      ? nmo45718DatSwcDisplayBoundary
                      : "No DAT↔SWC transform is established; membrane and internal structures remain unavailable."}
                  </span>
                </div>
              ) : null}

              {"studyContext" in route && route.studyContext ? (
                <div className="observed-route-context" role="note">
                  <strong>Candidate study context · record mapping unverified</strong>
                  <span>{route.studyContext.basis} The article is context only, not the verified source-paper citation for this neuron.</span>
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
                  {route.sourceLinks.primaryPaper ? <a href={route.sourceLinks.primaryPaper} target="_blank" rel="noreferrer">Primary paper ↗</a> : <span>Primary paper citation unresolved</span>}
                  {"contextualStudy" in route.sourceLinks && route.sourceLinks.contextualStudy ? <a href={route.sourceLinks.contextualStudy} target="_blank" rel="noreferrer">Candidate related study ↗</a> : null}
                  <a href={route.sourceLinks.rights} target="_blank" rel="noreferrer">Reuse terms ↗</a>
                </nav>
              </details>

              <button
                type="button"
                className="observed-route-open"
                aria-pressed={active}
                onClick={() => onOpenMainScene(neuronId)}
              >{planar ? active ? "Re-open source-plane route in main scene" : "Open source-plane route in main scene" : active ? "Re-open active route in main 3D" : "Open exact route in main 3D"}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
