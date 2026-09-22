import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { NATIVE_DETAIL_04_RECORDS } from "../app/neurolucida-native-detail-records.js";
import { validateNativeDetail04Delta } from "../app/neurolucida-native-detail-admission.js";
import { validateNativeContourAdmissionCatalog, validateNativeContourGeometry, nativeContourAdmissionRecord } from "../app/neurolucida-native-contour-admission.js";
import { loadNativeDetail04Assets, validateNativeDetail04Assets, validateNeurolucidaNativeContourAdmissionCatalog04 } from "../scripts/validate-neurolucida-native-contour-admission-catalog-0.4.mjs";

const clone = (value) => structuredClone(value);
const inputs = await loadNativeDetail04Assets();
const baseCatalogSnapshot = JSON.parse(inputs.baseBytes);
const catalog = { ...inputs.delta, baseCatalogSnapshot, records: [...baseCatalogSnapshot.records, ...inputs.delta.addedRecords] };
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("0.4 independently audited delta is reproducible and leaves frozen 0.3 unchanged", async () => {
  const result = await validateNeurolucidaNativeContourAdmissionCatalog04();
  assert.equal(result.admittedRecordCount, 7); assert.equal(result.admittedContourObjectCount, 72); assert.equal(result.admittedVertexCount, 5149);
  assert.equal(result.addedContourObjectCount, 24); assert.equal(result.addedVertexCount, 2770);
  assert.equal("records" in inputs.delta, false);
  assert.deepEqual(catalog.records.slice(0, 5), baseCatalogSnapshot.records);
});

test("delta fails closed on identity, receipts, raw flags, no-diameter and authority mutations", () => {
  const changes = [
    (delta) => { delta.addedRecords[0].neuronId = 108979; },
    (delta) => { delta.addedRecords.reverse(); },
    (delta) => { delta.addedRecords.push(clone(delta.addedRecords[0])); },
    (delta) => { delta.records = clone(baseCatalogSnapshot.records); },
    (delta) => { delta.baseCatalog.sha256 = "0".repeat(64); },
    (delta) => { delta.independentAudit.sha256 = "0".repeat(64); },
    (delta) => { delta.addedRecords[0].source.projectPath = "public/raw-copy.dat"; },
    (delta) => { delta.addedRecords[0].audit.sourceClosedSomaNamedContourCount = 12; },
    (delta) => { delta.addedRecords[1].sourceEvidence.standardizedSwcDiameterAvailable = true; },
    (delta) => { delta.summary.admittedSurfaceCount = 1; },
    (delta) => { delta.relationshipBoundary.overlayWithStandardizedSwcAllowed = true; },
    (delta) => { delta.parserAudit.classificationBasis = "CellBody property alone"; },
  ];
  for (const change of changes) { const delta = clone(inputs.delta); change(delta); assert.throws(() => validateNativeDetail04Delta(delta)); }
  const merged = clone(catalog); merged.records[0].admission.admittedVertexCount += 1;
  assert.throws(() => validateNativeContourAdmissionCatalog(merged));
  assert.equal(nativeContourAdmissionRecord(catalog, 108979), null);
});

