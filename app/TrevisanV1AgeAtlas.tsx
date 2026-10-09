"use client";

import { useState } from "react";
import ageAtlasReference from "../data/trevisan-v1-age-atlas-reference-0.1.json";
import sourceAudit from "../data/trevisan-v1-source-data-availability-audit-0.1.json";
import geoSampleAudit from "../data/trevisan-v1-geo-series-sample-audit-0.1.json";
import exactInputAudit from "../data/trevisan-v1-exact-input-crosswalk-audit-0.1.json";
import { sourceAuditSampleHref } from "./exact-source-audit-workbench.js";

const AGE_ATLAS = ageAtlasReference;
const SOURCE_AUDIT = sourceAudit;
const GEO_SAMPLE_AUDIT = geoSampleAudit;
const CURRENT_INPUT_AUDIT = exactInputAudit;
const REPRESENTATIVE_SAMPLE = CURRENT_INPUT_AUDIT.samples.find((sample) => sample.geoSampleAccession === CURRENT_INPUT_AUDIT.representativeMatrix.geoSampleAccession)!;

export default function TrevisanV1AgeAtlas() {
  const [selectedClusterId, setSelectedClusterId] = useState(0);
  const selected = AGE_ATLAS.clusters.find((cluster) => cluster.clusterId === selectedClusterId) ?? AGE_ATLAS.clusters[0];
  if (!selected) return null;

  return (
    <section className="trevisan-v1-age-atlas" aria-labelledby="trevisan-v1-age-atlas-heading">
      <header className="trevisan-v1-age-atlas-heading">
        <div>
          <span>UPG-040 · INDEPENDENT ARTICLE-LEVEL REFERENCE</span>
          <h4 id="trevisan-v1-age-atlas-heading">Postnatal spinal V1 interneuron clusters</h4>
          <p>
            A source-bounded molecular reference for one lineage. It supplements—but is not added to—the {AGE_ATLAS.admissionBoundary.includedInExisting387ProfileDenominator ? "canonical profile total" : "existing 387-profile total"}.
          </p>
        </div>
        <nav aria-label="Trevisan V1 source links">
          <a href={AGE_ATLAS.source.articleUrl} target="_blank" rel="noreferrer">Article</a>
          <a href={AGE_ATLAS.source.geoUrl} target="_blank" rel="noreferrer">GEO: {AGE_ATLAS.source.geoAccession}</a>
          <a href={AGE_ATLAS.source.interactiveUrl} target="_blank" rel="noreferrer">Interactive source</a>
          <a href={SOURCE_AUDIT.source.analysisRepositoryUrl} target="_blank" rel="noreferrer">Analysis code (MIT)</a>
        </nav>
      </header>

      <div className="trevisan-v1-age-atlas-summary" aria-label="Study-level counts">
        <span><strong>{AGE_ATLAS.study.selectedNucleusCount.toLocaleString("en-US")}</strong> selected V1 nuclei, study-wide</span>
        <span><strong>{AGE_ATLAS.study.reportedClusterCount}</strong> reported clusters</span>
        <span><strong>{AGE_ATLAS.study.postnatalAges.join(" · ")}</strong> sampled ages</span>
        <span><strong>{AGE_ATLAS.study.independentTranscriptomicReplicates}</strong> independent transcriptomic replicates</span>
      </div>

      <p className="trevisan-v1-age-atlas-boundary" role="note">
        Supplementary Data 3 has been checked as four final-figure barcode sheets; its nucleus roster is not admitted here. Exact cluster counts and per-nucleus age/cluster/region assignments remain unverified. The article reports the largest-to-smallest cluster range as {AGE_ATLAS.study.clusterSizeRange.largestClusterPercent}% (#{AGE_ATLAS.study.clusterSizeRange.largestClusterId}) to {AGE_ATLAS.study.clusterSizeRange.smallestClusterPercent}% (#{AGE_ATLAS.study.clusterSizeRange.smallestClusterId}); this is not a per-cell roster.
      </p>

      <section className="trevisan-v1-source-audit" aria-labelledby="trevisan-v1-source-audit-heading">
        <header>
          <div>
            <span>UPSTREAM AVAILABILITY ≠ IMPORTED RECORDS</span>
            <h5 id="trevisan-v1-source-audit-heading">What the current source inputs establish</h5>
          </div>
          <a href={SOURCE_AUDIT.source.analysisRepositoryLicenseUrl} target="_blank" rel="noreferrer">Code license</a>
        </header>
        <div className="trevisan-v1-source-audit-grid">
          <article>
            <h6>Published inputs</h6>
            <p>The paper reports raw sequencing, count tables and associated metadata in GEO, and points to Supplementary Data 3 for unique final-figure cell barcodes.</p>
          </article>
          <article>
            <h6>Reconstruction mechanics in public code</h6>
            <p>
              The public integration script references <code>{SOURCE_AUDIT.verifiedUpstreamAvailability.integrationScriptReferencesInputs.join(" + ")}</code> and groups cells by {SOURCE_AUDIT.verifiedUpstreamAvailability.publishedScriptCellMetadataFields.map((field) => <code key={field}>{field}</code>)}. The inspected repository directory contains the script, not a prebuilt integrated object.
            </p>
            <p>
              Its loader expects <code>{SOURCE_AUDIT.verifiedUpstreamAvailability.matrixLoadingFunctionDiscoversDirectorySuffix}</code> directories and defaults to <code>{SOURCE_AUDIT.verifiedUpstreamAvailability.matrixLoadingFunctionReadMethod}</code> at <code>{SOURCE_AUDIT.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultPathSuffix}</code>; the default Seurat filters are {SOURCE_AUDIT.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultMinCells} cells per feature and {SOURCE_AUDIT.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultMinFeatures} features per cell. A second helper derives age, region and replicate from the sample-name string. <a href={SOURCE_AUDIT.source.matrixLoadingFunctionUrl} target="_blank" rel="noreferrer">Loader function</a> · <a href={SOURCE_AUDIT.source.metadataDerivationFunctionUrl} target="_blank" rel="noreferrer">Metadata function</a>
            </p>
          </article>
          <article>
            <h6>Import gate</h6>
            <p>
              All {CURRENT_INPUT_AUDIT.summary.sampleCharacteristicsChecked} GEO sample characteristics have been checked from the original source fields. Four workbook sheets, {CURRENT_INPUT_AUDIT.summary.nativeBarcodeFileCount} original barcode files and one representative matrix were checked as inputs. The title parser is not used to assign age or region. Most final-figure barcodes do not match the deposited native columns, and no cluster-label column is supplied; the per-nucleus mapping remains held. GEO file-specific reuse terms {SOURCE_AUDIT.notYetVerifiedOrImported.geoFileSpecificReuseTermsVerified ? "are verified" : "remain unverified"}. The article and code licenses do not by themselves establish GEO-file reuse terms.
            </p>
            <p><a href="/source-audits#source-exact-inputs">Inspect the 29 exact source samples and their field locators</a>.</p>
            <details><summary>Earlier source-availability audit</summary><p>That earlier audit recorded title-parser validation as {SOURCE_AUDIT.notYetVerifiedOrImported.sampleIdentifierParsingValidatedAgainstAllGeoRecords ? "complete" : "incomplete"}, and barcode-to-matrix mapping as {SOURCE_AUDIT.notYetVerifiedOrImported.barcodeToCountMatrixRowCrosswalkValidated ? "validated" : "unvalidated"}. The current original-input checks above supersede its limited sample inspection; they do not admit a nucleus roster.</p></details>
            <p>Current audit: {CURRENT_INPUT_AUDIT.auditDate}.
            </p>
          </article>
        </div>
      </section>

      <section className="trevisan-v1-geo-sample-audit" aria-labelledby="trevisan-v1-geo-sample-audit-heading">
        <header>
          <div>
            <span>GEO SAMPLE ROSTER · SAMPLE-LEVEL ONLY</span>
            <h5 id="trevisan-v1-geo-sample-audit-heading">Checked GEO sample conditions and parser exceptions</h5>
          </div>
          <a href={GEO_SAMPLE_AUDIT.source.seriesUrl} target="_blank" rel="noreferrer">Official GEO series</a>
        </header>
        <div className="trevisan-v1-geo-sample-audit-summary">
          <span><strong>{GEO_SAMPLE_AUDIT.source.seriesSampleRecordCount}</strong> GEO sample records listed</span>
          <span><strong>{GEO_SAMPLE_AUDIT.analysisCodeParser.sampleTitlePatternMatchCount}</strong> titles fit the expected postnatal pattern</span>
          <span><strong>{GEO_SAMPLE_AUDIT.analysisCodeParser.sampleTitlePatternExceptionCount}</strong> title exceptions</span>
          <span><strong>{(GEO_SAMPLE_AUDIT.source.seriesSupplementaryTarBytes / 1_000_000_000).toFixed(2)} GB</strong> supplementary TAR listed by GEO</span>
        </div>
        <p className="trevisan-v1-geo-sample-audit-boundary" role="note">
          All {CURRENT_INPUT_AUDIT.summary.sampleCharacteristicsChecked} sample characteristics are now checked. The earlier title-pattern count is not a cell roster: every exception below is labeled “Whole cord” in its exact GEO fields, while the public string parser returns different values. E13.5 remains embryonic. These parser differences are not biological changes or cluster assignments.
        </p>
        <div className="trevisan-v1-geo-sample-audit-grid">
          <article>
            <h6>Exception records</h6>
            <ul>
              {GEO_SAMPLE_AUDIT.sampleTitlePatternExceptionRecords.map((record) => {
                const current = CURRENT_INPUT_AUDIT.samples.find((sample) => sample.geoSampleAccession === record.geoSampleAccession);
                return <li key={record.geoSampleAccession}>
                  <a href={`${GEO_SAMPLE_AUDIT.source.sampleRecordBaseUrl}${record.geoSampleAccession}`} target="_blank" rel="noreferrer">{record.geoSampleAccession} · {record.sampleTitle}</a>
                  <span>GEO: {record.geoAge} · {record.geoRegion} · replicate {record.geoReplicate}</span>
                  <span>String parser: age {record.parserAge} · region “{record.parserRegion}” · replicate {record.parserReplicate}</span>
                  {current && <a href={sourceAuditSampleHref(CURRENT_INPUT_AUDIT, current)}>Inspect this exact checked sample</a>}
                </li>;
              })}
            </ul>
          </article>
          <article>
            <h6>One structurally checked source matrix</h6>
            <p>
              <a href={`${GEO_SAMPLE_AUDIT.source.sampleRecordBaseUrl}${GEO_SAMPLE_AUDIT.source.representativeSampleMatrixRecord.geoSampleAccession}`} target="_blank" rel="noreferrer">{GEO_SAMPLE_AUDIT.source.representativeSampleMatrixRecord.geoSampleAccession} · {GEO_SAMPLE_AUDIT.source.representativeSampleMatrixRecord.sampleTitle}</a> lists Cell Ranger filtered-feature/barcode matrix components: {GEO_SAMPLE_AUDIT.source.representativeSampleMatrixRecord.components.map((file) => <code key={file.kind}>{file.kind} {file.bytes.toLocaleString("en-US")} B</code>)}.
            </p>
            <p>The original {CURRENT_INPUT_AUDIT.representativeMatrix.sourceFile} was downloaded and SHA-256 checked. All {CURRENT_INPUT_AUDIT.representativeMatrix.observedNonzeroEntryCount.toLocaleString("en-US")} sparse entries passed structural checks across {CURRENT_INPUT_AUDIT.representativeMatrix.featureRowCount.toLocaleString("en-US")} features and {CURRENT_INPUT_AUDIT.representativeMatrix.barcodeColumnCount.toLocaleString("en-US")} native columns. This proves input structure; its final-figure biological mapping remains conflicted.</p>
            <p><a href={sourceAuditSampleHref(CURRENT_INPUT_AUDIT, REPRESENTATIVE_SAMPLE)}>Inspect the exact {REPRESENTATIVE_SAMPLE.sampleTitle} source sample</a>. Raw GEO files remain local audit inputs outside public assets.</p>
          </article>
          <article>
            <h6>Still blocked from import</h6>
            <p>
              The current checks admit no runtime nucleus roster, exact cluster assignment or per-animal identity. {CURRENT_INPUT_AUDIT.summary.sourceBarcodeMissingRowsAcrossSeparateSheets.toLocaleString("en-US")} final-workbook rows fail exact native-column matching across the separate sheets, and 28 separately named barcode files share identical bytes. The cause is unresolved. E13.5 has 6,676 exact matches but still lacks cluster labels and cleared file reuse. Article and repository-code licenses do not establish reuse terms for the GEO files.
            </p>
            <p><strong>No new source profiles, morphology, internal structures, same-cell joins or 3D registrations are admitted.</strong></p>
          </article>
        </div>
      </section>

      <div className="trevisan-v1-age-atlas-workspace">
        <div className="trevisan-v1-age-atlas-clusters" role="group" aria-label="Select one of the 14 article-reported V1 clusters">
          {AGE_ATLAS.clusters.map((cluster) => (
            <button
              key={cluster.clusterId}
              type="button"
              aria-pressed={selected.clusterId === cluster.clusterId}
              onClick={() => setSelectedClusterId(cluster.clusterId)}
            >
              <strong>Cluster #{cluster.clusterId}</strong>
              <span>{cluster.sourceAssignment}</span>
            </button>
          ))}
        </div>

        <article className="trevisan-v1-age-atlas-dossier" aria-live="polite" aria-label={`Evidence for V1 cluster ${selected.clusterId}`}>
          <header>
            <div>
              <span>ARTICLE-REPORTED CLUSTER</span>
              <h5>Cluster #{selected.clusterId}</h5>
            </div>
            <strong>{selected.sourceAssignment}</strong>
          </header>
          <dl>
            <div>
              <dt>Marker evidence</dt>
              <dd>{selected.markerEvidence.map((marker) => <code key={marker}>{marker}</code>)}</dd>
            </div>
            <div>
              <dt>Source qualification</dt>
              <dd>{selected.sourceNote}</dd>
            </div>
            <div>
              <dt>Evidence locator</dt>
              <dd>{selected.sourceLocator}</dd>
            </div>
            <div>
              <dt>Age representation</dt>
              <dd>{AGE_ATLAS.study.ageCoverageDescription}</dd>
            </div>
          </dl>
          <p className="trevisan-v1-age-atlas-no-geometry">
            <strong>No cell form or internal detail admitted.</strong> A transcriptomic cluster is not an individual reconstruction; this selection is not represented in the main 3D scene.
          </p>
        </article>
      </div>

      <footer className="trevisan-v1-age-atlas-footer">
        <p>{AGE_ATLAS.study.regionCoverageDescription}</p>
        <p>
          Attribution: {AGE_ATLAS.source.attribution} <a href={AGE_ATLAS.source.articleLicenseUrl} target="_blank" rel="noreferrer">Article license</a>.
          GEO/raw files remain link-only; no new profile, morphology, internal structure, same-cell join or 3D registration is admitted by this audit.
        </p>
      </footer>
    </section>
  );
}
