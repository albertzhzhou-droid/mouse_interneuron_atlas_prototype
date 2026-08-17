"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { AtlasEntity } from "./atlas-types";
import { TRANSMITTER_COLORS } from "./atlas-types";

export type CameraView = "home" | "dorsal" | "right" | "transverse";

type Props = {
  entities: AtlasEntity[];
  visibleIds: string[];
  selectedId: string;
  view: CameraView;
  sliceZ: number;
  showScaffold: boolean;
  showGrayMatter: boolean;
  showEntities: boolean;
  onSelect: (id: string) => void;
  onWebGLStatus: (available: boolean) => void;
};

type SceneContext = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  scaffold: THREE.Group;
  grayMatter: THREE.Group;
  entityRoot: THREE.Group;
  entityGroups: Map<string, THREE.Group>;
  slicePlane: THREE.Mesh;
};

const CORD_MIN_Z = -20;
const CORD_MAX_Z = 20;

function gaussian(z: number, center: number, spread: number) {
  return Math.exp(-0.5 * ((z - center) / spread) ** 2);
}

function cordRadii(z: number) {
  const taper = z < -16 ? THREE.MathUtils.lerp(1, 0.75, (-z - 16) / 4) : 1;
  return {
    rx: (1.55 + 0.28 * gaussian(z, 13, 4) + 0.38 * gaussian(z, -11, 3.8)) * taper,
    ry: (1.2 + 0.16 * gaussian(z, 13, 4) + 0.24 * gaussian(z, -11, 3.8)) * taper,
  };
}

function createCordSurface() {
  const longitudinalSegments = 64;
  const radialSegments = 32;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let zi = 0; zi <= longitudinalSegments; zi += 1) {
    const z = THREE.MathUtils.lerp(CORD_MIN_Z, CORD_MAX_Z, zi / longitudinalSegments);
    const { rx, ry } = cordRadii(z);
    for (let ri = 0; ri <= radialSegments; ri += 1) {
      const theta = (ri / radialSegments) * Math.PI * 2;
      const x = rx * Math.cos(theta);
      let y = ry * Math.sin(theta);
      if (y > 0) y -= 0.1 * Math.exp(-Math.pow(x / 0.22, 2));
      positions.push(x, y, z);
    }
  }

  const row = radialSegments + 1;
  for (let zi = 0; zi < longitudinalSegments; zi += 1) {
    for (let ri = 0; ri < radialSegments; ri += 1) {
      const a = zi * row + ri;
      const b = a + row;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createScaffold() {
  const group = new THREE.Group();
  group.name = "synthetic-scaffold";

  const surface = new THREE.Mesh(
    createCordSurface(),
    new THREE.MeshPhysicalMaterial({
      color: 0xa8b3bd,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
      roughness: 0.78,
      side: THREE.DoubleSide,
    }),
  );
  group.add(surface);

  const guideMaterial = new THREE.LineBasicMaterial({ color: 0x61736d, transparent: true, opacity: 0.24 });
  for (let spoke = 0; spoke < 12; spoke += 1) {
    const theta = (spoke / 12) * Math.PI * 2;
    const points: THREE.Vector3[] = [];
    for (let step = 0; step <= 48; step += 1) {
      const z = THREE.MathUtils.lerp(CORD_MIN_Z, CORD_MAX_Z, step / 48);
      const { rx, ry } = cordRadii(z);
      points.push(new THREE.Vector3(rx * Math.cos(theta), ry * Math.sin(theta), z));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), guideMaterial.clone()));
  }

  for (const z of [-16, -12, -8, -4, 0, 4, 8, 12, 16]) {
    const { rx, ry } = cordRadii(z);
    const ringPoints = Array.from({ length: 65 }, (_, index) => {
      const angle = (index / 64) * Math.PI * 2;
      return new THREE.Vector3(rx * Math.cos(angle), ry * Math.sin(angle), z);
    });
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPoints), guideMaterial.clone()));
  }

  const canal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, CORD_MAX_Z - CORD_MIN_Z, 10),
    new THREE.MeshBasicMaterial({ color: 0x39434c, transparent: true, opacity: 0.52 }),
  );
  canal.rotation.x = Math.PI / 2;
  group.add(canal);
  return group;
}

const LEFT_WING = [
  [-0.12, 0.05], [-0.3, 0.22], [-0.38, 0.75], [-0.65, 0.92],
  [-0.78, 0.7], [-0.55, 0.28], [-0.72, -0.4], [-0.65, -0.78],
  [-0.38, -0.68], [-0.25, -0.18], [-0.12, -0.05],
] as const;

