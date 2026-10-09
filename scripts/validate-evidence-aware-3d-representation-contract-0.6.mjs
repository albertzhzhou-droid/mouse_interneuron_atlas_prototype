#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { validateCensusChildObservedMorphologyRoute01 } from "./validate-census-child-observed-morphology-route-0.1.mjs";
import { validateEvidenceAware3dRepresentationContract05 } from "./validate-evidence-aware-3d-representation-contract-0.5.mjs";
import {
  buildEvidenceAware3dRepresentationContract06,
  serializeEvidenceAware3dRepresentationContract06,
} from "../tools/build_evidence_aware_3d_representation_contract_0_6.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.6.json");
const SCHEMA_PATH = path.join(ROOT, "schemas/evidence-aware-3d-representation-contract-0.6.schema.json");
const BASE_PATH = path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.5.json");
const CHILD_PATH = path.join(ROOT, "data/census-child-observed-morphology-route-0.1.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function dataPath(receipt) {
  if (!receipt.path.startsWith("/data/") || receipt.path.split("/").includes("..")) throw new Error(`Unsupported source-frame asset path: ${receipt.path}`);
  return path.join(ROOT, "public/data", receipt.path.slice("/data/".length));
}

async function verifyFrame(frame, label, errors) {
  const bytes = await readFile(dataPath(frame));
  check(bytes.byteLength === frame.bytes, `${label} byte count drifted`, errors);
  check(sha256(bytes) === frame.sha256, `${label} SHA-256 drifted`, errors);
}

