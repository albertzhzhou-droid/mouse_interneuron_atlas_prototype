#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/premotor-comparison-observed-morphology-route-pack-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/premotor-comparison-observed-morphology-route-pack-0.1.schema.json");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "public/data/premotor_comparison_observed_morphology_route_pack_v1/asset-manifest.json");
const CENSUS_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");

const EXPECTED = {
  routeId: "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718",
  neuronId: 45718,
  name: "101026p1-A-In",
  nodes: 5636,
  segments: 5635,
  types: { "1": 8, "2": 4237, "3": 1391 },
  bounds: { min: [-436.01, -264.19, -200], max: [251.84, 289.81, 28] },
  extent: [687.85, 554, 228],
  repositoryDimensions: [583.793, 482.994, 212],
  api: [1513, "ac769a76e959d093a0468d345356256627b0ccd5536334f7b943734521b55407"],
  morphometry: [473, "d999e37d9b94650415fd50e795ff0b43af24045e95a87c43c1b5e2ee57dda38a"],
  swc: [214337, "c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee"],
  dat: [343774, "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415"],
  geometry: [615468, "c5193dbca4f17bb945a034196dd7dee130096502c71e01b6e5aedacfcade8865"],
  canonical: "08514c7c924c2b1ff444eb45f43e89ab1633bce64dc1618be148617e80de52a3",
  topology: "7fb6e4ed99208c66fa323a297bd85c800f3cbbe340baafcf7f0312832dda5af9",
};

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function same(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function receiptPath(receipt) {
  if (!receipt.path.startsWith("/data/")) throw new Error(`Unsupported receipt path ${receipt.path}`);
  return path.join(PROJECT_ROOT, "public/data", receipt.path.slice("/data/".length));
}

async function verifyReceipt(receipt, expected, label, errors) {
  const bytes = await readFile(receiptPath(receipt));
  check(receipt.bytes === expected[0] && bytes.byteLength === expected[0], `${label} byte count drifted`, errors);
  check(receipt.sha256 === expected[1] && digest(bytes) === expected[1], `${label} SHA-256 drifted`, errors);
  return bytes;
}

function verifyTree(nodes, errors) {
  const ids = new Set(nodes.map((node) => node[0]));
  check(ids.size === EXPECTED.nodes, "SWC node IDs are not unique", errors);
  const roots = nodes.filter((node) => node[6] === -1);
  check(roots.length === 1 && roots[0]?.[0] === 1, "SWC must have exactly root node 1", errors);
  const children = new Map(nodes.map((node) => [node[0], []]));
  for (const node of nodes) {
    const [id, , , , , radius, parent] = node;
    check(radius > 0, `node ${id} has a non-positive radius`, errors);
    if (parent === -1) continue;
    check(ids.has(parent), `node ${id} references missing parent ${parent}`, errors);
    children.get(parent)?.push(id);
  }
  const visited = new Set();
  const stack = [1];
  while (stack.length) {
    const id = stack.pop();
    if (visited.has(id)) {
      errors.push(`cycle or repeated traversal reached node ${id}`);
      continue;
    }
    visited.add(id);
    stack.push(...(children.get(id) ?? []));
  }
  check(visited.size === EXPECTED.nodes, `SWC is disconnected: reached ${visited.size} of ${EXPECTED.nodes} nodes`, errors);
}

function countKinds(files) {
  return Object.fromEntries(
    [...files.reduce((counts, file) => counts.set(file.kind, (counts.get(file.kind) ?? 0) + 1), new Map())]
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

export async function validatePremotorComparisonObservedMorphologyRoutePack(contractOverride = null) {
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
    throw new Error(`Premotor comparison route-pack schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  check(contract.routes.length === 1 && contract.summary.routeCount === 1, "route denominator drifted", errors);
  const route = contract.routes[0];
  check(route.routeId === EXPECTED.routeId, "route ID drifted", errors);
  check(route.sourceRecord.neuronId === EXPECTED.neuronId && route.sourceRecord.neuronName === EXPECTED.name, "source identity drifted", errors);
  check(route.sourceRecord.archive === "Bannatyne" && route.sourceRecord.species === "mouse", "archive or species drifted", errors);
  check(same(route.sourceRecord.regionLabels, ["spinal cord", "L5", "ventral horn"]), "source region labels drifted", errors);
  check(same(route.sourceRecord.cellTypeLabels, ["Calbindin (CB)-negative", "glycinergic", "pre-motor", "non-renshaw", "interneuron"]), "repository cell labels drifted", errors);
  check(route.sourceRecord.repositorySlicingDirection === "horizontal" && route.sourceRecord.repositorySlicingThicknessMicrometre === 50, "raw repository slicing fields drifted", errors);
  check(route.sourceRecord.shrinkageReported === "Reported" && route.sourceRecord.shrinkageCorrected === "Not Corrected", "shrinkage status drifted", errors);
  check(route.sourceRecord.repositoryWeightGrams.minimum === null && route.sourceRecord.repositoryWeightGrams.maximum === null && route.sourceRecord.repositoryWeightGrams.missingOrInvalidReason === "not_reported", "missing weight was imputed", errors);
  check(route.sourceRecord.sex === "Male/Female" && route.sourceRecord.repositoryStrainRaw === "GlyT2-EGFP", "raw sex or strain context drifted", errors);
  check(route.sourceRecord.sourcePaperDoi === "10.1523/JNEUROSCI.0199-14.2014" && route.sourceRecord.sourcePaperPmid === "25232126", "paper identity drifted", errors);
  check(route.sourceRecord.preparationJoinStatus === "context_only_not_exact_stage_equivalence", "preparation-stage boundary drifted", errors);
  check(/400 micrometre transverse.*50 micrometre serial resectioning/i.test(route.sourceRecord.paperPreparationContext), "paper preparation stages are missing", errors);

  check(route.geometryReceipt.nodeCount === EXPECTED.nodes && route.geometryReceipt.segmentCount === EXPECTED.segments, "geometry counts drifted", errors);
  check(same(route.geometryReceipt.nodeTypeCounts, EXPECTED.types), "node-type counts drifted", errors);
  check(same(route.geometryReceipt.boundsMicrometre, EXPECTED.bounds) && same(route.geometryReceipt.extentMicrometre, EXPECTED.extent), "SWC bounds or extent drifted", errors);
  check(same([
    route.geometryReceipt.repositoryMorphometry.widthMicrometre,
    route.geometryReceipt.repositoryMorphometry.heightMicrometre,
    route.geometryReceipt.repositoryMorphometry.depthMicrometre,
  ], EXPECTED.repositoryDimensions), "official morphometry dimensions drifted", errors);
  check(route.geometryReceipt.repositoryMorphometry.lengthMicrometre === 8518.26, "official morphometry length drifted", errors);
  check(route.geometryReceipt.repositoryMorphometry.extentDefinition === "95_percent_principal_component_extents" && route.geometryReceipt.repositoryMorphometry.equivalentToSwcBounds === false, "PCA extents were conflated with SWC bounds", errors);
  check(route.geometryReceipt.canonicalGeometrySha256 === EXPECTED.canonical && route.geometryReceipt.topologySha256 === EXPECTED.topology, "canonical geometry or topology hash drifted", errors);
  check(route.geometryReceipt.registrationStatus === "unregistered" && route.geometryReceipt.repositoryMorphometry.atlasRegistrationClaim === false, "route gained an atlas registration", errors);

  check(route.somaStandardizationReceipt.evidenceSource === "standardized_swc_header_and_type_1_nodes", "soma evidence source drifted", errors);
  check(route.somaStandardizationReceipt.originalContourCount === 8 && route.somaStandardizationReceipt.standardizedSomaPointCount === 8, "soma contour-to-point count drifted", errors);
  check(route.somaStandardizationReceipt.nativeContourVerticesAdmitted === false && route.somaStandardizationReceipt.membraneClaim === false, "standardized soma points became native contours or a membrane", errors);
  check(route.renderingContract.observedSwc.available === true && route.renderingContract.observedSwc.representationStateId === "OBS_SKELETON", "observed skeleton state drifted", errors);
  check(route.renderingContract.radiusSurface.available === true && route.renderingContract.radiusSurface.authority === "DERIVED_FROM_OBSERVED_RADIUS" && route.renderingContract.radiusSurface.membraneClaim === false && route.renderingContract.radiusSurface.measurementUse === "forbidden", "radius derivative authority drifted", errors);
  check(route.renderingContract.sameSpecimenInternalStructure.available === false && route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, "unsupported internals were admitted", errors);
  check(route.fidelityRecord.axon.sourceType2NodeCount === 4237 && route.fidelityRecord.axon.completeAxon === false, "observed axon count or completeness boundary drifted", errors);
  check(route.nativeDatContract.parsed === false && route.nativeDatContract.rendered === false && route.nativeDatContract.semanticObjectCountAdmitted === 0 && route.nativeDatContract.renderedPrimitiveCount === 0, "native DAT semantics were admitted", errors);
  check(route.identityBoundary.paperMentionsExactNeuronIdOrFilename === false && route.identityBoundary.sameCellElectrophysiologyJoinStatus === "not_established", "paper context became an exact physiology join", errors);
  check(route.identityBoundary.individualMolecularAssayClaim === false && route.identityBoundary.crossSourceIdentityCount === 0 && route.identityBoundary.projectRegistrationCount === 0, "route gained a molecular identity, cross-source join or registration", errors);

  check(census.summary.queryRecordCount === 142 && census.records.length === 142 && !census.records.some((record) => record.neuronId === 45718), "NMO 45718 entered or changed the frozen census", errors);
  check(contract.runtimeMergePolicy.preMergeUniqueMainSceneNeuronCount === 12 && contract.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount === 13, "main-scene denominator arithmetic drifted", errors);
  check(contract.runtimeMergePolicy.preExistingNamedRouteCount === 9 && contract.runtimeMergePolicy.postMergeNamedRouteCount === 10, "named-route arithmetic drifted", errors);
  check(contract.runtimeMergePolicy.postMergeNamedDorsalHornRouteCount === 8 && contract.runtimeMergePolicy.postMergeNamedVentralHornRouteCount === 2, "dorsal/ventral route denominator drifted", errors);
  check(contract.runtimeMergePolicy.frozenCensusRecordCount === 142 && contract.runtimeMergePolicy.censusExpansionCount === 0, "route pack changed the frozen census", errors);
  check(contract.summary.sourceCompleteAxonCount === 0 && contract.summary.nativeDatSemanticAdmissionCount === 0 && contract.summary.sameCellElectrophysiologyJoinCount === 0, "complete axon, DAT semantics or exact physiology was admitted", errors);
  check(contract.summary.renderedInternalPrimitiveCount === 0 && contract.summary.exactCrossSourceIdentityCount === 0 && contract.summary.projectRegistrationCount === 0, "internal primitives, cross-source identities or registration were admitted", errors);

  check(manifest.assetSetId === "neuromorpho:8.6.124:premotor-comparison-observed-morphology-route-pack-v1", "asset-set identity drifted", errors);
  check(manifest.summary.fileCount === 5 && manifest.files.length === 5, "asset manifest denominator drifted", errors);
  check(same(countKinds(manifest.files), {
    lazy_geometry: 1,
    official_api_snapshot: 1,
    official_morphometry_snapshot: 1,
    source_native_dat_receipt_only: 1,
    standardized_swc: 1,
  }), "asset kind counts drifted", errors);
  check(manifest.summary.nativeDatSemanticAdmissionCount === 0 && manifest.summary.registrationCount === 0, "asset manifest admitted DAT semantics or registration", errors);

  const [apiBytes, morphometryBytes, geometryBytes, swcBytes, datBytes] = await Promise.all([
    verifyReceipt(route.sourceObjects.metadata, EXPECTED.api, "API", errors),
    verifyReceipt(route.sourceObjects.morphometry, EXPECTED.morphometry, "morphometry", errors),
    verifyReceipt(route.sourceObjects.geometry, EXPECTED.geometry, "geometry", errors),
    verifyReceipt(route.sourceObjects.swc, EXPECTED.swc, "SWC", errors),
    verifyReceipt(route.sourceObjects.originalDat, EXPECTED.dat, "DAT", errors),
  ]);
  const api = JSON.parse(apiBytes.toString("utf8"));
  const morphometry = JSON.parse(morphometryBytes.toString("utf8"));
  const geometry = JSON.parse(geometryBytes.toString("utf8"));
  check(api.neuron_id === 45718 && api.neuron_name === EXPECTED.name && api.physical_Integrity === "Dendrites & Axon Moderate", "pinned API content drifted", errors);
  check(api.reported_value === null && api.reported_xy === null && api.reported_z === null && api.corrected_value === null && api.corrected_xy === null && api.corrected_z === null, "numeric shrinkage absence drifted", errors);
  check(morphometry.neuron_id === 45718 && morphometry.neuron_name === EXPECTED.name, "pinned morphometry identity drifted", errors);
  check(geometry.neuronId === 45718 && geometry.nodes.length === EXPECTED.nodes && geometry.segments.length === EXPECTED.segments, "geometry payload denominator drifted", errors);
  check(geometry.morphometrics.computedFromStandardizedSwc.zeroLengthEdgeCount === 0, "zero-length edge count drifted", errors);
  check(geometry.morphometrics.computedFromStandardizedSwc.totalCableLengthMicrometre === 8532.234230770975, "direct cable-length sum drifted", errors);
  check(geometry.swc.originalMorphologyFile.value.semanticAdmission === "not_parsed_not_rendered" && geometry.nativeAnnotationPolicy.semanticObjectsAdmitted === 0, "geometry admitted native DAT semantics", errors);
  verifyTree(geometry.nodes, errors);
  check(swcBytes.toString("utf8").includes("The original file has 8 soma contours that are averaged into 8 soma points"), "SWC soma-contour standardization header is missing", errors);
  check(datBytes.indexOf(Buffer.from("V3 DAT file", "ascii")) >= 0, "source-native DAT signature is missing", errors);

  const boundaries = [...route.hardBoundaries, ...contract.packBoundaries].join(" ");
  check(/calbindin.*washout/i.test(boundaries) && /not necessarily premotor/i.test(boundaries), "calbindin-washout or premotor uncertainty boundary is missing", errors);
  check(/raw repository fields.*slicing_direction=horizontal.*slicing_thickness=50/i.test(boundaries), "raw preparation-field boundary is missing", errors);
  check(/shrinkage.*not corrected.*no numeric|reported-but-uncorrected shrinkage.*no numeric/i.test(boundaries), "shrinkage boundary is missing", errors);
  check(/8 original soma contours.*8 type-1 soma points/i.test(boundaries), "soma standardization boundary is missing", errors);
  check(/zero internal primitives/i.test(boundaries), "zero-internal-primitive boundary is missing", errors);

  if (errors.length) throw new Error(`Premotor comparison observed-morphology route-pack validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    routeCount: contract.summary.routeCount,
    uniqueMainSceneNeuronCount: contract.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount,
    namedRouteCount: contract.runtimeMergePolicy.postMergeNamedRouteCount,
    censusRecordCount: contract.runtimeMergePolicy.frozenCensusRecordCount,
    sourceDiameterAvailableCount: contract.summary.sourceDiameterAvailableCount,
    sourceCompleteAxonCount: contract.summary.sourceCompleteAxonCount,
    nativeDatSemanticAdmissionCount: contract.summary.nativeDatSemanticAdmissionCount,
    sameCellElectrophysiologyJoinCount: contract.summary.sameCellElectrophysiologyJoinCount,
    internalPrimitiveCount: contract.summary.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: contract.summary.exactCrossSourceIdentityCount,
    projectRegistrationCount: contract.summary.projectRegistrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validatePremotorComparisonObservedMorphologyRoutePack()
    .then((report) => process.stdout.write(`Premotor comparison route pack valid: ${report.routeCount} route, ${report.uniqueMainSceneNeuronCount} unique main-scene forms, ${report.nativeDatSemanticAdmissionCount} DAT semantics, ${report.sameCellElectrophysiologyJoinCount} exact physiology joins, ${report.internalPrimitiveCount} internal primitives, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
