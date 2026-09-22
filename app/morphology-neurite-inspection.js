import * as THREE from "three";
import { computePerspectiveSphereFitDistance } from "./morphology-viewport-scale.js";

/** Index the deposited parent tree, without assuming row order or contiguous IDs. */
export function indexSwcNeurites(geometry) {
  if (!geometry?.nodes?.length) throw new Error("An exact SWC node table is required");
  const nodes = new Map();
  for (const row of geometry.nodes) {
    if (!Array.isArray(row) || row.length !== 7 || !Number.isInteger(row[0])
      || !Number.isInteger(row[1]) || !row.slice(2, 6).every(Number.isFinite)
      || !Number.isInteger(row[6]) || nodes.has(row[0])) throw new Error("Invalid or duplicate SWC node");
    nodes.set(row[0], { id: row[0], type: row[1], position: row.slice(2, 5), radius: row[5], parentId: row[6], children: [] });
  }
  const roots = [...nodes.values()].filter((node) => node.parentId === -1);
  if (roots.length !== 1) throw new Error("SWC inspection requires one root");
  for (const node of nodes.values()) {
    if (node.parentId === -1) continue;
    const parent = nodes.get(node.parentId);
    if (!parent || parent === node) throw new Error("Invalid SWC parent");
    parent.children.push(node.id);
  }
  const visited = new Set();
  const pending = [roots[0].id];
  while (pending.length) {
    const id = pending.pop();
    if (visited.has(id)) throw new Error("Cyclic SWC tree");
    visited.add(id);
    pending.push(...nodes.get(id).children);
  }
  if (visited.size !== nodes.size) throw new Error("Disconnected or cyclic SWC tree");
  const neurites = [...nodes.values()].filter((node) => node.type !== 1);
  return {
    nodes,
    rootId: roots[0].id,
    branchpoints: neurites.filter((node) => node.children.filter((id) => nodes.get(id).type !== 1).length >= 2).map((node) => node.id),
    terminals: neurites.filter((node) => node.children.filter((id) => nodes.get(id).type !== 1).length === 0).map((node) => node.id),
  };
}

const edgeLength = (left, right) => Math.hypot(...left.position.map((value, axis) => value - right.position[axis]));

export function inspectSwcNode(index, nodeId, { sourceRadiusAvailable = false } = {}) {
  const node = index.nodes.get(nodeId);
  if (!node) throw new Error(`SWC node ${nodeId} does not exist in this reconstruction`);
  const ancestorIds = [];
  let current = node;
  while (current) {
    ancestorIds.push(current.id);
    current = index.nodes.get(current.parentId);
  }
  ancestorIds.reverse();
  const descendantIds = [];
  const pending = [...node.children];
  let descendantCableMicrometre = 0;
  while (pending.length) {
    const descendant = index.nodes.get(pending.pop());
    descendantIds.push(descendant.id);
    descendantCableMicrometre += edgeLength(descendant, index.nodes.get(descendant.parentId));
    pending.push(...descendant.children);
  }
  let rootPathLengthMicrometre = 0;
  const radiusProfile = [];
  ancestorIds.forEach((id, offset) => {
    const sample = index.nodes.get(id);
    if (offset) rootPathLengthMicrometre += edgeLength(sample, index.nodes.get(ancestorIds[offset - 1]));
    // Standardized type-1 samples are not an observed soma contour or diameter profile.
    if (sourceRadiusAvailable && sample.type !== 1 && sample.radius >= 0) {
      radiusProfile.push({ nodeId: id, distanceMicrometre: rootPathLengthMicrometre, diameterMicrometre: sample.radius * 2 });
    }
  });
  return {
    nodeId, parentId: node.parentId, sourceType: node.type,
    positionMicrometre: [...node.position],
    radiusMicrometre: sourceRadiusAvailable && node.type !== 1 && node.radius >= 0 ? node.radius : null,
    parentEdgeLengthMicrometre: node.parentId === -1 ? 0 : edgeLength(node, index.nodes.get(node.parentId)),
    childCount: node.children.length,
    ancestorIds, descendantIds, rootPathLengthMicrometre, descendantCableMicrometre, radiusProfile,
    measurementUse: "source_local_descriptive_inspection_only",
    sameSpecimenInternalStructureClaim: false,
  };
}

function viewerPoint(geometry, position) {
  return new THREE.Vector3(...position.map((value, axis) =>
    (value - geometry.displayTransform.originMicrometre[axis]) * geometry.displayTransform.scaleViewerUnitPerMicrometre));
}

function linesForNodes(index, geometry, ids, color) {
  const positions = [];
  for (const id of ids) {
    const node = index.nodes.get(id);
    const parent = index.nodes.get(node.parentId);
    if (!parent) continue;
    positions.push(...viewerPoint(geometry, parent.position).toArray(), ...viewerPoint(geometry, node.position).toArray());
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 1 }));
  lines.renderOrder = 25;
  return lines;
}

