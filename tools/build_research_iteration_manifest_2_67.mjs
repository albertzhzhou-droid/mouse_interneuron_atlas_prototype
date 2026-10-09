#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_266, validateResearchIterationManifest266 } from "../scripts/validate-research-iteration-manifest-2.66.mjs";
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
export const MANIFEST_267_PATH = path.join(ROOT, "data/research-iteration-manifest-2.67.json");
export const INPUTS_267 = Object.freeze([
  ["sealedIteration266SnapshotManifest", "data/research-iteration-manifest-2.66.json"],
  ["iteration267RenderModePolicy", "app/morphology-render-mode.js"],
  ["iteration267RenderModeTests", "tests/morphology-render-mode.test.mjs"],
  ["iteration267Builder", "tools/build_research_iteration_manifest_2_67.mjs"],
  ["iteration267Validator", "scripts/validate-research-iteration-manifest-2.67.mjs"],
  ["iteration267Tests", "tests/research-iteration-manifest-2.67.test.mjs"],
  ["iteration267Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_67.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest267() {
  const parentReceipt = await validateResearchIterationManifest266();
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
    throw new Error("2.67 source-registry denominators differ from the sealed 2.66 boundary");
  }
  if (upgrades.upgradeCount !== 225 || upgrades.displayedUpgradeCount !== 38 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.summary.byStatus.completed !== 65
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-243"
    || !upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-243")?.status.startsWith("planned")) {
    throw new Error("2.67 research-upgrade, planned UPG-243, or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.67 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_267.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.67 evidence-backed rendering policy, UPG-243 search queue, immutable rollback, regression tests, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.67 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.67.0-research.1") throw new Error("2.67 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.67.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.67.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_266.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_266.bytes,
    fileSha256: SNAPSHOT_266.fileSha256,
    contentSha256: SNAPSHOT_266.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.67 improves record-specific morphology legibility with one source-authority resolver shared by the individual and exact-universe viewers. Source-labelled 3D records with official diameter metadata default to a visibly labelled radius-derived surface; 2D stays planar and records without 3D diameter authority remain centerline-only. UPG-243 is queued as a bounded public mouse spinal EM volume, segmentation, rights and exact-object search; no new microscopy payload or internal geometry is admitted.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.researchRegistryDenominators267 = {
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
  manifest.exactReferences.morphologyRenderModePolicy267 = {
    sharedResolver: "app/morphology-render-mode.js",
    radiusSurfaceRequiresSourceLabelled3D: true,
    radiusSurfaceRequiresSourceReportedDiameter: true,
    eligible3DDefault: "radius-derived-open-frusta",
    explicitCenterlineOverridePreserved: true,
    planar2DAlwaysCenterlineOnly: true,
    noDiameterOrUnreportedDimensionalityCenterlineOnly: true,
    surfaceIsObservedMembrane: false,
    sourceObjectIdentityChangesOnRecordSelection: true,
    sameSpecimenInternalObjectsAdmitted: 0,
  };
  manifest.exactReferences.openMouseSpinalEmSearch243 = {
    researchUpgradeId: "UPG-243",
    status: "planned_bounded_public_repository_search",
    repositories: ["EMPIAR", "BioImage Archive", "EMDB"],
    rawPayloadBytesDownloaded: 0,
    candidateVolumesAdmitted: 0,
    segmentationObjectsAdmitted: 0,
    exactInterneuronObjectCrosswalksAdmitted: 0,
    registrations: 0,
    measurements: 0,
  };
  manifest.exactReferences.iteration267Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_67.md",
    rollbackParent: SNAPSHOT_266.path,
  };
  manifest.scientificBoundaries.morphologyRenderModePolicy267 = "Radius-derived rendering visualizes source-authorized SWC endpoint radii as open deterministic tapered frusta only for records labelled 3D by the source; it is not observed membrane geometry. 2D inputs stay planar despite any diameter field, and records without source diameter authority or reported 3D remain centerline-only. Record switching continues to load that exact record's own geometry.";
  manifest.scientificBoundaries.openMouseSpinalEmSearch243 = "UPG-243 is a planned bounded search of official open repositories, not a positive dataset finding or universal absence claim. No raw EM payload, segmentation, interneuron object, same-cell crosswalk, internal geometry, registration or measurement was downloaded or admitted in 2.67. Preserve species and source-object identity; repository listings and publication media do not satisfy the cell-level evidence gate.";
  manifest.scientificBoundaries.iteration267Layout = "Iteration 2.67 adds one shared source-authority render-mode rule, planar 2D guardrails, regression tests and a planned public mouse spinal EM object search to the existing workspace. It seals 2.66 as an immutable rollback snapshot and creates no full-project copy.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest267();
    if (flag === "--write") await writeFile(MANIFEST_267_PATH, bytes);
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, displayedUpgradeCount: manifest.exactReferences.researchRegistryDenominators267.displayedUpgradeCount, eligibleRenderRule: manifest.exactReferences.morphologyRenderModePolicy267.eligible3DDefault, plannedOpenVolumeAudit: manifest.exactReferences.openMouseSpinalEmSearch243.researchUpgradeId, fullProjectCopyCount: manifest.exactReferences.iteration267Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
