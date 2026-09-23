#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_244, validateResearchIterationManifest244Snapshot } from "../scripts/validate-research-iteration-manifest-2.44-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateSuperClemSerialStack } from "../scripts/validate-super-clem-serial-stack-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_245_PATH = path.join(ROOT, "data/research-iteration-manifest-2.45.json");
export const INPUTS_245 = Object.freeze([
  ["sealedIteration244SnapshotValidator", "scripts/validate-research-iteration-manifest-2.44-snapshot.mjs"],
  ["sealedIteration244SnapshotTests", "tests/research-iteration-manifest-2.44-snapshot.test.mjs"],
  ["iteration245Builder", "tools/build_research_iteration_manifest_2_45.mjs"],
  ["iteration245Validator", "scripts/validate-research-iteration-manifest-2.45.mjs"],
  ["iteration245Tests", "tests/research-iteration-manifest-2.45.test.mjs"],
  ["iteration245Timeline", "docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_45.md"],
  ["superClemSerialStackData", "data/super-clem-dorsal-synapse1-serial-stack-0.1.json"],
  ["superClemSerialStackValidator", "scripts/validate-super-clem-serial-stack-0.1.mjs"],
  ["superClemSerialStackTests", "tests/super-clem-serial-stack.test.mjs"],
  ["superClemSerialStackViewer", "app/SuperClemSynapseReference.tsx"],
  ["superClemFigshareApiReceipt", "data/source-candidates/superclem-palm-localization-20260922/figshare-17816747-v1.api.json"],
  ["superClemReadmeReceipt", "data/source-candidates/superclem-palm-localization-20260922/32598743-README_full_info.pdf"],
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
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) {
    throw new Error(`Invalid scoped input: ${input.id}`);
  }
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest245() {
  const { manifest: parent } = await validateResearchIterationManifest244Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const serialStack = await validateSuperClemSerialStack();
  const stackData = JSON.parse(await readFile(path.join(ROOT, "data/super-clem-dorsal-synapse1-serial-stack-0.1.json"), "utf8"));

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.45 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.45 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const binaryInputs = stackData.entries.flatMap((entry) => [
    [`superClemTiff${entry.figshareFileId}`, `public${entry.localOriginal.path}`],
    [`superClemPng${entry.figshareFileId}`, `public${entry.browserDerivative.path}`],
  ]);
  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_245.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.45 source, implementation or verification input" })),
    ...binaryInputs.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Exact checksum-pinned Super-CLEM serial-section source or pixel-preserving browser derivative" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.45 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.45.0-research.1") throw new Error("2.45 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.45.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.45.0";
  manifest.releaseDate = "2026-09-22";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_244.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_244.bytes,
    fileSha256: SNAPSHOT_244.fileSha256,
    contentSha256: SNAPSHOT_244.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.45 continues in the existing project directory. It adds an exact, checksum-pinned browser for eleven deposited Super-CLEM synapse-section images. The UI presents one 2D section at a time; no section registration, contours, segmentation, reconstructed volume, parent-cell identity or selected-atlas join is admitted.";
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
  manifest.exactReferences.superClemDorsalSynapse1SerialStack245 = {
    figshareArticleId: stackData.sourceDataset.articleId,
    sourceObjectId: serialStack.sourceObjectId,
    sourceFileIds: stackData.entries.map((entry) => entry.figshareFileId),
    sourceSectionLabels: stackData.entries.map((entry) => entry.sourceSectionLabel),
    sourceSectionCount: serialStack.sourceSectionCount,
    totalSourceBytes: serialStack.sourceBytes,
    browserDerivativeCount: serialStack.browserDerivativeCount,
    pixelParityReceiptCount: stackData.conversion.sourceDecodedRgbSha256ByOrdinal.length,
    nominalSectionThicknessNanometre: stackData.sourceObject.sectionThicknessNanometre,
    absoluteZCoordinateCount: 0,
    crossSectionRegistrationCount: serialStack.crossSectionRegistrationCount,
    admittedVolumeCount: serialStack.admittedVolumeCount,
    admittedProjectGeometryCount: 0,
    selectedAtlasRecordJoinCount: 0,
    parentCellResolved: serialStack.parentCellResolved,
    researchUpgradeLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.superClemDorsalSynapse1SerialStack245 = "Eleven Figshare files with source labels 20140–20150 are independently pinned as 2D images and shown one at a time; their nominal 70 nm section thickness does not supply absolute z coordinates or registration. PNG derivatives retain decoded source RGB values. No contours, segmentation, mesh, volume, biological measurement, cell/type/atlas join or selected-record relationship is admitted. The source-labelled synapse parent remains unresolved.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !["--write", "--check"].includes(args[0])) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest245();
    if (args[0] === "--write") await writeFile(MANIFEST_245_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_245_PATH)).equals(built.bytes)) throw new Error("2.45 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
