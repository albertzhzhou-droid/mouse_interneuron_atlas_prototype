#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.30.json");
const BASE_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.29.json");
const SOURCE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");
const RIGHTS_LEDGER_PATH = path.join(PROJECT_ROOT, "docs/RIGHTS_LEDGER.csv");
const PACKAGE_LOCK_PATH = path.join(PROJECT_ROOT, "package-lock.json");

const BASE_RELEASE_ID = "ohri-mouse-interneuron-research-iteration-2.29.0";
const BASE_CONTENT_SHA256 = "069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982";
const BASE_FILE_BYTES = 77136;
const BASE_FILE_SHA256 = "8856ad6413fae98f5f6f9d13cbb0627c8b41b8a9dbaa04ebd9a232689edaeba5";
const ADDITIONAL_INPUTS = Object.freeze([
  {
    id: "morphologySourceFrameDisclosure",
    scope: "project",
    path: "data/morphology-source-frame-disclosure-0.1.json",
    purpose: "Exact 149-record source-local coordinate, preparation, truncation and scale-disclosure contract",
  },
  {
    id: "morphologySourceFrameDisclosureSchema",
    scope: "project",
    path: "schemas/morphology-source-frame-disclosure-0.1.schema.json",
    purpose: "Fail-closed JSON Schema for the source-frame disclosure contract",
  },
  {
    id: "morphologySourceFrameDisclosureBuilder",
    scope: "project",
    path: "tools/build_morphology_source_frame_disclosure.mjs",
    purpose: "Deterministic source-frame disclosure materializer",
  },
  {
    id: "morphologyViewportScaleAlgorithm",
    scope: "project",
    path: "app/morphology-viewport-scale.js",
    purpose: "Pure camera-target-plane source-local micrometre scale-bar algorithm",
  },
]);

