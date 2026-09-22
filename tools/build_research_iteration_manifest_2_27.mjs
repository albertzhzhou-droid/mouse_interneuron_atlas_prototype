#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildEvidenceAware3dRepresentationContract04 } from "./build_evidence_aware_3d_representation_contract_0_4.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.27.json");
const BASE_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.26.json");
const SOURCE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");
const RIGHTS_LEDGER_PATH = path.join(PROJECT_ROOT, "docs/RIGHTS_LEDGER.csv");
const PACKAGE_LOCK_PATH = path.join(PROJECT_ROOT, "package-lock.json");

const BASE_RELEASE_ID = "ohri-mouse-interneuron-research-iteration-2.26.0";
const BASE_CONTENT_SHA256 = "fbf40be71ab73e4a550d7be3e2791ef184ef784a33b5e8c3ac78f4e3cb465ba0";
const BASE_FILE_BYTES = 40818;
const BASE_FILE_SHA256 = "f65972360bfa8c376b9989a1e03a7a7e1e0029f5b76b2837742ebe52298a9196";
const PRP_PACK_FILE_SHA256 = "a8737dff3fbfe244d36e2af19b32e1dd8142e2626a90c0d89c00881b83eaf709";
const PRP_ASSET_MANIFEST_FILE_SHA256 = "2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f";
const PRP_ROUTE_IDS = Object.freeze([
  "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
  "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
]);
const PRP_NEURON_IDS = Object.freeze([50394, 50408]);
const PRP_CELL_TYPE_LABELS = Object.freeze({
  50394: Object.freeze([
    "Neuronal Nitric Oxide Synthase (nNOS)-positive",
    "prion protein (PrP) promoter-positive",
    "interneuron",
  ]),
  50408: Object.freeze([
    "galanin-expressing",
    "prion protein (PrP) promoter-positive",
    "interneuron",
  ]),
});

