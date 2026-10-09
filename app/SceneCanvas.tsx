"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { computeMainSceneSourceCameraFit, sameMainSceneCameraForCapture } from "./main-scene-source-camera-fit.js";
import { attachSwcNeuriteInspection } from "./morphology-neurite-inspection.js";
import MorphologyNeuriteInspector, { type NeuriteInspectionController, type NeuriteInspectionSelection } from "./MorphologyNeuriteInspector";
import nmo45718DatSwcCrosswalkContractJson from "../data/neurolucida-dat-swc-crosswalk-0.1.json";
import { readVerifiedMainSceneMorphology, mainSceneMorphologyVerification, type MainSceneMorphologyProof, type MainSceneMorphologyContext, type MainSceneMorphologyGeometry } from "./main-scene-morphology-verification.js";
import { captureMainSceneSourceView, validateMainSceneSourceViewReplay, assertMainSceneSourceViewApplied, mainSceneViewEqual,
  type MainSceneSourceView, type MainSceneSourceViewDocument, type MainSceneViewRequest, type MainSceneSourceViewTools } from "./main-scene-source-view.js";
import { appendMainSceneExportPng, type MainSceneExportView } from "./main-scene-export.js";
import { readVerifiedMainSceneAuxiliary, mainSceneAuxiliaryBytes, mainSceneAuxiliaryJson, mainSceneAuxiliaryProof,
  type MainSceneAuxiliaryToken } from "./main-scene-auxiliary-verification.js";
import {
  crossRegionInternalReference,
  evidenceAware3dRepresentationContract,
  micronsObservedCellNucleusReference,
  micronsSourceNativeClipping,
  morphologyFidelityContract,
  morphologyFidelityRecords,
  observedCellFormLens,
  observedMorphologyRouteByNeuronId,
  observedMorphologyRepresentationRouteId,
  TRANSMITTER_COLORS,
  type AtlasEntity,
  type MorphologyFidelityRecord,
} from "./atlas-types";
import {
  RADIUS_SURFACE_ALGORITHM_ID,
  createObservedSwcCenterlines,
  createObservedTopologyLandmarks,
  extractObservedTopologyLandmarks,
  createRadiusDerivedSurface,
} from "./source-local-morphology-geometry.js";
import {
  NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS,
  validateNmo45718DatSwcCrosswalk,
} from "./neurolucida-dat-swc-crosswalk.js";
import {
  ATLAS_CONTOURS_URL,
  ATLAS_INTERNAL_COMPARTMENTS_URL,
  ATLAS_INTERNAL_DISPLAY_COLORS,
  buildAtlasInternalContourGeometry,
  buildAtlasReferenceGeometry,
  buildPlaneLocalContourSegments,
} from "./atlas-reference-geometry.js";
import {
  buildMicronsClipRuntimeReceipt,
  buildMicronsWorldClippingPlane,
} from "./microns-source-native-clipping.js";

export type CameraView = "home" | "cell_detail" | "microns_observed_reference" | "internal_reference" | "dorsal" | "right" | "transverse";
export type MorphologyFidelityMode = "observed_swc" | "radius_surface";
export type Nmo45718DatSwcCrosswalkRuntime = {
  status: "idle" | "loading" | "verified" | "unavailable";
  message: string;
};

export type MicronsClippingState = {
  enabled: boolean;
  axis: "x" | "y" | "z";
  positionNanometre: number;
  keepSide: "positive" | "negative";
};

export type MicronsClippingRuntimeReceipt = {
  contractId: string;
  releaseId: string;
  enabled: boolean;
  axis: "x" | "y" | "z";
  positionNanometre: number;
  keepSide: "positive" | "negative";
  sourceBoundsNanometre: { minimum: number; maximum: number };
  positionViewerUnit: number;
  worldNormal: number[];
  worldConstant: number;
  renderTarget: "cell_segmentation_surface_only";
  cellClippingPlaneCount: number;
  nucleusClippingPlaneCount: 0;
  nucleusIntact: true;
  capPrimitiveCount: 0;
  geometryMutationCount: 0;
  generatedGeometryCount: 0;
  joinCount: 0;
  registrationCount: 0;
  measurementClaim: false;
};

export type MorphologyRuntimeReceipt = {
  requestedNeuronId: number;
  requestedMode: MorphologyFidelityMode;
  actualMode: MorphologyFidelityMode | null;
  assetId: string | null;
  geometrySha256: string | null;
  verificationStatus: "loading" | "verified" | "unavailable" | "failed";
  sceneObjectStatus: "not_rendered" | "rendered";
  visible: boolean;
  algorithmId: string | null;
  reason: string | null;
  sourceGeometryVerification?: MainSceneMorphologyProof | null;
  sourceContext?: MainSceneMorphologyContext | null;
};

export type MicronsObservedReferenceRuntimeReceipt = {
  contractId: string;
  releaseId: string;
  requested: boolean;
  verificationStatus: "idle" | "loading" | "verified" | "unavailable";
  sceneObjectStatus: "not_rendered" | "rendered";
  cellSurfaceVisible: boolean;
  nucleusVisible: boolean;
  clipping: MicronsClippingRuntimeReceipt;
  expectedManifestSha256: string;
  verifiedAssetReceipt: {
    manifest: {
      path: string;
      bytes: number;
      expectedSha256: string;
      verifiedSha256: string;
    };
    components: Array<{
      componentName: "cell" | "nucleus";
      objectId: string;
      vertexCount: number;
      triangleCount: number;
      positions: {
        path: string;
        bytes: number;
        expectedSha256: string;
        verifiedSha256: string;
      };
      triangles: {
        path: string;
        bytes: number;
        expectedSha256: string;
        verifiedSha256: string;
      };
    }>;
  } | null;
  reason: string | null;
};

export type RenderPerformance = {
  fps: number;
  frameP95Ms: number;
  drawCalls: number;
  triangles: number;
};

export type ViewportCapture = (options: {
  releaseId: string;
  selectedLabel: string | null;
  morphologyRuntime: MorphologyRuntimeReceipt;
  micronsRuntime: MicronsObservedReferenceRuntimeReceipt;
  requestedState: object;
  currentNeuronId: number | null;
}) => Promise<Blob>;

type Props = {
  entities: AtlasEntity[];
  visibleIds: string[];
  selectedId: string | null;
  view: CameraView;
  sliceZ: number;
  showScaffold: boolean;
  showGrayMatter: boolean;
  showEntities: boolean;
  showObservedCellForm: boolean;
  showNmo45718DatSwcCrosswalk: boolean;
  morphologyTargetActive: boolean;
  showMicronsCellSurface: boolean;
  showMicronsNucleus: boolean;
  micronsClipping: MicronsClippingState;
  observedCellFormId: number;
  morphologyFidelityMode: MorphologyFidelityMode;
  sourceViewRequest: MainSceneViewRequest;
  inspectionHost: HTMLDivElement | null;
  onApplySourceViewRequest: (request: MainSceneViewRequest, visibleIds: string[]) => void;
  onSourceViewTools: (tools: MainSceneSourceViewTools | null) => void;
  onSelect: (id: string) => void;
  onWebGLStatus: (available: boolean) => void;
  onCaptureReady: (capture: ViewportCapture | null) => void;
  onPerformance: (performance: RenderPerformance | null) => void;
  onMorphologyRuntime: (receipt: MorphologyRuntimeReceipt) => void;
  onNmo45718DatSwcCrosswalkRuntime: (receipt: Nmo45718DatSwcCrosswalkRuntime) => void;
  onMicronsRuntime: (receipt: MicronsObservedReferenceRuntimeReceipt) => void;
};

let mainSceneInstanceSequence = 0;
type SceneContext = {
  scene: THREE.Scene;
  instanceId: string;
  sourceGeometry: MainSceneMorphologyGeometry | null;
  inspection: ReturnType<typeof attachSwcNeuriteInspection> | null;
  auxiliaryAssets: Map<string, MainSceneAuxiliaryToken>;
  failed: boolean;
  defaultSourceCamera: boolean;
  lastCameraView: CameraView | null;
  sourceCameraFitFingerprint: string;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  scaffold: THREE.Group;
  grayMatter: THREE.Group;
  internalCompartments: THREE.Group;
  entityRoot: THREE.Group;
  syntheticLaneGuide: THREE.Group;
  entityGroups: Map<string, THREE.Group>;
  observedCellRoot: THREE.Group;
  nmo45718DatSwcCrosswalkRoot: THREE.Group;
  observedCellLaneGuide: THREE.Group;
  micronsReferenceRoot: THREE.Group;
  micronsCellRoot: THREE.Group;
  micronsNucleusRoot: THREE.Group;
  internalReferenceRoot: THREE.Group;
  slicePlane: THREE.Mesh;
};

type SourceLocalMorphologyGeometry = {
  assetId: string;
  neuronId: number;
  name: string;
  sourceFrame: string;
  units: string;
  geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL";
  registration: {
    status: "unregistered";
    registrationCount: 0;
  };
  scientificUse: string;
  source: {
    officialRecordUrl: string;
    standardizedSwcUrl: string;
    pmids: string[];
    dois: string[];
    license: string;
  };
  swc: {
    sha256: string;
    nodeCount: number;
    dimensionality: "2D" | "3D";
    sourceDiameterAvailable: boolean;
  };
  displayTransform: {
    kind: "soma_centered_uniform_scale";
    originMicrometre: [number, number, number];
    scaleViewerUnitPerMicrometre: number;
    use: "viewer_only";
  };
  nodes: Array<[number, number, number, number, number, number, number]>;
  segmentColumns: ["x1", "y1", "z1", "r1", "x2", "y2", "z2", "r2", "sourceType", "interpretation"];
  segments: Array<[number, number, number, number, number, number, number, number, number, string]>;
};

type AtlasPlaneLocalContour = {
  positions: number[];
  planeLocal: true;
  crossPlaneCorrespondence: "none";
};

type AtlasInternalStructureGeometry = {
  identifier: number;
  annotationValue: number;
  name: string;
  abbreviation: string;
  parentIdentifier: number | null;
  rootIdentifierPath: number[];
  sourceColorHexTriplet: string;
  displayColorHexTriplet: string;
  displayColorAuthority: "project_display_only_not_source_identity";
  contours: AtlasPlaneLocalContour[];
};

type AtlasInternalContourGeometry = {
  assetId: string;
  sourceAtlasAssetId: string;
  coordinateSpaceId: string;
  geometryStatus: "INF";
  measurementUse: "forbidden";
  registrationCount: 0;
  segmentLabels: never[];
  structureCount: number;
  totalComponentCount: number;
  totalContourCount: number;
  missingPlanes: Array<{
    structureIdentifier: number;
    structureName: string;
    zIndex: number;
    reason: string;
  }>;
  crossPlaneCorrespondence: "none";
  interpolation: "none";
  structures: AtlasInternalStructureGeometry[];
};

type MicronsBrowserArrayReceipt = {
  path: string;
  scalarType: string;
  tupleSize: 3;
  bytes: number;
  sha256: string;
};

type MicronsBrowserGeometryReceipt = {
  format: "parallel_binary_arrays_v1";
  coordinateUnits: "nanometre";
  coordinateFrame: string;
  positions: MicronsBrowserArrayReceipt;
  triangles: MicronsBrowserArrayReceipt & {
    indexing: "zero_based_global_vertex_index";
  };
  vertexCount: number;
  triangleCount: number;
};

type MicronsAssetManifest = {
  documentType: "microns_observed_cell_nucleus_asset_manifest";
  assetId: string;
  sourceRelease: string;
  rootId: string;
  nucleusId: string;
  admittedComponentCount: number;
  components: Array<{
    componentName: "cell" | "nucleus";
    objectId: string;
    browserGeometry: MicronsBrowserGeometryReceipt;
  }>;
};

const SYNTHETIC_EVIDENCE_LANE_X = 4.2;
const OBSERVED_CELL_FORM_LANE_X = -4.4;
const COMBINED_SCENE_TARGET_X = 0;
const SWC_TYPE_COLORS: Record<number, number> = {
  1: 0xf5d06f,
  2: 0x2895d3,
  3: 0xd87335,
  4: 0x8d6cc4,
  5: 0x8c9691,
  6: 0x4eaaa0,
  7: 0x5c6b66,
};
function representationRuntimeMetadata(
  routeId: string,
  stableId: string,
  representationState: string,
  cellMorphologyClaim: boolean,
) {
  const route = evidenceAware3dRepresentationContract.routes.find((candidate) => candidate.routeId === routeId);
  if (!route) throw new Error(`Unknown evidence-aware representation route ${routeId}`);
  if (!(route.representationStateIds as readonly string[]).includes(representationState)) {
    throw new Error(`${representationState} is not admitted for representation route ${routeId}`);
  }
  return {
    stableId,
    representationState,
    sourceFrame: route.sourceFrame,
    sourceVersion: route.sourceVersion,
    sourceReceiptSha256: route.sourceReceipt.sha256,
    cellMorphologyClaim,
    projectRegistrationCount: route.projectRegistrationCount,
    crossSourceIdentityCount: route.crossSourceIdentityCount,
  };
}
const INTERNAL_STRUCTURE_LEGEND = [
  { identifier: 90, abbreviation: "DH", name: "Dorsal horn", color: ATLAS_INTERNAL_DISPLAY_COLORS[90] },
  { identifier: 100, abbreviation: "C", name: "Central Spinal Cord", color: ATLAS_INTERNAL_DISPLAY_COLORS[100] },
  { identifier: 110, abbreviation: "VH", name: "Ventral horn", color: ATLAS_INTERNAL_DISPLAY_COLORS[110] },
  { identifier: 16, abbreviation: "CC", name: "Central canal", color: ATLAS_INTERNAL_DISPLAY_COLORS[16] },
  { identifier: 74, abbreviation: "df", name: "Dorsal funiculus", color: ATLAS_INTERNAL_DISPLAY_COLORS[74] },
  { identifier: 75, abbreviation: "lfc", name: "Lateral funiculus complete", color: ATLAS_INTERNAL_DISPLAY_COLORS[75] },
  { identifier: 70, abbreviation: "vf", name: "Ventral funiculus", color: ATLAS_INTERNAL_DISPLAY_COLORS[70] },
] as const;

