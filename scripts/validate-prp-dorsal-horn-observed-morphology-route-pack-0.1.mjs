#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  nativeContourAdmissionRecord,
  validateNativeContourAdmissionCatalog,
  validateNativeContourGeometry,
} from "../app/neurolucida-native-contour-admission.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/prp-dorsal-horn-observed-morphology-route-pack-0.1.schema.json");
const ASSET_ROOT = path.join(PROJECT_ROOT, "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1");
const MANIFEST_PATH = path.join(ASSET_ROOT, "asset-manifest.json");
const NATIVE_CATALOG_PATH = path.join(PROJECT_ROOT, "data/neurolucida-native-contour-admission-catalog-0.3.json");
const NATIVE_EXTENSION_PATHS = new Map([
  [50394, "native-contours/nmo-50394-mbf-cell-body-line-loops.json"],
  [50408, "native-contours/nmo-50408-mbf-cell-body-line-loops.json"],
]);
const CENSUS_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");

const EXPECTED = new Map([
  [50394, {
    routeId: "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
    name: "C11-15-08-12-B",
    labels: ["Neuronal Nitric Oxide Synthase (nNOS)-positive", "prion protein (PrP) promoter-positive", "interneuron"],
    excludedMarker: "galanin",
    nodes: 4012,
    segments: 4011,
    types: { "1": 3, "2": 1520, "3": 2489 },
    extent: [101.63999999999999, 357.90999999999997, 92.99000000000001],
    repositoryMorphometry: [80.2899, 313.59, 65.97, 3255.75],
    api: [1542, "d5954d795e3a2308ae3bb7077d546766641b2e169c4be73f2bfdaa0c663081d1"],
    morphometry: [469, "b2e1da4a3ae35e854969a16357c014851745b2c67020b372615a03de77ef9162"],
    swc: [151317, "adeb2b0c6934ae07f32d54e8fcaebc8cee29429d884e44692756ee15da8a00d2"],
    dat: [191975, "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109"],
    geometry: [429479, "cbc08ede052636e2f30249d1a633a5f1b88531d375f80f23751b062c48eeda47"],
    canonical: "8f50c34eedb33adc44402f60c5bd18e4e19f3b6dd65ea5890ce3cb93240734df",
    topology: "102a85df24185bd34eeb4fabbd4abdf4924ef82e8d82140bc386651569843f87",
  }],
  [50408, {
    routeId: "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
    name: "C113-08-05-13-C",
    labels: ["galanin-expressing", "prion protein (PrP) promoter-positive", "interneuron"],
    excludedMarker: "nNOS",
    nodes: 6125,
    segments: 6124,
    types: { "1": 4, "2": 3244, "3": 2877 },
    extent: [107.34, 234.67, 60.489999999999995],
    repositoryMorphometry: [88.1899, 212.33, 56.48, 4886.98],
    api: [1515, "6d6be05370c9054aa0956ad3cdfb0ec94acfad560216b57da5d67fe5d32f2444"],
    morphometry: [470, "9c849e5a828b99f37e215dc1b09856617a70b2ef1c0505ff3b81a151d028606d"],
    swc: [222351, "452c2b3d76d9680318470ba16b5c271a403018a1c6dcedaa94b68f1fdec6c470"],
    dat: [300076, "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2"],
    geometry: [638051, "c545292d72010af04760fb0851fa479260c20865b4e678f596bbabf7f13f0123"],
    canonical: "c0c5d068c03437f2106892e8994f6b631243036af17e1bdf6bd0362c3c286271",
    topology: "e14539c8e605dfa0fa492fa2176e0ba502e40ba369be689c691ba8de27f256cc",
  }],
]);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function receiptPath(receipt) {
  const prefix = "/data/prp_dorsal_horn_observed_morphology_route_pack_v1/";
  if (!receipt.path.startsWith(prefix)) throw new Error(`Unsupported receipt path ${receipt.path}`);
  return path.join(ASSET_ROOT, receipt.path.slice(prefix.length));
}

