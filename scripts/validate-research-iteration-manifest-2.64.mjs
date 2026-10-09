#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_263, validateResearchIterationManifest263Snapshot } from "./validate-research-iteration-manifest-2.63-snapshot.mjs";
import { INPUTS_264, MANIFEST_264_PATH, buildResearchIterationManifest264 } from "../tools/build_research_iteration_manifest_2_64.mjs";

export async function validateResearchIterationManifest264(override = null) {
  const built = await buildResearchIterationManifest264();
  const bytes = await readFile(MANIFEST_264_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.64 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.64 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.64 input receipt");
  for (const [id, inputPath] of INPUTS_264) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.64 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest263Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_263.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_263.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_263.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_263.contentSha256) throw new Error("2.64 parent must remain the sealed 2.63 release");

  const reference = manifest.exactReferences.svaraLarvalZebrafishSpinalSbemReference264;
  const registry = manifest.exactReferences.researchRegistryDenominators264;
  const layout = manifest.exactReferences.iteration264Layout;
  const packageNames = reference.listedSupplementPackages.map((pkg) => pkg.filename);
  if (reference.researchUpgradeId !== "UPG-240" || reference.doi !== "10.1016/j.celrep.2018.05.023"
    || reference.species !== "Danio rerio" || reference.lifeStage !== "6 dpf larval zebrafish" || reference.specimenCount !== 1
    || JSON.stringify(reference.reportedVolumeLengthMicrometre) !== JSON.stringify([74, 74, 207])
    || JSON.stringify(reference.reportedVoxelPitchNanometre) !== JSON.stringify([9, 9, 21]) || reference.sourceAxisOrderNamed !== false
    || reference.somataInVolume !== 2177 || reference.motoneuronCount !== 139 || reference.morphologyConsistentCiDCount !== 39
    || reference.completelyTracedCellContext !== 170 || reference.geneticV2aAssignmentAvailable !== false || reference.coBLCount !== 34
    || JSON.stringify(packageNames) !== JSON.stringify(["1-s2.0-S2211124718307563-mmc6.zip", "1-s2.0-S2211124718307563-mmc7.zip", "1-s2.0-S2211124718307563-mmc8.zip"])
    || reference.inspectedSupplementPackageCount !== 0 || reference.supplementSizesKnown !== false || reference.supplementChecksumsKnown !== false
    || reference.supplementMemberFormatsKnown !== false || reference.supplementObjectIdsKnown !== false || reference.perPackageReuseTermsVerified !== false
    || reference.articleLicense !== "CC BY 4.0" || reference.supplementLicenseEstablishedFromArticleLicense !== false
    || reference.admittedNeuronObjects !== 0 || reference.admittedSkeletons !== 0 || reference.admittedMeshes !== 0 || reference.admittedSynapseEdges !== 0
    || reference.sameCellJoinCount !== 0 || reference.mouseIdentityTransferAllowed !== false || reference.crossSpeciesCoordinateTransferAllowed !== false
    || reference.downloadedPayloadBytes !== 0 || reference.linksOnly !== true
    || reference.runtime.collapsedByDefault !== true || reference.runtime.linkedToSelectedCell !== false || reference.runtime.changesActiveRecord !== false
    || reference.runtime.displaysSourceImagesOrPackageMembers !== false || reference.runtime.createsNeuronGeometry !== false
    || reference.runtime.createsSynapseEdges !== false || reference.runtime.transfersSpeciesIdentityOrCoordinates !== false) throw new Error("2.64 Svara species, package, licensing, or no-geometry boundary changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 222 || registry.displayedUpgradeCount !== 35
    || registry.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 222
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_263.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_64.md") throw new Error("2.64 registry, rollback or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    species: reference.species,
    specimenCount: reference.specimenCount,
    listedSupplementPackageCount: reference.listedSupplementPackages.length,
    admittedNeuronObjects: reference.admittedNeuronObjects,
    admittedGeometryCount: reference.admittedSkeletons + reference.admittedMeshes,
    downloadedPayloadBytes: reference.downloadedPayloadBytes,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest264()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
