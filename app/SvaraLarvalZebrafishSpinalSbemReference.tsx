"use client";

import { useState } from "react";
import { svaraLarvalZebrafishSpinalSbemReference } from "./atlas-types";
import { SVARA_CATALOGUES } from "./svara-catalogues.js";
import SvaraCatalogueGallery from "./SvaraCatalogueGallery";
import "./svara-catalogues.css";

export default function SvaraLarvalZebrafishSpinalSbemReference() {
  const reference = svaraLarvalZebrafishSpinalSbemReference;
  const scope = reference.biologicalScope;
  const acquisition = reference.acquisition;
  const coverage = acquisition.segmentCoverage;
  const reconstructions = reference.publishedReconstructions;
  const boundary = reference.identityAndGeometryBoundary;
  const [open, setOpen] = useState(false);

  return (
    <details className="svara-sbem-reference-card svara-catalogue-card" id="svara-supplement-reference" onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>
        <div><span>UPG-240 · COMPARATIVE SPINAL SBEM · LARVAL ZEBRAFISH</span><strong>Source-reported CiD / CoBL circuit · not mouse-cell geometry</strong></div>
        <em>212 ORIGINAL PAGE ENTRIES · 0 EDITABLE MODELS</em>
      </summary>
      <p>{scope.species} · {scope.lifeStage} · one larva · {acquisition.modality}. The source volume is {acquisition.reportedVolumeLengthMicrometre.join(" × ")} μm at a reported {acquisition.reportedVoxelPitchNanometre.join(" × ")} nm voxel pitch. It contains {coverage.fullyContainedSegments} complete segments, {coverage.adjacentSegmentCoveragePercent[0].coveragePercent}% of the rostral and {coverage.adjacentSegmentCoveragePercent[1].coveragePercent}% of the caudal adjoining segment, and {coverage.somataInVolume.toLocaleString()} somata.</p>
      <ul aria-label="Source-reported reconstruction counts">
        <li>{reconstructions.motoneurons.count} motoneurons · {reconstructions.motoneurons.leftHemisegment} left / {reconstructions.motoneurons.rightHemisegment} right</li>
        <li>{reconstructions.morphologyConsistentCiDs.count} cells with morphology consistent with CiD among {reconstructions.morphologyConsistentCiDs.completelyTracedCellContext} completely traced cells</li>
        <li>{reconstructions.CoBLs.count} source-reported CoBL reconstructions</li>
      </ul>
      <div className="svara-sbem-boundary" role="note">
        <strong>UPG-250 · Three exact official ZIPs inspected</strong>
        <p>The three archives contain one PDF catalogue each: 139 MN, 39 CiD and 34 CoBL entries. Published archive sizes and MD5 checksums match; archive and PDF SHA-256 receipts are retained. All 212 pages were inspected for native labels and source-reported values. {boundary.appAdmittedSkeletons} editable skeletons, {boundary.appAdmittedMeshes} meshes and {boundary.appAdmittedSynapseEdges} synapse edges are admitted. Zebrafish identities or coordinates are not transferred to mouse records.</p>
        <span>The exact article license and explicit publisher supplementary-data policy support these three catalogue references. This basis does not establish reuse rights for separate repositories or the Koh annotation version.</span>
      </div>
      {open && <SvaraCatalogueGallery />}
      <a href="/catalogues/svara">Open the catalogue workspace</a>
      <p><a href="/connectivity/svara">Explore 734 original synaptic contact rows</a> from four separate official spreadsheets; source-local numeric pairs do not establish XYZ endpoints or the Koh annotation version.</p>
      <p className="svara-sbem-next-gate"><strong>UPG-250 / UPG-260 · Remaining reconstruction gate:</strong> obtain actual source geometry and physical object mappings, frames and reconstruction completeness before editable reconstruction or endpoint-level wiring is admitted.</p>
      <nav className="svara-sbem-package-links" aria-label="Official Svara supplementary ZIP package links">
        {SVARA_CATALOGUES.catalogues.map((item, index) => (
          <a key={item.fileComponentId} href={item.sourceArchiveUrl} target="_blank" rel="noreferrer" data-testid={`svara-package-${index + 6}`}>
            Official archive · mmc{index + 6} ZIP · {item.archiveName} ↗
          </a>
        ))}
      </nav>
      <nav aria-label="Svara comparative spinal SBEM source links">
        {reference.sources.slice(0, 3).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}
      </nav>
    </details>
  );
}
