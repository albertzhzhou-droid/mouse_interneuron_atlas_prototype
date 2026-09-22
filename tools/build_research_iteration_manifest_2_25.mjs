#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildEvidenceAware3dRepresentationContract02 } from "./build_evidence_aware_3d_representation_contract_0_2.mjs";
import { buildResearchIterationManifest224 } from "./build_research_iteration_manifest_2_24.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.25.json");
const SOURCE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");
const UPGRADE_REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json");

const EXPECTED_BASE_INPUT_IDS = Object.freeze([
  "researchRelease",
  "researchReleaseSchema",
  "evidenceLedger",
  "sourceManifest",
  "atlasAssetManifest",
  "morphologyAssetManifest",
  "micronsObservedReferenceContract",
  "micronsObservedReferenceAssetManifest",
  "ronzanoPremotorPositionContract",
  "ronzanoPremotorPositionPayload",
  "researchSourceRegistry",
  "researchModelUpgradeRegistry",
  "rightsLedger",
  "packageLock",
  "alkaslasiCholinergicTaxonomyContract",
  "grpDorsalHornObservedMorphologyContract",
  "neuromorphoCensusIndex",
  "neuromorphoCensusAssetManifest",
  "evidenceAware3dRepresentationContract",
  "zeroPrimitiveInternalReferenceContract",
]);

const ADDITIONAL_INPUTS = Object.freeze([
  {
    id: "dorsalHornObservedMorphologyRoutePackContract",
    scope: "project",
    path: "data/dorsal-horn-observed-morphology-route-pack-0.1.json",
    purpose: "Four checksum-pinned source-local dorsal-horn morphology route memberships with explicit overlap and supplementary boundaries",
  },
  {
    id: "dorsalHornObservedMorphologySupplementaryAssetManifest",
    scope: "project",
    path: "public/data/dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json",
    purpose: "Exact metadata, standardized SWC and lazy-geometry receipts for the two supplementary route-pack objects",
  },
]);

