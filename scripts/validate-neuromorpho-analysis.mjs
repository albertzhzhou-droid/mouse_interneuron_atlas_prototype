import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeMorphologyPhenotype,
  MORPHOLOGY_ANALYSIS_METRIC_KEYS,
  summarizeMetric,
  type7Quantile,
  validateMorphologyAnalysisManifest,
  validateMorphologyAnalysisPayload,
} from "../app/morphology-analysis.js";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ANALYSIS_RELATIVE_DIRECTORY = "public/data/neuromorpho_release_8_6_124_analysis_v1";
const CENSUS_RELATIVE_DIRECTORY = "public/data/neuromorpho_release_8_6_124_census_v1";
const EXPECTED_CENSUS_INDEX_SHA256 =
  "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364";
const EXPECTED_CENSUS_MANIFEST_SHA256 =
  "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91";
const EXPECTED_RECORD_COUNT = 142;
const SHOLL_STEP_MICROMETRE = 10;
const NON_ANIMAL_BOUNDARY =
  "one_NeuroMorpho_record_not_an_independent_animal_donor_specimen_or_prevalence_observation";

const SOURCE_TYPE_INTERPRETATIONS = Object.freeze({
  0: "uninterpreted_undefined_type_0",
  1: "soma_type_1",
  2: "axon_type_2",
  3: "dendrite_type_3",
  4: "apical_dendrite_type_4",
  5: "uninterpreted_custom_type_5",
  6: "uninterpreted_neurite_type_6",
  7: "glia_process_type_7",
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeResolve(baseDirectory, relativePath) {
  check(typeof relativePath === "string" && relativePath.length > 0, "declared path is missing");
  const base = resolve(baseDirectory);
  const target = resolve(baseDirectory, relativePath);
  check(target === base || target.startsWith(`${base}${sep}`), `path escapes data directory: ${relativePath}`);
  return target;
}

function numericEqual(left, right, epsilon = 1e-9) {
  return Number.isFinite(left) && Number.isFinite(right) &&
    Math.abs(left - right) <= epsilon * Math.max(1, Math.abs(left), Math.abs(right));
}

function compareNumber(left, right, label) {
  check(numericEqual(left, right), `${label} mismatch: expected ${right}, received ${left}`);
}

function compareSummary(actual, expected, label) {
  check(isRecord(actual), `${label} is missing`);
  check(actual.n === expected.n, `${label}.n mismatch`);
  for (const field of ["min", "q1", "median", "q3", "max"]) {
    compareNumber(actual[field], expected[field], `${label}.${field}`);
  }
}

function interpretationForSourceType(sourceType) {
  return SOURCE_TYPE_INTERPRETATIONS[sourceType] ?? `uninterpreted_unknown_type_${sourceType}`;
}

function preferredCitation(censusRecord) {
  const dois = censusRecord.sourcePaper?.dois;
  const pmids = censusRecord.sourcePaper?.pmids;
  check(Array.isArray(dois) && Array.isArray(pmids), `NeuroMorpho:${censusRecord.neuronId} source citation is invalid`);
  if (dois.length > 0) {
    check(dois.length === 1, `NeuroMorpho:${censusRecord.neuronId} has an ambiguous DOI cohort key`);
    return ["DOI", dois[0]];
  }
  check(pmids.length === 1, `NeuroMorpho:${censusRecord.neuronId} must have one fallback PMID`);
  return ["PMID", pmids[0]];
}

function expectedRecordCohortKey(censusRecord) {
  const [scheme, value] = preferredCitation(censusRecord);
  const metadata = censusRecord.normalizedMetadata;
  return {
    sourceCitation: { scheme, value },
    sourceTertiaryLabel: metadata.cellType[2] ?? "unreported",
    dimensionality: metadata.dimensionality,
    domain: metadata.domain,
    physicalIntegrity: metadata.physicalIntegrity,
  };
}

function cohortTuple(key) {
  return [
    key.sourceCitation?.scheme,
    key.sourceCitation?.value,
    key.sourceTertiaryLabel,
    key.dimensionality,
    key.domain,
    key.physicalIntegrity,
  ];
}

function cohortKeyString(key) {
  return JSON.stringify(cohortTuple(key));
}

function expectedCohortId(key) {
  return `cohort-${sha256(Buffer.from(`${JSON.stringify(cohortTuple(key))}\n`, "utf8")).slice(0, 16)}`;
}

function sourceTypeValue(record, sourceType, field) {
  return record.metrics.bySourceType.find((entry) => entry.sourceType === sourceType)?.[field] ?? 0;
}

function comparePhenotype(actual, expected, label) {
  for (const metricKey of MORPHOLOGY_ANALYSIS_METRIC_KEYS) {
    compareNumber(actual[metricKey], expected[metricKey], `${label}.${metricKey}`);
  }
  check(actual.bySourceType.length === expected.bySourceType.length, `${label}.bySourceType length mismatch`);
  for (const [index, expectedEntry] of expected.bySourceType.entries()) {
    const actualEntry = actual.bySourceType[index];
    check(actualEntry.sourceType === expectedEntry.sourceType, `${label}.bySourceType[${index}].sourceType mismatch`);
    check(actualEntry.interpretation === expectedEntry.interpretation, `${label}.bySourceType[${index}].interpretation mismatch`);
    check(actualEntry.segmentCount === expectedEntry.segmentCount, `${label}.bySourceType[${index}].segmentCount mismatch`);
    check(actualEntry.terminalNodeCount === expectedEntry.terminalNodeCount, `${label}.bySourceType[${index}].terminalNodeCount mismatch`);
    compareNumber(
      actualEntry.cableLengthMicrometre,
      expectedEntry.cableLengthMicrometre,
      `${label}.bySourceType[${index}].cableLengthMicrometre`,
    );
  }
  check(actual.shollProfile.length === expected.shollProfile.length, `${label}.shollProfile length mismatch`);
  for (const [index, expectedEntry] of expected.shollProfile.entries()) {
    const actualEntry = actual.shollProfile[index];
    check(actualEntry.radiusMicrometre === expectedEntry.radiusMicrometre, `${label}.shollProfile[${index}].radius mismatch`);
    check(actualEntry.intersectionCount === expectedEntry.intersectionCount, `${label}.shollProfile[${index}].count mismatch`);
  }
}

export function validateAnalysisManifestIntegrity(
  manifest,
  analysisBytes,
  censusBytes,
  censusManifestBytes,
) {
  validateMorphologyAnalysisManifest(manifest, analysisBytes.byteLength);
  check(sha256(censusBytes) === EXPECTED_CENSUS_INDEX_SHA256, "source census-index SHA-256 mismatch");
  check(sha256(censusManifestBytes) === EXPECTED_CENSUS_MANIFEST_SHA256, "source asset-manifest SHA-256 mismatch");
  check(manifest.source?.censusIndexSha256 === EXPECTED_CENSUS_INDEX_SHA256, "analysis manifest census hash changed");
  check(manifest.source?.assetManifestSha256 === EXPECTED_CENSUS_MANIFEST_SHA256, "analysis manifest source-manifest hash changed");
  check(manifest.source?.geometryRecordCount === EXPECTED_RECORD_COUNT, "analysis manifest geometry count changed");
  const declaration = manifest.files?.[0];
  check(declaration?.sha256 === sha256(analysisBytes), "analysis-index SHA-256 does not match its manifest");
  check(declaration?.bytes === analysisBytes.byteLength, "analysis-index byte count does not match its manifest");
  return manifest;
}

export function validateAnalysisDocumentSemantics(analysis, census) {
  validateMorphologyAnalysisPayload(analysis, census);
  check(analysis.analysisPolicy?.shollPolicy?.radiusStepMicrometre === SHOLL_STEP_MICROMETRE, "Sholl radius step changed");
  check(analysis.analysisPolicy?.quantilePolicy?.method === "Hyndman-Fan_type_7_linear_interpolation", "quantile policy changed");
  check(analysis.analysisPolicy?.cohortPolicy?.dimensionality === "2D_and_3D_are_never_implicitly_pooled", "dimensionality partition policy changed");

  const censusById = new Map(census.records.map((record) => [record.neuronId, record]));
  const analysisById = new Map(analysis.records.map((record) => [record.neuronId, record]));
  check(censusById.size === EXPECTED_RECORD_COUNT && analysisById.size === EXPECTED_RECORD_COUNT, "record identity set changed");

  for (const record of analysis.records) {
    const source = censusById.get(record.neuronId);
    check(source, `analysis contains unknown NeuroMorpho:${record.neuronId}`);
    check(record.denominatorBoundary?.analysisUnit === "NeuroMorpho_record", `NeuroMorpho:${record.neuronId} analysis unit changed`);
    check(record.denominatorBoundary?.recordCountContribution === 1, `NeuroMorpho:${record.neuronId} contribution changed`);
    check(record.denominatorBoundary?.boundary === NON_ANIMAL_BOUNDARY, `NeuroMorpho:${record.neuronId} denominator boundary changed`);
    for (const field of ["independentAnimalCount", "independentDonorCount", "independentSpecimenCount", "prevalenceDenominator"]) {
      check(record.denominatorBoundary?.[field]?.value === null, `NeuroMorpho:${record.neuronId} invents ${field}`);
    }
    check(record.dimensionality === source.normalizedMetadata.dimensionality, `NeuroMorpho:${record.neuronId} dimensionality changed`);
    check(record.domain === source.normalizedMetadata.domain, `NeuroMorpho:${record.neuronId} domain changed`);
    check(record.physicalIntegrity === source.normalizedMetadata.physicalIntegrity, `NeuroMorpho:${record.neuronId} integrity changed`);
    check(record.sourceGeometry?.path === source.geometry.path, `NeuroMorpho:${record.neuronId} geometry path changed`);
    check(record.sourceGeometry?.sha256 === source.geometry.sha256, `NeuroMorpho:${record.neuronId} geometry hash changed`);
    check(record.metrics.bySourceType.every((entry) => entry.sourceType !== 1), `NeuroMorpho:${record.neuronId} includes source type 1 as neurite`);
    for (const entry of record.metrics.bySourceType) {
      check(entry.interpretation === interpretationForSourceType(entry.sourceType), `NeuroMorpho:${record.neuronId} source-type interpretation changed`);
    }
  }

  const expectedGroups = new Map();
  for (const source of census.records) {
    const key = expectedRecordCohortKey(source);
    const groupKey = cohortKeyString(key);
    const current = expectedGroups.get(groupKey) ?? { key, neuronIds: [] };
    current.neuronIds.push(source.neuronId);
    expectedGroups.set(groupKey, current);
  }
  check(analysis.cohorts.length === expectedGroups.size, "analysis cohort count does not match exact census partition");
  const seen = new Set();
  for (const cohort of analysis.cohorts) {
    const group = expectedGroups.get(cohortKeyString(cohort.cohortKey));
    check(group, `${cohort.cohortId} has a non-source cohort key`);
    check(cohort.cohortId === expectedCohortId(cohort.cohortKey), `${cohort.cohortId} is not the deterministic cohort ID`);
    check(cohort.denominatorBoundary?.analysisUnit === "NeuroMorpho_record", `${cohort.cohortId} analysis unit changed`);
    check(cohort.denominatorBoundary?.boundary === NON_ANIMAL_BOUNDARY, `${cohort.cohortId} denominator boundary changed`);
    check(cohort.denominatorBoundary?.n === cohort.neuronIds.length, `${cohort.cohortId} record denominator changed`);
    check(JSON.stringify(cohort.neuronIds) === JSON.stringify([...group.neuronIds].sort((a, b) => a - b)), `${cohort.cohortId} membership changed`);
    check(new Set(cohort.neuronIds.map((id) => analysisById.get(id)?.dimensionality)).size === 1, `${cohort.cohortId} pools dimensionalities`);
    check(cohort.neuronIds.every((id) => analysisById.get(id)?.dimensionality === cohort.cohortKey.dimensionality), `${cohort.cohortId} dimensionality key changed`);
    for (const neuronId of cohort.neuronIds) {
      check(!seen.has(neuronId), `NeuroMorpho:${neuronId} is assigned to multiple cohorts`);
      seen.add(neuronId);
    }

    const records = cohort.neuronIds.map((id) => analysisById.get(id));
    for (const metricKey of MORPHOLOGY_ANALYSIS_METRIC_KEYS) {
      compareSummary(
        cohort.metricSummaries?.[metricKey],
        summarizeMetric(records.map((record) => record.metrics[metricKey])),
        `${cohort.cohortId}.${metricKey}`,
      );
    }
    const sourceTypes = [...new Set(records.flatMap((record) => record.metrics.bySourceType.map((entry) => entry.sourceType)))].sort((a, b) => a - b);
    check(cohort.bySourceTypeMetricSummaries.length === sourceTypes.length, `${cohort.cohortId} source-type summaries changed`);
    for (const [index, sourceType] of sourceTypes.entries()) {
      const actual = cohort.bySourceTypeMetricSummaries[index];
      check(actual.sourceType === sourceType, `${cohort.cohortId} source type ordering changed`);
      check(actual.interpretation === interpretationForSourceType(sourceType), `${cohort.cohortId} source type interpretation changed`);
      for (const field of ["segmentCount", "terminalNodeCount", "cableLengthMicrometre"]) {
        compareSummary(
          actual[field],
          summarizeMetric(records.map((record) => sourceTypeValue(record, sourceType, field))),
          `${cohort.cohortId}.type${sourceType}.${field}`,
        );
      }
    }

    const profileMaps = records.map((record) => new Map(record.metrics.shollProfile.map((entry) => [entry.radiusMicrometre, entry.intersectionCount])));
    let maximumRadius = 0;
    for (const profile of profileMaps) {
      for (const radius of profile.keys()) maximumRadius = Math.max(maximumRadius, radius);
    }
    const expectedProfile = [];
    for (let radius = SHOLL_STEP_MICROMETRE; radius <= maximumRadius; radius += SHOLL_STEP_MICROMETRE) {
      const values = profileMaps.map((profile) => profile.get(radius) ?? 0);
      expectedProfile.push({ radiusMicrometre: radius, n: records.length, medianIntersectionCount: type7Quantile(values, 0.5) });
    }
    check(cohort.shollMedianProfile.length === expectedProfile.length, `${cohort.cohortId} Sholl summary length changed`);
    for (const [index, expected] of expectedProfile.entries()) {
      const actual = cohort.shollMedianProfile[index];
      check(actual.radiusMicrometre === expected.radiusMicrometre, `${cohort.cohortId} Sholl radius changed`);
      check(actual.n === expected.n, `${cohort.cohortId} Sholl denominator changed`);
      compareNumber(actual.medianIntersectionCount, expected.medianIntersectionCount, `${cohort.cohortId} Sholl median`);
    }
  }
  check(seen.size === EXPECTED_RECORD_COUNT, "cohort partition does not cover all records exactly once");
  return analysis;
}

export async function validateNeuromorphoAnalysis({ projectRoot = PROJECT_ROOT } = {}) {
  const analysisDirectory = resolve(projectRoot, ANALYSIS_RELATIVE_DIRECTORY);
  const censusDirectory = resolve(projectRoot, CENSUS_RELATIVE_DIRECTORY);
  const [manifestBytes, analysisBytes, censusBytes, censusManifestBytes] = await Promise.all([
    readFile(resolve(analysisDirectory, "asset-manifest.json")),
    readFile(resolve(analysisDirectory, "analysis-index.json")),
    readFile(resolve(censusDirectory, "census-index.json")),
    readFile(resolve(censusDirectory, "asset-manifest.json")),
  ]);
  const manifest = JSON.parse(manifestBytes);
  const analysis = JSON.parse(analysisBytes);
  const census = JSON.parse(censusBytes);
  const censusManifest = JSON.parse(censusManifestBytes);

  validateAnalysisManifestIntegrity(manifest, analysisBytes, censusBytes, censusManifestBytes);
  validateAnalysisDocumentSemantics(analysis, census);

  const sourceDeclarations = new Map(
    censusManifest.files
      .filter((declaration) => declaration.kind === "lazy_geometry")
      .map((declaration) => [declaration.path, declaration]),
  );
  const analysisById = new Map(analysis.records.map((record) => [record.neuronId, record]));
  for (const source of census.records) {
    const record = analysisById.get(source.neuronId);
    const declaration = sourceDeclarations.get(source.geometry.path);
    check(declaration?.neuronId === source.neuronId, `NeuroMorpho:${source.neuronId} is missing from source manifest`);
    check(declaration.sha256 === source.geometry.sha256, `NeuroMorpho:${source.neuronId} source manifest hash changed`);
    check(declaration.bytes === source.geometry.bytes, `NeuroMorpho:${source.neuronId} source manifest bytes changed`);
    const geometryPath = safeResolve(censusDirectory, source.geometry.path);
    const geometryBytes = await readFile(geometryPath);
    const geometryStat = await stat(geometryPath);
    check(geometryStat.isFile(), `NeuroMorpho:${source.neuronId} geometry is not a file`);
    check(geometryBytes.byteLength === source.geometry.bytes, `NeuroMorpho:${source.neuronId} geometry bytes mismatch`);
    check(sha256(geometryBytes) === source.geometry.sha256, `NeuroMorpho:${source.neuronId} geometry SHA-256 mismatch`);
    const geometry = JSON.parse(geometryBytes);
    check(geometry.neuronId === source.neuronId, `NeuroMorpho:${source.neuronId} geometry identity mismatch`);
    const recomputed = computeMorphologyPhenotype(geometry.nodes, { shollStepMicrometre: SHOLL_STEP_MICROMETRE });
    comparePhenotype(record.metrics, recomputed, `NeuroMorpho:${source.neuronId}`);
  }

  return {
    recordCount: analysis.records.length,
    cohortCount: analysis.cohorts.length,
    dimensionalityCounts: analysis.summary.byDimensionality,
    recordsWithSourceType6: analysis.summary.recordsWithSourceType6,
    registrationCount: analysis.summary.registrationCount,
    analysisIndexSha256: sha256(analysisBytes),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await validateNeuromorphoAnalysis();
    console.log(
      `NeuroMorpho morphology analysis valid: ${result.recordCount} records; ` +
      `${result.cohortCount} exact cohorts; ${result.recordsWithSourceType6} type-6 records; ` +
      `${result.registrationCount} registrations.`,
    );
  } catch (error) {
    console.error(`NeuroMorpho morphology analysis validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