function createLoftGeometry(meshData: { positions: number[]; indices: number[] }) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(meshData.positions, 3));
  geometry.setIndex(meshData.indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createReferenceScaffold(reference: ReturnType<typeof buildAtlasReferenceGeometry>) {
  const group = new THREE.Group();
  group.name = "allen-reference-outer-envelope-inf";
  group.userData = {
    ...representationRuntimeMetadata("main.reference_anatomy", "allen-reference-outer-envelope", "INF_REFERENCE_GEOMETRY", false),
    coordinateSpaceId: reference.coordinateSpaceId,
    geometryStatus: reference.geometryStatus,
    measurementUse: reference.measurementUse,
    segmentLabels: reference.segmentLabels,
  };

  const surface = new THREE.Mesh(
    createLoftGeometry(reference.outer),
    new THREE.MeshPhysicalMaterial({
      color: 0xa8b3bd,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      roughness: 0.78,
      side: THREE.DoubleSide,
    }),
  );
  surface.name = "allen-reference-outer-loft-inf";
  surface.userData = representationRuntimeMetadata("main.reference_anatomy", "allen-reference-outer-loft", "INF_REFERENCE_GEOMETRY", false);
  group.add(surface);
  return group;
}

function createReferenceGrayMatter(reference: ReturnType<typeof buildAtlasReferenceGeometry>) {
  const root = new THREE.Group();
  root.name = "allen-reference-coarse-gray-envelope-inf";
  root.userData = {
    ...representationRuntimeMetadata("main.reference_anatomy", "allen-reference-coarse-gray-envelope", "INF_REFERENCE_GEOMETRY", false),
    coordinateSpaceId: reference.coordinateSpaceId,
    geometryStatus: reference.geometryStatus,
    measurementUse: reference.measurementUse,
    segmentLabels: reference.segmentLabels,
  };
  const surface = new THREE.Mesh(
    createLoftGeometry(reference.grayMatter),
    new THREE.MeshPhysicalMaterial({
      color: 0x715a91,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.72,
    }),
  );
  surface.name = "allen-reference-coarse-gray-row-envelope-side-loft-inf";
  surface.userData = representationRuntimeMetadata("main.reference_anatomy", "allen-reference-coarse-gray-row-envelope-side-loft", "INF_REFERENCE_GEOMETRY", false);
  root.add(surface);
  return root;
}

function createReferenceInternalCompartments(
  reference: AtlasInternalContourGeometry,
) {
  const root = new THREE.Group();
  root.name = "allen-reference-plane-local-internal-contours-inf";
  root.userData = {
    ...representationRuntimeMetadata("main.reference_anatomy", reference.assetId, "INF_REFERENCE_GEOMETRY", false),
    assetId: reference.assetId,
    sourceAtlasAssetId: reference.sourceAtlasAssetId,
    coordinateSpaceId: reference.coordinateSpaceId,
    geometryStatus: reference.geometryStatus,
    measurementUse: reference.measurementUse,
    registrationCount: reference.registrationCount,
    segmentLabels: reference.segmentLabels,
    structureCount: reference.structureCount,
    totalComponentCount: reference.totalComponentCount,
    totalContourCount: reference.totalContourCount,
    missingPlanes: reference.missingPlanes,
    crossPlaneCorrespondence: reference.crossPlaneCorrespondence,
    interpolation: reference.interpolation,
  };

  reference.structures.forEach((structure) => {
    const edgePositions = buildPlaneLocalContourSegments(structure.contours);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    const color = Number.parseInt(structure.displayColorHexTriplet.slice(1), 16);
    const lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: structure.identifier === 16 ? 0.96 : 0.66,
        depthWrite: false,
      }),
    );
    lines.name = `allen-source-id-${structure.identifier}-${structure.abbreviation.toLowerCase()}-plane-local-inf`;
    lines.renderOrder = 5;
    lines.userData = {
      ...representationRuntimeMetadata("main.reference_anatomy", `${reference.assetId}:source-id:${structure.identifier}`, "INF_REFERENCE_GEOMETRY", false),
      structureIdentifier: structure.identifier,
      annotationValue: structure.annotationValue,
      structureName: structure.name,
      abbreviation: structure.abbreviation,
      parentIdentifier: structure.parentIdentifier,
      rootIdentifierPath: structure.rootIdentifierPath,
      sourceColorHexTriplet: structure.sourceColorHexTriplet,
      displayColorHexTriplet: structure.displayColorHexTriplet,
      displayColorAuthority: structure.displayColorAuthority,
      contourCount: structure.contours.length,
      geometryStatus: "INF",
      measurementUse: "forbidden",
      registrationCount: 0,
      crossPlaneCorrespondence: "none",
      interpolation: "none",
    };
    root.add(lines);
  });
  return root;
}

function createSyntheticEvidenceLaneGuide() {
  const root = new THREE.Group();
  root.name = "separate-unregistered-synthetic-evidence-lane";
  root.position.x = SYNTHETIC_EVIDENCE_LANE_X;
  root.userData = {
    ...representationRuntimeMetadata("main.population_evidence", "synthetic-evidence-lane-guide", "SYN_DATA_GLYPH", false),
    geometryStatus: "SYN",
    pathStatus: "SCH",
    coordinateRelationshipToAtlas: "none",
    projectRegistrationCount: 0,
  };
  const box = new THREE.BoxGeometry(3.4, 3.2, 36.5);
  const edgesGeometry = new THREE.EdgesGeometry(box);
  box.dispose();
  const boundary = new THREE.LineSegments(
    edgesGeometry,
    new THREE.LineDashedMaterial({
      color: 0xc48632,
      dashSize: 0.22,
      gapSize: 0.18,
      transparent: true,
      opacity: 0.28,
    }),
  );
  boundary.computeLineDistances();
  boundary.name = "synthetic-lane-boundary-not-anatomy";
  root.add(boundary);
  return root;
}

function createObservedCellFormLaneGuide() {
  const root = new THREE.Group();
  root.name = "source-local-observed-cell-form-lane";
  root.position.x = OBSERVED_CELL_FORM_LANE_X;
  root.userData = {
    ...representationRuntimeMetadata("main.legacy_observed_cell_forms", "observed-cell-form-lane-guide", "OBS_SKELETON", true),
    inputGeometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
    representation: "evidence-gated observed SWC or deterministic radius derivative",
    sourceFrame: "NeuroMorpho_CNG_standardized_local_frame",
    coordinateRelationshipToAtlas: "none",
    coordinateRelationshipToPopulationEvidence: "none",
    projectRegistrationCount: 0,
    exactCrossSourceIdentityCount: 0,
  };
  const box = new THREE.BoxGeometry(6.5, 7.1, 7.1);
  const edgesGeometry = new THREE.EdgesGeometry(box);
  box.dispose();
  const boundary = new THREE.LineSegments(
    edgesGeometry,
    new THREE.LineDashedMaterial({
      color: 0x248f83,
      dashSize: 0.18,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.3,
    }),
  );
  boundary.computeLineDistances();
  boundary.name = "observed-source-local-boundary-not-atlas-space";
  boundary.userData = { displayGuideOnly: true, measurementUse: "forbidden" };
  root.add(boundary);
  return root;
}

function createCrossRegionInternalReferenceObject() {
  const root = new THREE.Group();
  root.name = "cross-region-internal-reference-unavailable-zero-primitives";
  root.userData = {
    ...representationRuntimeMetadata("internal_reference", "internal-reference:missing-object-geometry", "UNAVAILABLE", false),
    contractId: crossRegionInternalReference.contractId,
    geometryStatus: crossRegionInternalReference.authority,
    relationshipToSelectedPopulation: crossRegionInternalReference.relationshipToSelectedPopulation,
    relationshipToSelectedMorphology: crossRegionInternalReference.relationshipToSelectedMorphology,
    samePhysicalObject: crossRegionInternalReference.samePhysicalObject,
    registrationCount: crossRegionInternalReference.registrationCount,
    measurementUse: crossRegionInternalReference.measurementUse,
    sourceDerivedGeometryCount: crossRegionInternalReference.sourceDerivedGeometryCount,
    renderedPrimitiveCount: crossRegionInternalReference.renderedPrimitiveCount,
    sourceIds: crossRegionInternalReference.sources.map((source) => source.id),
    missingEvidencePolicy: "zero_primitives",
    cellMorphologyClaim: false,
    internalStructureClaim: false,
  };
  return root;
}

function assertMicronsAssetManifest(manifest: MicronsAssetManifest) {
  const contract = micronsObservedCellNucleusReference;
  if (manifest.documentType !== "microns_observed_cell_nucleus_asset_manifest") {
    throw new Error("MICrONS asset-manifest document type mismatch");
  }
  if (
    manifest.sourceRelease !== contract.sourceDataset.segmentationRelease
    || manifest.rootId !== contract.identityChain.cellRootId
    || manifest.nucleusId !== contract.identityChain.somaValenceTable.nucleusId
    || manifest.admittedComponentCount !== contract.assetBundle.admittedComponentCount
  ) {
    throw new Error("MICrONS exact-object identity chain mismatch");
  }
  for (const contractComponent of contract.components) {
    const componentName = contractComponent.assetManifestComponent as "cell" | "nucleus";
    const manifestComponent = manifest.components.find((candidate) => candidate.componentName === componentName);
    if (!manifestComponent) throw new Error(`MICrONS ${componentName} component is absent`);
    if (
      manifestComponent.objectId !== contractComponent.sourceObjectId
      || manifestComponent.browserGeometry.format !== "parallel_binary_arrays_v1"
      || manifestComponent.browserGeometry.coordinateUnits !== "nanometre"
      || manifestComponent.browserGeometry.vertexCount !== contractComponent.vertexCount
      || manifestComponent.browserGeometry.triangleCount !== contractComponent.triangleCount
    ) {
      throw new Error(`MICrONS ${componentName} geometry receipt mismatch`);
    }
  }
}

async function fetchVerifiedMicronsBuffer(receipt: MicronsBrowserArrayReceipt, signal: AbortSignal, context: SceneContext) {
  const token = await readVerifiedMainSceneAuxiliary(receipt.path, { signal });
  const proof = mainSceneAuxiliaryProof(token);
  if (proof.bytes !== receipt.bytes || proof.sha256 !== receipt.sha256) throw new Error("MICrONS component receipt changed");
  if (signal.aborted || context.failed || !context.renderer.domElement.isConnected) throw new DOMException("Source read cancelled", "AbortError");
  context.auxiliaryAssets.set(token.path, token);
  return { bytes: mainSceneAuxiliaryBytes(token), verifiedSha256: proof.verifiedSha256 };
}

function createMicronsObservedSegmentationMesh(
  componentName: "cell" | "nucleus",
  receipt: MicronsBrowserGeometryReceipt,
  positionBytes: ArrayBuffer,
  triangleBytes: ArrayBuffer,
) {
  const positions = new Float32Array(positionBytes);
  const triangles = new Uint32Array(triangleBytes);
  if (positions.length !== receipt.vertexCount * 3 || triangles.length !== receipt.triangleCount * 3) {
    throw new Error(`MICrONS ${componentName} typed-array count mismatch`);
  }
  for (let index = 0; index < triangles.length; index += 1) {
    if (triangles[index] >= receipt.vertexCount) {
      throw new Error(`MICrONS ${componentName} triangle index exceeds its source-fragment vertex domain`);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(triangles, 1));
  geometry.userData = {
    authority: "OBS_EM_SEGMENTATION",
    nativeFrame: receipt.coordinateFrame,
    nativeUnits: receipt.coordinateUnits,
    vertexCount: receipt.vertexCount,
    triangleCount: receipt.triangleCount,
    coordinateTransformAppliedToBuffer: false,
    normalGeneration: false,
    vertexWelding: false,
    smoothing: false,
    repair: false,
    decimation: false,
  };

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: componentName === "cell" ? 0x4c9b92 : 0xe1a24a,
      transparent: true,
      opacity: componentName === "cell" ? 0.26 : 0.84,
      depthWrite: componentName !== "cell",
      side: THREE.DoubleSide,
    }),
  );
  mesh.name = componentName === "cell"
    ? "microns-observed-cell-segmentation-surface"
    : "microns-observed-linked-nucleus-segmentation";
  mesh.frustumCulled = false;
  mesh.renderOrder = componentName === "cell" ? 4 : 5;
  mesh.userData = {
    ...representationRuntimeMetadata("microns_observed_reference", componentName === "cell"
      ? micronsObservedCellNucleusReference.identityChain.cellRootId
      : micronsObservedCellNucleusReference.identityChain.somaValenceTable.nucleusId, "OBS_SEGMENTED_SURFACE", true),
    authority: "OBS_EM_SEGMENTATION",
    displayLabel: componentName === "cell" ? "Cell segmentation surface" : "Linked nucleus segmentation",
    membraneClaim: false,
    samePhysicalObject: true,
    sourceObjectId: componentName === "cell"
      ? micronsObservedCellNucleusReference.identityChain.cellRootId
      : micronsObservedCellNucleusReference.identityChain.somaValenceTable.nucleusId,
    crossRegionRelationship: "co_display_only",
    registrationCount: 0,
  };
  return mesh;
}

function setObjectClippingPlanes(root: THREE.Object3D, clippingPlanes: THREE.Plane[] | null) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      material.clippingPlanes = clippingPlanes;
      material.clipIntersection = false;
      material.clipShadows = false;
      material.needsUpdate = true;
    });
  });
}

function applyMicronsSourceNativeClipping(context: SceneContext, state: MicronsClippingState) {
  const displayTransform = micronsObservedCellNucleusReference.coordinateContract.displayTransformReceipt.canonical;
  const planeReceipt = buildMicronsWorldClippingPlane(state, micronsSourceNativeClipping, displayTransform);
  const clippingPlane = new THREE.Plane(
    new THREE.Vector3(...planeReceipt.worldNormal as [number, number, number]),
    planeReceipt.worldConstant,
  );
  setObjectClippingPlanes(context.micronsCellRoot, planeReceipt.enabled ? [clippingPlane] : null);
  setObjectClippingPlanes(context.micronsNucleusRoot, null);
  context.renderer.domElement.dataset.micronsClipStatus = planeReceipt.enabled
    ? `enabled-${planeReceipt.axis}-${planeReceipt.keepSide}`
    : "disabled-source-geometry-intact";
  context.renderer.domElement.dataset.micronsClipPositionNanometre = String(planeReceipt.positionNanometre);
  context.renderer.domElement.dataset.micronsNucleusClippingPlaneCount = "0";
  context.renderer.domElement.dataset.micronsClipCapPrimitiveCount = "0";
  return buildMicronsClipRuntimeReceipt(state, micronsSourceNativeClipping, displayTransform) as MicronsClippingRuntimeReceipt;
}

function assertSourceLocalMorphologyGeometry(
  payload: SourceLocalMorphologyGeometry,
  record: MorphologyFidelityRecord,
) {
  if (payload.neuronId !== record.neuronId || payload.assetId !== record.assetId) {
    throw new Error("Source-local morphology identity mismatch");
  }
  if (payload.geometryStatus !== record.geometry.geometryStatus) {
    throw new Error("Source-local morphology authority mismatch");
  }
  if (payload.registration.status !== "unregistered" || payload.registration.registrationCount !== 0) {
    throw new Error("Source-local morphology unexpectedly gained registration");
  }
  if (payload.sourceFrame !== record.geometry.sourceFrame || payload.swc.dimensionality !== record.geometry.dimensionality) {
    throw new Error("Source-local morphology frame or dimensionality mismatch");
  }
  if (payload.swc.sourceDiameterAvailable !== record.geometry.sourceDiameterAvailable) {
    throw new Error("Source-local morphology diameter authority mismatch");
  }
  if (payload.swc.sha256 !== record.geometry.rawSwcSha256) {
    throw new Error("Source-local morphology SWC receipt mismatch");
  }
  if (payload.nodes.length !== record.geometry.nodeCount || payload.segments.length !== record.geometry.segmentCount) {
    throw new Error("Source-local morphology count receipt mismatch");
  }
}

function publicAssetPath(path: string) {
  return `/${path.replace(/^public\//, "").replace(/^\//, "")}`;
}

async function loadVerifiedNmo45718CrosswalkJson(receiptKey: "nativeContours" | "standardizedGeometry", signal: AbortSignal, context: SceneContext) {
  const receipt = NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[receiptKey];
  const token = await readVerifiedMainSceneAuxiliary(publicAssetPath(receipt.path), { signal });
  const proof = mainSceneAuxiliaryProof(token);
  if (proof.bytes !== receipt.bytes || proof.sha256 !== receipt.sha256) throw new Error("NMO 45718 crosswalk receipt changed");
  if (signal.aborted || context.failed || !context.renderer.domElement.isConnected) throw new DOMException("Source read cancelled", "AbortError");
  context.auxiliaryAssets.set(token.path, token);
  return mainSceneAuxiliaryJson(token);
}

type Nmo45718DatSwcCrosswalk = {
  neuronId: number;
  assetId: string;
  authority: string;
  sourceFrames: { nativeDat: string; standardizedSwc: string };
  validation: { model: string };
  correspondence: { method: string; sourceVertexCount: number };
  somaContours: Array<{
    id: string;
    sourceName: string;
    vertexCount: number;
    points: Array<[number, number, number]>;
  }>;
  boundaries: {
    atlasRegistrationCount: number;
    surfaceCount: number;
    volumeCount: number;
    internalStructureObjectCount: number;
    sameCellInternalStructureClaim: boolean;
    cellBodyContourJoined: boolean;
  };
};