export async function validateEvidenceAware3dRepresentationContract06(contractOverride = null) {
  const [contractBytes, schema, baseBytes, childBytes, built] = await Promise.all([
    contractOverride === null ? readFile(CONTRACT_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(BASE_PATH),
    readFile(CHILD_PATH),
    buildEvidenceAware3dRepresentationContract06(),
    validateEvidenceAware3dRepresentationContract05(),
    validateCensusChildObservedMorphologyRoute01(),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const base = JSON.parse(baseBytes.toString("utf8"));
  const child = JSON.parse(childBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Evidence-aware representation 0.6 schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  const sourceRoute = child.route;
  const appended = contract.routes.at(-1);
  check(base.contractId === "evidence-aware-3d-representation-contract-0.5" && base.routes.length === 16, "0.5 parent identity drifted", errors);
  check(equal(contract.representationStates.map((state) => state.id), [...base.representationStates.map((state) => state.id), "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP"]), "0.6 state order or source-native state drifted", errors);
  check(contract.representationStates.at(-1).geometryAuthority === "OBS" && /ordered Neurolucida soma line traces/.test(contract.representationStates.at(-1).meaning), "source-native line-loop state authority drifted", errors);
  check(contract.routes.length === 17 && new Set(contract.routes.map((route) => route.routeId)).size === 17, "contract must contain 17 unique routes", errors);
  check(equal(contract.routes.slice(0, 16), base.routes), "0.6 modified an immutable 0.5 route", errors);
  check(equal(contract.representationStates.slice(0, 9), base.representationStates), "0.6 modified an immutable 0.5 representation state", errors);
  check(equal(contract.runtimeMetadataRequirements.slice(0, base.runtimeMetadataRequirements.length), base.runtimeMetadataRequirements), "0.6 modified immutable runtime metadata requirements", errors);
  check(equal(contract.globalInvariants.slice(0, base.globalInvariants.length), base.globalInvariants), "0.6 modified immutable 0.5 invariants", errors);
  check(appended.routeId === sourceRoute.routeId && appended.routeId === "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108978", "appended NMO 108978 route identity drifted", errors);
  check(appended.stableIdAuthority === "NeuroMorpho:108978" && appended.sourceVersion === child.releaseId, "appended route's stable source identity drifted", errors);
  check(appended.sourceFrame === "multiple_source_local_frames_without_overlay", "route must identify the multiple-frame condition", errors);
  check(equal(appended.representationStateIds, ["OBS_SKELETON", "DER_RADIUS_SURFACE", "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP", "UNAVAILABLE"]), "NMO 108978 representation states drifted", errors);
  check(appended.cellMorphologyClaim === true && appended.missingLayerPolicy === "zero_primitives", "NMO 108978 morphology or missingness policy drifted", errors);
  check(appended.crossSourceIdentityCount === 0 && appended.projectRegistrationCount === 0, "NMO 108978 route creates identity or registration", errors);
  check(appended.renderedPrimitivePolicy === "checksum_verified_swc_and_source_radius_derivative_plus_separate_source_native_line_loops_no_cross_frame_overlay", "NMO 108978 render policy drifted", errors);
  check(appended.representationFrames?.length === 2, "NMO 108978 must receipt both separate source frames", errors);
  const swcFrame = appended.representationFrames?.[0];
  const contourFrame = appended.representationFrames?.[1];
  check(swcFrame?.stateId === "OBS_SKELETON" && swcFrame.sourceFrame === sourceRoute.geometryReceipt.sourceFrame && swcFrame.path === sourceRoute.sourceObjects.swc.path, "standardized SWC frame receipt drifted", errors);
  check(contourFrame?.stateId === "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP" && contourFrame.sourceFrame === sourceRoute.nativeDatContract.sourceFrame && contourFrame.path === sourceRoute.sourceObjects.nativeContourGeometry.path, "native DAT frame receipt drifted", errors);
  check(contourFrame?.primitiveCount === 12 && contourFrame.vertexCount === 2614, "native DAT line-loop detail count drifted", errors);
  check(swcFrame?.overlayAllowed === false && contourFrame?.overlayAllowed === false && sourceRoute.nativeDatContract.overlayWithStandardizedSwcAllowed === false, "cross-frame overlay became allowed", errors);
  check(sourceRoute.somaContourReceipt.coordinateTransformToStandardizedSwcStatus === "not_established", "DAT-to-SWC transform boundary drifted", errors);
  check(sourceRoute.renderingContract.sameSpecimenInternalStructure.available === false && sourceRoute.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, "internal structures gained primitives", errors);
  check(contract.globalInvariants.some((value) => /existing member of the frozen 142-record census.*adds no census row/i.test(value)), "non-additive census invariant is missing", errors);
  check(contract.globalInvariants.some((value) => /separate source-local frames.*no overlay.*registration/i.test(value)), "two-frame no-overlay invariant is missing", errors);

  const baseReceipt = contract.buildInputs.baseContract;
  check(equal(baseReceipt, { path: "/project/data/evidence-aware-3d-representation-contract-0.5.json", bytes: baseBytes.byteLength, sha256: sha256(baseBytes) }), "0.5 parent receipt drifted", errors);
  const childReceipt = contract.buildInputs.censusChildMorphologyRoute;
  check(equal(childReceipt, { path: "/project/data/census-child-observed-morphology-route-0.1.json", bytes: childBytes.byteLength, sha256: sha256(childBytes) }), "census-child route receipt drifted", errors);
  await Promise.all([verifyFrame(swcFrame, "standardized SWC", errors), verifyFrame(contourFrame, "source-native contour geometry", errors)]);

  const serialized = Buffer.from(serializeEvidenceAware3dRepresentationContract06(contract), "utf8");
  if (contractOverride === null) check(contractBytes.equals(built.bytes), "committed 0.6 bytes differ from deterministic builder output", errors);
  else check(serialized.equals(built.bytes), "0.6 contract differs from deterministic builder output", errors);
  if (errors.length) throw new Error(`Evidence-aware representation 0.6 validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    stateCount: contract.representationStates.length,
    routeCount: contract.routes.length,
    appendedRouteId: appended.routeId,
    nativeSomaLineLoopCount: contourFrame.primitiveCount,
    nativeSomaLineLoopVertexCount: contourFrame.vertexCount,
    internalPrimitiveCount: sourceRoute.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount,
    crossSourceIdentityCount: contract.routes.reduce((sum, route) => sum + route.crossSourceIdentityCount, 0),
    projectRegistrationCount: contract.routes.reduce((sum, route) => sum + route.projectRegistrationCount, 0),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateEvidenceAware3dRepresentationContract06()
    .then((report) => process.stdout.write(`Evidence-aware 3D contract 0.6 valid: ${report.stateCount} states, ${report.routeCount} routes, NMO 108978 ${report.nativeSomaLineLoopCount} native line loops / ${report.nativeSomaLineLoopVertexCount} vertices, ${report.internalPrimitiveCount} internal primitives, ${report.crossSourceIdentityCount} cross-source identities, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
