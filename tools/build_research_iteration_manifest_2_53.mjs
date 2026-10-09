#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_252, validateResearchIterationManifest252Snapshot } from "../scripts/validate-research-iteration-manifest-2.52-snapshot.mjs";
import { validateMicronsMitochondriaSpatialCompatibility } from "../scripts/validate-microns-mitochondria-spatial-compatibility-0.1.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_253_PATH = path.join(ROOT, "data/research-iteration-manifest-2.53.json");
export const INPUTS_253 = Object.freeze([
  ["sealedIteration252SnapshotValidator", "scripts/validate-research-iteration-manifest-2.52-snapshot.mjs"],
  ["sealedIteration252SnapshotTests", "tests/research-iteration-manifest-2.52-snapshot.test.mjs"],
  ["micronsMitochondriaSpatialCompatibilityContract", "data/microns-mitochondria-spatial-compatibility-0.1.json"],
  ["micronsMitochondriaSpatialCompatibilityValidator", "scripts/validate-microns-mitochondria-spatial-compatibility-0.1.mjs"],
  ["micronsMitochondriaSpatialCompatibilityTests", "tests/microns-mitochondria-spatial-compatibility.test.mjs"],
  ["iteration253Builder", "tools/build_research_iteration_manifest_2_53.mjs"],
  ["iteration253Validator", "scripts/validate-research-iteration-manifest-2.53.mjs"],
  ["iteration253Tests", "tests/research-iteration-manifest-2.53.test.mjs"],
  ["iteration253Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_53.md"],
]);

const REFRESHED_PARENT_INPUT_PATHS = new Set([
  "package.json",
  "package-lock.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "data/research-model-upgrade-registry-0.1.json",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "tools/run_current_research_tests.mjs",
  "app/AtlasPrototype.tsx",
  "app/atlas-types.ts",
  "app/InternalStructureReferencePanel.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "tests/microns-observed-cell-nucleus-reference.test.mjs",
  "tests/microns-subcellular-source-audit.test.mjs",
  "tests/observed-morphology-runtime-contract.test.mjs",
  "tests/rendered-html.test.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) {
    throw new Error(`Invalid scoped input: ${input.id}`);
  }
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest253() {
  const { manifest: parent } = await validateResearchIterationManifest252Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const mitoSpatial = await validateMicronsMitochondriaSpatialCompatibility();

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.53 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.53 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_253.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.53 spatial-eligibility audit, public-source research, validation or timeline" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.53 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.53.0-research.1") throw new Error("2.53 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.53.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.53.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_252.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_252.bytes,
    fileSha256: SNAPSHOT_252.fileSha256,
    contentSha256: SNAPSHOT_252.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.53 audits the official MICrONS v185 mit_new/info metadata against the exact v185.4 visual-cortex target-cell mesh. Under direct nominal-grid mapping the source subvolume does not overlap that mesh on X or Y, while the metadata supplies no exact-root membership or cross-layer transform; therefore no mitochondrion, registration, biological-absence claim or spinal join is admitted. UPG-223 is closed for this target under the currently documented mapping, with reopening gated on an authoritative transform and exact lineage. UPG-225 queues a strict public-export and rights audit of Fish-X; its reported 6-dpf larval-zebrafish data remain a separate comparator and the paper states the ssEM dataset is available upon request.";
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
  manifest.exactReferences.micronsMitochondriaSpatialCompatibility253 = {
    auditId: mitoSpatial.auditId,
    targetRootId: mitoSpatial.targetRootId,
    targetSegmentationRelease: "v185.4",
    targetAssetManifestSha256: "063e66321ecfcb8633dd39be0e08d467318ea276eeae0e6fef8344b313c5f2f1",
    layer: "precomputed://gs://neuroglancer/pinky10/ground_truth_registration/dst/mit_new",
    sourceInfoUrl: "https://storage.googleapis.com/neuroglancer/pinky10/ground_truth_registration/dst/mit_new/info",
    sourceInfoBytes: 482,
    sourceInfoSha256: mitoSpatial.sourceInfoSha256,
    nominalLayerBoundsNanometre: mitoSpatial.nominalLayerBoundsNanometre,
    axisOverlapUnderIdentityMapping: mitoSpatial.axisOverlap,
    targetCellBoundsNanometre: {
      min: [193453.140625, 142840.671875, 817.6767578125],
      max: [382259.5, 241471.5, 86263.234375],
    },
    spatialOverlapUnderIdentityMapping: mitoSpatial.spatialOverlapUnderIdentityMapping,
    crossLayerCoordinateMappingVerified: mitoSpatial.coordinateMappingVerified,
    targetRootMembershipVerified: false,
    mitochondriaObjectCount: mitoSpatial.mitochondriaObjectCount,
    registrationCount: 0,
    biologicalAbsenceClaim: false,
    researchUpgradeLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.micronsMitochondriaSpatialCompatibility253 = "The v185 manual mitochondria info object defines a bounded [4,4,40] nm grid but no membership for target root 648518346349516051 and no cross-layer transform. Under direct nominal mapping, its X/Y grid bounds do not intersect the exact cell mesh bounds. This is a route eligibility failure, not evidence that mitochondria are absent from that cell. Keep mitochondria geometry, root membership, cross-layer registration and all mouse-spinal joins at zero. Reopen only if a source-published transform and exact object lineage are independently verified.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest253();
    if (flag === "--write") await writeFile(MANIFEST_253_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_253_PATH)).equals(built.bytes)) throw new Error("2.53 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount, spatialOverlapUnderIdentityMapping: built.manifest.exactReferences.micronsMitochondriaSpatialCompatibility253.spatialOverlapUnderIdentityMapping, mitochondriaObjectCount: built.manifest.exactReferences.micronsMitochondriaSpatialCompatibility253.mitochondriaObjectCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
