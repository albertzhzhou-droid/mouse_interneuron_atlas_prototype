#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CENSUS_PATH = "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json";
const ASSET_MANIFEST_PATH = "public/data/neuromorpho_release_8_6_124_census_v1/asset-manifest.json";
const OUTPUT_PATH = "data/neuromorpho-census-main-scene-index-0.1.json";
const EXPECTED_CENSUS_SHA256 = "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364";
const EXPECTED_ASSET_MANIFEST_SHA256 = "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

export async function buildNeuromorphoCensusMainSceneIndex01() {
  const censusBytes = await readFile(path.join(ROOT, CENSUS_PATH));
  const assetManifestBytes = await readFile(path.join(ROOT, ASSET_MANIFEST_PATH));
  const censusSha256 = sha256(censusBytes);
  const assetManifestSha256 = sha256(assetManifestBytes);
  if (censusSha256 !== EXPECTED_CENSUS_SHA256) throw new Error("Pinned 8.6.124 census index changed");
  const census = JSON.parse(censusBytes.toString("utf8"));
  const assetManifest = JSON.parse(assetManifestBytes.toString("utf8"));
  if (assetManifestSha256 !== EXPECTED_ASSET_MANIFEST_SHA256) throw new Error(`Pinned 8.6.124 asset manifest changed (${assetManifestSha256})`);
  if (census.release !== "8.6.124" || census.records?.length !== 142 || assetManifest.admittedGeometryCount !== 142) {
    throw new Error("Pinned 8.6.124 adult mouse spinal-interneuron query scope changed");
  }

  const manifestFiles = new Map(assetManifest.files.map((file) => [file.path, file]));
  const records = census.records.map((record) => {
    const metadata = record.normalizedMetadata;
    const computed = record.morphometrics?.computed ?? {};
    const geometryFile = manifestFiles.get(record.geometry?.path);
    if (!record.geometry?.available || record.qc?.status !== "passed" || !geometryFile) {
      throw new Error(`NMO ${record.neuronId} is not a pinned, QC-passed census geometry`);
    }
    if (geometryFile.neuronId !== record.neuronId
      || geometryFile.bytes !== record.geometry.bytes
      || geometryFile.sha256 !== record.geometry.sha256
      || geometryFile.kind !== "lazy_geometry") {
      throw new Error(`NMO ${record.neuronId} census geometry receipt disagrees with asset manifest`);
    }
    const labels = metadata.cellType.map(String);
    if (!labels.length || labels[0].toLowerCase() !== "interneuron") {
      throw new Error(`NMO ${record.neuronId} no longer carries the source query's primary interneuron label`);
    }
    return {
      neuronId: record.neuronId,
      assetId: record.assetId,
      sourceMetadata: {
        name: metadata.name,
        archive: metadata.archive,
        species: Array.isArray(metadata.species) ? metadata.species : [metadata.species],
        lifeStage: metadata.lifeStage,
        regionLabels: metadata.brainRegion,
        cellTypeLabels: labels,
        strain: Array.isArray(metadata.strain) ? metadata.strain : [metadata.strain],
        sex: Array.isArray(metadata.gender) ? metadata.gender : [metadata.gender],
        condition: Array.isArray(metadata.experimentCondition) ? metadata.experimentCondition : [metadata.experimentCondition],
        domain: metadata.domain,
        physicalIntegrity: metadata.physicalIntegrity,
        attributes: metadata.attributes,
        dimensionality: metadata.dimensionality,
        sourceDiameterAvailable: metadata.sourceDiameterAvailable,
        sourceFrame: metadata.sourceFrame,
        registrationStatus: metadata.registrationStatus,
        numericAge: record.missingness?.numericAge ?? { value: null, missingReason: "not reported" },
        specimenId: record.missingness?.specimenId ?? { value: null, missingReason: "not available" },
        donorId: record.missingness?.donorId ?? { value: null, missingReason: "not available" },
      },
      sourcePaper: {
        pmids: record.sourcePaper.pmids,
        dois: record.sourcePaper.dois,
      },
      geometry: {
        path: `/data/neuromorpho_release_8_6_124_census_v1/${record.geometry.path}`,
        bytes: record.geometry.bytes,
        sha256: record.geometry.sha256,
        rawSwcSha256: record.geometry.rawSwcSha256,
        dimensionality: metadata.dimensionality,
        sourceDiameterAvailable: metadata.sourceDiameterAvailable,
        nodeCount: computed.nodeCount,
        segmentCount: computed.segmentCount,
        nodeTypeCounts: computed.nodeTypeCounts,
        radiusEvidence: computed.radiusDerived?.value ?? null,
      },
      quality: {
        status: record.qc.status,
        zeroLengthEdgeCount: computed.zeroLengthEdgeCount,
        registrationCount: 0,
        independentAnimalCount: null,
        independentSpecimenCount: null,
      },
    };
  }).sort((left, right) => left.neuronId - right.neuronId);

  const secondaries = records.map((record) => record.sourceMetadata.cellTypeLabels[1] ?? null);
  const dimensionCounts = records.reduce((counts, record) => {
    counts[record.geometry.dimensionality] = (counts[record.geometry.dimensionality] ?? 0) + 1;
    return counts;
  }, {});
  const typeCounts = secondaries.reduce((counts, label) => {
    const key = label ?? "Not Reported";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  return {
    documentType: "neuromorpho_census_main_scene_index",
    schemaVersion: "0.1.0",
    contractId: "neuromorpho-census-main-scene-index-0.1",
    releaseId: "ohri-neuromorpho-census-main-scene-index-0.1.0",
    source: {
      repository: "NeuroMorpho.Org",
      repositoryRelease: census.release,
      assetSetId: census.assetSetId,
      querySnapshotUrl: census.snapshot.queryUrl,
      queryRecordCount: census.summary.queryRecordCount,
      censusIndex: { path: CENSUS_PATH, bytes: censusBytes.byteLength, sha256: censusSha256 },
      assetManifest: { path: ASSET_MANIFEST_PATH, bytes: assetManifestBytes.byteLength, sha256: assetManifestSha256 },
      rights: census.rights,
    },
    purpose: "Provide one checksum-gated source-local main-scene morphology record for each already-admitted frozen census member. This derived index contains metadata and asset receipts only; it does not duplicate or alter any geometry payload.",
    summary: {
      censusRecordCount: records.length,
      admittedGeometryCount: records.filter((record) => record.quality.status === "passed").length,
      sourceReportedDimensionalityCounts: dimensionCounts,
      sourceReportedSecondaryCellClassCounts: typeCounts,
      sourceDiameterAvailableCount: records.filter((record) => record.geometry.sourceDiameterAvailable).length,
      sameSpecimenInternalStructureCount: 0,
      renderedInternalPrimitiveCount: 0,
      crossSourceIdentityCount: 0,
      registrationCount: 0,
      censusExpansionCount: 0,
    },
    scientificBoundary: {
      membership: "The 142 rows are records returned by the pinned NeuroMorpho query; they are not independent animals, a population-frequency denominator, or evidence of biological completeness.",
      labels: "Cell-class labels are preserved as repository wording. Query membership and labels do not establish a paper-verified subtype or a relationship to another molecular/profile record.",
      geometry: "Each displayed shape is the exact checksum-verified standardized SWC in its own unregistered source-local frame. The two source-labelled 2D records remain planar source inputs, not reconstructed 3D cells.",
      unavailable: ["same-specimen membrane", "nucleus", "organelles", "synaptic boutons", "receptor distribution", "ultrastructure", "complete biological axon"],
    },
    records,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const value = await buildNeuromorphoCensusMainSceneIndex01();
    const bytes = Buffer.from(stableJson(value));
    const output = path.join(ROOT, OUTPUT_PATH);
    if (flag === "--write") await writeFile(output, bytes);
    else if (!(await readFile(output)).equals(bytes)) throw new Error("NMO census main-scene index is stale");
    process.stdout.write(`${JSON.stringify({ contractId: value.contractId, records: value.summary.censusRecordCount, geometry: value.summary.admittedGeometryCount, dimensions: value.summary.sourceReportedDimensionalityCounts, sha256: sha256(bytes) })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
