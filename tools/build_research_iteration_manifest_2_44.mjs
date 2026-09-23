#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_243, validateResearchIterationManifest243Snapshot } from "../scripts/validate-research-iteration-manifest-2.43-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateSpinalInhibitoryInterneuronVolumeEmReference } from "../scripts/validate-spinal-inhibitory-interneuron-volume-em-reference-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_244_PATH = path.join(ROOT, "data/research-iteration-manifest-2.44.json");
export const INPUTS_244 = Object.freeze([
  ["sealedIteration243", "data/research-iteration-manifest-2.43.json"],
  ["sealedIteration243SnapshotValidator", "scripts/validate-research-iteration-manifest-2.43-snapshot.mjs"],
  ["iteration244Builder", "tools/build_research_iteration_manifest_2_44.mjs"],
  ["iteration244Validator", "scripts/validate-research-iteration-manifest-2.44.mjs"],
  ["iteration244Tests", "tests/research-iteration-manifest-2.44.test.mjs"],
  ["iteration244Timeline", "docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_44.md"],
  ["spinalVolumeEmReferenceData", "data/spinal-inhibitory-interneuron-volume-em-reference-0.1.json"],
  ["spinalVolumeEmReferenceValidator", "scripts/validate-spinal-inhibitory-interneuron-volume-em-reference-0.1.mjs"],
  ["spinalVolumeEmReferenceTests", "tests/spinal-inhibitory-interneuron-volume-em-reference.test.mjs"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function buildResearchIterationManifest244() {
  const { manifest: parent } = await validateResearchIterationManifest243Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const sourceRegistry = await loadResearchSourceRegistry();
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const spinalReference = await validateSpinalInhibitoryInterneuronVolumeEmReference();
  const manifest = structuredClone(parent);
  const inputs = [
    ...parent.authoritativeInputs,
    ...INPUTS_244.map(([id, inputPath]) => ({
      id,
      scope: "project",
      path: inputPath,
      purpose: "Iteration 2.44 source, implementation or verification input",
    })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) {
    throw new Error("Duplicate 2.44 input identity");
  }
  manifest.authoritativeInputs = await Promise.all(inputs.map(async (input) => {
    const locator = parent.inputRoots[input.scope]?.locator;
    if (!locator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) {
      throw new Error(`Invalid scoped input: ${input.id}`);
    }
    const bytes = await readFile(path.resolve(ROOT, locator, input.path));
    return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
  }));
  const byId = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.44.0-research.1") throw new Error("2.44 application version mismatch");

  manifest.manifestSchemaVersion = "2.44.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.44.0";
  manifest.releaseDate = "2026-09-22";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_243.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_243.bytes,
    fileSha256: SNAPSHOT_243.fileSha256,
    contentSha256: SNAPSHOT_243.contentSha256,
  };
  manifest.integrity.inputCount = inputs.length;
  manifest.baseResearchRelease.note = "Iteration 2.44 continues the sealed 2.43 application in place. The published spinal volume-EM reconstruction is linked as independent reference context, while source-native NMO detail and source-slot GLUT labels retain their distinct authority. No full-project copy, imported publication mesh or selected-cell identity join is created.";
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
  manifest.exactReferences.spinalVolumeEmReference244 = {
    sourceDoi: spinalReference.doi,
    reportedVolumeMicrometre: spinalReference.reportedVolumeMicrometre,
    publicationProfileCount: 3,
    profileCountIsCellCount: false,
    reconstructedStructureCount: spinalReference.reconstructedStructureCount,
    admittedProjectGeometryCount: 0,
    registrationCount: 0,
    sameCellJoinCount: 0,
    mediaRehosted: false,
    reuseLicenceVerified: false,
    researchUpgradeLastId: upgrades.lastIncludedId,
  };
  manifest.scientificBoundaries.spinalVolumeEmReference244 = "The 35 × 24 × 2 μm publication reconstruction is a link-only example from a broadly Slc32a1-labeled inhibitory population; its axonal and dendritic profiles are not a stable cell count or named molecular subtype. No raw stack, area list, segmentation or mesh is imported. The external reference does not describe the currently selected atlas record and creates zero project geometry, measurement, registration or identity join.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 || !["--write", "--check"].includes(args[0])) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest244();
    if (args[0] === "--write") await writeFile(MANIFEST_244_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_244_PATH)).equals(built.bytes)) throw new Error("2.44 manifest is stale");
    console.log(JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, manifestContentSha256: built.manifest.manifestContentSha256 }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
