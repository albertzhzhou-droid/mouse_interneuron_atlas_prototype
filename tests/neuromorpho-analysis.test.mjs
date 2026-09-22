import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  computeMorphologyPhenotype,
  summarizeMetric,
  type7Quantile,
  validateMorphologyAnalysisManifest,
  validateMorphologyAnalysisPayload,
} from "../app/morphology-analysis.js";
import {
  validateAnalysisDocumentSemantics,
  validateAnalysisManifestIntegrity,
  validateNeuromorphoAnalysis,
} from "../scripts/validate-neuromorpho-analysis.mjs";

const ANALYSIS_BASE_URL = new URL(
  "../public/data/neuromorpho_release_8_6_124_analysis_v1/",
  import.meta.url,
);
const CENSUS_BASE_URL = new URL(
  "../public/data/neuromorpho_release_8_6_124_census_v1/",
  import.meta.url,
);
const [analysisBytes, manifestBytes, censusBytes, censusManifestBytes] = await Promise.all([
  readFile(new URL("analysis-index.json", ANALYSIS_BASE_URL)),
  readFile(new URL("asset-manifest.json", ANALYSIS_BASE_URL)),
  readFile(new URL("census-index.json", CENSUS_BASE_URL)),
  readFile(new URL("asset-manifest.json", CENSUS_BASE_URL)),
]);
const analysis = JSON.parse(analysisBytes);
const manifest = JSON.parse(manifestBytes);
const census = JSON.parse(censusBytes);

test("validates all 142 morphology phenotypes against checksum-pinned geometry", async () => {
  const result = await validateNeuromorphoAnalysis();
  assert.equal(result.recordCount, 142);
  assert.equal(result.cohortCount, 7);
  assert.equal(result.recordsWithSourceType6, 2);
  assert.equal(result.registrationCount, 0);
  assert.deepEqual(result.dimensionalityCounts, [
    { count: 2, value: "2D" },
    { count: 140, value: "3D" },
  ]);
});

test("locks source hashes and calls both browser-facing validators", () => {
  assert.equal(validateMorphologyAnalysisManifest(manifest, analysisBytes.byteLength), manifest);
  assert.equal(validateMorphologyAnalysisPayload(analysis, census), analysis);
  assert.equal(
    validateAnalysisManifestIntegrity(
      manifest,
      analysisBytes,
      censusBytes,
      censusManifestBytes,
    ),
    manifest,
  );
  assert.equal(validateAnalysisDocumentSemantics(analysis, census), analysis);
});

test("computes a source-local bifurcating tree and excludes type-1 soma edges", () => {
  const phenotype = computeMorphologyPhenotype(
    [
      [1, 1, 0, 0, 0, 1, -1],
      [2, 1, 1, 0, 0, 0.8, 1],
      [3, 3, 2, 0, 0, 0.5, 2],
      [4, 3, 3, 0, 0, 0.5, 3],
      [5, 3, 4, 1, 0, 0.4, 4],
      [6, 3, 4, -1, 0, 0.4, 4],
    ],
    { shollStepMicrometre: 1 },
  );
  assert.equal(phenotype.stemCount, 1);
  assert.equal(phenotype.terminalNodeCount, 2);
  assert.equal(phenotype.bifurcationNodeCount, 1);
  assert.equal(phenotype.maximumCentrifugalBranchOrder, 1);
  assert.equal(phenotype.maximumRootPathLengthMicrometre, 2 + Math.SQRT2);
  assert.equal(phenotype.maximumRootEuclideanDistanceMicrometre, Math.sqrt(17));
  assert.equal(phenotype.neuriteCableLengthMicrometre, 2 + 2 * Math.SQRT2);
  assert.deepEqual(phenotype.bySourceType, [
    {
      sourceType: 3,
      interpretation: "dendrite_type_3",
      segmentCount: 4,
      terminalNodeCount: 2,
      cableLengthMicrometre: 2 + 2 * Math.SQRT2,
    },
  ]);
  assert.deepEqual(phenotype.shollProfile, [
    { radiusMicrometre: 1, intersectionCount: 0 },
    { radiusMicrometre: 2, intersectionCount: 1 },
    { radiusMicrometre: 3, intersectionCount: 1 },
    { radiusMicrometre: 4, intersectionCount: 2 },
  ]);
});

test("traverses a 20,000-node source-local chain without recursive stack overflow", () => {
  const nodes = Array.from({ length: 20_000 }, (_, index) => {
    const nodeId = index + 1;
    return nodeId === 1
      ? [nodeId, 1, 0, 0, 0, 1, -1]
      : [nodeId, 3, 1, 0, 0, 0.5, nodeId - 1];
  });
  const phenotype = computeMorphologyPhenotype(nodes, { shollStepMicrometre: 10 });
  assert.equal(phenotype.stemCount, 1);
  assert.equal(phenotype.terminalNodeCount, 1);
  assert.equal(phenotype.bifurcationNodeCount, 0);
  assert.equal(phenotype.neuriteCableLengthMicrometre, 1);
  assert.deepEqual(phenotype.shollProfile, []);
});

