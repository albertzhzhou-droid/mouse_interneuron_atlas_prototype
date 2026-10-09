#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_259, validateResearchIterationManifest259Snapshot } from "./validate-research-iteration-manifest-2.59-snapshot.mjs";
import { INPUTS_260, MANIFEST_260_PATH, buildResearchIterationManifest260 } from "../tools/build_research_iteration_manifest_2_60.mjs";
import { loadAndValidatePkd2l1IndependentPopulationContext } from "./validate-pkd2l1-independent-population-context-0.1.mjs";

export async function validateResearchIterationManifest260(override = null) {
  const built = await buildResearchIterationManifest260();
  const bytes = await readFile(MANIFEST_260_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.60 on-disk manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.60 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.60 input receipt");
  for (const [id, inputPath] of INPUTS_260) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.60 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest259Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_259.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_259.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_259.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_259.contentSha256) throw new Error("2.60 parent must remain the sealed 2.59 release");

  const context = manifest.exactReferences.pkd2l1IndependentPopulationContext260;
  const { summary } = await loadAndValidatePkd2l1IndependentPopulationContext();
  if (context.contextId !== summary.contextId || context.mouseCount !== 18 || context.sectionCount !== 811
    || context.tableFiveSummaryCount !== 8 || context.publicRawDataDepositVerified !== false
    || context.rawImageFilesBundled !== false || context.perCellCoordinatesAvailable !== false
    || context.perCellMorphologyAvailable !== false || context.reconstructedCellsAdmitted !== 0
    || context.geometryPrimitivesAdmitted !== 0 || context.sameCellJoinToCrozat !== false
    || context.atlasRegistrationCount !== 0 || context.includedInInterneuronTypeCounts !== false
    || context.regionSectionCountsRetained.some((item) => item.count !== null)
    || JSON.stringify(context.ageSectionCounts.map((item) => item.count)) !== JSON.stringify([401, 410])
    || JSON.stringify(context.sexSectionCounts.map((item) => item.count)) !== JSON.stringify([413, 398])
    || context.researchUpgradeId !== "UPG-234") throw new Error("2.60 independent PKD2L1 cohort or no-geometry boundary changed");

  const registry = manifest.exactReferences.researchRegistryDenominators260;
  if (registry.upgradeCount !== 217 || registry.displayedUpgradeCount !== 31 || registry.staleCanonicalDenominatorLiteralCount !== 0
    || manifest.registrySummary.researchUpgradeCount !== 217
    || manifest.exactReferences.iteration260Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration260Layout.rollbackParent !== SNAPSHOT_259.path
    || manifest.exactReferences.iteration260Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_60.md") throw new Error("2.60 rollback, no-copy or live research-registry receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    tableFiveSummaryCount: context.tableFiveSummaryCount,
    publicRawDataDepositVerified: context.publicRawDataDepositVerified,
    geometryPrimitivesAdmitted: context.geometryPrimitivesAdmitted,
    fullProjectCopyCount: manifest.exactReferences.iteration260Layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest260()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
