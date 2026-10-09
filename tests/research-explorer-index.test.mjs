import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  RESEARCH_MISSINGNESS_REASON_CODES,
  findResearchRecord,
  groupResearchResults,
  includeSelectedResearchGroup,
  loadVerifiedResearchExplorerIndex,
  parseResearchFocus,
  searchResearchRecords,
  selectResearchEvidencePreviewRows,
  serializeResearchFocus,
  validateResearchExplorerIndex,
  validateResearchExplorerManifest,
} from "../app/research-explorer-index.js";
import {
  validateResearchExplorerDocumentSemantics,
  validateResearchExplorerIndex as validateResearchExplorerAssets,
  validateResearchExplorerManifestIntegrity,
} from "../scripts/validate-research-explorer-index.mjs";

const [manifestBytes, indexBytes, canoGomezRegistryBytes] = await Promise.all([
  readFile(new URL("../public/data/research_explorer_index_v1/asset-manifest.json", import.meta.url)),
  readFile(new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url)),
  readFile(new URL("../public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json", import.meta.url)),
]);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const index = JSON.parse(indexBytes.toString("utf8"));
const canoGomezRegistry = JSON.parse(canoGomezRegistryBytes.toString("utf8"));

test("validates the pinned Research Explorer asset set and source inventory", async () => {
  const report = await validateResearchExplorerAssets();
  assert.equal(report.recordCount, 641);
  assert.deepEqual(report.byFocusKind, {
    anatomy_label: 73,
    molecular_profile: 387,
    morphology_record: 149,
    sci_entity: 7,
    sci_population: 17,
    source_lane: 8,
  });
  assert.equal(report.registrationCount, 0);
  assert.equal(report.indexSha256, manifest.index.sha256);
  assert.equal(manifest.schemaVersion, "1.14.0");
  assert.equal(manifest.assetSetId, "ohri:research-explorer-index:1.14.0");
  assert.equal(manifest.sourceFiles.length, 22);
  assert.ok(manifest.sourceFiles.some((source) => source.name === "russInformation" && source.path === "data/russ-spinal-information-adapter-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "haringDorsalHorn" && source.path === "data/haring-dorsal-horn-source-taxonomy-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "alkaslasi" && source.path === "data/alkaslasi-cholinergic-source-taxonomy-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "crozatPkd2l1" && source.path === "data/crozat-pkd2l1-functional-profile-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "dmrt3Di6" && source.path === "data/dmrt3-di6-source-taxonomy-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "roomeDil" && source.path === "data/roome-dil-source-taxonomy-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "delileDevelopmental" && source.path === "data/delile-developmental-interneuron-taxonomy-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "canoGomezP56" && source.path === "public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "morphologySupplementary" && source.path === "data/supplementary-morphology-comparison-adapter-0.1.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "morphologySupplementaryAnalysis" && source.path === "public/data/supplementary_morphology_comparison_v1/analysis-delta.json"));
  assert.ok(manifest.sourceFiles.some((source) => source.name === "morphologySourceFrame" && source.path === "data/morphology-source-frame-disclosure-0.1.json"));
});

test("memoizes the verified browser index so record switching does not refetch or rehash it", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  globalThis.fetch = async (url) => {
    requestCount += 1;
    if (String(url).endsWith("asset-manifest.json")) {
      return { ok: true, json: async () => structuredClone(manifest) };
    }
    if (String(url).endsWith("search-index.json")) {
      const bytes = indexBytes.buffer.slice(indexBytes.byteOffset, indexBytes.byteOffset + indexBytes.byteLength);
      return { ok: true, arrayBuffer: async () => bytes };
    }
    throw new Error(`Unexpected Research Explorer request: ${url}`);
  };
  try {
    const first = await loadVerifiedResearchExplorerIndex();
    const second = await loadVerifiedResearchExplorerIndex();
    assert.equal(first, second);
    assert.equal(first.records.length, 641);
    assert.equal(requestCount, 2, "manifest and index should each be fetched once for the browser session");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("browser-facing validators preserve denominators and scientific lanes", () => {
  assert.equal(validateResearchExplorerManifest(manifest), manifest);
  assert.equal(validateResearchExplorerIndex(index, manifest), index);
  assert.equal(validateResearchExplorerDocumentSemantics(index, manifest), index);
  assert.equal(new Set(index.records.map((record) => record.key)).size, 641);
  assert.ok(index.records.every((record) => record.relationshipStatus === "not_established_outside_this_source_record"));
});

test("all dossier gaps use standardized structured missingness and unknown reason codes fail closed", () => {
  const admittedReasonCodes = new Set(RESEARCH_MISSINGNESS_REASON_CODES);
  for (const required of ["source_not_reported", "source_schema_no_field", "repository_object_unavailable", "not_measured_by_study", "not_ingested", "relationship_not_established", "no_admitted_transform", "qc_quarantined", "rights_not_cleared", "unresolved_source_conflict", "not_applicable"]) {
    assert.ok(admittedReasonCodes.has(required));
  }
  const gaps = index.records.flatMap((record) => record.gaps);
  assert.ok(gaps.length > 0);
  for (const gap of gaps) {
    assert.match(gap.axisId, /^[a-z0-9]+(?:_[a-z0-9]+)*$/);
    assert.ok(admittedReasonCodes.has(gap.reasonCode));
    assert.ok(["record_specific", "shared_dataset_limit", "shared_project_limit"].includes(gap.scope));
    assert.equal(typeof gap.authority, "string");
    assert.equal(typeof gap.sourceLocator, "string");
    assert.ok(gap.sourceLocator.length > 0);
    assert.ok(typeof gap.rawValue === "string" || gap.rawValue === null);
    assert.equal(typeof gap.detail, "string");
    assert.equal(gap.inferenceAllowed, false);
    assert.equal("reason" in gap, false);
  }
  assert.ok(gaps.some((gap) => gap.scope === "record_specific"));
  assert.ok(gaps.some((gap) => gap.scope === "shared_dataset_limit"));
  assert.ok(gaps.some((gap) => gap.scope === "shared_project_limit"));

  const unknown = structuredClone(index);
  unknown.records[0].gaps[0].reasonCode = "unknown_missingness_code";
  assert.throws(() => validateResearchExplorerIndex(unknown, manifest), /structured missingness/i);
});

test("all 387 source-profile records across ten source namespaces resolve record granularity and a canonical parent source", () => {
  const profiles = index.records.filter((record) => record.focusKind === "molecular_profile");
  assert.equal(profiles.length, 387);
  assert.ok(profiles.every((record) => /^SRC-[A-Z0-9-]+$/.test(record.recordSemantics.parentSourceId)));
  assert.ok(profiles.every((record) => record.recordSemantics.canonicalIdentityStatus === "not_established"));
  assert.deepEqual(new Set(profiles.map((record) => record.recordSemantics.parentSourceId)), new Set([
    "SRC-RUSS-2021",
    "SRC-SATHYAMURTHY-2018",
    "SRC-HAYASHI-2018",
    "SRC-HARING-2018",
    "SRC-ALKASLASI-2021",
    "SRC-IGLESIAS-GONZALEZ-2021",
    "SRC-ROOME-2026",
    "SRC-CROZAT-2025",
    "SRC-DELILE-2019",
    "SRC-CANOGOMEZ-2026",
  ]));
  assert.equal(profiles.filter((record) => record.recordSemantics.cellRosterAvailability === "cluster_to_barcode_map_unavailable").length, 11);
  assert.equal(profiles.filter((record) => record.recordSemantics.cellRosterAvailability === "exact_remote_roster_not_bundled").length, 81);
  assert.equal(profiles.filter((record) => record.recordSemantics.cellRosterAvailability === "no_roster_retained").length, 69);
  assert.equal(profiles.filter((record) => record.recordSemantics.cellRosterAvailability === "no_global_stable_cell_roster").length, 1);
  assert.equal(profiles.filter((record) => record.recordSemantics.cellRosterAvailability === "group_summary_only_no_per_well_M1_to_M6_roster").length, 6);
  assert.equal(profiles.filter((record) => record.recordSemantics.cellRosterAvailability === "type_aggregate_only_full_rds_link_only").length, 157);
  assert.equal(profiles.filter((record) => record.recordSemantics.cellRosterAvailability === "exact_link_only_source_roster_with_bundled_type_aggregates").length, 51);
  assert.equal(profiles.filter((record) => record.recordSemantics.cellRosterAvailability === "exact_bundled_profile_and_nucleus_roster").length, 11);
  assert.ok(profiles.every((record) => record.evidence.filter((row) => row.label === "Canonical transmitter").length === 1));
  assert.ok(profiles.every((record) => record.gaps.filter((gap) => gap.axisId === "internal_structure" && gap.label === "Internal structure" && gap.inferenceAllowed === false).length === 1));
  const hayashi = profiles.filter((record) => record.namespace === "hayashi-2018:GSE108788");
  assert.equal(hayashi.length, 11);
  assert.ok(hayashi.every((record) => record.evidence.find((row) => row.label === "Canonical transmitter")?.value === "Excitatory"));
});

test("Roome refined-dIL records preserve exact per-type metrics, distinct top-six receipts, and zero model geometry", () => {
  const records = index.records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "roome-2026:GSE291462");
  const evidence = (record, label) => record.evidence.find((item) => item.label === label);
  assert.equal(records.length, 157);
  assert.equal(records.reduce((total, record) => total + Number.parseInt(evidence(record, "Exact captured-cell count").value, 10), 0), 61_444);
  assert.equal(new Set(records.map((record) => evidence(record, "Positive differential features meeting display thresholds").value)).size, 157);
  assert.equal(records.reduce((total, record) => total + Number.parseInt(evidence(record, "Differential-feature display audit").value.match(/(\d+) quarantined$/)?.[1] ?? "0", 10), 0), 26);

  for (const record of records) {
    const genes = evidence(record, "Positive differential features meeting display thresholds").value.split(" · ");
    assert.equal(genes.length, 6);
    assert.equal(new Set(genes).size, 6);
    assert.ok(genes.every((gene) => !/^2025-03-\d{2}$/.test(gene)));
    assert.match(evidence(record, "Exact captured-cell count").locator, /^Table S6 · Sheet1!B\d+$/);
    assert.match(evidence(record, "Percent of captured dIL denominator").locator, /^Table S6 · Sheet1!C\d+$/);
    assert.match(evidence(record, "Mean genes per cell").locator, /^Table S6 · Sheet1!D\d+$/);
    assert.match(evidence(record, "Mean silhouette score").locator, /^Table S6 · Sheet1!E\d+$/);
    assert.match(evidence(record, "Mean LISI score").locator, /^Table S6 · Sheet1!F\d+$/);
    assert.equal(evidence(record, "3D and internal model state").value, "0 admitted type-specific geometry · 0 admitted internal structures");
    assert.equal(record.coordinate.geometryStatus, "TYPE_LEVEL");
    assert.equal(record.coordinate.registrationCount, 0);
    assert.equal(record.coordinate.measurementUse, "forbidden");
    assert.ok(record.gaps.some((gap) => gap.axisId === "whole_cell_geometry" && gap.reasonCode === "not_measured_by_study" && gap.inferenceAllowed === false));
    assert.ok(record.gaps.some((gap) => gap.axisId === "internal_structure" && gap.reasonCode === "not_measured_by_study" && gap.inferenceAllowed === false));
  }

  const a1 = findResearchRecord(records, "molecular_profile", "roome-2026:GSE291462:dILA1-A1");
  const e1 = findResearchRecord(records, "molecular_profile", "roome-2026:GSE291462:dILB6-E1");
  assert.equal(evidence(a1, "Exact captured-cell count").value, "179 captured refined dIL cells");
  assert.equal(evidence(a1, "Positive differential features meeting display thresholds").value, "Tfap2b · Islr2 · Lhx1 · Lhx1os · Npy · 2700069I18Rik");
  assert.equal(evidence(e1, "Exact captured-cell count").value, "756 captured refined dIL cells");
  assert.equal(evidence(e1, "Positive differential features meeting display thresholds").value, "Pou4f1 · Prox1 · Nfix · Uncx · Nfia · Lmx1b");
  assert.equal(searchResearchRecords(index.records, "GSE291462").length, 158);
});

test("Delile records switch exact subtype counts and developmental distributions without inventing geometry or transmitter identity", () => {
  const records = index.records.filter((record) => record.focusKind === "molecular_profile"
    && record.namespace === "delile-2019:E-MTAB-7320");
  const evidence = (record, label) => record.evidence.find((item) => item.label === label);
  assert.equal(records.length, 51);
  assert.equal(records.reduce((total, record) => total + Number.parseInt(evidence(record, "Exact sampled-cell count").value, 10), 0), 15_217);
  assert.equal(new Set(records.map((record) => evidence(record, "Fine-subtype timepoint cell counts").value)).size > 1, true);
  assert.ok(records.every((record) => evidence(record, "Canonical transmitter").value === "Not established from the pinned annotation object"));

  const dl11 = findResearchRecord(records, "molecular_profile", "delile-2019:E-MTAB-7320:dl1.1");
  const v34 = findResearchRecord(records, "molecular_profile", "delile-2019:E-MTAB-7320:V3.4");
  assert.equal(evidence(dl11, "Exact sampled-cell count").value, "30 source-annotated fine-subtype cells");
  assert.equal(evidence(dl11, "Fine-subtype timepoint cell counts").value, "E9.5: 0 · E10.5: 0 · E11.5: 18 · E12.5: 9 · E13.5: 3");
  assert.equal(evidence(v34, "Exact sampled-cell count").value, "78 source-annotated fine-subtype cells");
  assert.equal(evidence(v34, "Fine-subtype timepoint cell counts").value, "E9.5: 0 · E10.5: 2 · E11.5: 3 · E12.5: 27 · E13.5: 46");
  assert.notDeepEqual(selectResearchEvidencePreviewRows(dl11).map((row) => row.value), selectResearchEvidencePreviewRows(v34).map((row) => row.value));

  for (const record of records) {
    assert.equal(record.recordSemantics.parentSourceId, "SRC-DELILE-2019");
    assert.equal(record.recordSemantics.recordKind, "source_reported_developmental_fine_subtype");
    assert.equal(record.coordinate.geometryStatus, "TYPE_LEVEL");
    assert.equal(record.coordinate.registrationCount, 0);
    assert.equal(record.coordinate.measurementUse, "forbidden");
    assert.equal(record.presentation.modeling.admittedCellGeometryObjectCount, 0);
    assert.equal(record.presentation.modeling.admittedInternalObjectCount, 0);
    assert.equal(record.presentation.modeling.generatedFallbackPrimitiveCount, 0);
    assert.equal(record.presentation.modeling.sameCellJoinCount, 0);
    assert.ok(record.gaps.some((gap) => gap.axisId === "single_cell_morphology" && gap.reasonCode === "not_measured_by_study" && gap.inferenceAllowed === false));
    assert.ok(record.gaps.some((gap) => gap.axisId === "internal_structure" && gap.reasonCode === "source_schema_no_field" && gap.inferenceAllowed === false));
    assert.match(record.boundary, /Source spelling dl is retained verbatim/);
  }

  assert.equal(searchResearchRecords(index.records, "E-MTAB-7320").filter(({ record }) => record.namespace === records[0].namespace).length, 51);
});

test("Dmrt3/dI6 M1–M6 records change count and markers while retaining group-summary-only and zero-geometry boundaries", () => {
  const records = index.records.filter((record) => record.focusKind === "molecular_profile"
    && record.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus");
  const evidence = (record, label) => record.evidence.find((item) => item.label === label);
  const expected = [
    ["M1", "84 retained cells", "Zfhx3 · Meis2 · Zfhx4", "early"],
    ["M2", "34 retained cells", "Irx4 · Tshz3 · Ldb2", "middle"],
    ["M3", "33 retained cells", "Pid1 · Sst · Slit2", "middle"],
    ["M4", "45 retained cells", "Hoxb8 · Hoxb7 · Hoxb9", "late"],
    ["M5", "54 retained cells", "Sall3 · Npy · Nxph1", "late"],
    ["M6", "24 retained cells", "Neurod6 · Neurod2 · Zeb2", "late"],
  ];

  assert.equal(records.length, 6);
  assert.deepEqual(records.map((record) => [
    record.title,
    evidence(record, "Exact sampled-cell count")?.value,
    evidence(record, "Source markers")?.value,
    evidence(record, "Temporal context")?.value.split(";")[0],
  ]), expected);
  assert.equal(records.reduce((total, record) => total + Number.parseInt(evidence(record, "Exact sampled-cell count").value, 10), 0), 274);
  assert.equal(new Set(records.map((record) => evidence(record, "Source markers").value)).size, 6);

  for (const record of records) {
    assert.equal(record.recordSemantics.parentSourceId, "SRC-IGLESIAS-GONZALEZ-2021");
    assert.equal(record.recordSemantics.recordKind, "source_local_embryonic_transcriptomic_group");
    assert.equal(record.recordSemantics.cellRosterAvailability, "group_summary_only_no_per_well_M1_to_M6_roster");
    assert.equal(evidence(record, "Assignment / roster").value, "pinned executed-notebook group summary · per-well M1–M6 roster not exported");
    assert.match(evidence(record, "Experimental-unit flow").value, /^3 E14\.5 embryos -> 1 pool -> 1 library -> 384 deposited wells -> 354 QC cells -> 274 dI6-lineage cells$/);
    assert.equal(record.coordinate.geometryStatus, "TYPE_LEVEL");
    assert.equal(record.coordinate.registrationCount, 0);
    assert.equal(record.coordinate.measurementUse, "forbidden");
    assert.ok(record.gaps.some((gap) => gap.axisId === "per_well_m1_m6_roster" && gap.reasonCode === "source_schema_no_field" && gap.inferenceAllowed === false));
    assert.ok(record.gaps.some((gap) => gap.axisId === "single_cell_morphology" && gap.reasonCode === "not_measured_by_study" && gap.inferenceAllowed === false));
    assert.ok(record.gaps.some((gap) => gap.axisId === "internal_structure" && gap.reasonCode === "source_schema_no_field" && gap.inferenceAllowed === false));
    assert.match(record.boundary, /does not invent or reconstruct a per-well roster/i);
    assert.match(record.boundary, /cannot be joined to a well, adult type, morphology, physiology, coordinate, synapse or internal object/i);
  }

  assert.ok(searchResearchRecords(index.records, "GSE185731").filter(({ record }) => record.namespace === records[0].namespace).length === 6);
  assert.ok(searchResearchRecords(index.records, "Hoxb8").some(({ record }) => record.focusId.endsWith(":m4")));
});

test("PKD2L1 profile exposes segment-specific source evidence without inventing cell types, joins or geometry", () => {
  const profile = findResearchRecord(index.records, "molecular_profile", "crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn");
  const evidence = (label) => profile.evidence.find((item) => item.label === label);
  assert.ok(profile);
  assert.equal(profile.recordSemantics.recordKind, "marker_defined_functional_profile");
  assert.equal(evidence("Canonical transmitter").value, "Inhibitory / GABAergic");
  assert.match(evidence("Electrophysiology evidence").value, /cervical: N=10 animals, n=21 cells \(14 tonic; 7 single spike\).*thoracic: N=12 animals, n=23 cells.*lumbar: N=9 animals, n=21 cells/i);
  assert.match(evidence("Quarantined source conflicts").value, /Firing_pattern-Details\.xlsx/);
  assert.match(evidence("Passive-property denominator").value, /N=191 animals, n=659 cells; deposited 654 complete rows/);
  assert.match(evidence("Anatomy denominator conflict").value, /478 versus FOV-table cell total n=457/);
  assert.match(evidence("Quarantined source conflicts").value, /firing-inference-p-value.*firing-location-coverage.*passive-property-denominator.*thoracic-6-week-distance-denominator/);
  assert.equal(profile.coordinate.geometryStatus, "TYPE_LEVEL");
  assert.equal(profile.coordinate.registrationCount, 0);
  assert.ok(profile.gaps.some((item) => item.label === "Raw electrophysiology traces" && item.status === "unavailable"));
  assert.ok(profile.gaps.some((item) => item.label === "Internal structure" && item.status === "unavailable"));
  assert.match(profile.boundary, /No geometry.*separate PKD2L1 SBF-SEM/i);
  assert.equal(profile.provenance.objectHashes.length, 7);
  assert.ok(searchResearchRecords(index.records, "PKD2L1").some(({ record }) => record.focusId === profile.focusId));
});

test("morphology dossiers expose source-gated surface authority and unsupported internal detail", () => {
  const morphologyRecords = index.records.filter((record) => record.focusKind === "morphology_record");
  const evidence = (record, label) => record.evidence.find((item) => item.label === label);
  assert.equal(morphologyRecords.length, 149);
  assert.equal(morphologyRecords.filter((record) => record.morphologyMembership.collection === "census").length, 142);
  assert.equal(morphologyRecords.filter((record) => record.morphologyMembership.collection === "supplementary").length, 7);
  assert.equal(morphologyRecords.filter((record) => evidence(record, "Diameter authority").value.startsWith("Official attributes report Diameter")).length, 99);
  assert.ok(morphologyRecords.every((record) => evidence(record, "Observed SWC mode").authority === "OBS_STANDARDIZED_SOURCE_LOCAL"));
  assert.ok(morphologyRecords.every((record) => evidence(record, "Same-specimen internal structure").authority === "UNAVAILABLE"));

  const diameterRecord = findResearchRecord(morphologyRecords, "morphology_record", "NeuroMorpho:109005");
  assert.equal(evidence(diameterRecord, "Radius-derived surface").authority, "DERIVED_FROM_OBSERVED_RADIUS");
  assert.match(evidence(diameterRecord, "Diameter authority").value, /source radius range/);

  const noDiameterRecord = findResearchRecord(morphologyRecords, "morphology_record", "NeuroMorpho:242822");
  assert.equal(evidence(noDiameterRecord, "Diameter authority").value, "Official attributes report No Diameter");
  assert.equal(evidence(noDiameterRecord, "Radius-derived surface").authority, "UNAVAILABLE");
  assert.ok(noDiameterRecord.gaps.some((item) => item.label === "Radius-derived surface" && item.status === "unavailable"));
  assert.ok(noDiameterRecord.gaps.some((item) => item.label === "Same-specimen internal structure" && item.status === "unavailable"));

  const supplementary = findResearchRecord(morphologyRecords, "morphology_record", "NeuroMorpho:45674");
  assert.equal(supplementary.morphologyMembership.collection, "supplementary");
  assert.equal(supplementary.morphologyMembership.censusContribution, 0);
  assert.equal(supplementary.morphologyMembership.supplementaryContribution, 1);
  assert.equal(evidence(supplementary, "Geometry receipt").locator, supplementary.morphologyMembership.geometryPath);
  assert.match(evidence(supplementary, "Supplementary route receipt").value, /mouse\.sc\.renshaw.*400b17afd707.*a44d7b109357/i);
});

test("record-aware evidence previews prioritize distinct receipts without promoting geometry", () => {
  const molecular = findResearchRecord(index.records, "molecular_profile", "iglesias-gonzalez-2021:gse185731:mmusculus:m1");
  const morphology = findResearchRecord(index.records, "morphology_record", "NeuroMorpho:109021");
  const roomeA1 = findResearchRecord(index.records, "molecular_profile", "roome-2026:GSE291462:dILA1-A1");
  const roomeE1 = findResearchRecord(index.records, "molecular_profile", "roome-2026:GSE291462:dILB6-E1");
  assert.deepEqual(selectResearchEvidencePreviewRows(molecular).map((row) => row.label), [
    "Source-local label",
    "Exact sampled-cell count",
    "Source markers",
    "Temporal context",
  ]);
  assert.deepEqual(selectResearchEvidencePreviewRows(morphology).map((row) => row.label), [
    "Geometry receipt",
    "Observed SWC mode",
    "Diameter authority",
    "Radius-derived surface",
  ]);
  const roomeA1Preview = selectResearchEvidencePreviewRows(roomeA1);
  const roomeE1Preview = selectResearchEvidencePreviewRows(roomeE1);
  assert.deepEqual(roomeA1Preview.map((row) => row.label), [
    "Source-local label",
    "Exact captured-cell count",
    "Percent of captured dIL denominator",
    "Positive differential features meeting display thresholds",
  ]);
  assert.deepEqual(roomeE1Preview.map((row) => row.label), roomeA1Preview.map((row) => row.label));
  assert.notDeepEqual(roomeE1Preview.map((row) => row.value), roomeA1Preview.map((row) => row.value));
  assert.equal(roomeA1Preview[1].value, "179 captured refined dIL cells");
  assert.equal(roomeE1Preview[1].value, "756 captured refined dIL cells");
  assert.match(roomeA1Preview[3].value, /Tfap2b.*Islr2.*Npy/);
  assert.match(roomeE1Preview[3].value, /Pou4f1.*Prox1.*Lmx1b/);
  assert.equal(molecular.coordinate.geometryStatus, "TYPE_LEVEL");
  assert.equal(molecular.coordinate.registrationCount, 0);
  assert.equal(morphology.coordinate.registrationCount, 0);
  assert.equal(roomeA1.coordinate.geometryStatus, "TYPE_LEVEL");
  assert.equal(roomeA1.coordinate.registrationCount, 0);
  assert.equal(roomeE1.coordinate.geometryStatus, "TYPE_LEVEL");
  assert.equal(roomeE1.coordinate.registrationCount, 0);
  assert.throws(() => selectResearchEvidencePreviewRows(morphology, 0), /integer from 1 to 8/);
});

test("right-rail molecular receipts remain record-specific across all ten namespaces", () => {
  const expectedPreviewLabels = new Map([
    ["cano-gomez-2026:GSE318731", ["Source-local label", "Exact sampled-nucleus count", "Source context counts", "Profile roster receipt"]],
    ["alkaslasi-2021:GSE167597", ["Source-local label", "Exact sampled-nucleus count", "Figure 5a prominent labels", "Article marker context"]],
    ["crozat-2025:figshare-29430869-v2", ["Source markers", "Electrophysiology evidence", "Firing-pattern total", "Spinal and anatomy context"]],
    ["delile-2019:E-MTAB-7320", ["Source-local label", "Source cardinal class", "Exact sampled-cell count", "Fine-subtype timepoint cell counts"]],
    ["haring-2018:GSE103840", ["Standardized source label", "Exact sampled-cell count", "Table 8 marker summary", "Table 5 identification rule"]],
    ["hayashi-2018:GSE108788", ["Source-local label", "Figure-reported cell count", "Narrative marker panel", "Spatial-domain context"]],
    ["iglesias-gonzalez-2021:gse185731:mmusculus", ["Source-local label", "Exact sampled-cell count", "Source markers", "Temporal context"]],
    ["roome-2026:GSE291462", ["Source-local label", "Exact captured-cell count", "Percent of captured dIL denominator", "Positive differential features meeting display thresholds"]],
    ["russ-2021", ["Source-local label", "Exact captured-cell/nucleus count", "Primary markers", "Region class"]],
    ["sathyamurthy-2018", ["Source-local label", "Sampled nuclei", "Figure/source markers", "Putative cell type"]],
  ]);
  const profiles = index.records.filter((record) => record.focusKind === "molecular_profile");
  const namespaces = [...new Set(profiles.map((record) => record.namespace))];
  assert.deepEqual(new Set(namespaces), new Set(expectedPreviewLabels.keys()));

  for (const namespace of namespaces) {
    const records = profiles.filter((record) => record.namespace === namespace);
    const previews = records.map((record) => selectResearchEvidencePreviewRows(record));
    assert.ok(previews.every((rows) => rows.length === 4), `${namespace} should expose four right-rail receipt rows`);
    assert.ok(previews.every((rows) => JSON.stringify(rows.map((row) => row.label)) === JSON.stringify(expectedPreviewLabels.get(namespace))), `${namespace} preview priority drifted`);
    assert.ok(records.every((record) => record.coordinate.geometryStatus === "TYPE_LEVEL" && record.coordinate.registrationCount === 0 && record.coordinate.measurementUse === "forbidden"), `${namespace} must not gain geometry from a receipt preview`);
    if (records.length > 1) {
      const fingerprints = previews.map((rows) => JSON.stringify(rows.map((row) => [row.label, row.value, row.locator])));
      assert.equal(new Set(fingerprints).size, records.length, `${namespace} right-rail receipts collide across selected records`);
    }
  }
});

test("validation accepts a normalized source title in the search corpus", () => {
  const record = index.records.find((candidate) => candidate.title !== candidate.title.trim());
  assert.ok(record);
  assert.ok(record.searchTerms.includes(record.title.trim()));
  assert.doesNotThrow(() => validateResearchExplorerIndex(index, manifest));
});

test("search discovers matching source records without creating a relationship", () => {
  const results = searchResearchRecords(index.records, "Vsx2");
  const keys = results.map(({ record }) => record.key);
  assert.ok(keys.includes("sci_entity:mouse.sc.vsx2_hoxa10"));
  assert.ok(keys.includes("molecular_profile:russ-2021:Excit-36"));
  assert.ok(new Set(results.map(({ record }) => record.focusKind)).size > 1);
  assert.ok(results.every(({ record }) => record.relationshipStatus === "not_established_outside_this_source_record"));

  const groups = groupResearchResults(results);
  assert.ok(groups.some((group) => group.namespace === "ohri-research-mvp-0.2"));
  assert.ok(groups.some((group) => group.namespace === "russ-2021"));
  assert.ok(groups.some((group) => group.namespace === "sathyamurthy-2018"));
  assert.ok(groups.some((group) => group.namespace === "hayashi-2018:GSE108788"));
});

test("a direct-selected source group remains visible beyond the initial eight groups without duplication", () => {
  const groups = groupResearchResults(searchResearchRecords(index.records, ""));
  const selected = findResearchRecord(index.records, "molecular_profile", "crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn");
  const visible = includeSelectedResearchGroup(groups, selected, 8);
  assert.equal(groups.findIndex((group) => group.namespace === selected.namespace) >= 8, true);
  assert.equal(visible.length, 9);
  assert.equal(visible.filter((group) => group.namespace === selected.namespace).length, 1);
});

test("search discovers Hayashi P0 V2a clusters while preserving the no-join boundary", () => {
  const accessionResults = searchResearchRecords(index.records, "GSE108788");
  assert.equal(accessionResults.length, 12);
  assert.equal(accessionResults.filter(({ record }) => record.namespace === "hayashi-2018:GSE108788").length, 11);
  assert.ok(accessionResults.some(({ record }) => record.namespace === "coverage:hayashi-2018"));

  const p0Results = searchResearchRecords(index.records, "P0 V2a");
  assert.ok(p0Results.some(({ record }) => record.key === "molecular_profile:hayashi-2018:GSE108788:cluster-6"));

  for (const term of ["Chx10", "cervical", "lumbar", "Type II", "Zfhx3", "Nfib"]) {
    const results = searchResearchRecords(index.records, term);
    assert.ok(results.some(({ record }) => record.namespace === "hayashi-2018:GSE108788"), `${term} should find a Hayashi record`);
    assert.ok(results.every(({ record }) => record.relationshipStatus === "not_established_outside_this_source_record"));
  }

  const cluster = findResearchRecord(index.records, "molecular_profile", "hayashi-2018:GSE108788:cluster-6");
  assert.ok(cluster);
  assert.equal(cluster.coordinate.geometryStatus, "TYPE_LEVEL");
  assert.equal(cluster.coordinate.registrationCount, 0);
  assert.match(cluster.boundary, /one 10x library|pooled/i);
  assert.ok(cluster.gaps.some((item) => item.label === "Public cluster-to-barcode map" && item.status === "unavailable" && item.reasonCode === "repository_object_unavailable"));
  assert.ok(cluster.gaps.some((item) => item.label === "Article percentage reproduction" && item.status === "unresolved" && item.reasonCode === "unresolved_source_conflict"));
});

test("search discovers eight Alkaslasi adult cholinergic profiles without turning sample metadata into prevalence or 3D placement", () => {
  const accessionResults = searchResearchRecords(index.records, "GSE167597");
  assert.equal(accessionResults.length, 8);
  assert.ok(accessionResults.every(({ record }) => record.namespace === "alkaslasi-2021:GSE167597"));

  const records = index.records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "alkaslasi-2021:GSE167597");
  const evidence = (record, label) => record.evidence.find((item) => item.label === label);
  assert.equal(records.length, 8);
  assert.equal(records.reduce((total, record) => total + Number.parseInt(evidence(record, "Exact sampled-nucleus count").value, 10), 0), 5375);
  assert.ok(records.every((record) => /Chat-Cre\/Sun1.*FACS.*not biological prevalence/i.test(evidence(record, "Sampling design boundary").value)));
  assert.ok(records.every((record) => /sample membership, not xyz coordinates/.test(evidence(record, "Deposited sample-region membership").value)));
  assert.ok(records.every((record) => /NA is preserved, not imputed as mixed-sex/.test(evidence(record, "Deposited sex-field membership").value)));
  assert.ok(records.every((record) => record.coordinate.geometryStatus === "TYPE_LEVEL" && record.coordinate.registrationCount === 0));
  assert.ok(records.every((record) => record.gaps.some((item) => item.label === "Internal structure" && item.status === "not_measured")));

  const i8 = findResearchRecord(records, "molecular_profile", "alkaslasi-2021:GSE167597:I8");
  assert.ok(i8);
  assert.match(evidence(i8, "Article marker context").value, /Mpped2.*Piezo2.*Reln.*Chat/);
  assert.match(evidence(i8, "Figure 5a prominent labels").value, /Pde11a.*Nr5a2.*CT010465\.1.*Slc30a8/);
  assert.match(evidence(i8, "Experimental-unit flow").value, /matching regions first pooled from 2 mice.*4 mice per processing replicate/);
  assert.match(evidence(i8, "Publication identity discrepancy").value, /33931636.*37559423/);
  assert.match(evidence(i8, "I8 evidence caution").value, /suspected.*ISH support/i);
  assert.equal(searchResearchRecords(index.records, "Slc30a8").some(({ record }) => record.focusId === i8.focusId), true);
  assert.ok(i8.gaps.some((item) => item.label === "Atlas registration" && item.status === "not_established"));
  assert.equal(i8.provenance.objectHashes[0].sha256, "6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091");
});

test("Cano-Gomez exposes only the 11 exact CHOL_IN profiles with roster receipts and zero inferred model detail", () => {
  const records = index.records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "cano-gomez-2026:GSE318731");
  const sourceById = new Map(canoGomezRegistry.profiles.map((profile) => [profile.profileId, profile]));
  const evidence = (record, label) => record.evidence.find((item) => item.label === label);
  assert.equal(records.length, 11);
  assert.equal(canoGomezRegistry.denominatorReconciliation.confirmedInterneuronProfileCount, 11);
  assert.equal(records.reduce((total, record) => total + Number.parseInt(evidence(record, "Exact sampled-nucleus count").value, 10), 0), 923);
  assert.equal(canoGomezRegistry.denominatorReconciliation.confirmedInterneuronNucleusCount, 923);
  assert.equal(searchResearchRecords(index.records, "GSE318731").filter(({ record }) => record.namespace === "cano-gomez-2026:GSE318731").length, 11);

  for (const record of records) {
    const source = sourceById.get(record.focusId);
    assert.ok(source);
    assert.equal(record.title, source.sourceLocalLabel);
    assert.equal(record.recordSemantics.parentSourceId, "SRC-CANOGOMEZ-2026");
    assert.equal(record.recordSemantics.recordKind, "source_local_exact_nucleus_roster_profile");
    assert.equal(record.recordSemantics.cellRosterAvailability, "exact_bundled_profile_and_nucleus_roster");
    assert.equal(evidence(record, "Source-local label").value, source.sourceLocalLabel);
    assert.equal(evidence(record, "Source group").value, "CHOL_IN");
    assert.equal(evidence(record, "Canonical transmitter").value, "Cholinergic");
    assert.equal(evidence(record, "Source markers").value, "Not established; the exact source label is not tokenized, normalized or interpreted as marker evidence.");
    assert.match(evidence(record, "Profile roster receipt").locator, new RegExp(`confirmed_interneuron_profile_id=${source.profileId}$`));
    assert.match(evidence(record, "Identity authority").value, new RegExp(canoGomezRegistry.identityAuthority.mode));
    assert.match(evidence(record, "Dataset denominator reconciliation").value, /516 neuronal types not used as an interneuron denominator/);
    assert.equal(evidence(record, "3D and internal model state").value, "0 admitted type-specific geometry · 0 admitted internal structures · 0 same-cell links · 0 registrations");
    assert.equal(record.coordinate.geometryStatus, "TYPE_LEVEL");
    assert.equal(record.coordinate.registrationCount, 0);
    assert.equal(record.coordinate.measurementUse, "forbidden");
    assert.equal(record.presentation.modeling.admittedCellGeometryObjectCount, 0);
    assert.equal(record.presentation.modeling.admittedInternalObjectCount, 0);
    assert.equal(record.presentation.modeling.generatedFallbackPrimitiveCount, 0);
    assert.equal(record.presentation.modeling.sameCellJoinCount, 0);
    assert.ok(record.gaps.some((gap) => gap.axisId === "internal_structure" && gap.reasonCode === "source_schema_no_field" && gap.inferenceAllowed === false));
    assert.match(record.boundary, /without token-to-marker inference/);
  }

  const rawAnomaly = records.find((record) => record.title === "CHOL_IN_Pitx2_ Srpx2");
  assert.ok(rawAnomaly, "the exact internal-space source-label anomaly must remain unchanged");
  assert.equal(searchResearchRecords(index.records, "CHOL_IN_Pitx2_ Srpx2").some(({ record }) => record.focusId === rawAnomaly.focusId), true);
});

test("search discovers 30 Häring GSE103840 profiles plus the existing coverage record without joining them", () => {
  const accessionResults = searchResearchRecords(index.records, "GSE103840");
  const molecularResults = accessionResults.filter(({ record }) => record.focusKind === "molecular_profile");
  const coverageResults = accessionResults.filter(({ record }) => record.focusKind === "source_lane");
  assert.equal(accessionResults.length, 31);
  assert.equal(molecularResults.length, 30);
  assert.ok(molecularResults.every(({ record }) => record.namespace === "haring-2018:GSE103840"));
  assert.deepEqual(coverageResults.map(({ record }) => record.key), ["source_lane:haring-2018"]);
  assert.ok(accessionResults.every(({ record }) => record.relationshipStatus === "not_established_outside_this_source_record"));
});

test("Häring dossiers surface exact labels, rules, marker locators, denominators, spatial context, and unsupported axes", () => {
  const records = index.records.filter((record) => record.focusKind === "molecular_profile" && record.namespace === "haring-2018:GSE103840");
  assert.equal(records.length, 30);
  const evidence = (record, label) => record.evidence.find((item) => item.label === label);
  const sampledCellCount = records.reduce((total, record) => total + Number.parseInt(evidence(record, "Exact sampled-cell count").value, 10), 0);
  assert.equal(sampledCellCount, 1545);

  for (const record of records) {
    assert.equal(evidence(record, "Standardized source label").value, record.title);
    assert.ok(evidence(record, "Deposited raw cluster label").value);
    assert.match(evidence(record, "Standardized source label").locator, /row 6/);
    assert.match(evidence(record, "Table 4 source-local label").locator, /HARING-2018-MOESM6 .*![A-Z]{1,2}1/);
    assert.match(evidence(record, "Exact sampled-cell count").locator, /HARING-2018-MOESM6 .*![A-Z]{1,2}2/);
    assert.match(evidence(record, "Table 5 identification rule").value, /->/);
    assert.match(evidence(record, "Table 5 identification rule").locator, /HARING-2018-MOESM7 .*![BCD]\d+/);
    assert.match(evidence(record, "Table 8 marker summary").locator, /HARING-2018-MOESM10 .*![CDEF]\d+/);
    assert.match(evidence(record, "Matrix age cell-column summary").value, /denominator cell columns/);
    assert.match(evidence(record, "Deposited sex-code cell-column summary").value, /sex\(female=1\).*denominator cell columns; not independent-animal prevalence/);
    assert.match(evidence(record, "Matrix strain-selection cell-column summary").value, /denominator cell columns; not independent-animal prevalence/);
    assert.match(evidence(record, "Source sample frame").value, /^28 source animals .*1545 sampled cells and 1545 GEO single-cell accessions/);
    assert.match(evidence(record, "Sequencing-cohort age boundary").value, /17-28 days old .*3-4 week mice.*not source-asserted/);
    assert.match(evidence(record, "Taxonomy curation flow").value, /1639 post-QC neurons - 94 source-labelled exclude = 1545 final cells; 43 initial BackSPIN clusters -> 30 final types; 767 Glut-group \+ 778 Gaba-group/);
    assert.match(evidence(record, "Retained source discrepancy · final cluster count").value, /Glut7 = 104 versus Supplementary Figure 2 legend: Glut7 = 105/);
    assert.equal(record.evidence.filter((item) => item.label.startsWith("Retained source discrepancy ·")).length, 4);
    assert.match(evidence(record, "Spatial source context").value, /^2 animals; 6 cervical spinal cord sections; population-level/);
    assert.equal(record.coordinate.registrationCount, 0);
    assert.ok(record.gaps.some((item) => item.label === "Cross-source same-cell or same-type identity" && item.status === "not_established"));
    assert.ok(record.gaps.some((item) => item.label === "Cell coordinates" && item.status === "unavailable" && item.reasonCode === "repository_object_unavailable"));
    assert.ok(record.gaps.some((item) => item.label === "Morphology" && item.status === "not_measured"));
    assert.ok(record.gaps.some((item) => item.label === "Atlas transform" && item.status === "not_established"));
  }

  const glut1 = findResearchRecord(records, "molecular_profile", "haring-2018:GSE103840:Glut1");
  assert.equal(evidence(glut1, "Standardized source label").value, "Glut1");
  assert.equal(evidence(glut1, "Deposited raw cluster label").value, "Glut_Cck_Maf");
  assert.match(evidence(glut1, "Table 5 identification rule").value, /\+Maf,\+Cck,-Cpne4/);
  assert.match(evidence(glut1, "Table 8 marker summary").value, /main Maf; co-marker 1 Cck/);

  const gaba1 = findResearchRecord(records, "molecular_profile", "haring-2018:GSE103840:Gaba1");
  assert.equal(evidence(gaba1, "Standardized source label").value, "Gaba1");
  assert.equal(evidence(gaba1, "Deposited raw cluster label").value, "Glut_Gal");
  assert.match(gaba1.boundary, /cell-column metadata.*not be promoted to independent-animal denominators/);
});

test("search discovers the Matson source-local SCI population and sample accessions without joining lanes", () => {
  const pdynResults = searchResearchRecords(index.records, "Pdyn");
  assert.ok(pdynResults.some(({ record }) => record.key === "sci_population:matson-2022:GSE172167:Pdyn_Neurons"));

  const gsmResults = searchResearchRecords(index.records, "GSM5243310");
  assert.equal(gsmResults.filter(({ record }) => record.focusKind === "sci_population").length, 17);
  assert.ok(gsmResults.every(({ record }) => record.namespace === "matson-2022:GSE172167"));
  assert.ok(gsmResults.every(({ record }) => record.relationshipStatus === "not_established_outside_this_source_record"));

  const deepRankResults = searchResearchRecords(index.records, "Parm1");
  assert.ok(deepRankResults.some(({ record }) => record.key === "sci_population:matson-2022:GSE172167:Pdyn_Neurons"));
  const rankTwentyResults = searchResearchRecords(index.records, "SDR42E2");
  assert.ok(rankTwentyResults.some(({ record }) => record.key === "sci_population:matson-2022:GSE172167:CSF-c_Neurons"));
  assert.ok([...deepRankResults, ...rankTwentyResults].every(({ record }) => record.relationshipStatus === "not_established_outside_this_source_record"));
});

test("canonical focus parsing fails closed for incomplete, unknown, or mismatched pairs", () => {
  assert.deepEqual(parseResearchFocus(new URLSearchParams("focusKind=sci_entity&focusId=mouse.sc.vsx2_hoxa10"), index.records), {
    focusKind: "sci_entity",
    focusId: "mouse.sc.vsx2_hoxa10",
  });
  assert.deepEqual(parseResearchFocus(new URLSearchParams("focusKind=sci_population&focusId=matson-2022%3AGSE172167%3ACpne4_Neurons"), index.records), {
    focusKind: "sci_population",
    focusId: "matson-2022:GSE172167:Cpne4_Neurons",
  });
  assert.equal(parseResearchFocus(new URLSearchParams("focusKind=sci_entity"), index.records), null);
  assert.equal(parseResearchFocus(new URLSearchParams("focusId=mouse.sc.vsx2_hoxa10"), index.records), null);
  assert.equal(parseResearchFocus(new URLSearchParams("focusKind=morphology_record&focusId=mouse.sc.vsx2_hoxa10"), index.records), null);
  assert.equal(parseResearchFocus(new URLSearchParams("focusKind=sci_entity&focusId=unknown"), index.records), null);
});

test("legacy selections resolve only to existing canonical focus identities", () => {
  const morphology = index.records.find((record) => record.focusKind === "morphology_record");
  const neuronId = morphology.navigation.params.morphologyNeuron;
  assert.deepEqual(parseResearchFocus(new URLSearchParams(`morphologyNeuron=${neuronId}`), index.records), {
    focusKind: "morphology_record",
    focusId: morphology.focusId,
  });

  const anatomy = index.records.find((record) => record.focusKind === "anatomy_label");
  assert.deepEqual(parseResearchFocus(new URLSearchParams(`anatomyStructure=${anatomy.navigation.params.anatomyStructure}`), index.records), {
    focusKind: "anatomy_label",
    focusId: anatomy.focusId,
  });
  assert.equal(parseResearchFocus(new URLSearchParams("morphologyNeuron=0"), index.records), null);
});

test("focus serialization preserves unrelated state and writes an atomic focus pair", () => {
  const next = serializeResearchFocus(new URLSearchParams("lab=overview&panel=evidence"), {
    focusKind: "molecular_profile",
    focusId: "russ-2021:Excit-36",
  });
  assert.equal(next.get("lab"), "overview");
  assert.equal(next.get("panel"), "evidence");
  assert.equal(next.get("focusKind"), "molecular_profile");
  assert.equal(next.get("focusId"), "russ-2021:Excit-36");
  assert.ok(findResearchRecord(index.records, next.get("focusKind"), next.get("focusId")));
});

test("validators reject relationship promotion, registration, stale navigation, and asset drift", () => {
  const registered = structuredClone(index);
  registered.records[0].coordinate.registrationCount = 1;
  assert.throws(() => validateResearchExplorerDocumentSemantics(registered, manifest), /relationship boundary|registration/i);

  const related = structuredClone(index);
  related.records[0].relatedFocusIds = [related.records[1].focusId];
  assert.throws(() => validateResearchExplorerDocumentSemantics(related, manifest), /forbidden cross-lane field/i);

  const stale = structuredClone(index);
  stale.records.find((record) => record.focusKind === "molecular_profile").navigation.params.type = "unknown";
  assert.throws(() => validateResearchExplorerDocumentSemantics(stale, manifest), /stale molecular selection/i);

  const staleSci = structuredClone(index);
  staleSci.records.find((record) => record.focusKind === "sci_population").navigation.params.sciTime = "2wpi";
  assert.throws(() => validateResearchExplorerDocumentSemantics(staleSci, manifest), /stale SCI time-course selection/i);

  const driftedManifest = structuredClone(manifest);
  driftedManifest.index.sha256 = "0".repeat(64);
  assert.throws(() => validateResearchExplorerManifestIntegrity(driftedManifest, indexBytes, new Map()), /SHA-256/i);
});
