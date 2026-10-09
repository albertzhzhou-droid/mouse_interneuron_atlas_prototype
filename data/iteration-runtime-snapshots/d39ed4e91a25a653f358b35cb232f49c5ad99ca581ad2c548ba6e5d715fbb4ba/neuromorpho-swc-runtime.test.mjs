import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  loadVerifiedUniverseSwc,
  parseNeuromorphoSwc,
} from "../app/neuromorpho-swc-runtime.js";

const encoder = new TextEncoder();

const VALID_SWC = [
  "# exact source-local test object",
  "",
  "3 3 3 4 0 0.25 2",
  "1 1 0 0 0 1 -1",
  "2 6 0 0 0 0.5 1",
  "4 2 3 4 0 0.125 2",
  "",
].join("\n");

function sha256(value) {
  const bytes = value instanceof Uint8Array ? value : encoder.encode(value);
  return createHash("sha256").update(bytes).digest("hex");
}

function universeRecord(text = VALID_SWC, overrides = {}) {
  const neuronId = overrides.neuronId ?? 700001;
  const bytes = encoder.encode(text);
  return {
    assetId: `NeuroMorpho:${neuronId}`,
    neuronId,
    normalizedMetadata: {
      name: "runtime-fixture",
      dimensionality: "3D",
      sourceDiameterAvailable: true,
      sourceFrame: "NeuroMorpho_CNG_standardized_local_frame",
      ...overrides.normalizedMetadata,
    },
    swc: {
      neuronId,
      path: `/data/neuromorpho_no_age_universe_v1/swc/nmo-${neuronId}.swc`,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      ...overrides.swc,
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => !["normalizedMetadata", "swc"].includes(key))),
  };
}

