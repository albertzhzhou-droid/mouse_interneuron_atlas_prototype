#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(
  PROJECT_ROOT,
  "data/research-iteration-manifest-2.25.json",
);
const REPRESENTATION_PATH = path.join(
  PROJECT_ROOT,
  "data/evidence-aware-3d-representation-contract-0.2.json",
);
const EXPECTED_MANIFEST_CONTENT_SHA256 =
  "f7bc56dfe6671b67f0fa8a5115faadf615e98e056d207894c75441fb3a5dc6e1";

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
]);

const EXPECTED_RECEIPTS = Object.freeze({
  researchSourceRegistry: {
    bytes: 84564,
    sha256: "3535f2e9b501743a3c432821bb2f944abcf18c6b68b1f02a0cccd52af0d9157b",
  },
  researchModelUpgradeRegistry: {
    bytes: 224132,
    sha256: "5d39f33d892b70fafe5b0fc3f48bd9413f65cb5af96a1ebcc515cdcf279e0b04",
  },
  dorsalHornObservedMorphologyRoutePackContract: {
    bytes: 42226,
    sha256: "923db6a9ed013e856ffc7c6ab601c67b25608ac68572538c578fd75fa41fe593",
  },
  dorsalHornObservedMorphologySupplementaryAssetManifest: {
    bytes: 1696,
    sha256: "4f64fb595a4362cf0403cb0d3abc3c6fdc14b7f74d473a82ccd67bed9b9dab87",
  },
  evidenceAware3dRepresentationContract02: {
    bytes: 15818,
    sha256: "86568689f340d8f506590e16e28f3ffed25bc7e040b09f422126a53abcd87346",
  },
});

