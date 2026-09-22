#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  researchLabForFocus,
  validateResearchExplorerIndex as validateBrowserIndex,
  validateResearchExplorerManifest,
} from "../app/research-explorer-index.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_DIRECTORY = path.join(PROJECT_ROOT, "public/data/research_explorer_index_v1");
const ROOME_TAXONOMY = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data/roome-dil-source-taxonomy-0.1.json"), "utf8"));
const DELILE_TAXONOMY = JSON.parse(await readFile(path.join(PROJECT_ROOT, "data/delile-developmental-interneuron-taxonomy-0.1.json"), "utf8"));
const CANO_GOMEZ_REGISTRY_PATH = "public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json";
const CANO_GOMEZ_REGISTRY = JSON.parse(await readFile(path.join(PROJECT_ROOT, CANO_GOMEZ_REGISTRY_PATH), "utf8"));

const EXPECTED_NAMESPACE_COUNTS = Object.freeze({
  "allen_cord_20um:3.0:interneuron-focused_reference": 37,
  "allen_cord_20um:3.0:motor-neuron_context": 33,
  "allen_cord_20um:3.0:structural_context": 3,
  "coverage:delile-2019": 1,
  "coverage:haring-2018": 1,
  "coverage:hayashi-2018": 1,
  "coverage:russ-2021": 1,
  "coverage:sathyamurthy-2018": 1,
  "coverage:tabulae-paralytica-2024": 1,
  "coverage:iglesias-gonzalez-2021": 1,
  "coverage:roome-2026": 1,
  "haring-2018:GSE103840": 30,
  "hayashi-2018:GSE108788": 11,
  "alkaslasi-2021:GSE167597": 8,
  "crozat-2025:figshare-29430869-v2": 1,
  "cano-gomez-2026:GSE318731": 11,
  "delile-2019:E-MTAB-7320": 51,
  "iglesias-gonzalez-2021:gse185731:mmusculus": 6,
  "neuromorpho:Bannatyne": 2,
  "neuromorpho:Chen_Dai": 2,
  "neuromorpho:Hughes": 1,
  "neuromorpho:Todd": 144,
  "matson-2022:GSE172167": 17,
  "ohri-research-mvp-0.2": 7,
  "roome-2026:GSE291462": 157,
  "russ-2021": 69,
  "sathyamurthy-2018": 43,
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function resolveProjectFile(relativePath) {
  check(typeof relativePath === "string" && relativePath.length > 0, "Research Explorer source path is invalid");
  check(!path.isAbsolute(relativePath), `Research Explorer source path must be relative: ${relativePath}`);
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  check(resolved.startsWith(`${PROJECT_ROOT}${path.sep}`), `Research Explorer source path escapes the project: ${relativePath}`);
  return resolved;
}

function sourceBytes(sourceFilesByPath, relativePath) {
  if (sourceFilesByPath instanceof Map) return sourceFilesByPath.get(relativePath);
  return sourceFilesByPath?.[relativePath];
}

function validateByteDeclaration(declaration, bytes, label) {
  check(bytes instanceof Uint8Array, `${label} bytes are unavailable`);
  check(bytes.byteLength === declaration.bytes, `${label} byte count does not match the manifest`);
  check(sha256(bytes) === declaration.sha256, `${label} SHA-256 does not match the manifest`);
}

export function validateResearchExplorerManifestIntegrity(manifest, indexBytes, sourceFilesByPath) {
  validateResearchExplorerManifest(manifest);
  validateByteDeclaration(manifest.index, indexBytes, "Research Explorer search index");

  const names = new Set();
  const paths = new Set();
  for (const source of manifest.sourceFiles) {
    check(typeof source.name === "string" && source.name.length > 0, "Research Explorer source name is invalid");
    check(!names.has(source.name), `Research Explorer source name is duplicated: ${source.name}`);
    check(!paths.has(source.path), `Research Explorer source path is duplicated: ${source.path}`);
    names.add(source.name);
    paths.add(source.path);
    resolveProjectFile(source.path);
    validateByteDeclaration(source, sourceBytes(sourceFilesByPath, source.path), `Research Explorer source ${source.name}`);
  }
  return manifest;
}

function validateNavigation(record) {
  check(record.navigation.lab === researchLabForFocus(record.focusKind), `Research Explorer ${record.key} opens the wrong lab`);
  const params = record.navigation.params;
  if (record.focusKind === "sci_entity") {
    check(params.cell === record.focusId, `Research Explorer ${record.key} has a stale SCI selection`);
  } else if (record.focusKind === "molecular_profile") {
    check(params.type === record.focusId, `Research Explorer ${record.key} has a stale molecular selection`);
  } else if (record.focusKind === "morphology_record") {
    check(params.morphologyView === "individual" && record.focusId === `NeuroMorpho:${params.morphologyNeuron}`, `Research Explorer ${record.key} has a stale morphology selection`);
  } else if (record.focusKind === "anatomy_label") {
    check(record.focusId === `${record.namespace}:${params.anatomyStructure}`, `Research Explorer ${record.key} has a stale anatomy selection`);
  } else if (record.focusKind === "sci_population") {
    check(params.sciTime === "all" && record.namespace === "matson-2022:GSE172167", `Research Explorer ${record.key} has a stale SCI time-course selection`);
  } else if (record.focusKind === "source_lane") {
    check(params.coverageLane === record.focusId && record.namespace === `coverage:${record.focusId}`, `Research Explorer ${record.key} has a stale coverage selection`);
  }
}

function validateNamespaceCounts(counts, label) {
  const expectedEntries = Object.entries(EXPECTED_NAMESPACE_COUNTS);
  check(counts && Object.keys(counts).length === expectedEntries.length, `${label} are invalid`);
  for (const [namespace, expected] of expectedEntries) {
    check(counts[namespace] === expected, `${label} are invalid for ${namespace}`);
  }
}

function evidenceByLabel(record, label) {
  return record.evidence.find((item) => item.label === label);
}

function validateMolecularKnowledgeReconciliation(records) {
  const profiles = records.filter((record) => record.focusKind === "molecular_profile");
  check(profiles.length === 387, "Research Explorer reconciled molecular-profile denominator is invalid");
  check(new Set(profiles.map((record) => record.namespace)).size === 10, "Research Explorer molecular source-namespace denominator is invalid");
  for (const record of profiles) {
    const transmitters = record.evidence.filter((item) => item.label === "Canonical transmitter");
    check(transmitters.length === 1 && transmitters[0].value.length > 0, `Research Explorer ${record.key} canonical transmitter is missing or duplicated`);
    const internalGaps = record.gaps.filter((item) => item.axisId === "internal_structure" && item.label === "Internal structure");
    check(internalGaps.length === 1 && internalGaps[0].inferenceAllowed === false, `Research Explorer ${record.key} internal-structure gap is missing or duplicated`);
  }
  const hayashi = profiles.filter((record) => record.namespace === "hayashi-2018:GSE108788");
  check(hayashi.length === 11 && hayashi.every((record) => evidenceByLabel(record, "Canonical transmitter")?.value === "Excitatory"), "Research Explorer Hayashi canonical transmitter evidence is invalid");
  const crozat = profiles.find((record) => record.namespace === "crozat-2025:figshare-29430869-v2");
  check(evidenceByLabel(crozat, "Canonical transmitter")?.value === "Inhibitory / GABAergic", "Research Explorer Crozat canonical transmitter evidence is invalid");
  const dmrt3 = profiles.filter((record) => record.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus");
  check(dmrt3.length === 6 && dmrt3.every((record) => /dual GABAergic\/glycinergic/.test(evidenceByLabel(record, "Canonical transmitter")?.value ?? "")), "Research Explorer Dmrt3/dI6 canonical transmitter evidence is invalid");
  const canoGomez = profiles.filter((record) => record.namespace === "cano-gomez-2026:GSE318731");
  check(canoGomez.length === 11 && canoGomez.every((record) => evidenceByLabel(record, "Canonical transmitter")?.value === "Cholinergic"), "Research Explorer Cano-Gomez canonical transmitter evidence is invalid");
}

function validateDelileDevelopmentalRecords(records) {
  const profiles = records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "delile-2019:E-MTAB-7320");
  const expectedById = new Map(DELILE_TAXONOMY.profiles.map((profile) => [profile.id, profile]));
  let sampledCellCount = 0;
  check(profiles.length === 51 && expectedById.size === 51, "Research Explorer Delile fine-subtype denominator is invalid");
  for (const record of profiles) {
    const profile = expectedById.get(record.focusId);
    check(profile, `Research Explorer ${record.key} has an unexpected or duplicated Delile identity`);
    expectedById.delete(record.focusId);
    const stageCounts = profile.timepointCellCounts.map((entry) => `${entry.lifeStage}: ${entry.cellCount}`).join(" · ");
    check(record.title === profile.sourceLocalLabel
      && record.recordSemantics.parentSourceId === "SRC-DELILE-2019"
      && record.recordSemantics.recordKind === "source_reported_developmental_fine_subtype"
      && record.recordSemantics.unitOfObservation === "annotated_source_cell", `Research Explorer ${record.key} Delile identity or granularity is invalid`);
    check(evidenceByLabel(record, "Source-local label")?.value === profile.sourceLocalLabel
      && evidenceByLabel(record, "Source cardinal class")?.value === profile.cardinalClass, `Research Explorer ${record.key} Delile source labels are invalid`);
    check(evidenceByLabel(record, "Canonical transmitter")?.value === "Not established from the pinned annotation object", `Research Explorer ${record.key} invents a Delile transmitter assignment`);
    check(evidenceByLabel(record, "Exact sampled-cell count")?.value === `${profile.cellCount} source-annotated fine-subtype cells`, `Research Explorer ${record.key} Delile sampled-cell count is invalid`);
    check(evidenceByLabel(record, "Fine-subtype timepoint cell counts")?.value === stageCounts, `Research Explorer ${record.key} Delile timepoint distribution is invalid`);
    check(evidenceByLabel(record, "DV field coverage")?.value.startsWith(`${profile.dvObservedCellCount}/${profile.cellCount}`), `Research Explorer ${record.key} Delile DV coverage is invalid`);
    check(evidenceByLabel(record, "Pseudotime field coverage")?.value.startsWith(`${profile.pseudotimeObservedCellCount}/${profile.cellCount}`), `Research Explorer ${record.key} Delile pseudotime coverage is invalid`);
    check(evidenceByLabel(record, "3D and internal model state")?.value === "0 admitted type-specific geometry · 0 admitted internal structures", `Research Explorer ${record.key} Delile zero-model receipt is invalid`);
    for (const [axisId, reasonCode] of [
      ["single_cell_morphology", "not_measured_by_study"],
      ["whole_cell_geometry", "not_measured_by_study"],
      ["cell_coordinates", "source_schema_no_field"],
      ["atlas_registration", "no_admitted_transform"],
      ["adult_identity", "relationship_not_established"],
      ["internal_structure", "source_schema_no_field"],
      ["cross_source_same_cell_identity", "relationship_not_established"],
    ]) {
      check(record.gaps.some((item) => item.axisId === axisId && item.reasonCode === reasonCode && item.inferenceAllowed === false), `Research Explorer ${record.key} Delile ${axisId} boundary is invalid`);
    }
    check(record.coordinate.geometryStatus === "TYPE_LEVEL"
      && record.coordinate.frame === "delile_embryonic_fine_subtype_without_physical_cell_coordinates"
      && record.coordinate.registrationCount === 0
      && record.coordinate.measurementUse === "forbidden", `Research Explorer ${record.key} creates Delile geometry or registration`);
    check(record.provenance.accessions.includes("E-MTAB-7320")
      && record.provenance.objectHashes.some((item) => item.sha256 === DELILE_TAXONOMY.source.annotatedMetadataObject.sha256), `Research Explorer ${record.key} Delile source receipt is invalid`);
    check(/Source spelling dl is retained verbatim/.test(record.boundary)
      && /not deduplicated cross-study or adult canonical identities/.test(record.boundary), `Research Explorer ${record.key} Delile label or identity boundary is invalid`);
    sampledCellCount += profile.cellCount;
  }
  check(expectedById.size === 0, "Research Explorer Delile fine-subtype identities are incomplete");
  check(sampledCellCount === 15_217, "Research Explorer Delile fine-subtype cell denominator is invalid");
}

function validateRoomeDilRecords(records) {
  const profiles = records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "roome-2026:GSE291462");
  const expectedById = new Map(ROOME_TAXONOMY.profiles.map((profile) => [profile.id, profile]));
  const featurePanels = new Set();
  let capturedCellCount = 0;
  let percentOfDil = 0;
  let quarantinedGeneRowCount = 0;

  check(profiles.length === 157 && expectedById.size === 157, "Research Explorer Roome refined-dIL denominator is invalid");
  for (const record of profiles) {
    const profile = expectedById.get(record.focusId);
    check(profile, `Research Explorer ${record.key} has an unexpected or duplicated Roome identity`);
    expectedById.delete(record.focusId);

    const labels = record.evidence.map((item) => item.label);
    check(new Set(labels).size === labels.length, `Research Explorer ${record.key} duplicates evidence rows`);
    const transmitter = profile.transmitterClass === "inhibitory_family_context" ? "Inhibitory" : "Excitatory";
    const displayGenes = profile.displayFeatures.map((feature) => feature.gene);
    const displayPanel = displayGenes.join(" · ");
    const displayLocators = profile.displayFeatures
      .map((feature) => `Table S7 · neuron_refined_markers!${feature.sourceRange}`)
      .join(" · ");

    check(record.title === profile.sourceLocalLabel && record.subtitle === `${profile.family} · ${transmitter} family context · Roome 2026`, `Research Explorer ${record.key} source-local identity is invalid`);
    check(record.recordSemantics.parentSourceId === "SRC-ROOME-2026"
      && record.recordSemantics.recordKind === "source_reported_refined_dil_type"
      && record.recordSemantics.unitOfObservation === "captured_dil_cell_summary"
      && record.recordSemantics.assignmentAuthority === "checksum_pinned_table_s6_roster_and_table_s7_differential_rows"
      && record.recordSemantics.cellRosterAvailability === "type_aggregate_only_full_rds_link_only", `Research Explorer ${record.key} Roome granularity is invalid`);
    check(evidenceByLabel(record, "Source-local label")?.value === profile.sourceLocalLabel
      && evidenceByLabel(record, "Source-local label")?.locator === `Table S6 · Sheet1!A${profile.sourceRow}`, `Research Explorer ${record.key} source-label receipt is invalid`);
    check(evidenceByLabel(record, "Canonical transmitter")?.value === `${transmitter} · ${profile.family} source-family context`, `Research Explorer ${record.key} family transmitter context is invalid`);
    check(evidenceByLabel(record, "Exact captured-cell count")?.value === `${profile.frequency} captured refined dIL cells`
      && evidenceByLabel(record, "Exact captured-cell count")?.locator === `Table S6 · Sheet1!B${profile.sourceRow}`, `Research Explorer ${record.key} captured-cell count is invalid`);
    check(evidenceByLabel(record, "Percent of captured dIL denominator")?.value === `${profile.percentOfDil}%`
      && evidenceByLabel(record, "Percent of captured dIL denominator")?.locator === `Table S6 · Sheet1!C${profile.sourceRow}`, `Research Explorer ${record.key} captured-cell composition is invalid`);
    for (const [label, expected, column] of [
      ["Mean genes per cell", profile.meanGenesPerCell, "D"],
      ["Mean silhouette score", profile.meanSilhouetteScore, "E"],
      ["Mean LISI score", profile.meanLisiScore, "F"],
    ]) {
      const row = evidenceByLabel(record, label);
      check(row?.value === String(expected) && row.locator === `Table S6 · Sheet1!${column}${profile.sourceRow}` && row.authority === "source_reported_cluster_qc", `Research Explorer ${record.key} ${label} is invalid`);
    }

    check(profile.displayFeatures.length === 6
      && new Set(displayGenes).size === 6
      && profile.displayFeatures.every((feature, index) => feature.rank === index + 1
        && feature.avgLog2Fc > 0
        && feature.pct1 >= ROOME_TAXONOMY.signatureMethod.pct1Minimum
        && feature.prevalenceDelta >= ROOME_TAXONOMY.signatureMethod.prevalenceDeltaMinimum
        && feature.adjustedPValue <= ROOME_TAXONOMY.signatureMethod.adjustedPValueMaximum), `Research Explorer ${record.key} top-six differential-feature derivation is invalid`);
    const featureRow = evidenceByLabel(record, "Positive differential features meeting display thresholds");
    check(featureRow?.value === displayPanel
      && featureRow.authority === "deterministic_view_over_source_rows"
      && featureRow.locator === displayLocators, `Research Explorer ${record.key} top-six differential-feature receipt is invalid`);
    check(displayGenes.every((gene) => !/^2025-03-\d{2}$/.test(gene)), `Research Explorer ${record.key} promotes a quarantined spreadsheet date token`);
    check(evidenceByLabel(record, "Differential-feature display audit")?.value === `6 shown of ${profile.differentialFeatureAudit.positiveDisplayCandidateCount} qualifying rows · ${profile.differentialFeatureAudit.retainedTextGeneRowCount}/100 text-gene rows · ${profile.differentialFeatureAudit.quarantinedGeneRowCount} quarantined`, `Research Explorer ${record.key} differential-feature audit is invalid`);
    check(evidenceByLabel(record, "3D and internal model state")?.value === "0 admitted type-specific geometry · 0 admitted internal structures", `Research Explorer ${record.key} zero-model receipt is invalid`);

    for (const [axisId, reasonCode] of [
      ["single_cell_morphology", "not_measured_by_study"],
      ["whole_cell_geometry", "not_measured_by_study"],
      ["internal_structure", "not_measured_by_study"],
      ["cell_coordinates", "relationship_not_established"],
      ["atlas_registration", "no_admitted_transform"],
      ["cross_source_same_cell_identity", "relationship_not_established"],
    ]) {
      check(record.gaps.filter((gap) => gap.axisId === axisId && gap.reasonCode === reasonCode && gap.inferenceAllowed === false).length === 1, `Research Explorer ${record.key} ${axisId} boundary is invalid`);
    }
    check(record.coordinate.geometryStatus === "TYPE_LEVEL"
      && record.coordinate.frame === "roome_embryonic_dil_type_aggregate_without_same_cell_geometry"
      && record.coordinate.registrationStatus === "unregistered"
      && record.coordinate.registrationCount === 0
      && record.coordinate.measurementUse === "forbidden", `Research Explorer ${record.key} creates Roome geometry or registration`);
    check(record.provenance.accessions.includes("GSE291462")
      && record.provenance.objectHashes.some((item) => item.sha256 === "8f52a7a1f223953a5b57a50a01679f9626c6d73a13f1aba8b61093b2aeb4cdd2")
      && record.provenance.objectHashes.some((item) => item.sha256 === "2ffcf3dc0773d4242cbd1d7312994ab64a2a474e463c13864d7aaa5f073a829e")
      && record.provenance.objectHashes.some((item) => item.sha256 === ROOME_TAXONOMY.derivation.fullFeatureEvidenceSha256), `Research Explorer ${record.key} Roome provenance receipts are invalid`);
    check(/captured-cell count within the 61,444 refined dIL cells, not population prevalence/.test(record.boundary)
      && /no morphology, whole-cell geometry, internal structure, same-cell spatial coordinate or project registration/.test(record.boundary), `Research Explorer ${record.key} denominator or geometry boundary is invalid`);

    capturedCellCount += profile.frequency;
    percentOfDil += profile.percentOfDil;
    quarantinedGeneRowCount += profile.differentialFeatureAudit.quarantinedGeneRowCount;
    check(!featurePanels.has(displayPanel), `Research Explorer ${record.key} repeats another Roome top-six evidence panel`);
    featurePanels.add(displayPanel);
  }

  check(expectedById.size === 0, "Research Explorer Roome refined-dIL identities are incomplete");
  check(capturedCellCount === 61_444 && Math.abs(percentOfDil - 100) < 1e-9, "Research Explorer Roome captured-cell denominator is invalid");
  check(quarantinedGeneRowCount === 26, "Research Explorer Roome quarantined-gene denominator is invalid");
  check(featurePanels.size === 157, "Research Explorer Roome selected-record evidence does not vary across all refined types");
}

function validateDmrt3Di6Records(records) {
  const profiles = records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus");
  const expected = new Map([
    ["m1", [84, "Zfhx3 · Meis2 · Zfhx4", "early"]],
    ["m2", [34, "Irx4 · Tshz3 · Ldb2", "middle"]],
    ["m3", [33, "Pid1 · Sst · Slit2", "middle"]],
    ["m4", [45, "Hoxb8 · Hoxb7 · Hoxb9", "late"]],
    ["m5", [54, "Sall3 · Npy · Nxph1", "late"]],
    ["m6", [24, "Neurod6 · Neurod2 · Zeb2", "late"]],
  ]);
  check(profiles.length === expected.size, "Research Explorer Dmrt3/dI6 profile denominator is invalid");
  let total = 0;
  for (const record of profiles) {
    const suffix = record.focusId.split(":").at(-1);
    const expectedProfile = expected.get(suffix);
    check(expectedProfile, `Research Explorer ${record.key} has an unexpected Dmrt3/dI6 identity`);
    const [expectedCount, expectedMarkers, temporalPhase] = expectedProfile;
    check(record.recordSemantics.parentSourceId === "SRC-IGLESIAS-GONZALEZ-2021", `Research Explorer ${record.key} canonical parent is invalid`);
    check(record.recordSemantics.cellRosterAvailability === "group_summary_only_no_per_well_M1_to_M6_roster", `Research Explorer ${record.key} incorrectly exposes a per-well roster`);
    const count = evidenceByLabel(record, "Exact sampled-cell count");
    const markers = evidenceByLabel(record, "Source markers");
    const temporal = evidenceByLabel(record, "Temporal context");
    check(count?.value === `${expectedCount} retained cells`, `Research Explorer ${record.key} sampled-cell count is invalid`);
    check(markers?.value === expectedMarkers, `Research Explorer ${record.key} marker summary is invalid`);
    check(temporal?.value.startsWith(`${temporalPhase};`), `Research Explorer ${record.key} temporal context is invalid`);
    total += expectedCount;
    for (const axis of ["Per-well M1–M6 roster", "Scalar pseudotime", "Single-cell morphology", "Cell coordinates", "Atlas registration", "Electrophysiology", "Projection target", "Synaptic connectivity", "Internal structure", "Cross-source same-cell identity"]) {
      check(record.gaps.some((item) => item.label === axis), `Research Explorer ${record.key} omits unsupported axis ${axis}`);
    }
    check(record.coordinate.geometryStatus === "TYPE_LEVEL" && record.coordinate.registrationCount === 0, `Research Explorer ${record.key} creates geometry or registration`);
    check(record.provenance.accessions.includes("GSE185731") && record.provenance.objectHashes.some((item) => item.sha256 === "f31abb7678ed88af3e140ca488dfdce867809569784bc1881777462fdc87b23c"), `Research Explorer ${record.key} GEO receipt is invalid`);
    check(/three embryos form one pooled experimental library/.test(record.boundary), `Research Explorer ${record.key} pooled-library boundary is invalid`);
  }
  check(total === 274, "Research Explorer Dmrt3/dI6 retained-cell denominator is invalid");
}

function validateHaringRecords(records) {
  const haringRecords = records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "haring-2018:GSE103840");
  check(haringRecords.length === 30, "Research Explorer Häring molecular-profile denominator is invalid");

  const expectedIds = new Set([
    ...Array.from({ length: 15 }, (_, index) => `haring-2018:GSE103840:Glut${index + 1}`),
    ...Array.from({ length: 15 }, (_, index) => `haring-2018:GSE103840:Gaba${index + 1}`),
  ]);
  let sampledCellCount = 0;
  for (const record of haringRecords) {
    check(expectedIds.delete(record.focusId), `Research Explorer ${record.key} has an unexpected or duplicated Häring identity`);
    const standardizedLabel = evidenceByLabel(record, "Standardized source label");
    const rawLabel = evidenceByLabel(record, "Deposited raw cluster label");
    const table4Label = evidenceByLabel(record, "Table 4 source-local label");
    const exactCount = evidenceByLabel(record, "Exact sampled-cell count");
    const table5 = evidenceByLabel(record, "Table 5 identification rule");
    const table8 = evidenceByLabel(record, "Table 8 marker summary");
    const ages = evidenceByLabel(record, "Matrix age cell-column summary");
    const sexCodes = evidenceByLabel(record, "Deposited sex-code cell-column summary");
    const strainSelection = evidenceByLabel(record, "Matrix strain-selection cell-column summary");
    const sampleFrame = evidenceByLabel(record, "Source sample frame");
    const matrixAssignments = evidenceByLabel(record, "Matrix label assignments");
    const spatial = evidenceByLabel(record, "Spatial source context");

    check(standardizedLabel?.value === record.title && /row 6/.test(standardizedLabel.locator), `Research Explorer ${record.key} standardized-label evidence is invalid`);
    check(typeof rawLabel?.value === "string" && rawLabel.value.length > 0 && /row 5/.test(rawLabel.locator), `Research Explorer ${record.key} raw-label evidence is invalid`);
    check(table4Label?.value === record.title && /![A-Z]{1,2}1/.test(table4Label.locator), `Research Explorer ${record.key} Table 4 source-label evidence is invalid`);
    check(/^\d+ cells$/.test(exactCount?.value ?? "") && /![A-Z]{1,2}2/.test(exactCount.locator), `Research Explorer ${record.key} exact sampled-cell evidence is invalid`);
    sampledCellCount += Number.parseInt(exactCount.value, 10);
    check(/->/.test(table5?.value ?? "") && /MOESM7/.test(table5?.locator ?? "") && /![BCD]\d+/.test(table5?.locator ?? ""), `Research Explorer ${record.key} Table 5 rule evidence is invalid`);
    check(/source label .*; main /.test(table8?.value ?? "") && /MOESM10/.test(table8?.locator ?? "") && /![CDEF]\d+/.test(table8?.locator ?? ""), `Research Explorer ${record.key} Table 8 marker evidence is invalid`);
    check(/denominator cell columns/.test(ages?.value ?? "") && /row 2/.test(ages?.locator ?? ""), `Research Explorer ${record.key} age cell-column evidence is invalid`);
    check(/denominator cell columns; not independent-animal prevalence/.test(sexCodes?.value ?? "") && /sex\(female=1\)/.test(sexCodes?.value ?? "") && /row 3/.test(sexCodes?.locator ?? ""), `Research Explorer ${record.key} deposited sex-code evidence is invalid`);
    check(/denominator cell columns; not independent-animal prevalence/.test(strainSelection?.value ?? "") && /row 7/.test(strainSelection?.locator ?? ""), `Research Explorer ${record.key} strain-selection evidence is invalid`);
    check(/^28 source animals/.test(sampleFrame?.value ?? "") && /1545 sampled cells/.test(sampleFrame?.value ?? "") && ["3 animals:", "5 animals:", "20 animals:"].every((term) => sampleFrame.value.includes(term)), `Research Explorer ${record.key} source sample-frame evidence is invalid`);
    check(/1545 cell columns/.test(matrixAssignments?.value ?? "") && /not animal prevalence/.test(matrixAssignments?.value ?? ""), `Research Explorer ${record.key} matrix-assignment denominator boundary is invalid`);
    check(/^2 animals; 6 cervical spinal cord sections/.test(spatial?.value ?? "") && /population-level/.test(spatial?.value ?? ""), `Research Explorer ${record.key} spatial-context evidence is invalid`);

    for (const unsupportedAxis of [
      "Cell coordinates",
      "Morphology",
      "Axon trajectory",
      "Electrophysiology",
      "Projection targets",
      "Synaptic connectivity",
      "SCI context",
      "Same cell cross modal links",
      "Atlas transform",
    ]) {
      check(record.gaps.some((item) => item.label === unsupportedAxis), `Research Explorer ${record.key} omits unsupported axis ${unsupportedAxis}`);
    }
    check(record.gaps.some((item) => item.label === "Cross-source same-cell or same-type identity" && item.status === "not_established"), `Research Explorer ${record.key} cross-source identity boundary is invalid`);
    check(record.provenance.accessions.includes("GSE103840") && record.provenance.accessions.includes("SRP117627") && record.provenance.accessions.includes("PRJNA407224"), `Research Explorer ${record.key} source accessions are invalid`);
    check(record.provenance.locators.some((locator) => /MOESM6 .*![A-Z]{1,2}[12]/.test(locator)), `Research Explorer ${record.key} exact field locators are missing`);
    check(record.provenance.objectHashes.length === 5, `Research Explorer ${record.key} source-object receipts are invalid`);
    check(record.coordinate.registrationCount === 0 && record.coordinate.registrationStatus === "unregistered", `Research Explorer ${record.key} creates a registration`);
    check(/not 1,545 animals or independent biological replicates/.test(record.boundary) && /cell-column metadata/.test(record.boundary) && /do not establish cross-source identity/.test(record.boundary), `Research Explorer ${record.key} denominator or identity boundary is invalid`);
  }
  check(expectedIds.size === 0, "Research Explorer Häring profile identities are incomplete");
  check(sampledCellCount === 1545, "Research Explorer Häring sampled-cell denominator is invalid");
}

