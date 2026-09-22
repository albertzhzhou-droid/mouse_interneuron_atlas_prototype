import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildAtlasFineAnatomyGeometry,
} from "../app/atlas-reference-geometry.js";
import {
  ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS,
  ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS,
  ATLAS_NATIVE_VOLUME_SEMANTIC_SHA256,
  expandNativeVolumeQuadsToDisplayGeometry,
  nativeVoxelEdgeZyxToAtlasDisplay,
  validateAtlasNativeVolumeManifest,
  validateAtlasNativeVolumeStructure,
  validateNativeVolumeStateRuns,
} from "../app/atlas-native-volume-surface.js";
import {
  auditNativeVolumeUnitFaceCoverage,
  validateAtlasNativeVolumes,
} from "../scripts/validate-atlas-native-volumes.mjs";

const fineAnatomy = JSON.parse(
  await readFile(new URL("../public/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json", import.meta.url), "utf8"),
);
const manifest = JSON.parse(
  await readFile(new URL("../public/data/allen_cord_20um_native_volume_v2/asset-manifest.json", import.meta.url), "utf8"),
);
const firstRecord = manifest.records[0];
const firstPayload = JSON.parse(
  await readFile(new URL(`../public/data/allen_cord_20um_native_volume_v2/${firstRecord.path}`, import.meta.url), "utf8"),
);

test("validates the 73-label three-lane lazy native-volume asset and exact mask-to-surface fidelity", async () => {
  const report = await validateAtlasNativeVolumes();
  assert.deepEqual(
    Object.fromEntries(Object.keys(ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS).map((key) => [key, report[key]])),
    ATLAS_NATIVE_VOLUME_EXPECTED_TOTALS,
  );
  assert.equal(manifest.generator.nodeVersion, "v26.0.0");
  assert.equal(manifest.generator.deterministic, true);
  assert.equal(manifest.generator.determinismScope, "pinned_inputs_generator_bytes_and_node_version");
});

test("keeps exact-label native volumes in three non-count semantic lanes", () => {
  const validated = validateAtlasNativeVolumeManifest(manifest, fineAnatomy);
  assert.equal(validated.sourceVolume.semanticSha256, ATLAS_NATIVE_VOLUME_SEMANTIC_SHA256);
  assert.deepEqual(
    validated.semanticLanes.map((lane) => [
      lane.semanticLaneId,
      lane.defaultVisibility,
      lane.includedInInterneuronCounts,
      lane.totals,
    ]),
    [
      ["interneuron_focused_anatomy", "on", false, ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS.interneuron_focused_anatomy],
      ["structural_context", "on", false, ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS.structural_context],
      ["motor_context", "off", false, ATLAS_NATIVE_VOLUME_EXPECTED_LANE_TOTALS.motor_context],
    ],
  );
  assert.equal(validated.countPolicy.directSourceLabelCount, 73);
  assert.equal(validated.countPolicy.atlasRegionCountsAreInterneuronCounts, false);
  assert.ok(validated.records.every((record) => record.includedInInterneuronCounts === false));
  assert.equal(new Set(validated.records.map((record) => record.identifier)).size, 73);
  assert.equal(validated.surfacePolicy.interpolation, "none");
  assert.equal(validated.surfacePolicy.smoothing, "none");
  assert.equal(validated.measurementUse, "forbidden");
  assert.equal(validated.registrationCount, 0);
});

test("validates the native manifest against the viewer-normalized fine-anatomy contract", () => {
  const normalizedFineAnatomy = buildAtlasFineAnatomyGeometry(fineAnatomy);
  const validated = validateAtlasNativeVolumeManifest(manifest, normalizedFineAnatomy);
  assert.equal(validated.records.length, 73);
  assert.deepEqual(
    validated.semanticLanes.map((lane) => lane.semanticLaneId),
    ["interneuron_focused_anatomy", "structural_context", "motor_context"],
  );
});

test("rejects cross-lane count inflation, visibility drift and duplicate source IDs", () => {
  const inflated = structuredClone(manifest);
  inflated.records.find((record) => record.semanticLaneId === "motor_context").includedInInterneuronCounts = true;
  assert.throws(() => validateAtlasNativeVolumeManifest(inflated, fineAnatomy), /record .* changed|count boundary/);

  const visibleMotor = structuredClone(manifest);
  visibleMotor.semanticLanes.find((lane) => lane.semanticLaneId === "motor_context").defaultVisibility = "on";
  assert.throws(() => validateAtlasNativeVolumeManifest(visibleMotor, fineAnatomy), /motor_context manifest lane changed/);

  const duplicate = structuredClone(manifest);
  const motorIndex = duplicate.records.findIndex((record) => record.semanticLaneId === "motor_context");
  duplicate.records[motorIndex].identifier = duplicate.records[0].identifier;
  assert.throws(() => validateAtlasNativeVolumeManifest(duplicate, fineAnatomy), /record .* changed/);
});

