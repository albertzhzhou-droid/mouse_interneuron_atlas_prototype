#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.27.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.27.schema.json");
const EXPECTED_MANIFEST_CONTENT_SHA256 =
  "d1d0d3420f4bd72e45e50f32e31ff02c81e9bf16594ba468f41f36215221943d";
const EXPECTED_MANIFEST_FILE_BYTES = 56245;
const EXPECTED_MANIFEST_FILE_SHA256 =
  "88560df20ed43c2cb3e002f654a8919b24967fefe25de70ae421b5b9ae71d233";

const EXPECTED_PARENT = Object.freeze({
  path: "data/research-iteration-manifest-2.26.json",
  releaseId: "ohri-mouse-interneuron-research-iteration-2.26.0",
  bytes: 40818,
  fileSha256: "f65972360bfa8c376b9989a1e03a7a7e1e0029f5b76b2837742ebe52298a9196",
  contentSha256: "fbf40be71ab73e4a550d7be3e2791ef184ef784a33b5e8c3ac78f4e3cb465ba0",
});

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
  "prpDorsalHornObservedMorphologyRoutePackContract",
  "prpDorsalHornObservedMorphologyAssetManifest",
  "evidenceAware3dRepresentationContract04",
  "researchIterationManifestSchema227",
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

const EXPECTED_REPRESENTATION_ROUTE_IDS = Object.freeze([
  "main.reference_anatomy",
  "main.population_evidence",
  "main.legacy_observed_cell_forms",
  "mouse.sc.grp_dorsal_horn.observed.nmo_109021",
  "microns_observed_reference",
  "internal_reference",
  "ronzano_premotor_positions",
  "mouse.sc.grpr_lamina_i_ii.observed.nmo_249676",
  "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108974",
  "mouse.sc.pv_pax2_lamina_ii_iii.observed.nmo_170035",
  "mouse.sc.pdyn_dorsal_horn.observed.nmo_104003",
  "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674",
  "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424",
  "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
  "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
]);

const EXPECTED_PRP_ROUTES = Object.freeze([
  Object.freeze({
    routeId: "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
    neuronId: 50394,
    assetId: "NeuroMorpho:50394",
    labels: Object.freeze([
      "Neuronal Nitric Oxide Synthase (nNOS)-positive",
      "prion protein (PrP) promoter-positive",
      "interneuron",
    ]),
    nodeCount: 4012,
    segmentCount: 4011,
    axonNodeCount: 1520,
    metadata: Object.freeze({ bytes: 1542, sha256: "d5954d795e3a2308ae3bb7077d546766641b2e169c4be73f2bfdaa0c663081d1" }),
    morphometry: Object.freeze({ bytes: 469, sha256: "b2e1da4a3ae35e854969a16357c014851745b2c67020b372615a03de77ef9162" }),
    geometry: Object.freeze({
      bytes: 429479,
      sha256: "cbc08ede052636e2f30249d1a633a5f1b88531d375f80f23751b062c48eeda47",
      canonicalGeometrySha256: "8f50c34eedb33adc44402f60c5bd18e4e19f3b6dd65ea5890ce3cb93240734df",
      topologySha256: "102a85df24185bd34eeb4fabbd4abdf4924ef82e8d82140bc386651569843f87",
    }),
    swc: Object.freeze({ bytes: 151317, sha256: "adeb2b0c6934ae07f32d54e8fcaebc8cee29429d884e44692756ee15da8a00d2" }),
    dat: Object.freeze({ bytes: 191975, sha256: "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109" }),
  }),
  Object.freeze({
    routeId: "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
    neuronId: 50408,
    assetId: "NeuroMorpho:50408",
    labels: Object.freeze([
      "galanin-expressing",
      "prion protein (PrP) promoter-positive",
      "interneuron",
    ]),
    nodeCount: 6125,
    segmentCount: 6124,
    axonNodeCount: 3244,
    metadata: Object.freeze({ bytes: 1515, sha256: "6d6be05370c9054aa0956ad3cdfb0ec94acfad560216b57da5d67fe5d32f2444" }),
    morphometry: Object.freeze({ bytes: 470, sha256: "9c849e5a828b99f37e215dc1b09856617a70b2ef1c0505ff3b81a151d028606d" }),
    geometry: Object.freeze({
      bytes: 638051,
      sha256: "c545292d72010af04760fb0851fa479260c20865b4e678f596bbabf7f13f0123",
      canonicalGeometrySha256: "c0c5d068c03437f2106892e8994f6b631243036af17e1bdf6bd0362c3c286271",
      topologySha256: "e14539c8e605dfa0fa492fa2176e0ba502e40ba369be689c691ba8de27f256cc",
    }),
    swc: Object.freeze({ bytes: 222351, sha256: "452c2b3d76d9680318470ba16b5c271a403018a1c6dcedaa94b68f1fdec6c470" }),
    dat: Object.freeze({ bytes: 300076, sha256: "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2" }),
  }),
]);

