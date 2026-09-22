#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateHaringDorsalHornSourceTaxonomy } from "../scripts/validate-haring-dorsal-horn-source-taxonomy-0.1.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_PATH = resolve(PROJECT_ROOT, "data/haring-dorsal-horn-source-taxonomy-0.1.json");

export const HARING_SOURCE_OBJECT_RECEIPTS = Object.freeze({
  countMatrix: Object.freeze({
    objectId: "GSE103840_MOLECULE_COUNTS",
    fileName: "GSE103840_molecule_counts.xlsx",
    bytes: 123463759,
    sha256: "0b4bbd1bb5ef1e80cfdf286761cf697183a8e6f11ca25c901ff4841ddfaf63de",
  }),
  supplementaryTable4: Object.freeze({
    objectId: "HARING-2018-MOESM6",
    fileName: "41593_2018_141_MOESM6_ESM.xlsx",
    bytes: 9583,
    sha256: "a8c723ea7d7a3baef40fad0ef6395f027bc2932c94c9e43791fa7a7ea59e2f00",
  }),
  supplementaryTable5: Object.freeze({
    objectId: "HARING-2018-MOESM7",
    fileName: "41593_2018_141_MOESM7_ESM.xlsx",
    bytes: 9858,
    sha256: "c29bf5371b91a492fc454a210d9b927702de50e4aa94a3d07bde2c52aa0f4669",
  }),
  supplementaryTable8: Object.freeze({
    objectId: "HARING-2018-MOESM10",
    fileName: "41593_2018_141_MOESM10_ESM.xlsx",
    bytes: 57844,
    sha256: "80a4b0d803adf88f5fcec191bc4d03f5eba182d235f364d96f50d84ece525fc8",
  }),
  supplementaryPdf: Object.freeze({
    objectId: "HARING-2018-MOESM1",
    fileName: "41593_2018_141_MOESM1_ESM.pdf",
    bytes: 3272419,
    sha256: "00b340c16deead3627418c7a903e359589efad35870c565a15e3962f6bf951c9",
  }),
});

export const HARING_CLUSTER_COUNTS = Object.freeze([
  32, 34, 34, 34, 24, 75, 104, 77, 34, 129, 61, 35, 38, 34, 22,
  18, 87, 145, 11, 19, 51, 39, 67, 85, 66, 48, 56, 34, 41, 11,
]);

const IDENTIFICATION_RULE_ROWS = Object.freeze([
  [5, "Glu1", "+Maf,+Cck,-Cpne4", "Glut1-Cck-Maf", ["Glut1"]],
  [6, "Glu1", "-Maf,+Cck,+Cpne4", "Glut2-Cck-Cpne4", ["Glut2"]],
  [7, "Glu2", "+Trh,+Cck,-Cpne4", "Glut3-Cck-Trh", ["Glut3"]],
  [8, "Glu3", "+Nts,+Slc17a6,-Tac2", "Glut4-Nts", ["Glut4"]],
  [9, "Glu4", "-Nmu,+Sst,+Tac2", "Glut5-Tac2-3", ["Glut5"]],
  [10, "Glu4", "+Nmu,+Sst,+Tac2", "Glut6-7-Tac2-1-2", ["Glut6", "Glut7"]],
  [11, "Glu5", "-Npff,+Reln,+Nmur2", "Glut8-Reln-Nmur2", ["Glut8"]],
  [12, "Glu5", "+Npff,+Reln,-Nmur2", "Glut9-Reln-Npff", ["Glut9"]],
  [13, "Glu6", "-Lamp5,+Slc17a6,+Tac1", "Glut10-Tac1-2", ["Glut10"]],
  [14, "Glu6", "+Lamp5,+Slc17a6,+Tac1", "Glut11-Tac1-1", ["Glut11"]],
  [15, "Glu7", "+Qrfpr,+Ecel1,+Slc17a6", "alt_Glut12-Qrfpr", ["Glut12"]],
  [16, "Glu7", "+Qrfpr,-Ecel1,+Slc17a6", "Glut12-Qrfpr", ["Glut12"]],
  [17, "Glu8", "+Elavl4,-Meis2,+Slc17a6", "alt_Glut13-Elavl4", ["Glut13"]],
  [18, "Glu9", "+Elavl4,-Lypd1,+Slc17a6", "Glut13-Elavl4", ["Glut13"]],
  [19, "Glu8", "+Elavl4,+Meis2,+Slc17a6", "Glut14-Elavl4-Meis2", ["Glut14"]],
  [20, "Glu9", "+Elavl4,+Lypd1,+Slc17a6", "Glut15-Elavl4-Lypd1", ["Glut15"]],
  [21, "GAB1", "+Slc17a6,+Gad1,+Gal", "GABA1-Glut-Gal", ["Gaba1"]],
  [22, "GAB2", "+Pnoc,-Rspo3,+Gal", "GABA2-Gal-Pnoc", ["Gaba2"]],
  [23, "GAB2", "-Pnoc,+Rspo3,+Gal", "GABA3-Gal-Rspo3", ["Gaba3"]],
  [24, "GAB3", "-Slc17a6,+Gad1,+Tac2", "GABA4-Tac2", ["Gaba4"]],
  [25, "GAB4", "-Qrfpr,+Npy,-Crabp1", "GABA5-Npy-only", ["Gaba5"]],
  [26, "GAB4", "+Qrfpr,+Npy,-Crabp1", "GABA6-Npy-Qqrfpr", ["Gaba6"]],
  [27, "GAB4", "-Qrfpr,+Npy,+Crabp1", "GABA7-Npy-Crabp1", ["Gaba7"]],
  [28, "GAB5", "-Tac1,+Gad1,+Calb2", "GABA8-Calb2-Krt17", ["Gaba8"]],
  [29, "GAB5", "+Tac1,+Gad1,+Calb2", "GABA9-Calb2-Tac1", ["Gaba9"]],
  [30, "GAB6", "+Cplx1,+Adamts5,-Calb2", "GABA10-Cplx1-Adamts5", ["Gaba10"]],
  [31, "GAB6", "+Cplx1,-Adamts5,+Calb2", "GABA11-Cplx1-Calb2", ["Gaba11"]],
  [32, "GAB7", "+Sorcs3,+Gad2,+Cplx1", "GABA12-Cplx1-Sorcs3", ["Gaba12"]],
  [33, "GAB8", "+Sst,+Gad2", "GABA13-Sst", ["Gaba13"]],
  [34, "GAB9", "-Spp1,-Npy,+Crabp1", "GABA14-Crabp1", ["Gaba14"]],
  [35, "GAB9", "+Spp1,-Npy,+Crabp1", "GABA15-Crabp1-Spp1", ["Gaba15"]],
]);

