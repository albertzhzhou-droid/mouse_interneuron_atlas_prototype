import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addSamplingLabelRows, analyzeSourceSampling, buildNestedMidpointSampling,
  validateSamplingIndices, validateSamplingStateRuns,
} from "../app/atlas-sampling-sensitivity.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(await readFile(resolve(ROOT, "data/atlas-sampling-sensitivity-0.1.json")));
const h = "a".repeat(64);
const runs = [
  { stateIndex: 1, zStartInclusive: 0, zEndInclusive: 1, sha256: h },
  { stateIndex: 2, zStartInclusive: 2, zEndInclusive: 5, sha256: h },
  { stateIndex: 3, zStartInclusive: 6, zEndInclusive: 9, sha256: h },
];
const labels = [
  { identifier: 1, name: "Broad label", semanticLaneId: "anatomy", fullSourceVoxelCount: 40, planeVoxelCounts: [2, 3, 6] },
  { identifier: 2, name: "Short-run label", semanticLaneId: "context", fullSourceVoxelCount: 10, planeVoxelCounts: [5, 0, 0] },
];
const strategy = (id, sampledZIndices) => ({ id, sampledZIndices, label: id, definition: "test", evidenceStatus: "synthetic", evidenceLocators: [] });

test("run-weighted representation differs from actual sampled voxel budget", () => {
  const [sparse, redundant, complete] = analyzeSourceSampling({ depth: 10, runs, labels, strategies: [strategy("sparse", [2]), strategy("redundant", [2, 3]), strategy("complete", [0, 2, 6])] });
  assert.equal(sparse.coveredStateCount, 1);
  assert.equal(sparse.representedNativePlaneCount, 4);
  assert.equal(sparse.totals.sampledVoxelCount, 3);
  assert.equal(sparse.totals.representedStateVoxelCount, 12);
  assert.equal(redundant.coveredStateCount, 1);
  assert.equal(redundant.totals.sampledVoxelCount, 6);
  assert.equal(redundant.totals.representedStateVoxelCount, 12);
  assert.equal(complete.totals.representedStateVoxelCount, 50);
  assert.equal(complete.totals.representedStateVoxelFraction, 1);
  assert.equal(complete.totals.sampledVoxelCount, 16);
  assert.equal(sparse.labels[1].presenceStatus, "source_present_but_not_sampled");
  assert.deepEqual(sparse.labels[1].missedPresenceStateIndices, [1]);
  assert.equal(sparse.semanticLanes.find((lane) => lane.semanticLaneId === "context").sampledLabelCount, 0);
});

test("native partitions and indices reject gaps, overlap, duplicate, outside and unsafe values", () => {
  const gap = structuredClone(runs); gap[1].zStartInclusive = 3;
  const overlap = structuredClone(runs); overlap[1].zStartInclusive = 1;
  const duplicate = structuredClone(runs); duplicate[1].stateIndex = 1;
  const missingHash = structuredClone(runs); missingHash[0].sha256 = "invented";
  for (const broken of [gap, overlap, duplicate, missingHash, runs.slice(0, 2)]) assert.throws(() => validateSamplingStateRuns(broken, 10));
  for (const indices of [[], [1, 1], [2, 1], [-1], [10], [Number.MAX_SAFE_INTEGER + 1], [1.2]]) assert.throws(() => validateSamplingIndices(indices, 10));
  assert.throws(() => analyzeSourceSampling({ depth: 10, runs, labels: [{ ...labels[0], fullSourceVoxelCount: 45 }], strategies: [strategy("one", [0])] }), /disagrees/);
  assert.throws(() => analyzeSourceSampling({ depth: 10, runs, labels: [labels[0], labels[0]], strategies: [strategy("one", [0])] }), /Duplicate label/);
  assert.throws(() => analyzeSourceSampling({ depth: 10, runs, labels, strategies: [strategy("one", [0]), strategy("one", [2])] }), /duplicate strategy/);
});

test("exact XY RLE rejects fabricated/overlapping masks and respects native row bounds", () => {
  const plane = new Uint32Array(12);
  assert.equal(addSamplingLabelRows(plane, [0, 1, 2, 2, 0, 4], 7, 3, 4), 6);
  assert.deepEqual([...plane], [0, 7, 7, 0, 0, 0, 0, 0, 7, 7, 7, 7]);
  assert.throws(() => addSamplingLabelRows(plane, [0, 2, 1], 8, 3, 4), /overlap/);
  for (const rows of [[3, 0, 1], [0, 3, 2], [0, 0, 0], [1, 0, 1, 0, 0, 1], [0, 0, 3, 0, 2, 1], [0, 0]]) {
    assert.throws(() => addSamplingLabelRows(new Uint32Array(12), rows, 7, 3, 4));
  }
  assert.throws(() => addSamplingLabelRows(new Uint32Array(12), [], 0x100000000, 3, 4), /uint32/);
  assert.equal(addSamplingLabelRows(new Uint32Array(12), [], 7, 3, 4), 0);
});

