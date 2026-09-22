import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  RADIUS_SURFACE_ALGORITHM_ID,
  createObservedSwcCenterlines,
  createRadiusDerivedSurface,
} from "../app/source-local-morphology-geometry.js";
import { validateMorphologyFidelityContract } from "../scripts/validate-morphology-fidelity-contract-0.1.mjs";

const CONTRACT_URL = new URL("../data/morphology-fidelity-contract-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/morphology-fidelity-contract-0.1.schema.json", import.meta.url);

async function loadJson(url) {
  return readFile(url, "utf8").then(JSON.parse);
}

function validator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

test("validates five evidence-gated morphology fidelity receipts", async () => {
  const result = await validateMorphologyFidelityContract();
  assert.deepEqual(result, {
    releaseId: "ohri-morphology-fidelity-contract-0.1.0",
    recordCount: 5,
    radiusSurfaceCount: 3,
    internalStructureCount: 0,
  });
});

test("schema rejects radius surfaces for official no-diameter records", async () => {
  const [contract, schema] = await Promise.all([loadJson(CONTRACT_URL), loadJson(SCHEMA_URL)]);
  const altered = structuredClone(contract);
  const noDiameter = altered.records.find((record) => record.neuronId === 242822);
  noDiameter.modes.radiusSurface = {
    available: true,
    authority: "DERIVED_FROM_OBSERVED_RADIUS",
    missingReason: null,
  };
  const validate = validator(schema);
  assert.equal(validate(altered), false);
});

test("schema rejects invented same-specimen internal structure", async () => {
  const [contract, schema] = await Promise.all([loadJson(CONTRACT_URL), loadJson(SCHEMA_URL)]);
  const altered = structuredClone(contract);
  altered.records[0].modes.internalStructure.available = true;
  const validate = validator(schema);
  assert.equal(validate(altered), false);
});

test("renderer makes exact endpoint-radius open frusta and separate observed centerlines", () => {
  const geometry = {
    neuronId: 1,
    sourceFrame: "source-local",
    displayTransform: {
      originMicrometre: [0, 0, 0],
      scaleViewerUnitPerMicrometre: 1,
    },
    segments: [[0, 0, 0, 2, 0, 10, 0, 1, 3, "dendrite_type_3"]],
  };
  const colors = { 3: 0x123456 };
  const surfaceRoot = createRadiusDerivedSurface(geometry, { colors });
  assert.equal(surfaceRoot.userData.algorithmId, RADIUS_SURFACE_ALGORITHM_ID);
  assert.equal(surfaceRoot.userData.membraneClaim, false);
  assert.equal(surfaceRoot.children.length, 1);
  const surfaceGeometry = surfaceRoot.children[0].geometry;
  const positions = surfaceGeometry.getAttribute("position");
  assert.equal(positions.count, 12);
  assert.equal(surfaceGeometry.index.count, 36);
  assert.ok(positions.array instanceof Float32Array);
  assert.ok(surfaceGeometry.index.array instanceof Uint16Array);
  assert.equal(positions.array.length, positions.count * positions.itemSize);
  assert.equal(surfaceGeometry.index.array.length, surfaceGeometry.index.count);
  assert.equal(surfaceGeometry.userData.capPolicy, "none");
  for (let index = 0; index < 6; index += 1) {
    assert.ok(Math.abs(Math.hypot(positions.getX(index), positions.getZ(index)) - 2) < 1e-6);
  }
  for (let index = 6; index < 12; index += 1) {
    assert.ok(Math.abs(Math.hypot(positions.getX(index), positions.getZ(index)) - 1) < 1e-6);
    assert.ok(Math.abs(positions.getY(index) - 10) < 1e-6);
  }

  const lineRoot = createObservedSwcCenterlines(geometry, { colors });
  assert.equal(lineRoot.children.length, 1);
  assert.equal(lineRoot.children[0].geometry.getAttribute("position").count, 2);
  assert.ok(lineRoot.children[0].geometry.getAttribute("position").array instanceof Float32Array);
  assert.equal(lineRoot.children[0].userData.representation, "observed_standardized_swc_centerlines");
});

test("renderer preallocates exact typed buffers per visible source type", () => {
  const segmentCount = 5_462;
  const geometry = {
    neuronId: 2,
    sourceFrame: "source-local",
    displayTransform: {
      originMicrometre: [0, 0, 0],
      scaleViewerUnitPerMicrometre: 1,
    },
    segments: [
      ...Array.from({ length: segmentCount }, (_, index) => [
        index, 0, 0, 1,
        index, 1, 0, 0.5,
        3, "dendrite_type_3",
      ]),
      [0, 0, 0, 2, 0, 0, 0, 1, 3, "dendrite_type_3"],
      [0, 0, 0, 1, 0, 1, 0, 1, 2, "axon_type_2"],
      [0, 0, 0, 1, 0, 1, 0, 1, 6, "uninterpreted_type_6"],
    ],
  };
  const colors = { 2: 0x234567, 3: 0x345678, 6: 0x456789 };
  const hiddenTypes = new Set([6]);
  const surfaceRoot = createRadiusDerivedSurface(geometry, { colors, hiddenTypes });

  assert.equal(surfaceRoot.children.length, 2, "one draw object should be emitted per visible source type");
  const dendriteGeometry = surfaceRoot.getObjectByName("radius-derived-source-type-3").geometry;
  const axonGeometry = surfaceRoot.getObjectByName("radius-derived-source-type-2").geometry;
  assert.equal(dendriteGeometry.userData.admittedSegmentCount, segmentCount);
  assert.equal(dendriteGeometry.getAttribute("position").count, segmentCount * 12);
  assert.equal(dendriteGeometry.index.count, segmentCount * 36);
  assert.ok(dendriteGeometry.getAttribute("position").array instanceof Float32Array);
  assert.ok(dendriteGeometry.index.array instanceof Uint32Array, "large per-type buffers must not truncate 32-bit indices");
  assert.equal(dendriteGeometry.getAttribute("position").array.length, segmentCount * 12 * 3);
  assert.equal(dendriteGeometry.index.array.length, segmentCount * 36);
  assert.equal(axonGeometry.getAttribute("position").count, 12);
  assert.equal(axonGeometry.index.count, 36);
  assert.ok(axonGeometry.index.array instanceof Uint16Array);
  assert.equal(surfaceRoot.getObjectByName("radius-derived-source-type-6"), undefined);

  const lineRoot = createObservedSwcCenterlines(geometry, { colors, hiddenTypes });
  const dendriteLines = lineRoot.getObjectByName("observed-swc-source-type-3").geometry.getAttribute("position");
  assert.equal(dendriteLines.count, (segmentCount + 1) * 2, "centerlines retain zero-length source edges");
  assert.ok(dendriteLines.array instanceof Float32Array);
  assert.equal(dendriteLines.array.length, dendriteLines.count * dendriteLines.itemSize);
  assert.equal(lineRoot.getObjectByName("observed-swc-source-type-6"), undefined);
});
