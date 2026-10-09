#!/usr/bin/env node
/** Offline same-source counts from existing lossless annotation masks; writes no volume. */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addSamplingLabelRows, analyzeSourceSampling, buildNestedMidpointSampling,
  validateSamplingIndices, validateSamplingStateRuns,
} from "../app/atlas-sampling-sensitivity.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "data/atlas-sampling-sensitivity-0.1.json";
const NATIVE_DIRECTORY = "public/data/allen_cord_20um_native_volume_v2";
const CURRENT_DIRECTORY = "public/data/allen_cord_20um_v3_0";
const HISTORICAL_DIRECTORY = "release/curator-review/OHRI-Mouse-Interneuron-Atlas-2.8.0-curator.1/site/data/allen_cord_20um_v3_0";
const SOURCE_MANIFEST_SHA256 = "95f305de7b19274908ac5dd24abfa5a0e6544effad1bfdd7d542b177a27cfad1";
const SEMANTIC_SHA256 = "1e5ee2daaeabd3505572f5efdb92e700387f7bd794720e78ec21511338500d12";
const SHAPE = [1567, 253, 322];
const PINS = {
  [`${NATIVE_DIRECTORY}/asset-manifest.json`]: "d77b526acc6a80326f75ba3131e885f9d7841b5d01b184daa3651a48f1e85c20",
  [`${CURRENT_DIRECTORY}/asset-manifest.json`]: "75aa6dc5cbeb05b52eff2266751a700cced23c9b1ea2f880bede19bd03e225c8",
  [`${CURRENT_DIRECTORY}/source-atlas-manifest.json`]: SOURCE_MANIFEST_SHA256,
  [`${HISTORICAL_DIRECTORY}/asset-manifest.json`]: "bf43b0fb45fc51e7811cb551820c310c3a1468b1e175fbdb30625faf4893eb85",
  "tools/build_atlas_reference.py": "8454e9e7f0109050348f2b4db5e57d344c0227b180eb72f76a64097a0012a852",
  "docs/SPATIAL_ASSET_PROVENANCE.md": "323aae0f2f8df17bf700fb43deb7c400e149185c874d783e586b0d54ef1c4194",
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function requireContract(condition, message) { if (!condition) throw new Error(message); }

async function buildReport() {
  const receipts = [];
  async function readChecked(path, expectedHash = PINS[path], expectedBytes = null) {
    requireContract(typeof expectedHash === "string" && /^[a-f0-9]{64}$/.test(expectedHash), `Missing input pin: ${path}`);
    const bytes = await readFile(resolve(ROOT, path));
    requireContract(sha256(bytes) === expectedHash && (expectedBytes === null || bytes.length === expectedBytes), `Input bytes or SHA-256 changed: ${path}`);
    receipts.push({ path, bytes: bytes.length, algorithm: "sha256", checksum: expectedHash });
    return bytes;
  }
  const native = JSON.parse(await readChecked(`${NATIVE_DIRECTORY}/asset-manifest.json`));
  const current = JSON.parse(await readChecked(`${CURRENT_DIRECTORY}/asset-manifest.json`));
  const historical = JSON.parse(await readChecked(`${HISTORICAL_DIRECTORY}/asset-manifest.json`));
  await readChecked(`${CURRENT_DIRECTORY}/source-atlas-manifest.json`);
  const generatorText = (await readChecked("tools/build_atlas_reference.py")).toString("utf8");
  const provenanceText = (await readChecked("docs/SPATIAL_ASSET_PROVENANCE.md")).toString("utf8");
  requireContract(generatorText.includes("BASE_Z_INDICES = tuple(range(0, 1520, 49)) + (1566,)") &&
    generatorText.includes("ADDED_SOURCE_STATE_Z_INDICES = (27, 77, 172, 811, 1106)"), "Historical 33-plane declaration changed");
  requireContract(provenanceText.includes("previous 33-plane") && provenanceText.includes("27/32 runs"), "Historical grid provenance declaration changed");
  requireContract(native.sourceVolume.semanticSha256 === SEMANTIC_SHA256 && native.sourceVolume.sourceManifestSha256 === SOURCE_MANIFEST_SHA256 &&
    equal(native.sourceVolume.shapeZyx, SHAPE) && equal(native.sourceVolume.resolutionUmZyx, [20, 10, 10]) && native.sourceVolume.orientation === "asr" &&
    native.geometryStatus === "INF" && native.measurementUse === "forbidden" && native.registrationCount === 0 &&
    native.records.length === 73 && native.totals.sourceVoxelCount === 38845542 &&
    native.sourceVolume.semanticHashAlgorithm === "sha256_uint32_little_endian_c_order_full_1567x253x322", "Native annotation contract changed");
  for (const asset of [historical, current]) {
    requireContract(asset.sourceManifestSha256 === SOURCE_MANIFEST_SHA256 && equal(asset.shapeZyx, SHAPE) &&
      asset.coordinateSpaceId === native.coordinateSpaceId && asset.geometryStatus === "INF", "Sampling grid belongs to a different source/frame");
  }
  const runs = native.sourceVolume.sourceStateRuns;
  validateSamplingStateRuns(runs, SHAPE[0]);
  requireContract(runs.length === 32, "Pinned source-state count changed");
  // Existing PNG file receipts prove the 15/38 lists occur in actual outputs.
  async function verifyPlaneAssets(asset, directory, expectedCount) {
    validateSamplingIndices(asset.sampledZIndices, SHAPE[0]);
    const planes = asset.files.filter((file) => /^slice-z\d+\.png$/.test(file.path));
    requireContract(planes.length === expectedCount && equal(planes.map((file) => file.zIndex), asset.sampledZIndices), "Actual plane files disagree with grid declaration");
    for (const file of planes) await readChecked(`${directory}/${file.path}`, file.sha256, file.bytes);
  }
  await verifyPlaneAssets(historical, HISTORICAL_DIRECTORY, 15);
  await verifyPlaneAssets(current, CURRENT_DIRECTORY, 38);
  requireContract(new Uint8Array(new Uint32Array([1]).buffer)[0] === 1, "Canonical source hashes require a little-endian runtime");
  // Only the 32 unique XY planes reside in memory. Repeated z bytes feed the
  // digest directly; no full-volume array, downloaded asset or volume output.
  const planes = runs.map(() => new Uint32Array(SHAPE[1] * SHAPE[2]));
  const labels = [];
  const recordIds = native.records.map((record) => record.identifier).sort((a, b) => a - b);
  requireContract(equal(recordIds, [...native.directLeafIdentifiers].sort((a, b) => a - b)), "Direct label inventory changed");
  for (const receipt of [...native.records].sort((a, b) => a.identifier - b.identifier)) {
    requireContract(/^structures\/(interneuron-focused|structural-context|motor-context)\/atlas-id-\d+\.json$/.test(receipt.path), "Invalid native record path");
    const record = JSON.parse(await readChecked(`${NATIVE_DIRECTORY}/${receipt.path}`, receipt.sha256, receipt.bytes));
    requireContract(record.identifier === receipt.identifier && record.annotationValue === receipt.identifier &&
      record.semanticLaneId === receipt.semanticLaneId && record.name === receipt.name &&
      record.sourceVolumeSemanticSha256 === SEMANTIC_SHA256 && record.coordinateSpaceId === native.coordinateSpaceId &&
      equal(record.shapeZyx, SHAPE) && equal(record.resolutionUmZyx, [20, 10, 10]) && record.orientation === "asr" &&
      record.selectionMode === "exact_identifier_only" && record.geometryStatus === "INF" && record.measurementUse === "forbidden" && record.registrationCount === 0 &&
      record.mask.encoding === "32_source_state_runs_with_exact_xy_row_rle" && equal(record.mask.rowTuple, ["y", "x_start", "length"]) &&
      record.mask.sourceStateRuns.length === runs.length && record.mask.sourceVoxelCount === receipt.sourceVoxelCount, "Label encoding, identity or source frame changed");
    const planeVoxelCounts = runs.map((run, index) => {
      const encoded = record.mask.sourceStateRuns[index];
      requireContract(encoded.stateIndex === run.stateIndex && encoded.zStartInclusive === run.zStartInclusive && encoded.zEndInclusive === run.zEndInclusive &&
        encoded.planeSha256 === run.sha256, "Label mask state belongs to a different source run");
      const count = addSamplingLabelRows(planes[index], encoded.rowsYxStartLength, record.identifier, SHAPE[1], SHAPE[2]);
      requireContract(count === encoded.planeVoxelCount, "Row-RLE voxel count changed");
      return count;
    });
    labels.push({ identifier: record.identifier, name: record.name, semanticLaneId: record.semanticLaneId, fullSourceVoxelCount: receipt.sourceVoxelCount, planeVoxelCounts });
  }
  const fullSemanticDigest = createHash("sha256");
  for (const [index, run] of runs.entries()) {
    const bytes = Buffer.from(planes[index].buffer);
    requireContract(sha256(bytes) === run.sha256, `Reconstructed annotation plane does not match source-state ${run.stateIndex}`);
    for (let z = run.zStartInclusive; z <= run.zEndInclusive; z += 1) fullSemanticDigest.update(bytes);
  }
  requireContract(fullSemanticDigest.digest("hex") === SEMANTIC_SHA256, "Reconstructed full annotation semantic SHA-256 changed");
  const base33 = Array.from({ length: 32 }, (_, index) => index * 49).concat(1566);
  const added = [27, 77, 172, 811, 1106];
  requireContract(equal([...base33, ...added].sort((a, b) => a - b), current.sampledZIndices), "Current 38 grid does not match declared base plus source-state repairs");
  const strategies = [
    { id: "archived_15", label: "Archived 15 planes", evidenceStatus: "actual_archived_plane_assets_verified", sampledZIndices: historical.sampledZIndices,
      definition: "Exact sampledZIndices and 15 checksummed slice PNGs from 2.8.0-curator.1; replayed against the pinned annotation masks.", evidenceLocators: [`${HISTORICAL_DIRECTORY}/asset-manifest.json#/sampledZIndices`] },
    { id: "declared_33", label: "Declared historical 33 planes", evidenceStatus: "generator_declaration_only_historical_output_not_available", sampledZIndices: base33,
      definition: "BASE_Z_INDICES = tuple(range(0, 1520, 49)) + (1566,) in the fixed generator; corroborated by previous-33-grid provenance. No independent archived 33-plane payload was found or reconstructed.", evidenceLocators: ["tools/build_atlas_reference.py#BASE_Z_INDICES", "docs/SPATIAL_ASSET_PROVENANCE.md#previous-33-plane-research-grid"] },
    { id: "current_38", label: "Current 38 planes", evidenceStatus: "actual_current_plane_assets_verified", sampledZIndices: current.sampledZIndices,
      definition: "Exact current sampledZIndices and 38 checksummed slice PNGs; includes the five declared source-state repair indices.", evidenceLocators: [`${CURRENT_DIRECTORY}/asset-manifest.json#/sampledZIndices`] },
    { id: "nested_midpoint_75", label: "Declared denser 75 planes", evidenceStatus: "new_declared_counting_strategy_no_slice_assets_emitted", sampledZIndices: buildNestedMidpointSampling(current.sampledZIndices, SHAPE[0]),
      definition: "Keep all 38 current indices and insert floor((left + right) / 2) in each of their 37 adjacent gaps. Analyze source counts only; no PNG, interpolation or geometry output.", evidenceLocators: ["app/atlas-sampling-sensitivity.js#buildNestedMidpointSampling"] },
  ];
  const results = analyzeSourceSampling({ depth: SHAPE[0], runs, labels, strategies });
  requireContract(equal(results.map((result) => result.coveredStateCount), [15, 27, 32, 32]) &&
    results.every((result) => result.totals.fullSourceVoxelCount === native.totals.sourceVoxelCount), "Pinned grid/state or full label count expectation changed");
  return {
    schemaVersion: "ohri.atlas-sampling-sensitivity.v1", assetId: "allen_cord_20um:3.0:source-local-sampling-sensitivity-v1", queueItem: "UPG-026",
    generator: "tools/build_atlas_sampling_sensitivity.mjs", geometryStatus: "INF", measurementUse: "forbidden", registrationCount: 0,
    scope: "Same pinned native annotation only. Source-state and direct-label voxel coverage; no geometry comparison, precision claim, independent biological validation or registration.",
    source: {
      atlas: "allen_cord_20um", atlasVersion: "3.0", annotationComponent: native.sourceVolume.component, coordinateSpaceId: native.coordinateSpaceId,
      sourceManifestSha256: SOURCE_MANIFEST_SHA256, semanticSha256: SEMANTIC_SHA256, semanticHashAlgorithm: native.sourceVolume.semanticHashAlgorithm,
      shapeZyx: SHAPE, resolutionUmZyx: [20, 10, 10], orientation: "asr", sourceStateRunCount: runs.length,
      directLabelCount: labels.length, fullSourceVoxelCount: native.totals.sourceVoxelCount, stateRuns: runs,
      inputEncoding: "existing_pinned_lossless_native_annotation_row_rle", sourceSemanticReverified: true,
      rawZarrObjectInventoryReverified: false,
      rawZarrMissingReason: "Original compressed Zarr cache is unavailable locally. The full semantic digest is recomputed from the 73 existing lossless mask assets; the historical compressed-object tree receipt is not freshly reverified.",
      citation: native.citation, license: native.license,
    },
    metricDefinitions: {
      stateCoverage: "Number of contiguous source annotation-state runs containing at least one selected native z index, divided by 32. Runs are not spinal segments or independent specimens.",
      representedStateVoxelCoverage: "For each covered state, sum its exact label plane voxel count times the full state z-run length, divided by the full direct-label source voxel count. Identical source masks repeat within each hash-verified run; no interpolation is used.",
      sampledVoxelCoverage: "Sum label voxels on the distinct selected planes only, divided by all direct-label voxels across 1567 native planes. This is sampled budget coverage and is not reconstruction accuracy.",
      labelPresence: "A label present in the fixed source but absent from the selected planes is source_present_but_not_sampled, never biologically absent. Parent-only identifiers are excluded from direct voxel denominators.",
    },
    gates: { independentBiologicalError: "not_estimated", geometryComparison: "closed", precision: "closed", registration: "closed", anatomicalInterpolation: "closed", historical33Output: "not_available_generator_declaration_only" },
    strategies: results,
    inputReceipts: receipts,
  };
}

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--check") || args.length > 1) throw new Error("Only --check is supported; source paths and output are fixed");
const report = await buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (args.includes("--check")) {
  if (await readFile(resolve(ROOT, OUTPUT), "utf8") !== serialized) throw new Error("Sampling sensitivity output differs; regenerate the fixed output");
} else await writeFile(resolve(ROOT, OUTPUT), serialized);
console.log(`${args.includes("--check") ? "Verified" : "Built"} ${OUTPUT}: ${report.strategies.map((strategy) => `${strategy.sampledPlaneCount} planes ${strategy.coveredStateCount}/32 states`).join(", ")}; source semantic SHA-256 verified.`);
