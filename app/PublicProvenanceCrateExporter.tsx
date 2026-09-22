"use client";

import { useMemo } from "react";
import {
  publicDataCatalog,
  publicProvenanceCrate,
  type PublicDataCatalogSource,
} from "./atlas-types";
import {
  buildDetachedPublicProvenanceCrate,
  detachedCrateFilename,
  validateDetachedPublicProvenanceCrate,
} from "./public-provenance-crate";

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/ld+json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function PublicProvenanceCrateExporter({ source, onNotice }: { source: PublicDataCatalogSource; onNotice: (notice: string) => void }) {
  const crate = useMemo(() => buildDetachedPublicProvenanceCrate({ source, catalog: publicDataCatalog, contract: publicProvenanceCrate }), [source]);
  const errors = useMemo(() => validateDetachedPublicProvenanceCrate(crate, publicProvenanceCrate), [crate]);
  const exportCrate = () => {
    if (errors.length) {
      onNotice("RO-Crate export blocked · " + errors[0]);
      return;
    }
    downloadJson(crate, detachedCrateFilename(source.id));
    onNotice(source.id + " detached RO-Crate metadata exported · external reference only; no source object acquired or registered");
  };

  return <section className="provenance-crate-exporter" aria-labelledby="provenance-crate-heading">
    <div className="manifest-composer-heading">
      <div><span>UPG-014 · DETACHED RO-CRATE 1.3</span><h5 id="provenance-crate-heading">Portable public-source provenance metadata</h5></div>
      <span className="badge inferred">EXTERNAL ONLY · 0 REG</span>
    </div>
    <p>Export a source-scoped, standards-structured JSON-LD metadata document. It names this catalogued public URL as an external web data entity; it does not place the source object inside a package.</p>
    <dl className="catalog-detail-grid provenance-crate-grid">
      <div><dt>Packaging mode</dt><dd>Detached metadata document</dd></div>
      <div><dt>RO-Crate profile</dt><dd>1.3 · JSON-LD</dd></div>
      <div><dt>External object</dt><dd>{source.provenance.sourceUrl}</dd></div>
      <div><dt>Source state</dt><dd>Catalog metadata only · unacquired · unregistered</dd></div>
    </dl>
    <p className="taxonomy-boundary">The exported record preserves the source ID, accession, version, URL, access date, rights status and source-specific scientific limits. It does not prove possession, authorize reuse, calculate a hash, validate biology, transform coordinates or create `REG`.</p>
    <div className="manifest-composer-validation" aria-live="polite">
      <strong>{errors.length ? "Export blocked by RO-Crate structural checks" : "Ready to export detached metadata"}</strong>
      {errors.length ? <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p>Only one HTTPS web data entity is emitted. No local payload paths or source-file bytes are included.</p>}
    </div>
    <div className="catalog-actions"><button type="button" onClick={exportCrate} disabled={errors.length > 0}>Export RO-Crate metadata</button></div>
  </section>;
}
