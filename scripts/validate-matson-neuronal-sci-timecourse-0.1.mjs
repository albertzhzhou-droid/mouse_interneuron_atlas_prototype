import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";
import {
  MATSON_NEURONAL_MARKER_ALIASES,
  canonicalMatsonMarkerPanel,
  sha256Bytes,
} from "../tools/parse_matson_marker_workbook.mjs";

const DATA_URL = new URL("../data/matson-neuronal-sci-timecourse-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/matson-neuronal-sci-timecourse-0.1.schema.json", import.meta.url);

const EXPECTED_TIMEPOINTS = ["uninjured", "1dpi", "1wpi", "3wpi", "6wpi"];
const EXPECTED_POPULATIONS = [
  "Cpne4 Neurons",
  "Maf Neurons",
  "Reln Neurons",
  "Rreb1 Neurons",
  "Sox5 Neurons",
  "Megf11 Neurons",
  "ME Neurons",
  "VE Neurons",
  "Adamts5 Neurons",
  "Cdh3 Neurons",
  "Pdyn Neurons",
  "Npy Neurons",
  "Chat Neurons",
  "MI Neurons",
  "VI Neurons",
  "CSF-c Neurons",
  "Motoneurons",
];
const EXPECTED_SOURCE_HASHES = new Map([
  ["metadata", "5aabb2cd5f43b3c7a7f872e170dda470afb84a0b1dbfd7da2a248ba52c608554"],
  ["familySoft", "81022a11cc604dec4f018d29d44925fd198b4b38e66ab5e5026923bd5266ca71"],
]);
const MARKER_WORKBOOK_SHA256 = "ce390abbaf5a6b4ca376e03112a34141f105774918339c59a3614c98d20b6c74";
const DERIVED_MARKER_PANEL_SHA256 = "7b071d49c43816321fb24a3c31fb9282abf559d9b990a48549278410e85769a4";

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function nearlyEqual(a, b) {
  return Math.abs(a - b) <= 0.0000005;
}

