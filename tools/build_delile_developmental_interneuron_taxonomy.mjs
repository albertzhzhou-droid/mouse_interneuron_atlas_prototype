#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { validateDelileDevelopmentalInterneuronTaxonomy } from "../scripts/validate-delile-developmental-interneuron-taxonomy-0.1.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_PATH = resolve(PROJECT_ROOT, "data/delile-developmental-interneuron-taxonomy-0.1.json");

export const DELILE_METADATA_RECEIPT = Object.freeze({
  fileName: "phenoData_annotated.csv",
  repositoryPath: "output/phenoData_annotated.csv",
  pinnedCommit: "5de98d43bf89a003ea43aeb599136f7a4e1ee055",
  bytes: 3036323,
  md5: "43685445c3bd8a593e6bd7099d1a6eb3",
  sha256: "4f5bd353771ea478928e305df784f3fc868bb89a9ffc5fbce112da70c4a769bf",
  gitBlobSha1: "38945377a551225f0b216b1a818b80585a4b6cae",
  rowCount: 41025,
  columnCount: 9,
  columns: Object.freeze([
    "",
    "timepoint",
    "replicate_id",
    "Type_step1",
    "Type_step2",
    "Type_step2_unique",
    "DV",
    "Neuron_subtypes",
    "Pseudotime",
  ]),
});

export const DELILE_FINE_SUBTYPE_COUNTS = Object.freeze({
  "dl1.1": 30,
  "dl1.2": 67,
  "dl1.3": 255,
  "dl1.4": 128,
  "dl1.5": 41,
  "dl1.6": 238,
  "dl1.7": 116,
  "dl2.1": 446,
  "dl2.2": 243,
  "dl2.3": 35,
  "dl2.4": 157,
  "dl2.5": 118,
  "dl3.1": 90,
  "dl3.2": 367,
  "dl3.3": 404,
  "dl3.4": 418,
  "dl3.5": 138,
  "dl3.6": 179,
  "dl4.1": 1089,
  "dl4.2": 626,
  "dl4.3": 1010,
  "dl4.4": 611,
  "dl4.5": 333,
  "dl4.6": 1700,
  "dl5.1": 949,
  "dl5.2": 857,
  "dl5.3": 689,
  "dl5.4": 1149,
  "dl5.5": 419,
  "V0.1": 92,
  "V0.2": 50,
  "V0.3": 46,
  "V1.1": 151,
  "V1.2": 140,
  "V1.3": 231,
  "V1.4": 82,
  "V1.5": 144,
  "V1.6": 67,
  "V1.7": 54,
  "V2a.1": 32,
  "V2a.2": 190,
  "V2a.3": 86,
  "V2a.4": 103,
  "V2b.1": 94,
  "V2b.2": 55,
  "V2b.3": 26,
  "V2b.4": 287,
  "V3.1": 110,
  "V3.2": 119,
  "V3.3": 78,
  "V3.4": 78,
});

export const DELILE_CARDINAL_COUNTS = Object.freeze({
  dl1: 875,
  dl2: 999,
  dl3: 1596,
  dl4: 5369,
  dl5: 4063,
  dl6: 95,
  V0: 188,
  V1: 869,
  V2a: 493,
  V2b: 462,
  V3: 385,
});

const TIMEPOINTS = Object.freeze([9.5, 10.5, 11.5, 12.5, 13.5]);
const CARDINAL_LABELS = Object.freeze(Object.keys(DELILE_CARDINAL_COUNTS));
const FINE_LABELS = Object.freeze(Object.keys(DELILE_FINE_SUBTYPE_COUNTS));
const EXPECTED_SAMPLE_KEYS = Object.freeze([
  "9.5|1",
  "9.5|2",
  "10.5|1",
  "10.5|2",
  "11.5|1",
  "11.5|2",
  "12.5|1",
  "12.5|2",
  "12.5|3",
  "13.5|1",
  "13.5|2",
  "13.5|3",
]);

