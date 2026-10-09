#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_255, validateResearchIterationManifest255Snapshot } from "../scripts/validate-research-iteration-manifest-2.55-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, loadResearchUpgradeRegistry, summarizeResearchSourceRegistry, validateResearchSourceRegistry, validateResearchSourceUpgradeLinks } from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { loadAndValidateKellyZebrafishTaxonomy } from "../scripts/validate-kelly-zebrafish-spinal-interneuron-taxonomy-0.1.mjs";
import { loadAndValidateNeuromorphoReleaseDeltaAudit } from "../scripts/validate-neuromorpho-release-8-6-125-query-delta-audit-0.1.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_256_PATH = path.join(ROOT, "data/research-iteration-manifest-2.56.json");
export const INPUTS_256 = Object.freeze([
  ["sealedIteration255Manifest", "data/research-iteration-manifest-2.55.json"],
  ["sealedIteration255SnapshotValidator", "scripts/validate-research-iteration-manifest-2.55-snapshot.mjs"],
  ["kellyZebrafishTaxonomyContract", "data/kelly-zebrafish-spinal-interneuron-taxonomy-0.1.json"],
  ["kellyZebrafishTaxonomySchema", "schemas/kelly-zebrafish-spinal-interneuron-taxonomy-0.1.schema.json"],
  ["kellyZebrafishTaxonomyValidator", "scripts/validate-kelly-zebrafish-spinal-interneuron-taxonomy-0.1.mjs"],
  ["kellyZebrafishTaxonomyTests", "tests/kelly-zebrafish-spinal-interneuron-taxonomy.test.mjs"],
  ["kellyZebrafishTaxonomyPanel", "app/ZebrafishSpinalTaxonomyPanel.tsx"],
  ["neuromorphoReleaseDeltaAudit", "data/neuromorpho-release-8-6-125-query-delta-audit-0.1.json"],
  ["neuromorphoReleaseDeltaSchema", "schemas/neuromorpho-release-8-6-125-query-delta-audit-0.1.schema.json"],
  ["neuromorphoReleaseDeltaValidator", "scripts/validate-neuromorpho-release-8-6-125-query-delta-audit-0.1.mjs"],
  ["neuromorphoReleaseDeltaTests", "tests/neuromorpho-release-8-6-125-query-delta-audit.test.mjs"],
  ["iteration256Builder", "tools/build_research_iteration_manifest_2_56.mjs"],
  ["iteration256Validator", "scripts/validate-research-iteration-manifest-2.56.mjs"],
  ["iteration256Tests", "tests/research-iteration-manifest-2.56.test.mjs"],
  ["iteration256Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_56.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest256() {
  const { manifest: parent } = await validateResearchIterationManifest255Snapshot();
  const [upgrades, sourceRegistry, upgradeRegistry, kelly, releaseDelta, denominatorReceipt, layout] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    loadAndValidateKellyZebrafishTaxonomy(),
    loadAndValidateNeuromorphoReleaseDeltaAudit(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== denominatorReceipt.sourceCount
    || sourceSummary.recordSetCount !== denominatorReceipt.recordSetCount
    || sourceSummary.bundledExactRosterCount !== denominatorReceipt.bundledExactCellProfileRosterCount
    || sourceSummary.bundledExactSourceObjectSetCount !== denominatorReceipt.bundledExactSourceObjectSetCount) throw new Error("2.56 source-registry denominators differ between runtime surfaces");

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.56 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_256.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.56 comparative taxonomy, repository metadata audit, source registry, UI, validation or rollback receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.56 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.56.0-research.1") throw new Error("2.56 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.56.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.56.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_255.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_255.bytes,
    fileSha256: SNAPSHOT_255.fileSha256,
    contentSha256: SNAPSHOT_255.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.56 adds an evidence-locator-backed, source-local 4 dpf zebrafish spinal interneuron taxonomy panel and a recorded exact-query metadata-only comparison of NeuroMorpho 8.6.125 with the active 8.6.124 corpus. Ten article-reported fish labels remain outside the 387 mouse-centric core profile denominator, without barcode-level assignments, reconciled animal count, mouse equivalence, geometry, internal objects or registration. The observed 142-record repository metadata delta has zero changed semantic records, but the remote response is not retained and per-object geometry hashes, dimensionality and file-specific reuse rights are not rechecked. Keep the active morphology release at 8.6.124; internal primitives, cross-source identities and registrations remain zero.";
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
  manifest.exactReferences.kellyZebrafishSpinalTaxonomy256 = {
    contractId: kelly.taxonomy.contractId,
    releaseId: kelly.taxonomy.releaseId,
    sourceId: kelly.taxonomy.source.sourceId,
    datasetId: kelly.taxonomy.source.datasetId,
    species: kelly.taxonomy.source.species,
    lifeStage: kelly.taxonomy.source.lifeStage,
    region: kelly.taxonomy.source.region,
    populationCount: kelly.summary.populationCount,
    populationLabels: kelly.taxonomy.populations.map((population) => population.sourceLabel),
    integratedPostQcCellCount: kelly.taxonomy.samplingAndAssignment.reportedIntegratedPostQcSpinalCellCount,
    reportedAnimalOrCordDenominator: null,
    animalOrCordDenominatorStatus: kelly.taxonomy.samplingAndAssignment.animalDenominator.status,
    exactBarcodeToInterneuronLabelMapVerified: kelly.taxonomy.samplingAndAssignment.cellRoster.exactBarcodeToInterneuronLabelMapVerified,
    coreMouseTypeRecordCount: 387,
    includedInCoreMouseTypeRecordCount: false,
    generatedCellGeometryCount: kelly.summary.geometryCount,
    sameCellMorphologyLinkCount: kelly.taxonomy.modelingAuthority.sameCellMorphologyLinks,
    internalStructureCount: kelly.summary.internalStructureCount,
    mouseTypeEquivalenceCount: kelly.taxonomy.modelingAuthority.mouseTypeEquivalences,
    registrationCount: kelly.taxonomy.modelingAuthority.atlasRegistrations,
    contractReceipt: { path: INPUTS_256.find(([id]) => id === "kellyZebrafishTaxonomyContract")[1], ...byId.get("kellyZebrafishTaxonomyContract") },
  };
  manifest.exactReferences.neuromorphoReleaseDeltaAudit256 = {
    auditId: releaseDelta.summary.auditId,
    baselineRelease: releaseDelta.summary.baselineRelease,
    candidateRelease: releaseDelta.summary.candidateRelease,
    queriedRecordCount: releaseDelta.summary.comparedRecords,
    stableNeuronIdCount: releaseDelta.summary.comparedRecords,
    semanticallyUnchangedRecordCount: releaseDelta.summary.comparedRecords,
    addedRecordCount: 0,
    removedRecordCount: 0,
    changedSemanticMetadataRecordCount: releaseDelta.summary.changedSemanticMetadataRecords,
    rawResponseRetained: releaseDelta.audit.observedResponseReceipt.rawResponseRetained,
    observedResponseBytes: releaseDelta.audit.observedResponseReceipt.byteCount,
    observedResponseSha256: releaseDelta.audit.observedResponseReceipt.sha256,
    independentReproductionStatus: releaseDelta.audit.observedResponseReceipt.independentReproductionStatus,
    geometryFileHashesRechecked: releaseDelta.audit.assetAndAdmissionBoundaries.perObjectGeometryHashesRechecked,
    dimensionalityDeltaAuditedAtAssetLevel: releaseDelta.audit.assetAndAdmissionBoundaries.dimensionalityDeltaAuditedAtAssetLevel,
    fileSpecificReuseRightsRechecked: releaseDelta.audit.assetAndAdmissionBoundaries.fileSpecificReuseAndAttributionRightsRechecked,
    activeModelRelease: releaseDelta.summary.activeGeometryRelease,
    promotedIntoActiveModel: releaseDelta.audit.assetAndAdmissionBoundaries.promotedIntoActiveModel,
    sameCellInternalStructureCount: releaseDelta.audit.assetAndAdmissionBoundaries.sameCellInternalStructureCount,
    crossSourceIdentityCount: releaseDelta.audit.assetAndAdmissionBoundaries.crossSourceIdentityCount,
    registrationCount: releaseDelta.audit.assetAndAdmissionBoundaries.registrationCount,
    auditReceipt: { path: INPUTS_256.find(([id]) => id === "neuromorphoReleaseDeltaAudit")[1], ...byId.get("neuromorphoReleaseDeltaAudit") },
  };
  manifest.exactReferences.researchRegistryDenominators256 = {
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    sourceProfileCount: sourceSummary.typeRecordCount,
    comparativeZebrafishLabelCount: kelly.summary.labelCount,
    comparativeZebrafishLabelsIncludedInCoreProfileCount: false,
    upgradeCount: upgrades.upgradeCount,
    displayedUpgradeCount: upgrades.displayedUpgradeCount,
    denominatorDisplayCount: denominatorReceipt.enumeratedDisplayCount,
    staleCanonicalDenominatorLiteralCount: denominatorReceipt.staleLiteralCount,
  };
  manifest.exactReferences.iteration256Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_56.md",
    rollbackParent: SNAPSHOT_255.path,
  };
  manifest.scientificBoundaries.kellyZebrafishSpinalTaxonomy256 = "The ten 4 dpf Danio rerio labels are an article-derived source-local comparison lane, not mouse interneuron types or a ten-cell roster. Keep GEO/article animal-versus-cord denominator conflict unresolved, exact barcode mapping unverified, and all morphology, mouse equivalences, same-cell links, internal structures and registrations at zero.";
  manifest.scientificBoundaries.neuromorphoReleaseDeltaAudit256 = "NeuroMorpho 8.6.125 and pinned 8.6.124 share the observed 142 stable IDs and semantic metadata fields, excluding response navigation links, in one exact adult mouse spinal-interneuron API query. The response body was not retained; its reported receipt is not independently reproducible without rerunning the exact GET. No geometry-file hash, asset-level dimensionality or rights review was repeated. Keep active geometry at 8.6.124, with zero same-cell internal structures, cross-source identities and registrations.";
  manifest.scientificBoundaries.researchRegistryDenominators256 = "Live source and record-set totals are derived from the canonical registry (28 and 37), with 11 exact cell/profile rosters and 2 exact source-object sets. The 387 source-profile core denominator remains mouse-centric and separate from ten article-reported comparative zebrafish labels. Eight UI display surfaces are checked dynamically; stale canonical literals remain zero. Historical snapshot denominators are preserved.";
  manifest.scientificBoundaries.iteration256Layout = "Iteration 2.56 modifies the existing source tree, adds only source-scoped evidence and validation files, and has no complete project copy. Its unique rollback point is the sealed 2.55 manifest plus this iteration timeline.";

  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest256();
    if (flag === "--write") await writeFile(MANIFEST_256_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_256_PATH)).equals(built.bytes)) throw new Error("2.56 manifest is stale");
    process.stdout.write(`${JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, registry: built.manifest.exactReferences.researchRegistryDenominators256, fishLabels: built.manifest.exactReferences.kellyZebrafishSpinalTaxonomy256.populationCount, nmoChangedMetadataRecords: built.manifest.exactReferences.neuromorphoReleaseDeltaAudit256.changedSemanticMetadataRecordCount, activeMorphologyRelease: built.manifest.exactReferences.neuromorphoReleaseDeltaAudit256.activeModelRelease, fullProjectCopyCount: built.manifest.exactReferences.iteration256Layout.fullProjectCopyCount, contentSha256: built.manifest.manifestContentSha256 })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
