#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/dorsal-horn-observed-morphology-route-pack-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/dorsal-horn-observed-morphology-route-pack-0.1.schema.json");
const SUPPLEMENTARY_MANIFEST_PATH = path.join(PROJECT_ROOT, "public/data/dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json");
const CENSUS_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");
const ANALYSIS_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_analysis_v1/analysis-index.json");
const FROZEN_FORM_PATH = path.join(PROJECT_ROOT, "data/observed-cell-form-lens-0.1.json");
const FROZEN_FIDELITY_PATH = path.join(PROJECT_ROOT, "data/morphology-fidelity-contract-0.1.json");

const EXPECTED = new Map([
  [249676, { routeId: "mouse.sc.grpr_lamina_i_ii.observed.nmo_249676", census: false, nodes: 1178, segments: 1177, types: { "1": 12, "2": 63, "3": 1103 }, soma: 12, diameter: false, swcBytes: 41217, swcSha256: "b5a96ebc6979f0022c70a26eaa6a5c060545a05d2164852a5a5dd8dc290f4f75" }],
  [108974, { routeId: "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108974", census: true, nodes: 1801, segments: 1800, types: { "1": 9, "3": 1792 }, soma: 9, diameter: true, swcBytes: 62567, swcSha256: "0fc8e7050e455ed1f79fa5a8e4da304c69054fb5ddd0167fcb3970c5d4c0982d" }],
  [170035, { routeId: "mouse.sc.pv_pax2_lamina_ii_iii.observed.nmo_170035", census: false, nodes: 2167, segments: 2166, types: { "1": 18, "3": 2149 }, soma: 18, diameter: false, swcBytes: 76053, swcSha256: "73f85373bd426e8ef4dc0f95b73a61678ffb454d963ec292a403ad31a0f116a6" }],
  [104003, { routeId: "mouse.sc.pdyn_dorsal_horn.observed.nmo_104003", census: true, nodes: 109, segments: 108, types: { "1": 3, "3": 106 }, soma: 3, diameter: true, swcBytes: 4454, swcSha256: "0f24943c43854cbe48f8bebfd4b45b905a5f897580d4dc25fd55c8ec9c4b8d8d" }],
]);

