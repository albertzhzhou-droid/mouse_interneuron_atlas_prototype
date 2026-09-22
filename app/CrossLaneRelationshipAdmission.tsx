"use client";

import { useMemo, useState } from "react";
import {
  crossLaneRelationshipAdmission,
  evidenceProvenanceTrace,
  publicDataCatalog,
  researchMvpRelease,
} from "./atlas-types";
import {
  buildCrossLaneRelationshipProposal,
  crossLaneRelationshipProposalFilename,
  relationshipAdmissionKinds,
} from "./cross-lane-relationship-admission.js";

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export default function CrossLaneRelationshipAdmission({
  entityId,
  sourceId,
  onNotice,
}: {
  entityId: string | null;
  sourceId: string | null;
  onNotice: (notice: string) => void;
}) {
  const relationKinds = useMemo(() => relationshipAdmissionKinds(crossLaneRelationshipAdmission), []);
  const [relationKindId, setRelationKindId] = useState(relationKinds[0].id);
  const [curatorQuestion, setCuratorQuestion] = useState("");
  const entity = researchMvpRelease.entities.find((item) => item.id === entityId) ?? researchMvpRelease.entities[0] ?? null;
  const source = publicDataCatalog.sources.find((item) => item.id === sourceId) ?? publicDataCatalog.sources[0] ?? null;
  const relationKind = relationKinds.find((item) => item.id === relationKindId) ?? relationKinds[0];
  const proposal = entity && source
    ? buildCrossLaneRelationshipProposal({
      entityId: entity.id,
      sourceId: source.id,
      relationKindId: relationKind.id,
      curatorQuestion,
      contract: crossLaneRelationshipAdmission,
      researchRelease: researchMvpRelease,
      catalog: publicDataCatalog,
      traceContract: evidenceProvenanceTrace,
      generatedAt: "LOCAL_PREVIEW_NOT_EXPORTED",
    })
    : null;
  const exportProposal = () => {
    if (!entity || !source) return;
    const exported = buildCrossLaneRelationshipProposal({
      entityId: entity.id,
      sourceId: source.id,
      relationKindId: relationKind.id,
      curatorQuestion,
      contract: crossLaneRelationshipAdmission,
      researchRelease: researchMvpRelease,
      catalog: publicDataCatalog,
      traceContract: evidenceProvenanceTrace,
      generatedAt: new Date().toISOString(),
    });
    downloadJson(exported, crossLaneRelationshipProposalFilename(exported));
    onNotice("Not-admitted relationship proposal exported · no source object acquired and no REG created");
  };

  return <section className="relationship-admission" aria-labelledby="relationship-admission-heading">
    <div className="relationship-admission-heading">
      <div>
        <span>UPG-017 · CROSS-LANE ADMISSION GATE</span>
        <h4 id="relationship-admission-heading">Describe the missing evidence; do not create the edge</h4>
      </div>
      <span className="badge inferred">NOT ADMITTED · 0 REG</span>
    </div>
    <p>This local composer produces an incomplete curator-review record for a possible future relationship. It cannot connect the two provenance lanes in this build.</p>
    {entity && source && proposal ? <>
      <dl className="relationship-targets">
        <div><dt>Frozen research record</dt><dd>{entity.id} · synthetic evidence entity</dd></div>
        <div><dt>Frozen public-source record</dt><dd>{source.id} · {source.title}</dd></div>
        <div><dt>Source object in this package</dt><dd>Not identified or acquired</dd></div>
      </dl>
      <div className="relationship-admission-controls">
        <label>
          Candidate relationship type
          <select value={relationKind.id} onChange={(event) => setRelationKindId(event.target.value)}>
            {relationKinds.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}
          </select>
        </label>
        <label>
          Curator question (optional; not evidence)
          <textarea value={curatorQuestion} maxLength={600} onChange={(event) => setCuratorQuestion(event.target.value)} placeholder="State the admission question without asserting a relationship." />
        </label>
      </div>
      <div className="relationship-boundary" role="note">
        <strong>RELATION-SPECIFIC BOUNDARY</strong>
        <p>{relationKind.boundary}</p>
      </div>
      <div className="relationship-blockers">
        <div>
          <span>ADMISSION STATUS</span>
          <strong>Not admitted — required evidence is absent from this package</strong>
        </div>
        <ul>{proposal.evidenceReadiness.map((item) => <li key={item.id}><code>{humanize(item.id)}</code><span>{humanize(item.status)}</span></li>)}</ul>
      </div>
      <div className="catalog-actions">
        <button type="button" onClick={exportProposal}>Export not-admitted proposal</button>
      </div>
      <p className="taxonomy-boundary">{crossLaneRelationshipAdmission.nonPromotionPolicy}</p>
    </> : <p className="catalog-empty">No frozen research entity or public source is available for a proposal.</p>}
  </section>;
}
