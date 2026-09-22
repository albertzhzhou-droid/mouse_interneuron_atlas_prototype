#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.36.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.35.json");

const PARENT_RECEIPT = Object.freeze({
  path: "data/research-iteration-manifest-2.35.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.35.0",
  bytes: 134630,
  fileSha256: "71f90cfc2c6ad2c6f74146d1992493fc77229c131764faff83657dcada797dc1",
  contentSha256: "0691b27bd2cd46e0d96d9a8862ff8478819572f7cfde225d20b9d9c93aeff828",
});

const REPLACED_INPUT_IDS = Object.freeze([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "researchExplorerAssetManifest",
  "researchExplorerSearchIndex",
  "researchEvidenceFingerprintComponent",
  "atlasFocusSynchronization",
  "typeAtlasFingerprintIntegration",
  "researchExplorerFingerprintIntegration",
  "researchExplorerIndexRuntime",
  "internalStructureReferencePanel",
  "atlasTypeContracts",
  "applicationPackage",
  "projectReadme",
  "researchUpgradeQueue",
  "researchDataLab",
  "researchOverview",
  "atlasStylesheet",
  "renderedHtmlTest",
  "micronsObservedReferenceTest",
  "researchSourceRegistryValidator",
  "researchSourceRegistryTest",
  "researchExplorerBuilder",
  "researchExplorerValidator",
  "researchExplorerTest",
]);

