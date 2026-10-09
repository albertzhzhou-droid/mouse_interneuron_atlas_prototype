import assert from "node:assert/strict";
import test from "node:test";
import index from "../data/neuromorpho-census-main-scene-index-0.1.json" with { type: "json" };
import { validateNeuromorphoCensusMainSceneIndex01 } from "../scripts/validate-neuromorpho-census-main-scene-index-0.1.mjs";

test("all frozen query morphologies have an exact distinct source-local main-scene record", async () => {
  const result = await validateNeuromorphoCensusMainSceneIndex01();
  assert.equal(result.censusRecordCount, 142);
  assert.equal(result.sourceLabelledThreeDimensionalCount, 140);
  assert.equal(result.sourceLabelledPlanarCount, 2);
  assert.deepEqual(result.sourceLabelledSecondaryClassCounts, { Inhibitory: 15, Excitatory: 125, "Not Reported": 2 });
  assert.equal(result.registrationCount, 0);
  assert.equal(result.internalPrimitiveCount, 0);
  assert.notEqual(index.records.find((record) => record.neuronId === 104003).geometry.sha256,
    index.records.find((record) => record.neuronId === 109005).geometry.sha256);
});

test("source class labels remain verbatim, and 2D inputs cannot be relabelled as reconstructed 3D", () => {
  const unclassified = index.records.filter((record) => record.sourceMetadata.cellTypeLabels.length === 1);
  assert.equal(unclassified.length, 2);
  assert.ok(unclassified.every((record) => record.sourceMetadata.cellTypeLabels[0] === "interneuron"));
  const planar = index.records.filter((record) => record.geometry.dimensionality === "2D");
  assert.equal(planar.length, 2);
  assert.ok(planar.every((record) => record.geometry.dimensionality === "2D"));
  assert.match(index.scientificBoundary.geometry, /two source-labelled 2D records remain planar source inputs/i);
  assert.match(index.scientificBoundary.labels, /do not establish a paper-verified subtype/i);
});

test("changed census identities fail the source-rebuild gate", async () => {
  const changed = structuredClone(index);
  changed.records[0].neuronId += 1;
  await assert.rejects(validateNeuromorphoCensusMainSceneIndex01(changed), /differs from the checksum-pinned source rebuild/);
});
