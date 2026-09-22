import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import * as THREE from "three";
import { indexSwcNeurites, inspectSwcNode, createSwcSelectionOverlay, attachSwcNeuriteInspection } from "../app/morphology-neurite-inspection.js";

const geometry = {
  neuronId: 123,
  displayTransform: { originMicrometre: [10, 20, 30], scaleViewerUnitPerMicrometre: 0.1 },
  // Deliberately unordered, non-contiguous IDs; root to 90 is a 3-4-5 path.
  nodes: [[90, 3, 13, 24, 30, 0.4, 70], [100, 3, 13, 24, 32, 0.25, 90],
    [70, 3, 13, 20, 30, 0.5, 10], [10, 1, 10, 20, 30, 8, -1], [110, 2, 16, 24, 30, 0.1, 90]],
};

function dispose(group) {
  group.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
}

test("exact parent-chain and downstream lengths use source coordinates, independent of row order and viewer scale", () => {
  const index = indexSwcNeurites(geometry);
  const result = inspectSwcNode(index, 90, { sourceRadiusAvailable: true });
  assert.deepEqual(result.ancestorIds, [10, 70, 90]);
  assert.deepEqual(result.descendantIds.sort(), [100, 110]);
  assert.equal(result.rootPathLengthMicrometre, 7);
  assert.equal(result.parentEdgeLengthMicrometre, 4);
  assert.equal(result.descendantCableMicrometre, 5);
  assert.equal(result.radiusMicrometre, 0.4);
  assert.equal(result.childCount, 2);
  assert.deepEqual(result.positionMicrometre, [13, 24, 30]);
  assert.deepEqual(result.radiusProfile, [{ nodeId: 70, distanceMicrometre: 3, diameterMicrometre: 1 }, { nodeId: 90, distanceMicrometre: 7, diameterMicrometre: 0.8 }]);
  assert.deepEqual(index.branchpoints, [90]);
  assert.equal(result.sameSpecimenInternalStructureClaim, false);
});

test("No Diameter records never expose placeholder radius measurements or profiles; type-1 stays excluded", () => {
  const index = indexSwcNeurites(geometry);
  assert.equal(inspectSwcNode(index, 90).radiusMicrometre, null);
  assert.deepEqual(inspectSwcNode(index, 90).radiusProfile, []);
  assert.equal(inspectSwcNode(index, 10, { sourceRadiusAvailable: true }).radiusMicrometre, null);
  assert.deepEqual(inspectSwcNode(index, 10, { sourceRadiusAvailable: true }).radiusProfile, []);
});

test("terminal and root selection preserve exact denominator and empty downstream behavior", () => {
  const index = indexSwcNeurites(geometry);
  const terminal = inspectSwcNode(index, 100);
  assert.deepEqual(terminal.descendantIds, []);
  assert.equal(terminal.descendantCableMicrometre, 0);
  assert.equal(terminal.rootPathLengthMicrometre, 9);
  const root = inspectSwcNode(index, 10);
  assert.equal(root.rootPathLengthMicrometre, 0);
  assert.equal(root.descendantIds.length, geometry.nodes.length - 1);
  assert.equal(root.descendantCableMicrometre, 12);
});

test("selection overlay contains only transformed exact edges and a data cross, with no invented surfaces", () => {
  const index = indexSwcNeurites(geometry);
  const group = createSwcSelectionOverlay(index, geometry, inspectSwcNode(index, 90));
  assert.equal(group.userData.biologicalSurfaceClaim, false);
  assert.equal(group.userData.registrationCount, 0);
  assert.ok(group.children.every((child) => child.isLineSegments));
  const positions = group.getObjectByName("selected-root-path").geometry.attributes.position;
  assert.equal(positions.count, 4);
  assert.deepEqual([positions.getX(0), positions.getY(0), positions.getZ(0)], [0, 0, 0]);
  assert.ok(Math.abs(positions.getX(3) - 0.3) < 1e-6);
  assert.ok(Math.abs(positions.getY(3) - 0.4) < 1e-6);
  assert.equal(group.getObjectByName("selected-descendant-arbor").geometry.attributes.position.count, 4);
  dispose(group);
});

test("rejects invalid topology, missing selections, disconnected cycles and duplicate IDs", () => {
  assert.throws(() => indexSwcNeurites({ nodes: [] }), /required/);
  assert.throws(() => indexSwcNeurites({ nodes: [...geometry.nodes, geometry.nodes[0]] }), /duplicate/);
  assert.throws(() => indexSwcNeurites({ nodes: [[1, 1, 0, 0, 0, 1, -1], [2, 3, 1, 0, 0, 1, 3], [3, 3, 2, 0, 0, 1, 2]] }), /Disconnected or cyclic/);
  assert.throws(() => inspectSwcNode(indexSwcNeurites(geometry), 999), /does not exist/);
});