export async function validateMatsonSciTimecourse(value) {
  const [timecourse, schema] = await Promise.all([
    value ? Promise.resolve(value) : readFile(DATA_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(timecourse)) errors.push(...formatSchemaErrors(validate.errors));

  check(timecourse.scope?.exactCrossSourceIdentityCount === 0, "exact cross-source identity count must remain 0", errors);
  check(timecourse.scope?.projectRegistrationCount === 0, "project registration count must remain 0", errors);
  check(timecourse.scope?.independentAnimalCount === 15, "independent-animal denominator must remain 15", errors);
  check(timecourse.scope?.capturedNucleiCount === 67903, "captured-nucleus denominator must remain 67,903", errors);
  check(timecourse.scope?.capturedNeuronalNucleiCount === 23651, "captured-neuronal-nucleus denominator must remain 23,651", errors);
  check(timecourse.scope?.spinalSegments === "L2–S1", "sampled spinal-segment scope must remain L2–S1", errors);
  check(JSON.stringify(timecourse.scope?.rootsAttached) === JSON.stringify(["proximal dorsal roots", "proximal ventral roots"]), "attached-root scope changed", errors);

  const sourceFiles = timecourse.source?.sourceFiles ?? [];
  check(sourceFiles.length === 2, "two exact non-bundled source objects are required", errors);
  for (const source of sourceFiles) {
    check(EXPECTED_SOURCE_HASHES.get(source.role) === source.sha256, `${source.role}: source SHA-256 drift`, errors);
    check(source.bundled === false, `${source.role}: raw source file must not be bundled`, errors);
    check(source.derivedFactualCountsBundled === true, `${source.role}: derived factual count status changed`, errors);
    check(source.assetLevelReuseStatus === "not_assumed", `${source.role}: asset reuse must not be assumed`, errors);
  }
  const markerWorkbook = timecourse.source?.articleSupplementReferences?.[0];
  check(markerWorkbook?.bytes === 16885, "ranked-marker workbook byte count drift", errors);
  check(markerWorkbook?.sha256 === MARKER_WORKBOOK_SHA256, "ranked-marker workbook SHA-256 drift", errors);
  check(markerWorkbook?.bundled === false && markerWorkbook?.derivedRankedMarkersBundled === true, "ranked-marker workbook bundling boundary changed", errors);
  const markerProvenance = timecourse.rankedMarkerPanelProvenance ?? {};
  check(markerProvenance.sourceSha256 === MARKER_WORKBOOK_SHA256, "ranked-marker panel provenance source hash drift", errors);
  check(markerProvenance.derivedPanelSha256 === DERIVED_MARKER_PANEL_SHA256, "derived ranked-marker panel SHA-256 drift", errors);
  check(markerProvenance.worksheet === "Sheet1" && markerProvenance.sourceRange === "A1:Q21", "ranked-marker workbook locator changed", errors);
  check(markerProvenance.sourceTypeCountInWorkbook === 39, "ranked-marker workbook source-type denominator changed", errors);
  check(markerProvenance.modeledPopulationCount === 17 && markerProvenance.ranksPerPopulation === 20 && markerProvenance.rankedGeneRecordCount === 340, "ranked-marker panel 17 × 20 denominator changed", errors);
  check(markerProvenance.scoreAvailable === false && markerProvenance.pValueAvailable === false, "ranked-marker panel statistics were invented", errors);

  const timepoints = timecourse.timepoints ?? [];
  check(JSON.stringify(timepoints.map((item) => item.id)) === JSON.stringify(EXPECTED_TIMEPOINTS), "timepoint identity or order changed", errors);
  check(timepoints.every((item) => item.independentAnimalCount === 3 && item.sampleIds?.length === 3 && item.geoAccessions?.length === 3), "each timepoint must retain three independent animals and GSM samples", errors);
  check(sum(timepoints.map((item) => item.totalCapturedNuclei)) === 67903, "timepoint total-nucleus denominators do not sum to 67,903", errors);
  check(sum(timepoints.map((item) => item.capturedNeuronalNuclei)) === 23651, "timepoint neuronal denominators do not sum to 23,651", errors);

  const samples = timecourse.samples ?? [];
  const sampleIds = new Set(samples.map((sample) => sample.id));
  const gsmIds = new Set(samples.map((sample) => sample.geoAccession));
  check(samples.length === 15 && sampleIds.size === 15 && gsmIds.size === 15, "15 unique source/GSM samples are required", errors);
  check(samples.every((sample) => sample.independentAnimalCount === 1), "each sample must remain one independent animal/cord", errors);
  check(sum(samples.map((sample) => sample.totalCapturedNuclei)) === 67903, "sample total-nucleus denominators do not sum to 67,903", errors);
  check(sum(samples.map((sample) => sample.capturedNeuronalNuclei)) === 23651, "sample neuronal denominators do not sum to 23,651", errors);
  for (const timepoint of timepoints) {
    const matching = samples.filter((sample) => sample.timepointId === timepoint.id);
    check(matching.length === 3, `${timepoint.id}: sample count changed`, errors);
    check(sum(matching.map((sample) => sample.totalCapturedNuclei)) === timepoint.totalCapturedNuclei, `${timepoint.id}: total-nucleus denominator drift`, errors);
    check(sum(matching.map((sample) => sample.capturedNeuronalNuclei)) === timepoint.capturedNeuronalNuclei, `${timepoint.id}: neuronal denominator drift`, errors);
    check(JSON.stringify(matching.map((sample) => sample.id)) === JSON.stringify(timepoint.sampleIds), `${timepoint.id}: sample identifiers drift`, errors);
    check(JSON.stringify(matching.map((sample) => sample.geoAccession)) === JSON.stringify(timepoint.geoAccessions), `${timepoint.id}: GSM identifiers drift`, errors);
  }

  const populations = timecourse.populations ?? [];
  check(JSON.stringify(populations.map((population) => population.sourceLabel)) === JSON.stringify(EXPECTED_POPULATIONS), "17 source-local population labels or order changed", errors);
  check(new Set(populations.map((population) => population.id)).size === 17, "population focus IDs must be unique", errors);
  check(sum(populations.map((population) => population.capturedNeuronalNuclei)) === 23651, "population counts do not partition the neuronal denominator", errors);
  check(populations.filter((population) => population.projectUseClass === "source_local_spinal_neuron_population_local_vs_projection_unresolved").length === 16, "16 non-motor populations must remain local-vs-projection unresolved", errors);
  check(populations.filter((population) => population.projectUseClass === "motor_neuron_context_excluded_from_interneuron_count").length === 1, "one motor-neuron context population is required", errors);
  for (const [populationIndex, population] of populations.entries()) {
    check(population.timepointCounts?.length === 5, `${population.id}: five timepoint observations required`, errors);
    check(population.sampleCounts?.length === 15, `${population.id}: 15 sample observations required`, errors);
    check(sum(population.timepointCounts?.map((item) => item.count) ?? []) === population.capturedNeuronalNuclei, `${population.id}: timepoint counts do not sum to population denominator`, errors);
    check(sum(population.sampleCounts?.map((item) => item.count) ?? []) === population.capturedNeuronalNuclei, `${population.id}: sample counts do not sum to population denominator`, errors);
    check(JSON.stringify(population.timepointCounts?.map((item) => item.timepointId)) === JSON.stringify(EXPECTED_TIMEPOINTS), `${population.id}: timepoint count order changed`, errors);
    check(JSON.stringify(population.sampleCounts?.map((item) => item.sampleId)) === JSON.stringify(samples.map((sample) => sample.id)), `${population.id}: sample count order changed`, errors);
    check(population.timepointCounts?.every((item) => nearlyEqual(item.shareOfCapturedNeuronalNuclei, Number((item.count / item.capturedNeuronalNucleiDenominator).toFixed(6)))), `${population.id}: captured-nucleus share drift`, errors);
    check(population.evidenceBoundary?.match(/not a confirmed local interneuron|motor-neuron context/i), `${population.id}: local/projection or motor boundary missing`, errors);
    check(Object.values(population.missingEvidence ?? {}).every((status) => /not_/.test(status)), `${population.id}: unsupported evidence axis was promoted`, errors);
    const markerPanel = population.rankedMarkerPanel ?? {};
    const expectedAlias = MATSON_NEURONAL_MARKER_ALIASES[populationIndex];
    const expectedColumn = String.fromCharCode(65 + populationIndex);
    const rankedGenes = markerPanel.rankedGenes ?? [];
    check(markerPanel.markerColumnAlias === expectedAlias, `${population.id}: ranked-marker column alias drift`, errors);
    check(markerPanel.worksheet === "Sheet1", `${population.id}: ranked-marker worksheet drift`, errors);
    check(markerPanel.headerCell === `${expectedColumn}1` && markerPanel.rankCellRange === `${expectedColumn}2:${expectedColumn}21`, `${population.id}: ranked-marker workbook cell range drift`, errors);
    check(rankedGenes.length === 20, `${population.id}: all 20 ranked genes are required`, errors);
    check(JSON.stringify(rankedGenes.map((item) => item.rank)) === JSON.stringify(Array.from({ length: 20 }, (_, index) => index + 1)), `${population.id}: ranked marker order drift`, errors);
    check(JSON.stringify(rankedGenes.map((item) => item.sourceCell)) === JSON.stringify(Array.from({ length: 20 }, (_, index) => `${expectedColumn}${index + 2}`)), `${population.id}: ranked marker source-cell order drift`, errors);
    check(new Set(rankedGenes.map((item) => item.gene)).size === 20, `${population.id}: ranked marker genes must be unique within the source column`, errors);
    check(markerPanel.sourceRankCount === 20 && markerPanel.retainedRankCount === 20, `${population.id}: complete marker denominator changed`, errors);
    check(markerPanel.scoreAvailable === false && markerPanel.pValueAvailable === false, `${population.id}: absent marker statistics were invented`, errors);
    check(markerPanel.sourceSha256 === MARKER_WORKBOOK_SHA256, `${population.id}: ranked marker source hash drift`, errors);
  }
  const canonicalMarkerPopulations = populations.map((population) => population.rankedMarkerPanel ?? {});
  const derivedMarkerPanelSha256 = sha256Bytes(Buffer.from(canonicalMatsonMarkerPanel(canonicalMarkerPopulations), "utf8"));
  check(derivedMarkerPanelSha256 === DERIVED_MARKER_PANEL_SHA256, "derived ranked-marker panel content drift", errors);
  check(derivedMarkerPanelSha256 === markerProvenance.derivedPanelSha256, "ranked-marker panel provenance does not match population records", errors);
  for (const timepoint of timepoints) {
    check(sum(populations.map((population) => population.timepointCounts.find((item) => item.timepointId === timepoint.id)?.count ?? 0)) === timepoint.capturedNeuronalNuclei, `${timepoint.id}: population-by-timepoint counts do not partition the neuronal denominator`, errors);
  }
  for (const sample of samples) {
    check(sum(populations.map((population) => population.sampleCounts.find((item) => item.sampleId === sample.id)?.count ?? 0)) === sample.capturedNeuronalNuclei, `${sample.id}: population-by-sample counts do not partition the neuronal denominator`, errors);
  }

  const rag = timecourse.rareStateEvidence ?? {};
  check(rag.id === "matson-2022:GSE172167:RAG_cluster_23", "RAG state identity changed", errors);
  check((rag.stateMarkers ?? []).includes("Atf3") && (rag.stateMarkers ?? []).includes("Sprr1a") && (rag.stateMarkers ?? []).includes("Gap43"), "RAG state markers are incomplete", errors);
  check(/not one of the 17 label-transfer population records/i.test(rag.boundary ?? ""), "RAG state must remain separate from 17 population records", errors);
  check(/not same-cell joins/i.test(rag.boundary ?? ""), "RAG sequencing, histology and tracing observations must remain unjoined", errors);
  check(/projection neurons, not local interneurons/i.test(rag.boundary ?? ""), "spinocerebellar projection status boundary missing", errors);
  check(/does not by itself establish behavioral recovery or synaptic connectivity/i.test(rag.boundary ?? ""), "RAG structural evidence must not become recovery or connectivity evidence", errors);

  const serialized = JSON.stringify(timecourse);
  for (const forbidden of ["atlasTransform", "morphologyId", "sameCellId", "registeredCoordinate", "synapticPartnerId"]) {
    check(!serialized.includes(`"${forbidden}"`), `forbidden unsupported relationship field ${forbidden}`, errors);
  }
  check((timecourse.globalMissingEvidence ?? []).length >= 7, "global missing-evidence axes are incomplete", errors);
  check((timecourse.sourceConflicts ?? []).length === 6, "six declared Matson source conflicts are required", errors);
  check((timecourse.sourceConflicts ?? []).every((conflict) => /retain|display|do not|remains/i.test(conflict.decision)), "source conflicts must retain an explicit non-silent decision", errors);
  check((timecourse.hardBoundaries ?? []).some((item) => /missing measurement.*not evidence/i.test(item)), "missing measurements must remain distinct from biological absence", errors);

  if (errors.length) {
    throw new Error(`Matson neuronal SCI time-course validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
  return {
    releaseId: timecourse.releaseId,
    timepointCount: timepoints.length,
    sampleCount: samples.length,
    populationCount: populations.length,
    rankedGeneRecordCount: markerProvenance.rankedGeneRecordCount,
    capturedNeuronalNucleiCount: timecourse.scope.capturedNeuronalNucleiCount,
    projectRegistrationCount: 0,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  const result = await validateMatsonSciTimecourse();
  console.log(`Matson neuronal SCI time-course validation passed: ${result.populationCount} populations; ${result.rankedGeneRecordCount} ranked genes; ${result.sampleCount} samples; ${result.timepointCount} timepoints; ${result.capturedNeuronalNucleiCount} neuronal nuclei; 0 project registrations`);
}
