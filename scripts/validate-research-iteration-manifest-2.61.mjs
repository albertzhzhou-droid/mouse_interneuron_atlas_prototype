#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_260, validateResearchIterationManifest260Snapshot } from "./validate-research-iteration-manifest-2.60-snapshot.mjs";
import { INPUTS_261, MANIFEST_261_PATH, buildResearchIterationManifest261 } from "../tools/build_research_iteration_manifest_2_61.mjs";

export async function validateResearchIterationManifest261(override = null) {
  const built = await buildResearchIterationManifest261();
  const bytes = await readFile(MANIFEST_261_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.61 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.61 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.61 input receipt");
  for (const [id, inputPath] of INPUTS_261) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.61 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest260Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_260.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_260.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_260.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_260.contentSha256) throw new Error("2.61 parent must remain the sealed 2.60 release");

  const facet = manifest.exactReferences.neuromorphoSourceCellTypeFacet261;
  const registry = manifest.exactReferences.researchRegistryDenominators261;
  const layout = manifest.exactReferences.iteration261Layout;
  const labelCounts = new Map(facet.cellTypeLabelRecordCounts.map(({ value, count }) => [value, count]));
  if (facet.repositoryRelease !== "8.6.124" || facet.queryRecordCount !== 1097
    || facet.rawCellTypeLabelCount !== 27 || facet.recordLabelMembershipCount !== 2735
    || facet.multiLabelRecordCount !== 1095 || facet.missingCellTypeRecordCount !== 0
    || facet.countsAreMutuallyExclusive !== false || facet.filterAutomaticallySelectsRecord !== false
    || facet.newGeometryObjectCount !== 0 || facet.molecularProfileJoinCount !== 0
    || facet.sameCellJoinCount !== 0 || facet.internalPrimitiveCount !== 0 || facet.atlasRegistrationCount !== 0
    || facet.researchUpgradeId !== "UPG-236" || facet.runtime.filterChangesActiveRecord !== false
    || facet.runtime.exactRecordSelectionChangesActiveGeometry !== true
    || facet.runtime.selectionUsesChecksumVerifiedSourceObject !== true
    || labelCounts.get("interneuron") !== 1097 || labelCounts.get("Inhibitory") !== 510
    || labelCounts.get("Excitatory") !== 397 || labelCounts.get("Renshaw") !== 8
    || labelCounts.get("pre-motor") !== 49) throw new Error("2.61 pinned NeuroMorpho source cell-type facet receipt changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 219
    || registry.displayedUpgradeCount !== 32 || registry.staleCanonicalDenominatorLiteralCount !== 0
    || manifest.registrySummary.researchUpgradeCount !== 219
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_260.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_61.md") throw new Error("2.61 registry, rollback or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    rawCellTypeLabelCount: facet.rawCellTypeLabelCount,
    recordLabelMembershipCount: facet.recordLabelMembershipCount,
    multiLabelRecordCount: facet.multiLabelRecordCount,
    newGeometryObjectCount: facet.newGeometryObjectCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest261()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