function createNmo45718DatSwcCrosswalkObject(
  crosswalk: Nmo45718DatSwcCrosswalk,
  geometry: SourceLocalMorphologyGeometry,
) {
  const root = new THREE.Group();
  root.name = "nmo-45718-dat-soma-1-project-mapped-source-contours";
  root.userData = {
    assetId: crosswalk.assetId,
    neuronId: crosswalk.neuronId,
    authority: crosswalk.authority,
    representation: "observed_source_native_dat_contours_project_mapped_for_same_record_display",
    sourceFrame: crosswalk.sourceFrames.nativeDat,
    displayFrame: crosswalk.sourceFrames.standardizedSwc,
    displayTransform: geometry.displayTransform,
    transformMethod: crosswalk.validation.model,
    transformBasis: crosswalk.correspondence.method,
    sourcePlaneCount: crosswalk.somaContours.length,
    sourceVertexCount: crosswalk.correspondence.sourceVertexCount,
    sourceDimensionality: "2D_contours_on_seven_source_planes",
    sourceNativeDatSha256: NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.nativeDat.sha256,
    nativeContourSha256: NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.nativeContours.sha256,
    standardizedGeometrySha256: NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.standardizedGeometry.sha256,
    registrationStatus: "unregistered",
    registrationCount: 0,
    displayConsistencyScreenOnly: true,
    measurementClaim: false,
    surfaceCount: 0,
    volumeCount: 0,
    internalStructureObjectCount: 0,
    sameCellInternalStructureClaim: false,
    cellBodyContourJoined: false,
  };

  const [originX, originY, originZ] = geometry.displayTransform.originMicrometre;
  const scale = geometry.displayTransform.scaleViewerUnitPerMicrometre;
  crosswalk.somaContours.forEach((contour, index) => {
    if (contour.points.length < 3 || contour.points.length !== contour.vertexCount) {
      throw new Error(`NMO 45718 DAT contour ${contour.id} has an invalid vertex count`);
    }
    const positions = new Float32Array(contour.points.length * 3);
    contour.points.forEach((point, pointIndex) => {
      const x = (point[0] - originX) * scale;
      const y = (point[1] - originY) * scale;
      const z = (point[2] - originZ) * scale;
      if (![x, y, z].every(Number.isFinite)) {
        throw new Error(`NMO 45718 DAT contour ${contour.id} contains a non-finite mapped point`);
      }
      const offset = pointIndex * 3;
      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
    });
    const contourGeometry = new THREE.BufferGeometry();
    contourGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const line = new THREE.LineLoop(
      contourGeometry,
      new THREE.LineBasicMaterial({
        color: 0x53d8c4,
        transparent: true,
        opacity: 0.96,
        depthTest: false,
        depthWrite: false,
      }),
    );
    line.name = `nmo-45718-dat-soma-1-contour-${index + 1}`;
    line.renderOrder = 10;
    line.userData = {
      assetId: crosswalk.assetId,
      authority: "OBS_SOURCE_NATIVE_DAT_CONTOUR",
      representation: "2d_source_contour_line_loop",
      sourceContourId: contour.id,
      sourceContourName: contour.sourceName,
      sourceVertexCount: contour.vertexCount,
      sourceFrame: crosswalk.sourceFrames.nativeDat,
      displayFrame: crosswalk.sourceFrames.standardizedSwc,
      projectMappedTransform: true,
      registrationCount: 0,
      surfaceClaim: false,
      volumeClaim: false,
      measurementClaim: false,
      internalStructureClaim: false,
    };
    root.add(line);
  });
  return root;
}

// This group belongs to the imperative THREE scene, outside React state.
function clearSourceGeometryRoot(root: THREE.Group) {
  root.children.forEach((child) => disposeObject(child));
  root.clear();
  root.userData = {};
}

function createSourceLocalMorphologyObject(
  geometry: SourceLocalMorphologyGeometry,
  record: MorphologyFidelityRecord,
  mode: MorphologyFidelityMode,
) {
  const group = new THREE.Group();
  const representationRouteId = observedMorphologyRepresentationRouteId(record.neuronId);
  group.name = `neuromorpho-${record.neuronId}-${mode}-source-local`;
  group.userData = {
    assetId: record.assetId,
    neuronId: record.neuronId,
    inputGeometryStatus: record.geometry.geometryStatus,
    representation: mode === "radius_surface"
      ? "compound_observed_centerlines_and_radius_derived_surface"
      : "observed_standardized_swc_centerlines",
    representationStateIds: mode === "radius_surface"
      ? ["OBS_SKELETON", "DER_RADIUS_SURFACE"]
      : ["OBS_SKELETON"],
    algorithmId: mode === "radius_surface" ? RADIUS_SURFACE_ALGORITHM_ID : null,
    sourceFrame: record.geometry.sourceFrame,
    units: geometry.units,
    registrationStatus: "unregistered",
    registrationCount: 0,
    coordinateRelationshipToAtlas: "none",
    coordinateRelationshipToPopulationEvidence: "none",
    selectionCreatesRelationship: false,
    geometrySha256: record.geometry.sha256,
    rawSwcSha256: record.geometry.rawSwcSha256,
    sourceUrl: geometry.source.officialRecordUrl,
    sourcePaperDois: geometry.source.dois,
    sourceDomain: record.axon.sourceDomain,
    completeAxonClaim: false,
    sourceDiameterAvailable: record.geometry.sourceDiameterAvailable,
    membraneClaim: false,
    internalStructureClaim: false,
    displayTransform: geometry.displayTransform,
  };

  const annotateSubtree = (
    subtree: THREE.Object3D,
    subtreeKind: "observed_centerlines" | "radius_derived_surface",
    representationState: "OBS_SKELETON" | "DER_RADIUS_SURFACE",
  ) => {
    const stateMetadata = representationRuntimeMetadata(
      representationRouteId,
      record.assetId,
      representationState,
      true,
    );
    subtree.traverse((child) => {
      child.userData = {
        ...group.userData,
        ...child.userData,
        ...stateMetadata,
        representation: subtreeKind,
        algorithmId: representationState === "DER_RADIUS_SURFACE" ? RADIUS_SURFACE_ALGORITHM_ID : null,
        stableId: `${record.assetId}:${subtreeKind}:${child.name || child.type}`,
      };
    });
  };

  if (mode === "radius_surface") {
    if (!record.modes.radiusSurface.available || !record.geometry.sourceDiameterAvailable) {
      throw new Error("Radius-derived surface is not source-authorized for this record");
    }
    const radiusSurface = createRadiusDerivedSurface(geometry, {
      colors: SWC_TYPE_COLORS,
      opacity: 0.84,
      radialSegments: morphologyFidelityContract.derivedSurfaceAlgorithm.radialSegments,
    });
    const observedCenterlines = createObservedSwcCenterlines(geometry, {
      colors: SWC_TYPE_COLORS,
      opacity: 0.28,
      renderOrder: 8,
    });
    annotateSubtree(radiusSurface, "radius_derived_surface", "DER_RADIUS_SURFACE");
    annotateSubtree(observedCenterlines, "observed_centerlines", "OBS_SKELETON");
    group.add(radiusSurface, observedCenterlines);
  } else {
    const observedCenterlines = createObservedSwcCenterlines(geometry, {
      colors: SWC_TYPE_COLORS,
      opacity: 0.9,
      renderOrder: 8,
    });
    annotateSubtree(observedCenterlines, "observed_centerlines", "OBS_SKELETON");
    group.add(observedCenterlines);
  }
  const topologyLandmarks = extractObservedTopologyLandmarks(geometry);
  const topologyOverlay = createObservedTopologyLandmarks(geometry, { markerSizeViewer: 0.052 });
  topologyOverlay.traverse((child) => {
    child.userData = {
      ...child.userData,
      assetId: record.assetId,
      neuronId: record.neuronId,
      sourceFrame: record.geometry.sourceFrame,
      geometrySha256: record.geometry.sha256,
      selectionCreatesRelationship: false,
      completeAxonClaim: false,
      internalStructureClaim: false,
      stableId: `${record.assetId}:topology_landmark:${child.name || child.type}`,
    };
  });
  group.userData.topologyLandmarks = {
    algorithmId: topologyLandmarks.algorithmId,
    rootNodeCount: 1,
    standardizedType1SampleCount: topologyLandmarks.standardizedType1Samples.length,
    stemCount: topologyLandmarks.stems.length,
    branchpointCount: topologyLandmarks.branchpoints.length,
    terminalCount: topologyLandmarks.terminals.length,
    somaContourClaim: false,
    boutonClaim: false,
    internalStructureClaim: false,
  };
  group.add(topologyOverlay);
  return group;
}

function createPath(entity: AtlasEntity, color: string) {
  const [x, y, z] = entity.geometry.schematicPosition;
  const points: THREE.Vector3[] = [];
  if (entity.id === "mouse.propriospinal.relay") {
    points.push(
      new THREE.Vector3(-0.9, 0.2, 10),
      new THREE.Vector3(-0.6, 0.1, 5),
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(0.5, -0.1, -3),
      new THREE.Vector3(0.65, -0.25, -11),
    );
  } else if (entity.id === "mouse.v2a.cervical_ipsilateral") {
    points.push(new THREE.Vector3(x, y, z + 2.5), new THREE.Vector3(x * 0.94, y, z), new THREE.Vector3(x * 0.9, y - 0.1, z - 4));
  } else if (entity.id === "mouse.v3.sim1") {
    points.push(new THREE.Vector3(x, y, z + 1.5), new THREE.Vector3(0, y - 0.08, z), new THREE.Vector3(-x, y, z - 1.2));
  } else {
    points.push(
      new THREE.Vector3(x, y, z + 1.8),
      new THREE.Vector3(x * 0.9, y + 0.06, z),
      new THREE.Vector3(x * 0.82, y - 0.08, z - 2.2),
    );
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color, dashSize: 0.22, gapSize: 0.15, transparent: true, opacity: 0.72 }),
  );
  line.computeLineDistances();
  line.userData = {
    ...representationRuntimeMetadata("main.population_evidence", `${entity.id}:schematic-path`, "SCH_PATH", false),
    entityId: entity.id,
    pathStatus: entity.geometry.pathStatus,
    representationKind: "schematic-evidence-pathway",
    coordinateRelationshipToAtlas: "none",
  };
  return line;
}

function createEntityObject(entity: AtlasEntity) {
  const group = new THREE.Group();
  group.name = entity.id;
  group.userData = {
    ...representationRuntimeMetadata("main.population_evidence", entity.id, "SYN_DATA_GLYPH", false),
    entityId: entity.id,
    geometryStatus: entity.geometry.status,
    pathStatus: entity.geometry.pathStatus,
    representationKind: "non-cell-population-evidence-node",
    cellMorphologyClaim: false,
    coordinateRelationshipToAtlas: "none",
    relationshipToObservedCellForm: "not_established",
  };
  const color = TRANSMITTER_COLORS[entity.transmitter];
  const position = new THREE.Vector3(...entity.geometry.schematicPosition);

  if (entity.entityKind === "injury_state_overlay") {
    const overlayBox = new THREE.BoxGeometry(1.45, 1.05, 2.9);
    const overlay = new THREE.LineSegments(
      new THREE.EdgesGeometry(overlayBox),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.72 }),
    );
    overlayBox.dispose();
    overlay.name = "non-cell-injury-state-evidence-frame-syn";
    overlay.position.copy(position);
    overlay.userData = {
      ...representationRuntimeMetadata("main.population_evidence", `${entity.id}:injury-state-frame`, "SYN_DATA_GLYPH", false),
      entityId: entity.id,
      geometryStatus: "SYN",
      representationKind: "non-cell-injury-state-evidence-frame",
      cellMorphologyClaim: false,
    };
    group.add(overlay);
  } else {
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.08, flatShading: true }),
    );
    node.name = "non-cell-population-evidence-node-syn";
    node.position.copy(position);
    node.rotation.set(Math.PI / 4, 0, Math.PI / 4);
    node.userData = {
      ...representationRuntimeMetadata("main.population_evidence", `${entity.id}:data-glyph`, "SYN_DATA_GLYPH", false),
      entityId: entity.id,
      geometryStatus: "SYN",
      representationKind: "non-cell-population-evidence-node",
      cellMorphologyClaim: false,
    };
    group.add(node);

    const nodeFrameBox = new THREE.BoxGeometry(0.72, 0.72, 0.72);
    const nodeFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(nodeFrameBox),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 }),
    );
    nodeFrameBox.dispose();
    nodeFrame.name = "population-evidence-node-frame-syn";
    nodeFrame.position.copy(position);
    nodeFrame.rotation.y = Math.PI / 4;
    nodeFrame.userData = {
      ...representationRuntimeMetadata("main.population_evidence", `${entity.id}:data-frame`, "SYN_DATA_GLYPH", false),
      entityId: entity.id,
      geometryStatus: "SYN",
      representationKind: "non-cell-data-frame",
      cellMorphologyClaim: false,
    };
    group.add(nodeFrame);
  }

  group.add(createPath(entity, color));
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.035, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xf3b33e, transparent: true, opacity: 0.72 }),
  );
  halo.name = "selection-halo";
  halo.position.copy(position);
  halo.rotation.x = Math.PI / 2;
  halo.userData = { interactionOnly: true, cellMorphologyClaim: false };
  halo.visible = false;
  group.add(halo);
  return group;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const drawable = child as THREE.Mesh | THREE.Line | THREE.LineSegments;
    if ("geometry" in drawable) drawable.geometry?.dispose();
    if ("material" in drawable) {
      const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
      materials.forEach((material) => material?.dispose());
    }
  });
}

function captureRendererPng(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  { releaseId, selectedLabel, morphologyRuntime, micronsRuntime }: Parameters<ViewportCapture>[0],
  actualLayers: MainSceneSourceView["layers"] | null,
  actualSourceObject: MainSceneSourceView["sourceObject"] | null,
) {
  renderer.render(scene, camera);
  const source = renderer.domElement;
  const output = document.createElement("canvas");
  output.width = source.width;
  const context = output.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas 2D export is unavailable"));
  const padding = Math.max(18, Math.round(output.width * 0.025));
  const titleSize = Math.max(15, Math.round(output.width * 0.014));
  const detailSize = Math.max(12, Math.round(output.width * 0.011));
  const verifiedVisible = morphologyRuntime.verificationStatus === "verified"
    && morphologyRuntime.sceneObjectStatus === "rendered"
    && morphologyRuntime.visible;
  const micronsVerified = micronsRuntime.requested
    && micronsRuntime.verificationStatus === "verified"
    && micronsRuntime.sceneObjectStatus === "rendered";
  const referenceLine = actualLayers
    ? `${actualLayers.scaffold || actualLayers.grayMatter || actualLayers.internalCompartments ? "INF ANATOMY VISIBLE" : "INF ANATOMY HIDDEN"} · ${actualLayers.entities ? "SYN NON-CELL NODES VISIBLE" : "SYN NON-CELL NODES HIDDEN"}`
    : "REFERENCE LAYER VISIBILITY NOT CAPTURED";
  const morphologyLine = micronsRuntime.requested
    ? micronsVerified
      ? "VERIFIED OBS EM CELL SEGMENTATION + SOURCE-LINKED NUCLEUS"
      : "MICRONS REFERENCE REQUESTED · NO VERIFIED EXACT GEOMETRY RENDERED"
    : verifiedVisible
      ? morphologyRuntime.actualMode === "radius_surface"
        ? "VERIFIED OBS INPUT + VISIBLE DERIVED RADIUS SURFACE"
        : "VERIFIED VISIBLE OBS SWC CENTERLINES"
      : morphologyRuntime.verificationStatus === "verified" && morphologyRuntime.sceneObjectStatus === "rendered"
        ? "MORPHOLOGY VERIFIED BUT HIDDEN"
        : "NO VERIFIED MORPHOLOGY RENDERED";
  const sourceLine = micronsRuntime.requested
      ? `MICrONS v185.4 · root ${micronsObservedCellNucleusReference.identityChain.cellRootId} · nucleus ${micronsObservedCellNucleusReference.identityChain.somaValenceTable.nucleusId} · ${releaseId}`
      : `${selectedLabel ? `Selected: ${selectedLabel}` : "No entity selected"} · ${morphologyRuntime.assetId ?? `NMO ${morphologyRuntime.requestedNeuronId}`} · ${releaseId}`;
  const detailLine = micronsRuntime.requested
      ? micronsVerified
        ? `Cell ${micronsRuntime.cellSurfaceVisible ? "visible" : "hidden"} · nucleus ${micronsRuntime.nucleusVisible ? "visible" : "hidden"} · shell clip ${micronsRuntime.clipping.enabled ? `${micronsRuntime.clipping.axis.toUpperCase()} ${micronsRuntime.clipping.positionNanometre} nm, keep ${micronsRuntime.clipping.keepSide}` : "off"} · nucleus intact · uncapped shader cut · 0 generated geometry · 0 joins · 0 REG`
        : `Runtime: ${micronsRuntime.verificationStatus} · ${micronsRuntime.reason ?? "verification pending"} · no geometric fallback · 0 REG`
      : verifiedVisible
        ? morphologyRuntime.actualMode === "radius_surface"
          ? "Verified surface is a deterministic open-frustum derivative, not observed membrane/internal structure · unlinked · 0 REG"
          : actualSourceObject?.dimensionality === "2D"
            ? "Source-labelled 2D trace · not a 3D reconstruction · deposited z retained · width is a viewer aid · 0 REG"
            : actualSourceObject?.sourceDiameterAvailable === false
              ? "Source reports No Diameter · viewer line width is not caliber · source-local · measurement forbidden · 0 REG"
              : "Verified SWC topology is source-local; stroke width is a viewer aid · unlinked · measurement forbidden · 0 REG"
        : `Runtime: ${morphologyRuntime.verificationStatus} · ${morphologyRuntime.reason ?? "morphology layer is hidden"} · no fallback · 0 REG`;
  const paragraphs = [
    { text: referenceLine, size: titleSize, bold: true },
    { text: morphologyLine, size: titleSize, bold: true },
    { text: sourceLine, size: detailSize, bold: false },
    { text: detailLine, size: detailSize, bold: false },
  ];
  const width = output.width - padding * 2;
  const lines: { text: string; size: number; bold: boolean; gap: number }[] = [];
  for (const paragraph of paragraphs) {
    context.font = `${paragraph.bold ? "700 " : ""}${paragraph.size}px Arial, sans-serif`;
    const wrapped: string[] = [];
    let line = "";
    for (const word of paragraph.text.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > width) { wrapped.push(line); line = ""; }
      if (context.measureText(word).width > width) {
        for (const glyph of word) {
          if (line && context.measureText(line + glyph).width > width) { wrapped.push(line); line = ""; }
          line += glyph;
        }
      } else line = line ? `${line} ${word}` : word;
    }
    if (line) wrapped.push(line);
    wrapped.forEach((text, index) => lines.push({ text, size: paragraph.size, bold: paragraph.bold, gap: index === wrapped.length - 1 ? 8 : 5 }));
  }
  const disclosureHeight = Math.max(112, Math.round(source.width * 0.1), padding * 2 + lines.reduce((sum, line) => sum + line.size + line.gap, 0));
  output.height = source.height + disclosureHeight;
  context.drawImage(source, 0, 0);
  context.fillStyle = "#182723";
  context.fillRect(0, source.height, output.width, disclosureHeight);
  let y = source.height + padding;
  for (const line of lines) {
    context.fillStyle = line.bold ? "#ffd99d" : "#d7e3df";
    context.font = `${line.bold ? "700 " : ""}${line.size}px Arial, sans-serif`;
    context.fillText(line.text, padding, y + line.size);
    y += line.size + line.gap;
  }
  return new Promise<Blob>((resolve, reject) => {
    output.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG encoding failed")), "image/png");
  });
}

