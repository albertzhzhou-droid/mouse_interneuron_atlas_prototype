#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_264, validateResearchIterationManifest264Snapshot } from "../scripts/validate-research-iteration-manifest-2.64-snapshot.mjs";
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
export const MANIFEST_265_PATH = path.join(ROOT, "data/research-iteration-manifest-2.65.json");
export const INPUTS_265 = Object.freeze([
  ["sealedIteration264SnapshotValidator", "scripts/validate-research-iteration-manifest-2.64-snapshot.mjs"],
  ["sealedIteration264SnapshotTests", "tests/research-iteration-manifest-2.64-snapshot.test.mjs"],
  ["independentMorphologyDiscoveryTests", "tests/independent-morphology-discovery.test.mjs"],
  ["iteration265Builder", "tools/build_research_iteration_manifest_2_65.mjs"],
  ["iteration265Validator", "scripts/validate-research-iteration-manifest-2.65.mjs"],
  ["iteration265Tests", "tests/research-iteration-manifest-2.65.test.mjs"],
  ["iteration265Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_65.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest265() {
  const parentReceipt = await validateResearchIterationManifest264Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout] = await Promise.all([
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
    throw new Error("2.65 source-registry denominators differ from the sealed 2.64 source boundary");
  }
  if (upgrades.upgradeCount !== 224 || upgrades.displayedUpgradeCount !== 36 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-241")?.status !== "completed"
    || upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-242")?.status?.startsWith("planned") !== true) {
    throw new Error("2.65 live research-upgrade, discovery-handoff, or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.65 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_265.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.65 exact-label source-morphology discovery handoff, Nakamura SBEM availability watch, sealed 2.64 rollback, tests, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.65 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.65.0-research.1") throw new Error("2.65 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.65.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.65.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_264.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_264.bytes,
    fileSha256: SNAPSHOT_264.fileSha256,
    contentSha256: SNAPSHOT_264.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.65 fixes the molecular-profile to independent NeuroMorpho search handoff: the source label now drives shared literal-text filtering across the exact-object and frozen-subset browsers, a new discovery request clears prior geometry and default selection, and only an explicit exact-record choice renders a source-local object. The label is not a subtype or same-cell join. It also records an article-level availability watch for Nakamura et al. spinal CSF-cN SBF-SEM; no EM volume, segmentation, organelle geometry, or payload is admitted.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.morphologyLabelDiscovery265 = {
    researchUpgradeId: "UPG-241",
    querySource: "selected molecular profile's exact source label string",
    searchSemantics: "case-insensitive literal substring over repository metadata only",
    sharedAcrossExactUniverseAndFrozenSubset: true,
    requestClearsPriorGeometry: true,
    requestClearsDefaultSelection: true,
    defaultRecordFallbackSuppressed: true,
    exactObjectSelectionRequiredBeforeRendering: true,
    queryUrlParameter: "morphologyQuery",
    sourceLabelToSubtypeRelationshipCount: 0,
    sourceLabelToSameCellJoinCount: 0,
    newMorphologyGeometryCount: 0,
    changesNeuroMorphoDenominators: false,
  };
  manifest.exactReferences.nakamuraSbfemAvailabilityWatch265 = {
    researchUpgradeId: "UPG-242",
    doi: "10.7554/eLife.83108",
    species: "Mus musculus",
    reportedSingleCellTracingCount: 71,
    sbfsemFigure: 4,
    serialSectionVideoSupplement: 5,
    dataAvailabilityNamedNumericalFigures: [2, 7],
    articleAvailabilityStatementNamesAnEmVolumeOrSegmentationDeposit: false,
    exactPublicEmStackVerified: false,
    stableEmCellObjectCrosswalkVerified: false,
    voxelAxesAndScaleVerifiedForAnEmVolume: false,
    assetLevelReuseTermsVerified: false,
    downloadedPayloadBytes: 0,
    admittedEmVolumes: 0,
    admittedCellOrOrganelleGeometry: 0,
    admittedSameCellJoins: 0,
    linksOnly: true,
  };
  manifest.exactReferences.researchRegistryDenominators265 = {
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
  manifest.exactReferences.iteration265Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_65.md",
    rollbackParent: SNAPSHOT_264.path,
  };
  manifest.scientificBoundaries.morphologyLabelDiscovery265 = "A molecular profile's exact repository label now performs literal text filtering of distinct source records. It does not map a canonical subtype, establish same-cell identity, or imply morphology similarity. Each new discovery request clears prior geometry and suppresses default-record fallback; a researcher must select an exact NeuroMorpho source record before its already-admitted source-local geometry can render. No object, geometry, relationship or denominator is added.";
  manifest.scientificBoundaries.nakamuraSbfemAvailabilityWatch265 = "Nakamura et al. report single-cell tracing of 71 mouse spinal CSF-cNs and show SBF-SEM images and a 3D reconstruction in Figure 4, with serial section images in Video 5. The article data-availability statement identifies numerical source-data spreadsheets for Figures 2 and 7, but does not identify an EM-volume or segmentation deposit. Exact figure/movie payloads, stable EM object IDs, volume axes/scale, reconstructions and asset-level reuse terms still require audit. This iteration downloaded zero payload bytes and admits zero EM volumes, cell or organelle geometries, and same-cell joins.";
  manifest.scientificBoundaries.researchRegistryDenominators265 = `The live registry resolves ${sourceSummary.sourceCount} canonical sources, ${sourceSummary.recordSetCount} record sets, ${sourceSummary.bundledExactRosterCount} exact cell/profile rosters, ${sourceSummary.bundledExactSourceObjectSetCount} exact source-object sets, ${sourceSummary.typeRecordCount} source profiles, and ${upgrades.upgradeCount} research/model upgrades. ${upgrades.displayedUpgradeCount} research-facing upgrade identifiers resolve; canonical display denominators are registry-derived with ${denominatorReceipt.staleLiteralCount} stale literals.`;
  manifest.scientificBoundaries.iteration265Layout = "Iteration 2.65 updates the existing workspace with a literal source-label morphology handoff, no-default/no-stale-geometry selection behavior, a source-availability watch for mouse spinal CSF-cN SBEM, tests, and a sealed 2.64 rollback parent. No full project copy, research-data payload, source geometry, internal geometry, or cross-source identity is added.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest265();
    if (flag === "--write") await writeFile(MANIFEST_265_PATH, bytes);
    const discovery = manifest.exactReferences.morphologyLabelDiscovery265;
    const sbfem = manifest.exactReferences.nakamuraSbfemAvailabilityWatch265;
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, sharedMorphologyIndexes: discovery.sharedAcrossExactUniverseAndFrozenSubset, exactObjectSelectionRequired: discovery.exactObjectSelectionRequiredBeforeRendering, sbfemDoi: sbfem.doi, admittedInternalGeometry: sbfem.admittedCellOrOrganelleGeometry, downloadedPayloadBytes: sbfem.downloadedPayloadBytes, fullProjectCopyCount: manifest.exactReferences.iteration265Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
