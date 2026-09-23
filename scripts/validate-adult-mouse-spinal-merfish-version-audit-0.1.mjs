#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AUDIT_PATH = path.join(ROOT, "data/adult-mouse-spinal-merfish-version-audit-0.1.json");

export function validateAdultMouseSpinalMerfishVersionAudit(audit) {
  assert.equal(audit.auditId, "adult-mouse-spinal-merfish-zenodo-version-audit-0.1.0");
  assert.equal(audit.auditDate, "2026-09-22");
  assert.equal(audit.candidateLineage.status, "unverified");
  assert.equal(audit.candidateLineage.doNotMerge, true);
  assert.equal(audit.records.length, 2);

  const [earlier, later] = audit.records;
  assert.equal(earlier.recordId, "18039571");
  assert.equal(earlier.displayedVersion, null);
  assert.equal(earlier.lineageRole, "candidate_earlier_record_unverified");
  assert.deepEqual(earlier.files.map(({ fileName, publishedMd5, exactBytes }) => ({ fileName, publishedMd5, exactBytes })), [
    { fileName: "MERFISH_spinal_cord_resolved_0718.h5ad", publishedMd5: "ce06f62c0ec4973581dae17bb76f0cd9", exactBytes: null },
    { fileName: "SNI_merged_0917.h5ad", publishedMd5: "7e90a801ee57b8fec06cd03c8630f01b", exactBytes: null },
  ]);

  assert.equal(later.recordId, "20533289");
  assert.equal(later.displayedVersion, "v2");
  assert.equal(later.lineageRole, "later_version_label_observed_lineage_still_unverified");
  assert.deepEqual(later.files.map(({ fileName, publishedMd5, exactBytes }) => ({ fileName, publishedMd5, exactBytes })), [
    { fileName: "MERFISH_spinal_cord_0531.h5ad", publishedMd5: "e7328d8bda2fb4b390cb107340ac4c83", exactBytes: 98970246 },
    { fileName: "SNI_merged_0531.h5ad", publishedMd5: "6ee6195c7f958f07172172963fef8d20", exactBytes: 115901575 },
  ]);

  assert.equal(audit.contextualEvidence.earlierRecordSectionCount.value, 18);
  assert.equal(audit.contextualEvidence.earlierRecordSectionCount.notYetReconciledWith, "the 108 section IDs reported in the existing UPG-152 audit of the 20533289 H5AD");
  assert.equal(audit.contextualEvidence.sourceStudy.imagingZPlanesReportedInArticle, 7);
  assert.equal(audit.admission.sourceH5adsDownloaded, false);
  assert.equal(audit.admission.versionLineageConfirmed, false);
  assert.equal(audit.admission.dataDeltaCompared, false);
  assert.equal(audit.admission.fileRightsCleared, false);
  assert.equal(audit.admission.payloadsBundled, 0);
  assert.equal(audit.admission.crossVersionJoins, 0);
  assert.equal(audit.admission.interneuronDenominatorAsserted, false);
  assert.equal(audit.admission.zRegistration, 0);
  assert.equal(audit.admission.cellMorphology, 0);
  assert.equal(audit.admission.membranes, 0);
  assert.equal(audit.admission.internalObjects, 0);
  assert.equal(audit.admission.atlasRegistrations, 0);
  assert.equal(audit.references.length, 5);

  return {
    auditId: audit.auditId,
    records: audit.records.map((record) => record.recordId),
    laterDisplayedVersion: later.displayedVersion,
    versionLineageConfirmed: audit.admission.versionLineageConfirmed,
    dataDeltaCompared: audit.admission.dataDeltaCompared,
    bundledPayloadCount: audit.admission.payloadsBundled,
    geometryCount: audit.admission.cellMorphology + audit.admission.membranes + audit.admission.internalObjects,
  };
}

export async function loadAdultMouseSpinalMerfishVersionAudit() {
  const audit = JSON.parse(await readFile(AUDIT_PATH, "utf8"));
  return { audit, summary: validateAdultMouseSpinalMerfishVersionAudit(audit) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadAdultMouseSpinalMerfishVersionAudit()
    .then(({ summary }) => console.log(JSON.stringify(summary)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
