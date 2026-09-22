"use client";

import { useMemo, useState } from "react";
import { publicDataCatalog, publicSourceAssertionProvenance, publicSourceReleaseAdmissionService } from "./atlas-types";
import { assertionProvenanceReceiptFilename, buildPublicSourceAssertionProvenanceReceipt } from "./public-source-assertion-provenance.js";

type ImportedManifest = {
  formatVersion: string;
  manifestId: string;
  sourceId: string;
  files: Array<{ id: string; stableName: string; sourceUrl: string }>;
};

function localDate() {
  return new Date().toISOString().slice(0, 10);
}

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

export default function PublicSourceAssertionProvenance({
  manifest,
  onNotice,
}: {
  manifest: ImportedManifest;
  onNotice: (notice: string) => void;
}) {
  const supportedFormat = useMemo(
    () => publicSourceReleaseAdmissionService.supportedManifestFormats.find((format) => format.formatVersion === manifest.formatVersion && format.sourceId === manifest.sourceId) ?? null,
    [manifest.formatVersion, manifest.sourceId],
  );
  const [checkId, setCheckId] = useState("manifest_identity");
  const [sourceState, setSourceState] = useState("publisher_asserted");
  const [subjectKind, setSubjectKind] = useState("unknown_source_object");
  const [subjectReference, setSubjectReference] = useState("unknown");
  const [evidenceLocatorKind, setEvidenceLocatorKind] = useState("source_metadata_field");
  const [evidenceLocator, setEvidenceLocator] = useState("");
  const [assertedValue, setAssertedValue] = useState("");
  const [curatorId, setCuratorId] = useState("");
  const [reviewDate, setReviewDate] = useState(localDate);
  const assertionId = `PSA-${manifest.manifestId.replace(/^PFM-/, "")}-${reviewDate}`;
  const candidate = useMemo(() => ({
    assertionId,
    checkId,
    sourceState,
    subjectKind,
    subjectReference,
    evidenceLocatorKind,
    evidenceLocator,
    assertedValue,
    curatorId,
    reviewDate,
  }), [assertedValue, assertionId, checkId, curatorId, evidenceLocator, evidenceLocatorKind, reviewDate, sourceState, subjectKind, subjectReference]);
  const result = useMemo(() => buildPublicSourceAssertionProvenanceReceipt({
    manifest,
    assertion: candidate,
    catalog: publicDataCatalog,
    admissionService: publicSourceReleaseAdmissionService,
    contract: publicSourceAssertionProvenance,
    generatedAt: "LOCAL_PREVIEW_NOT_EXPORTED",
  }), [candidate, manifest]);
  const selectSubjectKind = (next: string) => {
    setSubjectKind(next);
    setSubjectReference(next === "unknown_source_object" ? "unknown" : manifest.files[0]?.id ?? "");
  };
  const exportReceipt = () => {
    if (!result.receipt) {
      onNotice("Assertion export blocked · resolve every provenance field first");
      return;
    }
    const exported = buildPublicSourceAssertionProvenanceReceipt({
      manifest,
      assertion: candidate,
      catalog: publicDataCatalog,
      admissionService: publicSourceReleaseAdmissionService,
      contract: publicSourceAssertionProvenance,
      generatedAt: new Date().toISOString(),
    }).receipt;
    if (!exported) return;
    downloadJson(exported, assertionProvenanceReceiptFilename(exported));
    onNotice("Assertion provenance exported · declared metadata remains unverified and not admitted");
  };

  return <section className="assertion-provenance" aria-labelledby="assertion-provenance-heading">
    <div className="assertion-provenance-heading">
      <div><span>UPG-018 · ASSERTION PROVENANCE</span><h5 id="assertion-provenance-heading">Record who says what; do not admit the object</h5></div>
      <span className="badge inferred">UNVERIFIED · 0 REG</span>
    </div>
    <p>Make one local provenance statement about a required metadata check. This creates an auditable curator record, not a verified publisher fact, rights decision, data acquisition, or scientific claim.</p>
    {!supportedFormat ? <p className="taxonomy-boundary">This imported manifest is outside the two frozen metadata formats supported by UPG-018.</p> : <>
      <div className="assertion-provenance-grid">
        <label>Required check<select value={checkId} onChange={(event) => setCheckId(event.target.value)}>{supportedFormat.requiredChecks.map((id) => <option key={id} value={id}>{humanize(id)}</option>)}</select></label>
        <label>Source state<select value={sourceState} onChange={(event) => setSourceState(event.target.value)}>{publicSourceAssertionProvenance.assertionSourceStates.map((state) => <option key={state} value={state}>{humanize(state)}</option>)}</select></label>
        <label>Review date<input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /></label>
        <label>Local curator ID<input value={curatorId} onChange={(event) => setCuratorId(event.target.value)} placeholder="Local reviewer alias; exported only to your browser" /></label>
      </div>
      <div className="assertion-provenance-grid">
        <label>Assertion subject<select value={subjectKind} onChange={(event) => selectSubjectKind(event.target.value)}>{publicSourceAssertionProvenance.subjectKinds.map((kind) => <option key={kind} value={kind}>{humanize(kind)}</option>)}</select></label>
        {subjectKind === "declared_unacquired_source_object" ? <label>Declared object<select value={subjectReference} onChange={(event) => setSubjectReference(event.target.value)}>{manifest.files.map((file) => <option key={file.id} value={file.id}>{file.id} · {file.stableName}</option>)}</select></label> : <label>Subject reference<input readOnly value="unknown" /></label>}
        <label>Evidence locator kind<select value={evidenceLocatorKind} onChange={(event) => setEvidenceLocatorKind(event.target.value)}>{publicSourceAssertionProvenance.evidenceLocatorKinds.map((kind) => <option key={kind} value={kind}>{humanize(kind)}</option>)}</select></label>
        <label>Evidence locator<input value={evidenceLocator} onChange={(event) => setEvidenceLocator(event.target.value)} placeholder={evidenceLocatorKind.includes("url") ? "https://…" : "Publisher metadata field or curator note"} /></label>
      </div>
      <label className="assertion-provenance-value">Asserted metadata value or explicit unresolved value<textarea value={assertedValue} onChange={(event) => setAssertedValue(event.target.value)} placeholder="For example: Publisher declares SHA-256 in file metadata; not locally verified." /></label>
      <dl className="assertion-provenance-summary"><div><dt>Assertion ID</dt><dd>{assertionId}</dd></div><div><dt>Verification</dt><dd>Not locally verified</dd></div><div><dt>Admission</dt><dd>Not admitted pending curator object and rights review</dd></div><div><dt>Source object</dt><dd>0 acquired · 0 bundled</dd></div></dl>
      <div className="assertion-provenance-validation" aria-live="polite"><strong>{result.errors.length ? "EXPORT BLOCKED" : "READY FOR LOCAL PROVENANCE EXPORT"}</strong>{result.errors.length ? <ul>{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>The exported assertion preserves its subject, evidence locator, source state, reviewer activity, and typed scope. It remains unverified, not admitted, and at 0 REG.</p>}</div>
      <div className="assertion-provenance-boundary" role="note"><strong>BLOCKED IN THIS BUILD</strong><p>{publicSourceAssertionProvenance.nonPromotion.blockedActions.map(humanize).join(" · ")}</p></div>
      <div className="catalog-actions"><button type="button" onClick={exportReceipt} disabled={!result.receipt}>Export assertion provenance</button></div>
    </>}
  </section>;
}