const SPECIFIC_MARKER_ROWS = Object.freeze([
  ["Glut1", 4, "Maf", "Cck", null],
  ["Glut2", 5, "Cpne4", null, null],
  ["Glut3", 6, "Trh", null, null],
  ["Glut4", 7, "Nts", null, null],
  ["Glut5", 8, "Tac2 (high)", null, "Slc17a6"],
  ["Glut6", 9, "Tac2 (high)", "Nmu", null],
  ["Glut7", 10, "Tac2 (low)", "Nmu", null],
  ["Glut8", 11, "Nmur2", "Reln", null],
  ["Glut9", 12, "Npff", null, null],
  ["Glut10", 13, "Tac1", null, "Slc17a6"],
  ["Glut11", 14, "Tac1", "Lamp5", "Slc17a6"],
  ["Glut12", 15, "Qrfpr", "Ecel1", "Slc17a6"],
  ["Glut13", 16, "Elavl4", null, "Slc17a6"],
  ["Glut14", 17, "Meis2", "Elavl4", "Slc17a6"],
  ["Glut15", 18, "Lypd1", "Elavl4", "Slc17a6"],
  ["Gaba1", 21, "Gal", "Slc17a6", null],
  ["Gaba2", 22, "Gal", null, null],
  ["Gaba3", 23, "Gal", "Rspo3", null],
  ["Gaba4", 24, "Tac2", "Slc32a1", null],
  ["Gaba5", 25, "Npy", null, "Ecel1"],
  ["Gaba6", 26, "Npy", "Qrfpr", "Ecel1"],
  ["Gaba7", 27, "Npy", "Crabp1", "Ecel1"],
  ["Gaba8", 28, "Krt17", "Calb2", "Slc32a1"],
  ["Gaba9", 29, "Tac1", "Calb2", "Slc32a1"],
  ["Gaba10", 30, "Adamts5", "Cplx1", null],
  ["Gaba11", 31, "Calb2", "Cplx1", null],
  ["Gaba12", 32, "Sorcs3", "Cplx1", null],
  ["Gaba13", 33, "Sst", "Cplx1", "Slc32a1"],
  ["Gaba14", 34, "Crabp1", "Cplx1", null],
  ["Gaba15", 35, "Crabp1", "Spp1", "Cplx1"],
]);

