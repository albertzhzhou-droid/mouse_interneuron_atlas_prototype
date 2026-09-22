#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.35.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.34.json");

const PARENT_RECEIPT = Object.freeze({
  path: "data/research-iteration-manifest-2.34.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.34.0",
  bytes: 125197,
  fileSha256: "76ead4e29455c8e9250f294afa4e78b6a72bb76709115d15954564545bb43d1e",
  contentSha256: "266ee889a591368d30b655ee059659485e746df424f448a85a6819d28e3e920c",
});

const REPLACED_INPUT_IDS = Object.freeze([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "researchExplorerAssetManifest",
  "researchExplorerSearchIndex",
  "researchVisualTargetResolver",
  "researchEvidenceFingerprintComponent",
  "atlasFocusSynchronization",
  "typeAtlasFingerprintIntegration",
  "researchExplorerFingerprintIntegration",
  "researchExplorerIndexRuntime",
  "atlasTypeContracts",
  "applicationPackage",
  "projectReadme",
  "researchUpgradeQueue",
  "researchDataLab",
  "researchOverview",
  "atlasStylesheet",
  "researchVisualTargetTest",
  "renderedHtmlTest",
  "micronsObservedReferenceTest",
]);

const ADDITIONAL_INPUTS = Object.freeze([
  ["crozatPkd2l1Builder", "tools/build_crozat_pkd2l1_functional_profile.mjs", "Deterministic checksum-pinned PKD2L1 functional-profile builder"],
  ["crozatPkd2l1Contract", "data/crozat-pkd2l1-functional-profile-0.1.json", "One source-local PKD2L1 functional profile with experiment-family denominators and quarantines"],
  ["crozatPkd2l1Schema", "schemas/crozat-pkd2l1-functional-profile-0.1.schema.json", "PKD2L1 functional-profile JSON schema"],
  ["crozatPkd2l1Validator", "scripts/validate-crozat-pkd2l1-functional-profile-0.1.mjs", "PKD2L1 file receipts, denominators, joins and zero-geometry validator"],
  ["crozatPkd2l1Test", "tests/crozat-pkd2l1-functional-profile.test.mjs", "PKD2L1 deterministic-build and mutation regression tests"],
  ["researchSourceRegistryValidator", "scripts/validate-research-source-registry-0.1.mjs", "Twenty-five-source, 29-record-set and 162-source-profile validator"],
  ["researchSourceRegistryTest", "tests/research-source-registry.test.mjs", "Canonical source and source-profile granularity regression tests"],
  ["researchExplorerBuilder", "tools/build_research_explorer_index.mjs", "Research Explorer 414-record deterministic index builder"],
  ["researchExplorerValidator", "scripts/validate-research-explorer-index.mjs", "Research Explorer count, receipt, evidence and zero-geometry validator"],
  ["researchExplorerTest", "tests/research-explorer-index.test.mjs", "Research Explorer Crozat record and count regression tests"],
  ["researchTimeline235", "docs/RESEARCH_TIMELINE_2026-09-01_ITERATION_2_35.md", "Unique in-place iteration 2.35 timeline and rollback scope"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

const TYPE_RECORD_SET_IDS = Object.freeze([
  "RS-RUSS-POPULATIONS",
  "RS-SATHYAMURTHY-CLUSTERS",
  "RS-HAYASHI-CLUSTERS",
  "RS-HARING-FINAL-TYPES",
  "RS-ALKASLASI-INTERNEURON-CLUSTERS",
  "RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE",
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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
  check(input, `missing 2.35 input ${id}`);
  return simpleReceipt(input);
}

function assertText(source, snippets, label) {
  for (const snippet of snippets) check(source.includes(snippet), `${label} is missing ${snippet}`);
}

function validateCrozatAndIntegration(contract, registry, upgrades, explorerManifest, explorerIndex, sources) {
  check(contract.releaseId === "ohri-crozat-pkd2l1-functional-profile-0.1.0", "Crozat contract identity drifted");
  check(contract.profile.id === "crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn", "Crozat profile identity drifted");
  check(contract.profile.namespace === "crozat-2025:figshare-29430869-v2" && contract.profile.parentSourceId === "SRC-CROZAT-2025", "Crozat namespace or parent source drifted");
  check(contract.source.figshare.articleId === 29430869 && contract.source.figshare.version === 2, "Crozat Figshare version drifted");
  check(contract.source.figshare.fileCount === 92 && contract.source.figshare.totalBytes === 1848613, "Crozat Figshare inventory denominator drifted");
  check(contract.source.figshare.license.id === "CC-BY-4.0" && contract.source.figshare.keyFiles.length === 7, "Crozat licence or key-file receipt count drifted");
  check(contract.quarantinedConflicts.length === 4 && new Set(contract.quarantinedConflicts.map((item) => item.id)).size === 4, "Crozat quarantine denominator or identity drifted");
  check(contract.derivedEvidence.firingPatternFrame.totalCellCount === 65 && contract.derivedEvidence.firingPatternFrame.tonicCount === 38 && contract.derivedEvidence.firingPatternFrame.singleSpikeCount === 27, "Crozat firing-pattern denominator drifted");
  check(contract.derivedEvidence.passivePropertyFrame.animalCount === 191 && contract.derivedEvidence.passivePropertyFrame.articleCellCount === 659 && contract.derivedEvidence.passivePropertyFrame.depositedUsableRowCount === 654, "Crozat passive-property denominator drifted");
  check(contract.derivedEvidence.restingMembranePotentialFrame.animalCount === 25 && contract.derivedEvidence.restingMembranePotentialFrame.observationCount === 125, "Crozat RMP denominator drifted");
  check(contract.scope.displayedProfileCount === 1 && contract.scope.exactCrossSourceIdentityCount === 0 && contract.scope.projectRegistrationCount === 0 && contract.scope.admittedGeometryCount === 0, "Crozat profile or zero-geometry scope drifted");
  check(contract.joinPolicy.globallyStableCellIdAvailable === false && contract.joinPolicy.crossExperimentJoinAllowed === false && contract.joinPolicy.morphologyElectrophysiologyJoinCount === 0 && contract.joinPolicy.linkToPkd2l1SbfSemStudyCount === 0, "Crozat stable-key or cross-modal join boundary drifted");
  check(contract.hardBoundaries.length === 6 && /zero 3D geometry/.test(contract.hardBoundaries.join(" ")), "Crozat hard boundary is incomplete");
  check(sources.get("crozatPkd2l1Contract").byteLength === 20460 && sha256(sources.get("crozatPkd2l1Contract")) === "ca022532c23f5d9967fce7efcbd5bde57b1d4f59516cb10764dd1b422dd8ed64", "Crozat contract receipt drifted");

  const recordSets = registry.sources.flatMap((source) => source.recordSets);
  const recordSetById = new Map(recordSets.map((recordSet) => [recordSet.recordSetId, recordSet]));
  const sourceProfileCount = TYPE_RECORD_SET_IDS.reduce((total, id) => total + recordSetById.get(id).includedRecordCount.value, 0);
  check(registry.sourceCount === 25 && registry.sources.length === 25, "canonical source denominator drifted");
  check(recordSets.length === 29 && new Set(recordSets.map((recordSet) => recordSet.recordSetId)).size === 29, "canonical record-set denominator drifted");
  check(sourceProfileCount === 162, "source-profile denominator drifted");
  const crozatSource = registry.sources.find((source) => source.id === "SRC-CROZAT-2025");
  const crozatRecordSet = recordSetById.get("RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE");
  check(crozatSource?.citation.doi === "10.1038/s42003-025-08559-x" && crozatSource?.rights.status === "CC-BY-4.0", "Crozat canonical source or rights receipt drifted");
  check(crozatRecordSet?.includedRecordCount.value === 1 && crozatRecordSet?.childRosterRef.status === "none_reported", "Crozat record granularity or roster boundary drifted");

  check(upgrades.summary.upgradeCount === 158 && upgrades.upgrades.length === 158 && upgrades.upgrades.at(-1)?.id === "UPG-176", "research upgrade denominator or range drifted");
  check(upgrades.upgrades.find((item) => item.id === "UPG-172")?.status === "completed", "UPG-172 is not complete");

  check(explorerManifest.schemaVersion === "1.9.0" && explorerManifest.index.recordCount === 414, "Research Explorer release or record count drifted");
  check(explorerManifest.expectedCounts.total === 414 && explorerManifest.expectedCounts.byFocusKind.molecular_profile === 162, "Research Explorer focus-kind counts drifted");
  check(explorerIndex.schemaVersion === "1.9.0" && explorerIndex.records.length === 414, "Research Explorer search index drifted");
  const molecularRecords = explorerIndex.records.filter((record) => record.focusKind === "molecular_profile");
  check(molecularRecords.length === 162, "Research Explorer molecular-profile denominator drifted");
  check(molecularRecords.every((record) => record.evidence.filter((item) => item.label === "Canonical transmitter").length === 1), "Research Explorer canonical transmitter coverage drifted");
  check(molecularRecords.every((record) => record.gaps.filter((item) => item.axisId === "internal_structure" && item.label === "Internal structure" && item.inferenceAllowed === false).length === 1), "Research Explorer internal-structure gap coverage drifted");
  const hayashiRecords = molecularRecords.filter((record) => record.namespace === "hayashi-2018:GSE108788");
  check(hayashiRecords.length === 11 && hayashiRecords.every((record) => record.evidence.find((item) => item.label === "Canonical transmitter")?.value === "Excitatory"), "Research Explorer Hayashi transmitter reconciliation drifted");
  const crozatExplorerRecord = explorerIndex.records.find((record) => record.focusId === contract.profile.id);
  check(crozatExplorerRecord?.focusKind === "molecular_profile" && crozatExplorerRecord?.coordinate.geometryStatus === "TYPE_LEVEL" && crozatExplorerRecord?.coordinate.registrationCount === 0, "Crozat Explorer geometry or registration boundary drifted");
  check(crozatExplorerRecord?.evidence.some((item) => item.label === "Electrophysiology evidence") && crozatExplorerRecord?.evidence.some((item) => item.label === "Quarantined source conflicts"), "Crozat Explorer observed evidence or quarantine is missing");
  check(/thoracic: 51 FOV \/ 1,167 cells/.test(crozatExplorerRecord?.evidence.find((item) => item.label === "Anatomy FOV and cell totals")?.value ?? ""), "Crozat Explorer field-of-view denominator drifted");
  check(crozatExplorerRecord?.gaps.some((item) => item.axisId === "single_cell_morphology" && item.inferenceAllowed === false), "Crozat Explorer missing-morphology gate drifted");

  assertText(sources.get("typeAtlasFingerprintIntegration").toString("utf8"), ["162 source profiles", "Crozat evidence gate", "4 quarantined source conflicts"], "Type Atlas");
  assertText(sources.get("researchExplorerFingerprintIntegration").toString("utf8"), ["Source profile", "Search 414 cross-lane source records", "Observed at cohort / experiment-family level"], "Research Explorer");
  assertText(sources.get("researchExplorerFingerprintIntegration").toString("utf8"), ["Multiple experiment-specific N/n", "Projection target", "Synaptic / circuit connectivity", "Cross-source same-cell link", "Raw electrophysiology traces", "includeSelectedResearchGroup", "additional / source-wide evidence rows · collapsed", "collapsed only to reduce repeated card content"], "Research Explorer reconciliation");
  assertText(sources.get("researchEvidenceFingerprintComponent").toString("utf8"), ["Source-profile evidence"], "evidence fingerprint");
  assertText(sources.get("researchVisualTargetResolver").toString("utf8"), ["function nonCellView", "internal_reference", "microns_observed_reference", "nextView: nonCellView(currentView)"], "visual-target resolver");
  assertText(sources.get("rightsLedger").toString("utf8"), ["Crozat et al. PKD2L1 Figshare source tables", "CC BY 4.0", "source files are attribution-licensed but not bundled"], "rights ledger");
  assertText(sources.get("atlasFocusSynchronization").toString("utf8"), ["source-record fingerprint and evidence delta updated", "No admitted main-scene morphology is bound", "Current research focus", "0 admitted main-scene geometry", "prior geometry cleared"], "atlas focus synchronization");
  assertText(sources.get("researchDataLab").toString("utf8"), ["<strong>162</strong>", "Sources · 25 canonical packages"], "Research Data Lab");
  assertText(sources.get("researchOverview").toString("utf8"), ["25 source packages · 29 record sets", "162 source profiles · 6 studies"], "Research Overview");

  return {
    recordSetCount: recordSets.length,
    sourceProfileCount,
    crozatExplorerRecord,
    canonicalTransmitterProfileCount: molecularRecords.length,
    internalStructureGapProfileCount: molecularRecords.length,
  };
}

export function serializeResearchIterationManifest235(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest235() {
  const parentBytes = await readFile(PARENT_PATH);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  check(parent.releaseId === PARENT_RECEIPT.releaseId, "immutable 2.34 parent release identity drifted");
  check(parentBytes.byteLength === PARENT_RECEIPT.bytes && sha256(parentBytes) === PARENT_RECEIPT.fileSha256, "immutable 2.34 parent file receipt drifted");
  check(parent.manifestContentSha256 === PARENT_RECEIPT.contentSha256 && computeManifestContentSha256(parent) === PARENT_RECEIPT.contentSha256, "immutable 2.34 parent content receipt drifted");

  const inheritedById = new Map(parent.authoritativeInputs.map((input) => [input.id, input]));
  const replacedPaths = REPLACED_INPUT_IDS.map((id) => {
    const input = inheritedById.get(id);
    check(input, `2.34 parent is missing ${id}`);
    const root = parent.inputRoots[input.scope];
    check(root, `2.34 parent has no root for ${input.scope}`);
    return path.resolve(PROJECT_ROOT, root.locator, input.path);
  });
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const bytes = await Promise.all([...replacedPaths, ...additionalPaths].map((inputPath) => readFile(inputPath)));
  const replacedBytes = bytes.slice(0, REPLACED_INPUT_IDS.length);
  const additionalBytes = bytes.slice(REPLACED_INPUT_IDS.length);
  const sources = new Map();
  REPLACED_INPUT_IDS.forEach((id, index) => sources.set(id, replacedBytes[index]));
  ADDITIONAL_INPUTS.forEach((input, index) => sources.set(input.id, additionalBytes[index]));

  const packageLock = JSON.parse(sources.get("packageLock").toString("utf8"));
  const applicationPackage = JSON.parse(sources.get("applicationPackage").toString("utf8"));
  const registry = JSON.parse(sources.get("researchSourceRegistry").toString("utf8"));
  const upgrades = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  const contract = JSON.parse(sources.get("crozatPkd2l1Contract").toString("utf8"));
  const explorerManifest = JSON.parse(sources.get("researchExplorerAssetManifest").toString("utf8"));
  const explorerIndex = JSON.parse(sources.get("researchExplorerSearchIndex").toString("utf8"));
  check(packageLock.version === "2.35.0-research.1" && packageLock.packages?.[""]?.version === "2.35.0-research.1", "package-lock 2.35 version drifted");
  check(applicationPackage.version === "2.35.0-research.1", "package.json 2.35 version drifted");
  const integration = validateCrozatAndIntegration(contract, registry, upgrades, explorerManifest, explorerIndex, sources);

  const manifest = structuredClone(parent);
  manifest.manifestSchemaVersion = "2.35.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.35.0";
  manifest.releaseDate = "2026-09-01";
  manifest.application.version = "2.35.0-research.1";
  manifest.parentIterationManifest = { ...PARENT_RECEIPT };
  manifest.baseResearchRelease.note = "Iteration 2.35 reconciles the type and Explorer UI with one exact public Crozat PKD2L1 functional profile. It pins the Figshare version-2 inventory and seven key-file receipts, retains experiment-family N/n values, exposes four source conflicts as quarantines, expands the source registry to 25 canonical sources and 29 record sets, and expands discovery to 414 records including 162 source profiles across six namespaces. It admits no Crozat geometry, raw trace, atlas registration, whole-deposit per-cell join, same-cell cross-modal link, internal structure, project copy or package copy.";

  const replacements = new Map();
  REPLACED_INPUT_IDS.forEach((id, index) => replacements.set(id, replaceInputReceipt(manifest, id, replacedBytes[index])));
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 113, "research iteration 2.35 must contain exactly 113 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 113, "2.35 authoritative input IDs are not unique");
  check(new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 113, "2.35 authoritative input paths are not unique");
  manifest.integrity.inputCount = 113;

  manifest.exactReferences.crozatPkd2l1FunctionalProfileIntegrity = {
    contractId: "ohri-crozat-pkd2l1-functional-profile-integrity-2.35",
    profileId: contract.profile.id,
    namespace: contract.profile.namespace,
    parentSourceId: contract.profile.parentSourceId,
    canonicalSourceCount: registry.sourceCount,
    canonicalRecordSetCount: integration.recordSetCount,
    sourceProfileCount: integration.sourceProfileCount,
    sourceNamespaceCount: 6,
    researchExplorerRecordCount: explorerManifest.index.recordCount,
    researchExplorerMolecularProfileCount: explorerManifest.expectedCounts.byFocusKind.molecular_profile,
    figshareArticleId: contract.source.figshare.articleId,
    figshareVersion: contract.source.figshare.version,
    figshareFileCount: contract.source.figshare.fileCount,
    figshareTotalBytes: contract.source.figshare.totalBytes,
    figshareLicenseId: contract.source.figshare.license.id,
    keyFileReceiptCount: contract.source.figshare.keyFiles.length,
    quarantinedConflictCount: contract.quarantinedConflicts.length,
    quarantinedConflictIds: contract.quarantinedConflicts.map((item) => item.id),
    firingPatternCellCount: contract.derivedEvidence.firingPatternFrame.totalCellCount,
    tonicCount: contract.derivedEvidence.firingPatternFrame.tonicCount,
    singleSpikeCount: contract.derivedEvidence.firingPatternFrame.singleSpikeCount,
    passiveArticleAnimalCount: contract.derivedEvidence.passivePropertyFrame.animalCount,
    passiveArticleCellCount: contract.derivedEvidence.passivePropertyFrame.articleCellCount,
    passiveDepositedRowCount: contract.derivedEvidence.passivePropertyFrame.depositedUsableRowCount,
    rmpAnimalCount: contract.derivedEvidence.restingMembranePotentialFrame.animalCount,
    rmpObservationCount: contract.derivedEvidence.restingMembranePotentialFrame.observationCount,
    displayedProfileCount: contract.scope.displayedProfileCount,
    globalStableCellRosterCount: 0,
    rawElectrophysiologyTraceCount: 0,
    rawMicroscopyObjectCount: 0,
    admittedGeometryCount: contract.scope.admittedGeometryCount,
    atlasTransformCount: 0,
    registrationCount: contract.scope.projectRegistrationCount,
    sameCellCrossModalJoinCount: contract.joinPolicy.morphologyElectrophysiologyJoinCount,
    linkToSeparatePkd2l1SbfSemStudyCount: contract.joinPolicy.linkToPkd2l1SbfSemStudyCount,
    sameSpecimenInternalStructureCount: 0,
    projectCopyCount: 0,
    packageCopyCount: 0,
    contractReceipt: inputReceipt(manifest, "crozatPkd2l1Contract"),
    builderReceipt: inputReceipt(manifest, "crozatPkd2l1Builder"),
    schemaReceipt: inputReceipt(manifest, "crozatPkd2l1Schema"),
    validatorReceipt: inputReceipt(manifest, "crozatPkd2l1Validator"),
    testReceipt: inputReceipt(manifest, "crozatPkd2l1Test"),
    rightsLedgerReceipt: inputReceipt(manifest, "rightsLedger"),
    sourceRegistryReceipt: inputReceipt(manifest, "researchSourceRegistry"),
    explorerAssetManifestReceipt: inputReceipt(manifest, "researchExplorerAssetManifest"),
    explorerSearchIndexReceipt: inputReceipt(manifest, "researchExplorerSearchIndex"),
    focusResolverReceipt: inputReceipt(manifest, "researchVisualTargetResolver"),
    explorerRuntimeReceipt: inputReceipt(manifest, "researchExplorerIndexRuntime"),
    typeAtlasReceipt: inputReceipt(manifest, "typeAtlasFingerprintIntegration"),
    evidenceFingerprintReceipt: inputReceipt(manifest, "researchEvidenceFingerprintComponent"),
    observedElectrophysiologyAxis: true,
    sourceConflictQuarantineRequired: true,
    staleGeometryClearedForMissingRecordGeometry: true,
    specializedViewsExitOnNonMorphologyFocus: true,
    exactFocusZeroGeometryReadout: true,
    canonicalTransmitterProfileCount: integration.canonicalTransmitterProfileCount,
    internalStructureGapProfileCount: integration.internalStructureGapProfileCount,
    selectedGroupForcedVisible: true,
    sourceWideEvidenceCollapseDisplayOnly: true,
    expandedMissingnessFingerprintAxes: true,
  };
  manifest.registrySummary = {
    ...parent.registrySummary,
    canonicalSourcePackageCount: registry.sourceCount,
    canonicalRecordSetCount: integration.recordSetCount,
    sourceProfileCount: integration.sourceProfileCount,
    sourceNamespaceCount: 6,
    researchExplorerRecordCount: explorerManifest.index.recordCount,
    researchUpgradeCount: upgrades.summary.upgradeCount,
    sourceRegistryReceipt: replacements.get("researchSourceRegistry"),
    upgradeRegistryReceipt: replacements.get("researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.crozatPkd2l1FunctionalProfileIntegrity = "Iteration 2.35 creates one source-local PKD2L1-positive CSF-contacting-neuron functional profile, not tonic, single-spike, segment or quadrant cell types. Anatomy, firing-pattern, passive-property and RMP rows retain their own experiment-family denominators and are not summed or globally joined. Four source conflicts remain quarantined. The Figshare release supplies no stable global cell ID, raw ABF trace, raw microscopy, SWC, reconstructable morphology, atlas transform, segmentation, mesh or same-cell link to the separate PKD2L1 SBF-SEM publication. Missing cell geometry and internal detail remain unavailable rather than borrowed, averaged, procedurally generated or inferred from population evidence.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest235(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest235();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.35 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    canonicalSourceCount: built.manifest.registrySummary.canonicalSourcePackageCount,
    canonicalRecordSetCount: built.manifest.registrySummary.canonicalRecordSetCount,
    sourceProfileCount: built.manifest.registrySummary.sourceProfileCount,
    researchExplorerRecordCount: built.manifest.registrySummary.researchExplorerRecordCount,
    quarantinedConflictCount: built.manifest.exactReferences.crozatPkd2l1FunctionalProfileIntegrity.quarantinedConflictCount,
    admittedGeometryCount: built.manifest.exactReferences.crozatPkd2l1FunctionalProfileIntegrity.admittedGeometryCount,
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