const EXPECTED = Object.freeze({
  baseInputCount: 20,
  inputCount: 22,
  frozenExemplarCount: 5,
  censusRecordCount: 142,
  routePackMembershipCount: 4,
  overlapCount: 2,
  supplementaryRecordCount: 2,
  activeUniqueMorphologyCount: 8,
  namedDorsalHornRouteCount: 5,
  representationStateCount: 9,
  representationRouteCount: 11,
  sourcePackageCount: 24,
  recordSetCount: 25,
  researchUpgradeCount: 118,
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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

function findInput(manifest, id) {
  const input = manifest.authoritativeInputs.find((candidate) => candidate.id === id);
  check(Boolean(input), `missing authoritative input ${id}`);
  return input;
}

export function serializeResearchIterationManifest225(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function buildResearchIterationManifest225() {
  const [
    base,
    routePackBytes,
    supplementaryAssetManifestBytes,
    sourceRegistryBytes,
    upgradeRegistryBytes,
    representationBuild,
  ] = await Promise.all([
    buildResearchIterationManifest224(),
    readFile(path.join(PROJECT_ROOT, ADDITIONAL_INPUTS[0].path)),
    readFile(path.join(PROJECT_ROOT, ADDITIONAL_INPUTS[1].path)),
    readFile(SOURCE_REGISTRY_PATH),
    readFile(UPGRADE_REGISTRY_PATH),
    buildEvidenceAware3dRepresentationContract02(),
  ]);

  check(
    JSON.stringify(base.authoritativeInputs.map((input) => input.id)) ===
      JSON.stringify(EXPECTED_BASE_INPUT_IDS),
    "research iteration 2.24 input roster drifted",
  );
  check(
    base.authoritativeInputs.length === EXPECTED.baseInputCount,
    "research iteration 2.24 input denominator drifted",
  );

  const routePack = JSON.parse(routePackBytes.toString("utf8"));
  const supplementaryAssetManifest = JSON.parse(
    supplementaryAssetManifestBytes.toString("utf8"),
  );
  const sourceRegistry = JSON.parse(sourceRegistryBytes.toString("utf8"));
  const upgradeRegistry = JSON.parse(upgradeRegistryBytes.toString("utf8"));
  const representation = representationBuild.contract;
  const recordSetCount = countRecordSets(sourceRegistry);

  check(
    sourceRegistry.sourceCount === EXPECTED.sourcePackageCount &&
      sourceRegistry.sources.length === EXPECTED.sourcePackageCount,
    "canonical source-package count drifted",
  );
  check(recordSetCount === EXPECTED.recordSetCount, "canonical record-set count drifted");
  check(
    upgradeRegistry.summary.upgradeCount === EXPECTED.researchUpgradeCount &&
      upgradeRegistry.upgrades.length === EXPECTED.researchUpgradeCount,
    "research-upgrade count drifted",
  );
  check(
    routePack.runtimeMergePolicy.frozenLegacyExemplarCount ===
      EXPECTED.frozenExemplarCount,
    "frozen exemplar denominator drifted",
  );
  check(
    routePack.runtimeMergePolicy.frozenCensusRecordCount ===
      EXPECTED.censusRecordCount,
    "frozen census denominator drifted",
  );
  check(
    routePack.summary.routeCount === EXPECTED.routePackMembershipCount &&
      routePack.routes.length === EXPECTED.routePackMembershipCount,
    "route-pack membership denominator drifted",
  );
  check(
    routePack.runtimeMergePolicy.overlappingFrozenNeuronIds.length ===
      EXPECTED.overlapCount,
    "route-pack overlap denominator drifted",
  );
  check(
    routePack.summary.supplementaryRecordCount ===
      EXPECTED.supplementaryRecordCount &&
      routePack.runtimeMergePolicy.supplementaryNeuronIds.length ===
        EXPECTED.supplementaryRecordCount,
    "supplementary route-pack denominator drifted",
  );
  check(
    routePack.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount ===
      EXPECTED.activeUniqueMorphologyCount,
    "deduplicated active-morphology denominator drifted",
  );
  check(
    routePack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount ===
      EXPECTED.namedDorsalHornRouteCount,
    "named dorsal-horn route denominator drifted",
  );
  check(
    representation.representationStates.length === EXPECTED.representationStateCount &&
      representation.routes.length === EXPECTED.representationRouteCount,
    "evidence-aware representation denominator drifted",
  );
  check(
    routePack.summary.exactCrossSourceIdentityCount === 0 &&
      routePack.summary.projectRegistrationCount === 0 &&
      routePack.summary.renderedInternalPrimitiveCount === 0,
    "route pack creates an identity, registration or internal primitive",
  );

  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.25.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.25.0";
  manifest.releaseDate = "2026-08-31";
  manifest.application.version = "2.25.0-research.1";
  manifest.baseResearchRelease.note =
    "The seven SCI evidence entities and five frozen observed-cell exemplars remain unchanged. Iteration 2.25 adds four named dorsal-horn route memberships: two reuse frozen census objects and two are supplementary exact NeuroMorpho objects. Deduplication yields eight active unique morphologies and five named dorsal-horn routes without expanding the 142-record census. Nine representation states span eleven routes. Missing same-specimen internal geometry still renders zero primitives; no cross-source identity or project registration is created.";

  manifest.authoritativeInputs.push(
    receipt(ADDITIONAL_INPUTS[0], routePackBytes),
    receipt(ADDITIONAL_INPUTS[1], supplementaryAssetManifestBytes),
  );
  check(
    manifest.authoritativeInputs.length === EXPECTED.inputCount,
    "research iteration 2.25 must contain exactly 22 authoritative inputs",
  );
  check(
    new Set(manifest.authoritativeInputs.map((input) => input.path)).size ===
      EXPECTED.inputCount,
    "research iteration 2.25 authoritative input paths are not unique",
  );
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;

  const routeMemberships = routePack.routes.map((route) => ({
    routeId: route.routeId,
    neuronId: route.sourceRecord.neuronId,
    assetId: route.sourceRecord.assetId,
    censusMembership: route.censusMembership,
    sourceAuthority: route.sourceAuthority,
    geometryBytes: route.sourceObjects.geometry.bytes,
    geometrySha256: route.sourceObjects.geometry.sha256,
    swcBytes: route.sourceObjects.swc.bytes,
    swcSha256: route.sourceObjects.swc.sha256,
    sourceDiameterAvailable: route.geometryReceipt.sourceDiameterAvailable,
    internalPrimitiveCount:
      route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount,
    crossSourceIdentityCount: route.identityBoundary.crossSourceIdentityCount,
    projectRegistrationCount: route.identityBoundary.projectRegistrationCount,
  }));
  const namedDorsalHornRouteIds = [
    manifest.exactReferences.grpDorsalHornObservedMorphology.routeId,
    ...routePack.routes.map((route) => route.routeId),
  ];

  manifest.exactReferences.dorsalHornObservedMorphologyRoutePack = {
    contractId: routePack.contractId,
    contractReleaseId: routePack.releaseId,
    repository: routePack.repository,
    contractReceipt: {
      path: ADDITIONAL_INPUTS[0].path,
      bytes: routePackBytes.byteLength,
      sha256: sha256(routePackBytes),
    },
    supplementaryAssetManifestReceipt: {
      path: ADDITIONAL_INPUTS[1].path,
      assetSetId: supplementaryAssetManifest.assetSetId,
      repositoryRelease: supplementaryAssetManifest.repositoryRelease,
      bytes: supplementaryAssetManifestBytes.byteLength,
      sha256: sha256(supplementaryAssetManifestBytes),
      fileCount: supplementaryAssetManifest.summary.fileCount,
      files: structuredClone(supplementaryAssetManifest.files),
    },
    frozenExemplarCount: routePack.runtimeMergePolicy.frozenLegacyExemplarCount,
    frozenCensusRecordCount: routePack.runtimeMergePolicy.frozenCensusRecordCount,
    routePackMembershipCount: routePack.summary.routeCount,
    overlappingFrozenNeuronIds: structuredClone(
      routePack.runtimeMergePolicy.overlappingFrozenNeuronIds,
    ),
    overlapCount: routePack.runtimeMergePolicy.overlappingFrozenNeuronIds.length,
    supplementaryNeuronIds: structuredClone(
      routePack.runtimeMergePolicy.supplementaryNeuronIds,
    ),
    supplementaryRecordCount: routePack.summary.supplementaryRecordCount,
    activeUniqueMorphologyCount:
      routePack.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount,
    namedDorsalHornRouteCount:
      routePack.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount,
    namedDorsalHornRouteIds,
    censusExpansionCount: routePack.runtimeMergePolicy.censusExpansionCount,
    routeMemberships,
    sourceDiameterAvailableCount: routePack.summary.sourceDiameterAvailableCount,
    sourceCompleteAxonCount: routePack.summary.sourceCompleteAxonCount,
    sameSpecimenInternalStructureCount:
      routePack.summary.sameSpecimenInternalStructureCount,
    renderedInternalPrimitiveCount: routePack.summary.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: routePack.summary.exactCrossSourceIdentityCount,
    projectRegistrationCount: routePack.summary.projectRegistrationCount,
  };

  const internalReferenceRoute = representation.routes.find(
    (route) => route.routeId === "internal_reference",
  );
  check(Boolean(internalReferenceRoute), "internal-reference representation route is missing");
  manifest.exactReferences.evidenceAware3dRepresentation = {
    contractId: representation.contractId,
    contractReleaseId: representation.releaseId,
    deterministicMaterializationReceipt: {
      path: "data/evidence-aware-3d-representation-contract-0.2.json",
      bytes: representationBuild.bytes.byteLength,
      sha256: sha256(representationBuild.bytes),
      buildInputs: structuredClone(representation.buildInputs),
    },
    representationStateCount: representation.representationStates.length,
    representationStateIds: representation.representationStates.map(
      (state) => state.id,
    ),
    routeCount: representation.routes.length,
    routeIds: representation.routes.map((route) => route.routeId),
    dorsalHornRouteCount: routePack.routes.length,
    dorsalHornRouteIds: routePack.routes.map((route) => route.routeId),
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
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  };

  manifest.registrySummary = {
    canonicalSourcePackageCount: sourceRegistry.sourceCount,
    canonicalRecordSetCount: recordSetCount,
    researchUpgradeCount: upgradeRegistry.summary.upgradeCount,
    sourceRegistryReceipt: {
      ...findInput(manifest, "researchSourceRegistry"),
    },
    upgradeRegistryReceipt: {
      ...findInput(manifest, "researchModelUpgradeRegistry"),
    },
    crossSourceIdentityCount: 0,
    registrationCount: 0,
    renderedInternalPrimitiveCount: 0,
  };

  manifest.scientificBoundaries.dorsalHornObservedMorphologyRoutePack =
    "The four route-pack records remain independent source-local reconstructions. NMO 104003 and 108974 reuse frozen census identities; NMO 170035 and 249676 are supplementary and do not expand the 142-record census. Co-display, shared markers or shared region labels create no same-cell, molecular-profile, SCI-entity, atlas or registration relationship. Missing diameters, axons, membranes, nuclei, organelles, synapses, receptors and ultrastructure remain explicitly unavailable and never authorize procedural biological geometry.";
  manifest.scientificBoundaries.evidenceAware3dRepresentation =
    "Nine evidence states cover eleven routes. Every route exposes its representation authority and source receipt. Missing object geometry yields zero primitives; standardized soma points and radius derivatives are not membranes, nuclei or internal structures. Procedural biological proxies, cross-source identities and project registrations remain prohibited.";
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

  const manifest = await buildResearchIterationManifest225();
  const bytes = Buffer.from(serializeResearchIterationManifest225(manifest), "utf8");
  if (args.has("--write")) await writeFile(OUTPUT_PATH, bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(
      committed.equals(bytes),
      "research iteration 2.25 manifest is stale; run builder with --write",
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
        routePackMembershipCount:
          manifest.exactReferences.dorsalHornObservedMorphologyRoutePack
            .routePackMembershipCount,
        activeUniqueMorphologyCount:
          manifest.exactReferences.dorsalHornObservedMorphologyRoutePack
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
