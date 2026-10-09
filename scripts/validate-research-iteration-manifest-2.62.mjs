#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_261, validateResearchIterationManifest261Snapshot } from "./validate-research-iteration-manifest-2.61-snapshot.mjs";
import { INPUTS_262, MANIFEST_262_PATH, buildResearchIterationManifest262 } from "../tools/build_research_iteration_manifest_2_62.mjs";

export async function validateResearchIterationManifest262(override = null) {
  const built = await buildResearchIterationManifest262();
  const bytes = await readFile(MANIFEST_262_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.62 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.62 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.62 input receipt");
  for (const [id, inputPath] of INPUTS_262) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.62 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest261Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_261.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_261.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_261.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_261.contentSha256) throw new Error("2.62 parent must remain the sealed 2.61 release");

  const crossTab = manifest.exactReferences.neuromorphoPaperCellTypeCrossTab262;
  const registry = manifest.exactReferences.researchRegistryDenominators262;
  const layout = manifest.exactReferences.iteration262Layout;
  const cellTypeLabels = new Set(crossTab.papers.flatMap((paper) => paper.cellTypeRows.map((row) => row.value)));
  const doiLabelMembershipCount = crossTab.papers.reduce((sum, paper) => sum + paper.cellTypeRows.reduce((n, row) => n + row.recordCount, 0), 0);
  const paperRecordMembershipCount = crossTab.papers.reduce((sum, paper) => sum + paper.nmoIds.length, 0);
  const allPaperNmoIds = crossTab.papers.flatMap((paper) => paper.nmoIds);
  if (crossTab.repositoryRelease !== "8.6.124" || crossTab.recordCount !== 1_097
    || crossTab.uniqueNmoIdCount !== 1_097 || crossTab.recordsWithoutNmoIdCount !== 0
    || crossTab.doiCount !== 12 || crossTab.doiMembershipCount !== 1_097
    || crossTab.recordsWithoutDoiCount !== 0 || crossTab.missingDoi !== null
    || crossTab.multiDoiRecordCount !== 0 || crossTab.multiLabelRecordCount !== 1_095
    || crossTab.figureMembershipRecordCount !== 0 || crossTab.figureMembershipUnassessableRecordCount !== 1_097
    || crossTab.figureMembershipStatus !== "not_encoded_in_index" || crossTab.figureMembershipIsAssessable !== false
    || crossTab.countsAreMutuallyExclusive !== false || crossTab.filterChangesActiveRecord !== false
    || crossTab.exactPairFilterSelectsRecord !== false || crossTab.newGeometryObjectCount !== 0
    || crossTab.sameCellJoinCount !== 0 || crossTab.molecularProfileJoinCount !== 0
    || crossTab.internalPrimitiveCount !== 0 || crossTab.atlasRegistrationCount !== 0
    || crossTab.researchUpgradeId !== "UPG-237" || crossTab.runtime.filterChangesActiveRecord !== false
    || crossTab.runtime.exactPairFilterSelectsRecord !== false
    || crossTab.runtime.geometryChangesOnlyAfterExplicitExactNmoSelection !== true
    || doiLabelMembershipCount !== 2_735 || crossTab.doiLabelMembershipCount !== 2_735
    || paperRecordMembershipCount !== 1_097 || crossTab.paperRecordMembershipCount !== 1_097
    || cellTypeLabels.size !== 27 || allPaperNmoIds.length !== 1_097
    || new Set(allPaperNmoIds).size !== 1_097
    || crossTab.papers.some((paper) => paper.nmoIds.length !== paper.recordCount
      || new Set(paper.nmoIds).size !== paper.nmoIds.length
      || paper.cellTypeRows.some((row) => row.nmoIds.length !== row.recordCount
        || new Set(row.nmoIds).size !== row.nmoIds.length))) throw new Error("2.62 exact paper × source-label cross-tab or non-geometry boundary changed");

  const abraira = crossTab.papers.find((paper) => paper.doi === "10.1016/j.cell.2016.12.010");
  const bannatyne = crossTab.papers.find((paper) => paper.doi === "10.1523/JNEUROSCI.0199-14.2014");
  if (abraira?.recordCount !== 650
    || abraira.cellTypeRows.find((row) => row.value === "Excitatory")?.recordCount !== 208
    || abraira.cellTypeRows.find((row) => row.value === "Inhibitory")?.recordCount !== 442
    || bannatyne?.recordCount !== 49
    || bannatyne.cellTypeRows.find((row) => row.value === "Renshaw")?.recordCount !== 8) throw new Error("2.62 pinned paper-specific label roster changed");
  if (registry.canonicalSourcePackageCount !== 28 || registry.canonicalRecordSetCount !== 37
    || registry.bundledExactCellProfileRosterCount !== 11 || registry.bundledExactSourceObjectSetCount !== 2
    || registry.sourceProfileCount !== 387 || registry.upgradeCount !== 222
    || registry.displayedUpgradeCount !== 33 || registry.staleCanonicalDenominatorLiteralCount !== 0
    || manifest.registrySummary.researchUpgradeCount !== 222
    || layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_261.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_62.md") throw new Error("2.62 registry, rollback or no-copy receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    displayedUpgradeCount: registry.displayedUpgradeCount,
    sourceDoiCount: crossTab.doiCount,
    doiLabelMembershipCount,
    multiLabelRecordCount: crossTab.multiLabelRecordCount,
    figureMembershipUnassessableRecordCount: crossTab.figureMembershipUnassessableRecordCount,
    newGeometryObjectCount: crossTab.newGeometryObjectCount,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest262()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
