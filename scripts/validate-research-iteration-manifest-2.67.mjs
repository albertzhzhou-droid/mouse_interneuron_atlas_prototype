#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_266, validateResearchIterationManifest266 } from "./validate-research-iteration-manifest-2.66.mjs";
import { INPUTS_267, MANIFEST_267_PATH, buildResearchIterationManifest267 } from "../tools/build_research_iteration_manifest_2_67.mjs";

export async function validateResearchIterationManifest267(override = null) {
  const built = await buildResearchIterationManifest267();
  const bytes = await readFile(MANIFEST_267_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.67 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.67 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.67 input receipt");
  for (const [id, inputPath] of INPUTS_267) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.67 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest266();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_266.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_266.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_266.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_266.contentSha256) throw new Error("2.67 parent must remain the sealed 2.66 release");

  const policy = manifest.exactReferences.morphologyRenderModePolicy267;
  const queue = manifest.exactReferences.openMouseSpinalEmSearch243;
  const registry = manifest.exactReferences.researchRegistryDenominators267;
  const layout = manifest.exactReferences.iteration267Layout;
  if (policy.sharedResolver !== "app/morphology-render-mode.js"
    || policy.radiusSurfaceRequiresSourceLabelled3D !== true
    || policy.radiusSurfaceRequiresSourceReportedDiameter !== true
    || policy.eligible3DDefault !== "radius-derived-open-frusta"
    || policy.explicitCenterlineOverridePreserved !== true
    || policy.planar2DAlwaysCenterlineOnly !== true
    || policy.noDiameterOrUnreportedDimensionalityCenterlineOnly !== true
    || policy.surfaceIsObservedMembrane !== false || policy.sourceObjectIdentityChangesOnRecordSelection !== true
    || policy.sameSpecimenInternalObjectsAdmitted !== 0) throw new Error("2.67 source-authority rendering or planar boundary changed");
  if (queue.researchUpgradeId !== "UPG-243" || queue.status !== "planned_bounded_public_repository_search"
    || JSON.stringify(queue.repositories) !== JSON.stringify(["EMPIAR", "BioImage Archive", "EMDB"])
    || queue.rawPayloadBytesDownloaded !== 0 || queue.candidateVolumesAdmitted !== 0
    || queue.segmentationObjectsAdmitted !== 0 || queue.exactInterneuronObjectCrosswalksAdmitted !== 0
    || queue.registrations !== 0 || queue.measurements !== 0) throw new Error("2.67 UPG-243 planned-search and zero-admission boundary changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 225 || registry.completedUpgradeCount !== 65
    || registry.displayedUpgradeCount !== 38 || registry.staleCanonicalDenominatorLiteralCount !== 0
    || manifest.registrySummary.researchUpgradeCount !== 225 || layout.fullProjectCopyCount !== 0
    || layout.rollbackParent !== SNAPSHOT_266.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_67.md") throw new Error("2.67 registry denominator or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    displayedUpgradeCount: registry.displayedUpgradeCount,
    eligible3DDefault: policy.eligible3DDefault,
    plannedOpenVolumeAudit: queue.researchUpgradeId,
    admittedInternalObjects: policy.sameSpecimenInternalObjectsAdmitted,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest267()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
