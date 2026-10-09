#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_277, validateResearchIterationManifest277Snapshot } from "../scripts/validate-research-iteration-manifest-2.77-snapshot.mjs";
import { validateResearchExplorerIndex } from "../scripts/validate-research-explorer-index.mjs";
import { validateNeuromorphoRelease126ToddNtsRoutePack01 } from "../scripts/validate-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import {
  loadResearchSourceRegistry,
  loadResearchUpgradeRegistry,
  summarizeResearchSourceRegistry,
  validateResearchSourceRegistry,
  validateResearchSourceUpgradeLinks,
} from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";
import { buildExactRecordDetailCoverage, INTERNAL_DETAIL_SLOTS } from "../app/exact-record-detail-coverage.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_278_PATH = path.join(ROOT, "data/research-iteration-manifest-2.78.json");
export const INPUTS_278 = Object.freeze([
  "data/research-iteration-manifest-2.77.json",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "scripts/validate-research-source-registry-denominators.mjs",
  "data/research-model-upgrade-registry-0.1.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "public/data/research_explorer_index_v1/asset-manifest.json",
  "public/data/research_explorer_index_v1/search-index.json",
  "scripts/validate-research-explorer-index.mjs",
  "scripts/validate-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.mjs",
  "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json",
  "scripts/validate-incremental-iteration-layout.mjs",
  "scripts/validate-research-iteration-manifest-2.77-snapshot.mjs",
  "tests/research-iteration-manifest-2.77-snapshot.test.mjs",
  "app/exact-record-detail-coverage.js",
  "app/ResearchActiveRecordProvider.tsx",
  "app/InternalStructureReferencePanel.tsx",
  "app/AtlasPrototype.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "package.json",
  "package-lock.json",
  "tests/exact-record-detail-coverage.test.mjs",
  "tests/research-active-record-integration.test.mjs",
  "tests/rendered-html.test.mjs",
  "tools/run_current_research_tests.mjs",
  "tests/research-iteration-manifest-2.78-snapshot.test.mjs",
  "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_78.md",
  "tools/build_research_iteration_manifest_2_78.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Invalid 2.78 input path: ${relativePath}`);
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function activeRecordReceipt(record, indexState) {
  if (!record) throw new Error("The verified Explorer index is missing an exact-record fixture");
  const focus = { focusKind: record.focusKind, focusId: record.focusId };
  const coverage = buildExactRecordDetailCoverage({
    indexState,
    activeRecordState: {
      status: "ready",
      requestKey: record.key,
      focusKind: record.focusKind,
      focusId: record.focusId,
      record,
    },
    focus,
  });
  if (coverage.status !== "ready" || coverage.rows.length !== INTERNAL_DETAIL_SLOTS.length) {
    throw new Error(`The verified detail matrix is incomplete for ${record.key}`);
  }
  return coverage;
}

export async function buildResearchIterationManifest278() {
  const parent = await validateResearchIterationManifest277Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, explorerValidation, routePack, packageJson, lockJson, index] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    validateResearchExplorerIndex(),
    validateNeuromorphoRelease126ToddNtsRoutePack01(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "public/data/research_explorer_index_v1/search-index.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const indexState = { status: "ready", index, records: index.records, error: "" };
  const profile = index.records.find((record) => record.key === "molecular_profile:sathyamurthy-2018:DE-1");
  const morphology = index.records.find((record) => record.key === "morphology_record:NeuroMorpho:109005");
  const profileCoverage = activeRecordReceipt(profile, indexState);
  const morphologyCoverage = activeRecordReceipt(morphology, indexState);
  const staleCoverage = buildExactRecordDetailCoverage({
    indexState,
    activeRecordState: {
      status: "ready",
      requestKey: morphology.key,
      focusKind: morphology.focusKind,
      focusId: morphology.focusId,
      record: morphology,
    },
    focus: { focusKind: profile.focusKind, focusId: profile.focusId },
  });

  if (packageJson.version !== "2.78.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) throw new Error("2.78 application and lockfile versions must match");
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) throw new Error("2.78 canonical source denominators changed unexpectedly");
  if (upgrades.upgradeCount !== 235 || upgrades.displayedUpgradeCount !== 42 || upgradeRegistry.summary.byStatus.completed !== 69
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-253"
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-251")?.status.startsWith("partially completed")
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-252")?.status.startsWith("planned")
    || !upgradeRegistry.upgrades.find((item) => item.id === "UPG-253")?.status.startsWith("planned")) {
    throw new Error("2.78 queue status or exact-record detail follow-up changed");
  }
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || explorerValidation.recordCount !== 641 || index.records.length !== explorerValidation.recordCount
    || routePack.routeCount !== 30 || routePack.internalPrimitiveCount !== 0 || routePack.paperCrosswalkCount !== 0) {
    throw new Error("2.78 registry, Explorer-index, route-pack or incremental-layout validation failed");
  }
  if (profileCoverage.indexSummary.exactRecordCount !== 641
    || profileCoverage.indexSummary.sourceMorphologyRecordCount !== 149
    || profileCoverage.indexSummary.admittedInternalObjectCount !== 0 || profileCoverage.indexSummary.fallbackPrimitiveCount !== 0
    || profileCoverage.rows.length !== 11 || morphologyCoverage.rows.length !== 11
    || profileCoverage.rows.map((item) => item.status).join("|") === morphologyCoverage.rows.map((item) => item.status).join("|")
    || staleCoverage.status === "ready" || staleCoverage.rows.length !== 0) {
    throw new Error("2.78 exact-record detail matrix no longer follows verified record identity or missingness");
  }

  const inputs = await Promise.all(INPUTS_278.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.78 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.78.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.78.0",
    releaseDate: "2026-09-23",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_277.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_277.bytes,
      fileSha256: SNAPSHOT_277.fileSha256,
      contentSha256: SNAPSHOT_277.contentSha256,
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
      explorerRecordDetailCoverage: {
        indexSha256: explorerValidation.indexSha256,
        explorerRecordCount: explorerValidation.recordCount,
        sourceMorphologyRecordCount: profileCoverage.indexSummary.sourceMorphologyRecordCount,
        detailSlotCount: INTERNAL_DETAIL_SLOTS.length,
        testedRecordFocusKeys: [profile.key, morphology.key],
        selectedProfileAndMorphologyReceiptsDiffer: true,
        stalePriorRecordRowCountWhenFocusMismatches: staleCoverage.rows.length,
        admittedInternalObjectCount: profileCoverage.indexSummary.admittedInternalObjectCount,
        fallbackPrimitiveCount: profileCoverage.indexSummary.fallbackPrimitiveCount,
      },
      supplementalToddRoutes: {
        routePackCount: routePack.routeCount,
        separateFromExplorerIndex: true,
        internalPrimitiveCount: routePack.internalPrimitiveCount,
        paperCrosswalkCount: routePack.paperCrosswalkCount,
      },
      newGeometryCount: 0,
      newSameCellJoins: 0,
      newRegistrations: 0,
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.77 manifest retains source-file hashes captured at release time. Its historical verifier checks the sealed manifest and receipt shape without requiring later mutable project files to keep matching those hashes.",
      },
    },
  };
  const manifestContentSha256 = computeManifestContentSha256(manifest);
  const sealed = { ...manifest, manifestContentSha256 };
  return { manifest: sealed, bytes: Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest278()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_278_PATH, bytes);
      process.stdout.write(`${process.argv.includes("--write") ? "Wrote" : "Built"} ${path.relative(ROOT, MANIFEST_278_PATH)}: ${manifest.integrity.inputCount} inputs; ${manifest.registrySummary.researchUpgradeCount} queue rows; ${manifest.exactReferences.explorerRecordDetailCoverage.explorerRecordCount} Explorer records\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
