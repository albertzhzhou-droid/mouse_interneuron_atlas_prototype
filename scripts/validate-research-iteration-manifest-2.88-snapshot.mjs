#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_287, validateResearchIterationManifest287Snapshot } from "./validate-research-iteration-manifest-2.87-snapshot.mjs";
import { validateKohZenodoSupportingCodeAudit } from "./validate-koh-zenodo-supporting-code-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "data/research-iteration-manifest-2.88.json");
const AUDIT_PATH = path.join(ROOT, "data/koh-zenodo-supporting-code-audit-0.1.json");
export const SNAPSHOT_288 = Object.freeze({
  path: "data/research-iteration-manifest-2.88.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.88.0",
  version: "2.88.0-research.1",
  bytes: 6391,
  fileSha256: "0c891acc8bf04330eab67211c5f212a85dbc5cfec1441956312acfdab6eb9f0b",
  contentSha256: "1bc400c4e321e1f1373fff648d8a316647e75ed9369a16cd5b49a2661c011574",
  inputCount: 21,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest288Snapshot() {
  const bytes = await readFile(MANIFEST_PATH);
  if (SNAPSHOT_288.bytes && (bytes.byteLength !== SNAPSHOT_288.bytes || sha256(bytes) !== SNAPSHOT_288.fileSha256)) {
    throw new Error("Immutable 2.88 manifest file receipt changed");
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  const parent = await validateResearchIterationManifest287Snapshot();
  const [auditBytes, audit] = await readFile(AUDIT_PATH).then((raw) => [raw, JSON.parse(raw.toString("utf8"))]);
  const code = validateKohZenodoSupportingCodeAudit(audit);
  const inputPaths = manifest.authoritativeInputs?.map((input) => input.path) ?? [];
  const summary = manifest.registrySummary;
  const koh = manifest.exactReferences?.kohZenodoSupportingCodeAudit;
  const expectedInputs = [
    "data/research-iteration-manifest-2.87.json",
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
    "package.json",
    "package-lock.json",
    "tools/run_current_research_tests.mjs",
    "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_88.md",
    "tests/research-iteration-manifest-2.88-snapshot.test.mjs",
    "tools/build_research_iteration_manifest_2_88.mjs",
  ];
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256
    || (SNAPSHOT_288.contentSha256 && manifest.manifestContentSha256 !== SNAPSHOT_288.contentSha256)
    || manifest.manifestSchemaVersion !== "2.88.0"
    || manifest.releaseId !== SNAPSHOT_288.releaseId
    || manifest.application.version !== SNAPSHOT_288.version
    || manifest.integrity.inputCount !== SNAPSHOT_288.inputCount
    || manifest.integrity.inputPathsUnique !== true
    || manifest.authoritativeInputs.length !== manifest.integrity.inputCount
    || JSON.stringify(inputPaths) !== JSON.stringify(expectedInputs)
    || new Set(inputPaths).size !== inputPaths.length
    || manifest.authoritativeInputs.some((input) => typeof input.path !== "string" || path.isAbsolute(input.path)
      || input.path.split("/").includes("..") || !Number.isInteger(input.bytes) || input.bytes < 1
      || !/^[a-f0-9]{64}$/.test(input.sha256))
    || manifest.parentIterationManifest.path !== SNAPSHOT_287.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_287.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_287.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_287.contentSha256
    || summary.canonicalSourceCount !== 31 || summary.canonicalRecordSetCount !== 41
    || summary.bundledExactCellProfileRosterCount !== 13 || summary.bundledExactSourceObjectSetCount !== 4
    || summary.sourceProfileCount !== 387 || summary.researchUpgradeCount !== 242
    || summary.completedResearchUpgradeCount !== 72 || summary.displayedResearchUpgradeCount !== 45
    || summary.staleCanonicalDenominatorLiteralCount !== 0
    || koh.researchUpgradeId !== "UPG-259" || koh.auditPath !== "data/koh-zenodo-supporting-code-audit-0.1.json"
    || koh.conceptDoi !== "10.5281/zenodo.17475612" || koh.versionDoi !== "10.5281/zenodo.17475613"
    || koh.version !== "v1.0" || koh.depositLicense !== "CC BY 4.0" || koh.archiveByteCount !== 9289
    || koh.archiveMetadataMd5 !== "c14ff27245d1e91f3b3fe7ab02dbc976"
    || koh.archiveObservedMd5 !== koh.archiveMetadataMd5 || koh.archiveMemberCount !== 2 || koh.codeOnlyDeposit !== true
    || koh.exactWorkbookInputsPresent !== false || koh.exactKnossosArchiveInputPresent !== false
    || koh.exactCircuitSheetsAvailableInPmcWorkbook !== false || koh.underlyingInputFileRightsVerified !== false
    || koh.codeExecuted !== false || koh.sourceObjectsAdmitted !== 0 || koh.coordinatesRendered !== 0
    || koh.geometryAdmitted !== 0 || koh.sameCellJoinDelta !== 0 || koh.crossSpeciesIdentityJoinDelta !== 0
    || koh.registrationDelta !== 0 || koh.measurementsAdded !== 0 || koh.mouseDenominatorDelta !== 0
    || koh.followUpResearchUpgradeId !== "UPG-260"
    || manifest.exactReferences.fullProjectCopyCount !== 0
    || manifest.exactReferences.historicalParent.inputByteReplayRequired !== false) {
    throw new Error("Immutable 2.87 parent, Koh Zenodo code audit, registry denominators or no-admission boundary changed");
  }
  const auditInput = manifest.authoritativeInputs.find((input) => input.path === "data/koh-zenodo-supporting-code-audit-0.1.json");
  if (auditInput.bytes !== auditBytes.byteLength || auditInput.sha256 !== sha256(auditBytes)) {
    throw new Error("2.88 Koh code audit input receipt does not match the current validated audit file");
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
    versionDoi: koh.versionDoi,
    sourceCodeFileCount: code.sourceCodeFileCount,
    geometryAdmitted: koh.geometryAdmitted,
    mouseDenominatorDelta: koh.mouseDenominatorDelta,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest288Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
