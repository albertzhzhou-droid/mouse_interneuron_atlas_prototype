#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  nativeContourAdmissionRecord,
  validateNativeContourAdmissionCatalog,
  validateNativeContourGeometry,
} from "../app/neurolucida-native-contour-admission.js";
import { validateResearchSourceRegistry } from "./validate-research-source-registry-0.1.mjs";
import { buildNeurolucidaNativeContourAdmissionCatalog03 } from "../tools/build_neurolucida_native_contour_admission_catalog_0_3.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_PATH = path.join(PROJECT_ROOT, "data/neurolucida-native-contour-admission-catalog-0.3.json");
const PARENT_CATALOG_PATH = path.join(PROJECT_ROOT, "data/neurolucida-native-contour-admission-catalog-0.2.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/neurolucida-native-contour-admission-catalog-0.3.schema.json");
const REGISTRY_PATH = path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json");

const EXPECTED_TODD = Object.freeze([
  Object.freeze({ neuronId: 50424, path: "public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-50424-mbf-cell-body-line-loops.json", contours: 8, vertices: 427, bytes: 71212, sha256: "8bd390d698a77dc80a95c7d560e823d5f0ff1d5daadb2194be6475ba250851d6" }),
  Object.freeze({ neuronId: 50394, path: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50394-mbf-cell-body-line-loops.json", contours: 14, vertices: 768, bytes: 123254, sha256: "61fddbab3764e761600c2519e478eec4cee7918a581b2fde29ac2d8880c90a92" }),
  Object.freeze({ neuronId: 50408, path: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50408-mbf-cell-body-line-loops.json", contours: 11, vertices: 709, bytes: 110635, sha256: "30d9c7870329aa0d2c6c2e83aeb020587973bf44e72c214a46f809532ba9ae78" }),
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function schemaValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

export async function validateNeurolucidaNativeContourAdmissionCatalog03() {
  const [catalogBytes, parentCatalogBytes, schema, registry, atlasTypesSource, viewerSource, ...geometryBytes] = await Promise.all([
    readFile(CATALOG_PATH),
    readFile(PARENT_CATALOG_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(REGISTRY_PATH, "utf8").then(JSON.parse),
    readFile(path.join(PROJECT_ROOT, "app/atlas-types.ts"), "utf8"),
    readFile(path.join(PROJECT_ROOT, "app/NativeContourRecordViewer.tsx"), "utf8"),
    ...EXPECTED_TODD.map((record) => readFile(path.join(PROJECT_ROOT, record.path))),
  ]);
  const rawCatalog = JSON.parse(catalogBytes.toString("utf8"));
  const validateSchema = schemaValidator(schema);
  check(validateSchema(rawCatalog), `Native contour 0.3 schema validation failed: ${JSON.stringify(validateSchema.errors)}`);
  const catalog = validateNativeContourAdmissionCatalog(rawCatalog);
  validateResearchSourceRegistry(registry);

  const built = await buildNeurolucidaNativeContourAdmissionCatalog03();
  check(catalogBytes.equals(built.catalogBytes), "Native contour 0.3 catalog is not byte-reproducible");
  check(parentCatalogBytes.byteLength === 17392 && sha256(parentCatalogBytes) === "fa27f8e6d4cfebadd2d0127c43b7aa2a5496066fd7dd5b613b3b9a8c68346d86", "Frozen native contour 0.2 catalog changed");
  check(catalogBytes.byteLength === 23571 && sha256(catalogBytes) === "d5cc13f99c2e6ec0e41d6352512e592f5d6dc1d118f7d7c0b69ec2239deda8fe", "Native contour 0.3 catalog byte receipt changed");

  for (let index = 0; index < EXPECTED_TODD.length; index += 1) {
    const expected = EXPECTED_TODD[index];
    const bytes = geometryBytes[index];
    const generated = built.toddGeometries.find((item) => item.record.neuronId === expected.neuronId);
    check(generated && bytes.equals(generated.geometryBytes), `NMO ${expected.neuronId} geometry is not byte-reproducible`);
    check(bytes.byteLength === expected.bytes && sha256(bytes) === expected.sha256, `NMO ${expected.neuronId} geometry byte receipt changed`);
    const admission = nativeContourAdmissionRecord(catalog, expected.neuronId);
    const geometry = validateNativeContourGeometry(JSON.parse(bytes.toString("utf8")), admission);
    check(admission.admission.admittedContourObjectCount === expected.contours && admission.admission.admittedVertexCount === expected.vertices, `NMO ${expected.neuronId} catalog denominator changed`);
    check(geometry.contours.length === expected.contours && geometry.summary.vertexCount === expected.vertices, `NMO ${expected.neuronId} geometry denominator changed`);
    check(geometry.contours.every((contour) => contour.sourceName === "Cell Body" && contour.sourceClosedFlag === false && contour.interpretedClosed === true), `NMO ${expected.neuronId} raw/interpreted closure boundary changed`);
    check(geometry.contours.every((contour) => contour.cellBodyPresenceProperty?.declaredValueCount === 0 && contour.cellBodyPresenceProperty?.interpretedPresence === true && contour.independentParserClassification === "somaContour"), `NMO ${expected.neuronId} CellBody/somaContour evidence gate changed`);
    check(geometry.summary.excludedUserLineObjectCount === 4 && geometry.displayContract.excludedSourceNames.join("|") === "User Line 1|User Line 2|User Line 3|User Line 4", `NMO ${expected.neuronId} User Line exclusion changed`);
  }

  check(catalog.records.reduce((sum, record) => sum + record.admission.admittedContourObjectCount, 0) === 48, "Five-record line-loop denominator changed");
  check(catalog.records.reduce((sum, record) => sum + record.admission.admittedVertexCount, 0) === 2379, "Five-record vertex denominator changed");
  check(/neurolucida-native-contour-admission-catalog-0\.3\.json/.test(atlasTypesSource) && !/import neurolucidaNativeContourAdmissionCatalogJson from "\.\.\/data\/neurolucida-native-contour-admission-catalog-0\.2\.json"/.test(atlasTypesSource), "Current app catalog import does not point to 0.3");
  check(/new THREE\.LineLoop/.test(viewerSource) && !/SphereGeometry|ShapeGeometry|ExtrudeGeometry|TubeGeometry/.test(viewerSource)
    && /neuronId !== derivedSurfaceReceipt\.neuronId/.test(viewerSource)
    && /DER-source-contour-interpolated-open-shell-not-membrane/.test(viewerSource), "Native contour viewer lacks the exact-record-gated OBS + DER primitive boundary");
  check(/raw false flags/.test(viewerSource) && /MBF Cell Body semantics/.test(viewerSource), "Native contour viewer does not disclose the Todd closure interpretation");
  const nativeRecordSet = registry.sources.flatMap((source) => source.recordSets).find((recordSet) => recordSet.recordSetId === "RS-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG");
  check(nativeRecordSet?.dataPath === "data/neurolucida-native-contour-admission-catalog-0.3.json" && nativeRecordSet?.sourceObjectSetRef?.path === nativeRecordSet.dataPath, "Research source registry does not point to the exact 0.3 source-object set");

  return {
    releaseId: catalog.releaseId,
    catalogBytes: catalogBytes.byteLength,
    catalogSha256: sha256(catalogBytes),
    admittedRecordCount: catalog.summary.admittedRecordCount,
    admittedContourObjectCount: catalog.summary.admittedContourObjectCount,
    admittedVertexCount: catalog.summary.admittedVertexCount,
    toddAdmittedContourObjectCount: catalog.summary.toddAdmittedContourObjectCount,
    toddAdmittedVertexCount: catalog.summary.toddAdmittedVertexCount,
    excludedToddUserLineObjectCount: catalog.summary.excludedToddUserLineObjectCount,
    admittedSurfaceCount: catalog.summary.admittedSurfaceCount,
    admittedInternalStructureObjectCount: catalog.summary.admittedInternalStructureObjectCount,
    registrationCount: catalog.summary.registrationCount,
    geometries: EXPECTED_TODD.map((expected) => ({ neuronId: expected.neuronId, contours: expected.contours, vertices: expected.vertices, bytes: expected.bytes, sha256: expected.sha256 })),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateNeurolucidaNativeContourAdmissionCatalog03()
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
