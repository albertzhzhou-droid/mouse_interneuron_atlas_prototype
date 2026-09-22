#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildEvidenceAware3dRepresentationContract05 } from "./build_evidence_aware_3d_representation_contract_0_5.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.28.json");
const BASE_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.27.json");
const SOURCE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");
const RIGHTS_LEDGER_PATH = path.join(PROJECT_ROOT, "docs/RIGHTS_LEDGER.csv");
const PACKAGE_LOCK_PATH = path.join(PROJECT_ROOT, "package-lock.json");

const BASE_RELEASE_ID = "ohri-mouse-interneuron-research-iteration-2.27.0";
const BASE_CONTENT_SHA256 = "d1d0d3420f4bd72e45e50f32e31ff02c81e9bf16594ba468f41f36215221943d";
const BASE_FILE_BYTES = 56245;
const BASE_FILE_SHA256 = "88560df20ed43c2cb3e002f654a8919b24967fefe25de70ae421b5b9ae71d233";
const ROUTE_ID = "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718";
const ROUTE_PACK_FILE_BYTES = 19112;
const ROUTE_PACK_FILE_SHA256 = "39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3";
const ASSET_MANIFEST_FILE_BYTES = 1647;
const ASSET_MANIFEST_FILE_SHA256 = "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8";
const REPRESENTATION_FILE_BYTES = 23381;
const REPRESENTATION_FILE_SHA256 = "94085465117e4cbc70763ea78f931cfb17d3f99c5dc907a3fe4556ef1063dbed";
const ROUTE_SCHEMA_FILE_BYTES = 13685;
const ROUTE_SCHEMA_FILE_SHA256 = "3922062699463bad90e41ec6d5a64d07f949b62a6fd77f03540130d8d2602b15";

