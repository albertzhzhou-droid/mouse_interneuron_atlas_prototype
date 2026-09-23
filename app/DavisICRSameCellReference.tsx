/* eslint-disable @next/next/no-img-element -- exact publisher figure retained unchanged for source-local inspection */
import figure from "../data/source-candidates/davis-icr-same-cell-20260922/41598_2023_38605_Fig1_HTML.png";
import receipt from "../data/source-candidates/davis-icr-same-cell-20260922/receipt.json";

export default function DavisICRSameCellReference() {
  const relation = receipt.sourceSupportedRelations[0];
  const scope = receipt.biologicalScope;
  const asset = receipt.asset;

  return (
    <details className="davis-icr-reference">
      <summary>
        <div>
          <span>UPG-213 · SOURCE-LOCAL MOUSE SPINAL MICRODETAIL</span>
          <strong>One recorded inhibitory interneuron, shown from morphology to ultrastructure</strong>
        </div>
        <em>UNCHANGED 2D FIGURE · 0 PROJECT GEOMETRY</em>
      </summary>

      <div className="davis-icr-reference-layout">
        <figure className="davis-icr-reference-figure">
          <a href={figure.src} target="_blank" rel="noreferrer" aria-label="Open the unmodified full-resolution Davis Figure 1 in a new tab">
            <img
              src={figure.src}
              width={asset.dimensionsPx[0]}
              height={asset.dimensionsPx[1]}
              loading="lazy"
              decoding="async"
              alt="Published Figure 1: panels a to d show black dendritic trees and red axonal arbors from four recorded inhibitory calretinin islet cells; panels e to g show electron micrographs of the same cell as panel d."
            />
          </a>
          <figcaption>
            Full source figure, displayed without crop or markup. Open the image at native resolution to inspect the 0.5 μm EM panels.
          </figcaption>
        </figure>

        <div className="davis-icr-reference-evidence">
          <div className="davis-icr-reference-boundary" role="note">
            <strong>Source caption links panel {relation.fromPanel} to panels e–g only</strong>
            <p>Panels a–c are other recorded cells. The caption identifies e–g as electron-microscope examples of the cell in panel d; this is a publication-level same-cell assertion, not an independent identity validation.</p>
            <p>The authors report compromised tissue preservation at EM level. The micrographs are qualitative ultrastructural evidence, not a serial stack or a reconstructable 3D synapse/cell model.</p>
          </div>

          <dl className="davis-icr-reference-receipts">
            <div><dt>Biological scope</dt><dd>{scope.species} · {scope.targetAnatomy}</dd></div>
            <div><dt>Source population</dt><dd>{scope.sourceCellClass} · {scope.sourceMouseLine}</dd></div>
            <div><dt>Study sampling</dt><dd>{scope.recordedCellCountInExperiment} recorded cells from {scope.miceInExperiment} mice</dd></div>
            <div><dt>Panel scale bars</dt><dd>100 μm (a–d) · 0.5 μm (e–g)</dd></div>
            <div><dt>Shown cell age / sex</dt><dd>Not resolved for this exact figure cell</dd></div>
            <div><dt>Source image</dt><dd>{asset.dimensionsPx.join(" × ")} px · {asset.bytes.toLocaleString("en-US")} bytes · SHA-256 <code>{asset.sha256.slice(0, 16)}…</code></dd></div>
          </dl>

          <div className="davis-icr-reference-not-admitted">
            <strong>Not imported as the selected cell&apos;s interior</strong>
            <span>0 segmentations · 0 meshes · 0 source z-coordinates · 0 active-record joins · 0 atlas registrations. The illustrated iCR is not a NeuroMorpho or molecular-taxonomy identity in this app.</span>
          </div>

          <nav aria-label="Davis iCR same-cell reference source links">
            <a href={receipt.articleUrl} target="_blank" rel="noreferrer">Primary article ↗</a>
            <a href={receipt.figurePageUrl} target="_blank" rel="noreferrer">Figure 1 caption ↗</a>
            <a href={receipt.rights.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0 ↗</a>
          </nav>
        </div>
      </div>

      <footer className="davis-icr-reference-credit">
        <span>Figure 1 reproduced unchanged under CC BY 4.0</span>
        <span>{receipt.sourceCitation} · Fig. 1 · DOI: {receipt.doi}</span>
      </footer>
    </details>
  );
}
