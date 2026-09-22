#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { resolveResearchVisualTarget } from "../app/research-visual-target.js";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.31.json");
const BASE_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.30.json");
const SOURCE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");
const RIGHTS_LEDGER_PATH = path.join(PROJECT_ROOT, "docs/RIGHTS_LEDGER.csv");
const PACKAGE_LOCK_PATH = path.join(PROJECT_ROOT, "package-lock.json");

const BASE_RELEASE_ID = "ohri-mouse-interneuron-research-iteration-2.30.0";
const BASE_CONTENT_SHA256 = "c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f";
const BASE_FILE_BYTES = 81964;
const BASE_FILE_SHA256 = "c8796b7732d2f36998976698f1991f5d70e95fae96b33c20301d4b21d80e5858";

const EXPECTED_BY_FOCUS_KIND = Object.freeze({
  anatomy_label: 73,
  molecular_profile: 161,
  morphology_record: 149,
  sci_entity: 7,
  sci_population: 17,
  source_lane: 6,
});
const ADMITTED_MAIN_SCENE_NEURON_IDS = Object.freeze([
  45674, 45718, 50394, 50408, 50424, 104003, 108974,
  109005, 109021, 170035, 242822, 249676, 260150,
]);
const SOURCE_DIAMETER_NEURON_IDS = Object.freeze([
  45674, 45718, 50394, 50408, 50424, 104003, 108974, 109005, 109021,
]);
const REQUIRED_GAP_FIELDS = Object.freeze([
  "axisId",
  "status",
  "reasonCode",
  "scope",
  "authority",
  "sourceLocator",
  "rawValue",
  "detail",
  "inferenceAllowed",
]);
const EXPECTED_REASON_CODES = Object.freeze([
  "source_not_reported",
  "source_schema_no_field",
  "repository_object_unavailable",
  "not_measured_by_study",
  "not_ingested",
  "relationship_not_established",
  "no_admitted_transform",
  "qc_quarantined",
  "rights_not_cleared",
  "unresolved_source_conflict",
  "not_applicable",
]);
const EXPECTED_GAP_SCOPES = Object.freeze([
  "record_specific",
  "shared_dataset_limit",
  "shared_project_limit",
]);

