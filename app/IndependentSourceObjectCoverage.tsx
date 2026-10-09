import micronsReference from "../data/microns-observed-cell-nucleus-reference-0.1.json";
import micronsSubcellularAudit from "../data/microns-subcellular-source-audit-0.1.json";
import bancMorphologyRoute from "../data/banc-v888-in14a018-morphology-route-0.1.json";
import bancInternalAudit from "../data/banc-v888-internal-object-source-audit-0.1.json";
import bancMitochondriaAudit from "../data/banc-v888-mitochondria-route-audit-0.1.json";
import superClemReference from "../data/super-clem-palm-localization-reference-0.1.json";
import microStructFormerReference from "../data/microstructformer-ultrastructure-reference-0.1.json";
import nativeContourAudit from "../data/todd-native-contour-topology-audit-0.1.json";
import { buildIndependentSourceObjectCoverage } from "./independent-source-object-coverage.js";
import IndependentSourceObjectWorkspace from "./IndependentSourceObjectWorkspace";

const coverage = buildIndependentSourceObjectCoverage({
  micronsReference,
  micronsAudit: micronsSubcellularAudit,
  bancMorphologyRoute,
  bancInternalAudit,
  bancMitochondriaAudit,
  superClemReference,
  microStructFormerReference,
  nativeContourAudit,
});

export default function IndependentSourceObjectCoverage() {
  return (
    <details className="independent-source-object-coverage" data-source-registry-count={coverage.length}>
      <summary>
        <span>UPG-252 · SOURCE-LOCAL COVERAGE · {coverage.length} SEPARATE REGISTRIES</span>
        <strong>Compare the independent structural evidence</strong>
      </summary>
      <p className="independent-source-object-coverage-note">
        Each row keeps its own source scope and denominator. Counts below are never pooled into one interneuron total; an unknown or unadmitted object is not biologically absent. Use the linked source card for the full receipt.
        {" "}<a href="/objects">Open the dedicated object workspace ↗</a>
      </p>
      <IndependentSourceObjectWorkspace />
      <div className="independent-source-object-coverage-grid" aria-label="Coverage of five independent structural source registries">
        {coverage.map((item) => (
          <article key={item.id} data-scope={item.scopeClass} data-source-registry={item.id}>
            <header>
              <div><h3>{item.sourceName}</h3><p>{item.scope}</p></div>
              <span>{item.id === "microns-phase1" || item.id === "banc-v888" ? "OBSERVED OBJECT ROUTE" : "SOURCE-ONLY / OBJECT GATE"}</span>
            </header>
            <dl>
              <div><dt>Source-local count</dt><dd>{item.sourceScopedCount}</dd></div>
              <div><dt>Stable ID / source record</dt><dd>{item.objectIds}</dd></div>
              <div><dt>Coordinates / scale</dt><dd>{item.coordinateFrame} · {item.resolution}</dd></div>
              <div><dt>What is displayed</dt><dd>{item.displayed}</dd></div>
              <div><dt>Completeness / boundaries</dt><dd>{item.completeness} {item.notAdmitted}</dd></div>
              <div><dt>Rights</dt><dd>{item.rights}</dd></div>
            </dl>
            <a href={item.detailHref} target={item.detailHref.startsWith("#") ? undefined : "_blank"} rel={item.detailHref.startsWith("#") ? undefined : "noreferrer"}>
              {item.detailLabel} ↗
            </a>
            <small>Source locator: <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceLabel}</a></small>
          </article>
        ))}
      </div>
    </details>
  );
}
