#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildEvidenceAware3dRepresentationContract03 } from "./build_evidence_aware_3d_representation_contract_0_3.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.26.json");
const BASE_MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.25.json");
const SOURCE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");
const PACKAGE_LOCK_PATH = path.join(PROJECT_ROOT, "package-lock.json");

const BASE_RELEASE_ID = "ohri-mouse-interneuron-research-iteration-2.25.0";
const BASE_MANIFEST_SHA256 = "f7bc56dfe6671b67f0fa8a5115faadf615e98e056d207894c75441fb3a5dc6e1";
const FUNCTIONAL_ROUTE_IDS = Object.freeze([
  "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674",
  "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424",
]);
const FUNCTIONAL_NEURON_IDS = Object.freeze([45674, 50424]);

const ADDITIONAL_INPUTS = Object.freeze([
  {
    id: "functionalClassObservedMorphologyRoutePackContract",
    scope: "project",
    path: "data/functional-class-observed-morphology-route-pack-0.1.json",
    purpose: "Two checksum-pinned source-local Renshaw and NPY-positive morphology routes with explicit preparation, metadata-conflict, DAT non-admission and exact-physiology non-join boundaries",
  },
  {
    id: "functionalClassObservedMorphologyAssetManifest",
    scope: "project",
    path: "public/data/functional_class_observed_morphology_route_pack_v1/asset-manifest.json",
    purpose: "Delta-only official metadata, morphometry, standardized SWC, source-native DAT receipt and lazy-geometry asset inventory for NMO 45674 and NMO 50424",
  },
  {
    id: "evidenceAware3dRepresentationContract03",
    scope: "project",
    path: "data/evidence-aware-3d-representation-contract-0.3.json",
    purpose: "Nine-state, thirteen-route evidence-aware representation contract including the two functional-class exact morphology routes",
  },
  {
    id: "researchIterationManifestSchema226",
    scope: "project",
    path: "schemas/research-iteration-manifest-2.26.schema.json",
    purpose: "JSON Schema for the research iteration 2.26 manifest",
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
  return {
    ...input,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  };
}

function countRecordSets(sourceRegistry) {
  return sourceRegistry.sources.reduce(
    (count, source) => count + source.recordSets.length,
    0,
  );
}

function replaceInputReceipt(manifest, id, bytes) {
  const index = manifest.authoritativeInputs.findIndex((input) => input.id === id);
  check(index >= 0, `missing inherited authoritative input ${id}`);
  manifest.authoritativeInputs[index] = receipt(
    {
      id,
      scope: manifest.authoritativeInputs[index].scope,
      path: manifest.authoritativeInputs[index].path,
      purpose: manifest.authoritativeInputs[index].purpose,
    },
    bytes,
  );
  return manifest.authoritativeInputs[index];
}

function functionalRouteMembership(route) {
  const internals = route.renderingContract.sameSpecimenInternalStructure;
  const identity = route.identityBoundary;
  const originalDat = route.sourceObjects.originalDat;
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
    repositoryWeightValidForBiologicalInterpretation:
      route.sourceRecord.repositoryWeightGrams.validForBiologicalInterpretation,
    nodeCount: route.geometryReceipt.nodeCount,
    segmentCount: route.geometryReceipt.segmentCount,
    metadataReceipt: structuredClone(route.sourceObjects.metadata),
    morphometryReceipt: structuredClone(route.sourceObjects.morphometry),
    geometryReceipt: structuredClone(route.sourceObjects.geometry),
    swcReceipt: structuredClone(route.sourceObjects.swc),
    originalDatReceipt: structuredClone(originalDat),
    sourceDiameterAvailable: route.geometryReceipt.sourceDiameterAvailable,
    observedAxonNodeCount: route.geometryReceipt.nodeTypeCounts["2"] ?? 0,
    completeAxonClaim: false,
    nativeDatParsed: route.nativeDatContract.parsed,
    nativeDatRendered: route.nativeDatContract.rendered,
    nativeDatSemanticObjectCount: route.nativeDatContract.semanticObjectCountAdmitted,
    sameCellElectrophysiologyJoinStatus:
      identity.sameCellElectrophysiologyJoinStatus,
    internalPrimitiveCount: internals.renderedPrimitiveCount,
    crossSourceIdentityCount: identity.crossSourceIdentityCount,
    projectRegistrationCount: identity.projectRegistrationCount,
  };
}

export function serializeResearchIterationManifest226(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest226() {
  const [
    baseBytes,
    functionalRoutePackBytes,
    functionalAssetManifestBytes,
    representationBytes,
    manifestSchemaBytes,
    sourceRegistryBytes,
    upgradeRegistryBytes,
    packageLockBytes,
    representationBuild,
  ] = await Promise.all([
    readFile(BASE_MANIFEST_PATH),
    readFile(path.join(PROJECT_ROOT, ADDITIONAL_INPUTS[0].path)),
    readFile(path.join(PROJECT_ROOT, ADDITIONAL_INPUTS[1].path)),
    readFile(path.join(PROJECT_ROOT, ADDITIONAL_INPUTS[2].path)),
    readFile(path.join(PROJECT_ROOT, ADDITIONAL_INPUTS[3].path)),
    readFile(SOURCE_REGISTRY_PATH),
    readFile(UPGRADE_REGISTRY_PATH),
    readFile(PACKAGE_LOCK_PATH),
    buildEvidenceAware3dRepresentationContract03(),
  ]);

  const base = JSON.parse(baseBytes.toString("utf8"));
  const functionalRoutePack = JSON.parse(functionalRoutePackBytes.toString("utf8"));
  const functionalAssetManifest = JSON.parse(functionalAssetManifestBytes.toString("utf8"));
  const representation = JSON.parse(representationBytes.toString("utf8"));
  const sourceRegistry = JSON.parse(sourceRegistryBytes.toString("utf8"));
  const upgradeRegistry = JSON.parse(upgradeRegistryBytes.toString("utf8"));

  check(base.releaseId === BASE_RELEASE_ID, "immutable 2.25 base release identity drifted");
  check(
    base.manifestContentSha256 === BASE_MANIFEST_SHA256 &&
      computeManifestContentSha256(base) === BASE_MANIFEST_SHA256,
    "immutable 2.25 base manifest content drifted",
  );
  check(
    representationBytes.equals(representationBuild.bytes),
    "evidence-aware representation 0.3 differs from its deterministic rebuild",
  );
  check(
    functionalRoutePack.contractId ===
      "functional-class-observed-morphology-route-pack-0.1" &&
      functionalRoutePack.routes.length === 2,
    "unexpected functional-class route-pack identity or denominator",
  );
  check(
    same(
      functionalRoutePack.routes.map((route) => route.routeId),
      FUNCTIONAL_ROUTE_IDS,
    ) &&
      same(
        functionalRoutePack.routes.map((route) => route.sourceRecord.neuronId),
        FUNCTIONAL_NEURON_IDS,
      ),
    "functional-class route roster drifted",
  );
  check(
    functionalRoutePack.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount === 8 &&
      functionalRoutePack.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount === 10 &&
      functionalRoutePack.runtimeMergePolicy.preExistingNamedRouteCount === 5 &&
      functionalRoutePack.runtimeMergePolicy.postMergeNamedRouteCount === 7 &&
      functionalRoutePack.runtimeMergePolicy.frozenCensusRecordCount === 142 &&
      functionalRoutePack.runtimeMergePolicy.censusExpansionCount === 0,
    "functional-class runtime merge arithmetic drifted",
  );
  check(
    functionalRoutePack.summary.sourceCompleteAxonCount === 0 &&
      functionalRoutePack.summary.nativeDatSemanticAdmissionCount === 0 &&
      functionalRoutePack.summary.sameCellElectrophysiologyJoinCount === 0 &&
      functionalRoutePack.summary.sameSpecimenInternalStructureCount === 0 &&
      functionalRoutePack.summary.renderedInternalPrimitiveCount === 0 &&
      functionalRoutePack.summary.exactCrossSourceIdentityCount === 0 &&
      functionalRoutePack.summary.projectRegistrationCount === 0,
    "functional-class route pack creates a complete-axon, DAT, physiology, internal, identity or registration claim",
  );
  check(
    functionalAssetManifest.assetSetId ===
      "neuromorpho:8.6.124:functional-class-observed-morphology-route-pack-v1" &&
      functionalAssetManifest.summary.fileCount === 10 &&
      functionalAssetManifest.files.length === 10 &&
      functionalAssetManifest.summary.registrationCount === 0,
    "functional-class delta asset manifest drifted",
  );
  check(
    representation.contractId ===
      "evidence-aware-3d-representation-contract-0.3" &&
      representation.representationStates.length === 9 &&
      representation.routes.length === 13 &&
      FUNCTIONAL_ROUTE_IDS.every((routeId) =>
        representation.routes.some((route) => route.routeId === routeId),
      ),
    "evidence-aware representation 0.3 state or route roster drifted",
  );
  check(
    sourceRegistry.sourceCount === sourceRegistry.sources.length,
    "source-registry source count disagrees with its roster",
  );
  check(
    upgradeRegistry.summary.upgradeCount === upgradeRegistry.upgrades.length,
    "upgrade-registry count disagrees with its roster",
  );

  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.26.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.26.0";
  manifest.releaseDate = "2026-08-31";
  manifest.application.version = "2.26.0-research.1";
  manifest.baseResearchRelease.note =
    "The seven SCI evidence entities, five frozen observed-cell exemplars and 142-record census remain unchanged. Iteration 2.26 adds two independent source-local NeuroMorpho routes: NMO 45674 as a calbindin-positive glycinergic Renshaw reconstruction and NMO 50424 as an NPY-positive superficial lumbar dorsal-horn reconstruction. Deduplication yields ten active unique morphologies and seven named routes. Nine evidence states span thirteen routes. The source-native DAT files remain checksum-pinned provenance bytes with zero admitted semantics; same-cell electrophysiology, complete axons, internal structures, cross-source identities and project registrations remain unestablished.";

  const sourceRegistryReceipt = replaceInputReceipt(
    manifest,
    "researchSourceRegistry",
    sourceRegistryBytes,
  );
  const upgradeRegistryReceipt = replaceInputReceipt(
    manifest,
    "researchModelUpgradeRegistry",
    upgradeRegistryBytes,
  );
  replaceInputReceipt(manifest, "packageLock", packageLockBytes);
  const additionalBytes = [
    functionalRoutePackBytes,
    functionalAssetManifestBytes,
    representationBytes,
    manifestSchemaBytes,
  ];
  manifest.authoritativeInputs.push(
    ...ADDITIONAL_INPUTS.map((input, index) => receipt(input, additionalBytes[index])),
  );
  check(
    manifest.authoritativeInputs.length === 26,
    "research iteration 2.26 must contain exactly 26 authoritative inputs",
  );
  check(
    new Set(manifest.authoritativeInputs.map((input) => input.id)).size === 26 &&
      new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 26,
    "research iteration 2.26 authoritative input IDs or paths are not unique",
  );
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;

  const routeMemberships = functionalRoutePack.routes.map(functionalRouteMembership);
  manifest.exactReferences.functionalClassObservedMorphologyRoutePack = {
    contractId: functionalRoutePack.contractId,
    contractReleaseId: functionalRoutePack.releaseId,
    repository: structuredClone(functionalRoutePack.repository),
    contractReceipt: {
      path: ADDITIONAL_INPUTS[0].path,
      bytes: functionalRoutePackBytes.byteLength,
      sha256: sha256(functionalRoutePackBytes),
    },
    assetManifestReceipt: {
      path: ADDITIONAL_INPUTS[1].path,
      assetSetId: functionalAssetManifest.assetSetId,
      repositoryRelease: functionalAssetManifest.repositoryRelease,
      bytes: functionalAssetManifestBytes.byteLength,
      sha256: sha256(functionalAssetManifestBytes),
      fileCount: functionalAssetManifest.summary.fileCount,
      files: structuredClone(functionalAssetManifest.files),
    },
    routeCount: functionalRoutePack.summary.routeCount,
    uniqueNeuronCount: functionalRoutePack.summary.uniqueNeuronCount,
    neuronIds: structuredClone(FUNCTIONAL_NEURON_IDS),
    supplementaryNeuronIds: structuredClone(
      functionalRoutePack.runtimeMergePolicy.supplementaryNeuronIds,
    ),
    preMergeUniqueMorphologyCount:
      functionalRoutePack.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount,
    activeUniqueMorphologyCount:
      functionalRoutePack.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount,
    preExistingNamedRouteCount:
      functionalRoutePack.runtimeMergePolicy.preExistingNamedRouteCount,
    namedRouteCount: functionalRoutePack.runtimeMergePolicy.postMergeNamedRouteCount,
    namedDorsalHornRouteCount:
      functionalRoutePack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount,
    namedVentralHornRouteCount:
      functionalRoutePack.runtimeMergePolicy.postMergeNamedVentralHornRouteCount,
    frozenExemplarCount:
      functionalRoutePack.runtimeMergePolicy.frozenLegacyExemplarCount,
    frozenCensusRecordCount:
      functionalRoutePack.runtimeMergePolicy.frozenCensusRecordCount,
    censusExpansionCount: functionalRoutePack.runtimeMergePolicy.censusExpansionCount,
    sourceDiameterAvailableCount:
      functionalRoutePack.summary.sourceDiameterAvailableCount,
    observedAxonRouteCount: functionalRoutePack.summary.observedAxonRouteCount,
    sourceCompleteAxonCount: functionalRoutePack.summary.sourceCompleteAxonCount,
    originalDatReceiptCount: functionalRoutePack.summary.originalDatReceiptCount,
    nativeDatSemanticAdmissionCount:
      functionalRoutePack.summary.nativeDatSemanticAdmissionCount,
    sameCellElectrophysiologyJoinCount:
      functionalRoutePack.summary.sameCellElectrophysiologyJoinCount,
    sameSpecimenInternalStructureCount:
      functionalRoutePack.summary.sameSpecimenInternalStructureCount,
    renderedInternalPrimitiveCount:
      functionalRoutePack.summary.renderedInternalPrimitiveCount,
    crossSourceIdentityCount:
      functionalRoutePack.summary.exactCrossSourceIdentityCount,
    projectRegistrationCount:
      functionalRoutePack.summary.projectRegistrationCount,
    routeMemberships,
  };

  const internalReferenceRoute = representation.routes.find(
    (route) => route.routeId === "internal_reference",
  );
  check(Boolean(internalReferenceRoute), "internal-reference representation route is missing");
  manifest.exactReferences.evidenceAware3dRepresentation = {
    contractId: representation.contractId,
    contractReleaseId: representation.releaseId,
    deterministicMaterializationReceipt: {
      path: ADDITIONAL_INPUTS[2].path,
      bytes: representationBytes.byteLength,
      sha256: sha256(representationBytes),
      buildInputs: structuredClone(representation.buildInputs),
    },
    representationStateCount: representation.representationStates.length,
    representationStateIds: representation.representationStates.map(
      (state) => state.id,
    ),
    routeCount: representation.routes.length,
    routeIds: representation.routes.map((route) => route.routeId),
    dorsalHornRouteCount:
      manifest.exactReferences.dorsalHornObservedMorphologyRoutePack
        .routePackMembershipCount,
    dorsalHornRouteIds: manifest.exactReferences.dorsalHornObservedMorphologyRoutePack
      .routeMemberships.map((route) => route.routeId),
    functionalClassRouteCount: FUNCTIONAL_ROUTE_IDS.length,
    functionalClassRouteIds: structuredClone(FUNCTIONAL_ROUTE_IDS),
    runtimeMetadataRequirements: structuredClone(
      representation.runtimeMetadataRequirements,
    ),
    internalReferenceStateIds: structuredClone(
      internalReferenceRoute.representationStateIds,
    ),
    internalReferenceRenderedPrimitivePolicy:
      internalReferenceRoute.renderedPrimitivePolicy,
    proceduralBiologicalProxyAllowed: false,
    missingLayerPrimitiveCount: 0,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  };

  manifest.registrySummary = {
    canonicalSourcePackageCount: sourceRegistry.sourceCount,
    canonicalRecordSetCount: countRecordSets(sourceRegistry),
    researchUpgradeCount: upgradeRegistry.summary.upgradeCount,
    sourceRegistryReceipt: structuredClone(sourceRegistryReceipt),
    upgradeRegistryReceipt: structuredClone(upgradeRegistryReceipt),
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
  };
  manifest.scientificBoundaries.functionalClassObservedMorphologyRoutePack =
    "NMO 45674 and NMO 50424 remain two independent, source-local, moderate-integrity reconstructions. Their standardized SWC centerlines and recorded radii may support observed skeletons and labelled radius-derived surfaces, but not complete axons, membranes, nuclei, organelles, boutons, synapses or atlas placement. Repository morphometry uses 95-percent principal-component extents and is not equivalent to raw SWC bounds or anatomical axes. The source-native DAT files are unparsed provenance receipts with zero admitted semantic objects. Paper-level physiology has no exact object key. The Renshaw preparation stages and the NPY strain and inverted weight fields remain explicit unresolved context; co-display creates no identity or registration.";
  manifest.scientificBoundaries.evidenceAware3dRepresentation =
    "Nine evidence states cover thirteen routes. Every route exposes representation authority and exact source receipts. Missing object geometry yields zero primitives; standardized soma points and radius derivatives are not membranes, nuclei or internal structures. Source-native DAT bytes remain non-semantic, paper-level physiology remains unjoined, and procedural biological proxies, cross-source identities and project registrations remain prohibited.";
  manifest.scientificBoundaries.selectedSpinalCellInternalStructure = "unavailable";
  manifest.scientificBoundaries.missingEvidence =
    "Missing or unavailable evidence generates zero primitives and is not biological absence.";
  manifest.registrations = { count: 0, records: [] };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return manifest;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) {
    check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  }
  check(
    !(args.has("--write") && args.has("--check")),
    "--write and --check are mutually exclusive",
  );

  const manifest = await buildResearchIterationManifest226();
  const bytes = Buffer.from(serializeResearchIterationManifest226(manifest), "utf8");
  if (args.has("--write")) await writeFile(OUTPUT_PATH, bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(
      committed.equals(bytes),
      "research iteration 2.26 manifest is stale; run builder with --write",
    );
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        releaseId: manifest.releaseId,
        inputCount: manifest.integrity.inputCount,
        sourcePackageCount: manifest.registrySummary.canonicalSourcePackageCount,
        recordSetCount: manifest.registrySummary.canonicalRecordSetCount,
        researchUpgradeCount: manifest.registrySummary.researchUpgradeCount,
        functionalRouteCount:
          manifest.exactReferences.functionalClassObservedMorphologyRoutePack
            .routeCount,
        activeUniqueMorphologyCount:
          manifest.exactReferences.functionalClassObservedMorphologyRoutePack
            .activeUniqueMorphologyCount,
        representationRouteCount:
          manifest.exactReferences.evidenceAware3dRepresentation.routeCount,
        manifestContentSha256: manifest.manifestContentSha256,
        wrote: args.has("--write"),
        checked: args.has("--check"),
      },
      null,
      2,
    )}\n`,
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
