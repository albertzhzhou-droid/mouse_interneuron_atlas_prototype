#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_259, validateResearchIterationManifest259Snapshot } from "../scripts/validate-research-iteration-manifest-2.59-snapshot.mjs";
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
import { loadAndValidatePkd2l1IndependentPopulationContext } from "../scripts/validate-pkd2l1-independent-population-context-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_260_PATH = path.join(ROOT, "data/research-iteration-manifest-2.60.json");
export const INPUTS_260 = Object.freeze([
  ["sealedIteration259Manifest", "data/research-iteration-manifest-2.59.json"],
  ["pkd2l1PopulationContextData", "data/pkd2l1-independent-population-context-0.1.json"],
  ["pkd2l1PopulationContextSchema", "schemas/pkd2l1-independent-population-context-0.1.schema.json"],
  ["pkd2l1PopulationContextValidator", "scripts/validate-pkd2l1-independent-population-context-0.1.mjs"],
  ["pkd2l1PopulationContextTests", "tests/pkd2l1-independent-population-context.test.mjs"],
  ["pkd2l1PopulationContextComponent", "app/Pkd2l1IndependentPopulationContext.tsx"],
  ["sealedIteration259SnapshotValidator", "scripts/validate-research-iteration-manifest-2.59-snapshot.mjs"],
  ["sealedIteration259SnapshotTests", "tests/research-iteration-manifest-2.59-snapshot.test.mjs"],
  ["iteration260Builder", "tools/build_research_iteration_manifest_2_60.mjs"],
  ["iteration260Validator", "scripts/validate-research-iteration-manifest-2.60.mjs"],
  ["iteration260Tests", "tests/research-iteration-manifest-2.60.test.mjs"],
  ["iteration260Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_60.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest260() {
  const parentReceipt = await validateResearchIterationManifest259Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, pkd2l1Receipt] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    loadAndValidatePkd2l1IndependentPopulationContext(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== parent.registrySummary.canonicalSourcePackageCount
    || sourceSummary.recordSetCount !== parent.registrySummary.canonicalRecordSetCount
    || sourceSummary.bundledExactRosterCount !== parent.registrySummary.bundledExactRosterCount
    || sourceSummary.bundledExactSourceObjectSetCount !== parent.registrySummary.bundledExactObjectSetCount) {
    throw new Error("2.60 source-registry denominators differ from the sealed 2.59 source-package boundary");
  }
  if (upgrades.upgradeCount !== 217 || upgrades.displayedUpgradeCount !== 31 || denominatorReceipt.staleLiteralCount !== 0) {
    throw new Error("2.60 live research-upgrade or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.60 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_260.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.60 PKD2L1 cohort context, immutable 2.59 rollback, validation, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.60 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.60.0-research.1") throw new Error("2.60 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.60.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.60.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_259.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_259.bytes,
    fileSha256: SNAPSHOT_259.fileSha256,
    contentSha256: SNAPSHOT_259.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.60 adds attributed, article-reported PKD2L1-positive population summaries from a separate mouse cohort to the Crozat dossier. The 811 histological sections remain nested within 18 mice; age, sex and region summaries are separate marginals. Raw image files are not publicly deposited in the reviewed article and are not bundled. No cell-specific morphology, geometry, Crozat same-cell join, interneuron count, or atlas registration is admitted. UPG-235 remains a public-deposit watch.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };

  const context = pkd2l1Receipt.context;
  const boundary = context.identityAndRepresentationBoundary;
  manifest.exactReferences.pkd2l1IndependentPopulationContext260 = {
    contextId: context.contextId,
    contextReceipt: { path: INPUTS_260.find(([id]) => id === "pkd2l1PopulationContextData")[1], ...byId.get("pkd2l1PopulationContextData") },
    schemaReceipt: { path: INPUTS_260.find(([id]) => id === "pkd2l1PopulationContextSchema")[1], ...byId.get("pkd2l1PopulationContextSchema") },
    mouseCount: context.studyFrame.mouseCount,
    sectionCount: context.studyFrame.sectionCount,
    ageSectionCounts: context.studyFrame.sectionCountsByAge.map(({ label, count }) => ({ label, count })),
    sexSectionCounts: context.studyFrame.sectionCountsBySex.map(({ label, count }) => ({ label, count })),
    regionSectionCountsRetained: context.publishedSummaries.filter((row) => row.stratum === "spinal_region").map(({ group, sectionsInStudyFrame }) => ({ group, count: sectionsInStudyFrame })),
    tableFiveSummaryCount: context.publishedSummaries.length,
    reportedImagePixelSizesMicrometers: {
      wholeCord: context.imagingMethods.wholeCordImages.pixelSizeMicrometers,
      centralCanal: context.imagingMethods.centralCanalImages.pixelSizeMicrometers,
    },
    publicRawDataDepositVerified: context.source.publicRawDataDepositVerified,
    rawImageFilesBundled: context.source.rawImageFilesBundled,
    perCellCoordinatesAvailable: boundary.perCellCoordinatesAvailable,
    perCellMorphologyAvailable: boundary.perCellMorphologyAvailable,
    reconstructedCellsAdmitted: boundary.reconstructedCellsAdmitted,
    geometryPrimitivesAdmitted: boundary.geometryPrimitivesAdmitted,
    sameCellJoinToCrozat: boundary.sameCellJoinToCrozat,
    atlasRegistrationCount: boundary.atlasRegistrationCount,
    includedInInterneuronTypeCounts: boundary.includedInInterneuronTypeCounts,
    researchUpgradeId: "UPG-234",
  };
  manifest.exactReferences.researchRegistryDenominators260 = {
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    sourceProfileCount: sourceSummary.typeRecordCount,
    upgradeCount: upgrades.upgradeCount,
    displayedUpgradeCount: upgrades.displayedUpgradeCount,
    denominatorDisplayCount: denominatorReceipt.enumeratedDisplayCount,
    staleCanonicalDenominatorLiteralCount: denominatorReceipt.staleLiteralCount,
  };
  manifest.exactReferences.iteration260Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_60.md",
    rollbackParent: SNAPSHOT_259.path,
  };

  manifest.scientificBoundaries.pkd2l1IndependentPopulationContext260 = "Leblond et al. Table 5 supplies eight stratum-level means, standard deviations and ranges for PKD2L1-positive cells per histological section and centroid distance from the central-canal centre. The study includes 18 mice and 811 nested sections; age/sex section counts reconcile independently, while region-specific section denominators are not retained. The raw-data statement does not identify a public repository deposit, and no image files are bundled. Distal labelled-cell identity is uncertain. These marginal population summaries create no interneuron denominator, per-cell coordinates or morphology, Crozat same-cell link, internal primitives, or atlas registration.";
  manifest.scientificBoundaries.researchRegistryDenominators260 = `The live registry resolves ${sourceSummary.sourceCount} canonical sources, ${sourceSummary.recordSetCount} record sets, ${sourceSummary.bundledExactRosterCount} exact cell/profile rosters, ${sourceSummary.bundledExactSourceObjectSetCount} exact source-object sets, ${sourceSummary.typeRecordCount} source profiles, and ${upgrades.upgradeCount} research/model upgrades. ${upgrades.displayedUpgradeCount} research-facing upgrade identifiers resolve; canonical display denominators are registry-derived with ${denominatorReceipt.staleLiteralCount} stale literals. Historical registry receipts remain sealed.`;
  manifest.scientificBoundaries.iteration260Layout = "Iteration 2.60 updates the existing workspace and adds one source-context contract, a dossier information card, validators/tests, a sealed 2.59 rollback snapshot, and one unique timeline. No complete project copy or source-image/geometry bundle was created. The rollback parent is the immutable 2.59 manifest.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest260();
    if (flag === "--write") await writeFile(MANIFEST_260_PATH, bytes);
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, tableFiveSummaryCount: manifest.exactReferences.pkd2l1IndependentPopulationContext260.tableFiveSummaryCount, fullProjectCopyCount: manifest.exactReferences.iteration260Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
