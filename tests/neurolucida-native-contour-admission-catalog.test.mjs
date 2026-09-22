import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  nativeContourAdmissionRecord,
  nativeContourBounds,
  nativeContourDisplayTransform,
  transformNativeContourPoint,
  validateNativeContourAdmissionCatalog,
  validateNativeContourGeometry,
} from "../app/neurolucida-native-contour-admission.js";
import { validateNeurolucidaNativeContourAdmissionCatalog } from "../scripts/validate-neurolucida-native-contour-admission-catalog-0.2.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/neurolucida-native-contour-admission-catalog-0.2.json", import.meta.url), "utf8"));
const geometry = JSON.parse(await readFile(new URL("../public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-45674-source-closed-soma-contours.json", import.meta.url), "utf8"));

test("validates the five-file native DAT audit and strict two-record admission", async () => {
  assert.deepEqual(await validateNeurolucidaNativeContourAdmissionCatalog(), {
    releaseId: "ohri-neurolucida-native-contour-admission-catalog-0.2.0",
    catalogBytes: 17392,
    catalogSha256: "fa27f8e6d4cfebadd2d0127c43b7aa2a5496066fd7dd5b613b3b9a8c68346d86",
    geometryBytes: 35842,
    geometrySha256: "1e41538a6443dcf7893386c180d3d22ddf81cc72a4d96f66a16193c97747cec3",
    auditedDatFileCount: 5,
    admittedRecordCount: 2,
    heldRecordCount: 3,
    admittedContourObjectCount: 15,
    admittedVertexCount: 475,
    renshawContourObjectCount: 7,
    renshawVertexCount: 200,
    admittedSurfaceCount: 0,
    admittedInternalStructureObjectCount: 0,
    registrationCount: 0,
  });
});

test("admits only seven explicitly source-closed NMO 45674 CellBody loops", () => {
  const verifiedCatalog = validateNativeContourAdmissionCatalog(catalog);
  const admission = nativeContourAdmissionRecord(verifiedCatalog, 45674);
  const verified = validateNativeContourGeometry(geometry, admission);
  assert.deepEqual(verified.contours.map((contour) => contour.vertexCount), [14, 33, 27, 50, 46, 17, 13]);
  assert.deepEqual(verified.contours.map((contour) => contour.zValuesMicrometre), [[-82], [-80], [-80], [-78], [-76], [-76], [-74]]);
  assert.equal(verified.contours.reduce((sum, contour) => sum + contour.vertexCount, 0), 200);
  assert.ok(verified.contours.every((contour) => contour.sourceName === "CellBody" && contour.sourceClosedFlag && contour.interpretedClosed));
  assert.equal(admission.audit.sourceOpenSomaNamedContourCount, 1);
  assert.equal(admission.audit.auxiliaryTraceObjectCount, 2);
  assert.match(admission.admission.reason, /One spaced Cell Body false-flag object and two open Unknown1 traces are excluded/);
});

test("keeps every Todd Cell Body series held despite exact point-array agreement", () => {
  const expected = new Map([
    [50424, [8, 427, "6638f9b056bedadaba503f3607115a4be27988ae71dd0ed8b309f3085143ab8b"]],
    [50394, [14, 768, "b823d7ef36d28ec05836425c82ba5b9bd4edfd8fb1bf1b821eecce833abe8f4b"]],
    [50408, [11, 709, "8052deb6cef02af95f8b7864784f8e5b9ed2c1d070c87698150b4152701a14b5"]],
  ]);
  for (const [neuronId, [contours, vertices, pointHash]] of expected) {
    const record = nativeContourAdmissionRecord(catalog, neuronId);
    assert.equal(record.admissionStatus, "held_source_closed_flag_false");
    assert.equal(record.audit.somaNamedContourObjectCount, contours);
    assert.equal(record.audit.somaNamedVertexCount, vertices);
    assert.equal(record.audit.somaNamedPointPayloadSha256, pointHash);
    assert.equal(record.audit.sourceClosedSomaNamedContourCount, 0);
    assert.equal(record.audit.sourceOpenSomaNamedContourCount, contours);
    assert.equal(record.audit.independentPointArraysAgree, true);
    assert.equal(record.admission.admittedContourObjectCount, 0);
    assert.equal("derivedObject" in record, false);
  }
});

test("uses a reversible display transform without changing duplicate source planes", () => {
  const bounds = nativeContourBounds(geometry.contours);
  const transform = nativeContourDisplayTransform(geometry.contours, 8);
  assert.ok(bounds.extent.every((value) => Number.isFinite(value) && value >= 0));
  const source = geometry.contours[2].points[0];
  const displayed = transformNativeContourPoint(source, transform);
  const recovered = displayed.map((value, axis) => value / transform.scaleViewerUnitPerMicrometre + transform.originMicrometre[axis]);
  assert.deepEqual(recovered, source.slice(0, 3));
  assert.equal(geometry.contours[1].zValuesMicrometre[0], geometry.contours[2].zValuesMicrometre[0]);
  assert.notEqual(geometry.contours[1].id, geometry.contours[2].id);
});

test("rejects invented closure, surfaces, promoted held records and identity drift", () => {
  const admission = nativeContourAdmissionRecord(catalog, 45674);
  const mutations = [
    (value) => { value.assetId = "NeuroMorpho:50424"; },
    (value) => { value.summary.surfaceCount = 1; },
    (value) => { value.contours[0].sourceClosedFlag = false; },
    (value) => { value.contours[0].points[0][0] = null; },
  ];
  for (const mutate of mutations) {
    const value = structuredClone(geometry);
    mutate(value);
    assert.throws(() => validateNativeContourGeometry(value, admission), /identity|unsupported authority|source-closed|invalid source point/i);
  }
  const promoted = structuredClone(catalog);
  const held = promoted.records.find((record) => record.neuronId === 50424);
  held.admission.admittedContourObjectCount = 8;
  assert.throws(() => validateNativeContourAdmissionCatalog(promoted), /must admit zero contours/i);
});
