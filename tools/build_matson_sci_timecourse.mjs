#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { parseMatsonRankedMarkerWorkbook } from "./parse_matson_marker_workbook.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT = path.join(ROOT, "data/matson-neuronal-sci-timecourse-0.1.json");
const RELEASE_DATE = "2026-08-27";

const EXPECTED_SOURCE_FILES = Object.freeze({
  metadata: {
    fileName: "GSE172167_meta.txt.gz",
    bytes: 75000,
    sha256: "5aabb2cd5f43b3c7a7f872e170dda470afb84a0b1dbfd7da2a248ba52c608554",
    url: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE172nnn/GSE172167/suppl/GSE172167_meta.txt.gz",
  },
  familySoft: {
    fileName: "GSE172167_family.soft.gz",
    bytes: 3793,
    sha256: "81022a11cc604dec4f018d29d44925fd198b4b38e66ab5e5026923bd5266ca71",
    url: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE172nnn/GSE172167/soft/GSE172167_family.soft.gz",
  },
});

const ARTICLE_SUPPLEMENT_REFERENCES = Object.freeze([
  {
    role: "rankedMarkerWorkbook",
    fileName: "41467_2022_33184_MOESM4_ESM.xlsx",
    bytes: 16885,
    sha256: "ce390abbaf5a6b4ca376e03112a34141f105774918339c59a3614c98d20b6c74",
    url: "https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-022-33184-1/MediaObjects/41467_2022_33184_MOESM4_ESM.xlsx",
    license: "CC-BY-4.0",
    bundled: false,
    derivedRankedMarkersBundled: true,
    scope: "Top 20 ranked genes for 39 source types; this release deterministically retains all ranks 1–20 for the 17 neuronal families and no absent score or p-value.",
  },
]);

const TIMEPOINTS = Object.freeze([
  { id: "uninjured", sourceLabel: "Uninjured", phase: "baseline", order: 0 },
  { id: "1dpi", sourceLabel: "1dpi", phase: "acute", order: 1 },
  { id: "1wpi", sourceLabel: "1wpi", phase: "subacute", order: 2 },
  { id: "3wpi", sourceLabel: "3wpi", phase: "intermediate", order: 3 },
  { id: "6wpi", sourceLabel: "6wpi", phase: "chronic", order: 4 },
]);

const POPULATION_DEFINITIONS = Object.freeze([
  ["Cpne4 Neurons", "DE Neurons", "excitatory", "Cpne4", "Cpne4"],
  ["Maf Neurons", "DE Neurons", "excitatory", "Maf", "Maf"],
  ["Reln Neurons", "DE Neurons", "excitatory", "Reln", "Reln"],
  ["Rreb1 Neurons", "DE Neurons", "excitatory", "Rreb1", "Rreb1"],
  ["Sox5 Neurons", "DE Neurons", "excitatory", "Sox5", "Sox5"],
  ["Megf11 Neurons", "DE Neurons", "excitatory", "Megf11", "Megf11"],
  ["ME Neurons", "ME Neurons", "excitatory", "ME", "ME"],
  ["VE Neurons", "VE Neurons", "excitatory", "VE", "VE"],
  ["Adamts5 Neurons", "DI Neurons", "inhibitory", "Adamts5", "Adamts5"],
  ["Cdh3 Neurons", "DI Neurons", "inhibitory", "Cdh3", "Cdh3"],
  ["Pdyn Neurons", "DI Neurons", "inhibitory", "Pdyn", "Pdyn"],
  ["Npy Neurons", "DI Neurons", "inhibitory", "Npy", "Npy"],
  ["Chat Neurons", "DI Neurons", "inhibitory", "Chat", "Chat"],
  ["MI Neurons", "MI Neurons", "inhibitory", "MI", "MI"],
  ["VI Neurons", "VI Neurons", "inhibitory", "VI", "VI"],
  ["CSF-c Neurons", "CSF-c Neurons", "inhibitory", "CSF-c", "CSF-c"],
  ["Motoneurons", "Motoneurons", "motor_context", "Motoneurons", "MN"],
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value) throw new Error(`${name} requires a path`);
  return path.resolve(process.cwd(), value);
}