export default function SceneCanvas({
  entities,
  visibleIds,
  selectedId,
  view,
  sliceZ,
  showScaffold,
  showGrayMatter,
  showEntities,
  showObservedCellForm,
  showNmo45718DatSwcCrosswalk,
  morphologyTargetActive,
  showMicronsCellSurface,
  showMicronsNucleus,
  micronsClipping,
  observedCellFormId,
  morphologyFidelityMode,
  sourceViewRequest,
  inspectionHost,
  onApplySourceViewRequest,
  onSourceViewTools,
  onSelect,
  onWebGLStatus,
  onCaptureReady,
  onPerformance,
  onMorphologyRuntime,
  onNmo45718DatSwcCrosswalkRuntime,
  onMicronsRuntime,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<SceneContext | null>(null);
  const inspectionRef = useRef<NeuriteInspectionController | null>(null);
  const [inspectionSelection, setInspectionSelection] = useState<NeuriteInspectionSelection | null>(null);
  const [inspectionScene, setInspectionScene] = useState<{ geometry: MainSceneMorphologyGeometry; mode: MorphologyFidelityMode; epoch: number } | null>(null);
  const clearInspection = useCallback(() => {
    contextRef.current?.inspection?.dispose();
    if (contextRef.current) contextRef.current.inspection = null;
    inspectionRef.current = null;
    queueMicrotask(() => { setInspectionSelection(null); setInspectionScene(null); });
  }, []);
  const morphologyLoadEpochRef = useRef(0);
  const [sourceSceneEpoch, setSourceSceneEpoch] = useState(0);
  const sourceRequestRef = useRef(sourceViewRequest);
  const sourceSelectionRef = useRef({ neuronId: observedCellFormId, active: morphologyTargetActive });
  const sourceViewRevisionRef = useRef(1);
  const sourceViewFingerprintRef = useRef("");
  const sourceViewCameraRef = useRef<MainSceneSourceView["camera"] | null>(null);
  const validationGeometryRef = useRef<MainSceneMorphologyGeometry | null>(null);
  const sourceViewCallbacksRef = useRef({ onApplySourceViewRequest, onSourceViewTools });
  const pendingRestoreRef = useRef<{ document: MainSceneSourceViewDocument; baseline: number; applied: boolean; resolve: () => void; reject: (error: Error) => void } | null>(null);
  const restoreSourceViewRef = useRef<(document: unknown) => Promise<void>>(async () => { throw new Error("Main scene is unavailable"); });
  const refreshSourceViewRef = useRef<() => void>(() => {});
  const failSourceRestoreRef = useRef<(error: Error) => void>(() => {});
  useLayoutEffect(() => {
    sourceRequestRef.current = sourceViewRequest;
    sourceViewCallbacksRef.current = { onApplySourceViewRequest, onSourceViewTools };
    sourceSelectionRef.current = { neuronId: observedCellFormId, active: morphologyTargetActive };
    const pending = pendingRestoreRef.current;
    if (pending && (!morphologyTargetActive || pending.document.view.runtimeBinding.neuronId !== observedCellFormId
      || !mainSceneViewEqual(pending.document.view.request, sourceViewRequest))) {
      pendingRestoreRef.current = null;
      pending.reject(new Error("Main scene view: source or requested view changed while restoring"));
    }
  }, [sourceViewRequest, onApplySourceViewRequest, onSourceViewTools, observedCellFormId, morphologyTargetActive]);

  const fitSourceCamera = useCallback((preserveDirection = false, explicit = false) => {
    const context = contextRef.current, selection = sourceSelectionRef.current, request = sourceRequestRef.current;
    const record = morphologyFidelityRecords.find(row => row.neuronId === selection.neuronId);
    if (!context || context.failed || pendingRestoreRef.current || !selection.active || !record
      || !context.sourceGeometry || context.sourceGeometry.neuronId !== record.neuronId
      || request.view !== "cell_detail" || !request.layers.observedForm
      || (!explicit && !context.defaultSourceCamera)) return false;
    try {
      // Fit only a privately verified current object, including hidden source-type
      // children. Inspection dimming must not reduce the complete source bounds.
      mainSceneMorphologyVerification(record, context.sourceGeometry);
      const object = context.observedCellRoot.children.find(child => child.name === `neuromorpho-${record.neuronId}-${request.mode}-source-local`);
      if (!object) return false;
      context.scene.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object);
      const datRoot = context.nmo45718DatSwcCrosswalkRoot;
      if (record.neuronId === 45718 && request.layers.datContours && datRoot.visible
        && datRoot.children.length === 1 && datRoot.children[0].name === "nmo-45718-dat-soma-1-project-mapped-source-contours") {
        for (const key of ["nativeContours", "standardizedGeometry"] as const) {
          const token = context.auxiliaryAssets.get(publicAssetPath(NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[key].path));
          if (!token) return false;
          mainSceneAuxiliaryProof(token);
        }
        bounds.union(new THREE.Box3().setFromObject(datRoot));
      }
      const { camera, controls } = context;
      const fingerprint = JSON.stringify([record.neuronId, request.mode, bounds.min.toArray(), bounds.max.toArray(), camera.aspect]);
      if (!explicit && context.sourceCameraFitFingerprint === fingerprint) return true;
      const keepDirection = preserveDirection && (explicit || Boolean(context.sourceCameraFitFingerprint));
      const direction = keepDirection ? camera.position.clone().sub(controls.target).toArray() : undefined;
      const pose = computeMainSceneSourceCameraFit({ bounds: { minimum: bounds.min.toArray(), maximum: bounds.max.toArray() },
        aspect: camera.aspect, dimensionality: context.sourceGeometry.swc.dimensionality, direction,
        up: keepDirection ? camera.up.toArray() : undefined });
      // Consume old OrbitControls damping at the old pose before setting an exact
      // programmatic pose; otherwise its pending pan/orbit can move the fitted view.
      const damping = controls.enableDamping;
      controls.enableDamping = false; controls.update();
      camera.position.fromArray(pose.position); camera.up.fromArray(pose.up); controls.target.fromArray(pose.target);
      controls.update(); controls.enableDamping = damping; camera.updateMatrixWorld(true);
      context.defaultSourceCamera = true;
      context.sourceCameraFitFingerprint = fingerprint;
      context.renderer.domElement.dataset.sourceCameraFit = "complete-verified-source-bounds";
      refreshSourceViewRef.current();
      return true;
    } catch {
      context.renderer.domElement.dataset.sourceCameraFit = "unavailable";
      return false;
    }
  }, []);

  const onSelectRef = useRef(onSelect);
  const [referenceStatus, setReferenceStatus] = useState<"loading" | "loaded" | "unavailable">("loading");
  const [observedCellStatus, setObservedCellStatus] = useState<"loading" | "loaded" | "unavailable">("loading");
  const [micronsReferenceStatus, setMicronsReferenceStatus] = useState<"idle" | "loading" | "loaded" | "unavailable">("idle");
  const selectedFidelityRecord = morphologyFidelityRecords.find((record) => record.neuronId === observedCellFormId);
  const runtimeReceiptRef = useRef<MorphologyRuntimeReceipt>({
    requestedNeuronId: observedCellFormId,
    requestedMode: morphologyFidelityMode,
    actualMode: null,
    assetId: selectedFidelityRecord?.assetId ?? null,
    geometrySha256: null,
    verificationStatus: "loading",
    sceneObjectStatus: "not_rendered",
    visible: false,
    algorithmId: null,
    reason: "checksum_verification_pending",
  });
  const publishMorphologyRuntime = useCallback((receipt: MorphologyRuntimeReceipt) => {
    const current = receipt.verificationStatus === "verified" && receipt.sceneObjectStatus === "rendered" ? receipt
      : { ...receipt, sourceGeometryVerification: null, sourceContext: null };
    runtimeReceiptRef.current = current;
    onMorphologyRuntime(current);
  }, [onMorphologyRuntime]);
  const micronsRuntimeReceiptRef = useRef<MicronsObservedReferenceRuntimeReceipt>({
    contractId: micronsObservedCellNucleusReference.contractId,
    releaseId: micronsObservedCellNucleusReference.releaseId,
    requested: view === "microns_observed_reference",
    verificationStatus: "idle",
    sceneObjectStatus: "not_rendered",
    cellSurfaceVisible: false,
    nucleusVisible: false,
    clipping: buildMicronsClipRuntimeReceipt(
      micronsClipping,
      micronsSourceNativeClipping,
      micronsObservedCellNucleusReference.coordinateContract.displayTransformReceipt.canonical,
    ) as MicronsClippingRuntimeReceipt,
    expectedManifestSha256: micronsObservedCellNucleusReference.assetBundle.manifest.sha256,
    verifiedAssetReceipt: null,
    reason: "reference_mode_not_requested",
  });
  const publishMicronsRuntime = useCallback((receipt: MicronsObservedReferenceRuntimeReceipt) => {
    micronsRuntimeReceiptRef.current = receipt;
    onMicronsRuntime(receipt);
  }, [onMicronsRuntime]);

  const captureSourceView = useCallback(() => {
    const context = contextRef.current, selection = sourceSelectionRef.current;
    const record = morphologyFidelityRecords.find(row => row.neuronId === selection.neuronId);
    if (!context || context.failed || !selection.active || !record || !context.sourceGeometry || !context.inspection
      || context.sourceGeometry.neuronId !== record.neuronId || runtimeReceiptRef.current.requestedNeuronId !== record.neuronId || runtimeReceiptRef.current.actualMode !== sourceRequestRef.current.mode || runtimeReceiptRef.current.verificationStatus !== "verified") throw new Error("Main scene view: current verified morphology scene is unavailable");
    const { renderer, camera, controls } = context;
    const attributes = renderer.getContext().getContextAttributes();
    if (!attributes || typeof attributes.alpha !== "boolean" || typeof attributes.antialias !== "boolean") throw new Error("Main scene view: live WebGL context attributes are unavailable");
    if (context.auxiliaryAssets.has(micronsObservedCellNucleusReference.assetBundle.manifest.path)
      && (context.micronsCellRoot.children.length !== 1 || context.micronsNucleusRoot.children.length !== 1)) throw new Error("Main scene view: verified MICrONS objects are still being constructed");
    const object = context.observedCellRoot.children.find(child => child.name === `neuromorpho-${record.neuronId}-${sourceRequestRef.current.mode}-source-local`);
    if (!object) throw new Error("Main scene view: current source object is unavailable");
    const inspected = context.inspection.getState();
    context.scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object), size = renderer.getSize(new THREE.Vector2()), buffer = renderer.getDrawingBufferSize(new THREE.Vector2());
    const planes = (root: THREE.Object3D) => {
      const result: { normal: number[]; constant: number }[] = [];
      root.traverse(child => {
        const material = (child as THREE.Mesh).material;
        for (const entry of material ? Array.isArray(material) ? material : [material] : []) for (const plane of entry.clippingPlanes ?? []) {
          const row = { normal: plane.normal.toArray(), constant: plane.constant };
          if (!result.some(value => mainSceneViewEqual(value, row))) result.push(row);
        }
      });
      return result;
    };
    const view: MainSceneSourceView = {
      runtimeBinding: { neuronId: record.neuronId, geometrySha256: record.geometry.sha256, sceneInstanceId: context.instanceId, revision: sourceViewRevisionRef.current },
      request: structuredClone(sourceRequestRef.current),
      camera: { kind: "PerspectiveCamera", position: camera.position.toArray(), target: controls.target.toArray(), up: camera.up.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, zoom: camera.zoom, aspect: camera.aspect, near: camera.near, far: camera.far, filmGauge: camera.filmGauge, filmOffset: camera.filmOffset },
      viewport: { cssWidth: size.x, cssHeight: size.y, drawingBufferWidth: buffer.x, drawingBufferHeight: buffer.y, pixelRatio: renderer.getPixelRatio() },
      renderer: { engine: "THREE", revision: THREE.REVISION, outputColorSpace: renderer.outputColorSpace, toneMapping: renderer.toneMapping, requestedAlpha: false, requestedAntialias: true, alpha: attributes.alpha, antialias: attributes.antialias },
      clipping: { globalPlanes: renderer.clippingPlanes.map(plane => ({ normal: plane.normal.toArray(), constant: plane.constant })), localClippingEnabled: renderer.localClippingEnabled, micronsCellPlanes: planes(context.micronsCellRoot), micronsNucleusPlanes: planes(context.micronsNucleusRoot) },
      layers: { scaffold: context.scaffold.visible, grayMatter: context.grayMatter.visible, internalCompartments: context.internalCompartments.visible, entities: context.entityRoot.visible,
        syntheticGuide: context.syntheticLaneGuide.visible, morphology: context.observedCellRoot.visible, datContours: context.nmo45718DatSwcCrosswalkRoot.visible && context.nmo45718DatSwcCrosswalkRoot.children.length > 0,
        morphologyGuide: context.observedCellLaneGuide.visible, micronsReference: context.micronsReferenceRoot.visible, micronsCell: context.micronsCellRoot.visible,
        micronsNucleus: context.micronsNucleusRoot.visible, internalReference: context.internalReferenceRoot.visible, slicePlane: context.slicePlane.visible,
        visibleEntityIds: [...context.entityGroups].filter(([, group]) => group.visible).map(([id]) => id).sort(), activeSelectedId: [...context.entityGroups].find(([, group]) => group.getObjectByName("selection-halo")?.visible)?.[0] ?? null },
      sourceObject: { mode: sourceRequestRef.current.mode, dimensionality: context.sourceGeometry.swc.dimensionality, sourceDiameterAvailable: context.sourceGeometry.swc.sourceDiameterAvailable,
        displayTransform: structuredClone(context.sourceGeometry.displayTransform), worldMatrix: object.matrixWorld.toArray(), bounds: { minimum: bounds.min.toArray(), maximum: bounds.max.toArray() },
        topologyLandmarksVisible: object.getObjectByName(`topology-landmarks-${record.neuronId}-source-local`)?.visible ?? false, sourceTypes: [...new Set(context.sourceGeometry.nodes.map(row => row[1]))].sort((a, b) => a - b) },
      inspection: { available: true, selectedNodeId: inspected.selection?.nodeId ?? null, contextDimmed: inspected.dimmed,
        overlayAuthority: "exact_swc_parent_path_and_descendant_edges" },
    };
    return captureMainSceneSourceView(record, context.sourceGeometry, view, [...context.auxiliaryAssets.values()], THREE.REVISION);
  }, []);

  useEffect(() => {
    const refresh = () => {
      let available = false, fingerprint = "unavailable", unavailableReason: string | undefined;
      let actualCamera: MainSceneSourceView["camera"] | null = null;
      try {
        const doc = captureSourceView();
        const value = structuredClone(doc.view); value.runtimeBinding.revision = 0;
        // OrbitControls can alternate between adjacent floats while idle. Compare
        // with the last accepted pose, without rounding the actual capture or
        // relaxing any source, projection, viewport or layer signature field.
        if (sourceViewCameraRef.current && sameMainSceneCameraForCapture(value.camera, sourceViewCameraRef.current)) value.camera = sourceViewCameraRef.current;
        actualCamera = value.camera;
        fingerprint = JSON.stringify({ view: value, sourceSequence: doc.geometryVerification.mainSceneVerificationSequence, auxiliaryAssets: doc.auxiliaryAssets });
        available = !pendingRestoreRef.current;
        if (contextRef.current) delete contextRef.current.renderer.domElement.dataset.sourceViewUnavailableReason;
      } catch (error) {
        unavailableReason = error instanceof Error ? error.message : "Current source view is unavailable";
        if (contextRef.current) contextRef.current.renderer.domElement.dataset.sourceViewUnavailableReason = unavailableReason;
      }
      const restoring = Boolean(pendingRestoreRef.current);
      const selection = sourceSelectionRef.current;
      const geometry = contextRef.current?.sourceGeometry ?? validationGeometryRef.current;
      const restorable = Boolean(contextRef.current && selection.active && geometry?.neuronId === selection.neuronId);
      fingerprint += `:${restoring}:${restorable}:${selection.neuronId}:${selection.active}:${unavailableReason ?? ""}`;
      if (fingerprint === sourceViewFingerprintRef.current) return;
      sourceViewFingerprintRef.current = fingerprint;
      sourceViewCameraRef.current = actualCamera;
      sourceViewRevisionRef.current += 1;
      sourceViewCallbacksRef.current.onSourceViewTools(selection.active ? { neuronId: selection.neuronId,
        signature: `${contextRef.current?.instanceId ?? "unavailable"}:${sourceViewRevisionRef.current}`, available, restorable, restoring, unavailableReason,
        capture: captureSourceView, restore: document => restoreSourceViewRef.current(document),
        cancelRestoration: reason => {
          if (!pendingRestoreRef.current) return;
          failSourceRestoreRef.current(new Error(reason));
          setSourceSceneEpoch(epoch => epoch + 1);
        } } : null);
    };
    refreshSourceViewRef.current = refresh;
    failSourceRestoreRef.current = error => {
      const pending = pendingRestoreRef.current;
      if (!pending) return;
      pendingRestoreRef.current = null;
      setObservedCellStatus("unavailable"); setReferenceStatus("unavailable"); setMicronsReferenceStatus("unavailable");
      const context = contextRef.current;
      if (context) {
        clearInspection();
        context.failed = true; context.sourceGeometry = null; context.auxiliaryAssets.clear();
        for (const root of [context.observedCellRoot, context.scaffold, context.grayMatter, context.internalCompartments, context.nmo45718DatSwcCrosswalkRoot, context.micronsCellRoot, context.micronsNucleusRoot]) clearSourceGeometryRoot(root);
        context.renderer.domElement.dataset.sourceViewStatus = "unavailable-fresh-restoration-failed";
        context.renderer.domElement.dataset.observedCellFormStatus = "unavailable-no-fallback";
        context.renderer.domElement.dataset.micronsObservedReferenceStatus = "unavailable-no-fallback";
      }
      publishMorphologyRuntime({ ...runtimeReceiptRef.current, actualMode: null, geometrySha256: null, verificationStatus: "failed", sceneObjectStatus: "not_rendered", visible: false, algorithmId: null, reason: error.message });
      publishMicronsRuntime({ ...micronsRuntimeReceiptRef.current, verificationStatus: "unavailable", sceneObjectStatus: "not_rendered", cellSurfaceVisible: false, nucleusVisible: false, verifiedAssetReceipt: null, reason: error.message });
      onNmo45718DatSwcCrosswalkRuntime({ status: "unavailable", message: error.message });
      onCaptureReady(null); pending.reject(error); refresh();
    };
    restoreSourceViewRef.current = async value => {
      const selection = sourceSelectionRef.current, record = morphologyFidelityRecords.find(row => row.neuronId === selection.neuronId);
      const geometry = contextRef.current?.sourceGeometry ?? validationGeometryRef.current;
      if (!selection.active || !record || !geometry || geometry.neuronId !== record.neuronId) throw new Error("Main scene view: the exact source must be selected before restoring");
      const document = structuredClone(value) as MainSceneSourceViewDocument;
      const saved = validateMainSceneSourceViewReplay(record, geometry, document, THREE.REVISION);
      sourceViewCallbacksRef.current.onApplySourceViewRequest(saved.request, saved.layers.visibleEntityIds);
      const previous = pendingRestoreRef.current;
      if (previous) previous.reject(new Error("Main scene view: restoration replaced by a newer request"));
      return new Promise<void>((resolve, reject) => {
        pendingRestoreRef.current = { document, baseline: mainSceneMorphologyVerification(record, geometry).geometryVerification.mainSceneVerificationSequence, applied: false, resolve, reject };
        refresh(); setSourceSceneEpoch(epoch => epoch + 1);
      });
    };
    refresh();
    return () => {
      const pending = pendingRestoreRef.current; pendingRestoreRef.current = null;
      pending?.reject(new Error("Main scene view: renderer was unmounted before restoration completed"));
      refreshSourceViewRef.current = () => {}; sourceViewCallbacksRef.current.onSourceViewTools(null);
    };
  }, [captureSourceView, clearInspection, onCaptureReady, onNmo45718DatSwcCrosswalkRuntime, publishMicronsRuntime, publishMorphologyRuntime]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const probe = document.createElement("canvas");
    const hasWebGL2 = Boolean(probe.getContext("webgl2"));
    if (!hasWebGL2) {
      onWebGLStatus(false);
      onCaptureReady(null);
      onPerformance(null);
      publishMorphologyRuntime({
        ...runtimeReceiptRef.current,
        actualMode: null,
        verificationStatus: "unavailable",
        sceneObjectStatus: "not_rendered",
        visible: false,
        reason: "webgl2_unavailable",
      });
      publishMicronsRuntime({
        ...micronsRuntimeReceiptRef.current,
        requested: micronsRuntimeReceiptRef.current.requested,
        verificationStatus: "unavailable",
        sceneObjectStatus: "not_rendered",
        cellSurfaceVisible: false,
        nucleusVisible: false,
        verifiedAssetReceipt: null,
        reason: "webgl2_unavailable",
      });
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe7ece9);
    scene.fog = new THREE.Fog(0xe7ece9, 38, 90);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 250);
    camera.position.set(11, 8, 26);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      onWebGLStatus(false);
      onCaptureReady(null);
      onPerformance(null);
      publishMorphologyRuntime({
        ...runtimeReceiptRef.current,
        actualMode: null,
        verificationStatus: "unavailable",
        sceneObjectStatus: "not_rendered",
        visible: false,
        reason: "webgl_renderer_unavailable",
      });
      publishMicronsRuntime({
        ...micronsRuntimeReceiptRef.current,
        requested: micronsRuntimeReceiptRef.current.requested,
        verificationStatus: "unavailable",
        sceneObjectStatus: "not_rendered",
        cellSurfaceVisible: false,
        nucleusVisible: false,
        verifiedAssetReceipt: null,
        reason: "webgl_renderer_unavailable",
      });
      return;
    }
    onWebGLStatus(true);
    // A rebuilt renderer contains no previously constructed MICrONS objects.
    publishMicronsRuntime({ ...micronsRuntimeReceiptRef.current, requested: sourceRequestRef.current.view === "microns_observed_reference",
      verificationStatus: "idle", sceneObjectStatus: "not_rendered", cellSurfaceVisible: false, nucleusVisible: false,
      verifiedAssetReceipt: null, reason: "new_renderer_source_verification_pending" });
    queueMicrotask(() => { setReferenceStatus("loading"); setMicronsReferenceStatus("idle"); });
    renderer.localClippingEnabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("role", "application");
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown Home Equal Minus");
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D scene. Use arrow keys to orbit, plus or minus to zoom, and Home to reset this canvas camera. Use the adjacent evidence-entity buttons for keyboard selection. The pinned Allen spinal cord reference is inferred; non-cell evidence nodes and schematic pathways occupy a separate lane. Exact checksum-verified source-local NeuroMorpho centerlines may be shown, and a deterministic radius-derived surface is allowed only when source diameter exists. Same-specimen internal structure is unavailable. No lane has an identity or coordinate relationship to another; measurement is forbidden and registration count is zero.",
    );
    renderer.domElement.dataset.atlasReferenceStatus = "loading";

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 100;
    controls.target.set(COMBINED_SCENE_TARGET_X, 0, 0);
    const protectSourceCamera = () => {
      if (contextRef.current) contextRef.current.defaultSourceCamera = false;
    };
    controls.addEventListener("start", protectSourceCamera);

    const handleSceneKeyDown = (event: globalThis.KeyboardEvent) => {
      if (pendingRestoreRef.current) return;
      const orbitStep = Math.PI / 36;
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      let handled = true;
      if (event.key === "ArrowLeft") spherical.theta -= orbitStep;
      else if (event.key === "ArrowRight") spherical.theta += orbitStep;
      else if (event.key === "ArrowUp") spherical.phi = Math.max(0.05, spherical.phi - orbitStep);
      else if (event.key === "ArrowDown") spherical.phi = Math.min(Math.PI - 0.05, spherical.phi + orbitStep);
      else if (event.key === "+" || event.key === "=") spherical.radius = Math.max(controls.minDistance, spherical.radius * 0.9);
      else if (event.key === "-" || event.key === "_") spherical.radius = Math.min(controls.maxDistance, spherical.radius * 1.1);
      else if (event.key === "Home") {
        if (sourceRequestRef.current.view === "cell_detail") {
          event.preventDefault(); fitSourceCamera(false, true); return;
        }
        controls.target.set(COMBINED_SCENE_TARGET_X, 0, 0);
        camera.position.set(11, 8, 26);
      } else handled = false;
      if (!handled) return;
      event.preventDefault();
      protectSourceCamera();
      if (event.key !== "Home") camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      camera.lookAt(controls.target);
      controls.update();
    };
    renderer.domElement.addEventListener("keydown", handleSceneKeyDown);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x243047, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(8, 12, 10);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9bbcff, 0.55);
    fill.position.set(-6, -3, -8);
    scene.add(fill);

    const scaffold = new THREE.Group();
    scaffold.name = "allen-reference-outer-envelope-inf";
    const grayMatter = new THREE.Group();
    grayMatter.name = "allen-reference-coarse-gray-envelope-inf";
    const internalCompartments = new THREE.Group();
    internalCompartments.name = "allen-reference-plane-local-internal-contours-inf";
    const syntheticLaneGuide = createSyntheticEvidenceLaneGuide();
    const entityRoot = new THREE.Group();
    entityRoot.name = "synthetic-evidence-entities-unregistered-lane";
    entityRoot.position.x = SYNTHETIC_EVIDENCE_LANE_X;
    const entityGroups = new Map<string, THREE.Group>();
    entities.forEach((entity) => {
      const object = createEntityObject(entity);
      entityGroups.set(entity.id, object);
      entityRoot.add(object);
    });
    const observedCellLaneGuide = createObservedCellFormLaneGuide();
    const observedCellRoot = new THREE.Group();
    observedCellRoot.name = "observed-source-local-cell-form-root";
    observedCellRoot.position.x = OBSERVED_CELL_FORM_LANE_X;
    observedCellRoot.userData = {
      inputGeometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
      representationAuthority: "evidence_gated_by_selected_mode",
      sourceFrame: "NeuroMorpho_CNG_standardized_local_frame",
      coordinateRelationshipToAtlas: "none",
      coordinateRelationshipToPopulationEvidence: "none",
      projectRegistrationCount: 0,
      exactCrossSourceIdentityCount: 0,
    };
    const nmo45718DatSwcCrosswalkRoot = new THREE.Group();
    nmo45718DatSwcCrosswalkRoot.name = "nmo-45718-dat-swc-project-derived-display-crosswalk-root";
    nmo45718DatSwcCrosswalkRoot.position.x = OBSERVED_CELL_FORM_LANE_X;
    nmo45718DatSwcCrosswalkRoot.visible = false;
    nmo45718DatSwcCrosswalkRoot.userData = {
      assetId: "NeuroMorpho:45718",
      representation: "source_native_dat_contours_project_mapped_to_same_record_standardized_swc_frame",
      sourceFrame: "Neurolucida_DAT_source_native_unregistered",
      displayFrame: "NeuroMorpho_CNG_standardized_local_frame",
      registrationCount: 0,
      measurementClaim: false,
      surfaceCount: 0,
      volumeCount: 0,
      internalStructureObjectCount: 0,
    };
    const micronsReferenceRoot = new THREE.Group();
    micronsReferenceRoot.name = "microns-observed-cell-nucleus-reference-root";
    micronsReferenceRoot.visible = false;
    micronsReferenceRoot.userData = {
      contractId: micronsObservedCellNucleusReference.contractId,
      authority: micronsObservedCellNucleusReference.authority,
      region: micronsObservedCellNucleusReference.sourceDataset.specimen.region,
      regionRelationshipToProject: micronsObservedCellNucleusReference.sourceDataset.specimen.regionRelationshipToProject,
      samePhysicalObjectWithinReference: true,
      relationshipToSpinalLanes: "co_display_only",
      joinCount: 0,
      registrationCount: 0,
      membraneClaim: false,
    };
    const displayTransform = micronsObservedCellNucleusReference.coordinateContract.displayTransformReceipt.canonical;
    micronsReferenceRoot.scale.setScalar(displayTransform.scaleViewerUnitPerNanometre);
    micronsReferenceRoot.position.set(
      -displayTransform.originNanometre[0] * displayTransform.scaleViewerUnitPerNanometre,
      -displayTransform.originNanometre[1] * displayTransform.scaleViewerUnitPerNanometre,
      -displayTransform.originNanometre[2] * displayTransform.scaleViewerUnitPerNanometre,
    );
    const micronsCellRoot = new THREE.Group();
    micronsCellRoot.name = "microns-observed-cell-segmentation-component";
    const micronsNucleusRoot = new THREE.Group();
    micronsNucleusRoot.name = "microns-observed-linked-nucleus-component";
    micronsReferenceRoot.add(micronsCellRoot, micronsNucleusRoot);
    const internalReferenceRoot = createCrossRegionInternalReferenceObject();
    internalReferenceRoot.visible = false;
    scene.add(
      scaffold,
      grayMatter,
      internalCompartments,
      observedCellLaneGuide,
      observedCellRoot,
      nmo45718DatSwcCrosswalkRoot,
      syntheticLaneGuide,
      entityRoot,
      micronsReferenceRoot,
      internalReferenceRoot,
    );

    const auxiliaryAssets = new Map<string, MainSceneAuxiliaryToken>();
    const atlasController = new AbortController();
    Promise.all(
      [ATLAS_CONTOURS_URL, ATLAS_INTERNAL_COMPARTMENTS_URL].map((url) =>
        readVerifiedMainSceneAuxiliary(url, { signal: atlasController.signal }).then(token => {
          auxiliaryAssets.set(url, token); return mainSceneAuxiliaryJson(token);
        }),
      ),
    )
      .then(([contourPayload, internalPayload]) => {
        if (atlasController.signal.aborted || contextRef.current?.failed) return;
        const reference = buildAtlasReferenceGeometry(contourPayload);
        const internalReference = buildAtlasInternalContourGeometry(
          internalPayload,
        ) as AtlasInternalContourGeometry;
        const referenceScaffold = createReferenceScaffold(reference);
        const referenceGrayMatter = createReferenceGrayMatter(reference);
        const referenceInternalCompartments = createReferenceInternalCompartments(internalReference);
        scaffold.userData = referenceScaffold.userData;
        grayMatter.userData = referenceGrayMatter.userData;
        internalCompartments.userData = referenceInternalCompartments.userData;
        scaffold.add(...referenceScaffold.children);
        grayMatter.add(...referenceGrayMatter.children);
        internalCompartments.add(...referenceInternalCompartments.children);
        setReferenceStatus("loaded");
        renderer.domElement.dataset.atlasReferenceStatus = "loaded-inf";
        renderer.domElement.setAttribute(
          "aria-label",
          `Interactive 3D mouse spinal cord scene. A coarse outer envelope and coarse gray-matter row-envelope are uncapped INF side lofts from ${reference.planeCount} pinned Allen reference planes. Seven source-identified major structures are rendered as ${internalReference.totalContourCount} exact plane-local source-mask contours, with no fine-label cross-plane joins or interpolation and ${internalReference.missingPlanes.length} explicit missing records. The nonuniform 38-plane selection covers all 32 exact z-wise annotation states in the pinned asset; these are not spinal segments or independent biological observations. Evidence entities are SYN non-cell nodes and pathways are SCH in a separate lane. A checksum-verified NeuroMorpho object occupies its own source-local lane; observed SWC input and any deterministic radius-derived display remain explicitly distinct, and same-specimen internal structure is unavailable. Neither lane has an atlas coordinate relationship, and co-display does not establish cell-type or entity identity. Measurement is forbidden; registration count is zero.`,
        );
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        failSourceRestoreRef.current(error);
        auxiliaryAssets.clear();
        setReferenceStatus("unavailable");
        renderer.domElement.dataset.atlasReferenceStatus = "unavailable-no-fallback";
        renderer.domElement.setAttribute(
          "aria-label",
          "Interactive evidence-entity scene. The pinned Allen anatomical reference is unavailable, so no anatomical fallback is shown. Evidence entities remain SYN and pathways SCH; measurement is forbidden and no registration or segment labels are present.",
        );
      });

    const slicePlane = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 64),
      new THREE.MeshBasicMaterial({ color: 0x0e7c66, transparent: true, opacity: 0.11, side: THREE.DoubleSide, depthWrite: false }),
    );
    slicePlane.position.set(SYNTHETIC_EVIDENCE_LANE_X, 0, 0);
    slicePlane.name = "synthetic-lane-display-plane-not-atlas-plane";
    scene.add(slicePlane);

    contextRef.current = {
      scene, instanceId: `main-scene-runtime-${++mainSceneInstanceSequence}`, sourceGeometry: null, inspection: null, auxiliaryAssets, failed: false,
      defaultSourceCamera: true, lastCameraView: null, sourceCameraFitFingerprint: "",
      renderer,
      camera,
      controls,
      scaffold,
      grayMatter,
      internalCompartments,
      entityRoot,
      syntheticLaneGuide,
      entityGroups,
      observedCellRoot,
      nmo45718DatSwcCrosswalkRoot,
      observedCellLaneGuide,
      micronsReferenceRoot,
      micronsCellRoot,
      micronsNucleusRoot,
      internalReferenceRoot,
      slicePlane,
    };
    onCaptureReady(options => {
      let receipt: MainSceneExportView;
      try {
        if (pendingRestoreRef.current) throw new Error("Main scene restoration is in progress");
        receipt = captureSourceView();
        if (receipt.source.neuronId !== options.currentNeuronId) throw new Error("The current main-scene source changed");
      } catch (error) { receipt = { status: "unavailable", reason: error instanceof Error ? error.message : "No current main-scene source view", currentNeuronId: options.currentNeuronId }; }
      return captureRendererPng(renderer, scene, camera, options, "documentType" in receipt ? receipt.view.layers : null,
        "documentType" in receipt ? receipt.view.sourceObject : null).then(blob => appendMainSceneExportPng(blob, receipt,
        { exportKind: "rendered_main_scene", requestedState: options.requestedState, currentNeuronId: options.currentNeuronId }));
    });

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.16;
    const pointer = new THREE.Vector2();
    const handlePointer = (event: PointerEvent) => {
      renderer.domElement.focus({ preventScroll: true });
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(entityRoot.children, true);
      const hit = hits.find((candidate) => candidate.object.userData.entityId);
      if (hit?.object.userData.entityId) onSelectRef.current(hit.object.userData.entityId as string);
    };
    renderer.domElement.addEventListener("pointerdown", handlePointer);
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      failSourceRestoreRef.current(new Error("Main scene view: WebGL context lost"));
      clearInspection();
      if (contextRef.current) { contextRef.current.failed = true; contextRef.current.sourceGeometry = null; contextRef.current.auxiliaryAssets.clear(); }
      publishMorphologyRuntime({ ...runtimeReceiptRef.current, actualMode: null, geometrySha256: null, verificationStatus: "unavailable", sceneObjectStatus: "not_rendered", visible: false, algorithmId: null, reason: "webgl_context_lost" });
      refreshSourceViewRef.current();
      onCaptureReady(null);
      onPerformance(null);
      onWebGLStatus(false);
      publishMicronsRuntime({
        ...micronsRuntimeReceiptRef.current,
        verificationStatus: "unavailable",
        sceneObjectStatus: "not_rendered",
        cellSurfaceVisible: false,
        nucleusVisible: false,
        verifiedAssetReceipt: null,
        reason: "webgl_context_lost",
      });
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    const resize = () => {
      const width = Math.max(320, container.clientWidth);
      const height = Math.max(420, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fitSourceCamera(true);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame = 0;
    let lastFrameAt = performance.now();
    let lastReportAt = lastFrameAt;
    const frameTimes: number[] = [];
    const renderFrame = (timestamp: number) => {
      if (!document.hidden) {
        const elapsed = timestamp - lastFrameAt;
        if (elapsed > 0 && elapsed < 1000) frameTimes.push(elapsed);
        lastFrameAt = timestamp;
        controls.update();
        const pending = pendingRestoreRef.current;
        if (pending && contextRef.current?.sourceGeometry) {
          try {
            captureSourceView();
            if (!pending.applied) {
              const saved = pending.document.view.camera;
              if (mainSceneMorphologyVerification(morphologyFidelityRecords.find(row => row.neuronId === sourceSelectionRef.current.neuronId)!, contextRef.current.sourceGeometry).geometryVerification.mainSceneVerificationSequence <= pending.baseline) throw new Error("Main scene view: fresh source verification did not advance");
              contextRef.current.defaultSourceCamera = false;
              const damping = controls.enableDamping;
              controls.enableDamping = false; controls.update();
              camera.position.fromArray(saved.position); camera.up.fromArray(saved.up); controls.target.fromArray(saved.target);
              const inspection = pending.document.view.inspection;
              if (inspection.selectedNodeId === null) contextRef.current.inspection!.clear();
              else contextRef.current.inspection!.restore({ geometryIdentity: contextRef.current.sourceGeometry,
                nodeId: inspection.selectedNodeId, dimmed: inspection.contextDimmed });
              controls.update(); controls.enableDamping = damping; camera.updateMatrixWorld(true); pending.applied = true;
            }
            const actual = captureSourceView();
            assertMainSceneSourceViewApplied(pending.document, actual);
            pendingRestoreRef.current = null; pending.resolve(); renderer.domElement.dataset.sourceViewStatus = "restored-fresh-verified";
            setInspectionScene({ geometry: contextRef.current.sourceGeometry, mode: sourceRequestRef.current.mode, epoch: sourceSceneEpoch });
          } catch (error) {
            // Incomplete auxiliary reads are expected until the asynchronous loaders finish.
            if (pending.applied) failSourceRestoreRef.current(error instanceof Error ? error : new Error("Main scene view: restored pose verification failed"));
          }
        }
        renderer.render(scene, camera);
        refreshSourceViewRef.current();
        if (timestamp - lastReportAt >= 1000 && frameTimes.length) {
          const sorted = [...frameTimes].sort((a, b) => a - b);
          const p95 = sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
          const mean = frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length;
          onPerformance({
            fps: Math.max(0, Math.round(1000 / mean)),
            frameP95Ms: Math.round(p95 * 10) / 10,
            drawCalls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
          });
          frameTimes.length = 0;
          lastReportAt = timestamp;
        }
      } else {
        lastFrameAt = timestamp;
      }
      frame = requestAnimationFrame(renderFrame);
    };
    frame = requestAnimationFrame(renderFrame);

    return () => {
      atlasController.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointer);
      renderer.domElement.removeEventListener("keydown", handleSceneKeyDown);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      controls.removeEventListener("start", protectSourceCamera);
      clearInspection();
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      contextRef.current = null;
      refreshSourceViewRef.current();
      onCaptureReady(null);
      onPerformance(null);
    };
  }, [entities, onCaptureReady, onPerformance, onWebGLStatus, publishMicronsRuntime, publishMorphologyRuntime, captureSourceView, clearInspection, sourceSceneEpoch, fitSourceCamera]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    if (view !== "microns_observed_reference" && context.micronsCellRoot.children.length === 0
      && !pendingRestoreRef.current?.document.auxiliaryAssets.some(row => row.path === micronsObservedCellNucleusReference.assetBundle.manifest.path)) {
      if (micronsRuntimeReceiptRef.current.verificationStatus === "loading") {
        setMicronsReferenceStatus("idle");
        publishMicronsRuntime({
          ...micronsRuntimeReceiptRef.current,
          requested: false,
          verificationStatus: "idle",
          sceneObjectStatus: "not_rendered",
          cellSurfaceVisible: false,
          nucleusVisible: false,
          verifiedAssetReceipt: null,
          reason: "reference_mode_not_requested",
        });
      }
      return;
    }
    if (context.micronsCellRoot.children.length === 1 && context.micronsNucleusRoot.children.length === 1) {
      const clipping = applyMicronsSourceNativeClipping(context, micronsClipping);
      setMicronsReferenceStatus("loaded");
      publishMicronsRuntime({
        ...micronsRuntimeReceiptRef.current,
        requested: view === "microns_observed_reference",
        verificationStatus: "verified",
        sceneObjectStatus: "rendered",
        cellSurfaceVisible: view === "microns_observed_reference" && showMicronsCellSurface,
        nucleusVisible: view === "microns_observed_reference" && showMicronsNucleus,
        clipping,
        reason: null,
      });
      return;
    }

    const controller = new AbortController();
    setMicronsReferenceStatus("loading");
    publishMicronsRuntime({
      ...micronsRuntimeReceiptRef.current,
      requested: true,
      verificationStatus: "loading",
      sceneObjectStatus: "not_rendered",
      cellSurfaceVisible: false,
      nucleusVisible: false,
      verifiedAssetReceipt: null,
      reason: "checksum_verification_pending",
    });
    context.renderer.domElement.dataset.micronsObservedReferenceStatus = "loading-verification-pending";
    const manifestReceipt = micronsObservedCellNucleusReference.assetBundle.manifest;
    readVerifiedMainSceneAuxiliary(manifestReceipt.path, { signal: controller.signal })
      .then(token => {
        const manifest = mainSceneAuxiliaryJson(token) as MicronsAssetManifest;
        assertMicronsAssetManifest(manifest);
        context.auxiliaryAssets.set(token.path, token);
        return { manifest, verifiedManifestSha256: mainSceneAuxiliaryProof(token).verifiedSha256 };
      })
      .then(async ({ manifest, verifiedManifestSha256 }) => {
        const cell = manifest.components.find((component) => component.componentName === "cell")!;
        const nucleus = manifest.components.find((component) => component.componentName === "nucleus")!;
        const [cellPositions, cellTriangles, nucleusPositions, nucleusTriangles] = await Promise.all([
          fetchVerifiedMicronsBuffer(cell.browserGeometry.positions, controller.signal, context),
          fetchVerifiedMicronsBuffer(cell.browserGeometry.triangles, controller.signal, context),
          fetchVerifiedMicronsBuffer(nucleus.browserGeometry.positions, controller.signal, context),
          fetchVerifiedMicronsBuffer(nucleus.browserGeometry.triangles, controller.signal, context),
        ]);
        if (controller.signal.aborted || context.failed || contextRef.current !== context) return;
        const cellMesh = createMicronsObservedSegmentationMesh(
          "cell",
          cell.browserGeometry,
          cellPositions.bytes,
          cellTriangles.bytes,
        );
        const nucleusMesh = createMicronsObservedSegmentationMesh(
          "nucleus",
          nucleus.browserGeometry,
          nucleusPositions.bytes,
          nucleusTriangles.bytes,
        );
        context.micronsCellRoot.children.forEach((child) => disposeObject(child));
        context.micronsNucleusRoot.children.forEach((child) => disposeObject(child));
        context.micronsCellRoot.clear();
        context.micronsNucleusRoot.clear();
        context.micronsCellRoot.add(cellMesh);
        context.micronsNucleusRoot.add(nucleusMesh);
        const clipping = applyMicronsSourceNativeClipping(context, micronsClipping);
        context.micronsCellRoot.visible = view === "microns_observed_reference" && showMicronsCellSurface;
        context.micronsNucleusRoot.visible = view === "microns_observed_reference" && showMicronsNucleus;
        setMicronsReferenceStatus("loaded");
        context.renderer.domElement.dataset.micronsObservedReferenceStatus = "loaded-verified-exact-cell-and-linked-nucleus";
        publishMicronsRuntime({
          ...micronsRuntimeReceiptRef.current,
          requested: view === "microns_observed_reference",
          verificationStatus: "verified",
          sceneObjectStatus: "rendered",
          cellSurfaceVisible: view === "microns_observed_reference" && showMicronsCellSurface,
          nucleusVisible: view === "microns_observed_reference" && showMicronsNucleus,
          clipping,
          verifiedAssetReceipt: {
            manifest: {
              path: manifestReceipt.path,
              bytes: manifestReceipt.bytes,
              expectedSha256: manifestReceipt.sha256,
              verifiedSha256: verifiedManifestSha256,
            },
            components: [
              {
                componentName: "cell",
                objectId: cell.objectId,
                vertexCount: cell.browserGeometry.vertexCount,
                triangleCount: cell.browserGeometry.triangleCount,
                positions: {
                  path: cell.browserGeometry.positions.path,
                  bytes: cell.browserGeometry.positions.bytes,
                  expectedSha256: cell.browserGeometry.positions.sha256,
                  verifiedSha256: cellPositions.verifiedSha256,
                },
                triangles: {
                  path: cell.browserGeometry.triangles.path,
                  bytes: cell.browserGeometry.triangles.bytes,
                  expectedSha256: cell.browserGeometry.triangles.sha256,
                  verifiedSha256: cellTriangles.verifiedSha256,
                },
              },
              {
                componentName: "nucleus",
                objectId: nucleus.objectId,
                vertexCount: nucleus.browserGeometry.vertexCount,
                triangleCount: nucleus.browserGeometry.triangleCount,
                positions: {
                  path: nucleus.browserGeometry.positions.path,
                  bytes: nucleus.browserGeometry.positions.bytes,
                  expectedSha256: nucleus.browserGeometry.positions.sha256,
                  verifiedSha256: nucleusPositions.verifiedSha256,
                },
                triangles: {
                  path: nucleus.browserGeometry.triangles.path,
                  bytes: nucleus.browserGeometry.triangles.bytes,
                  expectedSha256: nucleus.browserGeometry.triangles.sha256,
                  verifiedSha256: nucleusTriangles.verifiedSha256,
                },
              },
            ],
          },
          reason: null,
        });
      })
      .catch((error: Error) => {
        if (controller.signal.aborted || contextRef.current !== context || error.name === "AbortError") return;
        failSourceRestoreRef.current(error);
        for (const path of [...context.auxiliaryAssets.keys()]) if (path.startsWith(manifestReceipt.path.slice(0, -"asset-manifest.json".length))) context.auxiliaryAssets.delete(path);
        context.micronsCellRoot.children.forEach((child) => disposeObject(child));
        context.micronsNucleusRoot.children.forEach((child) => disposeObject(child));
        context.micronsCellRoot.clear();
        context.micronsNucleusRoot.clear();
        setMicronsReferenceStatus("unavailable");
        context.renderer.domElement.dataset.micronsObservedReferenceStatus = "unavailable-no-fallback";
        publishMicronsRuntime({
          ...micronsRuntimeReceiptRef.current,
          requested: true,
          verificationStatus: "unavailable",
          sceneObjectStatus: "not_rendered",
          cellSurfaceVisible: false,
          nucleusVisible: false,
          verifiedAssetReceipt: null,
          reason: error.message.slice(0, 240),
        });
      });
    return () => controller.abort();
  }, [micronsClipping, publishMicronsRuntime, showMicronsCellSurface, showMicronsNucleus, view, sourceSceneEpoch]);

  useLayoutEffect(() => {
    morphologyLoadEpochRef.current += 1;
    clearInspection();
    const root = contextRef.current?.observedCellRoot;
    if (root) clearSourceGeometryRoot(root);
    if (contextRef.current) {
      contextRef.current.sourceGeometry = null;
      contextRef.current.defaultSourceCamera = true;
      contextRef.current.sourceCameraFitFingerprint = "";
    }
    refreshSourceViewRef.current();
  }, [morphologyFidelityMode, morphologyTargetActive, observedCellFormId, sourceSceneEpoch, clearInspection]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    const record = morphologyFidelityRecords.find((candidate) => candidate.neuronId === observedCellFormId);
    const sourceLoadEpoch = morphologyLoadEpochRef.current;
    clearSourceGeometryRoot(context.observedCellRoot);
    if (!morphologyTargetActive) {
      queueMicrotask(() => {
        setObservedCellStatus("unavailable");
        publishMorphologyRuntime({
          requestedNeuronId: 0,
          requestedMode: "observed_swc",
          actualMode: null,
          assetId: null,
          geometrySha256: null,
          verificationStatus: "unavailable",
          sceneObjectStatus: "not_rendered",
          visible: false,
          algorithmId: null,
          reason: "no_admitted_morphology_target",
        });
      });
      context.renderer.domElement.dataset.observedCellFormStatus = "unavailable-no-admitted-morphology-target";
      return;
    }
    if (!record) {
      queueMicrotask(() => {
        setObservedCellStatus("unavailable");
        publishMorphologyRuntime({
          requestedNeuronId: observedCellFormId,
          requestedMode: morphologyFidelityMode,
          actualMode: null,
          assetId: null,
          geometrySha256: null,
          verificationStatus: "unavailable",
          sceneObjectStatus: "not_rendered",
          visible: false,
          algorithmId: null,
          reason: "record_not_admitted",
        });
      });
      context.renderer.domElement.dataset.observedCellFormStatus = "unavailable-record-not-admitted";
      return;
    }
    if (morphologyFidelityMode === "radius_surface" && !record.modes.radiusSurface.available) {
      queueMicrotask(() => {
        setObservedCellStatus("unavailable");
        publishMorphologyRuntime({
          requestedNeuronId: observedCellFormId,
          requestedMode: morphologyFidelityMode,
          actualMode: null,
          assetId: record.assetId,
          geometrySha256: record.geometry.sha256,
          verificationStatus: "unavailable",
          sceneObjectStatus: "not_rendered",
          visible: false,
          algorithmId: null,
          reason: record.geometry.dimensionality === "2D" ? "source_geometry_is_2d_no_3d_surface_authorized" : "official_attributes_report_no_diameter",
        });
      });
      context.renderer.domElement.dataset.observedCellFormStatus = "unavailable-radius-not-source-authorized";
      return;
    }

    queueMicrotask(() => {
      setObservedCellStatus("loading");
      publishMorphologyRuntime({
        requestedNeuronId: observedCellFormId,
        requestedMode: morphologyFidelityMode,
        actualMode: null,
        assetId: record.assetId,
        geometrySha256: record.geometry.sha256,
        verificationStatus: "loading",
        sceneObjectStatus: "not_rendered",
        visible: false,
        algorithmId: null,
        reason: "checksum_verification_pending",
      });
    });
    context.renderer.domElement.dataset.observedCellFormStatus = "loading-checksum-verification";
    const controller = new AbortController();
    readVerifiedMainSceneMorphology(record, { signal: controller.signal, forceReload: Boolean(pendingRestoreRef.current) })
      .then((geometry) => {
        if (controller.signal.aborted || context.failed || contextRef.current !== context || sourceLoadEpoch !== morphologyLoadEpochRef.current) return;
        const verifiedSource = mainSceneMorphologyVerification(record, geometry);
        context.sourceGeometry = geometry; validationGeometryRef.current = geometry;
        assertSourceLocalMorphologyGeometry(geometry, record);
        const object = createSourceLocalMorphologyObject(geometry, record, morphologyFidelityMode);
        const route = observedMorphologyRouteByNeuronId.get(record.neuronId) ?? null;
        context.observedCellRoot.add(object);
        const inspection = attachSwcNeuriteInspection({ geometry, scene: context.scene, camera: context.camera, controls: context.controls,
          canvas: context.renderer.domElement, contextRoot: object, sourceTransformRoot: context.observedCellRoot,
          selectionColors: { pathColor: 0xa46700, descendantsColor: 0x08785e, markerColor: 0x173f33 },
          sourceRadiusAvailable: geometry.swc.sourceDiameterAvailable, isTwoDimensional: geometry.swc.dimensionality === "2D",
          onSelection: (selection: NeuriteInspectionSelection | null) => {
            if (contextRef.current !== context || context.sourceGeometry !== geometry) return;
            setInspectionSelection(selection); refreshSourceViewRef.current();
          }, onCameraChange: () => {
            context.defaultSourceCamera = false; refreshSourceViewRef.current();
          } });
        context.inspection = inspection; inspectionRef.current = inspection;
        if (!pendingRestoreRef.current) setInspectionScene({ geometry, mode: morphologyFidelityMode, epoch: sourceSceneEpoch });
        context.observedCellRoot.userData = {
          ...context.observedCellRoot.userData,
          assetId: record.assetId,
          repository: route?.sourceRecord.repository ?? morphologyFidelityContract.sourceObjects.repository,
          repositoryRelease: route?.sourceRecord.repositoryRelease ?? morphologyFidelityContract.sourceObjects.repositoryRelease,
          sourceAuthority: route?.sourceAuthority ?? "NEUROMORPHO_RELEASE_8_6_124_CENSUS_CHILD",
          censusMembership: route?.censusMembership ?? true,
          censusIndexSha256: route && !route.censusMembership
            ? null
            : morphologyFidelityContract.sourceObjects.censusIndex.sha256,
          geometrySha256: record.geometry.sha256,
          rawSwcSha256: record.geometry.rawSwcSha256,
          representation: object.userData.representation,
          algorithmId: object.userData.algorithmId,
          sourceDiameterAvailable: record.geometry.sourceDiameterAvailable,
          internalStructureStatus: "UNAVAILABLE_FOR_SAME_SPECIMEN",
          activeMainSceneRecordCount: morphologyFidelityRecords.length,
          frozenCensusRecordCount: 142,
          routeId: route?.routeId ?? "legacy_observed_cell_form_exemplar",
          routeContractId: route?.contractId ?? observedCellFormLens.releaseId,
          routeReleaseId: route?.releaseId ?? observedCellFormLens.releaseId,
          routeWarningCount: route?.warnings.length ?? 0,
          sourceGeometryVerification: verifiedSource.geometryVerification,
          sourceContext: verifiedSource.sourceContext,
        };
        setObservedCellStatus("loaded");
        publishMorphologyRuntime({
          requestedNeuronId: observedCellFormId,
          requestedMode: morphologyFidelityMode,
          actualMode: morphologyFidelityMode,
          assetId: record.assetId,
          geometrySha256: record.geometry.sha256,
          verificationStatus: "verified",
          sceneObjectStatus: "rendered",
          visible: context.observedCellRoot.visible,
          algorithmId: morphologyFidelityMode === "radius_surface" ? RADIUS_SURFACE_ALGORITHM_ID : null,
          reason: context.observedCellRoot.visible ? null : "morphology_layer_hidden",
          sourceGeometryVerification: verifiedSource.geometryVerification,
          sourceContext: verifiedSource.sourceContext,
        });
        context.renderer.domElement.dataset.observedCellFormStatus = morphologyFidelityMode === "radius_surface"
          ? "loaded-verified-obs-input-derived-radius-surface-unregistered"
          : record.geometry.dimensionality === "2D"
            ? "loaded-verified-obs-2d-source-plane-unregistered"
            : "loaded-verified-obs-swc-centerlines-unregistered";
        context.renderer.domElement.setAttribute(
          "aria-label",
          morphologyFidelityMode === "radius_surface"
            ? `Interactive 3D scene with NeuroMorpho ${record.neuronId}. Its checksum-verified source-local SWC coordinates, topology and radii are observed inputs. Visible thickness is a deterministic tapered-frustum derivative, not an observed membrane or internal structure. It is unregistered and unrelated to the selected evidence entity.`
            : record.geometry.dimensionality === "2D"
              ? `Interactive 3D canvas showing NeuroMorpho ${record.neuronId} as a checksum-verified planar 2D source trace. It is not a reconstructed 3D cell. Stroke width is a viewer aid, and the trace is unregistered and unrelated to the selected evidence entity.`
              : `Interactive 3D scene with NeuroMorpho ${record.neuronId} rendered as checksum-verified source-local SWC centerlines. Stroke width is a viewer aid, not anatomical caliber. It is unregistered and unrelated to the selected evidence entity.`,
        );
        fitSourceCamera();
      })
      .catch((error: Error) => {
        if (controller.signal.aborted || sourceLoadEpoch !== morphologyLoadEpochRef.current || error.name === "AbortError") return;
        failSourceRestoreRef.current(error);
        clearInspection();
        context.sourceGeometry = null;
        context.observedCellRoot.children.forEach((child) => disposeObject(child));
        context.observedCellRoot.clear();
        context.observedCellRoot.userData = {};
        setObservedCellStatus("unavailable");
        publishMorphologyRuntime({
          requestedNeuronId: observedCellFormId,
          requestedMode: morphologyFidelityMode,
          actualMode: null,
          assetId: record.assetId,
          geometrySha256: record.geometry.sha256,
          verificationStatus: "failed",
          sceneObjectStatus: "not_rendered",
          visible: false,
          algorithmId: null,
          reason: error.message,
        });
        context.renderer.domElement.dataset.observedCellFormStatus = "unavailable-no-fallback";
      });
    return () => controller.abort();
  }, [morphologyFidelityMode, morphologyTargetActive, observedCellFormId, publishMorphologyRuntime, sourceSceneEpoch, clearInspection, fitSourceCamera]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    const root = context.nmo45718DatSwcCrosswalkRoot;
    root.children.forEach((child) => disposeObject(child));
    root.clear();
    root.visible = false;
    for (const key of ["nativeContours", "standardizedGeometry"] as const) context.auxiliaryAssets.delete(publicAssetPath(NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[key].path));
    const requested = showNmo45718DatSwcCrosswalk
      && morphologyTargetActive
      && showObservedCellForm
      && observedCellFormId === 45718
      && view === "cell_detail";
    if (!requested) {
      context.renderer.domElement.dataset.nmo45718DatSwcCrosswalkStatus = "idle";
      onNmo45718DatSwcCrosswalkRuntime({ status: "idle", message: "" });
      return;
    }

    const record = morphologyFidelityRecords.find((candidate) => candidate.neuronId === 45718);
    if (!record
      || record.geometry.bytes !== NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.standardizedGeometry.bytes
      || record.geometry.sha256 !== NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.standardizedGeometry.sha256) {
      context.renderer.domElement.dataset.nmo45718DatSwcCrosswalkStatus = "unavailable-no-fallback";
      onNmo45718DatSwcCrosswalkRuntime({
        status: "unavailable",
        message: "The selected NMO 45718 SWC does not match the crosswalk's pinned geometry receipt; DAT traces were withheld.",
      });
      return;
    }

    const controller = new AbortController();
    let active = true;
    context.renderer.domElement.dataset.nmo45718DatSwcCrosswalkStatus = "loading-receipt-verification";
    onNmo45718DatSwcCrosswalkRuntime({
      status: "loading",
      message: "Verifying the exact NMO 45718 contour and standardized SWC files…",
    });
    Promise.all([
      loadVerifiedNmo45718CrosswalkJson("nativeContours", controller.signal, context),
      loadVerifiedNmo45718CrosswalkJson("standardizedGeometry", controller.signal, context),
    ])
      .then(([contours, geometryPayload]) => {
        if (!active || controller.signal.aborted || context.failed || contextRef.current !== context) return;
        const geometry = geometryPayload as SourceLocalMorphologyGeometry;
        assertSourceLocalMorphologyGeometry(geometry, record);
        const crosswalk = validateNmo45718DatSwcCrosswalk(
          nmo45718DatSwcCrosswalkContractJson,
          contours,
          geometry,
        ) as Nmo45718DatSwcCrosswalk;
        if (crosswalk.boundaries.atlasRegistrationCount !== 0
          || crosswalk.boundaries.surfaceCount !== 0
          || crosswalk.boundaries.volumeCount !== 0
          || crosswalk.boundaries.internalStructureObjectCount !== 0
          || crosswalk.boundaries.sameCellInternalStructureClaim
          || crosswalk.boundaries.cellBodyContourJoined) {
          throw new Error("NMO 45718 crosswalk exceeded its admitted source-local contour boundary");
        }
        const object = createNmo45718DatSwcCrosswalkObject(crosswalk, geometry);
        root.add(object);
        root.visible = true;
        fitSourceCamera(true);
        context.renderer.domElement.dataset.nmo45718DatSwcCrosswalkStatus = "loaded-verified-seven-source-contours-display-screen-only";
        onNmo45718DatSwcCrosswalkRuntime({
          status: "verified",
          message: `Verified · ${crosswalk.somaContours.length} DAT source contours / ${crosswalk.correspondence.sourceVertexCount} vertices in the same-record SWC-local frame. Project-derived display-consistency screen only · 0 REG · no surface, volume, measurement or internal objects.`,
        });
      })
      .catch((error: Error) => {
        if (!active || controller.signal.aborted || error.name === "AbortError") return;
        failSourceRestoreRef.current(error);
        for (const key of ["nativeContours", "standardizedGeometry"] as const) context.auxiliaryAssets.delete(publicAssetPath(NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[key].path));
        root.children.forEach((child) => disposeObject(child));
        root.clear();
        root.visible = false;
        context.renderer.domElement.dataset.nmo45718DatSwcCrosswalkStatus = "unavailable-no-fallback";
        onNmo45718DatSwcCrosswalkRuntime({
          status: "unavailable",
          message: `${error.message}. DAT traces were withheld.`,
        });
      });
    return () => {
      active = false;
      controller.abort();
      root.children.forEach((child) => disposeObject(child));
      root.clear();
      root.visible = false;
    };
  }, [
    morphologyTargetActive,
    observedCellFormId,
    onNmo45718DatSwcCrosswalkRuntime,
    showNmo45718DatSwcCrosswalk,
    showObservedCellForm,
    view,
    sourceSceneEpoch,
    fitSourceCamera,
  ]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    const internalReferenceActive = view === "internal_reference";
    const micronsReferenceActive = view === "microns_observed_reference";
    const crossRegionReferenceActive = internalReferenceActive || micronsReferenceActive;
    const cellDetailActive = view === "cell_detail";
    context.scaffold.visible = showScaffold && !crossRegionReferenceActive && !cellDetailActive;
    context.grayMatter.visible = showGrayMatter && !crossRegionReferenceActive && !cellDetailActive;
    context.internalCompartments.visible = showGrayMatter && !crossRegionReferenceActive && !cellDetailActive;
    context.entityRoot.visible = showEntities && !crossRegionReferenceActive && !cellDetailActive;
    context.syntheticLaneGuide.visible = showEntities && !crossRegionReferenceActive && !cellDetailActive;
    context.observedCellRoot.visible = showObservedCellForm && !crossRegionReferenceActive;
    const nmo45718DatSwcCrosswalkVisible = showNmo45718DatSwcCrosswalk
      && morphologyTargetActive
      && showObservedCellForm
      && observedCellFormId === 45718
      && cellDetailActive
      && !crossRegionReferenceActive;
    context.nmo45718DatSwcCrosswalkRoot.visible = nmo45718DatSwcCrosswalkVisible;
    context.observedCellLaneGuide.visible = showObservedCellForm && !crossRegionReferenceActive;
    context.micronsReferenceRoot.visible = micronsReferenceActive;
    context.micronsCellRoot.visible = micronsReferenceActive && showMicronsCellSurface;
    context.micronsNucleusRoot.visible = micronsReferenceActive && showMicronsNucleus;
    const micronsReceipt = micronsRuntimeReceiptRef.current;
    const micronsRendered = micronsReceipt.verificationStatus === "verified"
      && micronsReceipt.sceneObjectStatus === "rendered";
    if (
      micronsReceipt.requested !== micronsReferenceActive
      || micronsReceipt.cellSurfaceVisible !== (micronsRendered && micronsReferenceActive && showMicronsCellSurface)
      || micronsReceipt.nucleusVisible !== (micronsRendered && micronsReferenceActive && showMicronsNucleus)
    ) {
      publishMicronsRuntime({
        ...micronsReceipt,
        requested: micronsReferenceActive,
        cellSurfaceVisible: micronsRendered && micronsReferenceActive && showMicronsCellSurface,
        nucleusVisible: micronsRendered && micronsReferenceActive && showMicronsNucleus,
        reason: micronsRendered
          ? micronsReferenceActive
            ? null
            : "reference_mode_not_requested"
          : micronsReceipt.reason,
      });
    }
    context.internalReferenceRoot.visible = internalReferenceActive;
    const runtimeReceipt = runtimeReceiptRef.current;
    if (
      runtimeReceipt.requestedNeuronId === observedCellFormId
      && runtimeReceipt.requestedMode === morphologyFidelityMode
      && runtimeReceipt.verificationStatus === "verified"
      && runtimeReceipt.sceneObjectStatus === "rendered"
      && runtimeReceipt.visible !== (showObservedCellForm && !crossRegionReferenceActive)
    ) {
      publishMorphologyRuntime({
        ...runtimeReceipt,
        visible: showObservedCellForm && !crossRegionReferenceActive,
        reason: showObservedCellForm && !crossRegionReferenceActive ? null : crossRegionReferenceActive ? "cross_region_reference_mode_active" : "morphology_layer_hidden",
      });
    }
    context.slicePlane.visible = showEntities && !crossRegionReferenceActive && !cellDetailActive;
    context.slicePlane.position.z = sliceZ;
    const visible = new Set(visibleIds);
    context.entityGroups.forEach((group, id) => {
      group.visible = visible.has(id);
      group.scale.setScalar(id === selectedId ? 1.12 : 1);
      const halo = group.getObjectByName("selection-halo");
      if (halo) halo.visible = id === selectedId;
    });
    context.renderer.domElement.dataset.sceneMode = internalReferenceActive
      ? "cross-region-internal-reference-unavailable-zero-primitives"
      : micronsReferenceActive
        ? "cross-region-microns-observed-cell-nucleus-reference"
        : view;
    context.renderer.domElement.setAttribute(
      "aria-label",
      internalReferenceActive
        ? `Cross-region object-level internal-geometry audit. Five compartment classes are grounded only as vocabulary by public mouse EM sources. No exact source object is admitted to this route, so it contains zero object-level geometry primitives, zero source-derived geometry objects, zero registrations, no measurements, and no same-cell relationship to the selected population or NeuroMorpho morphology. Missing cell, nucleus, organelle, neurite and synapse geometry is not replaced by procedural shapes.`
        : micronsReferenceActive
          ? `Cross-region observed MICrONS visual-cortex reference. The exact v185.4 cell segmentation surface for root ${micronsObservedCellNucleusReference.identityChain.cellRootId} and its source-linked nucleus ${micronsObservedCellNucleusReference.identityChain.somaValenceTable.nucleusId} are checksum gated. Source-native cell-shell clipping is ${micronsClipping.enabled ? `enabled on ${micronsClipping.axis.toUpperCase()} at ${micronsClipping.positionNanometre} nanometres, retaining the ${micronsClipping.keepSide} side` : "disabled"}; the nucleus is never clipped and the shader creates no cap or geometry. The outer surface is a segmentation boundary, not a measured membrane. Cell and nucleus are the same source-linked physical cell; all relationships to spinal anatomy, NeuroMorpho and interneuron types are co-display only with zero joins and zero registrations. Mitochondria, synapses and other organelles are absent.`
        : cellDetailActive
          ? `Focused source-local NeuroMorpho ${observedCellFormId} cell-detail view. The atlas anatomy, synthetic population nodes and schematic paths are hidden to prevent a visual relationship claim. The morphology remains checksum-gated, unregistered and independent from the selected evidence entity. ${nmo45718DatSwcCrosswalkVisible ? "Seven source-native 2D DAT Soma 1 contour traces are checksum-gated and project-mapped to this same record's standardized SWC frame for display-consistency inspection only; they are not a surface or volume." : ""} Same-specimen internal structure is unavailable; measurement is forbidden and registration count is zero.`
        : `Interactive 3D mouse spinal-cord research scene. Reference anatomy ${showScaffold || showGrayMatter ? "is shown as inferred geometry" : "is hidden"}; non-cell evidence nodes ${showEntities ? "are shown in a separate synthetic lane" : "are hidden"}; the checksum-gated source-local NeuroMorpho morphology ${showObservedCellForm ? "is requested in its independent lane" : "is hidden"}. No lane has an admitted identity or coordinate relationship to another. Measurement is forbidden and registration count is zero.`,
    );
    fitSourceCamera(true);
  }, [
    selectedId,
    showEntities,
    showGrayMatter,
    showMicronsCellSurface,
    showMicronsNucleus,
    showNmo45718DatSwcCrosswalk,
    showObservedCellForm,
    showScaffold,
    sliceZ,
    view,
    visibleIds,
    morphologyFidelityMode,
    morphologyTargetActive,
    micronsClipping,
    observedCellFormId,
    onNmo45718DatSwcCrosswalkRuntime,
    publishMicronsRuntime,
    publishMorphologyRuntime,
    sourceSceneEpoch,
    fitSourceCamera,
  ]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    const { camera, controls } = context;
    const previousView = context.lastCameraView;
    context.lastCameraView = view;
    if (pendingRestoreRef.current) return;
    if (view === "cell_detail") {
      if (previousView === view) return;
      context.defaultSourceCamera = true;
      context.sourceCameraFitFingerprint = "";
      fitSourceCamera();
      return;
    }
    const target = view === "transverse"
      ? new THREE.Vector3(COMBINED_SCENE_TARGET_X, 0, sliceZ)
      : new THREE.Vector3(COMBINED_SCENE_TARGET_X, 0, 0);
    const positions: Record<CameraView, [number, number, number]> = {
      home: [13, 8, 27],
      cell_detail: [OBSERVED_CELL_FORM_LANE_X, 2.2, 9.6],
      microns_observed_reference: [10.8, 6.8, 14.8],
      internal_reference: [8.8, 5.6, 12.8],
      dorsal: [COMBINED_SCENE_TARGET_X, 68, 0.01],
      right: [68, 0, 0],
      transverse: [COMBINED_SCENE_TARGET_X, 0, sliceZ + 17],
    };
    camera.position.set(...positions[view]);
    camera.up.set(view === "dorsal" ? 0 : 0, view === "dorsal" ? 0 : 1, view === "dorsal" ? 1 : 0);
    controls.target.copy(target);
    controls.update();
  }, [sliceZ, view, sourceSceneEpoch, fitSourceCamera]);

  const crossRegionReferenceViewActive = view === "internal_reference" || view === "microns_observed_reference";
  const inspectedGeometry = observedCellStatus === "loaded" && morphologyTargetActive && showObservedCellForm && !crossRegionReferenceViewActive
    && inspectionScene?.geometry.neuronId === observedCellFormId && inspectionScene.mode === morphologyFidelityMode && inspectionScene.epoch === sourceSceneEpoch
    ? inspectionScene.geometry : null;
  const inspectedLandmarks = inspectedGeometry ? extractObservedTopologyLandmarks(inspectedGeometry) : null;

  return (
    <><div className="three-canvas" ref={containerRef} data-testid="three-canvas" data-morphology-fidelity-mode={morphologyFidelityMode}>
      {view === "cell_detail" && (
        <button className="main-source-camera-fit" type="button" disabled={!inspectedGeometry}
          onClick={() => fitSourceCamera(true, true)}>Fit whole source</button>
      )}
      {!crossRegionReferenceViewActive && view !== "cell_detail" && (
        <p className={`reference-load-status ${referenceStatus}`} role="status">
          {referenceStatus === "loading" && "Loading pinned Allen reference anatomy…"}
          {referenceStatus === "loaded" && "Reference anatomy loaded · 38 source planes · 7 major source IDs · exact plane-local contours · all 32 source states represented · INF · 0 REG"}
          {referenceStatus === "unavailable" && "Reference anatomy unavailable · no anatomical fallback shown"}
        </p>
      )}
      {!crossRegionReferenceViewActive && (
        <p className={`observed-cell-load-status ${observedCellStatus}`} role="status">
          {observedCellStatus === "loading" && `Verifying exact NeuroMorpho ${observedCellFormId} geometry bytes…`}
          {observedCellStatus === "loaded" && (morphologyFidelityMode === "radius_surface"
            ? `NeuroMorpho ${observedCellFormId} · checksum verified · OBS SWC input + radius-derived open surface · 0 REG`
            : selectedFidelityRecord?.geometry.dimensionality === "2D"
              ? `NeuroMorpho ${observedCellFormId} · checksum verified · planar 2D source trace · not a 3D reconstruction · 0 REG`
            : `NeuroMorpho ${observedCellFormId} · checksum verified · OBS SWC centerlines · 0 REG`)}
          {observedCellStatus === "unavailable" && (!morphologyTargetActive
            ? "No admitted main-scene morphology target · prior geometry cleared · no fallback substituted"
            : selectedFidelityRecord && !selectedFidelityRecord.modes.radiusSurface.available && morphologyFidelityMode === "radius_surface"
            ? selectedFidelityRecord.geometry.dimensionality === "2D"
              ? "Radius-derived surface unavailable · source-labelled 2D trace · no inferred thickness rendered"
              : "Radius-derived surface unavailable · official source reports No Diameter · no substitute thickness rendered"
            : "Source-local cell form unavailable · no morphology fallback substituted")}
        </p>
      )}
      {observedCellStatus === "loaded" && showObservedCellForm && !crossRegionReferenceViewActive && (
        <div className="observed-cell-type-legend" aria-label="Observed SWC source-type color key">
          <strong>{morphologyFidelityMode === "radius_surface" ? "OBS INPUT · DERIVED SURFACE" : "OBS SWC SOURCE TYPES"}</strong>
          <span><i style={{ backgroundColor: "#f5d06f" }} />Type-1 soma samples</span>
          <span><i style={{ backgroundColor: "#2895d3" }} />Axon when reported</span>
          <span><i style={{ backgroundColor: "#d87335" }} />Dendrite</span>
          <small>{morphologyFidelityMode === "radius_surface"
            ? "Exact endpoint radii · 6-sided open frusta · not membrane"
            : "Observed topology · constant-width strokes are viewer aids"}</small>
        </div>
      )}
      {referenceStatus === "loaded" && !crossRegionReferenceViewActive && view !== "cell_detail" && (
        <div className="internal-structure-legend" aria-label="Atlas internal structure color key">
          <strong>EXACT SAMPLED-PLANE EDGES · INF</strong>
          <ul>
            {INTERNAL_STRUCTURE_LEGEND.map((structure) => (
              <li key={structure.identifier}>
                <i style={{ backgroundColor: structure.color }} />
                <span>{structure.abbreviation} · {structure.name}</span>
                <em>ID {structure.identifier}</em>
              </li>
            ))}
          </ul>
          <small>No cross-plane joins · display colors only</small>
        </div>
      )}
      {view === "internal_reference" && (
        <div className="cross-region-internal-legend" role="note" aria-label="Cross-region internal reference authority and component key">
          <span>UNAVAILABLE OBJECT GEOMETRY / CROSS-REGION REFERENCE</span>
          <strong>Source-grounded vocabulary · zero 3D proxies</strong>
          <p>Mouse EM sources ground the compartment names, but no exact object is admitted here. Every listed layer remains unrendered.</p>
          <ul>
            {crossRegionInternalReference.components.map((component) => (
              <li key={component.id}>
                <span>{component.label} · UNAVAILABLE</span>
              </li>
            ))}
          </ul>
          <small>0 rendered primitives · 0 source meshes · 0 joins · 0 REG · measurement forbidden</small>
        </div>
      )}
      {view === "microns_observed_reference" && (
        <>
          <p className={`microns-reference-load-status ${micronsReferenceStatus}`} role="status">
            {(micronsReferenceStatus === "idle" || micronsReferenceStatus === "loading") && "Verifying exact MICrONS cell, nucleus, manifest and four browser-geometry byte streams…"}
            {micronsReferenceStatus === "loaded" && `MICrONS v185.4 verified · ${micronsObservedCellNucleusReference.components[0].vertexCount.toLocaleString()} cell vertices · ${micronsObservedCellNucleusReference.components[1].vertexCount.toLocaleString()} nucleus vertices · OBS EM · 0 project REG`}
            {micronsReferenceStatus === "unavailable" && "MICrONS exact geometry unavailable or receipt verification failed · no geometric fallback shown"}
          </p>
          <div className="microns-observed-reference-legend" role="note" aria-label="MICrONS observed cross-region reference authority and component key">
            <span>OBS EM / CROSS-REGION REFERENCE</span>
            <strong>Exact cell boundary segmentation + linked nucleus</strong>
            <p>Visual cortex L2/3 · root {micronsObservedCellNucleusReference.identityChain.cellRootId} · nucleus {micronsObservedCellNucleusReference.identityChain.somaValenceTable.nucleusId}</p>
            <p>{micronsClipping.enabled
              ? `Cell shell clipped on source ${micronsClipping.axis.toUpperCase()} = ${micronsClipping.positionNanometre.toLocaleString()} nm · keep ${micronsClipping.keepSide} · nucleus intact`
              : "Source-native cell-shell clipping off · complete admitted fragments displayed"}</p>
            <ul>
              <li className={showMicronsCellSurface ? "visible" : "hidden"}><i style={{ backgroundColor: "#4c9b92" }} /><span>Cell segmentation surface</span><em>{showMicronsCellSurface ? "shown" : "hidden"}</em></li>
              <li className={showMicronsNucleus ? "visible" : "hidden"}><i style={{ backgroundColor: "#e1a24a" }} /><span>Linked nucleus segmentation</span><em>{showMicronsNucleus ? "shown" : "hidden"}</em></li>
            </ul>
            <small>Same source-linked cell · uncapped shader cut only · 0 generated geometry · not membrane · no added organelles or synapses · spinal relationship co-display only · 0 joins · 0 REG</small>
          </div>
        </>
      )}
    </div>
    {inspectionHost && inspectedGeometry && inspectedLandmarks && createPortal(<div className="main-scene-neurite-inspector" role="region" aria-label={`Main-scene SWC branch inspection for NeuroMorpho ${observedCellFormId}`}>
      <MorphologyNeuriteInspector key={`${observedCellFormId}:${morphologyFidelityMode}:${sourceSceneEpoch}`} controllerRef={inspectionRef}
        selection={inspectionSelection} geometry={inspectedGeometry} branchpointCount={inspectedLandmarks.branchpoints.length} terminalCount={inspectedLandmarks.terminals.length} />
    </div>, inspectionHost)}</>
  );
}
