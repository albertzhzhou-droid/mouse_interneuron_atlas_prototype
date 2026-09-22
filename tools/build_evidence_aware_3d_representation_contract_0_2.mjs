#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_CONTRACT_PATH = path.join(
  PROJECT_ROOT,
  "data/evidence-aware-3d-representation-contract-0.1.json",
);
const ROUTE_PACK_PATH = path.join(
  PROJECT_ROOT,
  "data/dorsal-horn-observed-morphology-route-pack-0.1.json",
);
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "data/evidence-aware-3d-representation-contract-0.2.json",
);

const EXPECTED_BASE_CONTRACT_ID = "evidence-aware-3d-representation-contract-0.1";
const EXPECTED_ROUTE_PACK_ID = "dorsal-horn-observed-morphology-route-pack-0.1";
const EXPECTED_BASE_ROUTE_COUNT = 7;
const EXPECTED_ROUTE_PACK_COUNT = 4;
const EXPECTED_OUTPUT_ROUTE_COUNT = 11;

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
  const states = [];
  const observed = route.renderingContract?.observedSwc;
  const radius = route.renderingContract?.radiusSurface;
  const internals = route.renderingContract?.sameSpecimenInternalStructure;

  check(
    observed?.available === true && observed.representationStateId === "OBS_SKELETON",
    `${route.routeId} must expose an observed SWC skeleton`,
  );
  states.push("OBS_SKELETON");

  if (radius?.available === true) {
    check(
      radius.authority === "DERIVED_FROM_OBSERVED_RADIUS" &&
        radius.representationStateId === "DER_RADIUS_SURFACE" &&
        route.geometryReceipt?.sourceDiameterAvailable === true,
      `${route.routeId} radius-surface authority disagrees with source diameter evidence`,
    );
    states.push("DER_RADIUS_SURFACE");
  } else {
    check(
      radius?.authority === "UNAVAILABLE" &&
        radius.representationStateId === "UNAVAILABLE" &&
        route.geometryReceipt?.sourceDiameterAvailable === false,
      `${route.routeId} unavailable radius surface disagrees with source diameter evidence`,
    );
  }

  check(
    internals?.available === false &&
      internals.authority === "UNAVAILABLE" &&
      internals.representationStateId === "UNAVAILABLE" &&
      internals.renderedPrimitiveCount === 0,
    `${route.routeId} must fail closed for same-specimen internal structure`,
  );
  states.push("UNAVAILABLE");
  return states;
}

function deriveRoute(route, routePackReceipt, routePackReleaseId) {
  check(route.identityBoundary?.crossSourceIdentityCount === 0, `${route.routeId} creates a cross-source identity`);
  check(route.identityBoundary?.projectRegistrationCount === 0, `${route.routeId} creates a project registration`);
  check(route.identityBoundary?.selectedSciEntityRelationship === "none", `${route.routeId} creates a selected-entity relationship`);
  check(route.identityBoundary?.molecularProfileRelationship === "none", `${route.routeId} creates a molecular-profile relationship`);

  const sourceDiameterAvailable = route.geometryReceipt.sourceDiameterAvailable;
  return {
    routeId: route.routeId,
    label: route.title,
    sourceReceipt: structuredClone(routePackReceipt),
    sourceVersion: routePackReleaseId,
    sourceFrame: route.geometryReceipt.sourceFrame,
    stableIdAuthority: route.sourceRecord.assetId,
    representationStateIds: deriveRepresentationStateIds(route),
    renderedPrimitivePolicy: sourceDiameterAvailable
      ? "checksum_verified_swc_or_source_radius_derivative_only"
      : "checksum_verified_swc_only_radius_surface_zero_primitives",
    cellMorphologyClaim: true,
    missingLayerPolicy: "zero_primitives",
    crossSourceIdentityCount: route.identityBoundary.crossSourceIdentityCount,
    projectRegistrationCount: route.identityBoundary.projectRegistrationCount,
  };
}

export function serializeEvidenceAware3dRepresentationContract02(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

export async function buildEvidenceAware3dRepresentationContract02({
  baseContractPath = BASE_CONTRACT_PATH,
  routePackPath = ROUTE_PACK_PATH,
} = {}) {
  const [baseBytes, routePackBytes] = await Promise.all([
    readFile(baseContractPath),
    readFile(routePackPath),
  ]);
  const base = JSON.parse(baseBytes.toString("utf8"));
  const routePack = JSON.parse(routePackBytes.toString("utf8"));

  check(base.contractId === EXPECTED_BASE_CONTRACT_ID, "unexpected 0.1 base contract");
  check(base.routes.length === EXPECTED_BASE_ROUTE_COUNT, "0.1 base route count drifted");
  check(routePack.contractId === EXPECTED_ROUTE_PACK_ID, "unexpected dorsal-horn route pack");
  check(routePack.routes.length === EXPECTED_ROUTE_PACK_COUNT, "dorsal-horn route-pack count drifted");

  const baseReceipt = projectReceipt(
    "data/evidence-aware-3d-representation-contract-0.1.json",
    baseBytes,
  );
  const routePackReceipt = projectReceipt(
    "data/dorsal-horn-observed-morphology-route-pack-0.1.json",
    routePackBytes,
  );
  const routes = [
    ...structuredClone(base.routes),
    ...routePack.routes.map((route) => deriveRoute(route, routePackReceipt, routePack.releaseId)),
  ];
  check(routes.length === EXPECTED_OUTPUT_ROUTE_COUNT, "0.2 output must contain exactly 11 routes");
  check(new Set(routes.map((route) => route.routeId)).size === routes.length, "0.2 output route IDs must be unique");

  const contract = {
    schemaVersion: "0.2.0",
    contractId: "evidence-aware-3d-representation-contract-0.2",
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.2.0",
    releasedAt: "2026-08-31",
    purpose: "Extend the immutable 0.1 evidence-state contract with four independent source-local dorsal-horn NeuroMorpho routes while preserving exact identity, diameter authority and zero-primitive missing-layer boundaries.",
    buildInputs: {
      baseContract: baseReceipt,
      dorsalHornRoutePack: routePackReceipt,
    },
    representationStates: structuredClone(base.representationStates),
    routes,
    runtimeMetadataRequirements: structuredClone(base.runtimeMetadataRequirements),
    globalInvariants: [
      ...structuredClone(base.globalInvariants),
      "Each dorsal-horn route-pack route remains an independent source-local reconstruction; admission creates no average cell, selected-SCI-entity identity, cross-source molecular identity or atlas registration.",
      "Standardized soma points produced by contour averaging are display proxies, never native contour vertices, membranes or volumetric soma segmentations.",
    ],
  };
  return {
    contract,
    bytes: Buffer.from(serializeEvidenceAware3dRepresentationContract02(contract), "utf8"),
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");

  const built = await buildEvidenceAware3dRepresentationContract02();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "evidence-aware 3D contract 0.2 is stale; run builder with --write");
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
