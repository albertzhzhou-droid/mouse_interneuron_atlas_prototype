import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MORPHOLOGY_COMPARISON_IDS,
  addMorphologyComparisonId,
  normalizeMorphologyComparisonIds,
  normalizeMorphologyView,
  parseMorphologyComparisonIds,
  removeMorphologyComparisonId,
  replaceMorphologyComparisonId,
} from "../app/morphology-matrix-state.js";

const available = [104003, 108974, 109005, 242822, 260150];

test("restores only four known unique comparison records", () => {
  assert.deepEqual(parseMorphologyComparisonIds("109005,260150,109005,nope,-1"), [109005, 260150, 109005]);
  assert.deepEqual(
    normalizeMorphologyComparisonIds([109005, 999999, 109005, 260150, 242822, 108974, 104003], available, []),
    [109005, 260150, 242822, 108974],
  );
});

test("restores mixed census and supplementary ids without changing collection membership", () => {
  const mixedAvailable = [...available, 45674, 45718, 50394, 50408, 50424, 170035, 249676];
  assert.deepEqual(
    normalizeMorphologyComparisonIds([45674, 109005], mixedAvailable, DEFAULT_MORPHOLOGY_COMPARISON_IDS),
    [45674, 109005],
    "a valid two-record URL selection must not be padded to four",
  );
  assert.deepEqual(
    normalizeMorphologyComparisonIds([45674, 109005, 249676], mixedAvailable, DEFAULT_MORPHOLOGY_COMPARISON_IDS),
    [45674, 109005, 249676],
    "a valid three-record URL selection must not be padded to four",
  );
  assert.deepEqual(
    normalizeMorphologyComparisonIds(
      parseMorphologyComparisonIds("45674,109005,249676,45718"),
      mixedAvailable,
      DEFAULT_MORPHOLOGY_COMPARISON_IDS,
    ),
    [45674, 109005, 249676, 45718],
  );
  assert.deepEqual(
    normalizeMorphologyComparisonIds([45674, 249676], available, []),
    [104003, 108974],
    "census-only callers must fail supplementary ids closed and retain their own minimum pair",
  );
});

test("uses four source-diverse defaults and maintains a minimum pair", () => {
  assert.deepEqual(normalizeMorphologyComparisonIds([], available, DEFAULT_MORPHOLOGY_COMPARISON_IDS), [109005, 108974, 104003, 260150]);
  assert.deepEqual(normalizeMorphologyComparisonIds([242822], available, []), [242822, 104003]);
});

test("adds, replaces, and removes without duplicates or out-of-range IDs", () => {
  assert.deepEqual(addMorphologyComparisonId([109005, 260150], 242822, available), [109005, 260150, 242822]);
  assert.deepEqual(addMorphologyComparisonId([109005, 260150], 999999, available), [109005, 260150]);
  assert.deepEqual(replaceMorphologyComparisonId([109005, 260150], 1, 242822, available), [109005, 242822]);
  assert.deepEqual(replaceMorphologyComparisonId([109005, 260150], 1, 109005, available), [109005, 260150]);
  assert.deepEqual(removeMorphologyComparisonId([109005, 260150, 242822], 260150, available), [109005, 242822]);
  assert.deepEqual(removeMorphologyComparisonId([109005, 260150], 260150, available), [109005, 260150]);
});

test("accepts all five research views and fails unknown views to the exact universe", () => {
  for (const view of ["universe", "individual", "matrix", "compare", "cohorts"]) assert.equal(normalizeMorphologyView(view), view);
  assert.equal(normalizeMorphologyView("overlay"), "universe");
});
