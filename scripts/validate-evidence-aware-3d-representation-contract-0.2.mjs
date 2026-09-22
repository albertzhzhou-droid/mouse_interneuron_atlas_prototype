#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { validateDorsalHornObservedMorphologyRoutePack } from "./validate-dorsal-horn-observed-morphology-route-pack-0.1.mjs";
import { validateEvidenceAware3dRepresentationContract } from "./validate-evidence-aware-3d-representation-contract-0.1.mjs";
import {
  buildEvidenceAware3dRepresentationContract02,
  serializeEvidenceAware3dRepresentationContract02,
} from "../tools/build_evidence_aware_3d_representation_contract_0_2.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(
  PROJECT_ROOT,
  "data/evidence-aware-3d-representation-contract-0.2.json",
);
const SCHEMA_PATH = path.join(
  PROJECT_ROOT,
  "schemas/evidence-aware-3d-representation-contract-0.2.schema.json",
);
const BASE_PATH = path.join(
  PROJECT_ROOT,
  "data/evidence-aware-3d-representation-contract-0.1.json",
);
const ROUTE_PACK_PATH = path.join(
  PROJECT_ROOT,
  "data/dorsal-horn-observed-morphology-route-pack-0.1.json",
);

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
  if (receipt.path.startsWith("/project/")) {
    return path.join(PROJECT_ROOT, receipt.path.slice("/project/".length));
  }
  if (receipt.path.startsWith("/data/")) {
    return path.join(PROJECT_ROOT, "public/data", receipt.path.slice("/data/".length));
  }
  throw new Error(`Unsupported receipt root: ${receipt.path}`);
}

async function verifyReceipt(receipt, label, errors) {
  const bytes = await readFile(receiptPath(receipt));
  check(bytes.byteLength === receipt.bytes, `${label} byte count drifted`, errors);
  check(digest(bytes) === receipt.sha256, `${label} SHA-256 drifted`, errors);
}

function expectedStatesForRoutePackEntry(sourceRoute) {
  return sourceRoute.geometryReceipt.sourceDiameterAvailable
    ? ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"]
    : ["OBS_SKELETON", "UNAVAILABLE"];
}