export function createSwcSelectionOverlay(index, geometry, selection) {
  const group = new THREE.Group();
  group.name = `exact-swc-inspection-${selection.nodeId}`;
  group.userData = { representation: "exact_parent_path_and_descendant_edges", nodeId: selection.nodeId, registrationCount: 0, biologicalSurfaceClaim: false };
  const ancestors = linesForNodes(index, geometry, selection.ancestorIds.slice(1), 0xffd166);
  ancestors.name = "selected-root-path";
  const descendants = linesForNodes(index, geometry, selection.descendantIds, 0x6affda);
  descendants.name = "selected-descendant-arbor";
  group.add(ancestors, descendants);
  const point = viewerPoint(geometry, selection.positionMicrometre);
  const size = 0.035;
  const vertices = [point.x - size, point.y, point.z, point.x + size, point.y, point.z,
    point.x, point.y - size, point.z, point.x, point.y + size, point.z,
    point.x, point.y, point.z - size, point.x, point.y, point.z + size];
  const marker = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3)),
    new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false }));
  marker.name = "selected-node-cross-viewer-aid";
  marker.renderOrder = 26;
  group.add(marker);
  return group;
}

function disposeOverlay(group) {
  group?.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
  group?.removeFromParent();
}

/** Installs source-node picking on an existing viewport; it owns no render loop. */
export function attachSwcNeuriteInspection({ geometry, scene, camera, controls, canvas, contextRoot,
  sourceRadiusAvailable = false, isTwoDimensional = false, onSelection = (selection) => { void selection; }, onCameraChange = () => {},
  isSourceTypeVisible = (sourceType) => Number.isInteger(sourceType) }) {
  const index = indexSwcNeurites(geometry);
  const edgeIds = [...index.nodes.values()].filter((node) => node.parentId !== -1).map((node) => node.id);
  const pickLines = linesForNodes(index, geometry, edgeIds, 0xffffff);
  pickLines.updateMatrixWorld(true);
  let overlay = null;
  let selection = null;
  let pointerStart = null;
  let dimmed = false;
  const originalOpacity = new Map();
  contextRoot.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    materials.forEach((material) => originalOpacity.set(material, material.opacity));
  });
  const applyDim = () => originalOpacity.forEach((opacity, material) => { material.opacity = dimmed && selection ? opacity * 0.13 : opacity; });
  const publish = () => onSelection(selection ? { ...selection, neuronId: geometry.neuronId, geometryIdentity: geometry, dimmed } : null);
  const select = (nodeId) => {
    selection = inspectSwcNode(index, nodeId, { sourceRadiusAvailable });
    disposeOverlay(overlay);
    overlay = createSwcSelectionOverlay(index, geometry, selection);
    scene.add(overlay);
    applyDim();
    publish();
    return selection;
  };
  const clear = () => {
    selection = null;
    disposeOverlay(overlay);
    overlay = null;
    applyDim();
    publish();
  };
  const onPointerDown = (event) => { pointerStart = event.button === 0 ? [event.clientX, event.clientY] : null; };
  const onPointerUp = (event) => {
    const start = pointerStart;
    pointerStart = null;
    if (!start || event.button !== 0 || Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 5) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 7 * 2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV()) / 2) / rect.height;
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hit = raycaster.intersectObject(pickLines, false).find((item) => {
      const id = edgeIds[Math.floor(item.index / 2)];
      return isSourceTypeVisible(index.nodes.get(id).type);
    });
    if (hit) select(edgeIds[Math.floor(hit.index / 2)]);
  };
  const cancelPointer = () => { pointerStart = null; };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", cancelPointer);
  return {
    select,
    clear,
    restore(retained) {
      if (retained?.geometryIdentity !== geometry) { clear(); return; }
      dimmed = Boolean(retained.dimmed);
      select(retained.nodeId);
    },
    nextLandmark(kind) {
      const ids = kind === "branchpoint" ? index.branchpoints : index.terminals;
      if (!ids.length) return;
      const offset = selection ? ids.indexOf(selection.nodeId) : -1;
      select(ids[(offset + 1) % ids.length]);
    },
    dimContext() { dimmed = !dimmed; applyDim(); publish(); },
    focus() {
      if (!selection) return;
      const ids = [selection.nodeId, ...selection.descendantIds];
      if (selection.parentId !== -1) ids.push(selection.parentId);
      const box = new THREE.Box3().setFromPoints(ids.map((id) => viewerPoint(geometry, index.nodes.get(id).position)));
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const distance = Math.max(controls.minDistance, computePerspectiveSphereFitDistance({
        radiusViewerUnit: Math.max(sphere.radius, 0.045), verticalFovDegrees: camera.getEffectiveFOV(), aspect: camera.aspect,
      }));
      const direction = isTwoDimensional ? new THREE.Vector3(0, 0, 1) : camera.position.clone().sub(controls.target).normalize();
      controls.target.copy(sphere.center);
      camera.position.copy(sphere.center).addScaledVector(direction, distance);
      controls.update();
      onCameraChange();
    },
    dispose() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", cancelPointer);
      disposeOverlay(overlay);
      disposeOverlay(pickLines);
      originalOpacity.forEach((opacity, material) => { material.opacity = opacity; });
    },
  };
}