function validateAlkaslasiRecords(records) {
  const profiles = records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "alkaslasi-2021:GSE167597");
  check(profiles.length === 8, "Research Explorer Alkaslasi I1-I8 denominator is invalid");
  const expectedIds = new Set(Array.from({ length: 8 }, (_, index) => `alkaslasi-2021:GSE167597:I${index + 1}`));
  let sampledNucleusCount = 0;
  for (const record of profiles) {
    check(expectedIds.delete(record.focusId), `Research Explorer ${record.key} has an unexpected or duplicated Alkaslasi identity`);
    const count = evidenceByLabel(record, "Exact sampled-nucleus count");
    const regions = evidenceByLabel(record, "Deposited sample-region membership");
    const sexField = evidenceByLabel(record, "Deposited sex-field membership");
    const enrichment = evidenceByLabel(record, "Sampling design boundary");
    const figureLabels = evidenceByLabel(record, "Figure 5a prominent labels");
    const experimentalFlow = evidenceByLabel(record, "Experimental-unit flow");
    const publicationIdentity = evidenceByLabel(record, "Publication identity discrepancy");
    check(/^\d+ nuclei$/.test(count?.value ?? ""), `Research Explorer ${record.key} exact nucleus count is invalid`);
    sampledNucleusCount += Number.parseInt(count.value, 10);
    check(/Cervical.*Thoracic.*Lumbar/.test(regions?.value ?? "") && /sample membership.*not xyz/i.test(regions?.value ?? ""), `Research Explorer ${record.key} sample-region boundary is invalid`);
    check(/M.*F.*NA/.test(sexField?.value ?? "") && /NA.*not.*mixed/i.test(sexField?.value ?? ""), `Research Explorer ${record.key} deposited sex boundary is invalid`);
    check(/Chat-Cre.*Sun1.*FACS/i.test(enrichment?.value ?? "") && /not.*prevalence/i.test(enrichment?.value ?? ""), `Research Explorer ${record.key} enrichment boundary is invalid`);
    check(figureLabels?.authority === "article_figure_display_context_not_unique_markers", `Research Explorer ${record.key} Figure 5a marker context is invalid`);
    check(/matching regions first pooled from 2 mice.*4 mice per processing replicate/i.test(experimentalFlow?.value ?? ""), `Research Explorer ${record.key} experimental-unit flow is imprecise`);
    check(/33931636.*37559423/.test(publicationIdentity?.value ?? ""), `Research Explorer ${record.key} publication-identity discrepancy is missing`);
    for (const unsupportedAxis of ["Cell coordinates", "Morphology", "Electrophysiology", "Projection target", "Synaptic connectivity", "SCI context", "Atlas registration", "Internal structure"]) {
      check(record.gaps.some((item) => item.label === unsupportedAxis), `Research Explorer ${record.key} omits unsupported axis ${unsupportedAxis}`);
    }
    check(record.coordinate.geometryStatus === "TYPE_LEVEL" && record.coordinate.registrationCount === 0, `Research Explorer ${record.key} creates geometry or registration`);
    check(record.provenance.accessions.includes("GSE167597") && record.provenance.accessions.includes("PMID:33931636") && record.provenance.objectHashes.some((item) => item.sha256 === "6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091"), `Research Explorer ${record.key} source-object receipt is invalid`);
  }
  check(expectedIds.size === 0, "Research Explorer Alkaslasi profile identities are incomplete");
  check(sampledNucleusCount === 5375, "Research Explorer Alkaslasi sampled-nucleus denominator is invalid");
}

