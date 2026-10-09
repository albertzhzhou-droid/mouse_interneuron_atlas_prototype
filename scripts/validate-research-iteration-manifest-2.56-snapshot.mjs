#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_255, validateResearchIterationManifest255Snapshot } from "./validate-research-iteration-manifest-2.55-snapshot.mjs";

export const SNAPSHOT_256 = Object.freeze({
  path: "data/research-iteration-manifest-2.56.json",
  bytes: 358724,
  fileSha256: "c08ce63ddd197c868d4243f4b9919ce8924d568708f6041e157f380c45fee31f",
  contentSha256: "f647b41c62d67ed3258f5e58623a8fd2d1d3ee7e25bec9f6c4b5576135be168f",
  inputCount: 447,
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest256Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_256.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_256.bytes || sha256(bytes) !== SNAPSHOT_256.fileSha256) throw new Error("Immutable 2.56 file receipt changed");
  if (manifest.manifestContentSha256 !== SNAPSHOT_256.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_256.contentSha256) throw new Error("Immutable 2.56 content receipt changed");
  if (manifest.manifestSchemaVersion !== "2.56.0"
    || manifest.releaseId !== "ohri-mouse-interneuron-research-iteration-2.56.0"
    || manifest.application.version !== "2.56.0-research.1"
    || manifest.integrity.inputCount !== SNAPSHOT_256.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_256.inputCount) throw new Error("Immutable 2.56 identity or input count changed");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== SNAPSHOT_256.inputCount || paths.size !== ids.size) throw new Error("Immutable 2.56 input receipt uniqueness changed");
  for (const [id, inputPath] of [
    ["kellyZebrafishTaxonomyContract", "data/kelly-zebrafish-spinal-interneuron-taxonomy-0.1.json"],
    ["neuromorphoReleaseDeltaAudit", "data/neuromorpho-release-8-6-125-query-delta-audit-0.1.json"],
    ["iteration256Builder", "tools/build_research_iteration_manifest_2_56.mjs"],
    ["iteration256Validator", "scripts/validate-research-iteration-manifest-2.56.mjs"],
    ["iteration256Tests", "tests/research-iteration-manifest-2.56.test.mjs"],
    ["iteration256Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_56.md"],
  ]) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`Immutable 2.56 input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest255Snapshot();
  const parentBytes = await readFile(path.join(ROOT, SNAPSHOT_255.path));
  if (manifest.parentIterationManifest.path !== SNAPSHOT_255.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_255.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_255.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_255.contentSha256
    || sha256(parentBytes) !== SNAPSHOT_255.fileSha256) throw new Error("Immutable 2.56 parent receipt changed");

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
    || registry.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("Immutable 2.56 historical registry denominators changed");

  const fish = manifest.exactReferences.kellyZebrafishSpinalTaxonomy256;
  if (fish.contractId !== "kelly-zebrafish-spinal-interneuron-taxonomy-0.1"
    || fish.datasetId !== "GSE232801"
    || fish.species !== "Danio rerio"
    || fish.populationCount !== 10
    || fish.reportedAnimalOrCordDenominator !== null
    || fish.animalOrCordDenominatorStatus !== "source_report_conflict"
    || fish.exactBarcodeToInterneuronLabelMapVerified !== false
    || fish.includedInCoreMouseTypeRecordCount !== false
    || fish.generatedCellGeometryCount !== 0
    || fish.sameCellMorphologyLinkCount !== 0
    || fish.internalStructureCount !== 0
    || fish.mouseTypeEquivalenceCount !== 0
    || fish.registrationCount !== 0) throw new Error("Immutable 2.56 zebrafish taxonomy boundary changed");

  const delta = manifest.exactReferences.neuromorphoReleaseDeltaAudit256;
  if (delta.baselineRelease !== "8.6.124"
    || delta.candidateRelease !== "8.6.125"
    || delta.queriedRecordCount !== 142
    || delta.semanticallyUnchangedRecordCount !== 142
    || delta.changedSemanticMetadataRecordCount !== 0
    || delta.rawResponseRetained !== false
    || delta.independentReproductionStatus !== "requires_exact_GET_rerun"
    || delta.geometryFileHashesRechecked !== false
    || delta.fileSpecificReuseRightsRechecked !== false
    || delta.activeModelRelease !== "8.6.124"
    || delta.promotedIntoActiveModel !== false
    || delta.sameCellInternalStructureCount !== 0
    || delta.crossSourceIdentityCount !== 0
    || delta.registrationCount !== 0) throw new Error("Immutable 2.56 metadata-only morphology-release boundary changed");

  if (manifest.exactReferences.iteration256Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration256Layout.rollbackParent !== SNAPSHOT_255.path
    || manifest.exactReferences.iteration256Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_56.md"
    || manifest.registrySummary.researchUpgradeCount !== 212
    || manifest.registrySummary.canonicalSourcePackageCount !== 28
    || manifest.registrySummary.canonicalRecordSetCount !== 37
    || manifest.registrySummary.bundledExactRosterCount !== 11
    || manifest.registrySummary.bundledExactObjectSetCount !== 2) throw new Error("Immutable 2.56 rollback, no-copy or registry receipt changed");
  return {
    releaseId: manifest.releaseId,
    inputCount: SNAPSHOT_256.inputCount,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    sourceCount: registry.canonicalSourcePackageCount,
    recordSetCount: registry.canonicalRecordSetCount,
    activeMorphologyRelease: delta.activeModelRelease,
    fullProjectCopyCount: manifest.exactReferences.iteration256Layout.fullProjectCopyCount,
    manifest,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest256Snapshot()
    .then(({ releaseId, inputCount, parentReleaseId, researchUpgradeCount }) => console.log(JSON.stringify({ releaseId, inputCount, parentReleaseId, researchUpgradeCount })))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
