import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";
import { assertMorphologyGeometrySourceFrame } from "../app/morphology-source-frame-runtime.js";

const contract = JSON.parse(await readFile(new URL("../data/morphology-source-frame-disclosure-0.1.json", import.meta.url), "utf8"));
const fixtures = new Map();
for (const disclosure of contract.records) {
  const path = disclosure.geometryReceipt.path.startsWith("/data/")
    ? `../public${disclosure.geometryReceipt.path}`
    : `../public/data/neuromorpho_release_8_6_124_census_v1/${disclosure.geometryReceipt.path}`;
  const bytes = await readFile(new URL(path, import.meta.url));
  assert.equal(bytes.byteLength, disclosure.geometryReceipt.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), disclosure.geometryReceipt.sha256);
  fixtures.set(disclosure.neuronId, { disclosure, geometry: JSON.parse(bytes) });
}

test("the actual loader source-frame gate accepts all 149 unchanged byte-verified census and supplementary geometries", () => {
  assert.equal(fixtures.size, 149);
  for (const { disclosure, geometry } of fixtures.values()) assert.equal(assertMorphologyGeometrySourceFrame(disclosure, geometry), true);
});

test("different JSON property order preserves exactly the same source bounds and display transform", () => {
  const { disclosure, geometry } = fixtures.get(45674), copy = structuredClone(geometry);
  copy.morphometrics.computedFromStandardizedSwc.boundsMicrometre = Object.fromEntries(Object.entries(copy.morphometrics.computedFromStandardizedSwc.boundsMicrometre).reverse());
  copy.displayTransform = Object.fromEntries(Object.entries(copy.displayTransform).reverse());
  assert.equal(assertMorphologyGeometrySourceFrame(disclosure, copy), true);
  assert.equal(JSON.stringify(geometry.morphometrics.computedFromStandardizedSwc.boundsMicrometre) === JSON.stringify(disclosure.sourceCoordinates.boundsMicrometre), false);
});

test("actual coordinate values, units, identity, transform, missing geometry and atlas authority remain strict", () => {
  const { disclosure, geometry } = fixtures.get(45674);
  const changes = [g => g.neuronId++, g => g.assetId += ".other", g => g.units = "atlas micrometre",
    g => g.sourceFrame = "common atlas", g => g.geometryStatus = "membrane",
    g => g.registration.registrationCount = 1, g => g.registration.atlasPlacement.value = [0, 0, 0],
    g => g.morphometrics.computedFromStandardizedSwc.boundsMicrometre.min[0] += 0.000001,
    g => g.morphometrics.computedFromStandardizedSwc.boundsMicrometre.max[0] = NaN,
    g => g.morphometrics.computedFromStandardizedSwc.extentMicrometre[2]++,
    g => g.displayTransform.scaleViewerUnitPerMicrometre *= 2,
    g => g.displayTransform.originMicrometre[0]++,
    g => g.displayTransform.use = "biological transform", g => delete g.morphometrics.computedFromStandardizedSwc];
  for (const change of changes) { const copy = structuredClone(geometry); change(copy); assert.throws(() => assertMorphologyGeometrySourceFrame(disclosure, copy)); }
});

test("both actual 2D source objects remain planar and cannot pass with inferred z values", () => {
  for (const id of [194468, 194469]) {
    const { disclosure, geometry } = fixtures.get(id);
    assert.equal(assertMorphologyGeometrySourceFrame(disclosure, geometry), true);
    const copy = structuredClone(geometry); copy.morphometrics.computedFromStandardizedSwc.extentMicrometre[2] = 1;
    assert.throws(() => assertMorphologyGeometrySourceFrame(disclosure, copy), /source extent/);
  }
});
