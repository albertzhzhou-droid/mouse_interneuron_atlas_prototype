#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_279, validateResearchIterationManifest279Snapshot } from "../scripts/validate-research-iteration-manifest-2.79-snapshot.mjs";
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
import { validateTrevisanV1AgeAtlasReference01 } from "../scripts/validate-trevisan-v1-age-atlas-reference-0.1.mjs";
import { validateTrevisanV1SourceDataAvailabilityAudit01 } from "../scripts/validate-trevisan-v1-source-data-availability-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_280_PATH = path.join(ROOT, "data/research-iteration-manifest-2.80.json");
export const INPUTS_280 = Object.freeze([
  "data/research-iteration-manifest-2.79.json",
  "data/research-source-registry-0.1.json",
  "scripts/validate-research-source-registry-0.1.mjs",
  "scripts/validate-research-source-registry-denominators.mjs",
  "data/research-model-upgrade-registry-0.1.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "data/trevisan-v1-age-atlas-reference-0.1.json",
  "schemas/trevisan-v1-age-atlas-reference-0.1.schema.json",
  "scripts/validate-trevisan-v1-age-atlas-reference-0.1.mjs",
  "tests/trevisan-v1-age-atlas-reference.test.mjs",
  "data/trevisan-v1-source-data-availability-audit-0.1.json",
  "schemas/trevisan-v1-source-data-availability-audit-0.1.schema.json",
  "scripts/validate-trevisan-v1-source-data-availability-audit-0.1.mjs",
  "tests/trevisan-v1-source-data-availability-audit.test.mjs",
  "app/TrevisanV1AgeAtlas.tsx",
  "app/research-iteration.js",
  "app/layout.tsx",
  "app/AtlasPrototype.tsx",
  "app/InterneuronTypeAtlas.tsx",
  "app/globals.css",
  "package.json",
  "package-lock.json",
  "tools/run_current_research_tests.mjs",
  "tests/rendered-html.test.mjs",
  "tests/research-iteration-manifest-2.79-snapshot.test.mjs",
  "tests/research-iteration-manifest-2.80-snapshot.test.mjs",
  "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_80.md",
  "tools/build_research_iteration_manifest_2_80.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function inputReceipt(relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.split("/").includes("..")) throw new Error(`Invalid 2.80 input path: ${relativePath}`);
  const bytes = await readFile(path.join(ROOT, relativePath));
  return { path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest280() {
  const parent = await validateResearchIterationManifest279Snapshot();
  const [sourceRegistry, upgradeRegistry, upgrades, denominators, layout, packageJson, lockJson, trevisan, audit] = await Promise.all([
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateCanonicalResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "package-lock.json"), "utf8").then(JSON.parse),
    validateTrevisanV1AgeAtlasReference01(),
    validateTrevisanV1SourceDataAvailabilityAudit01(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (packageJson.version !== "2.80.0-research.1" || lockJson.version !== packageJson.version
    || lockJson.packages?.[""]?.version !== packageJson.version) throw new Error("2.80 application and lockfile versions must match");
  if (sourceSummary.sourceCount !== 31 || sourceSummary.recordSetCount !== 41 || sourceSummary.bundledExactRosterCount !== 13
    || sourceSummary.bundledExactSourceObjectSetCount !== 4 || sourceSummary.typeRecordCount !== 387) {
    throw new Error("2.80 canonical source denominators changed unexpectedly");
  }
  const v1Upgrade = upgradeRegistry.upgrades.find((item) => item.id === "UPG-040");
  const rosterAudit = upgradeRegistry.upgrades.find((item) => item.id === "UPG-254");
  if (upgrades.upgradeCount !== 236 || upgrades.displayedUpgradeCount !== 43 || upgradeRegistry.summary.byStatus.completed !== 69
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-254"
    || !v1Upgrade?.status.startsWith("partially completed")
    || !rosterAudit?.status.startsWith("partially completed")) throw new Error("2.80 research queue state changed unexpectedly");
  if (denominators.staleLiteralCount !== 0 || layout.fullProjectCopyCount !== 0
    || trevisan.reportedClusterCount !== 14 || trevisan.selectedNucleusCount !== 89494
    || trevisan.exactPerClusterCountsImported !== false || trevisan.morphologyGeometryObjectCount !== 0
    || trevisan.internalStructureObjectCount !== 0 || trevisan.canonicalSourceProfileContribution !== 0
    || audit.geoAccession !== "GSE275595" || audit.barcodeToCountMatrixRowCrosswalkValidated !== false
    || audit.geoFileSpecificReuseTermsVerified !== false || audit.canonicalSourceProfileContribution !== 0
    || audit.morphologyGeometryObjectCount !== 0) {
    throw new Error("2.80 canonical denominator, V1 source audit or no-admission validation failed");
  }

  const inputs = await Promise.all(INPUTS_280.map(inputReceipt));
  if (new Set(inputs.map((input) => input.path)).size !== inputs.length) throw new Error("Duplicate 2.80 input receipt");
  const manifest = {
    manifestSchemaVersion: "2.80.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.80.0",
    releaseDate: "2026-09-23",
    releaseStatus: "localhost_research_iteration",
    application: { name: "ohri-mouse-interneuron-atlas-prototype", version: packageJson.version },
    parentIterationManifest: {
      path: SNAPSHOT_279.path,
      releaseId: parent.releaseId,
      bytes: SNAPSHOT_279.bytes,
      fileSha256: SNAPSHOT_279.fileSha256,
      contentSha256: SNAPSHOT_279.contentSha256,
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
      trevisanV1SourceAvailability: {
        auditId: audit.auditId,
        doi: "10.1038/s41467-026-76522-3",
        geoAccession: audit.geoAccession,
        selectedStudyWideNucleusCount: audit.selectedStudyWideNucleusCount,
        observedInteractiveAnnotationFields: ["age", "replicate", "seurat_clusters"],
        publishedScriptCellMetadataFields: ["age", "replicate", "region", "seurat_clusters"],
        sourceCodeLicense: "MIT",
        exactBarcodeRosterSourceReported: true,
        supplementaryWorkbookInspected: false,
        barcodeToCountMatrixRowCrosswalkValidated: false,
        perNucleusAgeClusterRegionRowsValidated: false,
        geoFileSpecificReuseTermsVerified: false,
        integratedObjectBundled: false,
        canonicalSourceProfileContribution: audit.canonicalSourceProfileContribution,
        includedInExisting387ProfileDenominator: false,
        includedInMain3dScene: false,
        morphologyGeometryObjectCount: audit.morphologyGeometryObjectCount,
        internalStructureObjectCount: 0,
        sameCellJoinCount: 0,
        atlasRegistrationCount: 0,
        measurementCount: 0,
      },
      newGeometryCount: 0,
      newSameCellJoins: 0,
      newRegistrations: 0,
      fullProjectCopyCount: layout.fullProjectCopyCount,
      historicalParent: {
        inputByteReplayRequired: false,
        note: "The 2.79 manifest retains release-time file hashes. This snapshot validates the sealed parent receipt and its recorded input-receipt shape without rebuilding it from mutable current project inputs.",
      },
    },
  };
  const sealed = { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
  return { manifest: sealed, bytes: Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest280()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_280_PATH, bytes);
      process.stdout.write(`${process.argv.includes("--write") ? "Wrote" : "Built"} ${path.relative(ROOT, MANIFEST_280_PATH)}: ${manifest.integrity.inputCount} inputs; ${manifest.registrySummary.researchUpgradeCount} queue rows; UPG-254 ${manifest.exactReferences.trevisanV1SourceAvailability.auditId}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
