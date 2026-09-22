#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateNativeSomaContourPayload } from "../app/neurolucida-native-soma-contours.js";
import { buildNeurolucidaSourceNativeSomaContours } from "../tools/build_neurolucida_source_native_soma_contours.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/neurolucida-source-native-soma-contour-trace-0.1.json");
const GEOMETRY_PATH = path.join(PROJECT_ROOT, "public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json");
const APP_TYPES_PATH = path.join(PROJECT_ROOT, "app/atlas-types.ts");
const VIEWER_PATH = path.join(PROJECT_ROOT, "app/NativeSomaContourViewer.tsx");
const RECORD_VIEWER_PATH = path.join(PROJECT_ROOT, "app/NativeContourRecordViewer.tsx");
const ATLAS_PATH = path.join(PROJECT_ROOT, "app/AtlasPrototype.tsx");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function validateNeurolucidaSourceNativeSomaContourTrace() {
  const [contractBytes, geometryBytes, atlasTypesSource, viewerSource, recordViewerSource, atlasSource, toolNames] = await Promise.all([
    readFile(CONTRACT_PATH),
    readFile(GEOMETRY_PATH),
    readFile(APP_TYPES_PATH, "utf8"),
    readFile(VIEWER_PATH, "utf8"),
    readFile(RECORD_VIEWER_PATH, "utf8"),
    readFile(ATLAS_PATH, "utf8"),
    readdir(path.join(PROJECT_ROOT, "tools")),
  ]);
  const contract = JSON.parse(contractBytes.toString("utf8"));
  const geometry = JSON.parse(geometryBytes.toString("utf8"));
  const built = await buildNeurolucidaSourceNativeSomaContours();
  check(contractBytes.equals(built.contractBytes), "Native soma-contour contract is not byte-reproducible");
  check(geometryBytes.equals(built.geometryBytes), "Native soma-contour geometry is not byte-reproducible");
  check(contract.derivedObject.bytes === geometryBytes.byteLength, "Native soma-contour geometry byte receipt drifted");
  check(contract.derivedObject.sha256 === sha256(geometryBytes), "Native soma-contour geometry SHA-256 receipt drifted");
  validateNativeSomaContourPayload(geometry, contract);
  check(contract.independentAudit.commit === "e07fd2d53c03945f011c335c7b643765f2d85a09", "Independent parser commit drifted");
  check(contract.independentAudit.parserSha256 === "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2", "Independent parser receipt drifted");
  check(contract.summary.pointPayloadSha256 === "a478e6263e7d00c1f17bc64143014a3519c39f771b6809a28b057db07c724ab4", "Independent point-payload agreement drifted");
  check(contract.relationshipBoundary.overlayWithStandardizedSwcAllowed === false, "DAT/SWC overlay was incorrectly enabled");
  check(contract.relationshipBoundary.sameSpecimenInternalStructureCount === 0, "Native contours cannot admit internal structure");
  check(!toolNames.some((name) => /morphology_parser|swcPlus_typeLibrary/i.test(name)), "GPL independent parser code must not be bundled in project tools");
  check(/neurolucidaSourceNativeSomaContourTraceJson/.test(atlasTypesSource), "Native contour contract is not exposed to the app");
  check(/new THREE\.LineLoop/.test(viewerSource), "Native contour viewer must render line loops");
  check(!/ShapeGeometry|ExtrudeGeometry|TubeGeometry|Mesh\s*\(/.test(viewerSource), "Native contour viewer contains an unauthorized surface primitive");
  check(/traceRadiusRenderingUse: "forbidden"/.test(viewerSource), "Native contour viewer does not disclose the trace-radius boundary");
  check(/state\.neuronId === neuronId/.test(recordViewerSource), "Current native contour viewer is not gated to the requested record identity");
  check(/<NativeContourRecordViewer[^>]*neuronId=\{observedCellForm\.neuronId\}/.test(atlasSource), "Current native contour viewer is not gated by the selected morphology identity");
  check(/key=\{observedCellForm\.neuronId\}/.test(atlasSource), "Current native contour viewer does not clear prior-record state on switch");
  return {
    releaseId: contract.releaseId,
    geometryBytes: geometryBytes.byteLength,
    geometrySha256: sha256(geometryBytes),
    contourCount: contract.summary.sourceSomaContourObjectCount,
    vertexCount: contract.summary.vertexCount,
    semanticClosedSegmentCount: contract.summary.semanticClosedSegmentCount,
    admittedSurfaceCount: contract.summary.surfaceCount,
    admittedInternalStructureObjectCount: contract.summary.internalStructureObjectCount,
    registrationCount: contract.summary.registrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeurolucidaSourceNativeSomaContourTrace()
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
