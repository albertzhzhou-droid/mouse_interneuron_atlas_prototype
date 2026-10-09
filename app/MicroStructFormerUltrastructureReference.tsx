import { microStructFormerUltrastructureReference } from "./atlas-types";

export default function MicroStructFormerUltrastructureReference() {
  const reference = microStructFormerUltrastructureReference;
  const preview = reference.datasetRelease.sampleRowPreview;
  const boundary = reference.identityAndGeometryBoundary;

  return (
    <details id="microstructformer-reference" className="microstructformer-reference-card">
      <summary>
        <div>
          <span>UPG-239 · OPEN 2D ULTRASTRUCTURE REFERENCE</span>
          <strong>Axonal organelles and periaxonal labels · not a selected-cell model</strong>
        </div>
        <em>{reference.datasetRelease.rowCount} IMAGE / MASK ROWS</em>
      </summary>
      <p>
        Deng et al. provide paired two-dimensional EM images and semantic labels from mouse spinal-cord fiber studies. The hosted set has {reference.datasetRelease.splitCounts.train} train and {reference.datasetRelease.splitCounts.validation} validation rows. A viewer sample is {preview.imageDimensionsPixel[0].toLocaleString()} × {preview.imageDimensionsPixel[1].toLocaleString()} pixels; physical pixel scale is not reported in that viewer. Axon and myelin masks in the documented pipeline come from a separate segmentation tool.
      </p>
      <ul aria-label="MicroStructFormer model output classes">
        {reference.semanticLabels.filter((label) => label.labelId !== 0).map((label) => <li key={label.labelId}>{label.name}</li>)}
      </ul>
      <div className="microstructformer-reference-boundary" role="note">
        <strong>What this evidence supports</strong>
        <p>{boundary.interpretation}</p>
        <span>No cell, animal, serial-section, or interneuron identity is exposed by the dataset row; the mask is a semantic image label, not a neuron reconstruction. We did not download the 5.69 GB repository or copy images, masks, model weights, or predictions.</span>
      </div>
      <div className="microstructformer-reference-license">
        <strong>{reference.modelAndLicense.datasetLicense}</strong>
        <span>{reference.modelAndLicense.redistributionConditions} Model/software terms are separate; this atlas links to the source and does not redistribute the assets.</span>
      </div>
      <nav aria-label="MicroStructFormer primary source links">
        {reference.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}
      </nav>
    </details>
  );
}
