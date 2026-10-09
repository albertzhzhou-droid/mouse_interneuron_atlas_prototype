#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_ROOT = path.join(PROJECT_ROOT, "tests");
const TEST_CONCURRENCY = 4;
// 2.41 never sealed: missing production data at resume. 2.42 validates its recovered contracts.
const HISTORICAL_REBUILD_TESTS = new Set([
  "research-iteration-manifest-2.58.test.mjs",
  "research-iteration-manifest-2.57.test.mjs",
  "research-iteration-manifest-2.59.test.mjs",
  "research-iteration-manifest-2.60.test.mjs",
  "research-iteration-manifest-2.61.test.mjs",
  "research-iteration-manifest-2.62.test.mjs",
  "research-iteration-manifest-2.63.test.mjs",
  "research-iteration-manifest-2.64.test.mjs",
  "research-iteration-manifest-2.65.test.mjs",
  "research-iteration-manifest-2.67.test.mjs",
  "research-iteration-manifest-2.68.test.mjs",
  "research-iteration-manifest-2.69.test.mjs",
  "research-iteration-manifest-2.70.test.mjs",
  "research-iteration-manifest-2.71.test.mjs",
  "research-iteration-manifest-2.72.test.mjs",
  "research-iteration-manifest-2.73.test.mjs",
  "research-iteration-manifest-2.41.test.mjs",
  "research-iteration-manifest-2.42.test.mjs",
  "research-iteration-manifest-2.49.test.mjs",
  "research-iteration-manifest-2.50.test.mjs",
  "research-iteration-manifest-2.51.test.mjs",
  "research-iteration-manifest-2.52.test.mjs",
  "research-iteration-manifest-2.45.test.mjs",
  "research-iteration-manifest-2.46.test.mjs",
  "research-iteration-manifest-2.47.test.mjs",
  "research-iteration-manifest-2.48.test.mjs",
  "research-iteration-manifest-2.44.test.mjs",
  "research-iteration-manifest-2.28.test.mjs",
  "research-iteration-manifest-2.29.test.mjs",
  "research-iteration-manifest-2.30.test.mjs",
  "research-iteration-manifest-2.31.test.mjs",
  "research-iteration-manifest-2.32.test.mjs",
  "research-iteration-manifest-2.33.test.mjs",
  "research-iteration-manifest-2.34.test.mjs",
  "research-iteration-manifest-2.35.test.mjs",
  "research-iteration-manifest-2.36.test.mjs",
  "research-iteration-manifest-2.37.test.mjs",
  "research-iteration-manifest-2.38.test.mjs",
  "research-iteration-manifest-2.39.test.mjs",
  "research-iteration-manifest-2.40.test.mjs",
]);

const files = (await readdir(TEST_ROOT))
  .filter((name) => name.endsWith(".test.mjs") && !HISTORICAL_REBUILD_TESTS.has(name))
  .toSorted()
  .map((name) => path.join("tests", name));

