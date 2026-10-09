#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/mouse-spinal-em-repository-search-audit-0.1.json");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export async function validateMouseSpinalEmRepositorySearchAudit(override = null) {
  const audit = override ?? JSON.parse(await readFile(AUDIT_PATH, "utf8"));
  check(audit.schemaVersion === "0.1.0" && audit.auditId === "mouse-spinal-em-repository-search-audit-0.1" && audit.researchUpgradeId === "UPG-243", "UPG-243 bounded-search identity changed");
  check(audit.auditDate === "2026-09-23", "UPG-243 search date changed");
  check(audit.repositoryQueries.length === 4, "UPG-243 must preserve all four bounded repository queries");
  const empiar = audit.repositoryQueries.find((query) => query.repository === "EMPIAR");
  const emdb = audit.repositoryQueries.find((query) => query.repository === "EMDB");
  const biaQueries = audit.repositoryQueries.filter((query) => query.repository === "BioImage Archive");
  check(empiar?.query === "mouse spinal cord" && empiar.resultCount === 0 && empiar.searchedEntryCount === 3119, "EMPIAR filtered-result receipt changed");
  check(emdb?.query === "mouse spinal cord" && emdb.resultCount === 0, "EMDB no-entry query receipt changed");
  check(biaQueries.length === 2 && biaQueries.some((query) => query.resultCount === 2692) && biaQueries.some((query) => query.resultCount === 889)
    && biaQueries.every((query) => /first 20 visible results/.test(query.resultScope)), "BioImage Archive fuzzy-search scope changed");
  const sensory = audit.reviewedCandidateRecords.find((record) => record.accession === "S-BSST609");
  const nuclei = audit.reviewedCandidateRecords.find((record) => record.accession === "S-BIAD2822");
  check(sensory?.observedStudyLicense === "CC0" && JSON.stringify(sensory.observedFileFormats) === JSON.stringify(["TIFF", "CZI", "LSM", "LIFF"])
    && /no serial EM volume/.test(sensory.exclusion), "S-BSST609 sensory-imaging exclusion changed");
  check(nuclei?.observedStudyLicense === "CC-BY-4.0" && /one breast-cancer-cell nucleus/.test(nuclei.observedSegmentationScope ?? "")
    && /no spinal cord or interneuron/.test(nuclei.observedSegmentationScope ?? ""), "S-BIAD2822 methods-only exclusion changed");
  check(audit.admission.eligibleMouseSpinalInterneuronObjectRoutes === 0 && audit.admission.volumePayloadsDownloaded === 0
    && audit.admission.downloadedPayloadBytes === 0 && audit.admission.voxelVolumesAdmitted === 0
    && audit.admission.segmentationObjectsAdmitted === 0 && audit.admission.stableInterneuronObjectCrosswalksAdmitted === 0
    && audit.admission.sameCellJoins === 0 && audit.admission.atlasRegistrations === 0 && audit.admission.biologicalMeasurements === 0,
  "UPG-243 must not admit any volume, segmentation, object identity or downstream geometry");
  check(/bounded query and candidate screen/.test(audit.admission.interpretation) && /not establish that no qualifying record exists elsewhere/.test(audit.admission.interpretation), "UPG-243 must not claim universal absence");
  check(audit.sources.length >= 5 && audit.sources.every((source) => /^https:\/\//.test(source.url)), "UPG-243 official repository source links are incomplete");
  check(!("volumes" in audit) && !("segmentations" in audit) && !("geometry" in audit), "UPG-243 link-only audit cannot bundle scientific payloads");
  return {
    auditId: audit.auditId,
    repositoryQueries: audit.repositoryQueries.length,
    reviewedCandidates: audit.reviewedCandidateRecords.length,
    eligibleMouseSpinalInterneuronObjectRoutes: audit.admission.eligibleMouseSpinalInterneuronObjectRoutes,
    downloadedPayloadBytes: audit.admission.downloadedPayloadBytes,
    admittedSegmentationObjects: audit.admission.segmentationObjectsAdmitted,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateMouseSpinalEmRepositorySearchAudit()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
