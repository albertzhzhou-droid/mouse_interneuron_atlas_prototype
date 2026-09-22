#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest229 } from "../tools/build_research_iteration_manifest_2_29.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.29.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.29.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.28.json");
const ADAPTER_PATH = path.join(PROJECT_ROOT, "data/supplementary-morphology-comparison-adapter-0.1.json");
const ANALYSIS_DELTA_PATH = path.join(PROJECT_ROOT, "public/data/supplementary_morphology_comparison_v1/analysis-delta.json");
const ASSET_MANIFEST_PATH = path.join(PROJECT_ROOT, "public/data/supplementary_morphology_comparison_v1/asset-manifest.json");
const ASSET_ROOT = path.dirname(ASSET_MANIFEST_PATH);
const EXPECTED_MANIFEST_CONTENT_SHA256 = "069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982";
const EXPECTED_NEURON_IDS = Object.freeze([45674, 45718, 50394, 50408, 50424, 170035, 249676]);

const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.28.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.28.0",
  bytes: 69092,
  fileSha256: "f599acbd6969ba082014b258c098e648014116dc736535265bc7d5c154110b8e",
  contentSha256: "af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173",
});

const EXPECTED_ADDITIONAL_INPUTS = Object.freeze([
  Object.freeze({ id: "supplementaryMorphologyComparisonAdapter", path: "data/supplementary-morphology-comparison-adapter-0.1.json", bytes: 42808, sha256: "f487034457ec2187996f0d3db8935545e64d1ce6783391b668c0747bdf2d5e05" }),
  Object.freeze({ id: "supplementaryMorphologyComparisonAnalysisDelta", path: "public/data/supplementary_morphology_comparison_v1/analysis-delta.json", bytes: 34013, sha256: "b2f90156d9e9eb86cc2dfc72f05a140c6942c802a492274472c86a0c7a29d0df" }),
  Object.freeze({ id: "supplementaryMorphologyComparisonAssetManifest", path: "public/data/supplementary_morphology_comparison_v1/asset-manifest.json", bytes: 3619, sha256: "ab7b2a8fbc458e0871a39819e88007ffe3ad84f6378f87a2a24015484028db6f" }),
  Object.freeze({ id: "supplementaryMorphologyComparisonAdapterSchema", path: "schemas/supplementary-morphology-comparison-adapter-0.1.schema.json", bytes: 24130, sha256: "50b79761fb881468d077a4f18c215fe544601789195c7ffe22e4d74bfeeeace0" }),
]);

const MUTABLE_INHERITED_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(value, expected) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function formatSchemaErrors(errors = []) {
  return errors.map((error) => `${error.instancePath || "/"}: ${error.message ?? "schema violation"}`);
}

async function checkAuthoritativeInputFiles(manifest, errors) {
  const roots = {
    project: path.resolve(PROJECT_ROOT, manifest.inputRoots?.project?.locator ?? "."),
    scientificAuthority: path.resolve(PROJECT_ROOT, manifest.inputRoots?.scientificAuthority?.locator ?? "../interneuron_sci_review"),
  };
  await Promise.all((manifest.authoritativeInputs ?? []).map(async (input) => {
    const root = roots[input.scope];
    if (!root) {
      errors.push(`${input.id} has unsupported input scope ${input.scope}`);
      return;
    }
    const resolved = path.resolve(root, input.path);
    const relative = path.relative(root, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`${input.id} escapes its declared input root`);
      return;
    }
    try {
      const bytes = await readFile(resolved);
      check(bytes.byteLength === input.bytes && sha256(bytes) === input.sha256, `${input.id} on-disk receipt drifted`, errors);
    } catch (error) {
      errors.push(`${input.id} cannot be read: ${error instanceof Error ? error.message : error}`);
    }
  }));
}

