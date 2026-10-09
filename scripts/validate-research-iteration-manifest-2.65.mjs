#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_264, validateResearchIterationManifest264Snapshot } from "./validate-research-iteration-manifest-2.64-snapshot.mjs";
import { INPUTS_265, MANIFEST_265_PATH, buildResearchIterationManifest265 } from "../tools/build_research_iteration_manifest_2_65.mjs";

export async function validateResearchIterationManifest265(override = null) {
  const built = await buildResearchIterationManifest265();
  const bytes = await readFile(MANIFEST_265_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.65 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.65 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.65 input receipt");
  for (const [id, inputPath] of INPUTS_265) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.65 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest264Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_264.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_264.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_264.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_264.contentSha256) throw new Error("2.65 parent must remain the sealed 2.64 release");

  const discovery = manifest.exactReferences.morphologyLabelDiscovery265;
  const sbfem = manifest.exactReferences.nakamuraSbfemAvailabilityWatch265;
  const registry = manifest.exactReferences.researchRegistryDenominators265;
  const layout = manifest.exactReferences.iteration265Layout;
  if (discovery.researchUpgradeId !== "UPG-241" || discovery.querySource !== "selected molecular profile's exact source label string"
    || discovery.searchSemantics !== "case-insensitive literal substring over repository metadata only"
    || discovery.sharedAcrossExactUniverseAndFrozenSubset !== true || discovery.requestClearsPriorGeometry !== true
    || discovery.requestClearsDefaultSelection !== true || discovery.defaultRecordFallbackSuppressed !== true
    || discovery.exactObjectSelectionRequiredBeforeRendering !== true || discovery.queryUrlParameter !== "morphologyQuery"
    || discovery.sourceLabelToSubtypeRelationshipCount !== 0 || discovery.sourceLabelToSameCellJoinCount !== 0
    || discovery.newMorphologyGeometryCount !== 0 || discovery.changesNeuroMorphoDenominators !== false) throw new Error("2.65 exact-label search or no-identity boundary changed");
  if (sbfem.researchUpgradeId !== "UPG-242" || sbfem.doi !== "10.7554/eLife.83108" || sbfem.species !== "Mus musculus"
    || sbfem.reportedSingleCellTracingCount !== 71 || sbfem.sbfsemFigure !== 4 || sbfem.serialSectionVideoSupplement !== 5
    || JSON.stringify(sbfem.dataAvailabilityNamedNumericalFigures) !== JSON.stringify([2, 7])
    || sbfem.articleAvailabilityStatementNamesAnEmVolumeOrSegmentationDeposit !== false || sbfem.exactPublicEmStackVerified !== false
    || sbfem.stableEmCellObjectCrosswalkVerified !== false || sbfem.voxelAxesAndScaleVerifiedForAnEmVolume !== false
    || sbfem.assetLevelReuseTermsVerified !== false || sbfem.downloadedPayloadBytes !== 0 || sbfem.admittedEmVolumes !== 0
    || sbfem.admittedCellOrOrganelleGeometry !== 0 || sbfem.admittedSameCellJoins !== 0 || sbfem.linksOnly !== true) throw new Error("2.65 Nakamura SBEM availability or no-geometry boundary changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 224 || registry.displayedUpgradeCount !== 36
    || registry.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 224
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_264.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_65.md") throw new Error("2.65 registry, rollback, or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    displayedUpgradeCount: registry.displayedUpgradeCount,
    sharedMorphologyIndexes: discovery.sharedAcrossExactUniverseAndFrozenSubset,
    explicitObjectSelectionRequired: discovery.exactObjectSelectionRequiredBeforeRendering,
    admittedInternalGeometry: sbfem.admittedCellOrOrganelleGeometry,
    downloadedPayloadBytes: sbfem.downloadedPayloadBytes,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest265()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
