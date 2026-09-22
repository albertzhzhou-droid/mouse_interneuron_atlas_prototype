import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const TAXONOMY_URL = new URL("../data/haring-dorsal-horn-source-taxonomy-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/haring-dorsal-horn-source-taxonomy-0.1.schema.json", import.meta.url);

const EXPECTED_LABELS = [
  ...Array.from({ length: 15 }, (_, index) => `Glut${index + 1}`),
  ...Array.from({ length: 15 }, (_, index) => `Gaba${index + 1}`),
];
const EXPECTED_COUNTS = [
  32, 34, 34, 34, 24, 75, 104, 77, 34, 129, 61, 35, 38, 34, 22,
  18, 87, 145, 11, 19, 51, 39, 67, 85, 66, 48, 56, 34, 41, 11,
];
const EXPECTED_RAW_CLUSTERS = [
  "Glut_Cck_Maf", "Glut_Cck_Cpne4", "Glut_Cck_Trh", "Glut_Nts", "Glut_Tac2_3",
  "Glut_Tac2_2", "Glut_Tac2_1", "Glut_Reln_Nmur2", "Glut_Reln_Npff", "Glut_Tac1_2",
  "Glut_Tac1_1", "Glut_Qrfpr", "Glut_Elavl4", "Glut_Elavl4_Meis2", "Glut_Elavl4_Lypd1",
  "Glut_Gal", "GABA_Gal_Pnoc", "GABA_Gal_Rspo3", "GABA_Tac2", "GABA_Npy_only",
  "GABA_Npy_Qrfpr", "GABA_Npy_Crabp1", "GABA_Calb2_Krt17", "GABA_Calb2_Tac1", "GABA_Cplx1_Adamts5",
  "GABA_Cplx1_Calb2", "GABA_Cplx1_Sorcs3", "GABA_Cplx1_Sst", "GABA_Crabp1", "GABA_Crabp1_Spp1",
];
const EXPECTED_RULE_TARGET_ROWS = {
  Glut1: [5], Glut2: [6], Glut3: [7], Glut4: [8], Glut5: [9], Glut6: [10], Glut7: [10],
  Glut8: [11], Glut9: [12], Glut10: [13], Glut11: [14], Glut12: [15, 16], Glut13: [17, 18],
  Glut14: [19], Glut15: [20], Gaba1: [21], Gaba2: [22], Gaba3: [23], Gaba4: [24], Gaba5: [25],
  Gaba6: [26], Gaba7: [27], Gaba8: [28], Gaba9: [29], Gaba10: [30], Gaba11: [31], Gaba12: [32],
  Gaba13: [33], Gaba14: [34], Gaba15: [35],
};
const EXPECTED_TABLE8_ROWS = [
  ...Array.from({ length: 15 }, (_, index) => index + 4),
  ...Array.from({ length: 15 }, (_, index) => index + 21),
];
const EXPECTED_SOURCE_OBJECTS = {
  "HARING-2018-MOESM6": [4, "41593_2018_141_MOESM6_ESM.xlsx", 9583, "a8c723ea7d7a3baef40fad0ef6395f027bc2932c94c9e43791fa7a7ea59e2f00"],
  "HARING-2018-MOESM7": [5, "41593_2018_141_MOESM7_ESM.xlsx", 9858, "c29bf5371b91a492fc454a210d9b927702de50e4aa94a3d07bde2c52aa0f4669"],
  "HARING-2018-MOESM10": [8, "41593_2018_141_MOESM10_ESM.xlsx", 57844, "80a4b0d803adf88f5fcec191bc4d03f5eba182d235f364d96f50d84ece525fc8"],
  "HARING-2018-MOESM1": [null, "41593_2018_141_MOESM1_ESM.pdf", 3272419, "00b340c16deead3627418c7a903e359589efad35870c565a15e3962f6bf951c9"],
};
const EXPECTED_MISSING_EVIDENCE = {
  cellCoordinates: "not_available",
  morphology: "not_measured",
  axonTrajectory: "not_measured",
  electrophysiology: "not_measured",
  projectionTargets: "not_measured",
  synapticConnectivity: "not_measured",
  sciContext: "not_measured",
  sameCellCrossModalLinks: "not_established",
  atlasTransform: "not_established",
};

