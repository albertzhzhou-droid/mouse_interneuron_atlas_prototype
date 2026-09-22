#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_CONTRACT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.3.json");
const ROUTE_PACK_PATH = path.join(PROJECT_ROOT, "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.4.json");

const EXPECTED_BASE_CONTRACT_ID = "evidence-aware-3d-representation-contract-0.3";
const EXPECTED_ROUTE_PACK_ID = "prp-dorsal-horn-observed-morphology-route-pack-0.1";
const EXPECTED_BASE_BYTES = 18496;
const EXPECTED_BASE_SHA256 = "00c464afc793b8853d176366ece708f993c89920dba4027789bc7e84d9b03aa6";
const EXPECTED_BASE_ROUTE_COUNT = 13;
const EXPECTED_ROUTE_PACK_COUNT = 2;
const EXPECTED_OUTPUT_ROUTE_COUNT = 15;

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
  check(radius?.available === true && radius.authority === "DERIVED_FROM_OBSERVED_RADIUS" && radius.representationStateId === "DER_RADIUS_SURFACE" && radius.membraneClaim === false && radius.measurementUse === "forbidden" && route.geometryReceipt?.sourceDiameterAvailable === true, `${route.routeId} radius authority disagrees with source evidence`);
  check(internals?.available === false && internals.authority === "UNAVAILABLE" && internals.representationStateId === "UNAVAILABLE" && internals.renderedPrimitiveCount === 0, `${route.routeId} must fail closed for same-specimen internal structure`);
  return ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"];
}

function deriveRoute(route, routePackReceipt, routePackReleaseId) {
  check(route.nativeDatContract?.parsed === false && route.nativeDatContract?.rendered === false, `${route.routeId} admits native DAT semantics`);
  check(route.nativeDatContract?.semanticObjectCountAdmitted === 0 && route.nativeDatContract?.renderedPrimitiveCount === 0, `${route.routeId} creates native DAT objects`);
  check(route.identityBoundary?.sameCellElectrophysiologyJoinStatus === "not_established", `${route.routeId} creates an exact electrophysiology join`);
  check(route.identityBoundary?.paperMentionsExactNeuronIdOrFilename === false, `${route.routeId} claims an article-level object key`);
  check(route.identityBoundary?.individualMolecularAssayClaim === false, `${route.routeId} promotes cohort context to an individual molecular assay`);
  check(route.identityBoundary?.crossSourceIdentityCount === 0 && route.identityBoundary?.projectRegistrationCount === 0, `${route.routeId} creates a cross-source identity or registration`);
  check(route.identityBoundary?.selectedSciEntityRelationship === "none" && route.identityBoundary?.molecularProfileRelationship === "none", `${route.routeId} creates an unsupported route relationship`);
  check(route.fidelityRecord?.axon?.completeAxon === false, `${route.routeId} claims a complete axon`);
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

export function serializeEvidenceAware3dRepresentationContract04(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

export async function buildEvidenceAware3dRepresentationContract04({
  baseContractPath = BASE_CONTRACT_PATH,
  routePackPath = ROUTE_PACK_PATH,
} = {}) {
  const [baseBytes, routePackBytes] = await Promise.all([readFile(baseContractPath), readFile(routePackPath)]);
  const base = JSON.parse(baseBytes.toString("utf8"));
  const routePack = JSON.parse(routePackBytes.toString("utf8"));

  check(base.contractId === EXPECTED_BASE_CONTRACT_ID && base.routes.length === EXPECTED_BASE_ROUTE_COUNT, "unexpected 0.3 base contract");
  check(baseBytes.byteLength === EXPECTED_BASE_BYTES && sha256(baseBytes) === EXPECTED_BASE_SHA256, "immutable 0.3 base contract bytes drifted");
  check(routePack.contractId === EXPECTED_ROUTE_PACK_ID && routePack.routes.length === EXPECTED_ROUTE_PACK_COUNT, "unexpected PrP dorsal-horn route pack");
  check(routePack.summary.nativeDatSemanticAdmissionCount === 0, "PrP route pack admits native DAT semantics");
  check(routePack.summary.sameCellElectrophysiologyJoinCount === 0, "PrP route pack creates exact physiology joins");
  check(routePack.summary.sameSpecimenInternalStructureCount === 0 && routePack.summary.renderedInternalPrimitiveCount === 0, "PrP route pack creates internal structures");
  check(routePack.summary.exactCrossSourceIdentityCount === 0 && routePack.summary.projectRegistrationCount === 0, "PrP route pack creates cross-source identities or registrations");
  check(routePack.summary.sourceCompleteAxonCount === 0, "PrP route pack claims complete axons");

  const baseReceipt = projectReceipt("data/evidence-aware-3d-representation-contract-0.3.json", baseBytes);
  const routePackReceipt = projectReceipt("data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json", routePackBytes);
  const routes = [
    ...structuredClone(base.routes),
    ...routePack.routes.map((route) => deriveRoute(route, routePackReceipt, routePack.releaseId)),
  ];
  check(routes.length === EXPECTED_OUTPUT_ROUTE_COUNT, "0.4 output must contain exactly 15 routes");
  check(new Set(routes.map((route) => route.routeId)).size === routes.length, "0.4 output route IDs must be unique");

  const contract = {
    schemaVersion: "0.4.0",
    contractId: "evidence-aware-3d-representation-contract-0.4",
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.4.0",
    releasedAt: "2026-08-31",
    purpose: "Extend the immutable 0.3 evidence-state contract with exact nNOS-positive and galanin-positive PrP-promoter-reporter source-local routes while preserving marker, preparation-stage, native-DAT, exact-physiology, internal-detail, identity, and registration boundaries.",
    buildInputs: {
      baseContract: baseReceipt,
      prpDorsalHornRoutePack: routePackReceipt,
    },
    representationStates: structuredClone(base.representationStates),
    routes,
    runtimeMetadataRequirements: structuredClone(base.runtimeMetadataRequirements),
    globalInvariants: [
      ...structuredClone(base.globalInvariants),
      "Each added PrP-promoter-reporter route remains one independent exact source-local reconstruction; admission creates no average cell, marker-negative inference, selected-SCI-entity identity, cross-source molecular identity, prevalence estimate, or atlas registration.",
      "PrP-promoter-positive reporter wording does not establish endogenous PrP protein abundance, individual genotype validation, receptor distribution, or any unreported molecular state.",
      "The 300-micrometre source slice and later 60-micrometre serial resection are distinct preparation stages and cannot be collapsed into one object-level thickness claim without an exact filename crosswalk.",
      "For both added routes, source-native DAT contributes zero semantic objects, paper physiology contributes zero exact object joins, and missing same-specimen internals contribute zero rendered primitives.",
    ],
  };
  return { contract, bytes: Buffer.from(serializeEvidenceAware3dRepresentationContract04(contract), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildEvidenceAware3dRepresentationContract04();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "evidence-aware 3D contract 0.4 is stale; run builder with --write");
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