function canoContextFieldText(context) {
  const retained = context.counts.map((item) => `${JSON.stringify(item.value)}=${item.count}`).join(" · ");
  return `${context.field}: ${context.status}; values ${retained || "none"}; missing ${context.missingCount}; empty ${context.emptyCount}`;
}

function validateCanoGomezP56Records(records) {
  const profiles = records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "cano-gomez-2026:GSE318731");
  const expectedById = new Map(CANO_GOMEZ_REGISTRY.profiles.map((profile) => [profile.profileId, profile]));
  const confirmedArtifact = CANO_GOMEZ_REGISTRY.artifacts.find((artifact) => artifact.artifactKind === "confirmed_interneuron_nucleus_roster");
  let sampledNucleusCount = 0;
  check(profiles.length === CANO_GOMEZ_REGISTRY.denominatorReconciliation.confirmedInterneuronProfileCount && profiles.length === 11, "Research Explorer Cano-Gomez confirmed-profile denominator is invalid");
  check(confirmedArtifact?.rowCount === CANO_GOMEZ_REGISTRY.denominatorReconciliation.confirmedInterneuronNucleusCount, "Research Explorer Cano-Gomez bundled-roster denominator is invalid");

  for (const record of profiles) {
    const profile = expectedById.get(record.focusId);
    check(profile, `Research Explorer ${record.key} has an unexpected or duplicated Cano-Gomez identity`);
    expectedById.delete(record.focusId);
    const expectedContext = profile.contextFieldCounts.map(canoContextFieldText).join(" | ");
    const labels = record.evidence.map((item) => item.label);
    check(new Set(labels).size === labels.length, `Research Explorer ${record.key} duplicates evidence rows`);
    check(record.title === profile.sourceLocalLabel
      && record.recordSemantics.parentSourceId === "SRC-CANOGOMEZ-2026"
      && record.recordSemantics.recordKind === "source_local_exact_nucleus_roster_profile"
      && record.recordSemantics.unitOfObservation === "nucleus"
      && record.recordSemantics.assignmentAuthority === "source_explicit_groups_equals_CHOL_IN"
      && record.recordSemantics.cellRosterAvailability === "exact_bundled_profile_and_nucleus_roster"
      && record.recordSemantics.canonicalIdentityStatus === "not_established", `Research Explorer ${record.key} Cano-Gomez identity or granularity is invalid`);
    check(evidenceByLabel(record, "Source-local label")?.value === profile.sourceLocalLabel
      && evidenceByLabel(record, "Source group")?.value === "CHOL_IN", `Research Explorer ${record.key} does not preserve the exact Cano-Gomez source labels`);
    check(evidenceByLabel(record, "Exact sampled-nucleus count")?.value === `${profile.nucleusCount} source-assigned nuclei`, `Research Explorer ${record.key} Cano-Gomez nucleus count is invalid`);
    check(evidenceByLabel(record, "Source markers")?.value === "Not established; the exact source label is not tokenized, normalized or interpreted as marker evidence."
      && evidenceByLabel(record, "Source markers")?.authority === "registry_marker_boundary", `Research Explorer ${record.key} invents marker evidence from the Cano-Gomez label`);
    check(evidenceByLabel(record, "Source context counts")?.value === expectedContext, `Research Explorer ${record.key} Cano-Gomez context counts are invalid`);
    check(evidenceByLabel(record, "Identity authority")?.value === `${CANO_GOMEZ_REGISTRY.identityAuthority.mode}; cross-assay cell identity verified ${CANO_GOMEZ_REGISTRY.identityAuthority.crossAssayCellIdentityVerified}; same-cell assertion admitted ${CANO_GOMEZ_REGISTRY.identityAuthority.sameCellAssertionAdmitted}`, `Research Explorer ${record.key} Cano-Gomez identity authority drifted`);
    check(evidenceByLabel(record, "Stable nucleus-key receipt")?.value.includes(profile.orderedCompoundNucleusKeysSha256), `Research Explorer ${record.key} Cano-Gomez ordered-key receipt is missing`);
    check(evidenceByLabel(record, "Profile roster receipt")?.value.includes(confirmedArtifact.compressedSha256)
      && evidenceByLabel(record, "Profile roster receipt")?.locator.includes(`confirmed_interneuron_profile_id=${profile.profileId}`), `Research Explorer ${record.key} Cano-Gomez roster locator is invalid`);
    check(evidenceByLabel(record, "Dataset denominator reconciliation")?.value.includes(`${CANO_GOMEZ_REGISTRY.denominatorReconciliation.paperReportedNeuronTypeCount} neuronal types not used as an interneuron denominator`), `Research Explorer ${record.key} promotes the reported neuronal-type denominator`);
    check(evidenceByLabel(record, "3D and internal model state")?.value === "0 admitted type-specific geometry · 0 admitted internal structures · 0 same-cell links · 0 registrations", `Research Explorer ${record.key} Cano-Gomez zero-model receipt is invalid`);
    for (const [axisId, reasonCode] of [
      ["single_cell_morphology", "source_schema_no_field"],
      ["whole_cell_geometry", "source_schema_no_field"],
      ["cell_coordinates", "source_schema_no_field"],
      ["atlas_registration", "no_admitted_transform"],
      ["internal_structure", "source_schema_no_field"],
      ["cross_source_same_cell_identity", "relationship_not_established"],
    ]) {
      check(record.gaps.filter((gap) => gap.axisId === axisId && gap.reasonCode === reasonCode && gap.inferenceAllowed === false).length === 1, `Research Explorer ${record.key} Cano-Gomez ${axisId} boundary is invalid`);
    }
    check(record.coordinate.geometryStatus === "TYPE_LEVEL"
      && record.coordinate.frame === "cano_gomez_p56_chol_in_source_local_roster_without_geometry"
      && record.coordinate.registrationStatus === "unregistered"
      && record.coordinate.registrationCount === 0
      && record.coordinate.measurementUse === "forbidden", `Research Explorer ${record.key} creates Cano-Gomez geometry or registration`);
    check(record.presentation.modeling.admittedCellGeometryObjectCount === 0
      && record.presentation.modeling.admittedInternalObjectCount === 0
      && record.presentation.modeling.generatedFallbackPrimitiveCount === 0
      && record.presentation.modeling.sameCellJoinCount === 0, `Research Explorer ${record.key} creates a Cano-Gomez fallback model or join`);
    check(record.provenance.accessions.includes("GSE318731")
      && record.provenance.objectHashes.some((item) => item.sha256 === confirmedArtifact.compressedSha256)
      && record.provenance.objectHashes.some((item) => item.sha256 === CANO_GOMEZ_REGISTRY.sourceObjects.find((source) => source.objectId === "cholinergic")?.sourceRdsSha256), `Research Explorer ${record.key} Cano-Gomez provenance receipts are invalid`);
    check(record.searchTerms.includes(profile.sourceLocalLabel.trim())
      && /groups=CHOL_IN/.test(record.boundary)
      && /without token-to-marker inference/.test(record.boundary)
      && /creates no canonical cross-study identity, geometry, internal structure, same-cell link/.test(record.boundary), `Research Explorer ${record.key} Cano-Gomez label or model boundary is invalid`);
    sampledNucleusCount += profile.nucleusCount;
  }

  check(expectedById.size === 0, "Research Explorer Cano-Gomez profile identities are incomplete");
  check(sampledNucleusCount === CANO_GOMEZ_REGISTRY.denominatorReconciliation.confirmedInterneuronNucleusCount && sampledNucleusCount === 923, "Research Explorer Cano-Gomez confirmed-nucleus denominator is invalid");
  check(profiles.some((record) => record.title === "CHOL_IN_Pitx2_ Srpx2"), "Research Explorer Cano-Gomez raw whitespace anomaly was not preserved");
}

