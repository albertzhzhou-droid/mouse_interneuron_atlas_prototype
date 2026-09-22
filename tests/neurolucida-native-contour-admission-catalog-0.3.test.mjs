import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  NATIVE_CONTOUR_RENDERABLE_NEURON_IDS,
  nativeContourAdmissionRecord,
  validateNativeContourAdmissionCatalog,
  validateNativeContourGeometry,
} from "../app/neurolucida-native-contour-admission.js";
import { validateNeurolucidaNativeContourAdmissionCatalog03 } from "../scripts/validate-neurolucida-native-contour-admission-catalog-0.3.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/neurolucida-native-contour-admission-catalog-0.3.json", import.meta.url), "utf8"));
const expectedTodd = new Map([
  [50424, { path: "../public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-50424-mbf-cell-body-line-loops.json", contours: 8, vertices: 427 }],
  [50394, { path: "../public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50394-mbf-cell-body-line-loops.json", contours: 14, vertices: 768 }],
  [50408, { path: "../public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50408-mbf-cell-body-line-loops.json", contours: 11, vertices: 709 }],
]);
const toddGeometry = new Map(await Promise.all([...expectedTodd].map(async ([neuronId, expected]) => [
  neuronId,
  JSON.parse(await readFile(new URL(expected.path, import.meta.url), "utf8")),
])));

test("validates the reproducible 0.3 catalog and exact Todd LineLoop receipts", async () => {
  const report = await validateNeurolucidaNativeContourAdmissionCatalog03();
  assert.deepEqual({
    releaseId: report.releaseId,
    catalogBytes: report.catalogBytes,
    catalogSha256: report.catalogSha256,
    admittedRecordCount: report.admittedRecordCount,
    admittedContourObjectCount: report.admittedContourObjectCount,
    admittedVertexCount: report.admittedVertexCount,
    toddAdmittedContourObjectCount: report.toddAdmittedContourObjectCount,
    toddAdmittedVertexCount: report.toddAdmittedVertexCount,
    excludedToddUserLineObjectCount: report.excludedToddUserLineObjectCount,
    admittedSurfaceCount: report.admittedSurfaceCount,
    admittedInternalStructureObjectCount: report.admittedInternalStructureObjectCount,
    registrationCount: report.registrationCount,
  }, {
    releaseId: "ohri-neurolucida-native-contour-admission-catalog-0.3.0",
    catalogBytes: 23571,
    catalogSha256: "d5cc13f99c2e6ec0e41d6352512e592f5d6dc1d118f7d7c0b69ec2239deda8fe",
    admittedRecordCount: 5,
    admittedContourObjectCount: 48,
    admittedVertexCount: 2379,
    toddAdmittedContourObjectCount: 33,
    toddAdmittedVertexCount: 1904,
    excludedToddUserLineObjectCount: 12,
    admittedSurfaceCount: 0,
    admittedInternalStructureObjectCount: 0,
    registrationCount: 0,
  });
  assert.deepEqual(report.geometries.map(({ neuronId, contours, vertices }) => [neuronId, contours, vertices]), [[50424, 8, 427], [50394, 14, 768], [50408, 11, 709]]);
});

test("admits only exact Todd Cell Body objects while preserving raw false flags", () => {
  const verifiedCatalog = validateNativeContourAdmissionCatalog(catalog);
  assert.deepEqual(NATIVE_CONTOUR_RENDERABLE_NEURON_IDS, [45718, 45674, 50424, 50394, 50408]);
  for (const [neuronId, expected] of expectedTodd) {
    const admission = nativeContourAdmissionRecord(verifiedCatalog, neuronId);
    const geometry = validateNativeContourGeometry(toddGeometry.get(neuronId), admission);
    assert.equal(admission.admissionStatus, "admitted_mbf_cell_body_semantic_rule");
    assert.equal(geometry.contours.length, expected.contours);
    assert.equal(geometry.summary.vertexCount, expected.vertices);
    assert.equal(geometry.summary.rawSourceClosedTrueContourObjectCount, 0);
    assert.equal(geometry.summary.rawSourceClosedFalseContourObjectCount, expected.contours);
    assert.equal(geometry.summary.excludedUserLineObjectCount, 4);
    assert.ok(geometry.contours.every((contour) => contour.sourceName === "Cell Body"));
    assert.ok(geometry.contours.every((contour) => contour.sourceClosedFlag === false && contour.interpretedClosed === true));
    assert.ok(geometry.contours.every((contour) => contour.sourceProperties.CellBody === true));
    assert.ok(geometry.contours.every((contour) => assert.deepEqual(contour.sourcePropertyReceipts, [{ key: "CellBody", declaredValueCount: 0, values: [] }]) === undefined));
    assert.ok(geometry.contours.every((contour) => contour.independentParserClassification === "somaContour"));
    assert.ok(geometry.contours.every((contour) => !/^User Line [1-4]$/.test(contour.sourceName)));
  }
});

test("rejects any weakening of the Todd evidence gate or zero-authority boundary", () => {
  const admission = nativeContourAdmissionRecord(catalog, 50424);
  const mutations = [
    [(value) => { value.contours[0].sourceClosedFlag = true; }, /non-Cell Body or non-raw-false trace/i],
    [(value) => { value.contours[0].sourceName = "User Line 1"; }, /non-Cell Body or non-raw-false trace/i],
    [(value) => { value.contours[0].sourcePropertyReceipts[0].declaredValueCount = 1; }, /empty-value CellBody presence receipt/i],
    [(value) => { value.contours[0].independentParserClassification = "unknown"; }, /closure classification changed/i],
    [(value) => { value.closureInterpretation.mbfDocumentation.documentationUrl = "https://example.invalid"; }, /parser\/MBF closure basis changed/i],
    [(value) => { value.summary.triangleCount = 1; }, /triangleCount must remain zero/i],
    [(value) => { value.summary.biologicalMeasurementCount = 1; }, /biologicalMeasurementCount must remain zero/i],
    [(value) => { value.displayContract.closeLastToFirstByMbfCellBodySemantics = false; }, /LineLoop display contract changed/i],
  ];
  for (const [mutate, expectedError] of mutations) {
    const changed = structuredClone(toddGeometry.get(50424));
    mutate(changed);
    assert.throws(() => validateNativeContourGeometry(changed, admission), expectedError);
  }
});

test("rejects catalog-level promotion beyond 48 LineLoops and the scoped MBF rule", () => {
  const mutations = [
    [(value) => { value.summary.admittedContourObjectCount = 49; }, /object\/vertex denominator changed/i],
    [(value) => { value.summary.admittedSurfaceCount = 1; }, /admittedSurfaceCount must remain zero/i],
    [(value) => { value.records.find((record) => record.neuronId === 50394).admissionStatus = "held_source_closed_flag_false"; }, /MBF Cell Body admission changed/i],
    [(value) => { value.records.find((record) => record.neuronId === 50408).audit.sourceClosedSomaNamedContourCount = 1; }, /raw false closure-flag receipt changed/i],
    [(value) => { value.mbfCellBodySemantics.documentationUrl = "https://example.invalid"; }, /MBF Cell Body closure evidence changed/i],
  ];
  for (const [mutate, expectedError] of mutations) {
    const changed = structuredClone(catalog);
    mutate(changed);
    assert.throws(() => validateNativeContourAdmissionCatalog(changed), expectedError);
  }
});
