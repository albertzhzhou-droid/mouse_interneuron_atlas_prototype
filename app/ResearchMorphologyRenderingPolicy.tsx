"use client";

import type { ResearchMorphologyRenderingPolicy as Policy } from "./research-morphology-rendering-policy.js";
import "./research-morphology-rendering-policy.css";

export default function ResearchMorphologyRenderingPolicy({ policy }: { policy: Policy }) {
  const source = policy.declaredSource;
  return <section className="research-morphology-policy" aria-label="Current morphology rendering policy" data-record-key={policy.recordKey}>
    <strong>{policy.radiusSurface.allowedAfterCurrentByteVerification ? "Radius surface requires current source verification" : "Radius-derived surface unavailable"}</strong>
    <p>{source.dimensionality === "2D"
      ? "Source-labelled 2D trace. Native diameter is retained as source input; no 3D surface, inferred thickness or depth is authorized."
      : !source.sourceDiameterAvailable
        ? "Source reports No Diameter. Placeholder SWC radii do not authorize a surface; centerlines remain subject to current source verification."
        : "Source-labelled 3D with reported diameter may show an explicitly derived surface after its exact geometry bytes are verified. It is not an observed membrane."}</p>
    <small>{policy.repositoryRelease} · {policy.membership.replaceAll("_", " ")} · 0 REG · no same-cell internal geometry</small>
    <p className="research-morphology-policy-scope">This record policy preserves source declarations. The current rendered view and its file verification belong to the independent viewport receipt.</p>
    {policy.archivedSurfaceDeclarations.length > 0 && <details>
      <summary>Retained earlier surface declaration</summary>
      <p>Earlier project wording is preserved below. The current rendering rule above determines whether a surface can be authorized.</p>
      <dl>{policy.archivedSurfaceDeclarations.map(row => <div key={row.evidenceIndex}><dt>{row.originalLabel} · archived project declaration</dt>
        <dd>{row.originalValue}<small>{row.originalAuthority} · {row.originalLocator}</small></dd></div>)}</dl>
    </details>}
  </section>;
}
