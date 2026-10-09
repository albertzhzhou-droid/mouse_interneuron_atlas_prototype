#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_284, validateResearchIterationManifest284Snapshot } from "../scripts/validate-research-iteration-manifest-2.84-snapshot.mjs";
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_285_PATH = path.join(ROOT, "data/research-iteration-manifest-2.85.json");
export const INPUTS_285 = Object.freeze([
  "data/research-iteration-manifest-2.84.json",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "scripts/validate-research-source-registry-denominators.mjs",
  "data/research-model-upgrade-registry-0.1.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "docs/RESEARCH_WATCH_2026-09-24_KOH_SPINAL_SBEM.md",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "app/ResearchOverview.tsx",
  "package.json",
  "package-lock.json",
  "tools/run_current_research_tests.mjs",
  "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_85.md",
  "tests/research-iteration-manifest-2.85-snapshot.test.mjs",
  "tools/build_research_iteration_manifest_2_85.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
    throw new Error(`Invalid 2.85 input path: ${relativePath}`);
  }
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest285() {
  const parent = await validateResearchIterationManifest284Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, packageJson, lockJson] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const kohUpgrade = upgradeRegistry.upgrades.find((item) => item.id === "UPG-257");
  if (packageJson.version !== "2.85.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) {
    throw new Error("2.85 application and lockfile versions must match");
  }
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) {
    throw new Error("2.85 canonical source denominators changed unexpectedly");
  }
  if (upgrades.upgradeCount !== 239 || upgrades.displayedUpgradeCount !== 44 || upgradeRegistry.summary.byStatus.completed !== 69
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-257" || kohUpgrade?.lane !== "connectivity"
    || !kohUpgrade.status.startsWith("research watch")) {
    throw new Error("2.85 research queue state or UPG-257 source-only boundary changed unexpectedly");
  }
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0) {
    throw new Error("2.85 canonical denominator or in-place iteration boundary changed");
  }

  const inputs = await Promise.all(INPUTS_285.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.85 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.85.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.85.0",
    releaseDate: "2026-09-24",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_284.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_284.bytes,
      fileSha256: SNAPSHOT_284.fileSha256,
      contentSha256: SNAPSHOT_284.contentSha256,
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
      kohSpinalSupplementAudit: {
        researchUpgradeId: "UPG-257",
        articleUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12958134/",
        listedSupplementFiles: { pdfCount: 1, xlsxCount: 1, xlsxListedSize: "216.8 KB" },
        articleReportedScope: {
          species: "Danio rerio",
          ageDaysPostFertilization: 6,
          healthyAnimals: 1,
          volumeExtentMicrometers: [74, 74, 207],
          voxelSizeNanometers: [9, 9, 21],
        },
        articleDescribesObjectSynapseAndTripartiteGliaLists: true,
        workbookRetrieved: false,
        worksheetsInspected: false,
        rowCountsVerified: false,
        objectIdsObserved: 0,
        synapseCoordinatesObserved: 0,
        sourceObjectsAdmitted: 0,
        geometryAdmitted: 0,
        coordinatesRendered: 0,
        crossSpeciesIdentityJoins: 0,
        mouseDenominatorDelta: 0,
        fileSpecificRightsVerified: false,
        articleLicense: "CC BY-NC-ND; supplement-specific redistribution review remains open",
      },
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.84 manifest retains release-time file hashes. This snapshot validates its sealed receipt without rebuilding it from mutable current project inputs.",
      },
    },
  };
  const sealed = { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
  return { manifest: sealed, bytes: Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest285()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_285_PATH, bytes);
      process.stdout.write(`${process.argv.includes("--write") ? "Wrote" : "Built"} ${path.relative(ROOT, MANIFEST_285_PATH)}: ${manifest.integrity.inputCount} inputs; UPG-257 remains uninspected and admits 0 objects or geometry\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
