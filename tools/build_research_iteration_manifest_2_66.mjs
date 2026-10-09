#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_265, validateResearchIterationManifest265Snapshot } from "../scripts/validate-research-iteration-manifest-2.65-snapshot.mjs";
import { validatePkd2l1SbfsemPublicAvailabilityAuditFile } from "../scripts/validate-pkd2l1-sbfsem-public-availability-audit-0.1.mjs";
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_266_PATH = path.join(ROOT, "data/research-iteration-manifest-2.66.json");
export const INPUTS_266 = Object.freeze([
  ["sealedIteration265SnapshotValidator", "scripts/validate-research-iteration-manifest-2.65-snapshot.mjs"],
  ["sealedIteration265SnapshotTests", "tests/research-iteration-manifest-2.65-snapshot.test.mjs"],
  ["pkd2l1SbfsemPublicAvailabilityAudit", "data/pkd2l1-sbfsem-public-availability-audit-0.1.json"],
  ["pkd2l1SbfsemPublicAvailabilitySchema", "schemas/pkd2l1-sbfsem-public-availability-audit-0.1.schema.json"],
  ["pkd2l1SbfsemPublicAvailabilityValidator", "scripts/validate-pkd2l1-sbfsem-public-availability-audit-0.1.mjs"],
  ["pkd2l1SbfsemPublicAvailabilityTests", "tests/pkd2l1-sbfsem-public-availability-audit.test.mjs"],
  ["iteration266Builder", "tools/build_research_iteration_manifest_2_66.mjs"],
  ["iteration266Validator", "scripts/validate-research-iteration-manifest-2.66.mjs"],
  ["iteration266Tests", "tests/research-iteration-manifest-2.66.test.mjs"],
  ["iteration266Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_66.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest266() {
  const parentReceipt = await validateResearchIterationManifest265Snapshot();
  const parent = parentReceipt.manifest;
  const [audit, upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout] = await Promise.all([
    validatePkd2l1SbfsemPublicAvailabilityAuditFile(),
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.66 source-registry denominators differ from the sealed 2.65 source boundary");
  }
  if (upgrades.upgradeCount !== 224 || upgrades.displayedUpgradeCount !== 37 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.summary.byStatus.completed !== 65
    || upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-241")?.status !== "completed"
    || upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-242")?.status !== "completed") {
    throw new Error("2.66 research-upgrade, completed-audit, or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.66 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_266.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.66 bounded Nakamura SBEM public-availability and rights inventory, sealed 2.65 rollback, tests, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.66 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.66.0-research.1") throw new Error("2.66 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.66.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.66.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_265.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_265.bytes,
    fileSha256: SNAPSHOT_265.fileSha256,
    contentSha256: SNAPSHOT_265.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.66 completes the bounded public-availability and reuse-terms inventory for Nakamura et al. spinal CSF-cN SBF-SEM. Figure 4 and Video 5 provide publication media, not a source voxel volume or segmentation; no stable EM-object or video-to-cell crosswalk was found in the reviewed article/API/figures-page/site-terms scope. The article reports 71 single-cell tracing profiles, not an SBEM census. The project downloads/bundles zero payloads and admits zero EM volumes, internal geometry, joins, registrations, or measurements. UPG-188 remains the separate raw-object acquisition gate.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.pkd2l1SbfsemPublicAvailabilityAudit242 = {
    researchUpgradeId: audit.researchUpgradeId,
    doi: audit.source.doi,
    reviewedScope: audit.scope.boundary,
    articleApiBytes: audit.scope.articleApiReceipt.bytes,
    articleApiSha256: audit.scope.articleApiReceipt.sha256,
    reviewedSourceCount: audit.scope.sourcesReviewed.length,
    reportedSingleCellTracingCount: audit.articleDataAvailability.singleCellLightMicroscopyTracingPopulationCount,
    tracingCountIsSbfsemCensus: audit.articleDataAvailability.countIsSbfsemCellCensus,
    formalNumericalSourceDataFigures: audit.articleDataAvailability.formalStatementNumericalSourceDataFigures,
    articleApiSourceDataFigures: audit.articleDataAvailability.articleApiSourceDataFigureNumbers,
    figurePageCounts: audit.articleDataAvailability.officialFiguresPageCounts,
    serialSbfsemPanels: audit.figure4.representativeSbfsemSerialImagePanels,
    publicationReconstructionPanel: audit.figure4.publicationReconstructionPanel,
    video5ObjectId: audit.video5.articleApiObjectId,
    video5PixelDimensions: [audit.video5.widthPixels, audit.video5.heightPixels],
    video5Mp4Bytes: audit.video5.renditions.find((rendition) => rendition.format === "mp4")?.bytes,
    video5Mp4Etag: audit.video5.renditions.find((rendition) => rendition.format === "mp4")?.etag,
    reportedPixelSizeNanometre: audit.acquisitionMetadata.reportedPixelSizeNanometre,
    reportedSectionStepNanometre: audit.acquisitionMetadata.reportedSectionStepNanometre,
    completeStackArrayDimensions: audit.acquisitionMetadata.completeStackArrayDimensions,
    volumeAxisOrder: audit.acquisitionMetadata.volumeAxisOrder,
    noRawVolumeInReviewedScope: !audit.objectAndRightsReadiness.rawVoxelStackAvailableInReviewedScope,
    noSegmentationInReviewedScope: !audit.objectAndRightsReadiness.cellSegmentationLabelsAvailableInReviewedScope,
    stableEmObjectCrosswalkAvailable: audit.objectAndRightsReadiness.stableEmObjectCrosswalkAvailableInReviewedScope,
    articleRelatedMediaTerms: audit.objectAndRightsReadiness.articleRelatedMediaReuseTerms,
    independentAssetReuseRightsVerified: false,
    notAUniversalAbsenceClaim: audit.scope.notAUniversalAbsenceClaim,
    downloadedPayloadBytes: audit.objectAndRightsReadiness.rawVolumePayloadBytesDownloaded,
    videoBundled: audit.objectAndRightsReadiness.videoBundledByProject,
    admittedEmVolumes: audit.objectAndRightsReadiness.admittedEmVolumes,
    admittedInternalGeometry: audit.objectAndRightsReadiness.admittedCellOrOrganelleGeometry,
    admittedInternalObjects: audit.objectAndRightsReadiness.admittedInternalObjects,
    sameCellJoins: audit.objectAndRightsReadiness.sameCellJoins,
    registrations: audit.objectAndRightsReadiness.registrations,
    measurementUse: audit.objectAndRightsReadiness.measurementUse,
    keepsUpg188RawObjectAcquisitionGateOpen: true,
  };
  manifest.exactReferences.researchRegistryDenominators266 = {
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
  manifest.exactReferences.iteration266Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_66.md",
    rollbackParent: SNAPSHOT_265.path,
  };
  manifest.scientificBoundaries.pkd2l1SbfsemPublicAvailabilityAudit242 = "The bounded eLife article/API/figures-page/site-terms audit identifies Figure 4 serial images and a rendered reconstruction plus a remotely streamable Video 5, not a source-coordinate-bearing volume. The reported 71 count is light-microscopy single-cell tracing, not an SBEM census. Reported pitch and approximate depth do not provide the complete volume dimensions or axis order. No raw voxel stack, segmentation, mesh, skeleton, stable EM-object IDs, or video-to-cell crosswalk was found in the reviewed scope; absence is not universal. eLife terms give a CC-BY default for journal content unless otherwise indicated, but this audit does not establish independent asset-specific reuse rights. No media or volume bytes were downloaded or bundled; admit zero EM volumes, internal geometry, internal objects, same-cell joins, registrations, or measurements. Keep UPG-188's separate raw-object acquisition gate open.";
  manifest.scientificBoundaries.researchRegistryDenominators266 = `The live registry resolves ${sourceSummary.sourceCount} canonical sources, ${sourceSummary.recordSetCount} record sets, ${sourceSummary.bundledExactRosterCount} exact cell/profile rosters, ${sourceSummary.bundledExactSourceObjectSetCount} exact source-object sets, ${sourceSummary.typeRecordCount} source profiles, and ${upgrades.upgradeCount} research/model upgrades (${upgradeRegistry.summary.byStatus.completed} completed); ${upgrades.displayedUpgradeCount} research-facing upgrade identifiers resolve, with ${denominatorReceipt.staleLiteralCount} stale literals.`;
  manifest.scientificBoundaries.iteration266Layout = "Iteration 2.66 adds a source-bounded UPG-242 availability, media, and rights inventory to the existing workspace, extends the internal-detail reference card and validators, and seals 2.65 as an immutable rollback snapshot. It adds no media payload, source geometry, same-cell identity, registration, or full project copy.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest266();
    if (flag === "--write") await writeFile(MANIFEST_266_PATH, bytes);
    const audit = manifest.exactReferences.pkd2l1SbfsemPublicAvailabilityAudit242;
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, displayedUpgradeCount: audit ? manifest.exactReferences.researchRegistryDenominators266.displayedUpgradeCount : 0, rawVolumeInReviewedScope: audit ? !audit.noRawVolumeInReviewedScope : null, admittedInternalObjects: audit?.admittedInternalObjects, downloadedPayloadBytes: audit?.downloadedPayloadBytes, fullProjectCopyCount: manifest.exactReferences.iteration266Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
