"use client";

import { useMemo, useState } from "react";
import { publicDataCatalog, publicSourceAssertionProvenance, publicSourceAuthorizationPlan, publicSourceIndependentAuthorizationEvidence } from "./atlas-types";
import { buildIndependentAuthorizationEvidencePacket, independentAuthorizationEvidencePacketFilename } from "./public-source-independent-authorization-evidence.js";

type Manifest = { formatVersion: string; manifestId: string; sourceId: string; files: Array<{ id: string; stableName: string; sourceUrl: string; sourceChecksum?: { algorithm: string; value: string }; localSha256?: string | null }> };
const date = () => new Date().toISOString().slice(0, 10);
const humanize = (value: string) => value.replaceAll("_", " ");
function download(value: unknown, filename: string) { const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 0); }

export default function PublicSourceIndependentAuthorizationEvidence({ manifest, onNotice }: { manifest: Manifest; onNotice: (notice: string) => void }) {
  const format = useMemo(() => publicSourceIndependentAuthorizationEvidence.supportedManifestFormats.find((item) => item.formatVersion === manifest.formatVersion && item.sourceId === manifest.sourceId) ?? null, [manifest.formatVersion, manifest.sourceId]);
  const [fileId, setFileId] = useState(manifest.files[0]?.id ?? "");
  const [planId, setPlanId] = useState("");
  const [objectVersion, setObjectVersion] = useState("");
  const [reviewerRole, setReviewerRole] = useState("institutional_rights_reviewer");
  const [reviewerId, setReviewerId] = useState("");
  const [evidenceState, setEvidenceState] = useState("review_request_prepared");
  const [scope, setScope] = useState("private_curator_review_only");
  const [locatorKind, setLocatorKind] = useState("institutional_decision_reference");
  const [locator, setLocator] = useState("");
  const [curatorId, setCuratorId] = useState("");
  const [reviewDate, setReviewDate] = useState(date);
  const packetId = "PAE-" + manifest.manifestId.replace(/^PFM-/, "") + "-" + reviewDate;
  const candidate = useMemo(() => ({ packetId, planId, fileId, objectVersion, reviewerRole, reviewerId, evidenceState, scope, locatorKind, locator, curatorId, reviewDate }), [curatorId, evidenceState, fileId, locator, locatorKind, objectVersion, packetId, planId, reviewDate, reviewerId, reviewerRole, scope]);
  const result = useMemo(() => buildIndependentAuthorizationEvidencePacket({ manifest, packet: candidate, catalog: publicDataCatalog, assertionContract: publicSourceAssertionProvenance, authorizationPlanContract: publicSourceAuthorizationPlan, contract: publicSourceIndependentAuthorizationEvidence, generatedAt: "LOCAL_PREVIEW_NOT_EXPORTED" }), [candidate, manifest]);
  const exportPacket = () => {
    if (!result.packet) { onNotice("Evidence-packet export blocked · resolve every independent-review field first"); return; }
    const packet = buildIndependentAuthorizationEvidencePacket({ manifest, packet: candidate, catalog: publicDataCatalog, assertionContract: publicSourceAssertionProvenance, authorizationPlanContract: publicSourceAuthorizationPlan, contract: publicSourceIndependentAuthorizationEvidence, generatedAt: new Date().toISOString() }).packet;
    if (!packet) return; download(packet, independentAuthorizationEvidencePacketFilename(packet)); onNotice("Independent evidence packet exported · no authority decision or execution is authenticated");
  };
  return <section className="independent-evidence-packet" aria-labelledby="independent-evidence-packet-heading">
    <div className="independent-evidence-packet-heading"><div><span>UPG-020 · INDEPENDENT EVIDENCE PACKET</span><h5 id="independent-evidence-packet-heading">Prepare the review request; do not execute the request</h5></div><span className="badge inferred">DRAFT ONLY · 0 REG</span></div>
    <p>Prepare a local packet for an independent rights or data-steward review. It records who should review which declared object and terms; it does not authenticate their decision, authorize access, retrieve a file, or retain data.</p>
    {!format ? <p className="taxonomy-boundary">This imported manifest is outside the two frozen metadata formats supported by UPG-020.</p> : <><div className="independent-evidence-packet-grid">
      <label>Declared unacquired object<select value={fileId} onChange={(event) => setFileId(event.target.value)}>{manifest.files.map((file) => <option key={file.id} value={file.id}>{file.id} · {file.stableName}</option>)}</select></label>
      <label>Linked authorization-plan ID<input value={planId} onChange={(event) => setPlanId(event.target.value)} placeholder="PAV-…-YYYY-MM-DD" /></label>
      <label>Declared object version<input value={objectVersion} onChange={(event) => setObjectVersion(event.target.value)} placeholder="Publisher version or release label" /></label>
      <label>Review date<input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /></label>
      <label>Local curator ID<input value={curatorId} onChange={(event) => setCuratorId(event.target.value)} placeholder="Exported only to your browser" /></label>
      <label>Requested execution scope<select value={scope} onChange={(event) => setScope(event.target.value)}>{publicSourceIndependentAuthorizationEvidence.requestedExecutionScopes.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select></label>
    </div><div className="independent-evidence-packet-grid">
      <label>Independent reviewer role<select value={reviewerRole} onChange={(event) => setReviewerRole(event.target.value)}>{publicSourceIndependentAuthorizationEvidence.independentReviewerRoles.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select></label>
      <label>Reviewer identifier<input value={reviewerId} onChange={(event) => setReviewerId(event.target.value)} placeholder="Role, office, or contact reference" disabled={reviewerRole === "unresolved"} /></label>
      <label>Evidence record state<select value={evidenceState} onChange={(event) => setEvidenceState(event.target.value)}>{publicSourceIndependentAuthorizationEvidence.evidenceRecordStates.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select></label>
      <label>Evidence locator kind<select value={locatorKind} onChange={(event) => setLocatorKind(event.target.value)}>{publicSourceIndependentAuthorizationEvidence.evidenceLocatorKinds.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select></label>
      <label>Evidence locator<input value={locator} onChange={(event) => setLocator(event.target.value)} placeholder={locatorKind.includes("url") ? "https://…" : "Decision reference or curator note"} /></label>
    </div><dl className="independent-evidence-packet-summary"><div><dt>Packet ID</dt><dd>{packetId}</dd></div><div><dt>Authority</dt><dd>Not authenticated by this packet</dd></div><div><dt>Execution</dt><dd>Not executed</dd></div><div><dt>Source object</dt><dd>0 acquired · 0 retained</dd></div></dl>
    <div className="independent-evidence-packet-stages"><strong>REQUIRED INDEPENDENT REVIEW STAGES</strong><ol>{format.requiredReviewStageIds.map((id) => <li key={id}>{humanize(id)} <span>planned, not executed</span></li>)}</ol></div>
    <div className="independent-evidence-packet-validation" aria-live="polite"><strong>{result.errors.length ? "EXPORT BLOCKED" : "READY FOR LOCAL EVIDENCE-PACKET EXPORT"}</strong>{result.errors.length ? <ul>{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>The export is a review request only. It does not authenticate approval, store credentials, acquire a source object, calculate a local checksum, inspect content, retain data, or create registration.</p>}</div>
    <div className="independent-evidence-packet-boundary" role="note"><strong>BLOCKED IN THIS BUILD</strong><p>{publicSourceIndependentAuthorizationEvidence.nonPromotion.blockedActions.map(humanize).join(" · ")}</p></div>
    <div className="catalog-actions"><button type="button" onClick={exportPacket} disabled={!result.packet}>Export independent evidence packet</button></div></>}
  </section>;
}
