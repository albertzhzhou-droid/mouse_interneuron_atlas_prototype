import * as THREE from "three";

export const SOURCE_LOCAL_SWC_GEOMETRY_STATUS = "OBS_STANDARDIZED_SOURCE_LOCAL";
export const RADIUS_SURFACE_ALGORITHM_ID = "tapered_hexagonal_frustum_per_swc_edge_v1";
export const RADIUS_SURFACE_REPRESENTATION = "DERIVED_FROM_OBSERVED_RADIUS";
export const TOPOLOGY_LANDMARK_ALGORITHM_ID = "exact_swc_parent_link_landmarks_v1";
export const TOPOLOGY_LANDMARK_REPRESENTATION = "DERIVED_FROM_OBSERVED_TOPOLOGY";

function displayPoint(transform, x, y, z, target = new THREE.Vector3()) {
  const [originX, originY, originZ] = transform.originMicrometre;
  const scale = transform.scaleViewerUnitPerMicrometre;
  return target.set(
    (x - originX) * scale,
    (y - originY) * scale,
    (z - originZ) * scale,
  );
}

function typeColor(colors, sourceType) {
  return colors[sourceType] ?? 0x687a75;
}

/**
 * Derives inspection landmarks from the deposited SWC node/parent table.
 * These are topology data points: source type 1 remains standardized soma
 * samples and is never promoted to a soma contour, while terminals are never
 * promoted to boutons or synapses.
 */
export function extractObservedTopologyLandmarks(geometryPayload) {
  if (!Array.isArray(geometryPayload?.nodes) || geometryPayload.nodes.length === 0) {
    throw new Error("Topology landmarks require a non-empty SWC node table");
  }
  const byId = new Map();
  for (const row of geometryPayload.nodes) {
    if (!Array.isArray(row) || row.length !== 7) throw new Error("Topology landmark node row is invalid");
    const [nodeId, sourceType, x, y, z, , parentId] = row;
    if (!Number.isInteger(nodeId) || byId.has(nodeId) || !Number.isInteger(sourceType)
      || ![x, y, z].every(Number.isFinite) || !Number.isInteger(parentId)) {
      throw new Error(`Topology landmark node ${nodeId} is invalid`);
    }
    byId.set(nodeId, {
      nodeId,
      sourceType,
      positionMicrometre: [x, y, z],
      parentId,
      children: [],
    });
  }
  const roots = [...byId.values()].filter((node) => node.parentId === -1);
  if (roots.length !== 1) throw new Error("Topology landmarks require exactly one SWC root node");
  for (const node of byId.values()) {
    if (node.parentId === -1) continue;
    const parent = byId.get(node.parentId);
    if (!parent || parent === node) throw new Error(`Topology landmark parent is invalid for node ${node.nodeId}`);
    parent.children.push(node.nodeId);
  }
  const landmark = (node) => ({
    nodeId: node.nodeId,
    sourceType: node.sourceType,
    positionMicrometre: node.positionMicrometre,
  });
  const nonSomaChildren = (node) => node.children.filter((childId) => byId.get(childId).sourceType !== 1);
  const neuriteNodes = [...byId.values()].filter((node) => node.sourceType !== 1);
  return {
    algorithmId: TOPOLOGY_LANDMARK_ALGORITHM_ID,
    root: landmark(roots[0]),
    standardizedType1Samples: [...byId.values()].filter((node) => node.sourceType === 1).map(landmark),
    stems: neuriteNodes.filter((node) => byId.get(node.parentId)?.sourceType === 1).map(landmark),
    branchpoints: neuriteNodes.filter((node) => nonSomaChildren(node).length >= 2).map(landmark),
    terminals: neuriteNodes.filter((node) => nonSomaChildren(node).length === 0).map(landmark),
    sourceType1Meaning: "standardized_soma_samples_not_contour",
    terminalMeaning: "topological_terminal_not_bouton_or_synapse",
    registrationCount: 0,
    sameSpecimenInternalStructureClaim: false,
  };
}

function writeCross(array, offset, point, size) {
  const axes = [[size, 0, 0], [0, size, 0], [0, 0, size]];
  for (const [x, y, z] of axes) {
    array[offset++] = point.x - x;
    array[offset++] = point.y - y;
    array[offset++] = point.z - z;
    array[offset++] = point.x + x;
    array[offset++] = point.y + y;
    array[offset++] = point.z + z;
  }
  return offset;
}

