"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { neurolucidaSourceNativeSomaContourTrace } from "./atlas-types";
import {
  nativeSomaContourDisplayTransform,
  transformNativeSomaContourPoint,
  validateNativeSomaContourPayload,
} from "./neurolucida-native-soma-contours.js";
import { sha256Hex } from "./source-local-morphology-geometry.js";

type NativeContour = {
  id: string;
  sourceName: "Soma 1" | "Cell Body";
  sourceClosedFlag: boolean;
  interpretedClosed: boolean;
  closureBasis: string;
  sourceColor: string;
  vertexCount: number;
  zValuesMicrometre: number[];
  points: [number, number, number, number][];
};

type NativeContourPayload = {
  documentType: string;
  schemaVersion: string;
  releaseId: string;
  assetId: string;
  sourceFrame: string;
  units: string;
  registrationStatus: "unregistered";
  summary: {
    sourceSomaContourObjectCount: number;
    vertexCount: number;
    semanticClosedSegmentCount: number;
    filledPolygonCount: number;
    triangleCount: number;
    surfaceCount: number;
    volumeCount: number;
    internalStructureObjectCount: number;
    registrationCount: number;
    crossSourceJoinCount: number;
    pointPayloadSha256: string;
  };
  displayContract: Record<string, unknown>;
  contours: NativeContour[];
};

