#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_261, validateResearchIterationManifest261Snapshot } from "../scripts/validate-research-iteration-manifest-2.61-snapshot.mjs";
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
  buildPaperCellTypeCrossTab,
  UNREPORTED_SOURCE_CELL_TYPE,
} from "../app/neuromorpho-universe-facets.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_262_PATH = path.join(ROOT, "data/research-iteration-manifest-2.62.json");
export const INPUTS_262 = Object.freeze([
  ["sealedIteration261SnapshotValidator", "scripts/validate-research-iteration-manifest-2.61-snapshot.mjs"],
  ["sealedIteration261SnapshotTests", "tests/research-iteration-manifest-2.61-snapshot.test.mjs"],
  ["paperCellTypeCrosswalkTests", "tests/neuromorpho-universe-paper-cell-type-crosswalk.test.mjs"],
  ["iteration262Builder", "tools/build_research_iteration_manifest_2_62.mjs"],
  ["iteration262Validator", "scripts/validate-research-iteration-manifest-2.62.mjs"],
  ["iteration262Tests", "tests/research-iteration-manifest-2.62.test.mjs"],
  ["iteration262Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_62.md"],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

async function buildPaperCellTypeCrossTabReceipt() {
  const contract = JSON.parse(await readFile(path.join(ROOT, "data/neuromorpho-no-age-query-universe-0.1.json"), "utf8"));
  const relativeIndexPath = contract.dataset.indexPath.replace(/^\/+/, "");
  if (!relativeIndexPath || relativeIndexPath.split("/").includes("..")) throw new Error("Unsafe NeuroMorpho universe index path");
  const indexPath = path.join(ROOT, "public", relativeIndexPath);
  const bytes = await readFile(indexPath);
  const digest = sha256(bytes);
  if (bytes.byteLength !== contract.dataset.indexBytes || digest !== contract.dataset.indexSha256) throw new Error("NeuroMorpho paper-label cross-tab index receipt changed");
  const index = JSON.parse(bytes.toString("utf8"));
  if (index.repositoryRelease !== "8.6.124" || !Array.isArray(index.records)
    || index.records.length !== contract.summary.queryRecordCount) throw new Error("NeuroMorpho paper-label cross-tab release or record count changed");

  const crossTab = buildPaperCellTypeCrossTab(index.records);
  const doiLabelMembershipCount = crossTab.papers.reduce((sum, paper) => sum + paper.cellTypeRows.reduce((n, row) => n + row.recordCount, 0), 0);
  const uniqueCellTypeLabelCount = new Set(crossTab.papers.flatMap((paper) => paper.cellTypeRows.map((row) => row.value))
    .filter((value) => value !== UNREPORTED_SOURCE_CELL_TYPE)).size;
  const paperRecordMembershipCount = crossTab.papers.reduce((sum, paper) => sum + paper.nmoIds.length, 0);
  const abraira = crossTab.papers.find((paper) => paper.doi === "10.1016/j.cell.2016.12.010");
  const bannatyne = crossTab.papers.find((paper) => paper.doi === "10.1523/JNEUROSCI.0199-14.2014");

  if (crossTab.recordCount !== 1_097 || crossTab.uniqueNmoIdCount !== 1_097 || crossTab.recordsWithoutNmoIdCount !== 0
    || crossTab.doiCount !== 12 || crossTab.doiMembershipCount !== 1_097 || crossTab.recordsWithoutDoiCount !== 0
    || crossTab.multiDoiRecordCount !== 0 || crossTab.multiLabelRecordCount !== 1_095
    || crossTab.figureMembershipRecordCount !== 0 || crossTab.figureMembershipUnassessableRecordCount !== 1_097
    || crossTab.figureMembershipStatus !== "not_encoded_in_index" || paperRecordMembershipCount !== 1_097
    || uniqueCellTypeLabelCount !== 27 || doiLabelMembershipCount !== 2_735
    || abraira?.recordCount !== 650 || bannatyne?.recordCount !== 49
    || crossTab.papers.some((paper) => paper.nmoIds.length !== paper.recordCount
      || paper.cellTypeRows.some((row) => row.nmoIds.length !== row.recordCount))) {
    throw new Error("NeuroMorpho paper-label cross-tab differs from the pinned 8.6.124 record provenance");
  }

  return {
    repositoryRelease: index.repositoryRelease,
    indexPath: path.relative(ROOT, indexPath),
    indexBytes: bytes.byteLength,
    indexSha256: digest,
    ...crossTab,
    uniqueCellTypeLabelCount,
    doiLabelMembershipCount,
    paperRecordMembershipCount,
    countsAreMutuallyExclusive: false,
    figureMembershipIsAssessable: false,
    figureMembershipReason: "The pinned query index records PMIDs and DOIs but has no exact record-to-figure crosswalk.",
    filterChangesActiveRecord: false,
    exactPairFilterSelectsRecord: false,
    newGeometryObjectCount: 0,
    sameCellJoinCount: 0,
    molecularProfileJoinCount: 0,
    internalPrimitiveCount: 0,
    atlasRegistrationCount: 0,
    papers: crossTab.papers,
  };
}

export async function buildResearchIterationManifest262() {
  const parentReceipt = await validateResearchIterationManifest261Snapshot();
  const parent = parentReceipt.manifest;
  const [upgrades, sourceRegistry, upgradeRegistry, denominatorReceipt, layout, crossTab] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    loadResearchUpgradeRegistry(),
    validateResearchSourceRegistryDenominators(),
    validateIncrementalIterationLayout(),
    buildPaperCellTypeCrossTabReceipt(),
  ]);
  validateResearchSourceRegistry(sourceRegistry);
  validateResearchSourceUpgradeLinks(sourceRegistry, upgradeRegistry);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  if (sourceSummary.sourceCount !== 28 || sourceSummary.recordSetCount !== 37
    || sourceSummary.bundledExactRosterCount !== 11 || sourceSummary.bundledExactSourceObjectSetCount !== 2
    || sourceSummary.sourceCount !== parent.registrySummary.canonicalSourcePackageCount
    || sourceSummary.recordSetCount !== parent.registrySummary.canonicalRecordSetCount
    || sourceSummary.typeRecordCount !== parent.registrySummary.sourceProfileCount) {
    throw new Error("2.62 source-registry denominators differ from the sealed 2.61 source-package boundary");
  }
  if (upgrades.upgradeCount !== 222 || upgrades.displayedUpgradeCount !== 33 || denominatorReceipt.staleLiteralCount !== 0) {
    throw new Error("2.62 live research-upgrade or displayed-denominator receipt changed");
  }

  const parentInputs = await Promise.all(parent.authoritativeInputs.map(async (input) => {
    const current = await receipt(input, parent.inputRoots[input.scope]?.locator);
    const changed = current.bytes !== input.bytes || current.sha256 !== input.sha256;
    return changed ? { ...current, purpose: `Iteration 2.62 refreshed ${input.id} receipt` } : current;
  }));
  const inputs = [
    ...parentInputs,
    ...INPUTS_262.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.62 exact paper-label record cross-tab, immutable 2.61 rollback, research-source decisions, validation, or unique timeline receipt" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.62 input identity");
  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.62.0-research.1") throw new Error("2.62 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.62.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.62.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_261.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_261.bytes,
    fileSha256: SNAPSHOT_261.fileSha256,
    contentSha256: SNAPSHOT_261.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.62 adds a DOI × exact raw cell_type provenance cross-tab to the pinned 8.6.124 NeuroMorpho universe. It retains every exact NMO ID and archive by source DOI and label; all counts remain overlapping repository memberships. DOI does not establish paper-figure membership. No type harmonization, new geometry, identity join or anatomical inference is introduced.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  manifest.exactReferences.neuromorphoPaperCellTypeCrossTab262 = {
    ...crossTab,
    researchUpgradeId: "UPG-237",
    runtime: {
      computedFromChecksumVerifiedPinnedIndex: true,
      filterChangesActiveRecord: false,
      exactPairFilterSelectsRecord: false,
      geometryChangesOnlyAfterExplicitExactNmoSelection: true,
    },
  };
  manifest.exactReferences.researchRegistryDenominators262 = {
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
  manifest.exactReferences.iteration262Layout = {
    fullProjectCopyCount: layout.fullProjectCopyCount,
    distinctTimelinePath: "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_62.md",
    rollbackParent: SNAPSHOT_261.path,
  };
  manifest.scientificBoundaries.neuromorphoPaperCellTypeCrossTab262 = "The checksum-pinned NeuroMorpho 8.6.124 no-age index contains 1,097 exact NMO IDs across 12 cited DOIs. The index yields 1,097 DOI-record memberships, 2,735 DOI × raw-label memberships and 1,095 multi-label records; counts overlap and are not a type, animal or prevalence denominator. It currently has no DOI-unreported or multi-DOI records, but the adapter preserves explicit missingness and multiple DOI memberships if they occur in another tested input. It contains no exact record-to-figure crosswalk, so figure membership is unassessable for all 1,097 records. Filtering narrows the list only; it adds no geometry, identity join or registration.";
  manifest.scientificBoundaries.researchRegistryDenominators262 = `The live registry resolves ${sourceSummary.sourceCount} canonical sources, ${sourceSummary.recordSetCount} record sets, ${sourceSummary.bundledExactRosterCount} exact cell/profile rosters, ${sourceSummary.bundledExactSourceObjectSetCount} exact source-object sets, ${sourceSummary.typeRecordCount} source profiles, and ${upgrades.upgradeCount} research/model upgrades. ${upgrades.displayedUpgradeCount} research-facing upgrade identifiers resolve; canonical display denominators are registry-derived with ${denominatorReceipt.staleLiteralCount} stale literals. Historical registry receipts remain sealed.`;
  manifest.scientificBoundaries.iteration262Layout = "Iteration 2.62 updates the existing workspace with an exact DOI × raw cell_type source cross-tab, focused tests, a sealed 2.61 rollback snapshot, three referenced research audits in the upgrade queue, and one unique timeline. No public image or morphology dataset is copied into the app; no new geometry, same-cell internal primitive, molecular-profile join, registration, package copy or complete project copy is added.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    const { manifest, bytes } = await buildResearchIterationManifest262();
    if (flag === "--write") await writeFile(MANIFEST_262_PATH, bytes);
    const crossTab = manifest.exactReferences.neuromorphoPaperCellTypeCrossTab262;
    process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, version: manifest.application.version, inputCount: manifest.integrity.inputCount, researchUpgradeCount: manifest.registrySummary.researchUpgradeCount, sourceDoiCount: crossTab.doiCount, doiLabelMembershipCount: crossTab.doiLabelMembershipCount, figureMembershipUnassessableRecordCount: crossTab.figureMembershipUnassessableRecordCount, fullProjectCopyCount: manifest.exactReferences.iteration262Layout.fullProjectCopyCount })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
