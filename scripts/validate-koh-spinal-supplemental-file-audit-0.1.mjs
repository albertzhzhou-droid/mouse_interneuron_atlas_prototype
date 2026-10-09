#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/koh-spinal-supplemental-file-audit-0.1.json");
const EXPECTED_WORKSHEETS = [
  ["Fig 1E", "A1:J5"], ["Fig 1H", "A1:D6"], ["Fig 2C", "A1:E14"], ["Fig 2E", "A1:C17"],
  ["Fig 2F", "A1:F21"], ["Fig 2G", "A1:F54"], ["Fig 2H", "A1:F21"], ["Fig 2I", "A1:F40"],
  ["Fig 2J", "A1:F41"], ["Fig 2K", "A1:D13"], ["Fig 3B", "A1:B103"], ["Fig 3G", "A1:B17"],
  ["Fig 4B", "A1:I344"], ["Fig 4D", "A1:I71"], ["Fig 4E", "A1:I23"], ["Fig 4F", "A1:I25"],
  ["Fig 5D", "A1:D26"], ["Fig 5E", "A1:D33"], ["Fig 6K", "A1:B21"], ["Fig S1B", "A1:B30"],
  ["Fig S1C", "A1:B30"], ["Fig S1D", "A1:B30"], ["Fig S1H", "A1:B30"], ["Fig S1I", "A1:B30"],
  ["Fig S1J", "A1:B30"], ["Fig S1K", "A1:B30"], ["Fig S1L", "A1:B30"], ["Fig S1O", "A1:C47"],
  ["Fig S1P", "A1:C32"], ["Fig S2C", "A1:B15"], ["Fig S4C", "A1:F47"],
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateKohSpinalSupplementalFileAudit(audit) {
  check(audit?.schemaVersion === "0.1.0" && audit.auditId === "koh-spinal-supplemental-file-audit-0.1.0", "Koh supplement audit identity changed");
  check(audit.researchUpgradeId === "UPG-257" && audit.article?.pmcid === "PMC12958134" && audit.article?.pmcVersion === 1, "Koh article identity/version changed");
  check(audit.article?.articleVersionLicense === "CC BY-NC-ND" && audit.article?.perSupplementLicenseFieldAvailable === false, "Koh licence boundary changed");
  check(audit.sourceReportedLists?.describedByArticle === true && audit.sourceReportedLists?.machineReadableRowsFoundInAuditedSupplements === false, "Article-described list availability was overstated");
  check(Array.isArray(audit.files) && audit.files.length === 2, "Both listed Koh supplements must be audited");
  const [pdf, workbook] = audit.files;
  check(pdf.kind === "supplemental_pdf" && pdf.pageCount === 7 && pdf.retrievedByteCount === 1928722, "Supplemental PDF receipt changed");
  check(pdf.metadataMd5 === "9c9f7b1b4da9bd78bc728fce095ac7de" && pdf.metadataMd5 === pdf.observedMd5, "Supplemental PDF MD5 does not match PMC metadata");
  check(pdf.machineReadableObjectRosterPresent === false && pdf.machineReadableCoordinatesPresent === false
    && pdf.machineReadableReconstructionGeometryPresent === false, "Static PDF was incorrectly admitted as source geometry");
  check(workbook.kind === "supplemental_workbook" && workbook.worksheetCount === EXPECTED_WORKSHEETS.length
    && workbook.worksheetRegions.length === EXPECTED_WORKSHEETS.length, "Workbook worksheet inventory count changed");
  check(JSON.stringify(workbook.worksheetRegions.map(({ name, visibleUsedRange }) => [name, visibleUsedRange])) === JSON.stringify(EXPECTED_WORKSHEETS), "Workbook worksheet names or visible ranges changed");
  check(workbook.retrievedByteCount === 221981 && workbook.metadataMd5 === "1d5b68fdf33497b702024da0b76e120c"
    && workbook.metadataMd5 === workbook.observedMd5, "Supplemental workbook MD5 does not match PMC metadata");
  check(workbook.stableKnossosObjectIdsPresent === false && workbook.xyzCoordinateColumnsPresent === false
    && workbook.presynapticAndPostsynapticObjectReferencesPresent === false && workbook.rowLevelObjectToCellTypeRosterPresent === false
    && workbook.machineReadableReconstructionGeometryPresent === false, "Workbook content was incorrectly admitted as an object-level data route");
  const rights = audit.rightsAndAdmission;
  check(rights?.articleVersionLicense === "CC BY-NC-ND" && rights?.perSupplementLicenseFieldAvailable === false
    && rights?.projectDisposition === "link_only_no_copy_no_transform_no_redistribution"
    && rights?.sourceFilesBundledInProject === false, "Koh supplement reuse boundary changed");
  check(rights.sourceObjectsAdmitted === 0 && rights.coordinatesRendered === 0 && rights.geometryAdmitted === 0
    && rights.sameCellJoins === 0 && rights.crossSpeciesIdentityJoins === 0 && rights.mouseDenominatorDelta === 0, "Koh audit must remain no-admission");
  check(audit.nextAudit?.researchUpgradeId === "UPG-259" && audit.nextAudit?.zenodoDoi === "10.5281/zenodo.17475612", "Koh code-deposit follow-up route changed");
  return {
    worksheetCount: workbook.worksheetCount,
    pdfPageCount: pdf.pageCount,
    articleVersionLicense: rights.articleVersionLicense,
    sourceObjectsAdmitted: rights.sourceObjectsAdmitted,
    geometryAdmitted: rights.geometryAdmitted,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  readFile(AUDIT_PATH, "utf8")
    .then(JSON.parse)
    .then((audit) => validateKohSpinalSupplementalFileAudit(audit))
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
