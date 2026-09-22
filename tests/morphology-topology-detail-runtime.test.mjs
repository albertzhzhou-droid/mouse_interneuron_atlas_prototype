import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateMorphologyTopologyPayload } from "../app/morphology-topology-detail-runtime.js";

const runtimeIndex = JSON.parse(await readFile(
  new URL("../public/data/morphology_topology_detail_v1/index.json", import.meta.url),
  "utf8",
));
const expected = {
  recordCount: 149,
  frozenCensusRecordCount: 142,
  supplementaryRecordCount: 7,
};

function mutated(mutator) {
  const value = structuredClone(runtimeIndex);
  mutator(value);
  return value;
}

test("runtime guard accepts the exact checksum-pinned topology payload", () => {
  assert.equal(validateMorphologyTopologyPayload(runtimeIndex, expected), runtimeIndex);
});

test("runtime guard rejects unknown or arithmetically inconsistent membership", () => {
  assert.throws(
    () => validateMorphologyTopologyPayload(mutated((copy) => {
      copy.records[0].membership.collection = "comparison";
    }), expected),
    /unknown membership collection/,
  );
  assert.throws(
    () => validateMorphologyTopologyPayload(mutated((copy) => {
      copy.records[0].membership.frozenCensusContribution = 1;
    }), expected),
    /changed its frozen-census membership/,
  );
});

test("runtime guard rejects missing, malformed, or type-1-free source domains", () => {
  for (const [label, value] of [
    ["missing", mutated((copy) => { delete copy.records[0].topology.sourceTypeDomains; })],
    ["malformed", mutated((copy) => { copy.records[0].topology.sourceTypeDomains = {}; })],
    ["type-1-free", mutated((copy) => {
      copy.records[0].topology.sourceTypeDomains = copy.records[0].topology.sourceTypeDomains.filter((domain) => domain.sourceType !== 1);
    })],
    ["malformed type-1 IDs", mutated((copy) => {
      copy.records[0].topology.sourceTypeDomains[0].standardizedSomaSampleNodeIds = [1, 1];
    })],
  ]) {
    assert.throws(
      () => validateMorphologyTopologyPayload(value, expected),
      /source-type domains|source type 1|sample IDs/,
      label,
    );
  }
});

test("runtime guard rejects missing, malformed, or zero-padded canonical availability", () => {
  const recordWithUnavailableType = runtimeIndex.records.find((record) =>
    record.topology.canonicalNeuriteTypeAvailability.some((item) => item.status === "UNAVAILABLE"));
  assert.ok(recordWithUnavailableType);
  const neuronId = recordWithUnavailableType.neuronId;
  for (const [label, value] of [
    ["missing", mutated((copy) => {
      delete copy.records.find((record) => record.neuronId === neuronId).topology.canonicalNeuriteTypeAvailability;
    })],
    ["malformed", mutated((copy) => {
      copy.records.find((record) => record.neuronId === neuronId).topology.canonicalNeuriteTypeAvailability = [{ sourceType: 2 }];
    })],
    ["zero padded", mutated((copy) => {
      const record = copy.records.find((candidate) => candidate.neuronId === neuronId);
      record.topology.canonicalNeuriteTypeAvailability.find((item) => item.status === "UNAVAILABLE").segmentCount = 0;
    })],
  ]) {
    assert.throws(
      () => validateMorphologyTopologyPayload(value, expected),
      /availability|padded/,
      label,
    );
  }
});

test("panel uses the runtime guard and adjacent legends preserve the evidence wording", async () => {
  const [panel, viewer, sceneCanvas, sourceLocalViewport] = await Promise.all([
    readFile(new URL("../app/MorphologyTopologyDetailPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MorphologyViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SceneCanvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SourceLocalMorphologyViewport.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(panel, /validateMorphologyTopologyPayload\(payload/);
  assert.match(viewer, /1: "Type-1 soma samples"/);
  assert.match(sceneCanvas, />Type-1 soma samples</);
  assert.doesNotMatch(sceneCanvas, />Soma</);
  assert.match(sourceLocalViewport, /root is not a soma contour/);
  assert.doesNotMatch(sourceLocalViewport, /root is not a soma ·/);
});
