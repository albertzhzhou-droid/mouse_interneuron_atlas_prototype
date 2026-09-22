#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { validateEvidenceAware3dRepresentationContract02 } from "./validate-evidence-aware-3d-representation-contract-0.2.mjs";
import { validateFunctionalClassObservedMorphologyRoutePack } from "./validate-functional-class-observed-morphology-route-pack-0.1.mjs";
import {
  buildEvidenceAware3dRepresentationContract03,
  serializeEvidenceAware3dRepresentationContract03,
} from "../tools/build_evidence_aware_3d_representation_contract_0_3.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.3.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/evidence-aware-3d-representation-contract-0.3.schema.json");
const BASE_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.2.json");
const ROUTE_PACK_PATH = path.join(PROJECT_ROOT, "data/functional-class-observed-morphology-route-pack-0.1.json");

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

export async function validateEvidenceAware3dRepresentationContract03(contractOverride = null) {
  const [contractBytes, schema, base, routePack, built] = await Promise.all([
    contractOverride === null ? readFile(CONTRACT_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(BASE_PATH, "utf8").then(JSON.parse),
    readFile(ROUTE_PACK_PATH, "utf8").then(JSON.parse),
    buildEvidenceAware3dRepresentationContract03(),
    validateEvidenceAware3dRepresentationContract02(),
    validateFunctionalClassObservedMorphologyRoutePack(),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Evidence-aware representation 0.3 schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  const expectedRouteIds = [...base.routes.map((route) => route.routeId), ...routePack.routes.map((route) => route.routeId)];
  check(JSON.stringify(contract.representationStates.map((state) => state.id)) === JSON.stringify(EXPECTED_STATE_IDS), "representation state IDs or order drifted", errors);
  check(contract.routes.length === 13, "contract must contain exactly 13 routes", errors);
  check(JSON.stringify(contract.routes.map((route) => route.routeId)) === JSON.stringify(expectedRouteIds), "representation route IDs or order drifted", errors);
  check(new Set(contract.routes.map((route) => route.routeId)).size === 13, "representation route IDs are not unique", errors);
  check(JSON.stringify(contract.runtimeMetadataRequirements) === JSON.stringify(EXPECTED_RUNTIME_METADATA_REQUIREMENTS), "runtime metadata requirements drifted", errors);
  check(JSON.stringify(contract.representationStates) === JSON.stringify(base.representationStates), "0.3 changed the immutable 0.2 representation states", errors);
  check(JSON.stringify(contract.routes.slice(0, base.routes.length)) === JSON.stringify(base.routes), "0.3 changed an immutable 0.2 route", errors);
  check(JSON.stringify(contract.globalInvariants.slice(0, base.globalInvariants.length)) === JSON.stringify(base.globalInvariants), "0.3 changed an immutable 0.2 global invariant", errors);

  await Promise.all([
    verifyReceipt(contract.buildInputs.baseContract, "0.2 base input", errors),
    verifyReceipt(contract.buildInputs.functionalClassRoutePack, "functional-class route-pack input", errors),
  ]);

  const appended = contract.routes.slice(base.routes.length);
  for (let index = 0; index < routePack.routes.length; index += 1) {
    const sourceRoute = routePack.routes[index];
    const route = appended[index];
    check(route.routeId === sourceRoute.routeId && route.label === sourceRoute.title, `${sourceRoute.routeId} identity or label drifted`, errors);
    check(JSON.stringify(route.sourceReceipt) === JSON.stringify(contract.buildInputs.functionalClassRoutePack), `${sourceRoute.routeId} no longer cites the route-pack receipt`, errors);
    check(route.sourceVersion === routePack.releaseId && route.sourceFrame === sourceRoute.geometryReceipt.sourceFrame, `${sourceRoute.routeId} source version or frame drifted`, errors);
    check(route.stableIdAuthority === sourceRoute.sourceRecord.assetId, `${sourceRoute.routeId} stable-ID authority drifted`, errors);
    check(JSON.stringify(route.representationStateIds) === JSON.stringify(["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"]), `${sourceRoute.routeId} representation-state authority drifted`, errors);
    check(route.renderedPrimitivePolicy === "checksum_verified_swc_or_source_radius_derivative_only_native_dat_zero_semantics", `${sourceRoute.routeId} rendered-primitive policy drifted`, errors);
    check(route.cellMorphologyClaim === true && route.missingLayerPolicy === "zero_primitives", `${sourceRoute.routeId} morphology or missing-layer policy drifted`, errors);
    check(route.crossSourceIdentityCount === 0 && route.projectRegistrationCount === 0, `${sourceRoute.routeId} creates an unsupported join or registration`, errors);
    check(sourceRoute.nativeDatContract.parsed === false && sourceRoute.nativeDatContract.semanticObjectCountAdmitted === 0 && sourceRoute.nativeDatContract.renderedPrimitiveCount === 0, `${sourceRoute.routeId} admits native DAT semantics`, errors);
    check(sourceRoute.identityBoundary.sameCellElectrophysiologyJoinStatus === "not_established" && sourceRoute.identityBoundary.paperMentionsExactNeuronIdOrFilename === false, `${sourceRoute.routeId} creates an exact electrophysiology join`, errors);
    check(sourceRoute.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, `${sourceRoute.routeId} gained internal primitives`, errors);
  }

  const renshaw = appended.find((route) => route.stableIdAuthority === "NeuroMorpho:45674");
  const npy = appended.find((route) => route.stableIdAuthority === "NeuroMorpho:50424");
  check(renshaw?.routeId === "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674", "Renshaw exact-object route is missing", errors);
  check(npy?.routeId === "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424", "NPY exact-object route is missing", errors);
  check(contract.globalInvariants.some((value) => /DAT bytes are provenance receipts only/i.test(value)), "native DAT non-admission invariant is missing", errors);
  check(contract.globalInvariants.some((value) => /exact object key/i.test(value)), "exact physiology join invariant is missing", errors);
  check(contract.globalInvariants.some((value) => /95-percent PCA morphometry/i.test(value)), "PCA morphometry boundary is missing", errors);
  check(contract.globalInvariants.some((value) => /preparation, strain, and weight conflicts/i.test(value)), "metadata-conflict invariant is missing", errors);

  const internalRoute = contract.routes.find((route) => route.routeId === "internal_reference");
  check(internalRoute?.renderedPrimitivePolicy === "zero_primitives" && JSON.stringify(internalRoute.representationStateIds) === JSON.stringify(["UNAVAILABLE"]), "internal reference must remain UNAVAILABLE-only with zero primitives", errors);

  const serialized = Buffer.from(serializeEvidenceAware3dRepresentationContract03(contract), "utf8");
  if (contractOverride === null) {
    check(contractBytes.equals(built.bytes), "committed 0.3 bytes differ from deterministic builder output", errors);
  } else {
    check(serialized.equals(built.bytes), "0.3 contract differs from deterministic builder output", errors);
  }
  if (errors.length) throw new Error(`Evidence-aware 3D representation 0.3 validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    stateCount: contract.representationStates.length,
    routeCount: contract.routes.length,
    baseRouteCount: base.routes.length,
    functionalClassRouteCount: routePack.routes.length,
    sourceDiameterAvailableRouteCount: routePack.routes.filter((route) => route.geometryReceipt.sourceDiameterAvailable).length,
    nativeDatSemanticAdmissionCount: routePack.routes.reduce((sum, route) => sum + route.nativeDatContract.semanticObjectCountAdmitted, 0),
    sameCellElectrophysiologyJoinCount: routePack.routes.filter((route) => route.identityBoundary.sameCellElectrophysiologyJoinStatus !== "not_established").length,
    unavailableRoutePrimitiveCount: 0,
    crossSourceIdentityCount: contract.routes.reduce((sum, route) => sum + route.crossSourceIdentityCount, 0),
    projectRegistrationCount: contract.routes.reduce((sum, route) => sum + route.projectRegistrationCount, 0),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateEvidenceAware3dRepresentationContract03()
    .then((report) => process.stdout.write(`Evidence-aware 3D contract 0.3 valid: ${report.stateCount} states, ${report.routeCount} routes (${report.functionalClassRouteCount} functional-class), ${report.nativeDatSemanticAdmissionCount} admitted DAT semantics, ${report.sameCellElectrophysiologyJoinCount} exact physiology joins, ${report.unavailableRoutePrimitiveCount} unavailable-route primitives, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