function createLandmarkCrosses(landmarks, geometryPayload, {
  color,
  name,
  meaning,
  markerSizeViewer,
  opacity,
  renderOrder,
}) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(landmarks.length * 18);
  const point = new THREE.Vector3();
  let offset = 0;
  for (const landmark of landmarks) {
    displayPoint(
      geometryPayload.displayTransform,
      landmark.positionMicrometre[0],
      landmark.positionMicrometre[1],
      landmark.positionMicrometre[2],
      point,
    );
    offset = writeCross(positions, offset, point, markerSizeViewer);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false }),
  );
  lines.name = name;
  lines.renderOrder = renderOrder;
  lines.userData = {
    representation: TOPOLOGY_LANDMARK_REPRESENTATION,
    algorithmId: TOPOLOGY_LANDMARK_ALGORITHM_ID,
    meaning,
    landmarkCount: landmarks.length,
    nodeIds: landmarks.map((landmark) => landmark.nodeId),
    sourceTypes: [...new Set(landmarks.map((landmark) => landmark.sourceType))].sort((left, right) => left - right),
    somaContourClaim: false,
    boutonClaim: false,
    synapseClaim: false,
    internalStructureClaim: false,
    registrationCount: 0,
  };
  return lines;
}

export function createObservedTopologyLandmarks(
  geometryPayload,
  {
    markerSizeViewer = 0.045,
    opacity = 0.96,
    renderOrder = 12,
    showType1Samples = true,
  } = {},
) {
  const landmarks = extractObservedTopologyLandmarks(geometryPayload);
  const root = new THREE.Group();
  root.name = `topology-landmarks-${geometryPayload.neuronId}-source-local`;
  root.userData = {
    representation: TOPOLOGY_LANDMARK_REPRESENTATION,
    algorithmId: TOPOLOGY_LANDMARK_ALGORITHM_ID,
    sourceFrame: geometryPayload.sourceFrame,
    geometrySha256: geometryPayload?.swc?.canonicalGeometrySha256 ?? null,
    counts: {
      roots: 1,
      standardizedType1Samples: landmarks.standardizedType1Samples.length,
      stems: landmarks.stems.length,
      branchpoints: landmarks.branchpoints.length,
      terminals: landmarks.terminals.length,
    },
    generatedBiologicalGeometryCount: 0,
    sameSpecimenInternalStructureClaim: false,
    registrationCount: 0,
  };
  root.add(createLandmarkCrosses([landmarks.root], geometryPayload, {
    color: 0xffffff,
    name: "swc-root-node-marker-not-soma",
    meaning: "swc_root_node_not_soma_centroid_or_contour",
    markerSizeViewer: markerSizeViewer * 1.65,
    opacity,
    renderOrder,
  }));
  if (showType1Samples) {
    root.add(createLandmarkCrosses(landmarks.standardizedType1Samples, geometryPayload, {
      color: 0xc7a6ff,
      name: "swc-type-1-sample-markers-not-contour",
      meaning: "standardized_source_type_1_samples_not_soma_contour",
      markerSizeViewer: markerSizeViewer * 0.8,
      opacity: opacity * 0.82,
      renderOrder,
    }));
  }
  root.add(createLandmarkCrosses(landmarks.branchpoints, geometryPayload, {
    color: 0x62e6c6,
    name: "swc-derived-branchpoint-markers",
    meaning: "topological_branchpoint_from_exact_parent_links",
    markerSizeViewer,
    opacity,
    renderOrder,
  }));
  root.add(createLandmarkCrosses(landmarks.terminals, geometryPayload, {
    color: 0xffc857,
    name: "swc-derived-terminal-markers-not-boutons",
    meaning: "topological_terminal_not_bouton_or_synapse",
    markerSizeViewer: markerSizeViewer * 0.72,
    opacity: opacity * 0.9,
    renderOrder,
  }));
  return root;
}