test("pins representative structural and motor context surface metrics", () => {
  const expected = new Map([
    [16, [61_786, 251, 45_180, 650, 1_300]],
    [65, [8_329_606, 6_180, 1_058_026, 19_164, 38_328]],
    [70, [7_104_040, 2_897, 766_924, 15_131, 30_262]],
    [29, [305_434, 848, 145_024, 3_296, 6_592]],
    [60, [7_200, 30, 3_384, 108, 216]],
  ]);
  for (const [identifier, metrics] of expected) {
    const record = manifest.records.find((candidate) => candidate.identifier === identifier);
    assert.ok(record);
    assert.deepEqual(
      [record.sourceVoxelCount, record.rowRunCount, record.exposedUnitFaceCount, record.greedyQuadCount, record.triangleCount],
      metrics,
    );
  }
});

test("validates context payloads against their declared lane and rejects reassignment", async () => {
  const record = manifest.records.find((candidate) => candidate.identifier === 16);
  const expected = fineAnatomy.structuralContextStructures.find((candidate) => candidate.identifier === 16);
  assert.ok(record && expected);
  const payload = JSON.parse(
    await readFile(new URL(`../public/data/allen_cord_20um_native_volume_v2/${record.path}`, import.meta.url), "utf8"),
  );
  validateAtlasNativeVolumeStructure(payload, record, expected);
  const reassigned = structuredClone(record);
  reassigned.semanticLaneId = "interneuron_focused_anatomy";
  assert.throws(
    () => validateAtlasNativeVolumeStructure(payload, reassigned, expected),
    /source-label identity changed/,
  );
});

test("uses distinct voxel-centre and voxel-edge conventions without a half-voxel shift", () => {
  assert.deepEqual(nativeVoxelEdgeZyxToAtlasDisplay([0.5, 126.5, 161]), [0, 0, 20]);
  const edgeOrigin = nativeVoxelEdgeZyxToAtlasDisplay([0, 0, 0]);
  assert.ok(Math.abs(edgeOrigin[0] + 1.61) < 1e-12);
  assert.ok(Math.abs(edgeOrigin[1] - 1.265) < 1e-12);
  assert.ok(Math.abs(edgeOrigin[2] - (20 + 0.01 * 1.277139)) < 1e-12);
  const validated = validateAtlasNativeVolumeStructure(firstPayload, firstRecord, fineAnatomy.structures[0]);
  const geometry = expandNativeVolumeQuadsToDisplayGeometry(validated.surface.quadsAxisSidePlaneUvStartLength);
  assert.equal(geometry.positions.length, firstRecord.greedyQuadCount * 4 * 3);
  assert.equal(geometry.indices.length, firstRecord.triangleCount * 3);

  const yFace = expandNativeVolumeQuadsToDisplayGeometry([1, 1, 4, 7, 9, 3, 5]);
  const xCoordinates = yFace.positions.filter((_, index) => index % 3 === 0);
  const zCoordinates = yFace.positions.filter((_, index) => index % 3 === 2);
  assert.ok(Math.abs(Math.min(...xCoordinates) - nativeVoxelEdgeZyxToAtlasDisplay([9, 4, 7])[0]) < 1e-12);
  assert.ok(Math.abs(Math.max(...xCoordinates) - nativeVoxelEdgeZyxToAtlasDisplay([9, 4, 10])[0]) < 1e-12);
  assert.ok(Math.abs(Math.max(...zCoordinates) - nativeVoxelEdgeZyxToAtlasDisplay([9, 4, 7])[2]) < 1e-12);
  assert.ok(Math.abs(Math.min(...zCoordinates) - nativeVoxelEdgeZyxToAtlasDisplay([14, 4, 7])[2]) < 1e-12);
  assert.throws(
    () => expandNativeVolumeQuadsToDisplayGeometry([1, 1, 4, 0, 0, 323, 1]),
    /leaves the pinned voxel-edge grid/,
  );
});

