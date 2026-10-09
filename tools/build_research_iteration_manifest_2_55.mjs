#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_254, validateResearchIterationManifest254Snapshot } from "../scripts/validate-research-iteration-manifest-2.54-snapshot.mjs";
import { validateNeuromorphoCensusMainSceneIndex01 } from "../scripts/validate-neuromorpho-census-main-scene-index-0.1.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_255_PATH = path.join(ROOT, "data/research-iteration-manifest-2.55.json");
export const INPUTS_255 = Object.freeze([
  ["sealedIteration254SnapshotValidator", "scripts/validate-research-iteration-manifest-2.54-snapshot.mjs"],
  ["neuromorphoCensusMainSceneIndex", "data/neuromorpho-census-main-scene-index-0.1.json"],
  ["neuromorphoCensusMainSceneIndexSchema", "schemas/neuromorpho-census-main-scene-index-0.1.schema.json"],
  ["neuromorphoCensusMainSceneIndexBuilder", "tools/build_neuromorpho_census_main_scene_index_0_1.mjs"],
  ["neuromorphoCensusMainSceneIndexValidator", "scripts/validate-neuromorpho-census-main-scene-index-0.1.mjs"],
  ["neuromorphoCensusMainSceneIndexTests", "tests/neuromorpho-census-main-scene-index.test.mjs"],
  ["incrementalIterationLayoutValidator", "scripts/validate-incremental-iteration-layout.mjs"],
  ["incrementalIterationLayoutTests", "tests/incremental-iteration-layout.test.mjs"],
  ["iteration255Builder", "tools/build_research_iteration_manifest_2_55.mjs"],
  ["iteration255Validator", "scripts/validate-research-iteration-manifest-2.55.mjs"],
  ["iteration255Tests", "tests/research-iteration-manifest-2.55.test.mjs"],
  ["iteration255Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_55.md"],
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
  "scripts/validate-research-iteration-manifest-2.34-snapshot.mjs",
  "scripts/validate-research-iteration-manifest-2.33-snapshot.mjs",
  "app/AtlasPrototype.tsx",
  "app/atlas-types.ts",
  "app/SceneCanvas.tsx",
  "app/ObservedMorphologyRouteLibrary.tsx",
  "app/MorphologyViewer.tsx",
  "app/ResearchOverview.tsx",
  "app/layout.tsx",
  "tests/main-scene-observed-route-integration.test.mjs",
  "tests/research-visual-target.test.mjs",
  "tests/rendered-html.test.mjs",
  "tests/research-iteration-manifest-2.54.test.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest255() {
  const { manifest: parent } = await validateResearchIterationManifest254Snapshot();
  const [upgrades, sourceRegistry, censusIndex, layout] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    validateNeuromorphoCensusMainSceneIndex01(),
    validateIncrementalIterationLayout(),
  ]);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);

  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.55 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  const missingRefreshedPaths = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
  if (missingRefreshedPaths.length) throw new Error(`Required 2.55 refreshed parent inputs are missing: ${missingRefreshedPaths.join(", ")}`);

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_255.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.55 source-local main-scene census expansion, no-copy guard, validation or rollback receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.55 input identity");

  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.55.0-research.1") throw new Error("2.55 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.55.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.55.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_254.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_254.bytes,
    fileSha256: SNAPSHOT_254.fileSha256,
    contentSha256: SNAPSHOT_254.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.55 makes all 142 already-pinned adult mouse spinal-interneuron NeuroMorpho census geometries individually selectable in the shared main scene, retaining seven supplementary source objects for 149 selectable records. The frozen census and source-object assets are unchanged: 140 inputs are source-labelled 3D and two are planar 2D (including two records with diameter metadata, which still do not authorize 3D surfaces). Labels remain raw repository annotations, frames remain unregistered, same-specimen internal structures and cross-source identities remain zero. The later official NeuroMorpho 8.6.125 release is queued for a separate exact-query/version/rights audit and is not mixed into this iteration.";
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

  const representation = manifest.exactReferences.evidenceAware3dRepresentation;
  representation.mainSceneMorphologyCount = 149;
  representation.previousIterationMainSceneMorphologyCount = 14;
  representation.namedSpinalMorphologyRouteCount = 11;
  representation.selectableMorphologyBreakdown = { frozenCensusRecords: 142, supplementaryExactObjects: 7 };
  manifest.exactReferences.neuromorphoCensusMainScene255 = {
    contractId: "neuromorpho-census-main-scene-index-0.1",
    releaseId: "ohri-neuromorpho-census-main-scene-index-0.1.0",
    repositoryRelease: "8.6.124",
    indexReceipt: {
      path: "data/neuromorpho-census-main-scene-index-0.1.json",
      bytes: byId.get("neuromorphoCensusMainSceneIndex").bytes,
      sha256: byId.get("neuromorphoCensusMainSceneIndex").sha256,
    },
    officialCensusIndexReceipt: { ...censusIndex, path: "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json" },
    stableSourceRecordCount: 142,
    selectableCensusRecordCount: 142,
    selectableSupplementaryObjectCount: 7,
    totalSelectableMainSceneMorphologyCount: 149,
    newCensusSelectionIncrementFromIteration254: 135,
    dimensionality: { sourceLabelled3D: 140, sourceLabelled2D: 2, planarDiameterMetadataRecords: 2, radiusDerived3DSurfaceEligible3D: 92 },
    rawSourceSecondaryLabelCounts: { Excitatory: 125, Inhibitory: 15, "Not Reported": 2 },
    exactPlanarRecordIds: [194468, 194469],
    frozenCensusExpansionCount: 0,
    censusRecordCount: 142,
    independentAnimalCount: null,
    independentSpecimenCount: null,
    sameSpecimenInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    researchUpgradeId: "UPG-227",
    newerRepositoryReleaseWatch: {
      repositoryRelease: "8.6.125",
      postedDate: "2026-09-17",
      exactQueryDeltaAudited: false,
      mixedIntoActiveCensus: false,
      researchUpgradeId: "UPG-228",
    },
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
  manifest.scientificBoundaries.neuromorphoCensusMainScene255 = "The 149 selectable objects are exact repository records (142 from the pinned 8.6.124 adult query plus 7 supplementary objects), not 149 types, specimens, animals or a prevalence sample. The two source-labelled 2D geometries remain planar even though each has diameter metadata; only 92 of the census records combine 3D geometry with source diameter metadata. Raw secondary labels are preserved without subtype reconciliation, all source frames remain unregistered, and the two frozen-census denominators are unchanged. No same-specimen internal objects, cross-source identities or registrations are admitted. Release 8.6.125 is only a version-delta watch pending exact query, per-object hashes and rights review.";

  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest255();
    if (flag === "--write") await writeFile(MANIFEST_255_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_255_PATH)).equals(built.bytes)) throw new Error("2.55 manifest is stale");
    process.stdout.write(`${JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount, frozenCensusCount: built.manifest.exactReferences.neuromorphoCensusMainScene255.censusRecordCount, mainSceneMorphologyCount: built.manifest.exactReferences.neuromorphoCensusMainScene255.totalSelectableMainSceneMorphologyCount, sourceLabelled3D: built.manifest.exactReferences.neuromorphoCensusMainScene255.dimensionality.sourceLabelled3D, sourceLabelled2D: built.manifest.exactReferences.neuromorphoCensusMainScene255.dimensionality.sourceLabelled2D, contentSha256: built.manifest.manifestContentSha256 })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
