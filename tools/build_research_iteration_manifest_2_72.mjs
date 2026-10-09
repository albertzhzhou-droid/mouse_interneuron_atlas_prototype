#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_271, validateResearchIterationManifest271Snapshot } from "../scripts/validate-research-iteration-manifest-2.71-snapshot.mjs";
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
import { loadAndValidateNeuromorphoRelease126ToddStableIdAudit } from "../scripts/validate-neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_272_PATH = path.join(ROOT, "data/research-iteration-manifest-2.72.json");
export const INPUTS_272 = Object.freeze([
  ["sealedIteration271SnapshotValidator", "scripts/validate-research-iteration-manifest-2.71-snapshot.mjs"],
  ["iteration271SnapshotTests", "tests/research-iteration-manifest-2.71-snapshot.test.mjs"],
  ["neuromorphoRelease126ToddStableIdAudit", "data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.json"],
  ["neuromorphoRelease126ToddStableIdAuditSchema", "schemas/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.schema.json"],
  ["neuromorphoRelease126ToddStableIdAuditValidator", "scripts/validate-neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.mjs"],
  ["neuromorphoRelease126ToddStableIdAuditTests", "tests/neuromorpho-release-8-6-126-todd-stable-id-audit.test.mjs"],
  ["neuromorphoNoAgeUniverseIndex", "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json"],
  ["researchUpgradeQueue", "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"],
  ["researchUpgradeRegistry", "data/research-model-upgrade-registry-0.1.json"],
  ["researchUpgradeRegistryBuilder", "tools/build_research_upgrade_registry.mjs"],
  ["researchUpgradeRegistryValidator", "scripts/validate-research-model-upgrade-registry-0.1.mjs"],
  ["researchUpgradeRegistryTests", "tests/research-model-upgrade-registry.test.mjs"],
  ["currentReleaseWatchCard", "app/ResearchOverview.tsx"],
  ["renderedHtmlTests", "tests/rendered-html.test.mjs"],
  ["currentResearchTestRunner", "tools/run_current_research_tests.mjs"],
  ["applicationPackage", "package.json"],
  ["packageLock", "package-lock.json"],
  ["iteration272Builder", "tools/build_research_iteration_manifest_2_72.mjs"],
  ["iteration272Validator", "scripts/validate-research-iteration-manifest-2.72.mjs"],
  ["iteration272Tests", "tests/research-iteration-manifest-2.72.test.mjs"],
  ["iteration272Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_72.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest272() {
  const parentReceipt = await validateResearchIterationManifest271Snapshot();
  const parent = JSON.parse(await readFile(path.join(ROOT, SNAPSHOT_271.path), "utf8"));
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, stableIdResult] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    loadAndValidateNeuromorphoRelease126ToddStableIdAudit(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.72 source-registry denominators differ from immutable 2.71");
  }
  const uPG245 = upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-245");
  const audit = stableIdResult.audit;
  const summary = stableIdResult.summary;
  if (upgrades.upgradeCount !== 228 || upgrades.displayedUpgradeCount !== 39 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.summary.byStatus.completed !== 67
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-246"
    || !uPG245?.status.startsWith("partially completed")
    || !/30 stable NeuroMorpho IDs/.test(uPG245.description)
    || !/not a complete 339-ID census/.test(uPG245.description)
    || audit.releaseSetReview.candidateStableIdCount !== 30
    || summary.candidateIdsFoundInBaseline !== 0
    || summary.baselineRecordCount !== 1097 || summary.baselineToddQueryCount !== 309
    || summary.currentUiHits !== 339 || summary.currentRosterComplete !== false
    || summary.sourceFilesDownloaded !== 0 || summary.geometryObjectsAdmitted !== 0) {
    throw new Error("2.72 UPG-245 stable-ID delta, registry denominator, or zero-admission boundary changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.72 refreshed ${input.id} receipt` } : current;
  }));
  const inheritedPaths = new Set(parentInputs.map((input) => `${input.scope}:${input.path}`));
  const additions = INPUTS_272
    .filter(([, inputPath]) => !inheritedPaths.has(`project:${inputPath}`))
    .map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.72 Todd release stable-ID audit, current release-watch card, immutable rollback, tests, or unique timeline receipt" }));
  const inputs = [...parentInputs, ...additions];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.72 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  for (const [, inputPath] of INPUTS_272) {
    if (!receipts.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.72 exact input receipt missing: ${inputPath}`);
  }
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.72.0-research.1") throw new Error("2.72 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.72.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.72.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_271.path,
    releaseId: parentReceipt.releaseId,
    bytes: SNAPSHOT_271.bytes,
    fileSha256: SNAPSHOT_271.fileSha256,
    contentSha256: SNAPSHOT_271.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.72 reconciles the official NeuroMorpho 8.6.126 Todd release set against the frozen 8.6.124 no-age mouse spinal-interneuron query. Thirty listed Todd reconstructions have 30 individually reviewed stable neuron IDs; all are absent from the 309-record Todd subset of the 1,097-record baseline. The observed current metadata UI count of 339 equals 309 + 30 arithmetically, but a complete current query ID roster, removals and metadata changes remain unresolved. Original files, per-object rights, hashes, completeness and file dimensionality were not reviewed. Keep the 8.6.124 denominator and geometry corpus active; admit no new record, geometry, identity, registration or measurement.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.researchRegistryDenominators272 = {
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
  manifest.exactReferences.neuromorphoRelease126ToddStableIdAudit245 = {
    auditId: audit.auditId,
    researchUpgradeId: audit.researchUpgradeId,
    release: audit.currentRelease.version,
    releaseDate: audit.currentRelease.releaseDate,
    announcedToddNovelReconstructionCount: audit.currentRelease.announcedToddNovelReconstructionCount,
    candidateStableIdCount: audit.releaseSetReview.candidateStableIdCount,
    uniqueCandidateNameCount: new Set(audit.releaseSetReview.candidateRecords.map((record) => record.neuronName)).size,
    baselineRelease: audit.baseline.release,
    baselineQueryRecordCount: summary.baselineRecordCount,
    baselineToddQueryRecordCount: summary.baselineToddQueryCount,
    candidateIdsComparedAgainstBaseline: audit.comparison.candidateIdsComparedAgainstBaseline,
    candidateIdsFoundInBaseline: audit.comparison.candidateIdsFoundInBaseline,
    releaseSetCandidatesAbsentFromBaseline: audit.comparison.releaseSetCandidatesAbsentFromBaseline,
    observedCurrentQueryHits: audit.currentQuery.observedMetadataUiHitCount,
    baselineToddCountPlusCandidates: audit.comparison.baselineToddCountPlusCandidates,
    arithmeticCountReconciles: audit.comparison.arithmeticCountReconciles,
    arithmeticIsNotACompleteCurrentRosterProof: audit.comparison.arithmeticIsNotACompleteCurrentRosterProof,
    completeCurrentStableIdRosterRetrieved: audit.currentQuery.completeCurrentStableIdRosterRetrieved,
    completeCurrentQueryDeltaStatus: audit.comparison.completeCurrentQueryDeltaStatus,
    removedRecordCount: audit.comparison.removedRecordCount,
    changedRecordCount: audit.comparison.changedRecordCount,
    candidateSourceFilesDownloaded: audit.sourceAssetReview.candidateSourceFilesDownloaded,
    candidateSourceFilesHashed: audit.sourceAssetReview.candidateSourceFilesHashed,
    objectLevelReuseTermsVerified: audit.sourceAssetReview.objectLevelReuseTermsVerified,
    fileDimensionalityIndependentlyInspected: audit.sourceAssetReview.fileDimensionalityIndependentlyInspected,
    fileCompletenessIndependentlyInspected: audit.sourceAssetReview.fileCompletenessIndependentlyInspected,
    newRecordsAdmitted: audit.admission.newRecordsAdmitted,
    newGeometryObjectsAdmitted: audit.admission.newGeometryObjectsAdmitted,
    newIdentityJoins: audit.admission.newIdentityJoins,
    registrations: audit.admission.registrations,
    measurements: audit.admission.measurements,
  };
  manifest.exactReferences.iteration272Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_72.md",
    rollbackParent: SNAPSHOT_271.path,
  };
  manifest.scientificBoundaries.neuromorphoRelease126ToddStableIdAudit245 = "Thirty official Todd 8.6.126 release candidates have stable IDs absent from the 8.6.124 no-age query, and their verified metadata match mouse, spinal cord and interneuron filters. The 309 baseline Todd records plus 30 candidate records equal the 339 current UI hits, but this arithmetic is not a complete current-query ID census and does not resolve removals or metadata changes. No original source file was downloaded or hashed; object-level reuse rights, dimensionality and completeness remain unreviewed. Keep the 8.6.124 denominator active; admit zero new records, geometry, identity joins, registrations or measurements.";
  manifest.scientificBoundaries.iteration272Layout = "Iteration 2.72 records the bounded stable-ID comparison and source-file gate for UPG-245, updates the researcher-facing release card, seals the exact 2.71 manifest as immutable parent, refreshes changed input receipts, and creates no full-project copy.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest272()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_272_PATH, bytes);
      const audit = manifest.exactReferences.neuromorphoRelease126ToddStableIdAudit245;
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, auditId: audit.auditId, candidateStableIds: audit.candidateStableIdCount, candidatesFoundInBaseline: audit.candidateIdsFoundInBaseline, baselineToddCount: audit.baselineToddQueryRecordCount, currentUiHits: audit.observedCurrentQueryHits, currentRosterComplete: audit.completeCurrentStableIdRosterRetrieved, sourceFilesDownloaded: audit.candidateSourceFilesDownloaded, objectReuseRightsVerified: audit.objectLevelReuseTermsVerified, geometryObjectsAdmitted: audit.newGeometryObjectsAdmitted, fullProjectCopyCount: manifest.exactReferences.iteration272Layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