const ADDITIONAL_INPUTS = Object.freeze([
  ["dmrt3Di6Builder", "tools/build_dmrt3_di6_source_taxonomy.mjs", "Deterministic Dmrt3/dI6 M1-M6 source-summary builder"],
  ["dmrt3Di6Contract", "data/dmrt3-di6-source-taxonomy-0.1.json", "Checksum-pinned source-local Dmrt3/dI6 M1-M6 group-summary contract"],
  ["dmrt3Di6Schema", "schemas/dmrt3-di6-source-taxonomy-0.1.schema.json", "Dmrt3/dI6 source-taxonomy JSON schema"],
  ["dmrt3Di6Validator", "scripts/validate-dmrt3-di6-source-taxonomy-0.1.mjs", "Dmrt3/dI6 receipts, denominators, quarantines and zero-geometry validator"],
  ["dmrt3Di6Test", "tests/dmrt3-di6-source-taxonomy.test.mjs", "Dmrt3/dI6 deterministic-build and mutation regression tests"],
  ["knowledgeCoverageContract", "data/interneuron-knowledge-coverage-0.1.json", "Seven-source by seven-axis evidence-coverage matrix"],
  ["knowledgeCoverageSchema", "schemas/interneuron-knowledge-coverage-0.1.schema.json", "Knowledge-coverage matrix JSON schema"],
  ["knowledgeCoverageValidator", "scripts/validate-interneuron-knowledge-coverage-0.1.mjs", "Knowledge-coverage lane, judgment and boundary validator"],
  ["knowledgeCoverageTest", "tests/interneuron-knowledge-coverage.test.mjs", "Seven-lane, 49-judgment and Dmrt3 boundary regression tests"],
  ["manifestHashRuntime", "scripts/build-release-manifest.mjs", "Canonical JSON and manifest-content SHA-256 implementation used by the 2.36 builder"],
  ["researchIteration235SnapshotValidator", "scripts/validate-research-iteration-manifest-2.35-snapshot.mjs", "Immutable 2.35 snapshot validator independent of live-input drift"],
  ["researchIteration235SnapshotTest", "tests/research-iteration-manifest-2.35-snapshot.test.mjs", "Immutable 2.35 snapshot receipt and mutation regression tests"],
  ["currentResearchTestRunner", "tools/run_current_research_tests.mjs", "Current-iteration test discovery runner excluding historical live-input validators"],
  ["researchTimeline236", "docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_36.md", "Unique in-place iteration 2.36 timeline, QA record and file-specific rollback scope"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

const TYPE_RECORD_SET_IDS = Object.freeze([
  "RS-RUSS-POPULATIONS",
  "RS-SATHYAMURTHY-CLUSTERS",
  "RS-HAYASHI-CLUSTERS",
  "RS-HARING-FINAL-TYPES",
  "RS-ALKASLASI-INTERNEURON-CLUSTERS",
  "RS-DMRT3-DI6-M1-M6-GROUPS",
  "RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE",
]);

const EXPECTED_GROUPS = Object.freeze([
  ["M1", 84, ["Zfhx3", "Meis2", "Zfhx4"]],
  ["M2", 34, ["Irx4", "Tshz3", "Ldb2"]],
  ["M3", 33, ["Pid1", "Sst", "Slit2"]],
  ["M4", 45, ["Hoxb8", "Hoxb7", "Hoxb9"]],
  ["M5", 54, ["Sall3", "Npy", "Nxph1"]],
  ["M6", 24, ["Neurod6", "Neurod2", "Zeb2"]],
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function receipt(input, bytes) {
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function simpleReceipt(input) {
  return { path: input.path, bytes: input.bytes, sha256: input.sha256 };
}

function replaceInputReceipt(manifest, id, bytes) {
  const index = manifest.authoritativeInputs.findIndex((input) => input.id === id);
  check(index >= 0, `immutable parent is missing authoritative input ${id}`);
  manifest.authoritativeInputs[index] = receipt(manifest.authoritativeInputs[index], bytes);
  return manifest.authoritativeInputs[index];
}

function inputReceipt(manifest, id) {
  const input = manifest.authoritativeInputs.find((candidate) => candidate.id === id);
  check(input, `missing 2.36 input ${id}`);
  return simpleReceipt(input);
}

function assertText(source, snippets, label) {
  for (const snippet of snippets) check(source.includes(snippet), `${label} is missing ${snippet}`);
}

function validateDmrt3AndIntegration(contract, coverage, registry, upgrades, explorerManifest, explorerIndex, sources) {
  check(contract.releaseId === "ohri-dmrt3-di6-source-taxonomy-0.1.0", "Dmrt3/dI6 contract identity drifted");
  check(contract.source?.publication?.doi === "10.3389/fncel.2021.781197", "Dmrt3/dI6 publication DOI drifted");
  check(contract.source?.geo?.accession === "GSE185731", "Dmrt3/dI6 GEO accession drifted");
  check(contract.source?.repository?.pinnedCommit === "4096425edc4a8c008f6069e08ef4583120e550ae", "Dmrt3/dI6 repository commit drifted");
  check(contract.scope?.species === "Mus musculus" && contract.scope?.lifeStage === "embryonic day 14.5", "Dmrt3/dI6 species or stage drifted");
  check(contract.scope?.sourceEmbryoCount === 3 && contract.scope?.poolCount === 1 && contract.scope?.independentLibraryCount === 1, "Dmrt3/dI6 pooled experimental-unit frame drifted");
  check(contract.scope?.animalResolvedReplicateCount === 0, "Dmrt3/dI6 must not manufacture animal-resolved replicates");
  check(contract.scope?.depositedMouseWellCount === 384 && contract.scope?.qcRetainedCellCount === 354 && contract.scope?.di6LineageRetainedCellCount === 274, "Dmrt3/dI6 successive denominators drifted");
  check(contract.scope?.displayedProfileCount === 6 && contract.profiles?.length === 6, "Dmrt3/dI6 group denominator drifted");
  check(contract.scope?.perWellMGroupRosterBundled === false && contract.analysisLineage?.transformationAuthority?.perWellM1ToM6RosterExported === false, "Dmrt3/dI6 per-well roster boundary drifted");
  check(contract.analysisLineage?.transformationAuthority?.compactDerivativeContainsGroupSummariesOnly === true, "Dmrt3/dI6 derivative must remain group-summary only");
  check(contract.qualityControl?.reconciliationStatus === "methods_vs_executed_notebook_conflict_quarantined", "Dmrt3/dI6 Methods/notebook conflict is not quarantined");
  check(contract.quarantinedConflicts?.length === 1 && contract.quarantinedConflicts[0]?.id === "methods-vs-executed-notebook-qc-hvg", "Dmrt3/dI6 quarantine identity drifted");

  const groupCountVector = [];
  const profileIds = [];
  for (const [label, count, markers] of EXPECTED_GROUPS) {
    const profile = contract.profiles.find((candidate) => candidate.sourceLocalLabel === label);
    check(profile, `Dmrt3/dI6 ${label} profile is missing`);
    check(profile.samplingCount === count && same(profile.markerPanel, markers), `Dmrt3/dI6 ${label} count or marker panel drifted`);
    check(profile.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus" && profile.parentSourceId === "SRC-IGLESIAS-GONZALEZ-2021", `Dmrt3/dI6 ${label} namespace or parent source drifted`);
    groupCountVector.push(profile.samplingCount);
    profileIds.push(profile.id);
  }
  check(groupCountVector.reduce((sum, value) => sum + value, 0) === 274, "Dmrt3/dI6 M1-M6 counts do not sum to the retained dI6 denominator");
  check(contract.scope?.projectRegistrationCount === 0 && contract.scope?.admittedGeometryCount === 0 && contract.scope?.admittedInternalStructureCount === 0 && contract.scope?.exactCrossSourceIdentityCount === 0, "Dmrt3/dI6 zero-object boundary drifted");
  check(contract.joinPolicy?.crossSourceJoinAllowed === false && contract.joinPolicy?.morphologyTranscriptomicsJoinCount === 0 && contract.joinPolicy?.physiologyTranscriptomicsJoinCount === 0 && contract.joinPolicy?.internalStructureTranscriptomicsJoinCount === 0, "Dmrt3/dI6 cross-modal join boundary drifted");
  check(sources.get("dmrt3Di6Contract").byteLength === 22490 && sha256(sources.get("dmrt3Di6Contract")) === "e5d7b26df781033a971282b697684cf6f71daa2fe711883475723186c2d92468", "Dmrt3/dI6 compact contract receipt drifted");

  check(coverage.releaseId === "ohri-interneuron-knowledge-coverage-0.1.0" && coverage.axes?.length === 7 && coverage.lanes?.length === 7, "knowledge-coverage release, axis or lane denominator drifted");
  const coverageJudgmentCount = coverage.lanes.reduce((total, lane) => total + (lane.coverage?.length ?? 0), 0);
  check(coverageJudgmentCount === 49, "knowledge-coverage judgment denominator drifted");
  check(coverage.lanes.every((lane) => lane.coverage?.length === 7 && lane.coverage.every((entry) => typeof entry.sourceLocator === "string" && entry.sourceLocator.length > 0)), "knowledge-coverage matrix is incomplete or missing locators");
  const dmrt3Coverage = coverage.lanes.find((lane) => lane.id === "iglesias-gonzalez-2021");
  check(dmrt3Coverage?.sourceLocalLabels?.length === 6 && same(dmrt3Coverage.sourceLocalLabels, EXPECTED_GROUPS.map(([label]) => label)), "Dmrt3 knowledge-coverage lane labels drifted");
  check(/Three E14\.5 mouse embryos pooled into one tube and one library/.test(dmrt3Coverage?.sampleFrame ?? "") && /no per-well M1–M6 roster or scalar pseudotime/.test(dmrt3Coverage?.sampleFrame ?? ""), "Dmrt3 knowledge-coverage sample frame drifted");
  check(dmrt3Coverage?.projectRegistrationCount === 0 && dmrt3Coverage?.crossStudyMappingStatus === "not_established", "Dmrt3 knowledge-coverage registration or identity boundary drifted");

  const recordSets = registry.sources.flatMap((source) => source.recordSets);
  const recordSetById = new Map(recordSets.map((recordSet) => [recordSet.recordSetId, recordSet]));
  const sourceProfileCount = TYPE_RECORD_SET_IDS.reduce((total, id) => {
    const recordSet = recordSetById.get(id);
    check(recordSet, `source registry is missing ${id}`);
    return total + recordSet.includedRecordCount.value;
  }, 0);
  check(registry.sourceCount === 26 && registry.sources.length === 26, "canonical source denominator drifted");
  check(recordSets.length === 30 && new Set(recordSets.map((recordSet) => recordSet.recordSetId)).size === 30, "canonical record-set denominator drifted");
  check(sourceProfileCount === 168, "source-profile denominator drifted");
  const dmrt3Source = registry.sources.find((source) => source.id === "SRC-IGLESIAS-GONZALEZ-2021");
  const dmrt3RecordSet = recordSetById.get("RS-DMRT3-DI6-M1-M6-GROUPS");
  check(dmrt3Source?.citation?.doi === "10.3389/fncel.2021.781197" && dmrt3Source?.assets?.length === 3, "Dmrt3/dI6 canonical source or asset inventory drifted");
  check(dmrt3RecordSet?.includedRecordCount?.value === 6 && dmrt3RecordSet?.childRosterRef?.status === "not_exported_by_source", "Dmrt3/dI6 record-set granularity or roster boundary drifted");

  check(upgrades.summary?.upgradeCount === 162 && upgrades.upgrades?.length === 162 && upgrades.upgrades.at(-1)?.id === "UPG-180", "research upgrade denominator or range drifted");
  for (const id of ["UPG-177", "UPG-178", "UPG-179", "UPG-180"]) check(upgrades.upgrades.some((item) => item.id === id), `${id} is missing from the upgrade registry`);
  check(upgrades.upgrades.find((item) => item.id === "UPG-171")?.status === "completed", "UPG-171 completion drifted");
  check(upgrades.upgrades.find((item) => item.id === "UPG-174")?.status === "partially completed — exact Dmrt3 group-summary contract; per-well roster unavailable", "UPG-174 source boundary drifted");

  check(explorerManifest.schemaVersion === "1.10.0" && explorerManifest.index?.recordCount === 421, "Research Explorer release or record count drifted");
  check(explorerManifest.expectedCounts?.total === 421 && explorerManifest.expectedCounts?.byFocusKind?.molecular_profile === 168 && explorerManifest.expectedCounts?.byFocusKind?.source_lane === 7, "Research Explorer focus-kind counts drifted");
  check(explorerIndex.schemaVersion === "1.10.0" && explorerIndex.records?.length === 421, "Research Explorer search index drifted");
  const molecularRecords = explorerIndex.records.filter((record) => record.focusKind === "molecular_profile");
  const dmrt3Records = molecularRecords.filter((record) => record.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus");
  const sourceLaneRecords = explorerIndex.records.filter((record) => record.focusKind === "source_lane");
  check(molecularRecords.length === 168 && new Set(molecularRecords.map((record) => record.namespace)).size === 7, "Research Explorer molecular-profile or namespace denominator drifted");
  check(dmrt3Records.length === 6, "Research Explorer Dmrt3/dI6 record denominator drifted");
  check(sourceLaneRecords.length === 7 && sourceLaneRecords.some((record) => record.focusId === "iglesias-gonzalez-2021"), "Research Explorer Dmrt3/dI6 source-coverage lane drifted");
  for (const [label, count, markers] of EXPECTED_GROUPS) {
    const record = dmrt3Records.find((candidate) => candidate.title === label);
    check(record, `Research Explorer ${label} record is missing`);
    check(record.evidence?.some((item) => item.label === "Exact sampled-cell count" && item.value === `${count} retained cells`), `Research Explorer ${label} count drifted`);
    check(markers.every((marker) => record.searchTerms?.some((term) => term.toLowerCase() === marker.toLowerCase())), `Research Explorer ${label} marker search terms drifted`);
    check(record.coordinate?.registrationCount === 0 && record.coordinate?.geometryStatus === "TYPE_LEVEL", `Research Explorer ${label} geometry or registration boundary drifted`);
    check(record.gaps?.some((item) => item.axisId === "internal_structure" && item.inferenceAllowed === false), `Research Explorer ${label} internal-structure gap drifted`);
  }

  const packageLock = JSON.parse(sources.get("packageLock").toString("utf8"));
  const applicationPackage = JSON.parse(sources.get("applicationPackage").toString("utf8"));
  check(packageLock.version === "2.36.0-research.1" && packageLock.packages?.[""]?.version === "2.36.0-research.1", "package-lock 2.36 version drifted");
  check(applicationPackage.version === "2.36.0-research.1", "package.json 2.36 version drifted");

  assertText(sources.get("atlasFocusSynchronization").toString("utf8"), [
    "populationEvidenceTargetActive",
    "researchFocus?.focusKind === \"sci_entity\"",
    "populationEvidenceVisible",
    "disabled={!populationEvidenceTargetActive}",
    "0 same-record internal primitives",
    "data-focus-id={researchFocus?.focusId ?? \"none\"}",
  ], "Atlas focus gate");
  assertText(sources.get("internalStructureReferencePanel").toString("utf8"), [
    "Current knowledge record:",
    "same-record internal scene correctly stays empty",
    "Cross-region references remain separate scenes",
  ], "internal-structure panel");
  assertText(sources.get("researchEvidenceFingerprintComponent").toString("utf8"), [
    "research-record-fingerprint-missing",
    "data-missing-axis-count={missingAxes.length}",
    "unavailable or unlinked evidence axes · consolidated",
  ], "evidence fingerprint");
  assertText(sources.get("researchExplorerFingerprintIntegration").toString("utf8"), [
    "function resultRecordSnippet",
    "<small>{resultRecordSnippet(record)}</small>",
    "Search 421 cross-lane source records",
  ], "Research Explorer");
  assertText(sources.get("typeAtlasFingerprintIntegration").toString("utf8"), [
    "168 source profiles",
    "Iglesias González 2021",
    "Per-well M1–M6 assignments",
  ], "Type Atlas");
  assertText(sources.get("researchDataLab").toString("utf8"), ["<strong>168</strong>", "Sources · 26 canonical packages"], "Research Data Lab");
  assertText(sources.get("researchOverview").toString("utf8"), ["26 source packages · 30 record sets", "168 source profiles · 7 studies"], "Research Overview");

  return {
    recordSetCount: recordSets.length,
    sourceProfileCount,
    sourceNamespaceCount: new Set(molecularRecords.map((record) => record.namespace)).size,
    dmrt3RecordCount: dmrt3Records.length,
    coverageLaneCount: coverage.lanes.length,
    coverageJudgmentCount,
    groupCountVector,
    profileIds,
  };
}

export function serializeResearchIterationManifest236(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest236() {
  const parentBytes = await readFile(PARENT_PATH);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  check(parent.releaseId === PARENT_RECEIPT.releaseId, "immutable 2.35 parent release identity drifted");
  check(parentBytes.byteLength === PARENT_RECEIPT.bytes && sha256(parentBytes) === PARENT_RECEIPT.fileSha256, "immutable 2.35 parent file receipt drifted");
  check(parent.manifestContentSha256 === PARENT_RECEIPT.contentSha256 && computeManifestContentSha256(parent) === PARENT_RECEIPT.contentSha256, "immutable 2.35 parent content receipt drifted");

  const inheritedById = new Map(parent.authoritativeInputs.map((input) => [input.id, input]));
  const replacedPaths = REPLACED_INPUT_IDS.map((id) => {
    const input = inheritedById.get(id);
    check(input, `2.35 parent is missing ${id}`);
    const root = parent.inputRoots[input.scope];
    check(root, `2.35 parent has no root for ${input.scope}`);
    return path.resolve(PROJECT_ROOT, root.locator, input.path);
  });
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const bytes = await Promise.all([...replacedPaths, ...additionalPaths].map((inputPath) => readFile(inputPath)));
  const replacedBytes = bytes.slice(0, REPLACED_INPUT_IDS.length);
  const additionalBytes = bytes.slice(REPLACED_INPUT_IDS.length);
  const sources = new Map();
  REPLACED_INPUT_IDS.forEach((id, index) => sources.set(id, replacedBytes[index]));
  ADDITIONAL_INPUTS.forEach((input, index) => sources.set(input.id, additionalBytes[index]));

  const registry = JSON.parse(sources.get("researchSourceRegistry").toString("utf8"));
  const upgrades = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  const contract = JSON.parse(sources.get("dmrt3Di6Contract").toString("utf8"));
  const coverage = JSON.parse(sources.get("knowledgeCoverageContract").toString("utf8"));
  const explorerManifest = JSON.parse(sources.get("researchExplorerAssetManifest").toString("utf8"));
  const explorerIndex = JSON.parse(sources.get("researchExplorerSearchIndex").toString("utf8"));
  const integration = validateDmrt3AndIntegration(contract, coverage, registry, upgrades, explorerManifest, explorerIndex, sources);

  const manifest = structuredClone(parent);
  manifest.manifestSchemaVersion = "2.36.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.36.0";
  manifest.releaseDate = "2026-09-02";
  manifest.application.version = "2.36.0-research.1";
  manifest.parentIterationManifest = { ...PARENT_RECEIPT };
  manifest.baseResearchRelease.note = "Iteration 2.36 adds six exact source-local embryonic Dmrt3/dI6 M1-M6 group summaries and one matching source-coverage lane, increasing discovery to 421 records and 168 molecular profiles across seven namespaces. It exposes the pooled three-embryo, one-tube, one-library frame and successive 384-to-354-to-274 denominators; keeps the absent per-well M-group roster and Methods-versus-notebook QC/HVG discrepancy explicit; and aligns record switching with record-specific evidence cards. SCI synthetic anchors now render only for the exact selected SCI entity. Non-SCI records report zero same-record internal primitives and never inherit unrelated SCI or cross-region geometry. No geometry, registration, same-cell join, project copy or package copy is added.";

  const replacements = new Map();
  REPLACED_INPUT_IDS.forEach((id, index) => replacements.set(id, replaceInputReceipt(manifest, id, replacedBytes[index])));
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 127, "research iteration 2.36 must contain exactly 127 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 127, "2.36 authoritative input IDs are not unique");
  check(new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 127, "2.36 authoritative input paths are not unique");
  manifest.integrity.inputCount = 127;

  manifest.exactReferences.dmrt3Di6AndRecordUiIntegrity = {
    contractId: "ohri-dmrt3-di6-and-record-ui-integrity-2.36",
    sourceReleaseId: contract.releaseId,
    sourceDoi: contract.source.publication.doi,
    geoAccession: contract.source.geo.accession,
    namespace: contract.profiles[0].namespace,
    parentSourceId: contract.profiles[0].parentSourceId,
    canonicalSourceCount: registry.sourceCount,
    canonicalRecordSetCount: integration.recordSetCount,
    sourceProfileCount: integration.sourceProfileCount,
    sourceNamespaceCount: integration.sourceNamespaceCount,
    researchExplorerRecordCount: explorerManifest.index.recordCount,
    researchExplorerMolecularProfileCount: explorerManifest.expectedCounts.byFocusKind.molecular_profile,
    researchExplorerSourceLaneCount: explorerManifest.expectedCounts.byFocusKind.source_lane,
    knowledgeCoverageLaneCount: integration.coverageLaneCount,
    knowledgeCoverageAxisCount: coverage.axes.length,
    knowledgeCoverageJudgmentCount: integration.coverageJudgmentCount,
    displayedGroupCount: contract.scope.displayedProfileCount,
    groupLabels: EXPECTED_GROUPS.map(([label]) => label),
    groupCountVector: integration.groupCountVector,
    retainedGroupCountSum: integration.groupCountVector.reduce((sum, value) => sum + value, 0),
    sourceEmbryoCount: contract.scope.sourceEmbryoCount,
    poolCount: contract.scope.poolCount,
    tubeCount: 1,
    independentLibraryCount: contract.scope.independentLibraryCount,
    animalResolvedReplicateCount: contract.scope.animalResolvedReplicateCount,
    depositedMouseWellCount: contract.scope.depositedMouseWellCount,
    qcRetainedCellCount: contract.scope.qcRetainedCellCount,
    di6LineageRetainedCellCount: contract.scope.di6LineageRetainedCellCount,
    perWellMGroupRosterCount: 0,
    quarantinedConflictCount: contract.quarantinedConflicts.length,
    quarantinedConflictIds: contract.quarantinedConflicts.map((item) => item.id),
    researchUpgradeCount: upgrades.summary.upgradeCount,
    lastResearchUpgradeId: upgrades.upgrades.at(-1).id,
    admittedGeometryCount: contract.scope.admittedGeometryCount,
    admittedInternalStructureCount: contract.scope.admittedInternalStructureCount,
    registrationCount: contract.scope.projectRegistrationCount,
    sameCellCrossModalJoinCount: contract.scope.exactCrossSourceIdentityCount,
    sameRecordInternalPrimitiveCount: 0,
    projectCopyCount: 0,
    packageCopyCount: 0,
    completeContentFolderCopyCount: 0,
    contractReceipt: inputReceipt(manifest, "dmrt3Di6Contract"),
    builderReceipt: inputReceipt(manifest, "dmrt3Di6Builder"),
    schemaReceipt: inputReceipt(manifest, "dmrt3Di6Schema"),
    validatorReceipt: inputReceipt(manifest, "dmrt3Di6Validator"),
    testReceipt: inputReceipt(manifest, "dmrt3Di6Test"),
    knowledgeCoverageContractReceipt: inputReceipt(manifest, "knowledgeCoverageContract"),
    knowledgeCoverageSchemaReceipt: inputReceipt(manifest, "knowledgeCoverageSchema"),
    knowledgeCoverageValidatorReceipt: inputReceipt(manifest, "knowledgeCoverageValidator"),
    knowledgeCoverageTestReceipt: inputReceipt(manifest, "knowledgeCoverageTest"),
    manifestHashRuntimeReceipt: inputReceipt(manifest, "manifestHashRuntime"),
    researchIteration235SnapshotValidatorReceipt: inputReceipt(manifest, "researchIteration235SnapshotValidator"),
    researchIteration235SnapshotTestReceipt: inputReceipt(manifest, "researchIteration235SnapshotTest"),
    currentResearchTestRunnerReceipt: inputReceipt(manifest, "currentResearchTestRunner"),
    sourceRegistryReceipt: inputReceipt(manifest, "researchSourceRegistry"),
    upgradeRegistryReceipt: inputReceipt(manifest, "researchModelUpgradeRegistry"),
    explorerAssetManifestReceipt: inputReceipt(manifest, "researchExplorerAssetManifest"),
    explorerSearchIndexReceipt: inputReceipt(manifest, "researchExplorerSearchIndex"),
    atlasFocusGateReceipt: inputReceipt(manifest, "atlasFocusSynchronization"),
    internalReferencePanelReceipt: inputReceipt(manifest, "internalStructureReferencePanel"),
    evidenceFingerprintReceipt: inputReceipt(manifest, "researchEvidenceFingerprintComponent"),
    explorerUiReceipt: inputReceipt(manifest, "researchExplorerFingerprintIntegration"),
    typeAtlasReceipt: inputReceipt(manifest, "typeAtlasFingerprintIntegration"),
    timelineReceipt: inputReceipt(manifest, "researchTimeline236"),
    groupSummaryOnly: true,
    perWellMGroupRosterUnavailable: true,
    methodsNotebookConflictQuarantined: true,
    sciSyntheticAnchorExactFocusGate: true,
    nonSciFocusHidesSciSyntheticAnchors: true,
    exactCurrentRecordZeroInternalPrimitiveReadout: true,
    recordSwitchUpdatesEvidenceFingerprint: true,
    sameRecordInternalSceneRemainsEmptyWithoutObject: true,
    missingAxisDisclosureConsolidated: true,
    allMissingAxesRetainedInDisclosure: true,
    recordSpecificResultSnippets: true,
    immutableParentSnapshotValidationSeparatedFromLiveInputs: true,
  };
  manifest.registrySummary = {
    ...parent.registrySummary,
    canonicalSourcePackageCount: registry.sourceCount,
    canonicalRecordSetCount: integration.recordSetCount,
    sourceProfileCount: integration.sourceProfileCount,
    sourceNamespaceCount: integration.sourceNamespaceCount,
    researchExplorerRecordCount: explorerManifest.index.recordCount,
    researchUpgradeCount: upgrades.summary.upgradeCount,
    sourceRegistryReceipt: replacements.get("researchSourceRegistry"),
    upgradeRegistryReceipt: replacements.get("researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.dmrt3Di6AndRecordUiIntegrity = "Iteration 2.36 admits six source-local M1-M6 group summaries from the E14.5 Dmrt3-lineage dI6 analysis, not six adult canonical types, per-animal replicates or single-cell identities. Three embryos were pooled into one tube and one library. The 384 deposited wells, 354 QC-retained cells and 274 retained dI6-lineage cells are successive denominators; M1-M6 counts 84, 34, 33, 45, 54 and 24 sum to 274. The source does not export a per-well M-group roster or scalar pseudotime, so neither is reconstructed. The primary-article Methods and pinned executed-notebook QC/HVG workflows remain visibly quarantined, with the executed notebook serving only as this derivative's authority. Switching records changes source-specific evidence and result snippets, but cannot create geometry. SCI synthetic anchors are hidden unless the exact selected focus is an SCI entity; the exact current record reports zero same-record internal primitives when no object is admitted. Missing axes remain available in one consolidated disclosure. No morphology, internal structure, atlas transform, registration, same-cell cross-modal join, project copy, package copy or complete-content folder copy is added.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest236(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest236();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.36 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    canonicalSourceCount: built.manifest.registrySummary.canonicalSourcePackageCount,
    canonicalRecordSetCount: built.manifest.registrySummary.canonicalRecordSetCount,
    sourceProfileCount: built.manifest.registrySummary.sourceProfileCount,
    sourceNamespaceCount: built.manifest.registrySummary.sourceNamespaceCount,
    researchExplorerRecordCount: built.manifest.registrySummary.researchExplorerRecordCount,
    dmrt3GroupCount: built.manifest.exactReferences.dmrt3Di6AndRecordUiIntegrity.displayedGroupCount,
    admittedGeometryCount: built.manifest.exactReferences.dmrt3Di6AndRecordUiIntegrity.admittedGeometryCount,
    manifestContentSha256: built.manifest.manifestContentSha256,
    wrote: args.has("--write"),
    checked: args.has("--check"),
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
