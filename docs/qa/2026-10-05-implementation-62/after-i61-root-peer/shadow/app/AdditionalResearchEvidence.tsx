"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import "./source-audit-workspaces.css";

const ConnectivityAssertionWorkbench = lazy(() => import("./ConnectivityAssertionWorkbench"));
const AtlasSamplingSensitivityPanel = lazy(() => import("./AtlasSamplingSensitivityPanel"));
const DandiSpinalCordTracePreview = lazy(() => import("./DandiSpinalCordTracePreview"));
const MccreedyV2aPopulationMovie = lazy(() => import("./MccreedyV2aPopulationMovie"));
const GarciaRamirezPhysiologyPanel = lazy(() => import("./GarciaRamirezPhysiologyPanel"));

export default function AdditionalResearchEvidence() {
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [samplingOpen, setSamplingOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [movieOpen, setMovieOpen] = useState(false);
  const [physiologyOpen, setPhysiologyOpen] = useState(false);
  const connectionsRef = useRef<HTMLDetailsElement>(null);
  const samplingRef = useRef<HTMLDetailsElement>(null);
  const traceRef = useRef<HTMLDetailsElement>(null);
  const movieRef = useRef<HTMLDetailsElement>(null);
  const physiologyRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const sync = () => {
      // Keep the existing fragment entry points reachable even though closed
      // workspaces no longer mount their children. Also retain native toggles
      // made before hydration attaches onToggle.
      const target = [physiologyRef.current, movieRef.current, traceRef.current, connectionsRef.current, samplingRef.current].find(node => node && window.location.hash === `#${node.id}`);
      if (target) {
        target.open = true;
        target.querySelector("summary")?.focus({ preventScroll: true });
        target.scrollIntoView({ block: "start" });
      }
      setConnectionsOpen(connectionsRef.current?.open ?? false);
      setSamplingOpen(samplingRef.current?.open ?? false);
      setTraceOpen(traceRef.current?.open ?? false);
      setMovieOpen(movieRef.current?.open ?? false);
      setPhysiologyOpen(physiologyRef.current?.open ?? false);
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener("hashchange", sync);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", sync); };
  }, []);
  return <section className="additional-source-evidence" aria-label="Additional source evidence" style={{ marginTop: "1.5rem" }}>
    <details ref={physiologyRef} id="garcia-ramirez-physiology-panel" onToggle={(event) => setPhysiologyOpen(event.currentTarget.open)}>
      <summary>Adult Shox2 and Chx10 electrophysiology</summary>
      {physiologyOpen && <Suspense fallback={<p role="status">Preparing the published membrane-property tables…</p>}><GarciaRamirezPhysiologyPanel /></Suspense>}
    </details>
    <details ref={movieRef} id="mccreedy-v2a-movie-panel" onToggle={(event) => setMovieOpen(event.currentTarget.open)}>
      <summary>Mouse V2a spinal population movie</summary>
      {movieOpen && <Suspense fallback={<p role="status">Preparing the fixed-source population movie…</p>}><MccreedyV2aPopulationMovie /></Suspense>}
    </details>
    <details ref={traceRef} id="dandi-trace-preview-panel" onToggle={(event) => setTraceOpen(event.currentTarget.open)}>
      <summary>Mouse spinal extracellular trace preview</summary>
      {traceOpen && <Suspense fallback={<p role="status">Preparing the fixed-source trace preview…</p>}><DandiSpinalCordTracePreview /></Suspense>}
    </details>
    <details ref={connectionsRef} id="connection-evidence-panel" onToggle={(event) => setConnectionsOpen(event.currentTarget.open)}>
      <summary>Connection evidence by method</summary>
      {connectionsOpen && <Suspense fallback={<p role="status">Preparing source assertions and methods…</p>}><ConnectivityAssertionWorkbench /></Suspense>}
    </details>
    <details ref={samplingRef} id="sampling-sensitivity-panel" onToggle={(event) => setSamplingOpen(event.currentTarget.open)}>
      <summary>Native annotation sampling sensitivity</summary>
      {samplingOpen && <Suspense fallback={<p role="status">Preparing the fixed-source sampling report…</p>}><AtlasSamplingSensitivityPanel /></Suspense>}
    </details>
  </section>;
}