type LoadState =
  | { status: "loading"; payload: null; message: string }
  | { status: "verified"; payload: NativeContourPayload; message: string }
  | { status: "unavailable"; payload: null; message: string };

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const drawable = object as THREE.Line | THREE.LineLoop | THREE.AxesHelper;
    drawable.geometry?.dispose();
    if (drawable.material) {
      const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export default function NativeSomaContourViewer() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<{ stack: THREE.Group; legacy: THREE.Group } | null>(null);
  const [showStack, setShowStack] = useState(true);
  const [showLegacy, setShowLegacy] = useState(true);
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [state, setState] = useState<LoadState>({ status: "loading", payload: null, message: "Verifying the exact source-native contour bytes…" });
  const contract = neurolucidaSourceNativeSomaContourTrace;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(contract.derivedObject.path, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Native contour request failed (${response.status})`);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== contract.derivedObject.bytes || await sha256Hex(bytes) !== contract.derivedObject.sha256) {
          throw new Error("Native contour byte receipt mismatch");
        }
        const payload = JSON.parse(new TextDecoder().decode(bytes)) as NativeContourPayload;
        return validateNativeSomaContourPayload(payload, contract) as NativeContourPayload;
      })
      .then((payload) => setState({ status: "verified", payload, message: "Exact source-native contour traces verified." }))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setState({ status: "unavailable", payload: null, message: error.message });
      });
    return () => controller.abort();
  }, [contract]);

  const transform = useMemo(
    () => state.status === "verified" ? nativeSomaContourDisplayTransform(state.payload.contours) : null,
    [state],
  );

  useEffect(() => {
    const container = viewportRef.current;
    if (!container || state.status !== "verified" || !transform) return;
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) {
      queueMicrotask(() => setWebGLAvailable(false));
      return;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setWebGLAvailable(false));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.dataset.assetId = state.payload.assetId;
    renderer.domElement.dataset.geometryAuthority = contract.derivedObject.authority;
    renderer.domElement.dataset.primitiveKind = "closed-polyline-only";
    renderer.domElement.dataset.surfaceCount = "0";
    renderer.domElement.dataset.internalStructureObjectCount = "0";
    renderer.domElement.dataset.registrationCount = "0";
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D view of eight source-native NMO 45718 Neurolucida soma contour traces. Seven Soma 1 planes and one separate legacy Cell Body trace are ordered closed polylines only; no fill, surface, volume, membrane, internal structure, SWC overlay or atlas registration is shown.",
    );
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1714);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const root = new THREE.Group();
    root.name = "nmo-45718-source-native-contour-traces";
    root.userData = {
      assetId: state.payload.assetId,
      authority: contract.derivedObject.authority,
      sourceFrame: state.payload.sourceFrame,
      allowedPrimitive: "ordered_closed_polyline",
      surfaceCount: 0,
      internalStructureObjectCount: 0,
      registrationCount: 0,
    };
    const stack = new THREE.Group();
    stack.name = "seven-source-closed-soma-1-contours";
    const legacy = new THREE.Group();
    legacy.name = "separate-legacy-cell-body-contour";
    for (const contour of state.payload.contours) {
      const points = contour.points.map((point) => new THREE.Vector3(
        ...transformNativeSomaContourPoint(point, transform) as [number, number, number],
      ));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(contour.sourceColor),
        transparent: true,
        opacity: contour.sourceName === "Cell Body" ? 0.95 : 0.8,
      });
      const line = new THREE.LineLoop(geometry, material);
      line.name = contour.id;
      line.userData = {
        sourceName: contour.sourceName,
        sourceClosedFlag: contour.sourceClosedFlag,
        interpretedClosed: contour.interpretedClosed,
        closureBasis: contour.closureBasis,
        vertexCount: contour.vertexCount,
        zValuesMicrometre: contour.zValuesMicrometre,
        traceRadiusRenderingUse: "forbidden",
      };
      (contour.sourceName === "Cell Body" ? legacy : stack).add(line);
    }
    root.add(stack, legacy);
    scene.add(root);
    visibilityRef.current = { stack, legacy };

    const bounds = new THREE.Box3().setFromObject(root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 4;
    controls.target.copy(sphere.center);
    camera.position.copy(sphere.center).add(new THREE.Vector3(radius * 1.4, radius * 0.95, radius * 1.65));
    camera.near = Math.max(radius / 500, 0.01);
    camera.far = Math.max(radius * 40, 100);
    camera.updateProjectionMatrix();

    const axes = new THREE.AxesHelper(Math.max(radius * 0.32, 0.7));
    axes.name = "viewer-axis-guide-not-biological-geometry";
    axes.position.copy(sphere.center);
    axes.userData = { authority: "VIEWER_GUIDE", measurementUse: "forbidden" };
    scene.add(axes);

    const scaleLength = 20 * transform.scaleViewerUnitPerMicrometre;
    const scaleGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(bounds.min.x, bounds.min.y - radius * 0.16, bounds.min.z),
      new THREE.Vector3(bounds.min.x + scaleLength, bounds.min.y - radius * 0.16, bounds.min.z),
    ]);
    const scaleLine = new THREE.Line(scaleGeometry, new THREE.LineBasicMaterial({ color: 0xc9d8d2 }));
    scaleLine.name = "twenty-micrometre-source-coordinate-guide";
    scaleLine.userData = { authority: "VIEWER_GUIDE", nativeLengthMicrometre: 20 };
    scene.add(scaleLine);

    let resizeFrame = 0;
    let width = 0;
    let height = 0;
    const resize = () => {
      const nextWidth = Math.max(280, container.clientWidth);
      const nextHeight = Math.max(300, container.clientHeight);
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    let animationFrame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setWebGLAvailable(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      disposeObject(root);
      disposeObject(axes);
      disposeObject(scaleLine);
      renderer.dispose();
      renderer.domElement.remove();
      visibilityRef.current = null;
    };
  }, [contract, state, transform]);

  useEffect(() => {
    if (!visibilityRef.current) return;
    visibilityRef.current.stack.visible = showStack;
    visibilityRef.current.legacy.visible = showLegacy;
  }, [showLegacy, showStack]);

  return (
    <section
      className="native-soma-contour-viewer"
      aria-labelledby="native-soma-contour-title"
      data-asset-id="NeuroMorpho:45718"
      data-geometry-authority={contract.derivedObject.authority}
      data-admitted-primitive="ordered-closed-polyline-only"
      data-surface-count="0"
      data-internal-structure-object-count="0"
      data-registration-count="0"
    >
      <header>
        <div>
          <p className="panel-kicker">SOURCE-NATIVE DAT CONTOUR TRACES · OBS</p>
          <h3 id="native-soma-contour-title">NMO 45718 native soma traces</h3>
          <p>Eight exact ordered contour objects in the unregistered Neurolucida DAT frame. This is a separate viewer—not an overlay with the standardized SWC.</p>
        </div>
        <strong>{state.status === "verified" ? "CHECKSUM VERIFIED" : state.status.toUpperCase()}</strong>
      </header>

      <div className="native-soma-contour-metrics" aria-label="Native contour evidence counts">
        <span><strong>8</strong> contours</span>
        <span><strong>275</strong> vertices</span>
        <span><strong>7</strong> source-closed planes</span>
        <span><strong>1</strong> legacy closure exception</span>
        <span><strong>0</strong> surfaces / volumes</span>
        <span><strong>0</strong> internal objects / REG</span>
      </div>

      <div className="native-soma-contour-layout">
        <div>
          <div className="native-soma-contour-controls" aria-label="Native contour trace visibility">
            <button type="button" className={showStack ? "active" : ""} aria-pressed={showStack} onClick={() => setShowStack((value) => !value)}>Seven-plane Soma 1 stack</button>
            <button type="button" className={showLegacy ? "active legacy" : ""} aria-pressed={showLegacy} onClick={() => setShowLegacy((value) => !value)}>Separate legacy Cell Body trace</button>
          </div>
          <div className="native-soma-contour-stage" ref={viewportRef}>
            {state.status === "loading" && <p role="status">{state.message}</p>}
            {state.status === "unavailable" && <p role="alert">Native traces unavailable: {state.message}. No fallback geometry is shown.</p>}
            {!webGLAvailable && <p role="status">WebGL unavailable. Exact source values and boundaries remain readable.</p>}
            {state.status === "verified" && <div className="native-soma-contour-scale" aria-hidden="true"><span />20 µm native-coordinate guide</div>}
          </div>
        </div>

        <aside aria-label="Native contour interpretation boundaries">
          <dl>
            <div><dt>Soma 1 planes</dt><dd>z −29 to −41 µm · exact 2 µm intervals</dd></div>
            <div><dt>Legacy Cell Body</dt><dd>source flag false · interpreted closed under the documented legacy exception · z 13 / 15 µm</dd></div>
            <div><dt>Trace radius</dt><dd>retained in source points · not used as anatomical thickness</dd></div>
            <div><dt>Transform</dt><dd>viewer-only recentering and uniform scale · source coordinates preserved</dd></div>
          </dl>
          <div className="native-soma-contour-boundary" role="note">
            <strong>LINE TRACES ONLY</strong>
            <p>No polygon fill, triangulation, loft, membrane, nucleus, organelle, volume, shrinkage correction, SWC overlay, type-average shape or atlas registration.</p>
          </div>
          <nav aria-label="Native contour sources">
            <a href={contract.sourceLinks.officialRecord} target="_blank" rel="noreferrer">NeuroMorpho record ↗</a>
            <a href={contract.sourceLinks.originalDat} target="_blank" rel="noreferrer">Original DAT ↗</a>
            <a href={contract.sourceLinks.converterRepository} target="_blank" rel="noreferrer">Independent parser audit ↗</a>
            <a href={contract.sourceLinks.morphologySpecification} target="_blank" rel="noreferrer">Contour semantics ↗</a>
          </nav>
        </aside>
      </div>
    </section>
  );
}
