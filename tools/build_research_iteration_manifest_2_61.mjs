#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_260, validateResearchIterationManifest260Snapshot } from "../scripts/validate-research-iteration-manifest-2.60-snapshot.mjs";
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
import {
  buildSourceCellTypeFacetOptions,
  sourceCellTypeValues,
  UNREPORTED_SOURCE_CELL_TYPE,
} from "../app/neuromorpho-universe-facets.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_261_PATH = path.join(ROOT, "data/research-iteration-manifest-2.61.json");
export const INPUTS_261 = Object.freeze([
  ["sealedIteration260SnapshotValidator", "scripts/validate-research-iteration-manifest-2.60-snapshot.mjs"],
  ["sealedIteration260SnapshotTests", "tests/research-iteration-manifest-2.60-snapshot.test.mjs"],
  ["sourceCellTypeFacetTests", "tests/neuromorpho-universe-source-cell-type-facets.test.mjs"],
  ["iteration261Builder", "tools/build_research_iteration_manifest_2_61.mjs"],
  ["iteration261Validator", "scripts/validate-research-iteration-manifest-2.61.mjs"],
  ["iteration261Tests", "tests/research-iteration-manifest-2.61.test.mjs"],
  ["iteration261Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_61.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

async function buildSourceCellTypeFacetReceipt() {
  const contract = JSON.parse(await readFile(path.join(ROOT, "data/neuromorpho-no-age-query-universe-0.1.json"), "utf8"));
  const relativeIndexPath = contract.dataset.indexPath.replace(/^\/+/, "");
  if (!relativeIndexPath || relativeIndexPath.split("/").includes("..")) throw new Error("Unsafe NeuroMorpho universe index path");
  const indexPath = path.join(ROOT, "public", relativeIndexPath);
  const bytes = await readFile(indexPath);
  const digest = sha256(bytes);
  if (bytes.byteLength !== contract.dataset.indexBytes || digest !== contract.dataset.indexSha256) throw new Error("NeuroMorpho source cell-type facet index receipt changed");
  const index = JSON.parse(bytes.toString("utf8"));
  if (index.repositoryRelease !== "8.6.124" || !Array.isArray(index.records)
    || index.records.length !== contract.summary.queryRecordCount) throw new Error("NeuroMorpho source cell-type facet release or record count changed");

  const options = buildSourceCellTypeFacetOptions(index.records);
  const missingCount = options.find((option) => option.value === UNREPORTED_SOURCE_CELL_TYPE)?.count ?? 0;
  const labelOptions = options.filter((option) => option.value !== UNREPORTED_SOURCE_CELL_TYPE);
  const multiLabelRecordCount = index.records.filter((record) => sourceCellTypeValues(record).length > 1).length;
  const membershipCount = labelOptions.reduce((sum, option) => sum + option.count, 0);
  if (labelOptions.length !== 27 || membershipCount !== 2735 || multiLabelRecordCount !== 1095 || missingCount !== 0) {
    throw new Error("NeuroMorpho source cell-type facet values differ from the pinned 8.6.124 contract");
  }
  return {
    repositoryRelease: index.repositoryRelease,
    indexPath: path.relative(ROOT, indexPath),
    indexBytes: bytes.byteLength,
    indexSha256: digest,
    queryRecordCount: index.records.length,
    rawCellTypeLabelCount: labelOptions.length,
    recordLabelMembershipCount: membershipCount,
    multiLabelRecordCount,
    missingCellTypeRecordCount: missingCount,
    cellTypeLabelRecordCounts: labelOptions,
    countsAreMutuallyExclusive: false,
    filterAutomaticallySelectsRecord: false,
    newGeometryObjectCount: 0,
    molecularProfileJoinCount: 0,
    sameCellJoinCount: 0,
    internalPrimitiveCount: 0,
    atlasRegistrationCount: 0,
  };
}

export async function buildResearchIterationManifest261() {
  const parentReceipt = await validateResearchIterationManifest260Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, cellTypeFacet] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    buildSourceCellTypeFacetReceipt(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.sourceCount !== parent.registrySummary.canonicalSourcePackageCount
    || sourceSummary.recordSetCount !== parent.registrySummary.canonicalRecordSetCount
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.61 source-registry denominators differ from the sealed 2.60 source-package boundary");
  }
  if (upgrades.upgradeCount !== 219 || upgrades.displayedUpgradeCount !== 32 || denominatorReceipt.staleLiteralCount !== 0) {
    throw new Error("2.61 live research-upgrade or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.61 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_261.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.61 exact source-label morphology facet, immutable 2.60 rollback, validation, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.61 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.61.0-research.1") throw new Error("2.61 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.61.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.61.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_260.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_260.bytes,
    fileSha256: SNAPSHOT_260.fileSha256,
    contentSha256: SNAPSHOT_260.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.61 exposes the exact raw NeuroMorpho official cell_type field as a filter over the pinned 8.6.124 no-age query universe. The source labels are hierarchical and overlapping; they narrow the list but do not select a representative neuron, unify molecular types, add geometry, or join a molecular profile. Only an explicitly selected exact NMO record loads its checksum-verified source-local SWC. No new morphology or internal geometry is added.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.neuromorphoSourceCellTypeFacet261 = {
    ...cellTypeFacet,
    researchUpgradeId: "UPG-236",
    runtime: {
      facetValuesFromVerifiedIndex: true,
      filterChangesActiveRecord: false,
      exactRecordSelectionChangesActiveGeometry: true,
      selectionUsesChecksumVerifiedSourceObject: true,
    },
  };
  manifest.exactReferences.researchRegistryDenominators261 = {
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
  manifest.exactReferences.iteration261Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_61.md",
    rollbackParent: SNAPSHOT_260.path,
  };
  manifest.scientificBoundaries.neuromorphoSourceCellTypeFacet261 = "The 8.6.124 no-age universe contains 1,097 exact repository records with 27 non-missing source cell_type strings and 2,735 record-label memberships; 1,095 records have multiple labels. Facet counts are therefore overlapping record-label memberships, not mutually exclusive cell types, biological animal denominators, or prevalence. Values preserve official raw strings. Filtering only narrows the record list, and only an explicit exact-record selection loads that record's verified source-local SWC. This does not establish molecular-profile identity, representative morphology, new geometry, same-cell internal structures, or atlas registration.";
  manifest.scientificBoundaries.researchRegistryDenominators261 = `The live registry resolves ${sourceSummary.sourceCount} canonical sources, ${sourceSummary.recordSetCount} record sets, ${sourceSummary.bundledExactRosterCount} exact cell/profile rosters, ${sourceSummary.bundledExactSourceObjectSetCount} exact source-object sets, ${sourceSummary.typeRecordCount} source profiles, and ${upgrades.upgradeCount} research/model upgrades. ${upgrades.displayedUpgradeCount} research-facing upgrade identifiers resolve; canonical display denominators are registry-derived with ${denominatorReceipt.staleLiteralCount} stale literals. Historical registry receipts remain sealed.`;
  manifest.scientificBoundaries.iteration261Layout = "Iteration 2.61 updates the existing workspace and adds an exact official cell_type facet over the checksum-verified morphology query index, focused tests, a sealed 2.60 rollback snapshot, and one unique timeline. No new source geometry, same-cell internal primitive, molecular-profile join, registration, package copy, or complete project copy was added.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest261();
    if (flag === "--write") await writeFile(MANIFEST_261_PATH, bytes);
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, rawCellTypeLabelCount: manifest.exactReferences.neuromorphoSourceCellTypeFacet261.rawCellTypeLabelCount, recordLabelMembershipCount: manifest.exactReferences.neuromorphoSourceCellTypeFacet261.recordLabelMembershipCount, multiLabelRecordCount: manifest.exactReferences.neuromorphoSourceCellTypeFacet261.multiLabelRecordCount, fullProjectCopyCount: manifest.exactReferences.iteration261Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
