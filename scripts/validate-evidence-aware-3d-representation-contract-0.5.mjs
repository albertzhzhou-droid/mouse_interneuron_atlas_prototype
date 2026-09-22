#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { validateEvidenceAware3dRepresentationContract04 } from "./validate-evidence-aware-3d-representation-contract-0.4.mjs";
import { validatePremotorComparisonObservedMorphologyRoutePack } from "./validate-premotor-comparison-observed-morphology-route-pack-0.1.mjs";
import {
  buildEvidenceAware3dRepresentationContract05,
  serializeEvidenceAware3dRepresentationContract05,
} from "../tools/build_evidence_aware_3d_representation_contract_0_5.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.5.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/evidence-aware-3d-representation-contract-0.5.schema.json");
const BASE_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.4.json");
const ROUTE_PACK_PATH = path.join(PROJECT_ROOT, "data/premotor-comparison-observed-morphology-route-pack-0.1.json");

const EXPECTED_BASE_BYTES = 21341;
const EXPECTED_BASE_SHA256 = "1dec67e67884199a481ce8127793523acf56d0d50df83cfe330e933c8260e392";
const EXPECTED_ROUTE_ID = "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718";
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
  if (!receipt.path.startsWith("/project/")) throw new Error(`Unsupported receipt root: ${receipt.path}`);
  return path.join(PROJECT_ROOT, receipt.path.slice("/project/".length));
}

async function verifyReceipt(receipt, label, errors) {
  const bytes = await readFile(receiptPath(receipt));
  check(bytes.byteLength === receipt.bytes, `${label} byte count drifted`, errors);
  check(digest(bytes) === receipt.sha256, `${label} SHA-256 drifted`, errors);
}

