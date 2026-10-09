#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_267, validateResearchIterationManifest267Snapshot } from "./validate-research-iteration-manifest-2.67-snapshot.mjs";
import { INPUTS_268, MANIFEST_268_PATH, buildResearchIterationManifest268 } from "../tools/build_research_iteration_manifest_2_68.mjs";

export async function validateResearchIterationManifest268(override = null) {
  const built = await buildResearchIterationManifest268();
  const bytes = await readFile(MANIFEST_268_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.68 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.68 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.68 input receipt");
  for (const [id, inputPath] of INPUTS_268) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.68 exact input receipt missing: ${id}`);
  }
  const parent = await validateResearchIterationManifest267Snapshot();
  const layout = manifest.exactReferences.iteration268Layout;
  const denominators = manifest.exactReferences.researchRegistryDenominators268;
  const audit = manifest.exactReferences.bilXeniumSpatialAudit244;
  if (manifest.parentIterationManifest.path !== SNAPSHOT_267.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_267.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_267.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_267.contentSha256) throw new Error("2.68 parent must remain the sealed 2.67 release");
  if (denominators.canonicalSourcePackageCount !== 28 || denominators.canonicalRecordSetCount !== 37
    || denominators.bundledExactCellProfileRosterCount !== 11 || denominators.bundledExactSourceObjectSetCount !== 2
    || denominators.sourceProfileCount !== 387 || denominators.upgradeCount !== 226
    || denominators.completedUpgradeCount !== 65 || denominators.displayedUpgradeCount !== 39
    || denominators.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 226) {
    throw new Error("2.68 live registry denominator receipt changed");
  }
  if (audit.researchUpgradeId !== "UPG-244" || audit.publicationStatus !== "bioRxiv_preprint"
    || audit.listedRunSlideFolderCount !== 16 || audit.paperReportedAnimals !== 14
    || audit.paperReportedSections !== 523 || audit.targetedGeneCount !== 480
    || audit.datasetSpecificRightsVerified !== false || audit.payloadBytesDownloaded !== 0
    || audit.admittedSectionLocalBoundaryObjects !== 0 || audit.exactInterneuronRosterRows !== 0
    || audit.admittedThreeDimensionalCellObjects !== 0 || audit.joins !== 0
    || audit.registrations !== 0 || audit.measurements !== 0) throw new Error("2.68 BIL/Xenium preprint, rights or no-admission boundary changed");
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_267.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_68.md") throw new Error("2.68 immutable rollback or incremental-layout receipt changed");
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: denominators.upgradeCount,
    displayedUpgradeCount: denominators.displayedUpgradeCount,
    xeniumAudit: audit.researchUpgradeId,
    publicationStatus: audit.publicationStatus,
    downloadedPayloadBytes: audit.payloadBytesDownloaded,
    admitted3DCellObjects: audit.admittedThreeDimensionalCellObjects,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest268()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
