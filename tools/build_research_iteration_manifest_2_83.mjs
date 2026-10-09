#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_282, validateResearchIterationManifest282Snapshot } from "../scripts/validate-research-iteration-manifest-2.82-snapshot.mjs";
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
import { validateBILXeniumSpinalAudit } from "../scripts/validate-bil-xenium-spinal-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_283_PATH = path.join(ROOT, "data/research-iteration-manifest-2.83.json");
export const INPUTS_283 = Object.freeze([
  "data/research-iteration-manifest-2.82.json",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "scripts/validate-research-source-registry-denominators.mjs",
  "data/research-model-upgrade-registry-0.1.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "data/bil-xenium-spinal-audit-0.1.json",
  "scripts/validate-bil-xenium-spinal-audit-0.1.mjs",
  "tests/bil-xenium-spinal-audit.test.mjs",
  "app/ResearchOverview.tsx",
  "app/ResearchActiveRecordProvider.tsx",
  "app/exact-record-detail-coverage.js",
  "app/InternalStructureReferencePanel.tsx",
  "app/globals.css",
  "tests/exact-record-detail-coverage.test.mjs",
  "tests/research-active-record-integration.test.mjs",
  "tests/rendered-html.test.mjs",
  "package.json",
  "package-lock.json",
  "tools/run_current_research_tests.mjs",
  "tests/research-iteration-manifest-2.82-snapshot.test.mjs",
  "scripts/validate-research-iteration-manifest-2.82-snapshot.mjs",
  "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_82.md",
  "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_83.md",
  "tests/research-iteration-manifest-2.83-snapshot.test.mjs",
  "tools/build_research_iteration_manifest_2_83.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Invalid 2.83 input path: ${relativePath}`);
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest283() {
  const parent = await validateResearchIterationManifest282Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, packageJson, lockJson, bilAudit] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
    validateBILXeniumSpinalAudit(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const upgrade255 = upgradeRegistry.upgrades.find((item) => item.id === "UPG-255");
  if (packageJson.version !== "2.83.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) throw new Error("2.83 application and lockfile versions must match");
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) {
    throw new Error("2.83 canonical source denominators changed unexpectedly");
  }
  if (upgrades.upgradeCount !== 237 || upgrades.displayedUpgradeCount !== 43 || upgradeRegistry.summary.byStatus.completed !== 69
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-255" || !upgrade255?.status.startsWith("planned")) {
    throw new Error("2.83 research queue state changed unexpectedly");
  }
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || bilAudit.auditId !== "bil-xenium-mouse-spinal-availability-audit-0.1.0"
    || bilAudit.datasetSpecificRightsVerified !== false || bilAudit.payloadBytesDownloaded !== 0
    || bilAudit.admittedSectionLocalObjects !== 0 || bilAudit.admittedThreeDimensionalCellObjects !== 0
    || bilAudit.exactInterneuronRosterRows !== 0) {
    throw new Error("2.83 denominator, incremental-layout, BIL rights or no-admission boundary changed");
  }

  const inputs = await Promise.all(INPUTS_283.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.83 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.83.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.83.0",
    releaseDate: "2026-09-24",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_282.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_282.bytes,
      fileSha256: SNAPSHOT_282.fileSha256,
      contentSha256: SNAPSHOT_282.contentSha256,
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
      selectionPresentation: {
        activeRecordDetailIsFirst: true,
        independentReferenceDisclosureDefaultOpen: false,
        independentReferencesCreateSameCellLink: false,
      },
      bilXeniumSpinal: {
        auditId: bilAudit.auditId,
        researchUpgradeId: "UPG-244",
        plannedViewerUpgradeId: "UPG-255",
        datasetSpecificRightsVerified: bilAudit.datasetSpecificRightsVerified,
        payloadBytesDownloaded: bilAudit.payloadBytesDownloaded,
        exactInterneuronRosterRows: bilAudit.exactInterneuronRosterRows,
        sectionLocalBoundaryObjects: bilAudit.admittedSectionLocalObjects,
        threeDimensionalCellObjects: bilAudit.admittedThreeDimensionalCellObjects,
        sourceLocal2dViewerImplemented: false,
      },
      newGeometryCount: 0,
      newSameCellJoins: 0,
      newRegistrations: 0,
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.82 manifest retains release-time file hashes. This snapshot validates its sealed receipt without rebuilding it from mutable current project inputs.",
      },
    },
  };
  const sealed = { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
  return { manifest: sealed, bytes: Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest283()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_283_PATH, bytes);
      process.stdout.write(`${process.argv.includes("--write") ? "Wrote" : "Built"} ${path.relative(ROOT, MANIFEST_283_PATH)}: ${manifest.integrity.inputCount} inputs; UPG-255 remains gated, 0 Xenium payload bytes admitted\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