// Filled from the independently pinned source transcriptions; these hashes lock
// ordering, signs, cell locators, sparse marker slots, and matrix aggregates.
const EXPECTED_RULES_SHA256 = "d35263c8bcd7e8401a13496560a460cb890fcba35fd466756e5a76d0135da83d";
const EXPECTED_MARKERS_SHA256 = "1fb1b36afddf61b8e689c6dc54f9f2efafecc0f8d66a9496d727168cc48c2175";
const EXPECTED_BARCODE_SUMMARIES_SHA256 = "6b6f53bc448f9b5894d1b6d6f5914983a8ebf5e73bce8a5f0f5465a3b2e48728";
const EXPECTED_LOCATORS_SHA256 = "72ec9f4074ce89bca3caeaed4fcd9f1ea26c2e0beb98f068c03bb98dd653c8ad";
const EXPECTED_DISCREPANCY_IDS = [
  "glut7-count-conflict",
  "library-platform-conflict",
  "sex-code-comment-conflict",
  "sra-tissue-summary-conflict",
];

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sha256Json(value) {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

function excelColumn(number) {
  let result = "";
  let remaining = number;
  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode(65 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }
  return result;
}

function hasBoundary(items, pattern) {
  return (items ?? []).some((item) => pattern.test(item));
}

export async function validateHaringDorsalHornSourceTaxonomy(taxonomy) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(taxonomy)) errors.push(...formatSchemaErrors(validate.errors));

  check(taxonomy.releaseId === "ohri-haring-dorsal-horn-source-taxonomy-0.1.0", "release ID must remain pinned", errors);
  check(taxonomy.datasetId === "GSE103840", "dataset ID must remain GSE103840", errors);
  check(taxonomy.coordinateAuthority === "SOURCE_LOCAL_TYPE_ONLY", "coordinate authority must remain SOURCE_LOCAL_TYPE_ONLY", errors);
  check(taxonomy.source?.publication?.doi === "10.1038/s41593-018-0141-1", "publication DOI must remain pinned", errors);
  check(taxonomy.source?.publication?.pmid === "29686262", "publication PMID must remain pinned", errors);
  check(taxonomy.source?.publication?.reuseStatus === "PUBLIC_ACCESS_REUSE_NOT_ASSUMED", "article public access must not become assumed reuse permission", errors);

  const scope = taxonomy.scope ?? {};
  check(scope.lifeStage === "postnatal P17-P28", "life stage must remain source-bounded to postnatal P17-P28", errors);
  check(scope.lifeStageCategory === null, "broad life-stage category must remain not source-asserted", errors);
  check(scope.reportedClusterCount === 30 && scope.displayedProfileCount === 30, "all 30 source-local profiles must remain represented", errors);
  check(scope.reportedExcitatoryClusterCount === 15 && scope.reportedInhibitoryClusterCount === 15, "taxonomy must remain 15 Glut plus 15 Gaba profiles", errors);
  check(scope.sourceReportedCellCount === 1545 && scope.profileSamplingCountSum === 1545, "source and profile cell denominators must remain 1,545", errors);
  check(scope.samplingCountInterpretation === "SAMPLING_COUNT_ONLY_NOT_PREVALENCE", "profile counts must retain the no-prevalence interpretation", errors);
  check(scope.exactClusterCellAssignmentAvailable === true && scope.exactStandardNameCellAssignmentAvailable === true, "checksum-pinned matrix cell-to-cluster assignments must remain available", errors);
  check(scope.exactCrossSourceIdentityCount === 0, "exact cross-source identity count must remain zero", errors);
  check(scope.projectRegistrationCount === 0, "project registration count must remain zero", errors);
  check(scope.projectConfirmedLocalInterneuronProfileCount === 0, "project-confirmed local-interneuron count must remain zero", errors);

  const curationFlow = taxonomy.curationFlow ?? {};
  check(curationFlow.initialPostQcNeuronCount === 1639, "initial post-QC neuron count must remain 1,639", errors);
  check(curationFlow.excludedCellCount === 94 && curationFlow.finalCellCount === 1545, "curation flow must retain 94 excluded and 1,545 final cells", errors);
  check(curationFlow.initialBackspinClusterCount === 43 && curationFlow.finalTypeCount === 30, "curation flow must retain 43 initial clusters and 30 final types", errors);
  check(curationFlow.finalGlutCellCount === 767 && curationFlow.finalGabaCellCount === 778, "final Glut/Gaba cell counts must remain 767/778", errors);
  check(curationFlow.finalGlutCellCount + curationFlow.finalGabaCellCount === curationFlow.finalCellCount, "final Glut/Gaba counts must reconcile to 1,545 cells", errors);
  check(/pipeline-stage counts, not independent biological replicates or biological prevalence/i.test(curationFlow.interpretationBoundary ?? ""), "curation flow must preserve its denominator boundary", errors);

  const sampleFrame = taxonomy.source?.geo?.sampleFrame ?? {};
  check(sampleFrame.lifeStage === "postnatal P17-P28", "sample-frame life stage must remain postnatal P17-P28", errors);
  check(sampleFrame.sourceAgeText === "3-4 week mice", "GEO/SRA source age text must remain 3-4 week mice", errors);
  check(sampleFrame.lifeStageCategory === null, "sample-frame life-stage category must remain null", errors);
  check(/conventional normalization.+17-28/i.test(sampleFrame.ageNormalization ?? ""), "sample frame must identify P17-P28 as a conventional normalization of deposited age(days) 17-28", errors);
  check(/does not assert an adult, juvenile, or young-adult category/i.test(sampleFrame.ageNormalization ?? ""), "sample frame must prohibit an unsupported categorical life-stage label", errors);
  check(sampleFrame.sourceAnimalCount === 28, "sourceAnimalCount must remain 28", errors);
  check(jsonEqual(sampleFrame.selectionCohorts?.map((item) => item.animalCount), [3, 5, 20]), "sampling cohort animal counts must remain exactly 3, 5, and 20", errors);
  check((sampleFrame.selectionCohorts ?? []).reduce((sum, item) => sum + item.animalCount, 0) === 28, "sampling cohort animal counts must sum to 28", errors);
  check(sampleFrame.cellSamplingCount === 1545 && sampleFrame.geoCellAccessionCount === 1545, "cell and GSM cell-accession denominators must remain 1,545", errors);
  check(/not 1,545 animals|not 1,545 animals/i.test(sampleFrame.interpretationBoundary ?? ""), "sample frame must preserve the cell-versus-animal denominator boundary", errors);

  const matrix = taxonomy.source?.geo?.countMatrixAsset ?? {};
  const expectedMatrix = {
    id: "GSE103840_MOLECULE_COUNTS",
    fileName: "GSE103840_molecule_counts.xlsx",
    bytes: 123463759,
    sha256: "0b4bbd1bb5ef1e80cfdf286761cf697183a8e6f11ca25c901ff4841ddfaf63de",
    worksheetName: "moldata_C1_data_DHneurons_no_an",
    ooxmlDimension: "A1:BGL24385",
    worksheetRowCountIncludingHeader: 24385,
    sourceDataRowCount: 24384,
    metadataRowCount: 6,
    geneRowCount: 24378,
    worksheetColumnCount: 1546,
    cellIdColumnCount: 1,
    cellColumnCount: 1545,
    uniqueCellIdCount: 1545,
  };
  for (const [field, expected] of Object.entries(expectedMatrix)) {
    check(matrix[field] === expected, `count matrix ${field} must remain ${expected}`, errors);
  }
  check(jsonEqual(matrix.metadataRows, { ageDays: 2, sexFemaleCode: 3, totalMolecules: 4, rawClusterName: 5, standardName: 6, strain: 7 }), "matrix metadata-row coordinates must remain rows 2 through 7", errors);
  check(jsonEqual(matrix.ageDaysRange, { minimum: 17, maximum: 28, unit: "days", denominatorUnit: "cell_columns" }), "matrix age range must remain P17-P28 at cell-column denominator", errors);
  check(jsonEqual(matrix.sexCodeCellCounts, { code0: 1490, code1: 55, codeMeaning: "female=1", denominatorUnit: "cell_columns" }), "matrix deposited sex-code counts must remain 1,490 code 0 and 55 code 1 cell columns", errors);
  check(jsonEqual(matrix.strainCellCounts, { C57bl6: 637, vGatCreTdTomato: 537, vGlut2EGfp: 371, denominatorUnit: "cell_columns" }), "matrix strain cell counts must remain 637, 537, and 371", errors);
  check(matrix.strainCellCounts?.C57bl6 + matrix.strainCellCounts?.vGatCreTdTomato + matrix.strainCellCounts?.vGlut2EGfp === 1545, "matrix strain cell counts must sum to 1,545", errors);
  check(matrix.sexCodeCellCounts?.code0 + matrix.sexCodeCellCounts?.code1 === 1545, "matrix deposited sex-code counts must sum to 1,545", errors);
  check(matrix.exactRawClusterCellAssignmentAvailable === true && matrix.exactStandardNameCellAssignmentAvailable === true, "matrix raw-cluster and standard-name assignments must remain available", errors);
  check(matrix.standardLabelCountReconcilesToTable4 === true, "matrix standard-label counts must remain reconciled to Table 4", errors);
  check(matrix.sourceFileBundled === false, "processed matrix source file must not be bundled", errors);
  check(matrix.reuseStatus === "PUBLIC_ACCESS_REUSE_NOT_ASSUMED", "processed matrix public access must not become assumed redistribution permission", errors);
  check(/cell-column attributes/i.test(matrix.interpretationBoundary ?? ""), "matrix metadata must retain its cell-column denominator boundary", errors);

  const supplementaryObjects = taxonomy.source?.supplementaryObjects ?? [];
  check(supplementaryObjects.length === 4, "exactly four pinned supplementary objects must remain", errors);
  check(new Set(supplementaryObjects.map((item) => item.id)).size === 4, "supplementary object IDs must be unique", errors);
  for (const object of supplementaryObjects) {
    const expected = EXPECTED_SOURCE_OBJECTS[object.id];
    check(Boolean(expected), `unknown supplementary object ${object.id}`, errors);
    if (!expected) continue;
    check(jsonEqual([object.tableNumber, object.fileName, object.bytes, object.sha256], expected), `${object.id} byte/hash receipt changed`, errors);
    check(object.sourceFileBundled === false, `${object.id} must not be bundled`, errors);
    check(object.reuseStatus === "PUBLIC_ACCESS_REUSE_NOT_ASSUMED", `${object.id} public access must not become assumed redistribution permission`, errors);
  }

  const locators = taxonomy.sourceLocators ?? [];
  const locatorIds = locators.map((locator) => locator.id);
  check(locatorIds.length === 11 && new Set(locatorIds).size === 11, "source locators must contain 11 unique IDs", errors);
  check(sha256Json(locators) === EXPECTED_LOCATORS_SHA256, "source locator text, authority, or support fields drifted", errors);
  const locatorById = new Map(locators.map((locator) => [locator.id, locator]));

  const discrepancies = taxonomy.sourceDiscrepancies ?? [];
  check(jsonEqual(discrepancies.map((item) => item.id), EXPECTED_DISCREPANCY_IDS), "source discrepancy identities or order changed", errors);
  check(discrepancies.every((item) => (item.sourceLocatorIds ?? []).every((id) => locatorById.has(id))), "source discrepancy references an unknown locator", errors);
  check(discrepancies.find((item) => item.id === "glut7-count-conflict")?.sourceValues?.some((value) => /Glut7 = 104/.test(value)), "Glut7 discrepancy must retain checksum-pinned value 104", errors);
  check(discrepancies.find((item) => item.id === "glut7-count-conflict")?.sourceValues?.some((value) => /Glut7 = 105/.test(value)), "Glut7 discrepancy must retain Supplementary Figure 2 legend value 105", errors);
  check(/Do not harmonize/i.test(discrepancies.find((item) => item.id === "library-platform-conflict")?.projectDecision ?? ""), "platform discrepancy must remain unharmonized", errors);
  check(/Do not infer donor-sex denominators/i.test(discrepancies.find((item) => item.id === "sex-code-comment-conflict")?.projectDecision ?? ""), "sex-code discrepancy must prohibit donor inference", errors);

  const rules = taxonomy.identificationRules ?? [];
  const ruleIds = rules.map((rule) => rule.id);
  check(rules.length === 31 && new Set(ruleIds).size === 31, "identification rules must retain 31 unique Table 5 rows", errors);
  check(sha256Json(rules) === EXPECTED_RULES_SHA256, "signed Table 5 identification rules or fine cell locators drifted", errors);
  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];
    const row = index + 5;
    check(rule.id === `haring-2018:table5-row-${row}`, `Table 5 rule order/identity changed at row ${row}`, errors);
    check(rule.staining?.locator?.cell === `B${row}` && rule.rawCombination?.locator?.cell === `C${row}` && rule.sourceClusterName?.locator?.cell === `D${row}`, `Table 5 row ${row} must retain fine B/C/D cell locators`, errors);
    const reconstructed = (rule.components ?? []).map((item) => `${item.polarity === "positive" ? "+" : "-"}${item.gene}`).join(",");
    check(reconstructed === rule.rawCombination?.value, `Table 5 row ${row} positive/negative marker signs do not reproduce the raw combination`, errors);
    check((rule.targetProfileIds ?? []).every((id) => EXPECTED_LABELS.includes(id.replace("haring-2018:GSE103840:", ""))), `Table 5 row ${row} references an unknown source-local profile`, errors);
  }

  const profiles = taxonomy.profiles ?? [];
  const observedLabels = profiles.map((profile) => profile.sourceLocalLabel);
  check(jsonEqual(observedLabels, EXPECTED_LABELS), "profile order or exact Glut1-15/Gaba1-15 labels changed", errors);
  check(new Set(profiles.map((profile) => profile.id)).size === 30, "profile IDs must be unique", errors);
  check(jsonEqual(profiles.map((profile) => profile.samplingCount?.value), EXPECTED_COUNTS), "exact 30-profile Table 4 count vector changed", errors);
  check(profiles.reduce((sum, profile) => sum + (profile.samplingCount?.value ?? 0), 0) === 1545, "profile cell counts must sum to 1,545", errors);
  check(sha256Json(profiles.map((profile) => profile.specificMarkerSummary)) === EXPECTED_MARKERS_SHA256, "Table 8 marker summaries, blank slots, qualifiers, or fine cell locators drifted", errors);
  check(sha256Json(profiles.map((profile) => profile.barcodeMetadataSummary)) === EXPECTED_BARCODE_SUMMARIES_SHA256, "per-profile matrix barcode metadata aggregates drifted", errors);

  const aggregateAgeCounts = new Map();
  const aggregateSex = { "0": 0, "1": 0 };
  const aggregateStrain = { C57bl6: 0, "vGat-Cre-tdTomato": 0, "vGlut2-eGFP": 0 };
  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];
    const label = EXPECTED_LABELS[index];
    const expectedTable8Label = label.startsWith("Gaba") ? label.replace("Gaba", "GABA") : label;
    const table4Column = excelColumn(index + 2);
    const markerRow = EXPECTED_TABLE8_ROWS[index];
    check(profile.id === `haring-2018:GSE103840:${label}` && profile.profileOrdinal === index + 1, `${label} ID or ordinal changed`, errors);
    check(profile.table8SourceLocalLabel === expectedTable8Label, `${label} Table 8 source label changed`, errors);
    check(profile.regionClass === "dorsal", `${label} must remain dorsal`, errors);
    check(profile.transmitterClass === (index < 15 ? "excitatory" : "inhibitory"), `${label} transmitter class changed`, errors);
    check(profile.molecularClass === (index < 15 ? "glutamatergic" : "GABAergic"), `${label} molecular class changed`, errors);
    check(profile.interneuronIdentityStatus === "unresolved_between_local_interneuron_and_projection_neuron", `${label} must not be promoted to a confirmed local interneuron`, errors);
    check(profile.samplingCount?.unit === "cells" && profile.samplingCount?.interpretation === "sampling_count_only", `${label} sampling count must remain cells-unit and sampling-only`, errors);
    check(profile.samplingCount?.sourceLabelLocator?.cell === `${table4Column}1` && profile.samplingCount?.sourceCountLocator?.cell === `${table4Column}2`, `${label} Table 4 label/count fine locators changed`, errors);
    check(jsonEqual(profile.identificationRuleIds, EXPECTED_RULE_TARGET_ROWS[label].map((row) => `haring-2018:table5-row-${row}`)), `${label} identification-rule references changed`, errors);
    for (const ruleId of profile.identificationRuleIds ?? []) {
      const rule = rules.find((candidate) => candidate.id === ruleId);
      check(Boolean(rule) && rule.targetProfileIds?.includes(profile.id), `${label} identification-rule reference is not reciprocal`, errors);
    }

    const markers = profile.specificMarkerSummary ?? {};
    check(markers.sourceTableLabel?.value === expectedTable8Label && markers.sourceTableLabel?.locator?.cell === `C${markerRow}`, `${label} Table 8 label or C-cell locator changed`, errors);
    check(markers.mainMarker?.locator?.cell === `D${markerRow}`, `${label} main marker must retain its exact D-cell locator`, errors);
    check(markers.coMarker1 === null || markers.coMarker1?.locator?.cell === `E${markerRow}`, `${label} co-marker 1 must retain its exact E-cell locator or source blank`, errors);
    check(markers.coMarker2 === null || markers.coMarker2?.locator?.cell === `F${markerRow}`, `${label} co-marker 2 must retain its exact F-cell locator or source blank`, errors);
    for (const marker of [markers.mainMarker, markers.coMarker1, markers.coMarker2].filter(Boolean)) {
      const expectedRaw = marker.qualifier === null ? marker.gene : `${marker.gene} (${marker.qualifier})`;
      check(marker.raw === expectedRaw, `${label} marker raw text and qualifier disagree`, errors);
    }

    const summary = profile.barcodeMetadataSummary ?? {};
    check(summary.standardName === label, `${label} barcode standard name changed`, errors);
    check(summary.rawClusterName === EXPECTED_RAW_CLUSTERS[index], `${label} deposited raw cluster name changed`, errors);
    check(summary.cellCount === EXPECTED_COUNTS[index] && summary.cellCount === profile.samplingCount?.value, `${label} barcode count must equal its Table 4 sampling count`, errors);
    const ageCounts = summary.ageDays?.countsByAge ?? [];
    check(ageCounts.length > 0 && ageCounts.every((item, ageIndex) => ageIndex === 0 || item.ageDays > ageCounts[ageIndex - 1].ageDays), `${label} age counts must be strictly age-sorted`, errors);
    check(ageCounts.reduce((sum, item) => sum + item.count, 0) === summary.cellCount, `${label} age cell counts must sum to its profile count`, errors);
    check(summary.ageDays?.minimum === ageCounts[0]?.ageDays && summary.ageDays?.maximum === ageCounts.at(-1)?.ageDays, `${label} age min/max must match its deposited age strata`, errors);
    check((summary.sexCodeCounts?.["0"] ?? 0) + (summary.sexCodeCounts?.["1"] ?? 0) === summary.cellCount, `${label} deposited sex-code cell counts must sum to its profile count`, errors);
    check(/not independent-animal sex denominators/i.test(summary.sexCodeCounts?.interpretationBoundary ?? ""), `${label} sex codes must retain the cell-versus-animal boundary`, errors);
    check((summary.strainCellCounts?.C57bl6 ?? 0) + (summary.strainCellCounts?.["vGat-Cre-tdTomato"] ?? 0) + (summary.strainCellCounts?.["vGlut2-eGFP"] ?? 0) === summary.cellCount, `${label} strain cell counts must sum to its profile count`, errors);
    check(jsonEqual(summary.sourceLocatorIds, ["geo-processed-matrix"]), `${label} barcode aggregates must cite only the pinned matrix locator`, errors);
    if (label === "Gaba1") check(summary.rawClusterName === "Glut_Gal" && /retained without correction/i.test(summary.rawClusterNameContext ?? ""), "Gaba1 must retain the deposited Glut_Gal raw-cluster anomaly without correction", errors);
    check(jsonEqual(profile.missingEvidence, EXPECTED_MISSING_EVIDENCE), `${label} must retain every fine missing-evidence axis`, errors);
    for (const locatorId of profile.fieldLocatorIds ?? []) check(locatorById.has(locatorId), `${label} references unknown source locator ${locatorId}`, errors);

    for (const item of ageCounts) aggregateAgeCounts.set(item.ageDays, (aggregateAgeCounts.get(item.ageDays) ?? 0) + item.count);
    aggregateSex["0"] += summary.sexCodeCounts?.["0"] ?? 0;
    aggregateSex["1"] += summary.sexCodeCounts?.["1"] ?? 0;
    aggregateStrain.C57bl6 += summary.strainCellCounts?.C57bl6 ?? 0;
    aggregateStrain["vGat-Cre-tdTomato"] += summary.strainCellCounts?.["vGat-Cre-tdTomato"] ?? 0;
    aggregateStrain["vGlut2-eGFP"] += summary.strainCellCounts?.["vGlut2-eGFP"] ?? 0;
  }
  check(Math.min(...aggregateAgeCounts.keys()) === 17 && Math.max(...aggregateAgeCounts.keys()) === 28, "per-profile age summaries must span P17-P28", errors);
  check(jsonEqual(aggregateSex, { "0": 1490, "1": 55 }), "per-profile deposited sex-code aggregates must reconcile to 1,490/55", errors);
  check(jsonEqual(aggregateStrain, { C57bl6: 637, "vGat-Cre-tdTomato": 537, "vGlut2-eGFP": 371 }), "per-profile strain aggregates must reconcile to 637/537/371", errors);
  check(jsonEqual(taxonomy.globalMissingEvidence, EXPECTED_MISSING_EVIDENCE), "global fine missing-evidence axes changed", errors);

  const spatial = taxonomy.spatialEvidence ?? {};
  check(spatial.sourceAnimalCount === 2 && spatial.sectionCount === 6, "population-level spatial evidence must retain 2 animals and 6 sections", errors);
  check(spatial.exactCellCoordinatesAvailable === false && spatial.atlasRegistrationAvailable === false && spatial.sameCellTranscriptSpatialLinkAvailable === false, "population spatial evidence must not acquire coordinates, registration, or same-cell linkage", errors);
  check(/cannot be converted into exact cell coordinates/i.test(spatial.interpretationBoundary ?? ""), "spatial evidence must retain its no-coordinate boundary", errors);

  check(hasBoundary(taxonomy.hardBoundaries, /exact cross-source identity count remains zero/i), "hard boundaries must prohibit exact cross-source identity", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /not exact xyz coordinates/i), "hard boundaries must prohibit promotion of population maps to xyz", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /remain unbundled/i), "hard boundaries must keep source objects unbundled", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /17-28 days.+P17-P28.+3-4 weeks/i), "hard boundaries must retain deposited ages, conventional P17-P28 normalization, and source age text", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /No adult, juvenile, or young-adult category is source-asserted/i), "hard boundaries must prohibit an unsupported categorical life-stage label", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /Four source discrepancies remain visible/i), "hard boundaries must keep the four source discrepancies visible", errors);

  if (errors.length) throw new Error(`Häring dorsal-horn source taxonomy validation failed:\n${errors.map((item) => `- ${item}`).join("\n")}`);
  return {
    releaseId: taxonomy.releaseId,
    profileCount: profiles.length,
    excitatoryProfileCount: profiles.filter((profile) => profile.transmitterClass === "excitatory").length,
    inhibitoryProfileCount: profiles.filter((profile) => profile.transmitterClass === "inhibitory").length,
    profileSamplingCountSum: profiles.reduce((sum, profile) => sum + profile.samplingCount.value, 0),
    sourceAnimalCount: sampleFrame.sourceAnimalCount,
    geoCellAccessionCount: sampleFrame.geoCellAccessionCount,
    exactClusterCellAssignmentAvailable: scope.exactClusterCellAssignmentAvailable,
    projectConfirmedLocalInterneuronProfileCount: scope.projectConfirmedLocalInterneuronProfileCount,
    exactCrossSourceIdentityCount: scope.exactCrossSourceIdentityCount,
    projectRegistrationCount: scope.projectRegistrationCount,
  };
}

export async function validateHaringDorsalHornSourceTaxonomyFile() {
  const taxonomy = JSON.parse(await readFile(TAXONOMY_URL, "utf8"));
  return validateHaringDorsalHornSourceTaxonomy(taxonomy);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const result = await validateHaringDorsalHornSourceTaxonomyFile();
    console.log(`Häring dorsal-horn source taxonomy validation passed: ${result.profileCount} profiles / ${result.profileSamplingCountSum} cells`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