test("denser strategy preserves exact existing indices and inserts declared integer midpoints", () => {
  assert.deepEqual(buildNestedMidpointSampling([0, 1, 5, 9], 10), [0, 1, 3, 5, 7, 9]);
  const current = report.strategies.find((s) => s.id === "current_38");
  const denser = report.strategies.find((s) => s.id === "nested_midpoint_75");
  assert.deepEqual(buildNestedMidpointSampling(current.sampledZIndices, 1567), denser.sampledZIndices);
  assert.equal(denser.sampledPlaneCount, 75);
  assert.ok(current.sampledZIndices.every((z) => denser.sampledZIndices.includes(z)));
});

test("fixed source distinguishes archived planes, generator-only historical grid and new counting strategy", () => {
  const [old15, old33, current, dense] = report.strategies;
  assert.deepEqual(old15.sampledZIndices, [98, 196, 294, 392, 490, 588, 686, 784, 882, 980, 1078, 1176, 1274, 1372, 1470]);
  assert.equal(old15.evidenceStatus, "actual_archived_plane_assets_verified");
  assert.equal(old33.evidenceStatus, "generator_declaration_only_historical_output_not_available");
  assert.equal(report.gates.historical33Output, "not_available_generator_declaration_only");
  assert.equal(current.evidenceStatus, "actual_current_plane_assets_verified");
  assert.equal(dense.evidenceStatus, "new_declared_counting_strategy_no_slice_assets_emitted");
  assert.deepEqual(report.strategies.map((s) => s.coveredStateCount), [15, 27, 32, 32]);
  assert.deepEqual(report.strategies.map((s) => s.totals.sampledLabelCount), [63, 70, 73, 73]);
  assert.deepEqual(old33.missedStateIndices, [2, 4, 7, 20, 26]);
  assert.deepEqual(report.strategies.map((s) => s.totals.representedStateVoxelCount), [21198654, 33761054, 38845542, 38845542]);
  assert.deepEqual(report.strategies.map((s) => s.totals.sampledVoxelCount), [372128, 814512, 988126, 1961032]);
  assert.deepEqual(old33.labels.filter((l) => l.sampledVoxelCount === 0).map((l) => l.identifier), [44, 51, 59]);
  assert.equal(old15.labels.find((l) => l.identifier === 25).presenceStatus, "source_present_but_not_sampled");
  assert.deepEqual(current.labels.map((l) => l.representedStateVoxelFraction), Array(73).fill(1));
  assert.deepEqual(current.semanticLanes.map((lane) => lane.directLabelCount).sort((a, b) => a - b), [3, 33, 37]);
});

test("scope excludes biological error, geometric precision, registration and parent-only direct counts", () => {
  assert.equal(report.geometryStatus, "INF");
  assert.equal(report.measurementUse, "forbidden");
  assert.equal(report.registrationCount, 0);
  assert.equal(report.gates.independentBiologicalError, "not_estimated");
  for (const key of ["geometryComparison", "precision", "registration", "anatomicalInterpolation"]) assert.equal(report.gates[key], "closed");
  assert.equal(report.source.sourceSemanticReverified, true);
  assert.equal(report.source.rawZarrObjectInventoryReverified, false);
  assert.equal(report.source.semanticSha256, "1e5ee2daaeabd3505572f5efdb92e700387f7bd794720e78ec21511338500d12");
  assert.equal(report.strategies[0].totals.fullSourceVoxelCount, 38845542);
  for (const parentId of [22, 71, 74, 75, 90, 100, 110, 120, 130, 250]) assert.ok(report.strategies.every((s) => !s.labels.some((l) => l.identifier === parentId)));
  assert.equal(report.inputReceipts.filter((receipt) => receipt.path.includes("/structures/")).length, 73);
  assert.equal(report.inputReceipts.filter((receipt) => /slice-z\d+\.png$/.test(receipt.path)).length, 53);
});

test("offline builder rechecks every byte receipt, 32 reconstructed plane hashes and full semantic digest", async () => {
  const { stdout } = await promisify(execFile)(process.execPath, ["tools/build_atlas_sampling_sensitivity.mjs", "--check"], { cwd: ROOT });
  assert.match(stdout, /source semantic SHA-256 verified/);
});
