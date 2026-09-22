import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { validateSupplementaryMorphologyComparisonAdapter } from "../scripts/validate-supplementary-morphology-comparison-adapter-0.1.mjs";

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADAPTER_PATH = path.join(PROJECT_ROOT, "data/supplementary-morphology-comparison-adapter-0.1.json");
const ANALYSIS_PATH = path.join(PROJECT_ROOT, "public/data/supplementary_morphology_comparison_v1/analysis-delta.json");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "public/data/supplementary_morphology_comparison_v1/asset-manifest.json");
const BUILDER_PATH = path.join(PROJECT_ROOT, "tools/build_supplementary_morphology_comparison_adapter.py");
const OUTPUT_DIRECTORY = path.dirname(ANALYSIS_PATH);
const [adapter, analysis, manifest] = await Promise.all([
  readFile(ADAPTER_PATH, "utf8").then(JSON.parse),
  readFile(ANALYSIS_PATH, "utf8").then(JSON.parse),
  readFile(MANIFEST_PATH, "utf8").then(JSON.parse),
]);
const adapterClone = () => structuredClone(adapter);
const analysisClone = () => structuredClone(analysis);

test("validates the exact 142 census + 7 supplementary comparison layer", async () => {
  assert.deepEqual(await validateSupplementaryMorphologyComparisonAdapter(), {
    releaseId: "ohri-supplementary-morphology-comparison-adapter-0.1.0",
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableSourceObjectCount: 149,
    combinedCensusClaim: false,
    analysisRecordCount: 7,
    geometryCopyCount: 0,
    swcCopyCount: 0,
    registrationCount: 0,
    crossSourceIdentityCount: 0,
    completeAxonClaimCount: 0,
    renderedInternalPrimitiveCount: 0,
  });
});

test("exposes the requested census-compatible records and exact membership fields", () => {
  assert.deepEqual(adapter.records.map((record) => record.neuronId), [45674, 45718, 50394, 50408, 50424, 170035, 249676]);
  for (const record of adapter.records) {
    assert.deepEqual(Object.keys(record).sort(), [
      "assetId",
      "comparisonMembership",
      "geometry",
      "missingness",
      "morphometrics",
      "neuronId",
      "normalizedMetadata",
      "officialMetadata",
      "qc",
      "sourcePaper",
    ]);
    assert.equal(record.officialMetadata.neuronId, record.neuronId);
    assert.equal(record.comparisonMembership.collection, "supplementary");
    assert.equal(record.comparisonMembership.censusContribution, 0);
    assert.equal(record.comparisonMembership.supplementaryContribution, 1);
    assert.equal(record.missingness.atlasTransform.value, null);
    assert.equal(record.missingness.atlasPlacement.value, null);
  }
});

test("rejects duplicate IDs, duplicate geometry paths, and unsupported padding", async () => {
  const duplicateId = adapterClone();
  duplicateId.records[1].neuronId = duplicateId.records[0].neuronId;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(duplicateId), /IDs|identity|schema/i);

  const duplicateGeometry = adapterClone();
  duplicateGeometry.records[1].geometry.path = duplicateGeometry.records[0].geometry.path;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(duplicateGeometry), /geometry paths|geometry receipt/i);

  const padded = adapterClone();
  padded.records.push(structuredClone(padded.records[0]));
  padded.summary.supplementaryRecordCount = 8;
  padded.summary.viewableSourceObjectCount = 150;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(padded), /schema|must be equal|must NOT have more/i);
});

test("rejects receipt drift and analysis/source mismatch", async () => {
  const membership = adapterClone();
  membership.records[0].comparisonMembership.routeContractSha256 = "0".repeat(64);
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(membership), /membership|receipt/i);

  const geometry = adapterClone();
  geometry.records[0].geometry.sha256 = "0".repeat(64);
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(geometry), /geometry receipt|geometry bytes/i);

  const analysisGeometry = analysisClone();
  analysisGeometry.records[0].sourceGeometry.sha256 = "0".repeat(64);
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(null, analysisGeometry), /analysis geometry receipt/i);
});

test("rejects registration, identity, common-frame, complete-axon, and internal-detail promotion", async () => {
  const registration = adapterClone();
  registration.scientificBoundary.registrationCount = 1;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(registration), /registrationCount|schema/i);

  const identity = adapterClone();
  identity.summary.crossSourceIdentityCount = 1;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(identity), /crossSourceIdentityCount|schema/i);

  const commonScale = adapterClone();
  commonScale.scientificBoundary.commonScaleClaim = true;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(commonScale), /commonScaleClaim|schema/i);

  const commonOrientation = adapterClone();
  commonOrientation.scientificBoundary.commonOrientationClaim = true;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(commonOrientation), /commonOrientationClaim|schema/i);

  const completeAxon = adapterClone();
  completeAxon.summary.completeAxonClaimCount = 1;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(completeAxon), /completeAxonClaimCount|schema/i);

  const internals = adapterClone();
  internals.summary.renderedInternalPrimitiveCount = 1;
  await assert.rejects(() => validateSupplementaryMorphologyComparisonAdapter(internals), /renderedInternalPrimitiveCount|schema/i);
});

test("builder check is byte-deterministic and public delta contains no geometry or SWC copies", async () => {
  const first = await execFileAsync("python3", [BUILDER_PATH, "--check"], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  const second = await execFileAsync("python3", [BUILDER_PATH, "--check"], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  assert.equal(first.stdout, second.stdout);
  assert.deepEqual((await readdir(OUTPUT_DIRECTORY)).sort(), ["analysis-delta.json", "asset-manifest.json"]);
  assert.equal(manifest.summary.directoryFileCount, 2);
  assert.equal(manifest.summary.geometryCopyCount, 0);
  assert.equal(manifest.summary.swcCopyCount, 0);
  assert.deepEqual(manifest.files.map((entry) => entry.path), ["analysis-delta.json"]);
});
