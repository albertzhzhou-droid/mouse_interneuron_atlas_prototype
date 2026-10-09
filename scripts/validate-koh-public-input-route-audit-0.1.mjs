#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateKohSpinalSupplementalFileAudit } from "./validate-koh-spinal-supplemental-file-audit-0.1.mjs";
import { validateKohZenodoSupportingCodeAudit } from "./validate-koh-zenodo-supporting-code-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_PATH = path.join(ROOT, "data/koh-public-input-route-audit-0.1.json");
const EXPECTED_SHEETS = [
  "1A IN to IN", "1B IN to IN", "2A IN to IN", "2B IN to IN",
  "3A IN to IN", "4C IN to IN", "6A IN to IN", "6B IN to IN",
];
const EXPECTED_GITHUB_FILES = [
  "Quantification of cell measurements.py",
  "Quantification of synaptic and glia organization.py",
];
const EXPECTED_UPSTREAM_FILES = [
  "1-s2.0-S2211124718307563-mmc6.zip",
  "1-s2.0-S2211124718307563-mmc7.zip",
  "1-s2.0-S2211124718307563-mmc8.zip",
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateKohPublicInputRouteAudit(audit, { zenodoAudit, supplementAudit } = {}) {
  check(audit?.schemaVersion === "0.1.0" && audit.auditId === "koh-public-input-route-audit-0.1.0"
    && audit.auditDate === "2026-09-24" && audit.researchUpgradeId === "UPG-260", "Koh public-input route audit identity changed");
  check(audit.article?.pmcid === "PMC12958134"
    && audit.article.expectedWorkbookPathLeaf === "excel_file.xlsx"
    && JSON.stringify(audit.article.expectedCircuitWorksheetNames) === JSON.stringify(EXPECTED_SHEETS)
    && audit.article.expectedKnossosArchivePathLeaf === "Completed_labeling.k.zip"
    && audit.article.expectedKnossosArchiveMember === "annotation.xml", "Koh code-required inputs changed");

  const routes = audit.directKohRoutes;
  check(routes?.githubMain?.observedBranchCount === 1 && routes.githubMain.observedTagCount === 1
    && JSON.stringify(routes.githubMain.visibleSourceFiles) === JSON.stringify(EXPECTED_GITHUB_FILES)
    && routes.githubMain.visibleReadme === false && routes.githubMain.expectedWorkbookVisible === false
    && routes.githubMain.expectedKnossosArchiveVisible === false, "Koh GitHub main-tree inventory changed");
  check(routes?.githubV1Tag?.url === "https://github.com/ZacharyMKoh/Spinal-Sensorimotor-Circuit/tree/v1.0"
    && JSON.stringify(routes.githubV1Tag.visibleSourceFiles) === JSON.stringify(EXPECTED_GITHUB_FILES)
    && routes.githubV1Tag.expectedWorkbookVisible === false && routes.githubV1Tag.expectedKnossosArchiveVisible === false,
  "Koh GitHub v1.0 tree inventory changed");
  check(routes?.zenodoV1?.recordUrl === "https://zenodo.org/records/17475613"
    && routes.zenodoV1.expectedWorkbookPresent === false && routes.zenodoV1.expectedKnossosArchivePresent === false,
  "Koh Zenodo v1.0 route changed");
  check(routes?.kohPmcSupplements?.auditedSupplementCount === 2
    && routes.kohPmcSupplements.expectedCircuitWorksheetSetPresent === false
    && routes.kohPmcSupplements.expectedKnossosArchivePresent === false
    && routes.kohPmcSupplements.rowLevelObjectSynapseTripartiteListsPresent === false,
  "Koh PMC-supplement route changed");

  const candidate = audit.upstreamDatasetCandidate;
  check(candidate?.paperDoi === "10.1016/j.celrep.2018.05.023"
    && candidate.kohArticleLinksToUpstreamStudy === true
    && JSON.stringify(candidate.candidatePublicSupplementFiles.map((file) => file.name)) === JSON.stringify(EXPECTED_UPSTREAM_FILES)
    && candidate.candidateFileContentsRetrieved === false
    && candidate.candidatePackageMembersInventoried === false
    && candidate.exactKohKnossosAnnotationMatchEstablished === false
    && candidate.candidateFileSpecificReuseRightsVerified === false
    && candidate.followUpResearchUpgradeId === "UPG-250"
    && candidate.disposition === "public_link_candidate_only_pending_exact_package_audit",
  "Svara upstream candidate and unresolved exact-file gate changed");
  check(audit.findings?.expectedWorkbookFoundInDirectKohRoutes === false
    && audit.findings.expectedKnossosArchiveFoundInDirectKohRoutes === false
    && audit.findings.exactRequiredInputsPubliclyVerified === false
    && audit.findings.publicUpstreamDatasetRouteExists === true
    && audit.findings.publicUpstreamRouteProvesExactKohAnnotationVersion === false
    && audit.findings.scopeIsNotUniversalAbsenceClaim === true,
  "Koh public-route findings were promoted beyond their bounded scope");

  const boundary = audit.rightsAndAdmission;
  check(boundary?.authorsContacted === false && boundary.gatedMaterialRequested === false
    && boundary.credentialsInspected === false && boundary.candidateArchivePayloadsDownloaded === false
    && boundary.codeExecuted === false, "Koh public-route search exceeded its public metadata-only scope");
  for (const field of ["sourceObjectsAdmitted", "coordinatesRendered", "geometryAdmitted", "sameCellJoins", "crossSpeciesIdentityJoins", "mouseIdentityJoins", "registrationCount", "measurementsAdded", "mouseDenominatorDelta"]) {
    check(boundary[field] === 0, "Koh public-route search changed no-admission boundary: " + field);
  }

  if (zenodoAudit) {
    const zenodo = validateKohZenodoSupportingCodeAudit(zenodoAudit);
    check(zenodo.sourceCodeFileCount === EXPECTED_GITHUB_FILES.length && zenodo.publishedInputsSufficient === false,
      "Koh public-route result does not match the exact Zenodo audit");
  }
  if (supplementAudit) {
    const supplements = validateKohSpinalSupplementalFileAudit(supplementAudit);
    check(supplements.worksheetCount === 31 && supplements.sourceObjectsAdmitted === 0,
      "Koh public-route result does not match the exact PMC supplement audit");
  }
  return {
    directKohRoutesChecked: 4,
    githubSourceFilesVisible: EXPECTED_GITHUB_FILES.length,
    upstreamSupplementCandidates: EXPECTED_UPSTREAM_FILES.length,
    exactRequiredInputsPubliclyVerified: audit.findings.exactRequiredInputsPubliclyVerified,
    followUpResearchUpgradeId: candidate.followUpResearchUpgradeId,
    geometryAdmitted: boundary.geometryAdmitted,
    mouseDenominatorDelta: boundary.mouseDenominatorDelta,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.all([
    readFile(AUDIT_PATH, "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/koh-zenodo-supporting-code-audit-0.1.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/koh-spinal-supplemental-file-audit-0.1.json"), "utf8").then(JSON.parse),
  ])
    .then(([audit, zenodoAudit, supplementAudit]) => validateKohPublicInputRouteAudit(audit, { zenodoAudit, supplementAudit }))
    .then((result) => process.stdout.write(JSON.stringify(result) + "\n"))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