function createGrayMatter() {
  const root = new THREE.Group();
  const makeWing = (mirror: number, z: number) => {
    const shape = new THREE.Shape();
    LEFT_WING.forEach(([x, y], index) => {
      const px = x * mirror;
      if (index === 0) shape.moveTo(px, y);
      else shape.lineTo(px, y);
    });
    shape.closePath();
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: 0x715a91,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    mesh.position.z = z;
    return mesh;
  };
  for (const z of [-16, -12, -8, -4, 0, 4, 8, 12, 16]) {
    root.add(makeWing(1, z), makeWing(-1, z));
  }
  return root;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createDendrites(entity: AtlasEntity) {
  const random = mulberry32(entity.geometry.seed);
  const [sx, sy, sz] = entity.geometry.schematicPosition;
  const vertices: number[] = [];
  for (let branch = 0; branch < 6; branch += 1) {
    let x = sx;
    let y = sy;
    let z = sz;
    const angle = (branch / 6) * Math.PI * 2 + (random() - 0.5) * 0.5;
    for (let segment = 0; segment < 3; segment += 1) {
      const length = 0.18 + random() * 0.22;
      const nextX = x + Math.cos(angle + (random() - 0.5) * 0.45) * length;
      const nextY = y + Math.sin(angle + (random() - 0.5) * 0.45) * length;
      const nextZ = z + (random() - 0.5) * 0.26;
      vertices.push(x, y, z, nextX, nextY, nextZ);
      x = nextX;
      y = nextY;
      z = nextZ;
    }
  }
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
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
  line.userData.entityId = entity.id;
  return line;
}

function createEntityObject(entity: AtlasEntity) {
  const group = new THREE.Group();
  group.name = entity.id;
  group.userData.entityId = entity.id;
  const color = TRANSMITTER_COLORS[entity.transmitter];
  const position = new THREE.Vector3(...entity.geometry.schematicPosition);

  if (entity.entityKind === "injury_state_overlay") {
    const overlay = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 16, 10),
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.62 }),
    );
    overlay.scale.set(1, 0.78, 2.1);
    overlay.position.copy(position);
    overlay.userData.entityId = entity.id;
    group.add(overlay);
  } else {
    const soma = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12),
      new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.04 }),
    );
    soma.position.copy(position);
    soma.userData.entityId = entity.id;
    group.add(soma);

    const dendrites = new THREE.LineSegments(
      createDendrites(entity),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.82 }),
    );
    dendrites.userData.entityId = entity.id;
    group.add(dendrites);
  }

  group.add(createPath(entity, color));
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xf3b33e, transparent: true, opacity: 0.28, wireframe: true }),
  );
  halo.name = "selection-halo";
  halo.position.copy(position);
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

export default function SceneCanvas({
  entities,
  visibleIds,
  selectedId,
  view,
  sliceZ,
  showScaffold,
  showGrayMatter,
  showEntities,
  onSelect,
  onWebGLStatus,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<SceneContext | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const probe = document.createElement("canvas");
    const hasWebGL2 = Boolean(probe.getContext("webgl2"));
    onWebGLStatus(hasWebGL2);
    if (!hasWebGL2) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe7ece9);
    scene.fog = new THREE.Fog(0xe7ece9, 38, 90);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 250);
    camera.position.set(11, 8, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive synthetic 3D mouse spinal cord scaffold. Use the adjacent accessible list to inspect evidence.",
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 100;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x243047, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(8, 12, 10);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9bbcff, 0.55);
    fill.position.set(-6, -3, -8);
    scene.add(fill);

    const scaffold = createScaffold();
    const grayMatter = createGrayMatter();
    const entityRoot = new THREE.Group();
    const entityGroups = new Map<string, THREE.Group>();
    entities.forEach((entity) => {
      const object = createEntityObject(entity);
      entityGroups.set(entity.id, object);
      entityRoot.add(object);
    });
    scene.add(scaffold, grayMatter, entityRoot);

    const slicePlane = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 64),
      new THREE.MeshBasicMaterial({ color: 0x0e7c66, transparent: true, opacity: 0.11, side: THREE.DoubleSide, depthWrite: false }),
    );
    slicePlane.position.z = 0;
    scene.add(slicePlane);

    contextRef.current = { camera, controls, scaffold, grayMatter, entityRoot, entityGroups, slicePlane };

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.16;
    const pointer = new THREE.Vector2();
    const handlePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(entityRoot.children, true);
      const hit = hits.find((candidate) => candidate.object.userData.entityId);
      if (hit?.object.userData.entityId) onSelectRef.current(hit.object.userData.entityId as string);
    };
    renderer.domElement.addEventListener("pointerdown", handlePointer);

    const resize = () => {
      const width = Math.max(320, container.clientWidth);
      const height = Math.max(420, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame = 0;
    const renderFrame = () => {
      if (!document.hidden) {
        controls.update();
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(renderFrame);
    };
    renderFrame();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointer);
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      contextRef.current = null;
    };
  }, [entities, onWebGLStatus]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    context.scaffold.visible = showScaffold;
    context.grayMatter.visible = showGrayMatter;
    context.entityRoot.visible = showEntities;
    context.slicePlane.position.z = sliceZ;
    const visible = new Set(visibleIds);
    context.entityGroups.forEach((group, id) => {
      group.visible = visible.has(id);
      group.scale.setScalar(id === selectedId ? 1.12 : 1);
      const halo = group.getObjectByName("selection-halo");
      if (halo) halo.visible = id === selectedId;
    });
  }, [selectedId, showEntities, showGrayMatter, showScaffold, sliceZ, visibleIds]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;
    const { camera, controls } = context;
    const target = view === "transverse" ? new THREE.Vector3(0, 0, sliceZ) : new THREE.Vector3(0, 0, 0);
    const positions: Record<CameraView, [number, number, number]> = {
      home: [11, 8, 26],
      dorsal: [0, 68, 0.01],
      right: [68, 0, 0],
      transverse: [0, 0, sliceZ + 10],
    };
    camera.position.set(...positions[view]);
    camera.up.set(view === "dorsal" ? 0 : 0, view === "dorsal" ? 0 : 1, view === "dorsal" ? 1 : 0);
    controls.target.copy(target);
    controls.update();
  }, [sliceZ, view]);

  return <div className="three-canvas" ref={containerRef} data-testid="three-canvas" />;
}
