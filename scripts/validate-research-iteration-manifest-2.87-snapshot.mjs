#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_286, validateResearchIterationManifest286Snapshot } from "./validate-research-iteration-manifest-2.86-snapshot.mjs";
import { validateKohSpinalSupplementalFileAudit } from "./validate-koh-spinal-supplemental-file-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.87.json");
const AUDIT_PATH = path.join(ROOT, "data/koh-spinal-supplemental-file-audit-0.1.json");
export const SNAPSHOT_287 = Object.freeze({
  path: "data/research-iteration-manifest-2.87.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.87.0",
  version: "2.87.0-research.1",
  bytes: 5843,
  fileSha256: "f92b66cf02d946762370e49681f1f3136eb1f4e519e2e14d2de40e60091485b1",
  contentSha256: "423dc3ece02b39c7dc57766b071a7634dd8bdadc54585d8f9992d979ad8ba893",
  inputCount: 18,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest287Snapshot() {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_287.bytes && (bytes.byteLength !== SNAPSHOT_287.bytes || sha256(bytes) !== SNAPSHOT_287.fileSha256)) {
    throw new Error("Immutable 2.87 manifest file receipt changed");
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  const parent = await validateResearchIterationManifest286Snapshot();
  const [auditBytes, audit] = await readFile(AUDIT_PATH).then((raw) => [raw, JSON.parse(raw.toString("utf8"))]);
  const audited = validateKohSpinalSupplementalFileAudit(audit);
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const koh = manifest.exactReferences?.kohSpinalSupplementalFileAudit;
  const expectedInputs = [
    "data/research-iteration-manifest-2.86.json",
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
    "package.json",
    "package-lock.json",
    "tools/run_current_research_tests.mjs",
    "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_87.md",
    "tests/research-iteration-manifest-2.87-snapshot.test.mjs",
    "tools/build_research_iteration_manifest_2_87.mjs",
  ];
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || (SNAPSHOT_287.contentSha256 && manifest.manifestContentSha256 !== SNAPSHOT_287.contentSha256)
    || manifest.manifestSchemaVersion !== "2.87.0"
    || manifest.releaseId !== SNAPSHOT_287.releaseId
    || manifest.application.version !== SNAPSHOT_287.version
    || manifest.integrity.inputCount !== SNAPSHOT_287.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== manifest.integrity.inputCount
    || JSON.stringify(inputPaths) !== JSON.stringify(expectedInputs)
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_286.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_286.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_286.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_286.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 241
    || summary.completedResearchUpgradeCount !== 71 || summary.displayedResearchUpgradeCount !== 45
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || koh.researchUpgradeId !== "UPG-257" || koh.auditPath !== "data/koh-spinal-supplemental-file-audit-0.1.json"
    || koh.articleVersion !== 1 || koh.articleVersionLicense !== "CC BY-NC-ND"
    || koh.supplementalFilesAudited !== 2 || koh.workbookWorksheetCount !== 31 || koh.pdfPageCount !== 7
    || koh.paperDescribesObjectSynapseAndTripartiteGliaLists !== true
    || koh.rowLevelListsFoundInAuditedSupplements !== false || koh.stableKnossosObjectIdsInWorkbook !== false
    || koh.xyzCoordinateColumnsInWorkbook !== false || koh.machineReadableReconstructionGeometryInEitherSupplement !== false
    || koh.perSupplementLicenseFieldAvailable !== false
    || koh.projectDisposition !== "link_only_no_copy_no_transform_no_redistribution"
    || koh.sourceFilesBundled !== false || koh.sourceObjectsAdmitted !== 0 || koh.coordinatesRendered !== 0
    || koh.geometryAdmitted !== 0 || koh.sameCellJoinDelta !== 0 || koh.crossSpeciesIdentityJoinDelta !== 0
    || koh.mouseDenominatorDelta !== 0 || koh.separateCodeDepositFollowUp !== "UPG-259"
    || manifest.exactReferences.fullProjectCopyCount !== 0
    || manifest.exactReferences.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.86 parent, Koh supplemental audit, registry denominators or no-admission boundary changed");
  }
  const auditInput = manifest.authoritativeInputs.find((input) => input.path === "data/koh-spinal-supplemental-file-audit-0.1.json");
  if (auditInput.bytes !== auditBytes.byteLength || auditInput.sha256 !== sha256(auditBytes)) {
    throw new Error("2.87 Koh audit input receipt does not match the current validated audit file");
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
    auditedSupplementCount: koh.supplementalFilesAudited,
    workbookWorksheetCount: audited.worksheetCount,
    geometryAdmitted: koh.geometryAdmitted,
    mouseDenominatorDelta: koh.mouseDenominatorDelta,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest287Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
