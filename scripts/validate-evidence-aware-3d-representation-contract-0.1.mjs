#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/evidence-aware-3d-representation-contract-0.1.schema.json");

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function receiptPath(receipt) {
  if (receipt.path.startsWith("/project/")) return path.join(PROJECT_ROOT, receipt.path.slice("/project/".length));
  if (receipt.path.startsWith("/data/")) return path.join(PROJECT_ROOT, "public/data", receipt.path.slice("/data/".length));
  throw new Error(`Unsupported receipt root: ${receipt.path}`);
}

export async function validateEvidenceAware3dRepresentationContract(contractOverride = null) {
  const [contract, schema, sceneSource, morphologySource] = await Promise.all([
    contractOverride ?? readFile(CONTRACT_PATH, "utf8").then(JSON.parse),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(path.join(PROJECT_ROOT, "app/SceneCanvas.tsx"), "utf8"),
    readFile(path.join(PROJECT_ROOT, "app/source-local-morphology-geometry.js"), "utf8"),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(contract)) {
    throw new Error(`Evidence-aware representation schema validation failed:\n${(validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n")}`);
  }

  const errors = [];
  const expectedStateIds = ["OBS_RAW_TEXTURE", "OBS_SEGMENTED_SURFACE", "OBS_SKELETON", "OBS_POINT", "DER_RADIUS_SURFACE", "INF_REFERENCE_GEOMETRY", "SCH_PATH", "SYN_DATA_GLYPH", "UNAVAILABLE"];
  const expectedRouteIds = ["main.reference_anatomy", "main.population_evidence", "main.legacy_observed_cell_forms", "mouse.sc.grp_dorsal_horn.observed.nmo_109021", "microns_observed_reference", "internal_reference", "ronzano_premotor_positions"];
  const expectedRuntimeMetadataRequirements = ["stableId", "representationState", "sourceFrame", "sourceVersion", "sourceReceiptSha256", "cellMorphologyClaim", "projectRegistrationCount", "crossSourceIdentityCount"];
  check(JSON.stringify(contract.representationStates.map((state) => state.id)) === JSON.stringify(expectedStateIds), "representation state IDs or order drifted", errors);
  check(JSON.stringify(contract.routes.map((route) => route.routeId)) === JSON.stringify(expectedRouteIds), "representation route IDs or order drifted", errors);
  check(JSON.stringify(contract.runtimeMetadataRequirements) === JSON.stringify(expectedRuntimeMetadataRequirements), "runtime metadata requirements drifted", errors);
  const stateIds = new Set(contract.representationStates.map((state) => state.id));
  for (const route of contract.routes) {
    const bytes = await readFile(receiptPath(route.sourceReceipt));
    check(bytes.byteLength === route.sourceReceipt.bytes, `${route.routeId} source byte count drifted`, errors);
    check(digest(bytes) === route.sourceReceipt.sha256, `${route.routeId} source SHA-256 drifted`, errors);
    check(route.representationStateIds.every((id) => stateIds.has(id)), `${route.routeId} references an unknown representation state`, errors);
    check(route.crossSourceIdentityCount === 0 && route.projectRegistrationCount === 0, `${route.routeId} creates an unsupported join or registration`, errors);
  }

  const unavailable = contract.representationStates.find((state) => state.id === "UNAVAILABLE");
  check(unavailable.visualRule === "zero primitives plus explicit missingness text", "UNAVAILABLE visual rule must remain zero primitives", errors);
  const internalRoute = contract.routes.find((route) => route.routeId === "internal_reference");
  check(internalRoute.renderedPrimitivePolicy === "zero_primitives", "internal reference must render zero primitives", errors);
  check(JSON.stringify(internalRoute.representationStateIds) === JSON.stringify(["UNAVAILABLE"]), "internal reference must remain UNAVAILABLE-only", errors);

  const internalFactory = sceneSource.slice(
    sceneSource.indexOf("function createCrossRegionInternalReferenceObject"),
    sceneSource.indexOf("function assertMicronsAssetManifest"),
  );
  check(!/new THREE\.(?:Icosahedron|Sphere|Capsule|Tube|Box|Torus)Geometry/.test(internalFactory), "internal reference contains a prohibited procedural geometry proxy", errors);
  check(/renderedPrimitiveCount: crossRegionInternalReference\.renderedPrimitiveCount/.test(internalFactory), "internal reference runtime metadata lacks renderedPrimitiveCount", errors);
  check(/representationKind: "non-cell-population-evidence-node"/.test(sceneSource), "population glyph semantic is missing", errors);
  check(/cellMorphologyClaim: false/.test(sceneSource), "non-cell runtime metadata boundary is missing", errors);
  check(/representation: "observed_standardized_swc_centerlines"/.test(morphologySource), "OBS skeleton semantic is missing", errors);
  check(/representation: RADIUS_SURFACE_REPRESENTATION/.test(morphologySource), "DER radius-surface semantic is missing", errors);
  check(/membraneClaim: false/.test(morphologySource), "radius-surface membrane boundary is missing", errors);
  check(/authority: "OBS_EM_SEGMENTATION"/.test(sceneSource), "OBS segmented-surface semantic is missing", errors);
  check(/sourceObjectId: componentName/.test(sceneSource), "MICrONS stable object ID metadata is missing", errors);

  if (errors.length) throw new Error(`Evidence-aware 3D representation validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    stateCount: contract.representationStates.length,
    routeCount: contract.routes.length,
    unavailableRoutePrimitiveCount: 0,
    crossSourceIdentityCount: contract.routes.reduce((sum, route) => sum + route.crossSourceIdentityCount, 0),
    projectRegistrationCount: contract.routes.reduce((sum, route) => sum + route.projectRegistrationCount, 0),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateEvidenceAware3dRepresentationContract()
    .then((report) => process.stdout.write(`Evidence-aware 3D contract valid: ${report.stateCount} states, ${report.routeCount} routes, ${report.unavailableRoutePrimitiveCount} unavailable-route primitives, ${report.projectRegistrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
