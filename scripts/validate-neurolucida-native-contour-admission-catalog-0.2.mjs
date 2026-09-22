#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  nativeContourAdmissionRecord,
  validateNativeContourAdmissionCatalog,
  validateNativeContourGeometry,
} from "../app/neurolucida-native-contour-admission.js";
import { buildNeurolucidaNativeContourAdmissionCatalog } from "../tools/build_neurolucida_native_contour_admission_catalog.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_PATH = path.join(PROJECT_ROOT, "data/neurolucida-native-contour-admission-catalog-0.2.json");
const GEOMETRY_PATH = path.join(PROJECT_ROOT, "public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-45674-source-closed-soma-contours.json");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function validateNeurolucidaNativeContourAdmissionCatalog() {
  const [catalogBytes, geometryBytes, atlasTypesSource, viewerSource, atlasSource, routeLibrarySource] = await Promise.all([
    readFile(CATALOG_PATH),
    readFile(GEOMETRY_PATH),
    readFile(path.join(PROJECT_ROOT, "app/atlas-types.ts"), "utf8"),
    readFile(path.join(PROJECT_ROOT, "app/NativeContourRecordViewer.tsx"), "utf8"),
    readFile(path.join(PROJECT_ROOT, "app/AtlasPrototype.tsx"), "utf8"),
    readFile(path.join(PROJECT_ROOT, "app/ObservedMorphologyRouteLibrary.tsx"), "utf8"),
  ]);
  const catalog = validateNativeContourAdmissionCatalog(JSON.parse(catalogBytes.toString("utf8")));
  const geometry = JSON.parse(geometryBytes.toString("utf8"));
  const renshaw = nativeContourAdmissionRecord(catalog, 45674);
  validateNativeContourGeometry(geometry, renshaw);
  const built = await buildNeurolucidaNativeContourAdmissionCatalog();
  check(catalogBytes.equals(built.catalogBytes), "Native contour admission catalog is not byte-reproducible");
  check(geometryBytes.equals(built.geometryBytes), "NMO 45674 native contour geometry is not byte-reproducible");
  check(catalogBytes.byteLength === 17392 && sha256(catalogBytes) === "fa27f8e6d4cfebadd2d0127c43b7aa2a5496066fd7dd5b613b3b9a8c68346d86", "Native contour catalog byte receipt drifted");
  check(geometryBytes.byteLength === 35842 && sha256(geometryBytes) === "1e41538a6443dcf7893386c180d3d22ddf81cc72a4d96f66a16193c97747cec3", "NMO 45674 native contour geometry receipt drifted");
  check(renshaw.derivedObject.bytes === geometryBytes.byteLength && renshaw.derivedObject.sha256 === sha256(geometryBytes), "NMO 45674 catalog-to-geometry receipt drifted");
  check(renshaw.source.bytes === 353251 && renshaw.source.sha256 === "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87", "NMO 45674 DAT receipt drifted");
  check(renshaw.audit.independentPointArraysAgree === true && geometry.extraction.independentAudit.exactPointArraysAgree === true, "Independent parser agreement is missing");
  check(geometry.summary.pointPayloadSha256 === "b163a222ae560d3467a94f3438985c868548695205d56efaaeed454b67977208", "NMO 45674 admitted point-payload receipt drifted");
  check(geometry.contours.every((contour) => contour.sourceClosedFlag === true && contour.sourceName === "CellBody"), "NMO 45674 geometry contains a held or non-soma contour");
  check(/neurolucidaNativeContourAdmissionCatalogJson/.test(atlasTypesSource), "Native contour catalog is not exposed to the app");
  check(/new THREE\.LineLoop/.test(viewerSource) && !/ShapeGeometry|ExtrudeGeometry|TubeGeometry|new THREE\.Mesh\s*\(/.test(viewerSource), "Native contour record viewer uses an unauthorized primitive");
  check(/state\.neuronId === neuronId/.test(viewerSource) && /key=\{observedCellForm\.neuronId\}/.test(atlasSource), "Native contour switching does not explicitly clear prior-record state");
  check(/<NativeContourRecordViewer[^>]*neuronId=\{observedCellForm\.neuronId\}/.test(atlasSource), "Native contour viewer is not gated by the current morphology record identity");
  check(!/<NativeSomaContourViewer/.test(atlasSource), "The old one-record native contour viewer remains mounted");
  check(/nativeContourRecord\.admission\.reason/.test(routeLibrarySource), "Route library does not expose per-record native DAT admission reasons");
  return {
    releaseId: catalog.releaseId,
    catalogBytes: catalogBytes.byteLength,
    catalogSha256: sha256(catalogBytes),
    geometryBytes: geometryBytes.byteLength,
    geometrySha256: sha256(geometryBytes),
    auditedDatFileCount: catalog.summary.auditedDatFileCount,
    admittedRecordCount: catalog.summary.admittedRecordCount,
    heldRecordCount: catalog.summary.heldRecordCount,
    admittedContourObjectCount: catalog.summary.admittedContourObjectCount,
    admittedVertexCount: catalog.summary.admittedVertexCount,
    renshawContourObjectCount: renshaw.admission.admittedContourObjectCount,
    renshawVertexCount: renshaw.admission.admittedVertexCount,
    admittedSurfaceCount: catalog.summary.admittedSurfaceCount,
    admittedInternalStructureObjectCount: catalog.summary.admittedInternalStructureObjectCount,
    registrationCount: catalog.summary.registrationCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeurolucidaNativeContourAdmissionCatalog()
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
