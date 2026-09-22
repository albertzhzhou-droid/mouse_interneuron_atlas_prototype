import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [viewerSource, comparisonSource, loaderSource, censusDataSource, adapter] = await Promise.all([
  readFile(new URL("../app/MorphologyViewer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/MorphologyComparePanel.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/supplementary-morphology-comparison.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/morphology-census-data.ts", import.meta.url), "utf8"),
  readFile(new URL("../data/supplementary-morphology-comparison-adapter-0.1.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("wires the exact supplementary adapter into only the source-object comparator", () => {
  assert.match(viewerSource, /supplementaryMorphologyRecords/);
  assert.match(viewerSource, /\.\.\.records\.map\(asFrozenCensusComparisonRecord\)[\s\S]*\.\.\.supplementaryMorphologyRecords/);
  assert.match(viewerSource, /supplementaryAnalysisRecords=\{supplementaryAnalysisState\.records\}/);
  assert.match(viewerSource, /comparisonIds=\{matrixComparisonIds\}/);
  assert.match(viewerSource, /records=\{records\}[\s\S]*comparisonIds=\{matrixComparisonIds\}/);
  assert.match(comparisonSource, /comparisonMembership\.collection === "supplementary"/);
  assert.match(comparisonSource, /149<\/b><span>declared release objects/);
  assert.match(comparisonSource, /Runtime index: \{indexedCensusRecordCount\} census \+ \{indexedSupplementaryRecordCount\} supplementary/);
  assert.match(comparisonSource, /selectedRecords\.length >= MORPHOLOGY_MATRIX_MIN_SELECTIONS/);
  assert.match(comparisonSource, /verifiedGeometryReceipts\.get\(record\.neuronId\) === record\.geometry\.sha256/);
  assert.match(comparisonSource, /window\.addEventListener\("popstate", restoreModes\)/);
  assert.match(comparisonSource, /analysisState\.sha256/);
  assert.match(comparisonSource, /supplementaryAnalysisSha256/);
  assert.match(comparisonSource, /never a 149-record census/);
});

test("keeps direct route geometry paths and verifies bytes before rendering", () => {
  assert.deepEqual(adapter.records.map((record) => record.neuronId), [45674, 45718, 50394, 50408, 50424, 170035, 249676]);
  assert.ok(adapter.records.every((record) => record.geometry.path.startsWith("/data/") && record.geometry.available));
  assert.equal(new Set(adapter.records.map((record) => record.geometry.path)).size, 7);
  assert.match(censusDataSource, /path\.startsWith\("\/"\) \? path :/);
  assert.match(censusDataSource, /bytes\.byteLength !== record\.geometry\.bytes/);
  assert.match(censusDataSource, /sha256Hex\(bytes\) !== record\.geometry\.sha256/);
});

test("fails the supplementary analysis delta closed without weakening the census analysis", () => {
  assert.match(loaderSource, /assetManifestBytes/);
  assert.match(loaderSource, /supplementary analysis manifest receipt mismatch/);
  assert.match(loaderSource, /supplementary analysis checksum changed/);
  assert.match(loaderSource, /summary\.directoryFileCount !== 2/);
  assert.match(loaderSource, /summary\.geometryCopyCount !== 0/);
  assert.match(loaderSource, /setState\(\{[\s\S]*status: "unavailable"[\s\S]*records: \[\]/);
  assert.match(viewerSource, /const analysisState = useMorphologyAnalysis\(\);/);
  assert.match(viewerSource, /const supplementaryAnalysisState = useSupplementaryMorphologyAnalysis\(\);/);
});