const ADDITIONAL_INPUTS = Object.freeze([
  {
    id: "premotorComparisonObservedMorphologyRoutePackContract",
    scope: "project",
    path: "data/premotor-comparison-observed-morphology-route-pack-0.1.json",
    purpose: "Checksum-pinned NMO 45718 source-local ventral-horn comparison route with repository-label, preparation, shrinkage, soma-standardization, DAT, physiology, internal-detail, identity and registration boundaries",
  },
  {
    id: "premotorComparisonObservedMorphologyAssetManifest",
    scope: "project",
    path: "public/data/premotor_comparison_observed_morphology_route_pack_v1/asset-manifest.json",
    purpose: "Delta-only exact metadata, morphometry, SWC, receipt-only DAT and lazy-geometry inventory for NMO 45718",
  },
  {
    id: "evidenceAware3dRepresentationContract05",
    scope: "project",
    path: "data/evidence-aware-3d-representation-contract-0.5.json",
    purpose: "Nine-state, sixteen-route evidence-aware representation contract including the exact NMO 45718 comparison route",
  },
  {
    id: "premotorComparisonObservedMorphologyRoutePackSchema",
    scope: "project",
    path: "schemas/premotor-comparison-observed-morphology-route-pack-0.1.schema.json",
    purpose: "JSON Schema for the NMO 45718 premotor-comparison observed-morphology route pack",
  },
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

function routeMembership(route) {
  const source = route.sourceRecord;
  const geometry = route.geometryReceipt;
  const soma = route.somaStandardizationReceipt;
  const identity = route.identityBoundary;
  const internals = route.renderingContract.sameSpecimenInternalStructure;
  return {
    routeId: route.routeId,
    neuronId: source.neuronId,
    assetId: source.assetId,
    neuronName: source.neuronName,
    title: route.title,
    sourceAuthority: route.sourceAuthority,
    censusMembership: route.censusMembership,
    species: source.species,
    ageDaysMinimum: source.numericAge.minimum,
    ageDaysMaximum: source.numericAge.maximum,
    repositorySexRaw: source.sex,
    individualSexClaim: false,
    repositoryStrainRaw: source.repositoryStrainRaw,
    strainJoinStatus: source.strainJoinStatus,
    repositoryWeightMinimumGrams: source.repositoryWeightGrams.minimum,
    repositoryWeightMaximumGrams: source.repositoryWeightGrams.maximum,
    repositoryWeightValidForBiologicalInterpretation: source.repositoryWeightGrams.validForBiologicalInterpretation,
    regionLabels: structuredClone(source.regionLabels),
    cellTypeLabels: structuredClone(source.cellTypeLabels),
    repositoryLabelOnly: true,
    definitiveRenshawExclusionClaim: false,
    paperKeyedPremotorIdentityClaim: false,
    individualCalbindinAssayClaim: false,
    protocol: source.protocol,
    repositorySlicingDirection: source.repositorySlicingDirection,
    repositorySlicingThicknessMicrometre: source.repositorySlicingThicknessMicrometre,
    preparationJoinStatus: source.preparationJoinStatus,
    physicalIntegrity: source.physicalIntegrity,
    shrinkageReported: source.shrinkageReported,
    shrinkageCorrected: source.shrinkageCorrected,
    shrinkageRestoredInVivoClaim: false,
    sourcePaperDoi: source.sourcePaperDoi,
    sourcePaperPmid: source.sourcePaperPmid,
    sourceFrame: geometry.sourceFrame,
    registrationStatus: geometry.registrationStatus,
    nodeCount: geometry.nodeCount,
    segmentCount: geometry.segmentCount,
    nodeTypeCounts: structuredClone(geometry.nodeTypeCounts),
    boundsMicrometre: structuredClone(geometry.boundsMicrometre),
    extentMicrometre: structuredClone(geometry.extentMicrometre),
    repositoryMorphometry: structuredClone(geometry.repositoryMorphometry),
    canonicalGeometrySha256: geometry.canonicalGeometrySha256,
    topologySha256: geometry.topologySha256,
    metadataReceipt: structuredClone(route.sourceObjects.metadata),
    morphometryReceipt: structuredClone(route.sourceObjects.morphometry),
    geometryReceipt: structuredClone(route.sourceObjects.geometry),
    swcReceipt: structuredClone(route.sourceObjects.swc),
    originalDatReceipt: structuredClone(route.sourceObjects.originalDat),
    sourceDiameterAvailable: geometry.sourceDiameterAvailable,
    observedAxonNodeCount: geometry.nodeTypeCounts["2"] ?? 0,
    completeAxonClaim: route.fidelityRecord.axon.completeAxon,
    originalContourCount: soma.originalContourCount,
    standardizedSomaPointCount: soma.standardizedSomaPointCount,
    nativeContourVerticesAdmitted: soma.nativeContourVerticesAdmitted,
    standardizedSomaMembraneClaim: soma.membraneClaim,
    nativeDatParsed: route.nativeDatContract.parsed,
    nativeDatRendered: route.nativeDatContract.rendered,
    nativeDatSemanticObjectCount: route.nativeDatContract.semanticObjectCountAdmitted,
    paperMentionsExactNeuronIdOrFilename: identity.paperMentionsExactNeuronIdOrFilename,
    sameCellElectrophysiologyJoinStatus: identity.sameCellElectrophysiologyJoinStatus,
    individualMolecularAssayClaim: identity.individualMolecularAssayClaim,
    internalPrimitiveCount: internals.renderedPrimitiveCount,
    crossSourceIdentityCount: identity.crossSourceIdentityCount,
    projectRegistrationCount: identity.projectRegistrationCount,
  };
}

export function serializeResearchIterationManifest228(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest228() {
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const [
    baseBytes,
    routePackBytes,
    assetManifestBytes,
    representationBytes,
    routeSchemaBytes,
    sourceRegistryBytes,
    upgradeRegistryBytes,
    rightsLedgerBytes,
    packageLockBytes,
    representationBuild,
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
    buildEvidenceAware3dRepresentationContract05(),
  ]);

  const base = JSON.parse(baseBytes.toString("utf8"));
  const routePack = JSON.parse(routePackBytes.toString("utf8"));
  const assetManifest = JSON.parse(assetManifestBytes.toString("utf8"));
  const representation = JSON.parse(representationBytes.toString("utf8"));
  const sourceRegistry = JSON.parse(sourceRegistryBytes.toString("utf8"));
  const upgradeRegistry = JSON.parse(upgradeRegistryBytes.toString("utf8"));
  const packageLock = JSON.parse(packageLockBytes.toString("utf8"));

  check(base.releaseId === BASE_RELEASE_ID, "immutable 2.27 base release identity drifted");
  check(baseBytes.byteLength === BASE_FILE_BYTES && sha256(baseBytes) === BASE_FILE_SHA256, "immutable 2.27 base file bytes drifted");
  check(base.manifestContentSha256 === BASE_CONTENT_SHA256 && computeManifestContentSha256(base) === BASE_CONTENT_SHA256, "immutable 2.27 base content drifted");
  check(routePackBytes.byteLength === ROUTE_PACK_FILE_BYTES && sha256(routePackBytes) === ROUTE_PACK_FILE_SHA256, "premotor-comparison route-pack receipt drifted");
  check(assetManifestBytes.byteLength === ASSET_MANIFEST_FILE_BYTES && sha256(assetManifestBytes) === ASSET_MANIFEST_FILE_SHA256, "premotor-comparison asset-manifest receipt drifted");
  check(representationBytes.byteLength === REPRESENTATION_FILE_BYTES && sha256(representationBytes) === REPRESENTATION_FILE_SHA256, "representation 0.5 receipt drifted");
  check(routeSchemaBytes.byteLength === ROUTE_SCHEMA_FILE_BYTES && sha256(routeSchemaBytes) === ROUTE_SCHEMA_FILE_SHA256, "premotor-comparison route schema receipt drifted");
  check(representationBytes.equals(representationBuild.bytes), "representation 0.5 differs from its deterministic rebuild");

  check(routePack.contractId === "premotor-comparison-observed-morphology-route-pack-0.1" && routePack.routes.length === 1, "unexpected premotor-comparison route-pack identity or denominator");
  const route = routePack.routes[0];
  check(route.routeId === ROUTE_ID && route.sourceRecord.neuronId === 45718 && route.sourceRecord.neuronName === "101026p1-A-In", "NMO 45718 route identity drifted");
  check(same(route.sourceRecord.cellTypeLabels, ["Calbindin (CB)-negative", "glycinergic", "pre-motor", "non-renshaw", "interneuron"]), "NMO 45718 repository-label receipt drifted");
  check(route.sourceRecord.sourcePaperDoi === "10.1523/JNEUROSCI.0199-14.2014" && route.sourceRecord.sourcePaperPmid === "25232126", "NMO 45718 paper receipt drifted");
  check(route.sourceRecord.repositorySlicingDirection === "horizontal" && route.sourceRecord.repositorySlicingThicknessMicrometre === 50 && route.sourceRecord.preparationJoinStatus === "context_only_not_exact_stage_equivalence", "NMO 45718 repository preparation boundary drifted");
  check(route.sourceRecord.paperPreparationContext.includes("400 micrometre transverse") && route.sourceRecord.paperPreparationContext.includes("50 micrometre serial resectioning") && route.sourceRecord.paperPreparationContext.includes("no NMO or filename crosswalk"), "NMO 45718 paper preparation boundary drifted");
  check(route.sourceRecord.shrinkageReported === "Reported" && route.sourceRecord.shrinkageCorrected === "Not Corrected", "NMO 45718 shrinkage boundary drifted");
  check(route.geometryReceipt.nodeCount === 5636 && route.geometryReceipt.segmentCount === 5635 && same(route.geometryReceipt.nodeTypeCounts, { "1": 8, "2": 4237, "3": 1391 }), "NMO 45718 topology denominator drifted");
  check(same(route.geometryReceipt.boundsMicrometre, { min: [-436.01, -264.19, -200], max: [251.84, 289.81, 28] }) && same(route.geometryReceipt.extentMicrometre, [687.85, 554, 228]), "NMO 45718 geometry bounds drifted");
  check(route.geometryReceipt.canonicalGeometrySha256 === "08514c7c924c2b1ff444eb45f43e89ab1633bce64dc1618be148617e80de52a3" && route.geometryReceipt.topologySha256 === "7fb6e4ed99208c66fa323a297bd85c800f3cbbe340baafcf7f0312832dda5af9", "NMO 45718 geometry identity drifted");
  check(route.somaStandardizationReceipt.originalContourCount === 8 && route.somaStandardizationReceipt.standardizedSomaPointCount === 8 && route.somaStandardizationReceipt.nativeContourVerticesAdmitted === false && route.somaStandardizationReceipt.membraneClaim === false, "NMO 45718 soma standardization boundary drifted");
  check(route.fidelityRecord.axon.completeAxon === false && route.nativeDatContract.parsed === false && route.nativeDatContract.rendered === false && route.nativeDatContract.semanticObjectCountAdmitted === 0, "NMO 45718 creates a complete-axon or DAT-semantic claim");
  check(route.identityBoundary.paperMentionsExactNeuronIdOrFilename === false && route.identityBoundary.sameCellElectrophysiologyJoinStatus === "not_established" && route.identityBoundary.individualMolecularAssayClaim === false && route.identityBoundary.crossSourceIdentityCount === 0 && route.identityBoundary.projectRegistrationCount === 0, "NMO 45718 creates an exact paper, physiology, molecular, identity or registration join");
  check(route.renderingContract.sameSpecimenInternalStructure.available === false && route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, "NMO 45718 creates same-specimen internal primitives");
  check(route.hardBoundaries.some((boundary) => boundary.includes("washout") && boundary.includes("not necessarily premotor")), "NMO 45718 washout or premotor non-promotion boundary is missing");
  check(route.hardBoundaries.some((boundary) => boundary.includes("shrinkage-restored in-vivo dimensions")), "NMO 45718 shrinkage non-restoration boundary is missing");
  check(route.hardBoundaries.some((boundary) => boundary.includes("8 original soma contours") && boundary.includes("not a membrane")), "NMO 45718 soma contour boundary is missing");
  check(routePack.summary.sourceCompleteAxonCount === 0 && routePack.summary.nativeDatSemanticAdmissionCount === 0 && routePack.summary.sameCellElectrophysiologyJoinCount === 0 && routePack.summary.sameSpecimenInternalStructureCount === 0 && routePack.summary.renderedInternalPrimitiveCount === 0 && routePack.summary.exactCrossSourceIdentityCount === 0 && routePack.summary.projectRegistrationCount === 0, "premotor-comparison pack creates an unsupported claim");
  check(routePack.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount === 12 && routePack.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount === 13 && routePack.runtimeMergePolicy.preExistingNamedRouteCount === 9 && routePack.runtimeMergePolicy.postMergeNamedRouteCount === 10 && routePack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount === 8 && routePack.runtimeMergePolicy.postMergeNamedVentralHornRouteCount === 2 && routePack.runtimeMergePolicy.frozenCensusRecordCount === 142 && routePack.runtimeMergePolicy.censusExpansionCount === 0, "premotor-comparison runtime merge arithmetic drifted");
  check(assetManifest.assetSetId === "neuromorpho:8.6.124:premotor-comparison-observed-morphology-route-pack-v1" && assetManifest.summary.fileCount === 5 && assetManifest.files.length === 5 && assetManifest.summary.nativeDatSemanticAdmissionCount === 0 && assetManifest.summary.registrationCount === 0, "premotor-comparison asset manifest summary drifted");
  check(same(assetManifest.files.map((file) => file.kind), ["official_api_snapshot", "lazy_geometry", "official_morphometry_snapshot", "source_native_dat_receipt_only", "standardized_swc"]), "premotor-comparison asset kind inventory drifted");
  check(representation.contractId === "evidence-aware-3d-representation-contract-0.5" && representation.representationStates.length === 9 && representation.routes.length === 16 && representation.routes.at(-1)?.routeId === ROUTE_ID, "representation 0.5 state, route denominator or appended route drifted");
  check(sourceRegistry.sourceCount === 24 && sourceRegistry.sources.length === 24 && countRecordSets(sourceRegistry) === 28 && countBundledExactRosters(sourceRegistry) === 7, "source-registry denominators drifted");
  check(upgradeRegistry.summary.upgradeCount === 131 && upgradeRegistry.upgrades.length === 131, "upgrade-registry denominator drifted");
  check(packageLock.version === "2.28.0-research.1" && packageLock.packages?.[""]?.version === "2.28.0-research.1", "package-lock application version drifted");

  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.28.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.28.0";
  manifest.releaseDate = "2026-08-31";
  manifest.application.version = "2.28.0-research.1";
  manifest.parentIterationManifest = {
    path: "data/research-iteration-manifest-2.27.json",
    releaseId: BASE_RELEASE_ID,
    bytes: baseBytes.byteLength,
    fileSha256: sha256(baseBytes),
    contentSha256: base.manifestContentSha256,
  };
  manifest.baseResearchRelease.note = "The seven SCI evidence entities, five frozen observed-cell exemplars and 142-record census remain unchanged. Iteration 2.28 adds exact source-local NMO 45718 as a repository-labelled calbindin-negative, glycinergic, premotor / non-Renshaw comparison route. Deduplication yields thirteen active unique morphologies and ten named spinal routes: eight dorsal-horn and two ventral-horn. Nine evidence states span sixteen routes. Repository labels are not promoted to a paper-keyed calbindin assay, definitive premotor identity or Renshaw exclusion. The 50-micrometre horizontal repository field is not collapsed with the paper's 400-micrometre transverse recording stage and 50-micrometre serial resectioning. Uncorrected shrinkage, averaged soma points, native DAT bytes, moderate axon integrity and co-display do not create restored dimensions, membrane geometry, semantic objects, exact physiology, complete axons, internals, identities or registrations.";

  const sourceRegistryReceipt = replaceInputReceipt(manifest, "researchSourceRegistry", sourceRegistryBytes);
  const upgradeRegistryReceipt = replaceInputReceipt(manifest, "researchModelUpgradeRegistry", upgradeRegistryBytes);
  replaceInputReceipt(manifest, "rightsLedger", rightsLedgerBytes);
  replaceInputReceipt(manifest, "packageLock", packageLockBytes);
  const additionalBytes = [routePackBytes, assetManifestBytes, representationBytes, routeSchemaBytes];
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 34, "research iteration 2.28 must contain exactly 34 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 34 && new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 34, "2.28 authoritative input IDs or paths are not unique");
  manifest.integrity.inputCount = 34;

  const membership = routeMembership(route);
  manifest.exactReferences.premotorComparisonObservedMorphologyRoutePack = {
    contractId: routePack.contractId,
    contractReleaseId: routePack.releaseId,
    repository: structuredClone(routePack.repository),
    contractReceipt: { path: ADDITIONAL_INPUTS[0].path, bytes: routePackBytes.byteLength, sha256: sha256(routePackBytes) },
    routeSchemaReceipt: { path: ADDITIONAL_INPUTS[3].path, bytes: routeSchemaBytes.byteLength, sha256: sha256(routeSchemaBytes) },
    assetManifestReceipt: {
      path: ADDITIONAL_INPUTS[1].path,
      assetSetId: assetManifest.assetSetId,
      repositoryRelease: assetManifest.repositoryRelease,
      bytes: assetManifestBytes.byteLength,
      sha256: sha256(assetManifestBytes),
      fileCount: assetManifest.summary.fileCount,
      files: structuredClone(assetManifest.files),
    },
    routeCount: routePack.summary.routeCount,
    uniqueNeuronCount: routePack.summary.uniqueNeuronCount,
    neuronIds: [45718],
    supplementaryNeuronIds: structuredClone(routePack.runtimeMergePolicy.supplementaryNeuronIds),
    preMergeUniqueMorphologyCount: routePack.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount,
    activeUniqueMorphologyCount: routePack.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount,
    preExistingNamedRouteCount: routePack.runtimeMergePolicy.preExistingNamedRouteCount,
    namedRouteCount: routePack.runtimeMergePolicy.postMergeNamedRouteCount,
    namedDorsalHornRouteCount: routePack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount,
    namedVentralHornRouteCount: routePack.runtimeMergePolicy.postMergeNamedVentralHornRouteCount,
    frozenExemplarCount: routePack.runtimeMergePolicy.frozenLegacyExemplarCount,
    frozenCensusRecordCount: routePack.runtimeMergePolicy.frozenCensusRecordCount,
    censusExpansionCount: routePack.runtimeMergePolicy.censusExpansionCount,
    sourceDiameterAvailableCount: routePack.summary.sourceDiameterAvailableCount,
    observedAxonRouteCount: routePack.summary.observedAxonRouteCount,
    sourceCompleteAxonCount: routePack.summary.sourceCompleteAxonCount,
    originalDatReceiptCount: routePack.summary.originalDatReceiptCount,
    nativeDatSemanticAdmissionCount: routePack.summary.nativeDatSemanticAdmissionCount,
    sameCellElectrophysiologyJoinCount: routePack.summary.sameCellElectrophysiologyJoinCount,
    sameSpecimenInternalStructureCount: routePack.summary.sameSpecimenInternalStructureCount,
    renderedInternalPrimitiveCount: routePack.summary.renderedInternalPrimitiveCount,
    definitiveRenshawExclusionClaimCount: 0,
    paperKeyedPremotorIdentityClaimCount: 0,
    individualCalbindinAssayClaimCount: 0,
    shrinkageRestoredInVivoClaimCount: 0,
    exactCrossSourceIdentityCount: routePack.summary.exactCrossSourceIdentityCount,
    projectRegistrationCount: routePack.summary.projectRegistrationCount,
    routeMemberships: [membership],
  };

  const previousRepresentation = manifest.exactReferences.evidenceAware3dRepresentation;
  const representationRouteIds = representation.routes.map((item) => item.routeId);
  const representationStateIds = representation.representationStates.map((state) => state.id);
  manifest.exactReferences.evidenceAware3dRepresentation = {
    contractId: representation.contractId,
    contractReleaseId: representation.releaseId,
    deterministicMaterializationReceipt: {
      path: ADDITIONAL_INPUTS[2].path,
      bytes: representationBytes.byteLength,
      sha256: sha256(representationBytes),
      buildInputs: structuredClone(representation.buildInputs),
    },
    representationStateCount: representationStateIds.length,
    representationStateIds,
    routeCount: representationRouteIds.length,
    routeIds: representationRouteIds,
    legacyDorsalHornPackRouteCount: previousRepresentation.legacyDorsalHornPackRouteCount,
    legacyDorsalHornPackRouteIds: structuredClone(previousRepresentation.legacyDorsalHornPackRouteIds),
    functionalClassRouteCount: previousRepresentation.functionalClassRouteCount,
    functionalClassRouteIds: structuredClone(previousRepresentation.functionalClassRouteIds),
    prpDorsalHornRouteCount: previousRepresentation.prpDorsalHornRouteCount,
    prpDorsalHornRouteIds: structuredClone(previousRepresentation.prpDorsalHornRouteIds),
    premotorComparisonRouteCount: 1,
    premotorComparisonRouteIds: [ROUTE_ID],
    namedDorsalHornRouteCount: routePack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount,
    namedVentralHornRouteCount: routePack.runtimeMergePolicy.postMergeNamedVentralHornRouteCount,
    runtimeMetadataRequirements: structuredClone(representation.runtimeMetadataRequirements),
    internalReferenceStateIds: ["UNAVAILABLE"],
    internalReferenceRenderedPrimitivePolicy: "zero_primitives",
    proceduralBiologicalProxyAllowed: false,
    missingLayerPrimitiveCount: 0,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    sameSpecimenInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
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
  manifest.scientificBoundaries.evidenceAware3dRepresentation = "Nine evidence states cover sixteen routes. Every route exposes representation authority and exact source receipts. Missing object geometry yields zero primitives; standardized soma points and radius derivatives are not membranes, nuclei or internal structures. Source-native DAT bytes remain non-semantic, paper-level physiology remains unjoined, and procedural biological proxies, cross-source identities and project registrations remain prohibited.";
  manifest.scientificBoundaries.premotorComparisonObservedMorphologyRoutePack = "NMO 45718 is one independent source-local, moderate-integrity reconstruction labelled by the repository as calbindin-negative, glycinergic, pre-motor and non-renshaw. Because the paper exposes neither the NMO ID nor filename, those labels are not independently verified as an individual calbindin assay, definitive premotor identity, Renshaw exclusion or same-cell physiology; the paper itself notes possible calbindin washout and that non-Renshaw glycinergic cells need not be premotor. The repository's 50-micrometre horizontal field, the paper's 400-micrometre transverse recording slices and 50-micrometre serial resectioning remain distinct. Shrinkage was reported but not corrected, so coordinates are not restored in-vivo dimensions. Eight standardized soma points are not native contour geometry, a membrane, nucleus or volume. Native DAT semantics, complete axons, same-specimen internals, cross-source identities and project registrations remain zero.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest228(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest228();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.28 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    activeUniqueMorphologyCount: built.manifest.exactReferences.premotorComparisonObservedMorphologyRoutePack.activeUniqueMorphologyCount,
    namedRouteCount: built.manifest.exactReferences.premotorComparisonObservedMorphologyRoutePack.namedRouteCount,
    representationRouteCount: built.manifest.exactReferences.evidenceAware3dRepresentation.routeCount,
    sourcePackageCount: built.manifest.registrySummary.canonicalSourcePackageCount,
    recordSetCount: built.manifest.registrySummary.canonicalRecordSetCount,
    bundledExactRosterCount: built.manifest.registrySummary.bundledExactRosterCount,
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