function parseTsv(bytes) {
  const text = gunzipSync(bytes).toString("utf8").trimEnd();
  const rows = text.split(/\r?\n/).map((line) => line.split("\t").map((value) => value.replace(/^"|"$/g, "")));
  const header = rows.shift();
  check(
    JSON.stringify(header) === JSON.stringify(["orig.ident", "condition", "clusters", "subclass", "class", "timepoint"]),
    "GSE172167 metadata header changed",
  );
  return rows.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index]])));
}

function parseFamilySoft(bytes) {
  const lines = gunzipSync(bytes).toString("utf8").split(/\r?\n/);
  const samples = [];
  let current = null;
  const flush = () => {
    if (current) samples.push(current);
    current = null;
  };
  for (const line of lines) {
    if (line.startsWith("^SAMPLE = ")) {
      flush();
      current = { geoAccession: line.slice("^SAMPLE = ".length), title: "", descriptions: [], bioSample: "", sraExperiment: "" };
    } else if (current && line.startsWith("!Sample_title = ")) {
      current.title = line.slice("!Sample_title = ".length);
    } else if (current && line.startsWith("!Sample_description = ")) {
      current.descriptions.push(line.slice("!Sample_description = ".length));
    } else if (current && line.startsWith("!Sample_relation = BioSample: ")) {
      current.bioSample = line.split("/").at(-1);
    } else if (current && line.startsWith("!Sample_relation = SRA: ")) {
      current.sraExperiment = new URL(line.slice("!Sample_relation = SRA: ".length)).searchParams.get("term") ?? "";
    }
  }
  flush();
  return samples.map((sample) => ({
    ...sample,
    sourceSampleId: sample.descriptions.find((value) => /^[A-Z]-[0-9]+$/.test(value)) ?? "",
  }));
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function roundShare(numerator, denominator) {
  return Number((numerator / denominator).toFixed(6));
}

async function main() {
  const metadataPath = readArg("--metadata");
  const familySoftPath = readArg("--family-soft");
  const markerWorkbookPath = readArg("--marker-workbook");
  const outputPath = readArg("--output") ?? DEFAULT_OUTPUT;
  check(metadataPath, "--metadata is required");
  check(familySoftPath, "--family-soft is required");
  check(markerWorkbookPath, "--marker-workbook is required");

  const [metadataBytes, familySoftBytes, markerWorkbookBytes] = await Promise.all([
    readFile(metadataPath),
    readFile(familySoftPath),
    readFile(markerWorkbookPath),
  ]);
  for (const [label, bytes, expected] of [
    ["metadata", metadataBytes, EXPECTED_SOURCE_FILES.metadata],
    ["family SOFT", familySoftBytes, EXPECTED_SOURCE_FILES.familySoft],
  ]) {
    check(bytes.byteLength === expected.bytes, `${label} byte count changed`);
    check(sha256(bytes) === expected.sha256, `${label} SHA-256 changed`);
  }

  const rows = parseTsv(metadataBytes);
  const familySamples = parseFamilySoft(familySoftBytes);
  const markerWorkbook = parseMatsonRankedMarkerWorkbook(markerWorkbookBytes);
  const markerPanelByAlias = new Map(markerWorkbook.populations.map((population) => [population.markerColumnAlias, population]));
  check(rows.length === 67903, "Expected 67,903 retained nuclei");
  check(familySamples.length === 15, "Expected 15 GEO sample records");

  const sampleMetaById = new Map(familySamples.map((sample) => [sample.sourceSampleId, sample]));
  check(sampleMetaById.size === 15 && !sampleMetaById.has(""), "Every GEO sample must expose one source sample identifier");

  const timepointBySource = new Map(TIMEPOINTS.map((timepoint) => [timepoint.sourceLabel, timepoint]));
  const sampleIds = [...new Set(rows.map((row) => row["orig.ident"]))];
  check(sampleIds.length === 15, "Expected 15 unique source sample identifiers");
  check(sampleIds.every((sampleId) => sampleMetaById.has(sampleId)), "Metadata and GEO family sample identifiers do not match");
  check(rows.every((row) => timepointBySource.has(row.timepoint)), "Unknown timepoint in metadata");

  const neuronRows = rows.filter((row) => row.class === "Neurons");
  check(neuronRows.length === 23651, "Expected 23,651 neuronal nuclei");
  const observedPopulationLabels = new Set(neuronRows.map((row) => row.clusters));
  check(observedPopulationLabels.size === 17, "Expected 17 neuronal population labels");
  check(POPULATION_DEFINITIONS.every(([label]) => observedPopulationLabels.has(label)), "Neuronal population label set changed");

  const totalBySample = countBy(rows, (row) => row["orig.ident"]);
  const neuronsBySample = countBy(neuronRows, (row) => row["orig.ident"]);
  const totalByTimepoint = countBy(rows, (row) => row.timepoint);
  const neuronsByTimepoint = countBy(neuronRows, (row) => row.timepoint);
  const populationByTimepoint = countBy(neuronRows, (row) => `${row.clusters}\t${row.timepoint}`);
  const populationBySample = countBy(neuronRows, (row) => `${row.clusters}\t${row["orig.ident"]}`);

  const samples = familySamples
    .map((sample) => {
      const matchingRows = rows.filter((row) => row["orig.ident"] === sample.sourceSampleId);
      check(matchingRows.length > 0, `No metadata rows for ${sample.sourceSampleId}`);
      const timepoint = timepointBySource.get(matchingRows[0].timepoint);
      check(matchingRows.every((row) => row.timepoint === timepoint.sourceLabel), `${sample.sourceSampleId} spans multiple timepoints`);
      return {
        id: sample.sourceSampleId,
        geoAccession: sample.geoAccession,
        geoTitle: sample.title,
        bioSample: sample.bioSample,
        sraExperiment: sample.sraExperiment,
        timepointId: timepoint.id,
        independentAnimalCount: 1,
        totalCapturedNuclei: totalBySample.get(sample.sourceSampleId),
        capturedNeuronalNuclei: neuronsBySample.get(sample.sourceSampleId) ?? 0,
      };
    })
    .sort((a, b) => TIMEPOINTS.findIndex((item) => item.id === a.timepointId) - TIMEPOINTS.findIndex((item) => item.id === b.timepointId)
      || a.geoAccession.localeCompare(b.geoAccession));

  const timepoints = TIMEPOINTS.map((timepoint) => {
    const matchingSamples = samples.filter((sample) => sample.timepointId === timepoint.id);
    check(matchingSamples.length === 3, `${timepoint.id} must retain three biological replicates`);
    return {
      ...timepoint,
      independentAnimalCount: 3,
      totalCapturedNuclei: totalByTimepoint.get(timepoint.sourceLabel),
      capturedNeuronalNuclei: neuronsByTimepoint.get(timepoint.sourceLabel),
      sampleIds: matchingSamples.map((sample) => sample.id),
      geoAccessions: matchingSamples.map((sample) => sample.geoAccession),
    };
  });

  const populations = POPULATION_DEFINITIONS.map(([sourceLabel, sourceSubclass, transmitterContext, shortLabel, markerColumnAlias], index) => {
    const populationRows = neuronRows.filter((row) => row.clusters === sourceLabel);
    const rankedMarkerPanel = markerPanelByAlias.get(markerColumnAlias);
    check(rankedMarkerPanel, `${sourceLabel}: Supplementary Dataset 2 marker column is unavailable`);
    check(populationRows.every((row) => row.subclass === sourceSubclass), `${sourceLabel} subclass changed`);
    const projectUseClass = transmitterContext === "motor_context"
      ? "motor_neuron_context_excluded_from_interneuron_count"
      : "source_local_spinal_neuron_population_local_vs_projection_unresolved";
    return {
      id: `matson-2022:GSE172167:${sourceLabel.replaceAll(" ", "_")}`,
      order: index + 1,
      sourceLabel,
      shortLabel,
      sourceSubclass,
      transmitterContext,
      sourceAnnotationMethod: "Seurat label transfer from the Russ et al. 2021 harmonized spinal-neuron atlas",
      rankedMarkerPanel: {
        markerColumnAlias,
        worksheet: markerWorkbook.worksheet,
        headerCell: rankedMarkerPanel.headerCell,
        rankCellRange: rankedMarkerPanel.rankCellRange,
        rankedGenes: rankedMarkerPanel.rankedGenes,
        sourceRankCount: 20,
        retainedRankCount: 20,
        scoreAvailable: false,
        pValueAvailable: false,
        sourceLocator: `Supplementary Dataset 2; ${markerWorkbook.worksheet}!${rankedMarkerPanel.headerCell}, ${rankedMarkerPanel.rankCellRange}`,
        sourceSha256: ARTICLE_SUPPLEMENT_REFERENCES[0].sha256,
        boundary: "Ranks 1–20 are the complete source-native ranked marker panel for this workbook column. Marker rank is not an exact identity rule, expression magnitude, specificity score or p-value.",
      },
      projectUseClass,
      capturedNeuronalNuclei: populationRows.length,
      timepointCounts: TIMEPOINTS.map((timepoint) => {
        const count = populationByTimepoint.get(`${sourceLabel}\t${timepoint.sourceLabel}`) ?? 0;
        const denominator = neuronsByTimepoint.get(timepoint.sourceLabel);
        return {
          timepointId: timepoint.id,
          count,
          capturedNeuronalNucleiDenominator: denominator,
          shareOfCapturedNeuronalNuclei: roundShare(count, denominator),
        };
      }),
      sampleCounts: samples.map((sample) => ({
        sampleId: sample.id,
        geoAccession: sample.geoAccession,
        count: populationBySample.get(`${sourceLabel}\t${sample.id}`) ?? 0,
        capturedNeuronalNucleiDenominator: sample.capturedNeuronalNuclei,
      })),
      evidenceBoundary: transmitterContext === "motor_context"
        ? "This source label is retained as motor-neuron context and is excluded from the interneuron population count."
        : "This source-local label-transfer population is not a confirmed local interneuron type. The study contains both interneurons and ascending projection neurons, and this record has no same-cell tracing or morphology.",
      missingEvidence: {
        cellCoordinates: "not_available_in_processed_metadata",
        singleCellMorphology: "not_measured",
        completeAxon: "not_measured",
        sameCellProjectionStatus: "not_established",
        synapticConnectivity: "not_measured",
        atlasRegistration: "not_established",
        biologicalPrevalence: "not_established_from_captured_nucleus_counts",
      },
    };
  });

  const output = {
    releaseId: "ohri-matson-neuronal-sci-timecourse-0.2.0",
    schemaVersion: "0.2.0",
    releaseDate: RELEASE_DATE,
    source: {
      studyId: "matson-2022-gse172167",
      citation: "Matson KJE, Russ DE, Kathe C, et al. Single cell atlas of spinal cord injury in mice reveals a pro-regenerative signature in spinocerebellar neurons. Nature Communications 13, 5628 (2022).",
      doi: "10.1038/s41467-022-33184-1",
      pmid: "36163250",
      articleUrl: "https://www.nature.com/articles/s41467-022-33184-1",
      license: {
        id: "CC-BY-4.0",
        url: "https://creativecommons.org/licenses/by/4.0/",
        appliesTo: "Article and included source-data material unless a separate credit line states otherwise",
        rightsBoundary: "The GEO processed files are publicly downloadable, but no accession-specific redistribution licence was located. Raw source files are not bundled; this release retains only factual identifiers and source-derived counts.",
      },
      repositories: {
        geo: { accession: "GSE172167", url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE172167" },
        sra: { accession: "SRP315018", url: "https://www.ncbi.nlm.nih.gov/sra?term=SRP315018" },
        bioProject: { accession: "PRJNA722283", url: "https://www.ncbi.nlm.nih.gov/bioproject/PRJNA722283" },
      },
      sourceFiles: Object.entries(EXPECTED_SOURCE_FILES).map(([role, value]) => ({
        role,
        ...value,
        bundled: false,
        derivedFactualCountsBundled: true,
        assetLevelReuseStatus: "not_assumed",
      })),
      articleSupplementReferences: ARTICLE_SUPPLEMENT_REFERENCES,
    },
    scope: {
      species: "Mus musculus",
      strain: "C57BL/6",
      sex: "female",
      ageWeeks: "12–30",
      spinalRegion: "L2–S1 lumbar spinal cord distal to a thoracic injury",
      spinalSegments: "L2–S1",
      rootsAttached: ["proximal dorsal roots", "proximal ventral roots"],
      modality: "single-nucleus RNA sequencing",
      injuryLevel: "T9 vertebral level",
      injuryModel: "90 kdyn severe contusion",
      conditionCount: 5,
      independentAnimalCount: 15,
      independentAnimalCountPerCondition: 3,
      capturedNucleiCount: rows.length,
      capturedNeuronalNucleiCount: neuronRows.length,
      neuronalPopulationCount: populations.length,
      sourceLocalNonMotorPopulationCount: populations.filter((item) => item.transmitterContext !== "motor_context").length,
      motorContextPopulationCount: populations.filter((item) => item.transmitterContext === "motor_context").length,
      exactCrossSourceIdentityCount: 0,
      projectRegistrationCount: 0,
    },
    experimentalDesign: {
      tissue: "L2–S1 lumbar spinal cord with proximal dorsal and ventral roots attached",
      injuryTissueRelation: "Sequenced lumbar tissue was below and distal to the T9 lesion site",
      sequencingPlatform: "10x Genomics Chromium Single Cell Kit v2; article reports Illumina HiSeq 3000 while GEO reports HiSeq 2500",
      referenceGenome: "mm10-1.2.0 (GRCm38.93)",
      analysis: "Cell Ranger 2.2.0, Velocyto and Seurat v3",
      selectionBoundary: "For snRNA-seq, three mice representative of each time point were selected from a larger kinematically assessed cohort; captured nuclei are not a tissue-prevalence census.",
      exclusionBoundary: "The paper reports excluding mice with visible hindlimb movement during contusion, bone-hit injuries, kinematic outliers, or behavioral-data loss. The 15 sequenced mice are a selected terminal cross-sectional sample, not repeated longitudinal measurements.",
    },
    rankedMarkerPanelProvenance: {
      sourceRole: "rankedMarkerWorkbook",
      sourceSha256: markerWorkbook.sourceSha256,
      worksheet: markerWorkbook.worksheet,
      sourceRange: markerWorkbook.sourceRange,
      sheetDimension: markerWorkbook.sheetDimension,
      sourceTypeCountInWorkbook: markerWorkbook.sourceTypeCountInWorkbook,
      modeledPopulationCount: markerWorkbook.modeledPopulationCount,
      ranksPerPopulation: markerWorkbook.ranksPerPopulation,
      rankedGeneRecordCount: markerWorkbook.rankedGeneRecordCount,
      derivedPanelSha256: markerWorkbook.derivedPanelSha256,
      digestCanonicalization: markerWorkbook.digestCanonicalization,
      scoreAvailable: false,
      pValueAvailable: false,
      boundary: "The panel contains rank and gene symbol only. The workbook exposes no score, fold change, expression magnitude, specificity statistic or p-value for these columns.",
    },
    timepoints,
    samples,
    populations,
    rareStateEvidence: {
      id: "matson-2022:GSE172167:RAG_cluster_23",
      label: "RAG-expressing neuronal state · independent neuronal cluster 23",
      stateMarkers: ["Atf3", "Sprr1a", "Tnfrsf12a", "Sox11", "Klf6", "Bdnf", "Adcyap1", "Gap43"],
      projectionAssociatedMarkers: ["Lypd1", "Tacr1", "Zfhx3", "Pou6f2", "Tac1"],
      established: [
        "The independent neuronal clustering identified a rare RAG-expressing state after injury.",
        "RNAscope detected Sprr1a and Atf3 from 1 week through 6 weeks post injury.",
        "Most RAG-expressing neurons were excitatory; a small subset expressed Shox2, while co-expression with Chat or Vsx2 was not detected in the reported assay.",
        "Separate tracing and viral-labeling experiments support a major spinocerebellar projection-neuron contribution and post-injury axon/collateral remodeling.",
      ],
      sourceLocators: ["Results; Fig. 4b–q", "Results; Supplementary Figs. 5, 11, 13 and 15", "Results; Fig. 5"],
      boundary: "The RAG state is not one of the 17 label-transfer population records, and the sequencing, RNAscope and tracing observations are not same-cell joins. Spinocerebellar neurons are projection neurons, not local interneurons. Structural remodeling does not by itself establish behavioral recovery or synaptic connectivity.",
    },
    sourceLocators: [
      { id: "MAT-GEO-DESIGN", locator: "GEO GSE172167 — Overall design and 15 GSM sample records", supports: ["conditions", "replicate counts", "sample accessions", "processed file inventory"] },
      { id: "MAT-FIG1", locator: "Article Results and Fig. 1a–e", supports: ["67,903 nuclei", "five timepoints", "three animals per timepoint", "lumbar sampling below thoracic injury"] },
      { id: "MAT-FIG2", locator: "Article Results and Fig. 2a, e–f; Supplementary Figs. 2 and 4", supports: ["23,651 neurons", "17 neuronal populations", "8 excitatory", "8 inhibitory", "motoneuron context", "label transfer"] },
      { id: "MAT-FIG4", locator: "Article Results and Fig. 4; Supplementary Figs. 5, 11, 13 and 15", supports: ["RAG state", "RAG markers", "projection-associated markers", "Shox2 subset", "negative Chat and Vsx2 co-expression"] },
      { id: "MAT-METHODS", locator: "Article Methods — Mice, Surgical procedures, single-nucleus RNA sequencing and analysis", supports: ["female C57BL/6", "12–30 weeks", "T9", "90 kdyn", "representative-animal selection", "sequencing workflow"] },
      { id: "MAT-SUPP-D2", locator: "Supplementary Dataset 2 — top 20 marker genes for 39 source types", supports: ["ranked marker genes", "marker-column aliases", "absence of marker scores and p-values"] },
    ],
    sourceConflicts: [
      {
        id: "MAT-CONFLICT-001",
        topic: "sequencing platform and loading target",
        statements: ["Article Methods: Illumina HiSeq 3000 and 8,000–9,000 nuclei loaded", "GEO series/sample metadata: Illumina HiSeq 2500 and a target of 5,000 nuclei"],
        decision: "Retain both source statements; do not silently select one platform or loading target.",
      },
      {
        id: "MAT-CONFLICT-002",
        topic: "discarded-nucleus arithmetic",
        statements: ["Article Results: 22,435 nuclei discarded", "Supplementary Dataset 7 arithmetic: 90,337 unfiltered minus 67,903 filtered equals 22,434"],
        decision: "Retain the one-nucleus discrepancy as unresolved provenance; final retained count remains 67,903.",
      },
      {
        id: "MAT-CONFLICT-003",
        topic: "D-26 recovery range",
        statements: ["Article Methods: approximately 3,000–7,000 nuclei recovered per sample", "Supplementary Dataset 7 D-26: 13,335 unfiltered and 9,015 filtered nuclei"],
        decision: "Display exact per-sample counts and keep the paper-level range as a conflicting statement.",
      },
      {
        id: "MAT-CONFLICT-004",
        topic: "tissue wording",
        statements: ["GEO extraction-protocol text uses thoracic SCI-site wording", "Paper and sample fields identify L2–S1 lumbar tissue below the T9 lesion"],
        decision: "Model tissue as L2–S1 lumbar because that is the directly described sampled region; retain the GEO wording conflict.",
      },
      {
        id: "MAT-CONFLICT-005",
        topic: "Figure 4l denominator",
        statements: ["Figure 4l caption reports N=6", "The corresponding Source Data worksheet contains five numeric observations"],
        decision: "Do not calculate or display a repaired N; retain the discrepancy for any future cohort-evidence adapter.",
      },
      {
        id: "MAT-CONFLICT-006",
        topic: "F-12 raw-run size anomaly",
        statements: ["F-12/SRX10609386 totals about 0.011 GiB across eight paired runs", "Other samples total roughly 16–51 GiB"],
        decision: "Raw-reprocessing completeness remains unresolved; no raw reconstruction is promised by this release.",
      },
    ],
    globalMissingEvidence: [
      { axis: "cellCoordinates", status: "not_available", reason: "The processed metadata contains no per-nucleus physical coordinate." },
      { axis: "singleCellMorphology", status: "not_measured", reason: "snRNA-seq labels and tissue images do not provide reconstructable single-neuron arbors." },
      { axis: "sameCellProjectionStatus", status: "not_established", reason: "Tracing and sequencing were not performed as a same-cell linkage." },
      { axis: "synapticConnectivity", status: "not_measured", reason: "Axon remodeling and proximity do not identify synaptic partners." },
      { axis: "atlasRegistration", status: "not_established", reason: "No transform registers source nuclei or histology to the project reference anatomy." },
      { axis: "biologicalPrevalence", status: "not_established", reason: "Captured nucleus counts have different library denominators and are not a tissue census." },
      { axis: "causalRecovery", status: "not_established", reason: "The time-course and remodeling observations do not establish that a population is necessary or sufficient for behavioral recovery." },
    ],
    hardBoundaries: [
      "All 17 neuronal labels remain in the Matson/GSE172167 source namespace; exact identity to Russ, Sathyamurthy, morphology, anatomy or SCI evidence records is zero.",
      "The 16 non-motor source populations are spinal-neuron populations, not 16 confirmed local interneuron types; local versus ascending projection status is unresolved at the record level.",
      "Captured nucleus counts and shares describe this processed dataset only and must not be displayed as biological prevalence, cell loss or expansion without the source study's compositional analysis and validation.",
      "The RAG state, molecular population labels, RNAscope cells, dextran-labelled neurons and virally labelled spinocerebellar neurons remain separate observations unless the paper directly links them.",
      "No coordinate, morphology, complete axon, synapse, atlas placement or same-cell cross-modal join may be inferred from this release.",
      "A missing measurement remains an explicit gap and is not evidence that the corresponding biological feature is absent.",
    ],
  };

  check(output.timepoints.reduce((sum, item) => sum + item.totalCapturedNuclei, 0) === output.scope.capturedNucleiCount, "Timepoint total-nucleus denominator drift");
  check(output.timepoints.reduce((sum, item) => sum + item.capturedNeuronalNuclei, 0) === output.scope.capturedNeuronalNucleiCount, "Timepoint neuronal denominator drift");
  check(output.populations.reduce((sum, item) => sum + item.capturedNeuronalNuclei, 0) === output.scope.capturedNeuronalNucleiCount, "Population neuronal denominator drift");

  await writeFile(outputPath, stableJson(output));
  process.stdout.write(`Matson SCI time-course built: ${output.populations.length} populations; ${output.rankedMarkerPanelProvenance.rankedGeneRecordCount} ranked genes; ${output.samples.length} samples; ${output.scope.capturedNeuronalNucleiCount} neuronal nuclei\n`);
}

await main();