// label, deposited raw cluster, age-day count string, sex code 0, sex code 1,
// C57bl6, vGat-Cre-tdTomato, vGlut2-eGFP. All denominators are cell columns.
const BARCODE_METADATA_ROWS = Object.freeze([
  ["Glut1", "Glut_Cck_Maf", "18:2,19:1,20:5,22:2,23:2,24:1,25:10,26:3,27:4,28:2", 30, 2, 17, 0, 15],
  ["Glut2", "Glut_Cck_Cpne4", "18:4,19:1,20:4,21:5,22:1,23:2,24:1,25:9,26:3,27:4", 34, 0, 21, 0, 13],
  ["Glut3", "Glut_Cck_Trh", "18:1,19:1,20:2,21:6,22:3,23:1,24:1,25:11,26:2,27:5,28:1", 32, 2, 22, 0, 12],
  ["Glut4", "Glut_Nts", "18:1,19:5,20:4,21:2,22:1,23:2,24:2,25:10,26:3,27:3,28:1", 34, 0, 20, 0, 14],
  ["Glut5", "Glut_Tac2_3", "18:2,19:2,20:1,23:3,24:4,25:9,26:1,27:1,28:1", 24, 0, 8, 0, 16],
  ["Glut6", "Glut_Tac2_2", "18:2,19:3,20:5,22:4,23:12,24:2,25:40,26:2,27:3,28:2", 72, 3, 19, 0, 56],
  ["Glut7", "Glut_Tac2_1", "18:2,19:3,20:5,22:3,23:9,24:2,25:71,26:3,27:4,28:2", 101, 3, 21, 0, 83],
  ["Glut8", "Glut_Reln_Nmur2", "18:6,19:3,20:2,21:4,22:8,23:4,24:1,25:35,26:9,27:4,28:1", 70, 7, 35, 0, 42],
  ["Glut9", "Glut_Reln_Npff", "18:1,19:5,20:4,21:1,23:1,25:21,26:1", 34, 0, 11, 0, 23],
  ["Glut10", "Glut_Tac1_2", "18:6,19:16,20:22,21:5,22:11,23:4,24:3,25:34,26:10,27:13,28:5", 120, 9, 87, 0, 42],
  ["Glut11", "Glut_Tac1_1", "18:2,19:4,20:14,21:7,22:3,23:4,24:1,25:17,26:3,27:5,28:1", 60, 1, 39, 0, 22],
  ["Glut12", "Glut_Qrfpr", "18:6,19:7,20:3,21:3,22:3,23:2,25:1,26:1,27:5,28:4", 33, 2, 32, 0, 3],
  ["Glut13", "Glut_Elavl4", "18:3,19:2,20:6,21:3,22:4,23:1,24:1,25:10,26:3,27:3,28:2", 34, 4, 25, 0, 13],
  ["Glut14", "Glut_Elavl4_Meis2", "18:3,19:2,20:3,21:4,22:2,23:2,24:2,25:6,26:5,27:5", 33, 1, 24, 0, 10],
  ["Glut15", "Glut_Elavl4_Lypd1", "17:1,18:2,19:3,20:9,21:1,22:2,24:1,25:1,26:1,27:1", 21, 1, 20, 1, 1],
  ["Gaba1", "Glut_Gal", "18:3,19:2,20:5,21:2,22:1,23:1,24:1,26:1,27:2", 17, 1, 17, 0, 1],
  ["Gaba2", "GABA_Gal_Pnoc", "17:12,18:29,19:5,20:9,21:2,22:6,24:15,26:3,27:6", 83, 4, 35, 52, 0],
  ["Gaba3", "GABA_Gal_Rspo3", "17:28,18:59,19:8,20:3,21:8,22:4,24:26,26:6,27:3", 144, 1, 36, 108, 1],
  ["Gaba4", "GABA_Tac2", "17:2,18:2,19:2,22:2,24:2,28:1", 10, 1, 5, 6, 0],
  ["Gaba5", "GABA_Npy_only", "17:5,18:5,21:1,22:2,24:4,26:1,27:1", 17, 2, 5, 14, 0],
  ["Gaba6", "GABA_Npy_Qrfpr", "17:10,18:17,19:1,20:9,21:1,22:1,24:10,27:2", 51, 0, 14, 37, 0],
  ["Gaba7", "GABA_Npy_Crabp1", "17:7,18:10,19:1,20:1,24:12,26:3,27:4,28:1", 39, 0, 8, 29, 2],
  ["Gaba8", "GABA_Calb2_Krt17", "17:20,18:26,19:2,20:1,21:2,22:2,24:9,26:3,27:2", 65, 2, 12, 55, 0],
  ["Gaba9", "GABA_Calb2_Tac1", "17:21,18:26,19:4,20:4,21:1,22:1,24:21,26:2,27:4,28:1", 84, 1, 17, 67, 1],
  ["Gaba10", "GABA_Cplx1_Adamts5", "17:14,18:13,20:3,21:1,22:2,24:18,26:5,27:9,28:1", 64, 2, 22, 43, 1],
  ["Gaba11", "GABA_Cplx1_Calb2", "17:5,18:10,19:3,20:8,21:1,22:2,24:12,26:3,27:4", 46, 2, 21, 27, 0],
  ["Gaba12", "GABA_Cplx1_Sorcs3", "17:17,18:19,20:5,21:1,22:1,24:9,27:3,28:1", 55, 1, 13, 43, 0],
  ["Gaba13", "GABA_Cplx1_Sst", "17:9,18:10,19:2,20:4,22:3,24:5,27:1", 32, 2, 10, 24, 0],
  ["Gaba14", "GABA_Crabp1", "17:9,18:9,19:2,20:7,22:1,24:8,26:3,27:2", 40, 1, 15, 26, 0],
  ["Gaba15", "GABA_Crabp1_Spp1", "17:3,18:3,19:1,20:1,21:1,24:1,27:1", 11, 0, 6, 5, 0],
]);

