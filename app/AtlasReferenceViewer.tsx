"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ATLAS_CONTOURS_URL,
  ATLAS_FINE_ANATOMY_URL,
  ATLAS_INTERNAL_COMPARTMENTS_URL,
  ATLAS_INTERNAL_DISPLAY_COLORS,
  buildAtlasInternalContourGeometry,
  buildAtlasFineAnatomyGeometry,
  buildPlaneLocalContourSegments,
  buildAtlasReferenceGeometry,
} from "./atlas-reference-geometry.js";
import {
  ATLAS_NATIVE_VOLUME_MANIFEST_SHA256,
  ATLAS_NATIVE_VOLUME_MANIFEST_URL,
  expandNativeVolumeQuadsToDisplayGeometry,
  validateAtlasNativeVolumeManifest,
  validateAtlasNativeVolumeStructure,
} from "./atlas-native-volume-surface.js";
import {
  buildPlanePresenceNavigation,
  isSelectedStructureVisible,
} from "./anatomy-inspector-state.js";

type AtlasPlane = {
  zIndex: number;
  anteriorPosteriorMm: number;
  segment: { value: null; missingReason: string };
  outerContourVoxelXY: [number, number][];
  grayMatterContourVoxelXY: [number, number][];
};

type ContourPayload = {
  coordinateSpaceId: string;
  units: string;
  geometryStatus: "INF";
  method: string;
  measurementUse: "forbidden";
  planes: AtlasPlane[];
};

const SLICE_ROOT = "/data/allen_cord_20um_v3_0";
const NATIVE_VOLUME_ROOT = "/data/allen_cord_20um_native_volume_v2";
const ASSET_MANIFEST_URL = `${SLICE_ROOT}/asset-manifest.json`;
const SOURCE_MANIFEST_URL = `${SLICE_ROOT}/source-atlas-manifest.json`;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

type AssetFileRecord = {
  path: string;
  sha256: string;
  bytes: number;
  zIndex?: number;
  geometryStatus?: string;
  measurementUse?: string;
  registrationCount?: number;
};

type AssetManifest = {
  assetId: string;
  atlas: string;
  atlasVersion: string;
  coordinateSpaceId: string;
  geometryStatus: "INF";
  citation: string;
  license: string;
  sourceManifestSha256: string;
  displayTransformUse: "visualization_only_not_cell_registration";
  registrationError: { value: null; missingReason: string };
  sampledZIndices: number[];
  files: AssetFileRecord[];
};

type ChecksumEvidence = {
  loadedManifestSha256: string | null;
  contourSha256: string;
  contourVerified: boolean;
  internalCompartmentsSha256: string;
  internalCompartmentsVerified: boolean;
  fineAnatomySha256: string;
  fineAnatomyVerified: boolean;
  sourceManifestSha256: string;
  sourceManifestVerified: boolean;
};

type InternalStructureId = keyof typeof ATLAS_INTERNAL_DISPLAY_COLORS;

type InternalContour = {
  planeZIndex: number;
  positions: number[];
  planeLocal: true;
  crossPlaneCorrespondence: "none";
};

type FineAnatomyCategory = "lamina" | "nucleus_or_column" | "tract";
const FINE_CATEGORY_LABELS: Record<FineAnatomyCategory, string> = {
  lamina: "Laminae",
  nucleus_or_column: "Nuclei / columns",
  tract: "Tracts",
};

type NativeSurfaceSemanticLaneId =
  | "interneuron_focused_anatomy"
  | "structural_context"
  | "motor_context";

const NATIVE_SURFACE_LANE_COPY: Record<NativeSurfaceSemanticLaneId, {
  selectorLabel: string;
  statusLabel: string;
  expectedCount: number;
  boundary: string;
}> = {
  interneuron_focused_anatomy: {
    selectorLabel: "Study regions · 37",
    statusLabel: "Interneuron-relevant region",
    expectedCount: 37,
    boundary: "Atlas-region geometry only—not a cell, an interneuron type or an interneuron count.",
  },
  structural_context: {
    selectorLabel: "Structural landmarks · 3",
    statusLabel: "Structural context",
    expectedCount: 3,
    boundary: "Structural context only. These landmark regions are excluded from interneuron counts.",
  },
  motor_context: {
    selectorLabel: "Motor-neuron context · 33",
    statusLabel: "Motor-neuron context",
    expectedCount: 33,
    boundary: "Motor-neuron context only. These source regions are not interneurons and are excluded from interneuron counts.",
  },
};

type FinePlaneRecord = {
  zIndex: number;
  presence: "present" | "missing";
  missingReason?: "source_mask_absent_at_sampled_plane";
  voxelCount: number;
  componentCount: number;
  contourCount: number;
};

type FineContextPlaneRecord = {
  zIndex: number;
  presence: "present" | "missing";
  missingReason?: "source_mask_absent_at_sampled_plane";
  voxelCount: number;
  componentCount: number;
  maskRepresentation?: "native_rgba_overlay_exact_source_pixels";
};

type FineOverlayRecord = {
  path: string;
  sha256: string;
  bytes: number;
  zIndex: number;
  anteriorPosteriorMm: number;
  opaqueVoxelCount: number;
  sourceIdentifiersPresent: number[];
};

type FineOverlayLane = {
  laneId: "interneuron_focused_plus_structural_context" | "motor_context";
  defaultVisibility: "on" | "off";
  includedInInterneuronCounts: false;
  sourceIdentifiers: number[];
  overlayCount: number;
  overlays: FineOverlayRecord[];
};

type ReferenceCameraPreset = "home" | "dorsal" | "right" | "transverse";

type ReferenceCameraRuntime = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  planeRoot: THREE.Group;
  nativeVolumeRoot: THREE.Group;
};

type NativeVolumeRecord = {
  identifier: number;
  annotationValue: number;
  name: string;
  abbreviation: string;
  semanticLaneId: NativeSurfaceSemanticLaneId;
  includedInInterneuronCounts: false;
  path: string;
  sha256: string;
  bytes: number;
  sourceVoxelCount: number;
  rowRunCount: number;
  exposedUnitFaceCount: number;
  greedyQuadCount: number;
  triangleCount: number;
};

type NativeVolumeManifest = {
  assetId: string;
  sourceAtlasAssetId: string;
  sourceVolume: { semanticSha256: string };
  geometryStatus: "INF";
  measurementUse: "forbidden";
  registrationCount: 0;
  totals: {
    structureCount: number;
    sourceVoxelCount: number;
    rowRunCount: number;
    exposedUnitFaceCount: number;
    greedyQuadCount: number;
    triangleCount: number;
  };
  records: NativeVolumeRecord[];
};

type NativeVolumeStructure = {
  identifier: number;
  name: string;
  abbreviation: string;
  sourceColorHexTriplet: string;
  geometryStatus: "INF";
  measurementUse: "forbidden";
  registrationCount: 0;
  mask: {
    sourceVoxelCount: number;
    bounds: {
      minVoxelCenterZyx: [number, number, number];
      maxVoxelCenterZyx: [number, number, number];
    };
  };
  surface: {
    quadsAxisSidePlaneUvStartLength: number[];
    exposedUnitFaceCount: number;
    greedyQuadCount: number;
    triangleCount: number;
    coplanarRectangleReductionRatio: number;
    missingUnitFaceCount: 0;
    extraUnitFaceCount: 0;
  };
};

type FineAnatomyStructure = {
  identifier: number;
  annotationValue: number;
  name: string;
  abbreviation: string;
  parentIdentifier: number;
  rootIdentifierPath: number[];
  sourceHierarchy: Array<{ identifier: number; name: string; abbreviation: string }>;
  browserCategory: FineAnatomyCategory;
  selectionMode: "exact_identifier";
  sourceColorHexTriplet: string;
  fullVolumeDiagnostic: {
    voxelCount: number;
    presence: "present";
    scientificUse: "source_presence_integrity_check_only_not_measurement";
  };
  sampledPlaneSummary: {
    presentPlaneCount: number;
    missingPlaneCount: number;
    sampledVoxelCount: number;
    componentCount: number;
    polygonCount: number;
  };
  planes: FinePlaneRecord[];
  contours: InternalContour[];
};

type FineContextStructure = {
  identifier: number;
  annotationValue: number;
  name: string;
  abbreviation: string;
  parentIdentifier: number;
  rootIdentifierPath: number[];
  sourceHierarchy: Array<{ identifier: number; name: string; abbreviation: string }>;
  contextCategory: "structural_context" | "motor_context";
  maskLane: "interneuron_focused_plus_structural_context" | "motor_context";
  colorHexTriplet: string;
  fullVolumeDiagnostic: {
    voxelCount: number;
    presence: "present";
    scientificUse: "source_presence_integrity_check_only_not_measurement";
  };
  sampledPlaneSummary: {
    presentPlaneCount: number;
    missingPlaneCount: number;
    sampledVoxelCount: number;
    componentCount: number;
  };
  planes: FineContextPlaneRecord[];
};