const EXPECTED_SOURCE = new Map([
  [249676, { doi: "10.1097/j.pain.0000000000002677", lifeStage: "young", sex: "Male/Female", direction: "Sagittal", slice: 60, integrity: "Dendrites Moderate, Axon Incomplete", protocol: "in vivo" }],
  [108974, { doi: "10.1097/j.pain.0000000000001406", lifeStage: "adult", sex: "Male/Female", direction: "parasagittal", slice: 60, integrity: "Dendrites Complete", protocol: "in vivo" }],
  [170035, { doi: "10.1097/j.pain.0000000000002422", lifeStage: "young adult", sex: "Male/Female", direction: "Sagittal", slice: 60, integrity: "Dendrites Moderate", protocol: "in vitro" }],
  [104003, { doi: "10.1038/s41593-018-0119-z", lifeStage: "adult", sex: "Female", direction: "parasagittal", slice: 60, integrity: "Dendrites Moderate", protocol: "in vivo" }],
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

async function verifyReceipt(receipt, label, errors) {
  const bytes = await readFile(receiptPath(receipt));
  check(bytes.byteLength === receipt.bytes, `${label} byte count drifted`, errors);
  check(digest(bytes) === receipt.sha256, `${label} SHA-256 drifted`, errors);
  return bytes;
}

export async function validateDorsalHornObservedMorphologyRoutePack(contractOverride = null) {
  const [contract, schema, supplementaryManifest, census, analysis, frozenForms, frozenFidelity] = await Promise.all([
    contractOverride ?? readFile(CONTRACT_PATH, "utf8").then(JSON.parse),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(SUPPLEMENTARY_MANIFEST_PATH, "utf8").then(JSON.parse),
    readFile(CENSUS_PATH, "utf8").then(JSON.parse),
    readFile(ANALYSIS_PATH, "utf8").then(JSON.parse),
    readFile(FROZEN_FORM_PATH, "utf8").then(JSON.parse),
    readFile(FROZEN_FIDELITY_PATH, "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Dorsal-horn route-pack schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  const expectedOrder = [249676, 108974, 170035, 104003];
  check(JSON.stringify(contract.routes.map((route) => route.sourceRecord.neuronId)) === JSON.stringify(expectedOrder), "route neuron IDs or order drifted", errors);
  check(new Set(contract.routes.map((route) => route.sourceRecord.neuronId)).size === 4, "route neuron IDs are not unique", errors);
  check(new Set(contract.routes.map((route) => route.routeId)).size === 4, "route IDs are not unique", errors);
  check(supplementaryManifest.summary.fileCount === 6 && supplementaryManifest.files.length === 6, "supplementary asset-manifest count drifted", errors);
  check(JSON.stringify([...new Set(supplementaryManifest.files.map((file) => file.neuronId))].sort((a, b) => a - b)) === JSON.stringify([170035, 249676]), "supplementary asset-manifest neuron set drifted", errors);
  check(JSON.stringify(supplementaryManifest.files.reduce((counts, file) => ({ ...counts, [file.kind]: (counts[file.kind] ?? 0) + 1 }), {})) === JSON.stringify({ official_api_snapshot: 2, lazy_geometry: 2, standardized_swc: 2 }), "supplementary asset-manifest role counts drifted", errors);
  check(supplementaryManifest.summary.registrationCount === 0, "supplementary asset manifest creates a registration", errors);
  check(census.summary.queryRecordCount === 142 && census.records.length === 142, "frozen census denominator drifted", errors);
  const censusIds = new Set(census.records.map((record) => record.neuronId));
  const analysisIds = new Set(analysis.records.map((record) => record.neuronId));
  const frozenFormById = new Map(frozenForms.records.map((record) => [record.neuronId, record]));
  const frozenFidelityById = new Map(frozenFidelity.records.map((record) => [record.neuronId, record]));

  for (const route of contract.routes) {
    const neuronId = route.sourceRecord.neuronId;
    const expected = EXPECTED.get(neuronId);
    const expectedSource = EXPECTED_SOURCE.get(neuronId);
    check(Boolean(expected), `unexpected NMO ${neuronId}`, errors);
    check(Boolean(expectedSource), `NMO ${neuronId} source receipt is not locked`, errors);
    if (!expected || !expectedSource) continue;
    check(route.routeId === expected.routeId, `NMO ${neuronId} route ID drifted`, errors);
    check(route.censusMembership === expected.census, `NMO ${neuronId} census-membership flag drifted`, errors);
    check(censusIds.has(neuronId) === expected.census, `NMO ${neuronId} actual census membership disagrees with contract`, errors);
    check(route.geometryReceipt.nodeCount === expected.nodes && route.geometryReceipt.segmentCount === expected.segments, `NMO ${neuronId} node or edge count drifted`, errors);
    check(JSON.stringify(route.geometryReceipt.nodeTypeCounts) === JSON.stringify(expected.types), `NMO ${neuronId} source-type counts drifted`, errors);
    check(route.somaContourReceipt.originalContourCount === expected.soma && route.somaContourReceipt.standardizedSomaPointCount === expected.soma, `NMO ${neuronId} soma-contour receipt drifted`, errors);
    check(route.somaContourReceipt.nativeContourVerticesAvailable === false && route.somaContourReceipt.membraneClaim === false, `NMO ${neuronId} soma proxy gained unsupported authority`, errors);
    check(route.geometryReceipt.sourceDiameterAvailable === expected.diameter, `NMO ${neuronId} diameter authority drifted`, errors);
    check(route.fidelityRecord.geometry.sourceDiameterAvailable === expected.diameter, `NMO ${neuronId} runtime diameter authority drifted`, errors);
    check(route.sourceObjects.swc.bytes === expected.swcBytes && route.sourceObjects.swc.sha256 === expected.swcSha256, `NMO ${neuronId} exact SWC receipt drifted`, errors);
    check(route.fidelityRecord.geometry.rawSwcSha256 === expected.swcSha256, `NMO ${neuronId} runtime SWC receipt drifted`, errors);
    check(route.fidelityRecord.axon.completeAxon === false, `NMO ${neuronId} gained a complete-axon claim`, errors);
    check(route.sourceRecord.sourcePaperDoi === expectedSource.doi, `NMO ${neuronId} primary-paper DOI drifted`, errors);
    check(route.sourceRecord.lifeStage === expectedSource.lifeStage && route.sourceRecord.sex === expectedSource.sex, `NMO ${neuronId} age or sex scope drifted`, errors);
    check(route.sourceRecord.slicingDirection === expectedSource.direction && route.sourceRecord.slicingThicknessMicrometre === expectedSource.slice, `NMO ${neuronId} section receipt drifted`, errors);
    check(route.sourceRecord.physicalIntegrity === expectedSource.integrity && route.sourceRecord.protocol === expectedSource.protocol, `NMO ${neuronId} integrity or protocol receipt drifted`, errors);
    check(route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, `NMO ${neuronId} gained procedural internal primitives`, errors);
    check(route.identityBoundary.crossSourceIdentityCount === 0 && route.identityBoundary.projectRegistrationCount === 0, `NMO ${neuronId} gained an identity join or registration`, errors);
    check(route.identityBoundary.selectedSciEntityRelationship === "none" && route.identityBoundary.molecularProfileRelationship === "none", `NMO ${neuronId} gained an unsupported route relationship`, errors);
    if (expected.diameter) {
      check(route.renderingContract.radiusSurface.available === true && route.renderingContract.radiusSurface.authority === "DERIVED_FROM_OBSERVED_RADIUS", `NMO ${neuronId} source-authorized radius surface is not correctly gated`, errors);
    } else {
      check(route.renderingContract.radiusSurface.available === false && route.renderingContract.radiusSurface.authority === "UNAVAILABLE", `NMO ${neuronId} No Diameter route incorrectly authorizes a surface`, errors);
      check(route.fidelityRecord.radiusEvidence.status === "UNAVAILABLE" && route.fidelityRecord.radiusEvidence.missingReason === "official_attributes_report_no_diameter", `NMO ${neuronId} placeholder radii were promoted`, errors);
    }
    const [geometryBytes, swcBytes] = await Promise.all([
      verifyReceipt(route.sourceObjects.geometry, `NMO ${neuronId} geometry`, errors),
      verifyReceipt(route.sourceObjects.swc, `NMO ${neuronId} SWC`, errors),
    ]);
    const geometry = JSON.parse(geometryBytes.toString("utf8"));
    check(geometry.neuronId === neuronId && geometry.assetId === `NeuroMorpho:${neuronId}`, `NMO ${neuronId} geometry identity drifted`, errors);
    check(geometry.nodes.length === expected.nodes && geometry.segments.length === expected.segments, `NMO ${neuronId} geometry payload counts drifted`, errors);
    check(geometry.swc.sha256 === expected.swcSha256 && geometry.swc.sourceDiameterAvailable === expected.diameter, `NMO ${neuronId} geometry SWC authority drifted`, errors);
    check(geometry.registration?.status === "unregistered" && geometry.registration?.registrationCount === 0, `NMO ${neuronId} geometry gained registration`, errors);
    const swcText = swcBytes.toString("utf8");
    check(new RegExp(`original file has ${expected.soma} soma contours that are averaged into ${expected.soma} soma points`, "i").test(swcText), `NMO ${neuronId} averaged-soma header evidence is missing`, errors);
    check(route.hardBoundaries.some((boundary) => /zero internal primitives/i.test(boundary)), `NMO ${neuronId} zero-internal boundary is missing`, errors);
    if (expected.census) {
      check(JSON.stringify(route.observedCellFormRecord) === JSON.stringify(frozenFormById.get(neuronId)), `NMO ${neuronId} does not exactly reuse its frozen cell-form record`, errors);
      check(JSON.stringify(route.fidelityRecord) === JSON.stringify(frozenFidelityById.get(neuronId)), `NMO ${neuronId} does not exactly reuse its frozen fidelity record`, errors);
      check(route.sourceObjects.geometry.path === `/data/neuromorpho_release_8_6_124_census_v1/geometry/nmo-${neuronId}.json`, `NMO ${neuronId} overlap does not point to canonical census geometry`, errors);
    } else {
      check(!frozenFormById.has(neuronId) && !frozenFidelityById.has(neuronId), `NMO ${neuronId} supplementary record was promoted into a frozen runtime contract`, errors);
      check(!censusIds.has(neuronId) && !analysisIds.has(neuronId), `NMO ${neuronId} supplementary record was promoted into the 142-record census or analysis`, errors);
      check(route.sourceObjects.geometry.path === `/data/dorsal_horn_observed_morphology_route_pack_v1/geometry/nmo-${neuronId}.json`, `NMO ${neuronId} supplementary geometry path drifted`, errors);
    }
  }

  const pdyn = contract.routes.find((route) => route.sourceRecord.neuronId === 104003);
  check(/PdynCre \/ AAV-eGFP, Sst2a-receptor-positive/i.test(pdyn.title), "NMO 104003 corrected route identity label is missing", errors);
  check(pdyn.identityBoundary.markerIdentityBasis === "PdynCre_AAV_flex_eGFP_capture_plus_Sst2a_receptor_immunoreactivity", "NMO 104003 identity basis drifted", errors);
  check(pdyn.hardBoundaries.some((boundary) => /SST and VGLUT2 tokens describe presumed contacting boutons.*not expression by the reconstructed cell/i.test(boundary)), "NMO 104003 filename-marker boundary is missing", errors);
  const grpr = contract.routes.find((route) => route.sourceRecord.neuronId === 249676);
  check(/GRPR is the receptor rather than the GRP ligand/i.test(grpr.hardBoundaries.join(" ")), "NMO 249676 GRPR-versus-GRP boundary is missing", errors);
  check(contract.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount === 8, "runtime deduplicated count drifted", errors);
  check(JSON.stringify(contract.runtimeMergePolicy.overlappingFrozenNeuronIds) === JSON.stringify([104003, 108974]), "frozen overlap set drifted", errors);
  check(JSON.stringify(contract.runtimeMergePolicy.supplementaryNeuronIds) === JSON.stringify([170035, 249676]), "supplementary runtime set drifted", errors);
  check(contract.runtimeMergePolicy.censusExpansionCount === 0, "route pack expanded the frozen census", errors);
  check(contract.summary.sourceCompleteAxonCount === 0 && contract.summary.renderedInternalPrimitiveCount === 0, "route pack creates unsupported complete-axon or internal claims", errors);
  check(contract.packBoundaries.some((boundary) => /reuse terms do not transfer article-figure rights/i.test(boundary)), "article-figure rights boundary is missing", errors);

  if (errors.length) throw new Error(`Dorsal-horn observed-morphology route-pack validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    routeCount: contract.summary.routeCount,
    uniqueMainSceneNeuronCount: contract.runtimeMergePolicy.postMergeUniqueMainSceneNeuronCount,
    censusRecordCount: contract.runtimeMergePolicy.frozenCensusRecordCount,
    censusExpansionCount: contract.runtimeMergePolicy.censusExpansionCount,
    supplementaryRecordCount: contract.summary.supplementaryRecordCount,
    sourceDiameterAvailableCount: contract.summary.sourceDiameterAvailableCount,
    sourceCompleteAxonCount: contract.summary.sourceCompleteAxonCount,
    internalPrimitiveCount: contract.summary.renderedInternalPrimitiveCount,
    crossSourceIdentityCount: contract.summary.exactCrossSourceIdentityCount,
    projectRegistrationCount: contract.summary.projectRegistrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateDorsalHornObservedMorphologyRoutePack()
    .then((report) => process.stdout.write(`Dorsal-horn route pack valid: ${report.routeCount} routes, ${report.uniqueMainSceneNeuronCount} unique main-scene records, ${report.supplementaryRecordCount} supplementary records, ${report.censusExpansionCount} census expansion, ${report.internalPrimitiveCount} internal primitives, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
