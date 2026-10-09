#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_258, validateResearchIterationManifest258Snapshot } from "../scripts/validate-research-iteration-manifest-2.58-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, loadResearchUpgradeRegistry, summarizeResearchSourceRegistry, validateResearchSourceRegistry, validateResearchSourceUpgradeLinks } from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { loadAndValidateGintyNeuroMorphoStrainFacetAudit } from "../scripts/validate-ginty-neuromorpho-strain-facet-audit-0.1.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_259_PATH = path.join(ROOT, "data/research-iteration-manifest-2.59.json");
export const INPUTS_259 = Object.freeze([
  ["gintyStrainFacetAudit", "data/ginty-neuromorpho-strain-facet-audit-0.1.json"],
  ["gintyStrainFacetAuditSchema", "schemas/ginty-neuromorpho-strain-facet-audit-0.1.schema.json"],
  ["gintyStrainFacetAuditValidator", "scripts/validate-ginty-neuromorpho-strain-facet-audit-0.1.mjs"],
  ["gintyStrainFacetAuditBuilder", "tools/build_ginty_neuromorpho_strain_facet_audit_0_1.mjs"],
  ["gintyStrainFacetAuditTests", "tests/ginty-neuromorpho-strain-facet-audit.test.mjs"],
  ["sourceStrainFacetRuntime", "app/neuromorpho-universe-facets.js"],
  ["sourceStrainFacetTests", "tests/neuromorpho-universe-source-strain-facets.test.mjs"],
  ["sealedIteration258SnapshotValidator", "scripts/validate-research-iteration-manifest-2.58-snapshot.mjs"],
  ["sealedIteration258SnapshotTests", "tests/research-iteration-manifest-2.58-snapshot.test.mjs"],
  ["iteration259Builder", "tools/build_research_iteration_manifest_2_59.mjs"],
  ["iteration259Validator", "scripts/validate-research-iteration-manifest-2.59.mjs"],
  ["iteration259Tests", "tests/research-iteration-manifest-2.59.test.mjs"],
  ["iteration259Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_59.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest259() {
  const parentReceipt = await validateResearchIterationManifest258Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, gintyReceipt] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    loadAndValidateGintyNeuroMorphoStrainFacetAudit(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== denominatorReceipt.sourceCount
    || sourceSummary.recordSetCount !== denominatorReceipt.recordSetCount
    || sourceSummary.bundledExactRosterCount !== denominatorReceipt.bundledExactCellProfileRosterCount
    || sourceSummary.bundledExactSourceObjectSetCount !== denominatorReceipt.bundledExactSourceObjectSetCount) throw new Error("2.59 source-registry denominators differ between runtime surfaces");

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.59 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_259.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.59 source-strain morphology facet, Ginty repository/paper roster audit, historical rollback, validation, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.59 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.59.0-research.1") throw new Error("2.59 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.59.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.59.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_258.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_258.bytes,
    fileSha256: SNAPSHOT_258.fileSha256,
    contentSha256: SNAPSHOT_258.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.59 adds a runtime-derived exact raw-strain facet for the verified 1,097-record NeuroMorpho mouse-spinal-interneuron universe, plus a source-hash-pinned audit of the 650 Abraira/Ginty repository records. The same article reports distinct 305- and 351-neuron morphology-analysis scopes; their object-to-figure crosswalk remains unresolved. Selecting a different exact source record can change the OBS SWC, while source strain is not a canonical subtype, group average, or molecular-profile identity. No geometry copies, mean cells, molecular joins, new surfaces, added axons, internals, or registrations are admitted.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };

  const audit = gintyReceipt.audit;
  const roster = audit.repositoryRoster;
  manifest.exactReferences.gintyNeuroMorphoStrainFacetAudit259 = {
    auditId: audit.auditId,
    auditReceipt: { path: INPUTS_259.find(([id]) => id === "gintyStrainFacetAudit")[1], ...byId.get("gintyStrainFacetAudit") },
    repositoryRelease: audit.repositoryRelease,
    universeIndexSha256: audit.sourceUniverse.indexSha256,
    universeRecordCount: audit.sourceUniverse.indexQueryRecordCount,
    paperDoi: audit.selection.paperDoi,
    archive: audit.selection.archive,
    paperLinkedRepositoryRecordCount: roster.recordCount,
    uniqueNeuronIdCount: roster.uniqueNeuronIdCount,
    uniqueIndexedSwcSha256Count: roster.uniqueIndexedSwcSha256Count,
    rawSwcBytesRehashedInAudit: roster.rawSwcBytesRehashedInThisAudit,
    rawSourceStrainLabelCount: roster.sourceStrainLabelCount,
    rawSourceStrainGroups: roster.sourceStrainGroups.map(({ sourceStrainLabel, recordCount }) => ({ sourceStrainLabel, recordCount })),
    sourceCellClassCounts: roster.sourceCellClassCounts,
    dimensionalityCounts: roster.dimensionalityCounts,
    sourceAxonReconstructionCount: roster.sourceAxonReconstructionCount,
    paperReportedMorphologyAnalysisCounts: audit.paperScopeReconciliation.distinctReportedMorphologyAnalysisCounts,
    paperFigureRosterCrosswalkAvailable: audit.paperScopeReconciliation.exactRepositoryRecordToPaperFigureCrosswalk,
    paperMembershipReconciled: audit.paperScopeReconciliation.paperAnalysisMembershipReconciled,
    representativeOrMeanNeuronCreated: audit.representationBoundary.representativeOrMeanNeuronCreated,
    molecularProfileJoinCount: audit.representationBoundary.molecularProfileJoinCount,
    sameCellJoinCount: audit.representationBoundary.sameCellJoinCount,
    internalStructurePrimitiveCount: audit.representationBoundary.internalStructurePrimitiveCount,
    surfacesAdmittedByAudit: audit.representationBoundary.surfacesAdmittedByThisAudit,
    addedAxons: audit.representationBoundary.axonsAddedOrRepaired,
    atlasRegistrationCount: audit.representationBoundary.atlasRegistrationCount,
    researchUpgradeId: "UPG-233",
  };
  manifest.exactReferences.researchRegistryDenominators259 = {
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    sourceProfileCount: sourceSummary.typeRecordCount,
    upgradeCount: upgrades.upgradeCount,
    displayedUpgradeCount: upgrades.displayedUpgradeCount,
    denominatorDisplayCount: denominatorReceipt.enumeratedDisplayCount,
    staleCanonicalDenominatorLiteralCount: denominatorReceipt.staleLiteralCount,
  };
  manifest.exactReferences.iteration259Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_59.md",
    rollbackParent: SNAPSHOT_258.path,
  };

  manifest.scientificBoundaries.gintyNeuroMorphoStrainFacetAudit259 = "The NeuroMorpho 8.6.124 universe contains 650 distinct API record IDs linked to Abraira et al. and 650 unique SWC hash values already indexed by the parent source universe. This iteration does not rehash those source SWC bytes and does not reconcile the roster to the paper's separate reported morphology-analysis counts of 305 and 351. Source strain is a raw field for faceting only. No source record is a representative/mean cell; zero molecular-profile and same-cell joins, internal primitives, new surfaces, added axons or atlas registrations are admitted. A selected geometry stays exact, checksum-gated, and source-local.";
  manifest.scientificBoundaries.researchRegistryDenominators259 = `The live registry resolves ${sourceSummary.sourceCount} canonical sources, ${sourceSummary.recordSetCount} record sets, ${sourceSummary.bundledExactRosterCount} exact cell/profile rosters, ${sourceSummary.bundledExactSourceObjectSetCount} exact source-object sets, ${sourceSummary.typeRecordCount} source profiles, and ${upgrades.upgradeCount} research/model upgrades. Display denominators are registry-derived with ${denominatorReceipt.staleLiteralCount} stale canonical literals. Historical release denominators remain sealed.`;
  manifest.scientificBoundaries.iteration259Layout = "Iteration 2.59 updates the existing workspace and adds a source-local metadata audit, runtime facet, validators/tests, and one unique timeline. No complete project copy was created. The rollback parent is the immutable 2.58 manifest.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest259();
    if (flag === "--write") await writeFile(MANIFEST_259_PATH, bytes);
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, repositoryRecords: manifest.exactReferences.gintyNeuroMorphoStrainFacetAudit259.paperLinkedRepositoryRecordCount, fullProjectCopyCount: manifest.exactReferences.iteration259Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
