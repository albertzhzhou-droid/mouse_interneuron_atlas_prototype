#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_272, validateResearchIterationManifest272Snapshot } from "./validate-research-iteration-manifest-2.72-snapshot.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT_273 = Object.freeze({
  path: "data/research-iteration-manifest-2.73.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.73.0",
  version: "2.73.0-research.1",
  bytes: 638713,
  fileSha256: "637b28e161e4f7b018697de7503053a336acb1ecaf2de079ac0cab3742632c21",
  contentSha256: "ca91cd8be022fbef5457b3db7698da06a49a8d0155abe12af5d193c696cd6d00",
  inputCount: 694,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateResearchIterationManifest273Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_273.path));
  if (bytes.byteLength !== SNAPSHOT_273.bytes || sha256(bytes) !== SNAPSHOT_273.fileSha256) throw new Error("Immutable 2.73 manifest file receipt changed");
  const diskManifest = JSON.parse(bytes.toString("utf8"));
  const manifest = override ?? diskManifest;
  if (JSON.stringify(manifest) !== JSON.stringify(diskManifest)) throw new Error("Immutable 2.73 manifest override differs from sealed file");
  const parent = await validateResearchIterationManifest272Snapshot();
  const denom = manifest.exactReferences.researchRegistryDenominators273;
  const audit = manifest.exactReferences.neuromorphoRelease126ToddStableIdAudit245V02;
  const representation = manifest.exactReferences.evidenceAware3dRepresentationContract07;
  const layout = manifest.exactReferences.iteration273Layout;
  const activeRecordIntegration = manifest.exactReferences.supplementalToddActiveRecordIntegration273;
  if (computeManifestContentSha256(manifest) !== SNAPSHOT_273.contentSha256
    || manifest.manifestSchemaVersion !== "2.73.0" || manifest.releaseId !== SNAPSHOT_273.releaseId
    || manifest.application.version !== SNAPSHOT_273.version || manifest.integrity.inputCount !== SNAPSHOT_273.inputCount
    || manifest.authoritativeInputs.length !== SNAPSHOT_273.inputCount) throw new Error("Immutable 2.73 content or identity receipt changed");
  if (manifest.parentIterationManifest.path !== SNAPSHOT_272.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_272.fileSha256
    || denom.canonicalSourcePackageCount !== 29 || denom.canonicalRecordSetCount !== 38
    || denom.bundledExactCellProfileRosterCount !== 12 || denom.bundledExactSourceObjectSetCount !== 3
    || denom.sourceProfileCount !== 387 || denom.upgradeCount !== 229 || denom.completedUpgradeCount !== 68
    || audit.currentRosterCount !== 339 || audit.baselineToddCount !== 309 || audit.addedStableIdCount !== 30
    || audit.removedStableIdCount !== 0 || audit.standardizedSwcNodeCount !== 24209
    || audit.standardizedSwcSegmentCount !== 24179 || audit.sourceDiameterReportedCount !== 10
    || audit.sourceDiameterNotReportedCount !== 20 || audit.originalPaperCrosswalkCount !== 0
    || audit.supplementaryRoutesAdmitted !== 30 || audit.censusExpansion !== 0
    || audit.renderedInternalPrimitives !== 0 || representation.routeCount !== 47
    || representation.supplementaryRouteCount !== 30 || representation.radiusDerivedRouteCount !== 10
    || representation.centerlineOnlyRouteCount !== 20 || representation.internalPrimitiveCount !== 0
    || activeRecordIntegration.baseSearchIndexRecordCount !== 641
    || activeRecordIntegration.verifiedSupplementalRecordCount !== 30
    || activeRecordIntegration.runtimeSearchRecordCount !== 671
    || activeRecordIntegration.baseMorphologyRecordCount !== 149
    || activeRecordIntegration.runtimeMorphologyRecordCount !== 179
    || activeRecordIntegration.frozenCensusRecordCount !== 142
    || activeRecordIntegration.supplementaryExactMorphologyRecordCount !== 37
    || activeRecordIntegration.sourceRoutePackCanonicalSha256 !== "01db2a4df6f66e2fc486041a901b2f5dc9c9ad5238cb637e01ff49d8e8e07537"
    || activeRecordIntegration.activeRecordResolverCount !== 1 || activeRecordIntegration.censusExpansionCount !== 0
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_272.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_73.md") {
    throw new Error("Immutable 2.73 parent, denominator, source admission, representation, or layout receipt changed");
  }
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: manifest.integrity.inputCount,
    parentReleaseId: parent.releaseId,
    currentToddRoster: audit.currentRosterCount,
    supplementaryRouteCount: audit.supplementaryRoutesAdmitted,
    radiusDerivedRouteCount: audit.sourceDiameterReportedCount,
    centerlineOnlyRouteCount: audit.sourceDiameterNotReportedCount,
    internalPrimitiveCount: audit.renderedInternalPrimitives,
    verifiedRuntimeSearchRecordCount: activeRecordIntegration.runtimeSearchRecordCount,
    verifiedRuntimeMorphologyRecordCount: activeRecordIntegration.runtimeMorphologyRecordCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
    path: SNAPSHOT_273.path,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest273Snapshot()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
