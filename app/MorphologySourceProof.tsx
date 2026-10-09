"use client";

import SourceIdentityHierarchyPanel from "./SourceIdentityHierarchyPanel";
import type { MorphologyGeometryVerificationReceipt } from "./morphology-geometry-verification.js";
import type { SourceIdentityHierarchy } from "./source-object-identity.js";
import "./morphology-source-proof.css";

export default function MorphologySourceProof({ label, receipt, sourceContext, identity }: {
  label: string;
  receipt: MorphologyGeometryVerificationReceipt | null;
  sourceContext?: unknown;
  identity?: SourceIdentityHierarchy;
}) {
  return <details className="morphology-source-proof" aria-label={`${label} source verification`}>
    <summary>Current source verification</summary>
    {receipt ? <>
      <p>Exact standardized geometry file verified. Its raw SWC checksum is retained as a source declaration; this loader has not reread that raw file.</p>
      <dl>
        <div><dt>Source object</dt><dd>NeuroMorpho {receipt.neuronId}</dd></div>
        <div><dt>Verified geometry bytes</dt><dd>{receipt.bytes.toLocaleString()}</dd></div>
        <div><dt>Current verification</dt><dd>{receipt.verifiedAt} · {receipt.requestCacheMode}</dd></div>
        <div><dt>Geometry SHA-256</dt><dd><code>{receipt.sha256}</code></dd></div>
      </dl>
      {identity && <SourceIdentityHierarchyPanel hierarchy={identity} />}
      <label>Current source proof
        <textarea readOnly aria-label={`${label} current source proof`} value={JSON.stringify({ geometryVerification: receipt, sourceContext: sourceContext ?? null }, null, 2)} />
      </label>
    </> : <p role="status">No current verified source geometry. Loading, missing or failed sources have no retained proof.</p>}
  </details>;
}
