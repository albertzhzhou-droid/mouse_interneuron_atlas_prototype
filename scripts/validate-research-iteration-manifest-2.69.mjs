#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_268, validateResearchIterationManifest268Snapshot } from "./validate-research-iteration-manifest-2.68-snapshot.mjs";
import { INPUTS_269, MANIFEST_269_PATH, buildResearchIterationManifest269 } from "../tools/build_research_iteration_manifest_2_69.mjs";

export async function validateResearchIterationManifest269(override = null) {
  const built = await buildResearchIterationManifest269();
  const bytes = await readFile(MANIFEST_269_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.69 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.69 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.69 input receipt");
  for (const [, inputPath] of INPUTS_269) {
    if (!manifest.authoritativeInputs.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.69 exact input receipt missing: ${inputPath}`);
  }
  const parent = await validateResearchIterationManifest268Snapshot();
  const layout = manifest.exactReferences.iteration269Layout;
  const denominators = manifest.exactReferences.researchRegistryDenominators269;
  const audit = manifest.exactReferences.boundedMouseSpinalEmRepositorySearch243;
  if (manifest.parentIterationManifest.path !== SNAPSHOT_268.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_268.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_268.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_268.contentSha256) throw new Error("2.69 parent must remain the sealed 2.68 release");
  if (denominators.canonicalSourcePackageCount !== 28 || denominators.canonicalRecordSetCount !== 37
    || denominators.bundledExactCellProfileRosterCount !== 11 || denominators.bundledExactSourceObjectSetCount !== 2
    || denominators.sourceProfileCount !== 387 || denominators.upgradeCount !== 227
    || denominators.completedUpgradeCount !== 66 || denominators.displayedUpgradeCount !== 39
    || denominators.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 227) {
    throw new Error("2.69 live registry denominator receipt changed");
  }
  if (audit.researchUpgradeId !== "UPG-243" || audit.queryCount !== 4 || audit.reviewedCandidateCount !== 2
    || audit.empiarMatchingEntries !== 0 || audit.empiarDisplayedEntryCount !== 3119 || audit.emdbMatchingEntries !== 0
    || JSON.stringify(audit.bioImageArchiveQueryResultCounts) !== JSON.stringify([2692, 889])
    || audit.eligibleMouseSpinalInterneuronObjectRoutes !== 0 || audit.downloadedPayloadBytes !== 0
    || audit.admittedVoxelVolumes !== 0 || audit.admittedSegmentationObjects !== 0 || audit.admittedObjectCrosswalks !== 0
    || audit.sameCellJoins !== 0 || audit.atlasRegistrations !== 0 || audit.biologicalMeasurements !== 0
    || audit.universalAbsenceClaim !== false) throw new Error("2.69 bounded open-EM search or no-admission receipt changed");
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_268.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_69.md") throw new Error("2.69 immutable rollback or incremental-layout receipt changed");
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: denominators.upgradeCount,
    displayedUpgradeCount: denominators.displayedUpgradeCount,
    audit: audit.auditId,
    eligibleObjectRoutes: audit.eligibleMouseSpinalInterneuronObjectRoutes,
    downloadedPayloadBytes: audit.downloadedPayloadBytes,
    admittedVoxelVolumes: audit.admittedVoxelVolumes,
    admittedSegmentationObjects: audit.admittedSegmentationObjects,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest269()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
