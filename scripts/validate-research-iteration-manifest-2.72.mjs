#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_271, validateResearchIterationManifest271Snapshot } from "./validate-research-iteration-manifest-2.71-snapshot.mjs";
import { INPUTS_272, MANIFEST_272_PATH, buildResearchIterationManifest272 } from "../tools/build_research_iteration_manifest_2_72.mjs";

export async function validateResearchIterationManifest272(override = null) {
  const built = await buildResearchIterationManifest272();
  const bytes = await readFile(MANIFEST_272_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.72 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.72 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.72 input receipt");
  for (const [, inputPath] of INPUTS_272) {
    if (!manifest.authoritativeInputs.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.72 exact input receipt missing: ${inputPath}`);
  }
  const parent = await validateResearchIterationManifest271Snapshot();
  const denominators = manifest.exactReferences.researchRegistryDenominators272;
  const audit = manifest.exactReferences.neuromorphoRelease126ToddStableIdAudit245;
  const layout = manifest.exactReferences.iteration272Layout;
  if (manifest.parentIterationManifest.path !== SNAPSHOT_271.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_271.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_271.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_271.contentSha256) throw new Error("2.72 parent must remain the sealed 2.71 release");
  if (denominators.canonicalSourcePackageCount !== 28 || denominators.canonicalRecordSetCount !== 37
    || denominators.bundledExactCellProfileRosterCount !== 11 || denominators.bundledExactSourceObjectSetCount !== 2
    || denominators.sourceProfileCount !== 387 || denominators.upgradeCount !== 228
    || denominators.completedUpgradeCount !== 67 || denominators.displayedUpgradeCount !== 39
    || denominators.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 228) {
    throw new Error("2.72 live registry denominator receipt changed");
  }
  if (audit.researchUpgradeId !== "UPG-245" || audit.release !== "8.6.126"
    || audit.candidateStableIdCount !== 30 || audit.uniqueCandidateNameCount !== 30
    || audit.baselineRelease !== "8.6.124" || audit.baselineQueryRecordCount !== 1097
    || audit.baselineToddQueryRecordCount !== 309 || audit.candidateIdsComparedAgainstBaseline !== 30
    || audit.candidateIdsFoundInBaseline !== 0 || audit.releaseSetCandidatesAbsentFromBaseline !== 30
    || audit.observedCurrentQueryHits !== 339 || audit.baselineToddCountPlusCandidates !== 339
    || audit.arithmeticCountReconciles !== true || audit.arithmeticIsNotACompleteCurrentRosterProof !== true
    || audit.completeCurrentStableIdRosterRetrieved !== false
    || audit.completeCurrentQueryDeltaStatus !== "unresolved_without_complete_current_id_roster"
    || audit.removedRecordCount !== null || audit.changedRecordCount !== null
    || audit.candidateSourceFilesDownloaded !== 0 || audit.candidateSourceFilesHashed !== 0
    || audit.objectLevelReuseTermsVerified !== false || audit.fileDimensionalityIndependentlyInspected !== false
    || audit.fileCompletenessIndependentlyInspected !== false || audit.newRecordsAdmitted !== 0
    || audit.newGeometryObjectsAdmitted !== 0 || audit.newIdentityJoins !== 0 || audit.registrations !== 0 || audit.measurements !== 0) {
    throw new Error("2.72 UPG-245 stable-ID delta, source-file gates, or no-admission receipt changed");
  }
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_271.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_72.md") throw new Error("2.72 immutable rollback or incremental-layout receipt changed");
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: denominators.upgradeCount,
    completedUpgradeCount: denominators.completedUpgradeCount,
    auditId: audit.auditId,
    candidateStableIdCount: audit.candidateStableIdCount,
    candidateIdsFoundInBaseline: audit.candidateIdsFoundInBaseline,
    baselineToddQueryRecordCount: audit.baselineToddQueryRecordCount,
    currentUiHits: audit.observedCurrentQueryHits,
    currentRosterComplete: audit.completeCurrentStableIdRosterRetrieved,
    sourceFilesDownloaded: audit.candidateSourceFilesDownloaded,
    objectLevelReuseTermsVerified: audit.objectLevelReuseTermsVerified,
    newGeometryObjectsAdmitted: audit.newGeometryObjectsAdmitted,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest272()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
