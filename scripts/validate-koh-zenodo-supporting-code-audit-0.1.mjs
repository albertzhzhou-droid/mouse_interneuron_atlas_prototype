#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/koh-zenodo-supporting-code-audit-0.1.json");
const EXPECTED_SHEETS = [
  "1A IN to IN", "1B IN to IN", "2A IN to IN", "2B IN to IN",
  "3A IN to IN", "4C IN to IN", "6A IN to IN", "6B IN to IN",
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateKohZenodoSupportingCodeAudit(audit) {
  check(audit?.schemaVersion === "0.1.0" && audit.auditId === "koh-zenodo-supporting-code-audit-0.1.0", "Koh Zenodo code audit identity changed");
  check(audit.researchUpgradeId === "UPG-259" && audit.zenodoRecord?.conceptDoi === "10.5281/zenodo.17475612"
    && audit.zenodoRecord?.versionDoi === "10.5281/zenodo.17475613" && audit.zenodoRecord?.version === "v1.0", "Koh Zenodo concept/version DOI binding changed");
  check(audit.zenodoRecord?.license === "CC BY 4.0" && audit.archive?.byteCount === 9289
    && audit.archive?.metadataMd5 === "c14ff27245d1e91f3b3fe7ab02dbc976"
    && audit.archive.metadataMd5 === audit.archive.observedMd5, "Koh Zenodo exact file or rights receipt changed");
  check(audit.archive.nonDirectoryMemberCount === 2 && audit.archive.archiveMembers?.length === 2
    && audit.archive.archiveMembers[0].uncompressedBytes === 8164 && audit.archive.archiveMembers[1].uncompressedBytes === 75881
    && audit.archive.archiveMembers.every((member) => member.kind === "python_source")
    && audit.archive.dataFilesPresent === false && audit.archive.workbookPresent === false
    && audit.archive.knossosArchivePresent === false && audit.archive.annotationXmlPresent === false, "Koh Zenodo archive inventory changed");
  const inputs = audit.codeInputAudit;
  check(inputs?.synapseGliaScript?.initializesEmptyObjectSynapseGliaLists === true
    && inputs.synapseGliaScript.readsExternalWorkbookPathLeaf === "excel_file.xlsx"
    && JSON.stringify(inputs.synapseGliaScript.expectedCircuitWorksheetNames) === JSON.stringify(EXPECTED_SHEETS)
    && inputs.synapseGliaScript.allExpectedSheetsAbsentFromAuditedPmcWorkbook === true
    && inputs.synapseGliaScript.usesOptionalKnossosDatasetAndAuthConfig === true
    && inputs.synapseGliaScript.executesOrWritesDuringAudit === false, "Synapse/glia code input and no-execution boundary changed");
  check(inputs?.cellMeasurementScript?.readsExternalKnossosArchivePathLeaf === "Completed_labeling.k.zip"
    && inputs.cellMeasurementScript.expectsAnnotationXmlMember === "annotation.xml"
    && inputs.cellMeasurementScript.externalKnossosArchivePresentInZenodoDeposit === false
    && inputs.cellMeasurementScript.executesOrWritesDuringAudit === false, "Cell-measurement external-input boundary changed");
  check(inputs.publishedInputsSufficientToMaterializeLists === false && inputs.paperDescribedListValuesBundled === false
    && inputs.machineReadableReconstructionGeometryBundled === false, "Code-only deposit was promoted to source data or geometry");
  const boundary = audit.rightsAndAdmission;
  check(boundary?.depositCodeLicense === "CC BY 4.0" && boundary.underlyingInputFileRightsVerified === false
    && boundary.projectDisposition === "link_only_no_code_or_data_copy" && boundary.authorContacted === false
    && boundary.credentialsInspected === false && boundary.depositedCodeExecuted === false, "Koh code/data rights or handling boundary changed");
  check(boundary.sourceObjectsAdmitted === 0 && boundary.coordinatesRendered === 0 && boundary.geometryAdmitted === 0
    && boundary.sameCellJoins === 0 && boundary.crossSpeciesIdentityJoins === 0 && boundary.registrationCount === 0
    && boundary.measurementsAdded === 0 && boundary.mouseDenominatorDelta === 0 && boundary.nextAuditId === "UPG-260", "Koh Zenodo route must remain no-admission");
  return {
    versionDoi: audit.zenodoRecord.versionDoi,
    version: audit.zenodoRecord.version,
    archiveBytes: audit.archive.byteCount,
    sourceCodeFileCount: audit.archive.nonDirectoryMemberCount,
    publishedInputsSufficient: inputs.publishedInputsSufficientToMaterializeLists,
    geometryAdmitted: boundary.geometryAdmitted,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  readFile(AUDIT_PATH, "utf8")
    .then(JSON.parse)
    .then((audit) => validateKohZenodoSupportingCodeAudit(audit))
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