for (const expected of NATIVE_DETAIL_04_RECORDS) {
  test(`NMO ${expected.neuronId} retains exact flags, source order, repeated z and excludes inferred geometry`, () => {
    const record = inputs.delta.addedRecords.find((item) => item.neuronId === expected.neuronId);
    const geometry = JSON.parse(inputs.geometryByNeuronId.get(expected.neuronId));
    assert.equal(validateNativeContourGeometry(geometry, record), geometry);
    assert.deepEqual(geometry.contours.map((contour) => contour.zValuesMicrometre[0]), expected.zVector);
    assert.deepEqual(geometry.contours.map((contour) => contour.vertexCount), expected.vertexVector);
    assert.equal(geometry.contours.every((contour) => contour.sourceClosedFlag === false && contour.interpretedClosed === true), true);
    const mutations = [
      (payload) => { payload.contours[0].sourceClosedFlag = true; },
      (payload) => { payload.contours[0].sourceName = "untyped contour"; },
      (payload) => { payload.contours[0].sourceProperties.CellBody = false; },
      (payload) => { payload.contours[0].sourcePropertyReceipts[0].values = [1]; },
      (payload) => { payload.contours[0].independentParserClassification = "contour"; },
      (payload) => { payload.contours.reverse(); },
      (payload) => { payload.contours[0].points[0][2] += 1; },
      (payload) => { payload.summary.membraneCount = 1; },
      (payload) => { payload.summary.internalStructureObjectCount = 1; },
      (payload) => { payload.displayContract.traceRadiusRenderingUse = "anatomical_thickness"; },
      (payload) => { payload.displayContract.nativeDrawingWidthAuthorizesSwcDiameter = true; },
      (payload) => { payload.displayContract.preserveDuplicateZPlanesAsSeparateObjects = false; },
    ];
    for (const change of mutations) { const mutated = clone(geometry); change(mutated); assert.throws(() => validateNativeContourGeometry(mutated, record)); }
  });

  test(`NMO ${expected.neuronId} rejects same-size tampering and forged derivative receipt`, () => {
    const bytes = Buffer.from(inputs.geometryByNeuronId.get(expected.neuronId)); bytes[bytes.length - 2] ^= 1;
    const geometryByNeuronId = new Map(inputs.geometryByNeuronId); geometryByNeuronId.set(expected.neuronId, bytes);
    assert.throws(() => validateNativeDetail04Assets({ ...inputs, geometryByNeuronId }), /geometry byte receipt/);
    const geometry = JSON.parse(inputs.geometryByNeuronId.get(expected.neuronId)); geometry.contours[0].points[0][0] += 1;
    const forgedBytes = Buffer.from(JSON.stringify(geometry)); geometryByNeuronId.set(expected.neuronId, forgedBytes);
    const delta = clone(inputs.delta); const record = delta.addedRecords.find((item) => item.neuronId === expected.neuronId);
    record.derivedObject.bytes = forgedBytes.length; record.derivedObject.sha256 = sha256(forgedBytes);
    assert.throws(() => validateNativeDetail04Assets({ ...inputs, delta, geometryByNeuronId }), /actual point array hash/);
    const sourceByNeuronId = new Map(inputs.sourceByNeuronId); const raw = Buffer.from(sourceByNeuronId.get(expected.neuronId)); raw[100] ^= 1; sourceByNeuronId.set(expected.neuronId, raw);
    assert.throws(() => validateNativeDetail04Assets({ ...inputs, sourceByNeuronId }), /DAT byte receipt/);
  });
}

test("derived inventory rejects figures, arbitrary organelles and missing geometry", () => {
  for (const extra of ["figure.png", "nucleus.json", "native-copy.dat"]) assert.throws(() => validateNativeDetail04Assets({ ...inputs, assetPaths: [...inputs.assetPaths, `public/data/neurolucida_native_detail_v1/${extra}`] }), /unexpected or missing asset/);
  assert.throws(() => validateNativeDetail04Assets({ ...inputs, assetPaths: inputs.assetPaths.slice(1) }), /unexpected or missing asset/);
});

test("native viewer exposes source cross-section inspection and resets per selected identity", async () => {
  const viewer = await readFile(new URL("../app/NativeContourRecordViewer.tsx", import.meta.url), "utf8");
  assert.match(viewer, /NativeContourRecordContent key=\{neuronId\}/);
  assert.match(viewer, /Inspect a source cross-section/);
  assert.match(viewer, /Isolate selected trace/);
  assert.match(viewer, /First five exact source coordinates/);
  assert.match(viewer, /raw false flags retained/);
  assert.doesNotMatch(viewer, /ShapeGeometry|ExtrudeGeometry|TubeGeometry|new THREE\.Mesh\s*\(/);
});
