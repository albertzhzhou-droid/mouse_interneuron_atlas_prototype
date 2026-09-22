import assert from "node:assert/strict";
import test from "node:test";
import {
  fitProjectionToViewport,
  projectPointToViewport,
  projectSourceLocalMorphology,
} from "../app/morphology-projection.js";

const geometry = {
  neuronId: 99,
  geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
  segments: [
    [-2, 1, 0, 1, 4, 7, 0, .5, 3, "dendrite_type_3"],
    [4, 7, 0, .5, 10, -3, 0, .2, 2, "axon_type_2"],
  ],
};

test("projects exact source coordinates without mutating geometry", () => {
  const original = structuredClone(geometry);
  const projection = projectSourceLocalMorphology(geometry, "xy");
  assert.deepEqual(geometry, original);
  assert.equal(projection.algorithmId, "source_local_orthographic_segment_projection_v1");
  assert.equal(projection.registrationCount, 0);
  assert.equal(projection.displayScalePolicy, "fit_per_record");
  assert.deepEqual(projection.sourceTypes, [2, 3]);
  assert.deepEqual(projection.bounds, {
    minX: -2,
    maxX: 10,
    minY: -3,
    maxY: 7,
    widthMicrometre: 12,
    heightMicrometre: 10,
  });
  assert.deepEqual(projection.segments[0], { x1: -2, y1: 1, x2: 4, y2: 7, sourceType: 3 });
});

test("retains flat z evidence in XZ and YZ projections", () => {
  const xz = projectSourceLocalMorphology(geometry, "xz");
  const yz = projectSourceLocalMorphology(geometry, "yz");
  assert.equal(xz.bounds.heightMicrometre, 0);
  assert.equal(yz.bounds.heightMicrometre, 0);
  assert.equal(xz.bounds.widthMicrometre, 12);
  assert.equal(yz.bounds.widthMicrometre, 10);
});

test("fits each projection independently and declares apparent scale incomparable", () => {
  const projection = projectSourceLocalMorphology(geometry, "xy");
  const fit = fitProjectionToViewport(projection, 240, 180, 10);
  assert.equal(fit.displayOnly, true);
  assert.equal(fit.comparableApparentScale, false);
  assert.equal(fit.scalePixelPerMicrometre, 16);
  const min = projectPointToViewport({ x: -2, y: -3 }, fit);
  const max = projectPointToViewport({ x: 10, y: 7 }, fit);
  assert.deepEqual(min, { x: 24, y: 170 });
  assert.deepEqual(max, { x: 216, y: 10 });
});

test("fails closed on unsupported planes or invalid coordinates", () => {
  assert.throws(() => projectSourceLocalMorphology(geometry, "pca"), /Unsupported/);
  const invalid = structuredClone(geometry);
  invalid.segments[0][0] = Number.NaN;
  assert.throws(() => projectSourceLocalMorphology(invalid, "xy"), /non-finite/);
});
