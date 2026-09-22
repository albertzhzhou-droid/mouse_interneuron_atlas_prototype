#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.29.json");
const BASE_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.28.json");
const SOURCE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");
const RIGHTS_LEDGER_PATH = path.join(PROJECT_ROOT, "docs/RIGHTS_LEDGER.csv");
const PACKAGE_LOCK_PATH = path.join(PROJECT_ROOT, "package-lock.json");

const BASE_RELEASE_ID = "ohri-mouse-interneuron-research-iteration-2.28.0";
const BASE_CONTENT_SHA256 = "af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173";
const BASE_FILE_BYTES = 69092;
const BASE_FILE_SHA256 = "f599acbd6969ba082014b258c098e648014116dc736535265bc7d5c154110b8e";
const EXPECTED_NEURON_IDS = Object.freeze([45674, 45718, 50394, 50408, 50424, 170035, 249676]);
const EXPECTED_ROUTE_SOURCES = Object.freeze([
  Object.freeze({ contractId: "functional-class-observed-morphology-route-pack-0.1", neuronIds: Object.freeze([45674, 50424]) }),
  Object.freeze({ contractId: "premotor-comparison-observed-morphology-route-pack-0.1", neuronIds: Object.freeze([45718]) }),
  Object.freeze({ contractId: "prp-dorsal-horn-observed-morphology-route-pack-0.1", neuronIds: Object.freeze([50394, 50408]) }),
  Object.freeze({ contractId: "dorsal-horn-observed-morphology-route-pack-0.1", neuronIds: Object.freeze([170035, 249676]) }),
]);

const ADDITIONAL_INPUTS = Object.freeze([
  {
    id: "supplementaryMorphologyComparisonAdapter",
    scope: "project",
    path: "data/supplementary-morphology-comparison-adapter-0.1.json",
    purpose: "Membership-aware adapter exposing seven exact route-local NeuroMorpho objects beside, but never inside, the immutable 142-record census",
  },
  {
    id: "supplementaryMorphologyComparisonAnalysisDelta",
    scope: "project",
    path: "public/data/supplementary_morphology_comparison_v1/analysis-delta.json",
    purpose: "Seven-record source-local morphology-analysis delta for the supplementary comparison layer",
  },
  {
    id: "supplementaryMorphologyComparisonAssetManifest",
    scope: "project",
    path: "public/data/supplementary_morphology_comparison_v1/asset-manifest.json",
    purpose: "Delta-only public inventory proving zero copied geometry or SWC payloads",
  },
  {
    id: "supplementaryMorphologyComparisonAdapterSchema",
    scope: "project",
    path: "schemas/supplementary-morphology-comparison-adapter-0.1.schema.json",
    purpose: "Combined JSON Schema for supplementary adapter membership, records, source receipts and missingness",
  },
]);