const ADDITIONAL_INPUTS = Object.freeze([
  {
    id: "prpDorsalHornObservedMorphologyRoutePackContract",
    scope: "project",
    path: "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json",
    purpose: "Two checksum-pinned PrP-promoter-reporter dorsal-horn morphology routes with positive-marker, preparation-stage, DAT, physiology, internal-detail, identity and registration boundaries",
  },
  {
    id: "prpDorsalHornObservedMorphologyAssetManifest",
    scope: "project",
    path: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json",
    purpose: "Delta-only exact metadata, morphometry, SWC, receipt-only DAT and lazy-geometry inventory for NMO 50394 and NMO 50408",
  },
  {
    id: "evidenceAware3dRepresentationContract04",
    scope: "project",
    path: "data/evidence-aware-3d-representation-contract-0.4.json",
    purpose: "Nine-state, fifteen-route evidence-aware representation contract including the two exact PrP-reporter routes",
  },
  {
    id: "researchIterationManifestSchema227",
    scope: "project",
    path: "schemas/research-iteration-manifest-2.27.schema.json",
    purpose: "JSON Schema for the research iteration 2.27 manifest",
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

function prpRouteMembership(route) {
  const weight = route.sourceRecord.repositoryWeightGrams;
  const internals = route.renderingContract.sameSpecimenInternalStructure;
  const identity = route.identityBoundary;
  return {
    routeId: route.routeId,
    neuronId: route.sourceRecord.neuronId,
    assetId: route.sourceRecord.assetId,
    title: route.title,
    sourceAuthority: route.sourceAuthority,
    censusMembership: route.censusMembership,
    physicalIntegrity: route.sourceRecord.physicalIntegrity,
    sourceFrame: route.geometryReceipt.sourceFrame,
    preparationJoinStatus: route.sourceRecord.preparationJoinStatus,
    strainJoinStatus: route.sourceRecord.strainJoinStatus,
    repositoryStrainRaw: route.sourceRecord.repositoryStrainRaw,
    repositoryWeightMinimumGrams: weight.minimum,
    repositoryWeightMaximumGrams: weight.maximum,
    repositoryWeightValidForBiologicalInterpretation: weight.validForBiologicalInterpretation,
    cellTypeLabels: structuredClone(route.sourceRecord.cellTypeLabels),
    markerExclusivityClaim: false,
    endogenousPrpProteinAbundanceClaim: false,
    nodeCount: route.geometryReceipt.nodeCount,
    segmentCount: route.geometryReceipt.segmentCount,
    metadataReceipt: structuredClone(route.sourceObjects.metadata),
    morphometryReceipt: structuredClone(route.sourceObjects.morphometry),
    geometryReceipt: structuredClone(route.sourceObjects.geometry),
    swcReceipt: structuredClone(route.sourceObjects.swc),
    originalDatReceipt: structuredClone(route.sourceObjects.originalDat),
    sourceDiameterAvailable: route.geometryReceipt.sourceDiameterAvailable,
    observedAxonNodeCount: route.geometryReceipt.nodeTypeCounts["2"] ?? 0,
    completeAxonClaim: route.fidelityRecord.axon.completeAxon,
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

export function serializeResearchIterationManifest227(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest227() {
  const additionalPaths = ADDITIONAL_INPUTS.map((input) => path.join(PROJECT_ROOT, input.path));
  const [
    baseBytes,
    prpPackBytes,
    prpAssetManifestBytes,
    representationBytes,
    schemaBytes,
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
    buildEvidenceAware3dRepresentationContract04(),
  ]);

  const base = JSON.parse(baseBytes.toString("utf8"));
  const prpPack = JSON.parse(prpPackBytes.toString("utf8"));
  const prpAssetManifest = JSON.parse(prpAssetManifestBytes.toString("utf8"));
  const representation = JSON.parse(representationBytes.toString("utf8"));
  const sourceRegistry = JSON.parse(sourceRegistryBytes.toString("utf8"));
  const upgradeRegistry = JSON.parse(upgradeRegistryBytes.toString("utf8"));
  const packageLock = JSON.parse(packageLockBytes.toString("utf8"));

  check(base.releaseId === BASE_RELEASE_ID, "immutable 2.26 base release identity drifted");
  check(baseBytes.byteLength === BASE_FILE_BYTES && sha256(baseBytes) === BASE_FILE_SHA256, "immutable 2.26 base file bytes drifted");
  check(base.manifestContentSha256 === BASE_CONTENT_SHA256 && computeManifestContentSha256(base) === BASE_CONTENT_SHA256, "immutable 2.26 base content drifted");
  check(representationBytes.equals(representationBuild.bytes), "representation 0.4 differs from its deterministic rebuild");
  check(prpPackBytes.byteLength === 31435 && sha256(prpPackBytes) === PRP_PACK_FILE_SHA256, "PrP route-pack contract receipt drifted");
  check(prpAssetManifestBytes.byteLength === 2766 && sha256(prpAssetManifestBytes) === PRP_ASSET_MANIFEST_FILE_SHA256, "PrP asset-manifest receipt drifted");
  check(prpPack.contractId === "prp-dorsal-horn-observed-morphology-route-pack-0.1" && prpPack.routes.length === 2, "unexpected PrP route-pack identity or denominator");
  check(same(prpPack.routes.map((route) => route.routeId), PRP_ROUTE_IDS) && same(prpPack.routes.map((route) => route.sourceRecord.neuronId), PRP_NEURON_IDS), "PrP route roster drifted");
  check(
    prpPack.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount === 10 &&
      prpPack.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount === 12 &&
      prpPack.runtimeMergePolicy.preExistingNamedRouteCount === 7 &&
      prpPack.runtimeMergePolicy.postMergeNamedRouteCount === 9 &&
      prpPack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount === 8 &&
      prpPack.runtimeMergePolicy.postMergeNamedVentralHornRouteCount === 1 &&
      prpPack.runtimeMergePolicy.frozenCensusRecordCount === 142 &&
      prpPack.runtimeMergePolicy.censusExpansionCount === 0,
    "PrP runtime merge arithmetic drifted",
  );
  check(
    prpPack.summary.sourceCompleteAxonCount === 0 &&
      prpPack.summary.nativeDatSemanticAdmissionCount === 0 &&
      prpPack.summary.sameCellElectrophysiologyJoinCount === 0 &&
      prpPack.summary.sameSpecimenInternalStructureCount === 0 &&
      prpPack.summary.renderedInternalPrimitiveCount === 0 &&
      prpPack.summary.exactCrossSourceIdentityCount === 0 &&
      prpPack.summary.projectRegistrationCount === 0,
    "PrP route pack creates a complete-axon, DAT, physiology, internal, identity or registration claim",
  );
  for (const route of prpPack.routes) {
    const otherMarker = route.sourceRecord.neuronId === 50394 ? "Galanin negativity" : "nNOS negativity";
    const expectedLabels = PRP_CELL_TYPE_LABELS[route.sourceRecord.neuronId];
    check(same(route.sourceRecord.cellTypeLabels, expectedLabels), `${route.routeId} exact positive-marker labels drifted`);
    check(route.sourceRecord.repositoryStrainRaw === "Swiss-Webster ", `${route.routeId} raw strain spacing drifted`);
    check(route.sourceRecord.strainJoinStatus === "context_incomplete_not_individual_genotype_validation", `${route.routeId} strain boundary drifted`);
    check(route.sourceRecord.repositoryWeightGrams.minimum === 27 && route.sourceRecord.repositoryWeightGrams.maximum === 15 && route.sourceRecord.repositoryWeightGrams.validForBiologicalInterpretation === false, `${route.routeId} invalid repository weight receipt drifted`);
    check(route.sourceRecord.repositoryWeightGrams.missingOrInvalidReason === "inverted_repository_bounds", `${route.routeId} invalid weight reason drifted`);
    check(route.sourceRecord.repositorySlicingDirection === "parasagittal" && route.sourceRecord.repositorySlicingThicknessMicrometre === 300, `${route.routeId} repository preparation field drifted`);
    check(route.sourceRecord.paperPreparationContext.includes("300 micrometre parasagittal slices") && route.sourceRecord.paperPreparationContext.includes("60 micrometre serial resectioning"), `${route.routeId} paper preparation context drifted`);
    check(route.sourceRecord.preparationJoinStatus === "context_consistent_not_exact_object_crosswalk", `${route.routeId} preparation boundary drifted`);
    check(route.identityBoundary.paperMentionsExactNeuronIdOrFilename === false && route.identityBoundary.individualMolecularAssayClaim === false, `${route.routeId} creates an exact paper or molecular crosswalk`);
    check(route.hardBoundaries.some((boundary) => boundary.includes(otherMarker) && boundary.includes("cannot be assigned to this deposited object")), `${route.routeId} marker non-exclusivity boundary is missing`);
    check(route.hardBoundaries.some((boundary) => boundary.includes("300 micrometre parasagittal source object") && boundary.includes("60 micrometre serial resectioning") && boundary.includes("must not be collapsed")), `${route.routeId} preparation-stage non-collapse boundary is missing`);
  }
  check(
    prpPack.packBoundaries.some((boundary) => boundary.includes("not a claim of endogenous PrP protein abundance")) &&
      prpPack.packBoundaries.some((boundary) => boundary.includes("nNOS-positive does not establish galanin-negative") && boundary.includes("galanin-positive does not establish nNOS-negative")),
    "PrP abundance or marker non-exclusivity pack boundary drifted",
  );
  check(
    prpAssetManifest.assetSetId === "neuromorpho:8.6.124:prp-dorsal-horn-observed-morphology-route-pack-v1" &&
      prpAssetManifest.summary.supplementaryNeuronCount === 2 &&
      prpAssetManifest.summary.officialApiSnapshotCount === 2 &&
      prpAssetManifest.summary.officialMorphometrySnapshotCount === 2 &&
      prpAssetManifest.summary.standardizedSwcCount === 2 &&
      prpAssetManifest.summary.sourceNativeDatReceiptCount === 2 &&
      prpAssetManifest.summary.lazyGeometryCount === 2 &&
      prpAssetManifest.summary.nativeDatSemanticAdmissionCount === 0 &&
      prpAssetManifest.summary.fileCount === 10 &&
      prpAssetManifest.summary.registrationCount === 0 &&
      prpAssetManifest.files.length === 10,
    "PrP delta asset manifest summary drifted",
  );
  const expectedAssetKinds = [
    "official_api_snapshot",
    "official_api_snapshot",
    "lazy_geometry",
    "lazy_geometry",
    "official_morphometry_snapshot",
    "official_morphometry_snapshot",
    "source_native_dat_receipt_only",
    "source_native_dat_receipt_only",
    "standardized_swc",
    "standardized_swc",
  ];
  check(same(prpAssetManifest.files.map((file) => file.kind), expectedAssetKinds), "PrP delta asset kind inventory drifted");
  check(representation.contractId === "evidence-aware-3d-representation-contract-0.4" && representation.representationStates.length === 9 && representation.routes.length === 15, "representation 0.4 state or route denominator drifted");
  check(PRP_ROUTE_IDS.every((routeId) => representation.routes.some((route) => route.routeId === routeId)), "representation 0.4 omits a PrP route");
  check(sourceRegistry.sourceCount === 24 && sourceRegistry.sources.length === 24 && countRecordSets(sourceRegistry) === 27 && countBundledExactRosters(sourceRegistry) === 6, "source-registry denominators drifted");
  check(upgradeRegistry.summary.upgradeCount === 130 && upgradeRegistry.upgrades.length === 130, "upgrade-registry denominator drifted");
  check(packageLock.version === "2.27.0-research.1" && packageLock.packages?.[""]?.version === "2.27.0-research.1", "package-lock application version drifted");
  const rightsLedgerText = rightsLedgerBytes.toString("utf8");
  check(
    rightsLedgerText.includes("NeuroMorpho.Org PrP dorsal-horn route pack NMO_50394 and NMO_50408") &&
      rightsLedgerText.includes("DAT bytes are provenance receipt-only/unparsed/unrendered"),
    "rights ledger omits the exact PrP route-pack or DAT boundary",
  );

  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.27.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.27.0";
  manifest.releaseDate = "2026-08-31";
  manifest.application.version = "2.27.0-research.1";
  manifest.parentIterationManifest = {
    path: "data/research-iteration-manifest-2.26.json",
    releaseId: BASE_RELEASE_ID,
    bytes: baseBytes.byteLength,
    fileSha256: sha256(baseBytes),
    contentSha256: base.manifestContentSha256,
  };
  manifest.baseResearchRelease.note = "The seven SCI evidence entities, five frozen observed-cell exemplars and 142-record census remain unchanged. Iteration 2.27 adds exact source-local NMO 50394 (nNOS-positive / PrP-promoter-positive) and NMO 50408 (galanin-positive / PrP-promoter-positive) routes. Deduplication yields twelve active unique morphologies and nine named spinal routes: eight dorsal-horn and one ventral-horn. Nine evidence states span fifteen routes. Positive marker labels do not establish the other marker's absence, PrP-promoter reporter wording is not endogenous protein abundance, and the 300-micrometre source slice is not collapsed with later 60-micrometre serial resectioning. Native DAT semantics, exact same-cell physiology, complete axons, same-specimen internals, cross-source identities and project registrations remain zero.";

  const sourceRegistryReceipt = replaceInputReceipt(manifest, "researchSourceRegistry", sourceRegistryBytes);
  const upgradeRegistryReceipt = replaceInputReceipt(manifest, "researchModelUpgradeRegistry", upgradeRegistryBytes);
  replaceInputReceipt(manifest, "rightsLedger", rightsLedgerBytes);
  replaceInputReceipt(manifest, "packageLock", packageLockBytes);
  const additionalBytes = [prpPackBytes, prpAssetManifestBytes, representationBytes, schemaBytes];
  manifest.authoritativeInputs.push(...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])));
  check(manifest.authoritativeInputs.length === 30, "research iteration 2.27 must contain exactly 30 authoritative inputs");
  check(new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 30 && new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 30, "2.27 authoritative input IDs or paths are not unique");
  manifest.integrity.inputCount = 30;

  const routeMemberships = prpPack.routes.map(prpRouteMembership);
  manifest.exactReferences.prpDorsalHornObservedMorphologyRoutePack = {
    contractId: prpPack.contractId,
    contractReleaseId: prpPack.releaseId,
    repository: structuredClone(prpPack.repository),
    contractReceipt: { path: ADDITIONAL_INPUTS[0].path, bytes: prpPackBytes.byteLength, sha256: sha256(prpPackBytes) },
    assetManifestReceipt: {
      path: ADDITIONAL_INPUTS[1].path,
      assetSetId: prpAssetManifest.assetSetId,
      repositoryRelease: prpAssetManifest.repositoryRelease,
      bytes: prpAssetManifestBytes.byteLength,
      sha256: sha256(prpAssetManifestBytes),
      fileCount: prpAssetManifest.summary.fileCount,
      files: structuredClone(prpAssetManifest.files),
    },
    routeCount: prpPack.summary.routeCount,
    uniqueNeuronCount: prpPack.summary.uniqueNeuronCount,
    neuronIds: structuredClone(PRP_NEURON_IDS),
    supplementaryNeuronIds: structuredClone(prpPack.runtimeMergePolicy.supplementaryNeuronIds),
    preMergeUniqueMorphologyCount: prpPack.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount,
    activeUniqueMorphologyCount: prpPack.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount,
    preExistingNamedRouteCount: prpPack.runtimeMergePolicy.preExistingNamedRouteCount,
    namedRouteCount: prpPack.runtimeMergePolicy.postMergeNamedRouteCount,
    namedDorsalHornRouteCount: prpPack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount,
    namedVentralHornRouteCount: prpPack.runtimeMergePolicy.postMergeNamedVentralHornRouteCount,
    frozenExemplarCount: prpPack.runtimeMergePolicy.frozenLegacyExemplarCount,
    frozenCensusRecordCount: prpPack.runtimeMergePolicy.frozenCensusRecordCount,
    censusExpansionCount: prpPack.runtimeMergePolicy.censusExpansionCount,
    sourceDiameterAvailableCount: prpPack.summary.sourceDiameterAvailableCount,
    observedAxonRouteCount: prpPack.summary.observedAxonRouteCount,
    sourceCompleteAxonCount: prpPack.summary.sourceCompleteAxonCount,
    originalDatReceiptCount: prpPack.summary.originalDatReceiptCount,
    nativeDatSemanticAdmissionCount: prpPack.summary.nativeDatSemanticAdmissionCount,
    sameCellElectrophysiologyJoinCount: prpPack.summary.sameCellElectrophysiologyJoinCount,
    sameSpecimenInternalStructureCount: prpPack.summary.sameSpecimenInternalStructureCount,
    renderedInternalPrimitiveCount: prpPack.summary.renderedInternalPrimitiveCount,
    markerExclusivityClaimCount: 0,
    endogenousPrpProteinAbundanceClaimCount: 0,
    exactCrossSourceIdentityCount: prpPack.summary.exactCrossSourceIdentityCount,
    projectRegistrationCount: prpPack.summary.projectRegistrationCount,
    routeMemberships,
  };

  const representationRouteIds = representation.routes.map((route) => route.routeId);
  const representationStateIds = representation.representationStates.map((state) => state.id);
  const originalDorsalIds = manifest.exactReferences.evidenceAware3dRepresentation.dorsalHornRouteIds;
  const functionalIds = manifest.exactReferences.evidenceAware3dRepresentation.functionalClassRouteIds;
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
    legacyDorsalHornPackRouteCount: originalDorsalIds.length,
    legacyDorsalHornPackRouteIds: structuredClone(originalDorsalIds),
    functionalClassRouteCount: functionalIds.length,
    functionalClassRouteIds: structuredClone(functionalIds),
    prpDorsalHornRouteCount: PRP_ROUTE_IDS.length,
    prpDorsalHornRouteIds: structuredClone(PRP_ROUTE_IDS),
    namedDorsalHornRouteCount: prpPack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount,
    namedVentralHornRouteCount: prpPack.runtimeMergePolicy.postMergeNamedVentralHornRouteCount,
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
  manifest.scientificBoundaries.evidenceAware3dRepresentation = "Nine evidence states cover fifteen routes. Every route exposes representation authority and exact source receipts. Missing object geometry yields zero primitives; standardized soma points and radius derivatives are not membranes, nuclei or internal structures. Source-native DAT bytes remain non-semantic, paper-level physiology remains unjoined, and procedural biological proxies, cross-source identities and project registrations remain prohibited.";
  manifest.scientificBoundaries.prpDorsalHornObservedMorphologyRoutePack = "NMO 50394 and NMO 50408 remain independent source-local, moderate-integrity reconstructions. The former is nNOS-positive and the latter galanin-positive; neither positive label establishes the other marker's absence. PrP-promoter reporter wording is not endogenous PrP protein abundance or individual genotype validation. The 300-micrometre source preparation and later 60-micrometre serial resection remain distinct stages without an exact filename crosswalk. Source radii authorize display derivatives, not membranes. Native DAT semantics, exact same-cell physiology, complete axons, same-specimen internal structures, synapses, cross-source identities and registrations remain zero.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(serializeResearchIterationManifest227(manifest), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildResearchIterationManifest227();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "research iteration manifest 2.27 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.manifest.releaseId,
    inputCount: built.manifest.integrity.inputCount,
    activeUniqueMorphologyCount: built.manifest.exactReferences.prpDorsalHornObservedMorphologyRoutePack.activeUniqueMorphologyCount,
    namedRouteCount: built.manifest.exactReferences.prpDorsalHornObservedMorphologyRoutePack.namedRouteCount,
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

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