const MISSING_EVIDENCE = Object.freeze({
  morphology: "not_measured_or_deposited",
  wholeCellGeometry: "not_measured_or_deposited",
  axonDendriteTopology: "not_measured_or_deposited",
  electrophysiology: "not_measured_by_study",
  projectionTarget: "not_measured_by_study",
  synapticConnectivity: "not_measured_by_study",
  internalStructure: "no_raw_volume_segmentation_mesh_or_internal_object",
  atlasRegistration: "no_admitted_transform",
  sameCellMorphologyTranscriptomicsJoin: "relationship_not_established",
  sameCellPhysiologyTranscriptomicsJoin: "relationship_not_established",
  sameCellInternalStructureTranscriptomicsJoin: "relationship_not_established",
  crossSourceSameCellIdentity: "relationship_not_established",
  adultIdentity: "not_established",
  sciContext: "not_measured_by_study",
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function gitBlobSha1(bytes) {
  return createHash("sha1")
    .update(Buffer.from(`blob ${bytes.byteLength}\0`, "utf8"))
    .update(bytes)
    .digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function naturalCompare(left, right) {
  return left.localeCompare(right, "en", { numeric: true });
}

function roundedPercentage(numerator, denominator) {
  return Number(((numerator / denominator) * 100).toFixed(6));
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function exactMapEntries(map) {
  return [...map.entries()].sort(([left], [right]) => naturalCompare(left, right));
}

export function parseRTabRow(line, rowNumber = "unknown") {
  const fields = [];
  let field = "";
  let quoted = false;
  let fieldWasQuoted = false;
  let quoteClosed = false;

  const pushField = () => {
    fields.push(fieldWasQuoted || field !== "NA" ? field : null);
    field = "";
    fieldWasQuoted = false;
    quoteClosed = false;
  };

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === "\t") {
      pushField();
    } else if (character === '"') {
      check(field.length === 0 && !quoteClosed, `TSV row ${rowNumber} has a quote in an unquoted field`);
      quoted = true;
      fieldWasQuoted = true;
    } else {
      check(!quoteClosed, `TSV row ${rowNumber} has characters after a closing quote`);
      field += character;
    }
  }

  check(!quoted, `TSV row ${rowNumber} has an unterminated quoted field`);
  pushField();
  return fields;
}

function parseFiniteNumber(value, fieldName, rowNumber) {
  check(typeof value === "string" && value.length > 0, `TSV row ${rowNumber} has no ${fieldName}`);
  const parsed = Number(value);
  check(Number.isFinite(parsed), `TSV row ${rowNumber} has a non-finite ${fieldName}`);
  return parsed;
}

function parseOptionalFiniteNumber(value, fieldName, rowNumber) {
  return value === null ? null : parseFiniteNumber(value, fieldName, rowNumber);
}

function emptyStageCounts() {
  return new Map(TIMEPOINTS.map((timepoint) => [String(timepoint), 0]));
}

function incrementStage(map, timepoint) {
  const key = String(timepoint);
  check(map.has(key), `unexpected source timepoint ${key}`);
  increment(map, key);
}

function stageCounts(map) {
  return TIMEPOINTS.map((sourceTimepoint) => ({
    sourceTimepoint,
    lifeStage: `E${sourceTimepoint}`,
    cellCount: map.get(String(sourceTimepoint)) ?? 0,
  }));
}

export function parseDelileAnnotatedMetadata(sourceBytes) {
  check(Buffer.isBuffer(sourceBytes) || sourceBytes instanceof Uint8Array, "Delile metadata must be supplied as bytes");
  const bytes = Buffer.from(sourceBytes);
  check(bytes.byteLength === DELILE_METADATA_RECEIPT.bytes, `source byte count changed: expected ${DELILE_METADATA_RECEIPT.bytes}, received ${bytes.byteLength}`);
  for (const algorithm of ["md5", "sha256"]) {
    const observed = digest(algorithm, bytes);
    check(observed === DELILE_METADATA_RECEIPT[algorithm], `source ${algorithm.toUpperCase()} changed: expected ${DELILE_METADATA_RECEIPT[algorithm]}, received ${observed}`);
  }
  const observedGitBlobSha1 = gitBlobSha1(bytes);
  check(observedGitBlobSha1 === DELILE_METADATA_RECEIPT.gitBlobSha1, `source Git blob SHA-1 changed: expected ${DELILE_METADATA_RECEIPT.gitBlobSha1}, received ${observedGitBlobSha1}`);

  const text = bytes.toString("utf8");
  check(Buffer.from(text, "utf8").equals(bytes), "source metadata is not valid UTF-8");
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  check(!lines.some((line) => line.length === 0), "source metadata contains an empty row");
  check(lines.length === DELILE_METADATA_RECEIPT.rowCount + 1, `source row count changed: expected ${DELILE_METADATA_RECEIPT.rowCount + 1} including header, received ${lines.length}`);
  check(JSON.stringify(parseRTabRow(lines[0], 1)) === JSON.stringify(DELILE_METADATA_RECEIPT.columns), "source header or column order changed");

  const barcodes = new Set();
  const sampleMap = new Map();
  const cardinalMap = new Map(CARDINAL_LABELS.map((label) => [label, { total: 0, fine: 0, cardinalOnly: 0 }]));
  const fineMap = new Map(FINE_LABELS.map((label) => [label, {
    count: 0,
    stageCounts: emptyStageCounts(),
    dvObservedCellCount: 0,
    pseudotimeObservedCellCount: 0,
  }]));
  const cardinalOnlyMap = new Map();
  let neuronCount = 0;
  let sourceTypedNonmotorNeuronCount = 0;
  let fineSubtypeInterneuronCount = 0;
  let cardinalOnlyInterneuronCount = 0;
  let motorNeuronExcludedCount = 0;
  let nullNeuronExcludedCount = 0;

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1;
    const fields = parseRTabRow(lines[lineIndex], rowNumber);
    check(fields.length === DELILE_METADATA_RECEIPT.columnCount, `TSV row ${rowNumber} width changed: expected ${DELILE_METADATA_RECEIPT.columnCount}, received ${fields.length}`);
    const [barcode, timepointValue, replicateValue, typeStep1, typeStep2, typeStep2Unique, dvValue, neuronSubtype, pseudotimeValue] = fields;
    check(typeof barcode === "string" && /^[ACGT]{16}-(?:[1-9]|1[0-2])$/.test(barcode), `TSV row ${rowNumber} has an invalid 10x barcode`);
    check(!barcodes.has(barcode), `source cell barcode is duplicated: ${barcode}`);
    barcodes.add(barcode);
    const timepoint = parseFiniteNumber(timepointValue, "timepoint", rowNumber);
    check(TIMEPOINTS.includes(timepoint), `TSV row ${rowNumber} has unexpected timepoint ${timepoint}`);
    const replicateId = parseFiniteNumber(replicateValue, "replicate_id", rowNumber);
    check(Number.isInteger(replicateId) && replicateId >= 1 && replicateId <= 3, `TSV row ${rowNumber} has invalid replicate_id ${replicateId}`);
    const sampleKey = `${timepoint}|${replicateId}`;
    check(EXPECTED_SAMPLE_KEYS.includes(sampleKey), `TSV row ${rowNumber} has unexpected stage-replicate combination ${sampleKey}`);
    const dv = parseOptionalFiniteNumber(dvValue, "DV", rowNumber);
    check(dv === null || (Number.isInteger(dv) && dv >= 1 && dv <= 13), `TSV row ${rowNumber} has invalid source DV class`);
    const pseudotime = parseOptionalFiniteNumber(pseudotimeValue, "Pseudotime", rowNumber);

    const sample = sampleMap.get(sampleKey) ?? {
      sourceTimepoint: timepoint,
      lifeStage: `E${timepoint}`,
      sourceReplicateId: replicateId,
      totalMetadataCellCount: 0,
      sourceDefinedNeuronCellCount: 0,
      sourceTypedNonmotorNeuronCellCount: 0,
      fineSubtypeInterneuronCellCount: 0,
      cardinalOnlyInterneuronCellCount: 0,
      motorNeuronExcludedCellCount: 0,
      nullNeuronExcludedCellCount: 0,
    };
    sample.totalMetadataCellCount += 1;
    sampleMap.set(sampleKey, sample);

    if (typeStep1 !== "Neuron") continue;
    neuronCount += 1;
    sample.sourceDefinedNeuronCellCount += 1;
    check(typeof typeStep2 === "string", `TSV row ${rowNumber} is a Neuron without Type_step2`);

    if (typeStep2 === "MN") {
      motorNeuronExcludedCount += 1;
      sample.motorNeuronExcludedCellCount += 1;
      continue;
    }
    if (typeStep2 === "Null_Neuron") {
      check(neuronSubtype === null, `TSV row ${rowNumber} assigns a fine subtype to Null_Neuron`);
      nullNeuronExcludedCount += 1;
      sample.nullNeuronExcludedCellCount += 1;
      continue;
    }

    check(CARDINAL_LABELS.includes(typeStep2), `TSV row ${rowNumber} has unexpected Neuron Type_step2 ${typeStep2}`);
    check(typeof typeStep2Unique === "string" && typeStep2Unique.startsWith(typeStep2), `TSV row ${rowNumber} has Type_step2_unique inconsistent with ${typeStep2}`);
    sourceTypedNonmotorNeuronCount += 1;
    sample.sourceTypedNonmotorNeuronCellCount += 1;
    const cardinal = cardinalMap.get(typeStep2);
    cardinal.total += 1;

    if (neuronSubtype === null) {
      cardinalOnlyInterneuronCount += 1;
      sample.cardinalOnlyInterneuronCellCount += 1;
      cardinal.cardinalOnly += 1;
      const summary = cardinalOnlyMap.get(typeStep2) ?? { count: 0, stageCounts: emptyStageCounts() };
      summary.count += 1;
      incrementStage(summary.stageCounts, timepoint);
      cardinalOnlyMap.set(typeStep2, summary);
      continue;
    }

    check(FINE_LABELS.includes(neuronSubtype), `TSV row ${rowNumber} has unexpected non-motor Neuron_subtypes label ${neuronSubtype}`);
    check(neuronSubtype.startsWith(`${typeStep2}.`), `TSV row ${rowNumber} fine subtype ${neuronSubtype} is inconsistent with ${typeStep2}`);
    fineSubtypeInterneuronCount += 1;
    sample.fineSubtypeInterneuronCellCount += 1;
    cardinal.fine += 1;
    const profile = fineMap.get(neuronSubtype);
    profile.count += 1;
    incrementStage(profile.stageCounts, timepoint);
    if (dv !== null) profile.dvObservedCellCount += 1;
    if (pseudotime !== null) profile.pseudotimeObservedCellCount += 1;
  }

  check(barcodes.size === DELILE_METADATA_RECEIPT.rowCount, `source must contain ${DELILE_METADATA_RECEIPT.rowCount} globally unique barcodes`);
  check(sampleMap.size === EXPECTED_SAMPLE_KEYS.length, `source must contain exactly ${EXPECTED_SAMPLE_KEYS.length} stage-replicate combinations`);
  check(neuronCount === 18144, `source-defined Neuron count changed: expected 18144, received ${neuronCount}`);
  check(sourceTypedNonmotorNeuronCount === 15394, `source-typed non-motor neuron count changed: expected 15394, received ${sourceTypedNonmotorNeuronCount}`);
  check(fineSubtypeInterneuronCount === 15217, `fine-subtype interneuron count changed: expected 15217, received ${fineSubtypeInterneuronCount}`);
  check(cardinalOnlyInterneuronCount === 177, `cardinal-only interneuron count changed: expected 177, received ${cardinalOnlyInterneuronCount}`);
  check(motorNeuronExcludedCount === 1056, `excluded MN count changed: expected 1056, received ${motorNeuronExcludedCount}`);
  check(nullNeuronExcludedCount === 1694, `excluded Null_Neuron count changed: expected 1694, received ${nullNeuronExcludedCount}`);

  for (const [label, expected] of Object.entries(DELILE_FINE_SUBTYPE_COUNTS)) {
    check(fineMap.get(label).count === expected, `${label} fine-subtype count changed: expected ${expected}, received ${fineMap.get(label).count}`);
  }
  for (const [label, expected] of Object.entries(DELILE_CARDINAL_COUNTS)) {
    check(cardinalMap.get(label).total === expected, `${label} cardinal count changed: expected ${expected}, received ${cardinalMap.get(label).total}`);
  }
  check(cardinalOnlyMap.size === 2 && cardinalOnlyMap.get("dl6")?.count === 95 && cardinalOnlyMap.get("V2a")?.count === 82, "cardinal-only cells must remain exactly 95 dl6 plus 82 V2a");

  return {
    sourceReceipt: {
      fileName: DELILE_METADATA_RECEIPT.fileName,
      bytes: bytes.byteLength,
      md5: digest("md5", bytes),
      sha256: digest("sha256", bytes),
      gitBlobSha1: observedGitBlobSha1,
      rowCount: barcodes.size,
      columnCount: DELILE_METADATA_RECEIPT.columnCount,
    },
    counts: {
      totalMetadataCellCount: barcodes.size,
      sourceDefinedNeuronCellCount: neuronCount,
      sourceTypedNonmotorNeuronCellCount: sourceTypedNonmotorNeuronCount,
      fineSubtypeInterneuronCellCount: fineSubtypeInterneuronCount,
      cardinalOnlyInterneuronCellCount: cardinalOnlyInterneuronCount,
      motorNeuronExcludedCellCount: motorNeuronExcludedCount,
      nullNeuronExcludedCellCount: nullNeuronExcludedCount,
    },
    sampleRecords: EXPECTED_SAMPLE_KEYS.map((key) => sampleMap.get(key)),
    cardinalSummaries: CARDINAL_LABELS.map((sourceLocalLabel) => ({ sourceLocalLabel, ...cardinalMap.get(sourceLocalLabel) })),
    cardinalOnlySummaries: exactMapEntries(cardinalOnlyMap).map(([sourceLocalLabel, summary]) => ({
      sourceLocalLabel,
      cellCount: summary.count,
      timepointCellCounts: stageCounts(summary.stageCounts),
    })),
    profiles: FINE_LABELS.map((sourceLocalLabel) => {
      const profile = fineMap.get(sourceLocalLabel);
      return {
        id: `delile-2019:E-MTAB-7320:${sourceLocalLabel}`,
        sourceLocalLabel,
        cardinalClass: sourceLocalLabel.slice(0, sourceLocalLabel.indexOf(".")),
        cellCount: profile.count,
        percentOfFineSubtypeInterneuronCells: roundedPercentage(profile.count, fineSubtypeInterneuronCount),
        timepointCellCounts: stageCounts(profile.stageCounts),
        dvObservedCellCount: profile.dvObservedCellCount,
        pseudotimeObservedCellCount: profile.pseudotimeObservedCellCount,
      };
    }),
  };
}

function buildTaxonomy(parsed) {
  return {
    schemaVersion: "0.1.0",
    releaseId: "ohri-delile-developmental-interneuron-taxonomy-0.1.0",
    releaseDate: "2026-09-02",
    title: "Exact source-local Delile 2019 embryonic mouse spinal interneuron fine-subtype taxonomy",
    source: {
      publication: {
        citation: "Delile J, Rayon T, Melchionda M, et al. Single cell transcriptomics reveals spatial and temporal dynamics of gene expression in the developing mouse spinal cord. Development 146, dev173807 (2019).",
        doi: "10.1242/dev.173807",
        pmcid: "PMC6602353",
        articleUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6602353/",
        studyContext: "Single-cell RNA sequencing of developing mouse cervical and thoracic spinal cord from embryonic day 9.5 through 13.5.",
      },
      biostudies: {
        accession: "E-MTAB-7320",
        studyUrl: "https://www.ebi.ac.uk/biostudies/arrayexpress/studies/E-MTAB-7320",
        relationshipToParsedObject: "The accession is the publication-declared sequencing-data repository. The parsed annotation object is pinned separately in the authors' analysis repository.",
      },
      repository: {
        url: "https://github.com/juliendelile/MouseSpinalCordAtlas",
        pinnedCommit: DELILE_METADATA_RECEIPT.pinnedCommit,
        commitUrl: `https://github.com/juliendelile/MouseSpinalCordAtlas/tree/${DELILE_METADATA_RECEIPT.pinnedCommit}`,
        rightsStatus: "public_repository_no_explicit_license",
        license: "NOASSERTION",
        sourceFilesBundled: false,
        derivedFactualContractBundled: true,
        reuseBoundary: "Public access is not treated as affirmative permission to redistribute repository files. The source TSV remains link-only; this package contains only a compact factual derivative and receipt.",
      },
      annotatedMetadataObject: {
        ...parsed.sourceReceipt,
        repositoryPath: DELILE_METADATA_RECEIPT.repositoryPath,
        pinnedUrl: `https://raw.githubusercontent.com/juliendelile/MouseSpinalCordAtlas/${DELILE_METADATA_RECEIPT.pinnedCommit}/${DELILE_METADATA_RECEIPT.repositoryPath}`,
        delimiter: "tab",
        columns: [...DELILE_METADATA_RECEIPT.columns],
        sourceFileBundled: false,
        accessMode: "link_only",
        rightsStatus: "public_repository_no_explicit_license",
        license: "NOASSERTION",
        derivationAuthority: "authors_exported_per_cell_annotation_table",
      },
    },
    scope: {
      species: "Mus musculus",
      taxonId: "NCBITaxon:10090",
      lifeStages: TIMEPOINTS.map((timepoint) => `E${timepoint}`),
      sampledRegions: ["cervical spinal cord", "thoracic spinal cord"],
      sourceStageReplicateLabelCount: parsed.sampleRecords.length,
      biologicalAnimalCount: null,
      biologicalAnimalCountMissingReason: "The parsed annotation table identifies stage and replicate_id but does not resolve an animal denominator; replicate labels must not be promoted to animals.",
      totalMetadataCellCount: parsed.counts.totalMetadataCellCount,
      sourceDefinedNeuronCellCount: parsed.counts.sourceDefinedNeuronCellCount,
      sourceTypedNonmotorNeuronCellCount: parsed.counts.sourceTypedNonmotorNeuronCellCount,
      fineSubtypeInterneuronCellCount: parsed.counts.fineSubtypeInterneuronCellCount,
      cardinalOnlyInterneuronCellCount: parsed.counts.cardinalOnlyInterneuronCellCount,
      motorNeuronExcludedCellCount: parsed.counts.motorNeuronExcludedCellCount,
      nullNeuronExcludedCellCount: parsed.counts.nullNeuronExcludedCellCount,
      cardinalClassCount: CARDINAL_LABELS.length,
      fineSubtypeProfileCount: FINE_LABELS.length,
      perCellRosterBundled: false,
      admittedGeometryCount: 0,
      admittedInternalStructureCount: 0,
      sameCellMorphologyTranscriptomicsJoinCount: 0,
      sameCellPhysiologyTranscriptomicsJoinCount: 0,
      sameCellInternalStructureTranscriptomicsJoinCount: 0,
      projectRegistrationCount: 0,
      exactCrossSourceIdentityCount: 0,
    },
    denominatorFlow: [
      { stage: "all_annotated_cells", count: parsed.counts.totalMetadataCellCount, unit: "cells" },
      { stage: "source_Type_step1_Neuron", count: parsed.counts.sourceDefinedNeuronCellCount, unit: "cells" },
      { stage: "source_typed_nonmotor_neurons", count: parsed.counts.sourceTypedNonmotorNeuronCellCount, unit: "cells" },
      { stage: "fine_subtype_interneurons", count: parsed.counts.fineSubtypeInterneuronCellCount, unit: "cells" },
      { stage: "cardinal_only_interneurons", count: parsed.counts.cardinalOnlyInterneuronCellCount, unit: "cells" },
      { stage: "excluded_motor_neurons", count: parsed.counts.motorNeuronExcludedCellCount, unit: "cells" },
      { stage: "excluded_Null_Neuron", count: parsed.counts.nullNeuronExcludedCellCount, unit: "cells" },
    ],
    denominatorBoundary: "The 41,025 annotation rows are cells, not animals. Source replicate_id values form 12 stage-replicate labels and are not asserted to be 12 biological replicates. The 15,217 displayed fine-subtype cells exclude 177 cardinal-only interneurons, 1,056 motor neurons and 1,694 Null_Neuron rows while retaining each denominator explicitly.",
    sampleRecords: parsed.sampleRecords,
    cardinalClassSummaries: parsed.cardinalSummaries.map((summary) => ({
      sourceLocalLabel: summary.sourceLocalLabel,
      sourceTypedCellCount: summary.total,
      fineSubtypeCellCount: summary.fine,
      cardinalOnlyCellCount: summary.cardinalOnly,
    })),
    cardinalOnlySummaries: parsed.cardinalOnlySummaries,
    profiles: parsed.profiles.map((profile) => ({
      ...profile,
      assignmentAuthority: "Neuron_subtypes column in the pinned authors' annotation table",
      sourceLocators: [
        `output/phenoData_annotated.csv · Neuron_subtypes=${profile.sourceLocalLabel}`,
        `output/phenoData_annotated.csv · Type_step1=Neuron · Type_step2=${profile.cardinalClass}`,
      ],
      missingEvidence: MISSING_EVIDENCE,
    })),
    globalMissingEvidence: MISSING_EVIDENCE,
    joinPolicy: {
      sourceCellBarcodesPresent: true,
      perCellRosterBundled: false,
      crossSourceJoinAllowed: false,
      typeToMorphologyJoinAllowed: false,
      typeToPhysiologyJoinAllowed: false,
      typeToInternalStructureJoinAllowed: false,
      sourcePseudotimeIsPhysicalCoordinate: false,
      sourceDvClassIsAtlasRegistration: false,
      projectAtlasTransform: null,
      boundary: "A barcode links annotation fields only within the pinned source table. It does not establish a morphology, physiology, internal-object, adult-type, SCI, atlas-registration or cross-source same-cell relationship.",
    },
    hardBoundaries: [
      "All 51 fine labels and their 15,217 captured-cell counts remain source-local to the Delile 2019 Neuron_subtypes column and are not cross-study canonical identities.",
      "The source spelling dl is preserved exactly and must not be silently normalized to dI in identifiers or labels.",
      "The 177 source-typed cells without a fine Neuron_subtypes value remain cardinal-only: 95 dl6 and 82 V2a; neither group becomes an invented fine subtype.",
      "The displayed fine-subtype denominator excludes 1,056 source-labelled MN cells and 1,694 Null_Neuron cells without deleting those counts from the provenance chain.",
      "Cell counts and percentages describe captured cells in this source object; they are not animal-resolved prevalence estimates.",
      "Source timepoint, replicate_id, DV and pseudotime fields do not supply a physical 3D coordinate, an atlas transform or an observed same-cell trajectory.",
      "This taxonomy admits zero morphology, whole-cell geometry, axon-dendrite topology, electrophysiology, synapses, organelles or other internal structures.",
      "No adult identity, SCI identity, cross-source identity, morphology join, physiology join, internal-object join or registration may be inferred from these developmental labels.",
      "The source annotation TSV remains link-only because its public repository has no explicit license; only this attributed compact factual derivative is bundled.",
    ],
  };
}

export async function auditDelileAnnotatedMetadata(sourcePath) {
  check(typeof sourcePath === "string" && sourcePath.length > 0, "--source requires a path");
  const resolvedPath = resolve(sourcePath);
  const parsed = parseDelileAnnotatedMetadata(await readFile(resolvedPath));
  return { sourcePath: resolvedPath, observedFileName: basename(resolvedPath), ...parsed };
}

export async function buildDelileDevelopmentalInterneuronTaxonomy({ sourcePath } = {}) {
  const parsed = await auditDelileAnnotatedMetadata(sourcePath);
  const taxonomy = buildTaxonomy(parsed);
  await validateDelileDevelopmentalInterneuronTaxonomy(taxonomy);
  return taxonomy;
}

export async function writeDelileDevelopmentalInterneuronTaxonomy({ sourcePath, outputPath = DEFAULT_OUTPUT_PATH } = {}) {
  const taxonomy = await buildDelileDevelopmentalInterneuronTaxonomy({ sourcePath });
  const serialized = stableJson(taxonomy);
  const resolvedOutputPath = resolve(outputPath);
  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, serialized, "utf8");
  return {
    taxonomy,
    outputPath: resolvedOutputPath,
    outputBytes: Buffer.byteLength(serialized),
    outputSha256: digest("sha256", Buffer.from(serialized, "utf8")),
  };
}

function argumentValue(argv, option) {
  const index = argv.indexOf(option);
  if (index >= 0) {
    const value = argv[index + 1];
    check(value && !value.startsWith("--"), `${option} requires a path`);
    return value;
  }
  const assigned = argv.find((item) => item.startsWith(`${option}=`));
  return assigned ? assigned.slice(option.length + 1) : null;
}

const invokedAsMain = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url : false;
if (invokedAsMain) {
  try {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
      console.log("Usage: node tools/build_delile_developmental_interneuron_taxonomy.mjs --source PATH [--output PATH]");
    } else {
      const sourcePath = argumentValue(process.argv.slice(2), "--source");
      const outputPath = argumentValue(process.argv.slice(2), "--output") ?? DEFAULT_OUTPUT_PATH;
      const result = await writeDelileDevelopmentalInterneuronTaxonomy({ sourcePath, outputPath });
      console.log(`Built ${result.outputPath} (${result.outputBytes} bytes; SHA-256 ${result.outputSha256})`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