export async function validateEvidenceAware3dRepresentationContract05(contractOverride = null) {
  const [contractBytes, schema, baseBytes, routePackBytes, built] = await Promise.all([
    contractOverride === null ? readFile(CONTRACT_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(BASE_PATH),
    readFile(ROUTE_PACK_PATH),
    buildEvidenceAware3dRepresentationContract05(),
    validateEvidenceAware3dRepresentationContract04(),
    validatePremotorComparisonObservedMorphologyRoutePack(),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const base = JSON.parse(baseBytes.toString("utf8"));
  const routePack = JSON.parse(routePackBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Evidence-aware representation 0.5 schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  check(baseBytes.byteLength === EXPECTED_BASE_BYTES && digest(baseBytes) === EXPECTED_BASE_SHA256, "immutable 0.4 base bytes drifted", errors);
  check(base.contractId === "evidence-aware-3d-representation-contract-0.4" && base.routes.length === 15, "unexpected 0.4 base contract", errors);
  check(routePack.contractId === "premotor-comparison-observed-morphology-route-pack-0.1" && routePack.routes.length === 1, "unexpected premotor comparison route pack", errors);
  check(same(contract.representationStates.map((state) => state.id), EXPECTED_STATE_IDS), "representation state IDs or order drifted", errors);
  check(contract.routes.length === 16 && new Set(contract.routes.map((route) => route.routeId)).size === 16, "contract must contain 16 unique routes", errors);
  check(same(contract.routes.slice(0, 15), base.routes), "0.5 changed an immutable 0.4 route", errors);
  check(same(contract.representationStates, base.representationStates), "0.5 changed immutable representation states", errors);
  check(same(contract.runtimeMetadataRequirements, base.runtimeMetadataRequirements), "0.5 changed immutable runtime metadata requirements", errors);
  check(same(contract.globalInvariants.slice(0, base.globalInvariants.length), base.globalInvariants), "0.5 changed an immutable 0.4 invariant", errors);
  check(contract.routes[15].routeId === EXPECTED_ROUTE_ID && contract.routes[15].routeId === routePack.routes[0].routeId, "appended route identity drifted", errors);

  await Promise.all([
    verifyReceipt(contract.buildInputs.baseContract, "0.4 base input", errors),
    verifyReceipt(contract.buildInputs.premotorComparisonRoutePack, "premotor comparison route-pack input", errors),
  ]);
  check(same(contract.buildInputs.baseContract, {
    path: "/project/data/evidence-aware-3d-representation-contract-0.4.json",
    bytes: EXPECTED_BASE_BYTES,
    sha256: EXPECTED_BASE_SHA256,
  }), "0.4 base receipt is not the immutable pinned artifact", errors);

  const source = routePack.routes[0];
  const appended = contract.routes[15];
  check(appended.label === source.title && appended.stableIdAuthority === "NeuroMorpho:45718", "appended label or stable-ID authority drifted", errors);
  check(same(appended.sourceReceipt, contract.buildInputs.premotorComparisonRoutePack), "appended route no longer cites its route-pack receipt", errors);
  check(appended.sourceVersion === routePack.releaseId && appended.sourceFrame === source.geometryReceipt.sourceFrame, "source version or frame drifted", errors);
  check(same(appended.representationStateIds, ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"]), "appended representation-state authority drifted", errors);
  check(appended.renderedPrimitivePolicy === "checksum_verified_swc_or_source_radius_derivative_only_native_dat_zero_semantics", "rendered-primitive policy drifted", errors);
  check(appended.cellMorphologyClaim === true && appended.missingLayerPolicy === "zero_primitives", "morphology or missing-layer policy drifted", errors);
  check(appended.crossSourceIdentityCount === 0 && appended.projectRegistrationCount === 0, "appended route creates identity or registration", errors);

  check(source.sourceRecord.cellTypeLabels.includes("Calbindin (CB)-negative") && source.sourceRecord.cellTypeLabels.includes("non-renshaw"), "exact repository labels are missing", errors);
  check(/repository-labelled/i.test(source.title), "source label lacks repository authority qualifier", errors);
  check(source.somaStandardizationReceipt.originalContourCount === 8 && source.somaStandardizationReceipt.standardizedSomaPointCount === 8 && source.somaStandardizationReceipt.membraneClaim === false, "soma standardization receipt drifted", errors);
  check(source.nativeDatContract.parsed === false && source.nativeDatContract.semanticObjectCountAdmitted === 0, "source route admits native DAT semantics", errors);
  check(source.identityBoundary.paperMentionsExactNeuronIdOrFilename === false && source.identityBoundary.sameCellElectrophysiologyJoinStatus === "not_established", "source route creates an exact paper or physiology join", errors);
  check(source.identityBoundary.individualMolecularAssayClaim === false && source.identityBoundary.crossSourceIdentityCount === 0 && source.identityBoundary.projectRegistrationCount === 0, "source route creates molecular, identity or registration claims", errors);
  check(source.renderingContract.sameSpecimenInternalStructure.available === false && source.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, "source route gained internal primitives", errors);
  check(source.fidelityRecord.axon.sourceType2NodeCount === 4237 && source.fidelityRecord.axon.completeAxon === false, "source route axon boundary drifted", errors);

  check(contract.globalInvariants.some((value) => /repository labels.*never upgraded.*Renshaw exclusion/i.test(value)), "repository-label boundary is missing", errors);
  check(contract.globalInvariants.some((value) => /eight original soma contours.*eight standardized type-1 points/i.test(value)), "soma-standardization invariant is missing", errors);
  check(contract.globalInvariants.some((value) => /slicing fields.*SWC axes.*PCA morphometry.*shrinkage/i.test(value)), "preparation and shrinkage invariant is missing", errors);
  check(contract.globalInvariants.some((value) => /DAT contributes zero semantic objects.*physiology contributes zero exact object joins.*internals contribute zero rendered primitives/i.test(value)), "DAT, physiology or internal zero invariant is missing", errors);
  check(contract.routes.reduce((sum, route) => sum + route.crossSourceIdentityCount, 0) === 0, "contract creates a cross-source identity", errors);
  check(contract.routes.reduce((sum, route) => sum + route.projectRegistrationCount, 0) === 0, "contract creates a project registration", errors);

  const serialized = Buffer.from(serializeEvidenceAware3dRepresentationContract05(contract), "utf8");
  if (contractOverride === null) {
    check(contractBytes.equals(built.bytes), "committed 0.5 bytes differ from deterministic builder output", errors);
  } else {
    check(serialized.equals(built.bytes), "0.5 contract differs from deterministic builder output", errors);
  }
  if (errors.length) throw new Error(`Evidence-aware 3D representation 0.5 validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    stateCount: contract.representationStates.length,
    routeCount: contract.routes.length,
    baseRouteCount: base.routes.length,
    premotorComparisonRouteCount: routePack.routes.length,
    nativeDatSemanticAdmissionCount: source.nativeDatContract.semanticObjectCountAdmitted,
    sameCellElectrophysiologyJoinCount: source.identityBoundary.sameCellElectrophysiologyJoinStatus === "not_established" ? 0 : 1,
    sameSpecimenInternalStructureCount: source.renderingContract.sameSpecimenInternalStructure.available ? 1 : 0,
    renderedInternalPrimitiveCount: source.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount,
    crossSourceIdentityCount: contract.routes.reduce((sum, route) => sum + route.crossSourceIdentityCount, 0),
    projectRegistrationCount: contract.routes.reduce((sum, route) => sum + route.projectRegistrationCount, 0),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateEvidenceAware3dRepresentationContract05()
    .then((report) => process.stdout.write(`Evidence-aware 3D contract 0.5 valid: ${report.stateCount} states, ${report.routeCount} routes, ${report.nativeDatSemanticAdmissionCount} DAT semantics, ${report.sameCellElectrophysiologyJoinCount} exact physiology joins, ${report.renderedInternalPrimitiveCount} internal primitives, ${report.crossSourceIdentityCount} cross-source identities, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