async function verifyReceipt(receipt, expectedReceipt, label, errors) {
  const bytes = await readFile(receiptPath(receipt));
  check(receipt.bytes === expectedReceipt[0] && bytes.byteLength === expectedReceipt[0], `${label} byte count drifted`, errors);
  check(receipt.sha256 === expectedReceipt[1] && digest(bytes) === expectedReceipt[1], `${label} SHA-256 drifted`, errors);
  return bytes;
}

function countKinds(files) {
  return Object.fromEntries(
    [...files.reduce((counts, file) => counts.set(file.kind, (counts.get(file.kind) ?? 0) + 1), new Map())]
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

async function listAssetFiles(directory = ASSET_ROOT, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listAssetFiles(path.join(directory, entry.name), relative));
    else files.push(relative);
  }
  return files.sort();
}

/**
 * Later native 0.3 derivatives have their own authority and checksums. They do
 * not amend the frozen PrP manifest or retroactively grant it DAT semantics.
 */
export async function validatePrpAssetInventory({ manifest, catalog, assetFiles, readAsset }) {
  const validatedCatalog = validateNativeContourAdmissionCatalog(catalog);
  if (validatedCatalog.schemaVersion !== "0.3.0") throw new Error("PrP native extensions require the exact native 0.3 catalog");
  const expectedInventory = ["asset-manifest.json", ...manifest.files.map((file) => file.path), ...NATIVE_EXTENSION_PATHS.values()].sort();
  if (JSON.stringify([...assetFiles].sort()) !== JSON.stringify(expectedInventory)) {
    throw new Error("asset directory contains an unmanifested or missing file (only the two catalog-pinned native extensions are allowed; paper PDF/figure assets are forbidden)");
  }
  for (const [neuronId, relativePath] of NATIVE_EXTENSION_PATHS) {
    const admission = nativeContourAdmissionRecord(validatedCatalog, neuronId);
    const receipt = admission?.derivedObject;
    const expectedPath = `/data/prp_dorsal_horn_observed_morphology_route_pack_v1/${relativePath}`;
    if (receipt?.path !== expectedPath) throw new Error(`NMO ${neuronId} native extension catalog path drifted`);
    const bytes = await readAsset(relativePath);
    if (bytes.byteLength !== receipt.bytes || digest(bytes) !== receipt.sha256) {
      throw new Error(`NMO ${neuronId} native extension byte count or SHA-256 drifted`);
    }
    validateNativeContourGeometry(JSON.parse(bytes.toString("utf8")), admission);
  }
}

