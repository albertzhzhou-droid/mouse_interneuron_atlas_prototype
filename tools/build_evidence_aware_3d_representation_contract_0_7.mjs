#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateNeuromorphoRelease126ToddNtsRoutePack01 } from "../scripts/validate-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_PATH = path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.6.json");
const ROUTE_PACK_PATH = path.join(ROOT, "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json");
const OUTPUT_PATH = path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.7.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const receipt = (path, bytes) => ({ path: `/project/${path}`, bytes: bytes.byteLength, sha256: sha256(bytes) });
const check = (condition, message) => { if (!condition) throw new Error(message); };

export function serializeEvidenceAware3dRepresentationContract07(contract) {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

export async function buildEvidenceAware3dRepresentationContract07() {
  const [baseBytes, routePackBytes] = await Promise.all([readFile(BASE_PATH), readFile(ROUTE_PACK_PATH)]);
  await validateNeuromorphoRelease126ToddNtsRoutePack01();
  const base = JSON.parse(baseBytes.toString("utf8"));
  const pack = JSON.parse(routePackBytes.toString("utf8"));
  check(base.contractId === "evidence-aware-3d-representation-contract-0.6" && base.routes.length === 17, "unexpected immutable 0.6 base contract");
  check(pack.releaseId === "ohri-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.0" && pack.routes.length === 30, "unexpected Todd NTS route pack");

  const routePackReceipt = receipt("data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json", routePackBytes);
  const appended = pack.routes.map((route) => {
    const hasDiameter = route.sourceRecord.sourceAttributes.startsWith("Diameter,");
    const stateIds = ["OBS_SKELETON", ...(hasDiameter ? ["DER_RADIUS_SURFACE"] : []), "UNAVAILABLE"];
    return {
      routeId: route.routeId,
      label: route.title,
      sourceReceipt: structuredClone(routePackReceipt),
      sourceVersion: pack.releaseId,
      sourceFrame: route.sourceRecord.sourceFrame,
      stableIdAuthority: route.sourceRecord.assetId,
      representationStateIds: stateIds,
      renderedPrimitivePolicy: hasDiameter
        ? "exact_source_local_standardized_swc_centerlines_and_source_radius_derived_open_frusta_no_internal_primitives"
        : "exact_source_local_standardized_swc_centerlines_only_no_radius_surface_or_internal_primitives",
      cellMorphologyClaim: true,
      missingLayerPolicy: "zero_primitives",
      crossSourceIdentityCount: 0,
      projectRegistrationCount: 0,
      representationFrames: [
        {
          stateId: "OBS_SKELETON",
          sourceFrame: route.sourceRecord.sourceFrame,
          path: route.sourceObjects.geometry.path,
          bytes: route.sourceObjects.geometry.bytes,
          sha256: route.sourceObjects.geometry.sha256,
          sourceSwc: {
            path: route.sourceObjects.swc.path,
            bytes: route.sourceObjects.swc.bytes,
            sha256: route.sourceObjects.swc.sha256,
          },
          overlayAllowed: false,
        },
      ],
    };
  });
  check(appended.length === 30 && new Set(appended.map((route) => route.routeId)).size === 30, "0.7 must append 30 unique source routes");
  check(appended.filter((route) => route.representationStateIds.includes("DER_RADIUS_SURFACE")).length === 10, "Only the ten diameter-authorized routes may expose a radius-derived state");

  const contract = {
    schemaVersion: "0.7.0",
    contractId: "evidence-aware-3d-representation-contract-0.7",
    releaseId: "ohri-evidence-aware-3d-representation-contract-0.7.0",
    releasedAt: "2026-09-23",
    purpose: "Extend immutable representation 0.6 with exact per-record representation permissions for the thirty source-local NeuroMorpho 8.6.126 Todd interneuron reconstructions.",
    buildInputs: {
      baseContract: receipt("data/evidence-aware-3d-representation-contract-0.6.json", baseBytes),
      neuromorphoToddNtsRoutePack: routePackReceipt,
    },
    representationStates: structuredClone(base.representationStates),
    routes: [...structuredClone(base.routes), ...appended],
    runtimeMetadataRequirements: [
      ...structuredClone(base.runtimeMetadataRequirements),
      "A source-local supplementary morphology route must resolve to an exact route-specific checksum receipt; do not fall back to another cell when its payload is unavailable.",
      "Render a radius-derived state only when the exact source record explicitly reports diameter; otherwise use source-local centerlines with constant viewer stroke only.",
    ],
    globalInvariants: [
      ...structuredClone(base.globalInvariants),
      "The thirty NMO 322379–322408 routes are supplementary source-local Todd reconstructions and add zero records to the frozen 1,097-record 8.6.124 query denominator.",
      "NMO 322379–322408 have no verified per-record original-paper, animal, figure or lamina crosswalk; the candidate neurotensin study is context only and creates no same-cell or molecular identity.",
      "Ten NMO 322379–322408 records explicitly report source diameter and may show only radius-derived open frusta; twenty do not report diameter and remain centerline-only. All thirty have zero internal primitives, cross-source identities and project registrations.",
      "Source-repository morphology completeness labels do not independently establish biological reconstruction completeness; original Neurolucida files and standardization logs are unavailable in this route pack.",
    ],
  };
  return { contract, bytes: Buffer.from(serializeEvidenceAware3dRepresentationContract07(contract), "utf8") };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) check(arg === "--write" || arg === "--check", `unknown argument: ${arg}`);
  check(!(args.has("--write") && args.has("--check")), "--write and --check are mutually exclusive");
  const built = await buildEvidenceAware3dRepresentationContract07();
  if (args.has("--write")) await writeFile(OUTPUT_PATH, built.bytes);
  if (args.has("--check")) check((await readFile(OUTPUT_PATH)).equals(built.bytes), "evidence-aware 3D contract 0.7 is stale; run builder with --write");
  process.stdout.write(`${JSON.stringify({ releaseId: built.contract.releaseId, stateCount: built.contract.representationStates.length, routeCount: built.contract.routes.length, appendedRoutes: 30, radiusDerivedRoutes: 10, centerlineOnlyRoutes: 20, bytes: built.bytes.byteLength, sha256: sha256(built.bytes), wrote: args.has("--write"), checked: args.has("--check") }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