const EXPECTED_NAMED_DORSAL_HORN_ROUTES = Object.freeze([
  "mouse.sc.grp_dorsal_horn.observed.nmo_109021",
  "mouse.sc.grpr_lamina_i_ii.observed.nmo_249676",
  "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108974",
  "mouse.sc.pv_pax2_lamina_ii_iii.observed.nmo_170035",
  "mouse.sc.pdyn_dorsal_horn.observed.nmo_104003",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function same(value, expected) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export async function validateResearchIterationManifest225(
  manifestOverride = null,
) {
  const [manifest, representationBytes] = await Promise.all([
    manifestOverride ?? readFile(MANIFEST_PATH, "utf8").then(JSON.parse),
    readFile(REPRESENTATION_PATH),
  ]);
  const errors = [];

  check(
    manifest.manifestContentSha256 === EXPECTED_MANIFEST_CONTENT_SHA256,
    "immutable 2.25 snapshot content SHA-256 drifted",
    errors,
  );
  check(
    manifest.manifestContentSha256 === computeManifestContentSha256(manifest),
    "manifest content SHA-256 is invalid",
    errors,
  );
  check(
    manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.25.0" &&
      manifest.manifestSchemaVersion === "2.25.0" &&
      manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype" &&
      manifest.application?.version === "2.25.0-research.1",
    "2.25 release identity or application version drifted",
    errors,
  );
  check(
    manifest.integrity.inputCount === 22 &&
      manifest.authoritativeInputs.length === 22,
    "2.25 authoritative-input count changed",
    errors,
  );
  check(
    same(
      manifest.authoritativeInputs.map((input) => input.id),
      EXPECTED_INPUT_IDS,
    ),
    "2.25 authoritative-input roster or order changed",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs.map((input) => input.path)).size === 22,
    "2.25 authoritative-input paths are not unique",
    errors,
  );

  const inputById = new Map(
    manifest.authoritativeInputs.map((input) => [input.id, input]),
  );
  for (const [id, expected] of Object.entries(EXPECTED_RECEIPTS)) {
    if (id === "evidenceAware3dRepresentationContract02") continue;
    const input = inputById.get(id);
    check(Boolean(input), `missing exact input receipt ${id}`, errors);
    if (!input) continue;
    check(
      input.bytes === expected.bytes && input.sha256 === expected.sha256,
      `${id} exact receipt drifted`,
      errors,
    );
  }

  const pack = manifest.exactReferences.dorsalHornObservedMorphologyRoutePack;
  check(Boolean(pack), "dorsal-horn route-pack reference is missing", errors);
  if (pack) {
    check(pack.frozenExemplarCount === 5, "frozen exemplar count changed", errors);
    check(
      pack.frozenCensusRecordCount === 142 && pack.censusExpansionCount === 0,
      "frozen 142-record census was changed or expanded",
      errors,
    );
    check(
      pack.routePackMembershipCount === 4 && pack.routeMemberships.length === 4,
      "route-pack membership count changed",
      errors,
    );
    check(
      pack.overlapCount === 2 &&
        same(pack.overlappingFrozenNeuronIds, [104003, 108974]),
      "route-pack frozen-overlap set changed",
      errors,
    );
    check(
      pack.supplementaryRecordCount === 2 &&
        same(pack.supplementaryNeuronIds, [170035, 249676]),
      "route-pack supplementary set changed",
      errors,
    );
    check(
      pack.activeUniqueMorphologyCount === 8 &&
        pack.frozenExemplarCount + 1 + pack.supplementaryRecordCount === 8,
      "deduplicated active-morphology count changed",
      errors,
    );
    check(
      pack.namedDorsalHornRouteCount === 5 &&
        same(pack.namedDorsalHornRouteIds, EXPECTED_NAMED_DORSAL_HORN_ROUTES),
      "named dorsal-horn route roster changed",
      errors,
    );
    check(
      pack.supplementaryAssetManifestReceipt.fileCount === 6 &&
        pack.supplementaryAssetManifestReceipt.files.length === 6,
      "supplementary asset count changed",
      errors,
    );
    check(
      pack.sameSpecimenInternalStructureCount === 0 &&
        pack.renderedInternalPrimitiveCount === 0 &&
        pack.crossSourceIdentityCount === 0 &&
        pack.projectRegistrationCount === 0,
      "route pack creates same-specimen internals, primitives, identity or REG",
      errors,
    );
    check(
      pack.routeMemberships.every(
        (route) =>
          route.internalPrimitiveCount === 0 &&
          route.crossSourceIdentityCount === 0 &&
          route.projectRegistrationCount === 0,
      ),
      "a route-pack member creates an internal primitive, identity or REG",
      errors,
    );
  }

  const representation =
    manifest.exactReferences.evidenceAware3dRepresentation;
  check(
    representation.representationStateCount === 9 &&
      representation.routeCount === 11,
    "evidence-aware state or route count changed",
    errors,
  );
  check(
    representation.representationStateIds.length === 9 &&
      new Set(representation.representationStateIds).size === 9 &&
      representation.routeIds.length === 11 &&
      new Set(representation.routeIds).size === 11,
    "evidence-aware state or route roster is not exact and unique",
    errors,
  );
  check(
    representation.dorsalHornRouteCount === 4 &&
      same(
        representation.dorsalHornRouteIds,
        EXPECTED_NAMED_DORSAL_HORN_ROUTES.slice(1),
      ),
    "evidence-aware dorsal-horn route extension changed",
    errors,
  );
  check(
    same(representation.internalReferenceStateIds, ["UNAVAILABLE"]) &&
      representation.internalReferenceRenderedPrimitivePolicy ===
        "zero_primitives" &&
      representation.proceduralBiologicalProxyAllowed === false &&
      representation.missingLayerPrimitiveCount === 0 &&
      representation.crossSourceIdentityCount === 0 &&
      representation.projectRegistrationCount === 0,
    "evidence-aware representation admits a proxy, primitive, identity or REG",
    errors,
  );
  const representationReceipt =
    representation.deterministicMaterializationReceipt;
  const expectedRepresentationReceipt =
    EXPECTED_RECEIPTS.evidenceAware3dRepresentationContract02;
  check(
    representationReceipt.bytes === expectedRepresentationReceipt.bytes &&
      representationReceipt.sha256 === expectedRepresentationReceipt.sha256 &&
      representationBytes.byteLength === expectedRepresentationReceipt.bytes &&
      sha256(representationBytes) === expectedRepresentationReceipt.sha256,
    "deterministic representation 0.2 materialization receipt drifted",
    errors,
  );

  const registry = manifest.registrySummary;
  check(
    registry.canonicalSourcePackageCount === 24 &&
      registry.canonicalRecordSetCount === 25 &&
      registry.researchUpgradeCount === 118,
    "source-package, record-set or upgrade count changed",
    errors,
  );
  check(
    same(registry.sourceRegistryReceipt, inputById.get("researchSourceRegistry")) &&
      same(
        registry.upgradeRegistryReceipt,
        inputById.get("researchModelUpgradeRegistry"),
      ),
    "registry summary receipts disagree with authoritative inputs",
    errors,
  );
  check(
    registry.crossSourceIdentityCount === 0 &&
      registry.registrationCount === 0 &&
      registry.renderedInternalPrimitiveCount === 0 &&
      manifest.registrations.count === 0 &&
      manifest.registrations.records.length === 0,
    "2.25 creates an identity, REG or internal primitive",
    errors,
  );

  if (errors.length) {
    throw new Error(
      `Research iteration 2.25 manifest validation failed:\n- ${errors.join("\n- ")}`,
    );
  }
  return {
    releaseId: manifest.releaseId,
    inputCount: manifest.integrity.inputCount,
    frozenExemplarCount: pack.frozenExemplarCount,
    censusRecordCount: pack.frozenCensusRecordCount,
    routePackMembershipCount: pack.routePackMembershipCount,
    overlapCount: pack.overlapCount,
    supplementaryRecordCount: pack.supplementaryRecordCount,
    activeUniqueMorphologyCount: pack.activeUniqueMorphologyCount,
    namedDorsalHornRouteCount: pack.namedDorsalHornRouteCount,
    representationStateCount: representation.representationStateCount,
    representationRouteCount: representation.routeCount,
    sourcePackageCount: registry.canonicalSourcePackageCount,
    recordSetCount: registry.canonicalRecordSetCount,
    researchUpgradeCount: registry.researchUpgradeCount,
    crossSourceIdentityCount: registry.crossSourceIdentityCount,
    registrationCount: registry.registrationCount,
    renderedInternalPrimitiveCount: registry.renderedInternalPrimitiveCount,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest225()
    .then((summary) =>
      process.stdout.write(
        `Research iteration 2.25 manifest valid: ${summary.inputCount} exact inputs, ${summary.sourcePackageCount} source packages, ${summary.recordSetCount} record sets, ${summary.researchUpgradeCount} upgrades, ${summary.routePackMembershipCount} route-pack memberships, ${summary.activeUniqueMorphologyCount} active unique morphologies, ${summary.representationRouteCount} representation routes, ${summary.renderedInternalPrimitiveCount} internal primitives and ${summary.registrationCount} REG.\n`,
      ),
    )
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
