#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_246, validateResearchIterationManifest246Snapshot } from "../scripts/validate-research-iteration-manifest-2.46-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { validateNativeContourDerivedSomaSurfaceRelease } from "../scripts/validate-native-contour-derived-soma-surface-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_247_PATH = path.join(ROOT, "data/research-iteration-manifest-2.47.json");
export const INPUTS_247 = Object.freeze([
  ["sealedIteration246SnapshotValidator", "scripts/validate-research-iteration-manifest-2.46-snapshot.mjs"],
  ["sealedIteration246SnapshotTests", "tests/research-iteration-manifest-2.46-snapshot.test.mjs"],
  ["iteration247Builder", "tools/build_research_iteration_manifest_2_47.mjs"],
  ["iteration247Validator", "scripts/validate-research-iteration-manifest-2.47.mjs"],
  ["iteration247Tests", "tests/research-iteration-manifest-2.47.test.mjs"],
  ["iteration247Timeline", "docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_47.md"],
  ["nativeContourDerivedSurfaceBuilder", "tools/build_native_contour_derived_soma_surface_0_1.mjs"],
  ["nativeContourDerivedSurfaceValidator", "scripts/validate-native-contour-derived-soma-surface-0.1.mjs"],
  ["nativeContourDerivedSurfaceTests", "tests/native-contour-derived-soma-surface.test.mjs"],
  ["nativeContourAdmissionCatalog04Validator", "scripts/validate-neurolucida-native-contour-admission-catalog-0.4.mjs"],
  ["nativeContourAdmissionCatalog04Tests", "tests/neurolucida-native-contour-admission-catalog-0.4.test.mjs"],
  ["nativeContourDerivedSurfaceReceipt", "data/native-contour-derived-soma-surface-0.1.json"],
  ["nativeContourDerivedSurfaceArtifact", "public/data/native_contour_derived_soma_surface_v1/nmo-50394-cell-body-interpolated-open-shell-0.1.json"],
  ["nativeContourDerivedSurfaceModel", "app/native-contour-derived-soma-surface.js"],
  ["nativeContourRecordViewerCss", "app/native-contour-detail.css"],
]);

const REFRESHED_PARENT_INPUT_PATHS = new Set([
  "package.json",
  "package-lock.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "data/research-model-upgrade-registry-0.1.json",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "tests/rendered-html.test.mjs",
  "tools/run_current_research_tests.mjs",
  "app/AtlasPrototype.tsx",
  "app/atlas-types.ts",
  "app/layout.tsx",
  "app/globals.css",
  "app/MorphologyComparePanel.tsx",
  "app/NativeContourRecordViewer.tsx",
  "scripts/validate-neurolucida-source-native-soma-contour-trace-0.1.mjs",
  "scripts/validate-neurolucida-native-contour-admission-catalog-0.2.mjs",
  "scripts/validate-neurolucida-native-contour-admission-catalog-0.3.mjs",
  "tests/microns-observed-cell-nucleus-reference.test.mjs",
  "tests/observed-morphology-runtime-contract.test.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest247() {
  const { manifest: parent } = await validateResearchIterationManifest246Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const surface = await validateNativeContourDerivedSomaSurfaceRelease();
  const surfaceReceipt = JSON.parse(await readFile(path.join(ROOT, "data/native-contour-derived-soma-surface-0.1.json"), "utf8"));

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.47 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.47 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_247.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.47 evidence, derived geometry, implementation or verification input" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.47 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.47.0-research.1") throw new Error("2.47 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.47.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.47.0";
  manifest.releaseDate = "2026-09-22";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: "data/research-iteration-manifest-2.46.json",
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_246.bytes,
    fileSha256: SNAPSHOT_246.fileSha256,
    contentSha256: SNAPSHOT_246.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.47 continues in the existing project tree. It adds one source-gated contour-interpolation display shell for exact NMO 50394 while preserving all source-native OBS line loops. The open DER shell has pinned contour, algorithm and output receipts; it creates no observed membrane, closed volume, nucleus, organelle, internal structure, biological measurement, cross-source join or atlas registration. Other Todd contour records remain line-only pending separate eligibility review.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.nativeContourDerivedSomaSurface247 = {
    neuronId: surface.neuronId,
    sourceRecordUrl: "https://neuromorpho.org/api/neuron/id/50394",
    originalDat: surfaceReceipt.sourceOriginalDat,
    nativeContourGeometry: surfaceReceipt.sourceNativeContourGeometry,
    sourceContourCount: surface.sourceContourCount,
    sourceVertexCount: surface.sourceVertexCount,
    rawSourceClosedFlags: { falseCount: 14, trueCount: 0, preserved: true },
    closureBasis: "exact Cell Body name + empty-value CellBody presence property + pinned independent somaContour parser + MBF cell-body tracing semantics",
    algorithmId: surfaceReceipt.algorithmId,
    artifact: surfaceReceipt.artifact,
    sourceQA: surfaceReceipt.gates,
    derivedVertexCount: surface.derivedVertexCount,
    derivedTriangleCount: surface.triangleCount,
    observedSurfaceCount: surface.observedSurfaceCount,
    derivedDisplayOpenShellCount: surface.derivedDisplayOpenShellCount,
    openEndBoundaryLoopCount: surfaceReceipt.geometryCounts.openEndBoundaryLoopCount,
    volumeCount: surface.volumeCount,
    membraneClaimCount: surfaceReceipt.geometryCounts.membraneClaimCount,
    internalStructureObjectCount: surface.internalStructureObjectCount,
    biologicalMeasurementCount: surfaceReceipt.geometryCounts.biologicalMeasurementCount,
    sameCellJoinCount: surfaceReceipt.geometryCounts.sameCellJoinCount,
    registrationCount: surface.registrationCount,
    researchUpgradeId: "UPG-194",
    researchUpgradeStatus: "completed_for_NMO_50394_only",
    remainingContourReviewUpgradeId: "UPG-220",
    researchUpgradeLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.nativeContourDerivedSomaSurface247 = "NMO 50394 retains 14 checksum-verified OBS Cell Body loops / 768 ordered source vertices and 14 raw false closure flags. The separate source-local DER shell interpolates between contiguous 1 micrometre planes using the pinned deterministic algorithm; it is open-ended and is not an observed membrane, closed volume, organelle, nucleus, internal segmentation, measurement, same-cell molecular join, atlas registration or representative interneuron morphology. NMO 50424 and 50408 remain unmeshed pending UPG-220.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest247();
    if (flag === "--write") await writeFile(MANIFEST_247_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_247_PATH)).equals(built.bytes)) throw new Error("2.47 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
