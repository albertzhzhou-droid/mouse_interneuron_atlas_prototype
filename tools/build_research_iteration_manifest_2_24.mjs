#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildResearchIterationManifest223 } from "./build_research_iteration_manifest_2_23.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.24.json");
const ADDITIONAL_INPUTS = Object.freeze([
  {
    id: "grpDorsalHornObservedMorphologyContract",
    scope: "project",
    path: "data/grp-dorsal-horn-observed-morphology-0.1.json",
    purpose: "Independent checksum-pinned NMO 109021 GRP dorsal-horn morphology route",
  },
  {
    id: "neuromorphoCensusIndex",
    scope: "project",
    path: "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json",
    purpose: "Full 142-record NeuroMorpho census containing the already-admitted NMO 109021 child",
  },
  {
    id: "neuromorphoCensusAssetManifest",
    scope: "project",
    path: "public/data/neuromorpho_release_8_6_124_census_v1/asset-manifest.json",
    purpose: "Full census SWC and lazy-geometry asset receipts",
  },
  {
    id: "evidenceAware3dRepresentationContract",
    scope: "project",
    path: "data/evidence-aware-3d-representation-contract-0.1.json",
    purpose: "Nine-state, seven-route evidence-aware rendering authority contract",
  },
  {
    id: "zeroPrimitiveInternalReferenceContract",
    scope: "project",
    path: "data/cross-region-internal-reference-0.1.json",
    purpose: "Cross-region vocabulary audit whose missing object-level geometry produces zero primitives",
  },
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function buildResearchIterationManifest224() {
  const base = await buildResearchIterationManifest223();
  const additionalBytes = await Promise.all(ADDITIONAL_INPUTS.map((input) => readFile(path.join(PROJECT_ROOT, input.path))));
  const [grp, census, censusManifest, representation, internalReference] = additionalBytes.map((bytes) => JSON.parse(bytes.toString("utf8")));
  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.24.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.24.0";
  manifest.application.version = "2.24.0-research.1";
  manifest.baseResearchRelease.note = "The seven SCI evidence entities and five legacy observed-cell exemplars remain unchanged. Iteration 2.24 admits one independent NMO 109021 GRP dorsal-horn route and a nine-state evidence-aware rendering contract. The 142-record census is not expanded. Missing same-specimen internal geometry renders zero primitives; no cross-source identity or registration is created.";
  ADDITIONAL_INPUTS.forEach((input, index) => {
    manifest.authoritativeInputs.push({
      ...input,
      bytes: additionalBytes[index].byteLength,
      sha256: sha256(additionalBytes[index]),
    });
  });
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;
  manifest.exactReferences.grpDorsalHornObservedMorphology = {
    contractId: grp.contractId,
    contractReleaseId: grp.releaseId,
    routeId: grp.routeId,
    authority: grp.authority,
    sourceRepository: grp.sourceRecord.repository,
    sourceRepositoryRelease: grp.sourceRecord.repositoryRelease,
    neuronId: grp.sourceRecord.neuronId,
    assetId: grp.sourceRecord.assetId,
    species: grp.sourceRecord.species,
    sourceLabels: grp.sourceRecord.cellTypeLabels,
    physicalIntegrity: grp.sourceRecord.physicalIntegrity,
    slicingThicknessMicrometre: grp.sourceRecord.slicingThicknessMicrometre,
    nodeCount: grp.geometryReceipt.nodeCount,
    segmentCount: grp.geometryReceipt.segmentCount,
    axonNodeCount: grp.geometryReceipt.nodeTypeCounts["2"],
    swcBytes: grp.sourceObjects.swc.bytes,
    swcSha256: grp.sourceObjects.swc.sha256,
    geometryBytes: grp.sourceObjects.geometry.bytes,
    geometrySha256: grp.sourceObjects.geometry.sha256,
    legacyExemplarCount: 5,
    censusRecordCount: census.summary.queryRecordCount,
    censusManifestFileCount: censusManifest.files.length,
    completeAxonClaim: false,
    membraneClaim: false,
    internalPrimitiveCount: grp.renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount,
    crossSourceIdentityCount: grp.identityBoundary.crossSourceIdentityCount,
    projectRegistrationCount: grp.identityBoundary.projectRegistrationCount,
  };
  manifest.exactReferences.evidenceAware3dRepresentation = {
    contractId: representation.contractId,
    contractReleaseId: representation.releaseId,
    representationStateCount: representation.representationStates.length,
    routeCount: representation.routes.length,
    runtimeMetadataRequirements: representation.runtimeMetadataRequirements,
    internalReferenceStateIds: representation.routes.find((route) => route.routeId === "internal_reference").representationStateIds,
    internalReferenceRenderedPrimitivePolicy: representation.routes.find((route) => route.routeId === "internal_reference").renderedPrimitivePolicy,
    proceduralBiologicalProxyAllowed: false,
    missingLayerPrimitiveCount: internalReference.renderedPrimitiveCount,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  };
  manifest.scientificBoundaries.grpDorsalHornObservedMorphology = "NMO 109021 is an independent GRP::eGFP reporter-positive adult-mouse dorsal-horn source-local reconstruction. Moderate integrity and a 300 micrometre parasagittal slice cannot establish a complete arbor. Twelve original soma contours were averaged into twelve SWC points. The radius derivative is not membrane; no SCI entity, molecular profile, atlas placement, internal structure, synapse, cross-source identity or registration is admitted.";
  manifest.scientificBoundaries.evidenceAware3dRepresentation = "Every active route distinguishes observed raw texture, segmented surface, skeleton, source point, deterministic radius derivative, inferred reference geometry, schematic path, synthetic data glyph and unavailable object geometry. Missing object geometry yields zero primitives; procedural cell and organelle proxies are prohibited.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return manifest;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const manifest = await buildResearchIterationManifest224();
  if (process.argv.includes("--write")) await writeFile(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, inputCount: manifest.integrity.inputCount, manifestContentSha256: manifest.manifestContentSha256, wrote: process.argv.includes("--write") }, null, 2)}\n`);
}
