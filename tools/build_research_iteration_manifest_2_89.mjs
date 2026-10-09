#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_288, validateResearchIterationManifest288Snapshot } from "../scripts/validate-research-iteration-manifest-2.88-snapshot.mjs";
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
import { validateKohPublicInputRouteAudit } from "../scripts/validate-koh-public-input-route-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_289_PATH = path.join(ROOT, "data/research-iteration-manifest-2.89.json");
export const INPUTS_289 = Object.freeze([
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
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
    throw new Error("Invalid 2.89 input path: " + relativePath);
  }
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest289() {
  const parent = await validateResearchIterationManifest288Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, packageJson, lockJson, routeAudit, zenodoAudit, supplementAudit] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/koh-public-input-route-audit-0.1.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/koh-zenodo-supporting-code-audit-0.1.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "data/koh-spinal-supplemental-file-audit-0.1.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const kohRoutes = validateKohPublicInputRouteAudit(routeAudit, { zenodoAudit, supplementAudit });

  if (packageJson.version !== "2.89.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) {
    throw new Error("2.89 application and lockfile versions must match");
  }
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) {
    throw new Error("2.89 canonical source denominators changed unexpectedly");
  }
  const routeUpgrade = upgradeRegistry.upgrades.find((item) => item.id === "UPG-260");
  if (upgrades.upgradeCount !== 242 || upgrades.displayedUpgradeCount !== 45 || upgradeRegistry.summary.byStatus.completed !== 72
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-260" || !routeUpgrade?.status.startsWith("partially completed")
    || routeUpgrade.blocker.code !== "rights_or_permission") {
    throw new Error("2.89 queue state or partial public-input route result changed unexpectedly");
  }
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || kohRoutes.directKohRoutesChecked !== 4 || kohRoutes.githubSourceFilesVisible !== 2
    || kohRoutes.upstreamSupplementCandidates !== 3 || kohRoutes.exactRequiredInputsPubliclyVerified !== false
    || kohRoutes.followUpResearchUpgradeId !== "UPG-250" || kohRoutes.geometryAdmitted !== 0
    || kohRoutes.mouseDenominatorDelta !== 0) {
    throw new Error("2.89 Koh route audit, denominator, layout or no-admission boundary changed");
  }

  const inputs = await Promise.all(INPUTS_289.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.89 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.89.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.89.0",
    releaseDate: "2026-09-24",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_288.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_288.bytes,
      fileSha256: SNAPSHOT_288.fileSha256,
      contentSha256: SNAPSHOT_288.contentSha256,
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
      kohPublicInputRouteAudit: {
        researchUpgradeId: "UPG-260",
        auditPath: "data/koh-public-input-route-audit-0.1.json",
        directKohRoutesChecked: 4,
        githubSourceFilesVisible: 2,
        upstreamSupplementCandidates: 3,
        exactRequiredInputsPubliclyVerified: false,
        upstreamCandidatePackageMembersInventoried: false,
        exactKohAnnotationVersionEstablished: false,
        candidateFileSpecificReuseRightsVerified: false,
        followUpResearchUpgradeId: "UPG-250",
        sourceObjectsAdmitted: 0,
        coordinatesRendered: 0,
        geometryAdmitted: 0,
        sameCellJoinDelta: 0,
        crossSpeciesIdentityJoinDelta: 0,
        registrationDelta: 0,
        measurementsAdded: 0,
        mouseDenominatorDelta: 0,
      },
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.88 manifest retains release-time file hashes. This snapshot validates its sealed receipt without rebuilding it from mutable current project inputs.",
      },
    },
  };
  const sealed = { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
  return { manifest: sealed, bytes: Buffer.from(JSON.stringify(sealed, null, 2) + "\n", "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest289()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_289_PATH, bytes);
      process.stdout.write((process.argv.includes("--write") ? "Wrote" : "Built") + " " + path.relative(ROOT, MANIFEST_289_PATH)
        + ": " + manifest.integrity.inputCount + " inputs; 3 linked upstream ZIPs remain unverified; 0 geometry admitted\n");
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
