#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.34.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.33.json");

const PARENT_RECEIPT = Object.freeze({
  path: "data/research-iteration-manifest-2.33.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.33.0",
  bytes: 109358,
  fileSha256: "6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081",
  contentSha256: "1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f",
});

const REPLACED_INPUT_IDS = Object.freeze([
  "researchModelUpgradeRegistry",
  "packageLock",
  "researchVisualTargetResolver",
  "sourceLocalTopologyViewport",
  "morphologyViewerTopologyIntegration",
  "atlasFocusSynchronization",
  "atlasTypeContracts",
  "researchExplorerFingerprintIntegration",
]);

const ADDITIONAL_INPUTS = Object.freeze([
  ["applicationPackage", "package.json", "Application version and deterministic validation routes"],
  ["projectReadme", "README.md", "Current research scope and exact-universe disclosure"],
  ["researchUpgradeQueue", "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md", "Evidence-gated research/model queue through UPG-173"],
  ["researchTimeline234", "docs/RESEARCH_TIMELINE_2026-09-01_ITERATION_2_34.md", "Unique in-place iteration 2.34 timeline and rollback scope"],
  ["researchDataLab", "app/ResearchDataLab.tsx", "1,097-object morphology entry point and denominator disclosure"],
  ["researchOverview", "app/ResearchOverview.tsx", "Exact-universe research overview and frozen-subset boundary"],
  ["neuromorphoUniversePanel", "app/NeuroMorphoUniversePanel.tsx", "Exact-object browser, viewer and record-specific evidence card"],
  ["atlasStylesheet", "app/globals.css", "Responsive exact-universe presentation styles"],
  ["morphologyMatrixStateRuntime", "app/morphology-matrix-state.js", "Five-view morphology state with exact universe default"],
  ["neuromorphoUniverseBuilder", "tools/build_neuromorpho_no_age_universe.py", "Official-query snapshot and exact SWC acquisition/QC builder"],
  ["neuromorphoUniverseContract", "data/neuromorpho-no-age-query-universe-0.1.json", "No-age query universe scientific and integrity contract"],
  ["neuromorphoUniverseRoster", "data/neuromorpho-no-age-query-universe-roster-0.1.json", "Fail-closed 1,097-ID runtime membership roster"],
  ["neuromorphoUniverseSchema", "schemas/neuromorpho-no-age-query-universe-0.1.schema.json", "Exact-universe JSON schema"],
  ["neuromorphoUniverseValidator", "scripts/validate-neuromorpho-no-age-query-universe-0.1.mjs", "Full metadata, SWC, hash, topology and no-copy validator"],
  ["neuromorphoUniverseTest", "tests/neuromorpho-no-age-query-universe.test.mjs", "Universe denominator, independent-set and UI regression tests"],
  ["neuromorphoSwcRuntime", "app/neuromorpho-swc-runtime.js", "Strict lazy seven-column SWC parser and receipt gate"],
  ["neuromorphoSwcRuntimeTest", "tests/neuromorpho-swc-runtime.test.mjs", "Parser, parity and failure regression tests"],
  ["researchVisualTargetTest", "tests/research-visual-target.test.mjs", "Roster-aware exact-focus and stale-geometry regression tests"],
  ["morphologyMatrixStateTest", "tests/morphology-matrix-state.test.mjs", "Five-view/default-universe state regression tests"],
  ["renderedHtmlTest", "tests/rendered-html.test.mjs", "Server-rendered application regression tests"],
  ["micronsObservedReferenceTest", "tests/microns-observed-cell-nucleus-reference.test.mjs", "Current-manifest cross-region reference regression test"],
  ["neuromorphoUniverseIndex", "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json", "Exact 1,097-record metadata, provenance and SWC receipt index"],
  ["neuromorphoUniverseAssetManifest", "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/asset-manifest.json", "Delta-file asset declarations and receipts"],
  ["neuromorphoUniverseQuarantine", "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/quarantine-report.json", "Final zero-quarantine report"],
  ["neuromorphoUniverseApiPage0", "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/api/page-0.json", "Official API snapshot page 0"],
  ["neuromorphoUniverseApiPage1", "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/api/page-1.json", "Official API snapshot page 1"],
  ["neuromorphoUniverseApiPage2", "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/api/page-2.json", "Official API snapshot page 2"],
].map(([id, inputPath, purpose]) => Object.freeze({ id, scope: "project", path: inputPath, purpose })));

