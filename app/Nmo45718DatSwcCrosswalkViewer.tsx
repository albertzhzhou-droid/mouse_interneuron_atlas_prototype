"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import crosswalkContractJson from "../data/neurolucida-dat-swc-crosswalk-0.1.json";
import {
  NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS,
  validateNmo45718DatSwcCrosswalk,
} from "./neurolucida-dat-swc-crosswalk.js";
import { sha256Hex } from "./source-local-morphology-geometry.js";
import "./nmo-dat-swc-crosswalk.css";

type CrosswalkContract = typeof crosswalkContractJson;
type VerifiedCrosswalk = ReturnType<typeof validateNmo45718DatSwcCrosswalk>;
type LoadState =
  | { neuronId: number; status: "loading"; payload: null; message: string }
  | { neuronId: number; status: "verified"; payload: VerifiedCrosswalk; message: string }
  | { neuronId: number; status: "unavailable"; payload: null; message: string };

const contract = crosswalkContractJson as CrosswalkContract;
const TYPE_COLORS: Record<number, string> = {
  1: "#f2c66d",
  2: "#73c9e8",
  3: "#ee9fc2",
};

function publicAssetPath(path: string) {
  return `/${path.replace(/^public\//, "")}`;
}

async function loadVerifiedJson(key: keyof typeof NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS, signal: AbortSignal) {
  const receipt = NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS[key];
  const response = await fetch(publicAssetPath(receipt.path), { signal, cache: "no-cache" });
  if (!response.ok) throw new Error(`${key} request failed (${response.status})`);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== receipt.bytes || await sha256Hex(bytes) !== receipt.sha256) {
    throw new Error(`${key} byte receipt did not match the reviewed source`);
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const drawable = object as THREE.Line | THREE.LineLoop | THREE.LineSegments;
    drawable.geometry?.dispose();
    if (drawable.material) {
      const materials = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export default function Nmo45718DatSwcCrosswalkViewer({ neuronId }: { neuronId: number }) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LoadState>({
    neuronId,
    status: "loading",
    payload: null,
    message: "Checking the exact source-file receipts before rendering the crosswalk…",
  });
  const [focusMode, setFocusMode] = useState<"soma" | "whole">("soma");
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const activeState = useMemo(() => state.neuronId === neuronId ? state : {
    neuronId,
    status: "loading" as const,
    payload: null,
    message: "Verifying the selected source record…",
  }, [neuronId, state]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.all([
      loadVerifiedJson("nativeContours", controller.signal),
      loadVerifiedJson("standardizedGeometry", controller.signal),
    ])
      .then(([contours, geometry]) => {
        const payload = validateNmo45718DatSwcCrosswalk(contract, contours, geometry);
        if (active) setState({ neuronId, status: "verified", payload, message: "Exact source assets verified; record-specific crosswalk reproduced." });
      })
      .catch((error: Error) => {
        if (active && error.name !== "AbortError") {
          setState({ neuronId, status: "unavailable", payload: null, message: `${error.message}. The crosswalk is withheld.` });
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [neuronId]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || activeState.status !== "verified") return;
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) {
      queueMicrotask(() => setWebglAvailable(false));
      return;
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      queueMicrotask(() => setWebglAvailable(false));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.dataset.crosswalkRecord = activeState.payload.assetId;
    canvas.dataset.crosswalkAuthority = activeState.payload.authority;
    canvas.dataset.nativeContourCount = String(activeState.payload.somaContours.length);
    canvas.dataset.nativeContourVertexCount = String(activeState.payload.correspondence.sourceVertexCount);
    canvas.dataset.standardizedSwcSegmentCount = String(activeState.payload.skeletonSegments.length);
    canvas.dataset.excludedContourCount = String(activeState.payload.excludedContourIds.length);
    canvas.dataset.surfaceCount = "0";
    canvas.dataset.meshCount = "0";
    canvas.dataset.volumeCount = "0";
    canvas.dataset.internalStructureObjectCount = "0";
    canvas.dataset.biologicalMeasurementCount = "0";
    canvas.dataset.atlasRegistrationCount = "0";
    canvas.setAttribute("aria-label", "Interactive source-local view of the exact NeuroMorpho 45718 standardized SWC line segments with seven same-record Neurolucida Soma 1 contour traces mapped by a checksum-pinned coordinate crosswalk. No surface, cell membrane, internal structure, measurement or atlas registration is shown.");
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d1720");
    const root = new THREE.Group();
    root.name = "nmo-45718-verified-dat-swc-crosswalk";
    root.userData = {
      recordId: activeState.payload.assetId,
      authority: activeState.payload.authority,
      displayFrame: activeState.payload.sourceFrames.standardizedSwc,
      allowedPrimitives: ["exact_SWC_source_segments", "seven_transformed_source_closed_DAT_Soma_1_line_loops"],
      surfaceCount: 0,
      meshCount: 0,
      volumeCount: 0,
      internalStructureObjectCount: 0,
      biologicalMeasurementCount: 0,
      atlasRegistrationCount: 0,
    };
    const segmentsByType = new Map<number, number[]>();
    for (const segment of activeState.payload.skeletonSegments) {
      const sourceType = segment[8];
      const positions = segmentsByType.get(sourceType) ?? [];
      positions.push(segment[0], segment[1], segment[2], segment[4], segment[5], segment[6]);
      segmentsByType.set(sourceType, positions);
    }
    for (const [sourceType, positions] of segmentsByType) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: TYPE_COLORS[sourceType] ?? "#b9c7d0", transparent: true, opacity: 0.82 }));
      lines.name = `standardized-swc-source-type-${sourceType}-exact-line-segments`;
      lines.userData = {
        representation: "OBS_STANDARDIZED_SOURCE_LOCAL_SWC_SEGMENTS",
        sourceType,
        segmentCount: positions.length / 6,
        radiiRendered: false,
        claim: "source-labelled line-segment rendering; no inferred surface",
      };
      root.add(lines);
    }
    for (const contour of activeState.payload.somaContours) {
      const points = contour.points.map((point: readonly [number, number, number]) => new THREE.Vector3(point[0], point[1], point[2]));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: "#ffd66b", transparent: true, opacity: 1 }));
      line.name = `DAT-${contour.id}-transformed-to-CNG-frame`;
      line.renderOrder = 5;
      line.userData = {
        representation: "OBS_SOURCE_NATIVE_SOMA_1_LINE_LOOP_AFTER_RECORD_SPECIFIC_CROSSWALK",
        sourceContourId: contour.id,
        sourceName: contour.sourceName,
        vertexCount: contour.vertexCount,
        closedBySourceFlag: true,
        traceRadiusRendered: false,
      };
      root.add(line);
    }
    scene.add(root);
    const bounds = new THREE.Box3().setFromObject(root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const wholeRadius = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 100;
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, Math.max(wholeRadius * 40, 100));
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    const focus = focusMode === "soma" ? new THREE.Vector3(0, 0, -6) : sphere.center;
    const radius = focusMode === "soma" ? 14 : wholeRadius;
    controls.target.copy(focus);
    camera.position.copy(focus).add(new THREE.Vector3(radius * 1.45, radius * 0.95, radius * 1.7));
    camera.near = Math.max(radius / 600, 0.01);
    camera.far = Math.max(radius * 40, 100);
    camera.updateProjectionMatrix();

    let width = 0;
    let height = 0;
    let resizeFrame = 0;
    const resize = () => {
      const nextWidth = Math.max(320, host.clientWidth);
      const nextHeight = Math.max(340, host.clientHeight);
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
    observer.observe(host);
    let animationFrame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      controls.dispose();
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
    };
  }, [activeState, focusMode]);

  return (
    <section className="nmo-dat-swc-crosswalk" aria-labelledby="nmo-dat-swc-crosswalk-title" data-record-id={neuronId}>
      <div className="nmo-dat-swc-crosswalk-heading">
        <div>
          <span className="nmo-dat-swc-crosswalk-kicker">Record-specific coordinate crosswalk · reversible</span>
          <h3 id="nmo-dat-swc-crosswalk-title">Neurolucida soma contours + standardized SWC</h3>
          <p>NeuroMorpho.Org record 45718 only. This separate view maps seven source-closed <code>Soma 1</code> contours into the corresponding standardized local frame; it does not alter the native-DAT contour view.</p>
        </div>
        <span className={`nmo-dat-swc-crosswalk-state ${activeState.status}`}>{activeState.status === "verified" ? "SOURCE RECEIPTS VERIFIED" : activeState.status === "loading" ? "VERIFYING SOURCE FILES" : "CROSSWALK WITHHELD"}</span>
      </div>
      <p className="nmo-dat-swc-crosswalk-status" role="status">{activeState.message}</p>
      {activeState.status === "verified" ? <>
        <div className="nmo-dat-swc-crosswalk-toolbar">
          <div className="nmo-dat-swc-crosswalk-focus" role="group" aria-label="3D view focus">
            <button type="button" className={focusMode === "soma" ? "active" : ""} onClick={() => setFocusMode("soma")}>Soma cross-sections</button>
            <button type="button" className={focusMode === "whole" ? "active" : ""} onClick={() => setFocusMode("whole")}>Whole reconstruction</button>
          </div>
          <div className="nmo-dat-swc-crosswalk-legend" aria-label="Geometry legend">
            <span><i className="soma" /> DAT Soma 1 traces</span>
            <span><i className="axon" /> SWC type 2 · axon label</span>
            <span><i className="dendrite" /> SWC type 3 · dendrite label</span>
            <span><i className="swc-soma" /> SWC type 1 · soma samples</span>
          </div>
        </div>
        <div className="nmo-dat-swc-crosswalk-stage-wrap">
          <div className="nmo-dat-swc-crosswalk-stage" ref={canvasHostRef} />
          {webglAvailable === false && <div className="nmo-dat-swc-crosswalk-no-webgl">This browser cannot start WebGL 2, so the 3D crosswalk is not rendered. The verified fit and source links remain available below.</div>}
        </div>
        <div className="nmo-dat-swc-crosswalk-evidence">
          <section>
            <h4>Frame and fit audit</h4>
            <dl>
              <div><dt>DAT frame</dt><dd>Neurolucida source-native · unregistered</dd></div>
              <div><dt>SWC frame</dt><dd>NeuroMorpho CNG standardized local · unregistered</dd></div>
              <div><dt>Primary fit / held out</dt><dd>5 contour-centroid pairs / 2 independent pairs · max held-out {activeState.payload.validation.primaryFit.heldOut.maximumMicrometre.toFixed(5)} µm</dd></div>
              <div><dt>Alternating sensitivity</dt><dd>4 fit / 3 held out · max held-out {activeState.payload.validation.alternatingSensitivity.heldOut.maximumMicrometre.toFixed(5)} µm</dd></div>
              <div><dt>Transform</dt><dd>Reflection + rotation + uniform scale + translation; z offset +29 µm</dd></div>
              <div><dt>Display screen</dt><dd>≤ 0.01 µm last-place consistency check only; not a biological or anatomical accuracy claim</dd></div>
            </dl>
          </section>
          <section>
            <h4>What is and is not being shown</h4>
            <p>Seven source-closed DAT contour line loops (252 vertices) are shown with 5,635 exact standardized SWC line segments. The separate source-open legacy <code>Cell Body</code> contour is excluded from this crosswalk. No membrane, surface, volume, nucleus, organelle, synapse, measurements or atlas placement is inferred.</p>
            <p className="nmo-dat-swc-crosswalk-links"><a href="https://neuromorpho.org/api/neuron/id/45718" target="_blank" rel="noreferrer">Official NeuroMorpho record ↗</a><a href="https://neuromorpho.org/dableFiles/bannatyne/Source-Version/101026p1-A-In.dat" target="_blank" rel="noreferrer">Original DAT ↗</a><a href="https://neuromorpho.org/dableFiles/bannatyne/CNG%20version/101026p1-A-In.CNG.swc" target="_blank" rel="noreferrer">Standardized SWC ↗</a></p>
          </section>
        </div>
      </> : <div className="nmo-dat-swc-crosswalk-unavailable">No DAT↔SWC geometry is drawn unless both exact local source assets pass their byte receipts and the record-specific fit reproduces.</div>}
    </section>
  );
}
