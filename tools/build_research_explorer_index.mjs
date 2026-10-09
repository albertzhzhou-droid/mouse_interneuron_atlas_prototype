#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { attachResearchRecordPresentations } from "../app/research-record-presentation.js";
import { russPrevalenceDisplay, validateRussSpinalInformationAdapter } from "../app/russ-spinal-information-adapter.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT = path.join(ROOT, "public/data/research_explorer_index_v1");
const RELEASE_DATE = "2026-10-04";
const ASSET_SET_ID = "ohri:research-explorer-index:1.14.0";

const INPUTS = {
  atlasRelease: "data/atlas-release-0.1.json",
  researchMvp: "data/research-mvp-release-0.2.json",
  russ: "data/russ-harmonized-taxonomy-crosswalk-0.1.json",
  russInformation: "data/russ-spinal-information-adapter-0.1.json",
  sathyamurthy: "data/sathyamurthy-source-taxonomy-0.1.json",
  hayashiV2a: "data/hayashi-v2a-source-taxonomy-0.1.json",
  haringDorsalHorn: "data/haring-dorsal-horn-source-taxonomy-0.1.json",
  alkaslasi: "data/alkaslasi-cholinergic-source-taxonomy-0.1.json",
  dmrt3Di6: "data/dmrt3-di6-source-taxonomy-0.1.json",
  roomeDil: "data/roome-dil-source-taxonomy-0.1.json",
  delileDevelopmental: "data/delile-developmental-interneuron-taxonomy-0.1.json",
  crozatPkd2l1: "data/crozat-pkd2l1-functional-profile-0.1.json",
  canoGomezP56: "public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json",
  morphologyCensus: "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json",
  morphologyAnalysis: "public/data/neuromorpho_release_8_6_124_analysis_v1/analysis-index.json",
  morphologySupplementary: "data/supplementary-morphology-comparison-adapter-0.1.json",
  morphologySupplementaryAnalysis: "public/data/supplementary_morphology_comparison_v1/analysis-delta.json",
  morphologySourceFrame: "data/morphology-source-frame-disclosure-0.1.json",
  anatomy: "public/data/allen_cord_20um_v3_0/atlas-fine-anatomy.json",
  anatomySource: "public/data/allen_cord_20um_v3_0/source-atlas-manifest.json",
  coverage: "data/interneuron-knowledge-coverage-0.1.json",
  matsonSci: "data/matson-neuronal-sci-timecourse-0.1.json",
};
const EXPECTED_FOCUS_COUNTS = Object.freeze({
  anatomy_label: 73,
  molecular_profile: 387,
  morphology_record: 149,
  sci_entity: 7,
  sci_population: 17,
  source_lane: 8,
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function compact(values) {
  return values.flat(Infinity).filter((value) => value !== null && value !== undefined && value !== "");
}

function uniqueText(values) {
  return [...new Set(compact(values).map((value) => String(value).trim()).filter(Boolean))];
}

function display(value) {
  if (value === null || value === undefined || value === "") return "Not established";
  if (Array.isArray(value)) return value.length ? value.map(display).join(" · ") : "Not established";
  if (typeof value === "object") {
    if ("value" in value) return value.value === null ? display(value.missingReason) : display(value.value);
    return JSON.stringify(value);
  }
  return String(value).replaceAll("_", " ");
}

function metric(value, unit = "") {
  if (!Number.isFinite(value)) return "Not established";
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
}

function field(label, value, authority = "source_reported", locator = null) {
  return { label, value: display(value), authority, locator };
}

function exactTextField(label, values, authority = "source_reported", locator = null) {
  const value = Array.isArray(values) ? values.map(String).join(" · ") : String(values);
  return { label, value, authority, locator };
}

function verbatimField(label, value, authority = "source_reported", locator = null) {
  return { label, value: String(value), authority, locator };
}

const MISSINGNESS_REASON_CODES = Object.freeze([
  "source_not_reported",
  "source_schema_no_field",
  "repository_object_unavailable",
  "not_measured_by_study",
  "not_ingested",
  "relationship_not_established",
  "no_admitted_transform",
  "qc_quarantined",
  "rights_not_cleared",
  "unresolved_source_conflict",
  "not_applicable",
]);

const REASON_STATUS = Object.freeze({
  source_not_reported: "unavailable",
  source_schema_no_field: "unavailable",
  repository_object_unavailable: "unavailable",
  not_measured_by_study: "not_measured",
  not_ingested: "not_ingested",
  relationship_not_established: "not_established",
  no_admitted_transform: "not_established",
  qc_quarantined: "quarantined",
  rights_not_cleared: "unavailable",
  unresolved_source_conflict: "unresolved",
  not_applicable: "not_applicable",
});

const LEGACY_REASON_MAP = Object.freeze({
  not_reported: "source_not_reported",
  numeric_age_not_reported_by_source: "source_not_reported",
  not_complete: "source_not_reported",
  not_reconstructed: "source_not_reported",
  not_available_after_pooling: "source_not_reported",
  not_provided_by_official_api_schema: "source_schema_no_field",
  not_available_in_processed_metadata: "source_schema_no_field",
  temporarily_unavailable_from_repository: "repository_object_unavailable",
  not_available_in_public_geo_object: "repository_object_unavailable",
  not_available_as_edge_list: "repository_object_unavailable",
  unavailable: "repository_object_unavailable",
  not_available: "repository_object_unavailable",
  not_available_in_this_record: "not_ingested",
  not_measured: "not_measured_by_study",
  not_estimable_from_enriched_sample: "not_measured_by_study",
  not_retained: "not_ingested",
  pending_curation: "not_ingested",
  not_available_pending_curation: "not_ingested",
  not_ingested: "not_ingested",
  not_established: "relationship_not_established",
  not_linked_in_this_record: "relationship_not_established",
  not_linked_to_sequenced_nuclei: "relationship_not_established",
  not_established_from_captured_nucleus_counts: "not_measured_by_study",
  unresolved_between_local_interneuron_and_projection_neuron: "unresolved_source_conflict",
  unresolved_difference_from_article_report: "unresolved_source_conflict",
  not_applicable: "not_applicable",
  qc_quarantined: "qc_quarantined",
  rights_not_cleared: "rights_not_cleared",
});

function axisId(label) {
  return String(label).trim().replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function missingnessReasonCode(label, legacyStatus) {
  if (MISSINGNESS_REASON_CODES.includes(legacyStatus)) return legacyStatus;
  if (legacyStatus === "not_established" || legacyStatus === "not_available") {
    if (/atlas|registration|transform|placement/i.test(label)) return "no_admitted_transform";
    if (/same.?cell|cross.?source|molecular.?profile identity|projection tracing/i.test(label)) return "relationship_not_established";
  }
  if (legacyStatus === "not_established") {
    if (/independent animal|sampling denominator/i.test(label)) return "source_not_reported";
    if (/biological prevalence|SCI context/i.test(label)) return "not_measured_by_study";
  }
  const reasonCode = LEGACY_REASON_MAP[legacyStatus];
  if (!reasonCode) throw new Error(`Unknown legacy missingness status ${legacyStatus} for ${label}`);
  return reasonCode;
}

function missingnessScope(reasonCode) {
  if (["relationship_not_established", "no_admitted_transform"].includes(reasonCode)) return "shared_project_limit";
  if (["source_schema_no_field", "not_measured_by_study", "not_ingested", "rights_not_cleared"].includes(reasonCode)) return "shared_dataset_limit";
  return "record_specific";
}

function missingnessAuthority(reasonCode) {
  if (["relationship_not_established", "no_admitted_transform"].includes(reasonCode)) return "project_relationship_policy";
  if (["not_ingested", "qc_quarantined", "rights_not_cleared"].includes(reasonCode)) return "project_curation_policy";
  if (reasonCode === "repository_object_unavailable") return "repository_deposit";
  if (reasonCode === "not_applicable") return "record_semantics";
  return "source_record";
}

function gap(label, legacyStatus, detail, overrides = {}) {
  const reasonCode = missingnessReasonCode(label, legacyStatus);
  return {
    axisId: overrides.axisId ?? axisId(label),
    label,
    status: REASON_STATUS[reasonCode],
    reasonCode,
    scope: overrides.scope ?? missingnessScope(reasonCode),
    authority: overrides.authority ?? missingnessAuthority(reasonCode),
    sourceLocator: overrides.sourceLocator ?? null,
    rawValue: overrides.rawValue ?? legacyStatus,
    detail: display(detail),
    inferenceAllowed: false,
  };
}

function canonicalTransmitterValue(transmitterClass, molecularClass = null) {
  const transmitter = String(transmitterClass ?? "").toLowerCase();
  const molecular = String(molecularClass ?? "").toLowerCase();
  if (transmitter === "mixed_cluster") return "Mixed transmitter cluster (source reported)";
  if (transmitter.includes("cholinergic") && transmitter.includes("excitatory")) return "Cholinergic / predominantly excitatory";
  if (transmitter.includes("cholinergic")) return "Cholinergic";
  if (transmitter.includes("inhibitory")) {
    if (transmitter.includes("gaba") || molecular.includes("gaba")) return "Inhibitory / GABAergic";
    if (transmitter.includes("reported")) return "Inhibitory (source reported)";
    return "Inhibitory";
  }
  if (transmitter.includes("excitatory")) {
    return molecular.includes("glut") ? "Excitatory / glutamatergic" : "Excitatory";
  }
  throw new Error(`Unsupported canonical transmitter class: ${transmitterClass}`);
}

function ensureMolecularInternalStructureGap(record) {
  if (record.focusKind !== "molecular_profile") return record;
  const existing = record.gaps.filter((item) => item.axisId === "internal_structure" || item.label === "Internal structure");
  if (existing.length === 1 && existing[0].label === "Internal structure") return record;
  if (existing.length > 0) {
    return {
      ...record,
      gaps: record.gaps.map((item) => existing.includes(item)
        ? { ...item, axisId: "internal_structure", label: "Internal structure", inferenceAllowed: false }
        : item),
    };
  }
  const sourceLocator = record.provenance.locators?.[0]
    ?? record.provenance.doi
    ?? record.provenance.urls?.[0]?.url
    ?? record.namespace;
  return {
    ...record,
    gaps: [
      ...record.gaps,
      gap(
        "Internal structure",
        "source_schema_no_field",
        "This source-profile contract exposes no linked membrane, nucleus, organelle, synapse, receptor-distribution or intracellular-compartment object; no internal detail may be inferred.",
        { axisId: "internal_structure", sourceLocator },
      ),
    ],
  };
}

function sourceBlock({ label, citation = null, doi = null, urls = [], accessions = [], locators = [], objectHashes = [] }) {
  return { label, citation, doi, urls, accessions, locators, objectHashes };
}

function exactCellLocator(locator) {
  if (!locator) return null;
  return `${locator.sourceObjectId} · ${locator.sheet}!${locator.cell} · ${locator.sourceLocatorId}`;
}

function humanizeKey(value) {
  if (value === "sciContext") return "SCI context";
  const text = String(value).replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").toLowerCase();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function recordBase({ focusKind, focusId, title, subtitle, namespace, laneLabel, summary, searchTerms, evidence, gaps, provenance, coordinate, boundary, navigation, recordSemantics = null, morphologyMembership = null }) {
  const fallbackLocator = provenance.locators?.[0] ?? provenance.doi ?? provenance.urls?.[0]?.url ?? namespace;
  return {
    key: `${focusKind}:${focusId}`,
    focusKind,
    focusId: String(focusId),
    title,
    subtitle,
    namespace,
    laneLabel,
    summary,
    ...(recordSemantics ? { recordSemantics } : {}),
    ...(morphologyMembership ? { morphologyMembership } : {}),
    searchTerms: uniqueText([title, subtitle, namespace, laneLabel, searchTerms]),
    evidence,
    gaps: gaps.map((item) => ({ ...item, sourceLocator: item.sourceLocator ?? fallbackLocator })),
    provenance,
    coordinate,
    relationshipStatus: "not_established_outside_this_source_record",
    boundary,
    navigation,
  };
}

async function loadInputs() {
  const loaded = {};
  const sourceFiles = [];
  for (const [name, relativePath] of Object.entries(INPUTS)) {
    const absolutePath = path.join(ROOT, relativePath);
    const bytes = await readFile(absolutePath);
    loaded[name] = JSON.parse(bytes.toString("utf8"));
    sourceFiles.push({ name, path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) });
  }
  return { loaded, sourceFiles };
}

function buildSciEvidenceRecords(atlasRelease, researchMvp) {
  const mvpEntityById = new Map(researchMvp.entities.map((entity) => [entity.id, entity]));
  const claimById = new Map(researchMvp.claims.map((claim) => [claim.id, claim]));
  const conditionById = new Map(researchMvp.conditions.map((condition) => [condition.id, condition]));
  return atlasRelease.entities.map((entity) => {
    const mvpEntity = mvpEntityById.get(entity.id);
    const claims = (mvpEntity?.claimIds ?? []).map((id) => claimById.get(id)).filter(Boolean);
    const conditions = uniqueText(claims.flatMap((claim) => claim.conditionIds)).map((id) => conditionById.get(id)).filter(Boolean);
    const sourceTerms = uniqueText([entity.citation, entity.doi, entity.ledgerId, claims.flatMap((claim) => claim.sourceIds), conditions.flatMap((condition) => condition.statementIds)]);
    const sampleSizes = conditions.map((condition) => display(condition.sampleSize));
    return recordBase({
      focusKind: "sci_entity",
      focusId: entity.id,
      title: entity.name,
      subtitle: `${entity.shortLabel} · ${display(entity.entityKind)}`,
      namespace: "ohri-research-mvp-0.2",
      laneLabel: "SCI evidence",
      summary: entity.allowedClaim,
      searchTerms: [entity.shortLabel, entity.markers, entity.classificationAxes, entity.segmentLabel, entity.lamina, entity.injuryType, entity.endpoint, sourceTerms],
      evidence: [
        field("Entity kind", entity.entityKind, "project_curated", entity.ledgerId),
        field("Classification axes", entity.classificationAxes, "project_curated", entity.ledgerId),
        field("Markers", entity.markers.length ? entity.markers : "Not reported", "source_reported", entity.ledgerId),
        field("Transmitter context", entity.transmitter, "project_curated", entity.ledgerId),
        field("Segment context", `${entity.segmentGroup} · ${entity.segmentLabel}`, "source_reported", entity.ledgerId),
        field("Injury model", entity.injuryType, "source_reported", entity.ledgerId),
        field("Endpoint", entity.endpoint, "source_reported", entity.ledgerId),
        field("Causal grade", entity.claimGrades, "project_curated", entity.ledgerId),
        field("Experimental condition", conditions.map((condition) => `${condition.injuryLevel}; ${condition.intervention}`), "source_reported", conditions.map((condition) => condition.id).join(" · ")),
        field("Sample-size reporting", sampleSizes, "source_reported", conditions.map((condition) => condition.id).join(" · ")),
      ],
      gaps: [
        gap("Atlas placement", "not_established", "The SCI evidence entity is displayed in a separate synthetic lane; no transform links it to atlas anatomy."),
        gap("Same-cell molecular or morphology link", "not_established", entity.notEstablished),
        ...conditions.filter((condition) => condition.sampleSize?.value === null).map((condition) => gap("Condition sample size", condition.sampleSize.missingReason, condition.id, { sourceLocator: condition.id, rawValue: null })),
      ],
      provenance: sourceBlock({
        label: entity.citation,
        citation: entity.citation,
        doi: entity.doi,
        urls: [{ label: "Primary article", url: entity.sourceUrl }],
        locators: uniqueText([entity.ledgerId, claims.map((claim) => claim.id), conditions.map((condition) => condition.id)]),
      }),
      coordinate: {
        geometryStatus: entity.geometry.status,
        frame: "separate_unregistered_synthetic_evidence_lane",
        registrationStatus: "unregistered",
        registrationCount: 0,
        measurementUse: "forbidden",
      },
      boundary: `This record supports only the stated source- and condition-bounded claim. ${entity.notEstablished}`,
      navigation: { lab: "overview", params: { cell: entity.id, panel: "evidence" }, anchor: "sci-evidence-workspace" },
    });
  });
}

function buildRussRecords(russ, information, informationSha256) {
  validateRussSpinalInformationAdapter(information, russ);
  const informationByLabel = new Map(information.populations.map((row) => [row.sourceLabelRaw, row]));
  const denominator = information.sequencingDenominator;
  const adult = information.adultValidationContext;
  const adultPanelEvidence = adult.panels.map((panel) => field(
    `Adult in situ panel context · ${panel.sourceLabelRaw}`,
    `Raw cluster strings: ${panel.clustersProbedRaw.map((cluster) => cluster.raw).join(" · ")}; ${panel.countedCells.value} counted adult cells from three animals, one counted L4 section per animal. Raw targets and source font colors: ${panel.targetGenesRaw.map((gene) => `${gene.raw} [${JSON.stringify(gene.fontColorRaw)}]`).join(" · ")}; target validation unassessable from the retained color legend; targets are not assigned to every named cluster. Single-cluster fraction ${panel.assignmentStatistics.assignedToCluster.sourceValueRaw}, source uncertainty ${panel.assignmentStatistics.assignedToCluster.uncertaintyRaw}; cumulative single-cluster-or-related-pair fraction ${panel.assignmentStatistics.assignedToClusterOrPair.sourceValueRaw}, source uncertainty ${panel.assignmentStatistics.assignedToClusterOrPair.uncertaintyRaw}; fractions displayed as percent in the workbook.`,
    "source_panel_context_not_per_population_or_verified_marker",
    `${information.source.inputs.adult_in_situ_panels.fileName}#Sheet1!${panel.countedCells.locator.match(/!([A-Z]+)22$/)[1]}1:${panel.countedCells.locator.match(/!([A-Z]+)22$/)[1]}26; ${adult.sectionMethodsStatement.locator}; ${adult.panelAssignmentInterpretationLocator}`,
  ));
  const groupById = new Map(russ.groups.map((group) => [group.id, group]));
  return russ.populations.map((population) => {
    const group = groupById.get(population.groupId);
    const detail = informationByLabel.get(population.label);
    const sampled = detail.sequencingSampling;
    const table = detail.articleTable1;
    const projectClass = group?.interneuronCandidate
      ? "source-local interneuron or projection-neuron candidate"
      : "source context excluded from interneuron-candidate count";
    return recordBase({
      focusKind: "molecular_profile",
      focusId: `russ-2021:${population.label}`,
      title: population.label,
      subtitle: `${group?.label ?? population.groupId} · Russ 2021`,
      namespace: "russ-2021",
      laneLabel: "Molecular population",
      summary: `${projectClass}. Marker context is not an exact identity rule.`,
      recordSemantics: {
        parentSourceId: "SRC-RUSS-2021",
        recordKind: "harmonized_population",
        unitOfObservation: "source_population",
        assignmentAuthority: "published_harmonized_taxonomy",
        cellRosterAvailability: "no_roster_retained",
        canonicalIdentityStatus: "not_established",
      },
      searchTerms: [population.id, population.primaryMarkers, table.individualMarkersRaw, table.family.raw, table.lamina.raw, table.rawCells.neurotransmitterMarker, table.putativeLineage.raw, detail.adultPanelMembership.exactRawLabelPanelIds, group?.regionClass, group?.transmitterClass, russ.source.publication.citation, russ.source.publication.doi, russ.source.processedCounts.accession],
      evidence: [
        field("Canonical parent source", "SRC-RUSS-2021", "project_source_registry", "UPG-108"),
        field("Record granularity", "harmonized population · observation unit: source population", "project_curated", "UPG-109"),
        field("Assignment / roster", "published harmonized taxonomy · no roster retained", "source_and_project_boundary", "UPG-109"),
        field("Source-local label", population.label, "source_reported", "Supplementary Table 1"),
        field("Canonical transmitter", canonicalTransmitterValue(group?.transmitterClass), "source_reported", "Results; Supplementary Table 1"),
        field("Source group", group?.label, "source_reported", "Results; Fig. 2"),
        field("Primary markers", population.primaryMarkers, "source_reported", russ.source.markerTable.title),
        field("Exact captured-cell/nucleus count", `${sampled.value} captured sequenced cells/nuclei · denominator ${denominator.value.toLocaleString("en-US")} captured observations across six studies; independent animals and adult prevalence remain separate`, "source_reported_captured_sequencing_observations", sampled.countLocator),
        field("Named sequencing denominator", `${denominator.id}: ${denominator.value} captured sequenced cells/nuclei across ${denominator.studies.map((study) => `${study.sourceLabelRaw}=${study.value}`).join(" · ")}; no individual age or animal-resolved replication assigned`, "source_harmonized_sequencing_denominator", denominator.countLocator),
        ...sampled.byStudy.map((study) => field(`Captured sequencing contribution · ${study.studyLabelRaw}`, `${study.value} captured sequenced cells/nuclei · ${study.sourceCompositionPercentRaw}% of this ${sampled.value}-observation population; sampled zero is not biological absence`, "source_study_composition_within_population", `${study.countLocator}; ${study.compositionLocator}`)),
        field("Raw Table1 family", table.family.raw || "Blank source value", "source_population_family_context", table.fieldLocators.family),
        field("Raw Table1 lamina", `${table.lamina.raw || "Blank source value"}; adult source-population context, no individual coordinate`, "source_population_spatial_context", table.fieldLocators.lamina),
        field("Raw Table1 NT marker", table.rawCells.neurotransmitterMarker || "Blank source value", "source_marker_string_not_validated_gene_identity", table.fieldLocators.neurotransmitterMarker),
        field("Raw Table1 individual markers", `${table.individualMarkersRaw.map((value) => value || "Blank source value").join(" · ")}; validation unassessable because text XML loses gray styling`, "source_raw_combinatorial_marker_strings_validation_unassessable", `${table.fieldLocators.individualMarker1}; ${table.fieldLocators.individualMarker2}; ${table.fieldLocators.individualMarker3}`),
        field("Raw Table1 adult prevalence", russPrevalenceDisplay(table.prevalence), "source_adult_prevalence_numeric_denominator_not_supplied", `${table.fieldLocators.prevalence}; ${table.prevalence.denominatorLocator}`),
        field("Raw Table1 putative lineage", `${table.putativeLineage.raw || "Blank source value"}; source transcriptomic context, exact lineage assignment not established`, "source_putative_transcriptomic_context", table.fieldLocators.putativeLineage),
        field("Selected raw-label panel membership", detail.adultPanelMembership.exactRawLabelPanelIds.join(" · ") || `${detail.adultPanelMembership.status}; no biological-absence or per-cell claim`, "exact_raw_source_label_context_only", `${INPUTS.russInformation}#populations[sourceLabelRaw=${population.label}]/adultPanelMembership`),
        field("Table1 annotation conventions", information.derivation.table1FootnoteRaw, "source_table1_annotation_conventions", information.derivation.table1FootnoteLocator),
        field("Adult in situ validation sampling", `9-week validation animals; L4 ${adult.sectionSamplingContext.sourceSectionThicknessRaw} sections; one counted section per animal, three animals per panel. This context does not assign age or L4 to every observation in the six-study sequencing dataset`, "separate_adult_validation_cohort_context", `${adult.methodsStatement.locator}; ${adult.sectionMethodsStatement.locator}`),
        field("Adult in situ counted-source discrepancy", `${adult.panelCountedCellsSum} Supplement3 panel sum versus ${adult.articleReportedCountedCells} article counted total; difference ${adult.countDiscrepancy.arithmeticDifference}; cause unresolved and counts not harmonized`, "unresolved_source_scope_or_value_difference", adult.countDiscrepancy.sourceLocators.join("; ")),
        field("Adult article assignment counts", `${adult.articleReportedSingleClusterAssignedCells} single-cluster assigned and ${adult.articleReportedAdditionalPairAssignedCells} additional related-pair assigned out of ${adult.articleReportedCountedCells} article counted cells; these do not supply Table1 numerical per-row prevalence denominators`, "separate_article_adult_assignment_scope", adult.assignmentStatement.locator),
        ...adultPanelEvidence,
        field("Region class", group?.regionClass, "source_reported", "Fig. 2e; Table 1"),
        field("Transmitter class", group?.transmitterClass, "source_reported", "Results; Supplementary Table 1"),
        field("Life-stage scope", russ.scope.lifeStage, "source_reported", "Study design"),
        field("Project use", projectClass, "project_curated", "UPG-027A"),
      ],
      gaps: [
        gap("Sequenced-cell identity roster", "not_retained", "Population counts do not retain individual sequenced cells/nuclei or animal-resolved replicates."),
        gap("Adult prevalence numerical denominator", "source_schema_no_field", "Table1 footnote retains confidently assigned adult-neuron scope without a numerical per-row denominator; neither 19,353 sequencing observations nor 2,894 all counted adult cells substitute.", { sourceLocator: information.derivation.table1FootnoteLocator }),
        gap("Single-cell morphology", "not_measured", "No reconstructable single-neuron arbor is linked to this source population."),
        gap("Cell coordinates", "not_available_in_this_record", "Published population-level spatial context is not a project xyz coordinate."),
        gap("SCI context", "not_established", "The taxonomy reference is not an SCI condition series."),
        gap("Projection target", "not_established", "A molecular cluster label does not determine local-interneuron versus projection-neuron status."),
        gap("Synaptic connectivity", "not_linked_in_this_record", "No same-record connectome is available."),
        gap("Cross-source same-cell identity", "not_established", "No Russ population is declared identical to a Sathyamurthy, morphology, anatomy or SCI record."),
      ],
      provenance: sourceBlock({
        label: "Russ harmonized spinal taxonomy",
        citation: russ.source.publication.citation,
        doi: russ.source.publication.doi,
        urls: [
          { label: "Primary article", url: russ.source.publication.articleUrl },
          { label: "GEO record", url: russ.source.processedCounts.recordUrl },
          ...Object.values(information.source.inputs).filter((input) => input.sourceUrl).map((input) => ({ label: input.fileName, url: input.sourceUrl })),
        ],
        accessions: [russ.source.processedCounts.accession],
        locators: ["Results; Fig. 2", "Supplementary Table 1", sampled.countLocator, table.locator, adult.sectionMethodsStatement.locator],
        objectHashes: [{ label: russ.source.markerTable.fileName, sha256: russ.source.markerTable.sha256 }, { label: INPUTS.russInformation, sha256: informationSha256 }, ...Object.values(information.source.inputs).map((input) => ({ label: input.fileName, sha256: input.sha256 }))],
      }),
      coordinate: {
        geometryStatus: "TYPE_LEVEL",
        frame: "russ_source_namespace",
        registrationStatus: "unregistered",
        registrationCount: 0,
        measurementUse: "forbidden",
      },
      boundary: russ.scope.spatialBoundary,
      navigation: { lab: "types", params: { type: `russ-2021:${population.label}` }, anchor: "types-panel" },
    });
  });
}

function buildSathyamurthyRecords(sathy) {
  const sampleFrame = sathy.source.geo.sampleFrame;
  return sathy.profiles.map((profile) => recordBase({
    focusKind: "molecular_profile",
    focusId: profile.id,
    title: profile.sourceLocalLabel,
    subtitle: `${profile.putativeCellTypeLabel} · Sathyamurthy 2018`,
    namespace: "sathyamurthy-2018",
    laneLabel: "Molecular population",
    summary: profile.projectUseClass === "source_local_non_motor_neuron_unresolved"
      ? "Adult lumbar non-motor spinal-neuron profile; local interneuron versus projection-neuron status is unresolved."
      : "Motor-neuron context retained outside the interneuron candidate count.",
    recordSemantics: {
      parentSourceId: "SRC-SATHYAMURTHY-2018",
      recordKind: "reported_cluster",
      unitOfObservation: "nucleus",
      assignmentAuthority: "checksum_pinned_cluster_metadata",
      cellRosterAvailability: "exact_remote_roster_not_bundled",
      canonicalIdentityStatus: "not_established",
    },
    searchTerms: [profile.rawLabels, profile.figure4Markers, profile.regionClass, profile.transmitterClass, profile.putativeCellTypeLabel, sathy.source.publication.citation, sathy.source.publication.doi, sathy.source.geo.accession],
    evidence: [
      field("Canonical parent source", "SRC-SATHYAMURTHY-2018", "project_source_registry", "UPG-108"),
      field("Record granularity", "reported cluster · observation unit: nucleus", "project_curated", "UPG-109"),
      field("Assignment / roster", "checksum-pinned cluster metadata · exact remote roster not bundled", "source_and_project_boundary", "UPG-109"),
      field("Source-local label", profile.sourceLocalLabel, "source_reported", display(profile.fieldLocators.sourceLocalLabel)),
      field("Canonical transmitter", canonicalTransmitterValue(profile.transmitterClass), "source_reported", display(profile.fieldLocators.transmitterClass)),
      field("Raw label", profile.rawLabels, "source_reported", display(profile.fieldLocators.rawLabels)),
      field("Putative cell type", profile.putativeCellTypeLabel, "source_reported", display(profile.fieldLocators.putativeCellTypeLabel)),
      field("Assignment status", profile.putativeAssignmentStatus, "project_curated", display(profile.fieldLocators.putativeAssignmentStatus)),
      field("Figure/source markers", profile.figure4Markers, "source_reported", display(profile.fieldLocators.figure4Markers)),
      field("Region class", profile.regionClass, "source_reported", display(profile.fieldLocators.regionClass)),
      field("Transmitter class", profile.transmitterClass, "source_reported", display(profile.fieldLocators.transmitterClass)),
      field("Sampled nuclei", `${profile.samplingCount.value} ${profile.samplingCount.unit}`, "source_derived_count", display(profile.fieldLocators.samplingCount)),
      field("Source sample frame", `${sampleFrame.independentDropSeqSampleCount} pooled Drop-Seq samples; ${sampleFrame.micePerPooledSample} mice per sample`, "source_reported", sampleFrame.sourceLocatorIds.join(" · ")),
    ],
    gaps: Object.entries(profile.missingEvidence).map(([label, status]) => gap(label, status, "This axis is unavailable for this source-local profile and must not be inferred from markers.")),
    provenance: sourceBlock({
      label: "Sathyamurthy adult lumbar snRNA-seq",
      citation: sathy.source.publication.citation,
      doi: sathy.source.publication.doi,
      urls: [
        { label: "Primary article", url: sathy.source.publication.articleUrl },
        { label: "GEO record", url: sathy.source.geo.recordUrl },
      ],
      accessions: [sathy.source.geo.accession],
      locators: uniqueText(Object.values(profile.fieldLocators)),
      objectHashes: [{ label: sathy.source.geo.clusterMetadataAsset.fileName, sha256: sathy.source.geo.clusterMetadataAsset.sha256 }],
    }),
    coordinate: {
      geometryStatus: "TYPE_LEVEL",
      frame: "sathyamurthy_source_namespace",
      registrationStatus: "unregistered",
      registrationCount: 0,
      measurementUse: "forbidden",
    },
    boundary: sampleFrame.interpretationBoundary,
    navigation: { lab: "types", params: { type: profile.id }, anchor: "types-panel" },
  }));
}

function buildAlkaslasiRecords(alkaslasi) {
  const sampleFrame = alkaslasi.source.geo.sampleFrame;
  const annotation = alkaslasi.source.geo.annotationAsset;
  const locatorById = new Map(alkaslasi.sourceLocators.map((locator) => [locator.id, locator]));
  return alkaslasi.profiles.map((profile) => {
    const regionCounts = profile.sampleRegionMembership.counts;
    const sexCounts = profile.depositedSexFieldMembership.counts;
    const markerClaims = profile.markerEvidence.map((claim) => claim.claim);
    const figure5aLabels = alkaslasi.articleFigure5aMarkerContext.prominentLabelsByProfile[profile.sourceLocalLabel];
    const resolvedLocators = uniqueText(Object.values(profile.fieldLocators).flat()).map((id) => {
      const locator = locatorById.get(id);
      return locator ? `${id}: ${locator.locator}` : id;
    });
    return recordBase({
      focusKind: "molecular_profile",
      focusId: profile.id,
      title: profile.sourceLocalLabel,
      subtitle: `${profile.putativeCellTypeLabel} · Alkaslasi 2021`,
      namespace: "alkaslasi-2021:GSE167597",
      laneLabel: "Molecular population",
      summary: "Checksum-pinned source-local adult cholinergic I1-I8 cluster. The enriched technical cohort supports exact sample counts, not biological prevalence or 3D placement.",
      recordSemantics: {
        parentSourceId: "SRC-ALKASLASI-2021",
        recordKind: "reported_cluster",
        unitOfObservation: "nucleus",
        assignmentAuthority: "checksum_pinned_annotation_object",
        cellRosterAvailability: "exact_remote_roster_not_bundled",
        canonicalIdentityStatus: "not_established",
      },
      searchTerms: [
        profile.id,
        profile.rawSourceLabels,
        profile.markerPanel,
        figure5aLabels,
        markerClaims,
        profile.articleSpatialContext.value,
        profile.putativeAssignmentStatus,
        "adult cholinergic interneuron Chat-Cre Sun1 FACS",
        "Cervical Thoracic Lumbar lumbar/sacral",
        alkaslasi.source.publication.citation,
        alkaslasi.source.publication.doi,
        alkaslasi.source.publication.pmid,
        alkaslasi.source.geo.displayedCitationPmid,
        alkaslasi.source.geo.accession,
        alkaslasi.source.geo.sraStudyAccession,
        alkaslasi.source.geo.bioProjectAccession,
      ],
      evidence: [
        field("Canonical parent source", "SRC-ALKASLASI-2021", "project_source_registry", "UPG-108"),
        field("Record granularity", "reported cluster · observation unit: nucleus", "project_curated", "UPG-109"),
        field("Assignment / roster", "checksum-pinned annotation object · exact remote roster not bundled", "source_and_project_boundary", "UPG-117"),
        field("Source-local label", profile.sourceLocalLabel, "checksum_pinned_annotation_field", "geo-annotation-object"),
        field("Canonical transmitter", canonicalTransmitterValue(profile.transmitterClass), "source_reported", "paper-main-classification · paper-interneuron-section"),
        field("Exact sampled-nucleus count", `${profile.samplingCount.value} nuclei`, "checksum_pinned_annotation_count", "geo-annotation-object"),
        field("Article marker context", profile.markerPanel, "article_group_or_ish_context_not_per_nucleus", profile.fieldLocators.markerPanel.join(" · ")),
        field("Figure 5a prominent labels", figure5aLabels, "article_figure_display_context_not_unique_markers", alkaslasi.articleFigure5aMarkerContext.sourceLocatorIds.join(" · ")),
        field("Deposited sample-region membership", `Cervical ${regionCounts.Cervical}; Thoracic ${regionCounts.Thoracic}; Lumbar ${regionCounts.Lumbar}; sample membership, not xyz coordinates`, "checksum_pinned_annotation_field", "geo-annotation-object"),
        field("Deposited sex-field membership", `M ${sexCounts.M}; F ${sexCounts.F}; NA ${sexCounts.NA}; NA is preserved, not imputed as mixed-sex`, "checksum_pinned_annotation_field", "geo-annotation-object"),
        field("Article spatial context", `${profile.articleSpatialContext.value}; context only, no per-nucleus coordinate`, profile.articleSpatialContext.authority, profile.articleSpatialContext.sourceLocatorIds.join(" · ")),
        field("Sampling design boundary", "Chat-Cre/Sun1 reporter history plus GFP-positive FACS enrichment; exact sampling counts, not biological prevalence or an unbiased census", "source_and_project_boundary", "paper-results-source-denominators"),
        field("Experimental-unit flow", `${sampleFrame.sourceAnimalCount} mice; matching regions first pooled from ${sampleFrame.matchingRegionMousePoolSize} mice; ${sampleFrame.processingReplicateMouseCount} mice per processing replicate; ${sampleFrame.processingReplicateCount} processing replicates -> ${sampleFrame.geoSampleCount} GEO samples -> ${alkaslasi.scope.sourceTotalQcRetainedNucleusCount} QC-retained nuclei`, "source_reported_distinct_denominators", sampleFrame.sourceLocatorIds.join(" · ")),
        field("Publication identity discrepancy", `Authoritative PMID ${alkaslasi.source.publication.pmid}; GEO currently displays unrelated PMID ${alkaslasi.source.geo.displayedCitationPmid}. ${alkaslasi.source.geo.citationLinkBoundary}`, "source_discrepancy_preserved", "geo-series-record"),
        field("Cholinergic analysis flow", `${alkaslasi.scope.sourceCholinergicNucleusCount} cholinergic nuclei -> ${alkaslasi.scope.sourceInterneuronNucleusCount} I1-I8 nuclei`, "checksum_pinned_source_partition", "geo-annotation-object"),
        field("Remote source-object receipt", `${annotation.fileName}; ${annotation.compressedBytes} bytes; SHA-256 ${annotation.compressedSha256}; bundled ${annotation.sourceFileBundled}`, "checksum_verified_remote_object", annotation.compressedSha256),
        ...(profile.i8ArticleCaution ? [field("I8 evidence caution", profile.i8ArticleCaution, "article_sequence_preserved", "paper-main-classification · paper-figure-5-i8")] : []),
      ],
      gaps: [
        gap("Cell coordinates", profile.missingEvidence.cellCoordinates, "Sample-region membership is not xyz, segment, lamina, centroid, or atlas position."),
        gap("Morphology", profile.missingEvidence.morphology, "No soma or neurite geometry is linked to the sequenced nucleus."),
        gap("Electrophysiology", profile.missingEvidence.electrophysiology, "No same-nucleus electrophysiology is linked."),
        gap("Projection target", profile.missingEvidence.projectionTarget, "No same-nucleus projection tracing is linked."),
        gap("Synaptic connectivity", profile.missingEvidence.synapticConnectivity, "No synaptic edge or partner roster is linked."),
        gap("SCI context", profile.missingEvidence.sciContext, "The source is an uninjured adult molecular taxonomy."),
        gap("Atlas registration", profile.missingEvidence.atlasRegistration, "No transform registers source samples or nuclei to the reference atlas."),
        gap("Internal structure", profile.missingEvidence.intracellularStructures, "No membrane, nucleus geometry, organelle, receptor, bouton, or intracellular-compartment object is linked."),
        gap("Biological prevalence", profile.missingEvidence.biologicalPrevalence, "Reporter history and FACS enrichment prevent an unbiased abundance estimate."),
        gap("Cross-source same-cell or same-type identity", "not_established", "Shared labels or markers do not create an identity or deduplicate source records."),
      ],
      provenance: sourceBlock({
        label: "Alkaslasi adult cholinergic source-local taxonomy",
        citation: alkaslasi.source.publication.citation,
        doi: alkaslasi.source.publication.doi,
        urls: [
          { label: "Primary article", url: alkaslasi.source.publication.articleUrl },
          { label: "GEO record", url: alkaslasi.source.geo.recordUrl },
          { label: "Remote annotation object", url: annotation.downloadUrl },
        ],
        accessions: [alkaslasi.source.geo.accession, alkaslasi.source.geo.sraStudyAccession, alkaslasi.source.geo.bioProjectAccession, `PMID:${alkaslasi.source.publication.pmid}`],
        locators: resolvedLocators,
        objectHashes: [{ label: annotation.fileName, sha256: annotation.compressedSha256, bytes: annotation.compressedBytes }],
      }),
      coordinate: {
        geometryStatus: "TYPE_LEVEL",
        frame: "alkaslasi_adult_cholinergic_source_namespace",
        registrationStatus: "unregistered",
        registrationCount: 0,
        measurementUse: "forbidden",
      },
      boundary: `${profile.sampleRegionMembership.boundary} ${sampleFrame.interpretationBoundary} No morphology, internal structure, synapse, SCI state, cross-source identity, or atlas registration is admitted.`,
      navigation: { lab: "types", params: { type: profile.id }, anchor: "types-panel" },
    });
  });
}

function buildCrozatPkd2l1Records(contract) {
  const profile = contract.profile;
  const firing = contract.derivedEvidence.firingPatterns;
  const passive = contract.derivedEvidence.passivePropertyFrame;
  const rmp = contract.derivedEvidence.restingMembranePotentialFrame;
  const anatomy = contract.derivedEvidence.anatomyContext;
  const locatorById = new Map(contract.sourceLocators.map((locator) => [locator.id, locator]));
  const resolvedLocators = profile.locatorIds.map((id) => {
    const locator = locatorById.get(id);
    return locator ? `${id}: ${locator.locator}` : id;
  });
  const firingSummary = firing.map((row) => `${row.segment}: N=${row.animalCount} animals, n=${row.cellCount} cells (${row.tonicCount} tonic; ${row.singleSpikeCount} single spike)`).join(" · ");
  const anatomyTotals = anatomy.fieldOfViewAndCellTotals.map((row) => `${row.segment}: ${row.fieldOfViewCount} FOV / ${row.cellCount.toLocaleString("en-US")} cells`).join(" · ");
  return [recordBase({
    focusKind: "molecular_profile",
    focusId: profile.id,
    title: profile.sourceLocalLabel,
    subtitle: "Marker-defined functional population · Crozat 2025",
    namespace: profile.namespace,
    laneLabel: "Source functional profile",
    summary: "One source-local PKD2L1-positive CSF-contacting-neuron population with segment-specific anatomy and electrophysiology. Firing patterns, segment rows and quadrant rows remain nested evidence, not new cell types.",
    recordSemantics: {
      parentSourceId: profile.parentSourceId,
      recordKind: profile.recordKind,
      unitOfObservation: profile.unitOfObservation,
      assignmentAuthority: profile.assignmentAuthority,
      cellRosterAvailability: profile.cellRosterAvailability,
      canonicalIdentityStatus: profile.canonicalIdentityStatus,
    },
    searchTerms: [
      profile.id,
      profile.rawLabels,
      profile.markerPanel,
      "PKD2L1 GABA CSF-contacting CSF-cN central canal ventral sensory pH ASIC",
      "cervical thoracic lumbar tonic single spike phasic passive membrane RMP",
      contract.source.publication.citation,
      contract.source.publication.doi,
      contract.source.figshare.doi,
      contract.quarantinedConflicts.map((item) => [item.id, item.detail]),
    ],
    evidence: [
      field("Canonical parent source", profile.parentSourceId, "project_source_registry", "UPG-172"),
      field("Record granularity", "one marker-defined functional population; source-population and experiment-family observations", "source_and_project_boundary", "UPG-172"),
      field("Assignment / roster", "primary article plus checksum-pinned Figshare tables; no global stable cell roster", "source_and_project_boundary", "UPG-172"),
      field("Canonical transmitter", canonicalTransmitterValue(profile.transmitterClass), "source_reported_population_context", "primary-article-results"),
      field("Source markers", profile.markerPanel, "source_reported_population_context", "primary-article-results"),
      field("Life-stage and preparation", `${contract.scope.lifeStage}; ${contract.scope.preparation}`, "source_reported", "primary-article-methods"),
      field("Spinal and anatomy context", `${contract.scope.spinalRegion}; central-canal contacting; primarily ventral; higher lumbar density`, "source_reported_and_checksum_pinned_tables", "anatomy-workbook · cell-distance-csv"),
      field("Electrophysiology evidence", firingSummary, "checksum_pinned_source_cells", "firing-percent-sheet · firing-count-sheet"),
      field("Firing-pattern total", `${contract.derivedEvidence.firingPatternFrame.tonicCount}/${contract.derivedEvidence.firingPatternFrame.totalCellCount} tonic; ${contract.derivedEvidence.firingPatternFrame.singleSpikeCount}/${contract.derivedEvidence.firingPatternFrame.totalCellCount} single spike`, "source_reported_exact_counts", "firing-count-sheet"),
      field("Passive-property denominator", `paper N=${passive.animalCount} animals, n=${passive.articleCellCount} cells; deposited ${passive.depositedUsableRowCount} complete rows`, "source_conflict_preserved", "passive-properties-sheet"),
      field("Resting-membrane-potential denominator", `N=${rmp.animalCount} animals, n=${rmp.observationCount} observations; cervical ${rmp.depositedRowsBySegment.cervical}, thoracic ${rmp.depositedRowsBySegment.thoracic}, lumbar ${rmp.depositedRowsBySegment.lumbar}`, "checksum_pinned_observation_table", "rmp-sheet"),
      field("Anatomy FOV and cell totals", anatomyTotals, "checksum_pinned_source_tables", "anatomy-workbook"),
      field("Anatomy denominator conflict", anatomy.denominatorConflict, "source_conflict_preserved", "anatomy-workbook · cell-distance-csv"),
      field("Sensory context", contract.derivedEvidence.sensoryContext.finding, "source_reported_population_context", "primary-article-results"),
      exactTextField("Quarantined source conflicts", contract.quarantinedConflicts.map((item) => `${item.id}: ${item.detail}`), "project_qc_quarantine", "UPG-172"),
      field("Figshare release receipt", `${contract.source.figshare.fileCount} files; ${contract.source.figshare.totalBytes} bytes; ${contract.source.figshare.license.name}; source files bundled ${contract.source.figshare.sourceFilesBundled}`, "official_repository_metadata_plus_local_checksums", "figshare-v2-api"),
    ],
    gaps: [
      gap("Single-cell morphology", "repository_object_unavailable", "No raw microscopy image, reconstruction, SWC or stable morphology object is deposited."),
      gap("Cell coordinates", "source_schema_no_field", "FOV, quadrant and distance arrays are not stable per-cell xyz coordinates or atlas locations."),
      gap("Raw electrophysiology traces", "repository_object_unavailable", "No raw ABF/pClamp trace, acquisition timestamp or recording-file identifier is deposited."),
      gap("SCI context", "not_measured_by_study", "The source does not test a spinal-cord-injury condition."),
      gap("Atlas registration", "no_admitted_transform", "No transform or coordinate frame registers the source tables to the reference atlas."),
      gap("Projection target", "relationship_not_established", "The source profile does not establish same-cell projection targets."),
      gap("Circuit partners", "relationship_not_established", "Receptor responses do not identify presynaptic or postsynaptic circuit partners."),
      gap("Internal structure", "repository_object_unavailable", "No raw volume, segmentation, nucleus, organelle, synapse or internal mesh is deposited."),
      gap("Cross-source same-cell identity", "relationship_not_established", "The profile is not joined to transcriptomic, morphology, SCI or the separate PKD2L1 SBF-SEM publication."),
    ],
    provenance: sourceBlock({
      label: "Crozat PKD2L1 CSF-contacting-neuron source profile",
      citation: contract.source.publication.citation,
      doi: contract.source.publication.doi,
      urls: [
        { label: "Primary article", url: contract.source.publication.articleUrl },
        { label: "Figshare version 2", url: contract.source.figshare.landingPageUrl },
        { label: "Official Figshare API", url: contract.source.figshare.apiUrl },
      ],
      accessions: [contract.source.figshare.doi, `Figshare article ${contract.source.figshare.articleId} version ${contract.source.figshare.version}`],
      locators: resolvedLocators,
      objectHashes: contract.source.figshare.keyFiles.map((file) => ({ label: `${file.fileName} · file ${file.id}`, sha256: file.locallyVerifiedSha256, bytes: file.bytes })),
    }),
    coordinate: {
      geometryStatus: "TYPE_LEVEL",
      frame: "crozat_pkd2l1_source_namespace",
      registrationStatus: "unregistered",
      registrationCount: 0,
      measurementUse: "forbidden",
    },
    boundary: `${profile.samplingBoundary} ${contract.joinPolicy.withinExperimentFamilyPairing} No geometry, atlas registration, whole-deposit per-cell join or link to the separate PKD2L1 SBF-SEM paper is admitted.`,
    navigation: { lab: "types", params: { type: profile.id }, anchor: "types-panel" },
  })];
}

function canoContextFieldText(context) {
  const retained = context.counts.map((item) => `${JSON.stringify(item.value)}=${item.count}`).join(" · ");
  return `${context.field}: ${context.status}; values ${retained || "none"}; missing ${context.missingCount}; empty ${context.emptyCount}`;
}

function buildCanoGomezP56Records(registry) {
  if (registry.datasetId !== "GSE318731" || registry.lifeStage !== "P56") {
    throw new Error("Cano-Gomez registry identity is invalid");
  }
  const confirmedArtifact = registry.artifacts.find((artifact) => artifact.artifactKind === "confirmed_interneuron_nucleus_roster");
  const auditArtifact = registry.artifacts.find((artifact) => artifact.artifactKind === "all_nucleus_assignment_audit");
  if (!confirmedArtifact || !auditArtifact) throw new Error("Cano-Gomez exact roster artifacts are incomplete");
  const profileIds = new Set(registry.profiles.map((profile) => profile.profileId));
  const confirmedNucleusCount = registry.profiles.reduce((total, profile) => total + profile.nucleusCount, 0);
  if (registry.profiles.length !== 11
    || profileIds.size !== registry.profiles.length
    || registry.profiles.length !== registry.denominatorReconciliation.confirmedInterneuronProfileCount
    || confirmedNucleusCount !== registry.denominatorReconciliation.confirmedInterneuronNucleusCount
    || confirmedArtifact.rowCount !== confirmedNucleusCount) {
    throw new Error("Cano-Gomez profile denominator does not match the registry");
  }
  if (registry.profiles.some((profile) => profile.sourceObjectId !== "cholinergic"
    || profile.sourceGroup !== "CHOL_IN"
    || profile.assignmentAuthority !== "source_explicit_groups_equals_CHOL_IN"
    || profile.markerEvidenceStatus !== "NOT_EXTRACTED_NO_LABEL_TOKEN_INFERENCE"
    || Object.values(profile.geometryAuthority).some((count) => count !== 0))) {
    throw new Error("Cano-Gomez confirmed-profile evidence boundary is invalid");
  }

  return registry.profiles.map((profile) => {
    const profileLocator = `${INPUTS.canoGomezP56}#profiles[profileId=${profile.profileId}]`;
    const rosterLocator = `public/data/cano_gomez_p56_multiome_interneuron_v1/${profile.rosterLink.artifactFileName}#${profile.rosterLink.filterField}=${profile.rosterLink.filterEquals}`;
    const sourceObject = registry.sourceObjects.find((candidate) => candidate.objectId === profile.sourceObjectId);
    const inputReceipt = registry.inputReceipts.sourceObjects.find((candidate) => candidate.objectId === profile.sourceObjectId);
    if (!sourceObject || !inputReceipt) throw new Error(`Cano-Gomez ${profile.profileId} source receipt is missing`);
    const contextSummary = profile.contextFieldCounts.map(canoContextFieldText).join(" | ");
    return recordBase({
      focusKind: "molecular_profile",
      focusId: profile.profileId,
      title: profile.sourceLocalLabel,
      subtitle: `${profile.sourceGroup} · P56 mouse spinal cord · Cano-Gomez 2026`,
      namespace: "cano-gomez-2026:GSE318731",
      laneLabel: "Molecular population",
      summary: "Confirmed source-local interneuron profile admitted only by the exact deposited groups=CHOL_IN assignment. The exact label is not tokenized into marker evidence and does not define a canonical cross-study type.",
      recordSemantics: {
        parentSourceId: "SRC-CANOGOMEZ-2026",
        recordKind: profile.recordKind,
        unitOfObservation: profile.unitOfObservation,
        assignmentAuthority: profile.assignmentAuthority,
        cellRosterAvailability: "exact_bundled_profile_and_nucleus_roster",
        canonicalIdentityStatus: "not_established",
      },
      searchTerms: [
        profile.profileId,
        profile.sourceLocalLabel,
        profile.sourceGroup,
        registry.datasetId,
        registry.lifeStage,
        "P56 mouse spinal cord cholinergic CHOL_IN",
        registry.sourceReferences.publication.doi,
        profile.sourceFileName,
      ],
      evidence: [
        field("Canonical parent source", "SRC-CANOGOMEZ-2026", "project_source_registry", "UPG-204"),
        verbatimField("Record granularity", `${profile.recordKind} · observation unit: ${profile.unitOfObservation}`, "checksum_pinned_registry", profileLocator),
        verbatimField("Assignment / roster", `${profile.assignmentAuthority} · exact bundled profile and nucleus roster`, "checksum_pinned_source_assignment", rosterLocator),
        verbatimField("Source-local label", profile.sourceLocalLabel, "checksum_pinned_raw_neuron_types", profileLocator),
        verbatimField("Source group", profile.sourceGroup, "checksum_pinned_raw_groups", `${profile.sourceFileName}#meta.data.groups`),
        field("Canonical transmitter", "Cholinergic", "source_object_and_group_context", `${profile.sourceFileName}#${profile.sourceObjectId}`),
        field("Exact sampled-nucleus count", `${profile.nucleusCount} source-assigned nuclei`, "checksum_pinned_exact_roster_count", rosterLocator),
        field("Life-stage scope", registry.lifeStage, "source_reported_dataset_scope", registry.sourceReferences.publication.articleUrl),
        field("Source markers", "Not established; the exact source label is not tokenized, normalized or interpreted as marker evidence.", "registry_marker_boundary", profileLocator),
        verbatimField("Source context counts", contextSummary, "checksum_pinned_profile_roster_counts", rosterLocator),
        verbatimField("Stable nucleus-key receipt", `${registry.compoundNucleusKeyExpression}; profile ordered keys SHA-256 ${profile.orderedCompoundNucleusKeysSha256}`, "checksum_pinned_registry", rosterLocator),
        verbatimField("Identity authority", `${registry.identityAuthority.mode}; cross-assay cell identity verified ${registry.identityAuthority.crossAssayCellIdentityVerified}; same-cell assertion admitted ${registry.identityAuthority.sameCellAssertionAdmitted}`, "registry_identity_authority", profileLocator),
        verbatimField("Profile roster receipt", `${profile.rosterLink.artifactFileName}; ${profile.rosterLink.idField}; ${profile.rosterLink.filterField}=${profile.rosterLink.filterEquals}; artifact SHA-256 ${confirmedArtifact.compressedSha256}`, "checksum_pinned_bundled_roster", rosterLocator),
        field("Dataset denominator reconciliation", `${registry.denominatorReconciliation.sourceTotalNucleusCount} source nuclei; ${registry.denominatorReconciliation.confirmedInterneuronNucleusCount} exact CHOL_IN nuclei across ${registry.denominatorReconciliation.confirmedInterneuronProfileCount} profiles; paper-reported ${registry.denominatorReconciliation.paperReportedNeuronTypeCount} neuronal types not used as an interneuron denominator`, "registry_decision_policy", profileLocator),
        field("3D and internal model state", `${profile.geometryAuthority.geometryObjectCount} admitted type-specific geometry · ${profile.geometryAuthority.internalStructureObjectCount} admitted internal structures · ${profile.geometryAuthority.sameCellLinkCount} same-cell links · ${profile.geometryAuthority.atlasRegistrationCount} registrations`, "registry_geometry_authority", profileLocator),
      ],
      gaps: [
        gap("Single-cell morphology", "source_schema_no_field", "The exact nucleus roster has no linked soma, neurite or whole-cell reconstruction.", { axisId: "single_cell_morphology", sourceLocator: profileLocator }),
        gap("Whole-cell geometry", "source_schema_no_field", "No source geometry object is admitted for this molecular profile.", { axisId: "whole_cell_geometry", sourceLocator: profileLocator }),
        gap("Cell coordinates", "source_schema_no_field", "Source context fields and counts are not per-nucleus xyz coordinates or segment placements.", { axisId: "cell_coordinates", sourceLocator: rosterLocator }),
        gap("Electrophysiology", "not_measured_by_study", "No same-nucleus electrophysiology record is linked to this profile.", { axisId: "electrophysiology", sourceLocator: profileLocator }),
        gap("Projection target", "relationship_not_established", "The exact CHOL_IN assignment does not establish a same-nucleus projection target.", { axisId: "projection_target", sourceLocator: profileLocator }),
        gap("Synaptic connectivity", "relationship_not_established", "No synaptic edge or partner roster is linked to these nuclei.", { axisId: "synaptic_connectivity", sourceLocator: profileLocator }),
        gap("SCI context", "not_measured_by_study", "The P56 source roster is not an SCI condition series.", { axisId: "sci_context", sourceLocator: profileLocator }),
        gap("Atlas registration", "no_admitted_transform", "No transform places these source-local nuclei in the project atlas.", { axisId: "atlas_registration", sourceLocator: profileLocator }),
        gap("Internal structure", "source_schema_no_field", "No linked membrane, nucleus, organelle, bouton, receptor distribution or internal mesh is admitted.", { axisId: "internal_structure", sourceLocator: profileLocator }),
        gap("Cross-source same-cell identity", "relationship_not_established", registry.identityAuthority.boundary, { axisId: "cross_source_same_cell_identity", sourceLocator: profileLocator }),
      ],
      provenance: sourceBlock({
        label: "Cano-Gomez P56 mouse spinal-cord multiome",
        citation: "Cano-Gomez et al. 2026 P56 mouse spinal-cord multiome",
        doi: registry.sourceReferences.publication.doi,
        urls: [
          { label: "Primary article", url: registry.sourceReferences.publication.articleUrl },
          { label: "GEO record", url: registry.sourceReferences.dataRepository.url },
        ],
        accessions: [registry.datasetId, registry.sourceReferences.publication.doi],
        locators: [profileLocator, rosterLocator, `${profile.sourceFileName}#groups=${profile.sourceGroup}`],
        objectHashes: [
          { label: profile.sourceFileName, sha256: sourceObject.sourceRdsSha256, bytes: sourceObject.sourceRdsBytes },
          { label: inputReceipt.receiptFileName, sha256: inputReceipt.receiptSha256 },
          { label: confirmedArtifact.fileName, sha256: confirmedArtifact.compressedSha256, bytes: confirmedArtifact.compressedBytes },
          { label: auditArtifact.fileName, sha256: auditArtifact.compressedSha256, bytes: auditArtifact.compressedBytes },
        ],
      }),
      coordinate: {
        geometryStatus: "TYPE_LEVEL",
        frame: "cano_gomez_p56_chol_in_source_local_roster_without_geometry",
        registrationStatus: "unregistered",
        registrationCount: 0,
        measurementUse: "forbidden",
      },
      boundary: `Only the exact raw groups=${profile.sourceGroup} assignment admits this source-local profile and its ${profile.nucleusCount} nuclei. The raw label ${JSON.stringify(profile.sourceLocalLabel)} is preserved without token-to-marker inference. The paper-reported ${registry.denominatorReconciliation.paperReportedNeuronTypeCount} neuronal types are not an interneuron denominator. This record creates no canonical cross-study identity, geometry, internal structure, same-cell link, projection assignment or atlas registration. ${registry.sourceReferences.publication.rightsBoundary}`,
      navigation: { lab: "types", params: { type: profile.profileId }, anchor: "types-panel" },
    });
  });
}

function buildHayashiV2aRecords(hayashi) {
  const sampleFrame = hayashi.source.geo.sampleFrame;
  const matrix = hayashi.source.geo.countMatrixAsset;
  const majorTypeTerms = hayashi.sourceReportedMajorTypes.flatMap((majorType) => [
    majorType.label,
    majorType.chx10Context,
    majorType.networkContext,
    majorType.projectionContext,
    majorType.projectUseClass,
  ]);
  return hayashi.profiles.map((profile) => recordBase({
    focusKind: "molecular_profile",
    focusId: profile.id,
    title: profile.sourceLocalLabel,
    subtitle: `P0 V2a transcriptomic subgroup · Hayashi 2018`,
    namespace: "hayashi-2018:GSE108788",
    laneLabel: "Molecular population",
    summary: "Article-reported V2a cluster with mixed Type I local-interneuron and Type II supraspinal-projection context. The public GEO matrix contains no cluster-to-barcode map.",
    recordSemantics: {
      parentSourceId: "SRC-HAYASHI-2018",
      recordKind: "article_reported_cluster",
      unitOfObservation: "cell",
      assignmentAuthority: "article_figure_transcription",
      cellRosterAvailability: "cluster_to_barcode_map_unavailable",
      canonicalIdentityStatus: "not_established",
    },
    searchTerms: [
      profile.id,
      profile.markerPanel,
      profile.spatialDomainContext,
      profile.rostrocaudalContext,
      profile.majorTypeMembership,
      profile.chx10LowContext,
      majorTypeTerms,
      "V2a",
      "Chx10",
      "Vsx2",
      "P0 neonatal cervical lumbar",
      hayashi.source.publication.citation,
      hayashi.source.publication.doi,
      hayashi.source.publication.pmid,
      hayashi.source.publication.pmcid,
      hayashi.source.geo.accession,
      hayashi.source.geo.sampleAccession,
      hayashi.source.geo.sraStudyAccession,
      hayashi.source.geo.bioProjectAccession,
    ],
    evidence: [
      field("Canonical parent source", "SRC-HAYASHI-2018", "project_source_registry", "UPG-108"),
      field("Record granularity", "article-reported cluster · observation unit: cell", "project_curated", "UPG-109"),
      field("Assignment / roster", "article Figure 6 transcription · cluster-to-barcode map unavailable", "source_and_project_boundary", "UPG-109"),
      field("Source-local label", profile.sourceLocalLabel, "article_reported", "PMC8601153 Figure 6C"),
      field("Canonical transmitter", "Excitatory", "source_reported_v2a_population_context", "PMC8601153 Summary; Results P29"),
      field("Figure-reported cell count", `${profile.samplingCount.value} ${profile.samplingCount.unit}`, "article_figure_count", "PMC8601153 Figure 6C"),
      field("Narrative marker panel", profile.markerPanel.length ? profile.markerPanel : "Not retained for this numbered cluster", "article_reported_group_context", "PMC8601153 Results P30"),
      field("Spatial-domain context", profile.spatialDomainContext, "article_reported_group_context", "PMC8601153 Results P30"),
      field("Rostrocaudal context", profile.rostrocaudalContext, "article_computational_assignment_context", "PMC8601153 Results P32"),
      field("Major-type membership", profile.majorTypeMembership, "article_reported", "PMC8601153 Figure 7A; Results P31"),
      field("Chx10-low context", profile.chx10LowContext, "article_reported_group_context", "PMC8601153 Figure 7A; Results P31"),
      field("Experimental-unit flow", `${sampleFrame.sourceAnimalCount} P0 neonates -> ${sampleFrame.pooledLibraryCount} pooled 10x library -> ${sampleFrame.qcRetainedCellCount} QC-retained cells`, "source_reported", "GSE108788 Overall design; PMC8601153 P29"),
      field("Cell-processing denominator flow", `${sampleFrame.prePoolingFACSCollectedCellCountByRegion.cervical} cervical + ${sampleFrame.prePoolingFACSCollectedCellCountByRegion.lumbar} lumbar FACS-collected -> approximately ${sampleFrame.cellsProcessedApproximate} processed -> ${sampleFrame.qcRetainedCellCount} QC-retained`, "source_reported_distinct_denominators", "GSM2913270 processing; PMC8601153 P29"),
      field("10x chemistry", sampleFrame.tenXChemistry, "source_reported", "GSM2913270 processing"),
      field("Public matrix dimensions", `${matrix.geneRowCount} genes x ${matrix.cellBarcodeColumnCount} barcodes`, "checksum_verified_source_object", matrix.compressedSha256),
      field("Matrix V2a-marker check", `${matrix.matrixReanalysis.v2aMarkerPositiveBarcodeCount}/${matrix.cellBarcodeColumnCount} (${matrix.matrixReanalysis.v2aMarkerPositivePercentage}%) raw-UMI-positive; article reports ${matrix.matrixReanalysis.articleReportedV2aMarkerPositivePercentage}%`, "project_reanalysis_unresolved_difference", "matrix-reanalysis-marker-discrepancy"),
      field("Matrix Slc17a6 check", `${matrix.matrixReanalysis.slc17a6PositiveBarcodeCount}/${matrix.cellBarcodeColumnCount} (${matrix.matrixReanalysis.slc17a6PositivePercentage}%) raw-UMI-positive; article reports ${matrix.matrixReanalysis.articleReportedSlc17a6PositivePercentage}%`, "project_reanalysis_unresolved_difference", "matrix-reanalysis-marker-discrepancy"),
      field("Article computational region assignment", `${sampleFrame.articleAssignedCervicalCellCount} cervical + ${sampleFrame.articleAssignedLumbarCellCount} lumbar`, "article_computational_assignment", "PMC8601153 Results P32"),
      field("Project use", "Mixed local-interneuron and supraspinal-projection context; Type II excluded from local-interneuron counts", "project_curated", "UPG-079"),
    ],
    gaps: [
      gap("Public cluster-to-barcode map", "not_available_in_public_geo_object", "The checksum-pinned matrix has gene names, barcodes and counts only; Figure 6 cluster membership cannot be regenerated without the source assignment map."),
      gap("Public Type I/II barcode map", "not_available_in_public_geo_object", "Article Chx10-high/low assignments are not deposited as a GEO matrix annotation column."),
      gap("Public cervical/lumbar barcode map", "not_available_in_public_geo_object", "The article's computational region assignments are not deposited as a GEO matrix annotation column."),
      gap("Article percentage reproduction", matrix.matrixReanalysis.reproducibilityStatus, matrix.matrixReanalysis.interpretationBoundary),
      ...Object.entries(hayashi.globalMissingEvidence)
        .filter(([label]) => !["barcodeLevelClusterAssignment", "barcodeLevelMajorTypeAssignment", "barcodeLevelSpinalRegionAssignment"].includes(label))
        .map(([label, status]) => gap(label, status, "This evidence axis is unavailable for the source-local cluster and must not be inferred from shared markers or co-display.")),
    ],
    provenance: sourceBlock({
      label: "Hayashi neonatal V2a source-local taxonomy",
      citation: hayashi.source.publication.citation,
      doi: hayashi.source.publication.doi,
      urls: [
        { label: "Primary article", url: hayashi.source.publication.articleUrl },
        { label: "GEO record", url: hayashi.source.geo.recordUrl },
      ],
      accessions: [
        hayashi.source.geo.accession,
        hayashi.source.geo.sampleAccession,
        hayashi.source.geo.sraStudyAccession,
        hayashi.source.geo.bioProjectAccession,
      ],
      locators: profile.fieldLocatorIds.map((id) => {
        const locator = hayashi.sourceLocators.find((item) => item.id === id);
        return locator ? `${id}: ${locator.locator}` : id;
      }),
      objectHashes: [{
        label: matrix.fileName,
        sha256: matrix.compressedSha256,
        bytes: matrix.compressedBytes,
      }],
    }),
    coordinate: {
      geometryStatus: "TYPE_LEVEL",
      frame: "hayashi_p0_cervical_lumbar_source_namespace",
      registrationStatus: "unregistered",
      registrationCount: 0,
      measurementUse: "forbidden",
    },
    boundary: `${sampleFrame.interpretationBoundary} Figure 6 cluster counts are article-reported and not independently reproducible from the bare public matrix without a cluster-to-barcode map.`,
    navigation: { lab: "types", params: { type: profile.id }, anchor: "types-panel" },
  }));
}

function buildDmrt3Di6Records(contract) {
  const locatorById = new Map(contract.sourceLocators.map((locator) => [locator.id, locator]));
  const notebook = contract.source.repository.sourceFiles.find((sourceFile) => sourceFile.id === "executed-notebook");
  return contract.profiles.map((profile) => recordBase({
    focusKind: "molecular_profile",
    focusId: profile.id,
    title: profile.sourceLocalLabel,
    subtitle: `${profile.articleTemporalPhase} embryonic Dmrt3/dI6 group · Iglesias González 2021`,
    namespace: profile.namespace,
    laneLabel: "Molecular population",
    summary: `${profile.sourceLocalLabel} · ${profile.samplingCount} retained dI6-lineage cells · top markers ${profile.markerPanel.join(" · ")} · ${profile.articleTemporalPhase} apparent birth-order context.`,
    recordSemantics: {
      parentSourceId: profile.parentSourceId,
      recordKind: profile.recordKind,
      unitOfObservation: profile.unitOfObservation,
      assignmentAuthority: "pinned_executed_author_notebook_group_summary",
      cellRosterAvailability: "group_summary_only_no_per_well_M1_to_M6_roster",
      canonicalIdentityStatus: "not_established",
    },
    searchTerms: [
      profile.sourceLocalLabel,
      profile.markerPanel,
      profile.articleTemporalPhase,
      profile.articleTemporalAnchorGenes,
      profile.temporalEvidenceStatus,
      "Dmrt3 dI6 M1 M2 M3 M4 M5 M6 embryonic E14.5 inhibitory GABAergic glycinergic",
      contract.source.publication.citation,
      contract.source.publication.doi,
      contract.source.geo.accession,
      contract.source.geo.bioproject,
      contract.source.geo.sraStudy,
      contract.source.repository.pinnedCommit,
    ],
    evidence: [
      field("Canonical parent source", profile.parentSourceId, "project_source_registry", "UPG-174"),
      field("Record granularity", `${profile.recordKind} · observation unit: ${profile.unitOfObservation}`, "project_curated", "UPG-174"),
      field("Assignment / roster", "pinned executed-notebook group summary · per-well M1–M6 roster not exported", "source_and_project_boundary", "UPG-174"),
      field("Source-local label", profile.sourceLocalLabel, "pinned_executed_notebook", "notebook-cell-80-exec-195"),
      field("Canonical transmitter", "Inhibitory · dual GABAergic/glycinergic population context", "primary_article_population_context", "primary-article-sample-context"),
      field("Exact sampled-cell count", `${profile.samplingCount} ${profile.samplingUnit}`, "pinned_executed_notebook_output", "notebook-cell-84-exec-72"),
      field("Source markers", profile.markerPanel, "pinned_executed_notebook_top_marker_output", "notebook-cell-83-exec-71"),
      field("Spinal and anatomy context", "E14.5 mouse spinal Dmrt3-lineage dI6 population; no per-cell coordinate or rostrocaudal field", "primary_article", "primary-article-sample-context"),
      field("Life-stage scope", contract.scope.lifeStage, "source_reported", "primary-article-sample-context"),
      field("Temporal context", `${profile.articleTemporalPhase}; anchors ${profile.articleTemporalAnchorGenes.join(" · ")}; ${profile.temporalEvidenceStatus}`, "primary_article_plus_notebook_context", "primary-article-temporal-context"),
      field("Experimental-unit flow", `${contract.scope.sourceEmbryoCount} E14.5 embryos -> ${contract.scope.poolCount} pool -> ${contract.scope.independentLibraryCount} library -> ${contract.scope.depositedMouseWellCount} deposited wells -> ${contract.scope.qcRetainedCellCount} QC cells -> ${contract.scope.di6LineageRetainedCellCount} dI6-lineage cells`, "source_reported_plus_pinned_executed_notebook", "primary-article-sample-context · notebook-cell-14-exec-13 · notebook-cell-76-exec-66"),
      field("M1–M6 partition", contract.profiles.map((item) => `${item.sourceLocalLabel} ${item.samplingCount}`).join(" · "), "pinned_executed_notebook_output", "notebook-cell-84-exec-72"),
      field("Roster availability", contract.analysisLineage.transformationAuthority.interpretationBoundary, "source_object_audit", "study-missing-axes"),
      field("Quarantined QC/HVG conflict", contract.quarantinedConflicts[0].resolution, "conflict_preserved", "methods-qc-description · notebook-cell-14-exec-13"),
    ],
    gaps: [
      gap("Per-well M1–M6 roster", "source_schema_no_field", "The public loom exports 384 well identifiers but no M1–M6 assignment column; this project does not reconstruct the missing roster.", { sourceLocator: "study-missing-axes" }),
      gap("Scalar pseudotime", "source_schema_no_field", "The apparent birth-order interpretation is reported, but no scalar pseudotime is exported by the loom or compact derivative.", { sourceLocator: "study-missing-axes" }),
      gap("Single-cell morphology", "not_measured_by_study", "No SWC, neurite arbor, cell boundary, segmentation, mesh, or same-cell morphology object is deposited.", { sourceLocator: "study-missing-axes" }),
      gap("Cell coordinates", "not_measured_by_study", "No per-cell xyz, section coordinate, spinal level, or atlas position is supplied.", { sourceLocator: "study-missing-axes" }),
      gap("Atlas registration", "no_admitted_transform", "No source transform registers an M group or well to project anatomy.", { sourceLocator: "study-missing-axes" }),
      gap("SCI context", "not_measured_by_study", "This embryonic uninjured study is not an SCI condition series.", { sourceLocator: "study-missing-axes" }),
      gap("Electrophysiology", "not_measured_by_study", "No same-cell or group-linked electrophysiology record is deposited.", { sourceLocator: "study-missing-axes" }),
      gap("Projection target", "not_measured_by_study", "No same-cell projection tracing object is linked to the sequenced wells.", { sourceLocator: "study-missing-axes" }),
      gap("Synaptic connectivity", "not_measured_by_study", "No source synapse edge, partner, or contact object is deposited.", { sourceLocator: "study-missing-axes" }),
      gap("Internal structure", "source_schema_no_field", "No raw microscopy volume, membrane, nucleus, organelle, receptor, bouton, synapse, segmentation, or mesh object is available.", { sourceLocator: "study-missing-axes" }),
      gap("Cross-source same-cell identity", "relationship_not_established", "No stable shared key joins an M group or well to an adult type, morphology, physiology, SCI record, coordinate, or internal object.", { sourceLocator: "study-missing-axes" }),
    ],
    provenance: sourceBlock({
      label: "Iglesias González embryonic Dmrt3/dI6 source-local taxonomy",
      citation: contract.source.publication.citation,
      doi: contract.source.publication.doi,
      urls: [
        { label: "Primary article", url: contract.source.publication.pmcUrl },
        { label: "GEO record", url: contract.source.geo.seriesUrl },
        { label: "Pinned analysis commit", url: contract.source.repository.commitUrl },
      ],
      accessions: [contract.source.geo.accession, contract.source.geo.bioproject, contract.source.geo.sraStudy],
      locators: profile.locatorIds.map((id) => {
        const locator = locatorById.get(id);
        return locator ? `${id}: ${locator.locator}` : id;
      }),
      objectHashes: [
        { label: contract.source.geo.processedObject.fileName, sha256: contract.source.geo.processedObject.compressedSha256, bytes: contract.source.geo.processedObject.compressedBytes },
        { label: contract.source.geo.processedObject.uncompressedFileName, sha256: contract.source.geo.processedObject.uncompressedSha256, bytes: contract.source.geo.processedObject.uncompressedBytes },
        { label: notebook.path, sha256: notebook.sha256, bytes: notebook.bytes },
      ],
    }),
    coordinate: {
      geometryStatus: "TYPE_LEVEL",
      frame: "dmrt3_di6_embryonic_group_summary_without_cell_coordinates",
      registrationStatus: "unregistered",
      registrationCount: 0,
      measurementUse: "forbidden",
    },
    boundary: `${contract.analysisLineage.transformationAuthority.interpretationBoundary} ${contract.joinPolicy.boundary} The three embryos form one pooled experimental library, not three group-level replicates or a prevalence denominator.`,
    navigation: { lab: "types", params: { type: profile.id }, anchor: "types-panel" },
  }));
}

function buildRoomeDilRecords(contract) {
  return contract.profiles.map((profile) => {
    const transmitter = profile.transmitterClass === "inhibitory_family_context" ? "Inhibitory" : "Excitatory";
    const displayGenes = profile.displayFeatures.map((feature) => feature.gene);
    return recordBase({
      focusKind: "molecular_profile",
      focusId: profile.id,
      title: profile.sourceLocalLabel,
      subtitle: `${profile.family} · ${transmitter} family context · Roome 2026`,
      namespace: "roome-2026:GSE291462",
      laneLabel: "Molecular population",
      summary: `${profile.sourceLocalLabel} · ${profile.frequency.toLocaleString("en-US")} captured refined dIL cells · ${profile.percentOfDil.toFixed(4)}% of the study dIL denominator · ${displayGenes.join(" · ")}.`,
      recordSemantics: {
        parentSourceId: "SRC-ROOME-2026",
        recordKind: "source_reported_refined_dil_type",
        unitOfObservation: "captured_dil_cell_summary",
        assignmentAuthority: "checksum_pinned_table_s6_roster_and_table_s7_differential_rows",
        cellRosterAvailability: "type_aggregate_only_full_rds_link_only",
        canonicalIdentityStatus: "not_established",
      },
      searchTerms: [
        profile.sourceLocalLabel,
        profile.family,
        transmitter,
        displayGenes,
        profile.displayFeatures.map((feature) => `Table S7 row ${feature.sourceRow}`),
        "embryonic E14.5 E16.5 dorsal horn dIL refined type positive differential features",
        contract.source.publication.citation,
        contract.source.publication.doi,
        contract.source.publication.pmcid,
        contract.source.geo.superSeries,
        contract.source.geo.scrnaSeries,
        contract.source.geo.xeniumSeries,
      ],
      evidence: [
        field("Canonical parent source", "SRC-ROOME-2026", "project_source_registry", "UPG-180"),
        field("Record granularity", "source_reported_refined_dil_type · observation unit: captured dIL cell summary", "project_curated", "UPG-180"),
        field("Assignment / roster", "exact Table S6 refined-type aggregate · full source RDS remains link-only", "source_and_project_boundary", `Table S6 · Sheet1!${profile.sourceRange}`),
        field("Source-local label", profile.sourceLocalLabel, "source_reported", `Table S6 · Sheet1!A${profile.sourceRow}`),
        field("Canonical transmitter", `${transmitter} · ${profile.family} source-family context`, "primary_article_family_context", "Primary article Results · refined dILA/dILB families"),
        field("Exact captured-cell count", `${profile.frequency} captured refined dIL cells`, "source_reported", `Table S6 · Sheet1!B${profile.sourceRow}`),
        field("Percent of captured dIL denominator", `${profile.percentOfDil}%`, "source_reported", `Table S6 · Sheet1!C${profile.sourceRow}`),
        field("Mean genes per cell", profile.meanGenesPerCell, "source_reported_cluster_qc", `Table S6 · Sheet1!D${profile.sourceRow}`),
        field("Mean silhouette score", profile.meanSilhouetteScore, "source_reported_cluster_qc", `Table S6 · Sheet1!E${profile.sourceRow}`),
        field("Mean LISI score", profile.meanLisiScore, "source_reported_cluster_qc", `Table S6 · Sheet1!F${profile.sourceRow}`),
        field("Positive differential features meeting display thresholds", displayGenes, "deterministic_view_over_source_rows", profile.displayFeatures.map((feature) => `Table S7 · neuron_refined_markers!${feature.sourceRange}`).join(" · ")),
        field("Differential-feature display audit", `6 shown of ${profile.differentialFeatureAudit.positiveDisplayCandidateCount} qualifying rows · ${profile.differentialFeatureAudit.retainedTextGeneRowCount}/100 text-gene rows · ${profile.differentialFeatureAudit.quarantinedGeneRowCount} quarantined`, "project_derivation_audit", profile.differentialFeatureAudit.canonicalSourceRowsSha256),
        field("Experimental-unit boundary", `15 biological litter pools, each pooling 3–10 embryos; 29 retained technical outputs; ${contract.scope.refinedDilCellCount.toLocaleString("en-US")} refined dIL cells`, "source_reported", "Primary article Methods and Results · scRNA-seq sample frame"),
        field("3D and internal model state", "0 admitted type-specific geometry · 0 admitted internal structures", "project_admission_policy", "UPG-180"),
      ],
      gaps: [
        gap("Single-cell morphology", "not_measured_by_study", "No same-cell SWC, neurite arbor, surface, segmentation or morphology object is linked to this molecular type record.", { sourceLocator: "Table S6/S7 modalities and Primary article Data availability" }),
        gap("Whole-cell geometry", "not_measured_by_study", "The refined type label, count, QC and differential rows do not measure a whole-cell three-dimensional form.", { sourceLocator: "Table S6/S7 modalities and Primary article Data availability" }),
        gap("Axon/dendrite topology", "not_measured_by_study", "No same-cell axon or dendrite topology is deposited for this molecular aggregate.", { sourceLocator: "Table S6/S7 modalities and Primary article Data availability" }),
        gap("Cell coordinates", "relationship_not_established", "Xenium cells are different cells with RCTD-predicted labels; they are not a same-cell coordinate for the scRNA aggregate.", { sourceLocator: "Primary article Methods and Results · Xenium RCTD label transfer" }),
        gap("Atlas registration", "no_admitted_transform", "No deposited transform registers this type or a same-cell object to project coordinates.", { sourceLocator: "Primary article Methods and Results · source-local normalized 2D coordinates" }),
        gap("SCI context", "not_measured_by_study", "This embryonic developmental taxonomy is not an SCI condition series.", { sourceLocator: "Primary article Study design and Results" }),
        gap("Electrophysiology", "not_measured_by_study", "No same-cell or type-linked electrophysiology record is deposited.", { sourceLocator: "Table S6/S7 modalities and Primary article Data availability" }),
        gap("Projection target", "not_measured_by_study", "No same-cell projection-tracing object is linked to this source type.", { sourceLocator: "Table S6/S7 modalities and Primary article Data availability" }),
        gap("Synaptic connectivity", "not_measured_by_study", "No source synapse edge, partner or contact object is linked to this source type.", { sourceLocator: "Table S6/S7 modalities and Primary article Data availability" }),
        gap("Internal structure", "not_measured_by_study", "No membrane, nucleus, organelle, receptor-distribution, bouton or intracellular-compartment object is linked to this source type.", { sourceLocator: "Table S6/S7 modalities and Primary article Data availability" }),
        gap("Cross-source same-cell identity", "relationship_not_established", "No stable shared key joins this type aggregate to a morphology, physiology, SCI entity, coordinate or internal object.", { sourceLocator: "Primary article Data availability and project relationship policy" }),
      ],
      provenance: sourceBlock({
        label: "Roome 2026 embryonic dorsal-horn refined dIL source taxonomy",
        citation: contract.source.publication.citation,
        doi: contract.source.publication.doi,
        urls: [
          { label: "Primary article", url: contract.source.publication.articleUrl },
          { label: "GEO SuperSeries", url: contract.source.geo.seriesUrl },
          ...contract.source.tables.map((table) => ({ label: table.id, url: table.url })),
        ],
        accessions: [contract.source.geo.superSeries, contract.source.geo.scrnaSeries, contract.source.geo.xeniumSeries, contract.source.publication.pmcid],
        locators: profile.sourceLocators,
        objectHashes: [
          ...contract.source.tables.map((table) => ({ label: table.fileName, sha256: table.sha256, bytes: table.bytes })),
          { label: contract.derivation.fullFeatureEvidencePath, sha256: contract.derivation.fullFeatureEvidenceSha256, bytes: contract.derivation.fullFeatureEvidenceBytes },
        ],
      }),
      coordinate: {
        geometryStatus: "TYPE_LEVEL",
        frame: "roome_embryonic_dil_type_aggregate_without_same_cell_geometry",
        registrationStatus: "unregistered",
        registrationCount: 0,
        measurementUse: "forbidden",
      },
      boundary: `${contract.denominatorBoundary} ${contract.signatureMethod.interpretationBoundary} scRNA and Xenium are different cells; this record supplies no morphology, whole-cell geometry, internal structure, same-cell spatial coordinate or project registration.`,
      navigation: { lab: "types", params: { type: profile.id }, anchor: "types-panel" },
    });
  });
}

function buildDelileDevelopmentalRecords(contract) {
  const sourceObject = contract.source.annotatedMetadataObject;
  const datasetLocator = `${sourceObject.repositoryPath} · SHA-256 ${sourceObject.sha256}`;
  return contract.profiles.map((profile) => {
    const stageCounts = profile.timepointCellCounts
      .map((entry) => `${entry.lifeStage}: ${entry.cellCount}`)
      .join(" · ");
    return recordBase({
      focusKind: "molecular_profile",
      focusId: profile.id,
      title: profile.sourceLocalLabel,
      subtitle: `${profile.cardinalClass} developmental class · Delile 2019`,
      namespace: "delile-2019:E-MTAB-7320",
      laneLabel: "Molecular population",
      summary: `${profile.sourceLocalLabel} · ${profile.cellCount.toLocaleString("en-US")} cells in the exact source-local fine-subtype roster · ${stageCounts}.`,
      recordSemantics: {
        parentSourceId: "SRC-DELILE-2019",
        recordKind: "source_reported_developmental_fine_subtype",
        unitOfObservation: "annotated_source_cell",
        assignmentAuthority: "checksum_pinned_authors_annotation_table_neuron_subtypes_column",
        cellRosterAvailability: "exact_link_only_source_roster_with_bundled_type_aggregates",
        canonicalIdentityStatus: "not_established",
      },
      searchTerms: [
        profile.id,
        profile.sourceLocalLabel,
        profile.cardinalClass,
        stageCounts,
        contract.scope.lifeStages,
        contract.scope.sampledRegions,
        contract.source.publication.citation,
        contract.source.publication.doi,
        contract.source.biostudies.accession,
        "embryonic developmental interneuron source-local fine subtype",
      ],
      evidence: [
        field("Canonical parent source", "SRC-DELILE-2019", "project_source_registry", "UPG-185"),
        field("Record granularity", "source reported developmental fine subtype · observation unit: annotated source cell", "project_curated", "UPG-185"),
        field("Assignment / roster", "Neuron_subtypes assignment in checksum-pinned authors table · full per-cell source object remains link-only", "source_and_project_boundary", datasetLocator),
        verbatimField("Source-local label", profile.sourceLocalLabel, "checksum_pinned_source_annotation", profile.sourceLocators[0]),
        verbatimField("Source cardinal class", profile.cardinalClass, "checksum_pinned_source_annotation", profile.sourceLocators[1]),
        field("Canonical transmitter", "Not established from the pinned annotation object", "source_schema_boundary", datasetLocator),
        field("Exact sampled-cell count", `${profile.cellCount} source-annotated fine-subtype cells`, "checksum_pinned_source_cell_aggregate", profile.sourceLocators[0]),
        field("Percent of fine-subtype denominator", `${profile.percentOfFineSubtypeInterneuronCells}% of ${contract.scope.fineSubtypeInterneuronCellCount.toLocaleString("en-US")} displayed fine-subtype cells`, "deterministic_source_cell_aggregate", profile.sourceLocators[0]),
        field("Fine-subtype timepoint cell counts", stageCounts, "checksum_pinned_source_cell_aggregate", `${sourceObject.repositoryPath} · timepoint + Neuron_subtypes`),
        field("DV field coverage", `${profile.dvObservedCellCount}/${profile.cellCount} selected cells have a source DV value; this is a source category, not a project coordinate`, "checksum_pinned_source_cell_aggregate", `${sourceObject.repositoryPath} · DV`),
        field("Pseudotime field coverage", `${profile.pseudotimeObservedCellCount}/${profile.cellCount} selected cells have a finite source pseudotime; pseudotime is not physical time or position`, "checksum_pinned_source_cell_aggregate", `${sourceObject.repositoryPath} · Pseudotime`),
        field("Life-stage scope", contract.scope.lifeStages.join(" through "), "source_reported", contract.source.publication.articleUrl),
        field("Dataset denominator flow", `${contract.scope.totalMetadataCellCount.toLocaleString("en-US")} metadata cells -> ${contract.scope.sourceDefinedNeuronCellCount.toLocaleString("en-US")} source-defined neurons -> ${contract.scope.sourceTypedNonmotorNeuronCellCount.toLocaleString("en-US")} typed non-motor neurons -> ${contract.scope.fineSubtypeInterneuronCellCount.toLocaleString("en-US")} displayed fine-subtype cells`, "checksum_pinned_source_cell_aggregate", datasetLocator),
        field("Retained exclusion boundary", `${contract.scope.cardinalOnlyInterneuronCellCount} cardinal-only cells (${contract.cardinalOnlySummaries.map((item) => `${item.sourceLocalLabel} ${item.cellCount}`).join(" · ")}) · ${contract.scope.motorNeuronExcludedCellCount.toLocaleString("en-US")} MN · ${contract.scope.nullNeuronExcludedCellCount.toLocaleString("en-US")} Null_Neuron`, "project_scope_boundary", datasetLocator),
        field("Experimental-unit boundary", `${contract.scope.sourceStageReplicateLabelCount} stage-replicate labels across ${contract.scope.lifeStages.length} stages; biological animal count is not resolved and replicate labels are not promoted to animals`, "source_and_project_boundary", datasetLocator),
        field("3D and internal model state", "0 admitted type-specific geometry · 0 admitted internal structures", "project_admission_policy", "UPG-185"),
      ],
      gaps: [
        gap("Single-cell morphology", "not_measured_by_study", "No same-cell SWC, neurite arbor, surface, segmentation or morphology object is linked to this developmental subtype.", { sourceLocator: datasetLocator }),
        gap("Whole-cell geometry", "not_measured_by_study", "The annotation table does not measure a whole-cell three-dimensional form.", { sourceLocator: datasetLocator }),
        gap("Axon/dendrite topology", "not_measured_by_study", "No axon or dendrite topology is deposited with the selected cell annotations.", { sourceLocator: datasetLocator }),
        gap("Cell coordinates", "source_schema_no_field", "The DV category and scalar pseudotime are not xyz, a section coordinate or a project atlas position.", { sourceLocator: datasetLocator }),
        gap("Atlas registration", "no_admitted_transform", "No source transform registers a selected barcode, subtype or DV category to project anatomy.", { sourceLocator: datasetLocator }),
        gap("Adult identity", "relationship_not_established", "An embryonic source label is not promoted to an adult interneuron identity.", { sourceLocator: contract.source.publication.articleUrl }),
        gap("SCI context", "not_measured_by_study", "This normal embryonic developmental series is not an SCI condition series.", { sourceLocator: contract.source.publication.articleUrl }),
        gap("Electrophysiology", "not_measured_by_study", "No same-cell or subtype-linked electrophysiology object is deposited.", { sourceLocator: datasetLocator }),
        gap("Projection target", "not_measured_by_study", "No same-cell projection-tracing object is linked to this subtype.", { sourceLocator: datasetLocator }),
        gap("Synaptic connectivity", "not_measured_by_study", "No source synapse edge, partner or contact object is linked to this subtype.", { sourceLocator: datasetLocator }),
        gap("Internal structure", "source_schema_no_field", "No raw volume, membrane, nucleus, organelle, receptor, bouton, synapse, segmentation or mesh object is supplied.", { sourceLocator: datasetLocator }),
        gap("Cross-source same-cell identity", "relationship_not_established", "No stable shared key joins this source barcode or subtype to another study, morphology, physiology, SCI record, coordinate or internal object.", { sourceLocator: contract.joinPolicy.boundary }),
      ],
      provenance: sourceBlock({
        label: "Delile 2019 embryonic mouse spinal source-local fine-subtype taxonomy",
        citation: contract.source.publication.citation,
        doi: contract.source.publication.doi,
        urls: [
          { label: "Primary article", url: contract.source.publication.articleUrl },
          { label: "BioStudies E-MTAB-7320", url: contract.source.biostudies.studyUrl },
          { label: "Pinned authors repository", url: contract.source.repository.commitUrl },
          { label: "Pinned annotation object", url: sourceObject.pinnedUrl },
        ],
        accessions: [contract.source.biostudies.accession, contract.source.publication.pmcid],
        locators: profile.sourceLocators,
        objectHashes: [{ label: sourceObject.fileName, sha256: sourceObject.sha256, bytes: sourceObject.bytes }],
      }),
      coordinate: {
        geometryStatus: "TYPE_LEVEL",
        frame: "delile_embryonic_fine_subtype_without_physical_cell_coordinates",
        registrationStatus: "unregistered",
        registrationCount: 0,
        measurementUse: "forbidden",
      },
      boundary: `${contract.denominatorBoundary} ${contract.joinPolicy.boundary} Source spelling dl is retained verbatim and is not silently normalized to dI. The 51 records are source-local fine subtypes, not deduplicated cross-study or adult canonical identities.`,
      navigation: { lab: "types", params: { type: profile.id }, anchor: "types-panel" },
    });
  });
}

function buildHaringDorsalHornRecords(haring) {
  const sampleFrame = haring.source.geo.sampleFrame;
  const matrix = haring.source.geo.countMatrixAsset;
  const rulesById = new Map(haring.identificationRules.map((rule) => [rule.id, rule]));
  const locatorsById = new Map(haring.sourceLocators.map((locator) => [locator.id, locator]));
  const cohortSummary = sampleFrame.selectionCohorts
    .map((cohort) => `${cohort.animalCount} animals: ${cohort.selection}`)
    .join("; ");

  return haring.profiles.map((profile) => {
    const barcode = profile.barcodeMetadataSummary;
    const identificationRules = profile.identificationRuleIds.map((id) => {
      const rule = rulesById.get(id);
      if (!rule) throw new Error(`Missing Häring identification rule ${id} for ${profile.id}`);
      return rule;
    });
    const markerSummary = profile.specificMarkerSummary;
    const table5Summary = identificationRules.map((rule) => (
      `${rule.staining.value}: ${rule.rawCombination.value} -> ${rule.sourceClusterName.value} [${rule.targetMappingStatus}]`
    )).join(" · ");
    const table5Locators = identificationRules.flatMap((rule) => [
      exactCellLocator(rule.staining.locator),
      exactCellLocator(rule.rawCombination.locator),
      exactCellLocator(rule.sourceClusterName.locator),
    ]);
    const table8Markers = [markerSummary.mainMarker, markerSummary.coMarker1, markerSummary.coMarker2];
    const table8Summary = [
      `source label ${markerSummary.sourceTableLabel.value}`,
      `main ${markerSummary.mainMarker?.raw ?? "not populated in source table"}`,
      `co-marker 1 ${markerSummary.coMarker1?.raw ?? "not populated in source table"}`,
      `co-marker 2 ${markerSummary.coMarker2?.raw ?? "not populated in source table"}`,
    ].join("; ");
    const table8Locators = compact([
      exactCellLocator(markerSummary.sourceTableLabel.locator),
      table8Markers.map((marker) => exactCellLocator(marker?.locator)),
    ]);
    const ageSummary = barcode.ageDays.countsByAge
      .map((entry) => `P${entry.ageDays}: ${entry.count}`)
      .join("; ");
    const sexSummary = `code 0: ${barcode.sexCodeCounts["0"]}; code 1: ${barcode.sexCodeCounts["1"]}; deposited header ${barcode.sexCodeCounts.depositedCodeHeader}`;
    const strainSummary = Object.entries(barcode.strainCellCounts)
      .filter(([key]) => key !== "denominatorUnit")
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ");
    const profileLocators = profile.fieldLocatorIds.map((id) => {
      const locator = locatorsById.get(id);
      return locator ? `${id}: ${locator.locator}` : id;
    });
    const exactProfileLocators = uniqueText([
      exactCellLocator(profile.samplingCount.sourceLabelLocator),
      exactCellLocator(profile.samplingCount.sourceCountLocator),
      table5Locators,
      table8Locators,
    ]);

    return recordBase({
      focusKind: "molecular_profile",
      focusId: profile.id,
      title: profile.sourceLocalLabel,
      subtitle: `${humanizeKey(profile.transmitterClass)} dorsal-horn profile · Häring 2018`,
      namespace: "haring-2018:GSE103840",
      laneLabel: "Molecular population",
      summary: "Checksum-pinned source-local dorsal-horn molecular profile. Local interneuron versus projection-neuron identity remains unresolved.",
      recordSemantics: {
        parentSourceId: "SRC-HARING-2018",
        parentRecordIds: [barcode.rawClusterName],
        recordKind: "final_source_type",
        unitOfObservation: "cell",
        assignmentAuthority: "checksum_pinned_matrix_standard_name",
        cellRosterAvailability: "exact_remote_roster_not_bundled",
        canonicalIdentityStatus: "not_established",
      },
      searchTerms: [
        profile.id,
        profile.sourceLocalLabel,
        profile.table8SourceLocalLabel,
        profile.regionClass,
        profile.transmitterClass,
        profile.molecularClass,
        profile.projectUseClass,
        profile.interneuronIdentityStatus,
        barcode.rawClusterName,
        barcode.standardName,
        barcode.rawClusterNameContext,
        identificationRules.flatMap((rule) => [
          rule.staining.value,
          rule.rawCombination.value,
          rule.sourceClusterName.value,
          rule.components.map((component) => component.gene),
        ]),
        table8Markers.flatMap((marker) => marker ? [marker.raw, marker.gene, marker.qualifier] : []),
        "postnatal P17 P28 dorsal horn cervical spatial density",
        sampleFrame.sourceAgeText,
        sampleFrame.ageNormalization,
        "28 source animals 1545 sampled cells",
        `${haring.curationFlow.initialPostQcNeuronCount} post-QC ${haring.curationFlow.excludedCellCount} exclude ${haring.curationFlow.initialBackspinClusterCount} initial clusters`,
        "2 spatial animals 6 cervical sections",
        haring.sourceDiscrepancies.flatMap((item) => [item.id, item.axis, item.status, item.sourceValues, item.projectDecision]),
        haring.source.publication.citation,
        haring.source.publication.doi,
        haring.source.publication.pmid,
        haring.source.geo.accession,
        haring.source.geo.sraStudyAccession,
        haring.source.geo.bioProjectAccession,
      ],
      evidence: [
        field("Canonical parent source", "SRC-HARING-2018", "project_source_registry", "UPG-108"),
        field("Record granularity", `final source type · observation unit: cell · parent raw cluster ${barcode.rawClusterName}`, "project_curated", "UPG-109"),
        field("Assignment / roster", "checksum-pinned matrix standard name · exact remote roster not bundled", "source_and_project_boundary", "UPG-109"),
        verbatimField("Standardized source label", barcode.standardName, "checksum_pinned_matrix_cell_column", "GSE103840_MOLECULE_COUNTS · moldata_C1_data_DHneurons_no_an!row 6 · geo-processed-matrix"),
        verbatimField("Deposited raw cluster label", barcode.rawClusterName, "checksum_pinned_matrix_cell_column", "GSE103840_MOLECULE_COUNTS · moldata_C1_data_DHneurons_no_an!row 5 · geo-processed-matrix"),
        verbatimField("Table 4 source-local label", profile.sourceLocalLabel, "source_reported_exact_label", exactCellLocator(profile.samplingCount.sourceLabelLocator)),
        field("Canonical transmitter", canonicalTransmitterValue(profile.transmitterClass, profile.molecularClass), "source_reported", "paper-source-local-taxonomy"),
        field("Source-local class", `${profile.molecularClass}; ${profile.transmitterClass}; ${profile.regionClass} spinal region`, "source_reported", "paper-source-local-taxonomy"),
        field("Exact sampled-cell count", `${profile.samplingCount.value} cells`, "source_reported_exact_count", exactCellLocator(profile.samplingCount.sourceCountLocator)),
        field("Table 5 identification rule", table5Summary, "source_reported_exact_rule", table5Locators.join(" · ")),
        field("Table 8 marker summary", table8Summary, "source_reported_marker_summary", table8Locators.join(" · ")),
        field("Matrix age cell-column summary", `${ageSummary}; range P${barcode.ageDays.minimum}-P${barcode.ageDays.maximum}; denominator ${barcode.ageDays.denominatorUnit}`, "checksum_pinned_matrix_cell_column_aggregate", "GSE103840_MOLECULE_COUNTS · moldata_C1_data_DHneurons_no_an!row 2 · geo-processed-matrix"),
        field("Deposited sex-code cell-column summary", `${sexSummary}; denominator ${barcode.sexCodeCounts.denominatorUnit}; not independent-animal prevalence`, "checksum_pinned_matrix_cell_column_aggregate", "GSE103840_MOLECULE_COUNTS · moldata_C1_data_DHneurons_no_an!row 3 · geo-processed-matrix"),
        field("Matrix strain-selection cell-column summary", `${strainSummary}; denominator ${barcode.strainCellCounts.denominatorUnit}; not independent-animal prevalence`, "checksum_pinned_matrix_cell_column_aggregate", "GSE103840_MOLECULE_COUNTS · moldata_C1_data_DHneurons_no_an!row 7 · geo-processed-matrix"),
        field("Source sample frame", `${sampleFrame.sourceAnimalCount} source animals (${cohortSummary}); ${sampleFrame.cellSamplingCount} sampled cells and ${sampleFrame.geoCellAccessionCount} GEO single-cell accessions`, "source_reported_distinct_denominators", "paper-methods-sample-frame · geo-series-record"),
        field("Sequencing-cohort age boundary", `17-28 days old (conventionally P17-P28); GEO/SRA source text: ${sampleFrame.sourceAgeText}; broad life-stage category: not source-asserted`, "source_reported_and_checksum_pinned_normalization", "geo-series-record · geo-processed-matrix row 2"),
        field("Taxonomy curation flow", `${haring.curationFlow.initialPostQcNeuronCount} post-QC neurons - ${haring.curationFlow.excludedCellCount} source-labelled exclude = ${haring.curationFlow.finalCellCount} final cells; ${haring.curationFlow.initialBackspinClusterCount} initial BackSPIN clusters -> ${haring.curationFlow.finalTypeCount} final types; ${haring.curationFlow.finalGlutCellCount} Glut-group + ${haring.curationFlow.finalGabaCellCount} Gaba-group cells`, "source_reported_pipeline_stage_counts", "paper-source-local-taxonomy · supplement-figure-s2-curation-and-conflicts · geo-processed-matrix"),
        field("Matrix label assignments", `Exact raw-cluster and standardized-name assignments are available for ${matrix.cellColumnCount} cell columns; these are cell attributes, not animal prevalence`, "checksum_pinned_matrix_cell_column", "geo-processed-matrix"),
        field("Spatial source context", `${profile.spatialContext.sourceAnimalCount} animals; ${profile.spatialContext.sectionCount} ${profile.spatialContext.sampledRegion} sections; population-level type distribution only`, "source_reported_population_level", "supplement-figure-s7-spatial-context"),
        ...haring.sourceDiscrepancies.map((item) => field(
          `Retained source discrepancy · ${item.axis}`,
          `${item.sourceValues.join(" versus ")}. Decision: ${item.projectDecision}`,
          item.status,
          item.sourceLocatorIds.join(" · "),
        )),
      ],
      gaps: [
        ...Object.entries(profile.missingEvidence).map(([label, status]) => gap(
          humanizeKey(label),
          status,
          "This source-local evidence axis is unsupported and must not be inferred from molecular markers, population-level spatial context, or co-display.",
        )),
        gap("Local-interneuron versus projection-neuron identity", profile.interneuronIdentityStatus, "The source-local molecular profile does not establish this distinction."),
        gap("Cross-source same-cell or same-type identity", "not_established", "No identity is inferred between this profile and any other molecular, morphology, anatomy, spatial, or SCI record."),
      ],
      provenance: sourceBlock({
        label: "Häring postnatal dorsal-horn source-local taxonomy",
        citation: haring.source.publication.citation,
        doi: haring.source.publication.doi,
        urls: [
          { label: "Primary article", url: haring.source.publication.articleUrl },
          { label: "GEO record", url: haring.source.geo.recordUrl },
          { label: "Processed molecule-count matrix", url: matrix.downloadUrl },
        ],
        accessions: [
          haring.source.geo.accession,
          haring.source.geo.sraStudyAccession,
          haring.source.geo.bioProjectAccession,
          `PMID:${haring.source.publication.pmid}`,
        ],
        locators: uniqueText([profileLocators, exactProfileLocators, haring.curationFlow.sourceLocatorIds, haring.sourceDiscrepancies.flatMap((item) => item.sourceLocatorIds)]),
        objectHashes: [
          { label: matrix.fileName, sha256: matrix.sha256, bytes: matrix.bytes },
          ...haring.source.supplementaryObjects.map((object) => ({ label: object.fileName, sha256: object.sha256, bytes: object.bytes })),
        ],
      }),
      coordinate: {
        geometryStatus: "TYPE_LEVEL",
        frame: "haring_dorsal_horn_source_namespace",
        registrationStatus: "unregistered",
        registrationCount: 0,
        measurementUse: "forbidden",
      },
      boundary: `${sampleFrame.interpretationBoundary} ${sampleFrame.ageNormalization} ${haring.curationFlow.interpretationBoundary} ${matrix.interpretationBoundary} ${profile.spatialContext.interpretationBoundary} Four source discrepancies remain visible and unharmonized. Search and co-display do not establish cross-source identity.`,
      navigation: { lab: "types", params: { type: profile.id }, anchor: "types-panel" },
    });
  });
}

function buildMorphologyRecords(census, analysis, supplementary, supplementaryAnalysis, sourceFrameDisclosure) {
  const sourceRecords = [...census.records, ...supplementary.records];
  const analysisRecords = [...analysis.records, ...supplementaryAnalysis.records];
  const analysisByNeuron = new Map(analysisRecords.map((record) => [record.neuronId, record]));
  const sourceFrameByNeuron = new Map(sourceFrameDisclosure.records.map((record) => [record.neuronId, record]));
  if (new Set(sourceRecords.map((record) => record.neuronId)).size !== 149 || analysisByNeuron.size !== 149 || sourceFrameByNeuron.size !== 149) {
    throw new Error("Morphology explorer inputs must resolve 142 census plus 7 supplementary objects without duplication");
  }
  return sourceRecords.map((record) => {
    const phenotype = analysisByNeuron.get(record.neuronId);
    if (!phenotype) throw new Error(`Missing morphology phenotype for ${record.neuronId}`);
    const sourceFrame = sourceFrameByNeuron.get(record.neuronId);
    if (!sourceFrame) throw new Error(`Missing source-frame disclosure for ${record.neuronId}`);
    const metadata = record.normalizedMetadata;
    const paperIds = uniqueText([record.sourcePaper.dois, record.sourcePaper.pmids]);
    const missingness = Object.entries(record.missingness).filter(([, value]) => value?.value === null);
    const sourceDiameterAvailable = metadata.sourceDiameterAvailable === true;
    const radiusEvidence = record.morphometrics.computed.radiusDerived;
    const radiusRange = radiusEvidence?.value
      ? `${metric(radiusEvidence.value.minimumMicrometre, "µm")}–${metric(radiusEvidence.value.maximumMicrometre, "µm")}`
      : null;
    const collection = sourceFrame.membership.collection;
    const routeReceipt = collection === "supplementary" ? record.comparisonMembership : null;
    if (collection === "census" && (sourceFrame.membership.censusContribution !== 1 || sourceFrame.membership.supplementaryContribution !== 0)) {
      throw new Error(`Invalid census membership for ${record.neuronId}`);
    }
    if (collection === "supplementary" && (!routeReceipt || sourceFrame.membership.censusContribution !== 0 || sourceFrame.membership.supplementaryContribution !== 1)) {
      throw new Error(`Invalid supplementary membership or route receipt for ${record.neuronId}`);
    }
    if (sourceFrame.geometryReceipt.sha256 !== record.geometry.sha256 || sourceFrame.geometryReceipt.path !== record.geometry.path) {
      throw new Error(`Source-frame geometry receipt mismatch for ${record.neuronId}`);
    }
    const geometryReceipt = `${record.geometry.path} · ${record.geometry.bytes} bytes · SHA-256 ${record.geometry.sha256}`;
    const routeReceiptText = routeReceipt
      ? `${routeReceipt.routeId} · contract ${routeReceipt.routeContractSha256} · asset manifest ${routeReceipt.routeAssetManifestSha256}`
      : "Frozen 142-record census membership; supplementary contribution 0";
    return recordBase({
      focusKind: "morphology_record",
      focusId: record.assetId,
      title: metadata.name,
      subtitle: `NMO ${record.neuronId} · ${metadata.dimensionality} · ${metadata.archive} · ${collection}`,
      namespace: `neuromorpho:${metadata.archive}`,
      laneLabel: "Source-local morphology",
      summary: `${metadata.domain}; ${metadata.physicalIntegrity}. This is one repository reconstruction record, not an independent animal or a complete cell census.`,
      searchTerms: [record.assetId, record.neuronId, metadata.archive, metadata.brainRegion, metadata.cellType, metadata.strain, metadata.gender, metadata.experimentCondition, metadata.domain, metadata.physicalIntegrity, metadata.attributes, collection, routeReceipt?.routeId, sourceDiameterAvailable ? "diameter radius derived surface available" : "No Diameter skeleton only radius surface unavailable", "internal structure unavailable membrane nucleus organelles boutons receptors ultrastructure", paperIds],
      evidence: [
        field("Repository record", `NeuroMorpho ${record.neuronId}`, "source_reported", record.assetId),
        field("Explorer collection membership", collection === "census" ? "Frozen census record (1); supplementary record (0)" : "Frozen census record (0); supplementary comparison record (1)", "checksum_pinned_project_membership", collection === "census" ? INPUTS.morphologyCensus : INPUTS.morphologySupplementary),
        verbatimField("Geometry receipt", geometryReceipt, "checksum_pinned_source_object", sourceFrame.geometryReceipt.path),
        verbatimField(collection === "supplementary" ? "Supplementary route receipt" : "Census provenance receipt", routeReceiptText, "checksum_pinned_route_or_census_membership", routeReceipt?.routeContractPath ?? INPUTS.morphologyCensus),
        field("Source-coordinate extent", `${sourceFrame.sourceCoordinates.extentMicrometre.map((value) => metric(value, "µm")).join(" × ")} · ${sourceFrame.preparation.dimensionality}`, "morphology_source_frame_disclosure", `${INPUTS.morphologySourceFrame}#NeuroMorpho:${record.neuronId}`),
        field("Preparation disclosure", `${sourceFrame.preparation.sourceSectionWording}; shrinkage ${sourceFrame.preparation.shrinkage.status}; integrity ${sourceFrame.truncation.sourcePhysicalIntegrityVerbatim}`, "source_reported_with_project_boundary", `${INPUTS.morphologySourceFrame}#NeuroMorpho:${record.neuronId}`),
        field("Cell-type labels", metadata.cellType, "source_reported", record.assetId),
        field("Region", metadata.brainRegion, "source_reported", record.assetId),
        field("Life stage", metadata.lifeStage, "source_reported", record.assetId),
        field("Dimensionality", metadata.dimensionality, "source_reported", record.assetId),
        field("Reconstruction domain", metadata.domain, "source_reported", record.assetId),
        field("Physical integrity", metadata.physicalIntegrity, "source_reported", record.assetId),
        field("Observed SWC mode", "Available: checksum-pinned source-local coordinates, topology and source types", "OBS_STANDARDIZED_SOURCE_LOCAL", record.geometry.sha256),
        field("Diameter authority", sourceDiameterAvailable ? `Official attributes report Diameter${radiusRange ? `; source radius range ${radiusRange}` : ""}` : "Official attributes report No Diameter", "source_reported", record.assetId),
        field("Radius-derived surface", sourceDiameterAvailable ? "Available after checksum verification; deterministic open six-sided tapered frusta, not observed membrane" : "Unavailable; numeric placeholder radii are ignored", sourceDiameterAvailable ? "DERIVED_FROM_OBSERVED_RADIUS" : "UNAVAILABLE", sourceDiameterAvailable ? record.geometry.sha256 : radiusEvidence?.missingReason),
        field("Same-specimen internal structure", "Unavailable: no membrane segmentation, nucleus, organelles, boutons, receptor distribution or ultrastructure", "UNAVAILABLE", record.assetId),
        field("Neurite cable length", metric(phenotype.metrics.neuriteCableLengthMicrometre, "µm"), "computed_from_checksum_pinned_swc", phenotype.sourceGeometry.sha256),
        field("Terminal nodes", phenotype.metrics.terminalNodeCount, "computed_from_checksum_pinned_swc", phenotype.sourceGeometry.sha256),
        field("Bifurcation nodes", phenotype.metrics.bifurcationNodeCount, "computed_from_checksum_pinned_swc", phenotype.sourceGeometry.sha256),
        field("Maximum centrifugal order", phenotype.metrics.maximumCentrifugalBranchOrder, "computed_from_checksum_pinned_swc", phenotype.sourceGeometry.sha256),
        field("Maximum root path", metric(phenotype.metrics.maximumRootPathLengthMicrometre, "µm"), "computed_from_checksum_pinned_swc", phenotype.sourceGeometry.sha256),
      ],
      gaps: [
        ...missingness.map(([label, value]) => gap(label, value.missingReason, "The source/API record contains no value; absence is not a biological zero.")),
        gap("Independent animal count", "not_established", phenotype.denominatorBoundary.independentAnimalCount.missingReason),
        gap("Complete axon", metadata.domain.toLowerCase().includes("axon") ? "not_complete" : "not_reconstructed", "No admitted record reports a complete axon."),
        gap("Molecular-profile identity", "not_established", "No same-cell link connects this reconstruction to a transcriptomic profile."),
        ...(!sourceDiameterAvailable ? [gap("Radius-derived surface", "unavailable", "Official source attributes report No Diameter. Placeholder standardized-SWC radii cannot be promoted to anatomical caliber.")] : []),
        gap("Observed membrane", "not_measured", "A deterministic tube surface is a display derivative and does not recover the biological membrane."),
        gap("Same-specimen internal structure", "unavailable", "No same-specimen nucleus, organelle, bouton, receptor-distribution or ultrastructural source is linked to this reconstruction; no generic substitute is allowed."),
      ],
      provenance: sourceBlock({
        label: `NeuroMorpho ${record.neuronId}`,
        citation: paperIds.join(" · "),
        doi: record.sourcePaper.dois[0] ?? null,
        urls: [
          { label: "Official API record", url: `https://neuromorpho.org/api/neuron/id/${record.neuronId}` },
          ...record.sourcePaper.dois.map((doi) => ({ label: `DOI ${doi}`, url: `https://doi.org/${doi}` })),
        ],
        accessions: paperIds,
        locators: compact([
          record.assetId,
          record.geometry.path,
          `${INPUTS.morphologySourceFrame}#NeuroMorpho:${record.neuronId}`,
          collection === "supplementary" ? `${INPUTS.morphologySupplementary}#NeuroMorpho:${record.neuronId}` : INPUTS.morphologyCensus,
          collection === "supplementary" ? `${INPUTS.morphologySupplementaryAnalysis}#NeuroMorpho:${record.neuronId}` : INPUTS.morphologyAnalysis,
          routeReceipt?.routeContractPath,
          routeReceipt?.routeAssetManifestPath,
        ]),
        objectHashes: [
          { label: "Canonical geometry", sha256: record.geometry.sha256 },
          { label: "Raw SWC", sha256: record.geometry.rawSwcSha256 },
          ...(routeReceipt ? [
            { label: "Supplementary route contract", sha256: routeReceipt.routeContractSha256 },
            { label: "Supplementary route asset manifest", sha256: routeReceipt.routeAssetManifestSha256 },
          ] : []),
        ],
      }),
      coordinate: {
        geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
        frame: metadata.sourceFrame,
        registrationStatus: metadata.registrationStatus,
        registrationCount: 0,
        measurementUse: "source_local_descriptive_only",
      },
      boundary: phenotype.denominatorBoundary.boundary,
      navigation: { lab: "morphology", params: { morphologyView: "individual", morphologyNeuron: String(record.neuronId) }, anchor: "morphology-panel" },
      morphologyMembership: {
        collection,
        censusContribution: sourceFrame.membership.censusContribution,
        supplementaryContribution: sourceFrame.membership.supplementaryContribution,
        sourceFrameLocator: `${INPUTS.morphologySourceFrame}#NeuroMorpho:${record.neuronId}`,
        analysisLocator: `${collection === "supplementary" ? INPUTS.morphologySupplementaryAnalysis : INPUTS.morphologyAnalysis}#NeuroMorpho:${record.neuronId}`,
        geometryPath: record.geometry.path,
        geometrySha256: record.geometry.sha256,
        routeId: routeReceipt?.routeId ?? null,
        routeContractPath: routeReceipt?.routeContractPath ?? null,
        routeContractSha256: routeReceipt?.routeContractSha256 ?? null,
        routeAssetManifestPath: routeReceipt?.routeAssetManifestPath ?? null,
        routeAssetManifestSha256: routeReceipt?.routeAssetManifestSha256 ?? null,
      },
    });
  });
}

function buildAnatomyRecords(anatomy, anatomySource) {
  const lanes = [
    ["interneuron-focused reference", anatomy.structures],
    ["structural context", anatomy.structuralContextStructures],
    ["motor-neuron context", anatomy.motorContextStructures],
  ];
  return lanes.flatMap(([lane, structures]) => structures.map((structure) => {
    const laneId = String(lane).replaceAll(" ", "_");
    return recordBase({
    focusKind: "anatomy_label",
    focusId: `allen_cord_20um:${anatomy.atlasVersion}:${laneId}:${structure.identifier}`,
    title: structure.name,
    subtitle: `${structure.abbreviation} · source ID ${structure.identifier}`,
    namespace: `allen_cord_20um:${anatomy.atlasVersion}:${laneId}`,
    laneLabel: "Reference anatomy",
    summary: `Exact source identifier represented in the pinned ${anatomy.atlas} terminology/annotation derivative. This is reference context, not an interneuron record.`,
    searchTerms: [structure.identifier, structure.abbreviation, structure.browserCategory, lane, structure.sourceHierarchy?.map((item) => [item.name, item.abbreviation])],
    evidence: [
      field("Source identifier", structure.identifier, "source_atlas", "atlas-fine-anatomy.json"),
      field("Abbreviation", structure.abbreviation, "source_atlas", "atlas-fine-anatomy.json"),
      field("Project navigation category", structure.browserCategory ?? lane, "project_curated", anatomy.browserCategoryAuthority),
      field("Semantic lane", lane, "project_curated", anatomy.lanePolicy?.policy ?? "lanePolicy"),
      field("Source hierarchy", structure.sourceHierarchy?.map((item) => `${item.name} (${item.abbreviation})`), "source_atlas", "sourceHierarchy"),
      field("Sampled planes present", `${structure.sampledPlaneSummary.presentPlaneCount}/${anatomy.sampledZIndices.length}`, "computed_exact_mask_inventory", "sampledPlaneSummary"),
      field("Full-volume source voxels", structure.fullVolumeDiagnostic.voxelCount, "computed_exact_mask_inventory", "fullVolumeDiagnostic"),
    ],
    gaps: [
      gap("Spinal segment label", anatomy.segmentLabelStatus, "The sampled z index is not assigned to a named C1–S3 segment."),
      gap("Cell or type membership", "not_applicable", "An anatomical source mask does not identify a molecular population or individual neuron."),
      gap("Cross-lane registration", "not_established", "No morphology, molecular profile or SCI evidence entity is registered to this structure."),
      ...structure.planes.filter((plane) => plane.segment?.value === null).slice(0, 1).map(() => gap("Plane-specific segment", "pending_curation", "All plane records preserve null segment values rather than inventing labels.")),
    ],
    provenance: sourceBlock({
      label: `${anatomySource.name} ${anatomySource.version}`,
      citation: anatomySource.citation,
      doi: "10.1016/j.crmeth.2021.100074",
      urls: [{ label: "Source atlas dataset", url: anatomySource.atlas_link }],
      accessions: [anatomy.sourceAtlasAssetId],
      locators: [`source identifier ${structure.identifier}`, `atlas-fine-anatomy.json`, `source-atlas-manifest.json`],
    }),
    coordinate: {
      geometryStatus: anatomy.geometryStatus,
      frame: anatomy.coordinateSpaceId,
      registrationStatus: anatomy.registrationStatus,
      registrationCount: anatomy.registrationCount,
      measurementUse: anatomy.measurementUse,
    },
    boundary: `${display(anatomy.componentPolicy)}; ${display(anatomy.targetPolicy)}. Source identity is preserved; measurement remains forbidden.`,
    navigation: { lab: "atlas", params: { anatomyStructure: String(structure.identifier) }, anchor: "atlas-reference-panel" },
  });
  }));
}

function buildCoverageRecords(coverage) {
  const axisById = new Map(coverage.axes.map((axis) => [axis.id, axis]));
  return coverage.lanes.map((lane) => {
    const statusCounts = lane.coverage.reduce((counts, entry) => ({ ...counts, [entry.status]: (counts[entry.status] ?? 0) + 1 }), {});
    return recordBase({
      focusKind: "source_lane",
      focusId: lane.id,
      title: lane.shortLabel,
      subtitle: lane.role,
      namespace: `coverage:${lane.id}`,
      laneLabel: "Source coverage",
      summary: lane.sourceLocalLabelScope,
      searchTerms: [lane.citation, lane.doi, lane.accessions.map((item) => item.id), lane.sourceLocalLabels, lane.sampleFrame, lane.role],
      evidence: [
        field("Source role", lane.role, "project_curated", lane.doi),
        field("Sample frame", lane.sampleFrame, "source_reported", lane.doi),
        field("Source-local labels", lane.sourceLocalLabels, "source_reported", lane.doi),
        field("Direct axes", statusCounts.direct ?? 0, "project_curated", coverage.releaseDate),
        field("Contextual axes", statusCounts.contextual ?? 0, "project_curated", coverage.releaseDate),
        ...lane.coverage.filter((entry) => entry.status === "direct").map((entry) => field(axisById.get(entry.axisId)?.label ?? entry.axisId, entry.evidence, "project_curated", entry.sourceLocator)),
      ],
      gaps: lane.coverage.filter((entry) => entry.status === "not_measured" || entry.status === "not_ingested")
        .map((entry) => gap(axisById.get(entry.axisId)?.label ?? entry.axisId, entry.status, `${entry.evidence} ${entry.displayBoundary}`)),
      provenance: sourceBlock({
        label: lane.shortLabel,
        citation: lane.citation,
        doi: lane.doi,
        urls: [
          { label: "Primary article", url: lane.articleUrl },
          ...lane.accessions.map((item) => ({ label: item.id, url: item.url })),
        ],
        accessions: lane.accessions.map((item) => item.id),
        locators: lane.coverage.map((entry) => entry.sourceLocator),
      }),
      coordinate: {
        geometryStatus: "METADATA_ONLY",
        frame: lane.coordinateAuthority,
        registrationStatus: "unregistered",
        registrationCount: lane.projectRegistrationCount,
        measurementUse: "source_specific_only",
      },
      boundary: `${lane.crossStudyMappingStatus}; a coverage row is not a same-cell or same-type relationship.`,
      navigation: { lab: "coverage", params: { coverageLane: lane.id }, anchor: "coverage-panel" },
    });
  });
}

function buildMatsonSciPopulationRecords(matson) {
  const sourceFileHashes = matson.source.sourceFiles.map((sourceFile) => ({
    label: sourceFile.fileName,
    sha256: sourceFile.sha256,
  }));
  const sampleAccessions = uniqueText(matson.samples.flatMap((sample) => [
    sample.geoAccession,
    sample.bioSample,
    sample.sraExperiment,
  ]));

  return matson.populations.map((population) => recordBase({
    focusKind: "sci_population",
    focusId: population.id,
    title: population.sourceLabel,
    subtitle: `${population.sourceSubclass} · Matson 2022`,
    namespace: "matson-2022:GSE172167",
    laneLabel: "Neuronal SCI time course",
    summary: `${population.sourceLabel} is a source-local label-transfer population observed across five discrete SCI conditions. Captured nucleus counts are not biological prevalence, and local-interneuron versus projection-neuron status is unresolved unless this record is motor-neuron context.`,
    searchTerms: [
      population.shortLabel,
      population.sourceSubclass,
      population.transmitterContext,
      population.sourceAnnotationMethod,
      population.rankedMarkerPanel.rankedGenes.map((marker) => marker.gene),
      population.projectUseClass,
      population.timepointCounts.map((observation) => observation.timepointId),
      matson.timepoints.map((timepoint) => [timepoint.sourceLabel, timepoint.phase]),
      matson.samples.map((sample) => [sample.id, sample.geoTitle, sample.geoAccession, sample.bioSample, sample.sraExperiment]),
      matson.source.citation,
      matson.source.doi,
      matson.source.pmid,
      matson.source.repositories.geo.accession,
      matson.source.repositories.sra.accession,
      matson.source.repositories.bioProject.accession,
    ],
    evidence: [
      field("Source-local label", population.sourceLabel, "source_derived_exact_metadata", "MAT-FIG2; processed GEO metadata"),
      field("Source subclass", population.sourceSubclass, "source_reported", "MAT-FIG2"),
      field("Transmitter context", population.transmitterContext, "source_reported", "MAT-FIG2"),
      field("Annotation method", population.sourceAnnotationMethod, "source_reported", "MAT-FIG2"),
      field(
        "Complete ranked marker panel · 20 genes",
        population.rankedMarkerPanel.rankedGenes.map((marker) => `${marker.rank}. ${marker.gene}`),
        "source_reported_rank_without_score",
        population.rankedMarkerPanel.sourceLocator,
      ),
      field("Project-use class", population.projectUseClass, "project_curated", "UPG-064"),
      field("Captured neuronal nuclei", population.capturedNeuronalNuclei, "source_derived_exact_count", "GSE172167 processed metadata"),
      ...population.timepointCounts.map((observation) => {
        const timepoint = matson.timepoints.find((item) => item.id === observation.timepointId);
        return field(
          `${timepoint?.sourceLabel ?? observation.timepointId} captured count`,
          `${observation.count} / ${observation.capturedNeuronalNucleiDenominator} neuronal nuclei across 3 cords`,
          "source_derived_exact_count",
          `${observation.timepointId}; ${timepoint?.geoAccessions.join(" · ") ?? "GSE172167"}`,
        );
      }),
      field(
        "Source sample frame",
        `${matson.scope.independentAnimalCount} independent female mouse cords; ${matson.scope.independentAnimalCountPerCondition} per condition; ${matson.scope.capturedNeuronalNucleiCount} captured neuronal nuclei`,
        "source_reported_and_derived_count",
        "MAT-FIG1; MAT-METHODS; GSE172167 processed metadata",
      ),
    ],
    gaps: [
      ...Object.entries(population.missingEvidence).map(([label, status]) => gap(
        label,
        status,
        "This axis is unavailable for this exact source-local population and remains empty rather than inferred from another source.",
      )),
      gap(
        "Biological prevalence or longitudinal abundance",
        "not_established",
        "Captured nuclei are conditioned on recovery and processing at each sampled timepoint; the five observations are not same-cell trajectories or tissue-prevalence estimates.",
      ),
    ],
    provenance: sourceBlock({
      label: "Matson neuronal SCI time course",
      citation: matson.source.citation,
      doi: matson.source.doi,
      urls: [
        { label: "Primary article", url: matson.source.articleUrl },
        { label: "GEO GSE172167", url: matson.source.repositories.geo.url },
        { label: "SRA SRP315018", url: matson.source.repositories.sra.url },
        { label: "BioProject PRJNA722283", url: matson.source.repositories.bioProject.url },
      ],
      accessions: [
        `PMID:${matson.source.pmid}`,
        matson.source.repositories.geo.accession,
        matson.source.repositories.sra.accession,
        matson.source.repositories.bioProject.accession,
        ...sampleAccessions,
      ],
      locators: uniqueText([
        matson.sourceLocators.map((locator) => `${locator.id}: ${locator.locator}`),
        population.sampleCounts.map((observation) => `${observation.sampleId}/${observation.geoAccession}`),
      ]),
      objectHashes: [
        ...sourceFileHashes,
        ...matson.source.articleSupplementReferences.map((item) => ({ label: item.fileName, sha256: item.sha256 })),
      ],
    }),
    coordinate: {
      geometryStatus: "METADATA_ONLY",
      frame: "matson_lumbar_snrna_source_namespace",
      registrationStatus: "unregistered",
      registrationCount: 0,
      measurementUse: "source_local_counts_only",
    },
    boundary: `${population.evidenceBoundary} ${matson.experimentalDesign.selectionBoundary}`,
    navigation: { lab: "sci", params: { sciTime: "all" }, anchor: "sci-panel" },
  }));
}

function countBy(records, key) {
  return Object.fromEntries([...records.reduce((map, record) => map.set(record[key], (map.get(record[key]) ?? 0) + 1), new Map())]
    .sort(([a], [b]) => String(a).localeCompare(String(b))));
}

function parseOutputDir() {
  const index = process.argv.indexOf("--output-dir");
  if (index === -1) return DEFAULT_OUTPUT;
  const value = process.argv[index + 1];
  if (!value) throw new Error("--output-dir requires a path");
  return path.resolve(ROOT, value);
}

async function main() {
  const outputDir = parseOutputDir();
  const { loaded, sourceFiles } = await loadInputs();
  const baseRecords = [
    ...buildSciEvidenceRecords(loaded.atlasRelease, loaded.researchMvp),
    ...buildRussRecords(loaded.russ, loaded.russInformation, sourceFiles.find((source) => source.name === "russInformation").sha256),
    ...buildSathyamurthyRecords(loaded.sathyamurthy),
    ...buildHayashiV2aRecords(loaded.hayashiV2a),
    ...buildHaringDorsalHornRecords(loaded.haringDorsalHorn),
    ...buildAlkaslasiRecords(loaded.alkaslasi),
    ...buildDmrt3Di6Records(loaded.dmrt3Di6),
    ...buildRoomeDilRecords(loaded.roomeDil),
    ...buildDelileDevelopmentalRecords(loaded.delileDevelopmental),
    ...buildCrozatPkd2l1Records(loaded.crozatPkd2l1),
    ...buildCanoGomezP56Records(loaded.canoGomezP56),
    ...buildMorphologyRecords(
      loaded.morphologyCensus,
      loaded.morphologyAnalysis,
      loaded.morphologySupplementary,
      loaded.morphologySupplementaryAnalysis,
      loaded.morphologySourceFrame,
    ),
    ...buildAnatomyRecords(loaded.anatomy, loaded.anatomySource),
    ...buildCoverageRecords(loaded.coverage),
    ...buildMatsonSciPopulationRecords(loaded.matsonSci),
  ]
    .map(ensureMolecularInternalStructureGap)
    .sort((a, b) => a.focusKind.localeCompare(b.focusKind) || a.namespace.localeCompare(b.namespace) || a.title.localeCompare(b.title) || a.focusId.localeCompare(b.focusId));
  const records = attachResearchRecordPresentations(baseRecords);
  const focusCounts = countBy(records, "focusKind");
  for (const [focusKind, expectedCount] of Object.entries(EXPECTED_FOCUS_COUNTS)) {
    if (focusCounts[focusKind] !== expectedCount) {
      throw new Error(`Research Explorer ${focusKind} count ${focusCounts[focusKind]} does not match expected ${expectedCount}`);
    }
  }
  if (records.length !== 641 || sourceFiles.length !== 22) {
    throw new Error(`Research Explorer build denominator mismatch: ${records.length} records from ${sourceFiles.length} source files`);
  }

  const indexPayload = {
    schemaVersion: "1.14.0",
    assetSetId: ASSET_SET_ID,
    releaseDate: RELEASE_DATE,
    scientificPolicy: {
      groupingUnit: "source_record_namespace",
      crossSourceIdentityDefault: "not_established",
      searchCreatesRelationship: false,
      registrationCount: 0,
      missingIsBiologicalAbsence: false,
      recordDenominatorsAreHarmonized: false,
      morphologyMembership: {
        frozenCensusRecordCount: 142,
        supplementaryRecordCount: 7,
        viewableMorphologyRecordCount: 149,
        supplementaryIsCensus: false,
      },
      missingnessContract: {
        schemaVersion: "1.0.0",
        reasonCodes: MISSINGNESS_REASON_CODES,
        inferenceAllowed: false,
        sharedScopes: ["shared_dataset_limit", "shared_project_limit"],
      },
      presentationContract: {
        contractId: "research-record-presentation-0.1",
        evidencePartition: "record_identity_record_specific_shared_source_context",
        molecularSwitchEffect: "clear_prior_cell_geometry_and_replace_source_record_evidence_model",
        generatedFallbackPrimitiveCount: 0,
      },
    },
    counts: {
      total: records.length,
      byFocusKind: focusCounts,
      byNamespace: countBy(records, "namespace"),
    },
    records,
  };
  const indexBytes = Buffer.from(stableJson(indexPayload));
  const manifestPayload = {
    schemaVersion: "1.14.0",
    assetSetId: ASSET_SET_ID,
    releaseDate: RELEASE_DATE,
    index: {
      path: "search-index.json",
      bytes: indexBytes.byteLength,
      sha256: sha256(indexBytes),
      recordCount: records.length,
    },
    sourceFiles,
    expectedCounts: {
      total: records.length,
      byFocusKind: focusCounts,
    },
    scientificBoundary: "This index groups independently admitted source records for discovery. Search, co-display, shared words, papers or accessions do not create same-cell, same-type, coordinate, causal or anatomical relationships.",
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "search-index.json"), indexBytes);
  await writeFile(path.join(outputDir, "asset-manifest.json"), stableJson(manifestPayload));
  process.stdout.write(`Research Explorer index built: ${records.length} records; ${manifestPayload.index.sha256}\n`);
}

await main();