if (!files.includes("tests/research-iteration-manifest-2.28-snapshot.test.mjs")) {
  throw new Error("Immutable 2.28 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.29-snapshot.test.mjs")) {
  throw new Error("Immutable 2.29 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.30-snapshot.test.mjs")) {
  throw new Error("Immutable 2.30 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.31-snapshot.test.mjs")) {
  throw new Error("Immutable 2.31 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.32-snapshot.test.mjs")) {
  throw new Error("Immutable 2.32 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.33-snapshot.test.mjs")) {
  throw new Error("Immutable 2.33 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.34-snapshot.test.mjs")) {
  throw new Error("Immutable 2.34 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.35-snapshot.test.mjs")) {
  throw new Error("Immutable 2.35 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.36-snapshot.test.mjs")) {
  throw new Error("Immutable 2.36 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.37-snapshot.test.mjs")) {
  throw new Error("Immutable 2.37 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.38-snapshot.test.mjs")) {
  throw new Error("Immutable 2.38 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.39-snapshot.test.mjs")) {
  throw new Error("Immutable 2.39 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.40-snapshot.test.mjs")) {
  throw new Error("Immutable 2.40 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.42-snapshot.test.mjs")) {
  throw new Error("Immutable 2.42 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.53.test.mjs")) {
  throw new Error("Immutable 2.53 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.54.test.mjs")) {
  throw new Error("Immutable 2.54 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.55.test.mjs")) {
  throw new Error("Immutable 2.55 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.56.test.mjs")) {
  throw new Error("Immutable 2.56 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.57-snapshot.test.mjs")) {
  throw new Error("Immutable 2.57 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.58-snapshot.test.mjs")) {
  throw new Error("Immutable 2.58 snapshot tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.59.test.mjs") || files.includes("tests/research-iteration-manifest-2.59.test.mjs")) {
  throw new Error("2.59 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/research-iteration-manifest-2.59-snapshot.test.mjs")) {
  throw new Error("Immutable 2.59 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.60-snapshot.test.mjs")) {
  throw new Error("Immutable 2.60 release snapshot tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.61.test.mjs") || files.includes("tests/research-iteration-manifest-2.61.test.mjs")) {
  throw new Error("2.61 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/research-iteration-manifest-2.61-snapshot.test.mjs")) {
  throw new Error("Immutable 2.61 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.62-snapshot.test.mjs")) {
  throw new Error("Immutable 2.62 release snapshot tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.63.test.mjs") || files.includes("tests/research-iteration-manifest-2.63.test.mjs")) {
  throw new Error("2.63 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/research-iteration-manifest-2.63-snapshot.test.mjs")) {
  throw new Error("Immutable 2.63 release snapshot tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.64.test.mjs") || files.includes("tests/research-iteration-manifest-2.64.test.mjs")) {
  throw new Error("2.64 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/research-iteration-manifest-2.64-snapshot.test.mjs")) {
  throw new Error("Immutable 2.64 release snapshot tests are missing");
}
if (!files.includes("tests/svara-larval-zebrafish-spinal-sbem-reference.test.mjs")) {
  throw new Error("Svara comparative SBEM reference tests are missing");
}
if (!files.includes("tests/microstructformer-ultrastructure-reference.test.mjs")) {
  throw new Error("MicroStructFormer ultrastructure-reference tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.65-snapshot.test.mjs")) {
  throw new Error("Immutable 2.65 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.66.test.mjs")) {
  throw new Error("Immutable 2.66 release snapshot tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.67.test.mjs") || files.includes("tests/research-iteration-manifest-2.67.test.mjs")) {
  throw new Error("2.67 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/research-iteration-manifest-2.67-snapshot.test.mjs")) {
  throw new Error("Immutable 2.67 release snapshot tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.68.test.mjs") || files.includes("tests/research-iteration-manifest-2.68.test.mjs")) {
  throw new Error("2.68 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/research-iteration-manifest-2.68-snapshot.test.mjs")) {
  throw new Error("Immutable 2.68 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.69-snapshot.test.mjs")) {
  throw new Error("Immutable 2.69 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.70-snapshot.test.mjs")) {
  throw new Error("Immutable 2.70 release snapshot tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.71.test.mjs") || files.includes("tests/research-iteration-manifest-2.71.test.mjs")) {
  throw new Error("2.71 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/research-iteration-manifest-2.71-snapshot.test.mjs")) {
  throw new Error("Immutable 2.71 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.72-snapshot.test.mjs")) {
  throw new Error("Immutable 2.72 release snapshot tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.72.test.mjs") || files.includes("tests/research-iteration-manifest-2.72.test.mjs")) {
  throw new Error("2.72 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/research-iteration-manifest-2.73-snapshot.test.mjs")) {
  throw new Error("Immutable 2.73 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.74.test.mjs")) {
  throw new Error("Immutable 2.74 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.75-snapshot.test.mjs")) {
  throw new Error("Immutable 2.75 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.76-snapshot.test.mjs")) {
  throw new Error("Immutable 2.76 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.77-snapshot.test.mjs")) {
  throw new Error("Immutable 2.77 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.78-snapshot.test.mjs")) {
  throw new Error("Immutable 2.78 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.79-snapshot.test.mjs")) {
  throw new Error("Immutable 2.79 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.80-snapshot.test.mjs")) {
  throw new Error("Immutable 2.80 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.81-snapshot.test.mjs")) {
  throw new Error("Immutable 2.81 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.82-snapshot.test.mjs")) {
  throw new Error("Immutable 2.82 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.83-snapshot.test.mjs")) {
  throw new Error("Immutable 2.83 release snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.85-snapshot.test.mjs")) {
  throw new Error("Immutable 2.85 release snapshot tests are missing");
}
if (!files.includes("tests/trevisan-v1-age-atlas-reference.test.mjs")) {
  throw new Error("Trevisan V1 article-derived age-atlas reference tests are missing");
}
if (!files.includes("tests/trevisan-v1-source-data-availability-audit.test.mjs")) {
  throw new Error("Trevisan V1 source-data availability audit tests are missing");
}
if (!files.includes("tests/trevisan-v1-geo-series-sample-audit.test.mjs")) {
  throw new Error("Trevisan V1 GEO sample-audit tests are missing");
}
if (!files.includes("tests/exact-record-detail-coverage.test.mjs")) {
  throw new Error("UPG-251 active-record detail coverage tests are missing");
}
if (!files.includes("tests/open-mouse-spinal-fibsem-near-miss-audit.test.mjs")) {
  throw new Error("UPG-249 open mouse spinal FIB-SEM near-miss tests are missing");
}
if (!HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.73.test.mjs") || files.includes("tests/research-iteration-manifest-2.73.test.mjs")) {
  throw new Error("2.73 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/evidence-aware-3d-representation-0.7.test.mjs")) {
  throw new Error("Evidence-aware 3D representation contract 0.7 tests are missing");
}
if (!files.includes("tests/neuromorpho-type-source-doi-overlap-audit.test.mjs")) {
  throw new Error("UPG-246 NeuroMorpho type-source DOI coverage tests are missing");
}
if (!files.includes("tests/neuromorpho-release-8-6-126-ui-query-audit.test.mjs")) {
  throw new Error("NeuroMorpho 8.6.126 UI-query audit tests are missing");
}
if (!files.includes("tests/neuromorpho-release-8-6-126-todd-stable-id-audit.test.mjs")) {
  throw new Error("UPG-245 stable-ID release-delta tests are missing");
}
if (!files.includes("tests/mouse-spinal-em-repository-search-audit.test.mjs")) {
  throw new Error("UPG-243 bounded open-EM search tests are missing");
}
if (!files.includes("tests/morphology-render-mode.test.mjs")) {
  throw new Error("Shared source-authority morphology render-mode tests are missing");
}
if (HISTORICAL_REBUILD_TESTS.has("research-iteration-manifest-2.62.test.mjs") && files.includes("tests/research-iteration-manifest-2.62.test.mjs")) {
  throw new Error("2.62 dynamic rebuild test must remain excluded after its immutable snapshot is sealed");
}
if (!files.includes("tests/todd-native-contour-topology-audit.test.mjs")) {
  throw new Error("Todd native contour topology tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.43.test.mjs")) {
  throw new Error("Immutable 2.43 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.44-snapshot.test.mjs")) {
  throw new Error("Immutable 2.44 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.45-snapshot.test.mjs")) {
  throw new Error("Immutable 2.45 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.46-snapshot.test.mjs")) {
  throw new Error("Immutable 2.46 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.47-snapshot.test.mjs")) {
  throw new Error("Immutable 2.47 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.48-snapshot.test.mjs")) {
  throw new Error("Immutable 2.48 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.49-snapshot.test.mjs")) {
  throw new Error("Immutable 2.49 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.50-snapshot.test.mjs")) {
  throw new Error("Immutable 2.50 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.51-snapshot.test.mjs")) {
  throw new Error("Immutable 2.51 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.52-snapshot.test.mjs")) {
  throw new Error("Immutable 2.52 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.53.test.mjs")) {
  throw new Error("Current 2.53 release tests are missing");
}
if (!files.includes("tests/koh-public-input-route-audit-0.1.test.mjs")) {
  throw new Error("UPG-260 public-input route audit tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.89-snapshot.test.mjs")) {
  throw new Error("Immutable 2.89 research iteration snapshot tests are missing");
}
if (!files.includes("tests/neurolucida-dat-swc-crosswalk-0.1.test.mjs")) {
  throw new Error("UPG-192 DAT↔SWC crosswalk tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.90-snapshot.test.mjs")) {
  throw new Error("Immutable 2.90 research iteration snapshot tests are missing");
}

process.stdout.write(
  `Running ${files.length} current tests with concurrency ${TEST_CONCURRENCY}; immutable release snapshots are checked by snapshot validators rather than rebuilt from newer live inputs.\n`,
);
const child = spawn(process.execPath, ["--test", `--test-concurrency=${TEST_CONCURRENCY}`, ...files], {
  cwd: PROJECT_ROOT,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Current research tests terminated by ${signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
