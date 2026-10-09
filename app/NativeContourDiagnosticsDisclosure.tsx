"use client";

import { lazy, Suspense, useState } from 'react';
import type { NativeContourPayload } from './NativeContourRecordViewer';
import './native-contour-diagnostics.css';

const DiagnosticPanel = lazy(() => import('./NativeContourDiagnostics'));

export default function NativeContourDiagnosticsDisclosure({ neuronId, payload, onInspect }: { neuronId: number; payload: NativeContourPayload; onInspect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return <details className="native-contour-diagnostics" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Explore source contour numerical diagnostics</summary>
    {open && <Suspense fallback={<p role="status">Preparing diagnostics for NMO {neuronId}…</p>}>
      <DiagnosticPanel neuronId={neuronId} payload={payload} onInspect={onInspect} />
    </Suspense>}
  </details>;
}
