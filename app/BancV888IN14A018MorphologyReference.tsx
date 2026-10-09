"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import route from "../data/banc-v888-in14a018-morphology-route-0.1.json";
import { computeBancV888SwcBounds, parseBancV888IN14A018Swc } from "./banc-v888-in14a018-morphology-route.js";

type ParsedRoute = ReturnType<typeof parseBancV888IN14A018Swc>;

function toSha256(bytes: ArrayBuffer) {
  return globalThis.crypto.subtle.digest("SHA-256", bytes).then((digest) =>
    Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join(""));
}

export default function BancV888IN14A018MorphologyReference() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<ParsedRoute | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "ready" | "error">("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || payload || loadState === "error") return;
    const controller = new AbortController();
    fetch(route.skeleton.publicUrl, { signal: controller.signal, cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`SWC request failed (${response.status})`);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== route.skeleton.bytes) throw new Error("SWC byte count differs from its source receipt");
        if (await toSha256(bytes) !== route.skeleton.sha256) throw new Error("SWC SHA-256 differs from its source receipt");
        const parsed = parseBancV888IN14A018Swc(new TextDecoder().decode(bytes));
        const bounds = computeBancV888SwcBounds(parsed.nodes);
        if (parsed.nodes.length !== route.skeleton.nodeCount
          || parsed.edges.length !== route.skeleton.segmentCount
          || JSON.stringify(parsed.nodeTypeCodes) !== JSON.stringify(route.skeleton.nodeTypeCodes)
          || JSON.stringify(bounds.min) !== JSON.stringify(route.skeleton.coordinates.boundsNanometres.min)
          || JSON.stringify(bounds.max) !== JSON.stringify(route.skeleton.coordinates.boundsNanometres.max)
          || parsed.root.parentId !== -1) throw new Error("SWC topology or source-frame receipt does not match");
        setPayload(parsed);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadState("error");
      });
    return () => controller.abort();
  }, [open, payload, loadState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch {
      window.setTimeout(() => setLoadState("error"), 0);
      return;
    }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f5f8fb");
    const bounds = route.skeleton.coordinates.boundsNanometres;
    const center = bounds.min.map((value, axis) => (value + bounds.max[axis]) / 2);
    const toDisplay = (node: { x: number; y: number; z: number }) => new THREE.Vector3(
      (node.x - center[0]) / 1000,
      (node.y - center[1]) / 1000,
      (node.z - center[2]) / 1000,
    );
    const segmentPositions = new Float32Array(payload.edges.length * 6);
    payload.edges.forEach(([parent, child], index) => {
      const a = toDisplay(parent);
      const b = toDisplay(child);
      segmentPositions.set([a.x, a.y, a.z, b.x, b.y, b.z], index * 6);
    });
    const skeletonGeometry = new THREE.BufferGeometry();
    skeletonGeometry.setAttribute("position", new THREE.BufferAttribute(segmentPositions, 3));
    const skeletonLines = new THREE.LineSegments(skeletonGeometry, new THREE.LineBasicMaterial({ color: "#146c75" }));
    skeletonLines.name = "source-swc-parent-child-centerlines";
    scene.add(skeletonLines);

    const nucleusPoint = route.nucleusAnnotation.positionNanometres;
    const nucleusGeometry = new THREE.BufferGeometry();
    nucleusGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
      (nucleusPoint[0] - center[0]) / 1000,
      (nucleusPoint[1] - center[1]) / 1000,
      (nucleusPoint[2] - center[2]) / 1000,
    ], 3));
    const nucleusMarker = new THREE.Points(nucleusGeometry, new THREE.PointsMaterial({ color: "#b44b74", size: 12, sizeAttenuation: false }));
    nucleusMarker.name = "same-root-source-nucleus-annotation-point";
    scene.add(nucleusMarker);

    const spans = bounds.max.map((value, axis) => (value - bounds.min[axis]) / 1000);
    const largestSpan = Math.max(...spans);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, largestSpan * 20);
    camera.position.set(largestSpan * 0.9, largestSpan * 0.75, largestSpan * 1.15);
    camera.lookAt(0, 0, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.update();
    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    let frame = 0;
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      skeletonGeometry.dispose();
      (skeletonLines.material as THREE.Material).dispose();
      nucleusGeometry.dispose();
      (nucleusMarker.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, [payload]);

  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open);

  return (
    <section id="banc-in14a018-route" className="banc-in14a018-route" aria-labelledby="banc-in14a018-title">
      <header>
        <div><span>UPG-248 · SOURCE-LOCAL COMPARATIVE GEOMETRY</span><strong id="banc-in14a018-title">One exact fly VNC interneuron skeleton · not a mouse model</strong></div>
        <em>7,451 NODES · CENTERLINE ONLY</em>
      </header>
      <p>Adult female <i>Drosophila melanogaster</i> · source type <code>IN14A018</code> · root <code>{route.identity.rootId}</code> · BANC v888.</p>
      <div className="banc-in14a018-boundary" role="note">
        <strong>What the data authorize</strong>
        <span>The checksum-verified SWC is drawn as source parent-child lines only; its radius column is ignored. A same-root nucleus annotation is shown as one screen-space point, not a nucleus surface. Node type 2 is left uninterpreted—no axon/dendrite split, mouse-cell join, atlas registration, or measurement. The source reports 31 mitochondria, but no mitochondrial coordinates or geometry are displayed.</span>
      </div>
      {open && !payload && loadState !== "error" && <p role="status">Verifying the exact SWC and topology before display…</p>}
      {loadState === "error" && <p role="alert">The SWC failed its exact source receipt, topology, or WebGL check. No fallback or substitute geometry is shown.</p>}
      <details className="banc-in14a018-viewer" onToggle={handleToggle}>
        <summary>Open / close the interactive 3D comparison view</summary>
        <div className="banc-in14a018-canvas-wrap" data-render-state={loadState}>
          <canvas ref={canvasRef} role="img" aria-label="Interactive 3D source-local centerline rendering of BANC v888 adult female Drosophila neuron IN14A018, with one source-linked nucleus annotation point; not registered to mouse spinal cord." />
        </div>
        {payload && <p className="banc-in14a018-caption">{payload.nodes.length.toLocaleString()} source nodes · {payload.edges.length.toLocaleString()} parent-child segments · nucleus annotation point in the same BANC native frame. Drag to rotate; scroll to zoom. Coordinates are recentered and displayed in μm only.</p>}
      </details>
      <dl className="banc-in14a018-facts">
        <div><dt>Source object</dt><dd>{route.skeleton.memberName} · {route.skeleton.bytes.toLocaleString()} bytes · SHA-256 {route.skeleton.sha256.slice(0, 12)}…</dd></div>
        <div><dt>Nucleus</dt><dd>ID {route.nucleusAnnotation.nucleusId} · one source annotation point · no boundary</dd></div>
        <div><dt>Reported mitochondria</dt><dd>{route.displayAuthority.sourceReportedMitochondriaCount} count only · 0 positions / 0 geometries</dd></div>
      </dl>
      <nav aria-label="BANC v888 exact morphology route source links">
        <a href={route.rights.sourceUrl} target="_blank" rel="noreferrer">Dataverse v3 · CC BY 4.0 ↗</a>
        <a href={route.rights.primaryArticleUrl} target="_blank" rel="noreferrer">BANC primary paper ↗</a>
        <a href={route.nucleusAnnotation.sourceAsset.url} target="_blank" rel="noreferrer">Source nucleus annotation asset ↗</a>
      </nav>
    </section>
  );
}
