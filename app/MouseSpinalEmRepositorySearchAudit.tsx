import { mouseSpinalEmRepositorySearchAudit, openMouseSpinalFibsemNearMissAudit } from "./atlas-types";

export default function MouseSpinalEmRepositorySearchAudit() {
  const audit = mouseSpinalEmRepositorySearchAudit;

  return (
    <details className="open-em-search-audit-card">
      <summary>
        <div><span>UPG-243 · BOUNDED OPEN-REPOSITORY SEARCH</span><strong>Mouse spinal EM: no exact interneuron-object route in this screen</strong></div>
        <em>0 QUALIFYING ROUTES · 0 OBJECTS</em>
      </summary>
      <p>{audit.scope} The search is bounded to the query results and candidate records listed here; it is not a universal no-data claim.</p>
      <div className="open-em-search-query-grid" aria-label="Open repository search results">
        {audit.repositoryQueries.map((query, index) => (
          <article key={`${query.repository}-${query.query}-${index}`}>
            <strong>{query.repository}</strong>
            <code>{query.query}</code>
            <span>{query.resultCount.toLocaleString()} {query.repository === "BioImage Archive" ? "full-text hits" : "matching entries"}</span>
            <small>{query.resultScope}</small>
          </article>
        ))}
      </div>
      <div className="open-em-search-candidates">
        <strong>Near matches reviewed, not admitted</strong>
        {audit.reviewedCandidateRecords.map((candidate) => (
          <article key={candidate.accession}>
            <div><a href={candidate.recordUrl} target="_blank" rel="noreferrer">{candidate.accession} ↗</a><span>{candidate.observedStudyLicense} · {candidate.observedSpecies.join(" / ")}</span></div>
            <p>{candidate.title}</p>
            {candidate.observedSegmentationScope && <small>{candidate.observedSegmentationScope}</small>}
            <small>{candidate.exclusion}</small>
          </article>
        ))}
      </div>
      <section className="open-em-search-candidates" aria-label="Additional open mouse spinal FIB-SEM references">
        <strong>Additional public near-match · mouse spinal FIB-SEM, not an interneuron dataset</strong>
        <p>UPG-249 follow-up found two CC BY 4.0 adult-mouse dorsal corticospinal-tract volumes. They are useful as separately labeled axonal ultrastructure references, but do not provide an exact spinal-interneuron object route.</p>
        {openMouseSpinalFibsemNearMissAudit.candidateVolumes.map((volume) => (
          <article key={volume.datasetId}>
            <div><a href={volume.figshareUrl} target="_blank" rel="noreferrer">{volume.datasetId} ↗</a><span>{volume.genotype} · {volume.sex} · {volume.ageMonths} months · {volume.license.replaceAll("-", " ")}</span></div>
            <p>{volume.anatomicalRegion} · {volume.modality} · {volume.voxelSizeNanometres.join(" × ")} nm · {volume.dimensionsMicrometres.join(" × ")} μm</p>
            <small>Published structures: {volume.publishedStructures.join(", ")}. {volume.admissionNote}</small>
            <a href={volume.openOrganelleUrl} target="_blank" rel="noreferrer">Open the source volume in OpenOrganelle ↗</a>
          </article>
        ))}
        <div className="open-em-search-boundary" role="note">
          <strong>Metadata route verified; source-local image/label payload not imported</strong>
          <p>{openMouseSpinalFibsemNearMissAudit.admission.interpretation} Raw volumes downloaded: {openMouseSpinalFibsemNearMissAudit.admission.rawVolumesDownloaded}; interneuron or organelle objects admitted: {openMouseSpinalFibsemNearMissAudit.admission.interneuronObjectsAdmitted + openMouseSpinalFibsemNearMissAudit.admission.organelleObjectsAdmitted}.</p>
        </div>
      </section>
      <div className="open-em-search-boundary" role="note">
        <strong>Search completion is not a dataset-absence claim</strong>
        <p>{audit.admission.interpretation} No images, volumes or masks were downloaded. No voxel stack, segmentation, exact interneuron object ID, same-cell join, atlas registration or measurement is available to the selected cell.</p>
      </div>
      <nav aria-label="UPG-243 open EM search sources">
        {audit.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}
      </nav>
    </details>
  );
}
