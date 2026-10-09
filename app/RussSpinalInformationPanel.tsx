"use client";

import { russHarmonizedTaxonomyCrosswalk, russSpinalInformationAdapter, type RussSpinalInformationPopulation } from "./atlas-types";
import { russPrevalenceDisplay } from "./russ-spinal-information-adapter.js";

const raw = (value: string) => value === "" ? "Blank source value" : value;

export default function RussSpinalInformationPanel({ population }: { population: RussSpinalInformationPopulation }) {
  const sequencing = population.sequencingSampling;
  const table = population.articleTable1;
  const adult = russSpinalInformationAdapter.adultValidationContext;
  const denominator = russSpinalInformationAdapter.sequencingDenominator;
  return <section className="type-record-metadata" aria-label={`Russ source information for ${population.sourceLabelRaw}`} data-source-profile-id={population.id}>
    <h4>Russ source population information</h4>
    <aside className="type-sample-frame" aria-label="Russ sequencing and adult validation scopes">
      <div>
        <span>CAPTURED SEQUENCING OBSERVATIONS</span>
        <strong>{sequencing.value.toLocaleString("en-US")} cells/nuclei</strong>
        <p>Population count within {denominator.value.toLocaleString("en-US")} captured sequenced cells/nuclei across six studies. Independent animals and individual ages are not retained in this aggregate.</p>
        <code>{sequencing.countLocator}</code>
      </div>
      <div>
        <span>ADULT IN SITU PREVALENCE</span>
        <strong>{russPrevalenceDisplay(table.prevalence)}</strong>
        <p>Table1 uses confidently assigned adult neurons; its numerical per-row denominator is not supplied. Sequencing counts remain separate.</p>
        <code>{table.fieldLocators.prevalence}</code>
      </div>
      <div>
        <span>ADULT VALIDATION SOURCE DIFFERENCE</span>
        <strong>{adult.panelCountedCellsSum.toLocaleString("en-US")} panel sum · {adult.articleReportedCountedCells.toLocaleString("en-US")} article total</strong>
        <p>Source values differ by {adult.countDiscrepancy.arithmeticDifference}. Their scope or cause remains unresolved; counts are not harmonized.</p>
        <code>{adult.countDiscrepancy.sourceLocators.join(" · ")}</code>
      </div>
    </aside>
    <details open>
      <summary>Six-study captured sequencing composition</summary>
      <dl className="type-dossier-grid">
        {sequencing.byStudy.map((study) => <div key={study.studyId}>
          <dt>{study.studyLabelRaw}</dt>
          <dd>{study.value.toLocaleString("en-US")} captured cells/nuclei · {study.sourceCompositionPercentRaw}% of this {sequencing.value}-observation population</dd>
          <dd><code>{study.countLocator} · {study.compositionLocator}</code></dd>
        </div>)}
      </dl>
      <p>{denominator.boundary}</p>
      <p>Named denominator: <code>{denominator.id}</code> · <code>{denominator.countLocator}</code></p>
    </details>
    <details open>
      <summary>Raw Table1 spatial and molecular context</summary>
      <dl className="type-dossier-grid">
        <div><dt>Source family</dt><dd>{raw(table.family.raw)}</dd><dd><code>{table.fieldLocators.family}</code></dd></div>
        <div><dt>Source lamina</dt><dd>{raw(table.lamina.raw)} · population context</dd><dd><code>{table.fieldLocators.lamina}</code></dd></div>
        <div><dt>NT marker</dt><dd>{raw(table.rawCells.neurotransmitterMarker)}</dd><dd><code>{table.fieldLocators.neurotransmitterMarker}</code></dd></div>
        <div><dt>Table1 individual marker strings</dt><dd>{table.individualMarkersRaw.map(raw).join(" · ")}</dd><dd><code>{table.fieldLocators.individualMarker1} · {table.fieldLocators.individualMarker2} · {table.fieldLocators.individualMarker3}</code></dd></div>
        <div><dt>Original top-three Wilcoxon markers</dt><dd>{population.existingTopThreeWilcoxonMarkersUnchanged.join(" · ")}</dd><dd><code>{russHarmonizedTaxonomyCrosswalk.source.markerTable.title} · {russHarmonizedTaxonomyCrosswalk.source.markerTable.fileName}</code></dd></div>
        <div><dt>Putative source lineage</dt><dd>{raw(table.putativeLineage.raw)} · exact lineage assignment not established</dd><dd><code>{table.fieldLocators.putativeLineage}</code></dd></div>
        <div><dt>Exact raw-label panel membership</dt><dd>{population.adultPanelMembership.exactRawLabelPanelIds.join(" · ") || population.adultPanelMembership.status.replaceAll("_", " ")}</dd></div>
      </dl>
      <p>{table.markerValidationReason} Raw strings, parentheses and special characters are retained. Panel targets do not establish expression in every named cluster.</p>
      <p>{table.prevalence.denominatorDescription} <code>{table.prevalence.denominatorLocator}</code></p>
      <p>Table1 source annotation conventions: {russSpinalInformationAdapter.derivation.table1FootnoteRaw}</p>
    </details>
    <details>
      <summary>Ten adult in situ panels · shared study context</summary>
      <p>L4 validation sections: {adult.sectionSamplingContext.sourceSectionThicknessRaw}, one counted section per animal, three animals per panel. Source animals were 9 weeks old; this age does not apply to all observations in the six-study harmonization. Motor panel strings {adult.nativePanelAliasesNotNormalized.join(" / ")} remain raw.</p>
      <p><code>{adult.sectionMethodsStatement.locator} · {adult.methodsStatement.locator}</code></p>
      {adult.panels.map((panel) => <details key={panel.panelId}>
        <summary>{panel.sourceLabelRaw} · {panel.countedCells.value} counted adult cells</summary>
        <p>Source cluster strings: {panel.clustersProbedRaw.map((cluster) => cluster.raw).join(" · ")}</p>
        <p><code>{panel.clustersProbedRaw.map((cluster) => cluster.locator).join(" · ")}</code></p>
        <p>These are panel-level counts and targets; no per-population counted-cell value is derived.</p>
        <dl className="type-dossier-grid">
          {Object.entries(panel.assignmentStatistics).map(([key, statistic]) => <div key={key}>
            <dt>{key === "assignedToCluster" ? "Single cluster" : "Single cluster or related pair (cumulative)"}</dt>
            <dd>{Math.round(statistic.value * 100)}% · source fraction {statistic.sourceValueRaw} · source uncertainty {statistic.uncertaintyRaw}</dd>
            <dd><code>{statistic.locator} · {statistic.uncertaintyLocator} · {statistic.interpretationLocator}</code></dd>
          </div>)}
          {panel.targetGenesRaw.map((gene) => <div key={gene.locator}>
            <dt>Raw target: {gene.raw}</dt>
            <dd>Validation status unassessable from the retained color legend</dd>
            <dd>Source font color: <code>{JSON.stringify(gene.fontColorRaw)}</code> · <code>{gene.locator}</code></dd>
          </div>)}
        </dl>
        <p><code>{panel.countedCells.locator}</code></p>
      </details>)}
      <p>Article assignments: {adult.articleReportedSingleClusterAssignedCells} to a single cluster; {adult.articleReportedAdditionalPairAssignedCells} additional to closely related pairs; article counted total {adult.articleReportedCountedCells}. The cumulative panel proportions are not additional-pair-only fractions.</p>
      <p><code>{adult.assignmentStatement.locator} · {adult.panelAssignmentInterpretationLocator}</code></p>
    </details>
    <details>
      <summary>Primary sources and integrity receipts</summary>
      <p><a href={russSpinalInformationAdapter.source.publication.articleUrl} target="_blank" rel="noreferrer">Russ et al. 2021</a> · DOI {russSpinalInformationAdapter.source.publication.doi} · GSE158380</p>
      <dl className="type-dossier-grid">
        {Object.entries(russSpinalInformationAdapter.source.inputs).map(([role, input]) => <div key={role}>
          <dt>{role.replaceAll("_", " ")}</dt><dd>{"sourceUrl" in input ? <a href={input.sourceUrl} target="_blank" rel="noreferrer">{input.fileName}</a> : input.fileName} · {input.bytes.toLocaleString("en-US")} bytes</dd><dd><code>{input.sha256}</code></dd>
        </div>)}
      </dl>
      <p>{russSpinalInformationAdapter.source.rights.article} {russSpinalInformationAdapter.source.rights.geoObjects}</p>
      <p>{adult.boundary}</p>
    </details>
  </section>;
}
