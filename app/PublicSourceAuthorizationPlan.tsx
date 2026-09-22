"use client";

import { useMemo, useState } from "react";
import { publicDataCatalog, publicSourceAssertionProvenance, publicSourceAuthorizationPlan, publicSourceReleaseAdmissionService } from "./atlas-types";
import { authorizationPlanFilename, buildPublicSourceAuthorizationPlan } from "./public-source-authorization-plan.js";

type ImportedManifest = {
  formatVersion: string;
  manifestId: string;
  sourceId: string;
  files: Array<{ id: string; stableName: string; sourceUrl: string; sourceChecksum?: { algorithm: string; value: string }; localSha256?: string | null }>;
};

function localDate() { return new Date().toISOString().slice(0, 10); }
function humanize(value: string) { return value.replaceAll("_", " "); }
function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function PublicSourceAuthorizationPlan({ manifest, onNotice }: { manifest: ImportedManifest; onNotice: (notice: string) => void }) {
  const supportedFormat = useMemo(() => publicSourceAuthorizationPlan.supportedManifestFormats.find((format) => format.formatVersion === manifest.formatVersion && format.sourceId === manifest.sourceId) ?? null, [manifest.formatVersion, manifest.sourceId]);
  const [subjectReference, setSubjectReference] = useState(manifest.files[0]?.id ?? "");
  const [linkedAssertionId, setLinkedAssertionId] = useState("");
  const [objectVersion, setObjectVersion] = useState("");
  const [intendedUseScope, setIntendedUseScope] = useState("private_curator_review_only");
  const [requestedRightsDisposition, setRequestedRightsDisposition] = useState("unresolved");
  const [evidenceLocatorKind, setEvidenceLocatorKind] = useState("rights_statement_url");
  const [evidenceLocator, setEvidenceLocator] = useState("");
  const [contentScopeDescription, setContentScopeDescription] = useState("");
  const [curatorId, setCuratorId] = useState("");
  const [reviewDate, setReviewDate] = useState(localDate);
  const caseId = `PAV-${manifest.manifestId.replace(/^PFM-/, "")}-${reviewDate}`;
  const candidate = useMemo(() => ({ caseId, linkedAssertionId, subjectReference, objectVersion, intendedUseScope, requestedRightsDisposition, evidenceLocatorKind, evidenceLocator, contentScopeDescription, curatorId, reviewDate }), [caseId, contentScopeDescription, curatorId, evidenceLocator, evidenceLocatorKind, intendedUseScope, linkedAssertionId, objectVersion, requestedRightsDisposition, reviewDate, subjectReference]);
  const result = useMemo(() => buildPublicSourceAuthorizationPlan({ manifest, plan: candidate, catalog: publicDataCatalog, admissionService: publicSourceReleaseAdmissionService, assertionContract: publicSourceAssertionProvenance, contract: publicSourceAuthorizationPlan, generatedAt: "LOCAL_PREVIEW_NOT_EXPORTED" }), [candidate, manifest]);
  const exportPlan = () => {
    if (!result.plan) { onNotice("Authorization-plan export blocked · resolve every planning field first"); return; }
    const exported = buildPublicSourceAuthorizationPlan({ manifest, plan: candidate, catalog: publicDataCatalog, admissionService: publicSourceReleaseAdmissionService, assertionContract: publicSourceAssertionProvenance, contract: publicSourceAuthorizationPlan, generatedAt: new Date().toISOString() }).plan;
    if (!exported) return;
    downloadJson(exported, authorizationPlanFilename(exported));
    onNotice("Authorization plan exported · it grants no authorization and verifies no source object");
  };
  return <section className="authorization-plan" aria-labelledby="authorization-plan-heading">
    <div className="authorization-plan-heading"><div><span>UPG-019 · AUTHORIZATION PLAN</span><h5 id="authorization-plan-heading">Define the gate; do not acquire the object</h5></div><span className="badge inferred">PLAN ONLY · 0 REG</span></div>
    <p>Prepare a local, object-specific review plan. The receipt fixes the intended checks but does not grant permission, download a file, calculate a local hash, inspect content, or establish a scientific relationship.</p>
    {!supportedFormat ? <p className="taxonomy-boundary">This imported manifest is outside the two frozen metadata formats supported by UPG-019.</p> : <>
      <div className="authorization-plan-grid">
        <label>Declared unacquired object<select value={subjectReference} onChange={(event) => setSubjectReference(event.target.value)}>{manifest.files.map((file) => <option key={file.id} value={file.id}>{file.id} · {file.stableName}</option>)}</select></label>
        <label>Linked assertion ID<input value={linkedAssertionId} onChange={(event) => setLinkedAssertionId(event.target.value)} placeholder="PSA-…-YYYY-MM-DD" /></label>
        <label>Declared object version<input value={objectVersion} onChange={(event) => setObjectVersion(event.target.value)} placeholder="Publisher version or release label" /></label>
        <label>Review date<input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /></label>
        <label>Local curator ID<input value={curatorId} onChange={(event) => setCuratorId(event.target.value)} placeholder="Exported only to your browser" /></label>
        <label>Intended use<select value={intendedUseScope} onChange={(event) => setIntendedUseScope(event.target.value)}>{publicSourceAuthorizationPlan.intendedUseScopes.map((scope) => <option key={scope} value={scope}>{humanize(scope)}</option>)}</select></label>
      </div>
      <div className="authorization-plan-grid">
        <label>Requested rights disposition<select value={requestedRightsDisposition} onChange={(event) => setRequestedRightsDisposition(event.target.value)}>{publicSourceAuthorizationPlan.requestedRightsDispositions.map((disposition) => <option key={disposition} value={disposition}>{humanize(disposition)}</option>)}</select></label>
        <label>Rights evidence locator kind<select value={evidenceLocatorKind} onChange={(event) => setEvidenceLocatorKind(event.target.value)}>{publicSourceAuthorizationPlan.evidenceLocatorKinds.map((kind) => <option key={kind} value={kind}>{humanize(kind)}</option>)}</select></label>
        <label>Rights evidence locator<input value={evidenceLocator} onChange={(event) => setEvidenceLocator(event.target.value)} placeholder={evidenceLocatorKind.includes("url") ? "https://…" : "Metadata field or curator note"} /></label>
      </div>
      <label className="authorization-plan-value">Planned content scope<textarea value={contentScopeDescription} onChange={(event) => setContentScopeDescription(event.target.value)} placeholder="Describe exactly which contents would be reviewed after a separately authorized acquisition." /></label>
      <dl className="authorization-plan-summary"><div><dt>Plan ID</dt><dd>{caseId}</dd></div><div><dt>Authorization</dt><dd>Not authorized by this plan</dd></div><div><dt>Verification</dt><dd>Not locally verified</dd></div><div><dt>Actual source object</dt><dd>0 acquired · 0 inspected</dd></div></dl>
      <div className="authorization-plan-stages"><strong>REQUIRED PLANNED STAGES</strong><ol>{supportedFormat.requiredPlanStepIds.map((id) => <li key={id}>{humanize(id)} <span>planned, not executed</span></li>)}</ol></div>
      <div className="authorization-plan-validation" aria-live="polite"><strong>{result.errors.length ? "EXPORT BLOCKED" : "READY FOR LOCAL PLAN EXPORT"}</strong>{result.errors.length ? <ul>{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>The exported plan keeps the declared checksum for later comparison, but does not assert a local checksum, authorization decision, acquisition, content inspection, or registration.</p>}</div>
      <div className="authorization-plan-boundary" role="note"><strong>BLOCKED IN THIS BUILD</strong><p>{publicSourceAuthorizationPlan.nonPromotion.blockedActions.map(humanize).join(" · ")}</p></div>
      <div className="catalog-actions"><button type="button" onClick={exportPlan} disabled={!result.plan}>Export authorization plan</button></div>
    </>}
  </section>;
}
