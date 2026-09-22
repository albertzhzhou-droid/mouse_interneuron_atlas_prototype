#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_CONTRACT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.2.json");
const ROUTE_PACK_PATH = path.join(PROJECT_ROOT, "data/functional-class-observed-morphology-route-pack-0.1.json");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.3.json");

const EXPECTED_BASE_CONTRACT_ID = "evidence-aware-3d-representation-contract-0.2";
const EXPECTED_ROUTE_PACK_ID = "functional-class-observed-morphology-route-pack-0.1";
const EXPECTED_BASE_ROUTE_COUNT = 11;
const EXPECTED_ROUTE_PACK_COUNT = 2;
const EXPECTED_OUTPUT_ROUTE_COUNT = 13;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function projectReceipt(projectRelativePath, bytes) {
  return {
    path: `/project/${projectRelativePath}`,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  };
}

function deriveRepresentationStateIds(route) {
  const observed = route.renderingContract?.observedSwc;
  const radius = route.renderingContract?.radiusSurface;
  const internals = route.renderingContract?.sameSpecimenInternalStructure;
  check(observed?.available === true && observed.representationStateId === "OBS_SKELETON", `${route.routeId} must expose an observed SWC skeleton`);
  check(radius?.available === true && radius.authority === "DERIVED_FROM_OBSERVED_RADIUS" && radius.representationStateId === "DER_RADIUS_SURFACE" && route.geometryReceipt?.sourceDiameterAvailable === true, `${route.routeId} radius authority disagrees with source evidence`);
  check(internals?.available === false && internals.authority === "UNAVAILABLE" && internals.representationStateId === "UNAVAILABLE" && internals.renderedPrimitiveCount === 0, `${route.routeId} must fail closed for same-specimen internal structure`);
  return ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"];
}

function deriveRoute(route, routePackReceipt, routePackReleaseId) {
  check(route.nativeDatContract?.parsed === false && route.nativeDatContract?.rendered === false, `${route.routeId} admits native DAT semantics`);
  check(route.nativeDatContract?.semanticObjectCountAdmitted === 0 && route.nativeDatContract?.renderedPrimitiveCount === 0, `${route.routeId} creates native DAT objects`);
  check(route.identityBoundary?.sameCellElectrophysiologyJoinStatus === "not_established", `${route.routeId} creates an exact electrophysiology join`);
  check(route.identityBoundary?.paperMentionsExactNeuronIdOrFilename === false, `${route.routeId} claims an article-level object key`);
  check(route.identityBoundary?.crossSourceIdentityCount === 0 && route.identityBoundary?.projectRegistrationCount === 0, `${route.routeId} creates a cross-source identity or registration`);
  check(route.identityBoundary?.selectedSciEntityRelationship === "none" && route.identityBoundary?.molecularProfileRelationship === "none", `${route.routeId} creates an unsupported route relationship`);
  return {
    routeId: route.routeId,
    label: route.title,
    sourceReceipt: structuredClone(routePackReceipt),
    sourceVersion: routePackReleaseId,
    sourceFrame: route.geometryReceipt.sourceFrame,
    stableIdAuthority: route.sourceRecord.assetId,
    representationStateIds: deriveRepresentationStateIds(route),
    renderedPrimitivePolicy: "checksum_verified_swc_or_source_radius_derivative_only_native_dat_zero_semantics",
    cellMorphologyClaim: true,
    missingLayerPolicy: "zero_primitives",
    crossSourceIdentityCount: route.identityBoundary.crossSourceIdentityCount,
    projectRegistrationCount: route.identityBoundary.projectRegistrationCount,
  };
}

export function serializeEvidenceAware3dRepresentationContract03(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

export async function buildEvidenceAware3dRepresentationContract03({
  baseContractPath = BASE_CONTRACT_PATH,
  routePackPath = ROUTE_PACK_PATH,
} = {}) {
  const [baseBytes, routePackBytes] = await Promise.all([readFile(baseContractPath), readFile(routePackPath)]);
  const base = JSON.parse(baseBytes.toString("utf8"));
  const routePack = JSON.parse(routePackBytes.toString("utf8"));
  check(base.contractId === EXPECTED_BASE_CONTRACT_ID && base.routes.length === EXPECTED_BASE_ROUTE_COUNT, "unexpected 0.2 base contract");
  check(routePack.contractId === EXPECTED_ROUTE_PACK_ID && routePack.routes.length === EXPECTED_ROUTE_PACK_COUNT, "unexpected functional-class route pack");
  check(routePack.summary.nativeDatSemanticAdmissionCount === 0 && routePack.summary.sameCellElectrophysiologyJoinCount === 0, "functional-class route pack does not fail closed");

  const baseReceipt = projectReceipt("data/evidence-aware-3d-representation-contract-0.2.json", baseBytes);
  const routePackReceipt = projectReceipt("data/functional-class-observed-morphology-route-pack-0.1.json", routePackBytes);
  const routes = [
    ...structuredClone(base.routes),
    ...routePack.routes.map((route) => deriveRoute(route, routePackReceipt, routePack.releaseId)),
  ];
  check(routes.length === EXPECTED_OUTPUT_ROUTE_COUNT, "0.3 output must contain exactly 13 routes");
  check(new Set(routes.map((route) => route.routeId)).size === routes.length, "0.3 output route IDs must be unique");

  const contract = {
    schemaVersion: "0.3.0",
    contractId: "evidence-aware-3d-representation-contract-0.3",
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.3.0",
    releasedAt: "2026-08-31",
    purpose: "Extend the immutable 0.2 evidence-state contract with exact Renshaw and NPY-positive source-local routes while preserving preparation conflicts, PCA-morphometry boundaries, native-DAT non-admission, exact-physiology non-joins, and zero-primitive internal-detail absence.",
    buildInputs: {
      baseContract: baseReceipt,
      functionalClassRoutePack: routePackReceipt,
    },
    representationStates: structuredClone(base.representationStates),
    routes,
    runtimeMetadataRequirements: structuredClone(base.runtimeMetadataRequirements),
    globalInvariants: [
      ...structuredClone(base.globalInvariants),
      "Bundled source-native DAT bytes are provenance receipts only: without a validated parser and object dictionary they contribute zero admitted semantic objects and zero rendered primitives.",
      "Paper-level electrophysiology cannot be assigned to a deposited morphology unless the article or an official source exposes an exact object key; neither added route passes that join gate.",
      "Repository 95-percent PCA morphometry is distinct from raw standardized-SWC bounds, anatomical axes, and atlas registration.",
      "Repository-versus-paper preparation, strain, and weight conflicts remain explicit and cannot be silently normalized for display.",
    ],
  };
  return { contract, bytes: Buffer.from(serializeEvidenceAware3dRepresentationContract03(contract), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildEvidenceAware3dRepresentationContract03();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "evidence-aware 3D contract 0.3 is stale; run builder with --write");
  }
  process.stdout.write(`${JSON.stringify({
    releaseId: built.contract.releaseId,
    stateCount: built.contract.representationStates.length,
    routeCount: built.contract.routes.length,
    bytes: built.bytes.byteLength,
    sha256: sha256(built.bytes),
    wrote: args.has("--write"),
    checked: args.has("--check"),
  }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
