#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { validateEvidenceAware3dRepresentationContract03 } from "./validate-evidence-aware-3d-representation-contract-0.3.mjs";
import { validatePrpDorsalHornObservedMorphologyRoutePack } from "./validate-prp-dorsal-horn-observed-morphology-route-pack-0.1.mjs";
import {
  buildEvidenceAware3dRepresentationContract04,
  serializeEvidenceAware3dRepresentationContract04,
} from "../tools/build_evidence_aware_3d_representation_contract_0_4.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.4.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/evidence-aware-3d-representation-contract-0.4.schema.json");
const BASE_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.3.json");
const ROUTE_PACK_PATH = path.join(PROJECT_ROOT, "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json");

const EXPECTED_BASE_BYTES = 18496;
const EXPECTED_BASE_SHA256 = "00c464afc793b8853d176366ece708f993c89920dba4027789bc7e84d9b03aa6";
const EXPECTED_STATE_IDS = [
  "OBS_RAW_TEXTURE",
  "OBS_SEGMENTED_SURFACE",
  "OBS_SKELETON",
  "OBS_POINT",
  "DER_RADIUS_SURFACE",
  "INF_REFERENCE_GEOMETRY",
  "SCH_PATH",
  "SYN_DATA_GLYPH",
  "UNAVAILABLE",
];
const EXPECTED_RUNTIME_METADATA_REQUIREMENTS = [
  "stableId",
  "representationState",
  "sourceFrame",
  "sourceVersion",
  "sourceReceiptSha256",
  "cellMorphologyClaim",
  "projectRegistrationCount",
  "crossSourceIdentityCount",
];
const EXPECTED_PRP_OBJECTS = [
  {
    routeId: "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
    assetId: "NeuroMorpho:50394",
    title: "PrP-promoter reporter-positive nNOS-positive interneuron",
    marker: "Neuronal Nitric Oxide Synthase (nNOS)-positive",
  },
  {
    routeId: "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
    assetId: "NeuroMorpho:50408",
    title: "PrP-promoter reporter-positive galanin-positive interneuron",
    marker: "galanin-expressing",
  },
];

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function receiptPath(receipt) {
  if (!receipt.path.startsWith("/project/")) throw new Error(`Unsupported receipt root: ${receipt.path}`);
  return path.join(PROJECT_ROOT, receipt.path.slice("/project/".length));
}

async function verifyReceipt(receipt, label, errors) {
  const bytes = await readFile(receiptPath(receipt));
  check(bytes.byteLength === receipt.bytes, `${label} byte count drifted`, errors);
  check(digest(bytes) === receipt.sha256, `${label} SHA-256 drifted`, errors);
}