type FineAnatomyGeometry = {
  assetId: string;
  sourceAtlasAssetId: string;
  coordinateSpaceId: string;
  geometryStatus: "INF";
  measurementUse: "forbidden";
  registrationCount: 0;
  planeCount: number;
  structureCount: number;
  categoryCounts: Record<FineAnatomyCategory, number>;
  totalComponentCount: number;
  totalContourCount: number;
  missingPlaneCount: number;
  fullyUnsampledStructureIdentifiers: number[];
  crossPlaneCorrespondence: "none";
  interpolation: "none";
  directLeafStructureCount: 73;
  structuralContextStructureCount: 3;
  motorContextStructureCount: 33;
  lanePolicy: {
    interneuronFocusedStructureCount: 37;
    interneuronFocusedStructureIdentifiers: number[];
    structuralContextStructureCount: 3;
    structuralContextStructureIdentifiers: number[];
    motorContextStructureCount: 33;
    motorContextStructureIdentifiers: number[];
    allDirectStructureCount: 73;
    motorContextDefaultVisibility: "off";
    atlasRegionCountsAreInterneuronCounts: false;
    motorContextIncludedInInterneuronCounts: false;
  };
  sourceInventory: {
    terminologyIdentifierCount: 83;
    directLeafCount: 73;
    directLeafIdentifiers: number[];
    annotationNonzeroIdentifiers: number[];
    directLeafEqualityValidated: true;
    hierarchyOnlyCount: 10;
    hierarchyOnlyIdentifiers: number[];
    hierarchyOnlyDirectVoxelCount: 0;
    fullVolumeDirectVoxelCount: number;
  };
  sourceStateCount: 32;
  fillOverlayCount: 76;
  fillOverlayLanes: FineOverlayLane[];
  structures: FineAnatomyStructure[];
  structuralContextStructures: FineContextStructure[];
  motorContextStructures: FineContextStructure[];
};

type InternalContourGeometry = {
  assetId: string;
  sourceAtlasAssetId: string;
  coordinateSpaceId: string;
  geometryStatus: "INF";
  measurementUse: "forbidden";
  registrationCount: 0;
  structureCount: number;
  totalContourCount: number;
  missingPlanes: Array<{
    structureIdentifier: number;
    structureName: string;
    zIndex: number;
    reason: string;
  }>;
  crossPlaneCorrespondence: "none";
  interpolation: "none";
  structures: Array<{
    identifier: InternalStructureId;
    name: string;
    selectionMode: "exact_identifier" | "inclusive_descendants";
    contours: InternalContour[];
  }>;
};