function responseFor(text, { ok = true, status = 200 } = {}) {
  const bytes = encoder.encode(text);
  return {
    ok,
    status,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}

test("parses strict seven-column UTF-8 SWC into GeometryPayload-compatible exact nodes and segments", () => {
  const geometry = parseNeuromorphoSwc(encoder.encode(VALID_SWC), {
    assetId: "NeuroMorpho:700001",
    neuronId: 700001,
    name: "runtime-fixture",
    dimensionality: "3D",
  });

  assert.deepEqual(geometry.nodeColumns, ["id", "type", "x", "y", "z", "radius", "parent"]);
  assert.deepEqual(geometry.nodes, [
    [1, 1, 0, 0, 0, 1, -1],
    [2, 6, 0, 0, 0, 0.5, 1],
    [3, 3, 3, 4, 0, 0.25, 2],
    [4, 2, 3, 4, 0, 0.125, 2],
  ]);
  assert.deepEqual(geometry.segments, [
    [0, 0, 0, 1, 0, 0, 0, 0.5, 6, "uninterpreted_neurite_type_6"],
    [0, 0, 0, 0.5, 3, 4, 0, 0.25, 3, "dendrite_type_3"],
    [0, 0, 0, 0.5, 3, 4, 0, 0.125, 2, "axon_type_2"],
  ]);
  assert.deepEqual(geometry.computed.boundsMicrometre, { min: [0, 0, 0], max: [3, 4, 0] });
  assert.deepEqual(geometry.computed.extentMicrometre, [3, 4, 0]);
  assert.deepEqual(geometry.computed.nodeTypeCounts, { 1: 1, 2: 1, 3: 1, 6: 1 });
  assert.equal(geometry.computed.segmentCount, 3);
  assert.equal(geometry.computed.zeroLengthEdgeCount, 1);
  assert.equal(geometry.computed.totalCableLengthMicrometre, 10);
  assert.equal(geometry.qc.connected, true);
  assert.equal(geometry.qc.acyclic, true);
});

test("retains no-diameter radii and 2D z coordinates while authorizing no surface and no extrusion", () => {
  const geometry = parseNeuromorphoSwc(
    "1 1 0 0 -2 4 -1\n2 3 1 2 7 0.375 1\n",
    { dimensionality: "2D", diameterAuthorized: false },
  );

  assert.equal(geometry.dimensionality, "2D");
  assert.equal(geometry.extrusionApplied, false);
  assert.equal(geometry.zCoordinatePolicy, "preserve_source_values_never_extrude");
  assert.deepEqual(geometry.nodes.map((row) => [row[4], row[5]]), [[-2, 4], [7, 0.375]]);
  assert.deepEqual(geometry.segments[0].slice(2, 8), [-2, 4, 1, 2, 7, 0.375]);
  assert.equal(geometry.rawRadiusPreserved, true);
  assert.equal(geometry.radiusSurfaceAuthorized, false);
  assert.equal(geometry.swc.radiusSurfaceAuthorized, false);
  assert.deepEqual(geometry.computed.radiusDerived, {
    value: null,
    missingReason: "official_attributes_report_no_diameter",
  });
});

test("rejects malformed identity, numeric, root, parent, and topology states", () => {
  const invalidCases = [
    ["column count", "1 1 0 0 0 1\n", /exactly 7 columns/],
    ["integer ID", "1.5 1 0 0 0 1 -1\n", /strict integer/],
    ["finite coordinate", "1 1 NaN 0 0 1 -1\n", /finite number/],
    ["positive radius", "1 1 0 0 0 0 -1\n", /radius must be positive/],
    ["duplicate", "1 1 0 0 0 1 -1\n1 3 1 0 0 1 1\n", /duplicates node ID/],
    ["two roots", "1 1 0 0 0 1 -1\n2 3 1 0 0 1 -1\n", /exactly one root/],
    ["missing parent", "1 1 0 0 0 1 -1\n2 3 1 0 0 1 9\n", /missing parent 9/],
    ["cycle", "1 1 0 0 0 1 -1\n2 3 1 0 0 1 3\n3 3 2 0 0 1 2\n", /contains a cycle/],
  ];
  for (const [label, value, pattern] of invalidCases) {
    assert.throws(() => parseNeuromorphoSwc(value), pattern, label);
  }
  assert.throws(
    () => parseNeuromorphoSwc(Uint8Array.of(0xc3, 0x28)),
    /not valid UTF-8/,
  );
});

test("loads only a byte- and checksum-verified record with matching identity and path", async () => {
  const record = universeRecord();
  const requested = [];
  const geometry = await loadVerifiedUniverseSwc(
    record,
    async (path) => {
      requested.push(path);
      return responseFor(VALID_SWC);
    },
    async (bytes) => sha256(bytes),
  );

  assert.deepEqual(requested, [record.swc.path]);
  assert.equal(geometry.assetId, record.assetId);
  assert.equal(geometry.neuronId, record.neuronId);
  assert.deepEqual(geometry.source, {
    path: record.swc.path,
    bytes: record.swc.bytes,
    sha256: record.swc.sha256,
    verified: true,
    transport: "standardized_swc",
  });
  assert.equal(geometry.segments.length, 3);
});

test("loader fails closed on checksum mutation, byte drift, request failure, and record/path mismatch", async () => {
  const record = universeRecord();
  const hash = async (bytes) => sha256(bytes);
  await assert.rejects(
    loadVerifiedUniverseSwc(record, async () => responseFor(VALID_SWC.replace("0.25", "0.26")), hash),
    /checksum mismatch/,
  );
  await assert.rejects(
    loadVerifiedUniverseSwc(record, async () => responseFor(`${VALID_SWC}# extra byte\n`), hash),
    /byte receipt mismatch/,
  );
  await assert.rejects(
    loadVerifiedUniverseSwc(record, async () => responseFor(VALID_SWC, { ok: false, status: 404 }), hash),
    /request failed \(404\)/,
  );
  await assert.rejects(
    loadVerifiedUniverseSwc({ ...record, assetId: "NeuroMorpho:700002" }, async () => responseFor(VALID_SWC), hash),
    /asset identity/,
  );
  await assert.rejects(
    loadVerifiedUniverseSwc({ ...record, swc: { ...record.swc, path: "/data/wrong/nmo-700002.swc" } }, async () => responseFor(VALID_SWC), hash),
    /path does not match/,
  );
});

test("verified loader propagates no-diameter and 2D semantics without modifying source values", async () => {
  const text = "1 1 0 0 -1 2 -1\n2 3 2 3 5 0.2 1\n";
  const record = universeRecord(text, {
    neuronId: 700002,
    normalizedMetadata: { dimensionality: "2D", sourceDiameterAvailable: false },
  });
  const geometry = await loadVerifiedUniverseSwc(
    record,
    async () => responseFor(text),
    async (bytes) => sha256(bytes),
  );
  assert.equal(geometry.dimensionality, "2D");
  assert.equal(geometry.radiusSurfaceAuthorized, false);
  assert.equal(geometry.extrusionApplied, false);
  assert.deepEqual(geometry.nodes.map((row) => [row[4], row[5]]), [[-1, 2], [5, 0.2]]);
});