const EXPECTED_ASSET_KINDS = Object.freeze([
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

function formatSchemaErrors(errors = []) {
  return (errors ?? []).map((error) =>
    `${error.instancePath || "/"}: ${error.message ?? "schema violation"}`,
  );
}

async function checkPrpAssetFiles(pack, errors) {
  const assetRoot = path.join(
    PROJECT_ROOT,
    "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1",
  );
  const files = pack?.assetManifestReceipt?.files ?? [];
  await Promise.all(
    files.map(async (file) => {
      const resolved = path.resolve(assetRoot, file.path);
      const relative = path.relative(assetRoot, resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        errors.push(`PrP asset ${file.path} escapes its asset root`);
        return;
      }
      try {
        const bytes = await readFile(resolved);
        check(
          bytes.byteLength === file.bytes && sha256(bytes) === file.sha256,
          `PrP asset ${file.path} on-disk receipt drifted`,
          errors,
        );
      } catch (error) {
        errors.push(`PrP asset ${file.path} cannot be read: ${error instanceof Error ? error.message : error}`);
      }
    }),
  );
}

export async function validateResearchIterationManifest227(manifestOverride = null) {
  const [manifestBytes, schema] = await Promise.all([
    manifestOverride === null ? readFile(MANIFEST_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
  ]);
  const manifest = manifestOverride ?? JSON.parse(manifestBytes.toString("utf8"));
  const errors = [];

  if (manifestOverride === null) {
    check(
      manifestBytes.byteLength === EXPECTED_MANIFEST_FILE_BYTES &&
        sha256(manifestBytes) === EXPECTED_MANIFEST_FILE_SHA256,
      "immutable 2.27 manifest file bytes drifted",
      errors,
    );
  }

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...formatSchemaErrors(validateSchema.errors).map((error) => `schema ${error}`));
  }

  check(
    manifest.manifestContentSha256 === EXPECTED_MANIFEST_CONTENT_SHA256,
    "2.27 manifest snapshot content SHA-256 drifted",
    errors,
  );
  check(
    manifest.manifestContentSha256 === computeManifestContentSha256(manifest),
    "manifest content SHA-256 is invalid",
    errors,
  );
  check(
    manifest.manifestSchemaVersion === "2.27.0" &&
      manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.27.0" &&
      manifest.releaseDate === "2026-08-31" &&
      manifest.releaseStatus === "localhost_research_iteration" &&
      manifest.application?.name === "ohri-mouse-interneuron-atlas-prototype" &&
      manifest.application?.version === "2.27.0-research.1",
    "2.27 release identity or application version drifted",
    errors,
  );
  check(same(manifest.parentIterationManifest, EXPECTED_PARENT), "immutable 2.26 parent receipt drifted", errors);

  check(
    manifest.integrity?.inputCount === 30 && manifest.authoritativeInputs?.length === 30,
    "2.27 authoritative-input count changed",
    errors,
  );
  check(
    same(manifest.authoritativeInputs?.map((input) => input.id), EXPECTED_INPUT_IDS),
    "2.27 authoritative-input roster or order changed",
    errors,
  );
  check(
    new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 30 &&
      new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 30,
    "2.27 authoritative-input IDs or paths are not unique",
    errors,
  );
  const inputs = new Map(
    manifest.authoritativeInputs?.map((input) => [input.id, input]) ?? [],
  );
  const pack = manifest.exactReferences?.prpDorsalHornObservedMorphologyRoutePack;
  check(Boolean(pack), "PrP dorsal-horn route-pack reference is missing", errors);
  if (pack) {
    check(
      pack.contractId === "prp-dorsal-horn-observed-morphology-route-pack-0.1" &&
        pack.contractReceipt?.bytes === 31435 &&
        pack.contractReceipt?.sha256 === "a8737dff3fbfe244d36e2af19b32e1dd8142e2626a90c0d89c00881b83eaf709" &&
        pack.assetManifestReceipt?.bytes === 2766 &&
        pack.assetManifestReceipt?.sha256 === "2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f",
      "PrP contract or asset-manifest receipt drifted",
      errors,
    );
    check(
      pack.routeCount === 2 &&
        pack.uniqueNeuronCount === 2 &&
        same(pack.neuronIds, [50394, 50408]) &&
        same(pack.supplementaryNeuronIds, [50394, 50408]),
      "PrP route or neuron roster changed",
      errors,
    );
    check(
      pack.preMergeUniqueMorphologyCount === 10 &&
        pack.activeUniqueMorphologyCount === 12 &&
        pack.preExistingNamedRouteCount === 7 &&
        pack.namedRouteCount === 9 &&
        pack.namedDorsalHornRouteCount === 8 &&
        pack.namedVentralHornRouteCount === 1 &&
        pack.frozenExemplarCount === 5 &&
        pack.frozenCensusRecordCount === 142 &&
        pack.censusExpansionCount === 0,
      "PrP merge arithmetic or frozen denominator changed",
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
        pack.markerExclusivityClaimCount === 0 &&
        pack.endogenousPrpProteinAbundanceClaimCount === 0 &&
        pack.exactCrossSourceIdentityCount === 0 &&
        pack.projectRegistrationCount === 0,
      "PrP pack creates an unsupported complete-axon, DAT, physiology, internal, marker, PrP, identity or registration claim",
      errors,
    );
    check(
      pack.assetManifestReceipt?.fileCount === 10 &&
        pack.assetManifestReceipt?.files?.length === 10 &&
        same(pack.assetManifestReceipt?.files?.map((file) => file.kind), EXPECTED_ASSET_KINDS) &&
        pack.assetManifestReceipt?.files?.every((file) =>
          !/\.(pdf|png|jpe?g|tiff?|svg|webp)$/i.test(file.path),
        ),
      "PrP delta inventory changed or admits paper/image assets",
      errors,
    );
    check(
      pack.routeMemberships?.length === EXPECTED_PRP_ROUTES.length,
      "PrP route-membership denominator changed",
      errors,
    );
    EXPECTED_PRP_ROUTES.forEach((expected, index) => {
      const route = pack.routeMemberships?.[index];
      check(Boolean(route), `missing PrP route index ${index}`, errors);
      if (!route) return;
      check(
        route.routeId === expected.routeId &&
          route.neuronId === expected.neuronId &&
          route.assetId === expected.assetId &&
          same(route.cellTypeLabels, expected.labels) &&
          route.nodeCount === expected.nodeCount &&
          route.segmentCount === expected.segmentCount &&
          route.observedAxonNodeCount === expected.axonNodeCount,
        `${expected.routeId} identity, label or topology denominator changed`,
        errors,
      );
      check(
        route.repositoryStrainRaw === "Swiss-Webster " &&
          route.strainJoinStatus === "context_incomplete_not_individual_genotype_validation" &&
          route.preparationJoinStatus === "context_consistent_not_exact_object_crosswalk" &&
          route.repositoryWeightMinimumGrams === 27 &&
          route.repositoryWeightMaximumGrams === 15 &&
          route.repositoryWeightValidForBiologicalInterpretation === false,
        `${expected.routeId} strain, preparation or invalid-weight boundary changed`,
        errors,
      );
      check(
        route.metadataReceipt?.bytes === expected.metadata.bytes &&
          route.metadataReceipt?.sha256 === expected.metadata.sha256 &&
          route.morphometryReceipt?.bytes === expected.morphometry.bytes &&
          route.morphometryReceipt?.sha256 === expected.morphometry.sha256 &&
          route.geometryReceipt?.bytes === expected.geometry.bytes &&
          route.geometryReceipt?.sha256 === expected.geometry.sha256 &&
          route.geometryReceipt?.canonicalGeometrySha256 === expected.geometry.canonicalGeometrySha256 &&
          route.geometryReceipt?.topologySha256 === expected.geometry.topologySha256 &&
          route.swcReceipt?.bytes === expected.swc.bytes &&
          route.swcReceipt?.sha256 === expected.swc.sha256 &&
          route.originalDatReceipt?.bytes === expected.dat.bytes &&
          route.originalDatReceipt?.sha256 === expected.dat.sha256,
        `${expected.routeId} exact source-object receipt changed`,
        errors,
      );
      check(
        route.censusMembership === false &&
          route.markerExclusivityClaim === false &&
          route.endogenousPrpProteinAbundanceClaim === false &&
          route.completeAxonClaim === false &&
          route.nativeDatParsed === false &&
          route.nativeDatRendered === false &&
          route.nativeDatSemanticObjectCount === 0 &&
          route.paperMentionsExactNeuronIdOrFilename === false &&
          route.sameCellElectrophysiologyJoinStatus === "not_established" &&
          route.individualMolecularAssayClaim === false &&
          route.internalPrimitiveCount === 0 &&
          route.crossSourceIdentityCount === 0 &&
          route.projectRegistrationCount === 0,
        `${expected.routeId} admits an unsupported biological or identity claim`,
        errors,
      );
    });
    await checkPrpAssetFiles(pack, errors);
  }

  const representation = manifest.exactReferences?.evidenceAware3dRepresentation;
  check(
    representation?.contractId === "evidence-aware-3d-representation-contract-0.4" &&
      representation?.deterministicMaterializationReceipt?.bytes === 21341 &&
      representation?.deterministicMaterializationReceipt?.sha256 === "1dec67e67884199a481ce8127793523acf56d0d50df83cfe330e933c8260e392" &&
      representation?.representationStateCount === 9 &&
      same(representation?.representationStateIds, EXPECTED_STATE_IDS) &&
      representation?.routeCount === 15 &&
      same(representation?.routeIds, EXPECTED_REPRESENTATION_ROUTE_IDS),
    "evidence-aware representation 0.4 receipt, state roster or route roster changed",
    errors,
  );
  check(
    representation?.legacyDorsalHornPackRouteCount === 4 &&
      representation?.legacyDorsalHornPackRouteIds?.length === 4 &&
      representation?.functionalClassRouteCount === 2 &&
      representation?.functionalClassRouteIds?.length === 2 &&
      representation?.prpDorsalHornRouteCount === 2 &&
      same(
        representation?.prpDorsalHornRouteIds,
        EXPECTED_PRP_ROUTES.map((route) => route.routeId),
      ) &&
      representation?.namedDorsalHornRouteCount === 8 &&
      representation?.namedVentralHornRouteCount === 1,
    "representation route-subgroup denominators changed",
    errors,
  );
  check(
    same(representation?.internalReferenceStateIds, ["UNAVAILABLE"]) &&
      representation?.internalReferenceRenderedPrimitivePolicy === "zero_primitives" &&
      representation?.proceduralBiologicalProxyAllowed === false &&
      representation?.missingLayerPrimitiveCount === 0 &&
      representation?.nativeDatSemanticAdmissionCount === 0 &&
      representation?.sameCellElectrophysiologyJoinCount === 0 &&
      representation?.sameSpecimenInternalStructureCount === 0 &&
      representation?.renderedInternalPrimitiveCount === 0 &&
      representation?.crossSourceIdentityCount === 0 &&
      representation?.projectRegistrationCount === 0,
    "representation contract admits a proxy, DAT object, physiology join, internal primitive, identity or registration",
    errors,
  );

  const registry = manifest.registrySummary;
  check(
    registry?.canonicalSourcePackageCount === 24 &&
      registry?.canonicalRecordSetCount === 27 &&
      registry?.bundledExactRosterCount === 6 &&
      registry?.researchUpgradeCount === 130,
    "source-package, record-set, exact-roster or upgrade denominator changed",
    errors,
  );
  check(
    same(registry?.sourceRegistryReceipt, inputs.get("researchSourceRegistry")) &&
      same(registry?.upgradeRegistryReceipt, inputs.get("researchModelUpgradeRegistry")),
    "registry summary receipts disagree with authoritative inputs",
    errors,
  );
  check(
    registry?.crossSourceIdentityCount === 0 &&
      registry?.registrationCount === 0 &&
      registry?.renderedInternalPrimitiveCount === 0 &&
      manifest.registrations?.count === 0 &&
      manifest.registrations?.records?.length === 0,
    "2.27 creates an identity, registration or internal primitive",
    errors,
  );

  const prpBoundary = manifest.scientificBoundaries?.prpDorsalHornObservedMorphologyRoutePack ?? "";
  check(
    /NMO 50394/.test(prpBoundary) &&
      /NMO 50408/.test(prpBoundary) &&
      /neither positive label establishes the other marker's absence/.test(prpBoundary) &&
      /not endogenous PrP protein abundance/.test(prpBoundary) &&
      /300-micrometre/.test(prpBoundary) &&
      /60-micrometre/.test(prpBoundary) &&
      /DAT semantics/.test(prpBoundary) &&
      /same-cell physiology/.test(prpBoundary) &&
      /complete axons/.test(prpBoundary) &&
      /internal structures/.test(prpBoundary) &&
      /registrations remain zero/.test(prpBoundary),
    "PrP scientific boundary omits a marker, preparation, DAT, physiology, axon, internal or registration limit",
    errors,
  );

  if (errors.length) {
    throw new Error(
      `Research iteration 2.27 manifest validation failed:\n- ${errors.join("\n- ")}`,
    );
  }

  return {
    releaseId: manifest.releaseId,
    inputCount: manifest.integrity.inputCount,
    frozenExemplarCount: pack.frozenExemplarCount,
    censusRecordCount: pack.frozenCensusRecordCount,
    prpRouteCount: pack.routeCount,
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

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest227()
    .then((summary) =>
      process.stdout.write(
        `Research iteration 2.27 manifest valid: ${summary.inputCount} exact inputs, ${summary.sourcePackageCount} source packages, ${summary.recordSetCount} record sets, ${summary.bundledExactRosterCount} bundled exact rosters, ${summary.researchUpgradeCount} upgrades, ${summary.prpRouteCount} PrP routes, ${summary.activeUniqueMorphologyCount} active unique morphologies, ${summary.namedRouteCount} named routes, ${summary.representationRouteCount} representation routes, ${summary.nativeDatSemanticAdmissionCount} DAT semantic admissions, ${summary.renderedInternalPrimitiveCount} internal primitives and ${summary.registrationCount} registrations.\n`,
      ),
    )
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