const EXPECTED_ADDITIONAL_RECEIPTS = Object.freeze([
  Object.freeze({ bytes: 469544, sha256: "e76abace7e59995f4b1849ce87a7e10e0d066a80844959589d5f06fcba0c5230" }),
  Object.freeze({ bytes: 14554, sha256: "382bc051000d96d7142b5176598dad969f36568579e70f563e83606ac6ca8e4b" }),
  Object.freeze({ bytes: 20391, sha256: "dae31dc3d47d203b3374c1cc902c09950e705147386e44a8fe96af8175c72633" }),
  Object.freeze({ bytes: 3658, sha256: "f51a96dd5fe21d36ca7455245145b002a232116115e5af992d0f6465542f1aac" }),
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

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function canonicalContractSha256(contract) {
  const copy = structuredClone(contract);
  delete copy.contractContentSha256;
  return sha256(Buffer.from(JSON.stringify(stableValue(copy)), "utf8"));
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

export function serializeResearchIterationManifest230(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function checkContract(contract) {
  check(contract.contractId === "morphology-source-frame-disclosure-0.1" && contract.releaseId === "ohri-morphology-source-frame-disclosure-0.1.0", "source-frame disclosure identity drifted");
  check(contract.contractContentSha256 === "cd6b85eb5961e49667bdc126b0230fba35db534fdcc2c8008d5655893978a8ad" && canonicalContractSha256(contract) === contract.contractContentSha256, "source-frame disclosure content receipt drifted");
  const summary = contract.summary;
  check(summary.frozenCensusRecordCount === 142 && summary.supplementaryRecordCount === 7 && summary.viewableSourceObjectCount === 149, "source-frame 142 + 7 = 149 denominator drifted");
  check(summary.geometry2DCount === 2 && summary.geometry3DCount === 147 && summary.preparationContextConflictCount === 5 && summary.sourceModerateOrIncompleteCount === 70 && summary.scaleEligibleRecordCount === 149, "source-frame summary drifted");
  check(summary.commonScaleAdmissionCount === 0 && summary.inferredMissingCoordinateCount === 0 && summary.repairedCutNeuriteCount === 0 && summary.restoredInVivoDimensionCount === 0 && summary.registrationCount === 0, "source-frame summary admits unsupported reconstruction semantics");
  const policy = contract.displayScalePolicy;
  check(policy.algorithmId === "camera_target_plane_source_local_scale_v1" && policy.sourceCoordinateUnit === "micrometre_reported_by_source" && policy.measurementPlane === "camera_target_depth", "scale algorithm identity drifted");
  check(policy.targetPixelLength === 92 && same(policy.preferredNiceSeries, [1, 2, 5]) && same(policy.updatesOn, ["initial_fit", "orbit_zoom", "viewport_resize"]), "scale algorithm policy drifted");
  check(policy.sourceLocalOnly === true && policy.sharedAcrossViewports === false && policy.apparentObjectSizeComparable === false && policy.restoresInVivoDimensions === false && policy.infersMissingCoordinates === false && policy.establishesAnatomicalOrientation === false && policy.establishesAtlasRegistration === false, "scale policy creates shared or biological semantics");
  const boundary = contract.scientificBoundary;
  check(boundary.combinedCensusClaim === false && boundary.commonScaleClaim === false && boundary.commonOrientationClaim === false && boundary.sharedCoordinateFrameClaim === false, "source-frame boundary creates a shared frame or census claim");
  check(boundary.atlasPlacementCount === 0 && boundary.atlasTransformCount === 0 && boundary.completeBiologicalAxonClaimCount === 0 && boundary.cutNeuriteRepairCount === 0 && boundary.inferredMissingCoordinateCount === 0 && boundary.restoredInVivoDimensionCount === 0 && boundary.crossSourceIdentityCount === 0 && boundary.sameSpecimenInternalStructureCount === 0 && boundary.renderedInternalPrimitiveCount === 0 && boundary.registrationCount === 0, "source-frame boundary admits unsupported semantics");
  check(contract.records.length === 149 && new Set(contract.records.map((record) => record.neuronId)).size === 149, "source-frame record roster drifted");
  check(contract.records.filter((record) => record.membership.collection === "census").length === 142 && contract.records.filter((record) => record.membership.collection === "supplementary").length === 7, "source-frame membership drifted");
  for (const record of contract.records) {
    check(record.sourceCoordinates.unit === "micrometre_reported_by_source" && record.sourceCoordinates.viewportScaleAuthority === "camera_target_plane_source_local_only" && record.sourceCoordinates.sharedScaleAuthority === false && record.sourceCoordinates.anatomicalOrientationAuthority === false && record.sourceCoordinates.atlasRegistrationAuthority === false, `NMO ${record.neuronId} source-frame authority drifted`);
    check(record.truncation.wholeBiologicalAxonClaim === false && record.truncation.cutNeuriteRepairApplied === false && record.truncation.missingCoordinateInferenceApplied === false && record.truncation.biologicalAbsenceInferredFromMissingReconstruction === false, `NMO ${record.neuronId} truncation boundary drifted`);
  }
}

export async function buildResearchIterationManifest230() {
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const [baseBytes, contractBytes, contractSchemaBytes, contractBuilderBytes, scaleAlgorithmBytes, sourceRegistryBytes, upgradeRegistryBytes, rightsLedgerBytes, packageLockBytes] = await Promise.all([
    readFile(BASE_PATH),
    ...additionalPaths.map((inputPath) => readFile(inputPath)),
    readFile(SOURCE_REGISTRY_PATH),
    readFile(UPGRADE_REGISTRY_PATH),
    readFile(RIGHTS_LEDGER_PATH),
    readFile(PACKAGE_LOCK_PATH),
  ]);
  const base = JSON.parse(baseBytes.toString("utf8"));
  const contract = JSON.parse(contractBytes.toString("utf8"));
  const sourceRegistry = JSON.parse(sourceRegistryBytes.toString("utf8"));
  const upgradeRegistry = JSON.parse(upgradeRegistryBytes.toString("utf8"));
  const packageLock = JSON.parse(packageLockBytes.toString("utf8"));
  const additionalBytes = [contractBytes, contractSchemaBytes, contractBuilderBytes, scaleAlgorithmBytes];

  check(base.releaseId === BASE_RELEASE_ID, "immutable 2.29 parent release identity drifted");
  check(baseBytes.byteLength === BASE_FILE_BYTES && sha256(baseBytes) === BASE_FILE_SHA256, "immutable 2.29 parent file receipt drifted");
  check(base.manifestContentSha256 === BASE_CONTENT_SHA256 && computeManifestContentSha256(base) === BASE_CONTENT_SHA256, "immutable 2.29 parent content drifted");
  additionalBytes.forEach((bytes, index) => {
    const expected = EXPECTED_ADDITIONAL_RECEIPTS[index];
    check(bytes.byteLength === expected.bytes && sha256(bytes) === expected.sha256, `${ADDITIONAL_INPUTS[index].id} receipt drifted`);
  });
  checkContract(contract);
  check(contract.sourceInputs.builder.bytes === EXPECTED_ADDITIONAL_RECEIPTS[2].bytes && contract.sourceInputs.builder.sha256 === EXPECTED_ADDITIONAL_RECEIPTS[2].sha256, "contract builder receipt disagrees with authoritative input");
  check(sourceRegistry.sourceCount === 24 && sourceRegistry.sources.length === 24 && countRecordSets(sourceRegistry) === 28 && countBundledExactRosters(sourceRegistry) === 7, "source-registry denominators drifted");
  check(upgradeRegistry.summary.upgradeCount === 140 && upgradeRegistry.upgrades.length === 140 && upgradeRegistry.upgrades[0]?.id === "UPG-022" && upgradeRegistry.upgrades.at(-1)?.id === "UPG-158", "upgrade-registry denominator or range drifted");
  check(packageLock.version === "2.30.0-research.1" && packageLock.packages?.[""]?.version === "2.30.0-research.1", "package-lock application version drifted");

  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.30.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.30.0";
  manifest.releaseDate = "2026-08-31";
  manifest.application.version = "2.30.0-research.1";
  manifest.parentIterationManifest = { path: "data/research-iteration-manifest-2.29.json", releaseId: BASE_RELEASE_ID, bytes: baseBytes.byteLength, fileSha256: sha256(baseBytes), contentSha256: base.manifestContentSha256 };
  manifest.baseResearchRelease.note = "Iteration 2.30 adds an exact 149-record source-frame disclosure contract and a camera-target-plane source-local micrometre scale algorithm. The frozen 142-record census remains immutable and separate from seven supplementary records. Every scale is local to its own viewport; apparent object size is not comparable across cards. Preparation and truncation wording remains source-grounded. No common frame, inferred coordinate, repaired neurite, restored in-vivo dimension, complete biological axon, internal structure, cross-source identity, registration, project copy or package copy is admitted.";

  const sourceRegistryReceipt = replaceInputReceipt(manifest, "researchSourceRegistry", sourceRegistryBytes);
  const upgradeRegistryReceipt = replaceInputReceipt(manifest, "researchModelUpgradeRegistry", upgradeRegistryBytes);
  replaceInputReceipt(manifest, "rightsLedger", rightsLedgerBytes);
  replaceInputReceipt(manifest, "packageLock", packageLockBytes);
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 42, "research iteration 2.30 must contain exactly 42 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 42 && new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 42, "2.30 authoritative input IDs or paths are not unique");
  manifest.integrity.inputCount = 42;

  const summary = contract.summary;
  const boundary = contract.scientificBoundary;
  manifest.exactReferences.sourceFrameDisclosure = {
    contractId: contract.contractId,
    contractReleaseId: contract.releaseId,
    contractReceipt: { path: ADDITIONAL_INPUTS[0].path, bytes: contractBytes.byteLength, sha256: sha256(contractBytes), contentSha256: contract.contractContentSha256 },
    contractSchemaReceipt: { path: ADDITIONAL_INPUTS[1].path, bytes: contractSchemaBytes.byteLength, sha256: sha256(contractSchemaBytes) },
    builderReceipt: { path: ADDITIONAL_INPUTS[2].path, bytes: contractBuilderBytes.byteLength, sha256: sha256(contractBuilderBytes) },
    scaleAlgorithmReceipt: { path: ADDITIONAL_INPUTS[3].path, bytes: scaleAlgorithmBytes.byteLength, sha256: sha256(scaleAlgorithmBytes), algorithmId: contract.displayScalePolicy.algorithmId },
    frozenCensusRecordCount: summary.frozenCensusRecordCount,
    supplementaryRecordCount: summary.supplementaryRecordCount,
    viewableSourceObjectCount: summary.viewableSourceObjectCount,
    geometry2DCount: summary.geometry2DCount,
    geometry3DCount: summary.geometry3DCount,
    preparationContextConflictCount: summary.preparationContextConflictCount,
    sourceModerateOrIncompleteCount: summary.sourceModerateOrIncompleteCount,
    scaleEligibleRecordCount: summary.scaleEligibleRecordCount,
    displayScalePolicy: structuredClone(contract.displayScalePolicy),
    commonScaleAdmissionCount: summary.commonScaleAdmissionCount,
    inferredMissingCoordinateCount: summary.inferredMissingCoordinateCount,
    repairedCutNeuriteCount: summary.repairedCutNeuriteCount,
    restoredInVivoDimensionCount: summary.restoredInVivoDimensionCount,
    completeBiologicalAxonClaimCount: boundary.completeBiologicalAxonClaimCount,
    sharedCoordinateFrameAdmissionCount: 0,
    sameSpecimenInternalStructureCount: boundary.sameSpecimenInternalStructureCount,
    renderedInternalPrimitiveCount: boundary.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: boundary.crossSourceIdentityCount,
    registrationCount: boundary.registrationCount,
    projectCopyCount: 0,
    packageCopyCount: 0,
  };
  manifest.registrySummary = { canonicalSourcePackageCount: sourceRegistry.sourceCount, canonicalRecordSetCount: countRecordSets(sourceRegistry), bundledExactRosterCount: countBundledExactRosters(sourceRegistry), researchUpgradeCount: upgradeRegistry.summary.upgradeCount, sourceRegistryReceipt, upgradeRegistryReceipt, crossSourceIdentityCount: 0, registrationCount: 0, renderedInternalPrimitiveCount: 0 };
  manifest.scientificBoundaries.sourceFrameDisclosure = "The 149 viewable source objects remain exactly 142 frozen census records plus seven supplementary records, never a combined 149-record census. Micrometre scale is computed independently at each viewport camera target from verified source-local coordinates and a viewer-only uniform transform; it does not establish common scale, apparent-size comparability, orientation, a shared coordinate frame, atlas placement or registration. Preparation, raw shrinkage wording and truncation disclosures remain source-grounded. Missing coordinates are not inferred, cut neurites are not repaired, and in-vivo dimensions are not restored. Complete biological axons, same-specimen internal structures, rendered internal primitives, cross-source identities, registrations, project copies and package copies remain zero.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest230(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest230();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.30 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    frozenCensusRecordCount: built.manifest.exactReferences.sourceFrameDisclosure.frozenCensusRecordCount,
    supplementaryRecordCount: built.manifest.exactReferences.sourceFrameDisclosure.supplementaryRecordCount,
    viewableSourceObjectCount: built.manifest.exactReferences.sourceFrameDisclosure.viewableSourceObjectCount,
    scaleEligibleRecordCount: built.manifest.exactReferences.sourceFrameDisclosure.scaleEligibleRecordCount,
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
