#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import micronsReference from "../data/microns-observed-cell-nucleus-reference-0.1.json" with { type: "json" };
import micronsAudit from "../data/microns-subcellular-source-audit-0.1.json" with { type: "json" };
import bancMorphologyRoute from "../data/banc-v888-in14a018-morphology-route-0.1.json" with { type: "json" };
import bancInternalAudit from "../data/banc-v888-internal-object-source-audit-0.1.json" with { type: "json" };
import bancMitochondriaAudit from "../data/banc-v888-mitochondria-route-audit-0.1.json" with { type: "json" };
import superClemReference from "../data/super-clem-palm-localization-reference-0.1.json" with { type: "json" };
import microStructFormerReference from "../data/microstructformer-ultrastructure-reference-0.1.json" with { type: "json" };
import nativeContourAudit from "../data/todd-native-contour-topology-audit-0.1.json" with { type: "json" };
import { buildIndependentSourceObjectCoverage } from "../app/independent-source-object-coverage.js";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_283, validateResearchIterationManifest283Snapshot } from "../scripts/validate-research-iteration-manifest-2.83-snapshot.mjs";
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
export const MANIFEST_284_PATH = path.join(ROOT, "data/research-iteration-manifest-2.84.json");
export const INPUTS_284 = Object.freeze([
  "data/research-iteration-manifest-2.83.json",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "scripts/validate-research-source-registry-denominators.mjs",
  "data/research-model-upgrade-registry-0.1.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "app/IndependentSourceObjectCoverage.tsx",
  "app/independent-source-object-coverage.js",
  "app/InternalStructureReferencePanel.tsx",
  "app/SuperClemPalmLocalizationReference.tsx",
  "app/MicroStructFormerUltrastructureReference.tsx",
  "app/BancV888IN14A018MorphologyReference.tsx",
  "app/globals.css",
  "data/microns-observed-cell-nucleus-reference-0.1.json",
  "data/microns-subcellular-source-audit-0.1.json",
  "data/banc-v888-in14a018-morphology-route-0.1.json",
  "data/banc-v888-internal-object-source-audit-0.1.json",
  "data/banc-v888-mitochondria-route-audit-0.1.json",
  "data/super-clem-palm-localization-reference-0.1.json",
  "data/microstructformer-ultrastructure-reference-0.1.json",
  "data/todd-native-contour-topology-audit-0.1.json",
  "tests/independent-source-object-coverage.test.mjs",
  "tests/cross-region-internal-reference.test.mjs",
  "tests/rendered-html.test.mjs",
  "package.json",
  "package-lock.json",
  "tools/run_current_research_tests.mjs",
  "scripts/validate-research-iteration-manifest-2.83-snapshot.mjs",
  "tests/research-iteration-manifest-2.83-snapshot.test.mjs",
  "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_83.md",
  "docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_84.md",
  "tests/research-iteration-manifest-2.84-snapshot.test.mjs",
  "tools/build_research_iteration_manifest_2_84.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Invalid 2.84 input path: ${relativePath}`);
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest284() {
  const parent = await validateResearchIterationManifest283Snapshot();
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
  const coverage = buildIndependentSourceObjectCoverage({
    micronsReference,
    micronsAudit,
    bancMorphologyRoute,
    bancInternalAudit,
    bancMitochondriaAudit,
    superClemReference,
    microStructFormerReference,
    nativeContourAudit,
  });
  const upgrade252 = upgradeRegistry.upgrades.find((item) => item.id === "UPG-252");
  const upgrade256 = upgradeRegistry.upgrades.find((item) => item.id === "UPG-256");
  if (packageJson.version !== "2.84.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) throw new Error("2.84 application and lockfile versions must match");
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) {
    throw new Error("2.84 canonical source denominators changed unexpectedly");
  }
  if (upgrades.upgradeCount !== 238 || upgrades.displayedUpgradeCount !== 44 || upgradeRegistry.summary.byStatus.completed !== 69
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-256" || !upgrade252?.status.startsWith("partially completed")
    || !upgrade256?.status.startsWith("research watch")) {
    throw new Error("2.84 research queue state changed unexpectedly");
  }
  if (coverage.length !== 5 || new Set(coverage.map((item) => item.id)).size !== 5
    || denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0) {
    throw new Error("2.84 source-object index, canonical denominators or in-place layout boundary changed");
  }

  const inputs = await Promise.all(INPUTS_284.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.84 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.84.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.84.0",
    releaseDate: "2026-09-24",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_283.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_283.bytes,
      fileSha256: SNAPSHOT_283.fileSha256,
      contentSha256: SNAPSHOT_283.contentSha256,
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
        sourceCoverageIndexDefaultOpen: false,
        independentReferencesCreateSameCellLink: false,
      },
      independentSourceObjectCoverage: {
        registryIds: coverage.map((item) => item.id),
        sourceSpecificCountsPooled: false,
        rowsHaveExactIdsOrExplicitMissingness: coverage.every((item) => Boolean(item.objectIds)),
        rowsHaveSourceFrameAndScaleStatement: coverage.every((item) => Boolean(item.coordinateFrame && item.resolution)),
        rowsHaveCompletenessAndRightsBoundary: coverage.every((item) => Boolean(item.completeness && item.rights)),
        detailedSourceLinks: coverage.every((item) => item.detailHref.length > 0 && item.sourceUrl.startsWith("https://")),
        newGeometryCount: 0,
        newSameCellJoins: 0,
        newRegistrations: 0,
      },
      neuromorphoApiDiscovery: {
        researchUpgradeId: "UPG-256",
        candidateQueryExecuted: false,
        recordsImported: 0,
        dynamicCountAcceptedAsSnapshotDenominator: false,
      },
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.83 manifest retains release-time file hashes. This snapshot validates its sealed receipt without rebuilding it from mutable current project inputs.",
      },
    },
  };
  const sealed = { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
  return { manifest: sealed, bytes: Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest284()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_284_PATH, bytes);
      process.stdout.write(`${process.argv.includes("--write") ? "Wrote" : "Built"} ${path.relative(ROOT, MANIFEST_284_PATH)}: ${manifest.integrity.inputCount} inputs; five source-local registries indexed; 0 new geometry or joins\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
