#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADAPTER_PATH = path.join(PROJECT_ROOT, "data/supplementary-morphology-comparison-adapter-0.1.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/supplementary-morphology-comparison-adapter-0.1.schema.json");
const OUTPUT_DIRECTORY = path.join(PROJECT_ROOT, "public/data/supplementary_morphology_comparison_v1");
const ANALYSIS_PATH = path.join(OUTPUT_DIRECTORY, "analysis-delta.json");
const MANIFEST_PATH = path.join(OUTPUT_DIRECTORY, "asset-manifest.json");
const BUILDER_PATH = path.join(PROJECT_ROOT, "tools/build_supplementary_morphology_comparison_adapter.py");
const ALGORITHM_PATH = path.join(PROJECT_ROOT, "tools/build_neuromorpho_analysis.py");
const CENSUS_PATH = path.join(PROJECT_ROOT, "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json");
const EXPECTED_IDS = [45674, 45718, 50394, 50408, 50424, 170035, 249676];
const EXPECTED_ALGORITHM_SHA256 = "10813a83b8c42f6478186bbd752571f5db62391283966b073b08516c9d95a132";
const EXPECTED_ROUTE_SOURCES = [
  {
    contractId: "functional-class-observed-morphology-route-pack-0.1",
    contractPath: "data/functional-class-observed-morphology-route-pack-0.1.json",
    contractSha256: "400b17afd707c3b53ee0cbb1d6402943535111c01402eb3903b256d12e176840",
    contractBytes: 28937,
    assetManifestPath: "public/data/functional_class_observed_morphology_route_pack_v1/asset-manifest.json",
    assetManifestSha256: "a44d7b109357d086d0d7bc27481ee76bdcfe7382e804f74aeb08195b47878f5f",
    assetManifestBytes: 2768,
    supplementaryNeuronIds: [45674, 50424],
  },
  {
    contractId: "premotor-comparison-observed-morphology-route-pack-0.1",
    contractPath: "data/premotor-comparison-observed-morphology-route-pack-0.1.json",
    contractSha256: "39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3",
    contractBytes: 19112,
    assetManifestPath: "public/data/premotor_comparison_observed_morphology_route_pack_v1/asset-manifest.json",
    assetManifestSha256: "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8",
    assetManifestBytes: 1647,
    supplementaryNeuronIds: [45718],
  },
  {
    contractId: "prp-dorsal-horn-observed-morphology-route-pack-0.1",
    contractPath: "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json",
    contractSha256: "a8737dff3fbfe244d36e2af19b32e1dd8142e2626a90c0d89c00881b83eaf709",
    contractBytes: 31435,
    assetManifestPath: "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json",
    assetManifestSha256: "2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f",
    assetManifestBytes: 2766,
    supplementaryNeuronIds: [50394, 50408],
  },
  {
    contractId: "dorsal-horn-observed-morphology-route-pack-0.1",
    contractPath: "data/dorsal-horn-observed-morphology-route-pack-0.1.json",
    contractSha256: "923db6a9ed013e856ffc7c6ab601c67b25608ac68572538c578fd75fa41fe593",
    contractBytes: 42226,
    assetManifestPath: "public/data/dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json",
    assetManifestSha256: "4f64fb595a4362cf0403cb0d3abc3c6fdc14b7f74d473a82ccd67bed9b9dab87",
    assetManifestBytes: 1696,
    supplementaryNeuronIds: [170035, 249676],
  },
];

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(actual, expected) {
  try {
    assert.deepEqual(actual, expected);
    return true;
  } catch {
    return false;
  }
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function repositoryPath(relativePath) {
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  if (!(resolved === PROJECT_ROOT || resolved.startsWith(`${PROJECT_ROOT}${path.sep}`))) {
    throw new Error(`Repository path escapes project root: ${relativePath}`);
  }
  return resolved;
}

function publicPath(publicReceiptPath) {
  if (!publicReceiptPath.startsWith("/data/")) throw new Error(`Unsupported public path ${publicReceiptPath}`);
  return repositoryPath(path.join("public/data", publicReceiptPath.slice("/data/".length)));
}

async function pinnedJson(relativePath, expectedBytes, expectedSha256, label, errors) {
  const bytes = await readFile(repositoryPath(relativePath));
  check(bytes.byteLength === expectedBytes, `${label} byte count drifted`, errors);
  check(digest(bytes) === expectedSha256, `${label} SHA-256 drifted`, errors);
  return JSON.parse(bytes.toString("utf8"));
}

function schemaErrors(validate) {
  return (validate.errors ?? []).map((error) => `- ${error.instancePath || "/"}: ${error.message}`).join("\n");
}

function zeroBoundary(boundary, label, errors) {
  for (const key of [
    "paddingRecordCount",
    "censusExpansionCount",
    "registrationCount",
    "atlasTransformCount",
    "atlasPlacementCount",
    "crossSourceIdentityCount",
    "commonScaleAdmissionCount",
    "commonOrientationAdmissionCount",
    "completeAxonClaimCount",
    "sameSpecimenInternalStructureCount",
    "renderedInternalPrimitiveCount",
  ]) check(boundary?.[key] === 0, `${label}.${key} must remain zero`, errors);
  for (const key of ["commonCoordinateFrameClaim", "commonScaleClaim", "commonOrientationClaim", "combinedCensusClaim"])
    check(boundary?.[key] === false, `${label}.${key} must remain false`, errors);
}

async function routeEvidence(errors) {
  const byNeuronId = new Map();
  for (const source of EXPECTED_ROUTE_SOURCES) {
    const [contract, routeManifest] = await Promise.all([
      pinnedJson(source.contractPath, source.contractBytes, source.contractSha256, `${source.contractId} contract`, errors),
      pinnedJson(source.assetManifestPath, source.assetManifestBytes, source.assetManifestSha256, `${source.contractId} manifest`, errors),
    ]);
    check(contract.contractId === source.contractId, `${source.contractId} identity drifted`, errors);
    check(routeManifest.summary?.registrationCount === 0, `${source.contractId} manifest gained registration`, errors);
    const declarationPaths = new Set();
    for (const declaration of routeManifest.files ?? []) {
      check(!declarationPaths.has(declaration.path), `${source.contractId} duplicates manifest path ${declaration.path}`, errors);
      declarationPaths.add(declaration.path);
      const filePath = path.join(path.dirname(repositoryPath(source.assetManifestPath)), declaration.path);
      const bytes = await readFile(filePath);
      check(bytes.byteLength === declaration.bytes, `${source.contractId}:${declaration.path} bytes drifted`, errors);
      check(digest(bytes) === declaration.sha256, `${source.contractId}:${declaration.path} hash drifted`, errors);
    }
    for (const neuronId of source.supplementaryNeuronIds) {
      const matches = contract.routes.filter((route) => route.sourceRecord?.neuronId === neuronId);
      check(matches.length === 1, `NeuroMorpho:${neuronId} must have exactly one route`, errors);
      if (matches.length !== 1) continue;
      const route = matches[0];
      check(route.censusMembership === false, `NeuroMorpho:${neuronId} entered the census`, errors);
      check(route.geometryReceipt?.registrationStatus === "unregistered", `NeuroMorpho:${neuronId} gained registration`, errors);
      check(route.fidelityRecord?.axon?.completeAxon === false, `NeuroMorpho:${neuronId} gained a complete-axon claim`, errors);
      check(route.renderingContract?.sameSpecimenInternalStructure?.available === false, `NeuroMorpho:${neuronId} gained internal structures`, errors);
      check(route.renderingContract?.sameSpecimenInternalStructure?.renderedPrimitiveCount === 0, `NeuroMorpho:${neuronId} gained internal primitives`, errors);
      check(route.identityBoundary?.crossSourceIdentityCount === 0, `NeuroMorpho:${neuronId} gained cross-source identity`, errors);
      check(route.identityBoundary?.projectRegistrationCount === 0, `NeuroMorpho:${neuronId} gained project registration`, errors);
      check(route.identityBoundary?.coDisplayCreatesRelationship === false, `NeuroMorpho:${neuronId} co-display gained a relationship`, errors);
      if (route.nativeDatContract) {
        check(route.nativeDatContract.parsed === false && route.nativeDatContract.rendered === false, `NeuroMorpho:${neuronId} DAT was parsed or rendered`, errors);
        check(route.nativeDatContract.semanticObjectCountAdmitted === 0 && route.nativeDatContract.renderedPrimitiveCount === 0, `NeuroMorpho:${neuronId} DAT semantics were admitted`, errors);
      }
      byNeuronId.set(neuronId, { route, source, routeManifest });
    }
  }
  return byNeuronId;
}

export async function validateSupplementaryMorphologyComparisonAdapter(
  adapterOverride = null,
  analysisOverride = null,
  manifestOverride = null,
) {
  const [adapterBytes, analysisBytes, manifestBytes, schema, census, builderBytes, algorithmBytes, outputFiles] = await Promise.all([
    readFile(ADAPTER_PATH),
    readFile(ANALYSIS_PATH),
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(CENSUS_PATH, "utf8").then(JSON.parse),
    readFile(BUILDER_PATH),
    readFile(ALGORITHM_PATH),
    readdir(OUTPUT_DIRECTORY),
  ]);
  const adapter = adapterOverride ?? JSON.parse(adapterBytes.toString("utf8"));
  const analysis = analysisOverride ?? JSON.parse(analysisBytes.toString("utf8"));
  const manifest = manifestOverride ?? JSON.parse(manifestBytes.toString("utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  for (const [label, document] of [["adapter", adapter], ["analysis delta", analysis], ["asset manifest", manifest]]) {
    if (!validate(document)) throw new Error(`${label} schema validation failed:\n${schemaErrors(validate)}`);
  }

  const errors = [];
  check(same(outputFiles.sort(), ["analysis-delta.json", "asset-manifest.json"]), "delta directory must contain exactly two JSON files", errors);
  check(digest(algorithmBytes) === EXPECTED_ALGORITHM_SHA256, "analysis algorithm receipt drifted", errors);
  check(manifest.builder.sha256 === digest(builderBytes), "builder receipt drifted", errors);
  check(same(adapter.routeSources, EXPECTED_ROUTE_SOURCES), "adapter route-source receipts drifted", errors);
  check(same(analysis.sourceRoutes, EXPECTED_ROUTE_SOURCES), "analysis route-source receipts drifted", errors);
  check(same(manifest.sources.routeSources, EXPECTED_ROUTE_SOURCES), "manifest route-source receipts drifted", errors);

  const censusIds = census.records.map((record) => record.neuronId);
  check(census.records.length === 142 && census.summary.queryRecordCount === 142, "frozen census denominator drifted", errors);
  check(!EXPECTED_IDS.some((id) => censusIds.includes(id)), "supplementary ID entered the frozen census", errors);
  check(adapter.summary.frozenCensusRecordCount === 142 && adapter.summary.supplementaryRecordCount === 7, "142 + 7 denominators drifted", errors);
  check(adapter.summary.viewableSourceObjectCount === 149 && adapter.summary.combinedCensusClaim === false, "viewable-source arithmetic became a 149-record census claim", errors);
  check(adapter.records.length === 7 && analysis.records.length === 7, "supplementary record denominator drifted", errors);
  const ids = adapter.records.map((record) => record.neuronId);
  const analysisIds = analysis.records.map((record) => record.neuronId);
  check(same(ids, EXPECTED_IDS) && same(analysisIds, EXPECTED_IDS), "supplementary IDs are padded, duplicated, missing, or unsorted", errors);
  const geometryPaths = adapter.records.map((record) => record.geometry.path);
  check(new Set(geometryPaths).size === 7, "supplementary geometry paths are duplicated", errors);
  zeroBoundary(adapter.scientificBoundary, "adapter.scientificBoundary", errors);
  zeroBoundary(analysis.scientificBoundary, "analysis.scientificBoundary", errors);
  check(analysis.aggregationPolicy.crossRecordAggregateCount === 0 && analysis.aggregationPolicy.cohortCount === 0, "unsupported cross-record aggregation was admitted", errors);
  check(manifest.summary.geometryCopyCount === 0 && manifest.summary.swcCopyCount === 0 && manifest.summary.fullContentCopyCount === 0, "delta manifest declares copied geometry, SWC, or full content", errors);

  const routeById = await routeEvidence(errors);
  for (let index = 0; index < adapter.records.length; index += 1) {
    const record = adapter.records[index];
    const analysisRecord = analysis.records[index];
    const evidence = routeById.get(record.neuronId);
    if (!evidence) continue;
    const { route, source, routeManifest } = evidence;
    const membership = {
      collection: "supplementary",
      censusContribution: 0,
      supplementaryContribution: 1,
      routeId: route.routeId,
      routeContractPath: source.contractPath,
      routeContractSha256: source.contractSha256,
      routeAssetManifestPath: source.assetManifestPath,
      routeAssetManifestSha256: source.assetManifestSha256,
    };
    check(same(record.officialMetadata, route.sourceRecord), `NeuroMorpho:${record.neuronId} officialMetadata is not the exact route sourceRecord`, errors);
    check(same(record.comparisonMembership, membership), `NeuroMorpho:${record.neuronId} membership drifted`, errors);
    check(same(analysisRecord.comparisonMembership, membership), `NeuroMorpho:${record.neuronId} analysis membership drifted`, errors);
    check(record.assetId === route.sourceRecord.assetId && record.normalizedMetadata.name === route.sourceRecord.neuronName, `NeuroMorpho:${record.neuronId} identity drifted`, errors);
    check(record.missingness.atlasTransform.value === null && record.missingness.atlasPlacement.value === null, `NeuroMorpho:${record.neuronId} gained atlas evidence`, errors);
    check(record.normalizedMetadata.registrationStatus === "unregistered", `NeuroMorpho:${record.neuronId} normalized registration drifted`, errors);
    check(record.geometry.path === route.sourceObjects.geometry.path && record.geometry.sha256 === route.sourceObjects.geometry.sha256 && record.geometry.bytes === route.sourceObjects.geometry.bytes, `NeuroMorpho:${record.neuronId} geometry receipt drifted`, errors);
    check(record.geometry.rawSwcPath === route.sourceObjects.swc.path && record.geometry.rawSwcSha256 === route.sourceObjects.swc.sha256, `NeuroMorpho:${record.neuronId} SWC receipt drifted`, errors);
    check(record.geometry.canonicalGeometrySha256 === route.geometryReceipt.canonicalGeometrySha256 && record.geometry.topologySha256 === route.geometryReceipt.topologySha256, `NeuroMorpho:${record.neuronId} canonical/topology receipt drifted`, errors);
    check(analysisRecord.sourceGeometry.path === record.geometry.path && analysisRecord.sourceGeometry.sha256 === record.geometry.sha256, `NeuroMorpho:${record.neuronId} analysis geometry receipt drifted`, errors);
    const geometryBytes = await readFile(publicPath(record.geometry.path));
    check(geometryBytes.byteLength === record.geometry.bytes && digest(geometryBytes) === record.geometry.sha256, `NeuroMorpho:${record.neuronId} geometry bytes drifted`, errors);
    const geometry = JSON.parse(geometryBytes.toString("utf8"));
    check(geometry.neuronId === record.neuronId && geometry.name === record.normalizedMetadata.name, `NeuroMorpho:${record.neuronId} geometry identity drifted`, errors);
    check(same(record.qc, geometry.qc), `NeuroMorpho:${record.neuronId} QC drifted`, errors);
    check(same(record.morphometrics.sourceReported, geometry.morphometrics.sourceReported), `NeuroMorpho:${record.neuronId} source morphometrics drifted`, errors);
    check(same(record.morphometrics.computed, geometry.morphometrics.computedFromStandardizedSwc), `NeuroMorpho:${record.neuronId} computed morphometrics drifted`, errors);
    const declaration = routeManifest.files.find((entry) => entry.neuronId === record.neuronId && entry.kind === "lazy_geometry");
    check(Boolean(declaration) && declaration.sha256 === record.geometry.sha256 && declaration.bytes === record.geometry.bytes, `NeuroMorpho:${record.neuronId} route manifest geometry receipt drifted`, errors);
  }

  check(adapter.analysisDelta.sha256 === digest(analysisBytes) && adapter.analysisDelta.bytes === analysisBytes.byteLength, "adapter analysis-delta receipt drifted", errors);
  check(adapter.analysisDelta.assetManifestSha256 === digest(manifestBytes) && adapter.analysisDelta.assetManifestBytes === manifestBytes.byteLength, "adapter delta-manifest receipt drifted", errors);
  check(manifest.files.length === 1 && manifest.files[0].sha256 === digest(analysisBytes) && manifest.files[0].bytes === analysisBytes.byteLength, "delta manifest payload receipt drifted", errors);
  check(analysis.algorithm.sha256 === EXPECTED_ALGORITHM_SHA256 && manifest.sources.analysisAlgorithm.sha256 === EXPECTED_ALGORITHM_SHA256, "generated algorithm receipt drifted", errors);

  if (errors.length) throw new Error(`Supplementary morphology comparison adapter validation failed:\n- ${errors.join("\n- ")}`);
  if (adapterOverride === null && analysisOverride === null && manifestOverride === null) {
    await execFileAsync("python3", [BUILDER_PATH, "--check"], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
      maxBuffer: 1024 * 1024,
    });
  }
  assert.equal(adapter.records.length + adapter.sourceCensus.recordCount, 149);
  return {
    releaseId: adapter.releaseId,
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
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateSupplementaryMorphologyComparisonAdapter()
    .then((report) => process.stdout.write(`Supplementary morphology comparison adapter valid: ${report.frozenCensusRecordCount} census + ${report.supplementaryRecordCount} supplementary = ${report.viewableSourceObjectCount} viewable source objects; ${report.geometryCopyCount} geometry copies, ${report.registrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
