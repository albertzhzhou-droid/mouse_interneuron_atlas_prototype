#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_263, validateResearchIterationManifest263Snapshot } from "../scripts/validate-research-iteration-manifest-2.63-snapshot.mjs";
import { validateSvaraLarvalZebrafishSpinalSbemReference } from "../scripts/validate-svara-larval-zebrafish-spinal-sbem-reference-0.1.mjs";
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
export const MANIFEST_264_PATH = path.join(ROOT, "data/research-iteration-manifest-2.64.json");
export const INPUTS_264 = Object.freeze([
  ["sealedIteration263SnapshotValidator", "scripts/validate-research-iteration-manifest-2.63-snapshot.mjs"],
  ["sealedIteration263SnapshotTests", "tests/research-iteration-manifest-2.63-snapshot.test.mjs"],
  ["svaraComparativeReferenceData", "data/svara-larval-zebrafish-spinal-sbem-reference-0.1.json"],
  ["svaraComparativeReferenceSchema", "schemas/svara-larval-zebrafish-spinal-sbem-reference-0.1.schema.json"],
  ["svaraComparativeReferenceValidator", "scripts/validate-svara-larval-zebrafish-spinal-sbem-reference-0.1.mjs"],
  ["svaraComparativeReferenceTests", "tests/svara-larval-zebrafish-spinal-sbem-reference.test.mjs"],
  ["svaraComparativeReferenceComponent", "app/SvaraLarvalZebrafishSpinalSbemReference.tsx"],
  ["iteration264Builder", "tools/build_research_iteration_manifest_2_64.mjs"],
  ["iteration264Validator", "scripts/validate-research-iteration-manifest-2.64.mjs"],
  ["iteration264Tests", "tests/research-iteration-manifest-2.64.test.mjs"],
  ["iteration264Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_64.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

async function buildSvaraReferenceReceipt() {
  const audit = JSON.parse(await readFile(path.join(ROOT, "data/svara-larval-zebrafish-spinal-sbem-reference-0.1.json"), "utf8"));
  const validation = await validateSvaraLarvalZebrafishSpinalSbemReference(audit);
  if (validation.specimenCount !== 1 || validation.listedSupplementPackageCount !== 3
    || validation.inspectedSupplementPackageCount !== 0 || validation.admittedNeuronObjectCount !== 0
    || validation.admittedGeometryCount !== 0 || validation.downloadedPayloadBytes !== 0) throw new Error("Svara source-only comparative reference receipt changed");
  return {
    contractId: audit.contractId,
    auditDate: audit.auditDate,
    doi: audit.source.doi,
    species: audit.biologicalScope.species,
    lifeStage: audit.biologicalScope.lifeStage,
    specimenCount: audit.biologicalScope.specimenCount,
    reportedVolumeLengthMicrometre: audit.acquisition.reportedVolumeLengthMicrometre,
    reportedVoxelPitchNanometre: audit.acquisition.reportedVoxelPitchNanometre,
    sourceAxisOrderNamed: audit.acquisition.axisOrderNamed,
    somataInVolume: audit.acquisition.segmentCoverage.somataInVolume,
    motoneuronCount: audit.publishedReconstructions.motoneurons.count,
    morphologyConsistentCiDCount: audit.publishedReconstructions.morphologyConsistentCiDs.count,
    completelyTracedCellContext: audit.publishedReconstructions.morphologyConsistentCiDs.completelyTracedCellContext,
    geneticV2aAssignmentAvailable: audit.publishedReconstructions.morphologyConsistentCiDs.geneticV2aAssignmentAvailable,
    coBLCount: audit.publishedReconstructions.CoBLs.count,
    listedSupplementPackages: audit.supplementPackages.packages.map((pkg) => ({ repositoryComponentId: pkg.repositoryComponentId, filename: pkg.filename })),
    inspectedSupplementPackageCount: validation.inspectedSupplementPackageCount,
    supplementSizesKnown: audit.supplementPackages.fileSizesBytes !== null,
    supplementChecksumsKnown: audit.supplementPackages.checksums !== null,
    supplementMemberFormatsKnown: audit.supplementPackages.memberFileFormats !== "unknown",
    supplementObjectIdsKnown: audit.supplementPackages.stableNeuronObjectIdCrosswalk !== "unknown",
    perPackageReuseTermsVerified: audit.supplementPackages.perPackageReuseTerms !== "not verified",
    articleLicense: "CC BY 4.0",
    supplementLicenseEstablishedFromArticleLicense: false,
    admittedNeuronObjects: validation.admittedNeuronObjectCount,
    admittedSkeletons: audit.identityAndGeometryBoundary.appAdmittedSkeletons,
    admittedMeshes: audit.identityAndGeometryBoundary.appAdmittedMeshes,
    admittedSynapseEdges: audit.identityAndGeometryBoundary.appAdmittedSynapseEdges,
    sameCellJoinCount: audit.identityAndGeometryBoundary.sameCellJoinCount,
    mouseIdentityTransferAllowed: audit.identityAndGeometryBoundary.mouseIdentityTransferAllowed,
    crossSpeciesCoordinateTransferAllowed: audit.identityAndGeometryBoundary.crossSpeciesCoordinateTransferAllowed,
    downloadedPayloadBytes: validation.downloadedPayloadBytes,
    linksOnly: true,
  };
}

export async function buildResearchIterationManifest264() {
  const parentReceipt = await validateResearchIterationManifest263Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, svara] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    buildSvaraReferenceReceipt(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) throw new Error("2.64 source-registry denominators differ from the sealed 2.63 source boundary");
  if (upgrades.upgradeCount !== 222 || upgrades.displayedUpgradeCount !== 35 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-240")?.status?.startsWith("planned") !== true) {
    throw new Error("2.64 live research-upgrade or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.64 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_264.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.64 comparative larval-zebrafish SBEM reference and explicit supplement/object audit boundary, sealed 2.63 rollback, tests, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.64 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.64.0-research.1") throw new Error("2.64 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.64.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.64.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_263.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_263.bytes,
    fileSha256: SNAPSHOT_263.fileSha256,
    contentSha256: SNAPSHOT_263.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.64 adds an article-level, species-separated larval-zebrafish spinal SBEM comparator and inventories the exact three author-institution-listed ZIP names. The source-reported 6 dpf volume and selected CiD/CoBL reconstruction counts are shown in a collapsed reference card. Supplement archive members, checksums, sizes, stable neuron IDs, coordinate fields and per-package rights remain unknown; no archive is copied, no zebrafish cell geometry or synapse is admitted, and no zebrafish identity or coordinate transfers to mouse.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.svaraLarvalZebrafishSpinalSbemReference264 = {
    ...svara,
    researchUpgradeId: "UPG-240",
    runtime: {
      collapsedByDefault: true,
      linkedToSelectedCell: false,
      changesActiveRecord: false,
      displaysSourceImagesOrPackageMembers: false,
      createsNeuronGeometry: false,
      createsSynapseEdges: false,
      transfersSpeciesIdentityOrCoordinates: false,
    },
  };
  manifest.exactReferences.researchRegistryDenominators264 = {
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
  manifest.exactReferences.iteration264Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_64.md",
    rollbackParent: SNAPSHOT_263.path,
  };
  manifest.scientificBoundaries.svaraLarvalZebrafishSpinalSbemReference264 = "One 6 dpf larval Danio rerio source volume is 74 × 74 × 207 μm at reported 9 × 9 × 21 nm voxel pitch; axis order is not named here. The paper reports 39 morphology-consistent CiDs among 170 completely traced cells, not genetic V2a assignments, and 34 CoBLs. The official Max Planck listing exposes three ZIP filenames, but this run did not inspect them: member formats, sizes, checksums, object crosswalk, coordinate fields, completeness and per-package terms remain unknown. CC BY 4.0 is stated for the article, not independently for each archive. No source package bytes, neuron objects, skeletons, meshes, synapse edges, same-cell joins, mouse transfer or cross-species coordinate transfer are admitted.";
  manifest.scientificBoundaries.researchRegistryDenominators264 = `The live registry resolves ${sourceSummary.sourceCount} canonical sources, ${sourceSummary.recordSetCount} record sets, ${sourceSummary.bundledExactRosterCount} exact cell/profile rosters, ${sourceSummary.bundledExactSourceObjectSetCount} exact source-object sets, ${sourceSummary.typeRecordCount} source profiles, and ${upgrades.upgradeCount} research/model upgrades. ${upgrades.displayedUpgradeCount} research-facing upgrade identifiers resolve; canonical display denominators are registry-derived with ${denominatorReceipt.staleLiteralCount} stale literals.`;
  manifest.scientificBoundaries.iteration264Layout = "Iteration 2.64 updates the existing workspace with a source-linked, collapsed larval-zebrafish SBEM evidence card, a strict metadata/reference contract, the official listing's exact supplement names, a sealed 2.63 rollback snapshot, and one unique timeline. No ZIP or other public source payload is copied; no full project copy, mouse-cell join, or new neuron/synapse geometry is added.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest264();
    if (flag === "--write") await writeFile(MANIFEST_264_PATH, bytes);
    const reference = manifest.exactReferences.svaraLarvalZebrafishSpinalSbemReference264;
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, species: reference.species, specimenCount: reference.specimenCount, listedSupplementPackageCount: reference.listedSupplementPackages.length, admittedNeuronObjects: reference.admittedNeuronObjects, admittedSkeletons: reference.admittedSkeletons, downloadedPayloadBytes: reference.downloadedPayloadBytes, fullProjectCopyCount: manifest.exactReferences.iteration264Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