function validateCrozatPkd2l1Record(records) {
  const profiles = records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "crozat-2025:figshare-29430869-v2");
  check(profiles.length === 1, "Research Explorer Crozat PKD2L1 profile denominator is invalid");
  const [record] = profiles;
  check(record.focusId === "crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn", "Research Explorer Crozat PKD2L1 identity is invalid");
  check(record.recordSemantics.parentSourceId === "SRC-CROZAT-2025" && record.recordSemantics.recordKind === "marker_defined_functional_profile", "Research Explorer Crozat PKD2L1 granularity is invalid");
  check(/cervical: N=10 animals, n=21 cells \(14 tonic; 7 single spike\).*thoracic: N=12 animals, n=23 cells.*lumbar: N=9 animals, n=21 cells/i.test(evidenceByLabel(record, "Electrophysiology evidence")?.value ?? ""), "Research Explorer Crozat firing evidence is invalid");
  check(/N=191 animals, n=659 cells; deposited 654 complete rows/.test(evidenceByLabel(record, "Passive-property denominator")?.value ?? ""), "Research Explorer Crozat passive-property conflict is missing");
  check(/thoracic: 51 FOV \/ 1,167 cells/.test(evidenceByLabel(record, "Anatomy FOV and cell totals")?.value ?? ""), "Research Explorer Crozat anatomy denominator is invalid");
  check(/478 versus FOV-table cell total n=457/.test(evidenceByLabel(record, "Anatomy denominator conflict")?.value ?? ""), "Research Explorer Crozat anatomy conflict is missing");
  check(/firing-inference-p-value.*firing-location-coverage.*passive-property-denominator.*thoracic-6-week-distance-denominator/.test(evidenceByLabel(record, "Quarantined source conflicts")?.value ?? ""), "Research Explorer Crozat quarantine evidence is incomplete");
  for (const unsupportedAxis of ["Single-cell morphology", "Cell coordinates", "Raw electrophysiology traces", "SCI context", "Atlas registration", "Projection target", "Circuit partners", "Internal structure", "Cross-source same-cell identity"]) {
    check(record.gaps.some((item) => item.label === unsupportedAxis), `Research Explorer Crozat profile omits unsupported axis ${unsupportedAxis}`);
  }
  check(record.coordinate.geometryStatus === "TYPE_LEVEL" && record.coordinate.registrationCount === 0, "Research Explorer Crozat profile creates geometry or registration");
  check(record.provenance.objectHashes.length === 7 && record.provenance.objectHashes.every((item) => /^[a-f0-9]{64}$/.test(item.sha256)), "Research Explorer Crozat file receipts are invalid");
  check(/not new cell types/i.test(record.summary) && /No geometry.*separate PKD2L1 SBF-SEM/i.test(record.boundary), "Research Explorer Crozat type or join boundary is invalid");
}

