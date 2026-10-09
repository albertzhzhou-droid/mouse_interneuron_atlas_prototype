#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { SNAPSHOT_258, validateResearchIterationManifest258Snapshot } from "./validate-research-iteration-manifest-2.58-snapshot.mjs";
import { INPUTS_259, MANIFEST_259_PATH, buildResearchIterationManifest259 } from "../tools/build_research_iteration_manifest_2_59.mjs";
import { loadAndValidateGintyNeuroMorphoStrainFacetAudit } from "./validate-ginty-neuromorpho-strain-facet-audit-0.1.mjs";

export async function validateResearchIterationManifest259(override = null) {
  const built = await buildResearchIterationManifest259();
  const bytes = await readFile(MANIFEST_259_PATH);
  const manifest = override ?? JSON.parse(bytes);
  if (override === null && !bytes.equals(built.bytes)) throw new Error("2.59 on-disk manifest differs from verified rebuild");
  if (computeManifestContentSha256(manifest) !== manifest.manifestContentSha256) throw new Error("2.59 content hash invalid");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.59 evidence or input receipts differ from verified rebuild");

  const ids = new Set(manifest.authoritativeInputs.map((input) => input.id));
  const paths = new Set(manifest.authoritativeInputs.map((input) => `${input.scope}:${input.path}`));
  if (ids.size !== manifest.integrity.inputCount || paths.size !== ids.size) throw new Error("Duplicate 2.59 input receipt");
  for (const [id, inputPath] of INPUTS_259) {
    if (!manifest.authoritativeInputs.some((input) => input.id === id && input.scope === "project" && input.path === inputPath)) throw new Error(`2.59 exact input receipt missing: ${id}`);
  }

  const parent = await validateResearchIterationManifest258Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_258.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_258.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_258.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_258.contentSha256) throw new Error("2.59 parent must remain the sealed 2.58 release");
  const { audit } = await loadAndValidateGintyNeuroMorphoStrainFacetAudit();
  const ref = manifest.exactReferences.gintyNeuroMorphoStrainFacetAudit259;
  if (ref.auditId !== audit.auditId || ref.paperLinkedRepositoryRecordCount !== 650
    || ref.uniqueNeuronIdCount !== 650 || ref.uniqueIndexedSwcSha256Count !== 650
    || ref.rawSwcBytesRehashedInAudit !== false || ref.rawSourceStrainLabelCount !== 12
    || ref.sourceAxonReconstructionCount !== 0 || ref.paperReportedMorphologyAnalysisCounts.map((item) => item.count).join(",") !== "305,351"
    || ref.paperFigureRosterCrosswalkAvailable !== false || ref.paperMembershipReconciled !== false
    || ref.representativeOrMeanNeuronCreated !== false || ref.molecularProfileJoinCount !== 0
    || ref.sameCellJoinCount !== 0 || ref.internalStructurePrimitiveCount !== 0
    || ref.surfacesAdmittedByAudit !== 0 || ref.addedAxons !== 0 || ref.atlasRegistrationCount !== 0
    || ref.researchUpgradeId !== "UPG-233") throw new Error("2.59 Ginty source-strain, paper-denominator or no-join boundary changed");
  const registry = manifest.exactReferences.researchRegistryDenominators259;
  if (registry.upgradeCount !== 215 || registry.staleCanonicalDenominatorLiteralCount !== 0
    || manifest.registrySummary.researchUpgradeCount !== 215
    || manifest.exactReferences.iteration259Layout.fullProjectCopyCount !== 0
    || manifest.exactReferences.iteration259Layout.rollbackParent !== SNAPSHOT_258.path
    || manifest.exactReferences.iteration259Layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_59.md") throw new Error("2.59 rollback, no-copy or research-upgrade registry receipt changed");

  return {
    releaseId: manifest.releaseId,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    researchUpgradeCount: registry.upgradeCount,
    sourceProfileCount: registry.sourceProfileCount,
    paperLinkedRepositoryRecordCount: ref.paperLinkedRepositoryRecordCount,
    rawSourceStrainLabelCount: ref.rawSourceStrainLabelCount,
    paperMembershipReconciled: ref.paperMembershipReconciled,
    fullProjectCopyCount: manifest.exactReferences.iteration259Layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest259()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