export async function validatePrpDorsalHornObservedMorphologyRoutePack(contractOverride = null) {
  const [contract, schema, manifest, census, assetFiles, nativeCatalog] = await Promise.all([
    contractOverride ?? readFile(CONTRACT_PATH, "utf8").then(JSON.parse),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(MANIFEST_PATH, "utf8").then(JSON.parse),
    readFile(CENSUS_PATH, "utf8").then(JSON.parse),
    listAssetFiles(),
    readFile(NATIVE_CATALOG_PATH, "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`PrP dorsal-horn route-pack schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  const expectedNeuronIds = [50394, 50408];
  const expectedRouteIds = expectedNeuronIds.map((id) => EXPECTED.get(id).routeId);
  check(JSON.stringify(contract.routes.map((route) => route.sourceRecord.neuronId)) === JSON.stringify(expectedNeuronIds), "route neuron IDs or order drifted", errors);
  check(JSON.stringify(contract.routes.map((route) => route.routeId)) === JSON.stringify(expectedRouteIds), "exact route IDs or order drifted", errors);
  check(new Set(contract.routes.map((route) => route.routeId)).size === 2, "route IDs are not unique", errors);

  check(census.summary.queryRecordCount === 142 && census.records.length === 142, "frozen census denominator drifted", errors);
  const censusIds = new Set(census.records.map((record) => record.neuronId));
  check(expectedNeuronIds.every((id) => !censusIds.has(id)), "supplementary PrP routes entered the frozen census", errors);

  check(manifest.summary.fileCount === 10 && manifest.files.length === 10, "asset-manifest count drifted", errors);
  check(manifest.summary.supplementaryNeuronCount === 2, "asset-manifest supplementary denominator drifted", errors);
  check(manifest.summary.nativeDatSemanticAdmissionCount === 0 && manifest.summary.registrationCount === 0, "asset manifest admitted DAT semantics or registration", errors);
  check(JSON.stringify(countKinds(manifest.files)) === JSON.stringify({
    lazy_geometry: 2,
    official_api_snapshot: 2,
    official_morphometry_snapshot: 2,
    source_native_dat_receipt_only: 2,
    standardized_swc: 2,
  }), "asset-manifest kind counts drifted", errors);
  await validatePrpAssetInventory({
    manifest, catalog: nativeCatalog, assetFiles,
    readAsset: (relativePath) => readFile(path.join(ASSET_ROOT, relativePath)),
  });
  check(manifest.files.every((file) => !/\.(?:pdf|png|jpe?g|tiff?|svg)$/i.test(file.path)), "paper PDF or figure asset entered the route pack", errors);

  for (const route of contract.routes) {
    const neuronId = route.sourceRecord.neuronId;
    const expected = EXPECTED.get(neuronId);
    check(Boolean(expected), `unexpected NMO ${neuronId}`, errors);
    if (!expected) continue;
    check(route.routeId === expected.routeId, `NMO ${neuronId} route ID drifted`, errors);
    check(route.censusMembership === false && route.sourceAuthority === "PINNED_NEUROMORPHO_RELEASE_8_6_124_SOURCE_OBJECT", `NMO ${neuronId} source authority drifted`, errors);
    check(route.sourceRecord.neuronName === expected.name && route.sourceRecord.archive === "Todd", `NMO ${neuronId} source identity drifted`, errors);
    check(route.sourceRecord.sourcePaperDoi === "10.1523/JNEUROSCI.0406-15.2015" && route.sourceRecord.sourcePaperPmid === "25972186", `NMO ${neuronId} paper link drifted`, errors);
    check(JSON.stringify(route.sourceRecord.cellTypeLabels) === JSON.stringify(expected.labels), `NMO ${neuronId} exact marker labels drifted or acquired an exclusivity claim`, errors);
    check(!route.sourceRecord.cellTypeLabels.some((label) => /negative/i.test(label)), `NMO ${neuronId} gained an unsupported marker-negative label`, errors);
    check(route.sourceRecord.repositoryStrainRaw === "Swiss-Webster ", `NMO ${neuronId} raw repository strain or trailing space was normalized away`, errors);
    check(route.sourceRecord.strainJoinStatus === "context_incomplete_not_individual_genotype_validation", `NMO ${neuronId} gained an individual background/genotype validation`, errors);
    check(route.sourceRecord.sex === "Male/Female", `NMO ${neuronId} cohort-valued sex was promoted to individual sex`, errors);
    check(route.sourceRecord.repositoryWeightGrams.minimum === 27 && route.sourceRecord.repositoryWeightGrams.maximum === 15 && route.sourceRecord.repositoryWeightGrams.validForBiologicalInterpretation === false && route.sourceRecord.repositoryWeightGrams.missingOrInvalidReason === "inverted_repository_bounds", `NMO ${neuronId} inverted 27-to-15 gram bounds are not explicit`, errors);
    check(route.sourceRecord.repositorySlicingDirection === "parasagittal" && route.sourceRecord.repositorySlicingThicknessMicrometre === 300, `NMO ${neuronId} repository preparation drifted`, errors);
    check(route.sourceRecord.preparationJoinStatus === "context_consistent_not_exact_object_crosswalk", `NMO ${neuronId} preparation gained an exact object crosswalk`, errors);
    check(/300 micrometre parasagittal/i.test(route.sourceRecord.paperPreparationContext) && /60 micrometre serial resection/i.test(route.sourceRecord.paperPreparationContext), `NMO ${neuronId} preparation stages are incomplete`, errors);
    check(route.sourceRecord.domain === "Dendrites, Soma, Axon" && route.sourceRecord.physicalIntegrity === "Dendrites & Axon Moderate", `NMO ${neuronId} moderate-integrity boundary drifted`, errors);
    check(route.sourceRecord.sourceAttributes === "Diameter, 3D, Angles", `NMO ${neuronId} diameter authority drifted`, errors);

    check(route.geometryReceipt.nodeCount === expected.nodes && route.geometryReceipt.segmentCount === expected.segments, `NMO ${neuronId} geometry counts drifted`, errors);
    check(JSON.stringify(route.geometryReceipt.nodeTypeCounts) === JSON.stringify(expected.types), `NMO ${neuronId} node-type counts drifted`, errors);
    check(JSON.stringify(route.geometryReceipt.extentMicrometre) === JSON.stringify(expected.extent), `NMO ${neuronId} SWC extent drifted`, errors);
    check(JSON.stringify([
      route.geometryReceipt.repositoryMorphometry.widthMicrometre,
      route.geometryReceipt.repositoryMorphometry.heightMicrometre,
      route.geometryReceipt.repositoryMorphometry.depthMicrometre,
      route.geometryReceipt.repositoryMorphometry.lengthMicrometre,
    ]) === JSON.stringify(expected.repositoryMorphometry), `NMO ${neuronId} official morphometry drifted`, errors);
    check(route.geometryReceipt.repositoryMorphometry.extentDefinition === "95_percent_principal_component_extents" && route.geometryReceipt.repositoryMorphometry.equivalentToSwcBounds === false, `NMO ${neuronId} PCA morphometry was conflated with SWC bounds`, errors);
    check(route.geometryReceipt.repositoryMorphometry.atlasRegistrationClaim === false && route.geometryReceipt.registrationStatus === "unregistered", `NMO ${neuronId} gained an atlas registration`, errors);
    check(route.geometryReceipt.canonicalGeometrySha256 === expected.canonical && route.geometryReceipt.topologySha256 === expected.topology, `NMO ${neuronId} canonical geometry or topology drifted`, errors);
    check(route.somaStandardizationReceipt.standardizedSomaPointCount === expected.types["1"] && route.somaStandardizationReceipt.originalContourCount === null, `NMO ${neuronId} soma standardization receipt drifted`, errors);
    check(route.somaStandardizationReceipt.nativeContourVerticesAdmitted === false && route.somaStandardizationReceipt.membraneClaim === false, `NMO ${neuronId} standardized soma points became a membrane`, errors);
    check(route.fidelityRecord.axon.sourceType2NodeCount === expected.types["2"] && route.fidelityRecord.axon.completeAxon === false, `NMO ${neuronId} gained a complete axon claim`, errors);
    check(route.renderingContract.observedSwc.available === true && route.renderingContract.observedSwc.authority === "OBS_STANDARDIZED_SOURCE_LOCAL", `NMO ${neuronId} observed SWC state drifted`, errors);
    check(route.renderingContract.radiusSurface.available === true && route.renderingContract.radiusSurface.authority === "DERIVED_FROM_OBSERVED_RADIUS" && route.renderingContract.radiusSurface.membraneClaim === false, `NMO ${neuronId} radius derivative authority drifted`, errors);
    check(route.renderingContract.sameSpecimenInternalStructure.available === false && route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, `NMO ${neuronId} gained unsupported internals`, errors);
    check(route.nativeDatContract.bundled === true && route.nativeDatContract.parsed === false && route.nativeDatContract.rendered === false, `NMO ${neuronId} DAT semantics were silently admitted`, errors);
    check(route.nativeDatContract.semanticObjectCountAdmitted === 0 && route.nativeDatContract.renderedPrimitiveCount === 0, `NMO ${neuronId} DAT created semantic objects or primitives`, errors);
    check(route.identityBoundary.individualMolecularAssayClaim === false && route.identityBoundary.sameCellElectrophysiologyJoinStatus === "not_established" && route.identityBoundary.paperMentionsExactNeuronIdOrFilename === false, `NMO ${neuronId} gained a molecular-assay or exact physiology/object join`, errors);
    check(route.identityBoundary.selectedSciEntityRelationship === "none" && route.identityBoundary.molecularProfileRelationship === "none" && route.identityBoundary.otherMorphologyRelationship === "independent_record", `NMO ${neuronId} gained an unsupported identity relationship`, errors);
    check(route.identityBoundary.crossSourceIdentityCount === 0 && route.identityBoundary.projectRegistrationCount === 0 && route.identityBoundary.coDisplayCreatesRelationship === false, `NMO ${neuronId} gained a cross-source identity, relationship, or registration`, errors);

    const [apiBytes, morphometryBytes, geometryBytes, swcBytes, datBytes] = await Promise.all([
      verifyReceipt(route.sourceObjects.metadata, expected.api, `NMO ${neuronId} API`, errors),
      verifyReceipt(route.sourceObjects.morphometry, expected.morphometry, `NMO ${neuronId} morphometry`, errors),
      verifyReceipt(route.sourceObjects.geometry, expected.geometry, `NMO ${neuronId} geometry`, errors),
      verifyReceipt(route.sourceObjects.swc, expected.swc, `NMO ${neuronId} SWC`, errors),
      verifyReceipt(route.sourceObjects.originalDat, expected.dat, `NMO ${neuronId} DAT`, errors),
    ]);
    const api = JSON.parse(apiBytes.toString("utf8"));
    const morphometry = JSON.parse(morphometryBytes.toString("utf8"));
    const geometry = JSON.parse(geometryBytes.toString("utf8"));
    check(api.neuron_id === neuronId && api.neuron_name === expected.name && api.strain === "Swiss-Webster ", `NMO ${neuronId} pinned API identity/strain drifted`, errors);
    check(api.min_weight === "27.0" && api.max_weight === "15.0" && JSON.stringify(api.cell_type) === JSON.stringify(expected.labels), `NMO ${neuronId} pinned API weight/marker evidence drifted`, errors);
    check(api.physical_Integrity === "Dendrites & Axon Moderate" && api.domain === "Dendrites, Soma, Axon" && api.attributes === "Diameter, 3D, Angles", `NMO ${neuronId} pinned API morphology authority drifted`, errors);
    check(morphometry.neuron_id === neuronId && morphometry.neuron_name === expected.name, `NMO ${neuronId} pinned morphometry identity drifted`, errors);
    check(JSON.stringify([morphometry.width, morphometry.height, morphometry.depth, morphometry.length]) === JSON.stringify(expected.repositoryMorphometry), `NMO ${neuronId} pinned morphometry values drifted`, errors);
    check(geometry.neuronId === neuronId && geometry.nodes.length === expected.nodes && geometry.segments.length === expected.segments, `NMO ${neuronId} geometry payload drifted`, errors);
    check(geometry.swc.sha256 === expected.swc[1] && geometry.swc.sourceDiameterAvailable === true, `NMO ${neuronId} geometry SWC authority drifted`, errors);
    check(geometry.swc.originalMorphologyFile.value.sha256 === expected.dat[1] && geometry.swc.originalMorphologyFile.value.semanticAdmission === "not_parsed_not_rendered", `NMO ${neuronId} geometry DAT boundary drifted`, errors);
    check(geometry.nativeAnnotationPolicy.semanticObjectsAdmitted === 0 && geometry.nativeAnnotationPolicy.renderedPrimitiveCount === 0, `NMO ${neuronId} geometry admitted native annotations`, errors);
    check(datBytes.indexOf(Buffer.from("V3 DAT file", "ascii")) >= 0, `NMO ${neuronId} source-native DAT signature is missing`, errors);
    check(swcBytes.toString("utf8").includes("StdSwc"), `NMO ${neuronId} standardization header is missing`, errors);

    const boundaries = route.hardBoundaries.join(" ");
    check(/300 micrometre parasagittal.*60 micrometre serial resectioning.*separate recovery stage/i.test(boundaries), `NMO ${neuronId} 300-versus-60 micrometre preparation-stage separation is missing`, errors);
    check(new RegExp(`${expected.excludedMarker} negativity.*cannot be assigned`, "i").test(boundaries), `NMO ${neuronId} marker non-exclusivity boundary is missing`, errors);
    check(/does not expose NeuroMorpho ID/i.test(boundaries), `NMO ${neuronId} paper-to-object non-join boundary is missing`, errors);
    check(/zero internal primitives/i.test(boundaries), `NMO ${neuronId} zero-internal boundary is missing`, errors);
  }

  const packBoundaries = contract.packBoundaries.join(" ");
  check(/PrP-promoter-positive.*not a claim of endogenous PrP protein abundance/i.test(packBoundaries), "PrP-promoter wording was promoted to endogenous protein abundance", errors);
  check(/nNOS-positive does not establish galanin-negative.*galanin-positive does not establish nNOS-negative/i.test(packBoundaries), "pack-level marker non-exclusivity boundary is missing", errors);
  check(/300 micrometre parasagittal.*60 micrometre serial resectioning.*distinct recovery stage/i.test(packBoundaries), "pack-level preparation-stage separation is missing", errors);
  check(/no paper text, figure, PDF, or microscopy panel is bundled/i.test(packBoundaries), "paper PDF/figure exclusion boundary is missing", errors);
  check(/95-percent principal-component extents/i.test(packBoundaries), "PCA morphometry boundary is missing", errors);

  check(contract.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount === 10 && contract.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount === 12, "runtime unique-main-scene arithmetic drifted", errors);
  check(contract.runtimeMergePolicy.preExistingNamedRouteCount === 7 && contract.runtimeMergePolicy.postMergeNamedRouteCount === 9, "named-route arithmetic drifted", errors);
  check(contract.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount === 8 && contract.runtimeMergePolicy.postMergeNamedVentralHornRouteCount === 1, "dorsal/ventral route arithmetic drifted", errors);
  check(JSON.stringify(contract.runtimeMergePolicy.supplementaryNeuronIds) === JSON.stringify(expectedNeuronIds) && contract.runtimeMergePolicy.overlappingActiveNeuronIds.length === 0, "supplementary/overlap set drifted", errors);
  check(contract.runtimeMergePolicy.frozenCensusRecordCount === 142 && contract.runtimeMergePolicy.censusExpansionCount === 0, "route pack changed the frozen census", errors);
  check(contract.summary.sourceCompleteAxonCount === 0 && contract.summary.nativeDatSemanticAdmissionCount === 0 && contract.summary.sameCellElectrophysiologyJoinCount === 0, "route pack gained complete axons, DAT semantics, or physiology joins", errors);
  check(contract.summary.sameSpecimenInternalStructureCount === 0 && contract.summary.renderedInternalPrimitiveCount === 0, "route pack gained same-specimen internals", errors);
  check(contract.summary.exactCrossSourceIdentityCount === 0 && contract.summary.projectRegistrationCount === 0, "route pack gained exact identity joins or registration", errors);

  if (errors.length) throw new Error(`PrP dorsal-horn observed-morphology route-pack validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    routeCount: contract.summary.routeCount,
    uniqueMainSceneNeuronCount: contract.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount,
    namedRouteCount: contract.runtimeMergePolicy.postMergeNamedRouteCount,
    censusRecordCount: contract.runtimeMergePolicy.frozenCensusRecordCount,
    censusExpansionCount: contract.runtimeMergePolicy.censusExpansionCount,
    sourceDiameterAvailableCount: contract.summary.sourceDiameterAvailableCount,
    observedAxonRouteCount: contract.summary.observedAxonRouteCount,
    sourceCompleteAxonCount: contract.summary.sourceCompleteAxonCount,
    nativeDatSemanticAdmissionCount: contract.summary.nativeDatSemanticAdmissionCount,
    sameCellElectrophysiologyJoinCount: contract.summary.sameCellElectrophysiologyJoinCount,
    internalPrimitiveCount: contract.summary.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: contract.summary.exactCrossSourceIdentityCount,
    projectRegistrationCount: contract.summary.projectRegistrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validatePrpDorsalHornObservedMorphologyRoutePack()
    .then((report) => process.stdout.write(`PrP dorsal-horn route pack valid: ${report.routeCount} routes, ${report.uniqueMainSceneNeuronCount} unique main-scene records, ${report.nativeDatSemanticAdmissionCount} admitted DAT semantics, ${report.sameCellElectrophysiologyJoinCount} exact physiology joins, ${report.internalPrimitiveCount} internal primitives, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
