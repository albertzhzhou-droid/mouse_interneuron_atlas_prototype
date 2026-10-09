#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_254, validateResearchIterationManifest254Snapshot } from "./validate-research-iteration-manifest-2.54-snapshot.mjs";
import { INPUTS_255, MANIFEST_255_PATH, buildResearchIterationManifest255 } from "../tools/build_research_iteration_manifest_2_55.mjs";

export async function validateResearchIterationManifest255(override = null) {
  const built = await buildResearchIterationManifest255();
  const bytes = await readFile(MANIFEST_255_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.55 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.55 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.55 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.55 input receipt");
  for (const [id, inputPath] of INPUTS_255) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.55 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest254Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_254.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_254.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_254.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_254.contentSha256) throw new Error("2.55 parent must remain the sealed 2.54 release");

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
    || census.independentSpecimenCount !== null) throw new Error("2.55 source-object universe or census denominators changed");
  if (census.dimensionality.sourceLabelled3D !== 140
    || census.dimensionality.sourceLabelled2D !== 2
    || census.dimensionality.planarDiameterMetadataRecords !== 2
    || census.dimensionality.radiusDerived3DSurfaceEligible3D !== 92
    || JSON.stringify(census.exactPlanarRecordIds) !== JSON.stringify([194468, 194469])) throw new Error("2.55 dimensionality or 2D radius boundary changed");
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
    || census.fullProjectCopyCount !== 0) throw new Error("2.55 source-label, provenance or next-release boundary changed");
  if (manifest.registrySummary.researchUpgradeCount !== 210
    || manifest.registrySummary.canonicalSourcePackageCount !== 27
    || manifest.registrySummary.canonicalRecordSetCount !== 36
    || manifest.registrySummary.bundledExactRosterCount !== 11) throw new Error("2.55 canonical registry denominators changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeLastId: census.newerRepositoryReleaseWatch.researchUpgradeId,
    censusRecordCount: census.censusRecordCount,
    totalSelectableMainSceneMorphologyCount: census.totalSelectableMainSceneMorphologyCount,
    sourceLabelled3D: census.dimensionality.sourceLabelled3D,
    sourceLabelled2D: census.dimensionality.sourceLabelled2D,
    internalPrimitiveCount: census.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: census.crossSourceIdentityCount,
    registrationCount: census.registrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest255()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
