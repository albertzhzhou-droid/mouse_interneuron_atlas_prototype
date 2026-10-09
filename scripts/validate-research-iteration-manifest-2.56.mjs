#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_255, validateResearchIterationManifest255Snapshot } from "./validate-research-iteration-manifest-2.55-snapshot.mjs";
import { INPUTS_256, MANIFEST_256_PATH, buildResearchIterationManifest256 } from "../tools/build_research_iteration_manifest_2_56.mjs";

export async function validateResearchIterationManifest256(override = null) {
  const built = await buildResearchIterationManifest256();
  const bytes = await readFile(MANIFEST_256_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.56 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.56 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.56 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.56 input receipt");
  for (const [id, inputPath] of INPUTS_256) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.56 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest255Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_255.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_255.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_255.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_255.contentSha256) throw new Error("2.56 parent must remain the sealed 2.55 release");

  const registry = manifest.exactReferences.researchRegistryDenominators256;
  if (registry.canonicalSourcePackageCount !== 28
    || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11
    || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387
    || registry.comparativeZebrafishLabelCount !== 10
    || registry.comparativeZebrafishLabelsIncludedInCoreProfileCount !== false
    || registry.upgradeCount !== 212
    || registry.displayedUpgradeCount !== 30
    || registry.denominatorDisplayCount !== 8
    || registry.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("2.56 dynamic source denominators or separate fish-label boundary changed");

  const fish = manifest.exactReferences.kellyZebrafishSpinalTaxonomy256;
  if (fish.contractId !== "kelly-zebrafish-spinal-interneuron-taxonomy-0.1"
    || fish.datasetId !== "GSE232801"
    || fish.species !== "Danio rerio"
    || fish.lifeStage !== "4 dpf larva"
    || fish.region !== "spinal cord"
    || JSON.stringify(fish.populationLabels) !== JSON.stringify(["DoLA", "CoLo", "v1", "v2b", "v2s", "dl1", "dl2", "v2a", "v0v", "v0c"])
    || fish.animalOrCordDenominatorStatus !== "source_report_conflict"
    || fish.exactBarcodeToInterneuronLabelMapVerified !== false
    || fish.includedInCoreMouseTypeRecordCount !== false
    || fish.generatedCellGeometryCount !== 0
    || fish.sameCellMorphologyLinkCount !== 0
    || fish.internalStructureCount !== 0
    || fish.mouseTypeEquivalenceCount !== 0
    || fish.registrationCount !== 0) throw new Error("2.56 zebrafish source-local taxonomy or cross-species boundary changed");

  const delta = manifest.exactReferences.neuromorphoReleaseDeltaAudit256;
  if (delta.baselineRelease !== "8.6.124"
    || delta.candidateRelease !== "8.6.125"
    || delta.queriedRecordCount !== 142
    || delta.stableNeuronIdCount !== 142
    || delta.semanticallyUnchangedRecordCount !== 142
    || delta.addedRecordCount !== 0
    || delta.removedRecordCount !== 0
    || delta.changedSemanticMetadataRecordCount !== 0
    || delta.rawResponseRetained !== false
    || delta.independentReproductionStatus !== "requires_exact_GET_rerun"
    || delta.geometryFileHashesRechecked !== false
    || delta.dimensionalityDeltaAuditedAtAssetLevel !== false
    || delta.fileSpecificReuseRightsRechecked !== false
    || delta.activeModelRelease !== "8.6.124"
    || delta.promotedIntoActiveModel !== false
    || delta.sameCellInternalStructureCount !== 0
    || delta.crossSourceIdentityCount !== 0
    || delta.registrationCount !== 0) throw new Error("2.56 NeuroMorpho metadata-only comparison exceeded its geometry or rights evidence");

  if (manifest.exactReferences.iteration256Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration256Layout.rollbackParent !== SNAPSHOT_255.path
    || manifest.exactReferences.iteration256Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_56.md"
    || manifest.registrySummary.researchUpgradeCount !== 212
    || manifest.registrySummary.canonicalSourcePackageCount !== 28
    || manifest.registrySummary.canonicalRecordSetCount !== 37
    || manifest.registrySummary.bundledExactRosterCount !== 11
    || manifest.registrySummary.bundledExactObjectSetCount !== 2) throw new Error("2.56 rollback, no-copy or registry receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    sourceCount: registry.canonicalSourcePackageCount,
    recordSetCount: registry.canonicalRecordSetCount,
    comparativeFishLabelCount: fish.populationLabels.length,
    nmoChangedSemanticMetadataRecordCount: delta.changedSemanticMetadataRecordCount,
    activeMorphologyRelease: delta.activeModelRelease,
    fullProjectCopyCount: manifest.exactReferences.iteration256Layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest256()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
