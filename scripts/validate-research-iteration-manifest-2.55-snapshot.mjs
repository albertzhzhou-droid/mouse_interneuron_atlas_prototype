#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_254, validateResearchIterationManifest254Snapshot } from "./validate-research-iteration-manifest-2.54-snapshot.mjs";

export const SNAPSHOT_255 = Object.freeze({
  path: "data/research-iteration-manifest-2.55.json",
  bytes: 347440,
  fileSha256: "d3d167e7bc6493605578bf0ecfbfd03dfe19e0ecdc1db9163d086a4dd4ead87f",
  contentSha256: "08b67bbadadd36393e96cbac676c6274248f656872bcf335497443a36366daac",
  inputCount: 432,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest255Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_255.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_255.bytes || sha256(bytes) !== SNAPSHOT_255.fileSha256) throw new Error("Immutable 2.55 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_255.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_255.contentSha256) throw new Error("Immutable 2.55 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.55.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.55.0"
    || manifest.application.version !== "2.55.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_255.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_255.inputCount) throw new Error("Immutable 2.55 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_255.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.55 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["neuromorphoCensusMainSceneIndex", "data/neuromorpho-census-main-scene-index-0.1.json"],
    ["iteration255Builder", "tools/build_research_iteration_manifest_2_55.mjs"],
    ["iteration255Validator", "scripts/validate-research-iteration-manifest-2.55.mjs"],
    ["iteration255Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_55.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.55 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest254Snapshot();
  const parentBytes = await readFile(path.join(ROOT, SNAPSHOT_254.path));
  if (manifest.parentIterationManifest.path !== SNAPSHOT_254.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_254.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_254.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_254.contentSha256
    || sha256(parentBytes) !== SNAPSHOT_254.fileSha256) throw new Error("Immutable 2.55 parent receipt changed");

  const census = manifest.exactReferences.neuromorphoCensusMainScene255;
  if (census.contractId !== "neuromorpho-census-main-scene-index-0.1"
    || census.repositoryRelease !== "8.6.124"
    || census.censusRecordCount !== 142
    || census.selectableCensusRecordCount !== 142
    || census.selectableSupplementaryObjectCount !== 7
    || census.totalSelectableMainSceneMorphologyCount !== 149
    || census.newCensusSelectionIncrementFromIteration254 !== 135
    || census.frozenCensusExpansionCount !== 0
    || census.independentAnimalCount !== null
    || census.independentSpecimenCount !== null) throw new Error("Immutable 2.55 source-object universe or census denominators changed");
  if (census.dimensionality.sourceLabelled3D !== 140
    || census.dimensionality.sourceLabelled2D !== 2
    || census.dimensionality.planarDiameterMetadataRecords !== 2
    || census.dimensionality.radiusDerived3DSurfaceEligible3D !== 92
    || JSON.stringify(census.exactPlanarRecordIds) !== JSON.stringify([194468, 194469])) throw new Error("Immutable 2.55 dimensionality or planar boundary changed");
  if (census.rawSourceSecondaryLabelCounts.Excitatory !== 125
    || census.rawSourceSecondaryLabelCounts.Inhibitory !== 15
    || census.rawSourceSecondaryLabelCounts["Not Reported"] !== 2
    || census.sameSpecimenInternalStructureCount !== 0
    || census.renderedInternalPrimitiveCount !== 0
    || census.crossSourceIdentityCount !== 0
    || census.registrationCount !== 0
    || census.researchUpgradeId !== "UPG-227"
    || census.newerRepositoryReleaseWatch.repositoryRelease !== "8.6.125"
    || census.newerRepositoryReleaseWatch.exactQueryDeltaAudited !== false
    || census.newerRepositoryReleaseWatch.mixedIntoActiveCensus !== false
    || census.newerRepositoryReleaseWatch.researchUpgradeId !== "UPG-228"
    || census.fullProjectCopyCount !== 0) throw new Error("Immutable 2.55 source labels, provenance or release-watch boundary changed");
  if (manifest.registrySummary.researchUpgradeCount !== 210
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36
    || manifest.registrySummary.bundledExactRosterCount !== 11) throw new Error("Immutable 2.55 historical registry denominators changed");
  return {
    releaseId: manifest.releaseId,
    inputCount: SNAPSHOT_255.inputCount,
    parentReleaseId: parent.releaseId,
    researchUpgradeLastId: census.newerRepositoryReleaseWatch.researchUpgradeId,
    censusRecordCount: census.censusRecordCount,
    totalSelectableMainSceneMorphologyCount: census.totalSelectableMainSceneMorphologyCount,
    internalPrimitiveCount: census.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: census.crossSourceIdentityCount,
    registrationCount: census.registrationCount,
    manifest,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest255Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeLastId }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeLastId })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
