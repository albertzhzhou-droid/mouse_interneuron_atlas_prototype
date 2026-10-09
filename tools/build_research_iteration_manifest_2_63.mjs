#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_262, validateResearchIterationManifest262Snapshot } from "../scripts/validate-research-iteration-manifest-2.62-snapshot.mjs";
import { validateMicroStructFormerUltrastructureReference } from "../scripts/validate-microstructformer-ultrastructure-reference-0.1.mjs";
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
export const MANIFEST_263_PATH = path.join(ROOT, "data/research-iteration-manifest-2.63.json");
export const INPUTS_263 = Object.freeze([
  ["sealedIteration262SnapshotValidator", "scripts/validate-research-iteration-manifest-2.62-snapshot.mjs"],
  ["sealedIteration262SnapshotTests", "tests/research-iteration-manifest-2.62-snapshot.test.mjs"],
  ["microStructFormerReferenceData", "data/microstructformer-ultrastructure-reference-0.1.json"],
  ["microStructFormerReferenceSchema", "schemas/microstructformer-ultrastructure-reference-0.1.schema.json"],
  ["microStructFormerReferenceValidator", "scripts/validate-microstructformer-ultrastructure-reference-0.1.mjs"],
  ["microStructFormerReferenceTests", "tests/microstructformer-ultrastructure-reference.test.mjs"],
  ["microStructFormerReferenceComponent", "app/MicroStructFormerUltrastructureReference.tsx"],
  ["iteration263Builder", "tools/build_research_iteration_manifest_2_63.mjs"],
  ["iteration263Validator", "scripts/validate-research-iteration-manifest-2.63.mjs"],
  ["iteration263Tests", "tests/research-iteration-manifest-2.63.test.mjs"],
  ["iteration263Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_63.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

async function buildMicroStructFormerReferenceReceipt() {
  const audit = JSON.parse(await readFile(path.join(ROOT, "data/microstructformer-ultrastructure-reference-0.1.json"), "utf8"));
  const validation = await validateMicroStructFormerUltrastructureReference(audit);
  if (validation.rowCount !== 540 || validation.splitCounts.train !== 528 || validation.splitCounts.validation !== 12
    || validation.identifiedInterneuronCount !== 0 || validation.admittedInternalGeometryCount !== 0
    || validation.downloadedPayloadBytes !== 0) throw new Error("MicroStructFormer source-only reference receipt changed");
  return {
    contractId: audit.contractId,
    auditDate: audit.auditDate,
    datasetRepository: audit.datasetRelease.repository,
    datasetRevisionSha: audit.datasetRelease.revisionSha,
    sourceModality: audit.source.sourceModality,
    rowCount: audit.datasetRelease.rowCount,
    splitCounts: audit.datasetRelease.splitCounts,
    rowFields: audit.datasetRelease.columns,
    viewerSamplePixelDimensions: audit.datasetRelease.sampleRowPreview.imageDimensionsPixel,
    pixelScaleKnown: false,
    modelLabelCount: audit.semanticLabels.length - 1,
    datasetModelLicense: audit.modelAndLicense.datasetLicense,
    softwareLicenseIsSeparate: true,
    identifiedInterneuronCount: validation.identifiedInterneuronCount,
    sameCellJoinCount: audit.identityAndGeometryBoundary.sameCellJoinCount,
    admittedCellGeometryCount: audit.identityAndGeometryBoundary.admittedCellGeometryCount,
    admittedInternalGeometryCount: validation.admittedInternalGeometryCount,
    registrationCount: audit.identityAndGeometryBoundary.registrationCount,
    predictionsAdmittedAsObservation: audit.identityAndGeometryBoundary.predictionAdmittedAsObservation,
    crossSectionStackingAllowed: audit.identityAndGeometryBoundary.crossSectionStackingAllowed,
    downloadedPayloadBytes: validation.downloadedPayloadBytes,
    linksOnly: true,
  };
}

export async function buildResearchIterationManifest263() {
  const parentReceipt = await validateResearchIterationManifest262Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, microStructFormer] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    buildMicroStructFormerReferenceReceipt(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.63 source-registry denominators differ from the sealed 2.62 source boundary");
  }
  if (upgrades.upgradeCount !== 222 || upgrades.displayedUpgradeCount !== 34 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-239")?.status?.startsWith("completed") !== true) {
    throw new Error("2.63 live research-upgrade or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.63 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_263.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.63 public image-mask package audit, source-linked ultrastructure reference, sealed 2.62 rollback, tests, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.63 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.63.0-research.1") throw new Error("2.63 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.63.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.63.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_262.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_262.bytes,
    fileSha256: SNAPSHOT_262.fileSha256,
    contentSha256: SNAPSHOT_262.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.63 adds a source-linked, two-dimensional MicroStructFormer axonal-ultrastructure reference from a pinned public image/semantic-mask dataset. It displays source categories and dataset denominator in an independent collapsed card only. No image, mask, model weight, segmentation prediction, 3D geometry, neuron identity, same-cell join or registration is imported.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.microStructFormerUltrastructureReference263 = {
    ...microStructFormer,
    researchUpgradeId: "UPG-239",
    runtime: {
      collapsedByDefault: true,
      linkedToSelectedCell: false,
      changesActiveRecord: false,
      displaysImagesOrMasks: false,
      displaysPredictionsAsObservations: false,
      createsCellGeometry: false,
      createsInternalGeometry: false,
    },
  };
  manifest.exactReferences.researchRegistryDenominators263 = {
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
  manifest.exactReferences.iteration263Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_63.md",
    rollbackParent: SNAPSHOT_262.path,
  };
  manifest.scientificBoundaries.microStructFormerUltrastructureReference263 = "The pinned Hugging Face release has 540 paired image/label rows (528 train, 12 validation). The one inspected preview row is 3964 × 3964 pixels with no physical scale; the dataset viewer exposes no neuron/animal/section identity or serial-z chain. Semantic classes describe axonal ultrastructure and are not an interneuron census or same-cell organelle model. CC BY-NC-SA 4.0 applies to the data/model; software licensing is separate. The atlas embeds links and text metadata only: zero source payload bytes, prediction claims, same-cell joins, cross-section stacking, geometry or registration.";
  manifest.scientificBoundaries.researchRegistryDenominators263 = `The live registry resolves ${sourceSummary.sourceCount} canonical sources, ${sourceSummary.recordSetCount} record sets, ${sourceSummary.bundledExactRosterCount} exact cell/profile rosters, ${sourceSummary.bundledExactSourceObjectSetCount} exact source-object sets, ${sourceSummary.typeRecordCount} source profiles, and ${upgrades.upgradeCount} research/model upgrades. ${upgrades.displayedUpgradeCount} research-facing upgrade identifiers resolve; canonical display denominators are registry-derived with ${denominatorReceipt.staleLiteralCount} stale literals.`;
  manifest.scientificBoundaries.iteration263Layout = "Iteration 2.63 updates the existing workspace with one source-linked 2D ultrastructure reference, focused evidence contract/schema/validator, a sealed 2.62 rollback snapshot, and one unique timeline. No large public data package is copied; no full project copy or new neuron/internal geometry is added.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest263();
    if (flag === "--write") await writeFile(MANIFEST_263_PATH, bytes);
    const reference = manifest.exactReferences.microStructFormerUltrastructureReference263;
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, datasetRevisionSha: reference.datasetRevisionSha, pairedRowCount: reference.rowCount, downloadedPayloadBytes: reference.downloadedPayloadBytes, admittedInternalGeometryCount: reference.admittedInternalGeometryCount, fullProjectCopyCount: manifest.exactReferences.iteration263Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
