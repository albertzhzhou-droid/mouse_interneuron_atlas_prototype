#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_CONTRACT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.4.json");
const ROUTE_PACK_PATH = path.join(PROJECT_ROOT, "data/premotor-comparison-observed-morphology-route-pack-0.1.json");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/evidence-aware-3d-representation-contract-0.5.json");

const EXPECTED_BASE_BYTES = 21341;
const EXPECTED_BASE_SHA256 = "1dec67e67884199a481ce8127793523acf56d0d50df83cfe330e933c8260e392";
const EXPECTED_ROUTE_PACK_ID = "premotor-comparison-observed-morphology-route-pack-0.1";
const EXPECTED_ROUTE_ID = "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718";

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

function deriveRoute(route, sourceReceipt, sourceVersion) {
  const observed = route.renderingContract?.observedSwc;
  const radius = route.renderingContract?.radiusSurface;
  const internals = route.renderingContract?.sameSpecimenInternalStructure;
  check(route.routeId === EXPECTED_ROUTE_ID, "premotor comparison route ID drifted");
  check(observed?.available === true && observed.representationStateId === "OBS_SKELETON", "premotor comparison route lacks an observed skeleton");
  check(radius?.available === true && radius.authority === "DERIVED_FROM_OBSERVED_RADIUS" && radius.representationStateId === "DER_RADIUS_SURFACE" && radius.membraneClaim === false && radius.measurementUse === "forbidden", "premotor comparison radius authority drifted");
  check(internals?.available === false && internals.authority === "UNAVAILABLE" && internals.representationStateId === "UNAVAILABLE" && internals.renderedPrimitiveCount === 0, "premotor comparison route must fail closed for internals");
  check(route.nativeDatContract?.parsed === false && route.nativeDatContract?.rendered === false && route.nativeDatContract?.semanticObjectCountAdmitted === 0, "premotor comparison route admits native DAT semantics");
  check(route.identityBoundary?.paperMentionsExactNeuronIdOrFilename === false && route.identityBoundary?.sameCellElectrophysiologyJoinStatus === "not_established", "premotor comparison route creates an exact paper or physiology join");
  check(route.identityBoundary?.individualMolecularAssayClaim === false && route.identityBoundary?.crossSourceIdentityCount === 0 && route.identityBoundary?.projectRegistrationCount === 0, "premotor comparison route creates a molecular identity, cross-source join or registration");
  check(route.fidelityRecord?.axon?.completeAxon === false, "premotor comparison route claims a complete axon");
  check(route.somaStandardizationReceipt?.originalContourCount === 8 && route.somaStandardizationReceipt?.standardizedSomaPointCount === 8 && route.somaStandardizationReceipt?.membraneClaim === false, "premotor comparison soma standardization receipt drifted");
  return {
    routeId: route.routeId,
    label: route.title,
    sourceReceipt: structuredClone(sourceReceipt),
    sourceVersion,
    sourceFrame: route.geometryReceipt.sourceFrame,
    stableIdAuthority: route.sourceRecord.assetId,
    representationStateIds: ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"],
    renderedPrimitivePolicy: "checksum_verified_swc_or_source_radius_derivative_only_native_dat_zero_semantics",
    cellMorphologyClaim: true,
    missingLayerPolicy: "zero_primitives",
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  };
}

export function serializeEvidenceAware3dRepresentationContract05(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

export async function buildEvidenceAware3dRepresentationContract05({
  baseContractPath = BASE_CONTRACT_PATH,
  routePackPath = ROUTE_PACK_PATH,
} = {}) {
  const [baseBytes, routePackBytes] = await Promise.all([readFile(baseContractPath), readFile(routePackPath)]);
  const base = JSON.parse(baseBytes.toString("utf8"));
  const routePack = JSON.parse(routePackBytes.toString("utf8"));
  check(base.contractId === "evidence-aware-3d-representation-contract-0.4" && base.routes.length === 15, "unexpected 0.4 base contract");
  check(baseBytes.byteLength === EXPECTED_BASE_BYTES && sha256(baseBytes) === EXPECTED_BASE_SHA256, "immutable 0.4 base contract bytes drifted");
  check(routePack.contractId === EXPECTED_ROUTE_PACK_ID && routePack.routes.length === 1, "unexpected premotor comparison route pack");
  check(routePack.summary.nativeDatSemanticAdmissionCount === 0 && routePack.summary.sameCellElectrophysiologyJoinCount === 0, "premotor comparison pack admits DAT semantics or exact physiology");
  check(routePack.summary.sameSpecimenInternalStructureCount === 0 && routePack.summary.renderedInternalPrimitiveCount === 0, "premotor comparison pack creates internal structures");
  check(routePack.summary.exactCrossSourceIdentityCount === 0 && routePack.summary.projectRegistrationCount === 0 && routePack.summary.sourceCompleteAxonCount === 0, "premotor comparison pack creates identity, registration or complete axon claims");

  const baseReceipt = projectReceipt("data/evidence-aware-3d-representation-contract-0.4.json", baseBytes);
  const routePackReceipt = projectReceipt("data/premotor-comparison-observed-morphology-route-pack-0.1.json", routePackBytes);
  const routes = [
    ...structuredClone(base.routes),
    deriveRoute(routePack.routes[0], routePackReceipt, routePack.releaseId),
  ];
  check(routes.length === 16 && new Set(routes.map((route) => route.routeId)).size === 16, "0.5 output must contain 16 unique routes");

  const contract = {
    schemaVersion: "0.5.0",
    contractId: "evidence-aware-3d-representation-contract-0.5",
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.5.0",
    releasedAt: "2026-08-31",
    purpose: "Extend the immutable 0.4 evidence-state contract with exact NMO 45718 as a repository-labelled, source-local ventral-horn comparison route while preserving label, preparation, shrinkage, native-DAT, physiology, internal-detail, identity and registration boundaries.",
    buildInputs: {
      baseContract: baseReceipt,
      premotorComparisonRoutePack: routePackReceipt,
    },
    representationStates: structuredClone(base.representationStates),
    routes,
    runtimeMetadataRequirements: structuredClone(base.runtimeMetadataRequirements),
    globalInvariants: [
      ...structuredClone(base.globalInvariants),
      "NMO 45718 remains one independent source-local reconstruction. Repository labels calbindin-negative, glycinergic, pre-motor and non-renshaw are never upgraded into a paper-keyed molecular assay, definitive premotor identity or Renshaw exclusion.",
      "The SWC header documents eight original soma contours averaged into eight standardized type-1 points; this is a standardization receipt, not native contour geometry, an observed membrane, a nucleus or a volumetric soma.",
      "Raw repository slicing fields, paper recording/resection stages, source-local SWC axes, PCA morphometry and uncorrected shrinkage remain distinct and cannot create tissue thickness, anatomical axes, atlas placement or in-vivo dimensions.",
      "For the added route, native DAT contributes zero semantic objects, paper physiology contributes zero exact object joins, moderate axon integrity creates no complete-arbor claim, and missing same-specimen internals contribute zero rendered primitives.",
    ],
  };
  return { contract, bytes: Buffer.from(serializeEvidenceAware3dRepresentationContract05(contract), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildEvidenceAware3dRepresentationContract05();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) {
    const committed = await readFile(OUTPUT_PATH);
    check(committed.equals(built.bytes), "evidence-aware 3D contract 0.5 is stale; run builder with --write");
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
