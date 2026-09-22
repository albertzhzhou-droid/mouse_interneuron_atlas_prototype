#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.26.json");
const EXPECTED_MANIFEST_CONTENT_SHA256 =
  "fbf40be71ab73e4a550d7be3e2791ef184ef784a33b5e8c3ac78f4e3cb465ba0";

const EXPECTED_INPUT_IDS = Object.freeze([
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
  "dorsalHornObservedMorphologyRoutePackContract",
  "dorsalHornObservedMorphologySupplementaryAssetManifest",
  "functionalClassObservedMorphologyRoutePackContract",
  "functionalClassObservedMorphologyAssetManifest",
  "evidenceAware3dRepresentationContract03",
  "researchIterationManifestSchema226",
]);

const EXPECTED_RECEIPTS = Object.freeze({
  researchSourceRegistry: {
    bytes: 87071,
    sha256: "79cdc0e19b92a226fd5857372df3f33b20b624ba8c8511fa20efecfda5a599d9",
  },
  researchModelUpgradeRegistry: {
    bytes: 251969,
    sha256: "802f4ea756ff5fd8776318ccfae0afa6d10f105fb0c77e7f4246b2001cedbc75",
  },
  packageLock: {
    bytes: 300345,
    sha256: "689461fc77ec105955a9cbe18f170487d4e80313145c6b87934de5915fc990fc",
  },
  functionalClassObservedMorphologyRoutePackContract: {
    bytes: 28937,
    sha256: "400b17afd707c3b53ee0cbb1d6402943535111c01402eb3903b256d12e176840",
  },
  functionalClassObservedMorphologyAssetManifest: {
    bytes: 2768,
    sha256: "a44d7b109357d086d0d7bc27481ee76bdcfe7382e804f74aeb08195b47878f5f",
  },
  evidenceAware3dRepresentationContract03: {
    bytes: 18496,
    sha256: "00c464afc793b8853d176366ece708f993c89920dba4027789bc7e84d9b03aa6",
  },
  researchIterationManifestSchema226: {
    bytes: 19637,
    sha256: "109f6bb2522fd3aca696df2eda1e8d7ce41375ae5d30c7e656f98d3a1c9cd59f",
  },
});

const EXPECTED_FUNCTIONAL_ROUTES = Object.freeze([
  {
    routeId: "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674",
    neuronId: 45674,
    assetId: "NeuroMorpho:45674",
    nodeCount: 6973,
    segmentCount: 6972,
    axonNodeCount: 6247,
    swcBytes: 294364,
    swcSha256: "95b2fc29900a994ef87d6f50c07481115f94207c5ebaeb9f436e7e494edac1fd",
    datBytes: 353251,
    datSha256: "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87",
    strainJoinStatus: "context_consistent_not_individual_genotype_validation",
  },
  {
    routeId: "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424",
    neuronId: 50424,
    assetId: "NeuroMorpho:50424",
    nodeCount: 9805,
    segmentCount: 9804,
    axonNodeCount: 8718,
    swcBytes: 381795,
    swcSha256: "0cdb5c32555f94d2ffd1765d8c21f1f95703692c45917f2a2d2449ecc457138b",
    datBytes: 480757,
    datSha256: "90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9",
    strainJoinStatus: "conflict_unresolved",
  },
]);

