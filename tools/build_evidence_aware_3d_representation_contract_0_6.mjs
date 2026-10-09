#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_PATH = path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.5.json");
const CHILD_PATH = path.join(ROOT, "data/census-child-observed-morphology-route-0.1.json");
const OUTPUT_PATH = path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.6.json");
const EXPECTED_BASE = Object.freeze({
  bytes: 23381,
  sha256: "94085465117e4cbc70763ea78f931cfb17d3f99c5dc907a3fe4556ef1063dbed",
});
const EXPECTED_ROUTE_ID = "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108978";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const receipt = (path, bytes) => ({ path: `/project/${path}`, bytes: bytes.byteLength, sha256: sha256(bytes) });
function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function serializeEvidenceAware3dRepresentationContract06(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

export async function buildEvidenceAware3dRepresentationContract06() {
  const [baseBytes, childBytes] = await Promise.all([readFile(BASE_PATH), readFile(CHILD_PATH)]);
  const base = JSON.parse(baseBytes.toString("utf8"));
  const child = JSON.parse(childBytes.toString("utf8"));
  const route = child.route;
  check(base.contractId === "evidence-aware-3d-representation-contract-0.5" && base.routes.length === 16, "unexpected 0.5 base contract");
  check(baseBytes.byteLength === EXPECTED_BASE.bytes && sha256(baseBytes) === EXPECTED_BASE.sha256, "immutable 0.5 base contract bytes drifted");
  check(child.contractId === "census-child-observed-morphology-route-0.1" && route.routeId === EXPECTED_ROUTE_ID, "unexpected NMO 108978 census-child route");
  check(route.censusMembership === true && route.frozenLensMembership === false, "NMO 108978 census/frozen-lens membership drifted");
  check(route.renderingContract.nativeSomaContours.lineLoopCount === 12 && route.renderingContract.nativeSomaContours.vertexCount === 2614, "NMO 108978 native contour detail drifted");
  check(route.renderingContract.nativeSomaContours.overlayWithStandardizedSwcAllowed === false && route.nativeDatContract.coordinateTransformToStandardizedSwcStatus === "not_established", "NMO 108978 cross-frame overlay became authorized");
  check(route.renderingContract.sameSpecimenInternalStructure.available === false && route.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount === 0, "NMO 108978 internal structures must remain unavailable");
  check(route.identityBoundary.crossSourceIdentityCount === 0 && route.identityBoundary.projectRegistrationCount === 0, "NMO 108978 identity or registration boundary drifted");

  const states = structuredClone(base.representationStates);
  states.push({
    id: "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP",
    label: "Observed source-native soma line loops",
    geometryAuthority: "OBS",
    meaning: "Exact checksum-verified ordered Neurolucida soma line traces in the original DAT source frame.",
    currentlyRendered: true,
    visualRule: "record-gated source-native line loops only; keep separate from standardized SWC unless a source-authorized transform exists",
    forbiddenClaim: "membrane, filled soma, surface, volume, DAT-to-SWC correspondence, cross-source identity or atlas registration",
  });

  const childReceipt = receipt("data/census-child-observed-morphology-route-0.1.json", childBytes);
  const routeContract = {
    routeId: route.routeId,
    label: route.title,
    sourceReceipt: structuredClone(childReceipt),
    sourceVersion: child.releaseId,
    sourceFrame: "multiple_source_local_frames_without_overlay",
    stableIdAuthority: route.sourceRecord.assetId,
    representationStateIds: ["OBS_SKELETON", "DER_RADIUS_SURFACE", "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP", "UNAVAILABLE"],
    renderedPrimitivePolicy: "checksum_verified_swc_and_source_radius_derivative_plus_separate_source_native_line_loops_no_cross_frame_overlay",
    cellMorphologyClaim: true,
    missingLayerPolicy: "zero_primitives",
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
    representationFrames: [
      {
        stateId: "OBS_SKELETON",
        sourceFrame: route.geometryReceipt.sourceFrame,
        path: route.sourceObjects.swc.path,
        bytes: route.sourceObjects.swc.bytes,
        sha256: route.sourceObjects.swc.sha256,
        overlayAllowed: false,
      },
      {
        stateId: "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP",
        sourceFrame: route.nativeDatContract.sourceFrame,
        path: route.sourceObjects.nativeContourGeometry.path,
        bytes: route.sourceObjects.nativeContourGeometry.bytes,
        sha256: route.sourceObjects.nativeContourGeometry.sha256,
        primitiveCount: route.renderingContract.nativeSomaContours.lineLoopCount,
        vertexCount: route.renderingContract.nativeSomaContours.vertexCount,
        overlayAllowed: false,
      },
    ],
  };
  const routes = [...structuredClone(base.routes), routeContract];
  check(routes.length === 17 && new Set(routes.map((candidate) => candidate.routeId)).size === 17, "0.6 output must contain 17 unique routes");

  const contract = {
    schemaVersion: "0.6.0",
    contractId: "evidence-aware-3d-representation-contract-0.6",
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.6.0",
    releasedAt: "2026-09-23",
    purpose: "Extend immutable representation 0.5 with the source-local NMO 108978 census-child route, its checksum-verified native soma line loops, and an explicit two-frame no-overlay boundary.",
    buildInputs: {
      baseContract: receipt("data/evidence-aware-3d-representation-contract-0.5.json", baseBytes),
      censusChildMorphologyRoute: childReceipt,
    },
    representationStates: states,
    routes,
    runtimeMetadataRequirements: [
      ...structuredClone(base.runtimeMetadataRequirements),
      "For a route with multiple source-local objects, carry a per-representation frame and checksum receipt; do not overlay coordinate frames without an independently authorized transform.",
    ],
    globalInvariants: [
      ...structuredClone(base.globalInvariants),
      "NMO 108978 is an existing member of the frozen 142-record census but is not in the five-record frozen morphology lens; its selectable child route adds no census row or cell-type denominator.",
      "The NMO 108978 standardized SWC and native DAT soma line loops occupy separate source-local frames. The 12-loop and 12-SWC-soma-point counts do not establish correspondence; there is no overlay, membrane, filled surface, volume, internal object, molecular join or atlas registration.",
    ],
  };
  return { contract, bytes: Buffer.from(serializeEvidenceAware3dRepresentationContract06(contract), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildEvidenceAware3dRepresentationContract06();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) check((await readFile(OUTPUT_PATH)).equals(built.bytes), "evidence-aware 3D contract 0.6 is stale; run builder with --write");
  process.stdout.write(`${JSON.stringify({ releaseId: built.contract.releaseId, stateCount: built.contract.representationStates.length, routeCount: built.contract.routes.length, bytes: built.bytes.byteLength, sha256: sha256(built.bytes), wrote: args.has("--write"), checked: args.has("--check") }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
