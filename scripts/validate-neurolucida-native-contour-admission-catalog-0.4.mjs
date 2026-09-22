#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { NATIVE_DETAIL_04_RECORDS, NATIVE_DETAIL_04_PARENT } from "../app/neurolucida-native-detail-records.js";
import { NATIVE_DETAIL_04_AUDIT, validateNativeDetail04Delta } from "../app/neurolucida-native-detail-admission.js";
import { validateNativeContourAdmissionCatalog, validateNativeContourGeometry } from "../app/neurolucida-native-contour-admission.js";
import { extractNativeDatContours } from "../tools/neurolucida-native-contour-reader.mjs";
import { buildNeurolucidaNativeContourAdmissionCatalog04, NATIVE_DETAIL_04_CATALOG_PATH } from "../tools/build_neurolucida_native_contour_admission_catalog_0_4.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function check(condition, message) { if (!condition) throw new Error(message); }
function pinned(bytes, receipt, label) { check(bytes?.length === receipt.bytes && sha256(bytes) === receipt.sha256, `${label} byte receipt changed`); }

// Injectable byte maps permit negative tests without modifying scientific originals.
export function validateNativeDetail04Assets({ delta, baseBytes, auditBytes, geometryByNeuronId, sourceByNeuronId, apiByNeuronId, assetPaths }) {
  validateNativeDetail04Delta(delta);
  pinned(baseBytes, NATIVE_DETAIL_04_PARENT, "Frozen 0.3 catalog");
  pinned(auditBytes, NATIVE_DETAIL_04_AUDIT, "Independent audit");
  const baseCatalogSnapshot = JSON.parse(baseBytes);
  const catalog = validateNativeContourAdmissionCatalog({ ...delta, baseCatalogSnapshot, records: [...baseCatalogSnapshot.records, ...delta.addedRecords] });
  check(JSON.stringify([...assetPaths].sort()) === JSON.stringify(NATIVE_DETAIL_04_RECORDS.map((record) => record.outputPath).sort()), "Native detail derived directory has an unexpected or missing asset");
  for (const expected of NATIVE_DETAIL_04_RECORDS) {
    const record = delta.addedRecords.find((item) => item.neuronId === expected.neuronId);
    const geometryBytes = geometryByNeuronId.get(expected.neuronId);
    const rawBytes = sourceByNeuronId.get(expected.neuronId);
    const apiBytes = apiByNeuronId.get(expected.neuronId);
    pinned(geometryBytes, record.derivedObject, `NMO ${expected.neuronId} geometry`);
    pinned(rawBytes, record.source, `NMO ${expected.neuronId} DAT`);
    pinned(apiBytes, record.apiReceipt, `NMO ${expected.neuronId} API`);
    const payload = validateNativeContourGeometry(JSON.parse(geometryBytes), record);
    const pointArrays = payload.contours.map((contour) => contour.points);
    check(sha256(JSON.stringify(pointArrays)) === expected.pointSha256, `NMO ${expected.neuronId} actual point array hash changed`);
    check(JSON.stringify(pointArrays) === JSON.stringify(extractNativeDatContours(rawBytes).map((contour) => contour.points)), `NMO ${expected.neuronId} source point arrays changed`);
    const api = JSON.parse(apiBytes);
    check(api.neuron_id === expected.neuronId && api.neuron_name === expected.sourceName && record.sourceEvidence.attributes === api.attributes && record.sourceEvidence.physicalIntegrity === api.physical_Integrity, `NMO ${expected.neuronId} source API boundary changed`);
  }
  return catalog;
}

export async function loadNativeDetail04Assets() {
  const [delta, baseBytes, auditBytes, names] = await Promise.all([
    readFile(path.join(ROOT, NATIVE_DETAIL_04_CATALOG_PATH), "utf8").then(JSON.parse), readFile(path.join(ROOT, NATIVE_DETAIL_04_PARENT.path)), readFile(path.join(ROOT, NATIVE_DETAIL_04_AUDIT.path)), readdir(path.join(ROOT, "public/data/neurolucida_native_detail_v1")),
  ]);
  const tuples = await Promise.all(NATIVE_DETAIL_04_RECORDS.map(async (record) => [record.neuronId, ...await Promise.all([readFile(path.join(ROOT, record.outputPath)), readFile(path.join(ROOT, record.sourcePath)), readFile(path.join(ROOT, record.apiPath))])]));
  return { delta, baseBytes, auditBytes, geometryByNeuronId: new Map(tuples.map(([id, bytes]) => [id, bytes])), sourceByNeuronId: new Map(tuples.map(([id, , bytes]) => [id, bytes])), apiByNeuronId: new Map(tuples.map(([id, , , bytes]) => [id, bytes])), assetPaths: names.map((name) => `public/data/neurolucida_native_detail_v1/${name}`) };
}

export async function validateNeurolucidaNativeContourAdmissionCatalog04() {
  const inputs = await loadNativeDetail04Assets();
  const catalog = validateNativeDetail04Assets(inputs);
  const built = await buildNeurolucidaNativeContourAdmissionCatalog04();
  const [catalogBytes, viewerSource, universeSource, atlasTypesSource] = await Promise.all([readFile(path.join(ROOT, NATIVE_DETAIL_04_CATALOG_PATH)), readFile(path.join(ROOT, "app/NativeContourRecordViewer.tsx"), "utf8"), readFile(path.join(ROOT, "app/NeuroMorphoUniversePanel.tsx"), "utf8"), readFile(path.join(ROOT, "app/atlas-types.ts"), "utf8")]);
  check(catalogBytes.equals(built.catalogBytes), "Native detail 0.4 delta is not byte-reproducible");
  for (const item of built.geometries) check(inputs.geometryByNeuronId.get(item.record.neuronId).equals(item.geometryBytes), `NMO ${item.record.neuronId} geometry is not byte-reproducible`);
  check(/new THREE\.LineLoop/.test(viewerSource) && !/ShapeGeometry|ExtrudeGeometry|TubeGeometry|new THREE\.Mesh\s*\(/.test(viewerSource), "Native detail viewer introduced a surface primitive");
  check(/NativeContourRecordContent key=\{neuronId\}/.test(viewerSource) && /NativeContourRecordViewer key=\{selected.neuronId\} neuronId=\{selected.neuronId\}/.test(universeSource), "Native detail identity reset/selected-universe route is missing");
  check(/neurolucida-native-contour-admission-catalog-0\.4\.json/.test(atlasTypesSource) && /baseCatalogSnapshot/.test(atlasTypesSource), "Native detail catalog delta is not composed into the App");
  return { releaseId: catalog.releaseId, catalogBytes: catalogBytes.length, catalogSha256: sha256(catalogBytes), addedRecordCount: 2, addedContourObjectCount: 24, addedVertexCount: 2770, admittedRecordCount: 7, admittedContourObjectCount: 72, admittedVertexCount: 5149, sourceSurfaceCount: 0, internalStructureObjectCount: 0, registrationCount: 0, geometry: inputs.delta.addedRecords.map((record) => ({ neuronId: record.neuronId, ...record.derivedObject })) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeurolucidaNativeContourAdmissionCatalog04().then((report) => console.log(JSON.stringify(report, null, 2))).catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