test("keeps all six native face directions outward after the handedness-changing display transform", () => {
  const transformedOutward = [
    [[0, 0, 1], [0, 0, -1]],
    [[0, 1, 0], [0, -1, 0]],
    [[-1, 0, 0], [1, 0, 0]],
  ];
  for (const axis of [0, 1, 2]) {
    for (const side of [-1, 1]) {
      const geometry = expandNativeVolumeQuadsToDisplayGeometry([axis, side, 1, 1, 1, 1, 1]);
      const [a, b, c] = [0, 1, 2].map((vertex) => geometry.positions.slice(vertex * 3, vertex * 3 + 3));
      const ab = b.map((value, index) => value - a[index]);
      const ac = c.map((value, index) => value - a[index]);
      const normal = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ];
      const expected = transformedOutward[axis][side > 0 ? 1 : 0];
      const dot = normal.reduce((sum, value, index) => sum + value * expected[index], 0);
      assert.ok(dot > 0, `axis ${axis} side ${side} must retain outward display-space winding`);
    }
  }
});

test("rejects non-canonical adjacent row-RLE runs", () => {
  const states = structuredClone(firstPayload.mask.sourceStateRuns);
  const state = states.find((candidate) =>
    candidate.rowsYxStartLength.some((_, index) => index % 3 === 2 && candidate.rowsYxStartLength[index] > 1),
  );
  assert.ok(state);
  const lengthOffset = state.rowsYxStartLength.findIndex(
    (value, index) => index % 3 === 2 && value > 1,
  );
  const runOffset = lengthOffset - 2;
  const [y, xStart, length] = state.rowsYxStartLength.slice(runOffset, runOffset + 3);
  state.rowsYxStartLength.splice(runOffset, 3, y, xStart, 1, y, xStart + 1, length - 1);
  assert.throws(
    () => validateNativeVolumeStateRuns(states),
    /not canonical or overlaps/,
  );
});

test("rejects invented voxels, altered faces and smoothing", () => {
  const inventedVoxel = structuredClone(firstPayload);
  inventedVoxel.mask.sourceStateRuns[0].rowsYxStartLength[2] += 1;
  inventedVoxel.mask.sourceStateRuns[0].planeVoxelCount += 1;
  assert.throws(
    () => validateAtlasNativeVolumeStructure(inventedVoxel, firstRecord, fineAnatomy.structures[0]),
    /voxel count changed|exactly reproduces/,
  );

  const alteredFace = structuredClone(firstPayload);
  alteredFace.surface.quadsAxisSidePlaneUvStartLength[alteredFace.surface.quadsAxisSidePlaneUvStartLength.length - 1] += 1;
  assert.throws(
    () => validateAtlasNativeVolumeStructure(alteredFace, firstRecord, fineAnatomy.structures[0]),
    /exactly reproduces/,
  );

  const smoothed = structuredClone(firstPayload);
  smoothed.surface.smoothing = "gaussian";
  assert.throws(
    () => validateAtlasNativeVolumeStructure(smoothed, firstRecord, fineAnatomy.structures[0]),
    /undeclared geometry operation/,
  );
});

test("independently detects a missing, duplicated or oppositely oriented unit face", () => {
  const oneVoxelState = [{
    stateIndex: 1,
    zStartInclusive: 0,
    zEndInclusive: 0,
    planeVoxelCount: 1,
    rowsYxStartLength: [0, 0, 1],
  }];
  const exactSixFaces = [
    0, -1, 0, 0, 0, 1, 1,
    0, 1, 1, 0, 0, 1, 1,
    1, -1, 0, 0, 0, 1, 1,
    1, 1, 1, 0, 0, 1, 1,
    2, -1, 0, 0, 0, 1, 1,
    2, 1, 1, 0, 0, 1, 1,
  ];
  assert.deepEqual(
    auditNativeVolumeUnitFaceCoverage(oneVoxelState, exactSixFaces, [1, 1, 1]),
    {
      sourceUnitFaceCount: 6,
      decodedSurfaceUnitFaceCount: 6,
      missingUnitFaceCount: 0,
      extraUnitFaceCount: 0,
    },
  );
  const missing = auditNativeVolumeUnitFaceCoverage(oneVoxelState, exactSixFaces.slice(7), [1, 1, 1]);
  assert.equal(missing.missingUnitFaceCount, 1);
  assert.equal(missing.extraUnitFaceCount, 0);
  const duplicate = auditNativeVolumeUnitFaceCoverage(
    oneVoxelState,
    [...exactSixFaces, ...exactSixFaces.slice(0, 7)],
    [1, 1, 1],
  );
  assert.equal(duplicate.missingUnitFaceCount, 0);
  assert.equal(duplicate.extraUnitFaceCount, 1);
  const wrongSide = [...exactSixFaces];
  wrongSide[1] = 1;
  const oriented = auditNativeVolumeUnitFaceCoverage(oneVoxelState, wrongSide, [1, 1, 1]);
  assert.equal(oriented.missingUnitFaceCount, 1);
  assert.equal(oriented.extraUnitFaceCount, 1);
});
