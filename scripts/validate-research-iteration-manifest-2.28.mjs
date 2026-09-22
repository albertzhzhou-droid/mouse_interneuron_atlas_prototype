#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
import { buildResearchIterationManifest228 } from "../tools/build_research_iteration_manifest_2_28.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.28.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.28.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.27.json");
const ASSET_ROOT = path.join(PROJECT_ROOT, "public/data/premotor_comparison_observed_morphology_route_pack_v1");
const EXPECTED_MANIFEST_CONTENT_SHA256 = "af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173";
const ROUTE_ID = "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718";

const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.27.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.27.0",
  bytes: 56245,
  fileSha256: "88560df20ed43c2cb3e002f654a8919b24967fefe25de70ae421b5b9ae71d233",
  contentSha256: "d1d0d3420f4bd72e45e50f32e31ff02c81e9bf16594ba468f41f36215221943d",
});

const EXPECTED_ADDITIONAL_IDS = Object.freeze([
  "premotorComparisonObservedMorphologyRoutePackContract",
  "premotorComparisonObservedMorphologyAssetManifest",
  "evidenceAware3dRepresentationContract05",
  "premotorComparisonObservedMorphologyRoutePackSchema",
]);
const MUTABLE_INHERITED_IDS = new Set([
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
]);
const EXPECTED_STATE_IDS = Object.freeze([
  "OBS_RAW_TEXTURE",
  "OBS_SEGMENTED_SURFACE",
  "OBS_SKELETON",
  "OBS_POINT",
  "DER_RADIUS_SURFACE",
  "INF_REFERENCE_GEOMETRY",
  "SCH_PATH",
  "SYN_DATA_GLYPH",
  "UNAVAILABLE",
]);
const EXPECTED_SOURCE_RECEIPTS = Object.freeze({
  metadataReceipt: Object.freeze({ bytes: 1513, sha256: "ac769a76e959d093a0468d345356256627b0ccd5536334f7b943734521b55407" }),
  morphometryReceipt: Object.freeze({ bytes: 473, sha256: "d999e37d9b94650415fd50e795ff0b43af24045e95a87c43c1b5e2ee57dda38a" }),
  geometryReceipt: Object.freeze({ bytes: 615468, sha256: "c5193dbca4f17bb945a034196dd7dee130096502c71e01b6e5aedacfcade8865" }),
  swcReceipt: Object.freeze({ bytes: 214337, sha256: "c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee" }),
  originalDatReceipt: Object.freeze({ bytes: 343774, sha256: "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415" }),
});

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

async function checkAssetFiles(pack, errors) {
  await Promise.all((pack?.assetManifestReceipt?.files ?? []).map(async (file) => {
    const resolved = path.resolve(ASSET_ROOT, file.path);
    const relative = path.relative(ASSET_ROOT, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`NMO 45718 asset ${file.path} escapes its asset root`);
      return;
    }
    try {
      const bytes = await readFile(resolved);
      check(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `NMO 45718 asset ${file.path} on-disk receipt drifted`, errors);
    } catch (error) {
      errors.push(`NMO 45718 asset ${file.path} cannot be read: ${error instanceof Error ? error.message : error}`);
    }
  }));
}