const EXPECTED_SUMMARY = Object.freeze({
  queryRecordCount: 1097,
  uniqueNeuronIdCount: 1097,
  admittedSourceObjectCount: 1097,
  quarantinedSourceObjectCount: 0,
  frozenAdultSubsetCount: 142,
  existingGeometryReferenceCount: 149,
  deltaRawSwcCount: 948,
  geometryCopyCount: 0,
  sourceLabelled3DCount: 1058,
  sourceLabelled2DCount: 39,
  diameterAuthorizedCount: 955,
  diameterUnavailableCount: 142,
  axonDomainCount: 253,
  completeAxonClaimCount: 0,
  registrationCount: 0,
  sameSpecimenInternalStructureCount: 0,
  paperCount: 12,
  archiveCount: 5,
});

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
  check(input, `missing 2.34 input ${id}`);
  return simpleReceipt(input);
}

function assertText(source, snippets, label) {
  for (const snippet of snippets) check(source.includes(snippet), `${label} is missing ${snippet}`);
}

function validateUniverse(contract, roster, index, assetManifest, quarantine, pages, sources) {
  check(contract.contractId === "neuromorpho-no-age-query-universe-0.1" && contract.releaseId === "research-iteration-2.34", "universe contract identity drifted");
  for (const [key, expected] of Object.entries(EXPECTED_SUMMARY)) {
    check(contract.summary[key] === expected && index.summary[key] === expected, `universe ${key} drifted`);
  }
  check(Array.isArray(contract.summary.duplicateRawSwcGroups) && contract.summary.duplicateRawSwcGroups.length === 0, "raw SWC duplicates must remain zero");
  check(Array.isArray(contract.summary.duplicateCanonicalGeometryGroups) && contract.summary.duplicateCanonicalGeometryGroups.length === 0, "canonical geometry duplicates must remain zero");
  check(index.records.length === 1097 && new Set(index.records.map((record) => record.neuronId)).size === 1097, "universe index identity roster drifted");
  check(roster.admittedNeuronIds.length === 1097 && new Set(roster.admittedNeuronIds).size === 1097 && roster.quarantinedNeuronIds.length === 0, "runtime roster drifted");
  check(quarantine.quarantinedSourceObjectCount === 0 && quarantine.records.length === 0, "quarantine report is not empty");
  check(pages.length === 3 && pages.map((page) => page._embedded.neuronResources.length).join(",") === "500,500,97", "official API page distribution drifted");
  check(pages.every((page) => page.page.totalElements === 1097 && page.page.totalPages === 3), "official API pagination denominator drifted");
  check(assetManifest.summary.declaredLocalFileCount === 953 && assetManifest.summary.deltaRawSwcCount === 948, "asset manifest declaration counts drifted");
  check(contract.dataset.indexBytes === sources.get("neuromorphoUniverseIndex").byteLength && contract.dataset.indexSha256 === sha256(sources.get("neuromorphoUniverseIndex")), "universe index receipt drifted");
  check(contract.dataset.assetManifestBytes === sources.get("neuromorphoUniverseAssetManifest").byteLength && contract.dataset.assetManifestSha256 === sha256(sources.get("neuromorphoUniverseAssetManifest")), "universe asset-manifest receipt drifted");
  check(contract.dataset.quarantineBytes === sources.get("neuromorphoUniverseQuarantine").byteLength && contract.dataset.quarantineSha256 === sha256(sources.get("neuromorphoUniverseQuarantine")), "universe quarantine receipt drifted");
  check(contract.dataset.runtimeRosterBytes === sources.get("neuromorphoUniverseRoster").byteLength && contract.dataset.runtimeRosterSha256 === sha256(sources.get("neuromorphoUniverseRoster")), "universe runtime-roster receipt drifted");
  check(contract.admission.existingGeometryCopyCount === 0 && contract.admission.deltaGeneratedGeometryCount === 0 && contract.admission.unknownFocusFailsClosed === true, "universe no-copy/fail-closed admission boundary drifted");

  assertText(sources.get("neuromorphoUniversePanel").toString("utf8"), ["Exact source objects", "What differs for this cell", "Every switch discards the prior geometry", "No geometry rendered", "source z values are preserved"], "universe panel");
  assertText(sources.get("morphologyViewerTopologyIntegration").toString("utf8"), ["Exact universe · 1,097 source objects", "Frozen adult subset · 142 exact SWCs", "view !== \"universe\""], "morphology viewer");
  assertText(sources.get("researchVisualTargetResolver").toString("utf8"), ["admittedSourceViewerNeuronIds", "morphology_focus_not_admitted_in_current_source_universe"], "focus resolver");
  assertText(sources.get("neuromorphoSwcRuntime").toString("utf8"), ["parseNeuromorphoSwc", "loadVerifiedUniverseSwc", "radiusSurfaceAuthorized"], "SWC runtime");
  assertText(sources.get("researchDataLab").toString("utf8"), ["<strong>1,097</strong>", "149 exact assets reused + 948 delta SWCs"], "research data lab");
  assertText(sources.get("researchOverview").toString("utf8"), ["1,097 exact SWCs · frozen adult subset 142"], "research overview");
}

