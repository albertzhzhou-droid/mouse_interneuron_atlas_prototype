#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_268, validateResearchIterationManifest268Snapshot } from "../scripts/validate-research-iteration-manifest-2.68-snapshot.mjs";
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
import { validateMouseSpinalEmRepositorySearchAudit } from "../scripts/validate-mouse-spinal-em-repository-search-audit-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_269_PATH = path.join(ROOT, "data/research-iteration-manifest-2.69.json");
export const INPUTS_269 = Object.freeze([
  ["sealedIteration268SnapshotValidator", "scripts/validate-research-iteration-manifest-2.68-snapshot.mjs"],
  ["iteration268SnapshotTests", "tests/research-iteration-manifest-2.68-snapshot.test.mjs"],
  ["mouseSpinalEmSearchAudit", "data/mouse-spinal-em-repository-search-audit-0.1.json"],
  ["mouseSpinalEmSearchAuditSchema", "schemas/mouse-spinal-em-repository-search-audit-0.1.schema.json"],
  ["mouseSpinalEmSearchAuditValidator", "scripts/validate-mouse-spinal-em-repository-search-audit-0.1.mjs"],
  ["mouseSpinalEmSearchAuditTests", "tests/mouse-spinal-em-repository-search-audit.test.mjs"],
  ["mouseSpinalEmSearchAuditComponent", "app/MouseSpinalEmRepositorySearchAudit.tsx"],
  ["iteration269Builder", "tools/build_research_iteration_manifest_2_69.mjs"],
  ["iteration269Validator", "scripts/validate-research-iteration-manifest-2.69.mjs"],
  ["iteration269Tests", "tests/research-iteration-manifest-2.69.test.mjs"],
  ["iteration269Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_69.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest269() {
  const parentReceipt = await validateResearchIterationManifest268Snapshot();
  const parent = JSON.parse(await readFile(path.join(ROOT, SNAPSHOT_268.path), "utf8"));
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, emAudit] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    validateMouseSpinalEmRepositorySearchAudit(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.69 source-registry denominators differ from immutable 2.68");
  }
  if (upgrades.upgradeCount !== 227 || upgrades.displayedUpgradeCount !== 39 || denominatorReceipt.staleLiteralCount !== 0
    || upgradeRegistry.summary.byStatus.completed !== 66
    || upgradeRegistry.upgrades.at(-1)?.id !== "UPG-245"
    || !upgradeRegistry.upgrades.find((upgrade) => upgrade.id === "UPG-245")?.status.startsWith("planned")) {
    throw new Error("2.69 research-upgrade, planned UPG-245, or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.69 refreshed ${input.id} receipt` } : current;
  }));
  const inheritedPaths = new Set(parentInputs.map((input) => `${input.scope}:${input.path}`));
  const additions = INPUTS_269
    .filter(([, inputPath]) => !inheritedPaths.has(`project:${inputPath}`))
    .map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.69 bounded open-EM search audit, immutable rollback, application, tests, or unique timeline receipt" }));
  const inputs = [...parentInputs, ...additions];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.69 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  for (const [, inputPath] of INPUTS_269) {
    if (!receipts.some((input) => input.scope === "project" && input.path === inputPath)) throw new Error(`2.69 exact input receipt missing: ${inputPath}`);
  }
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.69.0-research.1") throw new Error("2.69 application version mismatch");
  const audit = JSON.parse(await readFile(path.join(ROOT, "data/mouse-spinal-em-repository-search-audit-0.1.json"), "utf8"));

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.69.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.69.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_268.path,
    releaseId: parentReceipt.releaseId,
    bytes: SNAPSHOT_268.bytes,
    fileSha256: SNAPSHOT_268.fileSha256,
    contentSha256: SNAPSHOT_268.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.69 adds a source-linked, researcher-facing audit of a bounded open mouse spinal EM repository search. EMPIAR and EMDB returned no entries for the reviewed query; BioImage Archive fuzzy search results were screened only on their first visible page and two near matches were excluded by modality or sample identity. No universal absence is claimed and no payload, voxel, segmentation or exact interneuron object is admitted. Official NeuroMorpho 8.6.126 release metadata are recorded as a lead only; UPG-245 will reconcile exact IDs against the bundled 8.6.124 query before any denominator or geometry changes.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.researchRegistryDenominators269 = {
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
  manifest.exactReferences.boundedMouseSpinalEmRepositorySearch243 = {
    auditId: audit.auditId,
    researchUpgradeId: audit.researchUpgradeId,
    queryCount: emAudit.repositoryQueries,
    reviewedCandidateCount: emAudit.reviewedCandidates,
    empiarMatchingEntries: audit.repositoryQueries.find((query) => query.repository === "EMPIAR").resultCount,
    empiarDisplayedEntryCount: audit.repositoryQueries.find((query) => query.repository === "EMPIAR").searchedEntryCount,
    emdbMatchingEntries: audit.repositoryQueries.find((query) => query.repository === "EMDB").resultCount,
    bioImageArchiveQueryResultCounts: audit.repositoryQueries.filter((query) => query.repository === "BioImage Archive").map((query) => query.resultCount),
    eligibleMouseSpinalInterneuronObjectRoutes: audit.admission.eligibleMouseSpinalInterneuronObjectRoutes,
    downloadedPayloadBytes: audit.admission.downloadedPayloadBytes,
    admittedVoxelVolumes: audit.admission.voxelVolumesAdmitted,
    admittedSegmentationObjects: audit.admission.segmentationObjectsAdmitted,
    admittedObjectCrosswalks: audit.admission.stableInterneuronObjectCrosswalksAdmitted,
    sameCellJoins: audit.admission.sameCellJoins,
    atlasRegistrations: audit.admission.atlasRegistrations,
    biologicalMeasurements: audit.admission.biologicalMeasurements,
    universalAbsenceClaim: false,
  };
  manifest.exactReferences.iteration269Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_69.md",
    rollbackParent: SNAPSHOT_268.path,
  };
  manifest.scientificBoundaries.boundedMouseSpinalEmRepositorySearch243 = "UPG-243 is a bounded repository-query and candidate-record screen, not an exhaustive search or universal data-absence claim. Search-result counts do not identify sample records. EMPIAR/EMDB returned no entries for the searched terms; BioImage Archive candidates were inspected only within the documented first-page scope and excluded for missing spinal EM objects or non-spinal sample identity. No volume payload, segmentation, stable mouse interneuron object route, exact-cell join, atlas registration, or measurement is admitted.";
  manifest.scientificBoundaries.iteration269Layout = "Iteration 2.69 adds a small source-linked search-audit card to the existing internal-reference panel and pins its query/result limits, candidate exclusions, and no-admission counts. It seals the exact 2.68 manifest as immutable parent, refreshes current input receipts, downloads no image or volume data, and creates no full-project copy.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildResearchIterationManifest269()
    .then(async ({ manifest, bytes }) => {
      if (process.argv.includes("--write")) await writeFile(MANIFEST_269_PATH, bytes);
      const audit = manifest.exactReferences.boundedMouseSpinalEmRepositorySearch243;
      process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, displayedUpgradeCount: manifest.exactReferences.researchRegistryDenominators269.displayedUpgradeCount, audit: audit.auditId, eligibleObjectRoutes: audit.eligibleMouseSpinalInterneuronObjectRoutes, downloadedPayloadBytes: audit.downloadedPayloadBytes, fullProjectCopyCount: manifest.exactReferences.iteration269Layout.fullProjectCopyCount })}\n`);
    })
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