function validateMorphologyFidelityRecords(records) {
  const morphologyRecords = records.filter((record) => record.focusKind === "morphology_record");
  check(morphologyRecords.length === 149, "Research Explorer morphology-record denominator is invalid");
  let diameterAvailableCount = 0;
  let censusCount = 0;
  let supplementaryCount = 0;
  for (const record of morphologyRecords) {
    const observedMode = evidenceByLabel(record, "Observed SWC mode");
    const diameterAuthority = evidenceByLabel(record, "Diameter authority");
    const radiusSurface = evidenceByLabel(record, "Radius-derived surface");
    const internalStructure = evidenceByLabel(record, "Same-specimen internal structure");
    const geometryReceipt = evidenceByLabel(record, "Geometry receipt");
    const membershipReceipt = evidenceByLabel(record, "Explorer collection membership");
    const membership = record.morphologyMembership;
    if (membership.collection === "census") censusCount += 1;
    if (membership.collection === "supplementary") supplementaryCount += 1;
    check(observedMode?.authority === "OBS_STANDARDIZED_SOURCE_LOCAL" && /checksum-pinned source-local/.test(observedMode.value), `Research Explorer ${record.key} observed-SWC authority is invalid`);
    check(record.coordinate.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL", `Research Explorer ${record.key} geometry authority is invalid`);
    check(geometryReceipt?.authority === "checksum_pinned_source_object" && geometryReceipt.locator === membership.geometryPath && geometryReceipt.value.includes(membership.geometrySha256), `Research Explorer ${record.key} geometry receipt is invalid`);
    check(membershipReceipt?.authority === "checksum_pinned_project_membership", `Research Explorer ${record.key} collection membership receipt is invalid`);
    check(internalStructure?.authority === "UNAVAILABLE" && /membrane segmentation.*nucleus.*organelles.*boutons.*receptor.*ultrastructure/.test(internalStructure.value), `Research Explorer ${record.key} internal-structure evidence boundary is invalid`);
    check(record.gaps.some((item) => item.label === "Observed membrane" && item.status === "not_measured"), `Research Explorer ${record.key} omits the observed-membrane gap`);
    check(record.gaps.some((item) => item.label === "Same-specimen internal structure" && item.status === "unavailable"), `Research Explorer ${record.key} omits the internal-structure gap`);
    if (/Official attributes report Diameter/.test(diameterAuthority?.value ?? "")) {
      diameterAvailableCount += 1;
      check(radiusSurface?.authority === "DERIVED_FROM_OBSERVED_RADIUS" && /not observed membrane/.test(radiusSurface.value), `Research Explorer ${record.key} radius-derived authority is invalid`);
      check(!record.gaps.some((item) => item.label === "Radius-derived surface"), `Research Explorer ${record.key} incorrectly marks an authorized radius surface unavailable`);
    } else {
      check(diameterAuthority?.value === "Official attributes report No Diameter", `Research Explorer ${record.key} no-diameter authority is invalid`);
      check(radiusSurface?.authority === "UNAVAILABLE" && /placeholder radii are ignored/.test(radiusSurface.value), `Research Explorer ${record.key} no-diameter surface boundary is invalid`);
      check(record.gaps.some((item) => item.label === "Radius-derived surface" && item.status === "unavailable"), `Research Explorer ${record.key} omits the no-diameter surface gap`);
    }
    if (membership.collection === "supplementary") {
      const routeReceipt = evidenceByLabel(record, "Supplementary route receipt");
      check(routeReceipt?.value.includes(membership.routeId) && routeReceipt.value.includes(membership.routeContractSha256) && routeReceipt.value.includes(membership.routeAssetManifestSha256), `Research Explorer ${record.key} supplementary route receipt is invalid`);
      check(record.provenance.locators.includes(membership.sourceFrameLocator) && record.provenance.locators.includes(membership.analysisLocator), `Research Explorer ${record.key} supplementary source-frame or analysis locator is missing`);
      check(record.provenance.objectHashes.some((item) => item.sha256 === membership.routeContractSha256) && record.provenance.objectHashes.some((item) => item.sha256 === membership.routeAssetManifestSha256), `Research Explorer ${record.key} supplementary route hashes are missing`);
    }
  }
  check(censusCount === 142 && supplementaryCount === 7, "Research Explorer census/supplementary morphology membership is invalid");
  check(diameterAvailableCount === 99, "Research Explorer source-diameter denominator is invalid");
}

export function validateResearchExplorerDocumentSemantics(index, manifest = null) {
  validateBrowserIndex(index, manifest);

  const actualNamespaceCounts = {};
  for (const record of index.records) {
    actualNamespaceCounts[record.namespace] = (actualNamespaceCounts[record.namespace] ?? 0) + 1;
    check(record.evidence.length > 0, `Research Explorer ${record.key} has no evidence fields`);
    check(record.gaps.length > 0, `Research Explorer ${record.key} has no explicit gaps`);
    check(typeof record.provenance.label === "string" && record.provenance.label.length > 0, `Research Explorer ${record.key} has no provenance label`);
    for (const field of ["urls", "accessions", "locators", "objectHashes"]) {
      check(Array.isArray(record.provenance[field]), `Research Explorer ${record.key} provenance ${field} is invalid`);
    }
    check(record.provenance.locators.length > 0, `Research Explorer ${record.key} has no source locator`);
    check(record.coordinate.registrationCount === 0, `Research Explorer ${record.key} creates an undeclared registration`);
    check(record.relationshipStatus === "not_established_outside_this_source_record", `Research Explorer ${record.key} promotes an undeclared relationship`);
    for (const forbiddenField of ["relatedFocusIds", "sameCellIds", "crossSourceIdentity"]) {
      check(!(forbiddenField in record), `Research Explorer ${record.key} contains forbidden cross-lane field ${forbiddenField}`);
    }
    validateNavigation(record);
  }

  validateNamespaceCounts(actualNamespaceCounts, "Research Explorer source-namespace denominators");
  validateNamespaceCounts(index.counts.byNamespace, "Research Explorer declared source-namespace denominators");
  validateMolecularKnowledgeReconciliation(index.records);
  validateHaringRecords(index.records);
  validateAlkaslasiRecords(index.records);
  validateCanoGomezP56Records(index.records);
  validateDmrt3Di6Records(index.records);
  validateRoomeDilRecords(index.records);
  validateDelileDevelopmentalRecords(index.records);
  validateCrozatPkd2l1Record(index.records);
  validateMorphologyFidelityRecords(index.records);
  return index;
}

export async function validateResearchExplorerIndex() {
  const [manifestBytes, indexBytes] = await Promise.all([
    readFile(path.join(ASSET_DIRECTORY, "asset-manifest.json")),
    readFile(path.join(ASSET_DIRECTORY, "search-index.json")),
  ]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const index = JSON.parse(indexBytes.toString("utf8"));
  const sourceFilesByPath = new Map(await Promise.all(manifest.sourceFiles.map(async (source) => [
    source.path,
    await readFile(resolveProjectFile(source.path)),
  ])));

  validateResearchExplorerManifestIntegrity(manifest, indexBytes, sourceFilesByPath);
  validateResearchExplorerDocumentSemantics(index, manifest);

  return {
    recordCount: index.records.length,
    byFocusKind: index.counts.byFocusKind,
    byNamespace: index.counts.byNamespace,
    registrationCount: index.scientificPolicy.registrationCount,
    indexSha256: sha256(indexBytes),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchExplorerIndex()
    .then((report) => {
      console.log(`Research Explorer index validation passed: ${report.recordCount} records; ${report.registrationCount} registrations; SHA-256 ${report.indexSha256}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