export async function validateEvidenceAware3dRepresentationContract04(contractOverride = null) {
  const [contractBytes, schema, baseBytes, routePackBytes, built] = await Promise.all([
    contractOverride === null ? readFile(CONTRACT_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(BASE_PATH),
    readFile(ROUTE_PACK_PATH),
    buildEvidenceAware3dRepresentationContract04(),
    validateEvidenceAware3dRepresentationContract03(),
    validatePrpDorsalHornObservedMorphologyRoutePack(),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const base = JSON.parse(baseBytes.toString("utf8"));
  const routePack = JSON.parse(routePackBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Evidence-aware representation 0.4 schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  check(baseBytes.byteLength === EXPECTED_BASE_BYTES && digest(baseBytes) === EXPECTED_BASE_SHA256, "immutable 0.3 base bytes drifted", errors);
  check(routePack.contractId === "prp-dorsal-horn-observed-morphology-route-pack-0.1", "unexpected PrP route-pack contract ID", errors);
  check(routePack.releaseId === "ohri-prp-dorsal-horn-observed-morphology-route-pack-0.1.0", "unexpected PrP route-pack release ID", errors);
  check(routePack.routes.length === 2 && routePack.summary.routeCount === 2, "PrP route pack must contain exactly two routes", errors);
  const expectedRouteIds = [...base.routes.map((route) => route.routeId), ...routePack.routes.map((route) => route.routeId)];
  check(JSON.stringify(contract.representationStates.map((state) => state.id)) === JSON.stringify(EXPECTED_STATE_IDS), "representation state IDs or order drifted", errors);
  check(contract.routes.length === 15, "contract must contain exactly 15 routes", errors);
  check(JSON.stringify(contract.routes.map((route) => route.routeId)) === JSON.stringify(expectedRouteIds), "representation route IDs or order drifted", errors);
  check(new Set(contract.routes.map((route) => route.routeId)).size === 15, "representation route IDs are not unique", errors);
  check(JSON.stringify(contract.runtimeMetadataRequirements) === JSON.stringify(EXPECTED_RUNTIME_METADATA_REQUIREMENTS), "runtime metadata requirements drifted", errors);
  check(JSON.stringify(contract.representationStates) === JSON.stringify(base.representationStates), "0.4 changed the immutable 0.3 representation states", errors);
  check(JSON.stringify(contract.routes.slice(0, base.routes.length)) === JSON.stringify(base.routes), "0.4 changed an immutable 0.3 route", errors);
  check(JSON.stringify(contract.runtimeMetadataRequirements) === JSON.stringify(base.runtimeMetadataRequirements), "0.4 changed immutable 0.3 runtime metadata requirements", errors);
  check(JSON.stringify(contract.globalInvariants.slice(0, base.globalInvariants.length)) === JSON.stringify(base.globalInvariants), "0.4 changed an immutable 0.3 global invariant", errors);

  await Promise.all([
    verifyReceipt(contract.buildInputs.baseContract, "0.3 base input", errors),
    verifyReceipt(contract.buildInputs.prpDorsalHornRoutePack, "PrP route-pack input", errors),
  ]);
  check(JSON.stringify(contract.buildInputs.baseContract) === JSON.stringify({ path: "/project/data/evidence-aware-3d-representation-contract-0.3.json", bytes: EXPECTED_BASE_BYTES, sha256: EXPECTED_BASE_SHA256 }), "0.3 base receipt is not the immutable pinned artifact", errors);

  const appended = contract.routes.slice(base.routes.length);
  for (let index = 0; index < routePack.routes.length; index += 1) {
    const sourceRoute = routePack.routes[index];
    const expected = EXPECTED_PRP_OBJECTS[index];
    const route = appended[index];
    check(sourceRoute.routeId === expected.routeId && sourceRoute.sourceRecord.assetId === expected.assetId && sourceRoute.title === expected.title, `${expected.assetId} source-local identity drifted`, errors);
    check(sourceRoute.sourceRecord.cellTypeLabels.includes(expected.marker), `${expected.assetId} exact positive marker label is missing`, errors);
    check(sourceRoute.sourceRecord.cellTypeLabels.includes("prion protein (PrP) promoter-positive"), `${expected.assetId} PrP-promoter label is missing`, errors);
    check(sourceRoute.sourceRecord.cellTypeLabels.every((label) => !/negative/i.test(label)), `${expected.assetId} invents marker negativity or exclusivity`, errors);
    check(route.routeId === sourceRoute.routeId && route.label === sourceRoute.title, `${sourceRoute.routeId} identity or label drifted`, errors);
    check(JSON.stringify(route.sourceReceipt) === JSON.stringify(contract.buildInputs.prpDorsalHornRoutePack), `${sourceRoute.routeId} no longer cites the PrP route-pack receipt`, errors);
    check(route.sourceVersion === routePack.releaseId && route.sourceFrame === sourceRoute.geometryReceipt.sourceFrame, `${sourceRoute.routeId} source version or frame drifted`, errors);
    check(route.stableIdAuthority === sourceRoute.sourceRecord.assetId, `${sourceRoute.routeId} stable-ID authority drifted`, errors);
    check(JSON.stringify(route.representationStateIds) === JSON.stringify(["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"]), `${sourceRoute.routeId} representation-state authority drifted`, errors);
    check(route.renderedPrimitivePolicy === "checksum_verified_swc_or_source_radius_derivative_only_native_dat_zero_semantics", `${sourceRoute.routeId} rendered-primitive policy drifted`, errors);
    check(route.cellMorphologyClaim === true && route.missingLayerPolicy === "zero_primitives", `${sourceRoute.routeId} morphology or missing-layer policy drifted`, errors);
    check(route.crossSourceIdentityCount === 0 && route.projectRegistrationCount === 0, `${sourceRoute.routeId} creates an unsupported identity or registration`, errors);
    check(sourceRoute.nativeDatContract.parsed === false && sourceRoute.nativeDatContract.rendered === false && sourceRoute.nativeDatContract.semanticObjectCountAdmitted === 0 && sourceRoute.nativeDatContract.renderedPrimitiveCount === 0, `${sourceRoute.routeId} admits native DAT semantics`, errors);
    check(sourceRoute.identityBoundary.sameCellElectrophysiologyJoinStatus === "not_established" && sourceRoute.identityBoundary.paperMentionsExactNeuronIdOrFilename === false, `${sourceRoute.routeId} creates an exact electrophysiology join`, errors);
    check(sourceRoute.identityBoundary.individualMolecularAssayClaim === false && sourceRoute.identityBoundary.crossSourceIdentityCount === 0 && sourceRoute.identityBoundary.projectRegistrationCount === 0, `${sourceRoute.routeId} promotes cohort context or creates an unsupported identity`, errors);
    check(sourceRoute.renderingContract.sameSpecimenInternalStructure.available === false && sourceRoute.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, `${sourceRoute.routeId} gained same-specimen internal primitives`, errors);
    check(sourceRoute.fidelityRecord.axon.completeAxon === false, `${sourceRoute.routeId} claims a complete axon`, errors);
    check(sourceRoute.sourceRecord.repositorySlicingThicknessMicrometre === 300 && /60 micrometre serial resectioning/i.test(sourceRoute.sourceRecord.paperPreparationContext), `${sourceRoute.routeId} preparation stages drifted`, errors);
  }

  check(routePack.summary.nativeDatSemanticAdmissionCount === 0, "PrP route pack summary admits DAT semantics", errors);
  check(routePack.summary.sameCellElectrophysiologyJoinCount === 0, "PrP route pack summary creates exact physiology joins", errors);
  check(routePack.summary.sameSpecimenInternalStructureCount === 0 && routePack.summary.renderedInternalPrimitiveCount === 0, "PrP route pack summary creates internal structures", errors);
  check(routePack.summary.exactCrossSourceIdentityCount === 0 && routePack.summary.projectRegistrationCount === 0, "PrP route pack summary creates identity or registration", errors);
  check(contract.globalInvariants.some((value) => /marker-negative inference/i.test(value)), "positive-only marker boundary is missing", errors);
  check(contract.globalInvariants.some((value) => /endogenous PrP protein abundance/i.test(value)), "PrP-promoter versus endogenous-protein boundary is missing", errors);
  check(contract.globalInvariants.some((value) => /300-micrometre source slice.*60-micrometre serial resection/i.test(value)), "preparation-stage boundary is missing", errors);
  check(contract.globalInvariants.some((value) => /DAT contributes zero semantic objects.*physiology contributes zero exact object joins.*internals contribute zero rendered primitives/i.test(value)), "DAT, physiology, or internal-detail zero boundary is missing", errors);

  const internalRoute = contract.routes.find((route) => route.routeId === "internal_reference");
  check(internalRoute?.renderedPrimitivePolicy === "zero_primitives" && JSON.stringify(internalRoute.representationStateIds) === JSON.stringify(["UNAVAILABLE"]), "internal reference must remain UNAVAILABLE-only with zero primitives", errors);
  check(contract.routes.reduce((sum, route) => sum + route.crossSourceIdentityCount, 0) === 0, "contract creates a cross-source identity", errors);
  check(contract.routes.reduce((sum, route) => sum + route.projectRegistrationCount, 0) === 0, "contract creates a project registration", errors);

  const serialized = Buffer.from(serializeEvidenceAware3dRepresentationContract04(contract), "utf8");
  if (contractOverride === null) {
    check(contractBytes.equals(built.bytes), "committed 0.4 bytes differ from deterministic builder output", errors);
  } else {
    check(serialized.equals(built.bytes), "0.4 contract differs from deterministic builder output", errors);
  }
  if (errors.length) throw new Error(`Evidence-aware 3D representation 0.4 validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    stateCount: contract.representationStates.length,
    routeCount: contract.routes.length,
    baseRouteCount: base.routes.length,
    prpRouteCount: routePack.routes.length,
    sourceDiameterAvailableRouteCount: routePack.routes.filter((route) => route.geometryReceipt.sourceDiameterAvailable).length,
    nativeDatSemanticAdmissionCount: routePack.routes.reduce((sum, route) => sum + route.nativeDatContract.semanticObjectCountAdmitted, 0),
    sameCellElectrophysiologyJoinCount: routePack.routes.filter((route) => route.identityBoundary.sameCellElectrophysiologyJoinStatus !== "not_established").length,
    sameSpecimenInternalStructureCount: routePack.routes.filter((route) => route.renderingContract.sameSpecimenInternalStructure.available).length,
    renderedInternalPrimitiveCount: routePack.routes.reduce((sum, route) => sum + route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount, 0),
    crossSourceIdentityCount: contract.routes.reduce((sum, route) => sum + route.crossSourceIdentityCount, 0),
    projectRegistrationCount: contract.routes.reduce((sum, route) => sum + route.projectRegistrationCount, 0),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateEvidenceAware3dRepresentationContract04()
    .then((report) => process.stdout.write(`Evidence-aware 3D contract 0.4 valid: ${report.stateCount} states, ${report.routeCount} routes (${report.prpRouteCount} PrP), ${report.nativeDatSemanticAdmissionCount} admitted DAT semantics, ${report.sameCellElectrophysiologyJoinCount} exact physiology joins, ${report.renderedInternalPrimitiveCount} internal primitives, ${report.crossSourceIdentityCount} cross-source identities, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
