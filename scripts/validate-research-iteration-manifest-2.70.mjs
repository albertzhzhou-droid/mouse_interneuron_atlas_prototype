#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_269, validateResearchIterationManifest269Snapshot } from "./validate-research-iteration-manifest-2.69-snapshot.mjs";
import { INPUTS_270, MANIFEST_270_PATH, buildResearchIterationManifest270 } from "../tools/build_research_iteration_manifest_2_70.mjs";

export async function validateResearchIterationManifest270(override = null) {
  const built = await buildResearchIterationManifest270();
  const bytes = await readFile(MANIFEST_270_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.70 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.70 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.70 input receipt");
  for (const [, inputPath] of INPUTS_270) {
    if (!manifest.authoritativeInputs.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.70 exact input receipt missing: ${inputPath}`);
  }
  const parent = await validateResearchIterationManifest269Snapshot();
  const layout = manifest.exactReferences.iteration270Layout;
  const denominators = manifest.exactReferences.researchRegistryDenominators270;
  const audit = manifest.exactReferences.neuromorphoRelease126UiQuery245;
  if (manifest.parentIterationManifest.path !== SNAPSHOT_269.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_269.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_269.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_269.contentSha256) throw new Error("2.70 parent must remain the sealed 2.69 release");
  if (denominators.canonicalSourcePackageCount !== 28 || denominators.canonicalRecordSetCount !== 37
    || denominators.bundledExactCellProfileRosterCount !== 11 || denominators.bundledExactSourceObjectSetCount !== 2
    || denominators.sourceProfileCount !== 387 || denominators.upgradeCount !== 227
    || denominators.completedUpgradeCount !== 66 || denominators.displayedUpgradeCount !== 39
    || denominators.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 227) {
    throw new Error("2.70 live registry denominator receipt changed");
  }
  if (audit.researchUpgradeId !== "UPG-245" || audit.release !== "8.6.126" || audit.releaseDate !== "2026-09-23"
    || audit.reportedRepositoryReconstructionCount !== 298745
    || JSON.stringify(audit.exactUiFilters) !== JSON.stringify([
      { field: "species", value: "mouse" },
      { field: "brain_region", value: "spinal cord" },
      { field: "cell_type", value: "interneuron" },
      { field: "archive", value: "Todd" },
    ]) || audit.ageFilterApplied !== false || audit.observedMetadataUiHitCount !== 339
    || audit.stableNeuronIdsRetrieved !== false || audit.machineReadableResponseRetrieved !== false
    || audit.baselineRelease !== "8.6.124" || audit.baselineQueryRecordCount !== 1097
    || audit.candidateRecordIdsCompared !== 0 || audit.addedRecordCount !== null || audit.removedRecordCount !== null
    || audit.changedRecordCount !== null || audit.deltaStatus !== "unresolved_without_stable_ids"
    || audit.newRecordsAdmitted !== 0 || audit.newGeometryObjectsAdmitted !== 0 || audit.newIdentityJoins !== 0
    || audit.registrations !== 0 || audit.measurements !== 0 || audit.payloadBytesDownloaded !== 0) {
    throw new Error("2.70 NeuroMorpho UI-query, unresolved-delta, or zero-admission receipt changed");
  }
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_269.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_70.md") throw new Error("2.70 immutable rollback or incremental-layout receipt changed");
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: denominators.upgradeCount,
    displayedUpgradeCount: denominators.displayedUpgradeCount,
    audit: audit.auditId,
    uiHits: audit.observedMetadataUiHitCount,
    baselineRecordCount: audit.baselineQueryRecordCount,
    stableIdsRetrieved: audit.stableNeuronIdsRetrieved,
    admittedGeometry: audit.newGeometryObjectsAdmitted,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest270()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
