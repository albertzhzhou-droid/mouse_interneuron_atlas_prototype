#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/functional-class-observed-morphology-route-pack-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/functional-class-observed-morphology-route-pack-0.1.schema.json");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "public/data/functional_class_observed_morphology_route_pack_v1/asset-manifest.json");
const CENSUS_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");

const EXPECTED = new Map([
  [45674, {
    routeId: "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674",
    name: "101029p2-A-In",
    archive: "Bannatyne",
    doi: "10.1523/JNEUROSCI.0199-14.2014",
    pmid: "25232126",
    nodes: 6973,
    segments: 6972,
    types: { "1": 8, "2": 6247, "3": 718 },
    extent: [334.47, 422.25, 230],
    repositoryDimensions: [297.817, 363.353, 206],
    direction: "horizontal",
    slice: 50,
    api: [1528, "198e02202a92dd9e449afeb28fa61d2588e9cc1de242b127017091d075c8e1e3"],
    morphometry: [472, "c05be11c388849f5d5190b9062e5765e2a5a2c3f441964b0d3b0520a898ab707"],
    swc: [294364, "95b2fc29900a994ef87d6f50c07481115f94207c5ebaeb9f436e7e494edac1fd"],
    dat: [353251, "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87"],
    geometry: [844047, "242f30ebc0195f4aa092532acf8534c308371ddffc09103d484578a9f941a6d5"],
    canonical: "39c4d12f3cfcc0f5c3664e66c20136744814974d0baeebe998a047661a7c4f13",
    topology: "34c5800e9250efa625e9b03c5be2fe102cfc64e064aa1f88f8c24a4c2e98b287",
  }],
  [50424, {
    routeId: "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424",
    name: "C135-18-06-13-Ab",
    archive: "Todd",
    doi: "10.1097/j.pain.0000000000000407",
    pmid: "26882346",
    nodes: 9805,
    segments: 9804,
    types: { "1": 3, "2": 8718, "3": 1084 },
    extent: [181.11, 699.34, 51.49],
    repositoryDimensions: [140.827, 606.848, 46.5],
    direction: "parasagittal",
    slice: 300,
    api: [1490, "366903a183c6dcc6279314af3674a3057034d5f18275df11dca31d0117c70997"],
    morphometry: [474, "4d69cb3ef59f104a399ad45b225211211d1ae2e7edcbc605f2aa7c51c0911e32"],
    swc: [381795, "0cdb5c32555f94d2ffd1765d8c21f1f95703692c45917f2a2d2449ecc457138b"],
    dat: [480757, "90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9"],
    geometry: [1058012, "5f431d13fc9f857f9e179fb1061b4ae0bc1cc7504467c246ba7dd69d3cbb740f"],
    canonical: "6e53724b3f7318aae6fd708a5701eb7e3f65cace2fc9dc3ce48bdb027c828776",
    topology: "feb4adcae454ab852123f9b507ad273196aa97a8f53b593cd2986080f977ec77",
  }],
]);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function receiptPath(receipt) {
  if (!receipt.path.startsWith("/data/")) throw new Error(`Unsupported receipt path ${receipt.path}`);
  return path.join(PROJECT_ROOT, "public/data", receipt.path.slice("/data/".length));
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

export async function validateFunctionalClassObservedMorphologyRoutePack(contractOverride = null) {
  const [contract, schema, manifest, census] = await Promise.all([
    contractOverride ?? readFile(CONTRACT_PATH, "utf8").then(JSON.parse),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(MANIFEST_PATH, "utf8").then(JSON.parse),
    readFile(CENSUS_PATH, "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Functional-class route-pack schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  check(JSON.stringify(contract.routes.map((route) => route.sourceRecord.neuronId)) === JSON.stringify([45674, 50424]), "route neuron IDs or order drifted", errors);
  check(new Set(contract.routes.map((route) => route.routeId)).size === 2, "route IDs are not unique", errors);
  check(census.summary.queryRecordCount === 142 && census.records.length === 142, "frozen census denominator drifted", errors);
  const censusIds = new Set(census.records.map((record) => record.neuronId));
  check(!censusIds.has(45674) && !censusIds.has(50424), "supplementary routes entered the frozen census", errors);

  check(manifest.summary.fileCount === 10 && manifest.files.length === 10, "asset-manifest count drifted", errors);
  check(manifest.summary.nativeDatSemanticAdmissionCount === 0 && manifest.summary.registrationCount === 0, "asset manifest admitted DAT semantics or registration", errors);
  check(JSON.stringify(countKinds(manifest.files)) === JSON.stringify({
    lazy_geometry: 2,
    official_api_snapshot: 2,
    official_morphometry_snapshot: 2,
    source_native_dat_receipt_only: 2,
    standardized_swc: 2,
  }), "asset-manifest kind counts drifted", errors);

  for (const route of contract.routes) {
    const neuronId = route.sourceRecord.neuronId;
    const expected = EXPECTED.get(neuronId);
    check(Boolean(expected), `unexpected NMO ${neuronId}`, errors);
    if (!expected) continue;
    check(route.routeId === expected.routeId, `NMO ${neuronId} route ID drifted`, errors);
    check(route.censusMembership === false && route.sourceAuthority === "PINNED_NEUROMORPHO_RELEASE_8_6_124_SOURCE_OBJECT", `NMO ${neuronId} source authority drifted`, errors);
    check(route.sourceRecord.neuronName === expected.name && route.sourceRecord.archive === expected.archive, `NMO ${neuronId} source identity drifted`, errors);
    check(route.sourceRecord.sourcePaperDoi === expected.doi && route.sourceRecord.sourcePaperPmid === expected.pmid, `NMO ${neuronId} paper link drifted`, errors);
    check(route.sourceRecord.repositorySlicingDirection === expected.direction && route.sourceRecord.repositorySlicingThicknessMicrometre === expected.slice, `NMO ${neuronId} repository preparation drifted`, errors);
    check(route.sourceRecord.domain === "Dendrites, Soma, Axon" && route.sourceRecord.physicalIntegrity === "Dendrites & Axon Moderate", `NMO ${neuronId} integrity boundary drifted`, errors);
    check(route.sourceRecord.sourceAttributes === "Diameter, 3D, Angles", `NMO ${neuronId} diameter authority drifted`, errors);
    check(route.geometryReceipt.nodeCount === expected.nodes && route.geometryReceipt.segmentCount === expected.segments, `NMO ${neuronId} geometry counts drifted`, errors);
    check(JSON.stringify(route.geometryReceipt.nodeTypeCounts) === JSON.stringify(expected.types), `NMO ${neuronId} node-type counts drifted`, errors);
    check(JSON.stringify(route.geometryReceipt.extentMicrometre) === JSON.stringify(expected.extent), `NMO ${neuronId} SWC extent drifted`, errors);
    check(JSON.stringify([
      route.geometryReceipt.repositoryMorphometry.widthMicrometre,
      route.geometryReceipt.repositoryMorphometry.heightMicrometre,
      route.geometryReceipt.repositoryMorphometry.depthMicrometre,
    ]) === JSON.stringify(expected.repositoryDimensions), `NMO ${neuronId} official morphometry dimensions drifted`, errors);
    check(route.geometryReceipt.repositoryMorphometry.extentDefinition === "95_percent_principal_component_extents" && route.geometryReceipt.repositoryMorphometry.equivalentToSwcBounds === false, `NMO ${neuronId} PCA morphometry was conflated with SWC bounds`, errors);
    check(route.geometryReceipt.repositoryMorphometry.atlasRegistrationClaim === false && route.geometryReceipt.registrationStatus === "unregistered", `NMO ${neuronId} gained an atlas registration`, errors);
    check(route.geometryReceipt.canonicalGeometrySha256 === expected.canonical && route.geometryReceipt.topologySha256 === expected.topology, `NMO ${neuronId} canonical geometry or topology drifted`, errors);
    check(route.somaStandardizationReceipt.standardizedSomaPointCount === expected.types["1"] && route.somaStandardizationReceipt.originalContourCount === null, `NMO ${neuronId} soma standardization receipt drifted`, errors);
    check(route.somaStandardizationReceipt.nativeContourVerticesAdmitted === false && route.somaStandardizationReceipt.membraneClaim === false, `NMO ${neuronId} standardized soma points became a membrane`, errors);
    check(route.renderingContract.observedSwc.available === true && route.renderingContract.observedSwc.authority === "OBS_STANDARDIZED_SOURCE_LOCAL", `NMO ${neuronId} observed SWC state drifted`, errors);
    check(route.renderingContract.radiusSurface.available === true && route.renderingContract.radiusSurface.authority === "DERIVED_FROM_OBSERVED_RADIUS" && route.renderingContract.radiusSurface.membraneClaim === false, `NMO ${neuronId} radius derivative authority drifted`, errors);
    check(route.renderingContract.sameSpecimenInternalStructure.available === false && route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, `NMO ${neuronId} gained unsupported internals`, errors);
    check(route.nativeDatContract.bundled === true && route.nativeDatContract.parsed === false && route.nativeDatContract.rendered === false, `NMO ${neuronId} DAT semantics were silently admitted`, errors);
    check(route.nativeDatContract.semanticObjectCountAdmitted === 0 && route.nativeDatContract.renderedPrimitiveCount === 0, `NMO ${neuronId} DAT created semantic objects or primitives`, errors);
    check(route.identityBoundary.sameCellElectrophysiologyJoinStatus === "not_established" && route.identityBoundary.paperMentionsExactNeuronIdOrFilename === false, `NMO ${neuronId} gained an exact electrophysiology join`, errors);
    check(route.identityBoundary.crossSourceIdentityCount === 0 && route.identityBoundary.projectRegistrationCount === 0, `NMO ${neuronId} gained a cross-source identity or registration`, errors);

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
    check(api.neuron_id === neuronId && api.neuron_name === expected.name && api.physical_Integrity === "Dendrites & Axon Moderate", `NMO ${neuronId} pinned API content drifted`, errors);
    check(morphometry.neuron_id === neuronId && morphometry.neuron_name === expected.name, `NMO ${neuronId} pinned morphometry content drifted`, errors);
    check(geometry.neuronId === neuronId && geometry.nodes.length === expected.nodes && geometry.segments.length === expected.segments, `NMO ${neuronId} geometry payload drifted`, errors);
    check(geometry.swc.sha256 === expected.swc[1] && geometry.swc.sourceDiameterAvailable === true, `NMO ${neuronId} geometry SWC authority drifted`, errors);
    check(geometry.swc.originalMorphologyFile.value.sha256 === expected.dat[1] && geometry.swc.originalMorphologyFile.value.semanticAdmission === "not_parsed_not_rendered", `NMO ${neuronId} geometry DAT boundary drifted`, errors);
    check(geometry.nativeAnnotationPolicy.semanticObjectsAdmitted === 0 && geometry.nativeAnnotationPolicy.renderedPrimitiveCount === 0, `NMO ${neuronId} geometry admitted native annotations`, errors);
    check(datBytes.indexOf(Buffer.from("V3 DAT file", "ascii")) >= 0, `NMO ${neuronId} source-native DAT signature is missing`, errors);
    check(swcBytes.toString("utf8").includes("StdSwc"), `NMO ${neuronId} standardization header is missing`, errors);
    check(route.hardBoundaries.some((boundary) => /zero internal primitives/i.test(boundary)), `NMO ${neuronId} zero-internal boundary is missing`, errors);
    check(route.hardBoundaries.some((boundary) => /does not expose NeuroMorpho ID/i.test(boundary)), `NMO ${neuronId} paper-to-object non-join boundary is missing`, errors);
  }

  const renshaw = contract.routes.find((route) => route.sourceRecord.neuronId === 45674);
  check(/400 micrometre transverse.*50 micrometre serial/i.test(renshaw.hardBoundaries.join(" ")), "NMO 45674 repository-versus-paper preparation ambiguity is missing", errors);
  check(renshaw.sourceRecord.repositoryWeightGrams.missingOrInvalidReason === "not_reported", "NMO 45674 missing weight was silently imputed", errors);
  const npy = contract.routes.find((route) => route.sourceRecord.neuronId === 50424);
  check(npy.sourceRecord.repositoryStrainRaw === "Swiss-Webster " && npy.sourceRecord.strainJoinStatus === "conflict_unresolved", "NMO 50424 exact repository strain conflict was normalized away", errors);
  check(npy.sourceRecord.repositoryWeightGrams.minimum === 27 && npy.sourceRecord.repositoryWeightGrams.maximum === 15 && npy.sourceRecord.repositoryWeightGrams.missingOrInvalidReason === "inverted_repository_bounds", "NMO 50424 inverted weight bounds are not explicit", errors);
  check(/NPY-hrGFP\/C57BL\/6.*inverted/i.test(npy.hardBoundaries.join(" ")), "NMO 50424 strain/weight conflict boundary is missing", errors);

  check(contract.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount === 8 && contract.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount === 10, "runtime unique-main-scene arithmetic drifted", errors);
  check(JSON.stringify(contract.runtimeMergePolicy.supplementaryNeuronIds) === JSON.stringify([45674, 50424]) && contract.runtimeMergePolicy.overlappingActiveNeuronIds.length === 0, "supplementary/overlap set drifted", errors);
  check(contract.runtimeMergePolicy.frozenCensusRecordCount === 142 && contract.runtimeMergePolicy.censusExpansionCount === 0, "route pack changed the frozen census", errors);
  check(contract.summary.sourceCompleteAxonCount === 0 && contract.summary.nativeDatSemanticAdmissionCount === 0 && contract.summary.sameCellElectrophysiologyJoinCount === 0, "route pack gained complete axons, DAT semantics, or electrophysiology joins", errors);
  check(contract.summary.renderedInternalPrimitiveCount === 0 && contract.summary.projectRegistrationCount === 0, "route pack gained internal primitives or registration", errors);
  check(contract.packBoundaries.some((boundary) => /95-percent principal-component extents/i.test(boundary)), "PCA morphometry boundary is missing", errors);
  check(contract.packBoundaries.some((boundary) => /reuse terms do not transfer article-figure rights/i.test(boundary)), "article-figure rights boundary is missing", errors);

  if (errors.length) throw new Error(`Functional-class observed-morphology route-pack validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    routeCount: contract.summary.routeCount,
    uniqueMainSceneNeuronCount: contract.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount,
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
  validateFunctionalClassObservedMorphologyRoutePack()
    .then((report) => process.stdout.write(`Functional-class route pack valid: ${report.routeCount} routes, ${report.uniqueMainSceneNeuronCount} unique main-scene records, ${report.nativeDatSemanticAdmissionCount} admitted DAT semantics, ${report.sameCellElectrophysiologyJoinCount} exact physiology joins, ${report.internalPrimitiveCount} internal primitives, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
