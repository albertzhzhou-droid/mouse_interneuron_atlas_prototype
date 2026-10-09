#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_269, validateResearchIterationManifest269Snapshot } from "../scripts/validate-research-iteration-manifest-2.69-snapshot.mjs";
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
import { loadAndValidateNeuromorphoRelease126UiAudit } from "../scripts/validate-neuromorpho-release-8-6-126-ui-query-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_270_PATH = path.join(ROOT, "data/research-iteration-manifest-2.70.json");
export const INPUTS_270 = Object.freeze([
  ["sealedIteration269SnapshotValidator", "scripts/validate-research-iteration-manifest-2.69-snapshot.mjs"],
  ["iteration269SnapshotTests", "tests/research-iteration-manifest-2.69-snapshot.test.mjs"],
  ["neuromorphoRelease126UiAudit", "data/neuromorpho-release-8-6-126-ui-query-audit-0.1.json"],
  ["neuromorphoRelease126UiAuditSchema", "schemas/neuromorpho-release-8-6-126-ui-query-audit-0.1.schema.json"],
  ["neuromorphoRelease126UiAuditValidator", "scripts/validate-neuromorpho-release-8-6-126-ui-query-audit-0.1.mjs"],
  ["neuromorphoRelease126UiAuditTests", "tests/neuromorpho-release-8-6-126-ui-query-audit.test.mjs"],
  ["researchOverviewReleaseWatch", "app/ResearchOverview.tsx"],
  ["applicationLayout", "app/layout.tsx"],
  ["atlasPrototypeVersionBanner", "app/AtlasPrototype.tsx"],
  ["researchUpgradeQueue", "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"],
  ["researchUpgradeRegistry", "data/research-model-upgrade-registry-0.1.json"],
  ["researchUpgradeRegistryBuilder", "tools/build_research_upgrade_registry.mjs"],
  ["researchUpgradeRegistryTests", "tests/research-model-upgrade-registry.test.mjs"],
  ["applicationPackage", "package.json"],
  ["packageLock", "package-lock.json"],
  ["currentResearchTestRunner", "tools/run_current_research_tests.mjs"],
  ["iteration270Builder", "tools/build_research_iteration_manifest_2_70.mjs"],
  ["iteration270Validator", "scripts/validate-research-iteration-manifest-2.70.mjs"],
  ["iteration270Tests", "tests/research-iteration-manifest-2.70.test.mjs"],
  ["iteration270Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_70.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest270() {
  const parentReceipt = await validateResearchIterationManifest269Snapshot();
  const parent = JSON.parse(await readFile(path.join(ROOT, SNAPSHOT_269.path), "utf8"));
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, auditResult] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    loadAndValidateNeuromorphoRelease126UiAudit(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.70 source-registry denominators differ from immutable 2.69");
  }
  const neuromorphoUpgrade = upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-245");
  if (upgrades.upgradeCount !== 227 || upgrades.displayedUpgradeCount !== 39 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.summary.byStatus.completed !== 66
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-245"
    || !neuromorphoUpgrade?.status.startsWith("partially completed")
    || !/339 hits/.test(neuromorphoUpgrade.description)) {
    throw new Error("2.70 research-upgrade registry or UPG-245 UI-only status receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.70 refreshed ${input.id} receipt` } : current;
  }));
  const inheritedPaths = new Set(parentInputs.map((input) => `${input.scope}:${input.path}`));
  const additions = INPUTS_270
    .filter(([, inputPath]) => !inheritedPaths.has(`project:${inputPath}`))
    .map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.70 NeuroMorpho 8.6.126 UI-query lead, immutable rollback, application, tests, or unique timeline receipt" }));
  const inputs = [...parentInputs, ...additions];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.70 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  for (const [, inputPath] of INPUTS_270) {
    if (!receipts.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.70 exact input receipt missing: ${inputPath}`);
  }
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.70.0-research.1") throw new Error("2.70 application version mismatch");
  const audit = auditResult.audit;
  const auditSummary = auditResult.summary;

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.70.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.70.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_269.path,
    releaseId: parentReceipt.releaseId,
    bytes: SNAPSHOT_269.bytes,
    fileSha256: SNAPSHOT_269.fileSha256,
    contentSha256: SNAPSHOT_269.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.70 records a current NeuroMorpho 8.6.126 release banner and a bounded metadata-UI discovery count under UPG-245. The selected mouse + spinal cord + interneuron + Todd UI filters returned 339 hits without an age filter, but no stable IDs or machine-readable response were retrieved; this is not comparable as a delta to the bundled 1,097-record 8.6.124 all-archive no-age baseline. Keep 8.6.124 active. Do not add denominator rows, records, geometry, identities, registrations or measurements until version-pinned IDs, files, classification, integrity and object-level reuse terms are reconciled.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.researchRegistryDenominators270 = {
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
  manifest.exactReferences.neuromorphoRelease126UiQuery245 = {
    auditId: audit.auditId,
    researchUpgradeId: audit.researchUpgradeId,
    release: auditSummary.release,
    releaseDate: audit.observedRelease.releaseDate,
    reportedRepositoryReconstructionCount: audit.observedRelease.reportedRepositoryCellCount,
    exactUiFilters: audit.query.filters.map(({ field, value }) => ({ field, value })),
    ageFilterApplied: audit.query.ageFilterApplied,
    observedMetadataUiHitCount: audit.query.observedMetadataUiHitCount,
    stableNeuronIdsRetrieved: audit.query.stableNeuronIdsRetrieved,
    machineReadableResponseRetrieved: audit.query.machineReadableResponseRetrieved,
    baselineRelease: audit.comparison.baselineRelease,
    baselineQueryRecordCount: audit.comparison.baselineQueryRecordCount,
    candidateRecordIdsCompared: audit.comparison.candidateRecordIdsCompared,
    addedRecordCount: audit.comparison.addedRecordCount,
    removedRecordCount: audit.comparison.removedRecordCount,
    changedRecordCount: audit.comparison.changedRecordCount,
    deltaStatus: audit.comparison.deltaStatus,
    newRecordsAdmitted: audit.admission.newRecordsAdmitted,
    newGeometryObjectsAdmitted: audit.admission.newGeometryObjectsAdmitted,
    newIdentityJoins: audit.admission.newIdentityJoins,
    registrations: audit.admission.registrations,
    measurements: audit.admission.measurements,
    payloadBytesDownloaded: audit.admission.payloadBytesDownloaded,
  };
  manifest.exactReferences.iteration270Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_70.md",
    rollbackParent: SNAPSHOT_269.path,
  };
  manifest.scientificBoundaries.neuromorphoRelease126UiQuery245 = "UPG-245 is partially completed only for observing the official release banner and one metadata-UI hit count. The 339 Todd-filter hits are not stable IDs, not an exact release delta, and not a biological denominator; the selected archive filter differs from the bundled 1,097-record 8.6.124 all-archive query. No record, geometry, identity join, registration or measurement is admitted. The 8.6.124 geometry universe remains active pending version-pinned stable-ID, file, classification, integrity and reuse-rights review.";
  manifest.scientificBoundaries.iteration270Layout = "Iteration 2.70 adds a source-linked release-watch card and a machine-validated UI-query audit to the existing research overview, preserves the 8.6.124 active geometry corpus and all zero-admission counts, seals the exact 2.69 manifest as immutable parent, refreshes current input receipts, and creates no full-project copy.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest270()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_270_PATH, bytes);
      const audit = manifest.exactReferences.neuromorphoRelease126UiQuery245;
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, displayedUpgradeCount: manifest.exactReferences.researchRegistryDenominators270.displayedUpgradeCount, audit: audit.auditId, uiHits: audit.observedMetadataUiHitCount, stableIdsRetrieved: audit.stableNeuronIdsRetrieved, admittedGeometry: audit.newGeometryObjectsAdmitted, fullProjectCopyCount: manifest.exactReferences.iteration270Layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
