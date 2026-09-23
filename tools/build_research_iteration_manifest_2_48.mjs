#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_247, validateResearchIterationManifest247Snapshot } from "../scripts/validate-research-iteration-manifest-2.47-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { validateBancV888ComparativeInternalReference } from "../scripts/validate-banc-v888-comparative-internal-reference-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_248_PATH = path.join(ROOT, "data/research-iteration-manifest-2.48.json");
export const INPUTS_248 = Object.freeze([
  ["sealedIteration247SnapshotValidator", "scripts/validate-research-iteration-manifest-2.47-snapshot.mjs"],
  ["sealedIteration247SnapshotTests", "tests/research-iteration-manifest-2.47-snapshot.test.mjs"],
  ["bancComparativeReferenceContract", "data/banc-v888-comparative-internal-reference-0.1.json"],
  ["bancComparativeReferenceValidator", "scripts/validate-banc-v888-comparative-internal-reference-0.1.mjs"],
  ["bancComparativeReferenceTests", "tests/banc-v888-comparative-internal-reference.test.mjs"],
  ["iteration248Builder", "tools/build_research_iteration_manifest_2_48.mjs"],
  ["iteration248Validator", "scripts/validate-research-iteration-manifest-2.48.mjs"],
  ["iteration248Tests", "tests/research-iteration-manifest-2.48.test.mjs"],
  ["iteration248Timeline", "docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_48.md"],
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
  "app/layout.tsx",
  "app/InternalStructureReferencePanel.tsx",
  "tests/microns-observed-cell-nucleus-reference.test.mjs",
  "tests/observed-morphology-runtime-contract.test.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) {
    throw new Error(`Invalid scoped input: ${input.id}`);
  }
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest248() {
  const { manifest: parent } = await validateResearchIterationManifest247Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const banc = await validateBancV888ComparativeInternalReference();
  const bancContract = JSON.parse(await readFile(path.join(ROOT, "data/banc-v888-comparative-internal-reference-0.1.json"), "utf8"));

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.48 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  if (refreshedPaths.length !== REFRESHED_PARENT_INPUT_PATHS.size) {
    const missing = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
    throw new Error(`Required 2.48 refreshed parent inputs are missing: ${missing.join(", ")}`);
  }

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_248.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.48 source audit, information-panel implementation or verification input" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.48 input identity");
  }

  const receipts = await Promise.all(inputs.map(async (input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.48.0-research.1") throw new Error("2.48 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.48.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.48.0";
  manifest.releaseDate = "2026-09-22";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_247.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_247.bytes,
    fileSha256: SNAPSHOT_247.fileSha256,
    contentSha256: SNAPSHOT_247.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.48 continues in the existing project tree. It adds an evidence-linked BANC v888 comparative-source panel and advances UPG-219 only to a release-level availability audit. The object-map discrepancy and exact same-cell chain remain unresolved; no BANC geometry is admitted, no mouse record is joined, and the fly comparison lane is not vertebrate spinal anatomy or a homolog claim.";
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
  manifest.exactReferences.bancV888ComparativeInternalReference248 = {
    contractId: banc.contractId,
    sourceDoi: bancContract.source.doi,
    materializationId: bancContract.snapshot.materializationId,
    paperReleaseDate: bancContract.snapshot.paperReleaseDate,
    metadataDocumentationDate: bancContract.snapshot.metadataDocumentationDate,
    metadataRowCount: bancContract.snapshot.metadataRowCount,
    metadataRowUnit: bancContract.snapshot.metadataRowUnit,
    sourceSpecies: bancContract.biologicalScope.species,
    specimenCount: bancContract.biologicalScope.specimenCount,
    hasVentralNerveCord: bancContract.biologicalScope.anatomicalCoverage.includes("entire ventral nerve cord"),
    neuronMeshSourceAvailability: bancContract.sourceProducts.neuronMeshes.availability,
    nucleusSourceAvailability: bancContract.sourceProducts.nuclei.availability,
    mitochondriaSourceAvailability: bancContract.sourceProducts.mitochondria.availability,
    selectedVncInterneuronRootId: bancContract.projectAdmission.selectedVncInterneuronRootId,
    sourceObjectsImported: bancContract.projectAdmission.sourceObjectsImported,
    cellMeshesAdmitted: bancContract.projectAdmission.cellMeshesAdmitted,
    nucleusObjectsAdmitted: bancContract.projectAdmission.nucleusObjectsAdmitted,
    mitochondriaObjectsAdmitted: bancContract.projectAdmission.mitochondriaObjectsAdmitted,
    synapseObjectsAdmitted: bancContract.projectAdmission.synapseObjectsAdmitted,
    sameCellJoinCount: bancContract.projectAdmission.sameCellJoinCount,
    registrationCount: bancContract.projectAdmission.registrationCount,
    renderedGeometryCount: bancContract.projectAdmission.renderedGeometryCount,
    nextExactCellGateUpgradeId: "UPG-221",
    researchUpgradeLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.bancV888ComparativeInternalReference248 = "BANC v888 is a single adult female Drosophila CNS and remains an invertebrate VNC comparison lane. Its 188,162 metadata rows are segment-level, not an interneuron denominator. Dataset-level cell/nucleus/mitochondria availability does not prove one exact same-cell chain; the source map's v888 mitochondria annotation versus MISSING detected-mitochondria entry remains unresolved. This iteration imports and renders zero BANC objects, makes zero joins and registrations, and claims no mouse spinal identity, homolog or causal function.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest248();
    if (flag === "--write") await writeFile(MANIFEST_248_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_248_PATH)).equals(built.bytes)) throw new Error("2.48 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
