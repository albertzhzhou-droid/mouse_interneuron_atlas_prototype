#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.37.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.36.json");

export const RESEARCH_ITERATION_237_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.36.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.36.0",
  bytes: 148126,
  fileSha256: "93d8a624a5a132a91f3f423cb7b3bc966ef4082f71e18e0e82c0384267588e15",
  contentSha256: "3021dd9d9ce1d515634f0d1ea575d624767972411edc923e9b75621979b0e344",
});

const ADDITIONAL_INPUTS = Object.freeze([
  ["roomeWorkbookParser", "tools/parse_roome_dil_workbooks.mjs", "Exact OOXML parser for Roome Tables S6 and S7"],
  ["roomeTaxonomyBuilder", "tools/build_roome_dil_source_taxonomy.mjs", "Deterministic compact and full Roome dIL evidence builder"],
  ["roomeTaxonomyContract", "data/roome-dil-source-taxonomy-0.1.json", "Exact 157-profile Roome dIL source-local taxonomy"],
  ["roomeDifferentialFeaturesContract", "data/roome-dil-differential-features-0.1.json", "All 15,900 Roome Table S7 differential-feature rows"],
  ["roomeTaxonomySchema", "schemas/roome-dil-source-taxonomy-0.1.schema.json", "Roome compact taxonomy JSON schema"],
  ["roomeDifferentialFeaturesSchema", "schemas/roome-dil-differential-features-0.1.schema.json", "Roome full feature-evidence JSON schema"],
  ["roomeTaxonomyValidator", "scripts/validate-roome-dil-source-taxonomy-0.1.mjs", "Roome denominator, quarantine and zero-geometry validator"],
  ["roomeTaxonomyTest", "tests/roome-dil-source-taxonomy.test.mjs", "Roome deterministic and mutation regression tests"],
  ["researchFocusWorkspaceState", "app/research-focus-workspace-state.js", "Atomic focus-to-lab-and-evidence workspace resolver"],
  ["researchFocusEvidencePanel", "app/ResearchFocusEvidencePanel.tsx", "Source-locked current-record evidence rail"],
  ["researchFocusWorkspaceTest", "tests/research-focus-workspace-state.test.mjs", "Atomic focus routing and fail-closed workspace tests"],
  ["researchIteration236SnapshotValidator", "scripts/validate-research-iteration-manifest-2.36-snapshot.mjs", "Immutable 2.36 parent snapshot validator"],
  ["researchIteration236SnapshotTest", "tests/research-iteration-manifest-2.36-snapshot.test.mjs", "Immutable 2.36 parent receipt and mutation tests"],
  ["researchTimeline237", "docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_37.md", "Unique in-place 2.37 timeline and rollback record"],
  ["researchUpgradeRegistryBuilder", "tools/build_research_upgrade_registry.mjs", "Deterministic UPG-022-through-UPG-182 registry builder"],
  ["researchUpgradeRegistryValidator", "scripts/validate-research-model-upgrade-registry-0.1.mjs", "Upgrade registry and UI reference validator"],
  ["researchUpgradeRegistryTest", "tests/research-model-upgrade-registry.test.mjs", "Upgrade registry deterministic and mutation tests"],
  ["applicationLayout", "app/layout.tsx", "Current English metadata and 2.37 application label"],
  ["observedMorphologyRuntimeContractTest", "tests/observed-morphology-runtime-contract.test.mjs", "Current-manifest import and morphology isolation regression test"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

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

function assertText(bytes, snippets, label) {
  const source = bytes.toString("utf8");
  for (const snippet of snippets) check(source.includes(snippet), `${label} is missing ${snippet}`);
}

function sourcePath(parent, input) {
  const root = parent.inputRoots?.[input.scope];
  check(root?.locator, `parent has no input root for ${input.scope}`);
  const base = path.resolve(PROJECT_ROOT, root.locator);
  const resolved = path.resolve(base, input.path);
  const relative = path.relative(base, resolved);
  check(!relative.startsWith("..") && !path.isAbsolute(relative), `${input.id} escapes its input root`);
  return resolved;
}

function getInput(manifest, id) {
  const input = manifest.authoritativeInputs.find((candidate) => candidate.id === id);
  check(input, `2.37 manifest is missing input ${id}`);
  return input;
}

function countNullGenes(rows) {
  return rows.filter((row) => row.gene === null).length;
}

function validateCurrentInputs(sources) {
  const registry = JSON.parse(sources.get("researchSourceRegistry").toString("utf8"));
  const upgrades = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  const taxonomy = JSON.parse(sources.get("roomeTaxonomyContract").toString("utf8"));
  const features = JSON.parse(sources.get("roomeDifferentialFeaturesContract").toString("utf8"));
  const coverage = JSON.parse(sources.get("knowledgeCoverageContract").toString("utf8"));
  const explorerManifest = JSON.parse(sources.get("researchExplorerAssetManifest").toString("utf8"));
  const explorerIndex = JSON.parse(sources.get("researchExplorerSearchIndex").toString("utf8"));
  const applicationPackage = JSON.parse(sources.get("applicationPackage").toString("utf8"));
  const packageLock = JSON.parse(sources.get("packageLock").toString("utf8"));

  const recordSets = registry.sources.flatMap((source) => source.recordSets ?? []);
  const exactRosters = recordSets.filter((recordSet) => recordSet.childRosterRef?.status === "bundled_exact");
  const roomeSource = registry.sources.find((source) => source.id === "SRC-ROOME-2026");
  const roomeRecordSet = recordSets.find((recordSet) => recordSet.recordSetId === "RS-ROOME-REFINED-DIL-TYPES");
  check(registry.sourceCount === 27 && registry.sources.length === 27, "canonical source count drifted");
  check(recordSets.length === 31 && new Set(recordSets.map((recordSet) => recordSet.recordSetId)).size === 31, "canonical record-set count drifted");
  check(exactRosters.length === 8, "bundled exact-roster count drifted");
  check(roomeSource?.citation?.doi === "10.1126/science.adx5781", "Roome source registry DOI drifted");
  check(roomeRecordSet?.includedRecordCount?.value === 157 && roomeRecordSet?.childRosterRef?.status === "bundled_exact", "Roome source registry roster drifted");

  check(upgrades.summary?.upgradeCount === 164 && upgrades.upgrades?.length === 164, "research upgrade count drifted");
  check(upgrades.upgrades.at(-1)?.id === "UPG-182", "last research upgrade drifted");
  check(upgrades.upgrades.find((item) => item.id === "UPG-180")?.status === "completed", "UPG-180 must be completed");
  check(upgrades.upgrades.find((item) => item.id === "UPG-181")?.status === "completed", "UPG-181 must be completed");
  check(/^planned/.test(upgrades.upgrades.find((item) => item.id === "UPG-182")?.status ?? ""), "UPG-182 must remain planned");

  check(taxonomy.releaseId === "ohri-roome-dil-source-taxonomy-0.1.0", "Roome taxonomy release identity drifted");
  check(taxonomy.source?.publication?.doi === "10.1126/science.adx5781" && taxonomy.source?.geo?.superSeries === "GSE291462", "Roome source identity drifted");
  check(taxonomy.profiles?.length === 157 && taxonomy.scope?.refinedTypeCount === 157, "Roome refined-type count drifted");
  check(new Set(taxonomy.profiles.map((profile) => profile.id)).size === 157, "Roome profile IDs are not unique");
  check(taxonomy.profiles.reduce((sum, profile) => sum + profile.frequency, 0) === 61444, "Roome profile counts do not sum to the dIL denominator");
  check(taxonomy.profiles.every((profile) => profile.displayFeatures?.length === 6), "Roome display-feature count drifted");
  check(taxonomy.familySummaries?.length === 12 && taxonomy.scope?.familyCount === 12, "Roome family count drifted");
  check(taxonomy.scope?.biologicalLitterPoolCount === 15 && taxonomy.scope?.retainedTechnicalOutputCount === 29, "Roome experimental-unit counts drifted");
  check(taxonomy.scope?.admittedGeometryCount === 0 && taxonomy.scope?.admittedInternalStructureCount === 0 && taxonomy.scope?.sameCellCrossModalJoinCount === 0 && taxonomy.scope?.projectRegistrationCount === 0, "Roome zero-object boundary drifted");
  check(taxonomy.joinPolicy?.typeToMorphologyJoin === "not_established" && taxonomy.joinPolicy?.typeToInternalStructureJoin === "not_established", "Roome cross-modal join boundary drifted");
  check(sources.get("roomeTaxonomyContract").byteLength === 631320 && sha256(sources.get("roomeTaxonomyContract")) === "dc25145e21a2f3be4faf0d65c2bd8418339a173c99ed1548564cc07c03c348e9", "Roome compact contract receipt drifted");

  check(features.releaseId === "ohri-roome-dil-differential-features-0.1.0", "Roome feature release identity drifted");
  check(features.sourceRowCount === 15900 && features.rows?.length === 15900, "Roome feature-row denominator drifted");
  check(features.retainedTextGeneRowCount === 15874 && features.quarantinedGeneCellCount === 26 && countNullGenes(features.rows) === 26, "Roome gene-cell quarantine drifted");
  check(features.sourceClusterCount === 159 && features.exactRefinedTypeCount === 157, "Roome source-label denominator drifted");
  check(sources.get("roomeDifferentialFeaturesContract").byteLength === 5072736 && sha256(sources.get("roomeDifferentialFeaturesContract")) === "5cecf178f75aa00aff1b73ad43565fb9b85b3cfa75093c6cca2ea2ae4615b6c9", "Roome full feature contract receipt drifted");

  const coverageJudgments = coverage.lanes.reduce((sum, lane) => sum + (lane.coverage?.length ?? 0), 0);
  check(coverage.axes?.length === 7 && coverage.lanes?.length === 8 && coverageJudgments === 56, "knowledge-coverage denominator drifted");
  const roomeCoverage = coverage.lanes.find((lane) => lane.id === "roome-2026");
  check(roomeCoverage?.sourceLocalLabels?.length === 12 && /157 Table S6 refined dIL labels/.test(roomeCoverage?.sourceLocalLabelScope ?? "") && roomeCoverage?.projectRegistrationCount === 0, "Roome coverage lane drifted");

  check(explorerManifest.schemaVersion === "1.11.0" && explorerManifest.index?.recordCount === 579, "Explorer manifest identity or count drifted");
  check(explorerManifest.expectedCounts?.byFocusKind?.molecular_profile === 325 && explorerManifest.expectedCounts?.byFocusKind?.source_lane === 8, "Explorer molecular or source-lane count drifted");
  check(explorerIndex.schemaVersion === "1.11.0" && explorerIndex.records?.length === 579, "Explorer index identity or count drifted");
  const molecularRecords = explorerIndex.records.filter((record) => record.focusKind === "molecular_profile");
  const roomeRecords = molecularRecords.filter((record) => record.namespace === "roome-2026:GSE291462");
  check(molecularRecords.length === 325 && new Set(molecularRecords.map((record) => record.namespace)).size === 8, "Explorer source-profile denominator drifted");
  check(roomeRecords.length === 157, "Explorer Roome record count drifted");
  check(roomeRecords.every((record) => record.coordinate?.geometryStatus === "TYPE_LEVEL" && record.coordinate?.registrationCount === 0 && record.coordinate?.measurementUse === "forbidden"), "Explorer Roome geometry boundary drifted");

  check(applicationPackage.version === "2.37.0-research.1", "package.json version drifted");
  check(packageLock.version === "2.37.0-research.1" && packageLock.packages?.[""]?.version === "2.37.0-research.1", "package-lock version drifted");

  assertText(sources.get("researchExplorerIndexRuntime"), [
    "MOLECULAR_EVIDENCE_PREVIEW_LABELS_BY_NAMESPACE",
    "cachedResearchExplorerIndexPromise",
    "Positive differential features meeting display thresholds",
  ], "Research Explorer runtime");
  assertText(sources.get("researchExplorerTest"), [
    "right-rail molecular receipts remain record-specific across all eight namespaces",
    "memoizes the verified browser index",
    "right-rail receipts collide",
  ], "Research Explorer tests");
  assertText(sources.get("researchFocusEvidencePanel"), ["Record-specific receipt", "0 admitted cell-geometry primitives", "shared dataset/project limits · consolidated"], "current-record evidence rail");
  assertText(sources.get("researchFocusWorkspaceState"), ["resolveResearchFocusWorkspaceState", "research_focus_not_found", "RESEARCH_FOCUS_PANEL"], "focus workspace state");
  assertText(sources.get("atlasFocusSynchronization"), ["resolveResearchFocusWorkspaceState", "ResearchFocusEvidencePanel", "PUBLIC-DATA RESEARCH ITERATION 2.37"], "Atlas focus integration");
  assertText(sources.get("typeAtlasFingerprintIntegration"), ["325 source profiles", "157 Roome embryonic refined dIL types", "positive differential features"], "Type Atlas integration");
  assertText(sources.get("researchDataLab"), ["<strong>325</strong>", "Sources · 27 canonical packages", "Roome&apos;s 157"], "Research Data Lab");
  assertText(sources.get("researchOverview"), ["27 source packages · 31 record sets", "325 source profiles · 8 studies"], "Research Overview");
  assertText(sources.get("applicationLayout"), ["Public-Data Research Iteration 2.37", "lang=\"en\""], "application layout");
  assertText(sources.get("observedMorphologyRuntimeContractTest"), ["current research iteration 2.37 manifest", "research-iteration-manifest-2\\.37\\.json"], "current manifest import test");

  return {
    registry,
    upgrades,
    taxonomy,
    features,
    coverage,
    explorerManifest,
    recordSetCount: recordSets.length,
    exactRosterCount: exactRosters.length,
    coverageJudgmentCount: coverageJudgments,
    sourceProfileCount: molecularRecords.length,
    sourceNamespaceCount: new Set(molecularRecords.map((record) => record.namespace)).size,
  };
}

export function serializeResearchIterationManifest237(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest237() {
  const parentBytes = await readFile(PARENT_PATH);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  check(parent.releaseId === RESEARCH_ITERATION_237_PARENT.releaseId, "immutable 2.36 parent release identity drifted");
  check(parentBytes.byteLength === RESEARCH_ITERATION_237_PARENT.bytes && sha256(parentBytes) === RESEARCH_ITERATION_237_PARENT.fileSha256, "immutable 2.36 parent file receipt drifted");
  check(parent.manifestContentSha256 === RESEARCH_ITERATION_237_PARENT.contentSha256 && computeManifestContentSha256(parent) === RESEARCH_ITERATION_237_PARENT.contentSha256, "immutable 2.36 parent content receipt drifted");

  const inheritedBytes = await Promise.all(parent.authoritativeInputs.map((input) => readFile(sourcePath(parent, input))));
  const additionalBytes = await Promise.all(ADDITIONAL_INPUTS.map((input) => readFile(path.join(PROJECT_ROOT, input.path))));
  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = parent.authoritativeInputs.map((input, index) => receipt(input, inheritedBytes[index]));
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === manifest.authoritativeInputs.length, "2.37 authoritative input IDs are not unique");
  check(new Set(manifest.authoritativeInputs.map((input) => input.path)).size === manifest.authoritativeInputs.length, "2.37 authoritative input paths are not unique");

  const sources = new Map();
  manifest.authoritativeInputs.forEach((input, index) => {
    const bytes = index < inheritedBytes.length ? inheritedBytes[index] : additionalBytes[index - inheritedBytes.length];
    sources.set(input.id, bytes);
  });
  const current = validateCurrentInputs(sources);

  manifest.manifestSchemaVersion = "2.37.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.37.0";
  manifest.releaseDate = "2026-09-02";
  manifest.application.version = "2.37.0-research.1";
  manifest.parentIterationManifest = { ...RESEARCH_ITERATION_237_PARENT };
  manifest.baseResearchRelease.note = "Iteration 2.37 adds 157 exact source-local Roome embryonic refined dIL profiles and all 15,900 Table S7 differential-feature rows, while quarantining 26 non-text gene cells. One atomic research focus now controls the canonical lab, source-locked evidence rail and exact visual target. Every multi-record molecular namespace has a distinct four-row preview, shared gaps are consolidated, and the verified Explorer index is memoized per browser session. Molecular selection clears prior morphology and admits zero geometry or internal objects. No same-cell join, registration, project copy or package copy is added.";
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;

  const inputReceipt = (id) => simpleReceipt(getInput(manifest, id));
  const familyTypeCounts = Object.fromEntries(current.taxonomy.familySummaries.map((item) => [item.family, item.refinedTypeCount]));
  manifest.exactReferences.roomeDilAndRecordWorkspaceIntegrity = {
    contractId: "ohri-roome-dil-and-record-workspace-integrity-2.37",
    sourceReleaseId: current.taxonomy.releaseId,
    differentialFeatureReleaseId: current.features.releaseId,
    sourceDoi: current.taxonomy.source.publication.doi,
    geoAccession: current.taxonomy.source.geo.superSeries,
    namespace: current.taxonomy.profiles[0].id.split(":").slice(0, 2).join(":"),
    canonicalSourceCount: current.registry.sourceCount,
    canonicalRecordSetCount: current.recordSetCount,
    bundledExactRosterCount: current.exactRosterCount,
    sourceProfileCount: current.sourceProfileCount,
    sourceNamespaceCount: current.sourceNamespaceCount,
    researchExplorerRecordCount: current.explorerManifest.index.recordCount,
    researchExplorerMolecularProfileCount: current.explorerManifest.expectedCounts.byFocusKind.molecular_profile,
    researchExplorerSourceLaneCount: current.explorerManifest.expectedCounts.byFocusKind.source_lane,
    knowledgeCoverageLaneCount: current.coverage.lanes.length,
    knowledgeCoverageAxisCount: current.coverage.axes.length,
    knowledgeCoverageJudgmentCount: current.coverageJudgmentCount,
    refinedTypeCount: current.taxonomy.scope.refinedTypeCount,
    familyCount: current.taxonomy.scope.familyCount,
    familyTypeCounts,
    refinedDilCellCount: current.taxonomy.scope.refinedDilCellCount,
    biologicalLitterPoolCount: current.taxonomy.scope.biologicalLitterPoolCount,
    retainedTechnicalOutputCount: current.taxonomy.scope.retainedTechnicalOutputCount,
    sourceFeatureRowCount: current.features.sourceRowCount,
    retainedTextGeneRowCount: current.features.retainedTextGeneRowCount,
    quarantinedGeneCellCount: current.features.quarantinedGeneCellCount,
    nonRosterDevelopmentalLabelCount: current.taxonomy.scope.nonRosterDevelopmentalLabelCount,
    positiveDisplayFeaturesPerType: 6,
    currentRecordPreviewRowCount: 4,
    multiRecordNamespacePreviewCollisionCount: 0,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    lastResearchUpgradeId: current.upgrades.upgrades.at(-1).id,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
    registrationCount: 0,
    sameCellCrossModalJoinCount: 0,
    projectCopyCount: 0,
    packageCopyCount: 0,
    completeContentFolderCopyCount: 0,
    taxonomyContractReceipt: inputReceipt("roomeTaxonomyContract"),
    differentialFeaturesContractReceipt: inputReceipt("roomeDifferentialFeaturesContract"),
    workbookParserReceipt: inputReceipt("roomeWorkbookParser"),
    taxonomyBuilderReceipt: inputReceipt("roomeTaxonomyBuilder"),
    taxonomySchemaReceipt: inputReceipt("roomeTaxonomySchema"),
    differentialFeaturesSchemaReceipt: inputReceipt("roomeDifferentialFeaturesSchema"),
    validatorReceipt: inputReceipt("roomeTaxonomyValidator"),
    testReceipt: inputReceipt("roomeTaxonomyTest"),
    focusWorkspaceStateReceipt: inputReceipt("researchFocusWorkspaceState"),
    focusEvidencePanelReceipt: inputReceipt("researchFocusEvidencePanel"),
    focusWorkspaceTestReceipt: inputReceipt("researchFocusWorkspaceTest"),
    explorerRuntimeReceipt: inputReceipt("researchExplorerIndexRuntime"),
    explorerTestReceipt: inputReceipt("researchExplorerTest"),
    sourceRegistryReceipt: inputReceipt("researchSourceRegistry"),
    upgradeRegistryReceipt: inputReceipt("researchModelUpgradeRegistry"),
    knowledgeCoverageReceipt: inputReceipt("knowledgeCoverageContract"),
    timelineReceipt: inputReceipt("researchTimeline237"),
    exactTypeRosterAdmitted: true,
    allDifferentialRowsRetained: true,
    apparentDateGeneCellsQuarantined: true,
    differentialFeaturesAreNotCanonicalMarkers: true,
    biologicalAndTechnicalReplicatesSeparated: true,
    atomicFocusWorkspaceRouting: true,
    recordSpecificPreviewCollisionGate: true,
    sharedMissingnessConsolidated: true,
    verifiedExplorerIndexMemoized: true,
    molecularFocusClearsPriorGeometry: true,
    unsupportedGeometryFailsClosed: true,
    immutableParentSnapshotValidationSeparatedFromLiveInputs: true,
  };

  manifest.registrySummary = {
    ...parent.registrySummary,
    canonicalSourcePackageCount: current.registry.sourceCount,
    canonicalRecordSetCount: current.recordSetCount,
    bundledExactRosterCount: current.exactRosterCount,
    researchUpgradeCount: current.upgrades.summary.upgradeCount,
    sourceProfileCount: current.sourceProfileCount,
    sourceNamespaceCount: current.sourceNamespaceCount,
    researchExplorerRecordCount: current.explorerManifest.index.recordCount,
    sourceRegistryReceipt: getInput(manifest, "researchSourceRegistry"),
    upgradeRegistryReceipt: getInput(manifest, "researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.roomeDilAndRecordWorkspaceIntegrity = "Iteration 2.37 admits 157 source-local embryonic refined dIL profiles and all 15,900 deposited differential-feature rows, not 157 canonical cross-study cell types or individual cells. Counts and percentages describe captured cells within this study and are not biological prevalence. Twenty-six non-text spreadsheet gene cells remain quarantined without gene-symbol repair. Six positive display features per type are navigation aids, not defining markers. Fifteen biological litter pools and 29 retained technical outputs are distinct denominators. scRNA-seq and Xenium observations are different cells; label transfer creates no same-cell identity. The source supplies no same-cell whole-cell morphology, dendrite, axon, synapse, electrophysiology, organelle, internal structure or deposited 3D transform. Molecular switching changes record-specific evidence while the 3D scene remains correctly empty. Shared gaps appear once, and zero geometry, internal objects, joins, registrations, project copies, package copies or complete-content folder copies are added.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest237(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest237();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.37 is stale; run builder with --write");
  }
  const exact = built.manifest.exactReferences.roomeDilAndRecordWorkspaceIntegrity;
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    canonicalSourceCount: built.manifest.registrySummary.canonicalSourcePackageCount,
    canonicalRecordSetCount: built.manifest.registrySummary.canonicalRecordSetCount,
    sourceProfileCount: built.manifest.registrySummary.sourceProfileCount,
    sourceNamespaceCount: built.manifest.registrySummary.sourceNamespaceCount,
    researchExplorerRecordCount: built.manifest.registrySummary.researchExplorerRecordCount,
    refinedTypeCount: exact.refinedTypeCount,
    sourceFeatureRowCount: exact.sourceFeatureRowCount,
    admittedGeometryCount: exact.admittedGeometryCount,
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
