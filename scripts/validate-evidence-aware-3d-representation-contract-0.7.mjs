#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateEvidenceAware3dRepresentationContract06 } from "./validate-evidence-aware-3d-representation-contract-0.6.mjs";
import { validateNeuromorphoRelease126ToddNtsRoutePack01 } from "./validate-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.mjs";
import { buildEvidenceAware3dRepresentationContract07, serializeEvidenceAware3dRepresentationContract07 } from "../tools/build_evidence_aware_3d_representation_contract_0_7.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.7.json");
const SCHEMA_PATH = path.join(ROOT, "schemas/evidence-aware-3d-representation-contract-0.7.schema.json");
const BASE_PATH = path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.6.json");
const ROUTE_PACK_PATH = path.join(ROOT, "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const check = (condition, message, errors) => { if (!condition) errors.push(message); };

function publicAssetPath(pathname) {
  if (!pathname.startsWith("/data/") || pathname.split("/").includes("..")) throw new Error(`Unsupported source-local asset path: ${pathname}`);
  return path.join(ROOT, "public", pathname.slice(1));
}

async function verifyAsset(receipt, label, errors) {
  const bytes = await readFile(publicAssetPath(receipt.path));
  check(bytes.byteLength === receipt.bytes, `${label} byte count drifted`, errors);
  check(sha256(bytes) === receipt.sha256, `${label} SHA-256 drifted`, errors);
}

export async function validateEvidenceAware3dRepresentationContract07(contractOverride = null) {
  const [contractBytes, schema, baseBytes, routePackBytes, built] = await Promise.all([
    contractOverride === null ? readFile(CONTRACT_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(BASE_PATH),
    readFile(ROUTE_PACK_PATH),
    buildEvidenceAware3dRepresentationContract07(),
    validateEvidenceAware3dRepresentationContract06(),
    validateNeuromorphoRelease126ToddNtsRoutePack01(),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));
  const base = JSON.parse(baseBytes.toString("utf8"));
  const pack = JSON.parse(routePackBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) throw new Error(`Evidence-aware representation 0.7 schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);

  const errors = [];
  check(base.contractId === "evidence-aware-3d-representation-contract-0.6" && base.routes.length === 17, "0.6 immutable parent identity drifted", errors);
  check(equal(contract.representationStates, base.representationStates), "0.7 must not mutate frozen representation states", errors);
  check(equal(contract.routes.slice(0, base.routes.length), base.routes), "0.7 must preserve all 17 immutable 0.6 routes", errors);
  check(equal(contract.globalInvariants.slice(0, base.globalInvariants.length), base.globalInvariants), "0.7 must preserve immutable 0.6 invariants", errors);
  check(contract.routes.length === 47 && new Set(contract.routes.map((route) => route.routeId)).size === 47, "0.7 must contain 47 unique routes", errors);

  const routePackReceipt = {
    path: "/project/data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json",
    bytes: routePackBytes.byteLength,
    sha256: sha256(routePackBytes),
  };
  check(equal(contract.buildInputs.neuromorphoToddNtsRoutePack, routePackReceipt), "Todd NTS build input receipt drifted", errors);
  const baseReceipt = { path: "/project/data/evidence-aware-3d-representation-contract-0.6.json", bytes: baseBytes.byteLength, sha256: sha256(baseBytes) };
  check(equal(contract.buildInputs.baseContract, baseReceipt), "0.6 parent receipt drifted", errors);

  const routes = contract.routes.slice(base.routes.length);
  check(routes.length === pack.routes.length, "0.7 supplementary route count differs from the source route pack", errors);
  let radiusDerivedRouteCount = 0;
  for (const [index, sourceRoute] of pack.routes.entries()) {
    const route = routes[index];
    const hasDiameter = sourceRoute.sourceRecord.sourceAttributes.startsWith("Diameter,");
    if (hasDiameter) radiusDerivedRouteCount += 1;
    const expectedStates = ["OBS_SKELETON", ...(hasDiameter ? ["DER_RADIUS_SURFACE"] : []), "UNAVAILABLE"];
    check(route?.routeId === sourceRoute.routeId && route?.stableIdAuthority === sourceRoute.sourceRecord.assetId, `Route ${index} stable source identity drifted`, errors);
    check(route?.sourceVersion === pack.releaseId && route?.sourceFrame === sourceRoute.sourceRecord.sourceFrame, `${sourceRoute.routeId} source version/frame drifted`, errors);
    check(route?.label === sourceRoute.title && route?.cellMorphologyClaim === true, `${sourceRoute.routeId} source label or morphology authority drifted`, errors);
    check(equal(route?.representationStateIds, expectedStates), `${sourceRoute.routeId} rendering states exceed exact source authority`, errors);
    check(route?.missingLayerPolicy === "zero_primitives" && route?.crossSourceIdentityCount === 0 && route?.projectRegistrationCount === 0, `${sourceRoute.routeId} missingness or identity boundary drifted`, errors);
    check(equal(route?.sourceReceipt, routePackReceipt), `${sourceRoute.routeId} route-pack receipt drifted`, errors);
    const frame = route?.representationFrames?.[0];
    check(route?.representationFrames?.length === 1 && frame?.stateId === "OBS_SKELETON" && frame?.sourceFrame === sourceRoute.sourceRecord.sourceFrame, `${sourceRoute.routeId} must have one source-local skeleton frame`, errors);
    check(frame?.path === sourceRoute.sourceObjects.geometry.path && frame?.bytes === sourceRoute.sourceObjects.geometry.bytes && frame?.sha256 === sourceRoute.sourceObjects.geometry.sha256, `${sourceRoute.routeId} geometry receipt drifted`, errors);
    check(equal(frame?.sourceSwc, { path: sourceRoute.sourceObjects.swc.path, bytes: sourceRoute.sourceObjects.swc.bytes, sha256: sourceRoute.sourceObjects.swc.sha256 }), `${sourceRoute.routeId} source SWC receipt drifted`, errors);
    check(frame?.overlayAllowed === false, `${sourceRoute.routeId} cross-frame overlay is prohibited`, errors);
    const radiusPolicy = route?.renderedPrimitivePolicy.includes("source_radius_derived_open_frusta") ?? false;
    check(radiusPolicy === hasDiameter, `${sourceRoute.routeId} radius-derived policy does not follow repository diameter metadata`, errors);
    await Promise.all([verifyAsset(sourceRoute.sourceObjects.geometry, `${sourceRoute.routeId} geometry`, errors), verifyAsset(sourceRoute.sourceObjects.swc, `${sourceRoute.routeId} SWC`, errors)]);
  }
  check(radiusDerivedRouteCount === 10, "Exactly ten routes may have source-radius authority", errors);
  check(contract.globalInvariants.some((value) => /zero records to the frozen 1,097-record 8\.6\.124 query denominator/.test(value)), "Supplementary routes must not change the frozen census denominator", errors);
  check(contract.globalInvariants.some((value) => /no verified per-record original-paper, animal, figure or lamina crosswalk/.test(value)), "Unresolved article/animal/figure/lamina mapping invariant is missing", errors);
  check(contract.globalInvariants.some((value) => /Ten NMO 322379–322408 records explicitly report source diameter.*twenty do not report diameter/.test(value)), "Source-radius versus centerline-only boundary is missing", errors);
  check(contract.globalInvariants.some((value) => /zero internal primitives, cross-source identities and project registrations/.test(value)), "Zero internal primitives/identity/registration boundary is missing", errors);

  const serialized = Buffer.from(serializeEvidenceAware3dRepresentationContract07(contract), "utf8");
  if (contractOverride === null) check(contractBytes.equals(built.bytes), "Committed 0.7 bytes differ from deterministic builder output", errors);
  else check(serialized.equals(built.bytes), "0.7 contract differs from deterministic builder output", errors);
  if (errors.length) throw new Error(`Evidence-aware representation 0.7 validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    stateCount: contract.representationStates.length,
    routeCount: contract.routes.length,
    supplementaryRouteCount: routes.length,
    radiusDerivedRouteCount,
    centerlineOnlyRouteCount: routes.length - radiusDerivedRouteCount,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateEvidenceAware3dRepresentationContract07()
    .then((report) => process.stdout.write(`Evidence-aware 3D contract 0.7 valid: ${report.routeCount} routes (${report.supplementaryRouteCount} supplementary; ${report.radiusDerivedRouteCount} radius-derived, ${report.centerlineOnlyRouteCount} centerline-only); ${report.internalPrimitiveCount} internal primitives, ${report.crossSourceIdentityCount} cross-source identities, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
