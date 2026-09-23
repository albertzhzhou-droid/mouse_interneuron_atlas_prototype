#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_245, validateResearchIterationManifest245Snapshot } from "../scripts/validate-research-iteration-manifest-2.45-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { validateDavisIcrSameCellReference } from "../scripts/validate-davis-icr-same-cell-reference-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_246_PATH = path.join(ROOT, "data/research-iteration-manifest-2.46.json");
export const INPUTS_246 = Object.freeze([
  ["sealedIteration245SnapshotValidator", "scripts/validate-research-iteration-manifest-2.45-snapshot.mjs"],
  ["sealedIteration245SnapshotTests", "tests/research-iteration-manifest-2.45-snapshot.test.mjs"],
  ["iteration246Builder", "tools/build_research_iteration_manifest_2_46.mjs"],
  ["iteration246Validator", "scripts/validate-research-iteration-manifest-2.46.mjs"],
  ["iteration246Tests", "tests/research-iteration-manifest-2.46.test.mjs"],
  ["iteration246Timeline", "docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_46.md"],
  ["davisIcrSameCellReceipt", "data/source-candidates/davis-icr-same-cell-20260922/receipt.json"],
  ["davisIcrSameCellValidator", "scripts/validate-davis-icr-same-cell-reference-0.1.mjs"],
  ["davisIcrSameCellTests", "tests/davis-icr-same-cell-reference.test.mjs"],
  ["davisIcrSameCellComponent", "app/DavisICRSameCellReference.tsx"],
  ["iteration232SnapshotValidatorCompatibility", "scripts/validate-research-iteration-manifest-2.32-snapshot.mjs"],
  ["iteration233SnapshotValidatorCompatibility", "scripts/validate-research-iteration-manifest-2.33-snapshot.mjs"],
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
  "tests/microns-observed-cell-nucleus-reference.test.mjs",
  "tests/observed-morphology-runtime-contract.test.mjs",
  "scripts/validate-research-iteration-manifest-2.34-snapshot.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) {
    throw new Error(`Invalid scoped input: ${input.id}`);
  }
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest246() {
  const { manifest: parent } = await validateResearchIterationManifest245Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const davis = await validateDavisIcrSameCellReference();
  const davisReceipt = JSON.parse(await readFile(path.join(ROOT, "data/source-candidates/davis-icr-same-cell-20260922/receipt.json"), "utf8"));

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.46 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.46 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_246.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.46 source, implementation or verification input" })),
    { id: "davisIcrFigure1UnchangedPng", scope: "project", path: davisReceipt.asset.path, purpose: "Unchanged CC BY 4.0 publisher Figure 1 used only as a source-local 2D reference" },
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.46 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.46.0-research.1") throw new Error("2.46 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.46.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.46.0";
  manifest.releaseDate = "2026-09-22";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_245.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_245.bytes,
    fileSha256: SNAPSHOT_245.fileSha256,
    contentSha256: SNAPSHOT_245.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.46 continues in the existing project directory. It adds an unchanged, checksum-pinned Davis Figure 1 as a source-local mouse spinal inhibitory-interneuron morphology-to-ultrastructure reference. The publication caption links morphology panel d to EM panels e–g; the tissue-preservation limitation is retained, and the figure contributes no project geometry, 3D stack, active-record join or atlas registration.";
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
  manifest.exactReferences.davisIcrSameCellFigure246 = {
    doi: davisReceipt.doi,
    articleUrl: davisReceipt.articleUrl,
    figurePageUrl: davisReceipt.figurePageUrl,
    sourceCellClass: davisReceipt.biologicalScope.sourceCellClass,
    species: davisReceipt.biologicalScope.species,
    targetAnatomy: davisReceipt.biologicalScope.targetAnatomy,
    recordedCellCountInExperiment: davisReceipt.biologicalScope.recordedCellCountInExperiment,
    miceInExperiment: davisReceipt.biologicalScope.miceInExperiment,
    sourceImagePath: davisReceipt.asset.path,
    sourceImageBytes: davis.sourceImageBytes,
    sourceImageSha256: davis.sourceImageSha256,
    sourceImageDimensionsPx: davisReceipt.asset.dimensionsPx,
    sourceFigureCount: davis.sourceFigureCount,
    license: davisReceipt.rights.license,
    figureUnchanged: davisReceipt.rights.changesToFigureBytes === false,
    panelScaleBars: { aToD: "100 μm", eToG: "0.5 μm" },
    captionAssertedSameCellRelation: { fromPanel: "d", toPanels: ["e", "f", "g"], independentIdentityValidation: false },
    emTissuePreservationCompromised: true,
    admittedProjectGeometryCount: davis.admittedProjectGeometryCount,
    sourceStackCount: 0,
    activeRecordJoinCount: davis.activeRecordJoinCount,
    atlasRegistrationCount: davis.atlasRegistrationCount,
    researchUpgradeId: "UPG-213",
    researchUpgradeStatus: "completed",
    researchUpgradeLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.davisIcrSameCellFigure246 = "The unchanged publisher figure is displayed as a source-local 2D reference for one inhibitory calretinin-expressing islet cell in mouse lamina II. The caption asserts that EM panels e–g show the panel-d cell; this is a publication-level relation, not independent identity validation. The paper reports compromised EM tissue preservation. The raster panels are not raw acquisition data, a serial stack, segmentation, quantitative reconstruction, project geometry, selected-record identity, molecular subtype assignment or atlas registration.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !["--write", "--check"].includes(args[0])) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest246();
    if (args[0] === "--write") await writeFile(MANIFEST_246_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_246_PATH)).equals(built.bytes)) throw new Error("2.46 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