const EXPECTED_ADDITIONAL_RECEIPTS = Object.freeze([
  Object.freeze({ bytes: 42808, sha256: "f487034457ec2187996f0d3db8935545e64d1ce6783391b668c0747bdf2d5e05" }),
  Object.freeze({ bytes: 34013, sha256: "b2f90156d9e9eb86cc2dfc72f05a140c6942c802a492274472c86a0c7a29d0df" }),
  Object.freeze({ bytes: 3619, sha256: "ab7b2a8fbc458e0871a39819e88007ffe3ad84f6378f87a2a24015484028db6f" }),
  Object.freeze({ bytes: 24130, sha256: "50b79761fb881468d077a4f18c215fe544601789195c7ffe22e4d74bfeeeace0" }),
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(value, expected) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

function receipt(input, bytes) {
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function replaceInputReceipt(manifest, id, bytes) {
  const index = manifest.authoritativeInputs.findIndex((input) => input.id === id);
  check(index >= 0, `missing inherited authoritative input ${id}`);
  const inherited = manifest.authoritativeInputs[index];
  manifest.authoritativeInputs[index] = receipt(
    { id, scope: inherited.scope, path: inherited.path, purpose: inherited.purpose },
    bytes,
  );
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

function checkZeroBoundary(boundary, label) {
  check(boundary.atlasPlacementCount === 0 && boundary.atlasTransformCount === 0, `${label} admits atlas placement or transform`);
  check(boundary.censusExpansionCount === 0 && boundary.combinedCensusClaim === false, `${label} rewrites the frozen census`);
  check(boundary.commonCoordinateFrameClaim === false, `${label} creates a common coordinate-frame claim`);
  check(boundary.commonOrientationAdmissionCount === 0 && boundary.commonOrientationClaim === false, `${label} admits a common orientation`);
  check(boundary.commonScaleAdmissionCount === 0 && boundary.commonScaleClaim === false, `${label} admits a common scale`);
  check(boundary.completeAxonClaimCount === 0, `${label} creates a complete-axon claim`);
  check(boundary.crossSourceIdentityCount === 0 && boundary.registrationCount === 0, `${label} creates identity or registration`);
  check(boundary.paddingRecordCount === 0, `${label} creates padding records`);
  check(boundary.renderedInternalPrimitiveCount === 0 && boundary.sameSpecimenInternalStructureCount === 0, `${label} creates internal structure`);
}

function checkRouteSources(routeSources) {
  check(routeSources.length === 4, "supplementary adapter must cite exactly four route sources");
  check(same(routeSources.map((source) => source.contractId), EXPECTED_ROUTE_SOURCES.map((source) => source.contractId)), "supplementary route-source order or identity drifted");
  for (let index = 0; index < routeSources.length; index += 1) {
    const source = routeSources[index];
    const expected = EXPECTED_ROUTE_SOURCES[index];
    check(same(source.supplementaryNeuronIds, expected.neuronIds), `${source.contractId} supplementary roster drifted`);
    check(source.contractBytes > 0 && /^[a-f0-9]{64}$/.test(source.contractSha256), `${source.contractId} contract receipt is invalid`);
    check(source.assetManifestBytes > 0 && /^[a-f0-9]{64}$/.test(source.assetManifestSha256), `${source.contractId} asset-manifest receipt is invalid`);
    check(!path.isAbsolute(source.contractPath) && !path.isAbsolute(source.assetManifestPath), `${source.contractId} source receipt must be project-relative`);
  }
  check(same(routeSources.flatMap((source) => source.supplementaryNeuronIds).sort((a, b) => a - b), EXPECTED_NEURON_IDS), "four route sources do not partition the exact seven-neuron roster");
}

function checkSupplementaryRecord(record, routeSources) {
  const membership = record.comparisonMembership;
  check(record.assetId === `NeuroMorpho:${record.neuronId}` && EXPECTED_NEURON_IDS.includes(record.neuronId), `unexpected supplementary identity ${record.neuronId}`);
  check(membership.collection === "supplementary" && membership.censusContribution === 0 && membership.supplementaryContribution === 1, `NMO ${record.neuronId} membership rewrites the census`);
  const source = routeSources.find((candidate) => candidate.supplementaryNeuronIds.includes(record.neuronId));
  check(Boolean(source), `NMO ${record.neuronId} has no route-source receipt`);
  check(membership.routeContractPath === source.contractPath && membership.routeContractSha256 === source.contractSha256, `NMO ${record.neuronId} route-contract provenance drifted`);
  check(membership.routeAssetManifestPath === source.assetManifestPath && membership.routeAssetManifestSha256 === source.assetManifestSha256, `NMO ${record.neuronId} route-manifest provenance drifted`);
  check(typeof membership.routeId === "string" && membership.routeId.endsWith(`nmo_${record.neuronId}`), `NMO ${record.neuronId} route identity drifted`);
  check(record.geometry.available === true && record.geometry.bytes > 0 && /^\/data\//.test(record.geometry.path), `NMO ${record.neuronId} geometry reference is unavailable`);
  check(/^[a-f0-9]{64}$/.test(record.geometry.sha256) && /^[a-f0-9]{64}$/.test(record.geometry.canonicalGeometrySha256) && /^[a-f0-9]{64}$/.test(record.geometry.topologySha256), `NMO ${record.neuronId} geometry receipt is invalid`);
  check(record.qc.status === "passed" && record.qc.errors.length === 0, `NMO ${record.neuronId} source-object QC failed`);
}

export function serializeResearchIterationManifest229(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest229() {
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const [
    baseBytes,
    adapterBytes,
    analysisDeltaBytes,
    assetManifestBytes,
    adapterSchemaBytes,
    sourceRegistryBytes,
    upgradeRegistryBytes,
    rightsLedgerBytes,
    packageLockBytes,
  ] = await Promise.all([
    readFile(BASE_PATH),
    readFile(additionalPaths[0]),
    readFile(additionalPaths[1]),
    readFile(additionalPaths[2]),
    readFile(additionalPaths[3]),
    readFile(SOURCE_REGISTRY_PATH),
    readFile(UPGRADE_REGISTRY_PATH),
    readFile(RIGHTS_LEDGER_PATH),
    readFile(PACKAGE_LOCK_PATH),
  ]);

  const base = JSON.parse(baseBytes.toString("utf8"));
  const adapter = JSON.parse(adapterBytes.toString("utf8"));
  const analysisDelta = JSON.parse(analysisDeltaBytes.toString("utf8"));
  const assetManifest = JSON.parse(assetManifestBytes.toString("utf8"));
  const sourceRegistry = JSON.parse(sourceRegistryBytes.toString("utf8"));
  const upgradeRegistry = JSON.parse(upgradeRegistryBytes.toString("utf8"));
  const packageLock = JSON.parse(packageLockBytes.toString("utf8"));

  check(base.releaseId === BASE_RELEASE_ID, "immutable 2.28 base release identity drifted");
  check(baseBytes.byteLength === BASE_FILE_BYTES && sha256(baseBytes) === BASE_FILE_SHA256, "immutable 2.28 base file bytes drifted");
  check(base.manifestContentSha256 === BASE_CONTENT_SHA256 && computeManifestContentSha256(base) === BASE_CONTENT_SHA256, "immutable 2.28 base content drifted");
  const additionalBytes = [adapterBytes, analysisDeltaBytes, assetManifestBytes, adapterSchemaBytes];
  for (let index = 0; index < additionalBytes.length; index += 1) {
    const expected = EXPECTED_ADDITIONAL_RECEIPTS[index];
    check(additionalBytes[index].byteLength === expected.bytes && sha256(additionalBytes[index]) === expected.sha256, `${ADDITIONAL_INPUTS[index].id} receipt drifted`);
  }

  check(adapter.adapterId === "supplementary-morphology-comparison-adapter-0.1" && adapter.releaseId === "ohri-supplementary-morphology-comparison-adapter-0.1.0", "supplementary adapter identity drifted");
  check(adapter.sourceCensus.immutable === true && adapter.sourceCensus.recordCount === 142, "supplementary adapter changes the frozen census denominator");
  checkRouteSources(adapter.routeSources);
  check(adapter.summary.frozenCensusRecordCount === 142 && adapter.summary.supplementaryRecordCount === 7 && adapter.summary.viewableSourceObjectCount === 149 && adapter.summary.combinedCensusClaim === false, "supplementary adapter 142 + 7 = 149 arithmetic drifted");
  check(adapter.summary.geometryReferenceCount === 7 && adapter.summary.geometryCopyCount === 0 && adapter.summary.swcCopyCount === 0, "supplementary adapter copies geometry or changes reference count");
  check(adapter.summary.paddingRecordCount === 0 && adapter.summary.commonScaleAdmissionCount === 0 && adapter.summary.commonOrientationAdmissionCount === 0 && adapter.summary.completeAxonClaimCount === 0 && adapter.summary.crossSourceIdentityCount === 0 && adapter.summary.registrationCount === 0 && adapter.summary.sameSpecimenInternalStructureCount === 0 && adapter.summary.renderedInternalPrimitiveCount === 0, "supplementary adapter creates an unsupported comparison claim");
  checkZeroBoundary(adapter.scientificBoundary, "supplementary adapter");
  check(adapter.records.length === 7 && same(adapter.records.map((record) => record.neuronId), EXPECTED_NEURON_IDS), "supplementary adapter exact neuron roster drifted");
  check(new Set(adapter.records.map((record) => record.neuronId)).size === 7 && new Set(adapter.records.map((record) => record.geometry.path)).size === 7, "supplementary adapter duplicates a neuron or geometry path");
  adapter.records.forEach((record) => checkSupplementaryRecord(record, adapter.routeSources));

  check(analysisDelta.assetSetId === "ohri:supplementary-morphology-comparison-v1" && analysisDelta.releaseId === adapter.releaseId, "supplementary analysis-delta identity drifted");
  check(same(analysisDelta.sourceRoutes, adapter.routeSources), "supplementary analysis-delta route receipts disagree with adapter");
  check(same(analysisDelta.scientificBoundary, adapter.scientificBoundary), "supplementary analysis-delta boundaries disagree with adapter");
  check(analysisDelta.aggregationPolicy.cohortCount === 0 && analysisDelta.aggregationPolicy.crossRecordAggregateCount === 0, "supplementary analysis creates a cross-record aggregate");
  check(analysisDelta.summary.supplementaryRecordCount === 7 && analysisDelta.summary.geometryReferenceCount === 7 && analysisDelta.summary.geometryCopyCount === 0 && analysisDelta.summary.swcCopyCount === 0, "supplementary analysis summary drifted");
  check(analysisDelta.records.length === 7 && same(analysisDelta.records.map((record) => record.neuronId), EXPECTED_NEURON_IDS), "supplementary analysis exact neuron roster drifted");
  analysisDelta.records.forEach((record, index) => {
    check(same(record.comparisonMembership, adapter.records[index].comparisonMembership), `NMO ${record.neuronId} analysis membership disagrees with adapter`);
    check(record.sourceGeometry.path === adapter.records[index].geometry.path && record.sourceGeometry.sha256 === adapter.records[index].geometry.sha256, `NMO ${record.neuronId} analysis geometry receipt disagrees with adapter`);
  });
  check(adapter.analysisDelta.bytes === analysisDeltaBytes.byteLength && adapter.analysisDelta.sha256 === sha256(analysisDeltaBytes), "adapter analysis-delta receipt drifted");
  check(adapter.analysisDelta.assetManifestBytes === assetManifestBytes.byteLength && adapter.analysisDelta.assetManifestSha256 === sha256(assetManifestBytes), "adapter public asset-manifest receipt drifted");

  check(assetManifest.assetSetId === analysisDelta.assetSetId && assetManifest.releaseId === adapter.releaseId, "supplementary public asset-manifest identity drifted");
  check(same(assetManifest.sources.routeSources, adapter.routeSources) && same(assetManifest.sources.frozenCensus, adapter.sourceCensus), "supplementary public manifest source receipts disagree with adapter");
  check(assetManifest.files.length === 1 && assetManifest.files[0].path === "analysis-delta.json" && assetManifest.files[0].bytes === analysisDeltaBytes.byteLength && assetManifest.files[0].sha256 === sha256(analysisDeltaBytes), "supplementary public manifest payload receipt drifted");
  check(assetManifest.summary.declaredPayloadFileCount === 1 && assetManifest.summary.directoryFileCount === 2 && assetManifest.summary.fullContentCopyCount === 0 && assetManifest.summary.geometryCopyCount === 0 && assetManifest.summary.swcCopyCount === 0 && assetManifest.summary.registrationCount === 0, "supplementary public manifest admits copied or registered content");

  check(sourceRegistry.sourceCount === 24 && sourceRegistry.sources.length === 24 && countRecordSets(sourceRegistry) === 28 && countBundledExactRosters(sourceRegistry) === 7, "source-registry denominators drifted");
  check(upgradeRegistry.summary.upgradeCount === 136 && upgradeRegistry.upgrades.length === 136 && upgradeRegistry.upgrades[0]?.id === "UPG-022" && upgradeRegistry.upgrades.at(-1)?.id === "UPG-154", "upgrade-registry denominator or range drifted");
  check(packageLock.version === "2.29.0-research.1" && packageLock.packages?.[""]?.version === "2.29.0-research.1", "package-lock application version drifted");

  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.29.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.29.0";
  manifest.releaseDate = "2026-08-31";
  manifest.application.version = "2.29.0-research.1";
  manifest.parentIterationManifest = {
    path: "data/research-iteration-manifest-2.28.json",
    releaseId: BASE_RELEASE_ID,
    bytes: baseBytes.byteLength,
    fileSha256: sha256(baseBytes),
    contentSha256: base.manifestContentSha256,
  };
  manifest.baseResearchRelease.note = "The seven SCI evidence entities, five frozen observed-cell exemplars, 142-record census, thirteen active unique morphologies, ten named spinal routes and nine-state / sixteen-route representation contract remain unchanged. Iteration 2.29 exposes seven already source-pinned route-local NeuroMorpho objects through a separate supplementary comparison layer, yielding 142 frozen census records plus 7 supplementary records and 149 viewable source objects. This is never a 149-record census. The adapter copies no geometry or SWC payloads, creates no padding records, and admits no shared scale, orientation, coordinate frame, atlas placement, registration, complete axon, internal structure or cross-source identity claim.";

  const sourceRegistryReceipt = replaceInputReceipt(manifest, "researchSourceRegistry", sourceRegistryBytes);
  const upgradeRegistryReceipt = replaceInputReceipt(manifest, "researchModelUpgradeRegistry", upgradeRegistryBytes);
  replaceInputReceipt(manifest, "rightsLedger", rightsLedgerBytes);
  replaceInputReceipt(manifest, "packageLock", packageLockBytes);
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 38, "research iteration 2.29 must contain exactly 38 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 38 && new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 38, "2.29 authoritative input IDs or paths are not unique");
  manifest.integrity.inputCount = 38;

  manifest.exactReferences.supplementaryMorphologyComparisonAdapter = {
    adapterId: adapter.adapterId,
    adapterReleaseId: adapter.releaseId,
    adapterReceipt: { path: ADDITIONAL_INPUTS[0].path, bytes: adapterBytes.byteLength, sha256: sha256(adapterBytes) },
    adapterSchemaReceipt: { path: ADDITIONAL_INPUTS[3].path, bytes: adapterSchemaBytes.byteLength, sha256: sha256(adapterSchemaBytes) },
    analysisDeltaReceipt: {
      path: ADDITIONAL_INPUTS[1].path,
      assetSetId: analysisDelta.assetSetId,
      bytes: analysisDeltaBytes.byteLength,
      sha256: sha256(analysisDeltaBytes),
      recordCount: analysisDelta.records.length,
      neuronIds: analysisDelta.records.map((record) => record.neuronId),
    },
    assetManifestReceipt: {
      path: ADDITIONAL_INPUTS[2].path,
      assetSetId: assetManifest.assetSetId,
      bytes: assetManifestBytes.byteLength,
      sha256: sha256(assetManifestBytes),
      declaredPayloadFileCount: assetManifest.summary.declaredPayloadFileCount,
      directoryFileCount: assetManifest.summary.directoryFileCount,
      files: structuredClone(assetManifest.files),
    },
    sourceCensus: structuredClone(adapter.sourceCensus),
    routeSourceCount: adapter.routeSources.length,
    routeSources: structuredClone(adapter.routeSources),
    supplementaryNeuronIds: adapter.records.map((record) => record.neuronId),
    frozenCensusRecordCount: adapter.summary.frozenCensusRecordCount,
    supplementaryRecordCount: adapter.summary.supplementaryRecordCount,
    viewableSourceObjectCount: adapter.summary.viewableSourceObjectCount,
    combinedCensusClaim: adapter.summary.combinedCensusClaim,
    geometryReferenceCount: adapter.summary.geometryReferenceCount,
    geometryCopyCount: adapter.summary.geometryCopyCount,
    swcCopyCount: adapter.summary.swcCopyCount,
    paddingRecordCount: adapter.summary.paddingRecordCount,
    commonScaleAdmissionCount: adapter.summary.commonScaleAdmissionCount,
    commonOrientationAdmissionCount: adapter.summary.commonOrientationAdmissionCount,
    atlasPlacementCount: adapter.scientificBoundary.atlasPlacementCount,
    atlasTransformCount: adapter.scientificBoundary.atlasTransformCount,
    completeAxonClaimCount: adapter.summary.completeAxonClaimCount,
    sameSpecimenInternalStructureCount: adapter.summary.sameSpecimenInternalStructureCount,
    renderedInternalPrimitiveCount: adapter.summary.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: adapter.summary.crossSourceIdentityCount,
    registrationCount: adapter.summary.registrationCount,
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
  manifest.scientificBoundaries.supplementaryMorphologyComparisonAdapter = "The comparison inventory is exactly 142 immutable census records plus seven supplementary route-local NeuroMorpho records, for 149 viewable source objects; it is not a 149-record census. Each supplementary record retains its own source frame and checksum-pinned route provenance. Seven references reuse existing geometry without copying geometry or SWC files. Independent auto-fit does not establish common scale, orientation, coordinate frame, atlas placement or registration. Repository physical-integrity labels do not establish a complete biological axon. Padding records, same-specimen internals, rendered internal primitives, cross-source identities and registrations remain zero.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest229(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest229();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.29 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    frozenCensusRecordCount: built.manifest.exactReferences.supplementaryMorphologyComparisonAdapter.frozenCensusRecordCount,
    supplementaryRecordCount: built.manifest.exactReferences.supplementaryMorphologyComparisonAdapter.supplementaryRecordCount,
    viewableSourceObjectCount: built.manifest.exactReferences.supplementaryMorphologyComparisonAdapter.viewableSourceObjectCount,
    combinedCensusClaim: built.manifest.exactReferences.supplementaryMorphologyComparisonAdapter.combinedCensusClaim,
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
