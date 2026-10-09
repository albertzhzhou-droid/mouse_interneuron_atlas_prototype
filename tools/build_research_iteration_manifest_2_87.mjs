#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_286, validateResearchIterationManifest286Snapshot } from "../scripts/validate-research-iteration-manifest-2.86-snapshot.mjs";
import {
  loadResearchSourceRegistry,
  loadResearchUpgradeRegistry,
  summarizeResearchSourceRegistry,
  validateResearchSourceRegistry,
  validateResearchSourceUpgradeLinks,
} from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";
import { validateKohSpinalSupplementalFileAudit } from "../scripts/validate-koh-spinal-supplemental-file-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_287_PATH = path.join(ROOT, "data/research-iteration-manifest-2.87.json");
export const INPUTS_287 = Object.freeze([
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
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
    throw new Error(`Invalid 2.87 input path: ${relativePath}`);
  }
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest287() {
  const parent = await validateResearchIterationManifest286Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, packageJson, lockJson, audit] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/koh-spinal-supplemental-file-audit-0.1.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const kohAudit = validateKohSpinalSupplementalFileAudit(audit);

  if (packageJson.version !== "2.87.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) {
    throw new Error("2.87 application and lockfile versions must match");
  }
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) {
    throw new Error("2.87 canonical source denominators changed unexpectedly");
  }
  if (upgrades.upgradeCount !== 241 || upgrades.displayedUpgradeCount !== 45 || upgradeRegistry.summary.byStatus.completed !== 71
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-259"
    || upgradeRegistry.upgrades.find((item) => item.id === "UPG-257")?.status !== "completed"
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-259")?.status.startsWith("planned")) {
    throw new Error("2.87 queue state or bounded Koh supplement audit changed unexpectedly");
  }
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || kohAudit.worksheetCount !== 31 || kohAudit.pdfPageCount !== 7
    || kohAudit.sourceObjectsAdmitted !== 0 || kohAudit.geometryAdmitted !== 0) {
    throw new Error("2.87 audit, denominator, layout, or no-admission boundary changed");
  }

  const inputs = await Promise.all(INPUTS_287.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.87 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.87.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.87.0",
    releaseDate: "2026-09-24",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_286.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_286.bytes,
      fileSha256: SNAPSHOT_286.fileSha256,
      contentSha256: SNAPSHOT_286.contentSha256,
    },
    authoritativeInputs: inputs,
    integrity: { inputCount: inputs.length, inputPathsUnique: true },
    registrySummary: {
      canonicalSourceCount: sourceSummary.sourceCount,
      canonicalRecordSetCount: sourceSummary.recordSetCount,
      bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
      bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
      sourceProfileCount: sourceSummary.typeRecordCount,
      researchUpgradeCount: upgrades.upgradeCount,
      completedResearchUpgradeCount: upgradeRegistry.summary.byStatus.completed,
      displayedResearchUpgradeCount: upgrades.displayedUpgradeCount,
      staleCanonicalDenominatorLiteralCount: denominators.staleLiteralCount,
    },
    exactReferences: {
      kohSpinalSupplementalFileAudit: {
        researchUpgradeId: "UPG-257",
        auditPath: "data/koh-spinal-supplemental-file-audit-0.1.json",
        articleVersion: 1,
        articleVersionLicense: "CC BY-NC-ND",
        supplementalFilesAudited: 2,
        workbookWorksheetCount: 31,
        workbookWorksheetRangesPinned: true,
        pdfPageCount: 7,
        paperDescribesObjectSynapseAndTripartiteGliaLists: true,
        rowLevelListsFoundInAuditedSupplements: false,
        stableKnossosObjectIdsInWorkbook: false,
        xyzCoordinateColumnsInWorkbook: false,
        machineReadableReconstructionGeometryInEitherSupplement: false,
        perSupplementLicenseFieldAvailable: false,
        projectDisposition: "link_only_no_copy_no_transform_no_redistribution",
        sourceFilesBundled: false,
        sourceObjectsAdmitted: 0,
        coordinatesRendered: 0,
        geometryAdmitted: 0,
        sameCellJoinDelta: 0,
        crossSpeciesIdentityJoinDelta: 0,
        mouseDenominatorDelta: 0,
        separateCodeDepositFollowUp: "UPG-259",
      },
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.86 manifest retains release-time file hashes. This snapshot validates its sealed receipt without rebuilding it from mutable current project inputs.",
      },
    },
  };
  const sealed = { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
  return { manifest: sealed, bytes: Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest287()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_287_PATH, bytes);
      process.stdout.write(`${process.argv.includes("--write") ? "Wrote" : "Built"} ${path.relative(ROOT, MANIFEST_287_PATH)}: ${manifest.integrity.inputCount} inputs; 2 Koh supplements audited, 0 geometry admitted\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