export async function validateEvidenceAware3dRepresentationContract02(
  contractOverride = null,
) {
  const [contractBytes, schema, base, routePack, built] = await Promise.all([
    contractOverride === null ? readFile(CONTRACT_PATH) : null,
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(BASE_PATH, "utf8").then(JSON.parse),
    readFile(ROUTE_PACK_PATH, "utf8").then(JSON.parse),
    buildEvidenceAware3dRepresentationContract02(),
    validateEvidenceAware3dRepresentationContract(),
    validateDorsalHornObservedMorphologyRoutePack(),
  ]);
  const contract = contractOverride ?? JSON.parse(contractBytes.toString("utf8"));

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(
      `Evidence-aware representation 0.2 schema validation failed:\n${(validate.errors ?? [])
        .map((error) => `- ${error.instancePath || "/"}: ${error.message}`)
        .join("\n")}`,
    );
  }

  const errors = [];
  const expectedRouteIds = [
    ...base.routes.map((route) => route.routeId),
    ...routePack.routes.map((route) => route.routeId),
  ];
  check(
    JSON.stringify(contract.representationStates.map((state) => state.id)) ===
      JSON.stringify(EXPECTED_STATE_IDS),
    "representation state IDs or order drifted",
    errors,
  );
  check(contract.routes.length === 11, "contract must contain exactly 11 routes", errors);
  check(
    JSON.stringify(contract.routes.map((route) => route.routeId)) ===
      JSON.stringify(expectedRouteIds),
    "representation route IDs or order drifted",
    errors,
  );
  check(
    new Set(contract.routes.map((route) => route.routeId)).size === 11,
    "representation route IDs are not unique",
    errors,
  );
  check(
    JSON.stringify(contract.runtimeMetadataRequirements) ===
      JSON.stringify(EXPECTED_RUNTIME_METADATA_REQUIREMENTS),
    "runtime metadata requirements drifted",
    errors,
  );
  check(
    JSON.stringify(contract.representationStates) ===
      JSON.stringify(base.representationStates),
    "0.2 changed the immutable 0.1 representation states",
    errors,
  );
  check(
    JSON.stringify(contract.routes.slice(0, base.routes.length)) ===
      JSON.stringify(base.routes),
    "0.2 changed an immutable 0.1 route",
    errors,
  );
  check(
    JSON.stringify(contract.globalInvariants.slice(0, base.globalInvariants.length)) ===
      JSON.stringify(base.globalInvariants),
    "0.2 changed an immutable 0.1 global invariant",
    errors,
  );

  await Promise.all([
    verifyReceipt(contract.buildInputs.baseContract, "0.1 base input", errors),
    verifyReceipt(contract.buildInputs.dorsalHornRoutePack, "dorsal-horn route-pack input", errors),
  ]);

  const appended = contract.routes.slice(base.routes.length);
  for (let index = 0; index < routePack.routes.length; index += 1) {
    const sourceRoute = routePack.routes[index];
    const route = appended[index];
    const expectedStates = expectedStatesForRoutePackEntry(sourceRoute);
    const hasDiameter = sourceRoute.geometryReceipt.sourceDiameterAvailable;
    check(route.routeId === sourceRoute.routeId, `${sourceRoute.routeId} route ID drifted`, errors);
    check(route.label === sourceRoute.title, `${sourceRoute.routeId} evidence-aware label drifted`, errors);
    check(
      JSON.stringify(route.sourceReceipt) ===
        JSON.stringify(contract.buildInputs.dorsalHornRoutePack),
      `${sourceRoute.routeId} no longer cites the route-pack receipt`,
      errors,
    );
    check(
      route.sourceVersion === routePack.releaseId,
      `${sourceRoute.routeId} source version drifted`,
      errors,
    );
    check(
      route.sourceFrame === sourceRoute.geometryReceipt.sourceFrame,
      `${sourceRoute.routeId} source frame drifted`,
      errors,
    );
    check(
      route.stableIdAuthority === sourceRoute.sourceRecord.assetId,
      `${sourceRoute.routeId} stable-ID authority drifted`,
      errors,
    );
    check(
      JSON.stringify(route.representationStateIds) === JSON.stringify(expectedStates),
      `${sourceRoute.routeId} representation-state authority drifted`,
      errors,
    );
    check(
      route.renderedPrimitivePolicy ===
        (hasDiameter
          ? "checksum_verified_swc_or_source_radius_derivative_only"
          : "checksum_verified_swc_only_radius_surface_zero_primitives"),
      `${sourceRoute.routeId} rendered-primitive policy drifted`,
      errors,
    );
    check(route.cellMorphologyClaim === true, `${sourceRoute.routeId} lost its source-local morphology claim`, errors);
    check(
      sourceRoute.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0 &&
        route.missingLayerPolicy === "zero_primitives",
      `${sourceRoute.routeId} gained unsupported internal primitives`,
      errors,
    );
    check(
      route.crossSourceIdentityCount === 0 &&
        route.projectRegistrationCount === 0 &&
        sourceRoute.identityBoundary.crossSourceIdentityCount === 0 &&
        sourceRoute.identityBoundary.projectRegistrationCount === 0,
      `${sourceRoute.routeId} creates an unsupported join or registration`,
      errors,
    );
    if (!hasDiameter) {
      check(
        !route.representationStateIds.includes("DER_RADIUS_SURFACE"),
        `${sourceRoute.routeId} promoted placeholder radii into a surface`,
        errors,
      );
    }
  }

  const pdyn = appended.find((route) => route.routeId === "mouse.sc.pdyn_dorsal_horn.observed.nmo_104003");
  check(
    /PdynCre \/ AAV-eGFP, Sst2a-receptor-positive inhibitory interneuron/.test(
      pdyn?.label ?? "",
    ),
    "NMO 104003 corrected PdynCre/Sst2a-receptor identity label is missing",
    errors,
  );
  check(
    !/SST\/VGLUT2 neuron/i.test(pdyn?.label ?? ""),
    "NMO 104003 filename channels were promoted into a false cell identity",
    errors,
  );

  const internalRoute = contract.routes.find((route) => route.routeId === "internal_reference");
  check(
    internalRoute?.renderedPrimitivePolicy === "zero_primitives" &&
      JSON.stringify(internalRoute.representationStateIds) ===
        JSON.stringify(["UNAVAILABLE"]),
    "internal reference must remain UNAVAILABLE-only with zero primitives",
    errors,
  );

  const serialized = Buffer.from(
    serializeEvidenceAware3dRepresentationContract02(contract),
    "utf8",
  );
  if (contractOverride === null) {
    check(contractBytes.equals(built.bytes), "committed 0.2 bytes differ from deterministic builder output", errors);
  } else {
    check(serialized.equals(built.bytes), "0.2 contract differs from deterministic builder output", errors);
  }

  if (errors.length) {
    throw new Error(`Evidence-aware 3D representation 0.2 validation failed:\n- ${errors.join("\n- ")}`);
  }
  return {
    releaseId: contract.releaseId,
    stateCount: contract.representationStates.length,
    routeCount: contract.routes.length,
    baseRouteCount: base.routes.length,
    dorsalHornRouteCount: routePack.routes.length,
    sourceDiameterAvailableRouteCount: routePack.routes.filter(
      (route) => route.geometryReceipt.sourceDiameterAvailable,
    ).length,
    sourceNoDiameterRouteCount: routePack.routes.filter(
      (route) => !route.geometryReceipt.sourceDiameterAvailable,
    ).length,
    unavailableRoutePrimitiveCount: 0,
    crossSourceIdentityCount: contract.routes.reduce(
      (sum, route) => sum + route.crossSourceIdentityCount,
      0,
    ),
    projectRegistrationCount: contract.routes.reduce(
      (sum, route) => sum + route.projectRegistrationCount,
      0,
    ),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateEvidenceAware3dRepresentationContract02()
    .then((report) => {
      process.stdout.write(
        `Evidence-aware 3D contract 0.2 valid: ${report.stateCount} states, ${report.routeCount} routes (${report.dorsalHornRouteCount} dorsal-horn), ${report.sourceNoDiameterRouteCount} no-diameter fail-closed routes, ${report.unavailableRoutePrimitiveCount} unavailable-route primitives, ${report.projectRegistrationCount} REG.\n`,
      );
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