test("counts both crossings when a neurite segment has both endpoints outside a Sholl sphere", () => {
  const phenotype = computeMorphologyPhenotype(
    [
      [1, 1, 0, 0, 0, 1, -1],
      [2, 1, -2, 0, 0, 1, 1],
      [3, 3, 2, 0, 0, 0.5, 2],
    ],
    { shollStepMicrometre: 1 },
  );
  assert.deepEqual(phenotype.shollProfile, [
    { radiusMicrometre: 1, intersectionCount: 2 },
    { radiusMicrometre: 2, intersectionCount: 1 },
  ]);
});

test("uses the half-open Sholl endpoint interval so a shared endpoint counts once", () => {
  const phenotype = computeMorphologyPhenotype(
    [
      [1, 1, 0, 0, 0, 1, -1],
      [2, 3, 1, 0, 0, 0.5, 1],
      [3, 3, 2, 0, 0, 0.5, 2],
    ],
    { shollStepMicrometre: 1 },
  );
  assert.deepEqual(phenotype.shollProfile, [
    { radiusMicrometre: 1, intersectionCount: 1 },
    { radiusMicrometre: 2, intersectionCount: 1 },
  ]);
});

test("preserves source type 6 as uninterpreted and never reports source type 1 as neurite", () => {
  const phenotype = computeMorphologyPhenotype([
    [1, 1, 0, 0, 0, 1, -1],
    [2, 1, 1, 0, 0, 0.8, 1],
    [3, 6, 5, 0, 0, 0.5, 2],
  ]);
  assert.equal(phenotype.neuriteCableLengthMicrometre, 4);
  assert.deepEqual(phenotype.bySourceType, [
    {
      sourceType: 6,
      interpretation: "uninterpreted_neurite_type_6",
      segmentCount: 1,
      terminalNodeCount: 1,
      cableLengthMicrometre: 4,
    },
  ]);
  assert.ok(phenotype.bySourceType.every((entry) => entry.sourceType !== 1));
});

test("rejects invalid roots, source types, and cyclic or disconnected topology", () => {
  assert.throws(
    () => computeMorphologyPhenotype([
      [1, 1, 0, 0, 0, 1, -1],
      [2, 1, 1, 0, 0, 1, -1],
    ]),
    /exactly one root/,
  );
  assert.throws(
    () => computeMorphologyPhenotype([
      [1, 3, 0, 0, 0, 1, -1],
      [2, 3, 1, 0, 0, 1, 1],
    ]),
    /root must retain source type 1/,
  );
  assert.throws(
    () => computeMorphologyPhenotype([
      [1, 1, 0, 0, 0, 1, -1],
      [2, -1, 1, 0, 0, 1, 1],
    ]),
    /node 2 is invalid/,
  );
  assert.throws(
    () => computeMorphologyPhenotype([
      [1, 1, 0, 0, 0, 1, -1],
      [2, 3, 1, 0, 0, 1, 3],
      [3, 3, 2, 0, 0, 1, 2],
    ]),
    /cycle|disconnected/,
  );
});

test("implements explicit Hyndman-Fan type-7 cohort summaries", () => {
  assert.equal(type7Quantile([1, 2, 9, 10], 0.25), 1.75);
  assert.deepEqual(summarizeMetric([1, 2, 9, 10]), {
    n: 4,
    min: 1,
    q1: 1.75,
    median: 5.5,
    q3: 9.25,
    max: 10,
  });
});

test("rejects invented denominators and dimensionality-partition drift", () => {
  const inventedDenominator = structuredClone(analysis);
  inventedDenominator.records[0].denominatorBoundary.independentAnimalCount.value = 1;
  assert.throws(
    () => validateAnalysisDocumentSemantics(inventedDenominator, census),
    /invents independentAnimalCount/,
  );

  const pooledDimensionality = structuredClone(analysis);
  const cohort = pooledDimensionality.cohorts.find((candidate) => candidate.cohortKey.dimensionality === "2D");
  cohort.cohortKey.dimensionality = "3D";
  assert.throws(
    () => validateAnalysisDocumentSemantics(pooledDimensionality, census),
    /non-source cohort key|dimensionality/,
  );
});

test("rejects analysis and pinned-source hash mutations", () => {
  const mutatedManifest = structuredClone(manifest);
  mutatedManifest.files[0].sha256 = "0".repeat(64);
  assert.throws(
    () => validateAnalysisManifestIntegrity(
      mutatedManifest,
      analysisBytes,
      censusBytes,
      censusManifestBytes,
    ),
    /analysis-index SHA-256/,
  );

  const mutatedSource = structuredClone(manifest);
  mutatedSource.source.censusIndexSha256 = "f".repeat(64);
  assert.throws(
    () => validateAnalysisManifestIntegrity(
      mutatedSource,
      analysisBytes,
      censusBytes,
      censusManifestBytes,
    ),
    /census hash/,
  );
});

test("passes the standalone morphology-analysis validator", () => {
  const scriptPath = new URL("../scripts/validate-neuromorpho-analysis.mjs", import.meta.url).pathname;
  const result = spawnSync(process.execPath, [scriptPath], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /142 records; 7 exact cohorts; 2 type-6 records; 0 registrations/);
});
