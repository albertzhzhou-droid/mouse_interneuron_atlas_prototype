import test from "node:test";
import assert from "node:assert/strict";

import {
  TOPOLOGY_LANDMARK_ALGORITHM_ID,
  TOPOLOGY_LANDMARK_REPRESENTATION,
  createObservedTopologyLandmarks,
  extractObservedTopologyLandmarks,
} from "../app/source-local-morphology-geometry.js";

const geometry = {
  neuronId: 123,
  sourceFrame: "NeuroMorpho_CNG_standardized_local_frame",
  displayTransform: {
    originMicrometre: [0, 0, 0],
    scaleViewerUnitPerMicrometre: 0.1,
  },
  swc: { canonicalGeometrySha256: "a".repeat(64) },
  nodes: [
    [1, 1, 0, 0, 0, 2, -1],
    [2, 1, 0, 1, 0, 1.5, 1],
    [3, 3, 1, 0, 0, 0.5, 1],
    [4, 3, 2, 1, 0, 0.4, 3],
    [5, 3, 2, -1, 0, 0.4, 3],
    [6, 2, 0, 2, 0, 0.3, 2],
  ],
};

test("derives exact root, source-type samples, stems, branchpoints and terminals from SWC parent links", () => {
  const result = extractObservedTopologyLandmarks(geometry);
  assert.equal(result.algorithmId, TOPOLOGY_LANDMARK_ALGORITHM_ID);
  assert.equal(result.root.nodeId, 1);
  assert.deepEqual(result.standardizedType1Samples.map((item) => item.nodeId), [1, 2]);
  assert.deepEqual(result.stems.map((item) => item.nodeId), [3, 6]);
  assert.deepEqual(result.branchpoints.map((item) => item.nodeId), [3]);
  assert.deepEqual(result.terminals.map((item) => item.nodeId), [4, 5, 6]);
  assert.equal(result.sourceType1Meaning, "standardized_soma_samples_not_contour");
  assert.equal(result.terminalMeaning, "topological_terminal_not_bouton_or_synapse");
  assert.equal(result.sameSpecimenInternalStructureClaim, false);
});

test("renders topology landmarks as line-cross data overlays with zero biological-surface claims", () => {
  const root = createObservedTopologyLandmarks(geometry);
  assert.equal(root.userData.representation, TOPOLOGY_LANDMARK_REPRESENTATION);
  assert.equal(root.userData.algorithmId, TOPOLOGY_LANDMARK_ALGORITHM_ID);
  assert.deepEqual(root.userData.counts, {
    roots: 1,
    standardizedType1Samples: 2,
    stems: 2,
    branchpoints: 1,
    terminals: 3,
  });
  assert.equal(root.userData.generatedBiologicalGeometryCount, 0);
  assert.equal(root.userData.sameSpecimenInternalStructureClaim, false);
  assert.equal(root.children.length, 4);
  const terminal = root.children.find((child) => child.name === "swc-derived-terminal-markers-not-boutons");
  assert.ok(terminal);
  assert.equal(terminal.userData.landmarkCount, 3);
  assert.equal(terminal.userData.boutonClaim, false);
  assert.equal(terminal.userData.synapseClaim, false);
  assert.equal(terminal.geometry.getAttribute("position").count, 18);
  root.traverse((object) => {
    object.geometry?.dispose?.();
    object.material?.dispose?.();
  });
});

test("fails closed for empty, duplicate-root and missing-parent node tables", () => {
  assert.throws(() => extractObservedTopologyLandmarks({ nodes: [] }), /non-empty/);
  assert.throws(() => extractObservedTopologyLandmarks({ nodes: [geometry.nodes[0], [2, 1, 1, 0, 0, 1, -1]] }), /exactly one/);
  assert.throws(() => extractObservedTopologyLandmarks({ nodes: [[1, 1, 0, 0, 0, 1, -1], [2, 3, 1, 0, 0, 1, 99]] }), /parent is invalid/);
});