async function checkRouteSourceFiles(routeSources, errors) {
  await Promise.all((routeSources ?? []).flatMap((source) => [
    [source.contractPath, source.contractBytes, source.contractSha256, `${source.contractId} contract`],
    [source.assetManifestPath, source.assetManifestBytes, source.assetManifestSha256, `${source.contractId} asset manifest`],
  ]).map(async ([relativePath, expectedBytes, expectedSha256, label]) => {
    const resolved = path.resolve(PROJECT_ROOT, relativePath);
    const relative = path.relative(PROJECT_ROOT, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`${label} escapes the project root`);
      return;
    }
    try {
      const bytes = await readFile(resolved);
      check(bytes.byteLength === expectedBytes && sha256(bytes) === expectedSha256, `${label} on-disk receipt drifted`, errors);
    } catch (error) {
      errors.push(`${label} cannot be read: ${error instanceof Error ? error.message : error}`);
    }
  }));
}

function withoutSupplementaryReference(exactReferences) {
  const clone = structuredClone(exactReferences);
  delete clone.supplementaryMorphologyComparisonAdapter;
  return clone;
}

function withoutSupplementaryBoundary(boundaries) {
  const clone = structuredClone(boundaries);
  delete clone.supplementaryMorphologyComparisonAdapter;
  return clone;
}

