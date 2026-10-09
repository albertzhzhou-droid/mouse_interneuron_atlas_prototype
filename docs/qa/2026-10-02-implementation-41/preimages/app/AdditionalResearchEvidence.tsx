"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import "./source-audit-workspaces.css";

const ConnectivityAssertionWorkbench = lazy(() => import("./ConnectivityAssertionWorkbench"));
const AtlasSamplingSensitivityPanel = lazy(() => import("./AtlasSamplingSensitivityPanel"));
const DandiSpinalCordTracePreview = lazy(() => import("./DandiSpinalCordTracePreview"));

export default function AdditionalResearchEvidence() {
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [samplingOpen, setSamplingOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const connectionsRef = useRef<HTMLDetailsElement>(null);
  const samplingRef = useRef<HTMLDetailsElement>(null);
  const traceRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const sync = () => {
      // Keep the existing fragment entry points reachable even though closed
      // workspaces no longer mount their children. Also retain native toggles
      // made before hydration attaches onToggle.
      const target = [traceRef.current, connectionsRef.current, samplingRef.current].find(node => node && window.location.hash === `#${node.id}`);
      if (target) {
        target.open = true;
        target.querySelector("summary")?.focus({ preventScroll: true });
        target.scrollIntoView({ block: "start" });
      }
      setConnectionsOpen(connectionsRef.current?.open ?? false);
      setSamplingOpen(samplingRef.current?.open ?? false);
      setTraceOpen(traceRef.current?.open ?? false);
    };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener("hashchange", sync);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", sync); };
  }, []);
  return <section className="additional-source-evidence" aria-label="Additional source evidence" style={{ marginTop: "1.5rem" }}>
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