export function createObservedSwcCenterlines(
  geometryPayload,
  {
    colors,
    hiddenTypes = new Set(),
    opacity = 0.88,
    renderOrder = 7,
  },
) {
  const root = new THREE.Group();
  root.name = `observed-swc-${geometryPayload.neuronId}-source-local`;
  root.userData = {
    geometryStatus: SOURCE_LOCAL_SWC_GEOMETRY_STATUS,
    representation: "observed_standardized_swc_centerlines",
    sourceFrame: geometryPayload.sourceFrame,
    displayTransform: geometryPayload.displayTransform,
    registrationCount: 0,
    measurementUse: "source_local_descriptive_inspection_only",
  };

  const segmentCountsByType = new Map();
  geometryPayload.segments.forEach((segment) => {
    const sourceType = segment[8];
    if (hiddenTypes.has(sourceType)) return;
    segmentCountsByType.set(sourceType, (segmentCountsByType.get(sourceType) ?? 0) + 1);
  });

  const positionBuffersByType = new Map(
    Array.from(segmentCountsByType, ([sourceType, segmentCount]) => [
      sourceType,
      { array: new Float32Array(segmentCount * 2 * 3), offset: 0 },
    ]),
  );
  const [originX, originY, originZ] = geometryPayload.displayTransform.originMicrometre;
  const scale = geometryPayload.displayTransform.scaleViewerUnitPerMicrometre;
  geometryPayload.segments.forEach((segment) => {
    const buffer = positionBuffersByType.get(segment[8]);
    if (!buffer) return;
    let offset = buffer.offset;
    buffer.array[offset++] = (segment[0] - originX) * scale;
    buffer.array[offset++] = (segment[1] - originY) * scale;
    buffer.array[offset++] = (segment[2] - originZ) * scale;
    buffer.array[offset++] = (segment[4] - originX) * scale;
    buffer.array[offset++] = (segment[5] - originY) * scale;
    buffer.array[offset++] = (segment[6] - originZ) * scale;
    buffer.offset = offset;
  });

  positionBuffersByType.forEach(({ array, offset }, sourceType) => {
    if (offset !== array.length) throw new Error("Observed SWC position-buffer allocation mismatch");
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(array, 3));
    const lines = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: typeColor(colors, sourceType),
        transparent: true,
        opacity: sourceType === 2 ? Math.min(1, opacity + 0.06) : opacity,
      }),
    );
    lines.name = `observed-swc-source-type-${sourceType}`;
    lines.renderOrder = renderOrder;
    lines.userData = {
      geometryStatus: SOURCE_LOCAL_SWC_GEOMETRY_STATUS,
      representation: "observed_standardized_swc_centerlines",
      sourceType,
      registrationCount: 0,
    };
    root.add(lines);
  });
  return root;
}

function segmentIsNonDegenerate(segment, displayTransform) {
  const [originX, originY, originZ] = displayTransform.originMicrometre;
  const scale = displayTransform.scaleViewerUnitPerMicrometre;
  const deltaX = (segment[4] - originX) * scale - (segment[0] - originX) * scale;
  const deltaY = (segment[5] - originY) * scale - (segment[1] - originY) * scale;
  const deltaZ = (segment[6] - originZ) * scale - (segment[2] - originZ) * scale;
  return deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ > Number.EPSILON;
}

function createFrustumBuffer(admittedSegmentCount, radialSegments) {
  const vertexCount = admittedSegmentCount * radialSegments * 2;
  return {
    positions: new Float32Array(vertexCount * 3),
    indices: vertexCount >= 65536
      ? new Uint32Array(admittedSegmentCount * radialSegments * 6)
      : new Uint16Array(admittedSegmentCount * radialSegments * 6),
    positionOffset: 0,
    indexOffset: 0,
    admittedSegmentCount: 0,
  };
}

function writeTaperedFrustum(buffer, segment, displayTransform, radialSegments, ringCosines, ringSines, vectors) {
  const { start, end, helper, direction, basisU, basisV } = vectors;
  displayPoint(displayTransform, segment[0], segment[1], segment[2], start);
  displayPoint(displayTransform, segment[4], segment[5], segment[6], end);
  direction.copy(end).sub(start).normalize();
  helper.set(Math.abs(direction.y) < 0.9 ? 0 : 1, Math.abs(direction.y) < 0.9 ? 1 : 0, 0);
  basisU.crossVectors(direction, helper).normalize();
  basisV.crossVectors(direction, basisU).normalize();

  const scale = displayTransform.scaleViewerUnitPerMicrometre;
  const radius1 = Math.max(Number.EPSILON, segment[3] * scale);
  const radius2 = Math.max(Number.EPSILON, segment[7] * scale);
  const vertexBase = buffer.admittedSegmentCount * radialSegments * 2;
  let positionOffset = buffer.positionOffset;
  for (let ring = 0; ring < 2; ring += 1) {
    const centre = ring === 0 ? start : end;
    const radius = ring === 0 ? radius1 : radius2;
    for (let side = 0; side < radialSegments; side += 1) {
      const cos = ringCosines[side];
      const sin = ringSines[side];
      buffer.positions[positionOffset++] = centre.x + (basisU.x * cos + basisV.x * sin) * radius;
      buffer.positions[positionOffset++] = centre.y + (basisU.y * cos + basisV.y * sin) * radius;
      buffer.positions[positionOffset++] = centre.z + (basisU.z * cos + basisV.z * sin) * radius;
    }
  }
  buffer.positionOffset = positionOffset;

  let indexOffset = buffer.indexOffset;
  for (let side = 0; side < radialSegments; side += 1) {
    const next = (side + 1) % radialSegments;
    const startA = vertexBase + side;
    const startB = vertexBase + next;
    const endA = vertexBase + radialSegments + side;
    const endB = vertexBase + radialSegments + next;
    buffer.indices[indexOffset++] = startA;
    buffer.indices[indexOffset++] = endA;
    buffer.indices[indexOffset++] = startB;
    buffer.indices[indexOffset++] = startB;
    buffer.indices[indexOffset++] = endA;
    buffer.indices[indexOffset++] = endB;
  }
  buffer.indexOffset = indexOffset;
  buffer.admittedSegmentCount += 1;
}

