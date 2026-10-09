#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_251, validateResearchIterationManifest251Snapshot } from "../scripts/validate-research-iteration-manifest-2.51-snapshot.mjs";
import { validateSuperClemPalmNativePoints } from "../scripts/validate-superclem-palm-native-points-0.1.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_252_PATH = path.join(ROOT, "data/research-iteration-manifest-2.52.json");
export const INPUTS_252 = Object.freeze([
  ["sealedIteration251SnapshotValidator", "scripts/validate-research-iteration-manifest-2.51-snapshot.mjs"],
  ["sealedIteration251SnapshotTests", "tests/research-iteration-manifest-2.51-snapshot.test.mjs"],
  ["superClemPalmSourceReceipt", "data/source-candidates/superclem-palm-localization-20260922/receipt.json"],
  ["superClemPalmSourceMat", "data/source-candidates/superclem-palm-localization-20260922/32526932-181130_EosRmov009_MTT_without_tracking_results.mat"],
  ["superClemPalmSourceCountTable", "data/source-candidates/superclem-palm-localization-20260922/32600930-181130-EosRmov009-roi1-counts.txt"],
  ["superClemPalmReferenceContract", "data/super-clem-palm-localization-reference-0.1.json"],
  ["superClemPalmPointPayload", "public/data/superclem_palm_native_points_0_1.json"],
  ["superClemPalmPointBuilder", "tools/build_superclem_palm_native_points_0_1.mjs"],
  ["superClemPalmPointValidator", "scripts/validate-superclem-palm-native-points-0.1.mjs"],
  ["superClemPalmPointTests", "tests/superclem-palm-native-points.test.mjs"],
  ["superClemPalmReferenceComponent", "app/SuperClemPalmLocalizationReference.tsx"],
  ["iteration252Builder", "tools/build_research_iteration_manifest_2_52.mjs"],
  ["iteration252Validator", "scripts/validate-research-iteration-manifest-2.52.mjs"],
  ["iteration252Tests", "tests/research-iteration-manifest-2.52.test.mjs"],
  ["iteration252Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_52.md"],
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

export async function buildResearchIterationManifest252() {
  const { manifest: parent } = await validateResearchIterationManifest251Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const palmAudit = await validateSuperClemPalmNativePoints();

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.52 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.52 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_252.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.52 source-native PALM coordinate view, comparative source research, validation or timeline" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.52 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.52.0-research.1") throw new Error("2.52 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.52.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.52.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_251.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_251.bytes,
    fileSha256: SNAPSHOT_251.fileSha256,
    contentSha256: SNAPSHOT_251.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.52 adds a separate 2D plot of every source-reported Super-CLEM PALM localization detection for Figshare file 32526932, decoded from the checksum-pinned MAT file. Axes retain native X/Y numeric values without physical units, coordinate origin, drift correction or 3D depth. The plot is independent of the selected atlas record; no detection is called a unique receptor molecule, assigned to a count-table cluster, registered to a cell or overlaid with the separate BP057 EM acquisition. The research queue also adds a version-pinned audit of the published MICrONS visual-cortex inhibitory connectomic census as a cross-region comparison only.";
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
  manifest.exactReferences.superClemPalmNativePointReference252 = {
    sourceCitation: "Maynard et al., eLife 2021, 10:e74441",
    figshareRecordId: "17816747",
    figshareFileId: palmAudit.sourceFileId,
    sourceMatPath: palmAudit.sourcePath,
    sourceSha256: palmAudit.sourceSha256,
    plotPayloadSha256: palmAudit.plotPayloadSha256,
    sourceReadmeSha256: "775f398348a69dced8b1a6984febf7397f4019b826ded9a60f198b71db81dc27",
    acquisitionId: "181130_EosRmov009",
    animalId: "AQ848",
    region: "dorsal spinal cord",
    physicalUnitsEstablished: false,
    coordinateOriginEstablished: false,
    axisOrientationEstablished: false,
    driftCorrectionEstablished: false,
    matVariableName: "matrice_results",
    sourceShapeRowsByColumns: [5, 18358],
    plotColumns: ["frame", "x", "y"],
    detectionCount: palmAudit.detectionCount,
    frameRange: palmAudit.frameRange,
    xRangeNative: palmAudit.xRangeNative,
    yRangeNative: palmAudit.yRangeNative,
    countTableClusterRows: 2,
    countTableExhaustivelyPartitionsDetections: false,
    uniqueMoleculeCountKnown: false,
    bp057EmOverlayCount: 0,
    selectedCellJoinCount: 0,
    cellInterneuronIdentityJoinCount: 0,
    physicalRegistrationCount: 0,
    threeDimensionalObjectCount: 0,
    researchUpgradeLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.superClemPalmNativePointReference252 = "The exact source MAT receipt and local README support a source-native 2D record plot for one AQ848 dorsal acquisition, not cell-internal anatomy. Physical scale, origin, axis orientation and drift-correction state are not established for the file. Keep all 18,358 detections distinct from unique GlyR molecules and from the two non-exhaustive count-table clusters. No depth, parent neuron, selected interneuron, receptor-molecule, BP057 EM or 3D join is made. Inhibitory census 1,352/163 denominators remain cortical-column study counts in separate MICrONS data version 795 and do not alter a spinal denominator.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest252();
    if (flag === "--write") await writeFile(MANIFEST_252_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_252_PATH)).equals(built.bytes)) throw new Error("2.52 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount, palmDetections: built.manifest.exactReferences.superClemPalmNativePointReference252.detectionCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