export function serializeResearchIterationManifest234(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest234() {
  const parentBytes = await readFile(PARENT_PATH);
  const parent = JSON.parse(parentBytes.toString("utf8"));
  check(parent.releaseId === PARENT_RECEIPT.releaseId, "immutable 2.33 parent release identity drifted");
  check(parentBytes.byteLength === PARENT_RECEIPT.bytes && sha256(parentBytes) === PARENT_RECEIPT.fileSha256, "immutable 2.33 parent file receipt drifted");
  check(parent.manifestContentSha256 === PARENT_RECEIPT.contentSha256 && computeManifestContentSha256(parent) === PARENT_RECEIPT.contentSha256, "immutable 2.33 parent content receipt drifted");

  const inheritedById = new Map(parent.authoritativeInputs.map((input) => [input.id, input]));
  const replacedPaths = REPLACED_INPUT_IDS.map((id) => {
    const input = inheritedById.get(id);
    check(input, `2.33 parent is missing ${id}`);
    return path.join(PROJECT_ROOT, input.path);
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
  const registry = JSON.parse(sources.get("researchModelUpgradeRegistry").toString("utf8"));
  check(packageLock.version === "2.34.0-research.1" && packageLock.packages?.[""]?.version === "2.34.0-research.1", "package-lock 2.34 version drifted");
  check(applicationPackage.version === "2.34.0-research.1", "package.json 2.34 version drifted");
  check(registry.summary.upgradeCount === 155 && registry.upgrades.length === 155 && registry.upgrades.at(-1)?.id === "UPG-173", "research upgrade registry denominator or range drifted");
  check(registry.upgrades.find((item) => item.id === "UPG-088")?.status === "completed", "UPG-088 is not complete");

  const contract = JSON.parse(sources.get("neuromorphoUniverseContract").toString("utf8"));
  const roster = JSON.parse(sources.get("neuromorphoUniverseRoster").toString("utf8"));
  const index = JSON.parse(sources.get("neuromorphoUniverseIndex").toString("utf8"));
  const assetManifest = JSON.parse(sources.get("neuromorphoUniverseAssetManifest").toString("utf8"));
  const quarantine = JSON.parse(sources.get("neuromorphoUniverseQuarantine").toString("utf8"));
  const pages = [0, 1, 2].map((page) => JSON.parse(sources.get(`neuromorphoUniverseApiPage${page}`).toString("utf8")));
  validateUniverse(contract, roster, index, assetManifest, quarantine, pages, sources);

  const manifest = structuredClone(parent);
  manifest.manifestSchemaVersion = "2.34.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.34.0";
  manifest.releaseDate = "2026-09-01";
  manifest.application.version = "2.34.0-research.1";
  manifest.parentIterationManifest = { ...PARENT_RECEIPT };
  manifest.baseResearchRelease.note = "Iteration 2.34 reconciles the morphology UI with the exact NeuroMorpho release 8.6.124 no-age-filter universe. It admits 1,097 checksum-gated standardized source-local SWCs, references 149 existing exact assets in place, adds 948 delta raw SWCs, defaults the morphology workspace to the exact universe, clears stale geometry before each verified load, and separates shared project limits from record-specific evidence. It creates no representative cell, complete axon, repaired neurite, internal structure, molecular/SCI identity, registration, project copy or package copy.";

  const replacements = new Map();
  REPLACED_INPUT_IDS.forEach((id, index) => replacements.set(id, replaceInputReceipt(manifest, id, replacedBytes[index])));
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 102, "research iteration 2.34 must contain exactly 102 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 102, "2.34 authoritative input IDs are not unique");
  check(new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 102, "2.34 authoritative input paths are not unique");
  manifest.integrity.inputCount = 102;

  manifest.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity = {
    contractId: "ohri-neuromorpho-no-age-query-universe-integrity-2.34",
    sourceRepository: "NeuroMorpho.Org",
    repositoryRelease: index.repositoryRelease,
    query: index.query,
    ...EXPECTED_SUMMARY,
    duplicateRawSwcGroupCount: contract.summary.duplicateRawSwcGroups.length,
    duplicateCanonicalGeometryGroupCount: contract.summary.duplicateCanonicalGeometryGroups.length,
    officialApiPageRecordCounts: pages.map((page) => page._embedded.neuronResources.length),
    assetManifestDeclaredFileCount: assetManifest.summary.declaredLocalFileCount,
    runtimeRosterCount: roster.admittedNeuronIds.length,
    contractReceipt: inputReceipt(manifest, "neuromorphoUniverseContract"),
    rosterReceipt: inputReceipt(manifest, "neuromorphoUniverseRoster"),
    indexReceipt: inputReceipt(manifest, "neuromorphoUniverseIndex"),
    assetManifestReceipt: inputReceipt(manifest, "neuromorphoUniverseAssetManifest"),
    quarantineReceipt: inputReceipt(manifest, "neuromorphoUniverseQuarantine"),
    builderReceipt: inputReceipt(manifest, "neuromorphoUniverseBuilder"),
    schemaReceipt: inputReceipt(manifest, "neuromorphoUniverseSchema"),
    validatorReceipt: inputReceipt(manifest, "neuromorphoUniverseValidator"),
    runtimeReceipt: inputReceipt(manifest, "neuromorphoSwcRuntime"),
    panelReceipt: inputReceipt(manifest, "neuromorphoUniversePanel"),
    viewerReceipt: inputReceipt(manifest, "morphologyViewerTopologyIntegration"),
    focusResolverReceipt: inputReceipt(manifest, "researchVisualTargetResolver"),
    atlasIntegrationReceipt: inputReceipt(manifest, "atlasFocusSynchronization"),
    adultAndNoDiameterSameCountButIndependentSets: true,
    oldGeometryClearedBeforeLoad: true,
    unknownFocusFailsClosed: true,
    sourceZPreservedWithoutInferredExtrusion: true,
    sourceDiameterGateRetained: true,
    completeAxonClaimCount: 0,
    atlasRegistrationCount: 0,
    sameSpecimenInternalStructureCount: 0,
    crossSourceIdentityCount: 0,
    generatedGeometryCopyCount: 0,
    projectCopyCount: 0,
    packageCopyCount: 0,
  };
  manifest.registrySummary = {
    ...parent.registrySummary,
    researchUpgradeCount: registry.summary.upgradeCount,
    upgradeRegistryReceipt: replacements.get("researchModelUpgradeRegistry"),
  };
  manifest.scientificBoundaries.neuromorphoNoAgeQueryUniverseIntegrity = "Iteration 2.34 admits exact repository records and standardized source-local SWCs, not 1,097 biological types, animals, specimens, complete cells or prevalence observations. The frozen 142-record adult subset remains separate even though the full query also contains 142 no-diameter records; those sets overlap but are not identical. Source-labelled 2D coordinates retain source z values without inferred or extruded depth. No Diameter records authorize centerlines only. Missing soma contour, membrane, nucleus, organelles, boutons, synapses, receptors, complete axon, molecular/SCI identity and atlas registration remain unavailable rather than synthesized.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest234(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest234();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.34 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount,
    admittedSourceObjectCount: built.manifest.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity.admittedSourceObjectCount,
    deltaRawSwcCount: built.manifest.exactReferences.neuromorphoNoAgeQueryUniverseIntegrity.deltaRawSwcCount,
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
