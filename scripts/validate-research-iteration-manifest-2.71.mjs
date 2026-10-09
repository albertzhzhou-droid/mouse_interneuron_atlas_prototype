#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_270, validateResearchIterationManifest270Snapshot } from "./validate-research-iteration-manifest-2.70-snapshot.mjs";
import { INPUTS_271, MANIFEST_271_PATH, buildResearchIterationManifest271 } from "../tools/build_research_iteration_manifest_2_71.mjs";

export async function validateResearchIterationManifest271(override = null) {
  const built = await buildResearchIterationManifest271();
  const bytes = await readFile(MANIFEST_271_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.71 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.71 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.71 input receipt");
  for (const [, inputPath] of INPUTS_271) {
    if (!manifest.authoritativeInputs.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.71 exact input receipt missing: ${inputPath}`);
  }
  const parent = await validateResearchIterationManifest270Snapshot();
  const denominators = manifest.exactReferences.researchRegistryDenominators271;
  const coverage = manifest.exactReferences.neuromorphoTypeSourceDoiOverlap246;
  const layout = manifest.exactReferences.iteration271Layout;
  if (manifest.parentIterationManifest.path !== SNAPSHOT_270.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_270.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_270.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_270.contentSha256) throw new Error("2.71 parent must remain the sealed 2.70 release");
  if (denominators.canonicalSourcePackageCount !== 28 || denominators.canonicalRecordSetCount !== 37
    || denominators.bundledExactCellProfileRosterCount !== 11 || denominators.bundledExactSourceObjectSetCount !== 2
    || denominators.sourceProfileCount !== 387 || denominators.upgradeCount !== 228
    || denominators.completedUpgradeCount !== 67 || denominators.displayedUpgradeCount !== 39
    || denominators.staleCanonicalDenominatorLiteralCount !== 0 || manifest.registrySummary.researchUpgradeCount !== 228) {
    throw new Error("2.71 live registry denominator receipt changed");
  }
  if (coverage.researchUpgradeId !== "UPG-246" || coverage.morphologyRelease !== "8.6.124"
    || coverage.morphologyQueryRecordCount !== 1097 || coverage.taxonomySourceCount !== 10
    || coverage.sourceProfileCount !== 387 || coverage.exactDoiMatchedTaxonomySourceCount !== 0
    || coverage.exactDoiMatchedRecordCount !== 0 || coverage.identityJoins !== 0
    || coverage.geometryObjectsAdmitted !== 0) throw new Error("2.71 exact DOI coverage or no-admission receipt changed");
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_270.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_71.md") throw new Error("2.71 immutable rollback or incremental-layout receipt changed");
  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: denominators.upgradeCount,
    completedUpgradeCount: denominators.completedUpgradeCount,
    auditId: coverage.auditId,
    morphologyRelease: coverage.morphologyRelease,
    morphologyQueryRecordCount: coverage.morphologyQueryRecordCount,
    taxonomySourceCount: coverage.taxonomySourceCount,
    sourceProfileCount: coverage.sourceProfileCount,
    exactDoiMatchedRecordCount: coverage.exactDoiMatchedRecordCount,
    identityJoins: coverage.identityJoins,
    geometryObjectsAdmitted: coverage.geometryObjectsAdmitted,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest271()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
