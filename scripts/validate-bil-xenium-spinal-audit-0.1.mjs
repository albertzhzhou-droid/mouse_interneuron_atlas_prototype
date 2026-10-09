#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/bil-xenium-spinal-audit-0.1.json");
const EXPECTED_SAMPLE_FILES = new Map([
  ["cell_boundaries.parquet", 19951154],
  ["cells.parquet", 4328122],
  ["morphology.ome.tif", 27512909500],
  ["nucleus_boundaries.parquet", 18508959],
  ["transcripts.parquet", 1025235364],
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export async function validateBILXeniumSpinalAudit(override = null) {
  const audit = override ?? JSON.parse(await readFile(AUDIT_PATH, "utf8"));
  check(audit.auditId === "bil-xenium-mouse-spinal-availability-audit-0.1.0"
    && audit.researchUpgradeId === "UPG-244"
    && audit.auditDate === "2026-09-23"
    && audit.schemaVersion === "0.1.0", "BIL Xenium audit identity changed");
  check(audit.dataset.doi === "10.35077/g.1196"
    && audit.dataset.directoryListingObserved === true
    && audit.dataset.listedRunSlideFolderCount === 16
    && audit.dataset.sampledFolder === "Run1_Slide1_Mus_M1_F1"
    && audit.dataset.paperAnimalToFolderCrosswalkVerified === false
    && audit.dataset.fileContentsInspected === false
    && audit.dataset.checksumsRecorded === false, "BIL collection listing boundary changed");
  const sampleFiles = new Map(audit.dataset.sampledFolderFileListing.map(({ fileName, bytes }) => [fileName, bytes]));
  for (const [fileName, bytes] of EXPECTED_SAMPLE_FILES) {
    check(sampleFiles.get(fileName) === bytes, `BIL sampled file listing changed: ${fileName}`);
  }
  check(audit.dataset.metadataWorkbook.fileName === "BILMetadataV2TemplateUpdate_Spatial - POOL _v2.xlsx"
    && audit.dataset.metadataWorkbook.bytes === 871684
    && audit.dataset.metadataWorkbook.downloaded === false, "BIL dataset-level workbook listing changed");

  const study = audit.study;
  check(study.publicationStatus === "bioRxiv_preprint"
    && study.preprintDoi === "10.64898/2026.06.11.731752"
    && study.pubmedId === "42367914"
    && study.species === "Mus musculus"
    && study.strain === "C57BL/6J"
    && study.age === "8 weeks", "BIL linked-study identity or preprint status changed");
  check(study.sectionCount === 523
    && study.animalCounts.total === 14
    && study.animalCounts.male === 7
    && study.animalCounts.female === 7
    && study.targetedGeneCount === 480
    && study.xeniumChemistry === "Xenium v1", "BIL study-level sample/panel counts changed");
  check(study.reportedNeuronCellCounts.total === 616599
    && study.reportedNeuronCellCounts.glutamatergic + study.reportedNeuronCellCounts.gabaergic + study.reportedNeuronCellCounts.cholinergic === study.reportedNeuronCellCounts.total
    && study.reportedNonNeuronalCellCount === 2081760
    && study.reportedNeuronTypeCounts.glutamatergic === 339
    && study.reportedNeuronTypeCounts.gabaergic === 196
    && study.reportedNeuronTypeCounts.cholinergic === 56
    && study.gabaergicTypesAreInterneuronDenominator === false
    && study.interneuronRosterResolved === false
    && study.sourceIncludesProjectionNeuronContext === true, "BIL preprint counts or interneuron boundary changed");
  check(JSON.stringify(study.knownCoverageLimits) === JSON.stringify([
    "coccygeal cord not sampled",
    "rostral cervical C1-C2 not sampled",
    "rostral thoracic T1-T6 not sampled",
    "rostral lumbar L1-L2 not sampled",
  ]), "BIL preprint coverage limits changed");

  const rights = audit.rightsAndAcquisition;
  check(rights.bilGeneralDistributionPolicy === "Creative Commons Attribution-ShareAlike 4.0 International"
    && rights.repositoryReviewNoticeObserved === true
    && rights.datasetSpecificRightsMetadataVerified === false
    && rights.disposition === "link_only_pending_dataset_specific_rights_and_source_file_audit"
    && rights.projectPayloadDownloadApproved === false
    && rights.payloadFilesDownloaded === 0
    && rights.payloadBytesDownloaded === 0
    && rights.payloadFilesRetained === 0, "BIL asset-specific rights or no-download boundary changed");
  check(Object.values(audit.schemaAndIdentityAudit).every((value) => value === false), "BIL schema and identity fields must remain pending");
  check(Object.values(audit.modelAdmission).every((value) => value === 0), "BIL source audit must not admit data objects, geometry, joins or measurements");
  check(Array.isArray(audit.interpretationBoundaries) && audit.interpretationBoundaries.length >= 5
    && /3D interneuron model/.test(audit.interpretationBoundaries[0])
    && /not a count of interneurons/.test(audit.interpretationBoundaries[2])
    && /extruded to 3D/.test(audit.interpretationBoundaries[4]), "BIL interpretation boundaries are incomplete");
  check(Array.isArray(audit.sources) && audit.sources.length === 3 && audit.sources.every((source) => /^https:\/\//.test(source.url)), "BIL source links are incomplete");
  check(!("cellObjects" in audit) && !("observations" in audit) && !("transcripts" in audit), "BIL source-only audit must not contain cell or transcript payloads");

  return {
    auditId: audit.auditId,
    researchUpgradeId: audit.researchUpgradeId,
    publicationStatus: study.publicationStatus,
    listedRunSlideFolderCount: audit.dataset.listedRunSlideFolderCount,
    paperReportedAnimals: study.animalCounts.total,
    paperReportedSections: study.sectionCount,
    paperReportedNeuronCellCount: study.reportedNeuronCellCounts.total,
    datasetSpecificRightsVerified: rights.datasetSpecificRightsMetadataVerified,
    payloadBytesDownloaded: rights.payloadBytesDownloaded,
    admittedSectionLocalObjects: audit.modelAdmission.sectionLocalCellBoundaryObjects + audit.modelAdmission.sectionLocalNucleusBoundaryObjects,
    admittedThreeDimensionalCellObjects: audit.modelAdmission.threeDimensionalCellObjects,
    exactInterneuronRosterRows: audit.modelAdmission.interneuronTypeRosterRows,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateBILXeniumSpinalAudit()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
