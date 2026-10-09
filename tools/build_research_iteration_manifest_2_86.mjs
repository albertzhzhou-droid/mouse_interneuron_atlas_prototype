#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_285, validateResearchIterationManifest285Snapshot } from "../scripts/validate-research-iteration-manifest-2.85-snapshot.mjs";
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
import { buildExactRecordDetailCoverage } from "../app/exact-record-detail-coverage.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_286_PATH = path.join(ROOT, "data/research-iteration-manifest-2.86.json");
export const INPUTS_286 = Object.freeze([
  "data/research-iteration-manifest-2.85.json",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "scripts/validate-research-source-registry-denominators.mjs",
  "data/research-model-upgrade-registry-0.1.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "public/data/research_explorer_index_v1/search-index.json",
  "app/exact-record-detail-coverage.js",
  "app/InternalStructureReferencePanel.tsx",
  "app/globals.css",
  "tests/exact-record-detail-coverage.test.mjs",
  "package.json",
  "package-lock.json",
  "tools/run_current_research_tests.mjs",
  "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_86.md",
  "tests/research-iteration-manifest-2.86-snapshot.test.mjs",
  "tools/build_research_iteration_manifest_2_86.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) {
    throw new Error(`Invalid 2.86 input path: ${relativePath}`);
  }
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function summarizeInternalDetailNormalization(records) {
  const rows = ["nucleus", "organelles", "synaptic_structures", "receptor_distribution"];
  let sharedBoundaryRecordCount = 0;
  let repeatedSlotDetailRecordCount = 0;
  for (const record of records) {
    const focus = { focusKind: record.focusKind, focusId: record.focusId };
    const coverage = buildExactRecordDetailCoverage({
      indexState: { status: "ready", index: { records }, records },
      activeRecordState: {
        status: "ready",
        requestKey: record.key,
        focusKind: record.focusKind,
        focusId: record.focusId,
        record,
      },
      focus,
    });
    if (!coverage.sharedInternalBoundary) continue;
    sharedBoundaryRecordCount += 1;
    const details = coverage.rows.filter((row) => rows.includes(row.id)).map((row) => row.detail);
    if (details.length !== rows.length || new Set(details).size !== rows.length) repeatedSlotDetailRecordCount += 1;
  }
  return { recordCount: records.length, sharedBoundaryRecordCount, repeatedSlotDetailRecordCount };
}

export async function buildResearchIterationManifest286() {
  const parent = await validateResearchIterationManifest285Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, packageJson, lockJson, explorerIndex] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "public/data/research_explorer_index_v1/search-index.json"), "utf8").then(JSON.parse),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const deduplication = summarizeInternalDetailNormalization(explorerIndex.records);
  const upgrade258 = upgradeRegistry.upgrades.find((item) => item.id === "UPG-258");

  if (packageJson.version !== "2.86.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) {
    throw new Error("2.86 application and lockfile versions must match");
  }
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) {
    throw new Error("2.86 canonical source denominators changed unexpectedly");
  }
  if (upgrades.upgradeCount !== 240 || upgrades.displayedUpgradeCount !== 45 || upgradeRegistry.summary.byStatus.completed !== 70
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-258" || upgrade258?.lane !== "internal_microdetail"
    || upgrade258?.status !== "completed") {
    throw new Error("2.86 upgrade queue state or UPG-258 presentation increment changed unexpectedly");
  }
  if (deduplication.recordCount !== 641 || deduplication.sharedBoundaryRecordCount !== 536
    || deduplication.repeatedSlotDetailRecordCount !== 0 || denominators.staleLiteralCount !== 0
    || layout.fullProjectCopyCount !== 0) {
    throw new Error("2.86 active-record detail matrix, denominator, or in-place iteration boundary changed");
  }

  const inputs = await Promise.all(INPUTS_286.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.86 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.86.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.86.0",
    releaseDate: "2026-09-24",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_285.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_285.bytes,
      fileSha256: SNAPSHOT_285.fileSha256,
      contentSha256: SNAPSHOT_285.contentSha256,
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
      activeRecordInternalDetailNormalization: {
        researchUpgradeId: "UPG-258",
        explorerIndexPath: "public/data/research_explorer_index_v1/search-index.json",
        exactExplorerRecordCount: deduplication.recordCount,
        sharedInternalBoundaryRecordCount: deduplication.sharedBoundaryRecordCount,
        repeatedFourSlotRecordCountBefore: 165,
        repeatedFourSlotRecordCountAfter: deduplication.repeatedSlotDetailRecordCount,
        normalizedSlotIds: ["nucleus", "organelles", "synaptic_structures", "receptor_distribution"],
        sharedBoundaryRenderedOncePerRecord: true,
        perSlotLocatorsRetained: true,
        admittedGeometryDelta: 0,
        sameCellJoinDelta: 0,
        registrationDelta: 0,
        mouseDenominatorDelta: 0,
      },
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.85 manifest retains release-time file hashes. This snapshot validates its sealed receipt without rebuilding it from mutable current project inputs.",
      },
    },
  };
  const sealed = { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
  return { manifest: sealed, bytes: Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest286()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_286_PATH, bytes);
      process.stdout.write(`${process.argv.includes("--write") ? "Wrote" : "Built"} ${path.relative(ROOT, MANIFEST_286_PATH)}: ${manifest.integrity.inputCount} inputs; ${manifest.exactReferences.activeRecordInternalDetailNormalization.exactExplorerRecordCount} exact records, repeated slot details 165 → 0\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