type AtlasReferenceBundle = {
  contours: ContourPayload;
  internalCompartments: InternalContourGeometry;
  fineAnatomy: FineAnatomyGeometry;
  nativeVolumeManifest: NativeVolumeManifest | null;
  manifest: AssetManifest;
  checksums: ChecksumEvidence;
  nativeVolumeManifestSha256: string | null;
  nativeVolumeManifestVerified: boolean;
  nativeVolumeManifestError: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeJson(bytes: ArrayBuffer, label: string): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function validateContourPayload(value: unknown): ContourPayload {
  // This is the same fail-closed geometry validator used by the main 3D scene.
  // It enforces INF, measurement-forbidden, no segment labels and the pinned ordered plane set.
  buildAtlasReferenceGeometry(value);
  if (!isRecord(value) || typeof value.units !== "string" || typeof value.method !== "string") {
    throw new Error("Atlas contour display metadata is incomplete");
  }
  const payload = value as unknown as ContourPayload;
  for (const plane of payload.planes) {
    if (
      !Number.isFinite(plane.anteriorPosteriorMm) ||
      typeof plane.segment?.missingReason !== "string"
    ) {
      throw new Error("Atlas plane display metadata is invalid");
    }
  }
  return payload;
}

function validateAssetManifest(
  value: unknown,
  contours: ContourPayload,
  internalCompartments: InternalContourGeometry,
  fineAnatomy: FineAnatomyGeometry,
  contourBytes: number,
  internalCompartmentsBytes: number,
  fineAnatomyBytes: number,
  sourceManifestBytes: number,
): {
  manifest: AssetManifest;
  contourFile: AssetFileRecord;
  internalCompartmentsFile: AssetFileRecord;
  fineAnatomyFile: AssetFileRecord;
  sourceManifestFile: AssetFileRecord;
} {
  if (!isRecord(value) || !Array.isArray(value.files)) {
    throw new Error("Bundled atlas asset manifest is missing");
  }
  const manifest = value as unknown as AssetManifest;
  if (
    typeof manifest.assetId !== "string" ||
    manifest.atlas !== "allen_cord_20um" ||
    manifest.atlasVersion !== "3.0" ||
    manifest.coordinateSpaceId !== contours.coordinateSpaceId ||
    internalCompartments.coordinateSpaceId !== contours.coordinateSpaceId ||
    fineAnatomy.coordinateSpaceId !== contours.coordinateSpaceId ||
    internalCompartments.sourceAtlasAssetId !== manifest.assetId ||
    fineAnatomy.sourceAtlasAssetId !== manifest.assetId ||
    manifest.geometryStatus !== "INF" ||
    manifest.displayTransformUse !== "visualization_only_not_cell_registration" ||
    manifest.registrationError?.value !== null ||
    typeof manifest.citation !== "string" ||
    !manifest.citation.trim() ||
    typeof manifest.license !== "string" ||
    !manifest.license.trim() ||
    !SHA256_PATTERN.test(manifest.sourceManifestSha256)
  ) {
    throw new Error("Bundled atlas asset manifest violates the pinned evidence boundary");
  }
  const contourZ = contours.planes.map((plane) => plane.zIndex);
  if (
    !Array.isArray(manifest.sampledZIndices) ||
    manifest.sampledZIndices.length !== contourZ.length ||
    manifest.sampledZIndices.some((value, index) => value !== contourZ[index])
  ) {
    throw new Error("Asset manifest sampled planes do not match the contour payload");
  }
  const fileRecord = (path: string) => manifest.files.find((file) => file?.path === path);
  const contourFile = fileRecord("atlas-contours.json");
  const internalCompartmentsFile = fileRecord("atlas-internal-compartments.json");
  const fineAnatomyFile = fileRecord("atlas-fine-anatomy.json");
  const sourceManifestFile = fileRecord("source-atlas-manifest.json");
  if (
    !contourFile ||
    !internalCompartmentsFile ||
    !fineAnatomyFile ||
    !sourceManifestFile ||
    !SHA256_PATTERN.test(contourFile.sha256) ||
    !SHA256_PATTERN.test(internalCompartmentsFile.sha256) ||
    !SHA256_PATTERN.test(fineAnatomyFile.sha256) ||
    !SHA256_PATTERN.test(sourceManifestFile.sha256) ||
    contourFile.bytes !== contourBytes ||
    internalCompartmentsFile.bytes !== internalCompartmentsBytes ||
    internalCompartmentsFile.geometryStatus !== "INF" ||
    internalCompartmentsFile.measurementUse !== "forbidden" ||
    internalCompartmentsFile.registrationCount !== 0 ||
    fineAnatomyFile.bytes !== fineAnatomyBytes ||
    fineAnatomyFile.geometryStatus !== "INF" ||
    fineAnatomyFile.measurementUse !== "forbidden" ||
    fineAnatomyFile.registrationCount !== 0 ||
    sourceManifestFile.bytes !== sourceManifestBytes ||
    sourceManifestFile.sha256 !== manifest.sourceManifestSha256
  ) {
    throw new Error("Bundled atlas checksums or byte counts are inconsistent");
  }
  return { manifest, contourFile, internalCompartmentsFile, fineAnatomyFile, sourceManifestFile };
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fetchLocalBytes(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Bundled atlas request failed (${response.status})`);
  return response.arrayBuffer();
}

function voxelToDisplay([x, y]: [number, number], zIndex: number) {
  return new THREE.Vector3(
    x * 0.01 - 1.605,
    1.26 - y * 0.01,
    20 - zIndex * 0.02 * 1.277139,
  );
}

function voxelEdgeXYToDisplay([xEdge, yEdge]: [number, number], zCenterIndex: number) {
  return voxelToDisplay([xEdge - 0.5, yEdge - 0.5], zCenterIndex);
}

function contourLine(
  points: [number, number][],
  zIndex: number,
  color: number,
  opacity: number,
) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map((point) => voxelToDisplay(point, zIndex)),
  );
  const line = new THREE.LineLoop(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
  line.renderOrder = 5;
  return line;
}

function internalContourSegments(
  contours: InternalContour[],
  color: string,
  opacity: number,
  name: string,
) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(buildPlaneLocalContourSegments(contours), 3),
  );
  const segments = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  segments.name = name;
  segments.renderOrder = 4;
  return segments;
}

function exactMaskOverlayPlane(
  overlay: FineOverlayRecord,
  opacity: number,
  name: string,
  onLoadError: () => void,
) {
  const texture = new THREE.TextureLoader().load(
    `${SLICE_ROOT}/${overlay.path}`,
    undefined,
    undefined,
    onLoadError,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  const geometry = new THREE.PlaneGeometry(3.22, 2.53);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    alphaTest: 0.01,
  });
  const plane = new THREE.Mesh(geometry, material);
  const displayCenter = voxelEdgeXYToDisplay([161, 126.5], overlay.zIndex);
  plane.position.copy(displayCenter);
  plane.name = name;
  plane.renderOrder = 2;
  plane.userData = {
    geometryStatus: "INF",
    measurementUse: "forbidden",
    registrationCount: 0,
    sourcePixelMapping: "one_output_pixel_per_source_annotation_voxel",
    displayResampling: "nearest",
    overlaySha256: overlay.sha256,
    opaqueVoxelCount: overlay.opaqueVoxelCount,
    sourceIdentifiersPresent: overlay.sourceIdentifiersPresent,
  };
  return { plane, texture };
}

function disposeObjectTree(root: THREE.Object3D) {
  root.traverse((object) => {
    const drawable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    drawable.geometry?.dispose();
    if (drawable.material) {
      const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function parseAnatomyFocus(focusId: string | null | undefined) {
  const match = /^allen_cord_20um:3\.0:(interneuron-focused_reference|structural_context|motor-neuron_context):([1-9][0-9]*)$/.exec(focusId ?? "");
  return match ? { lane: match[1], identifier: Number(match[2]) } : null;
}

function anatomyFocusId(lane: "interneuron-focused_reference" | "structural_context" | "motor-neuron_context", identifier: number) {
  return `allen_cord_20um:3.0:${lane}:${identifier}`;
}

export default function AtlasReferenceViewer({
  selectedFocusId,
  onSelectedFocusChange,
}: {
  selectedFocusId?: string | null;
  onSelectedFocusChange?: (focusId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fineStructureButtonRefs = useRef(new Map<number, HTMLButtonElement>());
  const cameraRuntimeRef = useRef<ReferenceCameraRuntime | null>(null);
  const cameraPoseRef = useRef({
    position: new THREE.Vector3(12, 9, 31),
    up: new THREE.Vector3(0, 1, 0),
    target: new THREE.Vector3(0, 0, 0),
  });
  const [bundle, setBundle] = useState<AtlasReferenceBundle | null>(null);
  const [planeIndex, setPlaneIndex] = useState(16);
  const [selectedFineStructureId, setSelectedFineStructureId] = useState(1);
  const [fineSearch, setFineSearch] = useState("");
  const [fineCategory, setFineCategory] = useState<"all" | FineAnatomyCategory>("all");
  const [showExactFills, setShowExactFills] = useState(true);
  const [showMotorContext, setShowMotorContext] = useState(false);
  const [nativeSurfaceLaneId, setNativeSurfaceLaneId] =
    useState<NativeSurfaceSemanticLaneId>("interneuron_focused_anatomy");
  const [selectedStructuralContextId, setSelectedStructuralContextId] = useState(16);
  const [selectedMotorContextId, setSelectedMotorContextId] = useState(28);
  const [showNativeVolumeSurface, setShowNativeVolumeSurface] = useState(false);
  const [nativeVolumeStructure, setNativeVolumeStructure] = useState<NativeVolumeStructure | null>(null);
  const [nativeVolumeState, setNativeVolumeState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [nativeVolumeError, setNativeVolumeError] = useState("");
  const [nativeVolumePayloadSha256, setNativeVolumePayloadSha256] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [overlayLoadError, setOverlayLoadError] = useState("");
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    const focus = parseAnatomyFocus(selectedFocusId);
    if (!focus) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (focus.lane === "interneuron-focused_reference") {
        setSelectedFineStructureId(focus.identifier);
        setNativeSurfaceLaneId("interneuron_focused_anatomy");
      } else if (focus.lane === "structural_context") {
        setSelectedStructuralContextId(focus.identifier);
        setNativeSurfaceLaneId("structural_context");
      } else {
        setSelectedMotorContextId(focus.identifier);
        setNativeSurfaceLaneId("motor_context");
        setShowMotorContext(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedFocusId]);

  const selectFineStructure = (identifier: number) => {
    setSelectedFineStructureId(identifier);
    onSelectedFocusChange?.(anatomyFocusId("interneuron-focused_reference", identifier));
  };

  const applyCameraPreset = (preset: ReferenceCameraPreset) => {
    const runtime = cameraRuntimeRef.current;
    if (!runtime) return;
    const { camera, controls } = runtime;
    const pose = cameraPoseRef.current;
    if (preset === "dorsal") {
      camera.position.set(0, 35, 0.01);
      camera.up.set(0, 0, -1);
    } else if (preset === "right") {
      camera.position.set(35, 0, 0);
      camera.up.set(0, 1, 0);
    } else if (preset === "transverse") {
      camera.position.set(0, 0, 35);
      camera.up.set(0, 1, 0);
    } else {
      camera.position.set(12, 9, 31);
      camera.up.set(0, 1, 0);
    }
    controls.target.set(0, 0, 0);
    controls.update();
    pose.position.copy(camera.position);
    pose.up.copy(camera.up);
    pose.target.copy(controls.target);
  };

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const [
          contourResult,
          internalCompartmentsResult,
          fineAnatomyResult,
          assetManifestResult,
          sourceManifestResult,
          nativeVolumeManifestResult,
        ] = await Promise.allSettled([
            fetchLocalBytes(ATLAS_CONTOURS_URL, controller.signal),
            fetchLocalBytes(ATLAS_INTERNAL_COMPARTMENTS_URL, controller.signal),
            fetchLocalBytes(ATLAS_FINE_ANATOMY_URL, controller.signal),
            fetchLocalBytes(ASSET_MANIFEST_URL, controller.signal),
            fetchLocalBytes(SOURCE_MANIFEST_URL, controller.signal),
            fetchLocalBytes(ATLAS_NATIVE_VOLUME_MANIFEST_URL, controller.signal),
          ]);
        const requireBytes = (
          result: PromiseSettledResult<ArrayBuffer>,
          label: string,
        ): ArrayBuffer => {
          if (result.status === "fulfilled") return result.value;
          if (result.reason instanceof Error) throw result.reason;
          throw new Error(`${label} could not be loaded`);
        };
        const contourBuffer = requireBytes(contourResult, "Atlas contours");
        const internalCompartmentsBuffer = requireBytes(
          internalCompartmentsResult,
          "Atlas internal compartments",
        );
        const fineAnatomyBuffer = requireBytes(fineAnatomyResult, "Atlas fine anatomy");
        const assetManifestBuffer = requireBytes(assetManifestResult, "Atlas asset manifest");
        const sourceManifestBuffer = requireBytes(sourceManifestResult, "Atlas source manifest");
        const contours = validateContourPayload(decodeJson(contourBuffer, "Atlas contour payload"));
        const internalCompartments = buildAtlasInternalContourGeometry(
          decodeJson(internalCompartmentsBuffer, "Atlas internal-compartment payload"),
        ) as InternalContourGeometry;
        const fineAnatomy = buildAtlasFineAnatomyGeometry(
          decodeJson(fineAnatomyBuffer, "Atlas fine-anatomy payload"),
        ) as FineAnatomyGeometry;
        const { manifest, contourFile, internalCompartmentsFile, fineAnatomyFile, sourceManifestFile } = validateAssetManifest(
          decodeJson(assetManifestBuffer, "Atlas asset manifest"),
          contours,
          internalCompartments,
          fineAnatomy,
          contourBuffer.byteLength,
          internalCompartmentsBuffer.byteLength,
          fineAnatomyBuffer.byteLength,
          sourceManifestBuffer.byteLength,
        );
        const [
          loadedManifestSha256,
          loadedContourSha256,
          loadedInternalCompartmentsSha256,
          loadedFineAnatomySha256,
          loadedSourceManifestSha256,
        ] =
          await Promise.all([
            sha256Hex(assetManifestBuffer),
            sha256Hex(contourBuffer),
            sha256Hex(internalCompartmentsBuffer),
            sha256Hex(fineAnatomyBuffer),
            sha256Hex(sourceManifestBuffer),
          ]);
        if (loadedContourSha256 && loadedContourSha256 !== contourFile.sha256) {
          throw new Error("Atlas contour payload does not match its bundled SHA-256");
        }
        if (
          loadedInternalCompartmentsSha256 &&
          loadedInternalCompartmentsSha256 !== internalCompartmentsFile.sha256
        ) {
          throw new Error("Atlas internal compartments do not match their bundled SHA-256");
        }
        if (loadedFineAnatomySha256 && loadedFineAnatomySha256 !== fineAnatomyFile.sha256) {
          throw new Error("Atlas fine anatomy does not match its bundled SHA-256");
        }
        if (loadedSourceManifestSha256 && loadedSourceManifestSha256 !== sourceManifestFile.sha256) {
          throw new Error("Source atlas manifest does not match its bundled SHA-256");
        }
        let nativeVolumeManifest: NativeVolumeManifest | null = null;
        let loadedNativeVolumeManifestSha256: string | null = null;
        let nativeVolumeManifestError: string | null = null;
        if (nativeVolumeManifestResult.status === "fulfilled") {
          try {
            loadedNativeVolumeManifestSha256 = await sha256Hex(nativeVolumeManifestResult.value);
            if (!loadedNativeVolumeManifestSha256) {
              throw new Error("Runtime SHA-256 is unavailable for the native-volume manifest");
            }
            if (loadedNativeVolumeManifestSha256 !== ATLAS_NATIVE_VOLUME_MANIFEST_SHA256) {
              throw new Error("Atlas native-volume manifest does not match its independently pinned SHA-256");
            }
            nativeVolumeManifest = validateAtlasNativeVolumeManifest(
              decodeJson(nativeVolumeManifestResult.value, "Atlas native-volume manifest"),
              fineAnatomy,
            ) as NativeVolumeManifest;
          } catch (error: unknown) {
            nativeVolumeManifestError = error instanceof Error
              ? error.message
              : "Atlas native-volume manifest validation failed";
          }
        } else if (!(nativeVolumeManifestResult.reason instanceof DOMException && nativeVolumeManifestResult.reason.name === "AbortError")) {
          nativeVolumeManifestError = nativeVolumeManifestResult.reason instanceof Error
            ? nativeVolumeManifestResult.reason.message
            : "Atlas native-volume manifest could not be loaded";
        }
        if (controller.signal.aborted) return;
        setBundle({
          contours,
          internalCompartments,
          fineAnatomy,
          nativeVolumeManifest,
          manifest,
          checksums: {
            loadedManifestSha256,
            contourSha256: contourFile.sha256,
            contourVerified: loadedContourSha256 === contourFile.sha256,
            internalCompartmentsSha256: internalCompartmentsFile.sha256,
            internalCompartmentsVerified:
              loadedInternalCompartmentsSha256 === internalCompartmentsFile.sha256,
            fineAnatomySha256: fineAnatomyFile.sha256,
            fineAnatomyVerified: loadedFineAnatomySha256 === fineAnatomyFile.sha256,
            sourceManifestSha256: sourceManifestFile.sha256,
            sourceManifestVerified: loadedSourceManifestSha256 === sourceManifestFile.sha256,
          },
          nativeVolumeManifestSha256: loadedNativeVolumeManifestSha256,
          nativeVolumeManifestVerified:
            nativeVolumeManifest !== null &&
            loadedNativeVolumeManifestSha256 === ATLAS_NATIVE_VOLUME_MANIFEST_SHA256,
          nativeVolumeManifestError,
        });
        setPlaneIndex(Math.max(0, Math.floor((contours.planes.length - 1) / 2)));
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Bundled atlas validation failed");
      }
    })();
    return () => controller.abort();
  }, []);

  const data = bundle?.contours ?? null;
  const selectedPlane = data?.planes[planeIndex] ?? null;
  const selectedFineStructure = useMemo(
    () =>
      bundle?.fineAnatomy.structures.find(
        (structure) => structure.identifier === selectedFineStructureId,
      ) ?? null,
    [bundle, selectedFineStructureId],
  );
  const selectedFinePlane = selectedFineStructure?.planes.find(
    (plane) => plane.zIndex === selectedPlane?.zIndex,
  ) ?? null;
  const selectedStructuralContextStructure = bundle?.fineAnatomy.structuralContextStructures.find(
    (structure) => structure.identifier === selectedStructuralContextId,
  ) ?? null;
  const selectedMotorContextStructure = bundle?.fineAnatomy.motorContextStructures.find(
    (structure) => structure.identifier === selectedMotorContextId,
  ) ?? null;
  const selectedNativeTargetStructure = nativeSurfaceLaneId === "interneuron_focused_anatomy"
    ? selectedFineStructure
    : nativeSurfaceLaneId === "structural_context"
      ? selectedStructuralContextStructure
      : selectedMotorContextStructure;
  const selectedNativeTargetId = selectedNativeTargetStructure?.identifier ?? null;
  const activeNativeLaneCopy = NATIVE_SURFACE_LANE_COPY[nativeSurfaceLaneId];
  const nativeLaneRecordCount = bundle?.nativeVolumeManifest?.records.filter(
    (record) => record.semanticLaneId === nativeSurfaceLaneId,
  ).length ?? 0;
  const selectedFineNativeVolumeRecord = bundle?.nativeVolumeManifest?.records.find(
    (record) =>
      record.identifier === selectedFineStructureId &&
      record.semanticLaneId === "interneuron_focused_anatomy",
  ) ?? null;
  const selectedNativeVolumeRecord = bundle?.nativeVolumeManifest?.records.find(
    (record) =>
      record.identifier === selectedNativeTargetId &&
      record.semanticLaneId === nativeSurfaceLaneId,
  ) ?? null;
  const filteredFineStructures = useMemo(() => {
    const query = fineSearch.trim().toLocaleLowerCase("en");
    return (bundle?.fineAnatomy.structures ?? []).filter((structure) => {
      if (fineCategory !== "all" && structure.browserCategory !== fineCategory) return false;
      if (!query) return true;
      return `${structure.identifier} ${structure.name} ${structure.abbreviation}`
        .toLocaleLowerCase("en")
        .includes(query);
    });
  }, [bundle, fineCategory, fineSearch]);
  const selectedFineStructureVisible = selectedFineStructure
    ? isSelectedStructureVisible(filteredFineStructures, selectedFineStructure.identifier)
    : false;
  const selectedPresenceNavigation = useMemo(
    () => selectedFineStructure
      ? buildPlanePresenceNavigation(selectedFineStructure.planes, planeIndex)
      : null,
    [planeIndex, selectedFineStructure],
  );
  const fineRovingStructureId = filteredFineStructures.some(
    (structure) => structure.identifier === selectedFineStructureId,
  )
    ? selectedFineStructureId
    : filteredFineStructures[0]?.identifier;
  const handleFineStructureKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    identifier: number,
  ) => {
    if (!filteredFineStructures.length) return;
    const currentIndex = filteredFineStructures.findIndex(
      (structure) => structure.identifier === identifier,
    );
    if (currentIndex < 0) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % filteredFineStructures.length;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + filteredFineStructures.length) % filteredFineStructures.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = filteredFineStructures.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextIdentifier = filteredFineStructures[nextIndex].identifier;
    selectFineStructure(nextIdentifier);
    fineStructureButtonRefs.current.get(nextIdentifier)?.focus();
  };

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    if (
      !showNativeVolumeSurface || !bundle?.nativeVolumeManifestVerified ||
      !selectedNativeTargetStructure || !selectedNativeVolumeRecord
    ) {
      queueMicrotask(() => {
        if (disposed) return;
        setNativeVolumeStructure(null);
        setNativeVolumePayloadSha256(null);
        setNativeVolumeError("");
        setNativeVolumeState("idle");
      });
      return () => {
        disposed = true;
        controller.abort();
      };
    }
    queueMicrotask(() => {
      if (disposed) return;
      setNativeVolumeStructure(null);
      setNativeVolumePayloadSha256(null);
      setNativeVolumeError("");
      setNativeVolumeState("loading");
    });
    void (async () => {
      try {
        const bytes = await fetchLocalBytes(
          `${NATIVE_VOLUME_ROOT}/${selectedNativeVolumeRecord.path}`,
          controller.signal,
        );
        const loadedSha256 = await sha256Hex(bytes);
        if (bytes.byteLength !== selectedNativeVolumeRecord.bytes) {
          throw new Error("Selected native-volume payload byte count changed");
        }
        if (!loadedSha256) {
          throw new Error("Runtime SHA-256 is unavailable for the selected native-volume payload");
        }
        if (loadedSha256 !== selectedNativeVolumeRecord.sha256) {
          throw new Error("Selected native-volume payload does not match its bundled SHA-256");
        }
        if (disposed) return;
        const validated = validateAtlasNativeVolumeStructure(
          decodeJson(bytes, "Selected native-volume payload"),
          selectedNativeVolumeRecord,
          selectedNativeTargetStructure,
        ) as NativeVolumeStructure;
        if (disposed) return;
        setNativeVolumeStructure(validated);
        setNativeVolumePayloadSha256(loadedSha256);
        setNativeVolumeState("ready");
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (disposed) return;
        setNativeVolumeStructure(null);
        setNativeVolumePayloadSha256(null);
        setNativeVolumeError(
          `${error instanceof Error ? error.message : "Native-volume validation failed"}. The surface is hidden; no replacement geometry was generated.`,
        );
        setNativeVolumeState("error");
      }
    })();
    return () => {
      disposed = true;
      controller.abort();
    };
  }, [bundle, selectedNativeTargetStructure, selectedNativeVolumeRecord, showNativeVolumeSurface]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !bundle) return;
    let lifecycleDisposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setWebGLAvailable(false));
      return;
    }
    queueMicrotask(() => {
      if (!lifecycleDisposed) setWebGLAvailable(true);
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute(
      "aria-label",
      "Loading the validated three-dimensional allen_cord_20um reference derivative.",
    );
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-describedby", "atlas-reference-canvas-accessibility");
    renderer.domElement.tabIndex = -1;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1715);
    scene.fog = new THREE.Fog(0x0e1715, 32, 85);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 160);
    camera.position.copy(cameraPoseRef.current.position);
    camera.up.copy(cameraPoseRef.current.up);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(cameraPoseRef.current.target);
    const rememberCameraPose = () => {
      cameraPoseRef.current.position.copy(camera.position);
      cameraPoseRef.current.up.copy(camera.up);
      cameraPoseRef.current.target.copy(controls.target);
    };
    controls.addEventListener("change", rememberCameraPose);
    const planeRoot = new THREE.Group();
    planeRoot.name = "sampled-plane-and-contour-layers";
    const nativeVolumeRoot = new THREE.Group();
    nativeVolumeRoot.name = "selected-native-volume-surface-layer";
    scene.add(planeRoot, nativeVolumeRoot);

    const axis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -20),
        new THREE.Vector3(0, 0, 20),
      ]),
      new THREE.LineDashedMaterial({
        color: 0xb0c1ba,
        dashSize: 0.45,
        gapSize: 0.3,
        transparent: true,
        opacity: 0.36,
      }),
    );
    axis.computeLineDistances();
    scene.add(axis);
    cameraRuntimeRef.current = { camera, controls, renderer, planeRoot, nativeVolumeRoot };

    const applyResize = () => {
      const width = Math.max(1, Math.floor(container.clientWidth));
      const height = Math.max(1, Math.floor(container.clientHeight));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    let resizeFrame = 0;
    const scheduleResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(applyResize);
    };
    applyResize();
    const observer = new ResizeObserver(scheduleResize);
    observer.observe(container);

    let frame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setWebGLAvailable(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    return () => {
      lifecycleDisposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.removeEventListener("change", rememberCameraPose);
      controls.dispose();
      if (cameraRuntimeRef.current?.camera === camera) cameraRuntimeRef.current = null;
      disposeObjectTree(planeRoot);
      disposeObjectTree(nativeVolumeRoot);
      planeRoot.clear();
      nativeVolumeRoot.clear();
      axis.geometry.dispose();
      (axis.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [bundle]);

  useEffect(() => {
    const runtime = cameraRuntimeRef.current;
    if (!bundle || !runtime) return;
    const { planeRoot: root } = runtime;
    const sceneData = bundle.contours;
    const selectedZIndex = sceneData.planes[planeIndex]?.zIndex;
    const overlayTextures: THREE.Texture[] = [];
    let disposed = false;
    setOverlayLoadError("");
    disposeObjectTree(root);
    root.clear();
    sceneData.planes.forEach((plane, index) => {
      const selected = index === planeIndex;
      root.add(
        contourLine(
          plane.outerContourVoxelXY,
          plane.zIndex,
          selected ? 0xf3b33e : 0x66d7c0,
          selected ? 1 : 0.34,
        ),
      );
      root.add(
        contourLine(
          plane.grayMatterContourVoxelXY,
          plane.zIndex,
          selected ? 0xdab8ff : 0x9272b8,
          selected ? 0.95 : 0.22,
        ),
      );
    });

    const fineFillLane = bundle.fineAnatomy.fillOverlayLanes.find(
      (lane) => lane.laneId === "interneuron_focused_plus_structural_context",
    );
    const motorFillLane = bundle.fineAnatomy.fillOverlayLanes.find(
      (lane) => lane.laneId === "motor_context",
    );
    const addOverlay = (
      overlay: FineOverlayRecord | undefined,
      opacity: number,
      name: string,
      errorLabel: string,
    ) => {
      if (!overlay) return;
      const rendered = exactMaskOverlayPlane(overlay, opacity, name, () => {
        if (!disposed) {
          setOverlayLoadError(
            `${errorLabel} could not be loaded for native z ${overlay.zIndex}. The layer is hidden; no replacement geometry was generated.`,
          );
        }
      });
      root.add(rendered.plane);
      overlayTextures.push(rendered.texture);
    };
    if (showExactFills) {
      addOverlay(
        fineFillLane?.overlays.find((overlay) => overlay.zIndex === selectedZIndex),
        0.62,
        "fine-and-structural-context-selected-plane-exact-native-mask-inf",
        "The exact fine-anatomy and structural-context fill",
      );
      if (showMotorContext) {
        addOverlay(
          motorFillLane?.overlays.find((overlay) => overlay.zIndex === selectedZIndex),
          0.5,
          "motor-context-selected-plane-exact-native-mask-inf-not-interneuron",
          "The exact motor-context fill",
        );
      }
    }

    const internalRoot = new THREE.Group();
    internalRoot.name = "allen-reference-plane-local-internal-contours-inf";
    internalRoot.userData = {
      geometryStatus: bundle.internalCompartments.geometryStatus,
      measurementUse: bundle.internalCompartments.measurementUse,
      registrationCount: bundle.internalCompartments.registrationCount,
      structureCount: bundle.internalCompartments.structureCount,
      totalContourCount: bundle.internalCompartments.totalContourCount,
      missingPlanes: bundle.internalCompartments.missingPlanes,
      crossPlaneCorrespondence: bundle.internalCompartments.crossPlaneCorrespondence,
      interpolation: bundle.internalCompartments.interpolation,
      renderPrimitive: "separate_plane_local_edge_segments",
    };
    bundle.internalCompartments.structures.forEach((structure) => {
      const displayColor = ATLAS_INTERNAL_DISPLAY_COLORS[
        structure.identifier as keyof typeof ATLAS_INTERNAL_DISPLAY_COLORS
      ];
      const selectedContours = structure.contours.filter(
        (contour) => contour.planeZIndex === selectedZIndex,
      );
      const contextContours = structure.contours.filter(
        (contour) => contour.planeZIndex !== selectedZIndex,
      );
      if (contextContours.length) {
        internalRoot.add(
          internalContourSegments(
            contextContours,
            displayColor,
            0.3,
            `source-id-${structure.identifier}-plane-local-context-inf`,
          ),
        );
      }
      if (selectedContours.length) {
        internalRoot.add(
          internalContourSegments(
            selectedContours,
            displayColor,
            structure.identifier === 16 ? 1 : 0.86,
            `source-id-${structure.identifier}-selected-plane-local-inf`,
          ),
        );
      }
    });
    root.add(internalRoot);

    if (selectedFineStructure) {
      const fineRoot = new THREE.Group();
      fineRoot.name = `allen-fine-source-id-${selectedFineStructure.identifier}-plane-local-inf`;
      fineRoot.userData = {
        geometryStatus: bundle.fineAnatomy.geometryStatus,
        measurementUse: bundle.fineAnatomy.measurementUse,
        registrationCount: bundle.fineAnatomy.registrationCount,
        structureIdentifier: selectedFineStructure.identifier,
        sourceHierarchy: selectedFineStructure.rootIdentifierPath,
        browserCategoryAuthority: "project_navigation_only",
        crossPlaneCorrespondence: bundle.fineAnatomy.crossPlaneCorrespondence,
        interpolation: bundle.fineAnatomy.interpolation,
        renderPrimitive: "selected_source_label_separate_plane_local_edge_segments",
      };
      const selectedContours = selectedFineStructure.contours.filter(
        (contour) => contour.planeZIndex === selectedZIndex,
      );
      const contextContours = selectedFineStructure.contours.filter(
        (contour) => contour.planeZIndex !== selectedZIndex,
      );
      if (contextContours.length) {
        fineRoot.add(
          internalContourSegments(
            contextContours,
            selectedFineStructure.sourceColorHexTriplet,
            0.2,
            `fine-source-id-${selectedFineStructure.identifier}-context-plane-edges-inf`,
          ),
        );
      }
      if (selectedContours.length) {
        fineRoot.add(
          internalContourSegments(
            selectedContours,
            selectedFineStructure.sourceColorHexTriplet,
            1,
            `fine-source-id-${selectedFineStructure.identifier}-selected-plane-edges-inf`,
          ),
        );
      }
      root.add(fineRoot);
    }

    return () => {
      disposed = true;
      disposeObjectTree(root);
      root.clear();
      overlayTextures.forEach((texture) => texture.dispose());
    };
  }, [bundle, planeIndex, selectedFineStructure, showExactFills, showMotorContext]);

  useEffect(() => {
    const renderer = cameraRuntimeRef.current?.renderer;
    if (!bundle || !renderer) return;
    renderer.domElement.setAttribute(
      "aria-label",
      `Visual three-dimensional view of the pinned allen_cord_20um derivative across ${bundle.fineAnatomy.planeCount} source planes. Exact native-pixel fills show 37 interneuron-relevant reference regions plus three structural landmarks on the selected plane. Sampled selected-label edges remain separate plane-local records. The selected full-volume voxel-face surface is ${showNativeVolumeSurface ? nativeVolumeState : "off"} for ${activeNativeLaneCopy.statusLabel}${selectedNativeTargetStructure ? `, source ID ${selectedNativeTargetStructure.identifier}, ${selectedNativeTargetStructure.name}` : ""}. ${activeNativeLaneCopy.boundary} Motor-neuron context fills are ${showExactFills && showMotorContext ? "visible" : "off"} and are excluded from interneuron counts. Measurement is forbidden, registrations are zero and segment labels are pending. Use the adjacent sampled-plane slider for keyboard control.`,
    );
  }, [activeNativeLaneCopy, bundle, nativeVolumeState, selectedNativeTargetStructure, showExactFills, showMotorContext, showNativeVolumeSurface]);

  useLayoutEffect(() => {
    const runtime = cameraRuntimeRef.current;
    if (!runtime) return;
    const { nativeVolumeRoot } = runtime;
    disposeObjectTree(nativeVolumeRoot);
    nativeVolumeRoot.clear();
    if (
      !showNativeVolumeSurface || nativeVolumeState !== "ready" || !nativeVolumeStructure ||
      nativeVolumeStructure.identifier !== selectedNativeTargetId
    ) return;

    const display = expandNativeVolumeQuadsToDisplayGeometry(
      nativeVolumeStructure.surface.quadsAxisSidePlaneUvStartLength,
    );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(display.positions, 3));
    geometry.setIndex(display.indices);
    const material = new THREE.MeshBasicMaterial({
      color: nativeVolumeStructure.sourceColorHexTriplet,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${nativeSurfaceLaneId}-source-id-${nativeVolumeStructure.identifier}-exact-native-voxel-face-surface-inf`;
    mesh.renderOrder = 1;
    mesh.userData = {
      geometryStatus: nativeVolumeStructure.geometryStatus,
      measurementUse: nativeVolumeStructure.measurementUse,
      registrationCount: nativeVolumeStructure.registrationCount,
      semanticLaneId: nativeSurfaceLaneId,
      includedInInterneuronCounts: false,
      sourceIdentifier: nativeVolumeStructure.identifier,
      sourceVoxelCount: nativeVolumeStructure.mask.sourceVoxelCount,
      exposedUnitFaceCount: nativeVolumeStructure.surface.exposedUnitFaceCount,
      greedyQuadCount: nativeVolumeStructure.surface.greedyQuadCount,
      missingUnitFaceCount: nativeVolumeStructure.surface.missingUnitFaceCount,
      extraUnitFaceCount: nativeVolumeStructure.surface.extraUnitFaceCount,
      interpolation: "none",
      smoothing: "none",
      decimation: "none",
      displayMeaning: "exact_source_voxel_boundary_not_anatomical_accuracy",
    };
    nativeVolumeRoot.add(mesh);
    return () => {
      disposeObjectTree(nativeVolumeRoot);
      nativeVolumeRoot.clear();
    };
  }, [nativeSurfaceLaneId, nativeVolumeState, nativeVolumeStructure, selectedNativeTargetId, showNativeVolumeSurface]);

  const planeOptions = useMemo(() => data?.planes ?? [], [data]);
  const slicePath = selectedPlane
    ? `${SLICE_ROOT}/slice-z${String(selectedPlane.zIndex).padStart(4, "0")}.png`
    : "";
  const selectedSliceChecksum = bundle?.manifest.files.find(
    (file) => file.path === slicePath.slice(`${SLICE_ROOT}/`.length),
  )?.sha256;
  const selectedFineFillOverlay = bundle?.fineAnatomy.fillOverlayLanes
    .find((lane) => lane.laneId === "interneuron_focused_plus_structural_context")
    ?.overlays.find((overlay) => overlay.zIndex === selectedPlane?.zIndex);
  const selectedMotorFillOverlay = bundle?.fineAnatomy.fillOverlayLanes
    .find((lane) => lane.laneId === "motor_context")
    ?.overlays.find((overlay) => overlay.zIndex === selectedPlane?.zIndex);
  const selectedStructuralContextStructures = (bundle?.fineAnatomy.structuralContextStructures ?? [])
    .filter((structure) => selectedFineFillOverlay?.sourceIdentifiersPresent.includes(structure.identifier));
  const selectedMotorContextStructures = (bundle?.fineAnatomy.motorContextStructures ?? [])
    .filter((structure) => selectedMotorFillOverlay?.sourceIdentifiersPresent.includes(structure.identifier));
  const checksumsVerified = Boolean(
    bundle?.checksums.contourVerified &&
    bundle.checksums.internalCompartmentsVerified &&
    bundle.checksums.fineAnatomyVerified &&
    bundle.checksums.sourceManifestVerified,
  );

  return (
    <div className="atlas-reference-viewer">
      <div className="reference-canvas-card">
        <div className="reference-status-row">
          <span className="badge inferred">INF atlas derivative</span>
          <span>
            {bundle
              ? `${bundle.fineAnatomy.planeCount} planes · ${bundle.fineAnatomy.sourceStateCount}/${bundle.fineAnatomy.sourceStateCount} exact annotation states · ${bundle.fineAnatomy.directLeafStructureCount} direct source-region labels = 37 study regions + 3 structural landmarks + 33 motor-neuron context regions · not cell counts · measurement forbidden · 0 REG`
              : "Loading the 73-leaf sampled-plane anatomy contract…"}
          </span>
          <div className="reference-layer-controls" role="group" aria-label="Exact atlas mask layers">
            <label>
              <input
                type="checkbox"
                checked={showExactFills}
                onChange={(event) => {
                  setShowExactFills(event.target.checked);
                  if (!event.target.checked) setShowMotorContext(false);
                }}
              />
              Exact selected-plane fills
            </label>
            <label>
              <input
                type="checkbox"
                checked={showMotorContext}
                disabled={!showExactFills}
                onChange={(event) => setShowMotorContext(event.target.checked)}
              />
              Motor-neuron selected-plane context · 33 · off by default
            </label>
            <fieldset
              className="reference-native-surface-target"
              aria-describedby="native-surface-boundary"
            >
              <legend>Full-volume surface target · one exact source label at a time</legend>
              <div className="reference-native-surface-lanes" role="group" aria-label="Full-volume surface semantic lane">
                {(
                  [
                    "interneuron_focused_anatomy",
                    "structural_context",
                    "motor_context",
                  ] as NativeSurfaceSemanticLaneId[]
                ).map((laneId) => (
                  <button
                    type="button"
                    key={laneId}
                    className={nativeSurfaceLaneId === laneId ? "active" : ""}
                    aria-pressed={nativeSurfaceLaneId === laneId}
                    disabled={!bundle}
                    onClick={() => {
                      setNativeSurfaceLaneId(laneId);
                      if (laneId === "interneuron_focused_anatomy") {
                        onSelectedFocusChange?.(anatomyFocusId("interneuron-focused_reference", selectedFineStructureId));
                      } else if (laneId === "structural_context") {
                        onSelectedFocusChange?.(anatomyFocusId("structural_context", selectedStructuralContextId));
                      } else {
                        onSelectedFocusChange?.(anatomyFocusId("motor-neuron_context", selectedMotorContextId));
                      }
                    }}
                  >
                    {NATIVE_SURFACE_LANE_COPY[laneId].selectorLabel}
                  </button>
                ))}
              </div>
              {nativeSurfaceLaneId === "interneuron_focused_anatomy" ? (
                <p className="reference-native-target-selection">
                  Surface follows the separate 37-label browser selection: {selectedFineStructure
                    ? `ID ${selectedFineStructure.identifier} · ${selectedFineStructure.name}`
                    : "no study region selected"}.
                </p>
              ) : (
                <label className="reference-native-context-select">
                  {nativeSurfaceLaneId === "structural_context"
                    ? "Structural landmark surface"
                    : "Motor-neuron context surface"}
                  <select
                    value={nativeSurfaceLaneId === "structural_context"
                      ? selectedStructuralContextId
                      : selectedMotorContextId}
                    disabled={!bundle}
                    onChange={(event) => {
                      const identifier = Number(event.target.value);
                      if (nativeSurfaceLaneId === "structural_context") {
                        setSelectedStructuralContextId(identifier);
                        onSelectedFocusChange?.(anatomyFocusId("structural_context", identifier));
                      } else {
                        setSelectedMotorContextId(identifier);
                        onSelectedFocusChange?.(anatomyFocusId("motor-neuron_context", identifier));
                      }
                    }}
                  >
                    {(nativeSurfaceLaneId === "structural_context"
                      ? bundle?.fineAnatomy.structuralContextStructures ?? []
                      : bundle?.fineAnatomy.motorContextStructures ?? []
                    ).map((structure) => (
                      <option key={structure.identifier} value={structure.identifier}>
                        ID {structure.identifier} · {structure.abbreviation} · {structure.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p id="native-surface-boundary" className="reference-native-surface-boundary">
                <strong>{activeNativeLaneCopy.statusLabel}</strong> · {activeNativeLaneCopy.boundary}
              </p>
            </fieldset>
            <label aria-describedby="native-surface-boundary">
              <input
                type="checkbox"
                checked={showNativeVolumeSurface}
                disabled={!bundle?.nativeVolumeManifestVerified || !selectedNativeVolumeRecord || !webGLAvailable}
                onChange={(event) => setShowNativeVolumeSurface(event.target.checked)}
              />
              Show selected full-volume voxel surface · off by default
            </label>
          </div>
          <p className="reference-native-volume-status" role="status" aria-live="polite" aria-atomic="true">
            {!showNativeVolumeSurface
              ? bundle?.nativeVolumeManifestVerified
                ? `Full-volume surface off · ${nativeLaneRecordCount}/${activeNativeLaneCopy.expectedCount} ${activeNativeLaneCopy.statusLabel.toLocaleLowerCase("en")} payloads available in this lane. ${activeNativeLaneCopy.boundary}`
                : `Native-volume surface unavailable · ${bundle?.nativeVolumeManifestError ?? "runtime manifest SHA-256 verification is required"}. The base atlas remains available; no replacement surface geometry is generated.`
              : nativeVolumeState === "loading"
                ? `Loading and validating ${activeNativeLaneCopy.statusLabel.toLocaleLowerCase("en")} ID ${selectedNativeTargetId ?? "unknown"}${selectedNativeTargetStructure ? ` · ${selectedNativeTargetStructure.name}` : ""}…`
                : nativeVolumeState === "ready" && nativeVolumeStructure
                  ? `${activeNativeLaneCopy.statusLabel} · ID ${nativeVolumeStructure.identifier} ready · ${nativeVolumeStructure.mask.sourceVoxelCount.toLocaleString("en-US")} source voxels · ${nativeVolumeStructure.surface.greedyQuadCount.toLocaleString("en-US")} lossless rectangles · 0 missing/extra unit faces. ${activeNativeLaneCopy.boundary}`
                  : nativeVolumeState === "error"
                    ? `${activeNativeLaneCopy.statusLabel} surface unavailable; fail-closed state active. ${activeNativeLaneCopy.boundary}`
                    : `No validated ${activeNativeLaneCopy.statusLabel.toLocaleLowerCase("en")} payload is active; no replacement geometry is generated.`
            }
          </p>
          <div className="reference-camera-controls" role="group" aria-label="Reference camera presets">
            {(["home", "dorsal", "right", "transverse"] as ReferenceCameraPreset[]).map((preset) => (
              <button
                type="button"
                key={preset}
                disabled={!bundle || !webGLAvailable}
                onClick={() => applyCameraPreset(preset)}
              >
                {preset === "home" ? "Home" : preset === "dorsal" ? "Dorsal" : preset === "right" ? "Right" : "Transverse"}
              </button>
            ))}
          </div>
          {overlayLoadError && (
            <p className="reference-layer-error" role="alert">{overlayLoadError}</p>
          )}
          {nativeVolumeError && (
            <p className="reference-layer-error" role="alert">{nativeVolumeError}</p>
          )}
        </div>
        <div className="reference-three-stage" ref={containerRef}>
          {!data && !loadError && <p>Loading local atlas reference…</p>}
          {loadError && <p role="alert">Atlas asset unavailable: {loadError}</p>}
          {!webGLAvailable && (
            <p role="status">3D envelope unavailable; the native reference plane remains visible.</p>
          )}
          <span className="reference-rostral">ROSTRAL / ANTERIOR</span>
          <span className="reference-caudal">CAUDAL / POSTERIOR</span>
        </div>
        <p id="atlas-reference-canvas-accessibility" className="reference-accessibility-note">
          Pointer drag and wheel adjust the visual canvas. Keyboard users can use the camera presets
          and inspect every admitted plane with the adjacent sampled-plane slider.
        </p>
        {bundle && (
          <div className="reference-internal-summary">
            <strong>Source-exact internal masks · mixed identifier scopes · fills + edges · INF</strong>
            <span>
              {bundle.internalCompartments.structureCount} major source IDs · {bundle.internalCompartments.totalContourCount} sampled plane-local contours · {bundle.internalCompartments.missingPlanes.length} explicit plane-local missing records. Those major-context contours remain unjoined and uninterpolated.
            </span>
            <span>
              Separate lazy targets retain full-volume exact-label masks and lossless exposed-voxel-face surfaces for 37 study regions, three structural landmarks and 33 motor-neuron context regions. Only one source label is loaded at a time; the role lanes remain separate and none is a cell count.
            </span>
            <span>
              The native 322 × 253 fill is one output pixel per source annotation voxel and uses nearest-neighbour display. Source colors are preserved, source IDs remain in metadata, and atlas regions are not interneuron counts.
            </span>
            <span>
              Source colors are preserved for display, but color is not a unique identifier. Label
              identity remains in source-ID metadata and the selected-label edge layer.
            </span>
            <span>
              Selected-plane structural context: {selectedStructuralContextStructures.length
                ? selectedStructuralContextStructures
                    .map((structure) => `ID ${structure.identifier} · ${structure.name}`)
                    .join("; ")
                : "no structural-context source mask is present"}.
            </span>
            <span>
              {showMotorContext
                ? `Selected-plane motor context: ${selectedMotorContextStructures.length
                    ? selectedMotorContextStructures
                        .map((structure) => `ID ${structure.identifier} · ${structure.name}`)
                        .join("; ")
                    : "no motor-context source mask is present"}. These labels are not interneuron counts.`
                : "Motor context is off. Enable it to expose the source IDs and names present on this plane; these labels are not interneuron counts."}
            </span>
            <ul aria-label="Internal atlas structure display legend">
              {bundle.internalCompartments.structures.map((structure) => (
                <li key={structure.identifier}>
                  <i
                    aria-hidden="true"
                    style={{
                      backgroundColor:
                        ATLAS_INTERNAL_DISPLAY_COLORS[
                          structure.identifier as keyof typeof ATLAS_INTERNAL_DISPLAY_COLORS
                        ],
                    }}
                  />
                  <span>
                    ID {structure.identifier} · {structure.name}
                    <small>
                      {structure.selectionMode === "exact_identifier"
                        ? "Exact identifier only"
                        : "Inclusive descendants"}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {bundle && (
          <section className="fine-anatomy-browser" aria-labelledby="fine-anatomy-heading">
            <div className="fine-anatomy-heading">
              <div>
                <span>EXACT SOURCE-LABEL BROWSER · INF</span>
                <h3 id="fine-anatomy-heading">37 interneuron-relevant reference regions</h3>
              </div>
              <span className="badge inferred">14 + 17 + 6</span>
            </div>
            <p className="fine-anatomy-boundary">
              Individual laminae, named nuclei/columns and tracts come from exact Allen annotation
              values. Central canal and lateral/ventral funiculi are added as three muted structural
              context labels. The 33 motor-neuron labels remain a separate, off-by-default context
              lane and are excluded from interneuron counts. All 73 records are atlas regions—not
              cells, cell types or a biological census. Sampled edges remain separate plane-local
              records. When this 37-region lane is targeted, the selected label&apos;s full-volume surface is loaded from its
              checksum-locked exact annotation mask and lossless voxel faces—not inferred between
              sampled planes.
            </p>
            <div className="fine-anatomy-controls">
              <label>
                Search source name, abbreviation or ID
                <input
                  type="search"
                  value={fineSearch}
                  placeholder="e.g. Clarke, IML, 62"
                  onChange={(event) => setFineSearch(event.target.value)}
                />
              </label>
              <div role="group" aria-label="Fine anatomy navigation categories">
                <button
                  type="button"
                  className={fineCategory === "all" ? "active" : ""}
                  aria-pressed={fineCategory === "all"}
                  onClick={() => setFineCategory("all")}
                >
                  All · {bundle.fineAnatomy.structureCount}
                </button>
                {(Object.keys(FINE_CATEGORY_LABELS) as FineAnatomyCategory[]).map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={fineCategory === category ? "active" : ""}
                    aria-pressed={fineCategory === category}
                    onClick={() => setFineCategory(category)}
                  >
                    {FINE_CATEGORY_LABELS[category]} · {bundle.fineAnatomy.categoryCounts[category]}
                  </button>
                ))}
              </div>
            </div>
            <p className="fine-anatomy-result-status" role="status" aria-live="polite">
              {filteredFineStructures.length} of {bundle.fineAnatomy.structureCount} source labels shown.{" "}
              Use Arrow keys, Home and End within the single-selection list.
            </p>
            <div className="fine-anatomy-grid">
              <div
                className="fine-anatomy-list"
                role="radiogroup"
                aria-label="Source-labelled fine structures"
              >
                {filteredFineStructures.map((structure) => {
                  const plane = structure.planes.find(
                    (candidate) => candidate.zIndex === selectedPlane?.zIndex,
                  );
                  return (
                    <button
                      type="button"
                      key={structure.identifier}
                      className={structure.identifier === selectedFineStructureId ? "selected" : ""}
                      role="radio"
                      aria-checked={structure.identifier === selectedFineStructureId}
                      tabIndex={structure.identifier === fineRovingStructureId ? 0 : -1}
                      onClick={() => selectFineStructure(structure.identifier)}
                      onKeyDown={(event) => handleFineStructureKeyDown(event, structure.identifier)}
                      ref={(node) => {
                        if (node) fineStructureButtonRefs.current.set(structure.identifier, node);
                        else fineStructureButtonRefs.current.delete(structure.identifier);
                      }}
                    >
                      <i aria-hidden="true" style={{ backgroundColor: structure.sourceColorHexTriplet }} />
                      <span>
                        <strong>{structure.abbreviation} · {structure.name}</strong>
                        <small>
                          ID {structure.identifier} · {plane?.presence === "present"
                            ? `${plane.componentCount} component${plane.componentCount === 1 ? "" : "s"} on plane`
                            : "source mask absent on plane"}
                        </small>
                      </span>
                    </button>
                  );
                })}
                {!filteredFineStructures.length && (
                  <p role="status">
                    No browser match. This is a navigation filter result, not anatomical absence.
                  </p>
                )}
              </div>
              {selectedFineStructure && selectedFineStructureVisible && (
                <article className="fine-anatomy-detail">
                  <div className="fine-anatomy-inspector-context">
                    <div className="fine-anatomy-detail-title">
                      <i
                        aria-hidden="true"
                        style={{ backgroundColor: selectedFineStructure.sourceColorHexTriplet }}
                      />
                      <div>
                        <span>SOURCE ID {selectedFineStructure.identifier} · {selectedFineStructure.abbreviation}</span>
                        <h4>{selectedFineStructure.name}</h4>
                      </div>
                    </div>
                    <p className={`fine-plane-status ${selectedFinePlane?.presence ?? "missing"}`}>
                      {selectedFinePlane?.presence === "present"
                        ? `Current plane: present · ${selectedFinePlane.componentCount} exact component${selectedFinePlane.componentCount === 1 ? "" : "s"} · ${selectedFinePlane.contourCount} ring${selectedFinePlane.contourCount === 1 ? "" : "s"}.`
                        : "Current plane: source mask absent. No replacement geometry is drawn."}
                    </p>
                    <div className="fine-presence-navigation" aria-label="Selected-label present-plane navigation">
                      <button
                        type="button"
                        disabled={typeof selectedPresenceNavigation?.previousPresentIndex !== "number"}
                        onClick={() => {
                          if (typeof selectedPresenceNavigation?.previousPresentIndex === "number") {
                            setPlaneIndex(selectedPresenceNavigation.previousPresentIndex);
                          }
                        }}
                      >
                        Previous present
                      </button>
                      <span>
                        {selectedFineStructure.sampledPlaneSummary.presentPlaneCount}/{bundle.fineAnatomy.planeCount} sampled planes present
                      </span>
                      <button
                        type="button"
                        disabled={typeof selectedPresenceNavigation?.nextPresentIndex !== "number"}
                        onClick={() => {
                          if (typeof selectedPresenceNavigation?.nextPresentIndex === "number") {
                            setPlaneIndex(selectedPresenceNavigation.nextPresentIndex);
                          }
                        }}
                      >
                        Next present
                      </button>
                    </div>
                    <div className="fine-presence-strip" role="group" aria-label="Presence across all 38 sampled atlas planes">
                      {planeOptions.map((plane, index) => {
                        const sourcePlane = selectedFineStructure.planes[index];
                        return (
                          <button
                            type="button"
                            key={plane.zIndex}
                            className={`${sourcePlane.presence} ${index === planeIndex ? "current" : ""}`}
                            aria-current={index === planeIndex ? "true" : undefined}
                            aria-label={`Plane ${index + 1} of ${planeOptions.length}, native z ${plane.zIndex}, AP ${plane.anteriorPosteriorMm.toFixed(2)} millimetres: source label ${sourcePlane.presence}`}
                            onClick={() => setPlaneIndex(index)}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>Navigation group</dt>
                      <dd>{FINE_CATEGORY_LABELS[selectedFineStructure.browserCategory]} · project navigation only</dd>
                    </div>
                    <div>
                      <dt>Mask scope</dt>
                      <dd>Exact identifier only · descendants excluded</dd>
                    </div>
                    <div>
                      <dt>Sample coverage</dt>
                      <dd>
                        {selectedFineStructure.sampledPlaneSummary.presentPlaneCount}/{bundle.fineAnatomy.planeCount} planes present ·
                        {" "}{selectedFineStructure.sampledPlaneSummary.missingPlaneCount} explicit missing
                      </dd>
                    </div>
                    <div>
                      <dt>Full source volume</dt>
                      <dd>
                        {selectedFineNativeVolumeRecord
                          ? `${selectedFineNativeVolumeRecord.sourceVoxelCount.toLocaleString("en-US")} exact source-label voxels · integrity/visualization only`
                          : "Unavailable · no replacement geometry generated"}
                      </dd>
                    </div>
                    <div>
                      <dt>Native voxel surface</dt>
                      <dd>
                        {nativeSurfaceLaneId !== "interneuron_focused_anatomy"
                          ? `Not active · full-volume target is ${activeNativeLaneCopy.statusLabel.toLocaleLowerCase("en")}`
                          : nativeVolumeState === "ready" && nativeVolumeStructure &&
                              nativeVolumeStructure.identifier === selectedFineStructure.identifier
                          ? `${nativeVolumeStructure.surface.greedyQuadCount.toLocaleString("en-US")} lossless rectangles · ${nativeVolumeStructure.surface.triangleCount.toLocaleString("en-US")} display triangles · 0 missing/extra faces`
                          : showNativeVolumeSurface
                            ? nativeVolumeState === "loading" ? "Validating selected lazy payload…" : "Hidden after fail-closed validation"
                            : "Off by default · enable above to load only this source label"}
                      </dd>
                    </div>
                  </dl>
                  <div className="fine-source-path">
                    <span>Pinned source hierarchy</span>
                    <ol>
                      {selectedFineStructure.sourceHierarchy.map((entry) => (
                        <li key={entry.identifier}>ID {entry.identifier} · {entry.name}</li>
                      ))}
                    </ol>
                  </div>
                  <p className="fine-sampling-warning">
                    Five nonuniform source planes were added so the 38-plane display represents all
                    32 contiguous z-wise annotation-state runs in this pinned volume. These states are
                    not spinal segments or independent specimens. Every contour remains INF and
                    measurement is forbidden.
                  </p>
                </article>
              )}
              {selectedFineStructure && !selectedFineStructureVisible && (
                <aside className="fine-anatomy-empty-detail" role="status">
                  <strong>Current 3D selection retained · dossier hidden</strong>
                  <p>
                    {filteredFineStructures.length === 0
                      ? `No matching source label. ID ${selectedFineStructure.identifier} remains selected in the 3D view, but its dossier is outside this result set.`
                      : `ID ${selectedFineStructure.identifier} is hidden by this filter. Choose one of the ${filteredFineStructures.length} visible source labels to open its dossier.`}
                  </p>
                  <p>Filtering never changes anatomy and never creates an absence record.</p>
                </aside>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="reference-plane-card">
        <div className="reference-plane-heading">
          <div>
            <span>ALLEN CORD 20 µm · v3.0</span>
            <strong>
              {selectedPlane
                ? `z ${selectedPlane.zIndex} · AP ${selectedPlane.anteriorPosteriorMm.toFixed(2)} mm`
                : "Loading plane"}
            </strong>
          </div>
          <span className="badge inferred">INF</span>
        </div>
        {selectedPlane && (
          // The asset is generated locally from the pinned atlas and needs its native pixels.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slicePath}
            alt={`Annotated Nissl reference plane at native atlas z index ${selectedPlane.zIndex}`}
          />
        )}
        <label>
          Sampled atlas plane
          <input
            type="range"
            min={0}
            max={Math.max(0, planeOptions.length - 1)}
            step={1}
            value={planeIndex}
            disabled={!planeOptions.length}
            aria-valuetext={selectedPlane
              ? `Plane ${planeIndex + 1} of ${planeOptions.length}, native z ${selectedPlane.zIndex}, AP ${selectedPlane.anteriorPosteriorMm.toFixed(2)} millimetres`
              : "No atlas plane loaded"}
            aria-describedby="atlas-plane-live-status"
            onChange={(event) => setPlaneIndex(Number(event.target.value))}
          />
        </label>
        <p id="atlas-plane-live-status" className="reference-plane-live-status" role="status" aria-live="polite" aria-atomic="true">
          {selectedPlane
            ? `Plane ${planeIndex + 1} of ${planeOptions.length} · native z ${selectedPlane.zIndex} · AP ${selectedPlane.anteriorPosteriorMm.toFixed(2)} mm. ${selectedFineStructure
                ? `Selected source label ID ${selectedFineStructure.identifier}, ${selectedFineStructure.name}: ${selectedFinePlane?.presence === "present"
                    ? `present with ${selectedFinePlane.componentCount} exact component${selectedFinePlane.componentCount === 1 ? "" : "s"}`
                    : "source mask absent; no replacement geometry drawn"}.`
                : "No source label selected."}`
            : "No atlas plane loaded."}
        </p>
        <p>
          Segment identity is <strong>pending curation</strong>. BrainGlobe terminology does not
          encode longitudinal C1–S3 boundaries, so this view reports only native z and AP mm.
        </p>
        <p className="reference-method">
          {data?.method ?? "Local, version-pinned atlas derivative."} Measurement use: forbidden.
        </p>
        {bundle && (
          <section className="reference-provenance" aria-label="Bundled atlas provenance and checksums">
            <h3>Bundled reference provenance</h3>
            <dl>
              <div>
                <dt>Asset ID</dt>
                <dd>{bundle.manifest.assetId}</dd>
              </div>
              <div>
                <dt>Citation</dt>
                <dd>{bundle.manifest.citation}</dd>
              </div>
              <div>
                <dt>License</dt>
                <dd>{bundle.manifest.license}</dd>
              </div>
              <div>
                <dt>Loaded asset-manifest SHA-256</dt>
                <dd><code>{bundle.checksums.loadedManifestSha256 ?? "Runtime hashing unavailable"}</code></dd>
              </div>
              <div>
                <dt>Contour payload SHA-256</dt>
                <dd><code>{bundle.checksums.contourSha256}</code></dd>
              </div>
              <div>
                <dt>Internal-compartment SHA-256</dt>
                <dd><code>{bundle.checksums.internalCompartmentsSha256}</code></dd>
              </div>
              <div>
                <dt>Fine-anatomy SHA-256</dt>
                <dd><code>{bundle.checksums.fineAnatomySha256}</code></dd>
              </div>
              <div>
                <dt>Native-volume manifest SHA-256 · expected</dt>
                <dd><code>{ATLAS_NATIVE_VOLUME_MANIFEST_SHA256}</code></dd>
              </div>
              <div>
                <dt>Native-volume manifest SHA-256 · runtime</dt>
                <dd><code>{bundle.nativeVolumeManifestSha256 ?? "Unavailable · surface disabled"}</code></dd>
              </div>
              <div>
                <dt>Full annotation semantic SHA-256</dt>
                <dd><code>{bundle.nativeVolumeManifest?.sourceVolume.semanticSha256 ?? "Unavailable · optional surface lane disabled"}</code></dd>
              </div>
              {bundle.nativeVolumeManifestError && (
                <div>
                  <dt>Optional native-volume manifest state</dt>
                  <dd>Disabled fail-closed · {bundle.nativeVolumeManifestError} · base sampled-plane atlas retained</dd>
                </div>
              )}
              {selectedNativeVolumeRecord && (
                <>
                  <div>
                    <dt>Selected surface role</dt>
                    <dd>
                      {activeNativeLaneCopy.statusLabel} · source ID {selectedNativeVolumeRecord.identifier} · excluded from interneuron counts
                    </dd>
                  </div>
                  <div>
                    <dt>Selected native-volume payload SHA-256 · expected</dt>
                    <dd><code>{selectedNativeVolumeRecord.sha256}</code></dd>
                  </div>
                  <div>
                    <dt>Selected native-volume payload SHA-256 · runtime</dt>
                    <dd><code>{nativeVolumePayloadSha256 ?? "Not loaded or unavailable"}</code></dd>
                  </div>
                </>
              )}
              <div>
                <dt>Pinned direct-label inventory</dt>
                <dd>
                  {bundle.fineAnatomy.directLeafStructureCount}/73 direct leaves validated · 0 direct-mask voxels in hierarchy-only IDs
                </dd>
              </div>
              <div>
                <dt>Exact z-wise source-state coverage</dt>
                <dd>
                  {bundle.fineAnatomy.sourceStateCount}/{bundle.fineAnatomy.sourceStateCount} annotation states · not spinal segments
                </dd>
              </div>
              <div>
                <dt>Pinned source-manifest SHA-256</dt>
                <dd><code>{bundle.checksums.sourceManifestSha256}</code></dd>
              </div>
              {selectedSliceChecksum && (
                <div>
                  <dt>Selected PNG SHA-256 · manifest-declared</dt>
                  <dd><code>{selectedSliceChecksum}</code></dd>
                </div>
              )}
              {selectedFineFillOverlay && (
                <div>
                  <dt>Selected fine + structural fill SHA-256 · manifest-declared</dt>
                  <dd><code>{selectedFineFillOverlay.sha256}</code></dd>
                </div>
              )}
              {showMotorContext && selectedMotorFillOverlay && (
                <div>
                  <dt>Selected motor-context fill SHA-256 · manifest-declared</dt>
                  <dd><code>{selectedMotorFillOverlay.sha256}</code></dd>
                </div>
              )}
            </dl>
            <p className={`reference-checksum-status ${checksumsVerified ? "verified" : "declared"}`}>
              {checksumsVerified
                ? `Runtime verified: the local contour payload, major compartments, fine-anatomy contract and pinned source manifest match the bundled SHA-256 records. The native-volume manifest ${bundle.nativeVolumeManifestVerified ? "matches its independent digest" : "could not be independently verified, so its surface lane is disabled"}; an enabled selected-label payload must match its runtime SHA-256 and mask-to-surface contract before display. Selected fill-image hashes are manifest-declared here and enforced by the offline validator.`
                : "Manifest-declared checksums shown; this browser did not provide runtime SHA-256 verification."}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
