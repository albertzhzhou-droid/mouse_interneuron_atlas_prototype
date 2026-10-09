import populationContext from "../data/pkd2l1-independent-population-context-0.1.json";

function statistic(value: { mean: number; standardDeviation: number; minimum: number; maximum: number }) {
  return {
    summary: `${value.mean} ± ${value.standardDeviation}`,
    range: `[${value.minimum}; ${value.maximum}]`,
  };
}

export default function Pkd2l1IndependentPopulationContext() {
  return (
    <aside
      className="pkd2l1-independent-population-context"
      aria-labelledby="pkd2l1-independent-context-heading"
      data-research-upgrade-id="UPG-234"
      data-context-id={populationContext.contextId}
    >
      <header>
        <div>
          <span>INDEPENDENT STUDY · POPULATION SUMMARY · NOT A CELL RECONSTRUCTION</span>
          <h4 id="pkd2l1-independent-context-heading">PKD2L1⁺ cells around the central canal</h4>
          <p>Published mouse cohort context, shown alongside the Crozat profile without merging the studies or their cell records.</p>
        </div>
        <div className="pkd2l1-independent-context-sample" aria-label="Study sample frame">
          <strong>{populationContext.studyFrame.mouseCount} mice</strong>
          <span>{populationContext.studyFrame.sectionCount.toLocaleString("en-US")} sections · ages 3 and 8 weeks</span>
        </div>
      </header>

      <div className="pkd2l1-independent-context-table-wrap">
        <table>
          <caption>Table 5 · mean ± standard deviation [minimum; maximum], transcribed from the article</caption>
          <thead>
            <tr>
              <th scope="col">Separate stratum</th>
              <th scope="col">PKD2L1⁺ cells / section</th>
              <th scope="col">Centroid distance to canal centre</th>
            </tr>
          </thead>
          <tbody>
            {populationContext.publishedSummaries.map((row) => {
              const cells = statistic(row.pkd2l1PositiveCellsPerSection);
              const distance = statistic(row.centroidDistanceFromCentralCanalCenterMicrometers);
              return (
                <tr key={`${row.stratum}:${row.group}`}>
                  <th scope="row"><span>{row.stratum.replaceAll("_", " ")}</span><strong>{row.group}</strong></th>
                  <td><strong>{cells.summary}</strong><small>{cells.range}</small></td>
                  <td><strong>{distance.summary} µm</strong><small>{distance.range} µm</small></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="pkd2l1-independent-context-boundary" role="note">
        The 811 sections are nested within 18 mice, not 811 independent animals. Age, sex and region are separate marginal summaries and must not be added together. Distal PKD2L1⁺ cell identity is uncertain in the source; the paper does not assume proximal and distal cells are functionally equivalent. These aggregates provide no per-cell coordinates, cell shape, internal structure or 3D geometry.
      </p>

      <details>
        <summary>Imaging, raw-data availability and source</summary>
        <p>
          {populationContext.imagingMethods.modality}: whole-cord images at {populationContext.imagingMethods.wholeCordImages.magnification} ({populationContext.imagingMethods.wholeCordImages.pixelSizeMicrometers} µm pixels; {populationContext.imagingMethods.wholeCordImages.voxelDepthMicrometers} µm voxel depth) and central-canal images at {populationContext.imagingMethods.centralCanalImages.magnification} ({populationContext.imagingMethods.centralCanalImages.pixelSizeMicrometers} µm pixels; {populationContext.imagingMethods.centralCanalImages.voxelDepthMicrometers} µm voxel depth). These are methods metadata only; raw image files are not included here. The article states: “{populationContext.source.rawDataAvailabilityStatement}” This is not a public repository deposit.
        </p>
        <a href={populationContext.source.articleUrl} target="_blank" rel="noreferrer">
          {populationContext.source.citation} · {populationContext.source.tableLocator} · {populationContext.source.license}
        </a>
      </details>
    </aside>
  );
}