function setupController({ sourceRadiusAvailable = true, isTwoDimensional = false, isSourceTypeVisible } = {}) {
  const canvas = new EventTarget();
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 400 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 100);
  camera.position.set(0, 0, 3);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const controls = { target: new THREE.Vector3(), minDistance: 0.001, update() {} };
  const contextRoot = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ opacity: 0.8, transparent: true });
  contextRoot.add(new THREE.LineSegments(new THREE.BufferGeometry(), material));
  scene.add(contextRoot);
  const published = [];
  const controller = attachSwcNeuriteInspection({ geometry, canvas, scene, camera, controls, contextRoot, sourceRadiusAvailable, isTwoDimensional,
    isSourceTypeVisible, onSelection: (value) => published.push(value) });
  return { controller, canvas, scene, camera, controls, material, published, contextRoot };
}

function pointer(canvas, type, x, y) {
  const event = new Event(type);
  Object.assign(event, { button: 0, clientX: x, clientY: y });
  canvas.dispatchEvent(event);
}

test("controller focuses the selected arbor, dims/restores context, steps landmarks, and disposes listeners", () => {
  const setup = setupController({ isTwoDimensional: true });
  const { controller, camera, controls, material, published, scene, canvas } = setup;
  controller.select(90);
  assert.equal(published.at(-1).nodeId, 90);
  assert.equal(published.at(-1).geometryIdentity, geometry);
  controller.dimContext();
  assert.equal(material.opacity, 0.8 * 0.13);
  controller.focus();
  assert.equal(camera.position.x, controls.target.x);
  assert.equal(camera.position.y, controls.target.y);
  assert.ok(camera.position.z > controls.target.z);
  assert.ok(controls.target.x > 0.29);
  controller.nextLandmark("terminal");
  assert.equal(published.at(-1).nodeId, 100);
  controller.nextLandmark("terminal");
  assert.equal(published.at(-1).nodeId, 110);
  controller.clear();
  assert.equal(material.opacity, 0.8);
  assert.equal(published.at(-1), null);
  assert.equal(scene.children.length, 1);
  controller.dispose();
  const count = published.length;
  pointer(canvas, "pointerdown", 200, 200);
  pointer(canvas, "pointerup", 200, 200);
  assert.equal(published.length, count);
  dispose(setup.contextRoot);
});

test("pointer picking selects the exact edge child, ignores drag and respects hidden source types", () => {
  for (const visible of [true, false]) {
    const setup = setupController({ isSourceTypeVisible: () => visible });
    const point = new THREE.Vector3(0.3, 0.2, 0).project(setup.camera);
    const x = (point.x + 1) * 200;
    const y = (1 - point.y) * 200;
    pointer(setup.canvas, "pointerdown", x - 20, y);
    pointer(setup.canvas, "pointerup", x, y);
    assert.equal(setup.published.length, 0);
    pointer(setup.canvas, "pointerdown", x, y);
    pointer(setup.canvas, "pointerup", x, y);
    if (visible) assert.equal(setup.published.at(-1).nodeId, 90);
    else assert.equal(setup.published.length, 0);
    setup.controller.dispose();
    dispose(setup.contextRoot);
  }
});

test("every bundled census reconstruction supports real exact-tree inspection with full root coverage", async () => {
  const directory = new URL("../public/data/neuromorpho_release_8_6_124_census_v1/geometry/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json"));
  assert.ok(files.length > 100);
  for (const file of files) {
    const payload = JSON.parse(await readFile(new URL(file, directory), "utf8"));
    const index = indexSwcNeurites(payload);
    const root = inspectSwcNode(index, index.rootId);
    assert.equal(root.descendantIds.length + 1, payload.nodes.length, file);
    assert.ok(Number.isFinite(root.descendantCableMicrometre), file);
    assert.equal(root.radiusMicrometre, null, file);
    if (index.terminals.length) assert.equal(inspectSwcNode(index, index.terminals[0]).descendantIds.length, 0, file);
  }
});

 test("retains selection only for the identical geometry payload when rebuilding display modes", () => {
  const first = setupController();
  first.controller.select(90);
  first.controller.dimContext();
  const retained = first.published.at(-1);
  first.controller.dispose();
  const second = setupController();
  second.controller.restore(retained);
  assert.equal(second.published.at(-1).nodeId, 90);
  assert.equal(second.published.at(-1).dimmed, true);
  assert.equal(second.material.opacity, 0.8 * 0.13);
  second.controller.restore({ ...retained, geometryIdentity: { ...geometry } });
  assert.equal(second.published.at(-1), null);
  assert.equal(second.material.opacity, 0.8);
  second.controller.dispose();
  dispose(first.contextRoot);
  dispose(second.contextRoot);
});
