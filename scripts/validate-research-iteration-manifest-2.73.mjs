#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_272, validateResearchIterationManifest272Snapshot } from "./validate-research-iteration-manifest-2.72-snapshot.mjs";
import { INPUTS_273, MANIFEST_273_PATH, buildResearchIterationManifest273 } from "../tools/build_research_iteration_manifest_2_73.mjs";

export async function validateResearchIterationManifest273(override = null) {
  const built = await buildResearchIterationManifest273();
  const bytes = await readFile(MANIFEST_273_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.73 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.73 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.73 input receipt");
  for (const [, inputPath] of INPUTS_273) {
    if (!manifest.authoritativeInputs.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.73 exact input receipt missing: ${inputPath}`);
  }
  const parent = await validateResearchIterationManifest272Snapshot();
  const parentReceipt = manifest.parentIterationManifest;
  if (parentReceipt.path !== SNAPSHOT_272.path || parentReceipt.releaseId !== parent.releaseId
    || parentReceipt.bytes !== SNAPSHOT_272.bytes || parentReceipt.fileSha256 !== SNAPSHOT_272.fileSha256
    || parentReceipt.contentSha256 !== SNAPSHOT_272.contentSha256) throw new Error("2.73 parent must remain the sealed 2.72 release");
  const denominators = manifest.exactReferences.researchRegistryDenominators273;
  if (denominators.canonicalSourcePackageCount !== 29 || denominators.canonicalRecordSetCount !== 38
    || denominators.bundledExactCellProfileRosterCount !== 12 || denominators.bundledExactSourceObjectSetCount !== 3
    || denominators.sourceProfileCount !== 387 || denominators.upgradeCount !== 229
    || denominators.completedUpgradeCount !== 68 || denominators.displayedUpgradeCount !== 38
    || denominators.denominatorDisplayCount !== 8 || denominators.staleCanonicalDenominatorLiteralCount !== 0) {
    throw new Error("2.73 live research registry denominators changed");
  }
  const audit = manifest.exactReferences.neuromorphoRelease126ToddStableIdAudit245V02;
  if (audit.researchUpgradeId !== "UPG-245" || audit.currentRosterCount !== 339 || audit.baselineToddCount !== 309
    || audit.commonStableIdCount !== 309 || audit.addedStableIdCount !== 30 || audit.removedStableIdCount !== 0
    || audit.commonMetadataChangeCount !== 0 || audit.standardizedSwcCount !== 30
    || audit.standardizedSwcNodeCount !== 24209 || audit.standardizedSwcSegmentCount !== 24179
    || audit.sourceDiameterReportedCount !== 10 || audit.sourceDiameterNotReportedCount !== 20
    || audit.originalPaperCrosswalkCount !== 0 || audit.supplementaryRoutesAdmitted !== 30
    || audit.supplementaryGeometryObjectsAdmitted !== 30 || audit.censusExpansion !== 0
    || audit.crossSourceIdentityJoins !== 0 || audit.atlasRegistrations !== 0 || audit.biologicalMeasurements !== 0
    || audit.renderedInternalPrimitives !== 0 || audit.biologicalCompletenessIndependentlyEstablishedCount !== 0) {
    throw new Error("2.73 UPG-245 roster, source geometry, or bounded-admission receipt changed");
  }
  const rendering = manifest.exactReferences.evidenceAware3dRepresentationContract07;
  if (rendering.releaseId !== "ohri-evidence-aware-3d-representation-contract-0.7.0"
    || rendering.routeCount !== 47 || rendering.supplementaryRouteCount !== 30
    || rendering.radiusDerivedRouteCount !== 10 || rendering.centerlineOnlyRouteCount !== 20
    || rendering.internalPrimitiveCount !== 0 || rendering.crossSourceIdentityCount !== 0
    || rendering.projectRegistrationCount !== 0) throw new Error("2.73 representation contract summary changed");
  const activeRecordIntegration = manifest.exactReferences.supplementalToddActiveRecordIntegration273;
  if (activeRecordIntegration.baseSearchIndexRecordCount !== 641
    || activeRecordIntegration.verifiedSupplementalRecordCount !== 30
    || activeRecordIntegration.runtimeSearchRecordCount !== 671
    || activeRecordIntegration.baseMorphologyRecordCount !== 149
    || activeRecordIntegration.runtimeMorphologyRecordCount !== 179
    || activeRecordIntegration.frozenCensusRecordCount !== 142
    || activeRecordIntegration.supplementaryExactMorphologyRecordCount !== 37
    || activeRecordIntegration.sourceRoutePackCanonicalSha256 !== "01db2a4df6f66e2fc486041a901b2f5dc9c9ad5238cb637e01ff49d8e8e07537"
    || activeRecordIntegration.activeRecordResolverCount !== 1
    || activeRecordIntegration.censusExpansionCount !== 0) throw new Error("2.73 verified active-record route-pack integration changed");
  const layout = manifest.exactReferences.iteration273Layout;
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_272.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_73.md") throw new Error("2.73 rollback or incremental-layout receipt changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    sourceCount: denominators.canonicalSourcePackageCount,
    recordSetCount: denominators.canonicalRecordSetCount,
    exactRosterCount: denominators.bundledExactCellProfileRosterCount,
    sourceObjectSetCount: denominators.bundledExactSourceObjectSetCount,
    upgradeCount: denominators.upgradeCount,
    currentToddRoster: audit.currentRosterCount,
    supplementaryRouteCount: audit.supplementaryRoutesAdmitted,
    radiusDerivedRouteCount: audit.sourceDiameterReportedCount,
    centerlineOnlyRouteCount: audit.sourceDiameterNotReportedCount,
    internalPrimitiveCount: audit.renderedInternalPrimitives,
    verifiedRuntimeSearchRecordCount: activeRecordIntegration.runtimeSearchRecordCount,
    verifiedRuntimeMorphologyRecordCount: activeRecordIntegration.runtimeMorphologyRecordCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest273()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