const ADDITIONAL_INPUTS = Object.freeze([
  Object.freeze({
    id: "researchExplorerAssetManifest",
    scope: "project",
    path: "public/data/research_explorer_index_v1/asset-manifest.json",
    purpose: "Research Explorer 1.8.0 source-file roster and exact search-index receipt",
    bytes: 4290,
    sha256: "8753a0d579f0b3b0b47227d5d43bce230d5f1338f730a9204626ef77e33a8b33",
  }),
  Object.freeze({
    id: "researchExplorerSearchIndex",
    scope: "project",
    path: "public/data/research_explorer_index_v1/search-index.json",
    purpose: "Full 413-record Research Explorer 1.8.0 discovery index",
    bytes: 5293046,
    sha256: "5954c2911a196fc14dc033142f3a028c3cc612f5dbce8514e2b8316f42510c54",
  }),
  Object.freeze({
    id: "researchVisualTargetResolver",
    scope: "project",
    path: "app/research-visual-target.js",
    purpose: "Fail-closed research-focus to exact visual-target resolver",
    bytes: 4588,
    sha256: "21d20d86a7c687098f8f909c8b4b9b7737267163a9e4e84aacf15b74b48930a3",
  }),
  Object.freeze({
    id: "morphologyRecordDisclosureComponent",
    scope: "project",
    path: "app/MorphologyRecordDisclosure.tsx",
    purpose: "Record-specific source, preparation, integrity and geometry-receipt disclosure card",
    bytes: 4846,
    sha256: "87e0e8f1c041feb1ab77aa681e0428daa2c757ff7872c79ee576700540b5e789",
  }),
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
  return {
    id: input.id,
    scope: input.scope,
    path: input.path,
    purpose: input.purpose,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  };
}

function simpleReceipt(input, bytes) {
  return { path: input.path, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function replaceInputReceipt(manifest, id, bytes) {
  const index = manifest.authoritativeInputs.findIndex((input) => input.id === id);
  check(index >= 0, `missing inherited authoritative input ${id}`);
  const inherited = manifest.authoritativeInputs[index];
  manifest.authoritativeInputs[index] = receipt(inherited, bytes);
  return manifest.authoritativeInputs[index];
}

function countRecordSets(registry) {
  return registry.sources.reduce((total, source) => total + source.recordSets.length, 0);
}

function countBundledExactRosters(registry) {
  return registry.sources
    .flatMap((source) => source.recordSets)
    .filter((recordSet) => recordSet.childRosterRef.status === "bundled_exact").length;
}

async function checkSourceFileReceipts(assetManifest) {
  check(assetManifest.sourceFiles.length === 16, "Research Explorer source-file denominator drifted");
  check(new Set(assetManifest.sourceFiles.map((source) => source.name)).size === 16, "Research Explorer source-file names are not unique");
  check(new Set(assetManifest.sourceFiles.map((source) => source.path)).size === 16, "Research Explorer source-file paths are not unique");
  await Promise.all(assetManifest.sourceFiles.map(async (source) => {
    check(!path.isAbsolute(source.path), `${source.name} source-file path must be project-relative`);
    const resolved = path.resolve(PROJECT_ROOT, source.path);
    const relative = path.relative(PROJECT_ROOT, resolved);
    check(!relative.startsWith("..") && !path.isAbsolute(relative), `${source.name} source-file path escapes project root`);
    const bytes = await readFile(resolved);
    check(bytes.byteLength === source.bytes && sha256(bytes) === source.sha256, `${source.name} source-file receipt drifted`);
  }));
}

function checkGap(gap, reasonCodes, recordKey) {
  for (const field of REQUIRED_GAP_FIELDS) {
    check(Object.hasOwn(gap, field), `${recordKey} gap ${gap.axisId ?? "<unknown>"} is missing ${field}`);
  }
  for (const field of ["axisId", "status", "reasonCode", "scope", "authority", "sourceLocator", "detail"]) {
    check(typeof gap[field] === "string" && gap[field].length > 0, `${recordKey} gap ${gap.axisId ?? "<unknown>"} has invalid ${field}`);
  }
  check(reasonCodes.has(gap.reasonCode), `${recordKey} gap ${gap.axisId} uses uncontrolled reasonCode ${gap.reasonCode}`);
  check(EXPECTED_GAP_SCOPES.includes(gap.scope), `${recordKey} gap ${gap.axisId} uses uncontrolled scope ${gap.scope}`);
  check(gap.inferenceAllowed === false, `${recordKey} gap ${gap.axisId} permits inference`);
}

function checkExplorerIndex(assetManifest, index) {
  check(assetManifest.schemaVersion === "1.8.0" && index.schemaVersion === "1.8.0", "Research Explorer schema version drifted");
  check(assetManifest.assetSetId === "ohri:research-explorer-index:1.8.0" && index.assetSetId === assetManifest.assetSetId, "Research Explorer asset-set identity drifted");
  check(assetManifest.releaseDate === "2026-08-31" && index.releaseDate === "2026-08-31", "Research Explorer release date drifted");
  check(assetManifest.index.path === "search-index.json" && assetManifest.index.recordCount === 413, "Research Explorer manifest index identity drifted");
  check(assetManifest.expectedCounts.total === 413 && same(assetManifest.expectedCounts.byFocusKind, EXPECTED_BY_FOCUS_KIND), "Research Explorer manifest counts drifted");
  check(index.records.length === 413 && index.counts.total === 413 && same(index.counts.byFocusKind, EXPECTED_BY_FOCUS_KIND), "Research Explorer index counts drifted");
  check(new Set(index.records.map((record) => record.key)).size === 413, "Research Explorer record keys are not unique");
  check(new Set(index.records.map((record) => `${record.focusKind}:${record.focusId}`)).size === 413, "Research Explorer focus identities are not unique");

  const membership = index.scientificPolicy.morphologyMembership;
  check(membership.frozenCensusRecordCount === 142 && membership.supplementaryRecordCount === 7 && membership.viewableMorphologyRecordCount === 149 && membership.supplementaryIsCensus === false, "Research Explorer morphology membership drifted");
  const morphology = index.records.filter((record) => record.focusKind === "morphology_record");
  const census = morphology.filter((record) => record.morphologyMembership?.collection === "census");
  const supplementary = morphology.filter((record) => record.morphologyMembership?.collection === "supplementary");
  check(morphology.length === 149 && census.length === 142 && supplementary.length === 7, "Research Explorer 142 + 7 morphology denominator drifted");
  check(census.every((record) => record.morphologyMembership.censusContribution === 1 && record.morphologyMembership.supplementaryContribution === 0), "a census morphology has invalid membership contributions");
  check(supplementary.every((record) => record.morphologyMembership.censusContribution === 0 && record.morphologyMembership.supplementaryContribution === 1), "a supplementary morphology rewrites the frozen census");
  check(index.records.filter((record) => record.focusKind !== "morphology_record").every((record) => !Object.hasOwn(record, "morphologyMembership")), "a non-morphology record carries morphology membership");

  const missingness = index.scientificPolicy.missingnessContract;
  check(missingness.schemaVersion === "1.0.0" && missingness.inferenceAllowed === false, "Research Explorer missingness policy drifted");
  check(same(missingness.reasonCodes, EXPECTED_REASON_CODES) && same(missingness.sharedScopes, EXPECTED_GAP_SCOPES.slice(1)), "Research Explorer missingness vocabulary drifted");
  const reasonCodes = new Set(missingness.reasonCodes);
  let gapCount = 0;
  let recordsWithGapCount = 0;
  for (const record of index.records) {
    check(Array.isArray(record.gaps), `${record.key} has no structured gaps array`);
    if (record.gaps.length > 0) recordsWithGapCount += 1;
    for (const gap of record.gaps) {
      gapCount += 1;
      checkGap(gap, reasonCodes, record.key);
    }
    check(record.relationshipStatus === "not_established_outside_this_source_record", `${record.key} creates a cross-source relationship`);
    check(record.coordinate?.registrationCount === 0, `${record.key} creates a registration`);
  }
  check(gapCount === 3634 && recordsWithGapCount === 413, "Research Explorer structured-gap denominator drifted");
  check(index.scientificPolicy.crossSourceIdentityDefault === "not_established" && index.scientificPolicy.searchCreatesRelationship === false && index.scientificPolicy.registrationCount === 0 && index.scientificPolicy.missingIsBiologicalAbsence === false && index.scientificPolicy.recordDenominatorsAreHarmonized === false, "Research Explorer scientific policy admits an unsupported relationship or denominator claim");

  const dispositions = {
    exact_main_scene_morphology: 0,
    source_specific_viewer_only: 0,
    cleared: 0,
  };
  let fallbackGeometryCount = 0;
  let substituteGeometryCount = 0;
  const exactNeuronIds = [];
  for (const record of index.records) {
    const target = resolveResearchVisualTarget({
      focus: record,
      admittedMainSceneNeuronIds: ADMITTED_MAIN_SCENE_NEURON_IDS,
      sourceDiameterNeuronIds: SOURCE_DIAMETER_NEURON_IDS,
      requestedFidelityMode: "radius_surface",
      currentView: "cell_detail",
    });
    check(Object.hasOwn(dispositions, target.status), `${record.key} resolved to unexpected visual status ${target.status}`);
    dispositions[target.status] += 1;
    if (target.status === "exact_main_scene_morphology") {
      const requestedNeuronId = Number(record.focusId.replace("NeuroMorpho:", ""));
      exactNeuronIds.push(target.neuronId);
      if (target.neuronId !== requestedNeuronId) substituteGeometryCount += 1;
      check(target.showObservedCellForm === true && target.nextView === "cell_detail" && target.focusBinding?.focusId === record.focusId, `${record.key} exact target is not atomically bound`);
    } else {
      if (target.neuronId !== null || target.showObservedCellForm !== false) fallbackGeometryCount += 1;
      check(target.nextView !== "cell_detail", `${record.key} retains cell-detail view without an admitted main-scene target`);
      if (target.status === "source_specific_viewer_only") {
        check(target.sourceSpecificViewer?.focusId === record.focusId, `${record.key} viewer-only target lost its exact source focus`);
      }
    }
  }
  exactNeuronIds.sort((left, right) => left - right);
  check(same(exactNeuronIds, ADMITTED_MAIN_SCENE_NEURON_IDS), "admitted main-scene morphology roster drifted");
  check(dispositions.exact_main_scene_morphology === 13 && dispositions.source_specific_viewer_only === 136 && dispositions.cleared === 264, "research visual-target disposition counts drifted");
  check(fallbackGeometryCount === 0 && substituteGeometryCount === 0, "research visual-target resolver admits fallback or substitute geometry");

  return { gapCount, recordsWithGapCount, dispositions, fallbackGeometryCount, substituteGeometryCount };
}

export function serializeResearchIterationManifest231(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest231() {
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const [
    baseBytes,
    assetManifestBytes,
    searchIndexBytes,
    visualTargetBytes,
    recordDisclosureBytes,
    sourceRegistryBytes,
    upgradeRegistryBytes,
    rightsLedgerBytes,
    packageLockBytes,
  ] = await Promise.all([
    readFile(BASE_PATH),
    ...additionalPaths.map((inputPath) => readFile(inputPath)),
    readFile(SOURCE_REGISTRY_PATH),
    readFile(UPGRADE_REGISTRY_PATH),
    readFile(RIGHTS_LEDGER_PATH),
    readFile(PACKAGE_LOCK_PATH),
  ]);
  const additionalBytes = [assetManifestBytes, searchIndexBytes, visualTargetBytes, recordDisclosureBytes];
  const base = JSON.parse(baseBytes.toString("utf8"));
  const assetManifest = JSON.parse(assetManifestBytes.toString("utf8"));
  const index = JSON.parse(searchIndexBytes.toString("utf8"));
  const sourceRegistry = JSON.parse(sourceRegistryBytes.toString("utf8"));
  const upgradeRegistry = JSON.parse(upgradeRegistryBytes.toString("utf8"));
  const packageLock = JSON.parse(packageLockBytes.toString("utf8"));

  check(base.releaseId === BASE_RELEASE_ID, "immutable 2.30 parent release identity drifted");
  check(baseBytes.byteLength === BASE_FILE_BYTES && sha256(baseBytes) === BASE_FILE_SHA256, "immutable 2.30 parent file receipt drifted");
  check(base.manifestContentSha256 === BASE_CONTENT_SHA256 && computeManifestContentSha256(base) === BASE_CONTENT_SHA256, "immutable 2.30 parent content receipt drifted");
  for (let indexValue = 0; indexValue < ADDITIONAL_INPUTS.length; indexValue += 1) {
    const expected = ADDITIONAL_INPUTS[indexValue];
    const bytes = additionalBytes[indexValue];
    check(bytes.byteLength === expected.bytes && sha256(bytes) === expected.sha256, `${expected.id} receipt drifted`);
  }
  check(assetManifest.index.bytes === searchIndexBytes.byteLength && assetManifest.index.sha256 === sha256(searchIndexBytes), "Research Explorer asset manifest does not pin the full index bytes");
  await checkSourceFileReceipts(assetManifest);
  const explorer = checkExplorerIndex(assetManifest, index);
  const recordDisclosureSource = recordDisclosureBytes.toString("utf8");
  for (const requiredText of ["Record-specific source disclosure", "Protocol (source field)", "Source-coordinate extent", "reportedRaw", "correctedRaw", "Integrity (verbatim)", "Standardized geometry SHA-256", "Raw SWC SHA-256"]) {
    check(recordDisclosureSource.includes(requiredText), `morphology record disclosure is missing ${requiredText}`);
  }
  check(!recordDisclosureSource.includes(".slice(0, 8)"), "morphology record disclosure silently truncates its record metrics");
  check(sourceRegistry.sourceCount === 24 && sourceRegistry.sources.length === 24 && countRecordSets(sourceRegistry) === 28 && countBundledExactRosters(sourceRegistry) === 7, "source-registry denominators drifted");
  check(upgradeRegistry.summary.upgradeCount === 144 && upgradeRegistry.upgrades.length === 144 && upgradeRegistry.upgrades[0]?.id === "UPG-022" && upgradeRegistry.upgrades.at(-1)?.id === "UPG-162", "upgrade-registry denominator or range drifted");
  check(packageLock.version === "2.31.0-research.1" && packageLock.packages?.[""]?.version === "2.31.0-research.1", "package-lock application version drifted");

  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.31.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.31.0";
  manifest.releaseDate = "2026-08-31";
  manifest.application.version = "2.31.0-research.1";
  manifest.parentIterationManifest = {
    path: "data/research-iteration-manifest-2.30.json",
    releaseId: BASE_RELEASE_ID,
    bytes: baseBytes.byteLength,
    fileSha256: sha256(baseBytes),
    contentSha256: base.manifestContentSha256,
  };
  manifest.baseResearchRelease.note = "Iteration 2.31 binds the 413-record Research Explorer 1.8.0 index to a fail-closed visual-target resolver. Its 149 morphology records remain 142 frozen census records plus seven supplementary records: 13 exact admitted main-scene targets, 136 exact source-specific viewer-only targets and 264 non-morphology focuses that clear stale geometry. Every missingness row is reason-coded and inference-forbidden. No fallback or substitute geometry, internal primitive, cross-source identity, atlas transform, registration, project copy or package copy is admitted.";

  const sourceRegistryReceipt = replaceInputReceipt(manifest, "researchSourceRegistry", sourceRegistryBytes);
  const upgradeRegistryReceipt = replaceInputReceipt(manifest, "researchModelUpgradeRegistry", upgradeRegistryBytes);
  replaceInputReceipt(manifest, "rightsLedger", rightsLedgerBytes);
  replaceInputReceipt(manifest, "packageLock", packageLockBytes);
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, indexValue) => receipt(input, additionalBytes[indexValue])));
  check(manifest.authoritativeInputs.length === 46, "research iteration 2.31 must contain exactly 46 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 46 && new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 46, "2.31 authoritative input IDs or paths are not unique");
  manifest.integrity.inputCount = 46;

  manifest.exactReferences.researchExplorerVisualIntegrity = {
    indexSchemaVersion: index.schemaVersion,
    assetSetId: index.assetSetId,
    assetManifestReceipt: simpleReceipt(ADDITIONAL_INPUTS[0], assetManifestBytes),
    searchIndexReceipt: simpleReceipt(ADDITIONAL_INPUTS[1], searchIndexBytes),
    visualTargetResolverReceipt: simpleReceipt(ADDITIONAL_INPUTS[2], visualTargetBytes),
    morphologyRecordDisclosureReceipt: simpleReceipt(ADDITIONAL_INPUTS[3], recordDisclosureBytes),
    sourceFileCount: assetManifest.sourceFiles.length,
    recordCount: index.counts.total,
    byFocusKind: structuredClone(index.counts.byFocusKind),
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableMorphologyRecordCount: 149,
    combinedCensusClaim: false,
    admittedMainSceneNeuronIds: [...ADMITTED_MAIN_SCENE_NEURON_IDS],
    admittedMainSceneExactTargetCount: explorer.dispositions.exact_main_scene_morphology,
    sourceSpecificViewerOnlyCount: explorer.dispositions.source_specific_viewer_only,
    nonMorphologyClearCount: explorer.dispositions.cleared,
    gapCount: explorer.gapCount,
    recordsWithGapCount: explorer.recordsWithGapCount,
    requiredGapFields: [...REQUIRED_GAP_FIELDS],
    missingnessReasonCodes: [...EXPECTED_REASON_CODES],
    missingnessScopes: [...EXPECTED_GAP_SCOPES],
    gapInferenceAllowedCount: 0,
    invalidMissingnessCount: 0,
    fallbackGeometryCount: explorer.fallbackGeometryCount,
    substituteGeometryCount: explorer.substituteGeometryCount,
    sameSpecimenInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    atlasTransformCount: 0,
    registrationCount: 0,
    projectCopyCount: 0,
    packageCopyCount: 0,
  };
  manifest.registrySummary = {
    canonicalSourcePackageCount: sourceRegistry.sourceCount,
    canonicalRecordSetCount: countRecordSets(sourceRegistry),
    bundledExactRosterCount: countBundledExactRosters(sourceRegistry),
    researchUpgradeCount: upgradeRegistry.summary.upgradeCount,
    sourceRegistryReceipt,
    upgradeRegistryReceipt,
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
  };
  manifest.scientificBoundaries.researchExplorerVisualIntegrity = "Research Explorer 1.8.0 is a discovery index over 413 independently admitted source records, not a harmonized same-cell or same-type atlas. The 149 morphology records remain 142 frozen census records plus seven supplementary records, never a combined census. Only 13 exact focus identities may enter the main scene; the other 136 exact morphology records stay in the source-specific viewer, while all 264 non-morphology focuses clear stale morphology. Every gap retains a controlled reason code, scope, authority, source locator, raw value, detail and inferenceAllowed=false. Fallback geometry, substitute geometry, same-specimen internal structure, rendered internal primitives, cross-source identity, atlas transforms, registrations, project copies and package copies remain zero.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest231(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest231();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.31 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    researchExplorerRecordCount: built.manifest.exactReferences.researchExplorerVisualIntegrity.recordCount,
    viewableMorphologyRecordCount: built.manifest.exactReferences.researchExplorerVisualIntegrity.viewableMorphologyRecordCount,
    admittedMainSceneExactTargetCount: built.manifest.exactReferences.researchExplorerVisualIntegrity.admittedMainSceneExactTargetCount,
    sourceSpecificViewerOnlyCount: built.manifest.exactReferences.researchExplorerVisualIntegrity.sourceSpecificViewerOnlyCount,
    nonMorphologyClearCount: built.manifest.exactReferences.researchExplorerVisualIntegrity.nonMorphologyClearCount,
    gapCount: built.manifest.exactReferences.researchExplorerVisualIntegrity.gapCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
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