function taperedFrustumGeometry(buffer, radialSegments = 6) {
  if (buffer.positionOffset !== buffer.positions.length || buffer.indexOffset !== buffer.indices.length) {
    throw new Error("Radius-surface typed-buffer allocation mismatch");
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(buffer.positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(buffer.indices, 1));
  geometry.computeVertexNormals();
  geometry.userData = {
    algorithmId: RADIUS_SURFACE_ALGORITHM_ID,
    radialSegments,
    admittedSegmentCount: buffer.admittedSegmentCount,
    endpointRadiusPolicy: "exact_source_radius_after_uniform_viewer_scale",
    capPolicy: "none",
    branchJoinPolicy: "none_per_edge_overlap_only",
    smoothingPolicy: "none",
  };
  return geometry;
}

function createFrustumBuffersByType(segments, displayTransform, hiddenTypes, radialSegments) {
  const admittedCountsByType = new Map();
  segments.forEach((segment) => {
    const sourceType = segment[8];
    if (hiddenTypes.has(sourceType)) return;
    if (!admittedCountsByType.has(sourceType)) admittedCountsByType.set(sourceType, 0);
    if (segmentIsNonDegenerate(segment, displayTransform)) {
      admittedCountsByType.set(sourceType, admittedCountsByType.get(sourceType) + 1);
    }
  });

  const buffersByType = new Map(
    Array.from(admittedCountsByType, ([sourceType, admittedSegmentCount]) => [
      sourceType,
      createFrustumBuffer(admittedSegmentCount, radialSegments),
    ]),
  );
  const ringCosines = new Float64Array(radialSegments);
  const ringSines = new Float64Array(radialSegments);
  for (let side = 0; side < radialSegments; side += 1) {
    const angle = (side / radialSegments) * Math.PI * 2;
    ringCosines[side] = Math.cos(angle);
    ringSines[side] = Math.sin(angle);
  }
  const vectors = {
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
    helper: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    basisU: new THREE.Vector3(),
    basisV: new THREE.Vector3(),
  };

  segments.forEach((segment) => {
    const buffer = buffersByType.get(segment[8]);
    if (!buffer || !segmentIsNonDegenerate(segment, displayTransform)) return;
    writeTaperedFrustum(buffer, segment, displayTransform, radialSegments, ringCosines, ringSines, vectors);
  });
  return buffersByType;
}

export function createRadiusDerivedSurface(
  geometryPayload,
  {
    colors,
    hiddenTypes = new Set(),
    opacity = 0.82,
    radialSegments = 6,
  },
) {
  const root = new THREE.Group();
  root.name = `radius-derived-${geometryPayload.neuronId}-source-local`;
  root.userData = {
    inputGeometryStatus: SOURCE_LOCAL_SWC_GEOMETRY_STATUS,
    representation: RADIUS_SURFACE_REPRESENTATION,
    algorithmId: RADIUS_SURFACE_ALGORITHM_ID,
    sourceFrame: geometryPayload.sourceFrame,
    displayTransform: geometryPayload.displayTransform,
    registrationCount: 0,
    membraneClaim: false,
    biologicalSurfaceClaim: false,
  };

  const buffersByType = createFrustumBuffersByType(
    geometryPayload.segments,
    geometryPayload.displayTransform,
    hiddenTypes,
    radialSegments,
  );

  buffersByType.forEach((buffer, sourceType) => {
    const surfaceGeometry = taperedFrustumGeometry(buffer, radialSegments);
    const surface = new THREE.Mesh(
      surfaceGeometry,
      new THREE.MeshStandardMaterial({
        color: typeColor(colors, sourceType),
        transparent: true,
        opacity: sourceType === 2 ? Math.min(1, opacity + 0.08) : opacity,
        roughness: 0.72,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    );
    surface.name = `radius-derived-source-type-${sourceType}`;
    surface.userData = {
      inputGeometryStatus: SOURCE_LOCAL_SWC_GEOMETRY_STATUS,
      representation: RADIUS_SURFACE_REPRESENTATION,
      algorithmId: RADIUS_SURFACE_ALGORITHM_ID,
      sourceType,
      endpointRadiusPolicy: "exact_source_radius_after_uniform_viewer_scale",
      membraneClaim: false,
      biologicalSurfaceClaim: false,
      registrationCount: 0,
    };
    root.add(surface);
  });
  return root;
}

export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