const EXPECTED_FUNCTIONAL_ROUTE_IDS = Object.freeze(
  EXPECTED_FUNCTIONAL_ROUTES.map((route) => route.routeId),
);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function same(value, expected) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export async function validateResearchIterationManifest226(manifestOverride = null) {
  const manifest =
    manifestOverride ?? JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const errors = [];

  check(
    manifest.manifestContentSha256 === EXPECTED_MANIFEST_CONTENT_SHA256,
    "immutable 2.26 snapshot content SHA-256 drifted",
    errors,
  );
  check(
    manifest.manifestContentSha256 === computeManifestContentSha256(manifest),
    "manifest content SHA-256 is invalid",
    errors,
  );
  check(
    manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.26.0" &&
      manifest.manifestSchemaVersion === "2.26.0" &&
      manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype" &&
      manifest.application?.version === "2.26.0-research.1",
    "2.26 release identity or application version drifted",
    errors,
  );
  check(
    manifest.integrity?.inputCount === 26 &&
      manifest.authoritativeInputs?.length === 26,
    "2.26 authoritative-input count changed",
    errors,
  );
  check(
    same(
      manifest.authoritativeInputs?.map((input) => input.id),
      EXPECTED_INPUT_IDS,
    ),
    "2.26 authoritative-input roster or order changed",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 26,
    "2.26 authoritative-input paths are not unique",
    errors,
  );

  const inputById = new Map(
    manifest.authoritativeInputs?.map((input) => [input.id, input]) ?? [],
  );
  for (const [id, expected] of Object.entries(EXPECTED_RECEIPTS)) {
    const input = inputById.get(id);
    check(Boolean(input), `missing exact input receipt ${id}`, errors);
    if (!input) continue;
    check(
      input.bytes === expected.bytes && input.sha256 === expected.sha256,
      `${id} exact receipt drifted`,
      errors,
    );
  }

  const pack = manifest.exactReferences?.functionalClassObservedMorphologyRoutePack;
  check(Boolean(pack), "functional-class route-pack reference is missing", errors);
  if (pack) {
    check(
      pack.routeCount === 2 &&
        pack.uniqueNeuronCount === 2 &&
        same(pack.neuronIds, [45674, 50424]) &&
        same(pack.supplementaryNeuronIds, [45674, 50424]),
      "functional-class route or neuron roster changed",
      errors,
    );
    check(
      pack.preMergeUniqueMorphologyCount === 8 &&
        pack.activeUniqueMorphologyCount === 10 &&
        pack.preExistingNamedRouteCount === 5 &&
        pack.namedRouteCount === 7 &&
        pack.namedDorsalHornRouteCount === 6 &&
        pack.namedVentralHornRouteCount === 1,
      "functional-class active-morphology or named-route arithmetic changed",
      errors,
    );
    check(
      pack.frozenExemplarCount === 5 &&
        pack.frozenCensusRecordCount === 142 &&
        pack.censusExpansionCount === 0,
      "frozen exemplar or 142-record census denominator changed",
      errors,
    );
    check(
      pack.assetManifestReceipt?.fileCount === 10 &&
        pack.assetManifestReceipt?.files?.length === 10,
      "functional-class delta asset inventory changed",
      errors,
    );
    check(
      pack.sourceDiameterAvailableCount === 2 &&
        pack.observedAxonRouteCount === 2 &&
        pack.sourceCompleteAxonCount === 0 &&
        pack.originalDatReceiptCount === 2 &&
        pack.nativeDatSemanticAdmissionCount === 0 &&
        pack.sameCellElectrophysiologyJoinCount === 0 &&
        pack.sameSpecimenInternalStructureCount === 0 &&
        pack.renderedInternalPrimitiveCount === 0 &&
        pack.crossSourceIdentityCount === 0 &&
        pack.projectRegistrationCount === 0,
      "functional-class pack creates a complete-axon, DAT, physiology, internal, identity or REG claim",
      errors,
    );
    check(
      pack.routeMemberships?.length === EXPECTED_FUNCTIONAL_ROUTES.length,
      "functional-class route-membership denominator changed",
      errors,
    );
    EXPECTED_FUNCTIONAL_ROUTES.forEach((expected, index) => {
      const route = pack.routeMemberships?.[index];
      check(Boolean(route), `missing functional-class route index ${index}`, errors);
      if (!route) return;
      check(
        route.routeId === expected.routeId &&
          route.neuronId === expected.neuronId &&
          route.assetId === expected.assetId &&
          route.nodeCount === expected.nodeCount &&
          route.segmentCount === expected.segmentCount &&
          route.observedAxonNodeCount === expected.axonNodeCount &&
          route.swcReceipt?.bytes === expected.swcBytes &&
          route.swcReceipt?.sha256 === expected.swcSha256 &&
          route.originalDatReceipt?.bytes === expected.datBytes &&
          route.originalDatReceipt?.sha256 === expected.datSha256 &&
          route.strainJoinStatus === expected.strainJoinStatus,
        `${expected.routeId} exact object receipt or metadata boundary changed`,
        errors,
      );
      check(
        route.censusMembership === false &&
          route.completeAxonClaim === false &&
          route.repositoryWeightValidForBiologicalInterpretation === false &&
          route.nativeDatParsed === false &&
          route.nativeDatRendered === false &&
          route.nativeDatSemanticObjectCount === 0 &&
          route.sameCellElectrophysiologyJoinStatus === "not_established" &&
          route.internalPrimitiveCount === 0 &&
          route.crossSourceIdentityCount === 0 &&
          route.projectRegistrationCount === 0,
        `${expected.routeId} admits an unsupported biological claim`,
        errors,
      );
    });
  }

  const representation = manifest.exactReferences?.evidenceAware3dRepresentation;
  check(
    representation?.contractId === "evidence-aware-3d-representation-contract-0.3" &&
      representation?.representationStateCount === 9 &&
      representation?.routeCount === 13,
    "evidence-aware representation 0.3 state or route count changed",
    errors,
  );
  check(
    representation?.representationStateIds?.length === 9 &&
      new Set(representation?.representationStateIds).size === 9 &&
      representation?.routeIds?.length === 13 &&
      new Set(representation?.routeIds).size === 13,
    "evidence-aware representation state or route roster is not exact and unique",
    errors,
  );
  check(
    representation?.functionalClassRouteCount === 2 &&
      same(representation?.functionalClassRouteIds, EXPECTED_FUNCTIONAL_ROUTE_IDS) &&
      EXPECTED_FUNCTIONAL_ROUTE_IDS.every((routeId) =>
        representation?.routeIds?.includes(routeId),
      ),
    "evidence-aware functional-class route extension changed",
    errors,
  );
  check(
    same(representation?.internalReferenceStateIds, ["UNAVAILABLE"]) &&
      representation?.internalReferenceRenderedPrimitivePolicy === "zero_primitives" &&
      representation?.proceduralBiologicalProxyAllowed === false &&
      representation?.missingLayerPrimitiveCount === 0 &&
      representation?.nativeDatSemanticAdmissionCount === 0 &&
      representation?.sameCellElectrophysiologyJoinCount === 0 &&
      representation?.crossSourceIdentityCount === 0 &&
      representation?.projectRegistrationCount === 0,
    "evidence-aware representation admits a proxy, DAT object, physiology join, primitive, identity or REG",
    errors,
  );

  const registry = manifest.registrySummary;
  check(
    registry?.canonicalSourcePackageCount === 24 &&
      registry?.canonicalRecordSetCount === 26 &&
      registry?.researchUpgradeCount === 124,
    "source-package, record-set or upgrade count changed",
    errors,
  );
  check(
    same(registry?.sourceRegistryReceipt, inputById.get("researchSourceRegistry")) &&
      same(
        registry?.upgradeRegistryReceipt,
        inputById.get("researchModelUpgradeRegistry"),
      ),
    "registry summary receipts disagree with authoritative inputs",
    errors,
  );
  check(
    registry?.crossSourceIdentityCount === 0 &&
      registry?.registrationCount === 0 &&
      registry?.renderedInternalPrimitiveCount === 0 &&
      manifest.registrations?.count === 0 &&
      manifest.registrations?.records?.length === 0,
    "2.26 creates an identity, REG or internal primitive",
    errors,
  );

  if (errors.length) {
    throw new Error(
      `Research iteration 2.26 manifest validation failed:\n- ${errors.join("\n- ")}`,
    );
  }

  return {
    releaseId: manifest.releaseId,
    inputCount: manifest.integrity.inputCount,
    frozenExemplarCount: pack.frozenExemplarCount,
    censusRecordCount: pack.frozenCensusRecordCount,
    functionalRouteCount: pack.routeCount,
    activeUniqueMorphologyCount: pack.activeUniqueMorphologyCount,
    namedRouteCount: pack.namedRouteCount,
    representationStateCount: representation.representationStateCount,
    representationRouteCount: representation.routeCount,
    sourcePackageCount: registry.canonicalSourcePackageCount,
    recordSetCount: registry.canonicalRecordSetCount,
    researchUpgradeCount: registry.researchUpgradeCount,
    nativeDatSemanticAdmissionCount: pack.nativeDatSemanticAdmissionCount,
    sameCellElectrophysiologyJoinCount: pack.sameCellElectrophysiologyJoinCount,
    crossSourceIdentityCount: registry.crossSourceIdentityCount,
    registrationCount: registry.registrationCount,
    renderedInternalPrimitiveCount: registry.renderedInternalPrimitiveCount,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest226()
    .then((summary) =>
      process.stdout.write(
        `Research iteration 2.26 manifest valid: ${summary.inputCount} exact inputs, ${summary.sourcePackageCount} source packages, ${summary.recordSetCount} record sets, ${summary.researchUpgradeCount} upgrades, ${summary.functionalRouteCount} functional-class routes, ${summary.activeUniqueMorphologyCount} active unique morphologies, ${summary.representationRouteCount} representation routes, ${summary.nativeDatSemanticAdmissionCount} DAT semantic admissions, ${summary.renderedInternalPrimitiveCount} internal primitives and ${summary.registrationCount} REG.\n`,
      ),
    )
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