const MISSING_EVIDENCE = Object.freeze({
  cellCoordinates: "not_available",
  morphology: "not_measured",
  axonTrajectory: "not_measured",
  electrophysiology: "not_measured",
  projectionTargets: "not_measured",
  synapticConnectivity: "not_measured",
  sciContext: "not_measured",
  sameCellCrossModalLinks: "not_established",
  atlasTransform: "not_established",
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
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

function cellLocator(sourceObjectId, sourceLocatorId, sheet, cell) {
  return { sourceObjectId, sourceLocatorId, sheet, cell };
}

function parseMarker(raw, row, column) {
  if (raw === null) return null;
  const match = /^([A-Za-z0-9]+)(?: \((high|low)\))?$/.exec(raw);
  check(Boolean(match), `unsupported marker token ${raw}`);
  return {
    raw,
    gene: match[1],
    qualifier: match[2] ?? null,
    locator: cellLocator("HARING-2018-MOESM10", "supplement-table-8-specific-markers", "Specific Markers ", `${column}${row}`),
  };
}

function parseCombination(raw) {
  return raw.split(",").map((token) => {
    const match = /^([+-])([A-Za-z0-9]+)$/.exec(token);
    check(Boolean(match), `unsupported identification token ${token}`);
    return { polarity: match[1] === "+" ? "positive" : "negative", gene: match[2] };
  });
}

function makeBarcodeMetadataSummary(label) {
  const row = BARCODE_METADATA_ROWS.find(([candidate]) => candidate === label);
  check(Boolean(row), `missing barcode metadata summary for ${label}`);
  const [, rawClusterName, ageCountsText, sexCode0, sexCode1, c57bl6, vGat, vGlut2] = row;
  const countsByAge = ageCountsText.split(",").map((entry) => {
    const [ageDays, count] = entry.split(":").map(Number);
    return { ageDays, count };
  });
  return {
    authority: "checksum_pinned_matrix_cell_column_aggregate",
    rawClusterName,
    rawClusterNameContext: label === "Gaba1"
      ? "The deposited raw cluster string is Glut_Gal while the deposited standard_names value is Gaba1; both are retained without correction or biological reinterpretation."
      : "deposited_raw_cluster_name",
    standardName: label,
    cellCount: countsByAge.reduce((sum, item) => sum + item.count, 0),
    ageDays: {
      minimum: countsByAge[0].ageDays,
      maximum: countsByAge.at(-1).ageDays,
      countsByAge,
      denominatorUnit: "cell_columns",
    },
    sexCodeCounts: {
      "0": sexCode0,
      "1": sexCode1,
      depositedCodeHeader: "sex(female=1)",
      denominatorUnit: "cell_columns",
      interpretationBoundary: "Deposited cell-column codes are retained as 0 and 1; these counts are not independent-animal sex denominators.",
    },
    strainCellCounts: {
      C57bl6: c57bl6,
      "vGat-Cre-tdTomato": vGat,
      "vGlut2-eGFP": vGlut2,
      denominatorUnit: "cell_columns",
    },
    sourceLocatorIds: ["geo-processed-matrix"],
  };
}

function makeIdentificationRules() {
  return IDENTIFICATION_RULE_ROWS.map(([row, staining, rawCombination, sourceClusterName, labels]) => ({
    id: `haring-2018:table5-row-${row}`,
    staining: {
      value: staining,
      locator: cellLocator("HARING-2018-MOESM7", "supplement-table-5-identification-rules", "celltypes_combi_(+-_Arc)", `B${row}`),
    },
    rawCombination: {
      value: rawCombination,
      locator: cellLocator("HARING-2018-MOESM7", "supplement-table-5-identification-rules", "celltypes_combi_(+-_Arc)", `C${row}`),
    },
    components: parseCombination(rawCombination),
    sourceClusterName: {
      value: sourceClusterName,
      locator: cellLocator("HARING-2018-MOESM7", "supplement-table-5-identification-rules", "celltypes_combi_(+-_Arc)", `D${row}`),
    },
    targetProfileIds: labels.map((label) => `haring-2018:GSE103840:${label}`),
    targetMappingStatus: labels.length > 1
      ? "source_table_combined_rule"
      : sourceClusterName.startsWith("alt_")
        ? "source_table_alternative_rule"
        : "source_table_direct_rule",
  }));
}

function makeProfiles(identificationRules) {
  const ruleIdsByProfile = new Map();
  for (const rule of identificationRules) {
    for (const profileId of rule.targetProfileIds) {
      const ids = ruleIdsByProfile.get(profileId) ?? [];
      ids.push(rule.id);
      ruleIdsByProfile.set(profileId, ids);
    }
  }

  return SPECIFIC_MARKER_ROWS.map(([label, markerRow, main, co1, co2], index) => {
    const excitatory = label.startsWith("Glut");
    const table4Column = excelColumn(index + 2);
    const table8Label = excitatory ? label : label.replace("Gaba", "GABA");
    return {
      id: `haring-2018:GSE103840:${label}`,
      sourceLocalLabel: label,
      table8SourceLocalLabel: table8Label,
      profileOrdinal: index + 1,
      regionClass: "dorsal",
      transmitterClass: excitatory ? "excitatory" : "inhibitory",
      molecularClass: excitatory ? "glutamatergic" : "GABAergic",
      projectUseClass: "source_local_dorsal_neuron_type_context",
      interneuronIdentityStatus: "unresolved_between_local_interneuron_and_projection_neuron",
      samplingCount: {
        value: HARING_CLUSTER_COUNTS[index],
        unit: "cells",
        interpretation: "sampling_count_only",
        sourceLabelLocator: cellLocator("HARING-2018-MOESM6", "supplement-table-4-cluster-counts", "Cluster Size+MolCount", `${table4Column}1`),
        sourceCountLocator: cellLocator("HARING-2018-MOESM6", "supplement-table-4-cluster-counts", "Cluster Size+MolCount", `${table4Column}2`),
      },
      barcodeMetadataSummary: makeBarcodeMetadataSummary(label),
      identificationRuleIds: ruleIdsByProfile.get(`haring-2018:GSE103840:${label}`) ?? [],
      specificMarkerSummary: {
        sourceTableLabel: {
          value: table8Label,
          locator: cellLocator("HARING-2018-MOESM10", "supplement-table-8-specific-markers", "Specific Markers ", `C${markerRow}`),
        },
        mainMarker: parseMarker(main, markerRow, "D"),
        coMarker1: parseMarker(co1, markerRow, "E"),
        coMarker2: parseMarker(co2, markerRow, "F"),
      },
      spatialContext: {
        status: "source_reported_population_level_only",
        sampledRegion: "cervical spinal cord",
        sourceAnimalCount: 2,
        sectionCount: 6,
        exactCellCoordinatesAvailable: false,
        atlasRegistrationAvailable: false,
        sourceLocatorIds: ["supplement-figure-s7-spatial-context"],
        interpretationBoundary: "The source reports type-level cervical density maps across two animals and six sections; this is not an xyz coordinate, a same-cell localization, or a transform into the project atlas.",
      },
      missingEvidence: { ...MISSING_EVIDENCE },
      fieldLocatorIds: [
        "supplement-table-4-cluster-counts",
        "supplement-table-5-identification-rules",
        "supplement-table-8-specific-markers",
        "supplement-figure-s7-spatial-context",
        "study-missing-evidence-axes",
      ],
    };
  });
}

function makeSupplementaryObject(receiptKey, tableNumber, downloadUrl) {
  const receipt = HARING_SOURCE_OBJECT_RECEIPTS[receiptKey];
  return {
    id: receipt.objectId,
    tableNumber,
    fileName: receipt.fileName,
    downloadUrl,
    bytes: receipt.bytes,
    sha256: receipt.sha256,
    sourceFileBundled: false,
    derivedFactualMetadataBundled: true,
    reuseStatus: "PUBLIC_ACCESS_REUSE_NOT_ASSUMED",
    rightsBoundary: "The supplementary object is publicly downloadable, but public access is not treated as permission to redistribute the source file. This release stores only checksum-pinned factual transcriptions and locators.",
  };
}

function makeTaxonomy() {
  const identificationRules = makeIdentificationRules();
  const profiles = makeProfiles(identificationRules);
  return {
    releaseId: "ohri-haring-dorsal-horn-source-taxonomy-0.1.0",
    schemaVersion: "0.1.0",
    releaseDate: "2026-08-27",
    datasetId: "GSE103840",
    coordinateAuthority: "SOURCE_LOCAL_TYPE_ONLY",
    source: {
      publication: {
        id: "HARING-2018",
        citation: "Häring M, Zeisel A, Hochgerner H, et al. Neuronal atlas of the dorsal horn defines its architecture and links sensory input to transcriptional cell types. Nature Neuroscience. 2018;21:869-880.",
        doi: "10.1038/s41593-018-0141-1",
        pmid: "29686262",
        articleUrl: "https://www.nature.com/articles/s41593-018-0141-1",
        reuseStatus: "PUBLIC_ACCESS_REUSE_NOT_ASSUMED",
        rightsBoundary: "Public readability of the article does not establish an asset-level redistribution license for figures or supplementary files. No article image or supplementary source object is bundled in this release.",
      },
      geo: {
        id: "GSE103840",
        accession: "GSE103840",
        sraStudyAccession: "SRP117627",
        bioProjectAccession: "PRJNA407224",
        recordUrl: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE103840",
        overallDesign: "Single-cell RNA sequencing of 1,545 mouse dorsal-horn neurons whose deposited cell-column ages span 17-28 days; GEO/SRA describes the sequencing cohort as 3-4 week mice. Cells were sampled through Vgat-cre;tdTomato-positive FACS, Vglut2-eGFP-positive FACS, and unbiased dorsal-horn dissociation cohorts.",
        sampleFrame: {
          species: "Mus musculus",
          speciesTaxonId: 10090,
          lifeStage: "postnatal P17-P28",
          sourceAgeText: "3-4 week mice",
          lifeStageCategory: null,
          ageNormalization: "P17-P28 is a project conventional normalization of the deposited age(days) values 17-28. The source does not assert an adult, juvenile, or young-adult category for the sequencing cohort.",
          spinalRegion: "dorsal horn",
          sourceAnimalCount: 28,
          selectionCohorts: [
            { id: "vgat-tdtomato-facs", selection: "Vgat-cre;tdTomato-positive FACS", animalCount: 3 },
            { id: "vglut2-egfp-facs", selection: "Vglut2-eGFP-positive FACS", animalCount: 5 },
            { id: "unbiased-dissociation", selection: "unbiased dorsal-horn dissociation", animalCount: 20 },
          ],
          cellSamplingCount: 1545,
          geoCellAccessionCount: 1545,
          geoCellAccessionUnit: "single_cell_accessions",
          biologicalReplicateDenominatorUnit: "source_animals",
          interpretationBoundary: "The 1,545 cells and 1,545 GSM accessions are cell-level sampling units, not 1,545 animals or independent biological replicates; the biological source denominator is 28 animals partitioned 3, 5, and 20 across the reported sampling cohorts.",
        },
        countMatrixAsset: {
          id: HARING_SOURCE_OBJECT_RECEIPTS.countMatrix.objectId,
          fileName: HARING_SOURCE_OBJECT_RECEIPTS.countMatrix.fileName,
          downloadUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE103nnn/GSE103840/suppl/GSE103840_molecule_counts.xlsx",
          bytes: HARING_SOURCE_OBJECT_RECEIPTS.countMatrix.bytes,
          sha256: HARING_SOURCE_OBJECT_RECEIPTS.countMatrix.sha256,
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
          metadataRows: {
            ageDays: 2,
            sexFemaleCode: 3,
            totalMolecules: 4,
            rawClusterName: 5,
            standardName: 6,
            strain: 7,
          },
          ageDaysRange: { minimum: 17, maximum: 28, unit: "days", denominatorUnit: "cell_columns" },
          sexCodeCellCounts: { code0: 1490, code1: 55, codeMeaning: "female=1", denominatorUnit: "cell_columns" },
          strainCellCounts: { C57bl6: 637, vGatCreTdTomato: 537, vGlut2EGfp: 371, denominatorUnit: "cell_columns" },
          exactRawClusterCellAssignmentAvailable: true,
          exactStandardNameCellAssignmentAvailable: true,
          standardLabelCountReconcilesToTable4: true,
          sourceFileBundled: false,
          derivedFactualMetadataBundled: true,
          reuseStatus: "PUBLIC_ACCESS_REUSE_NOT_ASSUMED",
          rightsBoundary: "The processed workbook is publicly downloadable from GEO, but it is not bundled. This release retains only its checksum, active-sheet dimensions, verified metadata-row facts, and derived aggregates; public access is not treated as redistribution permission.",
          interpretationBoundary: "Rows 2 through 7 are cell-column metadata and rows 8 through 24,385 are 24,378 gene rows. Age, deposited sex codes, strain, raw clusters, and standard names are cell-column attributes; their counts must not be promoted to independent-animal denominators.",
        },
      },
      supplementaryObjects: [
        makeSupplementaryObject("supplementaryTable4", 4, "https://static-content.springer.com/esm/art%3A10.1038%2Fs41593-018-0141-1/MediaObjects/41593_2018_141_MOESM6_ESM.xlsx"),
        makeSupplementaryObject("supplementaryTable5", 5, "https://static-content.springer.com/esm/art%3A10.1038%2Fs41593-018-0141-1/MediaObjects/41593_2018_141_MOESM7_ESM.xlsx"),
        makeSupplementaryObject("supplementaryTable8", 8, "https://static-content.springer.com/esm/art%3A10.1038%2Fs41593-018-0141-1/MediaObjects/41593_2018_141_MOESM10_ESM.xlsx"),
        makeSupplementaryObject("supplementaryPdf", null, "https://static-content.springer.com/esm/art%3A10.1038%2Fs41593-018-0141-1/MediaObjects/41593_2018_141_MOESM1_ESM.pdf"),
      ],
    },
    scope: {
      species: "Mus musculus",
      lifeStage: "postnatal P17-P28",
      lifeStageCategory: null,
      condition: "uninjured",
      spinalRegion: "dorsal horn",
      modality: "single-cell RNA sequencing",
      reportedClusterCount: 30,
      displayedProfileCount: 30,
      reportedExcitatoryClusterCount: 15,
      reportedInhibitoryClusterCount: 15,
      sourceReportedCellCount: 1545,
      profileSamplingCountSum: 1545,
      samplingCountInterpretation: "SAMPLING_COUNT_ONLY_NOT_PREVALENCE",
      exactClusterCellAssignmentAvailable: true,
      exactStandardNameCellAssignmentAvailable: true,
      exactCrossSourceIdentityCount: 0,
      projectRegistrationCount: 0,
      projectConfirmedLocalInterneuronProfileCount: 0,
      sourceLocalDorsalNeuronContextCount: 30,
    },
    curationFlow: {
      initialPostQcNeuronCount: 1639,
      excludedCellCount: 94,
      finalCellCount: 1545,
      initialBackspinClusterCount: 43,
      finalTypeCount: 30,
      finalGlutCellCount: 767,
      finalGabaCellCount: 778,
      sourceLocatorIds: ["paper-source-local-taxonomy", "supplement-figure-s2-curation-and-conflicts", "supplement-table-4-cluster-counts", "geo-processed-matrix"],
      interpretationBoundary: "The source reports 1,639 post-QC neurons before final manual curation, 94 source-labelled excluded cells, and 1,545 final cells assigned to 30 types after initial BackSPIN clustering. These are pipeline-stage counts, not independent biological replicates or biological prevalence.",
    },
    sourceDiscrepancies: [
      {
        id: "glut7-count-conflict",
        axis: "final cluster count",
        status: "retained_unresolved_source_conflict",
        sourceValues: ["Checksum-pinned matrix and Supplementary Table 4: Glut7 = 104", "Supplementary Figure 2 legend: Glut7 = 105"],
        projectDecision: "Use 104 because the deposited standard-label assignments and Supplementary Table 4 reconcile exactly to the 1,545-cell final denominator; retain the 105 legend value as a conflict rather than silently repairing it.",
        sourceLocatorIds: ["geo-processed-matrix", "supplement-table-4-cluster-counts", "supplement-figure-s2-curation-and-conflicts"],
      },
      {
        id: "library-platform-conflict",
        axis: "library preparation / processing platform",
        status: "retained_unresolved_source_conflict",
        sourceValues: ["Article, Supplementary Figure 1, workbook title, and author exporter context: Fluidigm C1", "All GEO GSM records: 10X Chromium cellranger pipeline version 1.1"],
        projectDecision: "Do not harmonize the conflicting platform metadata. The adapter retains the source-local taxonomy and matrix facts without assigning one universal platform label to every cell.",
        sourceLocatorIds: ["paper-source-local-taxonomy", "geo-series-record", "supplement-figure-s2-curation-and-conflicts"],
      },
      {
        id: "sex-code-comment-conflict",
        axis: "deposited cell-level sex coding",
        status: "retained_resolved_for_deposited_matrix_only",
        sourceValues: ["Released matrix header and GEO Sex fields: 0 and 1, reconciling to M and F for 1,545 cells", "Author exporter comment: female=1, male=-1, mix=0"],
        projectDecision: "Retain deposited codes 0/1 and their exact captured-cell counts. Do not infer donor-sex denominators, and do not introduce the absent -1 code into the released matrix contract.",
        sourceLocatorIds: ["geo-processed-matrix", "geo-series-record", "supplement-figure-s2-curation-and-conflicts"],
      },
      {
        id: "sra-tissue-summary-conflict",
        axis: "tissue summary wording",
        status: "retained_source_metadata_conflict",
        sourceValues: ["SRA study summary: mouse brain dorsal horn", "Article, GEO sample source, protocol, and workbook context: spinal-cord dorsal horn"],
        projectDecision: "Display spinal-cord dorsal horn as the convergent tissue context while retaining the SRA summary discrepancy. No per-cell spinal level is available.",
        sourceLocatorIds: ["geo-series-record", "paper-source-local-taxonomy", "supplement-figure-s2-curation-and-conflicts"],
      },
    ],
    sourceLocators: [
      {
        id: "geo-series-record",
        sourceObjectId: "GSE103840",
        locator: "NCBI GEO GSE103840/SRA describe 3-4 week Mus musculus dorsal-horn single cells; the pinned matrix age(days) row spans 17-28 and is conventionally normalized here as P17-P28. The source does not assert an adult/juvenile category. The series has 1,545 GSM cell accessions and three reported sampling cohorts.",
        supportsFields: ["datasetId", "sampleFrame", "cellSamplingCount", "geoCellAccessionCount"],
        evidenceStatus: "direct",
      },
      {
        id: "geo-processed-matrix",
        sourceObjectId: "GSE103840_MOLECULE_COUNTS",
        locator: "Checksum-pinned GSE103840_molecule_counts.xlsx active sheet moldata_C1_data_DHneurons_no_an, OOXML dimension A1:BGL24385: metadata rows 2-7, 24,378 gene rows, one cellid column, and 1,545 cell columns with raw-cluster and standard-name assignments.",
        supportsFields: ["countMatrixAsset", "cellSamplingCount", "barcodeMetadataSummary", "exactClusterCellAssignment"],
        evidenceStatus: "direct",
      },
      {
        id: "paper-methods-sample-frame",
        sourceObjectId: "HARING-2018",
        locator: "Häring et al. Methods and Supplementary Figure 2 sampling frame: Vgat-cre;tdTomato-positive FACS from 3 animals, Vglut2-eGFP-positive FACS from 5 animals, and unbiased dorsal-horn dissociation from 20 animals.",
        supportsFields: ["sampleFrame", "sourceAnimalCount", "selectionCohorts"],
        evidenceStatus: "direct",
      },
      {
        id: "paper-source-local-taxonomy",
        sourceObjectId: "HARING-2018",
        locator: "Häring et al. article taxonomy reports 15 excitatory Glut clusters and 15 inhibitory Gaba clusters from 1,545 dorsal-horn cells; the pinned matrix constrains deposited cell-column ages to 17-28 days, conventionally P17-P28.",
        supportsFields: ["reportedClusterCount", "transmitterClass", "sourceLocalLabel"],
        evidenceStatus: "direct",
      },
      {
        id: "supplement-table-4-cluster-counts",
        sourceObjectId: "HARING-2018-MOESM6",
        locator: "Supplementary Table 4, sheet Cluster Size+MolCount: source-local labels in B1:AE1 and exact cell counts in B2:AE2.",
        supportsFields: ["sourceLocalLabel", "samplingCount"],
        evidenceStatus: "direct",
      },
      {
        id: "supplement-table-5-identification-rules",
        sourceObjectId: "HARING-2018-MOESM7",
        locator: "Supplementary Table 5, sheet celltypes_combi_(+-_Arc), cells B5:D35: staining IDs, exact signed marker combinations, and source cluster names used for identification.",
        supportsFields: ["identificationRules", "positiveMarkers", "negativeMarkers"],
        evidenceStatus: "direct",
      },
      {
        id: "supplement-table-8-specific-markers",
        sourceObjectId: "HARING-2018-MOESM10",
        locator: "Supplementary Table 8, sheet Specific Markers : Glut rows C4:F18 and GABA rows C21:F35 provide the source cluster labels, main markers, and two co-marker slots.",
        supportsFields: ["specificMarkerSummary", "mainMarker", "coMarkers"],
        evidenceStatus: "direct",
      },
      {
        id: "supplement-figure-s7-spatial-context",
        sourceObjectId: "HARING-2018-MOESM1",
        locator: "Supplementary Figure 7 reports cervical population-level spatial density mapping using 2 animals and 6 sections; it does not deposit exact xyz coordinates or an atlas transform.",
        supportsFields: ["spatialContext", "cellCoordinates", "atlasTransform"],
        evidenceStatus: "contextual",
      },
      {
        id: "study-missing-evidence-axes",
        sourceObjectId: "HARING-2018",
        locator: "Release-level evidence audit: no exact xyz coordinates, reconstructed morphology or axon, electrophysiology, projection target, synaptic edge, SCI measurement, same-cell cross-modal link, or project-atlas transform is established for any source-local profile.",
        supportsFields: ["missingEvidence", "interneuronIdentityStatus"],
        evidenceStatus: "absence_audit",
      },
      {
        id: "public-access-rights-boundary",
        sourceObjectId: "HARING-2018",
        locator: "Public web access is recorded separately from redistribution permission. The matrix, article images, and supplementary source objects are not bundled; only checksum-pinned derived factual metadata is included.",
        supportsFields: ["rightsBoundary", "sourceFileBundled"],
        evidenceStatus: "rights_boundary",
      },
      {
        id: "supplement-figure-s2-curation-and-conflicts",
        sourceObjectId: "HARING-2018-MOESM1",
        locator: "Supplementary Figure 2 and its legend document initial/final taxonomy curation and the Glut7=105 legend value; this is retained beside the checksum-pinned matrix/Table 4 value 104. Article, GEO/SRA and author-export metadata are compared without silently harmonizing platform, sex-code or tissue-summary discrepancies.",
        supportsFields: ["curationFlow", "sourceDiscrepancies"],
        evidenceStatus: "direct_and_discrepancy_audit",
      },
    ],
    identificationRules,
    spatialEvidence: {
      authority: "source_reported_population_level",
      sampledRegion: "cervical spinal cord",
      sourceAnimalCount: 2,
      sectionCount: 6,
      exactCellCoordinatesAvailable: false,
      atlasRegistrationAvailable: false,
      sameCellTranscriptSpatialLinkAvailable: false,
      sourceLocatorIds: ["supplement-figure-s7-spatial-context"],
      interpretationBoundary: "The cervical maps are population-level type distributions from two animals and six sections. They cannot be converted into exact cell coordinates, same-cell transcript-spatial links, or a project-atlas transform without additional source data and registration evidence.",
    },
    profiles,
    globalMissingEvidence: { ...MISSING_EVIDENCE },
    hardBoundaries: [
      "The thirty records are source-local dorsal-horn molecular neuron types from cells aged 17-28 days (conventionally P17-P28; GEO/SRA source text 3-4 weeks). No adult, juvenile, or young-adult category is source-asserted, and none is promoted to a project-confirmed local interneuron because projection-neuron exclusion is not established per profile.",
      "The exact cross-source identity count remains zero. Source-reported correlations to another taxonomy, including Sathyamurthy classes, are not exact identities and are deferred from this contract.",
      "The 1,545 cells and 1,545 GSM accessions are sampling units, not animals or independent biological replicates; the source-animal denominator remains 28.",
      "Every profile sampling count is transcribed from Supplementary Table 4 and must remain a cells-unit sampling count; it is not a population prevalence estimate.",
      "Signed positive and negative identification markers are retained verbatim from Supplementary Table 5 and must not be reduced to an unsigned marker list.",
      "Supplementary Figure 7 spatial maps are population-level cervical evidence from two animals and six sections, not exact xyz coordinates or atlas-registered cells.",
      "No profile acquires morphology, axon trajectory, electrophysiology, projection targets, synaptic connectivity, SCI context, or same-cell cross-modal links through this transcriptomic contract.",
      "Matrix age, deposited sex-code, strain, raw-cluster, and standard-name values are cell-column metadata; their aggregate counts must not be promoted to independent-animal or donor-level denominators.",
      "All source workbooks, the processed matrix, article imagery, and the supplementary PDF remain unbundled because public access is not treated as redistribution permission.",
      "Table 8 main-marker and co-marker values retain their exact individual cell locators, including blank co-marker slots and the source's high or low qualifier text.",
      "Four source discrepancies remain visible: Glut7 104 versus a 105 legend value, Fluidigm C1 versus GEO 10X metadata, released 0/1 sex codes versus a stale exporter comment, and SRA brain-dorsal-horn wording versus convergent spinal-cord-dorsal-horn sources. None is silently harmonized.",
    ],
  };
}

export async function auditHaringSourceObject(sourcePath, receiptKey) {
  const receipt = HARING_SOURCE_OBJECT_RECEIPTS[receiptKey];
  check(Boolean(receipt), `unknown source receipt ${receiptKey}`);
  check(typeof sourcePath === "string" && sourcePath.length > 0, `${receiptKey} requires a source path`);
  const resolvedPath = resolve(sourcePath);
  const bytes = await readFile(resolvedPath);
  check(bytes.byteLength === receipt.bytes, `${receipt.fileName} byte count changed: expected ${receipt.bytes}, received ${bytes.byteLength}`);
  const observedSha256 = sha256(bytes);
  check(observedSha256 === receipt.sha256, `${receipt.fileName} SHA-256 changed: expected ${receipt.sha256}, received ${observedSha256}`);
  return { receiptKey, objectId: receipt.objectId, sourcePath: resolvedPath, fileName: basename(resolvedPath), bytes: bytes.byteLength, sha256: observedSha256 };
}

export async function buildHaringDorsalHornTaxonomy({ sourceObjectPaths = null } = {}) {
  const taxonomy = makeTaxonomy();
  if (sourceObjectPaths !== null) {
    const expectedKeys = Object.keys(HARING_SOURCE_OBJECT_RECEIPTS);
    check(expectedKeys.every((key) => typeof sourceObjectPaths[key] === "string"), `sourceObjectPaths must provide ${expectedKeys.join(", ")}`);
    await Promise.all(expectedKeys.map((key) => auditHaringSourceObject(sourceObjectPaths[key], key)));
  }
  await validateHaringDorsalHornSourceTaxonomy(taxonomy);
  return taxonomy;
}

export async function writeHaringDorsalHornTaxonomy({ outputPath = DEFAULT_OUTPUT_PATH, sourceObjectPaths = null } = {}) {
  const taxonomy = await buildHaringDorsalHornTaxonomy({ sourceObjectPaths });
  const serialized = stableJson(taxonomy);
  const resolvedOutputPath = resolve(outputPath);
  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, serialized, "utf8");
  return {
    taxonomy,
    outputPath: resolvedOutputPath,
    outputBytes: Buffer.byteLength(serialized),
    outputSha256: sha256(Buffer.from(serialized, "utf8")),
  };
}

function parseArguments(argv) {
  let outputPath = DEFAULT_OUTPUT_PATH;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output") {
      check(argv[index + 1] && !argv[index + 1].startsWith("--"), "--output requires a path");
      outputPath = argv[index + 1];
      index += 1;
    } else if (argument.startsWith("--output=")) {
      outputPath = argument.slice("--output=".length);
      check(outputPath.length > 0, "--output requires a path");
    } else if (argument === "--help" || argument === "-h") {
      return { help: true, outputPath };
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return { help: false, outputPath };
}

const invokedAsMain = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url : false;

if (invokedAsMain) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log("Usage: node tools/build_haring_dorsal_horn_taxonomy.mjs [--output PATH]");
    } else {
      const result = await writeHaringDorsalHornTaxonomy(options);
      console.log(`Built ${result.outputPath} (${result.outputBytes} bytes; SHA-256 ${result.outputSha256})`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
