#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_288, validateResearchIterationManifest288Snapshot } from "./validate-research-iteration-manifest-2.88-snapshot.mjs";
import { validateKohPublicInputRouteAudit } from "./validate-koh-public-input-route-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.89.json");
const AUDIT_PATH = path.join(ROOT, "data/koh-public-input-route-audit-0.1.json");
export const SNAPSHOT_289 = Object.freeze({
  path: "data/research-iteration-manifest-2.89.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.89.0",
  version: "2.89.0-research.1",
  bytes: 6857,
  fileSha256: "eb6021d91cbbb687d506c29b4e5c6fd85ba684f6a202565d1c7a49f5e3c3b85b",
  contentSha256: "9307b1631184c40c782198be181476f1b6ac0ad005907baa4179638b4f20a691",
  inputCount: 25,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest289Snapshot() {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_289.bytes && (bytes.byteLength !== SNAPSHOT_289.bytes || sha256(bytes) !== SNAPSHOT_289.fileSha256)) {
    throw new Error("Immutable 2.89 manifest file receipt changed");
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  const parent = await validateResearchIterationManifest288Snapshot();
  const [auditBytes, audit, zenodoAudit, supplementAudit] = await Promise.all([
    readFile(AUDIT_PATH),
    readFile(AUDIT_PATH, "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/koh-zenodo-supporting-code-audit-0.1.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/koh-spinal-supplemental-file-audit-0.1.json"), "utf8").then(JSON.parse),
  ]);
  const routeReceipt = validateKohPublicInputRouteAudit(audit, { zenodoAudit, supplementAudit });
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const route = manifest.exactReferences?.kohPublicInputRouteAudit;
  const expectedInputs = [
    "data/research-iteration-manifest-2.88.json",
    "data/research-source-registry-0.1.json",
    "scripts/validate-research-source-registry-0.1.mjs",
    "scripts/validate-research-source-registry-denominators.mjs",
    "data/research-model-upgrade-registry-0.1.json",
    "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
    "tools/build_research_upgrade_registry.mjs",
    "scripts/validate-research-model-upgrade-registry-0.1.mjs",
    "tests/research-model-upgrade-registry.test.mjs",
    "data/koh-spinal-supplemental-file-audit-0.1.json",
    "scripts/validate-koh-spinal-supplemental-file-audit-0.1.mjs",
    "tests/koh-spinal-supplemental-file-audit-0.1.test.mjs",
    "data/koh-zenodo-supporting-code-audit-0.1.json",
    "scripts/validate-koh-zenodo-supporting-code-audit-0.1.mjs",
    "tests/koh-zenodo-supporting-code-audit-0.1.test.mjs",
    "data/koh-public-input-route-audit-0.1.json",
    "scripts/validate-koh-public-input-route-audit-0.1.mjs",
    "tests/koh-public-input-route-audit-0.1.test.mjs",
    "package.json",
    "package-lock.json",
    "tools/run_current_research_tests.mjs",
    "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_89.md",
    "tests/research-iteration-manifest-2.89-snapshot.test.mjs",
    "tools/build_research_iteration_manifest_2_89.mjs",
    "scripts/validate-research-iteration-manifest-2.89-snapshot.mjs",
  ];
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || (SNAPSHOT_289.contentSha256 && manifest.manifestContentSha256 !== SNAPSHOT_289.contentSha256)
    || manifest.manifestSchemaVersion !== "2.89.0"
    || manifest.releaseId !== SNAPSHOT_289.releaseId
    || manifest.application.version !== SNAPSHOT_289.version
    || manifest.integrity.inputCount !== SNAPSHOT_289.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== manifest.integrity.inputCount
    || JSON.stringify(inputPaths) !== JSON.stringify(expectedInputs)
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_288.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_288.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_288.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_288.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 242
    || summary.completedResearchUpgradeCount !== 72 || summary.displayedResearchUpgradeCount !== 45
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || route.researchUpgradeId !== "UPG-260" || route.auditPath !== "data/koh-public-input-route-audit-0.1.json"
    || route.directKohRoutesChecked !== routeReceipt.directKohRoutesChecked
    || route.githubSourceFilesVisible !== 2 || route.upstreamSupplementCandidates !== 3
    || route.exactRequiredInputsPubliclyVerified !== false || route.upstreamCandidatePackageMembersInventoried !== false
    || route.exactKohAnnotationVersionEstablished !== false || route.candidateFileSpecificReuseRightsVerified !== false
    || route.followUpResearchUpgradeId !== "UPG-250" || route.sourceObjectsAdmitted !== 0
    || route.coordinatesRendered !== 0 || route.geometryAdmitted !== 0 || route.sameCellJoinDelta !== 0
    || route.crossSpeciesIdentityJoinDelta !== 0 || route.registrationDelta !== 0
    || route.measurementsAdded !== 0 || route.mouseDenominatorDelta !== 0
    || manifest.exactReferences.fullProjectCopyCount !== 0
    || manifest.exactReferences.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.88 parent, Koh public-input route audit, registry denominators or no-admission boundary changed");
  }
  const auditInput = manifest.authoritativeInputs.find((input) => input.path === "data/koh-public-input-route-audit-0.1.json");
  if (auditInput.bytes !== auditBytes.byteLength || auditInput.sha256 !== sha256(auditBytes)) {
    throw new Error("2.89 Koh public-input route audit receipt does not match the current validated audit file");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    sourceCount: summary.canonicalSourceCount,
    sourceProfileCount: summary.sourceProfileCount,
    researchUpgradeCount: summary.researchUpgradeCount,
    completedUpgradeCount: summary.completedResearchUpgradeCount,
    directKohRoutesChecked: route.directKohRoutesChecked,
    upstreamSupplementCandidates: route.upstreamSupplementCandidates,
    exactRequiredInputsPubliclyVerified: route.exactRequiredInputsPubliclyVerified,
    followUpResearchUpgradeId: route.followUpResearchUpgradeId,
    geometryAdmitted: route.geometryAdmitted,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest289Snapshot()
    .then((result) => process.stdout.write(JSON.stringify(result) + "\n"))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