export async function validateResearchIterationManifest228(manifestOverride = null) {
  const [manifestBytes, schema, parentBytes] = await Promise.all([
    manifestOverride === null ? readFile(MANIFEST_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
  ]);
  const manifest = manifestOverride ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...formatSchemaErrors(validateSchema.errors ?? []).map((error) => `schema ${error}`));
  }

  check(manifest.manifestContentSha256 === EXPECTED_MANIFEST_CONTENT_SHA256, "2.28 manifest snapshot content SHA-256 drifted", errors);
  check(manifest.manifestContentSha256 === computeManifestContentSha256(manifest), "manifest content SHA-256 is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.28.0" &&
      manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.28.0" &&
      manifest.releaseDate === "2026-08-31" &&
      manifest.releaseStatus === "localhost_research_iteration" &&
      manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype" &&
      manifest.application?.version === "2.28.0-research.1",
    "2.28 release identity or application version drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, EXPECTED_PARENT), "immutable 2.27 parent receipt drifted", errors);
  check(parentBytes.byteLength === EXPECTED_PARENT.bytes && sha256(parentBytes) === EXPECTED_PARENT.fileSha256 && parent.manifestContentSha256 === EXPECTED_PARENT.contentSha256 && computeManifestContentSha256(parent) === EXPECTED_PARENT.contentSha256, "immutable 2.27 parent file or content drifted", errors);

  if (manifestOverride === null) {
    try {
      const built = await buildResearchIterationManifest228();
      check(manifestBytes.equals(built.bytes), "2.28 manifest differs from deterministic rebuild", errors);
    } catch (error) {
      errors.push(`deterministic 2.28 rebuild failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  check(manifest.integrity?.inputCount === 34 && manifest.authoritativeInputs?.length === 34, "2.28 authoritative-input count changed", errors);
  const parentIds = parent.authoritativeInputs.map((input) => input.id);
  const expectedIds = [...parentIds, ...EXPECTED_ADDITIONAL_IDS];
  check(same(manifest.authoritativeInputs?.map((input) => input.id), expectedIds), "2.28 authoritative-input roster or order changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 34 && new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 34, "2.28 authoritative-input IDs or paths are not unique", errors);
  for (let index = 0; index < parent.authoritativeInputs.length; index += 1) {
    const inherited = parent.authoritativeInputs[index];
    const current = manifest.authoritativeInputs[index];
    check(current?.id === inherited.id && current?.scope === inherited.scope && current?.path === inherited.path && current?.purpose === inherited.purpose, `${inherited.id} inherited input identity drifted`, errors);
    if (!MUTABLE_INHERITED_IDS.has(inherited.id)) {
      check(current?.bytes === inherited.bytes && current?.sha256 === inherited.sha256, `${inherited.id} immutable inherited receipt drifted`, errors);
    }
  }
  await checkAuthoritativeInputFiles(manifest, errors);

  const inputs = new Map(manifest.authoritativeInputs?.map((input) => [input.id, input]) ?? []);
  check(inputs.get("premotorComparisonObservedMorphologyRoutePackContract")?.bytes === 19112 && inputs.get("premotorComparisonObservedMorphologyRoutePackContract")?.sha256 === "39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3", "premotor-comparison contract authoritative receipt drifted", errors);
  check(inputs.get("premotorComparisonObservedMorphologyAssetManifest")?.bytes === 1647 && inputs.get("premotorComparisonObservedMorphologyAssetManifest")?.sha256 === "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8", "premotor-comparison asset-manifest authoritative receipt drifted", errors);
  check(inputs.get("evidenceAware3dRepresentationContract05")?.bytes === 23381 && inputs.get("evidenceAware3dRepresentationContract05")?.sha256 === "94085465117e4cbc70763ea78f931cfb17d3f99c5dc907a3fe4556ef1063dbed", "representation 0.5 authoritative receipt drifted", errors);
  check(inputs.get("premotorComparisonObservedMorphologyRoutePackSchema")?.bytes === 13685 && inputs.get("premotorComparisonObservedMorphologyRoutePackSchema")?.sha256 === "3922062699463bad90e41ec6d5a64d07f949b62a6fd77f03540130d8d2602b15", "premotor-comparison route schema authoritative receipt drifted", errors);

  const pack = manifest.exactReferences?.premotorComparisonObservedMorphologyRoutePack;
  check(Boolean(pack), "premotor-comparison route-pack reference is missing", errors);
  if (pack) {
    check(pack.contractId === "premotor-comparison-observed-morphology-route-pack-0.1" && pack.contractReceipt?.bytes === 19112 && pack.contractReceipt?.sha256 === "39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3" && pack.routeSchemaReceipt?.bytes === 13685 && pack.routeSchemaReceipt?.sha256 === "3922062699463bad90e41ec6d5a64d07f949b62a6fd77f03540130d8d2602b15", "premotor-comparison contract or schema receipt drifted", errors);
    check(pack.routeCount === 1 && pack.uniqueNeuronCount === 1 && same(pack.neuronIds, [45718]) && same(pack.supplementaryNeuronIds, [45718]), "NMO 45718 route or neuron roster changed", errors);
    check(pack.preMergeUniqueMorphologyCount === 12 && pack.activeUniqueMorphologyCount === 13 && pack.preExistingNamedRouteCount === 9 && pack.namedRouteCount === 10 && pack.namedDorsalHornRouteCount === 8 && pack.namedVentralHornRouteCount === 2 && pack.frozenExemplarCount === 5 && pack.frozenCensusRecordCount === 142 && pack.censusExpansionCount === 0, "NMO 45718 merge arithmetic or frozen denominator changed", errors);
    check(pack.sourceDiameterAvailableCount === 1 && pack.observedAxonRouteCount === 1 && pack.sourceCompleteAxonCount === 0 && pack.originalDatReceiptCount === 1 && pack.nativeDatSemanticAdmissionCount === 0 && pack.sameCellElectrophysiologyJoinCount === 0 && pack.sameSpecimenInternalStructureCount === 0 && pack.renderedInternalPrimitiveCount === 0 && pack.definitiveRenshawExclusionClaimCount === 0 && pack.paperKeyedPremotorIdentityClaimCount === 0 && pack.individualCalbindinAssayClaimCount === 0 && pack.shrinkageRestoredInVivoClaimCount === 0 && pack.exactCrossSourceIdentityCount === 0 && pack.projectRegistrationCount === 0, "NMO 45718 pack creates an unsupported biological, geometry, identity or registration claim", errors);
    check(pack.assetManifestReceipt?.bytes === 1647 && pack.assetManifestReceipt?.sha256 === "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8" && pack.assetManifestReceipt?.fileCount === 5 && pack.assetManifestReceipt?.files?.length === 5 && same(pack.assetManifestReceipt?.files?.map((file) => file.kind), ["official_api_snapshot", "lazy_geometry", "official_morphometry_snapshot", "source_native_dat_receipt_only", "standardized_swc"]), "NMO 45718 asset inventory changed", errors);
    const route = pack.routeMemberships?.[0];
    check(pack.routeMemberships?.length === 1 && route?.routeId === ROUTE_ID && route?.neuronId === 45718 && route?.assetId === "NeuroMorpho:45718" && route?.neuronName === "101026p1-A-In" && same(route?.cellTypeLabels, ["Calbindin (CB)-negative", "glycinergic", "pre-motor", "non-renshaw", "interneuron"]), "NMO 45718 identity or repository labels changed", errors);
    check(route?.nodeCount === 5636 && route?.segmentCount === 5635 && same(route?.nodeTypeCounts, { "1": 8, "2": 4237, "3": 1391 }) && same(route?.boundsMicrometre, { min: [-436.01, -264.19, -200], max: [251.84, 289.81, 28] }) && same(route?.extentMicrometre, [687.85, 554, 228]) && route?.canonicalGeometrySha256 === "08514c7c924c2b1ff444eb45f43e89ab1633bce64dc1618be148617e80de52a3" && route?.topologySha256 === "7fb6e4ed99208c66fa323a297bd85c800f3cbbe340baafcf7f0312832dda5af9", "NMO 45718 exact geometry or topology changed", errors);
    for (const [key, expected] of Object.entries(EXPECTED_SOURCE_RECEIPTS)) {
      check(route?.[key]?.bytes === expected.bytes && route?.[key]?.sha256 === expected.sha256, `NMO 45718 ${key} changed`, errors);
    }
    check(route?.repositoryLabelOnly === true && route?.definitiveRenshawExclusionClaim === false && route?.paperKeyedPremotorIdentityClaim === false && route?.individualCalbindinAssayClaim === false && route?.individualSexClaim === false && route?.preparationJoinStatus === "context_only_not_exact_stage_equivalence" && route?.shrinkageReported === "Reported" && route?.shrinkageCorrected === "Not Corrected" && route?.shrinkageRestoredInVivoClaim === false, "NMO 45718 label, sex, preparation or shrinkage boundary changed", errors);
    check(route?.completeAxonClaim === false && route?.originalContourCount === 8 && route?.standardizedSomaPointCount === 8 && route?.nativeContourVerticesAdmitted === false && route?.standardizedSomaMembraneClaim === false && route?.nativeDatParsed === false && route?.nativeDatRendered === false && route?.nativeDatSemanticObjectCount === 0 && route?.paperMentionsExactNeuronIdOrFilename === false && route?.sameCellElectrophysiologyJoinStatus === "not_established" && route?.individualMolecularAssayClaim === false && route?.internalPrimitiveCount === 0 && route?.crossSourceIdentityCount === 0 && route?.projectRegistrationCount === 0, "NMO 45718 admits unsupported axon, soma, DAT, physiology, internal, identity or registration semantics", errors);
    await checkAssetFiles(pack, errors);
  }

  const representation = manifest.exactReferences?.evidenceAware3dRepresentation;
  check(representation?.contractId === "evidence-aware-3d-representation-contract-0.5" && representation?.deterministicMaterializationReceipt?.bytes === 23381 && representation?.deterministicMaterializationReceipt?.sha256 === "94085465117e4cbc70763ea78f931cfb17d3f99c5dc907a3fe4556ef1063dbed" && representation?.representationStateCount === 9 && same(representation?.representationStateIds, EXPECTED_STATE_IDS) && representation?.routeCount === 16 && representation?.routeIds?.length === 16 && representation?.routeIds?.at(-1) === ROUTE_ID, "representation 0.5 receipt, state roster or route roster changed", errors);
  check(representation?.legacyDorsalHornPackRouteCount === 4 && representation?.functionalClassRouteCount === 2 && representation?.prpDorsalHornRouteCount === 2 && representation?.premotorComparisonRouteCount === 1 && same(representation?.premotorComparisonRouteIds, [ROUTE_ID]) && representation?.namedDorsalHornRouteCount === 8 && representation?.namedVentralHornRouteCount === 2, "representation route-subgroup denominators changed", errors);
  check(same(representation?.internalReferenceStateIds, ["UNAVAILABLE"]) && representation?.internalReferenceRenderedPrimitivePolicy === "zero_primitives" && representation?.proceduralBiologicalProxyAllowed === false && representation?.missingLayerPrimitiveCount === 0 && representation?.nativeDatSemanticAdmissionCount === 0 && representation?.sameCellElectrophysiologyJoinCount === 0 && representation?.sameSpecimenInternalStructureCount === 0 && representation?.renderedInternalPrimitiveCount === 0 && representation?.crossSourceIdentityCount === 0 && representation?.projectRegistrationCount === 0, "representation admits a proxy, DAT object, physiology join, internal primitive, identity or registration", errors);

  const registry = manifest.registrySummary;
  check(registry?.canonicalSourcePackageCount === 24 && registry?.canonicalRecordSetCount === 28 && registry?.bundledExactRosterCount === 7 && registry?.researchUpgradeCount === 131, "registry denominator changed", errors);
  check(same(registry?.sourceRegistryReceipt, inputs.get("researchSourceRegistry")) && same(registry?.upgradeRegistryReceipt, inputs.get("researchModelUpgradeRegistry")), "registry summary receipts disagree with authoritative inputs", errors);
  check(registry?.crossSourceIdentityCount === 0 && registry?.registrationCount === 0 && registry?.renderedInternalPrimitiveCount === 0 && manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "2.28 creates an identity, registration or internal primitive", errors);

  const boundary = manifest.scientificBoundaries?.premotorComparisonObservedMorphologyRoutePack ?? "";
  check(/NMO 45718/.test(boundary) && /calbindin washout/.test(boundary) && /need not be premotor/.test(boundary) && /not independently verified/.test(boundary) && /400-micrometre transverse/.test(boundary) && /50-micrometre serial resectioning/.test(boundary) && /not restored in-vivo dimensions/.test(boundary) && /standardized soma points/.test(boundary) && /Native DAT semantics/.test(boundary) && /complete axons/.test(boundary) && /same-specimen internals/.test(boundary) && /registrations remain zero/.test(boundary), "NMO 45718 scientific boundary omits a label, preparation, shrinkage, soma, DAT, axon, internal or registration limit", errors);

  if (errors.length) throw new Error(`Research iteration 2.28 manifest validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    inputCount: manifest.integrity.inputCount,
    frozenExemplarCount: pack.frozenExemplarCount,
    censusRecordCount: pack.frozenCensusRecordCount,
    premotorComparisonRouteCount: pack.routeCount,
    activeUniqueMorphologyCount: pack.activeUniqueMorphologyCount,
    namedRouteCount: pack.namedRouteCount,
    namedDorsalHornRouteCount: pack.namedDorsalHornRouteCount,
    namedVentralHornRouteCount: pack.namedVentralHornRouteCount,
    representationStateCount: representation.representationStateCount,
    representationRouteCount: representation.routeCount,
    sourcePackageCount: registry.canonicalSourcePackageCount,
    recordSetCount: registry.canonicalRecordSetCount,
    bundledExactRosterCount: registry.bundledExactRosterCount,
    researchUpgradeCount: registry.researchUpgradeCount,
    nativeDatSemanticAdmissionCount: pack.nativeDatSemanticAdmissionCount,
    sameCellElectrophysiologyJoinCount: pack.sameCellElectrophysiologyJoinCount,
    crossSourceIdentityCount: registry.crossSourceIdentityCount,
    registrationCount: registry.registrationCount,
    renderedInternalPrimitiveCount: registry.renderedInternalPrimitiveCount,
    manifestContentSha256: manifest.manifestContentSha256,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest228()
    .then((summary) => process.stdout.write(`Research iteration 2.28 manifest valid: ${summary.inputCount} exact inputs, ${summary.sourcePackageCount} source packages, ${summary.recordSetCount} record sets, ${summary.bundledExactRosterCount} bundled exact rosters, ${summary.researchUpgradeCount} upgrades, ${summary.premotorComparisonRouteCount} NMO 45718 comparison route, ${summary.activeUniqueMorphologyCount} active unique morphologies, ${summary.namedRouteCount} named routes, ${summary.representationRouteCount} representation routes, ${summary.nativeDatSemanticAdmissionCount} DAT semantic admissions, ${summary.renderedInternalPrimitiveCount} internal primitives and ${summary.registrationCount} registrations.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
