"use client";

import { useMemo } from "react";
import { publicDataCatalog, publicSourceReleaseAdmissionService } from "./atlas-types";
import { admissionReviewReceiptFilename, evaluatePublicSourceAdmissionManifest } from "./public-source-release-admission.js";

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

export default function PublicSourceReleaseAdmissionReview({
  manifest,
  onNotice,
}: {
  manifest: unknown;
  onNotice: (notice: string) => void;
}) {
  const preview = useMemo(() => evaluatePublicSourceAdmissionManifest({
    manifest,
    catalog: publicDataCatalog,
    contract: publicSourceReleaseAdmissionService,
    generatedAt: "LOCAL_PREVIEW_NOT_EXPORTED",
  }), [manifest]);
  const exportReceipt = () => {
    const receipt = evaluatePublicSourceAdmissionManifest({
      manifest,
      catalog: publicDataCatalog,
      contract: publicSourceReleaseAdmissionService,
      generatedAt: new Date().toISOString(),
    });
    downloadJson(receipt, admissionReviewReceiptFilename(receipt));
    onNotice("Not-admitted source review exported · no source object acquired, bundled, or registered");
  };
  return <section className="source-admission-review" aria-labelledby="source-admission-review-heading">
    <div className="source-admission-review-heading">
      <div>
        <span>UPG-006 · RELEASE-ADMISSION REVIEW</span>
        <h5 id="source-admission-review-heading">Metadata complete is not data admission</h5>
      </div>
      <span className="badge inferred">NOT ADMITTED · 0 REG</span>
    </div>
    <p>This deterministic local review checks a supplied metadata manifest against frozen catalogue rules. It cannot authenticate the publisher record, authorize reuse, or obtain the source object.</p>
    <dl className="admission-review-summary">
      <div><dt>Manifest</dt><dd>{preview.manifest.manifestId} · {preview.manifest.formatVersion}</dd></div>
      <div><dt>Catalogue source</dt><dd>{preview.publicSource.sourceId}</dd></div>
      <div><dt>Declared objects</dt><dd>{preview.manifest.declaredFileCount} metadata records · 0 acquired</dd></div>
      <div><dt>Decision</dt><dd>{humanize(preview.admissionDecision)}</dd></div>
    </dl>
    <div className="admission-review-checks" aria-live="polite">
      <strong>REQUIRED REVIEW CHECKS</strong>
      <ul>{preview.checks.map((check) => <li key={check.id} className={check.status}><code>{humanize(check.id)}</code><span>{humanize(check.status)}</span><small>{check.detail}</small></li>)}</ul>
    </div>
    <div className="admission-review-boundary" role="note">
      <strong>BLOCKED IN THIS BUILD</strong>
      <p>{preview.blockedActions.map(humanize).join(" · ")}</p>
    </div>
    <div className="catalog-actions"><button type="button" onClick={exportReceipt}>Export not-admitted review receipt</button></div>
    <p className="taxonomy-boundary">{preview.scientificBoundary}</p>
  </section>;
}
