#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_272, validateResearchIterationManifest272Snapshot } from "../scripts/validate-research-iteration-manifest-2.72-snapshot.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import {
  loadResearchSourceRegistry,
  loadResearchUpgradeRegistry,
  summarizeResearchSourceRegistry,
  validateResearchSourceRegistry,
  validateResearchSourceUpgradeLinks,
} from "../scripts/validate-research-source-registry-0.1.mjs";
import { validateResearchSourceRegistryDenominators } from "../scripts/validate-research-source-registry-denominators.mjs";
import { validateIncrementalIterationLayout } from "../scripts/validate-incremental-iteration-layout.mjs";
import { loadAndValidateNeuromorphoRelease126ToddStableIdAudit02 } from "../scripts/validate-neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.mjs";
import { validateEvidenceAware3dRepresentationContract07 } from "../scripts/validate-evidence-aware-3d-representation-contract-0.7.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_273_PATH = path.join(ROOT, "data/research-iteration-manifest-2.73.json");
export const INPUTS_273 = Object.freeze([
  ["iteration272SnapshotValidator", "scripts/validate-research-iteration-manifest-2.72-snapshot.mjs"],
  ["iteration272SnapshotTests", "tests/research-iteration-manifest-2.72-snapshot.test.mjs"],
  ["neuromorpho126ToddNtsRoutePack", "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json"],
  ["neuromorpho126ToddNtsRoutePackSchema", "schemas/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.schema.json"],
  ["neuromorpho126ToddNtsRoutePackValidator", "scripts/validate-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.mjs"],
  ["neuromorpho126ToddNtsRoutePackBuilder", "tools/build_neuromorpho_release_8_6_126_todd_nts_route_pack_0_1.py"],
  ["neuromorpho126ToddNtsRoutePackTests", "tests/neuromorpho-release-8-6-126-todd-nts-route-pack.test.mjs"],
  ["neuromorpho126ToddStableIdAudit02", "data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.json"],
  ["neuromorpho126ToddStableIdAudit02Schema", "schemas/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.schema.json"],
  ["neuromorpho126ToddStableIdAudit02Validator", "scripts/validate-neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.mjs"],
  ["neuromorpho126ToddCurrentQuerySnapshot", "data/source-candidates/neuromorpho-release-8-6-126-todd-nts-v1/official-current-query-response.json"],
  ["neuromorpho126ToddAssetManifest", "public/data/neuromorpho_release_8_6_126_todd_nts_v1/asset-manifest.json"],
  ["evidenceAware3dRepresentation07", "data/evidence-aware-3d-representation-contract-0.7.json"],
  ["evidenceAware3dRepresentation07Schema", "schemas/evidence-aware-3d-representation-contract-0.7.schema.json"],
  ["evidenceAware3dRepresentation07Builder", "tools/build_evidence_aware_3d_representation_contract_0_7.mjs"],
  ["evidenceAware3dRepresentation07Validator", "scripts/validate-evidence-aware-3d-representation-contract-0.7.mjs"],
  ["evidenceAware3dRepresentation07Tests", "tests/evidence-aware-3d-representation-0.7.test.mjs"],
  ["researchSourceRegistry", "data/research-source-registry-0.1.json"],
  ["researchSourceRegistryValidator", "scripts/validate-research-source-registry-0.1.mjs"],
  ["researchSourceRegistryDenominatorValidator", "scripts/validate-research-source-registry-denominators.mjs"],
  ["researchUpgradeQueue", "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"],
  ["researchUpgradeRegistry", "data/research-model-upgrade-registry-0.1.json"],
  ["researchUpgradeRegistryBuilder", "tools/build_research_upgrade_registry.mjs"],
  ["researchUpgradeRegistryValidator", "scripts/validate-research-model-upgrade-registry-0.1.mjs"],
  ["researchUpgradeRegistryTests", "tests/research-model-upgrade-registry.test.mjs"],
  ["sourceRegistryTests", "tests/research-source-registry.test.mjs"],
  ["sourceRegistrySummaryTests", "tests/research-source-registry-summary.test.mjs"],
  ["activeAtlasTypes", "app/atlas-types.ts"],
  ["activeSceneCanvas", "app/SceneCanvas.tsx"],
  ["activeAtlasPrototype", "app/AtlasPrototype.tsx"],
  ["activeRecordProvider", "app/ResearchActiveRecordProvider.tsx"],
  ["supplementalMorphologyRecordResolver", "app/research-supplemental-morphology-records.js"],
  ["supplementalMorphologyRecordTests", "tests/research-supplemental-morphology-records.test.mjs"],
  ["activeRecordIntegrationTests", "tests/research-active-record-integration.test.mjs"],
  ["visualTargetResolver", "app/research-visual-target.js"],
  ["visualTargetTests", "tests/research-visual-target.test.mjs"],
  ["observedMorphologyRouteLibrary", "app/ObservedMorphologyRouteLibrary.tsx"],
  ["mainSceneObservedRouteTests", "tests/main-scene-observed-route-integration.test.mjs"],
  ["renderedHtmlTests", "tests/rendered-html.test.mjs"],
  ["currentResearchTestRunner", "tools/run_current_research_tests.mjs"],
  ["applicationPackage", "package.json"],
  ["packageLock", "package-lock.json"],
  ["applicationLayout", "app/layout.tsx"],
  ["iteration273Builder", "tools/build_research_iteration_manifest_2_73.mjs"],
  ["iteration273Validator", "scripts/validate-research-iteration-manifest-2.73.mjs"],
  ["iteration273Tests", "tests/research-iteration-manifest-2.73.test.mjs"],
  ["iteration273SnapshotTests", "tests/research-iteration-manifest-2.73-snapshot.test.mjs"],
  ["iteration273Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_73.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest273() {
  const parentReceipt = await validateResearchIterationManifest272Snapshot();
  const parent = JSON.parse(await readFile(path.join(ROOT, SNAPSHOT_272.path), "utf8"));
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, auditResult, representation] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    loadAndValidateNeuromorphoRelease126ToddStableIdAudit02(),
    validateEvidenceAware3dRepresentationContract07(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 29 || sourceSummary.recordSetCount !== 38
    || sourceSummary.bundledExactRosterCount !== 12 || sourceSummary.bundledExactSourceObjectSetCount !== 3
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.73 source-registry denominators do not reconcile with the 2.72 type-profile basis");
  }
  if (upgrades.upgradeCount !== 229 || upgrades.displayedUpgradeCount !== 38 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.summary.byStatus.completed !== 68 || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-247"
    || !upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-245")?.status.startsWith("completed")
    || !upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-247")?.status.startsWith("planned")) {
    throw new Error("2.73 research-upgrade registry or UI denominator changed unexpectedly");
  }
  if (auditResult.summary.currentRosterCount !== 339 || auditResult.summary.baselineToddCount !== 309
    || auditResult.summary.addedCount !== 30 || auditResult.summary.removedCount !== 0
    || auditResult.summary.topologyQcCount !== 30 || auditResult.summary.sourceDiameterReportedCount !== 10
    || auditResult.summary.sourceDiameterNotReportedCount !== 20 || auditResult.summary.censusExpansion !== 0
    || representation.routeCount !== 47 || representation.supplementaryRouteCount !== 30
    || representation.radiusDerivedRouteCount !== 10 || representation.centerlineOnlyRouteCount !== 20
    || representation.internalPrimitiveCount !== 0 || representation.crossSourceIdentityCount !== 0
    || representation.projectRegistrationCount !== 0) {
    throw new Error("2.73 supplementary morphology admission or rendering-authority summary changed");
  }

  const routePack = JSON.parse(await readFile(path.join(ROOT, "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json"), "utf8"));
  const dynamicAssets = routePack.routes.flatMap((route) => {
    const id = route.sourceRecord.neuronId;
    return [
      [`neuromorpho126ToddNtsSwc${id}`, `public${route.sourceObjects.swc.path}`],
      [`neuromorpho126ToddNtsGeometry${id}`, `public${route.sourceObjects.geometry.path}`],
    ];
  });
  const allInputSpecs = [...INPUTS_273, ...dynamicAssets];
  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.73 refreshed ${input.id} receipt` } : current;
  }));
  const inheritedPaths = new Set(parentInputs.map((input) => `${input.scope}:${input.path}`));
  const additions = allInputSpecs
    .filter(([, inputPath]) => !inheritedPaths.has(`project:${inputPath}`))
    .map(([id, inputPath]) => ({ id: `iteration273_${id}`, scope: "project", path: inputPath, purpose: "Iteration 2.73 exact source route, 3D representation contract, registry, UI, validator, test, or timeline receipt" }));
  const inputs = [...parentInputs, ...additions];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.73 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  for (const [, inputPath] of allInputSpecs) {
    if (!receipts.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.73 exact input receipt missing: ${inputPath}`);
  }
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.73.0-research.1") throw new Error("2.73 application version mismatch");

  const byPath = new Map(receipts.map((input) => [input.path, input]));
  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.73.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.73.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_272.path,
    releaseId: parentReceipt.releaseId,
    bytes: SNAPSHOT_272.bytes,
    fileSha256: SNAPSHOT_272.fileSha256,
    contentSha256: SNAPSHOT_272.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.73 admits thirty checksum-verified, source-local standardized NeuroMorpho 8.6.126 Todd interneuron reconstructions as supplementary routes while keeping the frozen 8.6.124 denominator at 1,097. The complete current Todd filter returns 339 unique IDs: all 309 baseline Todd IDs remain, with 30 additions and no removals or compared-field changes. The shared active-record loader adds the 30 records to the verified search collection after route-pack checksum verification (671 records total; 179 morphology records = 142 frozen census + 37 supplementary exact objects); the underlying 641-record base index and frozen census remain unchanged. Ten source records report diameter and may use a radius-derived open display surface; twenty remain centerline-only. The per-record primary-paper, animal, figure and lamina crosswalk remains unresolved; original Neurolucida files, standardization logs and biological completeness are not established. No internal structures, identities, registrations or measurements are admitted.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byPath.get("data/research-source-registry-0.1.json"),
    upgradeRegistryReceipt: byPath.get("data/research-model-upgrade-registry-0.1.json"),
  };
  manifest.exactReferences.researchRegistryDenominators273 = {
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactCellProfileRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactSourceObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    sourceProfileCount: sourceSummary.typeRecordCount,
    upgradeCount: upgrades.upgradeCount,
    completedUpgradeCount: upgradeRegistry.summary.byStatus.completed,
    displayedUpgradeCount: upgrades.displayedUpgradeCount,
    denominatorDisplayCount: denominatorReceipt.enumeratedDisplayCount,
    staleCanonicalDenominatorLiteralCount: denominatorReceipt.staleLiteralCount,
  };
  manifest.exactReferences.neuromorphoRelease126ToddStableIdAudit245V02 = {
    auditId: auditResult.audit.auditId,
    researchUpgradeId: auditResult.audit.researchUpgradeId,
    release: auditResult.audit.currentRelease.version,
    currentRosterCount: auditResult.summary.currentRosterCount,
    baselineToddCount: auditResult.summary.baselineToddCount,
    commonStableIdCount: auditResult.audit.comparison.commonStableIdCount,
    addedStableIdCount: auditResult.summary.addedCount,
    removedStableIdCount: auditResult.summary.removedCount,
    commonMetadataChangeCount: auditResult.audit.comparison.commonMetadataChangeCount,
    standardizedSwcCount: auditResult.summary.topologyQcCount,
    standardizedSwcNodeCount: auditResult.summary.standardizedSwcNodeCount,
    standardizedSwcSegmentCount: auditResult.summary.standardizedSwcSegmentCount,
    sourceDiameterReportedCount: auditResult.summary.sourceDiameterReportedCount,
    sourceDiameterNotReportedCount: auditResult.summary.sourceDiameterNotReportedCount,
    originalPaperCrosswalkCount: auditResult.summary.paperCrosswalkCount,
    supplementaryRoutesAdmitted: auditResult.audit.admission.supplementarySourceLocalRoutesAdmitted,
    supplementaryGeometryObjectsAdmitted: auditResult.audit.admission.supplementaryGeometryObjectsAdmitted,
    censusExpansion: auditResult.audit.admission.censusExpansion,
    crossSourceIdentityJoins: auditResult.audit.admission.crossSourceIdentityJoins,
    atlasRegistrations: auditResult.audit.admission.atlasRegistrations,
    biologicalMeasurements: auditResult.audit.admission.biologicalMeasurements,
    renderedInternalPrimitives: auditResult.audit.admission.renderedInternalPrimitives,
    biologicalCompletenessIndependentlyEstablishedCount: auditResult.audit.sourceAssetReview.biologicalCompletenessIndependentlyEstablishedCount,
  };
  manifest.exactReferences.evidenceAware3dRepresentationContract07 = {
    releaseId: representation.releaseId,
    routeCount: representation.routeCount,
    supplementaryRouteCount: representation.supplementaryRouteCount,
    radiusDerivedRouteCount: representation.radiusDerivedRouteCount,
    centerlineOnlyRouteCount: representation.centerlineOnlyRouteCount,
    internalPrimitiveCount: representation.internalPrimitiveCount,
    crossSourceIdentityCount: representation.crossSourceIdentityCount,
    projectRegistrationCount: representation.projectRegistrationCount,
    contractReceipt: byPath.get("data/evidence-aware-3d-representation-contract-0.7.json"),
  };
  manifest.exactReferences.supplementalToddActiveRecordIntegration273 = {
    baseSearchIndexRecordCount: 641,
    verifiedSupplementalRecordCount: 30,
    runtimeSearchRecordCount: 671,
    baseMorphologyRecordCount: 149,
    runtimeMorphologyRecordCount: 179,
    frozenCensusRecordCount: 142,
    supplementaryExactMorphologyRecordCount: 37,
    sourceRoutePackCanonicalSha256: "01db2a4df6f66e2fc486041a901b2f5dc9c9ad5238cb637e01ff49d8e8e07537",
    activeRecordResolverCount: 1,
    censusExpansionCount: 0,
  };
  manifest.exactReferences.iteration273Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_73.md",
    rollbackParent: SNAPSHOT_272.path,
  };
  manifest.scientificBoundaries.neuromorphoRelease126ToddSupplementaryGeometry245 = "The exact current 339-record Todd mouse spinal-interneuron query was compared with the frozen 8.6.124 Todd subset: 309 common records, 30 additions, zero removals, and zero compared-field changes. Thirty source-local standardized SWCs were checksum-verified and parsed. Only ten records report diameter; twenty remain centerline-only. The 30 supplementary routes add zero records to the 1,097-record frozen census. Per-record publication, animal, figure, lamina and cross-source identity remain unresolved; original Neurolucida files and standardization logs are absent, biological completeness is not independently established, and no internal structures, registrations or measurements are admitted.";
  manifest.scientificBoundaries.evidenceAware3dRepresentationContract07 = "Representation contract 0.7 preserves the immutable 0.6 routes and appends thirty route-specific, checksum-verified source-local permissions. Radius-derived open frusta are permitted for ten exact source records with reported diameter; twenty records are centerline-only. All thirty retain zero internal primitives, zero cross-source identities and zero project registrations; no route expands the frozen query denominator.";
  manifest.scientificBoundaries.iteration273Layout = "Iteration 2.73 seals the exact 2.72 manifest as immutable parent, records 30 verified supplementary Todd morphology routes and the per-record 3D permission contract, unifies search/evidence/3D selection through one checksum-gated active-record resolver, updates current registry denominators and UI version, and creates no full-project copy.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest273()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_273_PATH, bytes);
      const audit = manifest.exactReferences.neuromorphoRelease126ToddStableIdAudit245V02;
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, sourceCount: manifest.exactReferences.researchRegistryDenominators273.canonicalSourcePackageCount, recordSetCount: manifest.exactReferences.researchRegistryDenominators273.canonicalRecordSetCount, currentToddRoster: audit.currentRosterCount, added: audit.addedStableIdCount, removed: audit.removedStableIdCount, routes: audit.supplementaryRoutesAdmitted, radiusDerived: audit.sourceDiameterReportedCount, centerlineOnly: audit.sourceDiameterNotReportedCount, internalPrimitives: audit.renderedInternalPrimitives, fullProjectCopyCount: manifest.exactReferences.iteration273Layout.fullProjectCopyCount})}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