export async function validateResearchIterationManifest229(manifestOverride = null) {
  const [manifestBytes, schema, parentBytes, adapterBytes, analysisDeltaBytes, assetManifestBytes] = await Promise.all([
    manifestOverride === null ? readFile(MANIFEST_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
    readFile(ADAPTER_PATH),
    readFile(ANALYSIS_DELTA_PATH),
    readFile(ASSET_MANIFEST_PATH),
  ]);
  const manifest = manifestOverride ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const adapter = JSON.parse(adapterBytes.toString("utf8"));
  const analysisDelta = JSON.parse(analysisDeltaBytes.toString("utf8"));
  const assetManifest = JSON.parse(assetManifestBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...formatSchemaErrors(validateSchema.errors ?? []).map((error) => `schema ${error}`));
  }

  check(manifest.manifestContentSha256 === EXPECTED_MANIFEST_CONTENT_SHA256, "2.29 manifest snapshot content SHA-256 drifted", errors);
  check(manifest.manifestContentSha256 === computeManifestContentSha256(manifest), "manifest content SHA-256 is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.29.0" &&
      manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.29.0" &&
      manifest.releaseDate === "2026-08-31" &&
      manifest.releaseStatus === "localhost_research_iteration" &&
      manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype" &&
      manifest.application?.version === "2.29.0-research.1",
    "2.29 release identity or application version drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, EXPECTED_PARENT), "immutable 2.28 parent receipt drifted", errors);
  check(parentBytes.byteLength === EXPECTED_PARENT.bytes && sha256(parentBytes) === EXPECTED_PARENT.fileSha256 && parent.manifestContentSha256 === EXPECTED_PARENT.contentSha256 && computeManifestContentSha256(parent) === EXPECTED_PARENT.contentSha256, "immutable 2.28 parent file or content drifted", errors);

  if (manifestOverride === null) {
    try {
      const built = await buildResearchIterationManifest229();
      check(manifestBytes.equals(built.bytes), "2.29 manifest differs from deterministic rebuild", errors);
    } catch (error) {
      errors.push(`deterministic 2.29 rebuild failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  check(manifest.integrity?.inputCount === 38 && manifest.authoritativeInputs?.length === 38, "2.29 authoritative-input count changed", errors);
  const parentIds = parent.authoritativeInputs.map((input) => input.id);
  const expectedIds = [...parentIds, ...EXPECTED_ADDITIONAL_INPUTS.map((input) => input.id)];
  check(same(manifest.authoritativeInputs?.map((input) => input.id), expectedIds), "2.29 authoritative-input roster or order changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 38 && new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 38, "2.29 authoritative-input IDs or paths are not unique", errors);
  for (let index = 0; index < parent.authoritativeInputs.length; index += 1) {
    const inherited = parent.authoritativeInputs[index];
    const current = manifest.authoritativeInputs[index];
    check(current?.id === inherited.id && current?.scope === inherited.scope && current?.path === inherited.path && current?.purpose === inherited.purpose, `${inherited.id} inherited input identity drifted`, errors);
    if (!MUTABLE_INHERITED_IDS.has(inherited.id)) {
      check(current?.bytes === inherited.bytes && current?.sha256 === inherited.sha256, `${inherited.id} immutable inherited receipt drifted`, errors);
    }
  }
  const inputs = new Map(manifest.authoritativeInputs?.map((input) => [input.id, input]) ?? []);
  for (const expected of EXPECTED_ADDITIONAL_INPUTS) {
    const input = inputs.get(expected.id);
    check(input?.path === expected.path && input?.bytes === expected.bytes && input?.sha256 === expected.sha256, `${expected.id} authoritative receipt drifted`, errors);
  }
  await checkAuthoritativeInputFiles(manifest, errors);

  check(same(withoutSupplementaryReference(manifest.exactReferences), parent.exactReferences), "an inherited 2.28 exact scientific reference changed", errors);
  check(same(withoutSupplementaryBoundary(manifest.scientificBoundaries), parent.scientificBoundaries), "an inherited 2.28 scientific boundary changed", errors);

  const comparison = manifest.exactReferences?.supplementaryMorphologyComparisonAdapter;
  check(Boolean(comparison), "supplementary morphology comparison reference is missing", errors);
  if (comparison) {
    check(comparison.adapterId === adapter.adapterId && comparison.adapterReleaseId === adapter.releaseId, "supplementary adapter identity drifted", errors);
    check(comparison.adapterReceipt?.bytes === adapterBytes.byteLength && comparison.adapterReceipt?.sha256 === sha256(adapterBytes), "supplementary adapter receipt drifted", errors);
    check(comparison.adapterSchemaReceipt?.bytes === 24130 && comparison.adapterSchemaReceipt?.sha256 === "50b79761fb881468d077a4f18c215fe544601789195c7ffe22e4d74bfeeeace0", "supplementary adapter schema receipt drifted", errors);
    check(comparison.analysisDeltaReceipt?.bytes === analysisDeltaBytes.byteLength && comparison.analysisDeltaReceipt?.sha256 === sha256(analysisDeltaBytes) && comparison.analysisDeltaReceipt?.recordCount === 7 && same(comparison.analysisDeltaReceipt?.neuronIds, EXPECTED_NEURON_IDS), "supplementary analysis-delta receipt or roster drifted", errors);
    check(comparison.assetManifestReceipt?.bytes === assetManifestBytes.byteLength && comparison.assetManifestReceipt?.sha256 === sha256(assetManifestBytes) && comparison.assetManifestReceipt?.declaredPayloadFileCount === 1 && comparison.assetManifestReceipt?.directoryFileCount === 2, "supplementary public asset-manifest receipt or inventory drifted", errors);
    check(same(comparison.sourceCensus, adapter.sourceCensus) && comparison.sourceCensus?.immutable === true && comparison.sourceCensus?.recordCount === 142, "frozen source-census receipt drifted", errors);
    check(comparison.routeSourceCount === 4 && same(comparison.routeSources, adapter.routeSources), "four route-source receipts drifted", errors);
    check(same(comparison.supplementaryNeuronIds, EXPECTED_NEURON_IDS) && same(adapter.records.map((record) => record.neuronId), EXPECTED_NEURON_IDS), "exact seven-neuron supplementary roster drifted", errors);
    check(comparison.frozenCensusRecordCount === 142 && comparison.supplementaryRecordCount === 7 && comparison.viewableSourceObjectCount === 149 && comparison.combinedCensusClaim === false, "comparison must remain 142 census + 7 supplementary = 149 viewable, never a combined census", errors);
    check(comparison.geometryReferenceCount === 7 && comparison.geometryCopyCount === 0 && comparison.swcCopyCount === 0 && comparison.paddingRecordCount === 0, "comparison geometry reference, copy or padding denominator drifted", errors);
    check(comparison.commonScaleAdmissionCount === 0 && comparison.commonOrientationAdmissionCount === 0 && comparison.atlasPlacementCount === 0 && comparison.atlasTransformCount === 0 && comparison.completeAxonClaimCount === 0 && comparison.sameSpecimenInternalStructureCount === 0 && comparison.renderedInternalPrimitiveCount === 0 && comparison.crossSourceIdentityCount === 0 && comparison.registrationCount === 0, "comparison admits scale, orientation, atlas, complete-axon, internal, identity or registration semantics", errors);
    await checkRouteSourceFiles(comparison.routeSources, errors);
  }

  check(adapter.summary?.frozenCensusRecordCount === 142 && adapter.summary?.supplementaryRecordCount === 7 && adapter.summary?.viewableSourceObjectCount === 149 && adapter.summary?.combinedCensusClaim === false, "on-disk adapter denominator drifted", errors);
  check(adapter.summary?.geometryReferenceCount === 7 && adapter.summary?.geometryCopyCount === 0 && adapter.summary?.swcCopyCount === 0 && adapter.summary?.paddingRecordCount === 0 && adapter.summary?.commonScaleAdmissionCount === 0 && adapter.summary?.commonOrientationAdmissionCount === 0 && adapter.summary?.completeAxonClaimCount === 0 && adapter.summary?.sameSpecimenInternalStructureCount === 0 && adapter.summary?.renderedInternalPrimitiveCount === 0 && adapter.summary?.crossSourceIdentityCount === 0 && adapter.summary?.registrationCount === 0, "on-disk adapter creates an unsupported claim", errors);
  check(analysisDelta.summary?.supplementaryRecordCount === 7 && analysisDelta.summary?.geometryReferenceCount === 7 && analysisDelta.summary?.geometryCopyCount === 0 && analysisDelta.summary?.swcCopyCount === 0 && analysisDelta.aggregationPolicy?.cohortCount === 0 && analysisDelta.aggregationPolicy?.crossRecordAggregateCount === 0, "analysis delta copies geometry or creates a cross-record aggregate", errors);
  check(same(analysisDelta.records?.map((record) => record.neuronId), EXPECTED_NEURON_IDS), "analysis-delta seven-neuron roster drifted", errors);
  check(assetManifest.summary?.declaredPayloadFileCount === 1 && assetManifest.summary?.directoryFileCount === 2 && assetManifest.summary?.fullContentCopyCount === 0 && assetManifest.summary?.geometryCopyCount === 0 && assetManifest.summary?.swcCopyCount === 0 && assetManifest.summary?.registrationCount === 0, "public asset manifest creates copied or registered content", errors);
  check(assetManifest.files?.length === 1 && assetManifest.files[0]?.path === "analysis-delta.json" && assetManifest.files[0]?.bytes === analysisDeltaBytes.byteLength && assetManifest.files[0]?.sha256 === sha256(analysisDeltaBytes), "public analysis-delta payload receipt drifted", errors);
  try {
    const publicFiles = (await readdir(ASSET_ROOT)).sort();
    check(same(publicFiles, ["analysis-delta.json", "asset-manifest.json"]), "supplementary public directory must contain exactly its delta and manifest", errors);
  } catch (error) {
    errors.push(`supplementary public directory cannot be read: ${error instanceof Error ? error.message : error}`);
  }

  const representation = manifest.exactReferences?.evidenceAware3dRepresentation;
  const premotor = manifest.exactReferences?.premotorComparisonObservedMorphologyRoutePack;
  check(representation?.representationStateCount === 9 && representation?.routeCount === 16 && representation?.nativeDatSemanticAdmissionCount === 0 && representation?.sameCellElectrophysiologyJoinCount === 0 && representation?.sameSpecimenInternalStructureCount === 0 && representation?.renderedInternalPrimitiveCount === 0 && representation?.crossSourceIdentityCount === 0 && representation?.projectRegistrationCount === 0, "inherited representation contract changed or admits unsupported claims", errors);
  check(premotor?.frozenCensusRecordCount === 142 && premotor?.censusExpansionCount === 0 && premotor?.sourceCompleteAxonCount === 0 && premotor?.nativeDatSemanticAdmissionCount === 0 && premotor?.sameCellElectrophysiologyJoinCount === 0 && premotor?.sameSpecimenInternalStructureCount === 0 && premotor?.renderedInternalPrimitiveCount === 0 && premotor?.exactCrossSourceIdentityCount === 0 && premotor?.projectRegistrationCount === 0, "inherited premotor route changes census or unsupported-claim counts", errors);

  const registry = manifest.registrySummary;
  check(registry?.canonicalSourcePackageCount === 24 && registry?.canonicalRecordSetCount === 28 && registry?.bundledExactRosterCount === 7 && registry?.researchUpgradeCount === 136, "registry denominator changed", errors);
  check(same(registry?.sourceRegistryReceipt, inputs.get("researchSourceRegistry")) && same(registry?.upgradeRegistryReceipt, inputs.get("researchModelUpgradeRegistry")), "registry summary receipts disagree with authoritative inputs", errors);
  check(registry?.crossSourceIdentityCount === 0 && registry?.registrationCount === 0 && registry?.renderedInternalPrimitiveCount === 0 && manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "2.29 creates an identity, registration or internal primitive", errors);

  const boundary = manifest.scientificBoundaries?.supplementaryMorphologyComparisonAdapter ?? "";
  check(/142 immutable census records plus seven supplementary/.test(boundary) && /149 viewable source objects/.test(boundary) && /not a 149-record census/.test(boundary) && /without copying geometry or SWC/.test(boundary) && /common scale, orientation, coordinate frame, atlas placement or registration/.test(boundary) && /complete biological axon/.test(boundary) && /Padding records, same-specimen internals, rendered internal primitives, cross-source identities and registrations remain zero/.test(boundary), "supplementary comparison boundary omits a census, copy, frame, axon, internal, identity or registration limit", errors);

  if (errors.length) throw new Error(`Research iteration 2.29 manifest validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    inputCount: manifest.integrity.inputCount,
    frozenCensusRecordCount: comparison.frozenCensusRecordCount,
    supplementaryRecordCount: comparison.supplementaryRecordCount,
    viewableSourceObjectCount: comparison.viewableSourceObjectCount,
    combinedCensusClaim: comparison.combinedCensusClaim,
    routeSourceCount: comparison.routeSourceCount,
    geometryReferenceCount: comparison.geometryReferenceCount,
    geometryCopyCount: comparison.geometryCopyCount,
    swcCopyCount: comparison.swcCopyCount,
    commonScaleAdmissionCount: comparison.commonScaleAdmissionCount,
    commonOrientationAdmissionCount: comparison.commonOrientationAdmissionCount,
    completeAxonClaimCount: comparison.completeAxonClaimCount,
    crossSourceIdentityCount: registry.crossSourceIdentityCount,
    registrationCount: registry.registrationCount,
    renderedInternalPrimitiveCount: registry.renderedInternalPrimitiveCount,
    researchUpgradeCount: registry.researchUpgradeCount,
    manifestContentSha256: manifest.manifestContentSha256,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest229()
    .then((summary) => process.stdout.write(`Research iteration 2.29 manifest valid: ${summary.inputCount} exact inputs, ${summary.frozenCensusRecordCount} frozen census + ${summary.supplementaryRecordCount} supplementary = ${summary.viewableSourceObjectCount} viewable source objects, ${summary.routeSourceCount} route-source receipts, ${summary.geometryCopyCount} geometry copies, ${summary.swcCopyCount} SWC copies, ${summary.renderedInternalPrimitiveCount} internal primitives and ${summary.registrationCount} registrations.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
