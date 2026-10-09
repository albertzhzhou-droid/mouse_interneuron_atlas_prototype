#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_267, validateResearchIterationManifest267Snapshot } from "../scripts/validate-research-iteration-manifest-2.67-snapshot.mjs";
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
import { validateBILXeniumSpinalAudit } from "../scripts/validate-bil-xenium-spinal-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_268_PATH = path.join(ROOT, "data/research-iteration-manifest-2.68.json");
export const INPUTS_268 = Object.freeze([
  ["sealedIteration267SnapshotManifest", "data/research-iteration-manifest-2.67.json"],
  ["bilXeniumSpinalAudit", "data/bil-xenium-spinal-audit-0.1.json"],
  ["bilXeniumAuditValidator", "scripts/validate-bil-xenium-spinal-audit-0.1.mjs"],
  ["bilXeniumAuditTests", "tests/bil-xenium-spinal-audit.test.mjs"],
  ["iteration267SnapshotValidator", "scripts/validate-research-iteration-manifest-2.67-snapshot.mjs"],
  ["iteration267SnapshotTests", "tests/research-iteration-manifest-2.67-snapshot.test.mjs"],
  ["iteration268Builder", "tools/build_research_iteration_manifest_2_68.mjs"],
  ["iteration268Validator", "scripts/validate-research-iteration-manifest-2.68.mjs"],
  ["iteration268Tests", "tests/research-iteration-manifest-2.68.test.mjs"],
  ["iteration268Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_68.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest268() {
  const parentReceipt = await validateResearchIterationManifest267Snapshot();
  const parent = JSON.parse(await readFile(path.join(ROOT, SNAPSHOT_267.path), "utf8"));
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, xeniumAudit] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    validateBILXeniumSpinalAudit(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.68 source-registry denominators differ from immutable 2.67");
  }
  if (upgrades.upgradeCount !== 226 || upgrades.displayedUpgradeCount !== 39 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.summary.byStatus.completed !== 65
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-244"
    || !upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-244")?.status.startsWith("planned")) {
    throw new Error("2.68 research-upgrade, planned UPG-244, or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.68 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_268.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.68 BIL Xenium source audit, immutable 2.67 rollback, tests, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.68 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.68.0-research.1") throw new Error("2.68 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.68.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.68.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_267.path,
    releaseId: parentReceipt.releaseId,
    bytes: SNAPSHOT_267.bytes,
    fileSha256: SNAPSHOT_267.fileSha256,
    contentSha256: SNAPSHOT_267.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.68 adds a source-linked researcher-facing reference to the adult mouse spinal-cord Xenium resource and pins a metadata-only availability audit. The linked preprint reports 523 sections, 14 eight-week mice and a 480-gene panel; BIL exposes a 16-folder run/slide directory with cell, nucleus-boundary and transcript file names, but exact object schemas, sample/type crosswalks and dataset-specific rights remain unverified. The panel treats this as a candidate 2D spatial molecular lane, not 3D cell morphology or an interneuron roster. Zero data payloads or geometry are admitted.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.researchRegistryDenominators268 = {
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    sourceProfileCount: sourceSummary.typeRecordCount,
    upgradeCount: upgrades.upgradeCount,
    completedUpgradeCount: upgradeRegistry.summary.byStatus.completed,
    displayedUpgradeCount: upgrades.displayedUpgradeCount,
    denominatorDisplayCount: denominatorReceipt.enumeratedDisplayCount,
    staleCanonicalDenominatorLiteralCount: denominatorReceipt.staleLiteralCount,
  };
  manifest.exactReferences.bilXeniumSpatialAudit244 = {
    researchUpgradeId: xeniumAudit.researchUpgradeId,
    publicationStatus: xeniumAudit.publicationStatus,
    listedRunSlideFolderCount: xeniumAudit.listedRunSlideFolderCount,
    paperReportedAnimals: xeniumAudit.paperReportedAnimals,
    paperReportedSections: xeniumAudit.paperReportedSections,
    targetedGeneCount: 480,
    paperReportedNeuronCellCount: xeniumAudit.paperReportedNeuronCellCount,
    datasetSpecificRightsVerified: xeniumAudit.datasetSpecificRightsVerified,
    payloadBytesDownloaded: xeniumAudit.payloadBytesDownloaded,
    admittedSectionLocalBoundaryObjects: xeniumAudit.admittedSectionLocalObjects,
    exactInterneuronRosterRows: xeniumAudit.exactInterneuronRosterRows,
    admittedThreeDimensionalCellObjects: xeniumAudit.admittedThreeDimensionalCellObjects,
    joins: 0,
    registrations: 0,
    measurements: 0,
  };
  manifest.exactReferences.iteration268Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_68.md",
    rollbackParent: SNAPSHOT_267.path,
  };
  manifest.scientificBoundaries.bilXeniumSpatialAudit244 = "UPG-244 is a preprint-linked and directory-observed 2D source candidate, not a 3D cell or interneuron model. The listed filenames do not verify table schemas, exact cell IDs, sample/section mapping, type assignments, coordinate units/orientation, checksum, or asset-specific rights. BIL reports a general CC BY-SA 4.0 distribution policy but the reviewed collection also displays a repository-under-review notice; this iteration downloads and retains no payload. GABA neuron-type counts are not an interneuron denominator; no cell/nucleus boundary, transcript point, same-cell join, morphology join, atlas registration, measurement or 3D extrusion is admitted.";
  manifest.scientificBoundaries.iteration268Layout = "Iteration 2.68 adds a compact source-linked Xenium availability panel and an independently validated UPG-244 audit to the existing app. It seals the exact 2.67 manifest as the immutable parent, refreshes only current project input receipts, downloads no BIL payload and creates no full-project copy.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest268()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_268_PATH, bytes);
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, displayedUpgradeCount: manifest.exactReferences.researchRegistryDenominators268.displayedUpgradeCount, xeniumAudit: manifest.exactReferences.bilXeniumSpatialAudit244.researchUpgradeId, payloadBytesDownloaded: manifest.exactReferences.bilXeniumSpatialAudit244.payloadBytesDownloaded, admitted3DCellObjects: manifest.exactReferences.bilXeniumSpatialAudit244.admittedThreeDimensionalCellObjects, fullProjectCopyCount: manifest.exactReferences.iteration268Layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
