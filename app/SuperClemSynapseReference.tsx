/* eslint-disable @next/next/no-img-element -- these exact pinned local research assets bypass remote image optimization */
"use client";

import { useState } from "react";
import reference from "../data/super-clem-synapse-reference-0.1.json";
import serialStack from "../data/super-clem-dorsal-synapse1-serial-stack-0.1.json";

const { sourceDataset } = reference;
const sections = serialStack.entries;

export default function SuperClemSynapseReference() {
  const [sectionIndex, setSectionIndex] = useState(0);
  const selected = sections[sectionIndex];
  const derivative = selected.browserDerivative;
  const source = selected.localOriginal;

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
              key={selected.figshareFileId}
              src={derivative.path}
              width={serialStack.sourceObject.imageDimensionsPixels[0]}
              height={serialStack.sourceObject.imageDimensionsPixels[1]}
              loading="lazy"
              decoding="async"
              alt={`Electron micrograph of deposited Super-CLEM spinal dorsal-horn synapse section ${selected.ordinal} of ${sections.length}, source section ${selected.sourceSectionLabel}; parent cell unresolved`}
            />
            <span className="super-clem-reference-image-badge">DERIVED PNG · SOURCE PIXELS · SECTION {selected.ordinal}/{sections.length}</span>
          </div>
          <div className="super-clem-section-controls" aria-label="Serial electron-microscopy section browser">
            <div className="super-clem-section-stepper">
              <button type="button" onClick={() => setSectionIndex((index) => Math.max(0, index - 1))} disabled={sectionIndex === 0} aria-label="Show previous source section">← Previous</button>
              <output aria-live="polite">Section {selected.ordinal} of {sections.length} · source label {selected.sourceSectionLabel}</output>
              <button type="button" onClick={() => setSectionIndex((index) => Math.min(sections.length - 1, index + 1))} disabled={sectionIndex === sections.length - 1} aria-label="Show next source section">Next →</button>
            </div>
            <input
              aria-label="Select serial electron-microscopy section"
              type="range"
              min={0}
              max={sections.length - 1}
              step={1}
              value={sectionIndex}
              onChange={(event) => setSectionIndex(Number(event.currentTarget.value))}
            />
            <p>Nominal 70 nm serial-section thickness · source order only · no calibrated z-axis or cross-section registration</p>
          </div>
          <figcaption>
            Browser-readable PNG format conversion of the deposited TIFF for one section of the same source-labelled synapse series. It preserves the decoded source pixels; it adds no outline, alignment, segmentation, mesh, cell assignment, or spatial registration.
          </figcaption>
        </figure>

        <div className="super-clem-reference-evidence">
          <div className="super-clem-reference-warning" role="note">
            <strong>This serial image series cannot fill the inside of the selected morphology.</strong>
            <p>The selected NeuroMorpho objects and this Super-CLEM synapse series are different public source objects. Switching sections or placing the card nearby creates no biological relationship.</p>
          </div>

          <ul className="super-clem-reference-statuses" aria-label="Super-CLEM serial-stack evidence status">
            <li><span className="microdetail-status obs">OBS</span><div><strong>11 deposited 2D EM images</strong><small>Consecutive source section labels 20140–20150; parent cell and named interneuron unresolved.</small></div></li>
            <li><span className="microdetail-status derived">DERIVED</span><div><strong>Lossless-pixel PNG display</strong><small>Per-image decoded RGB SHA-256 receipts match the TIFFs; no resampling, alignment, or annotation.</small></div></li>
            <li><span className="microdetail-status unavailable">BOUNDARY</span><div><strong>Sequence browser, not a volume</strong><small>No registered z coordinates, manual contours, selected-cell join, atlas placement, or 3D reconstruction.</small></div></li>
          </ul>

          <dl className="super-clem-reference-receipts">
            <div><dt>Current section / Figshare file</dt><dd>{selected.ordinal} / {sections.length} · {selected.figshareFileId}</dd></div>
            <div><dt>Source label / dimensions</dt><dd>{selected.sourceSectionLabel} · {serialStack.sourceObject.imageDimensionsPixels.join(" × ")} px</dd></div>
            <div><dt>Source bytes</dt><dd>{selected.remoteReceipt.bytes.toLocaleString("en-US")}</dd></div>
            <div><dt>Source MD5</dt><dd><code>{selected.remoteReceipt.md5}</code></dd></div>
            <div><dt>Local source SHA-256</dt><dd><code>{source.sha256}</code></dd></div>
            <div><dt>PNG bytes / SHA-256</dt><dd>{derivative.bytes.toLocaleString("en-US")} · <code>{derivative.sha256}</code></dd></div>
            <div><dt>Anatomical scope</dt><dd>Mouse spinal dorsal horn · Dorsal 2</dd></div>
            <div><dt>Reuse license</dt><dd>{sourceDataset.license}</dd></div>
          </dl>
        </div>
      </div>

      <footer className="super-clem-reference-footer">
        <span>11 SOURCE SECTIONS · SAME DEPOSITED SYNAPSE SERIES · PARENT CELL UNRESOLVED</span>
        <nav aria-label="Super-CLEM source links">
          <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Current source TIFF</a>
          <a href={sourceDataset.datasetUrl} target="_blank" rel="noreferrer">Figshare dataset</a>
          <a href={sourceDataset.paperUrl} target="_blank" rel="noreferrer">eLife article</a>
          <a href={sourceDataset.licenseUrl} target="_blank" rel="noreferrer">CC BY 4.0</a>
        </nav>
      </footer>
    </section>
  );
}
