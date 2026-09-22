/* eslint-disable @next/next/no-img-element -- this exact pinned local research asset must bypass remote image optimization */
import reference from "../data/super-clem-synapse-reference-0.1.json";

const { sourceDataset, sourceObject, browserDerivative } = reference;

export default function SuperClemSynapseReference() {
  return (
    <section className="super-clem-reference" aria-labelledby="super-clem-reference-heading">
      <header className="super-clem-reference-heading">
        <div>
          <p>OPEN-SOURCE SYNAPSE-SCALE CONTEXT · CO-DISPLAY ONLY</p>
          <h4 id="super-clem-reference-heading">Synapse-scale reference — parent cell unresolved</h4>
        </div>
        <strong>0 CELL · 0 TYPE · 0 ATLAS JOINS</strong>
      </header>

      <div className="super-clem-reference-layout">
        <figure className="super-clem-reference-figure">
          <div className="super-clem-reference-image-frame">
            <img
              src={browserDerivative.path}
              width={browserDerivative.widthPixels}
              height={browserDerivative.heightPixels}
              loading="lazy"
              decoding="async"
              alt="Electron-microscopy view of one public Super-CLEM spinal dorsal-horn synapse slice with a baked-in one-micrometre scale bar"
            />
            <span className="super-clem-reference-image-badge">DERIVED PNG · SOURCE PIXELS</span>
            <span className="super-clem-reference-scale-note">1 µm scale bar baked into source pixels</span>
          </div>
          <figcaption>
            Browser-readable PNG format conversion of the deposited TIFF. It preserves the source image as synapse-scale context; it adds no outline, mesh, cell assignment, or spatial registration.
          </figcaption>
        </figure>

        <div className="super-clem-reference-evidence">
          <div className="super-clem-reference-warning" role="note">
            <strong>This reference cannot fill the inside of the selected morphology.</strong>
            <p>The selected NeuroMorpho objects and this Super-CLEM image are different public source objects. Proximity on this page creates no biological relationship.</p>
          </div>

          <ul className="super-clem-reference-statuses" aria-label="Super-CLEM evidence status">
            <li><span className="microdetail-status obs">OBS</span><div><strong>Deposited 2D EM</strong><small>One image from the same physical synapse slice; parent cell unresolved.</small></div></li>
            <li><span className="microdetail-status derived">DERIVED</span><div><strong>PNG format conversion</strong><small>Browser display copy only; no annotation or biological feature was added.</small></div></li>
            <li><span className="microdetail-status unavailable">BOUNDARY</span><div><strong>Co-display only</strong><small>No selected cell, molecular type, atlas location, partner, or PALM-image crosswalk is admitted.</small></div></li>
          </ul>

          <dl className="super-clem-reference-receipts">
            <div><dt>Figshare file</dt><dd>{sourceObject.figshareFileId}</dd></div>
            <div><dt>Source dimensions</dt><dd>{sourceObject.image.widthPixels} × {sourceObject.image.heightPixels} · {sourceObject.image.bitsPerSample}-bit indexed palette</dd></div>
            <div><dt>Source bytes</dt><dd>{sourceObject.remoteReceipt.bytes.toLocaleString("en-US")}</dd></div>
            <div><dt>Source MD5</dt><dd><code>{sourceObject.remoteReceipt.md5}</code></dd></div>
            <div><dt>PNG bytes</dt><dd>{browserDerivative.bytes.toLocaleString("en-US")}</dd></div>
            <div><dt>PNG SHA-256</dt><dd><code>{browserDerivative.sha256}</code></dd></div>
            <div><dt>Anatomical scope</dt><dd>Mouse spinal dorsal horn · Dorsal 2</dd></div>
            <div><dt>Reuse license</dt><dd>{sourceDataset.license}</dd></div>
          </dl>
        </div>
      </div>

      <footer className="super-clem-reference-footer">
        <span>PUBLIC FILE · SAME SYNAPSE SLICE · PARENT CELL UNRESOLVED</span>
        <nav aria-label="Super-CLEM source links">
          <a href={sourceObject.sourceUrl} target="_blank" rel="noreferrer">Deposited TIFF</a>
          <a href={sourceDataset.datasetUrl} target="_blank" rel="noreferrer">Figshare dataset</a>
          <a href={sourceDataset.paperUrl} target="_blank" rel="noreferrer">eLife article</a>
          <a href={sourceDataset.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0</a>
        </nav>
      </footer>
    </section>
  );
}
